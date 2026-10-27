import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required to run migrations.');
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Connected to Supabase PostgreSQL. Checking migrations...');
    
    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);

    // Ensure saved_trips table exists (idempotent DDL)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "saved_trips" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "origin" varchar(10) NOT NULL,
        "destination" varchar(10) NOT NULL,
        "cabin" varchar(32) DEFAULT 'economy' NOT NULL,
        "departure_date" varchar(32),
        "return_date" varchar(32),
        "carrier" varchar(128),
        "cash_price" numeric(10, 2),
        "points_cost" integer,
        "taxes" numeric(10, 2),
        "program" varchar(128),
        "estimated_savings" numeric(10, 2),
        "data_source" varchar(32) DEFAULT 'benchmark',
        "notes" text,
        "metadata" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log('[MIGRATE] Successfully applied schema migration for table: saved_trips');
    return true;
  } finally {
    client.release();
    await pool.end();
  }
}

// If executed directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[MIGRATE] Migration process complete.');
      process.exit(0);
    })
    .catch((err) => {
      const safeErr = err.message ? err.message.replace(/:[^:@]+@/, ':***@') : 'Migration failed';
      console.error('[MIGRATE] Error running migrations:', safeErr);
      process.exit(1);
    });
}
