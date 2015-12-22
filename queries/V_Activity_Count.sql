-- View: "V_Activity_Count"

DROP VIEW "V_Activity_Count";

CREATE OR REPLACE VIEW "V_Activity_Count" AS 
 SELECT "V_Stream_Activity".ath_id,
    "V_Stream_Activity".first_name,
    "V_Stream_Activity".last_name,
    count(DISTINCT "V_Stream_Activity".act_id) AS act_count
   FROM "V_Stream_Activity"
  GROUP BY "V_Stream_Activity".ath_id, "V_Stream_Activity".first_name, "V_Stream_Activity".last_name;

ALTER TABLE "V_Activity_Count"
  OWNER TO uesssqg5bvqmd2;
