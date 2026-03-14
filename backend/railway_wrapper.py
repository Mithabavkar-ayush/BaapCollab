import subprocess, sys

with open('railway_login.log', 'w', buffering=1) as f:
    p = subprocess.Popen('railway login --browserless', shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in iter(p.stdout.readline, ''):
        f.write(line)
        f.flush()
