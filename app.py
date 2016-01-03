import time
import os
import base64
import hmac
import urllib
import stravalib
from hashlib import sha1
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
    render_template, session,  jsonify, Response, json
from flask_restful import Resource, Api
from flask.ext.sqlalchemy import SQLAlchemy
import stravaParse_v2 as sp
from sqlalchemy import create_engine
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
    sslify = SSLify(app, permanent=True)
from models import *
BASEPATH = app.config['HEADER'] + app.config['HOST_NAME'] + r'/'

##########
#  API   #
##########
#
def output_html(data, code, headers=None):
    resp = Response(data, mimetype='text/html', headers=headers)
    resp.status_code = code
    return resp

class Heat_Points(Resource):


    #@cache.memoize(timeout=3600, make_cache_key=)
    def get(self, ath_id):
        heatpoints = json.loads(
            sp.get_heatmap_points(engine, int(ath_id)))['points']
        heatpoints = json.dumps(heatpoints)
        return heatpoints


class Heat_Lines(Resource):

    #@cache.memoize(timeout=3600)
    def get(self, ath_id):
        geojsonlines = sp.to_geojson_data(
            engine, '"V_Stream_LineString"', int(ath_id))
        return output_html(geojsonlines, 200)


class Heat_Lines2(Resource):

    #@cache.memoize(timeout=3600)
    def get(self, ath_id):
        geojsonlines = sp.get_heatmap_lines(
            engine, int(ath_id))
        return output_html(geojsonlines, 200)


class Current_Acts(Resource):

    #@cache.memoize(timeout=3600)
    def get(self, ath_id):
        print "getting current activities..."
        try:
            act_data = sp.get_acts_html(engine, int(ath_id)).to_html(
                classes=["table table-striped",
                         "table table-condensed"])
        except:
            print "error getting current activity list from DB!"
        return act_data

api.add_resource(Heat_Points, '/heat_points/<int:ath_id>')
api.add_resource(Heat_Lines, '/heat_lines/<int:ath_id>')
api.add_resource(Heat_Lines2, '/heat_lines2/<int:ath_id>')
api.add_resource(Current_Acts, '/current_acts/<int:ath_id>')

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
                               current_act_url=BASEPATH +
                               'current_acts/' + str(session['ath_id']),
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
@cache.memoize(timeout=3600)
def login():
    client = stravalib.client.Client()
    # Check port configuration for dev vs. deployed environments
    redirect_uri = app.config['HEADER'] + app.config['HOST_NAME'] + '/auth'
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


@app.route('/products')
def products():
    """ Temporary redirect to home page until implemented """
    return redirect(url_for('homepage'))


@app.route('/blog')
def blog():
    """ Temporary redirect to home page until implemented """
    return redirect(url_for('homepage'))


@app.route('/account')
def account():
    """ Sends user to account page """
    return render_template('account.html',
                            basepath = BASEPATH)


@app.route('/sign_s3')
def sign_s3():
    # how long to keep the file on AWS S3 storage
    days_to_expire = 30
    # AWS S3 access information from environment variables
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = os.environ.get('S3_BUCKET_IMAGES')
    # Folder to store images in
    foldername = r'user/' + str(session['ath_id']) + r'/'
    # Get filename and filetype from request header in URL
    object_name = foldername + urllib.quote_plus( request.args.get('file_name'))
    mime_type = request.args.get('file_type')
    # Set expiration date of file - currently set to "days_to_expire"
    expires = int(time.time() + 60 * 60 * 24 * days_to_expire)
    amz_headers = "x-amz-acl:public-read"
    # Generate the put request to store the image on the AWS S3 bucket
    string_to_sign = "PUT\n\n%s\n%d\n%s\n/%s/%s" % (
        mime_type, expires, amz_headers, S3_BUCKET, object_name)
    print string_to_sign
    # Encode the signature to post the URL
    signature = base64.encodestring(
        hmac.new(AWS_SECRET_KEY.encode(), string_to_sign.encode('utf8'), sha1).digest())
    signature = urllib.quote_plus(signature.strip())
    print signature
    # URL for the newly stored file
    url = 'https://%s/%s' % (
        S3_BUCKET, object_name)
    # Store the image location in the database
    new_act_fact = Athlete_Fact(objecttypeid='user_image',
                                ath_id=session['ath_id'],
                                filename=request.args.get('file_name'),
                                url=url,
                                exp_datetime_utc=datetime.fromtimestamp(expires))
    db.session.add(new_act_fact)
    db.session.commit()
    db.session.close()
    # return json to the browser to finish use the image link in the browser
    content = json.dumps({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%s&Signature=%s' % (url, AWS_ACCESS_KEY, expires, signature),
        'url': url,
    })

    return content


