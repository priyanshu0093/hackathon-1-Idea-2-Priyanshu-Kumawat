import crypto from 'crypto';
import { fareSnapshotsRepository } from './recommendations.repository.js';
import { cardsRepository } from '../cards/cards.repository.js';
import { SPAIN_CARDS_CATALOG, findCardProductById } from '../cards/cards.catalog.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { calculateSmartSavings } from '../savings/savings.calculator.js';
import { flightService } from '../flights/flight.service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

// Alternative airport pairings for smart routing suggestions
const AIRPORT_ALTERNATIVES = {
  MAD: [
    { code: 'BCN', name: 'Barcelona-El Prat (BCN)', note: '2.5h AVE high-speed train link; frequently offers lower transatlantic cash fares.' },
  ],
  BCN: [
    { code: 'MAD', name: 'Madrid-Barajas (MAD)', note: 'Primary Iberia hub with direct transatlantic flights and low carrier fuel surcharges.' },
  ],
  JFK: [
    { code: 'EWR', name: 'Newark Liberty (EWR)', note: 'United hub serving NYC metro; alternative Star Alliance award inventory.' },
    { code: 'BOS', name: 'Boston Logan (BOS)', note: 'Zone 5 Avios sweet spot from Madrid (17,000 Avios off-peak); 4h train to NYC.' },
  ],
  EWR: [
    { code: 'JFK', name: 'New York JFK', note: 'Major oneworld and SkyTeam international hub with higher flight frequency.' },
  ],
  MIA: [
    { code: 'FLL', name: 'Fort Lauderdale-Hollywood (FLL)', note: '30 miles north of Miami; low-cost carrier alternative.' },
  ],
  LHR: [
    { code: 'LGW', name: 'London Gatwick (LGW)', note: 'Lower airport passenger charges than Heathrow.' },
    { code: 'MAD', name: 'Madrid-Barajas (MAD)', note: 'Connecting via Madrid avoids the expensive UK Air Passenger Duty (APD) tax.' },
  ],
  BOM: [
    { code: 'DEL', name: 'Delhi Indira Gandhi (DEL)', note: 'Primary North India hub with direct European routes.' },
  ],
  DEL: [
    { code: 'BOM', name: 'Mumbai Chhatrapati Shivaji (BOM)', note: 'High frequency domestic shuttle; alternative gateway to Europe.' },
  ],
};

// Route benchmark table for standard distance-based off-peak Avios redemptions
function getRouteAwardBenchmark(origin, destination, cabin) {
  const pair = [origin, destination].sort().join('-');

  if (['BOS-MAD', 'JFK-MAD', 'MAD-ORD'].includes(pair)) {
    return {
      program: 'Iberia Plus',
      currency: 'Avios',
      pointsRequired: cabin === 'business' ? 34000 : 17000,
      taxesAndFees: 95,
      isBenchmark: true,
      notes: 'Zone 5 off-peak Avios saver chart with minimal surcharges via Madrid.',
    };
  }

  if (['MAD-MIA'].includes(pair)) {
    return {
      program: 'Iberia Plus',
      currency: 'Avios',
      pointsRequired: cabin === 'business' ? 42500 : 21250,
      taxesAndFees: 110,
      isBenchmark: true,
      notes: 'Zone 6 off-peak direct Madrid-Miami Avios benchmark.',
    };
  }

  if (['BCN-MAD', 'CDG-MAD', 'LHR-MAD', 'LIS-MAD'].includes(pair)) {
    return {
      program: 'Iberia Plus',
      currency: 'Avios',
      pointsRequired: cabin === 'business' ? 15000 : 7500,
      taxesAndFees: 28,
      isBenchmark: true,
      notes: 'Short-haul Reward Flight Saver (RFS) fixed fee redemption.',
    };
  }

  if (['BOM-DEL', 'BLR-BOM', 'BLR-DEL'].includes(pair)) {
    return {
      program: 'Air India Flying Returns',
      currency: 'Points',
      pointsRequired: cabin === 'business' ? 12000 : 5000,
      taxesAndFees: 12,
      isBenchmark: true,
      notes: 'Domestic India standard saver redemption.',
    };
  }

  if (['DEL-LHR'].includes(pair)) {
    return {
      program: 'Virgin Atlantic Flying Club',
      currency: 'Points',
      pointsRequired: cabin === 'business' ? 37500 : 12500,
      taxesAndFees: 145,
      isBenchmark: true,
      notes: 'Delhi to London saver points award (UK APD applies).',
    };
  }

  // Generic fallback
  return {
    program: 'Flying Blue',
    currency: 'Miles',
    pointsRequired: cabin === 'business' ? 50000 : 20000,
    taxesAndFees: 140,
    isBenchmark: true,
    notes: 'Transatlantic standard saver benchmark.',
  };
}

