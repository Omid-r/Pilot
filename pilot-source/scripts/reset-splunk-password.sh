#!/usr/bin/env bash
set -Eeuo pipefail

SPLUNK_DIR="${1:-/opt/splunk_parallel}"
ADMIN_USER="${2:-admin}"
NEW_PASSWORD="${SPLUNK_ADMIN_PASSWORD:-}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ -f "$SPLUNK_DIR/bin/splunk" ]] || { echo "[ERROR] Splunk binary not found: $SPLUNK_DIR/bin/splunk"; exit 1; }

if [[ -z "$NEW_PASSWORD" ]]; then
  read -r -s -p "New Splunk password (min 12 chars): " NEW_PASSWORD
  echo
fi
[[ ${#NEW_PASSWORD} -ge 12 ]] || { echo "[ERROR] Password must be at least 12 characters."; exit 1; }

export SPLUNK_HOME="$SPLUNK_DIR"
export SPLUNK_RUN_AS_ROOT=1

"$SPLUNK_DIR/bin/splunk" stop --run-as-root || true
mkdir -p "$SPLUNK_DIR/etc/system/local"

cat > "$SPLUNK_DIR/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = $ADMIN_USER
PASSWORD = $NEW_PASSWORD
EOF
chmod 600 "$SPLUNK_DIR/etc/system/local/user-seed.conf"

if [[ -f "$SPLUNK_DIR/etc/system/local/server.conf" ]]; then
  if grep -q '^active_group[[:space:]]*=' "$SPLUNK_DIR/etc/system/local/server.conf"; then
    sed -i 's/^active_group[[:space:]]*=.*/active_group = Enterprise/' "$SPLUNK_DIR/etc/system/local/server.conf"
  else
    printf '\nactive_group = Enterprise\n' >> "$SPLUNK_DIR/etc/system/local/server.conf"
  fi
fi

"$SPLUNK_DIR/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root
sleep 4
STATUS_OUTPUT="$("$SPLUNK_DIR/bin/splunk" status 2>&1 || true)"
echo "$STATUS_OUTPUT"
echo "$STATUS_OUTPUT" | grep -Eqi 'splunkd is running|splunkweb is running' || {
  echo "[ERROR] Splunk did not start after password reset."
  exit 1
}
echo "[SUCCESS] Splunk password reset and runtime verified."
