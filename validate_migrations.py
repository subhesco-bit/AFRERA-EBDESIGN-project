import glob
import sys
from pglast import parse_sql

bad = []
files = sorted(glob.glob('backend/src/database/migrations/*.sql'))
for f in files:
    try:
        parse_sql(open(f, encoding='utf-8', errors='ignore').read())
    except Exception as e:
        bad.append((f, str(e)[:200]))

print(f"parsed {len(files) - len(bad)}/{len(files)} migrations")
for f, e in bad:
    print(f"  FAIL {f}\n       {e}")

sys.exit(1 if bad else 0)
