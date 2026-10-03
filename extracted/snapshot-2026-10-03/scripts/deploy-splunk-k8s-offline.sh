#!/usr/bin/env bash
set -euo pipefail

WEB_PORT="${1:-8001}"
REST_PORT="${2:-8090}"
TCP_PORT="${3:-9998}"
ADMIN_PASSWORD="${4:-}"
IMAGE_REF="${5:-${SPLUNK_IMAGE_REF:-}}"
NAMESPACE="${6:-splunk-parallel}"
IMAGE_ARCHIVE="${7:-${SPLUNK_IMAGE_ARCHIVE:-}}"

[[ $EUID -eq 0 ]] || { echo "[ERROR] Run as root."; exit 1; }
[[ ${#ADMIN_PASSWORD} -ge 12 ]] || { echo "[ERROR] A real Splunk admin password (>=12 chars) is required."; exit 2; }
[[ -n "$IMAGE_REF" ]] || { echo "[ERROR] SPLUNK_IMAGE_REF/IMAGE_REF is required; no registry lookup is performed."; exit 3; }

RUNTIME=""
if command -v podman >/dev/null 2>&1; then RUNTIME="podman"; elif command -v docker >/dev/null 2>&1; then RUNTIME="docker"; fi
KCTL=""
if command -v kubectl >/dev/null 2>&1; then KCTL="$(command -v kubectl)"; elif command -v k3s >/dev/null 2>&1; then KCTL="k3s kubectl"; fi

load_image(){
  [[ -n "$IMAGE_ARCHIVE" ]] || return 0
  [[ -f "$IMAGE_ARCHIVE" ]] || { echo "[ERROR] Image archive not found: $IMAGE_ARCHIVE"; return 10; }
  if [[ -n "$RUNTIME" ]]; then
    echo "[IMAGE] Loading local archive with $RUNTIME: $IMAGE_ARCHIVE"
    "$RUNTIME" load -i "$IMAGE_ARCHIVE"
  elif command -v k3s >/dev/null 2>&1; then
    echo "[IMAGE] Loading local archive into K3s containerd: $IMAGE_ARCHIVE"
    k3s ctr images import "$IMAGE_ARCHIVE"
  else
    echo "[ERROR] No container runtime/K3s found for image import."
    return 11
  fi
}

verify_runtime(){
  if [[ -n "$RUNTIME" ]]; then
    "$RUNTIME" image inspect "$IMAGE_REF" >/dev/null 2>&1 || { echo "[ERROR] Image not present locally: $IMAGE_REF"; return 12; }
  elif command -v k3s >/dev/null 2>&1; then
    k3s ctr images ls | awk "{print \$1}" | grep -Fx "$IMAGE_REF" >/dev/null 2>&1 || { echo "[ERROR] Image not loaded into K3s containerd: $IMAGE_REF"; return 13; }
  fi
}

load_image
verify_runtime

mkdir -p /opt/splunk_container_runtime
WORKDIR="/opt/splunk_container_runtime"
MANIFEST="$WORKDIR/splunk-k8s-standalone.yaml"

if [[ -z "$KCTL" ]]; then
  if [[ -n "$RUNTIME" ]]; then
    echo "[DEPLOY] Deploying a real Podman/Docker Splunk container."
    "$RUNTIME" rm -f splunk_k8s_parallel >/dev/null 2>&1 || true
    CID="$("$RUNTIME" run -d --name splunk_k8s_parallel --restart=unless-stopped -p "${WEB_PORT}:8000" -p "${REST_PORT}:8089" -p "${TCP_PORT}:9997" -e SPLUNK_START_ARGS="--accept-license --answer-yes --no-prompt" -e SPLUNK_PASSWORD="$ADMIN_PASSWORD" -e SPLUNK_ENABLE_LISTEN=9997 "$IMAGE_REF")"
    [[ -n "$CID" ]] || { echo "[ERROR] Container runtime returned no container ID."; exit 14; }
    sleep 5
    "$RUNTIME" inspect -f "{{.State.Running}}" splunk_k8s_parallel | grep -q true || { "$RUNTIME" logs --tail 120 splunk_k8s_parallel || true; echo "[ERROR] Splunk container is not running."; exit 15; }
    HTTP_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://127.0.0.1:${WEB_PORT}/en-US/account/login" || true)"
    [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "303" ]] || { "$RUNTIME" logs --tail 120 splunk_k8s_parallel || true; echo "[ERROR] Splunk Web verification failed: HTTP $HTTP_STATUS"; exit 16; }
    echo "[SUCCESS] Real Splunk container is running: $CID"
    echo "WEB=http://<SERVER-IP>:${WEB_PORT}/en-US/account/login"
    exit 0
  fi
  echo "[ERROR] Neither Kubernetes nor a real container runtime is available."; exit 17
fi

cat > "$MANIFEST" <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
---
apiVersion: v1
kind: Secret
metadata:
  name: splunk-admin
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  password: "${ADMIN_PASSWORD}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: splunk
  namespace: ${NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: splunk
  template:
    metadata:
      labels:
        app: splunk
    spec:
      containers:
      - name: splunk
        image: ${IMAGE_REF}
        imagePullPolicy: IfNotPresent
        env:
        - name: SPLUNK_START_ARGS
          value: "--accept-license --answer-yes --no-prompt"
        - name: SPLUNK_PASSWORD
          valueFrom:
            secretKeyRef:
              name: splunk-admin
              key: password
        ports:
        - containerPort: 8000
        - containerPort: 8089
        - containerPort: 9997
        - containerPort: 8088
        readinessProbe:
          httpGet:
            scheme: HTTP
            path: /en-US/account/login
            port: 8000
          initialDelaySeconds: 20
          periodSeconds: 10
          failureThreshold: 18
---
apiVersion: v1
kind: Service
metadata:
  name: splunk-web
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: splunk
  ports:
  - name: web
    port: 8000
    targetPort: 8000
    nodePort: 30080
  - name: mgmt
    port: 8089
    targetPort: 8089
    nodePort: 30089
EOF
chmod 0600 "$MANIFEST"

echo "[K8S] Applying real Kubernetes manifest with local image only..."
eval "$KCTL apply -f \"$MANIFEST\""
eval "$KCTL -n \"$NAMESPACE\" rollout status deployment/splunk --timeout=240s"
eval "$KCTL -n \"$NAMESPACE\" get pods -l app=splunk -o wide"

echo "[SUCCESS] Kubernetes rollout completed and pod reported Ready."
echo "WEB=http://<SERVER-IP>:30080/en-US/account/login"
