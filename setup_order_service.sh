#!/bin/bash

# Create order-service structure
mkdir -p order-service/app
mkdir -p order-service/migrations

# Create starter files
touch order-service/app/__init__.py
touch order-service/app/models.py
touch order-service/app/routes.py
touch order-service/app/utils.py
touch order-service/.env
touch order-service/requirements.txt
touch order-service/.gitignore
touch order-service/main.py   # main.py at root

# Add .gitignore for order-service
cat <<EOL > order-service/.gitignore
venv/
__pycache__/
*.pyc
*.db
*.sqlite3
*.env
EOL

# Add requirements.txt for order-service
cat <<EOL > order-service/requirements.txt
Flask
Flask-SQLAlchemy
Flask-Migrate
Flask-JWT-Extended
Flask-Cors
python-dotenv
EOL

echo "✅ Order-Service structure created successfully!"
