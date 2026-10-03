// Splunk Docker & Kubernetes (Splunk Operator) Architecture, Manifests & Documentation Data

export interface DockerComposeTemplate {
  id: string;
  nameFa: string;
  nameEn: string;
  category: 'standalone' | 'distributed' | 'clustered' | 'smartstore_minio';
  descriptionFa: string;
  descriptionEn: string;
  dockerComposeYaml: string;
  defaultYaml?: string;
  envExplanation: { key: string; value: string; descFa: string; descEn: string }[];
  architectureSummaryFa: string;
  architectureSummaryEn: string;
}

export interface K8sCrdTemplate {
  id: string;
  name: string;
  kind: 'Standalone' | 'IndexerCluster' | 'SearchHeadCluster' | 'ClusterManager' | 'LicenseMaster' | 'MonitoringConsole' | 'CompleteEnterpriseCluster';
  descriptionFa: string;
  descriptionEn: string;
  yamlManifest: string;
  helmValuesSnippet?: string;
  keyFields: { field: string; type: string; purposeFa: string; purposeEn: string }[];
}

export interface K8sTroubleshootingItem {
  id: string;
  issueFa: string;
  issueEn: string;
  symptom: string;
  rootCauseFa: string;
  rootCauseEn: string;
  solutionFa: string;
  solutionEn: string;
  kubectlCommand: string;
  severity: 'critical' | 'warning' | 'info';
}

