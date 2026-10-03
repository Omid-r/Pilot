import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TargetEnvironment, ParallelClusterState } from '../types';
import { 
  FileCode, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Copy, 
  Check, 
  Download,
  Terminal,
  History,
  HardDrive,
  Server,
  Split,
  ArrowRightLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Replace,
  Files,
  ArrowRight,
  Sparkles,
  Sliders
} from 'lucide-react';
import { resolveSplunkPaths } from '../utils/splunkPathResolver';

interface ConfigEditorProps {
  configs: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onSaveFile: (filename: string, content: string) => void;
  onBackupFile: (filename: string) => void;
  onRestoreFile: (filename: string) => void;
  hasFileBackup: boolean;
  onGlobalRestore: () => void;
  lang: 'fa' | 'en';
  activeEnvironment?: 'production' | 'parallel' | 'virtual';
  onChangeEnvironment?: (env: 'production' | 'parallel' | 'virtual') => void;
  parallelClusterState?: ParallelClusterState;
  onSyncConfigs?: () => void;
}

interface MatchOccurrence {
  index: number;
  line: number;
  length: number;
  preview: string;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  configs,
  activeFile,
  onSelectFile,
  onSaveFile,
  onBackupFile,
  onRestoreFile,
  hasFileBackup,
  onGlobalRestore,
  lang,
  activeEnvironment = 'production',
  onChangeEnvironment,
  parallelClusterState,
  onSyncConfigs
}) => {
  const isFa = lang === 'fa';
  const fileContent = configs[activeFile] || '';
  const [content, setContent] = useState(fileContent);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if active file changes externally
  useEffect(() => {
    setContent(configs[activeFile] || '');
    setCurrentMatchIdx(0);
  }, [activeFile, configs]);

  const fileList = Object.keys(configs);
  const lineCount = content.split('\n').length;

  // Calculate matches in the currently open file
  const matches = useMemo<MatchOccurrence[]>(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const results: MatchOccurrence[] = [];
    const lines = content.split('\n');
    let charOffset = 0;

    lines.forEach((lineText, lineIdx) => {
      let lineOffset = 0;
      const lower = lineText.toLowerCase();
      while (true) {
        const found = lower.indexOf(term, lineOffset);
        if (found === -1) break;
        results.push({
          index: charOffset + found,
          line: lineIdx + 1,
          length: searchTerm.length,
          preview: lineText.trim()
        });
        lineOffset = found + term.length;
      }
      charOffset += lineText.length + 1; // +1 for newline character
    });

    return results;
  }, [content, searchTerm]);

  // Set of lines that have matches for highlighting in gutter
  const matchLinesSet = useMemo(() => {
    return new Set(matches.map(m => m.line));
  }, [matches]);

  // Cross-file search matches across all .conf files
  const crossFileMatches = useMemo(() => {
    if (!searchTerm.trim() || searchScope !== 'all') return [];
    const term = searchTerm.toLowerCase();
    const results: Array<{ file: string; line: number; preview: string }> = [];

    Object.entries(configs).forEach(([fname, fcontent]) => {
      const lines = fcontent.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(term)) {
          results.push({
            file: fname,
            line: idx + 1,
            preview: lineText.trim()
          });
        }
      });
    });

    return results;
  }, [configs, searchTerm, searchScope]);

  // Jump to match in textarea
  const jumpToMatch = (idx: number) => {
    if (matches.length === 0 || !textareaRef.current) return;
    const targetIdx = ((idx % matches.length) + matches.length) % matches.length;
    setCurrentMatchIdx(targetIdx);
    const m = matches[targetIdx];

    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(m.index, m.index + m.length);

    // Approximate vertical scroll to bring line into view
    const lineHeight = 24; // 1.5rem (24px) leading-6
    const targetScroll = Math.max(0, (m.line - 4) * lineHeight);
    textarea.scrollTop = targetScroll;
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    jumpToMatch(currentMatchIdx + 1);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    jumpToMatch(currentMatchIdx - 1);
  };

  const handleReplaceCurrent = () => {
    if (matches.length === 0 || !textareaRef.current) return;
    const m = matches[currentMatchIdx];
    const before = content.substring(0, m.index);
    const after = content.substring(m.index + m.length);
    const nextContent = before + replaceTerm + after;
    setContent(nextContent);
  };

  const handleReplaceAll = () => {
    if (!searchTerm.trim()) return;
    // Replace all occurrences case-insensitively
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const nextContent = content.replace(regex, replaceTerm);
    setContent(nextContent);
  };

  const handleSave = () => {
    onSaveFile(activeFile, content);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [pathResolvedFeedback, setPathResolvedFeedback] = useState(false);

  const handleAutoResolvePaths = () => {
    const fixed = resolveSplunkPaths(content);
    setContent(fixed);
    setPathResolvedFeedback(true);
    setTimeout(() => setPathResolvedFeedback(false), 2500);
  };

  const handleTriggerSync = () => {
    if (onSyncConfigs) {
      setIsSyncing(true);
      onSyncConfigs();
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const isParallel = activeEnvironment === 'parallel';

  return (
    <div className={`sirene-card rounded-3xl border backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all relative ${
      isParallel 
        ? 'bg-[#091219]/90 border-emerald-500/40 shadow-emerald-950/20' 
        : 'bg-[#0b0e17]/90 border-white/[0.08]'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Editor Header & Environment Toggle Bar */}
      <div className={`border-b px-5 py-4 relative z-10 ${isParallel ? 'bg-[#0c1822]/80 border-emerald-900/40' : 'bg-[#0e121d]/80 border-white/[0.06]'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileCode className={`w-5 h-5 ${isParallel ? 'text-emerald-400' : 'text-violet-400'}`} />
              <h3 className="text-sm font-bold text-white tracking-wide">
                {isFa ? 'ویرایشگر و جستجوگر هوشمند کانفیگ‌های اسپلانک (.conf Editor & Search)' : 'Splunk .conf Configuration Editor & Search'}
              </h3>
            </div>

            {/* Environment Switcher Tabs */}
            {onChangeEnvironment && (
              <div className="flex items-center bg-[#07090e] p-1 rounded-2xl border border-white/[0.08] gap-1">
                <button
                  type="button"
                  onClick={() => onChangeEnvironment('production')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    !isParallel
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isFa ? 'سرور اصلی (Production)' : 'Main Server'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeEnvironment('parallel')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    isParallel
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>{isFa ? 'سرور موازی (Staging)' : 'Parallel Server'}</span>
                  {parallelClusterState?.isInstalled && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isParallel ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      :8001
                    </span>
                  )}
                </button>
              </div>
            )}

            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {isParallel 
                ? '/opt/splunk_parallel/etc/system/local/' 
                : '/opt/splunk/etc/system/local/'}
            </span>
          </div>

          {/* Backup & Sync actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isParallel && onSyncConfigs && (
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title={isFa ? 'کپی مجدد تمام فایل‌های کانفیگ سرور اصلی روی این سرور موازی' : 'Sync latest configs from Main Server to Parallel'}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (isFa ? 'در حال کپی...' : 'Syncing...') : (isFa ? 'کپی کانفیگ سرور اصلی روی موازی' : 'Sync from Main Server')}</span>
              </button>
            )}

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono border ${
              hasFileBackup 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}>
              <HardDrive className="w-3.5 h-3.5" />
              <span>
                {isFa 
                  ? (hasFileBackup ? 'بک‌آپ این فایل: موجود ✓' : 'بک‌آپ: ندارد')
                  : (hasFileBackup ? 'File Backup: Active ✓' : 'File Backup: None')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAutoResolvePaths}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                pathResolvedFeedback
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300'
              }`}
              title={isFa ? 'یافتن متغیرهای مسیر مانند $splunkdirectory و جایگزینی با مسیر واقعی /opt/splunk' : 'Find $splunkdirectory variables and replace with /opt/splunk'}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>{pathResolvedFeedback ? (isFa ? 'مسیرها جایگزین شدند ✓' : 'Paths Resolved ✓') : (isFa ? 'تبدیل متغیرهای مسیر به /opt/splunk' : 'Resolve Path Variables')}</span>
            </button>

            <button
              onClick={() => onBackupFile(activeFile)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              title={isFa ? 'ایجاد یک نسخه پشتیبان از این فایل خاص' : 'Create snapshot of this file'}
            >
              <Save className="w-3.5 h-3.5 text-violet-400" />
              <span>{isFa ? 'بک‌آپ این فایل' : 'Backup File'}</span>
            </button>

            <button
              onClick={() => onRestoreFile(activeFile)}
              disabled={!hasFileBackup}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                hasFileBackup 
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-amber-300 cursor-pointer' 
                  : 'bg-white/[0.02] border border-transparent text-slate-600 cursor-not-allowed'
              }`}
              title={isFa ? 'بازگردانی این فایل به آخرین بک‌آپ' : 'Restore this file from backup'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFa ? 'بازگردانی این فایل' : 'Restore File'}</span>
            </button>

            <div className="h-4 w-[1px] bg-white/[0.1] mx-1 hidden sm:block"></div>

            <button
              onClick={onGlobalRestore}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              title={isFa ? 'بازگردانی سراسری تمام فایل‌ها و کلاستر به بک‌آپ اولیه' : 'Restore all configurations to initial baseline backup'}
            >
              <History className="w-3.5 h-3.5 text-rose-400" />
              <span>{isFa ? 'بازگردانی سراسری اولیه' : 'Global Revert All'}</span>
            </button>
          </div>
        </div>

        {/* Tab Pills for configs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {fileList.map((filename) => {
            const isActive = filename === activeFile;
            return (
              <button
                key={filename}
                onClick={() => onSelectFile(filename)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? isParallel 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/20'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                <span>{filename}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Search & Replacement Toolbar */}
      <div className="bg-[#080a10] px-5 py-2.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute right-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isFa ? 'جستجوی کلمه، استنزا، پارامتر...' : 'Search keyword, stanza, parameter...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                }
              }}
              className="bg-[#0e121d] border border-white/[0.12] rounded-xl pl-8 pr-9 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500/80 w-56 transition shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scope Selector: Current File vs All Files */}
          <div className="flex items-center bg-[#0e121d] border border-white/[0.08] rounded-xl p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSearchScope('current')}
              className={`px-2 py-1 rounded-lg transition ${
                searchScope === 'current'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isFa ? 'فایل جاری' : 'Current File'}
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('all')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                searchScope === 'all'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Files className="w-3 h-3" />
              <span>{isFa ? 'تمام فایل‌ها' : 'All Files'}</span>
            </button>
          </div>

          {/* Search Navigation Buttons (Next / Prev) */}
          {searchTerm && searchScope === 'current' && (
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                matches.length > 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {matches.length > 0 
                  ? `${currentMatchIdx + 1} / ${matches.length}`
                  : (isFa ? 'یافت نشد' : '0 matches')}
              </span>

              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
                className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title={isFa ? 'مورد قبلی (Shift + Enter)' : 'Previous match (Shift + Enter)'}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
                className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title={isFa ? 'مورد بعدی (Enter)' : 'Next match (Enter)'}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Toggle Replace Panel */}
          <button
            type="button"
            onClick={() => setShowReplace(!showReplace)}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition ${
              showReplace
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Replace className="w-3 h-3 text-amber-400" />
            <span>{isFa ? 'جایگزینی (Replace)' : 'Replace'}</span>
          </button>

          <span className="font-mono text-slate-500 hidden md:inline text-[11px]">
            {lineCount} {isFa ? 'خط' : 'lines'} | {content.length} {isFa ? 'بایت' : 'bytes'}
          </span>
        </div>

        {/* Copy & Save Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-mono text-xs flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی کل' : 'Copy')}</span>
          </button>

          <button
            onClick={handleSave}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              isSaved 
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? (isFa ? 'ذخیره شد ✓' : 'Saved ✓') : (isFa ? 'ذخیره تغییرات' : 'Save Config')}</span>
          </button>
        </div>
      </div>

      {/* Replace Sub-Bar */}
      {showReplace && (
        <div className="bg-[#0b0e17] px-5 py-2 border-b border-amber-500/20 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Replace className="w-3.5 h-3.5" />
            <span>{isFa ? 'جایگزینی با:' : 'Replace with:'}</span>
          </span>
          <input
            type="text"
            placeholder={isFa ? 'متن جایگزین جدید...' : 'Replacement text...'}
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="bg-[#07090e] border border-white/[0.1] rounded-xl px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 w-56 transition"
          />
          <button
            type="button"
            onClick={handleReplaceCurrent}
            disabled={matches.length === 0}
            className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold disabled:opacity-40 transition"
          >
            {isFa ? 'جایگزینی این مورد' : 'Replace Next'}
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40 transition shadow-sm"
          >
            {isFa ? 'جایگزینی همه' : 'Replace All'}
          </button>
        </div>
      )}

      {/* Cross-file Search Results Dropdown/Box */}
      {searchScope === 'all' && searchTerm.trim() && (
        <div className="bg-[#0c101a] border-b border-violet-500/30 px-5 py-3 max-h-48 overflow-y-auto space-y-1.5 z-20">
          <div className="text-[11px] font-bold text-violet-300 flex items-center justify-between mb-2">
            <span>
              {isFa 
                ? `یافته‌ها در تمام فایل‌ها: ${crossFileMatches.length} مورد یافت شد`
                : `Global Results: ${crossFileMatches.length} matches found`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {isFa ? 'برای پرش مستقیم به هر خط روی آن کلیک کنید' : 'Click any match to navigate'}
            </span>
          </div>
          {crossFileMatches.length === 0 ? (
            <div className="text-xs text-slate-500 py-1">
              {isFa ? 'هیچ موردی در هیچ‌یک از فایل‌های کانفیگ یافت نشد.' : 'No matches found in any .conf file.'}
            </div>
          ) : (
            crossFileMatches.map((res, i) => (
              <div
                key={i}
                onClick={() => {
                  onSelectFile(res.file);
                  setSearchScope('current');
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-violet-500/15 border border-white/[0.04] hover:border-violet-500/30 cursor-pointer transition text-xs font-mono"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="px-2 py-0.5 rounded bg-violet-600/30 text-violet-200 font-bold shrink-0">
                    {res.file} : خط {res.line}
                  </span>
                  <span className="text-slate-300 truncate max-w-md">
                    {res.preview}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Editor Body with Code area */}
      <div className="relative flex-1 bg-[#05070c] flex overflow-hidden min-h-[400px] max-h-[520px]">
        {/* Line Numbers column with match markers */}
        <div className="w-14 py-3 bg-[#07090e] border-r border-white/[0.06] select-none text-right pr-2.5 text-slate-600 font-mono text-xs leading-6">
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const hasMatch = matchLinesSet.has(lineNum);
            return (
              <div 
                key={i} 
                className={`transition-colors ${
                  hasMatch 
                    ? 'text-amber-400 font-bold bg-amber-500/15 rounded-l-md px-1' 
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Editor */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3.5 bg-transparent text-slate-200 font-mono text-xs leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre selection:bg-violet-500/40"
        />
      </div>

      {/* Status Bar */}
      <div className="bg-[#07090e] border-t border-white/[0.06] px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_#10b981]"></span>
            btool syntax: valid
          </span>
          <span>Stanza count: {(content.match(/\[[^\]]+\]/g) || []).length}</span>
          {searchTerm && matches.length > 0 && (
            <span className="text-amber-300">
              Matches: {matches.length}
            </span>
          )}
        </div>
        <div>
          Encoding: UTF-8 | Unix (LF)
        </div>
      </div>
    </div>
  );
};
