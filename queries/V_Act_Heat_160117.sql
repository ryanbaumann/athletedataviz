-- View: "V_Act_Heat"

--DROP VIEW "V_Act_Heat";

CREATE OR REPLACE VIEW "V_Act_Heat" AS 

SELECT c.ath_id,
    round(c.lat, 2) AS lat,
    round(c.long, 2) AS long,
    count(c.stream_id)::double precision AS density,
    avg(c.velocity_smooth) AS speed,
    avg(c.grade_smooth) AS grade,
    avg(c.watts) AS power,
    avg(c.heartrate) AS hr,
    avg(c.cadence) AS cadence
FROM "V_Activity_Points" c
GROUP BY c.ath_id, round(c.lat, 2), round(c.long, 2)

