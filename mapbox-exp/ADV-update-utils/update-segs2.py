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
import time
import logging
working_folder = r'C:\Projects\athletedataviz\website\athletedataviz_v1-0\mapbox-exp\ADV-update-utils'
os.chdir(working_folder)
logging.basicConfig(filename='log/adv_update_segs.log',
                    level=logging.INFO, format='%(asctime)s %(message)s')

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
    seg_count = 0
    try:
        logging.info('getting segment ids from database')
        table_name = 'Segment'
        args = 'SELECT seg_id from "%s" Where ath_cnt=0' % (table_name)
        df = pd.read_sql(args, engine_prod)
        already_dl_seg_id_list = df['seg_id'].unique()
        total_segs = df['seg_id'].count()
        logging.info('got seg ids!')
        print already_dl_seg_id_list
    except Exception as e:
        logging.exception("no activities in database!  downloading all segments in range...")

    dflist = []
    for segid in already_dl_seg_id_list:
        seg_count += 1
        logging.info('getting seg %s' %(segid))
        try:
            seg_detail = client.get_segment(segid)
        except Exception as e:
            logging.exception('error getting seg detail')
            time.sleep(60)
            pass

        logging.info('seg %s of %s' %(seg_count, total_segs))
        connection = engine_prod.connect()
        updaterow = {'seg_id' : int(segid),
                      'elev_low' : cv(seg_detail.elevation_low, 'float'),
                      'elev_high' : cv(seg_detail.elevation_high, 'float'),
                      'date_created' : seg_detail.created_at.replace(tzinfo=None),
                      'effort_cnt' : cv(seg_detail.effort_count, 'float'),
                      'ath_cnt' : cv(seg_detail.athlete_count, 'int'),
                      'avg_grade' : cv(seg_detail.average_grade, 'float'),
                      'max_grade' : cv(seg_detail.maximum_grade, 'float'),
                      'total_elevation_gain' : cv(seg_detail.total_elevation_gain, 'int')
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

        connection.execute(args)
        connection.close()
    logging.info('program complete!  Updated all segs in db')
