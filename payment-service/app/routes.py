from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from . import db
from .models import Payment, OfflineReceipt
from .utils import set_order_status, commit_stock
import secrets
import os
from datetime import datetime
from sqlalchemy import func, and_

payment_bp = Blueprint("payments", __name__)

# File upload configuration
UPLOAD_FOLDER = 'uploads/receipts'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _event(meta: dict, kind: str, extra: dict = None):
    meta = meta or {}
    events = meta.get("events", [])
    ev = {"type": kind, "ts": datetime.utcnow().isoformat()}
    if extra: 
        ev.update(extra)
    events.append(ev)
    meta["events"] = events
    return meta

@payment_bp.route("/", methods=["GET"])
def health_check():
    return {"message": "Payment service is running", "status": "healthy"}, 200

# NEW: Get all payments (admin endpoint)
@payment_bp.route("/all", methods=["GET"])
def list_all_payments():
    """List all payments with pagination and filtering"""
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status_filter = request.args.get("status")
    channel_filter = request.args.get("channel")
    
    query = Payment.query
    
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    if channel_filter:
        query = query.filter(Payment.channel == channel_filter)
    
    # Order by most recent first
    query = query.order_by(Payment.created_at.desc())
    
    try:
        payments_page = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Get receipts for offline payments
        payment_ids = [p.id for p in payments_page.items]
        receipts = OfflineReceipt.query.filter(OfflineReceipt.payment_id.in_(payment_ids)).all()
        receipts_by_payment = {r.payment_id: r for r in receipts}
        
        payments_data = []
        for p in payments_page.items:
            payment_data = {
                "id": p.id,
                "order_id": p.order_id,
                "amount": p.amount,
                "provider": p.provider,
                "channel": p.channel,
                "status": p.status,
                "payment_ref": p.payment_ref,
                "created_at": p.created_at.isoformat(),
                "meta": p.meta
            }
            
            # Add receipt data if available
            if p.id in receipts_by_payment:
                receipt = receipts_by_payment[p.id]
                payment_data["receipt"] = {
                    "method": receipt.method,
                    "reference": receipt.reference,
                    "attachment_url": receipt.attachment_url
                }
            
            payments_data.append(payment_data)
        
        return {
            "payments": payments_data,
            "pagination": {
                "page": page,
                "pages": payments_page.pages,
                "per_page": per_page,
                "total": payments_page.total,
                "has_next": payments_page.has_next,
                "has_prev": payments_page.has_prev
            }
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching payments: {str(e)}")
        return {"error": "Failed to fetch payments"}, 500

# NEW: Get user payments
@payment_bp.route("/user/<int:user_id>", methods=["GET"])
def list_user_payments(user_id: int):
    """List payments for a specific user (requires order service integration)"""
    try:
        # For now, we'll return all payments since we don't have direct user association
        # In a real implementation, you'd join with orders table or call order service
        payments = Payment.query.order_by(Payment.created_at.desc()).all()
        
        # Get receipts for these payments
        payment_ids = [p.id for p in payments]
        receipts = OfflineReceipt.query.filter(OfflineReceipt.payment_id.in_(payment_ids)).all()
        receipts_by_payment = {r.payment_id: r for r in receipts}
        
        payments_data = []
        for p in payments:
            payment_data = {
                "id": p.id,
                "order_id": p.order_id,
                "amount": p.amount,
                "provider": p.provider,
                "channel": p.channel,
                "status": p.status,
                "payment_ref": p.payment_ref,
                "created_at": p.created_at.isoformat(),
                "meta": p.meta
            }
            
            if p.id in receipts_by_payment:
                receipt = receipts_by_payment[p.id]
                payment_data["receipt"] = {
                    "method": receipt.method,
                    "reference": receipt.reference,
                    "attachment_url": receipt.attachment_url
                }
            
            payments_data.append(payment_data)
        
        return {"payments": payments_data}, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching user payments: {str(e)}")
        return {"error": "Failed to fetch user payments"}, 500

# NEW: Payment statistics
@payment_bp.route("/stats", methods=["GET"])
def payment_stats():
    """Get payment statistics for dashboard"""
    try:
        total_payments = Payment.query.count()
        successful_payments = Payment.query.filter_by(status="success").count()
        pending_verifications = Payment.query.filter_by(status="awaiting_verification").count()
        failed_payments = Payment.query.filter_by(status="failed").count()
        
        # Total revenue from successful payments
        total_revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter(Payment.status == "success").scalar() or 0
        
        # Today's stats
        today = datetime.utcnow().date()
        today_payments = Payment.query.filter(
            func.date(Payment.created_at) == today
        ).count()
        
        today_revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            and_(
                Payment.status == "success",
                func.date(Payment.created_at) == today
            )
        ).scalar() or 0
        
        return {
            "total": total_payments,
            "success": successful_payments,
            "pending": pending_verifications,
            "failed": failed_payments,
            "revenue": float(total_revenue),
            "today": {
                "payments": today_payments,
                "revenue": float(today_revenue)
            }
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching payment stats: {str(e)}")
        return {"error": "Failed to fetch payment statistics"}, 500

# ENHANCED: Better file handling for offline payments
@payment_bp.route("/offline", methods=["POST"])
def offline():
    try:
        # Handle both JSON and form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            file = request.files.get('attachment')
        else:
            data = request.get_json() or {}
            file = None
        
        order_id = data.get("order_id")
        method = data.get("method")   # bank_transfer | cash
        reference = data.get("reference")
        amount = data.get("amount")
        
        # Validation
        if not all([order_id, method, reference, amount]):
            return {"error": "order_id, method, reference, and amount are required"}, 400
        
        try:
            order_id = int(order_id)
            amount = float(amount)
            if amount <= 0:
                return {"error": "amount must be positive"}, 400
        except (ValueError, TypeError):
            return {"error": "Invalid order_id or amount format"}, 400
        
        if method not in ["bank_transfer", "cash"]:
            return {"error": "method must be 'bank_transfer' or 'cash'"}, 400
        
        # Handle file upload
        attachment_url = None
        if file and file.filename:
            if allowed_file(file.filename):
                filename = secure_filename(f"{secrets.token_hex(8)}_{file.filename}")
                
                # Ensure upload directory exists
                upload_path = os.path.join(current_app.instance_path, UPLOAD_FOLDER)
                os.makedirs(upload_path, exist_ok=True)
                
                file_path = os.path.join(upload_path, filename)
                file.save(file_path)
                attachment_url = f"/uploads/receipts/{filename}"
            else:
                return {"error": "Invalid file type. Allowed: pdf, jpg, jpeg, png, gif"}, 400
        
        # Create payment record
        p = Payment(
            order_id=order_id,
            amount=amount,
            provider="offline",
            channel="offline",
            status="awaiting_verification",
            payment_ref="OFF_" + secrets.token_hex(8),
            meta=_event({}, "offline_submit", {"method": method, "reference": reference})
        )
        db.session.add(p)
        db.session.flush()  # get p.id
        
        # Create receipt record
        r = OfflineReceipt(
            payment_id=p.id,
            method=method,
            reference=reference,
            amount=amount,
            attachment_url=attachment_url
        )
        db.session.add(r)
        db.session.commit()
        
        return {
            "payment_id": p.id, 
            "status": p.status, 
            "payment_ref": p.payment_ref,
            "message": "Offline payment submitted successfully"
        }, 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating offline payment: {str(e)}")
        return {"error": "Failed to create offline payment"}, 500

# NEW: Get payment details with receipt
@payment_bp.route("/<int:payment_id>", methods=["GET"])
def get_payment(payment_id: int):
    """Get detailed payment information including receipt"""
    try:
        p = Payment.query.get(payment_id)
        if not p:
            return {"error": "Payment not found"}, 404
        
        payment_data = {
            "id": p.id,
            "order_id": p.order_id,
            "amount": p.amount,
            "provider": p.provider,
            "channel": p.channel,
            "status": p.status,
            "payment_ref": p.payment_ref,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "meta": p.meta
        }
        
        # Get receipt if it's an offline payment
        if p.channel == "offline":
            receipt = OfflineReceipt.query.filter_by(payment_id=payment_id).first()
            if receipt:
                payment_data["receipt"] = {
                    "id": receipt.id,
                    "method": receipt.method,
                    "reference": receipt.reference,
                    "amount": receipt.amount,
                    "attachment_url": receipt.attachment_url,
                    "created_at": receipt.created_at.isoformat()
                }
        
        return payment_data, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching payment {payment_id}: {str(e)}")
        return {"error": "Failed to fetch payment"}, 500

# Your existing endpoints with minor improvements...

@payment_bp.route("/initiate", methods=["POST"])
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

@payment_bp.route("/webhook", methods=["POST"])
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

@payment_bp.route("/<int:payment_id>/verify", methods=["POST"])
def verify(payment_id: int):
    data = request.get_json() or {}
    approved = bool(data.get("approved"))

    try:
        p = Payment.query.get(payment_id)
        if not p:
            return {"error": "Payment not found"}, 404
        if p.status in ("success", "failed"):
            return {"message": "Payment already finalized", "status": p.status}, 200

        p.status = "success" if approved else "failed"
        p.meta = _event(p.meta, "offline_verify", {"approved": approved})
        db.session.commit()

        if approved:
            try:
                set_order_status(p.order_id, "paid")
                commit_stock(p.order_id)
                return {
                    "payment_id": p.id, 
                    "status": p.status, 
                    "order_status": "paid",
                    "message": "Payment approved and order updated"
                }, 200
            except Exception as e:
                current_app.logger.error(f"Error updating order status: {str(e)}")
                return {
                    "payment_id": p.id, 
                    "status": p.status,
                    "message": "Payment approved but order update failed"
                }, 200

        return {
            "payment_id": p.id, 
            "status": p.status,
            "message": "Payment rejected"
        }, 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error verifying payment: {str(e)}")
        return {"error": "Failed to verify payment"}, 500

@payment_bp.route("/by-order/<int:order_id>", methods=["GET"])
def by_order(order_id: int):
    try:
        rows = Payment.query.filter_by(order_id=order_id).order_by(Payment.created_at.desc()).all()
        
        payments_data = []
        for x in rows:
            payment_data = {
                "id": x.id,
                "status": x.status,
                "channel": x.channel,
                "amount": x.amount,
                "payment_ref": x.payment_ref,
                "created_at": x.created_at.isoformat(),
                "meta": x.meta
            }
            
            # Add receipt data for offline payments
            if x.channel == "offline":
                receipt = OfflineReceipt.query.filter_by(payment_id=x.id).first()
                if receipt:
                    payment_data["receipt"] = {
                        "method": receipt.method,
                        "reference": receipt.reference,
                        "attachment_url": receipt.attachment_url
                    }
            
            payments_data.append(payment_data)
        
        return {
            "order_id": order_id,
            "payments": payments_data
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching payments for order {order_id}: {str(e)}")
        return {"error": "Failed to fetch payments"}, 500