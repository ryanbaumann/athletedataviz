import time, gc, hmac, os, base64, urllib
import stravalib
from hashlib import sha1
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
    render_template, session, jsonify, Response, json, send_from_directory
from flask_restful import Resource, Api, reqparse
from flask.ext.sqlalchemy import SQLAlchemy
from lib import stravaparse as sp
from lib import segmentParse as seg_sp
from sqlalchemy import create_engine
from celery import Celery
from flask.ext.compress import Compress
from flask.ext.cache import Cache
from flask_sslify import SSLify
from flask.ext.cors import CORS
from lib.forms import OrderForm
from flask.ext.assets import Environment, Bundle
#import shopify

#################
# configuration #
#################

gc.enable()  #auto garbage collection
compress = Compress()
cache = Cache()

#Initialize Flask application
app = Flask(__name__)
api = Api(app)
CORS(app)
app.config.from_object(os.environ['APP_SETTINGS'])

#Get models and db connection
db = SQLAlchemy(app)
engine = create_engine(
    app.config['SQLALCHEMY_DATABASE_URI'], convert_unicode=True)
from lib.models import *

#initialize celery
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

#flask-compress
compress.init_app(app)

#flask-cache
cache.init_app(app)

#flask-sslify
if 'DYNO' in os.environ:
    sslify = SSLify(app, permanent=True)

#flask-assets
assets = Environment(app)
js_base = Bundle('js/jquery-2.2.4.min.js',
            'js/mapbox-gl-js-0-23-0.js',
            'js/mapbox-gl-geocoder-1-3-0.js',
            'js/bootstrap.js',
            'js/bootstrap-slider.js',     
            'js/modernizr-2-8-3.js',
            'js/moment-2-10-6.js',
            'js/nanobar-0.2.1.js',
            'js/platform.js',
            'js/canvas-to-blob.js',
            'js/fileSaver.js',
            'js/download_acts.js',
            'js/heat_viz.js',
            'js/line_viz.js',
            'js/seg_viz.js', 
            'js/adv_viz_designer.js',
            'js/image_gl_canvas.js', 
            'js/upload_img.js',
            filters='jsmin', output='gen/packed_base.js')

css = Bundle('css/bootstrap.css',
             'css/font-awesome.min.css',
             'css/bootstrap-slider.css',
             'css/mapbox-gl-js-0-23-0.css',
             'css/mapbox-gl-geocoder-1-3-0.css',
             'css/normalize.css',
             'css/style.css',
             filters='cssmin', output="gen/all.css")

css_base_min = Bundle('css/style_inline_base.css',
                filters='cssmin', output="gen/base_inline_min.css")

assets.register('css_all', css)
assets.register('css_base_min', css_base_min)
assets.register('js_base', js_base)

#Globals
BASEPATH = app.config['HEADER'] + app.config['HOST_NAME'] + r'/'
SHOP_URL = "https://%s:%s@athletedataviz.myshopify.com/admin" % \
    (app.config['SHOPIFY_API_KEY'], app.config['SHOPIFY_PASSWORD'])

#Shopify API
#shopify.ShopifyResource.set_site(shop_url)
#shop = shopify.Shop.current()

##########
#  API   #
##########

def output_html(data, code, headers=None):
    resp = Response(data, mimetype='text/html', headers=headers)
    resp.status_code = code
    return resp


def output_json(data, code, age, headers=None):
    resp = Response(data, mimetype='application/json', headers=headers)
    resp.status_code = code
    resp.cache_control.max_age = age
    return resp


class Heat_Points(Resource):
    def get(self, ath_id):
        geojsonPoints = sp.get_heatmap_lines(
            engine, int(ath_id))
        gc.collect()
        return output_json(geojsonPoints, 200, 600)

    def __repr__(self):
        return "%s" % (self.__class__.__name__)


