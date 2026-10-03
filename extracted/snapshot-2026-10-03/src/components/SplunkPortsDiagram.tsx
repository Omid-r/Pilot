import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Sun, 
  Moon, 
  ExternalLink,
  Shield,
  FileCode,
  Layers,
  Activity,
  Lock,
  Unlock,
  Server,
  Database,
  Search,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Award,
  Package,
  ArrowRight,
  Maximize2,
  Check,
  X,
  Terminal,
  Info,
  Radio
} from 'lucide-react';
import { ComponentProfile, ComponentRole, ClusterSettings, SystemAuditInfo } from '../types';
import { parseInputsConf, extractClusterFromConfigs } from '../utils/splunkConfigParser';

interface SplunkPortsDiagramProps {
  lang: 'fa' | 'en';
  configs?: Record<string, string>;
  isTlsEnabled?: boolean;
  currentProfile?: ComponentProfile;
  onSelectConfig?: (filename: string) => void;
  onSelectComponent?: (role: string) => void;
  settings?: ClusterSettings;
  probeResults?: Array<{ id: string; name: string; host: string; port: number; open: boolean; latencyMs?: number; error?: string }>;
  onTriggerProbe?: () => void;
  isProbing?: boolean;
  systemAudit?: SystemAuditInfo;
}

