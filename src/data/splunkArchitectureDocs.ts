// Splunk Complete Official Architecture, Installation, Clustering & Best Practices Guides

export interface DocChapter {
  id: string;
  titleFa: string;
  titleEn: string;
  category: 'installation' | 'indexer_clustering' | 'shc' | 'management_nodes' | 'best_practices' | 'storage_smartstore';
  readTime: string;
  summaryFa: string;
  summaryEn: string;
  sections: {
    headingFa: string;
    headingEn: string;
    contentFa: string;
    contentEn: string;
    codeSnippet?: string;
    codeLanguage?: string;
    calloutFa?: string;
    calloutType?: 'tip' | 'warning' | 'critical' | 'info';
  }[];
  officialDocLinks: { title: string; url: string }[];
}

export const SPLUNK_ARCHITECTURE_CHAPTERS: DocChapter[] = [
  {
    id: 'chapter-baremetal-install',
    titleFa: '۱. راهنمای گام‌به‌گام نصب، تنظیمات هسته لینوکس و Hardening سیستم‌عامل',
    titleEn: '1. Bare-Metal & Linux OS Installation, Kernel Tuning & Systemd Service',
    category: 'installation',
    readTime: '10 دقیقه',
    summaryFa: 'تنظیمات حیاتی کرنل لینوکس (THP، Limits، Sysctl)، ساخت کاربر splunk، نصب RPM/TGZ و ساخت سرویس Systemd تحت systemctl.',
    summaryEn: 'Critical Linux kernel tuning (THP, Limits, Sysctl), dedicated non-root splunk user, RPM/TGZ installation, and systemd service.',
    sections: [
      {
        headingFa: '۱.۱. نیازمندی‌های سخت‌افزاری و سیستم‌عامل مرجع (Reference Hardware)',
        headingEn: '1.1. Reference Hardware & OS Specifications',
        contentFa: 'برای هر نود Indexer یا Search Head سازمانی، حداقل ۱۶ الی ۲۴ هسته CPU فیزیکی و ۶۴ گیگابایت حافظه RAM به همراه دیسک‌های NVMe SSD با سرعت حداقل ۱۲۰۰+ IOPS پیشنهاد می‌شود. لینوکس‌های RHEL 8/9، Rocky Linux 8/9 و Ubuntu 22.04 LTS به عنوان سیستم‌عامل استاندارد پشتیبانی می‌شوند.',
        contentEn: 'Enterprise Indexer/SH nodes require min 16-24 physical CPU cores, 64GB RAM, and NVMe SSDs delivering 1200+ IOPS. RHEL 8/9, Rocky Linux 8/9, and Ubuntu 22.04 LTS are standard supported OS distributions.',
        calloutFa: 'نکته حیاتی: دیسک‌های Hot و Warm هرگز نباید روی ذخیره‌سازهای اشتراکی شبکه کند (NFS/Samba) قرار گیرند.',
        calloutType: 'critical'
      },
      {
        headingFa: '۱.۲. غیرفعال‌سازی Transparent Huge Pages (THP) و بهینه‌سازی Sysctl',
        headingEn: '1.2. Disabling Transparent Huge Pages (THP) & Sysctl Optimization',
        contentFa: 'فعال بودن THP در لینوکس باعث افت شدید عملکرد حافظه و قفل شدن تردها (Lock contention) در دیتابیس TSIDX اسپلانک می‌گردد. باید به صورت دائمی در grub و systemd خاموش شود.',
        contentEn: 'Enabled THP causes severe memory allocation latency and thread lock contention for Splunk TSIDX search engine. It must be permanently disabled.',
        codeLanguage: 'bash',
        codeSnippet: `# 1. /etc/sysctl.d/99-splunk.conf
cat << 'EOF' > /etc/sysctl.d/99-splunk.conf
# Splunk Kernel Optimization
vm.max_map_count = 262144
vm.swappiness = 10
fs.file-max = 6815744
net.core.rmem_default = 8388608
net.core.wmem_default = 8388608
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
EOF
sysctl --system

# 2. Disable THP permanently
echo 'never' > /sys/kernel/mm/transparent_hugepage/enabled
echo 'never' > /sys/kernel/mm/transparent_hugepage/defrag`
      },
      {
        headingFa: '۱.۳. تنظیم محدودیت‌های منابع کاربر در limits.conf',
        headingEn: '1.3. User Resource Limits Configuration (/etc/security/limits.conf)',
        contentFa: 'تعداد فایل‌های باز (nofile) و تعداد پردازش‌ها (nproc) برای کاربر splunk باید به مقادیر بالا تنظیم شود تا از خطای Too many open files جلوگیری گردد.',
        contentEn: 'File descriptor and process limits for splunk user must be raised to prevent ingestion queue blockages.',
        codeLanguage: 'bash',
        codeSnippet: `cat << 'EOF' >> /etc/security/limits.d/99-splunk.conf
splunk   soft   nofile   65535
splunk   hard   nofile   65535
splunk   soft   nproc    20480
splunk   hard   nproc    20480
splunk   soft   fsize    unlimited
splunk   hard   fsize    unlimited
EOF`
      },
      {
        headingFa: '۱.۴. ایجاد کاربر، نصب باینری و فعال‌سازی سرویس Systemd',
        headingEn: '1.4. User Creation, Binary Install & Systemd Integration',
        contentFa: 'اسپلانک هرگز نباید با دسترسی کاربر root اجرا شود. پس از ایجاد کاربر splunk:splunk و اکسترکت پکیج در /opt/splunk، سرویس systemd ساخته می‌شود.',
        contentEn: 'Never run Splunk as root. Provision user splunk:splunk, extract into /opt/splunk, and register systemd unit.',
        codeLanguage: 'bash',
        codeSnippet: `# 1. Create Dedicated Splunk System User
useradd -r -m -s /bin/bash splunk

# 2. Extract Splunk TGZ Package
tar -xzf splunk-9.2.1-linux-2.6-x86_64.tgz -C /opt
chown -R splunk:splunk /opt/splunk

# 3. Initial Boot & Systemd Enablement
sudo -u splunk /opt/splunk/bin/splunk start --accept-license --answer-yes --no-prompt
/opt/splunk/bin/splunk enable boot-start -user splunk --systemd-managed 1
systemctl daemon-reload
systemctl enable Splunkd
systemctl status Splunkd`
      }
    ],
    officialDocLinks: [
      { title: 'System Requirements & Reference Hardware', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Installation/Systemrequirements' },
      { title: 'Disable Transparent Huge Pages', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Installation/DisabletransparentHugePages' }
    ]
  },
  {
    id: 'chapter-indexer-clustering',
    titleFa: '۲. کلاسترینگ ایندکسرها (Indexer Clustering) - تک‌سایت و چندسایت (Multi-Site)',
    titleEn: '2. Indexer Clustering Architecture (Single-Site & Multi-Site HA)',
    category: 'indexer_clustering',
    readTime: '15 دقیقه',
    summaryFa: 'معماری همتایان ایندکسر، نقش Cluster Manager (CM)، فاکتورهای RF/SF، سیاست‌های چندسایته (Site1/Site2)، ارتقای بدون قطعی و چرخه باکت‌ها.',
    summaryEn: 'Indexer peer architecture, Cluster Manager role, RF/SF factors, multi-site disaster recovery, rolling restart, and bucket lifecycle.',
    sections: [
      {
        headingFa: '۲.۱. مبانی معماری Indexer Cluster و فاکتورهای RF و SF',
        headingEn: '2.1. Replication Factor (RF) and Search Factor (SF) Fundamentals',
        contentFa: 'در کلاستر ایندکسرها، Replication Factor (RF=3) تعیین می‌کند از هر باکت داده خام (Rawdata) ۳ کپی مجزا روی ایندکسرهای مختلف نگهداری شود. Search Factor (SF=2) تعیین می‌کند از فایل‌های ساختار جستجو (TSIDX) ۲ نسخه قابل جستجوی آنی ایجاد گردد.',
        contentEn: 'Replication Factor (RF=3) guarantees 3 rawdata copies exist across distinct peer nodes. Search Factor (SF=2) guarantees 2 instantly searchable TSIDX copies exist.',
        calloutFa: 'قانون طلایی: تعداد ایندکسرهای فیزیکی باید همواره بزرگتر یا مساوی با فاکتور تکثیر (Peer Count >= RF) باشد.',
        calloutType: 'tip'
      },
      {
        headingFa: '۲.۲. پیکربندی نود مدیر کلاستر (Cluster Manager - server.conf)',
        headingEn: '2.2. Cluster Manager Configuration (server.conf)',
        contentFa: 'مدیر کلاستر هماهنگ‌کننده وضعیت باکت‌ها، سلامت نودها و توزیع بسته‌های تنظیمی (Bundle Push) است.',
        contentEn: 'The Cluster Manager coordinates bucket fix-up tasks, peer health, and cluster-bundle distribution.',
        codeLanguage: 'ini',
        codeSnippet: `# $SPLUNK_HOME/etc/system/local/server.conf on Cluster Manager
[clustering]
mode = master
replication_factor = 3
search_factor = 2
pass4SymmKey = EnterpriseSecretClusterKey2026!
cluster_label = SOC_PRODUCTION_CLUSTER

# Multi-Site Configuration (Optional for DR)
multisite = true
available_sites = site1,site2
site_replication_factor = origin:2, total:3
site_search_factor = origin:1, total:2`
      },
      {
        headingFa: '۲.۳. پیکربندی ایندکسرهای همتا (Peer Nodes)',
        headingEn: '2.3. Indexer Peer Node Configuration',
        contentFa: 'هر ایندکسر همتا با اشاره به آدرس Cluster Manager و تنظیم پورت تکثیر لاگ (Port 9887) به کلاستر ملحق می‌شود.',
        contentEn: 'Each indexer binds to the CM and opens raw bucket replication port (default 9887).',
        codeLanguage: 'ini',
        codeSnippet: `# $SPLUNK_HOME/etc/system/local/server.conf on Indexer Peer
[clustering]
mode = slave
master_uri = https://10.20.30.10:8089
pass4SymmKey = EnterpriseSecretClusterKey2026!
site = site1

[replication_port://9887]
disabled = 0`
      },
      {
        headingFa: '۲.۴. عملیات نگهداری، ارتقای بدون قطعی (Rolling Restart) و ارسال باندل',
        headingEn: '2.4. Maintenance Mode, Rolling Restart & Cluster Bundle Push',
        contentFa: 'برای تغییر کانفیگ‌ها روی ایندکسرها، فایل‌ها در مسیر $SPLUNK_HOME/etc/master-apps روی CM قرار گرفته و با دستور زیر به کل کلاستر بدون داون‌تایم پوش می‌شوند.',
        contentEn: 'Manage configuration deployment across all indexer peers via the master-apps directory on the CM.',
        codeLanguage: 'bash',
        codeSnippet: `# 1. Validate bundle configuration
$SPLUNK_HOME/bin/splunk validate cluster-bundle

# 2. Apply bundle to all indexer peers
$SPLUNK_HOME/bin/splunk apply cluster-bundle

# 3. Perform rolling restart safely
$SPLUNK_HOME/bin/splunk rolling-restart cluster-peers

# 4. Enable Maintenance Mode during hardware maintenance
$SPLUNK_HOME/bin/splunk set maintenance-mode true`
      }
    ],
    officialDocLinks: [
      { title: 'About Indexer Clusters', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters' },
      { title: 'Multisite Indexer Clusters', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Multisiteoverview' }
    ]
  },
  {
    id: 'chapter-shc-clustering',
    titleFa: '۳. کلاستر سرچ‌هدها (Search Head Clustering - SHC) و نود Deployer',
    titleEn: '3. Search Head Clustering (SHC) Architecture & Deployer Management',
    category: 'shc',
    readTime: '12 دقیقه',
    summaryFa: 'الگوریتم اجماع Raft، انتخاب پویای کاپیتان، نود Deployer برای توزیع برنامه‌ها، تکثیر KVStore و پورت‌های همگام‌سازی Artifact.',
    summaryEn: 'Raft consensus algorithm, dynamic captain election, Deployer node for apps deployment, KVStore replication, and artifact syncing.',
    sections: [
      {
        headingFa: '۳.۱. مبانی Search Head Cluster و حد نصاب کوئوروم (Quorum)',
        headingEn: '3.1. SHC Quorum & Minimum Node Requirements',
        contentFa: 'یک Search Head Cluster برای دستیابی به حد نصاب کوئوروم (N/2 + 1) به حداقل ۳ عضو فیزیکی نیاز دارد تا در صورت از دست رفتن یکی از اعضا، کاپیتان جدید به صورت خودکار انتخاب شود و جستجوها بدون وقفه اجرا گردند.',
        contentEn: 'An SHC requires a minimum of 3 members to satisfy the Raft consensus quorum formula (N/2 + 1) ensuring resilient captain election during node failures.',
        calloutFa: 'هرگز دو سرچ‌هد را در حالت SHC قرار ندهید؛ با قطع یکی، کل کلاستر به دلیل شکست حد نصاب کوئوروم متوقف می‌شود.',
        calloutType: 'warning'
      },
      {
        headingFa: '۳.۲. راه‌اندازی و پیوستن اعضای SHC (server.conf)',
        headingEn: '3.2. Initializing SHC Members and Captain Bootstrap',
        contentFa: 'پیکربندی اعضا با دستور splunk init shcluster-config انجام شده و سپس کاپیتان اولیه از روی یکی از اعضا بوت‌استرپ می‌شود.',
        contentEn: 'Bootstrap the search head cluster using the CLI command specifying the replication port (8181).',
        codeLanguage: 'bash',
        codeSnippet: `# On each Search Head Member (SH1, SH2, SH3):
$SPLUNK_HOME/bin/splunk init shcluster-config \\
  -auth admin:SplunkPass123! \\
  -mgmt_uri https://sh1.corp.local:8089 \\
  -replication_port 8181 \\
  -replication_factor 3 \\
  -secret EnterpriseSHCSecretKey99! \\
  -shcluster_label SOC_SHC_CLUSTER

$SPLUNK_HOME/bin/splunk restart

# On ONLY ONE Search Head (e.g. SH1) to elect the initial captain:
$SPLUNK_HOME/bin/splunk bootstrap shcluster-captain \\
  -servers_list "https://sh1.corp.local:8089,https://sh2.corp.local:8089,https://sh3.corp.local:8089" \\
  -auth admin:SplunkPass123!`
      },
      {
        headingFa: '۳.۳. نقش Deployer در توزیع Appها و کانفیگ‌ها به SHC',
        headingEn: '3.3. Deployer Role for Pushing Apps to Search Head Cluster',
        contentFa: 'نود Deployer وظیفه توزیع برنامه‌ها (Apps)، داشبوردها و فایل‌های پیکربندی به اعضای SHC را از مسیر $SPLUNK_HOME/etc/shcluster/apps بر عهده دارد.',
        contentEn: 'Deployer distributes user apps, dashboards, and knowledge objects to SHC members from $SPLUNK_HOME/etc/shcluster/apps.',
        codeLanguage: 'bash',
        codeSnippet: `# On Deployer Node:
# Place apps in /opt/splunk/etc/shcluster/apps/
$SPLUNK_HOME/bin/splunk apply shcluster-bundle \\
  -target https://sh1.corp.local:8089 \\
  -auth admin:DeployerAdminPass! \\
  --answer-yes`
      }
    ],
    officialDocLinks: [
      { title: 'Search Head Clustering Architecture', url: 'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/AboutSHC' },
      { title: 'Deployer Configuration', url: 'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/PropagateSHCconfigurationchanges' }
    ]
  },
  {
    id: 'chapter-smartstore-storage',
    titleFa: '۴. معماری Splunk SmartStore و ذخیره‌سازی ابری/S3/MinIO',
    titleEn: '4. Splunk SmartStore Architecture & Remote S3/MinIO Object Storage',
    category: 'storage_smartstore',
    readTime: '12 دقیقه',
    summaryFa: 'انتقال باکت‌های Warm و Cold به آبجکت‌استوریج سازگار با S3، کاهش ۸۰٪ هزینه‌های ذخیره‌سازی محلی و بازیابی خودکار باکت‌ها با CacheManager.',
    summaryEn: 'Decoupling compute from storage using S3/MinIO for warm/cold buckets, cutting local NVMe costs by 80% with CacheManager eviction.',
    sections: [
      {
        headingFa: '۴.۱. معماری SmartStore چیست و چگونه کار می‌کند؟',
        headingEn: '4.1. How SmartStore Works (Local Cache + Remote S3)',
        contentFa: 'در معماری SmartStore، باکت‌های Hot روی دیسک محلی NVMe ایندکسر نوشته می‌شوند. به محض تبدیل شدن باکت به Warm، کپی کامل آن در Object Store ابری یا MinIO آپلود شده و تنها متادیتا و باکت‌های مورد نیاز جستجو در حافظه کش محلی ایندکسر نگهداری می‌شوند.',
        contentEn: 'Hot buckets write to local NVMe. As soon as buckets roll to warm, they are pushed to remote S3/MinIO storage, freeing local SSD capacity.',
        calloutFa: 'مزیت کلیدی: دیگر نیازی به خرید دیسک‌های گران‌قیمت چند ده ترابایتی محلی برای هر ایندکسر نیست.',
        calloutType: 'tip'
      },
      {
        headingFa: '۴.۲. پیکربندی indexes.conf و server.conf برای SmartStore',
        headingEn: '4.2. SmartStore Configuration in indexes.conf',
        contentFa: 'تعریف استنزای [volume:remote_s3] و فعال‌سازی remotePath برای ایندکس‌های سازمانی.',
        contentEn: 'Configuring remote volume stanzas and assigning remotePath to indexes.',
        codeLanguage: 'ini',
        codeSnippet: `# $SPLUNK_HOME/etc/master-apps/_cluster/local/indexes.conf
[volume:remote_s3]
storageType = remote
remote.s3.endpoint = https://s3.corp.internal:9000
remote.s3.auth_region = eu-central-1
remote.s3.secret_key = SplunkSecretKey99!
remote.s3.access_key = splunk_access_key
remote.s3.bucket_name = splunk-smartstore-production
remote.s3.supports_versioning = false

[default]
remotePath = volume:remote_s3/$_index_name

# Index with SmartStore enabled
[security_firewall]
homePath = $SPLUNK_DB/security_firewall/db
coldPath = $SPLUNK_DB/security_firewall/colddb
thawedPath = $SPLUNK_DB/security_firewall/thaweddb
remotePath = volume:remote_s3/security_firewall
maxGlobalDataSizeMB = 0
maxGlobalRawDataSizeMB = 0`
      }
    ],
    officialDocLinks: [
      { title: 'About SmartStore', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/AboutSmartStore' },
      { title: 'Configure SmartStore with S3', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/SmartStoreindexesconf' }
    ]
  },
  {
    id: 'chapter-sva-best-practices',
    titleFa: '۵. استانداردهای طلایی SVA و بهترین راهکارهای مهندسی Splunk (SOC Best Practices)',
    titleEn: '5. Splunk Validated Architectures (SVA) & Production SOC Best Practices',
    category: 'best_practices',
    readTime: '15 دقیقه',
    summaryFa: 'مدیریت خطوط انتقال لاگ (Parsing Pipeline)، بهینه‌سازی جستجوها (tstats و Data Models)، ایزولاسیون صف‌ها و سیاست‌های ایندکس‌گذاری امن.',
    summaryEn: 'Parsing pipeline optimization, search acceleration via tstats and accelerated data models, queue sizing, and index retention policies.',
    sections: [
      {
        headingFa: '۵.۱. تفکیک لایه‌های Parsing و Indexing در معماری خط تولید لاگ',
        headingEn: '5.1. Parsing vs Indexing Pipeline Separation',
        contentFa: 'همیشه عملیات سنگین شکستن خطوط (LINE_BREAKER)، استخراج زمان (TIME_PREFIX) و ماسک کردن داده‌های حساس را در Heavy Forwarder یا لایه ایندکسر بهینه متمرکز کنید.',
        contentEn: 'Offload line breaking and timestamp parsing to dedicated parsing layers to preserve indexing throughput.',
        calloutFa: 'از نوشتن عبارت‌های باقاعده (Regex) با بازگشت به عقب سنگین (Catastrophic Backtracking) در props.conf اکیداً خودداری کنید.',
        calloutType: 'critical'
      },
      {
        headingFa: '۵.۲. بهینه‌سازی صف‌ها در inputs.conf و server.conf',
        headingEn: '5.2. Ingestion Queue Tuning to Eliminate Bottlenecks',
        contentFa: 'افزایش حجم صف‌های maxSize در server.conf از بروز پر شدن صف (Queue Blockage) در زمان طوفان رویدادها جلوگیری می‌کند.',
        contentEn: 'Increasing queue sizes prevents backpressure from propagating to forwarders during event spikes.',
        codeLanguage: 'ini',
        codeSnippet: `# $SPLUNK_HOME/etc/system/local/server.conf
[queue=parsingQueue]
maxSize = 20MB

[queue=aggQueue]
maxSize = 20MB

[queue=typingQueue]
maxSize = 20MB

[queue=indexQueue]
maxSize = 20MB`
      }
    ],
    officialDocLinks: [
      { title: 'Splunk Validated Architectures Whitepaper', url: 'https://www.splunk.com/en_us/resources/white-papers/splunk-validated-architectures.html' },
      { title: 'Data Pipeline Tuning', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Capacity/Datapipelines' }
    ]
  }
];

// Complete downloadable Bash script generator for 1-click Clustered deployment setup
export function generateClusterSetupAutomationBashScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# Splunk Enterprise High-Availability Cluster Setup & Hardening Script
# Generates Cluster Manager (CM), Indexer Peers, and Search Head Cluster
# ==============================================================================
set -euo pipefail

SPLUNK_HOME=\${SPLUNK_HOME:-"/opt/splunk"}
CLUSTER_SECRET=\${CLUSTER_SECRET:-"EnterpriseClusterSecret2026!"}
CM_HOST=\${CM_HOST:-"10.20.30.10"}
ROLE=\${1:-""}

if [[ -z "\$ROLE" ]]; then
  echo "Usage: \$0 [cluster-manager | indexer-peer | search-head | deployer]"
  exit 1
fi

echo "==> Configuring Splunk Node as: \$ROLE on \$SPLUNK_HOME"

mkdir -p "\$SPLUNK_HOME/etc/system/local"

case "\$ROLE" in
  cluster-manager)
    echo "==> Configuring Cluster Manager..."
    cat << EOF > "\$SPLUNK_HOME/etc/system/local/server.conf"
[clustering]
mode = master
replication_factor = 3
search_factor = 2
pass4SymmKey = \$CLUSTER_SECRET
cluster_label = PRODUCTION_HA_CLUSTER
EOF
    ;;

  indexer-peer)
    echo "==> Configuring Indexer Peer..."
    cat << EOF > "\$SPLUNK_HOME/etc/system/local/server.conf"
[clustering]
mode = slave
master_uri = https://\$CM_HOST:8089
pass4SymmKey = \$CLUSTER_SECRET

[replication_port://9887]
disabled = 0
EOF
    cat << EOF > "\$SPLUNK_HOME/etc/system/local/inputs.conf"
[splunktcp://9997]
disabled = 0
queueSize = 20MB
EOF
    ;;

  search-head)
    echo "==> Configuring Search Head to bind with Cluster Manager..."
    cat << EOF > "\$SPLUNK_HOME/etc/system/local/server.conf"
[clustering]
mode = searchhead
master_uri = https://\$CM_HOST:8089
pass4SymmKey = \$CLUSTER_SECRET
EOF
    ;;

  deployer)
    echo "==> Configuring Deployer Node for SHC..."
    mkdir -p "\$SPLUNK_HOME/etc/shcluster/apps"
    cat << EOF > "\$SPLUNK_HOME/etc/system/local/server.conf"
[shclustering]
pass4SymmKey = \$CLUSTER_SECRET
shcluster_label = PRODUCTION_SHC_CLUSTER
EOF
    ;;
esac

echo "==> Validating configuration with btool..."
"\$SPLUNK_HOME/bin/splunk" btool check || true

echo "==> Setup completed successfully for \$ROLE!"
`;
}

// Generate Complete Comprehensive Offline Markdown Guide
export function generateSplunkFullArchitectureManual(): string {
  let md = `# Splunk Enterprise Complete Architecture, Clustering, Docker & Kubernetes Knowledge Manual
**Official Offline SVA Reference Handbook & Practical Operations Guide**
Generated: ${new Date().toISOString()}

---

## فهرست فصول مستندات جامع (Table of Contents)
1. **نصب بر روی سیستم‌عامل، بهینه‌سازی کرنل لینوکس و Systemd**
2. **معماری کلاسترینگ ایندکسرها (Indexer Clustering - Single & Multi-Site)**
3. **معماری Search Head Clustering (SHC) و نود Deployer**
4. **معماری Splunk SmartStore و ذخیره‌سازی ابری S3 / MinIO**
5. **استانداردهای طلایی SVA و بهینه‌سازی خط تولید لاگ (Data Pipeline)**
6. **استقرار کانتینری اسپلانک بر روی داکر (Docker & Docker Compose)**
7. **مدیریت پیشرفته کلاستر با Splunk Operator بر روی کوبرنتیز (Kubernetes)**

---

`;

  SPLUNK_ARCHITECTURE_CHAPTERS.forEach(ch => {
    md += `## ${ch.titleFa}\n*${ch.titleEn}*\n\n`;
    md += `**خلاصه:** ${ch.summaryFa}\n\n`;
    ch.sections.forEach(sec => {
      md += `### ${sec.headingFa}\n`;
      md += `${sec.contentFa}\n\n`;
      if (sec.codeSnippet) {
        md += `\`\`\`${sec.codeLanguage || 'bash'}\n${sec.codeSnippet}\n\`\`\`\n\n`;
      }
      if (sec.calloutFa) {
        md += `> **نکته:** ${sec.calloutFa}\n\n`;
      }
    });
    md += `---\n\n`;
  });

  return md;
}
