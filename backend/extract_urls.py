import json, os

def get_url(filename):
    for enc in ['utf-16', 'utf-8', 'utf-16le', 'utf-16be']:
        try:
            with open(filename, encoding=enc) as f:
                content = f.read()
                if content.strip().startswith('{'):
                    data = json.loads(content)
                    return data.get('DATABASE_URL')
        except: continue
    return "FAILED"

url1 = get_url('pg_vars_1.json')
url2 = get_url('pg_vars_2.json')

with open('full_urls.txt', 'w') as f:
    f.write(f"VARS 1 (Postgres): {url1}\n")
    f.write(f"VARS 2 (Postgres-bUQj): {url2}\n")
