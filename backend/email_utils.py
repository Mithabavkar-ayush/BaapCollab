import os
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

def generate_identity_card(user_email, branch_name, user_id, name, bio, dept, year, skills, linkedin, github):
    """
    Generates a high-fidelity identity card matching the user's demo design with diagonal gradient.
    """
    width, height = 1200, 920
    image = Image.new("RGB", (width, height), (32, 12, 82))
    draw = ImageDraw.Draw(image)

    # Diagonal Gradient Effect
    for x in range(width):
        for y in range(0, height, 4): # Step for performance
            # Transition from deep purple to darker/richer purple diagonally
            dist = (x + y) / (width + height)
            r = int(45 - dist * 25)
            g = int(22 - dist * 15)
            b = int(120 - dist * 60)
            draw.point((x, y), fill=(r, g, b))
            draw.point((x, y+1), fill=(r, g, b))
            draw.point((x, y+2), fill=(r, g, b))
            draw.point((x, y+3), fill=(r, g, b))

    try:
        # Standard Windows fonts
        font_path_bold = "C:/Windows/Fonts/segoeuib.ttf"
        font_path_reg = "C:/Windows/Fonts/SegoeUI.ttf"
        font_path_italic = "C:/Windows/Fonts/segoeuii.ttf"
        
        name_font = ImageFont.truetype(font_path_bold, 96) # Slightly smaller
        label_font = ImageFont.truetype(font_path_bold, 26)
        subtitle_font = ImageFont.truetype(font_path_reg, 50)
        bio_font = ImageFont.truetype(font_path_italic, 36)
        pill_font = ImageFont.truetype(font_path_bold, 34)
        verify_font = ImageFont.truetype(font_path_reg, 26)
        brand_font = ImageFont.truetype(font_path_bold, 28) # Larger
        footer_font = ImageFont.truetype(font_path_reg, 24)
    except:
        name_font = label_font = subtitle_font = bio_font = pill_font = verify_font = brand_font = footer_font = ImageFont.load_default()

    # Top Left Brand Area
    try:
        # White square for logo
        draw.rounded_rectangle([70, 70, 180, 180], radius=20, fill=(255, 255, 255))
        logo_path = "c:/Users/intel/.vscode/coding/vibe/BaapCollab/backend/baap_logo.jpg"
        if os.path.exists(logo_path):
            logo = Image.open(logo_path).convert("RGBA")
            logo = logo.resize((90, 90))
            image.paste(logo, (80, 80), logo)
    except Exception as e:
        print(f"Logo error: {e}")

    draw.text((205, 90), "BAAPCOLLAB", font=brand_font, fill=(255, 255, 255))
    draw.text((205, 128), "COMMUNITY", font=brand_font, fill=(255, 255, 255, 180))

    # Top Right Verification Label
    v_text = "NEW MEMBER VERIFICATION"
    v_bbox = draw.textbbox((0, 0), v_text, font=verify_font)
    v_w = v_bbox[2] - v_bbox[0]
    draw.text((width - v_w - 70, 110), v_text, font=verify_font, fill=(255, 255, 255, 180))
    # Line
    draw.line([(width - v_w - 220, 128), (width - v_w - 90, 128)], fill=(255, 255, 255, 100), width=1)

    # Main Content: Name Format and Dynamic Scaling (V20)
    safe_name = (name or "Baap Member").split(" optional")[0].lower()
    
    # Dynamic font scaling if name > 15 chars (equivalent to 2.5rem -> 1.8rem)
    active_name_font = name_font
    if len(safe_name) > 15:
        try:
            active_name_font = ImageFont.truetype(font_path_bold, 72)
        except:
            pass # Fallback
            
    draw.text((70, 310), safe_name, font=active_name_font, fill=(255, 255, 255))
    
    # Green checkmark positioning relative to the name (Pinned to right if too long)
    n_bbox = draw.textbbox((0, 0), safe_name, font=active_name_font)
    n_w = n_bbox[2] - n_bbox[0]
    badge_x = min(70 + n_w + 30, width - 120) # Cap so it doesn't push off-screen
    
    draw.ellipse([badge_x, 325, badge_x + 55, 380], fill=(16, 185, 129)) # Green background
    try:
        check_font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 36)
        draw.text((badge_x + 12, 325), "✓", font=check_font, fill=(255, 255, 255))
    except:
        pass
    
    # Subtitle: BRANCH • Class of YEAR
    # branch_name as provided (e.g. BCA)
    subtitle = f"{branch_name} • Class of {year}"
    draw.text((70, 440), subtitle, font=subtitle_font, fill=(200, 180, 255, 200))

    # Bio
    if bio:
        draw.text((70, 520), f"\"{bio}\"", font=bio_font, fill=(255, 255, 255, 220))

    # Footer Section
    draw.text((70, 660), "SOCIAL PROFILES", font=label_font, fill=(255, 255, 255, 150))
    socials = f"LinkedIn: {linkedin or 'NA'}\nGitHub: {github or 'NA'}"
    draw.text((70, 705), socials, font=verify_font, fill=(255, 255, 255, 200))

    draw.text((450, 660), "SKILLS & EXPERTISE", font=label_font, fill=(255, 255, 255, 150))
    
    if skills:
        skill_list = [s.strip() for s in skills.split(',') if s.strip()][:4]
        px, py = 450, 705
        for skill in skill_list:
            sb = draw.textbbox((0, 0), skill, font=pill_font)
            sw = sb[2] - sb[0] + 70
            draw.rounded_rectangle([px, py, px + sw, py + 80], radius=40, fill=(255, 255, 255))
            # Center text in pill
            tx = px + (sw - (sb[2] - sb[0])) / 2
            ty = py + (80 - (sb[3] - sb[1])) / 2 - 6
            draw.text((tx, ty), skill, font=pill_font, fill=(32, 12, 82))
            px += sw + 10 # Flex gap: 10px equivalent

    # Email Field Refinement (Centered below skills)
    email_text = str(user_email).lower()
    try:
        small_footer_font = ImageFont.truetype(font_path_reg, 22) # 0.8rem equivalent
    except:
        small_footer_font = footer_font
        
    e_bbox = draw.textbbox((0, 0), email_text, font=small_footer_font)
    e_w = e_bbox[2] - e_bbox[0]
    draw.text((int((width - e_w) / 2), 850), email_text, font=small_footer_font, fill=(255, 255, 255, 180)) # 70% opacity

    return image


