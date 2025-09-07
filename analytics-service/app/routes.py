# analytics-service/app/routes.py
from flask import Blueprint, request, Response
from sqlalchemy import text
from datetime import datetime, timedelta, date
from io import StringIO
import csv
from . import db


analytics_bp = Blueprint("analytics", __name__)

# Helpers
def _parse_date(s, default=None):
    if not s:
        return default
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return default

def _date_bounds():
    today = date.today()
    start_default = today - timedelta(days=30)
    end_default = today
    start = _parse_date(request.args.get("from"), start_default)
    end = _parse_date(request.args.get("to"), end_default)
    # inclusive range: [start, end]
    return start, end

def _rows(sql, **params):
    return db.session.execute(text(sql), params).mappings().all()

def _grouping_clause(group: str) -> str:
    """
    SQLite strftime:
      day   -> '%Y-%m-%d'
      week  -> '%Y-W%W'     (week number, not ISO week-year perfect but OK for MVP)
      month -> '%Y-%m'
    """
    group = (group or "day").lower()
    if group == "week":
        return "strftime('%Y-W%W', o.created_at)"
    if group == "month":
        return "strftime('%Y-%m', o.created_at)"
    return "strftime('%Y-%m-%d', o.created_at)"  # day


# ---------------------------
# GET /analytics/sales-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
# Returns daily orders_count, items_count, revenue
# ---------------------------
@analytics_bp.get("/sales-summary")
def sales_summary():
    start, end = _date_bounds()
    # For SQLite and Postgres, DATE() over created_at works.
    sql = """
    SELECT
      DATE(o.created_at) AS day,
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(oi.quantity), 0) AS items_count,
      COALESCE(SUM(oi.quantity * oi.price), 0.0) AS revenue
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE DATE(o.created_at) BETWEEN :start AND :end
      AND o.status IN ('pending','reserved','paid','shipped','delivered') -- include active pipeline
    GROUP BY DATE(o.created_at)
    ORDER BY day ASC
    """
    data = _rows(sql, start=str(start), end=str(end))
    totals = {
        "orders": sum(r["orders_count"] for r in data),
        "items": sum(r["items_count"] for r in data),
        "revenue": round(sum(r["revenue"] for r in data), 2),
    }
    return {"range": {"from": str(start), "to": str(end)}, "daily": list(data), "totals": totals}, 200

# ---------------------------
# GET /analytics/top-products?window=7|30|90&limit=10
# Ranks products by quantity & revenue in last N days
# ---------------------------
@analytics_bp.get("/top-products")
def top_products():
    window = int(request.args.get("window", "30"))
    limit = int(request.args.get("limit", "10"))
    metric = (request.args.get("metric") or "revenue").lower()  # revenue|quantity
    since = date.today() - timedelta(days=window)

    # Choose ORDER BY expression based on metric
    order_expr = "total_revenue DESC" if metric == "revenue" else "total_qty DESC"

    sql = f"""
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      COALESCE(SUM(oi.quantity), 0) AS total_qty,
      COALESCE(SUM(oi.quantity * oi.price), 0.0) AS total_revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE DATE(o.created_at) >= :since
      AND o.status IN ('paid','shipped','delivered')
    GROUP BY p.id, p.name
    ORDER BY {order_expr}
    LIMIT :limit
    """
    data = _rows(sql, since=str(since), limit=limit)
    out = []
    for i, r in enumerate(data, start=1):
        out.append({
            "rank": i,
            "product_id": r["product_id"],
            "product_name": r["product_name"],
            "quantity": r["total_qty"],
            "revenue": round(r["total_revenue"], 2),
        })
    return {"window_days": window, "metric": metric, "top": out}, 200

