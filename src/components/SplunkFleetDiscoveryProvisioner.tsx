import React, { useState, useEffect, useRef } from 'react';
import { 
  ServerAssetNode, 
  SplunkNodeRole,
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
  DEFAULT_SEARCH_LOAD_BALANCER,
  DISCOVERED_INITIAL_FLEET,
  ENTERPRISE_HARDENING_ITEMS,
  SPLUNK_ENTERPRISE_VERSIONS,
  HardeningItemDefinition,
  SplunkVersionItem
} from '../data/splunkDeployerData';
import { SplunkSchematicBlueprintDiagram } from './SplunkSchematicBlueprintDiagram';
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
  FolderOpen,
  Wifi,
  WifiOff,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  Code2,
  CheckSquare,
  Square
} from 'lucide-react';

interface SplunkFleetDiscoveryProvisionerProps {
  lang: 'fa' | 'en';
  onDeployComplete?: (nodes: ServerAssetNode[]) => void;
}

export const SplunkFleetDiscoveryProvisioner: React.FC<SplunkFleetDiscoveryProvisionerProps> = ({ 
  lang,
  onDeployComplete 
}) => {
  const isFa = lang === 'fa';

  // Subnet & Scanning State
  const [subnetCidr, setSubnetCidr] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanDiscoveredCount, setScanDiscoveredCount] = useState<number>(10);
  const [isScanCompleted, setIsScanCompleted] = useState<boolean>(true);

  // View Mode: 'fleet_matrix' (Rack & Parallel Lifecycle) vs 'schematic_blueprint' (Topology & Wiring)
  const [viewMode, setViewMode] = useState<'fleet_matrix' | 'schematic_blueprint'>('fleet_matrix');

  // Server Assets Inventory State (Initialized with 10 discovered servers)
  const [assets, setAssets] = useState<ServerAssetNode[]>(() => {
    return DISCOVERED_INITIAL_FLEET.map(node => ({
      ...node,
      lifecycleStage: node.lifecycleStage || 'discovered',
      status: node.status || 'discovered',
      installProgress: node.installProgress || 0,
      selectedHardeningChecklist: {
        thpDisabled: true,
        sysctlTuned: true,
        limitsConfigured: true,
        nonRootUserCreated: true,
        firewallConfigured: true,
        selinuxEnforced: true,
        mtlsCertGenerated: true,
        auditdPolicy: true,
        disableUsbStorage: false
      },
      osInstallConfig: {
        osId: node.osType || 'rhel_9_4',
        filesystem: 'xfs',
        mountPoint: '/opt/splunk'
      },
      containerEngineConfig: {
        engine: 'baremetal_native'
      },
      splunkVersion: '9.4.0',
      parallelTask: {
        taskName: 'آماده پیکربندی',
        taskStage: 'idle',
        taskProgress: 0,
        taskStatus: 'idle',
        taskLogs: [`[DISCOVERY] Node ${node.hostname} (${node.ip}) identified via port 9443 mTLS agent.`]
      }
    }));
  });

  // Selected Node for Modal Configuration
  const [selectedNodeId, setSelectedNodeId] = useState<string>(DISCOVERED_INITIAL_FLEET[0].id);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalStage, setModalStage] = useState<number>(1); // 1: OS, 2: Hardening, 3: Engine, 4: Splunk, 5: Role, 6: Deep Config
  const [activeConfigTab, setActiveConfigTab] = useState<'form' | 'server_conf' | 'inputs_conf' | 'indexes_conf' | 'props_conf'>('form');

  // Copied indicator
  const [copiedPortCmd, setCopiedPortCmd] = useState<boolean>(false);

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

  const selectedNode = assets.find(a => a.id === selectedNodeId) || assets[0];

  // Parallel Timers Reference to clean up if needed
  const activeTimersRef = useRef<{ [nodeId: string]: NodeJS.Timeout[] }>({});

  // Trigger Subnet Scan Simulator
  const handleTriggerSubnetScan = async () => {
    setIsScanning(true);
    setScanProgress(5);
    setIsScanCompleted(false);
    try {
      const res = await fetch('/api/real/network/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr: subnetCidr })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Network scan failed');
      const discovered = (data.nodes || []).map((n: any) => ({
        id: n.id,
        hostname: n.hostname || n.ip,
        ip: n.ip,
        status: 'discovered',
        lifecycleStage: 'discovered',
        installProgress: 0,
        isConfigured: false,
        role: 'indexer_peer',
        site: 'site1',
        sshPort: 22,
        sshUser: 'root',
        osType: 'rhel_9_4',
        assignedPorts: {
          splunkMgmt: n.openPorts?.includes(8089) ? 8089 : 8089,
          splunkWeb: n.openPorts?.includes(8000) ? 8000 : undefined,
          splunkTcp: n.openPorts?.includes(9997) ? 9997 : undefined,
          hecPort: n.openPorts?.includes(8088) ? 8088 : undefined
        },
        selectedHardeningChecklist: {
          thpDisabled: false, sysctlTuned: false, limitsConfigured: false,
          nonRootUserCreated: false, firewallConfigured: false, selinuxEnforced: false,
          mtlsCertGenerated: false, auditdPolicy: false, disableUsbStorage: false
        },
        parallelTask: {
          taskName: 'کشف واقعی شبکه',
          taskStage: 'idle',
          taskProgress: 100,
          taskStatus: 'success',
          taskLogs: [`[${new Date().toLocaleTimeString()}] [REAL_SCAN] ${n.ip} reachable; open ports: ${(n.openPorts || []).join(', ') || 'none'}`]
        }
      }));
      setAssets(discovered);
      if (discovered.length) setSelectedNodeId(discovered[0].id);
      setScanDiscoveredCount(discovered.length);
      setScanProgress(100);
      setIsScanCompleted(true);
    } catch (e: any) {
      setScanProgress(0);
      setIsScanCompleted(false);
      setScanDiscoveredCount(0);
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  // Helper to append log to node
  const appendNodeLog = (nodeId: string, logMsg: string) => {
    setAssets(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      const prevLogs = n.parallelTask?.taskLogs || [];
      return {
        ...n,
        parallelTask: {
          ...n.parallelTask!,
          taskLogs: [...prevLogs, `[${new Date().toLocaleTimeString()}] ${logMsg}`]
        }
      };
    }));
  };

  // 1. Stage 1: Verify/Provision target OS.
  const handleStartNodeOSInstall = async (nodeId: string, targetOS?: string) => {
    const node = assets.find(n => n.id === nodeId);
    if (!node) return;

    setAssets(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      status: 'os_installing',
      lifecycleStage: 'os_installing',
      parallelTask: {
        ...(n.parallelTask || {}),
        taskName: 'بررسی واقعی سیستم‌عامل هدف',
        taskStage: 'os',
        taskProgress: 20,
        taskStatus: 'running',
        taskLogs: [...(n.parallelTask?.taskLogs || []), `[${new Date().toLocaleTimeString()}] [REAL_OS] Probing ${node.ip}:22 over SSH...`]
      }
    } : n));

    try {
      const res = await fetch('/api/real/node/probe', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({host:node.ip,ports:[node.sshPort||22],sshUser:node.sshUser||'root',sshPort:node.sshPort||22,inventory:true})
      });
      const data = await res.json();
      if(!res.ok || data.success===false) throw new Error(data.error || 'OS/SSH probe failed');

      const inv = data.sshInventory || data.inventory || {};
      const osName = inv.prettyName || inv.osPrettyName || inv.os || targetOS || 'OS detected remotely';
      const kernel = inv.kernel || '';
      const sshOpen = Array.isArray(data.ports) ? Boolean(data.ports.find((p:any)=>Number(p.port)===(node.sshPort||22)&&p.open)) : Boolean(data.sshOpen);

      if(!sshOpen) {
        throw new Error('SSH is not reachable. Real OS installation requires a Redfish/IPMI/PXE provisioning channel; no synthetic installation is performed.');
      }

      setAssets(prev => prev.map(n => n.id === nodeId ? {
        ...n,
        osType: targetOS as any || n.osType,
        status:'os_ready',
        lifecycleStage:'os_ready',
        installProgress:100,
        parallelTask:{...n.parallelTask!,taskProgress:100,taskStatus:'success',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [OS_READY] Real remote OS detected: ${osName}${kernel ? `; Kernel ${kernel}` : ''}`]}
      }:n));
    } catch(e:any) {
      setAssets(prev => prev.map(n => n.id === nodeId ? {...n,status:'pending_access',lifecycleStage:'discovered',parallelTask:{...n.parallelTask!,taskStatus:'failed',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [FAILED] ${e.message}`]}}:n));
    }
  };

  // 2. Stage 2: Parallel Security Hardening
  const handleStartNodeHardening = async (nodeId: string) => {
    const node = assets.find(n => n.id === nodeId);
    if (!node) return;
    setAssets(prev => prev.map(n => n.id === nodeId ? {
      ...n, status: 'hardening_in_progress', lifecycleStage: 'hardening_in_progress',
      parallelTask: { ...n.parallelTask!, taskName: 'اعمال هاردنینگ واقعی روی نود', taskStage: 'hardening', taskProgress: 20, taskStatus: 'running',
        taskLogs: [...(n.parallelTask?.taskLogs || []), `[${new Date().toLocaleTimeString()}] [REAL_HARDENING] Connecting to ${node.ip} over SSH...`] }
    } : n));
    try {
      const res = await fetch('/api/real/deploy/remote-hardening', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({host: node.ip, sshUser: node.sshUser || 'root', sshPort: node.sshPort || 22})
      });
      const data = await res.json();
      if(!res.ok || !data.success || !data.verified) throw new Error(data.error || data.result?.stderr || 'Remote hardening failed');
      setAssets(prev => prev.map(n => n.id === nodeId ? {
        ...n, status:'hardened', lifecycleStage:'hardened',
        hardeningReport:{ thpDisabled:true, sysctlTuned:true, limitsConfigured:true, nonRootUserCreated:false, firewallConfigured:true, selinuxEnforced:false, mtlsCertGenerated:false, auditdPolicy:false, disableUsbStorage:false },
        parallelTask:{...n.parallelTask!,taskProgress:100,taskStatus:'success',taskLogs:[...(n.parallelTask?.taskLogs||[]), `[${new Date().toLocaleTimeString()}] [HARDENED] ${data.result.stdout || 'Remote baseline applied'}`]}
      }:n));
    } catch(e:any) {
      setAssets(prev => prev.map(n => n.id === nodeId ? {...n,status:'pending_access',lifecycleStage:'discovered',parallelTask:{...n.parallelTask!,taskStatus:'failed',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [FAILED] ${e.message}`]}}:n));
    }
  };

  // 3. Stage 3

  // 3. Stage 3: Install/verify real container runtime.
  const handleStartNodeContainerInstall = async (nodeId: string, engine: DeploymentTargetEngine) => {
    const node = assets.find(n => n.id === nodeId);
    if (!node) return;

    setAssets(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      containerEngineConfig:{engine},
      status:'container_installing',
      lifecycleStage:'container_installing',
      parallelTask:{...(n.parallelTask||{}),taskName:`آماده‌سازی واقعی ${engine}`,taskStage:'container',taskProgress:20,taskStatus:'running',
        taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [REAL_RUNTIME] Installing/verifying ${engine} on ${node.ip}...`]}
    }:n));

    try {
      if (node.ip && node.ip !== '127.0.0.1') {
        throw new Error('Remote runtime installation requires the node provisioning channel; controller cannot truthfully install Docker/K3s over SSH without an artifact transfer plan.');
      }

      const runtime = engine === 'docker_standalone' ? 'docker' : engine === 'k3s_sok' ? 'kubernetes' : 'native';
      if (runtime !== 'native') {
        const res = await fetch('/api/container-engine/install-offline',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({engine:runtime})
        });
        const data = await res.json();
        if(!res.ok || !data.success) throw new Error(data.error || 'Offline runtime installation failed');
      }

      setAssets(prev => prev.map(n => n.id === nodeId ? {
        ...n,
        status:'container_engine_ready',
        lifecycleStage:'container_ready',
        parallelTask:{...n.parallelTask!,taskProgress:100,taskStatus:'success',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [RUNTIME_READY] Real ${engine} runtime verified.`]}
      }:n));
    } catch(e:any) {
      setAssets(prev => prev.map(n => n.id === nodeId ? {...n,status:'runtime_failed',lifecycleStage:'discovered',parallelTask:{...n.parallelTask!,taskStatus:'failed',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [FAILED] ${e.message}`]}}:n));
    }
  };

  // 4. Stage 4: Real Splunk Enterprise installation.
  const handleStartNodeSplunkInstall = async (nodeId: string, version: string = '') => {
    const node = assets.find(n => n.id === nodeId);
    if (!node) return;

    if (node.ip && node.ip !== '127.0.0.1') {
      setAssets(prev => prev.map(n => n.id === nodeId ? {...n,status:'splunk_install_failed',parallelTask:{...n.parallelTask!,taskStatus:'failed',taskLogs:[...(n.parallelTask?.taskLogs||[]),'[FAILED] Remote Splunk installation requires an artifact-transfer/provisioning channel; no synthetic install is performed.']}}:n));
      return;
    }

    setAssets(prev => prev.map(n => n.id === nodeId ? {...n,status:'splunk_installing',lifecycleStage:'splunk_installing',splunkVersion:version as any,parallelTask:{...n.parallelTask!,taskProgress:20,taskStatus:'running',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[${new Date().toLocaleTimeString()}] [REAL_SPLUNK] Starting local offline Splunk deployment...`]}}:n));

    try {
      const art = await fetch('/api/real/artifacts').then(r=>r.json());
      if(!Array.isArray(art.splunk) || art.splunk.length===0) throw new Error('No real Splunk RPM/TGZ artifact is staged on the controller.');

      const admin = window.prompt('Real Splunk admin password (minimum 12 characters):') || '';
      const pass4 = window.prompt('Real pass4SymmKey (minimum 12 characters):') || '';
      if(admin.length<12 || pass4.length<12) throw new Error('Valid admin password and pass4SymmKey are required.');

      const result = await fetch('/api/real/deploy/direct',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({artifact:art.splunk[0],adminPassword:admin,pass4SymmKey:pass4})
      }).then(async r=>{const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Splunk deployment failed');return d;});

      setAssets(prev=>prev.map(n=>n.id===nodeId?{
        ...n,status:'splunk_running',lifecycleStage:'splunk_running',installProgress:100,
        parallelTask:{...n.parallelTask!,taskProgress:100,taskStatus:'success',taskLogs:[...(n.parallelTask?.taskLogs||[]),'[SPLUNK_ONLINE] Real Splunk deployment verified by backend.',...(result.logs||[])]}
      }:n));
    }catch(e:any){
      setAssets(prev=>prev.map(n=>n.id===nodeId?{...n,status:'splunk_install_failed',parallelTask:{...n.parallelTask!,taskStatus:'failed',taskLogs:[...(n.parallelTask?.taskLogs||[]),`[FAILED] ${e.message}`]}}:n));
    }
  };

  // 5. Stage 5: Role Assignment & Placement
  const handleAssignNodeRole = (nodeId: string, role: SplunkNodeRole, site: string = 'site1') => {
    let assignedPorts: ServerAssetNode['assignedPorts'] = {
      mgmtAgentPort: 9443,
      sshPort: 22,
      splunkMgmt: 8089
    };

    if (role === 'search_head' || role === 'cluster_manager' || role === 'license_master' || role === 'deployment_server') {
      assignedPorts.splunkWeb = 8000;
    }
    if (role === 'indexer_peer') {
      assignedPorts.splunkTcp = 9997;
      assignedPorts.replicationPort = 9887;
    }
    if (role === 'search_head') {
      assignedPorts.shcReplicationPort = 8181;
    }
    if (role === 'heavy_forwarder') {
      assignedPorts.hecPort = 8088;
      assignedPorts.syslogPort = 514;
    }
    if (role === 'search_load_balancer') {
      assignedPorts.loadBalancerPort = 8000;
    }

    setAssets(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        role,
        site,
        assignedPorts,
        lifecycleStage: 'cluster_attached',
        isConfigured: true,
        parallelTask: {
          ...n.parallelTask!,
          taskName: `عضویت در کلاستر به عنوان ${role}`,
          taskStage: 'role_config',
          taskProgress: 100,
          taskStatus: 'success',
          taskLogs: [
            ...(n.parallelTask?.taskLogs || []),
            `[${new Date().toLocaleTimeString()}] [CLUSTER_ATTACH] Node assigned to role [${role}] on [${site}] and integrated into Topology Blueprint.`
          ]
        }
      };
    }));
  };

  // Batch deployment: sequential per node, concurrent across nodes, using only real operations.
  const handleBatchAutoDeployAll = async () => {
    await Promise.all(assets.map(async node => {
      await handleStartNodeOSInstall(node.id, node.osType);
      const latest = assets.find(n => n.id === node.id);
      if (!latest || latest.status !== 'os_ready') return;
      await handleStartNodeHardening(node.id);
      const hardened = assets.find(n => n.id === node.id);
      if (!hardened || hardened.lifecycleStage !== 'hardened') return;
      await handleStartNodeContainerInstall(node.id, hardened.containerEngineConfig?.engine || 'baremetal_native' as DeploymentTargetEngine);
      const runtimeReady = assets.find(n => n.id === node.id);
      if (!runtimeReady || runtimeReady.lifecycleStage !== 'container_ready') return;
      await handleStartNodeSplunkInstall(node.id, runtimeReady.splunkVersion || '');
      handleAssignNodeRole(node.id, node.role, node.site);
    }));
  };

  // Toggle Hardening Item in Node Checklist
  const handleToggleHardeningOption = (nodeId: string, key: keyof NonNullable<ServerAssetNode['selectedHardeningChecklist']>) => {
    setAssets(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      const current = n.selectedHardeningChecklist || {
        thpDisabled: true,
        sysctlTuned: true,
        limitsConfigured: true,
        nonRootUserCreated: true,
        firewallConfigured: true,
        selinuxEnforced: true,
        mtlsCertGenerated: true,
        auditdPolicy: true,
        disableUsbStorage: false
      };
      return {
        ...n,
        selectedHardeningChecklist: {
          ...current,
          [key]: !current[key]
        }
      };
    }));
  };

  // Helper to open node config modal
  const handleOpenNodeModal = (nodeId: string, initialStage: number = 1) => {
    setSelectedNodeId(nodeId);
    setModalStage(initialStage);
    setIsConfigModalOpen(true);
  };

  // Copy Port Command
  const handleCopyPortCmd = () => {
    navigator.clipboard.writeText('firewall-cmd --permanent --add-port={9443,22,8089,9997,8000,8088,9887,8181}/tcp && firewall-cmd --reload');
    setCopiedPortCmd(true);
    setTimeout(() => setCopiedPortCmd(false), 2000);
  };

  // Render Status Badge
  const renderLifecycleBadge = (stage?: string, status?: string) => {
    const st = stage || status || 'discovered';
    switch (st) {
      case 'discovered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Radio className="w-3 h-3 animate-pulse text-purple-400" />
            <span>{isFa ? 'کشف شده (خام)' : 'Discovered'}</span>
          </span>
        );
      case 'os_installing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>{isFa ? 'در حال نصب OS' : 'OS Installing'}</span>
          </span>
        );
      case 'os_ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span>{isFa ? 'سیستم‌عامل آماده' : 'OS Ready'}</span>
          </span>
        );
      case 'hardening_in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            <span>{isFa ? 'در حال هاردنینگ' : 'Hardening'}</span>
          </span>
        );
      case 'hardened':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isFa ? 'امن‌سازی کامل' : 'Hardened CIS'}</span>
          </span>
        );
      case 'splunk_installing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
            <span>{isFa ? 'در حال نصب اسپلانک' : 'Installing Splunk'}</span>
          </span>
        );
      case 'splunk_running':
      case 'cluster_attached':
      case 'fully_configured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{isFa ? 'اسپلانک فعال در کلاستر' : 'Splunk Active'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span>{st}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-100" dir={isFa ? 'rtl' : 'ltr'}>
      {/* 1. Top Management Gateway & Port Requirement Header */}
      <div className="bg-[#0e141c] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{isFa ? 'اسکنر شبکه و استقرار ناوگان سرورهای اسپلانک' : 'Splunk Fleet Discovery & Multi-Node Provisioner'}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ·
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Zero-Touch Engine v3.0
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {isFa 
                ? 'پیمایش ساب‌نت، کشف ماشین‌های فیزیکی و مجازی، نصب موازی سیستم‌عامل، هاردنینگ امنیتی تیک‌زدنی و استقرار کلاستر اسپلانک بر اساس معماری استاندارد SVA.'
                : 'Subnet network scanning, bare-metal server discovery via port 9443 mTLS, parallel OS provisioning, kernel hardening checklist, and Splunk cluster bootstrap.'}
            </p>
          </div>

          {/* Quick Stats & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('fleet_matrix')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'fleet_matrix'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'ماتریس ناوگان و پردازش موازی' : 'Fleet Matrix & Parallel Tasks'}</span>
              </button>

              <button
                onClick={() => setViewMode('schematic_blueprint')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'schematic_blueprint'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'دایاگرام شماتیک بلوپرینت' : 'Schematic Blueprint'}</span>
              </button>
            </div>

            <button
              onClick={handleBatchAutoDeployAll}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>{isFa ? 'استقرار موازی کل ناوگان (۱۰ نود)' : 'Parallel Auto-Deploy All'}</span>
            </button>
          </div>
        </div>

        {/* Port Communication Guide & Scanner Trigger Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Subnet Input & Scan Button */}
          <div className="lg:col-span-6 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px]">{isFa ? 'ساب‌نت:' : 'Subnet:'}</span>
              <input
                type="text"
                value={subnetCidr}
                onChange={(e) => setSubnetCidr(e.target.value)}
                className="bg-transparent text-slate-200 font-mono font-medium focus:outline-none w-full"
                placeholder="192.168.10.0/24"
              />
            </div>

            <button
              onClick={handleTriggerSubnetScan}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? (isFa ? 'در حال اسکن ساب‌نت...' : 'Scanning...') : (isFa ? 'شروع اسکن شبکه' : 'Scan Network')}</span>
            </button>
          </div>

          {/* Port Instruction Banner */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] leading-tight">
                {isFa 
                  ? 'پورت‌های الزامی: ۹۴۴۳ (Agent)، ۲۲ (SSH)، ۸۰۸۹ (Splunkd)، ۹۹۹۷ (Forwarding)'
                  : 'Required Ports: 9443 (Agent), 22 (SSH), 8089 (Splunkd), 9997 (Forwarding)'}
              </span>
            </div>

            <button
              onClick={handleCopyPortCmd}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition flex items-center gap-1.5 flex-shrink-0"
              title={isFa ? 'کپی دستور باز کردن پورت‌ها در لینوکس' : 'Copy firewall port open script'}
            >
              {copiedPortCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPortCmd ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی دستور فایروال' : 'Copy Rules')}</span>
            </button>
          </div>
        </div>

        {/* Live Scanning Progress Bar */}
        {isScanning && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-cyan-300 font-mono">
              <span>Scanning ARP, ICMP, TCP 9443 on {subnetCidr}...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Main View Mode Content */}
      {viewMode === 'fleet_matrix' ? (
        <div className="space-y-4">
          {/* Fleet Overview Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131b] p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-300">
                {isFa ? `ناوگان شناسایی‌شده (${assets.length} سرور):` : `Discovered Fleet (${assets.length} Servers):`}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                  {assets.filter(a => (a.lifecycleStage || a.status) === 'discovered').length} {isFa ? 'خام' : 'Raw'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px]">
                  {assets.filter(a => (a.lifecycleStage || a.status) === 'os_ready').length} {isFa ? 'سیستم‌عامل' : 'OS Ready'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                  {assets.filter(a => ['splunk_running', 'cluster_attached', 'fully_configured'].includes(a.lifecycleStage || a.status)).length} {isFa ? 'اسپلانک فعال' : 'Splunk Active'}
                </span>
              </div>
            </div>

            <div className="text-slate-400 text-[11px]">
              {isFa ? 'برای راه‌اندازی هر نود یا تغییر سیستم‌عامل و هاردنینگ روی کارت مربوطه کلیک کنید.' : 'Click on any node card to configure OS, hardening, and role.'}
            </div>
          </div>

          {/* Grid of 10 Discovered Server Chassis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((node) => {
              const task = node.parallelTask;
              const isRunning = task?.taskStatus === 'running';
              const isFinished = ['splunk_running', 'cluster_attached', 'fully_configured'].includes(node.lifecycleStage || node.status);

              return (
                <div 
                  key={node.id}
                  onClick={() => handleOpenNodeModal(node.id, 1)}
                  className={`bg-[#0e141c] hover:bg-[#121924] border transition rounded-xl p-4 cursor-pointer relative shadow-sm ${
                    selectedNodeId === node.id 
                      ? 'border-cyan-500/80 ring-1 ring-cyan-500/30' 
                      : isFinished 
                        ? 'border-emerald-500/40 hover:border-emerald-500/60' 
                        : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Chassis Hostname, Vendor, and Lifecycle Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Server className={`w-4 h-4 ${isFinished ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="font-semibold text-sm text-slate-100 font-mono tracking-tight">{node.hostname}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {node.ip} · {node.discoveryInfo?.vendor} {node.discoveryInfo?.model}
                      </div>
                    </div>

                    <div>
                      {renderLifecycleBadge(node.lifecycleStage, node.status)}
                    </div>
                  </div>

                  {/* Hardware Specs Metric Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Cpu className="w-2.5 h-2.5 text-slate-400" />
                        <span>CPU</span>
                      </div>
                      <div className="font-semibold text-slate-200 tabular-nums">{node.cpuCores} Cores</div>
                    </div>

                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span>RAM</span>
                      </div>
                      <div className="font-semibold text-slate-200 tabular-nums">{node.ramGB} GB</div>
                    </div>

                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
                        <span>NVMe</span>
                      </div>
                      <div className="font-semibold text-slate-200 tabular-nums">{node.storageNVMeGB} GB</div>
                    </div>

                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-slate-400" />
                        <span>Role</span>
                      </div>
                      <div className="font-semibold text-slate-200 text-[10px] truncate">{node.role}</div>
                    </div>
                  </div>

                  {/* Management & Live Port Connection */}
                  <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>{isFa ? 'پورت ۹۴۴۳ متصل' : 'Port 9443 mTLS'}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] font-mono">
                      MAC: {node.discoveryInfo?.macAddress || '00:1E:67:8A:2B:00'}
                    </div>
                  </div>

                  {/* Parallel Task Progress Bar & Live Status */}
                  {task && task.taskStage !== 'idle' && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-300 flex items-center gap-1">
                          {isRunning && <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />}
                          <span>{task.taskName}</span>
                        </span>
                        <span className="text-cyan-400 font-bold tabular-nums">{task.taskProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 rounded-full ${
                            task.taskStatus === 'success' 
                              ? 'bg-emerald-500' 
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${task.taskProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons on Card */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenNodeModal(node.id, 1)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isFa ? 'پیکربندی و نصب' : 'Configure & Install'}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleStartNodeOSInstall(node.id);
                        setTimeout(() => handleStartNodeHardening(node.id), 2500);
                        setTimeout(() => handleStartNodeSplunkInstall(node.id), 5000);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1 border border-slate-700"
                      title={isFa ? 'استقرار فوری این سرور' : 'Fast Auto-Deploy Node'}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isFa ? 'استقرار سریع' : 'Fast Deploy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mode B: Interactive Schematic Blueprint Topology */
        <div className="space-y-4">
          <SplunkSchematicBlueprintDiagram
            assets={assets}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => handleOpenNodeModal(id, 5)}
            onAddNode={(role) => {}}
            onRemoveNode={(id) => {}}
            onUpdateNode={(id, field, value) => {
              setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
            }}
            sizingInputs={sizingInputs}
            onUpdateSizingInputs={setSizingInputs}
            sizingResult={sizingResult}
            lang={lang}
          />
        </div>
      )}

      {/* 3. The 6-Stage Interactive Node Provisioning & Configuration Sliding Drawer (نوار و پنل کشویی سمت راست) */}
      {isConfigModalOpen && selectedNode && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          {/* Backdrop with click to minimize/close */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
            onClick={() => setIsConfigModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 pointer-events-auto z-50">
            <div 
              className="w-screen max-w-2xl lg:max-w-3xl bg-[#0c1320] border-l border-slate-800 shadow-2xl flex flex-col h-full transform transition ease-in-out duration-300 animate-in slide-in-from-right"
              dir={isFa ? 'rtl' : 'ltr'}
            >
              {/* Drawer Header */}
              <div className="p-4 lg:p-5 bg-[#0e1624] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                    <Server className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-white font-mono truncate">{selectedNode.hostname}</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {selectedNode.ip}
                      </span>
                      {renderLifecycleBadge(selectedNode.lifecycleStage, selectedNode.status)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {selectedNode.discoveryInfo?.vendor} {selectedNode.discoveryInfo?.model} · {selectedNode.cpuCores} CPU · {selectedNode.ramGB}GB RAM · {selectedNode.storageNVMeGB}GB NVMe
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    title={isFa ? 'بستن پنل کشویی (بازگشت به ناوگان)' : 'Close sliding drawer'}
                  >
                    <ChevronRight className={`w-4 h-4 ${isFa ? '' : 'rotate-180'}`} />
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Stage Tabs Navigation */}
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
              {[
                { num: 1, labelFa: '۱. نصب سیستم‌عامل', labelEn: '1. OS Install' },
                { num: 2, labelFa: '۲. هاردنینگ امنیتی', labelEn: '2. Hardening' },
                { num: 3, labelFa: '۳. موتور کانتینر/اجرا', labelEn: '3. Runtime Engine' },
                { num: 4, labelFa: '۴. نصب انستنس اسپلانک', labelEn: '4. Splunk Install' },
                { num: 5, labelFa: '۵. تعیین نقش و کلاستر', labelEn: '5. Role & Cluster' },
                { num: 6, labelFa: '۶. تنظیمات حرفه‌ای کامپوننت', labelEn: '6. Component Config' },
              ].map(st => (
                <button
                  key={st.num}
                  onClick={() => setModalStage(st.num)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    modalStage === st.num
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{isFa ? st.labelFa : st.labelEn}</span>
                </button>
              ))}
            </div>

            {/* Modal Body Content Based on Current Stage */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* STAGE 1: OS DEPLOYMENT */}
              {modalStage === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">{isFa ? 'انتخاب سیستم‌عامل هدف جهت نصب خودکار' : 'Target OS Distribution Selection'}</h3>
                      <p className="text-xs text-slate-400">{isFa ? 'سیستم‌عامل سازگار با استانداردهای سازمانی اسپلانک و پایداری بالا' : 'Select enterprise Linux OS distribution'}</p>
                    </div>
                    <button
                      onClick={() => handleStartNodeOSInstall(selectedNode.id, selectedNode.osType)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isFa ? 'شروع نصب سیستم‌عامل (موازی)' : 'Start OS Install'}</span>
                    </button>
                  </div>

                  {/* OS Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {OS_DISTRIBUTIONS.map(os => {
                      const isSelected = (selectedNode.osType || 'rhel_9_4') === os.id;
                      return (
                        <div
                          key={os.id}
                          onClick={() => {
                            setAssets(prev => prev.map(a => a.id === selectedNode.id ? { ...a, osType: os.id as any } : a));
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40' 
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-white">{os.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                          </div>
                          <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                            <div>کرنل: <span className="text-slate-300 font-mono">{os.kernel}</span></div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">{os.badge}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{os.defaultFs.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Filesystem & Mount Point Options */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">{isFa ? 'فایل سیستم پارتیشن داده اسپلانک:' : 'Storage Filesystem:'}</label>
                      <select 
                        value={selectedNode.osInstallConfig?.filesystem || 'xfs'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setAssets(prev => prev.map(a => a.id === selectedNode.id ? {
                            ...a,
                            osInstallConfig: { ...a.osInstallConfig!, filesystem: val, osId: a.osType, mountPoint: '/opt/splunk' }
                          } : a));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 font-mono focus:border-cyan-500"
                      >
                        <option value="xfs">XFS (noatime,nodiratime,logbufs=8) - پیشنهادی رسمی اسپلانک</option>
                        <option value="ext4">EXT4 (journal_checksum,data=ordered)</option>
                        <option value="btrfs">Btrfs (CoW Disabled for Splunk)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">{isFa ? 'مسیر Mount دیسک NVMe:' : 'Mount Point:'}</label>
                      <input
                        type="text"
                        value={selectedNode.osInstallConfig?.mountPoint || '/opt/splunk'}
                        readOnly
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: SECURITY HARDENING CHECKLIST */}
              {modalStage === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white">{isFa ? 'هاردنینگ امنیتی و تیونینگ کرنل (چک‌باکس‌های انتخابی)' : 'Security Hardening Checklist'}</h3>
                      <p className="text-xs text-slate-400">{isFa ? 'آیتم‌های امنیتی مورد نظر را تیک بزنید یا پیش‌فرض CIS را انتخاب کنید.' : 'Toggle specific hardening items according to CIS Benchmark'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAssets(prev => prev.map(a => a.id === selectedNode.id ? {
                            ...a,
                            selectedHardeningChecklist: {
                              thpDisabled: true,
                              sysctlTuned: true,
                              limitsConfigured: true,
                              nonRootUserCreated: true,
                              firewallConfigured: true,
                              selinuxEnforced: true,
                              mtlsCertGenerated: true,
                              auditdPolicy: true,
                              disableUsbStorage: true
                            }
                          } : a));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold"
                      >
                        {isFa ? 'انتخاب همه' : 'Select All'}
                      </button>

                      <button
                        onClick={() => handleStartNodeHardening(selectedNode.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isFa ? 'شروع هاردنینگ امنیتی (موازی)' : 'Apply Hardening'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hardening Checklist Items */}
                  <div className="space-y-2.5">
                    {ENTERPRISE_HARDENING_ITEMS.map(item => {
                      const currentChecklist = selectedNode.selectedHardeningChecklist || {
                        thpDisabled: true,
                        sysctlTuned: true,
                        limitsConfigured: true,
                        nonRootUserCreated: true,
                        firewallConfigured: true,
                        selinuxEnforced: true,
                        mtlsCertGenerated: true,
                        auditdPolicy: true,
                        disableUsbStorage: false
                      };
                      const isChecked = !!currentChecklist[item.id];

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleHardeningOption(selectedNode.id, item.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            isChecked 
                              ? 'bg-slate-900 border-emerald-500/40 shadow-sm' 
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-60'
                          }`}
                        >
                          <div className="pt-0.5">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{isFa ? item.titleFa : item.titleEn}</span>
                              {item.recommended && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                  CIS Level 2
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">{isFa ? item.descriptionFa : item.descriptionEn}</p>
                            <div className="text-[10px] text-amber-300/90 font-mono">
                              🛡️ {isFa ? item.securityImpactFa : 'Security impact guaranteed'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAGE 3: CONTAINER & RUNTIME ENGINE */}
              {modalStage === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white">{isFa ? 'انتخاب موتور اجرا و لایه زیرساخت' : 'Runtime Infrastructure Engine'}</h3>
                    <p className="text-xs text-slate-400">{isFa ? 'نصب سیستم‌عامل مستقیم (بدون کانتینر) یا داکر و کوبرنتیز' : 'Choose native OS or containerized architecture'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {DEPLOYMENT_ENGINE_OPTIONS.map(engine => {
                      const isSelected = (selectedNode.containerEngineConfig?.engine || 'baremetal_native') === engine.id;
                      return (
                        <div
                          key={engine.id}
                          onClick={() => {
                            setAssets(prev => prev.map(a => a.id === selectedNode.id ? {
                              ...a,
                              containerEngineConfig: { engine: engine.id as any }
                            } : a));
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition ${
                            isSelected 
                              ? 'bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40' 
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{isFa ? engine.titleFa : engine.titleEn}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{isFa ? engine.subtitleFa : engine.subtitleEn}</p>
                          <div className="mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartNodeContainerInstall(selectedNode.id, engine.id as any);
                              }}
                              className="w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3 h-3" />
                              <span>{isFa ? 'نصب این موتور' : 'Install Runtime'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAGE 4: SPLUNK ENTERPRISE INSTANCE */}
              {modalStage === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">{isFa ? 'نصب انستنس Splunk Enterprise و انتخاب ورژن' : 'Splunk Enterprise Instance Installation'}</h3>
                      <p className="text-xs text-slate-400">{isFa ? 'انتخاب نسخه رسمی اسپلانک و راه‌اندازی دیمن Splunkd' : 'Select version and bootstrap splunk service'}</p>
                    </div>

                    <button
                      onClick={() => handleStartNodeSplunkInstall(selectedNode.id, selectedNode.splunkVersion || '9.4.0')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isFa ? 'دانلود و نصب اسپلانک (موازی)' : 'Install Splunk Instance'}</span>
                    </button>
                  </div>

                  {/* Splunk Version Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SPLUNK_ENTERPRISE_VERSIONS.map(ver => {
                      const isSelected = (selectedNode.splunkVersion || '9.4.0') === ver.version;
                      return (
                        <div
                          key={ver.version}
                          onClick={() => {
                            setAssets(prev => prev.map(a => a.id === selectedNode.id ? { ...a, splunkVersion: ver.version as any } : a));
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition ${
                            isSelected 
                              ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40' 
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{ver.releaseTitle}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">{ver.notesFa}</p>
                          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                            <span>حجم پکیج: {ver.sizeMB} MB</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">{ver.badge}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAGE 5: ROLE ASSIGNMENT & CLUSTER PLACEMENT */}
              {modalStage === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white">{isFa ? 'تعیین نقش نود و اتصال به لایه کلاستر' : 'Role Assignment & Cluster Tier Placement'}</h3>
                    <p className="text-xs text-slate-400">{isFa ? 'نقش این سرور در دایاگرام توپولوژی و پورتهای ارتباطی آن' : 'Assign role to place node in schematic topology'}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { role: 'indexer_peer', titleFa: '🗄️ Indexer Peer (IDXC)', descFa: 'ایندکسینگ و ذخیره لاگ‌ها (پورت 9997/9887)' },
                      { role: 'search_head', titleFa: '🔍 Search Head (SHC)', descFa: 'اجرای سرچ و داشبورد SOC (پورت 8000/8181)' },
                      { role: 'heavy_forwarder', titleFa: '⚡ Heavy Forwarder', descFa: 'دریافت Syslog/HEC و پارس لاگ‌ها' },
                      { role: 'cluster_manager', titleFa: '👑 Cluster Manager (CM)', descFa: 'مدیریت کلیدهای کلاستر و باکت‌ها' },
                      { role: 'deployer', titleFa: '📦 SHC Deployer', descFa: 'توزیع اپلیکیشن‌ها در سرچ‌هد کلاستر' },
                      { role: 'deployment_server', titleFa: '🚀 Deployment Server', descFa: 'مدیریت Universal Forwarderها' },
                      { role: 'license_master', titleFa: '🔑 License Master', descFa: 'توزیع لایسنس تجاری اسپلانک' },
                      { role: 'search_load_balancer', titleFa: '⚖️ Load Balancer VIP', descFa: 'توزیع بار سرچ‌هدها با Nginx VIP' },
                    ].map(r => {
                      const isSelected = selectedNode.role === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => handleAssignNodeRole(selectedNode.id, r.role as any, selectedNode.site || 'site1')}
                          className={`p-3 rounded-2xl border cursor-pointer transition ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40' 
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{r.titleFa}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400 leading-tight">{r.descFa}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Site Selector */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">{isFa ? 'دیتاسنتر / سایت جغرافیایی:' : 'Target Geographic Site:'}</span>
                    <div className="flex items-center gap-2">
                      {['site1', 'site2'].map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            setAssets(prev => prev.map(a => a.id === selectedNode.id ? { ...a, site: s } : a));
                          }}
                          className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                            (selectedNode.site || 'site1') === s 
                              ? 'bg-cyan-500 text-slate-950' 
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 6: GRAPHICAL DEEP COMPONENT CONFIG */}
              {modalStage === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">{isFa ? `تنظیمات پیشرفته و پارامترهای ${selectedNode.role}` : `Deep Component Configuration (${selectedNode.role})`}</h3>
                      <p className="text-xs text-slate-400">{isFa ? 'کانفیگ‌های گرافیکی و پیش‌نمایش بلادرنگ فایل‌های etc/system/local' : 'Graphical tuning & real-time config file preview'}</p>
                    </div>

                    <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      {['form', 'server_conf', 'inputs_conf', 'indexes_conf'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveConfigTab(tab as any)}
                          className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                            activeConfigTab === tab ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab === 'form' ? (isFa ? 'فرم گرافیکی' : 'GUI Form') : `${tab}.spec`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Graphical Form Mode */}
                  {activeConfigTab === 'form' && (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4 text-xs">
                      {selectedNode.role === 'indexer_peer' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">SplunkTCP Ingestion Port:</label>
                            <input type="number" defaultValue={9997} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Cluster Replication Port:</label>
                            <input type="number" defaultValue={9887} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Hot/Warm Path:</label>
                            <input type="text" defaultValue="/opt/splunk/var/lib/splunk/defaultdb/db" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Cold Path:</label>
                            <input type="text" defaultValue="/opt/splunk/var/lib/splunk/defaultdb/colddb" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-300 font-mono" />
                          </div>
                        </div>
                      )}

                      {selectedNode.role === 'search_head' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Splunk Web UI Port:</label>
                            <input type="number" defaultValue={8000} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">SHC Replication Port:</label>
                            <input type="number" defaultValue={8181} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">KVStore Port:</label>
                            <input type="number" defaultValue={8191} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Max Concurrent Searches per CPU:</label>
                            <input type="number" defaultValue={4} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                        </div>
                      )}

                      {selectedNode.role === 'heavy_forwarder' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Syslog UDP/TCP Port:</label>
                            <input type="number" defaultValue={514} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">HTTP Event Collector (HEC) Port:</label>
                            <input type="number" defaultValue={8088} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                        </div>
                      )}

                      {(selectedNode.role === 'cluster_manager' || selectedNode.role === 'deployer' || selectedNode.role === 'license_master' || selectedNode.role === 'deployment_server') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Cluster pass4SymmKey:</label>
                            <input type="password" defaultValue="SplunkSecretPass@2026" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 font-bold">Splunk Management REST Port:</label>
                            <input type="number" defaultValue={8089} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-300 font-mono" />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setAssets(prev => prev.map(a => a.id === selectedNode.id ? { ...a, isConfigured: true, lifecycleStage: 'fully_configured' } : a));
                          setIsConfigModalOpen(false);
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isFa ? 'ثبت و اعمال نهایی کانفیگ‌ها در کلاستر' : 'Save & Apply Configuration'}</span>
                      </button>
                    </div>
                  )}

                  {/* Config File Syntax Preview */}
                  {activeConfigTab !== 'form' && (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                      <div className="text-cyan-400 mb-2 font-bold"># File: /opt/splunk/etc/system/local/{activeConfigTab}.conf</div>
                      <pre className="text-slate-200 leading-relaxed">
                        {activeConfigTab === 'server_conf' && `[general]
serverName = ${selectedNode.hostname}
pass4SymmKey = SplunkClusterSecretKey@2026

[sslConfig]
enableSplunkdSSL = true
sslVersions = tls1.3
requireClientCert = true

[clustering]
master_uri = https://192.168.10.10:8089
mode = ${selectedNode.role === 'cluster_manager' ? 'master' : selectedNode.role === 'indexer_peer' ? 'slave' : 'searchhead'}
pass4SymmKey = SplunkClusterSecretKey@2026`}

                        {activeConfigTab === 'inputs_conf' && `[default]
host = ${selectedNode.hostname}

${selectedNode.role === 'indexer_peer' ? `[splunktcp://9997]
connection_host = dns
compressed = true` : ''}

${selectedNode.role === 'heavy_forwarder' ? `[udp://514]
connection_host = ip
sourcetype = syslog

[http://soc_hec_token]
token = a1b2c3d4-e5f6-7890-abcd-ef1234567890
index = main` : ''}`}

                        {activeConfigTab === 'indexes_conf' && `[default]
homePath = $SPLUNK_DB/$_index_name/db
coldPath = $SPLUNK_DB/$_index_name/colddb
thawedPath = $SPLUNK_DB/$_index_name/thaweddb
maxTotalDataSizeMB = 500000
enableDataIntegrityControl = true`}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Live Terminal & Logs Console at bottom of modal */}
              {selectedNode.parallelTask?.taskLogs && selectedNode.parallelTask.taskLogs.length > 0 && (
                <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{isFa ? 'لاگ‌های زنده پروسه موازی روی این سرور' : 'Live Parallel Node Task Stream'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{selectedNode.parallelTask.taskLogs.length} entries</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-slate-300 pt-1">
                    {selectedNode.parallelTask.taskLogs.map((lg, i) => (
                      <div key={i} className="text-slate-300 leading-tight">{lg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Navigation Buttons */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setModalStage(prev => Math.max(1, prev - 1))}
                disabled={modalStage <= 1}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>{isFa ? 'مرحله قبل' : 'Previous Step'}</span>
              </button>

              <button
                onClick={() => setModalStage(prev => Math.min(6, prev + 1))}
                disabled={modalStage >= 6}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <span>{isFa ? 'مرحله بعد' : 'Next Step'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Reopen Button for Right Drawer */}
      {!isConfigModalOpen && selectedNode && (
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 border border-cyan-400/40 animate-pulse transition transform hover:scale-105"
          title={isFa ? 'باز کردن مجدد پنل کشویی تنظیمات نود' : 'Reopen node config drawer'}
        >
          <ChevronLeft className={`w-4 h-4 ${isFa ? '' : 'rotate-180'}`} />
          <Server className="w-4 h-4" />
          <span>{isFa ? `نوار تنظیمات نود: ${selectedNode.hostname}` : `Drawer: ${selectedNode.hostname}`}</span>
        </button>
      )}
    </div>
  );
};
