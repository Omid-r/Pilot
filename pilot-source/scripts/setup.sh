#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
TARGET_DIR="/opt/splunk-doctor"
DATA_DIR="/var/lib/splunk-doctor"
SERVICE_FILE="/etc/systemd/system/splunk-doctor.service"
PORT="${SPLUNK_DOCTOR_PORT:-3000}"

log(){ printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die(){ echo "[ERROR] $*" >&2; exit 1; }
trap 'die "Installation failed at line $LINENO. Check: journalctl -u splunk-doctor -n 100 --no-pager"' ERR

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash setup.sh"

[[ -f "$SOURCE_DIR/dist/server.cjs" ]] || die "dist/server.cjs is missing from this package."
[[ -f "$SOURCE_DIR/dist/index.html" ]] || die "dist/index.html is missing from this package."
[[ -x "$SOURCE_DIR/node-runtime/bin/node" ]] || die "Bundled Node runtime is missing or not executable."

log "Installing Splunk Cluster Doctor into $TARGET_DIR"
systemctl stop splunk-doctor.service 2>/dev/null || true
systemctl disable splunk-doctor.service 2>/dev/null || true

# Preserve existing runtime state across upgrades.
mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"
if [[ -f "$TARGET_DIR/data/security-db.json" && ! -f "$DATA_DIR/security-db.json" ]]; then
  cp -a "$TARGET_DIR/data/security-db.json" "$DATA_DIR/security-db.json"
  chmod 600 "$DATA_DIR/security-db.json"
fi
if [[ -f "$TARGET_DIR/data/master-signing.key" && ! -f "$DATA_DIR/master-signing.key" ]]; then
  cp -a "$TARGET_DIR/data/master-signing.key" "$DATA_DIR/master-signing.key"
  chmod 600 "$DATA_DIR/master-signing.key"
fi

mkdir -p "$TARGET_DIR"
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' -exec rm -rf {} +
cp -a "$SOURCE_DIR/." "$TARGET_DIR/"

# Safe default permissions. Secrets are handled under /var/lib/splunk-doctor.
find "$TARGET_DIR" -type d -exec chmod 755 {} +
find "$TARGET_DIR" -type f -exec chmod 644 {} +
chmod 755 "$TARGET_DIR/node-runtime/bin/node" "$TARGET_DIR/setup.sh" 2>/dev/null || true
chmod 755 "$TARGET_DIR/start.sh" "$TARGET_DIR/install-service.sh" "$TARGET_DIR/uninstall.sh" 2>/dev/null || true
chmod 755 "$TARGET_DIR/scripts/"*.sh 2>/dev/null || true
chmod 700 "$DATA_DIR"
[[ -f "$DATA_DIR/security-db.json" ]] && chmod 600 "$DATA_DIR/security-db.json" || true
[[ -f "$DATA_DIR/master-signing.key" ]] && chmod 600 "$DATA_DIR/master-signing.key" || true
[[ -f "$DATA_DIR/bootstrap-admin-password" ]] && chmod 600 "$DATA_DIR/bootstrap-admin-password" || true

NODE_BIN="$TARGET_DIR/node-runtime/bin/node"
"$NODE_BIN" --version >/dev/null || die "Bundled Node runtime cannot execute on this host."

# SELinux: restore standard contexts and explicitly label the bundled Node binary executable.
if command -v restorecon >/dev/null 2>&1; then
  restorecon -RF "$TARGET_DIR" "$DATA_DIR" || true
fi
if command -v semanage >/dev/null 2>&1; then
  semanage fcontext -a -t bin_t "$TARGET_DIR/node-runtime/bin/node" 2>/dev/null ||   semanage fcontext -m -t bin_t "$TARGET_DIR/node-runtime/bin/node" 2>/dev/null || true
  restorecon -v "$TARGET_DIR/node-runtime/bin/node" || true
elif command -v chcon >/dev/null 2>&1; then
  chcon -t bin_t "$TARGET_DIR/node-runtime/bin/node" || true
fi

cat > "$SERVICE_FILE" <<EOF2
[Unit]
Description=Splunk Cluster Doctor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$TARGET_DIR
ExecStart=$NODE_BIN $TARGET_DIR/dist/server.cjs
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=SPLUNK_HOME=/opt/splunk
Environment=SPLUNK_DOCTOR_DATA_DIR=$DATA_DIR
UMask=0077
NoNewPrivileges=false
LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
EOF2

systemctl daemon-reload
systemctl enable splunk-doctor.service
systemctl start splunk-doctor.service

# Only expose the Doctor UI port by default.
if systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --add-port="$PORT/tcp"
  firewall-cmd --reload
fi

log "Waiting for service health..."
for _ in {1..30}; do
  if systemctl is-active --quiet splunk-doctor.service; then
    if command -v curl >/dev/null 2>&1 && curl -fsS "http://127.0.0.1:$PORT/" >/dev/null; then
      break
    fi
  fi
  sleep 1
done

systemctl is-active --quiet splunk-doctor.service || {
  journalctl -u splunk-doctor -n 100 --no-pager || true
  die "splunk-doctor.service is not running."
}

curl -fsS "http://127.0.0.1:$PORT/" >/dev/null || {
  journalctl -u splunk-doctor -n 100 --no-pager || true
  die "Doctor HTTP endpoint did not become ready."
}

log "Installation completed successfully."
echo "Web UI: http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT"
echo "Service: systemctl status splunk-doctor --no-pager"
echo "Logs:    journalctl -u splunk-doctor -f"
echo "Bootstrap password file: $DATA_DIR/bootstrap-admin-password"
