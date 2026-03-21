import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
admin_email = os.getenv("ADMIN_EMAIL", "ayushmith249@gmail.com")

print(f"Attempting to send from 'onboarding@resend.dev' to '{admin_email}'...")

try:
    # Very simple send
    r = resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": admin_email,
        "subject": "BaapCollab Setup Test",
        "text": "If you see this, Resend is working for the owner email."
    })
    print(f"✅ Success! Response: {r}")
except Exception as e:
    print(f"❌ Error: {e}")
