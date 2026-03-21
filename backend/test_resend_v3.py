import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

try:
    r = resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": "ayushmith249@gmail.com",
        "subject": "BaapCollab Test",
        "html": "<strong>It works!</strong>"
    })
    print(f"✅ Success! {r}")
except Exception as e:
    print(f"❌ Error: {e}")
