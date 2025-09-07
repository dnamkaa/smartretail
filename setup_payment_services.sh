#!/bin/bash

# Create payment-service structure
mkdir -p payment-service/app
mkdir -p payment-service/migrations

# Create starter files
touch payment-service/app/__init__.py
touch payment-service/app/models.py
touch payment-service/app/routes.py
touch payment-service/app/utils.py
touch payment-service/.env
touch payment-service/requirements.txt
touch payment-service/.gitignore
touch payment-service/main.py   # main.py at root

# .gitignore
cat > payment-service/.gitignore <<'EOL'
venv/
__pycache__/
*.pyc
*.db
*.sqlite3
*.env
.env.*
.DS_Store
EOL

# requirements.txt
cat > payment-service/requirements.txt <<'EOL'
Flask
Flask-SQLAlchemy
Flask-Migrate
Flask-JWT-Extended
Flask-Cors
python-dotenv
requests
psycopg2-binary
EOL

echo "✅ payment-service structure created successfully!"
