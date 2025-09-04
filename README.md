# 🛒 SmartRetail

SmartRetail is a microservices-based retail management platform built with **Flask** (Python) on the backend and a planned **React** frontend.  

It enables customers and offline shops to manage:
- ✅ User authentication & RBAC
- ✅ Products & stock tracking
- ✅ Orders & receipts
- ✅ Payments
- ✅ Notifications
- ✅ Analytics & reporting

---

## 📂 Project Structure



smartretail/
├── auth-service/ # Authentication, JWT, Role-based access
├── product-service/ # Product catalog & inventory
├── order-service/ # Orders, receipts, daily reports
├── payment-service/ # Payment processing
├── notification-service/ # Stock alerts, low inventory notifications
├── analytics-service/ # Reports & business insights
├── common/ # Shared utilities (future)
└── setup_services.sh # Script to bootstrap services



---

## 🚀 Setup (Auth-Service Example)

```bash
# Navigate to auth-service
cd auth-service

# Create virtual environment
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

# Install dependencies
pip install -r requirements.txt

# Run migrations
flask db upgrade

# Start service
python app/main.py

Auth-Service Endpoints (MVP)

POST /auth/register → Register new user

POST /auth/login → Login and receive JWT

GET /auth/me → Current logged-in user (protected)

GET /auth/users → List all users (admin only)

PUT /auth/users/<id>/role → Update user role (admin only)

PUT /auth/users/<id>/deactivate → Soft delete user (admin only)

DELETE /auth/users/<id> → Permanently delete user (admin only)