SELECT "Activity".act_id
from "Athlete" INNER JOIN "Activity" on "Athlete".ath_id = "Activity".ath_id
Where "Athlete".last_updated_datetime_utc < current_date - interval '30' day