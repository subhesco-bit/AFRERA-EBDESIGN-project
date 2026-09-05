/**
 * Credential-free migration preflight.
 * Reads migration SQL and local migration runners; never connects to or writes to a database.
 */

const fs = require('fs');
const path = require('path');

const databaseDir = __dirname;
const migrationsDir = path.join(databaseDir, 'migrations');

function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '');
}

function splitTopLevel(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === quote && value[index - 1] !== '\\') quote = null;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function normalizeIdentifier(identifier) {
  return identifier.replace(/^["`]|["`]$/g, '').toLowerCase();
}

function normalizeType(type) {
  const normalized = type.toLowerCase().replace(/\s+/g, ' ').trim();
  if (/^(uuid)\b/.test(normalized)) return 'uuid';
  if (/^(smallint|integer|int|int4|serial|serial4)\b/.test(normalized)) return 'integer';
  if (/^(bigint|bigserial|int8)\b/.test(normalized)) return 'bigint';
  return normalized.split(' ')[0];
}

function parseTables(filename, sql) {
  const tables = [];
  const cleanSql = stripComments(sql);
  const tablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."`]+)\s*\(([\s\S]*?)\)\s*;/gi;
  let match;
  while ((match = tablePattern.exec(cleanSql))) {
    const tableName = normalizeIdentifier(match[1].split('.').pop());
    const columns = new Map();
    const foreignKeys = [];
    const definitions = splitTopLevel(match[2]);
    for (const definition of definitions) {
      const columnMatch = definition.match(/^([\w"`]+)\s+((?:uuid|serial|serial4|integer|int|int4|bigint|bigserial|int8|smallint|text|boolean|date|timestamp(?:\s+with(?:out)?\s+time\s+zone)?|varchar(?:\s*\([^)]*\))?|char(?:acter)?(?:\s*\([^)]*\))?|numeric(?:\s*\([^)]*\))?|decimal(?:\s*\([^)]*\))?))\b/i);
      if (columnMatch && !/^(constraint|primary|unique|check|foreign)\b/i.test(columnMatch[1])) {
        const columnName = normalizeIdentifier(columnMatch[1]);
        columns.set(columnName, normalizeType(columnMatch[2]));
        const inlineReference = definition.match(/REFERENCES\s+([\w."`]+)\s*\(\s*([\w"`]+)\s*\)/i);
        if (inlineReference) foreignKeys.push({
          column: columnName,
          targetTable: normalizeIdentifier(inlineReference[1].split('.').pop()),
          targetColumn: normalizeIdentifier(inlineReference[2])
        });
      }
      const constraintReference = definition.match(/FOREIGN\s+KEY\s*\(\s*([\w"`]+)\s*\)\s*REFERENCES\s+([\w."`]+)\s*\(\s*([\w"`]+)\s*\)/i);
      if (constraintReference) foreignKeys.push({
        column: normalizeIdentifier(constraintReference[1]),
        targetTable: normalizeIdentifier(constraintReference[2].split('.').pop()),
        targetColumn: normalizeIdentifier(constraintReference[3])
      });
    }
    tables.push({ filename, tableName, columns, foreignKeys });
  }
  return tables;
}

function findDuplicatePrefixes(files) {
  const prefixes = new Map();
  for (const filename of files) {
    const prefix = filename.match(/^([^_]+)_/)?.[1] || '[no-prefix]';
    if (!prefixes.has(prefix)) prefixes.set(prefix, []);
    prefixes.get(prefix).push(filename);
  }
  return [...prefixes.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([prefix, names]) => ({ prefix, files: names }));
}

function findDuplicateOwnership(tables) {
  const owners = new Map();
  for (const table of tables) {
    if (!owners.has(table.tableName)) owners.set(table.tableName, []);
    owners.get(table.tableName).push(table.filename);
  }
  return [...owners.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([table, files]) => ({ table, files }));
}

function findForeignKeyMismatches(tables) {
  let definitions = new Map();
  for (const table of tables) {
    if (!definitions.has(table.tableName)) definitions.set(table.tableName, new Map());
    for (const [column, type] of table.columns) {
      if (!definitions.get(table.tableName).has(column)) definitions.get(table.tableName).set(column, []);
      definitions.get(table.tableName).get(column).push({ type, filename: table.filename });
    }
  }
  const mismatches = [];
  for (const table of tables) {
    for (const foreignKey of table.foreignKeys) {
      const localType = table.columns.get(foreignKey.column);
      const targets = definitions.get(foreignKey.targetTable)?.get(foreignKey.targetColumn) || [];
      const targetTypes = [...new Set(targets.map(target => target.type))];
      const uuidIntegerMismatch = targetTypes.length > 0 &&
        targetTypes.every(targetType => (localType === 'uuid' && targetType === 'integer') ||
          (localType === 'integer' && targetType === 'uuid'));
      if (uuidIntegerMismatch) {
        mismatches.push({
          filename: table.filename,
          table: table.tableName,
          column: foreignKey.column,
          localType,
          target: `${foreignKey.targetTable}.${foreignKey.targetColumn}`,
          targetTypes
        });
      }
    }
  }
  return mismatches;
}

function findAmbiguousForeignKeyTypes(tables) {
  let definitions = new Map();
  for (const table of tables) {
    if (!definitions.has(table.tableName)) definitions.set(table.tableName, new Map());
    for (const [column, type] of table.columns) {
      if (!definitions.get(table.tableName).has(column)) definitions.get(table.tableName).set(column, new Set());
      definitions.get(table.tableName).get(column).add(type);
    }
  }
  const ambiguous = [];
  for (const table of tables) {
    for (const foreignKey of table.foreignKeys) {
      let localType = table.columns.get(foreignKey.column);
      let targetTypes = [...(definitions.get(foreignKey.targetTable)?.get(foreignKey.targetColumn) || [])];
      if (targetTypes.length > 1 && targetTypes.includes(localType)) {
        ambiguous.push({
          filename: table.filename,
          table: table.tableName,
          column: foreignKey.column,
          localType,
          target: `${foreignKey.targetTable}.${foreignKey.targetColumn}`,
          targetTypes
        });
      }
    }
  }
  return ambiguous;
}

function inspectSchemaMigrationDefinitions() {
  const files = ['migrate.js', path.join('migrations', 'enhanced_migrate.js')];
  let definitions = files.map(relativePath => {
    const filename = path.join(databaseDir, relativePath);
    const content = fs.readFileSync(filename, 'utf8');
    const start = content.search(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+schema_migrations\s*\(/i);
    let columns = [];
    if (start >= 0) {
      const opening = content.indexOf('(', start);
      let depth = 0;
      let closing = -1;
      for (let index = opening; index < content.length; index += 1) {
        if (content[index] === '(') depth += 1;
        if (content[index] === ')') depth -= 1;
        if (depth === 0) { closing = index; break; }
      }
      if (closing > opening) columns = splitTopLevel(content.slice(opening + 1, closing)).map(column => column.split(/\s+/)[0].toLowerCase());
    }
    return { file: relativePath.replace(/\\/g, '/'), columns };
  });
  return {
    canonical: 'schema_migrations.js',
    legacy: definitions.filter(definition => definition.columns.length > 0),
    blocking: []
  };
}

function run() {
  let files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();
  let tables = files.flatMap(file => parseTables(file, fs.readFileSync(path.join(migrationsDir, file), 'utf8')));
  const report = {
    migrationCount: files.length,
    tableDefinitions: tables.length,
    duplicatePrefixes: findDuplicatePrefixes(files),
    duplicateTableOwnership: findDuplicateOwnership(tables),
    foreignKeyMismatches: findForeignKeyMismatches(tables),
    ambiguousForeignKeyTypes: findAmbiguousForeignKeyTypes(tables),
    schemaMigrations: inspectSchemaMigrationDefinitions()
  };
  report.blockers = report.foreignKeyMismatches.length + report.schemaMigrations.blocking.length;
  report.findings = report.duplicatePrefixes.length + report.duplicateTableOwnership.length +
    report.foreignKeyMismatches.length + report.ambiguousForeignKeyTypes.length +
    report.schemaMigrations.legacy.length;
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Migration preflight: ${report.migrationCount} SQL migrations, ${report.tableDefinitions} table definitions`);
    console.log(`Duplicate migration prefixes: ${report.duplicatePrefixes.length}`);
    console.log(`Duplicate table ownership: ${report.duplicateTableOwnership.length}`);
    console.log(`Duplicate migration prefixes (warning): ${report.duplicatePrefixes.length}`);
    console.log(`Duplicate table ownership (legacy no-op warning): ${report.duplicateTableOwnership.length}`);
    console.log(`Blocking UUID/INTEGER FK mismatches: ${report.foreignKeyMismatches.length}`);
    console.log(`Ambiguous mixed-type FK targets (warning): ${report.ambiguousForeignKeyTypes.length}`);
    console.log(`Legacy schema_migrations definitions (compatibility): ${report.schemaMigrations.legacy.length}`);
    console.log(`Blocking findings: ${report.blockers}`);
    for (const item of report.duplicatePrefixes) console.log(`WARN PREFIX ${item.prefix}: deterministic lexical order: ${item.files.join(', ')}`);
    for (const item of report.duplicateTableOwnership) console.log(`WARN TABLE ${item.table}: first lexical definition wins; ${item.files.join(', ')}`);
    for (const item of report.foreignKeyMismatches) console.log(`ERROR FK ${item.filename}: ${item.table}.${item.column} (${item.localType}) -> ${item.target} (${item.targetTypes.join('|')})`);
    for (const item of report.ambiguousForeignKeyTypes) console.log(`WARN FK AMBIGUOUS ${item.filename}: ${item.table}.${item.column} (${item.localType}) -> ${item.target} (${item.targetTypes.join('|')})`);
    for (const item of report.schemaMigrations.legacy) console.log(`WARN SCHEMA_MIGRATIONS LEGACY ${item.file}: ${item.columns.join(', ')}`);
  }
  process.exitCode = report.blockers ? 1 : 0;
}

run();