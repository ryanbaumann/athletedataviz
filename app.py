import os
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
     render_template, abort, session, send_from_directory, Response
from flask.ext.sqlalchemy import SQLAlchemy
import json
import stravalib
import stravaParse as sp
import psycopg2
from sqlalchemy import create_engine
import json

#################
# configuration #
#################

app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)

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

        session['table_name'] = athlete.lastname + '_' + athlete.firstname
        base_filename = athlete.lastname + '_' + athlete.firstname + \
                    '_Data_' + str(datetime.now().strftime('%Y%m%d%H%M%S'))
        path_to_geojsonfile = app.config['UPLOAD_FOLDER'] + '/' + base_filename + '.geojson'
        session['geojson_file'] = path_to_geojsonfile
        return render_template('main.html', act_limit=session.get('act_limit', 1),
                                            athlete=athlete, 
                                            client=client,
                                            errors=errors)

    #Get the user number of activities to query
    if request.method == 'POST':
        try:
            act_limit = int(request.form.get('act_limit', 1))
        except:
            act_limit = 1
            flash("Please enter a valid integer between 1 and 100")
        session['act_limit'] = act_limit
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

@app.route('/stravaData')
def strava_activity_download():

    client = stravalib.client.Client(access_token=session['access_token'])
    types = ['time', 'distance', 'latlng', 'altitude', 'velocity_smooth', 'grade_smooth']
    limit = 50
    uploads = app.config['UPLOAD_FOLDER']
    now = datetime.now()
    athlete = client.get_athlete()
    base_filename = athlete.lastname + '_' + athlete.firstname + \
                    '_Data_' + str(now.strftime('%Y%m%d%H%M%S'))

    path_to_csvfile = uploads + '/'  + base_filename + '.csv'
    path_to_zipfile = uploads + '/' + base_filename + '.zip'
    path_to_geojsonfile = uploads + '/' + base_filename + '.geojson'

    #Get data and write to database... 
    flash("please wait, getting your data.  Can take up to 2 mins the first time you visit the site")
    df, preview, no_new_data = sp.fully_process_acts(client, limit, types, 
                                        path_to_csvfile, path_to_zipfile, 
                                        engine, session['table_name'])

    view_name = sp.df_to_postgis_db(df, engine, session['table_name'], no_new_data)
    session['view_name'] = view_name
    print "generating geojson file..."
    sp.to_geojson(engine, view_name, path_to_geojsonfile)
    return render_template('stravaData.html',
                           data = preview.to_html(),
                           zip_file = base_filename + '.zip',
                           geojson_file = base_filename + '.geojson')

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

@app.route('/strava_mapbox')
def strava_mapbox():
    filename = request.args.get('filename')
    file_path = app.config['UPLOAD_FOLDER'] + '/' + filename
    print "geojson file path is : " + file_path
    with open(file_path, 'r') as f:
        geojson_data = json.load(f)

    return render_template('strava_mapbox.html', 
                            geojson_data = json.dumps(geojson_data))

@app.errorhandler(404)
def page_not_found(error):
    return render_template('page_not_found.html'), 404

@app.errorhandler(500)
def internal_error(exception):
    app.logger.exception(exception)
    return render_template('500.html'), 500
"""
if __name__ == '__main__':
    app.run(port=int(app.config['PORT']))