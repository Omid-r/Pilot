import { ComponentProfile } from '../types';

export const COMPONENT_PROFILES: ComponentProfile[] = [
  {
    id: 'heavy_forwarder',
    nameFa: 'هوی فورواردر اسپلانک (Heavy Forwarder - HF)',
    nameEn: 'Splunk Heavy Forwarder (HF)',
    shortName: 'HF-GW01',
    icon: 'Network',
    dutyFa: 'وظیفه این کامپوننت: دریافت جریان خام لاگ از سرورها و تجهیزات مختلف، پارس کردن و استخراج فیلد اولیه (Parsing Pipeline)، ماسک‌کردن اطلاعات حساس و کارت‌های بانکی، فیلتر کردن رویدادهای هرزنامه (NullQueue)، و ارسال توزیع‌شده و رمزنگاری‌شده (Load Balanced TLS) به ایندکسرهای کلاستر.',
    dutyEn: 'Ingests raw telemetry across syslog, splunktcp & HEC, runs parsing pipelines, strips/masks sensitive PII, drops noise via nullQueue, and load-balances TLS streams to indexers.',
    howItWorksFa: 'در Heavy Forwarder یک نمونه کامل از Splunkd اجرا می‌شود. بسته‌های شبکه وارد پورتهای ۵۱۴ و ۹۹۹۷ و ۸۰۸۸ می‌شوند، از طریق inputs.conf به AggregatorMiningProcessor منتقل می‌گردند. در این مرحله اد‌آن‌های Splunk_TA_paloalto و Splunk_TA_linux قواعد props.conf و transforms.conf را برای تفکیک خطوط و استخراج فیلدها اعمال می‌کنند. سپس خروجی در tcpoutQueue ذخیره شده و از طریق کانال outputs.conf به ایندکسرها فرستاده می‌شود.',
    howItWorksEn: 'Splunkd ingests network packets on 514/9997/8088, feeds AggregatorMiningProcessor in parsingQueue, parses via props/transforms, and queues in tcpoutQueue destined for indexers.',
    incomingSourcesCount: 4,
    incomingLogSources: [
      {
        ip: '192.168.10.50',
        hostname: 'paloalto-fw01.corp.net',
        deviceType: 'Next-Gen Firewall (Palo Alto)',
        protocol: 'syslog_udp',
        port: 514,
        eventsPerSec: 1450,
        targetIndex: 'net_firewall',
        targetSourcetype: 'pan:traffic',
        status: 'active',
        notesFa: 'ارسال ترافیک لایه ۷، هشدارهای امنیتی تهدیدات (Threat) و لاگ‌های URL Filtering'
      },
      {
        ip: '192.168.10.65',
        hostname: 'sec-wazuh-agent.soc.local',
        deviceType: 'Wazuh EDR & SIEM Sensor',
        protocol: 'syslog_tcp',
        port: 1514,
        eventsPerSec: 620,
        targetIndex: 'wazuh_alerts',
        targetSourcetype: 'wazuh:alerts',
        status: 'active',
        notesFa: 'هشدارهای تشخیص نفوذ مبتنی بر میزبان (HIDS)، تغییرات فایل FIM و لاگ آسیب‌پذیری‌ها'
      },
      {
        ip: '10.20.30.12',
        hostname: 'dc01-ad.corp.local',
        deviceType: 'Windows Active Directory Domain Controller',
        protocol: 'splunktcp',
        port: 9997,
        eventsPerSec: 980,
        targetIndex: 'os_win',
        targetSourcetype: 'XmlWinEventLog:Security',
        status: 'active',
        notesFa: 'رویدادهای Kerberos، لاگین ناموفق ۴۶۲۵، ساخت کاربر جدید و تغییرات گروه ادمین'
      },
      {
        ip: '172.16.4.88',
        hostname: 'nginx-ingress.k8s.prod',
        deviceType: 'Kubernetes NGINX Ingress Controller',
        protocol: 'hec_https',
        port: 8088,
        eventsPerSec: 2100,
        targetIndex: 'web_ingress',
        targetSourcetype: 'nginx:plus:access',
        status: 'active',
        notesFa: 'ترافیک ورودی وب، کدهای وضعیت HTTP، حملات لایه وب و پاسخ‌های WAF'
      }
    ],
    destinationIndexers: [
      {
        ip: '10.20.30.50',
        hostname: 'idx01-site1.cluster.splunk',
        port: 9997,
        queueStatus: 'normal',
        tlsStatus: false, // Flagged!
        activeChannel: true,
        avgLatencyMs: 1.4,
        storedBucketsCount: 142,
        dutyFa: 'دریافت جریان پارس‌شده، ثبت داده در Hot Buckets، ساخت دیتابیس معکوس tsidx و بایگانی دوره‌ای.',
        dutyEn: 'Receives parsed stream, writes raw events to hot journal.zst, builds inverted tsidx index database, rolls to warm/cold.'
      },
      {
        ip: '10.20.30.51',
        hostname: 'idx02-site1.cluster.splunk',
        port: 9997,
        queueStatus: 'normal',
        tlsStatus: false, // Flagged!
        activeChannel: true,
        avgLatencyMs: 1.8,
        storedBucketsCount: 139,
        dutyFa: 'ایندکسر همتا (Peer) برای توزیع بار و افزایش دسترس‌پذیری در کلاستر سایت ۱.',
        dutyEn: 'Peer indexer for load distribution and HA clustering.'
      }
    ],
    parsingTechniqueFa: 'استفاده از AggregatorMiningProcessor به همراه SHOULD_LINEMERGE=false و عبارات منظم خط‌شکن در props.conf و ماسک‌کردن کلیدهای دسترسی در transforms.conf',
    activeAddons: ['Splunk_TA_paloalto', 'Splunk_TA_nix', 'Splunk_TA_windows', 'Splunk_SA_CIM']
  },
  {
    id: 'indexer_peer',
    nameFa: 'ایندکسر کلاستر (Indexer Cluster Peer)',
    nameEn: 'Splunk Indexer (Cluster Peer)',
    shortName: 'IDX-01',
    icon: 'Database',
    dutyFa: 'وظیفه ایندکسر در اسپلانک: دریافت رویدادهای فشرده از فورواردرها، نوشتن داده خام فشرده‌شده در فایل journal.zst (داخل Hot Buckets)، استخراج کلیدواژه‌ها و ایجاد دیتابیس معکوس زمانی (tsidx)، اعمال سیاست‌های نگهداری (چرخش از Hot به Warm و Cold و در نهایت Frozen یا بایگانی)، و اجرای کوئری‌های جستجوی موازی (Map-Reduce) ارسالی از سوی سرچ‌هد.',
    dutyEn: 'Stores raw chunks into journal files, creates inverted tsidx index trees, enforces retention lifecycles across Hot/Warm/Cold/Frozen, and executes map-reduce subsearches for Search Heads.',
    howItWorksFa: 'ایندکسر داده‌ها را در باکت‌های زمانی دسته‌بندی می‌کند. هر باکت شامل دایرکتوری db است که فایل tsidx و journal در آن قرار دارند. در یک کلاستر چند نودی، ایندکسرها از پورت ۹۸۸۷ برای رپلیکیت کردن باکت‌ها (بر اساس replication_factor) به نودهای دیگر استفاده می‌کنند تا در صورت سوختن سرور هیچ دیتایی گم نشود.',
    howItWorksEn: 'Segments events into time-bound buckets. Distributes copy slices across peers via TCP 9887 according to replication factor.',
    incomingSourcesCount: 2,
    incomingLogSources: [
      {
        ip: '10.20.30.45',
        hostname: 'hf01.corp.net',
        deviceType: 'Splunk Heavy Forwarder',
        protocol: 'splunktcp',
        port: 9997,
        eventsPerSec: 5150,
        targetIndex: 'all_routed_indexes',
        targetSourcetype: 'multiple',
        status: 'active',
        notesFa: 'دریافت جریان تجمیعی لاگ‌های شبکه و سیستم‌عامل'
      }
    ],
    destinationIndexers: [
      {
        ip: '10.20.30.51',
        hostname: 'idx02-site1.cluster.splunk',
        port: 9887,
        queueStatus: 'normal',
        tlsStatus: true,
        activeChannel: true,
        avgLatencyMs: 0.8,
        storedBucketsCount: 139,
        dutyFa: 'تبادل کپی‌های امنیتی باکت‌ها (Bucket Replication) روی پورت ۹۸۸۷.',
        dutyEn: 'Inter-peer cluster bucket replication channel.'
      }
    ],
    parsingTechniqueFa: 'شاخص‌گذاری مستقیم در tsidx بدون پارس سنگین به دلیل پیش‌پارس‌شدن در HF',
    activeAddons: ['Splunk_TA_paloalto', 'Splunk_TA_nix', 'Splunk_TA_windows']
  },
  {
    id: 'search_head',
    nameFa: 'سرچ‌هد / کنسول جستجو (Search Head)',
    nameEn: 'Splunk Search Head (SH)',
    shortName: 'SH-01',
    icon: 'Search',
    dutyFa: 'وظیفه سرچ‌هد: رابط کاربری کاربران SOC و مدیران، تبدیل کوئری‌های SPL به زیرجستجوهای موازی و ارسال به تمام ایندکسرها، تجمیع نتایج بازگشتی (Reduce)، اجرای قوانین همبستگی‌سنجی ES، رندر داشبوردها و گزارش‌های لحظه‌ای.',
    dutyEn: 'Translates SPL into map-reduce search jobs, sends tasks to indexers via REST 8089, aggregates results, renders SOC dashboards and fires automated alerts.',
    howItWorksFa: 'سرچ‌هد با استفاده از distsearch.conf به پورت ۸۰۸۹ ایندکسرها متصل می‌شود. نتایج میانی در پوشه dispatch ذخیره شده و پس از محاسبه در مموری به کاربر یا پایپلاین آلارم تحویل داده می‌شود.',
    howItWorksEn: 'Connects to indexers on 8089/tcp via distributedSearch, pools results in dispatch folder.',
    incomingSourcesCount: 0,
    incomingLogSources: [],
    destinationIndexers: [
      {
        ip: '10.20.30.50',
        hostname: 'idx01-site1.cluster.splunk',
        port: 8089,
        queueStatus: 'normal',
        tlsStatus: true,
        activeChannel: true,
        avgLatencyMs: 1.2,
        storedBucketsCount: 142,
        dutyFa: 'ارسال دستورات جستجو و خواندن فیلدهای استخراج‌شده',
        dutyEn: 'Search execution channel over REST API.'
      },
      {
        ip: '10.20.30.51',
        hostname: 'idx02-site1.cluster.splunk',
        port: 8089,
        queueStatus: 'normal',
        tlsStatus: true,
        activeChannel: true,
        avgLatencyMs: 1.5,
        storedBucketsCount: 139,
        dutyFa: 'ارسال دستورات جستجو و خواندن فیلدهای استخراج‌شده',
        dutyEn: 'Search execution channel over REST API.'
      }
    ],
    parsingTechniqueFa: 'استخراج فیلد در زمان جستجو (Search-Time Field Extraction) و لوکاپ‌های KV Store',
    activeAddons: ['SplunkEnterpriseSecuritySuite', 'Splunk_SA_CIM', 'DA-ESS-NetworkProtection']
  }
];
