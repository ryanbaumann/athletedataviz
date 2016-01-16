insert into "Stream_LineString"
(select * 
from "V_Stream_LineString" 
where "V_Stream_LineString".act_id not in 
	(select act_id from "Stream_LineString") 
       /*and ath_id = 1705436*/)
