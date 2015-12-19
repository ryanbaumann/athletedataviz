import os
import sys
from kombu import Queue
basedir = os.path.abspath(os.path.dirname(__file__))


class Config(object):
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = True
    CSRF_ENABLED = True
    WTF_CSRF_ENABLED = True
    SECRET_KEY = os.environ.get(
        'SECRET_KEY', '\xfb\x13\xdf\xa1@i\xd6>V\xc0\xbf\x8fp\x16#Z\x0b\x81\xeb\x16')

    IP = os.environ.get('OPENSHIFT_PYTHON_IP', '127.0.0.1')
    PORT = str(os.environ.get('PORT', 33507))

    HOST_NAME = os.environ.get('OPENSHIFT_APP_DNS', 'localhost')
    APP_NAME = os.environ.get('OPENSHIFT_APP_NAME', 'webdev5')
    REDIS_URL = os.environ['REDIS_URL']

    MAPBOX_GL_ACCESS_TOKEN = os.environ['MAPBOX_GL_ACCESS_TOKEN']
    MAPBOX_ACCESS_TOKEN = os.environ['MAPBOX_ACCESS_TOKEN']
    STRAVA_CLIENT_ID = os.environ['STRAVA_CLIENT_ID']
    STRAVA_CLIENT_SECRET = os.environ['STRAVA_CLIENT_SECRET']
    RUNKEEPER_CLIENT_ID = os.environ['RUNKEEPER_CLIENT_ID']
    RUNKEEPER_CLIENT_SECRET = os.environ['RUNKEEPER_CLIENT_SECRET']
    UPLOAD_FOLDER = 'uploads'
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
    """
    CELERY_DEFAULT_QUEUE = 'default'
    CELERY_QUEUES = (
        Queue('default',    routing_key='task.#'),
        Queue('feed_tasks', routing_key='feed.#'),
    )
    CELERY_DEFAULT_EXCHANGE = 'tasks'
    CELERY_DEFAULT_EXCHANGE_TYPE = 'topic'
    CELERY_DEFAULT_ROUTING_KEY = 'task.default'
    """
    COMPRESS_MIMETYPES = [
        'text/html', 'text/css', 'text/xml', 'application/json', 'application/javascript']
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 250

    CACHE_TYPE = 'simple'


class ProductionConfig(Config):
    DEBUG = False
    HOST_NAME = r'athletedataviz-pro.herokuapp.com'
    APP_NAME = r'athletedataviz-pro'
    PORT = ''


class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
