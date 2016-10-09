-- View: public."V_Poly_Elev"

-- DROP VIEW public."V_Poly_Elev";

CREATE OR REPLACE VIEW public."V_Poly_Elev" AS 
 SELECT "V_Stream_Activity".ath_id,
    st_expand(st_collect("V_Stream_Activity".point), (0.0005)::double precision) AS poly,
    avg("V_Stream_Activity".altitude) AS e
   FROM "V_Stream_Activity"
  GROUP BY "V_Stream_Activity".ath_id, (st_snaptogrid("V_Stream_Activity".point, (0.0005)::double precision));

ALTER TABLE public."V_Poly_Elev"
  OWNER TO admin;
