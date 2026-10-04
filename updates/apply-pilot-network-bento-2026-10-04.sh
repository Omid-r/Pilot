#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/splunk-doctor}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PATCH_FILE="${PATCH_FILE:-${SCRIPT_DIR}/pilot-network-bento-2026-10-04.patch}"
SERVICE_NAME="${SERVICE_NAME:-splunk-doctor.service}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/var/backups/splunk-doctor/update-${STAMP}"

die() { echo "[ERROR] $*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"; }

[ "$(id -u)" -eq 0 ] || die "Run as root (sudo)."
[ -d "${APP_ROOT}" ] || die "Application root not found: ${APP_ROOT}"
[ -f "${PATCH_FILE}" ] || die "Patch file not found: ${PATCH_FILE}"

for c in patch tar curl; do need_cmd "${c}"; done
[ -f "${APP_ROOT}/server.ts" ] || die "server.ts not found under ${APP_ROOT}"
[ -f "${APP_ROOT}/package.json" ] || die "package.json not found under ${APP_ROOT}"
[ -d "${APP_ROOT}/node_modules" ] || die "node_modules not found; this patch is intended for the bundled/offline installation."

NODE_BIN="/usr/local/bin/splunk-doctor-node"
if [ ! -x "${NODE_BIN}" ]; then
  if [ -f "${APP_ROOT}/node-runtime/bin/node" ]; then
    install -D -m 0755 "${APP_ROOT}/node-runtime/bin/node" "${NODE_BIN}"
  fi
fi
[ -x "${NODE_BIN}" ] || die "Bundled/staged Node runtime not found."

mkdir -p "${BACKUP_DIR}"
tar -czf "${BACKUP_DIR}/source-and-dist.tgz" -C "${APP_ROOT}" \
  server.ts src/components/BentoGridConsole.tsx src/components/NetworkToolbox.tsx src/types.ts dist 2>/dev/null || \
  tar -czf "${BACKUP_DIR}/source.tgz" -C "${APP_ROOT}" server.ts src/components/BentoGridConsole.tsx src/components/NetworkToolbox.tsx src/types.ts

echo "[1/6] Checking patch applicability..."
patch --dry-run -p1 -d "${APP_ROOT}" < "${PATCH_FILE}"

echo "[2/6] Applying real patch..."
patch -p1 -d "${APP_ROOT}" < "${PATCH_FILE}"

echo "[3/6] Building frontend and server bundle offline..."
cd "${APP_ROOT}"
"${NODE_BIN}" node_modules/vite/bin/vite.js build
"${NODE_BIN}" node_modules/esbuild/bin/esbuild server.ts --bundle --platform=node --format=cjs --external:vite --sourcemap --outfile=dist/server.cjs

echo "[4/6] Restarting service..."
systemctl restart "${SERVICE_NAME}"
systemctl is-active --quiet "${SERVICE_NAME}" || {
  echo "[ERROR] Service failed to become active; restoring previous files."
  tar -xzf "${BACKUP_DIR}/source-and-dist.tgz" -C "${APP_ROOT}" 2>/dev/null || true
  systemctl restart "${SERVICE_NAME}" 2>/dev/null || true
  exit 1
}

echo "[5/6] Verifying live controller..."
HEALTH="$(curl -fsS --max-time 8 http://127.0.0.1:3000/api/health)"
echo "${HEALTH}" | grep -q '"success":true' || {
  echo "[ERROR] Health endpoint failed after update; restoring previous files."
  tar -xzf "${BACKUP_DIR}/source-and-dist.tgz" -C "${APP_ROOT}" 2>/dev/null || true
  systemctl restart "${SERVICE_NAME}" 2>/dev/null || true
  exit 1
}

echo "[6/6] Update completed."
echo "Backup: ${BACKUP_DIR}"
echo "Health: ${HEALTH}"
