import stravalib
import pandas as pd
import os
from sqlalchemy import create_engine
from datetime import datetime
import json

# GLOBAL (FIX THIS BEFORE PRODUCITON)
client = stravalib.client.Client(access_token=os.environ['STRAVA_APICODE'])


def get_segs_from_api(client, extents, act_type):
    """Get segments for a client in extents [40.681, -89.636, 40.775, -89.504]
    with act_type riding or running.
    """
    segment_explorer = client.explore_segments(extents,
                                               activity_type=act_type)
    return segment_explorer


def seg_to_df(segment_explorer, act_type, engine, startLat, startLong, endLat, endLong):
    dflist = []
    if act_type == 'riding':
        acttype = 'ride'
    else:
        acttype = 'run'
    dl_list = get_segs_in_db(engine, 'Segment', startLat, startLong, endLat, endLong, acttype).tolist()
    for seg in segment_explorer:
        seg_id = int(seg.id)
        if seg_id not in dl_list:
            print 'seg id %s' % (seg_id)
            newrow = {'seg_id': int(seg_id),
                      'name': unicode(seg.name),
                      'act_type': str(acttype),
                      'elev_low': 0,  # float(seg_detail.elevation_low),
                      'elev_high': 0, # float(seg_detail.elevation_high),
                      'start_lat': float(seg.start_latlng[0]),
                      'start_long': float(seg.start_latlng[1]),
                      'end_lat': float(seg.end_latlng[0]),
                      'end_long': float(seg.end_latlng[1]),
                      'date_created': datetime.utcnow(), # seg_detail.created_at.replace(tzinfo=None),
                      'effort_cnt': 0,  # int(seg_detail.effort_count),
                      'ath_cnt': 0,  # int(seg_detail.athlete_count),
                      'cat': int(seg.climb_category),
                      'elev_gain': float(seg.elev_difference),
                      'distance': float(seg.distance),
                      'seg_points': str(seg.points)
                      }
            dflist.append(newrow)

    if len(dflist)>0:
        seg_df = pd.DataFrame(dflist)
        return seg_df
    else:
        return None

def create_points(lat_series, long_series):
    # Creates a string from a lat/long column to map to a Geography Point
    # datatype in PostGIS
    point_col = 'Point(' + str(long_series) + ' ' + str(lat_series) + ')'

    return point_col


def get_segs_in_db(engine, table_name, startLat, startLong, endLat, endLong, acttype):
    # Return a list of already cached segments in the database
    already_dl_seg_id_list = []
    try:
        args = """SELECT seg_id from "%s" 
               Where ST_Contains(ST_Envelope(ST_GeomFromText('LINESTRING(%s %s, %s %s)')), 
                                 start_point) AND act_type='%s' """  % (table_name, startLong, startLat, 
                                                        endLong, endLat, acttype)
        df = pd.read_sql(args, engine)
        already_dl_seg_id_list = df['seg_id']
    except:
        print "no activities in database!  downloading all segments in range..."

    return already_dl_seg_id_list


def get_seg_geojson(engine, startLat, startLong, endLat, endLong, act_type):
    """Get the geojson segment linestring object from the database
    """

    if act_type == 'riding':
        acttype = 'ride'
    else:
        acttype = 'run'

    segment_explorer = get_segs_from_api(
        client, [startLat, startLong, endLat, endLong], act_type)

    seg_df = seg_to_df(segment_explorer, act_type, engine, startLat, startLong, endLat, endLong)

    # Update lat/long to PostGIS geometry Point types
    if seg_df is not None:
        seg_df['start_point'] = map(
            create_points, seg_df['start_lat'], seg_df['start_long'])
        seg_df['end_point'] = map(
            create_points, seg_df['end_lat'], seg_df['end_long'])

        # I updated this to only populate the dataframe if the segment is new - no need to delete here
        #seg_df = clean_cached_segs(get_segs_in_db(engine, 'Segment',
        #                                         startLat, startLong, endLat, endLong), seg_df)

            # Clean out the df and write to the database
        seg_df.set_index('seg_id', inplace=True)
        seg_df.drop(['start_lat', 'start_long', 'end_lat',
                     'end_long'], axis=1, inplace=True)
        seg_df.to_sql(
            'Segment', engine, if_exists='append', index=True, index_label='seg_id')

    # Now get the results from the database
    geojson_sql = """
                SELECT row_to_json(fc) 
     FROM (SELECT 'FeatureCollection' As type, 
                  array_to_json(array_agg(f)) As features
           FROM (SELECT 'Feature' As type, 
                  st_asgeojson(st_LineFromEncodedPolyline(lg.seg_points, 4))::json AS geometry,
                  (
                  select row_to_json(t) 
                  FROM (SELECT lg.name as name,
                                lg.act_type as type,
                                round((lg.distance*0.000621371)::numeric,1) as dist,
                                round((lg.elev_gain*3.28084)::numeric,1) as elev) as t
                                 ) as properties
                            FROM "Segment" as lg 
                                  WHERE ST_Contains(ST_Envelope(ST_GeomFromText('LINESTRING(%s %s, %s %s)')), lg.start_point)
                                  AND lg.act_type = '%s'
                     ) as f) as fc"""  % (startLong, startLat, endLong, endLat, acttype)

    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data)[1:-1])
    return geojson_data
