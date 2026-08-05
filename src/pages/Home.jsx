import { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLocation, useNavigate } from 'react-router-dom'; // <-- tambahkan useNavigate
import TutorialModal from '../components/TutorialModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// Lazy load page components
const ScanQR = lazy(() => import('./ScanQR'));
const Submit = lazy(() => import('./Submit'));
const History = lazy(() => import('./History'));
const MyHistory = lazy(() => import('./MyHistory'));
const Users = lazy(() => import('./Users'));
const Customers = lazy(() => import('./Customers'));
const Config = lazy(() => import('./Config'));

function HomeView({ onNavigate, isAdmin, currentUser }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate(); // tambahkan untuk navigasi ke dashboard petugas

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 px-3 py-4 pb-20 sm:pb-16 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
          {/* Bold Header Banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 rounded-3xl shadow-2xl p-6 mb-4 border-2 border-red-400 dark:border-red-700">
            {/* Logo/Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-black text-white">JIMPITAN</h1>
                <p className="text-xs text-red-100 font-semibold">Manajemen Iuran</p>
              </div>
            </div>

            {/* Welcome Text */}
            <h2 className="text-xl font-bold text-white mb-1">
              Halo{currentUser && `, ${currentUser.name}`} 👋
            </h2>
            <p className="text-sm text-red-100 mb-4">
              {isAdmin
                ? 'Kelola sistem jimpitan dengan akses penuh sebagai admin.'
                : 'Lakukan scan QR dan catat transaksi jimpitan dengan mudah.'}
            </p>

            {/* Quick Action Button */}
            {!isAdmin && (
              <button
                onClick={() => onNavigate('scanqr')}
                className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mb-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Scan QR Sekarang
              </button>
            )}
          </div>

          {/* Admin Quick Stats Grid */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => onNavigate('users')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-red-200/50 dark:border-red-700/30 hover:shadow-xl hover:border-red-400/70 dark:hover:border-red-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Users</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola pengguna</p>
              </button>

              <button
                onClick={() => onNavigate('customers')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-yellow-200/50 dark:border-yellow-700/30 hover:shadow-xl hover:border-yellow-400/70 dark:hover:border-yellow-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Customers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Data nasabah</p>
              </button>

              <button
                onClick={() => onNavigate('history')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-blue-200/50 dark:border-blue-700/30 hover:shadow-xl hover:border-blue-400/70 dark:hover:border-blue-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">History</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Riwayat transaksi</p>
              </button>

              <button
                onClick={() => onNavigate('scanqr')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-green-200/50 dark:border-green-700/30 hover:shadow-xl hover:border-green-400/70 dark:hover:border-green-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Scan QR</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Catat transaksi</p>
              </button>
            </div>
          )}

          {/* Promo Corner / Features Section */}
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">⭐</span> Fitur Unggulan
            </h3>
            
            <div className="space-y-2">
              {/* Feature 1 */}
              <div className="bg-gradient-to-r from-red-500/80 to-orange-500/80 dark:from-red-700/70 dark:to-orange-700/70 backdrop-blur-md rounded-2xl p-4 shadow-lg border-2 border-red-300/50 dark:border-red-600/30 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">QR Scanner</h4>
                    <p className="text-xs text-red-50">Scan cepat & akurat untuk transaksi</p>
                  </div>
                  <span className="text-2xl">📱</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-gradient-to-r from-yellow-500/80 to-amber-500/80 dark:from-yellow-700/70 dark:to-amber-700/70 backdrop-blur-md rounded-2xl p-4 shadow-lg border-2 border-yellow-300/50 dark:border-yellow-600/30 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Data Aman</h4>
                    <p className="text-xs text-yellow-50">Semua data tercatat dan terenkripsi</p>
                  </div>
                  <span className="text-2xl">🔒</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 dark:from-green-700/70 dark:to-emerald-700/70 backdrop-blur-md rounded-2xl p-4 shadow-lg border-2 border-green-300/50 dark:border-green-600/30 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Laporan Real-time</h4>
                    <p className="text-xs text-green-50">Monitoring semua transaksi secara live</p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Petugas */}
          {!isAdmin && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => onNavigate('scanqr')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-red-200/50 dark:border-red-700/30 hover:shadow-xl hover:border-red-400/70 dark:hover:border-red-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">Scan QR</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Scan kode nasabah</p>
              </button>

              <button
                onClick={() => onNavigate('myhistory')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-red-200/50 dark:border-red-700/30 hover:shadow-xl hover:border-red-400/70 dark:hover:border-red-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">Riwayat Saya</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Setoran saya</p>
              </button>

              {/* ===== TAMBAHAN: TUGAS HARI INI ===== */}
              <button
                onClick={() => navigate('/dashboard-petugas')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-4 border-2 border-yellow-200/50 dark:border-yellow-700/30 hover:shadow-xl hover:border-yellow-400/70 dark:hover:border-yellow-600/50 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">Tugas Hari Ini</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Lihat target setoran</p>
              </button>
            </div>
          )}

          {/* CTA Button */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 backdrop-blur-md text-white rounded-xl shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 dark:shadow-red-900/30 dark:hover:shadow-red-800/40 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 border border-red-300/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span>Tutorial</span>
            </button>
          </div>

          {/* Contact Developer */}
          {(import.meta.env.VITE_DEV_WHATSAPP || import.meta.env.VITE_DEV_EMAIL) && (
            <div className="flex flex-wrap justify-center gap-2">
              {import.meta.env.VITE_DEV_WHATSAPP && (
                <a
                  href={`https://wa.me/${import.meta.env.VITE_DEV_WHATSAPP}?text=Halo%20DevsTeam%20Jimpitan`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-red-200/50 dark:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp Devs
                </a>
              )}
              {import.meta.env.VITE_DEV_EMAIL && (
                <a
                  href={`mailto:${import.meta.env.VITE_DEV_EMAIL}?subject=Pertanyaan%20Jimpitan&body=Halo%20Admin%2C%0A%0A`}
                  className="px-5 py-2.5 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-red-200/50 dark:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Devs
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        userRole={isAdmin ? 'admin' : 'petugas'}
      />
    </>
);
}

export default function Home({ onSetNavigate, onViewChange }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('home');
  const [qrHash, setQrHash] = useState(null);

  // Efek untuk membaca state dari navigasi (dari App.jsx)
  useEffect(() => {
    const view = location.state?.view;
    if (view) {
      setCurrentView(view);
      // Hapus state agar tidak mengganggu navigasi berikutnya
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNavigate = (view, data = null) => {
    setCurrentView(view);
    if (data?.qrHash) {
      setQrHash(data.qrHash);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setQrHash(null);
  };

  // Expose navigation function to App.jsx
  useEffect(() => {
    if (onSetNavigate) {
      onSetNavigate(handleNavigate);
    }
  }, [onSetNavigate]);

  // Notify parent when view changes
  useEffect(() => {
    if (onViewChange) {
      onViewChange(currentView);
    }
  }, [currentView, onViewChange]);

  return (
    <div className="w-full h-full">
      {currentView === 'home' && (
        <HomeView onNavigate={handleNavigate} isAdmin={isAdmin} currentUser={currentUser} />
      )}
      {currentView === 'users' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat User..." />}>
          <Users onBack={handleBackToHome} />
        </Suspense>
      )}
      {currentView === 'customers' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Customers..." />}>
          <Customers onBack={handleBackToHome} />
        </Suspense>
      )}
      {currentView === 'history' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Riwayat..." />}>
          <History onBack={handleBackToHome} />
        </Suspense>
      )}
      {currentView === 'myhistory' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Riwayat Saya..." />}>
          <MyHistory onBack={handleBackToHome} />
        </Suspense>
      )}
      {currentView === 'scanqr' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Scan QR..." />}>
          <ScanQR onBack={handleBackToHome} onNavigate={handleNavigate} />
        </Suspense>
      )}
      {currentView === 'submit' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Submit..." />}>
          <Submit onBack={handleBackToHome} qrHash={qrHash} />
        </Suspense>
      )}
      {currentView === 'config' && (
        <Suspense fallback={<LoadingSpinner fullscreen loading text="Memuat Config..." />}>
          <Config onBack={handleBackToHome} />
        </Suspense>
      )}
    </div>
  );
}