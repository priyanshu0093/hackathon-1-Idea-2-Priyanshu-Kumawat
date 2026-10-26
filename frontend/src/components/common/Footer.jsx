import React from 'react';
import { Plane, Heart } from 'lucide-react';


export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#087E8B] to-[#18A6C9] flex items-center justify-center text-white">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-lg font-bold tracking-tight">A Una Milla de Tu Destino</span>
            </div>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Empowering savvy travelers to discover the spread between retail cash airfares and high-value points sweet spots. Same trip. Much less money.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              Phase 1 Prototype built for the Travel Hacking Hackathon.
            </p>
          </div>

          {/* Supported Alliances */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Supported Programs
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Iberia Plus & British Airways (Avios)</li>
              <li>Air France - KLM Flying Blue</li>
              <li>American Express Membership Rewards</li>
              <li>Chase Ultimate Rewards</li>
              <li>Qatar Airways Privilege Club</li>
              <li>Lufthansa Miles & More</li>
            </ul>
          </div>

          {/* Legal / Disclaimers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Disclaimer & Notice
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demonstration fares and valuations are for illustrative travel-hacking comparison purposes. Flight bookings and award redemptions occur solely on official airline websites.
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} A Una Milla de Tu Destino. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Valuation Methodology</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
