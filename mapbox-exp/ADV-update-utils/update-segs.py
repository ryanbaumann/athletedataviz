# Goal - Select all segments in a given lat/long bounds using the Strava API
# Problem - API only reuturns top 10 segments in bound
import stravalib
import pandas as pd
import numpy as np
import os
from sqlalchemy import create_engine
from polyline.codec import PolylineCodec
from datetime import datetime
import json
import multiprocessing
from multiprocessing import Pool, Process
import re

engine = create_engine('postgresql+psycopg2://admin:password@localhost:5432/webdev6',
                       convert_unicode=True)

engine_prod = create_engine(r'postgresql+psycopg2://' + os.environ['ADV_PROD_POSTGRESQL_DB'],
                            convert_unicode=True)

client_secret = os.environ['STRAVA_CLIENT_SECRET_SEGS']
client_id = os.environ['STRAVA_CLIENT_ID_SEGS']
public_token = os.environ['STRAVA_PUBLIC_TOKEN_SEGS']

client = stravalib.client.Client(access_token=public_token)

#connection = engine_prod.connect()
connection = engine.connect()

def trunc_string(string):
    return string.split(' ')[0]

def cv(val, type):
    if val is None:
        return 0
    else:
        if type == 'float':
            return float(val)
        else:
            return int(val)


def update_acts(act_id):
        """
        Updates an activity int the database.  Accepts an activity ID list.
        """
        act = client.get_activity(act_id)
        args = """ UPDATE "Activity" 
                           Set 
                           %s = '%s',
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s
                           WHERE act_id = %s """ % ('polyline', act.map.polyline, 
                                                     'act_achievement_count', cv(act.achievement_count, 'int'),
                                                     'act_athlete_count', cv(act.athlete_count, 'int'),
                                                     'act_avg_cadence', cv(act.average_cadence, 'int'),
                                                     'act_avg_heartrate', cv(act.average_heartrate, 'int'),
                                                     'act_avg_speed', cv(act.average_speed, 'float'),
                                                     'act_avg_temp', cv(act.average_temp, 'float'),
                                                     'act_avg_watts', cv(act.average_watts, 'float'),
                                                     'act_calories', cv(act.calories, 'int'),
                                                     'act_comment_count', cv(act.comment_count, 'int'),
                                                     'act_commute', act.commute,
                                                     'act_distance', cv(act.distance, 'float'),
                                                     'act_elapsed_time', cv(act.elapsed_time.total_seconds(), 'int'),
                                                     'act_gear_id', cv(act.gear_id, 'int'),
                                                    act_id)
        connection.execute(args)
        return args

"Get a list of activites to update from the database"
act_lst = pd.read_sql("""SELECT act_id from "Activity" Where
                          polyline is null LIMIT 2""", engine)['act_id'].tolist()

result_list = []
def log_result(result):
    # This is called whenever foo_pool(i) returns a result.
    # result_list is modified only by the main process, not the pool workers.
    result_list.append(result)

if __name__ == "__main__":
    print act_lst
    '''
    pool = multiprocessing.Pool(multiprocessing.cpu_count()-1)
    results = pool.imap(update_acts, (act_lst, ))
    pool.close()
    pool.join()
    print(result_list)
    '''
    for act_id in act_lst:
        print act_id
        update_acts(act_id)
    print 'complete!'
