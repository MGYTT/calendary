'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { coupons } from '../coupons';
import toast from 'react-hot-toast';

interface QrCouponProps {
  couponId: number;
  onClose: () => void;
}

export default function QrCoupon({ couponId, onClose }: QrCouponProps) {
  const coupon = coupons.find(c => c.id === couponId);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [qrSize, setQrSize] = useState(240);

  if (!coupon) return null;

  // Dane do kodu QR
  const qrData = JSON.stringify({
    id: coupon.id,
    title: coupon.title,
    description: coupon.description,
    category: coupon.category,
    validUntil: coupon.validUntil,
    redeemedAt: new Date().toISOString(),
    version: '1.0',
  }, null, 2);

  // Download QR as PNG
  const handleDownloadPNG = useCallback(async () => {
    setIsDownloading(true);
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) throw new Error('QR code not found');

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
        downloadLink.download = `kupon-${coupon.id}-${coupon.title.replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        toast.success('QR zapisany jako obraz! 📸', { duration: 3000 });
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Błąd pobierania QR 😢');
    } finally {
      setIsDownloading(false);
    }
  }, [coupon.id, coupon.title]);

  // Download QR as SVG
  const handleDownloadSVG = useCallback(() => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) throw new Error('QR code not found');

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `kupon-${coupon.id}-${coupon.title.replace(/\s+/g, '-')}.svg`;
      downloadLink.href = url;
      downloadLink.click();
      
      URL.revokeObjectURL(url);
      toast.success('QR zapisany jako SVG! 🎨', { duration: 3000 });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Błąd pobierania SVG 😢');
    }
  }, [coupon.id, coupon.title]);

  // Share QR (Web Share API)
  const handleShare = useCallback(async () => {
    try {
      if (!navigator.share) {
        toast.error('Udostępnianie nie jest dostępne w tej przeglądarce');
        return;
      }

      const svg = qrRef.current?.querySelector('svg');
      if (!svg) throw new Error('QR code not found');

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Failed to create blob');
          
          const file = new File([blob], `kupon-${coupon.id}.png`, { type: 'image/png' });
          
          await navigator.share({
            title: `🎁 ${coupon.title}`,
            text: `Kupon: ${coupon.description}`,
            files: [file],
          });
          
          toast.success('Kupon udostępniony! 🎉', { duration: 3000 });
        }, 'image/png');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Błąd udostępniania 😢');
      }
    }
  }, [coupon.id, coupon.title, coupon.description]);

  // Copy QR data to clipboard
  const handleCopyData = useCallback(() => {
    navigator.clipboard.writeText(qrData)
      .then(() => {
        toast.success('Dane skopiowane do schowka! 📋', { duration: 3000 });
      })
      .catch(() => {
        toast.error('Błąd kopiowania danych 😢');
      });
  }, [qrData]);

  // Print QR
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Zablokowano okno drukowania');
      return;
    }

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kupon QR - ${coupon.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 300px;
            }
            .info {
              margin-top: 20px;
              text-align: left;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${coupon.emoji} ${coupon.title}</h1>
          <div class="qr-container">
            ${svgData}
          </div>
          <div class="info">
            <p><strong>Opis:</strong> ${coupon.description}</p>
            <p><strong>Kategoria:</strong> ${coupon.category}</p>
            <p><strong>Ważny do:</strong> ${coupon.validUntil}</p>
            <p><strong>Data wydruku:</strong> ${new Date().toLocaleDateString('pl-PL')}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast.success('Przygotowano do druku! 🖨️', { duration: 3000 });
  }, [coupon]);

  // Increase brightness for scanning
  const handleBrightnessBoost = useCallback(() => {
    setBrightness(prev => prev === 100 ? 150 : 100);
    toast.success(brightness === 100 ? 'Zwiększono jasność! ☀️' : 'Przywrócono jasność 🌙', { 
      duration: 2000 
    });
  }, [brightness]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'd' || e.key === 'D') handleDownloadPNG();
      if (e.key === 's' || e.key === 'S') handleShare();
      if (e.key === 'p' || e.key === 'P') handlePrint();
      if (e.key === 'b' || e.key === 'B') handleBrightnessBoost();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, handleDownloadPNG, handleShare, handlePrint, handleBrightnessBoost]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-lg w-full text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🎁 Kupon QR
          </h2>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl transition-all hover:scale-110"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm md:text-base">
          Pokaż ten kod, aby potwierdzić realizację kuponu
        </p>

        {/* QR Code */}
        <div 
          ref={qrRef}
          className="bg-white p-6 rounded-2xl mb-6 shadow-inner inline-block mx-auto"
          style={{ filter: `brightness(${brightness}%)` }}
        >
          <QRCodeSVG 
            value={qrData}
            size={qrSize}
            level="H"
            includeMargin
            className="mx-auto"
          />
        </div>

        {/* QR Size Control */}
        <div className="mb-6">
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
            Rozmiar QR: {qrSize}px
          </label>
          <input
            type="range"
            min="180"
            max="320"
            value={qrSize}
            onChange={(e) => setQrSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Coupon Info */}
        <div className="text-left mb-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">
            {coupon.emoji} {coupon.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
            {coupon.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className={`${coupon.color} text-white px-2 py-1 rounded-full font-medium`}>
              {coupon.category}
            </span>
            <span>⏰ Ważny do: {coupon.validUntil}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isDownloading ? '⏳ Zapisywanie...' : '💾 Pobierz PNG'}
          </button>

          <button
            onClick={handleDownloadSVG}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 text-sm"
          >
            🎨 Pobierz SVG
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 text-sm"
          >
            📤 Udostępnij
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 text-sm"
          >
            🖨️ Drukuj
          </button>
        </div>

        {/* Additional Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleBrightnessBoost}
            className="flex-1 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-lg font-medium transition-all text-sm"
          >
            {brightness === 100 ? '☀️ Zwiększ jasność' : '🌙 Normalna jasność'}
          </button>

          <button
            onClick={handleCopyData}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-all text-sm"
          >
            📋 Kopiuj dane
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full font-bold shadow-lg transition-all hover:scale-105 text-base"
        >
          Zamknij
        </button>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Skróty: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> zamknij • <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">D</kbd> pobierz • <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">S</kbd> udostępnij • <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">P</kbd> drukuj • <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">B</kbd> jasność</p>
        </div>
      </div>
    </div>
  );
}
