import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  RotateCw,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sliders,
  Server,
  Zap,
  Activity,
  Shield,
  Cpu,
  HardDrive,
  FileCode,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  HelpCircle,
  Eye,
  Info,
  Layers,
  Wrench,
  Flame,
  CheckCheck
} from 'lucide-react';
import { ServerCommandLogEntry, ServerCommandStreamStats } from '../types';

interface ServerCommandPromptConsoleProps {
  lang: 'fa' | 'en';
  onClose?: () => void;
  isFloating?: boolean;
  onToggleFloating?: () => void;
  filterToolId?: string;
  initialActiveTab?: 'history' | 'prompt' | 'by_tool' | 'raw_log' | 'presets';
}

const PRESET_COMMANDS = [
  {
    cmd: 'ss -tulpn | grep -E "8000|8089|9997|8088|514|1514|8001|8090|9998"',
    descFa: 'بررسی پورت‌های فعال اسپلانک و سوکت‌های لیسنور سرور',
    descEn: 'Check active Splunk listening ports & sockets',
    category: 'network',
    explanationFa: 'این دستور سوکت‌های TCP/UDP فعال در سیستم‌عامل لینوکس را فیلتر کرده و مشخص می‌کند آیا اسپلانک روی پورت‌های ۸۰۰۰ (وب)، ۸۰۸۹ (مدیریت)، ۹۹۹۷ (ایندکسر)، ۸۰۸۸ (HEC) و ۵۱۴ (سیسلاگ) در حال گوش دادن است یا خیر.'
  },
  {
    cmd: 'ps aux | grep -E "splunkd|splunk|python" | grep -v grep',
    descFa: 'مشاهده فرآیندهای در حال اجرای اسپلانک در جدول پروسس‌های لینوکس',
    descEn: 'Inspect running Splunk daemon processes in OS process table',
    category: 'splunk',
    explanationFa: 'فرآیند اصلی splunkd، سرویس وب splunkweb و پروسس‌های کمکی پایتون را همراه با شناسه فرآیند (PID) و میزان مصرف CPU و RAM نشان می‌دهد.'
  },
  {
    cmd: 'cat /opt/splunk/etc/system/local/server.conf 2>/dev/null || cat /opt/splunk_parallel/etc/system/local/server.conf 2>/dev/null',
    descFa: 'مشاهده محتوای فایل اصلی پیکربندی سرور (server.conf)',
    descEn: 'View main server.conf configuration stanza on disk',
    category: 'splunk',
    explanationFa: 'فایل server.conf حاوی تنظیمات کلیدی نام سرور، پورت mgmtHostPort، نقش کلاستر و لایسنس سرور می‌باشد.'
  },
  {
    cmd: 'cat /opt/splunk/etc/system/local/inputs.conf 2>/dev/null || cat /opt/splunk_parallel/etc/system/local/inputs.conf 2>/dev/null',
    descFa: 'مشاهده تنظیمات پورت‌های ورودی دیتا و لیسنورها (inputs.conf)',
    descEn: 'Inspect inputs.conf data ingestion stanzas',
    category: 'splunk',
    explanationFa: 'این فایل تنظیمات پورت‌های دریافت ترافیک شبکه (مانند splunktcp://9997، udp://514 و http://8088) و مانیتورینگ فایل‌های لاگ را مشخص می‌کند.'
  },
  {
    cmd: 'cat /opt/splunk/etc/system/local/outputs.conf 2>/dev/null || cat /opt/splunk_parallel/etc/system/local/outputs.conf 2>/dev/null',
    descFa: 'مشاهده تنظیمات هدایت دیتا و فورواردینگ به ایندکسرها (outputs.conf)',
    descEn: 'View outputs.conf forwarding targets',
    category: 'splunk',
    explanationFa: 'این فایل آدرس IP و پورت ایندکسرهای مقصد (Target Indexers) و تنظیمات تعادل بار (Auto-LB) و SSL را تعیین می‌نماید.'
  },
  {
    cmd: 'df -h / /opt /tmp /var/log 2>/dev/null',
    descFa: 'بررسی فضای دیسک و پارتیشن‌های ذخیره‌سازی سرور',
    descEn: 'Check disk storage space and partition mounts',
    category: 'system',
    explanationFa: 'بررسی می‌کند که آیا پارتیشن‌های ذخیره‌سازی داده‌های اسپلانک (/opt و /var) دارای فضای کافی هستند یا خطای کمبود فضا رخ داده است.'
  },
  {
    cmd: 'free -m',
    descFa: 'بررسی میزان حافظه RAM مصرفی و آزاد سرور',
    descEn: 'Check available and used system RAM in megabytes',
    category: 'system',
    explanationFa: 'میزان حافظه رم اشغال‌شده، آزاد و حافظه بافر/کش سیستم‌عامل سرور را بر حسب مگابایت محاسبه و چاپ می‌کند.'
  },
  {
    cmd: 'uptime',
    descFa: 'مدت زمان روشن بودن سرور و میانگین بار پردازشی (Load Average)',
    descEn: 'System uptime and CPU load averages (1, 5, 15 min)',
    category: 'system',
    explanationFa: 'نشان می‌دهد سرور چه مدت روشن بوده و میانگین بار پردازنده در بازه‌های ۱، ۵ و ۱۵ دقیقه گذشته چقدر است.'
  },
  {
    cmd: 'ip addr show || ifconfig -a',
    descFa: 'مشاهده کارت‌های شبکه فیزیکی و مجازی و آدرس‌های IP سرور',
    descEn: 'Inspect network interfaces, subnets and IP addresses',
    category: 'network',
    explanationFa: 'آدرس‌های IP، ماسک شبکه و وضعیت UP/DOWN بودن تمامی کارت‌های شبکه فیزیکی و مجازی سرور را نمایش می‌دهد.'
  },
  {
    cmd: 'firewall-cmd --list-all 2>/dev/null || iptables -L -n -v --line-numbers 2>/dev/null',
    descFa: 'بررسی وضعیت فایروال، پورت‌های باز و قوانین iptables',
    descEn: 'Check firewalld status, allowed ports and iptables packet rules',
    category: 'network',
    explanationFa: 'قوانین دیوار آتش سیستم‌عامل RHEL/Linux را استخراج کرده تا مسدود بودن یا باز بودن پورت‌های ورودی مشخص گردد.'
  },
  {
    cmd: 'docker ps -a 2>/dev/null || echo "Docker daemon is in rootless/container host mode"',
    descFa: 'مشاهده کانتینرهای فعال و وضعیت استقرار داکر',
    descEn: 'List active Docker containers and runtime status',
    category: 'docker',
    explanationFa: 'وضعیت کانتینرهای اسپلانک، کلاستر کانتینری و پورت‌های مپ‌شده داکر را گزارش می‌دهد.'
  },
  {
    cmd: 'tail -n 25 /opt/splunk/var/log/splunk/splunkd.log 2>/dev/null || tail -n 25 /opt/splunk_parallel/var/log/splunk/splunkd.log 2>/dev/null',
    descFa: 'مشاهده ۲۵ خط آخر از لاگ اصلی موتور پردازشی اسپلانک (splunkd.log)',
    descEn: 'Tail last 25 lines of core splunkd.log daemon stream',
    category: 'splunk',
    explanationFa: 'رویدادهای زنده موتور اسپلانک شامل هارت‌بیت‌ها، خطاهای احتمالی کانفیگ و استریم داده‌ها را نمایش می‌دهد.'
  }
];