export const SplunkPortsDiagram: React.FC<SplunkPortsDiagramProps> = ({ 
  lang, 
  configs = {},
  isTlsEnabled = false,
  currentProfile,
  onSelectConfig,
  onSelectComponent,
  settings,
  probeResults = [],
  onTriggerProbe,
  isProbing = false,
  systemAudit
}) => {
  const isFa = lang === 'fa';
  const [theme, setTheme] = useState<'classic' | 'dark'>('dark');
  const [selectedPortFilter, setSelectedPortFilter] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'node' | 'port'>('node');
  const [activeNodeId, setActiveNodeId] = useState<string>('hf');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [animatePackets, setAnimatePackets] = useState<boolean>(true);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  const isDark = theme === 'dark';

  // Check if TLS is active from props or outputs.conf content
  const outputsContent = configs['outputs.conf'] || '';
  const effectiveTls = isTlsEnabled || outputsContent.includes('useSSL = true');

  // Fallback default cluster settings
  const defaultSettings: ClusterSettings = {
    hfIp: '10.20.30.45',
    hfHost: 'hf01.corp.net',
    idx1Ip: '10.20.30.50',
    idx1Host: 'idx01-site1.cluster.splunk',
    idx2Ip: '10.20.30.51',
    idx2Host: 'idx02-site1.cluster.splunk',
    shIp: '10.20.30.40',
    shHost: 'sh01.corp.net',
    dsIp: '10.20.30.60',
    dsHost: 'ds01.corp.net',
  };

  const clusterFromConfs = extractClusterFromConfigs(configs);

  const currentSettings: ClusterSettings = {
    ...defaultSettings,
    ...(settings || {})
  };

  // Merge auto-extracted values from configs if not explicitly overridden
  if (clusterFromConfs.indexers.length > 0) {
    if (clusterFromConfs.indexers[0] && !settings?.idx1Ip) {
      currentSettings.idx1Ip = clusterFromConfs.indexers[0].ip || currentSettings.idx1Ip;
      currentSettings.idx1Host = clusterFromConfs.indexers[0].host || currentSettings.idx1Host;
    }
    if (clusterFromConfs.indexers[1] && !settings?.idx2Ip) {
      currentSettings.idx2Ip = clusterFromConfs.indexers[1].ip || currentSettings.idx2Ip;
      currentSettings.idx2Host = clusterFromConfs.indexers[1].host || currentSettings.idx2Host;
    }
  }
  if (clusterFromConfs.serverName && !settings?.hfHost) {
    currentSettings.hfHost = clusterFromConfs.serverName;
  }
  if (clusterFromConfs.deploymentServer && !settings?.dsIp) {
    currentSettings.dsIp = clusterFromConfs.deploymentServer.ip;
    currentSettings.dsHost = clusterFromConfs.deploymentServer.host;
  }

  // Parse actual inputs from inputs.conf
  const dynamicLogSources = parseInputsConf(configs['inputs.conf'] || '', currentSettings.hfIp);

  // Port detailed technical metadata for interactive clicks
  const portDetailedInfo: Record<string, {
    name: string;
    nameFa: string;
    descEn: string;
    descFa: string;
    protocol: string;
    governingConf: string;
    verifCommand: string;
    directionEn: string;
    directionFa: string;
    recommendedTls: string;
    recommendedTlsFa: string;
  }> = {
    '9997': {
      name: 'SplunkTCP Data Forwarding (Port 9997)',
      nameFa: 'پورت انتقال داده اصلی SplunkTCP (پورت ۹۹۹۷)',
      descEn: 'The primary port used by Universal and Heavy Forwarders to stream parsed data packets to Indexers. Must be secured with TLS in enterprise environments.',
      descFa: 'پورت اصلی کلاستر برای ارسال کلان‌داده‌ها و لاگ‌های خام فشرده‌شده از فورواردرها به ایندکسرها. طبق مستندات سیسکو و اسپلانک، این پورت حتماً باید به گواهینامه‌های SSL/TLS مجهز شود.',
      protocol: 'TCP',
      governingConf: 'outputs.conf (on HF) & inputs.conf (on Indexers)',
      verifCommand: 'ss -antp | grep 9997   # On Indexers to verify listening status',
      directionEn: `${currentSettings.hfHost} ──> ${currentSettings.idx1Host} & ${currentSettings.idx2Host} (Inbound:9997)`,
      directionFa: `هوی‌فورواردر (${currentSettings.hfIp}) ──> ایندکسرهای کلاستر نود ۱ و ۲ (ورودی: ۹۹۹۷)`,
      recommendedTls: 'useSSL = true under [tcpout:primary_indexers]',
      recommendedTlsFa: 'در فایل outputs.conf مقدار useSSL = true قرار گیرد.',
    },
    '8089': {
      name: 'Management & REST API (Port 8089)',
      nameFa: 'پورت مدیریت و وب‌سرویس REST API (پورت ۸۰۸۹)',
      descEn: 'Used for secure inter-node communications, clustering replication heartbeats, search head search dispatches, and license validation.',
      descFa: 'پورت حیاتی مدیریت داخلی کلاستر اسپلانک. برای هماهنگی نودهای کلاستر، توزیع جاب‌های جستجو توسط سرچ‌هد، تأیید سهمیه لایسنس و دریافت کانفیگ از سرور استقرار (Deployment Server) استفاده می‌شود.',
      protocol: 'TCP (HTTPS)',
      governingConf: 'server.conf (on all nodes)',
      verifCommand: `curl -k https://${currentSettings.idx1Ip}:8089/services/server/info`,
      directionEn: 'All Cluster Nodes <──> Cluster Manager, Deployment Server, and Search Head',
      directionFa: 'تمامی گره‌های کلاستر <──> سرورهای مدیریت، مسترکلاستر و سرچ‌هد',
      recommendedTls: 'Enforced TLS with mutual authentication (mTLS) for search peers',
      recommendedTlsFa: 'باید با استفاده از گواهینامه‌های سازمانی معتبر و غیرپیش‌فرض (Custom SSL Certs) محافظت گردد.',
    },
    '8000': {
      name: 'Splunk Web Interface (Port 8000 / 443)',
      nameFa: 'پورت کنسول تحت وب کاربران Splunk Web (پورت ۸۰۰۰ / ۴۴۳)',
      descEn: 'Serves the graphical user interface for SOC analysts, administrators, and security search query operators.',
      descFa: 'درگاه تحت وب اصلی برای دسترسی تحلیل‌گران مرکز عملیات امنیت (SOC)، نوشتن کوئری‌های SPL، طراحی داشبوردها و مدیریت پلتفرم اسپلانک.',
      protocol: 'TCP (HTTP/HTTPS)',
      governingConf: 'web.conf (on Search Head)',
      verifCommand: 'ss -antp | grep 8000   # Check if web server is listening',
      directionEn: `SOC Analysts / Users (Browser) ──> ${currentSettings.shHost} (Inbound:8000)`,
      directionFa: `کلاینت‌ها و تحلیل‌گران (مرورگر) ──> سرچ‌هد اسپلانک (${currentSettings.shIp}:۸۰۰۰)`,
      recommendedTls: 'enableSplunkWebSSL = true under [settings]',
      recommendedTlsFa: 'فعال‌سازی SSL در فایل web.conf جهت جلوگیری از شنود پسوردها در شبکه ضروری است.',
    },
    '8088': {
      name: 'HTTP Event Collector / HEC (Port 8088)',
      nameFa: 'پورت جمع‌آوری مستقیم رویدادهای HEC (پورت ۸۰۸۸)',
      descEn: 'Allows application developers and Kubernetes container ingress engines to send logs directly over JSON HTTP POST requests using secure Auth Tokens.',
      descFa: 'درگاه پرسرعت مبتنی بر پروتکل HTTP/HTTPS جهت دریافت مستقیم فایل‌های لاگ و رویدادهای میکروسرویس‌ها، کانتینرهای داکر و کوبرنتیز بدون نیاز به نصب اژنت.',
      protocol: 'TCP (HTTPS)',
      governingConf: 'inputs.conf (under [http] stanza)',
      verifCommand: `curl -k -H "Authorization: Splunk <Token>" https://${currentSettings.hfIp}:8088/services/collector/event -d '{"event": "test"}'`,
      directionEn: `K8s Ingress, Docker Containers ──> ${currentSettings.hfHost} (Inbound:8088)`,
      directionFa: `سرویس‌های ابری و میکروسرویس‌ها ──> هوی‌فورواردر اسپلانک (${currentSettings.hfIp}:۸۰۸۸)`,
      recommendedTls: 'SSL required, and token rotation implemented every 90 days',
      recommendedTlsFa: 'استفاده از HTTPS اجباری است و توکن‌ها باید به صورت دوره‌ای منقضی و بازنشانی شوند.',
    },
    '9887': {
      name: 'Indexer Bucket Replication / Sync (Port 9887)',
      nameFa: 'پورت انتقال فایل و همگام‌سازی باکت‌ها (پورت ۹۸۸۷)',
      descEn: 'Crucial for multi-indexer clusters. Syncs warm/hot index raw buckets to satisfy the Replication Factor (RF) requirements.',
      descFa: 'پورت اختصاصی کلاستر برای رپلیکیشن دوجانبه باکت‌های اطلاعاتی بین ایندکسرهای همتا جهت تضمین پایداری داده‌ها در سناریوهای خرابی سخت‌افزاری سرورها.',
      protocol: 'TCP',
      governingConf: 'server.conf (under [clustering] replication_port)',
      verifCommand: 'ss -antp | grep 9887',
      directionEn: `${currentSettings.idx1Host} <── Bi-directional sync ──> ${currentSettings.idx2Host}`,
      directionFa: `ایندکسر همتای ۱ (${currentSettings.idx1Ip}) <── انتقال دوطرفه باکت‌ها ──> ایندکسر همتای ۲ (${currentSettings.idx2Ip})`,
      recommendedTls: 'Enable useSSL = true in server.conf clustering configs',
      recommendedTlsFa: 'برای جلوگیری از شنود لاگ‌های خام منتقل‌شده در بین سرورهای مرکز داده، رمزنگاری TLS فعال شود.',
    },
    '514': {
      name: 'Syslog UDP/Network Ingestion (Port 514 UDP)',
      nameFa: 'پورت شبکه دریافت سیس‌لاگ فایروال و تجهیزات (پورت ۵۱۴ UDP)',
      descEn: 'Standard network ingestion interfaces. Port 514 UDP typically ingests firewall events from Cisco, Palo Alto, and network appliances.',
      descFa: 'درگاه استاندارد شبکه برای دریافت لاگ تجهیزات شبکه، سوئیچ‌ها، روترها، فایروال‌های پالوآلتو به صورت بلادرنگ از طریق پروتکل UDP.',
      protocol: 'UDP',
      governingConf: 'inputs.conf (under [udp://514])',
      verifCommand: 'netstat -anup | grep 514',
      directionEn: `Firewalls & Network Routers ──> ${currentSettings.hfHost}:514 Ingestion Listener`,
      directionFa: `فایروال‌ها و تجهیزات شبکه ──> هوی‌فورواردر اسپلانک (${currentSettings.hfIp}:۵۱۴)`,
      recommendedTls: 'Use Syslog-NG or Splunk Connect for Syslog (SC4S) to proxy into secure TCP 9997',
      recommendedTlsFa: 'سیس‌لاگ خام UDP فاقد رمزنگاری است؛ توصیه می‌شود از فورواردر میانی استفاده شود.',
    },
    '1514': {
      name: 'Wazuh EDR & Endpoint Security (Port 1514 TCP)',
      nameFa: 'پورت دریافت امن لاگ‌های وازوه و EDR کلاینت‌ها (پورت ۱۵۱۴ TCP)',
      descEn: 'Dedicated TCP ingestion port for continuous streaming of endpoint security alerts from Wazuh/OSSEC host-based detection agents.',
      descFa: 'درگاه اتصال امن مبتنی بر پروتکل اتصال‌گرا (TCP) جهت جمع‌آوری بدون نقص و بدون افت بسته‌های امنیتی اژنت‌های آنتی‌ویروس و Wazuh EDR ایستگاه‌های کاری.',
      protocol: 'TCP',
      governingConf: 'inputs.conf (under [tcp://1514])',
      verifCommand: 'ss -antp | grep 1514   # On Heavy Forwarder',
      directionEn: `Wazuh Agents & Workstations ──> ${currentSettings.hfHost}:1514`,
      directionFa: `سیستم‌های اداری و اژنت‌های امنیتی ──> هوی‌فورواردر اسپلانک (${currentSettings.hfIp}:۱۵۱۴)`,
      recommendedTls: 'Enable SSL certificate verification on the TCP listener stanza',
      recommendedTlsFa: 'رمزنگاری TLS با گواهینامه معتبر روی استنزای [tcp://1514] فعال شود.',
    },
    '8191': {
      name: 'KVStore MongoDB Sync (Port 8191 TCP)',
      nameFa: 'پورت همگام‌سازی پایگاه داده داخلی KVStore (پورت ۸۱۹۱)',
      descEn: 'Internal port running embedded MongoDB instances for KVStore lookups, state storage, and application asset tables.',
      descFa: 'پورت سرویس دیتابیس توکار MongoDB برای ذخیره‌سازی جداول Lookup، داده‌های موقت داشبوردها و وضعیت برنامه‌های اسپلانک.',
      protocol: 'TCP',
      governingConf: 'server.conf [kvstore]',
      verifCommand: 'ss -antp | grep 8191',
      directionEn: `Search Head / Indexers <── Internal KVStore cluster ──>`,
      directionFa: `سرچ‌هد و ایندکسرها <── ارتباط درونی پایگاه‌داده ──>`,
      recommendedTls: 'Enforce SSL for KVStore communication in server.conf',
      recommendedTlsFa: 'ارتباطات دیتابیس با فعال‌سازی SSL در server.conf امن شود.',
    }
  };

  // Port colors definition
  const portColors: Record<string, { color: string; labelEn: string; labelFa: string }> = {
    '8089': { color: '#00d0ff', labelEn: '8089 - Management / REST API / Cluster Heartbeats', labelFa: '۸۰۸۹ - پورت مدیریتی، REST API و هارت‌بیت' },
    '9997': { color: '#44b700', labelEn: '9997 - SplunkTCP Forwarding & Ingestion', labelFa: '۹۹۹۷ - انتقال داده اصلی و رویدادهای اسپلانک' },
    '9887': { color: '#d97706', labelEn: '9887 - Index Peer Bucket Replication', labelFa: '۹۸۸۷ - رپلیکیشن باکت‌های دیتابیس بین ایندکسرها' },
    '8088': { color: '#a855f7', labelEn: '8088 - HTTP Event Collector (HEC)', labelFa: '۸۰۸۸ - دریافت مستقیم رویدادهای HTTP/JSON' },
    '8000': { color: isDark ? '#e2e8f0' : '#0f172a', labelEn: '8000/443 - Splunk Web Console', labelFa: '۸۰۰۰/۴۴۳ - کنسول وب کاربران و تحلیل‌گران' },
    '514':  { color: '#f97316', labelEn: '514 - Syslog Network Listener (UDP)', labelFa: '۵۱۴ - پورت دریافت سیس‌لاگ فایروال (UDP)' },
    '1514': { color: '#ea580c', labelEn: '1514 - Wazuh EDR Listener (TCP)', labelFa: '۱۵۱۴ - پورت دریافت اژنت‌های وازوه (TCP)' },
    '8191': { color: '#eab308', labelEn: '8191 - KVStore MongoDB Synchronization', labelFa: '۸۱۹۱ - همگام‌سازی پایگاه‌داده KVStore' },
  };

  // Node details grounded in the application cluster
  const clusterNodes: Record<string, {
    titleEn: string;
    titleFa: string;
    hostname: string;
    ip: string;
    role: string;
    roleFa: string;
    ports: string[];
    configs: string[];
    status: 'healthy' | 'warning';
    statusTextEn: string;
    statusTextFa: string;
    detailsFa: string;
    detailsEn: string;
    metrics: { label: string; value: string }[];
  }> = {
    hf: {
      titleEn: 'Heavy Forwarder (HF-Core)',
      titleFa: 'فوروارد کننده سنگین (Heavy Forwarder)',
      hostname: currentSettings.hfHost,
      ip: currentSettings.hfIp,
      role: 'Parsing & Routing Gateway',
      roleFa: 'گیت‌وی پارس، ماسک‌سازی و لودبالانسینگ',
      ports: ['In: 514 (UDP)', 'In: 1514 (TCP)', 'In: 9997 (SplunkTCP)', 'In: 8088 (HEC)', 'Out: 9997 (to Indexers)', '8089 (Mgmt)'],
      configs: ['inputs.conf', 'outputs.conf', 'props.conf', 'transforms.conf', 'server.conf'],
      status: effectiveTls ? 'healthy' : 'warning',
      statusTextEn: effectiveTls ? 'TLS Encrypted' : 'Security Alert: Cleartext TCP Forwarding',
      statusTextFa: effectiveTls ? 'کانال ارتباطی با TLS رمزنگاری شده' : 'هشدار امنیتی: ارسال کلیرتکست بدون TLS',
      detailsFa: 'نود پردازش لاگ‌های سازمان. رویدادها را از فایروال، اژنت وازوه، دومین کنترلر و اینگرس کوبرنتیز تحویل گرفته، خط‌شکنی و ماسک‌سازی کرده و به ایندکسرهای کلاستر می‌فرستد.',
      detailsEn: 'Primary ingestion gateway. Collects telemetry from perimeter firewalls, Wazuh EDR, Domain Controllers, and K8s Ingress, applies regex masking, and load-balances across indexer peers.',
      metrics: [
        { label: 'Aggregate Ingest', value: '5,150 EPS' },
        { label: 'Parsing Pipeline', value: 'AggregatorMining' },
        { label: 'Forwarding Security', value: effectiveTls ? 'TLS 1.3 Active' : 'Cleartext TCP' }
      ]
    },
    idx1: {
      titleEn: 'Indexer Peer 01 (Site 1)',
      titleFa: 'ایندکسر کلاستر نود ۱ (Site 1 Peer)',
      hostname: currentSettings.idx1Host,
      ip: currentSettings.idx1Ip,
      role: 'Storage & Search Peer',
      roleFa: 'ذخیره‌سازی باکت‌ها و جستجوی موازی',
      ports: ['9997 (SplunkTCP Data)', '9887 (Bucket Replication)', '8089 (REST API)'],
      configs: ['indexes.conf', 'inputs.conf', 'server.conf'],
      status: 'healthy',
      statusTextEn: 'Active Peer - Buckets Synchronized',
      statusTextFa: 'نود فعال - باکت‌ها در وضعیت همگام',
      detailsFa: 'نود اول کلاستر ایندکسرها. دریافت رویدادها روی پورت ۹۹۹۷، نوشتن ژورنال فشرده zstd در باکت‌های Hot، ساخت پایگاه معکوس tsidx و تبادل کپی باکت‌ها روی پورت ۹۸۸۷.',
      detailsEn: 'Cluster storage node. Receives parsed events on 9997, writes compressed journal.zst into hot buckets, creates inverted tsidx index, and replicates slices on 9887.',
      metrics: [
        { label: 'Hot/Warm Buckets', value: '142 Buckets' },
        { label: 'Ingest Load', value: '2,600 EPS' },
        { label: 'Disk Retention', value: '180 Days' }
      ]
    },
    idx2: {
      titleEn: 'Indexer Peer 02 (Site 1)',
      titleFa: 'ایندکسر کلاستر نود ۲ (Site 1 Peer)',
      hostname: currentSettings.idx2Host,
      ip: currentSettings.idx2Ip,
      role: 'Storage & Search Peer',
      roleFa: 'ذخیره‌سازی باکت‌ها و توزیع افزونگی',
      ports: ['9997 (SplunkTCP Data)', '9887 (Bucket Replication)', '8089 (REST API)'],
      configs: ['indexes.conf', 'inputs.conf', 'server.conf'],
      status: 'healthy',
      statusTextEn: 'Active Peer - Replicating with IDX-01',
      statusTextFa: 'نود فعال - رپلیکیشن دوجانبه با ایندکسر ۱',
      detailsFa: 'نود همتای کلاستر برای تضمین Replication Factor = 2. باکت‌های ذخیره‌شده را روی پورت ۹۸۸۷ با ایندکسر ۱ همگام می‌کند تا در صورت بروز خرابی سخت‌افزاری هیچ لاگی گم نشود.',
      detailsEn: 'Peer node fulfilling high availability and replication factor. Replicates hot/warm buckets bi-directionally over 9887 with IDX-01.',
      metrics: [
        { label: 'Hot/Warm Buckets', value: '139 Buckets' },
        { label: 'Ingest Load', value: '2,550 EPS' },
        { label: 'Latency to Peer', value: '0.8 ms' }
      ]
    },
    sh: {
      titleEn: 'Search Head (SH-Console)',
      titleFa: 'سرچ‌هد / کنسول جستجو (Search Head)',
      hostname: currentSettings.shHost,
      ip: currentSettings.shIp,
      role: 'Query Execution & SOC Dashboards',
      roleFa: 'اجرای کوئری‌های SPL و دشبوردهای SOC',
      ports: ['8000 (Splunk Web UI)', '8089 (REST Search Dispatch)', '8191 (KVStore Sync)'],
      configs: ['web.conf', 'savedsearches.conf', 'distsearch.conf', 'server.conf'],
      status: 'healthy',
      statusTextEn: 'Console Online - 16 Concurrency Pool',
      statusTextFa: 'کنسول فعال - استخر همزمانی جستجو آماده',
      detailsFa: 'رابط کاربری تحلیل‌گران امنیت و مدیران سیستم. تبدیل کوئری‌های SPL به جاب‌های توزیع‌شده موازی و ارسال به پورت ۸۰۸۹ ایندکسرها، تجمیع نتایج بازگشتی و رندر داشبوردها.',
      detailsEn: 'SOC analyst UI & query engine. Translates SPL searches into map-reduce subsearches, pushes them over REST 8089 to indexers, pools results, and powers correlation dashboards.',
      metrics: [
        { label: 'Web Port', value: '8000 / 443' },
        { label: 'Dispatch Targets', value: '2 Peers (REST)' },
        { label: 'KVStore Engine', value: 'Active (8191)' }
      ]
    },
    cm: {
      titleEn: 'Cluster Master / Manager Node (CM)',
      titleFa: 'مستر کلاستر ایندکسرها (Cluster Master)',
      hostname: currentSettings.dsHost ? currentSettings.dsHost.replace('ds', 'cm') : 'cm01-master.corp.local',
      ip: currentSettings.idx1Ip.replace(/\.\d+$/, '.55'),
      role: 'Cluster Coordinator & Indexer Discovery',
      roleFa: 'هماهنگی فاکتور رپلیکیشن و کشف نودها',
      ports: ['8089 (Cluster Management & Discovery)'],
      configs: ['server.conf [clustering]'],
      status: 'healthy',
      statusTextEn: 'Replication Factor: 2 | Search Factor: 2',
      statusTextFa: 'فاکتور تکرار: ۲ | فاکتور جستجو: ۲',
      detailsFa: 'مدیریت و نظارت بر سلامت باکت‌های کلاستر ایندکسرها. هماهنگی فرآیند چرخش باکت‌ها، انتشار کانفیگ‌های master-apps و مدیریت مکانیزم Indexer Discovery.',
      detailsEn: 'Coordinates bucket health, cluster replication factor, and bundles across peers. Handles dynamic indexer discovery for forwarders.',
      metrics: [
        { label: 'Cluster State', value: 'Complete' },
        { label: 'Management Port', value: '8089' },
        { label: 'Peers Managed', value: '2 Nodes' }
      ]
    },
    ds: {
      titleEn: 'Deployment Server (DS)',
      titleFa: 'سرور استقرار و انتشار اپ‌ها (Deployment Server)',
      hostname: currentSettings.dsHost,
      ip: currentSettings.dsIp,
      role: 'Centralized App & Config Management',
      roleFa: 'انتشار متمرکز فایل‌های کانفیگ و اپ‌ها',
      ports: ['8089 (Phone-Home Management Port)'],
      configs: ['serverclass.conf', 'deploymentclient.conf'],
      status: 'healthy',
      statusTextEn: 'Phone-Home Interval: 60s',
      statusTextFa: 'دوره استعلام کلاینت‌ها: ۶۰ ثانیه',
      detailsFa: 'مدیریت متمرکز بسته‌های کانفیگ (deployment-apps). فورواردرهای سازمان هر ۶۰ ثانیه به پورت ۸۰۸۹ این سرور وصل شده و تغییرات را دریافت می‌کنند.',
      detailsEn: 'Pushes centralized configuration bundles to forwarders. Target clients query port 8089 periodically to synchronize inputs and parsing rules.',
      metrics: [
        { label: 'Target Clients', value: 'HF-01 & Endpoints' },
        { label: 'Check Interval', value: '60s' },
        { label: 'Active Serverclass', value: 'prod_forwarders' }
      ]
    },
    lm: {
      titleEn: 'License Manager / Server (LM)',
      titleFa: 'سرور لایسنس اسپلانک (License Server)',
      hostname: currentSettings.shHost ? currentSettings.shHost.replace('sh', 'lm') : 'lm01-license.corp.local',
      ip: currentSettings.shIp,
      role: 'Enterprise License Pool Master',
      roleFa: 'نظارت بر سهمیه حجم و اعتبار لایسنس',
      ports: ['8089 (License Slave Heartbeats)'],
      configs: ['server.conf [license]'],
      status: 'healthy',
      statusTextEn: 'Quota: 500 GB/day | Used: 21%',
      statusTextFa: 'سقف روزانه: ۵۰۰ گیگابایت | مصرف: ۲۱٪',
      detailsFa: 'تمام نودهای کلاستر و به ویژه ایندکسرها به صورت روزانه حجم داده دریافتی خود را روی پورت ۸۰۸۹ به این سرور گزارش می‌کنند تا سهمیه لایسنس کنترل شود.',
      detailsEn: 'Aggregates daily indexing volume across all peers. Indexer slaves report consumption heartbeats over 8089.',
      metrics: [
        { label: 'Licensed Quota', value: '500 GB / day' },
        { label: 'Today Usage', value: '105.4 GB' },
        { label: 'Warning Status', value: '0 Violations' }
      ]
    }
  };

  const isPortVisible = (portKey: string) => {
    return true; // Always render lines, use opacity for focused highlighting
  };

  const isPortHighlighted = (portKey: string) => {
    if (!selectedPortFilter) return false;
    if (selectedPortFilter === portKey) return true;
    if (selectedPortFilter === '514' && portKey === '1514') return true;
    if (selectedPortFilter === '1514' && portKey === '514') return true;
    return false;
  };

  const getPortOpacity = (portKey: string) => {
    if (!selectedPortFilter) return 1;
    return isPortHighlighted(portKey) ? 1 : 0.22;
  };

  const handlePortClick = (portKey: string) => {
    setSelectedPortFilter(portKey);
    setInspectorTab('port');
  };

  const activeNode = clusterNodes[activeNodeId] || clusterNodes.hf;

  return (
    <div className="sirene-card rounded-3xl border border-white/[0.08] bg-[#0b0e17]/85 backdrop-blur-2xl text-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Ambient radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

      {/* Top Toolbar - Sirene Dark Luxury */}
      <div className="p-5 md:p-6 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className={`flex items-center gap-3.5 ${isFa ? 'text-right' : 'text-left'}`}>
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-sm flex-shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            SVA
          </div>
          <div className={isFa ? 'text-right' : 'text-left'}>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                {isFa ? 'دایاگرام نمادها، گره‌ها و پورت‌های معماری کلاستر اسپلانک' : 'Splunk Cluster Architecture, Nodes & Network Ports Topology'}
              </h2>
              <span className="text-white/20 font-mono">·</span>
              <span className="sirene-badge text-xs font-mono px-3 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1 ml-1"></span>
                {isFa ? 'گره‌های عملیاتی فعال' : 'Active Live Cluster'}
              </span>
              {systemAudit && (
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-300 flex items-center gap-1.5 transition cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/10"
                  title={isFa ? 'بررسی مجوزهای سرور و ابزارهای شناسایی شبکه' : 'Audit OS permissions and network discovery tools'}
                >
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span>
                    {isFa 
                      ? (systemAudit.user.isRoot ? 'مجوز Root فعال' : `کاربر: ${systemAudit.user.username}`)
                      : (systemAudit.user.isRoot ? 'Root Privileged' : `User: ${systemAudit.user.username}`)}
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isFa 
                ? 'نمای استاندارد برداری مطابق کانفیگ کلاستر موجود: ارتباطات پورت‌ها، نمادهای سرور و وضعیت امنیتی TLS' 
                : 'Interactive vector diagram reflecting current cluster nodes: real ports, server symbols, and active TLS status.'}
            </p>
          </div>
        </div>

        {/* Toolbar controls - Sirene Pills */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Server Permissions Audit Button */}
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:border-white/20 font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title={isFa ? 'بررسی مجوزهای سیستم‌عامل، ابزارهای شبکه (ss, procfs) و دلیل مقادیر پیش‌فرض' : 'Audit permissions, network tools, and live configs'}
          >
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>{isFa ? 'مجوزها و ابزارهای سرور' : 'Server Permissions & Tools'}</span>
          </button>

          {/* Animate Packets Toggle */}
          <button
            onClick={() => setAnimatePackets(!animatePackets)}
            className={`px-3.5 py-1.5 rounded-full border font-semibold flex items-center gap-1.5 transition ${
              animatePackets
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            {animatePackets ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isFa ? (animatePackets ? 'توقف پویانمایی' : 'پویانمایی جریان لاگ') : (animatePackets ? 'Pause Packets' : 'Animate Flow')}</span>
          </button>

          {/* Zoom controls - Sirene capsule */}
          <div className="flex items-center rounded-full border border-white/[0.08] bg-[#07090e] overflow-hidden shadow-inner p-0.5">
            <button
              onClick={() => setZoomLevel(z => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}
              className="p-1.5 hover:bg-white/[0.08] transition text-slate-300 rounded-full"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-400 min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.max(0.7, Math.round((z - 0.1) * 10) / 10))}
              className="p-1.5 hover:bg-white/[0.08] transition text-slate-300 rounded-full"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-white/[0.08] transition text-slate-300 rounded-full"
              title="Reset Zoom (Fit)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {onTriggerProbe && (
            <button
              onClick={onTriggerProbe}
              disabled={isProbing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 text-white border-0 text-xs font-mono font-medium transition cursor-pointer shadow-[0_0_16px_rgba(124,58,237,0.35)]"
              title={isFa ? 'تست پروب سوکت تمام پورت‌ها' : 'Run live TCP socket probes for all ports'}
            >
              <Activity className={`w-3.5 h-3.5 text-white ${isProbing ? 'animate-spin' : ''}`} />
              <span>{isProbing ? (isFa ? 'در حال پروب...' : 'Probing...') : (isFa ? 'پروب سوکت پورت‌ها' : 'Probe TCP Ports')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Port Filter Legend Bar - Sirene Capsule Bar */}
      <div className="p-3.5 px-6 border-b border-white/[0.06] bg-[#07090e]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className={`flex items-center gap-2 flex-shrink-0 ${isFa ? 'text-right' : 'text-left'}`}>
          <span className="font-bold tracking-wider text-[11px] uppercase text-violet-400">
            {isFa ? 'فیلتر پورت‌ها:' : 'PORT FILTER:'}
          </span>
          {selectedPortFilter && (
            <button
              onClick={() => {
                setSelectedPortFilter(null);
                setInspectorTab('node');
              }}
              className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-bold border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer"
            >
              {isFa ? 'نمایش همه پورت‌ها' : 'Clear Filter'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs" dir="ltr">
          {Object.entries(portColors).map(([key, info]) => {
            const isSelected = selectedPortFilter === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPortFilter(null);
                    setInspectorTab('node');
                  } else {
                    setSelectedPortFilter(key);
                    setInspectorTab('port');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] whitespace-nowrap transition border ${
                  isSelected 
                    ? 'ring-2 ring-violet-500 font-bold bg-violet-500/20 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' 
                    : 'bg-[#0c0f18] border-white/[0.08] text-slate-300 hover:border-violet-500/40 hover:bg-[#121624]'
                }`}
                style={{ borderColor: isSelected ? '#8b5cf6' : undefined }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }}></span>
                <span>{key === '8000' ? '8000/443 Web' : key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Clicked Port Quick Inspector Card (Immediate Visual Feedback) */}
      {selectedPortFilter && portDetailedInfo[selectedPortFilter] && (
        <div className={`p-4 border-b transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
          isDark ? 'bg-slate-900/95 border-amber-500/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
        }`}>
          <div className="flex items-start gap-3.5">
            <div 
              className="w-4 h-4 rounded-full mt-1 animate-pulse flex-shrink-0 ring-4"
              style={{ 
                backgroundColor: portColors[selectedPortFilter]?.color || '#00d0ff',
                borderColor: `${portColors[selectedPortFilter]?.color || '#00d0ff'}40`
              }}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-950 text-white border border-slate-700 shadow-sm">
                  {portDetailedInfo[selectedPortFilter].protocol} {selectedPortFilter}
                </span>
                <h4 className="font-bold text-sm tracking-tight" style={{ color: portColors[selectedPortFilter]?.color || '#00d0ff' }}>
                  {isFa ? portDetailedInfo[selectedPortFilter].nameFa : portDetailedInfo[selectedPortFilter].name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Active in Cluster
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-400">{isFa ? 'جریان ترافیک و مسیر بسته:' : 'Data Flow & Target:'}</span>
                <span className="font-mono text-amber-300 font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                  {isFa ? portDetailedInfo[selectedPortFilter].directionFa : portDetailedInfo[selectedPortFilter].directionEn}
                </span>
              </p>

              {/* Live TCP Sockets Probe Status for this Selected Port */}
              {(() => {
                const matchingProbes = (probeResults || []).filter(p => String(p.port) === selectedPortFilter);
                if (matchingProbes.length === 0) return null;
                return (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span className="font-semibold text-slate-400">{isFa ? 'وضعیت سوکت زنده:' : 'Live Socket Status:'}</span>
                    {matchingProbes.map((pr, idx) => (
                      <span 
                        key={idx} 
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-mono flex items-center gap-1 shadow-sm ${
                          pr.open 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pr.open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        <span>{pr.name.split('(')[0]}:</span>
                        <span className="font-bold">{pr.open ? `${isFa ? 'باز' : 'OPEN'} (${pr.latencyMs}ms)` : (isFa ? 'بسته' : 'CLOSED')}</span>
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end flex-wrap">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800 shadow-inner">
              {portDetailedInfo[selectedPortFilter].governingConf}
            </span>
            <button
              onClick={() => {
                const confName = portDetailedInfo[selectedPortFilter].governingConf.split(' ')[0];
                if (onSelectConfig && confName.endsWith('.conf')) {
                  onSelectConfig(confName);
                }
              }}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{isFa ? 'ویرایش فایل کانفیگ' : 'Edit .conf'}</span>
            </button>
            <button
              onClick={() => {
                setSelectedPortFilter(null);
                setInspectorTab('node');
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
            >
              {isFa ? 'بستن (نمایش همه) ✕' : 'Close (Show All) ✕'}
            </button>
          </div>
        </div>
      )}

      {/* Main Diagram Area with dynamic scaling and perfect container fit */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-transparent to-black/10 flex justify-center items-center min-h-[580px] p-2 md:p-4" dir="ltr">
        <div 
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}
          className="w-full max-w-[1160px] mx-auto flex-shrink-0"
        >
          <svg 
            viewBox="0 0 1160 720" 
            className="w-full h-auto drop-shadow-md select-none block"
            style={{ 
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
              direction: 'ltr'
            }}
          >
            <defs>
              {/* Markers for arrows */}
              <marker id="arr-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#00d0ff" />
              </marker>
              <marker id="arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#44b700" />
              </marker>
              <marker id="arr-green-bold" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 1 2 L 10 6 L 1 10 z" fill="#44b700" stroke="#166534" strokeWidth="0.5" />
              </marker>
              <marker id="arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#d97706" />
              </marker>
              <marker id="arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#a855f7" />
              </marker>
              <marker id="arr-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f97316" />
              </marker>
              <marker id="arr-web" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={isDark ? '#e2e8f0' : '#0f172a'} />
              </marker>
              <marker id="arr-yellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#eab308" />
              </marker>

              {/* Server Blade Drop Shadow */}
              <filter id="blade-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity={isDark ? "0.5" : "0.15"} />
              </filter>
            </defs>

            {/* Canvas Base */}
            <rect 
              x="2" 
              y="2" 
              width="1156" 
              height="716" 
              fill={isDark ? '#0c111a' : '#ffffff'} 
              rx="16"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="2"
            />

            {/* Subtle Grid dots */}
            <g opacity={isDark ? "0.15" : "0.08"}>
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`gx-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="720" stroke={isDark ? '#ffffff' : '#000000'} strokeDasharray="2,8" />
              ))}
              {Array.from({ length: 15 }).map((_, i) => (
                <line key={`gy-${i}`} x1="0" y1={i * 50} x2="1160" y2={i * 50} stroke={isDark ? '#ffffff' : '#000000'} strokeDasharray="2,8" />
              ))}
            </g>

            {/* ============================================================== */}
            {/* TIER BOUNDARIES (Dashed Frames with Clear Titles) */}
            {/* ============================================================== */}

            {/* Tier 1: Search & Analysis Tier (Top Center) */}
            <g transform="translate(380, 25)">
              <rect 
                x="0" 
                y="0" 
                width="380" 
                height="150" 
                fill={isDark ? '#1e293b18' : '#f0f7ff'} 
                stroke="#2563eb" 
                strokeWidth="1.8" 
                strokeDasharray="6,4" 
                rx="8"
              />
              <text x="15" y="-6" fontSize="11" fontWeight="800" fill={isDark ? '#60a5fa' : '#1e40af'} letterSpacing="0.5">
                SEARCH &amp; ANALYTICS TIER (SEARCH HEAD)
              </text>
            </g>

            {/* Tier 2: Storage & Indexing Cluster (Middle Center) */}
            <g transform="translate(350, 220)">
              <rect 
                x="0" 
                y="0" 
                width="440" 
                height="190" 
                fill={isDark ? '#1e293b18' : '#fffbeb'} 
                stroke="#d97706" 
                strokeWidth="1.8" 
                strokeDasharray="6,4" 
                rx="8"
              />
              <text x="15" y="-6" fontSize="11" fontWeight="800" fill={isDark ? '#fbbf24' : '#92400e'} letterSpacing="0.5">
                INDEXING CLUSTER TIER (PEER NODES)
              </text>
            </g>

            {/* Tier 3: Ingestion & Parsing Gateway (Bottom Center) */}
            <g transform="translate(380, 460)">
              <rect 
                x="0" 
                y="0" 
                width="380" 
                height="225" 
                fill={isDark ? '#1e293b18' : '#f0fdf4'} 
                stroke="#16a34a" 
                strokeWidth="1.8" 
                strokeDasharray="6,4" 
                rx="8"
              />
              <text x="15" y="-6" fontSize="11" fontWeight="800" fill={isDark ? '#4ade80' : '#166534'} letterSpacing="0.5">
                PARSING &amp; FORWARDING TIER (HEAVY FORWARDER)
              </text>
            </g>

            {/* Tier 4: Log Sources Tier (Bottom Left) */}
            <g transform="translate(20, 430)">
              <rect 
                x="0" 
                y="0" 
                width="280" 
                height="265" 
                fill={isDark ? '#1e293b10' : '#f8fafc'} 
                stroke={isDark ? '#334155' : '#cbd5e1'} 
                strokeWidth="1.5" 
                strokeDasharray="4,4" 
                rx="8"
              />
              <text x="15" y="-6" fontSize="11" fontWeight="800" fill={isDark ? '#94a3b8' : '#475569'} letterSpacing="0.5">
                NETWORK &amp; HOST LOG SOURCES
              </text>
            </g>

            {/* Tier 5: Management & Orchestration (Right Column) */}
            <g transform="translate(860, 40)">
              <rect 
                x="0" 
                y="0" 
                width="275" 
                height="645" 
                fill={isDark ? '#1e293b15' : '#f8fafc'} 
                stroke="#0284c7" 
                strokeWidth="1.8" 
                strokeDasharray="6,4" 
                rx="8"
              />
              <text x="15" y="-6" fontSize="11" fontWeight="800" fill={isDark ? '#38bdf8' : '#0369a1'} letterSpacing="0.5">
                MANAGEMENT &amp; ORCHESTRATION TIER
              </text>
            </g>

            {/* ============================================================== */}
            {/* CONNECTION PIPES & INTERCONNECT LINES */}
            {/* ============================================================== */}

            {/* 1. Log Sources -> Heavy Forwarder Pipes */}
            {/* Source 1 (514 UDP) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('514') }}
              onClick={() => handlePortClick('514')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۵۱۴ UDP' : 'Click to inspect port 514 UDP'}</title>
              <path d="M 270 475 L 430 520" fill="none" stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arr-orange)" />
              {/* Sharp arrowhead pointing INTO Heavy Forwarder */}
              <polygon points="432,520 420,513 420,527" fill="#f97316" />
              <rect x="305" y="482" width="76" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#f97316" strokeWidth={isPortHighlighted('514') ? 2 : 1} />
              <text x="343" y="495" fontSize="9.5" fontWeight="bold" fill="#f97316" textAnchor="middle">▶ 514 UDP</text>
              {animatePackets && (
                <circle r="3.5" fill="#f97316">
                  <animateMotion path="M 270 475 L 430 520" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Source 2 (1514 TCP) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('1514') }}
              onClick={() => handlePortClick('1514')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۱۵۱۴ TCP' : 'Click to inspect port 1514 TCP'}</title>
              <path d="M 270 535 L 430 545" fill="none" stroke="#ea580c" strokeWidth="2.5" markerEnd="url(#arr-orange)" />
              {/* Sharp arrowhead pointing INTO Heavy Forwarder */}
              <polygon points="432,545 420,538 420,552" fill="#ea580c" />
              <rect x="305" y="530" width="76" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#ea580c" strokeWidth={isPortHighlighted('1514') ? 2 : 1} />
              <text x="343" y="543" fontSize="9.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">▶ 1514 TCP</text>
              {animatePackets && (
                <circle r="3.5" fill="#ea580c">
                  <animateMotion path="M 270 535 L 430 545" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Source 3 (9997 SplunkTCP) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('9997') }}
              onClick={() => handlePortClick('9997')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۹۹۹۷ Splunk' : 'Click to inspect port 9997 Splunk'}</title>
              <path d="M 270 595 L 430 575" fill="none" stroke="#44b700" strokeWidth="2.5" strokeDasharray="5,3" markerEnd="url(#arr-green-bold)" />
              {/* Sharp arrowhead pointing INTO Heavy Forwarder */}
              <polygon points="432,575 420,568 420,582" fill="#44b700" />
              <rect x="300" y="575" width="86" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#44b700" strokeWidth={isPortHighlighted('9997') ? 2 : 1} />
              <text x="343" y="588" fontSize="9.5" fontWeight="bold" fill="#44b700" textAnchor="middle">▶ 9997 S2S</text>
              {animatePackets && (
                <circle r="3.5" fill="#44b700">
                  <animateMotion path="M 270 595 L 430 575" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Source 4 (8088 HTTPS) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('8088') }}
              onClick={() => handlePortClick('8088')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۸ HEC' : 'Click to inspect port 8088 HEC'}</title>
              <path d="M 270 655 L 430 605" fill="none" stroke="#a855f7" strokeWidth="2.5" markerEnd="url(#arr-purple)" />
              {/* Sharp arrowhead pointing INTO Heavy Forwarder */}
              <polygon points="432,605 420,598 420,612" fill="#a855f7" />
              <rect x="302" y="620" width="82" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#a855f7" strokeWidth={isPortHighlighted('8088') ? 2 : 1} />
              <text x="343" y="633" fontSize="9.5" fontWeight="bold" fill="#a855f7" textAnchor="middle">▶ 8088 HEC</text>
              {animatePackets && (
                <circle r="3.5" fill="#a855f7">
                  <animateMotion path="M 270 655 L 430 605" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* 2. Heavy Forwarder -> Indexers Channels (TCP 9997 Data Stream pointing UP to Indexers) */}
            <g style={{ opacity: getPortOpacity('9997') }}>
              {/* HF to Indexer 1 */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('9997')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۹۹۹۷ به سمت ایندکسر ۱' : 'Click to inspect port 9997 to Indexer 1'}</title>
                {/* Flow line starting from HF (510, 485) going UP to bottom of Indexer 1 (442, 388) */}
                <path d="M 510 485 L 442 388" fill="none" stroke="#44b700" strokeWidth="3" strokeDasharray="6,4" markerEnd="url(#arr-green-bold)" />
                {/* Arrowhead polygon pointing UP into bottom of Indexer 1 */}
                <polygon points="442,385 434,400 450,400" fill="#44b700" stroke="#166534" strokeWidth="1" />
                <rect x="420" y="420" width="105" height="20" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#44b700" strokeWidth={isPortHighlighted('9997') ? 2 : 1.5} />
                <text x="472" y="434" fontSize="9.5" fontWeight="bold" fill="#44b700" textAnchor="middle">▲ 9997 → IDX1</text>
              </g>

              {/* HF to Indexer 2 */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('9997')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۹۹۹۷ به سمت ایندکسر ۲' : 'Click to inspect port 9997 to Indexer 2'}</title>
                {/* Flow line starting from HF (630, 485) going UP to bottom of Indexer 2 (692, 388) */}
                <path d="M 630 485 L 692 388" fill="none" stroke="#44b700" strokeWidth="3" strokeDasharray="6,4" markerEnd="url(#arr-green-bold)" />
                {/* Arrowhead polygon pointing UP into bottom of Indexer 2 */}
                <polygon points="692,385 684,400 700,400" fill="#44b700" stroke="#166534" strokeWidth="1" />
                <rect x="615" y="420" width="105" height="20" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#44b700" strokeWidth={isPortHighlighted('9997') ? 2 : 1.5} />
                <text x="667" y="434" fontSize="9.5" fontWeight="bold" fill="#44b700" textAnchor="middle">▲ 9997 → IDX2</text>
              </g>

              {animatePackets && (
                <>
                  <circle r="4" fill="#44b700">
                    <animateMotion path="M 510 485 L 442 388" dur="1.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="#44b700">
                    <animateMotion path="M 630 485 L 692 388" dur="1.3s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>

            {/* 3. Bucket Replication between Indexer 1 and Indexer 2 (9887) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('9887') }}
              onClick={() => handlePortClick('9887')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۹۸۸۷ رپلیکیشن' : 'Click to inspect port 9887 replication'}</title>
              <path d="M 515 305 L 615 305" fill="none" stroke="#d97706" strokeWidth="3.5" markerEnd="url(#arr-amber)" markerStart="url(#arr-amber)" />
              <rect x="532" y="294" width="66" height="22" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#d97706" strokeWidth={isPortHighlighted('9887') ? 2 : 1.5} />
              <text x="565" y="309" fontSize="11" fontWeight="bold" fill="#d97706" textAnchor="middle">9887 Sync</text>
              {animatePackets && (
                <circle r="4" fill="#d97706">
                  <animateMotion path="M 515 305 L 615 305" dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* 4. Search Head -> Indexers Search Dispatch (8089 REST) */}
            <g style={{ opacity: getPortOpacity('8089') }}>
              {/* SH to Idx 1 */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('8089')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۹ جستجو' : 'Click to inspect port 8089 REST'}</title>
                <path d="M 530 145 L 475 240" fill="none" stroke="#00d0ff" strokeWidth="2.5" markerEnd="url(#arr-cyan)" />
                <rect x="460" y="180" width="70" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#00d0ff" strokeWidth={isPortHighlighted('8089') ? 2 : 1} />
                <text x="495" y="193" fontSize="10" fontWeight="bold" fill="#00d0ff" textAnchor="middle">8089 REST</text>
              </g>

              {/* SH to Idx 2 */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('8089')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۹ جستجو' : 'Click to inspect port 8089 REST'}</title>
                <path d="M 610 145 L 660 240" fill="none" stroke="#00d0ff" strokeWidth="2.5" markerEnd="url(#arr-cyan)" />
                <rect x="615" y="180" width="70" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#00d0ff" strokeWidth={isPortHighlighted('8089') ? 2 : 1} />
                <text x="650" y="193" fontSize="10" fontWeight="bold" fill="#00d0ff" textAnchor="middle">8089 REST</text>
              </g>
            </g>

            {/* 5. SOC Users -> Search Head Web Console (8000/443) */}
            <g 
              className="cursor-pointer select-none transition hover:opacity-100"
              style={{ opacity: getPortOpacity('8000') }}
              onClick={() => handlePortClick('8000')}
            >
              <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۰۰ کنسول وب' : 'Click to inspect port 8000 web console'}</title>
              <path d="M 180 85 L 430 85" fill="none" stroke={isDark ? '#e2e8f0' : '#0f172a'} strokeWidth="2.5" markerEnd="url(#arr-web)" />
              <rect x="250" y="74" width="95" height="22" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke={isDark ? '#e2e8f0' : '#0f172a'} strokeWidth={isPortHighlighted('8000') ? 2 : 1.2} />
              <text x="297" y="89" fontSize="11" fontWeight="bold" fill={isDark ? '#e2e8f0' : '#0f172a'} textAnchor="middle">8000 Web UI</text>
            </g>

            {/* 6. Management Connections (Port 8089 to LM, CM, DS) */}
            <g style={{ opacity: getPortOpacity('8089') }}>
              {/* Indexers to Cluster Master */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('8089')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۹ مستر کلاستر' : 'Click to inspect cluster port 8089'}</title>
                <path d="M 720 280 L 890 140" fill="none" stroke="#00d0ff" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arr-cyan)" />
                <rect x="765" y="190" width="90" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#00d0ff" strokeWidth={isPortHighlighted('8089') ? 2 : 1} />
                <text x="810" y="203" fontSize="10" fontWeight="bold" fill="#00d0ff" textAnchor="middle">8089 Cluster</text>
              </g>

              {/* Heavy Forwarder to Deployment Server */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('8089')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۹ استقرار' : 'Click to inspect deploy port 8089'}</title>
                <path d="M 720 540 L 890 350" fill="none" stroke="#00d0ff" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arr-cyan)" />
                <rect x="765" y="430" width="90" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#00d0ff" strokeWidth={isPortHighlighted('8089') ? 2 : 1} />
                <text x="810" y="443" fontSize="10" fontWeight="bold" fill="#00d0ff" textAnchor="middle">8089 Deploy</text>
              </g>

              {/* Indexers and HF to License Manager */}
              <g 
                className="cursor-pointer select-none transition hover:opacity-100"
                onClick={() => handlePortClick('8089')}
              >
                <title>{isFa ? 'کلیک برای بررسی پورت ۸۰۸۹ لایسنس' : 'Click to inspect license port 8089'}</title>
                <path d="M 720 330 L 890 550" fill="none" stroke="#00d0ff" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arr-cyan)" />
                <rect x="765" y="470" width="90" height="18" rx="4" fill={isDark ? '#0c111a' : '#ffffff'} stroke="#00d0ff" strokeWidth={isPortHighlighted('8089') ? 2 : 1} />
                <text x="810" y="483" fontSize="10" fontWeight="bold" fill="#00d0ff" textAnchor="middle">8089 License</text>
              </g>
            </g>

            {/* ============================================================== */}
            {/* COMPONENT SYMBOLS & SERVER BLADES */}
            {/* ============================================================== */}

            {/* SOC Users Group (Top Left) */}
            <g transform="translate(60, 45)">
              <rect 
                x="0" 
                y="0" 
                width="120" 
                height="80" 
                fill={isDark ? '#1e293b' : '#ffffff'} 
                stroke={isDark ? '#475569' : '#94a3b8'} 
                strokeWidth="2" 
                rx="10"
                filter="url(#blade-shadow)"
              />
              {/* 3 User silhouettes */}
              <circle cx="60" cy="30" r="10" fill={isDark ? '#60a5fa' : '#2563eb'} />
              <path d="M 40 58 C 40 45 80 45 80 58" fill={isDark ? '#60a5fa' : '#2563eb'} />
              <circle cx="35" cy="34" r="7" fill={isDark ? '#94a3b8' : '#64748b'} />
              <path d="M 22 58 C 22 48 48 48 48 58" fill={isDark ? '#94a3b8' : '#64748b'} />
              <circle cx="85" cy="34" r="7" fill={isDark ? '#94a3b8' : '#64748b'} />
              <path d="M 72 58 C 72 48 98 48 98 58" fill={isDark ? '#94a3b8' : '#64748b'} />
              <text x="60" y="73" fontSize="11" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'} textAnchor="middle">
                SOC Analysts
              </text>
            </g>

            {/* NODE 1: SEARCH HEAD (Top Center) */}
            <g 
              transform="translate(435, 40)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('sh')}
            >
              {/* Server Blade Case */}
              <rect 
                x="0" 
                y="0" 
                width="270" 
                height="105" 
                fill={activeNodeId === 'sh' ? (isDark ? '#172554' : '#eff6ff') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'sh' ? '#3b82f6' : (isDark ? '#3b82f688' : '#3b82f6')} 
                strokeWidth={activeNodeId === 'sh' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              {/* Server Rack Ears */}
              <rect x="-6" y="10" width="6" height="85" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />
              <rect x="270" y="10" width="6" height="85" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              {/* Status LED */}
              <circle cx="20" cy="20" r="4" fill="#10b981" />
              <circle cx="32" cy="20" r="4" fill="#3b82f6" />

              {/* Icon Graphic: Magnifying Glass over Screen */}
              <g transform="translate(18, 32)">
                <rect x="0" y="0" width="48" height="38" rx="4" fill="none" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="2" />
                <line x1="8" y1="12" x2="40" y2="12" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" />
                <line x1="8" y1="20" x2="30" y2="20" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" />
                <line x1="8" y1="28" x2="22" y2="28" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" />
                <circle cx="35" cy="26" r="8" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <line x1="41" y1="32" x2="47" y2="38" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Text Info */}
              <text x="80" y="32" fontSize="13" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>
                Search Head ({currentSettings.shHost.split('.')[0].toUpperCase()})
              </text>
              <text x="80" y="48" fontSize="11" fontFamily="monospace" fill={isDark ? '#93c5fd' : '#1d4ed8'}>
                {currentSettings.shHost}
              </text>
              <text x="80" y="64" fontSize="10" fontFamily="monospace" fill={isDark ? '#94a3b8' : '#64748b'}>
                IP: {currentSettings.shIp} | Web: 8000
              </text>
              <text x="80" y="80" fontSize="10" fontWeight="bold" fill="#00d0ff">
                Search Dispatch: 8089 REST
              </text>
            </g>

            {/* NODE 2: INDEXER PEER 01 (Middle Left) */}
            <g 
              transform="translate(370, 240)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('idx1')}
            >
              <rect 
                x="0" 
                y="0" 
                width="145" 
                height="145" 
                fill={activeNodeId === 'idx1' ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'idx1' ? '#f59e0b' : (isDark ? '#d9770688' : '#d97706')} 
                strokeWidth={activeNodeId === 'idx1' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              {/* Rack ears */}
              <rect x="-5" y="10" width="5" height="125" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />
              
              {/* Indexer Symbol: 3 Drive Bays with Activity LEDs */}
              {[20, 48, 76].map((by, i) => (
                <g key={`idx1-b-${i}`} transform={`translate(15, ${by})`}>
                  <rect x="0" y="0" width="115" height="20" rx="3" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.2" />
                  <circle cx="12" cy="10" r="3" fill="#10b981" />
                  <circle cx="22" cy="10" r="3" fill="#38bdf8" />
                  <line x1="32" y1="10" x2="105" y2="10" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,3" />
                </g>
              ))}

              <text x="72" y="115" fontSize="11.5" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'} textAnchor="middle">
                {currentSettings.idx1Host.split('.')[0]}
              </text>
              <text x="72" y="130" fontSize="9.5" fontFamily="monospace" fill={isDark ? '#fcd34d' : '#b45309'} textAnchor="middle">
                {currentSettings.idx1Ip}:9997
              </text>
            </g>

            {/* NODE 3: INDEXER PEER 02 (Middle Right) */}
            <g 
              transform="translate(620, 240)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('idx2')}
            >
              <rect 
                x="0" 
                y="0" 
                width="145" 
                height="145" 
                fill={activeNodeId === 'idx2' ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'idx2' ? '#f59e0b' : (isDark ? '#d9770688' : '#d97706')} 
                strokeWidth={activeNodeId === 'idx2' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              <rect x="145" y="10" width="5" height="125" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              {/* 3 Drive Bays */}
              {[20, 48, 76].map((by, i) => (
                <g key={`idx2-b-${i}`} transform={`translate(15, ${by})`}>
                  <rect x="0" y="0" width="115" height="20" rx="3" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.2" />
                  <circle cx="12" cy="10" r="3" fill="#10b981" />
                  <circle cx="22" cy="10" r="3" fill="#38bdf8" />
                  <line x1="32" y1="10" x2="105" y2="10" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,3" />
                </g>
              ))}

              <text x="72" y="115" fontSize="11.5" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'} textAnchor="middle">
                {currentSettings.idx2Host.split('.')[0]}
              </text>
              <text x="72" y="130" fontSize="9.5" fontFamily="monospace" fill={isDark ? '#fcd34d' : '#b45309'} textAnchor="middle">
                {currentSettings.idx2Ip}:9997
              </text>
            </g>

            {/* NODE 4: HEAVY FORWARDER (Bottom Center) */}
            <g 
              transform="translate(435, 485)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('hf')}
            >
              <rect 
                x="0" 
                y="0" 
                width="270" 
                height="175" 
                fill={activeNodeId === 'hf' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'hf' ? '#10b981' : (isDark ? '#10b98188' : '#10b981')} 
                strokeWidth={activeNodeId === 'hf' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              <rect x="-6" y="15" width="6" height="145" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />
              <rect x="270" y="15" width="6" height="145" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              {/* Title & Host */}
              <text x="20" y="28" fontSize="13" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>
                Heavy Forwarder ({currentSettings.hfHost.split('.')[0].toUpperCase()})
              </text>
              <text x="20" y="44" fontSize="11" fontFamily="monospace" fill={isDark ? '#6ee7b7' : '#047857'}>
                {currentSettings.hfHost} — {currentSettings.hfIp}
              </text>

              {/* Internal Functional Pipeline Blocks inside HF */}
              <g transform="translate(18, 54)">
                {/* 1. Ingestion Listeners */}
                <rect x="0" y="0" width="70" height="52" rx="4" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
                <text x="35" y="16" fontSize="9" fontWeight="bold" fill={isDark ? '#94a3b8' : '#475569'} textAnchor="middle">INGEST</text>
                <text x="35" y="28" fontSize="8" fill="#f97316" textAnchor="middle">514 / 1514</text>
                <text x="35" y="38" fontSize="8" fill="#a855f7" textAnchor="middle">8088 HEC</text>
                <text x="35" y="48" fontSize="8" fill="#44b700" textAnchor="middle">9997 TCP</text>

                {/* Arrow */}
                <path d="M 73 26 L 81 26" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" markerEnd="url(#arr-green)" />

                {/* 2. Parsing Pipeline */}
                <rect x="85" y="0" width="70" height="52" rx="4" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
                <text x="120" y="16" fontSize="9" fontWeight="bold" fill={isDark ? '#94a3b8' : '#475569'} textAnchor="middle">PARSING</text>
                <text x="120" y="28" fontSize="8" fill={isDark ? '#38bdf8' : '#0284c7'} textAnchor="middle">props.conf</text>
                <text x="120" y="38" fontSize="8" fill={isDark ? '#38bdf8' : '#0284c7'} textAnchor="middle">LineBreaker</text>
                <text x="120" y="48" fontSize="8" fill={isDark ? '#f59e0b' : '#d97706'} textAnchor="middle">PII Masking</text>

                {/* Arrow */}
                <path d="M 158 26 L 166 26" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" markerEnd="url(#arr-green)" />

                {/* 3. Output Queue */}
                <rect x="170" y="0" width="65" height="52" rx="4" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
                <text x="202" y="16" fontSize="9" fontWeight="bold" fill={isDark ? '#94a3b8' : '#475569'} textAnchor="middle">OUTPUT</text>
                <text x="202" y="28" fontSize="8" fill="#44b700" textAnchor="middle">tcpoutQueue</text>
                <text x="202" y="40" fontSize="8" fill="#44b700" textAnchor="middle">AutoLB: 15s</text>
              </g>

              {/* Dynamic TLS Status Badge */}
              <g transform="translate(20, 118)">
                <rect 
                  x="0" 
                  y="0" 
                  width="230" 
                  height="26" 
                  rx="6" 
                  fill={effectiveTls ? '#052e16' : '#450a0a'} 
                  stroke={effectiveTls ? '#10b981' : '#ef4444'} 
                  strokeWidth="1.2" 
                />
                <circle cx="16" cy="13" r="5" fill={effectiveTls ? '#10b981' : '#ef4444'} />
                <text x="30" y="17" fontSize="10.5" fontWeight="bold" fill={effectiveTls ? '#34d399' : '#fca5a5'}>
                  {effectiveTls ? '🔒 TLS 1.3 Encryption Active (outputs.conf)' : '⚠️ Cleartext TCP Forwarding (useSSL = false)'}
                </text>
              </g>

              {/* Bottom Specs */}
              <text x="20" y="160" fontSize="9.5" fill={isDark ? '#94a3b8' : '#64748b'}>
                Throughput: ~{dynamicLogSources.reduce((s, x) => s + x.eventsPerSec, 0).toLocaleString()} EPS | Target: {currentSettings.idx1Ip}, {currentSettings.idx2Ip}
              </text>
            </g>

            {/* LOG SOURCES (Bottom Left Column) */}
            <g transform="translate(35, 455)">
              {(dynamicLogSources.slice(0, 4)).map((src, i) => {
                const colors = ['#f97316', '#ea580c', '#44b700', '#a855f7'];
                const strokeColor = colors[i % colors.length];
                return (
                  <g 
                    key={src.id || i}
                    transform={`translate(0, ${i * 58})`} 
                    className="cursor-pointer"
                    onClick={() => setActiveNodeId('hf')}
                  >
                    <rect x="0" y="0" width="225" height="48" rx="6" fill={isDark ? '#1e293b' : '#ffffff'} stroke={strokeColor} strokeWidth="1.2" />
                    <circle cx="15" cy="24" r="5" fill={strokeColor} />
                    <text x="30" y="20" fontSize="11" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>{src.name}</text>
                    <text x="30" y="34" fontSize="9.5" fontFamily="monospace" fill={isDark ? '#fdba74' : '#c2410c'}>
                      {src.ip} → {src.protocol}:{src.port} ({src.eventsPerSec} EPS)
                    </text>
                  </g>
                );
              })}
            </g>

            {/* MANAGEMENT SERVERS (Right Column) */}

            {/* NODE 5: CLUSTER MASTER (Top Right) */}
            <g 
              transform="translate(880, 65)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('cm')}
            >
              <rect 
                x="0" 
                y="0" 
                width="235" 
                height="160" 
                fill={activeNodeId === 'cm' ? (isDark ? '#082f49' : '#e0f2fe') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'cm' ? '#0284c7' : (isDark ? '#0284c788' : '#0284c7')} 
                strokeWidth={activeNodeId === 'cm' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              <rect x="-5" y="15" width="5" height="130" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              {/* Symbol: 3 Synchronization Sliders */}
              <g transform="translate(18, 20)">
                <circle cx="10" cy="10" r="4" fill="#00d0ff" />
                <text x="24" y="14" fontSize="12" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>
                  Cluster Master (CM)
                </text>
                <text x="24" y="28" fontSize="10" fontFamily="monospace" fill={isDark ? '#7dd3fc' : '#0369a1'}>
                  cm01-master.corp.local
                </text>

                {/* Replication Sliders Graphic */}
                <g transform="translate(10, 42)">
                  <line x1="20" y1="0" x2="20" y2="40" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="3" />
                  <circle cx="20" cy="15" r="7" fill="#00d0ff" />

                  <line x1="60" y1="0" x2="60" y2="40" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="3" />
                  <circle cx="60" cy="25" r="7" fill="#00d0ff" />

                  <line x1="100" y1="0" x2="100" y2="40" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="3" />
                  <circle cx="100" cy="10" r="7" fill="#00d0ff" />

                  <line x1="140" y1="0" x2="140" y2="40" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="3" />
                  <circle cx="140" cy="30" r="7" fill="#00d0ff" />
                </g>

                <text x="0" y="105" fontSize="10" fontWeight="bold" fill="#00d0ff">
                  Mgmt Port: 8089 (REST)
                </text>
                <text x="0" y="120" fontSize="9.5" fill={isDark ? '#94a3b8' : '#64748b'}>
                  Replication: RF=2, SF=2
                </text>
              </g>
            </g>

            {/* NODE 6: DEPLOYMENT SERVER (Middle Right) */}
            <g 
              transform="translate(880, 260)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('ds')}
            >
              <rect 
                x="0" 
                y="0" 
                width="235" 
                height="175" 
                fill={activeNodeId === 'ds' ? (isDark ? '#082f49' : '#e0f2fe') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'ds' ? '#0284c7' : (isDark ? '#0284c788' : '#0284c7')} 
                strokeWidth={activeNodeId === 'ds' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              <rect x="-5" y="15" width="5" height="145" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              <g transform="translate(18, 20)">
                <circle cx="10" cy="10" r="4" fill="#00d0ff" />
                <text x="24" y="14" fontSize="12" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>
                  Deployment Server (DS)
                </text>
                <text x="24" y="28" fontSize="10" fontFamily="monospace" fill={isDark ? '#7dd3fc' : '#0369a1'}>
                  {currentSettings.dsHost} ({currentSettings.dsIp})
                </text>

                {/* App Distribution Tree Graphic */}
                <g transform="translate(20, 42)">
                  <rect x="50" y="0" width="36" height="20" rx="3" fill="#0284c7" />
                  <text x="68" y="14" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">APPS</text>
                  <path d="M 68 20 L 68 32 M 30 32 L 106 32 M 30 32 L 30 42 M 106 32 L 106 42" stroke={isDark ? '#7dd3fc' : '#0284c7'} strokeWidth="2" fill="none" />
                  <rect x="15" y="42" width="30" height="16" rx="2" fill={isDark ? '#334155' : '#e2e8f0'} />
                  <text x="30" y="54" fontSize="8" fill={isDark ? '#ffffff' : '#000000'} textAnchor="middle">HF</text>
                  <rect x="91" y="42" width="30" height="16" rx="2" fill={isDark ? '#334155' : '#e2e8f0'} />
                  <text x="106" y="54" fontSize="8" fill={isDark ? '#ffffff' : '#000000'} textAnchor="middle">UF</text>
                </g>

                <text x="0" y="125" fontSize="10" fontWeight="bold" fill="#00d0ff">
                  Client Port: 8089 (Phone-Home)
                </text>
                <text x="0" y="140" fontSize="9.5" fill={isDark ? '#94a3b8' : '#64748b'}>
                  Poll Interval: 60s | serverclass.conf
                </text>
              </g>
            </g>

            {/* NODE 7: LICENSE MASTER (Bottom Right) */}
            <g 
              transform="translate(880, 465)"
              className="cursor-pointer group"
              onClick={() => setActiveNodeId('lm')}
            >
              <rect 
                x="0" 
                y="0" 
                width="235" 
                height="195" 
                fill={activeNodeId === 'lm' ? (isDark ? '#082f49' : '#e0f2fe') : (isDark ? '#1e293b' : '#ffffff')} 
                stroke={activeNodeId === 'lm' ? '#0284c7' : (isDark ? '#0284c788' : '#0284c7')} 
                strokeWidth={activeNodeId === 'lm' ? "2.5" : "1.8"} 
                rx="10"
                filter="url(#blade-shadow)"
              />
              <rect x="-5" y="15" width="5" height="165" fill={isDark ? '#334155' : '#cbd5e1'} rx="2" />

              <g transform="translate(18, 20)">
                <circle cx="10" cy="10" r="4" fill="#00d0ff" />
                <text x="24" y="14" fontSize="12" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'}>
                  License Master (LM)
                </text>
                <text x="24" y="28" fontSize="10" fontFamily="monospace" fill={isDark ? '#7dd3fc' : '#0369a1'}>
                  lm01-license.corp.local
                </text>

                {/* Quota Ring Graphic */}
                <g transform="translate(70, 75)">
                  <circle cx="0" cy="0" r="28" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="6" />
                  <circle cx="0" cy="0" r="28" fill="none" stroke="#00d0ff" strokeWidth="6" strokeDasharray="175" strokeDashoffset="135" strokeLinecap="round" />
                  <text x="0" y="4" fontSize="10" fontWeight="bold" fill={isDark ? '#ffffff' : '#0f172a'} textAnchor="middle">21%</text>
                  <text x="0" y="15" fontSize="7" fill={isDark ? '#94a3b8' : '#64748b'} textAnchor="middle">105 GB</text>
                </g>

                <text x="0" y="130" fontSize="10" fontWeight="bold" fill="#00d0ff">
                  Slave Heartbeat: 8089 (REST)
                </text>
                <text x="0" y="145" fontSize="9.5" fill={isDark ? '#94a3b8' : '#64748b'}>
                  Daily Quota: 500 GB / day
                </text>
                <text x="0" y="160" fontSize="9" fill="#10b981">
                  License Status: Valid &amp; Active
                </text>
              </g>
            </g>

          </svg>
        </div>
      </div>

      {/* Selected Node Real-Time Inspector Panel (Bottom Drawer - Sirene Luxury Card) */}
      <div className="p-6 border-t border-white/[0.06] bg-[#07090e]/95 backdrop-blur-xl relative z-10">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Tab Switcher - Sirene Segmented Pill */}
          <div className="flex border-b border-white/[0.06] pb-3 gap-2.5 text-xs">
            <button
              onClick={() => setInspectorTab('node')}
              className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-2 ${
                inspectorTab === 'node'
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isFa ? '🖥️ مشخصات گره کلاستر اسپلانک' : 'Cluster Node Specifications'}</span>
            </button>
            <button
              onClick={() => setInspectorTab('port')}
              className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-2 ${
                inspectorTab === 'port'
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isFa ? '🔎 پایشگر هوشمند پورت‌های شبکه' : 'Network Port Investigator'}</span>
              {selectedPortFilter && (
                <span className="bg-cyan-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {selectedPortFilter}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Node Specifications */}
          {inspectorTab === 'node' && (
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              {/* Node Identity & Status */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                    activeNode.status === 'healthy'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}>
                    {activeNode.statusTextEn}
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    {isFa ? activeNode.titleFa : activeNode.titleEn}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {activeNode.hostname} ({activeNode.ip})
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  {isFa ? activeNode.detailsFa : activeNode.detailsEn}
                </p>

                {/* Telemetry Metrics Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeNode.metrics.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
                      }`}
                    >
                      <span className="text-slate-500">{m.label}:</span>
                      <span className="font-mono font-bold text-amber-500">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Ports & Jump to Configuration Stanza */}
              <div className="w-full lg:w-96 space-y-3 flex-shrink-0">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isFa ? 'پورت‌های فعال روی این گره:' : 'Active Listening & Target Ports:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.ports.map((p, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 font-mono text-[11px] text-cyan-400 font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isFa ? 'فایل‌های کانفیگ حاکم بر این گره:' : 'Governing Configuration Files:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.configs.map((cfg) => (
                      <button
                        key={cfg}
                        onClick={() => onSelectConfig && onSelectConfig(cfg)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1 transition"
                        title={isFa ? `ویرایش ${cfg}` : `Edit ${cfg}`}
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{cfg}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Network Port Investigator */}
          {inspectorTab === 'port' && (
            <div>
              {selectedPortFilter && portDetailedInfo[selectedPortFilter] ? (
                (() => {
                  const portInfo = portDetailedInfo[selectedPortFilter];
                  const portMeta = portColors[selectedPortFilter] || { color: '#00d0ff' };
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Port Details left pane */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center gap-3">
                          <span 
                            className="w-4 h-4 rounded-full animate-pulse" 
                            style={{ backgroundColor: portMeta.color }}
                          ></span>
                          <h3 className="text-lg font-black tracking-tight" style={{ color: portMeta.color }}>
                            {isFa ? portInfo.nameFa : portInfo.name}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {isFa ? portInfo.descFa : portInfo.descEn}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 block mb-1">{isFa ? 'پروتکل لایه انتقال:' : 'Transport Protocol:'}</span>
                            <span className="font-mono font-bold text-white">{portInfo.protocol}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 block mb-1">{isFa ? 'مسیر جریان کلاستر:' : 'Cluster Traffic Direction:'}</span>
                            <span className="font-mono text-slate-200 text-[11px] block truncate" title={isFa ? portInfo.directionFa : portInfo.directionEn}>
                              {isFa ? portInfo.directionFa : portInfo.directionEn}
                            </span>
                          </div>
                        </div>

                        {/* Security Advisory Box */}
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                          <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-amber-500 block">
                              {isFa ? 'سفارش امنیتی و کنترل ترافیک (Security Advisory):' : 'Security Advisory & Encryption Guidelines:'}
                            </span>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {isFa ? portInfo.recommendedTlsFa : portInfo.recommendedTls}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Config files and shell terminal checker right pane */}
                      <div className="lg:col-span-5 space-y-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            {isFa ? 'فایل‌های کانفیگ حاکم بر این پورت:' : 'Governing Splunk .conf Files:'}
                          </span>
                          <div className="font-mono text-xs text-slate-400">
                            {portInfo.governingConf}
                          </div>
                        </div>

                        {/* Interactive Verification Command Console */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            {isFa ? 'تایید سلامت روی سرور ردهت (RHEL Verification):' : 'RHEL Terminal Command Verification:'}
                          </span>
                          <div className="rounded-xl border border-slate-800 bg-[#070b12] overflow-hidden">
                            {/* Command Header bar */}
                            <div className="bg-[#121824] px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-[10px] text-slate-500 font-mono">
                              <span>bash console (RHEL)</span>
                              <span>active-check</span>
                            </div>
                            <div className="p-3 font-mono text-[11px] text-emerald-400 whitespace-pre overflow-x-auto leading-relaxed">
                              {portInfo.verifCommand}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs font-medium">
                    {isFa 
                      ? 'پورتی در کلاستر انتخاب نشده است. برای عیب‌یابی و پایش هوشمند، روی یکی از دکمه‌های فیلتر پورت در بالا یا روی برچسب پورت‌ها در دایاگرام کلیک کنید.'
                      : 'No port selected. Click on a port label in the topology diagram or use the filter legend buttons above to launch the interactive port investigator.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Permissions & Network Discovery Audit Modal */}
      {showAuditModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          <div className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col ${
            isDark ? 'bg-[#0a0f18] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 md:p-5 border-b flex items-center justify-between ${
              isDark ? 'bg-[#0f1726] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>{isFa ? 'بررسی مجوزهای سیستم‌عامل، ابزارهای شبکه و صحت داده‌های اسپلانک' : 'System Permissions, Network Tools & Data Fidelity Audit'}</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      systemAudit?.guidance.hasRootPrivilege
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                        : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                    }`}>
                      {systemAudit?.user?.isRoot ? 'ROOT ACCESS: OK' : `USER: ${systemAudit?.user?.username || 'user'}`}
                    </span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isFa 
                      ? 'پاسخ به سوالات دسترسی و ابزارهای شناسایی پورت و نحوه تبدیل داده‌های پیش‌فرض به داده‌های سرور شما' 
                      : 'Audit of host permissions, kernel socket discovery, and real config file availability.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAuditModal(false)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
              {/* Direct Reality Banner */}
              <div className={`p-4 rounded-xl border ${
                systemAudit?.isContainer
                  ? isDark 
                    ? 'bg-amber-950/25 border-amber-500/40 text-amber-200' 
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark 
                    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm">
                      {isFa 
                        ? 'چرا مقادیر پیش‌فرض (10.20.30.x) نمایش داده می‌شوند و وضعیت ابزارها چگونه است؟' 
                        : 'Why are default values (10.20.30.x) shown and what is the environment status?'}
                    </h4>
                    <p>
                      {isFa 
                        ? 'برنامه حاضر در این صفحه، درون یک کانتینر پیش‌نمایش ابری (Sandbox) اجرا می‌شود. تمام مجوزهای سیستمی Root فعال هستند و هسته سیستم‌عامل از طریق /proc/net/tcp مستقیماً پایش می‌شود؛ اما به این دلیل که سرویس اسپلانک سازمانی شما روی این سرور ابری نصب نیست، برنامه به صورت پیش‌فرض از آی‌پی‌ها و کانفیگ‌های نمونه استفاده می‌کند.'
                        : 'This web application is currently running in a cloud preview container. Root permissions are enabled and Linux /proc/net/tcp is actively polled. However, because your enterprise Splunk instance is not installed on this cloud runner, standard sample topology values (10.20.30.x) are rendered.'}
                    </p>
                    <p className="font-semibold text-amber-300 dark:text-amber-200">
                      {isFa
                        ? '💡 راهکار دریافت اطلاعات ۱۰۰٪ واقعی سرور شما: پکیج ردهت را از تب «دانلود پکیج لینوکس RHEL» دانلود کنید و روی سرور اصلی خود با دستور sudo ./start.sh یا sudo bash install-service.sh اجرا نمایید. برنامه به صورت خودکار تمام فایل‌های /opt/splunk/etc/system/local/*.conf و پورت‌های هسته لینوکس را خوانده و جایگزین می‌کند.'
                        : '💡 How to get 100% real data from your server: Download the standalone RHEL package from the RHEL Package tab and run "sudo ./start.sh" on your RedHat host. It will automatically parse all /opt/splunk configs and bind to real sockets.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Grid: User, Tools, Paths, Conf files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User & Privileges */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1724] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-amber-400">
                    <Shield className="w-4 h-4" />
                    <span>{isFa ? 'مجوزها و کاربر جاری سیستم' : 'User & OS Privileges'}</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'نام کاربری (whoami):' : 'Username:'}</span>
                      <span className="font-mono font-bold text-cyan-400">{systemAudit?.user?.username || 'root'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'شناسه کاربری (UID / GID):' : 'UID / GID:'}</span>
                      <span className="font-mono">{systemAudit?.user?.uid ?? 0} / {systemAudit?.user?.gid ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'سطح دسترسی Root:' : 'Root Privilege:'}</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.user?.isRoot ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {systemAudit?.user?.isRoot ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.user?.isRoot ? (isFa ? 'کامل (مجاز برای تمام پورت‌ها)' : 'Full Root') : (isFa ? 'محدود' : 'Non-Root')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">{isFa ? 'گروه‌های کاربری:' : 'Groups:'}</span>
                      <span className="font-mono text-[11px] text-slate-300">{(systemAudit?.user?.groups || ['root']).join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Network Discovery Tools */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1724] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-cyan-400">
                    <Radio className="w-4 h-4" />
                    <span>{isFa ? 'ابزارهای شناسایی پورت و شبکه لینوکس' : 'Linux Network & Port Tools'}</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'ابزار ss (iproute2):' : 'ss tool:'}</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.tools?.ss ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {systemAudit?.tools?.ss ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.tools?.ss ? (isFa ? 'نصب و فعال' : 'Installed') : (isFa ? 'محدودیت Netlink در کانتینر' : 'Restricted in Container')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'هسته لینوکس (/proc/net/tcp):' : 'Kernel /proc/net/tcp:'}</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isFa ? 'فعال و خوانا (بدون نیاز به ابزار جانبی)' : 'Active & Read Direct from Kernel'}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'ابزار ip / iproute:' : 'ip command:'}</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.tools?.ip ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {systemAudit?.tools?.ip ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.tools?.ip ? (isFa ? 'موجود' : 'Available') : (isFa ? 'یافت نشد' : 'Not installed')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">{isFa ? 'فایروال (firewall-cmd):' : 'Firewall (firewalld):'}</span>
                      <span className="font-mono text-slate-300">{systemAudit?.tools?.firewallCmd ? (isFa ? 'موجود روی سرور' : 'Installed') : (isFa ? 'غیرفعال (محیط کانتینر)' : 'Inactive in Container')}</span>
                    </div>
                  </div>
                </div>

                {/* Splunk Directory Discovery */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1724] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-orange-400">
                    <Server className="w-4 h-4" />
                    <span>{isFa ? 'مسیر و شناسایی اسپلانک روی هاست' : 'Splunk Host Detection'}</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'مسیر جستجو (SPLUNK_HOME):' : 'Splunk Home:'}</span>
                      <span className="font-mono text-cyan-400">{systemAudit?.splunkHome?.path || '/opt/splunk'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">{isFa ? 'وضعیت شناسایی اسپلانک:' : 'Detection Status:'}</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.splunkHome?.detected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {systemAudit?.splunkHome?.detected ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.splunkHome?.detected ? (isFa ? 'اسپلانک روی دیسک شناسایی شد' : 'Detected on disk') : (isFa ? 'یافت نشد (استفاده از داده نمونه)' : 'Not detected on this host')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">{isFa ? 'روش شناسایی:' : 'Discovery Source:'}</span>
                      <span className="font-mono text-[11px] text-slate-300">{systemAudit?.splunkHome?.source || 'Fallback'}</span>
                    </div>
                  </div>
                </div>

                {/* Splunk Local Conf Files Permissions */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1724] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-indigo-400">
                    <FileCode className="w-4 h-4" />
                    <span>{isFa ? 'دسترسی به فایل‌های محلی کانفیگ' : 'Local Configuration Access'}</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">server.conf:</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.filePermissions?.serverConf?.readable ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {systemAudit?.filePermissions?.serverConf?.readable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.filePermissions?.serverConf?.readable ? (isFa ? 'خوانا و استخراج‌شده' : 'Readable') : (isFa ? 'موجود نیست یا قفل است' : 'Missing or locked')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">outputs.conf:</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.filePermissions?.outputsConf?.readable ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {systemAudit?.filePermissions?.outputsConf?.readable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.filePermissions?.outputsConf?.readable ? (isFa ? 'خوانا و استخراج‌شده' : 'Readable') : (isFa ? 'موجود نیست یا قفل است' : 'Missing or locked')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">inputs.conf:</span>
                      <span className={`font-bold flex items-center gap-1 ${systemAudit?.filePermissions?.inputsConf?.readable ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {systemAudit?.filePermissions?.inputsConf?.readable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{systemAudit?.filePermissions?.inputsConf?.readable ? (isFa ? 'خوانا و استخراج‌شده' : 'Readable') : (isFa ? 'موجود نیست یا قفل است' : 'Missing or locked')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Host Listening Ports Table */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1724] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-sm flex items-center gap-2 text-emerald-400">
                    <Activity className="w-4 h-4" />
                    <span>{isFa ? 'پورت‌های لیسنینگ زنده شناسایی شده روی این ماشین' : 'Live Listening Ports Detected on this Host'}</span>
                  </h5>
                  <span className="font-mono text-[11px] text-slate-400">
                    {systemAudit?.listeningPorts?.length || 0} {isFa ? 'سوکت فعال' : 'active sockets'}
                  </span>
                </div>
                {systemAudit?.listeningPorts && systemAudit.listeningPorts.length > 0 ? (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left font-mono text-[11px]" dir="ltr">
                        <thead className="bg-[#141e30] text-slate-400 border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="p-2.5">Port</th>
                            <th className="p-2.5">Protocol</th>
                            <th className="p-2.5">Bind Address</th>
                            <th className="p-2.5">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {systemAudit.listeningPorts.map((lp, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition">
                              <td className="p-2.5 font-bold text-amber-400">{lp.port}</td>
                              <td className="p-2.5 text-cyan-400">{lp.protocol}</td>
                              <td className="p-2.5 text-slate-300">{lp.address}</td>
                              <td className="p-2.5">
                                {lp.isSplunk ? (
                                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold">
                                    SPLUNK
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">SYSTEM / APP</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {isFa ? 'هیچ سوکت فعالی شناسایی نشد یا مجوز دسترسی محدود است.' : 'No active sockets discovered.'}
                  </p>
                )}
              </div>

              {/* Ready Terminal Command Cheatsheet */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'دستورات اجرایی برای خواندن صد در صد داده‌های واقعی سرور ردهت' : 'Terminal Commands for 100% Real Data on RHEL'}</span>
                </h5>
                <div className="rounded-xl border border-slate-800 bg-[#070b12] p-3 font-mono text-[11px] text-emerald-400 space-y-2" dir="ltr">
                  <div>
                    <span className="text-slate-500"># 1. Run with full root privileges so all listening ports and /opt/splunk files are readable:</span>
                    <p className="text-amber-300 font-bold">sudo ./start.sh</p>
                  </div>
                  <div>
                    <span className="text-slate-500"># 2. Or install as automatic systemd background service:</span>
                    <p className="text-amber-300 font-bold">sudo bash install-service.sh</p>
                  </div>
                  <div>
                    <span className="text-slate-500"># 3. Grant your regular user read permission to Splunk configurations:</span>
                    <p className="text-slate-300">sudo usermod -aG splunk $USER</p>
                    <p className="text-slate-300">sudo chmod -R g+r /opt/splunk/etc/system/local</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${
              isDark ? 'bg-[#0f1726] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition cursor-pointer"
              >
                {isFa ? 'متوجه شدم و بستن پنجره' : 'Got it & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
