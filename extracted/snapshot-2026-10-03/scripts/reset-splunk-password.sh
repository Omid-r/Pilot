#!/usr/bin/env bash
set -euo pipefail

SPLUNK_DIR="${1:-/opt/splunk_parallel}"
ADMIN_USER="${2:-admin}"
NEW_PASSWORD="${3:-}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ -x "$SPLUNK_DIR/bin/splunk" ]] || { echo "[ERROR] Real Splunk binary not found: $SPLUNK_DIR/bin/splunk"; exit 2; }
[[ ${#NEW_PASSWORD} -ge 12 ]] || { echo "[ERROR] Supply a new admin password of at least 12 characters as argument 3."; exit 3; }

export SPLUNK_HOME="$SPLUNK_DIR"
export SPLUNK_RUN_AS_ROOT=1
"$SPLUNK_DIR/bin/splunk" stop >/dev/null 2>&1 || true
mkdir -p "$SPLUNK_DIR/etc/system/local"
install -m 0600 /dev/null "$SPLUNK_DIR/etc/system/local/user-seed.conf"
cat > "$SPLUNK_DIR/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = ${ADMIN_USER}
PASSWORD = ${NEW_PASSWORD}
EOF
"$SPLUNK_DIR/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root
STATUS_OUT="$("$SPLUNK_DIR/bin/splunk" status 2>&1 || true)"
echo "$STATUS_OUT"
grep -qi "splunkd is running" <<<"$STATUS_OUT" || { echo "[ERROR] Splunk is not running after password reset."; exit 4; }
echo "[SUCCESS] Password seed applied and Splunk daemon verified."
