import React, { useState } from 'react';
import { 
  Server, 
  Key, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  Activity, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Clock, 
  Zap, 
  HardDrive, 
  Database, 
  Share2, 
  Send, 
  Copy, 
  Check, 
  Award, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Info,
  Terminal,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { 
  SplunkLicenseKeyItem, 
  SplunkLicensePool, 
  SplunkLicenseSlave, 
  SplunkClusterMasterState, 
  SplunkDeploymentServerState, 
  SplunkDeployerState, 
  SplunkMonitoringConsoleState,
  SplunkCertificateItem
} from '../types';
import { 
  INITIAL_LICENSE_KEYS, 
  INITIAL_LICENSE_POOLS, 
  INITIAL_LICENSE_SLAVES, 
  INITIAL_CLUSTER_MASTER_STATE, 
  INITIAL_DEPLOYMENT_SERVER_STATE, 
  INITIAL_DEPLOYER_STATE, 
  INITIAL_MONITORING_CONSOLE_STATE 
} from '../data/managementNodesData';
import { INITIAL_SPLUNK_CERTIFICATES, computeCertificatePredictions } from '../data/certificateData';

interface SplunkManagementNodesHubProps {
  lang?: 'fa' | 'en';
}

export const SplunkManagementNodesHub: React.FC<SplunkManagementNodesHubProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';

  // Sub-navigation within Management Nodes Hub
  const [activeSubTab, setActiveSubTab] = useState<
    'license_master' | 'security_licenses' | 'cluster_master' | 'deployment_server' | 'shc_deployer' | 'monitoring_console'
  >('license_master');

  // --- LICENSE MASTER STATE ---
  const [licenseKeys, setLicenseKeys] = useState<SplunkLicenseKeyItem[]>(INITIAL_LICENSE_KEYS);
  const [licensePools, setLicensePools] = useState<SplunkLicensePool[]>(INITIAL_LICENSE_POOLS);
  const [licenseSlaves, setLicenseSlaves] = useState<SplunkLicenseSlave[]>(INITIAL_LICENSE_SLAVES);
  const [warningCount, setWarningCount] = useState<number>(2); // 2 out of 5 warnings
  const [isAddingKeyModal, setIsAddingKeyModal] = useState<boolean>(false);
  const [newKeyString, setNewKeyString] = useState<string>('');
  const [newKeyLabel, setNewKeyLabel] = useState<string>('');
  const [newKeyQuota, setNewKeyQuota] = useState<number>(100);
  const [newKeyType, setNewKeyType] = useState<SplunkLicenseKeyItem['type']>('ENTERPRISE');

  // New Pool Modal State
  const [isAddingPoolModal, setIsAddingPoolModal] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>('');
  const [newPoolQuota, setNewPoolQuota] = useState<number>(100);
  const [newPoolDesc, setNewPoolDesc] = useState<string>('');

  // --- CLUSTER MASTER STATE ---
  const [cmState, setCmState] = useState<SplunkClusterMasterState>(INITIAL_CLUSTER_MASTER_STATE);
  const [isRollingRestarting, setIsRollingRestarting] = useState<boolean>(false);
  const [isApplyingClusterBundle, setIsApplyingClusterBundle] = useState<boolean>(false);

  // --- DEPLOYMENT SERVER STATE ---
  const [dsState, setDsState] = useState<SplunkDeploymentServerState>(INITIAL_DEPLOYMENT_SERVER_STATE);
  const [isReloadingDS, setIsReloadingDS] = useState<boolean>(false);

  // --- SHC DEPLOYER STATE ---
  const [deployerState, setDeployerState] = useState<SplunkDeployerState>(INITIAL_DEPLOYER_STATE);
  const [isPushingSHCBundle, setIsPushingSHCBundle] = useState<boolean>(false);

  // --- SECURITY LICENSES & CERTIFICATES STATE ---
  const [secCertificates, setSecCertificates] = useState<SplunkCertificateItem[]>(INITIAL_SPLUNK_CERTIFICATES);
  const [secWarningThreshold, setSecWarningThreshold] = useState<number>(30);
  const [secCriticalThreshold, setSecCriticalThreshold] = useState<number>(10);
  const [selectedSecCert, setSelectedSecCert] = useState<SplunkCertificateItem | null>(INITIAL_SPLUNK_CERTIFICATES[0]);
  const [secFilterRole, setSecFilterRole] = useState<string>('all');

  // Global Copied / Toast State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // License Calculations
  const totalDailyQuotaGB = licenseKeys.reduce((acc, k) => acc + k.dailyQuotaGB, 0);
  const totalConsumedTodayGB = licensePools.reduce((acc, p) => acc + p.consumedTodayGB, 0);
  const quotaUsedPct = totalDailyQuotaGB > 0 ? ((totalConsumedTodayGB / totalDailyQuotaGB) * 100).toFixed(1) : '0';
  const remainingQuotaGB = Math.max(0, totalDailyQuotaGB - totalConsumedTodayGB).toFixed(1);

  // Security Predictions
  const secPredictions = computeCertificatePredictions(secCertificates, secWarningThreshold, secCriticalThreshold);

  // Handlers for License Master
  const handleAddLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyString.trim()) return;

    const newKey: SplunkLicenseKeyItem = {
      id: `lic-${Date.now()}`,
      licenseKey: newKeyString.trim().toUpperCase(),
      label: newKeyLabel.trim() || `Enterprise License (${newKeyQuota} GB/day)`,
      type: newKeyType,
      dailyQuotaGB: Number(newKeyQuota),
      expirationDate: '2027-12-31',
      status: 'ACTIVE',
      features: ['Clustering', 'Distributed Search', 'REST API Automation', 'Enterprise Security (ES)'],
      addedAt: new Date().toISOString().split('T')[0]
    };

    setLicenseKeys(prev => [...prev, newKey]);
    setIsAddingKeyModal(false);
    setNewKeyString('');
    setNewKeyLabel('');
    triggerFeedback(isFa ? `کلید لایسنس با موفقیت به استک لایسنس سرور افزوده شد (+${newKeyQuota} GB/day).` : `License key added (+${newKeyQuota} GB/day).`);
  };

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolName.trim()) return;

    const newP: SplunkLicensePool = {
      id: `pool-${Date.now()}`,
      name: newPoolName.trim().replace(/\s+/g, '_'),
      allocatedQuotaGB: Number(newPoolQuota),
      consumedTodayGB: 0,
      stackId: licenseKeys[0]?.id || 'lic-ent-500gb',
      description: newPoolDesc.trim() || 'استخر تخصیص یافته جدید',
      assignedSlaves: []
    };

    setLicensePools(prev => [...prev, newP]);
    setIsAddingPoolModal(false);
    setNewPoolName('');
    setNewPoolQuota(100);
    setNewPoolDesc('');
    triggerFeedback(isFa ? `استخر لایسنس جدید (${newP.name}) با ظرفیت ${newP.allocatedQuotaGB} GB ایجاد شد.` : `New license pool created (${newP.name}).`);
  };

  const handleResetViolations = () => {
    setWarningCount(0);
    triggerFeedback(isFa ? 'شمارنده اخطارهای لایسنس (License Violations) با موفقیت بازنشانی (Reset) شد و محدودیت جستجوی سرچ‌هد رفع گردید.' : 'License violation counter reset to 0.');
  };

  const handleToggleMaintenanceMode = () => {
    setCmState(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
    triggerFeedback(
      cmState.maintenanceMode
        ? (isFa ? 'حالت Maintenance Mode در کلاستر مستر غیرفعال شد. Rebalancing خودکار آغاز گردید.' : 'Maintenance Mode disabled.')
        : (isFa ? 'حالت Maintenance Mode در کلاستر مستر فعال شد. نودها بدون جابه‌جایی باکت‌ها قابل سرویس هستند.' : 'Maintenance Mode enabled.')
    );
  };

  const handleRollingRestart = () => {
    setIsRollingRestarting(true);
    setTimeout(() => {
      setIsRollingRestarting(false);
      triggerFeedback(isFa ? 'دستور Rolling Restart در تمام Peer Indexerها با رعایت Search Factor با موفقیت اجرا شد.' : 'Rolling restart completed successfully.');
    }, 2000);
  };

  const handleApplyClusterBundle = () => {
    setIsApplyingClusterBundle(true);
    setTimeout(() => {
      setIsApplyingClusterBundle(false);
      triggerFeedback(isFa ? 'باندل پیکربندی کلاستر (Cluster Bundle) به تمام ایندکسرها اعمال و اعتبارسنجی شد.' : 'Cluster configuration bundle applied.');
    }, 1800);
  };

  const handleReloadDS = () => {
    setIsReloadingDS(true);
    setTimeout(() => {
      setIsReloadingDS(false);
      triggerFeedback(isFa ? 'دپلویمنت سرور با موفقیت ریلود شد (`splunk reload deploy-server`).' : 'Deployment Server successfully reloaded.');
    }, 1500);
  };

  const handlePushSHCBundle = () => {
    setIsPushingSHCBundle(true);
    setTimeout(() => {
      setIsPushingSHCBundle(false);
      setDeployerState(prev => ({ ...prev, lastBundlePush: new Date().toLocaleString() }));
      triggerFeedback(isFa ? 'باندل اپلیکیشن‌های SHC با موفقیت به کاپیتان کلاستر ارسال شد (`splunk apply shcluster-bundle`).' : 'SHC App Bundle pushed successfully.');
    }, 2000);
  };

  const handleSimulateRenewSecLicense = (certId: string) => {
    setSecCertificates(prev => prev.map(c => {
      if (c.id === certId) {
        return {
          ...c,
          daysRemaining: 365,
          totalValidityDays: 365,
          status: 'HEALTHY' as const,
          validTo: '2027-09-30'
        };
      }
      return c;
    }));
    triggerFeedback(isFa ? 'گواهی لایسنس و دسترسی امنیتی با موفقیت برای ۱ سال تمدید شد.' : 'Security access license renewed for 365 days.');
  };

  return (
    <div className="space-y-6">
      {/* Toast / Global Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Main Management Hub Header & Stats Banner - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Ambient radial glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border border-white/20 shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-white sirene-text-gradient">
                  {isFa ? 'مرکز مدیریت جامع نودهای مدیریتی و لایسنس‌های کلاستر اسپلانک' : 'Splunk Management Nodes & Enterprise Licensing Master Hub'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFa
                    ? 'پایگاه یکپارچه مدیریت لایسنس سرور (License Master)، استخرها (Pools)، گواهی‌های دسترسی، کلاستر مستر (CM)، دپلویمنت سرور (DS)، دپلویِر (SHC) و کنسول مانیتورینگ.'
                    : 'Unified control suite for License Master, Stacks, Access Licenses, Cluster Manager, Deployment Server, SHC Deployer, and Monitoring Console.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge - Sirene Glass */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono flex items-center gap-2 backdrop-blur-xl">
              <span className="text-slate-400">{isFa ? 'سهمیه لایسنس:' : 'Ingestion Quota:'}</span>
              <span className="text-violet-300 font-bold">{totalConsumedTodayGB} / {totalDailyQuotaGB} GB</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono flex items-center gap-2 backdrop-blur-xl">
              <span className="text-slate-400">{isFa ? 'وضعیت کلاستر:' : 'CM Status:'}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping"></span>
                {cmState.clusterStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs inside Management Hub - Sirene Segmented Control */}
        <div className="flex items-center gap-2 border-t border-white/[0.08] pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('license_master')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'license_master'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isFa ? 'لایسنس سرور و استخرها (License Master)' : 'License Master & Pools'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeSubTab === 'license_master' ? 'bg-black/40 text-violet-200' : 'bg-white/[0.05] text-slate-400'
            }`}>
              {totalDailyQuotaGB} GB
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('security_licenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'security_licenses'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isFa ? 'لایسنس‌ها و گواهی‌های امنیتی سیستم' : 'Security & Access Licenses'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeSubTab === 'security_licenses' ? 'bg-black/40 text-cyan-300' : 'bg-white/[0.05] text-slate-400'
            }`}>
              {secCertificates.length} Active
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('cluster_master')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'cluster_master'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isFa ? 'کلاستر مستر ایندکسرها (Cluster Manager)' : 'Indexer Cluster Manager'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              RF={cmState.replicationFactor} SF={cmState.searchFactor}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('deployment_server')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'deployment_server'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{isFa ? 'دپلویمنت سرور و فورواردرها (Deployment Server)' : 'Deployment Server (DS)'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {dsState.connectedClientsCount} Clients
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('shc_deployer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'shc_deployer'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isFa ? 'دپلویِر کلاستر سرچ‌هد (SHC Deployer)' : 'SHC Deployer'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('monitoring_console')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'monitoring_console'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isFa ? 'کنسول مانیتورینگ (Monitoring Console)' : 'Monitoring Console (DMC)'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: LICENSE MASTER & POOLS & INGESTION QUOTAS
          ========================================================================= */}
      {activeSubTab === 'license_master' && (
        <div className="space-y-6">
          {/* Top Quota Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Daily Ingestion Meter */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 md:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'مصرف سهمیه روزانه لایسنس اسپلانک (Daily Ingestion Quota):' : 'Today Ingestion Consumption:'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{quotaUsedPct}% Used</span>
              </div>

              <div>
                <div className="flex items-baseline justify-between font-mono mb-1">
                  <span className="text-2xl font-black text-white">{totalConsumedTodayGB} <span className="text-xs font-normal text-slate-400">GB</span></span>
                  <span className="text-xs text-slate-400 font-mono">Limit: <strong className="text-amber-300">{totalDailyQuotaGB} GB / Day</strong></span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      Number(quotaUsedPct) > 90 ? 'bg-rose-500' : Number(quotaUsedPct) > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, Number(quotaUsedPct)))}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                <span>{isFa ? 'باقیمانده تا نیمه‌شب:' : 'Remaining:'} <strong className="text-emerald-400">{remainingQuotaGB} GB</strong></span>
                <span>{isFa ? 'پیش‌بینی تا ۲۳:۵۹:' : 'Forecast:'} <strong className="text-cyan-400">~420 GB (زیر سقف مجاز)</strong></span>
              </div>
            </div>

            {/* License Violations Monitor & Reset */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>{isFa ? 'اخطارهای مصرف مازاد (Violations):' : 'License Violations:'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Rolling 30 Days
                </span>
              </div>

              <div>
                <div className="text-2xl font-mono font-black text-rose-400">
                  {warningCount} <span className="text-xs text-slate-500 font-normal">/ 5 Warnings</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {isFa
                    ? 'در صورت رسیدن به ۵ اخطار، قابلیت سرچ در Search Head مسدود می‌شود (ایندکس لاگ متوقف نمی‌شود).'
                    : '5 warnings lock search head query capability while indexing continues.'}
                </p>
              </div>

              <button
                onClick={handleResetViolations}
                disabled={warningCount === 0}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? 'بازنشانی اخطارها (Reset Violations)' : 'Reset Warnings Counter'}</span>
              </button>
            </div>

            {/* License Stacks & Add Key Quick Button */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'استک‌های فعال لایسنس:' : 'Active License Stacks:'}</span>
                </span>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Enterprise Core:</span>
                    <strong className="text-amber-400">500 GB</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Forwarder Stack:</span>
                    <strong className="text-emerald-400">Unlimited</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Dev/Test Stack:</span>
                    <strong className="text-cyan-400">50 GB</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingKeyModal(true)}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFa ? 'افزودن کلید لایسنس جدید' : 'Add License Key'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* License Pools Configuration Matrix */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'مدیریت استخرهای لایسنس (Splunk License Pools Allocation):' : 'License Pools Configuration:'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFa
                    ? 'تخصیص سهمیه روزانه ورودی به ایندکسرهای سازمانی جهت جلوگیری از تجاوز یک بخش از کل ظرفیت.'
                    : 'Segregate total daily ingestion capacity across dedicated Indexer groups.'}
                </p>
              </div>

              <button
                onClick={() => setIsAddingPoolModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFa ? 'ایجاد استخر جدید' : 'New License Pool'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {licensePools.map((pool) => {
                const poolPct = ((pool.consumedTodayGB / pool.allocatedQuotaGB) * 100).toFixed(1);

                return (
                  <div key={pool.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-xs font-mono">{pool.name}</h4>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{pool.description}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                        {pool.allocatedQuotaGB} GB
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">{isFa ? 'مصرف امروز:' : 'Consumed:'} {pool.consumedTodayGB} GB</span>
                        <span className="font-bold text-white">{poolPct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${Math.min(100, Math.max(5, Number(poolPct)))}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 space-y-1">
                      <span className="block font-semibold text-slate-500">{isFa ? 'نودهای عضو این استخر:' : 'Assigned Indexer Peers:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {pool.assignedSlaves.map(slave => (
                          <span key={slave} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-[9px] border border-slate-800 truncate max-w-[140px]">
                            {slave.split('.')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Slaves & Usage Real-Time Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {isFa ? 'پایش لحظه‌ای نودهای متصل به لایسنس سرور (Connected License Slaves):' : 'Connected License Slaves & Usage:'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{licenseSlaves.length} Slaves Online</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Hostname & IP</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Assigned Pool</th>
                    <th className="py-2.5 px-3">Today Usage</th>
                    <th className="py-2.5 px-3">Pool Share</th>
                    <th className="py-2.5 px-3">Heartbeat</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {licenseSlaves.map((slave) => (
                    <tr key={slave.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{slave.hostname}</span>
                        <span className="text-[10px] text-slate-500">{slave.ip}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{slave.role}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {slave.assignedPool}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{slave.usageTodayGB} GB</td>
                      <td className="py-2.5 px-3 text-cyan-400">{slave.percentageOfPool}%</td>
                      <td className="py-2.5 px-3 text-slate-400">{slave.lastContact}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{slave.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleCopy(`/opt/splunk/bin/splunk edit licenser-localslave -master_uri https://cm-cluster-master-01.corp.internal:8089`, slave.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold border border-slate-700 inline-flex items-center gap-1"
                          title="Copy CLI command to bind this node to License Master"
                        >
                          {copiedId === slave.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === slave.id ? 'Copied' : 'Bind CLI'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Installed License Keys Inventory */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {isFa ? 'فهرست کلیدهای لایسنس نصب شده در سیستم (Installed License Keys):' : 'Installed License Keys:'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{licenseKeys.length} Keys Installed</span>
            </div>

            <div className="space-y-3">
              {licenseKeys.map((key) => (
                <div key={key.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                        key.type === 'ENTERPRISE' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {key.type}
                      </span>
                      <span className="font-bold text-white">{key.label}</span>
                    </div>

                    <div className="font-mono text-slate-400 text-[11px] select-all">
                      Key: <strong className="text-slate-200">{key.licenseKey}</strong>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {key.features.map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 text-[10px] block">{isFa ? 'سهمیه روزانه:' : 'Daily Quota:'}</span>
                      <span className="text-amber-400 font-bold">{key.dailyQuotaGB > 0 ? `${key.dailyQuotaGB} GB` : 'Unlimited'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">{isFa ? 'تاریخ انقضا:' : 'Expires:'}</span>
                      <span className="text-slate-300">{key.expirationDate}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {key.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: SECURITY & ACCESS LICENSES (FORMER CERTIFICATE ANALYZER)
          ========================================================================= */}
      {activeSubTab === 'security_licenses' && (
        <div className="space-y-6">
          {/* Predictive Depletion Radar Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0d1624] to-[#080e18] border border-cyan-500/30 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-black text-white">
                    {isFa ? 'پایش جامع لایسنس‌های امنیتی و گواهی‌های دسترسی SSL/TLS نودها' : 'Splunk Node Security & Access Licenses Analyzer'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'پایش مداوم مجوزهای دسترسی امنیتی، دست‌تکانی mTLS پورت‌های ۹۹۹۷، ۸۰۸۹، ۸۰۰۰ و ۵۱۴ با پیش‌بینی هوشمند زمان انقضا و ریسک قطعی پایپلاین.'
                    : 'Telemetry on mutual TLS security access tokens, cipher validity, and predictive expiration risk.'}
                </p>
              </div>

              {/* Threshold Controls */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-xs font-mono">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">{isFa ? 'آستانه هشدار انقضا:' : 'Warning Window:'}</span>
                <select
                  value={secWarningThreshold}
                  onChange={(e) => setSecWarningThreshold(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-bold outline-none"
                >
                  <option value={60}>60 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={15}>15 Days</option>
                </select>
              </div>
            </div>

            {/* Visual Risk Metric Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] block">{isFa ? 'نخستین موعد انقضا در کلاستر:' : 'Earliest Expiration Date:'}</span>
                <div className="text-2xl font-mono font-black text-rose-400">
                  {secPredictions.predictedDaysUntilFirstOutage} {isFa ? 'روز دیگر' : 'Days'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {isFa ? 'تاریخ وقوع:' : 'Target Date:'} <strong className="text-white">{secPredictions.firstOutageDateStr}</strong>
                </div>
                <div className="text-[10px] text-amber-300/90 truncate font-mono mt-1">
                  Node: {secPredictions.nextExpiringCert?.hostname}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-500 text-[11px] block">{isFa ? 'توزیع سلامت لایسنس‌های امنیتی:' : 'Security License Health Breakdown:'}</span>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-emerald-400">{isFa ? 'معتبر و پایدار:' : 'Healthy:'}</span>
                  <span className="font-bold text-white">{secPredictions.healthyCerts}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-amber-400">{isFa ? 'هشدار نزدیک به انقضا:' : 'Warning:'}</span>
                  <span className="font-bold text-amber-300">{secPredictions.warningSoonCerts}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-rose-400">{isFa ? 'انقضای بحرانی فوری:' : 'Critical Expiring:'}</span>
                  <span className="font-bold text-rose-300">{secPredictions.criticalExpiringCerts}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isFa ? 'توصیه تحلیلی سیستم:' : 'System Recommendation:'}</span>
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    {isFa ? secPredictions.recommendedActionSummaryFa : secPredictions.recommendedActionSummaryEn}
                  </p>
                </div>

                {secPredictions.criticalExpiringCerts > 0 && (
                  <button
                    onClick={() => handleSimulateRenewSecLicense(secPredictions.nextExpiringCert.id)}
                    className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isFa ? 'تمدید فوری لایسنس بحرانی' : 'Auto-Renew Expiring License'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid: Security Licenses Inventory & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'فهرست لایسنس‌ها و گواهی‌های امنیتی نودها:' : 'Active Node Security Licenses:'}</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">{secCertificates.length} Total</span>
              </div>

              {secCertificates.map((cert) => {
                const isSelected = selectedSecCert?.id === cert.id;
                const isCrit = cert.daysRemaining <= secCriticalThreshold;
                const isWarn = cert.daysRemaining <= secWarningThreshold;

                return (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedSecCert(cert)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs font-mono">{cert.hostname}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {cert.certType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">{cert.friendlyName}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                          isCrit ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse' : isWarn ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        }`}>
                          {cert.daysRemaining} {isFa ? 'روز مانده' : 'days left'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateRenewSecLicense(cert.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                          title="Renew License"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inspector Column */}
            <div className="space-y-4">
              {selectedSecCert && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 sticky top-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white">{isFa ? 'مشخصات فنی لایسنس امنیتی' : 'Security License Specs'}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">{selectedSecCert.keyType}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">{isFa ? 'صادرکننده (Issuer):' : 'Issuer:'}</span>
                      <div className="font-mono text-slate-300 text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800 mt-1 break-all">
                        {selectedSecCert.issuer}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">{isFa ? 'مسیر فایل مجوز در سرور:' : 'Server Path:'}</span>
                      <div className="font-mono text-cyan-300 text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800 mt-1 break-all">
                        {selectedSecCert.certPath}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-[11px] space-y-1">
                      <div className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isFa ? 'پیامد امنیتی انقضا:' : 'Outage Impact:'}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {isFa ? selectedSecCert.failureImpactFa : selectedSecCert.failureImpactEn}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{isFa ? 'دستور اعتبارسنجی CLI:' : 'Validation Command:'}</span>
                        <button
                          onClick={() => handleCopy(selectedSecCert.remediationCommand, selectedSecCert.id)}
                          className="text-cyan-400 text-[10px] flex items-center gap-1"
                        >
                          {copiedId === selectedSecCert.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === selectedSecCert.id ? 'کپی شد' : 'کپی'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap dir-ltr">
                        {selectedSecCert.remediationCommand}
                      </pre>
                    </div>

                    <button
                      onClick={() => handleSimulateRenewSecLicense(selectedSecCert.id)}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{isFa ? 'تمدید خودکار اعتبار (+1 Year)' : 'Auto-Renew License'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: CLUSTER MASTER (INDEXER CLUSTERING)
          ========================================================================= */}
      {activeSubTab === 'cluster_master' && (
        <div className="space-y-6">
          {/* Cluster Status Top Banner */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    {isFa ? 'کلاستر مستر اسپلانک (Indexer Cluster Manager State & Bucket Health)' : 'Splunk Indexer Cluster Manager'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {isFa
                    ? 'نظارت بر Replication Factor، Search Factor، توزیع باکت‌ها در سایت‌های DC1 و DC2 و مدیریت وضعیت Maintenance Mode.'
                    : 'Manage bucket replication factor (RF=3), search factor (SF=2), multisite sync and rolling operations.'}
                </p>
              </div>

              {/* CM Actions Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleMaintenanceMode}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    cmState.maintenanceMode
                      ? 'bg-amber-500 text-slate-950 border border-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{cmState.maintenanceMode ? (isFa ? 'Maintenance Mode: روشن' : 'Maint Mode: ON') : (isFa ? 'Maintenance Mode: خاموش' : 'Maint Mode: OFF')}</span>
                </button>

                <button
                  onClick={handleRollingRestart}
                  disabled={isRollingRestarting}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isRollingRestarting ? 'animate-spin' : ''}`} />
                  <span>{isRollingRestarting ? (isFa ? 'در حال اجرای Rolling Restart...' : 'Restarting...') : (isFa ? 'Rolling Restart نودها' : 'Rolling Restart')}</span>
                </button>

                <button
                  onClick={handleApplyClusterBundle}
                  disabled={isApplyingClusterBundle}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{isApplyingClusterBundle ? (isFa ? 'در حال اعمال باندل...' : 'Applying...') : (isFa ? 'اعمال Cluster Bundle' : 'Apply Bundle')}</span>
                </button>
              </div>
            </div>

            {/* Health Factor Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{isFa ? 'Replication Factor (RF):' : 'Replication Factor:'}</span>
                <div className="text-xl font-mono font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{cmState.replicationFactor} (RF Met)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{isFa ? 'Search Factor (SF):' : 'Search Factor:'}</span>
                <div className="text-xl font-mono font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{cmState.searchFactor} (SF Met)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{isFa ? 'باکت‌های سرچ‌پذیر (Searchable):' : 'Searchable Buckets:'}</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                  {cmState.bucketsSearchable.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{isFa ? 'صف رفع نقص باکت (Fixup Queue):' : 'Fixup Buckets Count:'}</span>
                <div className="text-xl font-mono font-black text-slate-300 mt-1">
                  {cmState.bucketsFixupCount} Pending
                </div>
              </div>
            </div>
          </div>

          {/* Peer Indexers Fleet Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'نودهای ایندکسر متصل به کلاستر مستر (Peer Indexers Fleet):' : 'Clustered Peer Indexers:'}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300 font-mono">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Hostname & IP</th>
                    <th className="py-2.5 px-3">Site ID</th>
                    <th className="py-2.5 px-3">Bucket Count</th>
                    <th className="py-2.5 px-3">Disk Usage</th>
                    <th className="py-2.5 px-3">Stream Status</th>
                    <th className="py-2.5 px-3 text-right">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {cmState.peers.map(peer => (
                    <tr key={peer.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{peer.hostname}</span>
                        <span className="text-[10px] text-slate-500">{peer.ip}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {peer.site}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{peer.bucketCount.toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span>{peer.diskUsagePct}%</span>
                          <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${peer.diskUsagePct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{peer.statusMessage}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-emerald-400 font-bold">{peer.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: DEPLOYMENT SERVER (FORWARDER MANAGEMENT)
          ========================================================================= */}
      {activeSubTab === 'deployment_server' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">
                    {isFa ? 'دپلویمنت سرور اسپلانک (Splunk Deployment Server & Forwarder Management)' : 'Splunk Deployment Server'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {isFa
                    ? 'مدیریت و توزیع متمرکز اپلیکیشن‌ها و کانفیگ‌ها به ۱۴۲۰ دستگاه Universal Forwarder و Heavy Forwarder.'
                    : 'Centrally distribute apps, inputs.conf, and configurations to forwarder fleet.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">Phone-Home: </span>
                  <strong className="text-purple-300">{dsState.phoneHomeIntervalSecs}s</strong>
                </div>

                <button
                  onClick={handleReloadDS}
                  disabled={isReloadingDS}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isReloadingDS ? 'animate-spin' : ''}`} />
                  <span>{isReloadingDS ? (isFa ? 'در حال ریلود...' : 'Reloading...') : (isFa ? 'ریلود دپلویمنت سرور' : 'Reload DS')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Server Classes Grid */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>{isFa ? 'کلاس‌های سروری تعریف شده (Configured Server Classes):' : 'Server Classes:'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dsState.serverClasses.map(sc => (
                <div key={sc.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-white font-mono text-xs">{sc.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">{sc.filterCriteria}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {sc.clientCount} Clients
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-900">
                    <span>Apps: <strong className="text-white">{sc.appCount} App packages</strong></span>
                    <span>Restart on update: <strong className={sc.restartRequired ? 'text-amber-400' : 'text-slate-400'}>{sc.restartRequired ? 'Yes' : 'No'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Apps Repository Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'مخزن اپلیکیشن‌های دپلویمنت ($SPLUNK_HOME/etc/deployment-apps/):' : 'Deployment Apps Repository:'}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300 font-mono">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">App Name</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Target Server Classes</th>
                    <th className="py-2.5 px-3">Package Size</th>
                    <th className="py-2.5 px-3 text-right">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {dsState.deploymentApps.map(app => (
                    <tr key={app.appName} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white">{app.appName}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{app.version}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {app.targetServerClasses.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{app.sizeMb} MB</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{app.lastModified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 5: SHC DEPLOYER
          ========================================================================= */}
      {activeSubTab === 'shc_deployer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    {isFa ? 'دپلویِر کلاستر سرچ‌هد اسپلانک (SHC Deployer & Bundle Distribution)' : 'Splunk Search Head Cluster Deployer'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {isFa
                    ? 'مدیریت و توزیع اپلیکیشن‌ها و دشبوردهای SOC به اعضای کلاستر سرچ‌هد از مسیر shcluster/apps.'
                    : 'Push configuration bundles and knowledge objects to Search Head Cluster captain and members.'}
                </p>
              </div>

              <button
                onClick={handlePushSHCBundle}
                disabled={isPushingSHCBundle}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>{isPushingSHCBundle ? (isFa ? 'در حال ارسال به SHC...' : 'Pushing...') : (isFa ? 'ارسال باندل به سرچ‌هدها (Push Bundle)' : 'Apply SHC Bundle')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isFa ? 'کاپیتان منتخب کلاستر (SHC Captain):' : 'SHC Elected Captain:'}</span>
                <span className="font-bold text-blue-300 block mt-1">{deployerState.shcCaptain}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isFa ? 'وضعیت انتخابات کاپیتان:' : 'Captain Election State:'}</span>
                <span className="font-bold text-emerald-400 block mt-1">{deployerState.shcStatus}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isFa ? 'آخرین ارسال باندل (Last Bundle Push):' : 'Last Push Timestamp:'}</span>
                <span className="text-slate-300 block mt-1">{deployerState.lastBundlePush}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white">{isFa ? 'اپلیکیشن‌های آماده توزیع در ($SPLUNK_HOME/etc/shcluster/apps/):' : 'SHC Distributed Apps Repository:'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              {deployerState.appsInShcluster.map(app => (
                <div key={app} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-semibold">{app}</span>
                  <span className="text-emerald-400 text-[10px]">Ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 6: MONITORING CONSOLE (DMC)
          ========================================================================= */}
      {activeSubTab === 'monitoring_console' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">
                {isFa ? 'کنسول مانیتورینگ توزیع‌شده اسپلانک (Monitoring Console / DMC)' : 'Splunk Distributed Monitoring Console'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {isFa
                ? 'پایش متمرکز منابع محاسباتی، پردازش ایندکس، ترافیک سرچ همزمان و هشدارهای عملکردی کل نودهای کلاستر.'
                : 'Central health check audits, concurrent search capacity, and index pipeline resource utilization.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">{isFa ? 'شاخص سلامت توپولوژی:' : 'Topology Health Score:'}</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">98 / 100</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">{isFa ? 'نرخ ورود لاگ تجمیعی کلاستر:' : 'Cluster Ingestion EPS:'}</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">18,450 EPS</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">{isFa ? 'جستجوهای همزمان فعال:' : 'Active Search Concurrency:'}</span>
                <div className="text-2xl font-black text-amber-400 mt-1">24 Queries</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW LICENSE KEY
          ========================================================================= */}
      {isAddingKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f16] border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'افزودن کلید لایسنس جدید به لایسنس سرور اسپلانک' : 'Add Splunk License Key'}</span>
            </h3>

            <form onSubmit={handleAddLicenseKey} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'نوع استک لایسنس:' : 'License Type:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ENTERPRISE', 'DEV_TEST', 'FORWARDER'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewKeyType(t)}
                      className={`p-2 rounded-xl font-bold border transition ${
                        newKeyType === t ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'عنوان / برچسب لایسنس:' : 'License Label:'}</label>
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Splunk Enterprise Expansion (100 GB/day)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'رشته کلید لایسنس یا محتوای فایل XML:' : 'License Key or XML Content:'}</label>
                <textarea
                  rows={3}
                  value={newKeyString}
                  onChange={(e) => setNewKeyString(e.target.value)}
                  placeholder="SPL-ENT-100GB-2026-EXPANSION-KEY-XXXXX..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              {newKeyType !== 'FORWARDER' && (
                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'سهمیه روزانه این کلید (GB/Day):' : 'Daily Quota (GB):'}</label>
                  <input
                    type="number"
                    value={newKeyQuota}
                    onChange={(e) => setNewKeyQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-400 outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingKeyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {isFa ? 'ثبت و فعال‌سازی در استک' : 'Add to Stack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW LICENSE POOL
          ========================================================================= */}
      {isAddingPoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f16] border border-cyan-500/50 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'تعریف استخر لایسنس جدید (Create Splunk License Pool)' : 'New License Pool'}</span>
            </h3>

            <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'نام استخر (Pool Name):' : 'Pool Name:'}</label>
                <input
                  type="text"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="Payment_Gateway_Pool"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'سهمیه تخصیصی روزانه (GB/Day):' : 'Allocated Quota (GB):'}</label>
                <input
                  type="number"
                  value={newPoolQuota}
                  onChange={(e) => setNewPoolQuota(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'توضیحات و کاربرد استخر:' : 'Description:'}</label>
                <input
                  type="text"
                  value={newPoolDesc}
                  onChange={(e) => setNewPoolDesc(e.target.value)}
                  placeholder="استخر لاگ‌های تراکنش شاپرک و درگاه پرداخت"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingPoolModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  {isFa ? 'ایجاد استخر' : 'Create Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
