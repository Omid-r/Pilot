#!/usr/bin/env bash
set -Eeuo pipefail

PARALLEL_DIR="${1:-/opt/splunk_parallel}"
PORT="${2:-8001}"
REST_PORT="${3:-8090}"
TCP_PORT="${4:-9998}"
KV_PORT="${5:-8193}"
ADMIN_PASSWORD="${SPLUNK_ADMIN_PASSWORD:-}"
PASS4_SYMM_KEY="${SPLUNK_PASS4SYMMKEY:-}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ -f "$PARALLEL_DIR/bin/splunk" ]] || {
  echo "[ERROR] Real Splunk binary not found at $PARALLEL_DIR/bin/splunk."
  exit 1
}
[[ ${#ADMIN_PASSWORD} -ge 12 ]] || { echo "[ERROR] SPLUNK_ADMIN_PASSWORD must be set (min 12 chars)."; exit 1; }
[[ ${#PASS4_SYMM_KEY} -ge 12 ]] || { echo "[ERROR] SPLUNK_PASS4SYMMKEY must be set (min 12 chars)."; exit 1; }

export SPLUNK_HOME="$PARALLEL_DIR"
export SPLUNK_RUN_AS_ROOT=1

mkdir -p "$PARALLEL_DIR/etc/system/local"
mkdir -p "$PARALLEL_DIR/var/log/splunk"

cat > "$PARALLEL_DIR/etc/system/local/web.conf" <<EOF
[settings]
httpport = $PORT
server.socket_host = 0.0.0.0
startwebserver = 1
mgmtHostPort = 127.0.0.1:$REST_PORT
EOF

cat > "$PARALLEL_DIR/etc/system/local/server.conf" <<EOF
[general]
serverName = splunk-parallel-staging-01
mgmtHostPort = 127.0.0.1:$REST_PORT
pass4SymmKey = $PASS4_SYMM_KEY
active_group = Enterprise

[sslConfig]
mgmtHostPort = 127.0.0.1:$REST_PORT

[kvstore]
port = $KV_PORT
EOF

cat > "$PARALLEL_DIR/etc/system/local/inputs.conf" <<EOF
[default]
host = splunk-parallel-staging
[splunktcp://$TCP_PORT]
disabled = 0
EOF

cat > "$PARALLEL_DIR/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = admin
PASSWORD = $ADMIN_PASSWORD
EOF
chmod 600 "$PARALLEL_DIR/etc/system/local/server.conf"   "$PARALLEL_DIR/etc/system/local/user-seed.conf"

if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --zone=public --add-port="$PORT/tcp"
  firewall-cmd --permanent --zone=public --add-port="$REST_PORT/tcp"
  firewall-cmd --permanent --zone=public --add-port="$TCP_PORT/tcp"
  firewall-cmd --reload
fi

"$PARALLEL_DIR/bin/splunk" restart --accept-license --answer-yes --no-prompt --run-as-root || "$PARALLEL_DIR/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root

sleep 5
STATUS_OUTPUT="$("$PARALLEL_DIR/bin/splunk" status 2>&1 || true)"
echo "$STATUS_OUTPUT"
echo "$STATUS_OUTPUT" | grep -Eqi 'splunkd is running|splunkweb is running' || {
  echo "[ERROR] Splunk runtime is not healthy after repair."
  exit 1
}

HTTP_STATUS="$(curl -ksS -o /dev/null -w '%{http_code}' --connect-timeout 5 "https://127.0.0.1:$PORT/en-US/account/login" 2>/dev/null || true)"
if [[ "$HTTP_STATUS" != "200" && "$HTTP_STATUS" != "303" && "$HTTP_STATUS" != "302" ]]; then
  HTTP_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 "http://127.0.0.1:$PORT/en-US/account/login" 2>/dev/null || true)"
fi

[[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "303" || "$HTTP_STATUS" == "302" ]] || {
  echo "[ERROR] Splunk Web verification failed: HTTP $HTTP_STATUS"
  exit 1
}

echo "[SUCCESS] Real Splunk Web verified on port $PORT."
