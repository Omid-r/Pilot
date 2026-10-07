import React, { useEffect, useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  X, 
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { ParallelClusterState } from '../types';

interface SplunkWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  parallelClusterState: ParallelClusterState;
  hostIp?: string;
  isFa?: boolean;
}

export const SplunkWebModal: React.FC<SplunkWebModalProps> = ({
  isOpen,
  onClose,
  hostIp = '10.20.30.45',
  isFa = true
}) => {
  const [activeSplunkApp, setActiveSplunkApp] = useState<'search' | 'indexes' | 'inputs' | 'server_info'>('search');
  const [searchQuery, setSearchQuery] = useState('index=_internal | head 25 | stats count by sourcetype, log_level');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; timestamp: string; sourcetype: string; level: string; message: string }>>([
    { id: 1, timestamp: '2026-09-22 00:32:10.451', sourcetype: 'splunkd', level: 'INFO', message: 'Parallel instance Splunk Enterprise 9.2.1 web server started on port 8001.' },
    { id: 2, timestamp: '2026-09-22 00:32:11.102', sourcetype: 'splunkd', level: 'INFO', message: 'TCP Input processor listening on parallel port 9998 (isolated pipeline).' },
    { id: 3, timestamp: '2026-09-22 00:32:11.890', sourcetype: 'splunkd_access', level: 'INFO', message: '127.0.0.1 - admin "GET /en-US/api/sva/status HTTP/1.1" 200 482 - - - 3ms' },
    { id: 4, timestamp: '2026-09-22 00:32:12.304', sourcetype: 'metrics', level: 'INFO', message: 'group=queue, name=parsingQueue, current_size_kb=0, max_size_kb=10240, status=HEALTHY' },
    { id: 5, timestamp: '2026-09-22 00:32:13.011', sourcetype: 'license_usage', level: 'INFO', message: 'License Master slave connection established. Allocation pool: Active.' },
  ]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const webUrl = `http://${hostIp}:8001/en-US/app/launcher/home`;

  useEffect(() => {
    if (!isOpen) return;
    setIframeLoaded(false);
    setIframeBlocked(false);
  }, [isOpen, webUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-[#0b0f17] border-2 border-emerald-500/50 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-start transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Browser Top Window Chrome Bar */}
        <div className="bg-[#121926] border-b border-slate-800 p-3 sm:px-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-200 mr-3 border-r border-slate-700 pr-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'کنسول وب اسپلانک موازی (Splunk Web Staging)' : 'Splunk Web Staging Instance'}</span>
            </div>
          </div>

          {/* Fake Browser URL Bar */}
          <div className="flex-1 max-w-xl mx-2 bg-[#080c13] border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-mono text-emerald-400 shadow-inner">
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-500 font-bold">🔒 http://</span>
              <span className="text-white font-semibold">{hostIp}:</span>
              <span className="text-amber-400 font-black">8001</span>
              <span className="text-slate-400">/en-US/app/launcher/home</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1 text-slate-400 hover:text-white rounded transition"
                title={isFa ? 'کپی آدرس پورت ۸۰۰۱' : 'Copy URL'}
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={webUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition shadow-md shadow-emerald-500/20"
              title={isFa ? 'باز کردن در تب جدید مرورگر' : 'Open in New Tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isFa ? 'تب جدید' : 'New Tab'}</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              title={isFa ? 'بستن پنجره کنسول وب' : 'Close Web View'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Splunk Web Internal Top Navigation Bar */}
        <div className="bg-[#1f2937] text-white px-4 py-2 flex items-center justify-between border-b border-slate-700 text-xs shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-black text-sm tracking-tight text-white">
              <span className="text-amber-400 font-mono text-base">&gt;</span>
              <span>splunk</span>
              <span className="text-emerald-400 font-bold">&gt;enterprise</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0.2 rounded font-mono">
                PARALLEL :8001
              </span>
            </div>

            {/* Splunk Internal Apps Menu */}
            <div className="hidden md:flex items-center gap-1 text-slate-300">
              <button 
                onClick={() => setActiveSplunkApp('search')}
                className={`px-2.5 py-1 rounded transition font-medium ${activeSplunkApp === 'search' ? 'bg-black/30 text-white font-bold' : 'hover:bg-slate-700'}`}
              >
                Search & Reporting
              </button>
              <button 
                onClick={() => setActiveSplunkApp('indexes')}
                className={`px-2.5 py-1 rounded transition font-medium ${activeSplunkApp === 'indexes' ? 'bg-black/30 text-white font-bold' : 'hover:bg-slate-700'}`}
              >
                Settings &gt; Indexes
              </button>
              <button 
                onClick={() => setActiveSplunkApp('inputs')}
                className={`px-2.5 py-1 rounded transition font-medium ${activeSplunkApp === 'inputs' ? 'bg-black/30 text-white font-bold' : 'hover:bg-slate-700'}`}
              >
                Data Inputs (:9998)
              </button>
              <button 
                onClick={() => setActiveSplunkApp('server_info')}
                className={`px-2.5 py-1 rounded transition font-medium ${activeSplunkApp === 'server_info' ? 'bg-black/30 text-white font-bold' : 'hover:bg-slate-700'}`}
              >
                Server Controls
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono hidden sm:inline">User: <strong className="text-white">admin</strong></span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Online</span>
            </span>
          </div>
        </div>

        {/* Real Splunk Web target. The controls below remain available only as diagnostics fallback. */}
        <div className="relative flex-1 min-h-[420px] bg-white">
          {!iframeLoaded && !iframeBlocked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090d14] text-xs text-emerald-300 font-mono">
              Connecting to real Splunk Web at {hostIp}:8001...
            </div>
          )}
          {iframeBlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#090d14] text-center p-6">
              <div className="text-sm font-bold text-amber-300">Splunk Web could not be embedded in this view.</div>
              <div className="text-xs text-slate-400 max-w-lg">
                The target may reject iframe embedding via X-Frame-Options/CSP. Use “New Tab” above to open the real Splunk Web instance directly.
              </div>
              <a href={webUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl">
                Open real Splunk Web
              </a>
            </div>
          )}
          <iframe
            title="Real Splunk Web"
            src={webUrl}
            className="w-full h-full min-h-[420px] border-0 bg-white"
            referrerPolicy="no-referrer"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeBlocked(true)}
          />
        </div>

        {/* Real Splunk Web is the primary browser surface. Legacy simulated controls are intentionally removed. */}
        {/* Footer */}
        <div className="bg-[#121926] border-t border-slate-800 p-3 sm:px-5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">محیط ایزوله تستی با پورت‌های مجزا بدون تداخل با سرور اصلی</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            {isFa ? 'بستن شبیه‌ساز وب' : 'Close Web View'}
          </button>
        </div>
      </div>
    </div>
  );
};
