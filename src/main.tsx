import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/LanguageContext';

// Gracefully handle benign third-party/iframe cross-origin script errors
if (typeof window !== 'undefined') {
  const isScriptError = (msg: string) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes('script error') || 
           lower.includes('unexpected token') || 
           lower.includes('cors') || 
           lower.includes('origin') || 
           lower.includes('picker');
  };

  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error && event.error.message) || '';
    if (isScriptError(msg) || !event.filename) {
      console.warn('Suppressed cross-origin or third-party script error:', msg);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const msg = (event.reason && (event.reason.message || event.reason)) || '';
    const msgStr = typeof msg === 'string' ? msg : '';
    if (isScriptError(msgStr)) {
      console.warn('Suppressed unhandled rejection for external script:', msgStr);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
