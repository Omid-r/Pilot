import React, { useEffect, useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  X, 
  ShieldCheck
} from 'lucide-react';
interface SplunkWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostIp?: string;
  isFa?: boolean;
}

export const SplunkWebModal: React.FC<SplunkWebModalProps> = ({
  isOpen,
  onClose,
  hostIp,
  isFa = true
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const targetHost = hostIp || (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1');
  const webUrl = `http://${targetHost}:8001/en-US/app/launcher/home`;

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
              <span className="text-white font-semibold">{targetHost}:</span>
              <span className="text-amber-400 font-black">8001</span>
              <span className="text-slate-400">/en-US/app/launcher/home</span>
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
            {isFa ? 'بستن Splunk Web' : 'Close Splunk Web'}
          </button>
        </div>
      </div>
    </div>
  );
};
