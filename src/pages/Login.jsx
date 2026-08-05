import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, verifyAndRestoreSession, token } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const restoreSession = async () => {
      if (token && !currentUser) {
        const restored = await verifyAndRestoreSession();
        if (restored) {
          navigate('/', { replace: true });
        }
      } else if (currentUser) {
        navigate('/', { replace: true });
      }
    };
    
    restoreSession();
  }, [token, currentUser, verifyAndRestoreSession, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      toast.success('Login berhasil!', `Selamat datang, ${user.name}`);
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage = err.message || 'Gagal login. Periksa username dan password Anda.';
      setError(errorMessage);
      toast.error('Login gagal', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center w-full bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-3xl shadow-2xl shadow-red-200/50 dark:shadow-none border-2 border-red-200 dark:border-red-700/50 p-6 md:p-8 w-full max-w-md transition-colors duration-500">
        
        {/* Header dengan Logo MITRAWISESA */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 rounded-2xl p-6 mb-6 text-center -mx-6 -mt-8 rounded-b-none">
          <div className="mb-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full p-1">
              <img 
                src="/mitrawisesa.png" 
                alt="MITRAWISESA" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.className = 'text-white text-3xl font-bold';
                  fallback.textContent = 'M';
                  e.target.parentNode.appendChild(fallback);
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">JIMPITAN</h1>
          <p className="text-sm text-red-100 font-semibold">Karang Taruna Dukuh Mojorejo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Masukkan username Anda"
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Masukkan password Anda"
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-base font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-200/50 dark:shadow-red-900/30 hover:shadow-xl hover:shadow-red-300/50 dark:hover:shadow-red-800/40 transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h12.75M11 20H3a2 2 0 01-2-2V6a2 2 0 012-2h8" />
                </svg>
                Login
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
            <p className="text-sm text-red-700 dark:text-red-400 font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* ========================================================== */}
        {/* TEKS BARU — Lebih Profesional */}
        {/* ========================================================== */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          Digitalisasi Jimpitan Dukuh Mojorejo
        </p>

        {/* ========================================================== */}
        {/* SECTION KONTAK ADMIN — DIHAPUS (Privasi Developer) */}
        {/* ========================================================== */}
        {/* Contact Support — HAPUS! */}
      </div>
    </div>
  );
}