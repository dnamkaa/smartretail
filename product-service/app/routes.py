from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from .models import Product
from . import db

# Define blueprint for product routes
product_bp = Blueprint("products", __name__, url_prefix="/products")


# -------------------------------
# Helper: check admin role
# -------------------------------
def is_admin():
    claims = get_jwt()
    return claims.get("role") == "admin"


# -------------------------------
# PUBLIC ROUTES (no login required)
# -------------------------------

@product_bp.route("/", methods=["GET"])
def list_products():
    """List products with optional filters"""
    query = Product.query

    # Filters
    name = request.args.get("name")          # search by name
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")
    category = request.args.get("category")  # later we can add category field

    if name:
        query = query.filter(Product.name.ilike(f"%{name}%"))  # case-insensitive search
    if min_price:
        query = query.filter(Product.price >= float(min_price))
    if max_price:
        query = query.filter(Product.price <= float(max_price))
    # Note: category is not yet in Product model, but can be added later

    products = query.all()

    result = []
    for p in products:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stock": p.stock,
            "image_url": p.image_url,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })

    return jsonify(result), 200


@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Get a single product by ID (public)"""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock,
        "image_url": product.image_url,
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }), 200


# -------------------------------
# ADMIN ROUTES (require JWT + role)
# -------------------------------

@product_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    """Admin: Add a new product"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    data = request.get_json()
    required_fields = ["name", "price", "stock"]
    for f in required_fields:
        if f not in data:
            return jsonify({"error": f"{f} is required"}), 400

    new_product = Product(
        name=data["name"],
        description=data.get("description", ""),
        price=data["price"],
        stock=data["stock"],
        image_url=data.get("image_url", "")
    )
    db.session.add(new_product)
    db.session.commit()

    return jsonify({"message": "Product created", "id": new_product.id}), 201


@product_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    """Admin: Update an existing product"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()
    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)
    product.price = data.get("price", product.price)
    product.stock = data.get("stock", product.stock)
    product.image_url = data.get("image_url", product.image_url)

    db.session.commit()
    return jsonify({"message": "Product updated"}), 200


@product_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    """Admin: Delete a product"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200


@product_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_add_products():
    """Admin: Add multiple products at once"""
    if not is_admin():
        return jsonify({"error": "Admins only"}), 403

    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected a list of products"}), 400

    products = []
    for item in data:
        # Validate required fields
        if "name" not in item or "price" not in item or "stock" not in item:
            return jsonify({"error": "Each product requires name, price, and stock"}), 400

        product = Product(
            name=item["name"],
            description=item.get("description", ""),
            price=item["price"],
            stock=item["stock"],
            image_url=item.get("image_url", "")
        )
        products.append(product)

    db.session.bulk_save_objects(products)
    db.session.commit()

    return jsonify({"message": f"{len(products)} products added successfully"}), 201

@product_bp.route("/<int:product_id>/stock", methods=["PUT"])
def update_stock(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()
    quantity = data.get("quantity", 0)  # can be positive or negative

    product.stock += quantity
    if product.stock < 0:
        return jsonify({"error": "Stock cannot be negative"}), 400

    db.session.commit()
    return jsonify({"message": f"Stock updated for {product.name}", "stock": product.stock}), 200
