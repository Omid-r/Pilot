import React from 'react';
import { 
  ServerAssetNode, 
  SizingLOMInputs, 
  CalculatedSizingResult,
  SPLUNK_PORT_DEFINITIONS 
} from '../data/splunkDeployerData';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Database, 
  Layers, 
  Search, 
  ShieldAlert, 
  Activity, 
  Settings, 
  Sliders, 
  Edit3, 
  X, 
  Maximize2, 
  CheckCircle2, 
  Radio, 
  Zap, 
  ArrowRight, 
  Trash2, 
  Lock, 
  Users, 
  Network,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

export interface SpotlightTarget {
  type: 'node' | 'log_source' | 'soc_users' | 'conduit_wire';
  node?: ServerAssetNode;
  logSource?: {
    id: string;
    title: string;
    ip: string;
    proto: string;
    eps: string;
    color: string;
    portTag: string;
    portNum: number;
    wireId: string;
  };
  wire?: {
    id: string;
    title: string;
    portNumber: number | string;
    protocol: string;
    from: string;
    to: string;
    description: string;
    associatedNode?: ServerAssetNode;
  };
}

interface SplunkNodeSpotlightModalProps {
  target: SpotlightTarget;
  onClose: () => void;
  onOpenSettings: (target: SpotlightTarget) => void;
  onRemoveNode?: (nodeId: string) => void;
  onInspectPort?: (portNumber: number | string, node?: ServerAssetNode) => void;
  sizingInputs: SizingLOMInputs;
  sizingResult: CalculatedSizingResult;
  lang: 'fa' | 'en';
}

