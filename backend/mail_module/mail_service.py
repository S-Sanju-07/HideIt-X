import smtplib
import ssl
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

MAIL_EMAIL    = os.getenv("MAIL_EMAIL", "").strip()
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "").strip()

# Pre-build a default SSL context once at module load (reused on every call)
_SSL_CONTEXT = ssl.create_default_context()


def send_email(to_email, subject, body, file_path, sender_username="Unknown", sender_email="Unknown"):

    if not MAIL_EMAIL or not MAIL_PASSWORD:
        raise Exception("Mail credentials not configured. Check MAIL_EMAIL and MAIL_PASSWORD in .env")

    if not to_email:
        raise Exception("Recipient email address is required.")

    print(f"[MAIL] Preparing email: From={MAIL_EMAIL} To={to_email} Subject={subject}")

    # Append sender info to the email body
    full_body = (
        f"{body}\n\n"
        f"====================================================\n"
        f"   Sent via HideIT-X Secure Mail\n"
        f"   Sender Name  : {sender_username}\n"
        f"   Sender Email : {sender_email}\n"
        f"===================================================="
    )

    msg = EmailMessage()
    msg["From"]    = MAIL_EMAIL
    msg["To"]      = to_email
    msg["Subject"] = subject
    msg.set_content(full_body)

    # Attach file
    with open(file_path, "rb") as f:
        file_data = f.read()
        file_name = os.path.basename(file_path)

    msg.add_attachment(
        file_data,
        maintype="application",
        subtype="octet-stream",
        filename=file_name
    )

    # -- Attempt 1: SSL on port 465 (fastest — no upgrade handshake needed) --
    try:
        print("[SMTP] Connecting to smtp.gmail.com:465 (SSL)...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=120, context=_SSL_CONTEXT) as smtp:
            smtp.login(MAIL_EMAIL, MAIL_PASSWORD)
            smtp.send_message(msg)
            print("[SMTP] Mail sent successfully via SSL (465)")
            return True
    except smtplib.SMTPAuthenticationError:
        raise Exception("Authentication failed. Please verify your Gmail App Password in .env")
    except smtplib.SMTPRecipientsRefused:
        raise Exception(f"Recipient refused: {to_email}. Please check the email address.")
    except Exception as e:
        ssl_error = str(e)
        print(f"[SMTP] SSL (465) failed: {ssl_error} -- retrying via STARTTLS (587)...")

    # -- Attempt 2: STARTTLS on port 587 (fallback) --
    try:
        print("[SMTP] Connecting to smtp.gmail.com:587 (STARTTLS)...")
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=120) as smtp:
            smtp.starttls(context=_SSL_CONTEXT)
            smtp.login(MAIL_EMAIL, MAIL_PASSWORD)
            smtp.send_message(msg)
            print("[SMTP] Mail sent successfully via STARTTLS (587)")
            return True
    except smtplib.SMTPAuthenticationError:
        raise Exception("Authentication failed. Please verify your Gmail App Password in .env")
    except smtplib.SMTPRecipientsRefused:
        raise Exception(f"Recipient refused: {to_email}. Please check the email address.")
    except Exception as tls_error:
        raise Exception(f"SMTP failed on both ports. SSL(465): {ssl_error} | TLS(587): {str(tls_error)}")
