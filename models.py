from app import db
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from geoalchemy2 import Geometry


class Athlete(db.Model):
    __tablename__ = 'Athlete'

    id = db.Column(db.Integer, primary_key=True)
    data_source = db.Column(db.String(), index=True)
    ath_id = db.Column(db.Integer, index=True)
    last_updated_datetime_utc = db.Column(db.DateTime(), default=datetime.utcnow)
    api_code = db.Column(db.Integer)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))

    def __init__(self, data_source, ath_id, 
                 api_code, first_name, last_name):
        self.data_source = data_source
        self.ath_id = ath_id
        self.api_code = api_code
        self.first_name = first_name
        self.last_name = last_name

    def __repr__(self):
        return '<ath_id %s, ath_firstname %s, ath_lastname %s>' % (self.ath_id, 
                                                                   self.first_name, 
                                                                   self.last_name)

class Activity(db.Model):
    __tablename__ = 'Activity'

    id = db.Column(db.Integer, primary_key=True)
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.id'), index=True)
    act_id = db.Column(db.Integer, index=True)
    last_updated_datetime_utc = db.Column(db.DateTime(), default=datetime.utcnow)
    act_type = db.Column(db.String(20), index=True)
    act_name = db.Column(db.String(200))
    act_description = db.Column(db.String(500))
    act_startDate = db.Column(db.DateTime(), index=True)
    act_dist = db.Column(db.Float(precision=4))
    act_totalElevGain = db.Column(db.Float(precision=4))

    def __init__(self, ath_id, act_id,
                 act_type, act_name, act_description, 
                 act_startDate, act_dist, act_totalElevGain,
                 act_avgSpd, act_calories):

        self.ath_id = ath_id
        self.act_id = act_id
        self.act_type = act_type
        self.act_name = act_name
        self.act_description = act_description
        self.act_startDate = act_startDate
        self.act_dist = self.act_dist
        self.act_totalElevGain = self.act_totalElevGain
        self.act_avgSpd = act_avgSpd
        self.act_calories = act_calories

    def __repr__(self):
        return '<ath_id %s, act_id %s, \
                act_name %s, act_startDate %s>' % (self.ath_id, self.act_id,
                                                   self.act_name, self.act_startDate)

class Stream(db.Model):
    __tablename__ = 'Stream'

    id = db.Column(db.Integer, primary_key=True)
    act_id = db.Column(db.Integer, db.ForeignKey('Activity.id'), index=True)
    last_updated_datetime_utc = db.Column(db.DateTime(), default=datetime.utcnow)
    timestamp = db.Column(db.DateTime())
    lat = db.Column(db.Float(precision=8))
    long = db.Column(db.Float(precision=8))
    elapsed_time = db.Column(db.Float(precision=4))
    elapsed_dist = db.Column(db.Float(precision=4))
    velocity_smooth = db.Column(db.Float(precision=4))
    altitude = db.Column(db.Float(precision=4))
    grade_smooth = db.Column(db.Float(precision=4))
    watts = db.Column(db.Float(precision=4))
    temp = db.Column(db.Float(precision=4))
    heartrate = db.Column(db.Float(precision=4))
    cadence = db.Column(db.Float(precision=4))
    moving = db.Column(db.Boolean())
    point = db.Column(Geometry('POINT'), index=True)

    def __init__(self, act_id, timestamp, lat, long, elapsed_time, elapsed_dist, velocity_smooth,
                 altitude, grade_smooth, watts, temp, heartrate, cadence, moving, point):

        self.act_id = act_id
        self.timestamp = timestamp
        self.lat = lat
        self.long = long
        self.elapsed_time = elapsed_time
        self.elapsed_dist = elapsed_dist
        self.velocity_smooth = velocity_smooth
        self.altitude = altitude
        self.grade_smooth = grade_smooth
        self.watts = watts
        self.temp = temp
        self.heartrate = heartrate
        self.cadence = cadence
        self.moving = moving,
        self.point = point

    def __repr__(self):
        return '<act_id %s, timestamp %s, \
                velocity_smooth %s, point %s>' % (self.act_id, self.timestamp,
                                                   self.velocity_smooth, self.point)