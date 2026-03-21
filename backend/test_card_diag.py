import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from email_utils import generate_user_card

try:
    card = generate_user_card(
        "Ayush Mithabavkar", 
        "The Baap Company - BCA Program", 
        "ayush@example.com", 
        "Full-stack developer building the next generation of social networking for students."
    )
    with open("test_card.png", "wb") as f:
        f.write(card)
    print("✅ Diagnostic: card generation successful. Saved to test_card.png")
except Exception as e:
    print(f"❌ Diagnostic failed: {e}")
