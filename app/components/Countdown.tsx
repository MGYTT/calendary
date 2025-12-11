'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Typy dla lepszej czytelności kodu
interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownState {
  timeLeft: TimeLeft;
  nextDay: number;
  isComplete: boolean;
}

// Custom hook dla timera z cleanup
const useCountdownTimer = (): CountdownState => {
  const [state, setState] = useState<CountdownState>({
    timeLeft: { hours: 0, minutes: 0, seconds: 0 },
    nextDay: 1,
    isComplete: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Obliczanie czasu do następnego dnia - zmemoizowane dla wydajności
  const calculateTimeLeft = useCallback((): CountdownState => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Sprawdzenie czy grudzień
    if (currentMonth !== 11) {
      // Odliczanie do 1 grudnia
      const december = new Date(currentYear, 11, 1, 0, 0, 0);
      const difference = december.getTime() - now.getTime();

      if (difference <= 0) {
        return {
          timeLeft: { hours: 0, minutes: 0, seconds: 0 },
          nextDay: 1,
          isComplete: false,
        };
      }

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        timeLeft: { hours, minutes, seconds },
        nextDay: 1,
        isComplete: false,
      };
    }

    // Sprawdzenie czy wszystkie okienka zostały odblokowane
    if (currentDay >= 24) {
      return {
        timeLeft: { hours: 0, minutes: 0, seconds: 0 },
        nextDay: 25,
        isComplete: true,
      };
    }

    // Odliczanie do następnego dnia w grudniu
    const nextUnlockDay = Math.min(currentDay + 1, 24);
    const tomorrow = new Date(currentYear, 11, nextUnlockDay, 0, 0, 0);
    const difference = tomorrow.getTime() - now.getTime();

    if (difference <= 0) {
      return {
        timeLeft: { hours: 0, minutes: 0, seconds: 0 },
        nextDay: nextUnlockDay,
        isComplete: false,
      };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      timeLeft: { hours, minutes, seconds },
      nextDay: nextUnlockDay,
      isComplete: false,
    };
  }, []);

  useEffect(() => {
    // Inicjalne obliczenie
    setState(calculateTimeLeft());

    // Ustawienie interwału z cleanup
    timerRef.current = setInterval(() => {
      setState(calculateTimeLeft());
    }, 1000);

    // Cleanup function - zapobiega memory leaks
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [calculateTimeLeft]);

  return state;
};

// Komponent wyświetlający pojedynczy element licznika
interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label }) => {
  // Formatowanie z wiodącym zerem
  const formattedValue = useMemo(() => 
    String(value).padStart(2, '0'), 
    [value]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 min-w-[80px] shadow-md transform transition-all hover:scale-105">
      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 text-center tabular-nums">
        {formattedValue}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1 font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
};

// Główny komponent Countdown
export default function Countdown() {
  const { timeLeft, nextDay, isComplete } = useCountdownTimer();

  // Renderowanie komunikatu o zakończeniu
  if (isComplete) {
    return (
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-2xl p-6 shadow-lg border-2 border-green-200 dark:border-green-700 animate-pulse-slow">
        <p className="text-2xl font-bold text-green-800 dark:text-green-200 text-center flex items-center justify-center gap-3">
          <span className="text-4xl">🎉</span>
          Wszystkie okienka zostały odblokowane!
          <span className="text-4xl">🎉</span>
        </p>
        <p className="text-sm text-green-700 dark:text-green-300 text-center mt-2">
          Masz teraz dostęp do wszystkich 24 kuponów! ❤️
        </p>
      </div>
    );
  }

  // Główny licznik
  return (
    <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-2xl p-6 shadow-lg border-2 border-orange-200 dark:border-orange-700">
      <div className="text-center mb-4">
        <p className="text-gray-700 dark:text-gray-200 font-bold text-lg mb-1">
          ⏰ Następne okienko się otworzy za:
        </p>
        <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">
          Okienko nr {nextDay} już wkrótce dostępne!
        </p>
      </div>
      
      <div className="flex justify-center gap-3 md:gap-4">
        <TimeUnit value={timeLeft.hours} label="Godzin" />
        <div className="flex items-center">
          <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">:</span>
        </div>
        <TimeUnit value={timeLeft.minutes} label="Minut" />
        <div className="flex items-center">
          <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">:</span>
        </div>
        <TimeUnit value={timeLeft.seconds} label="Sekund" />
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="bg-orange-200 dark:bg-orange-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-orange-600 dark:bg-orange-400 h-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${((86400 - (timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds)) / 86400) * 100}%` 
            }}
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
          Postęp do odblokowania
        </p>
      </div>
    </div>
  );
}
