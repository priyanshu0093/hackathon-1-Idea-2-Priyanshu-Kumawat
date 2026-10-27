import crypto from 'crypto';
import { cardsRepository } from './cards.repository.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { SPAIN_CARDS_CATALOG, findCardProductById } from './cards.catalog.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export function generateDemoCardBalance(userId, cardProductId, demoBaseRange) {
  const [min, max] = demoBaseRange || [10000, 25000];
  // Deterministic hash based on user ID and card product ID
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${cardProductId}:a-una-milla-spain-cards-v1`)
    .digest('hex');

  const intVal = parseInt(hash.substring(0, 8), 16);
  const spread = max - min;
  const rawPoints = min + (intVal % (spread + 1));
  // Round to nearest 250 points for a realistic loyalty balance appearance
  return Math.round(rawPoints / 250) * 250;
}

export class CardsService {
  getCatalog() {
    return {
      products: SPAIN_CARDS_CATALOG,
      total: SPAIN_CARDS_CATALOG.length,
      market: 'Spain (España)',
      disclaimer:
        'DEMO CATALOG — Card products and rewards programs are simulated for Spanish market demonstration. Balances and earning rates are illustrative.',
    };
  }

  async getCards(userId) {
    const rawCards = await cardsRepository.findByUserId(userId);

    // Group points strictly by compatible rewards currency (never mix into one misleading total)
    const currencyMap = new Map();

    const formattedCards = rawCards.map((card) => {
      const product = findCardProductById(card.cardProductId);
      const points = Number(card.demoBalance) || 0;
      const key = `${card.rewardsProgram}__${card.currency}`;

      if (!currencyMap.has(key)) {
        currencyMap.set(key, {
          rewardsProgram: card.rewardsProgram,
          currency: card.currency,
          totalDemoPoints: 0,
          cardCount: 0,
          cardNames: [],
        });
      }

      const group = currencyMap.get(key);
      group.totalDemoPoints += points;
      group.cardCount += 1;
      group.cardNames.push(card.nickname || card.cardName);

      return {
        ...card,
        estimatedMonthlySpend: Number(card.estimatedMonthlySpend) || 0,
        demoBalance: points,
        defaultEarningRate: product?.defaultEarningRate || 1.0,
        earningRateUnit: product?.earningRateUnit || 'points/€',
        compatibleAirlines: product?.compatibleAirlines || [],
        badgeColor: product?.badgeColor || 'emerald',
      };
    });

    const currencyTotals = Array.from(currencyMap.values());

    return {
      cards: formattedCards,
      currencyTotals,
      summary: {
        totalCards: formattedCards.length,
        distinctCurrencies: currencyTotals.length,
        hasCards: formattedCards.length > 0,
        disclaimer: 'DEMO BALANCE — Not connected to your bank. Demo balances are illustrative.',
      },
    };
  }

  async addCard(userId, data) {
    const product = findCardProductById(data.cardProductId);
    if (!product) {
      throw new AppError(
        `Card product '${data.cardProductId}' is not in the supported Spain card catalog.`,
        400,
        'UNSUPPORTED_CARD_PRODUCT'
      );
    }

    // Duplicate check: prevent user from adding the same card product twice
    const existing = await cardsRepository.findByUserAndProduct(userId, product.id);
    if (existing) {
      throw new AppError(
        `You have already added '${product.name}' to your wallet. You can edit its monthly spending estimate or nickname instead.`,
        409,
        'CARD_ALREADY_EXISTS'
      );
    }

    // Generate deterministic demo balance once
    const demoBalance = generateDemoCardBalance(userId, product.id, product.demoBaseRange);

    const cardPayload = {
      id: `crd_${crypto.randomUUID()}`,
      userId,
      cardProductId: product.id,
      cardName: product.name,
      issuer: product.issuer,
      rewardsProgram: product.rewardsProgram,
      currency: product.currency,
      nickname: data.nickname ? data.nickname.trim() : null,
      estimatedMonthlySpend: String(data.estimatedMonthlySpend || 0),
      demoBalance,
      isDemo: true,
      demoBalanceLabel: 'DEMO BALANCE — Not connected to your bank',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await cardsRepository.insert(cardPayload);

    // Auto-sync total points per program into user's flight loyalty wallet
    try {
      await this.syncCardsToWallet(userId);
    } catch (syncErr) {
      logger.warn('Failed to auto-sync card points to wallet', { userId, error: syncErr.message });
    }

    logger.info('Added Spain reward card to user wallet', {
      userId,
      cardId: saved.id,
      cardName: saved.cardName,
      demoBalance: saved.demoBalance,
    });

    return {
      ...saved,
      estimatedMonthlySpend: Number(saved.estimatedMonthlySpend) || 0,
      defaultEarningRate: product.defaultEarningRate,
      earningRateUnit: product.earningRateUnit,
      compatibleAirlines: product.compatibleAirlines,
      badgeColor: product.badgeColor,
    };
  }

  async getCardById(userId, cardId) {
    const card = await cardsRepository.findByIdAndUser(cardId, userId);
    if (!card) {
      throw new AppError('Card not found in your wallet or access denied.', 404, 'NOT_FOUND');
    }
    const product = findCardProductById(card.cardProductId);
    return {
      ...card,
      estimatedMonthlySpend: Number(card.estimatedMonthlySpend) || 0,
      defaultEarningRate: product?.defaultEarningRate || 1.0,
      earningRateUnit: product?.earningRateUnit || 'points/€',
      compatibleAirlines: product?.compatibleAirlines || [],
      badgeColor: product?.badgeColor || 'emerald',
    };
  }

  async updateCard(userId, cardId, updates) {
    const existing = await cardsRepository.findByIdAndUser(cardId, userId);
    if (!existing) {
      throw new AppError('Card not found in your wallet or access denied.', 404, 'NOT_FOUND');
    }

    const updatePayload = {};
    if (updates.nickname !== undefined) {
      updatePayload.nickname = updates.nickname ? updates.nickname.trim() : null;
    }
    if (updates.estimatedMonthlySpend !== undefined) {
      updatePayload.estimatedMonthlySpend = String(updates.estimatedMonthlySpend);
    }

    const updated = await cardsRepository.update(cardId, userId, updatePayload);
    const product = findCardProductById(updated.cardProductId);

    logger.info('Updated user reward card', { userId, cardId });

    return {
      ...updated,
      estimatedMonthlySpend: Number(updated.estimatedMonthlySpend) || 0,
      defaultEarningRate: product?.defaultEarningRate || 1.0,
      earningRateUnit: product?.earningRateUnit || 'points/€',
      compatibleAirlines: product?.compatibleAirlines || [],
      badgeColor: product?.badgeColor || 'emerald',
    };
  }

  async deleteCard(userId, cardId) {
    const existing = await cardsRepository.findByIdAndUser(cardId, userId);
    if (!existing) {
      throw new AppError('Card not found in your wallet or access denied.', 404, 'NOT_FOUND');
    }

    const deleted = await cardsRepository.delete(cardId, userId);

    // Re-sync wallet after card deletion
    try {
      await this.syncCardsToWallet(userId);
    } catch (syncErr) {
      logger.warn('Failed to re-sync wallet after card deletion', { userId, error: syncErr.message });
    }

    logger.info('Removed reward card from user wallet', { userId, cardId });
    return deleted;
  }

  /**
   * Aggregates all card balances by program/currency and syncs them to the loyalty wallet table (user_loyalty_balances)
   * so they are available for flight bookings and redemption planning.
   */
  async syncCardsToWallet(userId) {
    const cards = await cardsRepository.findByUserId(userId);
    const programMap = new Map();

    for (const card of cards) {
      const prog = card.rewardsProgram;
      const existing = programMap.get(prog) || {
        program: prog,
        totalBalance: 0,
        currency: card.currency,
        cardCount: 0,
      };
      existing.totalBalance += Number(card.demoBalance) || 0;
      existing.cardCount += 1;
      programMap.set(prog, existing);
    }

    const syncedBalances = [];
    for (const [prog, data] of programMap.entries()) {
      const existingInWallet = await walletRepository.findByProgramAndUser(prog, userId);
      const id = existingInWallet ? existingInWallet.id : `bal_crd_${crypto.randomUUID().slice(0, 20)}`;
      const saved = await walletRepository.upsert({
        id,
        userId,
        program: prog,
        programType: 'airline',
        balance: data.totalBalance,
        currencyName: data.currency,
        source: 'card_wallet',
        notes: `Auto-synced from Card Rewards Wallet (${data.cardCount} card${data.cardCount > 1 ? 's' : ''})`,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      });
      syncedBalances.push(saved);
    }

    // Clean up any old card_wallet entries whose programs have no cards
    const userWalletEntries = await walletRepository.findByUserId(userId);
    for (const entry of userWalletEntries) {
      if (entry.source === 'card_wallet' && !programMap.has(entry.program)) {
        await walletRepository.delete(entry.id, userId);
      }
    }

    const totalPointsSynced = syncedBalances.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

    logger.info('Synced card points to user loyalty wallet', {
      userId,
      syncedPrograms: syncedBalances.length,
      totalPointsSynced,
    });

    return {
      syncedPrograms: syncedBalances.length,
      totalPointsSynced,
      balances: syncedBalances,
    };
  }

  async getCardForecast(userId) {
    const { cards, currencyTotals } = await this.getCards(userId);

    if (cards.length === 0) {
      return {
        hasCards: false,
        projections: [],
        assumptions: ['Add a rewards card with an estimated monthly spend to see projected points accumulation.'],
        disclaimer: 'Projections are illustrative and based on demo assumptions, not guaranteed bank earnings.',
      };
    }

    // Group projections by compatible rewards program
    const projectionMap = new Map();

    for (const card of cards) {
      const spend = card.estimatedMonthlySpend || 0;
      const rate = card.defaultEarningRate || 1.0;
      const key = `${card.rewardsProgram}__${card.currency}`;

      if (!projectionMap.has(key)) {
        projectionMap.set(key, {
          rewardsProgram: card.rewardsProgram,
          currency: card.currency,
          currentDemoPoints: 0,
          totalMonthlySpend: 0,
          estimatedMonthlyPoints: 0,
          days30Points: 0,
          days60Points: 0,
          projectedTotal60: 0,
          cardsContributing: [],
        });
      }

      const proj = projectionMap.get(key);
      proj.currentDemoPoints += card.demoBalance;
      proj.totalMonthlySpend += spend;

      const cardMonthlyPoints = Math.round(spend * rate);
      proj.estimatedMonthlyPoints += cardMonthlyPoints;
      proj.days30Points += cardMonthlyPoints;
      proj.days60Points += cardMonthlyPoints * 2;
      proj.projectedTotal60 = proj.currentDemoPoints + proj.days60Points;
      proj.cardsContributing.push({
        cardName: card.nickname || card.cardName,
        spend,
        earningRate: rate,
        earningRateUnit: card.earningRateUnit,
      });
    }

    const projections = Array.from(projectionMap.values());

    return {
      hasCards: true,
      cardCount: cards.length,
      projections,
      assumptions: [
        'Projections are based on user-provided monthly spend estimates and standard Spanish card baseline earning rates.',
        'Assumes regular organic spending paid in full each month without interest or late fees.',
        'Does not include sign-up welcome bonuses, retention offers, or periodic promotional transfer bonuses.',
      ],
      disclaimer: 'ILLUSTRATIVE PROJECTIONS ONLY — Not guaranteed bank earnings or financial advice.',
    };
  }
}

export const cardsService = new CardsService();
