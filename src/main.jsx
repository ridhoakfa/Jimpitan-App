import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './assets/main.css';

// Security utilities
import { setupConsoleSecurity, setupNetworkSecurity } from './utils/security.js';

// PWA utilities
import { registerServiceWorker, setupInstallPrompt, setupNetworkListeners } from './utils/pwa.js';

// Global error handler
window.addEventListener('error', (event) => {
  // Error handling without console output
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Promise rejection handling without console output
});

// ==========================================================
// SERVICE WORKER UPDATE LISTENER
// Auto-reload saat ada versi baru agar user langsung dapat
// update (fix bug yang lama)
// ==========================================================
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Listen message dari SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      console.log('[App] SW updated to version:', event.data.version);
      // Reload halaman setelah 1 detik agar update diterapkan
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });

  // Listen SW controller change (SW baru ambil alih)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[App] New SW controller, reloading...');
    window.location.reload();
  });
}

// Setup security measures
setupConsoleSecurity();
setupNetworkSecurity();

// Performance monitoring
if (import.meta.env.DEV) {
  // You can enable performance tracking here if needed
}

// Register service worker for PWA (only in production)
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Setup PWA install prompt
setupInstallPrompt();

// Setup network status listeners
setupNetworkListeners(
  () => {
    console.log('[App] Network: Online');
  },
  () => {
    console.log('[App] Network: Offline');
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);