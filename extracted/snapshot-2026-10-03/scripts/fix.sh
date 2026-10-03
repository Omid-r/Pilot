#!/usr/bin/env bash
# =====================================================================
# fix.sh — one-shot fix for HF that still indexes locally and rejects
#          the Forwarder license.  Run ON THE HEAVY FORWARDER.
#
# Evidence from verify.sh 2026-09-06:
#   - indexAndForward = true (effective)  -> must be false
#   - defaultGroup = (empty) -> Active forwards: None
#   - Configured but inactive: 10.18.23.56 vs btool 10.18.32.74
#
# Usage:
#   chmod +x fix.sh
#   sudo -u splunk ./fix.sh              # uses default INDEXER 10.18.32.74
#   INDEXER_HOST=10.18.23.56 ./fix.sh    # if your indexer is the other IP
#   DRY_RUN=1 ./fix.sh                   # preview without writing/restarting
# =====================================================================
set -euo pipefail

SPLUNK_HOME="${SPLUNK_HOME:-/opt/splunk}"
INDEXER_HOST="${INDEXER_HOST:-10.18.32.74}"
INDEXER_PORT="${INDEXER_PORT:-9997}"
DRY_RUN="${DRY_RUN:-0}"
SPLUNK="$SPLUNK_HOME/bin/splunk"

echo "=== HF fix.sh  $(date -Iseconds)  SPLUNK_HOME=$SPLUNK_HOME  INDEXER=$INDEXER_HOST:$INDEXER_PORT  DRY_RUN=$DRY_RUN ==="

if [[ ! -x "$SPLUNK" ]]; then
  echo "ERROR: $SPLUNK not found or not executable. Set SPLUNK_HOME correctly."
  exit 1
fi

TIMESTAMP=$(date +%F-%H%M%S)
BACKUP_DIR="$HOME/splunk-etc-backup-$TIMESTAMP"
echo "--> Backup $SPLUNK_HOME/etc/system/local -> $BACKUP_DIR and ~/splunk-etc-backup-$TIMESTAMP.tgz"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) tar czf ~/splunk-etc-backup-$TIMESTAMP.tgz -C $SPLUNK_HOME/etc system/local"
  echo "(dry-run) cp -a $SPLUNK_HOME/etc/system/local $BACKUP_DIR"
else
  mkdir -p "$BACKUP_DIR"
  cp -a "$SPLUNK_HOME/etc/system/local/." "$BACKUP_DIR/" 2>/dev/null || true
  tar czf "$HOME/splunk-etc-backup-$TIMESTAMP.tgz" -C "$SPLUNK_HOME/etc" system/local 2>/dev/null || true
  echo "Backup saved."
  ls -lh "$HOME/splunk-etc-backup-$TIMESTAMP.tgz" 2>/dev/null || true
fi

echo ""
echo "== Current broken values (before fix) =="
grep -RIn --include="*.conf" -E "indexAndForward|defaultGroup\s*=|^\[tcpout" "$SPLUNK_HOME/etc/system/local/" 2>/dev/null || true
echo "--- btool effective ---"
"$SPLUNK" btool outputs list --debug 2>/dev/null | grep -E "defaultGroup|indexAndForward|server|disabled" | head -20
echo "--- forward-server ---"
"$SPLUNK" list forward-server 2>&1 | head -20 || true

echo ""
echo "== Writing FIXED outputs.conf =="
OUTPUTS_FIXED="$SPLUNK_HOME/etc/system/local/outputs.conf"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) would write:"
  cat <<EOF
[tcpout]
defaultGroup   = idx_primary
disabled       = false
forwardedindex.0.whitelist = .*
forwardedindex.1.blacklist =
forwardedindex.2.whitelist =
forwardedindex.filter.disable = false
indexAndForward = false

[tcpout:idx_primary]
server       = $INDEXER_HOST:$INDEXER_PORT
compressed   = true
useACK       = true
EOF
else
  cat > "$OUTPUTS_FIXED" <<EOF
[tcpout]
defaultGroup   = idx_primary
disabled       = false
forwardedindex.0.whitelist = .*
forwardedindex.1.blacklist =
forwardedindex.2.whitelist =
forwardedindex.filter.disable = false
indexAndForward = false