# ---------------------------
# GET /analytics/conversion-funnel?from=&to=
# Counts orders by stage in a date range
# ---------------------------
@analytics_bp.get("/conversion-funnel")
def conversion_funnel():
    start, end = _date_bounds()
    # created = all orders in range
    created_sql = """
    SELECT COUNT(*) AS n FROM orders o
    WHERE DATE(o.created_at) BETWEEN :start AND :end
    """
    # reserved/paid/shipped/delivered current statuses in that range
    stages_sql = """
    SELECT o.status, COUNT(*) AS n
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN :start AND :end
      AND o.status IN ('reserved','paid','shipped','delivered','cancelled')
    GROUP BY o.status
    """
    created = _rows(created_sql, start=str(start), end=str(end))[0]["n"]
    stage_rows = _rows(stages_sql, start=str(start), end=str(end))
    stage_map = {r["status"]: r["n"] for r in stage_rows}

    result = {
        "created": created,
        "reserved": stage_map.get("reserved", 0),
        "paid": stage_map.get("paid", 0),
        "shipped": stage_map.get("shipped", 0),
        "delivered": stage_map.get("delivered", 0),
        "cancelled": stage_map.get("cancelled", 0),
    }
    return {"range": {"from": str(start), "to": str(end)}, "funnel": result}, 200

# ---------------------------
# GET /analytics/forecast?horizon=14
# Reads from analytics_sales_forecast if available; falls back to naive forecast
# POST /analytics/forecast/rebuild?horizon=14&lookback=30  -> recompute & upsert
# ---------------------------
@analytics_bp.get("/forecast")
def get_forecast():
    horizon = int(request.args.get("horizon", "14"))
    # Try table first
    rows = _rows(
        "SELECT day, yhat, yhat_lower, yhat_upper, model_name FROM analytics_sales_forecast "
        "WHERE day >= DATE('now') ORDER BY day ASC LIMIT :lim",
        lim=horizon
    )
    if rows:
        return {"source": "table", "forecast": [dict(r) for r in rows]}, 200

    # Fallback: naive mean of last 30 days' revenue
    hist = _rows(
        """
        SELECT DATE(o.created_at) AS day, COALESCE(SUM(oi.quantity*oi.price),0) AS revenue
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE DATE(o.created_at) BETWEEN DATE('now','-30 day') AND DATE('now','-1 day')
        AND o.status IN ('paid','shipped','delivered')
        GROUP BY DATE(o.created_at)
        """)
    avg = (sum(r["revenue"] for r in hist) / len(hist)) if hist else 0.0
    avg = round(avg, 2)
    out = []
    for i in range(1, horizon + 1):
        d = date.today() + timedelta(days=i)
        out.append({"day": str(d), "yhat": avg, "yhat_lower": None, "yhat_upper": None, "model_name": "naive_mean"})
    return {"source": "fallback", "forecast": out}, 200

@analytics_bp.post("/forecast/rebuild")
def rebuild_forecast():
    horizon = int(request.args.get("horizon", "14"))
    lookback = int(request.args.get("lookback", "30"))

    # Compute simple moving-average forecast
    hist = _rows(
        """
        SELECT DATE(o.created_at) AS day, COALESCE(SUM(oi.quantity*oi.price),0) AS revenue
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE DATE(o.created_at) BETWEEN DATE('now', :lb) AND DATE('now','-1 day')
        AND o.status IN ('paid','shipped','delivered')
        GROUP BY DATE(o.created_at)
        """,
        lb=f"-{lookback} day"
    )
    avg = (sum(r["revenue"] for r in hist) / len(hist)) if hist else 0.0
    avg = round(avg, 2)

    # Upsert into analytics_sales_forecast
    # SQLite: emulate upsert with INSERT OR REPLACE on unique day
    for i in range(1, horizon + 1):
        d = date.today() + timedelta(days=i)
        db.session.execute(
            text("""
            INSERT INTO analytics_sales_forecast (day, yhat, yhat_lower, yhat_upper, model_name, created_at)
            VALUES (:day, :yhat, NULL, NULL, 'naive_mean', CURRENT_TIMESTAMP)
            ON CONFLICT(day) DO UPDATE SET
              yhat=excluded.yhat,
              model_name=excluded.model_name,
              created_at=excluded.created_at
            """),
            {"day": str(d), "yhat": avg}
        )
    db.session.commit()
    return {"message": "forecast rebuilt", "model": "naive_mean", "horizon": horizon, "lookback": lookback, "yhat": avg}, 200
