import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Upload, RefreshCw, ShieldCheck, AlertTriangle, Clock, Package, RotateCcw } from 'lucide-react';

interface UpdateManagerProps {
  isFa: boolean;
}

type UpdateState = 'idle' | 'uploading' | 'staging' | 'restarting' | 'verifying' | 'success' | 'rollback' | 'error';

interface UpdateStatus {
  success?: boolean;
  jobId?: string;
  state?: UpdateState;
  status?: string;
  currentVersion?: string;
  targetVersion?: string;
  messageFa?: string;
  messageEn?: string;
  logs?: string[];
  error?: string;
  backupPath?: string;
  checkedAt?: string;
}

export const UpdateManager: React.FC<UpdateManagerProps> = ({ isFa }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentVersion, setCurrentVersion] = useState('unknown');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<UpdateState>('idle');
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const loadVersion = async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data.success) setCurrentVersion(String(data.version || 'unknown'));
    } catch (_) {}
  };

  useEffect(() => { void loadVersion(); }, []);

  const pollJob = async (jobId: string) => {
    setPolling(true);
    try {
      for (let i = 0; i < 180; i++) {
        await new Promise(r => window.setTimeout(r, 1500));
        try {
          const res = await fetch('/api/system/update/status/' + encodeURIComponent(jobId), { cache: 'no-store' });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.success === false) {
            // During systemd restart the API can briefly disappear. Keep polling.
            continue;
          }
          setStatus(data);
          const nextState = String(data.state || 'verifying') as UpdateState;
          setState(nextState);
          if (['success', 'rollback', 'error'].includes(nextState)) break;
        } catch (_) {
          // Expected for a short window while the service restarts.
          setState('restarting');
        }
      }
    } finally {
      setPolling(false);
      await loadVersion();
    }
  };

  const handleInstall = async () => {
    if (!selectedFile || state !== 'idle') return;
    setError('');
    setStatus(null);
    setState('uploading');

    try {
      const contentType = selectedFile.name.endsWith('.tar.gz') || selectedFile.name.endsWith('.tgz')
        ? 'application/gzip'
        : 'application/octet-stream';

      const res = await fetch('/api/system/update/upload', {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'X-Update-Filename': encodeURIComponent(selectedFile.name)
        },
        body: selectedFile
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false || !data.jobId) {
        throw new Error(data.error || (isFa ? 'بارگذاری Update شکست خورد.' : 'Update upload failed.'));
      }
      setStatus(data);
      setState(String(data.state || 'staging') as UpdateState);
      await pollJob(String(data.jobId));
    } catch (e: any) {
      setError(e?.message || String(e));
      setState('error');
    }
  };

  const stateLabel = (() => {
    if (isFa) {
      switch (state) {
        case 'uploading': return 'در حال بارگذاری Update…';
        case 'staging': return 'در حال اعتبارسنجی و نصب…';
        case 'restarting': return 'در حال Restart سرویس…';
        case 'verifying': return 'در حال بررسی نسخه جدید…';
        case 'success': return 'بروزرسانی با موفقیت انجام شد';
        case 'rollback': return 'Rollback انجام شد';
        case 'error': return 'بروزرسانی ناموفق بود';
        default: return 'آماده دریافت فایل Update';
      }
    }
    switch (state) {
      case 'uploading': return 'Uploading update…';
      case 'staging': return 'Validating and installing…';
      case 'restarting': return 'Restarting service…';
      case 'verifying': return 'Verifying new version…';
      case 'success': return 'Update completed successfully';
      case 'rollback': return 'Rollback completed';
      case 'error': return 'Update failed';
      default: return 'Ready for update package';
    }
  })();

  return (
    <div className='space-y-5'>
      <div className='rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-start gap-3'>
            <div className='p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20'>
              <Package className='w-5 h-5 text-cyan-300' />
            </div>
            <div>
              <h2 className='text-base font-black text-white'>{isFa ? 'مدیریت بروزرسانی Pilot' : 'Pilot Update Manager'}</h2>
              <p className='text-[11px] text-slate-400 mt-1 max-w-2xl'>
                {isFa
                  ? 'از این به بعد فایل Update نسخه‌های جدید را همین‌جا بارگذاری و نصب کنید؛ نسخه فعلی Backup می‌شود و در صورت شکست، Rollback خودکار انجام می‌شود.'
                  : 'Upload future Pilot update packages here. The current installation is backed up and automatically rolled back if the update fails.'}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-[9px] text-slate-500'>{isFa ? 'نسخه نصب‌شده' : 'Installed version'}</div>
            <div className='font-mono text-sm text-emerald-300 mt-1'>{currentVersion}</div>
          </div>
        </div>
      </div>

      <div className='grid md:grid-cols-2 gap-4'>
        <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4'>
          <div className='flex items-center gap-2 text-white text-sm font-bold'><ShieldCheck className='w-4 h-4 text-emerald-400' />{isFa ? 'فایل Update' : 'Update package'}</div>

          <input
            ref={inputRef}
            type='file'
            accept='.tar.gz,.tgz,application/gzip,application/x-gzip'
            className='hidden'
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          />

          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            disabled={state !== 'idle'}
            className='w-full min-h-32 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/20 text-cyan-200 flex flex-col items-center justify-center gap-2 disabled:opacity-50'
          >
            <Upload className='w-6 h-6' />
            <span className='text-xs font-bold'>{isFa ? 'انتخاب فایل Update' : 'Choose update file'}</span>
            <span className='text-[10px] text-slate-500'>.tar.gz</span>
          </button>

          {selectedFile && (
            <div className='rounded-xl bg-black/30 border border-white/[0.06] p-3'>
              <div className='text-[11px] text-white break-all'>{selectedFile.name}</div>
              <div className='text-[10px] text-slate-500 mt-1'>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          )}

          <button
            type='button'
            onClick={() => void handleInstall()}
            disabled={!selectedFile || state !== 'idle' || polling}
            className='w-full px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs disabled:opacity-40 inline-flex items-center justify-center gap-2'
          >
            {state === 'idle' ? <Upload className='w-4 h-4' /> : <RefreshCw className='w-4 h-4 animate-spin' />}
            {isFa ? 'بارگذاری و نصب Update' : 'Upload & Install Update'}
          </button>

          <div className='text-[9px] text-slate-500 leading-5'>
            {isFa
              ? 'هیچ تغییر دستی روی سرور لازم نیست. Update Manager Backup، اعتبارسنجی، نصب، Restart و Health Check را خودش انجام می‌دهد.'
              : 'No manual server command is required. Update Manager performs backup, validation, installation, restart and health verification.'}
          </div>
        </div>

        <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-bold text-white'>{isFa ? 'وضعیت عملیات' : 'Operation status'}</div>
            <div className='text-[10px] text-slate-500 flex items-center gap-1'><Clock className='w-3 h-3' />{status?.checkedAt ? new Date(status.checkedAt).toLocaleTimeString() : '—'}</div>
          </div>

          <div className='rounded-xl border border-white/[0.06] bg-black/20 p-4'>
            <div className='flex items-center gap-2'>
              {state === 'success' ? <CheckCircle2 className='w-5 h-5 text-emerald-400' /> : state === 'error' || state === 'rollback' ? <AlertTriangle className='w-5 h-5 text-amber-400' /> : <RefreshCw className='w-5 h-5 text-cyan-400 animate-spin' />}
              <span className='text-xs font-black text-white'>{stateLabel}</span>
            </div>
            {status?.targetVersion && <div className='mt-3 text-[10px] text-slate-400'>{isFa ? 'نسخه هدف:' : 'Target version:'} <span className='font-mono text-cyan-300'>{status.targetVersion}</span></div>}
            {status?.backupPath && <div className='mt-1 text-[9px] text-slate-500 break-all'>{isFa ? 'Backup:' : 'Backup:'} {status.backupPath}</div>}
          </div>

          {(status?.logs?.length || error) ? (
            <div className='rounded-xl border border-white/[0.06] bg-black/40 p-3 max-h-72 overflow-y-auto'>
              <pre className='text-[10px] text-slate-300 whitespace-pre-wrap break-words font-mono'>
                {(status?.logs || []).join('\n')}
                {error ? '\n[CLIENT ERROR] ' + error : ''}
              </pre>
            </div>
          ) : (
            <div className='rounded-xl border border-white/[0.06] bg-black/20 p-4 text-[10px] text-slate-500'>
              {isFa ? 'هنوز عملیات بروزرسانی اجرا نشده است.' : 'No update operation has been executed yet.'}
            </div>
          )}

          {state === 'success' && (
            <button
              type='button'
              onClick={() => { setSelectedFile(null); setState('idle'); setStatus(null); }}
              className='w-full px-3 py-2 rounded-xl bg-white/[0.06] text-white text-xs font-bold'
            >
              {isFa ? 'بروزرسانی جدید آماده است' : 'Ready for next update'}
            </button>
          )}

          {state === 'rollback' && (
            <div className='rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-[10px] text-amber-200 flex items-start gap-2'>
              <RotateCcw className='w-4 h-4 shrink-0' />
              <span>{isFa ? 'نسخه قبلی حفظ شد و سرویس به حالت سالم قبلی برگشت.' : 'The previous version was preserved and the service was restored.'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateManager;
