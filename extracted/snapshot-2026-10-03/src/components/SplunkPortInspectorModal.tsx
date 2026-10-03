import React, { useState } from 'react';
import { 
  SplunkPortDefinition, 
  SPLUNK_PORT_DEFINITIONS,
  ServerAssetNode 
} from '../data/splunkDeployerData';
import { 
  Network, 
  ShieldAlert, 
  Check, 
  X, 
  FileCode, 
  ArrowRight, 
  Info, 
  Terminal, 
  Sliders, 
  Lock,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface SplunkPortInspectorModalProps {
  portNumber: number | string;
  associatedNode?: ServerAssetNode;
  allNodes: ServerAssetNode[];
  onClose: () => void;
  onUpdatePortNumber: (nodeId: string, portKey: string, newPort: number) => void;
  lang: 'fa' | 'en';
}

export const SplunkPortInspectorModal: React.FC<SplunkPortInspectorModalProps> = ({
  portNumber,
  associatedNode,
  allNodes,
  onClose,
  onUpdatePortNumber,
  lang
}) => {
  const isFa = lang === 'fa';
  const portKey = String(portNumber);
  
  // Find official port definition or build a generic fallback
  const portDef: SplunkPortDefinition = SPLUNK_PORT_DEFINITIONS[portKey] || {
    port: Number(portNumber),
    key: 'customPort',
    nameEn: `Custom Splunk Port ${portNumber}`,
    nameFa: `پورت سفارشی اسپلانک (${portNumber})`,
    protocol: 'TCP',
    direction: 'Inbound',
    configFile: 'inputs.conf / server.conf',
    descriptionEn: `Port ${portNumber} configured for custom network ingestion or inter-node transport.`,
    descriptionFa: `پورت شماره ${portNumber} تنظیم‌شده جهت دریافت داده‌های شبکه یا ارتباطات داخلی نودهای اسپلانک.`,
    defaultAllowedSources: 'Internal Cluster Subnets / Authorized Forwarders',
    securityImpact: 'Data Pipeline'
  };

  const [currentPortInput, setCurrentPortInput] = useState<number>(Number(portNumber));
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string>(
    associatedNode ? associatedNode.id : allNodes[0]?.id || ''
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleApplyPortChange = () => {
    if (selectedTargetNodeId && currentPortInput > 0 && currentPortInput <= 65535) {
      onUpdatePortNumber(selectedTargetNodeId, portDef.key, currentPortInput);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/60 font-mono font-bold text-base">
              :{portNumber}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isFa ? portDef.nameFa : portDef.nameEn}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono">
                  {portDef.protocol}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {portDef.direction} • {portDef.securityImpact}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Detailed Purpose & Explanation */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'هدف و عملکرد این پورت در معماری اسپلانک:' : 'Port Architecture & Functionality:'}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa ? portDef.descriptionFa : portDef.descriptionEn}
            </p>
          </div>

          {/* Configuration File Directive & Firewall Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'فایل کانفیگ رسمی اسپلانک:' : 'Splunk Conf Directive:'}</span>
              </span>
              <code className="text-amber-300 font-mono block bg-slate-900 p-2 rounded border border-slate-800 text-[11px] select-all">
                {portDef.configFile}
              </code>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isFa ? 'سیاست دسترسی فایروال (Firewall ACL):' : 'Firewall & Access Policy:'}</span>
              </span>
              <div className="text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
                {portDef.defaultAllowedSources}
              </div>
            </div>
          </div>

          {/* Dynamic Port Tuner & Node Assignment */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'ویرایش و تغییر داینامیک شماره پورت در کلاستر' : 'Dynamic Port Number Tuning & Node Binding'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Node */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">{isFa ? 'نود مورد نظر جهت تغییر پورت:' : 'Target Splunk Node:'}</label>
                <select
                  value={selectedTargetNodeId}
                  onChange={(e) => setSelectedTargetNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                >
                  {allNodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.hostname} ({n.role}) — {n.ip}
                    </option>
                  ))}
                </select>
              </div>

              {/* Port Number Input */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">{isFa ? 'شماره پورت جدید (۱ تا ۶۵۵۳۵):' : 'New Port Number (1-65535):'}</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={currentPortInput}
                  onChange={(e) => setCurrentPortInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-cyan-600 rounded-lg p-2 text-cyan-300 font-mono font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Linux Systemd &amp; firewalld Command:</span>
              <span className="text-cyan-300">firewall-cmd --add-port={currentPortInput}/{portDef.protocol.toLowerCase().split('/')[0]} --permanent</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {isSaved ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                {isFa ? 'پورت با موفقیت تغییر یافت و ذخیره شد.' : 'Port successfully updated & saved.'}
              </span>
            ) : (
              <span>{isFa ? 'تغییرات به صورت آنی در نمودار و فایل‌های conf اعمال می‌شوند.' : 'Live synchronization with topology schematic.'}</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
            <button
              onClick={handleApplyPortChange}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isFa ? 'اعمال شماره پورت جدید' : 'Save New Port'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
