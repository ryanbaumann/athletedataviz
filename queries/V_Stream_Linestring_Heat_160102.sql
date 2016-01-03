/*DROP VIEW "V_Stream_LineString_Heat";*/

CREATE OR REPLACE VIEW "V_Stream_LineString_Heat" AS 
 SELECT ath_id,
    act_id,
    density,
    speed,
    grade,
    power,
    hr,
    cadence,
    st_makeline(s.point ORDER BY s.stream_id) AS linestring
    
FROM "V_Act_Heat" s
/*WHERE ath_id=1705436*/
GROUP BY ath_id,
    act_id,
    density,
    speed,
    grade,
    power,
    hr,
    cadence

