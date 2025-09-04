# SmartRetail 🛒

SmartRetail is a microservices-based retail management platform built with **Flask (Python)** and **React (Frontend planned)**.  

## 📌 Services
- **auth-service** → User registration, login, JWT authentication, RBAC  
- **product-service** → Product catalog & stock tracking  
- **order-service** → Customer orders & invoices  
- **payment-service** → Payment processing  
- **notification-service** → Alerts & stock notifications  
- **analytics-service** → Reports & business insights  
- **common/** → Shared utilities  

## 🚀 Setup (Dev)
```bash
# Navigate to auth-service
cd auth-service

# Create virtual environment
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

# Install dependencies
pip install -r requirements.txt
