from email_utils import send_approval_request
import os
from dotenv import load_dotenv

load_dotenv()

admin_email = os.getenv("ADMIN_EMAIL", "ayushmith249@gmail.com")

print(f"Testing real email delivery to: {admin_email}...")

# Dummy data for the identity card
success = send_approval_request(
    user_email="test_user@example.com",
    branch_name="The Baap Company - Selu",
    user_id=999,
    name="Test User",
    bio="Testing the identity card delivery",
    dept="Computer Science",
    year=2026,
    skills="Python, React, SMTP",
    linkedin="https://linkedin.com/in/test",
    github="https://github.com/test"
)

if success:
    print("✅ SUCCESS: send_approval_request reported success!")
    print(f"Please check {admin_email} (including Spam folder).")
else:
    print("❌ FAILURE: send_approval_request failed.")
