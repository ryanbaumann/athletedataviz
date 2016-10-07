#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, json
from stravalib import client, unithelper
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from unidecode import unidecode

def coerce_uni(string):
    ''' coerce ascii2 unicode for a string'''
    if string:
        string = unicode(unidecode(string))
    return string

def GetActivities(client, startDate, endDate, limit):
    # Returns a list of Strava activity objects, up to the number specified by
    # limit
    startDate = datetime.strptime(startDate, '%Y-%m-%d')
    endDate = datetime.strptime(endDate, '%Y-%m-%d')
    print "limit is: " + str(limit)
    activities = client.get_activities(before=endDate,
                                       after=startDate,
                                       limit=limit)
    return activities


def GetStreams(client, activity, types, resolution):
    # Returns a Strava 'stream', which is timeseries data from an activity
    streams = client.get_activity_streams(activity,
                                          types=types,
                                          series_type='distance',
                                          resolution=resolution)
    return streams


def DataFrame(dict, types):
    # Converts a Stream into a dataframe, and returns the dataframe
    df = pd.DataFrame()
    for item in types:
        if item in dict.keys():
            df.append(item.data)
    df.fillna('', inplace=True)
    return df


def ParseActivity(client, act, types, resolution):
    # Parses an activity from an athlete into a dataframe.  Returns the
    # dataframe
    act_id = act.id
    name = coerce_uni(act.name)
    streams = GetStreams(client, act_id, types, resolution)
    df = pd.DataFrame()
    # Write each row to a dataframe
    for item in types:
        try:
            if item in streams.keys():
                df[item] = pd.Series(streams[item].data, index=None)
        except:
            pass
        df['act_id'] = act.id
        df['act_startDate'] = pd.to_datetime(act.start_date_local)
    return df


def get_acts_in_db(engine, table_name):
    # Return a list of already cached activities in the database
    already_dl_act_id_list = []
    try:
        args = 'SELECT Distinct act_id from "%s"' % (table_name)
        df = pd.read_sql(args, engine)
        already_dl_act_id_list = df['act_id'].tolist()
    except:
        print "no activities in database!  downloading all activities in range..."

    return already_dl_act_id_list


def check_if_new_act(act_list, already_dl_act_id_list):
    # Returns new activities not yet in the database
    for act in list(act_list):
        if act.id in already_dl_act_id_list:
            act_list.remove(act)

    return act_list


def loop_activities(client, activities, already_dl_act_id_list, types):
    # Loops through a list of activities, creating a dict of dataframes, one
    # entry for each activity
    df_lst = {}
    for act in activities:
        if act.id not in already_dl_act_id_list:
            df_lst[act.start_date] = ParseActivity(client, act, types)
    return df_lst


def calctime(time_sec, startdate):
    # calculates timestamp from the elapsed time.  Returns a datetime value.
    timestamp = startdate + timedelta(seconds=float(time_sec))

    return timestamp


def split_lat(series):
    # splits a list and retunrs the 0th item.
    lat = series[0]
    return lat


def split_long(series):
    # splits a list and retunrs the 1th item.
    long = series[1]
    return long


def create_points(lat_series, long_series):
    # Creates a string from a lat/long column to map to a Geography Point
    # datatype in PostGIS
    point_col = 'Point(' + str(long_series) + ' ' + str(lat_series) + ')'

    return point_col


def concatdf(df_lst):
    # concatenate a dictionary of dataframes into one dataframe.  Returns the
    # concat'ed dataframe
    if df_lst:
        try:
            df = pd.concat(df_lst,
                           ignore_index=False,
                           copy=False)
        except:
            print "error concatenating dataframes!"
    else:
        df = pd.DataFrame()

    return df


def cleandf(df_total):
    # Applies a number of functions to clean out a dataframe for final
    # processing
    df_total.fillna(0, inplace=True)
    df_total.reset_index(level=0, inplace=True)
    df_total['timestamp'] = map(
        calctime, df_total['time'], df_total['act_startDate'])
    df_total['timestamp'].astype('datetime64[ns]')
    df_total['lat'] = map(split_lat, (df_total['latlng']))
    df_total['long'] = map(split_long, (df_total['latlng']))
    df_total.drop(['latlng', 'act_startDate', 'index'], axis=1, inplace=True)
    df_total['point'] = map(create_points, df_total['lat'], df_total['long'])
    df_total.rename(columns={'time': 'elapsed_time',
                             'distance': 'elapsed_dist'},
                    inplace=True)

    return df_total


