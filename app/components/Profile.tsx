'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  coupons,
  getCouponsByCategory,
  getRedeemedCoupons,
  getCouponStats,
  CouponCategory,
  Coupon,
} from '../coupons';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import Confetti from 'react-confetti';

// ==========================================================================
// Types & Interfaces
// ==========================================================================

interface ProfileProps {
  redeemedCouponIds: number[];
  onClose: () => void;
}

interface TimelineItem extends Coupon {
  redeemedDate: string;
}

type ViewMode = 'timeline' | 'grid' | 'list' | 'calendar';
type SortMode = 'date' | 'category' | 'name' | 'difficulty';
type FilterCategory = 'all' | CouponCategory;

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// ==========================================================================
// Constants
// ==========================================================================

const QR_SIZE = {
  TIMELINE: 180,
  GRID: 150,
  LIST: 120,
} as const;

const ANIMATION_DELAYS = {
  CONFETTI: 5000,
  ACHIEVEMENT: 3000,
} as const;

const STORAGE_KEYS = {
  VIEW_MODE: 'profile_view_mode',
  SORT_MODE: 'profile_sort_mode',
} as const;

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Formats date to Polish locale
 */
const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
};

/**
 * Downloads QR code as PNG
 */
const downloadQRCode = async (elementId: string, filename: string): Promise<void> => {
  const svg = document.getElementById(elementId);
  if (!svg) {
    throw new Error('QR code element not found');
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  });
};

/**
 * Calculates achievements based on redeemed coupons
 */
const calculateAchievements = (
  redeemedCount: number,
  totalCount: number,
  categoryCounts: Record<string, number>
): Achievement[] => {
  const percentage = (redeemedCount / totalCount) * 100;

  return [
    {
      id: 'first_coupon',
      title: 'Pierwsze Kroki',
      description: 'Odbierz swój pierwszy kupon',
      emoji: '🎯',
      unlocked: redeemedCount >= 1,
    },
    {
      id: 'five_coupons',
      title: 'Na Dobrej Drodze',
      description: 'Odbierz 5 kuponów',
      emoji: '🌟',
      unlocked: redeemedCount >= 5,
      progress: Math.min(redeemedCount, 5),
      maxProgress: 5,
    },
    {
      id: 'ten_coupons',
      title: 'Kolekcjoner',
      description: 'Odbierz 10 kuponów',
      emoji: '💎',
      unlocked: redeemedCount >= 10,
      progress: Math.min(redeemedCount, 10),
      maxProgress: 10,
    },
    {
      id: 'half_complete',
      title: 'W Połowie Drogi',
      description: 'Odbierz 50% kuponów',
      emoji: '⚡',
      unlocked: percentage >= 50,
      progress: Math.min(percentage, 50),
      maxProgress: 50,
    },
    {
      id: 'all_categories',
      title: 'Wszechstronny',
      description: 'Odbierz kupony ze wszystkich kategorii',
      emoji: '🌈',
      unlocked: Object.keys(categoryCounts).length >= 3,
      progress: Object.keys(categoryCounts).length,
      maxProgress: 3,
    },
    {
      id: 'complete',
      title: 'Mistrz Kuponów',
      description: 'Odbierz wszystkie 24 kupony',
      emoji: '🏆',
      unlocked: redeemedCount >= totalCount,
      progress: redeemedCount,
      maxProgress: totalCount,
    },
  ];
};

// ==========================================================================
// Sub-Components
// ==========================================================================

/**
 * Stat Card Component
 */
const StatCard = ({
  icon,
  label,
  value,
  color,
  subtitle,
  onClick,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) => (
  <div
    className={`${color} rounded-2xl p-5 md:p-6 shadow-lg transform hover:scale-105 transition-all cursor-pointer group relative overflow-hidden`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {/* Background pattern */}
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="flex items-center gap-3 relative z-10">
      <span
        className="text-4xl md:text-5xl group-hover:scale-110 transition-transform"
        role="img"
        aria-label={label}
      >
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-white text-xs md:text-sm font-medium opacity-90 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-white text-2xl md:text-3xl font-bold tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-white text-xs opacity-75 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

/**
 * Achievement Card Component
 */
const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const hasProgress = achievement.maxProgress !== undefined;
  const progressPercentage = hasProgress
    ? ((achievement.progress || 0) / achievement.maxProgress!) * 100
    : 0;

  return (
    <div
      className={`relative rounded-xl p-4 transition-all ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg'
          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-60'
      }`}
    >
      {achievement.unlocked && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          ✓
        </div>
      )}

      <div className="text-center mb-2">
        <span
          className={`text-4xl ${achievement.unlocked ? 'animate-bounce-slow' : 'grayscale'}`}
          role="img"
          aria-label={achievement.title}
        >
          {achievement.emoji}
        </span>
      </div>

      <h4
        className={`font-bold text-sm mb-1 text-center ${
          achievement.unlocked
            ? 'text-gray-800 dark:text-white'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {achievement.title}
      </h4>

      <p
        className={`text-xs text-center mb-2 ${
          achievement.unlocked
            ? 'text-gray-600 dark:text-gray-300'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {achievement.description}
      </p>

      {hasProgress && !achievement.unlocked && (
        <div className="mt-2">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400 font-medium">
            {achievement.progress}/{achievement.maxProgress}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Category Progress Component
 */
const CategoryProgress = ({
  category,
  redeemed,
  total,
  color,
  onClick,
}: {
  category: string;
  redeemed: number;
  total: number;
  color: string;
  onClick?: () => void;
}) => {
  const percentage = total > 0 ? (redeemed / total) * 100 : 0;

  return (
    <div
      className={`mb-4 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{category}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
          {redeemed}/{total} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative shadow-inner">
        <div
          className={`${color} h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

/**
 * Timeline Item Component
 */
const TimelineItemComponent = ({
  item,
  index,
  showQR,
  onToggleQR,
  viewMode,
  onDownloadQR,
}: {
  item: TimelineItem;
  index: number;
  showQR: boolean;
  onToggleQR: (id: number) => void;
  viewMode: ViewMode;
  onDownloadQR: (id: number) => void;
}) => {
  const isEven = index % 2 === 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const qrSize = viewMode === 'grid' ? QR_SIZE.GRID : viewMode === 'list' ? QR_SIZE.LIST : QR_SIZE.TIMELINE;

  const qrData = JSON.stringify(
    {
      id: item.id,
      title: item.title,
      description: item.description,
      validUntil: item.validUntil,
      category: item.category,
      redeemedAt: item.redeemedDate,
      version: '1.0',
    },
    null,
    2
  );

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:border-pink-500 dark:hover:border-pink-600 transition-all animate-fade-in group">
        <div className="text-center mb-3">
          <span
            className="text-5xl mb-2 inline-block group-hover:scale-110 transition-transform"
            role="img"
            aria-label={item.title}
          >
            {item.emoji}
          </span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
            {item.title}
          </h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${item.color} text-white shadow-sm`}
          >
            {item.category}
          </span>
        </div>

        {isExpanded && (
          <div className="animate-fade-in space-y-2 mb-3">
            <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>⏰ Ważny do: {item.validUntil}</p>
              <p>✓ Odebrano: {formatDate(item.redeemedDate)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-2 rounded-lg font-medium transition-all text-xs shadow-sm"
          >
            {isExpanded ? '👆 Zwiń' : '👇 Rozwiń'}
          </button>
          <button
            onClick={() => onToggleQR(item.id)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg font-bold transition-all text-xs shadow-md"
          >
            {showQR ? '🔒 Ukryj' : '📱 QR'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl animate-fade-in border-2 border-gray-200 dark:border-gray-700">
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                id={`qr-${item.id}`}
                value={qrData}
                size={qrSize}
                level="H"
                includeMargin
              />
            </div>
            <button
              onClick={() => onDownloadQR(item.id)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              💾 Pobierz QR
            </button>
          </div>
        )}
      </div>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-l-4 border-pink-500 hover:shadow-2xl transition-all animate-fade-in mb-3 group">
        <div className="flex items-center gap-4">
          <span
            className="text-4xl group-hover:scale-110 transition-transform"
            role="img"
            aria-label={item.title}
          >
            {item.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
              {item.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${item.color} text-white shadow-sm`}
              >
                {item.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                ⏰ {item.validUntil}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                ✓ {formatDate(item.redeemedDate, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggleQR(item.id)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-md whitespace-nowrap"
          >
            {showQR ? '🔒' : '📱 QR'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl animate-fade-in flex items-center gap-4 border-2 border-gray-200 dark:border-gray-700">
            <QRCodeSVG id={`qr-${item.id}`} value={qrData} size={qrSize} level="H" includeMargin />
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                Zeskanuj kod aby zrealizować kupon
              </p>
              <button
                onClick={() => onDownloadQR(item.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all w-full shadow-md"
              >
                💾 Pobierz jako obraz
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Timeline View (default)
  return (
    <div
      className={`timeline-item mb-8 flex ${isEven ? 'justify-start' : 'justify-end'} animate-fade-in`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className={`w-full md:w-5/12 ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}
      >
        <div className="glass-strong rounded-2xl p-6 shadow-2xl border-2 border-white/20 hover:shadow-3xl hover:scale-[1.02] transition-all group">
          <div
            className={`flex items-center gap-3 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}
          >
            <span
              className="text-5xl group-hover:scale-110 transition-transform"
              role="img"
              aria-label={item.title}
            >
              {item.emoji}
            </span>
            <div className={isEven ? 'md:text-right' : 'md:text-left'}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                {item.title}
              </h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${item.color} text-white shadow-md`}
              >
                {item.category}
              </span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
            {item.description}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <span className="font-bold">✓ Odebrano:</span>
              <time className="font-medium">{formatDate(item.redeemedDate)}</time>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
              <span className="font-bold">⏰ Ważny do:</span>
              <time className="font-medium">{item.validUntil}</time>
            </div>
          </div>

          <button
            onClick={() => onToggleQR(item.id)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl font-bold transition-all text-sm shadow-lg hover:shadow-xl"
          >
            {showQR ? '🔒 Ukryj QR' : '📱 Pokaż QR'}
          </button>

          {showQR && (
            <div className="mt-4 bg-white dark:bg-gray-900 p-4 rounded-xl animate-fade-in border-2 border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-3">
                <QRCodeSVG
                  id={`qr-${item.id}`}
                  value={qrData}
                  size={qrSize}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3 font-medium">
                Zeskanuj kod aby zrealizować kupon
              </p>
              <button
                onClick={() => onDownloadQR(item.id)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md"
              >
                💾 Pobierz QR jako obraz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// Main Profile Component
// ==========================================================================

export default function Profile({ redeemedCouponIds, onClose }: ProfileProps) {
  // State
  const [activeQR, setActiveQR] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showAchievements, setShowAchievements] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const confettiTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mount effect
  useEffect(() => {
    setMounted(true);

    // Load preferences from localStorage
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode;
    const savedSortMode = localStorage.getItem(STORAGE_KEYS.SORT_MODE) as SortMode;

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedSortMode) setSortMode(savedSortMode);

    // Show confetti if 100% complete
    if (stats.percentage === 100) {
      setShowConfetti(true);
      confettiTimerRef.current = setTimeout(() => {
        setShowConfetti(false);
      }, ANIMATION_DELAYS.CONFETTI);
    }

    return () => {
      if (confettiTimerRef.current) {
        clearTimeout(confettiTimerRef.current);
      }
    };
  }, []);

  // Statistics
  const stats = useMemo(() => getCouponStats(redeemedCouponIds), [redeemedCouponIds]);

  // Achievements
  const achievements = useMemo(
    () => calculateAchievements(stats.redeemed, stats.total, stats.redeemedByCategory),
    [stats]
  );

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  // Redeemed coupons with dates
  const redeemedCoupons = useMemo(() => {
    const couponsData = getRedeemedCoupons(redeemedCouponIds);
    return couponsData.map((coupon) => ({
      ...coupon,
      redeemedDate: new Date().toISOString(),
    }));
  }, [redeemedCouponIds]);

  // Filtered and sorted coupons
  const filteredCoupons = useMemo(() => {
    let filtered = redeemedCoupons;

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((coupon) => coupon.category === filterCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coupon) =>
          coupon.title.toLowerCase().includes(query) ||
          coupon.description.toLowerCase().includes(query) ||
          coupon.category.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortMode) {
      case 'date':
        return filtered.sort(
          (a, b) => new Date(b.redeemedDate).getTime() - new Date(a.redeemedDate).getTime()
        );
      case 'category':
        return filtered.sort((a, b) => a.category.localeCompare(b.category));
      case 'name':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, special: 3 };
        return filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      default:
        return filtered;
    }
  }, [redeemedCoupons, searchQuery, sortMode, filterCategory]);

  // Category data
  const categoryData = useMemo(() => {
    return Object.entries(stats.categoryCounts).map(([category, total]) => ({
      category,
      total,
      redeemed: stats.redeemedByCategory[category as CouponCategory] || 0,
    }));
  }, [stats]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleToggleQR = useCallback((id: number) => {
    setActiveQR((prev) => (prev === id ? null : id));
  }, []);

  const handleDownloadQR = useCallback(async (id: number) => {
    try {
      await downloadQRCode(`qr-${id}`, `kupon-${id}-qr.png`);
      toast.success('QR zapisany jako obraz! 📸', { duration: 3000 });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Nie udało się pobrać QR 😢');
    }
  }, []);

  const handleExport = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      achievements,
      coupons: redeemedCoupons,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moj-profil-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Profil wyeksportowany! 📥', { duration: 3000 });
  }, [redeemedCoupons, stats, achievements]);

  const handlePrint = useCallback(() => {
    window.print();
    toast.success('Przygotowano do druku! 🖨️', { duration: 2000 });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    toast.success(`Zmieniono widok! ${mode === 'timeline' ? '📅' : mode === 'grid' ? '🔲' : '📝'}`, {
      duration: 2000,
    });
  }, []);

  const handleSortModeChange = useCallback((mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem(STORAGE_KEYS.SORT_MODE, mode);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Home') scrollToTop();
      if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
        setShowAchievements((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, scrollToTop]);

  if (!mounted) return null;

  // ==========================================================================
  // Render
  // ==========================================================================

  const content = (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-hidden animate-fade-in">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={300}
          recycle={false}
          colors={['#ec4899', '#a855f7', '#f59e0b', '#10b981']}
        />
      )}

      <div
        ref={scrollRef}
        className="glass-strong rounded-3xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-scale-in border border-white/20"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 p-6 md:p-8 rounded-t-3xl z-20 shadow-xl border-b border-white/20">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 font-playfair flex items-center gap-3">
                💝 Twój Profil
                {stats.percentage === 100 && (
                  <span className="text-2xl animate-bounce">🏆</span>
                )}
              </h2>
              <p className="text-white/90 text-sm md:text-base">
                Historia odebranych kuponów, statystyki i osiągnięcia
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold">
                  {stats.percentage}% ukończenia
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold">
                  {unlockedAchievements}/{achievements.length} osiągnięć
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij profil"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all hover:scale-110 shadow-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Statistics Grid */}
          <section>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 font-playfair">
              📊 Twoje Statystyki
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="🎁"
                label="Odebrane"
                value={stats.redeemed}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                subtitle={`z ${stats.total} kuponów`}
              />
              <StatCard
                icon="⏳"
                label="Pozostałe"
                value={stats.remaining}
                color="bg-gradient-to-br from-blue-500 to-cyan-600"
                subtitle="do odebrania"
              />
              <StatCard
                icon="📈"
                label="Postęp"
                value={`${stats.percentage}%`}
                color="bg-gradient-to-br from-purple-500 to-pink-600"
                subtitle="ukończenia"
              />
              <StatCard
                icon="🏆"
                label="Osiągnięcia"
                value={`${unlockedAchievements}/${achievements.length}`}
                color="bg-gradient-to-br from-orange-500 to-red-600"
                subtitle="odblokowanych"
                onClick={() => setShowAchievements(!showAchievements)}
              />
            </div>
          </section>

          {/* Achievements Section */}
          {showAchievements && (
            <section className="animate-fade-in">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 font-playfair">
                🏆 Osiągnięcia
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {achievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}

          {/* Category Progress */}
          <section>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 font-playfair">
              📂 Postęp według kategorii
            </h3>
            <div className="glass-strong rounded-2xl p-6 shadow-lg border border-white/20">
              {categoryData.map((item) => (
                <CategoryProgress
                  key={item.category}
                  category={item.category}
                  redeemed={item.redeemed}
                  total={item.total}
                  color="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                  onClick={() =>
                    setFilterCategory(
                      filterCategory === item.category ? 'all' : (item.category as FilterCategory)
                    )
                  }
                />
              ))}
            </div>
          </section>

          {/* Controls */}
          {redeemedCoupons.length > 0 && (
            <section>
              <div className="glass-strong rounded-2xl p-4 md:p-6 shadow-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <input
                      type="text"
                      placeholder="🔍 Szukaj kuponu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* View Mode */}
                  <div className="flex gap-2">
                    {(['timeline', 'grid', 'list'] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleViewModeChange(mode)}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
                          viewMode === mode
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title={`Widok ${mode === 'timeline' ? 'osi czasu' : mode === 'grid' ? 'siatki' : 'listy'}`}
                      >
                        {mode === 'timeline' ? '📅' : mode === 'grid' ? '🔲' : '📝'}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <select
                    value={sortMode}
                    onChange={(e) => handleSortModeChange(e.target.value as SortMode)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none transition-all font-medium shadow-sm"
                  >
                    <option value="date">📅 Sortuj: Data</option>
                    <option value="category">📂 Sortuj: Kategoria</option>
                    <option value="name">🔤 Sortuj: Nazwa</option>
                    <option value="difficulty">⭐ Sortuj: Trudność</option>
                  </select>
                </div>

                {/* Category Filter */}
                {filterCategory !== 'all' && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Filtr:
                    </span>
                    <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm font-bold">
                      {filterCategory}
                    </span>
                    <button
                      onClick={() => setFilterCategory('all')}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                    >
                      ✕ Wyczyść
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Timeline/Grid/List */}
          <section>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 font-playfair">
              🕐 Historia Kuponów
              {(searchQuery || filterCategory !== 'all') && (
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                  ({filteredCoupons.length} wyników)
                </span>
              )}
            </h3>

            {filteredCoupons.length === 0 ? (
              <div className="glass-strong rounded-2xl p-12 text-center shadow-lg border border-white/20">
                <span className="text-7xl mb-4 block animate-bounce-slow">
                  {searchQuery || filterCategory !== 'all' ? '🔍' : '🎁'}
                </span>
                <p className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {searchQuery || filterCategory !== 'all'
                    ? 'Nie znaleziono kuponów'
                    : 'Nie masz jeszcze odebranych kuponów'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery || filterCategory !== 'all'
                    ? 'Spróbuj innej frazy wyszukiwania lub zmień filtr'
                    : 'Otwórz kalendarz i zacznij odbierać swoje niespodzianki!'}
                </p>
                {(searchQuery || filterCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('all');
                    }}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : viewMode === 'list'
                    ? 'space-y-0'
                    : 'relative'
                }
              >
                {viewMode === 'timeline' && (
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-500 rounded-full" />
                )}

                {filteredCoupons.map((coupon, index) => (
                  <TimelineItemComponent
                    key={coupon.id}
                    item={coupon}
                    index={index}
                    showQR={activeQR === coupon.id}
                    onToggleQR={handleToggleQR}
                    viewMode={viewMode}
                    onDownloadQR={handleDownloadQR}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          {redeemedCoupons.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={handleExport}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                💾 Eksportuj Profil
              </button>
              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                🖨️ Drukuj
              </button>
              <button
                onClick={scrollToTop}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                ⬆️ Na górę
              </button>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="font-medium mb-2">⌨️ Skróty klawiszowe:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono">ESC</kbd>{' '}
                zamknij
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono">
                  HOME
                </kbd>{' '}
                na górę
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono">
                  CTRL+A
                </kbd>{' '}
                osiągnięcia
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
