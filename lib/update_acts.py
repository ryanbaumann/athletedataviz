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

client = stravalib.client.Client(access_token=os.environ['STRAVA_APICODE'])
athlete = client.get_athlete()
print 'athlete name %s, athlete id %s.' % (athlete.firstname, athlete.id)

connection = engine.connect()


def update_acts(act_id):
    """
    Updates an activity int the database.  Accepts an activity ID list.
    """
    print str(act_id)
    act = client.get_activity(act_id)
    polyline = act.map.polyline
    args = """ UPDATE "Activity"
                       Set %s = '%s'
                       WHERE act_id = %s and polyline is null""" % ('polyline', polyline, act_id)
    try:
        result = connection.execute(args)
    except:
        print 'error updating athlete! resuming...'
        raise
        pass

    return act_id

"Get a list of activites to update from the database"
act_lst = pd.read_sql("""SELECT act_id from "Activity" Where ath_id=1705436
                          and polyline is null limit 100""", engine)['act_id'].tolist()
print act_lst


if __name__ == '__main__':
    num_cores = multiprocessing.cpu_count()

    if num_cores > 1:
        pool = multiprocessing.Pool(num_cores-1)
    else:
        pool = multiprocessing.Pool(1)

    try:
        resutls = pool.map(update_acts, act_lst)
    except:
        KeyboardInterrupt
        exit()
