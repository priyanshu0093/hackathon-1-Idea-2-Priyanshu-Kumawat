import { useState, useCallback, useRef, useEffect } from 'react';
import { validateQuickFlight, validateFullTrip } from '../lib/validator';
import { searchFlights } from '../services/flightService';
import { buildSavingsComparison } from '../services/savingsService';

// Helper to get formatted default future dates
function getDefaultDates() {
  const today = new Date();
  const depart = new Date(today);
  depart.setDate(today.getDate() + 18);

  const returnDate = new Date(today);
  returnDate.setDate(today.getDate() + 27);

  const leg2Date = new Date(today);
  leg2Date.setDate(today.getDate() + 22);

  const formatDate = (d) => d.toISOString().split('T')[0];

  return {
    departureDate: formatDate(depart),
    returnDate: formatDate(returnDate),
    leg1Date: formatDate(depart),
    leg2Date: formatDate(leg2Date),
  };
}

const DEFAULT_DATES = getDefaultDates();

export function useFlightSearch() {
  const [activeMode, setActiveMode] = useState('quick'); // 'quick' | 'full'
  const [dataSourceMode, setDataSourceMode] = useState('live'); // 'live' | 'demo'

  // Search form state
  const [formData, setFormData] = useState({
    // Quick flight fields
    origin: 'MAD',
    destination: 'JFK',
    tripType: 'round_trip', // 'round_trip' | 'one_way'
    departureDate: DEFAULT_DATES.departureDate,
    returnDate: DEFAULT_DATES.returnDate,
    travelers: 1,
    cabin: 'economy',
    isFlexibleDates: true,
    pointsProgram: 'amex_mr',
    pointsBalance: '35000',
    skipPoints: false,

    // Full Trip Multi-Stop Legs
    legs: [
      { id: 'leg-1', origin: 'MAD', destination: 'LIS', date: DEFAULT_DATES.leg1Date },
      { id: 'leg-2', origin: 'LIS', destination: 'JFK', date: DEFAULT_DATES.leg2Date },
    ],
    enableStopover: false,
    includeNearbyAirports: true,
    maxStops: 'all',
  });

  // Validation errors
  const [quickValidationErrors, setQuickValidationErrors] = useState({});
  const [fullValidationErrors, setFullValidationErrors] = useState({});
  const [legErrors, setLegErrors] = useState([]);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  // AbortController ref to safely cancel outdated in-flight requests
  const abortControllerRef = useRef(null);

  // Field updates with instant field-level error clearing
  const updateField = useCallback((field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'departureDate' && updated.returnDate < value) {
        updated.returnDate = value;
      }
      return updated;
    });

    // Clear specific error
    setQuickValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });

    setFullValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  // Multi-stop leg management without data loss
  const addLeg = useCallback(() => {
    setFormData((prev) => {
      if (prev.legs.length >= 5) return prev;
      const lastLeg = prev.legs[prev.legs.length - 1];
      const nextDate = new Date(lastLeg.date + 'T00:00:00');
      nextDate.setDate(nextDate.getDate() + 3);

      const newLeg = {
        id: `leg-${Date.now()}`,
        origin: lastLeg.destination,
        destination: 'MIA',
        date: nextDate.toISOString().split('T')[0],
      };

      return {
        ...prev,
        legs: [...prev.legs, newLeg],
      };
    });
  }, []);

  const removeLeg = useCallback((index) => {
    setFormData((prev) => {
      if (prev.legs.length <= 2) return prev;
      const updatedLegs = prev.legs.filter((_, i) => i !== index);
      return {
        ...prev,
        legs: updatedLegs,
      };
    });
  }, []);

  const updateLeg = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updatedLegs = [...prev.legs];
      updatedLegs[index] = { ...updatedLegs[index], [field]: value };
      return {
        ...prev,
        legs: updatedLegs,
      };
    });

    // Clear leg error
    setLegErrors((prev) => {
      if (!prev[index] || !prev[index][field]) return prev;
      const updated = [...prev];
      const legErrCopy = { ...updated[index] };
      delete legErrCopy[field];
      updated[index] = legErrCopy;
      return updated;
    });
  }, []);

  // Swap origin and destination
  const swapAirports = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
    setQuickValidationErrors({});
  }, []);

  // Search execution
  const executeSearch = useCallback(async (paramsToSearch, overrideOptions = {}) => {
    // Abort previous in-flight request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);
    setLastSearchParams(paramsToSearch);

    const isDemoQuery = overrideOptions.useDemo ?? (dataSourceMode === 'demo');

    try {
      const flightOffers = await searchFlights(paramsToSearch, {
        signal: controller.signal,
        useDemo: isDemoQuery,
      });

      const userBalanceNum = paramsToSearch.skipPoints ? 0 : Number(paramsToSearch.pointsBalance) || 0;

      const comparison = buildSavingsComparison(flightOffers, {
        tripType: paramsToSearch.tripType,
        travelers: paramsToSearch.travelers,
        userPointsBalance: userBalanceNum,
      });

      setSearchResult(comparison);
      setIsSearching(false);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      setSearchError(err.message || 'Unable to retrieve flight options.');
      setIsSearching(false);
    }
  }, [dataSourceMode]);

  // Form submit handler
  const handleSearch = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (activeMode === 'quick') {
      const validation = validateQuickFlight(formData);
      if (!validation.isValid) {
        setQuickValidationErrors(validation.errors);
        return;
      }
      setQuickValidationErrors({});
      executeSearch({
        origin: formData.origin,
        destination: formData.destination,
        tripType: formData.tripType,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate,
        travelers: formData.travelers,
        cabin: formData.cabin,
        isFlexibleDates: formData.isFlexibleDates,
        pointsProgram: formData.pointsProgram,
        pointsBalance: formData.pointsBalance,
        skipPoints: formData.skipPoints,
      });
    } else {
      const validation = validateFullTrip(formData);
      if (!validation.isValid) {
        setFullValidationErrors(validation.errors);
        setLegErrors(validation.legErrors);
        return;
      }
      setFullValidationErrors({});
      setLegErrors([]);
      executeSearch({
        origin: formData.legs[0].origin,
        destination: formData.legs[formData.legs.length - 1].destination,
        tripType: 'multi_city',
        travelers: formData.travelers,
        cabin: formData.cabin,
        isFlexibleDates: formData.isFlexibleDates,
        pointsProgram: formData.pointsProgram,
        pointsBalance: formData.pointsBalance,
        skipPoints: formData.skipPoints,
        stopover: formData.enableStopover,
        legs: formData.legs,
      });
    }
  }, [activeMode, formData, executeSearch]);

  // Set preset route from popular picks (can run as demo hack)
  const applyPresetRoute = useCallback((origin, destination, cabin = 'economy', options = {}) => {
    setFormData((prev) => ({
      ...prev,
      origin,
      destination,
      cabin,
    }));
    setActiveMode('quick');
    setQuickValidationErrors({});

    executeSearch({
      origin,
      destination,
      tripType: formData.tripType,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      travelers: formData.travelers,
      cabin,
      isFlexibleDates: formData.isFlexibleDates,
      pointsProgram: formData.pointsProgram,
      pointsBalance: formData.pointsBalance,
      skipPoints: formData.skipPoints,
    }, options);
  }, [formData, executeSearch]);

  // Retry previous search
  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      executeSearch(lastSearchParams);
    }
  }, [lastSearchParams, executeSearch]);

  // Switch to demo mode
  const switchToDemo = useCallback(() => {
    setDataSourceMode('demo');
    if (lastSearchParams) {
      executeSearch(lastSearchParams, { useDemo: true });
    }
  }, [lastSearchParams, executeSearch]);

  // Trigger initial search once on mount
  useEffect(() => {
    executeSearch({
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'round_trip',
      departureDate: DEFAULT_DATES.departureDate,
      returnDate: DEFAULT_DATES.returnDate,
      travelers: 1,
      cabin: 'economy',
      pointsProgram: 'amex_mr',
      pointsBalance: '35000',
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeSearch]);

  return {
    activeMode,
    setActiveMode,
    dataSourceMode,
    setDataSourceMode,
    formData,
    updateField,
    swapAirports,
    addLeg,
    removeLeg,
    updateLeg,
    applyPresetRoute,
    isSearching,
    searchResult,
    searchError,
    quickValidationErrors,
    fullValidationErrors,
    legErrors,
    handleSearch,
    retrySearch,
    switchToDemo,
  };
}
