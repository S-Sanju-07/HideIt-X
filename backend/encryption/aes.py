import os
from cryptography.fernet import Fernet

# Load key from secret.key if it exists, otherwise generate one
KEY_FILE = "secret.key"
if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        KEY = f.read().strip()
else:
    KEY = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(KEY)

cipher = Fernet(KEY)

def encrypt_text(text):
    return cipher.encrypt(text.encode()).decode()

def decrypt_text(text):
    return cipher.decrypt(text.encode()).decode()
