from app import db
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction
from sqlalchemy_utils import URLType
from sqlalchemy import PrimaryKeyConstraint


def cv(val, type):
    if val is None:
        return 0
    else:
        if type == 'float':
            return float(val)
        else:
            return int(val)


class Athlete(db.Model):
    __tablename__ = 'Athlete'

    id = db.Column(db.BigInteger)
    data_source = db.Column(db.String(), index=True)
    ath_id = db.Column(db.BigInteger, index=True,
                       unique=True, primary_key=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    api_code = db.Column(db.String(50))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    country = db.Column(db.String())
    state = db.Column(db.String())
    city = db.Column(db.String())
    email = db.Column(db.String())
    email_language = db.Column(db.String())
    measurement_preference = db.Column(db.String())
    date_preference = db.Column(db.String())
    profile = db.Column(db.String())
    profile_medium = db.Column(db.String())

    def __init__(self, data_source, ath_id,
                 api_code, first_name, last_name, country, state, city,
                 email, email_language,
                 measurement_preference, date_preference, profile, profile_medium):
        self.data_source = data_source
        self.ath_id = ath_id
        self.api_code = api_code
        self.first_name = first_name
        self.last_name = last_name
        self.country = country
        self.state = state
        self.city = city
        self.email = email
        self.email_language = email_language
        self.measurement_preference = measurement_preference
        self.date_preference = date_preference
        self.profile = profile
        self.profile_medium = profile_medium

    def __repr__(self):
        return '<ath_id %s, ath_firstname %s, ath_lastname %s>' % (self.ath_id,
                                                                   self.first_name,
                                                                   self.last_name)


class Activity(db.Model):
    __tablename__ = 'Activity'

    id = db.Column(db.BigInteger)
    ath_id = db.Column(db.BigInteger, db.ForeignKey(
        'Athlete.ath_id'), index=True)
    act_id = db.Column(db.BigInteger, index=True,
                       unique=True, primary_key=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    act_type = db.Column(db.String(20), index=True)
    act_name = db.Column(db.String())
    act_description = db.Column(db.String())
    act_startDate = db.Column(db.DateTime(), index=True)
    act_dist = db.Column(db.Float(precision=4))
    act_totalElevGain = db.Column(db.Float(precision=4))
    polyline = db.Column(db.Text)
    act_distance = db.Column(db.Float(precision=4))
    act_moving_time = db.Column(db.Float(precision=4))
    act_elapsed_time = db.Column(db.Float(precision=4))
    act_avg_speed = db.Column(db.Float(precision=4))
    act_max_speed = db.Column(db.Float(precision=4))
    act_avg_cadence = db.Column(db.Float(precision=4))
    act_avg_temp = db.Column(db.Float(precision=4))
    act_avg_watts = db.Column(db.Float(precision=4))
    act_max_watts = db.Column(db.Float(precision=4))
    act_norm_power = db.Column(db.Float(precision=4))
    act_kilojoules = db.Column(db.Float(precision=4))
    act_avg_heartrate = db.Column(db.Float(precision=4))
    act_max_heartrate = db.Column(db.Integer)
    act_has_heartrate = db.Column(db.Boolean())
    act_device_watts = db.Column(db.Boolean())
    act_calories = db.Column(db.Float(precision=4))
    act_elev_high = db.Column(db.Float(precision=4))
    act_elev_low = db.Column(db.Float(precision=4))
    act_start_point = db.Column(Geometry('POINT'), index=True)
    act_end_point = db.Column(Geometry('POINT'))
    act_achievement_count = db.Column(db.Integer)
    act_kudos_count = db.Column(db.Integer)
    act_comment_count = db.Column(db.Integer)
    act_athlete_count = db.Column(db.Integer)
    act_total_photo_count = db.Column(db.Integer)
    act_commute = db.Column(db.Boolean())
    act_manual = db.Column(db.Boolean())
    act_trainer = db.Column(db.Boolean())
    act_private = db.Column(db.Boolean())
    act_device_name = db.Column(db.String())
    act_workout_type = db.Column(db.Integer)
    act_gear_id = db.Column(db.String())
    act_segment_efforts = db.Column(JSON)
    act_photo_url_list = db.Column(JSON)

    def __init__(self, ath_id, act_id,
                 type, name, description,
                 startDate, distance, totalElevGain,
                 avgSpd, calories, polyline, achievement_count, athlete_count,
                 avg_cadence, avg_heartrate, avg_temp, avg_watts, comment_count, commute,
                 elapsed_time, gear_id, kilojoules, kudos_count, manual,
                 max_heartrate, max_speed, moving_time, photo_count, workout_type):

        self.ath_id = ath_id
        self.act_id = act_id
        self.act_type = type
        self.act_name = name
        self.act_description = description
        self.act_startDate = startDate
        self.act_dist = cv(distance, 'float')
        self.act_totalElevGain = cv(totalElevGain, 'int')
        self.act_avg_speed = cv(avgSpd, 'float')
        self.act_calories = cv(calories, 'int')
        self.polyline = polyline
        self.act_achievement_count = cv(achievement_count, 'int')
        self.act_athlete_count = cv(athlete_count, 'int')
        self.act_avg_cadence = cv(avg_cadence, 'int')
        self.act_avg_heartrate = cv(avg_heartrate, 'int')
        self.act_avg_temp = cv(avg_temp, 'float')
        self.act_avg_watts = cv(avg_watts, 'float')
        self.act_comment_count = cv(comment_count, 'int')
        self.act_commute = commute
        self.act_elapsed_time = cv(elapsed_time, 'int')
        self.act_gear_id = unicode(gear_id)
        self.act_kilojoules = cv(kilojoules, 'int'),
        self.act_kudos_count = cv(kudos_count, 'int')
        self.act_manual = manual
        self.act_max_heartrate = cv(max_heartrate, 'int')
        self.act_max_speed = cv(max_speed, 'int')
        self.act_moving_time = cv(moving_time, 'int')
        self.act_total_photo_count = cv(photo_count, 'int')
        self.act_workout_type = cv(workout_type, 'int')
        print self.polyline

    def __repr__(self):
        return """<ath_id %s, act_id %s,
                act_name %s, act_startDate %s>""" % (self.ath_id, self.act_id,
                                                     self.act_name, self.act_startDate)


class Stream(db.Model):
    __tablename__ = 'Stream'

    id = db.Column(db.BigInteger)
    act_id = db.Column(
        db.Integer, db.ForeignKey('Activity.act_id'))
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
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

    __table_args__ = (
        PrimaryKeyConstraint('id', 'act_id'),
        {},
    )

    def __init__(self, act_id, timestamp, lat, long, elapsed_time, elapsed_dist, velocity_smooth,
                 altitude, grade_smooth, watts, temp, heartrate, cadence, moving, point):

        self.act_id = cv(act_id, 'int')
        self.timestamp = timestamp
        self.lat = cv(lat, 'float')
        self.long = cv(long, 'float')
        self.elapsed_time = cv(elapsed_time, 'int')
        self.elapsed_dist = cv(elapsed_dist, 'float')
        self.velocity_smooth = cv(velocity_smooth, 'float')
        self.altitude = cv(altitude, 'int')
        self.grade_smooth = cv(grade_smooth, 'float')
        self.watts = cv(watts, 'int')
        self.temp = cv(temp, 'float')
        self.heartrate = cv(heartrate, 'int')
        self.cadence = cv(cadence, 'int')
        self.moving = moving
        self.point = point

    def __repr__(self):
        return """<act_id %s, timestamp %s,
                velocity_smooth %s, point %s>""" % (self.act_id, self.timestamp,
                                                    self.velocity_smooth, self.point)

'''
class Stream_Act(db.Model):
    __tablename__ = 'Stream_Act'

    id = db.Column(db.Integer, primary_key=True)
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.ath_id'), index=True)
    act_id = db.Column(
        db.Integer, db.ForeignKey('Activity.act_id'), index=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    act_name = db.Column(db.String())
    linestring = db.Column(Geometry('LINESTRING'), index=True)
    multipoint = db.Column(Geometry('MULTIPOINT'), index=True)

    def __init__(self, ath_id, act_id, act_name, linestring, multipoint):

        self.ath_id = ath_id
        self.act_id = act_id
        self.act_name = act_name
        self.linestring = linestring
        self.multipoint = multipoint
'''


class Athlete_Fact(db.Model):
    __tablename__ = 'Athlete_Fact'

    id = db.Column(db.Integer, primary_key=True)
    objecttypeid = db.Column(db.String(), index=True)
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.ath_id'), index=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    filename = db.Column(db.String())
    url = db.Column(URLType)
    exp_datetime_utc = db.Column(db.DateTime())

    def __init__(self, objecttypeid, ath_id, filename,
                 url, exp_datetime_utc):
        self.objecttypeid = objecttypeid
        self.ath_id = ath_id
        self.filename = filename
        self.url = url
        self.exp_datetime_utc = exp_datetime_utc

    def __repr__(self):
        return '<ath_id %s, objecttypeid %s, filename %s>' % (self.ath_id,
                                                              self.objecttypeid,
                                                              self.filename)

    def getUrl(self, filename):
        return self.url


class Orders(db.Model):
    __tablename__ = 'Orders'

    order_id = db.Column(db.Integer, primary_key=True)
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.ath_id'), index=True)
    ath_fact_id = db.Column(
        db.Integer, db.ForeignKey('Athlete_Fact.id'), index=True)
    order_placed_date = db.Column(
        db.DateTime(), default=datetime.utcnow, index=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    first_name = db.Column(db.String())
    last_name = db.Column(db.String())
    address = db.Column(db.String())
    state = db.Column(db.String())
    zipcode = db.Column(db.String())
    country = db.Column(db.String())
    phone = db.Column(db.String())
    comments = db.Column(db.String())
    paid = db.Column(db.Boolean())
    paid_method = db.Column(db.String())
    paid_id = db.Column(db.Integer)
    paid_date = db.Column(db.DateTime())
    order_supplier_placed = db.Column(db.Boolean())
    order_supplier_placed_date = db.Column(db.DateTime())
    order_supplier_shipped = db.Column(db.Boolean())
    order_supplier_shipped_date = db.Column(db.DateTime())
    order_closed = db.Column(db.Boolean())
    order_closed_date = db.Column(db.DateTime())

    def __init__(self, ath_id, ath_fact_id, first_name, last_name, address, state, zipcode,
                 country, phone, comments):
        self.ath_id = ath_id
        self.ath_fact_id = ath_fact_id
        self.first_name = first_name
        self.last_name = last_name
        self.address = address
        self.state = state
        self.zipcode = zipcode
        self.country = country
        self.phone = phone
        self.comments = comments

    def __repr__(self):
        return '<order_id %s, ath_id %s, ath_fact_id %s>' % (self.order_id,
                                                             self.ath_id,
                                                             self.ath_fact_id)

    def getOrder(self, orderid):
        return self.order_id


class Segment(db.Model):
    __tablename__ = 'Segment'

    seg_id = db.Column(db.BigInteger, primary_key=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    act_type = db.Column(db.String(20))
    ath_cnt = db.Column(db.BigInteger)
    cat = db.Column(db.Integer)
    date_created = db.Column(db.DateTime())
    distance = db.Column(db.Float(precision=4), index=True)
    effort_cnt = db.Column(db.BigInteger)
    elev_gain = db.Column(db.Float(precision=4))
    elev_high = db.Column(db.Float(precision=4))
    elev_low = db.Column(db.Float(precision=4))
    avg_grade = db.Column(db.Float(precision=4), default=0)
    max_grade = db.Column(db.Float(precision=4), default=0)
    total_elevation_gain = db.Column(db.Float(precision=4), default=0)
    name = db.Column(db.String())
    seg_points = db.Column(db.Text)
    start_point = db.Column(Geometry('POINT'), index=True)
    end_point = db.Column(Geometry('POINT'))

    def __init__(self, seg_id, act_type, ath_cnt, cat, date_created, distance, effort_cnt,
                 elev_gain, elev_high, elev_low, name, seg_points, start_point, end_point):

        self.seg_id = seg_id
        self.act_type = act_type
        self.ath_cnt = ath_cnt
        self.cat = cat
        self.date_created = date_created
        self.distance = distance
        self.effort_cnt = effort_cnt
        self.elev_gain = elev_gain
        self.elev_high = elev_high
        self.elev_low = elev_low
        self.name = name
        self.seg_points = seg_points
        self.start_point = start_point
        self.end_point = end_point

    def __repr__(self):
        return '<seg_id %s, name %s>' % (self.seg_id, self.name)
