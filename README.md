## Athlete Data Viz
*powered by Flask, PostGis, Mapbox, Strava, Bootleaf, print-maps, and AWS S3*

## Building

## Deploy to Heroku PAAS
To deploy a clone of this application using the [`heroku` command line tool](https://devcenter.heroku.com/articles/heroku-command):
    cd <your working dir for athletedataviz>
    heroku create <your_app_name>
    git remote add pro https://git.heroku.com/<your_app_name>.git
    git push pro master

Now provision a POSTGIS database on Heroku (this is the $50/month version FYI)
    heroku addons:create heroku-postgresql:standard-Cobalt --app <your_app_name>
    heroku pg:psql HEROKU_POSTGRESQL_COBALT_URL --app <your_app_name>
        -> create extension postgis;
        -> Select postgis_version(); postgis_version
            ---------------------------------------
            2.1 USE_GEOS=1 USE_PROJ=1 USE_STATS=1

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


## Credits

* [Matthew Petroff](http://mpetroff.net/), Original Author
* [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js)
* [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
* [canvas-toBlob.js](https://github.com/eligrey/canvas-toBlob.js)
* [jsPDF](https://github.com/MrRio/jsPDF)
* [Bootstrap](http://getbootstrap.com/)

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
