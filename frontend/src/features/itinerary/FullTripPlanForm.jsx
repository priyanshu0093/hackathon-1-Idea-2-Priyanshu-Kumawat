import React from 'react';
import { Plus, Trash2, Sparkles, Compass, ShieldCheck, AlertCircle } from 'lucide-react';
import { AirportSelect } from '../search/AirportSelect';
import { TravelersSelector } from '../search/TravelersSelector';
import { PointsInput } from '../search/PointsInput';

export function FullTripPlanForm({
  formData,
  updateField,
  addLeg,
  removeLeg,
  updateLeg,
  onSearch,
  isSearching,
  validationErrors = {},
  legErrors = [],
}) {
  const legs = Array.isArray(formData.legs) ? formData.legs : [];

  return (
    <form onSubmit={onSearch} className="space-y-5" noValidate>
      {/* Header controls: Stopover Hack and Preferences */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Multi-Stop Route Builder
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#087E8B]/15 text-[#087E8B]">
            {legs.length} Flight Legs
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Nearby Airport Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={formData.includeNearbyAirports}
              onChange={(e) => updateField('includeNearbyAirports', e.target.checked)}
              className="w-4 h-4 rounded text-[#087E8B] accent-[#087E8B]"
            />
            <span className="font-medium">Scan Nearby Airports (e.g. EWR/JFK)</span>
          </label>

          {/* Flexible Dates Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={formData.isFlexibleDates}
              onChange={(e) => updateField('isFlexibleDates', e.target.checked)}
              className="w-4 h-4 rounded text-[#087E8B] accent-[#087E8B]"
            />
            <span className="font-medium">Flexible Dates (±3 days)</span>
          </label>
        </div>
      </div>

      {/* General validation error if any */}
      {validationErrors.general && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationErrors.general}</span>
        </div>
      )}

      {/* Multi-Leg Sequence Builder */}
      <div className="space-y-3">
        {legs.map((leg, index) => {
          const legErr = legErrors[index] || {};
          return (
            <div
              key={leg.id || index}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3 relative group"
            >
              {/* Leg Title & Remove action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B347D] text-white flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Flight Leg {index + 1}
                  </span>
                </div>

                {legs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLeg(index)}
                    className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-red-50"
                    aria-label={`Remove Leg ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Stop</span>
                  </button>
                )}
              </div>

              {/* Origin, Destination & Date */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-5">
                  <AirportSelect
                    id={`leg-${index}-origin`}
                    label="Departure Origin"
                    value={leg.origin}
                    onChange={(val) => updateLeg(index, 'origin', val)}
                  />
                  {legErr.origin && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">
                      {legErr.origin}
                    </p>
                  )}
                </div>

                <div className="md:col-span-5">
                  <AirportSelect
                    id={`leg-${index}-destination`}
                    label="Destination"
                    value={leg.destination}
                    onChange={(val) => updateLeg(index, 'destination', val)}
                  />
                  {legErr.destination && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">
                      {legErr.destination}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor={`leg-${index}-date`} className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
                    Flight Date
                  </label>
                  <input
                    id={`leg-${index}-date`}
                    type="date"
                    value={leg.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => updateLeg(index, 'date', e.target.value)}
                    className={`w-full text-sm font-semibold text-[#202B35] bg-white border rounded-xl px-2.5 py-2.5 outline-none transition-all ${
                      legErr.date
                        ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                        : 'border-slate-200 focus:border-[#0B347D]'
                    }`}
                  />
                  {legErr.date && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">
                      {legErr.date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another Stop Button */}
        {legs.length < 5 && (
          <button
            type="button"
            id="add-stop-leg-btn"
            onClick={addLeg}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-[#087E8B] rounded-xl text-xs font-bold text-slate-600 hover:text-[#087E8B] bg-white hover:bg-teal-50/30 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Destination / Leg</span>
          </button>
        )}
      </div>

      {/* Pro Stopover Sweet Spot Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-teal-50/80 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0B347D]/10 text-[#0B347D] flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#073B68]">
                Airline Hub Free Stopover Program
              </span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-[#087E8B] text-white">
                Zero Extra Points
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Programs like TAP Miles&Go, Iberia Plus, and Qatar Airways permit complimentary stopovers without additional points charges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableStopover}
              onChange={(e) => updateField('enableStopover', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#087E8B]"></div>
          </label>
          <span className="text-xs font-semibold text-slate-700">
            {formData.enableStopover ? 'Enabled (48h Hub Stop)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Travelers, Cabin & Routing Preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <TravelersSelector
            travelers={formData.travelers}
            cabin={formData.cabin}
            onTravelersChange={(val) => updateField('travelers', val)}
            onCabinChange={(val) => updateField('cabin', val)}
          />
          {validationErrors.travelers && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {validationErrors.travelers}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="full-routing-pref" className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
            Routing Preference
          </label>
          <select
            id="full-routing-pref"
            value={formData.maxStops}
            onChange={(e) => updateField('maxStops', e.target.value)}
            className="w-full text-sm font-semibold text-[#202B35] bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0B347D] focus:ring-2 focus:ring-[#0B347D]/15 rounded-xl px-3 py-2.5 transition-all outline-none shadow-2xs"
          >
            <option value="all">Any Routing (Maximize Savings)</option>
            <option value="direct_only">Non-Stop Segments Only</option>
            <option value="1_stop">Max 1 Transfer per Leg</option>
          </select>
        </div>
      </div>

      {/* Points & Loyalty Program with Inline Error */}
      <div>
        <PointsInput
          program={formData.pointsProgram}
          onProgramChange={(val) => updateField('pointsProgram', val)}
          skipPoints={formData.skipPoints}
          onSkipChange={(val) => updateField('skipPoints', val)}
          pointsBalance={formData.pointsBalance}
          onBalanceChange={(val) => updateField('pointsBalance', val)}
        />
        {validationErrors.pointsBalance && (
          <p className="text-[11px] text-red-600 font-medium mt-1">
            {validationErrors.pointsBalance}
          </p>
        )}
      </div>

      {/* Submit Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#087E8B]" />
          <span>Optimizes complex multi-segment award charts across airline alliances</span>
        </div>

        <button
          type="submit"
          id="full-trip-submit-btn"
          disabled={isSearching}
          className="w-full sm:w-auto min-w-[240px] px-6 py-3.5 rounded-xl font-bold text-sm bg-[#0B347D] hover:bg-[#073B68] text-white shadow-md shadow-[#0B347D]/25 hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-wait"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Optimizing Multi-Stop Itinerary...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Generate Full Trip Plan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
