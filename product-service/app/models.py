from datetime import datetime
from . import db

class Product(db.Model):
    __tablename__ = "products"  # explicit table name for clarity

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # product name
    description = db.Column(db.Text, nullable=True)   # optional description
    price = db.Column(db.Float, nullable=False)       # product price
    stock = db.Column(db.Integer, default=0)          # available stock
    image_url = db.Column(db.String(255), nullable=True)  # product image link

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Product {self.name} (Stock: {self.stock})>"
