import stravalib
import pandas as pd
import os
from sqlalchemy import create_engine
from datetime import datetime
import json

#GLOBAL (FIX THIS BEFORE PRODUCITON)
client = stravalib.client.Client(access_token=os.environ['STRAVA_APICODE'])

def get_segs_from_api(client, extents, act_type):
    """Get segments for a client in extents [40.681, -89.636, 40.775, -89.504]
    with act_type riding or running.
    """
    segment_explorer = client.explore_segments(extents,
                                               activity_type=act_type)
    return segment_explorer


def seg_to_df(segment_explorer):
    """convert segment objects to a dataframe.  Return the dataframe"""
    dflist = []
    for seg in segment_explorer:
        print 'seg id %s, seg name %s, seg dist %s' % \
               (seg.id, seg.name, seg.distance)

        seg_id = seg.id
        seg_detail = client.get_segment(seg_id)
        newrow = {'seg_id' : int(seg_id),
                  'name' : str(seg.name),
                  'act_type' : seg_detail.activity_type,
                  'elev_low' : float(seg_detail.elevation_low),
                  'elev_high' : float(seg_detail.elevation_high),
                  'start_lat' : float(seg_detail.start_latitude),
                  'start_long' : float(seg_detail.start_longitude),
                  'end_lat' : float(seg_detail.end_latitude),
                  'end_long' : float(seg_detail.end_longitude),
                  'date_created' : seg_detail.created_at.replace(tzinfo=None),
                  'effort_cnt' : int(seg_detail.effort_count),
                  'ath_cnt' : int(seg_detail.athlete_count),
                  'cat' : int(seg.climb_category),
                  'elev_gain' : float(seg.elev_difference),
                  'distance' : float(seg.distance),
                  'seg_points' : str(seg.points),
                  #'seg_linestring' : str(PolylineCodec().decode(seg.points))
                 }
        dflist.append(newrow)
    
    seg_df = pd.DataFrame(dflist)
        
    return seg_df

def create_points(lat_series, long_series):
    # Creates a string from a lat/long column to map to a Geography Point
    # datatype in PostGIS
    point_col = 'Point(' + str(long_series) + ' ' + str(lat_series) + ')'

    return point_col

def get_acts_in_db(engine, table_name):
    # Return a list of already cached segments in the database
    already_dl_seg_id_list = []
    try:
        args = 'SELECT seg_id from "%s"' % (table_name)
        df = pd.read_sql(args, engine)
        already_dl_seg_id_list = df['seg_id']
    except:
        print "no activities in database!  downloading all segments in range..."

    return already_dl_seg_id_list


def clean_cached_segs(dl_lst, new_seg_df):
    # Remove segments already in database from the dataframe
    new_seg_df['rows_to_drop'] = new_seg_df['seg_id'].isin(dl_lst)
    new_seg_df.drop(new_seg_df[new_seg_df.rows_to_drop==True].index, inplace=True)
    return new_seg_df

def get_seg_geojson(engine, startLat, startLong, endLat, endLong, act_type):
    #[40.8, -89.7, 40.9, -89.6]
    segment_explorer = get_segs_from_api(client, [startLat, startLong, endLat, endLong], act_type)
    seg_df = seg_to_df(segment_explorer)
    
    #Update lat/long to PostGIS geometry Point types
    seg_df['start_point'] = map(create_points, seg_df['start_lat'], seg_df['start_long'])
    seg_df['end_point'] = map(create_points, seg_df['end_lat'], seg_df['end_long'])
    
    #do not write new segments to the database
    seg_df = clean_cached_segs(get_acts_in_db(engine, 'Segment'), seg_df)
	
	#Clean out the df and write to the database
    seg_df.set_index('seg_id', inplace=True)
    seg_df.drop(['start_lat','start_long','end_lat','end_long', 'rows_to_drop'], axis=1, inplace=True)
    seg_df.to_sql('Segment', engine, if_exists='append', index=True, index_label='seg_id')

    #Now get the results from the database
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
                                round((lg.distance)::numeric,1) as dist) as t
                                 ) as properties
                            FROM "Segment" as lg 
                                  WHERE ST_Contains(ST_Envelope(ST_GeomFromText('LINESTRING(%s %s, %s %s)')), lg.start_point)
                     ) as f) as fc"""  % (startLong, startLat, endLong, endLat)

    result = engine.execute(geojson_sql)
    for row in result:
        data = row.values()

    geojson_data = str(json.dumps(data)[1:-1])
    return geojson_data
