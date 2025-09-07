# payment-service/app/routes.py
from flask import Blueprint, request, jsonify
from . import db
from .models import Payment, OfflineReceipt
from .utils import set_order_status, commit_stock
import secrets
from datetime import datetime

payment_bp = Blueprint("payments", __name__)

def _event(meta: dict, kind: str, extra: dict = None):
    meta = meta or {}
    events = meta.get("events", [])
    ev = {"type": kind, "ts": datetime.utcnow().isoformat()}
    if extra: ev.update(extra)
    events.append(ev)
    meta["events"] = events
    return meta

@payment_bp.post("/initiate")
def initiate():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    amount = data.get("amount")
    provider = data.get("provider", "mock")

    if not order_id or not amount or float(amount) <= 0:
        return {"error": "order_id and positive amount required"}, 400

    ref = "PMT_" + secrets.token_hex(8)
    p = Payment(
        order_id=order_id,
        amount=float(amount),
        provider=provider,
        channel="online",
        status="initiated",
        payment_ref=ref,
        meta=_event({}, "initiate", {"provider": provider})
    )
    db.session.add(p)
    db.session.commit()

    return {
        "payment_id": p.id,
        "payment_ref": p.payment_ref,
        "status": p.status,
        "redirect_url": None  # add real PSP link later
    }, 200

@payment_bp.post("/webhook")
def webhook():
    data = request.get_json() or {}
    ref = data.get("payment_ref")
    status = data.get("status")

    if not ref or status not in ("success", "failed"):
        return {"error": "invalid payload"}, 400

    p = Payment.query.filter_by(payment_ref=ref).first()
    if not p:
        return {"error": "unknown payment_ref"}, 404

    # idempotency
    if p.status == "success":
        return {"message": "already success"}, 200

    p.status = "success" if status == "success" else "failed"
    p.meta = _event(p.meta, "webhook", {"status": status})
    db.session.commit()

    if p.status == "success":
        set_order_status(p.order_id, "paid")
        commit_stock(p.order_id)
        return {"message": "Payment updated", "order_status": "paid"}, 200

    return {"message": "Payment failed"}, 200

@payment_bp.post("/offline")
def offline():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    method = data.get("method")   # bank_transfer | cash
    reference = data.get("reference")
    amount = data.get("amount")
    attachment_url = data.get("attachment_url")

    if not all([order_id, method, reference, amount]) or float(amount) <= 0:
        return {"error": "order_id, method, reference, amount required"}, 400

    p = Payment(
        order_id=order_id,
        amount=float(amount),
        provider="offline",
        channel="offline",
        status="awaiting_verification",
        payment_ref="OFF_" + secrets.token_hex(8),
        meta=_event({}, "offline_submit", {"method": method, "reference": reference})
    )
    db.session.add(p)
    db.session.flush()  # get p.id

    r = OfflineReceipt(
        payment_id=p.id,
        method=method,
        reference=reference,
        amount=float(amount),
        attachment_url=attachment_url
    )
    db.session.add(r)
    db.session.commit()

    return {"payment_id": p.id, "status": p.status}, 200

@payment_bp.post("/<int:payment_id>/verify")
def verify(payment_id: int):
    data = request.get_json() or {}
    approved = bool(data.get("approved"))

    p = Payment.query.get(payment_id)
    if not p:
        return {"error": "not found"}, 404
    if p.status in ("success", "failed"):
        return {"message": "already finalized", "status": p.status}, 200

    p.status = "success" if approved else "failed"
    p.meta = _event(p.meta, "offline_verify", {"approved": approved})
    db.session.commit()

    if approved:
        set_order_status(p.order_id, "paid")
        commit_stock(p.order_id)
        return {"payment_id": p.id, "status": p.status, "order_status": "paid"}, 200

    return {"payment_id": p.id, "status": p.status}, 200

@payment_bp.get("/by-order/<int:order_id>")
def by_order(order_id: int):
    rows = Payment.query.filter_by(order_id=order_id).order_by(Payment.created_at.desc()).all()
    return {
        "order_id": order_id,
        "payments": [
            {
                "id": x.id,
                "status": x.status,
                "channel": x.channel,
                "amount": x.amount,
                "payment_ref": x.payment_ref,
                "created_at": x.created_at.isoformat()
            } for x in rows
        ]
    }, 200
