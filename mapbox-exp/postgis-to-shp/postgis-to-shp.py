from subprocess import Popen
import os
import datetime
import zipfile
from zipfile import ZipFile
import fnmatch
try:
    import zlib
    compression = zipfile.ZIP_DEFLATED
except:
    compression = zipfile.ZIP_STORED
import mapbox
import boto
import requests
import time
import logging

working_folder = r'C:\Projects\athletedataviz\website\athletedataviz_v1-0\mapbox-exp\postgis-to-shp'
data_dir = r'C:\Projects\athletedataviz\website\athletedataviz_v1-0\mapbox-exp\postgis-to-shp'

os.chdir(working_folder)
logging.basicConfig(filename='log/adv_export_shp.log',
                    level=logging.INFO, format='%(asctime)s %(message)s')

db_host = os.environ['db_host_adv']
db_user = os.environ['db_user_adv']
db_pass = os.environ['db_pass_adv']
db_name = os.environ['db_name_adv']

seg_sql = '''SELECT * FROM ""V_Segment""'''
act_sql = '''SELECT * FROM ""V_Activity_Linestring""'''

i = datetime.datetime.now()
seg_out_file_name = 'ADV_all_segments'
act_out_file_name = 'ADV_all_acts'

args_seg_shp_export = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(seg_out_file_name,
                                                                               db_host,
                                                                               db_user,
                                                                               db_pass,
                                                                               db_name,
                                                                               seg_sql)

args_act_shp_export = 'pgsql2shp -f {0} -h {1} -u {2} -P {3} {4} "{5}"'.format(act_out_file_name,
                                                                               db_host,
                                                                               db_user,
                                                                               db_pass,
                                                                               db_name,
                                                                               act_sql)


def zip_like_files(working_folder, filePattern):
    """
    Zip files in a folder starting with a filePattern.  Outputs a compressed zip file
    in the working folder with the name filePattern.zip
    """
    all_files = os.listdir(working_folder)
    print 'looking for files matching %s in %s... %s' % (filePattern,
                                                         working_folder,
                                                         all_files)
    files = []
    for f in all_files:
        if fnmatch.fnmatch(f, filePattern + '*'):
            print f
            files.append(f)
    os.chdir(working_folder)

    try:
        logging.info('archiving existing zip file')
        os.rename(filePattern + '.zip', 'archive/' + filePattern + '.zip')
    except Exception as e:
        logging.exception(
            'no existing zip archive to remove!')
        pass

    with ZipFile(filePattern + '.zip', 'w') as myzip:

        for f in files:
            print 'adding %s to zip!' % (str(f))
            myzip.write(f, compress_type=compression)
            if not f.endswith('.prj') or not f.endswith('.qpj'):
                logging.info('deleting file %s' %(f))
                os.remove(f)
            else:
                logging.info('skipping deletion of prj and qpj files %s' %(f))
        myzip.close()


if __name__ == "__main__":
    os.chdir(working_folder)
    logging.info('getting activity shp...')
    p2 = Popen(args_act_shp_export)
    p2.wait()
    
    try:
        logging.info('completed shp file export, now zipping')
        zip_like_files(working_folder, act_out_file_name)
        logging.info('completed act file zip ' + act_out_file_name)
    except Exception as e:
        logging.exception(
            'error exporting SHP files from POSTGIS to file for acts')
        pass

    logging.info('getting segment shp...')

    p1 = Popen(args_seg_shp_export)
    p1.wait()
    logging.info('completed shp file export')
    try:
        zip_like_files(working_folder, seg_out_file_name)
        logging.info('completed seg file zip ' + seg_out_file_name)
    except Exception as e:
        logging.exception(
            'error exporting SHP files from POSTGIS to file for segs')
        pass

    from boto.s3.connection import S3Connection
    from boto.s3.key import Key
    from boto import s3
    import json

    logging.info('uploading files to mapbox api')
    token = os.environ['ADV_Mapbox_Uploads_Token']

    try:
        get_s3_url = 'https://api.mapbox.com/uploads/v1/rsbaumann/credentials' \
            + '?access_token=' + token

        resp = requests.get(get_s3_url)
        data = json.loads(resp.text)

        conn = s3.connect_to_region('us-east-1',
                                    aws_access_key_id=data['accessKeyId'],
                                    aws_secret_access_key=data[
                                        'secretAccessKey'],
                                    security_token=data['sessionToken']
                                    )

        mybucket = conn.get_bucket(data['bucket'],
                                   validate=False,
                                   headers={
                                       'x-amz-security-token': str(data['sessionToken'])}
                                   )
        logging.info(
            'successfuly got S3 staging credentials for Mapbox Upload API')
    except Exception as e:
        logging.exception('error getting S3 credentails from Mapbox upload API and connecting')
        pass

    try:
        k = Key(mybucket)
        k.key = data['key']
        os.chdir(data_dir)
        k.set_contents_from_filename(act_out_file_name + '.zip')
        k.set_contents_from_filename(seg_out_file_name + '.zip')
        logging.info('successfully staged zip files on AWS S3 bucket')
    except Exception as e:
        logging.exception('error uploading files to S3 staging bucket')
        pass

    os.chdir(data_dir)

    from mapbox import Uploader
    service = Uploader(access_token=token)

    try:
        with open(seg_out_file_name + '.zip', 'r') as src:
            upload_resp_seg = service.upload(src, 'ADV_all_segments')
        with open(act_out_file_name + '.zip', 'r') as src:
            upload_resp_act = service.upload(src, 'ADV_all_activities')

        upload_id_act = upload_resp_act.json()['id']
        upload_id_seg = upload_resp_seg.json()['id']

        status_resp_act = service.status(upload_id_act).json()
        status_resp_seg = service.status(upload_id_seg).json()
        logging.info('successfully uploaded files to Mapbox account')

    except Exception as e:
        logging.exception('error uploading Mapbox files using Uploads API to acount')
        pass

    try:
        for i in range(10):
            status_resp_seg = service.status(upload_id_seg).json()
            status_resp_act = service.status(upload_id_act).json()
            if (status_resp_seg['complete'] and status_resp_act['complete']):
                logging.info(
                    'processing complete for all uploaded files on Mapbox!')
                break
            else:
                logging.info(
                    'waiting 5 seconds, files still processing on Mapbox')
                time.sleep(5)
    except Exception as e:
        logging.exception('error validating Mapbox API upload status')
        pass

    logging.info('program complete - exiting')
    print 'program complete - exiting'
