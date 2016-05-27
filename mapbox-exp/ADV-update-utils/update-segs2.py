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
                            convert_unicode=True, pool_size=50)

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

if __name__ == "__main__":
    already_dl_seg_id_list = []
    try:
        print 'getting segment ids from database'
        table_name = 'Segment'
        args = 'SELECT seg_id from "%s" Where ath_cnt=0' % (table_name)
        df = pd.read_sql(args, engine_prod)
        already_dl_seg_id_list = df['seg_id'].unique()
        print 'got seg ids!'
        print already_dl_seg_id_list
    except:
        print "no activities in database!  downloading all segments in range..."

    dflist = []
    for segid in already_dl_seg_id_list:
        print 'getting seg %s' %(segid)
        try:
            seg_detail = client.get_segment(segid)
        except:
            print 'error getting seg detail'
            raise
            pass
        print 'got segment from strava, analyzing'
        connection = engine_prod.connect()
        updaterow = {'seg_id' : int(segid),
                      'elev_low' : float(seg_detail.elevation_low),
                      'elev_high' : float(seg_detail.elevation_high),
                      'date_created' : seg_detail.created_at.replace(tzinfo=None),
                      'effort_cnt' : int(seg_detail.effort_count),
                      'ath_cnt' : int(seg_detail.athlete_count),
                      'avg_grade' : int(seg_detail.average_grade),
                      'max_grade' : int(seg_detail.maximum_grade),
                      'total_elevation_gain' : int(seg_detail.total_elevation_gain)
                     }

        args = """ UPDATE "Segment" 
               Set %s = to_date('%s', 'YYYY-MM-DD HH24:MI:SS'),
               %s = %s,
               %s = %s,
               %s = %s,
               %s = %s,
               %s = %s,
               %s = %s,
               %s = %s
               WHERE seg_id = %s """  %('date_created', updaterow['date_created'],
                'elev_low', updaterow['elev_low'],
                'elev_high', updaterow['elev_high'],
                'effort_cnt', updaterow['effort_cnt'],
                'ath_cnt', updaterow['ath_cnt'],
                'avg_grade', updaterow['avg_grade'],
                'max_grade', updaterow['max_grade'],
                'total_elevation_gain', updaterow['total_elevation_gain'],
                segid)

        print args
        connection.execute(args)
        connection.close()
