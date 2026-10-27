import crypto from 'crypto';
import { walletRepository } from './wallet.repository.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class WalletService {
  async getWallet(userId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const balances = await walletRepository.findByUserId(userId);
    const totalPoints = balances.reduce((sum, item) => sum + (item.balance || 0), 0);

    return {
      balances,
      summary: {
        totalPoints,
        programCount: balances.length,
        hasBalances: balances.length > 0,
        sourceLabel: 'Manually entered loyalty balances',
      },
    };
  }

  async saveBalance(userId, data) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    // Check if entry for this program already exists
    let existing = null;
    if (data.id) {
      existing = await walletRepository.findByIdAndUser(data.id, userId);
    } else {
      existing = await walletRepository.findByProgramAndUser(data.program, userId);
    }

    const id = existing ? existing.id : (data.id || `bal_${crypto.randomUUID()}`);

    const payload = {
      id,
      userId,
      program: data.program.trim(),
      programType: data.programType || 'airline',
      balance: Number(data.balance),
      currencyName: data.currencyName || 'points',
      source: 'manual_entry',
      notes: data.notes || null,
      lastUpdated: new Date(),
      updatedAt: new Date(),
    };

    logger.info('Saved loyalty balance in Points Wallet', {
      userId,
      program: payload.program,
      balance: payload.balance,
    });

    return await walletRepository.upsert(payload);
  }

  async deleteBalance(userId, balanceId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const deleted = await walletRepository.delete(balanceId, userId);
    if (!deleted) {
      throw new AppError('Loyalty balance record not found.', 404, 'NOT_FOUND');
    }

    logger.info('Removed loyalty balance from Points Wallet', { userId, balanceId });
    return deleted;
  }
}

export const walletService = new WalletService();
