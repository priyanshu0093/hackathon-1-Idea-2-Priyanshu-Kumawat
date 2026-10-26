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
import { awardProviderAdapter } from './providers/award/awardProvider.adapter.js';

import flightRoutes from './modules/flights/flight.routes.js';
import savingsRoutes from './modules/savings/savings.routes.js';
import airportRoutes from './modules/airports/airport.routes.js';
import advisorRoutes from './modules/advisor/advisor.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser requests, local frontend, or server-to-server calls without origin header
      callback(null, true);
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
      mode: isDbConnected() ? 'mongodb' : 'in-memory',
    },
    providers: {
      cashFlightProvider: {
        name: env.FLIGHT_PROVIDER,
        configured: env.FLIGHT_PROVIDER === 'mock' || amadeusAdapter.isConfigured(),
        environment: env.AMADEUS_ENV,
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

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
