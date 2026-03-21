from email_utils import generate_identity_card
import os

# Dummy data match the user's demo
success = generate_identity_card(
    user_email="sachin@example.com",
    branch_name="BCA",
    user_id=10,
    name="Sachin Tendulkar",
    bio="i want t be a frontend developer",
    dept="Science",
    year=2026,
    skills="Node, Angular, React",
    linkedin="NA",
    github="NA"
)

save_path = "c:/Users/intel/.vscode/coding/vibe/BaapCollab/backend/test_premium_card.png"
success.save(save_path)
print(f"✅ Premium Card Generated and saved to {save_path}")
