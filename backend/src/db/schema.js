import { pgTable, varchar, numeric, integer, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Saved Trips Table (Phase 9: Supabase PostgreSQL Persistence)
 * Persists saved award flight optimizations, itineraries, and trip metadata.
 */
export const savedTrips = pgTable('saved_trips', {
  id: varchar('id', { length: 64 }).primaryKey(),
  origin: varchar('origin', { length: 10 }).notNull(),
  destination: varchar('destination', { length: 10 }).notNull(),
  cabin: varchar('cabin', { length: 32 }).notNull().default('economy'),
  departureDate: varchar('departure_date', { length: 32 }),
  returnDate: varchar('return_date', { length: 32 }),
  carrier: varchar('carrier', { length: 128 }),
  cashPrice: numeric('cash_price', { precision: 10, scale: 2 }),
  pointsCost: integer('points_cost'),
  taxes: numeric('taxes', { precision: 10, scale: 2 }),
  program: varchar('program', { length: 128 }),
  estimatedSavings: numeric('estimated_savings', { precision: 10, scale: 2 }),
  dataSource: varchar('data_source', { length: 32 }).default('benchmark'),
  notes: text('notes'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
