# payment-service/app/utils.py
import os, requests

ORDER_BASE = os.getenv("ORDER_BASE", "http://127.0.0.1:5002")
PRODUCT_BASE = os.getenv("PRODUCT_BASE", "http://127.0.0.1:5001")
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "change-me")

DEFAULT_HEADERS = {"X-Internal-Token": INTERNAL_TOKEN}

def set_order_status(order_id: int, status: str):
    r = requests.put(f"{ORDER_BASE}/orders/{order_id}/status",
                     json={"status": status}, headers=DEFAULT_HEADERS, timeout=8)
    r.raise_for_status()
    return r.json()

def commit_stock(order_id: int):
    # optional if you don’t have internal commit; ignore errors
    try:
        r = requests.post(f"{PRODUCT_BASE}/internal/commit",
                          json={"order_id": order_id}, headers=DEFAULT_HEADERS, timeout=5)
        return r.ok
    except Exception:
        return False
