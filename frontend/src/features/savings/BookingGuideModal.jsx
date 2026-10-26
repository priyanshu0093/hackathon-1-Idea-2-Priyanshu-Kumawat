import React from 'react';
import { X, ExternalLink, AlertTriangle, ShieldCheck, Sparkles, Coins } from 'lucide-react';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function BookingGuideModal({ hack, isOpen, onClose }) {
  if (!isOpen || !hack) return null;

  const {
    originCity,
    destinationCity,
    airline,
    flightNumber,
    metrics,
    programName,
    bookingSteps = [],
  } = hack;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#073B68] to-[#087E8B] text-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-cyan-200 mb-2">
                <Sparkles className="w-3 h-3" /> Step-by-Step Travel Hack Guide
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">
                How to Book: {originCity} to {destinationCity}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                Fly {airline} ({flightNumber}) saving {formatEuro(metrics.savingsEuro)} ({metrics.savingsPercentage}% off)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Points Needed</span>
              <p className="text-base font-bold text-[#0B347D] mt-0.5">{formatPoints(metrics.totalPoints)}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Taxes & Fees</span>
              <p className="text-base font-bold text-slate-800 mt-0.5">{formatEuro(metrics.totalTaxes)}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Cash Benchmark</span>
              <p className="text-base font-bold text-slate-400 line-through mt-0.5">{formatEuro(metrics.totalCashPrice)}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Your Savings</span>
              <p className="text-base font-bold text-emerald-600 mt-0.5">{formatEuro(metrics.savingsEuro)}</p>
            </div>
          </div>

          {/* Shortfall Notice inside modal if applicable */}
          {metrics.hasShortfall && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
              <Coins className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 leading-relaxed">
                <strong>Points balance gap:</strong> You need {formatPoints(metrics.pointsShortfall)} more points. Consider transferring from another credit card partner or purchasing points during a bonus sale (estimated cost: ~{formatEuro(metrics.estimatedShortfallCostEuro)}).
              </div>
            </div>
          )}

          {/* Stepper */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-slate-800">
              Execution Roadmap:
            </h4>

            {bookingSteps.map((stepItem, index) => (
              <div key={index} className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white">
                <div className="w-7 h-7 rounded-full bg-[#0B347D] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  {stepItem.step || index + 1}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">
                    {stepItem.title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {stepItem.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Golden Rule Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold">Golden Travel-Hacking Rule:</strong> Never transfer credit card points before verifying that award seats are currently bookable on the partner airline portal. Point transfers are non-reversible.
            </div>
          </div>

          {/* Educational Note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-[#087E8B]" />
            <span>Illustrative educational demo data. Live seat booking occurs directly on official airline portals.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 text-center sm:text-left">
            Booking route via <strong>{programName}</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert(`In Phase 3, this will deep-link directly to the ${airline} award portal with flight dates pre-filled.`);
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Go to Airline Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
