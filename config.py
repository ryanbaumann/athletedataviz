import os
import sys
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = True
    CSRF_ENABLED = True
    SECRET_KEY = os.environ.get('SECRET_KEY','\xfb\x13\xdf\xa1@i\xd6>V\xc0\xbf\x8fp\x16#Z\x0b\x81\xeb\x16')
    
    IP = os.environ.get('OPENSHIFT_PYTHON_IP','127.0.0.1')
    PORT = os.environ.get('OPENSHIFT_PYTHON_PORT',8080)

    HOST_NAME = os.environ.get('OPENSHIFT_APP_DNS','localhost')
    APP_NAME = os.environ.get('OPENSHIFT_APP_NAME','webdev5')
    PG_DB_HOST = os.environ.get('OPENSHIFT_POSTGRESQL_DB_HOST','localhost')
    PG_DB_PORT = int(os.environ.get('OPENSHIFT_POSTGRESQL_DB_PORT',5432))
    PG_DB_USERNAME = os.environ.get('OPENSHIFT_POSTGRESQL_DB_USERNAME','admin')
    PG_DB_PASSWORD = os.environ.get('OPENSHIFT_POSTGRESQL_DB_PASSWORD','password')
    
    CLIENT_ID=os.environ.get('STRAVA_CLIENT_ID','1495')
    CLIENT_SECRET=os.environ.get('STRAVA_CLIENT_SECRET','c6a039194dfd27cca3cfa042cb6beb741dbf6b4b')
    UPLOAD_FOLDER='uploads'
    
    """SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://' + \
                               str(PG_DB_USERNAME) + ':' + \
                               str(PG_DB_PASSWORD) + '@' + \
                               str(PG_DB_HOST) + ':' + \
                               str(PG_DB_PORT) + '/' + \
                               str(APP_NAME)"""

    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

class ProductionConfig(Config):
    DEBUG = False

class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True

class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
