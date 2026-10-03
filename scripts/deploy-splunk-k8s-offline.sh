#!/usr/bin/env bash
set -euo pipefail

WEB_PORT="${1:-30080}"
REST_PORT="${2:-30089}"
TCP_PORT="${3:-30997}"
ADMIN_PASSWORD="${4:-}"
IMAGE_REF="${5:-}"
NAMESPACE="${6:-splunk-managed}"

[[ "$(id -u)" -eq 0 ]] || { echo "ERROR: run as root"; exit 1; }
[[ "${#ADMIN_PASSWORD}" -ge 12 ]] || { echo "ERROR: admin password required"; exit 1; }
[[ -n "${IMAGE_REF}" ]] || { echo "ERROR: image reference is required; offline deployment never pulls from a registry"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "ERROR: kubectl is not installed"; exit 1; }
kubectl image inspect "${IMAGE_REF}" >/dev/null 2>&1 2>/dev/null || true
if ! kubectl get nodes >/dev/null 2>&1; then
  echo "ERROR: Kubernetes control plane is not reachable"
  exit 1
fi
[[ "${WEB_PORT}" -ge 30000 && "${WEB_PORT}" -le 32767 ]] || { echo "ERROR: WEB_PORT must be a valid NodePort (30000-32767)"; exit 1; }
[[ "${REST_PORT}" -ge 30000 && "${REST_PORT}" -le 32767 ]] || { echo "ERROR: REST_PORT must be a valid NodePort"; exit 1; }
[[ "${TCP_PORT}" -ge 30000 && "${TCP_PORT}" -le 32767 ]] || { echo "ERROR: TCP_PORT must be a valid NodePort"; exit 1; }

WORKDIR="/var/lib/splunk-doctor/k8s"
mkdir -p "${WORKDIR}"
SECRET_B64="$(printf %s "${ADMIN_PASSWORD}" | base64 -w0)"
cat > "${WORKDIR}/splunk-managed.yaml" <<EOF
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
data:
  password: ${SECRET_B64}
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
        - { name: web, containerPort: 8000 }
        - { name: mgmt, containerPort: 8089 }
        - { name: s2s, containerPort: 9997 }
        - { name: hec, containerPort: 8088 }
---
apiVersion: v1
kind: Service
metadata:
  name: splunk
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: splunk
  ports:
  - { name: web, port: 8000, targetPort: 8000, nodePort: ${WEB_PORT} }
  - { name: mgmt, port: 8089, targetPort: 8089, nodePort: ${REST_PORT} }
  - { name: s2s, port: 9997, targetPort: 9997, nodePort: ${TCP_PORT} }
EOF

kubectl apply -f "${WORKDIR}/splunk-managed.yaml"
kubectl -n "${NAMESPACE}" rollout status deployment/splunk --timeout=300s
kubectl -n "${NAMESPACE}" get pods -o wide
rm -f "${WORKDIR}/splunk-managed.yaml"

echo "SUCCESS: Kubernetes deployment rollout verified."
echo "Web NodePort: ${WEB_PORT}"
echo "REST NodePort: ${REST_PORT}"
echo "S2S NodePort: ${TCP_PORT}"
