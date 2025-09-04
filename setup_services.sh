#!/bin/bash

# List of services
services=(
  "auth-service"
  "product-service"
  "order-service"
  "payment-service"
  "notification-service"
  "analytics-service"
)

# Create folders
for service in "${services[@]}"; do
  mkdir -p $service/{app,tests}
  touch $service/app/__init__.py
  touch $service/app/main.py
  touch $service/requirements.txt
  echo "Created $service"
done

# Optional common utils
mkdir -p common
echo "Created common utils directory"
