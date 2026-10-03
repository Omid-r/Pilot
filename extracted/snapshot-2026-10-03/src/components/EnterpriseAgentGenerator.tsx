import React, { useState } from 'react';
import { 
  Package, 
  Terminal, 
  ShieldCheck, 
  Check, 
  Copy, 
  Lock, 
  Server, 
  Cpu, 
  Radio, 
  Layers, 
  Download, 
  Play, 
  Eye, 
  EyeOff, 
  FileCode, 
  Sparkles,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { ComponentAgentPackage, SplunkAgentComponentRole } from '../types';
import { COMPONENT_AGENTS_CATALOG } from '../data/agentPackagesData';

interface EnterpriseAgentGeneratorProps {
  onRunTestCommand?: (agentRole: SplunkAgentComponentRole, command: string) => void;
  lang?: 'fa' | 'en';
}

export const EnterpriseAgentGenerator: React.FC<EnterpriseAgentGeneratorProps> = ({
  onRunTestCommand,
  lang = 'fa'
}) => {
  const isFa = lang === 'fa';
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-uf');
  const [activeScriptTab, setActiveScriptTab] = useState<'bash' | 'systemd' | 'powershell' | 'docker' | 'yaml'>('bash');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedAgent = COMPONENT_AGENTS_CATALOG.find(a => a.id === selectedAgentId) || COMPONENT_AGENTS_CATALOG[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setToastMsg(isFa ? 'دستور با موفقیت کپی شد.' : 'Copied to clipboard.');
    setTimeout(() => {
      setCopiedKey(null);
      setToastMsg(null);
    }, 2500);
  };

  const getRoleIcon = (role: SplunkAgentComponentRole) => {
    switch (role) {
      case 'universal_forwarder': return <Package className="w-5 h-5 text-amber-400" />;
      case 'heavy_forwarder': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'syslog_collector': return <Radio className="w-5 h-5 text-purple-400" />;
      case 'indexer_node': return <HardDrive className="w-5 h-5 text-emerald-400" />;
      case 'search_head': return <Layers className="w-5 h-5 text-sky-400" />;
      case 'deployment_server': return <Server className="w-5 h-5 text-orange-400" />;
      default: return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 border border-amber-500/80 text-amber-300 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5 max-w-3xl relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Package className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isFa ? 'مرکز تولید ایجنت‌های اختصاصی کامپوننت‌های اسپلانک (Dedicated Agents)' : 'Component-Specific Splunk Diagnostic & Management Agents'}
            </h2>
            <span className="sirene-badge text-[10px] px-3 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25 font-mono font-bold">
              Zero-Trust Native
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isFa
              ? 'ایجنت‌های سبک (سبک‌تر از ۱۵ مگابایت بدون وابستگی) مخصوص هر نقش در اسپلانک طراحی شده‌اند. سازمان‌ها این ایجنت را روی نودهای خود نصب می‌کنند تا بدون خروج حتی یک بایت از داده‌های کاری، پنل مرکزی بتواند سلامت لاگ‌ها، خط لوله و اعمال فرامین را مدیریت کند.'
              : 'Lightweight static agent binaries built specifically for Universal Forwarders, Heavy Forwarders, Syslog, and Indexers with zero raw-payload leakage.'}
          </p>
        </div>

        {/* Security Badge */}
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-3 shrink-0 relative z-10">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div className="text-[11px]">
            <span className="text-emerald-300 font-bold block">{isFa ? 'رمزگذاری دوطرفه mTLS 1.3' : 'mTLS 1.3 Handshake'}</span>
            <span className="text-slate-400">{isFa ? 'تضمین حفظ حریم خصوصی سازمانی' : 'Guaranteed PII Masking'}</span>
          </div>
        </div>
      </div>

      {/* Component Roles Selector Tabs - Sirene Glass Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {COMPONENT_AGENTS_CATALOG.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#131828] border-violet-500/80 shadow-[0_0_20px_rgba(124,58,237,0.3)] ring-1 ring-violet-500/50'
                  : 'bg-[#0b0e17]/80 backdrop-blur-xl border-white/[0.08] hover:border-violet-500/40 hover:bg-[#111522]'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="p-2 rounded-xl bg-[#07090e] border border-white/[0.06]">
                  {getRoleIcon(agent.componentRole)}
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>}
              </div>
              <div>
                <div className="text-xs font-bold text-white mb-0.5 truncate">
                  {agent.componentRole === 'universal_forwarder' && 'Universal Forwarder'}
                  {agent.componentRole === 'heavy_forwarder' && 'Heavy Forwarder'}
                  {agent.componentRole === 'syslog_collector' && 'Syslog Collector'}
                  {agent.componentRole === 'indexer_node' && 'Indexer Cluster'}
                  {agent.componentRole === 'search_head' && 'Search Head'}
                  {agent.componentRole === 'deployment_server' && 'Deployment Server'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{agent.version}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Detailed Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Installer scripts & Config */}
        <div className="lg:col-span-2 space-y-4">
          <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                  <span>{isFa ? selectedAgent.titleFa : selectedAgent.titleEn}</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/25">
                    {selectedAgent.binarySize}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {isFa ? selectedAgent.descriptionFa : selectedAgent.descriptionEn}
                </p>
              </div>
            </div>

            {/* Script Format Tabs - Sirene Segmented Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-2.5">
              <button
                onClick={() => setActiveScriptTab('bash')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeScriptTab === 'bash'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isFa ? 'دستور تک خطی لینوکس (Linux One-Liner)' : 'Linux Bash Script'}</span>
              </button>
              <button
                onClick={() => setActiveScriptTab('systemd')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeScriptTab === 'systemd'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{isFa ? 'سرویس لینوکس (systemd service)' : 'Systemd Service'}</span>
              </button>
              <button
                onClick={() => setActiveScriptTab('yaml')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeScriptTab === 'yaml'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{isFa ? 'کانفیگ ایجنت (agent.yaml)' : 'agent.yaml Config'}</span>
              </button>
              <button
                onClick={() => setActiveScriptTab('docker')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeScriptTab === 'docker'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Docker Container</span>
              </button>
              {selectedAgent.installScripts.windowsPowerShell && selectedAgent.installScripts.windowsPowerShell.length > 20 && (
                <button
                  onClick={() => setActiveScriptTab('powershell')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeScriptTab === 'powershell'
                      ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Windows PowerShell</span>
                </button>
              )}
            </div>

            {/* Script Display Codebox */}
            <div className="relative">
              <div className="p-4 rounded-xl bg-[#06090e] border border-slate-800 font-mono text-xs text-emerald-400 max-h-80 overflow-y-auto whitespace-pre leading-relaxed select-all dir-ltr">
                {activeScriptTab === 'bash' && selectedAgent.installScripts.linuxBashOneLiner}
                {activeScriptTab === 'systemd' && selectedAgent.installScripts.systemdServiceFile}
                {activeScriptTab === 'yaml' && selectedAgent.sampleAgentConfigYaml}
                {activeScriptTab === 'docker' && selectedAgent.installScripts.dockerCompose}
                {activeScriptTab === 'powershell' && selectedAgent.installScripts.windowsPowerShell}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    let code = selectedAgent.installScripts.linuxBashOneLiner;
                    if (activeScriptTab === 'systemd') code = selectedAgent.installScripts.systemdServiceFile;
                    if (activeScriptTab === 'yaml') code = selectedAgent.sampleAgentConfigYaml;
                    if (activeScriptTab === 'docker') code = selectedAgent.installScripts.dockerCompose;
                    if (activeScriptTab === 'powershell') code = selectedAgent.installScripts.windowsPowerShell;
                    handleCopy(code, `code_${activeScriptTab}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700 shadow-md"
                >
                  {copiedKey === `code_${activeScriptTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isFa ? 'کپی اسکریپت' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instruction Callout for Customer */}
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs text-cyan-200/90 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'راهنمای تحویل به مشتری / سازمان:' : 'Customer Delivery Instructions:'}</span>
              </span>
              <p className="leading-relaxed text-[11px] text-slate-300">
                {isFa
                  ? 'به مشتری بگویید: «تنها کافیست این دستور تک‌خطی را در ترمینال سرور خود اجرا کنید تا ایجنت به صورت یک سرویس محافظت‌شده با گواهی mTLS فعال شده و نود شما در پنل متمرکز پایش گردد».'
                  : 'Instruct the client to execute the one-line installer with sudo permissions. The agent initiates an encrypted mTLS tunnel back to the doctor gateway.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Privacy Guarantee & Supported Agent Actions */}
        <div className="space-y-4">
          {/* Privacy Guarantee Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>{isFa ? 'سند حفظ محرمانگی داده‌ها (Zero-Trust Privacy)' : 'Zero-Trust Confidentiality Guarantee'}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {selectedAgent.securityProfile.dataConfidentialityGuarantee}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>{isFa ? 'پروتکل ترانزیت لاگ و تله‌متری:' : 'Transit Security:'}</span>
                <span className="text-emerald-300 font-mono font-bold">{selectedAgent.securityProfile.tlsProtocol}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isFa ? 'کدر کردن آدرس‌های IP و PII محلی:' : 'Local IP Anonymization:'}</span>
                <span className="text-emerald-300 font-bold">فعال (SHA-256)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isFa ? 'سیستم‌عامل‌های تحت پشتیبانی:' : 'OS Support:'}</span>
                <span className="text-slate-200">{selectedAgent.supportedOS.length} سیستم‌عامل</span>
              </div>
            </div>
          </div>

          {/* Supported Actions by Agent */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'قابلیت‌های اجرایی ایجنت روی این کامپوننت:' : 'Remote Agent Capabilities:'}</span>
            </h4>
            <ul className="space-y-2 text-[11px]">
              {selectedAgent.supportedActions.map((act, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
