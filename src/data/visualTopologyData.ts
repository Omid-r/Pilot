import { TopologyDiagramNode } from '../types';

export const INITIAL_TOPOLOGY_NODES: TopologyDiagramNode[] = [
  // ================= SEARCH HEAD TIER =================
  {
    id: 'sh-01',
    tier: 'SEARCH_HEAD',
    name: 'Search Head 01 (Captain)',
    fqdn: 'sh-node-01.corp.internal',
    roleFa: 'کاپیتان کلاستر جستجو (SHC Captain) و اجرای داشبوردهای SOC',
    roleEn: 'SHC Captain / Ad-hoc & Security Dashboard Execution',
    ip: '192.168.10.21',
    status: 'WARNING',
    vCpuCurrent: 16,
    vCpuRecommended: 24,
    cpuUsagePct: 78,
    ramGbCurrent: 32,
    ramGbRecommended: 64,
    ramUsagePct: 74,
    throughput: '34 Queries/Min',
    activeSearches: 13,
    maxSearches: 19,
    skipRatePct: 4.8,
    ports: [8000, 8089, 8191],
    clusterRole: 'SHC Member (Raft Captain)',
    confSnippets: [
      {
        fileName: 'limits.conf',
        snippet: `[search]
max_searches_per_cpu = 2
base_max_searches = 6
max_rt_search_multiplier = 1

[scheduler]
max_searches_perc = 70
schedule_window = auto`,
        descriptionFa: 'تنظیمات اسلات‌های جستجوی همزمان و جلوگیری از تداخل کرون‌جاب‌های امنیتی'
      },
      {
        fileName: 'distsearch.conf',
        snippet: `[distributedSearch]
servers = 192.168.10.31:8089, 192.168.10.32:8089
statusTimeout = 10
connectionTimeout = 10`,
        descriptionFa: 'پیکربندی اتصال توزیع‌شده به پیرهای کلاستر ایندکسر'
      }
    ],
    cliCommands: [
      {
        labelFa: 'بررسی وضعیت لیدر کلاستر جستجو (SHC Raft Status)',
        labelEn: 'Check SHC Captain Status',
        cmd: '/opt/splunk/bin/splunk show shcluster-status --auth admin:Splunk@Secure2026'
      },
      {
        labelFa: 'بررسی لاگ‌های سرچ‌های Skip شده (Scheduler Telemetry)',
        labelEn: 'Tail Scheduler Skip Logs',
        cmd: 'grep -i "skipped" /opt/splunk/var/log/splunk/scheduler.log | tail -n 20'
      }
    ]
  },
  {
    id: 'sh-02',
    tier: 'SEARCH_HEAD',
    name: 'Search Head 02 (Member)',
    fqdn: 'sh-node-02.corp.internal',
    roleFa: 'عضو کلاستر جستجو (SHC Member) و سرویس‌دهی به کوئری‌های همبستگی ES',
    roleEn: 'SHC Member / Enterprise Security Correlation Search Worker',
    ip: '192.168.10.22',
    status: 'WARNING',
    vCpuCurrent: 16,
    vCpuRecommended: 24,
    cpuUsagePct: 82,
    ramGbCurrent: 32,
    ramGbRecommended: 64,
    ramUsagePct: 76,
    throughput: '31 Queries/Min',
    activeSearches: 11,
    maxSearches: 19,
    skipRatePct: 5.6,
    ports: [8000, 8089, 8191],
    clusterRole: 'SHC Member (Peer)',
    confSnippets: [
      {
        fileName: 'server.conf',
        snippet: `[shclustering]
disabled = false
mgmt_uri = https://192.168.10.22:8089
pass4SymmKey = EnterpriseSecretSHC2026
shcluster_label = shc_tier_soc`,
        descriptionFa: 'عضویت در کلاستر سرچ‌هد و احراز هویت مشترک'
      }
    ],
    cliCommands: [
      {
        labelFa: 'انتقال دستی کاپیتان کلاستر به این سرور',
        labelEn: 'Transfer SHC Captaincy',
        cmd: '/opt/splunk/bin/splunk transfer shcluster-captain -mgmt_uri https://192.168.10.22:8089 --auth admin:Splunk@Secure2026'
      }
    ]
  },
  {
    id: 'sh-rec-03',
    tier: 'SEARCH_HEAD',
    name: '+1 Search Head 03 (توصیه اکید معمار SVA)',
    fqdn: 'sh-node-03.corp.internal (Ghost / Recommended)',
    roleFa: 'نود پیشنهادی ارتقا جهت رساندن کلاستر به ۳ نود (Quorum طلایی) و مهار Skip Rate',
    roleEn: 'Recommended 3rd SHC Node to achieve Raft Quorum and eliminate Scheduled Skip Rate',
    ip: '192.168.10.23 (Reserve IP)',
    status: 'RECOMMENDED_ADDITION',
    isRecommendedAddition: true,
    recommendationReasonFa: 'تعداد ۲۲ سرچ اسکجول همزمان فراتر از ظرفیت ۱۹ اسلات فعلی است (Skip Rate = ۵.۲٪). با ایجاد نود سوم، سقف همزمانی کلاستر به ۵۷ اسلات افزایش می‌یابد و پایداری Raft به ۱۰۰٪ می‌رسد.',
    recommendationReasonEn: 'Scheduled search concurrency (22 active) exceeds 19 slots ceiling. Adding 3rd node expands total concurrency to 57 slots and establishes resilient Raft odd-quorum.',
    recommendationMetric: 'Search Concurrency Sizing Formula Gap: +19 Slots Needed | Skip Rate: 5.2% → 0.0%',
    vCpuCurrent: 0,
    vCpuRecommended: 24,
    cpuUsagePct: 0,
    ramGbCurrent: 0,
    ramGbRecommended: 64,
    ramUsagePct: 0,
    throughput: 'Target: +25 Queries/Min Capacity',
    activeSearches: 0,
    maxSearches: 19,
    skipRatePct: 0,
    ports: [8000, 8089, 8191],
    clusterRole: 'Proposed SHC 3rd Member (Quorum Stabilizer)',
    confSnippets: [
      {
        fileName: 'shcluster-bootstrap.sh',
        snippet: `#!/bin/bash
# 1. Install Splunk Enterprise on sh-node-03
# 2. Join SHC Cluster:
/opt/splunk/bin/splunk init shcluster-config \\
  -auth admin:Splunk@Secure2026 \\
  -mgmt_uri https://192.168.10.23:8089 \\
  -replication_port 8191 \\
  -replication_factor 3 \\
  -conf_deploy_fetch_url https://192.168.10.15:8089 \\
  -secret EnterpriseSecretSHC2026 \\
  -shcluster_label shc_tier_soc

# 3. Add to Captain:
/opt/splunk/bin/splunk add shcluster-member \\
  -current_member_uri https://192.168.10.21:8089 \\
  -auth admin:Splunk@Secure2026`,
        descriptionFa: 'اسکریپت کامل راه‌اندازی و الحاق سرچ‌هد سوم به کلاستر کاپیتان'
      }
    ],
    cliCommands: [
      {
        labelFa: 'اجرای دستور عضویت سرچ‌هد سوم در کلاستر',
        labelEn: 'Execute SHC Join CLI',
        cmd: '/opt/splunk/bin/splunk add shcluster-member -current_member_uri https://192.168.10.21:8089'
      }
    ]
  },

  // ================= INDEXER TIER =================
  {
    id: 'idx-01',
    tier: 'INDEXER',
    name: 'Indexer Peer 01',
    fqdn: 'idx-peer-01.corp.internal',
    roleFa: 'دریافت استریم لاگ ۹۹۹۷، تولید ایندکس TSIDX، نگهداری باکت‌های Hot/Warm',
    roleEn: 'Log Ingestion, TSIDX Inverted Index Generation, Hot/Warm Replication Peer',
    ip: '192.168.10.31',
    status: 'CRITICAL',
    vCpuCurrent: 16,
    vCpuRecommended: 24,
    cpuUsagePct: 86,
    ramGbCurrent: 32,
    ramGbRecommended: 64,
    ramUsagePct: 88,
    iopsCurrent: 450,
    iopsRequired: 1200,
    diskUsagePct: 84,
    storageTbCurrent: 28.3,
    storageTbRecommended: 40.0,
    throughput: '185 GB/Day (9,250 EPS)',
    ports: [9997, 8089, 9887],
    clusterRole: 'Indexer Peer (Site 1)',
    confSnippets: [
      {
        fileName: 'server.conf',
        snippet: `[clustering]
master_uri = https://192.168.10.10:8089
mode = slave
pass4SymmKey = EnterpriseSecretCluster2026

[replication_port://9887]

[splunktcp://9997]
pipelineSet = 2
connection_host = ip`,
        descriptionFa: 'پیکربندی اتصال به Cluster Master و فعال‌سازی ۲ پایپ‌لاین موازی'
      },
      {
        fileName: 'indexes.conf',
        snippet: `[volume:hot_warm_nvme]
path = /opt/splunk/data/hot_warm
maxVolumeDataSizeMB = 2000000

[volume:cold_storage]
path = /opt/splunk/data/cold
maxVolumeDataSizeMB = 8000000

[main]
homePath = volume:hot_warm_nvme/defaultdb/db
coldPath = volume:cold_storage/defaultdb/colddb
thawedPath = /opt/splunk/data/thawed/defaultdb/thaweddb
maxDataSize = auto_high_volume`,
        descriptionFa: 'تفکیک ولوم‌های دیسک پرسرعت Hot/Warm از استوریج پرظرفیت Cold'
      }
    ],
    cliCommands: [
      {
        labelFa: 'بررسی وضعیت پر بودن صف‌های دریافت ایندکسر (Queue Health)',
        labelEn: 'Check Ingestion Queues Fill Rate',
        cmd: '/opt/splunk/bin/splunk show btool server list queue'
      },
      {
        labelFa: 'سنجش بلادرنگ نرخ نوشتن روی دیسک (iostat measurement)',
        labelEn: 'Run Disk IOPS Telemetry',
        cmd: 'iostat -xz 1 5 /dev/nvme0n1'
      }
    ]
  },
  {
    id: 'idx-02',
    tier: 'INDEXER',
    name: 'Indexer Peer 02',
    fqdn: 'idx-peer-02.corp.internal',
    roleFa: 'همتای کلاستر ایندکسر، رپلیکیشن باکت‌های RF=3 و پاسخ به مپ‌ریدیوس جستجو',
    roleEn: 'Index Clustering Peer, Hot Bucket Replication, Map-Reduce Execution Node',
    ip: '192.168.10.32',
    status: 'CRITICAL',
    vCpuCurrent: 16,
    vCpuRecommended: 24,
    cpuUsagePct: 89,
    ramGbCurrent: 32,
    ramGbRecommended: 64,
    ramUsagePct: 87,
    iopsCurrent: 450,
    iopsRequired: 1200,
    diskUsagePct: 85,
    storageTbCurrent: 28.4,
    storageTbRecommended: 40.0,
    throughput: '165 GB/Day (8,250 EPS)',
    ports: [9997, 8089, 9887],
    clusterRole: 'Indexer Peer (Site 1)',
    confSnippets: [
      {
        fileName: 'server.conf',
        snippet: `[clustering]
master_uri = https://192.168.10.10:8089
mode = slave
pass4SymmKey = EnterpriseSecretCluster2026`,
        descriptionFa: 'عضویت کلاستر پیر در Cluster Master'
      }
    ],
    cliCommands: [
      {
        labelFa: 'بررسی وضعیت پایداری باکت‌های رپلیکیت شده (Bucket Status)',
        labelEn: 'List Bucket Replication State',
        cmd: '/opt/splunk/bin/splunk list cluster-peers --auth admin:Splunk@Secure2026'
      }
    ]
  },
  {
    id: 'idx-rec-03',
    tier: 'INDEXER',
    name: '+1 Indexer Peer 03 (توصیه اکید معمار SVA)',
    fqdn: 'idx-peer-03.corp.internal (Ghost / Recommended)',
    roleFa: 'نود پیشنهادی ارتقا جهت تضمین RF=3 و SF=2 بدون اورلود و توزیع متوازن IOPS',
    roleEn: 'Recommended 3rd Indexer to guarantee Replication Factor 3 and alleviate Disk IOPS pressure',
    ip: '192.168.10.33 (Reserve IP)',
    status: 'RECOMMENDED_ADDITION',
    isRecommendedAddition: true,
    recommendationReasonFa: 'حجم ورودی ۳۵۰GB/Day با ضریب پیک ۱.۸ به ۶۳۰GB/Day می‌رسد. وجود تنها ۲ ایندکسر منجر به اشباع ۸۷.۵٪ منابع شده است. نود سوم برای تحقق RF=3 واقعی طبق متدولوژی SVA C11 اجباری است.',
    recommendationReasonEn: 'Daily ingest at 350GB/day with 1.8 peak reaches 630GB/day. 2 indexers are running at 87.5% load. 3rd node is required for genuine RF=3 without peer degradation.',
    recommendationMetric: 'Capacity Sizing Gap: +150 GB/Day Ingest Headroom | Target IOPS: 1200+ NVMe',
    vCpuCurrent: 0,
    vCpuRecommended: 24,
    cpuUsagePct: 0,
    ramGbCurrent: 0,
    ramGbRecommended: 64,
    ramUsagePct: 0,
    iopsCurrent: 0,
    iopsRequired: 1200,
    diskUsagePct: 0,
    storageTbCurrent: 0,
    storageTbRecommended: 40.0,
    throughput: 'Target: +175 GB/Day Capacity',
    ports: [9997, 8089, 9887],
    clusterRole: 'Proposed Indexer Peer (Cluster Expansion)',
    confSnippets: [
      {
        fileName: 'join-indexer-cluster.sh',
        snippet: `#!/bin/bash
# 1. Configure server.conf for Indexer Clustering
/opt/splunk/bin/splunk edit cluster-config \\
  -mode slave \\
  -master_uri https://192.168.10.10:8089 \\
  -replication_port 9887 \\
  -secret EnterpriseSecretCluster2026 \\
  -auth admin:Splunk@Secure2026

# 2. Enable Ingestion Port:
/opt/splunk/bin/splunk enable listen 9997 -auth admin:Splunk@Secure2026
/opt/splunk/bin/splunk restart`,
        descriptionFa: 'دستورالعمل کامل نصب و اتصال ایندکسر سوم به کلاستر مستر'
      }
    ],
    cliCommands: [
      {
        labelFa: 'دستور تأیید اتصال ایندکسر سوم در Cluster Master',
        labelEn: 'Verify Node in Cluster Master',
        cmd: '/opt/splunk/bin/splunk show cluster-status --auth admin:Splunk@Secure2026'
      }
    ]
  },

  // ================= INGESTION & SYSLOG TIER =================
  {
    id: 'sc4s-01',
    tier: 'INGESTION',
    name: 'SC4S Syslog Engine 01',
    fqdn: 'sc4s-syslog-01.corp.internal',
    roleFa: 'دریافت سیس‌لاگ فایروال‌ها/سوئیچ‌ها روی پورت ۵۱۴/۶۵۱۴، پارس استاندارد و ارسال HEC',
    roleEn: 'Splunk Connect for Syslog (SC4S) / High Throughput HEC Ingestion Gateway',
    ip: '192.168.10.41',
    status: 'HEALTHY',
    vCpuCurrent: 8,
    vCpuRecommended: 8,
    cpuUsagePct: 44,
    ramGbCurrent: 16,
    ramGbRecommended: 16,
    ramUsagePct: 52,
    throughput: '14,200 EPS (Syslog 514/TCP/UDP)',
    ports: [514, 6514, 8088],
    clusterRole: 'Syslog Collector (Active-Active)',
    confSnippets: [
      {
        fileName: 'env_file (SC4S)',
        snippet: `SC4S_DEST_SPLUNK_HEC_DEFAULT_URL=https://192.168.10.31:8088,https://192.168.10.32:8088
SC4S_DEST_SPLUNK_HEC_DEFAULT_TOKEN=b823f541-6789-4912-bcde-enterprise01
SC4S_DEST_SPLUNK_HEC_TLS_VERIFY=yes
SC4S_DEFAULT_TIMEZONE=Asia/Tehran`,
        descriptionFa: 'تنظیمات ارسال HEC سیس‌لاگ به ایندکسرها با لودبالانسینگ خودکار'
      }
    ],
    cliCommands: [
      {
        labelFa: 'مشاهده لاگ‌های کانتینر SC4S و نرخ دریافت EPS',
        labelEn: 'Monitor SC4S Container Logs',
        cmd: 'podman logs --tail 50 -f sc4s'
      }
    ]
  },
  {
    id: 'sc4s-02',
    tier: 'INGESTION',
    name: 'SC4S Syslog Engine 02',
    fqdn: 'sc4s-syslog-02.corp.internal',
    roleFa: 'کالکتور موازی سیس‌لاگ جهت تضمین High Availability لایه دریافت شبکه',
    roleEn: 'Secondary SC4S Syslog Ingestion Gateway (Keepalived HA Pair)',
    ip: '192.168.10.42',
    status: 'HEALTHY',
    vCpuCurrent: 8,
    vCpuRecommended: 8,
    cpuUsagePct: 41,
    ramGbCurrent: 16,
    ramGbRecommended: 16,
    ramUsagePct: 48,
    throughput: '12,800 EPS (Syslog 514/TCP/UDP)',
    ports: [514, 6514, 8088],
    clusterRole: 'Syslog Collector (Active-Active)',
    confSnippets: [
      {
        fileName: 'env_file (SC4S)',
        snippet: `SC4S_DEST_SPLUNK_HEC_DEFAULT_URL=https://192.168.10.31:8088,https://192.168.10.32:8088
SC4S_DEST_SPLUNK_HEC_DEFAULT_TOKEN=b823f541-6789-4912-bcde-enterprise01`,
        descriptionFa: 'پیکربندی استریم HEC همگام با نود اول'
      }
    ]
  },
  {
    id: 'uf-fleet',
    tier: 'INGESTION',
    name: 'Universal Forwarders Fleet (120+ Agents)',
    fqdn: 'Endpoints & Domain Controllers (Agent Fleet)',
    roleFa: 'ایجنت‌های سبک نصب شده روی سرورهای ویندوز، لینوکس و پایگاه‌های داده',
    roleEn: 'Lightweight Splunk UF Daemon Fleet with TCP-Ack & Auto-LB',
    ip: 'Distributed Subnets',
    status: 'HEALTHY',
    vCpuCurrent: 1,
    vCpuRecommended: 1,
    cpuUsagePct: 3,
    ramGbCurrent: 1,
    ramGbRecommended: 1,
    ramUsagePct: 8,
    throughput: '350 GB/Day Aggregate Stream',
    ports: [8089],
    clusterRole: 'Edge Forwarder Agents',
    confSnippets: [
      {
        fileName: 'outputs.conf',
        snippet: `[tcpout]
defaultGroup = primary_indexers
autoLBFrequency = 30
autoLBVolume = 10485760

[tcpout:primary_indexers]
server = 192.168.10.31:9997, 192.168.10.32:9997, 192.168.10.33:9997
useACK = true`,
        descriptionFa: 'پیکربندی استاندارد توزیع بار حجم و زمان با تاییدیه ACK روی ایجنت‌ها'
      }
    ]
  },

  // ================= MANAGEMENT & ORCHESTRATION TIER =================
  {
    id: 'cm-01',
    tier: 'MANAGEMENT',
    name: 'Cluster Master / Manager Node',
    fqdn: 'cm-manager-01.corp.internal',
    roleFa: 'مدیریت رپلیکیشن باکت‌ها، بررسی سلامت پیرها و نگه‌داری ضریب‌های RF=3 / SF=2',
    roleEn: 'Cluster Master / Bucket Replication Coordinator & Fixup Engine',
    ip: '192.168.10.10',
    status: 'HEALTHY',
    vCpuCurrent: 8,
    vCpuRecommended: 8,
    cpuUsagePct: 22,
    ramGbCurrent: 16,
    ramGbRecommended: 16,
    ramUsagePct: 35,
    throughput: 'Cluster Heartbeat Sync (1s)',
    ports: [8089, 8000],
    clusterRole: 'Indexer Cluster Master',
    confSnippets: [
      {
        fileName: 'server.conf (Cluster Master)',
        snippet: `[clustering]
mode = master
replication_factor = 3
search_factor = 2
pass4SymmKey = EnterpriseSecretCluster2026
cluster_label = idx_cluster_production

[indexer_discovery]
pass4SymmKey = EnterpriseSecretDiscovery2026`,
        descriptionFa: 'تنظیمات طلایی SVA برای رپلیکیشن ۳ تایی و ایندکسر دیسکاوری'
      }
    ],
    cliCommands: [
      {
        labelFa: 'بررسی وضعیت سلامت کلاستر ایندکسر و فرآیند Fixup باکت‌ها',
        labelEn: 'Show Cluster Health & Fixup Tasks',
        cmd: '/opt/splunk/bin/splunk show cluster-status --verbose --auth admin:Splunk@Secure2026'
      }
    ]
  },
  {
    id: 'ds-lm-01',
    tier: 'MANAGEMENT',
    name: 'Deployment Server & License Master',
    fqdn: 'ds-license-01.corp.internal',
    roleFa: 'توزیع متمرکز Appها و کانفیگ‌ها به ایجنت‌ها و مدیریت سهمیه لایسنس سازمان',
    roleEn: 'Deployment Server (Forwarder Management) & Master Enterprise License Server',
    ip: '192.168.10.12',
    status: 'WARNING',
    vCpuCurrent: 8,
    vCpuRecommended: 8,
    cpuUsagePct: 45,
    ramGbCurrent: 16,
    ramGbRecommended: 16,
    ramUsagePct: 48,
    throughput: '120 Active Deployment Clients',
    ports: [8089, 8000],
    clusterRole: 'Deployment Server / LM',
    confSnippets: [
      {
        fileName: 'serverclass.conf',
        snippet: `[serverClass:Windows_DomainControllers]
whitelist.0 = dc*.corp.internal
[serverClass:Windows_DomainControllers:app:TA-Microsoft-Windows]
restartSplunkd = true

[serverClass:Linux_Databases]
whitelist.0 = db*.corp.internal
[serverClass:Linux_Databases:app:Splunk_TA_nix]
restartSplunkd = true`,
        descriptionFa: 'دسته‌بندی سرورکلاس‌ها برای توزیع خودکار افزونه‌های تکنولوژی'
      }
    ],
    cliCommands: [
      {
        labelFa: 'مشاهده لیست کلاینت‌های متصل به Deployment Server',
        labelEn: 'List Deployment Server Clients',
        cmd: '/opt/splunk/bin/splunk list deploy-clients --auth admin:Splunk@Secure2026'
      }
    ]
  },
  {
    id: 'mc-01',
    tier: 'MANAGEMENT',
    name: 'Monitoring Console (DMC)',
    fqdn: 'mc-monitor-01.corp.internal',
    roleFa: 'مرکز تجمیع لاگ‌های سلامت و کارایی سرتاسر کلاستر (Health & Resource Telemetry)',
    roleEn: 'Distributed Monitoring Console (DMC) / Health Metrics & Alerting',
    ip: '192.168.10.14',
    status: 'HEALTHY',
    vCpuCurrent: 8,
    vCpuRecommended: 8,
    cpuUsagePct: 28,
    ramGbCurrent: 16,
    ramGbRecommended: 16,
    ramUsagePct: 38,
    throughput: 'Live Telemetry Aggregation',
    ports: [8000, 8089],
    clusterRole: 'Monitoring Console'
  },
  {
    id: 'deployer-01',
    tier: 'MANAGEMENT',
    name: 'SHC Deployer',
    fqdn: 'deployer-01.corp.internal',
    roleFa: 'توزیع امن Appها و کانفیگ‌های سرچ‌هدها به اعضای کلاستر SHC',
    roleEn: 'Search Head Cluster Deployer / Baseline App Synchronizer',
    ip: '192.168.10.15',
    status: 'HEALTHY',
    vCpuCurrent: 4,
    vCpuRecommended: 4,
    cpuUsagePct: 15,
    ramGbCurrent: 8,
    ramGbRecommended: 8,
    ramUsagePct: 25,
    throughput: 'SHC App Bundle Distribution',
    ports: [8089],
    clusterRole: 'SHC Deployer',
    cliCommands: [
      {
        labelFa: 'دستور پوش کردن اپ‌ها به اعضای کلاستر سرچ‌هد',
        labelEn: 'Apply SHC Cluster Bundle',
        cmd: '/opt/splunk/bin/splunk apply shcluster-bundle -target https://192.168.10.21:8089 --auth admin:Splunk@Secure2026'
      }
    ]
  },

  // ================= STORAGE TIER =================
  {
    id: 'storage-hot-warm',
    tier: 'STORAGE',
    name: 'Hot/Warm Tier (NVMe Volume)',
    fqdn: 'Storage Volume: /opt/splunk/data/hot_warm',
    roleFa: 'دیسک‌های پرسرعت جهت نوشتن بلادرنگ باکت‌های گرم و اجرای کوئری‌های SOC',
    roleEn: 'All-Flash NVMe PCIe Gen4 High IOPS Volume (Target 1200+ IOPS)',
    ip: 'Storage Fabric',
    status: 'CRITICAL',
    vCpuCurrent: 0,
    vCpuRecommended: 0,
    cpuUsagePct: 0,
    ramGbCurrent: 0,
    ramGbRecommended: 0,
    ramUsagePct: 0,
    iopsCurrent: 450,
    iopsRequired: 1200,
    diskUsagePct: 84,
    storageTbCurrent: 18.9,
    storageTbRecommended: 25.0,
    throughput: 'Measured: 450 IOPS (Gap: -750 IOPS)',
    ports: [],
    clusterRole: 'Primary Ingest Storage Volume'
  },
  {
    id: 'storage-cold',
    tier: 'STORAGE',
    name: 'Cold Storage Tier (SAS HDD)',
    fqdn: 'Storage Volume: /opt/splunk/data/cold',
    roleFa: 'دیسک‌های پرظرفیت جهت نگهداری داده‌های رول شده برای دوره انطباق ۳۶۵ روزه',
    roleEn: 'High Capacity Cold Bucket Volume for 365 Days Compliance',
    ip: 'Storage Fabric (Cold)',
    status: 'HEALTHY',
    vCpuCurrent: 0,
    vCpuRecommended: 0,
    cpuUsagePct: 0,
    ramGbCurrent: 0,
    ramGbRecommended: 0,
    ramUsagePct: 0,
    iopsCurrent: 200,
    iopsRequired: 200,
    diskUsagePct: 56,
    storageTbCurrent: 37.8,
    storageTbRecommended: 50.0,
    throughput: 'Sequential Cold Reads & Roll',
    ports: [],
    clusterRole: 'Cold Bucket Archive'
  },
  {
    id: 'storage-smartstore',
    tier: 'STORAGE',
    name: 'Splunk SmartStore (S3 / MinIO Object Storage)',
    fqdn: 's3://splunk-enterprise-smartstore-warm/',
    roleFa: 'معماری مدرن هیبریدی جهت انتقال خودکار باکت‌های Warm به S3 و کاهش ۹۰٪ هزینه دیسک',
    roleEn: 'Cloud Object Storage SmartStore Target for Transparent Warm Bucket Offloading',
    ip: 'S3 API Endpoint (HTTPS 443)',
    status: 'RECOMMENDED_ADDITION',
    isRecommendedAddition: true,
    recommendationReasonFa: 'با رشد سالانه ۷۶ ترابایت داده، استفاده از SmartStore S3 باعث حذف نیاز به دیسک‌های گران‌قیمت محلی روی ایندکسرها شده و هزینه ذخیره‌سازی را تا ۶۰٪ کاهش می‌دهد.',
    recommendationReasonEn: 'SmartStore decouples compute from storage, transparently caching hot buckets while retaining petabytes in S3 object store.',
    recommendationMetric: 'Decoupled Compute & Storage: Saves ~75TB of On-Premise Direct Attached Storage',
    vCpuCurrent: 0,
    vCpuRecommended: 0,
    cpuUsagePct: 0,
    ramGbCurrent: 0,
    ramGbRecommended: 0,
    ramUsagePct: 0,
    throughput: 'Target: Unlimited S3 Capacity',
    ports: [443],
    clusterRole: 'SmartStore Object Tier',
    confSnippets: [
      {
        fileName: 'indexes.conf (SmartStore Remote Volume)',
        snippet: `[volume:s3_remote_store]
storageType = remote
path = s3://splunk-enterprise-smartstore-warm/indexes
remote.s3.endpoint = https://s3.corp.internal:443
remote.s3.auth_region = us-east-1

[main]
homePath = $SPLUNK_DB/defaultdb/db
remotePath = volume:s3_remote_store/defaultdb
maxGlobalRawDataSizeMB = 0`,
        descriptionFa: 'پیکربندی استوریج هیبریدی SmartStore با پشتیبانی از S3 Object Storage'
      }
    ]
  }
];
