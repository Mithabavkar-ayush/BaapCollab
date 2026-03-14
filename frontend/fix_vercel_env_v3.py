import subprocess

def set_vercel_env(name, value):
    print(f"Setting {name}...")
    # Add new
    subprocess.run(f'npx vercel env rm {name} production --yes', shell=True, capture_output=True)
    
    process = subprocess.Popen(f'npx vercel env add {name} production', shell=True, stdin=subprocess.PIPE, text=True)
    process.communicate(input=value)
    print(f"Done setting {name}")

client_id = "735745260532-2c2nmc7s92j25o0fl0p5a1itoauv30u0.apps.googleusercontent.com"
api_url = "https://baapcollab-backend-production.up.railway.app"

set_vercel_env("NEXT_PUBLIC_GOOGLE_CLIENT_ID", client_id)
set_vercel_env("NEXT_PUBLIC_API_URL", api_url)
