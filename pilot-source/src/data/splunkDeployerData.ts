export type DeploymentTargetEngine = 'baremetal_native' | 'docker_standalone' | 'k8s_operator';

export interface DeploymentEngineOption {
  id: DeploymentTargetEngine;
  titleFa: string;
  titleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  badge: string;
  badgeColor: string;
  recommendedFor: string;
  featuresFa: string[];
  featuresEn: string[];
  managementMethodFa: string;
  managementMethodEn: string;
  installPath: string;
  serviceManager: string;
}

export const DEPLOYMENT_ENGINE_OPTIONS: DeploymentEngineOption[] = [
  {
    id: 'baremetal_native',
    titleFa: '۱. نصب مستقیم بر روی سیستم‌عامل (Bare-Metal / Native OS with Systemd)',
    titleEn: '1. Native Bare-Metal / OS Direct (No Containers, Linux systemd)',
    subtitleFa: 'ایده‌آل برای سازمان‌های فاقد داکر/کوبر، سرورهای فیزیکی اختصاصی و ماشین‌های مجازی VMware / KVM',
    subtitleEn: 'Zero-overhead direct RPM/DEB/TGZ install with native systemd daemon & CLI control',
    badge: 'سازمانی سنتی و SOC ایزوله (بیشترین محبوبیت)',
    badgeColor: 'emerald',
    recommendedFor: 'Enterprise Bare-Metal & Dedicated Hardware / Isolated Data Centers',
    featuresFa: [
      'بدون نیاز به نصب Docker یا کلاستر Kubernetes (صفر سربار پردازشی)',
      'نصب مستقیم پکیج‌های رسمی Splunk Enterprise (RPM / DEB / TGZ) در مسیر استاندارد `/opt/splunk`',
      'مدیریت از طریق دیمن پیش‌فرض لینوکس `systemd` (`systemctl start/stop Splunkd.service`) با اجرای خودکار در بوت',
      'حداکثر کارایی دیسک و IOPS خام بدون لایه مجازی کانتینر با فایل‌سیستم XFS و فلگ `noatime,nodiratime`',
      'تنظیم مستقیم متغیرهای کرنل، غیرفعال‌سازی THP و تنظیم دسترسی ایزوله کاربر سیستمی `splunk:splunk`',
      'ابزارهای بومی بررسی سلامت و خطایابی کلاستر با اسکریپت‌های CLI، `btool` و لاگ‌های مستقیم سیستمی'
    ],
    featuresEn: [
      'Zero container overhead - no Docker or Kubernetes cluster required',
      'Native RPM/DEB/TGZ enterprise package direct installation in /opt/splunk',
      'Full Linux systemd daemon integration (Splunkd.service) with auto-start on boot',
      'Maximum NVMe/SAS disk IOPS throughput with direct XFS (noatime/nodiratime)',
      'Direct kernel sysctl tuning, THP disablement and dedicated splunk:splunk system user',
      'Native CLI troubleshooting, btool verification and direct operating system logs'
    ],
    managementMethodFa: 'مدیریت از طریق Systemd (`systemctl status Splunkd`) و ابزار خط فرمان `/opt/splunk/bin/splunk`',
    managementMethodEn: 'Managed via native systemd units and /opt/splunk/bin/splunk CLI',
    installPath: '/opt/splunk',
    serviceManager: 'Linux systemd (systemctl)'
  },
  {
    id: 'docker_standalone',
    titleFa: '۲. داکر مستقل و داکر کامپوز (Docker Engine & Docker Compose)',
    titleEn: '2. Standalone Docker Engine & Compose',
    subtitleFa: 'مناسب برای سرورهای دارای Docker Daemon بدون نیاز به راه‌اندازی کوبرنتیز',
    subtitleEn: 'Lightweight containerized deployment using standard Docker Compose manifests',
    badge: 'کانتینری سبک (Single-Host)',
    badgeColor: 'sky',
    recommendedFor: 'Dev/Test & Containerized Single-Node / Multi-Container Environments',
    featuresFa: [
      'استقرار Image رسمی `splunk/splunk:9.4.0` از طریق داکر کانتینر ایزوله',
      'مدیریت با مانیفست استاندارد `docker-compose.yml` و تعریف پورت‌های ۹۹۹۷، ۸۰۰۰ و ۸۰۸۹',
      'اتصال پوشه‌های پایدار دیسک سرور (Bind Mounts / Volumes) به `/opt/splunk/etc` و `/opt/splunk/var`',
      'سادگی در ارتقا و جابه‌جایی با دستور `docker compose pull && docker compose up -d`'
    ],
    featuresEn: [
      'Official splunk/splunk:9.4.0 image execution in isolated Linux cgroups',
      'Standard docker-compose.yml orchestration mapping ports 9997, 8000, 8089',
      'Persistent storage volumes bound to /opt/splunk/etc and /opt/splunk/var',
      'Fast upgrades and portability via docker compose commands'
    ],
    managementMethodFa: 'مدیریت با کانتینرهای داکر (`docker compose ps` / `docker logs`)',
    managementMethodEn: 'Managed via Docker CLI and Compose daemon',
    installPath: '/var/lib/docker/volumes/splunk_data',
    serviceManager: 'Docker Daemon (dockerd)'
  },
  {
    id: 'k8s_operator',
    titleFa: '۳. کوبرنتیز سازمانی و Splunk Operator (SOK v2.5.0)',
    titleEn: '3. Enterprise Kubernetes with Splunk Operator (SOK)',
    subtitleFa: 'مناسب برای زیرساخت‌های Cloud-Native، کلاسترهای K3s / RKE2 / OpenShift',
    subtitleEn: 'Full declarative CRD orchestration with automated pod scaling and failover',
    badge: 'Cloud-Native & Large Enterprise',
    badgeColor: 'purple',
    recommendedFor: 'Enterprise Kubernetes Clusters & Cloud Orchestrators',
    featuresFa: [
      'مدیریت نودها با Custom Resource Definitions (CRDs) شامل `IndexerCluster` و `SearchHeadCluster`',
      'خودترمیمی و چرخه حیات خودکار پادها همراه با ذخیره‌سازی ابری PersistentVolumeClaim (PVC)',
      'لودبالانسینگ یکپارچه ترافیک با Kubernetes Service و Ingress NGINX',
      'ارتقای پله‌ای بدون قطعی (Rolling Upgrades) توسط اپراتور هوشمند SOK'
    ],
    featuresEn: [
      'Declarative CRD management (IndexerCluster, SearchHeadCluster, Standalone)',
      'Automated pod self-healing, health probes and PersistentVolumeClaim lifecycle',
      'Native Kubernetes Service and Ingress controller load balancing',
      'Zero-downtime rolling upgrades handled by Splunk Operator controller'
    ],
    managementMethodFa: 'مدیریت با ابزار kubectl و کنترلر Splunk Operator',
    managementMethodEn: 'Managed via kubectl CLI and SOK Operator Controller',
    installPath: '/opt/splunk (PVC)',
    serviceManager: 'Kubernetes kubelet & SOK Controller'
  }
];

export interface SocAnalyst {
  id: string;
  name: string;
  role: 'SOC Tier 1 Analyst' | 'SOC Tier 2 / Incident Responder' | 'Senior Threat Hunter' | 'SOC Manager / Lead' | 'Compliance & Audit Officer';
  concurrentSearchesQuota: number;
  activeDashboards: number;
}

export interface SearchLoadBalancerConfig {
  enabled: boolean;
  type: 'nginx' | 'f5_bigip' | 'haproxy' | 'k8s_ingress';
  vipIp: string;
  vipHostname: string;
  port: number;
  sslOffloading: boolean;
  algorithm: 'ip_hash_sticky' | 'least_conn' | 'round_robin';
}

export interface StorageBucketLifecycle {
  hotWarmDays: number;
  coldDays: number;
  frozenDays: number;
  hotWarmDiskType: 'NVMe Gen4 SSD (10,000+ IOPS)' | 'Enterprise SAS SSD' | 'PCIe Direct Attached';
  coldDiskType: 'SAS 10K/15K RPM HDD (RAID-6 / 1,200 IOPS)' | 'SATA Enterprise 7.2K (RAID-6)' | 'SAN Fiber Channel';
  frozenStorageType: 'Object Storage (MinIO / S3 / Ceph)' | 'NFS Centralized Storage Pool' | 'Glacial Long-term Archive';
  hotWarmPath: string;
  coldPath: string;
  frozenPath: string;
  smartStoreEnabled: boolean;
  smartStoreEndpoint: string;
  // Computed values
  hotWarmVolumeTB: number;
  coldVolumeTB: number;
  frozenVolumeTB: number;
  totalStorageTB: number;
}

export interface LicenseCostEstimation {
  dailyIngestGB: number;
  pricingModel: 'term_ingest' | 'workload_svm' | 'perpetual_maintenance';
  estimatedAnnualLicenseUSD: number;
  costPerGBYearUSD: number;
  supportLevel: 'Enterprise Standard 24x7' | 'Enterprise Premium with Dedicated TAM';
  supportCostAnnualUSD: number;
  estimatedHardwareCapexUSD: number;
  estimatedStorageCapexUSD: number;
  estimated3YearTcoUSD: number;
}