@app.route("/submit_form/", methods=["POST"])
def submit_form():
    username = request.form["username"]
    full_name = request.form["full_name"]
    avatar_url = request.form["avatar_url"]
    update_account(username, full_name, avatar_url)
    return redirect(url_for('profile'))


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

    client = stravalib.client.Client(access_token=session['access_token'])
    athlete = client.get_athlete()

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
                           'heat_lines/' + str(session['ath_id']),
                           ath_name=athlete.firstname + "_" + athlete.lastname + '_' + datetime.utcnow().strftime('%y%m%d'))

@app.route('/testmap')
def testmap():
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

    client = stravalib.client.Client(access_token=session['access_token'])
    athlete = client.get_athlete()

    return render_template('testmap2.html',
                           avg_lat=avg_lat,
                           avg_long=avg_long,
                           mapbox_gl_accessToken=app.config[
                               'MAPBOX_GL_ACCESS_TOKEN'],
                           mapbox_accessToken=app.config[
                               'MAPBOX_ACCESS_TOKEN'],
                           heatpoint_url=BASEPATH +
                           'heat_points/' + str(session['ath_id']),
                           heatline2_url=BASEPATH +
                           'heat_lines2/' + str(session['ath_id']),
                           ath_name=athlete.firstname + "_" + athlete.lastname + '_' + datetime.utcnow().strftime('%y%m%d'))


@app.route('/delete_acts', methods=['POST'])
def delete_acts():
    """Delete all activities from the user currently logged in"""
    if request.method == 'POST':
        try:
            cache.clear()
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

@app.route('/robots.txt')
@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])


@celery.task(name='long_task.add', bind=True)
def long_task(self, startDate, endDate, act_limit, ath_id, types, access_token, resolution):
    """
    A celery task to update the Strava rides into the AthleteDataViz database
    """
    self.update_state(state='PROGRESS',
                      meta={'current': 0.01, 'total': 1,
                            'status': 'Starting Job - Getting Activities from Strava!'})
    client = stravalib.client.Client(access_token=access_token)

    # Get a list of activities, compare to what's in the DB, return only
    # activities not in DB items
    acts_list = sp.GetActivities(client, startDate, endDate, act_limit)
    # Return a list of already cached activities in the database
    acts_dl_list = []
    for act in Activity.query.filter_by\
            (ath_id=ath_id).with_entities(Activity.act_id).all():
        acts_dl_list += act

    # Now loop through each activity if it's not in the list and download the
    # stream
    count = 0
    total = len([act for act in acts_list if act.id not in acts_dl_list])
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

                # Write stream dataframe to db
                df.to_sql('Stream', engine,
                          if_exists='append',
                          index=False)

            except:
                print "error entering activity or stream data into db!"
    db.session.close()
    return {'current': 100, 'total': 100, 'status': 'Task completed!',
            'result': 'View your Map!'}


@app.route('/longtask', methods=['POST'])
def longtask():
    """
    Begin the long task of downloading data from strava.  Accepts params from the form of 
    startDate, endDate, and activity limit from the page. 
    """
    # Clear cache because we are importing new data
    cache.clear()

    # Get the post data from the form via AJAX
    try:
        startDate = request.json['startDate']
        endDate = request.json['endDate']
        act_limit = request.json['act_limit']
    except:
        print "error parsing request headers!"
        startDate = '2015-01-01'
        endDate = '2016-01-01'
        act_limit = 10
    # Start the celery task
    task = long_task.delay(startDate,
                           endDate,
                           act_limit,
                           int(session['ath_id']),
                           ['latlng', 'time', 'distance', 'velocity_smooth', 'altitude',
                            'grade_smooth', 'watts', 'temp', 'heartrate', 'cadence', 'moving'],
                           session['access_token'],
                           'medium')
    if os.environ['APP_SETTINGS'] == 'config.DevelopmentConfig':
        return jsonify({}), 202, {'Location': url_for('taskstatus',
                                                  task_id=task.id)}
    else:
        return jsonify({}), 202, {'Location': url_for('taskstatus',
                                                      _scheme='https',
                                                      _external=True,
                                                      task_id=task.id)}


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
