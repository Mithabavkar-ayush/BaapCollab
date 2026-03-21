import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER", "thebaapcollab@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def test_connection():
    if not SMTP_PASSWORD:
        print("❌ ERROR: SMTP_PASSWORD environment variable is missing!")
        return

    print(f"Attempting to connect to {SMTP_SERVER} as {SMTP_USER}...")
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ SUCCESS: SMTP connection and login successful!")
        server.quit()
    except Exception as e:
        print(f"❌ FAILURE: Could not connect to SMTP server. Error: {e}")
        print("\nPossible reasons:")
        print("1. SMTP_PASSWORD is not a valid 16-character Gmail App Password.")
        print("2. Port 587 is blocked (unlikely on Railway).")
        print("3. Gmail account has 2FA disabled or doesn't allow App Passwords.")

if __name__ == "__main__":
    test_connection()
