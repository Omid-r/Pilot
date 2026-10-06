import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, FileCheck, Layers, RefreshCw, ShieldCheck, X, Clock, Copy, Check, Terminal } from 'lucide-react';

interface ToolValidationCheck {
  nameFa: string; nameEn: string; status: 'pass' | 'warn'; detailFa: string; detailEn: string;
  command?: string; stdout?: string; stderr?: string; exitCode?: number;
}

interface ToolValidationResult {
  toolId: string; status: 'healthy' | 'warning' | 'error'; score: number; latencyMs: number;
  checks: ToolValidationCheck[]; summaryFa: string; summaryEn: string;
  installed?: boolean; operational?: boolean;
}

interface OfflineSummary {
  overallStatus: 'healthy' | 'warning' | 'error'; score: number; totalTools: number;
  healthyCount: number; warningCount: number; errorCount: number; checkedAt: string; durationMs: number;
  messageFa: string; messageEn: string;
}

interface Props {
  isOpen: boolean; onClose: () => void; isFa: boolean; currentToolId: string;
  allModules: Array<{ id: string; titleFa: string; titleEn: string; categoryNameFa: string; categoryNameEn: string; badge?: string }>;
  onNavigateToTool?: (toolId: string) => void;
  initialTab?: 'current' | 'all'; autoRunAllOnOpen?: boolean;
}

const safeError = (e: unknown) => e instanceof Error ? e.message : String(e || 'backend error');

