#!/usr/bin/env bash
set -Eeuo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TARGET_BIN="/usr/local/bin"
SCRIPTS_DIR="/opt/splunk-doctor/scripts"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }

mkdir -p "$SCRIPTS_DIR" "$TARGET_BIN"

for name in traffic-tools.py peer-traffic.sh fix.sh indexer-fix.sh; do
  [[ -f "$DIR/$name" ]] || { echo "[ERROR] Missing offline tool: $DIR/$name"; exit 1; }
  install -m 0755 "$DIR/$name" "$SCRIPTS_DIR/$name"
done

ln -sfn "$SCRIPTS_DIR/traffic-tools.py" "$TARGET_BIN/splunk-doctor-diag"
ln -sfn "$SCRIPTS_DIR/peer-traffic.sh" "$TARGET_BIN/peer-traffic"
ln -sfn "$SCRIPTS_DIR/fix.sh" "$TARGET_BIN/splunk-fix-forwarder"
ln -sfn "$SCRIPTS_DIR/indexer-fix.sh" "$TARGET_BIN/splunk-fix-indexer"

if command -v python3 >/dev/null 2>&1; then
  python3 "$SCRIPTS_DIR/traffic-tools.py" role >/dev/null
else
  echo "[WARN] python3 not available; CLI diagnostic validation skipped."
fi

echo "[SUCCESS] Offline diagnostics installed. No firewall ports were opened by this script."
