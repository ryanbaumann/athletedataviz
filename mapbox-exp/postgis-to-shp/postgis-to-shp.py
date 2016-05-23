import subprocess
import os

db_host = os.environ['db_host_adv']
db_user = os.environ['db_user_adv']
db_pass = os.environ['db_pass_adv']
db_name = os.environ['db_name_adv']

args = '''
        "SELECT 
        seg_id, last_updated_datetime_utc, act_type, ath_cnt, cat,date_created, distance, effort_cnt, 
        elev_gain, elev_high, elev_low, name, avg_grade, max_grade, total_elevation_gain, linestring 
        FROM ""V_Segment""
        '''

pgsql2shp - f all_segments - h ec2 - 52 - 71 - 220 - 14.compute - 1.amazonaws.com - u ud3fimvrrn18fu - P p87a8j3h644qa1a6g1cge2qdtgl d9g0tctvfg0d4s
