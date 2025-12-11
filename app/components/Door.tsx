'use client';

import { Coupon } from '../coupons';
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';

// Typy dla props
interface DoorProps {
  coupon: Coupon;
  isUnlocked: boolean;
  isRedeemed: boolean;
  onClick: () => void;
}

// Komponent Day Badge - wyświetla numer dnia
const DayBadge = memo(({ day, isToday }: { day: number; isToday: boolean }) => (
  <div 
    className={`absolute -top-2 -right-2 ${
      isToday 
        ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-pulse-slow ring-4 ring-yellow-300 dark:ring-yellow-600' 
        : 'bg-gradient-to-br from-yellow-400 to-orange-500'
    } text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white dark:border-gray-800 z-10 transition-all`}
  >
    {day}
    {isToday && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
    )}
  </div>
));

DayBadge.displayName = 'DayBadge';

// Komponent Lock Overlay - pokazuje kłódkę dla zablokowanych okienek
const LockOverlay = memo(({ daysUntil }: { daysUntil: number }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 to-black/80 dark:from-black/80 dark:to-gray-900/90 rounded-2xl flex items-center justify-center backdrop-blur-sm z-20 transition-all duration-300">
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl drop-shadow-lg animate-bounce" role="img" aria-label="Zablokowane">
        🔒
      </span>
      <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full">
        {daysUntil === 0 ? 'Dziś!' : daysUntil === 1 ? 'Jutro' : `Za ${daysUntil} dni`}
      </span>
    </div>
  </div>
));

LockOverlay.displayName = 'LockOverlay';

// Komponent Redeemed Badge - pokazuje checkmark dla odebranych kuponów
const RedeemedBadge = memo(() => (
  <div className="absolute -bottom-2 -left-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-3 border-white dark:border-gray-800 z-10 animate-scale-in">
    <span className="text-2xl" role="img" aria-label="Odebrane">
      ✓
    </span>
  </div>
));

RedeemedBadge.displayName = 'RedeemedBadge';

// Komponent New Badge - dla nowych odblokowań
const NewBadge = memo(() => (
  <div className="absolute -top-2 -left-2 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg border-2 border-white dark:border-gray-800 z-10 animate-bounce">
    NOWE!
  </div>
));

NewBadge.displayName = 'NewBadge';

// Komponent Card Face - strona karty
interface CardFaceProps {
  emoji: string;
  title?: string;
  isBack?: boolean;
  gradient: string;
  category?: string;
}

const CardFace = memo(({ emoji, title, isBack = false, gradient, category }: CardFaceProps) => (
  <div
    className={`
      card-face absolute inset-0 w-full h-full rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center
      ${isBack ? 'card-face--back' : 'card-face--front'}
      ${gradient}
      shadow-xl border-2 border-white/20
    `}
    style={{
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
    }}
  >
    <div className="text-5xl md:text-6xl mb-2 md:mb-3 drop-shadow-lg filter animate-float" role="img" aria-label={title || 'Emoji'}>
      {emoji}
    </div>
    {title && (
      <div className="text-white text-center font-bold text-xs md:text-sm drop-shadow-md px-2 line-clamp-2">
        {title}
      </div>
    )}
    {category && (
      <div className="mt-2 text-white/80 text-xs bg-white/20 px-2 py-1 rounded-full">
        {category}
      </div>
    )}
  </div>
));

CardFace.displayName = 'CardFace';

