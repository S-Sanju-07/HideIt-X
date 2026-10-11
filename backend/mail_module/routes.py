from flask import Blueprint, request, jsonify, g
from mail_module.mail_service import send_email
from jwt_required import token_required
from werkzeug.utils import secure_filename
from database import users_collection
from bson.objectid import ObjectId

import traceback
import os

mail_bp = Blueprint("mail", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)




@mail_bp.route("/mail/send", methods=["POST"])
@token_required
def send_mail():

    # Capture user_id NOW — must be read inside the request context
    user_id = g.user_id

    # Fetch sender's username and email from DB
    sender_username = "Unknown"
    sender_email    = "Unknown"
    try:
        sender_doc = users_collection.find_one(
            {"_id": ObjectId(user_id)}, {"username": 1, "email": 1}
        )
        if sender_doc:
            sender_username = sender_doc.get("username", "Unknown")
            sender_email    = sender_doc.get("email",    "Unknown")
    except Exception as e:
        print(f"[MAIL] Could not fetch sender info: {e}")

    to_email = request.form.get("to",      "").strip()
    subject  = request.form.get("subject", "").strip()
    body     = request.form.get("body",    "").strip()
    file     = request.files.get("file")

    if not to_email or not subject or not body:
        return jsonify({"error": "Recipient, subject, and body are required."}), 400

    if not file:
        return jsonify({"error": "No attachment file uploaded."}), 400

    # Save the uploaded file to disk BEFORE spawning the thread
    safe_name = secure_filename(file.filename) or "attachment"
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(file_path)

    print(f"[MAIL] Starting synchronous delivery: {to_email} | file={safe_name} | from={sender_username} <{sender_email}>")

    try:
        # ── Synchronous mail delivery ─────────────────────────────────────────────
        send_email(to_email, subject, body, file_path, sender_username, sender_email)

        # Update stats only on successful delivery
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"stats.mail": 1}}
        )
        print(f"[MAIL] Successfully delivered to {to_email}")
        
        return jsonify({"message": "Mail sent successfully!"})
        
    except Exception as e:
        print(f"[MAIL ERROR] Synchrounous delivery failed: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up the temp attachment file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as err:
                print(f"[WARN] Cleanup failed for {file_path}: {err}")