export const SplunkNodeSpotlightModal: React.FC<SplunkNodeSpotlightModalProps> = ({
  target,
  onClose,
  onOpenSettings,
  onRemoveNode,
  onInspectPort,
  sizingInputs,
  sizingResult,
  lang
}) => {
  const isFa = lang === 'fa';

  const getRoleLabel = (role?: ServerAssetNode['role']) => {
    switch (role) {
      case 'search_head': return isFa ? 'گره جستجوگر و تحلیل‌گر (Search Head)' : 'Search Head (SH)';
      case 'indexer_peer': return isFa ? 'نود ایندکسر و ذخیره‌ساز (Indexer Peer)' : 'Indexer Peer (IDX)';
      case 'heavy_forwarder': return isFa ? 'فوروارد کننده سنگین لاگ (Heavy Forwarder)' : 'Heavy Forwarder (HF)';
      case 'cluster_manager': return isFa ? 'مدیر کلاستر ایندکسر (Cluster Manager)' : 'Cluster Manager (CM)';
      case 'deployer': case 'deployer_lm_ds': return isFa ? 'دیپلویِر کلاستر جستجو (SHC Deployer)' : 'SHC Deployer';
      case 'deployment_server': return isFa ? 'سرور توزیع تنظیمات فورواردرها (Deployment Server)' : 'Deployment Server (DS)';
      case 'license_master': return isFa ? 'مدیر لایسنس مرکزی (License Master)' : 'License Master (LM)';
      case 'search_load_balancer': return isFa ? 'توزیع‌کننده بار وب (Search Load Balancer VIP)' : 'Search Load Balancer (VIP)';
      default: return isFa ? 'نود سرور اسپلانک' : 'Splunk Server Node';
    }
  };

  const getRoleColor = (role?: ServerAssetNode['role']) => {
    switch (role) {
      case 'search_head': return 'from-sky-600 to-blue-700 border-sky-400 text-sky-300';
      case 'indexer_peer': return 'from-amber-600 to-orange-700 border-amber-400 text-amber-300';
      case 'heavy_forwarder': return 'from-emerald-600 to-teal-700 border-emerald-400 text-emerald-300';
      case 'cluster_manager': return 'from-cyan-600 to-blue-700 border-cyan-400 text-cyan-300';
      case 'deployer': case 'deployer_lm_ds': return 'from-purple-600 to-indigo-700 border-purple-400 text-purple-300';
      case 'deployment_server': return 'from-blue-600 to-indigo-700 border-blue-400 text-blue-300';
      case 'license_master': return 'from-emerald-600 to-green-700 border-emerald-400 text-emerald-300';
      default: return 'from-slate-700 to-slate-800 border-slate-500 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir={isFa ? 'rtl' : 'ltr'}>
      <div 
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#0e1726] to-[#080d16] border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/70 overflow-hidden flex flex-col max-h-[92vh] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-cyan-500/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-inner">
              <Maximize2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  {isFa ? 'نمای بزرگ‌نمایی و بازرسی شکل' : 'Shape Magnified Spotlight & Inspector'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-600/70">
                  ● {isFa ? 'آماده ویرایش و تغییر' : 'Live Interactive'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {target.type === 'node' && target.node && (
                  <span>{target.node.hostname} ({getRoleLabel(target.node.role)})</span>
                )}
                {target.type === 'log_source' && target.logSource && (
                  <span>{target.logSource.title} ({target.logSource.ip})</span>
                )}
                {target.type === 'soc_users' && (
                  <span>{isFa ? 'کاربران و تحلیل‌گران SOC (Web UI :8000)' : 'SOC Analysts & Users Tier'}</span>
                )}
                {target.type === 'conduit_wire' && target.wire && (
                  <span>{target.wire.title} (Port :{target.wire.portNumber})</span>
                )}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Magnified Shape Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">

          {/* ========================================================================= */}
          {/* CASE 1: MAGNIFIED SERVER NODE CHASSIS */}
          {/* ========================================================================= */}
          {target.type === 'node' && target.node && (
            <div className="space-y-4">
              
              {/* Large High-Definition Server Blade Illustration */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0a1220] to-slate-950 border border-slate-700 shadow-xl relative overflow-hidden">
                {/* Server Chassis Rack Top & LEDs */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-emerald-300">ONLINE</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-cyan-300">
                      <span>IP:</span>
                      <strong className="text-white">{target.node.ip}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-purple-300">
                      <span>OS:</span>
                      <strong className="text-white">{(target.node as any).osVersion || (target.node as any).osType || 'RHEL 9.4 (Linux 64-bit)'}</strong>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getRoleColor(target.node.role)}`}>
                    {target.node.role.toUpperCase()}
                  </span>
                </div>

                {/* 3D-Like Server Drive Bays Representation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-mono text-xs">
                  {[1, 2, 3, 4].map((bay) => (
                    <div key={`bay-${bay}`} className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-slate-400">BAY #{bay}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold">NVMe 1.6TB</span>
                    </div>
                  ))}
                </div>

                {/* Hardware Spec Badges (vCPU, RAM, Storage) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isFa ? 'پردازنده:' : 'Processor:'}</span>
                    </span>
                    <p className="text-base font-mono font-black text-cyan-300">{target.node.cpuCores} vCPU Cores</p>
                    <p className="text-[10px] text-slate-500 font-mono">Xeon Gold 6348 @ 2.60GHz</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isFa ? 'حافظه رَم:' : 'RAM Memory:'}</span>
                    </span>
                    <p className="text-base font-mono font-black text-purple-300">{target.node.ramGB} GB ECC DDR4</p>
                    <p className="text-[10px] text-slate-500 font-mono">Allocated from Hardware Pool</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isFa ? 'دیسک و ذخیره‌سازی:' : 'Storage Media:'}</span>
                    </span>
                    <p className="text-base font-mono font-black text-amber-300">{target.node.storageNVMeGB || 512} GB NVMe</p>
                    <p className="text-[10px] text-slate-500 font-mono">RAID 10 • Hot/Warm Bucket</p>
                  </div>
                </div>
              </div>

              {/* Network Ports Assigned to this Node */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span>{isFa ? 'پورت‌های شبکه فعال روی این نود:' : 'Active Network Ports & Conduits:'}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{isFa ? '(برای تغییر کلیک کنید)' : '(Click to inspect)'}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(target.node.assignedPorts || {}).map(([key, portVal]) => (
                    <button
                      key={key}
                      onClick={() => onInspectPort && onInspectPort(portVal, target.node)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 transition cursor-pointer flex items-center gap-2 group"
                    >
                      <span className="text-xs font-mono font-bold text-cyan-300 group-hover:text-cyan-200">:{portVal}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({key})</span>
                      <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizing & Role Guidelines */}
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-600/40 text-xs text-cyan-200 space-y-1.5 font-mono">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'محاسبات استاندارد رسمی Splunk LOM:' : 'Official Splunk Sizing Standards:'}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isFa 
                    ? `این نود بر اساس حجم کل روزانه ${sizingInputs.dailyVolumeGB} گیگابایت و تعداد ${sizingInputs.searchUsers} کاربر جستجوگر بهینه‌سازی شده است.`
                    : `Node calibrated for ${sizingInputs.dailyVolumeGB} GB/day ingest and ${sizingInputs.searchUsers} concurrent users.`}
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: MAGNIFIED LOG SOURCE */}
          {/* ========================================================================= */}
          {target.type === 'log_source' && target.logSource && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: target.logSource.color }} />
                    <h4 className="text-sm font-bold text-white">{target.logSource.title}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 text-xs font-mono">
                    {target.logSource.portTag}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Source IP:</span>
                    <p className="text-white font-bold">{target.logSource.ip}</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Throughput / Rate:</span>
                    <p className="text-emerald-400 font-bold">{target.logSource.eps}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 3: MAGNIFIED SOC USERS TIER */}
          {/* ========================================================================= */}
          {target.type === 'soc_users' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">{isFa ? 'تیم تحلیل‌گران SOC و داشبوردهای سازمانی' : 'SOC Analyst Team & Real-Time Dashboards'}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-600 text-sky-300 text-xs font-mono">
                    Port :8000 Web UI
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">SOC Analysts Count:</span>
                    <p className="text-white font-bold">{sizingInputs.socAnalysts?.length || 4} Analysts</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Concurrent Concurrency:</span>
                    <p className="text-cyan-400 font-bold">{sizingInputs.searchUsers} Simultaneous Searches</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 4: MAGNIFIED CONDUIT WIRE */}
          {/* ========================================================================= */}
          {target.type === 'conduit_wire' && target.wire && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{target.wire.title}</h4>
                  <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs font-mono font-bold">
                    Port :{target.wire.portNumber} ({target.wire.protocol})
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">{target.wire.description}</p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                  <span>Connection: </span>
                  <strong className="text-emerald-400">{target.wire.from}</strong>
                  <span> → </span>
                  <strong className="text-cyan-400">{target.wire.to}</strong>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions Bar (Highlighting: تغییر تنظیمات) */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-900/95 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {target.type === 'node' && target.node && onRemoveNode && (
              <button
                onClick={() => {
                  if (target.node) {
                    onRemoveNode(target.node.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'حذف نود' : 'Delete Node'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>

            {/* MAIN PRIMARY BUTTON: تغییر تنظیمات */}
            <button
              onClick={() => {
                onOpenSettings(target);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-cyan-900/50 transition flex items-center gap-2 cursor-pointer border border-cyan-400 animate-pulse"
            >
              <Settings className="w-4 h-4" />
              <span>{isFa ? 'تغییر تنظیمات (Edit Configuration)' : 'تغییر تنظیمات'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
