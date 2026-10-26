import React from 'react';
import { Award, CheckSquare, Square } from 'lucide-react';
import { LOYALTY_PROGRAMS } from '../../data/loyaltyPrograms';

export function PointsInput({
  program,
  onProgramChange,
  skipPoints,
  onSkipChange,
  pointsBalance,
  onBalanceChange,
  error,
}) {
  return (
    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/90">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#087E8B]/10 text-[#087E8B] flex items-center justify-center">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Reward Points & Miles Program
          </span>
        </div>

        {/* Skip Points Toggle */}
        <button
          type="button"
          onClick={() => onSkipChange(!skipPoints)}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer focus:outline-none"
        >
          {skipPoints ? (
            <CheckSquare className="w-3.5 h-3.5 text-[#087E8B]" />
          ) : (
            <Square className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>I don&apos;t have points yet (Show cash hacks)</span>
        </button>
      </div>

      {!skipPoints ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-in fade-in duration-150">
          <div>
            <label htmlFor="points-program-select" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Select your currency / bank
            </label>
            <select
              id="points-program-select"
              value={program}
              onChange={(e) => onProgramChange(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:border-[#0B347D] focus:ring-1 focus:ring-[#0B347D] outline-none"
            >
              <optgroup label="Credit Card Points (Transferable)">
                {LOYALTY_PROGRAMS.filter((p) => p.type === 'bank').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Frequent Flyer Programs">
                {LOYALTY_PROGRAMS.filter((p) => p.type === 'airline').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label htmlFor="points-balance-input" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Your Current Balance (Optional)
            </label>
            <div className="relative">
              <input
                id="points-balance-input"
                type="number"
                min="0"
                step="1000"
                value={pointsBalance}
                onChange={(e) => onBalanceChange(e.target.value)}
                placeholder="e.g. 35,000"
                aria-invalid={Boolean(error)}
                className={`w-full text-xs font-medium bg-white border rounded-lg px-2.5 py-2 text-slate-800 outline-none ${
                  error
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-200 focus:border-[#0B347D] focus:ring-1 focus:ring-[#0B347D]'
                }`}
              />
              <span className="absolute right-2.5 top-2 text-[11px] text-slate-400 font-medium pointer-events-none">
                pts
              </span>
            </div>
            {error && (
              <p className="text-[11px] text-red-600 font-medium mt-1">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic py-1">
          No points? No problem. We&apos;ll calculate if buying points during promotional sales beats cash prices.
        </div>
      )}
    </div>
  );
}
