

-- DROP VIEW "V_Stream_Linestring_Heat_Geojson";

CREATE OR REPLACE VIEW "V_Stream_Linestring_Heat_Geojson" AS 
 SELECT row_to_json(fc.*) AS row_to_json
   FROM ( SELECT 'FeatureCollection' AS type,
            array_to_json(array_agg(f.*)) AS features
           FROM ( SELECT 'Feature' AS type,
                    st_asgeojson(lg.point)::json AS geometry,
                    row_to_json(( SELECT l.*::record AS l
                           FROM ( SELECT lg.act_id, 
                                         round(lg.density::numeric,1) as d,
                                         round(lg.speed::numeric,1) as s,
                                         round(lg.grade::numeric,1) as g) l)) AS properties
                   FROM "V_Act_Heat" lg) f) fc;

