'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

// ==========================================================================
// Types & Interfaces
// ==========================================================================

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

interface CountdownState {
  timeLeft: TimeLeft;
  nextDay: number;
  isComplete: boolean;
  isLastTenSeconds: boolean;
  progress: number;
}

interface TimeUnitProps {
  value: number;
  label: string;
  isAnimating?: boolean;
}

// ==========================================================================
// Constants
// ==========================================================================

const SECONDS_IN_DAY = 86400;
const LAST_SECONDS_THRESHOLD = 10;
const UPDATE_INTERVAL = 1000; // 1 second

const MONTH = {
  DECEMBER: 11,
} as const;

const CALENDAR = {
  FIRST_DAY: 1,
  LAST_DAY: 24,
  COMPLETION_DAY: 25,
} as const;

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Formats number with leading zero
 */
const formatWithLeadingZero = (value: number): string => {
  return String(value).padStart(2, '0');
};

/**
 * Plays notification sound (optional)
 */
const playNotificationSound = (): void => {
  try {
    const audio = new Audio('/unlock.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    // Audio not available
  }
};

// ==========================================================================
// Custom Hook: Countdown Timer
// ==========================================================================

const useCountdownTimer = (): CountdownState => {
  const [state, setState] = useState<CountdownState>({
    timeLeft: { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
    nextDay: CALENDAR.FIRST_DAY,
    isComplete: false,
    isLastTenSeconds: false,
    progress: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousSecondsRef = useRef<number>(0);
  const hasPlayedSoundRef = useRef<boolean>(false);
  const lastUnlockToastRef = useRef<number>(0);

  /**
   * Calculates time remaining until next unlock
   */
  const calculateTimeLeft = useCallback((): CountdownState => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if not December
    if (currentMonth !== MONTH.DECEMBER) {
      const december = new Date(currentYear, MONTH.DECEMBER, CALENDAR.FIRST_DAY, 0, 0, 0);
      const difference = december.getTime() - now.getTime();

      if (difference <= 0) {
        return {
          timeLeft: { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
          nextDay: CALENDAR.FIRST_DAY,
          isComplete: false,
          isLastTenSeconds: false,
          progress: 0,
        };
      }

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        timeLeft: { hours, minutes, seconds, totalSeconds },
        nextDay: CALENDAR.FIRST_DAY,
        isComplete: false,
        isLastTenSeconds: totalSeconds <= LAST_SECONDS_THRESHOLD,
        progress: 0,
      };
    }

    // Check if all doors unlocked
    if (currentDay >= CALENDAR.LAST_DAY) {
      return {
        timeLeft: { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
        nextDay: CALENDAR.COMPLETION_DAY,
        isComplete: true,
        isLastTenSeconds: false,
        progress: 100,
      };
    }

    // Calculate time to next day
    const nextUnlockDay = Math.min(currentDay + 1, CALENDAR.LAST_DAY);
    const tomorrow = new Date(currentYear, MONTH.DECEMBER, nextUnlockDay, 0, 0, 0);
    const difference = tomorrow.getTime() - now.getTime();

    if (difference <= 0) {
      // Just unlocked - show notification
      if (lastUnlockToastRef.current !== nextUnlockDay) {
        lastUnlockToastRef.current = nextUnlockDay;
        toast.success(`🎉 Okienko ${nextUnlockDay} zostało odblokowane!`, {
          duration: 5000,
          icon: '🎁',
        });
        playNotificationSound();
      }

      return {
        timeLeft: { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
        nextDay: nextUnlockDay,
        isComplete: false,
        isLastTenSeconds: false,
        progress: 100,
      };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const progress = ((SECONDS_IN_DAY - totalSeconds) / SECONDS_IN_DAY) * 100;
    const isLastTenSeconds = totalSeconds <= LAST_SECONDS_THRESHOLD;

    // Play sound once when entering last 10 seconds
    if (isLastTenSeconds && !hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true;
      toast('⏰ Ostatnie 10 sekund!', {
        duration: 3000,
        icon: '🔥',
      });
    } else if (!isLastTenSeconds) {
      hasPlayedSoundRef.current = false;
    }

    return {
      timeLeft: { hours, minutes, seconds, totalSeconds },
      nextDay: nextUnlockDay,
      isComplete: false,
      isLastTenSeconds,
      progress,
    };
  }, []);

  useEffect(() => {
    // Initial calculation
    const initialState = calculateTimeLeft();
    setState(initialState);
    previousSecondsRef.current = initialState.timeLeft.totalSeconds;

    // Set interval with cleanup
    timerRef.current = setInterval(() => {
      const newState = calculateTimeLeft();
      setState(newState);
      previousSecondsRef.current = newState.timeLeft.totalSeconds;
    }, UPDATE_INTERVAL);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [calculateTimeLeft]);

  return state;
};

// ==========================================================================
// Custom Hook: Window Size (for Confetti)
// ==========================================================================

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

// ==========================================================================
// Component: Time Unit Display
// ==========================================================================

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label, isAnimating = false }) => {
  const formattedValue = useMemo(() => formatWithLeadingZero(value), [value]);
  const [prevValue, setPrevValue] = useState(formattedValue);

  useEffect(() => {
    if (formattedValue !== prevValue) {
      setPrevValue(formattedValue);
    }
  }, [formattedValue, prevValue]);

  return (
    <div
      className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 min-w-[70px] md:min-w-[90px] shadow-lg border-2 border-orange-200 dark:border-orange-700 transform transition-all ${
        isAnimating ? 'scale-110 animate-pulse' : 'hover:scale-105'
      }`}
    >
      <div
        className={`text-3xl md:text-4xl font-bold text-gradient text-center tabular-nums transition-all duration-300 ${
          formattedValue !== prevValue ? 'animate-bounce-slow' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {formattedValue}
      </div>
      <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 text-center mt-2 font-bold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

// ==========================================================================
// Component: Countdown Separator
// ==========================================================================

const CountdownSeparator: React.FC<{ isAnimating?: boolean }> = ({ isAnimating = false }) => (
  <div className="flex items-center px-1">
    <span
      className={`text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400 ${
        isAnimating ? 'animate-pulse' : ''
      }`}
    >
      :
    </span>
  </div>
);

// ==========================================================================
// Main Component: Countdown
// ==========================================================================

export default function Countdown() {
  const { timeLeft, nextDay, isComplete, isLastTenSeconds, progress } = useCountdownTimer();
  const [showConfetti, setShowConfetti] = useState(false);
  const windowSize = useWindowSize();

  // Show confetti on completion
  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Render completion message
  if (isComplete) {
    return (
      <>
        {showConfetti && windowSize.width > 0 && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={200}
            recycle={false}
            colors={['#ec4899', '#a855f7', '#f59e0b', '#10b981']}
          />
        )}
        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-green-300 dark:border-green-600 animate-scale-in">
          <div className="text-center">
            <div className="text-6xl md:text-7xl mb-4 animate-bounce-slow">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-200 mb-3 font-playfair">
              Gratulacje!
            </h2>
            <p className="text-lg md:text-xl text-green-700 dark:text-green-300 mb-2">
              Wszystkie okienka zostały odblokowane!
            </p>
            <p className="text-sm md:text-base text-green-600 dark:text-green-400">
              Masz teraz dostęp do wszystkich 24 kuponów! ❤️
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 px-6 py-3 rounded-full">
              <span className="text-2xl">🎁</span>
              <span className="font-bold text-green-800 dark:text-green-200">24/24 Odblokownych</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main countdown display
  return (
    <div
      className={`glass-strong rounded-3xl p-6 md:p-8 shadow-2xl border-2 transition-all duration-300 ${
        isLastTenSeconds
          ? 'border-red-400 dark:border-red-600 animate-glow-pulse'
          : 'border-orange-300 dark:border-orange-600'
      }`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className={`text-3xl md:text-4xl ${isLastTenSeconds ? 'animate-bounce' : ''}`}>
            ⏰
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 font-playfair">
            Następne okienko
          </h2>
        </div>
        <p className="text-sm md:text-base text-orange-700 dark:text-orange-300 font-medium">
          Okienko <strong>#{nextDay}</strong> {isLastTenSeconds ? 'już za chwilę!' : 'wkrótce dostępne'}
        </p>
        {isLastTenSeconds && (
          <p className="text-xs md:text-sm text-red-600 dark:text-red-400 font-bold mt-2 animate-pulse">
            🔥 OSTATNIE SEKUNDY! 🔥
          </p>
        )}
      </div>

      {/* Timer Display */}
      <div className="flex justify-center items-center gap-2 md:gap-3 mb-6">
        <TimeUnit value={timeLeft.hours} label="Godzin" isAnimating={isLastTenSeconds} />
        <CountdownSeparator isAnimating={isLastTenSeconds} />
        <TimeUnit value={timeLeft.minutes} label="Minut" isAnimating={isLastTenSeconds} />
        <CountdownSeparator isAnimating={isLastTenSeconds} />
        <TimeUnit value={timeLeft.seconds} label="Sekund" isAnimating={isLastTenSeconds} />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="bg-orange-200 dark:bg-orange-900 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isLastTenSeconds
                ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs md:text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Postęp: {Math.round(progress)}%
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-mono">
            {timeLeft.totalSeconds}s
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-4 py-2 rounded-full text-xs md:text-sm">
          <span className="text-orange-600 dark:text-orange-400 font-bold">
            {CALENDAR.LAST_DAY - nextDay + 1} okienek pozostało
          </span>
        </div>
      </div>
    </div>
  );
}
