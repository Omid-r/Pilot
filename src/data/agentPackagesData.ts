import { ComponentAgentPackage } from '../types';

export const COMPONENT_AGENTS_CATALOG: ComponentAgentPackage[] = [
  {
    id: 'agent-uf',
    componentRole: 'universal_forwarder',
    titleFa: 'ایجنت اختصاصی Universal Forwarder (UF)',
    titleEn: 'Universal Forwarder (UF) Dedicated Diagnostic Agent',
    descriptionFa: 'پایش مستمر صف‌ها (ParsingQueue / OutputQueue)، اعتبارسنجی خودکار outputs.conf و inputs.conf، بررسی گواهینامه SSL و ارسال ایمن تله‌متری با mTLS.',
    descriptionEn: 'Continuous monitoring of forwarder queues, automated btool validation of outputs.conf, TLS handshake verification, and zero-payload heartbeat telemetry.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'CentOS 7/8', 'Ubuntu 20/22/24', 'Windows Server 2016-2025', 'SUSE Enterprise'],
    binarySize: '14.2 MB (Static Go Binary / Zero Dependencies)',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'ایجنت به هیچ عنوان متن لاگ‌های کاری سازمان را ارسال نمی‌کند؛ صرفاً هارت‌بیت، نرخ رویدادها (EPS) و لاگ‌های خود نرم‌افزار اسپلانک (splunkd.log) با هش محلی منتقل می‌شوند.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-uf.sh | sudo bash -s -- --role=universal_forwarder --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_UF_SECURE_9841`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor UF Diagnostic & Remote Management Agent
After=network.target splunk.service
Wants=splunk.service

[Service]
Type=simple
User=splunk
Group=splunk
WorkingDirectory=/opt/splunk-doctor-agent
ExecStart=/opt/splunk-doctor-agent/splunk-agent-daemon --config=/opt/splunk-doctor-agent/agent.yaml
Restart=always
RestartSec=5s
LimitNOFILE=65536
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target`,
      windowsPowerShell: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13; iex ((New-Object System.Net.WebClient).DownloadString('https://splunk-doctor.internal:8443/install/agent-uf.ps1'))`,
      dockerCompose: `version: '3.8'
services:
  splunk-doctor-uf-agent:
    image: registry.splunk-doctor.internal/agents/uf:v3.4.2
    container_name: splunk-doctor-uf-agent
    restart: always
    volumes:
      - /opt/splunkforwarder/etc:/opt/splunkforwarder/etc:ro
      - /opt/splunkforwarder/var/log/splunk:/opt/splunkforwarder/var/log/splunk:ro
    environment:
      - DOCTOR_SERVER_URL=https://splunk-doctor.internal:8443
      - AGENT_ROLE=universal_forwarder
      - MTLS_SECRET_TOKEN=MTLS_TOKEN_UF_SECURE_9841
      - ZERO_TRUST_MASKING=true`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "uf-endpoint-\${HOSTNAME}"
  role: "universal_forwarder"
  splunk_home: "/opt/splunkforwarder"
  
server:
  doctor_endpoint: "https://splunk-doctor.internal:8443"
  heartbeat_interval_secs: 5
  tls:
    enabled: true
    min_version: "TLSv1.3"
    client_cert: "/opt/splunk-doctor-agent/certs/client.crt"
    client_key: "/opt/splunk-doctor-agent/certs/client.key"
    ca_cert: "/opt/splunk-doctor-agent/certs/doctor-ca.crt"
    
security:
  zero_trust_masking: true
  mask_ip_addresses: true
  allow_remote_commands: true
  command_whitelist:
    - "/opt/splunkforwarder/bin/splunk status"
    - "/opt/splunkforwarder/bin/splunk restart"
    - "/opt/splunkforwarder/bin/splunk btool outputs list --debug"
    - "/opt/splunkforwarder/bin/splunk btool inputs list --debug"
    - "/opt/splunkforwarder/bin/splunk list forward-server"`,
    supportedActions: [
      'Heartbeat & EPS Ingestion Tracker',
      'btool Configuration Syntax & Hierarchy Validation',
      'OutputQueue & Indexer Connection Prober',
      'Encrypted Remote Splunk Restart / Reload',
      'splunkd.log Live Tail & Auto-Healing'
    ]
  },
  {
    id: 'agent-hf',
    componentRole: 'heavy_forwarder',
    titleFa: 'ایجنت اختصاصی Heavy Forwarder (HF)',
    titleEn: 'Heavy Forwarder (HF) Ingestion & Parsing Agent',
    descriptionFa: 'تحلیل خط لوله پایپلاین (Parsing, Aggregation, Typing)، نظارت بر Regex در props.conf و transforms.conf، پایش بار پردازشی CPU و لود بالانسینگ به سمت ایندکسرها.',
    descriptionEn: 'Pipeline throughput analyzer (Parsing/Typing queues), regex performance profiler for props & transforms, CPU throttling monitor, and multi-index routing tracker.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'CentOS 7/8', 'Ubuntu 20/22/24', 'Debian 11/12'],
    binarySize: '16.1 MB (High Performance Go Daemon)',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'فیلدهای حساس مانند PII و مقادیر لاگ قبل از هرگونه ارسال آمار با تابع SHA-256 در مبدا کدر (Anonymized) می‌شوند.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-hf.sh | sudo bash -s -- --role=heavy_forwarder --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_HF_SECURE_7719`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor Heavy Forwarder Agent
After=network.target splunk.service

[Service]
Type=simple
User=splunk
Group=splunk
ExecStart=/opt/splunk-doctor-agent/splunk-agent-daemon --config=/opt/splunk-doctor-agent/agent-hf.yaml
Restart=always
RestartSec=3s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target`,
      windowsPowerShell: `# Heavy Forwarders are typically Linux-based in Enterprise SOCs`,
      dockerCompose: `version: '3.8'
services:
  hf-diagnostic-agent:
    image: registry.splunk-doctor.internal/agents/hf:v3.4.2
    container_name: splunk-doctor-hf-agent
    volumes:
      - /opt/splunk/etc:/opt/splunk/etc:ro
      - /opt/splunk/var/log/splunk:/opt/splunk/var/log/splunk:ro
    environment:
      - DOCTOR_SERVER_URL=https://splunk-doctor.internal:8443
      - AGENT_ROLE=heavy_forwarder`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "hf-gateway-\${HOSTNAME}"
  role: "heavy_forwarder"
  splunk_home: "/opt/splunk"

pipeline_monitoring:
  track_parsing_queue: true
  track_agg_queue: true
  track_typing_queue: true
  warning_queue_threshold_pct: 85

security:
  mTLS: true
  zero_trust_payload_protection: true`,
    supportedActions: [
      'Parsing Pipeline Bottleneck Profiling',
      'Transforms & Props Lookup Verification',
      'Indexer TCP Port 9997 Health & TLS Handshake Checks',
      'Remote Configuration Sync & Clean Btool Export',
      'Real-time EPS Drop Alert Dispatcher'
    ]
  },
  {
    id: 'agent-syslog',
    componentRole: 'syslog_collector',
    titleFa: 'ایجنت اختصاصی سرورهای سیسلاگ (Syslog-ng / Rsyslog / SC4S)',
    titleEn: 'Syslog Collector & SC4S Specialized Agent',
    descriptionFa: 'پایش سوکت‌های UDP/514 و TCP/601، جلوگیری از سرریز بافر کرنل سوکت (Kernel UDP Packet Drop)، اعتبارسنجی لاگ‌های فایروال‌ها و تجهیزات شبکه.',
    descriptionEn: 'UDP 514 / TCP 601 kernel socket buffer monitor, SC4S container health inspector, dropped packet detector, and disk spool queue tracker.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'Rocky Linux 8/9', 'Ubuntu 20/22/24', 'CentOS 7/8'],
    binarySize: '12.8 MB (Native Network Socket Collector)',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'ایجنت روی پورت‌های ۵۱۴ تنها شمارنده بسته‌ها و هدرها را پایش می‌کند؛ محتوای پیام‌های سیسلاگ سازمان هرگز ثبت یا خارج نمی‌گردد.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-syslog.sh | sudo bash -s -- --role=syslog_collector --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_SYSLOG_3321`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor Syslog Ingestion Health Agent
After=network.target syslog-ng.service rsyslog.service

[Service]
Type=simple
User=root
ExecStart=/opt/splunk-doctor-agent/splunk-syslog-agent --config=/opt/splunk-doctor-agent/syslog-agent.yaml
Restart=always
RestartSec=2s

[Install]
WantedBy=multi-user.target`,
      windowsPowerShell: `# Syslog collectors are Linux-based`,
      dockerCompose: `version: '3.8'
services:
  sc4s-monitor-agent:
    image: registry.splunk-doctor.internal/agents/syslog:v3.4.2
    container_name: sc4s-health-agent
    network_mode: "host"
    environment:
      - DOCTOR_SERVER_URL=https://splunk-doctor.internal:8443
      - MONITOR_UDP_PORTS=514,6514`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "syslog-collector-\${HOSTNAME}"
  role: "syslog_collector"
  
syslog_metrics:
  listen_udp_ports: [514, 1514]
  listen_tcp_ports: [601, 6514]
  detect_kernel_udp_drops: true
  spool_disk_path: "/var/log/syslog-ng/spool"
  
heartbeat:
  interval_secs: 3
  alert_on_zero_eps_after_secs: 15`,
    supportedActions: [
      'UDP Buffer Drop & Netstat Socket Saturation Tracker',
      'Syslog-ng / Rsyslog Service Remote Restart',
      'Real-time Network Firewall Traffic Flow Health',
      'Zero-Event Silence Detector with Instant Alert'
    ]
  },
  {
    id: 'agent-indexer',
    componentRole: 'indexer_node',
    titleFa: 'ایجنت اختصاصی Indexer Cluster (IDX)',
    titleEn: 'Indexer Cluster Node & Storage Agent',
    descriptionFa: 'پایش دیسک و پارتیشن‌های Hot/Warm/Cold/Frozen، سلامت رپلیکیشن باکت‌ها (Replication & Search Factor)، پایش پورت ۹۹۹۷ و مدیریت فضای دیسک minFreeSpaceMB.',
    descriptionEn: 'Storage volume monitoring (Hot/Warm/Cold/Frozen), bucket replication state tracker (SF/RF status), indexer queue saturation analyzer, and minFreeSpaceMB protector.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'Rocky Linux 8/9', 'Ubuntu 20/22/24'],
    binarySize: '15.7 MB (High Throughput Storage & Splunk Prober)',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: '556677889900aabbccddeeff11223344556677889900aabbccddeeff11223344',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'حفظ ۱۰۰٪ محرمانگی باکت‌ها؛ هیچ داده‌ای از داخل فایل‌های .tsidx یا journal.zst استخراج یا ارسال نمی‌شود.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-indexer.sh | sudo bash -s -- --role=indexer_node --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_IDX_SECURE_4412`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor Indexer Node Diagnostics & Bucket Health Agent
After=network.target splunk.service

[Service]
Type=simple
User=splunk
Group=splunk
ExecStart=/opt/splunk-doctor-agent/splunk-agent-daemon --config=/opt/splunk-doctor-agent/agent-indexer.yaml
Restart=always
RestartSec=5s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target`,
      windowsPowerShell: `# Indexer clusters operate on Linux enterprise environments`,
      dockerCompose: `version: '3.8'
services:
  indexer-doctor-agent:
    image: registry.splunk-doctor.internal/agents/indexer:v3.4.2
    volumes:
      - /opt/splunk/etc:/opt/splunk/etc:ro
      - /opt/splunk/var/lib/splunk:/opt/splunk/var/lib/splunk:ro`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "idx-peer-\${HOSTNAME}"
  role: "indexer_node"
  splunk_home: "/opt/splunk"

storage_monitoring:
  hot_warm_path: "/opt/splunk/var/lib/splunk"
  cold_path: "/opt/splunk/colddb"
  warn_disk_pct: 85
  panic_disk_pct: 95
  
replication_tracker:
  cluster_master_url: "https://10.20.30.10:8089"`,
    supportedActions: [
      'Real-time Bucket Replication Health (RF/SF Status)',
      'Disk Space & minFreeSpaceMB Guardrail',
      'Port 9997 TCP Ingestion Listener Health',
      'Corrupted Bucket Integrity Scan',
      'Live splunkd.log Indexing Pipeline Diagnostics'
    ]
  },
  {
    id: 'agent-search-head',
    componentRole: 'search_head',
    titleFa: 'ایجنت اختصاصی Search Head Cluster (SHC)',
    titleEn: 'Search Head Cluster & Captain Health Agent',
    descriptionFa: 'پایش سلامت کلاستر SHC (Raft Consensus, Captain Election, Artifact Replication)، تحلیل کوئری‌های پرمصرف و پایش پورت وب ۸۰۰۰ و مدیریت ۸۰۸۹.',
    descriptionEn: 'Search head cluster captain status, Raft consensus monitor, expensive search profiler, Web port 8000 SSL validator, and distributed search peer latency tracker.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'Ubuntu 20/22/24'],
    binarySize: '14.9 MB',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: '77889900aabbccddeeff11223344556677889900aabbccddeeff112233445566',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'اطلاعات کاربران، تاریخچه جستجوهای حساس و داشبوردها با کلید سخت‌افزاری رمزگذاری شده و فقط متادیتای آماری منتقل می‌گردد.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-shc.sh | sudo bash -s -- --role=search_head --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_SHC_SECURE_1109`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor Search Head Cluster Diagnostic Agent
After=network.target splunk.service

[Service]
Type=simple
User=splunk
Group=splunk
ExecStart=/opt/splunk-doctor-agent/splunk-agent-daemon --config=/opt/splunk-doctor-agent/agent-sh.yaml
Restart=always

[Install]
WantedBy=multi-user.target`,
      windowsPowerShell: `# Search heads operate on Linux`,
      dockerCompose: `version: '3.8'
services:
  sh-diagnostic-agent:
    image: registry.splunk-doctor.internal/agents/sh:v3.4.2`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "sh-member-\${HOSTNAME}"
  role: "search_head"
  splunk_home: "/opt/splunk"

shc_monitoring:
  detect_captain_changes: true
  audit_search_concurrency: true`,
    supportedActions: [
      'Search Head Cluster Captain & Raft Status',
      'Web 8000 & REST 8089 TLS Security Prober',
      'Expensive / Long-running Search Audit',
      'Knowledge Object & App Bundle Synchronizer'
    ]
  },
  {
    id: 'agent-deployment-server',
    componentRole: 'deployment_server',
    titleFa: 'ایجنت اختصاصی Deployment Server & Cluster Master',
    titleEn: 'Deployment Server / Cluster Master Central Agent',
    descriptionFa: 'توزیع یکپارچه اپلیکیشن‌ها و کانفیگ‌ها به Forwarderها (serverclass.conf)، اعتبارسنجی سرتیفیکت‌های کلاستر و مدیریت متمرکز بسته‌ها.',
    descriptionEn: 'Central deployment apps distributor, serverclass.conf validator, cluster-wide certificate manager, and deployment client phone-home tracker.',
    version: 'v3.4.2-enterprise',
    supportedOS: ['RHEL 7/8/9', 'CentOS 7/8', 'Ubuntu 20/22/24'],
    binarySize: '15.1 MB',
    securityProfile: {
      anonymizeLocalIp: true,
      tlsProtocol: 'TLS 1.3 / mTLS',
      sha256Checksum: 'aabbccddeeff11223344556677889900aabbccddeeff11223344556677889900',
      readOnlyExecutionMode: false,
      dataConfidentialityGuarantee: 'محرمانگی کامل بسته‌های نرم‌افزاری با امضای دیجیتال و کانال توزیع TLS 1.3 رمزگذاری شده.'
    },
    installScripts: {
      linuxBashOneLiner: `curl -sSL --tlsv1.3 https://splunk-doctor.internal:8443/install/agent-ds.sh | sudo bash -s -- --role=deployment_server --server=https://splunk-doctor.internal:8443 --token=MTLS_TOKEN_DS_SECURE_9918`,
      systemdServiceFile: `[Unit]
Description=Splunk Doctor Deployment Server Manager
After=network.target splunk.service

[Service]
Type=simple
User=splunk
Group=splunk
ExecStart=/opt/splunk-doctor-agent/splunk-agent-daemon --config=/opt/splunk-doctor-agent/agent-ds.yaml`,
      windowsPowerShell: `# Deployment server daemon`,
      dockerCompose: `version: '3.8'
services:
  ds-doctor-agent:
    image: registry.splunk-doctor.internal/agents/ds:v3.4.2`
    },
    sampleAgentConfigYaml: `agent:
  node_id: "ds-master-\${HOSTNAME}"
  role: "deployment_server"
  splunk_home: "/opt/splunk"

deployment_monitoring:
  phone_home_interval_threshold_secs: 60
  auto_reload_deploy_server: true`,
    supportedActions: [
      'Serverclass.conf & App Deployment Push Validator',
      'Client Phone-Home Latency & Heartbeat Map',
      'Cluster Master Indexer Bundle Reload & Validation',
      'Central mTLS Key Management'
    ]
  }
];
