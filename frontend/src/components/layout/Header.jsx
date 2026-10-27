import React, { useState, useRef, useEffect } from 'react';
import { Plane, Bookmark, Menu, X, Sparkles, User, Compass, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Header({ savedCount = 0, onOpenSavedTrips, onOpenSignIn, onOpenDashboard }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

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
              className="hover:text-[#0B347D] transition-colors focus:outline-none cursor-pointer"
            >
              Explore Flights
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#0B347D] transition-colors focus:outline-none cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('popular-hacks')}
              className="hover:text-[#0B347D] transition-colors focus:outline-none cursor-pointer"
            >
              Sweet Spots
            </button>
          </nav>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dashboard / Sign in */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenDashboard}
                  id="header-dashboard-btn"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[#0B347D] to-[#087E8B] text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-cyan-300" />
                  <span>My Dashboard</span>
                </button>

                {/* Interactive User Name Menu with Sign Out */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    id="user-profile-menu-btn"
                    aria-expanded={userMenuOpen}
                    aria-label={`User menu for ${user?.name || user?.email}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#0B347D] text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-xs">
                      {(user?.name || user?.email || 'U')[0]}
                    </div>
                    <span className="truncate max-w-[120px] font-bold">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Account Info */}
                      <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {user?.name || 'Member'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user?.email}
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenDashboard?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B347D] transition-colors text-left cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-[#0B347D]" />
                          <span>My Travel Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenSavedTrips?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B347D] transition-colors text-left cursor-pointer"
                        >
                          <Bookmark className="w-4 h-4 text-[#0B347D]" />
                          <span>Saved Trips ({savedCount})</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 my-1"></div>

                      {/* Sign Out Option */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        id="user-menu-signout-btn"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenSignIn}
                id="header-sign-in-btn"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm transition-all duration-150 active:scale-98 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
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

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-center font-bold bg-[#0B347D] text-white text-sm flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-cyan-300" />
                  <span>My Travel Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-4 rounded-lg text-center font-semibold text-xs text-red-600 bg-red-50 hover:bg-red-100"
                >
                  Sign Out ({user?.name || user?.email})
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignIn();
                }}
                className="w-full py-2.5 px-4 rounded-lg text-center font-medium bg-[#0B347D] text-white text-sm"
              >
                Sign In / Create Account
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