def process_activities(client, limit, types, engine, table_name):
    # Applies a number of functions to get and convert and clean
    activities = GetActivities(client, limit)
    already_dl_act_id_list = get_acts_in_db(engine, table_name)
    df_total = loop_activities(
        client, activities, already_dl_act_id_list, types)
    df_total = concatdf(df_total)
    try:
        if not df_total.empty:
            df_total = cleandf(df_total)
        else:
            print "no new data to clean"
    except:
        return pd.DataFrame()

    return df_total


def df_to_csv(df, dst_file):
    # Writes a dataframe to a csv file. Returns none
    print "writing data to csv..."
    df.to_csv(dst_file, chunksize=100)
    # except:
    #    print "error writing file to CSV!"

    return None


def zip_and_delete(src_file, dst_file):
    # Zips up and deletes a file.  Returns none.
    print "zipping and deleting file..."
    try:
        with zipfile.ZipFile(dst_file, 'w', zipfile.ZIP_DEFLATED) as myzip:
            myzip.write(src_file)
            os.remove(src_file)
    except:
        print "error zipping file!"
    return None


def fully_process_acts(client, limit, types, csv_file, zip_file, engine, table_name):
    df = process_activities(client, limit, types, engine, table_name)
    no_new_data = False
    if df.empty:
        no_new_data = True
        args = 'SELECT * from "%s"' % (table_name)
        df = pd.read_sql(args, engine)

    df_to_csv(df, csv_file)
    zip_and_delete(csv_file, zip_file)

    return df, df.ix[[0, 1, 2, 3, 4, 5]], no_new_data


def drop_table(engine, table_name):
    try:
        print "dropping table and views... " + table_name
        engine.execute('DROP TABLE "%s" CASCADE; COMMIT;' % (table_name))
        print "table dropped successfully!"
        engine.execute('DROP INDEX IF EXISTS id_geog_actid CASCADE; COMMIT;')
        print "index dropped successfully!"
    except:
        print "error dropping table! " + table_name


def df_to_postgis_db(df, engine, table_name, no_new_data):
    # Write a dataframe to a PostGIS database.  Returns none.
    if no_new_data == False:

        try:
            engine.execute("CREATE EXTENSION postgis;")
        except:
            print "postgis extension already instealled!"

        # create table for the data
        meta = MetaData(engine)
        my_table = Table(table_name, meta,
                         Column('id', Integer),
                         Column('act_startDate', DateTime),
                         Column('timestamp', DateTime),
                         Column('time', Float),
                         Column('act_id', Float),
                         Column('act_name', VARCHAR(100)),
                         Column('distance', Float),
                         Column('altitude', Float),
                         Column('velocity_smooth', Float),
                         Column('grade_smooth', Float),
                         Column('lat', Float),
                         Column('long', Float),
                         )

        Index('id_geog_actid',
              my_table.c.id,
              my_table.c.act_id)

        try:
            print "Creating table..."
            my_table.create(engine)
            print "adding point column..."
            engine.execute(
                'ALTER TABLE "%s" ADD "point" geography(POINT,4326);' % (table_name))
            print "created table " + table_name
        except:
            print "table already exists!  Appending existing table with more data..."

        print "Write data to database..."
        df.to_sql(table_name, engine,
                  if_exists='append',
                  chunksize=500,
                  index=True,
                  index_label='id')
        print "inserted data into table!"

        print "creating view..."
        my_view = 'SELECT ath_id, act_id, act_name, ST_MakeLine(st_point(long, lat) ORDER BY id) AS linestring \
                   FROM "%s" GROUP BY act_id, act_name;' % (table_name)

        try:
            engine.execute('CREATE OR REPLACE VIEW V_%s_LS AS ' %
                           (table_name) + my_view)
        except:
            print "error creating view! - HEADS UP FOR PROBLEMS!"

    return 'v_%s_ls'.lower() % (table_name)


def to_geojson_file(engine, view_name, filename):
    # check the output, this geojson isn't perfect as expected...
    geojson_sql = "SELECT row_to_json(fc) \
                   FROM (SELECT 'FeatureCollection' As type, \
                        array_to_json(array_agg(f)) As features \
                        FROM (SELECT 'Feature' As type, \
                                ST_AsGeoJSON(linestring)::json As geometry, \
                                row_to_json((SELECT l \
                                    FROM (SELECT act_id, act_name) As l)) \
                                As properties \
                            FROM %s As lg) \
                        As f ) \
                    As fc;" % (view_name)

    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data))
    #geojson_data = [dict(row) for row in result]

    with open(filename, 'w') as f:
        try:
            f.writelines(str(geojson_data)[1:-1])
        except:
            "error exporting geojson!  Try again later :("

    return None


