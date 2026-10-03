#!/usr/bin/env bash
#
# install-traffic-tools.sh — Installs traffic tools and fixer scripts on RHEL
#
set -euo pipefail

DIR=/opt/traffic-tools
mkdir -p "$DIR"
chmod 755 "$DIR"

cp -a "$(dirname "$0")"/*.sh "$DIR/" 2>/dev/null || true
cp -a "$(dirname "$0")"/*.py "$DIR/" 2>/dev/null || true
chmod +x "$DIR"/*.sh 2>/dev/null || true

echo "=========================================================="
echo "  Traffic Tools & Splunk Fixers Installed to $DIR"
echo "=========================================================="
echo "  1) fix.sh            - Fix HF indexAndForward & forwarding"
echo "  2) indexer-fix.sh    - Fix Indexer 9997 listening & firewall"
echo "  3) peer-traffic.sh   - Peer traffic & port inspection"
echo "  4) traffic-tools.py  - Unified network & role diagnostic engine"
echo "=========================================================="
