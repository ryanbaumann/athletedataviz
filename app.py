import os
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
     render_template, abort, session, send_from_directory, Response
from flask.ext.sqlalchemy import SQLAlchemy
from flask_debugtoolbar import DebugToolbarExtension
import json
import stravalib
import stravaParse_v2 as sp
import psycopg2
from sqlalchemy import create_engine
import json
import logging

#################
# configuration #
#################

app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], convert_unicode=True)
#toolbar = DebugToolbarExtension(app)
from models import *

##########
# routes #
##########     

@app.route('/', methods=['GET', 'POST'])
def homepage():
    global client, athlete
    errors = []
    #Check if the user is logged in, otherwise forward them to the login page
    if 'access_token' not in session:
        return redirect(url_for('login'))

    #Render the homepage with the user's Strava access token
    if request.method == 'GET':
        client = stravalib.client.Client(access_token=session['access_token'])
        athlete = client.get_athlete()
        #Add athlete ID to the session
        session['ath_id'] = athlete.id
        session['act_limit'] = 1
        #Save the results to the database
        try:
            #Check if the athlete already exists in the db
            existing_athlete = Athlete.query.filter_by(ath_id=athlete.id).first()
            
            if not existing_athlete:
                print "new athlete - adding to db!"
                new_athlete = Athlete(data_source='strava',
                                      ath_id=athlete.id,
                                      api_code=session['access_token'],
                                      first_name=athlete.firstname,
                                      last_name=athlete.lastname)
                db.session.add(new_athlete)
            
            else:
                print "athlete already in db - updating existing record"
                existing_athlete.api_code = session['access_token']
                existing_athlete.last_updated_datetime_utc = str(datetime.utcnow().strftime('%Y/%m/%d %H:%M:%S'))

            #Commit the update or new row insertion
            db.session.commit()
        except:
            errors.append("Unable to add or update athlete in database.")
            print errors

        return render_template('main.html', act_limit=session.get('act_limit', 1),
                                            athlete=athlete, 
                                            client=client)

    #Get the user number of activities to query
    if request.method == 'POST':
        try:
            client = stravalib.client.Client(access_token=session['access_token'])
            athlete = client.get_athlete()
            act_limit = int(request.form.get('act_limit', 1))
            session['act_limit'] = act_limit
            print "act limit updated to : " + str(act_limit)
        except:
            act_limit = 1
            flash("Please enter a valid integer between 1 and 100")
        #Tell the user that the value has been updated    
        flash("Activity limit updated to %s!" %(str(act_limit)))
        return render_template('main.html', act_limit=session.get('act_limit', 1),
                                            athlete=athlete, 
                                            client=client)

@app.route('/login')
def login():
    client = stravalib.client.Client()
    #Check port configuration for dev vs. deployed environments
    if str(app.config['PORT']) == '':
        redirect_uri = r'http://' + app.config['HOST_NAME'] + '/auth'
    else:
        redirect_uri = r'http://' + app.config['HOST_NAME'] + ':' + str(app.config['PORT']) + '/auth'

    auth_url = client.authorization_url(client_id=app.config['STRAVA_CLIENT_ID'],
            redirect_uri= redirect_uri)
    return render_template('login.html', auth_url=auth_url)

@app.route('/logout')
def logout():
    """ End a users session and return them to the homepage """
    session.pop('access_token')
    return redirect(url_for('homepage'))

@app.route('/update')
def update():
    return render_template('update.html')

@app.route('/auth')
def auth_done():
    """ Authenticate a user with the Strava api and obtain a token """
    try:
        code = request.args.get('code')
    except:
        print 'Code not found, redirecting to authentication page!'
        return redirect(url_for('homepage'))

    client = stravalib.client.Client()

    try:
        token = client.exchange_code_for_token(
                client_id=app.config['STRAVA_CLIENT_ID'],
                client_secret=app.config['STRAVA_CLIENT_SECRET'],
                code = code)
    except:
        print 'error exchanging token with Strava API!'
        return redirect(url_for('homepage'))

    session['access_token'] = token
    return redirect(url_for('homepage'))

