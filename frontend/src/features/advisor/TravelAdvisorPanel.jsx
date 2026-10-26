import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Calculator,
  AlertTriangle,
  ArrowRight,
  Send,
  RotateCcw,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  Layers,
  Coins
} from 'lucide-react';
import { formatEuro, formatPoints } from '../../lib/formatters';
import { analyzeTripAdvice } from '../../services/advisorService';

export function TravelAdvisorPanel({ searchResult, formData, dataSourceMode }) {
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat / Question state
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qnaHistory, setQnaHistory] = useState([]);

  // UI accordion toggles
  const [showMethodology, setShowMethodology] = useState(false);
  const [showPartners, setShowPartners] = useState(false);

  const abortControllerRef = useRef(null);

  // Fetch advice when searchResult changes
  const fetchAdvice = useCallback(
    async (customQuestion = null) => {
      if (!searchResult || searchResult.isEmpty) {
        setAdvice(null);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (customQuestion) {
        setIsAsking(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const origin = searchResult.origin || formData?.origin || 'MAD';
      const destination = searchResult.destination || formData?.destination || 'JFK';
      const departureDate = formData?.departureDate || new Date().toISOString().split('T')[0];
      const returnDate = formData?.tripType === 'round_trip' ? formData?.returnDate : null;
      const travelers = Number(formData?.travelers) || 1;
      const cabin = formData?.cabin || 'economy';
      const cashPrice =
        searchResult.price?.total ||
        searchResult.metrics?.totalCashPrice ||
        searchResult.offers?.cashPrice ||
        0;

      const payload = {
        origin,
        destination,
        departureDate,
        returnDate,
        isFlexibleDates: Boolean(formData?.isFlexibleDates),
        travelers,
        cabin,
        tripType: formData?.tripType || (returnDate ? 'round_trip' : 'one_way'),
        cashPrice: Number(cashPrice) || 600,
        currency: searchResult.price?.currency || 'EUR',
        airline: searchResult.airline || 'Airline',
        dataSource: dataSourceMode || (searchResult.isDemo ? 'demo' : 'live'),
        pointsBalance: Number(formData?.pointsBalance) || 0,
        pointsProgram: formData?.pointsProgram || 'none',
        skipPoints: Boolean(formData?.skipPoints),
        ...(customQuestion ? { question: customQuestion } : {}),
      };

      try {
        const data = await analyzeTripAdvice(payload, { signal: controller.signal });
        setAdvice(data);

        if (customQuestion && data.questionAnswer) {
          setQnaHistory((prev) => [
            ...prev,
            {
              question: customQuestion,
              topic: data.questionAnswer.topic,
              answer: data.questionAnswer.answer,
              adviceTip: data.questionAnswer.adviceTip,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setQuestionInput('');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to analyze travel hacking recommendations.');
        }
      } finally {
        setIsLoading(false);
        setIsAsking(false);
      }
    },
    [searchResult, formData, dataSourceMode]
  );

  useEffect(() => {
    fetchAdvice();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAdvice]);

  const handleAskQuestion = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!questionInput.trim() || isAsking) return;
    fetchAdvice(questionInput.trim());
  };

  const handlePromptPillClick = (prompt) => {
    if (isAsking) return;
    fetchAdvice(prompt);
  };

  if (!searchResult || searchResult.isEmpty) {
    return null;
  }

  return (
    <div id="ai-travel-advisor" className="mt-8 transition-all">
      <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#073B68] via-[#0B347D] to-[#087E8B] text-white px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300 border border-white/20 shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  A Una Milla Travel Hacking Advisor
                </h3>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Financially Verified
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                Objective route strategy & point valuation for{' '}
                <span className="font-semibold text-white">
                  {advice?.tripContext?.origin || formData?.origin} → {advice?.tripContext?.destination || formData?.destination}
                </span>{' '}
                ({formData?.cabin || 'Economy'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Expert Rule Engine</span>
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !advice && (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded-lg w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-slate-100 rounded-2xl"></div>
              <div className="h-32 bg-slate-100 rounded-2xl"></div>
              <div className="h-32 bg-slate-100 rounded-2xl"></div>
            </div>
            <div className="h-20 bg-slate-100 rounded-2xl"></div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {error && !isLoading && (
          <div className="p-6 sm:p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Advisor Recommendation Unavailable</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchAdvice()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68] inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Advisor Analysis</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        {advice && (
          <div className="p-5 sm:p-7 space-y-6">

            {/* Top Recommendation Box */}
            <div className="bg-gradient-to-br from-blue-50/70 to-cyan-50/40 rounded-2xl p-5 border border-blue-200/70 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#087E8B]"></span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#073B68]">
                    Primary Travel Recommendation
                  </span>
                </div>
                {advice.recommendation?.estimatedSavings > 0 && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    Potential Savings: ~{formatEuro(advice.recommendation.estimatedSavings)} (-{advice.recommendation.estimatedSavingsPercentage}%)
                  </span>
                )}
              </div>

              <h4 className="text-lg sm:text-xl font-bold text-[#073B68]">
                {advice.recommendation?.title}
              </h4>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {advice.recommendation?.reasoning}
              </p>

              {/* Metrics Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 block">Verified Cash Fare</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0B347D]">
                    {formatEuro(advice.tripContext?.verifiedCashTotal || 0)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 block">Est. Points Required</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#087E8B]">
                    {formatPoints(advice.recommendation?.estimatedPointsRequired || 0)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 block">Est. Taxes & Fees</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-800">
                    {formatEuro(advice.recommendation?.estimatedTaxes || 0)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 block">Loyalty Program</span>
                  <span className="text-xs sm:text-sm font-bold text-[#073B68] truncate block">
                    {advice.recommendation?.program || 'Direct'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4 & 5: Clear Separation of Facts vs Estimates vs Assumptions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#073B68] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#087E8B]" />
                  <span>Financial Integrity & Data Breakdown</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowMethodology(!showMethodology)}
                  className="text-xs font-semibold text-[#0B347D] hover:underline flex items-center gap-1"
                >
                  <span>{showMethodology ? 'Hide methodology' : 'Learn how we verify'}</span>
                  {showMethodology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Verified Facts */}
                <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Facts</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    {advice.facts?.map((fact, idx) => (
                      <li key={idx} className="leading-snug">{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. Estimates */}
                <div className="bg-white rounded-xl p-4 border border-blue-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B347D]">
                    <Calculator className="w-4 h-4 text-[#087E8B]" />
                    <span>Estimates</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    {advice.estimates?.map((estimate, idx) => (
                      <li key={idx} className="leading-snug">{estimate}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Assumptions & Missing Info */}
                <div className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Assumptions</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    {advice.assumptions?.map((assumption, idx) => (
                      <li key={idx} className="leading-snug">{assumption}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            {/* Optimization Suggestions: Alternate Airports, Dates, & Stopovers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Alternate Airports Card */}
              {advice.alternateAirports && advice.alternateAirports.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#073B68]">
                    <MapPin className="w-4 h-4 text-[#087E8B]" />
                    <span>Alternative Nearby Airports</span>
                  </div>
                  <div className="space-y-2">
                    {advice.alternateAirports.map((alt, idx) => (
                      <div key={idx} className="text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">{alt.name}: </span>
                        <span className="text-slate-600">{alt.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Flexibility & Off-Peak Advice */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#073B68]">
                  <Calendar className="w-4 h-4 text-[#087E8B]" />
                  <span>Date Flexibility & Off-Peak Travel</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                  {advice.dateFlexibilityAdvice}
                </p>
                {advice.recommendation?.sweetSpotNote && (
                  <p className="text-xs text-[#073B68] bg-cyan-50/70 p-2.5 rounded-xl border border-cyan-200">
                    <strong>Program Note: </strong>{advice.recommendation.sweetSpotNote}
                  </p>
                )}
              </div>

            </div>

            {/* Transfer Partners & Loyalty Programs Accordion */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowPartners(!showPartners)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#073B68]">
                  <Building2 className="w-4 h-4 text-[#087E8B]" />
                  <span>Eligible Credit Card Transfer Partners ({advice.transferPartners?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#0B347D] font-semibold">
                  <span>{showPartners ? 'Collapse' : 'View Transfer Partners'}</span>
                  {showPartners ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showPartners && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <p className="text-xs text-slate-600">
                    You can transfer transferable bank rewards 1:1 to book saver seats with {advice.recommendation?.program}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {advice.transferPartners?.map((tp, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-800 block">{tp.bank}</span>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Ratio: <strong className="text-slate-700">{tp.ratio}</strong></span>
                          <span>Time: <strong className="text-slate-700">{tp.transferTime}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                    ⚠️ <strong>Golden Rule:</strong> Always verify award seat space on the airline portal first before transferring bank points. Transfers are irreversible!
                  </p>
                </div>
              )}
            </div>

            {/* Actionable Next Step Box (Honest Next Action) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#073B68] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                  Actionable Next Step
                </span>
                <h5 className="text-sm sm:text-base font-bold text-white">
                  {advice.nextAction?.title}
                </h5>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {advice.nextAction?.description}
                </p>
              </div>

              <div className="text-xs text-slate-400 sm:text-right shrink-0">
                <span className="block text-[11px] text-slate-300 font-semibold">Self-Service Booking</span>
                <span>Direct on official airline site</span>
              </div>
            </div>

            {/* Interactive Advisor Chat & Q&A Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#087E8B]" />
                  <h4 className="text-sm font-bold text-[#073B68]">
                    Ask the Travel Hacking Advisor
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  Ask about points, taxes, Avios, or alternatives
                </span>
              </div>

              {/* Q&A History */}
              {qnaHistory.length > 0 && (
                <div className="space-y-3 pt-1">
                  {qnaHistory.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0B347D]">Q: {item.question}</span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.answer}
                      </p>
                      {item.adviceTip && (
                        <div className="text-[11px] text-[#073B68] bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-start gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-[#087E8B] shrink-0 mt-0.5" />
                          <span><strong>Advisor Tip:</strong> {item.adviceTip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Question Input Form */}
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. How do I transfer points? Are taxes lower from Madrid? Is cash or points better?"
                  disabled={isAsking}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent transition-all"
                  maxLength={300}
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAsking}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B347D] text-white hover:bg-[#073B68] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  {isAsking ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ask</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Follow-up Prompt Pills */}
              {advice.followUpQuestions && advice.followUpQuestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Suggested Questions for this Trip:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {advice.followUpQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePromptPillClick(q)}
                        disabled={isAsking}
                        className="text-[11px] px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#087E8B] hover:text-[#087E8B] transition-colors text-left"
                      >
                        💬 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
