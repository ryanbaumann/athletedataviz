CREATE VIEW
"V_Point_Heatmap" as

SELECT
ath_id,
st_centroid(st_collect(point)) as point, 
count(*) as density,
avg(velocity_smooth) as speed,
avg(grade_smooth) as grade,
avg(watts) as power,
avg(heartrate) as hr,
avg(cadence) as cadence

FROM "V_Stream_Activity" 
GROUP BY 
ath_id,
ST_SnapToGrid(point, 0.001) ;