import React, { useState, useEffect } from 'react';
import { LiveLogAnalysis, TargetEnvironment, ParallelClusterState } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Wrench, 
  X, 
  Terminal, 
  Check, 
  Copy, 
  Info, 
  ShieldAlert, 
  ArrowRight, 
  Archive, 
  RotateCcw, 
  BookOpen, 
  Play, 
  Code2, 
  Sliders, 
  RotateCw, 
  Server, 
  Split, 
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';

interface LiveLogAnalysisModalProps {
  analysis: LiveLogAnalysis | null;
  onClose: () => void;
  onApplyFix: (configName: string, patch: string, targetEnv?: TargetEnvironment) => Promise<boolean>;
  onBackupFile?: (filename: string) => void;
  onRestoreFile?: (filename: string) => void;
  hasFileBackup?: boolean;
  onJumpToDoc?: (searchQuery: string) => void;
  lang?: 'fa' | 'en';
  parallelClusterState?: ParallelClusterState;
  defaultTargetEnv?: TargetEnvironment;
}

export const LiveLogAnalysisModal: React.FC<LiveLogAnalysisModalProps> = ({
  analysis,
  onClose,
  onApplyFix,
  onBackupFile,
  onRestoreFile,
  hasFileBackup = false,
  lang = 'fa',
  parallelClusterState,
  defaultTargetEnv = 'production'
}) => {
  const isFa = lang === 'fa';
  const [targetEnv, setTargetEnv] = useState<TargetEnvironment>(
    parallelClusterState?.isInstalled ? 'parallel' : defaultTargetEnv
  );
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [backupTaken, setBackupTaken] = useState(false);
  const [restoredSuccessfully, setRestoredSuccessfully] = useState(false);

  // Editable Configuration Patch State
  const [editablePatch, setEditablePatch] = useState<string>('');
  const [editableConfig, setEditableConfig] = useState<string>('server.conf');
  const [editableStanza, setEditableStanza] = useState<string>('[general]');
  const [isManualEdit, setIsManualEdit] = useState<boolean>(false);

  // Diagnostic Tool / Terminal Execution State
  const [editableCliCommand, setEditableCliCommand] = useState<string>('');
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [toolResult, setToolResult] = useState<{
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    time: string;
  } | null>(null);

  // Sync state whenever selected log analysis changes
  useEffect(() => {
    if (analysis) {
      setEditablePatch(analysis.patchCode || '');
      setEditableConfig(analysis.affectedConfig || 'server.conf');
      setEditableStanza(analysis.targetStanza || '[general]');
      setEditableCliCommand(analysis.cliDiagnosisCommand || '$SPLUNK_HOME/bin/splunk btool check');
      setToolResult(null);
      setAppliedSuccessfully(false);
      setIsManualEdit(false);
    }
  }, [analysis]);

  if (!analysis) return null;

  const targetConfigFile = editableConfig || analysis.affectedConfig || 'server.conf';

  // Apply the current (edited or recommended) patch to server config
  const handleApply = async () => {
    if (!editablePatch.trim() || !targetConfigFile) return;
    setIsApplying(true);
    try {
      const ok = await onApplyFix(targetConfigFile, editablePatch, targetEnv);
      if (ok) {
        setAppliedSuccessfully(true);
      }
    } catch (err) {
      console.error('Error applying config fix:', err);
    } finally {
      setIsApplying(false);
    }
  };

  // Run the diagnostic/remediation tool on the server and capture live output
  const handleExecuteTool = async () => {
    if (!editableCliCommand.trim()) return;
    setIsExecutingTool(true);
    try {
      const res = await fetch('/api/system/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: editableCliCommand.trim(),
          cwd: '/opt/splunk',
          toolId: 'live_log_tool',
          toolNameFa: 'ابزار رفع خطای لاگ',
          toolNameEn: 'Log Remediation Tool'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToolResult({
          command: editableCliCommand.trim(),
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
          time: new Date().toLocaleTimeString()
        });
      } else {
        const errData = await res.json().catch(() => ({ error: 'Failed to execute command.' }));
        setToolResult({
          command: editableCliCommand.trim(),
          stdout: '',
          stderr: errData.error || 'خطا در برقراری ارتباط با سرویس اجرای دستورات.',
          exitCode: 1,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      setToolResult({
        command: editableCliCommand.trim(),
        stdout: '',
        stderr: err?.message || 'خطای شبکه در ارسال درخواست به سرور.',
        exitCode: 1,
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleTakeBackup = () => {
    if (onBackupFile && targetConfigFile) {
      onBackupFile(targetConfigFile);
      setBackupTaken(true);
      setTimeout(() => setBackupTaken(false), 3000);
    }
  };

  const handleRestoreBackup = () => {
    if (onRestoreFile && targetConfigFile) {
      onRestoreFile(targetConfigFile);
      setRestoredSuccessfully(true);
      setAppliedSuccessfully(false);
      setTimeout(() => setRestoredSuccessfully(false), 3000);
    }
  };

  const handleCopyPatch = () => {
    if (editablePatch) {
      navigator.clipboard.writeText(editablePatch);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  const handleResetToDefault = () => {
    if (analysis.patchCode) {
      setEditablePatch(analysis.patchCode);
      setEditableConfig(analysis.affectedConfig || 'server.conf');
      setEditableStanza(analysis.targetStanza || '[general]');
      setIsManualEdit(false);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'FATAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'WARN':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  const knownConfigFiles = [
    'outputs.conf',
    'inputs.conf',
    'server.conf',
    'indexes.conf',
    'props.conf',
    'limits.conf',
    'web.conf',
    'distsearch.conf'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0e141e] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh]"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  {isFa ? 'تفسیر فنی، ریشه‌یابی و راهکار مهندسی لاگ اسپلانک' : 'Splunk Log Diagnostic & Remediation'}
                </h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${getSeverityBadge(analysis.logLevel || analysis.level || 'INFO')}`}>
                  {analysis.logLevel || analysis.level || 'INFO'}
                </span>
                <span className="text-[10px] bg-sky-950/70 text-sky-300 border border-sky-700/50 px-2 py-0.5 rounded-md font-mono font-semibold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{isFa ? 'منطبق بر مستندات رسمی Splunk Docs' : 'Splunk Docs Verified'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa ? 'زیرسیستم:' : 'Subsystem:'} <span className="font-mono text-emerald-300 font-semibold">{analysis.component}</span> • {isFa ? 'زمان رخداد:' : 'Timestamp:'} <span className="font-mono text-slate-300">{analysis.timestamp}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-300 flex-1">
          {/* Raw Log Banner with Extracted Entities */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block flex items-center justify-between">
              <span>{isFa ? 'خط خام رویداد ثبت شده در دیمن (splunkd.log):' : 'Raw Log Event from Daemon:'}</span>
              <span className="font-mono text-[10px] text-slate-500">{analysis.subsystemCategory || `component: ${analysis.component}`}</span>
            </span>
            <div className="bg-[#070a0f] p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 break-all leading-relaxed dir-ltr select-all">
              {analysis.rawLine}
            </div>

            {/* Extracted Technical Entities */}
            {analysis.technicalMetrics && analysis.technicalMetrics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.technicalMetrics.map((m, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    <span className="text-slate-500 font-sans">{m.label}:</span>
                    <span className="text-emerald-400 font-semibold">{m.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 1: Detailed Meaning & Operational Impact (100% Persian) */}
          <div className="bg-slate-800/40 border border-slate-700/70 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
              <Info className="w-4 h-4" />
              <span>{isFa ? 'مفهوم فنی و تشریح عملکرد این رویداد در اسپلانک:' : 'Official Splunk Architectural Interpretation:'}</span>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">
              {analysis.meaningFa}
            </p>
            {!isFa && analysis.meaningEn && (
              <p className="text-[11px] text-slate-400 font-sans dir-ltr pt-1 border-t border-slate-700/40">
                {analysis.meaningEn}
              </p>
            )}
          </div>

          {/* Section 2: Deep Explanation of Why This Error Occurred (چرا این خطا رخ داده است) */}
          <div className={`${analysis.logLevel === 'INFO' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'} border p-4 rounded-xl space-y-2`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              {analysis.logLevel === 'INFO' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {analysis.logLevel === 'INFO' 
                  ? (isFa ? 'وضعیت پایش سیستمی و سلامت سرویس:' : 'System Operating Status:')
                  : (isFa ? 'چرا این خطا رخ داده است؟ (علل فنی و ریشه‌ای):' : 'Why Did This Error Occur? (Root Cause Analysis):')}
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">
              {analysis.whyOccurredFa || analysis.rootCauseFa}
            </p>
          </div>

          {/* Section 3: Operational Impact Assessment */}
          {analysis.impactAssessmentFa && (
            <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>{isFa ? 'ارزیابی ریسک عملیاتی و اثر بر سرویس و امنیت (Operational Impact):' : 'Operational Impact Assessment:'}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {analysis.impactAssessmentFa}
              </p>
            </div>
          )}

          {/* Section 4: Recommended Remediation Overview */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Wrench className="w-4 h-4" />
                <span>{isFa ? 'بهترین راهکار مهندسی پیشنهادی جهت رفع دائمی مشکل (SVA Remediation):' : 'Recommended SVA Remediation:'}</span>
              </div>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">
              {analysis.recommendedFixFa || analysis.remediationFa}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* Section 5: EDITABLE CONFIGURATION PATCH BOX (قابلیت ویرایش و تنظیم مستقیم) */}
          {/* ========================================================================= */}
          <div className="bg-[#0b1019] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            {/* Box Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <span>{isFa ? 'پیکربندی اصلاحی پیشنهادی (قابل تنظیم و ویرایش مستقیم توسط شما):' : 'Interactive Configuration Patch:'}</span>
                    {isManualEdit ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                        {isFa ? 'ویرایش دستی شما ✓' : 'Customized'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                        {isFa ? 'پیشنهاد اولیه سیستم' : 'Recommended'}
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? 'می‌توانید مقادیر پارامترها، آی‌پی‌ها یا استنزا را مستقیماً در کادر زیر ویرایش کنید.' : 'You can freely edit or tune parameters before applying.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* File Selector Dropdown */}
                <div className="flex items-center gap-1.5 bg-black/40 border border-slate-700 px-2 py-1 rounded-lg text-xs font-mono text-emerald-400">
                  <span className="text-slate-400 font-sans text-[11px]">{isFa ? 'فایل مقصد:' : 'Target:'}</span>
                  <select
                    value={editableConfig}
                    onChange={(e) => {
                      setEditableConfig(e.target.value);
                      setIsManualEdit(true);
                    }}
                    className="bg-transparent text-emerald-300 outline-none cursor-pointer text-xs font-mono"
                  >
                    {knownConfigFiles.map(cf => (
                      <option key={cf} value={cf} className="bg-[#121824] text-white">
                        {cf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset to Recommended Snippet */}
                <button
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] flex items-center gap-1 transition"
                  title={isFa ? 'بازنشانی به کد پیشنهادی اولیه برنامه' : 'Reset to default suggested snippet'}
                >
                  <RotateCw className="w-3 h-3 text-slate-400" />
                  <span>{isFa ? 'بازنشانی' : 'Reset'}</span>
                </button>

                {/* Copy Button */}
                <button
                  onClick={handleCopyPatch}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] flex items-center gap-1 transition font-mono"
                >
                  {copiedPatch ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPatch ? (isFa ? 'کپی شد ✓' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* Editable Code Textarea */}
            <div className="relative">
              <textarea
                value={editablePatch}
                onChange={(e) => {
                  setEditablePatch(e.target.value);
                  setIsManualEdit(true);
                }}
                rows={5}
                placeholder={isFa ? 'کد استنزای کانفیگ مورد نظر را اینجا وارد کنید...' : 'Enter configuration stanza code here...'}
                className="w-full bg-[#05070c] border border-slate-800 focus:border-emerald-500/60 rounded-xl p-3.5 font-mono text-xs text-emerald-300 leading-relaxed outline-none transition dir-ltr select-all resize-y min-h-[110px]"
              />
            </div>

            {/* Action 1: Apply this config directly button */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isFa ? `هدف: اعمال در فایل ${editableConfig} روی سرور انتخاب‌شده` : `Will apply to ${editableConfig}`}</span>
              </div>

              <button
                onClick={handleApply}
                disabled={isApplying || appliedSuccessfully}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  appliedSuccessfully
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                }`}
              >
                {isApplying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isFa ? `در حال اعمال در ${editableConfig}...` : `Writing ${editableConfig}...`}</span>
                  </>
                ) : appliedSuccessfully ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isFa ? `با موفقیت در ${editableConfig} ذخیره شد ✓` : 'Successfully Saved ✓'}</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>{isFa ? `اعمال این کانفیگ روی فایل ${editableConfig}` : `Apply to ${editableConfig}`}</span>
                  </>
                )}
              </button>
            </div>

            {/* Post-Apply Detailed Review & Root Cause Clarification */}
            {appliedSuccessfully && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFa ? `کانفیگ با موفقیت در ${editableConfig} اعمال گردید:` : `Configuration successfully committed to ${editableConfig}:`}</span>
                </div>
                <div className="text-slate-200 text-xs leading-relaxed space-y-1.5">
                  <p className="text-emerald-200/90 font-medium">
                    {isFa 
                      ? 'تنظیمات جدید در لایه محلی ($SPLUNK_HOME/etc/system/local) ذخیره شده و توسط موتور btool در اولویت قرار گرفت.'
                      : 'Updated parameters written to local layer ($SPLUNK_HOME/etc/system/local) and will take precedence in btool.'}
                  </p>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-900/60 text-[11px] space-y-1">
                    <span className="font-bold text-amber-300 block">
                      {isFa ? '🔍 تشریح دقیق مشکل اولیه که با این اقدام برطرف شد:' : '🔍 Exact Root Cause Resolved by this Configuration:'}
                    </span>
                    <p className="text-slate-300">
                      {isFa ? (analysis.whyOccurredFa || analysis.rootCauseFa) : analysis.rootCauseEn}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* Section 6: DIAGNOSTIC TOOL & TERMINAL EXECUTION (اجرای ابزار و مشاهده خروجی) */}
          {/* ========================================================================= */}
          <div className="bg-[#0b1019] border border-sky-900/60 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Terminal className="w-4 h-4" />
                <span>{isFa ? 'اجرای ابزار تشخیصی و دستوری مورد احتیاج روی سرور (Live Tool Execution):' : 'Run Diagnostic/Remediation Tool on Server:'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isFa ? 'اجرای مستقیم در شل لینوکس سرور' : 'Direct Linux Shell Execution'}
              </span>
            </div>

            {/* Editable Command Line Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">
                {isFa ? 'دستور تشخیصی یا ابزار مورد نظر جهت اجرا (قابل تغییر و سفارشی‌سازی):' : 'Command or Diagnostic Tool to execute:'}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={editableCliCommand}
                    onChange={(e) => setEditableCliCommand(e.target.value)}
                    placeholder="e.g. ss -tulpn | grep 9997"
                    className="w-full bg-[#05070c] border border-slate-800 focus:border-sky-500/60 rounded-xl px-3.5 py-2 font-mono text-xs text-sky-300 outline-none transition dir-ltr"
                  />
                </div>
                <button
                  onClick={handleExecuteTool}
                  disabled={isExecutingTool || !editableCliCommand.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecutingTool ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{isFa ? 'در حال اجرا...' : 'Running...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isFa ? 'اجرای ابزار و مشاهده خروجی' : 'Execute Tool'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Terminal Output Console */}
            {toolResult && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isFa ? 'خروجی زنده خط فرمان سرور:' : 'Live Command Output:'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{toolResult.time}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      toolResult.exitCode === 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {toolResult.exitCode === 0 
                        ? (isFa ? 'کد بازگشت: 0 ✓ موفق' : 'Exit Code: 0 (Success)') 
                        : (isFa ? `کد بازگشت: ${toolResult.exitCode} ✗ خطا` : `Exit Code: ${toolResult.exitCode}`)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#05070c] border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-200 dir-ltr max-h-56 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                  <div className="text-slate-500 mb-1">$ {toolResult.command}</div>
                  {toolResult.stdout && <div>{toolResult.stdout}</div>}
                  {toolResult.stderr && <div className="text-rose-400 pt-1">{toolResult.stderr}</div>}
                  {!toolResult.stdout && !toolResult.stderr && (
                    <div className="text-slate-500 italic">{isFa ? '(دستور بدون خروجی متنی با موفقیت پایان یافت)' : '(Command completed with no stdout output)'}</div>
                  )}
                </div>

                {/* Post-Action Deep Status Review & Problem Clarification (دوباره بگه که دقیق مشکل چیه) */}
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isFa ? 'نتیجه اجرای ابزار و ریشه‌یابی مجدد رویداد:' : 'Post-Execution Diagnostic Review & Re-evaluation:'}</span>
                  </div>
                  <div className="text-slate-200 text-xs leading-relaxed space-y-1">
                    <p>
                      {toolResult.exitCode === 0
                        ? (isFa 
                            ? `دستور با موفقیت در سرور اجرا شد. بر اساس خروجی دریافت شده: ${analysis.recheckSummaryFa || 'وضعیت زیرسیستم تست شد و تنظیمات مربوطه فعال هستند.'}`
                            : 'Command executed successfully. Subsystem parameters checked.')
                        : (isFa 
                            ? `اجرای دستور با کد خطای ${toolResult.exitCode} پایان یافت که نشان‌دهنده عدم دسترسی، مسدود بودن سوکت یا عدم وجود فایل در مسیر مشخص‌شده است.` 
                            : 'Command exited with an error.')}
                    </p>
                    <p className="pt-1 text-[11px] text-amber-200/90 font-medium border-t border-white/[0.06]">
                      {isFa 
                        ? `دلیل دقیق مشکل اولیه: ${analysis.whyOccurredFa || analysis.rootCauseFa}` 
                        : `Exact Root Cause: ${analysis.rootCauseEn}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Target Environment Selector Box */}
          <div className="bg-[#0c121c] border border-amber-500/30 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {isFa ? 'سرور مقصد جهت اعمال تغییرات لاگ را انتخاب کنید:' : 'Select Target Environment for Log Remediation:'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {targetEnv === 'parallel' ? (isFa ? 'محیط موازی' : 'Parallel') : targetEnv === 'both' ? (isFa ? 'هردو محیط' : 'Both') : (isFa ? 'سرور اصلی' : 'Production')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetEnv('production')}
                className={`p-2.5 rounded-xl border text-start transition flex items-center justify-between ${
                  targetEnv === 'production'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-rose-400" />
                  <div>
                    <div className="text-xs font-bold">{isFa ? 'سرور اصلی' : 'Production'}</div>
                    <div className="text-[10px] text-slate-400">{isFa ? 'اعمال روی سرور لایو' : 'Live cluster'}</div>
                  </div>
                </div>
                {targetEnv === 'production' && <Check className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              <button
                type="button"
                onClick={() => setTargetEnv('parallel')}
                className={`p-2.5 rounded-xl border text-start transition flex items-center justify-between ${
                  targetEnv === 'parallel'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Split className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <span>{isFa ? 'سرور موازی' : 'Parallel'}</span>
                      <span className="text-[8px] bg-emerald-500/20 px-1 rounded text-emerald-300 font-bold">{isFa ? 'امن' : 'SAFE'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{isFa ? 'تست ایزوله بدون قطعی' : 'Isolated staging'}</div>
                  </div>
                </div>
                {targetEnv === 'parallel' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setTargetEnv('both')}
                className={`p-2.5 rounded-xl border text-start transition flex items-center justify-between ${
                  targetEnv === 'both'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">{isFa ? 'هر دو سرور' : 'Both Servers'}</div>
                    <div className="text-[10px] text-slate-400">{isFa ? 'همگام‌سازی دوطرفه' : 'Dual sync'}</div>
                  </div>
                </div>
                {targetEnv === 'both' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Offline & Online Doc References */}
          {analysis.docReference && (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>{isFa ? 'مستندات رسمی مرتبط در پایگاه دانش اسپلانک:' : 'Official Splunk Documentation:'}</span>
              </div>
              <a
                href={analysis.docReference}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors underline"
              >
                <span>docs.splunk.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer with Backup, Apply, and Restore Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#121824] flex flex-wrap items-center justify-between gap-3">
          {/* Left Actions: Close & Restore Backup */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {isFa ? 'بستن پنجره' : 'Close'}
            </button>

            {/* Restore Backup Button */}
            {(hasFileBackup || appliedSuccessfully) && (
              <button
                onClick={handleRestoreBackup}
                className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title={isFa ? 'بازگردانی فایل کانفیگ به نسخه پشتیبان قبلی' : 'Restore config file to previous backup snapshot'}
              >
                {restoredSuccessfully ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> : <RotateCcw className="w-3.5 h-3.5 text-purple-400" />}
                <span>{restoredSuccessfully ? (isFa ? 'بازگردانده شد ✓' : 'Restored ✓') : (isFa ? 'بازگردانی پشتیبان' : 'Restore Backup')}</span>
              </button>
            )}
          </div>

          {/* Right Actions: Backup Snapshot & Apply Fix */}
          <div className="flex items-center gap-2.5">
            {/* Take Backup Button */}
            {editableConfig && onBackupFile && (
              <button
                onClick={handleTakeBackup}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title={isFa ? 'گرفتن اسنپ‌شات بک‌آپ قبل از اعمال تغییر' : 'Capture backup snapshot before applying fix'}
              >
                {backupTaken ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <Archive className="w-3.5 h-3.5 text-amber-400" />}
                <span>{backupTaken ? (isFa ? 'بک‌آپ ذخیره شد ✓' : 'Backup Captured ✓') : (isFa ? 'پشتیبان‌گیری' : 'Take Backup')}</span>
              </button>
            )}

            {/* Apply Fix Button */}
            <button
              onClick={handleApply}
              disabled={isApplying || appliedSuccessfully}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                appliedSuccessfully 
                  ? 'bg-emerald-600 text-white cursor-default shadow-emerald-900/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isApplying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isFa ? `در حال اعمال در ${editableConfig}...` : `Applying to ${editableConfig}...`}</span>
                </>
              ) : appliedSuccessfully ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isFa 
                      ? `روی ${targetEnv === 'parallel' ? 'سرور موازی' : targetEnv === 'both' ? 'هر دو سرور' : 'سرور اصلی'} اعمال شد ✓` 
                      : `Applied to ${targetEnv}!`}
                  </span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>
                    {isFa 
                      ? `اعمال مستقیم کانفیگ روی ${targetEnv === 'parallel' ? 'سرور موازی (Staging)' : targetEnv === 'both' ? 'هر دو سرور' : 'سرور اصلی'}` 
                      : `Apply to ${targetEnv === 'parallel' ? 'Parallel Staging' : targetEnv === 'both' ? 'Both' : 'Production'}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