class Heat_Lines(Resource):
    def get(self, ath_id):
        geojsonlines = sp.to_geojson_data(
            engine, '"V_Stream_LineString"', int(ath_id))
        gc.collect()
        return output_json(geojsonlines, 200, 600)

    def __repr__(self):
        return "%s" % (self.__class__.__name__)


class Heat_Lines2(Resource):
    def get(self, ath_id):
        geojsonlines = sp.get_heatmap_lines(
            engine, int(ath_id))
        return output_json(geojsonlines, 200, 600)

    def __repr__(self):
        return "%s" % (self.__class__.__name__)


class Stream_Data(Resource):
    def get(self, ath_id):
        geojsonlines = sp.get_heatmap_lines(
            engine, int(ath_id))
        return output_json(geojsonlines, 200, 600)

    def __repr__(self):
        return "%s" % (self.__class__.__name__)


class Segment_Data(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            'startLat', type=float, required=True, help='Enter start latitude')
        parser.add_argument(
            'startLong', type=float, required=True, help='Enter start longitude')
        parser.add_argument(
            'endLat', type=float, required=True, help='Enter end latitude')
        parser.add_argument(
            'endLong', type=float, required=True, help='Enter end longitude')
        parser.add_argument(
            'act_type', type=str, required=True, help='Enter act type riding or running')
        
        #Optional arguments
        parser.add_argument('start_dist', 
            type=float,help='Enter start distance in meters')
        parser.add_argument('end_dist', 
            type=float, help='Enter end distance of activility in meters')
        parser.add_argument('newSegs', 
            type=str, help='Enter True or False to get new segments from the Strava API')
        args = parser.parse_args()
        
        #For optional args, set values for query if args are blank
        if not args['start_dist']:
            start_dist = int(0)
        else:
            start_dist = args['start_dist']
        if not args['end_dist']:
            end_dist = int(100000)
        else:
            end_dist = args['end_dist']
        if not args['newSegs']:
            newSegs = 'False'
        else:
            newSegs = args['newSegs']
        seg_geojson = seg_sp.get_seg_geojson(engine, args['startLat'], args['startLong'], args['endLat'], 
                                            args['endLong'], args['act_type'], start_dist, end_dist, newSegs)
        gc.collect()
        return output_json(seg_geojson, 200, 5)

    def __repr__(self):
        return "%s" % (self.__class__.__name__)


class Current_Acts(Resource):
    def get(self, ath_id):
        try:
            act_data = sp.get_acts_html(engine, int(ath_id)).to_html(
                classes=["table table-striped",
                         "table table-condensed"])
        except:
            print "error getting current activity list from DB!"
            raise
        gc.collect()
        return output_html(act_data, 200)

    def __repr__(self):
        return "%s_%s" % (self.__class__.__name__, self.id)

api.add_resource(Heat_Points, '/heat_points/<int:ath_id>')
api.add_resource(Heat_Lines, '/heat_lines/<int:ath_id>')
api.add_resource(Heat_Lines2, '/heat_lines2/<int:ath_id>')
api.add_resource(Current_Acts, '/current_acts/<int:ath_id>')
api.add_resource(Segment_Data, '/segment_data/')

##########
# helper #
##########

