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

working_folder = r'C:\Projects\athletedataviz\website\athletedataviz_v1-0\mapbox-exp\postgis-to-shp\output'

def zip_like_files(working_folder, filePattern):
    """
    Zip files in a folder starting with a filePattern.  Outputs a compressed zip file
    in the working folder with the name filePattern.zip
    """
    all_files = os.listdir(working_folder)
    print 'looking for files matching %s in %s... %s' %(filePattern, 
                                                        working_folder, 
                                                        all_files)
    files = []
    for f in all_files:
        if fnmatch.fnmatch(f, filePattern+'*'):
            print f
            files.append(f)

    with ZipFile('output/' + filePattern + '.zip', 'w') as myzip:
        os.chdir(working_folder)
        for f in files:
            print 'adding %s to zip!' %(str(f))
            myzip.write(f, compress_type=compression)
        myzip.close()

zip_like_files(working_folder, 'all_acts_20160528132155')