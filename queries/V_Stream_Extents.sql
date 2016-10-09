-- View: public."V_Stream_Extents"

-- DROP VIEW public."V_Stream_Extents";

CREATE OR REPLACE VIEW public."V_Stream_Extents" AS 
 SELECT "V_Stream_Activity".ath_id,
    st_centroid(st_extent("V_Stream_Activity".point)::geometry) AS centerpoint,
    st_envelope(st_extent("V_Stream_Activity".point)::geometry) AS bbox
   FROM "V_Stream_Activity"
  GROUP BY "V_Stream_Activity".ath_id;