export type SplunkNodeRole = 
  | 'license_master'
  | 'deployment_server'
  | 'deployer'
  | 'cluster_manager'
  | 'indexer_peer'
  | 'search_head'
  | 'heavy_forwarder'
  | 'search_load_balancer'
  | 'deployer_lm_ds'
  | 'standalone'
  | 'monitoring_console';

export interface SplunkPortDefinition {
  port: number;
  key: string;
  nameEn: string;
  nameFa: string;
  protocol: 'TCP' | 'UDP' | 'TCP/SSL';
  direction: 'Inbound' | 'Outbound' | 'Bidirectional';
  configFile: string;
  descriptionEn: string;
  descriptionFa: string;
  defaultAllowedSources: string;
  securityImpact: 'Critical Management' | 'Data Pipeline' | 'Web Client Access' | 'Cluster Sync';
}

export const SPLUNK_PORT_DEFINITIONS: Record<string, SplunkPortDefinition> = {
  '8000': {
    port: 8000,
    key: 'splunkWeb',
    nameEn: 'Splunk Web Interface',
    nameFa: 'کنسول وب اسپلانک (Splunk Web UI)',
    protocol: 'TCP',
    direction: 'Inbound',
    configFile: 'web.conf [settings] httpport = 8000',
    descriptionEn: 'User interface access for SOC analysts and administrators to execute SPL searches, view dashboards and manage configurations.',
    descriptionFa: 'پورت دسترسی کارشناسان SOC و مدیران به رابط کاربری تحت وب جهت اجرای کوئری‌های SPL، مشاهده داشبوردها و گزارش‌ها.',
    defaultAllowedSources: 'SOC Analysts / Admin Subnets / VIP Load Balancer',
    securityImpact: 'Web Client Access'
  },
  '8089': {
    port: 8089,
    key: 'splunkMgmt',
    nameEn: 'Splunkd REST API & Management Port',
    nameFa: 'پورت مدیریت و REST API اسپلانک (Splunkd Management)',
    protocol: 'TCP/SSL',
    direction: 'Bidirectional',
    configFile: 'server.conf [sslConfig] mgmtHostPort = 8089',
    descriptionEn: 'Core management channel between Splunk nodes. Used for cluster heartbeat, bundle distribution, License Master synchronization and REST API execution.',
    descriptionFa: 'کانال ارتباطی و مدیریتی میان تمامی نودهای اسپلانک. برای هارت‌بیت کلاستر، ارسال پکیج‌های کانفیگ توسط Deployer و همگام‌سازی لایسنس.',
    defaultAllowedSources: 'Internal Splunk Cluster Nodes & Management Console',
    securityImpact: 'Critical Management'
  },
  '9997': {
    port: 9997,
    key: 'splunkTcp',
    nameEn: 'Splunk-to-Splunk (S2S) Ingestion Receiver',
    nameFa: 'پورت دریافت داده و لاگ (S2S SplunkTCP)',
    protocol: 'TCP/SSL',
    direction: 'Inbound',
    configFile: 'inputs.conf [splunktcp://9997]',
    descriptionEn: 'High-performance ingestion receiver on Indexers for log pipelines forwarded from Universal/Heavy Forwarders.',
    descriptionFa: 'پورت اصلی دریافت لاگ و داده‌های خام ارسالی از Universal Forwarderها و Heavy Forwarderها به ایندکسرها با قابلیت فشرده‌سازی و TLS.',
    defaultAllowedSources: 'Forwarders, Sensors & Gateway Subnets',
    securityImpact: 'Data Pipeline'
  },
  '9887': {
    port: 9887,
    key: 'replicationPort',
    nameEn: 'Indexer Cluster Bucket Replication',
    nameFa: 'همگام‌سازی و تکثیر باکت‌ها بین ایندکسرها',
    protocol: 'TCP/SSL',
    direction: 'Bidirectional',
    configFile: 'server.conf [clustering] replication_port = 9887',
    descriptionEn: 'Dedicated raw data replication socket among Indexer peer nodes to satisfy Replication Factor (RF) and multi-site redundancy.',
    descriptionFa: 'پورت تبادل و کپی باکت‌های لاگ بین ایندکسرها جهت تامین پایداری و ضریب افزونگی (RF=3) کلاستر در دیتاسنترها.',
    defaultAllowedSources: 'Indexer Cluster Peer Subnet Only',
    securityImpact: 'Cluster Sync'
  },
  '8088': {
    port: 8088,
    key: 'hecPort',
    nameEn: 'HTTP Event Collector (HEC)',
    nameFa: 'کالکتور رویدادهای تحت وب و API (HEC)',
    protocol: 'TCP/SSL',
    direction: 'Inbound',
    configFile: 'inputs.conf [http] port = 8088',
    descriptionEn: 'Token-authenticated REST JSON/raw log ingestion endpoint for microservices, Kubernetes containers, AWS/Azure cloud sinks and SIEM sensors.',
    descriptionFa: 'پورت دریافت لاگ‌های JSON یا Raw از طریق توکن‌های اعتبارسنجی HTTP REST جهت دریافت مستقیم از کانتینرها، اپلیکیشن‌ها و سنسورها.',
    defaultAllowedSources: 'Cloud Integrations, Microservices & Sensor APIs',
    securityImpact: 'Data Pipeline'
  },
  '8181': {
    port: 8181,
    key: 'shcReplicationPort',
    nameEn: 'Search Head Cluster (SHC) Raft Replication',
    nameFa: 'همگام‌سازی جاب‌ها و اجماع کلاستر سرچ‌هد (SHC)',
    protocol: 'TCP/SSL',
    direction: 'Bidirectional',
    configFile: 'server.conf [shclustering] replication_port = 8181',
    descriptionEn: 'Raft consensus & KVStore replication socket among Search Head Cluster members for search artifacts, alerts and knowledge objects.',
    descriptionFa: 'پورت هماهنگی و رونویسی آبجکت‌های سرچ، ذخیره‌ساز KVStore و اجماع Raft میان اعضای کلاستر سرچ‌هد.',
    defaultAllowedSources: 'Search Head Cluster Members Only',
    securityImpact: 'Cluster Sync'
  },
  '514': {
    port: 514,
    key: 'syslogPort',
    nameEn: 'Standard Network Syslog Receiver',
    nameFa: 'پورت دریافت لاگ شبکه (Syslog UDP/TCP)',
    protocol: 'UDP',
    direction: 'Inbound',
    configFile: 'inputs.conf [udp://514]',
    descriptionEn: 'Standard syslog stream listener on Heavy Forwarders / Ingest Nodes for Routers, Switches, Palo Alto / Fortinet Firewalls.',
    descriptionFa: 'دریافت ترافیک لاگ سیسلوگ تجهیزات زیرساخت، فایروال‌ها و سوئیچ‌های شبکه به صورت استاندارد UDP/TCP.',
    defaultAllowedSources: 'Firewalls, Network Switches, Routers',
    securityImpact: 'Data Pipeline'
  },
  '1514': {
    port: 1514,
    key: 'edrSyslogPort',
    nameEn: 'Secure EDR & Wazuh Sensor Port',
    nameFa: 'پورت اختصاصی سنسورهای Wazuh و EDR',
    protocol: 'TCP',
    direction: 'Inbound',
    configFile: 'inputs.conf [tcp://1514]',
    descriptionEn: 'Secure dedicated TCP socket on Heavy Forwarders for host-based intrusion detection (Wazuh HIDS) and endpoint telemetry.',
    descriptionFa: 'پورت اختصاصی دریافت هشدارهای سنسورهای Wazuh EDR و رویدادهای سیستم‌های کلاینت و سرور.',
    defaultAllowedSources: 'Endpoint Subnets & EDR Agents',
    securityImpact: 'Data Pipeline'
  },
  '22': {
    port: 22,
    key: 'sshPort',
    nameEn: 'Linux Secure Shell (SSH) Administration',
    nameFa: 'پورت دسترسی امن خط فرمان سرور (SSH)',
    protocol: 'TCP',
    direction: 'Inbound',
    configFile: '/etc/ssh/sshd_config Port 22',
    descriptionEn: 'System-level command line and Ansible/Redfish deployment channel to manage operating system and Splunkd systemd services.',
    descriptionFa: 'پورت امن مدیریت خط فرمان سیستم‌عامل، اجرای اسکریپت‌های اتوماسیون استقرار و مانیتورینگ سخت‌افزار.',
    defaultAllowedSources: 'SOC Admin Bastion Host / VPN',
    securityImpact: 'Critical Management'
  }
};

export interface OrganizationHardwarePool {
  totalPhysicalServers: number;
  totalCpuCores: number;
  totalRamGB: number;
  totalStorageTB: number;
  datacenterLocations: string[];
}

export const DEFAULT_ORG_HARDWARE_POOL: OrganizationHardwarePool = {
  totalPhysicalServers: 8,
  totalCpuCores: 160,
  totalRamGB: 512,
  totalStorageTB: 32,
  datacenterLocations: ['DC-Primary (Tehran)', 'DC-Secondary (Disaster Recovery)']
};

