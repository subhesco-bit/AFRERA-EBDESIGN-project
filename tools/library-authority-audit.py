"""Read-only, bounded-memory reconciliation of existing EBDESIGN authorities.

Produces audit evidence, never a replacement identity registry. Uses the Python
standard library; CSV fields (including quoted newlines) are parsed as records.
"""
import argparse
import csv
import hashlib
import json
import re
import sqlite3
import tempfile
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

SOURCES = [
    ('physical_identity', '04_AUTHORITY/IDENTITY_REGISTRY/PHYSICAL_ITEM_IDENTITY_REGISTRY.csv',
     'PhysicalItemID', 'CurrentLocation', 'SHA256'),
    ('physical_path', '04_AUTHORITY/IDENTITY_REGISTRY/PHYSICAL_PATH_INDEX.csv',
     'PhysicalItemID', 'CurrentLocation', None),
    ('discovery', '25_DISCOVERY_INDEX/enterprise-project-library-files.csv',
     'library_id', 'relative_path', 'sha256'),
    ('catalogue', '00_CATALOG/MASTER_LIBRARY_CATALOG.csv', 'CardID', 'OriginalPath', None),
    ('module_cards', '00_CATALOG/MODULE_CARD_INDEX.csv', 'CardID', 'OriginalPath', None),
]


def sha256(file):
    digest = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalized_path(value):
    return value.replace('\\', '/').removeprefix('./').casefold()


def audit_source(root, connection, spec, verify_paths=False):
    purpose, relative, id_field, path_field, hash_field = spec
    source = root / '_EBDESIGN_LIBRARY' / relative
    report = {'purpose': purpose, 'source': source.relative_to(root).as_posix(),
              'status': 'missing', 'rows': 0, 'empty_ids': 0, 'empty_paths': 0,
              'valid_hashes': 0, 'invalid_hashes': 0, 'deferred_hashes': 0, 'malformed_rows': 0,
              'physical_paths': {'present': 0, 'missing': 0, 'outside_scope': 0,
                                 'unchecked': 0}}
    if not source.is_file():
        return report
    before = source.stat()
    report.update(bytes=before.st_size, sha256=sha256(source), status='read')
    pending = []
    with source.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream, strict=True)
        headers = reader.fieldnames or []
        report['columns'] = headers
        required = [id_field, path_field] + ([hash_field] if hash_field else [])
        report['missing_columns'] = [field for field in required if field not in headers]
        if report['missing_columns'] or len(set(headers)) != len(headers):
            report['status'] = 'invalid_schema'
            return report
        for row in reader:
            report['rows'] += 1
            if None in row or any(value is None for value in row.values()):
                report['malformed_rows'] += 1
                continue
            identity = row[id_field].strip()
            location = row[path_field].strip()
            digest = row[hash_field].strip().lower() if hash_field else ''
            report['empty_ids'] += not bool(identity)
            report['empty_paths'] += not bool(location)
            valid_hash = bool(re.fullmatch('[a-f0-9]{64}', digest))
            report['valid_hashes'] += valid_hash
            deferred_hash = digest.upper() == 'PENDING_CONTENT_INVENTORY'
            report['deferred_hashes'] += deferred_hash
            report['invalid_hashes'] += bool(digest) and not valid_hash and not deferred_hash
            scope = row.get('source_label', 'EBDESIGN')
            if location and verify_paths:
                candidate = (root / location.replace('\\', '/')).resolve()
                if scope != 'EBDESIGN' or not candidate.is_relative_to(root):
                    status = 'outside_scope'
                else:
                    status = 'present' if candidate.exists() else 'missing'
                report['physical_paths'][status] += 1
            else:
                report['physical_paths']['unchecked'] += 1
            pending.append((purpose, identity, scope, normalized_path(location),
                            digest if valid_hash else ''))
            if len(pending) >= 5000:
                connection.executemany('INSERT INTO evidence VALUES (?, ?, ?, ?, ?)', pending)
                connection.commit()
                pending.clear()
        connection.executemany('INSERT INTO evidence VALUES (?, ?, ?, ?, ?)', pending)
        connection.commit()
    after = source.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        report['status'] = 'changed_during_audit'
    for column, label in [('identity', 'duplicate_id'), ('location', 'duplicate_path')]:
        # Discovery paths are scoped to their source repository, IDs remain global.
        group = f'scope, {column}' if column == 'location' else column
        query = (f'SELECT {column}, COUNT(*) AS n FROM evidence '
                 f'WHERE purpose=? AND {column}<>\'\' GROUP BY {group} HAVING COUNT(*)>1')
        report[label + '_groups'] = connection.execute(
            f'SELECT COUNT(*) FROM ({query})', (purpose,)).fetchone()[0]
        report[label + '_samples'] = connection.execute(
            query + ' ORDER BY n DESC LIMIT 10', (purpose,)).fetchall()
    report['hash_coverage'] = (report['valid_hashes'] / report['rows']) if report['rows'] else 0
    return report


