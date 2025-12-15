'use client';

import { Coupon } from '../coupons';
import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Confetti from 'react-confetti';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

// ==========================================================================
// Types & Interfaces
// ==========================================================================

interface CouponModalProps {
  coupon: Coupon | null;
  isRedeemed: boolean;
  onClose: () => void;
  onRedeem: () => void;
}

interface QRData {
  id: number;
  title: string;
  description: string;
  validUntil: string;
  emoji: string;
  category: string;
  redeemedAt: string;
  version: string;
}

// ==========================================================================
// Constants
// ==========================================================================

const CONFETTI_CONFIG = {
  numberOfPieces: 500,
  recycle: false,
  colors: ['#ec4899', '#a855f7', '#f59e0b', '#10b981', '#3b82f6'],
  gravity: 0.3,
  duration: 5000,
}

const AUDIO_CONFIG = {
  volume: 0.5,
  bellSound: '/bell.mp3',
} as const;

const ANIMATION_DELAYS = {
  redeem: 300,
  confetti: 5000,
} as const;

const QR_SIZE = 256;

// ==========================================================================
// Custom Hooks
// ==========================================================================

/**
 * Hook for managing window size (needed for Confetti)
 */
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Hook for focus trap - ensures keyboard accessibility
 */
const useFocusTrap = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element with delay
    setTimeout(() => firstElement?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);

    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  return modalRef;
};

/**
 * Hook for escape key handling
 */
const useEscapeKey = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
};

/**
 * Hook for body scroll lock
 */
const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);
};

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Plays notification sound
 */
const playNotificationSound = (src: string): void => {
  try {
    const audio = new Audio(src);
    audio.volume = AUDIO_CONFIG.volume;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    // Audio not available
  }
};

// ==========================================================================
// Memoized Components
// ==========================================================================

/**
 * QR Code display component (memoized for performance)
 */
const QRCodeDisplay = memo(({ couponData }: { couponData: string }) => (
  <div className="mt-4 bg-white p-4 rounded-xl inline-block shadow-lg animate-fade-in border-2 border-gray-100">
    <QRCodeSVG 
      value={couponData} 
      size={QR_SIZE} 
      level="H" 
      includeMargin 
      className="mx-auto"
      aria-label="QR kod kuponu"
    />
    <p className="text-xs text-gray-600 mt-3 font-medium text-center">
      📱 Zeskanuj aby zapisać kupon
    </p>
  </div>
));

QRCodeDisplay.displayName = 'QRCodeDisplay';

/**
 * Category badge component
 */
const CategoryBadge = memo(({ category }: { category: string }) => (
  <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 px-4 py-1.5 rounded-full text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 font-bold mb-4 shadow-sm">
    {category}
  </div>
));

CategoryBadge.displayName = 'CategoryBadge';

/**
 * Tags display component
 */
const TagsList = memo(({ tags }: { tags: string[] }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
});

TagsList.displayName = 'TagsList';

/**
 * Difficulty badge component
 */
