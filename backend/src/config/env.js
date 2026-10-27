import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Load .env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z.string().optional().default('')
  ),
  FLIGHT_PROVIDER: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? 'duffel' : val),
    z.enum(['amadeus', 'duffel', 'mock']).default('duffel')
  ),
  AMADEUS_CLIENT_ID: z.string().optional().default(''),
  AMADEUS_CLIENT_SECRET: z.string().optional().default(''),
  AMADEUS_ENV: z.enum(['test', 'production']).default('test'),
  DUFFEL_ACCESS_TOKEN: z.string().optional().default(''),
  SEATS_AERO_API_KEY: z.string().optional().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  CACHE_TTL_SECONDS: z.coerce.number().default(900),
  JWT_SECRET: z.string().default('a-una-milla-super-secret-jwt-key-phase-10-production'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.JWT_SECRET || data.JWT_SECRET.includes('super-secret-jwt-key') || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET is required to be an explicit, secure key of at least 32 characters in production.',
        path: ['JWT_SECRET'],
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment variables configuration', {
    errors: parsed.error.format(),
  });
  process.exit(1);
}

export const env = parsed.data;
