#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd)"
PACKAGES_DIR="/opt/splunk_packages"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }

echo "======================================================================"
echo "  OFFLINE MASTER INSTALLER — Splunk Cluster Doctor"
echo "======================================================================"

# Install the controller itself first. setup.sh performs service and SELinux checks.
bash "$ROOT_DIR/setup.sh"

# Stage only real offline packages; never fabricate command shims.
if [[ -d "$PACKAGES_DIR/docker-rpms" || -f "$PACKAGES_DIR/k3s" || -f "$PACKAGES_DIR/kubectl" || -f "$PACKAGES_DIR/docker-static.tgz" ]]; then
  bash "$SCRIPT_DIR/install-container-engine-offline.sh"
else
  echo "[INFO] No container/Kubernetes runtime artifacts were staged. Nothing fabricated."
fi

echo
echo "[INFO] Offline artifact inventory:"
find "$PACKAGES_DIR" -maxdepth 3 -type f -printf '%p (%s bytes)\n' 2>/dev/null | sort || true

echo "======================================================================"
echo "  Controller installation completed."
echo "  Service: systemctl status splunk-doctor --no-pager"
echo "  Logs:    journalctl -u splunk-doctor -f"
echo "======================================================================"
