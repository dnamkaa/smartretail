# notification-service/app/routes.py
from flask import Blueprint, request
from datetime import datetime
from . import db
from .models import NotificationOutbox

notify_bp = Blueprint("notify", __name__)

def _enqueue(channel: str, recipient: str, subject: str|None, body: str|None, payload: dict|None):
    n = NotificationOutbox(
        channel=channel,
        recipient=recipient,
        subject=subject,
        body=body,
        payload=payload or {},
        status="pending",
        attempts=0
    )
    db.session.add(n)
    db.session.commit()
    return n

def _simulate_send(n: NotificationOutbox) -> bool:
    """MVP: pretend to send; mark sent; store timestamp. Replace with real provider later."""
    try:
        n.status = "sent"
        n.sent_at = datetime.utcnow()
        n.attempts = (n.attempts or 0) + 1
        n.last_error = None
        db.session.commit()
        return True
    except Exception as e:
        n.status = "failed"
        n.attempts = (n.attempts or 0) + 1
        n.last_error = str(e)
        db.session.commit()
        return False

@notify_bp.post("/email")
def send_email():
    data = request.get_json() or {}
    to = data.get("to")
    subject = data.get("subject")
    body = data.get("body")
    payload = data.get("payload", {})
    if not to or not (subject or body):
        return {"error": "to and (subject or body) are required"}, 400
    n = _enqueue("email", to, subject, body, payload)
    # MVP: send immediately
    _simulate_send(n)
    return {"id": n.id, "status": n.status, "sent_at": n.sent_at.isoformat() if n.sent_at else None}, 200

@notify_bp.post("/sms")
def send_sms():
    data = request.get_json() or {}
    to = data.get("to")
    body = data.get("body")
    payload = data.get("payload", {})
    if not to or not body:
        return {"error": "to and body are required"}, 400
    n = _enqueue("sms", to, None, body, payload)
    _simulate_send(n)
    return {"id": n.id, "status": n.status, "sent_at": n.sent_at.isoformat() if n.sent_at else None}, 200

@notify_bp.get("/pending")
def list_pending():
    rows = NotificationOutbox.query.filter_by(status="pending").order_by(NotificationOutbox.created_at.asc()).all()
    return {
        "pending": [
            {
                "id": r.id, "channel": r.channel, "recipient": r.recipient,
                "subject": r.subject, "created_at": r.created_at.isoformat(),
                "attempts": r.attempts
            } for r in rows
        ]
    }, 200

@notify_bp.post("/dispatch")
def dispatch_pending():
    """Process all pending notifications (MVP: just call _simulate_send)"""
    rows = NotificationOutbox.query.filter_by(status="pending").all()
    sent, failed = 0, 0
    for r in rows:
        if _simulate_send(r): sent += 1
        else: failed += 1
    return {"processed": len(rows), "sent": sent, "failed": failed}, 200

@notify_bp.post("/retry/<int:notify_id>")
def retry(notify_id: int):
    n = NotificationOutbox.query.get(notify_id)
    if not n:
        return {"error": "not found"}, 404
    if _simulate_send(n):
        return {"id": n.id, "status": n.status, "sent_at": n.sent_at.isoformat()}, 200
    return {"id": n.id, "status": n.status, "error": n.last_error}, 500
