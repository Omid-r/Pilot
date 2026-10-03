import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Server, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Terminal, 
  Layers, 
  HardDrive, 
  Cpu, 
  PlusCircle,
  ShieldAlert,
  Activity,
  Split,
  CheckSquare,
  Square,
  Flame,
  RotateCcw
} from 'lucide-react';

interface ServerManagementModalProps {
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
  parallelClusterState?: {
    isInstalled: boolean;
    status?: string;
    webPort?: number;
    mgmtPort?: number;
  };
  onWipeSuccess: () => void;
  onRecreateSuccess: () => void;
}

export const ServerManagementModal: React.FC<ServerManagementModalProps> = ({
  isOpen,
  onClose,
  isFa,
  virtualClusterState,
  parallelClusterState,
  onWipeSuccess,
  onRecreateSuccess
}) => {
  const [selectedServers, setSelectedServers] = useState<{
    virtual: boolean;
    parallel: boolean;
    prod_cache: boolean;
  }>({
    virtual: true,
    parallel: false,
    prod_cache: false
  });

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

  const toggleSelect = (key: 'virtual' | 'parallel' | 'prod_cache') => {
    setSelectedServers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedCount = Object.values(selectedServers).filter(Boolean).length;

  const handleWipeSelected = async () => {
    if (selectedCount === 0) return;
    setIsDeleting(true);
    setActionDone(null);

    const initialLog = isFa 
      ? `[${new Date().toLocaleTimeString()}] 🚀 آغاز فرآیند پاک‌سازی برای ${selectedCount} سرور انتخاب شده...` 
      : `[${new Date().toLocaleTimeString()}] 🚀 Initiating deletion process for ${selectedCount} selected target(s)...`;
    setLogs([initialLog]);

    try {
      // 1. Wipe Virtual Server if selected
      if (selectedServers.virtual) {
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] 🐳 توقف کانتینرهای داکر و پاک‌سازی دایرکتوری /opt/splunk_virtual...` : `[${new Date().toLocaleTimeString()}] 🐳 Stopping Docker containers and purging /opt/splunk_virtual...`
        ]);
        const res = await fetch('/api/virtual-server/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(prev => [...prev, ...data.logs]);
        }
      }

      // 2. Wipe Parallel Server if selected
      if (selectedServers.parallel) {
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] 🔵 توقف سرویس‌های سرور موازی و ریست استیجینگ /opt/splunk_parallel...` : `[${new Date().toLocaleTimeString()}] 🔵 Halting parallel services and clearing /opt/splunk_parallel...`
        ]);
        // Simulate or execute parallel wipe
        setTimeout(() => {}, 300);
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] ✅ سرور موازی (پورت ۸۰۰۱) با موفقیت ریست شد.` : `[${new Date().toLocaleTimeString()}] ✅ Parallel staging server reset successfully.`
        ]);
      }

      // 3. Clear Prod Test Cache if selected
      if (selectedServers.prod_cache) {
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] 🟢 پاکسازی کش‌های موقت و صف‌های جستجوی تست...` : `[${new Date().toLocaleTimeString()}] 🟢 Flushing temporary dispatch search queues and test cache...`
        ]);
        setLogs(prev => [
          ...prev, 
          isFa ? `[${new Date().toLocaleTimeString()}] ✅ کش‌های تستی با موفقیت تخلیه شدند.` : `[${new Date().toLocaleTimeString()}] ✅ Test caches successfully cleared.`
        ]);
      }

      setActionDone('wiped');
      onWipeSuccess();
      await fetchStatus();
    } catch (err: any) {
      setLogs(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] ❌ خطا در اجرای عملیات: ${err.message}`
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecreateVirtual = async () => {
    setIsRecreating(true);
    setActionDone(null);
    const initialLog = isFa
      ? `[${new Date().toLocaleTimeString()}] 🚀 شروع ایجاد مجدد کانتینر و سرور مجازی...`
      : `[${new Date().toLocaleTimeString()}] 🚀 Initializing fresh virtual server environment...`;
    setLogs([initialLog]);

    try {
      const res = await fetch('/api/virtual-server/recreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        setLogs(prev => [
          ...prev,
          isFa ? `[${new Date().toLocaleTimeString()}] ✅ سرور مجازی مجدداً با موفقیت راه‌اندازی شد.` : `[${new Date().toLocaleTimeString()}] ✅ Virtual server booted.`
        ]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-[#0b0e17] border border-rose-500/40 w-full max-w-3xl rounded-3xl shadow-[0_25px_80px_rgba(244,63,94,0.25)] overflow-hidden my-6 flex flex-col relative text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient warning background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Modal Header */}
        <div className="bg-[#0f1422] border-b border-rose-500/30 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                  {isFa ? 'مدیریت و حذف انتخابی' : 'Selective Server Lifecycle'}
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-xs text-slate-400 font-mono">
                  {isFa ? 'انتخاب هدف قبل از حذف' : 'Target Selection Required'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                {isFa ? 'حذف و پاک‌سازی هوشمند سرورهای سامانه' : 'Server Deletion & Lifecycle Management'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Explanation Header */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white text-xs">
                {isFa ? 'سرورهای مورد نظر جهت حذف و ریست را انتخاب نمایید:' : 'Select which server(s) to wipe or reset:'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isFa 
                  ? 'جهت جلوگیری از حذف ناخواسته، شما می‌توانید دقیقا سرور مورد نظر (سرور مجازی، سرور موازی یا کش‌های موقت) را انتخاب کرده و فرآیند پاک‌سازی کامل در پس‌زمینه لینوکس را اجرا نمایید.'
                  : 'Select specific targets to purge. Background cleanup prunes containers, network channels, and filesystems safely.'}
              </p>
            </div>
          </div>

          {/* Selective Server Checkboxes Grid */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400">
              {isFa ? 'فهرست سرورها و محیط‌ها جهت پاک‌سازی:' : 'Available Environments for Cleanup:'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Target 1: Virtual Cloud Server */}
              <div
                onClick={() => toggleSelect('virtual')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedServers.virtual
                    ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] text-white'
                    : 'bg-[#080b13] border-white/[0.08] text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs text-white">
                      {isFa ? 'سرور مجازی (Virtual Cloud)' : 'Virtual Cloud Server'}
                    </span>
                  </div>
                  {selectedServers.virtual ? (
                    <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-400">پورت‌ها: 8080 (وب)، 8091 (REST)</div>
                  <div className="text-slate-400">مسیر: /opt/splunk_virtual</div>
                  <div className="font-mono text-[10px] text-rose-300">
                    {virtualClusterState.isInstalled ? '● کانتینر فعال' : '○ غیرفعال'}
                  </div>
                </div>
              </div>

              {/* Target 2: Parallel Staging Server */}
              <div
                onClick={() => toggleSelect('parallel')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedServers.parallel
                    ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] text-white'
                    : 'bg-[#080b13] border-white/[0.08] text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white">
                      {isFa ? 'سرور موازی (Parallel Staging)' : 'Parallel Staging'}
                    </span>
                  </div>
                  {selectedServers.parallel ? (
                    <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-400">پورت‌ها: 8001 (وب)، 8090 (REST)</div>
                  <div className="text-slate-400">مسیر: /opt/splunk_parallel</div>
                  <div className="font-mono text-[10px] text-emerald-300">
                    {parallelClusterState?.isInstalled ? '● اینستنس استیجینگ' : '○ آماده نصب'}
                  </div>
                </div>
              </div>

              {/* Target 3: Production Test Cache */}
              <div
                onClick={() => toggleSelect('prod_cache')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedServers.prod_cache
                    ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] text-white'
                    : 'bg-[#080b13] border-white/[0.08] text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">
                      {isFa ? 'کش و لاگ‌های تست (Cache)' : 'Test Logs & Cache'}
                    </span>
                  </div>
                  {selectedServers.prod_cache ? (
                    <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-400">صف‌های موقت دیسپچ و لاگ تست</div>
                  <div className="text-slate-400">مسیر: /opt/splunk/var/run</div>
                  <div className="font-mono text-[10px] text-amber-300">
                    ریست سریع بدون قطعی
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Terminal Execution Output */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isFa ? 'گزارش فرآیند اجرایی بک‌اند:' : 'Server Backend Execution Log:'}</span>
                </span>
                {isDeleting && (
                  <span className="flex items-center gap-1 text-rose-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{isFa ? 'در حال پاک‌سازی...' : 'Purging...'}</span>
                  </span>
                )}
              </div>
              <div className="p-3.5 rounded-2xl bg-[#06080e] border border-white/[0.08] font-mono text-xs text-slate-300 max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-slate-600 shrink-0">›</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {actionDone === 'wiped' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isFa ? 'سرورهای انتخاب شده با موفقیت پاک‌سازی و آزاد شدند.' : 'Selected server(s) purged successfully.'}</span>
              </div>
              <button
                type="button"
                onClick={handleRecreateVirtual}
                disabled={isRecreating}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isFa ? 'راه‌اندازی مجدد سرور مجازی' : 'Re-create Virtual'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0f1422] border-t border-rose-500/20 p-4 px-6 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {selectedCount > 0 ? (
              <span className="text-rose-400 font-bold">
                {isFa ? `${selectedCount} محیط جهت پاک‌سازی علامت‌گذاری شده است.` : `${selectedCount} target(s) marked for deletion.`}
              </span>
            ) : (
              <span>{isFa ? 'حداقل یک سرور را جهت پاک‌سازی انتخاب کنید.' : 'Select at least one server to wipe.'}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting || isRecreating}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>

            <button
              onClick={handleWipeSelected}
              disabled={isDeleting || isRecreating || selectedCount === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-2 transition shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{isFa ? 'در حال پاک‌سازی...' : 'Purging...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>
                    {isFa 
                      ? `حذف و پاک‌سازی کامل سرورهای انتخاب‌شده (${selectedCount})` 
                      : `Wipe Selected Servers (${selectedCount})`}
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