export const DOCKER_COMPOSE_TEMPLATES: DockerComposeTemplate[] = [
  {
    id: 'docker-standalone',
    nameFa: '۱. استقرار منفرد کانتینری (Standalone Splunk Container)',
    nameEn: '1. Standalone Splunk Container with Persistent Volumes',
    category: 'standalone',
    descriptionFa: 'سریع‌ترین روش راه‌اندازی اسپلانک اینترپرایز به همراه Volumeهای ماندگار برای etc و var، مانیتورینگ سلامت و پورت‌های ایمن.',
    descriptionEn: 'Quickest production-grade standalone deployment with healthchecks, persistent storage for etc/var, and secure port mapping.',
    architectureSummaryFa: 'مناسب برای تست، توسعه، محیط‌های PoC یا اینستنس‌های اختصاصی لاگ‌گیری در کانتینر.',
    architectureSummaryEn: 'Ideal for test/dev, sandbox PoC, and dedicated lightweight logging nodes.',
    envExplanation: [
      { key: 'SPLUNK_START_ARGS', value: '--accept-license', descFa: 'پذیرش خودکار توافق‌نامه لایسنس اسپلانک', descEn: 'Automatically accept Splunk license agreement' },
      { key: 'SPLUNK_PASSWORD', value: 'SplunkAdminPass123!', descFa: 'رمز عبور کاربر ادمین (حداقل ۸ کاراکتر و پیچیده)', descEn: 'Admin password (min 8 chars, complex)' },
      { key: 'SPLUNK_ROLE', value: 'splunk_standalone', descFa: 'نقش کانتینر به عنوان سرور منفرد جامع', descEn: 'Container role as standalone node' },
      { key: 'SPLUNK_HEC_TOKEN', value: 'b2803b90-1c95-46f9-8687-d7d8e0638541', descFa: 'ایجاد خودکار توکن HTTP Event Collector برای دریافت لاگ', descEn: 'Auto-provision HEC token for incoming events' }
    ],
    dockerComposeYaml: `version: '3.8'

services:
  splunk-standalone:
    image: splunk/splunk:9.2.1
    container_name: splunk-standalone
    hostname: splunk-standalone
    restart: unless-stopped
    ports:
      - "8000:8000"   # Splunk Web UI
      - "8089:8089"   # Splunk REST Management API
      - "8088:8088"   # HTTP Event Collector (HEC)
      - "9997:9997"   # Splunk-to-Splunk (S2S) Ingestion Receiver
      - "514:514/udp" # Syslog UDP (Optional)
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkAdminPass123!
      - SPLUNK_ROLE=splunk_standalone
      - SPLUNK_HEC_TOKEN=b2803b90-1c95-46f9-8687-d7d8e0638541
      - SPLUNK_HEC_SSL=true
      - SPLUNK_ENABLE_LISTEN=9997
    volumes:
      - splunk-etc:/opt/splunk/etc
      - splunk-var:/opt/splunk/var
    healthcheck:
      test: ["CMD", "curl", "-k", "-f", "https://localhost:8089/services/server/info"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G
    networks:
      - splunk-net

volumes:
  splunk-etc:
    name: splunk_etc_volume
  splunk-var:
    name: splunk_var_volume

networks:
  splunk-net:
    name: splunk_network
    driver: bridge`
  },
  {
    id: 'docker-distributed-2tier',
    nameFa: '۲. کلاستر توزیع‌شده ۲ لایه (Search Head + Indexer + Universal Forwarder)',
    nameEn: '2. Distributed 2-Tier Architecture (SH + Indexer + Forwarder)',
    category: 'distributed',
    descriptionFa: 'جداسازی لایه جستجو از لایه ذخیره‌سازی و ایندکس‌گذاری به همراه یک کانتینر Universal Forwarder متصل روی شبکه داخلی داکر.',
    descriptionEn: 'Separates search head queries from indexing workload, paired with a lightweight forwarder stream.',
    architectureSummaryFa: 'جداسازی بار پردازشی جستجوهای سنگین کاربران SOC از عملیات بلادرنگ ایندکس‌گذاری ترافیک ورودی.',
    architectureSummaryEn: 'Decouples analytical query overhead from continuous high-throughput ingestion pipelines.',
    envExplanation: [
      { key: 'SPLUNK_ROLE', value: 'splunk_search_head / splunk_indexer', descFa: 'تعیین نقش هر کانتینر در توپولوژی', descEn: 'Assigns role for SH vs Indexer' },
      { key: 'SPLUNK_INDEXER_URL', value: 'splunk-indexer:8089', descFa: 'اتصال Search Head به Indexer به عنوان Search Peer', descEn: 'Links Search Head to Indexer as search peer' },
      { key: 'SPLUNK_FORWARD_SERVER', value: 'splunk-indexer:9997', descFa: 'آدرس ایندکسر جهت ارسال لاگ‌ها از فورواردر', descEn: 'Target indexer receiver for Universal Forwarder' }
    ],
    dockerComposeYaml: `version: '3.8'

services:
  # 1. License & Cluster Master (Optional / Shared)
  splunk-indexer:
    image: splunk/splunk:9.2.1
    container_name: splunk-indexer-01
    hostname: splunk-indexer-01
    restart: unless-stopped
    ports:
      - "8091:8089" # Indexer Management
      - "9997:9997" # Ingestion Port
      - "8088:8088" # HEC Ingestion
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkClusterPass123!
      - SPLUNK_ROLE=splunk_indexer
      - SPLUNK_ENABLE_LISTEN=9997
    volumes:
      - indexer-etc:/opt/splunk/etc
      - indexer-var:/opt/splunk/var
    networks:
      - splunk-cluster-net

  # 2. Dedicated Search Head Node
  splunk-searchhead:
    image: splunk/splunk:9.2.1
    container_name: splunk-searchhead-01
    hostname: splunk-searchhead-01
    restart: unless-stopped
    ports:
      - "8000:8000" # Web Interface
      - "8089:8089" # REST API
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkClusterPass123!
      - SPLUNK_ROLE=splunk_search_head
      - SPLUNK_INDEXER_URL=splunk-indexer-01:8089
      - SPLUNK_SEARCH_HEAD_CAPTAIN_URL=https://splunk-searchhead-01:8089
    volumes:
      - searchhead-etc:/opt/splunk/etc
      - searchhead-var:/opt/splunk/var
    depends_on:
      - splunk-indexer
    networks:
      - splunk-cluster-net

  # 3. Universal Forwarder Agent
  splunk-forwarder:
    image: splunk/universalforwarder:9.2.1
    container_name: splunk-uf-01
    hostname: splunk-uf-01
    restart: unless-stopped
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkClusterPass123!
      - SPLUNK_FORWARD_SERVER=splunk-indexer-01:9997
      - SPLUNK_ADD=monitor /var/log/docker_logs
    volumes:
      - /var/log:/var/log/docker_logs:ro
      - uf-etc:/opt/splunk/etc
    depends_on:
      - splunk-indexer
    networks:
      - splunk-cluster-net

volumes:
  indexer-etc:
  indexer-var:
  searchhead-etc:
  searchhead-var:
  uf-etc:

networks:
  splunk-cluster-net:
    driver: bridge`
  },
  {
    id: 'docker-clustered-ha',
    nameFa: '۳. کلاستر کامل High Availability داکر (CM + 3 Indexers + SHC + Deployer)',
    nameEn: '3. Full Clustered HA (Cluster Manager + 3 Indexers + SHC + MinIO SmartStore)',
    category: 'clustered',
    descriptionFa: 'راه‌اندازی کامل کلاستر سازمانی اسپلانک با فاکتور تکثیر RF=3 و فاکتور جستجو SF=2 به همراه آبجکت استوریج MinIO سازگار با S3 برای SmartStore.',
    descriptionEn: 'Full enterprise cluster with Replication Factor RF=3, Search Factor SF=2, and MinIO S3-compatible SmartStore.',
    architectureSummaryFa: 'پایدارترین ساختار برای شبیه‌سازی تست‌های Disaster Recovery، ارتقای بدون قطعی و اعتبارسنجی باکت‌های کلاستر.',
    architectureSummaryEn: 'Production-like sandbox for disaster recovery drills, zero-downtime rolling restarts, and SmartStore testing.',
    envExplanation: [
      { key: 'SPLUNK_ROLE', value: 'splunk_cluster_master', descFa: 'نقش مدیر کلاستر (Cluster Manager)', descEn: 'Cluster Manager orchestrator node' },
      { key: 'SPLUNK_REPLICATION_FACTOR', value: '3', descFa: 'تعداد نسخه‌های تکثیر هر باکت داده', descEn: 'Number of data bucket copies across peers' },
      { key: 'SPLUNK_SEARCH_FACTOR', value: '2', descFa: 'تعداد نسخه‌های قابل جستجوی فوری', descEn: 'Number of searchable bucket copies' }
    ],
    dockerComposeYaml: `version: '3.8'

services:
  # --- S3-Compatible Object Store for Splunk SmartStore ---
  minio-smartstore:
    image: minio/minio:latest
    container_name: minio-smartstore
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=splunk_s3_admin
      - MINIO_ROOT_PASSWORD=SplunkMinioPass2026!
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    networks:
      - splunk-ha-net

  # --- Splunk Cluster Manager (CM) ---
  cluster-manager:
    image: splunk/splunk:9.2.1
    container_name: splunk-cm
    hostname: splunk-cm
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkEnterprisePass123!
      - SPLUNK_ROLE=splunk_cluster_master
      - SPLUNK_REPLICATION_FACTOR=3
      - SPLUNK_SEARCH_FACTOR=2
      - SPLUNK_SECRET=SplunkClusterSecretKey99!
    ports:
      - "8089:8089"
    volumes:
      - cm-etc:/opt/splunk/etc
    networks:
      - splunk-ha-net

  # --- Indexer Peer 1 ---
  indexer-01:
    image: splunk/splunk:9.2.1
    container_name: splunk-idx-01
    hostname: splunk-idx-01
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkEnterprisePass123!
      - SPLUNK_ROLE=splunk_indexer
      - SPLUNK_CLUSTER_MASTER_URL=https://cluster-manager:8089
      - SPLUNK_SECRET=SplunkClusterSecretKey99!
      - SPLUNK_ENABLE_LISTEN=9997
    ports:
      - "9997:9997"
    volumes:
      - idx1-var:/opt/splunk/var
    depends_on:
      - cluster-manager
    networks:
      - splunk-ha-net

  # --- Indexer Peer 2 ---
  indexer-02:
    image: splunk/splunk:9.2.1
    container_name: splunk-idx-02
    hostname: splunk-idx-02
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkEnterprisePass123!
      - SPLUNK_ROLE=splunk_indexer
      - SPLUNK_CLUSTER_MASTER_URL=https://cluster-manager:8089
      - SPLUNK_SECRET=SplunkClusterSecretKey99!
      - SPLUNK_ENABLE_LISTEN=9997
    volumes:
      - idx2-var:/opt/splunk/var
    depends_on:
      - cluster-manager
    networks:
      - splunk-ha-net

  # --- Indexer Peer 3 ---
  indexer-03:
    image: splunk/splunk:9.2.1
    container_name: splunk-idx-03
    hostname: splunk-idx-03
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkEnterprisePass123!
      - SPLUNK_ROLE=splunk_indexer
      - SPLUNK_CLUSTER_MASTER_URL=https://cluster-manager:8089
      - SPLUNK_SECRET=SplunkClusterSecretKey99!
      - SPLUNK_ENABLE_LISTEN=9997
    volumes:
      - idx3-var:/opt/splunk/var
    depends_on:
      - cluster-manager
    networks:
      - splunk-ha-net

  # --- Search Head Cluster Member ---
  searchhead-01:
    image: splunk/splunk:9.2.1
    container_name: splunk-sh-01
    hostname: splunk-sh-01
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=SplunkEnterprisePass123!
      - SPLUNK_ROLE=splunk_search_head
      - SPLUNK_CLUSTER_MASTER_URL=https://cluster-manager:8089
      - SPLUNK_SECRET=SplunkClusterSecretKey99!
    ports:
      - "8000:8000"
    depends_on:
      - cluster-manager
      - indexer-01
    networks:
      - splunk-ha-net

volumes:
  minio-data:
  cm-etc:
  idx1-var:
  idx2-var:
  idx3-var:

networks:
  splunk-ha-net:
    driver: bridge`
  }
];

