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

connection = engine_prod.connect()
#connection = engine.connect()

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


def update_acts(client, act_id):
        """
        Updates an activity int the database.  Accepts an activity ID list.
        """
        act = client.get_activity(act_id)
        args = """ UPDATE "Activity" 
                           Set 
                           %s = '%s',
                           "%s" = %s,
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
                           %s = '%s',
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = %s,
                           %s = '%s'

                           WHERE act_id = %s """ % ('polyline', act.map.polyline, 
                                                     'act_totalElevGain', cv(act.total_elevation_gain, 'int'),
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
                                                     'act_dist', cv(act.distance, 'float'),
                                                     'act_elapsed_time', cv(act.elapsed_time.total_seconds(), 'int'),
                                                     'act_gear_id', unicode(act.gear_id),
                                                     'act_kilojoules', cv(act.kilojoules, 'int'),
                                                     'act_kudos_count', cv(act.kudos_count, 'int'),
                                                     'act_manual', act.manual,
                                                     'act_max_heartrate', cv(act.max_heartrate, 'int'),
                                                     'act_max_speed', cv(act.max_speed, 'int'),
                                                     'act_moving_time', cv(act.moving_time.total_seconds(), 'int'),
                                                     'act_total_photo_count', cv(act.photo_count, 'int'),
                                                     'act_workout_type', cv(act.workout_type, 'int'),
                                                     act_id)
        connection.execute(args)
        return args

"Get a list of activites to update from the database"
ath_table = pd.read_sql(""" SELECT ath_id, api_code from "Athlete" """, engine_prod)
ath_lst = ath_table['ath_id'].tolist()
api_code_lst = ath_table['api_code'].tolist()
result_list = []
def log_result(result):
    # This is called whenever foo_pool(i) returns a result.
    # result_list is modified only by the main process, not the pool workers.
    result_list.append(result)

if __name__ == "__main__":

    '''
    pool = multiprocessing.Pool(multiprocessing.cpu_count()-1)
    results = pool.imap(update_acts, (act_lst, ))
    pool.close()
    pool.join()
    print(result_list)
    '''
    for i in range(len(ath_lst)):
        try:
            client = stravalib.client.Client(access_token=api_code_lst[i])
        except:
            print 'no access to that athlete - trying public update'
            client = stravalib.client.Client(access_token=public_token)

        ath_id = ath_lst[i]
        act_lst = pd.read_sql(""" SELECT act_id from "Activity" Where
                          polyline is null and
                          act_gear_id is null and
                          ath_id = %s""" %(ath_id), engine_prod)['act_id'].tolist()

        for act_id in act_lst:
            print ath_id, act_id
            try:
                args = update_acts(client, act_id)
                print args
            except:
                print 'error getting activity!  Moving on...'
            
            print 'complete!'
