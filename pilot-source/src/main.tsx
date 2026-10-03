
// Attach the current session token to same-origin API calls made by all legacy UI components.
// This preserves the existing UI structure while enforcing the server-side authentication boundary.
const nativeFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, window.location.href);
  const isApi = url.origin === window.location.origin && url.pathname.startsWith('/api/');
  const isLogin = url.pathname === '/api/auth/login';
  if (!isApi || isLogin) return nativeFetch(input, init);

  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

  const token = window.localStorage.getItem('splunk_doctor_auth_token');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  return nativeFetch(input, { ...init, headers });
}) as typeof window.fetch;

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
