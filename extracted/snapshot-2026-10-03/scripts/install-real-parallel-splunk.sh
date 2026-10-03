#!/usr/bin/env bash
set -euo pipefail

SOURCE_SPLUNK="${1:-/opt/splunk}"
TARGET_SPLUNK="${2:-/opt/splunk_parallel}"
WEB_PORT="${3:-8001}"
REST_PORT="${4:-8090}"
TCP_PORT="${5:-9998}"
KVSTORE_PORT="${6:-8193}"
ADMIN_PASSWORD="${7:-}"
PASS4SYMMKEY="${8:-}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ ${#ADMIN_PASSWORD} -ge 12 ]] || { echo "[ERROR] A real admin password (>=12 chars) is required."; exit 2; }
command -v tar >/dev/null 2>&1 || { echo "[ERROR] tar is required."; exit 3; }

if [[ -z "$PASS4SYMMKEY" ]]; then
  if command -v openssl >/dev/null 2>&1; then PASS4SYMMKEY="$(openssl rand -hex 32)";
  else PASS4SYMMKEY="$(od -An -N32 -tx1 /dev/urandom | tr -d " \n")"; fi
fi
[[ ${#PASS4SYMMKEY} -ge 32 ]] || { echo "[ERROR] pass4SymmKey generation failed."; exit 4; }

echo "[1/7] Verifying source Splunk installation or local archive..."
if [[ ! -x "$SOURCE_SPLUNK/bin/splunk" ]]; then
  FOUND_PKG=""
  shopt -s nullglob
  for f in /opt/splunk_packages/splunk-*.tgz /opt/splunk_packages/splunk-*.tar.gz /opt/splunk_packages/splunk-*.rpm; do FOUND_PKG="$f"; break; done
  [[ -n "$FOUND_PKG" ]] || { echo "[ERROR] No real Splunk binary or offline Splunk package found."; exit 5; }
  [[ "$FOUND_PKG" == *.rpm ]] && { echo "[ERROR] This parallel installer requires a TGZ/TAR.GZ payload or an existing /opt/splunk installation."; exit 6; }
  SOURCE_ARCHIVE="$FOUND_PKG"
else
  SOURCE_ARCHIVE=""
fi

echo "[2/7] Preparing target directory..."
if [[ -x "$TARGET_SPLUNK/bin/splunk" ]]; then "$TARGET_SPLUNK/bin/splunk" stop >/dev/null 2>&1 || true; fi
rm -rf "$TARGET_SPLUNK"
mkdir -p "$TARGET_SPLUNK"

if [[ -n "$SOURCE_ARCHIVE" ]]; then
  tar -xzf "$SOURCE_ARCHIVE" -C "$TARGET_SPLUNK" --strip-components=1
else
  cp -a "$SOURCE_SPLUNK/." "$TARGET_SPLUNK/"
fi

[[ -x "$TARGET_SPLUNK/bin/splunk" ]] || { echo "[ERROR] Target Splunk binary was not produced."; exit 7; }

echo "[3/7] Writing isolated Splunk configuration..."
mkdir -p "$TARGET_SPLUNK/etc/system/local" "$TARGET_SPLUNK/var/log/splunk" "$TARGET_SPLUNK/var/run/splunk" "$TARGET_SPLUNK/var/lock/splunk"
cat > "$TARGET_SPLUNK/etc/system/local/web.conf" <<EOF
[settings]
httpport = ${WEB_PORT}
server.socket_host = 0.0.0.0
startwebserver = 1
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF
cat > "$TARGET_SPLUNK/etc/system/local/server.conf" <<EOF
[general]
serverName = splunk-parallel-$(hostname -s)
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = ${PASS4SYMMKEY}

[kvstore]
port = ${KVSTORE_PORT}
EOF
cat > "$TARGET_SPLUNK/etc/system/local/inputs.conf" <<EOF
[default]
host = splunk-parallel-$(hostname -s)

[splunktcp://${TCP_PORT}]
disabled = 0
EOF
cat > "$TARGET_SPLUNK/etc/system/local/user-seed.conf" <<EOF
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF
cat > "$TARGET_SPLUNK/etc/splunk-launch.conf" <<EOF
SPLUNK_HOME=${TARGET_SPLUNK}
SPLUNK_DB=${TARGET_SPLUNK}/var/lib/splunk
EOF
chown -R root:root "$TARGET_SPLUNK/etc/system/local"
chmod 0600 "$TARGET_SPLUNK/etc/system/local/user-seed.conf"

echo "[4/7] Freeing only the selected ports..."
for p in "$WEB_PORT" "$REST_PORT" "$TCP_PORT" "$KVSTORE_PORT"; do fuser -k "${p}/tcp" >/dev/null 2>&1 || true; done

echo "[5/7] Starting real Splunk..."
SPLUNK_HOME="$TARGET_SPLUNK" SPLUNK_RUN_AS_ROOT=1 "$TARGET_SPLUNK/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root

echo "[6/7] Verifying daemon state and Web endpoint..."
for _ in {1..30}; do
  if SPLUNK_HOME="$TARGET_SPLUNK" "$TARGET_SPLUNK/bin/splunk" status >/tmp/splunk_parallel_status.$$ 2>&1; then
    if grep -qi "splunkd is running\|splunkweb is running" /tmp/splunk_parallel_status.$$; then break; fi
  fi
  sleep 2
done
STATUS_OUT="$(cat /tmp/splunk_parallel_status.$$ 2>/dev/null || true)"
rm -f /tmp/splunk_parallel_status.$$
echo "$STATUS_OUT"
grep -qi "splunkd is running\|splunkweb is running" <<<"$STATUS_OUT" || { echo "[ERROR] Splunk did not reach running state."; exit 8; }
HTTP_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://127.0.0.1:${WEB_PORT}/en-US/account/login" || true)"
[[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "303" ]] || { echo "[ERROR] Splunk Web verification failed: HTTP $HTTP_STATUS"; exit 9; }

echo "[7/7] Configuring firewall only when firewalld is active..."
if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --zone=public --add-port="${WEB_PORT}/tcp"
  firewall-cmd --permanent --zone=public --add-port="${REST_PORT}/tcp"
  firewall-cmd --permanent --zone=public --add-port="${TCP_PORT}/tcp"
  firewall-cmd --permanent --zone=public --add-port="${KVSTORE_PORT}/tcp"
  firewall-cmd --reload
fi

echo "[SUCCESS] Real parallel Splunk verified."
echo "Web: http://<SERVER-IP>:${WEB_PORT}/en-US/account/login"
echo "REST: ${REST_PORT}/tcp | S2S: ${TCP_PORT}/tcp | KVStore: ${KVSTORE_PORT}/tcp"
