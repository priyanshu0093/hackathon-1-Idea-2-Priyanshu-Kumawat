/**
 * Deterministic Points Earning & 30/60/90-Day Forecast Engine
 * Calculates conservative, expected, and optimistic models based on explicit, verified assumptions.
 */
export function calculatePointsForecast(params) {
  const {
    monthlySpend,
    rewardProgram,
    earningRate = 1.5,
    targetDestination = null,
    targetPoints = null,
    travelDate = null,
    currentPoints = 0,
  } = params;

  // 1. Conservative Model: Baseline 1.0x everyday spend rate (bills, utilities, non-bonus categories)
  const conservativeMonthly = Math.round(monthlySpend * 1.0);
  const conservative = {
    days30: conservativeMonthly,
    days60: conservativeMonthly * 2,
    days90: conservativeMonthly * 3,
    cumulativeTotal90: currentPoints + conservativeMonthly * 3,
    assumptions: [
      'Assumes baseline 1.0 point per currency unit on general bills and everyday necessities',
      'Zero category bonus multipliers applied',
      'No welcome bonuses, transfer promos, or card referral points included',
    ],
  };

  // 2. Expected Model: User-selected blended category earning rate (e.g., 1.5x - 2.0x dining, groceries, transit)
  const expectedMonthly = Math.round(monthlySpend * earningRate);
  const expected = {
    days30: expectedMonthly,
    days60: expectedMonthly * 2,
    days90: expectedMonthly * 3,
    cumulativeTotal90: currentPoints + expectedMonthly * 3,
    assumptions: [
      `Assumes user channels everyday eligible spending through card categories averaging ${earningRate}x`,
      'Assumes disciplined payment in full each billing cycle to avoid interest or penalty charges',
      'Points earned exclusively from regular, budgeted organic purchases',
    ],
  };

  // 3. Optimistic Model: Category spend optimization + periodic 25% bank-to-airline transfer bonus window
  const optimisticMonthly = Math.round(expectedMonthly * 1.25);
  const optimistic = {
    days30: optimisticMonthly,
    days60: optimisticMonthly * 2,
    days90: optimisticMonthly * 3,
    cumulativeTotal90: currentPoints + optimisticMonthly * 3,
    assumptions: [
      'Assumes maximum category bonus capture (3x-4x on dining/groceries/travel)',
      'Assumes timing transfer during a verified 20%-25% periodic transfer bonus window (e.g., Amex/Chase to Avios/Flying Blue)',
      'No manufactured spending or debt assumption',
    ],
  };

  // 4. Feasibility & Shortfall Analysis for Target Trip
  let targetFeasibility = null;
  if (targetPoints && targetPoints > 0) {
    const shortfall = Math.max(0, targetPoints - currentPoints);
    const monthlyVelocity = expectedMonthly > 0 ? expectedMonthly : 1;
    const projectedDaysToGoal = shortfall <= 0 ? 0 : Math.ceil((shortfall / monthlyVelocity) * 30);

    targetFeasibility = {
      targetPoints,
      currentPoints,
      shortfall,
      hasEnoughNow: shortfall === 0,
      projectedDaysToGoal,
      reachableIn30Days: (currentPoints + expected.days30) >= targetPoints,
      reachableIn60Days: (currentPoints + expected.days60) >= targetPoints,
      reachableIn90Days: (currentPoints + expected.days90) >= targetPoints,
      recommendation: shortfall === 0
        ? `You already have enough ${rewardProgram} balance (${currentPoints.toLocaleString()} pts) for this award flight! Check live saver availability on the official airline website.`
        : projectedDaysToGoal <= 90
        ? `At your current organic spending rate of $${monthlySpend.toLocaleString()}/mo, you are on track to cover the ${shortfall.toLocaleString()} point shortfall in approximately ${projectedDaysToGoal} days without taking on debt or buying points.`
        : `At $${monthlySpend.toLocaleString()}/mo spend, closing the ${shortfall.toLocaleString()} shortfall will take ~${projectedDaysToGoal} days. Consider pairing with a bank transfer partner rather than purchasing points at full price.`,
    };
  }

  // 5. Educational and Ethical Disclaimers
  const ethicalDisclaimers = [
    'Responsible Points Rule: Never borrow money, carry a high-interest credit card balance, or manufacture unnecessary spending solely to accumulate points.',
    'No Flight Is Free: All award redemptions require cash payment of mandatory government and airport departure taxes (typically €30 - €180 for economy, higher for premium long-haul cabins).',
    'Seat Availability Caveat: Point valuations and redemption availability are dynamic and subject to airline saver seat inventory. Booking links route directly to official airline programs.',
  ];

  return {
    inputs: {
      monthlySpend,
      rewardProgram,
      earningRate,
      targetDestination,
      travelDate,
      currentPoints,
    },
    forecasts: {
      conservative,
      expected,
      optimistic,
    },
    targetFeasibility,
    disclaimers: ethicalDisclaimers,
    calculatedAt: new Date().toISOString(),
  };
}
