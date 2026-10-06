#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="/opt/splunk_packages"
BIN_DIR="/usr/local/bin"

echo "======================================================================"
echo "  [AIR-GAPPED INSTALLER] Real Container Engine & Kubernetes"
echo "======================================================================"

mkdir -p "$PKG_DIR/docker-k8s" "$BIN_DIR" /etc/docker /etc/rancher/k3s

# Container runtime: use an existing real Docker/Podman runtime or install
# from local RPM/static artifacts. Never synthesize a CLI wrapper.
if command -v docker >/dev/null 2>&1; then
  echo "  [✓] Docker: $(docker --version)"
  if command -v systemctl >/dev/null 2>&1 && systemctl cat docker >/dev/null 2>&1; then
    systemctl enable --now docker
  fi
elif command -v podman >/dev/null 2>&1; then
  echo "  [✓] Podman: $(podman --version)"
else
  if ls "$PKG_DIR"/docker-rpms/*.rpm >/dev/null 2>&1; then
    echo "  -> Installing Docker from local RPMs..."
    dnf --disablerepo='*' -y install "$PKG_DIR"/docker-rpms/*.rpm
    systemctl enable --now docker
    docker --version >/dev/null
  elif [ -f "$PKG_DIR/docker-static.tgz" ]; then
    echo "  -> Installing Docker static binaries from local archive..."
    tar -xzf "$PKG_DIR/docker-static.tgz" -C "$BIN_DIR"
    chmod 0755 "$BIN_DIR"/docker "$BIN_DIR"/dockerd "$BIN_DIR"/containerd "$BIN_DIR"/containerd-shim-runc-v2 "$BIN_DIR"/ctr "$BIN_DIR"/runc 2>/dev/null || true
    "$BIN_DIR/docker" --version >/dev/null
    echo "  [✓] Docker static client installed. A real dockerd service must be configured separately for daemon use."
  elif ls "$PKG_DIR"/podman-rpms/*.rpm >/dev/null 2>&1; then
    echo "  -> Installing Podman from local RPMs..."
    dnf --disablerepo='*' -y install "$PKG_DIR"/podman-rpms/*.rpm
    podman --version >/dev/null
  else
    # Fall back to the bundled RHEL RPM repository shipped with this release.
    RHEL_MAJOR="$(rpm -E %{rhel} 2>/dev/null || true)"
    if [[ -z "$RHEL_MAJOR" || "$RHEL_MAJOR" == "%{rhel}" ]]; then
      RHEL_MAJOR="$(rpm -E %rhel 2>/dev/null || true)"
    fi
    if [[ "$RHEL_MAJOR" == "8" || "$RHEL_MAJOR" == "9" ]]; then
      RPM_DIR="/opt/splunk-doctor/offline-prereqs/rhel${RHEL_MAJOR}/x86_64/rpms"
      if [ -f "$RPM_DIR/repodata/repomd.xml" ]; then
        echo "  -> Installing Podman from the bundled offline RHEL repository..."
        dnf --disablerepo='*' --repofrompath="splunk-doctor-offline,file://${RPM_DIR}" --enablerepo="splunk-doctor-offline" -y install podman
        podman --version >/dev/null
      else
    echo "[-] No real Docker/Podman offline artifact was found."
    echo "[!] Expected: Docker RPMs/static bundle or Podman RPMs under $PKG_DIR."
    exit 1
  fi
fi

# Kubernetes client/control plane: use existing kubectl/k3s or local artifact.
if command -v kubectl >/dev/null 2>&1; then
  echo "  [✓] kubectl: $(kubectl version --client 2>/dev/null | head -n 1)"
elif [ -x "$PKG_DIR/k3s" ]; then
  install -m 0755 "$PKG_DIR/k3s" "$BIN_DIR/k3s"
  ln -sfn "$BIN_DIR/k3s" "$BIN_DIR/kubectl"
  "$BIN_DIR/k3s" --version
elif [ -x "$PKG_DIR/kubectl" ]; then
  install -m 0755 "$PKG_DIR/kubectl" "$BIN_DIR/kubectl"
  "$BIN_DIR/kubectl" version --client
else
  echo "[-] No real offline kubectl/k3s artifact was found."
  echo "[!] Expected /opt/splunk_packages/k3s or /opt/splunk_packages/kubectl."
  exit 1
fi

echo "======================================================================"
echo "  [SUCCESS] Real container/Kubernetes tooling is installed and verified."
echo "======================================================================"
