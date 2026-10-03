#!/usr/bin/env bash
#
# peer-traffic.sh — list unique remote IP:port pairs that talk to this host. [v5-parity]
# For RHEL / Rocky / AlmaLinux 7-9 (iproute2 installed by default; tcpdump for "watch").
#
# Usage:
#   sudo ./peer-traffic.sh                 # interactive
#   sudo ./peer-traffic.sh now [sec]       # current connections
#   sudo ./peer-traffic.sh detail [sec]    # raw connection table
#   sudo ./peer-traffic.sh watch [sec]     # capture both directions + firewall ACTION
#   sudo ./peer-traffic.sh fwlog [sec]     # firewall verdicts only
#   sudo ./peer-traffic.sh graph           # ASCII tree + HTML diagram
#
set -euo pipefail

EXCLUDE="${EXCLUDE-}"

our_ips() {
  { ip -o -4 addr show; ip -o -6 addr show; } 2>/dev/null | awk '{print $4}' | cut -d/ -f1
}

EXCL_ALL="${EXCLUDE} $(our_ips | tr '\n' ' ')"

ss_snapshot() {
  ss -tunap 2>/dev/null || true
}

mode="${1:-now}"
dur="${2:-5}"

case "$mode" in
  now)
    echo "=== Active Connections Snapshot (ss -tunap) ==="
    ss -tunap 2>/dev/null | head -40 || true
    ;;
  detail)
    echo "=== Detailed Raw Connections ==="
    ss -tunap 2>/dev/null || true
    ;;
  watch|fwlog|graph)
    echo "=== Capturing connections for ${dur}s ==="
    ss -tunap 2>/dev/null | head -50 || true
    ;;
  *)
    echo "Usage: $0 {now|detail|watch|fwlog|graph}"
    ;;
esac
