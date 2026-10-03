#!/usr/bin/env bash
# ==============================================================================
# uninstall.sh — Clean Uninstaller for Splunk Cluster Doctor
# ==============================================================================
set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root: sudo bash uninstall.sh"
  exit 1
fi

echo "=========================================================="
echo "  Uninstalling Splunk Cluster Doctor..."
echo "=========================================================="

if systemctl is-active --quiet splunk-doctor 2>/dev/null; then
  systemctl stop splunk-doctor 2>/dev/null || true
fi

if systemctl is-enabled --quiet splunk-doctor 2>/dev/null; then
  systemctl disable splunk-doctor 2>/dev/null || true
fi

rm -f /etc/systemd/system/splunk-doctor.service
systemctl daemon-reload 2>/dev/null || true

rm -rf /opt/splunk-doctor

echo "[✓] Splunk Cluster Doctor has been completely uninstalled."
echo "=========================================================="
