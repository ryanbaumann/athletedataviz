-- Materialized View: public."V_Activty_Archive_Linestring"

DROP VIEW public."V_Activity_Linestring";

CREATE VIEW public."V_Activity_Linestring" AS 
 SELECT 
    "Activity".act_id,
    "Activity".last_updated_datetime_utc,
    "Activity".act_type,
    "Activity"."act_startDate",
    "Activity".act_dist,
    "Activity"."act_totalElevGain",
    "Activity".act_achievement_count,
    "Activity".act_athlete_count,
    "Activity".act_avg_cadence,
    "Activity".act_avg_heartrate,
    "Activity".act_avg_speed,
    "Activity".act_avg_temp,
    "Activity".act_avg_watts,
    "Activity".act_calories,
    "Activity".act_comment_count,
    "Activity".act_commute,
    "Activity".act_elapsed_time,
    "Activity".act_elev_high,
    "Activity".act_elev_low,
    "Activity".act_gear_id,
    "Activity".act_kilojoules,
    "Activity".act_kudos_count,
    "Activity".act_manual,
    "Activity".act_max_heartrate,
    "Activity".act_max_speed,
    "Activity".act_moving_time,
    "Activity".act_total_photo_count,
    "Activity".act_trainer,
    "Activity".act_workout_type,
    st_linefromencodedpolyline("Activity".polyline) AS linestring
   FROM "Activity"
  WHERE "Activity".polyline IS NOT NULL

UNION ALL

SELECT 
    "Activty_Archive".act_id,
    "Activty_Archive".last_updated_datetime_utc,
    "Activty_Archive".act_type,
    "Activty_Archive"."act_startDate",
    "Activty_Archive".act_dist,
    "Activty_Archive"."act_totalElevGain",
    "Activty_Archive".act_achievement_count,
    "Activty_Archive".act_athlete_count,
    "Activty_Archive".act_avg_cadence,
    "Activty_Archive".act_avg_heartrate,
    "Activty_Archive".act_avg_speed,
    "Activty_Archive".act_avg_temp,
    "Activty_Archive".act_avg_watts,
    "Activty_Archive".act_calories,
    "Activty_Archive".act_comment_count,
    "Activty_Archive".act_commute,
    "Activty_Archive".act_elapsed_time,
    "Activty_Archive".act_elev_high,
    "Activty_Archive".act_elev_low,
    "Activty_Archive".act_gear_id,
    "Activty_Archive".act_kilojoules,
    "Activty_Archive".act_kudos_count,
    "Activty_Archive".act_manual,
    "Activty_Archive".act_max_heartrate,
    "Activty_Archive".act_max_speed,
    "Activty_Archive".act_moving_time,
    "Activty_Archive".act_total_photo_count,
    "Activty_Archive".act_trainer,
    "Activty_Archive".act_workout_type,
    st_linefromencodedpolyline("Activty_Archive".polyline) AS linestring
   FROM "Activty_Archive"
  WHERE "Activty_Archive".polyline IS NOT NULL

