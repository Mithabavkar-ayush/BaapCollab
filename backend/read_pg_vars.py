import json, os

def read_pg_vars(filename):
    print(f"Reading {filename}...")
    try:
        # Try different encodings
        for enc in ['utf-16', 'utf-8', 'utf-16le', 'utf-16be']:
            try:
                with open(filename, encoding=enc) as f:
                    content = f.read()
                    if content.startswith('{'):
                         data = json.loads(content)
                         print(f"SUCCESS {filename}: {data.get('DATABASE_URL')}")
                         return data
            except:
                continue
        print(f"Failed to read {filename}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")
    return None

read_pg_vars('pg_vars_1.json')
read_pg_vars('pg_vars_2.json')
