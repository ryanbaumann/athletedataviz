-- View: public."V_Act_Line_From_Polyline"

-- DROP VIEW public."V_Act_Line_From_Polyline";

CREATE  VIEW "V_Act_GeoJsonLine_From_Polyline" AS 
 SELECT row_to_json(fc.*) AS row_to_json
   FROM ( SELECT 'FeatureCollection' AS type,
            array_to_json(array_agg(f.*)) AS features
           FROM ( SELECT 'Feature' AS type,
                    st_asgeojson(st_linefromencodedpolyline(lg.polyline, 4))::json AS geometry,
                    ( SELECT row_to_json(t.*) AS row_to_json
                           FROM ( SELECT lg.act_name AS name,
                                    lg.act_type AS type) t) AS properties
                   FROM "Activity" lg
                   /*Where lg.ath_id=1705436*/
                   ) f) fc;

