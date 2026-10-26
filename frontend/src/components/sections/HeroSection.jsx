import React from 'react';
import { Sparkles, Shield, ArrowUpRight, TrendingDown } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#073B68] via-[#09487E] to-[#087E8B] text-white pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Subtle radial glow & clean geometric grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Value badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Real-World Travel Hacking & Award Valuation</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Same trip. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200">Much less money.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
          Compare standard airline cash prices with insider award sweet spots, points transfer bonuses, and route hacks. Unlock business class for economy prices.
        </p>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-cyan-100/90 font-medium">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-emerald-300" />
            <span>Average 58% cash savings</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-300" />
            <span>Official airline booking methods</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>12+ Transferable Point Programs</span>
          </div>
        </div>

      </div>
    </section>
  );
}
