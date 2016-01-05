from app import db
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction
from sqlalchemy_utils import URLType


class Athlete(db.Model):
    __tablename__ = 'Athlete'

    id = db.Column(db.Integer, primary_key=True)
    data_source = db.Column(db.String(), index=True)
    ath_id = db.Column(db.Integer, index=True, unique=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    api_code = db.Column(db.String(50))
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
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.ath_id'), index=True)
    act_id = db.Column(db.Integer, index=True, unique=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
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
    act_id = db.Column(
        db.Integer, db.ForeignKey('Activity.act_id'), index=True)
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


class Stream_Act(db.Model):
    __tablename__ = 'Stream_Act'

    id = db.Column(db.Integer, primary_key=True)
    ath_id = db.Column(db.Integer, db.ForeignKey('Athlete.ath_id'), index=True)
    act_id = db.Column(
        db.Integer, db.ForeignKey('Activity.act_id'), index=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    act_name = db.Column(db.String(200))
    linestring = db.Column(Geometry('LINESTRING'), index=True)
    multipoint = db.Column(Geometry('MULTIPOINT'), index=True)

    def __init__(self, ath_id, act_id, act_name, linestring, multipoint):

        self.ath_id = ath_id
        self.act_id = act_id
        self.act_name = act_name
        self.linestring = linestring
        self.multipoint = multipoint


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
    ath_fact_id = db.Column(db.Integer, db.ForeignKey('Athlete_Fact.id'), index=True)
    order_placed_date = db.Column(
        db.DateTime(), default=datetime.utcnow, index=True)
    last_updated_datetime_utc = db.Column(
        db.DateTime(), default=datetime.utcnow)
    first_name = db.Column(db.String())
    last_name = db.Column(db.String())
    address = db.Column(db.String())
    state =  db.Column(db.String())
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
