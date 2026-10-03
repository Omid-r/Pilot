#!/usr/bin/env bash
set -euo pipefail

PARALLEL_DIR="${1:-/opt/splunk_parallel}"
PORT="${2:-8001}"
REST_PORT="${3:-8090}"
TCP_PORT="${4:-9998}"
KV_PORT="${5:-8193}"
ADMIN_PASSWORD="${6:-}"
PASS4_SYMMKEY="${7:-}"

[[ "$(id -u)" -eq 0 ]] || { echo "ERROR: run as root"; exit 1; }
[[ -f "${PARALLEL_DIR}/bin/splunk" ]] || { echo "ERROR: real Splunk binary not found"; exit 1; }
[[ "${#ADMIN_PASSWORD}" -ge 12 ]] || { echo "ERROR: admin password required"; exit 1; }
[[ "${#PASS4_SYMMKEY}" -ge 12 ]] || { echo "ERROR: pass4SymmKey required"; exit 1; }

mkdir -p "${PARALLEL_DIR}/etc/system/local"
cat > "${PARALLEL_DIR}/etc/system/local/web.conf" <<EOF
[settings]
httpport = ${PORT}
server.socket_host = 0.0.0.0
startwebserver = 1
enableSplunkWebSSL = false
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF
cat > "${PARALLEL_DIR}/etc/system/local/server.conf" <<EOF
[general]
serverName = splunk-parallel-node
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = ${PASS4_SYMMKEY}
active_group = Enterprise

[sslConfig]
mgmtHostPort = 127.0.0.1:${REST_PORT}

[kvstore]
port = ${KV_PORT}
EOF
cat > "${PARALLEL_DIR}/etc/system/local/inputs.conf" <<EOF
[default]
host = splunk-parallel-node
[splunktcp://${TCP_PORT}]
disabled = 0
EOF
cat > "${PARALLEL_DIR}/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF
chmod 600 "${PARALLEL_DIR}/etc/system/local/user-seed.conf"

if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --zone=public --add-port=${PORT}/tcp
  firewall-cmd --permanent --zone=public --add-port=${REST_PORT}/tcp
  firewall-cmd --permanent --zone=public --add-port=${TCP_PORT}/tcp
  firewall-cmd --reload
fi

export SPLUNK_HOME="${PARALLEL_DIR}"
export SPLUNK_RUN_AS_ROOT=1
"${PARALLEL_DIR}/bin/splunk" btool check
"${PARALLEL_DIR}/bin/splunk" restart --accept-license --answer-yes --no-prompt --run-as-root
STATUS="$( "${PARALLEL_DIR}/bin/splunk" status 2>&1 || true )"
echo "${STATUS}"
grep -Eqi 'splunkd is running|splunkweb is running' <<<"${STATUS}" || exit 1

HTTP_STATUS="000"
for i in {1..30}; do
  HTTP_STATUS="$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "http://127.0.0.1:${PORT}/en-US/account/login" || true)"
  [[ "${HTTP_STATUS}" == "200" || "${HTTP_STATUS}" == "303" ]] && break
  sleep 2
done
[[ "${HTTP_STATUS}" == "200" || "${HTTP_STATUS}" == "303" ]] || { echo "ERROR: HTTP verification failed: ${HTTP_STATUS}"; exit 1; }

echo "SUCCESS: real Splunk Web verified on ${PORT}"