export interface DeploymentStageStep {
  stage: number;
  role: SplunkNodeRole;
  titleFa: string;
  titleEn: string;
  whyFirstFa: string;
  whyFirstEn: string;
  dependencies: SplunkNodeRole[];
}

export const SPLUNK_DEPLOYMENT_SEQUENCE: DeploymentStageStep[] = [
  {
    stage: 1,
    role: 'license_master',
    titleFa: '۱. لایسنس مستر (License Master / LM)',
    titleEn: '1. License Master (LM)',
    whyFirstFa: 'باید قبل از تمام نودها راه‌اندازی شود تا به محض بالا آمدن سایر سرویس‌ها، سهمیه لاگ به آن‌ها اعطا شود و کلاستر قفل نشود.',
    whyFirstEn: 'Must be configured first so all subsequent nodes can attach to the license pool without violation.',
    dependencies: []
  },
  {
    stage: 2,
    role: 'deployment_server',
    titleFa: '۲. دیپلویمنت سرور (Deployment Server / DS)',
    titleEn: '2. Deployment Server (DS)',
    whyFirstFa: 'مرکز توزیع برنامه‌ها و کانفیگ‌ها به فورواردرها و سایر سرورها است و باید قبل از کلاینت‌ها فعال باشد.',
    whyFirstEn: 'Central application & configuration distributor for Universal and Heavy Forwarders.',
    dependencies: ['license_master']
  },
  {
    stage: 3,
    role: 'cluster_manager',
    titleFa: '۳. کلاستر مستر / منیجر (Cluster Manager / CM)',
    titleEn: '3. Cluster Manager (CM)',
    whyFirstFa: 'مدیریت هماهنگی، سکرت کلاستر (pass4SymmKey) و تعیین ایندکس‌های مجاز را به عهده دارد و ایندکسرها باید به آن رجیستر شوند.',
    whyFirstEn: 'Master coordinator for indexer peers, cluster secrets and site replication rules.',
    dependencies: ['license_master']
  },
  {
    stage: 4,
    role: 'indexer_peer',
    titleFa: '۴. ایندکسرها (Indexer Peers / IDXC)',
    titleEn: '4. Indexer Peers (IDXC)',
    whyFirstFa: 'نودهای ذخیره‌ساز و ایندکس داده که بلافاصله به Cluster Manager و License Master متصل و رجیستر می‌شوند.',
    whyFirstEn: 'Core data indexing and storage cluster nodes registering with the Cluster Manager.',
    dependencies: ['cluster_manager', 'license_master']
  },
  {
    stage: 5,
    role: 'deployer',
    titleFa: '۵. دیپلویر کلاستر سرچ‌هد (SHC Deployer)',
    titleEn: '5. SHC Deployer',
    whyFirstFa: 'پکیج‌های کانفیگ و اپلیکیشن‌های کلاستر سرچ‌هد را در پوشه shcluster/apps نگهداری و پوش می‌کند.',
    whyFirstEn: 'Distributes apps and cluster bundles to Search Head Cluster members.',
    dependencies: ['license_master']
  },
  {
    stage: 6,
    role: 'search_head',
    titleFa: '۶. سرچ‌هدها (Search Heads / SHC)',
    titleEn: '6. Search Heads (SH / SHC)',
    whyFirstFa: 'نودهای جستجو و داشبورد که پس از ایندکسرها به کلاستر ایندکسر وصل شده و توسط Deployer پکیج‌ها را دریافت می‌کنند.',
    whyFirstEn: 'Search execution tier connecting to indexers and initialized by the Deployer.',
    dependencies: ['deployer', 'indexer_peer', 'cluster_manager']
  },
  {
    stage: 7,
    role: 'search_load_balancer',
    titleFa: '۷. لودبالانسر سرچ (Search Load Balancer / VIP)',
    titleEn: '7. Search Load Balancer (LB)',
    whyFirstFa: 'توزیع یکنواخت ترافیک آنالیست‌های SOC روی سرچ‌هدها با قابلیت Sticky Session و SSL Termination.',
    whyFirstEn: 'Evenly distributes web search traffic across healthy Search Heads.',
    dependencies: ['search_head']
  },
  {
    stage: 8,
    role: 'heavy_forwarder',
    titleFa: '۸. هوی فورواردر و دریافت لاگ (Heavy Forwarder / Ingest)',
    titleEn: '8. Heavy Forwarder & Ingest Gateways',
    whyFirstFa: 'آخرین گام؛ پس از پایدار شدن ایندکسرها، ورودی‌های شبکه و سیسلوگ متصل شده و داده‌ها به سمت کلاستر پمپاژ می‌شوند.',
    whyFirstEn: 'Final stage; after storage cluster is healthy, network log streams are opened.',
    dependencies: ['indexer_peer', 'deployment_server']
  }
];

export interface ServerAssetNode {
  id: string;
  hostname: string;
  ip: string;
  lomIp?: string; // IPMI / iLO / iDRAC
  lomType: 'idrac' | 'ilo' | 'ipmi_generic' | 'ssh_root' | 'pxe_boot';
  sshPort: number;
  sshUser: string;
  role: SplunkNodeRole;
  site: string; // 'site1' | 'site2' | 'default'
  cpuCores: number;
  ramGB: number;
  storageNVMeGB: number;
  storageColdTB: number;
  storageFrozenTB?: number;
  osType: 'rhel_9_4' | 'ubuntu_24_04' | 'rocky_9_4' | 'debian_12' | 'oracle_linux_9' | 'suse_15';
  status: 'pending_access' | 'discovered' | 'os_installing' | 'os_ready' | 'hardening_in_progress' | 'hardened' | 'container_installing' | 'container_engine_ready' | 'splunk_installing' | 'splunk_running' | 'degraded';
  lifecycleStage?: 'discovered' | 'os_installing' | 'os_ready' | 'hardening_in_progress' | 'hardened' | 'container_installing' | 'container_ready' | 'splunk_installing' | 'splunk_running' | 'cluster_attached' | 'fully_configured';
  installProgress: number;
  isConfigured?: boolean;
  // Hardware Discovery Information
  discoveryInfo?: {
    vendor: string;
    model: string;
    macAddress: string;
    discoveredSubnet: string;
    mgmtAgentPort: number;
    mgmtConnected: boolean;
    mgmtToken?: string;
    discoveredAt: string;
  };
  // Parallel Live Task State
  parallelTask?: {
    taskName: string;
    taskStage: 'os' | 'hardening' | 'container' | 'splunk' | 'role_config' | 'idle';
    taskProgress: number;
    taskStatus: 'idle' | 'running' | 'success' | 'failed';
    taskLogs: string[];
    startedAt?: string;
  };
  // Splunk Version
  splunkVersion?: '9.4.0' | '9.3.2' | '9.2.1' | '9.1.4' | 'es_7_3';
  // Selected Hardening Checkbox Options
  selectedHardeningChecklist?: {
    thpDisabled: boolean;
    sysctlTuned: boolean;
    limitsConfigured: boolean;
    nonRootUserCreated: boolean;
    firewallConfigured: boolean;
    selinuxEnforced: boolean;
    mtlsCertGenerated: boolean;
    auditdPolicy: boolean;
    disableUsbStorage: boolean;
  };
  // OS Installation Config
  osInstallConfig?: {
    osId: string;
    filesystem: 'xfs' | 'ext4' | 'btrfs';
    mountPoint: string;
  };
  // Container Engine Config
  containerEngineConfig?: {
    engine: DeploymentTargetEngine;
  };
  assignedPorts: {
    splunkWeb?: number;
    splunkMgmt?: number;
    splunkTcp?: number;
    hecPort?: number;
    replicationPort?: number;
    shcReplicationPort?: number;
    loadBalancerPort?: number;
    syslogPort?: number;
    edrSyslogPort?: number;
    sshPort?: number;
    mgmtAgentPort?: number;
  };
  bucketPaths?: {
    hotWarmPath?: string;
    coldPath?: string;
    frozenPath?: string;
  };
  customConfigs?: {
    licenseMaster?: {
      licensePoolMB: number;
      licenseFilePath?: string;
      warningThreshold: number;
      hardViolationDays: number;
    };
    deploymentServer?: {
      phoneHomeIntervalSec: number;
      serverclasses: string[];
      deploymentAppsPath: string;
    };
    deployer?: {
      pass4SymmKey: string;
      shclusterAppsPath: string;
      captainVotingNodesCount: number;
      autoBundlePush: boolean;
    };
    clusterManager?: {
      pass4SymmKey: string;
      replicationFactor: number;
      searchFactor: number;
      siteReplicationFactor: string;
      siteSearchFactor: string;
      maintenanceMode: boolean;
    };
    indexer?: {
      maxTotalDataSizeMB: number;
      maxWarmDBCount: number;
      frozenTimePeriodInSecs: number;
      enableSmartStore: boolean;
    };
    searchHead?: {
      maxConcurrentSearches: number;
      kvstorePort: number;
      dispatchDir: string;
    };
    loadBalancer?: {
      vipIp: string;
      vipPort: number;
      algorithm: 'ip_hash' | 'round_robin' | 'least_conn';
      sslCertificate: string;
      healthCheckIntervalSec: number;
    };
    heavyForwarder?: {
      syslogUdpPort: number;
      syslogTcpPort: number;
      hecPort: number;
      autoLBIntervalSec: number;
      piiMaskingEnabled: boolean;
    };
  };
  hardeningReport?: {
    thpDisabled: boolean;
    sysctlTuned: boolean;
    limitsConfigured: boolean;
    nonRootUserCreated: boolean;
    firewallConfigured: boolean;
    selinuxEnforced: boolean;
    mtlsCertGenerated: boolean;
    auditdPolicy?: boolean;
    disableUsbStorage?: boolean;
  };
}

