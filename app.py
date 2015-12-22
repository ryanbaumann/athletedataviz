import os
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
    render_template, session,  jsonify
from flask_restful import Resource, Api
from flask.ext.sqlalchemy import SQLAlchemy
import stravalib
import stravaParse_v2 as sp
from sqlalchemy import create_engine
import json
from celery import Celery
from flask.ext.compress import Compress
from flask.ext.cache import Cache
from flask_sslify import SSLify
from celery.exceptions import SoftTimeLimitExceeded
#################
# configuration #
#################
compress = Compress()
cache = Cache()

app = Flask(__name__)
api = Api(app)
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)
engine = create_engine(
    app.config['SQLALCHEMY_DATABASE_URI'], convert_unicode=True)
app.config['CELERY_BROKER_URL'] = os.environ['REDIS_URL']
app.config['CELERY_RESULT_BACKEND'] = os.environ['REDIS_URL']
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)
compress.init_app(app)
cache.init_app(app)
if 'DYNO' in os.environ:
    sslify = SSLify(app)
from models import *
BASEPATH = app.config['HEADER'] + app.config['HOST_NAME'] + r'/'

##########
#  API   #
##########

class Heat_Points(Resource):

    def get(self, ath_id):
        heatpoints = json.loads(
            sp.get_heatmap_points(engine, int(ath_id)))['points']
        heatpoints = json.dumps(heatpoints)
        return heatpoints


class Heat_Lines(Resource):

    def get(self, ath_id):
        geojsonlines = sp.to_geojson_data(
            engine, '"V_Stream_LineString"', int(session['ath_id']))
        return geojsonlines
        # We can have PUT,DELETE,POST here if needed
        #
api.add_resource(Heat_Points, '/heat_points/<int:ath_id>')
api.add_resource(Heat_Lines, '/heat_lines/<int:ath_id>')

##########
# routes #
##########


@app.route('/', methods=['GET', 'POST'])
def homepage():
    """
    Render the AthleteDataViz homepage.
    Homepage is only viewable if user has been logged in (token in session)
    Otherwise the user will be redirected to the /login.html render_template
    """

    global client, athlete
    errors = []

    # Check if the user is logged in, otherwise forward them to the login page
    if 'access_token' not in session:
        return redirect(url_for('login'))

    # Render the homepage with the user's Strava access token
    if request.method == 'GET':
        client = stravalib.client.Client(access_token=session['access_token'])
        athlete = client.get_athlete()
        # Add athlete ID to the session
        session['ath_id'] = athlete.id
        session['act_limit'] = int(session.get('act_limit', 10))
        # Save the results to the database
        try:
            # Check if the athlete already exists in the db
            existing_athlete = Athlete.query.filter_by(
                ath_id=athlete.id).first()

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
                existing_athlete.last_updated_datetime_utc =\
                    str(datetime.utcnow().strftime('%Y/%m/%d %H:%M:%S'))
            # Commit the update or new row insertion
            db.session.commit()
            db.session.close()
        except:
            errors.append("Unable to add or update athlete in database.")
            print errors
        try:
            act_data = sp.get_acts_html(engine, int(session['ath_id']))
            act_count = len(act_data.index)
        except:
            print "error getting current activity list from DB!"

        return render_template('main.html',
                               act_limit=int(session.get('act_limit', 1)),
                               act_list_html=act_data,
                               act_count=act_count,
                               athlete=athlete)


@app.route('/act_limit', methods=['POST'])
def act_input():
    """Get the user number of activities to query"""
    if request.method == 'POST':
        try:
            act_limit = request.form.get('act_limit', 10)
            session['act_limit'] = act_limit
            print "act limit updated to : " + str(act_limit)
        except:
            act_limit = 1
            flash("Please enter a valid integer between 1 and 100")
        # Tell the user that the value has been updated
        flash("Activity limit updated to %s!" % (str(act_limit)))
        cache.clear()
        return redirect(url_for('homepage', act_limit=act_limit))


@app.route('/login')
def login():
    client = stravalib.client.Client()
    # Check port configuration for dev vs. deployed environments
    if str(app.config['PORT']) == '':
        redirect_uri = r'http://' + app.config['HOST_NAME'] + '/auth'
    else:
        redirect_uri = r'http://' + \
            app.config['HOST_NAME'] + ':' + str(app.config['PORT']) + '/auth'

    auth_url = client.authorization_url(
        client_id=app.config['STRAVA_CLIENT_ID'],
        redirect_uri=redirect_uri)
    return render_template('login.html', auth_url=auth_url)


@app.route('/logout')
def logout():
    """ End a users session and return them to the homepage """
    session.pop('access_token')
    cache.clear()
    return redirect(url_for('homepage'))


@app.route('/contact')
def contact():
    """ Sends user to contact page """
    return render_template('contact.html')


@app.route('/about')
def about():
    """ Sends user to contact page """
    return render_template('about.html')


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
            code=code)
    except:
        print 'error exchanging token with Strava API!'
        return redirect(url_for('homepage'))

    session['access_token'] = token
    return redirect(url_for('homepage'))

"""@app.route('/uploads/<path:filename>')
def download_strava():
    try:
        filename = request.args.get('filename')
    except:
        print 'filename not found, redirecting to data page!'
        return redirect(url_for('strava_activity_download'))
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename, as_attachment=True)"""


