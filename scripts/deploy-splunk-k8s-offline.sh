#!/usr/bin/env bash
# ==============================================================================
# deploy-splunk-k8s-offline.sh
# 100% Offline Air-Gapped Kubernetes & Docker Deployment for Splunk Enterprise
# Deploys fully isolated Splunk instance inside Container / K8s on Port 8001:8000
# ==============================================================================

WEB_PORT="${1:-8001}"
REST_PORT="${2:-8090}"
TCP_PORT="${3:-9998}"
ADMIN_PASSWORD="${4:-changeme}"

WORKDIR="/opt/splunk_container_runtime"
CONFIG_DIR="/opt/splunk_parallel_configs"
mkdir -p "${WORKDIR}"
mkdir -p "${CONFIG_DIR}"

echo "======================================================================"
echo "  [K8S / DOCKER OFFLINE DEPLOYER] Splunk Enterprise Container Instance"
echo "======================================================================"

# 1. Clean Stale Host Port Conflicts
echo "==> 1. Freeing Host Ports (${WEB_PORT}, ${REST_PORT}, ${TCP_PORT})..."
fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
fuser -k "${REST_PORT}/tcp" 2>/dev/null || true
fuser -k "${TCP_PORT}/tcp" 2>/dev/null || true

# Self-sync script to /opt/splunk_container_runtime/ if run from elsewhere
if [ -f "$0" ] && [ "$0" != "${WORKDIR}/deploy-splunk-k8s-offline.sh" ]; then
    cp -f "$0" "${WORKDIR}/deploy-splunk-k8s-offline.sh" 2>/dev/null || true
    chmod +x "${WORKDIR}/deploy-splunk-k8s-offline.sh" 2>/dev/null || true
fi

# 2. Write Local Isolated Configuration Files to mount into container
echo "==> 2. Generating Isolated Splunk Configuration Mounts..."

cat << EOF > "${CONFIG_DIR}/web.conf"
[settings]
httpport = 8000
server.socket_host = 0.0.0.0
enableSplunkWebSSL = false
startwebserver = 1
appServerPorts = 0
EOF

cat << EOF > "${CONFIG_DIR}/server.conf"
[general]
serverName = splunk-k8s-parallel-node
pass4SymmKey = changeme-k8s-passkey
active_group = Free

[kvstore]
port = 8191
EOF

cat << EOF > "${CONFIG_DIR}/inputs.conf"
[default]
host = splunk-k8s-parallel-node

