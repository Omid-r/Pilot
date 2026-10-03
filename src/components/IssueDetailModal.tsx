import React, { useState, useMemo } from 'react';
import { SplunkFinding, RemediationOption, TargetEnvironment, ParallelClusterState } from '../types';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Cpu, 
  Terminal, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  HardDrive, 
  RotateCcw, 
  Save, 
  Sparkles,
  FileCode, 
  Copy,
  Server,
  Split,
  Layers,
  ArrowRightLeft,
  Code2,
  Play,
  Wrench,
  Sliders
} from 'lucide-react';
import { resolveFindingPaths, resolveSplunkPaths } from '../utils/splunkPathResolver';
import { LinearSlideToApplyDiff } from './LinearSlideToApplyDiff';

interface IssueDetailModalProps {
  finding: SplunkFinding;
  onClose: () => void;
  onApplyOption: (option: RemediationOption, targetEnv: TargetEnvironment, findingId?: string) => void;
  hasFileBackup: boolean;
  onBackupFile: (filename: string) => void;
  onRestoreFile: (filename: string) => void;
  onJumpToEditor: (filename: string) => void;
  lang: 'fa' | 'en';
  parallelClusterState?: ParallelClusterState;
  defaultTargetEnv?: TargetEnvironment;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  finding: rawFinding,
  onClose,
  onApplyOption,
  hasFileBackup,
  onBackupFile,
  onRestoreFile,
  onJumpToEditor,
  lang,
  parallelClusterState,
  defaultTargetEnv = 'production'
}) => {
  const isFa = lang === 'fa';
  
  // Resolve all variable paths ($splunkdirectory, $SPLUNK_HOME, etc.) to real Linux paths
  const finding = useMemo(() => resolveFindingPaths(rawFinding), [rawFinding]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    finding.options[0]?.id || ''
  );
  const [targetEnv, setTargetEnv] = useState<TargetEnvironment>(defaultTargetEnv || 'production');
  const [appliedOptionId, setAppliedOptionId] = useState<string | null>(null);
  const [appliedTargetEnvText, setAppliedTargetEnvText] = useState<string>('');

  const selectedOption = finding.options.find(o => o.id === selectedOptionId) || finding.options[0];

  // Editable configuration patch state
  const [isCustomEdit, setIsCustomEdit] = useState<boolean>(false);
  const [customPatchCode, setCustomPatchCode] = useState<string>(() => {
    return selectedOption?.replacementConfigSnippet || selectedOption?.diffSnippet?.replace(/^[+-]\s*/gm, '') || '';
  });

  // CLI execution state
  const [cliCommandToRun, setCliCommandToRun] = useState<string>(() => {
    return selectedOption?.cliCommand || finding.splQuery || 'splunk btool check';
  });
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [toolResult, setToolResult] = useState<{
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    time: string;
  } | null>(null);

  // Sync state whenever selected option changes
  React.useEffect(() => {
    if (selectedOption) {
      setCustomPatchCode(selectedOption.replacementConfigSnippet || selectedOption.diffSnippet.replace(/^[+-]\s*/gm, ''));
      setCliCommandToRun(selectedOption.cliCommand || finding.splQuery || 'splunk btool check');
      setToolResult(null);
    }
  }, [selectedOptionId]);

  const handleExecuteTool = async () => {
    if (!cliCommandToRun.trim()) return;
    setIsExecutingTool(true);
    try {
      const res = await fetch('/api/system/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cliCommandToRun.trim(),
          cwd: '/opt/splunk',
          toolId: 'finding_diagnostic_tool',
          toolNameFa: 'ابزار تشخیصی خطای کانفیگ',
          toolNameEn: 'Config Finding Diagnostic Tool'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToolResult({
          command: cliCommandToRun.trim(),
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
          time: new Date().toLocaleTimeString()
        });
      } else {
        const err = await res.json().catch(() => ({ error: 'Error running tool' }));
        setToolResult({
          command: cliCommandToRun.trim(),
          stdout: '',
          stderr: err.error || 'خطا در اجرای ابزار در سرور.',
          exitCode: 1,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      setToolResult({
        command: cliCommandToRun.trim(),
        stdout: '',
        stderr: err?.message || 'خطای شبکه در برقراری ارتباط با سرور.',
        exitCode: 1,
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleApply = (customSnippetOverride?: string) => {
    if (selectedOption) {
      const snippetToUse = typeof customSnippetOverride === 'string' 
        ? customSnippetOverride 
        : (isCustomEdit && customPatchCode.trim() ? customPatchCode.trim() : selectedOption.replacementConfigSnippet);

      const optionToApply: RemediationOption = {
        ...selectedOption,
        replacementConfigSnippet: snippetToUse
      };

      onApplyOption(optionToApply, targetEnv, finding.id);
      setAppliedOptionId(selectedOption.id);
      const envLabel = targetEnv === 'parallel' 
        ? (isFa ? 'سرور موازی' : 'Parallel Staging')
        : targetEnv === 'both' 
          ? (isFa ? 'هر دو سرور' : 'Both Servers')
          : (isFa ? 'سرور اصلی' : 'Production Server');
      setAppliedTargetEnvText(envLabel);
      setTimeout(() => {
        setAppliedOptionId(null);
        setAppliedTargetEnvText('');
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-[#101620] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#151c28] border-b border-slate-800 p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl ${
              finding.severity === 'critical' 
                ? 'bg-rose-950/80 border border-rose-600/50 text-rose-400' 
                : 'bg-amber-950/80 border border-amber-600/50 text-amber-400'
            }`}>
              {finding.severity === 'critical' ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  finding.severity === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {finding.severity}
                </span>
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  {finding.file} : خط {finding.line}
                </span>
                <span className="text-xs text-slate-400">
                  {finding.categoryFa}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1.5 leading-snug">
                {isFa ? finding.titleFa : finding.titleEn}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* Section 1: Line Culprit Code Snippet */}
          <div>
            <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-400" />
                {isFa ? 'کد و تنظیم شناسایی‌شده در فایل کانفیگ:' : 'Target Culprit Line in Config:'}
              </span>
              <button 
                onClick={() => { onClose(); onJumpToEditor(finding.file); }}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>{isFa ? 'باز کردن در ادیتور' : 'Open in Editor'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-[#090d12] border border-slate-800 font-mono text-rose-300 text-xs overflow-x-auto">
              <pre>{finding.culpritCode}</pre>
            </div>
          </div>

          {/* Section 2: Senior Architect Analysis (چرا برنامه این را اشتباه تشخیص داد؟) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>
                {isFa 
                  ? 'تحلیل دقیق خط به خط مهندس ارشد اسپلانک و امنیت (Root Cause Analysis)' 
                  : 'Senior Splunk SOC Engineer Deep Root Cause Analysis'}
              </span>
            </div>

            <div>
              <div className="font-semibold text-slate-200 mb-1">
                {isFa ? '🔍 چرا این مورد خطا یا ایراد امنیتی تشخیص داده شد؟' : '🔍 Why did the engine flag this as a critical misconfiguration?'}
              </div>
              <p className="text-slate-300">
                {isFa ? finding.whyFlaggedFa : finding.whyFlaggedEn}
              </p>
            </div>

            <div>
              <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isFa ? 'عواقب و ریسک عملیاتی در SOC و کلاستر:' : 'Operational & Security Impact in SOC:'}</span>
              </div>
              <p className="text-slate-400">
                {isFa ? finding.potentialImpactFa : finding.potentialImpactEn}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <div className="text-slate-400">
                <span className="text-amber-400 font-semibold">{isFa ? 'پیشنهاد مهندس ارشد:' : 'Senior Architect Advice:'} </span>
                {isFa ? finding.seniorRecommendationFa : finding.seniorRecommendationEn}
              </div>
              <a
                href={finding.docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 whitespace-nowrap ml-3"
              >
                <span>{isFa ? 'مستندات رسمی اسپلانک' : 'Official Splunk Doc'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Section 2.5: Official Splunk Search Processing Language (SPL) Query */}
          {finding.splQuery && (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>
                    {isFa 
                      ? 'کوئری رسمی SPL اسپلانک جهت شناسایی و ردیابی این خطا در کنسول مرکزی:' 
                      : 'Official Splunk Search Processing Language (SPL) Query:'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(finding.splQuery || '');
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1 transition"
                  title="Copy SPL Query"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isFa ? 'کپی کوئری SPL' : 'Copy SPL'}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-[#06090e] border border-slate-800 font-mono text-xs text-emerald-400 dir-ltr overflow-x-auto whitespace-pre leading-relaxed select-all">
                {finding.splQuery}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-300 block mb-0.5">
                    {isFa ? '💡 توضیح عملکرد کوئری:' : '💡 SPL Explanation:'}
                  </span>
                  <p className="text-slate-400">
                    {isFa ? finding.splExplanationFa : finding.splExplanationEn}
                  </p>
                </div>
                {finding.splSearchTipFa && (
                  <div>
                    <span className="font-semibold text-amber-400 block mb-0.5">
                      {isFa ? '⚡ نکته حرفه‌ای مهندس اسپلانک:' : '⚡ SOC Pro Search Tip:'}
                    </span>
                    <p className="text-slate-400">
                      {isFa ? finding.splSearchTipFa : finding.splSearchTipEn}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Multi-Option Interactive Fixes (راه حل های چند گزینه ای - 4 راهکار) */}
          <div>
            <div className="text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  {isFa ? '۴ راهکار عملیاتی و استاندارد اسپلانک (یکی را انتخاب کرده و دکمه اعمال را بزنید):' : '4 Concrete Splunk Remediation Strategies (Select one to apply):'}
                </span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {finding.options.length} {isFa ? 'راهبرد موجود' : 'Strategies Available'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {finding.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const getBadge = () => {
                  switch (opt.type) {
                    case 'best_practice':
                      return { text: isFa ? 'روش توصیه رسمی (Best Practice)' : 'Best Practice', class: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
                    case 'quick_workaround':
                      return { text: isFa ? 'راهکار سریع (Quick Workaround)' : 'Quick Workaround', class: 'bg-amber-950 text-amber-300 border-amber-800' };
                    case 'high_throughput':
                      return { text: isFa ? 'معماری و لود بالانس پیشرفته' : 'High Throughput', class: 'bg-sky-950 text-sky-300 border-sky-800' };
                    case 'cli_automation':
                      return { text: isFa ? 'اتوماسیون ترمینال / CLI' : 'CLI Command', class: 'bg-purple-950 text-purple-300 border-purple-800' };
                    default:
                      return { text: 'Workaround', class: 'bg-slate-800 text-slate-300 border-slate-700' };
                  }
                };
                const badge = getBadge();

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all text-start relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.class}`}>
                          {badge.text}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="font-bold text-slate-200 text-xs mb-1">
                        {isFa ? opt.titleFa : opt.titleEn}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isFa ? opt.descriptionFa : opt.descriptionEn}
                      </p>
                    </div>

                    {opt.cliCommand && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-mono block mb-1">CLI Command:</span>
                        <code className="text-[10px] font-mono text-purple-300 block bg-slate-950 p-1.5 rounded dir-ltr overflow-x-auto">
                          {opt.cliCommand}
                        </code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Option Linear Slider Diff & Direct Server Merge */}
            {selectedOption && (
              <div className="p-4 rounded-2xl bg-[#090e17] border border-slate-700/80 shadow-2xl">
                <LinearSlideToApplyDiff
                  currentConfigCode={finding.culpritCode}
                  proposedConfigCode={
                    selectedOption.replacementConfigSnippet || 
                    selectedOption.diffSnippet.replace(/^[+-]\s*/gm, '')
                  }
                  fileName={selectedOption.targetFile || finding.file}
                  stanzaName={selectedOption.targetStanza}
                  onApply={(appliedCode) => {
                    handleApply(appliedCode);
                  }}
                  isApplied={appliedOptionId === selectedOption.id}
                  lang={lang}
                />
              </div>
            )}

            {/* Live Terminal & Diagnostic Tool Execution Section */}
            <div className="p-4 rounded-xl bg-[#090d14] border border-sky-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>{isFa ? 'اجرای ابزار تشخیصی یا تست ترمینال روی سرور (CLI Tool Execution):' : 'Run Diagnostic/CLI Tool on Server:'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isFa ? 'شل لینوکس سرور اسپلانک' : 'Splunk Linux Shell'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={cliCommandToRun}
                    onChange={(e) => setCliCommandToRun(e.target.value)}
                    placeholder="e.g. splunk btool check or ss -tulpn"
                    className="w-full bg-[#05070c] border border-slate-800 focus:border-sky-500/60 rounded-xl px-3.5 py-2 font-mono text-xs text-sky-300 outline-none transition dir-ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExecuteTool}
                  disabled={isExecutingTool || !cliCommandToRun.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
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

              {toolResult && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isFa ? 'خروجی زنده خط فرمان سرور:' : 'Live Command Output:'}</span>
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      toolResult.exitCode === 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {toolResult.exitCode === 0 
                        ? (isFa ? 'کد خروجی: 0 (موفق)' : 'Exit Code: 0 (Success)') 
                        : (isFa ? `کد خروجی: ${toolResult.exitCode} (خطا)` : `Exit Code: ${toolResult.exitCode}`)}
                    </span>
                  </div>

                  <div className="bg-[#05070c] border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-200 dir-ltr max-h-48 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                    <div className="text-slate-500 mb-1">$ {toolResult.command}</div>
                    {toolResult.stdout && <div>{toolResult.stdout}</div>}
                    {toolResult.stderr && <div className="text-rose-400 pt-1">{toolResult.stderr}</div>}
                    {!toolResult.stdout && !toolResult.stderr && (
                      <div className="text-slate-500 italic">{isFa ? '(دستور بدون خروجی متنی با موفقیت پایان یافت)' : '(No stdout output)'}</div>
                    )}
                  </div>

                  {/* Post-execution Problem Clarification */}
                  <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{isFa ? 'ریشه‌یابی مجدد رویداد و بررسی وضعیت:' : 'Post-Execution Diagnostic Review:'}</span>
                    </div>
                    <div className="text-slate-200 text-xs leading-relaxed space-y-1">
                      <p>
                        {isFa 
                          ? `دلیل دقیق خطا: ${finding.whyFlaggedFa}` 
                          : `Root Cause: ${finding.whyFlaggedEn}`}
                      </p>
                      <p className="pt-1 text-[11px] text-amber-200/90 font-medium border-t border-white/[0.06]">
                        {isFa 
                          ? `پیشنهاد مهندس ارشد: ${finding.seniorRecommendationFa}` 
                          : `Recommendation: ${finding.seniorRecommendationEn}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Target Environment Selection for Remediation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#121926] to-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {isFa ? 'سرور مقصد جهت اعمال عیب‌یابی و تغییر کانفیگ را انتخاب کنید:' : 'Select Target Environment for Remediation:'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {targetEnv === 'parallel' 
                  ? (isFa ? 'محیط موازی (Staging)' : 'Parallel Staging')
                  : targetEnv === 'both' 
                    ? (isFa ? 'هردو محیط' : 'Dual Environments')
                    : (isFa ? 'سرور اصلی (Production)' : 'Production Server')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Option 1: Production Server */}
              <button
                type="button"
                onClick={() => setTargetEnv('production')}
                className={`p-3 rounded-xl border text-start transition flex flex-col justify-between gap-1.5 ${
                  targetEnv === 'production'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Server className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isFa ? 'سرور اصلی (Production)' : 'Main Server'}</span>
                  </div>
                  {targetEnv === 'production' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {isFa ? 'اعمال مستقیم روی سرور اصلی و کانفیگ‌های عملیاتی' : 'Directly patch the live production cluster'}
                </div>
              </button>

              {/* Option 2: Parallel Staging Server */}
              <button
                type="button"
                onClick={() => setTargetEnv('parallel')}
                className={`p-3 rounded-xl border text-start transition flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                  targetEnv === 'parallel'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                    <Split className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFa ? 'سرور موازی (Staging)' : 'Parallel Staging'}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {isFa ? 'ایزوله' : 'ISOLATED'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {isFa ? 'اعمال روی سرور موازی و پورت‌های مجزا جهت تست بدون قطعی' : 'Safe isolated test on parallel instance on non-colliding ports'}
                </div>
              </button>

              {/* Option 3: Virtual Cloud Server */}
              <button
                type="button"
                onClick={() => setTargetEnv('virtual')}
                className={`p-3 rounded-xl border text-start transition flex flex-col justify-between gap-1.5 ${
                  targetEnv === 'virtual'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isFa ? 'سرور مجازی (Virtual)' : 'Virtual Server'}</span>
                  </div>
                  {targetEnv === 'virtual' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {isFa ? 'اعمال روی محیط سرور مجازی داکر و سندباکس ابری' : 'Apply to docker virtual server sandbox environment'}
                </div>
              </button>

              {/* Option 4: Both / Dual-Apply */}
              <button
                type="button"
                onClick={() => setTargetEnv('both')}
                className={`p-3 rounded-xl border text-start transition flex flex-col justify-between gap-1.5 ${
                  targetEnv === 'both'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isFa ? 'همگام‌سازی (Dual)' : 'Both (Dual)'}</span>
                  </div>
                  {targetEnv === 'both' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {isFa ? 'اعمال و همگام‌سازی همزمان روی سرور اصلی و سرور موازی' : 'Apply & sync across both production and staging instances'}
                </div>
              </button>
            </div>
          </div>

          {/* Section 5: File Backup Status & Restore Controls */}
          <div className="p-4 rounded-xl bg-[#141b26] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                hasFileBackup ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-200 text-xs">
                  {isFa ? `وضعیت بک‌آپ فایل ${finding.file}:` : `Backup Status for ${finding.file}:`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {hasFileBackup 
                    ? (isFa ? 'یک نسخه پشتیبان معتبر و آماده بازگردانی برای این فایل موجود است.' : 'A verified snapshot exists and is ready for rollback.')
                    : (isFa ? 'هشدار: هنوز از این فایل نسخه پشتیبان مجزا ذخیره نشده است.' : 'Warning: No dedicated snapshot stored for this file yet.')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onBackupFile(finding.file)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'گرفتن بک‌آپ از این فایل' : 'Backup This File'}</span>
              </button>

              <button
                onClick={() => onRestoreFile(finding.file)}
                disabled={!hasFileBackup}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  hasFileBackup 
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer' 
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? 'بازگردانی این فایل به حالت اول' : 'Restore This File'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Primary Apply Button */}
        <div className="bg-[#151c28] border-t border-slate-800 p-4 px-6 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {isFa 
              ? `تغییرات بر روی [${targetEnv === 'parallel' ? 'سرور موازی' : targetEnv === 'both' ? 'هر دو سرور' : 'سرور اصلی'}] ذخیره خواهد شد.`
              : `Changes will be patched into [${targetEnv}].`}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>

            <button
              onClick={() => handleApply()}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                appliedOptionId
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : targetEnv === 'parallel'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : targetEnv === 'both'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {appliedOptionId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isFa ? `روی ${appliedTargetEnvText} اعمال شد ✓` : `Applied to ${appliedTargetEnvText}! ✓`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isFa 
                      ? `اعمال راهکار بر روی ${targetEnv === 'parallel' ? 'سرور موازی (Staging)' : targetEnv === 'both' ? 'هر دو سرور' : 'سرور اصلی (Live)'}`
                      : `Apply Fix to ${targetEnv === 'parallel' ? 'Parallel Staging' : targetEnv === 'both' ? 'Both Servers' : 'Main Production'}`}
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