def run(root, verify_paths=False):
    root = root.resolve()
    csv.field_size_limit(16 * 1024 * 1024)
    with tempfile.TemporaryDirectory(prefix='ebdesign-authority-') as temporary:
        with closing(sqlite3.connect(str(Path(temporary) / 'evidence.sqlite'))) as connection:
            connection.execute('PRAGMA cache_size=-8192')
            connection.execute('PRAGMA temp_store=FILE')
            connection.execute('CREATE TABLE evidence (purpose TEXT, identity TEXT, scope TEXT, location TEXT, hash TEXT)')
            reports = []
            for spec in SOURCES:
                try:
                    reports.append(audit_source(root, connection, spec, verify_paths))
                    print(json.dumps({'source': spec[0], 'status': reports[-1]['status'],
                                      'rows': reports[-1].get('rows')}), flush=True)
                except (OSError, csv.Error, UnicodeError) as error:
                    reports.append({'purpose': spec[0], 'status': 'error', 'error': str(error)})
            connection.execute('CREATE INDEX evidence_path ON evidence(purpose, scope, location)')
            overlap = connection.execute('''
                SELECT COUNT(DISTINCT a.location),
                  COUNT(DISTINCT CASE WHEN a.hash<>'' AND b.hash<>'' AND a.hash<>b.hash
                    THEN a.location END)
                FROM evidence a JOIN evidence b ON a.location=b.location AND a.scope=b.scope
                WHERE a.purpose='physical_identity' AND b.purpose='discovery'
                  AND a.scope='EBDESIGN' AND a.location<>''
            ''').fetchone()
    return {
        'workspace': str(root),
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'mode': 'read-only authority reconciliation; no identity reassignment',
        'sources': reports,
        'physical_vs_discovery': {'overlapping_paths': overlap[0], 'different_recorded_hashes': overlap[1]},
        'limitations': [
            'Recorded hashes are compared; source content hashes are not recomputed.',
            'Different hashes may reflect edits or stale snapshots, not redundant implementations.',
            'Physical path checks cover only this workspace and never follow paths outside it.',
            'Card paths can be empty for logical entities; this alone does not invalidate a card.',
            'No canonical authority is selected automatically from size, recency, or coverage.',
            'Archive contents and runtime linkage require separate verification.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--verify-paths', action='store_true')
    args = parser.parse_args()
    report = run(args.root, args.verify_paths)
    # Exclusive creation preserves earlier evidence; use a fresh run filename.
    with args.output.open('x', encoding='utf-8') as output:
        json.dump(report, output, indent=2)
        output.write('\n')
    print(json.dumps({'output': str(args.output), 'sources': [
        {key: item.get(key) for key in ('purpose', 'status', 'rows', 'duplicate_id_groups')}
        for item in report['sources']]}))
    return int(any(item['status'] != 'read' or item.get('malformed_rows') or
                   item.get('duplicate_id_groups') or item.get('empty_ids') or
                   item.get('invalid_hashes') for item in report['sources']))


if __name__ == '__main__':
    raise SystemExit(main())
