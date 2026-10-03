#!/usr/bin/env bash
set -Eeuo pipefail

WEB_PORT="${1:-8001}"
REST_PORT="${2:-8090}"
TCP_PORT="${3:-9998}"
ADMIN_PASSWORD="${SPLUNK_ADMIN_PASSWORD:-}"
PASS4_SYMM_KEY="${SPLUNK_PASS4SYMMKEY:-}"
IMAGE_REF="${SPLUNK_IMAGE_REF:-}"
IMAGE_ARCHIVE="${SPLUNK_IMAGE_ARCHIVE:-}"
MODE="${DEPLOY_MODE:-auto}"
NAMESPACE="${SPLUNK_K8S_NAMESPACE:-splunk-managed}"
CONTAINER_NAME="${SPLUNK_CONTAINER_NAME:-splunk-managed}"

die(){ echo "[ERROR] $*" >&2; exit 1; }
log(){ echo "[offline-deploy] $*"; }
trap 'die "deployment failed at line $LINENO"' ERR

[[ $EUID -eq 0 ]] || die "Run as root."
[[ ${#ADMIN_PASSWORD} -ge 12 ]] || die "SPLUNK_ADMIN_PASSWORD must be set and be at least 12 characters."
[[ -n "$IMAGE_REF" ]] || die "SPLUNK_IMAGE_REF must be set to an explicit tag or digest; no :latest default is used."

case "$MODE" in auto|kubernetes|podman|docker) ;; *) die "Invalid DEPLOY_MODE: $MODE";; esac

if [[ -n "$IMAGE_ARCHIVE" ]]; then
  [[ -f "$IMAGE_ARCHIVE" ]] || die "Image archive not found: $IMAGE_ARCHIVE"
fi

have_kubectl() { command -v kubectl >/dev/null 2>&1; }
have_k3s() { command -v k3s >/dev/null 2>&1; }
have_podman() { command -v podman >/dev/null 2>&1; }
have_docker() { command -v docker >/dev/null 2>&1; }

if [[ "$MODE" == "auto" ]]; then
  if have_kubectl && kubectl get nodes >/dev/null 2>&1; then
    MODE="kubernetes"
  elif have_k3s && KUBECONFIG=/etc/rancher/k3s/k3s.yaml k3s kubectl get nodes >/dev/null 2>&1; then
    MODE="kubernetes"
  elif have_podman; then
    MODE="podman"
  elif have_docker; then
    MODE="docker"
  else
    die "No real Kubernetes or Docker/Podman runtime is available."
  fi
fi

load_image() {
  local archive="$1"
  [[ -n "$archive" ]] || return 0
  if have_podman; then
    podman load -i "$archive"
  elif have_docker; then
    docker load -i "$archive"
  elif have_k3s; then
    k3s ctr images import "$archive"
  else
    die "An image archive was supplied but no supported image loader exists."
  fi
}

verify_local_image() {
  case "$MODE" in
    podman) podman image exists "$IMAGE_REF" || die "Local Podman image not found: $IMAGE_REF" ;;
    docker) docker image inspect "$IMAGE_REF" >/dev/null 2>&1 || die "Local Docker image not found: $IMAGE_REF" ;;
    kubernetes)
      if have_k3s; then
        KUBECONFIG=/etc/rancher/k3s/k3s.yaml k3s ctr images list | awk '{print $1}' | grep -Fx "$IMAGE_REF" >/dev/null 2>&1 ||           log "K3s image inventory did not exactly match $IMAGE_REF; rollout will prove whether the node can pull it."
      fi
      ;;
  esac
}

if [[ -n "$IMAGE_ARCHIVE" ]]; then
  log "Loading offline image archive."
  load_image "$IMAGE_ARCHIVE"
fi

verify_local_image

