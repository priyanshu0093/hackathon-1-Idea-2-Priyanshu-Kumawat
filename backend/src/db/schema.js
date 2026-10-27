import { pgTable, varchar, numeric, integer, timestamp, jsonb, text, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Users Table (Phase 10: Authentication & Identity Model)
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Saved Trips Table (Phase 9/10: Trip Ownership & Persistence)
 */
export const savedTrips = pgTable('saved_trips', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }), // nullable for anonymous/local saved trips
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

/**
 * Loyalty Balances / Points Wallet Table (Phase 10)
 */
export const loyaltyBalances = pgTable('loyalty_balances', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  program: varchar('program', { length: 128 }).notNull(),
  programType: varchar('program_type', { length: 32 }).default('airline'), // 'airline' | 'bank_transfer' | 'hotel'
  balance: integer('balance').notNull().default(0),
  currencyName: varchar('currency_name', { length: 64 }).default('points'), // 'Avios', 'Points', 'Miles'
  source: varchar('source', { length: 32 }).default('manual_entry'), // 'manual_entry'
  notes: text('notes'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Points Forecasts Table (Phase 10: 30/60/90 Day Forecasts)
 */
export const pointsForecasts = pgTable('points_forecasts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  monthlySpend: numeric('monthly_spend', { precision: 10, scale: 2 }).notNull(),
  rewardProgram: varchar('reward_program', { length: 128 }).notNull(),
  earningRate: numeric('earning_rate', { precision: 5, scale: 2 }).default('1.5'),
  targetDestination: varchar('target_destination', { length: 10 }),
  targetPoints: integer('target_points'),
  travelDate: varchar('travel_date', { length: 32 }),
  assumptions: jsonb('assumptions').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * External Bookings Table (Phase 10: Confirmation Management)
 */
export const externalBookings = pgTable('external_bookings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  bookingReference: varchar('booking_reference', { length: 32 }).notNull(), // PNR code
  airline: varchar('airline', { length: 128 }).notNull(),
  flightNumber: varchar('flight_number', { length: 32 }),
  origin: varchar('origin', { length: 10 }).notNull(),
  destination: varchar('destination', { length: 10 }).notNull(),
  departureDate: varchar('departure_date', { length: 32 }).notNull(),
  returnDate: varchar('return_date', { length: 32 }),
  cabin: varchar('cabin', { length: 32 }).default('economy'),
  pointsRedeemed: integer('points_redeemed').default(0),
  taxesPaid: numeric('taxes_paid', { precision: 10, scale: 2 }).default('0'),
  cashSavedEstimate: numeric('cash_saved_estimate', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 32 }).default('confirmed'), // 'confirmed', 'ticketed', 'completed', 'cancelled'
  isVerifiedConfirmation: boolean('is_verified_confirmation').default(false), // Always false for user-entered
  recordSource: varchar('record_source', { length: 64 }).default('user_entered_external'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
