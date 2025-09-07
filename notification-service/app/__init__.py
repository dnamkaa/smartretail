# notification-service/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///../smartretail.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecret1")

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from .routes import notify_bp
    app.register_blueprint(notify_bp, url_prefix="/notify")

    @app.get("/")
    def health():
        return {"message": "Notification Service OK"}

    return app
