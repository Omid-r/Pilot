#!/usr/bin/env bash
set -Eeuo pipefail

PARALLEL_HOME="/opt/splunk_parallel"
ACTION="${1:-status}"
PORT_WEB="${PORT_WEB:-8001}"

die(){ echo "[ERROR] $*" >&2; exit 1; }
SPLUNK="${PARALLEL_HOME}/bin/splunk"
[[ -f "$SPLUNK" ]] || {
  if [[ -f /opt/splunk/bin/splunk ]]; then SPLUNK=/opt/splunk/bin/splunk; else SPLUNK=""; fi
}

case "$ACTION" in
  start)
    [[ -n "$SPLUNK" ]] || die "Real Splunk binary not found. Stage an offline Splunk package first."
    export SPLUNK_HOME="$PARALLEL_HOME"
    "$SPLUNK" start --accept-license --answer-yes --no-prompt --run-as-root
    status="$("$SPLUNK" status 2>&1 || true)"
    echo "$status"
    echo "$status" | grep -Eqi 'splunkd is running|splunkweb is running' || die "Splunk start completed without a running status."
    ;;
  stop)
    [[ -n "$SPLUNK" ]] || die "Real Splunk binary not found."
    export SPLUNK_HOME="$PARALLEL_HOME"
    "$SPLUNK" stop --run-as-root
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  status)
    echo "Directory: $PARALLEL_HOME"
    echo "Web Port: $PORT_WEB"
    if [[ -n "$SPLUNK" ]]; then
      export SPLUNK_HOME="$PARALLEL_HOME"
      "$SPLUNK" status || true
    else
      echo "Status: NOT_INSTALLED"
    fi
    ;;
  *) echo "Usage: $0 {start|stop|restart|status}"; exit 2 ;;
esac
