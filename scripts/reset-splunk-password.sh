#!/usr/bin/env bash
# ==============================================================================
# reset-splunk-password.sh
# Instant Admin Password Reset & Web Authentication Repair for Splunk Instance
# ==============================================================================

set -e

SPLUNK_DIR="${1:-/opt/splunk_parallel}"
ADMIN_USER="${2:-admin}"
NEW_PASSWORD="${3:-changeme}"

echo "======================================================================"
echo "  [SPLUNK AUTH REPAIR] Resetting Admin Password for ${SPLUNK_DIR}"
echo "======================================================================"

if [ ! -d "${SPLUNK_DIR}" ]; then
  echo "[-] Directory ${SPLUNK_DIR} not found!"
  exit 1
fi

export SPLUNK_HOME="${SPLUNK_DIR}"
export SPLUNK_RUN_AS_ROOT=1

# 1. Stop Splunk daemon temporarily if running to rewrite authentication table
echo "==> 1. Stopping Splunk daemon cleanly..."
if [ -f "${SPLUNK_DIR}/bin/splunk" ]; then
  "${SPLUNK_DIR}/bin/splunk" stop --run-as-root 2>/dev/null || true
fi
fuser -k 8001/tcp 2>/dev/null || true
fuser -k 8090/tcp 2>/dev/null || true

# 2. Remove stale / inherited passwd files so user-seed.conf takes 100% priority
echo "==> 2. Removing inherited/stale passwd hashes..."
rm -f "${SPLUNK_DIR}/etc/passwd" 2>/dev/null || true
rm -f "${SPLUNK_DIR}/etc/system/local/passwd" 2>/dev/null || true
rm -f "${SPLUNK_DIR}/etc/auth/passwd" 2>/dev/null || true

# 3. Write user-seed.conf with designated credentials
echo "==> 3. Writing fresh user-seed.conf (Username: ${ADMIN_USER})..."
mkdir -p "${SPLUNK_DIR}/etc/system/local"
cat << EOF > "${SPLUNK_DIR}/etc/system/local/user-seed.conf"
[user_info]
USERNAME = ${ADMIN_USER}
PASSWORD = ${NEW_PASSWORD}
EOF

# 4. Ensure Enterprise / Trial license group in server.conf (Free group disables login auth)
if [ -f "${SPLUNK_DIR}/etc/system/local/server.conf" ]; then
  sed -i 's/active_group\s*=\s*Free/active_group = Enterprise/g' "${SPLUNK_DIR}/etc/system/local/server.conf" 2>/dev/null || true
fi

# Disable first-time-login password change tour prompt
cat << EOF > "${SPLUNK_DIR}/etc/system/local/ui-tour.conf"
[splunk_enterprise]
viewed = 1
EOF

# 5. Start Splunk to compile and hash user credentials
echo "==> 4. Starting Splunk daemon to compile authentication hash..."
if [ -f "${SPLUNK_DIR}/bin/splunk" ]; then
  "${SPLUNK_DIR}/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root
fi

echo "======================================================================"
echo "  [SUCCESS] Admin password reset completed!"
echo "  Web URL:   http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '192.168.232.101'):8001/en-US/account/login"
echo "  Username:  ${ADMIN_USER}"
echo "  Password:  ${NEW_PASSWORD}"
echo "======================================================================"
