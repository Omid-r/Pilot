import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Check, 
  Sparkles, 
  FileCode, 
  ArrowLeft, 
  ArrowRight, 
  Code2, 
  CheckCircle2, 
  Layers, 
  Server, 
  Sliders, 
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { resolveSplunkPaths } from '../utils/splunkPathResolver';

interface LinearSlideToApplyDiffProps {
  currentConfigCode: string;
  proposedConfigCode: string;
  fileName: string;
  stanzaName?: string;
  onApply: (appliedCode: string) => void;
  isApplied?: boolean;
  lang?: 'fa' | 'en';
  onReset?: () => void;
}

export const LinearSlideToApplyDiff: React.FC<LinearSlideToApplyDiffProps> = ({
  currentConfigCode,
  proposedConfigCode,
  fileName,
  stanzaName,
  onApply,
  isApplied = false,
  lang = 'fa',
  onReset
}) => {
  const isFa = lang === 'fa';
  const cleanProposed = resolveSplunkPaths(proposedConfigCode);
  const cleanCurrent = resolveSplunkPaths(currentConfigCode);

  const [slideProgress, setSlideProgress] = useState<number>(isApplied ? 100 : 0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [localApplied, setLocalApplied] = useState<boolean>(isApplied);
  const [customEditMode, setCustomEditMode] = useState<boolean>(false);
  const [editableProposed, setEditableProposed] = useState<string>(cleanProposed);

  const trackRef = useRef<HTMLDivElement>(null);

  // Sync state if props change
  useEffect(() => {
    setEditableProposed(cleanProposed);
  }, [cleanProposed]);

  useEffect(() => {
    if (isApplied) {
      setLocalApplied(true);
      setSlideProgress(100);
    }
  }, [isApplied]);

  // Handle Drag / Slide
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (localApplied) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || localApplied) return;
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    // If dragged more than 65%, complete and apply
    if (slideProgress >= 65) {
      triggerApply();
    } else {
      // Snap back
      setSlideProgress(0);
    }
  };

  const updateProgressFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    let offsetX = clientX - rect.left;
    
    // Clamp between 0 and width
    offsetX = Math.max(0, Math.min(offsetX, width));
    const percent = Math.round((offsetX / width) * 100);
    setSlideProgress(percent);

    if (percent >= 95) {
      triggerApply();
    }
  };

  const triggerApply = useCallback(() => {
    setSlideProgress(100);
    setLocalApplied(true);
    onApply(editableProposed);
  }, [editableProposed, onApply]);

  const handleReset = () => {
    setLocalApplied(false);
    setSlideProgress(0);
    if (onReset) onReset();
  };

  return (
    <div className="space-y-4">
      {/* Top Notification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">
            {isFa 
              ? 'مقایسه کشویی خطی و اعمال مستقیم بر روی فایل سرور (Linear Slide & Merge):' 
              : 'Linear Slide & Merge on Server Config File:'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomEditMode(!customEditMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              customEditMode 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isFa ? (customEditMode ? 'حالت نمایش عادی' : 'شخصی‌سازی کد پیشنهاد') : (customEditMode ? 'Standard View' : 'Customize Proposal')}</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Panels: Server Config (Left) vs Proposed Fix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Side: Server Config File (فایل کانفیگ خود سرور) */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
          localApplied 
            ? 'bg-[#081814] border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50' 
            : 'bg-[#090d14] border-slate-800'
        }`}>
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  localApplied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span className={localApplied ? 'text-emerald-300' : 'text-slate-200'}>
                      {isFa ? 'فایل کانفیگ خود سرور (سمت چپ)' : 'Live Server Config File (Left)'}
                    </span>
                    {localApplied && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                        <CheckCheck className="w-3 h-3" />
                        <span>{isFa ? 'سبز شد و اعمال گردید' : 'Applied & Green!'}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    /opt/splunk/etc/system/local/{fileName} {stanzaName ? `(${stanzaName})` : ''}
                  </div>
                </div>
              </div>

              {localApplied ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFa ? 'وضعیت: سبز و رفع نقص' : 'Status: Resolved'}</span>
                </div>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                  {isFa ? 'کانفیگ فعلی سرور (نیازمند اصلاح)' : 'Current Unpatched Stanza'}
                </span>
              )}
            </div>

            {/* Code Content */}
            <div className={`p-3.5 rounded-xl font-mono text-xs dir-ltr overflow-x-auto select-all leading-relaxed transition-all ${
              localApplied 
                ? 'bg-[#030e0a] text-emerald-200 border border-emerald-500/30' 
                : 'bg-[#05070c] text-rose-300/90 border border-slate-900'
            }`}>
              <pre className="whitespace-pre">
                {localApplied 
                  ? editableProposed 
                  : cleanCurrent || `# Current stanza in /opt/splunk/etc/system/local/${fileName}`}
              </pre>
            </div>
          </div>

          {/* Applied Success Footer */}
          {localApplied && (
            <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {isFa ? 'کد پیشنهادی با موفقیت در فایل اصلی سرور اعمال شد.' : 'Configuration successfully patched into server.'}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isFa ? 'بازنشانی اسلایدر' : 'Reset Slider'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Proposed Fix / Recommendation (پیشنهاد بهبود و رفع خطا) */}
        <div className="p-4 rounded-2xl bg-[#0d131f] border border-cyan-900/60 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">
                    {isFa ? 'پیشنهاد بهبود و اصلاح خطا (سمت راست)' : 'Proposed Fix / Recommendation (Right)'}
                  </div>
                  <div className="text-[10px] text-cyan-400">
                    {isFa ? 'مسیرها به صورت واقعی (/opt/splunk) جایگزین شده‌اند' : 'Concrete Linux filesystem paths applied'}
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {isFa ? 'استاندارد رسمی اسپلانک' : 'Splunk Best Practice'}
              </span>
            </div>

            {/* Proposed Content */}
            {!customEditMode ? (
              <div className="p-3.5 rounded-xl bg-[#040810] text-emerald-300 border border-cyan-950 font-mono text-xs dir-ltr overflow-x-auto select-all leading-relaxed">
                <pre className="whitespace-pre">{editableProposed}</pre>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  value={editableProposed}
                  onChange={(e) => setEditableProposed(e.target.value)}
                  rows={4}
                  className="w-full bg-[#040810] border border-cyan-500/50 focus:border-cyan-400 rounded-xl p-3 font-mono text-xs text-cyan-200 outline-none dir-ltr resize-y"
                  placeholder="Paste or customize configuration..."
                />
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
            {isFa 
              ? '💡 اسلایدر زیر را به سمت چپ/راست بکشید تا این پیشنهاد روی فایل سرور اعمال شده و سبز شود.'
              : '💡 Slide the linear handle across to apply this proposal to the server file.'}
          </div>
        </div>

      </div>

      {/* Linear Interactive Slide-to-Apply Track (حالت کشویی خطی) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1624] via-[#101c2e] to-[#0d1624] border border-slate-700/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>
              {localApplied 
                ? (isFa ? '✓ پیشنهاد اعمال شد و فایل سرور سبز رنگ گردید' : '✓ Proposal applied and server file turned green') 
                : (isFa ? 'کنترل کشویی خطی: اسلایدر را بکشید تا روی کانفیگ سرور اعمال شود' : 'Linear Slider: Drag handle to apply to server config')}
            </span>
          </span>

          <span className="font-mono text-xs font-bold text-amber-400 bg-black/40 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
            {slideProgress}%
          </span>
        </div>

        {/* Drag Track */}
        <div 
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative h-14 rounded-xl border select-none cursor-pointer overflow-hidden transition-all flex items-center ${
            localApplied
              ? 'bg-emerald-950/60 border-emerald-500 cursor-default'
              : 'bg-[#060910] border-slate-700 hover:border-amber-500/60'
          }`}
        >
          {/* Progress Fill Bar */}
          <div 
            className={`absolute top-0 bottom-0 left-0 transition-all duration-75 ${
              localApplied 
                ? 'w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400' 
                : 'bg-gradient-to-r from-amber-600/40 via-amber-500/60 to-emerald-500/80'
            }`}
            style={{ width: `${slideProgress}%` }}
          />

          {/* Centered Guide Text */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-xs font-bold">
            {localApplied ? (
              <span className="text-white flex items-center gap-2 drop-shadow">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>{isFa ? 'اعمال روی سرور با موفقیت انجام شد (سبز شد) ✓' : 'Applied to Server Config Successfully ✓'}</span>
              </span>
            ) : (
              <span className="text-slate-300 flex items-center gap-2 drop-shadow">
                <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{isFa ? 'برای اعمال روی فایل سرور (سمت چپ)، اسلایدر را به سمت راست بکشید' : 'Slide across to apply proposal to server config'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
              </span>
            )}
          </div>

          {/* Draggable Slider Thumb */}
          {!localApplied && (
            <div 
              className="absolute top-1.5 bottom-1.5 w-14 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-10 font-bold border border-amber-200"
              style={{ 
                left: `calc(${slideProgress}% - ${slideProgress > 90 ? '56px' : '0px'})`,
                marginLeft: slideProgress === 0 ? '4px' : '-28px'
              }}
            >
              <Sparkles className="w-5 h-5 fill-current animate-spin-slow" />
            </div>
          )}
        </div>

        {/* Quick Action Button Alternative */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="text-slate-400 text-[11px]">
            {isFa ? 'نکته: تمام مسیرهای متغیری مثل $splunkdiectory به مسیر واقعی /opt/splunk تبدیل شده‌اند.' : 'Note: Variable paths like $splunkdiectory have been converted to /opt/splunk.'}
          </div>

          <div className="flex items-center gap-2">
            {!localApplied ? (
              <button
                type="button"
                onClick={triggerApply}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? 'کشیدن و اعمال سریع روی سرور' : 'Slide & Apply Now'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? 'تست مجدد اسلایدر' : 'Test Slider Again'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
