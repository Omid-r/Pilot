import React, { useState, useEffect, useRef } from 'react';
import { 
  GripHorizontal, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FloatingMiniWindowProps {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isFa: boolean;
  onClose: () => void;
  onMaximize: () => void;
  initialPosition?: { x: number; y: number };
  children: React.ReactNode;
}

export const FloatingMiniWindow: React.FC<FloatingMiniWindowProps> = ({
  id,
  title,
  icon: IconComp,
  isFa,
  onClose,
  onMaximize,
  initialPosition,
  children
}) => {
  // Window position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (initialPosition) return initialPosition;
    // Default to bottom right (or bottom left for RTL)
    const defaultWidth = 460;
    const defaultHeight = 360;
    const padding = 20;
    const x = isFa 
      ? padding 
      : Math.max(padding, (typeof window !== 'undefined' ? window.innerWidth : 1200) - defaultWidth - padding);
    const y = Math.max(padding, (typeof window !== 'undefined' ? window.innerHeight : 800) - defaultHeight - padding);
    return { x, y };
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: position.x,
    initY: position.y
  });

  const windowRef = useRef<HTMLDivElement>(null);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header elements, not buttons
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const newX = dragRef.current.initX + deltaX;
    const newY = dragRef.current.initY + deltaY;

    // Bounds checking
    const maxX = Math.max(0, window.innerWidth - (windowRef.current?.offsetWidth || 400));
    const maxY = Math.max(0, window.innerHeight - (windowRef.current?.offsetHeight || 60));

    setPosition({
      x: Math.min(Math.max(10, newX), maxX - 10),
      y: Math.min(Math.max(10, newY), maxY - 10)
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Adjust on screen resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = Math.max(0, window.innerWidth - (windowRef.current?.offsetWidth || 400));
        const maxY = Math.max(0, window.innerHeight - (windowRef.current?.offsetHeight || 60));
        return {
          x: Math.min(Math.max(10, prev.x), maxX - 10),
          y: Math.min(Math.max(10, prev.y), maxY - 10)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={windowRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
      className={`w-[480px] max-w-[calc(100vw-24px)] rounded-xl overflow-hidden border border-white/[0.12] bg-[#1a1c22]/95 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.75)] transition-shadow duration-200 ${
        isDragging ? 'shadow-[0_30px_90px_rgba(0,0,0,0.9)] cursor-grabbing' : ''
      }`}
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Apple macOS Window Header (Draggable) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="px-3.5 py-2.5 bg-[#20222a]/95 border-b border-white/[0.08] flex items-center justify-between gap-3 select-none cursor-grab active:cursor-grabbing"
      >
        {/* macOS Traffic Lights Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-90 transition-all flex items-center justify-center group border border-black/20 cursor-pointer"
            title={isFa ? 'بستن پنجره شناور' : 'Close'}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4a0002] leading-none">×</span>
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 transition-all flex items-center justify-center group border border-black/20 cursor-pointer"
            title={isMinimized ? (isFa ? 'گسترش پنجره' : 'Expand') : (isFa ? 'کوچک‌سازی' : 'Minimize')}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#5c3b00] leading-none">–</span>
          </button>
          <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-90 transition-all flex items-center justify-center group border border-black/20 cursor-pointer"
            title={isFa ? 'بازگردانی به صفحه اصلی' : 'Zoom to Full View'}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[6px] font-bold text-[#08450e] leading-none">↗</span>
          </button>
        </div>

        {/* Title & Icon & Drag Handle */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          {IconComp ? (
            <IconComp className="w-3.5 h-3.5 text-[#0a84ff] shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#0a84ff] shrink-0" />
          )}
          <span className="font-semibold text-white/90 text-xs truncate max-w-[220px]" title={title}>
            {title}
          </span>
          <span className="text-[10px] font-medium text-white/40">·</span>
          <span className="text-[10px] text-white/50">PiP</span>
        </div>

        {/* Drag Indicator */}
        <div className="shrink-0 text-white/30">
          <GripHorizontal className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Mini Window Content (Scrollable & Responsive) */}
      {!isMinimized && (
        <div className="max-h-[380px] overflow-y-auto overflow-x-hidden p-3 bg-[#14151a]/95 text-xs text-white/90">
          {children}
        </div>
      )}
    </div>
  );
};

export default FloatingMiniWindow;
