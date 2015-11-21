-- View: "V_Stream_Activity"

DROP VIEW "V_Stream_Activity" CASCADE;

CREATE OR REPLACE VIEW "V_Stream_Activity" AS 
 SELECT act.ath_id,
    ath.first_name,
    ath.last_name,
    act.act_id,
    act.act_name,
    act.act_description,
    st.id as stream_id,
    st.last_updated_datetime_utc,
    st."timestamp",
    st.lat,
    st.long,
    st.elapsed_time,
    st.elapsed_dist,
    st.velocity_smooth,
    st.altitude,
    st.grade_smooth,
    st.watts,
    st.temp,
    st.heartrate,
    st.cadence,
    st.moving,
    st.point
   FROM "Stream" st
     JOIN "Activity" act ON st.act_id = act.act_id
     JOIN "Athlete" ath ON ath.ath_id = act.ath_id;

ALTER TABLE "V_Stream_Activity"
  OWNER TO postgres;
