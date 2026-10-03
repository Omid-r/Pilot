import React, { useState, useEffect } from 'react';
import { SplunkFinding } from '../types';
import { 
  Bug, 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw, 
  Activity, 
  FileText, 
  Database, 
  Server, 
  Zap, 
  Cpu, 
  Copy, 
  Check, 
  Play, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sliders,
  Sparkles
} from 'lucide-react';

interface SplunkSystemDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'fa' | 'en';
  activeEnvironment: 'production' | 'parallel' | 'virtual';
  configs: Record<string, string>;
  findings: SplunkFinding[];
  resolvedFindings: SplunkFinding[];
  score: number;
  onRescan: () => void;
  onResetBaseline: () => void;
  onAutoFixAll: () => void;
}

export const SplunkSystemDebugModal: React.FC<SplunkSystemDebugModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeEnvironment,
  configs,
  findings,
  resolvedFindings,
  score,
  onRescan,
  onResetBaseline,
  onAutoFixAll
}) => {
  const isFa = lang === 'fa';
  const [activeDebugTab, setActiveDebugTab] = useState<'rules' | 'disk_files' | 'endpoints' | 'state' | 'terminal'>('rules');

  // Terminal state
  const [debugCommand, setDebugCommand] = useState<string>('splunk btool check --debug');
  const [isExecutingCmd, setIsExecutingCmd] = useState<boolean>(false);
  const [cmdOutput, setCmdOutput] = useState<{ stdout: string; stderr: string; exitCode: number; time: string } | null>(null);

  // Endpoints ping state
  const [endpointStatuses, setEndpointStatuses] = useState<Record<string, { status: number; latency: number; ok: boolean; dataSample?: string }>>({});
  const [isTestingEndpoints, setIsTestingEndpoints] = useState<boolean>(false);

  // Selected file for inspection
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<string>('server.conf');

  // Copied feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run terminal command
  const handleRunCommand = async (cmdToRun: string = debugCommand) => {
    setIsExecutingCmd(true);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/system/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun })
      });
      const data = await res.json();
      setCmdOutput({
        stdout: data.stdout || data.output || '(No standard output)',
        stderr: data.stderr || '',
        exitCode: data.exitCode ?? (res.ok ? 0 : 1),
        time: `${Date.now() - startTime}ms`
      });
    } catch (err: any) {
      setCmdOutput({
        stdout: '',
        stderr: err?.message || 'Connection failed to terminal execution API',
        exitCode: 1,
        time: `${Date.now() - startTime}ms`
      });
    } finally {
      setIsExecutingCmd(false);
    }
  };

  // Ping backend endpoints
  const testAllEndpoints = async () => {
    setIsTestingEndpoints(true);
    const endpoints = [
      { name: '/api/splunk/confs', method: 'GET' },
      { name: '/api/splunk/status', method: 'GET' },
      { name: '/api/splunk/btool', method: 'GET' },
      { name: '/api/splunk/logs', method: 'GET' },
      { name: '/api/system/env', method: 'GET' }
    ];

    const results: Record<string, any> = {};
    for (const ep of endpoints) {
      const t0 = Date.now();
      try {
        const res = await fetch(ep.name);
        const t1 = Date.now();
        let sample = '';
        try {
          const json = await res.json();
          sample = JSON.stringify(json).slice(0, 100) + '...';
        } catch (_) {}
        results[ep.name] = {
          status: res.status,
          latency: t1 - t0,
          ok: res.ok,
          dataSample: sample
        };
      } catch (err: any) {
        results[ep.name] = {
          status: 0,
          latency: 0,
          ok: false,
          dataSample: err?.message || 'Network Error'
        };
      }
    }
    setEndpointStatuses(results);
    setIsTestingEndpoints(false);
  };

  useEffect(() => {
    if (isOpen && activeDebugTab === 'endpoints') {
      testAllEndpoints();
    }
  }, [isOpen, activeDebugTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto text-start">
      <div 
        className="bg-[#0b0f19] border border-amber-500/40 w-full max-w-5xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#101625] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Bug className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {isFa ? 'ابزار دیباگ و عیب‌یابی عمیق سامانه (System Debugger)' : 'Splunk Diagnostic & System Debugger'}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                  Live Engine v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'بررسی بلادرنگ وضعیت موتور ممیزی، قواعد ۱۰‌گانه، پاسخ‌های API و فایل‌های فیزیکی دیسک' 
                  : 'Real-time telemetry of audit rules, backend APIs, disk files and state cache'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              title={isFa ? 'بستن' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Diagnostic Strip */}
        <div className="bg-[#090d15] border-b border-white/[0.06] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isFa ? 'محیط فعال:' : 'Active Env:'}</span>
              <span className="text-sky-400 font-bold uppercase">{activeEnvironment}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isFa ? 'امتیاز سلامت:' : 'Health Score:'}</span>
              <span className={`font-bold tabular-nums ${score >= 80 ? 'text-emerald-400' : (score >= 50 ? 'text-amber-400' : 'text-rose-400')}`}>
                {score}/100
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isFa ? 'خطاهای فعال:' : 'Active Issues:'}</span>
              <span className="text-rose-400 font-bold tabular-nums">{findings.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isFa ? 'تایید شده:' : 'Compliant:'}</span>
              <span className="text-emerald-400 font-bold tabular-nums">{resolvedFindings.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isFa ? 'فایل‌های دیسک:' : 'Configs on Disk:'}</span>
              <span className="text-violet-400 font-bold tabular-nums">{Object.keys(configs).length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRescan}
              className="px-2.5 py-1 rounded-lg bg-violet-600/25 hover:bg-violet-600/40 text-violet-300 border border-violet-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isFa ? 'اسکن مجدد' : 'Rescan'}</span>
            </button>
            <button
              onClick={onAutoFixAll}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{isFa ? 'اصلاح خودکار همه' : 'Auto-Fix All'}</span>
            </button>
            <button
              onClick={onResetBaseline}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isFa ? 'بارگذاری ۱۰ خطا' : 'Reload 10 Errors'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0e1320] border-b border-white/[0.06] px-6 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveDebugTab('rules')}
            className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              activeDebugTab === 'rules'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isFa ? 'ارزیابی زنده قواعد ۱۰‌گانه' : '10-Point Rules Engine'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {findings.length} / 10
            </span>
          </button>

          <button
            onClick={() => setActiveDebugTab('disk_files')}
            className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              activeDebugTab === 'disk_files'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isFa ? 'فایل‌های واقعی روی دیسک' : 'Raw Config Files'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {Object.keys(configs).length}
            </span>
          </button>

          <button
            onClick={() => setActiveDebugTab('endpoints')}
            className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              activeDebugTab === 'endpoints'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{isFa ? 'سلامت APIهای بک‌اند' : 'Backend API Health'}</span>
          </button>

          <button
            onClick={() => setActiveDebugTab('terminal')}
            className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              activeDebugTab === 'terminal'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isFa ? 'اجرای دستورات btool و ترمینال' : 'CLI & btool Runner'}</span>
          </button>

          <button
            onClick={() => setActiveDebugTab('state')}
            className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              activeDebugTab === 'state'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isFa ? 'کش مرورگر و ریست' : 'State & Storage Cache'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[64vh] space-y-4 font-sans text-xs">
          
          {/* TAB 1: Live Rules Inspector */}
          {activeDebugTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 leading-relaxed">
                {isFa 
                  ? 'جدول زیر وضعیت خط‌به‌خط ۱۰ نقطه خطای بحرانی در فایل‌های کانفیگ سرور را بر اساس موتور استنزا-محور جدید نشان می‌دهد. اگر خطایی حل شده باشد، به رنگ سبز با نشان ✓ نمایش داده می‌شود.'
                  : 'Live breakdown of the 10 critical configuration fault lines parsed via the new stanza-aware parser. Resolved items are verified green with a checkmark.'}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'crit-tcpout-cleartext', title: 'Rule 1: outputs.conf — Cleartext TLS Forwarding', file: 'outputs.conf', stanza: '[tcpout]', expect: 'useSSL = true' },
                  { id: 'crit-server-pass4symmkey', title: 'Rule 2: server.conf — pass4SymmKey Authentication Secret', file: 'server.conf', stanza: '[general]', expect: 'pass4SymmKey != changeme' },
                  { id: 'crit-server-ssl-versions', title: 'Rule 3: server.conf — Deprecated TLS Protocols & Compression', file: 'server.conf', stanza: '[sslConfig]', expect: 'sslVersionsToSupport = tls1.2,tls1.3' },
                  { id: 'crit-inputs-tcp-routing-broken', title: 'Rule 4: inputs.conf — Dangling TCP Routing Group', file: 'inputs.conf', stanza: '[monitor:///var/log/secure]', expect: '_TCP_ROUTING != missing_group' },
                  { id: 'crit-props-missing-transforms', title: 'Rule 5: props.conf — Dangling Transform & Threat Lookup', file: 'props.conf', stanza: '[syslog]', expect: 'TRANSFORMS-routing & LOOKUP-threat valid' },
                  { id: 'warn-outputs-bad-format', title: 'Rule 6: outputs.conf — Target Indexer Missing :Port', file: 'outputs.conf', stanza: '[tcpout:primary_indexers]', expect: 'server = ip:9997' },
                  { id: 'warn-inputs-no-index', title: 'Rule 7: inputs.conf — WinEvent Stanza Lacks Target Index', file: 'inputs.conf', stanza: '[monitor:///var/log/winevent...]', expect: 'index = os_win OR disabled = true' },
                  { id: 'warn-server-diskusage-low', title: 'Rule 8: server.conf — Dangerously Low Disk Space Threshold', file: 'server.conf', stanza: '[diskUsage]', expect: 'minFreeSpaceMB >= 2000' },
                  { id: 'warn-indexes-corrupted-path', title: 'Rule 9: indexes.conf — Corrupted Non-existent Volume Path', file: 'indexes.conf', stanza: '[corrupted_temp_idx]', expect: 'homePath valid & retention >= 90d' },
                  { id: 'crit-hec-plain-http', title: 'Rule 10: inputs.conf — HTTP Event Collector Lacks TLS', file: 'inputs.conf', stanza: '[http]', expect: 'enableSSL = 1' }
                ].map((rule, idx) => {
                  const activeItem = findings.find(f => f.id === rule.id);
                  const isResolved = !activeItem;

                  return (
                    <div 
                      key={rule.id}
                      className={`p-4 rounded-2xl border transition ${
                        isResolved
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isResolved ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-white">{rule.title}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {isResolved ? 'PASS ✓' : 'ACTIVE DEFECT'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target File:</span>
                          <span className="text-violet-300">{rule.file}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Stanza:</span>
                          <span className="text-sky-300">{rule.stanza}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Condition:</span>
                          <span className="text-amber-300">{rule.expect}</span>
                        </div>
                        {activeItem && (
                          <div className="mt-2 p-2 rounded-lg bg-black/40 border border-rose-500/30 text-rose-300">
                            <span className="text-[10px] uppercase text-slate-500 block">Culprit Code on Line {activeItem.line}:</span>
                            <code className="text-xs break-all">{activeItem.culpritCode}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Raw Config Files on Disk */}
          {activeDebugTab === 'disk_files' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {Object.keys(configs).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setSelectedFileForInspection(filename)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition cursor-pointer ${
                      selectedFileForInspection === filename
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {filename}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="flex items-center justify-between p-3 bg-[#080b12] border-t border-x border-white/[0.08] rounded-t-2xl font-mono text-xs text-slate-400">
                  <span>/opt/splunk/etc/system/local/{selectedFileForInspection}</span>
                  <button
                    onClick={() => handleCopy(configs[selectedFileForInspection] || '', 'file_content')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                  >
                    {copiedKey === 'file_content' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'file_content' ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی محتوا' : 'Copy')}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-b-2xl bg-[#05070c] border border-white/[0.08] font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-[460px] custom-scrollbar leading-relaxed">
                  {configs[selectedFileForInspection] || '(Empty file or not found on server)'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Backend API Health */}
          {activeDebugTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {isFa ? 'پایش لحظه‌ای اتصالات HTTP سرور اکسپرس و دیمن اسپلانک:' : 'Real-time HTTP health check of backend Express and Splunk APIs:'}
                </span>
                <button
                  onClick={testAllEndpoints}
                  disabled={isTestingEndpoints}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isTestingEndpoints ? 'animate-spin' : ''}`} />
                  <span>{isTestingEndpoints ? (isFa ? 'در حال پینگ...' : 'Pinging...') : (isFa ? 'تست مجدد همه' : 'Ping All')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { ep: '/api/splunk/confs', label: 'Configuration Files Engine' },
                  { ep: '/api/splunk/status', label: 'Daemon Process Status' },
                  { ep: '/api/splunk/btool', label: 'btool Syntax Validator' },
                  { ep: '/api/splunk/logs', label: 'splunkd.log Ingestion Stream' },
                  { ep: '/api/system/env', label: 'Host System Environment' }
                ].map(({ ep, label }) => {
                  const res = endpointStatuses[ep];

                  return (
                    <div key={ep} className="p-3.5 rounded-2xl bg-[#080c16] border border-white/[0.06] flex items-center justify-between gap-4 font-mono text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{ep}</span>
                          <span className="text-slate-500 text-[11px]">({label})</span>
                        </div>
                        {res?.dataSample && (
                          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-lg">
                            Sample: {res.dataSample}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {res ? (
                          <>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              res.ok ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              HTTP {res.status}
                            </span>
                            <span className="text-slate-400 text-[11px] tabular-nums">
                              {res.latency}ms
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Pending...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CLI & btool Runner */}
          {activeDebugTab === 'terminal' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {[
                  'splunk btool check --debug',
                  'splunk btool outputs list --debug',
                  'splunk btool server list --debug',
                  'ls -la /opt/splunk/etc/system/local',
                  'ps aux | grep splunk'
                ].map((sampleCmd) => (
                  <button
                    key={sampleCmd}
                    onClick={() => {
                      setDebugCommand(sampleCmd);
                      handleRunCommand(sampleCmd);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] font-mono text-[11px] transition cursor-pointer"
                  >
                    {sampleCmd.split(' ')[1] || sampleCmd}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={debugCommand}
                  onChange={(e) => setDebugCommand(e.target.value)}
                  placeholder="Enter command (e.g. splunk btool check)..."
                  className="flex-1 bg-[#05070c] border border-white/[0.1] rounded-xl px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleRunCommand()}
                  disabled={isExecutingCmd}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecutingCmd ? (isFa ? 'در حال اجرا...' : 'Running...') : (isFa ? 'اجرای دستور' : 'Execute')}</span>
                </button>
              </div>

              {cmdOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cmdOutput.exitCode === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>Exit Code: {cmdOutput.exitCode}</span>
                    </span>
                    <span>Duration: {cmdOutput.time}</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#05070c] border border-white/[0.08] font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] custom-scrollbar whitespace-pre-wrap leading-relaxed">
                    {cmdOutput.stdout}
                    {cmdOutput.stderr && `\n[STDERR]\n${cmdOutput.stderr}`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: State & Storage Cache */}
          {activeDebugTab === 'state' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{isFa ? 'کلیدهای ذخیره‌سازی محلی مرورگر (LocalStorage)' : 'Browser LocalStorage Keys:'}</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('splunk_resolved_findings');
                      localStorage.removeItem('splunk_production_configs');
                      localStorage.removeItem('splunk_parallel_configs');
                      localStorage.removeItem('splunk_virtual_configs');
                      onResetBaseline();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:bg-rose-600/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFa ? 'پاکسازی کامل کش و بازنشانی' : 'Purge All State & Reset'}</span>
                  </button>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {['splunk_resolved_findings', 'splunk_production_configs', 'splunk_parallel_configs', 'splunk_virtual_configs'].map((key) => {
                    const raw = localStorage.getItem(key);
                    return (
                      <div key={key} className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-4">
                        <span className="text-violet-300 font-semibold">{key}</span>
                        <span className="text-slate-400 truncate max-w-sm">
                          {raw ? `${raw.length} bytes (${raw.slice(0, 30)}...)` : '<Empty>'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#101625] border-t border-white/[0.08] px-6 py-3.5 flex items-center justify-between gap-4 text-xs">
          <span className="text-slate-400">
            {isFa ? 'برای گزارش مشکل یا تحلیل لاگ می‌توانید از کنسول خروجی بالا کپی بگیرید.' : 'You can copy diagnostic output from any tab to report or verify system behavior.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold transition cursor-pointer"
          >
            {isFa ? 'بستن پنجره' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
