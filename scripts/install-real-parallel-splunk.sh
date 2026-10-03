#!/usr/bin/env bash
set -euo pipefail

SOURCE_SPLUNK="${1:-/opt/splunk}"
TARGET_SPLUNK="${2:-/opt/splunk_parallel}"
WEB_PORT="${3:-8001}"
REST_PORT="${4:-8090}"
TCP_PORT="${5:-9998}"
KVSTORE_PORT="${6:-8193}"
ADMIN_PASSWORD="${7:-}"
PASS4_SYMMKEY="${8:-}"

[[ "$(id -u)" -eq 0 ]] || { echo "ERROR: run as root"; exit 1; }
[[ "${#ADMIN_PASSWORD}" -ge 12 ]] || { echo "ERROR: admin password must be at least 12 characters"; exit 1; }
[[ "${#PASS4_SYMMKEY}" -ge 12 ]] || { echo "ERROR: pass4SymmKey must be at least 12 characters"; exit 1; }

if [[ ! -f "${SOURCE_SPLUNK}/bin/splunk" ]]; then
  echo "ERROR: real Splunk binary not found at ${SOURCE_SPLUNK}/bin/splunk"
  exit 1
fi

export SPLUNK_HOME="${TARGET_SPLUNK}"
export SPLUNK_RUN_AS_ROOT=1

echo "[1/7] Preparing real Splunk parallel instance at ${TARGET_SPLUNK}"
systemctl stop splunk-parallel.service 2>/dev/null || true
if [[ -f "${TARGET_SPLUNK}/bin/splunk" ]]; then
  "${TARGET_SPLUNK}/bin/splunk" stop --run-as-root >/dev/null 2>&1 || true
fi
for p in "${WEB_PORT}" "${REST_PORT}" "${TCP_PORT}" "${KVSTORE_PORT}"; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" >/dev/null 2>&1 || true
  fi
done

rm -rf "${TARGET_SPLUNK}"
mkdir -p "${TARGET_SPLUNK}"
cp -a "${SOURCE_SPLUNK}/." "${TARGET_SPLUNK}/"

echo "[2/7] Writing real authentication and port configuration"
mkdir -p "${TARGET_SPLUNK}/etc/system/local" "${TARGET_SPLUNK}/var/log/splunk"
cat > "${TARGET_SPLUNK}/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF
chmod 600 "${TARGET_SPLUNK}/etc/system/local/user-seed.conf"

cat > "${TARGET_SPLUNK}/etc/system/local/web.conf" <<EOF
[settings]
httpport = ${WEB_PORT}
server.socket_host = 0.0.0.0
startwebserver = 1
enableSplunkWebSSL = false
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF

cat > "${TARGET_SPLUNK}/etc/system/local/server.conf" <<EOF
[general]
serverName = splunk-parallel-node
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = ${PASS4_SYMMKEY}
active_group = Enterprise

[sslConfig]
mgmtHostPort = 127.0.0.1:${REST_PORT}

[kvstore]
port = ${KVSTORE_PORT}
EOF

cat > "${TARGET_SPLUNK}/etc/system/local/inputs.conf" <<EOF
[default]
host = splunk-parallel-node

[splunktcp://${TCP_PORT}]
disabled = 0
EOF

cat > "${TARGET_SPLUNK}/etc/splunk-launch.conf" <<EOF
SPLUNK_HOME=${TARGET_SPLUNK}
SPLUNK_DB=${TARGET_SPLUNK}/var/lib/splunk
EOF

echo "[3/7] Validating the real Splunk binary"
"${TARGET_SPLUNK}/bin/splunk" version

echo "[4/7] Validating configuration with btool"
"${TARGET_SPLUNK}/bin/splunk" btool check

echo "[5/7] Starting the real Splunk service"
"${TARGET_SPLUNK}/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root

echo "[6/7] Verifying service state and listener"
STATUS="$( "${TARGET_SPLUNK}/bin/splunk" status 2>&1 || true )"
echo "${STATUS}"
grep -Eqi 'splunkd is running|splunkweb is running' <<<"${STATUS}" || {
  echo "ERROR: Splunk status verification failed"
  exit 1
}

for i in {1..30}; do
  HTTP_STATUS="$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "http://127.0.0.1:${WEB_PORT}/en-US/account/login" || true)"
  if [[ "${HTTP_STATUS}" == "200" || "${HTTP_STATUS}" == "303" ]]; then
    break
  fi
  sleep 2
done

[[ "${HTTP_STATUS:-000}" == "200" || "${HTTP_STATUS:-000}" == "303" ]] || {
  echo "ERROR: Splunk Web did not become ready; HTTP=${HTTP_STATUS:-000}"
  exit 1
}

echo "[7/7] SUCCESS: real Splunk Web verified at port ${WEB_PORT}; HTTP=${HTTP_STATUS}"