def send_approval_request(user_email, branch_name, user_id, name, bio, dept, year, skills, linkedin, github):
    """
    Sends a high-fidelity verification request email with attached CID image via Resend.
    """
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing - skipping approval email")
            return False

        # Generate the card
        img = generate_identity_card(user_email, branch_name, user_id, name, bio, dept, year, skills, linkedin, github)
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_data = buffered.getvalue()

        approve_link = f"{BACKEND_URL}/auth/admin/approve/{user_id}"
        reject_link = f"{FRONTEND_URL}/admin/users" # Links to admin panel

        html_body = f"""
        <html>
            <body style="font-family: sans-serif; background-color: #f4f4f7; padding: 40px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a1a;">New User Pending Approval</h2>
                    <p style="color: #51545e; font-size: 16px;">A user has requested access to the BaapCollab platform.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; color: #111827;">
                        <h3 style="margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">User Profile Card</h3>
                        <p style="margin: 8px 0;"><strong>Name:</strong> {name}</p>
                        <p style="margin: 8px 0;"><strong>Email:</strong> {user_email}</p>
                        <p style="margin: 8px 0;"><strong>Institution:</strong> {branch_name}</p>
                        <p style="margin: 8px 0;"><strong>Department:</strong> {dept}</p>
                        <p style="margin: 8px 0;"><strong>Role Applied For:</strong> Student</p>
                    </div>

                    <div style="margin: 30px 0; text-align: center; color: #6b7280;">
                        <p><em>(Auto-generated Identity Card attached below)</em></p>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="{approve_link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-right: 15px; display: inline-block;">Approve User</a>
                        <a href="{reject_link}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reject User</a>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # --- RESEND SENDING ---
        print(f"📡 [EMAIL] Sending approval request via Resend API to {ADMIN_EMAIL}...")
        resend.Emails.send({
            "from": MAIL_FROM,
            "to": ADMIN_EMAIL,
            "subject": f"New user pending approval - {name}",
            "html": html_body,
            "attachments": [
                {"filename": "identity_card.png", "content": list(img_data)}
            ]
        })
        print(f"✅ [EMAIL] Approval Request Sent for {user_email}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send approval email: {e}")
        traceback.print_exc()
        return False

def send_access_granted(user_email):
    """
    Notifies the user that their access has been granted using Resend.
    """
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing - skipping access granted notification")
            return False

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        html = f"""
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>High Five! ✋</h2>
                <p>Your identity has been verified by the admin.</p>
                <p>You can now log in and start collaborating on projects.</p>
                <a href="{frontend_url}" style="background-color: #524EEE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            </div>
        """

        print(f"📡 [EMAIL] Sending access_granted to {user_email} via Resend...")
        resend.Emails.send({
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "You're approved! Welcome to BaapCollab",
            "html": html
        })
            
        print(f"✅ [EMAIL] Access Granted Notification Sent to {user_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send access granted email: {e}")
        return False

def send_welcome_otp(user_email: str, otp: str) -> bool:
    """
    Sends a professional Welcome email with a 6-digit OTP for email verification via Resend.
    """
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing — skipping OTP email")
            return False

        html = f"""<!DOCTYPE html>
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
              <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#524EEE;font-family:monospace;">{otp}</p>
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
</html>"""

        print(f"📡 [EMAIL] Sending welcome_otp to {user_email} via Resend API...")
        resend.Emails.send({
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "Verify your BaapCollab account",
            "html": html
        })

        print(f"✅ Welcome OTP email sent to {user_email}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send welcome OTP email: {e}")
        traceback.print_exc()
        return False

def send_password_reset_email(user_email: str, reset_link: str) -> bool:
    """
    Sends a professional password reset email via Resend API.
    """
    try:
        if not resend.api_key:
            print("⚠️ [EMAIL] RESEND_API_KEY missing — skipping reset email")
            return False

        html = f"""<!DOCTYPE html>
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
            <a href="{reset_link}" style="display:inline-block;background-color:#524EEE;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
            <p style="margin:32px 0 0;font-size:13px;color:#9CA3AF;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
        
        print(f"📡 [EMAIL] Sending password_reset_email to {user_email} via Resend API...")
        resend.Emails.send({
            "from": MAIL_FROM,
            "to": user_email,
            "subject": "Reset your BaapCollab password",
            "html": html
        })

        print(f"✅ Password reset email sent to {user_email}")
        return True
    except Exception as e:
        import traceback
        print(f"❌ Failed to send password reset email: {e}")
        traceback.print_exc()
        return False
