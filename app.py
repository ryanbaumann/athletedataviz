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

app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)

import models


#---------Strava Pages---------------
"""
@app.route('/')
def homepage():

    title = "Epic Tutorials"
    paragraph = ["wow I am learning so much great stuff!"]

    try:
        return render_template("index.html", title = title, paragraph=paragraph)
    except Exception, e:
        return str(e)
"""        

@app.route('/')
def homepage():
    if 'access_token' not in session:
        return redirect(url_for('login'))

    client = stravalib.client.Client(access_token=session['access_token'])
    athlete = client.get_athlete()
    #session['client'] = client
    session['athlete_id'] = athlete.id
    session['table_name'] = athlete.lastname + '_' + athlete.firstname
    return render_template('main.html', athlete=athlete, client=client)

@app.route('/login')
def login():
    client = stravalib.client.Client()
    #Update redirect uri when testing on developers.strava.com
    if str(app.config['PORT']) == '':
        redirect_uri = r'http://' + app.config['HOST_NAME'] + '/auth'
    else:
        redirect_uri = r'http://' + app.config['HOST_NAME'] + ':' + str(app.config['PORT']) + '/auth'
    print redirect_uri
    auth_url = client.authorization_url(client_id=app.config['STRAVA_CLIENT_ID'],
            redirect_uri= redirect_uri)
    return render_template('login.html', auth_url=auth_url)

@app.route('/logout')
def logout():
    session.pop('access_token')
    return redirect(url_for('homepage'))

@app.route('/update')
def update():
    return render_template('update.html')

@app.route('/auth')
def auth_done():
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
    app.run()
