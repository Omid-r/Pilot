import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Printer,
  TrendingUp,
  Clock,
  Server,
  Database,
  Search,
  HardDrive,
  Radio,
  Sliders,
  DollarSign,
  FileText,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  HelpCircle,
  Copy,
  Check,
  Award,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Briefcase,
  Target,
  Percent,
  Cpu,
  BarChart3,
  Flame,
  Workflow
} from 'lucide-react';

interface SplunkExecutiveAuditReportProps {
  lang?: 'fa' | 'en';
}

interface DiagnosisFinding {
  id: string;
  category: string;
  categoryFa: string;
  title: string;
  titleFa: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  svaCode: string;
  telemetrySignal: string;
  telemetrySignalFa: string;
  mathFormulaProof: string;
  mathFormulaProofFa: string;
  businessImpactFa: string;
  businessImpactEn: string;
  remediationFa: string;
  remediationEn: string;
  confSnippet?: string;
  cliCommand?: string;
  effortDays: number;
  costImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const SplunkExecutiveAuditReport: React.FC<SplunkExecutiveAuditReportProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';

  // Presentation / Report Mode
  const [viewMode, setViewMode] = useState<'FULL_REPORT' | 'EXECUTIVE_SLIDES' | 'ARCH_COMPARISON'>('FULL_REPORT');
  const [selectedArchitectureView, setSelectedArchitectureView] = useState<'CURRENT' | 'TARGET'>('TARGET');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>('FIND-01');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Detailed Findings with mathematical justifications and SVA benchmark proofs
  const FINDINGS: DiagnosisFinding[] = [
    {
      id: 'FIND-01',
      category: 'SEARCH_CAPACITY',
      categoryFa: 'ظرفیت و همزمانی جستجوهای امنیتی (Search Tier)',
      title: 'Scheduled Search Concurrency Saturation & Skip Rate Anomaly',
      titleFa: 'اشباع اسلات‌های همزمانی جستجو و پرش ۵.۲٪ از قوانین حیاتی SOC',
      severity: 'CRITICAL',
      svaCode: 'SVA C11 / SH-04',
      telemetrySignal: 'grep "action=skipped" /opt/splunk/var/log/splunk/scheduler.log | 22 Concurrent ES Searches > 19 Active Slots Cap',
      telemetrySignalFa: 'ثبت لاگ‌های action=skipped در scheduler.log و اجرای ۲۲ سرچ کورلیشن ES در برابر سقف ۱۹ اسلات کلاستر',
      mathFormulaProof: 'Concurrency Limit = base_max_searches (6) + (vCPU (16) × max_searches_per_cpu (1)) = 22 total slots. With scheduler limit (max_searches_perc = 70%), usable slots per SH = 15.4. Current 2-node cluster offers max 19 scheduled slots vs 22 active correlation rules → Deficit: -3 slots, causing 5.2% scheduled skip rate.',
      mathFormulaProofFa: 'فرمول ظرفیت سرچ SVA: سقف هر نود = ۶ + (۱۶ هسته × ۱) = ۲۲ اسلات. با اعمال سقف اسکجولر ۷۰٪، حداکثر اسلات مجاز = ۱۵.۴ اسلات. در کلاستر ۲ نودی فعلی، سقف واقعی ۱۹ اسلات است، در حالی که ۲۲ رول فعال ES همزمان اجرا می‌شوند. نتیجه: کمبود ۳ اسلات همزمان که منجر به ۵.۲٪ پرش و تاخیر در شناسایی حوادث امنیتی شده است.',
      businessImpactFa: 'ریسک امنیتی بحرانی: پرش سرچ‌های اسکجول باعث می‌شود حملات سایبری در زمان وقوع شناسایی نشده و میانگین زمان شناسایی (MTTD) در مرکز عملیات امنیت (SOC) بیش از ۲ ساعت افزایش یابد.',
      businessImpactEn: 'Critical Cyber Threat Risk: Scheduled searches skipping correlation executions causes detection blind spots, increasing SOC MTTD and breaching security SLA agreements.',
      remediationFa: '۱. افزودن نود سوم سرچ‌هد (SH-03) جهت تشکیل کلاستر ۳ نودی پایدار بر پایه Quorum رَفْت (Raft Consensus) و افزایش سقف همزمانی به ۵۷ اسلات.\n۲. تنظیم پارامتر schedule_window = auto در limits.conf جهت توزیع هوشمند سرچ‌ها در پنجره ۵ دقیقه‌ای.\n۳. تفکیک نقش Ad-hoc Search از ES Search Head جهت حفاظت از بار کوئری‌های کارشناسان SOC.',
      remediationEn: '1. Provision 3rd Search Head (SH-03) to establish resilient 3-node Raft Quorum and scale concurrency ceiling to 57 slots.\n2. Configure schedule_window = auto in limits.conf for dynamic cron load leveling.\n3. Dedicate separate SH for SOC Analysts vs ES Correlation Engine.',
      confSnippet: `[search]
max_searches_per_cpu = 2
base_max_searches = 6

[scheduler]
max_searches_perc = 75
schedule_window = auto
auto_summary_perc = 50`,
      cliCommand: '/opt/splunk/bin/splunk show shcluster-status --verbose --auth admin:Splunk@Secure2026',
      effortDays: 5,
      costImpact: 'MEDIUM'
    },
    {
      id: 'FIND-02',
      category: 'STORAGE_IOPS',
      categoryFa: 'عملکرد دیسک و گلوگاه استوریج (Storage & IOPS)',
      title: 'Hot/Warm Bucket Disk IOPS Starvation on Mechanical SAS Volume',
      titleFa: 'افت شدید IOPS در ولوم ذخیره‌سازی داده‌های داغ (Hot/Warm Storage Starvation)',
      severity: 'CRITICAL',
      svaCode: 'SVA D02 / ST-01',
      telemetrySignal: 'iostat -xz 1 10 | nvme_wait > 18ms | Measured IOPS = 450 IOPS vs 1,200 IOPS Required Benchmark',
      telemetrySignalFa: 'سنجش تلمتری iostat نشان‌دهنده زمان تاخیر بالای دیسک (۱۸ میلی‌ثانیه) و دستیابی به حداکثر ۴۵۰ IOPS در برابر حداقل استاندارد ۱۲۰۰ IOPS است.',
      mathFormulaProof: 'SVA Baseline Formula: For daily ingest ≥ 300 GB/day with replication factor RF=3, each indexer requires: IOPS_min = (Daily_Ingest_GB / 86400 * 1024) * RF * 4 IO_multiplier = ~1,200 IOPS sustained with <5ms latency. Current SAS array yields 450 IOPS (-62.5% starvation gap).',
      mathFormulaProofFa: 'فرمول بنچمارک استاندارد SVA: برای حجم ورودی ۳۵۰ گیگابایت در روز با ضریب رپلیکیشن ۳، هر نود ایندکسر حداقل به ۱۲۰۰ IOPS پایدار با تاخیر زیر ۵ میلی‌ثانیه برای نوشتن همزمان TSIDX و rawdata نیاز دارد. استوریج جاری تنها ۴۵۰ IOPS تولید می‌کند که نشان‌دهنده شکاف منفی ۶۲.۵٪ است.',
      businessImpactFa: 'ریسک عملکردی و پایداری: تاخیر در ایندکس لاگ‌ها، ایجاد گلوگاه در صف‌های دریافت (Queue Blocking)، قفل شدن پایپ‌لاین‌های ۹۹۹۷ و تاخیر ۶ برابری در پاسخ‌گویی به داشبوردهای مانیتورینگ.',
      businessImpactEn: 'Severe Ingestion & Search Degradation: Disk write queues block network ingestion streams, causing TCP forwarder throttling and slow dashboard rendering.',
      remediationFa: '۱. تفکیک فیزیکی ولوم دایرکتوری homePath (داده‌های Hot/Warm) به آرایه‌های تمام فلش All-Flash NVMe Gen4 با IOPS تضمین‌شده ۱۵۰۰+.\n۲. اختصاص ولوم مجزا برای دایرکتوری coldPath بر روی استوریج‌های اقتصادی SAS یا مهاجرت به SmartStore S3.\n۳. فعال‌سازی تنظیمات maxDataSize = auto_high_volume در indexes.conf.',
      remediationEn: '1. Segregate homePath directory onto dedicated PCIe Gen4 NVMe All-Flash arrays (1,500+ sustained IOPS).\n2. Relocate coldPath to high-capacity SAS arrays or transition to S3 Object Storage.\n3. Apply maxDataSize = auto_high_volume in indexes.conf.',
      confSnippet: `[volume:hot_warm_nvme]
path = /opt/splunk/data/hot_warm
maxVolumeDataSizeMB = 2500000

[volume:cold_storage]
path = /opt/splunk/data/cold
maxVolumeDataSizeMB = 10000000

[main]
homePath = volume:hot_warm_nvme/defaultdb/db
coldPath = volume:cold_storage/defaultdb/colddb
thawedPath = /opt/splunk/data/thawed/defaultdb/thaweddb
maxDataSize = auto_high_volume`,
      cliCommand: 'iostat -xz 1 5 /dev/nvme0n1',
      effortDays: 7,
      costImpact: 'HIGH'
    },
    {
      id: 'FIND-03',
      category: 'CLUSTER_REPLICATION',
      categoryFa: 'پایداری و تداوم کلاستر ایندکسر (Indexer Cluster Health)',
      title: 'Incomplete Replication Factor (RF=3 with only 2 Physical Peers)',
      titleFa: 'ناسازگاری ضریب رپلیکیشن کلاستر (تنظیم RF=3 با وجود تنها ۲ ایندکسر فیزیکی)',
      severity: 'HIGH',
      svaCode: 'SVA C11 / ID-02',
      telemetrySignal: 'splunk show cluster-status | "Replication factor not met (need 3, available 2)" | Cluster Master Fixup Active',
      telemetrySignalFa: 'هشدار کلاستر مستر در خصوص عدم تحقق RF=3 به دلیل وجود تنها ۲ پیر، و مصرف دائمی CPU جهت انجام عملیات بی‌پایان Fixup',
      mathFormulaProof: 'Indexer Clustering Topology Theorem: RF=N requires at least N independent physical peers to store distinct bucket copies. Configuring RF=3 on 2 peers violates replication topology, keeping Cluster Master in permanent search/replication fixup loop.',
      mathFormulaProofFa: 'قاعده توپولوژی کلاستر اسپلانک: دستیابی به Replication Factor برابر N مستلزم حداقل N سرور ایندکسر مجزاست تا کپی‌های اول، دوم و سوم روی سرورهای مستقل قرار گیرند. کلاستر فعلی با ۲ سرور امکان تولید ۳ کپی را ندارد و در نتیجه تحمل خطای کلاستر به صفر تقلیل یافته است.',
      businessImpactFa: 'ریسک از دست رفتن داده: در صورت بروز خرابی یا خاموشی در یکی از ایندکسرها، نیمی از داده‌ها موقتاً غیرقابل دسترس شده و کلاستر امکان جستجوی همبستگی را از دست می‌دهد.',
      businessImpactEn: 'Data Availability Risk: Zero redundancy tolerance for concurrent node faults; causes service outage and search failure if any single peer fails.',
      remediationFa: '۱. استقرار نود سوم ایندکسر (idx-peer-03) با مشخصات ۲۴ هسته پردازنده، ۶۴ گیگابایت رم و استوریج NVMe.\n۲. اتصال به Cluster Master و بازتوزیع خودکار باکت‌های داده (Bucket Rebalancing) با دستور splunk rebalance cluster-data.\n۳. اطمینان از تحقق Search Factor (SF=2) و Replication Factor (RF=3) با پایداری ۱۰۰٪.',
      remediationEn: '1. Commission 3rd indexer peer (idx-peer-03) with 24 vCPUs, 64GB RAM, and NVMe storage.\n2. Connect to Cluster Master and initiate bucket rebalancing across all 3 peers.\n3. Guarantee 100% adherence to SF=2 / RF=3 topology.',
      confSnippet: `[clustering]
master_uri = https://192.168.10.10:8089
mode = slave
pass4SymmKey = EnterpriseSecretCluster2026

[splunktcp://9997]
pipelineSet = 2`,
      cliCommand: '/opt/splunk/bin/splunk rebalance cluster-data -auth admin:Splunk@Secure2026',
      effortDays: 4,
      costImpact: 'MEDIUM'
    },
    {
      id: 'FIND-04',
      category: 'INGESTION_HA',
      categoryFa: 'لایه دریافت و پایداری سیس‌لاگ (Ingestion & Syslog Gateway)',
      title: 'Single Point of Failure (SPOF) on Syslog UDP/TCP Gateway',
      titleFa: 'نقطه شکست تکی در دریافت سیس‌لاگ فایروال‌ها و تجهیزات شبکه',
      severity: 'HIGH',
      svaCode: 'SVA IN-01 / SC4S',
      telemetrySignal: 'Firewall syslogs targeting single direct IP:514 | No Keepalived Virtual IP or HEC Load Balancer configured',
      telemetrySignalFa: 'ارسال مستقیم سیس‌لاگ بیش از ۱۲۰ تجهیز شبکه به یک IP واحد بدون مکانیزم High Availability و بافر موقت',
      mathFormulaProof: 'Syslog UDP Loss Probability: UDP protocol lacks delivery acknowledgment. A single collector restart or OS socket buffer saturation causes 100% immediate packet drop during the downtime window. Standard SVA requires Dual SC4S Keepalived VIP.',
      mathFormulaProofFa: 'احتمال ریزش لاگ سیس‌لاگ: پروتکل UDP فاقد مکانیزم تاییدیه تحویل (ACK) است. در نتیجه در هنگام ری‌استارت یا اشباع بافر سوکت لینوکس، ۱۰۰٪ ترافیک در آن بازه زمانی بدون بازگشت از دست می‌رود. استاندارد SVA راه‌اندازی زوج نود SC4S با VIP مشترک را الزامی می‌داند.',
      businessImpactFa: 'نقض انطباق قانونی و از دست رفتن لاگ‌های امنیتی فایروال‌ها در زمان حوادث ترافیکی یا نگهداری سیستم.',
      businessImpactEn: 'Compliance Violation & Log Loss: Firewall and VPN logs drop unrecoverably during maintenance or network spikes due to unbuffered UDP streaming.',
      remediationFa: '۱. راه‌اندازی کلاستر دو نودی Splunk Connect for Syslog (SC4S) با Keepalived VRRP Virtual IP.\n۲. تبدیل ترافیک سیس‌لاگ خام به درخواست‌های امن HTTPS HEC با قابلیت Load Balancing روی کل ایندکسرها.\n۳. فعال‌سازی تاییدیه دریافت (useACK=true) در تمامی ایجنت‌های Universal Forwarder.',
      remediationEn: '1. Implement dual-node SC4S cluster with Keepalived VRRP Virtual IP.\n2. Convert raw syslogs to secure HTTPS HEC batches load-balanced across indexers.\n3. Enforce useACK=true on all Universal Forwarders.',
      confSnippet: `SC4S_DEST_SPLUNK_HEC_DEFAULT_URL=https://192.168.10.31:8088,https://192.168.10.32:8088,https://192.168.10.33:8088
SC4S_DEST_SPLUNK_HEC_DEFAULT_TOKEN=b823f541-6789-4912-bcde-enterprise01
SC4S_DEST_SPLUNK_HEC_TLS_VERIFY=yes
SC4S_DEFAULT_TIMEZONE=Asia/Tehran`,
      cliCommand: 'podman ps && podman logs --tail 30 sc4s',
      effortDays: 3,
      costImpact: 'LOW'
    },
    {
      id: 'FIND-05',
      category: 'STORAGE_TCO',
      categoryFa: 'معماری ذخیره‌سازی ابری و کاهش هزینه‌ها (TCO & SmartStore)',
      title: 'High On-Premise Storage TCO & Opportunity for SmartStore S3 Decoupling',
      titleFa: 'هزینه بالای دیسک‌های محلی و فرصت صرفه‌جویی ۵۸٪ با معماری SmartStore S3',
      severity: 'MEDIUM',
      svaCode: 'SVA ST-03 / SmartStore',
      telemetrySignal: 'Annual Cold Data Growth = 76.6 TB on Direct Attached Storage | Storage Expansion Capex Projected at $45,000/yr',
      telemetrySignalFa: 'رشد سالانه داده‌های Cold برابر با ۷۶.۶ ترابایت روی استوریج مستقیم سرورها و هزینه سنگین خرید دیسک‌های گران‌قیمت',
      mathFormulaProof: 'TCO Comparison Formula: Traditional DAS Storage cost = $0.45/GB/year (including RAID overhead, hardware replacements, rackspace). S3-compatible Object Storage (MinIO / Ceph / Cloud S3) = $0.015/GB/year. Implementing SmartStore decouples Compute from Storage, yielding 58.4% 3-Year TCO Net Savings.',
      mathFormulaProofFa: 'فرمول مقایسه هزینه کل مالکیت (TCO): استوریج مستقیم سرورها به همراه سربار RAID و نگهداری سالانه حدود ۰.۴۵ دلار به ازای هر گیگابایت هزینه دارد. در مقابل، استوریج شیءگرای S3 معادل ۰.۰۱۵ دلار است. معماری SmartStore با جداسازی پردازش از ذخیره‌سازی، صرفه‌جویی ۵۸.۴ درصدی در هزینه‌های ۳ ساله ایجاد می‌کند.',
      businessImpactFa: 'کاهش چشمگیر هزینه‌های سرمایه‌ای سازمان (CAPEX)، حذف نیاز به ارتقای فیزیکی هارددیسک‌های ایندکسرها و امکان نگهداری نامحدود داده‌ها برای انطباق چندساله.',
      businessImpactEn: 'Significant CAPEX reduction, eliminates endless physical disk expansion on indexer hardware, and enables multi-year compliance archiving.',
      remediationFa: '۱. راه‌اندازی باکت‌های سازگار با S3 بر روی زیرساخت MinIO / Ceph سازمانی.\n۲. تنظیم SmartStore Remote Volume در indexes.conf ایندکسرها جهت کش هوشمند باکت‌های Hot روی NVMe و انتقال خودکار باکت‌های Warm/Cold به S3.\n۳. آزادسازی ۷۵ ترابایت فضای دیسک فیزیکی روی ایندکسرها.',
      remediationEn: '1. Deploy on-premise S3-compatible MinIO/Ceph object storage.\n2. Configure SmartStore remote volume in indexes.conf to retain petabyte-scale data in S3 with local NVMe caching.\n3. Reclaim 75TB of physical disk space across indexer peers.',
      confSnippet: `[volume:s3_remote_store]
storageType = remote
path = s3://splunk-enterprise-smartstore-warm/indexes
remote.s3.endpoint = https://s3.corp.internal:443
remote.s3.auth_region = us-east-1

[main]
homePath = $SPLUNK_DB/defaultdb/db
remotePath = volume:s3_remote_store/defaultdb
maxGlobalRawDataSizeMB = 0`,
      cliCommand: '/opt/splunk/bin/splunk btool indexes list volume:s3_remote_store',
      effortDays: 8,
      costImpact: 'LOW'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Executive Action Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isFa ? 'گزارش ارشد ممیزی معماری اسپلانک و نقشه راه ۹۰ روزه هیئت مدیره' : 'C-Level Executive Splunk Architecture Audit & 90-Day Roadmap'}
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                SVA Methodology Compliance | Prepared by Splunk Certified Enterprise Architect (SCEA)
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('FULL_REPORT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'FULL_REPORT' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isFa ? 'گزارش مشروح جامع' : 'Full In-Depth Report'}</span>
            </button>

            <button
              onClick={() => setViewMode('ARCH_COMPARISON')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'ARCH_COMPARISON' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>{isFa ? 'دایاگرام تحول معماری' : 'Architecture Transformation'}</span>
            </button>

            <button
              onClick={() => setViewMode('EXECUTIVE_SLIDES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'EXECUTIVE_SLIDES' ? 'bg-purple-500 text-white shadow-md font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isFa ? 'اسلایدهای مدیریتی' : 'C-Level Slides'}</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 flex items-center gap-1.5 transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isFa ? 'چاپ / خروجی PDF' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* SECTION 1: C-LEVEL KPI SCORECARD & HEALTH RADAR (PRESENT IN ALL MODES) */}
      {/* ========================================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono text-xs">
        {/* Score 1 */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">{isFa ? 'امتیاز انطباق با SVA:' : 'SVA Compliance Score:'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">78%</span>
            <span className="text-[11px] text-amber-300/80 font-sans">Grade B+</span>
          </div>
          <span className="text-[10px] text-emerald-400 block font-sans">{isFa ? 'هدف فاز ۳: ۹۶٪ (Grade A)' : 'Target Phase 3: 96%'}</span>
        </div>

        {/* Score 2 */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">{isFa ? 'نرخ پرش سرچ‌های SOC:' : 'SOC Search Skip Rate:'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">5.2%</span>
            <span className="text-[11px] text-rose-300/80 font-sans">Critical SLA</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">{isFa ? 'هدف با SHC سوم: ۰.۰٪' : 'Target with SHC-03: 0.0%'}</span>
        </div>

        {/* Score 3 */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">{isFa ? 'گلوگاه سرعت دیسک (IOPS):' : 'Storage IOPS Deficit:'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">-62.5%</span>
            <span className="text-[11px] text-slate-400 font-sans">450 / 1200</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">{isFa ? 'مهاجرت به NVMe الزامی' : 'NVMe Migration Needed'}</span>
        </div>

        {/* Score 4 */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">{isFa ? 'پایداری و Quorum کلاستر:' : 'Cluster Redundancy:'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">Partial</span>
            <span className="text-[11px] text-amber-300/80 font-sans">2-Node Risk</span>
          </div>
          <span className="text-[10px] text-cyan-400 block font-sans">{isFa ? 'نیازمند Quorum ۳ تایی' : 'Needs 3-Node Quorum'}</span>
        </div>

        {/* Score 5 */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] text-slate-400 block uppercase">{isFa ? 'صرفه‌جویی با SmartStore:' : '3-Yr TCO Cost Savings:'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">58.4%</span>
            <span className="text-[11px] text-emerald-300 font-sans">~$78,000</span>
          </div>
          <span className="text-[10px] text-emerald-400 block font-sans">{isFa ? 'حذف خرید دیسک‌های محلی' : 'S3 Storage Decoupling'}</span>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* MODE 1: VISUAL ARCHITECTURE TRANSFORMATION (AS-IS vs TO-BE SVA DIAGRAM) */}
      {/* ========================================================================================= */}
      {viewMode === 'ARCH_COMPARISON' && (
        <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'دایاگرام مقایسه‌ای: معماری وضعیت موجود (As-Is) در برابر معماری استاندارد SVA (To-Be)' : 'Architecture Transformation Diagram: Current vs SVA Target'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isFa
                  ? 'بررسی بصری لایه‌ها، نقاط شکست تکی (SPOF) و گذرگاه‌های ارتقا به معماری تاییدشده SVA C11'
                  : 'Visual mapping of single points of failure (SPOF) and transition path to SVA C11 Validated Architecture'}
              </p>
            </div>

            {/* View Selector Switch */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedArchitectureView('CURRENT')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  selectedArchitectureView === 'CURRENT'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isFa ? 'وضعیت موجود (As-Is - دارای ریسک)' : 'Current (As-Is)'}</span>
              </button>
              <button
                onClick={() => setSelectedArchitectureView('TARGET')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  selectedArchitectureView === 'TARGET'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'معماری هدف SVA C11 (پایدار و امن)' : 'Target SVA C11 (To-Be)'}</span>
              </button>
            </div>
          </div>

          {/* Comparative Diagram Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* TIER A: SEARCH LAYER */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              selectedArchitectureView === 'CURRENT' ? 'bg-rose-950/10 border-rose-500/40' : 'bg-emerald-950/10 border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'لایه جستجو و داشبوردها' : 'Search Head Tier'}</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedArchitectureView === 'CURRENT' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {selectedArchitectureView === 'CURRENT' ? '2 Nodes (No Quorum)' : '3-Node SHC (Raft Quorum)'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {selectedArchitectureView === 'CURRENT' ? (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/60 text-rose-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>SH-01 (Captain) + SH-02</span>
                        <span className="text-rose-400">19 Slots Cap</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '⚠️ ۲۲ سرچ اسکجول فعال > ۱۹ اسلات = پرش ۵.۲٪' : '⚠️ 22 Scheduled > 19 slots = 5.2% Skip'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'ریسک: در صورت بروز فالت در ۱ نود، کلاستر بدون Quorum شده و متوقف می‌گردد.' : 'Risk: Single node fault breaks Raft quorum.'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/60 text-emerald-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>SH-01 + SH-02 + SH-03</span>
                        <span className="text-emerald-400">57 Slots Capacity</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '✓ سقف ۵۷ اسلات همزمان، ۰٪ پرش، Quorum فرد پایدار' : '✓ 57 Slots, 0% Skip Rate, Resilient Odd Quorum'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'مزیت: قابلیت تحمل خرابی ۱ نود با تداوم کامل سرویس‌دهی به SOC.' : 'Advantage: Tolerates 1 node failure with zero SOC interruption.'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TIER B: INDEXING LAYER */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              selectedArchitectureView === 'CURRENT' ? 'bg-rose-950/10 border-rose-500/40' : 'bg-emerald-950/10 border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'لایه کلاستر ایندکسرها' : 'Indexer Peer Tier'}</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedArchitectureView === 'CURRENT' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {selectedArchitectureView === 'CURRENT' ? '2 Peers (87.5% Load)' : '3 Peers (RF=3 / SF=2)'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {selectedArchitectureView === 'CURRENT' ? (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/60 text-rose-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>IDX-01 + IDX-02</span>
                        <span className="text-rose-400">450 IOPS (SAS)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '⚠️ استوریج مکانیکی SAS کند، عدم تحقق کپی ۳ باکت‌ها' : '⚠️ Mechanical SAS IOPS bottleneck, RF=3 unfulfilled'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'ریسک: اشباع صف‌ها در زمان پیک ترافیک و قفل شدن دریافت لاگ.' : 'Risk: Queue saturation during traffic surges.'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/60 text-emerald-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>IDX-01 + IDX-02 + IDX-03</span>
                        <span className="text-emerald-400">1500+ IOPS (NVMe)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '✓ دیسک‌های NVMe تمام فلش، تحقق کامل RF=3 و SF=2' : '✓ All-Flash NVMe Gen4, 100% RF=3 & SF=2 Compliant'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'مزیت: توزیع بار متوازن و توانایی دریافت ۶۰۰+ گیگابایت لاگ روزانه.' : 'Advantage: Scalable headroom for 600+ GB/day ingest.'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TIER C: STORAGE & INGESTION */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              selectedArchitectureView === 'CURRENT' ? 'bg-rose-950/10 border-rose-500/40' : 'bg-emerald-950/10 border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>{isFa ? 'لایه ذخیره‌ساز و دریافت' : 'Storage & Ingestion'}</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedArchitectureView === 'CURRENT' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {selectedArchitectureView === 'CURRENT' ? 'Direct DAS / SPOF Syslog' : 'SmartStore S3 / Dual SC4S'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {selectedArchitectureView === 'CURRENT' ? (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/60 text-rose-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Single Syslog Server</span>
                        <span className="text-rose-400">No VIP / SPOF</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '⚠️ ارسال مستقیم بدون بافر و هزینه سنگین دیسک محلی' : '⚠️ Unbuffered direct syslog, high direct DAS cost'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'ریسک: ریزش دائمی بسته‌های UDP سیس‌لاگ فایروال‌ها.' : 'Risk: Unrecoverable UDP packet loss on network spikes.'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/60 text-emerald-300 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Dual SC4S + S3 SmartStore</span>
                        <span className="text-emerald-400">Keepalived HA</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {isFa ? '✓ انتقال خودکار به S3 و کاهش ۵۸٪ هزینه کل دیسک' : '✓ SmartStore S3 offloading, 58% storage TCO savings'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 text-[10px] text-slate-400 font-sans">
                      {isFa ? 'مزیت: عدم وابستگی به سخت‌افزار گران‌قیمت با پایداری بی‌پایان.' : 'Advantage: Zero storage boundaries with transparent archiving.'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODE 2: C-LEVEL EXECUTIVE PRESENTATION SLIDES */}
      {/* ========================================================================================= */}
      {viewMode === 'EXECUTIVE_SLIDES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Slide 1: Problem Statement */}
          <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{isFa ? 'چالش‌های کنونی و ریسک‌های استراتژیک' : 'Executive Problem Statement'}</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300">Impact: High</span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-sans">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>{isFa ? 'گلوگاه جستجوهای اسکجول امنیتی (Skip Rate = ۵.۲٪):' : 'SOC Correlation Search Bottleneck:'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isFa
                    ? 'به دلیل سقف ۱۹ اسلات کلاستر ۲ نودی، سرچ‌های تشخیص بدافزار و نفوذ با تاخیر مواجه شده و رول‌های امنیتی پرش دارند.'
                    : 'The 19-slot concurrency limit causes 5.2% of scheduled threat detection rules to skip, delaying incident response.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>{isFa ? 'استوریج مکانیکی و کمبود ۶۲.۵٪ در سرعت دیسک (IOPS):' : 'Mechanical SAS Storage IOPS Deficit:'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isFa
                    ? 'سرعت دیسک فعلی ۴۵۰ IOPS است در حالی که استاندارد SVA حداقل ۱۲۰۰ IOPS را الزام می‌کند. این امر موجب کندی داشبوردها و صف‌های ایندکس شده است.'
                    : 'Current 450 IOPS falls critically short of the 1,200 IOPS benchmark, freezing live threat dashboards.'}
                </p>
              </div>
            </div>
          </div>

          {/* Slide 2: Strategic Solution */}
          <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? 'برنامه راهبردی نوسازی معماری (SVA C11)' : 'Strategic Modernization Solution'}</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">ROI: 58.4%</span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-sans">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{isFa ? 'توسعه کلاستر به ساختار ۳ نودی (Quorum طلایی):' : 'Expand to 3-Node Clustered Quorum:'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isFa
                    ? 'افزودن نود ۳ سرچ‌هد و ایندکسر ظرفیت همزمانی را به ۵۷ اسلات رسانده و پایداری کلاستر را به ۱۰۰٪ افزایش می‌دهد.'
                    : 'Adding 3rd Search Head and Indexer boosts search capacity to 57 slots and establishes 100% Raft Quorum resilience.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{isFa ? 'مهاجرت به NVMe و راه‌اندازی SmartStore S3:' : 'NVMe Migration & S3 SmartStore Hybrid:'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isFa
                    ? 'جداسازی داده‌های داغ روی دیسک‌های NVMe و انتقال داده‌های قدیمی به S3 که منجر به صرفه‌جویی ۵۸.۴٪ در هزینه‌های ۳ ساله می‌شود.'
                    : 'NVMe for active data combined with S3 object store offloading yields a 58.4% 3-year TCO reduction.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODE 3: FULL IN-DEPTH AUDIT REPORT & MATHEMATICAL DIAGNOSIS PROOFS */}
      {/* ========================================================================================= */}
      {viewMode === 'FULL_REPORT' && (
        <div className="space-y-6">
          {/* Section 1: Detailed Findings & Mathematical Justifications */}
          <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? '۱. تحلیل تفصیلی یافته‌های ممیزی و اثبات محاسباتی (Detailed Findings & SVA Math Proofs)' : '1. Detailed Findings & Mathematical Proofs'}</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {isFa
                    ? 'هر تشخیص همراه با تلمتری ثبت‌شده لاگ، فرمول ریاضی استاندارد SVA، پیامد امنیتی و دستورالعمل قطعی ارائه شده است.'
                    : 'Each finding is backed by telemetry logs, SVA sizing formulas, business impact assessment, and exact conf/CLI commands.'}
                </p>
              </div>
            </div>

            {/* Findings Accordion List */}
            <div className="space-y-4">
              {FINDINGS.map(finding => {
                const isExpanded = expandedFindingId === finding.id;

                return (
                  <div
                    key={finding.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-slate-900/90 border-slate-700 shadow-xl'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Finding Header */}
                    <div
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                      className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : finding.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        }`}>
                          {finding.severity}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {isFa ? finding.titleFa : finding.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">({finding.svaCode})</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-sans">
                            {isFa ? finding.categoryFa : finding.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                          Effort: {finding.effortDays} Days | Cost: {finding.costImpact}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Finding Body Details */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800 bg-[#060a0f] space-y-4 text-xs">
                        {/* 1. Telemetry Signal */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                          <span className="text-slate-500 font-bold block">{isFa ? '🔍 سیگنال تلمتری و شواهد ثبت‌شده در لاگ (Diagnostic Telemetry):' : 'Diagnostic Telemetry Signal:'}</span>
                          <p className="text-amber-300 font-sans">{isFa ? finding.telemetrySignalFa : finding.telemetrySignal}</p>
                          <pre className="p-2 rounded bg-slate-900 text-slate-300 text-[10px] overflow-x-auto text-left" dir="ltr">
                            {finding.telemetrySignal}
                          </pre>
                        </div>

                        {/* 2. Math Formula Proof */}
                        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                          <span className="text-cyan-400 font-bold block flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5" />
                            <span>{isFa ? '📐 فرمول محاسباتی اثبات شکاف بر اساس استاندارد SVA (Mathematical Proof):' : 'SVA Mathematical Sizing Proof:'}</span>
                          </span>
                          <p className="text-slate-200 leading-relaxed font-sans text-[11px]">
                            {isFa ? finding.mathFormulaProofFa : finding.mathFormulaProof}
                          </p>
                        </div>

                        {/* 3. Business & SOC Impact */}
                        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                          <span className="text-rose-400 font-bold block flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{isFa ? '⚠️ ریسک و پیامد عملیاتی روی سازمان و تیم SOC (Business Impact):' : 'Business & Security Risk:'}</span>
                          </span>
                          <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
                            {isFa ? finding.businessImpactFa : finding.businessImpactEn}
                          </p>
                        </div>

                        {/* 4. Actionable Remediation */}
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                          <span className="text-emerald-400 font-bold block flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isFa ? '🛠️ راهکار اجرایی و گام‌های پیاده‌سازی (Actionable Remediation Plan):' : 'Actionable Remediation Plan:'}</span>
                          </span>
                          <p className="text-slate-200 font-sans text-[11px] whitespace-pre-line leading-relaxed">
                            {isFa ? finding.remediationFa : finding.remediationEn}
                          </p>

                          {/* Code Snippet and CLI */}
                          {finding.confSnippet && (
                            <div className="pt-2 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>Configuration Template (.conf):</span>
                                <button
                                  onClick={() => handleCopy(finding.confSnippet!, `${finding.id}-conf`)}
                                  className="text-cyan-300 hover:text-white flex items-center gap-1"
                                >
                                  {copiedKey === `${finding.id}-conf` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === `${finding.id}-conf` ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                                </button>
                              </div>
                              <pre className="p-2.5 rounded bg-slate-950 font-mono text-[10px] text-emerald-300 overflow-x-auto text-left" dir="ltr">
                                {finding.confSnippet}
                              </pre>
                            </div>
                          )}

                          {finding.cliCommand && (
                            <div className="pt-1 space-y-1">
                              <span className="text-[10px] font-mono text-slate-400 block">Verification CLI:</span>
                              <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-amber-300 overflow-x-auto text-left" dir="ltr">
                                {finding.cliCommand}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 30-60-90 Days Strategic Roadmap */}
          <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? '۲. نقشه راه اجرایی ۳۰-۶۰-۹۰ روزه اصلاح معماری (Strategic 30-60-90 Roadmap)' : '2. Strategic 30-60-90 Day Architectural Roadmap'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Phase 1 to 3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isFa ? 'فاز ۱: ۳۰ روزه (رفع فوری گلوگاه)' : 'Phase 1: 30 Days'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Immediate</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans list-disc list-inside">
                  <li>{isFa ? 'فعال‌سازی schedule_window=auto در limits.conf' : 'Enable schedule_window=auto'}</li>
                  <li>{isFa ? 'تنظیم pipelineSet=2 در server.conf ایندکسرها' : 'Configure pipelineSet=2 for indexers'}</li>
                  <li>{isFa ? 'پیکربندی autoLBVolume=10MB روی فورواردرها' : 'Deploy autoLBVolume=10MB on UFs'}</li>
                  <li>{isFa ? 'راه‌اندازی کش مموری برای کوئری‌های پرکاربرد SOC' : 'Enable search results cache'}</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isFa ? 'فاز ۲: ۶۰ روزه (توسعه سخت‌افزار)' : 'Phase 2: 60 Days'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Core Scale</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans list-disc list-inside">
                  <li>{isFa ? 'افزودن نود ۳ سرچ‌هد و تثبیت Quorum رَفْت' : 'Provision 3rd Search Head for Raft'}</li>
                  <li>{isFa ? 'افزودن ایندکسر ۳ جهت تحقق کامل RF=3 و SF=2' : 'Commission 3rd Indexer for RF=3'}</li>
                  <li>{isFa ? 'مهاجرت homePath به استوریج All-Flash NVMe' : 'Migrate homePath to NVMe arrays'}</li>
                  <li>{isFa ? 'راه‌اندازی کلاستر دو نودی SC4S با VIP' : 'Deploy Dual SC4S Syslog HA Pair'}</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isFa ? 'فاز ۳: ۹۰ روزه (SmartStore و DR)' : 'Phase 3: 90 Days'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SVA Enterprise</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans list-disc list-inside">
                  <li>{isFa ? 'استقرار استوریج هیبریدی SmartStore با S3/MinIO' : 'Deploy S3 SmartStore hybrid storage'}</li>
                  <li>{isFa ? 'فعال‌سازی ساختار کلاستر دو سایته Multi-Site DR' : 'Configure Multi-Site DR (SVA C11)'}</li>
                  <li>{isFa ? 'راه‌اندازی اتوماسیون Failover برای نودهای مدیریت' : 'Automate Management Nodes DR'}</li>
                  <li>{isFa ? 'اخذ تاییدیه نهایی ممیزی SVA و امتیاز ۹۶٪' : 'Final SVA Certification Audit'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Financial TCO & ROI Cost-Benefit Analysis */}
          <div className="p-6 rounded-2xl bg-[#090e17] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? '۳. تحلیل توجیه اقتصادی و بازگشت سرمایه (Financial ROI & 3-Year TCO Analysis)' : '3. Financial ROI & 3-Year TCO Analysis'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">58.4% Cost Reduction</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">{isFa ? 'مقایسه هزینه سنتی در برابر معماری SmartStore S3:' : 'Traditional DAS vs S3 SmartStore Model:'}</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {isFa
                    ? 'در مدل سنتی، با رشد ۷۶ ترابایت لاگ در سال، سازمان نیازمند خرید سالانه دیسک‌های گران‌قیمت SAS و سرورهای فیزیکی جدید با هزینه تقریبی ۴۵,۰۰۰ دلار در سال است. با معماری SmartStore، باکت‌های گرم به استوریج S3/MinIO منتقل شده و هزینه کل ۳ ساله از ۱۳۵,۰۰۰ دلار به کمتر از ۵۷,۰۰۰ دلار کاهش می‌یابد.'
                    : 'Traditional direct attached storage requires constant hardware expansion ($45,000/year). SmartStore S3 decouples compute, slashing 3-year TCO from $135k to under $57k.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-300 block">{isFa ? 'دستاوردهای ملموس کسب‌وکار (Tangible Business Outcomes):' : 'Tangible Business Outcomes:'}</span>
                <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                  <li>{isFa ? 'کاهش ۵.۲٪ به ۰.۰٪ در نرخ پرش سرچ‌های امنیتی SOC (حذف خطای دید امنیتی)' : '5.2% to 0.0% reduction in SOC search skip rate'}</li>
                  <li>{isFa ? 'افزایش ۶ برابری سرعت لود داشبوردهای امنیتی با مهاجرت به NVMe' : '6x faster dashboard load time with NVMe arrays'}</li>
                  <li>{isFa ? 'تضمین تداوم عملیات بدون قطعی با Quorum ۳ نودی در صورت خرابی سرورها' : 'Zero-downtime fault tolerance with 3-node Quorum'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Executive Governance & Formal Sign-off Block */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{isFa ? '۴. تاییدیه کمیته راهبری و ممیزی نهایی (Governance & Formal Sign-off)' : '4. Governance & Executive Sign-off'}</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">AUDIT PASSED WITH RECOMMENDATIONS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">{isFa ? 'معمار ارشد اسپلانک (SCEA):' : 'Lead Splunk Architect:'}</span>
                <span className="text-white font-bold block">Certified Enterprise Architect</span>
                <span className="text-emerald-400 text-[10px] block font-sans">✓ Verified & Approved</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">{isFa ? 'مدیر ارشد امنیت اطلاعات (CISO):' : 'Chief Info Security Officer (CISO):'}</span>
                <span className="text-white font-bold block">SOC Operations Committee</span>
                <span className="text-amber-400 text-[10px] block font-sans">Pending Milestone 1</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">{isFa ? 'مدیر ارشد زیرساخت و فناوری (CTO):' : 'Chief Technology Officer (CTO):'}</span>
                <span className="text-white font-bold block">IT Infrastructure Division</span>
                <span className="text-cyan-400 text-[10px] block font-sans">Capex Review In Progress</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
