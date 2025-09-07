# analytics-service/app/models.py
from datetime import datetime, date
from . import db

class AnalyticsDailySales(db.Model):
    __tablename__ = "analytics_daily_sales"
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, nullable=False, index=True, unique=True)
    orders_count = db.Column(db.Integer, nullable=False, default=0)
    items_count = db.Column(db.Integer, nullable=False, default=0)
    revenue = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class AnalyticsSalesForecast(db.Model):
    __tablename__ = "analytics_sales_forecast"
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, nullable=False, index=True, unique=True)
    yhat = db.Column(db.Float, nullable=False)
    yhat_lower = db.Column(db.Float)
    yhat_upper = db.Column(db.Float)
    model_name = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class AnalyticsTopProduct(db.Model):
    __tablename__ = "analytics_top_products"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, nullable=False, index=True)
    window = db.Column(db.String(20), nullable=False, default="30d")
    rank = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    revenue = db.Column(db.Float, nullable=False, default=0.0)
    computed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
