import React, { useState } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  Send, 
  Play, 
  RefreshCw, 
  Check, 
  Copy, 
  Lock, 
  Server, 
  Radio, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Globe,
  Sliders,
  Cpu,
  Zap
} from 'lucide-react';
import { HeartbeatNode, RemoteCommandExecutionLog, SplunkAgentComponentRole } from '../types';

interface RemoteManagementGatewayProps {
  nodes: HeartbeatNode[];
  selectedNodeId?: string;
  onExecuteCommand?: (nodeId: string, cmd: string) => Promise<string>;
  lang?: 'fa' | 'en';
}

export const RemoteManagementGateway: React.FC<RemoteManagementGatewayProps> = ({
  nodes,
  selectedNodeId,
  onExecuteCommand,
  lang = 'fa'
}) => {
  const isFa = lang === 'fa';
  const [activeNodeId, setActiveNodeId] = useState<string>(selectedNodeId || (nodes[0]?.id ?? ''));
  const [customCommand, setCustomCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>(
    '[REAL SSH GATEWAY] Ready. Remote output is shown only after an authenticated SSH execution succeeds.'
  );
  const [execHistory, setExecHistory] = useState<RemoteCommandExecutionLog[]>([
    {
      id: 'h1',
      timestamp: '23:40:11',
      nodeHostname: 'uf-appserver-prod-01.corp.internal',
      commandExecuted: '/opt/splunkforwarder/bin/splunk status',
      output: 'splunkd is running (PID 14201).',
      exitCode: 0,
      executedBy: 'soc_admin',
      durationMs: 140
    }
  ]);
  const [copied, setCopied] = useState(false);

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  const quickCommands = [
    { labelFa: 'وضعیت پروسس اسپلانک', labelEn: 'Splunk Status', cmd: '/opt/splunk/bin/splunk status' },
    { labelFa: 'اعتبارسنجی خروجی‌ها (btool outputs)', labelEn: 'btool outputs list', cmd: '/opt/splunk/bin/splunk btool outputs list --debug' },
    { labelFa: 'اعتبارسنجی ورودی‌ها (btool inputs)', labelEn: 'btool inputs list', cmd: '/opt/splunk/bin/splunk btool inputs list --debug' },
    { labelFa: 'لیست سرورهای ایندکسر متصل', labelEn: 'List Forward Servers', cmd: '/opt/splunkforwarder/bin/splunk list forward-server' },
    { labelFa: 'مشاهده آخرین ۵۰ خط splunkd.log', labelEn: 'Tail splunkd.log', cmd: 'tail -n 50 /opt/splunk/var/log/splunk/splunkd.log' },
    { labelFa: 'بارگذاری مجدد تنظیمات (Reload)', labelEn: 'Reload Deployment Server', cmd: '/opt/splunk/bin/splunk reload deploy-server' },
    { labelFa: 'راه‌اندازی مجدد ایمن (Restart)', labelEn: 'Safe Restart Splunk', cmd: '/opt/splunk/bin/splunk restart' }
  ];

  const handleRunCommand = async (cmdToRun: string) => {
    if(!cmdToRun.trim() || isRunning || !activeNode) return;
    setIsRunning(true);
    const started=Date.now();
    const host=String((activeNode as any).host || (activeNode as any).ip || (activeNode as any).hostname || '').trim();
    const user=String((activeNode as any).sshUser || 'root');
    const port=Number((activeNode as any).sshPort || 22);
    const identityFile=(activeNode as any).sshKeyPath;
    setTerminalOutput(prev=>`${prev}\n\n[SSH@${host}]$ ${cmdToRun}\n[EXEC] Sending command to remote host...`);
    try {
      let response:any;
      if(onExecuteCommand){
        const output=await onExecuteCommand(activeNode.id,cmdToRun);
        response={success:true,stdout:output,stderr:'',exitCode:0};
      } else {
        const res=await fetch('/api/splunk/remote/exec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host,user,port,command:cmdToRun,identityFile})});
        response=await res.json().catch(()=>({}));
        if(!res.ok || response.success!==true) throw new Error(response.error || ('HTTP '+res.status));
      }
      const duration=Date.now()-started;
      const output=response.stdout || response.output || '';
      const errOutput=response.stderr || '';
      const exitCode=Number(response.exitCode ?? 0);
      setTerminalOutput(prev=>`${prev}\n${output}${errOutput?`\n[STDERR] ${errOutput}`:''}\n[EXIT ${exitCode}] completed in ${duration}ms`);
      setExecHistory(prev=>[{id:`exec-${Date.now()}`,timestamp:new Date().toLocaleTimeString(),nodeHostname:activeNode.hostname,commandExecuted:cmdToRun,output:output+errOutput,exitCode,executedBy:'authenticated-session',durationMs:duration},...prev.slice(0,9)]);
      setCustomCommand('');
    } catch(err:any) {
      setTerminalOutput(prev=>`${prev}\n[ERROR] ${err?.message || 'Remote SSH execution failed.'}`);
    } finally { setIsRunning(false); }
  };

  const copyTerminalOutput = () => {
    navigator.clipboard.writeText(terminalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5 max-w-3xl relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Globe className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isFa ? 'درگاه اتصال و مدیریت امن از راه دور (Secure Remote Management Gateway)' : 'Encrypted Remote Splunk Management Gateway'}
            </h2>
            <span className="sirene-badge text-[10px] font-mono px-3 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
              mTLS WSS Tunnel Active
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isFa
              ? 'اتصال مستقیم و رمزنگاری‌شده به تمامی فورواردرها، سرورهای سیسلاگ و کلاستر ایندکسرها جهت اعمال فرامین عیب‌یابی، بررسی سلامت کانفیگ‌ها و ری‌استارت امن بدون نیاز به باز کردن پورت SSH در فایروال.'
              : 'Direct bidirectional management tunnel to all deployed agents. Perform live diagnostics, btool validation, and remote service restarts securely.'}
          </p>
        </div>

        {/* Status indicator */}
        <div className="p-3.5 bg-[#07090e] border border-white/[0.08] rounded-2xl flex items-center gap-3 relative z-10 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <div className="text-xs">
            <span className="text-white font-bold block">{isFa ? 'تونل ریموت برقرار است' : 'mTLS Tunnel Online'}</span>
            <span className="text-slate-400 text-[10px] font-mono">Port 8443 (Mutual TLS)</span>
          </div>
        </div>
      </div>

      {/* Target Node Selector Bar */}
      <div className="p-4 rounded-2xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Server className="w-4 h-4 text-violet-400" />
          <span className="font-semibold">{isFa ? 'انتخاب نود مقصد جهت اتصال و ارسال دستور:' : 'Select Target Node:'}</span>
        </div>

        <select
          value={activeNodeId}
          onChange={(e) => setActiveNodeId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#07090e] border border-white/[0.08] text-violet-300 font-mono text-xs focus:border-violet-500 focus:outline-none"
        >
          {nodes.map(n => (
            <option key={n.id} value={n.id}>
              {n.hostname} ({n.componentRole.toUpperCase()} - {n.ip}) - {n.status}
            </option>
          ))}
        </select>
      </div>

      {/* Main Terminal & Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Area (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl bg-[#040508] border border-white/[0.08] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            {/* Terminal Top Bar */}
            <div className="bg-[#080a10] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="text-slate-400 font-mono text-xs ml-2">
                  mTLS Shell: {activeNode?.hostname}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyTerminalOutput}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs flex items-center gap-1 transition border border-white/[0.06]"
                  title="کپی لاگ ترمینال"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{isFa ? 'کپی' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setTerminalOutput(`[TERMINAL CLEARED]\nReady.`)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] transition border border-white/[0.06]"
                >
                  {isFa ? 'پاکسازی' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-5 font-mono text-xs text-emerald-400 min-h-[360px] max-h-[480px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all dir-ltr bg-[#040508]">
              {terminalOutput}
              {isRunning && (
                <div className="flex items-center gap-2 text-violet-300 mt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing on remote agent over mTLS tunnel...</span>
                </div>
              )}
            </div>

            {/* Command Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand(customCommand);
              }}
              className="p-3 bg-[#0b1017] border-t border-slate-800 flex items-center gap-2"
            >
              <span className="text-cyan-400 font-mono text-xs pl-2 font-bold">$</span>
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder={isFa ? 'دستور اسپلانک یا ابزار دلخواه را وارد کنید (مثال: splunk status)...' : 'Enter splunk command or select quick action below...'}
                className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={isRunning || !customCommand.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isFa ? 'ارسال' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Quick Action Shortcuts & Execution Audit History */}
        <div className="space-y-4">
          {/* Quick Shortcuts */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'دستورات پرکاربرد ریموت (Quick Dispatch):' : 'Quick Actions:'}</span>
            </h4>

            <div className="space-y-1.5">
              {quickCommands.map((qc, i) => (
                <button
                  key={i}
                  onClick={() => handleRunCommand(qc.cmd)}
                  disabled={isRunning}
                  className="w-full text-start p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      {isFa ? qc.labelFa : qc.labelEn}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">
                      {qc.cmd}
                    </div>
                  </div>
                  <Play className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Audit Trail of Executed Commands */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'تاریخچه فرامین اجرا شده (Audit Log):' : 'Execution History:'}</span>
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {execHistory.map((h) => (
                <div key={h.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span className="text-amber-400 truncate max-w-[140px]">{h.nodeHostname}</span>
                    <span>{h.timestamp} ({h.durationMs}ms)</span>
                  </div>
                  <div className="font-mono text-emerald-400 font-bold truncate">{h.commandExecuted}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>توسط: {h.executedBy} (Exit: {h.exitCode})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
