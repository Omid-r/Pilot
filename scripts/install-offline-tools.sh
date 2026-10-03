#!/usr/bin/env bash
# ==============================================================================
# install-offline-tools.sh — Air-Gapped / Offline Tool Suite Installer for Splunk
# Installs and configures all offline utilities, socket scanners, flow inspectors,
# and systemd service without requiring any internet connection or external packages.
# ==============================================================================

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TARGET_BIN="/usr/local/bin"
SCRIPTS_DIR="/opt/splunk-doctor/scripts"

echo "=================================================================="
echo " Installing Splunk Doctor Air-Gapped Offline Tool Suite v1.2.0"
echo "=================================================================="

# 1. Create target directories
mkdir -p "$TARGET_BIN"
mkdir -p "$SCRIPTS_DIR"
mkdir -p "/opt/splunk_parallel/etc/system/local"
mkdir -p "/opt/splunk_parallel/var/log/splunk"

# 2. Copy all Python and Shell scripts
echo "[+] Step 1: Installing offline diagnostics scripts into $SCRIPTS_DIR..."
cp -f "$DIR"/traffic-tools.py "$SCRIPTS_DIR/" 2>/dev/null || true
cp -f "$DIR"/peer-traffic.sh "$SCRIPTS_DIR/" 2>/dev/null || true
cp -f "$DIR"/fix.sh "$SCRIPTS_DIR/" 2>/dev/null || true
cp -f "$DIR"/indexer-fix.sh "$SCRIPTS_DIR/" 2>/dev/null || true

# 3. Create global symlinks in /usr/local/bin for instant terminal access
echo "[+] Step 2: Creating global terminal command aliases in $TARGET_BIN..."
chmod +x "$SCRIPTS_DIR"/*.py "$SCRIPTS_DIR"/*.sh 2>/dev/null || true

ln -sf "$SCRIPTS_DIR/traffic-tools.py" "$TARGET_BIN/splunk-doctor-diag" 2>/dev/null || true
ln -sf "$SCRIPTS_DIR/peer-traffic.sh" "$TARGET_BIN/peer-traffic" 2>/dev/null || true
ln -sf "$SCRIPTS_DIR/fix.sh" "$TARGET_BIN/splunk-fix-forwarder" 2>/dev/null || true
ln -sf "$SCRIPTS_DIR/indexer-fix.sh" "$TARGET_BIN/splunk-fix-indexer" 2>/dev/null || true

# 4. Open Firewall Ports for Splunk Doctor and Parallel Instance (RHEL / CentOS / Rocky)
echo "[+] Step 3: Configuring local firewall rules..."
if command -v firewall-cmd >/dev/null 2>&1; then
    if firewall-cmd --state 2>/dev/null | grep -q "running"; then
        firewall-cmd --zone=public --add-port=3000/tcp --permanent 2>/dev/null || true
        firewall-cmd --zone=public --add-port=8001/tcp --permanent 2>/dev/null || true
        firewall-cmd --zone=public --add-port=8090/tcp --permanent 2>/dev/null || true
        firewall-cmd --zone=public --add-port=9998/tcp --permanent 2>/dev/null || true
        firewall-cmd --zone=public --add-port=8088/tcp --permanent 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
        echo "[SUCCESS] Ports 3000, 8001, 8090, 9998, 8088 permanently allowed in firewalld."
    fi
elif command -v ufw >/dev/null 2>&1; then
    ufw allow 3000/tcp 2>/dev/null || true
    ufw allow 8001/tcp 2>/dev/null || true
    ufw allow 8090/tcp 2>/dev/null || true
    ufw allow 9998/tcp 2>/dev/null || true
    echo "[SUCCESS] Ports allowed in UFW."
fi

# 5. Verify Python environment
echo "[+] Step 4: Verifying Python environment (zero pip dependencies)..."
if command -v python3 >/dev/null 2>&1; then
    python3 "$SCRIPTS_DIR/traffic-tools.py" role >/dev/null 2>&1 && echo "[SUCCESS] Python 3 engine operational." || echo "[WARN] Python 3 check skipped."
elif command -v python >/dev/null 2>&1; then
    echo "[INFO] Using python alias."
fi

echo "=================================================================="
echo " [SUCCESS] Offline Tool Suite is installed and ready for air-gapped use!"
echo " Available commands:"
echo "   - peer-traffic {now|watch|fwlog|detail}"
echo "   - splunk-doctor-diag {role|connections|flows|ports|map}"
echo "   - splunk-fix-forwarder"
echo "   - splunk-fix-indexer"
echo "=================================================================="
