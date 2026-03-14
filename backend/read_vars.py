import json
with open('postgres_vars.json') as f:
    data = json.load(f)
    print(f"DATABASE_URL={data.get('DATABASE_URL')}")
    print(f"DATABASE_PUBLIC_URL={data.get('DATABASE_PUBLIC_URL')}")
