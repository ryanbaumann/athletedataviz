Drop View "V_Point_Heatmap";

CREATE VIEW
"V_Point_Heatmap" as

SELECT
ath_id,
st_centroid(st_collect(point)) as point, 
CAST(count(stream_id) as double precision) as density,
avg(velocity_smooth) as speed,
avg(abs(grade_smooth)) as grade,
avg(watts) as power,
avg(heartrate) as hr,
avg(cadence) as cadence

FROM "V_Stream_Activity" 
GROUP BY 
ath_id,
ST_SnapToGrid(point, 0.0001) ;