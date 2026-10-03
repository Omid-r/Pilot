import React, { useState } from 'react';
import { 
  DocComplianceReport, 
  auditSplunkConfigurationsAgainstDocs, 
  SPLUNK_CONFIG_DOCS,
  generateOfflineMarkdownManual,
  generateOfflineHtmlHandbook,
  generateHardeningBashScript
} from '../data/splunkDocs';
import { DocComplianceIssue, SplunkDocItem, TargetEnvironment, ParallelClusterState } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Wrench, 
  Check, 
  Copy, 
  Layers, 
  Search,
  Filter,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Server,
  Split,
  ArrowRightLeft,
  Download,
  FileJson,
  Terminal,
  WifiOff,
  Sparkles
} from 'lucide-react';

interface DocCompliancePanelProps {
  configs: Record<string, string>;
  onApplyPatch: (configName: string, patch: string, targetEnv?: TargetEnvironment) => Promise<boolean>;
  parallelClusterState?: ParallelClusterState;
  defaultTargetEnv?: TargetEnvironment;
}

export const DocCompliancePanel: React.FC<DocCompliancePanelProps> = ({
  configs,
  onApplyPatch,
  parallelClusterState,
  defaultTargetEnv = 'production'
}) => {
  const [report, setReport] = useState<DocComplianceReport>(() => 
    auditSplunkConfigurationsAgainstDocs(configs)
  );
  const [targetEnv, setTargetEnv] = useState<TargetEnvironment>(
    parallelClusterState?.isInstalled ? 'parallel' : defaultTargetEnv
  );
  const [activeTab, setActiveTab] = useState<'audit' | 'docs'>('audit');
  const [isAuditing, setIsAuditing] = useState(false);
  const [applyingIssueId, setApplyingIssueId] = useState<string | null>(null);
  const [appliedIssues, setAppliedIssues] = useState<Set<string>>(new Set());
  const [applyingDocId, setApplyingDocId] = useState<string | null>(null);
  const [appliedDocIds, setAppliedDocIds] = useState<Set<string>>(new Set());
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [selectedConfFilter, setSelectedConfFilter] = useState<string>('all');
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const newReport = auditSplunkConfigurationsAgainstDocs(configs);
      setReport(newReport);
      setIsAuditing(false);
    }, 600);
  };

  const handleApplyIssuePatch = async (issue: DocComplianceIssue) => {
    if (!issue.patchSnippet || !issue.confFile) return;
    setApplyingIssueId(issue.id);
    try {
      const ok = await onApplyPatch(issue.confFile, issue.patchSnippet, targetEnv);
      if (ok) {
        setAppliedIssues(prev => new Set(prev).add(issue.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingIssueId(null);
    }
  };

  const handleApplyDocItem = async (doc: SplunkDocItem) => {
    const targetConf = doc.targetConf || (doc.confFile.includes('.conf') ? doc.confFile.split(' ')[0] : 'server.conf');
    const patchContent = doc.patchSnippet || doc.example;
    if (!targetConf || !patchContent) return;

    setApplyingDocId(doc.id);
    try {
      const ok = await onApplyPatch(targetConf, patchContent, targetEnv);
      if (ok) {
        setAppliedDocIds(prev => new Set(prev).add(doc.id));
      }
    } catch (e) {
      console.error('Error applying doc recommendation:', e);
    } finally {
      setApplyingDocId(null);
    }
  };

  const handleCopySnippet = (issueId: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIssueId(issueId);
    setTimeout(() => setCopiedIssueId(null), 2000);
  };

  const handleCopyDocExample = (docId: string, example: string) => {
    navigator.clipboard.writeText(example);
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadSuccessMessage(filename);
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(SPLUNK_CONFIG_DOCS, null, 2);
    downloadFile(jsonStr, 'splunk-complete-docs-database.json', 'application/json');
  };

  const handleDownloadMarkdown = () => {
    const md = generateOfflineMarkdownManual();
    downloadFile(md, 'splunk-enterprise-offline-manual.md', 'text/markdown;charset=utf-8');
  };

  const handleDownloadHTML = () => {
    const html = generateOfflineHtmlHandbook();
    downloadFile(html, 'splunk-docs-offline-handbook.html', 'text/html;charset=utf-8');
  };

  const handleDownloadBashScript = () => {
    const sh = generateHardeningBashScript();
    downloadFile(sh, 'splunk-hardening-baseline.sh', 'text/x-sh;charset=utf-8');
  };

  const filteredDocs = SPLUNK_CONFIG_DOCS.filter(doc => {
    const term = searchDocQuery.toLowerCase();
    const matchesSearch = !searchDocQuery || 
      doc.confFile.toLowerCase().includes(term) ||
      doc.stanza.toLowerCase().includes(term) ||
      doc.parameter.toLowerCase().includes(term) ||
      doc.descriptionFa.toLowerCase().includes(term) ||
      doc.descriptionEn.toLowerCase().includes(term) ||
      doc.bestPracticeFa.toLowerCase().includes(term) ||
      doc.securityImpactFa.toLowerCase().includes(term) ||
      doc.example.toLowerCase().includes(term);

    const matchesConf = selectedConfFilter === 'all' || 
      doc.confFile.toLowerCase().includes(selectedConfFilter.toLowerCase());

    return matchesSearch && matchesConf;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Control - Sirene Dark Luxury */}
      <div className="sirene-card bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-violet-500/15 border border-violet-500/30 rounded-2xl text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">انطباق‌سنجی جامع کانفیگ‌ها و معماری با داکیومنت رسمی اسپلانک</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  مقایسه هوشمند تنظیمات جاری سرور با استانداردهای رسمی Splunk Enterprise Hardening و معماری SVA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            <div className="flex bg-[#07090e] p-1 rounded-full border border-white/[0.08] text-xs shadow-inner">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'audit' 
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>گزارش ارزیابی معماری و کانفیگ</span>
                {report.issues.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === 'audit' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {report.issues.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'docs' 
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>بانک داکیومنت رسمی اسپلانک ({SPLUNK_CONFIG_DOCS.length})</span>
              </button>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'در حال پویش مستندات...' : 'اجرای مجدد ارزیابی انطباق'}</span>
            </button>
          </div>
        </div>

        {/* Compliance Score Ribbon */}
        {activeTab === 'audit' && (
          <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-4 relative z-10">
            {/* Target Server Environment Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#07090e] p-3.5 rounded-2xl border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-slate-200">محیط هدف جهت اجرای انطباق و اعمال پچ‌های داکیومنت:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetEnv('production')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                    targetEnv === 'production'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-rose-400" />
                  <span>سرور اصلی (Production)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetEnv('parallel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    targetEnv === 'parallel'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Split className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سرور موازی (Staging) — امن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetEnv('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    targetEnv === 'both'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>هر دو سرور</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={report.complianceScore > 75 ? 'text-emerald-500' : report.complianceScore > 50 ? 'text-amber-500' : 'text-rose-500'}
                    strokeDasharray={`${report.complianceScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-sm text-white">{report.complianceScore}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">شاخص انطباق با داکیومنت</span>
                <span className="text-sm font-bold text-white">
                  {report.complianceScore >= 80 ? 'انطباق مطلوب' : report.complianceScore >= 50 ? 'انطباق متوسط' : 'نیازمند اصلاح فوری'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">موارد مغایرت بحرانی (Critical)</span>
              <div className="flex items-center gap-2 mt-1">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span className="text-xl font-mono font-bold text-rose-400">{report.criticalCount}</span>
                <span className="text-xs text-slate-500">مورد نقض داکیومنت</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">موارد هشدار استاندارد (Warning)</span>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xl font-mono font-bold text-amber-400">{report.warningCount}</span>
                <span className="text-xs text-slate-500">مورد بهینه‌سازی</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">کل چک‌پوینت‌های انطباق</span>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-mono font-bold text-emerald-400">{report.totalChecks}</span>
                <span className="text-xs text-slate-500">قانون داکیومنت رسمی</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Tab 1: Audit Results */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>گزارش مغایرت‌های کانفیگ و معماری با داکیومنت رسمی اسپلانک</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {report.issues.length} عدم انطباق
              </span>
            </h3>
          </div>

          {report.issues.length === 0 ? (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white">تبریک! کلیه کانفیگ‌ها و معماری منطبق با داکیومنت رسمی اسپلانک هستند.</h4>
              <p className="text-sm text-slate-400 mt-1">
                هیچ مغایرت امنیتی، نشت پورت یا انحراف معماری نسبت به اسناد Splunk Validated Architecture مشاهده نشد.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.issues.map((issue) => {
                const isApplied = appliedIssues.has(issue.id);
                const isApplying = applyingIssueId === issue.id;

                return (
                  <div 
                    key={issue.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                      issue.severity === 'critical' 
                        ? 'border-rose-500/40 hover:border-rose-500/60 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/10'
                        : 'border-amber-500/40 hover:border-amber-500/60 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          issue.severity === 'critical' 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <h4 className="text-base font-bold text-white">{issue.titleFa}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                          {issue.confFile} &gt; {issue.stanza}
                        </span>
                        <a
                          href={issue.officialDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="مطالعه در Splunk Docs"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Comparison Grid: Current vs Recommended */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-xl">
                        <span className="text-xs text-rose-400 font-semibold block mb-1">
                          مقدار فعلی در کانفیگ شما (Non-compliant):
                        </span>
                        <code className="font-mono text-xs text-rose-200 block dir-ltr whitespace-pre-wrap">
                          {issue.parameter} = {issue.currentValue}
                        </code>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-xl">
                        <span className="text-xs text-emerald-400 font-semibold block mb-1">
                          مقدار توصیه‌شده رسمی اسپلانک (Official Recommendation):
                        </span>
                        <code className="font-mono text-xs text-emerald-300 block dir-ltr whitespace-pre-wrap">
                          {issue.recommendedValue}
                        </code>
                      </div>
                    </div>

                    {/* Deep Explanation: What is Recommended vs Why Trouble Occurs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                      {/* What is recommended */}
                      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70 space-y-1">
                        <span className="text-sky-400 font-bold flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>توصیه رسمی داکیومنت اسپلانک چیست؟</span>
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {issue.recommendationFa}
                        </p>
                      </div>

                      {/* Why trouble occurs */}
                      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70 space-y-1">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>در حال حاضر چرا مشکل و ریسک به وجود می‌آید؟</span>
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {issue.whyTroubleFa}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Patch */}
                    {issue.patchSnippet && (
                      <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">پچ اصلاحی پیشنهادی:</span>
                          <button
                            onClick={() => handleCopySnippet(issue.id, issue.patchSnippet || '')}
                            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {copiedIssueId === issue.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIssueId === issue.id ? 'کپی شد' : 'کپی پچ'}
                          </button>
                        </div>

                        <button
                          onClick={() => handleApplyIssuePatch(issue)}
                          disabled={isApplying || isApplied}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                            isApplied
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                          }`}
                        >
                          {isApplying ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>در حال اعمال پچ...</span>
                            </>
                          ) : isApplied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {targetEnv === 'parallel' 
                                  ? 'روی سرور موازی اعمال و منطبق گردید ✓' 
                                  : targetEnv === 'both' 
                                    ? 'روی هر دو سرور اعمال و همگام شد ✓' 
                                    : 'روی سرور اصلی اعمال و منطبق شد ✓'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Wrench className="w-4 h-4" />
                              <span>
                                {targetEnv === 'parallel' 
                                  ? 'اعمال اصلاحیه روی سرور موازی (Staging)' 
                                  : targetEnv === 'both' 
                                    ? 'اعمال اصلاحیه روی هر دو سرور' 
                                    : 'اعمال اصلاحیه روی سرور اصلی (Production)'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Full Splunk Official Documentation Library & Download Center */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Download & Offline Hub Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-5 h-5 text-amber-400" />
                    <span>مرکز دانلود یکپارچه کل داکیومنت اسپلانک (آفلاین / Air-Gapped)</span>
                  </h3>
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    <span>۱۰۰٪ آفلاین</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  می‌توانید کل بانک مستندات را در قالب‌های Markdown، HTML مستقل، JSON یا اسکریپت امن‌سازی لینوکس دانلود کنید و در محیط‌های بسته بدون اینترنت مطالعه نمایید.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-semibold transition shadow-sm"
                  title="دانلود کل مستندات به فرمت Markdown جهت مطالعه در Obsidian یا VSCode"
                >
                  <FileText className="w-4 h-4" />
                  <span>دانلود Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHTML}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-95"
                  title="دانلود کتابچه راهنمای کامل به صورت فایل تک‌برگی HTML با قابلیت پرینت و مطالعه بدون اینترنت"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود کتابچه کامل HTML (.html)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-semibold transition shadow-sm"
                  title="دانلود دیتابیس کامل پارامترها و استنزاها به فرمت JSON"
                >
                  <FileJson className="w-4 h-4" />
                  <span>دانلود JSON دیتابیس</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBashScript}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-semibold transition shadow-sm"
                  title="دانلود اسکریپت اتوماسیون امن‌سازی و کانفیگ اسپلانک در سیستم عامل لینوکس"
                >
                  <Terminal className="w-4 h-4" />
                  <span>دانلود اسکریپت امن‌سازی (.sh)</span>
                </button>
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="جستجوی آنی در پارامترها، استنزاها، بهترین راهکارها (Best Practice) و نمونه کدها..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-16 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                />
                {searchDocQuery && (
                  <button
                    onClick={() => setSearchDocQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
                  >
                    پاک کردن
                  </button>
                )}
              </div>

              {/* Quick Filter Selection */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">فیلتر فایل:</span>
                <select
                  value={selectedConfFilter}
                  onChange={(e) => setSelectedConfFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">تمام فایل‌ها و استانداردها (همه)</option>
                  <option value="inputs">inputs.conf (دریافت و پورت‌ها)</option>
                  <option value="outputs">outputs.conf (ارسال، لودبالانس و TLS)</option>
                  <option value="server">server.conf (امن‌سازی، دیسک و کلاستر)</option>
                  <option value="indexes">indexes.conf (باکت‌ها و فضای ذخیره‌سازی)</option>
                  <option value="props">props.conf (پردازش لاگ و تایم‌استمپ)</option>
                  <option value="transforms">transforms.conf (فیلترینگ و روتینگ)</option>
                  <option value="web">web.conf (کنسول وب و SSL)</option>
                  <option value="limits">limits.conf (ظرفیت جستجوهای SOC)</option>
                  <option value="authentication">authentication.conf (احراز هویت)</option>
                </select>
              </div>
            </div>

            {/* Counter Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                نمایش <strong>{filteredDocs.length}</strong> مورد مستند شده از کل <strong>{SPLUNK_CONFIG_DOCS.length}</strong> راهنمای رسمی
              </span>
              <span className="text-amber-400 font-mono text-[11px]">
                محیط اعمال مستقیم: <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300">{targetEnv.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const isApplied = appliedDocIds.has(doc.id);
              const isApplying = applyingDocId === doc.id;

              return (
                <div 
                  key={doc.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                            {doc.confFile}
                          </span>
                          <span className="font-mono text-xs text-slate-300 dir-ltr">
                            {doc.stanza}
                          </span>
                        </div>
                        <h4 className="font-mono text-sm font-bold text-white mt-1.5 dir-ltr text-right">
                          {doc.parameter}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          پیش‌فرض: {doc.defaultValue}
                        </span>
                        <a 
                          href={doc.officialDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          <span>docs.splunk.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {doc.descriptionFa}
                    </p>

                    {/* Best Practice Box */}
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl space-y-1 text-xs">
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>بهترین راهکار مهندسی (SVA Best Practice):</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {doc.bestPracticeFa}
                      </p>
                    </div>

                    {/* Security & Stability Impact */}
                    <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl space-y-1 text-xs">
                      <div className="text-rose-400 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>اثرات امنیتی و پایداری کلاستر:</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {doc.securityImpactFa}
                      </p>
                    </div>

                    {/* Syntax Code Block */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-amber-300">نمونه کانفیگ استاندارد:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDocExample(doc.id, doc.example)}
                          className="text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          {copiedDocId === doc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedDocId === doc.id ? 'کپی شد' : 'کپی کد'}</span>
                        </button>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 dir-ltr overflow-x-auto">
                        {doc.example}
                      </pre>
                    </div>
                  </div>

                  {/* Footer Action: Direct Apply to Config */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      مقصد: {doc.targetConf || doc.confFile}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleApplyDocItem(doc)}
                      disabled={isApplied || isApplying}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                        isApplied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                      }`}
                    >
                      {isApplying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isApplied ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isApplying
                          ? 'در حال اعمال...'
                          : isApplied
                          ? 'روی کانفیگ اعمال شد ✓'
                          : `اعمال مستقیم روی ${targetEnv.toUpperCase()}`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 space-y-3 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <Search className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-sm font-semibold">موردی مطابق با عبارت جستجو شده در داکیومنت یافت نشد.</p>
                <button 
                  onClick={() => { setSearchDocQuery(''); setSelectedConfFilter('all'); }}
                  className="text-xs text-amber-400 hover:underline inline-block"
                >
                  پاک کردن جستجو و نمایش همه مستندات
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
