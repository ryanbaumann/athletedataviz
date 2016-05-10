## Athlete Data Viz
*powered by Flask, PostGis, Mapbox, Strava, Bootleaf, print-maps, and AWS S3*

## Building

## Install Python
1) Install [Python 2.7.11] (https://www.python.org/downloads/release/python-2711/) - run using a system copy of python or a virtualenv 

2) Install [Redis](http://redis.io/download)

3) Run "pip install -r requirements.txt" if building locally.  Heroku will auto-run the command when deploying a new dyno.


## Deploy to Heroku PAAS
To deploy a clone of this application using the [`heroku` command line tool](https://devcenter.heroku.com/articles/heroku-command):

cd <your working dir for athletedataviz>

heroku create <your_app_name>

git remote add pro https://git.heroku.com/<your_app_name>.git

git push pro master

Now provision a PostgreSQL database on Heroku.  Requires PostgreSQL version 9.5.2+  

After the database is available, install the PostGIS extension.  Requires POSTGIS version 2.2+, which should be installed by default by Heroku on a PostgreSQL 9.5.2+ database.  

NOTE: Heroku requires a Production database to install PostGIS.  Minimum $50/month.


heroku addons:create heroku-postgresql:standard-Cobalt --app <your_app_name>

heroku pg:psql HEROKU_POSTGRESQL_COBALT_URL --app <your_app_name>

-> create extension postgis;

-> Select postgis_version(); postgis_version
---------------------------------------
2.2.2 USE_GEOS=1 USE_PROJ=1 USE_STATS=1

#Set an environement variable for the configuration version you have (Production in this case, below)
    heroku config:set APP_SETTINGS=config.ProductionConfig --remote pro

## A mapbox dev account is required.  
See https://www.mapbox.com/developers/ for details
Obtain a mapbox API public key and place it in the "config.py" file in the root dir of this repo

    heroku config:set MAPBOX_GL_ACCESS_TOKEN=<your_mapbox_gl_access_token> --remote pro

## A Strava dev account is required
See https://strava.com/developers for details
Obtain an application ID, then set environment variables

    heroku config:set STRAVA_CLIENT_ID=<your_strava_client_id> --remote <your_app_name>

    heroku config:set STRAVA_CLIENT_SECRET=<your_strava_client_secret> --remote <your_app_name>

## Setup Background Tasks
1) Install Redis.  Start redis server after install.

2) Set os environment variable to point to the redis url (see config.py)

3) Start a celery worker.  Open a new terminal, cd to the repo base directory, and run "celery worker -A app.celery"


## First Run
1) run command "python app.py" to start the local server.  Ensure your development server has the required environment variables defined as per the build instrcutions.

2) Start the Celery Worker "celery worker -A app.celery"

3) Navigate to localhost:33507 to open the ADV homepage


## Credits

* [Matthew Petroff](http://mpetroff.net/), (Print Maps)
* [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js)
* [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
* [canvas-toBlob.js](https://github.com/eligrey/canvas-toBlob.js)
* [jsPDF](https://github.com/MrRio/jsPDF)
* [Bootstrap](http://getbootstrap.com/)
* [Ryan Baumann] (https://ryanbaumann.com) (Author of ADV) 

## License
The MIT License (MIT)

Copyright (c) 2015, Ryan Baumann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
