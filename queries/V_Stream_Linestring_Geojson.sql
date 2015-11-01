-- View: "V_Stream_LineString_Geojson"

-- DROP VIEW "V_Stream_LineString_Geojson";

CREATE OR REPLACE VIEW "V_Stream_LineString_Geojson" AS 
 SELECT row_to_json(fc.*) AS row_to_json
   FROM ( SELECT 'FeatureCollection' AS type,
            array_to_json(array_agg(f.*)) AS features
           FROM ( SELECT 'Feature' AS type,
                    st_asgeojson(lg.linestring)::json AS geometry,
                    row_to_json(( SELECT l.*::record AS l
                           FROM ( SELECT lg.act_id) l)) AS properties
                   FROM "V_Stream_LineString" lg) f) fc;

ALTER TABLE "V_Stream_LineString_Geojson"
  OWNER TO postgres;
