SELECT 
  * 
FROM 
  public."Athlete", 
  public."Activity", 
  public."Stream"
WHERE 
  "Athlete".ath_id = "Activity".ath_id AND
  "Activity".act_id = "Stream".act_id;
