
/*Move data into archive table*/
INSERT INTO "Stream_Archive"
SELECT * FROM "Stream" 
Where 
"Stream".act_id not in (Select distinct act_id from "Stream_Archive")
AND
"Stream".act_id IN (
	SELECT "Activity".act_id
	from "Athlete" INNER JOIN "Activity" on "Athlete".ath_id = "Activity".ath_id
	Where "Athlete".last_updated_datetime_utc < current_date - interval '36' hour and "Athlete".ath_id != 12904699
);

/*Remopve data from primary stream table*/
DELETE FROM "Stream"
Where "Stream".act_id in (

	SELECT "Activity".act_id
	from "Athlete" INNER JOIN "Activity" on "Athlete".ath_id = "Activity".ath_id
	Where "Athlete".last_updated_datetime_utc < current_date - interval '36' hour and "Athlete".ath_id != 12904699
);

/*Vacuum table*/
/*VACUUM FULL VERBOSE "Stream";*/

/*Cluster table on act id
CLUSTER "Stream" USING ix_Stream_act_id
*/

insert into "Activty_Archive"
SELECT 
* from "Activity"
where act_id not in (select distinct act_id from "Stream")
and act_id not in (select distinct act_id from "Activty_Archive");


DELETE from "Activity"
where act_id not in (select distinct act_id from "Stream");
