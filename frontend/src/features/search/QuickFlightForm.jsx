import React from 'react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';
import { AirportSelect } from './AirportSelect';
import { TravelersSelector } from './TravelersSelector';
import { PointsInput } from './PointsInput';

export function QuickFlightForm({
  formData,
  updateField,
  swapAirports,
  onSearch,
  isSearching,
  validationErrors = {},
}) {
  const isRoundTrip = formData.tripType === 'round_trip';

  return (
    <form onSubmit={onSearch} className="space-y-4" noValidate>
      {/* Trip Type Selector & Quick Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
          <button
            type="button"
            id="trip-type-round-trip"
            onClick={() => updateField('tripType', 'round_trip')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              isRoundTrip
                ? 'bg-white text-[#0B347D] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Round Trip
          </button>
          <button
            type="button"
            id="trip-type-one-way"
            onClick={() => updateField('tripType', 'one_way')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              !isRoundTrip
                ? 'bg-white text-[#0B347D] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One Way
          </button>
        </div>

        {/* Flexible Dates Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
          <input
            type="checkbox"
            checked={formData.isFlexibleDates}
            onChange={(e) => updateField('isFlexibleDates', e.target.checked)}
            className="w-4 h-4 rounded text-[#087E8B] focus:ring-[#087E8B] accent-[#087E8B]"
          />
          <span className="font-medium">Flexible Dates (±3 days)</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Saves up to 40%
          </span>
        </label>
      </div>

      {/* Origin, Destination & Swap */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-start">
        {/* Origin */}
        <div className="md:col-span-5">
          <AirportSelect
            id="quick-origin"
            label="From / Origin"
            value={formData.origin}
            error={validationErrors.origin}
            onChange={(val) => updateField('origin', val)}
          />
        </div>

        {/* Swap button */}
        <div className="md:col-span-1 flex justify-center pt-6">
          <button
            type="button"
            id="quick-swap-btn"
            onClick={swapAirports}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0B347D] flex items-center justify-center transition-colors shadow-2xs group"
            title="Swap Origin and Destination"
            aria-label="Swap Origin and Destination"
          >
            <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
          </button>
        </div>

        {/* Destination */}
        <div className="md:col-span-5">
          <AirportSelect
            id="quick-destination"
            label="To / Destination"
            value={formData.destination}
            error={validationErrors.destination}
            onChange={(val) => updateField('destination', val)}
          />
        </div>
      </div>

      {/* Dates & Travelers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        {/* Departure Date */}
        <div>
          <label htmlFor="quick-depart-date" className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
            Departure Date
          </label>
          <input
            id="quick-depart-date"
            type="date"
            value={formData.departureDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateField('departureDate', e.target.value)}
            aria-invalid={Boolean(validationErrors.departureDate)}
            className={`w-full text-sm font-semibold text-[#202B35] bg-white border rounded-xl px-3.5 py-2.5 transition-all outline-none shadow-2xs ${
              validationErrors.departureDate
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                : 'border-slate-200 hover:border-slate-300 focus:border-[#0B347D] focus:ring-2 focus:ring-[#0B347D]/15'
            }`}
          />
          {validationErrors.departureDate && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {validationErrors.departureDate}
            </p>
          )}
        </div>

        {/* Return Date */}
        <div>
          <label htmlFor="quick-return-date" className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
            Return Date
          </label>
          <input
            id="quick-return-date"
            type="date"
            disabled={!isRoundTrip}
            value={isRoundTrip ? formData.returnDate : ''}
            min={formData.departureDate}
            onChange={(e) => updateField('returnDate', e.target.value)}
            aria-invalid={Boolean(validationErrors.returnDate)}
            className={`w-full text-sm font-semibold text-[#202B35] bg-white border rounded-xl px-3.5 py-2.5 transition-all outline-none shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              validationErrors.returnDate
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                : 'border-slate-200 hover:border-slate-300 focus:border-[#0B347D] focus:ring-2 focus:ring-[#0B347D]/15'
            }`}
          />
          {validationErrors.returnDate && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {validationErrors.returnDate}
            </p>
          )}
        </div>

        {/* Travelers and Cabin */}
        <div>
          <TravelersSelector
            travelers={formData.travelers}
            cabin={formData.cabin}
            error={validationErrors.travelers}
            onTravelersChange={(val) => updateField('travelers', val)}
            onCabinChange={(val) => updateField('cabin', val)}
          />
        </div>
      </div>

      {/* Points & Program Selector */}
      <PointsInput
        program={formData.pointsProgram}
        onProgramChange={(val) => updateField('pointsProgram', val)}
        skipPoints={formData.skipPoints}
        onSkipChange={(val) => updateField('skipPoints', val)}
        pointsBalance={formData.pointsBalance}
        error={validationErrors.pointsBalance}
        onBalanceChange={(val) => updateField('pointsBalance', val)}
      />

      {/* Submit Action */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 hidden sm:block">
          ✨ Compares cash benchmarks against 12+ award flight transfer charts
        </p>

        <button
          type="submit"
          id="find-my-savings-btn"
          disabled={isSearching}
          className="w-full sm:w-auto min-w-[220px] px-6 py-3.5 rounded-xl font-bold text-sm bg-[#0B347D] hover:bg-[#073B68] text-white shadow-md shadow-[#0B347D]/25 hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-wait"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Award Sweet Spots...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Find My Savings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
