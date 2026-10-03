import React, { useState } from 'react';
import { BackupSnapshot } from '../types';
import { 
  Archive, 
  History, 
  RotateCcw, 
  Check, 
  Clock, 
  HardDrive, 
  FileText, 
  AlertCircle,
  Download,
  Plus,
  Trash2
} from 'lucide-react';

interface BackupManagerProps {
  snapshots: BackupSnapshot[];
  onRestoreSnapshot: (snapshot: BackupSnapshot) => void;
  onGlobalRestoreBaseline: () => void;
  onCreateSnapshot: (label: string) => void;
  lang: 'fa' | 'en';
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  snapshots,
  onRestoreSnapshot,
  onGlobalRestoreBaseline,
  onCreateSnapshot,
  lang
}) => {
  const isFa = lang === 'fa';
  const [newLabel, setNewLabel] = useState('');
  const [showConfirmGlobal, setShowConfirmGlobal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupSnapshot | null>(null);

  const baselineSnapshot = snapshots.find(s => s.isInitialBaseline) || snapshots[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onCreateSnapshot(newLabel.trim());
      setNewLabel('');
    }
  };

  return (
    <div className="sirene-card bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)] space-y-6 text-start relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-60 h-60 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-300 uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Automated State Vault
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isFa ? 'مدیریت و بایگانی نسخه‌های پشتیبان خودکار (Splunk Config Backup Snapshots)' : 'Splunk Configuration Snapshots & Backup Archive'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa 
                ? 'بک‌آپ خودکار اولیه قبل از شروع اسکن، امکان ساخت اسنپ‌شات دستی و بازگردانی سراسری یا فایلی'
                : 'Automated baseline snapshots taken before audits, on-demand snapshots, and global baseline restoration.'}
            </p>
          </div>
        </div>

        {/* Global Revert to Baseline Button */}
        <button
          onClick={() => setShowConfirmGlobal(true)}
          className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.15)] transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isFa ? 'بازگردانی سراسری به بک‌آپ اولیه (Global Baseline Rollback)' : 'Global Revert to Baseline'}</span>
        </button>
      </div>

      {/* Baseline Info Box */}
      {baselineSnapshot && (
        <div className="p-5 rounded-2xl bg-[#0e1422]/90 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-4 relative z-10 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white">{baselineSnapshot.label}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                  {isFa ? 'نسخه اولیه (بک‌آپ خودکار قبل از اسکن)' : 'Initial Pre-Scan Baseline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {baselineSnapshot.timestamp} | {Object.keys(baselineSnapshot.files).length} {isFa ? 'فایل کانفیگ حفاظت‌شده' : 'files protected'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onRestoreSnapshot(baselineSnapshot)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isFa ? 'بازگردانی به این نسخه' : 'Rollback to Baseline'}</span>
          </button>
        </div>
      )}

      {/* Create on-demand Snapshot */}
      <form onSubmit={handleCreate} className="flex gap-2 text-xs relative z-10">
        <input
          type="text"
          placeholder={isFa ? 'عنوان اسنپ‌شات جدید (مثلاً: قبل از تغییر پورت‌های ۹۹۹۷ و فعال‌سازی TLS)...' : 'Label for new snapshot (e.g. before outputs TLS hardening)...'}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 bg-[#07090e] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isFa ? 'ایجاد بک‌آپ جدید' : 'Create Snapshot'}</span>
        </button>
      </form>

      {/* Snapshots List */}
      <div className="space-y-3 relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {isFa ? 'تاریخچه اسنپ‌شات‌ها و بک‌آپ‌های ذخیره‌شده:' : 'Stored Snapshot History:'}
        </h3>

        {snapshots.map((snap) => (
          <div 
            key={snap.id}
            className="p-4 rounded-2xl bg-[#07090e]/80 border border-white/[0.06] hover:border-violet-500/30 flex flex-wrap items-center justify-between gap-3 transition"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-violet-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-xs">{snap.label}</span>
                  {snap.isInitialBaseline && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Baseline
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {snap.timestamp} • {Object.keys(snap.files).length} files
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRestoreSnapshot(snap)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'بازگردانی تمام فایل‌ها به این زمان' : 'Restore All'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Global Baseline Confirmation Modal */}
      {showConfirmGlobal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="sirene-card bg-[#0b0e17] border border-rose-500/40 p-6 sm:p-7 rounded-3xl max-w-md w-full shadow-[0_20px_60px_rgba(244,63,94,0.2)] text-start space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                {isFa ? 'تأیید بازگردانی سراسری به وضعیت اولیه' : 'Confirm Global Rollback to Initial State'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa 
                ? 'با اجرای این عملیات، تمام فایل‌های کانفیگ (inputs.conf, outputs.conf, server.conf, indexes.conf, props.conf و ...) دقیقاً به نسخه اولیه که در اولین لحظه اسکن برداشته شد بازگردانده خواهند شد.'
                : 'This will revert ALL configuration files back to the clean snapshot taken when the applet first scanned.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmGlobal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-semibold text-xs transition"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onGlobalRestoreBaseline();
                  setShowConfirmGlobal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(244,63,94,0.3)] transition"
              >
                {isFa ? 'بله، همه را بازگردان' : 'Yes, Revert All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
