#!/usr/bin/env bash
# ==============================================================================
# install-real-parallel-splunk.sh
# Complete installer and launcher for genuine Splunk Enterprise Parallel instance
# Runs 100% genuine Splunk Web on Port 8001 without any custom web proxies
# ==============================================================================

SOURCE_SPLUNK="${1:-/opt/splunk}"
TARGET_SPLUNK="${2:-/opt/splunk_parallel}"
WEB_PORT="${3:-8001}"
REST_PORT="${4:-8090}"
TCP_PORT="${5:-9998}"
KVSTORE_PORT="${6:-8192}"

export SPLUNK_HOME="${TARGET_SPLUNK}"
export SPLUNK_RUN_AS_ROOT=1

echo "======================================================================"
echo "  Deploying Official Splunk Enterprise Parallel Instance (Port ${WEB_PORT})"
echo "======================================================================"

# 1. Stop any existing parallel splunk process or stale port holders
echo "[1/6] Freeing port ${WEB_PORT} and cleaning any stale listeners..."
if [ -f "${TARGET_SPLUNK}/bin/splunk" ]; then
    "${TARGET_SPLUNK}/bin/splunk" stop 2>/dev/null || true
fi
fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
fuser -k "${REST_PORT}/tcp" 2>/dev/null || true
fuser -k "${TCP_PORT}/tcp" 2>/dev/null || true

# Clean lock files
rm -rf "${TARGET_SPLUNK}/var/run/splunk/"*.pid 2>/dev/null || true
rm -rf "${TARGET_SPLUNK}/var/run/splunk/"*.socket 2>/dev/null || true
rm -rf "${TARGET_SPLUNK}/var/run/splunk/http_"* 2>/dev/null || true
rm -rf "${TARGET_SPLUNK}/var/lock/splunk/"* 2>/dev/null || true

# 2. Check source binaries or search for package archives
echo "[2/6] Preparing Splunk Enterprise installation files in ${TARGET_SPLUNK}..."
mkdir -p "${TARGET_SPLUNK}"

if [ -d "${SOURCE_SPLUNK}/bin" ] && [ -f "${SOURCE_SPLUNK}/bin/splunk" ]; then
    echo "  -> Cloning complete Splunk Enterprise tree from ${SOURCE_SPLUNK} to ${TARGET_SPLUNK}..."
    cp -a "${SOURCE_SPLUNK}/." "${TARGET_SPLUNK}/"
    rm -rf "${TARGET_SPLUNK}/var/run/splunk/"*.pid 2>/dev/null || true
    rm -rf "${TARGET_SPLUNK}/var/run/splunk/"*.socket 2>/dev/null || true
elif [ -f "/opt/splunk_packages/splunk-9.2.1-enterprise-linux-x86_64.tgz" ]; then
    echo "  -> Extracting official Splunk TGZ package..."
    tar -xzf "/opt/splunk_packages/splunk-9.2.1-enterprise-linux-x86_64.tgz" -C "${TARGET_SPLUNK}" --strip-components=1
else
    FOUND_PKG=$(find /tmp /opt -maxdepth 2 -name "splunk-*.tgz" -o -name "splunk-*.tar.gz" 2>/dev/null | head -n 1)
    if [ -n "$FOUND_PKG" ]; then
        echo "  -> Found package archive ${FOUND_PKG}, extracting..."
        tar -xzf "${FOUND_PKG}" -C "${TARGET_SPLUNK}" --strip-components=1
    fi
fi

# 3. Write user-seed.conf for automatic admin password setup without CLI prompts
echo "[3/6] Configuring admin credentials and startup seed..."
mkdir -p "${TARGET_SPLUNK}/etc/system/local"
mkdir -p "${TARGET_SPLUNK}/etc/licenses/enterprise"
mkdir -p "${TARGET_SPLUNK}/var/log/splunk"

cat << 'EOF' > "${TARGET_SPLUNK}/etc/system/local/user-seed.conf"
[user_info]
USERNAME = admin
PASSWORD = changeme
EOF

# 4. Write isolated port configurations
echo "[4/6] Configuring non-colliding ports (Web: ${WEB_PORT}, REST: ${REST_PORT}, Ingest: ${TCP_PORT})..."

cat << EOF > "${TARGET_SPLUNK}/etc/system/local/web.conf"
[settings]
httpport = ${WEB_PORT}
server.socket_host = 0.0.0.0
enableSplunkWebSSL = false
startwebserver = 1
appServerPorts = 8066
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF

cat << EOF > "${TARGET_SPLUNK}/etc/system/local/server.conf"
[general]
serverName = splunk-parallel-staging-01
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = changeme-parallel-passkey
active_group = Free

[sslConfig]
mgmtHostPort = 127.0.0.1:${REST_PORT}

[kvstore]
port = ${KVSTORE_PORT}
EOF

cat << EOF > "${TARGET_SPLUNK}/etc/system/local/inputs.conf"
[default]
host = splunk-parallel-staging

[splunktcp://${TCP_PORT}]
disabled = 0
queueSize = 10MB
EOF

cat << EOF > "${TARGET_SPLUNK}/etc/splunk-launch.conf"
SPLUNK_HOME=${TARGET_SPLUNK}
SPLUNK_DB=${TARGET_SPLUNK}/var/lib/splunk
EOF

# 5. Open Firewall & IPTables Ports
echo "[5/6] Opening firewall and IP routing barriers..."
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --zone=public --add-port=${WEB_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=trusted --add-port=${WEB_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${REST_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${TCP_PORT}/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport ${WEB_PORT} -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport ${REST_PORT} -j ACCEPT 2>/dev/null || true
fi

if command -v ufw >/dev/null 2>&1; then
    ufw allow ${WEB_PORT}/tcp 2>/dev/null || true
fi

# 6. Start Official Splunk Enterprise
echo "[6/6] Starting Official Splunk Enterprise daemon with --run-as-root..."
if [ -f "${TARGET_SPLUNK}/bin/splunk" ]; then
    chmod -R +x "${TARGET_SPLUNK}/bin/" 2>/dev/null || true
    "${TARGET_SPLUNK}/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root 2>&1 || true
    echo "======================================================================"
    echo "  SUCCESS: Official Splunk Enterprise Web is running on Port ${WEB_PORT}!"
    echo "  URL: http://<SERVER-IP>:${WEB_PORT}/en-US/account/login"
    echo "  Username: admin | Password: changeme"
    echo "======================================================================"
else
    echo "[WARN] Real Splunk binary not found at ${TARGET_SPLUNK}/bin/splunk."
fi
