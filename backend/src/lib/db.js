'use strict';
// Unified database schema definition
const dbSchema = {
  tables: {
    users: {
      id: 'text PRIMARY KEY',
      email: 'text UNIQUE NOT NULL',
      passwordHash: 'text NOT NULL',
      name: 'text',
      status: "text DEFAULT 'active'",
      createdAt: 'timestamp DEFAULT NOW()',
      updatedAt: 'timestamp DEFAULT NOW()'
    },
    sessions: {
      id: 'text PRIMARY KEY',
      userId: 'text NOT NULL REFERENCES users(id)',
      token: 'text UNIQUE NOT NULL',
      expiresAt: 'timestamp NOT NULL',
      createdAt: 'timestamp DEFAULT NOW()'
    },
    features: {
      id: 'text PRIMARY KEY',
      name: 'text UNIQUE NOT NULL',
      status: "text DEFAULT 'DISABLED'",
      label: 'text',
      config: 'jsonb',
      createdAt: 'timestamp DEFAULT NOW()',
      updatedAt: 'timestamp DEFAULT NOW()'
    },
    modules: {
      id: 'text PRIMARY KEY',
      name: 'text NOT NULL',
      version: 'text NOT NULL',
      category: 'text',
      status: "text DEFAULT 'WIRED'",
      manifest: 'jsonb',
      createdAt: 'timestamp DEFAULT NOW()',
      updatedAt: 'timestamp DEFAULT NOW()'
    },
    workflows: {
      id: 'text PRIMARY KEY',
      name: 'text NOT NULL',
      definition: 'jsonb NOT NULL',
      status: "text DEFAULT 'active'",
      createdAt: 'timestamp DEFAULT NOW()',
      updatedAt: 'timestamp DEFAULT NOW()'
    },
    workflowInstances: {
      id: 'text PRIMARY KEY',
      workflowId: 'text NOT NULL REFERENCES workflows(id)',
      context: 'jsonb',
      status: "text DEFAULT 'running'",
      createdAt: 'timestamp DEFAULT NOW()',
      completedAt: 'timestamp'
    }
  },

  migrations: [
    { version: 1, name: 'create_users_table', up: `CREATE TABLE IF NOT EXISTS users (...)` },
    { version: 2, name: 'create_sessions_table', up: `CREATE TABLE IF NOT EXISTS sessions (...)` },
    { version: 3, name: 'create_features_table', up: `CREATE TABLE IF NOT EXISTS features (...)` },
    { version: 4, name: 'create_modules_table', up: `CREATE TABLE IF NOT EXISTS modules (...)` },
    { version: 5, name: 'create_workflows_table', up: `CREATE TABLE IF NOT EXISTS workflows (...)` },
    { version: 6, name: 'create_workflow_instances_table', up: `CREATE TABLE IF NOT EXISTS workflowInstances (...)` }
  ],

  indices: [
    { table: 'users', columns: ['email'], unique: true },
    { table: 'sessions', columns: ['userId'], unique: false },
    { table: 'sessions', columns: ['expiresAt'], unique: false },
    { table: 'modules', columns: ['status'], unique: false },
    { table: 'workflows', columns: ['status'], unique: false },
    { table: 'workflowInstances', columns: ['workflowId'], unique: false },
    { table: 'workflowInstances', columns: ['status'], unique: false }
  ]
};

// Schema validation function
function validateSchema(schema) {
  if (!schema.tables) throw new Error('Missing tables definition');
  if (!schema.migrations) throw new Error('Missing migrations definition');
  return true;
}

// Get schema DDL for a table
function getTableDDL(tableName, definition) {
  const cols = Object.entries(definition).map(([name, type]) => `${name} ${type}`).join(',\n  ');
  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${cols}\n);`;
}

module.exports = { dbSchema, validateSchema, getTableDDL };
