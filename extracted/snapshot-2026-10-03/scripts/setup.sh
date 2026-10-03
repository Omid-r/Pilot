#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
TARGET_DIR="/opt/splunk-doctor"
DATA_DIR="/var/lib/splunk-doctor/data"
SERVICE_FILE="/etc/systemd/system/splunk-doctor.service"

log(){ printf "%s\n" "$*"; }
die(){ log "[-] $*"; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash setup.sh"
command -v systemctl >/dev/null 2>&1 || die "systemd is required."
command -v curl >/dev/null 2>&1 || die "curl is required for the health check."

log "======================================================================"
log "  Splunk Cluster Doctor - Offline RHEL Installer"
log "======================================================================"

log "[1/7] Stopping previous service safely..."
systemctl stop splunk-doctor.service 2>/dev/null || true
systemctl disable splunk-doctor.service 2>/dev/null || true

log "[2/7] Preparing target directories..."
install -d -m 0755 "$TARGET_DIR"
install -d -m 0700 "$DATA_DIR"
rm -rf "$TARGET_DIR/dist" "$TARGET_DIR/scripts" "$TARGET_DIR/systemd" "$TARGET_DIR/node-runtime" "$TARGET_DIR/public"

log "[3/7] Installing application payload..."
cp -a "$SOURCE_DIR/dist" "$TARGET_DIR/"
cp -a "$SOURCE_DIR/scripts" "$TARGET_DIR/"
cp -a "$SOURCE_DIR/package.json" "$TARGET_DIR/" 2>/dev/null || true
cp -a "$SOURCE_DIR/README_OFFLINE.md" "$TARGET_DIR/" 2>/dev/null || true

if [[ -d "$SOURCE_DIR/node-runtime" && -x "$SOURCE_DIR/node-runtime/bin/node" ]]; then
  cp -a "$SOURCE_DIR/node-runtime" "$TARGET_DIR/"
else
  NODE_SYSTEM="$(command -v node 2>/dev/null || true)"
  [[ -n "$NODE_SYSTEM" ]] || die "No bundled Node.js runtime and no system Node.js found."
  install -d -m 0755 "$TARGET_DIR/node-runtime/bin"
  install -m 0755 "$NODE_SYSTEM" "$TARGET_DIR/node-runtime/bin/node"
fi

log "[4/7] Applying safe permissions..."
find "$TARGET_DIR" -type d -exec chmod 0755 {} +
find "$TARGET_DIR" -type f -exec chmod 0644 {} +
chmod 0755 "$TARGET_DIR/node-runtime/bin/node"
chmod 0755 "$TARGET_DIR"/*.sh "$TARGET_DIR"/scripts/*.sh 2>/dev/null || true

log "[5/7] Applying SELinux execution context..."
if command -v semanage >/dev/null 2>&1; then
  semanage fcontext -a -t bin_t "$TARGET_DIR/node-runtime/bin/node" 2>/dev/null || semanage fcontext -m -t bin_t "$TARGET_DIR/node-runtime/bin/node"
  restorecon -v "$TARGET_DIR/node-runtime/bin/node"
else
  chcon -t bin_t "$TARGET_DIR/node-runtime/bin/node" 2>/dev/null || true
fi

log "[6/7] Installing systemd service..."
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Splunk Cluster Doctor & Architecture Studio
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/splunk-doctor
ExecStart=/opt/splunk-doctor/node-runtime/bin/node /opt/splunk-doctor/dist/server.cjs
Restart=on-failure
RestartSec=3
KillMode=mixed
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SPLUNK_HOME=/opt/splunk
Environment=SPLUNK_DOCTOR_DATA_DIR=/var/lib/splunk-doctor/data
UMask=0077
LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable splunk-doctor.service

log "[7/7] Starting and verifying service..."
systemctl restart splunk-doctor.service

for _ in {1..20}; do
  systemctl is-active --quiet splunk-doctor.service && break
  sleep 1
done

if ! systemctl is-active --quiet splunk-doctor.service; then
  systemctl --no-pager -l status splunk-doctor.service || true
  journalctl -u splunk-doctor.service -n 80 --no-pager || true
  die "splunk-doctor.service did not start."
fi

if systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --zone=public --add-port=3000/tcp
  firewall-cmd --reload
fi

HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 http://127.0.0.1:3000 || true)"
[[ "$HTTP_CODE" == "200" ]] || { journalctl -u splunk-doctor.service -n 80 --no-pager || true; die "Application health check failed. HTTP=$HTTP_CODE"; }

SERVER_IP="$(hostname -I 2>/dev/null | awk "{print $1}")"
log "======================================================================"
log "  [SUCCESS] Splunk Cluster Doctor is running."
log "  Web UI: http://${SERVER_IP:-127.0.0.1}:3000"
log "  Service: systemctl status splunk-doctor"
log "  Logs:    journalctl -u splunk-doctor -f"
log "======================================================================"
