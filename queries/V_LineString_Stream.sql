CREATE VIEW "V_Stream_LineString" as

SELECT s.act_id, act.act_name, ST_MakeLine(st_point(long, lat) ORDER BY s.id) AS linestring 
 FROM public."Stream" s, public."Activity" act
 WHERE
 act.act_id = s.act_id
 GROUP BY s.act_id, act.act_name;