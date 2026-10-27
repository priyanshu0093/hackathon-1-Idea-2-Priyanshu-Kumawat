import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  TrendingUp,
  Compass,
  FileCheck2,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Coins,
  CheckCircle2,
  PlaneTakeoff,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchWallet, saveWalletBalance, removeWalletBalance } from '../../services/walletService';
import { calculateForecast, saveForecast, getSavedForecast } from '../../services/forecastService';
import { fetchExternalBookings, recordExternalBooking, removeExternalBooking } from '../../services/bookingService';
import { formatEuro, formatPoints } from '../../lib/formatters';

const POPULAR_PROGRAMS = [
  'Iberia Plus',
  'British Airways Executive Club',
  'Air India Flying Returns',
  'Virgin Atlantic Flying Club',
  'Emirates Skywards',
  'Qatar Airways Privilege Club',
  'Flying Blue (Air France/KLM)',
  'Chase Ultimate Rewards',
  'Amex Membership Rewards',
];

export function TravelDashboardModal({ isOpen, onClose, savedTrips = [], onSelectTrip }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'forecast' | 'planner' | 'bookings'

  // Wallet State
  const [wallet, setWallet] = useState({ balances: [], summary: { totalPoints: 0 } });
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [newProgram, setNewProgram] = useState(POPULAR_PROGRAMS[0]);
  const [newBalance, setNewBalance] = useState('');
  const [newCurrency, setNewCurrency] = useState('Avios');
  const [newNotes, setNewNotes] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  // Forecast State
  const [monthlySpend, setMonthlySpend] = useState(2000);
  const [forecastProgram, setForecastProgram] = useState(POPULAR_PROGRAMS[0]);
  const [earningRate, setEarningRate] = useState(1.5);
  const [targetDestination, setTargetDestination] = useState('MIA');
  const [targetPoints, setTargetPoints] = useState(42500);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastSavedMsg, setForecastSavedMsg] = useState('');

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [bookingAirline, setBookingAirline] = useState('Iberia');
  const [bookingFlightNo, setBookingFlightNo] = useState('');
  const [bookingOrigin, setBookingOrigin] = useState('MAD');
  const [bookingDest, setBookingDest] = useState('MIA');
  const [bookingDepDate, setBookingDepDate] = useState('2026-11-20');
  const [bookingCabin, setBookingCabin] = useState('business');
  const [bookingPoints, setBookingPoints] = useState('42500');
  const [bookingTaxes, setBookingTaxes] = useState('145.50');
  const [bookingSavedEst, setBookingSavedEst] = useState('1800');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load User Data
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    loadWalletData();
    loadForecastData();
    loadBookingsData();
  }, [isOpen, isAuthenticated]);

  const loadWalletData = async () => {
    try {
      setWalletLoading(true);
      const data = await fetchWallet();
      if (data) setWallet(data);
    } catch {
      // Gracefully handle unauthenticated or network errors
    } finally {
      setWalletLoading(false);
    }
  };

  const loadForecastData = async () => {
    try {
      setForecastLoading(true);
      const res = await calculateForecast({
        monthlySpend,
        rewardProgram: forecastProgram,
        earningRate,
        targetDestination,
        targetPoints,
        currentPoints: wallet.summary?.totalPoints || 0,
      });
      setForecastResult(res);
    } catch {
      // Fallback
    } finally {
      setForecastLoading(false);
    }
  };

  const loadBookingsData = async () => {
    try {
      setBookingLoading(true);
      const data = await fetchExternalBookings();
      if (data) setBookings(data);
    } catch {
      // Graceful error handling
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Add Balance
  const handleSaveBalance = async (e) => {
    e.preventDefault();
    try {
      await saveWalletBalance({
        program: newProgram,
        balance: parseInt(newBalance, 10) || 0,
        currencyName: newCurrency,
        notes: newNotes,
      });
      setIsAddingBalance(false);
      setNewBalance('');
      setNewNotes('');
      await loadWalletData();
    } catch (err) {
      alert(err.message || 'Failed to update points balance');
    }
  };

  // Handle Delete Balance
  const handleDeleteBalance = async (id) => {
    if (!window.confirm('Remove this loyalty program balance from your wallet?')) return;
    try {
      await removeWalletBalance(id);
      await loadWalletData();
    } catch (err) {
      alert(err.message || 'Failed to delete balance');
    }
  };

  // Handle Calculate Forecast
  const handleRecalculateForecast = async (e) => {
    if (e) e.preventDefault();
    try {
      setForecastLoading(true);
      const res = await calculateForecast({
        monthlySpend: Number(monthlySpend),
        rewardProgram: forecastProgram,
        earningRate: Number(earningRate),
        targetDestination,
        targetPoints: Number(targetPoints),
        currentPoints: wallet.summary?.totalPoints || 0,
      });
      setForecastResult(res);
    } catch (err) {
      alert(err.message || 'Forecast calculation failed');
    } finally {
      setForecastLoading(false);
    }
  };

  const handleSaveUserForecast = async () => {
    try {
      await saveForecast({
        monthlySpend: Number(monthlySpend),
        rewardProgram: forecastProgram,
        earningRate: Number(earningRate),
        targetDestination,
        targetPoints: Number(targetPoints),
      });
      setForecastSavedMsg('Forecast saved to your profile!');
      setTimeout(() => setForecastSavedMsg(''), 2500);
    } catch (err) {
      alert(err.message || 'Failed to save forecast');
    }
  };

  // Handle Create Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await recordExternalBooking({
        bookingReference: bookingRef,
        airline: bookingAirline,
        flightNumber: bookingFlightNo,
        origin: bookingOrigin,
        destination: bookingDest,
        departureDate: bookingDepDate,
        cabin: bookingCabin,
        pointsRedeemed: parseInt(bookingPoints, 10) || 0,
        taxesPaid: parseFloat(bookingTaxes) || 0,
        cashSavedEstimate: parseFloat(bookingSavedEst) || 0,
        notes: bookingNotes,
      });
      setIsAddingBooking(false);
      setBookingRef('');
      setBookingFlightNo('');
      setBookingNotes('');
      await loadBookingsData();
    } catch (err) {
      alert(err.message || 'Failed to record external booking');
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Remove this external booking record?')) return;
    try {
      await removeExternalBooking(id);
      await loadBookingsData();
    } catch (err) {
      alert(err.message || 'Failed to delete booking record');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#073B68] text-white p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">My Travel Dashboard</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200">
                  Phase 10 Core
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user ? `Logged in as ${user.name || user.email}` : 'Points wallet, 30/60/90-day forecast, and external booking tracker.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors self-end sm:self-center"
            aria-label="Close dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="bg-[#073B68]/95 px-6 border-t border-white/10 flex overflow-x-auto gap-1 text-xs font-semibold text-slate-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'wallet' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 text-cyan-300" />
            <span>Points Wallet ({wallet.balances?.length || 0})</span>
          </button>
          <button
            onClick={() => { setActiveTab('forecast'); handleRecalculateForecast(); }}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'forecast' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>30/60/90-Day Forecast</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'planner' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <PlaneTakeoff className="w-4 h-4 text-amber-300" />
            <span>Trip Planner & Shortfall ({savedTrips?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'bookings' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-purple-300" />
            <span>External Bookings ({bookings?.length || 0})</span>
          </button>
        </div>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">

          {/* TAB 1: POINTS WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Points / Miles</div>
                  <div className="text-2xl font-black text-[#073B68] mt-1 flex items-center gap-1.5">
                    <Coins className="w-6 h-6 text-amber-500" />
                    {formatPoints(wallet.summary?.totalPoints || 0)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Across all tracked reward programs</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Programs</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {wallet.balances?.length || 0}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for redemption matching
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Source</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">Manually Entered</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Explicit date-stamped balance updates</div>
                  </div>
                  <button
                    onClick={() => setIsAddingBalance(true)}
                    className="mt-3 w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Program Balance</span>
                  </button>
                </div>
              </div>

              {/* Add Balance Modal Form */}
              {isAddingBalance && (
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[#073B68] flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#0B347D]" />
                      Add or Update Reward Balance
                    </h4>
                    <button
                      onClick={() => setIsAddingBalance(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBalance} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Loyalty Program</label>
                      <select
                        value={newProgram}
                        onChange={(e) => setNewProgram(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0B347D] outline-none"
                      >
                        {POPULAR_PROGRAMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Points Balance</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="e.g. 45000"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Label</label>
                      <input
                        type="text"
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value)}
                        placeholder="Avios, Points, Miles"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g. Transferred from Amex card, expires 2027"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white transition-colors cursor-pointer"
                      >
                        Save to Wallet
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Balances List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Tracked Loyalty Programs</h3>
                  <span className="text-[11px] text-slate-500">
                    Balances are stored securely in Supabase PostgreSQL
                  </span>
                </div>

                {wallet.balances?.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No loyalty balances added yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add your current points or miles from Iberia, British Airways, Air India, or card programs to compare against trip goals.
                    </p>
                    <button
                      onClick={() => setIsAddingBalance(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68]"
                    >
                      Add First Balance
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {wallet.balances.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#0B347D]/40 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs uppercase font-extrabold text-[#087E8B]">
                                {item.programType || 'Airline Program'}
                              </span>
                              <h4 className="text-base font-bold text-slate-900 mt-0.5">{item.program}</h4>
                            </div>
                            <button
                              onClick={() => handleDeleteBalance(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete balance"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-2xl font-black text-[#073B68] mt-2">
                            {formatPoints(item.balance)}{' '}
                            <span className="text-xs font-medium text-slate-500">{item.currencyName}</span>
                          </div>

                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Updated: {new Date(item.lastUpdated || item.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                            {item.source || 'Manual Entry'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 30/60/90-DAY FORECAST */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Forecast Configuration Form */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Points Earning Velocity & Forecast Inputs
                  </h3>
                  {forecastSavedMsg && (
                    <span className="text-xs font-bold text-emerald-600 animate-pulse">
                      {forecastSavedMsg}
                    </span>
                  )}
                </div>

                <form onSubmit={handleRecalculateForecast} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Eligible Spend (€/$)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={monthlySpend}
                      onChange={(e) => setMonthlySpend(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Program</label>
                    <select
                      value={forecastProgram}
                      onChange={(e) => setForecastProgram(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                    >
                      {POPULAR_PROGRAMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Card Earning Multiplier</label>
                    <select
                      value={earningRate}
                      onChange={(e) => setEarningRate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                    >
                      <option value="1.0">1.0x (Everyday base cards)</option>
                      <option value="1.5">1.5x (Blended category mix)</option>
                      <option value="2.0">2.0x (Dining & travel cards)</option>
                      <option value="3.0">3.0x (Optimized category spend)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Trip Points Goal</label>
                    <input
                      type="number"
                      min="5000"
                      step="1000"
                      value={targetPoints}
                      onChange={(e) => setTargetPoints(e.target.value)}
                      placeholder="e.g. 42500"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={forecastLoading}
                      className="py-2 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{forecastLoading ? 'Computing...' : 'Recalculate Projections'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveUserForecast}
                      className="py-2 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                    >
                      Save Forecast Goal
                    </button>
                  </div>
                </form>
              </div>

              {/* 30/60/90-Day Forecast 3-Tier Grid */}
              {forecastResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Conservative */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-slate-500">Conservative</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            1.0x Base
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">30 Days:</span>
                            <span className="font-bold text-slate-800">+{formatPoints(forecastResult.forecasts.conservative.days30)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">60 Days:</span>
                            <span className="font-bold text-slate-800">+{formatPoints(forecastResult.forecasts.conservative.days60)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-700 font-semibold">90 Days Total:</span>
                            <span className="font-black text-[#073B68]">+{formatPoints(forecastResult.forecasts.conservative.days90)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        {forecastResult.forecasts.conservative.assumptions[0]}
                      </div>
                    </div>

                    {/* Expected */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-emerald-800">Expected (Recommended)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {earningRate}x Multiplier
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">30 Days:</span>
                            <span className="font-bold text-slate-900">+{formatPoints(forecastResult.forecasts.expected.days30)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">60 Days:</span>
                            <span className="font-bold text-slate-900">+{formatPoints(forecastResult.forecasts.expected.days60)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-emerald-200">
                            <span className="text-emerald-900 font-bold">90 Days Total:</span>
                            <span className="font-black text-[#276955]">+{formatPoints(forecastResult.forecasts.expected.days90)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-3 pt-2 border-t border-emerald-200">
                        {forecastResult.forecasts.expected.assumptions[0]}
                      </div>
                    </div>

                    {/* Optimistic */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-[#087E8B]">Optimistic</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#087E8B]/10 text-[#087E8B]">
                            +25% Promo Bonus
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">30 Days:</span>
                            <span className="font-bold text-slate-800">+{formatPoints(forecastResult.forecasts.optimistic.days30)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">60 Days:</span>
                            <span className="font-bold text-slate-800">+{formatPoints(forecastResult.forecasts.optimistic.days60)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-700 font-semibold">90 Days Total:</span>
                            <span className="font-black text-[#073B68]">+{formatPoints(forecastResult.forecasts.optimistic.days90)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        {forecastResult.forecasts.optimistic.assumptions[1]}
                      </div>
                    </div>
                  </div>

                  {/* Feasibility Alert Box */}
                  {forecastResult.targetFeasibility && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-100 text-[#0B347D] shrink-0 mt-0.5">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            Target Feasibility: {formatPoints(targetPoints)} Points Goal
                          </h4>
                          {forecastResult.targetFeasibility.hasEnoughNow ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Goal Met
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Shortfall: {formatPoints(forecastResult.targetFeasibility.shortfall)} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {forecastResult.targetFeasibility.recommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ethical & Financial Responsibility Disclaimers */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Travel Hacking Transparency & Responsible Spending Rules
                    </div>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc pl-5">
                      {forecastResult.disclaimers.map((disc, idx) => (
                        <li key={idx}>{disc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CASH VS. AWARD TRIP PLANNER & SHORTFALL */}
          {activeTab === 'planner' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Saved Trips & Award Feasibility</h3>
                  <p className="text-xs text-slate-500">
                    Comparing cash flight benchmarks against award points requirements and your wallet balances.
                  </p>
                </div>
              </div>

              {savedTrips.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <PlaneTakeoff className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No saved trips to compare</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Search for flights and click &ldquo;Save Hack&rdquo; to analyze your points shortfall and savings against cash fares here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTrips.map((trip) => {
                    const reqPoints = trip.pointsCost || trip.metrics?.totalPoints || 0;
                    const walletBal = wallet.summary?.totalPoints || 0;
                    const shortfall = Math.max(0, reqPoints - walletBal);
                    const hasEnough = shortfall === 0;

                    return (
                      <div
                        key={trip.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-extrabold text-slate-900">
                              {trip.originCity || trip.origin} → {trip.destinationCity || trip.destination}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {trip.cabin}
                            </span>
                            <span className="text-xs text-slate-500">
                              {trip.carrier || 'Airline Partner'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasEnough ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#276955] text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Redeem
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Need {formatPoints(shortfall)} more pts
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Comparison breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="text-slate-500 block">Cash Benchmark:</span>
                            <span className="font-bold text-slate-900 text-sm">
                              {formatEuro(trip.cashPrice || trip.cashFare?.totalCashEur || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Award Points:</span>
                            <span className="font-bold text-[#073B68] text-sm">
                              {formatPoints(reqPoints)} pts
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Taxes & Fees (Cash):</span>
                            <span className="font-bold text-slate-900 text-sm">
                              {formatEuro(trip.taxes || trip.awardFlight?.taxesAndFeesEur || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Estimated Savings:</span>
                            <span className="font-extrabold text-emerald-600 text-sm">
                              {formatEuro(trip.estimatedSavings || trip.metrics?.savingsEuro || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Official Airline Link */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500">
                            Program: <strong className="text-slate-700">{trip.program || 'Airline Loyalty Program'}</strong>
                          </span>
                          <button
                            onClick={() => {
                              onSelectTrip?.(trip.origin, trip.destination, trip.cabin);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[#0B347D] font-bold hover:underline"
                          >
                            <span>Open in Flight Search</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXTERNAL BOOKING MANAGEMENT */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Disclosure banner */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-purple-950">
                  <span className="font-bold block">
                    Self-Reported External Bookings Tracker
                  </span>
                  <p className="text-purple-800 leading-relaxed">
                    A Una Milla is an independent travel intelligence platform. We do not sell tickets or issue bookings directly.
                    Use this tool to track reservations you completed externally on official airline websites.
                  </p>
                </div>
              </div>

              {/* Add booking toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Your External Flight Bookings</h3>
                <button
                  onClick={() => setIsAddingBooking(!isAddingBooking)}
                  className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingBooking ? 'Cancel' : 'Record External Booking'}</span>
                </button>
              </div>

              {/* Add booking form */}
              {isAddingBooking && (
                <form onSubmit={handleCreateBooking} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Enter External Flight Reservation Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Reference (PNR)</label>
                      <input
                        type="text"
                        required
                        value={bookingRef}
                        onChange={(e) => setBookingRef(e.target.value)}
                        placeholder="e.g. IB92KA"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Airline</label>
                      <input
                        type="text"
                        required
                        value={bookingAirline}
                        onChange={(e) => setBookingAirline(e.target.value)}
                        placeholder="e.g. Iberia"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Flight Number (Optional)</label>
                      <input
                        type="text"
                        value={bookingFlightNo}
                        onChange={(e) => setBookingFlightNo(e.target.value)}
                        placeholder="e.g. IB6123"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Origin (IATA)</label>
                      <input
                        type="text"
                        maxLength="3"
                        required
                        value={bookingOrigin}
                        onChange={(e) => setBookingOrigin(e.target.value.toUpperCase())}
                        placeholder="MAD"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Destination (IATA)</label>
                      <input
                        type="text"
                        maxLength="3"
                        required
                        value={bookingDest}
                        onChange={(e) => setBookingDest(e.target.value.toUpperCase())}
                        placeholder="MIA"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDepDate}
                        onChange={(e) => setBookingDepDate(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cabin Class</label>
                      <select
                        value={bookingCabin}
                        onChange={(e) => setBookingCabin(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Points Redeemed</label>
                      <input
                        type="number"
                        min="0"
                        value={bookingPoints}
                        onChange={(e) => setBookingPoints(e.target.value)}
                        placeholder="42500"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Taxes Paid (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bookingTaxes}
                        onChange={(e) => setBookingTaxes(e.target.value)}
                        placeholder="145.50"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B347D] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingBooking(false)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68]"
                    >
                      Save Booking Record
                    </button>
                  </div>
                </form>
              )}

              {/* Bookings list */}
              {bookings.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No external bookings recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Record your official airline booking reference to track your completed redemptions and flight dates.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-extrabold text-slate-900">
                            {b.origin} → {b.destination}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-[#073B68]">
                            PNR: {b.bookingReference}
                          </span>
                          <span className="text-xs text-slate-600">
                            {b.airline} {b.flightNumber && `(${b.flightNumber})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                            Self-Reported Record
                          </span>
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500"
                            title="Remove record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600 p-2.5 bg-slate-50 rounded-xl">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Departure Date</span>
                          <span className="font-semibold">{b.departureDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Cabin</span>
                          <span className="font-semibold uppercase">{b.cabin}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Points Redeemed</span>
                          <span className="font-bold text-[#073B68]">{formatPoints(b.pointsRedeemed)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Taxes Paid</span>
                          <span className="font-semibold">{formatEuro(b.taxesPaid)}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 italic">
                        {b.sourceDisclosure}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-between items-center text-xs text-slate-500">
          <span>A Una Milla Travel Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
