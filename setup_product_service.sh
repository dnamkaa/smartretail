#!/bin/bash

# Create product-service structure
mkdir -p product-service/app
mkdir -p product-service/migrations

# Create starter files
touch product-service/app/__init__.py
touch product-service/app/main.py
touch product-service/app/models.py
touch product-service/app/routes.py
touch product-service/app/utils.py
touch product-service/.env
touch product-service/requirements.txt
touch product-service/.gitignore

# Add .gitignore for product-service
cat <<EOL > product-service/.gitignore
venv/
__pycache__/
*.pyc
*.db
*.sqlite3
*.env
EOL

# Add requirements.txt for product-service
cat <<EOL > product-service/requirements.txt
Flask
Flask-SQLAlchemy
Flask-Migrate
Flask-JWT-Extended
Flask-Cors
python-dotenv
EOL

echo "✅ Product-Service structure created successfully!"
