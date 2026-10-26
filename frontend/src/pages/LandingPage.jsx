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
import { AlertCircle } from 'lucide-react';

export function LandingPage() {
  const {
    activeMode,
    setActiveMode,
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

        {/* Search Error Notice if any */}
        {searchError && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          </div>
        )}

        {/* Results Preview Section */}
        <section id="results-section" className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#073B68]">
                Your Travel Hacking Savings Comparison
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Calculated award sweet spots against real-world retail cash prices.
              </p>
            </div>
          </div>

          {/* Loading Skeleton during calculation */}
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
            />
          )}
        </section>

        {/* Popular Hacks & Clickable Sweet Spots */}
        <PopularHacks onSelectRoute={applyPresetRoute} />

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
