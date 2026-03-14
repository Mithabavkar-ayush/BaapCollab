import os
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
print(f"PORT: {os.getenv('PORT', 'NOT SET')}")
