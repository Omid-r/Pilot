import React, { useState } from 'react';
import { 
  ServerAssetNode, 
  SizingLOMInputs, 
  CalculatedSizingResult, 
  calculateSplunkSizing, 
  INITIAL_SERVER_ASSETS, 
  OS_DISTRIBUTIONS, 
  PRE_OS_ACCESS_GUIDE, 
  FAILOVER_POLICIES,
  DeploymentTargetEngine,
  DEPLOYMENT_ENGINE_OPTIONS,
  DeploymentEngineOption,
  DEFAULT_SOC_ANALYSTS,
  DEFAULT_SEARCH_LOAD_BALANCER
} from '../data/splunkDeployerData';
import { SplunkSchematicBlueprintDiagram } from './SplunkSchematicBlueprintDiagram';
import { SplunkFleetDiscoveryProvisioner } from './SplunkFleetDiscoveryProvisioner';
import { 
  Server, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Settings2, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  Box, 
  Play, 
  RefreshCw, 
  Key, 
  Globe, 
  Download, 
  Sparkles, 
  Zap, 
  FileCode, 
  Database, 
  Radio, 
  Sliders, 
  Info,
  ExternalLink,
  Shield,
  Clock,
  RotateCcw,
  Boxes,
  DollarSign,
  Users,
  Search,
  Lock,
  FolderOpen
} from 'lucide-react';

interface SplunkClusterDeployerWizardProps {
  lang: 'fa' | 'en';
  onDeployComplete?: (nodes: ServerAssetNode[]) => void;
}