export interface SizingLOMInputs {
  dailyVolumeGB: number;
  // Bucket Retention Lifecycle (Days)
  hotWarmRetentionDays: number;
  coldRetentionDays: number;
  frozenRetentionDays: number;
  // Search & SOC Team
  searchUsers: number;
  socAnalysts: SocAnalyst[];
  realTimeDashboardsCount: number;
  adHocSearchesPerHour: number;
  // Clustering Parameters
  replicationFactor: number; // RF (e.g. 2 or 3)
  searchFactor: number; // SF (e.g. 2 or 3)
  isMultiSite: boolean;
  sitesCount: number;
  availabilityTier: 'mission_critical_c11' | 'high_availability_c3' | 'standalone_s1';
  // Storage & Disk Type Selection
  hotWarmDiskType: StorageBucketLifecycle['hotWarmDiskType'];
  coldDiskType: StorageBucketLifecycle['coldDiskType'];
  frozenStorageType: StorageBucketLifecycle['frozenStorageType'];
  smartStoreEnabled: boolean;
  s3BucketEndpoint?: string;
  // Load Balancer for Search Heads
  searchLoadBalancer: SearchLoadBalancerConfig;
  // Pricing & Licensing
  licensePricingModel: LicenseCostEstimation['pricingModel'];
  licenseSupportLevel: LicenseCostEstimation['supportLevel'];
}

export interface CalculatedSizingResult {
  recommendedIndexers: number;
  recommendedSearchHeads: number;
  recommendedHeavyForwarders: number;
  recommendedClusterManagers: number;
  recommendedManagementNodes: number; // Deployer / LM
  recommendedSearchLoadBalancers: number;
  isSearchLoadBalancerRecommended: boolean;
  // Bucket Lifecycle Volumes
  hotWarmStorageTB: number;
  coldStorageTB: number;
  frozenStorageTB: number;
  totalStorageWithoutFrozenTB: number;
  totalWithFrozenStorageTB: number;
  rawStorageWithoutCompressionTB: number;
  dailyIngestRateMBs: number;
  // Per-Node Spec Minimums
  minCpuPerIndexer: number;
  minRamPerIndexer: number;
  minIopsPerIndexer: number;
  minCpuPerSearchHead: number;
  minRamPerSearchHead: number;
  // Search Concurrency Analysis
  totalMaxConcurrentSearches: number;
  estimatedConcurrentSearchLoad: number;
  isSearchHeadClusterRequired: boolean;
  // Storage Paths
  hotWarmPath: string;
  coldPath: string;
  frozenPath: string;
  // License Cost & TCO
  licenseCost: LicenseCostEstimation;
  svaCategory: string;
  svaTopologyName: string;
}

// Full Sizing calculation formula according to Splunk SVA (Splunk Validated Architectures) & Capacity Planning Manual
export function calculateSplunkSizing(inputs: SizingLOMInputs): CalculatedSizingResult {
  const dailyGB = Math.max(10, inputs.dailyVolumeGB);
  const hotWarmDays = Math.max(1, inputs.hotWarmRetentionDays || 30);
  const coldDays = Math.max(0, inputs.coldRetentionDays || 90);
  const frozenDays = Math.max(0, inputs.frozenRetentionDays || 365);
  const rf = Math.max(1, inputs.replicationFactor || 2);
  const sf = Math.max(1, inputs.searchFactor || 2);

  // Splunk indexer benchmark: 1 Reference Indexer (12-16 cores, 32-64GB RAM, 1200 IOPS) can index ~150-250 GB/Day with standard searches
  const gbPerIndexer = dailyGB > 1000 ? 250 : 150;
  let rawIndexers = Math.ceil(dailyGB / gbPerIndexer);

  // Multi-site redundancy multiplier
  if (inputs.isMultiSite && inputs.sitesCount > 1) {
    rawIndexers = Math.max(rawIndexers * inputs.sitesCount, inputs.sitesCount * 2);
  }

  // Ensure minimum for clustering RF/SF
  const recommendedIndexers = Math.max(rawIndexers, rf + 1, inputs.isMultiSite ? 4 : 2);

  // Search Head Sizing calculation:
  // Each Search Head can handle: max_hist_searches = max_searches_per_cpu * (cpu_cores - 1) + base_max_searches
  // Default: 1 SH (16 cores) handles ~20-24 concurrent searches or 8-10 active analysts with real-time dashboards
  const analystCount = Math.max(1, inputs.socAnalysts?.length || inputs.searchUsers || 1);
  const totalDashboardSearches = (inputs.realTimeDashboardsCount || 3) * 2; // ~2 searches per dashboard panel
  const totalAdHocSearches = Math.ceil((inputs.adHocSearchesPerHour || 20) / 10);
  const estimatedConcurrentSearchLoad = analystCount * 2 + totalDashboardSearches + totalAdHocSearches;

  let recommendedSearchHeads = Math.ceil(estimatedConcurrentSearchLoad / 18);
  const isSearchHeadClusterRequired = inputs.availabilityTier === 'mission_critical_c11' || recommendedSearchHeads >= 2 || analystCount >= 6;
  
  if (isSearchHeadClusterRequired) {
    recommendedSearchHeads = Math.max(recommendedSearchHeads, 3); // Minimum 3 nodes for Raft Quorum in SHC
  } else {
    recommendedSearchHeads = Math.max(1, recommendedSearchHeads);
  }

  // Search Load Balancer is strongly recommended when SHC has >= 2 nodes or analysts >= 5
  const isSearchLoadBalancerRecommended = recommendedSearchHeads >= 2 || analystCount >= 5;
  const recommendedSearchLoadBalancers = isSearchLoadBalancerRecommended ? 1 : 0;

  // Heavy Forwarders: 1 HF per 250-400 GB/day of parsing & filtering
  const recommendedHeavyForwarders = Math.max(1, Math.ceil(dailyGB / 350));

  // Storage Sizing Calculations:
  // Compressed raw data in Splunk is ~50% of original ingest volume (0.5 * DailyGB)
  // Index metadata (tsidx) adds ~35% -> Total daily indexed volume = ~0.85 * DailyGB
  // Hot/Warm Storage (NVMe SSD): (DailyGB * 0.5 * RF) * hotWarmDays
  const dailyHotWarmRawGB = dailyGB * 0.5 * rf;
  const hotWarmStorageTB = Number(((dailyHotWarmRawGB * hotWarmDays) / 1024).toFixed(2));

  // Cold Storage (SAS HDD): (DailyGB * 0.5 * (SmartStore ? 1 : RF)) * coldDays
  const coldMultiplier = inputs.smartStoreEnabled ? 1 : rf;
  const coldStorageTB = Number(((dailyGB * 0.5 * coldMultiplier * coldDays) / 1024).toFixed(2));

  // Frozen Archive Storage (Object Storage / NAS / Tape):
  // Frozen buckets drop tsidx files and keep only compressed journal data without RF replication
  const frozenStorageTB = Number(((dailyGB * 0.5 * 1.0 * frozenDays) / 1024).toFixed(2));

  const totalStorageWithoutFrozenTB = Number((hotWarmStorageTB + coldStorageTB).toFixed(2));
  const totalWithFrozenStorageTB = Number((hotWarmStorageTB + coldStorageTB + frozenStorageTB).toFixed(2));
  const rawStorageWithoutCompressionTB = Number(((dailyGB * (hotWarmDays + coldDays + frozenDays)) / 1024).toFixed(2));

  const dailyIngestRateMBs = Number((dailyGB / 86.4).toFixed(2));

  // Splunk Enterprise Term License Pricing Model (Standard List Pricing with Volume Discount Tiers):
  // 1-100 GB/day: ~$1,800 / GB/year
  // 101-500 GB/day: ~$1,200 / GB/year
  // 501-1000 GB/day: ~$850 / GB/year
  // 1000+ GB/day: ~$650 / GB/year
  let costPerGBYearUSD = 1800;
  if (dailyGB > 1000) {
    costPerGBYearUSD = 650;
  } else if (dailyGB > 500) {
    costPerGBYearUSD = 850;
  } else if (dailyGB > 100) {
    costPerGBYearUSD = 1200;
  }

  const estimatedAnnualLicenseUSD = Math.round(dailyGB * costPerGBYearUSD);
  const supportRate = inputs.licenseSupportLevel === 'Enterprise Premium with Dedicated TAM' ? 0.22 : 0.15;
  const supportCostAnnualUSD = Math.round(estimatedAnnualLicenseUSD * supportRate);

  // Hardware & Storage Capex Estimation:
  const serverCostEst = (recommendedIndexers * 8500) + (recommendedSearchHeads * 6500) + (recommendedHeavyForwarders * 4000) + 5000;
  const nvmeCostEst = hotWarmStorageTB * 220; // ~$220 per TB Enterprise NVMe
  const hddCostEst = coldStorageTB * 65; // ~$65 per TB SAS 10K HDD
  const frozenCostEst = frozenStorageTB * 20; // ~$20 per TB Object Storage
  const estimatedHardwareCapexUSD = Math.round(serverCostEst);
  const estimatedStorageCapexUSD = Math.round(nvmeCostEst + hddCostEst + frozenCostEst);

  const estimated3YearTcoUSD = Math.round(
    (estimatedAnnualLicenseUSD + supportCostAnnualUSD) * 3 + estimatedHardwareCapexUSD + estimatedStorageCapexUSD
  );

  const licenseCost: LicenseCostEstimation = {
    dailyIngestGB: dailyGB,
    pricingModel: inputs.licensePricingModel || 'term_ingest',
    estimatedAnnualLicenseUSD,
    costPerGBYearUSD,
    supportLevel: inputs.licenseSupportLevel || 'Enterprise Standard 24x7',
    supportCostAnnualUSD,
    estimatedHardwareCapexUSD,
    estimatedStorageCapexUSD,
    estimated3YearTcoUSD
  };

  let svaCategory = 'C11';
  let svaTopologyName = 'Multi-Site Clustered Deployment with Shared Services';

  if (inputs.availabilityTier === 'standalone_s1') {
    svaCategory = 'S1';
    svaTopologyName = 'Single-Server Distributed Hybrid';
  } else if (inputs.availabilityTier === 'high_availability_c3') {
    svaCategory = 'C3';
    svaTopologyName = 'Single-Site Indexer Cluster with Clustered Search Heads';
  }

  return {
    recommendedIndexers,
    recommendedSearchHeads,
    recommendedHeavyForwarders,
    recommendedClusterManagers: inputs.isMultiSite ? 2 : 1,
    recommendedManagementNodes: 1,
    recommendedSearchLoadBalancers,
    isSearchLoadBalancerRecommended,
    hotWarmStorageTB,
    coldStorageTB,
    frozenStorageTB,
    totalStorageWithoutFrozenTB,
    totalWithFrozenStorageTB,
    rawStorageWithoutCompressionTB,
    dailyIngestRateMBs,
    minCpuPerIndexer: dailyGB > 500 ? 16 : 12,
    minRamPerIndexer: dailyGB > 500 ? 64 : 32,
    minIopsPerIndexer: 1200,
    minCpuPerSearchHead: 16,
    minRamPerSearchHead: 32,
    totalMaxConcurrentSearches: recommendedSearchHeads * 22,
    estimatedConcurrentSearchLoad,
    isSearchHeadClusterRequired,
    hotWarmPath: '/opt/splunk/var/lib/splunk/defaultdb/db',
    coldPath: '/opt/splunk/var/lib/splunk/defaultdb/colddb',
    frozenPath: inputs.smartStoreEnabled ? 's3://splunk-smartstore-cold/frozendb' : '/opt/splunk/var/lib/splunk/defaultdb/frozendb',
    licenseCost,
    svaCategory,
    svaTopologyName
  };
}

