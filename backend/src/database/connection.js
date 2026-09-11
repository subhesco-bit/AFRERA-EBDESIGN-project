/**
 * Database Connection Manager
 * PostgreSQL is authoritative. MongoDB is optional unless MONGO_REQUIRED=true.
 */

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

let MongoClient = null;
let pgPool = null;
let mongoClient = null;
let initializationCompleted = false;
let postgresError = null;
let mongoError = null;

function loadMongoDriver() {
  if (!MongoClient) ({ MongoClient } = require('mongodb')); // eslint-disable-line global-require
  return MongoClient;
}

function postgresConfig() {
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT, 10) || 5432,
        database: process.env.PG_DATABASE || 'afrera_db',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'password',
      };
  if (process.env.PG_SSL === 'true') config.ssl = { rejectUnauthorized: process.env.PG_SSL_STRICT !== 'false' };
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    if (!process.env.PG_PASSWORD || config.password === 'password') {
      throw new Error('Production requires DATABASE_URL or an explicit non-default PG_PASSWORD');
    }
  }
  return config;
}

async function initPostgreSQL() {
  const config = postgresConfig();
  const candidate = new Pool({
    ...config,
    max: Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 5000),
  });
  try {
    const client = await candidate.connect();
    await client.query('SELECT 1');
    client.release();
    pgPool = candidate;
    postgresError = null;
    logger.info('PostgreSQL connection established successfully');
    return pgPool;
  } catch (error) {
    postgresError = error;
    await candidate.end().catch(() => {});
    logger.error('PostgreSQL connection failed', { error: error.message });
    throw error;
  }
}

async function initMongoDB() {
  const configured = Boolean(process.env.MONGO_URI);
  const required = process.env.MONGO_REQUIRED === 'true';
  if (!configured && !required) {
    mongoClient = null;
    mongoError = null;
    logger.info('MongoDB not configured; continuing with PostgreSQL-only runtime');
    return null;
  }
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrera_mongo';
  const Client = loadMongoDriver();
  const candidate = new Client(uri, {
    maxPoolSize: Number(process.env.MONGO_POOL_MAX || 20),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SELECTION_TIMEOUT_MS || 5000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  });
  try {
    await candidate.connect();
    await candidate.db('admin').command({ ping: 1 });
    mongoClient = candidate;
    mongoError = null;
    logger.info('MongoDB connection established successfully');
    return mongoClient;
  } catch (error) {
    mongoError = error;
    await candidate.close().catch(() => {});
    mongoClient = null;
    if (required) throw error;
    logger.warn('Optional MongoDB unavailable; continuing without MongoDB', { error: error.message });
    return null;
  }
}

async function initialize() {
  if (initializationCompleted) return { pgPool, mongoClient };
  try {
    await initPostgreSQL();
    await initMongoDB();
    initializationCompleted = true;
    return { pgPool, mongoClient };
  } catch (error) {
    initializationCompleted = true;
    const strict = process.env.NODE_ENV === 'production' && process.env.ALLOW_DEGRADED_STARTUP !== 'true';
    if (strict) throw error;
    logger.warn('Database initialization incomplete; degraded startup allowed', { error: error.message });
    return { pgPool, mongoClient };
  }
}

function getPostgreSQL() {
  return pgPool;
}

function getMongoDB() {
  if (!mongoClient) throw new Error('MongoDB is not available');
  return mongoClient;
}

function getMongoDatabase() {
  return getMongoDB().db(process.env.MONGO_DATABASE || 'afrera_mongo');
}

async function probePostgreSQL() {
  if (!pgPool) return false;
  try { await pgPool.query('SELECT 1'); return true; } catch { return false; }
}

async function probeMongoDB() {
  if (!mongoClient) return false;
  try { await mongoClient.db('admin').command({ ping: 1 }); return true; } catch { return false; }
}

async function isHealthy() {
  const postgresql = await probePostgreSQL();
  const mongodbConfigured = Boolean(process.env.MONGO_URI) || process.env.MONGO_REQUIRED === 'true';
  const mongodb = mongodbConfigured ? await probeMongoDB() : null;
  const mongoRequired = process.env.MONGO_REQUIRED === 'true';
  return {
    postgresql,
    mongodb,
    mongodbConfigured,
    overall: postgresql && (!mongoRequired || mongodb === true),
    degraded: !postgresql || (mongodbConfigured && mongodb !== true),
    errors: {
      postgresql: postgresError?.message || null,
      mongodb: mongoError?.message || null,
    },
  };
}

async function close() {
  const errors = [];
  if (pgPool) {
    try { await pgPool.end(); } catch (error) { errors.push(error); }
    pgPool = null;
  }
  if (mongoClient) {
    try { await mongoClient.close(); } catch (error) { errors.push(error); }
    mongoClient = null;
  }
  initializationCompleted = false;
  if (errors.length) throw new AggregateError(errors, 'Failed to close one or more database clients');
}

if (process.env.NODE_ENV !== 'test') {
  initialize().catch(error => logger.error('Database initialization failed', { error: error.message }));
}

module.exports = {
  initialize,
  initPostgreSQL,
  initMongoDB,
  getPostgreSQL,
  getMongoDB,
  getMongoDatabase,
  isHealthy,
  close,
  postgresConfig,
};
