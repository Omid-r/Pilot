#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const http = require('http');

const jobId = String(process.env.PILOT_UPDATE_JOB || '');
const updateRoot = String(process.env.PILOT_UPDATE_ROOT || '/var/lib/splunk-doctor/updates');
const appRoot = String(process.env.PILOT_UPDATE_APP_ROOT || '/opt/splunk-doctor');
const backupRoot = String(process.env.PILOT_UPDATE_BACKUP || '');
const targetVersion = String(process.env.PILOT_UPDATE_TARGET || '');
const inboxPath = String(process.env.PILOT_UPDATE_INBOX || '');
const statusPath = path.join(updateRoot, jobId + '.json');

const BACKUP_ITEMS = [
  'dist', 'scripts', 'systemd', 'node-runtime', 'package.json', 'VERSION',
  'start.sh', 'setup.sh', 'install-service.sh', 'uninstall.sh'
];

function readStatus() {
  try { return JSON.parse(fs.readFileSync(statusPath, 'utf8')); }
  catch (_) { return { logs: [] }; }
}
function writeStatus(patch) {
  const next = Object.assign({}, readStatus(), patch, {
    jobId,
    checkedAt: new Date().toISOString()
  });
  fs.writeFileSync(statusPath, JSON.stringify(next, null, 2), { mode: 0o600 });
}
function logLine(line) {
  const current = readStatus();
  const logs = Array.isArray(current.logs) ? current.logs.slice(-199) : [];
  logs.push(String(line));
  writeStatus({ logs });
}
function restartService() {
  return new Promise(resolve => {
    cp.execFile('systemctl', ['restart', 'splunk-doctor.service'], { timeout: 30000 },
      (error, stdout, stderr) => resolve({
        ok: !error,
        stdout: String(stdout || ''),
        stderr: String(stderr || (error ? error.message : ''))
      }));
  });
}
function checkHealth() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:3000/api/health', { timeout: 3000 }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ ok: res.statusCode === 200 && String(data.version || '') === targetVersion, version: String(data.version || 'unknown') });
        } catch (_) {
          resolve({ ok: false, version: 'unknown' });
        }
      });
    });
    req.on('error', () => resolve({ ok: false, version: 'unknown' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, version: 'unknown' }); });
  });
}
async function main() {
  writeStatus({ state: 'restarting', status: 'service_restart_started' });
  logLine('[RESTART] Restarting splunk-doctor.service...');
  const restart = await restartService();
  if (!restart.ok) logLine('[RESTART] systemctl restart returned: ' + restart.stderr);

  for (let i = 0; i < 30; i++) {
    const health = await checkHealth();
    if (health.ok) {
      writeStatus({ state: 'success', status: 'verified', currentVersion: targetVersion, targetVersion });
      logLine('[VERIFY] Pilot ' + targetVersion + ' is healthy on port 3000.');
      try { if (fs.existsSync(inboxPath)) fs.unlinkSync(inboxPath); } catch (_) {}
      try { fs.rmSync(path.join(updateRoot, jobId + '-finalizer.js'), { force: true }); } catch (_) {}
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logLine('[ROLLBACK] New version did not become healthy. Restoring backup...');
  writeStatus({ state: 'rollback', status: 'restoring' });
  for (const item of BACKUP_ITEMS) {
    const src = path.join(backupRoot, item);
    const dst = path.join(appRoot, item);
    if (!fs.existsSync(src)) continue;
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true, force: true });
  }
  logLine('[ROLLBACK] Backup restored. Restarting service...');
  await restartService();
  writeStatus({ state: 'rollback', status: 'restored', currentVersion: 'previous', targetVersion });
}

main().catch(error => {
  try {
    logLine('[FINALIZER ERROR] ' + (error && error.message ? error.message : String(error)));
    writeStatus({ state: 'error', status: 'finalizer_failed', error: error && error.message ? error.message : String(error) });
  } catch (_) {}
  process.exitCode = 1;
});