export const ToolValidationModal: React.FC<Props> = ({
  isOpen, onClose, isFa, currentToolId, allModules, onNavigateToTool, initialTab = 'current', autoRunAllOnOpen = false
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'all'>(initialTab);
  const [selectedTool, setSelectedTool] = useState(currentToolId);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [singleResult, setSingleResult] = useState<ToolValidationResult | null>(null);
  const [allResults, setAllResults] = useState<Record<string, ToolValidationResult>>({});
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<any | null>(null);
  const [diagnosticProgress, setDiagnosticProgress] = useState<{ jobId: string; status: string; completedTools: number; totalTools: number; currentToolId: string | null } | null>(null);
  const [executingCheck, setExecutingCheck] = useState(false);
  const [checkInspector, setCheckInspector] = useState<{ toolId: string; checkIndex: number; checkedAt: string; toolLatencyMs: number; toolStatus?: string; toolScore?: number; check: ToolValidationCheck } | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const runValidationForTool = async (toolId: string) => {
    setIsValidating(true); setSingleResult(null);
    try {
      const res = await fetch('/api/tools/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify({ toolId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Validation failed');
      setSingleResult(data);
    } catch (e) {
      setSingleResult({ toolId, status: 'error', score: 0, latencyMs: 0, checks: [], summaryFa: 'اعتبارسنجی اجرا نشد: ' + safeError(e), summaryEn: 'Validation failed: ' + safeError(e) });
    } finally { setIsValidating(false); }
  };

  const runValidationForCheck = async (toolId: string, check: ToolValidationCheck, checkIndex: number) => {
    setExecutingCheck(true);
    try {
      const res = await fetch('/api/tools/validate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ toolId, checkIndex, checkNameEn: check.nameEn })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Check refresh failed');
      setSingleResult(prev => prev && prev.toolId === toolId ? prev : null);
      setCheckInspector({
        toolId: String(data.toolId || toolId),
        checkIndex: Number(data.checkIndex ?? checkIndex),
        checkedAt: String(data.checkedAt || new Date().toISOString()),
        toolLatencyMs: Number(data.toolLatencyMs || 0),
        toolStatus: data.toolStatus,
        toolScore: data.toolScore,
        check: data.check || check
      });
    } catch (e) {
      setCheckInspector({
        toolId,
        checkIndex,
        checkedAt: new Date().toISOString(),
        toolLatencyMs: 0,
        toolStatus: 'error',
        toolScore: 0,
        check: {
          ...check,
          status: 'warn',
          detailFa: 'اجرای مجدد این check ناموفق بود: ' + safeError(e),
          detailEn: 'This check could not be refreshed: ' + safeError(e),
          stderr: safeError(e),
          exitCode: 1
        }
      });
    } finally {
      setExecutingCheck(false);
    }
  };

  const runValidateAll = async () => {
    setIsValidating(true); setOfflineSummary(null);
    try {
      const res = await fetch('/api/tools/offline-readiness', { credentials: 'same-origin', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Offline validation failed');
      setAllResults(data.results || data.tools || {});
      setOfflineSummary({
        overallStatus: data.overallStatus || 'warning', score: Number(data.score || 0),
        totalTools: Number(data.totalTools || 0), healthyCount: Number(data.healthyCount || 0),
        warningCount: Number(data.warningCount || 0), errorCount: Number(data.errorCount || 0),
        checkedAt: data.checkedAt || new Date().toISOString(), durationMs: Number(data.durationMs || 0),
        messageFa: data.messageFa || 'اعتبارسنجی کامل شد.', messageEn: data.messageEn || 'Validation completed.'
      });
    } catch (e) {
      setAllResults({});
      setOfflineSummary({ overallStatus: 'error', score: 0, totalTools: 0, healthyCount: 0, warningCount: 0, errorCount: 1, checkedAt: new Date().toISOString(), durationMs: 0, messageFa: 'اعتبارسنجی انجام نشد: ' + safeError(e), messageEn: 'Validation failed: ' + safeError(e) });
    } finally { setIsValidating(false); }
  };

  const generateDiagnosticReport = async () => {
    setIsGeneratingReport(true);
    setDiagnosticReport(null);
    setDiagnosticProgress(null);
    setActiveTab('all');

    try {
      const startRes = await fetch('/api/tools/diagnostic-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: '{}'
      });
      const startData = await startRes.json().catch(() => ({}));
      if (!startRes.ok || startData.success !== true || !startData.jobId) {
        throw new Error(startData.error || ('HTTP ' + startRes.status));
      }

      const jobId = String(startData.jobId);
      const totalTools = Number(startData.totalTools || allModules.length || 0);
      setDiagnosticProgress({
        jobId,
        status: String(startData.status || 'queued'),
        completedTools: 0,
        totalTools,
        currentToolId: null
      });

      let finalData: any = null;
      for (let attempt = 0; attempt < 900; attempt++) {
        await new Promise(resolve => window.setTimeout(resolve, 1000));

        const poll = await fetch('/api/tools/diagnostic-report/' + encodeURIComponent(jobId), {
          credentials: 'same-origin',
          cache: 'no-store'
        });
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok || data.success !== true) {
          throw new Error(data.error || ('HTTP ' + poll.status));
        }

        setDiagnosticProgress({
          jobId,
          status: String(data.status || 'running'),
          completedTools: Number(data.completedTools || 0),
          totalTools: Number(data.totalTools || totalTools),
          currentToolId: data.currentToolId ? String(data.currentToolId) : null
        });

        if (data.status === 'error') {
          throw new Error(data.error || 'Diagnostic job failed');
        }
        if (data.status === 'completed' && data.report) {
          finalData = data.report;
          break;
        }
      }

      if (!finalData) throw new Error('Diagnostic report timed out before completion.');

      setDiagnosticReport(finalData);
      setAllResults(finalData.tools || {});
      setOfflineSummary({
        overallStatus: Number(finalData.errorCount || 0) > 0 ? 'error' : Number(finalData.warningCount || 0) > 0 ? 'warning' : 'healthy',
        score: Number(finalData.overallScore || 0),
        totalTools: Number(finalData.totalTools || 0),
        healthyCount: Number(finalData.healthyCount || 0),
        warningCount: Number(finalData.warningCount || 0),
        errorCount: Number(finalData.errorCount || 0),
        checkedAt: finalData.generatedAt || new Date().toISOString(),
        durationMs: Number(finalData.durationMs || 0),
        messageFa: 'گزارش جامع ' + Number(finalData.totalTools || 0) + ' ابزار آماده شد.',
        messageEn: 'Comprehensive report for ' + Number(finalData.totalTools || 0) + ' tools is ready.'
      });
      setDiagnosticProgress(prev => prev ? { ...prev, status: 'completed', completedTools: finalData.totalTools || prev.completedTools, totalTools: finalData.totalTools || prev.totalTools, currentToolId: null } : prev);
    } catch (e) {
      setDiagnosticProgress(prev => prev ? { ...prev, status: 'error', currentToolId: null } : prev);
      setOfflineSummary({
        overallStatus: 'error', score: 0, totalTools: 0, healthyCount: 0, warningCount: 0, errorCount: 1,
        checkedAt: new Date().toISOString(), durationMs: 0,
        messageFa: 'ساخت گزارش ناموفق بود: ' + safeError(e),
        messageEn: 'Report generation failed: ' + safeError(e)
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const reportJson = diagnosticReport ? JSON.stringify(diagnosticReport, null, 2) : '';
  const copyReport = async () => { if (reportJson) { try { await navigator.clipboard.writeText(reportJson); } catch (_) {} } };
  const downloadReport = () => {
    if (!reportJson) return;
    const blob = new Blob([reportJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'pilot-comprehensive-tool-diagnostic-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTool(currentToolId); setActiveTab(autoRunAllOnOpen ? 'all' : initialTab);
    if (autoRunAllOnOpen) void generateDiagnosticReport(); else void runValidationForTool(currentToolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentToolId, initialTab, autoRunAllOnOpen]);

  if (!isOpen) return null;
  const currentModule = allModules.find(m => m.id === selectedTool) || allModules[0];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md'>
      <div className='bg-[#0b0e17] border border-violet-500/30 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]' dir={isFa ? 'rtl' : 'ltr'}>
        <div className='p-5 border-b border-white/[0.08] flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <ShieldCheck className='w-5 h-5 text-violet-400' />
            <div><h2 className='text-base font-black text-white'>{isFa ? 'ممیزی و گزارش واقعی ابزارها' : 'Real Tool Audit & Diagnostic Report'}</h2>
              <p className='text-[11px] text-slate-400 mt-1'>{isFa ? 'فرمان، خروجی، کد خطا و وضعیت هر ابزار ثبت می‌شود.' : 'Command, output, exit code and status are recorded for each tool.'}</p></div>
          </div>
          <button onClick={onClose} className='p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer'><X className='w-4 h-4' /></button>
        </div>

        <div className='px-6 pt-4 border-b border-white/[0.08] flex items-center gap-2'>
          <button onClick={() => setActiveTab('current')} className={'px-4 py-2 rounded-t-xl text-xs font-bold border-b-2 cursor-pointer ' + (activeTab === 'current' ? 'border-violet-500 text-white' : 'border-transparent text-slate-400')}><ZapLabel isFa={isFa} /></button>
          <button onClick={() => { setActiveTab('all'); if (!Object.keys(allResults).length) void runValidateAll(); }} className={'px-4 py-2 rounded-t-xl text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ' + (activeTab === 'all' ? 'border-violet-500 text-white' : 'border-transparent text-slate-400')}><Layers className='w-3.5 h-3.5 text-indigo-400' />{isFa ? 'گزارش همه ابزارها' : 'All Tools'}</button>
        </div>

        <div className='p-6 overflow-y-auto space-y-5 flex-1'>
          {activeTab === 'current' ? (
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]'>
                <select value={selectedTool} onChange={e => { setSelectedTool(e.target.value); void runValidationForTool(e.target.value); }} className='bg-[#0e1322] border border-white/20 text-white rounded-xl px-3 py-2 text-xs w-full sm:w-auto'>
                  {allModules.map(m => <option key={m.id} value={m.id}>{isFa ? m.titleFa : m.titleEn}</option>)}
                </select>
                <button onClick={() => void runValidationForTool(selectedTool)} disabled={isValidating} className='px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer disabled:opacity-40 flex items-center gap-2'><RefreshCw className={'w-3.5 h-3.5 ' + (isValidating ? 'animate-spin' : '')} />{isFa ? 'تست مجدد' : 'Re-test'}</button>
              </div>
              {singleResult && <ResultCard result={singleResult} isFa={isFa} module={currentModule} onRefreshCheck={runValidationForCheck} refreshingCheck={executingCheck} />}
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3'>
                <div><h3 className='text-xs font-bold text-white'>{isFa ? 'ممیزی جامع همه ابزارها' : 'Comprehensive tool audit'}</h3>
                  <p className='text-[10px] text-slate-400 mt-1'>{offlineSummary ? (isFa ? offlineSummary.messageFa : offlineSummary.messageEn) : (isFa ? 'آزمون مرحله‌ای و واقعی روی خود سرور.' : 'Sequential real validation on this server.')}</p></div>
                <div className='flex flex-wrap items-center gap-2'>
                  <button onClick={() => void generateDiagnosticReport()} disabled={isGeneratingReport || isValidating} className='px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-40 flex items-center gap-2'><FileCheck className={'w-3.5 h-3.5 ' + (isGeneratingReport ? 'animate-spin' : '')} />{isGeneratingReport ? (isFa ? 'در حال ساخت...' : 'Building...') : (isFa ? 'اجرای همه و ساخت گزارش' : 'Run All + Build Report')}</button>
                  {diagnosticReport && <><button onClick={() => void copyReport()} className='px-3 py-2 rounded-xl bg-white/[0.06] text-white text-xs font-bold cursor-pointer'>Copy JSON</button><button onClick={downloadReport} className='px-3 py-2 rounded-xl bg-white/[0.06] text-white text-xs font-bold cursor-pointer'>{isFa ? 'دانلود JSON' : 'Download JSON'}</button></>}
                  <button onClick={() => void runValidateAll()} disabled={isValidating || isGeneratingReport} className='px-3 py-2 rounded-xl bg-white/[0.06] text-white text-xs font-bold cursor-pointer disabled:opacity-40'><RefreshCw className='w-3.5 h-3.5 inline mr-1' />{isFa ? 'تست معمولی' : 'Basic Run'}</button>
                </div>
              </div>
              {offlineSummary && <div className='p-4 rounded-2xl border border-violet-500/20 bg-violet-950/10 text-xs text-slate-300'>{offlineSummary.score}/100 · {offlineSummary.healthyCount} functional · {(offlineSummary as any).partialCount ?? 0} partial · {offlineSummary.warningCount} warning · {offlineSummary.errorCount} error · {offlineSummary.durationMs}ms</div>}
              {diagnosticProgress && diagnosticProgress.status !== 'completed' && diagnosticProgress.status !== 'error' && (
                <div className='p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 space-y-2'>
                  <div className='flex items-center justify-between text-xs text-cyan-200'>
                    <span>{isFa ? 'در حال اجرای تست واقعی ابزارها…' : 'Running real tool diagnostics…'}</span>
                    <span className='font-mono'>{diagnosticProgress.completedTools}/{diagnosticProgress.totalTools}</span>
                  </div>
                  <div className='h-2 rounded-full bg-white/[0.06] overflow-hidden'>
                    <div
                      className='h-full bg-cyan-400 transition-all duration-300'
                      style={{ width: `${diagnosticProgress.totalTools ? Math.round((diagnosticProgress.completedTools / diagnosticProgress.totalTools) * 100) : 0}%` }}
                    />
                  </div>
                  <div className='text-[10px] text-cyan-200/60 font-mono'>
                    {diagnosticProgress.currentToolId || (isFa ? 'در صف…' : 'Queued…')}
                  </div>
                </div>
              )}
              {diagnosticReport && <div className='p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 text-xs text-emerald-200'>{isFa ? 'گزارش آماده است؛ JSON را دانلود یا Copy کنید و همین فایل را برای من بفرستید.' : 'Report ready. Download or copy the JSON and send it to me.'}</div>}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
                {allModules.map(mod => { const result = allResults[mod.id]; const good = result?.status === 'healthy'; return <div key={mod.id} className='p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]'>
                  <div className='flex items-start justify-between gap-2'><div><div className='text-[11px] font-bold text-white'>{isFa ? mod.titleFa : mod.titleEn}</div><div className='text-[10px] text-slate-500'>{isFa ? mod.categoryNameFa : mod.categoryNameEn}</div></div>{good ? <CheckCircle2 className='w-4 h-4 text-emerald-400' /> : <AlertTriangle className='w-4 h-4 text-amber-400' />}</div>
                  <div className='mt-2 text-[10px] font-mono text-slate-300'>{result ? result.score + '/100' : '—'}</div>
                  {result?.summaryFa && <div className='mt-1 text-[10px] text-slate-500 line-clamp-2'>{isFa ? result.summaryFa : result.summaryEn}</div>}
                  <div className='mt-2 flex items-center gap-2'>
                    <button
                      onClick={() => { setSelectedTool(mod.id); setActiveTab('current'); void runValidationForTool(mod.id); }}
                      disabled={isValidating || executingCheck}
                      className='text-[10px] text-cyan-300 hover:text-cyan-200 cursor-pointer inline-flex items-center gap-1 disabled:opacity-40'
                    >
                      <RefreshCw className={'w-3 h-3 ' + (isValidating && selectedTool === mod.id ? 'animate-spin' : '')} />
                      {isFa ? 'Refresh و مشاهده اجرا' : 'Refresh & inspect'}
                    </button>
                    <button onClick={() => { if (onNavigateToTool) { onNavigateToTool(mod.id); onClose(); } }} className='text-[10px] text-violet-400 cursor-pointer'>{isFa ? 'باز کردن ابزار' : 'Open tool'} <ArrowRight className='w-3 h-3 inline' /></button>
                  </div>
                </div>; })}
              </div>
            </div>
          )}
        </div>
      </div>
        {checkInspector && (
    <div className='fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm' dir={isFa ? 'rtl' : 'ltr'}>
      <div className='bg-[#080c16] border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,.7)]'>
        <div className='p-4 border-b border-white/[0.08] flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'><Terminal className='w-4 h-4 text-cyan-400' /><span className='text-sm font-black text-white'>{isFa ? 'اجرای واقعی Check روی سرور' : 'Live Server Check Execution'}</span></div>
            <div className='text-[10px] text-slate-400 mt-1 truncate'>{checkInspector.check.nameEn} · {checkInspector.toolId} · #{checkInspector.checkIndex + 1}</div>
          </div>
          <button type='button' onClick={() => setCheckInspector(null)} className='p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400'><X className='w-4 h-4' /></button>
        </div>
        <div className='p-4 overflow-y-auto max-h-[calc(88vh-70px)] space-y-3'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            <div className='rounded-xl border border-white/[0.06] bg-white/[0.03] p-3'><div className='text-[9px] text-slate-500'>{isFa ? 'وضعیت' : 'Status'}</div><div className={'mt-1 text-xs font-black ' + (checkInspector.check.status === 'pass' ? 'text-emerald-300' : 'text-amber-300')}>{checkInspector.check.status.toUpperCase()}</div></div>
            <div className='rounded-xl border border-white/[0.06] bg-white/[0.03] p-3'><div className='text-[9px] text-slate-500'>Exit Code</div><div className='mt-1 text-xs font-black text-white'>{checkInspector.check.exitCode ?? '—'}</div></div>
            <div className='rounded-xl border border-white/[0.06] bg-white/[0.03] p-3'><div className='text-[9px] text-slate-500'>{isFa ? 'Latency' : 'Latency'}</div><div className='mt-1 text-xs font-black text-white flex items-center gap-1'><Clock className='w-3 h-3 text-cyan-400' />{checkInspector.toolLatencyMs}ms</div></div>
            <div className='rounded-xl border border-white/[0.06] bg-white/[0.03] p-3'><div className='text-[9px] text-slate-500'>{isFa ? 'زمان' : 'Checked at'}</div><div className='mt-1 text-[10px] font-mono text-slate-300'>{new Date(checkInspector.checkedAt).toLocaleTimeString()}</div></div>
          </div>
          <div className='rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3'>
            <div className='flex items-center justify-between gap-2 mb-2'><div className='text-[10px] font-bold text-cyan-200'>{isFa ? 'دستور دقیق اجراشده روی سرور' : 'Exact command executed on the server'}</div><button type='button' onClick={() => { if (checkInspector.check.command) { navigator.clipboard.writeText(checkInspector.check.command).then(() => { setCopiedCommand(true); window.setTimeout(() => setCopiedCommand(false), 1500); }).catch(() => {}); } }} className='text-[9px] text-slate-300 hover:text-white inline-flex items-center gap-1'>{copiedCommand ? <Check className='w-3 h-3 text-emerald-400' /> : <Copy className='w-3 h-3' />}{copiedCommand ? (isFa ? 'کپی شد' : 'Copied') : 'Copy'}</button></div>
            <pre className='text-[11px] text-cyan-300 whitespace-pre-wrap break-words font-mono'>{checkInspector.check.command || (isFa ? 'فرمان مستقیمی برای این check ثبت نشده است.' : 'No direct command was recorded for this check.')}</pre>
          </div>
          <div className='rounded-xl border border-white/[0.06] bg-black/30 p-3'>
            <div className='text-[10px] font-bold text-slate-200 mb-2'>{isFa ? 'پاسخ / STDOUT' : 'Response / STDOUT'}</div>
            <pre className='text-[10px] text-slate-300 whitespace-pre-wrap break-words min-h-[90px]'>{checkInspector.check.stdout || (isFa ? '(بدون stdout)' : '(no stdout)')}</pre>
          </div>
          <div className='rounded-xl border border-rose-500/20 bg-rose-950/10 p-3'>
            <div className='text-[10px] font-bold text-rose-200 mb-2'>{isFa ? 'STDERR / ERROR' : 'STDERR / ERROR'}</div>
            <pre className='text-[10px] text-rose-300 whitespace-pre-wrap break-words min-h-[60px]'>{checkInspector.check.stderr || (isFa ? '(بدون stderr)' : '(no stderr)')}</pre>
          </div>
          <div className='rounded-xl border border-white/[0.06] bg-white/[0.02] p-3'>
            <div className='text-[10px] font-bold text-white mb-1'>{isFa ? 'شرح check' : 'Check detail'}</div>
            <div className='text-[10px] text-slate-400'>{isFa ? checkInspector.check.detailFa : checkInspector.check.detailEn}</div>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

const ZapLabel: React.FC<{ isFa: boolean }> = ({ isFa }) => <>⚡ {isFa ? 'ابزار فعلی' : 'Current Tool'}</>;

const ResultCard: React.FC<{
  result: ToolValidationResult;
  isFa: boolean;
  module: Props['allModules'][number];
  onRefreshCheck: (toolId: string, check: ToolValidationCheck, checkIndex: number) => void;
  refreshingCheck: boolean;
}> = ({ result, isFa, module, onRefreshCheck, refreshingCheck }) => (
  <div className='p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3'>
    <div className='flex items-center justify-between gap-3'>
      <div><div className='text-sm font-black text-white'>{isFa ? module?.titleFa : module?.titleEn}</div><div className='text-[10px] text-slate-400 mt-1'>{isFa ? result.summaryFa : result.summaryEn}</div></div>
      <div className='font-mono text-sm text-white'>{result.score}/100</div>
    </div>
    <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
      {result.checks.map((c, i) => <div key={i} className='p-3 rounded-xl border border-white/[0.06] bg-black/20'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 min-w-0'>{c.status === 'pass' ? <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0' /> : <AlertTriangle className='w-4 h-4 text-amber-400 shrink-0' />}<span className='text-[11px] font-bold text-white'>{isFa ? c.nameFa : c.nameEn}</span></div>
          <button
            type='button'
            onClick={() => onRefreshCheck(result.toolId, c, i)}
            disabled={refreshingCheck}
            className='shrink-0 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-40 inline-flex items-center gap-1'
            title={isFa ? 'اجرای مجدد همین بررسی و نمایش دستور/خروجی در Popup' : 'Re-run this check and show command/output in a popup'}
          >
            <RefreshCw className={'w-3 h-3 ' + (refreshingCheck ? 'animate-spin' : '')} />
            {isFa ? 'Refresh' : 'Refresh'}
          </button>
        </div>
        <div className='text-[10px] text-slate-400 mt-1'>{isFa ? c.detailFa : c.detailEn}</div>
        {c.command && <pre className='mt-2 text-[9px] text-cyan-300 whitespace-pre-wrap break-words'>$ {c.command}\n{c.stdout || ''}{c.stderr ? '\n' + c.stderr : ''}{c.exitCode !== undefined ? '\nexit ' + c.exitCode : ''}</pre>}
      </div>)}
    </div>
  </div>
);


export default ToolValidationModal;