export const K8S_OPERATOR_CRDS: K8sCrdTemplate[] = [
  {
    id: 'k8s-operator-complete-cluster',
    name: 'Splunk Complete Enterprise Cluster (Full CRD Stack)',
    kind: 'CompleteEnterpriseCluster',
    descriptionFa: 'مانیفست جامع و کامل استقرار کلاستر اسپلانک بر روی کوبرنتیز با استفاده از Splunk Operator شامل IndexerCluster با اسمارت‌استور، SearchHeadCluster، ClusterManager، LicenseMaster و مانیتورینگ کنسول.',
    descriptionEn: 'Full-stack enterprise Splunk deployment via Splunk Operator for Kubernetes with SmartStore S3 backend, SHC, and Cluster Manager.',
    keyFields: [
      { field: 'spec.replicas', type: 'integer', purposeFa: 'تعداد پادهای فعال برای Indexerها یا Search Headها', purposeEn: 'Desired replica count for indexers or search heads' },
      { field: 'spec.smartstore', type: 'object', purposeFa: 'تنظیمات باکت S3/MinIO جهت ذخیره باکت‌های وارم و کلد', purposeEn: 'Configures remote S3 storage for warm/cold buckets' },
      { field: 'spec.clusterManagerRef', type: 'object', purposeFa: 'ارجاع مستقیم به پاد مدیر کلاستر (Cluster Manager)', purposeEn: 'Refers to the Cluster Manager resource managing the cluster' },
      { field: 'spec.storageClassName', type: 'string', purposeFa: 'کلاس دیسک‌های پرسرعت SSD NVMe برای کش محلی باکت‌های Hot', purposeEn: 'Fast SSD storage class for hot bucket NVMe caching' }
    ],
    yamlManifest: `apiVersion: enterprise.splunk.com/v4
kind: LicenseMaster
metadata:
  name: splunk-license-master
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  volumes:
    - name: mnt-splunk-secrets
      secret:
        secretName: splunk-enterprise-secrets
---
apiVersion: enterprise.splunk.com/v4
kind: ClusterManager
metadata:
  name: splunk-cm
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  licenseMasterRef:
    name: splunk-license-master
  volumes:
    - name: mnt-splunk-secrets
      secret:
        secretName: splunk-enterprise-secrets
---
apiVersion: enterprise.splunk.com/v4
kind: IndexerCluster
metadata:
  name: splunk-idxc
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  replicas: 3
  clusterManagerRef:
    name: splunk-cm
  licenseMasterRef:
    name: splunk-license-master
  smartstore:
    volList:
      - name: remote_s3_storage
        endpoint: https://s3.eu-central-1.amazonaws.com
        path: enterprise-splunk-smartstore-bucket
        secretRef: splunk-s3-credentials
  resources:
    limits:
      cpu: "8"
      memory: 16Gi
    requests:
      cpu: "4"
      memory: 8Gi
  volumes:
    - name: etc
      persistentVolumeClaim:
        claimName: etc-pvc
    - name: var
      persistentVolumeClaim:
        claimName: var-pvc
---
apiVersion: enterprise.splunk.com/v4
kind: SearchHeadCluster
metadata:
  name: splunk-shc
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  replicas: 3
  clusterManagerRef:
    name: splunk-cm
  licenseMasterRef:
    name: splunk-license-master
  resources:
    limits:
      cpu: "8"
      memory: 16Gi
    requests:
      cpu: "4"
      memory: 8Gi
---
apiVersion: enterprise.splunk.com/v4
kind: MonitoringConsole
metadata:
  name: splunk-mc
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  clusterManagerRef:
    name: splunk-cm
  searchHeadClusterRef:
    name: splunk-shc
  licenseMasterRef:
    name: splunk-license-master`,
    helmValuesSnippet: `## Splunk Operator Helm Values Configuration (Production Profile)
splunkOperator:
  image:
    repository: splunk/splunk-operator
    tag: 2.5.0
    pullPolicy: IfNotPresent
  replicaCount: 1
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  clusterWide: true
  watchNamespaces: "splunk"`
  },
  {
    id: 'k8s-crd-indexer-cluster',
    name: 'IndexerCluster CRD with SmartStore & NVMe PVCs',
    kind: 'IndexerCluster',
    descriptionFa: 'پیکربندی لایه ذخیره‌سازی و ایندکس‌گذاری مقیاس‌پذیر در کوبرنتیز با اتصال خودکار به Cluster Manager و اسمارت‌استور S3.',
    descriptionEn: 'Scalable cloud-native Indexer Cluster resource managed automatically by Splunk Operator.',
    keyFields: [
      { field: 'spec.replicas', type: 'int', purposeFa: 'تعداد ایندکسرهای همتا در کلاستر', purposeEn: 'Number of active indexer peer pods' },
      { field: 'spec.clusterManagerRef', type: 'object', purposeFa: 'اتصال خودکار به Cluster Manager جهت هماهنگی باکت‌ها', purposeEn: 'Automatic binding to CM for bucket state sync' }
    ],
    yamlManifest: `apiVersion: enterprise.splunk.com/v4
kind: IndexerCluster
metadata:
  name: idxc-prod
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  replicas: 4
  clusterManagerRef:
    name: splunk-cm
  licenseMasterRef:
    name: splunk-license-master
  smartstore:
    defaults:
      volume: remote_storage
    volList:
      - name: remote_storage
        endpoint: https://s3.corp.internal:9000
        path: splunk-cold-buckets
        secretRef: s3-smartstore-auth
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/component
                operator: In
                values:
                  - indexer
          topologyKey: "kubernetes.io/hostname"
  resources:
    limits:
      cpu: "12"
      memory: 24Gi
    requests:
      cpu: "6"
      memory: 12Gi`
  },
  {
    id: 'k8s-crd-searchhead-cluster',
    name: 'SearchHeadCluster (SHC) CRD with Raft Consensus',
    kind: 'SearchHeadCluster',
    descriptionFa: 'خوشه سرچ‌هدهای بدون قطعی در کوبرنتیز با انتخاب خودکار کاپیتان بر اساس الگوریتم Raft و همگام‌سازی Artifactها.',
    descriptionEn: 'Resilient Search Head Cluster with automatic Raft captain election and artifact replication.',
    keyFields: [
      { field: 'spec.replicas', type: 'int', purposeFa: 'تعداد اعضای خوشه جستجو (حداقل ۳ عضو جهت حد نصاب کوئوروم)', purposeEn: 'Search head count (min 3 for quorum)' }
    ],
    yamlManifest: `apiVersion: enterprise.splunk.com/v4
kind: SearchHeadCluster
metadata:
  name: shc-prod
  namespace: splunk
spec:
  image: splunk/splunk:9.2.1
  replicas: 3
  clusterManagerRef:
    name: splunk-cm
  licenseMasterRef:
    name: splunk-license-master
  serviceTemplate:
    spec:
      type: LoadBalancer
  resources:
    limits:
      cpu: "8"
      memory: 16Gi
    requests:
      cpu: "4"
      memory: 8Gi`
  }
];

