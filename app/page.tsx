'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { coupons, getCouponStats } from './coupons';
import Door from './components/Door';
import CouponModal from './components/CouponModal';
import ThemeToggle from './components/ThemeToggle';
import Countdown from './components/Countdown';
import DataManager from './components/DataManager';
import WelcomeOverlay from './components/WelcomeOverlay';
import AuthModal from './components/AuthModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import toast, { Toaster } from 'react-hot-toast';

// ==========================================================================
// Dynamic Imports for Performance Optimization
// ==========================================================================

const Snowfall = dynamic(() => import('react-snowfall'), {
  ssr: false,
  loading: () => null,
});

const Profile = dynamic(() => import('./components/Profile'), {
  ssr: false,
  loading: () => null,
});

// ==========================================================================
// Types
// ==========================================================================

interface PageState {
  selectedCoupon: number | null;
  redeemedCoupons: Set<number>;
  showProfile: boolean;
  showInstallPrompt: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ==========================================================================
// Constants
// ==========================================================================

const STORAGE_KEY = 'redeemedCoupons';
const INSTALL_PROMPT_DISMISSED_KEY = 'installPromptDismissed';
const FIRST_VISIT_KEY = 'firstVisit';
const REDEEMED_DATES_KEY = 'redeemedDates';
const AUTH_KEY = 'advent-auth';

// ==========================================================================
// Helper Functions
// ==========================================================================

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      toast.error('Błąd zapisywania danych');
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
};

const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString('pl-PL'),
    day: now.getDate(),
    month: now.getMonth(),
    year: now.getFullYear(),
  };
};

// ==========================================================================
// Home Page Component
// ==========================================================================