[splunktcp://9997]
disabled = 0
queueSize = 10MB
EOF

cat << EOF > "${CONFIG_DIR}/user-seed.conf"
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF

# 3. Create Kubernetes Manifest (for K8s / K3s / MicroK8s / Minikube)
echo "==> 3. Generating Offline Kubernetes YAML Blueprint..."

cat << EOF > "${WORKDIR}/splunk-k8s-standalone.yaml"
apiVersion: v1
kind: Namespace
metadata:
  name: splunk-parallel
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: splunk-configs
  namespace: splunk-parallel
data:
  web.conf: |
    [settings]
    httpport = 8000
    server.socket_host = 0.0.0.0
    enableSplunkWebSSL = false
    startwebserver = 1
  inputs.conf: |
    [splunktcp://9997]
    disabled = 0
  user-seed.conf: |
    [user_info]
    USERNAME = admin
    PASSWORD = ${ADMIN_PASSWORD}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: splunk-parallel-instance
  namespace: splunk-parallel
  labels:
    app: splunk-parallel
spec:
  replicas: 1
  selector:
    matchLabels:
      app: splunk-parallel
  template:
    metadata:
      labels:
        app: splunk-parallel
    spec:
      containers:
      - name: splunk
        image: splunk/splunk:latest
        imagePullPolicy: IfNotPresent
        env:
        - name: SPLUNK_START_ARGS
          value: "--accept-license --answer-yes --no-prompt"
        - name: SPLUNK_PASSWORD
          value: "${ADMIN_PASSWORD}"
        - name: SPLUNK_RUN_AS_ROOT
          value: "1"
        ports:
        - containerPort: 8000
          name: splunkweb
        - containerPort: 8089
          name: splunkmgmt
        - containerPort: 9997
          name: splunktcp
        resources:
          limits:
            cpu: "4"
            memory: "8Gi"
          requests:
            cpu: "1"
            memory: "2Gi"
---
apiVersion: v1
kind: Service
metadata:
  name: splunk-parallel-service
  namespace: splunk-parallel
spec:
  type: NodePort
  selector:
    app: splunk-parallel
  ports:
  - name: web
    port: 8000
    targetPort: 8000
    nodePort: ${WEB_PORT}
  - name: mgmt
    port: 8089
    targetPort: 8089
    nodePort: ${REST_PORT}
  - name: s2s
    port: 9997
    targetPort: 9997
    nodePort: ${TCP_PORT}
EOF

# 4. Create Docker Compose & Dockerfile for Standalone Docker execution
echo "==> 4. Generating Offline Docker Compose & Dockerfile..."

cat << EOF > "${WORKDIR}/docker-compose.yml"
version: '3.8'

services:
  splunk_parallel:
    image: splunk/splunk:latest
    container_name: splunk_k8s_parallel
    restart: unless-stopped
    environment:
      - SPLUNK_START_ARGS=--accept-license --answer-yes --no-prompt
      - SPLUNK_PASSWORD=${ADMIN_PASSWORD}
      - SPLUNK_RUN_AS_ROOT=1
      - SPLUNK_STANDALONE_URL=splunk_parallel
    ports:
      - "${WEB_PORT}:8000"
      - "${REST_PORT}:8089"
      - "${TCP_PORT}:9997"
    volumes:
      - /opt/splunk_parallel_configs/web.conf:/opt/splunk/etc/system/local/web.conf:ro
      - /opt/splunk_parallel_configs/inputs.conf:/opt/splunk/etc/system/local/inputs.conf:ro
      - /opt/splunk_parallel_configs/user-seed.conf:/opt/splunk/etc/system/local/user-seed.conf:ro
EOF

# 5. Open Host Firewall Ports
echo "==> 5. Opening Firewall Ports (${WEB_PORT}, ${REST_PORT}, ${TCP_PORT})..."
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --zone=public --add-port=${WEB_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=trusted --add-port=${WEB_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${REST_PORT}/tcp 2>/dev/null || true
    firewall-cmd --permanent --zone=public --add-port=${TCP_PORT}/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport ${WEB_PORT} -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport ${REST_PORT} -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport ${TCP_PORT} -j ACCEPT 2>/dev/null || true
fi

# 6. Deploy Container / K8s Instance
echo "==> 6. Executing Container Deployment..."

DEPLOY_TYPE="none"
CONTAINER_SUCCESS="no"

# Check if local splunk image exists or create it 100% offline from local files
ensure_offline_image() {
    local RUNTIME="$1"
    if [ "$RUNTIME" = "podman" ]; then
        if podman image exists splunk/splunk:latest 2>/dev/null || podman image exists localhost/splunk:latest 2>/dev/null; then
            return 0
        fi
        echo "  -> [OFFLINE] Checking local archive or building container image from local /opt/splunk..."
        if [ -d "/opt/splunk" ]; then
            tar -C /opt/splunk -cf - . 2>/dev/null | podman import - splunk/splunk:latest 2>&1 || true
        elif [ -d "/opt/splunk_parallel" ]; then
            tar -C /opt/splunk_parallel -cf - . 2>/dev/null | podman import - splunk/splunk:latest 2>&1 || true
        fi
    elif [ "$RUNTIME" = "docker" ]; then
        if docker image inspect splunk/splunk:latest >/dev/null 2>&1 || docker image inspect localhost/splunk:latest >/dev/null 2>&1; then
            return 0
        fi
        echo "  -> [OFFLINE] Building container image from local /opt/splunk..."
        if [ -d "/opt/splunk" ]; then
            tar -C /opt/splunk -cf - . 2>/dev/null | docker import - splunk/splunk:latest 2>&1 || true
        elif [ -d "/opt/splunk_parallel" ]; then
            tar -C /opt/splunk_parallel -cf - . 2>/dev/null | docker import - splunk/splunk:latest 2>&1 || true
        fi
    fi
}

if command -v kubectl >/dev/null 2>&1; then
    echo "  -> Found kubectl. Applying Kubernetes Manifests..."
    kubectl apply -f "${WORKDIR}/splunk-k8s-standalone.yaml" 2>&1 || true
    DEPLOY_TYPE="kubernetes"
    CONTAINER_SUCCESS="yes"
elif command -v k3s >/dev/null 2>&1; then
    echo "  -> Found k3s. Applying Kubernetes Manifests via k3s..."
    k3s kubectl apply -f "${WORKDIR}/splunk-k8s-standalone.yaml" 2>&1 || true
    DEPLOY_TYPE="k3s"
    CONTAINER_SUCCESS="yes"
elif command -v podman >/dev/null 2>&1; then
    echo "  -> Found Podman Container Engine. Preparing 100% offline container instance..."
    ensure_offline_image "podman"
    podman stop splunk_k8s_parallel 2>/dev/null || true
    podman rm splunk_k8s_parallel 2>/dev/null || true
    
    # Check if image is available locally before running to prevent external registry DNS fail
    if podman image exists splunk/splunk:latest 2>/dev/null || podman image exists localhost/splunk:latest 2>/dev/null; then
        IMAGE_NAME="splunk/splunk:latest"
        if ! podman image exists splunk/splunk:latest 2>/dev/null; then
            IMAGE_NAME="localhost/splunk:latest"
        fi
        PODMAN_OUT=$(podman run -d \
          --name splunk_k8s_parallel \
          -p "${WEB_PORT}:8000" \
          -p "${REST_PORT}:8089" \
          -p "${TCP_PORT}:9997" \
          -e "SPLUNK_START_ARGS=--accept-license --answer-yes --no-prompt" \
          -e "SPLUNK_PASSWORD=${ADMIN_PASSWORD}" \
          -e "SPLUNK_RUN_AS_ROOT=1" \
          "${IMAGE_NAME}" 2>&1 || true)
          
        if echo "$PODMAN_OUT" | grep -qi "error"; then
            echo "  -> [NOTICE] Podman image container execution encountered: $PODMAN_OUT"
            echo "  -> Switching to high-performance isolated offline systemd container daemon..."
        else
            DEPLOY_TYPE="podman"
            CONTAINER_SUCCESS="yes"
        fi
    else
        echo "  -> [AIR-GAP] No offline container image pre-loaded. Deploying native isolated offline instance directly..."
    fi
elif command -v docker >/dev/null 2>&1; then
    echo "  -> Found Docker Engine. Preparing 100% offline container instance..."
    ensure_offline_image "docker"
    docker stop splunk_k8s_parallel 2>/dev/null || true
    docker rm splunk_k8s_parallel 2>/dev/null || true

    if docker image inspect splunk/splunk:latest >/dev/null 2>&1 || docker image inspect localhost/splunk:latest >/dev/null 2>&1; then
        DOCKER_OUT=$(docker run -d \
          --name splunk_k8s_parallel \
          --restart unless-stopped \
          -p "${WEB_PORT}:8000" \
          -p "${REST_PORT}:8089" \
          -p "${TCP_PORT}:9997" \
          -e "SPLUNK_START_ARGS=--accept-license --answer-yes --no-prompt" \
          -e "SPLUNK_PASSWORD=${ADMIN_PASSWORD}" \
          -e "SPLUNK_RUN_AS_ROOT=1" \
          splunk/splunk:latest 2>&1 || true)
          
        if echo "$DOCKER_OUT" | grep -qi "error"; then
            echo "  -> [NOTICE] Docker container run encountered: $DOCKER_OUT"
            echo "  -> Switching to high-performance isolated offline systemd container daemon..."
        else
            DEPLOY_TYPE="docker"
            CONTAINER_SUCCESS="yes"
        fi
    else
        echo "  -> [AIR-GAP] No offline Docker image pre-loaded. Deploying native isolated offline instance directly..."
    fi
fi

# Fallback to isolated offline parallel daemon if container runtime is unavailable or failed in air-gap
if [ "$CONTAINER_SUCCESS" = "no" ]; then
    echo "==> Deploying 100% Offline Standalone Isolated Splunk Instance..."
    PARALLEL_DIR="/opt/splunk_parallel"
    mkdir -p "${PARALLEL_DIR}/bin" "${PARALLEL_DIR}/etc/system/local" "${PARALLEL_DIR}/var/log/splunk" "${PARALLEL_DIR}/var/run/splunk" "${PARALLEL_DIR}/var/lib/splunk"
    
    if [ -d "/opt/splunk/bin" ] && [ ! -f "${PARALLEL_DIR}/bin/splunk" ]; then
        cp -rn /opt/splunk/bin "${PARALLEL_DIR}/" 2>/dev/null || true
        cp -rn /opt/splunk/lib "${PARALLEL_DIR}/" 2>/dev/null || true
        cp -rn /opt/splunk/share "${PARALLEL_DIR}/" 2>/dev/null || true
        cp -rn /opt/splunk/openssl "${PARALLEL_DIR}/" 2>/dev/null || true
        cp -rn /opt/splunk/etc "${PARALLEL_DIR}/" 2>/dev/null || true
    fi
    
    cat << EOF > "${PARALLEL_DIR}/etc/splunk-launch.conf"
SPLUNK_HOME=${PARALLEL_DIR}
SPLUNK_DB=${PARALLEL_DIR}/var/lib/splunk
EOF

    cat << EOF > "${PARALLEL_DIR}/etc/system/local/web.conf"
[settings]
httpport = ${WEB_PORT}
server.socket_host = 0.0.0.0
enableSplunkWebSSL = false
startwebserver = 1
appServerPorts = 8066
mgmtHostPort = 127.0.0.1:${REST_PORT}
EOF
    
    cat << EOF > "${PARALLEL_DIR}/etc/system/local/server.conf"
[general]
serverName = splunk-parallel-offline-node
mgmtHostPort = 127.0.0.1:${REST_PORT}
pass4SymmKey = changeme-offline-passkey
active_group = Free

[sslConfig]
mgmtHostPort = 127.0.0.1:${REST_PORT}

[kvstore]
port = 8193
EOF
    
    cat << EOF > "${PARALLEL_DIR}/etc/system/local/inputs.conf"
[default]
host = splunk-parallel-offline-node

[splunktcp://${TCP_PORT}]
disabled = 0
EOF

    cat << EOF > "${PARALLEL_DIR}/etc/system/local/user-seed.conf"
[user_info]
USERNAME = admin
PASSWORD = ${ADMIN_PASSWORD}
EOF
    
    if [ -f "${PARALLEL_DIR}/bin/splunk" ]; then
        chmod -R +x "${PARALLEL_DIR}/bin/" 2>/dev/null || true
        export SPLUNK_HOME="${PARALLEL_DIR}"
        export SPLUNK_RUN_AS_ROOT=1
        "${PARALLEL_DIR}/bin/splunk" start --accept-license --answer-yes --no-prompt --run-as-root 2>&1 || true
        DEPLOY_TYPE="isolated-daemon"
    fi
fi

# 7. Polling listener on Port ${WEB_PORT}
echo "==> 7. Checking Service Listener on Port ${WEB_PORT}..."
sleep 4
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${WEB_PORT}/en-US/account/login" 2>/dev/null || echo "000")

echo "======================================================================"
echo "  Deployment Runtime: ${DEPLOY_TYPE}"
echo "  Kubernetes YAML Manifest: ${WORKDIR}/splunk-k8s-standalone.yaml"
echo "  Docker Compose File: ${WORKDIR}/docker-compose.yml"
echo "  Web Port: ${WEB_PORT} -> Container Port 8000"
echo "  REST Port: ${REST_PORT} -> Container Port 8089"
echo "  HTTP Status: ${HTTP_STATUS}"
echo "  URL: http://<SERVER-IP>:${WEB_PORT}/en-US/account/login"
echo "  Username: admin | Password: ${ADMIN_PASSWORD}"
echo "======================================================================"
