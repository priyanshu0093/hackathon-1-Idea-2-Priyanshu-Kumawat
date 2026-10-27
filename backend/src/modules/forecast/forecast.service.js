import crypto from 'crypto';
import { calculatePointsForecast } from './forecast.engine.js';
import { forecastRepository } from './forecast.repository.js';
import { walletService } from '../wallet/wallet.service.js';
import { isDbConnected } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export class ForecastService {
  async calculate(params, userId = null) {
    let currentPoints = params.currentPoints || 0;

    // If user is authenticated and hasn't explicitly supplied currentPoints,
    // automatically look up user's wallet balance for the requested program
    if (userId && isDbConnected() && (!params.currentPoints || params.currentPoints === 0)) {
      try {
        const wallet = await walletService.getWallet(userId);
        const match = wallet.balances.find((b) =>
          b.program.toLowerCase().includes(params.rewardProgram.toLowerCase()) ||
          params.rewardProgram.toLowerCase().includes(b.program.toLowerCase())
        );
        if (match) {
          currentPoints = match.balance;
        } else if (wallet.summary.totalPoints > 0) {
          currentPoints = wallet.summary.totalPoints;
        }
      } catch (err) {
        logger.warn('Could not retrieve user wallet for forecast calculation', { error: err.message });
      }
    }

    const result = calculatePointsForecast({
      ...params,
      currentPoints,
    });

    return result;
  }

  async saveUserForecast(userId, params) {
    if (!isDbConnected()) {
      return null;
    }

    const calculated = await this.calculate(params, userId);

    const record = await forecastRepository.saveForecast({
      id: `fc_${crypto.randomUUID()}`,
      userId,
      monthlySpend: String(params.monthlySpend),
      rewardProgram: params.rewardProgram,
      earningRate: String(params.earningRate || 1.5),
      targetDestination: params.targetDestination || null,
      targetPoints: params.targetPoints || null,
      travelDate: params.travelDate || null,
      assumptions: calculated.forecasts,
      updatedAt: new Date(),
    });

    return {
      record,
      forecast: calculated,
    };
  }

  async getSavedForecast(userId) {
    if (!isDbConnected()) {
      return null;
    }

    const saved = await forecastRepository.findByUserId(userId);
    return saved[0] || null;
  }
}

export const forecastService = new ForecastService();
