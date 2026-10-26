import React from 'react';
import { Coins, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { formatPoints, formatEuro } from '../../lib/formatters';

export function PointsShortfallCard({ metrics, programName }) {
  if (!metrics || !metrics.canCalculate) return null;

  const {
    userPointsBalance,
    totalPoints,
    pointsShortfall,
    hasShortfall,
    estimatedShortfallCostEuro,
  } = metrics;

  // If user entered no points balance, show friendly informative status
  if (userPointsBalance === 0) {
    return (
      <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/90 flex items-start gap-3 text-xs">
        <Coins className="w-4 h-4 text-[#087E8B] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">
            Total Award Requirement: {formatPoints(totalPoints)}
          </span>
          <p className="text-slate-600 mt-0.5">
            You can earn or transfer points 1:1 from credit card partners like Amex Membership Rewards or Chase Ultimate Rewards into {programName}.
          </p>
        </div>
      </div>
    );
  }

  // If user has enough points
  if (!hasShortfall) {
    const surplus = userPointsBalance - totalPoints;
    return (
      <div className="rounded-xl p-3.5 bg-emerald-50/80 border border-emerald-200 text-xs flex items-start gap-3">
        <CheckCircle className="w-4 h-4 text-[#276955] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-900">
            Your points balance covers this entire ticket!
          </span>
          <p className="text-emerald-800 mt-0.5">
            You hold {formatPoints(userPointsBalance)}. This ticket requires {formatPoints(totalPoints)}, leaving you with {formatPoints(surplus)} remaining.
          </p>
        </div>
      </div>
    );
  }

  // If there is a shortfall
  return (
    <div className="rounded-xl p-3.5 bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
      <div className="flex items-center gap-2 text-amber-900 font-bold">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Points Shortfall: You need {formatPoints(pointsShortfall)} more</span>
      </div>
      <p className="text-amber-800 leading-relaxed pl-6">
        You currently have {formatPoints(userPointsBalance)} of the required {formatPoints(totalPoints)}.
        {estimatedShortfallCostEuro > 0 && (
          <span>
            {' '}Estimated cost to purchase remaining miles during typical sales: ~<strong>{formatEuro(estimatedShortfallCostEuro)}</strong>.
          </span>
        )}
      </p>
    </div>
  );
}
