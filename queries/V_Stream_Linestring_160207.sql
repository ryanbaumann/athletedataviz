﻿DROP VIEW "V_Stream_LineString";

CREATE OR REPLACE VIEW "V_Stream_LineString" AS 
 SELECT act.ath_id,
    s.act_id,
    act.act_name,
    act.act_type,
    st_makeline(s.point ORDER BY s.id) AS linestring
   FROM "Stream" s,
    "Activity" act
  WHERE act.act_id = s.act_id
  GROUP BY act.ath_id, s.act_id, act.act_name, act.act_type;
