import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { isDbConnected } from './config/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { flightCache } from './utils/cache.js';
import { amadeusAdapter } from './providers/amadeus/amadeus.adapter.js';
import { duffelAdapter } from './providers/duffel/duffel.adapter.js';
import { awardProviderAdapter } from './providers/award/awardProvider.adapter.js';

import flightRoutes from './modules/flights/flight.routes.js';
import savingsRoutes from './modules/savings/savings.routes.js';
import airportRoutes from './modules/airports/airport.routes.js';
import advisorRoutes from './modules/advisor/advisor.routes.js';
import tripsRoutes from './modules/trips/trips.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import forecastRoutes from './modules/forecast/forecast.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';

const app = express();

// Security headers
app.use(helmet());

const isProduction = env.NODE_ENV === 'production';
const allowedOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : [];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser or local server-to-server calls without origin header
      if (!origin) {
        return callback(null, true);
      }
      if (!isProduction) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '512kb' }));

// Logging
app.use(requestLogger);

// Rate limiting on API routes
app.use('/api', apiRateLimiter);

// Health & diagnostics endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'A Una Milla Flight & Savings Engine',
    environment: env.NODE_ENV,
    database: {
      connected: isDbConnected(),
      dialect: 'postgresql',
      provider: 'supabase',
      mode: isDbConnected() ? 'postgresql' : 'disconnected',
    },
    providers: {
      cashFlightProvider: {
        name: env.FLIGHT_PROVIDER,
        configured:
          env.FLIGHT_PROVIDER === 'mock' ||
          (env.FLIGHT_PROVIDER === 'duffel'
            ? duffelAdapter.isConfigured()
            : amadeusAdapter.isConfigured()),
        environment: env.FLIGHT_PROVIDER === 'duffel' ? 'live' : env.AMADEUS_ENV,
      },
      awardInventoryProvider: {
        name: 'seats.aero / partner',
        configured: awardProviderAdapter.isConfigured(),
        status: awardProviderAdapter.isConfigured() ? 'active' : 'unsupported (Phase 6)',
      },
      advisorEngine: {
        mode: 'rule_based_engine',
        aiConfigured: false,
        status: 'active (deterministic expert travel hacking engine)',
      },
    },
    cache: flightCache.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
app.use('/api/v1/flights', flightRoutes);
app.use('/api/v1/savings', savingsRoutes);
app.use('/api/v1/airports', airportRoutes);
app.use('/api/v1/advisor', advisorRoutes);
app.use('/api/v1/trips', tripsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/forecast', forecastRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