@app.route('/stravaData', methods=['GET'])
def strava_activity_download():
    """
    Get strava activities and store the stream data in the database.
    Then return the user to a webpage with a preview of the data.
    """
    
    if request.method == 'GET':
        #Get the activity limit from the HTTP request parameters
        try:
            act_limit = int(request.args.get('act_limit'))
        except:
            print 'Act limit not found! - Initializing to 20'
            act_limit = int(20)

        #Get a client
        client = stravalib.client.Client(access_token=session['access_token'])
        types = ['latlng', 'time', 'distance', 'velocity_smooth', 'altitude', 'grade_smooth',
                  'watts', 'temp', 'heartrate', 'cadence', 'moving']
        resolution = 'medium'
        #Get a list of activities, compare to what's in the DB, return only activities not in DB items
        acts_list = sp.GetActivities(client, act_limit)
        #Return a list of already cached activities in the database
        print 'ath_id is ' + str(session['ath_id'])
        acts_dl_list = []
        for act in Activity.query.filter_by\
                   (ath_id=int(session['ath_id'])).with_entities(Activity.act_id).all():
            acts_dl_list += act

        #Now loop through each activity if it's not in the list and download the stream
        for act in acts_list:
            print "checking act id: " + str(act.id)
            if act.id not in acts_dl_list:
                #try:
                    #Add results to dictionary
                df = sp.ParseActivity(client, act, types, resolution)
                if not df.empty:
                    print "cleaning data..."
                    df = sp.cleandf(df)
                    print "activities parsed!  Returning dataframe"
                else:
                    print "no new data to clean"

                print "okay, now inserting into the database!"

                new_act = Activity(ath_id=session['ath_id'],
                                      act_id=act.id,
                                      act_type=act.type,
                                      act_name=act.name,
                                      act_description=act.description,
                                      act_startDate=act.start_date_local,
                                      act_dist=act.distance,
                                      act_totalElevGain=act.total_elevation_gain,
                                      act_avgSpd=act.average_speed,
                                      act_calories=act.calories
                                      )
                flash("processing activities... " + act.name)
                db.session.add(new_act)
                db.session.commit()
                print "successfully added activity to db!"

                #Write stream dataframe to db
                df.to_sql('Stream', engine,
                      if_exists='append',
                      index=False)

                print "Successfully added stream to db!"


                #except:
                #    print "error entering activity or stream data into db!"

        uploads = app.config['UPLOAD_FOLDER']
        now = datetime.now()
        athlete = client.get_athlete()
        base_filename = athlete.lastname + '_' + athlete.firstname + \
                    '_Data_' + str(datetime.now().strftime('%Y%m%d%H%M%S'))
        path_to_geojsonfile = app.config['UPLOAD_FOLDER'] + '/' + base_filename + '.geojson'
        session['geojson_file'] = path_to_geojsonfile      
        path_to_csvfile = uploads + '/'  + base_filename + '.csv'
        path_to_zipfile = uploads + '/' + base_filename + '.zip'
        path_to_geojsonfile = uploads + '/' + base_filename + '.geojson'
        view_name = '"V_Stream_LineString"'
        print "generating geojson file..."
        sp.to_geojson(engine, view_name, path_to_geojsonfile)
        print base_filename
        print 'geojson file is : ' + path_to_geojsonfile
        return render_template('stravaData.html',
                               data =  '<div> </div>', #preview.to_html()
                               zip_file = base_filename + '.zip',
                               geojson_file = path_to_geojsonfile) #base_filename + '.geojson')

"""
@app.route('/uploads/<path:filename>')
def download_strava():
    try:
        filename = request.args.get('filename')
    except:
        print 'filename not found, redirecting to data page!'
        return redirect(url_for('strava_activity_download'))
    
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename, as_attachment=True)
"""
@app.route('/strava_mapbox')
def strava_mapbox():
    filename = request.args.get('filename')
    file_path = filename
    print "geojson file path is : " + file_path
    with open(file_path, 'r') as f:
        geojson_data = json.load(f)

    return render_template('strava_mapbox.html', 
                            geojson_data = json.dumps(geojson_data))

@app.route('/delete_acts', methods=['POST'])
def delete_acts():
    """Delete all activities from the user currently logged in"""
    if request.method == 'POST':
        client = stravalib.client.Client(access_token=session['access_token'])
        athlete = client.get_athlete()
        #try:
        print "deleting all activities from current athlete ..."
        acts_dl_list = []
        for act in Activity.query.filter_by\
                   (ath_id=int(session['ath_id'])).with_entities(Activity.act_id).all():
            acts_dl_list += act
        for act in acts_dl_list:
            flash("deleting activity " + str(act))
            #Delete the stream     
            Stream.query.filter_by(act_id=act).delete(synchronize_session='evaluate')
            #Delete the activity 
            Activity.query.filter_by(act_id=act).delete(synchronize_session='evaluate')

        print "deleted activities from ath_id = " + str(session['ath_id'])
        #except:
        #    print "error reading arguments from delete reuqest form!"

        return render_template('stravaData.html', 
                                        act_limit=session.get('act_limit', 1),
                                        athlete=athlete, 
                                        client=client)

@app.errorhandler(404)
def page_not_found(error):
    return render_template('page_not_found.html'), 404

@app.errorhandler(500)
def internal_error(exception):
    app.logger.exception(exception)
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(port=int(app.config['PORT']))