import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from email_utils import generate_user_card

try:
    # Test case 1: With socials
    card1 = generate_user_card(
        "Ayush Mithabavkar", 
        "Paregaon Village School", 
        "ayush@example.com", 
        "i want to become a frontend developer",
        department="computer science",
        grad_year="2026",
        skills_str="Node, Angular, React",
        linkedin="https://linkedin.com/in/ayush",
        github="https://github.com/ayush"
    )
    with open("identity_card_v3_full.png", "wb") as f:
        f.write(card1)
    
    # Test case 2: No skills (Should remove SKILLS section)
    card2 = generate_user_card(
        "New Student", 
        "Selu Secondary School", 
        "student@example.com", 
        "learning every day",
        department="Information Technology",
        grad_year="2025",
        skills_str="",
        linkedin="",
        github=""
    )
    with open("identity_card_v3_no_skills.png", "wb") as f:
        f.write(card2)
        
    print("✅ Diagnostic: Updated cards generated. Saved to v3_full and v3_na.")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"❌ Diagnostic failed: {e}")
