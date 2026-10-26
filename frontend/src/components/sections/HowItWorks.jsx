import React from 'react';
import { Search, Scale, Percent, BookOpen } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Search Your Trip',
    desc: 'Enter your departure and destination airports, preferred travel dates, and any reward points you already hold.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Compare Cash & Points',
    desc: 'Our engine queries public retail fares alongside 12+ loyalty award charts and sweet spots across airline alliances.',
    icon: Scale,
  },
  {
    step: '03',
    title: 'Understand Your Savings',
    desc: 'See the true financial equation: exact miles required, out-of-pocket taxes & fees, and real net euro savings.',
    icon: Percent,
  },
  {
    step: '04',
    title: 'Book with Confidence',
    desc: 'Follow step-by-step instructions on transferring points 1:1 and locking in your award ticket directly with the airline.',
    icon: BookOpen,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-[#087E8B] uppercase tracking-wider">
            Travel Hacking Simplified
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#073B68] mt-2">
            How A Una Milla Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            Traditional flight engines only show retail cash tickets. We show you the insider award routes that frequent flyers use to fly for up to 70% less.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 transition-all hover:shadow-sm group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-[#0B347D] flex items-center justify-center shadow-2xs group-hover:bg-[#0B347D] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-slate-200 group-hover:text-[#087E8B]/40 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-[#087E8B]">
                  <span>Step {idx + 1} of 4</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
