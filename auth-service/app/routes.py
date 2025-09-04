from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from datetime import timedelta
from . import db
from .models import User

# Create a Blueprint for auth routes
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")




# Register endpoint
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        # 1. Parse incoming JSON request body
        data = request.get_json()

        # 2. Validate required fields
        required_fields = ["first_name", "email", "password"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        # 3. Check if user already exists
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user:
            return jsonify({"error": f"User with email {data['email']} already exists"}), 400

        # 4. Hash the password
        hashed_password = generate_password_hash(data["password"])

        # 5. Create new User object
        user = User(
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),  # optional
            email=data["email"],
            password_hash=hashed_password,
            role="customer"  # default role
        )

        # 6. Save to database
        db.session.add(user)
        db.session.commit()

        # 7. Return success response
        print(f'{user.first_name} registered successfully.')
        return jsonify({"message": f'User {user.first_name} registered successfully'}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/users", methods=["GET"])
@jwt_required()   # 👈 must be logged in
def list_users():
    try:
        # Extract claims from JWT
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admins only"}), 403

        # If admin, return all users
        users = User.query.all()
        result = [
            {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at
            }
            for u in users
        ]
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


    
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        # 1. Validate input
        if not data or "email" not in data or "password" not in data:
            return jsonify({"error": "Email and password are required"}), 400

        # 2. Find user by email
        user = User.query.filter_by(email=data["email"]).first()
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # 3. Verify password
        if not user.check_password(data["password"]):
            return jsonify({"error": "Invalid email or password"}), 401

        # 4. Generate JWT token (expires in 1 hour)
        access_token = create_access_token(
            identity=str(user.id),  # store user id in the token
            additional_claims={"role": user.role},  #embed role in token
            expires_delta=timedelta(hours=1)
        )


        # 5. Return token and user info
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# ----------------------
# Get current user (protected route)
# ----------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    try:
        # 1. Get user id from JWT (we stored it in login)
        user_id =int(get_jwt_identity())

        # 2. Look up user in DB
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # 3. Return user details (no password)
        return jsonify({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@auth_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def update_role(user_id):
    try:
        # 1. Check if current user is admin
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admins only"}), 403

        # 2. Parse new role from request body
        data = request.get_json()
        new_role = data.get("role")
        if new_role not in ["admin", "customer"]:
            return jsonify({"error": "Role must be 'admin' or 'customer'"}), 400

        # 3. Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # 4. Prevent last admin from being demoted
        admin_count = User.query.filter_by(role="admin").count()
        if user.role == "admin" and new_role != "admin" and admin_count == 1:
            return jsonify({"error": "Cannot remove the last admin"}), 400

        # 5. Update role and save
        user.role = new_role
        db.session.commit()

        return jsonify({
            "message": f"User {user.email} role updated to {new_role}"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@auth_bp.route("/users/<int:user_id>/deactivate", methods=["PUT"])
@jwt_required()
def deactivate_user(user_id):
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admins only"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Prevent last admin deactivation
        admin_count = User.query.filter_by(role="admin", is_active=True).count()
        if user.role == "admin" and admin_count == 1:
            return jsonify({"error": "Cannot deactivate the last admin"}), 400

        user.is_active = False
        db.session.commit()

        return jsonify({"message": f"User {user.email} deactivated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admins only"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Prevent last admin deletion
        admin_count = User.query.filter_by(role="admin", is_active=True).count()
        if user.role == "admin" and admin_count == 1:
            return jsonify({"error": "Cannot delete the last admin"}), 400

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": f"User {user.email} permanently deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