def clearCache(ath_id):
    """ Remove Data from Cache for user """
    try:
        Heat_Points.removeCache(ath_id)
        Heat_Lines.removeCache(ath_id)
    except:
        print 'error clearing cache!'
        raise

    return None

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
        client = stravalib.client.Client()
        # Check port configuration for dev vs. deployed environments
        redirect_uri = app.config['HEADER'] + app.config['HOST_NAME'] + '/auth'
        auth_url = client.authorization_url(
            client_id=app.config['STRAVA_CLIENT_ID'],
            redirect_uri=redirect_uri)
        return render_template('main.html',
                               auth_url=auth_url)

    # Render the homepage with the user's Strava access token
    if request.method == 'GET':
        client = stravalib.client.Client(access_token=session['access_token'])

        try:
            athlete = client.get_athlete()
        except:
            print "rate limit exceeped for Strava api client!"
            raise
            return render_template('500.html')

        # Add athlete ID to the session
        session['ath_id'] = int(athlete.id)
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
                                      first_name=unicode(athlete.firstname),
                                      last_name=unicode(athlete.lastname),
                                      city = unicode(athlete.city),
                                      state = unicode(athlete.state),
                                      country = unicode(athlete.country),
                                      email = unicode(athlete.email),
                                      email_language = unicode(athlete.email_language),
                                      measurement_preference = unicode(athlete.measurement_preference),
                                      date_preference = unicode(athlete.date_preference),
                                      profile = unicode(athlete.profile),
                                      profile_medium = unicode(athlete.profile_medium))
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
            print "Unable to add or update athlete in database."
            raise

        return render_template('main.html',
                               act_limit=int(session.get('act_limit', 1)),
                               current_act_url=BASEPATH +
                               'current_acts/' + str(session['ath_id']),
                               athlete_name = athlete.firstname + ' ' + athlete.lastname,
                               profile_url = athlete.profile)



@app.route('/login')
def login():
    client = stravalib.client.Client()
    redirect_uri = app.config['HEADER'] + app.config['HOST_NAME'] + '/auth'
    auth_url = client.authorization_url(
        client_id=app.config['STRAVA_CLIENT_ID'],
        redirect_uri=redirect_uri)
    print auth_url
    return render_template('login.html', auth_url=auth_url)


@app.route('/logout')
def logout():
    """ End a users session and return them to the homepage """
    session.pop('access_token')

    return redirect(url_for('homepage'))


@app.route('/sign_s3')
def sign_s3():
    # how long to keep the file on AWS S3 storage
    days_to_expire = 30
    # AWS S3 access information from environment variables
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = os.environ.get('S3_BUCKET_IMAGES')
    # Folder to store images in
    try:  # set to logged in user
        ath_id = str(session['ath_id'])
    except:  # Set to demo user if not logged in
        ath_id = str(12904699)
    foldername = r'user/' + str(ath_id) + r'/'
    # Get filename and filetype from request header in URL
    object_name = foldername + urllib.quote_plus(request.args.get('file_name'))
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
                                ath_id=int(ath_id),
                                filename=request.args.get('file_name'),
                                url=url,
                                exp_datetime_utc=datetime.fromtimestamp(expires))
    db.session.add(new_act_fact)
    db.session.commit()
    db.session.close()
    # return json to the browser to finish use the image link in the browser
    content = json.dumps({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%s&cache-control=%s&Signature=%s' % (url,
                                                                                             AWS_ACCESS_KEY, expires, 'max-age=2592000,public', signature),
        'url': url,
    })

    return content


@app.route('/auth')
def auth_done():
    """ Authenticate a user with the Strava api and obtain a token """
    try:
        code = request.args.get('code')
    except:
        print 'Code not found, redirecting to authentication page!'
        raise
        return redirect(url_for('homepage'))

    client = stravalib.client.Client()

    try:
        token = client.exchange_code_for_token(
            client_id=app.config['STRAVA_CLIENT_ID'],
            client_secret=app.config['STRAVA_CLIENT_SECRET'],
            code=code)
    except:
        print 'error exchanging token with Strava API!'
        raise
        return redirect(url_for('homepage'))

    session['access_token'] = token
    return redirect(url_for('homepage'))


@app.route('/strava_mapbox')
def strava_mapbox():
    """
    A function to get the data for vizualization from the database,
    and return the template for the user's vizualization (map)
    """

    if 'access_token' not in session:
        return redirect(url_for('homepage'))

    try:
        athlete = Athlete.query.filter_by(ath_id=session['ath_id']).first()
    except:
        print 'error getting athlete row from db!'
        raise
        return redirect(url_for('homepage'))

    return render_template('strava_mapbox_gl_v3.html',
                           mapbox_gl_accessToken = app.config[
                               'MAPBOX_GL_ACCESS_TOKEN'],
                           heatpoint_url = BASEPATH +
                           'heat_points/' + str(session['ath_id']),
                           heatline_url = BASEPATH +
                           'heat_lines/' + str(session['ath_id']),
                           ath_name = athlete.first_name + "_" + athlete.last_name + 
                                    '_' + datetime.utcnow().strftime('%y%m%d'),
                           seg_base_url = BASEPATH + str('segment_data/?'))


