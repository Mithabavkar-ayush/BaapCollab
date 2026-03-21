import os
import subprocess
import time
import sys

# Configuration - adjust these paths if they differ on your system
PG_CTL = r"C:\Users\intel\.vscode\coding\vibe\antigravity\pgsql_portable\pgsql\bin\pg_ctl.exe"
PG_DUMP = r"C:\Users\intel\.vscode\coding\vibe\antigravity\pgsql_portable\pgsql\pgAdmin 4\runtime\pg_dump.exe"
PG_DATA = r"C:\Users\intel\.vscode\coding\vibe\antigravity\pgsql_portable\data"
BACKUP_FILE = "baapcollab_production_backup.sql"
DATABASE_NAME = "baap_collab" # Updated to the correct local DB name
USER_NAME = "postgres"

def run_cmd(cmd, check=True):
    print(f"Executing: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return None

def main():
    print("--- Starting Local PostgreSQL Data Export ---")
    
    # 1. Start the database
    print(f"Starting database from {PG_DATA}...")
    run_cmd(f'"{PG_CTL}" -D "{PG_DATA}" start', check=False) # Might already be running
    time.sleep(3) # Wait for it to initialize
    
    # 2. Perform the dump
    print(f"Generating backup to {BACKUP_FILE}...")
    # Using -F p for a plain SQL file
    dump_cmd = f'"{PG_DUMP}" -h localhost -p 5432 -U {USER_NAME} -F p -b -v -f "{BACKUP_FILE}" {DATABASE_NAME}'
    # Note: Since it's 'trust' auth, we don't need PGPASSWORD
    run_cmd(dump_cmd)
    
    if os.path.exists(BACKUP_FILE):
        file_size = os.path.getsize(BACKUP_FILE)
        print(f"SUCCESS: {BACKUP_FILE} created ({file_size} bytes)")
    else:
        print("FAILED: Backup file was not created.")
        
    # 3. Stop the database
    print("Stopping database...")
    run_cmd(f'"{PG_CTL}" -D "{PG_DATA}" stop')
    
    print("\nMission Complete: Your data is now safe in backup_data.sql")

if __name__ == "__main__":
    main()
