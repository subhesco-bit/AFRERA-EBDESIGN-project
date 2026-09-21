import csv
import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('library_authority_audit',
    Path(__file__).with_name('library-authority-audit.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
audit_source = module.audit_source


class AuthorityAuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        (self.root / '_EBDESIGN_LIBRARY').mkdir()
        self.source = self.root / '_EBDESIGN_LIBRARY' / 'test.csv'
        self.connection = sqlite3.connect(':memory:')
        self.addCleanup(self.connection.close)
        self.connection.execute('CREATE TABLE evidence (purpose, identity, scope, location, hash)')
        self.spec = ('fixture', 'test.csv', 'id', 'path', 'hash')

    def write(self, rows):
        with self.source.open('w', encoding='utf-8-sig', newline='') as output:
            writer = csv.writer(output)
            writer.writerow(['id', 'path', 'hash', 'source_label', 'note'])
            writer.writerows(rows)

    def test_multiline_csv_and_hash_coverage(self):
        self.write([['one', 'file.js', 'a' * 64, 'EBDESIGN', 'quoted,"value"\nsecond line'],
                    ['two', '', 'invalid', 'EBDESIGN', '']])
        report = audit_source(self.root, self.connection, self.spec)
        self.assertEqual(report['rows'], 2)
        self.assertEqual(report['valid_hashes'], 1)
        self.assertEqual(report['invalid_hashes'], 1)
        self.assertEqual(report['hash_coverage'], .5)
        self.assertEqual(report['empty_paths'], 1)
        self.assertEqual(report['malformed_rows'], 0)

    def test_duplicates_scoped_by_repository_but_ids_global(self):
        self.write([['same-id', 'File.js', '', 'EBDESIGN', ''],
                    ['same-id', 'file.js', '', 'EBDESIGN', ''],
                    ['third-id', 'file.js', '', 'backup', '']])
        report = audit_source(self.root, self.connection, self.spec)
        self.assertEqual(report['duplicate_id_groups'], 1)
        self.assertEqual(report['duplicate_path_samples'], [('file.js', 2)])

    def test_workspace_path_verification_and_source_immutability(self):
        (self.root / 'present.js').touch()
        self.write([['one', 'present.js', '', 'EBDESIGN', ''],
                    ['two', 'missing.js', '', 'EBDESIGN', ''],
                    ['three', '../outside.js', '', 'EBDESIGN', ''],
                    ['four', 'present.js', '', 'backup', '']])
        before = self.source.read_bytes()
        report = audit_source(self.root, self.connection, self.spec, True)
        self.assertEqual(report['physical_paths'],
                         {'present': 1, 'missing': 1, 'outside_scope': 2, 'unchecked': 0})
        self.assertEqual(self.source.read_bytes(), before)

    def test_missing_and_invalid_schema_are_explicit(self):
        self.assertEqual(audit_source(self.root, self.connection, self.spec)['status'], 'missing')
        self.source.write_text('wrong,columns\n1,2\n')
        self.assertEqual(audit_source(self.root, self.connection, self.spec)['status'], 'invalid_schema')

    def test_malformed_rows_not_counted_as_valid_records(self):
        self.source.write_text('id,path,hash\none,path\ntwo,path,,extra\n')
        report = audit_source(self.root, self.connection, self.spec)
        self.assertEqual(report['malformed_rows'], 2)
        self.assertEqual(self.connection.execute('SELECT COUNT(*) FROM evidence').fetchone()[0], 0)

    def test_full_run_closes_database_before_temporary_directory_cleanup(self):
        report = module.run(self.root)
        self.assertEqual(len(report['sources']), 5)
        self.assertTrue(all(item['status'] == 'missing' for item in report['sources']))

    def test_explicit_pending_hash_marker_is_not_corruption(self):
        self.write([['one', 'file.js', 'PENDING_CONTENT_INVENTORY', 'EBDESIGN', '']])
        report = audit_source(self.root, self.connection, self.spec)
        self.assertEqual(report['deferred_hashes'], 1)
        self.assertEqual(report['invalid_hashes'], 0)
        self.assertEqual(report['valid_hashes'], 0)


if __name__ == '__main__':
    unittest.main()
