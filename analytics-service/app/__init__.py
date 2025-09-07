# analytics-service/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate  # present but we won't run migrations here
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()  # not used for upgrade here, only to keep pattern consistent

def create_app():
    app = Flask(__name__)

    # Use the same DB the auth-service migrates
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///../smartretail.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app)

    from .routes import analytics_bp
    app.register_blueprint(analytics_bp, url_prefix="/analytics")

    return app
