import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  loginWithSheet,
  verifyToken,
  logoutFromSheet,
} from '../services/sheets';
import { useNavigate } from 'react-router-dom';

const CURRENT_USER_KEY = 'jimpitanCurrentUser';
const TOKEN_KEY = 'jimpitanToken';

const AuthContext = createContext(null);

// Export AuthContext for direct access if needed
export { AuthContext };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem(CURRENT_USER_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch (err) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  
  // Ref untuk cache verify token (hindari call berulang dalam waktu dekat)
  const lastVerifyRef = useRef({ token: null, time: 0 });

  // Persist to localStorage
  const persistCurrentUser = useCallback(() => {
    if (!currentUser) {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, [currentUser, token]);

  // Clear session
  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // Reset cache verify
    lastVerifyRef.current = { token: null, time: 0 };
  }, []);

  // Verify and restore session - dengan cache 30 detik
  const verifyAndRestoreSession = useCallback(async () => {
    if (!token) return false;
    
    // ==========================================================
    // CACHE: Skip verify kalau baru saja diverifikasi < 30 detik
    // ==========================================================
    const now = Date.now();
    if (
      lastVerifyRef.current.token === token &&
      (now - lastVerifyRef.current.time) < 30000 &&
      currentUser
    ) {
      return true;
    }
    
    setLoading(true);
    try {
      const response = await verifyToken(token);
      if (response.status === 'success' && response.data) {
        setCurrentUser(response.data);
        // Update cache timestamp
        lastVerifyRef.current = { token, time: now };
        return true;
      } else {
        clearSession();
        return false;
      }
    } catch (err) {
      clearSession();
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, clearSession, currentUser]);

  // Ensure session is loaded
  const ensureLoaded = useCallback(async () => {
    if (token && !currentUser) {
      await verifyAndRestoreSession();
    }
    setInitialized(true);
  }, [token, currentUser, verifyAndRestoreSession]);

  // Login
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await loginWithSheet(username.trim(), password.trim());
      
      if (response.status === 'success' && response.data) {
        setCurrentUser(response.data);
        setToken(response.data.token);
        // Update cache verify timestamp
        lastVerifyRef.current = { token: response.data.token, time: Date.now() };
        return response.data;
      } else {
        throw new Error(response.message || 'Login gagal');
      }
    } catch (err) {
      setError(err.message || 'Login gagal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        await logoutFromSheet(token);
      }
    } catch (err) {
      // Logout error ignored
    } finally {
      clearSession();
      setLoading(false);
      // Clear navigation state by using replace and no state
      navigate('/login', { replace: true, state: {} });
    }
  }, [token, clearSession, navigate]);

  // Persist user data when it changes
  useEffect(() => {
    persistCurrentUser();
  }, [persistCurrentUser]);

  // Initialize on mount
  useEffect(() => {
    ensureLoaded();
  }, []);

  // Setup global token invalid handler
  useEffect(() => {
    // Import setTokenInvalidHandler dynamically to avoid circular dependency
    import('../services/sheets').then(({ setTokenInvalidHandler }) => {
      setTokenInvalidHandler(() => {
        clearSession();
        navigate('/login', { replace: true });
      });
    });
  }, [clearSession, navigate]);

  // Auto-check token expiry every 30 minutes (not too aggressive)
  useEffect(() => {
    if (!token || !currentUser) return;

    const checkTokenExpiry = async () => {
      try {
        const response = await verifyToken(token);
        if (response.status !== 'success') {
          // Token expired or invalid
          clearSession();
          navigate('/login', { replace: true });
        } else {
          // Update cache timestamp
          lastVerifyRef.current = { token, time: Date.now() };
        }
      } catch (err) {
        // Network errors or temporary issues - don't logout immediately
        // Only logout if explicitly unauthorized
        if (err.message && err.message.includes('unauthorized')) {
          clearSession();
          navigate('/login', { replace: true });
        }
      }
    };

    // Don't check immediately on mount - let the page load first
    // Only check periodically
    const interval = setInterval(checkTokenExpiry, 30 * 60 * 1000); // Every 30 minutes
    
    return () => clearInterval(interval);
  }, [token, currentUser, clearSession, navigate]);

  const value = {
    currentUser,
    token,
    loading,
    error,
    initialized,
    login,
    logout,
    verifyAndRestoreSession,
    ensureLoaded,
    isAdmin: currentUser?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Also export as default for flexibility
export default { AuthProvider, useAuth };