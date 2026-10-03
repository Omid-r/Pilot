import { 
  SvaAuditCheckItem, 
  IndexerSizingBenchmark, 
  SearchConcurrencyBenchmark, 
  StorageVolumeMath, 
  FutureRiskItem, 
  SizingCalculatorInput, 
  SizingCalculatorResult 
} from '../types';

export const INITIAL_SVA_AUDIT_CHECKS: SvaAuditCheckItem[] = [
  {
    id: 'sva-topo-01',
    category: 'TOPOLOGY',
    titleFa: 'تفکیک لایه‌های معماری و حذف هم‌پوشانی (Colocation Anti-Pattern)',
    titleEn: 'Tier Segregation & Zero Colocation of Search Head / Indexer',
    status: 'COMPLIANT',
    currentValue: 'محیط توزیع‌شده با نودهای مستقل SH و IDX',
    bestPracticeBenchmark: 'Splunk Validated Architecture (SVA C1/C11): Search Head و Indexer هرگز نباید روی یک سرور مشترک اجرا شوند.',
    impactFa: 'جلوگیری از قفل‌شدن رم و مصرف بی‌رویه I/O دیسک در اثر اجرای همزمان کوئری‌های سنگین و دریافت استریم لاگ.',
    impactEn: 'Eliminates resource contention on CPU and Disk IO between heavy searches and real-time ingestion.',
    remediationFa: 'معماری مطابق استانداردهای SVA پیاده‌سازی شده و نقش‌ها تفکیک گردیده‌اند.',
    remediationEn: 'Architecture strictly complies with SVA tier segregation.',
    relevantConfFile: 'server.conf / distsearch.conf',
    architectSeverity: 'HIGH'
  },
  {
    id: 'sva-ingest-01',
    category: 'INGESTION_PIPELINE',
    titleFa: 'استفاده از پایپ‌لاین‌های چندگانه ایندکس (parallelIngestionPipelines / pipelineSet)',
    titleEn: 'Multiple Ingestion Pipeline Sets (pipelineSet = 2)',
    status: 'WARNING',
    currentValue: 'pipelineSet = 1 (حالت پیش‌فرض تک پایپ‌لاین)',
    bestPracticeBenchmark: 'در ترافیک بالاتر از 250 GB/Day روی سرورهای با بیش از ۱۶ هسته CPU، مقدار pipelineSet=2 باید در [splunktcp] فعال باشد.',
    impactFa: 'محدودیت بازدهی دریافت لاگ روی یک تک‌ترد CPU (گلوگاه دریافت لاگ در پورت ۹۹۹۷ با وجود منابع آزاد پردازنده).',
    impactEn: 'Restricts ingestion throughput to a single CPU core, creating an artificial 9997 bottleneck.',
    remediationFa: 'تنظیم `pipelineSet = 2` در فایل `server.conf` زیر استنزای `[splunktcp]` و ارتقای صف‌های `typingQueue` و `aggQueue`.',
    remediationEn: 'Configure `pipelineSet = 2` in server.conf under [splunktcp] on all Indexers.',
    relevantConfFile: 'server.conf',
    confSnippet: `[splunktcp://9997]
pipelineSet = 2
connection_host = ip

[queue=parsingQueue]
maxSize = 64MB

[queue=aggQueue]
maxSize = 64MB`,
    architectSeverity: 'HIGH'
  },
  {
    id: 'sva-storage-01',
    category: 'STORAGE_RETENTION',
    titleFa: 'تفکیک مسیر ذخیره‌سازی Hot/Warm (NVMe/Fast SSD) از Cold (High-Capacity HDD/NFS)',
    titleEn: 'Tiered Storage Architecture (Hot/Warm on NVMe vs Cold Path)',
    status: 'CRITICAL_VIOLATION',
    currentValue: 'هم مسیر Hot و هم Cold روی یک ولوم اشتراکی SAS HDD قرار دارند (بدون تفکیک IOPS)',
    bestPracticeBenchmark: 'دیزاین SVA نیازمند حداقل 1000+ IOPS برای دایرکتوری `homePath` (Hot/Warm) و دیسک‌های پرظرفیت برای `coldPath` است.',
    impactFa: 'افت شدید سرعت کوئری‌های بلادرنگ و ایجاد بافر در صف ایندکسر در هنگام نوشتن همزمان باکت‌های گرم و رول به سرد.',
    impactEn: 'Severe search latency and indexer queue clogging when rolling buckets on high-latency spinning disks.',
    remediationFa: 'تفکیک ولوم‌های `homePath` به استوریج NVMe/Fast SSD و انتقال `coldPath` به ولوم‌های پرحجم HDD با تعریف Volume در indexes.conf.',
    remediationEn: 'Define separate storage volumes in indexes.conf targeting NVMe for homePath and SAS for coldPath.',
    relevantConfFile: 'indexes.conf',
    confSnippet: `[volume:hot_warm_nvme]
path = /opt/splunk/data/hot_warm
maxVolumeDataSizeMB = 2000000

[volume:cold_storage]
path = /opt/splunk/data/cold
maxVolumeDataSizeMB = 8000000

[main]
homePath = volume:hot_warm_nvme/defaultdb/db
coldPath = volume:cold_storage/defaultdb/colddb
thawedPath = /opt/splunk/data/thawed/defaultdb/thaweddb
maxDataSize = auto_high_volume
maxTotalDataSizeMB = 10000000`,
    architectSeverity: 'CRITICAL'
  },
  {
    id: 'sva-search-01',
    category: 'SEARCH_TIER',
    titleFa: 'مدیریت سرچ‌های همزمان و جلوگیری از Skip شدن الرت‌های برنامه‌ریزی شده',
    titleEn: 'Search Concurrency Sizing & Scheduled Search Skip Avoidance',
    status: 'WARNING',
    currentValue: 'نسبت سرچ‌های اسکجول ۷۰٪ با ۲۴ هسته SH و میزان Skip Rate = ۴.۸٪',
    bestPracticeBenchmark: 'میزان Skip Rate سرچ‌ها باید زیر ۱٪ باشد. فرمول سرچ مجاز: max_searches = max_searches_per_cpu * cores + base_max_searches.',
    impactFa: 'برخی الرت‌های امنیتی SOC به دلیل کمبود اسلات سرچ همزمان اجرا نشده یا با تاخیر مواجه می‌شوند.',
    impactEn: 'Security correlation searches and scheduled alerts are dropped or delayed due to concurrency exhaustion.',
    remediationFa: 'افزایش سرچ‌هد به کلاستر ۳ نودی SHC، اصلاح زمان‌بندی (پخش کردن کرون‌جاب‌ها در طول ساعت با windowing) و فعال‌سازی `auto_summary_percent`.',
    remediationEn: 'Distribute scheduled search cron intervals, implement search windowing, and expand to a 3-node SHC.',
    relevantConfFile: 'limits.conf / savedsearches.conf',
    confSnippet: `[search]
max_searches_per_cpu = 2
base_max_searches = 6
max_rt_search_multiplier = 1

[scheduler]
max_searches_perc = 70
auto_summary_percent = 70
schedule_window = auto`,
    architectSeverity: 'HIGH'
  },
  {
    id: 'sva-ha-01',
    category: 'HIGH_AVAILABILITY',
    titleFa: 'تنظیم ضریب ماندگاری و جستجو پذیری کلاستر (RF=3 و SF=2)',
    titleEn: 'Replication Factor (RF=3) & Search Factor (SF=2) Compliance',
    status: 'COMPLIANT',
    currentValue: 'Replication Factor = 3, Search Factor = 2 فعال در Cluster Master',
    bestPracticeBenchmark: 'استاندارد سازمانی SVA C1/C11: ضریب RF=3 و SF=2 تضمین‌کننده مقاومت در برابر از دست رفتن همزمان ۲ نود ایندکسر است.',
    impactFa: 'تداوم ۱۰۰٪ دریافت لاگ و عدم از دست رفتن داده‌ها در صورت کرش یا قطعی ناگهانی ایندکسرها.',
    impactEn: 'Guarantees zero data loss and search continuity during concurrent node outages.',
    remediationFa: 'تنظیمات کاملاً منطبق بر استاندارد طلایی اسپلانک است.',
    remediationEn: 'Fully compliant with Splunk Validated Architecture recommendations.',
    relevantConfFile: 'server.conf (Cluster Master)',
    architectSeverity: 'HIGH'
  },
  {
    id: 'sva-fwd-01',
    category: 'INGESTION_PIPELINE',
    titleFa: 'توزیع بار دینامیک فورواردرها و چرخش کانکشن TCP (autoLBFrequency / autoLBVolume)',
    titleEn: 'Dynamic Forwarder Load Balancing & Indexer Channel Rotation',
    status: 'WARNING',
    currentValue: 'autoLBFrequency = 30s بدون تعریف autoLBVolume (ریسک باکت نامتقارن)',
    bestPracticeBenchmark: 'تعریف همزمان `autoLBVolume = 10485760` (10MB) و `autoLBFrequency = 30` جهت پیشگیری از انباشتگی حجم روی یک ایندکسر خاص.',
    impactFa: 'عدم تقارن حجم داده روی ایندکسرها (Data Skew)، داغ شدن بیش از حد یک نود و افت کارایی جستجوهای موازی.',
    impactEn: 'Data skew on indexers causing unbalanced disk usage and degraded parallel map-reduce performance.',
    remediationFa: 'اعمال تنظیمات استاندارد توزیع بار در `outputs.conf` فورواردرها از طریق Deployment Server.',
    remediationEn: 'Deploy autoLBVolume and autoLBFrequency policies via Deployment Server outputs.conf.',
    relevantConfFile: 'outputs.conf',
    confSnippet: `[tcpout]
defaultGroup = primary_indexers
autoLBFrequency = 30
autoLBVolume = 10485760

[tcpout:primary_indexers]
server = idx1.corp.internal:9997, idx2.corp.internal:9997, idx3.corp.internal:9997
useACK = true`,
    architectSeverity: 'MEDIUM'
  },
  {
    id: 'sva-sec-01',
    category: 'SECURITY_RBAC',
    titleFa: 'رمزنگاری TLS 1.3 سرتاسری و غیرفعال‌سازی پروتکل‌های منسوخ SSLv3/TLS 1.0',
    titleEn: 'Strict TLS 1.3 Encryption & Deprecation of Insecure Ciphers',
    status: 'COMPLIANT',
    currentValue: 'sslVersions = tls1.2, tls1.3 با گواهینامه‌های سازمانی معتبر',
    bestPracticeBenchmark: 'ممنوعیت استفاده از رمزنگاری پیش‌فرض اسپلانک (Default Certificates) و ارتقا به گواهینامه‌های اختصاصی با حداقل RSA 2048/4096.',
    impactFa: 'پیشگیری کامل از حملات Man-in-the-Middle و استراق سمع ترافیک لاگ‌های حساس بانکی و سازمانی در شبکه.',
    impactEn: 'Full protection against MITM eavesdropping and compliance with ISO 27001 / PCI-DSS.',
    remediationFa: 'گواهینامه‌های سفارشی در تمام نودها فعال و مانیتور می‌شوند.',
    remediationEn: 'Enterprise custom PKI certificates active on all ports.',
    relevantConfFile: 'server.conf / inputs.conf',
    architectSeverity: 'HIGH'
  }
];

