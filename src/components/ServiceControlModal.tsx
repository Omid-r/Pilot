import React, { useState } from 'react';
import { 
  Terminal, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Play, 
  Activity, 
  Server,
  ShieldCheck
} from 'lucide-react';

interface ServiceControlModalProps {
  onClose: () => void;
  lang: 'fa' | 'en';
}

export const ServiceControlModal: React.FC<ServiceControlModalProps> = ({ onClose, lang }) => {
  const isFa = lang === 'fa';
  const [selectedServerType, setSelectedServerType] = useState<'parallel' | 'real'>('parallel');
  const [activeCommand, setActiveCommand] = useState<string>('restart');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [statusResult, setStatusResult] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  const executeCommand = async (cmdKey: string) => {
    setIsRunning(true);
    setStatusResult('running');
    setActiveCommand(cmdKey);

    const targetDir = selectedServerType === 'real' ? '/opt/splunk' : '/opt/splunk_parallel';
    const serverLabel = selectedServerType === 'real'
      ? 'Real Primary Instance (/opt/splunk :8000)'
      : 'Parallel Splunk Instance (/opt/splunk_parallel :8001)';

    setTerminalOutput([`[TARGET] ${serverLabel}`]);

    try {
      if (cmdKey === 'restart' || cmdKey === 'start' || cmdKey === 'stop') {
        const res = await fetch('/api/splunk/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: cmdKey, serverType: selectedServerType, targetDir })
        });
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(prev => [
          ...prev,
          ...(data.stdout ? String(data.stdout).split('\\n') : []),
          ...(data.stderr ? [`ERROR: ${data.stderr}`] : []),
          `HTTP ${res.status}`
        ]);
        if (!res.ok || data.success !== true) throw new Error(data.error || `splunk ${cmdKey} failed`);
      } else if (cmdKey === 'status') {
        const res = await fetch(`/api/splunk/status?serverType=${selectedServerType}&targetDir=${encodeURIComponent(targetDir)}`);
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(prev => [
          ...prev,
          `Service detected: ${data.installed ? 'Yes' : 'No'}`,
          `Process running: ${data.running ? 'Yes' : 'No'}`,
          `PID: ${data.processId || 'None'}`,
          String(data.status || '')
        ]);
        if (!res.ok) throw new Error(data.error || 'Status query failed');
      } else if (cmdKey === 'btool') {
        const res = await fetch(`/api/splunk/btool?serverType=${selectedServerType}&targetDir=${encodeURIComponent(targetDir)}`);
        const data = await res.json().catch(() => ({}));
        const errors = Array.isArray(data.errors) ? data.errors : [];
        setTerminalOutput(prev => [
          ...prev,
          ...(errors.length ? errors.map((x: any) => String(x.message || JSON.stringify(x))) : ['No btool errors reported by the backend.'])
        ]);
        if (!res.ok) throw new Error(data.error || 'btool check failed');
      } else if (cmdKey === 'reset_pass') {
        const newPassword = window.prompt(isFa ? 'رمز عبور جدید ادمین را وارد کنید (حداقل 12 کاراکتر):' : 'Enter the new admin password (minimum 12 characters):') || '';
        if (newPassword.length < 12) throw new Error(isFa ? 'رمز باید حداقل 12 کاراکتر باشد.' : 'Password must be at least 12 characters.');
        const currentPassword = window.prompt(isFa ? 'رمز فعلی ادمین را وارد کنید:' : 'Enter the current admin password:') || '';
        if (!currentPassword) throw new Error(isFa ? 'رمز فعلی لازم است.' : 'Current password is required.');
        const res = await fetch('/api/splunk/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetDir, currentPassword, newPassword })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success !== true) throw new Error(data.error || 'Password reset failed.');
        setTerminalOutput(prev => [...prev, data.message || 'Admin password changed successfully.']);
      } else if (cmdKey === 'bootstart_troubleshoot') {
        const res = await fetch('/api/splunk/troubleshoot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetDir })
        });
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(prev => [...prev, ...(Array.isArray(data.logs) ? data.logs : [String(data.message || '')])]);
        if (!res.ok || data.success !== true) throw new Error(data.error || 'Troubleshoot failed.');
      } else {
        throw new Error(`Unsupported command: ${cmdKey}`);
      }

      setStatusResult('success');
    } catch (err: any) {
      const message = err?.message || 'Operation failed.';
      setTerminalOutput(prev => [...prev, `[FAILED] ${message}`]);
      setStatusResult('failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-[#0e141c] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-start"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121822] border-b border-slate-800 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isFa ? 'مدیریت و کنترل سرویس اسپلانک (Splunk Service Controller)' : 'Splunk Service Control & CLI Executor'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isFa ? 'ریستارت سرویس، بررسی وضعیت اجرا و گرفتن خروجی btool check' : 'Restart daemon, query status, and run btool pre-flight checks.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Selection Switcher Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Server className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{isFa ? 'انتخاب نوع سرور هدف:' : 'Select Target Server Instance:'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedServerType('parallel')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                selectedServerType === 'parallel'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{isFa ? '⚡ سرور موازی / استیجینگ' : 'Parallel Instance'}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                :8001
              </span>
            </button>

            <button
              onClick={() => setSelectedServerType('real')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                selectedServerType === 'real'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{isFa ? '🌐 سرور اصلی / واقعی' : 'Real Primary Host'}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                :8000
              </span>
            </button>
          </div>
        </div>

        {/* Command Buttons */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => executeCommand('restart')}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
            >
              <RotateCw className={`w-4 h-4 ${isRunning && activeCommand === 'restart' ? 'animate-spin' : ''}`} />
              <span>{isFa ? 'ریستارت اسپلانک' : 'Restart Splunk'}</span>
            </button>

            <button
              onClick={() => executeCommand('status')}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-2 disabled:opacity-50 transition"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'دریافت وضعیت (status)' : 'Check Status'}</span>
            </button>

            <button
              onClick={() => executeCommand('btool')}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-2 disabled:opacity-50 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'تست سینتکس (btool)' : 'btool check'}</span>
            </button>

            <button
              onClick={() => executeCommand('reset_pass')}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 font-semibold flex items-center gap-2 disabled:opacity-50 transition"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'ریست پسورد به admin/changeme' : 'Reset Password'}</span>
            </button>

            <button
              onClick={() => executeCommand('bootstart_troubleshoot')}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow-lg shadow-rose-950/20"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{isFa ? 'رفع خطای SPLUNK_OS_USER' : 'Fix SPLUNK_OS_USER'}</span>
            </button>
          </div>

          {/* Terminal Console */}
          <div className="rounded-xl bg-[#06090d] border border-slate-900 p-4 font-mono text-xs text-slate-300 min-h-[220px] max-h-[300px] overflow-y-auto space-y-1 shadow-inner">
            <div className="text-slate-600 mb-2"># Splunk Enterprise Interactive Terminal Shell v9.2</div>
            {terminalOutput.map((line, idx) => {
              let colorClass = 'text-slate-300';
              if (line.startsWith('$')) {
                colorClass = 'text-amber-400 font-bold';
              } else if (line.includes('ERROR') || line.includes('Failed')) {
                colorClass = 'text-rose-400 font-bold';
              } else if (line.includes('SUCCESS') || line.includes('[OK]') || line.includes('complete') || line.includes('OK')) {
                colorClass = 'text-emerald-400 font-bold';
              } else if (line.includes('SOLUTIONS') || line.includes('ANALYSIS')) {
                colorClass = 'text-cyan-400 font-bold mt-2';
              } else if (line.trim().startsWith('sudo') || line.trim().startsWith('chown') || line.includes('splunk-launch.conf') || line.trim().startsWith('chown')) {
                colorClass = 'text-amber-200 font-mono pl-4';
              }
              return (
                <div key={idx} className={colorClass}>
                  {line}
                </div>
              );
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-amber-400 animate-pulse pt-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Executing on server daemon...</span>
              </div>
            )}
            {statusResult === 'success' && !isRunning && (
              <div className="pt-2 text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFa ? 'دستور با موفقیت به پایان رسید و وضعیت اسپلانک بررسی شد.' : 'Execution completed with return code 0.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#121822] border-t border-slate-800 p-3 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
          >
            {isFa ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
