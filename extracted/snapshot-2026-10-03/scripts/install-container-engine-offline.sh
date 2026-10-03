#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="/opt/splunk_packages"
BIN_DIR="/usr/local/bin"

[[ $EUID -eq 0 ]] || { echo "Run as root."; exit 1; }
echo "[AIR-GAP] Installing real container/Kubernetes runtimes from local artifacts only."
mkdir -p "$PKG_DIR" "$PKG_DIR/docker-k8s" "$BIN_DIR"

install_local_rpms(){
  local dir="$1"
  shopt -s nullglob
  local rpms=("$dir"/*.rpm)
  ((${#rpms[@]})) || return 1
  dnf --disablerepo="*" -y install "${rpms[@]}"
}

if command -v podman >/dev/null 2>&1; then
  echo "[OK] Podman: $(podman --version)"
elif command -v docker >/dev/null 2>&1; then
  echo "[OK] Docker: $(docker --version)"
elif [[ -d "$PKG_DIR/docker-rpms" ]] && install_local_rpms "$PKG_DIR/docker-rpms"; then
  systemctl enable --now docker
  command -v docker >/dev/null 2>&1 || { echo "Docker RPMs installed but docker command is missing."; exit 21; }
else
  echo "[ERROR] No real Podman/Docker installation or offline RPM bundle was found."
  exit 20
fi

if command -v kubectl >/dev/null 2>&1; then
  echo "[OK] kubectl: $(kubectl version --client=true --output=json 2>/dev/null | head -n 1 || true)"
elif [[ -f "$PKG_DIR/kubectl" ]]; then
  install -m 0755 "$PKG_DIR/kubectl" "$BIN_DIR/kubectl"
  "$BIN_DIR/kubectl" version --client=true --output=json >/dev/null
elif [[ -f "$PKG_DIR/k3s" ]]; then
  install -m 0755 "$PKG_DIR/k3s" "$BIN_DIR/k3s"
  ln -sf "$BIN_DIR/k3s" "$BIN_DIR/kubectl"
  # Install and start a real single-node K3s service only when requested by the host.
  "$BIN_DIR/k3s" --version >/dev/null
else
  echo "[ERROR] No real kubectl/K3s binary or offline artifact was found."
  exit 22
fi

if command -v kubectl >/dev/null 2>&1; then
  KCTL="$(command -v kubectl)"
else
  KCTL="$BIN_DIR/kubectl"
fi
if [[ "$KCTL" != */* ]]; then KCTL="$(command -v "$KCTL")"; fi

echo "[VERIFY] container runtime and Kubernetes client are present."
if command -v docker >/dev/null 2>&1; then docker --version; fi
if command -v podman >/dev/null 2>&1; then podman --version; fi
"$KCTL" version --client=true >/dev/null 2>&1 || { echo "[ERROR] Kubernetes client verification failed."; exit 23; }
echo "[SUCCESS] Real offline runtime installation completed."
