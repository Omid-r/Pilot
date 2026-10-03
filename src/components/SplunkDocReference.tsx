import React, { useState } from 'react';
import { 
  SPLUNK_CONFIG_DOCS, 
  generateOfflineMarkdownManual, 
  generateOfflineHtmlHandbook,
  generateHardeningBashScript
} from '../data/splunkDocs';
import { 
  SPLUNK_ARCHITECTURE_CHAPTERS,
  generateClusterSetupAutomationBashScript,
  generateSplunkFullArchitectureManual,
  DocChapter
} from '../data/splunkArchitectureDocs';
import { SplunkDocItem } from '../types';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  FileCode, 
  Copy, 
  Check, 
  Bookmark, 
  Download, 
  FileJson, 
  FileText, 
  Globe, 
  Sparkles, 
  WifiOff, 
  CheckCircle2, 
  Terminal, 
  Cpu, 
  HelpCircle,
  Layers,
  Server,
  HardDrive,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SplunkDocReferenceProps {
  lang: 'fa' | 'en';
}

export const SplunkDocReference: React.FC<SplunkDocReferenceProps> = ({ lang }) => {
  const isFa = lang === 'fa';
  
  // Tab View Mode: 'chapters' (Architecture & Clustering) | 'conf_parameters' (All .conf files) | 'download_center'
  const [docViewMode, setDocViewMode] = useState<'chapters' | 'conf_parameters' | 'download_center'>('chapters');
  
  // Chapters State
  const [selectedChapterId, setSelectedChapterId] = useState<string>(SPLUNK_ARCHITECTURE_CHAPTERS[0].id);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  
  // Conf Parameters State
  const [selectedFile, setSelectedFile] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Copy and Download feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const fileTypes = [
    'all', 
    'inputs.conf', 
    'outputs.conf', 
    'server.conf', 
    'indexes.conf', 
    'props.conf', 
    'transforms.conf',
    'web.conf',
    'limits.conf',
    'authentication.conf'
  ];

  const selectedChapter = SPLUNK_ARCHITECTURE_CHAPTERS.find(c => c.id === selectedChapterId) || SPLUNK_ARCHITECTURE_CHAPTERS[0];

  const filteredChapters = SPLUNK_ARCHITECTURE_CHAPTERS.filter(ch => {
    const term = chapterSearch.toLowerCase();
    return !chapterSearch || 
      ch.titleFa.toLowerCase().includes(term) ||
      ch.titleEn.toLowerCase().includes(term) ||
      ch.summaryFa.toLowerCase().includes(term) ||
      ch.sections.some(s => s.headingFa.toLowerCase().includes(term) || s.contentFa.toLowerCase().includes(term));
  });

  const filteredDocs = SPLUNK_CONFIG_DOCS.filter(item => {
    const matchesFile = selectedFile === 'all' || item.confFile === selectedFile;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.parameter.toLowerCase().includes(term) ||
      item.stanza.toLowerCase().includes(term) ||
      item.confFile.toLowerCase().includes(term) ||
      item.descriptionFa.toLowerCase().includes(term) ||
      item.descriptionEn.toLowerCase().includes(term) ||
      item.bestPracticeFa.toLowerCase().includes(term) ||
      item.securityImpactFa.toLowerCase().includes(term) ||
      item.example.toLowerCase().includes(term);
    return matchesFile && matchesSearch;
  });

  const handleCopyExample = (example: string, id: string) => {
    navigator.clipboard.writeText(example);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    downloadFile(jsonStr, 'splunk-complete-docs-offline.json', 'application/json');
  };

  const handleDownloadMarkdown = () => {
    const md = generateSplunkFullArchitectureManual();
    downloadFile(md, 'splunk-enterprise-complete-manual.md', 'text/markdown;charset=utf-8');
  };

  const handleDownloadHTML = () => {
    const html = generateOfflineHtmlHandbook();
    downloadFile(html, 'splunk-docs-offline-handbook.html', 'text/html;charset=utf-8');
  };

  const handleDownloadBashScript = () => {
    const sh = generateHardeningBashScript();
    downloadFile(sh, 'splunk-hardening-baseline.sh', 'text/x-sh;charset=utf-8');
  };

  const handleDownloadClusterScript = () => {
    const sh = generateClusterSetupAutomationBashScript();
    downloadFile(sh, 'splunk-cluster-setup-automation.sh', 'text/x-sh;charset=utf-8');
  };

  return (
    <div className="bg-[#0e141c] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 text-start" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Header & Offline Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">
                {isFa ? 'مرجع کامل داکیومنت، کلاسترینگ و نصب اسپلانک (Splunk Official Knowledge Base)' : 'Official Splunk Knowledge Base, Clustering & Architecture Guide'}
              </h2>
              <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                <WifiOff className="w-3 h-3" />
                <span>{isFa ? '۱۰۰٪ آفلاین و دانلود مستقیم' : '100% Offline Air-Gapped & 1-Click Downloads'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa 
                ? 'مستندات گام‌به‌گام نصب لینوکس، کلاسترینگ ایندکسرها (Single & Multi-Site)، کلاستر سرچ‌هدها (SHC)، اسمارت‌استور S3، تنظیمات کرنل و مرجع پارامترهای conf.' 
                : 'Complete offline guide for bare-metal/Linux install, Indexer Clustering, Search Head Clustering, SmartStore, kernel tuning, and conf parameter database.'}
            </p>
          </div>
        </div>

        {/* Quick Export Center */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            title={isFa ? 'دانلود کتابچه جامع مارک‌داون' : 'Export Full Markdown'}
          >
            <FileText className="w-4 h-4" />
            <span>{isFa ? 'دانلود Markdown کامل' : 'Export Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadClusterScript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            title={isFa ? 'دانلود اسکریپت شل راه‌اندازی کلاستر' : 'Export Cluster Setup Script'}
          >
            <Terminal className="w-4 h-4" />
            <span>{isFa ? 'دانلود اسکریپت کلاستر' : 'Cluster Bash'}</span>
          </button>

          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            title={isFa ? 'دانلود هندبوک قابل پرینت HTML' : 'Export Printable HTML'}
          >
            <Download className="w-4 h-4 fill-slate-950" />
            <span>{isFa ? 'دانلود هندبوک HTML' : 'Export HTML'}</span>
          </button>
        </div>
      </div>

      {/* Download Alert Message */}
      {downloadSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isFa ? `فایل «${downloadSuccessMessage}» با موفقیت دانلود شد.` : `File "${downloadSuccessMessage}" successfully downloaded.`}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Ready for offline use</span>
        </div>
      )}

      {/* Top Navigation Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setDocViewMode('chapters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            docViewMode === 'chapters'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{isFa ? '۱. راهنماهای جامع معماری و کلاسترینگ (Architecture Chapters)' : '1. Architecture & Clustering Chapters'}</span>
        </button>

        <button
          onClick={() => setDocViewMode('conf_parameters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            docViewMode === 'conf_parameters'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-sky-400" />
          <span>{isFa ? '۲. دایره‌المعارف پارامترهای کانفیگ (.conf Reference DB)' : '2. Conf Parameters Database'}</span>
        </button>

        <button
          onClick={() => setDocViewMode('download_center')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            docViewMode === 'download_center'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{isFa ? '۳. مرکز دانلود پکیج‌ها و اسکریپت‌های آفلاین' : '3. Offline Download Package Center'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ARCHITECTURE & CLUSTERING CHAPTERS */}
      {/* ========================================================================= */}
      {docViewMode === 'chapters' && (
        <div className="space-y-6">
          
          {/* Chapter Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPLUNK_ARCHITECTURE_CHAPTERS.map(ch => (
              <div
                key={ch.id}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                  selectedChapterId === ch.id
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/40'
                    : 'bg-[#101622] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-900 text-slate-300 border border-slate-700">
                      {ch.readTime}
                    </span>
                    {selectedChapterId === ch.id && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 mb-1">
                    {isFa ? ch.titleFa : ch.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {isFa ? ch.summaryFa : ch.summaryEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Chapter Content Viewer */}
          <div className="bg-[#121927] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-amber-400">
                  {isFa ? selectedChapter.titleFa : selectedChapter.titleEn}
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  {selectedChapter.readTime}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isFa ? selectedChapter.summaryFa : selectedChapter.summaryEn}
              </p>
            </div>

            {/* Render Chapter Sections */}
            <div className="space-y-6">
              {selectedChapter.sections.map((sec, idx) => (
                <div key={idx} className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs sm:text-sm font-bold text-sky-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>{isFa ? sec.headingFa : sec.headingEn}</span>
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isFa ? sec.contentFa : sec.contentEn}
                  </p>

                  {/* Callout Box if present */}
                  {sec.calloutFa && (
                    <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      sec.calloutType === 'critical' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' :
                      sec.calloutType === 'warning' ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' :
                      'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    }`}>
                      {sec.calloutType === 'critical' ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> :
                       sec.calloutType === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> :
                       <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                      <span>{sec.calloutFa}</span>
                    </div>
                  )}

                  {/* Code Snippet if present */}
                  {sec.codeSnippet && (
                    <div className="bg-[#0b0f17] border border-slate-800 rounded-lg overflow-hidden mt-2">
                      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{sec.codeLanguage || 'bash'}</span>
                        <button
                          onClick={() => handleCopyExample(sec.codeSnippet!, `code-sec-${idx}`)}
                          className="hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedId === `code-sec-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `code-sec-${idx}` ? 'کپی شد' : 'کپی کد'}</span>
                        </button>
                      </div>
                      <pre className="p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed custom-scrollbar">
                        <code>{sec.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Official Doc External Links */}
            {selectedChapter.officialDocLinks.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400">{isFa ? 'لینک‌های مستندات رسمی اسپلانک:' : 'Official Docs:'}</span>
                {selectedChapter.officialDocLinks.map((link, lidx) => (
                  <a
                    key={lidx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-sky-500/40 transition"
                  >
                    <span>{link.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CONF PARAMETERS DATABASE */}
      {/* ========================================================================= */}
      {docViewMode === 'conf_parameters' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121927] p-3.5 rounded-xl border border-slate-800">
            {/* File Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-bold ml-1">{isFa ? 'فایل کانفیگ:' : 'File:'}</span>
              {fileTypes.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFile(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                    selectedFile === f
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isFa ? 'جستجو در پارامترها و استنزاها...' : 'Search parameters...'}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-xs text-slate-400 flex items-center justify-between px-1">
            <span>{isFa ? `تعداد ${filteredDocs.length} پارامتر مستند شده یافت شد.` : `Showing ${filteredDocs.length} documented parameters.`}</span>
            <span className="font-mono text-[11px] text-amber-400">Splunk Validated Architecture (SVA) Compliant</span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id}
                className="bg-[#101622] border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                          {doc.confFile}
                        </span>
                        <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {doc.stanza}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white font-mono mt-1.5 flex items-center gap-1.5">
                        <span className="text-amber-400">{doc.parameter}</span>
                      </h3>
                    </div>

                    <a 
                      href={doc.officialDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-800 transition shrink-0"
                      title={isFa ? 'مشاهده در داکیومنت رسمی اسپلانک' : 'View in Official Splunk Docs'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Description */}
                  <div className="mt-2.5 space-y-2 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      {isFa ? doc.descriptionFa : doc.descriptionEn}
                    </p>

                    {/* SVA Best Practice */}
                    <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300 text-[11px] space-y-0.5">
                      <span className="font-bold flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isFa ? 'بهترین راهکار SVA:' : 'SVA Best Practice:'}</span>
                      </span>
                      <p className="leading-normal">{isFa ? doc.bestPracticeFa : doc.bestPracticeEn}</p>
                    </div>

                    {/* Security Impact */}
                    <div className="bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-lg text-rose-300 text-[11px] space-y-0.5">
                      <span className="font-bold flex items-center gap-1 text-rose-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isFa ? 'اثر امنیتی (Security Impact):' : 'Security Impact:'}</span>
                      </span>
                      <p className="leading-normal">{isFa ? doc.securityImpactFa : doc.securityImpactEn}</p>
                    </div>
                  </div>
                </div>

                {/* Example Snippet */}
                <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5 relative group mt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>{isFa ? 'نمونه پیکربندی معتبر:' : 'Configuration Example:'}</span>
                    <button
                      onClick={() => handleCopyExample(doc.example, doc.id)}
                      className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedId === doc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === doc.id ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed custom-scrollbar">
                    <code>{doc.example}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: OFFLINE DOWNLOAD PACKAGE CENTER */}
      {/* ========================================================================= */}
      {docViewMode === 'download_center' && (
        <div className="space-y-4">
          <div className="bg-[#121927] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>{isFa ? 'دانلود بسته‌های جامع مستندات اسپلانک برای محیط‌های بدون اینترنت (Air-Gapped)' : 'Offline Splunk Documentation Bundles'}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? 'تمامی مستندات رسمی، راهنماهای گام‌به‌گام کلاسترینگ، اسکریپت‌های اتوماسیون شل و دایره‌المعارف پارامترها به صورت فایل‌های دانلودی آماده برای نگهداری در سرورهای ایزوله SOC طراحی شده‌اند.'
                : 'All official documents, clustering step-by-step guides, shell automation scripts, and parameter databases are ready for instant download for isolated air-gapped SOC environments.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Markdown Package */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-1">
                    <FileText className="w-4 h-4" />
                    <span>splunk-enterprise-complete-manual.md</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isFa ? 'کتابچه کامل مارک‌داون شامل تمامی فصول نصب، کلاسترینگ، داکر، کوبرنتیز و بهینه‌سازی کرنل.' : 'Full markdown manual including all installation, clustering, Docker, K8s and kernel tuning chapters.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isFa ? 'دانلود کتابچه Markdown' : 'Download Markdown (.md)'}</span>
                </button>
              </div>

              {/* Printable HTML Handbook */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                    <Globe className="w-4 h-4" />
                    <span>splunk-docs-offline-handbook.html</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isFa ? 'هندبوک مستقل HTML با استایل‌های اختصاصی و قابلیت پرینت یا مطالعه مستقیم در مرورگر بدون اینترنت.' : 'Standalone HTML handbook ready for offline viewing or printing in air-gapped browsers.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadHTML}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isFa ? 'دانلود هندبوک HTML' : 'Download HTML (.html)'}</span>
                </button>
              </div>

              {/* Cluster Setup Script */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <Terminal className="w-4 h-4" />
                    <span>splunk-cluster-setup-automation.sh</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isFa ? 'اسکریپت خط فرمان شل لینوکس برای راه‌اندازی خودکار نودهای Cluster Manager، Indexer Peer، SHC و Deployer.' : 'Linux bash script for automated deployment of Cluster Manager, Indexer Peers, SHC and Deployer.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadClusterScript}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isFa ? 'دانلود اسکریپت شل کلاستر' : 'Download Cluster Script (.sh)'}</span>
                </button>
              </div>

              {/* JSON Database */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                    <FileJson className="w-4 h-4" />
                    <span>splunk-complete-docs-offline.json</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isFa ? 'دیتابیس ساخت‌یافته JSON شامل تمام پارامترها، قوانین SVA، توضیحات و مثال‌های کاربردی.' : 'Structured JSON database of all parameters, SVA guidelines, descriptions, and examples.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadJSON}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isFa ? 'دانلود دیتابیس JSON' : 'Download JSON (.json)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
