import os
from dotenv import load_dotenv

def check_env():
    print(f"Current Working Directory: {os.getcwd()}")
    
    # Check root .env
    root_env = os.path.join(os.getcwd(), '.env')
    print(f"Root .env exists: {os.path.exists(root_env)}")
    
    # Check backend .env
    backend_env = os.path.join(os.getcwd(), 'backend', '.env')
    print(f"Backend .env exists: {os.path.exists(backend_env)}")
    
    # Try loading root
    load_dotenv(root_env)
    print(f"GOOGLE_CLIENT_ID after loading root: {os.getenv('GOOGLE_CLIENT_ID')}")
    
    # Try loading backend
    load_dotenv(backend_env)
    print(f"GOOGLE_CLIENT_ID after loading backend: {os.getenv('GOOGLE_CLIENT_ID')}")

if __name__ == "__main__":
    check_env()
