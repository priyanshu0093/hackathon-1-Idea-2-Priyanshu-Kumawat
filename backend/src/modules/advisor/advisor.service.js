import { flightCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import { generateAdvisorAdvice } from './advisor.engine.js';

export class AdvisorService {
  constructor() {
    this.providerName = 'rule_based_engine';
  }

  isAIConfigured() {
    return false; // No LLM provider credentials configured
  }

  async analyzeTrip(payload) {
    // 1. Cache key based on trip attributes + question
    const cacheKey = flightCache.generateKey('advisor-analysis', {
      origin: payload.origin,
      destination: payload.destination,
      departureDate: payload.departureDate,
      returnDate: payload.returnDate || 'oneway',
      travelers: payload.travelers,
      cabin: payload.cabin,
      cashPrice: payload.cashPrice || 0,
      question: payload.question || '',
      pointsBalance: payload.pointsBalance || 0,
    });

    const cached = flightCache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached advisor recommendation', { key: cacheKey });
      return {
        ...cached,
        fromCache: true,
      };
    }

    logger.info('Generating deterministic travel hacking advice', {
      origin: payload.origin,
      destination: payload.destination,
      cabin: payload.cabin,
      hasQuestion: Boolean(payload.question),
    });

    // 2. Generate analysis via deterministic expert engine
    const analysis = generateAdvisorAdvice(payload);

    // 3. Cache results for 10 minutes (600s)
    flightCache.set(cacheKey, analysis, 600);

    return analysis;
  }
}

export const advisorService = new AdvisorService();
