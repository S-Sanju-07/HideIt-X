from flask import Flask, jsonify, request, send_file, g
from flask_cors import CORS
from auth import auth_bp
from jwt_required import token_required
from database import users_collection
from bson.objectid import ObjectId

from encryption.aes import encrypt_text, decrypt_text
from steganography.image_stego import encode_image, decode_image
from steganography.text_stego import encode_text, decode_text
from steganography.audio.audio_encode import encode_audio, encode_audio_eof
from steganography.audio.audio_decode import decode_audio
from steganography.video.video_encode import encode_video, encode_video_eof
from steganography.video.video_decode import decode_video

from mail_module.routes import mail_bp


import os
import uuid
import base64




# ================= AUDIO (FFMPEG FIX) =================
from pydub import AudioSegment

AudioSegment.converter = r"C:\ffmpeg-8.0.1-essentials_build\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg-8.0.1-essentials_build\ffmpeg-8.0.1-essentials_build\bin\ffprobe.exe"
# =====================================================

app = Flask(__name__)

# Explicit CORS — allows all origins on all routes
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

# Hard guarantee: attach CORS header to EVERY response,
# including 500 crashes where flask_cors might not fire.
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Handle OPTIONS preflight for all routes
@app.before_request
def handle_preflight():
    from flask import request as req
    if req.method == "OPTIONS":
        from flask import make_response
        res = make_response()
        res.headers["Access-Control-Allow-Origin"]  = "*"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        res.status_code = 200
        return res

app.register_blueprint(mail_bp)

# ---------------- AUTH ----------------
app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return "HideIT X Backend Running"


# ---------------- DASHBOARD ----------------
@app.route("/dashboard")
@token_required
def dashboard():
    return jsonify({"message": "Welcome to protected dashboard"})