export const K8S_TROUBLESHOOTING_GUIDE: K8sTroubleshootingItem[] = [
  {
    id: 'k8s-issue-crashloop',
    issueFa: 'خطای CrashLoopBackOff در پاد Indexer یا Search Head',
    issueEn: 'CrashLoopBackOff on Indexer or Search Head Pod',
    symptom: 'Pod restarts continuously with Exit Code 137 or 1',
    rootCauseFa: 'کمبود منابع حافظه (OOMKilled)، عدم تایید لایسنس یا ناسازگاری مجوزهای فایل در volume نصب‌شده (/opt/splunk/var).',
    rootCauseEn: 'Out of Memory (OOMKilled), license acceptance missing, or volume permission conflict on UID 20182.',
    solutionFa: 'بررسی لاگ‌های پاد، افزایش memory limit در مانیفست CRD و بررسی متغیر SPLUNK_START_ARGS=--accept-license.',
    solutionEn: 'Check pod logs, increase memory limits in CRD spec, and ensure SPLUNK_START_ARGS=--accept-license is set.',
    kubectlCommand: 'kubectl logs -n splunk splunk-idxc-0 -c splunk --previous',
    severity: 'critical'
  },
  {
    id: 'k8s-issue-pvc-pending',
    issueFa: 'پاد در وضعیت Pending به علت عدم تخصیص PVC دیسک',
    issueEn: 'Pod stuck in Pending state due to unbound PVC',
    symptom: '0/1 nodes available: persistentvolumeclaim "var-pvc" not found',
    rootCauseFa: 'نبود StorageClass مناسب در کلاستر کوبرنتیز یا کمبود ظرفیت دیسک روی نودهای ورکر.',
    rootCauseEn: 'StorageClass is missing or volume provisioner failed to attach disk.',
    solutionFa: 'بررسی دیسک‌های کلاستر با kubectl get storageclass و ایجاد Provisioner مناسب (مانند gp3، local-nvme یا csi-driver).',
    solutionEn: 'Inspect cluster storage classes and assign valid CSI provisioner in CRD.',
    kubectlCommand: 'kubectl describe pvc -n splunk',
    severity: 'critical'
  },
  {
    id: 'k8s-issue-raft-quorum',
    issueFa: 'از دست رفتن حد نصاب کوئوروم در SearchHeadCluster',
    issueEn: 'Loss of Raft Quorum in Search Head Cluster',
    symptom: 'No elected captain found; searches fail with 503 Service Unavailable',
    rootCauseFa: 'قطع ارتباط شبکه بین پادهای SHC یا خاموش شدن بیش از نیمی از اعضای خوشه (کمتر از N/2+1 عضو فعال).',
    rootCauseEn: 'Network partition between SHC pods or more than half nodes down.',
    solutionFa: 'تطبیق تعداد پادها و در صورت نیاز، انتقال موقت نقش کاپیتان با دستور CLI روی پاد سالم.',
    solutionEn: 'Restore quorum pods or force captain bootstrap via splunk bootstrap shcluster-captain.',
    kubectlCommand: 'kubectl exec -it -n splunk splunk-shc-0 -- splunk show shcluster-status',
    severity: 'warning'
  },
  {
    id: 'k8s-issue-smartstore-s3',
    issueFa: 'خطای عدم اتصال به S3 / MinIO در SmartStore',
    issueEn: 'SmartStore S3 Remote Bucket Upload Failure',
    symptom: 'ERROR CacheManager - Failed to upload bucket to remote store',
    rootCauseFa: 'نامعتبر بودن توکن و Secret کلاینت S3، عدم دسترسی شبکه از پاد به اندپوینت S3 یا انقضای زمان پاسخ.',
    rootCauseEn: 'Invalid S3 access key secret, bucket name mismatch, or firewall drop to S3 endpoint.',
    solutionFa: 'تست اتصال کانتینر با curl/aws-cli و بروزرسانی Secret در کوبرنتیز.',
    solutionEn: 'Verify S3 credentials secret in Kubernetes and test endpoint connectivity.',
    kubectlCommand: 'kubectl get secret -n splunk splunk-s3-credentials -o yaml',
    severity: 'critical'
  },
  {
    id: 'k8s-issue-rolling-upgrade',
    issueFa: 'عملیات Rolling Upgrade بدون قطعی کلاستر در کوبرنتیز',
    issueEn: 'Zero-Downtime Rolling Upgrade via Splunk Operator',
    symptom: 'Need to upgrade Splunk version across all indexers and search heads',
    rootCauseFa: 'ارتقای نرم‌افزاری پادها از نگارش ۹.۰.x به ۹.۲.x به صورت گام به گام.',
    rootCauseEn: 'Controlled sequential upgrade orchestrated by Splunk Operator.',
    solutionFa: 'تغییر فیلد image در مانیفست CRD. اپراتور به طور خودکار ابتدا Cluster Manager، سپس Indexerها و سرانجام Search Headها را بدون قطعی سرویس ارتقا می‌دهد.',
    solutionEn: 'Update the image tag in CRD spec. Splunk Operator orchestrates seamless draining and rolling upgrade.',
    kubectlCommand: 'kubectl patch indexercluster splunk-idxc -n splunk --type=\'json\' -p=\'[{"op": "replace", "path": "/spec/image", "value": "splunk/splunk:9.2.2"}]\'',
    severity: 'info'
  }
];