export const INITIAL_INDEXER_BENCHMARK: IndexerSizingBenchmark = {
  currentDailyIngestGb: 350,
  peakMultiplier: 1.8,
  currentPeakEps: 18500,
  actualIndexerCount: 2,
  recommendedIndexerCount: 3,
  coresPerIndexerCurrent: 16,
  coresPerIndexerRecommended: 24,
  ramPerIndexerGbCurrent: 32,
  ramPerIndexerGbRecommended: 64,
  iopsMeasured: 450,
  iopsRequired: 1200,
  storageTypeCurrent: 'Standard SAS HDD (RAID 10)',
  storageTypeRecommended: 'Enterprise NVMe SSD (PCIe Gen4) for Hot/Warm',
  pipelineSetsConfigured: 1,
  pipelineSetsRecommended: 2,
  indexingCapacityGbPerDay: 400,
  utilizationPct: 87.5
};

export const INITIAL_SEARCH_BENCHMARK: SearchConcurrencyBenchmark = {
  searchHeadCount: 1,
  coresPerSearchHead: 16,
  baseMaxSearches: 6,
  maxSearchesPerCpu: 2,
  totalHistoricalSearchConcurrency: 38, // 16 * 2 + 6 = 38
  maxScheduledSearchPerc: 50,
  maxScheduledSearchesAllowed: 19, // 38 * 0.5 = 19
  currentScheduledSearchesPerInterval: 22, // Exceeds limit by 3!
  scheduledSearchSkippedRatePct: 5.2,
  realtimeSearchCount: 3,
  kvstoreMemoryUsageMb: 2840,
  kvstoreStatus: 'HEALTHY',
  shcRaftElectionStatus: 'STABLE'
};

