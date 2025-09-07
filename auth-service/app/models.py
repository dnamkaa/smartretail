from datetime import datetime
from . import db
from werkzeug.security import generate_password_hash, check_password_hash


# -------------------------------
# User Model (Auth-Service)
# -------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default="customer")  # admin / customer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# -------------------------------
# Product Model (Product-Service)
# -------------------------------
class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)


# -------------------------------
# Order & OrderItem Models (Order-Service)
# -------------------------------
class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, paid, shipped, delivered, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", lazy=True)


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False)

# Payments (centralized in auth-service models)
from datetime import datetime
from . import db

PAYMENT_STATUSES = {"initiated", "awaiting_verification", "success", "failed", "cancelled"}
PAYMENT_CHANNELS = {"online", "offline"}
PAYMENT_PROVIDERS = {"mock", "mpesa", "tigo", "airtel", "stripe", "offline"}

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = db.Column(db.Float, nullable=False)

    provider = db.Column(db.String(20), nullable=False, default="mock")
    channel  = db.Column(db.String(10), nullable=False, default="online")
    status   = db.Column(db.String(32), nullable=False, default="initiated")

    payment_ref = db.Column(db.String(64), unique=True, index=True, nullable=False)
    meta       = db.Column(db.JSON, default=dict)  # <-- renamed from `metadata` to `meta`

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint("amount >= 0", name="ck_payments_amount_nonneg"),
    )

class OfflineReceipt(db.Model):
    __tablename__ = "offline_receipts"

    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(
        db.Integer,
        db.ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    method = db.Column(db.String(20), nullable=False)      # bank_transfer | cash
    reference = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    attachment_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    payment = db.relationship(
        "Payment",
        backref=db.backref("receipts", lazy=True, cascade="all, delete-orphan")
    )

    __table_args__ = (
        db.CheckConstraint("amount >= 0", name="ck_offline_receipts_amount_nonneg"),
    )
# -------------------------------
# Notification Outbox (Notification-Service)
# -------------------------------
class NotificationOutbox(db.Model):
    __tablename__ = "notification_outbox"

    id = db.Column(db.Integer, primary_key=True)
    channel = db.Column(db.String(10), nullable=False)          # email | sms
    recipient = db.Column(db.String(255), nullable=False)       # email or phone
    subject = db.Column(db.String(255))                         # email only
    body = db.Column(db.Text)                                   # email/sms text
    payload = db.Column(db.JSON, default=dict)
    status = db.Column(db.String(10), nullable=False, default="pending")
    attempts = db.Column(db.Integer, nullable=False, default=0)
    last_error = db.Column(db.Text)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)

    # -------------------------------
# Analytics tables (centralized)
# -------------------------------
from datetime import datetime, date
from . import db

class AnalyticsDailySales(db.Model):
    """
    Pre-aggregated daily sales to speed up charts & reports.
    Filled by a nightly job or an ad-hoc backfill endpoint.
    """
    __tablename__ = "analytics_daily_sales"

    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, nullable=False, index=True, unique=True)
    orders_count = db.Column(db.Integer, nullable=False, default=0)
    items_count = db.Column(db.Integer, nullable=False, default=0)
    revenue = db.Column(db.Float, nullable=False, default=0.0)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint("orders_count >= 0", name="ck_ads_orders_nonneg"),
        db.CheckConstraint("items_count >= 0", name="ck_ads_items_nonneg"),
        db.CheckConstraint("revenue >= 0", name="ck_ads_revenue_nonneg"),
    )


class AnalyticsSalesForecast(db.Model):
    """
    Stores forecasted total sales (daily) for a horizon (e.g., next 14/30 days).
    """
    __tablename__ = "analytics_sales_forecast"

    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, nullable=False, index=True, unique=True)
    yhat = db.Column(db.Float, nullable=False)         # point forecast (revenue)
    yhat_lower = db.Column(db.Float)                   # optional lower bound
    yhat_upper = db.Column(db.Float)                   # optional upper bound
    model_name = db.Column(db.String(50), default="exp_smoothing")  # or "naive", "arima"
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint("yhat >= 0", name="ck_asf_yhat_nonneg"),
        db.CheckConstraint("yhat_lower IS NULL OR yhat_lower >= 0", name="ck_asf_yhat_lower_nonneg"),
        db.CheckConstraint("yhat_upper IS NULL OR yhat_upper >= 0", name="ck_asf_yhat_upper_nonneg"),
    )


class AnalyticsTopProduct(db.Model):
    """
    Optional cache for top products per window; keeps UI snappy.
    You can fill it daily (last 7/30 days) or on demand.
    """
    __tablename__ = "analytics_top_products"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    window = db.Column(db.String(20), nullable=False, default="30d")  # e.g., "7d", "30d", "all"
    rank = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    revenue = db.Column(db.Float, nullable=False, default=0.0)
    computed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("product_id", "window", name="uq_atp_prod_window"),
        db.CheckConstraint("rank > 0", name="ck_atp_rank_pos"),
        db.CheckConstraint("quantity >= 0", name="ck_atp_qty_nonneg"),
        db.CheckConstraint("revenue >= 0", name="ck_atp_rev_nonneg"),
    )