const DifficultyBadge = memo(({ difficulty }: { difficulty: 'easy' | 'medium' | 'special' }) => {
  const config = {
    easy: { emoji: '😊', label: 'Łatwy', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    medium: { emoji: '🤔', label: 'Średni', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    special: { emoji: '⭐', label: 'Specjalny', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  };

  const { emoji, label, color } = config[difficulty];

  return (
    <span className={`px-3 py-1.5 rounded-full font-medium text-sm shadow-sm ${color}`}>
      {emoji} {label}
    </span>
  );
});

DifficultyBadge.displayName = 'DifficultyBadge';

// ==========================================================================
// Main Component
// ==========================================================================

export default function CouponModal({ coupon, isRedeemed, onClose, onRedeem }: CouponModalProps) {
  // State
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs
  const confettiTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const windowSize = useWindowSize();
  const modalRef = useFocusTrap(!!coupon);

  useEscapeKey(!!coupon, onClose);
  useBodyScrollLock(!!coupon);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) {
        clearTimeout(confettiTimerRef.current);
      }
    };
  }, []);

  // Memoized QR data
  const couponData = useMemo((): string => {
    if (!coupon) return '';

    const data: QRData = {
      id: coupon.id,
      title: coupon.title,
      description: coupon.description,
      validUntil: coupon.validUntil,
      emoji: coupon.emoji,
      category: coupon.category,
      redeemedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(data, null, 2);
  }, [coupon]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles redeeming the coupon
   */
  const handleRedeem = useCallback(() => {
    setIsAnimating(true);
    onRedeem();

    setTimeout(() => {
      setShowConfetti(true);
      setIsAnimating(false);
      playNotificationSound(AUDIO_CONFIG.bellSound);

      toast.success('Kupon odebrany! 🎉', {
        duration: 4000,
        icon: '🎁',
      });
    }, ANIMATION_DELAYS.redeem);

    // Auto-hide confetti
    confettiTimerRef.current = setTimeout(() => {
      setShowConfetti(false);
    }, ANIMATION_DELAYS.confetti);
  }, [onRedeem]);

  /**
   * Toggles QR code visibility
   */
  const toggleQR = useCallback(() => {
    setShowQR((prev) => {
      const newValue = !prev;
      if (newValue) {
        toast.success('Kod QR wyświetlony! 📱', {
          duration: 2000,
        });
      }
      return newValue;
    });
  }, []);

  // Early return if no coupon or not mounted
  if (!coupon || !mounted) return null;

  // ==========================================================================
  // Render
  // ==========================================================================

  const modalContent = (
    <>
      {/* Confetti Effect */}
      {showConfetti && windowSize.width > 0 && windowSize.height > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={CONFETTI_CONFIG.numberOfPieces}
          recycle={CONFETTI_CONFIG.recycle}
          colors={CONFETTI_CONFIG.colors}
          gravity={CONFETTI_CONFIG.gravity}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      >
        {/* Modal Dialog */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          className={`glass-strong rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-scale-in shadow-2xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto border border-white/20 ${
            isAnimating ? 'opacity-80 scale-95' : 'opacity-100 scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Zamknij okno kuponu"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 z-10"
          >
            ×
          </button>

          {/* Modal Content */}
          <div className="text-center">
            {/* Emoji Icon */}
            <div
              className="text-7xl md:text-8xl mb-4 animate-bounce-slow"
              role="img"
              aria-label={coupon.title}
            >
              {coupon.emoji}
            </div>

            {/* Category Badge */}
            <CategoryBadge category={coupon.category} />

            {/* Title */}
            <h2
              id="modal-title"
              className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 font-playfair leading-tight"
            >
              {coupon.title}
            </h2>

            {/* Description */}
            <p
              id="modal-description"
              className="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-6 leading-relaxed"
            >
              {coupon.description}
            </p>

            {/* Tags */}
            {coupon.tags && <TagsList tags={coupon.tags} />}

            {/* Redeem Instructions (if provided and not redeemed) */}
            {coupon.redeemInstructions && !isRedeemed && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6 text-left">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong className="block mb-2 text-base">📋 Instrukcje:</strong>
                  {coupon.redeemInstructions}
                </p>
              </div>
            )}

            {/* Validity Period */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-5 mb-6 border-2 border-purple-200 dark:border-purple-700 shadow-sm">
              <p className="text-sm md:text-base text-gray-800 dark:text-gray-200">
                <strong className="text-purple-700 dark:text-purple-300 text-base">
                  ⏰ Ważny do:
                </strong>{' '}
                <time dateTime={coupon.validUntil} className="font-bold text-base">
                  {coupon.validUntil}
                </time>
              </p>
            </div>

            {/* Action Buttons */}
            {!isRedeemed ? (
              <button
                onClick={handleRedeem}
                disabled={isAnimating}
                className={`w-full ${coupon.color} text-white px-8 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl hover:scale-105 active:scale-95 transition-all transform shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isAnimating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Odbieranie...
                  </span>
                ) : (
                  '🎉 Odbierz Kupon!'
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Success Message */}
                <div
                  className="bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600 rounded-xl p-5 shadow-lg"
                  role="status"
                  aria-live="polite"
                >
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-green-800 dark:text-green-200 font-bold text-xl mb-3">
                    Kupon Odebrany!
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm md:text-base mb-4">
                    📸 <strong>Zrób zrzut ekranu</strong> lub użyj kodu QR poniżej
                  </p>

                  {/* QR Code Toggle */}
                  <button
                    onClick={toggleQR}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-3 rounded-xl transition-all font-bold focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    aria-expanded={showQR}
                    aria-controls="qr-code-display"
                  >
                    {showQR ? '🙈 Ukryj kod QR' : '📱 Pokaż kod QR'}
                  </button>

                  {/* QR Code Display */}
                  {showQR && (
                    <div id="qr-code-display">
                      <QRCodeDisplay couponData={couponData} />
                    </div>
                  )}
                </div>

                {/* Redeem Instructions (after redemption) */}
                {coupon.redeemInstructions && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong className="block mb-1 text-base">📋 Jak wykorzystać:</strong>
                      {coupon.redeemInstructions}
                    </p>
                  </div>
                )}

                {/* Hint */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-xs md:text-sm font-medium">
                    💡 <strong>Wskazówka:</strong> Możesz pokazać zrzut ekranu lub kod QR podczas realizacji
                  </p>
                </div>

                {/* Expiry Reminder */}
                <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
                  <p className="text-red-700 dark:text-red-300 text-xs md:text-sm">
                    ❤️ Ten prezent jest ważny do{' '}
                    <time dateTime={coupon.validUntil} className="font-bold">
                      {coupon.validUntil}
                    </time>
                  </p>
                </div>
              </div>
            )}

            {/* Difficulty Badge */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Poziom trudności:</span>
                <DifficultyBadge difficulty={coupon.difficulty} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render via portal for better z-index management
  return createPortal(modalContent, document.body);
}
