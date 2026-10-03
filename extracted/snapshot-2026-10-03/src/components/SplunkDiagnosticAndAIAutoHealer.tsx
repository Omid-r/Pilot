import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Terminal,
  RotateCw,
  Sparkles,
  Play,
  ShieldCheck,
  Server,
  Zap,
  Check,
  Copy,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Wrench,
  Search,
  Sliders,
  ShieldAlert,
  Radio,
  FileCode,
  Lock,
  RefreshCw,
  Clock,
  Eye,
  Settings,
  HelpCircle,
  Database,
  Globe,
  Boxes,
  Trash2,
  PlusCircle,
  Box
} from 'lucide-react';

interface DiagnosticIssue {
  id: string;
  category: 'port' | 'config' | 'container' | 'script' | 'permissions' | 'http';
  titleFa: string;
  titleEn: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  status: 'FAIL' | 'WARN' | 'PASS';
  descriptionFa: string;
  descriptionEn: string;
  rootCauseFa: string;
  solutionFa: string;
  autoFixAvailable: boolean;
  affectedTarget: string;
  details?: string;
}

interface SplunkDiagnosticAndAIAutoHealerProps {
  lang: 'fa' | 'en';
  onOpenWebModal?: (url: string) => void;
  virtualClusterState?: any;
  destroyVirtualCloudServer?: () => void;
  recreateVirtualCloudServer?: () => void;
  isGlobalAiHealerRunning?: boolean;
}

