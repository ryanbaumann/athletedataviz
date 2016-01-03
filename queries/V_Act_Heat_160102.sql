Drop View "V_Act_Heat";
CREATE VIEW "V_Act_Heat" AS
SELECT 
a.ath_id,
a.act_id,
a.stream_id,
a.point as point,
b.density,
b.speed * 2.23694 as speed,
b.grade,
b.power,
b.hr,
b.cadence
FROM "V_Activity_Points" a JOIN

	(SELECT c.ath_id,
	    round(c.lat,3) as lat,
	    round(c.long,3) as long,
	    count(stream_id)::double precision AS density,
	    avg(velocity_smooth) AS speed,
	    avg(abs(grade_smooth)) AS grade,
	    avg(watts) AS power,
	    avg(heartrate) AS hr,
	    avg(cadence) AS cadence
	   FROM "V_Activity_Points" c
	  GROUP BY c.ath_id, round(c.lat,3), round(c.long,3)) as b

ON b.ath_id=b.ath_id AND round(a.lat,3)=round(b.lat,3) AND round(a.long,3)=round(b.long,3)


