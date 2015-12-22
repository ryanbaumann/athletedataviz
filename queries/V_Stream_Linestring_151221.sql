-- View: "V_Stream_LineString"

--DROP VIEW "V_Stream_LineString" CASCADE;

CREATE OR REPLACE VIEW "V_Stream_LineString" AS 
 SELECT act.ath_id,
    s.act_id,
    act.act_name,
    st_makeline(s.point ORDER BY s.id) AS linestring
   FROM "Stream" s,
    "Activity" act
  WHERE act.act_id = s.act_id
  GROUP BY act.ath_id, s.act_id, act.act_name;

ALTER TABLE "V_Stream_LineString"
  OWNER TO postgres;
GRANT ALL ON TABLE "V_Stream_LineString" TO postgres;
GRANT SELECT ON TABLE "V_Stream_LineString" TO admin;
