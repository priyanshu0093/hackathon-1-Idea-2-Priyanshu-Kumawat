import React, { useState } from 'react';
import { Plane, Bookmark, Menu, X, Sparkles, User, Globe } from 'lucide-react';

export function Header({ savedCount = 0, onOpenSavedTrips, onOpenSignIn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a 
              href="#" 
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B347D] rounded-lg"
              aria-label="A Una Milla Homepage"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B347D] to-[#087E8B] flex items-center justify-center text-white shadow-md shadow-[#0B347D]/20 group-hover:scale-105 transition-transform duration-200">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#073B68] leading-none">
                  A Una Milla
                </span>
                <span className="text-xs font-semibold text-[#087E8B] tracking-wide mt-1">
                  DE TU DESTINO
                </span>
              </div>
            </a>

            <div className="hidden lg:flex items-center ml-3 pl-3 border-l border-slate-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#087E8B]/10 text-[#087E8B]">
                <Sparkles className="w-3 h-3" /> Travel Hacking Engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#202B35]">
            <button
              onClick={() => scrollToSection('search-panel')}
              className="hover:text-[#0B347D] transition-colors focus:outline-none"
            >
              Explore Flights
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#0B347D] transition-colors focus:outline-none"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('popular-hacks')}
              className="hover:text-[#0B347D] transition-colors focus:outline-none"
            >
              Sweet Spots
            </button>
          </nav>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Currency / Region */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>EUR (€)</span>
            </div>

            {/* Saved Trips Button */}
            <button
              onClick={onOpenSavedTrips}
              id="saved-trips-btn"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-[#0B347D] transition-colors border border-slate-200/90"
              aria-label={`Saved Trips: ${savedCount} items`}
            >
              <Bookmark className="w-4 h-4 text-[#0B347D]" />
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-[#0B347D] text-white">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Sign in / Account */}
            <button
              onClick={onOpenSignIn}
              id="header-sign-in-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm transition-all duration-150 active:scale-98"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSavedTrips}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative"
              aria-label="View Saved Trips"
            >
              <Bookmark className="w-5 h-5 text-[#0B347D]" />
              {savedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#0B347D] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => scrollToSection('search-panel')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Explore Flights
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('popular-hacks')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Curated Sweet Spots
          </button>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSavedTrips();
              }}
              className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg text-sm font-medium bg-slate-50 text-slate-800"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#0B347D]" /> Saved Trips
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {savedCount}
              </span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSignIn();
              }}
              className="w-full py-2.5 px-4 rounded-lg text-center font-medium bg-[#0B347D] text-white text-sm"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
