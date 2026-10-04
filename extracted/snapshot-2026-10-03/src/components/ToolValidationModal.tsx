import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Activity, 
  Cpu, 
  Server, 
  Zap, 
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
  FileCheck
} from 'lucide-react';

interface ToolValidationCheck {
  nameFa: string;
  nameEn: string;
  status: 'pass' | 'warn';
  detailFa: string;
  detailEn: string;
  command?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface ToolValidationResult {
  toolId: string;
  status: 'healthy' | 'warning' | 'error';
  score: number;
  latencyMs: number;
  checks: ToolValidationCheck[];
  summaryFa: string;
  summaryEn: string;
  installed?: boolean;
  operational?: boolean;
}

interface OfflineReadinessSummary {
  overallStatus: 'healthy' | 'warning' | 'error';
  score: number;
  totalTools: number;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
  checkedAt: string;
  durationMs: number;
  messageFa: string;
  messageEn: string;
}

interface ToolValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFa: boolean;
  currentToolId: string;
  allModules: Array<{
    id: string;
    titleFa: string;
    titleEn: string;
    categoryNameFa: string;
    categoryNameEn: string;
    badge?: string;
  }>;
  onNavigateToTool?: (toolId: string) => void;
  initialTab?: 'current' | 'all';
  autoRunAllOnOpen?: boolean;
}