export const DEFAULT_SOC_ANALYSTS: SocAnalyst[] = [
  {
    id: 'soc-1',
    name: 'مهندس حسینی (Senior SOC Lead)',
    role: 'SOC Manager / Lead',
    concurrentSearchesQuota: 6,
    activeDashboards: 4
  },
  {
    id: 'soc-2',
    name: 'مهندس رضایی (Threat Hunter)',
    role: 'Senior Threat Hunter',
    concurrentSearchesQuota: 5,
    activeDashboards: 2
  },
  {
    id: 'soc-3',
    name: 'کارشناس محمدی (Incident Responder)',
    role: 'SOC Tier 2 / Incident Responder',
    concurrentSearchesQuota: 4,
    activeDashboards: 3
  },
  {
    id: 'soc-4',
    name: 'کارشناس احمدی (SOC Tier 1)',
    role: 'SOC Tier 1 Analyst',
    concurrentSearchesQuota: 3,
    activeDashboards: 2
  }
];

export const DEFAULT_SEARCH_LOAD_BALANCER: SearchLoadBalancerConfig = {
  enabled: true,
  type: 'nginx',
  vipIp: '192.168.10.30',
  vipHostname: 'splunk-sh-vip.soc.local',
  port: 8000,
  sslOffloading: true,
  algorithm: 'ip_hash_sticky'
};

