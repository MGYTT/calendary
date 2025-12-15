'use client';

import { Coupon } from '../coupons';
import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// ==========================================================================
// Types & Interfaces
// ==========================================================================

interface DoorProps {
  coupon: Coupon;
  isUnlocked: boolean;
  isRedeemed: boolean;
  onClick: () => void;
}

interface CardFaceProps {
  emoji: string;
  title?: string;
  isBack?: boolean;
  gradient: string;
  category?: string;
}

// ==========================================================================
// Constants
// ==========================================================================

const ANIMATION_DURATION = {
  FLIP: 350,
  SHAKE: 500,
  NEW_BADGE: 10000,
  SPARKLES: 2000,
} as const;

const DECEMBER_MONTH = 11;

const UNLOCK_CHECK_HOURS = 24;

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Calculates days until door unlocks
 */
const calculateDaysUntil = (doorDay: number): number => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();

  if (currentMonth !== DECEMBER_MONTH) return doorDay;

  return Math.max(0, doorDay - currentDay);
};

/**
 * Checks if date is today
 */
const isDateToday = (day: number): boolean => {
  const today = new Date();
  return today.getDate() === day && today.getMonth() === DECEMBER_MONTH;
};

/**
 * Checks if door was recently unlocked
 */
const isRecentlyUnlocked = (doorDay: number): boolean => {
  const unlockDate = new Date();
  unlockDate.setDate(doorDay);
  const now = new Date();
  const hoursSinceUnlock = (now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60);

  return hoursSinceUnlock < UNLOCK_CHECK_HOURS && hoursSinceUnlock > 0;
};

// ==========================================================================
// Sub-Components
// ==========================================================================

/**
 * Day Badge - displays day number
 */
const DayBadge = memo(({ day, isToday }: { day: number; isToday: boolean }) => (
  <div
    className={`absolute -top-2 -right-2 ${
      isToday
        ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-pulse-slow ring-4 ring-yellow-300 dark:ring-yellow-600 shadow-xl'
        : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg'
    } text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-sm md:text-base border-2 border-white dark:border-gray-800 z-10 transition-all duration-300`}
    aria-label={`Dzień ${day}`}
  >
    {day}
    {isToday && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
    )}
  </div>
));

DayBadge.displayName = 'DayBadge';

/**
 * Lock Overlay - shows lock for locked doors
 */
const LockOverlay = memo(({ daysUntil }: { daysUntil: number }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-black/85 to-gray-900/80 dark:from-black/90 dark:to-gray-900/95 rounded-2xl flex items-center justify-center backdrop-blur-md z-20 transition-all duration-300">
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <span
        className="text-5xl md:text-6xl drop-shadow-2xl animate-bounce-slow filter"
        role="img"
        aria-label="Zablokowane"
      >
        🔒
      </span>
      <span className="text-white text-xs md:text-sm font-bold bg-black/60 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
        {daysUntil === 0 ? '🎉 Dziś!' : daysUntil === 1 ? '⏰ Jutro' : `⏳ Za ${daysUntil} dni`}
      </span>
    </div>
  </div>
));

LockOverlay.displayName = 'LockOverlay';

/**
 * Redeemed Badge - shows checkmark for redeemed coupons
 */
const RedeemedBadge = memo(() => (
  <div className="absolute -bottom-2 -left-2 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-xl border-2 border-white dark:border-gray-800 z-10 animate-pop-in">
    <span className="text-xl md:text-2xl" role="img" aria-label="Odebrane">
      ✓
    </span>
  </div>
));

RedeemedBadge.displayName = 'RedeemedBadge';

/**
 * New Badge - for newly unlocked doors
 */
const NewBadge = memo(() => (
  <div className="absolute -top-2 -left-2 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white rounded-full px-3 py-1.5 text-xs md:text-sm font-bold shadow-xl border-2 border-white dark:border-gray-800 z-10 animate-bounce">
    ✨ NOWE!
  </div>
));

NewBadge.displayName = 'NewBadge';

