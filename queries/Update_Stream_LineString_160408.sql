
select * into "Stream_LineString"
from "V_Stream_LineString" 
where "V_Stream_LineString".act_id not in 
	(select act_id from "Stream_LineString")

/*select * into "Stream_LineString"
from "V_Stream_LineString" 
where ath_id = 1705436*/