// Helper: Syntax Colorizer for Shell Command Line
export const renderColorizedCommand = (commandStr: string) => {
  if (!commandStr) return null;

  // Split on pipes and logical operators to highlight pipeline structure
  const segments = commandStr.split(/(\s*\|\|\s*|\s*&&\s*|\s*\|\s*|\s*2>&1\s*|\s*2>\/dev\/null\s*)/);

  return (
    <span className="font-mono text-[11px] leading-relaxed select-text">
      {segments.map((seg, sIdx) => {
        const trimmed = seg.trim();
        if (['|', '&&', '||', '2>&1', '2>/dev/null'].includes(trimmed)) {
          return (
            <span key={sIdx} className="text-amber-400 font-extrabold px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30 mx-0.5 shadow-sm">
              {seg}
            </span>
          );
        }

        const tokens = seg.split(/(\s+)/);
        return (
          <span key={sIdx}>
            {tokens.map((token, tIdx) => {
              if (/^\s+$/.test(token)) {
                return <span key={tIdx}>{token}</span>;
              }

              // 1. Binaries and commands
              if (tIdx === 0 || /^(splunk|docker|python3|python|ss|ping|traceroute|tracepath|systemctl|firewall-cmd|iptables|fuser|netstat|cat|grep|tar|chmod|chown|cp|mkdir|rm|kill|pgrep|free|df|ip|hostname|bash|sh|tail|head|ls|find|curl|wget|openssl|nc|netcat)$/i.test(token)) {
                return (
                  <span key={tIdx} className="text-yellow-300 font-black tracking-wide bg-yellow-500/10 px-1 py-0.2 rounded border border-yellow-500/20">
                    {token}
                  </span>
                );
              }

              // 2. Subcommands and actions
              if (/^(status|start|stop|restart|btool|check|port-scan|flows|connections|overview|auto-heal|deploy|clone|install|list-all|show|ps|run|exec)$/i.test(token)) {
                return (
                  <span key={tIdx} className="text-cyan-300 font-bold bg-cyan-950/40 px-1 py-0.2 rounded border border-cyan-800/40">
                    {token}
                  </span>
                );
              }

              // 3. Flags and options (-c, -tulpn, --permanent, --zone=public)
              if (token.startsWith('-')) {
                return (
                  <span key={tIdx} className="text-violet-300 font-mono font-medium">
                    {token}
                  </span>
                );
              }

              // 4. File paths and config filenames (/opt/..., inputs.conf, server.conf, splunkd.log)
              if (token.includes('/') || /\.(conf|log|sh|py|tar\.gz|lic|json|xml|txt)$/i.test(token)) {
                return (
                  <span key={tIdx} className="text-sky-300 underline underline-offset-2 decoration-sky-500/40 font-mono">
                    {token}
                  </span>
                );
              }

              // 5. IP addresses & Ports (e.g. 10.18.32.74, 9997, 8000, 8089)
              if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/.test(token) || /^(8000|8089|9997|8088|514|1514|8001|8090|9998|8192|8193|22|53|443|80)$/.test(token)) {
                return (
                  <span key={tIdx} className="text-emerald-300 font-mono font-bold bg-emerald-950/40 px-1 rounded border border-emerald-800/40">
                    {token}
                  </span>
                );
              }

              // 6. Environment variables (SPLUNK_HOME=..., SPLUNK_RUN_AS_ROOT=1)
              if (token.includes('=')) {
                const [k, v] = token.split('=');
                return (
                  <span key={tIdx} className="font-mono">
                    <span className="text-purple-300 font-bold">{k}</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-cyan-300">{v}</span>
                  </span>
                );
              }

              return <span key={tIdx} className="text-slate-200">{token}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
};

// Helper: Colorizer for Server STDOUT output
export const renderColorizedOutput = (rawOutput: string) => {
  if (!rawOutput) return null;
  const lines = rawOutput.split('\n');

  return (
    <div className="space-y-0.5 font-mono text-[11px] leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-2" />;

        // Stanza header [default] or [splunktcp://9997]
        if (/^\[.+\]$/.test(line.trim())) {
          return (
            <div key={idx} className="text-yellow-300 font-bold bg-yellow-950/30 px-2 py-0.5 rounded border-l-2 border-yellow-400">
              {line}
            </div>
          );
        }

        // Config key = value line
        if (/^\s*[a-zA-Z0-9_.-]+\s*=\s*.+$/.test(line)) {
          const match = line.match(/^(\s*)([a-zA-Z0-9_.-]+)(\s*=\s*)(.*)$/);
          if (match) {
            return (
              <div key={idx} className="text-slate-300 pl-2 border-l border-slate-800">
                <span>{match[1]}</span>
                <span className="text-purple-300 font-bold">{match[2]}</span>
                <span className="text-slate-500 font-bold">{match[3]}</span>
                <span className="text-cyan-300 font-medium">{match[4]}</span>
              </div>
            );
          }
        }

        // Error lines
        if (/ERROR|FATAL|FAILED|CRITICAL|FAIL|Errno|Exception/i.test(line)) {
          return (
            <div key={idx} className="text-rose-300 font-bold bg-rose-950/30 px-2 py-0.5 rounded border-l-2 border-rose-500">
              {line}
            </div>
          );
        }

        // Warning lines
        if (/WARN|WARNING|TIMEOUT|DEGRADED/i.test(line)) {
          return (
            <div key={idx} className="text-amber-300 font-semibold bg-amber-950/20 px-2 py-0.5 rounded border-l-2 border-amber-500">
              {line}
            </div>
          );
        }

        // Success / Online lines
        if (/SUCCESS|LISTEN|OPEN|ESTABLISHED|ONLINE|HEALTHY|RUNNING|OK|PASS/i.test(line)) {
          return (
            <div key={idx} className="text-emerald-300 font-medium bg-emerald-950/15 px-2 py-0.5 rounded border-l-2 border-emerald-500">
              {line}
            </div>
          );
        }

        // Standard neutral line
        return (
          <div key={idx} className="text-slate-300 pl-2">
            {line}
          </div>
        );
      })}
    </div>
  );
};

// Helper: Tool Category Color Schemes
const getToolColorConfig = (toolId?: string) => {
  switch (toolId) {
    case 'network_toolbox':
    case 'network_sources':
      return {
        badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        cardBorder: 'border-cyan-500/30 hover:border-cyan-400',
        icon: Radio,
        labelFa: '🌐 جعبه ابزار شبکه و پورت‌ها',
        labelEn: 'Network & Port Toolbox'
      };
    case 'ai_diagnostics':
    case 'autonomous_agent':
    case 'health_audit':
      return {
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        cardBorder: 'border-emerald-500/30 hover:border-emerald-400',
        icon: Sparkles,
        labelFa: '✨ هوش مصنوعی و خوددرمانگر سلامت',
        labelEn: 'AI Diagnostics & Auto-Healer'
      };
    case 'cluster_deployer':
    case 'topology':
    case 'architecture_auditor':
    case 'docker_k8s':
      return {
        badgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        cardBorder: 'border-violet-500/30 hover:border-violet-400',
        icon: Layers,
        labelFa: '🏛️ معماری SVA، استقرار و داکر',
        labelEn: 'SVA Architecture & Deployer'
      };
    case 'virtual_server_wipe':
    case 'server_decommission':
      return {
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        cardBorder: 'border-amber-500/30 hover:border-amber-400',
        icon: Flame,
        labelFa: '🔥 پاکسازی و مدیریت سرور',
        labelEn: 'Server Wipe & Decommission'
      };
    case 'live_logs':
      return {
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        cardBorder: 'border-rose-500/30 hover:border-rose-400',
        icon: Terminal,
        labelFa: '📜 پایش زنده لاگ‌ها و کرش',
        labelEn: 'splunkd.log Live Stream'
      };
    case 'commercial_license':
    case 'admin_security':
      return {
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        cardBorder: 'border-amber-500/30 hover:border-amber-400',
        icon: Shield,
        labelFa: '🛡️ لایسنس تجاری و امنیت RBAC',
        labelEn: 'License & Security'
      };
    default:
      return {
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
        cardBorder: 'border-slate-800 hover:border-slate-700',
        icon: Terminal,
        labelFa: '💻 سرویس خط فرمان سرور',
        labelEn: 'Server Shell Bus'
      };
  }
};

export const ServerCommandPromptConsole: React.FC<ServerCommandPromptConsoleProps> = ({
  lang,
  onClose,
  isFloating = false,
  onToggleFloating,
  filterToolId,
  initialActiveTab = 'history'
}) => {
  const isFa = lang === 'fa';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'history' | 'prompt' | 'by_tool' | 'raw_log' | 'presets'>(initialActiveTab);

  // Interactive Command Prompt State
  const [inputCommand, setInputCommand] = useState('');
  const [customCwd, setCustomCwd] = useState('/opt/splunk');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalOutputs, setTerminalOutputs] = useState<Array<{
    id: string;
    command: string;
    cwd: string;
    timestamp: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    explanationFa?: string;
  }>>([]);

  // Command history navigation (Up / Down arrow keys)
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);

  // Live Command Stream State from Server
  const [serverLogs, setServerLogs] = useState<ServerCommandLogEntry[]>([]);
  const [rawServerDiskFile, setRawServerDiskFile] = useState<string>('');
  const [isLoadingDiskFile, setIsLoadingDiskFile] = useState(false);
  const [streamStats, setStreamStats] = useState<ServerCommandStreamStats>({
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    runningCount: 0,
    activeToolsCount: 0
  });
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>(filterToolId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'running'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const promptBottomRef = useRef<HTMLDivElement>(null);
  const historyBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch command history from server
  const fetchCommandHistory = async () => {
    try {
      const res = await fetch('/api/system/command-history');
      if (res.ok) {
        const data = await res.json();
        if (data.entries) {
          setServerLogs(data.entries);
        }
        if (data.stats) {
          setStreamStats(data.stats);
        }
      }
    } catch (_) {}
  };

  // Fetch raw server-commands.log disk file content
  const fetchDiskLogFile = async () => {
    setIsLoadingDiskFile(true);
    try {
      const res = await fetch('/api/system/command-log/file');
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setRawServerDiskFile(data.content);
        }
      }
    } catch (_) {} finally {
      setIsLoadingDiskFile(false);
    }
  };

  useEffect(() => {
    fetchCommandHistory();
    const interval = setInterval(fetchCommandHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  // Server-Sent Events (SSE) for sub-millisecond live updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/system/command-stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'command_start' || payload.type === 'command_finish' || payload.type === 'command_added') {
            const entry: ServerCommandLogEntry = payload.entry;
            setServerLogs((prev) => {
              const existingIdx = prev.findIndex((e) => e.id === entry.id);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = entry;
                return next;
              }
              return [entry, ...prev].slice(0, 1000);
            });
            if (payload.stats) {
              setStreamStats(payload.stats);
            }
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (autoScroll && activeTab === 'prompt') {
      promptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutputs, autoScroll, activeTab]);

  // Execute command on server
  const handleExecuteCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || inputCommand).trim();
    if (!cmd || isExecuting) return;

    setIsExecuting(true);
    const startTime = Date.now();

    // Add to local history list for Up/Down arrows
    setLocalHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)].slice(0, 50));
    setHistoryIndex(-1);

    try {
      const token = localStorage.getItem('splunk_doctor_session_token');
      const res = await fetch('/api/system/terminal/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          command: cmd,
          cwd: customCwd,
          toolId: 'command_prompt',
          toolNameFa: 'خط فرمان زنده سرور (Command Prompt)',
          toolNameEn: 'Interactive Server Shell'
        })
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      const outputItem = {
        id: 'out-' + Date.now(),
        command: cmd,
        cwd: customCwd,
        timestamp: new Date().toLocaleTimeString(),
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode !== undefined ? data.exitCode : (data.success ? 0 : 1),
        durationMs
      };

      setTerminalOutputs((prev) => [...prev, outputItem]);
      if (!cmdToRun) {
        setInputCommand('');
      }

      // Refresh full history
      fetchCommandHistory();
    } catch (err: any) {
      setTerminalOutputs((prev) => [
        ...prev,
        {
          id: 'out-' + Date.now(),
          command: cmd,
          cwd: customCwd,
          timestamp: new Date().toLocaleTimeString(),
          stdout: '',
          stderr: err.message || 'Connection error to server backend',
          exitCode: 1,
          durationMs: Date.now() - startTime
        }
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Keyboard navigation for command prompt
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (localHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, localHistory.length - 1);
        setHistoryIndex(nextIndex);
        setInputCommand(localHistory[nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInputCommand(localHistory[prevIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  // Clear Terminal Output
  const handleClearTerminal = () => {
    setTerminalOutputs([]);
  };

  // Clear Server Command History
  const handleClearServerLogs = async () => {
    try {
      await fetch('/api/system/command-log/clear', { method: 'POST' });
      setServerLogs([]);
      setStreamStats({
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        runningCount: 0,
        activeToolsCount: 0
      });
    } catch (_) {}
  };

  // Copy command to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy All Recorded Command Logs as Clean Formatted Text to Clipboard
  const handleCopyAllLogs = () => {
    if (serverLogs.length === 0) return;
    const header = `======================================================================
SPLUNK CLUSTER DOCTOR - COMPLETE SERVER COMMANDS & EXECUTION LOG
Generated At: ${new Date().toLocaleString(isFa ? 'fa-IR' : 'en-US')}
Total Commands Executed: ${serverLogs.length} | Success: ${streamStats.successCount} | Failed: ${streamStats.failedCount}
======================================================================\n\n`;

    const logsText = serverLogs
      .slice()
      .reverse()
      .map((entry, idx) => {
        const timeStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString(isFa ? 'fa-IR' : 'en-US') : 'N/A';
        const statusLabel = entry.status === 'success' ? 'SUCCESS (Exit Code 0)' : `FAILED (Exit Code ${entry.exitCode ?? 1})`;
        return `[#${idx + 1}] [${timeStr}]
TOOL/ACTION: ${entry.toolNameFa || entry.toolId || 'System'} (${entry.toolNameEn || 'System'})
USER & DIR:  ${entry.user || 'root'}@${entry.workingDir || '/opt/splunk'}
STATUS:      ${statusLabel} | DURATION: ${entry.durationMs ?? 0}ms
COMMAND:
$ ${entry.command}

STDOUT:
${entry.stdout ? entry.stdout.trim() : '(no stdout)'}
${entry.stderr ? `STDERR / ERROR:\n${entry.stderr.trim()}\n` : ''}----------------------------------------------------------------------`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(header + logsText);
    setCopiedId('all-logs');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copy Exact Server-Side Log File (logs/server-commands.log)
  const handleCopyServerDiskFile = async () => {
    setIsLoadingDiskFile(true);
    try {
      const res = await fetch('/api/system/command-log/file');
      if (res.ok) {
        const data = await res.json();
        const textToCopy = data.content || '';
        await navigator.clipboard.writeText(textToCopy);
        setRawServerDiskFile(textToCopy);
        setCopiedId('disk-file');
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch (_) {} finally {
      setIsLoadingDiskFile(false);
    }
  };

  // Download complete server-commands.log file to browser
  const handleDownloadLogFile = async () => {
    try {
      const res = await fetch('/api/system/command-log/file');
      const data = await res.json();
      const content = data.content || '';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `server-commands-${new Date().toISOString().slice(0, 10)}.log`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
  };

  // Export all commands as runnable bash script
  const handleExportBashScript = () => {
    const header = `#!/usr/bin/env bash\n# Splunk Cluster Doctor - All Executed Server Commands Log\n# Generated At: ${new Date().toISOString()}\n# Total Commands: ${serverLogs.length}\n\nset -e\n\n`;
    const commandsList = serverLogs
      .slice()
      .reverse()
      .map((entry, idx) => {
        return `# [${idx + 1}] Tool: ${entry.toolNameEn || entry.toolId || 'CLI'} | Timestamp: ${entry.timestamp} | Exit: ${entry.exitCode}\n# Dir: ${entry.workingDir || '/opt/splunk'}\n${entry.command}\n`;
      })
      .join('\n');

    const blob = new Blob([header + commandsList], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splunk_server_executed_commands_${new Date().toISOString().slice(0, 10)}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered logs
  const filteredLogs = serverLogs.filter((entry) => {
    if (selectedToolFilter !== 'all' && entry.toolId !== selectedToolFilter) {
      return false;
    }
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCmd = entry.command?.toLowerCase().includes(q);
      const matchTool = (entry.toolNameFa || '').toLowerCase().includes(q) || (entry.toolNameEn || '').toLowerCase().includes(q);
      const matchOut = (entry.stdout || '').toLowerCase().includes(q) || (entry.stderr || '').toLowerCase().includes(q);
      if (!matchCmd && !matchTool && !matchOut) return false;
    }
    return true;
  });

  // Group tools for "by_tool" tab
  const toolGroups = React.useMemo(() => {
    const map: Record<string, { toolId: string; nameFa: string; nameEn: string; count: number; lastCommand?: ServerCommandLogEntry }> = {};
    for (const entry of serverLogs) {
      const tId = entry.toolId || 'unknown_tool';
      if (!map[tId]) {
        map[tId] = {
          toolId: tId,
          nameFa: entry.toolNameFa || tId,
          nameEn: entry.toolNameEn || tId,
          count: 0,
          lastCommand: entry
        };
      }
      map[tId].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [serverLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`flex flex-col bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${isFloating ? 'h-full' : 'min-h-[640px] max-h-[85vh]'}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                {isFa ? 'کنسول خط فرمان و تحلیل اجرای زنده فرامین' : 'Server Command Prompt & Live Execution Bus'}
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  Colorized CLI &amp; System Telemetry
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isFa
                ? 'مشاهده کامل دستور صادرشده برای هر کلیک در سرور، تفکیک پارامترها با کد رنگ و نتایج stdout/stderr'
                : 'Inspect exact commands triggered per click with colorized syntax, flags, working directory, and stdout'}
            </p>
          </div>
        </div>

        {/* Stats & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2.5 text-xs bg-black/70 px-3.5 py-1.5 rounded-full border border-slate-800 font-mono shadow-inner">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {serverLogs.length} {isFa ? 'دستور ثبت‌شده' : 'commands'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-300 font-bold">
              ✓ {streamStats.successCount} {isFa ? 'موفق' : 'ok'}
            </span>
            {streamStats.failedCount > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-rose-400 font-extrabold bg-rose-950/40 px-2 py-0.2 rounded-full border border-rose-500/30">
                  ✗ {streamStats.failedCount} {isFa ? 'خطا' : 'failed'}
                </span>
              </>
            )}
          </div>

          {/* 📋 1-Click Copy All Executed Logs Button */}
          <button
            onClick={handleCopyAllLogs}
            title={isFa ? 'کپی متن تمام دستورات، خروجی‌ها و نتایج در کلیپ‌بورد' : 'Copy all recorded commands & stdout to clipboard'}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition shadow-sm font-bold ${
              copiedId === 'all-logs'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            {copiedId === 'all-logs' ? <Check className="w-3.5 h-3.5 text-white animate-bounce" /> : <Copy className="w-3.5 h-3.5 text-emerald-300" />}
            <span>{copiedId === 'all-logs' ? (isFa ? '✓ کپی شد!' : 'Copied!') : (isFa ? '📋 کپی تمام لاگ‌ها' : 'Copy All Logs')}</span>
          </button>

          {/* 📄 Copy Exact Server File (server-commands.log) */}
          <button
            onClick={handleCopyServerDiskFile}
            disabled={isLoadingDiskFile}
            title={isFa ? 'دریافت و کپی مستقیم محتوای فایل server-commands.log از روی دیسک سرور' : 'Fetch and copy raw server-commands.log file from disk'}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition shadow-sm ${
              copiedId === 'disk-file'
                ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700 hover:border-cyan-500/40'
            }`}
          >
            {copiedId === 'disk-file' ? <Check className="w-3.5 h-3.5 text-white" /> : <FileCode className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden md:inline">{copiedId === 'disk-file' ? (isFa ? '✓ فایل کپی شد' : 'File Copied') : (isFa ? 'کپی فایل لاگ سرور' : 'Copy Log File')}</span>
          </button>

          {/* 💾 Download Log File */}
          <button
            onClick={handleDownloadLogFile}
            title={isFa ? 'دانلود مستقیم فایل server-commands.log' : 'Download server-commands.log file'}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline font-sans">{isFa ? 'دانلود لاگ (.log)' : 'Download .log'}</span>
          </button>

          <button
            onClick={handleExportBashScript}
            title={isFa ? 'دانلود تمام دستورات به عنوان اسکریپت Bash (.sh)' : 'Download all commands as Bash script (.sh)'}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline font-sans">{isFa ? 'اسکریپت (.sh)' : 'Export .sh'}</span>
          </button>

          {onToggleFloating && (
            <button
              onClick={onToggleFloating}
              title={isFloating ? (isFa ? 'بزرگنمایی' : 'Maximize') : (isFa ? 'تبدیل به پنجره شناور (PiP)' : 'Pop out into floating PiP')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition"
            >
              {isFloating ? <Maximize2 className="w-3.5 h-3.5 text-violet-400" /> : <Minimize2 className="w-3.5 h-3.5 text-violet-400" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Color Code Legend & Guidance Bar */}
      <div className="px-4 py-2 bg-black/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] select-none">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-sans font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {isFa ? 'راهنمای کد رنگ‌ها:' : 'Color Coding Legend:'}
          </span>
          <span className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-mono font-bold">
            باینری و دستور اصلی (Binary)
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
            زیرفرمان و اکشن (Subcommand)
          </span>
          <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">
            فلگ‌ها و پارامترها (-flags)
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono">
            مسیر و فایل‌ها (/path/file)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
            IP و پورت‌ها (Socket:Port)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold">
            پایپلاین (| &amp;&amp;)
          </span>
        </div>

        <div className="text-[10px] text-slate-500 font-sans">
          {isFa ? 'کلیک روی هر دستور = کپی فوری' : 'Click command to copy'}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isFa ? 'جریان زنده فرامین کلیک‌ها و ابزارها' : 'Live Tool Commands & Click Stream'}</span>
            <span className="px-2 py-0.2 bg-black/40 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
              {serverLogs.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('raw_log');
              fetchDiskLogFile();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'raw_log'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-300" />
            <span>{isFa ? '📄 متن یکپارچه لاگ‌ها (Raw Log)' : '📄 Raw Log View'}</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'prompt'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isFa ? 'خط فرمان تعاملی سرور (CLI)' : 'Interactive Server Shell'}</span>
          </button>

          <button
            onClick={() => setActiveTab('by_tool')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'by_tool'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-violet-300" />
            <span>{isFa ? 'تفکیک بر اساس ابزارها' : 'Group by Tool'}</span>
            <span className="px-2 py-0.2 bg-black/40 rounded-full text-[10px] font-mono text-slate-300">
              {toolGroups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'دستورات آماده عیب‌یابی سرور' : 'Diagnostic Presets'}</span>
          </button>
        </div>

        {activeTab === 'history' && (
          <button
            onClick={handleClearServerLogs}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-rose-950/30 border border-slate-700/60 hover:border-rose-500/40 transition"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>{isFa ? 'پاک کردن لاگ‌ها' : 'Clear Log History'}</span>
          </button>
        )}

        {activeTab === 'prompt' && (
          <button
            onClick={handleClearTerminal}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>{isFa ? 'پاک کردن خروجی‌ها' : 'Clear Screen'}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950 font-sans text-xs flex flex-col">
        {/* TAB 1: Live All Tools Command History */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col p-4 space-y-3.5">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isFa ? 'جستجوی دقیق در متن دستور، نام ابزار، مسیر فایل و خروجی...' : 'Search command text, tool, file paths, stdout...'}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="all">{isFa ? 'همه وضعیت‌ها (موفق/خطا)' : 'All Statuses'}</option>
                  <option value="success">{isFa ? 'فقط موفقیت‌آمیز (Exit 0)' : 'Only Success'}</option>
                  <option value="failed">{isFa ? 'فقط خطاها (Exit != 0)' : 'Only Failed'}</option>
                  <option value="running">{isFa ? 'در حال اجرا (Running)' : 'Only Running'}</option>
                </select>

                {/* Tool Filter */}
                <select
                  value={selectedToolFilter}
                  onChange={(e) => setSelectedToolFilter(e.target.value)}
                  className="bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none max-w-[220px]"
                >
                  <option value="all">{isFa ? 'تمامی ابزارها' : 'All Tools'}</option>
                  {toolGroups.map((tg) => (
                    <option key={tg.toolId} value={tg.toolId}>
                      {isFa ? tg.nameFa : tg.nameEn} ({tg.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Command History List */}
            <div className="flex-1 bg-black/90 rounded-2xl border border-slate-800/90 p-3.5 overflow-y-auto space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <Activity className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-sm font-bold text-slate-400">
                    {isFa ? 'هیچ دستوری با فیلترهای جاری ثبت نشده است.' : 'No command executions match current filters.'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {isFa ? 'روی هر ابزار یا دکمه در برنامه کلیک کنید تا دستور صادرشده فوراً اینجا ظاهر شود.' : 'Click any button or tool across the app to see commands appear in real time.'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((entry) => {
                  const isExpanded = expandedLogIds.has(entry.id);
                  const toolStyle = getToolColorConfig(entry.toolId);
                  const ToolIcon = toolStyle.icon;

                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 bg-slate-900/85 hover:bg-slate-900 rounded-xl border ${toolStyle.cardBorder} transition-all space-y-2.5 shadow-md`}
                    >
                      {/* Top Header Row with Color Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Success/Error Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1 shadow-sm ${
                              entry.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : entry.status === 'failed'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            }`}
                          >
                            {entry.status === 'success' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>EXIT 0 (SUCCESS)</span>
                              </>
                            ) : entry.status === 'failed' ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>EXIT {entry.exitCode || 1} (FAILED)</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 animate-spin" />
                                <span>RUNNING...</span>
                              </>
                            )}
                          </span>

                          {/* Tool Name Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${toolStyle.badgeBg}`}>
                            <ToolIcon className="w-3 h-3" />
                            <span>{isFa ? entry.toolNameFa || entry.toolId : entry.toolNameEn || entry.toolId}</span>
                          </span>

                          {/* Timestamp */}
                          <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                          </span>

                          {/* Duration */}
                          {entry.durationMs !== undefined && (
                            <span className="px-2 py-0.2 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold">
                              ⏱ {entry.durationMs}ms
                            </span>
                          )}

                          {/* Working Dir */}
                          {entry.workingDir && (
                            <span className="text-slate-500 text-[10px] font-mono">
                              📂 {entry.workingDir}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(entry.command, entry.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title={isFa ? 'کپی دستور' : 'Copy command'}
                          >
                            {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => {
                              setInputCommand(entry.command);
                              setActiveTab('prompt');
                              handleExecuteCommand(entry.command);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition"
                            title={isFa ? 'اجرای مجدد در خط فرمان' : 'Re-run in shell'}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => toggleExpand(entry.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title={isFa ? 'مشاهده کامل خروجی سرور' : 'Toggle stdout/stderr'}
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>
                      </div>

                      {/* Color-Coded Command Box */}
                      <div className="bg-black/90 p-3 rounded-xl border border-slate-800 overflow-x-auto select-all shadow-inner">
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800/80">
                          <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                            <span className="text-emerald-400">root@server</span>
                            <span>:</span>
                            <span className="text-cyan-400">{entry.workingDir || '/opt/splunk'}</span>
                            <span className="text-amber-400">#</span>
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            ID: {entry.id}
                          </span>
                        </div>
                        {renderColorizedCommand(entry.command)}
                      </div>

                      {/* Expanded Details: Colorized STDOUT & STDERR */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800 space-y-3">
                          {entry.stdout ? (
                            <div className="space-y-1.5">
                              <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isFa ? 'خروجی استاندارد سرور با تفکیک رنگ (STDOUT):' : 'Colorized Standard Output (STDOUT):'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {entry.stdout.split('\n').length} {isFa ? 'خط خروجی' : 'lines'}
                                </span>
                              </div>
                              <div className="bg-black/95 p-3 rounded-xl border border-emerald-900/40 text-slate-200 text-[11px] max-h-64 overflow-y-auto select-text shadow-inner">
                                {renderColorizedOutput(entry.stdout)}
                              </div>
                            </div>
                          ) : null}

                          {entry.stderr ? (
                            <div className="space-y-1.5">
                              <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {isFa ? 'پیام‌ها و خطاهای سرور (STDERR):' : 'Standard Error (STDERR):'}
                              </div>
                              <pre className="bg-black/95 p-3 rounded-xl border border-rose-900/40 text-rose-300 whitespace-pre-wrap text-[11px] max-h-48 overflow-y-auto select-text leading-relaxed shadow-inner">
                                {entry.stderr}
                              </pre>
                            </div>
                          ) : null}

                          {!entry.stdout && !entry.stderr && (
                            <div className="text-[11px] text-slate-500 italic p-2 bg-black/40 rounded-lg">
                              {isFa ? 'این دستور بدون چاپ متن در خروجی با کد ۰ با موفقیت پایان یافت.' : 'Command completed silently with exit code 0.'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: Integrated Raw Log View (نمایش متن یکپارچه و کپی مستقیم فایل لاگ سرور) */}
        {activeTab === 'raw_log' && (
          <div className="flex-1 flex flex-col p-4 space-y-3 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>{isFa ? 'متن یکپارچه لاگ‌های سرور (logs/server-commands.log)' : 'Raw Server Commands Log Stream'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {serverLogs.length} {isFa ? 'دستور' : 'entries'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFa
                      ? 'محتوای کامل و پیوسته تمام دستورات صادرشده، کاربر، دایرکتوری و خروجی‌های stdout/stderr با یک کلیک قابل کپی یا دانلود است.'
                      : 'Full stream of executed commands, working directories, timestamps, and raw stdout/stderr logs.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDiskLogFile}
                  disabled={isLoadingDiskFile}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingDiskFile ? 'animate-spin' : ''}`} />
                  <span>{isFa ? 'تازه‌سازی متن فایل' : 'Refresh File'}</span>
                </button>

                <button
                  onClick={handleCopyAllLogs}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition shadow-sm ${
                    copiedId === 'all-logs'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                  }`}
                >
                  {copiedId === 'all-logs' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-emerald-300" />}
                  <span>{copiedId === 'all-logs' ? (isFa ? '✓ متن کپی شد!' : 'Copied!') : (isFa ? '📋 کپی کل متن لاگ‌ها' : 'Copy Full Raw Log')}</span>
                </button>

                <button
                  onClick={handleDownloadLogFile}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isFa ? 'دانلود فایل (.log)' : 'Download .log'}</span>
                </button>
              </div>
            </div>

            {/* Raw Log Box with Line Numbers */}
            <div className="flex-1 bg-black/95 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto min-h-[380px] shadow-inner select-text">
              {rawServerDiskFile ? (
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 font-mono text-[11px] select-all">
                  {rawServerDiskFile}
                </pre>
              ) : serverLogs.length > 0 ? (
                <div className="space-y-4">
                  {serverLogs.slice().reverse().map((entry, idx) => {
                    const timeStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString(isFa ? 'fa-IR' : 'en-US') : 'N/A';
                    const isSuccess = entry.status === 'success';
                    return (
                      <div key={entry.id} className="pb-3 border-b border-slate-900/80 space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <span className="text-amber-400 font-bold font-mono">[#{idx + 1}]</span>
                          <span className="text-slate-400">{timeStr}</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-cyan-400">{entry.user || 'root'}@{entry.workingDir || '/opt/splunk'}</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-yellow-400 font-sans">{entry.toolNameFa || entry.toolId}</span>
                          <span className="text-slate-600">|</span>
                          <span className={isSuccess ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {isSuccess ? 'Exit 0' : `Exit ${entry.exitCode ?? 1}`} ({entry.durationMs ?? 0}ms)
                          </span>
                        </div>
                        <div className="text-yellow-300 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-900 select-all">
                          $ {entry.command}
                        </div>
                        {entry.stdout && (
                          <pre className="text-slate-300 bg-black/60 p-2.5 rounded-lg border border-slate-900 whitespace-pre-wrap select-all">
                            {entry.stdout.trim()}
                          </pre>
                        )}
                        {entry.stderr && (
                          <pre className="text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 whitespace-pre-wrap select-all">
                            {entry.stderr.trim()}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 space-y-2">
                  <FileCode className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-slate-400 font-bold">{isFa ? 'هنوز دستوری ثبت نشده است.' : 'No commands executed yet.'}</p>
                  <p className="text-xs text-slate-600 font-sans">
                    {isFa ? 'به محض کلیک روی دکمه‌های عیب‌یابی یا ابزارها، لاگ کامل اینجا ثبت می‌شود.' : 'Commands will populate here as tools run in background.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Command Prompt */}
        {activeTab === 'prompt' && (
          <div className="flex-1 flex flex-col p-4 space-y-4">
            {/* System Info Banner */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-emerald-400 font-bold">● HOST:</span>
                <span className="text-slate-300 font-mono">rhel-splunk-doctor</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">USER:</span>
                <span className="text-slate-300 font-mono">root (UID 0)</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">WORKING DIR:</span>
                <input
                  type="text"
                  value={customCwd}
                  onChange={(e) => setCustomCwd(e.target.value)}
                  className="bg-black/60 px-2.5 py-1 rounded-lg border border-slate-700 text-cyan-300 text-[11px] font-mono w-40 focus:outline-none focus:border-cyan-500"
                  title={isFa ? 'مسیر اجرای دستور در سرور' : 'Working Directory'}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">
                  {isFa ? 'کلیدهای ↑ و ↓ برای فراخوانی تاریخچه' : 'Up/Down arrows for history'}
                </span>
              </div>
            </div>

            {/* Quick Command Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 font-sans text-xs shrink-0 flex items-center gap-1 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isFa ? 'فرمان‌های فوری:' : 'Quick Run:'}
              </span>
              {[
                'splunk status',
                'splunk btool check',
                'ss -tulpn',
                'ps aux | grep splunkd',
                'cat /opt/splunk/etc/system/local/server.conf',
                'cat /opt/splunk/etc/system/local/inputs.conf',
                'cat /opt/splunk/etc/system/local/outputs.conf',
                'df -h',
                'free -m'
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setInputCommand(cmd);
                    handleExecuteCommand(cmd);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-900/40 hover:text-emerald-300 hover:border-emerald-500/50 border border-slate-800 text-slate-300 shrink-0 font-mono text-[11px] transition shadow-sm"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Terminal Outputs Feed with Syntax Coloring */}
            <div className="flex-1 min-h-[260px] bg-black/95 p-4 rounded-2xl border border-slate-800 overflow-y-auto space-y-4 shadow-inner">
              {terminalOutputs.length === 0 ? (
                <div className="text-slate-500 py-10 text-center space-y-2">
                  <Terminal className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-slate-400 font-bold">{isFa ? 'ترمینال و خط فرمان آماده دریافت و اجرای دستورات است.' : 'Interactive Command Prompt is ready.'}</p>
                  <p className="text-[11px] text-slate-600 font-sans">
                    {isFa ? 'دستور شل لینوکس یا اسپلانک را در کادر زیر وارد کرده و دکمه اجرا یا کلید Enter را بزنید.' : 'Type any command below and press Enter.'}
                  </p>
                </div>
              ) : (
                terminalOutputs.map((out) => (
                  <div key={out.id} className="space-y-2 pb-3.5 border-b border-slate-900">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold font-mono">root@rhel-splunk-doctor</span>
                        <span className="text-slate-600">:</span>
                        <span className="text-cyan-400 font-mono">{out.cwd}</span>
                        <span className="text-amber-400 font-bold font-mono">#</span>
                        <div className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                          {renderColorizedCommand(out.command)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-slate-500">{out.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${out.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          Exit: {out.exitCode} ({out.durationMs}ms)
                        </span>
                        <button
                          onClick={() => handleCopy(out.command, out.id)}
                          className="p-1 hover:text-slate-200 text-slate-500 transition"
                          title="Copy command"
                        >
                          {copiedId === out.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {out.stdout && (
                      <div className="bg-black/80 p-3 rounded-xl border border-emerald-950/60 shadow-inner overflow-x-auto select-text">
                        {renderColorizedOutput(out.stdout)}
                      </div>
                    )}

                    {out.stderr && (
                      <div className="bg-black/80 p-3 rounded-xl border border-rose-950/60 shadow-inner overflow-x-auto select-text">
                        <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed text-[11px]">
                          {out.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={promptBottomRef} />
            </div>

            {/* Prompt Input Line */}
            <div className="flex items-center gap-2 p-2 bg-black border border-slate-700 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30 transition shadow-lg">
              <span className="text-emerald-400 font-bold select-none text-xs pl-2 font-mono flex items-center gap-1">
                <span>[root@splunk-doctor</span>
                <span className="text-cyan-400">{customCwd}</span>
                <span>]#</span>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isFa ? 'دستور شل را اینجا بنویسید (مثلاً: splunk status, ss -tulpn, cat server.conf)...' : 'Type Linux or Splunk command here...'}
                className="flex-1 bg-transparent text-emerald-200 placeholder-slate-600 focus:outline-none text-xs font-mono"
                disabled={isExecuting}
                autoFocus
              />
              <button
                onClick={() => handleExecuteCommand()}
                disabled={isExecuting || !inputCommand.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isExecuting || !inputCommand.trim()
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30'
                }`}
              >
                {isExecuting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isFa ? 'در حال اجرا...' : 'Executing...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{isFa ? 'اجرا (Enter)' : 'Run'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: By Tool Breakdown */}
        {activeTab === 'by_tool' && (
          <div className="flex-1 p-4 space-y-4 font-sans">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isFa ? 'تفکیک فرامین اجرایی سرور بر اساس ابزارهای سیستم' : 'Server Command Executions by Tool'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa
                  ? 'بر روی هر ابزار کلیک کنید تا کلیه فرامینی که در سرور اجرا نموده را همراه با کد رنگ و نتایج مشاهده کنید.'
                  : 'Click any tool to view all shell commands and outputs dispatched to the server environment.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {toolGroups.map((tg) => {
                const toolStyle = getToolColorConfig(tg.toolId);
                const ToolIcon = toolStyle.icon;

                return (
                  <div
                    key={tg.toolId}
                    onClick={() => {
                      setSelectedToolFilter(tg.toolId);
                      setActiveTab('history');
                    }}
                    className={`p-4 bg-slate-900/90 hover:bg-slate-850 rounded-2xl border ${toolStyle.cardBorder} cursor-pointer transition-all flex flex-col justify-between group shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${toolStyle.badgeBg}`}>
                          <ToolIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                            {isFa ? tg.nameFa : tg.nameEn}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {tg.toolId}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-extrabold">
                        {tg.count}
                      </span>
                    </div>

                    {tg.lastCommand && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                          <span>{isFa ? 'آخرین دستور اجرا شده:' : 'Latest command:'}</span>
                          <span className="font-mono text-slate-500">
                            {tg.lastCommand.timestamp ? new Date(tg.lastCommand.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <div className="bg-black/80 p-2 rounded-lg border border-slate-800 text-[11px] overflow-hidden">
                          {renderColorizedCommand(tg.lastCommand.command)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Presets & Diagnostic Scripts */}
        {activeTab === 'presets' && (
          <div className="flex-1 p-4 space-y-4 font-sans">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isFa ? 'فرمان‌های آماده و عیب‌یابی مستقیم سرور و اسپلانک' : 'Pre-built Diagnostic Commands & Server Inspections'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa
                  ? 'این دستورات همراه با توضیح دقیق عملکرد و نتیجه پیش‌بینی‌شده آماده اجرا در محیط واقعی هستند.'
                  : 'Ready-to-execute diagnostic commands with detailed explanations of behavior and outcome.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PRESET_COMMANDS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {isFa ? preset.descFa : preset.descEn}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                        {preset.category}
                      </span>
                    </div>

                    {/* Explanation */}
                    {preset.explanationFa && (
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        {isFa ? preset.explanationFa : preset.descEn}
                      </p>
                    )}

                    {/* Colorized Command Box */}
                    <div className="bg-black/90 p-2.5 rounded-xl border border-slate-800 overflow-x-auto select-all">
                      {renderColorizedCommand(preset.cmd)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleCopy(preset.cmd, `preset-${idx}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      {copiedId === `preset-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isFa ? 'کپی دستور' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setInputCommand(preset.cmd);
                        setActiveTab('prompt');
                        handleExecuteCommand(preset.cmd);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isFa ? 'اجرا در ترمینال' : 'Run in Shell'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