export const ToolValidationModal: React.FC<ToolValidationModalProps> = ({
  isOpen,
  onClose,
  isFa,
  currentToolId,
  allModules,
  onNavigateToTool,
  initialTab = 'current',
  autoRunAllOnOpen = false
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  const [selectedTool, setSelectedTool] = useState<string>(currentToolId);
  const [isValidating, setIsValidating] = useState(false);
  const [singleResult, setSingleResult] = useState<ToolValidationResult | null>(null);
  const [allResults, setAllResults] = useState<Record<string, ToolValidationResult>>({});
  const [totalTested, setTotalTested] = useState<number>(0);
  const [offlineSummary, setOfflineSummary] = useState<OfflineReadinessSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTool(currentToolId);
      setActiveTab(autoRunAllOnOpen ? 'all' : initialTab);
      if (autoRunAllOnOpen || initialTab === 'all') {
        runValidateAll();
      } else {
        runValidationForTool(currentToolId);
      }
    }
  }, [isOpen, currentToolId, initialTab, autoRunAllOnOpen]);

  const runValidationForTool = async (tId: string) => {
    setIsValidating(true);
    setSingleResult(null);
    try {
      const res = await fetch('/api/tools/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tId })
      });
      if (res.ok) {
        const data = await res.json();
        setSingleResult(data);
      }
    } catch (e: any) {
      setSingleResult({
        toolId: tId,
        status: 'warning',
        score: 0,
        latencyMs: 0,
        checks: [],
        summaryFa: `اعتبارسنجی واقعی انجام نشد: ${e?.message || 'خطای ارتباط با backend'}`,
        summaryEn: `Real validation did not complete: ${e?.message || 'backend communication error'}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const runValidateAll = async () => {
    setIsValidating(true);
    setOfflineSummary(null);
    try {
      const res = await fetch('/api/tools/offline-readiness');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || ('Offline validation failed (HTTP ' + res.status + ')'));
      }
      const validatedResults = data.results || data.tools || {};
      setAllResults(validatedResults);
      setTotalTested(data.totalTools || Object.keys(validatedResults).length || allModules.length);
      setOfflineSummary({
        overallStatus: data.overallStatus || 'warning',
        score: Number(data.score || 0),
        totalTools: Number(data.totalTools || 0),
        healthyCount: Number(data.healthyCount || 0),
        warningCount: Number(data.warningCount || 0),
        errorCount: Number(data.errorCount || 0),
        checkedAt: data.checkedAt || new Date().toISOString(),
        durationMs: Number(data.durationMs || 0),
        messageFa: data.messageFa || 'اعتبارسنجی آفلاین کامل شد.',
        messageEn: data.messageEn || 'Offline readiness validation completed.'
      });
    } catch (e: any) {
      setAllResults({});
      setTotalTested(0);
      setOfflineSummary({
        overallStatus: 'error',
        score: 0,
        totalTools: 0,
        healthyCount: 0,
        warningCount: 0,
        errorCount: 1,
        checkedAt: new Date().toISOString(),
        durationMs: 0,
        messageFa: 'اعتبارسنجی آفلاین انجام نشد: ' + (e?.message || 'خطای ارتباط با backend'),
        messageEn: 'Offline validation failed: ' + (e?.message || 'backend communication error')
      });
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  const currentMod = allModules.find(m => m.id === selectedTool) || allModules[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0b0e17] border border-violet-500/30 rounded-3xl max-w-3xl w-full shadow-[0_0_80px_rgba(139,92,246,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-violet-950/60 via-[#0e121e] to-indigo-950/40 border-b border-violet-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  {isFa ? 'اعتبارسنجی واقعی و آفلاین ابزارها' : 'Real Offline Tool Validation'}
                </h2>
                <span className={
                  'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ' +
                  (offlineSummary?.overallStatus === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : offlineSummary?.overallStatus === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30')
                }>
                  {offlineSummary
                    ? (isFa
                      ? offlineSummary.healthyCount + '/' + offlineSummary.totalTools + ' سالم'
                      : offlineSummary.healthyCount + '/' + offlineSummary.totalTools + ' healthy')
                    : (isFa ? 'در حال بررسی' : 'Validating')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'هر ابزار با یک فرمان واقعی read-only روی همین سرور اجرا می‌شود و command / stdout / stderr / exit code ثبت می‌گردد.'
                  : 'Every tool executes a real read-only command on this server; command, stdout, stderr and exit code are recorded.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 border-b border-white/[0.08] flex items-center gap-2 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'current'
                ? 'border-violet-500 text-white bg-white/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>{isFa ? 'اعتبار سنجی ابزار فعلی' : 'Current Tool Validation'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('all');
              if (Object.keys(allResults).length === 0) {
                runValidateAll();
              }
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'border-violet-500 text-white bg-white/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isFa ? `اعتبار سنجی جامع همه ابزارها (${allModules.length} ماژول)` : `Validate All Tools (${allModules.length})`}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'current' ? (
            <div className="space-y-4">
              {/* Tool Selector Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {isFa ? 'انتخاب ابزار مورد نظر جهت تست عملکرد:' : 'Target tool for validation:'}
                  </span>
                  <select
                    value={selectedTool}
                    onChange={(e) => {
                      setSelectedTool(e.target.value);
                      runValidationForTool(e.target.value);
                    }}
                    className="bg-[#0e1322] border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-violet-500"
                  >
                    {allModules.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#0b0e17] text-white">
                        {isFa ? `${m.titleFa} (${m.categoryNameFa})` : `${m.titleEn} (${m.categoryNameEn})`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => runValidationForTool(selectedTool)}
                  disabled={isValidating}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 self-start sm:self-center shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>{isValidating ? (isFa ? 'در حال تست...' : 'Testing...') : (isFa ? 'تست مجدد ابزار' : 'Re-test Tool')}</span>
                </button>
              </div>

              {/* Validation Result Hero Card */}
              {singleResult && (
                <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-2xl p-5 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            {isFa ? currentMod.titleFa : currentMod.titleEn}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            {singleResult.status === 'healthy'
                              ? (isFa ? '🟢 معتبر و در حال کار' : '🟢 Validated & Active')
                              : (isFa ? '🟠 نیازمند بررسی' : '🟠 Needs Attention')}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {isFa ? singleResult.summaryFa : singleResult.summaryEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[11px] font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300">
                        تاخیر: <strong className="text-emerald-400">{singleResult.latencyMs}ms</strong>
                      </span>
                      <span className="text-[11px] font-mono bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 font-bold">
                        امتیاز واقعی: {singleResult.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Checklist of internal tests */}
                  <div className="space-y-2.5">
                    <span className="font-bold text-slate-300 block text-[11px]">
                      {isFa ? 'نتایج آزمون‌های اعتبارسنجی مؤلفه‌ها:' : 'Individual component test results:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {singleResult.checks.map((c, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-start gap-2.5">
                          {c.status === 'pass'
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                          <div className="space-y-1 min-w-0">
                            <span className="font-bold text-white text-[11px]">
                              {isFa ? c.nameFa : c.nameEn}
                            </span>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {isFa ? c.detailFa : c.detailEn}
                            </p>
                            {c.command && (
                              <div className="mt-1.5 rounded-lg bg-slate-950/80 border border-slate-800 p-2 font-mono">
                                <div className="text-[9px] text-cyan-300 break-all">$ {c.command}</div>
                                {c.stdout && <pre className="mt-1 text-[9px] text-emerald-300 whitespace-pre-wrap break-words max-h-32 overflow-auto">{c.stdout}</pre>}
                                {c.stderr && <pre className="mt-1 text-[9px] text-rose-300 whitespace-pre-wrap break-words max-h-32 overflow-auto">{c.stderr}</pre>}
                                {c.exitCode !== undefined && (
                                  <div className={c.exitCode === 0 ? 'mt-1 text-[9px] text-emerald-400' : 'mt-1 text-[9px] text-rose-400'}>
                                    exit {c.exitCode}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* All Tools Grid Overview */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                <div>
                  <h3 className="font-bold text-white text-xs">
                    {isFa ? 'گزارش تجمیعی اعتبارسنجی تمامی ابزارهای سامانه' : 'Suite-wide Comprehensive Health Audit'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {offlineSummary
                      ? (isFa ? offlineSummary.messageFa : offlineSummary.messageEn)
                      : (isFa
                        ? 'آزمون فقط با داده‌های محلی سرور، فایل‌ها، Runtime، routeها و وابستگی‌های واقعی اجرا می‌شود.'
                        : 'Validation uses only local server files, runtime, routes and installed dependencies.')}
                  </p>
                </div>
                <button
                  onClick={runValidateAll}
                  disabled={isValidating}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>{isValidating ? (isFa ? 'درحال آزمون...' : 'Testing...') : (isFa ? 'اجرای مجدد آزمون جامع' : 'Re-run Full Audit')}</span>
                </button>
              </div>

              {offlineSummary && (
                <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-950/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-black text-white">{isFa ? 'نتیجه کنترل آمادگی آفلاین سرور' : 'Offline Server Readiness Result'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {isFa ? 'امتیاز ' + offlineSummary.score + '/100 • سالم ' + offlineSummary.healthyCount + ' • نیازمند بررسی ' + offlineSummary.warningCount + ' • خطا ' + offlineSummary.errorCount : 'Score ' + offlineSummary.score + '/100 • Healthy ' + offlineSummary.healthyCount + ' • Warning ' + offlineSummary.warningCount + ' • Error ' + offlineSummary.errorCount}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300">{offlineSummary.durationMs}ms</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {allModules.map(mod => {
                  const result = allResults[mod.id];
                  const isHealthy = result?.status === 'healthy';
                  return (
                    <div key={mod.id} className={
                      'p-3 rounded-2xl bg-white/[0.02] border transition flex flex-col justify-between gap-2 ' +
                      (isHealthy ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-amber-500/20 hover:border-amber-500/40')
                    }>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-[11px] block leading-tight">{isFa ? mod.titleFa : mod.titleEn}</span>
                          <span className="text-[10px] text-slate-500 block">{isFa ? mod.categoryNameFa : mod.categoryNameEn}</span>
                        </div>
                        {isHealthy ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={isHealthy ? 'font-mono text-emerald-400 font-bold' : 'font-mono text-amber-400 font-bold'}>{isHealthy ? '✓' : '⚠'} {result?.score ?? 0}/100</span>
                          <span className="text-slate-500">{result?.operational === false ? (isFa ? 'نیازمند توجه' : 'Needs attention') : (isFa ? 'Backend OK' : 'Backend OK')}</span>
                        </div>
                        {result?.summaryFa && <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{isFa ? result.summaryFa : result.summaryEn}</p>}
                      </div>
                      <div className="flex items-center justify-end pt-1 text-[10px]">
                        <button onClick={() => { if (onNavigateToTool) { onNavigateToTool(mod.id); onClose(); } }} className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5 cursor-pointer">
                          <span>{isFa ? 'مشاهده ابزار' : 'Open'}</span>
                          <ArrowRight className={isFa ? 'w-3 h-3 rotate-180' : 'w-3 h-3'} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#090c14] border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{isFa
              ? 'این گزارش فقط از وضعیت واقعی همین سرور و بدون دسترسی اینترنت ساخته شده است.'
              : 'This report is based only on this server’s real local state; no internet access is used.'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition cursor-pointer"
          >
            {isFa ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ToolValidationModal;