// Initial Default Cluster Assets Architecture Topology
export const INITIAL_SERVER_ASSETS: ServerAssetNode[] = [
  {
    id: 'node-lm-01',
    hostname: 'splunk-lm-01.soc.local',
    ip: '192.168.10.11',
    lomIp: '192.168.100.11',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'license_master',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 200,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    isConfigured: true,
    assignedPorts: {
      splunkWeb: 8000,
      splunkMgmt: 8089,
    },
    customConfigs: {
      licenseMaster: {
        licensePoolMB: 250000,
        warningThreshold: 3,
        hardViolationDays: 5,
      }
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-ds-01',
    hostname: 'splunk-ds-01.soc.local',
    ip: '192.168.10.12',
    lomIp: '192.168.100.12',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'deployment_server',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 250,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    isConfigured: true,
    assignedPorts: {
      splunkWeb: 8000,
      splunkMgmt: 8089,
    },
    customConfigs: {
      deploymentServer: {
        phoneHomeIntervalSec: 60,
        serverclasses: ['all_universal_forwarders', 'linux_security_inputs', 'windows_ad_inputs'],
        deploymentAppsPath: '/opt/splunk/etc/deployment-apps'
      }
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-deployer-01',
    hostname: 'splunk-shc-deployer-01.soc.local',
    ip: '192.168.10.13',
    lomIp: '192.168.100.13',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'deployer',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 200,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    isConfigured: true,
    assignedPorts: {
      splunkWeb: 8000,
      splunkMgmt: 8089,
    },
    customConfigs: {
      deployer: {
        pass4SymmKey: 'SplunkSecretClusterPass@2026',
        shclusterAppsPath: '/opt/splunk/etc/shcluster/apps',
        captainVotingNodesCount: 3,
        autoBundlePush: true
      }
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-lb-01',
    hostname: 'splunk-sh-vip.soc.local',
    ip: '192.168.10.30',
    lomIp: '192.168.100.30',
    lomType: 'ssh_root',
    sshPort: 22,
    sshUser: 'root',
    role: 'search_load_balancer',
    site: 'site1',
    cpuCores: 4,
    ramGB: 8,
    storageNVMeGB: 100,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      loadBalancerPort: 8000,
      splunkWeb: 8000
    },
    customConfigs: {
      loadBalancer: {
        vipIp: '192.168.10.30',
        vipPort: 8000,
        algorithm: 'ip_hash',
        sslCertificate: '/etc/ssl/certs/splunk-wildcard-soc.crt',
        healthCheckIntervalSec: 5
      }
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-cm-01',
    hostname: 'splunk-cm-01.soc.local',
    ip: '192.168.10.10',
    lomIp: '192.168.100.10',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'cluster_manager',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 200,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkWeb: 8000,
      splunkMgmt: 8089,
    },
    customConfigs: {
      clusterManager: {
        pass4SymmKey: 'SplunkIndexerClusterPass@2026',
        replicationFactor: 3,
        searchFactor: 2,
        siteReplicationFactor: 'origin:2, total:3',
        siteSearchFactor: 'origin:1, total:2',
        maintenanceMode: false
      }
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-idx-01',
    hostname: 'splunk-idx-01.soc.local',
    ip: '192.168.10.21',
    lomIp: '192.168.100.21',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site1',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 4,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887,
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-idx-02',
    hostname: 'splunk-idx-02.soc.local',
    ip: '192.168.10.22',
    lomIp: '192.168.100.22',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site1',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 4,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887,
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-idx-03',
    hostname: 'splunk-idx-03.soc.local',
    ip: '192.168.10.23',
    lomIp: '192.168.100.23',
    lomType: 'ipmi_generic',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site2',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 4,
    osType: 'ubuntu_24_04',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887,
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-sh-01',
    hostname: 'splunk-sh-01.soc.local',
    ip: '192.168.10.31',
    lomIp: '192.168.100.31',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'search_head',
    site: 'site1',
    cpuCores: 16,
    ramGB: 32,
    storageNVMeGB: 500,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkWeb: 8000,
      splunkMgmt: 8089,
      shcReplicationPort: 8181,
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  },
  {
    id: 'node-hf-01',
    hostname: 'splunk-hf-01.soc.local',
    ip: '192.168.10.41',
    lomIp: '192.168.100.41',
    lomType: 'ssh_root',
    sshPort: 22,
    sshUser: 'root',
    role: 'heavy_forwarder',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 200,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'splunk_running',
    installProgress: 100,
    assignedPorts: {
      splunkMgmt: 8089,
      hecPort: 8088,
    },
    hardeningReport: {
      thpDisabled: true,
      sysctlTuned: true,
      limitsConfigured: true,
      nonRootUserCreated: true,
      firewallConfigured: true,
      selinuxEnforced: true,
      mtlsCertGenerated: true,
    }
  }
];

// OS Templates and Cloud-Init / Kickstart generators
export const OS_DISTRIBUTIONS = [
  {
    id: 'rhel_9_4',
    name: 'Red Hat Enterprise Linux (RHEL 9.4)',
    kernel: 'Linux 5.14.0-427 / 6.x Tier-1 Enterprise',
    badge: 'Production Standard #1',
    recommended: true,
    packageManager: 'dnf',
    securityBenchmark: 'CIS RHEL 9 Benchmark Level 2',
    icon: 'redhat',
    defaultFs: 'xfs'
  },
  {
    id: 'rocky_9_4',
    name: 'Rocky Linux 9.4 (100% RHEL Binary Compatible)',
    kernel: 'Linux 5.14.0 Enterprise',
    badge: 'Enterprise Open-Source',
    recommended: true,
    packageManager: 'dnf',
    securityBenchmark: 'CIS RHEL 9 Hardening',
    icon: 'rocky',
    defaultFs: 'xfs'
  },
  {
    id: 'ubuntu_24_04',
    name: 'Ubuntu Server 24.04 LTS (Noble Numbat)',
    kernel: 'Linux 6.8.0 HWE Enterprise',
    badge: 'Modern Cloud & K8s',
    recommended: true,
    packageManager: 'apt',
    securityBenchmark: 'CIS Ubuntu 24.04 Benchmark',
    icon: 'ubuntu',
    defaultFs: 'ext4'
  },
  {
    id: 'oracle_linux_9',
    name: 'Oracle Linux 9.4 (Unbreakable Enterprise Kernel - UEK)',
    kernel: 'Linux 5.15 UEK Release 7',
    badge: 'High-I/O DB & Storage',
    recommended: false,
    packageManager: 'dnf',
    securityBenchmark: 'CIS Oracle Linux 9',
    icon: 'oracle',
    defaultFs: 'xfs'
  },
  {
    id: 'debian_12',
    name: 'Debian 12 Bookworm (Minimal Stable)',
    kernel: 'Linux 6.1 LTS Kernel',
    badge: 'Ultra-Lightweight & Stable',
    recommended: false,
    packageManager: 'apt',
    securityBenchmark: 'CIS Debian 12 Hardening',
    icon: 'debian',
    defaultFs: 'ext4'
  },
  {
    id: 'suse_15',
    name: 'SUSE Linux Enterprise Server 15 SP5 (SLES)',
    kernel: 'Linux 5.14.21 SUSE Enterprise',
    badge: 'Mission-Critical Cluster',
    recommended: false,
    packageManager: 'zypper',
    securityBenchmark: 'CIS SLES 15 Benchmark',
    icon: 'suse',
    defaultFs: 'btrfs'
  }
];

// Enterprise Security Hardening Items with Toggleable Checkboxes
export interface HardeningItemDefinition {
  id: keyof NonNullable<ServerAssetNode['selectedHardeningChecklist']>;
  titleFa: string;
  titleEn: string;
  category: 'kernel' | 'security_access' | 'network_firewall' | 'audit_compliance';
  descriptionFa: string;
  descriptionEn: string;
  securityImpactFa: string;
  recommended: boolean;
  cliPreview: string;
}

export const ENTERPRISE_HARDENING_ITEMS: HardeningItemDefinition[] = [
  {
    id: 'thpDisabled',
    titleFa: 'غیرفعال‌سازی Transparent Huge Pages (THP)',
    titleEn: 'Disable Transparent Huge Pages (THP)',
    category: 'kernel',
    descriptionFa: 'غیرفعال کردن کامل THP در GRUB و پیکربندی tuned-adm برای جلوگیری از قفل شدن صف‌های ایندکسینگ و کاهش ۹۵٪ Latency دیسک.',
    descriptionEn: 'Completely disables THP via GRUB cmdline and tuned profile to eliminate memory fragmentation and lockups.',
    securityImpactFa: 'بسیار حیاتی برای پایداری پردازش Splunkd و جلوگیری از OOM-Killer',
    recommended: true,
    cliPreview: `echo "never" > /sys/kernel/mm/transparent_hugepage/enabled\necho "never" > /sys/kernel/mm/transparent_hugepage/defrag\ngrubby --update-kernel=ALL --args="transparent_hugepage=never"`
  },
  {
    id: 'sysctlTuned',
    titleFa: 'تیونینگ پارامترهای کرنل در /etc/sysctl.conf',
    titleEn: 'Linux Kernel sysctl.conf Performance Tuning',
    category: 'kernel',
    descriptionFa: 'تنظیم vm.max_map_count=262144، vm.swappiness=1، net.core.somaxconn=1024 و افزایش بافرهای TCP (tcp_rmem / tcp_wmem).',
    descriptionEn: 'Tunes memory swapping behavior, connection backlogs and socket buffer allocations.',
    securityImpactFa: 'تضمین ظرفیت بالای سوکت‌های شبکه برای دریافت هزاران جریان لاگ در ثانیه',
    recommended: true,
    cliPreview: `cat << 'EOF' >> /etc/sysctl.d/99-splunk.conf\nvm.max_map_count = 262144\nvm.swappiness = 1\nnet.core.somaxconn = 1024\nnet.ipv4.tcp_max_syn_backlog = 4096\nEOF\nsysctl -p /etc/sysctl.d/99-splunk.conf`
  },
  {
    id: 'limitsConfigured',
    titleFa: 'تنظیم حداکثر فایل‌ها و پروسس‌ها در /etc/security/limits.conf',
    titleEn: 'File Descriptor (nofile) & Process (nproc) ulimits',
    category: 'kernel',
    descriptionFa: 'افزایش سقف File Descriptor به 65535 و nproc به 20480 برای کاربر splunk جهت جلوگیری از خطای Too Many Open Files.',
    descriptionEn: 'Sets hard/soft limits for splunk user to handle massive parallel bucket descriptors.',
    securityImpactFa: 'جلوگیری از قطع شدن جاب‌های سرچ سنگین و بسته شدن پورت‌های Ingest',
    recommended: true,
    cliPreview: `cat << 'EOF' >> /etc/security/limits.d/99-splunk.conf\nsplunk soft nofile 65535\nsplunk hard nofile 65535\nsplunk soft nproc 20480\nsplunk hard nproc 20480\nEOF`
  },
  {
    id: 'nonRootUserCreated',
    titleFa: 'ایجاد کاربر ایزوله سیستمی و مسدودسازی ورود روت با SSH',
    titleEn: 'Dedicated splunk:splunk user & Disable Root Password SSH',
    category: 'security_access',
    descriptionFa: 'ایجاد کاربر بدون پوسته تعاملی با دسترسی محدود، مالکیت کامل پوشه /opt/splunk و غیرفعال‌سازی PermitRootLogin در sshd.',
    descriptionEn: 'Enforces principle of least privilege, preventing service tampering and privilege escalation.',
    securityImpactFa: 'انطباق ۱۰۰٪ با الزامات امنیت شبکه پدافند و CIS Level 2',
    recommended: true,
    cliPreview: `useradd -m -r -s /bin/bash -c "Splunk Enterprise Service User" splunk\nsed -i 's/^PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config\nsystemctl reload sshd`
  },
  {
    id: 'firewallConfigured',
    titleFa: 'پیکربندی فایروال محلی (Firewalld / UFW) بر اساس پورت‌های نقش',
    titleEn: 'Local Firewall Isolation (Firewalld / UFW Zones)',
    category: 'network_firewall',
    descriptionFa: 'مسدودسازی تمام پورت‌های ورودی غیرضروری و باز کردن فقط پورت‌های اختصاصی نقش این سرور (پورت‌های 8000، 8089، 9997، 9887، 9443).',
    descriptionEn: 'Applies strict per-role firewall whitelisting denying all unapproved inbound probes.',
    securityImpactFa: 'ایزولاسیون کامل لایه انتقال ترافیک و محافظت در برابر اسکن‌های ناشناس',
    recommended: true,
    cliPreview: `firewall-cmd --permanent --zone=public --add-port=9443/tcp\nfirewall-cmd --permanent --zone=public --add-port=8089/tcp\nfirewall-cmd --permanent --zone=public --add-port=9997/tcp\nfirewall-cmd --reload`
  },
  {
    id: 'selinuxEnforced',
    titleFa: 'فعال‌سازی SELinux در حالت Enforcing با کانتکست‌های مجاز Splunk',
    titleEn: 'SELinux Enforcing with Custom Splunk Contexts',
    category: 'security_access',
    descriptionFa: 'قرار دادن SELinux در وضعیت سخت‌گیرانه Enforcing و تنظیم مجدد کانتکست‌های امنیتی مسیر /opt/splunk با دستور semanage.',
    descriptionEn: 'Enforces Mandatory Access Control (MAC) policies on all Splunk binaries and data paths.',
    securityImpactFa: 'جلوگیری از نفوذ و اجرای کدهای مخرب در صورت اکسپلویت احتمالی سرویس‌ها',
    recommended: true,
    cliPreview: `setenforce 1\nsed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config\nsemanage fcontext -a -t usr_t "/opt/splunk/bin(/.*)?"\nrestorecon -Rv /opt/splunk`
  },
  {
    id: 'mtlsCertGenerated',
    titleFa: 'صدور و فعال‌سازی گواهی‌های رمزنگاری دوطرفه TLS 1.3 mTLS (4096-bit)',
    titleEn: 'Mutual TLS 1.3 Encryption & Internal CA Mesh (4096-bit RSA)',
    category: 'security_access',
    descriptionFa: 'تولید کلیدهای ۴۰۹۶ بیتی با رمزنگاری TLS 1.3 و احراز هویت دوطرفه (mTLS) برای پورت مدیریت ۸۰۸۹، ایندکسینگ ۹۹۹۷ و کلاستر ۹۸۸۷.',
    descriptionEn: 'Generates hardened PKI certificates for encrypted inter-node communications.',
    securityImpactFa: 'جلوگیری از حملات Man-in-the-Middle و شنود ترافیک لاگ‌ها در شبکه',
    recommended: true,
    cliPreview: `openssl req -new -x509 -days 3650 -nodes -newkey rsa:4096 -out /opt/splunk/etc/auth/splunk-root-ca.pem\nchown -R splunk:splunk /opt/splunk/etc/auth/`
  },
  {
    id: 'auditdPolicy',
    titleFa: 'فعال‌سازی لاگ‌برداری رویدادهای سیستمی با قوانین auditd (CIS Level 2)',
    titleEn: 'Linux auditd Kernel Audit Trail (CIS Benchmark Level 2)',
    category: 'audit_compliance',
    descriptionFa: 'ثبت تمام تغییرات فایل‌های کانفیگ `/opt/splunk/etc` و اجرای دستورات کاربر روت توسط دیمن auditd.',
    descriptionEn: 'Logs all configuration modifications and privilege escalation attempts.',
    securityImpactFa: 'انطباق با ممیزی‌های رسمی امنیت اطلاعات و مانیتورینگ تغییرات کانفیگ',
    recommended: true,
    cliPreview: `echo "-w /opt/splunk/etc -p wa -k splunk_config_change" >> /etc/audit/rules.d/splunk.rules\naugenrules --load`
  },
  {
    id: 'disableUsbStorage',
    titleFa: 'مسدودسازی اتصال حافظه‌های جانبی USB و ماژول‌های پرخطر هسته',
    titleEn: 'Disable USB Mass Storage & Unused Kernel Filesystems',
    category: 'security_access',
    descriptionFa: 'غیرفعال کردن درایور usb-storage، cramfs، freevxfs و firewire جهت جلوگیری از نشت فیزیکی داده‌ها در اتاق سرور.',
    descriptionEn: 'Blacklists usb-storage and uncommon filesystem drivers in modprobe.',
    securityImpactFa: 'محافظت از داده‌های خام SOC در برابر سرقت فیزیکی از طریق فلش‌مموری',
    recommended: false,
    cliPreview: `echo "install usb-storage /bin/true" > /etc/modprobe.d/disable-usb.conf\nrmmod usb_storage 2>/dev/null || true`
  }
];

// Available Splunk Enterprise Versions
export interface SplunkVersionItem {
  version: string;
  releaseTitle: string;
  badge: string;
  badgeColor: string;
  isLTS: boolean;
  releaseYear: string;
  packageUrl: string;
  sizeMB: number;
  sha512: string;
  notesFa: string;
}

export const SPLUNK_ENTERPRISE_VERSIONS: SplunkVersionItem[] = [
  {
    version: '9.4.0',
    releaseTitle: 'Splunk Enterprise 9.4.0 (Latest Enterprise Release)',
    badge: 'پیشنهادی - نسل جدید SmartStore و بهینه‌سازی AI',
    badgeColor: 'emerald',
    isLTS: false,
    releaseYear: '2025/2026',
    packageUrl: 'https://download.splunk.com/products/splunk/releases/9.4.0/linux/splunk-9.4.0-linux-2.6-x86_64.rpm',
    sizeMB: 580,
    sha512: 'e4d8a1c9b2f70359871fae88d12356c9a8b1...940',
    notesFa: 'بهینه‌سازی تا ۳۰٪ سرعت سرچ‌های سنگین، پشتیبانی بومی از SmartStore S3 Object Storage و افزایش راندمان KVStore.'
  },
  {
    version: '9.3.2',
    releaseTitle: 'Splunk Enterprise 9.3.2 (Long Term Support - LTS)',
    badge: 'پایدار سازمانی (LTS Standard)',
    badgeColor: 'cyan',
    isLTS: true,
    releaseYear: '2024',
    packageUrl: 'https://download.splunk.com/products/splunk/releases/9.3.2/linux/splunk-9.3.2-linux-2.6-x86_64.rpm',
    sizeMB: 565,
    sha512: 'c7b5f1a9d8e20349871fae88d12356c9a8b1...932',
    notesFa: 'پشتیبانی طولانی‌مدت، حداکثر هماهنگی با اپلیکیشن‌های سازمانی و افزونه‌های امنیتی SOC.'
  },
  {
    version: '9.2.1',
    releaseTitle: 'Splunk Enterprise 9.2.1 (Enterprise Production)',
    badge: 'پایدار و تست‌شده در دیتاسنترها',
    badgeColor: 'blue',
    isLTS: false,
    releaseYear: '2024',
    packageUrl: 'https://download.splunk.com/products/splunk/releases/9.2.1/linux/splunk-9.2.1-linux-2.6-x86_64.rpm',
    sizeMB: 540,
    sha512: 'a1b2c3d4e5f60349871fae88d12356c9a8b1...921',
    notesFa: 'مورد استفاده در محیط‌های سنتی با سازگاری کامل با سیستم‌عامل‌های RHEL 8/9 و Ubuntu 22/24.'
  },
  {
    version: '9.1.4',
    releaseTitle: 'Splunk Enterprise 9.1.4 (Legacy Migration Tier)',
    badge: 'مخصوص مهاجرت زیرساخت‌های قدیمی',
    badgeColor: 'amber',
    isLTS: false,
    releaseYear: '2023',
    packageUrl: 'https://download.splunk.com/products/splunk/releases/9.1.4/linux/splunk-9.1.4-linux-2.6-x86_64.rpm',
    sizeMB: 510,
    sha512: 'f9e8d7c6b5a40349871fae88d12356c9a8b1...914',
    notesFa: 'مناسب برای کلاسترهایی که در حال گذر به نسخه‌های سری ۹.۴ هستند.'
  }
];

// Discovered Initial Fleet of 10 Physical / Virtual Systems
export const DISCOVERED_INITIAL_FLEET: ServerAssetNode[] = [
  {
    id: 'node-disc-01',
    hostname: 'srv-poweredge-01.soc.local',
    ip: '192.168.10.11',
    lomIp: '192.168.100.11',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'license_master',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 250,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Dell Inc.',
      model: 'PowerEdge R650 Rack Server',
      macAddress: '00:1E:67:8A:2B:11',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-11',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089
    }
  },
  {
    id: 'node-disc-02',
    hostname: 'srv-poweredge-02.soc.local',
    ip: '192.168.10.12',
    lomIp: '192.168.100.12',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'deployment_server',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 300,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Dell Inc.',
      model: 'PowerEdge R650 Rack Server',
      macAddress: '00:1E:67:8A:2B:12',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-12',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089
    }
  },
  {
    id: 'node-disc-03',
    hostname: 'srv-proliant-01.soc.local',
    ip: '192.168.10.10',
    lomIp: '192.168.100.10',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'cluster_manager',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 250,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'HPE',
      model: 'ProLiant DL360 Gen10 Plus',
      macAddress: '38:EA:A7:44:91:10',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-10',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089
    }
  },
  {
    id: 'node-disc-04',
    hostname: 'srv-proliant-02.soc.local',
    ip: '192.168.10.13',
    lomIp: '192.168.100.13',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'deployer',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 250,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'HPE',
      model: 'ProLiant DL360 Gen10 Plus',
      macAddress: '38:EA:A7:44:91:13',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-13',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089
    }
  },
  {
    id: 'node-disc-05',
    hostname: 'srv-poweredge-03.soc.local',
    ip: '192.168.10.31',
    lomIp: '192.168.100.31',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'search_head',
    site: 'site1',
    cpuCores: 16,
    ramGB: 32,
    storageNVMeGB: 500,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Dell Inc.',
      model: 'PowerEdge R750 High-Compute',
      macAddress: '00:1E:67:8A:2B:31',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-31',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089,
      shcReplicationPort: 8181
    }
  },
  {
    id: 'node-disc-06',
    hostname: 'srv-poweredge-04.soc.local',
    ip: '192.168.10.32',
    lomIp: '192.168.100.32',
    lomType: 'idrac',
    sshPort: 22,
    sshUser: 'root',
    role: 'search_head',
    site: 'site1',
    cpuCores: 16,
    ramGB: 32,
    storageNVMeGB: 500,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Dell Inc.',
      model: 'PowerEdge R750 High-Compute',
      macAddress: '00:1E:67:8A:2B:32',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-32',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkWeb: 8000,
      splunkMgmt: 8089,
      shcReplicationPort: 8181
    }
  },
  {
    id: 'node-disc-07',
    hostname: 'srv-storage-dl380-01.soc.local',
    ip: '192.168.10.21',
    lomIp: '192.168.100.21',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site1',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 6,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'HPE',
      model: 'ProLiant DL380 Gen10 24-SFF SAS/NVMe',
      macAddress: '38:EA:A7:44:91:21',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-21',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887
    }
  },
  {
    id: 'node-disc-08',
    hostname: 'srv-storage-dl380-02.soc.local',
    ip: '192.168.10.22',
    lomIp: '192.168.100.22',
    lomType: 'ilo',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site1',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 6,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'HPE',
      model: 'ProLiant DL380 Gen10 24-SFF SAS/NVMe',
      macAddress: '38:EA:A7:44:91:22',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-22',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887
    }
  },
  {
    id: 'node-disc-09',
    hostname: 'srv-supermicro-01.soc.local',
    ip: '192.168.10.23',
    lomIp: '192.168.100.23',
    lomType: 'ipmi_generic',
    sshPort: 22,
    sshUser: 'root',
    role: 'indexer_peer',
    site: 'site2',
    cpuCores: 16,
    ramGB: 64,
    storageNVMeGB: 1000,
    storageColdTB: 6,
    osType: 'rocky_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Supermicro',
      model: 'SuperServer SYS-2029U-TN24R4T',
      macAddress: '00:25:90:E4:7B:23',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-23',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkMgmt: 8089,
      splunkTcp: 9997,
      replicationPort: 9887
    }
  },
  {
    id: 'node-disc-10',
    hostname: 'srv-gateway-hf-01.soc.local',
    ip: '192.168.10.41',
    lomIp: '192.168.100.41',
    lomType: 'ssh_root',
    sshPort: 22,
    sshUser: 'root',
    role: 'heavy_forwarder',
    site: 'site1',
    cpuCores: 8,
    ramGB: 16,
    storageNVMeGB: 250,
    storageColdTB: 0,
    osType: 'rhel_9_4',
    status: 'discovered',
    lifecycleStage: 'discovered',
    installProgress: 0,
    isConfigured: false,
    discoveryInfo: {
      vendor: 'Cisco Systems',
      model: 'UCS C240 M6 Ingest Appliance',
      macAddress: '70:69:79:D8:1A:41',
      discoveredSubnet: '192.168.10.0/24',
      mgmtAgentPort: 9443,
      mgmtConnected: true,
      mgmtToken: 'splk-agent-sec-9443-tok-41',
      discoveredAt: new Date().toISOString()
    },
    assignedPorts: {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkMgmt: 8089,
      hecPort: 8088,
      syslogPort: 514
    }
  }
];

