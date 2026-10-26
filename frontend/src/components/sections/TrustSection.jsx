import React from 'react';
import { ShieldCheck, Calculator, Landmark, CheckCircle } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="py-14 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Column 1 */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#087E8B]/10 text-[#087E8B] flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Transparent Point Valuations
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Points aren&apos;t free money. We conservatively value transferable points at 1.2¢ – 1.6¢ each to ensure your calculated savings represent genuine financial gain over cash tickets.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#0B347D]/10 text-[#0B347D] flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Zero Hidden Surcharges
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Many award engines hide mandatory airport taxes and carrier fuel fees. We itemize every cent of out-of-pocket cash so you are never surprised at checkout.
              </p>
            </div>

            {/* Column 3 */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                100% Legit Airline Booking
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never buy or sell miles through third-party brokers. Every hack uses official 1:1 bank-to-airline transfers and direct airline portal checkout.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
