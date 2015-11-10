 SELECT row_to_json(fc.*) AS row_to_json
   FROM ( SELECT 'FeatureCollection' AS type,
            array_to_json(array_agg(f.*)) AS features
           FROM ( SELECT 'Feature' AS type,
                    st_asgeojson(lg.linestring)::json AS geometry,
                    row_to_json(( SELECT l.*::record AS l
                           FROM ( SELECT lg.act_id) l)) AS properties
                   FROM "V_Stream_LineString" lg
                   WHERE lg.ath_id=200623) f) fc;