@analytics_bp.get("/reports/sales")
def reports_sales():
    group = (request.args.get("group") or "day").lower()  # day|week|month
    start, end = _date_bounds()
    g = _grouping_clause(group)

    # Include effective revenue statuses only; adjust if you want to include 'pending'
    sql = f"""
    SELECT
      {g} AS period,
      COUNT(DISTINCT o.id) AS orders,
      COALESCE(SUM(oi.quantity), 0) AS items,
      COALESCE(SUM(oi.quantity * oi.price), 0.0) AS revenue
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE DATE(o.created_at) BETWEEN :start AND :end
      AND o.status IN ('paid','shipped','delivered')
    GROUP BY period
    ORDER BY period ASC
    """
    rows = _rows(sql, start=str(start), end=str(end))
    totals = {
        "orders": sum(r["orders"] for r in rows),
        "items": sum(r["items"] for r in rows),
        "revenue": round(sum(r["revenue"] for r in rows), 2),
    }
    return {"range": {"from": str(start), "to": str(end)}, "group": group, "rows": list(rows), "totals": totals}, 200

@analytics_bp.get("/reports/sales.csv")
def reports_sales_csv():
    group = (request.args.get("group") or "day").lower()
    start, end = _date_bounds()
    g = _grouping_clause(group)

    sql = f"""
    SELECT
      {g} AS period,
      COUNT(DISTINCT o.id) AS orders,
      COALESCE(SUM(oi.quantity), 0) AS items,
      COALESCE(SUM(oi.quantity * oi.price), 0.0) AS revenue
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE DATE(o.created_at) BETWEEN :start AND :end
      AND o.status IN ('paid','shipped','delivered')
    GROUP BY period
    ORDER BY period ASC
    """
    rows = _rows(sql, start=str(start), end=str(end))

    sio = StringIO()
    writer = csv.writer(sio)
    writer.writerow(["period", "orders", "items", "revenue"])
    for r in rows:
        writer.writerow([r["period"], r["orders"], r["items"], f'{round(r["revenue"],2):.2f}'])
    csv_bytes = sio.getvalue()
    return Response(
        csv_bytes,
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="sales_{group}_{start}_{end}.csv"'}
    )

@analytics_bp.get("/stock/status")
def stock_status():
    low_threshold = int(request.args.get("low_threshold", "5"))
    window = int(request.args.get("window", "30"))
    since = date.today() - timedelta(days=window)

    # Sold in the window (paid/shipped/delivered)
    sql = """
    WITH sold AS (
      SELECT
        oi.product_id,
        COALESCE(SUM(oi.quantity),0) AS sold_qty
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE DATE(o.created_at) >= :since
        AND o.status IN ('paid','shipped','delivered')
      GROUP BY oi.product_id
    ),
    reserved AS (
      SELECT
        oi.product_id,
        COALESCE(SUM(oi.quantity),0) AS reserved_qty
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE DATE(o.created_at) >= :since
        AND o.status = 'reserved'
      GROUP BY oi.product_id
    )
    SELECT
      p.id AS product_id,
      p.name,
      p.stock,
      p.price,
      COALESCE(s.sold_qty, 0) AS sold_last_window,
      COALESCE(r.reserved_qty, 0) AS reserved
    FROM products p
    LEFT JOIN sold s ON s.product_id = p.id
    LEFT JOIN reserved r ON r.product_id = p.id
    ORDER BY p.name ASC
    """
    rows = _rows(sql, since=str(since))

    inventory_value = 0.0
    out = []
    for r in rows:
        stock = r["stock"] or 0
        price = r["price"] or 0.0
        inventory_value += stock * price
        out.append({
            "product_id": r["product_id"],
            "name": r["name"],
            "stock": stock,
            "price": round(price, 2),
            "sold_last_window": r["sold_last_window"],
            "reserved": r["reserved"],
            "low_stock": bool(stock <= low_threshold)
        })
    return {
        "low_threshold": low_threshold,
        "window_days": window,
        "inventory_value": round(inventory_value, 2),
        "rows": out
    }, 200
