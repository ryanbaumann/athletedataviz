from subprocess import Popen
import os
import datetime

db_host = os.environ['db_host_adv']
db_user = os.environ['db_user_adv']
db_pass = os.environ['db_pass_adv']
db_name = os.environ['db_name_adv']

sql = '''SELECT * FROM ""V_Segment""'''
i = datetime.datetime.now()
out_file_name = 'all_segments_%s' %(i.strftime('%Y%m%d%H%M%S'))

args_shp_export = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(out_file_name,
                                                                          db_host,
                                                                          db_user,
                                                                          db_pass,
                                                                          db_name,
                                                                          sql)

args_shp_export2 = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(out_file_name,
                                                                          db_host,
                                                                          db_user,
                                                                          db_pass,
                                                                          db_name,
                                                                          sql)

if __name__ == "__main__":
    print 'getting shp...'
    print args_shp_export
    Popen(args_shp_export, shell=True)
    print 'complete!'
