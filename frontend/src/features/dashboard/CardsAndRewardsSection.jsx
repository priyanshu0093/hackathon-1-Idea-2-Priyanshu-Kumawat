import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  Euro,
  Coins,
  ArrowRight,
} from 'lucide-react';
import {
  fetchCardCatalog,
  fetchUserCards,
  addCardToWallet,
  updateCardInWallet,
  removeCardFromWallet,
  fetchCardForecast,
  syncCardsToWallet,
} from '../../services/cardWalletService';
import { useAuth } from '../../context/AuthContext';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function CardsAndRewardsSection() {
  const { user, isAuthenticated } = useAuth();
  const [cardsData, setCardsData] = useState({ cards: [], currencyTotals: [], summary: {} });
  const [catalog, setCatalog] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Card State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newMonthlySpend, setNewMonthlySpend] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Card State
  const [editingCard, setEditingCard] = useState(null);
  const [editNickname, setEditNickname] = useState('');
  const [editMonthlySpend, setEditMonthlySpend] = useState('');

  // Active sub-tab
  const [activeSubView, setActiveSubView] = useState('cards'); // 'cards' | 'forecast'

  // Clear or load data strictly based on active authenticated user
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCardsData({ cards: [], currencyTotals: [], summary: {} });
      setCatalog([]);
      setForecast(null);
      setIsLoading(false);
      return;
    }
    loadAllData();
  }, [user?.id, isAuthenticated]);

  const loadAllData = async () => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const catalogRes = await fetchCardCatalog();
      if (catalogRes?.products) {
        setCatalog(catalogRes.products);
        if (catalogRes.products.length > 0) {
          setSelectedProductId(catalogRes.products[0].id);
        }
      }

      const cardsRes = await fetchUserCards();
      if (cardsRes) {
        setCardsData(cardsRes);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error loading cards wallet.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadForecastData = async () => {
    try {
      const data = await fetchCardForecast();
      setForecast(data);
    } catch (err) {
      // Gracefully handle forecast load failure
    }
  };

  const handleSyncWalletManual = async () => {
    setIsSyncing(true);
    setErrorMsg('');
    try {
      const res = await syncCardsToWallet();
      setSuccessMsg(res?.message || `Successfully synced points across all cards to your flight wallet!`);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync card points to flight wallet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const grandTotalPoints = cardsData.cards?.reduce((sum, c) => sum + (Number(c.demoBalance) || 0), 0) || 0;

  const handleOpenAddModal = () => {
    setNewNickname('');
    setNewMonthlySpend('');
    setErrorMsg('');
    setSuccessMsg('');
    if (catalog.length > 0 && !selectedProductId) {
      setSelectedProductId(catalog[0].id);
    }
    setIsAddModalOpen(true);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addCardToWallet({
        cardProductId: selectedProductId,
        nickname: newNickname.trim() || undefined,
        estimatedMonthlySpend: newMonthlySpend ? Number(newMonthlySpend) : 0,
      });

      setSuccessMsg('Card successfully added to your wallet! Demo loyalty balance generated.');
      setIsAddModalOpen(false);
      await loadAllData();
      if (activeSubView === 'forecast') {
        loadForecastData();
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (card) => {
    setEditingCard(card);
    setEditNickname(card.nickname || '');
    setEditMonthlySpend(card.estimatedMonthlySpend ? String(card.estimatedMonthlySpend) : '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCard) return;

    setIsSubmitting(true);
    try {
      await updateCardInWallet(editingCard.id, {
        nickname: editNickname.trim(),
        estimatedMonthlySpend: editMonthlySpend ? Number(editMonthlySpend) : 0,
      });

      setEditingCard(null);
      setSuccessMsg('Card updated successfully.');
      await loadAllData();
      if (activeSubView === 'forecast') {
        loadForecastData();
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId, cardName) => {
    if (!window.confirm(`Are you sure you want to remove '${cardName}' from your wallet?`)) {
      return;
    }

    try {
      await removeCardFromWallet(cardId);
      setSuccessMsg(`'${cardName}' removed from your wallet.`);
      await loadAllData();
      if (activeSubView === 'forecast') {
        loadForecastData();
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove card.');
    }
  };

  const selectedProduct = catalog.find((c) => c.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Card Rewards Wallet
            </span>
            <span className="text-xs text-slate-500 font-medium">Demo Catalog Mode</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#073B68] flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-[#087E8B]" />
            My Cards & Rewards
          </h2>
          <p className="text-xs text-slate-600 max-w-xl">
            Track your credit card rewards, view simulated points balances, and project points accumulation without linking real bank credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => {
              setActiveSubView('cards');
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubView === 'cards'
                ? 'bg-[#0B347D] text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Saved Cards
          </button>
          <button
            onClick={() => {
              setActiveSubView('forecast');
              loadForecastData();
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'forecast'
                ? 'bg-[#0B347D] text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 30/60d Forecast
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Flight Wallet Total Points & Booking Ready Card */}
      {grandTotalPoints > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0B347D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold text-[#073B68]">
                  {formatPoints(grandTotalPoints)} Total Points Saved in Wallet
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Ready for Flight Bookings
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                All points generated across your {cardsData.cards.length} cards are saved to your loyalty wallet and ready to be used in the Redemption Planner to book flights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleSyncWalletManual}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>{isSyncing ? 'Syncing...' : 'Save & Sync Wallet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Currency Summary Breakdown (Currencies kept strictly distinct) */}
      {cardsData.currencyTotals && cardsData.currencyTotals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cardsData.currencyTotals.map((group, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-800">{group.rewardsProgram}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[#073B68] font-bold text-[11px]">
                  {group.cardCount} {group.cardCount === 1 ? 'card' : 'cards'}
                </span>
              </div>
              <div>
                <span className="text-3xl font-black tracking-tight text-[#073B68]">
                  {formatPoints(group.totalDemoPoints)}
                </span>
                <span className="text-sm font-bold text-slate-500 ml-1.5">{group.currency}</span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="text-amber-700 font-semibold">DEMO BALANCE</span>
                <span>Not connected to bank</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main View: Cards List */}
      {activeSubView === 'cards' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#0B347D] border-t-transparent rounded-full animate-spin"></div>
              Loading your cards & rewards...
            </div>
          ) : cardsData.cards.length === 0 ? (
            /* Empty State */
            <div className="p-10 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B347D]">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No cards added to your wallet yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add a supported credit card (e.g. Iberia Icon, American Express, or Santander) to generate your demo loyalty balance and project points accumulation.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68] transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Rewards Card
              </button>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardsData.cards.map((card) => (
                <div
                  key={card.id}
                  className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B347D]/40 transition-all flex flex-col justify-between"
                >
                  {/* Top line: Network & Nickname */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-bold text-[#087E8B] tracking-wider uppercase">
                          {card.issuer}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {card.nickname ? `${card.nickname} (${card.cardName})` : card.cardName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(card)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit card nickname or spend"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id, card.nickname || card.cardName)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove card from wallet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Demo Balance Display */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">Demo Balance</span>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full">{card.rewardsProgram}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#073B68]">{formatPoints(card.demoBalance)}</span>
                        <span className="text-xs font-bold text-slate-500">{card.currency}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 font-medium mt-1">
                        DEMO BALANCE — Not connected to your bank
                      </p>
                    </div>
                  </div>

                  {/* Bottom Stats: Spending & Earning */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5 text-[#087E8B]" /> Est. Monthly Spend:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {card.estimatedMonthlySpend > 0 ? formatEuro(card.estimatedMonthlySpend) : 'Not specified'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-[#087E8B]" /> Base Earning Rate:
                      </span>
                      <span className="font-semibold text-[#073B68]">
                        {card.defaultEarningRate} {card.earningRateUnit} (Demo)
                      </span>
                    </div>

                    {card.compatibleAirlines?.length > 0 && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-500">Airline Partners: </span>
                        {card.compatibleAirlines.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub View: 30/60-Day Points Forecast */}
      {activeSubView === 'forecast' && (
        <div className="space-y-6">
          {!forecast || !forecast.hasCards ? (
            <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center text-slate-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#087E8B] opacity-80" />
              <p className="text-xs">Add cards with an estimated monthly spend to see projected points accumulation.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecast.projections.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900">{proj.rewardsProgram}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#073B68] font-bold">
                        {proj.currency}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Current Demo</span>
                        <span className="text-base font-bold text-slate-900">{formatPoints(proj.currentDemoPoints)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
                        <span className="text-[11px] text-[#073B68] block mb-0.5">+30 Days</span>
                        <span className="text-base font-bold text-[#073B68]">+{formatPoints(proj.days30Points)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 block mb-0.5">+60 Days</span>
                        <span className="text-base font-bold text-emerald-700">+{formatPoints(proj.days60Points)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Projected 60-Day Total:</span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatPoints(proj.projectedTotal60)} {proj.currency}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Contributing cards: </span>
                      {proj.cardsContributing.map((c) => `${c.cardName} (${formatEuro(c.spend)}/mo)`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Forecast Assumptions & Disclaimers */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-4 h-4 text-[#087E8B]" /> Explicit Forecast Assumptions:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                  {forecast.assumptions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-amber-700 pt-1 font-medium">{forecast.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#073B68] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#087E8B]" />
                  Add Card to Wallet
                </h3>
                <p className="text-xs text-slate-500">Select a supported rewards card product.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supported Card Product:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-[#0B347D] focus:outline-none"
                >
                  {catalog.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} — {prod.rewardsProgram} ({prod.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Perks Preview */}
              {selectedProduct && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Issuer:</span>
                    <span className="font-semibold text-slate-800">{selectedProduct.issuer}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Rewards Currency:</span>
                    <span className="font-semibold text-[#087E8B]">{selectedProduct.currency} ({selectedProduct.rewardsProgram})</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Base Earning Rate:</span>
                    <span className="font-semibold text-emerald-700">{selectedProduct.defaultEarningRate} {selectedProduct.earningRateUnit}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Annual Fee Reference:</span>
                    <span className="font-semibold text-slate-800">{formatEuro(selectedProduct.annualFee)} / year</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 italic">{selectedProduct.perksSummary}</p>
                </div>
              )}

              {/* Optional Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Card Nickname:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mi Iberia para Supermercados"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  maxLength={64}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-[#0B347D] focus:outline-none"
                />
              </div>

              {/* Estimated Monthly Spending */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Monthly Spend (€):
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  placeholder="e.g. 1500"
                  value={newMonthlySpend}
                  onChange={(e) => setNewMonthlySpend(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-[#0B347D] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used exclusively for illustrative 30/60-day projections.
                </span>
              </div>

              {/* Security & Demo Guarantee */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-[#073B68] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#087E8B] shrink-0 mt-0.5" />
                <div>
                  <strong>No bank credentials requested:</strong> We never collect full card numbers, CVV, or online banking passwords. Demo loyalty balances are generated deterministically once upon saving.
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#073B68]">Edit {editingCard.cardName}</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Nickname:
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  maxLength={64}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-[#0B347D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Monthly Spend (€):
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  value={editMonthlySpend}
                  onChange={(e) => setEditMonthlySpend(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-[#0B347D] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
