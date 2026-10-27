import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

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
    console.log('[MIGRATE] Connected to Supabase PostgreSQL. Applying Phase 10 migrations...');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(128),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 2. Saved Trips Table (with user_id ownership column)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "saved_trips" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64),
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

    // Add user_id column if it doesn't already exist on saved_trips
    await client.query(`
      ALTER TABLE "saved_trips" 
      ADD COLUMN IF NOT EXISTS "user_id" varchar(64);
    `);

    // 3. Loyalty Balances / Points Wallet Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "loyalty_balances" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64) NOT NULL,
        "program" varchar(128) NOT NULL,
        "program_type" varchar(32) DEFAULT 'airline',
        "balance" integer DEFAULT 0 NOT NULL,
        "currency_name" varchar(64) DEFAULT 'points',
        "source" varchar(32) DEFAULT 'manual_entry',
        "notes" text,
        "last_updated" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 4. Points Forecasts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "points_forecasts" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64) NOT NULL,
        "monthly_spend" numeric(10, 2) NOT NULL,
        "reward_program" varchar(128) NOT NULL,
        "earning_rate" numeric(5, 2) DEFAULT '1.5',
        "target_destination" varchar(10),
        "target_points" integer,
        "travel_date" varchar(32),
        "assumptions" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 5. External Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "external_bookings" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64) NOT NULL,
        "booking_reference" varchar(32) NOT NULL,
        "airline" varchar(128) NOT NULL,
        "flight_number" varchar(32),
        "origin" varchar(10) NOT NULL,
        "destination" varchar(10) NOT NULL,
        "departure_date" varchar(32) NOT NULL,
        "return_date" varchar(32),
        "cabin" varchar(32) DEFAULT 'economy',
        "points_redeemed" integer DEFAULT 0,
        "taxes_paid" numeric(10, 2) DEFAULT '0',
        "cash_saved_estimate" numeric(10, 2) DEFAULT '0',
        "status" varchar(32) DEFAULT 'confirmed',
        "is_verified_confirmation" boolean DEFAULT false,
        "record_source" varchar(64) DEFAULT 'user_entered_external',
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Add booking columns if not already present
    await client.query(`
      ALTER TABLE "external_bookings"
      ADD COLUMN IF NOT EXISTS "provider_order_id" varchar(128),
      ADD COLUMN IF NOT EXISTS "total_amount" numeric(10, 2),
      ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'EUR',
      ADD COLUMN IF NOT EXISTS "passenger_name" varchar(128);
    `);

    // 6. User Cards & Rewards Table (Spain Rewards Card Wallet)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_cards" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64) NOT NULL,
        "card_product_id" varchar(64) NOT NULL,
        "card_name" varchar(128) NOT NULL,
        "issuer" varchar(64) NOT NULL,
        "rewards_program" varchar(128) NOT NULL,
        "currency" varchar(64) DEFAULT 'points' NOT NULL,
        "nickname" varchar(64),
        "estimated_monthly_spend" numeric(10, 2) DEFAULT '0',
        "demo_balance" integer DEFAULT 0 NOT NULL,
        "is_demo" boolean DEFAULT true NOT NULL,
        "demo_balance_label" varchar(128) DEFAULT 'DEMO BALANCE — Not connected to your bank',
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_cards_user_product_unique" UNIQUE ("user_id", "card_product_id")
      );
    `);

    // 7. Fare Snapshots Table (Best Time to Book & Price Tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "fare_snapshots" (
        "id" varchar(64) PRIMARY KEY NOT NULL,
        "user_id" varchar(64),
        "origin" varchar(10) NOT NULL,
        "destination" varchar(10) NOT NULL,
        "departure_date" varchar(32) NOT NULL,
        "return_date" varchar(32),
        "cabin" varchar(32) DEFAULT 'economy',
        "carrier" varchar(128),
        "price" numeric(10, 2) NOT NULL,
        "currency" varchar(10) DEFAULT 'EUR',
        "target_price" numeric(10, 2),
        "data_source" varchar(32) DEFAULT 'duffel_live',
        "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log('[MIGRATE] Migrations applied successfully: users, saved_trips, loyalty_balances, points_forecasts, external_bookings, user_cards, fare_snapshots.');
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
