import crypto from 'crypto';
import { calculateSmartSavings } from './savings.calculator.js';
import { tripsRepository } from '../trips/trips.repository.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class SavingsService {
  /**
   * Pure Smart Savings calculation
   */
  calculate(input) {
    return calculateSmartSavings(input);
  }

  /**
   * Persists a Smart Redemption plan for an authenticated user
   */
  async saveRedemptionPlan(userId, input) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const calculation = calculateSmartSavings(input);
    if (!calculation.canCalculate) {
      throw new AppError(`Cannot save invalid redemption calculation: ${calculation.reason}`, 400, 'INVALID_CALCULATION');
    }

    const planId = input.id || `red_${crypto.randomUUID()}`;
    const payload = {
      id: planId,
      userId,
      origin: input.origin.toUpperCase(),
      destination: input.destination.toUpperCase(),
      cabin: input.cabin || 'economy',
      departureDate: input.departureDate || null,
      returnDate: input.returnDate || null,
      carrier: input.carrier || null,
      cashPrice: String(calculation.cashFare),
      pointsCost: calculation.pointsRequired,
      taxes: String(calculation.awardTaxesAndFees),
      program: calculation.loyaltyProgram,
      estimatedSavings: String(calculation.cashSavings),
      dataSource: 'user_redemption_estimate',
      notes: input.notes || null,
      metadata: {
        ...calculation,
        isRedemptionPlan: true,
        userEntered: true,
        verifiedAwardAvailability: false,
      },
    };

    logger.info('Saved Smart Redemption Plan to PostgreSQL', {
      planId,
      userId,
      route: `${payload.origin}->${payload.destination}`,
      program: payload.program,
      cashSavings: calculation.cashSavings,
    });

    return await tripsRepository.upsert(payload);
  }

  /**
   * Retrieves redemption plans for the authenticated user
   */
  async getRedemptionPlans(userId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const allUserTrips = await tripsRepository.findAll(userId);
    // Filter trips that represent smart redemption plans or return all user plans
    return allUserTrips.filter(
      (trip) => trip.dataSource === 'user_redemption_estimate' || trip.metadata?.isRedemptionPlan
    );
  }

  /**
   * Deletes a redemption plan with strict user ownership enforcement
   */
  async deleteRedemptionPlan(userId, planId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const trip = await tripsRepository.findById(planId);
    if (!trip) {
      throw new AppError(`Redemption plan '${planId}' not found.`, 404, 'NOT_FOUND');
    }

    if (trip.userId !== userId) {
      throw new AppError('Access denied. You do not own this redemption plan.', 403, 'FORBIDDEN');
    }

    const deleted = await tripsRepository.deleteById(planId);
    logger.info('Removed Smart Redemption Plan from PostgreSQL', { planId, userId });
    return deleted;
  }
}

export const savingsService = new SavingsService();
