import { useState, useEffect } from 'react';
import { promptInstall, canInstall, isInstalled, getInstallInstructions } from '../utils/pwa';
import { useToast } from '../hooks/useToast';

// Konstanta untuk localStorage key
const INSTALL_DISMISS_KEY = 'jimpitan_install_dismissed';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const toast = useToast();

  // Cek apakah user sudah pernah dismiss dalam 1 jam terakhir
  const isDismissedRecently = () => {
    const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!dismissed) return false;
    try {
      const { timestamp } = JSON.parse(dismissed);
      // Jika dismiss kurang dari 1 jam, tidak tampilkan
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  // Tandai dismiss
  const setDismissed = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, JSON.stringify({ timestamp: Date.now() }));
  };

  useEffect(() => {
    // Jika sudah terinstall, tidak tampilkan
    if (isInstalled()) {
      return;
    }

    // Jika baru dismiss, tidak tampilkan
    if (isDismissedRecently()) {
      return;
    }

    // Dengarkan event install available
    const handleInstallAvailable = () => {
      setShowPrompt(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Cek langsung apakah bisa install
    if (canInstall()) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  // Listener untuk event appinstalled
  useEffect(() => {
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setInstalling(false);
      setDismissed(); // anggap sudah selesai
      toast.success('Aplikasi berhasil diinstall!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const result = await promptInstall();
      // promptInstall mengembalikan true jika user install, false jika cancel
      if (result === true) {
        // Sukses install — event appinstalled akan menangani sisanya
        setShowPrompt(false);
        setDismissed();
        // toast akan muncul dari event appinstalled
      } else {
        // User membatalkan
        setShowPrompt(false);
        setDismissed();
        setShowInstructions(true);
        toast.info('Install dibatalkan. Anda bisa install manual melalui menu browser.');
      }
    } catch (error) {
      // Error (misal user tidak memberikan izin atau error lain)
      console.error('Install error:', error);
      setShowPrompt(false);
      setDismissed();
      setShowInstructions(true);
      toast.error('Gagal menginstall. Silakan coba manual.');
    } finally {
      setInstalling(false);
    }
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed();
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  // Jika sudah terinstall atau baru dismiss, tidak tampilkan
  if (isInstalled() || isDismissedRecently()) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <>
      {/* Install Prompt Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-red-600/80 to-red-700/80 backdrop-blur-xl text-white p-3 sm:p-4 shadow-2xl z-50 animate-slide-in border-t border-white/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <svg className="w-6 sm:w-8 h-6 sm:h-8 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">Install Jimpitan App</h3>
              <p className="text-xs sm:text-sm text-red-100 line-clamp-2">
                Install aplikasi untuk akses lebih cepat dan praktis!
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleShowInstructions}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              Cara Install
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-red-600 font-medium text-xs sm:text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
            >
              {installing ? (
                <>
                  <svg className="animate-spin h-3 sm:h-4 w-3 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden sm:inline">Installing...</span>
                </>
              ) : (
                'Install Sekarang'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              aria-label="Tutup"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-scale-in max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible border border-white/30 dark:border-gray-700/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Cara Install</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {instructions.platform === 'ios' ? 'iOS Safari' : 
                     instructions.platform === 'android' ? 'Android Chrome' :
                     instructions.platform === 'desktop' ? 'Desktop Browser' : 'Browser'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseInstructions}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {instructions.instructions.map((step, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-sm">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm pt-0.5">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleCloseInstructions}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Nanti Saja
              </button>
              {canInstall() && (
                <button
                  onClick={async () => {
                    await handleInstall();
                    handleCloseInstructions();
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-colors"
                >
                  Install Sekarang
                </button>
              )}
            </div>

            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                💡 <strong>Tip:</strong> Aplikasi yang terinstall bisa diakses langsung dari home screen dan bekerja lebih cepat!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}