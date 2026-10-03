import React, { useState } from 'react';
import { 
  ServerAssetNode, 
  SplunkNodeRole, 
  SizingLOMInputs, 
  CalculatedSizingResult,
  SPLUNK_DEPLOYMENT_SEQUENCE,
  DeploymentStageStep
} from '../data/splunkDeployerData';
import { 
  Sliders, 
  Server, 
  Cpu, 
  HardDrive, 
  Database, 
  Layers, 
  ShieldAlert, 
  Key, 
  FolderOpen, 
  Terminal, 
  Check, 
  X, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  RefreshCw,
  FileCode,
  Zap,
  Globe,
  Radio
} from 'lucide-react';

interface SplunkNodeConfigModalProps {
  node: ServerAssetNode;
  allNodes: ServerAssetNode[];
  onClose: () => void;
  onUpdateNode: (id: string, field: keyof ServerAssetNode, value: any) => void;
  onSelectNode: (id: string) => void;
  sizingInputs: SizingLOMInputs;
  sizingResult: CalculatedSizingResult;
  lang: 'fa' | 'en';
}

export const SplunkNodeConfigModal: React.FC<SplunkNodeConfigModalProps> = ({
  node,
  allNodes,
  onClose,
  onUpdateNode,
  onSelectNode,
  sizingInputs,
  sizingResult,
  lang
}) => {
  const isFa = lang === 'fa';
  
  // Local state for editable parameters
  const [hostname, setHostname] = useState<string>(node.hostname);
  const [ip, setIp] = useState<string>(node.ip);
  const [lomIp, setLomIp] = useState<string>(node.lomIp || '');
  const [cpuCores, setCpuCores] = useState<number>(node.cpuCores);
  const [ramGB, setRamGB] = useState<number>(node.ramGB);
  const [storageNVMeGB, setStorageNVMeGB] = useState<number>(node.storageNVMeGB);
  const [storageColdTB, setStorageColdTB] = useState<number>(node.storageColdTB);
  const [site, setSite] = useState<string>(node.site);

  // Custom configs state
  const [customConfigs, setCustomConfigs] = useState(node.customConfigs || {});
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Check Deployment Sequence & Prerequisites
  const currentStageInfo = SPLUNK_DEPLOYMENT_SEQUENCE.find(s => s.role === node.role);
  const missingPrerequisites: DeploymentStageStep[] = [];

  if (currentStageInfo && currentStageInfo.dependencies.length > 0) {
    for (const depRole of currentStageInfo.dependencies) {
      const isPresentAndConfigured = allNodes.some(n => n.role === depRole && (n.isConfigured || n.status === 'splunk_running'));
      if (!isPresentAndConfigured) {
        const depInfo = SPLUNK_DEPLOYMENT_SEQUENCE.find(s => s.role === depRole);
        if (depInfo) missingPrerequisites.push(depInfo);
      }
    }
  }

  const handleSave = () => {
    onUpdateNode(node.id, 'hostname', hostname);
    onUpdateNode(node.id, 'ip', ip);
    onUpdateNode(node.id, 'lomIp', lomIp);
    onUpdateNode(node.id, 'cpuCores', cpuCores);
    onUpdateNode(node.id, 'ramGB', ramGB);
    onUpdateNode(node.id, 'storageNVMeGB', storageNVMeGB);
    onUpdateNode(node.id, 'storageColdTB', storageColdTB);
    onUpdateNode(node.id, 'site', site);
    onUpdateNode(node.id, 'customConfigs', customConfigs);
    onUpdateNode(node.id, 'isConfigured', true);
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const getRoleTitle = (role: SplunkNodeRole) => {
    switch (role) {
      case 'license_master': return isFa ? 'لایسنس مستر (License Master / LM)' : 'License Master (LM)';
      case 'deployment_server': return isFa ? 'دیپلویمنت سرور (Deployment Server / DS)' : 'Deployment Server (DS)';
      case 'deployer': return isFa ? 'دیپلویر کلاستر سرچ‌هد (SHC Deployer)' : 'Search Head Cluster Deployer';
      case 'cluster_manager': return isFa ? 'کلاستر منیجر / مستر (Cluster Manager / CM)' : 'Cluster Manager / Master (CM)';
      case 'indexer_peer': return isFa ? 'نود ایندکسر (Indexer Peer / IDXC)' : 'Indexer Peer (IDXC)';
      case 'search_head': return isFa ? 'سرچ‌هد (Search Head / SHC)' : 'Search Head (SH / SHC)';
      case 'search_load_balancer': return isFa ? 'لود بالانسر سرچ‌هد (Search Load Balancer / VIP)' : 'Search Load Balancer (VIP)';
      case 'heavy_forwarder': return isFa ? 'هوی فورواردر و درگاه لاگ (Heavy Forwarder / Ingest)' : 'Heavy Forwarder (Ingest Gateway)';
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-4xl bg-[#090e1a] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/60 font-mono">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{getRoleTitle(node.role)}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono">
                  {node.hostname}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                IP: <span className="text-cyan-300 font-bold">{node.ip}</span> • LOM: <span className="text-amber-300">{node.lomIp || 'iDRAC/iLO'}</span> • Site: <span className="text-emerald-300">{node.site}</span>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">

          {/* SEQUENCE WARNING & ARCHITECT GUIDANCE BANNER */}
          {missingPrerequisites.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/50 border-2 border-amber-500/80 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>{isFa ? 'هشدار توالی استقرار استاندارد اسپلانک (Splunk SVA Sequence Warning):' : 'Splunk SVA Deployment Sequence Warning:'}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {isFa
                  ? `طبق معماری استاندارد اسپلانک، قبل از پیکربندی نود ${getRoleTitle(node.role)}، پیش‌نیازهای زیر باید ابتدا تنظیم و فعال شوند تا کلاستر دچار خطای اتصال، تداخل لایسنس یا عدم شناسایی کلید سکرت نشود:`
                  : `According to Splunk Validated Architectures, before configuring ${getRoleTitle(node.role)}, the following prerequisites must be active:`}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {missingPrerequisites.map(prereq => (
                  <button
                    key={prereq.role}
                    onClick={() => {
                      const targetNode = allNodes.find(n => n.role === prereq.role);
                      if (targetNode) {
                        onSelectNode(targetNode.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 border border-amber-500 text-amber-100 text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{isFa ? `پرش به تنظیم: ${prereq.titleFa}` : `Go to: ${prereq.titleEn}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BASIC HARDWARE & NETWORK ADDRESSING */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'مشخصات سخت‌افزاری و شبکه نود' : 'Hardware Specs & Network Bindings'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Hostname (FQDN):</label>
                <input
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">IP Address (Prod NIC):</label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-600 rounded-lg p-2 text-cyan-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">LOM / iDRAC / iLO IP:</label>
                <input
                  type="text"
                  value={lomIp}
                  onChange={(e) => setLomIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Datacenter Site:</label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="site1">Site 1 (Primary DC)</option>
                  <option value="site2">Site 2 (DR / Secondary DC)</option>
                  <option value="default">Default Single Site</option>
                </select>
              </div>

              {/* Hardware resources */}
              <div>
                <label className="text-slate-400 block mb-1">CPU Cores:</label>
                <input
                  type="number"
                  min="2"
                  max="128"
                  value={cpuCores}
                  onChange={(e) => setCpuCores(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">RAM (GB):</label>
                <input
                  type="number"
                  min="4"
                  max="1024"
                  value={ramGB}
                  onChange={(e) => setRamGB(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">NVMe Hot Storage (GB):</label>
                <input
                  type="number"
                  min="50"
                  max="20000"
                  value={storageNVMeGB}
                  onChange={(e) => setStorageNVMeGB(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cold Storage (TB):</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={storageColdTB}
                  onChange={(e) => setStorageColdTB(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sky-300 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* ROLE-SPECIFIC DEEP CONFIGURATION PANELS */}
          {/* =================================================================== */}

          {/* 1. LICENSE MASTER SPECIFIC CONFIG */}
          {node.role === 'license_master' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/50 space-y-4">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-xs sm:text-sm">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'تنظیمات تخصصی لایسنس مستر (License Master Config)' : 'License Master Specialized Settings'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'سقف لایسنس پول (GB/Day):' : 'License Pool Quota (GB/Day):'}</label>
                  <input
                    type="number"
                    value={sizingInputs.dailyVolumeGB}
                    readOnly
                    className="w-full bg-slate-950 border border-emerald-600 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">{isFa ? 'توزیع خودکار بین نودهای Indexer و Heavy Forwarder' : 'Distributed automatically to all slave peers'}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'سقف هشدارهای تخطی حجم (Soft Violations):' : 'Soft Violation Warning Threshold:'}</label>
                  <select
                    value={customConfigs.licenseMaster?.warningThreshold || 3}
                    onChange={(e) => setCustomConfigs({
                      ...customConfigs,
                      licenseMaster: {
                        ...customConfigs.licenseMaster,
                        warningThreshold: Number(e.target.value),
                        hardViolationDays: 5,
                        licensePoolMB: sizingInputs.dailyVolumeGB * 1024
                      }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value="3">3 Warnings (Standard Enterprise)</option>
                    <option value="5">5 Warnings (Grace Period Extended)</option>
                    <option value="1">1 Warning (Strict Compliance)</option>
                  </select>
                </div>
              </div>

              {/* Paste or Upload License File Simulation */}
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-400 text-xs font-mono">{isFa ? 'محتوای فایل لایسنس رسمی اسپلانک (.lic XML):' : 'Splunk Enterprise License Key (.lic XML):'}</label>
                <textarea
                  rows={3}
                  defaultValue={`<splunk_license version="1.0">\n  <type>enterprise_production</type>\n  <quota_daily_gb>${sizingInputs.dailyVolumeGB}</quota_daily_gb>\n  <signature>SPLK-2026-ENT-9A88F-VALID-SOC</signature>\n</splunk_license>`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-300/90 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>CLI Verification Command:</span>
                <span className="text-emerald-300">splunk list licenser-pools -auth admin:...</span>
              </div>
            </div>
          )}

          {/* 2. DEPLOYMENT SERVER SPECIFIC CONFIG */}
          {node.role === 'deployment_server' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/50 space-y-4">
              <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'تنظیمات دیپلویمنت سرور و Serverclass (Deployment Server Config)' : 'Deployment Server & ServerClass Settings'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'مسیر پوشه پکیج‌های برنامه‌ها (deployment-apps):' : 'Deployment Apps Directory:'}</label>
                  <input
                    type="text"
                    defaultValue="/opt/splunk/etc/deployment-apps"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'فاصله بررسی فورواردرها (Phone-Home Interval):' : 'Client Phone-Home Interval:'}</label>
                  <select
                    defaultValue="60"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value="30">30 Seconds (Fast Sync / Lab)</option>
                    <option value="60">60 Seconds (Standard Enterprise)</option>
                    <option value="300">300 Seconds (Large Fleet 5000+ Agents)</option>
                  </select>
                </div>
              </div>

              {/* Serverclasses List */}
              <div className="space-y-2 pt-2">
                <label className="text-slate-400 text-xs font-bold">{isFa ? 'کلاس‌های کلاینت‌های فعال (serverclass.conf):' : 'Active Server Classes:'}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-cyan-800 text-cyan-300">
                    <span className="font-bold block">all_universal_forwarders</span>
                    <span className="text-[10px] text-slate-400">App: Splunk_TA_nix / win</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-cyan-800 text-cyan-300">
                    <span className="font-bold block">linux_security_inputs</span>
                    <span className="text-[10px] text-slate-400">App: org_inputs_linux_audit</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-cyan-800 text-cyan-300">
                    <span className="font-bold block">windows_ad_inputs</span>
                    <span className="text-[10px] text-slate-400">App: org_inputs_winevent</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>Reload Command:</span>
                <span className="text-cyan-300">splunk reload deploy-server -auth admin:...</span>
              </div>
            </div>
          )}

          {/* 3. SHC DEPLOYER SPECIFIC CONFIG */}
          {node.role === 'deployer' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/50 space-y-4">
              <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs sm:text-sm">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>{isFa ? 'تنظیمات دیپلویر کلاستر سرچ‌هد (SHC Deployer Settings)' : 'Search Head Cluster Deployer Settings'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'مسیر پوشه برنامه‌های کلاستر (shcluster/apps):' : 'SHC Apps Directory:'}</label>
                  <input
                    type="text"
                    defaultValue="/opt/splunk/etc/shcluster/apps"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-purple-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">{isFa ? 'کلمه عبور سکرت کلاستر (pass4SymmKey):' : 'SHC Passphrase Secret:'}</label>
                  <input
                    type="password"
                    defaultValue="SplunkSecretClusterPass@2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>Bundle Push Action:</span>
                <span className="text-purple-300">splunk apply shcluster-bundle -target https://192.168.10.31:8089 -auth admin:...</span>
              </div>
            </div>
          )}

          {/* 4. CLUSTER MANAGER / MASTER SPECIFIC CONFIG */}
          {node.role === 'cluster_manager' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/50 space-y-4">
              <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-xs sm:text-sm">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'تنظیمات کلاستر مستر ایندکسرها (Cluster Manager Settings)' : 'Indexer Cluster Manager Settings'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Replication Factor (RF):</label>
                  <input
                    type="number"
                    value={sizingInputs.replicationFactor || 3}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Search Factor (SF):</label>
                  <input
                    type="number"
                    value={sizingInputs.searchFactor || 2}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Site Replication Rule:</label>
                  <input
                    type="text"
                    defaultValue="origin:2, total:3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>Cluster Health Check:</span>
                <span className="text-cyan-300">splunk show cluster-status --verbose -auth admin:...</span>
              </div>
            </div>
          )}

          {/* 5. INDEXER PEER SPECIFIC CONFIG */}
          {node.role === 'indexer_peer' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 space-y-4">
              <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs sm:text-sm">
                <Database className="w-4 h-4 text-amber-400" />
                <span>{isFa ? 'تنظیمات دیسک و باکت‌های ایندکسر (Indexer Storage & Buckets)' : 'Indexer Storage Paths & Bucket Quotas'}</span>
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-amber-400 font-bold">Hot/Warm Path:</span>
                  <span className="text-slate-300">/opt/splunk/var/lib/splunk/defaultdb/db (NVMe SSD)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-sky-400 font-bold">Cold Path:</span>
                  <span className="text-slate-300">/opt/splunk/var/lib/splunk/defaultdb/colddb (SAS RAID-6)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-purple-400 font-bold">Frozen Archive:</span>
                  <span className="text-slate-300">{sizingInputs.smartStoreEnabled ? 's3://splunk-smartstore-soc-archive' : '/opt/splunk/var/lib/splunk/defaultdb/frozendb'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>Mount Options (XFS):</span>
                <span className="text-amber-300">rw,noatime,nodiratime,logbufs=8,logbsize=256k</span>
              </div>
            </div>
          )}

          {/* 6. SEARCH LOAD BALANCER SPECIFIC CONFIG */}
          {node.role === 'search_load_balancer' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/50 space-y-4">
              <h4 className="font-bold text-sky-300 flex items-center gap-2 text-xs sm:text-sm">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>{isFa ? 'تنظیمات لودبالانسر سرچ‌هد (Search Load Balancer VIP)' : 'Search Head VIP Load Balancer Settings'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">VIP IP:</label>
                  <input
                    type="text"
                    defaultValue="192.168.10.30"
                    className="w-full bg-slate-950 border border-cyan-600 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Load Balancing Algorithm:</label>
                  <select
                    defaultValue="ip_hash"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value="ip_hash">ip_hash (Sticky Session for Splunk Web)</option>
                    <option value="least_conn">least_conn (Least Connections)</option>
                    <option value="round_robin">round_robin (Round Robin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">SSL Certificate Offloading:</label>
                  <select
                    defaultValue="enabled"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono text-xs"
                  >
                    <option value="enabled">Enabled (HTTPS 443 -&gt; 8000)</option>
                    <option value="passthrough">SSL Passthrough (8000 -&gt; 8000)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {isSaved ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                {isFa ? 'تنظیمات نود با موفقیت ذخیره شد.' : 'Node configuration saved successfully.'}
              </span>
            ) : (
              <span>{isFa ? 'تغییرات بلافاصله در کلاستر و نمودار شماتیک همگام می‌شوند.' : 'Synchronizes live with schematic and cluster manifests.'}</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isFa ? 'ذخیره تنظیمات نود' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
