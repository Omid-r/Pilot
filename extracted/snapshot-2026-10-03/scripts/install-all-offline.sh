#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$INSTALL_DIR/scripts"
PACKAGES_DIR="/opt/splunk_packages"
RUNTIME_DIR="/opt/splunk_container_runtime"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
install -d -m 0755 "$PACKAGES_DIR" "$RUNTIME_DIR" /var/log/splunk /var/lib/splunk-doctor

echo "[1/5] Installing real offline diagnostic tools..."
if [[ -f "$SCRIPTS_DIR/traffic-tools.py" ]]; then
  install -m 0755 "$SCRIPTS_DIR/traffic-tools.py" /usr/local/bin/traffic-tools
  ln -sf /usr/local/bin/traffic-tools /usr/local/bin/splunk-doctor-diag
fi

echo "[2/5] Publishing operational scripts..."
for f in deploy-splunk-k8s-offline.sh fix-parallel-web.sh install-offline-docker-k8s.sh install-container-engine-offline.sh install-real-parallel-splunk.sh reset-splunk-password.sh; do
  if [[ -f "$SCRIPTS_DIR/$f" ]]; then install -m 0755 "$SCRIPTS_DIR/$f" "$RUNTIME_DIR/$f"; fi
done

echo "[3/5] Checking real host runtimes..."
if command -v podman >/dev/null 2>&1; then echo "[OK] $(podman --version)";
elif command -v docker >/dev/null 2>&1; then echo "[OK] $(docker --version)";
else echo "[INFO] No container runtime installed; deployment will require local runtime RPMs."; fi
if command -v kubectl >/dev/null 2>&1; then echo "[OK] kubectl available";
elif command -v k3s >/dev/null 2>&1; then echo "[OK] k3s available";
else echo "[INFO] No Kubernetes client/control-plane installed."; fi

echo "[4/5] Checking Splunk artifacts..."
COUNT="$(find "$PACKAGES_DIR" -maxdepth 2 -type f \( -name "splunk-*.rpm" -o -name "splunk-*.tgz" -o -name "splunk-*.tar.gz" -o -name "splunk-*.tar" -o -name "*.oci" \) -print 2>/dev/null | wc -l)"
echo "[INFO] Offline Splunk/package/image artifacts found: $COUNT"

echo "[5/5] Verifying installed diagnostic commands..."
command -v ss >/dev/null 2>&1 || { echo "[ERROR] ss command is required."; exit 20; }
command -v ip >/dev/null 2>&1 || { echo "[ERROR] ip command is required."; exit 21; }
if command -v curl >/dev/null 2>&1; then curl --version | head -n 1; fi
echo "[SUCCESS] Offline tooling setup completed without synthetic runtimes."
