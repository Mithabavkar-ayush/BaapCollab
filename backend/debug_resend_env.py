import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("RESEND_API_KEY")
admin = os.getenv("ADMIN_EMAIL")

if key:
    print(f"Key loaded: {key[:5]}...{key[-3:]}")
else:
    print("❌ Key NOT loaded")

if admin:
    print(f"Admin loaded: [{admin}] (len: {len(admin)})")
else:
    print("❌ Admin NOT loaded")
