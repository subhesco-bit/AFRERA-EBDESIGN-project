const SCHEMA_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    checksum VARCHAR(64) NOT NULL DEFAULT '',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    rollback_filename VARCHAR(255),
    dependencies TEXT[],
    description TEXT
  )
`;

const SCHEMA_MIGRATIONS_COMPATIBILITY_COLUMNS = [
  "ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS version VARCHAR(50) NOT NULL DEFAULT '1.0.0'",
  "ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum VARCHAR(64) NOT NULL DEFAULT ''",
  'ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER',
  'ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE',
  'ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS rollback_filename VARCHAR(255)',
  'ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS dependencies TEXT[]',
  'ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS description TEXT'
];

async function ensureSchemaMigrations(client) {
  await client.query(SCHEMA_MIGRATIONS_TABLE);
  for (const statement of SCHEMA_MIGRATIONS_COMPATIBILITY_COLUMNS) {
    await client.query(statement);
  }
}

module.exports = {
  SCHEMA_MIGRATIONS_TABLE,
  SCHEMA_MIGRATIONS_COMPATIBILITY_COLUMNS,
  ensureSchemaMigrations
};