export const SplunkClusterDeployerWizard: React.FC<SplunkClusterDeployerWizardProps> = ({ 
  lang,
  onDeployComplete 
}) => {
  const isFa = lang === 'fa';

  // Master Mode: 'fleet_scanner_orchestrator' vs 'sva_guided_stepper'
  const [deployerMasterMode, setDeployerMasterMode] = useState<'fleet_scanner_orchestrator' | 'sva_guided_stepper'>('fleet_scanner_orchestrator');

  // Current Wizard Step: 0 to 6 (Defaults to Step 1: Schematic Blueprint & Add Nodes)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Sizing LOM State
  const [sizingInputs, setSizingInputs] = useState<SizingLOMInputs>({
    dailyVolumeGB: 250,
    hotWarmRetentionDays: 30,
    coldRetentionDays: 90,
    frozenRetentionDays: 365,
    searchUsers: 12,
    socAnalysts: DEFAULT_SOC_ANALYSTS,
    realTimeDashboardsCount: 4,
    adHocSearchesPerHour: 25,
    replicationFactor: 3,
    searchFactor: 2,
    isMultiSite: true,
    sitesCount: 2,
    availabilityTier: 'mission_critical_c11',
    hotWarmDiskType: 'NVMe Gen4 SSD (10,000+ IOPS)',
    coldDiskType: 'SAS 10K/15K RPM HDD (RAID-6 / 1,200 IOPS)',
    frozenStorageType: 'Object Storage (MinIO / S3 / Ceph)',
    smartStoreEnabled: true,
    s3BucketEndpoint: 's3://splunk-smartstore-soc-archive/',
    searchLoadBalancer: DEFAULT_SEARCH_LOAD_BALANCER,
    licensePricingModel: 'term_ingest',
    licenseSupportLevel: 'Enterprise Standard 24x7'
  });

  const sizingResult = calculateSplunkSizing(sizingInputs);

  // Server Assets Inventory State
  const [assets, setAssets] = useState<ServerAssetNode[]>(INITIAL_SERVER_ASSETS);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(INITIAL_SERVER_ASSETS[0].id);

  // Selected Target OS
  const [selectedOS, setSelectedOS] = useState<string>('rhel_9_4');
  const [newNodeIp, setNewNodeIp] = useState<string>('');
  const [newNodeLomIp, setNewNodeLomIp] = useState<string>('');

  // Deployment Target Engine (Bare-Metal Native OS vs Docker Compose vs K8s Operator)
  const [deploymentEngine, setDeploymentEngine] = useState<DeploymentTargetEngine>('baremetal_native');

  // Deployment Execution State
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentProgress, setDeploymentProgress] = useState<number>(0);
  const [deployStepIndex, setDeployStepIndex] = useState<number>(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [isHardenedApproved, setIsHardenedApproved] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'native_systemd' | 'k8s_pods' | 'docker_containers' | 'cluster_repairs'>('native_systemd');

  const selectedNode = assets.find(a => a.id === selectedNodeId) || assets[0];

  // Helper to add new custom component node
  const handleAddNode = (role: ServerAssetNode['role']) => {
    const roleCount = assets.filter(a => a.role === role).length + 1;
    let prefix = 'node';
    let defaultCpu = 8;
    let defaultRam = 16;
    let defaultNVMe = 200;
    let defaultCold = 0;

    if (role === 'indexer_peer') {
      prefix = 'idx';
      defaultCpu = 16;
      defaultRam = 64;
      defaultNVMe = 1000;
      defaultCold = 4;
    } else if (role === 'search_head') {
      prefix = 'sh';
      defaultCpu = 16;
      defaultRam = 32;
      defaultNVMe = 300;
    } else if (role === 'cluster_manager') {
      prefix = 'cm';
      defaultCpu = 8;
      defaultRam = 16;
      defaultNVMe = 150;
    } else if (role === 'license_master') {
      prefix = 'lm';
      defaultCpu = 4;
      defaultRam = 8;
      defaultNVMe = 100;
    } else if (role === 'deployment_server') {
      prefix = 'ds';
      defaultCpu = 8;
      defaultRam = 16;
      defaultNVMe = 200;
    } else if (role === 'deployer') {
      prefix = 'deployer';
      defaultCpu = 4;
      defaultRam = 8;
      defaultNVMe = 100;
    } else if (role === 'heavy_forwarder') {
      prefix = 'hf';
      defaultCpu = 8;
      defaultRam = 16;
      defaultNVMe = 150;
    } else if (role === 'search_load_balancer') {
      prefix = 'lb';
      defaultCpu = 4;
      defaultRam = 8;
      defaultNVMe = 50;
    }

    const requestedIp = newNodeIp.trim() || window.prompt(isFa ? 'IP واقعی نود را وارد کنید:' : 'Enter the real node IP:')?.trim() || '';
    const requestedLom = newNodeLomIp.trim() || window.prompt(isFa ? 'IP واقعی LOM/BMC (اختیاری):' : 'Real LOM/BMC IP (optional):')?.trim() || '';

    const newNode: ServerAssetNode = {
      id: `node-${prefix}-0${roleCount}-${Date.now().toString().slice(-4)}`,
      hostname: `splunk-${prefix}-0${roleCount}.soc.local`,
      ip: requestedIp,
      lomIp: requestedLom || undefined,
      lomType: requestedLom ? 'idrac' : undefined,
      sshPort: 22,
      sshUser: 'root',
      role,
      site: roleCount % 2 === 0 ? 'site2' : 'site1',
      cpuCores: defaultCpu,
      ramGB: defaultRam,
      storageNVMeGB: defaultNVMe,
      storageColdTB: defaultCold,
      osType: 'rhel_9_4',
      status: 'pending_access',
      installProgress: 0,
      isConfigured: false,
      assignedPorts: {
        splunkMgmt: 8089,
        splunkWeb: role === 'search_head' || role === 'cluster_manager' || role === 'license_master' || role === 'deployment_server' ? 8000 : undefined,
        splunkTcp: role === 'indexer_peer' ? 9997 : undefined,
        hecPort: role === 'heavy_forwarder' ? 8088 : undefined,
        replicationPort: role === 'indexer_peer' ? 9887 : undefined,
        shcReplicationPort: role === 'search_head' ? 8181 : undefined
      }
    };

    if (!newNode.ip) {
      alert(isFa ? 'برای افزودن نود، IP واقعی را وارد کنید.' : 'Enter a real node IP before adding the node.');
      return;
    }
    if (assets.some(a => a.ip === newNode.ip)) {
      alert(isFa ? 'این IP قبلاً در نقشه وجود دارد.' : 'This IP already exists in the topology.');
      return;
    }
    setAssets(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setNewNodeIp('');
    setNewNodeLomIp('');
  };

  // Helper to remove node
  const handleRemoveNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (assets.length <= 1) return;
    const next = assets.filter(a => a.id !== id);
    setAssets(next);
    if (selectedNodeId === id) {
      setSelectedNodeId(next[0].id);
    }
  };

  // Helper to update node specs
  const handleUpdateNodeSpecs = (id: string, field: keyof ServerAssetNode, value: any) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // Real full-cluster orchestration — delegates to authenticated backend and reports actual results.
  const handleStartFullClusterDeploy = async () => {
    if (!assets.length) {
      alert(isFa ? 'ابتدا حداقل یک نود واقعی به نقشه اضافه یا از Discovery انتخاب کنید.' : 'Add or discover at least one real node before deployment.');
      return;
    }
    const invalid=assets.find(a=>!a.ip || !a.sshUser);
    if(invalid){
      alert(isFa ? `اطلاعات اتصال نود ${invalid.hostname} کامل نیست.` : `Connection details are incomplete for ${invalid.hostname}.`);
      return;
    }

    const adminPassword = window.prompt(isFa ? 'رمز واقعی admin اسپلانک برای این استقرار:' : 'Real Splunk admin password for this deployment:') || '';
    const pass4SymmKey = window.prompt(isFa ? 'کلید واقعی pass4SymmKey:' : 'Real pass4SymmKey:') || '';
    if (adminPassword.length < 12 || pass4SymmKey.length < 12) {
      alert(isFa ? 'رمزهای واقعی وارد نشدند یا کوتاه هستند؛ استقرار متوقف شد.' : 'Real credentials were not supplied or are too short; deployment stopped.');
      return;
    }
    let imageRef = '';
    let composeFile = '';
    if (deploymentEngine === 'k8s_operator') {
      imageRef = window.prompt(isFa ? 'نام کامل Image واقعی که روی نودها load شده است:' : 'Full name of the real image already loaded on target nodes:') || '';
      if (!imageRef.trim()) {
        alert(isFa ? 'Image واقعی برای Kubernetes الزامی است.' : 'A real preloaded image is required for Kubernetes.');
        return;
      }
    }
    if (deploymentEngine === 'docker_standalone') {
      composeFile = window.prompt(isFa ? 'مسیر/نام فایل docker-compose واقعی روی نودها:' : 'Path/name of the real docker-compose manifest on target nodes:') || '';
      if (!composeFile.trim()) {
        alert(isFa ? 'Compose واقعی برای Docker الزامی است.' : 'A real Compose manifest is required for Docker.');
        return;
      }
    }

    setIsDeploying(true);
    setDeploymentProgress(1);
    setDeployStepIndex(0);
    setDeployLogs([`[${new Date().toLocaleTimeString()}] [REAL_ORCHESTRATOR] Starting ${deploymentEngine} deployment for ${assets.length} real nodes.`]);

    try {
      const res=await fetch('/api/real/cluster/deploy',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          deploymentEngine,
          selectedOS,
          sizingInputs,
          adminPassword,
          pass4SymmKey,
          imageRef,
          composeFile,
          nodes:assets.map(a=>({
            id:a.id,hostname:a.hostname,ip:a.ip,sshUser:a.sshUser,sshPort:a.sshPort,
            lomIp:a.lomIp,lomType:a.lomType,role:a.role,site:a.site,
            cpuCores:a.cpuCores,ramGB:a.ramGB,storageNVMeGB:a.storageNVMeGB,
            osType:a.osType,osInstallConfig:a.osInstallConfig,
            containerEngineConfig:a.containerEngineConfig,
            splunkVersion:(a as any).splunkVersion
          }))
        })
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok || !data.success) throw new Error(data.error || 'Real cluster deployment failed');

      const results=Array.isArray(data.nodes)?data.nodes:[];
      setDeploymentProgress(100);
      setDeployStepIndex(results.length);
      setDeployLogs(prev=>[...prev,...(data.logs||[]),`[${new Date().toLocaleTimeString()}] [REAL_COMPLETE] Cluster deployment verified by backend.`]);

      setAssets(prev=>prev.map(a=>{
        const r=results.find((x:any)=>x.id===a.id);
        return r ? {...a,status:r.status||a.status,installProgress:r.installProgress??100,hardeningReport:r.hardeningReport,isConfigured:r.isConfigured??a.isConfigured} : a;
      }));
      if(onDeployComplete) onDeployComplete(
        results.length ? assets.map(a=>results.find((x:any)=>x.id===a.id)?{...a,...results.find((x:any)=>x.id===a.id)}:a) : assets
      );
    } catch(e:any) {
      setDeployLogs(prev=>[...prev,`[${new Date().toLocaleTimeString()}] [FAILED] ${e.message}`]);
      setDeploymentProgress(0);
    } finally {
      setIsDeploying(false);
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const stepsList = [
    { num: 0, titleFa: 'دسترسی روت و آدرس‌ها (LOM / IPMI / Bare-Metal)', titleEn: '0. Root & LOM Access' },
    { num: 1, titleFa: 'محاسبه LOM و طراحی شماتیک نودها', titleEn: '1. Sizing LOM & Topology' },
    { num: 2, titleFa: 'انتخاب سیستم‌عامل (RHEL / Ubuntu / Rocky)', titleEn: '2. OS Deployment' },
    { num: 3, titleFa: 'امن‌سازی عمیق و تیونینگ کرنل', titleEn: '3. Kernel Hardening' },
    { num: 4, titleFa: 'موتور استقرار (سیستم‌عامل مستقیم / داکر / کوبر)', titleEn: '4. Target Engine (Bare-Metal / Docker / K8s)' },
    { num: 5, titleFa: 'تنظیمات Failover و خودترمیمی', titleEn: '5. Failover & Auto-Healing' },
    { num: 6, titleFa: 'کنسول مدیریت سرویس‌ها و کلاستر', titleEn: '6. Service & Cluster Console' }
  ];

  return (
    <div className="space-y-6 text-start" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Top Main Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e141c] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-semibold text-xs text-white block">
              {isFa ? 'حالت استقرار و ارکستراسیون کلاستر:' : 'Deployment & Orchestration Mode:'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isFa ? 'انتخاب بین اسکنر هوشمند شبکه با نصب موازی یا ویزارد گام‌به‌گام SVA' : 'Choose between Network Discovery Scanner or SVA Stepper'}
            </span>
          </div>
        </div>

        <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setDeployerMasterMode('fleet_scanner_orchestrator')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-2 ${
              deployerMasterMode === 'fleet_scanner_orchestrator'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFa ? 'اسکنر شبکه و استقرار موازی ناوگان' : 'Fleet Discovery & Parallel Deployer'}</span>
          </button>

          <button
            onClick={() => setDeployerMasterMode('sva_guided_stepper')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-2 ${
              deployerMasterMode === 'sva_guided_stepper'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'ویزارد گام‌به‌گام معماری SVA' : 'SVA Guided Step-by-Step'}</span>
          </button>
        </div>
      </div>

      {/* Render Fleet Discovery & Parallel Provisioner */}
      {deployerMasterMode === 'fleet_scanner_orchestrator' && (
        <SplunkFleetDiscoveryProvisioner lang={lang} onDeployComplete={onDeployComplete} />
      )}

      {/* Render SVA Guided Stepper */}
      {deployerMasterMode === 'sva_guided_stepper' && (
        <div className="bg-[#0e141c] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-lg space-y-6 text-start">
          {/* Wizard Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {isFa ? 'مرکز نصب، استقرار خودکار و ارکستراسیون کلاستر اسپلانک' : 'Splunk SVA Guided Cluster Deployer'}
                  </h2>
                  <span className="text-slate-600 font-mono">·</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Zero-Touch SVA SOK
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFa 
                    ? 'پوشش کامل از دسترسی سخت‌افزاری سرورهای خام (iDRAC/iLO)، محاسبه LOM، استقرار مستقیم بر روی سیستم‌عامل لینوکس (بدون نیاز به داکر و کوبر)، کانتینرهای داکر یا کلاستر کوبرنتیز' 
                    : 'Full lifecycle deployment: Bare-Metal LOM access, SVA LOM sizing, schematic diagram, OS install, Native Systemd (No-Docker), Docker & K8s SOK automated cluster bootstrap.'}
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  <ArrowRight className={`w-3.5 h-3.5 ${isFa ? '' : 'rotate-180'}`} />
                  <span>{isFa ? 'مرحله قبل' : 'Previous'}</span>
                </button>
              )}

              {currentStep < stepsList.length - 1 && (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(stepsList.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  <span>{isFa ? 'مرحله بعد' : 'Next Step'}</span>
                  <ArrowLeft className={`w-3.5 h-3.5 ${isFa ? '' : 'rotate-180'}`} />
                </button>
              )}
            </div>
          </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stepsList.map(step => (
          <button
            key={step.num}
            onClick={() => setCurrentStep(step.num)}
            className={`p-2.5 rounded-lg border text-xs font-medium transition text-right cursor-pointer flex flex-col justify-between gap-1.5 ${
              currentStep === step.num
                ? 'bg-slate-900 border-cyan-500 text-white font-semibold'
                : currentStep > step.num
                ? 'bg-slate-950 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-800 tabular-nums">
                0{step.num}
              </span>
              {currentStep > step.num ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : currentStep === step.num ? (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              ) : null}
            </div>
            <span className="text-[11px] truncate">{isFa ? step.titleFa : step.titleEn}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* STEP 0: PRE-OS / LOM / IPMI / ROOT ACCESS PROVISIONING */}
      {/* ========================================================================= */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-cyan-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Key className="w-5 h-5" />
              <span>{isFa ? 'راهنمای اعطای دسترسی Root و مدیریت سخت‌افزاری سرورهای خام (Bare-Metal / LOM / IPMI)' : 'Pre-OS & Root Provisioning Guidance'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa 
                ? 'این برنامه برای نصب خودکار سیستم‌عامل، کرنل، داکر، کوبرنتیز و کلاستر اسپلانک نیازمند دسترسی روت (Root) یا ارتباط سخت‌افزاری LOM (کارت‌های مدیریتی Dell iDRAC، HPE iLO یا IPMI) است.'
                : 'The deployer requires Root access or Hardware LOM (Dell iDRAC, HPE iLO, IPMI) to orchestrate OS installation, kernel tuning, Docker, K8s and Splunk.'}
            </p>

            {/* Methods Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
              {PRE_OS_ACCESS_GUIDE.methods.map(m => (
                <div key={m.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 mb-2">{isFa ? m.nameFa : m.nameEn}</h4>
                    <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pr-4">
                      {m.stepsFa.map((st, sidx) => (
                        <li key={sidx} className="leading-normal">{st}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#080c12] p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                    <pre><code>{m.cliExample}</code></pre>
                  </div>
                </div>
              ))}
            </div>

            {/* SSH Key Injection Snippet */}
            <div className="bg-[#090d14] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>{isFa ? 'کلید عمومی اختصاصی SSH برنامه جهت تزریق به سرورها:' : 'Deployer Master SSH Public Key:'}</span>
                </span>
                <p className="text-[11px] font-mono text-slate-400">ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI-SPLUNK-DOCTOR-ORCHESTRATOR-KEY root@splunk-doctor</p>
              </div>

              <button
                onClick={() => copyToClipboard("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI-SPLUNK-DOCTOR-ORCHESTRATOR-KEY root@splunk-doctor")}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی کلید SSH' : 'Copy Key')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: SIZING LOM & SCHEMATIC NODE ARCHITECTURE BUILDER */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          
          {/* LOM Inputs Controls */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isFa ? 'محاسبه‌گر رسمی LOM (سطح مصرف و ظرفیت‌سنجی سخت‌افزار طبق استاندارد اسپلانک)' : 'Official Splunk Sizing & LOM Capacity Planner'}
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                SVA {sizingResult.svaCategory}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Daily Volume & License Rate */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-medium">{isFa ? 'حجم لاگ روزانه (GB/Day):' : 'Daily Ingest (GB/Day):'}</label>
                  <span className="text-emerald-400 font-mono font-bold">${sizingResult.licenseCost.estimatedAnnualLicenseUSD.toLocaleString()}/yr</span>
                </div>
                <input
                  type="number"
                  min="10"
                  max="20000"
                  step="50"
                  value={sizingInputs.dailyVolumeGB}
                  onChange={(e) => setSizingInputs({ ...sizingInputs, dailyVolumeGB: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">نرخ ورودی: {sizingResult.dailyIngestRateMBs} MB/s (${sizingResult.licenseCost.costPerGBYearUSD}/GB)</span>
              </div>

              {/* Hot/Warm & Cold Retention */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-medium">{isFa ? 'ماندگاری باکت‌ها (روز):' : 'Retention (Hot / Cold):'}</label>
                  <span className="text-amber-400 font-mono font-bold">{sizingResult.totalWithFrozenStorageTB} TB Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[9px] text-slate-500 block">Hot/Warm (NVMe):</span>
                    <input
                      type="number"
                      min="7"
                      max="180"
                      value={sizingInputs.hotWarmRetentionDays || 30}
                      onChange={(e) => setSizingInputs({ ...sizingInputs, hotWarmRetentionDays: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] text-slate-500 block">Cold (SAS):</span>
                    <input
                      type="number"
                      min="30"
                      max="730"
                      value={sizingInputs.coldRetentionDays || 90}
                      onChange={(e) => setSizingInputs({ ...sizingInputs, coldRetentionDays: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs font-bold"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-amber-300/80 font-mono">{sizingResult.hotWarmStorageTB} TB Hot + {sizingResult.coldStorageTB} TB Cold</span>
              </div>

              {/* Concurrent Search Users & SOC Team */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-medium">{isFa ? 'تیم SOC و کاربران جستجو:' : 'SOC Analysts & Users:'}</label>
                  <span className="text-sky-400 font-mono font-bold">{sizingInputs.socAnalysts?.length || 4} Analysts</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={sizingInputs.searchUsers}
                  onChange={(e) => setSizingInputs({ ...sizingInputs, searchUsers: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-sky-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">{sizingResult.recommendedSearchHeads} Search Heads + {sizingInputs.searchLoadBalancer?.type.toUpperCase()} LB</span>
              </div>

              {/* Replication & Search Factor */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 font-medium">{isFa ? 'افزونگی کلاستر (RF / SF):' : 'Replication (RF / SF):'}</label>
                <div className="flex items-center gap-2">
                  <select
                    value={sizingInputs.replicationFactor}
                    onChange={(e) => setSizingInputs({ ...sizingInputs, replicationFactor: Number(e.target.value) })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                  >
                    <option value="2">RF = 2</option>
                    <option value="3">RF = 3 (SVA)</option>
                    <option value="4">RF = 4</option>
                  </select>
                  <select
                    value={sizingInputs.searchFactor}
                    onChange={(e) => setSizingInputs({ ...sizingInputs, searchFactor: Number(e.target.value) })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                  >
                    <option value="2">SF = 2 (SVA)</option>
                    <option value="3">SF = 3</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">توصیه حداقل {sizingResult.recommendedIndexers} ایندکسر</span>
              </div>
            </div>

            {/* SmartStore Toggle */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-slate-200">{isFa ? 'فعال‌سازی Splunk SmartStore (Remote S3 / MinIO Storage)' : 'Splunk SmartStore (S3/MinIO)'}</h4>
                  <p className="text-[11px] text-slate-400">{isFa ? 'کاهش ۶۰٪ هزینه دیسک با انتقال باکت‌های Cold به آبجکت استوریج S3 سازمانی' : 'Reduces storage cost by 60% with remote S3 tier'}</p>
                </div>
              </div>

              <input
                type="text"
                value={sizingInputs.s3BucketEndpoint}
                onChange={(e) => setSizingInputs({ ...sizingInputs, s3BucketEndpoint: e.target.value })}
                placeholder="s3://splunk-smartstore-bucket/..."
                className="w-72 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-white"
              />
            </div>
          </div>

          {/* Schematic Interactive Node Architecture Diagram & Resource Tuner */}
          <div className="space-y-4">
            {/* Visual High-Fidelity Blueprint Canvas matching image.png */}
            <SplunkSchematicBlueprintDiagram
              assets={assets}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onAddNode={handleAddNode}
              onRemoveNode={handleRemoveNode}
              onUpdateNode={handleUpdateNodeSpecs}
              sizingInputs={sizingInputs}
              onUpdateSizingInputs={setSizingInputs}
              sizingResult={sizingResult}
              lang={lang}
            />

            {/* Interactive Vector Node Schematic Cards & Sizing Breakdown */}
            <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span>{isFa ? 'مدیریت و اختصاص منابع گره‌های معماری کلاستر اسپلانک' : 'Clustered Node Resource & IP Allocator'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isFa ? 'روی هر نود کلیک کنید تا IP، سخت‌افزار و پورت‌ها را تغییر دهید. با دکمه‌های + نود اضافه یا حذف نمایید.' : 'Click any node to edit Hostname, IP, CPU, RAM & Ports. Use + to add new nodes.'}
                  </p>
                </div>
              </div>

              {/* Interactive Vector Node Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {assets.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                      selectedNodeId === node.id
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-500'
                        : 'bg-[#0f1521] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            node.role === 'cluster_manager' ? 'bg-amber-400' :
                            node.role === 'indexer_peer' ? 'bg-emerald-400' :
                            node.role === 'search_head' ? 'bg-sky-400' : 'bg-purple-400'
                          }`}></span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {node.role.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                            {node.site}
                          </span>
                          {assets.length > 1 && (
                            <button
                              onClick={(e) => handleRemoveNode(node.id, e)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                              title={isFa ? 'حذف این نود' : 'Remove Node'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-mono font-bold text-white mb-1">
                        {node.hostname}
                      </h4>

                      {/* IP & LOM IP */}
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                        <div><span className="text-slate-500">IP:</span> <span className="text-cyan-300 font-bold">{node.ip}</span></div>
                        {node.lomIp && (
                          <div><span className="text-slate-500">LOM:</span> <span className="text-amber-300">{node.lomIp} ({node.lomType.toUpperCase()})</span></div>
                        )}
                      </div>
                    </div>

                    {/* Resource Specs & Ports Pill */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{node.cpuCores} vCPU</span>
                        <span>•</span>
                        <span>{node.ramGB} GB RAM</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {node.assignedPorts.splunkTcp && <span className="px-1 bg-emerald-950 text-emerald-300 rounded text-[9px]">9997</span>}
                        {node.assignedPorts.splunkWeb && <span className="px-1 bg-sky-950 text-sky-300 rounded text-[9px]">8000</span>}
                        {node.assignedPorts.splunkMgmt && <span className="px-1 bg-amber-950 text-amber-300 rounded text-[9px]">8089</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            {/* Active Selected Node Resource Editor */}
            {selectedNode && (
              <div className="bg-[#0a0e16] border border-cyan-500/30 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    <span>{isFa ? `تنظیمات دستی منابع، IP و پورت‌های نود: ${selectedNode.hostname}` : `Edit Node Configuration: ${selectedNode.hostname}`}</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Node ID: {selectedNode.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {/* Hostname */}
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">Hostname:</label>
                    <input
                      type="text"
                      value={selectedNode.hostname}
                      onChange={(e) => handleUpdateNodeSpecs(selectedNode.id, 'hostname', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  {/* Production IP */}
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">Production IP:</label>
                    <input
                      type="text"
                      value={selectedNode.ip}
                      onChange={(e) => handleUpdateNodeSpecs(selectedNode.id, 'ip', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-mono text-xs font-bold"
                    />
                  </div>

                  {/* LOM / IPMI IP */}
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">LOM / iDRAC / iLO IP:</label>
                    <input
                      type="text"
                      value={selectedNode.lomIp || ''}
                      onChange={(e) => handleUpdateNodeSpecs(selectedNode.id, 'lomIp', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-mono text-xs"
                    />
                  </div>

                  {/* CPU Cores */}
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">CPU Cores:</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateNodeSpecs(selectedNode.id, 'cpuCores', Math.max(4, selectedNode.cpuCores - 4))}
                        className="px-2 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-700"
                      >-</button>
                      <span className="w-12 text-center font-mono font-bold text-white">{selectedNode.cpuCores}</span>
                      <button
                        onClick={() => handleUpdateNodeSpecs(selectedNode.id, 'cpuCores', selectedNode.cpuCores + 4)}
                        className="px-2 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-700"
                      >+</button>
                    </div>
                  </div>

                  {/* RAM GB */}
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">RAM (GB):</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateNodeSpecs(selectedNode.id, 'ramGB', Math.max(8, selectedNode.ramGB - 8))}
                        className="px-2 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-700"
                      >-</button>
                      <span className="w-12 text-center font-mono font-bold text-white">{selectedNode.ramGB}</span>
                      <button
                        onClick={() => handleUpdateNodeSpecs(selectedNode.id, 'ramGB', selectedNode.ramGB + 8)}
                        className="px-2 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-700"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: OS SELECTION & AUTOMATED KICKSTART / PXE INSTALL */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <span>{isFa ? 'انتخاب جدیدترین و باثبات‌ترین سیستم‌عامل سازمانی (Enterprise OS Selection)' : 'Enterprise OS Selection & Automated Installation'}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? 'سیستم‌عامل مورد نظر برای نصب روی تمام نودهای خام یا مجازی‌سازی شده را انتخاب کنید. برنامه با یک کلیک فرآیند نصب غیرتعاملی خودکار را شروع می‌کند.'
                : 'Select the enterprise Linux distribution. The deployer will automatically generate PXE kickstarts and perform unattended OS installation.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {OS_DISTRIBUTIONS.map(os => (
                <div
                  key={os.id}
                  onClick={() => setSelectedOS(os.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedOS === os.id
                      ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-900 text-amber-300 border border-amber-500/30">
                        {os.badge}
                      </span>
                      {selectedOS === os.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{os.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{os.kernel}</p>
                    <p className="text-[10px] text-emerald-400 mt-1">{os.securityBenchmark}</p>
                  </div>

                  <button
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedOS === os.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {selectedOS === os.id ? (isFa ? 'انتخاب شده ✓' : 'Selected ✓') : (isFa ? 'انتخاب این سیستم‌عامل' : 'Select OS')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: KERNEL HARDENING & AUDIT REPORT */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isFa ? 'گزارش ممیزی و امن‌سازی کرنل بر اساس بهترین راهکار رسمی اسپلانک (Splunk Hardening Benchmark)' : 'Splunk Kernel Hardening & Compliance Report'}
                </h3>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                CIS Compliant
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? 'تمام بندهای الزامی امن‌سازی در زیر روی تک‌تک نودها اعمال خواهد شد. کاربر می‌تواند گزارش را بررسی و تایید یا سفارشی‌سازی نماید.'
                : 'Review the automated hardening policies enforced on all nodes before deploying Docker, K8s and Splunk.'}
            </p>

            {/* Hardening Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">{isFa ? 'غیرفعال‌سازی Transparent Huge Pages (THP)' : 'Disable Transparent Huge Pages (THP)'}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isFa ? 'جلوگیری از افت شدید IOPS و فریز شدن حافظه اسپلانک در کرنل لینوکس' : 'Prevents memory thrashing & latency spikes'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">{isFa ? 'تنظیمات ulimits و حداکثر فایل‌ها (limits.conf)' : 'File Descriptors & Ulimits'}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isFa ? 'تنظیم nofile=65535 و nproc=20480 برای ممانعت از خطای Too many open files' : 'nofile 65535, nproc 20480 configured'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">{isFa ? 'تیونینگ حافظه مجازی و سوآپ (sysctl vm.swappiness=1)' : 'Virtual Memory & Swappiness'}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isFa ? 'تنظیم swappiness=1 و vm.max_map_count=262144 جهت ارتقای عملکرد ایندکسینگ' : 'vm.swappiness=1, vm.max_map_count=262144'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">{isFa ? 'ایزوله‌سازی کاربر سرویس غیرریشه (splunk:splunk)' : 'Dedicated Non-Root Service User'}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isFa ? 'اجرای تمام دیمون‌های اسپلانک تحت کاربر امن با حداقل دسترسی سیستمی' : 'Enforced least-privilege daemon execution'}</p>
                </div>
              </div>
            </div>

            {/* Approval Box */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'آیا با اعمال این استانداردها روی تمام نودها موافق هستید؟' : 'Do you approve these hardening baselines across all nodes?'}</span>
              </div>
              <button
                onClick={() => setIsHardenedApproved(!isHardenedApproved)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isHardenedApproved ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isHardenedApproved ? (isFa ? 'تایید شده ✓' : 'Approved ✓') : (isFa ? 'نیاز به تغییر' : 'Customize')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: DEPLOYMENT TARGET ENGINE (BARE-METAL NATIVE OS VS DOCKER VS K8S) */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>{isFa ? 'انتخاب معماری و موتور استقرار (Target Deployment Architecture)' : 'Select Deployment Target Architecture'}</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                {isFa ? 'پشتیبانی کامل از سیستم‌عامل مستقیم و کانتینرها' : 'Bare-Metal & Containers Supported'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? 'در صورتی که در سازمان شما زیرساخت داکر یا کوبرنتیز وجود ندارد، گزینه «نصب مستقیم بر روی سیستم‌عامل» را انتخاب نمایید. در این حالت پکیج‌های رسمی RPM / DEB مستقیماً بر روی لینوکس نصب و توسط Linux Systemd با بالاترین سرعت IOPS و صفر سربار مدیریت می‌شوند.'
                : 'Choose whether to deploy directly on bare-metal / virtual Linux OS with native systemd, or use Docker / Kubernetes. Bare-metal direct install provides zero container overhead and maximum disk IOPS.'}
            </p>

            {/* Architecture Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              {DEPLOYMENT_ENGINE_OPTIONS.map(eng => {
                const isSelected = deploymentEngine === eng.id;
                return (
                  <div
                    key={eng.id}
                    onClick={() => {
                      setDeploymentEngine(eng.id);
                      if (eng.id === 'baremetal_native') {
                        setActiveConsoleTab('native_systemd');
                      } else if (eng.id === 'docker_standalone') {
                        setActiveConsoleTab('docker_containers');
                      } else {
                        setActiveConsoleTab('k8s_pods');
                      }
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-4 ${
                      isSelected
                        ? eng.id === 'baremetal_native'
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400'
                          : eng.id === 'docker_standalone'
                          ? 'bg-sky-950/40 border-sky-500 shadow-xl shadow-sky-500/10 ring-1 ring-sky-400'
                          : 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                          eng.id === 'baremetal_native'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : eng.id === 'docker_standalone'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}>
                          {eng.badge}
                        </span>
                        {isSelected && <CheckCircle2 className={`w-4 h-4 ${
                          eng.id === 'baremetal_native' ? 'text-emerald-400' : eng.id === 'docker_standalone' ? 'text-sky-400' : 'text-purple-400'
                        }`} />}
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                          {isFa ? eng.titleFa : eng.titleEn}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {isFa ? eng.subtitleFa : eng.subtitleEn}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        {(isFa ? eng.featuresFa : eng.featuresEn).slice(0, 4).map((f, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                            <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{isFa ? 'مدیریت سرویس:' : 'Manager:'}</span>
                        <span className="text-slate-200 font-bold">{eng.serviceManager}</span>
                      </div>
                      <button
                        className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? eng.id === 'baremetal_native'
                              ? 'bg-emerald-500 text-slate-950 shadow-md'
                              : eng.id === 'docker_standalone'
                              ? 'bg-sky-500 text-slate-950 shadow-md'
                              : 'bg-purple-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? (isFa ? 'انتخاب شده ✓' : 'Selected ✓') : (isFa ? 'انتخاب این معماری' : 'Select Architecture')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deep-Dive Box for Bare-Metal Native OS */}
            {deploymentEngine === 'baremetal_native' && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>{isFa ? 'مشخصات فنی استقرار مستقیم روی سیستم‌عامل (Native OS & Systemd Architecture)' : 'Native Bare-Metal OS & Systemd Specifications'}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{isFa ? 'مسیر نصب استاندارد:' : 'Install Directory:'}</span>
                    <span className="text-white font-mono font-bold text-[11px]">/opt/splunk</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{isFa ? 'کاربر سرویس لینوکس:' : 'System User:'}</span>
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">splunk:splunk (Non-Root)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{isFa ? 'نام دیمن Systemd:' : 'Systemd Unit:'}</span>
                    <span className="text-cyan-400 font-mono font-bold text-[11px]">Splunkd.service</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{isFa ? 'فایل‌سیستم دیسک:' : 'Filesystem:'}</span>
                    <span className="text-amber-400 font-mono font-bold text-[11px]">XFS (noatime,nodiratime)</span>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                  <div className="text-slate-500 font-bold"># دستورات تولیدی برای نصب مستقیم روی تک‌تک سرورهای لینوکس:</div>
                  <div className="text-emerald-400">useradd -m -r -s /bin/bash splunk</div>
                  <div className="text-cyan-300">tar -xzf splunk-9.4.0-linux-2.6-amd64.tgz -C /opt</div>
                  <div className="text-slate-300">chown -R splunk:splunk /opt/splunk</div>
                  <div className="text-amber-300">/opt/splunk/bin/splunk enable boot-start -user splunk --systemd-managed 1 --accept-license --answer-yes</div>
                  <div className="text-emerald-400">systemctl daemon-reload && systemctl enable --now Splunkd.service</div>
                </div>
              </div>
            )}

            {/* Deep-Dive Box for Docker Standalone */}
            {deploymentEngine === 'docker_standalone' && (
              <div className="bg-sky-950/20 border border-sky-500/30 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
                  <Box className="w-4 h-4" />
                  <span>{isFa ? 'مشخصات استقرار کانتینری Docker Compose' : 'Docker Standalone & Compose Specifications'}</span>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                  <div className="text-slate-500"># اجرای کانتینر رسمی اسپلانک با Docker Compose:</div>
                  <div className="text-sky-300">docker compose -f /opt/splunk-compose/docker-compose.yml up -d</div>
                  <div className="text-emerald-400">docker ps --filter "name=splunk"</div>
                </div>
              </div>
            )}

            {/* Deep-Dive Box for K8s SOK */}
            {deploymentEngine === 'k8s_operator' && (
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm">
                  <Boxes className="w-4 h-4" />
                  <span>{isFa ? 'مشخصات استقرار با Splunk Operator for Kubernetes' : 'Splunk Operator for Kubernetes Specifications'}</span>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                  <div className="text-slate-500"># مانیفست‌های CRD اسپلانک در کوبرنتیز:</div>
                  <div className="text-purple-300">kubectl apply -f https://github.com/splunk/splunk-operator/releases/download/2.5.0/splunk-operator-crds.yaml</div>
                  <div className="text-emerald-400">kubectl get pods -n splunk -o wide</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: FAILOVER, AUTO-HEALING & RESOURCE OPTIMIZATION */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>{isFa ? 'تنظیمات افزونگی هنگام قطعی، بهینه‌سازی منابع و خودترمیمی کلاستر' : 'Failover, Self-Healing & Resource Auto-Tuning'}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? 'پالیسی‌های خودکار جهت جلوگیری از قطعی در صورت از دست رفتن هر سرور، ترمیم باکت‌های مفقود و تنظیم صف‌های پردازش حافظه.'
                : 'Failover and self-healing policies to ensure zero data loss during server restarts or network splits.'}
            </p>

            <div className="space-y-3 pt-2">
              {FAILOVER_POLICIES.map(policy => (
                <div key={policy.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200">{isFa ? policy.nameFa : policy.nameEn}</h4>
                    <p className="text-[11px] text-slate-400 max-w-2xl">{isFa ? policy.descriptionFa : ''}</p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Active &amp; Enforced ✓
                  </span>
                </div>
              ))}
            </div>

            {/* Launch Big Deployment Trigger */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-400">
                  {isFa 
                    ? `آماده راه‌اندازی و اجرای خودکار کلاستر بر روی «${deploymentEngine === 'baremetal_native' ? 'سیستم‌عامل مستقیم (Bare-Metal)' : deploymentEngine === 'docker_standalone' ? 'داکر کانتینر' : 'کوبرنتیز'}» هستید؟` 
                    : `Ready to Launch Automated Cluster Deployment on ${deploymentEngine === 'baremetal_native' ? 'Bare-Metal Native OS' : deploymentEngine === 'docker_standalone' ? 'Docker Containers' : 'Kubernetes'}?`}
                </h4>
                <p className="text-xs text-slate-400">
                  {isFa 
                    ? `تمام مراحل بر روی ${assets.length} سرور طبق معماری انتخابی به‌صورت اتوماتیک اجرا خواهد شد.` 
                    : `All steps will execute sequentially across ${assets.length} nodes.`}
                </p>
              </div>

              <button
                onClick={handleStartFullClusterDeploy}
                disabled={isDeploying}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>
                  {isDeploying 
                    ? (isFa ? 'درحال استقرار کلاستر...' : 'Deploying Cluster...') 
                    : (isFa 
                        ? `شروع استقرار ۱۰۰٪ خودکار (${deploymentEngine === 'baremetal_native' ? 'مستقیم روی سیستم‌عامل' : deploymentEngine === 'docker_standalone' ? 'داکر' : 'کوبرنتیز'})` 
                        : 'Start Full Cluster Deployment')}
                </span>
              </button>
            </div>

            {/* Live Deployment Terminal Output */}
            {deployLogs.length > 0 && (
              <div className="bg-[#070a0f] border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Live Orchestrator Pipeline Output ({deploymentEngine.toUpperCase()})</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{deploymentProgress}%</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${deploymentProgress}%` }}
                  ></div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 text-slate-300 text-[11px] custom-scrollbar">
                  {deployLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: SERVICE & CLUSTER MANAGEMENT CONSOLE */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isFa ? 'کنسول مدیریت، پایش سرویس‌ها، خطایابی و تعمیرات کلاستر' : 'Service & Clustered Management Console'}
                </h3>
              </div>

              {/* Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveConsoleTab('native_systemd')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeConsoleTab === 'native_systemd' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {isFa ? 'سرویس‌های لینوکس (Systemd / Bare-Metal)' : 'Linux Systemd Services'}
                </button>
                <button
                  onClick={() => setActiveConsoleTab('k8s_pods')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeConsoleTab === 'k8s_pods' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {isFa ? 'پادهای کوبرنتیز (Pods)' : 'K8s Pods'}
                </button>
                <button
                  onClick={() => setActiveConsoleTab('docker_containers')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeConsoleTab === 'docker_containers' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {isFa ? 'کانتینرهای داکر' : 'Docker Containers'}
                </button>
                <button
                  onClick={() => setActiveConsoleTab('cluster_repairs')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeConsoleTab === 'cluster_repairs' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {isFa ? 'ابزارهای تعمیر و عیب‌یابی ۱-کلیک' : '1-Click Repairs'}
                </button>
              </div>
            </div>

            {/* TAB: Native Linux Systemd Services (For Bare-Metal / Non-Docker) */}
            {activeConsoleTab === 'native_systemd' && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{isFa ? 'وضعیت تمام دیمن‌های لینوکس Splunkd.service بر روی سرورها فعال و پایدار است.' : 'All native Linux Splunkd systemd daemons are active and operational.'}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Zero-Container Overhead
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assets.map(node => (
                    <div key={node.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-white block">{node.hostname}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{node.ip} • {node.site}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          active (running)
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-[#090d14] p-2.5 rounded-lg border border-slate-800/80">
                        <div className="text-slate-300 flex justify-between">
                          <span>Unit:</span>
                          <span className="text-emerald-300">Splunkd.service</span>
                        </div>
                        <div className="flex justify-between">
                          <span>User/Group:</span>
                          <span className="text-slate-200">splunk:splunk</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Directory:</span>
                          <span className="text-slate-200">/opt/splunk</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage (XFS):</span>
                          <span className="text-amber-300">{node.storageNVMeGB} GB NVMe (noatime)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Role:</span>
                          <span className="text-cyan-300 font-bold">{node.role.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Quick CLI Actions */}
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                        <button className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition text-center">
                          systemctl status
                        </button>
                        <button className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded border border-slate-700 transition text-center">
                          splunk restart
                        </button>
                        <button className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 transition text-center">
                          btool check
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: K8s Pods */}
            {activeConsoleTab === 'k8s_pods' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assets.map(node => (
                    <div key={node.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">pod/{node.hostname.split('.')[0]}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">Running</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                        <div>Ready: 1/1 • Restarts: 0</div>
                        <div>Node IP: {node.ip}</div>
                        <div>Role: {node.role}</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">PVC: {node.storageNVMeGB}Gi NVMe</span>
                        <button className="text-cyan-400 hover:text-cyan-300 font-bold">{isFa ? 'مشاهده لاگ پاد' : 'Logs'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Docker Containers */}
            {activeConsoleTab === 'docker_containers' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assets.map(node => (
                    <div key={node.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-sky-400">container/splunk-{node.role}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-500/30">Up 4 hours</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                        <div>Image: splunk/splunk:9.4.0</div>
                        <div>Host: {node.ip}</div>
                        <div>Ports: 9997:9997, 8089:8089</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">Vol: /opt/splunk/var</span>
                        <button className="text-sky-400 hover:text-sky-300 font-bold">docker logs</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: 1-Click Repairs */}
            {activeConsoleTab === 'cluster_repairs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-400">{isFa ? 'همگام‌سازی و بازتوزیع باکت‌های ایندکسر (Resync & Rebalance Buckets)' : 'Resync & Rebalance Buckets'}</h5>
                    <p className="text-[11px] text-slate-400 mt-1">{isFa ? 'ارسال دستور خودکار به Cluster Manager جهت توزیع یکنواخت باکت‌ها و حفظ RF=3.' : 'Triggers cluster bucket rebalancing'}</p>
                  </div>
                  <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition">
                    {isFa ? 'اجرای بازتوزیع باکت‌ها' : 'Trigger Rebalance'}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-sky-400">{isFa ? 'بازیابی و انتخاب مجدد کاپیتان Search Head (Raft Reselect)' : 'Raft Captain Resync'}</h5>
                    <p className="text-[11px] text-slate-400 mt-1">{isFa ? 'حل تعارض Quorum و تعیین مجدد کاپیتان پایدار در کلاستر سرچ‌هد.' : 'Resolves SHC captain split-brain'}</p>
                  </div>
                  <button className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold rounded-lg text-xs transition">
                    {isFa ? 'بازیابی کاپیتان SHC' : 'Recover SHC Captain'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}

    </div>
  );
};
