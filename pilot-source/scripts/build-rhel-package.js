import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const PACKAGE_VERSION = '1.4.0';
const BUILD_DATE = new Date().toISOString();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const stagingDir = path.join('/tmp', 'splunk_doctor_rhel_staging');
const publicDir = path.join(rootDir, 'public');

function die(message) {
  console.error('[RHEL Packager] ERROR:', message);
  process.exit(1);
}

function copyTree(source, target) {
  fs.mkdirSync(target, { recursive: true });
  execFileSync('cp', ['-a', source + '/.', target], { stdio: 'inherit' });
}

function chmodIfExists(file, mode) {
  if (fs.existsSync(file)) fs.chmodSync(file, mode);
}

console.log(`[RHEL Packager] Building standalone RHEL package v${PACKAGE_VERSION}`);
console.log(`[RHEL Packager] Root: ${rootDir}`);

const distDir = path.join(rootDir, 'dist');
const distIndex = path.join(distDir, 'index.html');
const distServer = path.join(distDir, 'server.cjs');

if (!fs.existsSync(distIndex) || !fs.existsSync(distServer)) {
  die('dist/index.html and dist/server.cjs must exist. Run the production build first; the packager never performs a recursive build.');
}

for (const required of ['scripts/setup.sh', 'scripts/uninstall.sh']) {
  if (!fs.existsSync(path.join(rootDir, required))) die(`Missing ${required}`);
}

fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

// Production application.
copyTree(distDir, path.join(stagingDir, 'dist'));

// Operational scripts.
const scriptsTarget = path.join(stagingDir, 'scripts');
fs.mkdirSync(scriptsTarget, { recursive: true });
for (const name of fs.readdirSync(path.join(rootDir, 'scripts'))) {
  const source = path.join(rootDir, 'scripts', name);
  const stat = fs.statSync(source);
  if (stat.isFile() && /\.(sh|py|js|mjs)$/i.test(name)) {
    fs.copyFileSync(source, path.join(scriptsTarget, name));
  }
}
for (const name of ['setup.sh', 'uninstall.sh', 'reinstall-and-run.sh']) {
  const source = path.join(rootDir, 'scripts', name);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(stagingDir, name));
}

// Keep only non-archive UI artifacts.
const sourcePublic = path.join(rootDir, 'public');
if (fs.existsSync(sourcePublic)) {
  const publicTarget = path.join(stagingDir, 'public');
  fs.mkdirSync(publicTarget, { recursive: true });
  for (const name of fs.readdirSync(sourcePublic)) {
    if (/\.(tar\.gz|tgz)$/i.test(name)) continue;
    const source = path.join(sourcePublic, name);
    if (fs.statSync(source).isFile()) fs.copyFileSync(source, path.join(publicTarget, name));
  }
}

// Self-contained Node runtime.
const nodeTarget = path.join(stagingDir, 'node-runtime', 'bin', 'node');
fs.mkdirSync(path.dirname(nodeTarget), { recursive: true });
fs.copyFileSync(process.execPath, nodeTarget);
fs.chmodSync(nodeTarget, 0o755);

const packageJson = {
  name: 'splunk-cluster-doctor-rhel',
  version: PACKAGE_VERSION,
  private: true,
  description: 'Offline Splunk Cluster Doctor control plane for RHEL',
  main: 'dist/server.cjs',
  runtime: { node: process.version, selfContained: true }
};
fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

const startSh = `#!/usr/bin/env bash
set -Eeuo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$DIR/node-runtime/bin/node"
[[ -x "$NODE" ]] || { echo "ERROR: bundled Node runtime missing"; exit 1; }
export NODE_ENV=production
export PORT="${PORT:-3000}"
export SPLUNK_HOME="${SPLUNK_HOME:-/opt/splunk}"
exec "$NODE" "$DIR/dist/server.cjs"
`;
fs.writeFileSync(path.join(stagingDir, 'start.sh'), startSh, { encoding: 'utf8', mode: 0o755 });

const installServiceSh = `#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || { echo "Run as root: sudo bash install-service.sh"; exit 1; }
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$BASE/setup.sh"
`;
fs.writeFileSync(path.join(stagingDir, 'install-service.sh'), installServiceSh, { encoding: 'utf8', mode: 0o755 });

const versionInfo = [
  `VERSION=${PACKAGE_VERSION}`,
  `BUILD_DATE=${BUILD_DATE}`,
  `NODE_RUNTIME=${process.version}`,
  'SELF_CONTAINED_NODE=true',
  'OFFLINE_RUNTIME=true'
].join('\n') + '\n';
fs.writeFileSync(path.join(stagingDir, 'VERSION'), versionInfo, 'utf8');

const readme = `# Splunk Cluster Doctor — Offline RHEL Bundle

Version: ${PACKAGE_VERSION}
Build: ${BUILD_DATE}

Install:
  sudo tar -xzf splunk_cluster_doctor_rhel_v${PACKAGE_VERSION}.tar.gz -C /opt
  cd /opt/splunk-doctor
  sudo bash setup.sh

The bundle contains its own Node.js runtime. Runtime internet access and npm are not required.
Splunk Enterprise binaries/images, RHEL media, and commercial licenses remain operator-supplied offline artifacts.
`;
fs.writeFileSync(path.join(stagingDir, 'README_RHEL.md'), readme, 'utf8');

execFileSync('find', [stagingDir, '-type', 'd', '-exec', 'chmod', '755', '{}', '+']);
execFileSync('find', [stagingDir, '-type', 'f', '-exec', 'chmod', '644', '{}', '+']);
for (const name of ['setup.sh', 'uninstall.sh', 'reinstall-and-run.sh', 'start.sh', 'install-service.sh']) {
  chmodIfExists(path.join(stagingDir, name), 0o755);
}
chmodIfExists(nodeTarget, 0o755);

const wrappedDir = path.join('/tmp', 'splunk_doctor_wrapper');
fs.rmSync(wrappedDir, { recursive: true, force: true });
fs.mkdirSync(path.join(wrappedDir, 'splunk-doctor'), { recursive: true });
copyTree(stagingDir, path.join(wrappedDir, 'splunk-doctor'));

const targetTar = path.join(publicDir, `splunk_cluster_doctor_rhel_v${PACKAGE_VERSION}.tar.gz`);
fs.rmSync(targetTar, { force: true });
execFileSync('tar', ['-czf', targetTar, '-C', wrappedDir, 'splunk-doctor'], { stdio: 'inherit' });

const legacyTar = path.join(publicDir, 'splunk_doctor_standalone_ui.tar.gz');
fs.rmSync(legacyTar, { force: true });
fs.copyFileSync(targetTar, legacyTar);

console.log(`[RHEL Packager] Generated ${targetTar} (${fs.statSync(targetTar).size} bytes)`);
console.log('[RHEL Packager] SUCCESS');
