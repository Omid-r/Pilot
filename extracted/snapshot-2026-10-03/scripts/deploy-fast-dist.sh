#!/usr/bin/env bash
set -euo pipefail
ARCHIVE="${1:-}"; APP_ROOT="/opt/splunk-doctor"; SERVICE="splunk-doctor.service"
[[ -f "$ARCHIVE" && "$ARCHIVE" == *.tar.gz ]] || { echo "Usage: sudo bash $0 /tmp/splunk-doctor-dist-<sha>.tar.gz" >&2; exit 2; }
tmp="$(mktemp -d /tmp/pilot-fast-dist.XXXXXX)"; backup="$APP_ROOT/dist.backup-fast-$(date +%Y%m%d-%H%M%S)"; trap "rm -rf \"$tmp\"" EXIT
tar -xzf "$ARCHIVE" -C "$tmp"; test -s "$tmp/dist/index.html"; test -s "$tmp/dist/server.cjs"
node_bin="/usr/local/bin/splunk-doctor-node"; test -x "$node_bin"; "$node_bin" --check "$tmp/dist/server.cjs"
restart=0; if systemctl is-active --quiet "$SERVICE"; then systemctl stop "$SERVICE"; restart=1; fi
mv "$APP_ROOT/dist" "$backup"; mv "$tmp/dist" "$APP_ROOT/dist"
if [[ "$restart" == "1" ]]; then systemctl start "$SERVICE"; fi; sleep 1
curl -fsS http://127.0.0.1:3000/api/health; echo
echo "[PASS] Fast dist deployment completed. Backup: $backup"