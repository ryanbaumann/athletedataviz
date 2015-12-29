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
    PREFERRED_URL_SCHEME = 'https'
    HOST_NAME = os.environ.get('OPENSHIFT_APP_DNS', 'localhost:33507') #:33507
    APP_NAME = os.environ.get('OPENSHIFT_APP_NAME', 'webdev5')
    REDIS_URL = os.environ['REDIS_URL']
    HEADER = r'http://'
    MAPBOX_GL_ACCESS_TOKEN = os.environ['MAPBOX_GL_ACCESS_TOKEN']
    MAPBOX_ACCESS_TOKEN = os.environ['MAPBOX_ACCESS_TOKEN']
    STRAVA_CLIENT_ID = os.environ['STRAVA_CLIENT_ID']
    STRAVA_CLIENT_SECRET = os.environ['STRAVA_CLIENT_SECRET']
    RUNKEEPER_CLIENT_ID = os.environ['RUNKEEPER_CLIENT_ID']
    RUNKEEPER_CLIENT_SECRET = os.environ['RUNKEEPER_CLIENT_SECRET']
    UPLOAD_FOLDER = 'uploads'
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

    #CELERY
    # Enables error emails.
    #CELERY_SEND_TASK_ERROR_EMAILS = True
    BROKER_POOL_LIMIT=0 #Prevent each new celery connection from opening a new conn
    CELERY_ACCEPT_CONTENT = ['json', 'pickle']
    #CELERY_IGNORE_RESULT = True
    #CELERY_STORE_ERRORS_EVEN_IF_IGNORED = True
    CELERY_REDIS_MAX_CONNECTIONS = 39
    # Name and email addresses of recipients
    ADMINS = (
        ('Ryan Baumann', 'athletedataviz@gmail.com')
    )
    # Email address used as sender (From field).
    SERVER_EMAIL = 'no-reply@athletedataviz.com'
    # Mailserver configuration
    EMAIL_HOST='smtp.gmail.com'
    EMAIL_HOST_USER='athletedataviz@gmail.com'
    EMAIL_HOST_PASSWORD=os.environ['ATHLETEDATAVIZ_EMAIL_PW']
    EMAIL_PORT=587
    EMAIL_USE_TLS = True
    CELERYD_TASK_SOFT_TIME_LIMIT = 300
    CELERYD_TASK_TIME_LIMIT = 600

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
    COMPRESS_LEVEL = 8
    COMPRESS_MIN_SIZE = 250
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ['REDIS_URL']


class ProductionConfig(Config):
    DEBUG = False
    HOST_NAME = r'athletedataviz-pro.herokuapp.com'
    APP_NAME = r'athletedataviz-pro'
    HEADER = r'https://'
    PORT = r''


class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