/**
 * Card Face - front or back of the card
 */
const CardFace = memo(({ emoji, title, isBack = false, gradient, category }: CardFaceProps) => (
  <div
    className={`
      backface-hidden absolute inset-0 w-full h-full rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center
      ${gradient}
      shadow-2xl border-2 border-white/30
      ${isBack ? 'backdrop-blur-sm' : ''}
    `}
    style={{
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
    }}
  >
    <div
      className={`text-5xl md:text-6xl lg:text-7xl mb-2 md:mb-3 drop-shadow-2xl filter ${
        !isBack ? 'animate-float' : ''
      }`}
      role="img"
      aria-label={title || 'Emoji'}
    >
      {emoji}
    </div>
    {title && (
      <div className="text-white text-center font-bold text-xs md:text-sm lg:text-base drop-shadow-lg px-2 line-clamp-2 max-w-full">
        {title}
      </div>
    )}
    {category && (
      <div className="mt-2 md:mt-3 text-white/90 text-[10px] md:text-xs font-semibold bg-white/25 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
        {category}
      </div>
    )}
  </div>
));

CardFace.displayName = 'CardFace';

/**
 * Sparkle Effect Component
 */
const SparkleEffect = memo(() => (
  <>
    <div
      className="absolute top-2 right-2 text-xl md:text-2xl animate-ping pointer-events-none"
      aria-hidden="true"
    >
      ✨
    </div>
    <div
      className="absolute bottom-2 left-2 text-xl md:text-2xl animate-ping pointer-events-none"
      style={{ animationDelay: '0.2s' }}
      aria-hidden="true"
    >
      ⭐
    </div>
    <div
      className="absolute top-2 left-2 text-xl md:text-2xl animate-ping pointer-events-none"
      style={{ animationDelay: '0.4s' }}
      aria-hidden="true"
    >
      💫
    </div>
  </>
));

SparkleEffect.displayName = 'SparkleEffect';

// ==========================================================================
// Main Component
// ==========================================================================

