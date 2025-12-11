'use client';

import { Coupon } from '../coupons';
import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import Confetti from 'react-confetti';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

// Typy dla props
interface CouponModalProps {
  coupon: Coupon | null;
  isRedeemed: boolean;
  onClose: () => void;
  onRedeem: () => void;
}

// Hook dla zarządzania window size (dla konfetti)
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

// Hook dla focus trap - zapewnia dostępność klawiatury
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

    firstElement?.focus();

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

// Hook dla escape key
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

// Hook dla blokowania scroll body
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

// Zmemoizowany komponent QR Code
const QRCodeDisplay = memo(({ couponData }: { couponData: string }) => (
  <div className="mt-4 bg-white p-4 rounded-lg inline-block shadow-inner animate-fade-in">
    <QRCodeSVG 
      value={couponData} 
      size={200} 
      level="H"
      includeMargin
      className="mx-auto"
    />
    <p className="text-xs text-gray-600 mt-2 font-medium">
      📱 Zeskanuj aby zapisać kupon w telefonie
    </p>
  </div>
));

QRCodeDisplay.displayName = 'QRCodeDisplay';

// Główny komponent Modal
export default function CouponModal({ coupon, isRedeemed, onClose, onRedeem }: CouponModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const windowSize = useWindowSize();
  const modalRef = useFocusTrap(!!coupon);
  
  useEscapeKey(!!coupon, onClose);
  useBodyScrollLock(!!coupon);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handler dla odbierania kuponu z confetti
  const handleRedeem = useCallback(() => {
    setIsAnimating(true);
    onRedeem();
    
    setTimeout(() => {
      setShowConfetti(true);
      setIsAnimating(false);
    }, 300);
    
    try {
      const audio = new Audio('/bell.mp3');
      audio.volume = 0.5;
      audio.play().then(() => {
        setIsAudioPlaying(true);
      }).catch(() => {
        // Ignoruj błędy autoplay
      });
    } catch (error) {
      // Audio nie dostępne
    }

    setTimeout(() => {
      setShowConfetti(false);
      setIsAudioPlaying(false);
    }, 5000);
  }, [onRedeem]);

  // Toggle QR code
  const toggleQR = useCallback(() => {
    setShowQR(prev => !prev);
  }, []);

  // Generuj dane QR
  const couponData = coupon ? JSON.stringify({
    id: coupon.id,
    title: coupon.title,
    description: coupon.description,
    validUntil: coupon.validUntil,
    emoji: coupon.emoji,
    redeemedAt: new Date().toISOString(),
  }, null, 2) : '';

  if (!coupon || !mounted) return null;

  // Modal content
  const modalContent = (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          recycle={false}
          colors={['#ff0000', '#ff69b4', '#8b00ff', '#ffd700', '#00ff00']}
          gravity={0.3}
        />
      )}

      {/* Backdrop with click to close */}
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300"
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
          className={`bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-8 relative animate-scale-in shadow-2xl transform transition-all duration-300 ${
            isAnimating ? 'opacity-80 scale-95' : 'opacity-100 scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Zamknij okno"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            ×
          </button>

          {/* Modal Content */}
          <div className="text-center">
            {/* Emoji Icon */}
            <div 
              className="text-8xl mb-6 animate-bounce-slow"
              role="img"
              aria-label={coupon.title}
            >
              {coupon.emoji}
            </div>

            {/* Title */}
            <h2 
              id="modal-title"
              className="text-4xl font-bold text-gray-800 dark:text-white mb-3"
            >
              {coupon.title}
            </h2>

            {/* Description */}
            <p 
              id="modal-description"
              className="text-gray-600 dark:text-gray-300 text-lg mb-6"
            >
              {coupon.description}
            </p>

            {/* Validity Period */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-xl p-5 mb-6 border-2 border-purple-200 dark:border-purple-700">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <strong className="text-purple-700 dark:text-purple-300">
                  ⏰ Ważny do:
                </strong>{' '}
                <time dateTime={coupon.validUntil}>{coupon.validUntil}</time>
              </p>
            </div>

            {/* Action Buttons */}
            {!isRedeemed ? (
              <button
                onClick={handleRedeem}
                disabled={isAnimating}
                className={`${coupon.color} text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all transform shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-600 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isAnimating ? '⏳ Odbieranie...' : '🎉 Odbierz Kupon!'}
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Success Message */}
                <div 
                  className="bg-green-100 dark:bg-green-900 border-2 border-green-400 dark:border-green-600 rounded-xl p-5 shadow-lg"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-green-800 dark:text-green-200 font-bold text-xl mb-3">
                    ✓ Kupon Odebrany!
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-base mb-4">
                    📸 <strong>Zrób zrzut ekranu</strong> lub użyj kodu QR poniżej!
                  </p>

                  {/* QR Code Toggle */}
                  <button
                    onClick={toggleQR}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                    aria-expanded={showQR}
                    aria-controls="qr-code-display"
                  >
                    {showQR ? '📱 Ukryj kod QR' : '📱 Pokaż kod QR'}
                  </button>

                  {/* QR Code Display */}
                  {showQR && (
                    <div id="qr-code-display">
                      <QRCodeDisplay couponData={couponData} />
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                    💡 <strong>Wskazówka:</strong> Możesz pokazać zrzut ekranu lub kod QR podczas realizacji
                  </p>
                </div>

                {/* Expiry Reminder */}
                <div className="bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
                  <p className="text-red-700 dark:text-red-300 text-xs">
                    ❤️ Ten prezent jest ważny do <time dateTime={coupon.validUntil}>{coupon.validUntil}</time>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Render przez portal dla lepszej dostępności i z-index
  return createPortal(modalContent, document.body);
}