// Pre-OS / LOM / IPMI / iLO / iDRAC Access Guide
export const PRE_OS_ACCESS_GUIDE = {
  titleFa: 'راهنمای اعطای دسترسی Root به سیستم و سرورهای فاقد سیستم‌عامل (Bare-Metal & LOM)',
  titleEn: 'Bare-Metal & Pre-OS Root Access Provisioning Handbook',
  methods: [
    {
      id: 'lom_ipmi',
      nameFa: '۱. از طریق کارت‌های مدیریت ریموت سخت‌افزار (Dell iDRAC / HPE iLO / IPMI 2.0 / Redfish)',
      nameEn: '1. Hardware Out-of-Band (Dell iDRAC, HPE iLO, Supermicro IPMI)',
      stepsFa: [
        'کابل شبکه اختصاصی پورت iDRAC / iLO پشت سرور را به سوییچ مدیریتی (VLAN Management) وصل کنید.',
        'آدرس IP اختصاصی، نام کاربری (معمولاً root یا Administrator) و کلمه عبور کارت سخت‌افزاری را در فیلدهای زیر وارد کنید.',
        'برنامه از طریق پروتکل استاندارد Redfish API و Virtual Media به‌صورت خودکار فایل ISO سفارشی (RHEL/Ubuntu) را به سرور Mount کرده و سیستم‌عامل را نصب می‌کند.'
      ],
      cliExample: `# تست ارتباط Redfish با iDRAC/iLO از خط فرمان:
curl -k -u "root:calvin" -X GET https://192.168.100.10/redfish/v1/Systems/System.Embedded.1`
    },
    {
      id: 'pxe_kickstart',
      nameFa: '۲. از طریق بوت شبکه PXE / TFTP با Kickstart و Cloud-Init خودکار',
      nameEn: '2. Automated PXE Boot with Kickstart & Preseed',
      stepsFa: [
        'در سرورهای خام، در تنظیمات BIOS کارت شبکه را روی اولویت اول بوت (PXE / Network Boot) قرار دهید.',
        'برنامه یک فایل کانفیگ `ks.cfg` (برای RedHat) یا `user-data` (برای Ubuntu) تولید می‌کند که رمز Root و کلید SSH را خودکار تزریق می‌نماید.'
      ],
      cliExample: `# فایل ks.cfg نمونه تولیدی برنامه جهت نصب خودکار RHEL 9.4:
lang en_US.UTF-8
keyboard us
timezone Asia/Tehran --utc
rootpw --plaintext SplunkRootSecure2026!
authselect select minimal
network --bootproto=dhcp --activate
firewall --enabled --port=22:tcp,8000:tcp,8089:tcp,9997:tcp
reboot`
    },
    {
      id: 'ssh_nopasswd',
      nameFa: '۳. سرورهای لینوکس موجود: فعال‌سازی دسترسی روت بدون پسورد (SSH Key Injection & NOPASSWD)',
      nameEn: '3. Existing Linux Servers: SSH Key & Sudoers NOPASSWD',
      stepsFa: [
        'کلید عمومی SSH زیر را کپی کرده و در فایل `~/.ssh/authorized_keys` کاربر root سرورهایتان قرار دهید.',
        'یا کاربر را در فایل `/etc/sudoers` با دستور `splunk_admin ALL=(ALL) NOPASSWD:ALL` اضافه نمایید.'
      ],
      cliExample: `# دستور تک خطی جهت اعطای دسترسی به این برنامه از روی ترمینال سرور:
mkdir -p ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI-SPLUNK-DOCTOR-ORCHESTRATOR-KEY root@splunk-doctor" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`
    }
  ]
};

