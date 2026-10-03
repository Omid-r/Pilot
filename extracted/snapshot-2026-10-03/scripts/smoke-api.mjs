#!/usr/bin/env node
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const username = process.env.SMOKE_ADMIN_USER || 'admin';
const password = process.env.SMOKE_ADMIN_PASSWORD || 'Splunk@Doctor2026!';

async function call(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.SMOKE_TIMEOUT_MS || 15000));
  try {
    const headers = new Headers(init.headers || {});
    if (init.token) headers.set('Authorization', 'Bearer ' + init.token);
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(base + path, {
      method: init.method || 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
    let data = null;
    try { data = await response.json(); } catch {}
    return { status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const unauth = await call('/api/real/system');
assert(unauth.status === 401, 'protected API accepted unauthenticated request');

const login = await call('/api/auth/login', {
  method: 'POST',
  body: { username, password },
});
assert(login.status === 200 && login.data?.success && login.data?.token, 'admin login failed');
const token = login.data.token;

const checks = [
  ['/api/auth/me', 'GET', undefined],
  ['/api/real/system', 'GET', undefined],
  ['/api/real/network/scan', 'POST', {}],
  ['/api/real/hardening/plan', 'POST', {}],
  ['/api/real/design', 'POST', { dailyGb: 50, retentionDays: 30, users: 25, searchConcurrency: 10, replicationFactor: 3, searchFactor: 2 }],
  ['/api/real/splunk/preflight', 'GET', undefined],
  ['/api/real/artifacts', 'GET', undefined],
  ['/api/real/overseer/step', 'POST', { step: 'environment' }],
  ['/api/real/validate/cluster', 'POST', { nodes: [{ ip: '127.0.0.1', ports: [3000] }] }],
];

for (const [path, method, body] of checks) {
  const result = await call(path, { method, body, token });
  assert(result.status === 200, path + ' returned HTTP ' + result.status);
  assert(result.data?.success === true || path === '/api/auth/me', path + ' did not return a successful real result');
}

const probe = await call('/api/real/node/probe', {
  method: 'POST',
  token,
  body: { host: '127.0.0.1', ports: [3000] },
});
assert(probe.status === 200 && probe.data?.probes?.['3000'], 'local node/port probe failed');

const topology = await call('/api/real/splunk/topology', { token });
assert([200, 404].includes(topology.status), 'unexpected topology status ' + topology.status);

const direct = await call('/api/real/deploy/direct', { method: 'POST', token, body: {} });
assert([403, 404].includes(direct.status), 'direct deployment did not fail without prerequisites');

const control = await call('/api/real/splunk/control', { method: 'POST', token, body: { action: 'start' } });
assert(control.status === 404, 'splunk control did not truthfully fail when Splunk is absent');

console.log('[SMOKE] PASS');