export const SPLUNK_DOCKER_CLI_COMMANDS = [
  {
    category: 'اجرا و مدیریت پایه داکر',
    cmd: 'docker run -d --name splunk -p 8000:8000 -p 8089:8089 -p 9997:9997 -e "SPLUNK_START_ARGS=--accept-license" -e "SPLUNK_PASSWORD=AdminPass123!" -v splunk_etc:/opt/splunk/etc -v splunk_var:/opt/splunk/var splunk/splunk:latest',
    descFa: 'اجرای کانتینر رسمی اسپلانک با پورت‌های وب، REST و ایندکسینگ و Volumeهای ماندگار'
  },
  {
    category: 'لاگ‌ها و مانیتورینگ',
    cmd: 'docker logs -f --tail 100 splunk',
    descFa: 'مشاهده لحظه‌ای لاگ‌های راه‌اندازی و سیستم اسپلانک در داکر'
  },
  {
    category: 'ورود به محیط شل کانتینر',
    cmd: 'docker exec -it -u splunk splunk /bin/bash',
    descFa: 'ورود به شل کانتینر با دسترسی کاربر ایمن splunk'
  },
  {
    category: 'بررسی وضعیت سلامت با btool',
    cmd: 'docker exec -it splunk /opt/splunk/bin/splunk btool check',
    descFa: 'بررسی خطاهای ساختاری و تضاد کانفیگ‌ها در کانتینر'
  },
  {
    category: 'بارگذاری مجدد تنظیمات بدون ریستارت',
    cmd: 'docker exec -it splunk /opt/splunk/bin/splunk _internal call /services/admin/config-reload -auth admin:AdminPass123!',
    descFa: 'اعمال فوری تغییرات inputs.conf و props.conf بدون قطع سرویس کانتینر'
  }
];

