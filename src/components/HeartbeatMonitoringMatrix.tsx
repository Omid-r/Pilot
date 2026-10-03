import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Server, 
  ShieldAlert, 
  Flame, 
  ArrowUpRight, 
  ArrowRight,
  ArrowLeft,
  Cpu, 
  HardDrive, 
  Clock, 
  Play, 
  RotateCcw,
  Sparkles,
  Zap,
  Wrench,
  FileText,
  Network,
  Lock,
  Layers,
  Check,
  Terminal,
  HelpCircle,
  Eye,
  X,
  Sliders,
  Database,
  Search,
  Settings,
  Share2,
  Filter,
  CheckCheck
} from 'lucide-react';
import { HeartbeatNode, HeartbeatDropAlert, SplunkAgentComponentRole, NodePipelineIO } from '../types';
import { ROLE_REMEDIATION_WORKFLOWS, NodeRoleRemediationProfile } from '../data/roleRemediationWorkflows';

interface HeartbeatMonitoringMatrixProps {
  nodes: HeartbeatNode[];
  dropAlerts: HeartbeatDropAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onSimulateDisconnect: (nodeId: string) => void;
  onRecoverAllNodes: () => void;
  onOpenRemoteTerminal?: (node: HeartbeatNode) => void;
  lang?: 'fa' | 'en';
}

