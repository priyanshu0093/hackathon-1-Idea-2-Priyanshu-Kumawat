import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce values (e.g. airport autocomplete queries)
 * 
 * @param {any} value
 * @param {number} delayMs
 * @returns {any} Debounced value
 */
export function useDebounce(value, delayMs = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
