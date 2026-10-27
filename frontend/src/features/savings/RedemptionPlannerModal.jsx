import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calculator,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Coins,
  ArrowRight,
  TrendingUp,
  Info,
  Layers,
  Plane,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatEuro, formatPoints } from '../../lib/formatters';
import { calculateSmartSavings } from '../../lib/calculator';
import { saveRedemptionPlanApi } from '../../services/redemptionService';

const POPULAR_PROGRAMS = [
  'Iberia Plus',
  'British Airways Executive Club',
  'Air India Flying Returns',
  'Virgin Atlantic Flying Club',
  'Flying Blue (Air France/KLM)',
  'Emirates Skywards',
  'Qatar Airways Privilege Club',
  'American Airlines AAdvantage',
  'Chase Ultimate Rewards',
  'Amex Membership Rewards',
];

export function RedemptionPlannerModal({
  isOpen,
  onClose,
  flightOffer,
  onOpenSignIn,
}) {
  const { user, isAuthenticated } = useAuth();

  // Extract initial values from the selected flight offer
  const cashFare =
    flightOffer?.price?.total ||
    flightOffer?.offers?.cashPrice ||
    flightOffer?.cashPrice ||
    400;
  const cashCurrency = flightOffer?.price?.currency || 'EUR';
  const origin = flightOffer?.origin || 'MAD';
  const destination = flightOffer?.destination || 'JFK';
  const carrier = flightOffer?.airline?.name || flightOffer?.airline || 'Airline';
  const cabin = flightOffer?.cabinClass || flightOffer?.cabin || 'economy';
  const departureDate = flightOffer?.departureDate || new Date().toISOString().split('T')[0];
  const returnDate = flightOffer?.returnDate || null;
  const dataSource = flightOffer?.dataSource || (flightOffer?.isDemo ? 'demo' : 'live');

  // Planner inputs
  const [selectedProgram, setSelectedProgram] = useState(POPULAR_PROGRAMS[0]);
  const [pointsRequired, setPointsRequired] = useState('17000');
  const [awardTaxes, setAwardTaxes] = useState('65');
  const [valuationCents, setValuationCents] = useState(1.3);
  const [userBalance, setUserBalance] = useState('0');
  const [notes, setNotes] = useState('');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Reactive Smart Savings calculation
  const calculation = calculateSmartSavings({
    cashFare: Number(cashFare),
    cashCurrency,
    pointsRequired: Number(pointsRequired),
    awardTaxesAndFees: Number(awardTaxes),
    awardCurrency: cashCurrency,
    userConfiguredValuePerPoint: Number(valuationCents) / 100,
    loyaltyProgram: selectedProgram,
    userPointsBalance: Number(userBalance),
  });

  useEffect(() => {
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  }, [pointsRequired, awardTaxes, valuationCents, selectedProgram]);

  if (!isOpen) return null;

  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      onOpenSignIn?.();
      return;
    }

    if (!calculation.canCalculate) {
      setSaveErrorMsg('Please fill in required points and taxes before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveErrorMsg('');
      await saveRedemptionPlanApi({
        origin,
        destination,
        cabin,
        departureDate,
        returnDate,
        carrier,
        cashFare: Number(cashFare),
        cashCurrency,
        pointsRequired: Number(pointsRequired),
        awardTaxesAndFees: Number(awardTaxes),
        awardCurrency: cashCurrency,
        userConfiguredValuePerPoint: Number(valuationCents) / 100,
        loyaltyProgram: selectedProgram,
        userPointsBalance: Number(userBalance),
        notes,
      });
      setSaveSuccessMsg('Redemption plan saved to your account!');
    } catch (err) {
      setSaveErrorMsg(err.message || 'Failed to save redemption plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#073B68] to-[#0B347D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Smart Savings & Redemption Planner</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  Phase 14 Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Compare verified cash retail fares against award points, mandatory taxes, and opportunity cost.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Redemption Planner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flight Offer Context Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-extrabold text-[#073B68] text-sm">
              <Plane className="w-4 h-4 text-[#087E8B]" />
              <span>{origin} → {destination}</span>
            </div>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-semibold">{carrier}</span>
            <span className="text-slate-400">•</span>
            <span className="capitalize text-slate-600">{cabin}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{departureDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              dataSource === 'live'
                ? 'bg-emerald-100 text-[#276955] border border-emerald-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {dataSource === 'live' ? 'Live Offer (Duffel API)' : 'Illustrative Demo Fare'}
            </span>
            <span className="font-extrabold text-[#0B347D] text-sm">
              Retail Cash: {formatEuro(cashFare)}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: User Input Form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Coins className="w-4 h-4 text-[#087E8B]" />
                  <span>Enter Award Ticket Parameters</span>
                </div>

                {/* Loyalty Program Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loyalty Program
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none font-medium"
                  >
                    {POPULAR_PROGRAMS.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Points Required */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Award Points Required
                    </label>
                    <span className="text-[10px] text-slate-400">Saver bucket</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="500"
                    value={pointsRequired}
                    onChange={(e) => setPointsRequired(e.target.value)}
                    placeholder="e.g. 17000"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none font-semibold text-[#073B68]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Input the off-peak or standard points cost quoted by the airline.
                  </p>
                </div>

                {/* Award Taxes & Mandatory Surcharges */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Award Taxes & Carrier Fees ({cashCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={awardTaxes}
                    onChange={(e) => setAwardTaxes(e.target.value)}
                    placeholder="e.g. 65.00"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none font-semibold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Out-of-pocket government taxes and airline fuel surcharges required on award tickets.
                  </p>
                </div>

                {/* Points Valuation (Cents per Point) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Opportunity Cost Valuation: <strong className="text-[#087E8B]">{valuationCents} ¢/pt</strong>
                    </label>
                    <span className="text-[10px] text-slate-400">Default: 1.30 ¢</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={valuationCents}
                    onChange={(e) => setValuationCents(parseFloat(e.target.value))}
                    className="w-full accent-[#087E8B] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    What you consider 1 point worth in euros (1.30 ¢/pt is standard for flexible transferable currencies).
                  </p>
                </div>

                {/* Current Program Balance */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Current Program Balance (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={userBalance}
                    onChange={(e) => setUserBalance(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Transfer from Amex during 20% bonus promo"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Comparison & Results */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">User-Entered Estimate Disclosure</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Award requirements are self-reported estimates. A Una Milla never fabricates live award space; please verify saver seat availability on {selectedProgram}&apos;s official website before booking.
                  </p>
                </div>
              </div>

              {!calculation.canCalculate ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Unable to Calculate Savings</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {calculation.reason || 'Please provide positive values for cash fare and award points required.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recommendation Callout */}
                  <div className={`p-4 rounded-2xl border ${
                    calculation.isAwardCheaper
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-200 text-amber-950'
                  } space-y-1`}>
                    <div className="flex items-center gap-2">
                      {calculation.isAwardCheaper ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-extrabold uppercase tracking-wide">
                        {calculation.isAwardCheaper ? 'Smart Recommendation: Award Redemption Superior' : 'Smart Recommendation: Pay Retail Cash'}
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed pl-6">
                      {calculation.recommendation}
                    </p>
                  </div>

                  {/* 4-Tile Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Net Cash Savings */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Net Cash Savings
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl sm:text-2xl font-black ${
                          calculation.isAwardCheaper ? 'text-[#276955]' : 'text-slate-600'
                        }`}>
                          {formatEuro(calculation.cashSavings)}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          calculation.isAwardCheaper ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {calculation.savingsPercentage}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        After deducting points valuation & taxes
                      </span>
                    </div>

                    {/* Effective Value Per Point */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Effective Value Per Point
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-black text-[#0B347D]">
                          {calculation.valuePerPointCents} ¢
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          calculation.valuePerPointCents >= calculation.valuationCents
                            ? 'bg-blue-100 text-[#0B347D]'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          Baseline: {calculation.valuationCents}¢
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        (Cash Fare - Taxes) / Points
                      </span>
                    </div>

                    {/* Value of Points Used */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Opportunity Cost of Points
                      </span>
                      <span className="text-lg font-bold text-slate-800 block">
                        {formatEuro(calculation.valueOfPointsUsed)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatPoints(calculation.pointsRequired)} pts @ {calculation.valuationCents}¢/pt
                      </span>
                    </div>

                    {/* Out-of-Pocket Award Taxes */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Out-of-Pocket Cash (Taxes)
                      </span>
                      <span className="text-lg font-bold text-slate-800 block">
                        {formatEuro(calculation.awardTaxesAndFees)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Mandatory government & fuel fees
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Breakdown Table */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#087E8B]" />
                      <span>Mathematical Breakdown</span>
                    </span>

                    <div className="space-y-1.5 text-slate-600 font-mono text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between">
                        <span>Retail Cash Fare:</span>
                        <span className="font-bold text-slate-900">{formatEuro(calculation.cashFare)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>- Mandatory Award Taxes:</span>
                        <span>-{formatEuro(calculation.awardTaxesAndFees)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>- Value of Points Used ({formatPoints(calculation.pointsRequired)} × {calculation.userConfiguredValuePerPoint}):</span>
                        <span>-{formatEuro(calculation.valueOfPointsUsed)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 text-xs font-bold">
                        <span className="text-slate-900">= Net Cash Savings:</span>
                        <span className={calculation.isAwardCheaper ? 'text-[#276955]' : 'text-slate-700'}>
                          {formatEuro(calculation.cashSavings)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1">
                      Formula: <code>cash_savings = cash_fare - award_taxes - (points × value_per_point)</code>
                    </div>
                  </div>

                  {/* Assumptions List */}
                  <div className="space-y-1 text-slate-500 text-[11px]">
                    <span className="font-bold text-slate-700">Explicit Model Assumptions:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {calculation.assumptions?.map((assump, idx) => (
                        <li key={idx}>{assump}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {saveSuccessMsg}
              </span>
            )}
            {saveErrorMsg && (
              <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {saveErrorMsg}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              Close
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={isSaving || !calculation.canCalculate}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Plan...' : 'Save Redemption Plan'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignIn?.();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Sign In to Save Plan</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
