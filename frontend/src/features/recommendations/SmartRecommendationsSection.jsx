import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingDown,
  CreditCard,
  Target,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Compass,
  Coins,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getBestTimeToBook,
  saveFareSnapshot,
  getBestCardAndRewards,
  getSmartTripSavingsPlan,
} from '../../services/recommendationService';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function SmartRecommendationsSection({ onOpenFlightSearch, onOpenBookingModal }) {
  const { user, isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('timing'); // 'timing' | 'cards' | 'plan'

  // ==========================================
  // 1. BEST TIME TO BOOK STATE
  // ==========================================
  const [timingOrigin, setTimingOrigin] = useState('MAD');
  const [timingDest, setTimingDest] = useState('JFK');
  const [timingDate, setTimingDate] = useState('2026-11-20');
  const [timingPrice, setTimingPrice] = useState('420');
  const [timingTarget, setTimingTarget] = useState('380');
  const [timingCabin, setTimingCabin] = useState('economy');
  const [timingResult, setTimingResult] = useState(null);
  const [timingLoading, setTimingLoading] = useState(false);
  const [timingError, setTimingError] = useState('');
  const [snapshotSavedMsg, setSnapshotSavedMsg] = useState('');

  // ==========================================
  // 2. BEST CARD & REWARDS STATE
  // ==========================================
  const [cardFlightFare, setCardFlightFare] = useState('750');
  const [cardOrigin, setCardOrigin] = useState('MAD');
  const [cardDest, setCardDest] = useState('MIA');
  const [cardCabin, setCardCabin] = useState('business');
  const [cardProgram, setCardProgram] = useState('Iberia Plus');
  const [cardPointsReq, setCardPointsReq] = useState('42500');
  const [cardTaxes, setCardTaxes] = useState('110');
  const [cardResult, setCardResult] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  // ==========================================
  // 3. SMART TRIP SAVINGS PLAN STATE
  // ==========================================
  const [planOrigin, setPlanOrigin] = useState('MAD');
  const [planDest, setPlanDest] = useState('MIA');
  const [planDate, setPlanDate] = useState('2026-11-20');
  const [planTravelers, setPlanTravelers] = useState(1);
  const [planBudget, setPlanBudget] = useState('600');
  const [planCabin, setPlanCabin] = useState('economy');
  const [planResult, setPlanResult] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

  // Initial load
  useEffect(() => {
    handleAnalyzeTiming();
    if (isAuthenticated) {
      handleAnalyzeCard();
    }
    handleGeneratePlan();
  }, [isAuthenticated]);

  // Handler 1: Best Time to Book
  const handleAnalyzeTiming = async () => {
    try {
      setTimingLoading(true);
      setTimingError('');
      setSnapshotSavedMsg('');
      const data = await getBestTimeToBook({
        origin: timingOrigin,
        destination: timingDest,
        departureDate: timingDate,
        currentPrice: Number(timingPrice) || 420,
        targetPrice: timingTarget ? Number(timingTarget) : undefined,
        cabin: timingCabin,
      });
      setTimingResult(data);
    } catch (err) {
      setTimingError(err.message || 'Failed to analyze best time to book.');
    } finally {
      setTimingLoading(false);
    }
  };

  const handleSaveSnapshotOnly = async () => {
    try {
      setTimingLoading(true);
      await saveFareSnapshot({
        origin: timingOrigin,
        destination: timingDest,
        departureDate: timingDate,
        price: Number(timingPrice) || 420,
        targetPrice: timingTarget ? Number(timingTarget) : undefined,
        cabin: timingCabin,
        currency: 'EUR',
        dataSource: 'duffel_live',
      });
      setSnapshotSavedMsg('Target price snapshot tracked successfully.');
      handleAnalyzeTiming();
    } catch (err) {
      setTimingError(err.message || 'Failed to save snapshot.');
    } finally {
      setTimingLoading(false);
    }
  };

  // Handler 2: Best Card Recommendation
  const handleAnalyzeCard = async () => {
    if (!isAuthenticated) return;
    try {
      setCardLoading(true);
      setCardError('');
      const data = await getBestCardAndRewards({
        cashFare: Number(cardFlightFare) || 750,
        origin: cardOrigin,
        destination: cardDest,
        cabin: cardCabin,
        awardProgram: cardProgram,
        pointsRequired: Number(cardPointsReq) || 42500,
        awardTaxesAndFees: Number(cardTaxes) || 110,
      });
      setCardResult(data);
    } catch (err) {
      setCardError(err.message || 'Failed to analyze card recommendation.');
    } finally {
      setCardLoading(false);
    }
  };

  // Handler 3: Smart Trip Savings Plan
  const handleGeneratePlan = async () => {
    try {
      setPlanLoading(true);
      setPlanError('');
      const data = await getSmartTripSavingsPlan({
        origin: planOrigin,
        destination: planDest,
        departureDate: planDate,
        travelers: Number(planTravelers) || 1,
        budget: Number(planBudget) || 600,
        cabin: planCabin,
      });
      setPlanResult(data);
    } catch (err) {
      setPlanError(err.message || 'Failed to generate savings plan.');
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('timing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'timing'
              ? 'bg-[#073B68] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>1. Best Time to Book</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-[#073B68] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>2. Best Card & Rewards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('plan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'plan'
              ? 'bg-[#073B68] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4 text-cyan-400" />
          <span>3. Smart Trip Savings Plan</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* FEATURE 1: BEST TIME TO BOOK */}
      {/* ========================================================= */}
      {activeSubTab === 'timing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#073B68]" />
                  <span>Fare Snapshot & Target Price Tracking</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set your target airfare. We compare live Duffel fares against recorded snapshots and booking window heuristics.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 self-start sm:self-center">
                HISTORICAL SNAPSHOTS & TARGET HEURISTICS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Origin</label>
                <input
                  type="text"
                  value={timingOrigin}
                  onChange={(e) => setTimingOrigin(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="MAD"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Destination</label>
                <input
                  type="text"
                  value={timingDest}
                  onChange={(e) => setTimingDest(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="JFK"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Departure Date</label>
                <input
                  type="date"
                  value={timingDate}
                  onChange={(e) => setTimingDate(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Current Fare (€)</label>
                <input
                  type="number"
                  value={timingPrice}
                  onChange={(e) => setTimingPrice(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="420"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-amber-700 block mb-1">Target Price (€)</label>
                <input
                  type="number"
                  value={timingTarget}
                  onChange={(e) => setTimingTarget(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-amber-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  placeholder="380"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleAnalyzeTiming}
                  disabled={timingLoading}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#073B68] text-white text-xs font-bold hover:bg-[#062c4f] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {timingLoading ? 'Checking...' : 'Evaluate'}
                </button>
              </div>
            </div>

            {snapshotSavedMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{snapshotSavedMsg}</span>
              </div>
            )}
            {timingError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {timingError}
              </div>
            )}
          </div>

          {/* Analysis Results Card */}
          {timingResult && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                      timingResult.action === 'BOOK_NOW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {timingResult.action === 'BOOK_NOW' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Recommendation
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          timingResult.action === 'BOOK_NOW'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {timingResult.recommendation}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {timingResult.rationale}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleSaveSnapshotOnly}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Track Target Alert
                  </button>
                  {onOpenFlightSearch && (
                    <button
                      type="button"
                      onClick={() => onOpenFlightSearch(timingOrigin, timingDest, timingCabin)}
                      className="px-4 py-2 rounded-xl bg-[#073B68] hover:bg-[#062c4f] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Search Live Duffel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Data Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Current Live Fare:</span>
                  <span className="font-bold text-slate-900 text-base">{formatEuro(timingResult.currentPrice)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Your Target Price:</span>
                  <span className="font-bold text-amber-700 text-base">
                    {timingResult.targetPrice ? formatEuro(timingResult.targetPrice) : 'None set'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Days to Departure:</span>
                  <span className="font-bold text-slate-900 text-base">
                    {timingResult.daysUntilDeparture} days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Tracked Snapshots:</span>
                  <span className="font-bold text-slate-900 text-base">
                    {timingResult.historicalSnapshots.totalTracked} recorded
                  </span>
                </div>
              </div>

              {/* Disclosures & Assumptions */}
              <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Calculation Transparency</span>
                </div>
                <p>{timingResult.dataTransparency}</p>
                <p className="italic text-slate-500">{timingResult.disclosure}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FEATURE 2: BEST CARD & REWARDS RECOMMENDATION */}
      {/* ========================================================= */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!isAuthenticated ? (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-900">Sign in to view your Card & Rewards Recommendation</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                We analyze your authenticated Spain Cards & Rewards Wallet to calculate exact Phase 14 savings and identify which card to swipe for future spending.
              </p>
            </div>
          ) : (
            <>
              {/* Configuration Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#073B68]" />
                      <span>Compare Flight Against Your Saved Cards & Rewards</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluates your authenticated cards and points balances using Phase 14 formulas. Keeps different rewards currencies isolated.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-center">
                    AUTHENTICATED USER WALLET ISOLATION
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cash Fare (€)</label>
                    <input
                      type="number"
                      value={cardFlightFare}
                      onChange={(e) => setCardFlightFare(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                      placeholder="750"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Route</label>
                    <input
                      type="text"
                      value={`${cardOrigin}-${cardDest}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        if (parts[0]) setCardOrigin(parts[0].trim().toUpperCase());
                        if (parts[1]) setCardDest(parts[1].trim().toUpperCase());
                      }}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                      placeholder="MAD-MIA"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cabin</label>
                    <select
                      value={cardCabin}
                      onChange={(e) => setCardCabin(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                    >
                      <option value="economy">Economy</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Program</label>
                    <input
                      type="text"
                      value={cardProgram}
                      onChange={(e) => setCardProgram(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                      placeholder="Iberia Plus"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Points Needed</label>
                    <input
                      type="number"
                      value={cardPointsReq}
                      onChange={(e) => setCardPointsReq(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                      placeholder="42500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAnalyzeCard}
                      disabled={cardLoading}
                      className="w-full py-2 px-3 rounded-xl bg-[#073B68] text-white text-xs font-bold hover:bg-[#062c4f] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cardLoading ? 'Evaluating...' : 'Recalculate'}
                    </button>
                  </div>
                </div>

                {cardError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {cardError}
                  </div>
                )}
              </div>

              {/* Recommendation Card */}
              {cardResult && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  {/* Top Verdict Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Phase 14 Savings Analysis */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Phase 14 Savings Evaluation
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {cardResult.savingsAnalysis.recommendationVerdict}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-black text-emerald-600">
                          {formatEuro(cardResult.savingsAnalysis.estimatedCashSavings)} Saved
                        </div>
                        <div className="text-xs text-slate-500">
                          Redemption value: <strong className="text-slate-800">{cardResult.savingsAnalysis.centsPerPoint}¢/pt</strong> (Benchmark: 1.3¢/pt)
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                        {cardResult.savingsAnalysis.verdictReason}
                      </p>
                    </div>

                    {/* Right: Best Card for Future Spending */}
                    <div className="p-4 rounded-2xl bg-[#073B68] text-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                          Recommended Card for Future Spend
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-200">
                          {cardResult.cardRecommendation.label}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-cyan-300" />
                          <span>{cardResult.cardRecommendation.recommendedCard?.cardName}</span>
                        </div>
                        <div className="text-xs text-cyan-200/90 mt-0.5">
                          Earning rate: {cardResult.cardRecommendation.earningRateAssumption}
                        </div>
                      </div>

                      {cardResult.pointsShortfall > 0 ? (
                        <div className="text-xs text-slate-200 border-t border-white/10 pt-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Points Shortfall:</span>
                            <strong className="text-amber-300">{formatPoints(cardResult.pointsShortfall)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Spend Needed to Bridge:</span>
                            <strong className="text-white">{formatEuro(cardResult.cardRecommendation.spendToBridgeShortfall)}</strong>
                          </div>
                          {cardResult.cardRecommendation.estimatedMonthsToBridge && (
                            <div className="flex justify-between text-cyan-200">
                              <span>Estimated Timeline:</span>
                              <strong>~{cardResult.cardRecommendation.estimatedMonthsToBridge} month(s)</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-semibold">
                          You have enough points in your wallet ({formatPoints(cardResult.userCurrentBalance)}) to book this award right now!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Disclaimers & Currency Isolation */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Currency Isolation & Demo Disclosures</span>
                    </div>
                    {cardResult.disclaimers.map((disc, idx) => (
                      <p key={idx} className="text-amber-800 text-[11px] leading-relaxed">
                        • {disc}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FEATURE 3: SMART TRIP SAVINGS PLAN */}
      {/* ========================================================= */}
      {activeSubTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Plan Input Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#073B68]" />
                  <span>Smart Trip Savings Plan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set destination, dates, travelers, and cash budget. We query live flight search, compare budget, and provide a personalized next action.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 self-start sm:self-center">
                GENUINE FLIGHT OFFERS & TIMELINE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Origin</label>
                <input
                  type="text"
                  value={planOrigin}
                  onChange={(e) => setPlanOrigin(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="MAD"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Destination</label>
                <input
                  type="text"
                  value={planDest}
                  onChange={(e) => setPlanDest(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="MIA"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Departure Date</label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Travelers</label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={planTravelers}
                  onChange={(e) => setPlanTravelers(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-cyan-800 block mb-1">Total Budget (€)</label>
                <input
                  type="number"
                  value={planBudget}
                  onChange={(e) => setPlanBudget(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-cyan-300 bg-cyan-50/40 text-cyan-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#073B68]"
                  placeholder="600"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  className="w-full py-2 px-3 rounded-xl bg-[#073B68] text-white text-xs font-bold hover:bg-[#062c4f] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {planLoading ? 'Planning...' : 'Generate Plan'}
                </button>
              </div>
            </div>

            {planError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {planError}
              </div>
            )}
          </div>

          {/* Plan Results */}
          {planResult && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Personalized Next Action Hero */}
              <div className="p-5 rounded-2xl bg-[#073B68] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-900">
                      RECOMMENDED ACTION: {planResult.nextAction.action}
                    </span>
                    <span className="text-xs text-cyan-200">
                      {planResult.flightSummary.isWithinBudget ? 'Within Budget' : 'Exceeds Budget'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {planResult.nextAction.title}
                  </div>
                  <p className="text-xs text-slate-200 max-w-xl">
                    {planResult.nextAction.reason}
                  </p>
                </div>

                <div className="shrink-0">
                  {onOpenFlightSearch && (
                    <button
                      type="button"
                      onClick={() => onOpenFlightSearch(planOrigin, planDest, planCabin)}
                      className="px-4 py-2.5 rounded-xl bg-white text-[#073B68] font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View Live Offers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cash vs Award Comparison Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Lowest Cash Fare</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {planResult.flightSummary.dataSource}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatEuro(planResult.flightSummary.totalCashFare)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {planResult.flightSummary.carrier} • {formatEuro(planResult.flightSummary.perPersonCash)} per traveler
                  </div>
                  <div className={`text-xs font-bold pt-1 ${planResult.flightSummary.isWithinBudget ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {planResult.flightSummary.isWithinBudget
                      ? `Leaves €${planResult.flightSummary.budgetDifference} under your €${planBudget} budget`
                      : `Exceeds budget by €${Math.abs(planResult.flightSummary.budgetDifference)}`}
                  </div>
                </div>

                {/* Award Summary & Timeline */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Points Redemption Option</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                      {planResult.awardOption.program}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-cyan-900 flex items-center gap-1.5">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <span>{formatPoints(planResult.awardOption.totalPointsRequired)}</span>
                    <span className="text-xs font-bold text-slate-500">+ {formatEuro(planResult.awardOption.totalAwardTaxes)} taxes</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Your balance: <strong>{formatPoints(planResult.awardOption.userCurrentBalance)}</strong>
                    {planResult.awardOption.pointsShortfall > 0 ? (
                      <span className="text-amber-700 font-bold ml-1">
                        (Shortfall: {formatPoints(planResult.awardOption.pointsShortfall)})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold ml-1">(Enough points available!)</span>
                    )}
                  </div>
                  {planResult.awardOption.estimatedAccumulationMonths > 0 && (
                    <div className="text-xs text-slate-500 font-medium">
                      Estimated accumulation: ~<strong>{planResult.awardOption.estimatedAccumulationMonths} month(s)</strong> via {planResult.awardOption.contributingCard}
                    </div>
                  )}
                </div>
              </div>

              {/* Supported Alternatives */}
              {planResult.alternatives?.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Verified Gateway Alternatives
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {planResult.alternatives.map((alt, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <strong className="text-slate-900 block">{alt.name}</strong>
                        <span className="text-slate-500">{alt.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions & Disclosures */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Calculation Assumptions & Missing Data</span>
                </div>
                {planResult.assumptionsAndMissingData.map((assump, idx) => (
                  <p key={idx}>• {assump}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
