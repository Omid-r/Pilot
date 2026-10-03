import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  Search,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Zap,
  Activity,
  Shield,
  Cpu,
  Sparkles,
  ArrowRight,
  Wrench,
  Flame,
  CheckCheck,
  CornerDownLeft,
  X
} from 'lucide-react';
import { ServerCommandLogEntry } from '../types';

interface PuTTYLiveShellConsoleProps {
  lang?: 'fa' | 'en';
  onClose?: () => void;
  isFloating?: boolean;
  onToggleFloating?: () => void;
  initialCommand?: string;
  activePort?: number;
}

export const PuTTYLiveShellConsole: React.FC<PuTTYLiveShellConsoleProps> = ({
  lang = 'fa',
  onClose,
  isFloating = false,
  onToggleFloating,
  initialCommand,
  activePort = 8001
}) => {
  const isFa = lang === 'fa';
  const [commandInput, setCommandInput] = useState<string>(initialCommand || '');
  const [logs, setLogs] = useState<ServerCommandLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [remediationFeedback, setRemediationFeedback] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial history
  useEffect(() => {
    fetch('/api/system/command-history?limit=40')
      .then(r => r.json())
      .then(data => {
        if (data && data.entries) {
          setLogs(data.entries);
        }
      })
      .catch(() => {});
  }, []);

  // Live SSE listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/system/command-stream');
      eventSource.onopen = () => setIsLiveConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'command_start' || payload.type === 'command_added') {
            setLogs(prev => [payload.entry, ...prev.filter(e => e.id !== payload.entry.id)].slice(0, 100));
          } else if (payload.type === 'command_finish') {
            setLogs(prev => [payload.entry, ...prev.filter(e => e.id !== payload.entry.id)].slice(0, 100));
          }
        } catch (_) {}
      };
      eventSource.onerror = () => setIsLiveConnected(false);
    } catch (_) {}

    return () => {
      eventSource?.close();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  // Execute terminal command
  const handleExecute = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd || isRunning) return;

    setIsRunning(true);
    setTerminalHistory(prev => [cmd, ...prev.filter(c => c !== cmd)].slice(0, 30));
    setHistoryIndex(-1);
    setCommandInput('');

    try {
      await fetch('/api/system/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          toolId: 'putty_shell',
          toolNameFa: 'ترمینال زنده PuTTY SSH',
          toolNameEn: 'PuTTY Live SSH Shell'
        })
      });
    } catch (e: any) {
      console.error('Terminal exec error:', e);
    } finally {
      setIsRunning(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Keyboard navigation for history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      if (terminalHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, terminalHistory.length - 1);
        setHistoryIndex(nextIdx);
        setCommandInput(terminalHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(terminalHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  // 1-Click Auto-Remediation Engine for errors
  const handleAutoRemediateError = async (entry: ServerCommandLogEntry) => {
    setRemediatingId(entry.id);
    setRemediationFeedback(isFa ? 'در حال اجرای هوشمند رفع خطا و راه‌اندازی سرویس...' : 'Auto-remediating error and starting service...');

    const errorText = `${entry.stderr} ${entry.stdout}`.toLowerCase();
    let fixEndpoint = '/api/parallel-cluster/diagnose-fix';
    let fixBody: any = {};

    if (errorText.includes('no docker') || errorText.includes('not found') || errorText.includes('docker')) {
      fixBody = { command: 'bash scripts/fix-parallel-web.sh /opt/splunk_parallel 8001 8090 9998 8193' };
      fixEndpoint = '/api/system/terminal/exec';
    } else if (errorText.includes('kvstore') || errorText.includes('8192')) {
      fixBody = { issueId: 'diag-kvstore-collision' };
      fixEndpoint = '/api/parallel-cluster/fix-individual-issue';
    } else if (errorText.includes('web.conf') || errorText.includes('mgmthostport')) {
      fixBody = { issueId: 'diag-web-mgmt-mismatch' };
      fixEndpoint = '/api/parallel-cluster/fix-individual-issue';
    } else {
      fixEndpoint = '/api/parallel-cluster/diagnose-fix';
    }

    try {
      const res = await fetch(fixEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixBody)
      });
      const data = await res.json();
      if (data.success) {
        setRemediationFeedback(isFa ? 'خطا با موفقیت برطرف شد و سرویس وب روی پورت 8001 راه‌اندازی گردید ✓' : 'Error remediated and web service started on port 8001 ✓');
      } else {
        setRemediationFeedback(isFa ? 'دستور خودترمیمی به سرور ارسال و اجرا گردید.' : 'Remediation command executed.');
      }
    } catch (_) {
      setRemediationFeedback(isFa ? 'دستور خودترمیمی به سرور ارسال گردید.' : 'Auto-heal sent.');
    } finally {
      setRemediatingId(null);
      setTimeout(() => setRemediationFeedback(null), 5000);
    }
  };

  // Helper to parse error causes
  const getErrorAnalysis = (entry: ServerCommandLogEntry) => {
    const text = `${entry.stderr} ${entry.stdout}`.toLowerCase();
    if (text.includes('no docker') || (text.includes('command not found') && text.includes('docker'))) {
      return {
        causeFa: 'داکر روی این سرور لینوکس نصب نیست.',
        fixFa: 'راه‌اندازی انجین مستقل پورتابل اسپلانک روی پورت ۸۰۰۱',
        actionLabel: isFa ? '⚡ راه‌اندازی سرویس مستقل روی پورت 8001' : 'Start Standalone Splunk Web'
      };
    }
    if (text.includes('cannot connect to the docker daemon') || text.includes('is the docker daemon running')) {
      return {
        causeFa: 'سرویس داکر متوقف است.',
        fixFa: 'راه‌اندازی سرویس وب اسپلانک روی پورت ۸۰۰۱',
        actionLabel: isFa ? '⚡ راه‌اندازی سرویس وب پورت 8001' : 'Start Splunk Web'
      };
    }
    if (text.includes('address already in use') || text.includes('eaddrinuse') || text.includes('bind')) {
      return {
        causeFa: 'پورت توسط پروسس دیگری اشغال است.',
        fixFa: 'آزادسازی سوکت با fuser و ریستارت دیمن اسپلانک',
        actionLabel: isFa ? 'آزادسازی پورت و ریستارت' : 'Free Socket & Restart'
      };
    }
    if (text.includes('connection refused') || text.includes('failed to connect')) {
      return {
        causeFa: 'سرویس وب روی پورت شنود نمی‌کند.',
        fixFa: 'تنظیم web.conf و استارت دیمن وب',
        actionLabel: isFa ? 'فعال‌سازی فوری وب و استارت دیمن' : 'Start Splunk Web'
      };
    }
    return {
      causeFa: 'نیاز به رفع خطا و ریستارت سرویس.',
      fixFa: 'اجرای اسکریپت خودترمیمی و بازنشانی سرویس وب',
      actionLabel: isFa ? 'برطرف‌سازی خودکار و اجرای مجدد' : 'Auto-Fix & Rerun'
    };
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = selectedCategory === 'all' 
    ? logs 
    : logs.filter(l => l.category === selectedCategory || (selectedCategory === 'failed' && l.status === 'failed'));

  return (
    <div className="flex flex-col h-full bg-[#050911] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
      
      {/* PuTTY Title Bar */}
      <div className="bg-gradient-to-r from-[#0d1527] via-[#091122] to-[#0d1527] px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 font-bold ml-2 flex items-center gap-1.5 font-sans">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>PuTTY / SSH Live Terminal Console</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isLiveConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'}`}>
            {isLiveConnected ? 'LIVE SSH' : 'CONNECTING...'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExecute('docker ps -a 2>/dev/null || which docker || ps aux | grep splunk')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition cursor-pointer"
            title="بررسی سریع پروسس‌ها و داکر"
          >
            {isFa ? '🔍 بررسی پروسس‌ها' : 'Inspect Processes'}
          </button>

          <button
            type="button"
            onClick={() => handleExecute('curl -I http://localhost:8001/en-US/account/login 2>/dev/null || ss -tulpn | grep 8001')}
            className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] transition cursor-pointer"
            title="تست اتصال پورت ۸۰۰۱"
          >
            {isFa ? '🌐 تست پورت 8001' : 'Test Port 8001'}
          </button>

          {onToggleFloating && (
            <button
              type="button"
              onClick={onToggleFloating}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title={isFloating ? 'Dock' : 'Expand'}
            >
              {isFloating ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Category Filters */}
      <div className="px-3 py-1.5 bg-[#080d1a] border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-[10px]">
        <div className="flex items-center gap-1.5">
          {['all', 'failed', 'docker', 'splunk', 'network', 'system'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded transition uppercase ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? (isFa ? 'همه لاگ‌ها' : 'All') : cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLogs([])}
          className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition shrink-0"
        >
          <Trash2 className="w-3 h-3" />
          <span>{isFa ? 'پاکسازی' : 'Clear'}</span>
        </button>
      </div>

      {/* Remediation Live Toast */}
      {remediationFeedback && (
        <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-4 py-2 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{remediationFeedback}</span>
        </div>
      )}

      {/* Terminal Output Area (PuTTY screen) */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-mono text-[11px] leading-relaxed bg-black/80 select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 p-4 text-center">
            {isFa ? 'در انتظار دریافت فرامین و اقدامات سرور...' : 'Waiting for server commands and background telemetry...'}
          </div>
        ) : (
          filteredLogs.slice().reverse().map((entry) => {
            const hasError = entry.status === 'failed' || Boolean(entry.stderr?.trim());
            const errorAnalysis = hasError ? getErrorAnalysis(entry) : null;

            return (
              <div 
                key={entry.id} 
                className={`p-2.5 rounded-xl border transition ${
                  hasError 
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                {/* Command Prompt Header */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-emerald-400 font-bold">root@rhel-server</span>
                    <span className="text-slate-600">:</span>
                    <span className="text-cyan-400 font-bold">{entry.workingDir || '/opt/splunk'}</span>
                    <span className="text-slate-600">#</span>
                    <span className="text-slate-200 font-bold text-xs">{entry.command}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      entry.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {entry.status === 'success' ? 'EXIT 0' : `CODE ${entry.exitCode || 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(entry.command, entry.id)}
                      className="text-slate-500 hover:text-white p-0.5 rounded"
                      title="Copy Command"
                    >
                      {copiedId === entry.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Stdout Output */}
                {entry.stdout && (
                  <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[10px] bg-black/40 p-2 rounded-lg border border-slate-900/80 my-1 overflow-x-auto">
                    {entry.stdout.trim()}
                  </pre>
                )}

                {/* Stderr Output */}
                {entry.stderr && (
                  <pre className="text-rose-400 whitespace-pre-wrap font-mono text-[10px] bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 my-1 overflow-x-auto">
                    {entry.stderr.trim()}
                  </pre>
                )}

                {/* Intelligent Auto-Remediation Banner if Error Occurred */}
                {hasError && errorAnalysis && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-950/30 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 font-sans">
                    <div className="text-[11px] text-amber-200">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isFa ? 'تحلیل ریشه‌ای خطا:' : 'Root Cause:'} {errorAnalysis.causeFa}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        {isFa ? 'راهکار رفع:' : 'Proposed Fix:'} {errorAnalysis.fixFa}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoRemediateError(entry)}
                      disabled={remediatingId === entry.id}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Wrench className={`w-3.5 h-3.5 ${remediatingId === entry.id ? 'animate-spin' : ''}`} />
                      <span>{errorAnalysis.actionLabel}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* PuTTY Interactive Input Prompt */}
      <div className="p-2.5 bg-[#080d18] border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold text-xs shrink-0 select-none">
          [root@rhel-server ~]#
        </span>

        <input
          ref={inputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isFa ? 'دستور لینوکس را وارد کرده و Enter بزنید (مثال: docker ps یا ss -tulpn)...' : 'Type Linux/Docker command and press Enter...'}
          className="flex-1 bg-black/60 border border-slate-700/80 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
          disabled={isRunning}
        />

        <button
          type="button"
          onClick={() => handleExecute()}
          disabled={!commandInput.trim() || isRunning}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isRunning ? '...' : (isFa ? 'اجرا' : 'Run')}</span>
        </button>
      </div>
    </div>
  );
};
