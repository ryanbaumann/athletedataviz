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
        'SECURE_KEY', '\xfb\x13\xdf\xa1@i\xd6>V\xc0\xbf\x8fp\x16#Z\x0b\x81\xeb\x16')

    IP = os.environ.get('OPENSHIFT_PYTHON_IP', '127.0.0.1')
    PORT = str(os.environ.get('PORT', 33507))
    PREFERRED_URL_SCHEME = 'https'
    REDIS_URL = os.environ['REDIS_URL']
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
    CELERY_REDIS_MAX_CONNECTIONS = 19
    # Name and email addresses of recipients
    ADMINS = (
        ('test', 'test@gmail.com')
    )
    # Email address used as sender (From field).
    SERVER_EMAIL = 'no-reply@test.com'
    # Mailserver configuration
    #EMAIL_HOST='smtp.gmail.com'
    #EMAIL_HOST_USER='test@gmail.com'
    #EMAIL_HOST_PASSWORD=os.environ['ATHLETEDATAVIZ_EMAIL_PW']
    #EMAIL_PORT=587
    #EMAIL_USE_TLS = True
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

    #Shopify API
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
    APP_NAME = r'webdev5'
    HEADER = r'http://'
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
