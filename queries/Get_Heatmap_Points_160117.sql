SELECT array_to_json(array_agg(row_to_json(fc))) 
                FROM (SELECT 'Feature' As type, 
                    st_asgeojson(point)::json AS geometry,
                    row_to_json(( SELECT l.*::record AS l
                        FROM ( SELECT 
                        round((density)::numeric,1) as d,
                        round((speed)::numeric,1) as s,
                        round((grade)::numeric,1) as g) l)) as properties
                    FROM 
                    "V_Point_Heatmap"
                    WHERE ath_id = 1705436
                    ) as fc;



