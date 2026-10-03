#!/usr/bin/env bash
# ==============================================================================
# install-all-offline.sh — Master Air-Gapped / Offline Installer
# Scans, configures permissions, extracts local packages, and sets up all tools
# ==============================================================================

set -e

echo "======================================================================"
echo " [AIR-GAPPED MASTER INSTALLER] Splunk Cluster Doctor & Studio Tools"
echo "======================================================================"

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
SCRIPTS_DIR="${INSTALL_DIR}/scripts"
PACKAGES_DIR="/opt/splunk_packages"
RUNTIME_DIR="/opt/splunk_container_runtime"
PARALLEL_DIR="/opt/splunk_parallel"

echo "[1/6] Granting executable permissions to all offline scripts and tools..."
chmod -R 755 "${INSTALL_DIR}" 2>/dev/null || true
if [ -d "${SCRIPTS_DIR}" ]; then
    chmod +x "${SCRIPTS_DIR}"/*.sh "${SCRIPTS_DIR}"/*.py 2>/dev/null || true
fi
chmod +x "${INSTALL_DIR}"/*.sh 2>/dev/null || true

echo "[2/6] Preparing air-gapped workspace directories..."
mkdir -p "${PACKAGES_DIR}" "${RUNTIME_DIR}" "${PARALLEL_DIR}" /var/log/splunk /tmp/splunk_doctor_logs

echo "[3/6] Deploying container & Kubernetes runtime scripts to ${RUNTIME_DIR}..."
if [ -d "${SCRIPTS_DIR}" ]; then
    for script in deploy-splunk-k8s-offline.sh fix-parallel-web.sh install-offline-docker-k8s.sh install-offline-tools.sh install-real-parallel-splunk.sh parallel-server-daemon.sh reset-splunk-password.sh setup.sh traffic-tools.py; do
        if [ -f "${SCRIPTS_DIR}/${script}" ]; then
            cp -f "${SCRIPTS_DIR}/${script}" "${RUNTIME_DIR}/${script}"
            chmod +x "${RUNTIME_DIR}/${script}" 2>/dev/null || true
        fi
    done
fi

echo "[4/6] Installing Python network diagnostic tools and CLI symlinks..."
if [ -f "${SCRIPTS_DIR}/traffic-tools.py" ]; then
    chmod +x "${SCRIPTS_DIR}/traffic-tools.py"
    if [ -d "/usr/local/bin" ]; then
        ln -sf "${SCRIPTS_DIR}/traffic-tools.py" /usr/local/bin/splunk-doctor-diag 2>/dev/null || true
        ln -sf "${SCRIPTS_DIR}/traffic-tools.py" /usr/local/bin/traffic-tools 2>/dev/null || true
    fi
fi

echo "[5/6] Verifying offline Splunk binaries & container engine..."
if [ -d "/opt/splunk/bin" ]; then
    echo "  [✓] Local Splunk Enterprise detected in /opt/splunk."
    if [ ! -f "${PARALLEL_DIR}/bin/splunk" ]; then
        echo "  [+] Pre-linking binaries for parallel staging..."
        mkdir -p "${PARALLEL_DIR}"
        cp -rn /opt/splunk/bin /opt/splunk/lib /opt/splunk/share /opt/splunk/openssl /opt/splunk/etc/auth "${PARALLEL_DIR}/" 2>/dev/null || true
        chmod -R +x "${PARALLEL_DIR}/bin" 2>/dev/null || true
    fi
else
    echo "  [!] Notice: Main Splunk not in /opt/splunk. Standalone embedded engine ready."
fi

if command -v docker >/dev/null 2>&1; then
    echo "  [✓] Docker Engine is installed: $(docker --version)"
elif command -v podman >/dev/null 2>&1; then
    echo "  [✓] Podman Container Engine is installed: $(podman --version)"
else
    echo "  [!] Notice: Container engine not installed. Running in Standalone Native mode."
fi

echo "[6/6] Configuring OS Firewall & Port Access Rules..."
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --zone=public --add-port=3000/tcp --add-port=8001/tcp --add-port=8090/tcp --add-port=9998/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 8001 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 8090 -j ACCEPT 2>/dev/null || true
fi

echo "======================================================================"
echo " [SUCCESS] Air-Gapped Setup Completed!"
echo " All scripts permissions granted, diagnostic tools linked, and workspace ready."
echo " To start the application server:"
echo "   bash ${INSTALL_DIR}/start.sh"
echo "======================================================================"
