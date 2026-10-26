import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Plus, Minus, Check } from 'lucide-react';
import { CABIN_CLASSES } from '../../data/loyaltyPrograms';

export function TravelersSelector({
  travelers = 1,
  cabin = 'economy',
  onTravelersChange,
  onCabinChange,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedCabin = CABIN_CLASSES.find((c) => c.id === cabin) || CABIN_CLASSES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
        Travelers & Cabin
      </label>

      {/* Button trigger */}
      <button
        type="button"
        id="travelers-cabin-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        className={`w-full text-left bg-white border rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group shadow-2xs ${
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
            : 'border-slate-200 hover:border-slate-300 focus:border-[#0B347D] focus:ring-2 focus:ring-[#0B347D]/15'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#0B347D]/5 group-hover:text-[#0B347D] transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#202B35] leading-tight">
              {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
            </p>
            <p className="text-xs text-[#087E8B] font-medium mt-0.5">
              {selectedCabin.label}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="text-[11px] text-red-600 font-medium mt-1 animate-in fade-in">
          {error}
        </p>
      )}

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-sm font-bold text-slate-800">Passengers</span>
                <p className="text-xs text-slate-500">Ages 12 and above</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onTravelersChange(Math.max(1, travelers - 1))}
                  disabled={travelers <= 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Decrease passenger count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-4 text-center text-slate-800">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => onTravelersChange(Math.min(9, travelers + 1))}
                  disabled={travelers >= 9}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Increase passenger count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Cabin Class
            </span>
            <div className="space-y-1.5">
              {CABIN_CLASSES.map((item) => {
                const isSelected = item.id === cabin;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onCabinChange(item.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#0B347D] text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">{item.label}</span>
                      <span className={`ml-2 text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        • {item.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
