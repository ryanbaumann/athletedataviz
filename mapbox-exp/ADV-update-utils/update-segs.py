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

engine = create_engine('postgresql+psycopg2://admin:password@localhost:5432/webdev6',
                       convert_unicode=True)

engine_prod = create_engine(r'postgresql+psycopg2://' + os.environ['ADV_PROD_POSTGRESQL_DB'],
                            convert_unicode=True)

client_secret = os.environ['STRAVA_CLIENT_SECRET_SEGS']
client_id = os.environ['STRAVA_CLIENT_ID_SEGS']
public_token = os.environ['STRAVA_PUBLIC_TOKEN_SEGS']

client = stravalib.client.Client(access_token=public_token)
#athlete = client.get_athlete()
# print 'athlete name %s, athlete id %s.' %(athlete.firstname, athlete.id)

connection = engine_prod.connect()

def update_acts(act_id):
        """
        Updates an activity int the database.  Accepts an activity ID list.
        """
        act = client.get_activity(act_id)
        polyline = act.map.polyline
        args = """ UPDATE "Activity" 
                           Set %s = '%s'
                           WHERE act_id = %s and polyline is null""" % ('polyline', polyline, act_id)
        try:
            connection.execute(args)
        except:
            print 'error updating athlete! resuming...'
            raise
            pass

        return act_id

if __name__ == "__main__":


    "Get a list of activites to update from the database"
    act_lst = pd.read_sql("""SELECT act_id from "Activity" Where
                              polyline is null""", engine)['act_id'].tolist()
    print act_lst

    num_cores = multiprocessing.cpu_count()
    pool = multiprocessing.Pool(num_cores-1)

    """Run the multiprocess pool"""
    resutls = pool.map(update_acts, act_lst)
    print 'complete!'
