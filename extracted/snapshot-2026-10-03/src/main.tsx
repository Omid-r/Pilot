import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The UI has many independent modules. Normalize same-origin API calls here so
// every module automatically carries the current authenticated session and
// bypasses stale browser/API caches after a deployment.
const nativeFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const isApiCall = url.startsWith('/') || url.startsWith(window.location.origin);
  if (!isApiCall || !url.includes('/api/')) {
    return nativeFetch(input, init);
  }

  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  const token = localStorage.getItem('splunk_doctor_auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return nativeFetch(input, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
}) as typeof window.fetch;

// Clear browser-side Cache Storage on every application startup. This does not
// touch server data or user settings; it only guarantees that stale cached web
// assets cannot mask a freshly installed version.
try {
  if ('caches' in window) {
    void caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
  }
  sessionStorage.removeItem('splunk_doctor_ui_boot_marker');
  sessionStorage.setItem('splunk_doctor_ui_boot_marker', Date.now().toString());
} catch (_) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