[tcpout:idx_primary]
server       = $INDEXER_HOST:$INDEXER_PORT
compressed   = true
useACK       = true
EOF
  chown splunk:splunk "$OUTPUTS_FIXED" 2>/dev/null || chown "$(id -un):$(id -gn)" "$OUTPUTS_FIXED" 2>/dev/null || true
  chmod 640 "$OUTPUTS_FIXED"
  echo "Wrote $OUTPUTS_FIXED:"
  cat "$OUTPUTS_FIXED"
fi

echo ""
echo "== Writing FIXED inputs.conf (parsingQueue only) =="
INPUTS_FIXED="$SPLUNK_HOME/etc/system/local/inputs.conf"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) would write $INPUTS_FIXED"
else
  if [[ -f "$INPUTS_FIXED" ]]; then
    cp "$INPUTS_FIXED" "$INPUTS_FIXED.bak-$TIMESTAMP"
    awk '
      BEGIN{in_default=0}
      /^\[default\]/{in_default=1; next}
      /^\[.*\]/{in_default=0}
      !in_default{print}
    ' "$INPUTS_FIXED.bak-$TIMESTAMP" > /tmp/inputs_rest.tmp 2>/dev/null || true
    {
      echo "[default]"
      echo "indexAndForward = false"
      echo "queue = parsingQueue"
      echo "index = _thefishbucket"
      echo ""
      cat /tmp/inputs_rest.tmp
    } > "$INPUTS_FIXED"
  else
    cat > "$INPUTS_FIXED" <<'EOF'
[default]
indexAndForward = false
queue = parsingQueue
index = _thefishbucket
EOF
  fi
  chown splunk:splunk "$INPUTS_FIXED" 2>/dev/null || true
  chmod 640 "$INPUTS_FIXED"
  echo "Wrote $INPUTS_FIXED:"
  cat "$INPUTS_FIXED"
fi

echo ""
echo "== Disabling receiving on HF (must NOT listen on 9997) =="
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) $SPLUNK disable listen 9997"
else
  "$SPLUNK" disable listen 9997 2>&1 || true
  echo "listen status:"
  "$SPLUNK" list listen 2>&1 | head -20 || true
  "$SPLUNK" btool inputs list --debug 2>&1 | grep -A2 "splunktcp" | head -20 || true
fi

echo ""
echo "== Scanning for stray indexAndForward=true in etc/apps (deployment server push) =="
FOUND=$(grep -RIn --include="*.conf" "indexAndForward.*true" "$SPLUNK_HOME/etc/apps" 2>/dev/null || true)
if [[ -n "$FOUND" ]]; then
  echo "WARNING: Found indexAndForward=true pushed by app:"
  echo "$FOUND"
else
  echo "OK: no indexAndForward=true in etc/apps"
fi

echo ""
echo "== Restarting HF to apply tcpout (forwarding must work BEFORE license switch) =="
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) $SPLUNK restart"
else
  "$SPLUNK" restart
  echo "Waiting 15s for splunkd..."
  sleep 15
fi

echo ""
echo "== Post-restart checks =="
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(dry-run) skipping post checks"
else
  echo "--- btool effective outputs.conf ---"
  "$SPLUNK" btool outputs list --debug 2>/dev/null | grep -E "defaultGroup|indexAndForward|server|disabled|forwardedindex" | head -20
  echo "--- forward-server (must show ACTIVE) ---"
  "$SPLUNK" list forward-server 2>&1 || true
  echo "--- listen (must NOT show 9997) ---"
  "$SPLUNK" list listen 2>&1 || true
  "$SPLUNK" btool inputs list --debug 2>&1 | grep -A2 "splunktcp" | head -20 || true
  echo "--- TCP reachability to indexer ---"
  if command -v nc >/dev/null 2>&1; then
    nc -vz -w 5 "$INDEXER_HOST" "$INDEXER_PORT" 2>&1
  else
    timeout 5 bash -c "cat < /dev/null > /dev/tcp/$INDEXER_HOST/$INDEXER_PORT" && echo "PORT OPEN" || echo "PORT BLOCKED"
  fi
fi

echo ""
echo "====================================================================="
echo "HF fix routine complete."
echo "====================================================================="
