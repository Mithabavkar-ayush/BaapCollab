import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

try:
    email = resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": os.getenv("ADMIN_EMAIL", "ayushmith249@gmail.com"),
        "subject": "Test Email from BaapCollab",
        "html": "<p>This is a test email to verify Resend configuration.</p>"
    })
    print(f"✅ Test Email Sent: {email}")
except Exception as e:
    print(f"❌ Test Email Failed: {e}")
