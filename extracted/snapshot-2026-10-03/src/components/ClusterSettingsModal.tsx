import React, { useState } from 'react';
import { ClusterSettings } from '../types';
import { Server, Settings, Save, X, Network, Database, Search, Cpu, RefreshCw } from 'lucide-react';

interface ClusterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClusterSettings;
  configs?: Record<string, string>;
  onSave: (newSettings: ClusterSettings) => void;
  lang: 'fa' | 'en';
}

export const ClusterSettingsModal: React.FC<ClusterSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  configs = {},
  onSave,
  lang,
}) => {
  const isFa = lang === 'fa';
  const [formData, setFormData] = useState<ClusterSettings>({ ...settings });
  const [detectStatus, setDetectStatus] = useState<string | null>(null);

  // Sync settings when the modal opens or settings changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof ClusterSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutoDetect = () => {
    const outputs = configs['outputs.conf'] || '';
    
    // Parse Indexers from outputs.conf (e.g., server = 10.20.30.50:9997, 10.20.30.51:9997)
    const idxMatch = outputs.match(/server\s*=\s*([0-9a-zA-Z.-]+)(?::\d+)?\s*,\s*([0-9a-zA-Z.-]+)(?::\d+)?/i) ||
                     outputs.match(/server\s*=\s*([0-9a-zA-Z.-]+)(?::\d+)?/i);
    
    if (idxMatch) {
      const parsedIdx1 = idxMatch[1];
      const parsedIdx2 = idxMatch[2] || idxMatch[1];
      
      setFormData(prev => ({
        ...prev,
        idx1Ip: parsedIdx1,
        idx1Host: parsedIdx1.includes('.') ? parsedIdx1 : `idx01.${parsedIdx1}`,
        idx2Ip: parsedIdx2,
        idx2Host: parsedIdx2.includes('.') ? parsedIdx2 : `idx02.${parsedIdx2}`
      }));
      setDetectStatus(isFa ? '✓ اطلاعات ایندکسرها با موفقیت از فایل outputs.conf استخراج و جایگزین شد!' : '✓ Successfully extracted indexer addresses from outputs.conf!');
    } else {
      setDetectStatus(isFa ? '❌ کانفیگ معتبری در outputs.conf برای استخراج پیدا نشد.' : '❌ No active server configurations found in outputs.conf.');
    }
    
    setTimeout(() => setDetectStatus(null), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-[#0e141c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 text-start"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-[#121822] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {isFa ? 'تنظیمات آدرس‌دهی و کانکشن کلاستر اسپلانک شما' : 'Splunk Cluster Address & Connection Setup'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isFa 
                  ? 'مشخصات سرورهای واقعی خود را وارد کنید تا تمامی گراف‌ها، دایاگرام‌ها و فایل‌های کانفیگ به صورت پویا با اطلاعات شبکه شما همگام شوند.'
                  : 'Enter actual server details to dynamically sync all diagrams, topologies, and config files with your network.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Live Auto-detect Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 text-start">
              <span className="text-xs font-bold text-amber-400 block">
                {isFa ? 'همگام‌سازی هوشمند شبکه کلاستر اسپلانک' : 'Smart Splunk Cluster Sync'}
              </span>
              <p className="text-[10px] text-slate-300">
                {isFa 
                  ? 'آیا مایلید آدرس‌های واقعی ایندکسرها را به صورت پویا از روی فایل‌های فعال (outputs.conf) استخراج و اعمال کنید؟'
                  : 'Would you like to auto-detect actual indexer IPs directly from active configuration files (outputs.conf)?'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoDetect}
              className="px-3.5 py-2 text-xs font-black rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow transition transform active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'اسکن و استخراج خودکار' : 'Scan & Auto-Extract'}</span>
            </button>
          </div>

          {detectStatus && (
            <div className="text-xs text-center font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl">
              {detectStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Heavy Forwarder */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Network className="w-4 h-4 text-amber-500" />
                <span>{isFa ? 'هوی فورواردر / گیت‌وی (HF)' : 'Heavy Forwarder (HF)'}</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'آدرس IP سرور:' : 'Server IP:'}</label>
                <input 
                  type="text"
                  value={formData.hfIp}
                  onChange={(e) => handleChange('hfIp', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  placeholder="10.20.30.45"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'نام هاست (FQDN):' : 'Hostname (FQDN):'}</label>
                <input 
                  type="text"
                  value={formData.hfHost}
                  onChange={(e) => handleChange('hfHost', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  placeholder="hf01.corp.net"
                  required
                />
              </div>
            </div>

            {/* Search Head */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'سرچ هد / کنسول وب (SH)' : 'Search Head (SH)'}</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'آدرس IP سرور:' : 'Server IP:'}</label>
                <input 
                  type="text"
                  value={formData.shIp}
                  onChange={(e) => handleChange('shIp', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="10.20.30.40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'نام هاست (FQDN):' : 'Hostname (FQDN):'}</label>
                <input 
                  type="text"
                  value={formData.shHost}
                  onChange={(e) => handleChange('shHost', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="sh01.corp.net"
                  required
                />
              </div>
            </div>

            {/* Indexer Peer 01 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'ایندکسر کلاستر نود ۱ (IDX-01)' : 'Indexer Peer 01 (IDX-01)'}</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'آدرس IP سرور:' : 'Server IP:'}</label>
                <input 
                  type="text"
                  value={formData.idx1Ip}
                  onChange={(e) => handleChange('idx1Ip', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  placeholder="10.20.30.50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'نام هاست (FQDN):' : 'Hostname (FQDN):'}</label>
                <input 
                  type="text"
                  value={formData.idx1Host}
                  onChange={(e) => handleChange('idx1Host', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  placeholder="idx01-site1.cluster.splunk"
                  required
                />
              </div>
            </div>

            {/* Indexer Peer 02 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <Database className="w-4 h-4 text-purple-400" />
                <span>{isFa ? 'ایندکسر کلاستر نود ۲ (IDX-02)' : 'Indexer Peer 02 (IDX-02)'}</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'آدرس IP سرور:' : 'Server IP:'}</label>
                <input 
                  type="text"
                  value={formData.idx2Ip}
                  onChange={(e) => handleChange('idx2Ip', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="10.20.30.51"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">{isFa ? 'نام هاست (FQDN):' : 'Hostname (FQDN):'}</label>
                <input 
                  type="text"
                  value={formData.idx2Host}
                  onChange={(e) => handleChange('idx2Host', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="idx02-site1.cluster.splunk"
                  required
                />
              </div>
            </div>

            {/* Deployment Server */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
                <Cpu className="w-4 h-4 text-pink-400" />
                <span>{isFa ? 'سرور دپلویمنت مرکزی (Deployment Server)' : 'Central Deployment Server (DS)'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400">{isFa ? 'آدرس IP سرور:' : 'Server IP:'}</label>
                  <input 
                    type="text"
                    value={formData.dsIp}
                    onChange={(e) => handleChange('dsIp', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none font-mono"
                    placeholder="10.20.30.60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400">{isFa ? 'نام هاست (FQDN):' : 'Hostname (FQDN):'}</label>
                  <input 
                    type="text"
                    value={formData.dsHost}
                    onChange={(e) => handleChange('dsHost', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none font-mono"
                    placeholder="ds01.corp.net"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 bg-slate-900 hover:bg-slate-800/80 transition"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isFa ? 'ذخیره و اعمال تنظیمات کلاستر' : 'Save & Sync Cluster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
