Drop View "V_Activity_Points";

CREATE OR REPLACE VIEW "V_Activity_Points" AS 
SELECT
a.ath_id,
a.act_id,
b.point,
b.density,
b.speed,
b.grade,
b.power,
b.hr,
b.cadence

FROM(
 SELECT "V_Stream_Activity".ath_id,
    st_centroid(st_collect("V_Stream_Activity".point)) AS point,
    count("V_Stream_Activity".stream_id)::double precision AS density,
    avg("V_Stream_Activity".velocity_smooth) AS speed,
    avg(abs("V_Stream_Activity".grade_smooth)) AS grade,
    avg("V_Stream_Activity".watts) AS power,
    avg("V_Stream_Activity".heartrate) AS hr,
    avg("V_Stream_Activity".cadence) AS cadence
   FROM "V_Stream_Activity"
  GROUP BY "V_Stream_Activity".ath_id, st_snaptogrid("V_Stream_Activity".point, 0.00005::double precision)
) as b
INNER JOIN "V_Stream_Activity" a
ON (b.point = st_snaptogrid(a.point, 0.00005::double precision));


