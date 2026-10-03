import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Server, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Terminal, 
  HardDrive, 
  Cpu, 
  PlusCircle,
  Activity,
  FolderOpen,
  Radio,
  FileCode,
  Layers,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface VirtualServerWipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFa: boolean;
  virtualClusterState: {
    isInstalled: boolean;
    status: string;
    clusterName?: string;
    version?: string;
    webPort?: number;
    mgmtPort?: number;
    indexerPort?: number;
  };
  onWipeSuccess: () => void;
  onRecreateSuccess: () => void;
}

export const VirtualServerWipeModal: React.FC<VirtualServerWipeModalProps> = ({
  isOpen,
  onClose,
  isFa,
  virtualClusterState,
  onWipeSuccess,
  onRecreateSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [actionDone, setActionDone] = useState<'wiped' | 'recreated' | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  // Fetch real-time status from server backend
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/virtual-server/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setActionDone(null);
      setLogs([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWipe = async () => {
    setIsDeleting(true);
    setActionDone(null);

    const initialLog = isFa 
      ? `[${new Date().toLocaleTimeString()}] 🚀 شروع فرآیند حذف یکپارچه و پاکسازی کامل سرور در پس‌زمینه...` 
      : `[${new Date().toLocaleTimeString()}] 🚀 Initiating unified full server purge & decommission...`;
    setLogs([initialLog]);

    try {
      const res = await fetch('/api/virtual-server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedServers: ['virtual', 'parallel', 'containers', 'locks_cache'] })
      });
      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] ✅ سرور مجازی، کانتینرها، ولوم‌ها و پورت‌ها به طور کامل پاکسازی و آزاد شدند.` : `[${new Date().toLocaleTimeString()}] ✅ Server stack, volumes & ports completely purged.`
        ]);
      }

      setActionDone('wiped');
      onWipeSuccess();
      await fetchStatus();
    } catch (err: any) {
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ خطا در حذف سرور: ${err.message}`
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecreate = async () => {
    setIsRecreating(true);
    setActionDone(null);
    const initialLog = isFa
      ? `[${new Date().toLocaleTimeString()}] 🚀 شروع ساخت مجدد و استقرار تمیز سرور مجازی...`
      : `[${new Date().toLocaleTimeString()}] 🚀 Provisioning fresh virtual server environment...`;
    setLogs([initialLog]);

    try {
      const res = await fetch('/api/virtual-server/recreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(prev => [...prev, ...data.logs]);
      }

      setActionDone('recreated');
      onRecreateSuccess();
      await fetchStatus();
    } catch (err: any) {
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ خطا در راه‌اندازی: ${err.message}`
      ]);
    } finally {
      setIsRecreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0b0e17] border border-rose-500/40 rounded-3xl max-w-3xl w-full shadow-[0_0_90px_rgba(239,68,68,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/70 via-[#0e121e] to-rose-950/50 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <Trash2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>{isFa ? 'حذف و پاکسازی کامل سرور (Server Decommission & Wipe)' : 'Server Decommission & Clean Wipe'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'یکپارچه‌سازی فرآیند حذف سرور: پاکسازی کامل فایل‌ها، کانتینرها، پورت‌ها و دایرکتوری‌ها با یک کلیک'
                  : 'Unified server decommission: Full wipe of disk directories, container stacks, network sockets & daemons'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Current Target Server Status Banner */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {isFa ? 'سرور مجازی و محیط‌های تستی اسپلانک' : 'Splunk Virtual Cloud & Staging Instance'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                    virtualClusterState.isInstalled 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {virtualClusterState.isInstalled 
                      ? (isFa ? '🟢 نصب و در حال اجرا' : '🟢 Active & Running') 
                      : (isFa ? '🔴 پاکسازی شده / غیرفعال' : '🔴 Decommissioned / Offline')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isFa ? 'شامل کانتینرهای استقرار یافته، پورت‌های وب و رست، دیتابیس لاگ‌ها و فایل‌های پیکربندی' : 'Includes deployed containers, web/REST ports, log databases and local config files'}
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-[11px] shrink-0 self-start sm:self-center cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'بروزرسانی وضعیت' : 'Refresh State'}</span>
            </button>
          </div>

          {/* Comprehensive 3-Pillar Explanation: چه چیزهایی؟ کجا؟ چگونه؟ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pillar 1: چه چیزهایی حذف می‌شوند؟ */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>{isFa ? '۱. چه چیزهایی حذف می‌شوند؟' : '1. What is being deleted?'}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                  <span>{isFa ? 'تمام کانتینرهای داکر و پادمن اسپلانک' : 'All Docker/Podman Splunk containers'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                  <span>{isFa ? 'دیتابیس‌ها و باکت‌های ذخیره لاگ' : 'Storage volumes & indexed buckets'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                  <span>{isFa ? 'فایل‌های کانفیگ و پچ‌های محلی (.conf)' : 'Local config files & custom stanzas'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                  <span>{isFa ? 'دیمون‌ها و سرویس‌های سیستمی لینوکس' : 'Systemd service units & daemons'}</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: در کجا و کدام مسیرها قرار دارند؟ */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <FolderOpen className="w-4 h-4" />
                <span>{isFa ? '۲. در کجا و کدام مسیرها؟' : '2. Where are they located?'}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] font-mono">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span><strong className="text-white">دایرکتوری:</strong> /opt/splunk_virtual</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span><strong className="text-white">داده‌ها:</strong> /var/lib/splunk_virtual</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span><strong className="text-white">پورت‌های شبکه:</strong> 8080, 8091, 9999</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span><strong className="text-white">فایل‌های قفل:</strong> /tmp/splunk*.pid</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: چگونه و با چه فرآیندی پاکسازی می‌شوند؟ */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>{isFa ? '۳. چگونه پاکسازی می‌شوند؟' : '3. How is it wiped?'}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0 mt-0.5">۱.</span>
                  <span>{isFa ? 'توقف آنی کانتینرها (docker compose down)' : 'Halt containers & prune volumes'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0 mt-0.5">۲.</span>
                  <span>{isFa ? 'آزادسازی سوکت‌های شبکه با دستور fuser' : 'Kill socket locks & free port bindings'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0 mt-0.5">۳.</span>
                  <span>{isFa ? 'حذف کامل مسیرهای دیسک با rm -rf' : 'Purge storage directories cleanly'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0 mt-0.5">۴.</span>
                  <span>{isFa ? 'حذف سرویس‌های systemd و ریستارت کش' : 'Deregister service units & clean PID'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[12px]">
                {isFa ? 'هشدار پاکسازی کامل و بازگردانی پورت‌ها' : 'Full Server Purge Confirmation Warning'}
              </p>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                {isFa 
                  ? 'با کلیک روی دکمه حذف، کلیه متعلقات سرور مجازی از روی دیسک، حافظه RAM و پورت‌های شبکه لینوکس به صورت کامل و غیرقابل بازگشت پاک خواهند شد.'
                  : 'Confirming will permanently wipe all virtual server files, kill running daemons, release TCP sockets, and delete Docker stacks from the host OS.'}
              </p>
            </div>
          </div>

          {/* Live Execution Terminal Log */}
          {logs.length > 0 && (
            <div className="bg-[#05080f] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="bg-[#080d16] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isFa ? 'لاگ ترمینال اجرای دستورات لینوکس در پس‌زمینه' : 'Linux Background Execution Terminal'}</span>
                </div>
                {isDeleting && (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>{isFa ? 'درحال پاکسازی...' : 'Purging...'}</span>
                  </span>
                )}
              </div>
              <div className="p-3.5 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-rose-300/90 leading-tight">
                    <span className="text-rose-500 shrink-0">➔</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Notices */}
          {actionDone === 'wiped' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-[12px]">
                  {isFa ? 'سرور با موفقیت و به صورت یکپارچه از پس‌زمینه و دیسک حذف گردید!' : 'Server stack completely wiped from host background!'}
                </p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  {isFa ? 'پورت‌های ۸۰۸۰، ۸۰۹۱ و ۹۹۹۹ آزاد شدند و تمام دایرکتوری‌های دیسک پاکسازی گردیدند.' : 'Ports 8080, 8091 and 9999 released and storage paths cleared.'}
                </p>
              </div>
            </div>
          )}

          {actionDone === 'recreated' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-[12px]">
                  {isFa ? 'سرور مجازی جدید با موفقیت ایجاد و آماده‌سازی شد!' : 'Fresh virtual server initialized successfully!'}
                </p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  {isFa ? 'می‌توانید از منوی سرور فعال، آن را انتخاب و پایش نمایید.' : 'You can switch to Virtual Cloud in the active server selector.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-5 bg-[#090c14] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition font-bold text-xs cursor-pointer"
          >
            {isFa ? 'بستن پنجره' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            {!virtualClusterState.isInstalled && (
              <button
                onClick={handleRecreate}
                disabled={isRecreating || isDeleting}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>{isFa ? '🚀 راه‌اندازی و ساخت مجدد سرور مجازی' : '🚀 Re-create Virtual Server'}</span>
              </button>
            )}

            <button
              onClick={handleWipe}
              disabled={isDeleting || isRecreating}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-[0_0_25px_rgba(239,68,68,0.4)] text-xs"
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span>
                {isDeleting 
                  ? (isFa ? 'در حال پاکسازی کامل در پس‌زمینه...' : 'Purging in background...') 
                  : (isFa ? '🗑️ حذف و پاکسازی کامل سرور' : '🗑️ Full Wipe & Purge Server Now')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualServerWipeModal;
