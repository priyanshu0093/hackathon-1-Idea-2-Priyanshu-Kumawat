import React from 'react';
import { X, Bookmark, Trash2, ArrowRight, Plane, Sparkles, TrendingDown } from 'lucide-react';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function SavedTripsModal({
  isOpen,
  onClose,
  savedTrips = [],
  onRemoveTrip,
  onSelectTrip,
}) {
  if (!isOpen) return null;

  const totalSavedValue = savedTrips.reduce(
    (acc, trip) => acc + (trip.metrics?.savingsEuro || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#073B68] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Saved Trips & Hacks</h3>
              <p className="text-xs text-slate-300">
                {savedTrips.length} {savedTrips.length === 1 ? 'itinerary' : 'itineraries'} saved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Cumulative Savings Banner */}
        {savedTrips.length > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3.5 px-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Total Potential Savings in Bucket:
            </span>
            <span className="text-base font-extrabold text-[#276955] flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {formatEuro(totalSavedValue)}
            </span>
          </div>
        )}

        {/* Trips List */}
        <div className="p-5 overflow-y-auto divide-y divide-slate-100 space-y-3">
          {savedTrips.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No saved trips yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click &ldquo;Save Hack&rdquo; on any search result or sweet spot to compare them here anytime.
              </p>
            </div>
          ) : (
            savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-4 group"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectTrip(trip.origin, trip.destination, trip.cabin);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {trip.originCity || trip.origin}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-900">
                      {trip.destinationCity || trip.destination}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {trip.cabin}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{formatPoints(trip.metrics?.totalPoints)}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600">
                      Save {formatEuro(trip.metrics?.savingsEuro)} (-{trip.metrics?.savingsPercentage}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectTrip(trip.origin, trip.destination, trip.cabin);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B347D]/10 text-[#0B347D] hover:bg-[#0B347D] hover:text-white transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onRemoveTrip(trip)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Remove saved trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
