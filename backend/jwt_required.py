from flask import request, jsonify, g
import jwt
from functools import wraps
from config import SECRET_KEY

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"message": "Token is missing"}), 401

        try:
            token = auth_header.split(" ")[1]  # Bearer <token>
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user_id = data["user_id"]
        except Exception as e:
            print("JWT ERROR:", e)
            return jsonify({"message": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated
