'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  coupons, 
  getCouponsByCategory, 
  getRedeemedCoupons, 
  getCouponStats,
  CouponCategory 
} from '../coupons';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

// ==========================================================================
// Types
// ==========================================================================

interface ProfileProps {
  redeemedCouponIds: number[];
  onClose: () => void;
}

interface TimelineItem {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: CouponCategory;
  color: string;
  validUntil: string;
  redeemedDate?: string;
}

type ViewMode = 'timeline' | 'grid' | 'list';
type SortMode = 'date' | 'category' | 'name';

// ==========================================================================
// Helper Components
// ==========================================================================

const StatCard = ({ 
  icon, 
  label, 
  value, 
  color,
  subtitle 
}: { 
  icon: string; 
  label: string; 
  value: number | string; 
  color: string;
  subtitle?: string;
}) => (
  <div className={`${color} rounded-xl p-5 shadow-lg transform hover:scale-105 transition-all cursor-pointer group`}>
    <div className="flex items-center gap-3">
      <span className="text-4xl group-hover:scale-110 transition-transform" role="img" aria-label={label}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-white text-sm font-medium opacity-90">{label}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-white text-xs opacity-75 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

const TimelineItemComponent = ({ 
  item, 
  index,
  showQR,
  onToggleQR,
  viewMode 
}: { 
  item: TimelineItem; 
  index: number;
  showQR: boolean;
  onToggleQR: (id: number) => void;
  viewMode: ViewMode;
}) => {
  const isEven = index % 2 === 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${item.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `kupon-${item.id}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR zapisany jako obraz! 📸');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all animate-fade-in hover:border-pink-500 dark:hover:border-pink-600">
        <div className="text-center mb-3">
          <span className="text-5xl mb-2 inline-block" role="img" aria-label={item.title}>
            {item.emoji}
          </span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
            {item.title}
          </h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.color} text-white`}>
            {item.category}
          </span>
        </div>

        {isExpanded && (
          <div className="animate-fade-in">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              {item.description}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              <p>⏰ Ważny do: {item.validUntil}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-2 rounded-lg font-medium transition-all text-xs"
          >
            {isExpanded ? '👆 Zwiń' : '👇 Rozwiń'}
          </button>
          <button
            onClick={() => onToggleQR(item.id)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg font-medium transition-all text-xs"
          >
            {showQR ? '🔒 Ukryj QR' : '📱 QR'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg animate-fade-in">
            <div className="flex justify-center mb-2">
              <QRCodeSVG 
                id={`qr-${item.id}`}
                value={JSON.stringify({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  validUntil: item.validUntil,
                }, null, 2)}
                size={150}
                level="H"
                includeMargin
              />
            </div>
            <button
              onClick={downloadQR}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-all"
            >
              💾 Pobierz QR
            </button>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-l-4 border-pink-500 hover:shadow-xl transition-all animate-fade-in mb-3">
        <div className="flex items-center gap-4">
          <span className="text-4xl" role="img" aria-label={item.title}>
            {item.emoji}
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            <div className="flex gap-2 mt-1">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.color} text-white`}>
                {item.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ⏰ {item.validUntil}
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggleQR(item.id)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            {showQR ? '🔒 Ukryj' : '📱 QR'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg animate-fade-in flex items-center gap-4">
            <QRCodeSVG 
              id={`qr-${item.id}`}
              value={JSON.stringify({
                id: item.id,
                title: item.title,
                description: item.description,
                validUntil: item.validUntil,
              }, null, 2)}
              size={120}
              level="H"
              includeMargin
            />
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Kod do realizacji kuponu
              </p>
              <button
                onClick={downloadQR}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all w-full"
              >
                💾 Pobierz jako obraz
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Timeline view (default)
  return (
    <div 
      className={`timeline-item mb-8 flex ${isEven ? 'justify-start' : 'justify-end'}`}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className={`w-full md:w-5/12 ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all animate-fade-in hover:border-pink-500 dark:hover:border-pink-600">
          <div className={`flex items-center gap-3 mb-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
            <span className="text-5xl" role="img" aria-label={item.title}>
              {item.emoji}
            </span>
            <div className={isEven ? 'md:text-right' : 'md:text-left'}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {item.title}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${item.color} text-white`}>
                {item.category}
              </span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {item.description}
          </p>

          <div className="space-y-2 mb-4">
            {item.redeemedDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>✓ Odebrano:</span>
                <time className="font-medium">
                  {new Date(item.redeemedDate).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>⏰ Ważny do:</span>
              <time className="font-medium">{item.validUntil}</time>
            </div>
          </div>

          <button
            onClick={() => onToggleQR(item.id)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            {showQR ? '🔒 Ukryj QR' : '📱 Pokaż QR'}
          </button>

          {showQR && (
            <div className="mt-4 bg-white p-4 rounded-lg inline-block w-full animate-fade-in">
              <div className="flex justify-center mb-3">
                <QRCodeSVG 
                  id={`qr-${item.id}`}
                  value={JSON.stringify({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    validUntil: item.validUntil,
                  }, null, 2)}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-xs text-gray-600 text-center mb-2">
                Kod do realizacji kuponu
              </p>
              <button
                onClick={downloadQR}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
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

const CategoryProgress = ({ 
  category, 
  redeemed, 
  total, 
  color 
}: { 
  category: string; 
  redeemed: number; 
  total: number; 
  color: string;
}) => {
  const percentage = total > 0 ? (redeemed / total) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {category}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {redeemed}/{total} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative">
        <div 
          className={`${color} h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// Main Profile Component
// ==========================================================================

export default function Profile({ redeemedCouponIds, onClose }: ProfileProps) {
  const [activeQR, setActiveQR] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Statistics
  const stats = useMemo(() => getCouponStats(redeemedCouponIds), [redeemedCouponIds]);
  
  // Redeemed coupons with dates
  const redeemedCoupons = useMemo(() => {
    const couponsData = getRedeemedCoupons(redeemedCouponIds);
    return couponsData.map(coupon => ({
      ...coupon,
      redeemedDate: new Date().toISOString(),
    }));
  }, [redeemedCouponIds]);

  // Filtered and sorted coupons
  const filteredCoupons = useMemo(() => {
    let filtered = redeemedCoupons;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(coupon => 
        coupon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortMode) {
      case 'date':
        return filtered.sort((a, b) => 
          new Date(b.redeemedDate || 0).getTime() - new Date(a.redeemedDate || 0).getTime()
        );
      case 'category':
        return filtered.sort((a, b) => a.category.localeCompare(b.category));
      case 'name':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered;
    }
  }, [redeemedCoupons, searchQuery, sortMode]);

  // Toggle QR code display
  const handleToggleQR = useCallback((id: number) => {
    setActiveQR(prev => prev === id ? null : id);
  }, []);

  // Category breakdown
  const categoryData = useMemo(() => {
    return Object.entries(stats.categoryCounts).map(([category, total]) => ({
      category,
      total,
      redeemed: stats.redeemedByCategory[category as CouponCategory] || 0,
    }));
  }, [stats]);

  // Export profile data
  const handleExport = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      coupons: redeemedCoupons,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moj-profil-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Profil wyeksportowany! 📥');
  }, [redeemedCoupons, stats]);

  // Print profile
  const handlePrint = useCallback(() => {
    window.print();
    toast.success('Przygotowano do druku! 🖨️');
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Home') scrollToTop();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, scrollToTop]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={scrollRef}
        className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 p-6 rounded-t-3xl z-10 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 font-playfair">
                💝 Twój Profil
              </h2>
              <p className="text-white/90 text-sm md:text-base">
                Historia odebranych kuponów i postępy
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij profil"
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all hover:scale-110"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Statistics Grid */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              📊 Twoje Statystyki
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                icon="🎯"
                label="Cel"
                value={`${stats.total}`}
                color="bg-gradient-to-br from-orange-500 to-red-600"
                subtitle="wszystkich kuponów"
              />
            </div>
          </section>

          {/* Category Progress */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              📂 Postęp według kategorii
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              {categoryData.map((item) => (
                <CategoryProgress
                  key={item.category}
                  category={item.category}
                  redeemed={item.redeemed}
                  total={item.total}
                  color="bg-gradient-to-r from-pink-500 to-purple-500"
                />
              ))}
            </div>
          </section>

          {/* Controls */}
          {redeemedCoupons.length > 0 && (
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Szukaj kuponu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* View Mode */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'timeline'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      title="Widok osi czasu"
                    >
                      📅
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'grid'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      title="Widok siatki"
                    >
                      🔲
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'list'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      title="Widok listy"
                    >
                      📝
                    </button>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none transition-all"
                  >
                    <option value="date">📅 Sortuj: Data</option>
                    <option value="category">📂 Sortuj: Kategoria</option>
                    <option value="name">🔤 Sortuj: Nazwa</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Timeline/Grid/List */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              🕐 Historia Kuponów
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredCoupons.length} wyników)
                </span>
              )}
            </h3>
            
            {filteredCoupons.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg">
                <span className="text-6xl mb-4 block">
                  {searchQuery ? '🔍' : '🎁'}
                </span>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {searchQuery ? 'Nie znaleziono kuponów' : 'Nie masz jeszcze odebranych kuponów'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Spróbuj innej frazy wyszukiwania'
                    : 'Otwórz kalendarz i zacznij odbierać swoje niespodzianki!'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
                  >
                    Wyczyść wyszukiwanie
                  </button>
                )}
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : viewMode === 'list'
                  ? 'space-y-0'
                  : 'relative'
              }>
                {viewMode === 'timeline' && (
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-500" />
                )}

                {filteredCoupons.map((coupon, index) => (
                  <TimelineItemComponent
                    key={coupon.id}
                    item={coupon}
                    index={index}
                    showQR={activeQR === coupon.id}
                    onToggleQR={handleToggleQR}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          {redeemedCoupons.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleExport}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                💾 Eksportuj Profil
              </button>
              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                🖨️ Drukuj
              </button>
              <button
                onClick={scrollToTop}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                ⬆️ Na górę
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
