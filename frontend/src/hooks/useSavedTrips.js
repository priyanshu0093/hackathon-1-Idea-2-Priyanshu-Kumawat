import { useState, useEffect } from 'react';

const STORAGE_KEY = 'a_una_milla_saved_trips';

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTrips));
    } catch (e) {
      console.warn('Failed to save trips to local storage', e);
    }
  }, [savedTrips]);

  const toggleSaveTrip = (trip) => {
    setSavedTrips((prev) => {
      const exists = prev.some((t) => t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin));
      if (exists) {
        return prev.filter((t) => !(t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin)));
      } else {
        return [
          {
            ...trip,
            savedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
    });
  };

  const isTripSaved = (trip) => {
    if (!trip) return false;
    return savedTrips.some(
      (t) => t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin)
    );
  };

  return {
    savedTrips,
    toggleSaveTrip,
    isTripSaved,
    savedCount: savedTrips.length,
  };
}
