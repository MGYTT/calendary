'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Odczyt tylko po montażu i gdy jest window
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading localStorage key', key, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  // Zapis tylko gdy już zhydradowane i jest window
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing localStorage key', key, error);
    }
  }, [key, value, isHydrated]);

  return [value, setValue, isHydrated] as const;
}