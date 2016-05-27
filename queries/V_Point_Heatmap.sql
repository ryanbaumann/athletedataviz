-- View: public."V_Point_Heatmap"

DROP VIEW public."V_Point_Heatmap";

CREATE OR REPLACE VIEW public."V_Point_Heatmap" AS 
 SELECT "V_Stream_Activity".ath_id,
    st_centroid(st_collect("V_Stream_Activity".point)) AS point,
    count("V_Stream_Activity".stream_id)::double precision AS density,
    avg("V_Stream_Activity".velocity_smooth) AS speed,
    avg(abs("V_Stream_Activity".grade_smooth)) AS grade,
    avg("V_Stream_Activity".watts) AS power,
    avg("V_Stream_Activity".heartrate) AS hr,
    avg("V_Stream_Activity".cadence) AS cadence,
    avg("V_Stream_Activity".altitude) AS elevation
   FROM "V_Stream_Activity"
  GROUP BY "V_Stream_Activity".ath_id, (st_snaptogrid("V_Stream_Activity".point, 0.0004::double precision));

ALTER TABLE public."V_Point_Heatmap"
  OWNER TO u6f2sar2t6cqee;
