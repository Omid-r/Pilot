#!/usr/bin/env bash
set -Eeuo pipefail

BIN_DIR="/usr/local/bin"
PKG_DIR="/opt/splunk_packages"
RUNTIME_DIR="${PKG_DIR}/docker-k8s"
mkdir -p "${BIN_DIR}" "${RUNTIME_DIR}"

log(){ echo "[offline-runtime] $*"; }
die(){ echo "[ERROR] $*" >&2; exit 1; }
trap 'die "Container runtime installation failed at line $LINENO."' ERR

[[ $EUID -eq 0 ]] || die "Run as root."

# Docker: use an existing real daemon, or install from staged RPM/static artifacts.
if command -v docker >/dev/null 2>&1; then
  log "Docker CLI found: $(docker --version)"
  if systemctl list-unit-files docker.service >/dev/null 2>&1; then
    systemctl enable --now docker
  fi
  docker info >/dev/null 2>&1 || die "Docker CLI exists but Docker daemon is unavailable."
elif command -v podman >/dev/null 2>&1; then
  log "Podman found: $(podman --version)"
  podman info >/dev/null 2>&1 || die "Podman is installed but unavailable."
elif [[ -d "${PKG_DIR}/docker-rpms" ]] && compgen -G "${PKG_DIR}/docker-rpms/*.rpm" >/dev/null; then
  log "Installing Docker from local RPM repository."
  dnf --disablerepo='*' -y install "${PKG_DIR}"/docker-rpms/*.rpm
  systemctl enable --now docker
  docker info >/dev/null 2>&1 || die "Docker daemon failed after offline RPM installation."
elif [[ -f "${PKG_DIR}/docker-static.tgz" ]]; then
  log "Installing Docker static binaries."
  tar -xzf "${PKG_DIR}/docker-static.tgz" -C "${BIN_DIR}" --strip-components=1
  chmod 755 "${BIN_DIR}"/docker* "${BIN_DIR}"/containerd* "${BIN_DIR}"/runc
  command -v docker >/dev/null 2>&1 || die "Docker binary not found after static installation."
  die "Static Docker binaries are present but no daemon/unit was supplied. Stage a supported dockerd/systemd package."
else
  die "No real Docker/Podman runtime or offline installation artifact was supplied. Refusing to create a fake compatibility wrapper."
fi

# Kubernetes: prefer an existing kubeconfig-connected kubectl, otherwise install real K3s or kubectl from staged binaries.
if command -v kubectl >/dev/null 2>&1; then
  kubectl version --client >/dev/null 2>&1 || die "kubectl is present but client execution failed."
  if kubectl get nodes >/dev/null 2>&1; then
    log "Kubernetes cluster reachable."
  else
    log "kubectl client installed; no cluster is reachable yet."
  fi
elif [[ -f "${PKG_DIR}/k3s" ]]; then
  install -m 0755 "${PKG_DIR}/k3s" "${BIN_DIR}/k3s"
  cat > /etc/systemd/system/k3s.service <<'EOF'
[Unit]
Description=K3s Kubernetes Server (offline)
After=network-online.target
Wants=network-online.target
[Service]
Type=exec
ExecStart=/usr/local/bin/k3s server --disable=traefik --write-kubeconfig-mode=600
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now k3s
  [[ -x "${BIN_DIR}/k3s" ]]
  ln -sf "${BIN_DIR}/k3s" "${BIN_DIR}/kubectl"
  KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get nodes >/dev/null 2>&1 || die "K3s started but Kubernetes API is not ready."
elif [[ -f "${PKG_DIR}/kubectl" ]]; then
  install -m 0755 "${PKG_DIR}/kubectl" "${BIN_DIR}/kubectl"
  kubectl version --client >/dev/null 2>&1 || die "Offline kubectl binary failed to execute."
  log "Installed real kubectl client; no fake responses are generated."
else
  log "No Kubernetes runtime artifact supplied."
fi

log "Real runtime checks complete."
if command -v docker >/dev/null 2>&1; then
  docker --version
elif command -v podman >/dev/null 2>&1; then
  podman --version
fi
command -v kubectl >/dev/null 2>&1 && kubectl version --client --output=yaml 2>/dev/null | head -20 || true
