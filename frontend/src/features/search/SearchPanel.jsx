import React from 'react';
import { Zap, Route } from 'lucide-react';
import { QuickFlightForm } from './QuickFlightForm';
import { FullTripPlanForm } from '../itinerary/FullTripPlanForm';

export function SearchPanel({
  activeMode,
  setActiveMode,
  formData,
  updateField,
  swapAirports,
  addLeg,
  removeLeg,
  updateLeg,
  onSearch,
  isSearching,
  quickValidationErrors = {},
  fullValidationErrors = {},
  legErrors = [],
}) {
  return (
    <div id="search-panel" className="relative w-full max-w-5xl mx-auto -mt-10 sm:-mt-14 z-20 px-3 sm:px-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/90 overflow-hidden backdrop-blur-xl">
        
        {/* Search Mode Navigation Tabs */}
        <div className="flex border-b border-slate-200/90 bg-slate-50/80 px-4 sm:px-6 pt-3">
          <div className="flex space-x-2 sm:space-x-3">
            {/* Quick Flight Tab */}
            <button
              type="button"
              id="tab-quick-flight"
              onClick={() => setActiveMode('quick')}
              className={`flex items-center gap-2 py-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeMode === 'quick'
                  ? 'border-[#0B347D] text-[#0B347D] bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-[#087E8B]" />
              <span>Quick Flight</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                Point to Point
              </span>
            </button>

            {/* Full Trip Plan Tab */}
            <button
              type="button"
              id="tab-full-trip"
              onClick={() => setActiveMode('full')}
              className={`flex items-center gap-2 py-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeMode === 'full'
                  ? 'border-[#0B347D] text-[#0B347D] bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Route className="w-4 h-4 text-[#0B347D]" />
              <span>Full Trip Plan</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#087E8B]/15 text-[#087E8B]">
                Multi-Stop & Itineraries
              </span>
            </button>
          </div>
        </div>

        {/* Search Form Body */}
        <div className="p-4 sm:p-6 lg:p-7">
          {activeMode === 'quick' ? (
            <QuickFlightForm
              formData={formData}
              updateField={updateField}
              swapAirports={swapAirports}
              onSearch={onSearch}
              isSearching={isSearching}
              validationErrors={quickValidationErrors}
            />
          ) : (
            <FullTripPlanForm
              formData={formData}
              updateField={updateField}
              addLeg={addLeg}
              removeLeg={removeLeg}
              updateLeg={updateLeg}
              onSearch={onSearch}
              isSearching={isSearching}
              validationErrors={fullValidationErrors}
              legErrors={legErrors}
            />
          )}
        </div>

      </div>
    </div>
  );
}
