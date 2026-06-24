import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any active or legacy service workers to prevent cache-poisoning/blank screen issues on public custom domains
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let hasUnregistered = false;
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Legacy Service Worker unregistered successfully:', registration);
          hasUnregistered = true;
        }
      });
    }
    // If we unregistered a service worker, reload the page once to load the pristine server assets
    if (hasUnregistered) {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  }).catch((err) => {
    console.error('Error unregistering service worker:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