export default function Home() {
  const [state, setState] = useState<PageState>({
    selectedCoupon: null,
    redeemedCoupons: new Set<number>(),
    showProfile: false,
    showInstallPrompt: false,
  });

  const [herName, setHerName, isHydrated] = useLocalStorage<string>('herName', '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [redeemedDates, setRedeemedDates] = useState<Record<number, string>>({});
  const [isMounted, setIsMounted] = useState(false);
  
  // ✅ POPRAWKA: ReturnType<typeof setTimeout> zamiast number
  const installPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================================================
  // Derived State (Memoized)
  // ==========================================================================

  const stats = useMemo(() => {
    return getCouponStats([...state.redeemedCoupons]);
  }, [state.redeemedCoupons]);

  const selectedCouponData = useMemo(() => {
    return state.selectedCoupon 
      ? coupons.find(c => c.id === state.selectedCoupon) 
      : null;
  }, [state.selectedCoupon]);

  const unlockedCount = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    
    if (currentMonth !== 11) return 0;
    
    return coupons.filter(c => c.day <= currentDay).length;
  }, []);

  const personalizedGreeting = useMemo(() => {
    if (!herName) return 'Dla Najwspanialszej Dziewczyny ❤️';
    return `Dla Najwspanialszej ${herName} ❤️`;
  }, [herName]);

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const isUnlocked = useCallback((day: number): boolean => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    
    return currentMonth === 11 && currentDay >= day;
  }, []);

  const isRedeemed = useCallback((couponId: number): boolean => {
    return state.redeemedCoupons.has(couponId);
  }, [state.redeemedCoupons]);

  const saveRedeemedDate = useCallback((couponId: number) => {
    const newDates = {
      ...redeemedDates,
      [couponId]: new Date().toISOString(),
    };
    setRedeemedDates(newDates);
    safeLocalStorage.setItem(REDEEMED_DATES_KEY, JSON.stringify(newDates));
  }, [redeemedDates]);

  // ==========================================================================
  // Effect Hooks
  // ==========================================================================

  // Mount detection
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Authentication check
  useEffect(() => {
    if (!isMounted) return;
    
    const auth = safeLocalStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      setShowAuthModal(true);
    }
  }, [isMounted]);

  // Initialize data from localStorage
  useEffect(() => {
    if (!isHydrated || !isMounted) return;

    const initializeData = () => {
      try {
        const saved = safeLocalStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedData = JSON.parse(saved);
          if (Array.isArray(parsedData)) {
            setState(prev => ({
              ...prev,
              redeemedCoupons: new Set(parsedData),
            }));
          }
        }

        const savedDates = safeLocalStorage.getItem(REDEEMED_DATES_KEY);
        if (savedDates) {
          const parsedDates = JSON.parse(savedDates);
          setRedeemedDates(parsedDates);
        }

        const isFirstVisit = !safeLocalStorage.getItem(FIRST_VISIT_KEY);
        if (isFirstVisit && herName) {
          safeLocalStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
          
          setTimeout(() => {
            toast.success(`🎄 Witaj ${herName}! Twój kalendarz adwentowy czeka!`, {
              duration: 5000,
              icon: '✨',
            });
          }, 1500);
        }

        console.log('Current date info:', getCurrentDateInfo());
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        toast.error('Błąd ładowania danych');
      }
    };

    initializeData();
  }, [isHydrated, herName, isMounted]);

  // PWA Install prompt
  useEffect(() => {
    if (!isMounted) return;

    const dismissed = safeLocalStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      installPromptTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, showInstallPrompt: true }));
      }, 10000);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      setState(prev => ({ ...prev, showInstallPrompt: false }));
      setDeferredPrompt(null);
      
      toast.success('Aplikacja została zainstalowana! 📱', {
        duration: 4000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (installPromptTimeoutRef.current !== null) {
        clearTimeout(installPromptTimeoutRef.current);
        installPromptTimeoutRef.current = null;
      }
    };
  }, [isMounted]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.selectedCoupon) {
          handleCloseModal();
        } else if (state.showProfile) {
          setState(prev => ({ ...prev, showProfile: false }));
        }
      }

      if (e.key === 'p' && !state.selectedCoupon && !state.showProfile) {
        setState(prev => ({ ...prev, showProfile: true }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.selectedCoupon, state.showProfile, isMounted]);

  // Auto-save redeemed coupons
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      if (state.redeemedCoupons.size > 0) {
        safeLocalStorage.setItem(
          STORAGE_KEY, 
          JSON.stringify([...state.redeemedCoupons])
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.redeemedCoupons, isMounted]);

  // Daily unlock notification
  useEffect(() => {
    if (!isHydrated || !herName || !isMounted) return;

    const checkDailyUnlock = () => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();

      if (currentMonth === 11 && currentDay <= 24) {
        const lastNotification = safeLocalStorage.getItem(`notification_day_${currentDay}`);
        
        if (!lastNotification) {
          setTimeout(() => {
            toast.success(`🎁 ${herName}! Dzień ${currentDay}: Nowe okienko czeka!`, {
              duration: 6000,
              icon: '🎄',
            });
            safeLocalStorage.setItem(`notification_day_${currentDay}`, 'true');
          }, 2000);
        }
      }
    };

    checkDailyUnlock();
  }, [isHydrated, herName, isMounted]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleAuthenticate = useCallback((success: boolean) => {
    if (success) {
      safeLocalStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setShowAuthModal(false);
    } else {
      toast.error('Niepoprawna data wejścia w związek!');
    }
  }, []);

  const handleWelcomeComplete = useCallback((name: string) => {
    setHerName(name);
    toast.success(`Witaj w swoim kalendarzu, ${name}! 💝`, {
      duration: 5000,
      icon: '✨',
    });
  }, [setHerName]);

  const handleRedeem = useCallback((couponId: number) => {
    setState(prev => {
      const newRedeemed = new Set(prev.redeemedCoupons);
      newRedeemed.add(couponId);
      
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([...newRedeemed]));
      
      return {
        ...prev,
        redeemedCoupons: newRedeemed,
      };
    });

    saveRedeemedDate(couponId);

    const coupon = coupons.find(c => c.id === couponId);
    if (coupon) {
      const message = herName 
        ? `${herName}, ${coupon.emoji} ${coupon.title} jest Twój!`
        : `${coupon.emoji} ${coupon.title} odebrany!`;
      
      toast.success(message, {
        duration: 4000,
      });
    }

    if (typeof document !== 'undefined') {
      const announcement = document.getElementById('announcements');
      if (announcement) {
        announcement.textContent = `Kupon "${coupon?.title}" został pomyślnie odebrany!`;
      }
    }

    const newCount = state.redeemedCoupons.size + 1;
    if (newCount === 12) {
      setTimeout(() => {
        const message = herName 
          ? `🎉 ${herName}, masz już połowę kalendarza!`
          : '🎉 Połowa kalendarza odebrana!';
        
        toast.success(message, {
          duration: 5000,
          icon: '🎊',
        });
      }, 1500);
    } else if (newCount === 24) {
      setTimeout(() => {
        const message = herName 
          ? `🎆 ${herName}, gratulacje! Wszystkie kupony są Twoje!`
          : '🎆 Gratulacje! Wszystkie kupony odebrane!';
        
        toast.success(message, {
          duration: 6000,
          icon: '🏆',
        });
      }, 1500);
    }
  }, [state.redeemedCoupons, saveRedeemedDate, herName]);

  const handleDoorClick = useCallback((couponId: number, unlocked: boolean) => {
    if (!unlocked) {
      const coupon = coupons.find(c => c.id === couponId);
      toast.error(`Okienko ${coupon?.day} zostanie odblokowane ${coupon?.day} grudnia`, {
        icon: '🔒',
        duration: 3000,
      });
      return;
    }
    setState(prev => ({ ...prev, selectedCoupon: couponId }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prev => ({ ...prev, selectedCoupon: null }));
  }, []);

  const handleProfileToggle = useCallback(() => {
    setState(prev => ({ ...prev, showProfile: !prev.showProfile }));
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        toast.success('Dziękuję za instalację! 📱', {
          duration: 4000,
        });
      }
      
      setDeferredPrompt(null);
      setState(prev => ({ ...prev, showInstallPrompt: false }));
    } catch (error) {
      console.error('Error during install prompt:', error);
      toast.error('Błąd instalacji aplikacji');
    }
  }, [deferredPrompt]);

  const handleDismissInstallPrompt = useCallback(() => {
    setState(prev => ({ ...prev, showInstallPrompt: false }));
    safeLocalStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    
    toast('Możesz zainstalować aplikację później z menu', {
      icon: 'ℹ️',
      duration: 3000,
    });
  }, []);

  // ==========================================================================
  // Render Guard - Prevent hydration issues
  // ==========================================================================

  if (!isMounted || !isHydrated) {
    return null;
  }

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onAuthenticate={handleAuthenticate}
      />

      {isAuthenticated && (
        <WelcomeOverlay onComplete={handleWelcomeComplete} />
      )}

      {isAuthenticated && (
        <main className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 p-4 md:p-8 relative overflow-hidden transition-colors duration-500">
          <Snowfall
            color="#fff"
            snowflakeCount={200}
            style={{
              position: 'fixed',
              width: '100vw',
              height: '100vh',
              zIndex: 1,
            }}
          />
          
          <ThemeToggle onProfileClick={handleProfileToggle} />
          
          <DataManager />

          {state.showInstallPrompt && (
            <div 
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-in-bottom"
              role="dialog"
              aria-labelledby="install-prompt-title"
              aria-describedby="install-prompt-description"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border-2 border-pink-300 dark:border-pink-700 relative">
                <button
                  onClick={handleDismissInstallPrompt}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                  aria-label="Zamknij"
                >
                  ×
                </button>
                <h3 
                  id="install-prompt-title"
                  className="text-gray-800 dark:text-white font-bold mb-2 text-lg"
                >
                  📱 Zainstaluj aplikację
                </h3>
                <p 
                  id="install-prompt-description"
                  className="text-gray-600 dark:text-gray-300 text-sm mb-4"
                >
                  Dodaj kalendarz adwentowy do ekranu głównego i miej szybki dostęp do swoich kuponów!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    Zainstaluj
                  </button>
                  <button
                    onClick={handleDismissInstallPrompt}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Później
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto relative z-10">
            <header className="text-center mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-white/50 dark:border-gray-700/50 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 dark:from-red-400 dark:via-pink-400 dark:to-purple-400 mb-4 animate-pulse-slow font-playfair">
                🎄 Kalendarz Adwentowy 🎄
              </h1>
              <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200 font-semibold mb-2">
                {personalizedGreeting}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-6">
                Każdy dzień grudnia przynosi nową niespodziankę pełną miłości!
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
                <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 md:px-5 py-2 md:py-3 rounded-full text-sm font-medium shadow-lg border-2 border-green-200 dark:border-green-700 transform hover:scale-105 transition-transform cursor-pointer">
                  <span className="font-bold text-lg md:text-xl">{stats.redeemed}</span>
                  <span className="mx-1">/</span>
                  <span>{stats.total}</span>
                  <span className="ml-2">✓ Odebrane</span>
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 md:px-5 py-2 md:py-3 rounded-full text-sm font-medium shadow-lg border-2 border-blue-200 dark:border-blue-700 transform hover:scale-105 transition-transform cursor-pointer">
                  <span className="font-bold text-lg md:text-xl">{unlockedCount}</span>
                  <span className="mx-1">/</span>
                  <span>{stats.total}</span>
                  <span className="ml-2">🔓 Dostępne</span>
                </div>
                
                <div className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 md:px-5 py-2 md:py-3 rounded-full text-sm font-medium shadow-lg border-2 border-purple-200 dark:border-purple-700 transform hover:scale-105 transition-transform cursor-pointer">
                  <span className="font-bold text-lg md:text-xl">{stats.percentage}%</span>
                  <span className="ml-2">📊 Postęp</span>
                </div>
              </div>

              <Countdown />
            </header>

            <section 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 mb-8"
              role="region"
              aria-label="Kalendarz adwentowy - 24 okienka z kuponami"
            >
              {coupons.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <Door
                    coupon={coupon}
                    isUnlocked={isUnlocked(coupon.day)}
                    isRedeemed={isRedeemed(coupon.id)}
                    onClick={() => handleDoorClick(coupon.id, isUnlocked(coupon.day))}
                  />
                </div>
              ))}
            </section>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={handleProfileToggle}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>👤</span>
                <span>{herName ? `Profil ${herName}` : 'Mój Profil'}</span>
                {stats.redeemed > 0 && (
                  <span className="bg-white/30 px-2 py-1 rounded-full text-xs">
                    {stats.redeemed}
                  </span>
                )}
              </button>
            </div>

            <footer className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg animate-fade-in">
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
                💝 Każdy kupon to specjalny moment stworzony tylko dla Ciebie
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-3">
                Stworzone z ❤️ w grudniu 2025
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Skróty klawiszowe: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> zamknij • <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">P</kbd> profil
              </p>
            </footer>
          </div>

          <CouponModal
            coupon={selectedCouponData || null}
            isRedeemed={state.selectedCoupon ? isRedeemed(state.selectedCoupon) : false}
            onClose={handleCloseModal}
            onRedeem={() => state.selectedCoupon && handleRedeem(state.selectedCoupon)}
          />

          {state.showProfile && (
            <Profile
              redeemedCouponIds={[...state.redeemedCoupons]}
              onClose={() => setState(prev => ({ ...prev, showProfile: false }))}
            />
          )}
        </main>
      )}
    </>
  );
}
