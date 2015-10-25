from migrate.versioning import api
from config import PG_DB_USERNAME, PG_DB_PASSWORD, PG_DB_HOST, \
                   PG_DB_PORT, APP_NAME, SQLALCHEMY_MIGRATE_REPO, SQLALCHEMY_DATABASE_URI
from views import db
import os.path
#sqlalchemy connection
"""
conn_string = 'postgresql+psycopg2://' + \
                   str(PG_DB_USERNAME) + ':' + \
                   str(PG_DB_PASSWORD) + '@' + \
                   str(PG_DB_HOST) + ':' + \
                   str(PG_DB_PORT) + '/' + \
                   str(APP_NAME)
"""

db.create_all()

if not os.path.exists(SQLALCHEMY_MIGRATE_REPO):
    api.create(SQLALCHEMY_MIGRATE_REPO, 'database repository')
    api.version_control(SQLALCHEMY_DATABASE_URI, SQLALCHEMY_MIGRATE_REPO)
else:
    api.version_control(SQLALCHEMY_DATABASE_URI, 
                        SQLALCHEMY_MIGRATE_REPO, 
                        api.version(SQLALCHEMY_MIGRATE_REPO))


"""
engine = create_engine(conn_string, convert_unicode=True, echo=True)
session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

strava_act_detail = "strava_act_detail"
strava_act = "strava_act"
strava_athlete = "strava_athlete"
try:
    engine.execute("CREATE EXTENSION postgis;")
except:
    print "postgis extension already instealled!"

# create table for "strava_act_detail"
meta = MetaData(engine)
my_table = Table(table_name, meta,
Column('id', Integer, primary_key=True, autoincrement=True),
Column('athlete_id', Integer),
Column('data_dl_data', DateTime),
Column('act_startDate', DateTime),
Column('timestamp', DateTime),
Column('time', Float),
Column('act_id', Float),
Column('act_name', VARCHAR(100)),
Column('distance', Float),
Column('altitude', Float),
Column('velocity_smooth', Float),
Column('grade_smooth', Float),
Column('lat' , Float),
Column('long' , Float),
)

Index('actid_athid_actstart_ix', 
       my_table.c.athlete_id,
       my_table.c.act_id,
       my_table.c.act_startDate)

try:
    print "Creating table..."
    my_table.create(engine)
    print "adding point column..."
    engine.execute('ALTER TABLE "%s" ADD "point" geography(POINT,4326);' %(strava_act_detail))
    print "adding spatial index on point column..."
    engine.execute('CREATE INDEX Point_ix ON %s USING GIST (point);' %(strava_act_detail))
    print "created table " + table_name
except:
    print "activities table already exists! - performing maintenence tasks"
"""
