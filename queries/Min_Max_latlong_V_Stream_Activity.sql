SELECT 
a.ath_id,
min(a.lat) as min_lat,
max(a.lat) as max_lat,
min(a.long) as min_long,
max(a.long) as max_long
FROM
"V_Stream_Activity" a
WHERE
ath_id = 1705436
GROUP BY ath_id

