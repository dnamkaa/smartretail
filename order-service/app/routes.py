from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from . import db
from .models import Order, OrderItem, Product   # ✅ use Product directly

order_bp = Blueprint("orders", __name__, url_prefix="/orders")

# ---------------------------------
# Helper: check if user is admin
# ---------------------------------
def is_admin():
    claims = get_jwt()
    return claims.get("role") == "admin"


# ---------------------------------
# Place Order (Customer)
# ---------------------------------
@order_bp.route("/", methods=["POST"])
@jwt_required()
def place_order():
    """Customer places an order, stock reduces directly from DB"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or "items" not in data:
        return jsonify({"error": "Items are required"}), 400

    order = Order(user_id=user_id)
    db.session.add(order)
    db.session.flush()

    for item in data["items"]:
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": f"Product {product_id} not found"}), 404
        if product.stock < quantity:
            return jsonify({"error": f"Not enough stock for {product.name}"}), 400

        # Reduce stock directly
        product.stock -= quantity

        # Add item with snapshot price
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            price=product.price
        )
        db.session.add(order_item)

    db.session.commit()
    return jsonify({"message": f"Order {order.id} placed successfully"}), 201


# ---------------------------------
# Cancel Order (Restore Stock)
# ---------------------------------
@order_bp.route("/<int:order_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order, restore stock if pending/paid"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if not is_admin() and order.user_id != user_id:
        return jsonify({"error": "Not authorized to cancel this order"}), 403
    if order.status not in ["pending", "paid"]:
        return jsonify({"error": f"Cannot cancel an order with status {order.status}"}), 400

    # Restore stock directly
    for item in order.items:
        product = Product.query.get(item.product_id)
        if product:
            product.stock += item.quantity

    order.status = "cancelled"
    db.session.commit()

    return jsonify({
        "message": f"Order {order.id} has been cancelled and stock restored",
        "order_id": order.id,
        "status": order.status
    }), 200


# ---------------------------------
# View My Orders (Customer)
# ---------------------------------
@order_bp.route("/", methods=["GET"])
@jwt_required()
def my_orders():
    """Customer views their own orders"""
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).all()

    result = []
    for o in orders:
        result.append({
            "order_id": o.id,
            "status": o.status,
            "created_at": o.created_at,
            "items": [
                {"product_id": i.product_id, "quantity": i.quantity, "price": i.price}
                for i in o.items
            ]
        })

    return jsonify(result), 200


# ---------------------------------
# View All Orders (Admin)
# ---------------------------------
@order_bp.route("/all", methods=["GET"])
@jwt_required()
def all_orders():
    """Admin: view all orders"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    orders = Order.query.all()
    result = []
    for o in orders:
        result.append({
            "order_id": o.id,
            "user_id": o.user_id,
            "status": o.status,
            "created_at": o.created_at,
            "items": [
                {"product_id": i.product_id, "quantity": i.quantity, "price": i.price}
                for i in o.items
            ]
        })

    return jsonify(result), 200


# ---------------------------------
# Get Single Order
# ---------------------------------
@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    """Fetch a single order (customer sees own, admin sees any)"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404

    if not is_admin() and order.user_id != user_id:
        return jsonify({"error": "Not authorized to view this order"}), 403

    result = {
        "order_id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "created_at": order.created_at,
        "items": [
            {"product_id": i.product_id, "quantity": i.quantity, "price": i.price}
            for i in order.items
        ]
    }

    return jsonify(result), 200


# ---------------------------------
# Update Order Status (Admin)
# ---------------------------------
@order_bp.route("/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):
    """Admin updates order status"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["pending", "paid", "shipped", "delivered", "cancelled"]:
        return jsonify({"error": "Invalid status"}), 400

    order.status = new_status
    db.session.commit()

    return jsonify({
        "message": f"Order {order.id} status updated to {new_status}",
        "order_id": order.id,
        "status": order.status
    }), 200
