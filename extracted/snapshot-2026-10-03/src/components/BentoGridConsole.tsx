import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  HardDrive,
  Info,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';

interface ClusterTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  role?: string;
}

interface BentoLiveData {
  success: boolean;
  checkedAt: string;
  latencyMs: number;
  host: {
    hostname: string;
    primaryIp: string;
    interfaces: Array<{ iface: string; ip: string; mac?: string; internal?: boolean }>;
  };
  controller: { node: string };
  health: {
    score: number;
    signals: boolean[];
    report: Array<{ id: string; labelFa: string; status: 'pass' | 'warn'; detailFa: string }>;
  };
  architecture: {
    score: number;
    checks: Array<{ id: string; labelFa: string; status: 'pass' | 'warn'; detailFa: string }>;
  };
  ingestion: {
    eps: number | null;
    source: string;
  };
  nodes: Array<ClusterTarget & {
    open: boolean;
    latencyMs: number;
    error: string | null;
    heartbeat: 'healthy' | 'offline';
    checkedAt: string;
  }>;
  sockets: Array<{
    port: number;
    name: string;
    protocol: string;
    open: boolean;
    address: string | null;
    detectedProtocol: string | null;
  }>;
  splunk: {
    installed: boolean;
    home: string;
    version: string;
    versionOk: boolean;
    logPath: string | null;
  };
  system: {
    uptimeSeconds: number;
    loadAverage: number[];
    cpuCores: number;
    memoryTotalBytes: number;
    memoryFreeBytes: number;
    diskUsagePercent: number;
    kernel: string;
  };
}

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
  clusterTargets?: ClusterTarget[];
}

type Report =
  | { kind: 'health'; title: string; data: BentoLiveData['health']['report'] }
  | { kind: 'architecture'; title: string; data: BentoLiveData['architecture']['checks'] }
  | { kind: 'node'; title: string; node: BentoLiveData['nodes'][number] }
  | { kind: 'socket'; title: string; socket: BentoLiveData['sockets'][number] };

const nf = new Intl.NumberFormat('fa-IR');

const fmtBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '—';
  const gb = bytes / (1024 ** 3);
  return \`\${gb.toFixed(1)} GB\`;
};

const fmtUptime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? \`\${d}d \${h}h \${m}m\` : \`\${h}h \${m}m\`;
};

export const BentoGridConsole: React.FC<BentoGridConsoleProps> = ({
  lang,
  onNavigateTab,
  onOpenSettings,
  onOpenServiceModal,
  onOpenModuleManager,
  onInspectLogLine,
  probeCluster,
  isProbingCluster,
  clusterProbeResults,
  clusterTargets = [],
}) => {
  const isFa = lang === 'fa';
  const [live, setLive] = useState<BentoLiveData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets = useMemo(() => {
    return clusterTargets.filter(t => t.host).slice(0, 32);
  }, [clusterTargets]);

  const loadLive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bento/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ targets }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || \`HTTP \${res.status}\`);
      }
      setLive(data);
    } catch (e: any) {
      setError(e?.message || (isFa ? 'دریافت داده واقعی بنتو ناموفق بود.' : 'Failed to load real Bento telemetry.'));
    } finally {
      setLoading(false);
    }
  }, [isFa, targets]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/splunk/logs', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json();
      const raw = String(data.logs || '');
      setLogs(raw.split(/\\n/).filter(Boolean).slice(-6));
    } catch (_) {}
  }, []);

  useEffect(() => {
    void loadLive();
    void loadLogs();
    const timer = window.setInterval(() => {
      void loadLive();
      void loadLogs();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadLive, loadLogs]);

  const openCount = live?.nodes.filter(n => n.open).length ?? 0;
  const totalNodes = live?.nodes.length ?? targets.length;
  const socketOpenCount = live?.sockets.filter(s => s.open).length ?? 0;
  const socketTotal = live?.sockets.length ?? 0;
  const eps = live?.ingestion.eps;

  const socketResultMap = useMemo(
    () => new Map((clusterProbeResults || []).map(r => [r.port, r])),
    [clusterProbeResults]
  );

  return (
    <div className="space-y-6 select-none" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="apple-card p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs">
              <span className={\`w-2 h-2 rounded-full \${live ? 'bg-[#30d158] animate-pulse' : 'bg-[#ff9f0a]'}\`} />
              <span className="font-semibold text-white/70 uppercase tracking-wider text-[11px]">
                {live ? (isFa ? 'داده زنده سرور' : 'Live Server Telemetry') : (isFa ? 'در حال دریافت داده' : 'Loading live telemetry')}
              </span>
              {live?.checkedAt && <span className="text-white/30 font-mono text-[10px]">{new Date(live.checkedAt).toLocaleTimeString()}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isFa ? 'داشبورد مدیریتی و ارکستراسیون معماری کلاستر اسپلانک' : 'Splunk Enterprise Architecture & Operations Cockpit'}
            </h1>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              {isFa
                ? 'تمام شاخص‌ها از وضعیت واقعی همین سرور، فایل‌های Splunk، سوکت‌های kernel و نودهای تنظیم‌شده خوانده می‌شوند؛ عدد ساختگی یا latency تصادفی نمایش داده نمی‌شود.'
                : 'All metrics are read from this server, real Splunk files, kernel sockets, and configured cluster nodes. No synthetic values or random latency are shown.'}
            </p>
            {error && (
              <div className="rounded-xl border border-[#ff453a]/25 bg-[#ff453a]/10 p-3 text-xs text-[#ff8b82]">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button onClick={() => { void loadLive(); void loadLogs(); }} disabled={loading}
              className="apple-btn-secondary py-2 px-3 text-xs font-medium flex items-center gap-1.5">
              <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin' : ''}\`} />
              {isFa ? 'به‌روزرسانی واقعی' : 'Refresh Live'}
            </button>
            <button onClick={probeCluster} disabled={isProbingCluster}
              className="apple-btn-secondary py-2 px-3 text-xs font-medium flex items-center gap-1.5">
              <Wifi className={\`w-3.5 h-3.5 \${isProbingCluster ? 'animate-pulse' : ''}\`} />
              {isProbingCluster ? (isFa ? 'در حال تست...' : 'Probing...') : (isFa ? 'پروب نودها' : 'Probe Nodes')}
            </button>
            <button onClick={() => onNavigateTab('architecture_auditor')}
              className="apple-btn-secondary py-2 px-3.5 text-xs font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {isFa ? 'ممیزی معماری' : 'Architecture Audit'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/[0.06]">
          {[
            {
              key: 'health',
              icon: ShieldCheck,
              label: isFa ? 'امتیاز سلامت واقعی' : 'Real Health Score',
              value: live ? \`\${live.health.score} / 100\` : '—',
              sub: isFa ? 'کلیک برای گزارش' : 'Click for report',
              color: 'text-[#30d158]',
              onClick: () => live && setReport({ kind: 'health', title: isFa ? 'گزارش سلامت واقعی سرور' : 'Real Server Health Report', data: live.health.report }),
            },
            {
              key: 'eps',
              icon: Activity,
              label: isFa ? 'ورودی مشاهده‌شده' : 'Observed Ingest Rate',
              value: eps === null || eps === undefined ? '—' : nf.format(eps),
              sub: isFa ? 'از splunkd.log' : 'from splunkd.log',
              color: 'text-[#0a84ff]',
              onClick: () => onNavigateTab('live_logs'),
            },
            {
              key: 'nodes',
              icon: Server,
              label: isFa ? 'نودهای تنظیم‌شده' : 'Configured Nodes',
              value: \`\${openCount} / \${totalNodes || 0}\`,
              sub: isFa ? 'قابل کلیک' : 'Clickable',
              color: 'text-white',
              onClick: () => onNavigateTab('heartbeat_radar'),
            },
            {
              key: 'sockets',
              icon: Wifi,
              label: isFa ? 'سوکت‌های اصلی' : 'Core Sockets',
              value: \`\${socketOpenCount} / \${socketTotal || 0}\`,
              sub: isFa ? 'کلیک برای جزئیات' : 'Click for details',
              color: 'text-[#ff9f0a]',
              onClick: () => live && setReport({
                kind: 'socket',
                title: isFa ? 'ماتریس سوکت‌های واقعی' : 'Real Socket Matrix',
                socket: live.sockets[0] || { port: 0, name: '—', protocol: '—', open: false, address: null, detectedProtocol: null }
              }),
            },
          ].map(item => (
            <button key={item.key} onClick={item.onClick}
              className="text-start p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{item.label}</span>
                <item.icon className={\`w-4 h-4 \${item.color} opacity-80 group-hover:opacity-100\`} />
              </div>
              <div className={\`text-xl font-bold font-mono tabular-nums mt-1 \${item.color}\`}>{item.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20"><Radio className="w-4 h-4" /></div>
              <div>
                <h3 className="text-xs font-bold text-white">{isFa ? 'رادار ضربان واقعی نودها' : 'Real Node Heartbeat Radar'}</h3>
                <span className="text-[10px] text-white/40">{isFa ? 'هر نقطه از probe واقعی host/port ساخته می‌شود' : 'Each node is backed by a real host/port probe'}</span>
              </div>
            </div>
            <button onClick={() => onNavigateTab('heartbeat_radar')} className="text-xs text-[#0a84ff] flex items-center gap-1">
              {isFa ? 'رادار کامل' : 'Full Radar'} <ChevronRight className={\`w-3.5 h-3.5 \${isFa ? 'rotate-180' : ''}\`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-48 h-48 rounded-full border border-white/10 bg-black/40 overflow-hidden">
                {[0,1,2,3].map(i => (
                  <div key={i} className="absolute inset-0 rounded-full border border-white/[0.05]"
                    style={{ inset: \`\${16*i + 8}px\` }} />
                ))}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.05]" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.05]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0a84ff] shadow-[0_0_18px_rgba(10,132,255,.7)]" />
                {(live?.nodes || []).slice(0, 12).map((n, i, arr) => {
                  const angle = (i / Math.max(1, arr.length)) * Math.PI * 2 - Math.PI / 2;
                  const radius = 76;
                  const left = 50 + Math.cos(angle) * (radius / 2.1);
                  const top = 50 + Math.sin(angle) * (radius / 2.1);
                  return (
                    <button key={n.id}
                      title={\`\${n.name} — \${n.host}:\${n.port}\`}
                      onClick={() => setReport({ kind: 'node', title: isFa ? \`گزارش ضربان \${n.name}\` : \`Heartbeat Report — \${n.name}\`, node: n })}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={{ left: \`\${left}%\`, top: \`\${top}%\` }}>
                      <span className={\`block w-3.5 h-3.5 rounded-full border-2 border-black \${n.open ? 'bg-[#30d158] shadow-[0_0_12px_rgba(48,209,88,.8)]' : 'bg-[#ff453a] shadow-[0_0_12px_rgba(255,69,58,.7)]'}\`} />
                      <span className="absolute z-20 hidden group-hover:block whitespace-nowrap bottom-5 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/90 border border-white/10 text-[9px] font-mono text-white">
                        {n.name}
                      </span>
                    </button>
                  );
                })}
                {(!live || live.nodes.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/30 font-mono">
                    {isFa ? 'هنوز نودی برای probe تنظیم نشده' : 'No configured nodes to probe'}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-7 space-y-1.5">
              {(live?.nodes || []).slice(0, 8).map(n => (
                <button key={n.id}
                  onClick={() => setReport({ kind: 'node', title: isFa ? \`گزارش ضربان \${n.name}\` : \`Heartbeat Report — \${n.name}\`, node: n })}
                  className="w-full p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between text-start cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={\`w-2 h-2 rounded-full shrink-0 \${n.open ? 'bg-[#30d158]' : 'bg-[#ff453a]'}\`} />
                    <div className="min-w-0">
                      <span className="font-mono font-medium text-white/90 text-xs block truncate">{n.name}</span>
                      <span className="text-[10px] text-white/40 truncate block">{n.host}:{n.port} · {n.role || 'node'}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] shrink-0">
                    <span className={n.open ? 'text-[#30d158]' : 'text-[#ff453a]'}>{n.open ? 'UP' : 'DOWN'}</span>
                    <span className="block text-white/35">{Number(n.latencyMs || 0)}ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/20"><Building2 className="w-4 h-4" /></div>
              <div>
                <h3 className="text-xs font-bold text-white">{isFa ? 'ممیزی معماری واقعی' : 'Real Architecture Audit'}</h3>
                <span className="text-[10px] text-white/40">{isFa ? 'بر پایه باینری، کانفیگ، دیسک و listener واقعی' : 'Based on real binary, config, disk and listener checks'}</span>
              </div>
            </div>
            <button onClick={() => onNavigateTab('architecture_auditor')} className="text-xs text-[#0a84ff]">{isFa ? 'جزئیات' : 'Details'}</button>
          </div>

          <button onClick={() => live && setReport({ kind: 'architecture', title: isFa ? 'گزارش ممیزی معماری' : 'Architecture Audit Report', data: live.architecture.checks })}
            className="w-full text-start p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">{isFa ? 'امتیاز ممیزی' : 'Audit Score'}</span>
              <span className={\`text-2xl font-bold font-mono \${(live?.architecture.score ?? 0) >= 80 ? 'text-[#30d158]' : 'text-[#ff9f0a]'}\`}>
                {live ? \`\${live.architecture.score}%\` : '—'}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-current rounded-full" style={{ width: \`\${live?.architecture.score ?? 0}%\`, color: (live?.architecture.score ?? 0) >= 80 ? '#30d158' : '#ff9f0a' }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(live?.architecture.checks || []).slice(0, 6).map(c => (
                <div key={c.id} className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    {c.status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f0a]" />}
                    <span className="text-[10px] text-white/60 truncate">{c.labelFa}</span>
                  </div>
                </div>
              ))}
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/40 block">{isFa ? 'نسخه واقعی Splunk' : 'Real Splunk Version'}</span>
              <span className="text-xs font-mono text-white mt-1 block truncate">{live?.splunk.version || '—'}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/40 block">{isFa ? 'مصرف دیسک / RAM' : 'Disk / RAM'}</span>
              <span className="text-xs font-mono text-white mt-1 block">{live ? \`\${live.system.diskUsagePercent}% / \${fmtBytes(live.system.memoryTotalBytes - live.system.memoryFreeBytes)}\` : '—'}</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/20"><Wifi className="w-4 h-4" /></div>
              <div>
                <h3 className="text-xs font-bold text-white">{isFa ? 'ماتریس سوکت‌های شبکه واقعی' : 'Real Network Socket Matrix'}</h3>
                <span className="text-[10px] text-white/40">{isFa ? 'از kernel socket state؛ بدون process scan' : 'Kernel socket state only; no process scanning'}</span>
              </div>
            </div>
            <button onClick={() => { probeCluster(); void loadLive(); }} className="text-[#0a84ff]"><RefreshCw className={\`w-3.5 h-3.5 \${isProbingCluster ? 'animate-spin' : ''}\`} /></button>
          </div>

          <div className="space-y-1.5">
            {(live?.sockets || []).map(s => {
              const remoteProbe = socketResultMap.get(s.port);
              const effectiveOpen = remoteProbe ? remoteProbe.open : s.open;
              return (
                <button key={s.port}
                  onClick={() => setReport({ kind: 'socket', title: isFa ? \`پورت \${s.port} — \${s.name}\` : \`Port \${s.port} — \${s.name}\`, socket: { ...s, open: effectiveOpen } })}
                  className="w-full p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between gap-3 text-start cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={\`w-2 h-2 rounded-full shrink-0 \${effectiveOpen ? 'bg-[#30d158]' : 'bg-[#ff453a]'}\`} />
                    <span className="font-mono font-bold text-white text-xs">{s.port}</span>
                    <span className="text-white/45 text-[11px] truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
                    <span className="text-white/40">{s.protocol}</span>
                    <span className={effectiveOpen ? 'text-[#30d158]' : 'text-[#ff453a]'}>{effectiveOpen ? 'OPEN' : 'CLOSED'}</span>
                    {remoteProbe && <span className="text-white/30">{remoteProbe.latency}ms</span>}
                  </div>
                </button>
              );
            })}
            {(!live || live.sockets.length === 0) && <div className="py-8 text-center text-xs text-white/25">{isFa ? 'داده سوکت در دسترس نیست.' : 'Socket telemetry unavailable.'}</div>}
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[10px] text-white/35">
            {isFa ? \`سرور: \${live?.host.hostname || '—'} · IP: \${live?.host.primaryIp || '—'} · آخرین بررسی: \${live?.checkedAt ? new Date(live.checkedAt).toLocaleTimeString() : '—'}\`
              : \`Server: \${live?.host.hostname || '—'} · IP: \${live?.host.primaryIp || '—'} · Last check: \${live?.checkedAt ? new Date(live.checkedAt).toLocaleTimeString() : '—'}\`}
          </div>
        </section>

        <section className="lg:col-span-6 apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20"><Terminal className="w-4 h-4" /></div>
              <div>
                <h3 className="text-xs font-bold text-white">{isFa ? 'خروجی واقعی splunkd.log' : 'Real splunkd.log Output'}</h3>
                <span className="text-[10px] text-white/40">{isFa ? 'هر ۵ ثانیه از فایل واقعی بازخوانی می‌شود' : 'Read from the real log file every 5 seconds'}</span>
              </div>
            </div>
            <button onClick={() => onNavigateTab('live_logs')} className="text-xs text-[#0a84ff]">{isFa ? 'استریم کامل' : 'Full Stream'}</button>
          </div>
          <div className="bg-black/50 rounded-xl p-3 font-mono text-[10px] space-y-1.5 border border-white/[0.06] max-h-56 overflow-y-auto">
            {logs.length === 0
              ? <div className="text-white/25 py-6 text-center">{isFa ? 'لاگ واقعی Splunk در این سرور موجود نیست.' : 'No real Splunk log available on this host.'}</div>
              : logs.map((line, i) => (
                <button key={i} onClick={() => onInspectLogLine?.(line)}
                  className="w-full text-start p-1.5 rounded hover:bg-white/[0.05] text-white/70 hover:text-white cursor-pointer">
                  {line}
                </button>
              ))}
          </div>
        </section>
      </div>

      <div className="apple-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <Info className="w-4 h-4" />
          <span>{isFa ? 'داده‌ها از backend واقعی خوانده می‌شوند؛ refresh خودکار هر ۵ ثانیه انجام می‌شود.' : 'Telemetry comes from the real backend; automatic refresh runs every 5 seconds.'}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/35">
          <span>{live?.system.kernel || '—'}</span>
          <span>{live ? fmtUptime(live.system.uptimeSeconds) : '—'}</span>
        </div>
      </div>

      {report && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReport(null)}>
          <div className="w-full max-w-3xl max-h-[85vh] overflow-auto apple-card p-5 bg-[#0b0e17] border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">{report.title}</h2>
                <p className="text-[10px] text-white/35 mt-1 font-mono">{live?.checkedAt || '—'}</p>
              </div>
              <button onClick={() => setReport(null)} className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60"><X className="w-4 h-4" /></button>
            </div>

            {report.kind === 'node' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    ['Node', report.node.name],
                    ['Host', report.node.host],
                    ['Port', String(report.node.port)],
                    ['Heartbeat', report.node.heartbeat],
                    ['Latency', \`\${report.node.latencyMs}ms\`],
                    ['Checked', new Date(report.node.checkedAt).toLocaleTimeString()],
                  ].map(([k,v]) => <div key={k} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"><div className="text-[9px] text-white/35">{k}</div><div className="text-xs text-white font-mono mt-1 break-all">{v}</div></div>)}
                </div>
                {report.node.error && <pre className="p-3 rounded-lg bg-[#ff453a]/10 text-[#ff8b82] text-[10px] whitespace-pre-wrap">{report.node.error}</pre>}
              </div>
            )}

            {report.kind === 'socket' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  ['Port', String(report.socket.port)],
                  ['Name', report.socket.name],
                  ['Protocol', report.socket.protocol],
                  ['Open', report.socket.open ? 'YES' : 'NO'],
                  ['Address', report.socket.address || '—'],
                  ['Detected', report.socket.detectedProtocol || '—'],
                ].map(([k,v]) => <div key={k} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"><div className="text-[9px] text-white/35">{k}</div><div className="text-xs text-white font-mono mt-1 break-all">{v}</div></div>)}
              </div>
            )}

            {(report.kind === 'health' || report.kind === 'architecture') && (
              <div className="space-y-2">
                {report.data.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      {c.status === 'pass'
                        ? <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                        : <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" />}
                      <span className="text-xs font-bold text-white">{c.labelFa}</span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">{c.detailFa}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <button onClick={() => {
                if (report.kind === 'health') onNavigateTab('health_audit');
                if (report.kind === 'architecture') onNavigateTab('architecture_auditor');
                if (report.kind === 'node') onNavigateTab('heartbeat_radar');
                if (report.kind === 'socket') onNavigateTab('topology');
                setReport(null);
              }} className="apple-btn-primary px-4 py-2 text-xs">
                {isFa ? 'باز کردن ماژول کامل' : 'Open Full Module'} <ArrowUpRight className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BentoGridConsole;
