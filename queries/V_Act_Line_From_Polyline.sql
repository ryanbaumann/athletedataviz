-- View: public."V_Act_Line_From_Polyline"

-- DROP VIEW public."V_Act_Line_From_Polyline";

CREATE OR REPLACE VIEW public."V_Act_Line_From_Polyline" AS 
 SELECT act.id,
    act.ath_id,
    act.act_id,
    act.last_updated_datetime_utc,
    act.act_type,
    act.act_name,
    act.act_description,
    act."act_startDate",
    act.act_dist,
    act."act_totalElevGain",
    st_linefromencodedpolyline(act.polyline) AS geometry
   FROM "Activity" act
   Where polyline is not null;


