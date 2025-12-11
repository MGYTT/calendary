'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ThemeToggleProps {
  onProfileClick?: () => void;
}

export default function ThemeToggle({ onProfileClick }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-3">
      {/* Profile Button */}
      {onProfileClick && (
        <button
          onClick={onProfileClick}
          aria-label="Otwórz profil"
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all"
        >
          <span className="text-2xl">👤</span>
        </button>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={`Przełącz na ${theme === 'dark' ? 'jasny' : 'ciemny'} motyw`}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-full shadow-lg hover:scale-110 transition-all"
      >
        <span className="text-2xl">
          {theme === 'dark' ? '🌞' : '🌙'}
        </span>
      </button>
    </div>
  );
}
