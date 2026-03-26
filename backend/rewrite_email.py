import os
import re

email_utils_path = "c:\\Users\\intel\\.vscode\\coding\\vibe\\BaapCollab\\backend\\email_utils.py"

with open(email_utils_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract generate_identity_card
match = re.search(r"def generate_identity_card\(user_email.*?(?=def send_approval_request)", content, re.DOTALL)
if not match:
    raise ValueError("Could not extract generate_identity_card")
gen_card_code = match.group(0)

new_content = f"""import os
import resend
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
from io import BytesIO
import base64

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "re_NzLhRrdq_EkRNav8CoUDG4jYcUE26KapJ")

MAIL_FROM = os.getenv("MAIL_FROM", "BaapCollab <onboarding@resend.dev>")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ayushmith249@gmail.com")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

{gen_card_code}
def send_approval_request(user_email, branch_name, user_id, name, bio, dept, year, skills, linkedin, github):
    \"\"\"
    Sends a high-fidelity verification request email with attached CID image via Resend.
    \"\"\"
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing - skipping approval email")
            return False

        # Generate the card
        img = generate_identity_card(user_email, branch_name, user_id, name, bio, dept, year, skills, linkedin, github)
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_data = buffered.getvalue()

        approve_link = f"{{BACKEND_URL}}/auth/admin/approve/{{user_id}}"

        html_body = f\"\"\"
        <html>
            <body style="font-family: sans-serif; background-color: #f4f4f7; padding: 40px;">
                <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a1a;">New Access Request</h2>
                    <p style="color: #51545e; font-size: 16px;">A user has requested access to the BaapCollab platform.</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <p><em>Identity Card attached below</em></p>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="{{approve_link}}" style="background-color: #524EEE; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px;">Approve Access Now</a>
                    </div>
                </div>
            </body>
        </html>
        \"\"\"
        
        # --- RESEND SENDING ---
        print(f"📡 [EMAIL] Sending approval request via Resend API to {{ADMIN_EMAIL}}...")
        resend.Emails.send({{
            "from": MAIL_FROM,
            "to": ADMIN_EMAIL,
            "subject": f"🚨 ACTION REQUIRED: Verify {{name}}",
            "html": html_body,
            "attachments": [
                {{"filename": "identity_card.png", "content": list(img_data)}}
            ]
        }})
        print(f"✅ [EMAIL] Approval Request Sent for {{user_email}}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send approval email: {{e}}")
        traceback.print_exc()
        return False

def send_access_granted(user_email):
    \"\"\"
    Notifies the user that their access has been granted using Resend.
    \"\"\"
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing - skipping access granted notification")
            return False

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        html = f\"\"\"
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>High Five! ✋</h2>
                <p>Your identity has been verified by the admin.</p>
                <p>You can now log in and start collaborating on projects.</p>
                <a href="{{frontend_url}}" style="background-color: #524EEE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            </div>
        \"\"\"

        print(f"📡 [EMAIL] Sending access_granted to {{user_email}} via Resend...")
        resend.Emails.send({{
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "🎉 Welcome to BaapCollab: Access Granted!",
            "html": html
        }})
            
        print(f"✅ [EMAIL] Access Granted Notification Sent to {{user_email}}")
        return True
    except Exception as e:
        print(f"❌ Failed to send access granted email: {{e}}")
        return False

def send_welcome_otp(user_email: str, otp: str) -> bool:
    \"\"\"
    Sends a professional Welcome email with a 6-digit OTP for email verification via Resend.
    \"\"\"
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing — skipping OTP email")
            return False

        html = f\"\"\"<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(82,78,238,.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#524EEE 0%,#6366f1 100%);padding:40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">BaapCollab</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75);letter-spacing:2px;text-transform:uppercase;">Student Community</p>
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px 32px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Verify your email address</h2>
            <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.6;">Welcome to BaapCollab! Use the one-time code below to verify your account. This code expires in <strong>10 minutes</strong>.</p>
            <div style="background:#F3F4FF;border:2px solid #E0E0FF;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 8px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your verification code</p>
              <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#524EEE;font-family:monospace;">{{otp}}</p>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;">If you didn't create a BaapCollab account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2025 BaapCollab · Student Collaboration Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>\"\"\"

        print(f"📡 [EMAIL] Sending welcome_otp to {{user_email}} via Resend API...")
        resend.Emails.send({{
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "🔐 Verify your BaapCollab account",
            "html": html
        }})

        print(f"✅ Welcome OTP email sent to {{user_email}}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send welcome OTP email: {{e}}")
        traceback.print_exc()
        return False

def send_password_reset_email(user_email: str, reset_link: str) -> bool:
    \"\"\"
    Sends a professional password reset email via Resend API.
    \"\"\"
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing — skipping reset email")
            return False

        html = f\"\"\"<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(82,78,238,.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#524EEE 0%,#6366f1 100%);padding:40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">BaapCollab</p>
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px 32px;text-align:center;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h2>
            <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.6;">You requested a password reset for BaapCollab. Click the button below to set a new password.<br/><br/><b>This link is valid for only 5 minutes. If it expires, you will need to request a new one.</b></p>
            <a href="{{reset_link}}" style="display:inline-block;background-color:#524EEE;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
            <p style="margin:32px 0 0;font-size:13px;color:#9CA3AF;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>\"\"\"
        
        print(f"📡 [EMAIL] Sending password_reset_email to {{user_email}} via Resend API...")
        resend.Emails.send({{
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "🔐 Password Reset for BaapCollab",
            "html": html
        }})

        print(f"✅ Password reset email sent to {{user_email}}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send password reset email: {{e}}")
        traceback.print_exc()
        return False
"""

with open(email_utils_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("email_utils.py successfully updated for Resend!")
