# payment-service/app/models.py
from datetime import datetime
from . import db

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    provider = db.Column(db.String(20), nullable=False, default="mock")
    channel  = db.Column(db.String(10), nullable=False, default="online")
    status   = db.Column(db.String(32), nullable=False, default="initiated")
    payment_ref = db.Column(db.String(64), unique=True, index=True, nullable=False)
    meta       = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class OfflineReceipt(db.Model):
    __tablename__ = "offline_receipts"

    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(db.Integer, db.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    method = db.Column(db.String(20), nullable=False)       # bank_transfer | cash
    reference = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    attachment_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