// Predefined IO Topology Metadata for each node
const NODE_IO_TOPOLOGIES: Record<string, NodePipelineIO> = {
  'node-uf-app-01': {
    inputs: [
      { id: 'in-1', name: 'Nginx Access & Error Logs', type: 'FILE_MONITOR', targetPathOrPort: '/var/log/nginx/*.log', eps: 850, status: 'ACTIVE_FLOW', detailsFa: 'فایل‌های لاگ وب‌سرور لینوکسی' },
      { id: 'in-2', name: 'OS Security & Audit Logs', type: 'FILE_MONITOR', targetPathOrPort: '/var/log/secure, /var/log/audit/audit.log', eps: 400, status: 'ACTIVE_FLOW', detailsFa: 'لاگ‌های احراز هویت لینوکس' },
      { id: 'in-3', name: 'Core Banking JSON Stream', type: 'TCP_LISTEN', targetPathOrPort: '127.0.0.1:5140 (TCP)', eps: 200, status: 'ACTIVE_FLOW', detailsFa: 'پورت لوکال تبادل لاگ اپلیکیشن' }
    ],
    outputs: [
      { id: 'out-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.2, queuePercent: 12 },
      { id: 'out-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.4, queuePercent: 12 }
    ]
  },
  'node-uf-win-01': {
    inputs: [
      { id: 'in-win-1', name: 'Windows Security Event Log', type: 'WIN_EVENT_LOG', targetPathOrPort: 'Wineventlog://Security (4624, 4625, 4688)', eps: 980, status: 'ACTIVE_FLOW', detailsFa: 'رویدادهای لاگین و امنیتی اکتیودایرکتوری' },
      { id: 'in-win-2', name: 'PowerShell Script Block Logging', type: 'WIN_EVENT_LOG', targetPathOrPort: 'Wineventlog://Microsoft-Windows-PowerShell/Operational', eps: 320, status: 'ACTIVE_FLOW', detailsFa: 'کشف اجرای اسکریپت‌های پاورشل' },
      { id: 'in-win-3', name: 'Sysmon Process & Network Events', type: 'WIN_EVENT_LOG', targetPathOrPort: 'Wineventlog://Microsoft-Windows-Sysmon/Operational', eps: 800, status: 'ACTIVE_FLOW', detailsFa: 'ایونت‌های دقیق پروسس و تریک‌های امنیتی' }
    ],
    outputs: [
      { id: 'out-win-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 2.1, queuePercent: 18 },
      { id: 'out-win-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 2.3, queuePercent: 18 }
    ]
  },
  'node-uf-db-02': {
    inputs: [
      { id: 'in-db-1', name: 'Oracle Audit XML Files', type: 'FILE_MONITOR', targetPathOrPort: '/u01/app/oracle/audit/*.xml', eps: 1890, status: 'ACTIVE_FLOW', detailsFa: 'لاگ‌های مانیتورینگ تراکنش دیتابیس اوراکل' },
      { id: 'in-db-2', name: 'Listener & Alert Logs', type: 'FILE_MONITOR', targetPathOrPort: '/u01/app/oracle/diag/tnslsnr/alert.log', eps: 1000, status: 'ACTIVE_FLOW', detailsFa: 'لاگ‌های شبکه و خطای پایگاه داده' }
    ],
    outputs: [
      { id: 'out-db-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.5, queuePercent: 24 },
      { id: 'out-db-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.6, queuePercent: 24 }
    ]
  },
  'node-uf-legacy-dc-03': {
    inputs: [
      { id: 'in-dc-1', name: 'Legacy DC EventLog Stream', type: 'WIN_EVENT_LOG', targetPathOrPort: 'Wineventlog://Security (Local Kerberos)', eps: 0, status: 'STALLED', detailsFa: 'لاگ‌های احراز هویت دامین کنترلر قدیمی' }
    ],
    outputs: [
      { id: 'out-dc-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'BLOCKED_TIMEOUT', latencyMs: 0, queuePercent: 100 }
    ]
  },
  'node-hf-gateway-01': {
    inputs: [
      { id: 'in-hf-1', name: 'DMZ Perimeter Splunk TCP', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:9997 (TLS 1.3)', eps: 4800, status: 'ACTIVE_FLOW', detailsFa: 'دریافت ترافیک رمزنگاری‌شده از UFهای مرزی' },
      { id: 'in-hf-2', name: 'WAF & API Gateway HEC', type: 'HEC_HTTP', targetPathOrPort: 'https://hf:8088/services/collector', eps: 3600, status: 'ACTIVE_FLOW', detailsFa: 'توکن اختصاصی فایروال وب و تراکنش‌های بانکی' }
    ],
    outputs: [
      { id: 'out-hf-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.9, queuePercent: 35 },
      { id: 'out-hf-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 2.0, queuePercent: 35 }
    ]
  },
  'node-syslog-sc4s-01': {
    inputs: [
      { id: 'in-sc4s-1', name: 'Core Switches & Routers (UDP)', type: 'UDP_SYSLOG', targetPathOrPort: '0.0.0.0:514 (UDP)', eps: 2900, status: 'ACTIVE_FLOW', detailsFa: 'جریان سیسلاگ استاندارد سوییچ‌های کر' },
      { id: 'in-sc4s-2', name: 'Palo Alto & Fortinet TLS Syslog', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:6514 (TLS 1.3)', eps: 2300, status: 'ACTIVE_FLOW', detailsFa: 'سیسلاگ رمزنگاری شده فایروال‌ها' }
    ],
    outputs: [
      { id: 'out-sc4s-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 8088, protocol: 'HEC_HTTP', status: 'CONNECTED', latencyMs: 1.1, queuePercent: 24 },
      { id: 'out-sc4s-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 8088, protocol: 'HEC_HTTP', status: 'CONNECTED', latencyMs: 1.2, queuePercent: 24 }
    ]
  },
  'node-idx-peer-01': {
    inputs: [
      { id: 'in-idx1-1', name: 'Splunk Ingestion Port 9997', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:9997 (TLS Encrypted)', eps: 6400, status: 'ACTIVE_FLOW', detailsFa: 'پورت دریافت اصلی لاگ از فورواردرها' },
      { id: 'in-idx1-2', name: 'REST & Cluster Sync', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:8089', eps: 200, status: 'ACTIVE_FLOW', detailsFa: 'مدیریت و رپلیکیشن کلاستر' }
    ],
    outputs: [
      { id: 'out-idx1-1', targetHost: 'idx-cluster-peer-02.corp.internal', port: 9887, protocol: 'INDEX_REPLICATION', status: 'CONNECTED', latencyMs: 0.8, queuePercent: 15 }
    ]
  },
  'node-idx-peer-02': {
    inputs: [
      { id: 'in-idx2-1', name: 'Splunk Ingestion Port 9997', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:9997 (TLS Encrypted)', eps: 6100, status: 'ACTIVE_FLOW', detailsFa: 'پورت دریافت اصلی لاگ از فورواردرها' }
    ],
    outputs: [
      { id: 'out-idx2-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9887, protocol: 'INDEX_REPLICATION', status: 'CONNECTED', latencyMs: 0.9, queuePercent: 14 }
    ]
  },
  'node-sh-captain': {
    inputs: [
      { id: 'in-sh-1', name: 'Splunk Web GUI Users', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:8000 (HTTPS)', eps: 450, status: 'ACTIVE_FLOW', detailsFa: 'درخواست‌های وب و داشبوردهای مانیتورینگ' },
      { id: 'in-sh-2', name: 'REST API & ES Alerts', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:8089', eps: 500, status: 'ACTIVE_FLOW', detailsFa: 'ارتباطات Enterprise Security و API' }
    ],
    outputs: [
      { id: 'out-sh-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 8089, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 0.8, queuePercent: 12 },
      { id: 'out-sh-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 8089, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 0.9, queuePercent: 12 }
    ]
  },
  'node-ds-01': {
    inputs: [
      { id: 'in-ds-1', name: 'Forwarder Phone-Home Heartbeats', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:8089 (mTLS)', eps: 620, status: 'ACTIVE_FLOW', detailsFa: 'ارتباطات دوره‌ای فورواردرها جهت دریافت کانفیگ' }
    ],
    outputs: [
      { id: 'out-ds-1', targetHost: '1,420 Active Forwarders', port: 8089, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 1.0, queuePercent: 12 }
    ]
  },
  'node-cm-01': {
    inputs: [
      { id: 'in-cm-1', name: 'Cluster Peers Master Sync', type: 'TCP_LISTEN', targetPathOrPort: '0.0.0.0:8089', eps: 480, status: 'ACTIVE_FLOW', detailsFa: 'پایش و هماهنگی وضعیت باکت‌های کلاستر ایندکسرها' }
    ],
    outputs: [
      { id: 'out-cm-1', targetHost: 'idx-cluster-peer-01.corp.internal', port: 8089, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 0.7, queuePercent: 10 },
      { id: 'out-cm-2', targetHost: 'idx-cluster-peer-02.corp.internal', port: 8089, protocol: 'SPLUNK_COOKED_TLS', status: 'CONNECTED', latencyMs: 0.7, queuePercent: 10 }
    ]
  }
};

export const HeartbeatMonitoringMatrix: React.FC<HeartbeatMonitoringMatrixProps> = ({
  nodes,
  dropAlerts,
  onAcknowledgeAlert,
  onSimulateDisconnect,
  onRecoverAllNodes,
  onOpenRemoteTerminal,
  lang = 'fa'
}) => {
  const isFa = lang === 'fa';
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'diagram_io'>('diagram_io');
  const [selectedNodeForDiagram, setSelectedNodeForDiagram] = useState<string>(nodes[0]?.id || 'node-uf-app-01');
  
  // Dedicated Role-Specific Remediation Modal State
  const [remediationModalNode, setRemediationModalNode] = useState<HeartbeatNode | null>(null);
  const [troubleshootStep, setTroubleshootStep] = useState<number>(1);
  const [isExecutingFix, setIsExecutingFix] = useState(false);
  const [remediationLogs, setRemediationLogs] = useState<string[]>([]);
  const [liveSecondCounter, setLiveSecondCounter] = useState(0);

  // Live heart pulse counter every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSecondCounter(prev => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredNodes = nodes.filter(n => {
    if (filterRole === 'all') return true;
    return n.componentRole === filterRole;
  });

  const activeDiagramNode = nodes.find(n => n.id === selectedNodeForDiagram) || nodes[0];
  const activeNodeIO = NODE_IO_TOPOLOGIES[activeDiagramNode?.id] || {
    inputs: [
      { id: 'def-in', name: 'Default Component Stream', type: 'FILE_MONITOR', targetPathOrPort: '/var/log/*.log', eps: activeDiagramNode?.eventsPerSec || 0, status: activeDiagramNode?.status === 'DISCONNECTED_SILENT' ? 'STALLED' : 'ACTIVE_FLOW', detailsFa: 'فایل‌های لاگ و جریان‌های محلی' }
    ],
    outputs: [
      { id: 'def-out', targetHost: 'idx-cluster-peer-01.corp.internal', port: 9997, protocol: 'SPLUNK_COOKED_TLS', status: activeDiagramNode?.status === 'DISCONNECTED_SILENT' ? 'BLOCKED_TIMEOUT' : 'CONNECTED', latencyMs: activeDiagramNode?.pingMs || 0, queuePercent: activeDiagramNode?.queueUtilizationPct || 0 }
    ]
  };

  const totalEPS = nodes.reduce((sum, n) => sum + (n.status !== 'DISCONNECTED_SILENT' ? n.eventsPerSec : 0), 0);
  const activeNodesCount = nodes.filter(n => n.status === 'ONLINE_ACTIVE').length;
  const criticalDropCount = nodes.filter(n => n.status === 'DISCONNECTED_SILENT').length;
  const warningDelayCount = nodes.filter(n => n.status === 'WARNING_DELAY' || n.status === 'DEGRADED_QUEUE').length;

  const getStatusBadge = (status: HeartbeatNode['status']) => {
    switch (status) {
      case 'ONLINE_ACTIVE':
        return {
          label: isFa ? 'آنلاین و فعال' : 'Online Active',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400 animate-ping'
        };
      case 'WARNING_DELAY':
        return {
          label: isFa ? 'تاخیر در ارسال (Lag)' : 'Delay / Lag',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400'
        };
      case 'DISCONNECTED_SILENT':
        return {
          label: isFa ? 'قطع لاگ / سکوت بحرانی' : 'Log Silent / Dropped',
          bg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
          dot: 'bg-rose-500 animate-bounce'
        };
      case 'DEGRADED_QUEUE':
        return {
          label: isFa ? 'سرریز صف بافر' : 'Queue Congested',
          bg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400'
        };
    }
  };

  const getRoleIcon = (role: SplunkAgentComponentRole) => {
    switch (role) {
      case 'universal_forwarder':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'heavy_forwarder':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'syslog_collector':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'indexer_node':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'search_head':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'deployment_server':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'cluster_master':
        return <Server className="w-4 h-4 text-emerald-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const openDedicatedRemediationSuite = (node: HeartbeatNode) => {
    const profile = ROLE_REMEDIATION_WORKFLOWS[node.componentRole] || ROLE_REMEDIATION_WORKFLOWS.universal_forwarder;
    setRemediationModalNode(node);
    setTroubleshootStep(1);
    setRemediationLogs([
      `[${profile.role.toUpperCase()} REMEDIATION AGENT INITIALIZED]`,
      `Target Host: ${node.hostname} (${node.ip})`,
      `Component Architecture: ${isFa ? profile.badgeLabelFa : profile.badgeLabelEn}`,
      `Current Ingestion Status: ${node.status}`,
      `Daemon Executable: ${profile.daemonPath}`,
      `Ready to execute targeted 5-step role-specific diagnostic and restoration procedure.`
    ]);
  };

  const handleExecuteRemediationStep = (stepNumber: number) => {
    if (!remediationModalNode) return;
    const profile = ROLE_REMEDIATION_WORKFLOWS[remediationModalNode.componentRole] || ROLE_REMEDIATION_WORKFLOWS.universal_forwarder;
    const currentStepConfig = profile.steps.find(s => s.step === stepNumber);

    setIsExecutingFix(true);
    setTimeout(() => {
      if (currentStepConfig) {
        setRemediationLogs(prev => [
          ...prev,
          `\n>>> [EXECUTING STEP ${stepNumber}: ${currentStepConfig.titleEn}]`,
          `$ ${currentStepConfig.commandSnippet}`,
          ...currentStepConfig.simulatedOutput
        ]);
      }

      if (stepNumber >= 5) {
        // Automatically restore and recover the node
        onRecoverAllNodes();
        setTroubleshootStep(6);
      } else {
        setTroubleshootStep(stepNumber + 1);
      }
      setIsExecutingFix(false);
    }, 700);
  };

  const activeRemediationProfile: NodeRoleRemediationProfile | null = remediationModalNode
    ? ROLE_REMEDIATION_WORKFLOWS[remediationModalNode.componentRole] || ROLE_REMEDIATION_WORKFLOWS.universal_forwarder
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Pipeline Stats - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-6 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isFa ? 'رادار لحظه‌ای هارت‌بیت، شمای دیاگرامی جریان داده و مرکز رفع عیب اختصاصی نودها' : 'Live Heartbeat Radar, Pipeline I/O & Universal Node Recovery'}
              </h2>
              <span className="sirene-badge text-[11px] font-mono px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1 ml-1"></span>
                Poll: 1s Active
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {isFa
                ? 'پایش مداوم جریان ارسال لاگ‌ها در کلیه کامپوننت‌های UF، HF، Syslog/SC4S، Indexerها، Search Headها و نودهای مدیریتی. همراه با روش‌های عیب‌یابی و رفع قطعی ۱۰۰٪ اختصاصی متناسب با معماری و وظیفه هر نود.'
                : 'Continuous sub-second ingestion monitoring with real-time node Input/Output topology diagram and dedicated 5-step remediation procedures tailored to each component role.'}
            </p>
          </div>

          {/* Action Toolbar - Sirene Capsule Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs relative z-10">
            {/* View Mode Switcher */}
            <div className="bg-[#07090e] p-1 rounded-full border border-white/[0.08] flex items-center gap-1 shadow-inner">
              <button
                onClick={() => setViewMode('diagram_io')}
                className={`px-3.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'diagram_io' ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isFa ? 'شمای ورودی/خروجی' : 'Node I/O'}</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'grid' ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{isFa ? 'ماتریس نودها' : 'Grid'}</span>
              </button>
            </div>

            {/* Quick Outage Simulations for Different Roles */}
            <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-full border border-white/[0.08] shadow-inner">
              <span className="text-[10px] text-slate-400 font-mono px-2">{isFa ? 'تست قطع:' : 'Sim:'}</span>
              <button
                onClick={() => onSimulateDisconnect('node-uf-app-01')}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="تست قطع عمدی Universal Forwarder"
              >
                <FileText className="w-3 h-3" />
                <span>UF</span>
              </button>
              <button
                onClick={() => onSimulateDisconnect('node-hf-gateway-01')}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="تست قطع عمدی Heavy Forwarder"
              >
                <Zap className="w-3 h-3" />
                <span>HF</span>
              </button>
              <button
                onClick={() => onSimulateDisconnect('node-syslog-sc4s-01')}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="تست قطع عمدی Syslog SC4S"
              >
                <Radio className="w-3 h-3" />
                <span>Syslog</span>
              </button>
              <button
                onClick={() => onSimulateDisconnect('node-idx-peer-01')}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="تست قطع عمدی Indexer Peer"
              >
                <Database className="w-3 h-3" />
                <span>IDX</span>
              </button>
              <button
                onClick={() => onSimulateDisconnect('node-sh-captain')}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="تست قطع عمدی Search Head"
              >
                <Search className="w-3 h-3" />
                <span>SH</span>
              </button>
            </div>

            <button
              onClick={onRecoverAllNodes}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'بازیابی سراسری استریم‌ها' : 'Restore All Streams'}</span>
            </button>
          </div>
        </div>

        {/* Global Pipeline Telemetry Metrics Grid - Sirene Dark Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-white/[0.06] relative z-10">
          <div className="bg-[#0c0f18] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">{isFa ? 'نرخ ورود لاگ (Total EPS):' : 'Aggregate EPS:'}</span>
              <span className="text-xl font-bold text-emerald-400">{totalEPS.toLocaleString()} <span className="text-xs text-slate-400 font-normal">eps</span></span>
            </div>
            <Flame className="w-6 h-6 text-emerald-400/40" />
          </div>

          <div className="bg-[#0c0f18] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">{isFa ? 'نودهای فعال و سالم:' : 'Online Active:'}</span>
              <span className="text-xl font-bold text-white">{activeNodesCount} / {nodes.length}</span>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400/40" />
          </div>

          <div className="bg-[#0c0f18] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">{isFa ? 'نودهای دچار قطعی (Drop):' : 'Dropped / Silent:'}</span>
              <span className={`text-xl font-bold ${criticalDropCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {criticalDropCount}
              </span>
            </div>
            <WifiOff className="w-6 h-6 text-rose-400/40" />
          </div>

          <div className="bg-[#0c0f18] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">{isFa ? 'نودهای با تاخیر یا بافر بالا:' : 'Warning Lag / Congested:'}</span>
              <span className="text-xl font-bold text-violet-300">{warningDelayCount}</span>
            </div>
            <Clock className="w-6 h-6 text-violet-400/40" />
          </div>
        </div>
      </div>

      {/* Critical Active Log Drop Alerts Feed */}
      {dropAlerts.filter(a => !a.isAcknowledged).length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              <span>{isFa ? 'هشدارهای فعال قطع لاگ و خاموشی سورس‌ها (Log Silence Alerts):' : 'Active Ingestion Drop Alerts:'}</span>
            </div>
            <span className="text-xs text-rose-300 font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
              {dropAlerts.filter(a => !a.isAcknowledged).length} {isFa ? 'رویداد بحرانی' : 'Active Events'}
            </span>
          </div>

          <div className="space-y-2">
            {dropAlerts.filter(a => !a.isAcknowledged).map((alert) => {
              const targetNode = nodes.find(n => n.id === alert.nodeId);
              const profile = targetNode ? (ROLE_REMEDIATION_WORKFLOWS[targetNode.componentRole] || ROLE_REMEDIATION_WORKFLOWS.universal_forwarder) : null;

              return (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-300 font-mono">{alert.hostname}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                        {alert.alertType}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{isFa ? alert.messageFa : alert.messageEn}</p>
                    <p className="text-[11px] text-amber-400/90">
                      💡 {isFa ? alert.recommendedActionFa : alert.recommendedActionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Dedicated Role-Specific Remediation Button */}
                    {targetNode && (
                      <button
                        onClick={() => openDedicatedRemediationSuite(targetNode)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isFa ? `رفع مشکل اختصاصی ${profile?.badgeLabelFa.split('(')[0]}` : `Fix ${profile?.badgeLabelEn}`}</span>
                      </button>
                    )}

                    {onOpenRemoteTerminal && targetNode && (
                      <button
                        onClick={() => onOpenRemoteTerminal(targetNode)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 flex items-center gap-1"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ترمینال ریموت' : 'Remote Terminal'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold text-xs border border-rose-700"
                    >
                      {isFa ? 'تایید و بستن' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: Interactive Node I/O Topology Diagram */}
      {viewMode === 'diagram_io' && (
        <div className="space-y-4">
          {/* Node Selector for Diagram */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">{isFa ? 'انتخاب نود جهت نمایش شمای دیاگرامی ورودی‌ها و خروجی‌ها:' : 'Select Node for I/O Diagram:'}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {nodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeForDiagram(n.id)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedNodeForDiagram === n.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${n.status === 'ONLINE_ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`}></span>
                  <span>{n.hostname.split('.')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual 3-Tier Pipeline Canvas */}
          <div className="p-6 rounded-2xl bg-[#070b11] border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  {getRoleIcon(activeDiagramNode.componentRole)}
                  <span className="text-cyan-400 font-mono">{activeDiagramNode.hostname}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {activeDiagramNode.componentRole.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${getStatusBadge(activeDiagramNode.status).bg}`}>
                    {getStatusBadge(activeDiagramNode.status).label}
                  </span>
                </h3>
              </div>

              {/* Universal Role-Specific Remediation Button in Diagram */}
              <button
                onClick={() => openDedicatedRemediationSuite(activeDiagramNode)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>
                  {isFa
                    ? `رفع عیب اختصاصی ${ROLE_REMEDIATION_WORKFLOWS[activeDiagramNode.componentRole]?.badgeLabelFa.split('(')[0] || 'نود'}`
                    : `Dedicated ${ROLE_REMEDIATION_WORKFLOWS[activeDiagramNode.componentRole]?.badgeLabelEn || 'Node'} Remediation`}
                </span>
              </button>
            </div>

            {/* 3 Columns Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Column 1: Inputs & Log Sources */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'ورودی‌ها و سورس‌های لاگ (Inputs)' : 'Incoming Log Sources'}</span>
                  </div>
                  <span className="font-mono text-emerald-400 text-[11px]">{activeNodeIO.inputs.length} Sources</span>
                </div>

                <div className="space-y-2.5">
                  {activeNodeIO.inputs.map(input => {
                    const isDisconn = activeDiagramNode.status === 'DISCONNECTED_SILENT';
                    return (
                      <div
                        key={input.id}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                          isDisconn
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{input.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 break-all">{input.targetPathOrPort}</div>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isDisconn ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {isDisconn ? 'STALLED' : `${input.eps} EPS`}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{input.detailsFa}</span>
                          <span className="font-mono text-cyan-400 font-semibold">{input.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Agent Node & Memory Buffers (Middle) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>{isFa ? 'موتور پردازش ایجنت و صف بافر' : 'Agent Forwarding Engine'}</span>
                  </div>
                  <span className="font-mono text-cyan-400 text-[11px]">{activeDiagramNode.ip}</span>
                </div>

                <div className={`p-4 rounded-xl border space-y-4 ${
                  activeDiagramNode.status === 'DISCONNECTED_SILENT'
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-900/95 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        activeDiagramNode.status === 'DISCONNECTED_SILENT' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                      }`}></div>
                      <span className="font-mono font-bold text-xs text-white">{activeDiagramNode.hostname}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Ping: {activeDiagramNode.pingMs}ms</span>
                  </div>

                  {/* Flow Animation Indicator */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1.5">
                    <div className="text-[11px] text-slate-400">{isFa ? 'نرخ عبور داده‌های زنده:' : 'Live Pipeline Throughput:'}</div>
                    <div className={`text-xl font-mono font-black ${
                      activeDiagramNode.status === 'DISCONNECTED_SILENT' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {activeDiagramNode.status === 'DISCONNECTED_SILENT' ? '0 EPS (HALTED)' : `${activeDiagramNode.eventsPerSec.toLocaleString()} EPS`}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Bandwidth: {activeDiagramNode.status === 'DISCONNECTED_SILENT' ? '0' : activeDiagramNode.bandwidthKbps} KB/s
                    </div>
                  </div>

                  {/* Queue Utilization Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{isFa ? 'اشغال صف حافظه (Queue Buffer):' : 'Queue Utilization:'}</span>
                      <span className={`font-mono font-bold ${activeDiagramNode.queueUtilizationPct > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {activeDiagramNode.queueUtilizationPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          activeDiagramNode.queueUtilizationPct > 80 ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${activeDiagramNode.queueUtilizationPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pipeline Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openDedicatedRemediationSuite(activeDiagramNode)}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{isFa ? 'رفع عیب و بازیابی اختصاصی' : 'Troubleshoot & Fix'}</span>
                    </button>
                    {onOpenRemoteTerminal && (
                      <button
                        onClick={() => onOpenRemoteTerminal(activeDiagramNode)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                        title="ترمینال ریموت"
                      >
                        <Terminal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 3: Outputs & Indexer Cluster Routing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>{isFa ? 'مقاصد ارسال لاگ (Outputs / Indexers)' : 'Ingestion Destinations'}</span>
                  </div>
                  <span className="font-mono text-cyan-400 text-[11px]">{activeNodeIO.outputs.length} Targets</span>
                </div>

                <div className="space-y-2.5">
                  {activeNodeIO.outputs.map(output => {
                    const isDisconn = activeDiagramNode.status === 'DISCONNECTED_SILENT' || output.status === 'BLOCKED_TIMEOUT';
                    return (
                      <div
                        key={output.id}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                          isDisconn
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-white font-mono">{output.targetHost}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Port: <span className="text-cyan-400">{output.port}</span> | Protocol: <span className="text-emerald-400">{output.protocol}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isDisconn ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {isDisconn ? 'DISCONNECTED' : 'CONNECTED'}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Latency: {isDisconn ? 'TIMEOUT' : `${output.latencyMs}ms`}</span>
                          <span>Queue: {output.queuePercent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Comprehensive Grid Matrix */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-400 px-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isFa ? 'فیلتر نقش نود:' : 'Filter Role:'}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isFa ? 'همه نودها' : 'All Roles'} ({nodes.length})
              </button>
              <button
                onClick={() => setFilterRole('universal_forwarder')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'universal_forwarder' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Universal Forwarders (UF)
              </button>
              <button
                onClick={() => setFilterRole('heavy_forwarder')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'heavy_forwarder' ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Heavy Forwarders (HF)
              </button>
              <button
                onClick={() => setFilterRole('syslog_collector')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'syslog_collector' ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Syslog Collectors
              </button>
              <button
                onClick={() => setFilterRole('indexer_node')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'indexer_node' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Indexers
              </button>
              <button
                onClick={() => setFilterRole('search_head')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'search_head' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Search Heads
              </button>
              <button
                onClick={() => setFilterRole('deployment_server')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'deployment_server' ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Deployment Server
              </button>
              <button
                onClick={() => setFilterRole('cluster_master')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'cluster_master' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cluster Master
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node) => {
              const badge = getStatusBadge(node.status);
              const profile = ROLE_REMEDIATION_WORKFLOWS[node.componentRole] || ROLE_REMEDIATION_WORKFLOWS.universal_forwarder;

              return (
                <div
                  key={node.id}
                  className={`p-5 rounded-2xl bg-slate-900 border transition-all duration-200 flex flex-col justify-between ${
                    node.status === 'DISCONNECTED_SILENT'
                      ? 'border-rose-500/60 shadow-lg shadow-rose-950/30'
                      : node.status === 'WARNING_DELAY'
                      ? 'border-amber-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(node.componentRole)}
                          <span className="font-bold text-white text-xs font-mono break-all">{node.hostname}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{node.ip}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {isFa ? profile.badgeLabelFa.split('(')[0] : profile.badgeLabelEn}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold font-mono flex items-center gap-1.5 shrink-0 ${badge.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[9px] block">{isFa ? 'آخرین ضربان:' : 'Last Beat:'}</span>
                        <span className="text-slate-300 font-bold">{node.secondsSinceLastBeat}s ago</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[9px] block">{isFa ? 'پینگ / تاخیر:' : 'Latency:'}</span>
                        <span className="text-cyan-400 font-bold">{node.pingMs} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[9px] block">{isFa ? 'جریان (EPS):' : 'EPS Flow:'}</span>
                        <span className={`font-bold ${node.eventsPerSec > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {node.eventsPerSec}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>{isFa ? 'دست‌تکانی SSL/TLS:' : 'TLS Handshake:'}</span>
                        <span className="font-mono font-bold text-emerald-400">{node.sslHandshakeStatus}</span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span>{isFa ? 'اشغال صف حافظه / بافر:' : 'Queue Utilization:'}</span>
                          <span className={`font-mono font-bold ${
                            node.queueUtilizationPct > 80 ? 'text-rose-400' : 'text-slate-300'
                          }`}>
                            {node.queueUtilizationPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              node.queueUtilizationPct > 80 ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${node.queueUtilizationPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remediation Action Buttons for Every Node Role */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openDedicatedRemediationSuite(node)}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>
                        {isFa
                          ? `رفع عیب اختصاصی ${profile.badgeLabelFa.split('(')[0]}`
                          : `Fix ${profile.badgeLabelEn.split(' ')[0]}`}
                      </span>
                    </button>
                    {onOpenRemoteTerminal && (
                      <button
                        onClick={() => onOpenRemoteTerminal(node)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center justify-center transition"
                        title={isFa ? 'ترمینال ریموت' : 'Remote Terminal'}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEDICATED ROLE-SPECIFIC REMEDIATION & DIAGNOSTIC MODAL FOR ALL SPLUNK COMPONENTS */}
      {remediationModalNode && activeRemediationProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090e15] border border-amber-500/50 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-[#0d1520] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  {getRoleIcon(remediationModalNode.componentRole)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">
                      {isFa
                        ? `سامانه رفع عیب و بازیابی اختصاصی ${activeRemediationProfile.badgeLabelFa}`
                        : `Dedicated Remediation Suite: ${activeRemediationProfile.badgeLabelEn}`}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {remediationModalNode.componentRole}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Target Host: <span className="text-slate-200">{remediationModalNode.hostname}</span> | IP: <span className="text-cyan-400">{remediationModalNode.ip}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRemediationModalNode(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Guided Steps & Diagnostic Terminal */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Architecture Context Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {isFa
                      ? `اصول معماری و وظایف عملیاتی ${activeRemediationProfile.badgeLabelFa}:`
                      : `Architecture & Role Principles: ${activeRemediationProfile.badgeLabelEn}`}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {isFa ? activeRemediationProfile.architectureSummaryFa : activeRemediationProfile.architectureSummaryEn}
                </p>

                {/* Common Outage Causes */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-semibold block mb-1">
                    {isFa ? 'علل رایج قطعی و سکوت لاگ در این نود:' : 'Common Root Causes of Log Silence for this Role:'}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {(isFa ? activeRemediationProfile.commonOutageCausesFa : activeRemediationProfile.commonOutageCausesEn).map((cause, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-200/90 font-mono">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{cause}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5-Step Role-Specific Guided Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {activeRemediationProfile.steps.map((s) => (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      troubleshootStep > s.step
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : troubleshootStep === s.step
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] font-mono mb-1">
                      {troubleshootStep > s.step ? '✓ ' + (isFa ? 'انجام شد' : 'Done') : (isFa ? `گام ${s.step}` : `Step ${s.step}`)}
                    </div>
                    <div className="text-xs font-semibold leading-snug">{isFa ? s.titleFa : s.titleEn}</div>
                  </div>
                ))}
              </div>

              {/* Live Remediation Diagnostic Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? `خروجی اجرای زنده عملیات عیب‌یابی ${activeRemediationProfile.badgeLabelFa.split('(')[0]}:` : 'Live Execution Terminal:'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Daemon: {activeRemediationProfile.daemonPath}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 min-h-[170px] max-h-[240px] overflow-y-auto whitespace-pre-wrap leading-relaxed dir-ltr">
                  {remediationLogs.join('\n')}
                  {isExecutingFix && (
                    <div className="flex items-center gap-2 text-cyan-300 mt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing step on {activeRemediationProfile.badgeLabelEn} daemon...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Current Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  {troubleshootStep < 6 ? (
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-300">
                        {isFa ? `آماده اجرای گام ${troubleshootStep} از ۵:` : `Ready for Step ${troubleshootStep} of 5:`}
                      </span>
                      <span className="text-slate-300 block text-[11px]">
                        {isFa
                          ? activeRemediationProfile.steps.find(s => s.step === troubleshootStep)?.shortDescFa
                          : activeRemediationProfile.steps.find(s => s.step === troubleshootStep)?.shortDescEn}
                      </span>
                    </div>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCheck className="w-5 h-5 text-emerald-400" />
                      <span>{isFa ? activeRemediationProfile.successMessageFa : activeRemediationProfile.successMessageEn}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {troubleshootStep <= 5 && (
                    <button
                      onClick={() => handleExecuteRemediationStep(troubleshootStep)}
                      disabled={isExecutingFix}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                    >
                      <Play className="w-4 h-4" />
                      <span>
                        {troubleshootStep === 5
                          ? (isFa ? 'اجرای ری‌استارت نهایی و بازیابی جریان لاگ' : 'Execute Final Restart & Resume Stream')
                          : (isFa ? `اجرای گام ${troubleshootStep}: ${activeRemediationProfile.steps.find(s => s.step === troubleshootStep)?.titleFa}` : `Execute Step ${troubleshootStep}`)}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setRemediationModalNode(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    {isFa ? 'بستن پنجره' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
