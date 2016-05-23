from subprocess import Popen
import os

db_host = os.environ['db_host_adv']
db_user = os.environ['db_user_adv']
db_pass = os.environ['db_pass_adv']
db_name = os.environ['db_name_adv']

sql = '''SELECT seg_id, last_updated_datetime_utc, act_type, ath_cnt, cat,date_created, distance, effort_cnt, elev_gain, elev_high, elev_low, name, avg_grade, max_grade, total_elevation_gain, linestring FROM ""V_Segment""'''

out_file_name = 'all_segments'

args_shp_export = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(out_file_name,
                                                                          db_host,
                                                                          db_user,
                                                                          db_pass,
                                                                          db_name,
                                                                          sql)

args_shp_export = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(out_file_name,
                                                                          db_host,
                                                                          db_user,
                                                                          db_pass,
                                                                          db_name,
                                                                          sql)

if __name__ == "__main__":
    Popen(args_shp_export, shell=True)
