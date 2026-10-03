#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.SMOKE_PORT || 3100);
const PASSWORD = process.env.SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD || 'CI-Smoke-Only-2026!';
const BASE = `http://127.0.0.1:${PORT}`;

for (const file of [
  resolve(ROOT, 'data/security-db.json'),
  resolve(ROOT, 'data/master-signing.key'),
  resolve(ROOT, 'data/bootstrap-credentials.txt')
]) {
  if (existsSync(file)) rmSync(file, { force: true });
}

const child = spawn(resolve(ROOT, 'node_modules/.bin/tsx'), ['server.ts'], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'test',
    SPLUNK_HOME: '/opt/splunk',
    SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD: PASSWORD
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
child.stdout.on('data', b => { output += b.toString(); process.stdout.write(b); });
child.stderr.on('data', b => { output += b.toString(); process.stderr.write(b); });

const stop = () => {
  if (!child.killed) child.kill('SIGTERM');
};
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });
process.on('SIGTERM', () => { stop(); process.exit(143); });

async function request(method, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function waitForServer() {
  const deadline = Date.now() + 30000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE + '/');
      if (res.status === 200) return;
      lastError = 'HTTP ' + res.status;
    } catch (e) {
      lastError = String(e);
    }
    if (child.exitCode !== null) {
      throw new Error('server exited early: ' + child.exitCode + '\n' + output);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('server did not become ready: ' + lastError + '\n' + output);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectStatus(method, path, allowed, body, token) {
  const r = await request(method, path, body, token);
  assert(allowed.includes(r.status), `${method} ${path}: expected ${allowed.join('/')} got ${r.status}: ${JSON.stringify(r.json)}`);
  console.log(`[SMOKE] ${method} ${path} -> ${r.status}`);
  return r;
}

try {
  await waitForServer();
  console.log('[SMOKE] GET / -> 200');

  await expectStatus('GET', '/api/real/system', [401]);
  await expectStatus('GET', '/api/real/splunk/preflight', [401]);
  await expectStatus('POST', '/api/real/design', [401], { dailyGb: 10 });

  const login = await expectStatus('POST', '/api/auth/login', [200], {
    username: 'admin',
    password: PASSWORD
  });
  const token = login.json?.token;
  assert(typeof token === 'string' && token.length > 20, 'login did not return a session token');

  await expectStatus('GET', '/api/auth/me', [200], undefined, token);

  const users = await expectStatus('GET', '/api/admin/users', [200], undefined, token);
  assert(Array.isArray(users.json?.users), 'admin users response missing users[]');
  for (const u of users.json.users) {
    assert(!Object.prototype.hasOwnProperty.call(u, 'passwordHash'), 'passwordHash leaked from /api/admin/users');
    assert(!Object.prototype.hasOwnProperty.call(u, 'salt'), 'salt leaked from /api/admin/users');
  }

  const license = await expectStatus('GET', '/api/admin/license', [200], undefined, token);
  assert(license.json?.license?.status === 'UNLICENSED', 'fresh install must start unlicensed/community');

  const system = await expectStatus('GET', '/api/real/system', [200], undefined, token);
  assert(typeof system.json?.hostname === 'string', 'system hostname missing');
  assert(typeof system.json?.platform === 'string', 'system platform missing');

  const network = await expectStatus('POST', '/api/real/network/scan', [200], {}, token);
  assert(Array.isArray(network.json?.interfaces), 'network scan interfaces missing');

  const probe = await expectStatus('POST', '/api/real/node/probe', [200], {
    host: '127.0.0.1',
    sshPort: 22,
    ports: [PORT, 8000, 8088, 8089, 9997]
  }, token);
  assert(probe.json?.probes && typeof probe.json.probes === 'object', 'node probe missing probes');

  const hardening = await expectStatus('POST', '/api/real/hardening/plan', [200], {}, token);
  assert(hardening.json?.findings !== undefined, 'hardening plan missing findings');

  const design = await expectStatus('POST', '/api/real/design', [200], {
    dailyGb: 100,
    retentionDays: 30,
    users: 20,
    searchConcurrency: 10,
    replicationFactor: 3,
    searchFactor: 2
  }, token);
  assert(design.json?.recommendation?.indexers >= 3, 'design recommendation invalid');

  for (const step of ['environment', 'architecture', 'ingestion', 'security']) {
    const r = await expectStatus('POST', '/api/real/overseer/step', [200], { step }, token);
    assert(r.json?.step === step, 'overseer step mismatch');
  }

  for (const step of ['stanza', 'final']) {
    await expectStatus('POST', '/api/real/overseer/step', [404], { step }, token);
  }

  const cluster = await expectStatus('POST', '/api/real/validate/cluster', [200], {
    nodes: [{ ip: '127.0.0.1', ports: [PORT, 65534] }]
  }, token);
  assert(cluster.json?.summary?.nodes === 1, 'cluster validator summary invalid');

  await expectStatus('GET', '/api/real/artifacts', [200], undefined, token);
  await expectStatus('POST', '/api/real/splunk/control', [404], { action: 'start' }, token);
  await expectStatus('POST', '/api/real/deploy/direct', [403, 404], {}, token);
  await expectStatus('POST', '/api/real/deploy/container', [403, 404], {}, token);
  await expectStatus('POST', '/api/real/deploy/kubernetes', [403, 503], {}, token);

  console.log('SMOKE PASS: real control-plane baseline');
} catch (error) {
  console.error('SMOKE FAIL:', error instanceof Error ? error.stack : error);
  stop();
  process.exitCode = 1;
} finally {
  setTimeout(stop, 100);
}
