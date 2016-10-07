import os
import sys

basedir = os.path.abspath(os.path.dirname(__file__))


class Config(object):
    PROPAGATE_EXCEPTIONS = True
    CSRF_ENABLED = True
    WTF_CSRF_ENABLED = True
    SECRET_KEY = os.environ.get(
        'SECURE_KEY', '\xfb\x13\xdf\xa1@i\xd6>V\xc0\xbf\x8fp\x16#Z\x0b\x81\xeb\x16')

    PORT = str(os.environ.get('PORT', 33507))
    PREFERRED_URL_SCHEME = 'https'

    # Redis
    REDIS_URL = os.environ['REDIS_URL']

    # Mapbox
    MAPBOX_GL_ACCESS_TOKEN = os.environ['MAPBOX_GL_ACCESS_TOKEN']
    MAPBOX_ACCESS_TOKEN = os.environ['MAPBOX_ACCESS_TOKEN']

    # Strava
    STRAVA_CLIENT_ID = os.environ['STRAVA_CLIENT_ID']
    STRAVA_CLIENT_SECRET = os.environ['STRAVA_CLIENT_SECRET']

    # Runkeeper - Optional, not yet implemented
    RUNKEEPER_CLIENT_ID = os.environ['RUNKEEPER_CLIENT_ID']
    RUNKEEPER_CLIENT_SECRET = os.environ['RUNKEEPER_CLIENT_SECRET']

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = 30
    SQLALCHEMY_POOL_TIMEOUT = 30
    SQLALCHEMY_MAX_OVERFLOW = 120


    # CELERY
    CELERY_ACCEPT_CONTENT = ['json', 'pickle']
    CELERY_BROKER_URL = os.environ['REDIS_URL']
    CELERY_RESULT_BACKEND = os.environ['REDIS_URL']
    CELERY_REDIS_MAX_CONNECTIONS = 25
    BROKER_POOL_LIMIT = 0
    CELERYD_TASK_SOFT_TIME_LIMIT = 300
    CELERYD_TASK_TIME_LIMIT = 600

    # Flask-Compress
    COMPRESS_MIMETYPES = [
        'text/html', 'text/css', 'text/xml', 'application/json', 'application/javascript']
    COMPRESS_LEVEL = 9
    COMPRESS_MIN_SIZE = 250

    # Flask-Cache
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ['REDIS_URL']
    CACHE_KEY_PREFIX = 'fcache'

    # Shopify API
    SHOPIFY_API_KEY = os.environ['SHOPIFY_API_KEY']
    SHOPIFY_PASSWORD = os.environ['SHOPIFY_PASSWORD']


class ProductionConfig(Config):
    DEBUG = False
    HOST_NAME = r'design.athletedataviz.com'
    APP_NAME = r'athletedataviz-pro'
    HEADER = r'https://'
    PORT = r''


class StagingConfig(Config):
    DEVELOPMENT = True
    HOST_NAME = r'athletedataviz-stage.herokuapp.com'
    APP_NAME = r'athletedataviz-stage'
    HEADER = r'https://'
    PORT = r''
    DEBUG = True


class DevelopmentConfig(Config):
    HOST_NAME = r'localhost:33507'
    APP_NAME = r'webdev6'
    HEADER = r'http://'
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
