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
for rpm_file in "${RPM_DIR}"/*.rpm; do
  [ -f "${rpm_file}" ] || continue
  RPM_COUNT=$((RPM_COUNT + 1))
done
if [ "${RPM_COUNT}" -lt 1 ]; then
  echo "[-] No RPMs were found in ${RPM_DIR}"
  exit 1
fi

echo "[+] Bundled RPM files: ${RPM_COUNT}"

# The bundle ships DNF repository metadata so the native package manager can
# resolve the complete dependency graph from the local media instead of
# treating hundreds of RPM files as unrelated command-line packages.
OFFLINE_REPO_ID="splunk-doctor-offline"
OFFLINE_REPO_FILE="/etc/yum.repos.d/${OFFLINE_REPO_ID}.repo"
if [ ! -f "${RPM_DIR}/repodata/repomd.xml" ] && [ -f "${RPM_DIR}/.repodata/repomd.xml" ]; then
  mv "${RPM_DIR}/.repodata" "${RPM_DIR}/repodata"
fi

if [ ! -f "${RPM_DIR}/repodata/repomd.xml" ]; then
  echo "[-] Missing offline DNF repository metadata: ${RPM_DIR}/repodata/repomd.xml"
  exit 1
fi

cat > "${OFFLINE_REPO_FILE}" <<EOF
[${OFFLINE_REPO_ID}]
name=Splunk Doctor Offline Media
baseurl=file://${RPM_DIR}
enabled=1
gpgcheck=0
repo_gpgcheck=0
metadata_expire=-1
EOF
trap 'rm -f "${OFFLINE_REPO_FILE}"' EXIT

declare -A COMMAND_TO_PACKAGE=(
  [bash]=bash [sh]=bash [tar]=tar [gzip]=gzip [curl]=curl
  [ip]=iproute [ss]=iproute [ssh]=openssh-clients [awk]=gawk [sed]=sed [grep]=grep
  [find]=findutils [fuser]=psmisc [hostname]=hostname [nc]=nmap-ncat
  [ping]=iputils [lsof]=lsof [netstat]=net-tools
)

# Only these packages are required for the Pilot controller/installer itself.
# They are intentionally kept small so installation never upgrades the host
# package-manager/SELinux/container stack merely to start the application.
CORE_CMDS=(
  bash sh tar gzip curl ip ss ssh awk sed grep find fuser hostname nc ping lsof netstat
)

OPTIONAL_CMDS=(
  openssl chronyc ipmitool python3 firewall-cmd iptables getenforce restorecon semanage podman kubectl
)

MISSING_PACKAGES=()
declare -A PACKAGE_SEEN=()
for cmd in "${CORE_CMDS[@]}"; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    pkg="${COMMAND_TO_PACKAGE[${cmd}]:-}"
    if [ -z "${pkg}" ]; then
      echo "[-] No offline package mapping exists for missing core command: ${cmd}"
      exit 1
    fi
    if [ -z "${PACKAGE_SEEN[${pkg}]:-}" ]; then
      MISSING_PACKAGES+=("${pkg}")
      PACKAGE_SEEN[${pkg}]=1
    fi
  fi
done

echo "[+] Core commands missing before install: ${#MISSING_PACKAGES[@]}"
if [ "${#MISSING_PACKAGES[@]}" -gt 0 ]; then
  printf '    - %s\n' "${MISSING_PACKAGES[@]}"
  dnf \
    --disablerepo='*' \
    --enablerepo="${OFFLINE_REPO_ID}" \
    --setopt=install_weak_deps=False \
    --setopt=keepcache=True \
    -y install "${MISSING_PACKAGES[@]}"
else
  echo "[i] All core controller commands are already present; no OS upgrade is attempted."
fi

echo "[+] Optional capability status:"
for cmd in "${OPTIONAL_CMDS[@]}"; do
  if command -v "${cmd}" >/dev/null 2>&1; then
    echo "    [present] ${cmd}"
  else
    echo "    [optional/missing] ${cmd}"
  fi
done

echo "[+] Node.js runtime bundled with the application:"
"${APP_DIR}/node-runtime/bin/node" --version

if command -v podman >/dev/null 2>&1; then
  echo "[+] Podman:   $(podman --version)"
else
  echo "[i] Podman:   not installed (optional container capability)"
fi
if command -v kubectl >/dev/null 2>&1; then
  echo "[+] kubectl:  $(kubectl version --client --output=yaml 2>/dev/null | awk '/gitVersion:/{print $2; exit}' || kubectl version --client 2>/dev/null | head -n 1)"
else
  echo "[i] kubectl:  not available"
fi
if command -v python3 >/dev/null 2>&1; then echo "[+] Python:    $(python3 --version)"; else echo "[i] Python:    not installed (optional diagnostic capability)"; fi
if command -v openssl >/dev/null 2>&1; then echo "[+] OpenSSL:   $(openssl version)"; else echo "[i] OpenSSL:   not installed (optional diagnostic capability)"; fi
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
