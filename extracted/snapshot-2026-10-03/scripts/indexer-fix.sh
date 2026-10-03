#!/bin/bash
# =====================================================================
# indexer-fix.sh — run ON THE INDEXER (10.18.32.74)
# Fixes: "TcpOutputProc blocked for blocked_seconds=300" on the HF
# Cause: indexer not listening on 9997 / firewall blocks 9997
# =====================================================================
set -euo pipefail

SPLUNK_HOME="${SPLUNK_HOME:-/opt/splunk}"
SPLUNK="$SPLUNK_HOME/bin/splunk"
LISTEN_PORT="${LISTEN_PORT:-9997}"

echo "=== indexer-fix.sh  $(date -Iseconds)  SPLUNK_HOME=$SPLUNK_HOME  port=$LISTEN_PORT ==="

if [[ ! -x "$SPLUNK" ]]; then
  echo "ERROR: $SPLUNK not found. Set SPLUNK_HOME."
  exit 1
fi

TIMESTAMP=$(date +%F-%H%M%S)
BACKUP="$HOME/splunk-etc-backup-indexer-$TIMESTAMP.tgz"
echo "--> Backup $SPLUNK_HOME/etc/system/local -> $BACKUP"
tar czf "$BACKUP" -C "$SPLUNK_HOME/etc" system/local 2>/dev/null || true
ls -lh "$BACKUP" 2>/dev/null || true

echo ""
echo "== Fixing: writing $SPLUNK_HOME/etc/system/local/inputs.conf =="
if [[ -f "$SPLUNK_HOME/etc/system/local/inputs.conf" ]] && grep -q "splunktcp://$LISTEN_PORT" "$SPLUNK_HOME/etc/system/local/inputs.conf"; then
  echo "Stanza already in local/inputs.conf but not effective — checking disabled flag"
  if grep -q "disabled.*1" "$SPLUNK_HOME/etc/system/local/inputs.conf"; then
    sed -i "s/disabled.*=.*1/disabled = 0/" "$SPLUNK_HOME/etc/system/local/inputs.conf" 2>/dev/null || true
  fi
else
  cat >> "$SPLUNK_HOME/etc/system/local/inputs.conf" <<EOF

[splunktcp://$LISTEN_PORT]
connection_host = ip
disabled = 0
EOF
fi
chown splunk:splunk "$SPLUNK_HOME/etc/system/local/inputs.conf" 2>/dev/null || true
chmod 640 "$SPLUNK_HOME/etc/system/local/inputs.conf"

echo "== Enabling via CLI (idempotent) =="
"$SPLUNK" enable listen "$LISTEN_PORT" 2>&1 || true

echo "== Restarting indexer =="
"$SPLUNK" restart
sleep 15

echo "== Firewall check =="
if command -v firewall-cmd >/dev/null 2>&1; then
  if ! firewall-cmd --list-ports 2>&1 | grep -q "$LISTEN_PORT"; then
    sudo firewall-cmd --add-port="$LISTEN_PORT/tcp" --permanent 2>&1 || true
    sudo firewall-cmd --reload 2>&1 || true
  fi
fi

echo "DONE. Verification: ss -tlnp | grep $LISTEN_PORT"
