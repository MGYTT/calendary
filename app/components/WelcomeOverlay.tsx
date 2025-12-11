'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  KeyboardEvent,
} from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface WelcomeOverlayProps {
  onComplete: (name: string) => void;
}

type Step = 1 | 2 | 3;

export default function WelcomeOverlay({ onComplete }: WelcomeOverlayProps) {
  const [storedName, setStoredName, hydrated] = useLocalStorage<string>(
    'herName',
    '',
  );
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // okno dla confetti – bezpieczne na mobile/SSR
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  // jeśli imię już jest – nie pokazuj overlayu, tylko powiadom rodzica
  useEffect(() => {
    if (hydrated && storedName) {
      onComplete(storedName);
    }
  }, [hydrated, storedName, onComplete]);

  // autofocus na polu imienia
  useEffect(() => {
    if (step !== 1 || !inputRef.current) return;
    const id = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(id);
  }, [step]);

  // walidacja imienia
  const validateName = useCallback((value: string): boolean => {
    const trimmed = value.trim();

    if (!trimmed) {
      setNameError('Proszę wpisać imię');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Imię musi mieć przynajmniej 2 znaki');
      return false;
    }
    if (trimmed.length > 20) {
      setNameError('Imię nie może być dłuższe niż 20 znaków');
      return false;
    }
    if (!/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/.test(trimmed)) {
      setNameError('Imię może zawierać tylko litery');
      return false;
    }

    setNameError('');
    return true;
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (nameError) {
        validateName(value);
      }
    },
    [nameError, validateName],
  );

  const goToStep2 = useCallback(() => {
    if (!validateName(name)) {
      toast.error(nameError || 'Proszę podać prawidłowe imię');
      inputRef.current?.focus();
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setStep(2);
      setIsAnimating(false);
    }, 250);
  }, [name, nameError, validateName]);

  const goToStep3 = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(3);
      setShowConfetti(true);
      setIsAnimating(false);

      setTimeout(() => setShowConfetti(false), 5000);
    }, 250);
  }, []);

  const finish = useCallback(() => {
    const cleaned = name.trim();
    if (!cleaned) return;

    setStoredName(cleaned);
    toast.success(`Witaj ${cleaned}! 🎄✨`, { duration: 4000 });
    onComplete(cleaned);
  }, [name, setStoredName, onComplete]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter') return;

      if (step === 1) goToStep2();
      else if (step === 2) goToStep3();
      else if (step === 3) finish();
    },
    [step, goToStep2, goToStep3, finish],
  );

  const handleSkip = useCallback(() => {
    const fallbackName = 'Kochana';
    setStoredName(fallbackName);
    onComplete(fallbackName);
  }, [setStoredName, onComplete]);

  // jeżeli jeszcze nie zhydradowane albo imię już jest – nie pokazuj overlayu
  if (!hydrated || storedName) {
    return null;
  }

  return (
    <>
      {showConfetti && windowSize.width > 0 && windowSize.height > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={300}
          recycle={false}
          colors={['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']}
        />
      )}

      <div
        className="fixed inset-0 z-[60] bg-gradient-to-br from-pink-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onKeyDown={handleKeyPress}
      >
        {/* Dekoracje w tle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">
            🎄
          </div>
          <div
            className="absolute top-20 right-20 text-6xl opacity-20 animate-float"
            style={{ animationDelay: '1s' }}
          >
            ❄️
          </div>
          <div
            className="absolute bottom-20 left-20 text-6xl opacity-20 animate-float"
            style={{ animationDelay: '2s' }}
          >
            🎁
          </div>
          <div
            className="absolute bottom-10 right-10 text-6xl opacity-20 animate-float"
            style={{ animationDelay: '1.5s' }}
          >
            ⭐
          </div>
        </div>

        <div
          className={`max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 text-center relative z-10 transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-scale-in'
          }`}
        >
          {/* Krok 1 – imię */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4 animate-heart-beat">💝</div>
              <h2
                id="welcome-title"
                className="text-3xl md:text-4xl font-bold text-white mb-3 font-playfair"
              >
                Witaj, piękna duszo!
              </h2>
              <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
                Ten kalendarz adwentowy to wyjątkowy prezent, w którym każdy dzień
                grudnia to mała dawka miłości, troski i wspólnych chwil.
              </p>
              <p className="text-white/90 mb-4 font-medium text-lg">
                ✨ Zanim zaczniemy, zdradź swoje imię...
              </p>

              <div className="flex flex-col gap-3 mt-6">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Jak masz na imię?"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    maxLength={20}
                    className={`w-full px-5 py-4 rounded-full border-2 ${
                      nameError
                        ? 'border-red-400 bg-red-50/10'
                        : 'border-white/40 bg-white/10'
                    } text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all text-lg`}
                  />
                  {name && (
                    <button
                      type="button"
                      onClick={() => {
                        setName('');
                        setNameError('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xl"
                      aria-label="Wyczyść imię"
                    >
                      ×
                    </button>
                  )}
                </div>

                {nameError && (
                  <p className="text-red-300 text-sm animate-shake">
                    ⚠️ {nameError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={!name.trim()}
                  className="w-full px-6 py-4 rounded-full bg-white text-pink-600 font-bold text-lg hover:bg-pink-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                  Dalej →
                </button>
              </div>

              <p className="text-xs text-white/60 mt-4">
                💡 To imię pojawi się na stronie, żeby wszystko było jeszcze bardziej
                osobiste
              </p>

              <button
                type="button"
                onClick={handleSkip}
                className="mt-4 text-white/60 hover:text-white text-sm underline transition-all"
              >
                Pomiń (użyj domyślnego imienia)
              </button>
            </div>
          )}

          {/* Krok 2 – wyjaśnienie */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4 animate-float">🎄</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-playfair">
                {name}, ten kalendarz jest tylko dla Ciebie
              </h2>
              <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
                W środku czeka 24 kupony – każdy to obietnica chwili spędzonej razem,
                z myślą wyłącznie o Tobie. ❤️
              </p>

              <div className="bg-white/10 rounded-2xl p-6 mb-6 text-left">
                <h3 className="text-white font-bold mb-3 text-lg">📖 Jak to działa?</h3>
                <ul className="text-white/85 text-sm md:text-base space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-xl">📅</span>
                    <span>Każde okienko otwiera się w odpowiednim dniu grudnia.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-xl">📸</span>
                    <span>Po odebraniu kuponu możesz zapisać QR kod jako obraz.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-xl">👤</span>
                    <span>
                      W profilu znajdziesz historię wszystkich odebranych niespodzianek.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-xl">🎁</span>
                    <span>
                      Każdy kupon to wyjątkowa chwila – wykorzystaj go w dowolnym
                      momencie!
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-full bg-white/20 text-white font-bold hover:bg-white/30 transition-all"
                >
                  ← Wróć
                </button>
                <button
                  type="button"
                  onClick={goToStep3}
                  className="flex-1 px-8 py-4 rounded-full bg-white text-pink-600 font-bold text-lg hover:bg-pink-50 transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                  Kontynuuj →
                </button>
              </div>
            </div>
          )}

          {/* Krok 3 – zakończenie */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-7xl mb-4 animate-bounce-slow">🎉</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-playfair">
                Wszystko gotowe, {name}!
              </h2>
              <p className="text-white/90 mb-6 text-base md:text-lg leading-relaxed">
                Twój magiczny kalendarz adwentowy czeka. Każdy dzień to nowa przygoda,
                każdy kupon to dowód na to, jak bardzo jesteś wyjątkowa. 💖
              </p>

              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6 mb-6">
                <p className="text-white text-sm md:text-base mb-3">
                  🌟 <strong>Pamiętaj:</strong> To nie są zwykłe kupony – to chwile,
                  które stworzycie razem, wspomnienia, które zostaną na zawsze.
                </p>
                <p className="text-white/80 text-sm">
                  Ciesz się każdym dniem, odkrywaj niespodzianki i wiedz, że każda z nich
                  została stworzona z myślą o Tobie. ✨
                </p>
              </div>

              <button
                type="button"
                onClick={finish}
                className="w-full px-10 py-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 animate-pulse-slow"
              >
                🎄 Wejdź do kalendarza ✨
              </button>

              <p className="text-white/60 text-xs mt-4">
                Naciśnij{' '}
                <kbd className="px-2 py-1 bg-white/20 rounded">Enter</kbd> lub kliknij
                przycisk.
              </p>
            </div>
          )}

          {/* Pasek postępu kroków */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-white'
                    : s < step
                    ? 'w-2 bg-white/60'
                    : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
