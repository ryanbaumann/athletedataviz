-- View: public."V_Activity_Linestring"

-- DROP VIEW public."V_Activity_Linestring";

CREATE OR REPLACE VIEW public."V_Activity_Linestring_Public" AS 
 SELECT 

    "Activity".act_type,
    "Activity".act_dist,
    "Activity"."act_totalElevGain",
    "Activity".act_avg_speed,
    "Activity".act_elapsed_time,
    "Activity".act_kilojoules,
    "Activity".act_max_speed,
    st_linefromencodedpolyline("Activity".polyline) AS linestring
   FROM "Activity"
  WHERE "Activity".polyline IS NOT NULL
UNION ALL
 SELECT 
 "Activty_Archive".act_type,
    "Activty_Archive".act_dist,
    "Activty_Archive"."act_totalElevGain",
    "Activty_Archive".act_avg_speed,
    "Activty_Archive".act_elapsed_time,
    "Activty_Archive".act_kilojoules,
    "Activty_Archive".act_max_speed,
    st_linefromencodedpolyline("Activty_Archive".polyline) AS linestring
   FROM "Activty_Archive"
  WHERE "Activty_Archive".polyline IS NOT NULL;