export const INITIAL_STORAGE_MATH: StorageVolumeMath = {
  dailyIngestGb: 350,
  hotWarmRetentionDays: 30,
  coldRetentionDays: 90,
  frozenRetentionDays: 365,
  compressionRatio: 0.60, // 50% raw + 10% tsidx
  replicationFactor: 3,
  searchFactor: 2,
  hotWarmTotalTb: 18.9, // 350GB * 30 days * 0.6 * RF 3 / 1000 = ~18.9 TB
  coldTotalTb: 37.8,    // 350GB * 60 days cold * 0.6 * RF 3 / 1000 = ~37.8 TB
  totalLocalDiskTb: 56.7,
  smartStoreOffloadedTb: 0,
  annualStorageGrowthTb: 76.65
};

export const FUTURE_ARCHITECTURAL_RISKS: FutureRiskItem[] = [
  {
    id: 'risk-iops-01',
    titleFa: 'اشباع گلوگاه دیسک IOPS در صورت رشد لاگ به ۵۰۰ گیگابایت در روز',
    titleEn: 'Hot Bucket IOPS Bottleneck upon reaching 500GB/Day Ingestion',
    horizon: 'NEXT_90_DAYS',
    probability: 'HIGH',
    impactArea: 'INDEXING_COLLAPSE',
    triggerConditionFa: 'افزایش حجم سورس‌های لاگ بانکی از ۳۵۰ به ۵۰۰ گیگابایت در روز روی استوریج مکانیکی فعلی (۴۵۰ IOPS).',
    triggerConditionEn: 'Daily ingest expanding beyond 500GB/day on current 450 IOPS SAS storage.',
    architectEarlyWarningSign: 'بالا رفتن utilization صف‌های `tcpin_queue` و پر شدن بافر حافظه فورواردرها تا مرز ۱۰۰٪.',
    proactiveRemediationFa: 'مهاجرت مسیر `homePath` به استوریج All-Flash NVMe با توان حداقل ۱۲۰۰ IOPS برای هر ایندکسر قبل از رسیدن به ماه آینده.',
    proactiveRemediationEn: 'Migrate homePath to All-Flash NVMe (1200+ IOPS per indexer) before month-end.'
  },
  {
    id: 'risk-search-skip-02',
    titleFa: 'انفجار پرش (Skip) الرت‌های امنیتی SOC با راه‌اندازی ماژول Enterprise Security',
    titleEn: 'Severe Scheduled Search Skip Rate upon Splunk ES Activation',
    horizon: 'NEXT_30_DAYS',
    probability: 'CERTAIN',
    impactArea: 'SEARCH_DEGRADATION',
    triggerConditionFa: 'افزودن بیش از ۶۰ کوئری همبستگی (Correlation Searches) روی تک سرچ‌هد فعلی با ۱۶ هسته CPU.',
    triggerConditionEn: 'Enabling 60+ ES Correlation Searches on a standalone 16-core Search Head.',
    architectEarlyWarningSign: 'ثبت خطای `Search not executed: The maximum number of concurrent searches has been reached` در لاگ `scheduler.log`.',
    proactiveRemediationFa: 'ارتقای سرچ‌هد به کلاستر ۳ نودی SHC با حداقل ۳۲ هسته CPU اختصاصی برای هر عضو و تنظیم `max_searches_perc = 75` در `savedsearches.conf`.',
    proactiveRemediationEn: 'Deploy a 3-node SHC with 32 vCPUs per node and adjust max_searches_perc to 75% for ES.'
  },
  {
    id: 'risk-spof-ds-03',
    titleFa: 'نقطه شکست تکی (SPOF) در سرور Deployment Server و عدم دریافت کانفیگ نودها در بحران',
    titleEn: 'Single Point of Failure (SPOF) on Deployment Server & License Master',
    horizon: 'NEXT_180_DAYS',
    probability: 'MEDIUM',
    impactArea: 'DATA_LOSS_SPOF',
    triggerConditionFa: 'کرش فیزیکی نود DS/LM به دلیل عدم وجود Standby یا مکانیزم High Availability خودکار.',
    triggerConditionEn: 'Physical hardware failure of the standalone DS/LM host.',
    architectEarlyWarningSign: 'افزایش زمان Phone-Home بیش از ۶۰ ثانیه و تاخیر در توزیع Appها به فورواردرها.',
    proactiveRemediationFa: 'ایجاد نود Secondary Cold/Warm Standby برای Deployment Server و سینک خودکار دایرکتوری `/opt/splunk/etc/deployment-apps` با rsync/git.',
    proactiveRemediationEn: 'Implement active-passive cold standby for DS and synchronize deployment-apps using Git/Ansible.'
  },
  {
    id: 'risk-smartstore-04',
    titleFa: 'سرریز حجم دیسک محلی ایندکسرها در انتهای سال به بیش از ۷۵ ترابایت',
    titleEn: 'Annual Storage Exhaustion Exceeding 75TB Without S3 SmartStore',
    horizon: 'WITHIN_1_YEAR',
    probability: 'HIGH',
    impactArea: 'DISK_EXHAUSTION',
    triggerConditionFa: 'نگهداری داده‌های Cold روی دیسک‌های گران‌قیمت محلی برای دوره ۳۶۵ روزه انطباق بانکی.',
    triggerConditionEn: 'Retaining 365 days of compliance data on expensive direct-attached storage.',
    architectEarlyWarningSign: 'رسیدن میزان فضای خالی پارتیشن `/opt/splunk` به آستانه بحرانی `minFreeSpace` (زیر ۵ گیگابایت) و متوقف شدن ایندکس.',
    proactiveRemediationFa: 'راه‌اندازی معماری هیبریدی SmartStore با اتصال به ذخیره‌ساز ابری شیءگرا (MinIO / S3 Object Storage) جهت انتقال خودکار باکت‌های Warm به S3.',
    proactiveRemediationEn: 'Deploy Splunk SmartStore backed by enterprise S3 / MinIO object storage for transparent warm-bucket offloading.'
  }
];