@app.route('/strava_mapbox')
@cache.cached(timeout=50)
def strava_mapbox():
    """
    A function to get the data for vizualization from the database,
    and return the template for the user's vizualization (map)
    """
    # First get the map extents so we can draw a point at the center
    try:
        avg_long, avg_lat = sp.get_acts_centroid(
            engine, int(session['ath_id']))
    except:
        print "error retrieving map extents!"

    return render_template('strava_mapbox_gl_v3.html',
                           avg_lat=avg_lat,
                           avg_long=avg_long,
                           mapbox_gl_accessToken=app.config[
                               'MAPBOX_GL_ACCESS_TOKEN'],
                           mapbox_accessToken=app.config[
                               'MAPBOX_ACCESS_TOKEN'],
                           heatpoint_url=BASEPATH +
                           'heat_points/' + str(session['ath_id']),
                           heatline_url=BASEPATH +
                           'heat_lines/' + str(session['ath_id']))


@app.route('/delete_acts', methods=['POST'])
def delete_acts():
    """Delete all activities from the user currently logged in"""
    if request.method == 'POST':
        try:
            print "deleting all activities from current athlete ..."
            acts_dl_list = []
            for act in Activity.query.filter_by(
                    ath_id=int(session['ath_id'])).with_entities(
                    Activity.act_id).all():
                acts_dl_list += act
            for act in acts_dl_list:
                # Delete the stream
                Stream.query.filter_by(act_id=act).delete(
                    synchronize_session='evaluate')
                # Delete the activity
                Activity.query.filter_by(act_id=act).delete(
                    synchronize_session='evaluate')

            db.session.commit()
            print "deleted activities from ath_id = " + str(session['ath_id'])
            flash("deleted all activities for " + str(athlete.firstname) +
                  " " + str(athlete.lastname))
            db.session.close()
        except:
            print "error reading arguments from delete reuqest form!"

        return redirect(url_for('homepage'))


@app.errorhandler(404)
def page_not_found(error):
    return render_template('page_not_found.html'), 404


@app.errorhandler(500)
def internal_error(exception):
    app.logger.exception(exception)
    return render_template('500.html'), 500


@celery.task(name='long_task.add', bind=True)
def long_task(self, act_limit, ath_id, types, access_token, resolution):
    """
    A celery task to update the Strava rides into the AthleteDataViz database
    """
    try:
        self.update_state(state='PROGRESS',
                          meta={'current': 0.01, 'total': 1,
                                'status': 'Starting Job - Getting Activities from Strava!'})
        client = stravalib.client.Client(access_token=access_token)

        # Get a list of activities, compare to what's in the DB, return only
        # activities not in DB items
        acts_list = sp.GetActivities(client, act_limit)
        # Return a list of already cached activities in the database
        acts_dl_list = []
        for act in Activity.query.filter_by\
                (ath_id=ath_id).with_entities(Activity.act_id).all():
            acts_dl_list += act

        # Now loop through each activity if it's not in the list and download the
        # stream
        count = 0
        total = len([act for act in acts_list if act.id not in acts_dl_list])
        print "total number of acts to dl : " + str(total)
        for act in acts_list:
            if act.id not in acts_dl_list:
                count += 1
                print "downloading act id: " + str(act.id) + " : " + str(count) + " of " + str(total)

                self.update_state(state='PROGRESS',
                                  meta={'current': count, 'total': total,
                                        'status': 'Analyzing activity ' + str(act.id)})
                try:
                    # Add results to dictionary
                    df = sp.ParseActivity(client, act, types, resolution)
                    if not df.empty:
                        df = sp.cleandf(df)
                    else:
                        print "no new data to clean"

                    print "okay, now inserting into the database!"

                    new_act = Activity(ath_id=ath_id,
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

                    db.session.add(new_act)
                    db.session.commit()
                    print "successfully added activity to db!"

                    # Write stream dataframe to db
                    df.to_sql('Stream', engine,
                              if_exists='append',
                              index=False)
                    print "Successfully added stream to db!"

                except:
                    print "error entering activity or stream data into db!"
        db.session.close()
        return {'current': 100, 'total': 100, 'status': 'Task completed!',
                'result': 'View your Map!'}
    except SoftTimeLimitExceeded:
        cleanup_in_a_hurry()


@app.route('/longtask', methods=['POST'])
def longtask():
    task = long_task.delay(int(session.get('act_limit', 10)),
                           int(session['ath_id']),
                           ['latlng', 'time', 'distance', 'velocity_smooth', 'altitude',
                            'grade_smooth', 'watts', 'temp', 'heartrate', 'cadence', 'moving'],
                           session['access_token'],
                           'medium')
    return jsonify({}), 202, {'Location': url_for('taskstatus', _scheme='https',
                                                  _external=True, task_id=task.id)}


@app.route('/status/<task_id>')
def taskstatus(task_id):
    task = long_task.AsyncResult(task_id)
    if task.state == 'PENDING':
        # job did not start yet
        response = {
            'state': task.state,
            'current': 0.01,
            'total': 1,
            'status': 'starting...'
        }
    elif task.state != 'FAILURE':
        response = {
            'state': task.state,
            'current': task.info.get('current', 0),
            'total': task.info.get('total', 1),
            'status': task.info.get('status', '')
        }
        if 'result' in task.info:
            response['result'] = task.info['result']
    else:
        # something went wrong in the background job
        response = {
            'state': task.state,
            'current': 1,
            'total': 1,
            'status': str(task.info),  # this is the exception raised
        }
    return jsonify(response)

if __name__ == '__main__':
    app.run(port=int(app.config['PORT']))