const Door = ({ coupon, isUnlocked, isRedeemed, onClick }: DoorProps) => {
  // State
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [shake, setShake] = useState(false);

  // Refs
  const newBadgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sparkleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized values
  const isToday = useMemo(() => isDateToday(coupon.day), [coupon.day]);
  const daysUntil = useMemo(() => calculateDaysUntil(coupon.day), [coupon.day]);

  // Check if door was recently unlocked
  useEffect(() => {
    if (isUnlocked && !isRedeemed && isRecentlyUnlocked(coupon.day)) {
      setIsNew(true);
      newBadgeTimerRef.current = setTimeout(() => {
        setIsNew(false);
      }, ANIMATION_DURATION.NEW_BADGE);
    }

    return () => {
      if (newBadgeTimerRef.current) {
        clearTimeout(newBadgeTimerRef.current);
      }
    };
  }, [isUnlocked, isRedeemed, coupon.day]);

  // Sparkle effect for unlocked doors on hover
  useEffect(() => {
    if (isUnlocked && !isRedeemed && isHovered) {
      setShowSparkles(true);
      sparkleTimerRef.current = setTimeout(() => {
        setShowSparkles(false);
      }, ANIMATION_DURATION.SPARKLES);
    } else {
      setShowSparkles(false);
    }

    return () => {
      if (sparkleTimerRef.current) {
        clearTimeout(sparkleTimerRef.current);
      }
    };
  }, [isUnlocked, isRedeemed, isHovered]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (newBadgeTimerRef.current) clearTimeout(newBadgeTimerRef.current);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  // Shake animation trigger
  const triggerShake = useCallback(() => {
    setShake(true);
    shakeTimerRef.current = setTimeout(() => {
      setShake(false);
    }, ANIMATION_DURATION.SHAKE);
  }, []);

  // Memoized CSS classes
  const cardClasses = useMemo(() => {
    const classes = [
      'card-flip-transition',
      'relative',
      'w-full',
      'h-full',
      'transform-style-3d',
      'cursor-pointer',
      'gpu-accelerate',
    ];

    if (isFlipped) classes.push('rotate-y-180');
    if (!isUnlocked) classes.push('cursor-not-allowed');
    else classes.push('hover:scale-105', 'active:scale-95');
    if (isPressed) classes.push('scale-95');
    if (shake) classes.push('animate-shake');
    if (isRedeemed) classes.push('opacity-75');

    return classes.join(' ');
  }, [isFlipped, isUnlocked, isPressed, shake, isRedeemed]);

  // Status text for accessibility
  const statusText = useMemo(() => {
    if (!isUnlocked) return `Odblokuje się ${coupon.day} grudnia`;
    if (isRedeemed) return 'Kupon został odebrany';
    return 'Kliknij aby otworzyć kupon';
  }, [isUnlocked, isRedeemed, coupon.day]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleClick = useCallback(() => {
    if (!isUnlocked) {
      triggerShake();
      toast.error(
        `Okienko ${coupon.day} otworzy się ${coupon.day} grudnia! 🗓️`,
        {
          icon: '🔒',
          duration: 3000,
        }
      );
      return;
    }

    // Success feedback
    if (!isRedeemed) {
      toast.success(`Otwierasz okienko ${coupon.day}! 🎉`, {
        icon: coupon.emoji,
        duration: 2000,
      });
    }

    // Visual flip effect
    setIsFlipped(true);

    // Reset flip and call onClick after animation
    flipTimerRef.current = setTimeout(() => {
      setIsFlipped(false);
      onClick();
    }, ANIMATION_DURATION.FLIP);
  }, [isUnlocked, isRedeemed, onClick, coupon.day, coupon.emoji, triggerShake]);

  const handleMouseDown = useCallback(() => {
    if (isUnlocked) setIsPressed(true);
  }, [isUnlocked]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="relative aspect-square perspective-1000">
      {/* Day Badge */}
      <DayBadge day={coupon.day} isToday={isToday} />

      {/* New Badge */}
      {isNew && !isRedeemed && <NewBadge />}

      {/* Redeemed Badge */}
      {isRedeemed && <RedeemedBadge />}

      {/* Card Container */}
      <div
        role="button"
        tabIndex={isUnlocked ? 0 : -1}
        aria-label={`Okienko ${coupon.day}: ${coupon.title}. ${statusText}`}
        aria-disabled={!isUnlocked}
        aria-pressed={isFlipped}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onKeyDown={handleKeyDown}
        className={cardClasses}
      >
        {/* Front Face */}
        <CardFace emoji={coupon.emoji} gradient={coupon.color} />

        {/* Back Face */}
        <CardFace
          emoji="🎁"
          title={coupon.title}
          category={coupon.category}
          isBack={true}
          gradient="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600"
        />

        {/* Lock Overlay */}
        {!isUnlocked && <LockOverlay daysUntil={daysUntil} />}
      </div>

      {/* Hover Glow Effect */}
      {isUnlocked && !isFlipped && (
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/0 via-purple-500/40 to-pink-500/0 transition-opacity duration-500 pointer-events-none -z-10 blur-2xl ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Today Indicator Ring */}
      {isToday && isUnlocked && !isRedeemed && (
        <div
          className="absolute inset-0 rounded-2xl border-4 border-yellow-400 animate-pulse pointer-events-none -z-10 shadow-2xl shadow-yellow-400/50"
          aria-hidden="true"
        />
      )}

      {/* Sparkle Effect */}
      {showSparkles && <SparkleEffect />}

      {/* Redeemed Overlay Effect */}
      {isRedeemed && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-2xl pointer-events-none backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// ==========================================================================
// Export with Memoization
// ==========================================================================

export default memo(Door, (prevProps, nextProps) => {
  return (
    prevProps.coupon.id === nextProps.coupon.id &&
    prevProps.isUnlocked === nextProps.isUnlocked &&
    prevProps.isRedeemed === nextProps.isRedeemed
  );
});