export class RecommendationsService {
  /**
   * 1. Fare Snapshot Persistence
   */
  async saveFareSnapshot(userId, data) {
    const id = `snp_${crypto.randomUUID()}`;
    const payload = {
      id,
      userId: userId || null,
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      departureDate: data.departureDate,
      returnDate: data.returnDate || null,
      cabin: data.cabin || 'economy',
      carrier: data.carrier ? data.carrier.trim() : null,
      price: String(data.price),
      currency: (data.currency || 'EUR').toUpperCase(),
      targetPrice: data.targetPrice ? String(data.targetPrice) : null,
      dataSource: data.dataSource || 'duffel_live',
      capturedAt: new Date(),
      createdAt: new Date(),
    };

    const saved = await fareSnapshotsRepository.create(payload);
    logger.info('Recorded fare snapshot for price tracking', {
      snapshotId: id,
      route: `${data.origin}->${data.destination}`,
      price: data.price,
      targetPrice: data.targetPrice,
    });

    return saved;
  }

  /**
   * 1. Best Time to Book Recommendation
   */
  async getBestTimeToBook({ userId, origin, destination, departureDate, currentPrice, currency = 'EUR', targetPrice, cabin = 'economy' }) {
    const orig = origin.toUpperCase();
    const dest = destination.toUpperCase();
    const curPrice = Number(currentPrice);

    // Retrieve genuine historical snapshots recorded for this route and departure date
    const snapshots = await fareSnapshotsRepository.findByRouteAndDates({
      origin: orig,
      destination: dest,
      departureDate,
      cabin,
    });

    // Auto-save current fare snapshot for future tracking
    try {
      await this.saveFareSnapshot(userId, {
        origin: orig,
        destination: dest,
        departureDate,
        cabin,
        price: curPrice,
        currency,
        targetPrice,
        dataSource: 'duffel_live',
      });
    } catch (snapErr) {
      logger.warn('Failed to auto-record fare snapshot', { error: snapErr.message });
    }

    const recordedPrices = snapshots.map((s) => Number(s.price)).filter((p) => !isNaN(p) && p > 0);
    const minHistorical = recordedPrices.length > 0 ? Math.min(...recordedPrices, curPrice) : curPrice;
    const maxHistorical = recordedPrices.length > 0 ? Math.max(...recordedPrices, curPrice) : curPrice;
    const avgHistorical =
      recordedPrices.length > 0
        ? recordedPrices.reduce((a, b) => a + b, 0) / recordedPrices.length
        : curPrice;

    // Days until departure calculation
    const depDate = new Date(departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = depDate.getTime() - today.getTime();
    const daysUntilDeparture = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let action = 'MONITOR_PRICE';
    let recommendation = 'Monitor price';
    let rationale = '';
    let targetPriceMet = false;
    let targetPriceDifference = null;

    // Rule 1: Target Price evaluation
    if (targetPrice !== undefined && targetPrice !== null && !isNaN(Number(targetPrice))) {
      const tgt = Number(targetPrice);
      targetPriceDifference = Number((curPrice - tgt).toFixed(2));

      if (curPrice <= tgt) {
        action = 'BOOK_NOW';
        recommendation = 'Book now';
        targetPriceMet = true;
        rationale = `Current fare of €${curPrice.toFixed(2)} meets or beats your target price of €${tgt.toFixed(2)} (saving €${Math.abs(targetPriceDifference).toFixed(2)} vs target).`;
      } else {
        action = 'MONITOR_PRICE';
        recommendation = 'Monitor price';
        targetPriceMet = false;
        rationale = `Current fare of €${curPrice.toFixed(2)} is €${targetPriceDifference.toFixed(2)} above your target price of €${tgt.toFixed(2)}. We recommend monitoring for fare drops.`;
      }
    }
    // Rule 2: Genuinely stored historical snapshot evaluation (if >= 2 previous snapshots)
    else if (snapshots.length >= 2) {
      if (curPrice <= minHistorical * 1.05) {
        action = 'BOOK_NOW';
        recommendation = 'Book now';
        rationale = `Current fare of €${curPrice.toFixed(2)} is near the lowest recorded price (€${minHistorical.toFixed(2)}) across ${snapshots.length} tracked snapshots for this flight.`;
      } else if (curPrice > avgHistorical * 1.15) {
        action = 'MONITOR_PRICE';
        recommendation = 'Monitor price';
        rationale = `Current fare of €${curPrice.toFixed(2)} is 15%+ higher than the recorded historical average (€${avgHistorical.toFixed(2)}) for this route.`;
      } else {
        action = 'MONITOR_PRICE';
        recommendation = 'Monitor price';
        rationale = `Current fare of €${curPrice.toFixed(2)} is within typical historical range (€${avgHistorical.toFixed(2)} avg). You can monitor for periodic fare sales.`;
      }
    }
    // Rule 3: Defensible departure proximity rule
    else {
      if (daysUntilDeparture <= 14) {
        action = 'BOOK_NOW';
        recommendation = 'Book now';
        rationale = `Flight departs in ${daysUntilDeparture} days. Airline revenue management systems typically raise fares within 14 days of departure.`;
      } else if (daysUntilDeparture >= 60) {
        action = 'MONITOR_PRICE';
        recommendation = 'Monitor price';
        rationale = `Flight is ${daysUntilDeparture} days away. Fares are typically most volatile and subject to sales between 30 and 60 days before travel.`;
      } else {
        action = 'MONITOR_PRICE';
        recommendation = 'Monitor price';
        rationale = `Flight departs in ${daysUntilDeparture} days. We recommend monitoring prices and setting a target alert.`;
      }
    }

    const dataTransparency = snapshots.length >= 2
      ? `Based on ${snapshots.length} genuine recorded fare snapshots for ${orig} → ${dest}. No future price is guaranteed.`
      : `Historical data is limited (${snapshots.length} previous snapshot${snapshots.length === 1 ? '' : 's'}). Recommendation is based on target price and standard booking window heuristics, not predictive machine learning.`;

    return {
      action,
      recommendation,
      rationale,
      currentPrice: curPrice,
      currency,
      targetPrice: targetPrice ? Number(targetPrice) : null,
      targetPriceMet,
      targetPriceDifference,
      daysUntilDeparture,
      historicalSnapshots: {
        totalTracked: snapshots.length,
        minRecordedPrice: minHistorical,
        maxRecordedPrice: maxHistorical,
        avgRecordedPrice: Number(avgHistorical.toFixed(2)),
        hasHistory: snapshots.length >= 2,
      },
      dataTransparency,
      disclosure: 'A Una Milla does not claim to predict future airfares with guaranteed accuracy. Recommendations are heuristic tools.',
    };
  }

  /**
   * 2. Best Card & Rewards Recommendation
   */
  async getBestCardAndRewardsRecommendation(userId, flightContext) {
    if (!userId) {
      throw new AppError('Authentication required to view personalized card and rewards recommendations.', 401, 'UNAUTHORIZED');
    }

    // 1. Fetch only authenticated user's cards and loyalty balances
    let userCards = [];
    let userBalances = [];
    try {
      userCards = await cardsRepository.findByUserId(userId);
    } catch (err) {
      logger.warn('Failed to fetch user cards in recommendations', { error: err.message, userId });
    }
    try {
      userBalances = await walletRepository.findByUserId(userId);
    } catch (err) {
      logger.warn('Failed to fetch user wallet balances in recommendations', { error: err.message, userId });
    }

    const cashFare = Number(flightContext.cashFare);
    const cashCurrency = (flightContext.cashCurrency || 'EUR').toUpperCase();
    const origin = (flightContext.origin || 'MAD').toUpperCase();
    const destination = (flightContext.destination || 'MIA').toUpperCase();
    const cabin = flightContext.cabin || 'economy';

    // 2. Determine target award program and benchmark
    const benchmark = getRouteAwardBenchmark(origin, destination, cabin);
    const targetProgram = flightContext.awardProgram || benchmark.program;
    const pointsRequired = flightContext.pointsRequired ? Number(flightContext.pointsRequired) : benchmark.pointsRequired;
    const awardTaxes = flightContext.awardTaxesAndFees !== undefined ? Number(flightContext.awardTaxesAndFees) : benchmark.taxesAndFees;

    // 3. User's balance in this program
    const matchingWalletBal = userBalances.find(
      (b) => b.program?.toLowerCase() === targetProgram.toLowerCase()
    );
    const directPointsBalance = matchingWalletBal ? Number(matchingWalletBal.balance) || 0 : 0;

    // Check user's cards that directly earn or transfer to target program
    const compatibleCards = userCards.filter((c) => {
      if (c.rewardsProgram?.toLowerCase() === targetProgram.toLowerCase()) return true;
      const product = findCardProductById(c.cardProductId);
      if (product?.compatibleAirlines?.some((a) => a.toLowerCase().includes(targetProgram.toLowerCase()))) {
        return true;
      }
      return false;
    });

    const userCardPointsInProgram = userCards
      .filter((c) => c.rewardsProgram?.toLowerCase() === targetProgram.toLowerCase())
      .reduce((sum, c) => sum + (Number(c.demoBalance) || 0), 0);

    const effectiveUserBalance = Math.max(directPointsBalance, userCardPointsInProgram);
    const pointsShortfall = Math.max(0, pointsRequired - effectiveUserBalance);
    const hasEnoughPoints = effectiveUserBalance >= pointsRequired;

    // 4. Calculate Phase 14 Smart Savings
    const savingsResult = calculateSmartSavings({
      cashFare,
      cashCurrency,
      pointsRequired,
      awardTaxesAndFees: awardTaxes,
      awardCurrency: cashCurrency,
      userConfiguredValuePerPoint: flightContext.userConfiguredValuePerPoint || 0.013,
      loyaltyProgram: targetProgram,
      userPointsBalance: effectiveUserBalance,
      sourceType: 'user_entered',
    });

    // 5. Best card for FUTURE eligible spending
    let recommendedCard = null;
    let earningRateAssumption = null;
    let isRateVerified = false;
    let spendToBridgeShortfall = 0;
    let monthsToBridge = null;

    if (compatibleCards.length > 0) {
      // Pick user's compatible card: prefer direct program match first, then highest earning rate
      const bestUserCard = [...compatibleCards].sort((a, b) => {
        const directA = a.rewardsProgram?.toLowerCase() === targetProgram.toLowerCase() ? 1 : 0;
        const directB = b.rewardsProgram?.toLowerCase() === targetProgram.toLowerCase() ? 1 : 0;
        if (directA !== directB) return directB - directA;

        const prodA = findCardProductById(a.cardProductId);
        const prodB = findCardProductById(b.cardProductId);
        return (prodB?.defaultEarningRate || 1.0) - (prodA?.defaultEarningRate || 1.0);
      })[0];

      const product = findCardProductById(bestUserCard.cardProductId);
      const rate = product?.defaultEarningRate || 1.0;
      const monthlySpend = Number(bestUserCard.estimatedMonthlySpend) || 1000;

      recommendedCard = {
        source: 'user_wallet',
        cardName: bestUserCard.nickname || bestUserCard.cardName,
        cardProductId: bestUserCard.cardProductId,
        issuer: bestUserCard.issuer,
        rewardsProgram: bestUserCard.rewardsProgram,
        currency: bestUserCard.currency,
        earningRate: rate,
        earningRateUnit: product?.earningRateUnit || 'points/€',
        isDemoBalance: true,
      };

      earningRateAssumption = `${rate} ${product?.earningRateUnit || 'points/€'} based on standard Spain catalog benchmark.`;
      isRateVerified = false; // Label illustrative unless bank feed is live

      if (pointsShortfall > 0) {
        spendToBridgeShortfall = Math.ceil(pointsShortfall / rate);
        monthsToBridge = monthlySpend > 0 ? Math.ceil(spendToBridgeShortfall / monthlySpend) : null;
      }
    } else {
      // User has no compatible card; suggest from catalog with strict illustrative label
      const catalogCandidate = SPAIN_CARDS_CATALOG.find((c) =>
        c.rewardsProgram.toLowerCase() === targetProgram.toLowerCase() ||
        c.compatibleAirlines.some((a) => a.toLowerCase().includes(targetProgram.toLowerCase()))
      ) || SPAIN_CARDS_CATALOG[0];

      recommendedCard = {
        source: 'catalog_suggestion',
        cardName: catalogCandidate.name,
        cardProductId: catalogCandidate.id,
        issuer: catalogCandidate.issuer,
        rewardsProgram: catalogCandidate.rewardsProgram,
        currency: catalogCandidate.currency,
        earningRate: catalogCandidate.defaultEarningRate,
        earningRateUnit: catalogCandidate.earningRateUnit,
        isDemoBalance: true,
      };

      earningRateAssumption = `${catalogCandidate.defaultEarningRate} ${catalogCandidate.earningRateUnit} (Illustrative Spain market benchmark).`;
      isRateVerified = false;

      if (pointsShortfall > 0) {
        spendToBridgeShortfall = Math.ceil(pointsShortfall / catalogCandidate.defaultEarningRate);
        monthsToBridge = Math.ceil(spendToBridgeShortfall / 1500); // 1,500€ baseline assumption
      }
    }

    return {
      targetProgram,
      currency: benchmark.currency,
      cashFare,
      cashCurrency,
      pointsRequired,
      awardTaxesAndFees: awardTaxes,
      userCurrentBalance: effectiveUserBalance,
      hasEnoughPoints,
      pointsShortfall,
      savingsAnalysis: {
        canCalculate: savingsResult.canCalculate,
        estimatedCashSavings: savingsResult.cashSavings ?? 0,
        centsPerPoint: savingsResult.valuePerPointCents ?? 0,
        recommendationVerdict: savingsResult.status || (hasEnoughPoints ? 'award_savings_favorable' : 'cash_fare_better_value'),
        verdictReason: savingsResult.recommendation || '',
      },
      cardRecommendation: {
        recommendedCard,
        earningRateAssumption,
        isRateVerified,
        spendToBridgeShortfall,
        estimatedMonthsToBridge: monthsToBridge,
        label: isRateVerified ? 'VERIFIED' : 'ILLUSTRATIVE DEMO BENCHMARK',
      },
      disclaimers: [
        'Demo-generated points are simulated within A Una Milla and cannot be used as real airline miles or payment.',
        'Different rewards currencies remain strictly isolated and are never combined without verified 1:1 transfer rules.',
        'Card earning rates and accumulation forecasts are illustrative estimates.',
      ],
    };
  }

  /**
   * 3. Smart Trip Savings Plan
   */
  async getSmartTripSavingsPlan(userId, planInput) {
    const origin = planInput.origin.toUpperCase();
    const destination = planInput.destination.toUpperCase();
    const budget = Number(planInput.budget);
    const travelers = Number(planInput.travelers || 1);
    const cabin = planInput.cabin || 'economy';

    // 1. Search genuine flight offers using existing flight service
    let searchResult;
    try {
      searchResult = await flightService.searchFlights({
        origin,
        destination,
        departureDate: planInput.departureDate,
        returnDate: planInput.returnDate || undefined,
        travelers,
        cabin,
        currency: planInput.currency || 'EUR',
      });
    } catch {
      // Fallback to demo mode if live search provider is unconfigured or unavailable
      searchResult = await flightService.searchFlights({
        origin,
        destination,
        departureDate: planInput.departureDate,
        returnDate: planInput.returnDate || undefined,
        travelers,
        cabin,
        currency: planInput.currency || 'EUR',
        provider: 'demo',
        demo: true,
      });
    }

    const offers = searchResult?.offers || [];
    const bestCashOffer = offers.length > 0
      ? [...offers].sort((a, b) => (Number(a.price?.total) || 0) - (Number(b.price?.total) || 0))[0]
      : null;

    const totalCashFare = bestCashOffer ? Number(bestCashOffer.price?.total) : 450 * travelers;
    const perPersonCash = bestCashOffer ? (Number(bestCashOffer.price?.total) / travelers) : 450;
    const carrier = bestCashOffer?.airline?.name || bestCashOffer?.carrier || 'Airline';
    const isWithinBudget = totalCashFare <= budget;
    const budgetDifference = Number((budget - totalCashFare).toFixed(2));

    // 2. Determine award flight option
    const verifiedAward = bestCashOffer?.verifiedAwardOffer || bestCashOffer?.awardInventory?.offers?.[0] || null;
    const benchmark = getRouteAwardBenchmark(origin, destination, cabin);
    const awardProgram = verifiedAward?.program?.name || benchmark.program;
    const pointsPerPerson = verifiedAward?.pointsRequired ? Number(verifiedAward.pointsRequired) : benchmark.pointsRequired;
    const taxesPerPerson = verifiedAward?.taxesAndFees?.amount !== undefined ? Number(verifiedAward.taxesAndFees.amount) : benchmark.taxesAndFees;

    const totalPointsRequired = pointsPerPerson * travelers;
    const totalAwardTaxes = taxesPerPerson * travelers;

    // 3. User balance check if authenticated
    let userBalance = 0;
    let monthlySpend = 1000;
    let cardEarningRate = 1.0;
    let contributingCardName = 'Spanish Rewards Card';

    if (userId) {
      try {
        const userBalances = await walletRepository.findByUserId(userId);
        const matchBal = userBalances.find((b) => b.program?.toLowerCase() === awardProgram.toLowerCase());
        const userCards = await cardsRepository.findByUserId(userId);
        const cardMatch = userCards.find((c) => c.rewardsProgram?.toLowerCase() === awardProgram.toLowerCase());

        userBalance = matchBal ? Number(matchBal.balance) || 0 : (cardMatch ? Number(cardMatch.demoBalance) || 0 : 0);
        if (cardMatch) {
          monthlySpend = Number(cardMatch.estimatedMonthlySpend) || 1000;
          contributingCardName = cardMatch.nickname || cardMatch.cardName;
          const prod = findCardProductById(cardMatch.cardProductId);
          cardEarningRate = prod?.defaultEarningRate || 1.0;
        }
      } catch (err) {
        logger.warn('Failed to fetch user balance for savings plan', { error: err.message });
      }
    }

    const pointsShortfall = Math.max(0, totalPointsRequired - userBalance);
    const hasEnoughPoints = userBalance >= totalPointsRequired;

    // Accumulation timeline
    const monthlyPointsEarning = Math.round(monthlySpend * cardEarningRate);
    const monthsToAccumulate = pointsShortfall > 0 && monthlyPointsEarning > 0
      ? Math.ceil(pointsShortfall / monthlyPointsEarning)
      : 0;

    // 4. Genuine alternative routing options
    const alternatives = (AIRPORT_ALTERNATIVES[destination] || AIRPORT_ALTERNATIVES[origin] || []).map((alt) => ({
      ...alt,
      type: 'airport_gateway_alternative',
    }));

    // 5. Actionable next recommendation
    let nextAction = 'BOOK_CASH';
    let actionTitle = 'Book Cash Fare';
    let actionReason = '';

    if (hasEnoughPoints && totalAwardTaxes <= budget) {
      nextAction = 'BOOK_AWARD';
      actionTitle = 'Redeem Award Points';
      actionReason = `You have enough points (${userBalance.toLocaleString()} pts) in ${awardProgram}. Award taxes of €${totalAwardTaxes} are within your €${budget} budget, saving you €${(totalCashFare - totalAwardTaxes).toFixed(2)} vs cash.`;
    } else if (isWithinBudget) {
      nextAction = 'BOOK_CASH';
      actionTitle = 'Book Cash Fare Now';
      actionReason = `The lowest available cash fare (€${totalCashFare.toFixed(2)}) is completely within your €${budget.toFixed(2)} budget (leaves €${budgetDifference.toFixed(2)} remaining).`;
    } else if (pointsShortfall > 0 && monthsToAccumulate <= 3 && monthsToAccumulate > 0) {
      nextAction = 'ACCUMULATE_POINTS';
      actionTitle = `Accumulate Points on ${contributingCardName}`;
      actionReason = `Cash fare (€${totalCashFare.toFixed(2)}) exceeds your €${budget} budget. You can bridge your ${pointsShortfall.toLocaleString()} points shortfall in ~${monthsToAccumulate} month${monthsToAccumulate > 1 ? 's' : ''} with your estimated spending.`;
    } else {
      nextAction = 'MONITOR_PRICE';
      actionTitle = 'Monitor Price & Set Fare Alert';
      actionReason = `The cash fare of €${totalCashFare.toFixed(2)} exceeds your budget by €${Math.abs(budgetDifference).toFixed(2)}. Monitor for airline sales or consider alternative airport routing.`;
    }

    return {
      destination,
      origin,
      travelers,
      budget,
      currency: planInput.currency || 'EUR',
      cabin,
      flightSummary: {
        totalCashFare,
        perPersonCash,
        carrier,
        isWithinBudget,
        budgetDifference,
        dataSource: bestCashOffer?.dataSource || 'duffel_live',
      },
      awardOption: {
        program: awardProgram,
        currency: benchmark.currency,
        totalPointsRequired,
        pointsPerPerson,
        totalAwardTaxes,
        taxesPerPerson,
        userCurrentBalance: userBalance,
        hasEnoughPoints,
        pointsShortfall,
        estimatedAccumulationMonths: monthsToAccumulate,
        monthlyAccumulationRate: monthlyPointsEarning,
        contributingCard: contributingCardName,
        isVerifiedAvailability: Boolean(verifiedAward),
      },
      alternatives,
      nextAction: {
        action: nextAction,
        title: actionTitle,
        reason: actionReason,
      },
      assumptionsAndMissingData: [
        `Cash fare reflects actual flight search result (${bestCashOffer ? 'via live provider/demo' : 'fixture'}); airfares fluctuate continuously.`,
        `Award requirement of ${totalPointsRequired.toLocaleString()} points is based on ${verifiedAward ? 'verified live inventory' : 'standard airline saver chart benchmark'}.`,
        'Accumulation timeline assumes regular organic monthly spending without late payment interest or fees.',
        'No predictive price guarantee is made.',
      ],
    };
  }
}

export const recommendationsService = new RecommendationsService();
