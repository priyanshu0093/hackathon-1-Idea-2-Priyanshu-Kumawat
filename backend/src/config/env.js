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
    (val) => (typeof val === 'string' && val.trim() === '' ? 'amadeus' : val),
    z.enum(['amadeus', 'mock']).default('amadeus')
  ),
  AMADEUS_CLIENT_ID: z.string().optional().default(''),
  AMADEUS_CLIENT_SECRET: z.string().optional().default(''),
  AMADEUS_ENV: z.enum(['test', 'production']).default('test'),
  SEATS_AERO_API_KEY: z.string().optional().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  CACHE_TTL_SECONDS: z.coerce.number().default(900),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment variables configuration', {
    errors: parsed.error.format(),
  });
  process.exit(1);
}

export const env = parsed.data;
