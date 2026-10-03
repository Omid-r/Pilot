#!/usr/bin/env bash
# ==============================================================================
# install-offline-prereqs.sh
# Install ALL user-space prerequisites shipped with the offline RHEL bundle.
# No external repository, curl, npm, pip, or package mirror is used at runtime.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
PREREQ_ROOT="${APP_DIR}/offline-prereqs"
ARCH="$(uname -m)"

echo "======================================================================"
echo " [AIR-GAPPED] Installing bundled RHEL user-space prerequisites"
echo "======================================================================"

if [ "${EUID}" -ne 0 ]; then
  echo "[-] Run as root: sudo bash ${SCRIPT_DIR}/install-offline-prereqs.sh"
  exit 1
fi

if [ ! -f /etc/redhat-release ]; then
  echo "[-] Unsupported host: /etc/redhat-release was not found."
  echo "[!] This bundle targets RHEL-compatible systems with systemd."
  exit 1
fi

if ! command -v rpm >/dev/null 2>&1 || ! command -v dnf >/dev/null 2>&1; then
  echo "[-] The RHEL host must provide the native rpm + dnf package manager."
  echo "[!] These are OS-level bootstrap components and are not replaced by the application."
  exit 1
fi

MAJOR="$(rpm -E %{rhel} 2>/dev/null || true)"
if [ -z "${MAJOR}" ] || [ "${MAJOR}" = "0" ] || [ "${MAJOR}" = "%{rhel}" ]; then
  MAJOR="$(rpm -E %rhel 2>/dev/null || true)"
fi
case "${MAJOR}" in
  8|9) ;;
  *)
    echo "[-] Unsupported RHEL major version: ${MAJOR:-unknown}"
    echo "[!] Bundled prerequisites are provided for RHEL 8 and RHEL 9."
    exit 1
    ;;
esac

if [ "${ARCH}" != "x86_64" ]; then
  echo "[-] Unsupported CPU architecture for this release: ${ARCH}"
  echo "[!] This release embeds an x86_64 Node.js runtime and x86_64 offline toolchain."
  exit 1
fi

RPM_DIR="${PREREQ_ROOT}/rhel${MAJOR}/x86_64/rpms"
KUBECTL_BIN="${PREREQ_ROOT}/rhel${MAJOR}/x86_64/bin/kubectl"

if [ ! -d "${RPM_DIR}" ]; then
  echo "[-] Missing offline RPM directory: ${RPM_DIR}"
  echo "[!] The installation media is incomplete."
  exit 1
fi

RPM_COUNT=0
RPM_FILES=()
for rpm_file in "${RPM_DIR}"/*.rpm; do
  [ -f "${rpm_file}" ] || continue
  RPM_COUNT=$((RPM_COUNT + 1))
  pkg_name="$(rpm -qp --qf '%{NAME}' "${rpm_file}" 2>/dev/null || true)"
  [ -n "${pkg_name}" ] || continue

  # Never replace the native package-manager stack from application media.
  case "${pkg_name}" in
    dnf|dnf-data|dnf-plugins-core|python3-dnf*|yum|yum-utils|libdnf*)
      continue
      ;;
  esac

  # Do not try to reinstall/upgrade packages already present on the host.
  # This avoids cross-patching the OS base while still installing every
  # missing application prerequisite from the local bundle.
  if ! rpm -q "${pkg_name}" >/dev/null 2>&1; then
    RPM_FILES+=("${rpm_file}")
  fi
done
if [ "${RPM_COUNT}" -lt 1 ]; then
  echo "[-] No RPMs were found in ${RPM_DIR}"
  exit 1
fi

echo "[+] Bundled RPM files: ${RPM_COUNT}"
echo "[+] RPMs requiring installation: ${#RPM_FILES[@]}"

if [ "${#RPM_FILES[@]}" -gt 0 ]; then
  # Install only from the media. Network repositories are explicitly disabled.
  dnf \
    --disablerepo='*' \
    --setopt=install_weak_deps=False \
    --setopt=keepcache=True \
    -y install "${RPM_FILES[@]}"
else
  echo "[i] All bundled prerequisite package names are already present."
fi

echo "[+] RHEL major version: ${MAJOR}"
echo "[+] Architecture:      ${ARCH}"
echo "[+] Bundled RPM count: ${RPM_COUNT}"

# Install only from the media. Network repositories are explicitly disabled.
dnf \
  --disablerepo='*' \
  --setopt=install_weak_deps=False \
  --setopt=keepcache=True \
  -y install "${RPM_DIR}"/*.rpm

# Install the bundled Kubernetes client if it is not already present.
if [ -f "${KUBECTL_BIN}" ]; then
  install -d -m 0755 /usr/local/bin
  install -m 0755 "${KUBECTL_BIN}" /usr/local/bin/kubectl
fi

# Refresh SELinux labels when SELinux tooling is available.
if command -v restorecon >/dev/null 2>&1; then
  restorecon -v /usr/local/bin/kubectl 2>/dev/null || true
fi

echo "[+] Verifying required command-line tools..."

REQUIRED_CMDS=(
  bash sh tar gzip openssl curl ip ss ssh
  awk sed grep find df uname fuser
  hostname which nc ping lsof netstat conntrack chronyc ipmitool
  python3
  firewall-cmd iptables
  getenforce restorecon semanage
)

for cmd in "${REQUIRED_CMDS[@]}"; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "[-] Missing command after offline installation: ${cmd}"
    exit 1
  fi
done

# The application can use either container engine; this release installs Podman.
if ! command -v podman >/dev/null 2>&1; then
  echo "[-] Podman was not installed from the offline media."
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "[-] kubectl was not installed from the offline media."
  exit 1
fi

echo "[+] Node.js runtime bundled with the application:"
"${APP_DIR}/node-runtime/bin/node" --version

echo "[+] Podman:   $(podman --version)"
echo "[+] kubectl:  $(kubectl version --client --output=yaml 2>/dev/null | awk '/gitVersion:/{print $2; exit}' || kubectl version --client 2>/dev/null | head -n 1)"
echo "[+] Python:    $(python3 --version)"
echo "[+] OpenSSL:   $(openssl version)"
echo "[+] curl:      $(curl --version | head -n 1)"
echo "[+] iproute:   $(ip -V 2>&1 | head -n 1)"
echo "[+] firewalld: $(firewall-cmd --version 2>/dev/null || true)"
echo "[+] SELinux:   $(getenforce 2>/dev/null || true)"

# Firewalld is part of the supplied toolchain. Do not fail if the host policy
# intentionally keeps it disabled; the app can still use iptables directly.
if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files >/dev/null 2>&1; then
  if systemctl is-enabled firewalld >/dev/null 2>&1; then
    echo "[i] firewalld is already enabled."
  else
    echo "[i] firewalld package is installed; host policy may keep it disabled."
  fi
fi

echo "======================================================================"
echo " [SUCCESS] Offline user-space prerequisites installed and verified."
echo " No runtime package download was performed."
echo "======================================================================"
