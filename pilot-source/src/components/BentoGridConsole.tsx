import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  Box, 
  Zap, 
  Building2, 
  Radio, 
  FileText,
  AlertTriangle,
  RotateCw,
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Lock,
  Wrench,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Shield,
  Layers,
  Globe,
  Award,
  Bell,
  Package,
  Archive,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Wifi,
  BookOpen
} from 'lucide-react';

interface BentoGridConsoleProps {
  lang: 'fa' | 'en';
  onNavigateTab: (tabId: string) => void;
  onOpenSettings: () => void;
  onOpenServiceModal: () => void;
  onOpenModuleManager?: () => void;
  onInspectLogLine?: (line: string) => void;
  probeCluster: () => void;
  isProbingCluster: boolean;
  clusterProbeResults: Array<{ port: number; name: string; open: boolean; latency: number }>;
}

export const BentoGridConsole: React.FC<BentoGridConsoleProps> = ({
  lang,
  onNavigateTab,
  onOpenSettings,
  onOpenServiceModal,
  onOpenModuleManager,
  onInspectLogLine,
  probeCluster,
  isProbingCluster,
  clusterProbeResults
}) => {
  const isFa = lang === 'fa';
  const [pulseCount, setPulseCount] = useState(16480);
  const [radarAngle, setRadarAngle] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(0);

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Jitter EPS slightly to simulate live ingestion
  useEffect(() => {
    const epsInterval = setInterval(() => {
      setPulseCount(16400 + Math.floor(Math.random() * 180));
    }, 2000);
    return () => clearInterval(epsInterval);
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const corePorts = [
    { port: 9997, name: 'S2S Ingestion', protocol: 'TCP/TLS', descFa: 'ورودی لاگ فورواردرها', descEn: 'Forwarder Ingestion' },
    { port: 8089, name: 'Management Port', protocol: 'mTLS HTTPS', descFa: 'ارتباط کلاستر مستر و دپلوی‌یر', descEn: 'Cluster Master / Deployer API' },
    { port: 8000, name: 'Splunk Web UI', protocol: 'HTTPS', descFa: 'کنسول وب و سرچ‌هد', descEn: 'Web & Search Head Console' },
    { port: 8088, name: 'HTTP Event Collector (HEC)', protocol: 'REST HTTPS', descFa: 'دریافت ایونت‌های ابری و وب‌هوک', descEn: 'Cloud & Token Webhook Ingestion' },
    { port: 514, name: 'Syslog SC4S UDP/TCP', protocol: 'Syslog', descFa: 'لاگ‌های تجهیزات شبکه و فایروال', descEn: 'Network Devices & SC4S' }
  ];

  return (
    <div className="space-y-6 select-none" dir={isFa ? 'rtl' : 'ltr'}>
      {/* ========================================================================= */}
      {/* 1. APPLE EXECUTIVE HERO HEADER & LIVE STATUS BAR                          */}
      {/* ========================================================================= */}
      <div className="apple-card p-6 relative overflow-hidden">
        {/* Subtle Apple Ambient Highlight */}
        <div className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-[#0a84ff]/8 blur-[90px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse"></span>
              <span className="font-semibold text-[#30d158] uppercase tracking-wider text-[11px]">
                {isFa ? 'سامانه پایدار و متصل به کلاستر' : 'Cluster Live & Operational'}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-white/40 font-mono text-[11px]">Splunk Enterprise 9.2.1 SVA C11</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isFa ? 'داشبورد مدیریتی و ارکستراسیون معماری کلاستر اسپلانک' : 'Splunk Enterprise Architecture & Operations Cockpit'}
            </h1>

            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              {isFa
                ? 'پایش بلادرنگ هارت‌بیت فورواردرها، اعتبارسنجی سوکت‌های لیسنر، ممیزی استانداردهای SVA، استقرار خودکار نودها و مدیریت لایسنس تجاری.'
                : 'Centralized telemetry, real-time ingestion radar, TCP port validation, official SVA C11 compliance, and cluster provisioning.'}
            </p>
          </div>

          {/* Quick Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenModuleManager && (
              <button
                onClick={onOpenModuleManager}
                className="apple-btn-primary py-2 px-4 text-xs font-semibold shadow-md flex items-center gap-2"
                title={isFa ? 'مدیریت، جابه‌جایی، افزودن و حذف ماژول‌های سامانه' : 'Customize Studio & Manage Modules'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isFa ? 'مدیریت و سفارشی‌سازی کل برنامه' : 'Customize Studio'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('cluster_deployer')}
              className="apple-btn-secondary py-2 px-3.5 text-xs font-medium flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>{isFa ? 'استقرار خودکار کلاستر' : 'Cluster Deployer'}</span>
            </button>

            <button
              onClick={probeCluster}
              disabled={isProbingCluster}
              className="apple-btn-secondary py-2 px-3 text-xs font-medium flex items-center gap-1.5"
              title={isFa ? 'پروب سوکت‌های فعال' : 'Probe sockets'}
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#30d158] ${isProbingCluster ? 'animate-spin' : ''}`} />
              <span>{isProbingCluster ? (isFa ? 'در حال تست...' : 'Probing...') : (isFa ? 'تست پورت‌ها' : 'Probe')}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/[0.06] text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">{isFa ? 'امتیاز سلامت SVA' : 'SVA Health Score'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#30d158] font-mono tabular-nums">88 / 100</span>
              <span className="text-[10px] text-white/40 font-mono">C11 Level-3</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">{isFa ? 'نرخ ورود لاگ لحظه‌ای' : 'Live Ingestion (EPS)'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#0a84ff] font-mono tabular-nums">{pulseCount.toLocaleString()}</span>
              <span className="text-[10px] text-white/40 font-mono">1.64 TB / Day</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">{isFa ? 'نودهای فعال سرور' : 'Active Cluster Nodes'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white font-mono tabular-nums">10 Hosts</span>
              <span className="text-[10px] text-[#30d158] font-mono">100% Online</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">{isFa ? 'کانال‌های TLS و سوکت‌ها' : 'Core TCP Sockets'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#ff9f0a] font-mono tabular-nums">5 / 5 Open</span>
              <span className="text-[10px] text-white/40 font-mono">1.2ms Avg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BENTO GRID ARCHITECTURE (Modular Apple Cards)                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Widget A: Live Heartbeat & Forwarder Radar (7 cols) */}
        <div className="lg:col-span-7 apple-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {isFa ? 'رادار پایش ضربان قلب (Heartbeat Radar) و آشکارساز قطعی' : 'Live Heartbeat Radar & Outage Detector'}
                </h3>
                <span className="text-[10px] text-white/40">
                  {isFa ? 'پایش ۳۰ ثانیه‌ای لاگ فورواردرها و هاست‌های سازمانی' : 'Real-time forwarder pulse sweep & silent drop detection'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('heartbeat_radar')}
              className="text-xs text-[#0a84ff] hover:text-[#0071e3] font-medium flex items-center gap-1 transition"
            >
              <span>{isFa ? 'مشاهده رادار کامل' : 'Open Radar'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Radar Visualization + Node List */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Radar Circular Sweep */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-3 relative">
              <div className="relative w-36 h-36 rounded-full border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shadow-inner">
                {/* Concentric distance rings */}
                <div className="absolute w-28 h-28 rounded-full border border-white/5"></div>
                <div className="absolute w-18 h-18 rounded-full border border-white/5"></div>
                <div className="absolute w-8 h-8 rounded-full border border-white/10"></div>
                <div className="absolute w-full h-[1px] bg-white/5"></div>
                <div className="absolute h-full w-[1px] bg-white/5"></div>

                {/* Rotating Sweep Beam */}
                <div 
                  className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left pointer-events-none"
                  style={{
                    transform: `rotate(${radarAngle}deg)`,
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(48, 209, 88, 0.4) 60deg, transparent 65deg)'
                  }}
                />

                {/* Pinged Nodes */}
                <span className="w-2 h-2 rounded-full bg-[#30d158] absolute top-6 left-8 shadow-[0_0_8px_#30d158] animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#30d158] absolute bottom-8 right-8 shadow-[0_0_8px_#30d158]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] absolute top-14 right-10" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] absolute bottom-12 left-10" />

                <div className="z-10 text-[9px] font-mono text-white/50 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                  30s SWEEP
                </div>
              </div>

              <div className="text-[10px] font-mono text-white/40 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]"></span>
                <span>{isFa ? '۱۲ فورواردر سالم · ۰ قطعی' : '12 Active · 0 Drops'}</span>
              </div>
            </div>

            {/* Quick Node Table */}
            <div className="md:col-span-7 space-y-1.5 text-xs">
              {[
                { name: 'hf01.corp.net', role: 'Heavy Forwarder', eps: '6,420 EPS', latency: '0.8ms', status: 'Healthy' },
                { name: 'idx01.cluster.splunk', role: 'Indexer Site 1', eps: '5,120 EPS', latency: '1.1ms', status: 'Healthy' },
                { name: 'idx02.cluster.splunk', role: 'Indexer Site 1', eps: '4,940 EPS', latency: '1.2ms', status: 'Healthy' },
              ].map((n, i) => (
                <div key={i} className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between transition">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]"></span>
                    <div>
                      <span className="font-mono font-medium text-white/90 text-xs block">{n.name}</span>
                      <span className="text-[10px] text-white/40">{n.role}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-[#0a84ff] block tabular-nums">{n.eps}</span>
                    <span className="text-white/30 text-[10px] tabular-nums">{n.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
            <span>{isFa ? 'کانال ارتباطی mTLS امن فعال است' : 'End-to-end mTLS encryption verified'}</span>
            <span className="font-mono text-[#30d158]">{isFa ? 'وضعیت پایدار' : 'Pipeline: 100% OK'}</span>
          </div>
        </div>

        {/* Widget B: SVA Architecture Auditor & Benchmark (5 cols) */}
        <div className="lg:col-span-5 apple-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {isFa ? 'ممیزی معماری SVA C11 و ظرفیت سخت‌افزار' : 'SVA C11 Architecture Auditor'}
                </h3>
                <span className="text-[10px] text-white/40">
                  {isFa ? 'تطبیق با استانداردهای رسمی Splunk Validated Architectures' : 'Official Splunk Validated Architecture benchmarks'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('architecture_auditor')}
              className="text-xs text-[#0a84ff] hover:text-[#0071e3] font-medium flex items-center gap-1 transition"
            >
              <span>{isFa ? 'ممیزی' : 'Audit'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">{isFa ? 'انطباق با رفرنس معماری C11:' : 'SVA C11 Compliance:'}</span>
                <span className="font-mono font-bold text-[#30d158]">88% (Level-3)</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#30d158] h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-white/40 block">{isFa ? 'تعداد ایندکسر فعلی' : 'Current Indexers'}</span>
                <span className="text-sm font-bold font-mono text-white mt-0.5 block">4 Nodes</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-white/40 block">{isFa ? 'ایندکسر پیشنهادی To-Be' : 'Target Indexers'}</span>
                <span className="text-sm font-bold font-mono text-[#0a84ff] mt-0.5 block">6 Nodes</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-white/40 block">{isFa ? 'بنچمارک IOPS دیسک' : 'Disk IOPS'}</span>
                <span className="text-sm font-bold font-mono text-white mt-0.5 block">1,240 / 1,200</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-white/40 block">{isFa ? 'ضریب رپلیکیشن (RF)' : 'Replication (RF)'}</span>
                <span className="text-sm font-bold font-mono text-[#30d158] mt-0.5 block">RF: 3 · SF: 2</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('architecture_auditor')}
            className="w-full apple-btn-secondary text-xs py-2"
          >
            <span>{isFa ? 'مشاهده و دانلود گزارش تحلیلی SVA' : 'Generate Full SVA Audit Report'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Widget C: Core TCP Sockets & Ports Matrix (6 cols) */}
        <div className="lg:col-span-6 apple-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/20">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {isFa ? 'ماتریس سوکت‌های شبکه و پورت‌های اسپلانک' : 'Splunk Core TCP Sockets & Port Matrix'}
                </h3>
                <span className="text-[10px] text-white/40">
                  {isFa ? 'پایش زنده وضعیت پورت‌های ۹۹۹۷، ۸۰۸۹، ۸۰۰۰، ۸۰۸۸ و ۵۱۴' : 'Active listener socket probe & latency inspection'}
                </span>
              </div>
            </div>

            <button
              onClick={probeCluster}
              disabled={isProbingCluster}
              className="p-1.5 rounded-md hover:bg-white/[0.08] text-[#0a84ff] transition cursor-pointer"
              title={isFa ? 'پروب سوکت‌ها' : 'Probe sockets'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isProbingCluster ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {corePorts.map((p) => {
              const probeRes = clusterProbeResults.find(r => r.port === p.port);
              const isOpen = probeRes ? probeRes.open : true;
              const latency = probeRes ? `${probeRes.latency}ms` : '1.2ms';
              return (
                <div key={p.port} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? 'bg-[#30d158]' : 'bg-[#ff453a]'}`} />
                    <span className="font-mono font-bold text-white text-xs">{p.port}</span>
                    <span className="text-white/40 text-[11px] truncate">{isFa ? p.descFa : p.descEn}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="text-white/50">{p.protocol}</span>
                    <span className="text-[#30d158] tabular-nums">{latency}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
            <span>{isFa ? 'همه سوکت‌ها در لینوکس فعال و بدون تداخل هستند' : 'All kernel TCP listening sockets operational'}</span>
            <button
              onClick={() => onNavigateTab('topology')}
              className="text-[#0a84ff] hover:underline"
            >
              {isFa ? 'مشاهده دایاگرام پورت‌ها →' : 'View Port Diagram →'}
            </button>
          </div>
        </div>

        {/* Widget D: splunkd.log Live Tails & Auto-Remediation (6 cols) */}
        <div className="lg:col-span-6 apple-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {isFa ? 'پایش زنده لاگ سرور (splunkd.log Live Tail)' : 'splunkd.log Live Stream Tail'}
                </h3>
                <span className="text-[10px] text-white/40">
                  {isFa ? 'تحلیل ریل‌تایم با قابلیت کلیک روی لاگ جهت رفع خودکار مشکل' : 'Interactive real-time stream with 1-click remediation'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('live_logs')}
              className="text-xs text-[#0a84ff] hover:text-[#0071e3] font-medium flex items-center gap-1 transition"
            >
              <span>{isFa ? 'مشاهده لاگ‌ها' : 'Full Stream'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Console Output */}
          <div className="bg-black/50 rounded-xl p-3 font-mono text-[11px] space-y-1.5 border border-white/[0.06] max-h-48 overflow-y-auto scrollbar-thin">
            {[
              { text: '[07:12:01] INFO  TcpInputProc - Listening on TCP port 9997 for S2S streams (TLS 1.3 OK)', meta: '192.168.10.22:9997', color: 'text-white/70 hover:bg-white/[0.05]' },
              { text: '[07:12:05] INFO  CMMetaDataMaster - Bucket hot_v1 replicated across cluster peers (RF:3, SF:2)', meta: 'RF:3, SF:2 OK', color: 'text-[#30d158] hover:bg-[#30d158]/10' },
              { text: '[07:11:58] WARN  SHCClusterMgr - Search concurrency 82% threshold (max_searches_per_cpu=1)', meta: 'Concurrency 82%', color: 'text-[#ff9f0a] hover:bg-[#ff9f0a]/10' },
              { text: '[07:11:45] WARN  LicenseMgrPool - Daily indexing volume reaching 85% of allocated license pool', meta: 'Quota: 85%', color: 'text-[#ff9f0a] hover:bg-[#ff9f0a]/10' }
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  if (onInspectLogLine) {
                    onInspectLogLine(item.text);
                  } else {
                    onNavigateTab('live_logs');
                  }
                }}
                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${item.color} group`}
                title={isFa ? 'کلیک جهت تحلیل عمیق و راهکار مهندسی' : 'Click to inspect log diagnostic'}
              >
                <span className="truncate pr-2">{item.text}</span>
                <span className="text-white/40 text-[10px] shrink-0 font-sans group-hover:text-white transition">{item.meta}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
            <span>{isFa ? 'کلیک روی هر لاگ = تفسیر عمیق و رفع فوری' : 'Click any log line in stream for instant fix'}</span>
            <button
              onClick={() => onNavigateTab('live_logs')}
              className="text-[#0a84ff] hover:underline"
            >
              {isFa ? 'استریم کامل لاگ‌ها →' : 'Tail Live Logs →'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. APPLICATION WORKSPACE CUSTOMIZATION BANNER                              */}
      {/* ========================================================================= */}
      {onOpenModuleManager && (
        <div className="apple-card p-4.5 bg-gradient-to-r from-[#0071e3]/10 via-[#18191f] to-[#30d158]/10 border border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0071e3] text-white shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isFa ? 'پنل شخصی‌سازی کامل برنامه و مدیریت ماژول‌ها' : 'Studio Customization & Module Management'}
              </h4>
              <p className="text-xs text-white/50 mt-0.5">
                {isFa 
                  ? 'شما می‌توانید هر ماژولی را به دلخواه جابه‌جا کنید، حذف یا پنهان نمایید، ماژول سفارشی جدید بیفزایید و صفحه اول را تغییر دهید.' 
                  : 'Reorder screens, hide/show tools, add custom modules, and customize your default landing view.'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenModuleManager}
            className="apple-btn-primary px-4 py-2 text-xs font-semibold shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isFa ? 'شخصی‌سازی چیدمان و ماژول‌ها' : 'Open Module Manager'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BentoGridConsole;
