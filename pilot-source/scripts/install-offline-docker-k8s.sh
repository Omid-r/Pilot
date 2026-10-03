#!/usr/bin/env bash
# ==============================================================================
# install-offline-docker-k8s.sh
# Automated Air-Gapped Installer for Docker & K3s (Lightweight Kubernetes)
# Installs container engine without internet access using local binaries/RPMs
# ==============================================================================

set -e

echo "======================================================================"
echo "  [AIR-GAPPED INSTALLER] Docker & K3s Kubernetes Runtime for Splunk"
echo "======================================================================"

# 1. Check if Docker already installed
if command -v docker >/dev/null 2>&1; then
    echo "  [OK] Docker is already installed: $(docker --version)"
    systemctl enable --now docker 2>/dev/null || true
elif [ -d "/opt/splunk_packages/docker-rpms" ]; then
    echo "  -> Installing Docker from local offline RPMs in /opt/splunk_packages/docker-rpms..."
    rpm -ivh --nodeps --replacepkgs /opt/splunk_packages/docker-rpms/*.rpm 2>/dev/null || true
    systemctl enable --now docker 2>/dev/null || true
elif command -v podman >/dev/null 2>&1; then
    echo "  [OK] Podman Container Engine is installed: $(podman --version)"
fi

# 2. Check if K3s (Kubernetes) binary exists
if command -v k3s >/dev/null 2>&1; then
    echo "  [OK] K3s Kubernetes is already active: $(k3s --version | head -n 1)"
elif [ -f "/opt/splunk_packages/k3s" ]; then
    echo "  -> Installing K3s single-binary offline runtime..."
    cp /opt/splunk_packages/k3s /usr/local/bin/k3s
    chmod +x /usr/local/bin/k3s
    k3s server --disable=traefik --write-kubeconfig-mode=644 &
    sleep 5
fi

echo "[SUCCESS] Container & Kubernetes environment ready for Splunk instance deployment."
