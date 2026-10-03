import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  GripHorizontal, 
  Sparkles, 
  Activity, 
  FileCode, 
  Terminal, 
  ShieldCheck, 
  Play, 
  Pause, 
  RotateCw, 
  ExternalLink,
  Layers,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface FloatingPiPWindowProps {
  isOpen: boolean;
  toolId: string;
  toolTitle: string;
  toolCategory: string;
  onClose: () => void;
  onRestoreToMain: (toolId: string) => void;
  lang: 'fa' | 'en';
  configs?: Record<string, string>;
  liveLogs?: string;
  healthScore?: number;
  findingsCount?: number;
  onQuickRescan?: () => void;
  activeEnvironment?: string;
}

export const FloatingPiPWindow: React.FC<FloatingPiPWindowProps> = ({
  isOpen,
  toolId,
  toolTitle,
  toolCategory,
  onClose,
  onRestoreToMain,
  lang,
  configs = {},
  liveLogs = '',
  healthScore = 100,
  findingsCount = 0,
  onQuickRescan,
  activeEnvironment = 'production'
}) => {
  const isFa = lang === 'fa';
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Default position at bottom-right of screen
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 420) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 340) : 200;
    return { x: defaultX, y: defaultY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState<'view' | 'logs'>('view');
  const [isLogPaused, setIsLogPaused] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking interactive buttons
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    if (e.touches.length > 0) {
      setIsDragging(true);
      setDragOffset({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - (isCollapsed ? 260 : 400), e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - (isCollapsed ? 60 : 320), e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const newX = Math.max(10, Math.min(window.innerWidth - (isCollapsed ? 260 : 400), e.touches[0].clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - (isCollapsed ? 60 : 320), e.touches[0].clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset, isCollapsed]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 transition-shadow select-none shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-2xl border backdrop-blur-2xl overflow-hidden flex flex-col ${
        isDragging ? 'cursor-grabbing border-violet-500 shadow-violet-500/20' : 'cursor-grab border-white/20 hover:border-violet-500/50'
      } bg-[#0a0d16]/95 ${isCollapsed ? 'w-72' : 'w-96 md:w-[420px]'}`}
    >
      {/* PiP Header Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="px-3 py-2.5 bg-gradient-to-r from-[#121829] via-[#0e1424] to-[#121829] border-b border-white/[0.08] flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-white truncate font-mono">
              {toolTitle}
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30 shrink-0">
            PiP
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Collapse/Expand size button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
            title={isCollapsed ? (isFa ? 'گسترش پنجره' : 'Expand') : (isFa ? 'کوچک کردن پنجره' : 'Collapse')}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Restore to main workspace */}
          <button
            type="button"
            onClick={() => {
              onRestoreToMain(toolId);
              onClose();
            }}
            className="p-1 rounded-lg text-violet-300 hover:text-white hover:bg-violet-600/30 transition"
            title={isFa ? 'بازگشت به تمام‌صفحه اصلی' : 'Restore to full window'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title={isFa ? 'بستن پنجره شناور' : 'Close Floating Window'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded PiP Body */}
      {!isCollapsed && (
        <div className="flex-1 p-3 text-xs overflow-hidden flex flex-col space-y-2.5 max-h-72">
          {/* Environment and status mini bar */}
          <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-violet-400" />
              <span>{activeEnvironment}</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Live Active</span>
            </span>
          </div>

          {/* Dynamic Content depending on Tool */}
          {toolId === 'health_audit' ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">{isFa ? 'امتیاز سلامت کلاستر:' : 'Health Score:'}</div>
                  <div className="text-xl font-black text-white font-mono">{healthScore}/100</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">{isFa ? 'خطاهای باقیمانده:' : 'Active Findings:'}</div>
                  <div className={`text-base font-bold font-mono ${findingsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {findingsCount} {isFa ? 'ایراد' : 'issues'}
                  </div>
                </div>
              </div>

              {onQuickRescan && (
                <button
                  type="button"
                  onClick={onQuickRescan}
                  className="w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'بررسی مجدد سریع' : 'Quick Rescan'}</span>
                </button>
              )}
            </div>
          ) : toolId === 'live_logs' ? (
            <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-violet-400" />
                  <span>splunkd.log tail</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogPaused(!isLogPaused)}
                  className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-mono text-[10px]"
                >
                  {isLogPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
              </div>
              <div className="p-2 rounded-xl bg-[#06080e] border border-white/[0.06] font-mono text-[10px] text-slate-300 overflow-y-auto max-h-36 scrollbar-thin">
                {liveLogs ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400/90">{liveLogs.slice(-600)}</pre>
                ) : (
                  <div className="text-slate-500 text-center py-4">{isFa ? 'در انتظار لاگ‌های سرور...' : 'Waiting for logs...'}</div>
                )}
              </div>
            </div>
          ) : toolId === 'config_editor' ? (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{isFa ? 'فایل‌های پیکربندی فعال:' : 'Active Configurations:'}</span>
                <span className="font-mono text-violet-300">{Object.keys(configs).length} files</span>
              </div>
              <div className="p-2 rounded-xl bg-[#06080e] border border-white/[0.06] font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto space-y-1">
                {Object.entries(configs).slice(0, 4).map(([f, c]) => (
                  <div key={f} className="flex items-center justify-between p-1 rounded bg-white/[0.02]">
                    <span className="text-violet-300">{f}</span>
                    <span className="text-slate-500">{c.split('\n').length} lines</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onRestoreToMain('config_editor');
                  onClose();
                }}
                className="w-full py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{isFa ? 'باز کردن کامل ویرایشگر' : 'Open Full Editor'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <Activity className="w-8 h-8 text-violet-400 mx-auto animate-pulse" />
              <div className="text-xs font-bold text-white">{toolTitle}</div>
              <p className="text-[10px] text-slate-400">
                {isFa ? 'این ابزار در حالت شناور در حال اجراست و تداخلی با سایر ابزارها ندارد.' : 'Tool running in background PiP without blocking other tools.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onRestoreToMain(toolId);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'بزرگ‌نمایی و نمایش اصلی' : 'Maximize to Main View'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State Bar */}
      {isCollapsed && (
        <div className="px-3 py-1.5 bg-[#080b14] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate max-w-[150px]">{toolTitle}</span>
          <span className="text-emerald-400 font-bold">Active ●</span>
        </div>
      )}
    </div>
  );
};