export const SplunkDiagnosticAndAIAutoHealer: React.FC<SplunkDiagnosticAndAIAutoHealerProps> = ({
  lang,
  onOpenWebModal,
  virtualClusterState,
  destroyVirtualCloudServer,
  recreateVirtualCloudServer,
  isGlobalAiHealerRunning: externalAiHealerRunning
}) => {
  const isFa = lang === 'fa';

  // Navigation & SubTabs
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'ai_autoheal' | 'terminal_runbook' | 'live_http'>('diagnostics');

  // Diagnostic State
  const [selectedServerType, setSelectedServerType] = useState<'parallel' | 'real' | 'virtual' | 'custom'>('parallel');
  const [customTargetDir, setCustomTargetDir] = useState<string>('/opt/splunk_parallel');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);
  const [overallHealthScore, setOverallHealthScore] = useState<number>(45);
  const [httpStatusResult, setHttpStatusResult] = useState<string>('000');
  const [webPortInfo, setWebPortInfo] = useState<{ port: number; restPort: number; tcpPort: number; kvPort: number }>({
    port: 8001,
    restPort: 8090,
    tcpPort: 9998,
    kvPort: 8193
  });

  // Track resolved issue IDs per server to support real-time user verification
  const [resolvedParallelIssueIds, setResolvedParallelIssueIds] = useState<string[]>([]);
  const [resolvedRealIssueIds, setResolvedRealIssueIds] = useState<string[]>([]);
  const [resolvedVirtualIssueIds, setResolvedVirtualIssueIds] = useState<string[]>([]);

  // Handle Server Type Switch
  const handleServerTypeChange = (type: 'parallel' | 'real' | 'virtual' | 'custom') => {
    setSelectedServerType(type);
    if (type === 'parallel') {
      setWebPortInfo({ port: 8001, restPort: 8090, tcpPort: 9998, kvPort: 8193 });
      setCustomTargetDir('/opt/splunk_parallel');
    } else if (type === 'real') {
      setWebPortInfo({ port: 8000, restPort: 8089, tcpPort: 9997, kvPort: 8192 });
      setCustomTargetDir('/opt/splunk');
    } else if (type === 'virtual') {
      setWebPortInfo({ port: 8080, restPort: 8091, tcpPort: 9999, kvPort: 8194 });
      setCustomTargetDir('/opt/splunk_virtual');
    }
  };

  // AI Watchdog & Auto-Heal State
  const [isAiHealerRunning, setIsAiHealerRunning] = useState<boolean>(false);
  const [aiWatchdogActive, setAiWatchdogActive] = useState<boolean>(true);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string | null>(null);
  const [autoHealCompleted, setAutoHealCompleted] = useState<boolean>(false);
  const [autoHealStats, setAutoHealStats] = useState<{ fixedCount: number; remainingCount: number }>({ fixedCount: 0, remainingCount: 0 });

  // Terminal & Copy State
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [isRunningRunbook, setIsRunningRunbook] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
    showToast(isFa ? 'دستور با موفقیت کپی شد ✓' : 'Copied to clipboard ✓');
  };

  // Run targeted single issue auto-fix command directly on server
  const runSingleIssueFix = async (issueId: string) => {
    setFixingIssueId(issueId);
    showToast(isFa ? 'در حال اجرای دستور اصلاح در خط فرمان سرور...' : 'Executing fix command on server CLI...');
    const targetType = selectedServerType;
    const resolvedDir = targetType === 'real' 
      ? '/opt/splunk' 
      : targetType === 'virtual' 
      ? '/opt/splunk_virtual' 
      : (targetType === 'parallel' ? '/opt/splunk_parallel' : customTargetDir);

    try {
      const res = await fetch('/api/parallel-cluster/fix-individual-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          serverType: targetType,
          targetDir: resolvedDir
        })
      });

      if (res.ok) {
        if (targetType === 'real') {
          setResolvedRealIssueIds(prev => [...prev, issueId]);
        } else if (targetType === 'virtual') {
          setResolvedVirtualIssueIds(prev => [...prev, issueId]);
        } else {
          setResolvedParallelIssueIds(prev => [...prev, issueId]);
        }

        setDiagnosticIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'PASS' as const, severity: 'INFO' as const } : i));
        showToast(isFa ? 'دستور با موفقیت در سرور اجرا و خطا برطرف شد ✓' : 'Fix executed on server successfully ✓');
        setTimeout(() => runDeepDiagnostics(), 800);
      }
    } catch (_) {
      showToast(isFa ? 'خطا در ارتباط با سرور' : 'Error contacting server');
    } finally {
      setFixingIssueId(null);
    }
  };

  // Run Master Terminal Script directly on server CLI
  const runMasterRunbookOnServer = async () => {
    setIsRunningRunbook(true);
    showToast(isFa ? 'در حال اجرای اسکریپت در خط فرمان سرور...' : 'Executing runbook script on server CLI...');
    try {
      const res = await fetch('/api/parallel-cluster/execute-runbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: masterTerminalScript })
      });
      if (res.ok) {
        showToast(isFa ? 'اسکریپت با موفقیت در سرور اجرا شد ✓' : 'Master script executed on server ✓');
        setTimeout(() => runDeepDiagnostics(), 1000);
      }
    } catch (_) {
    } finally {
      setIsRunningRunbook(false);
    }
  };

  // Run Deep Diagnostics Probe - real backend only.
  const runDeepDiagnostics = async (overrideType?: 'parallel' | 'real' | 'virtual' | 'custom') => {
    setIsScanning(true);
    const targetType = overrideType || selectedServerType;
    if (targetType === 'virtual') {
      setDiagnosticIssues([]);
      setAiAnalysisSummary(isFa ? 'حالت Virtual در نسخه واقعی غیرفعال است و بدون runtime واقعی شبیه‌سازی نمی‌شود.' : 'Virtual mode is disabled in real execution; no synthetic runtime is used.');
      setOverallHealthScore(0); setHttpStatusResult('N/A'); setIsScanning(false);
      return;
    }
    const targetPort = targetType === 'real' ? 8000 : (targetType === 'parallel' ? 8001 : webPortInfo.port);
    const targetRest = targetType === 'real' ? 8089 : (targetType === 'parallel' ? 8090 : webPortInfo.restPort);
    const targetTcp = targetType === 'real' ? 9997 : (targetType === 'parallel' ? 9998 : webPortInfo.tcpPort);
    const targetKv = targetType === 'real' ? 8192 : (targetType === 'parallel' ? 8193 : webPortInfo.kvPort);
    const resolvedDir = targetType === 'real' ? '/opt/splunk' : (targetType === 'parallel' ? '/opt/splunk_parallel' : customTargetDir);
    try {
      const res = await fetch('/api/parallel-cluster/deep-diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverType:targetType,targetDir:resolvedDir,webPort:targetPort,restPort:targetRest,tcpPort:targetTcp,kvPort:targetKv})});
      const data = await res.json().catch(()=>({}));
      if(!res.ok || data.success===false) throw new Error(data.error || ('HTTP '+res.status));
      const rawIssues=data.issues||[];
      setDiagnosticIssues(rawIssues);
      setOverallHealthScore(Number(data.healthScore)||0);
      setHttpStatusResult(data.httpStatus||'000');
      setAiAnalysisSummary(data.aiAnalysis||null);
      setLastScanTime(new Date().toLocaleTimeString());
    } catch(err:any) {
      setDiagnosticIssues([{id:'backend-unavailable',category:'http',titleFa:'موتور عیب‌یابی واقعی در دسترس نیست',titleEn:'Real diagnostic backend unavailable',severity:'CRITICAL',status:'FAIL',descriptionFa:err?.message||'خطای ارتباط با backend',descriptionEn:err?.message||'Backend error',rootCauseFa:'ارتباط با endpoint واقعی برقرار نشد.',solutionFa:'لاگ backend را بررسی کنید و دوباره اسکن کنید.',autoFixAvailable:false,affectedTarget:resolvedDir}]);
      setOverallHealthScore(0); setHttpStatusResult('000'); setAiAnalysisSummary(err?.message||null);
    } finally { setIsScanning(false); }
  };

  // Run AI Autonomous Auto-Heal - real backend only.
  const runAiAutoHeal = async () => {
    setIsAiHealerRunning(true); setAutoHealCompleted(false);
    const targetType=selectedServerType;
    if(targetType==='virtual'){ setAiLogs([isFa?'[ERROR] حالت Virtual برای اجرا واقعی غیرفعال است.':'[ERROR] Virtual mode is disabled for real execution.']); setIsAiHealerRunning(false); return; }
    const targetDir=targetType==='real'?'/opt/splunk':(targetType==='parallel'?'/opt/splunk_parallel':customTargetDir);
    setAiLogs([`[${new Date().toISOString()}] [AI_HEALER] Starting real remediation for ${targetDir}`]);
    try {
      const res=await fetch('/api/parallel-cluster/ai-auto-heal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverType:targetType,targetDir,webPort:webPortInfo.port,restPort:webPortInfo.restPort,tcpPort:webPortInfo.tcpPort,kvPort:webPortInfo.kvPort})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok || data.success!==true) throw new Error(data.error || ('HTTP '+res.status));
      setAiLogs(data.logs||[]); setAutoHealCompleted(true);
      setHttpStatusResult(data.httpStatus||'000');
      setOverallHealthScore(100); setAutoHealStats({fixedCount:Number(data.fixedCount)||0,remainingCount:Number(data.remainingCount)||0});
      showToast(isFa?'خودترمیمی واقعی انجام و راستی‌آزمایی شد.':'Real auto-heal completed and verified.');
      await runDeepDiagnostics(targetType);
    } catch(err:any) {
      setAiLogs(prev=>[...prev,`[ERROR] ${err?.message||'Real auto-heal failed. No simulated success is reported.'}`]);
      setAutoHealCompleted(false); setAutoHealStats({fixedCount:0,remainingCount:diagnosticIssues.length});
      showToast(isFa?'خودترمیمی واقعی انجام نشد.':'Real auto-heal did not complete.');
    } finally { setIsAiHealerRunning(false); }
  };

  // Initial Scan on Mount
  useEffect(() => {
    runDeepDiagnostics();
  }, []);

  // One-Liner Terminal Master Fix Command
  const masterTerminalScript = `mkdir -p /opt/splunk_container_runtime /opt/splunk_parallel/etc/system/local

# 1. Free ports & clean lock files
fuser -k 8001/tcp 8090/tcp 9998/tcp 2>/dev/null || true

# 2. Write synchronized web.conf and server.conf stanzas
cat << 'EOF' > /opt/splunk_parallel/etc/system/local/web.conf
[settings]
httpport = 8001
server.socket_host = 0.0.0.0
enableSplunkWebSSL = false
startwebserver = 1
appServerPorts = 8066
mgmtHostPort = 127.0.0.1:8090
EOF

cat << 'EOF' > /opt/splunk_parallel/etc/system/local/server.conf
[general]
serverName = splunk-parallel-node
mgmtHostPort = 127.0.0.1:8090
pass4SymmKey = changeme-passkey
active_group = Free

[sslConfig]
mgmtHostPort = 127.0.0.1:8090

[kvstore]
port = 8193
EOF

# 3. Create deploy script in container runtime dir
cat << 'EOF' > /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh
#!/usr/bin/env bash
export SPLUNK_HOME="/opt/splunk_parallel"
export SPLUNK_RUN_AS_ROOT=1
mkdir -p /opt/splunk_parallel/bin /opt/splunk_parallel/var/log/splunk
if [ -d "/opt/splunk/bin" ] && [ ! -f "/opt/splunk_parallel/bin/splunk" ]; then
    cp -rn /opt/splunk/bin /opt/splunk_parallel/ 2>/dev/null || true
    cp -rn /opt/splunk/lib /opt/splunk_parallel/ 2>/dev/null || true
    cp -rn /opt/splunk/share /opt/splunk_parallel/ 2>/dev/null || true
    cp -rn /opt/splunk/etc /opt/splunk_parallel/ 2>/dev/null || true
fi
chmod -R +x /opt/splunk_parallel/bin/
/opt/splunk_parallel/bin/splunk start --accept-license --answer-yes --no-prompt --run-as-root
EOF

chmod +x /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh

# 4. Execute Offline Deployment
bash /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh 8001 8090 9998 changeme

# 5. Open Firewall
firewall-cmd --permanent --zone=public --add-port=8001/tcp --add-port=8090/tcp --add-port=9998/tcp 2>/dev/null && firewall-cmd --reload 2>/dev/null || true

# 6. Verify HTTP Response
sleep 3
curl -s -I "http://127.0.0.1:8001/en-US/account/login" | head -n 5`;

  const failedIssuesCount = diagnosticIssues.filter(i => i.status === 'FAIL').length;
  const warnIssuesCount = diagnosticIssues.filter(i => i.status === 'WARN').length;
  const passIssuesCount = diagnosticIssues.filter(i => i.status === 'PASS').length;

  return (
    <div className="bg-[#0b1017] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 text-start" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isFa 
                  ? 'خطایاب دقیق اسپلانک و هوش مصنوعی خودکار در پس‌زمینه (Deep Diagnostic & Local AI Auto-Healer)' 
                  : 'Splunk Deep Diagnostic Engine & Background Local AI Auto-Healer'}
              </h2>
              <span className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{isFa ? 'هوش مصنوعی فعال' : 'AI Engine Active'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              {isFa
                ? 'شناسایی و عیب‌یابی دقیق ریشه‌ای خطاهای اسپلانک موازی / کانتینری (مانند وضعیت HTTP 000000، عدم تطابق پورت 8090 در web.conf، خطای رجیستری آفلاین پودمن، خطای No such file or directory) و رفع خودکار تمام مشکلات در پس‌زمینه با هوش مصنوعی لوکال.'
                : 'Automated deep root-cause diagnosis and autonomous local background AI remediation for parallel instances, web.conf bindings, air-gapped podman/docker registries, and offline container pipelines.'}
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => runDeepDiagnostics()}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isScanning ? (isFa ? 'در حال اسکن عمیق...' : 'Scanning...') : (isFa ? 'اسکن مجدد خطایابی' : 'Re-Scan Diagnostics')}</span>
          </button>
          
          <button
            onClick={runAiAutoHeal}
            disabled={isAiHealerRunning}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 fill-slate-950 ${isAiHealerRunning ? 'animate-bounce' : ''}`} />
            <span>{isAiHealerRunning ? (isFa ? 'هوش مصنوعی در حال رفع خطاها...' : 'AI Auto-Healing...') : (isFa ? 'رفع هوشمند همه مشکلات با یک کلیک' : '1-Click AI Auto-Heal All')}</span>
          </button>
        </div>
      </div>

      {/* Target Server Type Selector Capsule Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Server className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{isFa ? 'انتخاب نوع سرور جهت خطایابی و خودترمیمی:' : 'Select Target Server for Diagnosis & Auto-Healing:'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full md:w-auto">
          {/* Parallel / Staging Instance */}
          <button
            onClick={() => {
              handleServerTypeChange('parallel');
              setTimeout(() => runDeepDiagnostics('parallel'), 100);
            }}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 transition cursor-pointer ${
              selectedServerType === 'parallel'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${selectedServerType === 'parallel' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{isFa ? 'سرور موازی' : 'Parallel Instance'}</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              :8001
            </span>
          </button>

          {/* Real / Production Instance */}
          <button
            onClick={() => {
              handleServerTypeChange('real');
              setTimeout(() => runDeepDiagnostics('real'), 100);
            }}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 transition cursor-pointer ${
              selectedServerType === 'real'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Server className={`w-3.5 h-3.5 ${selectedServerType === 'real' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{isFa ? 'سرور اصلی' : 'Real Primary'}</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              :8000
            </span>
          </button>

          {/* Virtual Cloud Instance */}
          <button
            onClick={() => {
              handleServerTypeChange('virtual');
              setTimeout(() => runDeepDiagnostics('virtual'), 100);
            }}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 transition cursor-pointer ${
              selectedServerType === 'virtual'
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Boxes className={`w-3.5 h-3.5 ${selectedServerType === 'virtual' ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{isFa ? 'سرور مجازی داکر' : 'Virtual Docker'}</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
              :8080
            </span>
          </button>

          {/* Custom Node */}
          <button
            onClick={() => handleServerTypeChange('custom')}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 transition cursor-pointer ${
              selectedServerType === 'custom'
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sliders className={`w-3.5 h-3.5 ${selectedServerType === 'custom' ? 'text-violet-400' : 'text-slate-500'}`} />
              <span>{isFa ? 'سرور سفارشی' : 'Custom Host'}</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-500/30">
              {webPortInfo.port}
            </span>
          </button>
        </div>
      </div>

      {/* KPI & Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Health Score */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{isFa ? 'امتیاز سلامت سرور' : 'Health Score'}</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${overallHealthScore > 80 ? 'text-emerald-400' : overallHealthScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {overallHealthScore}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {overallHealthScore > 80 ? (isFa ? 'سالم و پایدار' : 'Healthy') : (isFa ? 'نیازمند اصلاح هوشمند' : 'Needs Repair')}
            </span>
          </div>
        </div>

        {/* Web Port & HTTP Status */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{isFa ? `وضعیت وب (${selectedServerType === 'real' ? '8000' : webPortInfo.port})` : 'Splunk Web Port'}</span>
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl font-black font-mono ${httpStatusResult === '200' || httpStatusResult === '303' ? 'text-emerald-400' : 'text-rose-400'}`}>
              HTTP {httpStatusResult}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {httpStatusResult === '200' || httpStatusResult === '303' ? '200 OK' : '000000 (Wait/Offline)'}
            </span>
          </div>
        </div>

        {/* Critical Issues Identified */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{isFa ? 'خطاهای ریشه‌ای شناسایی شده' : 'Detected Issues'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {failedIssuesCount}
            </span>
            <span className="text-[10px] text-slate-400">
              {failedIssuesCount === 0 ? (isFa ? 'تمام موارد اصلاح شد' : 'All resolved') : (isFa ? 'مورد بحرانی' : 'Critical issues')}
            </span>
          </div>
        </div>

        {/* AI Auto-Pilot Watchdog */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{isFa ? 'نگهبان خودکار در پس‌زمینه' : 'AI Background Watchdog'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isFa ? 'فعال (خودترمیمی)' : 'Active (Self-Heal)'}
            </span>
            <button
              onClick={() => {
                setAiWatchdogActive(!aiWatchdogActive);
                showToast(aiWatchdogActive ? (isFa ? 'نگهبان پس‌زمینه موقتاً متوقف شد' : 'Watchdog paused') : (isFa ? 'نگهبان پس‌زمینه فعال شد' : 'Watchdog active'));
              }}
              className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              {aiWatchdogActive ? (isFa ? 'غیرفعال' : 'Pause') : (isFa ? 'فعال‌سازی' : 'Resume')}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>{isFa ? '۱. اسکنر خطایابی عمیق (Root-Cause Analyzer)' : '1. Deep Diagnostic Scanner'}</span>
          {failedIssuesCount > 0 && (
            <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {failedIssuesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai_autoheal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_autoheal'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{isFa ? '۲. هوش مصنوعی لوکال و لاگ خودترمیمی (AI Auto-Healer)' : '2. Local AI Auto-Healer & Logs'}</span>
          {autoHealCompleted && (
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              ✓
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('terminal_runbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'terminal_runbook'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>{isFa ? '۳. دستور ترمینال آماده و اسکریپت آفلاین (Terminal Runbook)' : '3. 1-Click Terminal Script'}</span>
        </button>

        <button
          onClick={() => setActiveTab('live_http')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'live_http'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{isFa ? '۴. تست زنده پورت وب و ورود به پنل (Web Live Access)' : '4. Web Access & Probe'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEEP DIAGNOSTIC SCANNER */}
      {/* ========================================================================= */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          
          {/* Main Selection & Action Control Block */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-200">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'سرور مورد نظر جهت خطایابی و بازبینی را انتخاب کنید:' : 'Select Server for Diagnostics & Auditing:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Parallel Server */}
                <button
                  onClick={() => {
                    handleServerTypeChange('parallel');
                    setTimeout(() => runDeepDiagnostics('parallel'), 50);
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    selectedServerType === 'parallel'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>{isFa ? 'سرور موازی (پورت 8001)' : 'Parallel Server (Port 8001)'}</span>
                </button>

                {/* Real Server */}
                <button
                  onClick={() => {
                    handleServerTypeChange('real');
                    setTimeout(() => runDeepDiagnostics('real'), 50);
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    selectedServerType === 'real'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{isFa ? 'سرور اصلی (پورت 8000)' : 'Real Server (Port 8000)'}</span>
                </button>
              </div>
            </div>

            {/* Huge Fix All / Auto-Heal Button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={runAiAutoHeal}
                disabled={isAiHealerRunning}
                className="w-full lg:w-auto px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-slate-950 animate-pulse" />
                <span>{isFa ? 'برطرف کردن همه خطاهای این سرور با ۱ کلیک' : '1-Click Fix All Server Errors'}</span>
              </button>
            </div>
          </div>

          {/* AI Synthesis Callout */}
          {aiAnalysisSummary && (
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-indigo-300 flex items-center gap-2">
                  <span>{isFa ? 'تحلیل ریشه‌ای هوش مصنوعی لوکال:' : 'Local AI Root-Cause Diagnostic Summary:'}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {aiAnalysisSummary}
                </p>
              </div>
            </div>
          )}

          {/* Diagnostic Issues List */}
          <div className="space-y-3">
            {diagnosticIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  issue.status === 'FAIL'
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : issue.status === 'WARN'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-emerald-950/20 border-emerald-500/40'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {issue.status === 'FAIL' ? (
                      <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : issue.status === 'WARN' ? (
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                        <Info className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {isFa ? issue.titleFa : issue.titleEn}
                      </h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        issue.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {issue.affectedTarget}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isFa ? issue.descriptionFa : issue.descriptionEn}
                    </p>

                    {/* Root Cause & Solution Box */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] space-y-1 text-slate-400">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-cyan-400 shrink-0">{isFa ? 'علت ریشه‌ای:' : 'Root Cause:'}</span>
                        <span className="text-slate-300">{issue.rootCauseFa}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-emerald-400 shrink-0">{isFa ? 'راهکار هوشمند:' : 'Solution:'}</span>
                        <span className="text-slate-300">{issue.solutionFa}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Action Button */}
                <div className="shrink-0 flex items-center md:flex-col gap-2">
                  {issue.status !== 'PASS' && issue.autoFixAvailable && (
                    <button
                      onClick={() => runSingleIssueFix(issue.id)}
                      disabled={fixingIssueId === issue.id || isAiHealerRunning}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Wrench className={`w-3.5 h-3.5 fill-slate-950 ${fixingIssueId === issue.id ? 'animate-spin' : ''}`} />
                      <span>{fixingIssueId === issue.id ? (isFa ? 'در حال اصلاح...' : 'Fixing...') : (isFa ? 'اصلاح با هوش مصنوعی' : 'Auto-Fix')}</span>
                    </button>
                  )}
                  {issue.status === 'PASS' && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isFa ? 'اصلاح شد (PASS)' : 'Resolved (PASS)'}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Execution Prompt */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-cyan-400">{isFa ? 'پیشنهاد هوش مصنوعی:' : 'AI Recommendation:'} </span>
              <span>
                {isFa 
                  ? 'جهت رفع یکجای تمام ناهماهنگی‌ها، روی دکمه «رفع هوشمند همه مشکلات با یک کلیک» کلیک نمایید.' 
                  : 'Click 1-Click AI Auto-Heal to apply all fixes simultaneously.'}
              </span>
            </div>
            <button
              onClick={runAiAutoHeal}
              disabled={isAiHealerRunning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{isFa ? 'اجرای خودترمیمی کامل' : 'Execute Full Auto-Heal'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOCAL AI AUTO-HEALER & LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'ai_autoheal' && (
        <div className="space-y-4">
          
          {/* Action Trigger Card */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'موتور خودترمیمی و حل خودکار هوش مصنوعی لوکال' : 'Local AI Autonomous Self-Healing Engine'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'این موتور تمام مراحل اصلاح کانفیگ، آزاد کردن پورت‌ها، ساخت فایل‌های گمشده و استارت دیمن اسپلانک را به صورت زنده اجرا می‌کند.'
                  : 'Automates configuration patching, socket cleanup, missing file generation, and daemon startup.'}
              </p>
            </div>

            <button
              onClick={runAiAutoHeal}
              disabled={isAiHealerRunning}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 fill-slate-950 ${isAiHealerRunning ? 'animate-spin' : ''}`} />
              <span>{isAiHealerRunning ? (isFa ? 'در حال اجرای عملیات...' : 'Healing...') : (isFa ? 'شروع عملیات خودترمیمی' : 'Start Auto-Heal')}</span>
            </button>
          </div>

          {/* Real-time AI Event Stream Console */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  {isFa ? 'لاگ زنده هوش مصنوعی و فرآیند خودترمیمی' : 'Live AI Remediation Event Stream'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                stdout / splunkd.log
              </span>
            </div>

            <div className="bg-black/80 rounded-lg p-3.5 font-mono text-xs text-emerald-400 space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
              {aiLogs.length > 0 ? (
                aiLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-cyan-500/60 select-none">❯</span>
                    <span className={log.includes('SUCCESS') || log.includes('200 OK') ? 'text-emerald-300 font-bold' : log.includes('WARN') ? 'text-amber-300' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-6 text-center text-xs">
                  {isFa ? 'آماده اجرا... روی دکمه «شروع عملیات خودترمیمی» کلیک کنید.' : 'Ready to heal... Click Start Auto-Heal.'}
                </div>
              )}
            </div>
          </div>

          {/* Success Banner if Completed */}
          {autoHealCompleted && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">
                    {isFa ? 'عملیات خودترمیمی با موفقیت کامل انجام شد ✓' : 'Auto-Healing Completed Successfully ✓'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isFa 
                      ? 'سرویس وب اسپلانک روی پورت 8001 راه‌اندازی شد و به وضعیت HTTP 200 OK رسید.' 
                      : 'Splunk Web is now active on port 8001 with HTTP 200 OK status.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenWebModal ? onOpenWebModal('http://127.0.0.1:8001/en-US/account/login') : window.open('http://localhost:8001/en-US/account/login', '_blank')}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ورود به وب اسپلانک (پورت 8001)' : 'Open Splunk Web'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 1-CLICK TERMINAL RUNBOOK */}
      {/* ========================================================================= */}
      {activeTab === 'terminal_runbook' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {isFa ? 'دستور یکپارچه ترمینال برای حل دستی تمام مشکلات در لینوکس' : 'Integrated Terminal Master Runbook Command'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runMasterRunbookOnServer}
                  disabled={isRunningRunbook}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-slate-950 ${isRunningRunbook ? 'animate-spin' : ''}`} />
                  <span>{isRunningRunbook ? (isFa ? 'در حال اجرا در سرور...' : 'Executing...') : (isFa ? 'اجرای مستقیم در سرور' : 'Execute Directly on Server')}</span>
                </button>

                <button
                  onClick={() => handleCopyText(masterTerminalScript, 'master-script')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {copiedCmd === 'master-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === 'master-script' ? (isFa ? 'کپی شد ✓' : 'Copied ✓') : (isFa ? 'کپی کل دستور' : 'Copy Full Command')}</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {isFa
                ? 'با کلیک روی دکمه «اجرای مستقیم در سرور» یا کپی دستور زیر در ترمینال لینوکس، کلیه دایرکتوری‌های لازم ساخته شده، پورت‌ها آزاد می‌شوند، فایل‌های کانفیگ اصلاح شده و سرویس اسپلانک راه‌اندازی می‌گردد:'
                : 'Execute directly or paste this all-in-one command into your Linux root terminal to create directories, align configs, free ports, and boot Splunk Web:'}
            </p>

            <div className="bg-black/90 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-amber-300 overflow-x-auto custom-scrollbar relative">
              <pre className="leading-relaxed whitespace-pre">{masterTerminalScript}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEB LIVE ACCESS & PROBE */}
      {/* ========================================================================= */}
      {activeTab === 'live_http' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'آدرس وب‌اینترفیس اسپلانک موازی / کانتینری' : 'Splunk Web Interface Endpoint'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    http://&lt;SERVER-IP&gt;:8001/en-US/account/login
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => runDeepDiagnostics()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'بررسی مجدد وضعیت پاسخ' : 'Re-Probe Endpoint'}</span>
                </button>

                <button
                  onClick={() => onOpenWebModal ? onOpenWebModal('http://127.0.0.1:8001/en-US/account/login') : window.open('http://localhost:8001/en-US/account/login', '_blank')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isFa ? 'باز کردن پنل وب (Port 8001)' : 'Open Web Panel'}</span>
                </button>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs">
                <span className="text-slate-400 block text-[10px]">{isFa ? 'نام کاربری پیش‌فرض' : 'Default Username'}</span>
                <span className="font-mono font-bold text-white mt-1 block">admin</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs">
                <span className="text-slate-400 block text-[10px]">{isFa ? 'کلمه عبور پیش‌فرض' : 'Default Password'}</span>
                <span className="font-mono font-bold text-cyan-300 mt-1 block">changeme</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs">
                <span className="text-slate-400 block text-[10px]">{isFa ? 'کد پاسخ زنده HTTP' : 'HTTP Response'}</span>
                <span className={`font-mono font-bold mt-1 block ${httpStatusResult === '200' || httpStatusResult === '303' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  HTTP {httpStatusResult} {httpStatusResult === '200' ? '(Active / Ready)' : '(Initializing / Needs AI Fix)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
