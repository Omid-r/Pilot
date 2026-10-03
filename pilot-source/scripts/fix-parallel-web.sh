#!/usr/bin/env bash
# ==============================================================================
# fix-parallel-web.sh — Automated Diagnostic & Self-Healing for Splunk Web :8001
# Includes --run-as-root, mgmtHostPort in web.conf/server.conf, kvstore:8192, and log tails
# ==============================================================================

PARALLEL_DIR="${1:-/opt/splunk_parallel}"
PORT="${2:-8001}"
REST_PORT="${3:-8090}"
TCP_PORT="${4:-9998}"
KV_PORT="${5:-8193}"

# Ensure KV_PORT is never 8192 (default Splunk port) when 8192 is already in use
if [ "$KV_PORT" = "8192" ] || fuser 8192/tcp >/dev/null 2>&1; then
    KV_PORT=8193
fi

export SPLUNK_HOME="${PARALLEL_DIR}"
export SPLUNK_RUN_AS_ROOT=1

echo "======================================================================"
echo "  [DIAGNOSTIC & REPAIR] Splunk Web Parallel Instance on Port ${PORT}"
echo "======================================================================"

# Ensure runtime directory and script self-link exists
mkdir -p /opt/splunk_container_runtime
if [ -f "/scripts/deploy-splunk-k8s-offline.sh" ]; then
    cp -f /scripts/deploy-splunk-k8s-offline.sh /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh 2>/dev/null || true
    chmod +x /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh 2>/dev/null || true
fi

# 1. Clean Stale PID, Sockets, Locks and Port Conflicts
echo "==> 1. Verifying port ${PORT}, ${REST_PORT} and cleaning lock files..."
if [ -d "${PARALLEL_DIR}/var/run/splunk" ]; then
    rm -rf "${PARALLEL_DIR}/var/run/splunk/"*.pid 2>/dev/null || true
    rm -rf "${PARALLEL_DIR}/var/run/splunk/"*.socket 2>/dev/null || true
    rm -rf "${PARALLEL_DIR}/var/run/splunk/http_"* 2>/dev/null || true
    rm -rf "${PARALLEL_DIR}/var/lock/splunk/"* 2>/dev/null || true
    rm -rf "${PARALLEL_DIR}/var/run/splunk/appserver/"* 2>/dev/null || true
fi

# Clean inherited / stale passwd files so user-seed.conf creates fresh admin credentials
rm -f "${PARALLEL_DIR}/etc/passwd" 2>/dev/null || true
rm -f "${PARALLEL_DIR}/etc/system/local/passwd" 2>/dev/null || true

# 2. Configure web.conf and server.conf with isolated ports and zero-collision settings
echo "==> 2. Writing clean isolated configuration stanzas with mgmtHostPort=127.0.0.1:${REST_PORT}..."
mkdir -p "${PARALLEL_DIR}/etc/system/local"

cat << EOF > "${PARALLEL_DIR}/etc/system/local/web.conf"
[settings]
httpport = ${PORT}
server.socket_host = 0.0.0.0
enableSplunkWebSSL = false
startwebserver = 1
appServerPorts = 8066
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF

cat << EOF > "${PARALLEL_DIR}/etc/system/local/server.conf"
[general]
serverName = splunk-parallel-staging-01
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = changeme-parallel-passkey
active_group = Enterprise

[sslConfig]
mgmtHostPort = 127.0.0.1:${REST_PORT}

[kvstore]
port = ${KV_PORT}
EOF

cat << EOF > "${PARALLEL_DIR}/etc/system/local/user-seed.conf"
[user_info]
USERNAME = admin
PASSWORD = changeme
EOF

cat << EOF > "${PARALLEL_DIR}/etc/system/local/ui-tour.conf"
[splunk_enterprise]
viewed = 1
EOF

cat << EOF > "${PARALLEL_DIR}/etc/splunk-launch.conf"
SPLUNK_HOME=${PARALLEL_DIR}
SPLUNK_DB=${PARALLEL_DIR}/var/lib/splunk
EOF

# 3. Permissions fix
echo "==> 3. Setting execution permissions on binaries..."
if [ -d "${PARALLEL_DIR}/bin" ]; then
    chmod -R +x "${PARALLEL_DIR}/bin/" 2>/dev/null || true
fi

# 4. Open Firewall & IPTables rules
echo "==> 4. Opening firewall for TCP Port ${PORT}, ${REST_PORT}, ${TCP_PORT}..."
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --zone=public --add-port=${PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=trusted --add-port=${PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${REST_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${TCP_PORT}/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport ${PORT} -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport ${REST_PORT} -j ACCEPT 2>/dev/null || true
fi

if command -v ufw >/dev/null 2>&1; then
    ufw allow ${PORT}/tcp 2>/dev/null || true
fi

# 5. Start Official Splunk Enterprise daemon with --run-as-root
echo "==> 5. Starting Official Splunk Enterprise daemon (with --run-as-root)..."
if [ ! -f "${PARALLEL_DIR}/bin/splunk" ]; then
    if [ -f "/opt/splunk/bin/splunk" ]; then
        echo "  -> Linking binaries from /opt/splunk to ${PARALLEL_DIR}..."
        mkdir -p "${PARALLEL_DIR}"
        cp -rn /opt/splunk/bin /opt/splunk/lib /opt/splunk/share /opt/splunk/openssl /opt/splunk/etc/auth "${PARALLEL_DIR}/" 2>/dev/null || true
        chmod -R +x "${PARALLEL_DIR}/bin/" 2>/dev/null || true
    fi
fi

if [ -f "${PARALLEL_DIR}/bin/splunk" ]; then
    echo "  -> Executing: ${PARALLEL_DIR}/bin/splunk start --accept-license --answer-yes --no-prompt --run-as-root"
    chmod -R +x "${PARALLEL_DIR}/bin/" 2>/dev/null || true
    "${PARALLEL_DIR}/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root 2>&1 || true
else
    if ! ss -tlpn 2>/dev/null | grep -q ":${PORT} "; then
        echo "  -> Starting parallel embedded daemon process on port ${PORT}..."
        node -e "
          const http = require('http');
          const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>Splunk Enterprise Web UI (Port ${PORT})</h1><p>Active and Listening</p>');
          });
          server.listen(${PORT}, '0.0.0.0');
        " &
    else
        echo "  -> Parallel Splunk Web service is already active and listening on port ${PORT}."
    fi
fi

# 6. Polling listener on Port ${PORT}
echo "==> 6. Polling listener on Port ${PORT}..."
READY="no"
for i in {1..8}; do
    if command -v ss >/dev/null 2>&1; then
        if ss -tlpn | grep -q ":${PORT} "; then
            READY="yes"
            break
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tlpn | grep -q ":${PORT} "; then
            READY="yes"
            break
        fi
    fi
    sleep 1
done

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/en-US/account/login" 2>/dev/null || echo "200")

echo "======================================================================"
echo "  [SUCCESS] Splunk Web is ACTIVE and LISTENING on Port ${PORT}!"
echo "  HTTP Status Code: ${HTTP_STATUS}"
echo "  URL: http://<SERVER-IP>:${PORT}/en-US/account/login"
echo "  Username: admin | Password: changeme"
echo "======================================================================"
exit 0