export function calculateSplunkArchitectureSizing(input: SizingCalculatorInput): SizingCalculatorResult {
  const dailyGb = Math.max(10, input.dailyIngestGb);
  const peakGb = dailyGb * (input.peakFactor || 1.5);
  
  // Standard Splunk Indexer Capacity Benchmark:
  // Standard Indexer (16-24 vCPU, 64GB RAM): 150 - 300 GB/day per indexer with ES
  const gbPerIndexerCapacity = input.hasEnterpriseSecurity ? 150 : 250;
  let rawIndexerCount = Math.ceil(peakGb / gbPerIndexerCapacity);
  
  // Clustered high availability minimum rule:
  const minIndexers = input.multiSiteDr ? 4 : (input.replicationFactor >= 3 ? 3 : 2);
  const recommendedIndexers = Math.max(minIndexers, rawIndexerCount);

  // Search Head Sizing:
  // Base 1 SH for ad-hoc users (up to 15 concurrent users)
  // For ES or ITSI, dedicated SH / SHC is mandatory (minimum 3 members for SHC)
  let recommendedSearchHeads = 1;
  if (input.hasEnterpriseSecurity || input.hasItSI || input.concurrentUsers > 20) {
    recommendedSearchHeads = Math.max(3, Math.ceil(input.concurrentUsers / 15) + (input.hasEnterpriseSecurity ? 2 : 1));
  }

  // HF & Syslog (SC4S) Sizing:
  // 1 SC4S / HF pair per 400 GB/day of syslog/unstructured data
  const recommendedHfSc4s = Math.max(2, Math.ceil(dailyGb / 350));

  // Hardware Specs per Indexer:
  const vCpuPerIndexer = input.hasEnterpriseSecurity ? 24 : 16;
  const ramGbPerIndexer = input.hasEnterpriseSecurity ? 64 : 32;
  const iopsTargetPerIndexer = input.hasEnterpriseSecurity ? 1200 : 800;

  // Storage Math:
  // Raw Data Compression: ~50% raw size + 10-15% TSIDX metadata = 0.60
  const compressionRatio = 0.60;
  const dailyEffectiveGb = dailyGb * compressionRatio;
  
  // Storage factoring in Replication Factor:
  const rfMultiplier = input.replicationFactor || 3;
  const hotWarmDays = input.hotWarmRetentionDays || 30;
  const coldDays = input.coldRetentionDays || 90;

  let hotWarmStorageTbTotal = (dailyEffectiveGb * hotWarmDays * rfMultiplier) / 1024;
  let coldStorageTbTotal = (dailyEffectiveGb * coldDays * (input.useSmartStore ? 1 : rfMultiplier)) / 1024;
  let smartStoreS3TbTotal = 0;

  if (input.useSmartStore) {
    smartStoreS3TbTotal = coldStorageTbTotal;
    coldStorageTbTotal = 0; // Offloaded to S3!
  }

  // Concurrency calculation:
  // max_searches = max_searches_per_cpu * cores + base_max_searches
  const shCores = 16;
  const searchesPerSH = (2 * shCores) + 6; // 38
  const searchConcurrencyLimit = searchesPerSH * recommendedSearchHeads;

  // Ingestion Network bandwidth:
  // dailyGb in MB/s * 8 for Mbps
  const avgIngestMbps = ((dailyGb * 1024) / 86400) * 8;
  const peakIngestMbps = avgIngestMbps * (input.peakFactor || 1.5);
  const networkBandwidthIngestGbps = parseFloat((peakIngestMbps / 1000).toFixed(2));

  // Management Nodes:
  const recommendedMgmtNodes = [
    { name: 'Cluster Master (CM / Manager Node)', specs: '8 vCPU, 16 GB RAM, 100 GB SSD' },
    { name: 'Deployment Server (DS)', specs: '8 vCPU, 16 GB RAM, 250 GB SSD (High Socket Concurrency)' },
    { name: 'License Master (LM)', specs: '4 vCPU, 8 GB RAM, 50 GB SSD (Colocatable with DS)' },
    { name: 'Monitoring Console (MC / DMC)', specs: '8 vCPU, 16 GB RAM, 150 GB SSD' }
  ];

  if (recommendedSearchHeads >= 3) {
    recommendedMgmtNodes.push({
      name: 'Deployer (SHC App Distribution)',
      specs: '4 vCPU, 8 GB RAM, 100 GB SSD'
    });
  }

  const totalHardwareBillOfMaterials = [
    {
      component: 'Splunk Indexer Peers (Cluster)',
      nodeCount: recommendedIndexers,
      totalCores: recommendedIndexers * vCpuPerIndexer,
      totalRamGb: recommendedIndexers * ramGbPerIndexer,
      storageTb: parseFloat((hotWarmStorageTbTotal + (input.useSmartStore ? 0 : coldStorageTbTotal)).toFixed(1)),
      recommendedRole: 'Indexing, TSIDX Generation, Bucket Replication (RF=3/SF=2)'
    },
    {
      component: 'Splunk Search Heads (SHC)',
      nodeCount: recommendedSearchHeads,
      totalCores: recommendedSearchHeads * 16,
      totalRamGb: recommendedSearchHeads * 32,
      storageTb: parseFloat((recommendedSearchHeads * 0.5).toFixed(1)),
      recommendedRole: 'Map-Reduce Search Coordination, Enterprise Security & Dashboards'
    },
    {
      component: 'Splunk Connect for Syslog (SC4S) / Heavy Forwarders',
      nodeCount: recommendedHfSc4s,
      totalCores: recommendedHfSc4s * 8,
      totalRamGb: recommendedHfSc4s * 16,
      storageTb: parseFloat((recommendedHfSc4s * 0.2).toFixed(1)),
      recommendedRole: 'Syslog 514/6514 Parsing, HEC Pre-Processing, Data Masking'
    },
    {
      component: 'Management & Orchestration Tier (CM, DS, LM, MC, Deployer)',
      nodeCount: recommendedMgmtNodes.length,
      totalCores: recommendedMgmtNodes.length * 8,
      totalRamGb: recommendedMgmtNodes.length * 16,
      storageTb: 1.0,
      recommendedRole: 'Cluster Management, App Distribution, Health Telemetry'
    }
  ];

  return {
    recommendedIndexers,
    recommendedSearchHeads,
    recommendedHfSc4s,
    recommendedMgmtNodes,
    vCpuPerIndexer,
    ramGbPerIndexer,
    iopsTargetPerIndexer,
    hotWarmStorageTbTotal: parseFloat(hotWarmStorageTbTotal.toFixed(1)),
    coldStorageTbTotal: parseFloat(coldStorageTbTotal.toFixed(1)),
    smartStoreS3TbTotal: parseFloat(smartStoreS3TbTotal.toFixed(1)),
    searchConcurrencyLimit,
    networkBandwidthIngestGbps,
    totalHardwareBillOfMaterials
  };
}
