'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Typy dla backup data
interface BackupData {
  redeemedCoupons: number[];
  exportDate: string;
  version: string;
}

// Konfiguracja
const BACKUP_VERSION = '1.0.0';
const STORAGE_KEY = 'redeemedCoupons';

// Custom hook dla bezpiecznego localStorage
const useSafeLocalStorage = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Sprawdź czy localStorage jest dostępny
    try {
      const testKey = '__test_ls__';
      localStorage.setItem(testKey, 'test');
      localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      setIsAvailable(true);
    } catch (e) {
      console.error('localStorage is not available:', e);
      setIsAvailable(false);
      toast.error('Twoja przeglądarka nie obsługuje zapisywania danych lokalnie');
    }
  }, []);

  const getItem = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      toast.error('Błąd odczytu danych');
      return null;
    }
  }, []);

  const setItem = useCallback((key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      toast.error('Błąd zapisu danych');
      return false;
    }
  }, []);

  const removeItem = useCallback((key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      toast.error('Błąd usuwania danych');
      return false;
    }
  }, []);

  return { isAvailable, getItem, setItem, removeItem };
};

// Walidacja backup data
const validateBackupData = (data: any): data is BackupData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!Array.isArray(data.redeemedCoupons)) {
    return false;
  }

  if (!data.redeemedCoupons.every((id: any) => typeof id === 'number')) {
    return false;
  }

  if (typeof data.exportDate !== 'string') {
    return false;
  }

  return true;
};

// Główny komponent
export default function DataManager() {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const storage = useSafeLocalStorage();

  // Zamknięcie menu przy kliknięciu poza nim
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-manager-menu]')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Export danych
  const exportData = useCallback(async () => {
    if (!storage.isAvailable) {
      toast.error('Brak dostępu do lokalnych danych');
      return;
    }

    setIsExporting(true);

    try {
      const data = storage.getItem(STORAGE_KEY);
      
      if (!data) {
        toast.error('Brak danych do eksportu!', {
          icon: '📭',
          duration: 3000,
        });
        return;
      }

      const parsedData = JSON.parse(data);
      
      const backupData: BackupData = {
        redeemedCoupons: parsedData,
        exportDate: new Date().toISOString(),
        version: BACKUP_VERSION,
      };

      // Konwersja do JSON z formatowaniem
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Utworzenie linku do pobrania
      const link = document.createElement('a');
      link.href = url;
      const fileName = `advent-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL
      URL.revokeObjectURL(url);

      toast.success(`✅ Dane wyeksportowane do: ${fileName}`, {
        duration: 4000,
        icon: '💾',
      });

      setShowMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Wystąpił błąd podczas eksportu danych', {
        icon: '❌',
      });
    } finally {
      setIsExporting(false);
    }
  }, [storage]);

  // Import danych
  const importData = useCallback(async () => {
    if (!storage.isAvailable) {
      toast.error('Brak dostępu do lokalnych danych');
      return;
    }

    fileInputRef.current?.click();
  }, [storage]);

  // Handler dla wybranego pliku
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Walidacja typu pliku
    if (!file.name.endsWith('.json')) {
      toast.error('Nieprawidłowy format pliku! Wybierz plik .json', {
        icon: '⚠️',
        duration: 4000,
      });
      return;
    }

    // Walidacja rozmiaru (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('Plik jest zbyt duży! Maksymalny rozmiar: 1MB', {
        icon: '⚠️',
      });
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      try {
        const content = event.target?.result as string;
        
        if (!content) {
          throw new Error('Plik jest pusty');
        }

        // Parse JSON
        const data = JSON.parse(content);

        // Walidacja struktury danych
        if (!validateBackupData(data)) {
          throw new Error('Nieprawidłowy format danych w pliku');
        }

        // Sprawdź wersję (opcjonalne - dla przyszłej kompatybilności)
        if (data.version !== BACKUP_VERSION) {
          toast.error(`Ostrzeżenie: Plik backup jest w innej wersji (${data.version})`, {
            icon: '⚠️',
            duration: 5000,
          });
        }

        // Zapisz dane
        const success = storage.setItem(
          STORAGE_KEY, 
          JSON.stringify(data.redeemedCoupons)
        );

        if (success) {
          toast.success('✅ Dane zostały zaimportowane pomyślnie!', {
            icon: '📥',
            duration: 4000,
          });

          // Poinformuj użytkownika o potrzebie odświeżenia
          setTimeout(() => {
            if (confirm('Odśwież stronę aby zobaczyć zaimportowane dane. Odświeżyć teraz?')) {
              window.location.reload();
            }
          }, 1000);

          setShowMenu(false);
        }
      } catch (error) {
        console.error('Import error:', error);
        
        let errorMessage = 'Wystąpił błąd podczas importu danych';
        
        if (error instanceof SyntaxError) {
          errorMessage = 'Plik JSON jest uszkodzony lub ma nieprawidłowy format';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage, {
          icon: '❌',
          duration: 5000,
        });
      } finally {
        setIsImporting(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Błąd podczas odczytu pliku', {
        icon: '❌',
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
  }, [storage]);

  // Reset danych
  const resetData = useCallback(() => {
    if (!storage.isAvailable) {
      toast.error('Brak dostępu do lokalnych danych');
      return;
    }

    // Potwierdzenie z użytkownikiem
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-gray-800">⚠️ Resetowanie danych</p>
        <p className="text-sm text-gray-600">
          Czy na pewno chcesz usunąć wszystkie odebrane kupony? Tej operacji nie można cofnąć!
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const success = storage.removeItem(STORAGE_KEY);
              
              if (success) {
                toast.success('✅ Dane zostały zresetowane!', {
                  icon: '🔄',
                });
                
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
              
              toast.dismiss(t.id);
              setShowMenu(false);
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            Tak, resetuj
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            Anuluj
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      icon: '⚠️',
    });
  }, [storage]);

  return (
    <>
      {/* Toast Container */}
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Wybierz plik backup"
      />

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50" data-manager-menu>
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Zarządzanie danymi"
          aria-expanded={showMenu}
          aria-haspopup="true"
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300 active:scale-95"
        >
          <span className="text-2xl" role="img" aria-label="Ustawienia">
            ⚙️
          </span>
        </button>

        {/* Menu Dropdown */}
        {showMenu && (
          <div
            role="menu"
            className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 min-w-[280px] border-2 border-purple-200 dark:border-purple-700 animate-scale-in"
          >
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-center text-lg border-b-2 border-purple-200 dark:border-purple-700 pb-2">
              Zarządzanie Danymi
            </h3>
            
            <div className="space-y-2">
              {/* Export Button */}
              <button
                onClick={exportData}
                disabled={isExporting || !storage.isAvailable}
                role="menuitem"
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {isExporting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Eksportowanie...
                  </>
                ) : (
                  <>
                    💾 Eksportuj Dane
                  </>
                )}
              </button>

              {/* Import Button */}
              <button
                onClick={importData}
                disabled={isImporting || !storage.isAvailable}
                role="menuitem"
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Importowanie...
                  </>
                ) : (
                  <>
                    📥 Importuj Dane
                  </>
                )}
              </button>

              {/* Reset Button */}
              <button
                onClick={resetData}
                disabled={!storage.isAvailable}
                role="menuitem"
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                🔄 Reset Danych
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowMenu(false)}
                role="menuitem"
                className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Zamknij
              </button>
            </div>

            {/* Info Section */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Eksportuj dane aby utworzyć kopię zapasową
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
