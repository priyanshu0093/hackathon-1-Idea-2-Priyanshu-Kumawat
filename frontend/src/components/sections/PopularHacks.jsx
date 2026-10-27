import React from 'react';
import { ArrowRight, TrendingDown, ArrowUpRight } from 'lucide-react';
import { CURATED_HACKS } from '../../data/sampleHacks';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function PopularHacks({ onSelectRoute }) {
  return (
    <section id="popular-hacks" className="py-16 sm:py-20 bg-[#F3F5F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-[#087E8B] uppercase tracking-wider">
              Curated Sweet Spots
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#073B68] mt-2">
              Popular Travel Hacking Routes
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-xl">
              Real examples of legendary award sweet spots where reward miles beat public retail cash tickets by huge margins.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Click any card to auto-populate the search engine
          </div>
        </div>

        {/* Route Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CURATED_HACKS.map((hack) => (
            <div
              key={hack.id}
              onClick={() => {
                onSelectRoute(hack.origin, hack.destination, hack.cabin);
                const el = document.getElementById('search-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-[#087E8B] hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Tag & Savings */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#087E8B]/10 text-[#087E8B]">
                    {hack.cabinLabel}
                  </span>
                  <span className="text-xs font-extrabold text-[#276955] bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> -{hack.hackedPrice.savingsPercentage}%
                  </span>
                </div>

                {/* Cities */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base text-slate-900 group-hover:text-[#0B347D] transition-colors">
                    {hack.originCity}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-bold text-base text-slate-900 group-hover:text-[#0B347D] transition-colors">
                    {hack.destinationCity}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  {hack.airline} • {hack.flightNumber} ({hack.duration})
                </p>

                {/* Price Breakdown */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Cash retail:</span>
                    <span className="line-through">{formatEuro(hack.normalCashPrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Award Hack:</span>
                    <span className="text-[#0B347D]">
                      {formatPoints(hack.hackedPrice.pointsRequired)} + {formatEuro(hack.hackedPrice.taxesAndFees)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {hack.explanation}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0B347D]">
                <span>Try this route</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
