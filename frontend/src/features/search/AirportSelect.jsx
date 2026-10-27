import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { AIRPORTS } from '../../data/airports';
import { useDebounce } from '../../hooks/useDebounce';
import { searchAirports } from '../../services/airportService';

export function AirportSelect({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Select city or airport',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [airports, setAirports] = useState(AIRPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const wrapperRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Find selected airport details from active list or local reference
  const selectedAirport =
    airports.find((a) => a.code === value) ||
    AIRPORTS.find((a) => a.code === value) || {
      code: value,
      city: value,
      name: 'Selected Airport',
      country: '',
      flag: '✈️',
    };

  // Perform search whenever debouncedQuery changes and dropdown is open
  const fetchAirportResults = useCallback(async (query) => {
    // Abort previous in-flight request to prevent race conditions & stale results
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);

    try {
      const results = await searchAirports(query, { signal: controller.signal });
      setAirports(results);
      setIsLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request superseded by newer input
        return;
      }
      setFetchError(err.message || 'Error searching airports');
      setIsLoading(false);
    }
  }, []);

  // Trigger search on debounced query change when open
  useEffect(() => {
    if (isOpen) {
      fetchAirportResults(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, fetchAirportResults]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1 tracking-wide">
        {label}
      </label>

      {/* Button / Select Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        className={`w-full text-left bg-white border rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group shadow-2xs ${
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
            : 'border-slate-200 hover:border-slate-300 focus:border-[#0B347D] focus:ring-2 focus:ring-[#0B347D]/15'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700 group-hover:bg-[#0B347D]/5 group-hover:text-[#0B347D] transition-colors">
            <span className="text-sm font-bold">{selectedAirport.code}</span>
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-[#202B35] truncate leading-tight">
              {selectedAirport.city} ({selectedAirport.code})
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {selectedAirport.name}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Inline Field Error */}
      {error && (
        <p className="text-[11px] text-red-600 font-medium mt-1 animate-in fade-in">
          {error}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input Bar */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#087E8B] animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <input
              type="text"
              className="w-full text-sm bg-transparent outline-none placeholder-slate-400 text-slate-800"
              placeholder={placeholder || 'Search airport, city, or IATA code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Results List */}
          <div className="overflow-y-auto py-1 divide-y divide-slate-50">
            {fetchError && (
              <div className="px-3.5 py-2 text-xs text-amber-700 bg-amber-50 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Using offline dataset: {fetchError}</span>
              </div>
            )}

            {airports.length > 0 ? (
              airports.map((airport) => {
                const isSelected = airport.code === value;
                return (
                  <button
                    key={airport.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(airport.code);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-[#0B347D]/5 text-[#0B347D]' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{airport.flag || '✈️'}</span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{airport.city}</span>
                          <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {airport.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[210px] sm:max-w-xs">
                          {airport.name}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0B347D] shrink-0" />}
                  </button>
                );
              })
            ) : !isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching airports found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
