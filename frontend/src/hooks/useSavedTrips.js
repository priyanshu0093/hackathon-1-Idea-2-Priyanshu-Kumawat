import { useState, useEffect } from 'react';
import { fetchPersistedTrips, persistTrip, deletePersistedTrip } from '../services/tripService';

const STORAGE_KEY = 'a_una_milla_saved_trips';

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Attempt server sync if token exists
  useEffect(() => {
    async function syncWithServer() {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('a_una_milla_token') : null;
      if (!token) return;

      try {
        const serverTrips = await fetchPersistedTrips();
        if (serverTrips && serverTrips.length > 0) {
          setSavedTrips((local) => {
            const merged = [...local];
            for (const st of serverTrips) {
              const exists = merged.some((lt) => lt.id === st.id);
              if (!exists) {
                merged.push({
                  ...st,
                  originCity: st.metadata?.originCity || st.origin,
                  destinationCity: st.metadata?.destinationCity || st.destination,
                  metrics: {
                    savingsEuro: parseFloat(st.estimatedSavings) || 0,
                    totalPoints: st.pointsCost || 0,
                  },
                });
              }
            }
            return merged;
          });
        }
      } catch {
        // Fallback silently to localStorage
      }
    }

    syncWithServer();
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTrips));
      }
    } catch (e) {
      console.warn('Failed to save trips to local storage', e);
    }
  }, [savedTrips]);

  const toggleSaveTrip = async (trip) => {
    if (!trip) return;

    const exists = savedTrips.some(
      (t) => t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin)
    );

    if (exists) {
      const tripToRemove = savedTrips.find(
        (t) => t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin)
      );
      setSavedTrips((prev) =>
        prev.filter((t) => !(t.id === trip.id || (t.origin === trip.origin && t.destination === trip.destination && t.cabin === trip.cabin)))
      );
      if (tripToRemove?.id) {
        deletePersistedTrip(tripToRemove.id).catch(() => {});
      }
    } else {
      const newTrip = {
        ...trip,
        savedAt: new Date().toISOString(),
      };
      setSavedTrips((prev) => [newTrip, ...prev]);
      persistTrip(newTrip).catch(() => {});
    }
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