export const SPLUNK_K8S_CLI_COMMANDS = [
  {
    category: 'نصب اپراتور با Helm',
    cmd: 'helm repo add splunk https://splunk.github.io/splunk-operator && helm repo update && helm install splunk-operator splunk/splunk-operator -n splunk --create-namespace',
    descFa: 'افزودن ریپازیتوری رسمی و نصب Splunk Operator در فضای نام splunk'
  },
  {
    category: 'بررسی منابع اختصاصی (CRDs)',
    cmd: 'kubectl get crds | grep splunk',
    descFa: 'مشاهده لیست تمام CRDهای نصب شده اپراتور اسپلانک در کلاستر'
  },
  {
    category: 'مشاهده وضعیت کلاستر ایندکسرها',
    cmd: 'kubectl get indexercluster,searchheadcluster,clustermanager -n splunk',
    descFa: 'بررسی لحظه‌ای سلامت و وضعیت هماهنگی تمام خوشه‌های اسپلانک'
  },
  {
    category: 'افزایش/کاهش آنی تعداد ایندکسرها (Scale)',
    cmd: 'kubectl scale indexercluster splunk-idxc --replicas=6 -n splunk',
    descFa: 'مقیاس‌پذیری افقی فوری ایندکسرها بدون قطعی داده'
  },
  {
    category: 'مشاهده وضعیت باکت‌ها در Cluster Manager',
    cmd: 'kubectl exec -it -n splunk splunk-cm-0 -- splunk show cluster-status',
    descFa: 'بررسی وضعیت Replication Factor و Search Factor باکت‌ها از داخل پاد CM'
  }
];
