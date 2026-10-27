import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let pool = null;
let db = null;
let isConnected = false;

/**
 * Initialize connection to Supabase PostgreSQL via node-postgres (pg) and Drizzle ORM
 */
export async function connectDatabase() {
  const dbUrl = (env.DATABASE_URL || '').trim();
  if (!dbUrl) {
    logger.warn('DATABASE_URL is not set. Operating without PostgreSQL database persistence.');
    isConnected = false;
    return false;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      max: 10,
    });

    // Test connection with a lightweight query probe
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    db = drizzle(pool, { schema });
    isConnected = true;
    logger.info('Connected to Supabase PostgreSQL database successfully.');
    return true;
  } catch (error) {
    // Sanitize error message to prevent leaking credentials
    const safeMsg = error.message ? error.message.replace(/:[^:@]+@/, ':***@') : 'Connection error';
    logger.error(`Could not connect to PostgreSQL: ${safeMsg}. Database persistence is disabled.`);
    isConnected = false;
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
    return false;
  }
}

/**
 * Check whether database is connected
 */
export function isDbConnected() {
  return isConnected;
}

/**
 * Get active Drizzle database client instance
 */
export function getDb() {
  if (!isConnected || !db) {
    return null;
  }
  return db;
}

/**
 * Get pg connection pool (for health probes / raw migrations)
 */
export function getPool() {
  return pool;
}

/**
 * Disconnect database pool cleanly on shutdown
 */
export async function disconnectDatabase() {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
    db = null;
    isConnected = false;
    logger.info('Disconnected from Supabase PostgreSQL database.');
  }
}