@app.route('/demodesigner')
def demodesigner():
    """A demo map for those who want to try but dont have a Strava account"""

    return render_template('strava_mapbox_gl_v3.html',
                           mapbox_gl_accessToken=app.config[
                               'MAPBOX_GL_ACCESS_TOKEN'],
                           mapbox_accessToken=app.config[
                               'MAPBOX_ACCESS_TOKEN'],
                           heatpoint_url=BASEPATH + 'heat_points/12904699',
                           heatline_url=BASEPATH + 'heat_lines/12904699',
                           ath_name="ADV" + "_" + "Demo" + '_' + datetime.utcnow().strftime('%y%m%d'),
                           seg_base_url = BASEPATH + str('segment_data/?'))


@app.route('/delete_acts', methods=['POST'])
def delete_acts():
    """Delete all activities from the user currently logged in"""
    if request.method == 'POST':
        try:
            acts_dl_list = []
            for act in Activity.query.filter_by(
                    ath_id=int(session['ath_id'])).with_entities(
                    Activity.act_id).all():
                acts_dl_list += act
            for act in acts_dl_list:
                # Delete the stream
                try:
                    Stream.query.filter_by(act_id=act).delete(
                        synchronize_session='evaluate')
                except:
                    print 'error deleting stream!'
                    raise
                try:
                    # Delete the activity
                    Activity.query.filter_by(act_id=act).delete(
                        synchronize_session='evaluate')
                except:
                    print 'error deleting activity!'
                    raise

            db.session.commit()
            print "deleted activities from ath_id = " + str(session['ath_id'])
            flash("deleted all activities for " + str(session['ath_id']))
            db.session.close()
        except:
            print "error reading arguments from delete reuqest form!"
            raise

        return redirect(url_for('homepage'))


@celery.task(name='long_task.add', bind=True)
def long_task(self, startDate, endDate, act_limit, ath_id, types, access_token, resolution):
    """
    A celery task to update the Strava rides into the AthleteDataViz database
    """
    self.update_state(state='PROGRESS',
                      meta={'current': 0.01, 'total': 1,
                            'status': 'Starting Job - Getting Activities from Strava!'})
    client = stravalib.client.Client(access_token=access_token)

    # Get a list of activities, compare to what's in the DB, return only activities not in DB items
    acts_list = sp.GetActivities(client, startDate, endDate, act_limit)
    # Return a list of already cached activities in the database
    acts_dl_list = []
    for act in Activity.query.filter_by\
            (ath_id=ath_id).with_entities(Activity.act_id).all():
        acts_dl_list += act

    # Now loop through each activity if it's not in the list and download the stream
    count = 0
    total = len([act for act in acts_list if act.id not in acts_dl_list])
    for act in acts_list:
        if act.id not in acts_dl_list:
            count += 1
            print "downloading act id: " + str(act.id) + " : " + str(count) + " of " + str(total)

            self.update_state(state='PROGRESS',
                              meta={'current': count, 'total': total,
                                    'status': 'Analyzing activity ' + str(act.start_date_local)})
            try:
                # Add results to dictionary
                df = sp.ParseActivity(client, act, types, resolution)
                if not df.empty:
                    df = sp.cleandf(df)
                else:
                    print "no new data to clean"

                new_act = Activity(ath_id=ath_id,
                                   act_id=act.id,
                                   type=act.type,
                                   name=unicode(act.name),
                                   description=unicode(act.description),
                                   startDate=act.start_date_local,
                                   distance=act.distance,
                                   totalElevGain=act.total_elevation_gain,
                                   avgSpd=act.average_speed,
                                   calories=act.calories,
                                   polyline=act.map.summary_polyline,
                                   achievement_count=act.achievement_count,
                                   athlete_count=act.athlete_count,
                                   avg_cadence=act.average_cadence,
                                   avg_heartrate=act.average_heartrate,
                                   avg_temp=act.average_temp,
                                   avg_watts=act.average_watts,
                                   comment_count=act.comment_count,
                                   commute=act.commute,
                                   elapsed_time=act.elapsed_time.total_seconds(),
                                   gear_id=act.gear_id,
                                   kilojoules=act.kilojoules,
                                   kudos_count=act.kudos_count,
                                   manual=act.manual,
                                   max_heartrate=act.max_heartrate,
                                   max_speed=act.max_speed,
                                   moving_time=act.moving_time.total_seconds(),
                                   photo_count=act.photo_count,
                                   workout_type=act.workout_type
                                   )

                db.session.add(new_act)
                db.session.commit()

                # Write stream dataframe to db
                df.to_sql('Stream', engine,
                          if_exists='append',
                          index=False)

            except:
                print "error entering activity or stream data into db!"
                raise
                pass
                
    db.session.close()
    gc.collect()
    return {'current': 100, 'total': 100, 'status': 'Task completed!',
            'result': 'Complete! Got ' + str(count) + ' new activities'}


