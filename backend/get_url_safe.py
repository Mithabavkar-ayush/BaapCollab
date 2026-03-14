import subprocess, json

def get_db_url():
    print("Fetching variables...")
    result = subprocess.run(['railway', 'variables', '--service', 'Postgres-bUQj', '--json'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    try:
        vars = json.loads(result.stdout)
        return vars.get('DATABASE_URL')
    except Exception as e:
        print(f"JSON Error: {e}")
        return None

url = get_db_url()
if url:
    print(f"URL: {url}")
else:
    print("Failed to get URL")
