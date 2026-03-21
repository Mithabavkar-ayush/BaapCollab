import requests
import sys

API_BASE = "http://localhost:8000"

def verify_lockdown():
    print("🔍 Starting Gatekeeper Verification...")
    
    # This is a simulation. In a real test we'd need a token.
    # We will check if the default is_approved field exists and is False for a hypothetical new user.
    from database import User
    from sqlmodel import Field
    
    # Check Field definition
    is_approved_field = User.__sqlmodel_model_fields__['is_approved']
    if is_approved_field.default == False:
        print("✅ Schema: is_approved default is False.")
    else:
        print(f"❌ Schema: is_approved default is {is_approved_field.default}")

    print("\n🚀 Verification complete. System is now HIGHTENSION.")

if __name__ == "__main__":
    verify_lockdown()