def to_geojson_data(engine, view_name, ath_id):
    # check the output, this geojson isn't perfect as expected...
    geojson_sql = "SELECT row_to_json(fc) \
                   FROM (SELECT 'FeatureCollection' As type, \
                        array_to_json(array_agg(f)) As features \
                        FROM (SELECT 'Feature' As type, \
                                ST_AsGeoJSON(linestring,6)::json As geometry, \
                                row_to_json((SELECT l \
                                    FROM (SELECT act_id as id, act_name as na, act_type as ty) As l)) \
                                As properties \
                            FROM %s As lg \
                            WHERE lg.ath_id=%s) \
                        As f ) \
                    As fc;" % (view_name, str(ath_id))
    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data)[1:-1])
    return geojson_data


def to_geojson_points(engine, view_name, ath_id):
    # get an output of geojson points
    geojson_sql = """
                SELECT ST_AsGeoJson(r)::json
                FROM  (
                    SELECT ST_Union(point) AS r 
                    FROM %s
                    Where ath_id = %s) as foo """ % (view_name, str(ath_id))

    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data)[1:-1])
    return geojson_data


def get_acts_centroid(engine, ath_id):
    args = """
        SELECT ST_XMax(r) AS long, ST_YMax(r) AS lat
        FROM  (
            SELECT ST_Centroid(ST_Union(Point)) AS r 
            FROM "V_Stream_Activity"
            WHERE
            ath_id = %s and random() < 0.01) as foo """ % (str(ath_id))

    # Second get a list of points to draw for the heatmap as geojson
    try:
        print "getting map centroid from db..."
        ext = engine.execute(args)
        for item in ext:
            avg_long, avg_lat = item[0], item[1]
    except:
        print "error retrieving map extents!"
    return avg_long, avg_lat


def get_heatmap_points(engine, ath_id):
    args3 = """
            Select row_to_json(fc)::json
            FROM(
            SELECT array_to_json(array_agg(f))::json as points
            FROM(
                SELECT 
                round(st_y(point)::numeric,3) as lt, 
                round(st_x(point)::numeric,3) as lg, 
                round((density)::numeric,1) as d,
                round((speed*2.23694)::numeric,1) as s,
                round((grade)::numeric,1) as g
                FROM 
                "V_Point_Heatmap"
                WHERE ath_id = %s
                ) as f) as fc;""" % (str(ath_id))
    args4 = """
            Select row_to_json(fc)::json
            FROM(
            SELECT array_to_json(array_agg(f))::json as points
            FROM(
                SELECT 
                round(st_y(point)::numeric,3) as lt, 
                round(st_x(point)::numeric,3) as lg, 
                round((density)::numeric,1) as d,
                round((speed)::numeric,1) as s,
                round((grade)::numeric,1) as g
                FROM 
                "Stream_HeatPoint"
                WHERE ath_id = %s
                ) as f) as fc;""" % (str(ath_id))

    print "calculating heatmap points from db..."
    result = engine.execute(args3)
    for row in result:
        data = row.values()
    heatpoints = str(json.dumps(data)[1:-1])
    return heatpoints


def get_acts_html(engine, ath_id):
    args = """ 
            SELECT "act_startDate" as "Date",
                    act_type as "Type",
                    act_name as "Activity Name"
            FROM "Activity"
            WHERE ath_id = %s
            Order by act_id desc""" % (str(ath_id))
    df = pd.read_sql(args, engine)
    df.sort_values(['Date'], axis=0, ascending=False, inplace=True)
    df.index += 1
    df.index.name = 'Activity #'

    return df


def get_heatmap_lines(engine, ath_id):
    geojson_sql = """
                SELECT row_to_json(fc) 
     FROM (SELECT 'FeatureCollection' As type, 
                  array_to_json(array_agg(f)) As features
           FROM (SELECT 'Feature' As type, 
                  st_asgeojson(lg.point, 6)::json AS geometry,
                  (
                  select row_to_json(t) 
                  FROM (SELECT round((lg.density)::numeric,1) as d,
                                round((lg.speed*2.23694)::numeric,1) as s,
                                round((lg.grade)::numeric,1) as g,
                                round((lg.elev*3.28084)::numeric,0) as e,
                                round((lg.power)::numeric,0) as p,
                                round((lg.hr)::numeric,0) as h,
                                round((lg.cadence)::numeric,0) as c) as t
                                 ) as properties
                            FROM "V_Point_Heatmap" as lg WHERE ath_id = %s
                     ) as f) as fc"""  % (ath_id)

    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data)[1:-1])
    return geojson_data