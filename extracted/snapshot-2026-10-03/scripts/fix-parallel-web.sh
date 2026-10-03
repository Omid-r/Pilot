#!/usr/bin/env bash
set -euo pipefail

PARALLEL_DIR="${1:-/opt/splunk_parallel}"
PORT="${2:-8001}"
REST_PORT="${3:-8090}"
TCP_PORT="${4:-9998}"
KV_PORT="${5:-8193}"
ADMIN_PASSWORD="${6:-}"
PASS4SYMMKEY="${7:-}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ -x "$PARALLEL_DIR/bin/splunk" ]] || { echo "[ERROR] Real Splunk binary not found at $PARALLEL_DIR/bin/splunk."; exit 2; }
[[ ${#ADMIN_PASSWORD} -ge 12 ]] || { echo "[ERROR] A real admin password is required."; exit 3; }
[[ ${#PASS4SYMMKEY} -ge 32 ]] || { echo "[ERROR] A real pass4SymmKey is required."; exit 4; }

export SPLUNK_HOME="$PARALLEL_DIR"
export SPLUNK_RUN_AS_ROOT=1

for p in "$PORT" "$REST_PORT" "$TCP_PORT" "$KV_PORT"; do fuser -k "${p}/tcp" >/dev/null 2>&1 || true; done
mkdir -p "$PARALLEL_DIR/etc/system/local" "$PARALLEL_DIR/var/log/splunk" "$PARALLEL_DIR/var/run/splunk" "$PARALLEL_DIR/var/lock/splunk"

cat > "$PARALLEL_DIR/etc/system/local/web.conf" <<EOF
[settings]
httpport = ${PORT}
server.socket_host = 0.0.0.0
startwebserver = 1
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF
cat > "$PARALLEL_DIR/etc/system/local/server.conf" <<EOF
[general]
serverName = splunk-parallel-$(hostname -s)
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = ${PASS4SYMMKEY}

[kvstore]
port = ${KV_PORT}
EOF
cat > "$PARALLEL_DIR/etc/system/local/inputs.conf" <<EOF
[default]
host = splunk-parallel-$(hostname -s)

[splunktcp://${TCP_PORT}]
disabled = 0
EOF
if [[ ! -f "$PARALLEL_DIR/etc/system/local/user-seed.conf" ]]; then
cat > "$PARALLEL_DIR/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF
fi
chmod 0600 "$PARALLEL_DIR/etc/system/local/user-seed.conf"

if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --zone=public --add-port="${PORT}/tcp"
  firewall-cmd --permanent --zone=public --add-port="${REST_PORT}/tcp"
  firewall-cmd --permanent --zone=public --add-port="${TCP_PORT}/tcp"
  firewall-cmd --reload
fi

"$PARALLEL_DIR/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root

STATUS_OUT="$("$PARALLEL_DIR/bin/splunk" status 2>&1 || true)"
echo "$STATUS_OUT"
grep -qi "splunkd is running\|splunkweb is running" <<<"$STATUS_OUT" || { echo "[ERROR] Real Splunk is not running."; exit 5; }
HTTP_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://127.0.0.1:${PORT}/en-US/account/login" || true)"
[[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "303" ]] || { echo "[ERROR] HTTP verification failed: $HTTP_STATUS"; exit 6; }
echo "[SUCCESS] Real Splunk Web verified at port ${PORT} (HTTP ${HTTP_STATUS})."
