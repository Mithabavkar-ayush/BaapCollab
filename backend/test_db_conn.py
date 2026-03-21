import psycopg2
urls = [
    "postgresql://postgres:abJBEObFGcOjTmwQEqNskHiznUCDPfac@junction.proxy.rlwy.net:36204/railway",
    "postgresql://postgres:VjJQUDQJnSfghEWnzvCOeOaEpxVvGzPl@junction.proxy.rlwy.net:49011/railway"
]

for url in urls:
    print(f"Testing {url[:20]}...")
    try:
        conn = psycopg2.connect(url)
        print("SUCCESS!")
        conn.close()
    except Exception as e:
        print(f"FAILED: {e}")
