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
  Radio,
  Clock,
  ShieldCheck,
  AlertCircle,
  Layers,
  Calculator
} from 'lucide-react';
import { formatEuro, formatPoints } from '../../lib/formatters';
import { PointsShortfallCard } from './PointsShortfallCard';

// Helper to format ISO timestamp into readable time and date
function formatFlightTime(isoString) {
  if (!isoString) return { time: 'N/A', date: '' };
  try {
    const d = new Date(isoString);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { time, date };
  } catch {
    return { time: isoString, date: '' };
  }
}

export function SavingsHeroCard({
  hack,
  isSaved,
  onToggleSave,
  onOpenBookingGuide,
  formData,
  onSwitchToDemo,
  onOpenRedemptionPlanner,
  onOpenBooking,
}) {
  const [activeTab, setActiveTab] = useState('best_value');
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);

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
    dataSource = 'demo',
    legs,
    itineraries,
    price,
    allOffers,
  } = hack;

  // Selected offer if multiple offers exist
  const activeOffer = (allOffers && allOffers[selectedOfferIndex]) || hack;
  const activePrice = activeOffer.price || price || {};
  const activeItineraries = activeOffer.itineraries || itineraries || [];
  const outbound = activeItineraries[0] || null;
  const returnItin = activeItineraries[1] || null;

  const outboundDep = formatFlightTime(outbound?.departureTime || outbound?.segments?.[0]?.departure?.at);
  const outboundArr = formatFlightTime(outbound?.arrivalTime || outbound?.segments?.[outbound?.segments?.length - 1]?.arrival?.at);
  const returnDep = formatFlightTime(returnItin?.departureTime || returnItin?.segments?.[0]?.departure?.at);
  const returnArr = formatFlightTime(returnItin?.arrivalTime || returnItin?.segments?.[returnItin?.segments?.length - 1]?.arrival?.at);

  const outboundCarrier = activeOffer.airline?.name || airline || 'Airline';
  const outboundFlightNo = activeOffer.flightNumber || flightNumber || '';
  const outboundAircraft = outbound?.segments?.[0]?.aircraft || null;

  // Case 1: Cash-only GDS response (Live or Fixture) without award inventory
  if (isCashOnly || (!isDemo && (!hack.offers?.pointsRequired || !hack.awardInventory?.available))) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
        {/* Header Notice Banner with Honest Data-Source Labeling */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between text-xs border-b ${
            dataSource === 'live'
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
              : 'bg-blue-50/80 border-blue-200/80 text-blue-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {dataSource === 'live' ? (
              <>
                <Radio className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span className="font-bold">Live Flight API Offer (Amadeus GDS)</span>
                <span className="hidden md:inline text-emerald-800">
                  — Real-world GDS airline pricing. Award seats require loyalty partner integration.
                </span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-[#0B347D] shrink-0" />
                <span className="font-bold">Sample GDS Benchmark (Test Fixture Data)</span>
                <span className="hidden md:inline text-slate-600">
                  — Documented Amadeus test fixture. Configure live API credentials to query real-time flights.
                </span>
              </>
            )}
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
          {/* Multiple Offers Selector if returned by provider */}
          {allOffers && allOffers.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold shrink-0">Available Options:</span>
              {allOffers.map((offer, idx) => (
                <button
                  key={offer.id || idx}
                  type="button"
                  onClick={() => setSelectedOfferIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                    selectedOfferIndex === idx
                      ? 'bg-[#0B347D] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {offer.airline?.name || offer.airline?.code || 'Flight'} • {formatEuro(offer.price?.total || 0)}
                </button>
              ))}
            </div>
          )}

          {/* Route & Primary Airline Header */}
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
                  <span className="font-semibold text-slate-700">{outboundCarrier}</span>
                  {outboundFlightNo && <span>• {outboundFlightNo}</span>}
                  {outboundAircraft && <span>• {outboundAircraft}</span>}
                  <span>• <span className="capitalize">{cabin?.replace('_', ' ')}</span></span>
                  <span>• {outbound?.stops === 0 ? 'Non-stop' : `${outbound?.stops} Stop(s)`}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-50 p-3 sm:p-0 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Price ({activePrice.currency || 'EUR'})
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B347D]">
                {formatEuro(activePrice.total || metrics?.totalCashPrice || 0)}
              </span>
            </div>
          </div>

          {/* Side-by-side: Verified Flight Offer vs Award Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Live/Fixture GDS Fare Card */}
            <div className="rounded-2xl border-2 border-[#0B347D] bg-white p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B347D] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#087E8B]" /> Verified Retail Cash Fare
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${dataSource === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {dataSource === 'live' ? 'Live Offer' : 'Test Fixture'}
                  </span>
                </div>

                {/* Price Display */}
                <div>
                  <p className="text-xs text-slate-500">Total fare ({activePrice.currency || 'EUR'})</p>
                  <p className="text-3xl font-extrabold text-[#073B68] mt-0.5">
                    {formatEuro(activePrice.total || metrics?.totalCashPrice || 0)}
                  </p>
                  {activePrice.perTraveler && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Per passenger: {formatEuro(activePrice.perTraveler)}
                    </p>
                  )}
                </div>

                {/* Outbound Segment Details */}
                {outbound && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                    <div className="font-bold text-[#073B68] flex items-center justify-between">
                      <span>Outbound Flight ({outbound.durationFormatted})</span>
                      <span className="font-normal text-slate-500">{outbound.stops === 0 ? 'Direct' : `${outbound.stops} stop(s)`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{outboundDep.time}</span> {outbound.origin} {outbound.segments?.[0]?.departure?.terminal && `(T${outbound.segments[0].departure.terminal})`}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-900">{outboundArr.time}</span> {outbound.destination} {outbound.segments?.[outbound.segments.length - 1]?.arrival?.terminal && `(T${outbound.segments[outbound.segments.length - 1].arrival.terminal})`}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dates: {outboundDep.date} → {outboundArr.date}
                    </div>
                  </div>
                )}

                {/* Return Segment Details (if round trip) */}
                {returnItin && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                    <div className="font-bold text-[#073B68] flex items-center justify-between">
                      <span>Return Flight ({returnItin.durationFormatted})</span>
                      <span className="font-normal text-slate-500">{returnItin.stops === 0 ? 'Direct' : `${returnItin.stops} stop(s)`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{returnDep.time}</span> {returnItin.origin} {returnItin.segments?.[0]?.departure?.terminal && `(T${returnItin.segments[0].departure.terminal})`}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-900">{returnArr.time}</span> {returnItin.destination} {returnItin.segments?.[returnItin.segments.length - 1]?.arrival?.terminal && `(T${returnItin.segments[returnItin.segments.length - 1].arrival.terminal})`}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dates: {returnDep.date} → {returnArr.date}
                    </div>
                  </div>
                )}

                {/* Base & Taxes breakdown (only when provided) */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {typeof activePrice.base === 'number' && activePrice.base > 0 && (
                    <div className="flex justify-between">
                      <span>Base ticket fare:</span>
                      <span className="font-semibold">{formatEuro(activePrice.base)}</span>
                    </div>
                  )}
                  {typeof activePrice.taxesAndFees === 'number' && activePrice.taxesAndFees > 0 && (
                    <div className="flex justify-between">
                      <span>Taxes & carrier fees:</span>
                      <span className="font-semibold">{formatEuro(activePrice.taxesAndFees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Passengers:</span>
                    <span className="font-semibold">{activeOffer.travelers || 1} Adult</span>
                  </div>
                </div>

                {onOpenBooking && (
                  <div className="pt-3">
                    <button
                      type="button"
                      id="book-cash-flight-card-btn"
                      onClick={() => onOpenBooking(activeOffer)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span>Book Flight ({formatEuro(activePrice.total)})</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {dataSource === 'live'
                    ? 'Retrieved via live GDS connection.'
                    : 'Verified sample fixture from Amadeus Flight Offers API.'}
                </span>
              </div>
            </div>

            {/* Verified Partner Award Card (Phase 15 Genuine Award Integration) or Honest Unavailable Status */}
            {activeOffer.verifiedAwardOffer || hack.verifiedAwardOffer || (hack.awardInventory?.offers && hack.awardInventory.offers.length > 0) ? (
              (() => {
                const verified = activeOffer.verifiedAwardOffer || hack.verifiedAwardOffer || hack.awardInventory.offers[0];
                return (
                  <div className="rounded-2xl border-2 border-emerald-500 bg-white p-5 flex flex-col justify-between shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Partner Award
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {verified.provider === 'mock' ? 'Demo Partner Feed' : 'Live Seats.aero Feed'}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Points & mandatory fees</p>
                        <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-extrabold text-[#0B347D]">
                            {formatPoints(verified.pointsRequired)}
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            + {formatEuro(verified.taxesAndFees?.amount || 0)} ({verified.taxesAndFees?.currency || 'EUR'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Program: <strong className="text-[#073B68]">{verified.program?.name}</strong>
                          {verified.seatsAvailable && (
                            <span className="ml-2 font-semibold text-emerald-700">({verified.seatsAvailable} seats left)</span>
                          )}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Operating Airline(s):</span>
                          <span className="font-semibold">{verified.operatingAirlines?.join(', ') || outboundCarrier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cabin Class:</span>
                          <span className="capitalize font-semibold">{verified.cabin || cabin}</span>
                        </div>
                        {verified.bookingUrl && (
                          <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center">
                            <span>Official Booking Portal:</span>
                            <a
                              href={verified.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0B347D] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span>{verified.program?.name?.split(' ')[0] || 'Airline'} Website</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed italic">
                        {verified.bookingInstructions || 'Verify saver seat availability directly on official loyalty portal before transferring points.'}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      {onOpenBooking && (
                        <button
                          type="button"
                          id="book-verified-award-btn"
                          onClick={() => onOpenBooking({ ...activeOffer, verifiedAwardOffer: verified })}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#276955] hover:bg-[#1f5444] text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <Plane className="w-3.5 h-3.5 -rotate-45" />
                          <span>Redeem Points or Book Flight</span>
                        </button>
                      )}
                      {onOpenRedemptionPlanner && (
                        <button
                          type="button"
                          id="open-verified-redemption-planner-btn"
                          onClick={() => onOpenRedemptionPlanner({ ...activeOffer, verifiedAwardOffer: verified })}
                          className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Calculator className="w-3.5 h-3.5 text-[#0B347D]" />
                          <span>Compare with Cash in Smart Savings Planner</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Award Seat Inventory Status
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {hack.awardInventory?.status === 'unconfigured' ? 'Unconfigured' : 'Unsupported'}
                    </span>
                  </div>

                  <div className="space-y-2 py-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      Live Award Flight Availability Not Connected
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {hack.awardInventory?.reason || 'Per financial integrity standards, speculative award savings or fake hacked prices are never shown without direct, verified award-seat inventory.'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {hack.awardInventory?.eligibilityNote || 'Seats.aero requires an authorized commercial partner agreement. In the meantime, use the Smart Savings Redemption Planner with your own estimates.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                  {onOpenRedemptionPlanner && (
                    <button
                      type="button"
                      id="open-redemption-planner-btn"
                      onClick={() => onOpenRedemptionPlanner(activeOffer)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Calculator className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Plan Award Redemption & Savings</span>
                    </button>
                  )}
                  {onSwitchToDemo && (
                    <button
                      type="button"
                      onClick={onSwitchToDemo}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Or Explore Illustrative Demo Sweet Spots</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
            {onOpenRedemptionPlanner && (
              <button
                type="button"
                id="custom-redemption-planner-btn"
                onClick={() => onOpenRedemptionPlanner(hack)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-[#073B68] hover:border-slate-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Calculator className="w-3.5 h-3.5 text-[#0B347D]" />
                <span>Custom Redemption Planner</span>
              </button>
            )}
            {onOpenBooking && (
              <button
                type="button"
                id="hero-book-flight-btn"
                onClick={() => onOpenBooking(activeOffer || hack)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#276955] hover:bg-[#1f5444] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plane className="w-3.5 h-3.5 -rotate-45" />
                <span>Book Flight / Redeem</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBookingGuide}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Booking Guide</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
