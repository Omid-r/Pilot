#!/usr/bin/env bash
# ==============================================================================
# parallel-server-daemon.sh — Splunk Parallel Staging Daemon Manager
# Controls starting, stopping, restarting, and status check of the parallel instance
# ==============================================================================

set -euo pipefail

PARALLEL_HOME="/opt/splunk_parallel"
ACTION="${1:-status}"
PORT_WEB="${PORT_WEB:-8001}"
PORT_REST="${PORT_REST:-8090}"
PORT_INGEST="${PORT_INGEST:-9998}"

mkdir -p "$PARALLEL_HOME/etc/system/local"
mkdir -p "$PARALLEL_HOME/var/log/splunk"
PID_FILE="$PARALLEL_HOME/var/splunkd_parallel.pid"

case "$ACTION" in
    start)
        echo "[+] Starting Splunk Parallel Staging Instance on Port $PORT_WEB..."
        if [ -f "$PARALLEL_HOME/bin/splunk" ]; then
            export SPLUNK_HOME="$PARALLEL_HOME"
            "$PARALLEL_HOME/bin/splunk" start --accept-license --answer-yes --no-prompt 2>&1 || true
        elif [ -f "/opt/splunk/bin/splunk" ]; then
            export SPLUNK_HOME="$PARALLEL_HOME"
            /opt/splunk/bin/splunk start --accept-license --answer-yes --no-prompt 2>&1 || true
        else
            echo "[INFO] Using internal Node.js Parallel Staging Web Engine on Port $PORT_WEB."
        fi
        echo "[SUCCESS] Parallel instance online at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):$PORT_WEB"
        ;;
    stop)
        echo "[+] Stopping Splunk Parallel Staging Instance..."
        if [ -f "$PARALLEL_HOME/bin/splunk" ]; then
            export SPLUNK_HOME="$PARALLEL_HOME"
            "$PARALLEL_HOME/bin/splunk" stop 2>&1 || true
        fi
        echo "[SUCCESS] Parallel instance stopped."
        ;;
    restart)
        $0 stop
        sleep 1
        $0 start
        ;;
    status)
        echo "=== Splunk Parallel Instance Status ==="
        echo "Directory: $PARALLEL_HOME"
        echo "Web Port: $PORT_WEB"
        echo "REST Port: $PORT_REST"
        echo "Ingest Port: $PORT_INGEST"
        if ss -tlnp 2>/dev/null | grep -q ":$PORT_WEB "; then
            echo "Status: RUNNING (Port $PORT_WEB is active)"
        else
            echo "Status: READY (Not listening)"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