// Failover & Auto-Healing Policies
export const FAILOVER_POLICIES = [
  {
    id: 'idx_bucket_fixup',
    nameFa: 'بازیابی خودکار باکت‌های کلاستر ایندکسر (Bucket Fixup & RF/SF Healing)',
    nameEn: 'Indexer Bucket Auto-Healing',
    descriptionFa: 'در صورت قطعی یا ریست هر ایندکسر، Cluster Manager سریعاً باکت‌های باقیمانده را به سایر ایندکسرها Replicate می‌کند تا کلاستر ۱۰۰٪ سبز بماند.',
    status: 'enabled',
    parameters: {
      cm_search_factor: 2,
      cm_replication_factor: 3,
      heartbeat_timeout_sec: 60,
      restart_timeout_sec: 120
    }
  },
  {
    id: 'shc_captain_raft',
    nameFa: 'انتخاب خودکار کاپیتان جدید در Search Head Clustering (Raft Dynamic Election)',
    nameEn: 'Dynamic SHC Captain Election',
    descriptionFa: 'در صورت از دست رفتن نود کاپیتان، نودهای باقیمانده با اجماع Raft سریعاً کاپیتان جدید انتخاب کرده و سرچ‌ها بدون ثانیه‌ای قطعی ادامه می‌یابند.',
    status: 'enabled',
    parameters: {
      election_timeout_ms: 5000,
      min_peers_quorum: 2
    }
  },
  {
    id: 'k8s_pod_self_healing',
    nameFa: 'بازیابی فوری کانتینرها در کوبرنتیز (K8s Pod Restart & Liveness Probes)',
    nameEn: 'Kubernetes Pod Self-Healing & Drain',
    descriptionFa: 'در صورت هنگ کردن پروسس splunkd، کوبرنتیز خودکار پاد را ری‌استارت کرده و حافظه موقت را به دیسک پایدار PVC متصل نگه می‌دارد.',
    status: 'enabled',
    parameters: {
      liveness_probe_interval_sec: 15,
      pvc_retain_policy: 'Retain',
      anti_affinity_across_nodes: true
    }
  }
];