@app.route("/dashboard/stats")
@token_required
def get_stats():
    user = users_collection.find_one({"_id": ObjectId(g.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    db_stats = user.get("stats", {})
    stats = {
        "image_encode": db_stats.get("image_encode", 0),
        "image_decode": db_stats.get("image_decode", 0),
        "audio_encode": db_stats.get("audio_encode", 0),
        "audio_decode": db_stats.get("audio_decode", 0),
        "video_encode": db_stats.get("video_encode", 0),
        "video_decode": db_stats.get("video_decode", 0),
        "text_encode": db_stats.get("text_encode", 0),
        "text_decode": db_stats.get("text_decode", 0),
        "mail": db_stats.get("mail", 0)
    }
    return jsonify(stats)

# =================================================
# =============== IMAGE ENCODE =====================
# =================================================
@app.route("/image/encode", methods=["POST"])
@token_required
def image_encode():
    try:
        image = request.files.get("image")
        text = request.form.get("text")

        if not image or not text:
            return jsonify({"error": "Image or text missing"}), 400

        os.makedirs("uploads", exist_ok=True)

        input_path = "uploads/input.png"
        output_path = "uploads/encoded.png"

        from PIL import Image
        img = Image.open(image)
        img = img.convert("RGB")
        img.save(input_path, "PNG")

        encrypted_text = encrypt_text(text)
        encode_image(input_path, encrypted_text, output_path)

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.image_encode": 1}})

        return send_file(
            output_path,
            as_attachment=True,
            download_name="encoded.png",
            mimetype="image/png"
        )

    except Exception as e:
        print("❌ IMAGE ENCODE ERROR:", e)
        return jsonify({"error": "Encoding failed"}), 500


# =================================================
# =============== IMAGE DECODE =====================
# =================================================
@app.route("/image/decode", methods=["POST"])
@token_required
def image_decode():
    try:
        image = request.files.get("image")

        if not image:
            return jsonify({"error": "Image missing"}), 400

        os.makedirs("uploads", exist_ok=True)

        image_path = f"uploads/{uuid.uuid4().hex}.png"
        image.save(image_path)

        encrypted_text = decode_image(image_path)

        if not encrypted_text:
            return jsonify({"error": "No hidden message found"}), 400

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.image_decode": 1}})

        secret_message = decrypt_text(encrypted_text)
        return jsonify({"secret_message": secret_message})

    except Exception as e:
        print("❌ IMAGE DECODE ERROR:", e)
        return jsonify({"error": "Decode failed"}), 500


# =================================================
# ============ TEXT FILE ENCODE ====================
# =================================================
@app.route("/text-file/encode", methods=["POST"])
@token_required
def text_file_encode():
    try:
        file = request.files.get("file")
        secret_text = request.form.get("secret_text")

        if not file or not secret_text:
            return jsonify({"error": "File or secret text missing"}), 400

        cover_text = file.read().decode("utf-8")
        stego_text = encode_text(cover_text, secret_text)

        os.makedirs("uploads", exist_ok=True)
        output_path = "uploads/encoded_text.txt"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(stego_text)

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.text_encode": 1}})

        return send_file(
            output_path,
            as_attachment=True,
            download_name="encoded_text.txt",
            mimetype="text/plain"
        )

    except Exception as e:
        print("❌ TEXT FILE ENCODE ERROR:", e)
        return jsonify({"error": "Text file encode failed"}), 500


# =================================================
# ============ TEXT FILE DECODE ====================
# =================================================
@app.route("/text-file/decode", methods=["POST"])
@token_required
def text_file_decode():
    try:
        file = request.files.get("file")

        if not file:
            return jsonify({"error": "File missing"}), 400

        stego_text = file.read().decode("utf-8")
        secret_message = decode_text(stego_text)

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.text_decode": 1}})

        return jsonify({"secret_message": secret_message})

    except Exception as e:
        print("❌ TEXT FILE DECODE ERROR:", e)
        return jsonify({"error": "Text file decode failed"}), 500


# =================================================
# ============ AUDIO ENCODE ========================
# =================================================
@app.route("/audio/encode", methods=["POST"])
@token_required
def audio_encode():
    try:
        audio = request.files.get("audio")
        text = request.form.get("text")

        if not audio or not text:
            return jsonify({"error": "Audio or text missing"}), 400

        os.makedirs("uploads", exist_ok=True)
        os.makedirs("outputs", exist_ok=True)

        uid = uuid.uuid4().hex
        ext = os.path.splitext(audio.filename)[1].lower()
        if not ext:
            ext = ".mp3"
            
        input_path = f"uploads/{uid}{ext}"
        output_path = f"outputs/encoded_audio{ext}"

        audio.save(input_path)

        encrypted_text = encrypt_text(text)
        encode_audio_eof(input_path, encrypted_text, output_path)

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.audio_encode": 1}})

        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"encoded_audio{ext}",
            mimetype=audio.mimetype or "audio/mpeg"
        )

    except Exception as e:
        print("❌ AUDIO ENCODE ERROR:", e)
        return jsonify({"error": "Audio encode failed"}), 500


# =================================================
# ============ AUDIO DECODE ========================
# =================================================
@app.route("/audio/decode", methods=["POST"])
@token_required
def audio_decode():
    try:
        audio = request.files.get("audio")

        if not audio:
            return jsonify({"error": "Audio file missing"}), 400

        os.makedirs("uploads", exist_ok=True)

        wav_path = f"uploads/{uuid.uuid4().hex}.wav"
        audio.save(wav_path)

        encrypted_text = decode_audio(wav_path)

        if not encrypted_text:
            return jsonify({"error": "No hidden message found"}), 400

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.audio_decode": 1}})

        secret_message = decrypt_text(encrypted_text)
        return jsonify({"secret_message": secret_message})

    except Exception as e:
        print("❌ AUDIO DECODE ERROR:", e)
        return jsonify({"error": "Audio decode failed"}), 500


# =================================================
# ============ VIDEO ENCODE (MP4 SAFE) =============
# =================================================
@app.route("/video/encode", methods=["POST"])
@token_required
def video_encode():
    try:
        video = request.files.get("video")
        text = request.form.get("text")

        if not video or not text:
            return jsonify({"error": "Video or text missing"}), 400

        os.makedirs("uploads", exist_ok=True)
        os.makedirs("outputs", exist_ok=True)

        uid = uuid.uuid4().hex
        ext = os.path.splitext(video.filename)[1].lower()
        if not ext:
            ext = ".mp4"
            
        input_video = f"uploads/{uid}{ext}"
        output_video = f"outputs/encoded_video{ext}"

        video.save(input_video)
        encrypted_text = encrypt_text(text)

        encode_video_eof(input_video, encrypted_text, output_video)

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.video_encode": 1}})

        # ✅ FIX 1: ensure file exists before sending
        if not os.path.exists(output_video):
            return jsonify({"error": "Video processing failed"}), 500

        return send_file(
            output_video,
            as_attachment=True,
            download_name=f"encoded_video{ext}",
            mimetype=video.mimetype or "video/mp4"
        )

    except Exception as e:
        print("❌ VIDEO ENCODE ERROR:", e)
        return jsonify({"error": "Video encode failed"}), 500


# =================================================
# ============ VIDEO DECODE ========================
# =================================================
@app.route("/video/decode", methods=["POST"])
@token_required
def video_decode():
    try:
        video = request.files.get("video")
        if not video:
            return jsonify({"error": "Video file missing"}), 400

        os.makedirs("uploads", exist_ok=True)

        # keep original extension
        ext = os.path.splitext(video.filename)[1]
        path = f"uploads/{uuid.uuid4().hex}{ext}"
        video.save(path)

        # decode hidden data from video
        safe_text = decode_video(path)
        if not safe_text:
            return jsonify({"error": "No hidden message found"}), 400

        try:
            # The text from decode_video is already the Fernet token string
            secret_message = decrypt_text(safe_text)
        except Exception as e:
            print("❌ DECRYPTION ERROR:", e)
            # MP4 compression corruption handling
            return jsonify({
                "error": "Hidden data corrupted or invalid key"
            }), 400

        users_collection.update_one({"_id": ObjectId(g.user_id)}, {"$inc": {"stats.video_decode": 1}})

        return jsonify({"secret_message": secret_message})

    except Exception as e:
        print("❌ VIDEO DECODE ERROR:", e)
        return jsonify({"error": "Video decode failed"}), 500



# ---------------- RUN ----------------
if __name__ == "__main__":
    # use_reloader=False  → prevents the stat-watcher from restarting Flask
    #                       mid-request (which drops TCP connections and looks
    #                       like a CORS error to the browser).
    # threaded=True       → each request runs in its own thread so a slow SMTP
    #                       call doesn't block dashboard/stats polling.
    app.run(debug=True, use_reloader=False, threaded=True)
