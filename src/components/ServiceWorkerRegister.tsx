'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Viciss-Ledger SW registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Viciss-Ledger SW registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
