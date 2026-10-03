import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'CI-Pilot-Smoke-20261003!';
const DATA_DIR = '/tmp/pilot-smoke-data';
fs.rmSync(DATA_DIR, { recursive: true, force: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(PORT),
  SPLUNK_HOME: '/tmp/pilot-no-splunk',
  SPLUNK_DOCTOR_DATA_DIR: DATA_DIR,
  SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD: PASSWORD,
  SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD_FILE: '/tmp/pilot-smoke-admin-password'
};

function request(pathname, options = {}, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL(pathname, BASE), {
      method: options.method || 'GET',
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.headers || {})
      },
      timeout: 15000
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode || 0, json, text: data });
      });
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const child = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
child.stdout.on('data', b => { stdout += b.toString(); });
child.stderr.on('data', b => { stderr += b.toString(); });

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error('server exited before readiness');
    try {
      const r = await request('/');
      if (r.status === 200) { ready = true; break; }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  assert(ready, 'server did not become ready');

  let r = await request('/api/real/system');
  assert(r.status === 401, `unauthenticated API should return 401, got ${r.status}`);

  r = await request('/api/auth/login', { method: 'POST' }, { username: 'admin', password: PASSWORD });
  assert(r.status === 200 && r.json?.success && r.json?.token, `login failed: ${r.status} ${r.text}`);
  const auth = { Authorization: `Bearer ${r.json.token}` };

  const checks = [
    ['GET', '/api/auth/me'],
    ['GET', '/api/real/system'],
    ['POST', '/api/real/network/scan', {}],
    ['POST', '/api/real/hardening/plan', {}],
    ['GET', '/api/real/splunk/preflight'],
    ['GET', '/api/real/artifacts'],
    ['POST', '/api/real/design', { dailyGb: 25, retentionDays: 30, users: 50, searchConcurrency: 10, replicationFactor: 3, searchFactor: 2 }],
    ['POST', '/api/real/overseer/step', { step: 'environment' }],
    ['POST', '/api/real/validate/cluster', { nodes: [{ ip: '127.0.0.1', ports: [3100] }] }],
    ['POST', '/api/tools/validate', { toolId: 'health_audit' }],
    ['POST', '/api/tools/validate-all', {}]
  ];

  for (const [method, path, body] of checks) {
    r = await request(path, { method, headers: auth }, body);
    assert(r.status === 200, `${method} ${path} failed: ${r.status} ${r.text.slice(0, 1000)}`);
  }

  r = await request('/api/tools/validate-all', { method: 'POST', headers: auth }, {});
  assert(Number(r.json?.healthyCount || 0) + Number(r.json?.warningCount || 0) === Number(r.json?.totalTools || -1),
    'validate-all counts are inconsistent');

  const negative = [
    ['POST', '/api/real/deploy/direct', {}],
    ['POST', '/api/real/deploy/container', { runtime: 'podman' }],
    ['POST', '/api/real/deploy/kubernetes', { adminPassword: PASSWORD }],
    ['POST', '/api/real/splunk/control', { action: 'start' }],
    ['POST', '/api/virtual-server/recreate', {}],
    ['POST', '/api/alerts/test', {}],
    ['POST', '/api/splunk/confs/reset-test', {}]
  ];

  for (const [method, path, body] of negative) {
    r = await request(path, { method, headers: auth }, body);
    assert(r.status >= 400, `${method} ${path} unexpectedly succeeded: ${r.status} ${r.text}`);
  }

  r = await request('/api/system/terminal/exec', { method: 'POST' }, { command: 'id' });
  assert(r.status === 401, `terminal endpoint must require auth, got ${r.status}`);

  console.log('[SMOKE] PASS: real control plane, auth, validators and negative prerequisite checks');
} catch (e) {
  console.error('[SMOKE] FAIL:', e.message);
  console.error('STDOUT:', stdout);
  console.error('STDERR:', stderr);
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
}
