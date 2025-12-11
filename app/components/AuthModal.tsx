'use client';

import { useState, useCallback } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (success: boolean) => void;
}

export default function AuthModal({ isOpen, onAuthenticate }: AuthModalProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    // Usuwamy spacje i zerujemy na początku
    const d = day.trim().padStart(2, '0');
    const m = month.trim().padStart(2, '0');
    const y = year.trim().padStart(2, '23');

    // Sprawdzamy poprawność (prosta walidacja)
    if (!d || !m || !y) {
      setError('Wprowadź wszystkie wartości');
      return;
    }

    // Sprawdzamy, czy data jest poprawna
    if (d === '03' && m === '02' && y === '23') {
      setError('');
      onAuthenticate(true);
    } else {
      setError('Spróbuj ponownie – to ważna data!');
    }
  }, [day, month, year, onAuthenticate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center animate-scale-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          🔐 Dostęp tylko dla niej
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Aby wejść, wprowadź datę wejścia w związek:
        </p>
        
        <div className="flex gap-2 justify-center mb-4">
          <input
            type="text"
            placeholder="DD"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-16 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
            maxLength={2}
          />
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400 self-center">.</span>
          <input
            type="text"
            placeholder="MM"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-16 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
            maxLength={2}
          />
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400 self-center">.</span>
          <input
            type="text"
            placeholder="RR"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-16 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
            maxLength={2}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-bold transition-all"
          >
            Wejdź
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          To ważna data – wpisz ją dokładnie.
        </p>
      </div>
    </div>
  );
}
