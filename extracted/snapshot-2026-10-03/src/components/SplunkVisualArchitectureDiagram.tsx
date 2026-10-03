import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Sliders, 
  FileText, 
  TrendingUp, 
  Clock, 
  Server, 
  Database, 
  Zap, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Radio, 
  Flame, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  BarChart3, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  RefreshCw,
  X,
  Play,
  Pause,
  Terminal,
  Share2,
  ExternalLink,
  PlusCircle,
  Activity,
  ArrowDownRight,
  Workflow
} from 'lucide-react';
import { TopologyDiagramNode } from '../types';
import { INITIAL_TOPOLOGY_NODES } from '../data/visualTopologyData';

interface SplunkVisualArchitectureDiagramProps {
  lang?: 'fa' | 'en';
}

export const SplunkVisualArchitectureDiagram: React.FC<SplunkVisualArchitectureDiagramProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';

  // Load Simulation Mode
  const [loadMode, setLoadMode] = useState<'NORMAL' | 'PEAK_SOC' | 'ES_HEAVY'>('PEAK_SOC');
  
  // Active Nodes State (allows dynamic simulation of provisioning ghost nodes)
  const [nodes, setNodes] = useState<TopologyDiagramNode[]>(INITIAL_TOPOLOGY_NODES);
  
  // Selected Node for Deep Inspector Drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sh-rec-03');
  
  // Filters & Toggles
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [showAnimation, setShowAnimation] = useState<boolean>(true);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Selected Node Object
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Handler to simulate provisioning a ghost recommended node into an active online node
  const handleSimulateProvisionNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          isRecommendedAddition: false,
          status: 'HEALTHY',
          name: n.name.replace(' (توصیه اکید معمار SVA)', '').replace('+1 ', ''),
          vCpuCurrent: n.vCpuRecommended || 24,
          cpuUsagePct: 35,
          ramGbCurrent: n.ramGbRecommended || 64,
          ramUsagePct: 40,
          iopsCurrent: n.iopsRequired || 1200,
          diskUsagePct: 30,
          skipRatePct: 0
        };
      }
      return n;
    }));
  };

  const handleResetTopology = () => {
    setNodes(INITIAL_TOPOLOGY_NODES);
    setSelectedNodeId('sh-rec-03');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Group Nodes by Tier
  const shNodes = nodes.filter(n => n.tier === 'SEARCH_HEAD');
  const idxNodes = nodes.filter(n => n.tier === 'INDEXER');
  const ingNodes = nodes.filter(n => n.tier === 'INGESTION');
  const mgmtNodes = nodes.filter(n => n.tier === 'MANAGEMENT');
  const storageNodes = nodes.filter(n => n.tier === 'STORAGE');

  // Calculate live health summary
  const activeSHCount = shNodes.filter(n => !n.isRecommendedAddition).length;
  const activeIDXCount = idxNodes.filter(n => !n.isRecommendedAddition).length;
  const hasGhostSH = shNodes.some(n => n.isRecommendedAddition);
  const hasGhostIDX = idxNodes.some(n => n.isRecommendedAddition);

  return (
    <div className="space-y-6">
      {/* Top Controller Bar - Sirene Dark Luxury */}
      <div className="sirene-card p-5 md:p-6 rounded-3xl relative overflow-hidden backdrop-blur-2xl bg-[#0b0e17]/85 border border-white/[0.08] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-80 h-36 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
              <Workflow className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isFa ? 'دایاگرام تعاملی معماری کلاستر و مانیتورینگ هوشمند نودها' : 'Interactive Cluster Topology & Node Inspector'}
            </h2>
            <span className="sirene-badge text-[11px] font-mono px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block mr-1 ml-1"></span>
              Live Interactive Canvas
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            {isFa 
              ? 'روی هر نود کلیک کنید تا مشخصات سخت‌افزاری، صف‌ها، وضعیت تلمتری و فایل‌های .conf را مشاهده کنید. نودهای هاشورخورده پیشنهاد معمار ارشد بر اساس فرمول‌های SVA هستند.' 
              : 'Click any node to inspect hardware telemetry, queues, and configuration files. Dashed cards represent SVA Architect recommendations.'}
          </p>
        </div>

        {/* Action Controls - Sirene Pill Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs relative z-10">
          {/* Load Simulation Mode Toggle */}
          <div className="flex items-center bg-[#07090e] p-1 rounded-full border border-white/[0.08] shadow-inner">
            <span className="text-[11px] text-slate-400 px-2.5 font-mono">{isFa ? 'شبیه‌سازی بار:' : 'Load Mode:'}</span>
            <button
              onClick={() => setLoadMode('NORMAL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                loadMode === 'NORMAL' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              150 GB
            </button>
            <button
              onClick={() => setLoadMode('PEAK_SOC')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                loadMode === 'PEAK_SOC' ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              350 GB (Peak)
            </button>
            <button
              onClick={() => setLoadMode('ES_HEAVY')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                loadMode === 'ES_HEAVY' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              600 GB (ES)
            </button>
          </div>

          {/* Animation Toggle */}
          <button
            onClick={() => setShowAnimation(!showAnimation)}
            className={`px-3.5 py-1.5 rounded-full border flex items-center gap-2 text-xs font-medium transition ${
              showAnimation 
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-[0_0_12px_rgba(124,58,237,0.25)]' 
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            {showAnimation ? <Pause className="w-3.5 h-3.5 text-violet-400" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isFa ? 'پویانمایی جریان داده' : 'Data Stream'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetTopology}
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] hover:border-white/20 transition shadow-sm"
            title={isFa ? 'بازنشانی وضعیت اولیه دایاگرام' : 'Reset Topology State'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Topology Diagram Canvas (Left 8 Cols) & Inspector Drawer (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT: TOPOLOGY DIAGRAM CANVAS ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* TIER 1: INGESTION & EDGE FORWARDERS */}
          <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {isFa ? 'لایه ۱: دریافت لاگ و ایجنت‌ها (Ingestion & Syslog Gateway Tier)' : 'Tier 1: Ingestion & Syslog Gateway'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">TCP 9997 | Syslog 514/6514 | HEC 8088</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                {loadMode === 'NORMAL' ? '14,000 EPS' : loadMode === 'PEAK_SOC' ? '27,000 EPS' : '45,000 EPS'}
              </span>
            </div>

            {/* Ingestion Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {ingNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-xs font-mono relative ${
                      isSelected
                        ? 'bg-[#131828] border-violet-500/80 shadow-[0_0_20px_rgba(124,58,237,0.3)] ring-1 ring-violet-500/60'
                        : 'bg-[#0c0f18]/90 border-white/[0.07] hover:border-violet-500/40 hover:bg-[#111624]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-bold text-white text-[12px] truncate">{node.name}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    </div>

                    <div className="text-[10px] text-slate-400 mb-2 truncate">{node.ip}</div>

                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Throughput:</span>
                        <span className="text-violet-300 font-bold">{node.throughput}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full"
                          style={{ width: `${node.cpuUsagePct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Stream Connector Down to Indexers */}
            {showAnimation && (
              <div className="flex justify-center items-center gap-8 py-1 text-purple-400">
                <div className="flex items-center gap-1.5 text-[10px] font-mono animate-bounce">
                  <span>↓</span>
                  <span>Dynamic Auto-LB (Port 9997 / HEC)</span>
                  <span>↓</span>
                </div>
              </div>
            )}
          </div>

          {/* TIER 2: INDEXING & REPLICATION CLUSTER (WITH RECOMMENDED GHOST NODE) */}
          <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isFa ? 'لایه ۲: کلاستر ایندکسرها (Indexing & Peer Cluster Tier)' : 'Tier 2: Indexer Peer Cluster'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                      RF=3 / SF=2
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeIDXCount} Active Peers {hasGhostIDX && <span className="text-rose-400">(+1 Node SVA Required)</span>}
                  </span>
                </div>
              </div>

              {/* Status Sizing Tag */}
              <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${
                hasGhostIDX 
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {hasGhostIDX ? '⚠️ Capacity Deficit (87.5% Load)' : '✓ Fully Sized & Balanced'}
              </span>
            </div>

            {/* Indexer Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {idxNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isGhost = node.isRecommendedAddition;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-xs font-mono relative flex flex-col justify-between ${
                      isGhost
                        ? 'bg-rose-950/20 border-dashed border-rose-500/70 shadow-md hover:bg-rose-950/30 hover:border-rose-400 ring-1 ring-rose-500/30'
                        : isSelected
                        ? 'bg-[#131828] border-violet-500/80 shadow-[0_0_20px_rgba(124,58,237,0.3)] ring-1 ring-violet-500/60'
                        : 'bg-[#0c0f18]/90 border-white/[0.07] hover:border-violet-500/40 hover:bg-[#111624]'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-bold text-[12px] truncate ${isGhost ? 'text-rose-300' : 'text-white'}`}>
                          {node.name}
                        </span>
                        {isGhost ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-slate-950 animate-pulse">
                            RECOMMENDED
                          </span>
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${node.status === 'CRITICAL' ? 'bg-rose-400' : 'bg-emerald-400'} animate-pulse shrink-0`}></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-2 truncate">{node.ip}</div>

                      {/* Ghost Node Callout if Recommended */}
                      {isGhost ? (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-200/90 leading-tight space-y-1 mb-2">
                          <p className="font-sans font-medium">{node.recommendationReasonFa}</p>
                          <div className="text-amber-300 font-bold">{node.recommendationMetric}</div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-[10px] mb-2">
                          {/* IOPS Bar */}
                          <div className="flex justify-between text-slate-400">
                            <span>IOPS:</span>
                            <span className="text-rose-400 font-bold">{node.iopsCurrent} / {node.iopsRequired} IOPS</span>
                          </div>
                          <div className="w-full bg-[#07090e] rounded-full h-1.5 overflow-hidden border border-white/[0.05]">
                            <div
                              className="bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 h-full"
                              style={{ width: `${((node.iopsCurrent || 450) / (node.iopsRequired || 1200)) * 100}%` }}
                            ></div>
                          </div>

                          {/* CPU & RAM */}
                          <div className="flex justify-between text-slate-400 pt-0.5">
                            <span>CPU: {node.cpuUsagePct}%</span>
                            <span>RAM: {node.ramGbCurrent}GB ({node.ramUsagePct}%)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isGhost && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateProvisionNode(node.id);
                        }}
                        className="mt-2 w-full py-2 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-400 hover:to-violet-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isFa ? 'شبیه‌سازی الحاق نود به کلاستر' : 'Provision Indexer 03'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Stream Connector Down to Search Heads */}
            {showAnimation && (
              <div className="flex justify-center items-center gap-8 py-1 text-emerald-400">
                <div className="flex items-center gap-1.5 text-[10px] font-mono animate-bounce">
                  <span>↓</span>
                  <span>Distributed Map-Reduce Search (Port 8089)</span>
                  <span>↓</span>
                </div>
              </div>
            )}
          </div>

          {/* TIER 3: SEARCH HEAD CLUSTER (WITH RECOMMENDED GHOST NODE) */}
          <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isFa ? 'لایه ۳: کلاستر سرچ‌هد (Search Head Cluster - SHC Tier)' : 'Tier 3: Search Head Cluster (SHC)'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                      Raft Consensus
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeSHCount} Active Members {hasGhostSH && <span className="text-amber-400">(+1 Node SVA Required for 3-node Quorum)</span>}
                  </span>
                </div>
              </div>

              {/* Status Sizing Tag */}
              <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${
                hasGhostSH 
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {hasGhostSH ? '⚠️ 5.2% Search Skip Rate' : '✓ 100% Search Concurrency Health'}
              </span>
            </div>

            {/* Search Head Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {shNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isGhost = node.isRecommendedAddition;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-xs font-mono relative flex flex-col justify-between ${
                      isGhost
                        ? 'bg-amber-950/20 border-dashed border-amber-500/70 shadow-md hover:bg-amber-950/30 hover:border-amber-400 ring-1 ring-amber-500/30'
                        : isSelected
                        ? 'bg-[#131828] border-violet-500/80 shadow-[0_0_20px_rgba(124,58,237,0.3)] ring-1 ring-violet-500/60'
                        : 'bg-[#0c0f18]/90 border-white/[0.07] hover:border-violet-500/40 hover:bg-[#111624]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-bold text-[12px] truncate ${isGhost ? 'text-amber-300' : 'text-white'}`}>
                          {node.name}
                        </span>
                        {isGhost ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                            RECOMMENDED
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0"></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-2 truncate">{node.ip}</div>

                      {/* Ghost Node Callout if Recommended */}
                      {isGhost ? (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-200/90 leading-tight space-y-1 mb-2">
                          <p className="font-sans font-medium">{node.recommendationReasonFa}</p>
                          <div className="text-cyan-300 font-bold">{node.recommendationMetric}</div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-[10px] mb-2">
                          {/* Search Concurrency Bar */}
                          <div className="flex justify-between text-slate-400">
                            <span>Concurrency:</span>
                            <span className="text-violet-300 font-bold">{node.activeSearches} / {node.maxSearches} Slots</span>
                          </div>
                          <div className="w-full bg-[#07090e] rounded-full h-1.5 overflow-hidden border border-white/[0.05]">
                            <div
                              className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full"
                              style={{ width: `${((node.activeSearches || 10) / (node.maxSearches || 19)) * 100}%` }}
                            ></div>
                          </div>

                          {/* Skip Rate */}
                          <div className="flex justify-between text-slate-400 pt-0.5">
                            <span>Skip Rate:</span>
                            <span className={`font-bold ${node.skipRatePct && node.skipRatePct > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {node.skipRatePct}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isGhost && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateProvisionNode(node.id);
                        }}
                        className="mt-2 w-full py-2 rounded-full bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isFa ? 'شبیه‌سازی الحاق نود به SHC' : 'Provision Search Head 03'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIER 4 & 5: MANAGEMENT NODES & STORAGE VOLUMES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Management Nodes Card */}
            <div className="sirene-card p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Server className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{isFa ? 'نودهای ارکستراسیون و مدیریت (Management Tier)' : 'Management & Orchestration'}</h4>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                {mgmtNodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-2xl cursor-pointer border transition ${
                      selectedNodeId === node.id 
                        ? 'bg-[#131828] border-violet-500/80 shadow-[0_0_15px_rgba(124,58,237,0.25)] ring-1 ring-violet-500/50' 
                        : 'bg-[#0c0f18]/90 border-white/[0.07] hover:border-violet-500/40 hover:bg-[#111624]'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-white truncate">{node.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{node.ip}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Volumes Card */}
            <div className="sirene-card p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{isFa ? 'ولوم‌ها و ذخیره‌ساز ابری (Storage Tiering)' : 'Storage Tiering & SmartStore'}</h4>
              </div>
              <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
                {storageNodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-2xl cursor-pointer border transition flex items-center justify-between ${
                      node.isRecommendedAddition
                        ? 'bg-violet-950/20 border-dashed border-violet-400/60 text-violet-300'
                        : selectedNodeId === node.id
                        ? 'bg-[#131828] border-violet-500/80 ring-1 ring-violet-500/50'
                        : 'bg-[#0c0f18]/90 border-white/[0.07] hover:border-violet-500/40 hover:bg-[#111624]'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-white truncate">{node.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{node.throughput}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                      {node.isRecommendedAddition ? 'Target S3' : `${node.storageTbCurrent} TB`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: DEEP INSPECTOR DRAWER ================= */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0b0e17]/90 backdrop-blur-2xl border border-white/[0.08] space-y-5 shadow-[0_16px_50px_rgba(0,0,0,0.6)] sticky top-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFa ? 'شناسنامه و بازرسی موشکافانه نود' : 'Node Deep Inspector'}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">{selectedNode.fqdn}</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold ${
              selectedNode.status === 'HEALTHY'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : selectedNode.status === 'RECOMMENDED_ADDITION'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {selectedNode.status}
            </span>
          </div>

          {/* Node Identity Card */}
          <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.06] space-y-2.5 text-xs shadow-inner">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">{isFa ? 'نام سرور:' : 'Host Name:'}</span>
              <span className="text-white font-bold">{selectedNode.name}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">{isFa ? 'آدرس IP و پورت‌ها:' : 'IP & Ports:'}</span>
              <span className="text-cyan-300 font-bold">{selectedNode.ip} ({selectedNode.ports.join(', ')})</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">{isFa ? 'نقش در کلاستر:' : 'Cluster Role:'}</span>
              <span className="text-violet-300 font-bold">{selectedNode.clusterRole || selectedNode.tier}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans pt-2 border-t border-white/[0.06] leading-relaxed">
              {isFa ? selectedNode.roleFa : selectedNode.roleEn}
            </p>
          </div>

          {/* SVA Recommendation Callout if Ghost Node */}
          {selectedNode.isRecommendedAddition && (
            <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 space-y-2.5 text-xs shadow-[0_0_20px_rgba(124,58,237,0.15)]">
              <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>{isFa ? 'تحلیل شکاف فرمول و منطق پیشنهاد معمار ارشد:' : 'SVA Math Gap & Architect Justification:'}</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans text-[11px]">
                {selectedNode.recommendationReasonFa}
              </p>
              <div className="p-2.5 rounded-xl bg-[#07090e] text-cyan-300 font-mono text-[10px] font-bold border border-white/[0.06]">
                {selectedNode.recommendationMetric}
              </div>
              <button
                onClick={() => handleSimulateProvisionNode(selectedNode.id)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:opacity-95 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isFa ? 'الحاق به کلاستر و به‌روزرسانی منابع' : 'Simulate Provisioning Node'}</span>
              </button>
            </div>
          )}

          {/* Hardware Telemetry & Sizing Matrix */}
          <div className="space-y-2.5 text-xs font-mono">
            <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
              {isFa ? 'منابع سخت‌افزاری (سنجیده شده در برابر SVA):' : 'Hardware Resources & SVA Target:'}
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#07090e] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">vCPU Cores:</span>
                <span className="text-white font-bold text-sm">{selectedNode.vCpuCurrent} <span className="text-slate-400 text-xs font-normal">/ {selectedNode.vCpuRecommended} Rec</span></span>
              </div>

              <div className="p-3 rounded-2xl bg-[#07090e] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">RAM Memory:</span>
                <span className="text-white font-bold text-sm">{selectedNode.ramGbCurrent}GB <span className="text-slate-400 text-xs font-normal">/ {selectedNode.ramGbRecommended}GB</span></span>
              </div>

              {selectedNode.iopsRequired && (
                <div className="p-3 rounded-2xl bg-[#07090e] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block">Disk IOPS:</span>
                  <span className={`font-bold text-sm ${selectedNode.iopsCurrent && selectedNode.iopsCurrent < selectedNode.iopsRequired ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedNode.iopsCurrent} / {selectedNode.iopsRequired}
                  </span>
                </div>
              )}

              {selectedNode.maxSearches && (
                <div className="p-3 rounded-2xl bg-[#07090e] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block">Search Slots:</span>
                  <span className="text-violet-300 font-bold text-sm">{selectedNode.activeSearches} / {selectedNode.maxSearches} Slots</span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Snippets */}
          {selectedNode.confSnippets && selectedNode.confSnippets.length > 0 && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                  {isFa ? 'فایل‌های پیکربندی مرتبط (.conf):' : 'Relevant Configuration (.conf):'}
                </h4>
              </div>

              {selectedNode.confSnippets.map((conf, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-violet-300 font-bold">{conf.fileName}</span>
                    <button
                      onClick={() => handleCopy(conf.snippet, `${selectedNode.id}-conf-${idx}`)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-cyan-300 text-[10px] flex items-center gap-1.5 transition border border-white/[0.08]"
                    >
                      {copiedSnippet === `${selectedNode.id}-conf-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet === `${selectedNode.id}-conf-${idx}` ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">{conf.descriptionFa}</p>
                  <pre className="p-2.5 rounded-xl bg-[#040508] font-mono text-[10px] text-slate-300 overflow-x-auto text-left border border-white/[0.04]" dir="ltr">
                    {conf.snippet}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Diagnostic & Provisioning CLI Commands */}
          {selectedNode.cliCommands && selectedNode.cliCommands.length > 0 && (
            <div className="space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                {isFa ? 'دستورات اجرایی و مانیتورینگ CLI:' : 'Diagnostic CLI Commands:'}
              </h4>

              {selectedNode.cliCommands.map((cli, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#07090e] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300 font-sans font-medium">{isFa ? cli.labelFa : cli.labelEn}</span>
                    <button
                      onClick={() => handleCopy(cli.cmd, `${selectedNode.id}-cli-${idx}`)}
                      className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
                      title={isFa ? 'کپی دستور' : 'Copy Command'}
                    >
                      {copiedSnippet === `${selectedNode.id}-cli-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <pre className="font-mono text-[10px] text-emerald-300 bg-[#040508] p-2 rounded-xl overflow-x-auto text-left border border-white/[0.04]" dir="ltr">
                    {cli.cmd}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
