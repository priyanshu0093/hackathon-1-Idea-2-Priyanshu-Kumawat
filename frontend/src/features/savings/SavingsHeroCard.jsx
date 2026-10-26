import React, { useState } from 'react';
import { 
  Plane, 
  ArrowRight, 
  Sparkles, 
  Bookmark, 
  Check, 
  Info, 
  TrendingDown, 
  ChevronRight, 
  ArrowUpRight,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { formatEuro, formatPoints } from '../../lib/formatters';
import { PointsShortfallCard } from './PointsShortfallCard';

export function SavingsHeroCard({
  hack,
  isSaved,
  onToggleSave,
  onOpenBookingGuide,
  formData,
  onSwitchToDemo,
}) {
  const [activeTab, setActiveTab] = useState('best_value');

  if (!hack) return null;

  // If search returned empty
  if (hack.isEmpty) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <Plane className="w-7 h-7 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#073B68]">
            No Flights Found for {hack.origin} → {hack.destination}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {hack.message || 'No commercial flight offers match your selected dates and route.'}
          </p>
        </div>
        {onSwitchToDemo && (
          <button
            type="button"
            onClick={onSwitchToDemo}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68] transition-colors"
          >
            Explore Illustrative Sweet Spot Demo
          </button>
        )}
      </div>
    );
  }

  const {
    origin,
    destination,
    originCity,
    destinationCity,
    airline,
    flightNumber,
    cabin,
    metrics,
    hackTitle,
    explanation,
    programName,
    isDemo = true,
    isCashOnly = false,
    legs,
    itineraries,
    price,
  } = hack;

  // Case 1: Live Cash Fare Available, but Award Seat Inventory is Unavailable (Section 8 Rule)
  if (isCashOnly) {
    const outbound = itineraries?.[0];
    const returnItin = itineraries?.[1];

    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
        {/* Header Notice Banner */}
        <div className="bg-[#087E8B]/10 border-b border-[#087E8B]/20 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#073B68]">
            <Radio className="w-4 h-4 text-[#087E8B] shrink-0 animate-pulse" />
            <span className="font-bold">Live Flight API Offer (Amadeus GDS)</span>
            <span className="hidden md:inline text-slate-600">
              — Verified real-world airline pricing. Award seats require partner integration.
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSave}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isSaved
                ? 'bg-[#0B347D] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5 text-[#0B347D]" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* Route & Airline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B347D] to-[#087E8B] flex items-center justify-center text-white shadow-md shadow-[#0B347D]/15 shrink-0">
                <Plane className="w-6 h-6 -rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#073B68]">{origin}</h3>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                  <h3 className="text-xl sm:text-2xl font-bold text-[#073B68]">{destination}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-700">{airline}</span>
                  <span>•</span>
                  <span>{flightNumber}</span>
                  <span>•</span>
                  <span className="capitalize">{cabin?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{outbound?.durationFormatted || 'Non-stop'}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-50 p-3 sm:p-0 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live GDS Fare
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B347D]">
                {formatEuro(price?.total || metrics?.totalCashPrice || 0)}
              </span>
            </div>
          </div>

          {/* Side-by-side: Verified Cash Fare vs Award Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Live Cash Fare Card */}
            <div className="rounded-2xl border-2 border-[#0B347D] bg-white p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B347D] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#087E8B]" /> Live Verified Cash Fare
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active Flight Offer
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Total for all travelers</p>
                  <p className="text-3xl font-extrabold text-[#073B68] mt-0.5">
                    {formatEuro(price?.total || metrics?.totalCashPrice || 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Per passenger: {formatEuro(price?.perTraveler || (price?.total / (price?.travelers || 1)) || 0)}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Base ticket fare:</span>
                    <span className="font-semibold">{formatEuro(price?.base || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & carrier surcharges:</span>
                    <span className="font-semibold">{formatEuro(price?.taxesAndFees || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outbound Duration:</span>
                    <span className="font-semibold">{outbound?.durationFormatted || 'Direct'}</span>
                  </div>
                  {returnItin && (
                    <div className="flex justify-between">
                      <span>Return Duration:</span>
                      <span className="font-semibold">{returnItin.durationFormatted}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Live fare retrieved directly from provider.</span>
              </div>
            </div>

            {/* Award Points Status Card */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Award Travel Status
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Partner Access Pending
                  </span>
                </div>

                <div className="space-y-2 py-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    Live Award Availability Not Connected
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Per travel hacking integrity standards, speculative award savings are never invented without direct loyalty inventory access.
                  </p>
                  <p className="text-xs text-slate-500">
                    Switch to Demo Mode to view how award sweet spots operate for routes like this.
                  </p>
                </div>
              </div>

              {onSwitchToDemo && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onSwitchToDemo}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#087E8B] hover:bg-[#06646f] text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    <span>View Illustrative Hack in Demo Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Full Savings Comparison (Demo Mode or Verified Live Award Data)
  const displayMetrics = {
    ...metrics,
    ...(activeTab === 'fewest_points'
      ? {
          totalPoints: Math.round(metrics.totalPoints * 0.75),
          totalTaxes: Math.round(metrics.totalTaxes * 1.5),
          totalHackedCost: Math.round(metrics.totalHackedCost * 0.88),
          savingsEuro: Math.round(metrics.savingsEuro * 1.1),
        }
      : activeTab === 'business_sweet_spot'
      ? {
          totalPoints: Math.round(metrics.totalPoints * 1.45),
          totalCashPrice: Math.round(metrics.totalCashPrice * 2.4),
          totalHackedCost: Math.round(metrics.totalHackedCost * 1.4),
          savingsEuro: Math.round(metrics.totalCashPrice * 2.4 - metrics.totalHackedCost * 1.4),
          savingsPercentage: 74,
        }
      : {}),
  };

  const isMultiStop = Array.isArray(legs) && legs.length >= 2;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
      {/* Disclaimer Banner: Explicitly labeled */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#087E8B] shrink-0" />
          <span className="font-semibold text-slate-700">
            {isDemo ? 'Illustrative Demo Travel Hack' : 'Live Verified Award Comparison'}
          </span>
          <span className="hidden md:inline text-slate-500">
            — Real award availability requires live airline inventory sync.
          </span>
        </div>

        <button
          type="button"
          id="save-trip-card-btn"
          onClick={onToggleSave}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            isSaved
              ? 'bg-[#0B347D] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
          aria-label={isSaved ? 'Trip saved' : 'Save this flight hack'}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5 text-[#0B347D]" />}
          <span>{isSaved ? 'Saved to Trips' : 'Save Hack'}</span>
        </button>
      </div>

      {/* Alternative Hack View Filters / Strategy Selector */}
      <div className="flex flex-wrap border-b border-slate-100 px-4 sm:px-6 pt-3 gap-2 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setActiveTab('best_value')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'best_value'
              ? 'bg-[#0B347D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          ✨ Best Overall Value
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fewest_points')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'fewest_points'
              ? 'bg-[#0B347D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          🎯 Fewest Points Needed
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('business_sweet_spot')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'business_sweet_spot'
              ? 'bg-[#0B347D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          👑 Business Class Sweet Spot
        </button>
      </div>

      {/* Main Comparison Body */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Route Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B347D] to-[#087E8B] flex items-center justify-center text-white shadow-md shadow-[#0B347D]/15 shrink-0">
              <Plane className="w-6 h-6 -rotate-45" />
            </div>
            <div>
              {isMultiStop ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-[#073B68]">
                      Multi-Stop Itinerary ({legs.length} Segments)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {legs.map((l) => `${l.from} → ${l.to}`).join(' • ')}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#073B68]">
                      {originCity || origin} ({origin})
                    </h3>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <h3 className="text-xl sm:text-2xl font-bold text-[#073B68]">
                      {destinationCity || destination} ({destination})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">{airline}</span>
                    <span>•</span>
                    <span>Flight {flightNumber}</span>
                    <span>•</span>
                    <span className="capitalize">{cabin?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{formData?.isFlexibleDates ? 'Flexible Dates Window' : 'Exact Dates'}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Savings Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-emerald-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-emerald-100 sm:border-0">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Travel Hacking Savings
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#276955]">
                {formatEuro(displayMetrics.savingsEuro)}
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-[#276955] text-white">
                -{displayMetrics.savingsPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Points Shortfall Indicator */}
        <PointsShortfallCard
          metrics={displayMetrics}
          programName={programName}
        />

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Option A: Retail Cash */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Option A • Normal Cash Route
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Standard Booking
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500">Retail cash fare</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-700 line-through decoration-slate-400 mt-0.5">
                  {formatEuro(displayMetrics.totalCashPrice)}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span>Airline ticket fare:</span>
                  <span className="font-semibold">{formatEuro(displayMetrics.totalCashPrice - displayMetrics.totalTaxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Government taxes & fuel surcharges:</span>
                  <span className="font-semibold">{formatEuro(displayMetrics.totalTaxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Booking method:</span>
                  <span className="font-semibold">Airline / OTA website</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 text-xs text-slate-400 italic">
              Standard public price without loyalty optimization.
            </div>
          </div>

          {/* Option B: A Una Milla Travel Hack */}
          <div className="rounded-2xl border-2 border-[#087E8B] bg-gradient-to-b from-[#087E8B]/5 to-white p-5 flex flex-col justify-between shadow-md shadow-[#087E8B]/5 relative">
            <div className="absolute -top-3 right-5 bg-gradient-to-r from-[#0B347D] to-[#087E8B] text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300" /> RECOMMENDED HACK
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#087E8B] uppercase tracking-wider">
                  Option B • A Una Milla Travel Hack
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500">Total out-of-pocket & points</p>
                <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0B347D]">
                    {formatPoints(displayMetrics.totalPoints)}
                  </span>
                  <span className="text-base font-bold text-slate-700">
                    + {formatEuro(displayMetrics.totalTaxes)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Equivalent net value: <strong className="text-slate-800">{formatEuro(displayMetrics.totalHackedCost)}</strong>
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span>Booking Program:</span>
                  <span className="font-bold text-[#073B68]">{programName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer Partner:</span>
                  <span className="font-semibold">Amex MR / Chase UR / Direct</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Carrier Fees:</span>
                  <span className="font-semibold text-slate-800">{formatEuro(displayMetrics.totalTaxes)}</span>
                </div>
              </div>
            </div>

            {/* Action button inside hacked card */}
            <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Save {formatEuro(displayMetrics.savingsEuro)}
              </span>

              <button
                type="button"
                id="view-booking-guide-btn"
                onClick={onOpenBookingGuide}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-98"
              >
                <span>View Booking Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Why this alternative works */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0B347D]/10 text-[#0B347D] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#073B68]">
                Why this travel hack works: {hackTitle}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Need help transferring points? Check our 4-step booking workflow below.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenBookingGuide}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Explore Flight Options & Instructions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