// Główny komponent Door
const Door = ({ coupon, isUnlocked, isRedeemed, onClick }: DoorProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [shake, setShake] = useState(false);

  // Check if this is today's door
  const isToday = useMemo(() => {
    const today = new Date();
    return today.getDate() === coupon.day && today.getMonth() === 11;
  }, [coupon.day]);

  // Calculate days until unlock
  const daysUntil = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    
    if (currentMonth !== 11) return coupon.day;
    
    return Math.max(0, coupon.day - currentDay);
  }, [coupon.day]);

  // Check if door was recently unlocked (within last 24 hours)
  useEffect(() => {
    if (isUnlocked && !isRedeemed) {
      const unlockDate = new Date();
      unlockDate.setDate(coupon.day);
      const now = new Date();
      const hoursSinceUnlock = (now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUnlock < 24 && hoursSinceUnlock > 0) {
        setIsNew(true);
        setTimeout(() => setIsNew(false), 10000); // Hide after 10 seconds
      }
    }
  }, [isUnlocked, isRedeemed, coupon.day]);

  // Sparkle effect for unlocked doors
  useEffect(() => {
    if (isUnlocked && !isRedeemed && isHovered) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, isRedeemed, isHovered]);

  // Shake animation for locked doors on click
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // Memoizowane klasy CSS
  const containerClasses = useMemo(() => {
    return 'relative aspect-square perspective-1000';
  }, []);

  const cardClasses = useMemo(() => {
    let classes = `
      card-inner relative w-full h-full transition-all duration-700 ease-out
      transform-style-3d cursor-pointer
    `;

    if (isFlipped) {
      classes += ' rotate-y-180';
    }

    if (!isUnlocked) {
      classes += ' cursor-not-allowed';
    } else {
      classes += ' hover:scale-105 active:scale-95';
    }

    if (isPressed) {
      classes += ' scale-95';
    }

    if (shake) {
      classes += ' animate-shake';
    }

    if (isRedeemed) {
      classes += ' opacity-80';
    }

    return classes;
  }, [isFlipped, isUnlocked, isPressed, shake, isRedeemed]);

  // Handler dla kliknięcia
  const handleClick = useCallback(() => {
    if (!isUnlocked) {
      triggerShake();
      toast.error(`Okienko ${coupon.day} otworzy się ${coupon.day} grudnia! 🗓️`, {
        icon: '🔒',
        duration: 3000,
      });
      return;
    }

    // Success feedback
    if (!isRedeemed) {
      toast.success(`Otwierasz okienko ${coupon.day}! 🎉`, {
        icon: '🎁',
        duration: 2000,
      });
    }

    // Efekt wizualny flip
    setIsFlipped(true);
    
    // Reset flip po animacji
    setTimeout(() => {
      setIsFlipped(false);
      onClick();
    }, 350);
  }, [isUnlocked, isRedeemed, onClick, coupon.day, triggerShake]);

  // Handler dla touch/press efektu
  const handleMouseDown = useCallback(() => {
    if (isUnlocked) {
      setIsPressed(true);
    }
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

  // Keyboard accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Memoizowany status text
  const statusText = useMemo(() => {
    if (!isUnlocked) return `Odblokuje się ${coupon.day} grudnia`;
    if (isRedeemed) return 'Odebrane';
    return 'Kliknij aby otworzyć';
  }, [isUnlocked, isRedeemed, coupon.day]);

  return (
    <div className={containerClasses}>
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
        <CardFace
          emoji={coupon.emoji}
          gradient={coupon.color}
          title={undefined}
        />

        {/* Back Face */}
        <CardFace
          emoji="🎁"
          title={coupon.title}
          category={coupon.category}
          isBack={true}
          gradient="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500"
        />

        {/* Lock Overlay */}
        {!isUnlocked && <LockOverlay daysUntil={daysUntil} />}
      </div>

      {/* Hover Glow Effect */}
      {isUnlocked && !isFlipped && (
        <div 
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/0 via-purple-500/30 to-pink-500/0 transition-opacity duration-300 pointer-events-none -z-10 blur-xl ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} 
        />
      )}

      {/* Today Indicator Ring */}
      {isToday && isUnlocked && !isRedeemed && (
        <div className="absolute inset-0 rounded-2xl border-4 border-yellow-400 animate-pulse pointer-events-none -z-10" />
      )}

      {/* Sparkle Effect */}
      {showSparkles && (
        <>
          <div className="absolute top-2 right-2 text-xl animate-ping pointer-events-none">✨</div>
          <div className="absolute bottom-2 left-2 text-xl animate-ping pointer-events-none" style={{ animationDelay: '0.2s' }}>⭐</div>
          <div className="absolute top-2 left-2 text-xl animate-ping pointer-events-none" style={{ animationDelay: '0.4s' }}>💫</div>
        </>
      )}

      {/* Redeemed overlay effect */}
      {isRedeemed && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl pointer-events-none" />
      )}
    </div>
  );
};

// Memoizuj cały komponent
export default memo(Door, (prevProps, nextProps) => {
  return (
    prevProps.coupon.id === nextProps.coupon.id &&
    prevProps.isUnlocked === nextProps.isUnlocked &&
    prevProps.isRedeemed === nextProps.isRedeemed
  );
});
