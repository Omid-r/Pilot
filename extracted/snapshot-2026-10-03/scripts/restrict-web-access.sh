#!/usr/bin/env bash
# Restrict Splunk Doctor web/API access to one IPv4 client or CIDR.
# Usage: sudo bash restrict-web-access.sh 192.168.232.50
#        sudo bash restrict-web-access.sh 192.168.232.0/24

set -euo pipefail

CLIENT_SOURCE="\${1:-}"
PORT="\${SPLUNK_DOCTOR_PORT:-3000}"

if [[ -z "\${CLIENT_SOURCE}" ]]; then
  echo "Usage: sudo bash \${0} <CLIENT_IP_OR_CIDR>"
  exit 2
fi

echo "======================================================================"
echo " [SECURE TEST ACCESS] Splunk Doctor TCP/\${PORT} whitelist"
echo "======================================================================"
echo "Allowed source: \${CLIENT_SOURCE}"
echo

if systemctl is-active --quiet firewalld 2>/dev/null && command -v firewall-cmd >/dev/null 2>&1; then
  echo "[1/2] Tightening firewalld rules..."

  for zone in public trusted; do
    firewall-cmd --permanent --zone="\${zone}" --remove-port="\${PORT}/tcp" >/dev/null 2>&1 || true
  done

  # Do not expose parallel/auxiliary service ports through the OS firewall.
  for p in 8001 8090 9998 8193; do
    firewall-cmd --permanent --zone=public --remove-port="\${p}/tcp" >/dev/null 2>&1 || true
  done

  RULE="rule family=\"ipv4\" source address=\"\${CLIENT_SOURCE}\" port port=\"\${PORT}\" protocol=\"tcp\" accept"
  firewall-cmd --permanent --zone=public --remove-rich-rule="\${RULE}" >/dev/null 2>&1 || true
  firewall-cmd --permanent --zone=public --add-rich-rule="\${RULE}" >/dev/null
  firewall-cmd --reload >/dev/null

  echo "[+] firewalld whitelist installed."
  echo
  echo "Verification:"
  firewall-cmd --zone=public --list-all
else
  if ! command -v iptables >/dev/null 2>&1; then
    echo "[-] Neither active firewalld nor iptables is available."
    exit 1
  fi

  echo "[1/2] Tightening iptables rules..."

  # Remove simple broad ACCEPT rules for this application's web port.
  while iptables -D INPUT -p tcp --dport "\${PORT}" -j ACCEPT 2>/dev/null; do :; done || true

  # Remove simple broad ACCEPT rules for auxiliary ports created by older bundles.
  for p in 8001 8090 9998 8193; do
    while iptables -D INPUT -p tcp --dport "\${p}" -j ACCEPT 2>/dev/null; do :; done || true
  done

  # Insert the whitelist first, then reject all other IPv4 clients on TCP/\${PORT}.
  iptables -I INPUT 1 -p tcp -s "\${CLIENT_SOURCE}" --dport "\${PORT}" -j ACCEPT
  iptables -I INPUT 2 -p tcp --dport "\${PORT}" -j REJECT

  echo "[+] iptables whitelist installed."
  echo
  echo "Verification:"
  iptables -S INPUT
fi

echo
echo "[2/2] Local health check (must work even when remote access is restricted)..."
HTTP_CODE="\$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:\${PORT}/api/health" 2>/dev/null || true)"
echo "Local /api/health HTTP status: \${HTTP_CODE}"
if [[ "\${HTTP_CODE}" != "200" ]]; then
  echo "[!] The firewall is configured, but the application local health check did not return 200."
  exit 1
fi

echo
echo "[PASS] Remote web access is restricted to \${CLIENT_SOURCE}; local health is OK."
