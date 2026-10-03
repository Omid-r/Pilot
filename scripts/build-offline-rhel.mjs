import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = '1.1.0-pilot-20261003';
const OUT_DIR = path.join(ROOT, 'public');
const STAGE = '/tmp/pilot-splunk-doctor-rhel-stage';
const ARCHIVE = path.join(OUT_DIR, `splunk_cluster_doctor_pilot_${VERSION}.tar.gz`);

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(path.join(STAGE, 'splunk-doctor', 'node-runtime', 'bin'), { recursive: true });

const APP = path.join(STAGE, 'splunk-doctor');
fs.cpSync(path.join(ROOT, 'dist'), path.join(APP, 'dist'), { recursive: true });
fs.cpSync(path.join(ROOT, 'scripts'), path.join(APP, 'scripts'), { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), path.join(APP, 'public'), { recursive: true });

fs.copyFileSync(process.execPath, path.join(APP, 'node-runtime', 'bin', 'node'));

const setup = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
TARGET="/opt/splunk-doctor"

if [ "\$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root: sudo bash setup.sh"
  exit 1
fi

systemctl stop splunk-doctor.service 2>/dev/null || true
systemctl disable splunk-doctor.service 2>/dev/null || true

mkdir -p "$TARGET"
cp -a "$ROOT_DIR/." "$TARGET/"

# Safe permissions: directories 0755, ordinary files 0644, executables 0755.
find "$TARGET" -type d -exec chmod 0755 {} +
find "$TARGET" -type f -exec chmod 0644 {} +
chmod 0755 "$TARGET/setup.sh" "$TARGET/reinstall-and-run.sh" "$TARGET/node-runtime/bin/node"
find "$TARGET/scripts" -type f -name '*.sh' -exec chmod 0755 {} + 2>/dev/null || true

# SELinux: restore normal labels, then make the bundled Node executable.
if command -v restorecon >/dev/null 2>&1; then
  restorecon -RF "$TARGET" >/dev/null 2>&1 || true
fi
if command -v semanage >/dev/null 2>&1; then
  semanage fcontext -a -t bin_t "$TARGET/node-runtime/bin/node" >/dev/null 2>&1 || \
  semanage fcontext -m -t bin_t "$TARGET/node-runtime/bin/node" >/dev/null 2>&1 || true
  restorecon -v "$TARGET/node-runtime/bin/node" >/dev/null 2>&1 || true
elif command -v chcon >/dev/null 2>&1; then
  chcon -t bin_t "$TARGET/node-runtime/bin/node" >/dev/null 2>&1 || true
fi

NODE="$TARGET/node-runtime/bin/node"
"$NODE" --version >/dev/null

cat > /etc/systemd/system/splunk-doctor.service <<EOF
[Unit]
Description=Splunk Cluster Doctor & Architecture Studio
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$TARGET
ExecStart=$NODE $TARGET/dist/server.cjs
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SPLUNK_HOME=/opt/splunk
Environment=SPLUNK_DOCTOR_DATA_DIR=/var/lib/splunk-doctor/data
Environment=SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD_FILE=/var/lib/splunk-doctor/bootstrap-admin-password
UMask=0077
LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/lib/splunk-doctor/data
chmod 0700 /var/lib/splunk-doctor /var/lib/splunk-doctor/data

systemctl daemon-reload
systemctl enable splunk-doctor.service
systemctl restart splunk-doctor.service

if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-port=3000/tcp
  firewall-cmd --reload
fi

sleep 2
if ! systemctl is-active --quiet splunk-doctor.service; then
  journalctl -u splunk-doctor.service -n 100 --no-pager
  exit 1
fi

CODE="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || true)"
case "$CODE" in
  200|302|303|304) ;;
  *) echo "ERROR: local HTTP health check failed: $CODE"; exit 1 ;;
esac

echo "Installed: $TARGET"
echo "URL: http://\$(hostname -I | awk '{print $1}'):3000"
echo "Admin bootstrap password file: /var/lib/splunk-doctor/bootstrap-admin-password"
`;

fs.writeFileSync(path.join(APP, 'setup.sh'), setup, { mode: 0o755 });
fs.writeFileSync(path.join(APP, 'reinstall-and-run.sh'), setup, { mode: 0o755 });

const readme = `# Splunk Cluster Doctor Pilot ${VERSION}

Offline RHEL installer generated from the 2026-10-03 Pilot snapshot.

## Install

    sudo bash setup.sh

The package carries its own Node.js runtime. Runtime internet access is not required.

The installer uses systemd, verifies local HTTP readiness, preserves SELinux enforcement, and stores runtime security state below /var/lib/splunk-doctor.

Splunk Enterprise RPM/TGZ/container images and commercial licenses are operator-supplied offline artifacts.
`;

fs.writeFileSync(path.join(APP, 'README_OFFLINE_RHEL.md'), readme);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.rmSync(ARCHIVE, { force: true });
execFileSync('tar', ['-czf', ARCHIVE, '-C', STAGE, 'splunk-doctor'], { stdio: 'inherit' });

const stat = fs.statSync(ARCHIVE);
console.log(`OFFLINE_RHEL_PACKAGE=${ARCHIVE}`);
console.log(`OFFLINE_RHEL_BYTES=${stat.size}`);
