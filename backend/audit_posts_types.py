import requests

url = "https://baapcollab-backend-production.up.railway.app/posts"
try:
    r = requests.get(url, timeout=10)
    if r.ok:
        posts = r.json()
        print(f"Total posts: {len(posts)}")
        for p in posts:
            print(f"[{p.get('type')}] {p.get('title')}")
    else:
        print(f"Error: {r.status_code}")
except Exception as e:
    print(f"Exception: {e}")
