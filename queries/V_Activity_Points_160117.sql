-- View: "V_Activity_Points"

DROP VIEW "V_Activity_Points" CASCADE;

CREATE OR REPLACE VIEW "V_Activity_Points" AS 
 SELECT act.ath_id,
    st.point,
    st.id AS stream_id,
    st.lat::numeric AS lat,
    st.long::numeric AS long,
    st.velocity_smooth,
    st.altitude,
    st.grade_smooth,
    st.watts,
    st.temp,
    st.heartrate,
    st.cadence
   FROM "Activity" act
     JOIN "Stream" st ON st.act_id = act.act_id;

ALTER TABLE "V_Activity_Points"
  OWNER TO postgres;
