from pathlib import Path
import re

ROOT = Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
MIGRATIONS = ROOT / "backend/src/database/migrations"

simple_index = re.compile(
    r"CREATE INDEX IF NOT EXISTS (?P<idx>[A-Za-z0-9_]+)\s*\n"
    r"\s*ON (?P<table>[A-Za-z0-9_]+)\((?P<col>[A-Za-z0-9_]+)\)"
    r" WHERE deleted_at IS NULL;"
)
gin_index = re.compile(
    r"CREATE INDEX IF NOT EXISTS (?P<idx>[A-Za-z0-9_]+)\s*\n"
    r"\s*ON (?P<table>[A-Za-z0-9_]+) USING gin\((?P<col>[A-Za-z0-9_]+)\)"
    r" WHERE deleted_at IS NULL;"
)
trigger = re.compile(
    r"CREATE TRIGGER (?P<trg>[A-Za-z0-9_]+)\s*\n"
    r"BEFORE UPDATE ON (?P<table>[A-Za-z0-9_]+)\s*\n"
    r"FOR EACH ROW\s*\nEXECUTE FUNCTION (?P<func>[A-Za-z0-9_]+)\(\);"
)

def column_exists_sql(table, col):
    return (
        "EXISTS (SELECT 1 FROM information_schema.columns "
        f"WHERE table_schema='public' AND table_name='{table}' AND column_name='{col}')"
    )

def replace_simple(match):
    idx, table, col = match.group("idx", "table", "col")
    has_col = column_exists_sql(table, col)
    has_deleted = column_exists_sql(table, "deleted_at")
    partial = f"CREATE INDEX IF NOT EXISTS {idx} ON {table}({col}) WHERE deleted_at IS NULL"
    fallback = f"CREATE INDEX IF NOT EXISTS {idx} ON {table}({col})"
    return f"""DO $$
BEGIN
  IF {has_col} AND {has_deleted} THEN
    EXECUTE '{partial}';
  ELSIF {has_col} THEN
    EXECUTE '{fallback}';
  END IF;
END $$;"""

def replace_gin(match):
    idx, table, col = match.group("idx", "table", "col")
    has_col = column_exists_sql(table, col)
    has_deleted = column_exists_sql(table, "deleted_at")
    partial = f"CREATE INDEX IF NOT EXISTS {idx} ON {table} USING gin({col}) WHERE deleted_at IS NULL"
    fallback = f"CREATE INDEX IF NOT EXISTS {idx} ON {table} USING gin({col})"
    return f"""DO $$
BEGIN
  IF {has_col} AND {has_deleted} THEN
    EXECUTE '{partial}';
  ELSIF {has_col} THEN
    EXECUTE '{fallback}';
  END IF;
END $$;"""

def replace_trigger(match):
    trg, table, func = match.group("trg", "table", "func")
    has_updated = column_exists_sql(table, "updated_at")
    create = (
        f"CREATE TRIGGER {trg} BEFORE UPDATE ON {table} "
        f"FOR EACH ROW EXECUTE FUNCTION {func}()"
    )
    return f"""DROP TRIGGER IF EXISTS {trg} ON {table};
DO $$
BEGIN
  IF {has_updated} THEN
    EXECUTE '{create}';
  END IF;
END $$;"""

def numeric_prefix(name):
    match = re.match(r"^(\d+)_", name)
    return int(match.group(1)) if match else None

changed = []
for path in sorted(MIGRATIONS.glob("*.sql")):
    prefix = numeric_prefix(path.name)
    if prefix is None or not (417 <= prefix <= 644):
        continue
    text = path.read_text(encoding="utf-8")
    if "Data storage (flexible for different module needs)" not in text:
        continue
    updated = simple_index.sub(replace_simple, text)
    updated = gin_index.sub(replace_gin, updated)
    updated = trigger.sub(replace_trigger, updated)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append(path.name)

print(f"patched={len(changed)}")
for name in changed:
    print(name)
