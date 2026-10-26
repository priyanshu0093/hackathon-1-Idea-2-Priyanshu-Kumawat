import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/sections/HeroSection';
import { SearchPanel } from '../features/search/SearchPanel';
import { SavingsHeroCard } from '../features/savings/SavingsHeroCard';
import { PopularHacks } from '../components/sections/PopularHacks';
import { HowItWorks } from '../components/sections/HowItWorks';
import { TrustSection } from '../components/sections/TrustSection';
import { BookingGuideModal } from '../features/savings/BookingGuideModal';
import { SavedTripsModal } from '../components/common/SavedTripsModal';
import { SignInModal } from '../components/common/SignInModal';

import { useFlightSearch } from '../hooks/useFlightSearch';
import { useSavedTrips } from '../hooks/useSavedTrips';
import { AlertCircle, RotateCcw, Sparkles, Radio } from 'lucide-react';

export function LandingPage() {
  const {
    activeMode,
    setActiveMode,
    dataSourceMode,
    setDataSourceMode,
    formData,
    updateField,
    swapAirports,
    addLeg,
    removeLeg,
    updateLeg,
    applyPresetRoute,
    isSearching,
    searchResult,
    searchError,
    quickValidationErrors,
    fullValidationErrors,
    legErrors,
    handleSearch,
    retrySearch,
    switchToDemo,
  } = useFlightSearch();

  const {
    savedTrips,
    toggleSaveTrip,
    isTripSaved,
    savedCount,
  } = useSavedTrips();

  const [isBookingGuideOpen, setIsBookingGuideOpen] = useState(false);
  const [isSavedTripsOpen, setIsSavedTripsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const isCurrentTripSaved = isTripSaved(searchResult);

  return (
    <div className="min-h-screen bg-[#F3F5F6] flex flex-col selection:bg-[#087E8B]/20 selection:text-[#073B68]">
      {/* Header */}
      <Header
        savedCount={savedCount}
        onOpenSavedTrips={() => setIsSavedTripsOpen(true)}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero with Brand Headline */}
        <HeroSection />

        {/* Embedded Interactive Search Panel */}
        <SearchPanel
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          formData={formData}
          updateField={updateField}
          swapAirports={swapAirports}
          addLeg={addLeg}
          removeLeg={removeLeg}
          updateLeg={updateLeg}
          onSearch={handleSearch}
          isSearching={isSearching}
          quickValidationErrors={quickValidationErrors}
          fullValidationErrors={fullValidationErrors}
          legErrors={legErrors}
        />

        {/* Search Error State with Retry & Demo Fallback */}
        {searchError && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-950">Search Request Failed</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{searchError}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={retrySearch}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={switchToDemo}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Switch to Demo Mode</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Preview Section */}
        <section id="results-section" className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#073B68]">
                  Flight Search & Savings Comparison
                </h2>
                {dataSourceMode === 'live' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Live GDS API
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Illustrative Demo
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {dataSourceMode === 'live'
                  ? 'Real-time commercial airline flight offers retrieved via Amadeus Self-Service API.'
                  : 'Curated distance-based award chart sweet spots against typical retail cash fares.'}
              </p>
            </div>

            {/* Mode Switcher Button */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setDataSourceMode('live');
                  retrySearch();
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dataSourceMode === 'live'
                    ? 'bg-white text-[#073B68] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live API
              </button>
              <button
                type="button"
                onClick={switchToDemo}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dataSourceMode === 'demo'
                    ? 'bg-white text-[#073B68] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Demo Hacks
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isSearching ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-44 bg-slate-100 rounded-2xl"></div>
                <div className="h-44 bg-slate-100 rounded-2xl"></div>
              </div>
              <div className="h-14 bg-slate-100 rounded-xl"></div>
            </div>
          ) : (
            <SavingsHeroCard
              hack={searchResult}
              isSaved={isCurrentTripSaved}
              onToggleSave={() => toggleSaveTrip(searchResult)}
              onOpenBookingGuide={() => setIsBookingGuideOpen(true)}
              formData={formData}
              onSwitchToDemo={switchToDemo}
            />
          )}
        </section>

        {/* Popular Hacks & Clickable Sweet Spots */}
        <PopularHacks onSelectRoute={(origin, dest, cabin) => applyPresetRoute(origin, dest, cabin, { useDemo: true })} />

        {/* How It Works (4 Steps) */}
        <HowItWorks />

        {/* Trust & Methodology */}
        <TrustSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <BookingGuideModal
        hack={searchResult}
        isOpen={isBookingGuideOpen}
        onClose={() => setIsBookingGuideOpen(false)}
      />

      <SavedTripsModal
        isOpen={isSavedTripsOpen}
        onClose={() => setIsSavedTripsOpen(false)}
        savedTrips={savedTrips}
        onRemoveTrip={toggleSaveTrip}
        onSelectTrip={applyPresetRoute}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />
    </div>
  );
}