case "$MODE" in
  podman|docker)
    RUNTIME="$MODE"
    if [[ "$RUNTIME" == "podman" ]]; then
      podman image exists "$IMAGE_REF" || die "Image is not loaded locally: $IMAGE_REF"
      podman rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
      podman run -d --name "$CONTAINER_NAME" --restart=unless-stopped         -p "$WEB_PORT:8000" -p "$REST_PORT:8089" -p "$TCP_PORT:9997"         -e SPLUNK_START_ARGS="--accept-license --answer-yes --no-prompt"         -e SPLUNK_PASSWORD="$ADMIN_PASSWORD"         -e SPLUNK_RUN_AS_ROOT=1         "$IMAGE_REF"
      running=false
      for _ in {1..60}; do
        if podman inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -q true; then running=true; break; fi
        sleep 2
      done
      [[ "$running" == true ]] || { podman logs "$CONTAINER_NAME" 2>&1 | tail -100 || true; die "Podman container did not become running."; }
    else
      docker image inspect "$IMAGE_REF" >/dev/null 2>&1 || die "Image is not loaded locally: $IMAGE_REF"
      docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
      docker run -d --name "$CONTAINER_NAME" --restart=unless-stopped         -p "$WEB_PORT:8000" -p "$REST_PORT:8089" -p "$TCP_PORT:9997"         -e SPLUNK_START_ARGS="--accept-license --answer-yes --no-prompt"         -e SPLUNK_PASSWORD="$ADMIN_PASSWORD"         -e SPLUNK_RUN_AS_ROOT=1         "$IMAGE_REF"
      running=false
      for _ in {1..60}; do
        if docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -q true; then running=true; break; fi
        sleep 2
      done
      [[ "$running" == true ]] || { docker logs "$CONTAINER_NAME" 2>&1 | tail -100 || true; die "Docker container did not become running."; }
    fi

    HTTP_CODE="$(curl -sS -k -o /dev/null -w '%{http_code}' --connect-timeout 5 "https://127.0.0.1:$WEB_PORT/en-US/account/login" 2>/dev/null || true)"
    if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "302" && "$HTTP_CODE" != "303" ]]; then
      HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 "http://127.0.0.1:$WEB_PORT/en-US/account/login" 2>/dev/null || true)"
    fi
    [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "302" || "$HTTP_CODE" == "303" ]] || die "Splunk Web verification failed: HTTP $HTTP_CODE"
    ;;

  kubernetes)
    if have_kubectl && kubectl get nodes >/dev/null 2>&1; then
      KUBECTL=(kubectl)
    elif have_k3s && KUBECONFIG=/etc/rancher/k3s/k3s.yaml k3s kubectl get nodes >/dev/null 2>&1; then
      KUBECTL=(k3s kubectl)
      export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    else
      die "Kubernetes API is not reachable."
    fi

    "${KUBECTL[@]}" create namespace "$NAMESPACE" --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f - >/dev/null

    cat > /tmp/splunk-managed-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: splunk-admin
  namespace: $NAMESPACE
type: Opaque
stringData:
  password: $ADMIN_PASSWORD
EOF
    chmod 600 /tmp/splunk-managed-secret.yaml

    cat > /tmp/splunk-managed.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: splunk
  namespace: $NAMESPACE
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
        image: $IMAGE_REF
        imagePullPolicy: IfNotPresent
        env:
        - name: SPLUNK_START_ARGS
          value: "--accept-license --answer-yes --no-prompt"
        - name: SPLUNK_PASSWORD
          valueFrom:
            secretKeyRef:
              name: splunk-admin
              key: password
        - name: SPLUNK_RUN_AS_ROOT
          value: "1"
        ports:
        - containerPort: 8000
        - containerPort: 8089
        - containerPort: 9997
        readinessProbe:
          tcpSocket:
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          tcpSocket:
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: splunk-web
  namespace: $NAMESPACE
spec:
  type: NodePort
  selector:
    app: splunk
  ports:
  - name: web
    port: 8000
    targetPort: 8000
    nodePort: $WEB_PORT
  - name: mgmt
    port: 8089
    targetPort: 8089
    nodePort: $REST_PORT
  - name: s2s
    port: 9997
    targetPort: 9997
    nodePort: $TCP_PORT
EOF
    chmod 600 /tmp/splunk-managed.yaml

    "${KUBECTL[@]}" apply -f /tmp/splunk-managed-secret.yaml
    "${KUBECTL[@]}" apply -f /tmp/splunk-managed.yaml
    "${KUBECTL[@]}" -n "$NAMESPACE" rollout status deployment/splunk --timeout=300s

    READY="$("${KUBECTL[@]}" -n "$NAMESPACE" get pods -l app=splunk -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null || true)"
    [[ "$READY" == "true" ]] || die "Splunk pod rollout completed without Ready=true."
    ;;

esac

rm -f /tmp/splunk-managed-secret.yaml /tmp/splunk-managed.yaml
echo "[SUCCESS] Real offline Splunk deployment verified."