@app.route('/longtask', methods=['POST'])
def longtask():
    """
    Begin the long task of downloading data from strava.  Accepts params from the form of 
    startDate, endDate, and activity limit from the page. 
    """

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


#DEPRICATED @app.route('/act_limit', methods=['POST'])
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
        return redirect(url_for('homepage', act_limit=act_limit))

# NOT IN PRODUCTION - @app.route('/testmap')
def testmap():
    """
    A map to test new functionality not yet in the production release
    """
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

#DEPRICATED @app.route("/submit_form", methods=["POST"])
def submit_form():
    username = request.form["username"]
    full_name = request.form["full_name"]
    avatar_url = request.form["avatar_url"]
    update_account(username, full_name, avatar_url)
    return redirect(url_for('profile'))


#DEPRICATED @app.route('/about')
def about():
    """ Sends user to contact page """
    return render_template('about.html')


#DEPRICATED @app.route('/update')
def update():
    return render_template('update.html')

# DEPRICATED -- @app.route('/uploads/<path:filename>')
def download_strava():
    try:
        filename = request.args.get('filename')
    except:
        print 'filename not found, redirecting to data page!'
        return redirect(url_for('strava_activity_download'))
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename, as_attachment=True)

#DEPRICATED @app.route('/products')
def products():
    """ Temporary redirect to home page until implemented """
    return redirect(url_for('homepage'))


#DEPRICATED @app.route('/blog')
def blog():
    """ Temporary redirect to home page until implemented """
    return redirect(url_for('homepage'))


#DEPRICATED @app.route('/account')
def account():
    """ Sends user to account page """
    return render_template('account.html',
                           basepath=BASEPATH)


#DEPRICATED @app.route('/newproduct')
"""def newproduct():
    'Posts a new product to the shopify page'

    # Create a new product
    new_product = shopify.Product()
    new_product.title = "Burton Custom Freestyle 151"
    new_product.product_type = "Snowboard"
    new_product.vendor = "Burton"
    new_product.add
    success = new_product.save()  # returns false if the record is invalid
    return('posted product!')
"""

#DEPRICATED @app.route('/order', methods=['GET', 'POST'])
def order():
    """ Sends user to contact page """
    form = OrderForm()
    session['img_url'] = request.args.get('url')
    if request.method == 'POST':
        if form.validate() == False:
            flash('All fields are required.')
            return render_template('order.html', form=form)
        else:
            return 'Form posted.'

    elif request.method == 'GET':
        return render_template('order.html', form=form, img_url=session['img_url'])


if __name__ == '__main__':
    app.run(port=int(app.config['PORT']))
