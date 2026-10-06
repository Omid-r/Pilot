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

# Install the bundled RHEL user-space prerequisites before configuring the application tools.
if [ -x "${SCRIPTS_DIR}/install-offline-prereqs.sh" ]; then
    echo "[0/6] Installing bundled offline RHEL prerequisites (no external repositories)..."
    bash "${SCRIPTS_DIR}/install-offline-prereqs.sh"
else
    echo "[-] install-offline-prereqs.sh is missing from the offline bundle."
    exit 1
fi

echo "[1/6] Applying and restoring executable permissions..."
find "${INSTALL_DIR}" -type d -exec chmod 755 {} +
find "${INSTALL_DIR}" -type f -exec chmod 644 {} +
find "${INSTALL_DIR}" -type f \( \
  -name '*.sh' -o -name '*.bash' -o -name '*.py' -o -name '*.pl' -o -name '*.rb' \
\) -exec chmod 755 {} +
for executable in "${INSTALL_DIR}/node-runtime/bin/node" "${INSTALL_DIR}/kubectl" "${INSTALL_DIR}/k3s"; do
    [ -f "${executable}" ] && chmod 755 "${executable}" 2>/dev/null || true
done
chmod +x "${INSTALL_DIR}"/*.sh 2>/dev/null || true
if [ -d "${SCRIPTS_DIR}" ]; then
    chmod +x "${SCRIPTS_DIR}"/*.sh "${SCRIPTS_DIR}"/*.py 2>/dev/null || true
fi
find "${INSTALL_DIR}" -type d -exec chmod 755 {} +
find "${INSTALL_DIR}" -type f -exec chmod 644 {} +
if [ -d "${SCRIPTS_DIR}" ]; then chmod +x "${SCRIPTS_DIR}"/*.sh "${SCRIPTS_DIR}"/*.py 2>/dev/null || true; fi
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

# Load container images shipped in the application offline-cache.
# Supported archives: .tar, .tar.gz, .tgz. The operation is skipped when no
# container engine or no image archive is present.
OFFLINE_CACHE_DIR="${INSTALL_DIR}/offline-cache"
IMAGE_LOADED=0
# If no container engine exists, install a real one from the bundled RHEL media before loading images.
if ! command -v docker >/dev/null 2>&1 && ! command -v podman >/dev/null 2>&1; then
    ENGINE_INSTALLER="${SCRIPTS_DIR}/install-container-engine-offline.sh"
    if [ -x "${ENGINE_INSTALLER}" ] && { find "${OFFLINE_CACHE_DIR}/rocky" "${OFFLINE_CACHE_DIR}/splunk" -maxdepth 1 -type f \( -name "*.tar" -o -name "*.tar.gz" -o -name "*.tgz" \) -print -quit 2>/dev/null | grep -q .; }; then
        echo "  [+] No container engine detected; installing from bundled offline media..."
        bash "${ENGINE_INSTALLER}"
    fi
fi

if { command -v docker >/dev/null 2>&1 || command -v podman >/dev/null 2>&1; } && [ -d "${OFFLINE_CACHE_DIR}" ]; then
    CONTAINER_LOAD_CMD="docker"
    command -v docker >/dev/null 2>&1 || CONTAINER_LOAD_CMD="podman"
    for image_dir in "${OFFLINE_CACHE_DIR}/rocky" "${OFFLINE_CACHE_DIR}/splunk"; do
        [ -d "${image_dir}" ] || continue
        while IFS= read -r -d "" image_archive; do
            echo "  [+] Loading local container image: ${image_archive}"
            if "${CONTAINER_LOAD_CMD}" load -i "${image_archive}"; then
                IMAGE_LOADED=$((IMAGE_LOADED + 1))
            else
                echo "[-] Failed to load local container image: ${image_archive}"
                exit 1
            fi
        done < <(find "${image_dir}" -maxdepth 1 -type f \( -name "*.tar" -o -name "*.tar.gz" -o -name "*.tgz" \) -print0)
    done
    echo "  [+] Local container image archives loaded: ${IMAGE_LOADED}"
fi
if [ -d "/opt/splunk/bin" ]; then
    echo "  [✓] Local Splunk Enterprise detected in /opt/splunk."
    if [ ! -f "${PARALLEL_DIR}/bin/splunk" ]; then
        echo "  [+] Pre-linking binaries for parallel staging..."
        mkdir -p "${PARALLEL_DIR}"
        cp -rn /opt/splunk/bin /opt/splunk/lib /opt/splunk/share /opt/splunk/openssl /opt/splunk/etc/auth "${PARALLEL_DIR}/" 2>/dev/null || true
        chmod -R +x "${PARALLEL_DIR}/bin" 2>/dev/null || true
    fi
else
    echo "  [!] Main Splunk not installed in /opt/splunk. No Splunk engine has been created."
fi

if command -v docker >/dev/null 2>&1; then
    echo "  [✓] Docker Engine is installed: $(docker --version)"
elif command -v podman >/dev/null 2>&1; then
    echo "  [✓] Podman Container Engine is installed: $(podman --version)"
else
    echo "  [!] Container engine not installed. Real container deployment will remain unavailable until an offline runtime is staged."
fi

echo "[6/6] Configuring OS Firewall & Port Access Rules..."
if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
    firewall-cmd --permanent --zone=public --add-port=3000/tcp
    firewall-cmd --permanent --zone=public --add-port=8001/tcp
    firewall-cmd --permanent --zone=public --add-port=8090/tcp
    firewall-cmd --permanent --zone=public --add-port=9998/tcp
    firewall-cmd --reload
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
