import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  X, 
  Search, 
  Play, 
  RotateCw, 
  Server, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  Layers, 
  HardDrive,
  Copy,
  Check,
  Radio,
  Terminal,
  FileCode
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
  parallelClusterState,
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

  if (!isOpen) return null;

  const webUrl = `http://${hostIp}:8001/en-US/app/launcher/home`;

  const handleRunSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSearchResults([
        { id: Date.now() + 1, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23), sourcetype: 'splunkd', level: 'INFO', message: `Query execution completed: ${searchQuery} — Processed 1,420 events in 0.042 seconds.` },
        { id: Date.now() + 2, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23), sourcetype: 'splunkd_access', level: 'INFO', message: 'GET /services/search/jobs/1726998000.41/results HTTP/1.1 200' },
        ...searchResults.slice(0, 5)
      ]);
    }, 600);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#090d14]">
          {/* App 1: Search & Reporting */}
          {activeSplunkApp === 'search' && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-400" />
                    <span>Search & Reporting (Staging Instance)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Time Range: All time (real-time)
                  </span>
                </div>

                {/* SPL Search Box */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                      placeholder="Enter SPL query (e.g. index=* | head 50)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRunSearch}
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    {isSearching ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                    <span>{isSearching ? (isFa ? 'در حال جستجو...' : 'Searching...') : (isFa ? 'اجرای سرچ' : 'Search')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                  <span>نمونه کوئری‌های تستی:</span>
                  <button 
                    onClick={() => { setSearchQuery('index=_internal sourcetype=splunkd | head 20'); handleRunSearch(); }}
                    className="bg-slate-900 hover:bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono border border-slate-800"
                  >
                    Internal Logs
                  </button>
                  <button 
                    onClick={() => { setSearchQuery('index=* | stats count by sourcetype'); handleRunSearch(); }}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono border border-slate-800"
                  >
                    Sourcetype Stats
                  </button>
                  <button 
                    onClick={() => { setSearchQuery('index=_internal component=Metrics | head 10'); handleRunSearch(); }}
                    className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono border border-slate-800"
                  >
                    Queue Utilization
                  </button>
                </div>
              </div>

              {/* Search Results Table */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold font-mono">
                    {searchResults.length} Events (0.041 seconds)
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    Pipeline Status: Isolated (Port :8001 / :9998)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300 font-mono">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Sourcetype</th>
                        <th className="p-2.5">Level</th>
                        <th className="p-2.5">Event Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {searchResults.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 text-slate-400 whitespace-nowrap">{res.timestamp}</td>
                          <td className="p-2.5 text-cyan-300 font-semibold">{res.sourcetype}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              res.level === 'INFO' ? 'bg-emerald-500/20 text-emerald-300' :
                              res.level === 'WARN' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {res.level}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-200">{res.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* App 2: Indexes */}
          {activeSplunkApp === 'indexes' && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Staging Indexes & Buckets Allocation</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  فضای ذخیره‌سازی و مسیرهای ایندکس سرور موازی در مسیر ایزوله <code className="text-emerald-300">/opt/splunk_parallel/var/lib/splunk</code> تعریف شده‌اند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">index: main</div>
                    <div className="text-lg font-bold text-white mt-1">1.2 GB</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Warm/Cold Path: /opt/splunk_parallel/var/lib/splunk/main/db</div>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">index: _internal</div>
                    <div className="text-lg font-bold text-white mt-1">450 MB</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Internal health & splunkd telemetry</div>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">index: soc_security</div>
                    <div className="text-lg font-bold text-white mt-1">3.4 GB</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Isolated test ingest stream</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App 3: Data Inputs */}
          {activeSplunkApp === 'inputs' && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Parallel Data Receivers & Port Channels</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  پورت‌های ورودی این اینستنس با سرور اصلی تفکیک شده‌اند تا تست جریان لاگ بدون تداخل با تولید انجام شود:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <div className="font-mono text-emerald-300 font-bold">Splunk-to-Splunk (s2s) TCP Receiver</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">دریافت لاگ از Universal Forwarders جهت تست</div>
                    </div>
                    <span className="font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Port :9998 (Active)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <div className="font-mono text-amber-300 font-bold">HTTP Event Collector (HEC)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">دریافت توکن‌های API لاگ‌های وب و اپلیکیشن</div>
                    </div>
                    <span className="font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Port :8088 (SSL Token Ready)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App 4: Server Info */}
          {activeSplunkApp === 'server_info' && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Staging Instance Runtime Specs</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500">SPLUNK_HOME Directory:</span>
                    <div className="font-mono text-emerald-300 font-bold">{parallelClusterState.splunkHome || '/opt/splunk_parallel'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500">License Pool:</span>
                    <div className="font-mono text-cyan-300 font-bold">{parallelClusterState.licenseMode || 'Shared LM Pool (Online)'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500">REST Management Port:</span>
                    <div className="font-mono text-amber-300 font-bold">:8090 (Clean / Non-colliding)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500">Cloned Config Files:</span>
                    <div className="font-mono text-purple-300 font-bold">{parallelClusterState.syncedFilesCount || 7} Files Synced</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
