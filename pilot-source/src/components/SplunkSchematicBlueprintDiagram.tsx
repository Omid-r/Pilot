import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ServerAssetNode, 
  SplunkNodeRole,
  SizingLOMInputs, 
  CalculatedSizingResult, 
  SocAnalyst, 
  SearchLoadBalancerConfig,
  StorageBucketLifecycle,
  LicenseCostEstimation,
  DEFAULT_SOC_ANALYSTS,
  DEFAULT_SEARCH_LOAD_BALANCER,
  SPLUNK_PORT_DEFINITIONS,
  SPLUNK_DEPLOYMENT_SEQUENCE,
  calculateSplunkSizing
} from '../data/splunkDeployerData';
import { 
  Users, 
  Search, 
  Server, 
  Cpu, 
  HardDrive, 
  Layers, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Info, 
  Sliders, 
  ShieldAlert, 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  Activity,
  Zap,
  Globe,
  Radio,
  DollarSign,
  PieChart,
  Settings,
  X,
  Sparkles,
  ExternalLink,
  Lock,
  Network,
  HelpCircle,
  Clock,
  FolderOpen,
  CheckCircle2,
  RefreshCw,
  Key,
  LayoutGrid,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Move,
  Grid,
  SlidersHorizontal,
  Compass,
  Unlock,
  LogOut,
  ArrowRightLeft
} from 'lucide-react';
import { SplunkPortInspectorModal } from './SplunkPortInspectorModal';
import { SplunkNodeConfigModal } from './SplunkNodeConfigModal';
import { SplunkArchitectAssistantModal } from './SplunkArchitectAssistantModal';
import { SplunkNodeSpotlightModal, SpotlightTarget } from './SplunkNodeSpotlightModal';

interface SplunkSchematicBlueprintDiagramProps {
  assets: ServerAssetNode[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onAddNode: (role: ServerAssetNode['role']) => void;
  onRemoveNode: (id: string, e?: React.MouseEvent) => void;
  onUpdateNode: (id: string, field: keyof ServerAssetNode, value: any) => void;
  sizingInputs: SizingLOMInputs;
  onUpdateSizingInputs: (inputs: SizingLOMInputs) => void;
  sizingResult: CalculatedSizingResult;
  lang: 'fa' | 'en';
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LogSourceItem {
  id: string;
  title: string;
  ip: string;
  proto: string;
  eps: string;
  color: string;
  portTag: string;
  portNum: number;
  wireId: string;
}

export const SplunkSchematicBlueprintDiagram: React.FC<SplunkSchematicBlueprintDiagramProps> = ({
  assets,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onRemoveNode,
  onUpdateNode,
  sizingInputs,
  onUpdateSizingInputs,
  sizingResult,
  lang
}) => {
  const isFa = lang === 'fa';
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Modal / Drawer state for Senior Splunk Architect
  const [isArchitectModalOpen, setIsArchitectModalOpen] = useState<boolean>(false);
  const [architectActiveTab, setArchitectActiveTab] = useState<'sh_soc' | 'storage_lifecycle' | 'license_pricing' | 'node_specs'>('sh_soc');
  
  // Interactive Port Inspector Modal State
  const [inspectedPort, setInspectedPort] = useState<{ portNumber: number | string; node?: ServerAssetNode } | null>(null);

  // Dedicated Node Deep Configurator Modal State
  const [configuringNode, setConfiguringNode] = useState<ServerAssetNode | null>(null);

  // Diagram View Controls State
  const [animatePackets, setAnimatePackets] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [nodeScale, setNodeScale] = useState<number>(1.0); // Dynamic card size scale (0.75x to 1.3x)
  const [viewMode, setViewMode] = useState<'interactive_topology' | 'schematic_grid'>('interactive_topology');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Interactive Port / Wire Selection & Dimming State
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Shape Magnified Spotlight & Inspector Modal State (User requested: click anywhere to see large shape + Change Settings button)
  const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget | null>(null);

  // Custom Dragged Node Positions State
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Node Cluster Membership / Detached State (Allows ejecting nodes out of cluster or bringing them in)
  const [detachedNodeIds, setDetachedNodeIds] = useState<Record<string, boolean>>({});

  // Cluster Manager / Membership Modal Target Tier
  const [clusterManagerModalTier, setClusterManagerModalTier] = useState<string | null>(null);

  // Active Dragging State (Nodes & Entire Tiers)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingTierId, setDraggingTierId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartClientPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tierDragStartPositions = useRef<Record<string, { x: number; y: number }>>({});
  const hasMovedSignificantly = useRef<boolean>(false);

  // Filter nodes by role
  const searchHeads = useMemo(() => assets.filter(a => a.role === 'search_head'), [assets]);
  const indexers = useMemo(() => assets.filter(a => a.role === 'indexer_peer'), [assets]);
  const heavyForwarders = useMemo(() => assets.filter(a => a.role === 'heavy_forwarder'), [assets]);
  const clusterManagers = useMemo(() => assets.filter(a => a.role === 'cluster_manager'), [assets]);
  const deployers = useMemo(() => assets.filter(a => a.role === 'deployer' || a.role === 'deployer_lm_ds'), [assets]);
  const deploymentServers = useMemo(() => assets.filter(a => a.role === 'deployment_server'), [assets]);
  const licenseMasters = useMemo(() => assets.filter(a => a.role === 'license_master'), [assets]);

  // Handle ESC key for exiting Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Non-passive Wheel Event Listener for mouse-wheel zooming on canvas
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default page scroll when zooming inside diagram canvas
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomLevel(prev => {
        const next = Math.min(3.0, Math.max(0.35, prev * zoomFactor));
        return Number(next.toFixed(2));
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Organization Total Raw Hardware Pool Constants & Calculations
  const TOTAL_ORG_SERVERS_CAPACITY = 16;
  const TOTAL_ORG_CPU_CAPACITY = 256;
  const TOTAL_ORG_RAM_CAPACITY = 1024;
  const TOTAL_ORG_STORAGE_TB_CAPACITY = 64;

  const allocatedCpu = assets.reduce((sum, a) => sum + (a.cpuCores || 0), 0);
  const allocatedRam = assets.reduce((sum, a) => sum + (a.ramGB || 0), 0);
  const allocatedStorageNVMe = assets.reduce((sum, a) => sum + (a.storageNVMeGB || 0), 0) / 1024;
  const allocatedStorageCold = assets.reduce((sum, a) => sum + (a.storageColdTB || 0), 0);
  const totalAllocatedStorageTB = Number((allocatedStorageNVMe + allocatedStorageCold).toFixed(1));

  const remainingCpu = Math.max(0, TOTAL_ORG_CPU_CAPACITY - allocatedCpu);
  const remainingRam = Math.max(0, TOTAL_ORG_RAM_CAPACITY - allocatedRam);
  const remainingStorageTB = Math.max(0, Number((TOTAL_ORG_STORAGE_TB_CAPACITY - totalAllocatedStorageTB).toFixed(1)));

  // Dynamic Log Sources State
  const [logSources, setLogSources] = useState<LogSourceItem[]>([
    { id: 'src-1', title: 'Syslog / Palo Alto FW', ip: '192.168.10.50', proto: 'UDP:514', eps: '1400 EPS', color: '#f59e0b', portTag: ':514 UDP', portNum: 514, wireId: 'wire-syslog-514' },
    { id: 'src-2', title: 'Wazuh EDR & SIEM Sensor', ip: '192.168.10.65', proto: 'TCP:1514', eps: '620 EPS', color: '#f59e0b', portTag: ':1514 TCP', portNum: 1514, wireId: 'wire-edr-1514' },
    { id: 'src-3', title: 'Active Directory DC (WinEvent)', ip: '10.20.30.12', proto: 'SplunkTCP:9997', eps: '980 EPS', color: '#10b981', portTag: ':9997 S2S', portNum: 9997, wireId: 'wire-uf-9997' },
    { id: 'src-4', title: 'Linux Auth Log (/var/log/secure)', ip: '169.254.0.1', proto: 'HEC:8088', eps: '120 EPS', color: '#a855f7', portTag: ':8088 HEC', portNum: 8088, wireId: 'wire-hec-8088' },
  ]);

  const handleAddLogSource = () => {
    const count = logSources.length + 1;
    const nextId = `src-${count}-${Date.now().toString().slice(-4)}`;
    setLogSources([
      ...logSources,
      {
        id: nextId,
        title: `Custom Sensor #${count}`,
        ip: `192.168.10.${70 + count}`,
        proto: 'TCP:514',
        eps: '450 EPS',
        color: '#06b6d4',
        portTag: ':514 TCP',
        portNum: 514,
        wireId: 'wire-syslog-514'
      }
    ]);
  };

  const handleRemoveLogSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (logSources.length <= 1) return;
    setLogSources(logSources.filter(s => s.id !== id));
  };

  // =========================================================================
  // AUTOMATIC MATHEMATICAL LAYOUT ENGINE & ADAPTIVE SIZING (COLLISION FREE)
  // =========================================================================
  
  // Calculate dynamic adaptive scaling based on node count and cluster scale
  const effectiveNodeScale = useMemo(() => {
    const totalNodes = assets.length + logSources.length;
    // If user has not chosen a manual scale override (nodeScale === 1.0)
    if (nodeScale === 1.0) {
      if (totalNodes >= 20 || sizingInputs.dailyVolumeGB >= 5000) return 0.72;
      if (totalNodes >= 14 || sizingInputs.dailyVolumeGB >= 2000) return 0.80;
      if (totalNodes >= 9 || sizingInputs.dailyVolumeGB >= 1000) return 0.88;
      return 1.0;
    }
    return nodeScale;
  }, [assets.length, logSources.length, nodeScale, sizingInputs.dailyVolumeGB]);

  const { autoNodePositions, canvasDimensions } = useMemo(() => {
    const positions: Record<string, NodePosition> = {};

    // 1. SOC Analysts Box (Fixed Left Top)
    const socWidth = Math.max(220, Math.round(240 * effectiveNodeScale));
    const socHeight = Math.max(100, Math.round(105 * effectiveNodeScale));
    const socX = 35;
    const socY = 45;
    positions['soc_users'] = {
      x: socX,
      y: socY,
      width: socWidth,
      height: socHeight
    };

    // 2. Search Heads Layout (Center Top - multi-column wrapping if > 3 nodes)
    const shCount = searchHeads.length || 1;
    const shCols = shCount > 3 ? Math.min(4, Math.ceil(shCount / 2)) : shCount;
    const shBaseWidth = shCount === 1 ? 310 : (shCols > 2 ? 180 : 200);
    const shWidth = Math.max(170, Math.round(shBaseWidth * effectiveNodeScale));
    const shHeight = Math.max(98, Math.round((shCount > 3 ? 98 : 108) * effectiveNodeScale));
    const shStartX = Math.max(340, socX + socWidth + 40);

    searchHeads.forEach((sh, i) => {
      const col = i % shCols;
      const row = Math.floor(i / shCols);
      positions[sh.id] = {
        x: shStartX + col * (shWidth + 16),
        y: 45 + row * (shHeight + 14),
        width: shWidth,
        height: shHeight
      };
    });

    const shRows = Math.ceil(shCount / shCols);
    const shTierBottom = 45 + shRows * (shHeight + 14);
    const shTierRight = shStartX + Math.min(shCols, shCount) * (shWidth + 16);

    // 3. Indexer Peers Layout (Center Middle - responsive grid cols)
    const idxCount = indexers.length || 1;
    const idxCols = idxCount > 3 ? (idxCount > 8 ? 4 : 3) : Math.max(1, idxCount);
    const idxBaseWidth = idxCount === 1 ? 280 : (idxCols >= 4 ? 150 : 170);
    const idxWidth = Math.max(145, Math.round(idxBaseWidth * effectiveNodeScale));
    const idxHeight = Math.max(125, Math.round((idxCount > 4 ? 115 : 145) * effectiveNodeScale));
    const idxStartX = Math.max(320, shStartX - 15);
    const idxStartY = Math.max(185, shTierBottom + 30);

    indexers.forEach((idx, i) => {
      const col = i % idxCols;
      const row = Math.floor(i / idxCols);
      positions[idx.id] = {
        x: idxStartX + col * (idxWidth + 14),
        y: idxStartY + row * (idxHeight + 14),
        width: idxWidth,
        height: idxHeight
      };
    });

    const idxRows = Math.ceil(idxCount / idxCols);
    const idxTierBottom = idxStartY + idxRows * (idxHeight + 14);
    const idxTierRight = idxStartX + Math.min(idxCols, idxCount) * (idxWidth + 14);

    // 4. Heavy Forwarders Layout (Center Bottom - adaptive columns)
    const hfCount = heavyForwarders.length || 1;
    const hfCols = hfCount > 2 ? Math.min(3, hfCount) : Math.max(1, hfCount);
    const hfBaseWidth = hfCount === 1 ? 330 : (hfCols >= 3 ? 280 : 300);
    const hfWidth = Math.max(260, Math.round(hfBaseWidth * effectiveNodeScale));
    const hfHeight = Math.max(215, Math.round((hfCount > 3 ? 215 : 235) * effectiveNodeScale));
    const hfStartX = shStartX;
    const hfStartY = Math.max(450, idxTierBottom + 40);

    heavyForwarders.forEach((hf, i) => {
      const col = i % hfCols;
      const row = Math.floor(i / hfCols);
      positions[hf.id] = {
        x: hfStartX + col * (hfWidth + 18),
        y: hfStartY + row * (hfHeight + 18),
        width: hfWidth,
        height: hfHeight
      };
    });

    const hfRows = Math.ceil(hfCount / hfCols);
    const hfTierBottom = hfStartY + hfRows * (hfHeight + 18);
    const hfTierRight = hfStartX + Math.min(hfCols, hfCount) * (hfWidth + 18);

    // 5. Log Sources Layout (Left Bottom)
    const srcWidth = Math.max(235, Math.round(250 * effectiveNodeScale));
    const srcHeight = Math.max(48, Math.round(50 * effectiveNodeScale));
    const srcStartY = Math.max(440, idxTierBottom + 35);
    logSources.forEach((src, i) => {
      positions[src.id] = {
        x: 25,
        y: srcStartY + i * (srcHeight + 8),
        width: srcWidth,
        height: srcHeight
      };
    });
    const srcBottom = srcStartY + logSources.length * (srcHeight + 8);

    // 6. Management Tier Layout (Right Column Stack - adapts X coordinate)
    const centerMaxRight = Math.max(shTierRight, idxTierRight, hfTierRight);
    const mgmtX = Math.max(900, centerMaxRight + 45);
    const mgmtWidth = Math.max(270, Math.round(285 * effectiveNodeScale));

    let currentMgmtY = 45;
    clusterManagers.forEach((cm) => {
      const h = Math.max(125, Math.round(130 * effectiveNodeScale));
      positions[cm.id] = { x: mgmtX, y: currentMgmtY, width: mgmtWidth, height: h };
      currentMgmtY += h + 14;
    });

    deployers.forEach((dep) => {
      const h = Math.max(110, Math.round(115 * effectiveNodeScale));
      positions[dep.id] = { x: mgmtX, y: currentMgmtY, width: mgmtWidth, height: h };
      currentMgmtY += h + 14;
    });

    deploymentServers.forEach((ds) => {
      const h = Math.max(110, Math.round(115 * effectiveNodeScale));
      positions[ds.id] = { x: mgmtX, y: currentMgmtY, width: mgmtWidth, height: h };
      currentMgmtY += h + 14;
    });

    licenseMasters.forEach((lm) => {
      const h = Math.max(190, Math.round(200 * effectiveNodeScale));
      positions[lm.id] = { x: mgmtX, y: currentMgmtY, width: mgmtWidth, height: h };
      currentMgmtY += h + 14;
    });
    const mgmtBottom = currentMgmtY;

    // Dynamic SVG Canvas Dimensions so nodes never overflow or collide
    const canvasWidth = Math.max(1220, mgmtX + mgmtWidth + 40);
    const canvasHeight = Math.max(780, Math.max(srcBottom, hfTierBottom, mgmtBottom) + 50);

    return {
      autoNodePositions: positions,
      canvasDimensions: { width: canvasWidth, height: canvasHeight }
    };
  }, [effectiveNodeScale, searchHeads, indexers, heavyForwarders, logSources, clusterManagers, deployers, deploymentServers, licenseMasters]);

  // Merge auto positions with custom dragged positions
  const getNodePos = useCallback((id: string): NodePosition => {
    const auto = autoNodePositions[id] || { x: 100, y: 100, width: 200, height: 100 };
    if (customPositions[id]) {
      return {
        ...auto,
        x: customPositions[id].x,
        y: customPositions[id].y
      };
    }
    return auto;
  }, [autoNodePositions, customPositions]);

  // Helper to get connection anchor points (center or sides)
  const getNodeAnchor = useCallback((id: string, side: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'center') => {
    const pos = getNodePos(id);
    switch (side) {
      case 'top':
        return { x: pos.x + pos.width / 2, y: pos.y };
      case 'bottom':
        return { x: pos.x + pos.width / 2, y: pos.y + pos.height };
      case 'left':
        return { x: pos.x, y: pos.y + pos.height / 2 };
      case 'right':
        return { x: pos.x + pos.width, y: pos.y + pos.height / 2 };
      case 'center':
      default:
        return { x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 };
    }
  }, [getNodePos]);

  // Reset all custom positions and canvas pan/zoom (Auto-Arrange action)
  const handleResetLayout = () => {
    setCustomPositions({});
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setNodeScale(1.0);
  };

  // Smart Auto-Fit View: Automatically centers and scales all cluster nodes within the user's viewport
  const handleFitView = useCallback(() => {
    const allNodeIds = [
      'soc_users',
      ...searchHeads.map(n => n.id),
      ...indexers.map(n => n.id),
      ...heavyForwarders.map(n => n.id),
      ...logSources.map(n => n.id),
      ...clusterManagers.map(n => n.id),
      ...deployers.map(n => n.id),
      ...deploymentServers.map(n => n.id),
      ...licenseMasters.map(n => n.id),
    ];
    const positions = allNodeIds.map(id => getNodePos(id));
    if (positions.length === 0) {
      setPanOffset({ x: 0, y: 0 });
      setZoomLevel(1);
      return;
    }
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const contentW = (maxX - minX) + 80;
    const contentH = (maxY - minY) + 80;
    const containerW = canvasContainerRef.current?.clientWidth || 1200;
    const containerH = canvasContainerRef.current?.clientHeight || 750;

    const targetScale = Math.min(1.3, Math.max(0.35, Math.min(containerW / contentW, containerH / contentH) * 0.94));
    setZoomLevel(Number(targetScale.toFixed(2)));
    setPanOffset({ x: 0, y: 0 });
  }, [getNodePos, searchHeads, indexers, heavyForwarders, logSources, clusterManagers, deployers, deploymentServers, licenseMasters]);

  // =========================================================================
  // DYNAMIC TIER BOUNDING BOX CALCULATION (AUTO-WRAPPING AROUND NODES)
  // =========================================================================
  const getTierBoundingBox = useCallback((memberIds: string[], defaultBox: { x: number; y: number; width: number; height: number; minWidth?: number }) => {
    if (memberIds.length === 0) {
      return defaultBox;
    }
    const positions = memberIds.map(id => getNodePos(id));
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const padX = 18;
    const padYTop = 32;
    const padYBottom = 18;
    const computedWidth = Math.max(defaultBox.minWidth || 200, (maxX - minX) + padX * 2);
    const computedHeight = (maxY - minY) + padYTop + padYBottom;

    return {
      x: minX - padX,
      y: minY - padYTop,
      width: computedWidth,
      height: computedHeight
    };
  }, [getNodePos]);

  // =========================================================================
  // DYNAMIC BOUNDLESS VIEWBOX (UNCONSTRAINED BOUNDARIES FOR FREE DRAGGING)
  // =========================================================================
  const dynamicViewBox = useMemo(() => {
    const allNodeIds = [
      'soc_users',
      ...searchHeads.map(n => n.id),
      ...indexers.map(n => n.id),
      ...heavyForwarders.map(n => n.id),
      ...logSources.map(n => n.id),
      ...clusterManagers.map(n => n.id),
      ...deployers.map(n => n.id),
      ...deploymentServers.map(n => n.id),
      ...licenseMasters.map(n => n.id),
    ];
    const allPositions = allNodeIds.map(id => getNodePos(id));
    if (allPositions.length === 0) {
      return { minX: 0, minY: 0, width: canvasDimensions.width, height: canvasDimensions.height };
    }
    const minX = Math.min(0, Math.min(...allPositions.map(p => p.x)) - 140);
    const minY = Math.min(0, Math.min(...allPositions.map(p => p.y)) - 140);
    const maxX = Math.max(canvasDimensions.width, Math.max(...allPositions.map(p => p.x + p.width)) + 140);
    const maxY = Math.max(canvasDimensions.height, Math.max(...allPositions.map(p => p.y + p.height)) + 140);

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [getNodePos, canvasDimensions, searchHeads, indexers, heavyForwarders, logSources, clusterManagers, deployers, deploymentServers, licenseMasters]);

  // =========================================================================
  // ANTI-COLLISION REPULSION ENGINE (INVERSE MAGNETIC FORCE - آهنربای معکوس)
  // =========================================================================
  const MIN_NODE_CLEARANCE = 20; // Repulsive boundary buffer in px

  const applyNodeRepulsion = useCallback((
    draggedId: string,
    targetX: number,
    targetY: number,
    width: number,
    height: number
  ): { x: number; y: number } => {
    let resolvedX = targetX;
    let resolvedY = targetY;
    
    const allOtherIds = [
      'soc_users',
      ...searchHeads.map(n => n.id),
      ...indexers.map(n => n.id),
      ...heavyForwarders.map(n => n.id),
      ...logSources.map(n => n.id),
      ...clusterManagers.map(n => n.id),
      ...deployers.map(n => n.id),
      ...deploymentServers.map(n => n.id),
      ...licenseMasters.map(n => n.id),
    ].filter(id => id !== draggedId);

    // Apply repulsive relaxation iterations to push away overlapping nodes
    for (let iter = 0; iter < 3; iter++) {
      for (const otherId of allOtherIds) {
        const other = getNodePos(otherId);
        
        const isOverlapX = (resolvedX + width + MIN_NODE_CLEARANCE) > other.x && (other.x + other.width + MIN_NODE_CLEARANCE) > resolvedX;
        const isOverlapY = (resolvedY + height + MIN_NODE_CLEARANCE) > other.y && (other.y + other.height + MIN_NODE_CLEARANCE) > resolvedY;

        if (isOverlapX && isOverlapY) {
          const centerDraggedX = resolvedX + width / 2;
          const centerDraggedY = resolvedY + height / 2;
          const centerOtherX = other.x + other.width / 2;
          const centerOtherY = other.y + other.height / 2;

          const diffX = centerDraggedX - centerOtherX;
          const diffY = centerDraggedY - centerOtherY;

          const minReqDistX = (width + other.width) / 2 + MIN_NODE_CLEARANCE;
          const minReqDistY = (height + other.height) / 2 + MIN_NODE_CLEARANCE;

          const overlapDepthX = minReqDistX - Math.abs(diffX);
          const overlapDepthY = minReqDistY - Math.abs(diffY);

          if (overlapDepthX > 0 && overlapDepthY > 0) {
            // Inverse magnetic push away along the axis with least intrusion
            if (overlapDepthX < overlapDepthY) {
              const pushX = (diffX >= 0 ? 1 : -1) * (overlapDepthX + 1);
              resolvedX += pushX;
            } else {
              const pushY = (diffY >= 0 ? 1 : -1) * (overlapDepthY + 1);
              resolvedY += pushY;
            }
          }
        }
      }
    }

    return { x: resolvedX, y: resolvedY };
  }, [getNodePos, searchHeads, indexers, heavyForwarders, logSources, clusterManagers, deployers, deploymentServers, licenseMasters]);

  // =========================================================================
  // CLUSTER FRAME REPULSION ENGINE (INVERSE MAGNETIC FORCE FOR TIERS - دفع کادرها)
  // =========================================================================
  const MIN_TIER_CLEARANCE = 30; // Repulsive clearance between cluster frames

  const applyTierRepulsion = useCallback((
    movingTierId: string,
    proposedDelta: { x: number; y: number },
    memberIds: string[],
    initialPositions: Record<string, { x: number; y: number }>
  ): { x: number; y: number } => {
    let resolvedDeltaX = proposedDelta.x;
    let resolvedDeltaY = proposedDelta.y;

    const tiers: { id: string; members: string[] }[] = [
      { id: 'tier_search', members: searchHeads.filter(sh => !detachedNodeIds[sh.id]).map(sh => sh.id) },
      { id: 'tier_indexer', members: indexers.filter(idx => !detachedNodeIds[idx.id]).map(idx => idx.id) },
      { id: 'tier_forwarder', members: heavyForwarders.filter(hf => !detachedNodeIds[hf.id]).map(hf => hf.id) },
      { id: 'tier_sources', members: logSources.filter(src => !detachedNodeIds[src.id]).map(src => src.id) },
      { id: 'tier_mgmt', members: [...clusterManagers, ...deployers, ...deploymentServers, ...licenseMasters].filter(m => !detachedNodeIds[m.id]).map(m => m.id) },
    ];

    const currentMovingPositions = memberIds.map(id => {
      const init = initialPositions[id] || getNodePos(id);
      const pos = getNodePos(id);
      return { ...pos, x: init.x + resolvedDeltaX, y: init.y + resolvedDeltaY };
    });

    if (currentMovingPositions.length === 0) return proposedDelta;

    for (let iter = 0; iter < 3; iter++) {
      const minX = Math.min(...currentMovingPositions.map(p => p.x + (resolvedDeltaX - proposedDelta.x)));
      const minY = Math.min(...currentMovingPositions.map(p => p.y + (resolvedDeltaY - proposedDelta.y)));
      const maxX = Math.max(...currentMovingPositions.map(p => p.x + (resolvedDeltaX - proposedDelta.x) + p.width));
      const maxY = Math.max(...currentMovingPositions.map(p => p.y + (resolvedDeltaY - proposedDelta.y) + p.height));

      const movingBox = {
        x: minX - 18,
        y: minY - 32,
        width: (maxX - minX) + 36,
        height: (maxY - minY) + 50
      };

      for (const otherTier of tiers) {
        if (otherTier.id === movingTierId || otherTier.members.length === 0) continue;
        const otherPositions = otherTier.members.map(id => getNodePos(id));
        if (otherPositions.length === 0) continue;
        const oMinX = Math.min(...otherPositions.map(p => p.x));
        const oMinY = Math.min(...otherPositions.map(p => p.y));
        const oMaxX = Math.max(...otherPositions.map(p => p.x + p.width));
        const oMaxY = Math.max(...otherPositions.map(p => p.y + p.height));

        const otherBox = {
          x: oMinX - 18,
          y: oMinY - 32,
          width: (oMaxX - oMinX) + 36,
          height: (oMaxY - oMinY) + 50
        };

        const isOverlapX = (movingBox.x + movingBox.width + MIN_TIER_CLEARANCE) > otherBox.x && 
                           (otherBox.x + otherBox.width + MIN_TIER_CLEARANCE) > movingBox.x;
        const isOverlapY = (movingBox.y + movingBox.height + MIN_TIER_CLEARANCE) > otherBox.y && 
                           (otherBox.y + otherBox.height + MIN_TIER_CLEARANCE) > movingBox.y;

        if (isOverlapX && isOverlapY) {
          const centerMovingX = movingBox.x + movingBox.width / 2;
          const centerMovingY = movingBox.y + movingBox.height / 2;
          const centerOtherX = otherBox.x + otherBox.width / 2;
          const centerOtherY = otherBox.y + otherBox.height / 2;

          const diffX = centerMovingX - centerOtherX;
          const diffY = centerMovingY - centerOtherY;

          const minReqX = (movingBox.width + otherBox.width) / 2 + MIN_TIER_CLEARANCE;
          const minReqY = (movingBox.height + otherBox.height) / 2 + MIN_TIER_CLEARANCE;

          const overlapX = minReqX - Math.abs(diffX);
          const overlapY = minReqY - Math.abs(diffY);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              const pushX = (diffX >= 0 ? 1 : -1) * (overlapX + 2);
              resolvedDeltaX += pushX;
            } else {
              const pushY = (diffY >= 0 ? 1 : -1) * (overlapY + 2);
              resolvedDeltaY += pushY;
            }
          }
        }
      }
    }

    return { x: resolvedDeltaX, y: resolvedDeltaY };
  }, [searchHeads, indexers, heavyForwarders, logSources, clusterManagers, deployers, deploymentServers, licenseMasters, detachedNodeIds, getNodePos]);

  // Handler to toggle node cluster membership (Eject out of cluster or Bring back in)
  const handleToggleNodeClusterMembership = useCallback((nodeId: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setDetachedNodeIds(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

  // Handler to move a node to another role/cluster directly
  const handleReassignNodeCluster = useCallback((nodeId: string, newRole: ServerAssetNode['role']) => {
    const node = assets.find(a => a.id === nodeId);
    if (!node) return;
    onUpdateNode(nodeId, 'role', newRole);
    setDetachedNodeIds(prev => ({
      ...prev,
      [nodeId]: false
    }));
  }, [assets, onUpdateNode]);

  // Handler for double clicking on any cluster/tier frame:
  // If a node is selected (or if a node is currently detached), double-clicking the tier immediately moves/assigns that node into this tier!
  // Otherwise, opens the cluster manager modal for this tier.
  const handleDoubleClickTier = useCallback((tierKey: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();

    // Check if there is an active selected node or a lone detached node that the user wants to bring into this tier
    const targetNodeId = selectedNodeId || Object.keys(detachedNodeIds).find(id => detachedNodeIds[id]);
    
    if (targetNodeId) {
      const node = assets.find(a => a.id === targetNodeId);
      if (node) {
        let targetRole: ServerAssetNode['role'] = node.role;
        if (tierKey === 'tier_search') targetRole = 'search_head';
        else if (tierKey === 'tier_indexer') targetRole = 'indexer_peer';
        else if (tierKey === 'tier_forwarder') targetRole = 'heavy_forwarder';
        else if (tierKey === 'tier_mgmt') targetRole = 'cluster_manager';

        onUpdateNode(targetNodeId, 'role', targetRole);
        setDetachedNodeIds(prev => ({
          ...prev,
          [targetNodeId]: false
        }));
        return;
      }
    }

    // Otherwise open the cluster manager modal
    setClusterManagerModalTier(tierKey);
  }, [selectedNodeId, detachedNodeIds, assets, onUpdateNode]);

  // =========================================================================
  // INTERACTIVE DRAG AND DROP HANDLERS (BOUNDLESS INFINITE CANVAS & PANNING)
  // =========================================================================
  const getSVGCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    return {
      x: viewBox.x + (clientX - rect.left) * scaleX,
      y: viewBox.y + (clientY - rect.top) * scaleY
    };
  };

  const handleStartDrag = (nodeId: string, clientX: number, clientY: number, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const svgCoords = getSVGCoordinates(clientX, clientY);
    const currentPos = getNodePos(nodeId);
    dragStartClientPos.current = { x: clientX, y: clientY };
    hasMovedSignificantly.current = false;
    setDraggingTierId(null);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: svgCoords.x - currentPos.x,
      y: svgCoords.y - currentPos.y
    });
    onSelectNode(nodeId);
  };

  const handleStartDragTier = (tierId: string, memberIds: string[], clientX: number, clientY: number, e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (memberIds.length === 0) return;
    const svgCoords = getSVGCoordinates(clientX, clientY);
    dragStartClientPos.current = { x: clientX, y: clientY };
    hasMovedSignificantly.current = false;
    setDraggingNodeId(null);
    setDraggingTierId(tierId);
    setDragOffset({
      x: svgCoords.x,
      y: svgCoords.y
    });
    const initialPositions: Record<string, { x: number; y: number }> = {};
    memberIds.forEach(id => {
      initialPositions[id] = { ...getNodePos(id) };
    });
    tierDragStartPositions.current = initialPositions;
  };

  const handleBackgroundPointerDown = (clientX: number, clientY: number) => {
    setIsPanning(true);
    panStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const dist = Math.hypot(clientX - dragStartClientPos.current.x, clientY - dragStartClientPos.current.y);
    if (dist > 6) {
      hasMovedSignificantly.current = true;
    }

    if (isPanning) {
      const deltaScreenX = clientX - panStartRef.current.x;
      const deltaScreenY = clientY - panStartRef.current.y;
      setPanOffset(prev => ({
        x: prev.x + deltaScreenX,
        y: prev.y + deltaScreenY
      }));
      panStartRef.current = { x: clientX, y: clientY };
      return;
    }

    if (draggingTierId) {
      const svgCoords = getSVGCoordinates(clientX, clientY);
      const deltaX = svgCoords.x - dragOffset.x;
      const deltaY = svgCoords.y - dragOffset.y;

      const memberIds = Object.keys(tierDragStartPositions.current);
      // Apply Tier-Level Repulsion Engine
      const repelledDelta = applyTierRepulsion(draggingTierId, { x: deltaX, y: deltaY }, memberIds, tierDragStartPositions.current);

      const updated: Record<string, { x: number; y: number }> = {};
      Object.entries(tierDragStartPositions.current).forEach(([nodeId, initPos]) => {
        let newX = initPos.x + repelledDelta.x;
        let newY = initPos.y + repelledDelta.y;
        if (snapToGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }
        updated[nodeId] = { x: newX, y: newY };
      });

      setCustomPositions(prev => ({
        ...prev,
        ...updated
      }));
      return;
    }

    if (draggingNodeId) {
      const svgCoords = getSVGCoordinates(clientX, clientY);
      let candX = svgCoords.x - dragOffset.x;
      let candY = svgCoords.y - dragOffset.y;

      if (snapToGrid) {
        candX = Math.round(candX / 20) * 20;
        candY = Math.round(candY / 20) * 20;
      }

      // Apply Anti-Collision Inverse Magnetic Repulsion
      const currentPos = getNodePos(draggingNodeId);
      const repelled = applyNodeRepulsion(draggingNodeId, candX, candY, currentPos.width, currentPos.height);

      setCustomPositions(prev => ({
        ...prev,
        [draggingNodeId]: { x: repelled.x, y: repelled.y }
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
    setDraggingTierId(null);
    setIsPanning(false);
  };

  // Handler when user clicks "تغییر تنظیمات" inside the spotlight modal
  const handleOpenSpotlightSettings = (target: SpotlightTarget) => {
    if (target.type === 'node' && target.node) {
      handleOpenNodeConfig(target.node);
    } else if (target.type === 'conduit_wire' && target.wire) {
      handleInspectPort(target.wire.portNumber, target.wire.associatedNode, target.wire.id);
    } else if (target.type === 'soc_users') {
      handleOpenArchitect('sh_soc');
    } else if (target.type === 'log_source' && target.logSource) {
      if (heavyForwarders[0]) {
        handleOpenNodeConfig(heavyForwarders[0]);
      } else {
        handleOpenArchitect('sh_soc');
      }
    }
  };

  // Helper to open architect modal focused on a specific component
  const handleOpenArchitect = (tab: 'sh_soc' | 'storage_lifecycle' | 'license_pricing' | 'node_specs', nodeId?: string) => {
    if (nodeId) {
      onSelectNode(nodeId);
    }
    setArchitectActiveTab(tab);
    setIsArchitectModalOpen(true);
  };

  // Helper to open node deep config modal
  const handleOpenNodeConfig = (node: ServerAssetNode) => {
    onSelectNode(node.id);
    setConfiguringNode(node);
  };

  // Helper to inspect a network port and focus its wire
  const handleInspectPort = (portNumber: number | string, node?: ServerAssetNode, wireId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (wireId) {
      setSelectedWireId(wireId);
    }
    setInspectedPort({ portNumber, node });
  };

  // Helper to update port number across node(s)
  const handleUpdatePortNumber = (nodeId: string, portKey: string, newPort: number) => {
    const target = assets.find(a => a.id === nodeId);
    if (!target) return;
    const updatedPorts = { ...(target.assignedPorts || {}), [portKey]: newPort };
    onUpdateNode(nodeId, 'assignedPorts', updatedPorts);
  };

  // Helper to test if a wire is active / dimmed
  const getWireOpacity = (wireId: string) => {
    if (!selectedWireId) return 1;
    return selectedWireId === wireId ? 1 : 0.15;
  };

  const isWireSelected = (wireId: string) => selectedWireId === wireId;

  // Active port numbers from assets
  const primaryIdxPort = indexers[0]?.assignedPorts?.splunkTcp || 9997;
  const primaryRepPort = indexers[0]?.assignedPorts?.replicationPort || 9887;
  const primaryShcPort = searchHeads[0]?.assignedPorts?.shcReplicationPort || 8181;
  const primaryMgmtPort = searchHeads[0]?.assignedPorts?.splunkMgmt || 8089;
  const primaryWebPort = searchHeads[0]?.assignedPorts?.splunkWeb || 8000;
  const primaryHecPort = heavyForwarders[0]?.assignedPorts?.hecPort || 8088;

  // Compute Dynamic Wire Endpoints based on live node positions
  const socAnchor = getNodeAnchor('soc_users', 'right');
  const shFirstAnchor = searchHeads[0] ? getNodeAnchor(searchHeads[0].id, 'left') : { x: 380, y: 90 };
  const shBottomAnchor = searchHeads[0] ? getNodeAnchor(searchHeads[0].id, 'bottom') : { x: 480, y: 150 };
  const idxTopAnchor = indexers[0] ? getNodeAnchor(indexers[0].id, 'top') : { x: 440, y: 215 };
  const idxBottomAnchor = indexers[0] ? getNodeAnchor(indexers[0].id, 'bottom') : { x: 440, y: 350 };
  const hfTopAnchor = heavyForwarders[0] ? getNodeAnchor(heavyForwarders[0].id, 'top') : { x: 470, y: 465 };
  const hfLeftAnchor = heavyForwarders[0] ? getNodeAnchor(heavyForwarders[0].id, 'left') : { x: 370, y: 550 };
  const cmAnchor = clusterManagers[0] ? getNodeAnchor(clusterManagers[0].id, 'left') : { x: 880, y: 110 };
  const depAnchor = deployers[0] ? getNodeAnchor(deployers[0].id, 'left') : { x: 880, y: 260 };
  const dsAnchor = deploymentServers[0] ? getNodeAnchor(deploymentServers[0].id, 'left') : { x: 880, y: 410 };
  const lmAnchor = licenseMasters[0] ? getNodeAnchor(licenseMasters[0].id, 'left') : { x: 880, y: 580 };

  return (
    <div className="sirene-card relative w-full bg-[#0b0e17]/90 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden font-sans select-none" dir="ltr">
      
      {/* Ambient radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

      {/* ========================================================================= */}
      {/* 1. TOP HARDWARE INFRASTRUCTURE SCANNER & DYNAMIC CONTROLS BAR (SIRENE DARK) */}
      {/* ========================================================================= */}
      <div className="relative z-10 p-5 rounded-2xl bg-[#07090e]/95 border border-white/[0.08] mb-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2.5">
                <span>{isFa ? 'اسکنر زیرساخت سخت‌افزاری و استخر منابع فیزیکی' : 'Bare-Metal Hardware Scanner & Enterprise Resource Pool'}</span>
                <span className="sirene-badge text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1"></span>
                  {assets.length} / {TOTAL_ORG_SERVERS_CAPACITY} Nodes Provisioned
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {isFa 
                  ? `کل سرورهای فیزیکی سازمان: ${TOTAL_ORG_SERVERS_CAPACITY} سرور | تخصیص‌یافته به اسپلانک: ${assets.length} نود | ظرفیت آزاد: ${TOTAL_ORG_SERVERS_CAPACITY - assets.length} سرور`
                  : `Scanned Physical Bare-Metal Assets: ${TOTAL_ORG_SERVERS_CAPACITY} Hosts | Active Splunk Nodes: ${assets.length} | Free Capacity: ${TOTAL_ORG_SERVERS_CAPACITY - assets.length} Hosts`}
              </p>
            </div>
          </div>

          {/* Interactive Sizing, Auto-Layout & Zoom Bar - Sirene Capsule Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#0c0f18] rounded-full p-1 border border-white/[0.08] shadow-inner">
              <button
                onClick={() => setViewMode('interactive_topology')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'interactive_topology'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Interactive Vector Topology Diagram with animated conduits"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isFa ? 'توپولوژی پویا (Drag & Drop)' : 'Vector Topology'}</span>
              </button>
              <button
                onClick={() => setViewMode('schematic_grid')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'schematic_grid'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Schematic Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isFa ? 'شبکه گره‌ها' : 'Nodes Grid'}</span>
              </button>
            </div>

            {/* Auto-Layout & Fit View (چیدمان و مرتب‌سازی اتوماتیک و تطبیق نما) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetLayout}
                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/40 text-violet-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Auto-arrange and align all components into pristine tiered layout"
              >
                <Compass className="w-3.5 h-3.5 text-violet-400" />
                <span>{isFa ? 'چیدمان خودکار' : 'Auto Layout'}</span>
              </button>

              <button
                onClick={handleFitView}
                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Fit and center all nodes inside your screen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'تطبیق نما (Fit)' : 'Fit View'}</span>
              </button>
            </div>

            {/* Dynamic Node Card Scale (کوچیک و بزرگ کردن اندازه شکل‌ها) */}
            <div className="flex items-center bg-[#0c0f18] rounded-full p-1 border border-white/[0.08] gap-1">
              <span className="text-[10px] text-slate-400 font-bold px-1.5">{isFa ? 'اندازه:' : 'Size:'}</span>
              <button
                onClick={() => setNodeScale(0.85)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${effectiveNodeScale <= 0.88 && nodeScale === 0.85 ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Compact Shapes"
              >
                {isFa ? 'کوچک' : 'S'}
              </button>
              <button
                onClick={() => setNodeScale(1.0)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${nodeScale === 1.0 ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Auto Adaptive Shapes (scales with cluster size)"
              >
                {isFa ? 'خودکار' : 'Auto'}
              </button>
              <button
                onClick={() => setNodeScale(1.18)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${nodeScale === 1.18 ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Expanded Shapes"
              >
                {isFa ? 'بزرگ' : 'L'}
              </button>
            </div>

            {/* Snap to Grid Toggle */}
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                snapToGrid ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
              }`}
              title="Toggle Snap to Grid when dragging nodes"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* Animation Toggle */}
            <button
              onClick={() => setAnimatePackets(!animatePackets)}
              className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                animatePackets
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
              }`}
              title="Toggle moving packet animations along data conduits"
            >
              {animatePackets ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{animatePackets ? (isFa ? 'پویانمایی' : 'Live') : (isFa ? 'متوقف' : 'Paused')}</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#0c0f18] rounded-full border border-white/[0.08] overflow-hidden p-0.5">
              <button
                onClick={() => setZoomLevel(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
                className="p-1.5 hover:bg-white/[0.08] text-slate-300 rounded-full transition cursor-pointer"
                title="Zoom In (or Scroll Wheel Up)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[10px] text-violet-300 font-mono font-bold min-w-[38px] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.35, Number((prev - 0.15).toFixed(2))))}
                className="p-1.5 hover:bg-white/[0.08] text-slate-300 rounded-full transition cursor-pointer"
                title="Zoom Out (or Scroll Wheel Down)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFitView}
                className="p-1.5 hover:bg-white/[0.08] text-cyan-300 border-l border-white/[0.08] transition cursor-pointer text-[10px] font-bold"
                title="Fit View (تطبیق نما)"
              >
                Fit
              </button>
              <button
                onClick={handleResetLayout}
                className="p-1.5 hover:bg-white/[0.08] text-slate-300 border-l border-white/[0.08] transition cursor-pointer"
                title="Reset Zoom, Pan & Auto-Layout"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Fullscreen Workspace Toggle Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isFullscreen
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-violet-500/40 text-violet-300'
              }`}
              title={isFullscreen ? (isFa ? 'خروج از حالت تمام‌صفحه (ESC)' : 'Exit Fullscreen (ESC)') : (isFa ? 'نمایش تمام‌صفحه محیط کاربری دیاگرام' : 'Toggle Fullscreen Workspace')}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-violet-400" />}
              <span className="hidden sm:inline">{isFullscreen ? (isFa ? 'خروج تمام‌صفحه' : 'Exit Fullscreen') : (isFa ? 'تمام‌صفحه' : 'Fullscreen')}</span>
            </button>
          </div>
        </div>

        {/* Resource Pool Utilization Meters - Sirene Luxury Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* CPU Cores Meter */}
          <div className="p-3.5 rounded-2xl bg-[#0c0f18] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>CPU Cores Pool:</span>
              </span>
              <span className="text-violet-300 font-bold">{allocatedCpu} / {TOTAL_ORG_CPU_CAPACITY} vCPU ({Math.round((allocatedCpu/TOTAL_ORG_CPU_CAPACITY)*100)}%)</span>
            </div>
            <div className="w-full bg-[#07090e] h-2 rounded-full overflow-hidden border border-white/[0.05]">
              <div 
                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(124,58,237,0.4)]" 
                style={{ width: `${Math.min(100, (allocatedCpu/TOTAL_ORG_CPU_CAPACITY)*100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Allocated: {allocatedCpu} vCPU</span>
              <span className="text-emerald-400">Available: {remainingCpu} vCPU</span>
            </div>
          </div>

          {/* RAM GB Meter */}
          <div className="p-3.5 rounded-2xl bg-[#0c0f18] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>RAM Memory Pool:</span>
              </span>
              <span className="text-indigo-300 font-bold">{allocatedRam} / {TOTAL_ORG_RAM_CAPACITY} GB ({Math.round((allocatedRam/TOTAL_ORG_RAM_CAPACITY)*100)}%)</span>
            </div>
            <div className="w-full bg-[#07090e] h-2 rounded-full overflow-hidden border border-white/[0.05]">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                style={{ width: `${Math.min(100, (allocatedRam/TOTAL_ORG_RAM_CAPACITY)*100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Allocated: {allocatedRam} GB</span>
              <span className="text-emerald-400">Available: {remainingRam} GB</span>
            </div>
          </div>

          {/* Storage Capacity Meter */}
          <div className="p-3.5 rounded-2xl bg-[#0c0f18] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Storage Media Pool:</span>
              </span>
              <span className="text-cyan-300 font-bold">{totalAllocatedStorageTB} / {TOTAL_ORG_STORAGE_TB_CAPACITY} TB ({Math.round((totalAllocatedStorageTB/TOTAL_ORG_STORAGE_TB_CAPACITY)*100)}%)</span>
            </div>
            <div className="w-full bg-[#07090e] h-2 rounded-full overflow-hidden border border-white/[0.05]">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                style={{ width: `${Math.min(100, (totalAllocatedStorageTB/TOTAL_ORG_STORAGE_TB_CAPACITY)*100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Allocated: {totalAllocatedStorageTB} TB</span>
              <span className="text-emerald-400">Available: {remainingStorageTB} TB</span>
            </div>
          </div>
        </div>

        {/* Quick Node Addition Bar - Sirene Pills */}
        <div className="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Plus className="w-3.5 h-3.5 text-violet-400" />
            <span>{isFa ? 'افزودن نود جدید به معماری (تخصیص خودکار به دیاگرام):' : 'Add Node to Architecture:'}</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAddNode('indexer_peer')}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/40 text-violet-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + Indexer
            </button>
            <button
              onClick={() => onAddNode('search_head')}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + Search Head
            </button>
            <button
              onClick={() => onAddNode('heavy_forwarder')}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + Forwarder
            </button>
            <button
              onClick={() => onAddNode('cluster_manager')}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-indigo-500/40 text-indigo-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + CM
            </button>
            <button
              onClick={() => onAddNode('deployer')}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-500/40 text-purple-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + Deployer
            </button>
            <button
              onClick={() => onAddNode('deployment_server')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
            >
              + DS
            </button>
            <button
              onClick={() => onAddNode('license_master')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
            >
              + LM
            </button>
          </div>
        </div>
      </div>

      {/* Focused Port HUD Banner */}
      {selectedWireId && (
        <div className="relative z-20 mb-3 px-4 py-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-cyan-950/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-white">{isFa ? 'کابل پورت متمرکز فعال است:' : 'Active Focused Conduit:'}</span>
            <span className="text-amber-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-amber-500/40">
              {selectedWireId.replace('wire-', '').toUpperCase()}
            </span>
            <span className="text-slate-400 text-[11px]">
              {isFa ? '(سایر کابل‌ها کم‌رنگ شده‌اند. روی کابل کلیک کنید تا مشخصات باز شود)' : '(Other conduits dimmed. Click port badge to edit.)'}
            </span>
          </div>

          <button
            onClick={() => setSelectedWireId(null)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/60 text-cyan-300 text-[11px] font-bold cursor-pointer transition"
          >
            {isFa ? 'نمایش همه پورت‌ها (Reset)' : 'Show All Ports'}
          </button>
        </div>
      )}

      {/* Dragging & Double-Click Hint Banner */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-1 mb-2 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold bg-cyan-950/70 px-2.5 py-1 rounded-lg border border-cyan-700/60 shadow-sm">
            <Move className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            <span>{isFa ? 'قابلیت جابه‌جایی: هر نود یا کل کادر تایر (Tier) را با Drag & Drop حرکت دهید (نودها درون کادر باقی می‌مانند)' : 'Drag & Drop: Move individual nodes or drag entire tier frames'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-950/70 px-2.5 py-1 rounded-lg border border-amber-700/60 shadow-sm">
            <span>{isFa ? '🔍 دابل‌کلیک: باز شدن مشخصات سرور، بزرگ‌نمایی و تنظیمات' : '🔍 Double-Click: Open magnified shape & settings'}</span>
          </span>
        </div>
        {Object.keys(customPositions).length > 0 && (
          <button
            onClick={handleResetLayout}
            className="text-amber-400 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-700/60 cursor-pointer transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isFa ? 'بازنشانی چیدمان خودکار' : 'Reset Auto Layout'}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC INTERACTIVE VECTOR TOPOLOGY CANVAS WITH DRAG & DROP & FULLSCREEN */}
      {/* ========================================================================= */}
      {viewMode === 'interactive_topology' && (
        <div 
          ref={canvasContainerRef}
          className={`relative w-full transition-all duration-300 ${
            isFullscreen 
              ? 'fixed inset-0 z-50 bg-[#05080f] w-screen h-screen flex flex-col p-3 md:p-5 overflow-hidden' 
              : 'overflow-hidden bg-gradient-to-b from-[#090e17] to-[#05080f] rounded-2xl border border-slate-800/90 shadow-2xl p-2 md:p-4 mb-6 cursor-default'
          }`}
        >
          {/* Fullscreen Floating Header Bar */}
          {isFullscreen && (
            <div className="relative z-30 mb-3 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 flex items-center justify-between shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <span>{isFa ? 'محیط کاربری دیاگرام تمام‌صفحه کلاستر اسپلانک' : 'Splunk Cluster Architecture Workspace (Fullscreen)'}</span>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/60">
                      {assets.length} Nodes • {sizingInputs.dailyVolumeGB} GB/day
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {isFa ? 'اسکرول ماوس: زوم این/اوت | کشیدن پس‌زمینه: جابه‌جایی روی بوم | دابل کلیک: مشخصات' : 'Mouse Wheel: Zoom In/Out | Drag Background: Pan Canvas | Double-Click: Node Specs'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Add Node Buttons in Fullscreen */}
                <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold">{isFa ? 'افزودن:' : 'Add:'}</span>
                  <button
                    onClick={() => onAddNode('indexer_peer')}
                    className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    + Indexer
                  </button>
                  <button
                    onClick={() => onAddNode('search_head')}
                    className="px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-700 text-sky-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    + Search Head
                  </button>
                  <button
                    onClick={() => onAddNode('heavy_forwarder')}
                    className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    + Forwarder
                  </button>
                  <button
                    onClick={handleAddLogSource}
                    className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    + Source
                  </button>
                </div>

                {/* Fullscreen Zoom Controls */}
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs text-cyan-300 font-mono font-bold">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.35, Number((prev - 0.15).toFixed(2))))}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFitView}
                    className="px-2 py-1 hover:bg-slate-800 text-cyan-300 border-l border-slate-800 transition cursor-pointer text-xs font-bold"
                    title="Fit All Nodes (تطبیق نما)"
                  >
                    Fit
                  </button>
                  <button
                    onClick={handleResetLayout}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 border-l border-slate-800 transition cursor-pointer"
                    title="Reset Layout & Pan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Exit Fullscreen Button */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/80 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition"
                >
                  <Minimize2 className="w-4 h-4 text-rose-400" />
                  <span>{isFa ? 'خروج تمام‌صفحه (ESC)' : 'Exit (ESC)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Canvas Navigation HUD (Bottom Left / Right) */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
            <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 text-[11px] hidden md:inline">
                {isFa ? 'چرخ ماوس: زوم' : 'Scroll: Zoom'}
              </span>
              <div className="w-px h-3.5 bg-slate-700 hidden md:inline" />
              <button
                onClick={() => setZoomLevel(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 cursor-pointer transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-cyan-300 font-bold min-w-[36px] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.35, Number((prev - 0.15).toFixed(2))))}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 cursor-pointer transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFitView}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                title="Fit View"
              >
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span>Fit</span>
              </button>
              <button
                onClick={handleResetLayout}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                title="Reset Pan & Zoom"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="relative w-full h-full flex-1 overflow-hidden flex items-center justify-center">
            <svg 
              ref={svgRef}
              viewBox={`${dynamicViewBox.minX} ${dynamicViewBox.minY} ${dynamicViewBox.width} ${dynamicViewBox.height}`}
              className="w-full h-full drop-shadow-md select-none block"
              style={{ 
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                direction: 'ltr',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.12s ease-out'
              }}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchMove={(e) => {
                if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={handlePointerUp}
            >
              <defs>
                {/* Infinite Cyber Grid Pattern */}
                <pattern id="infinite-dark-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="#030712" />
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f172a" strokeWidth="0.8" opacity="0.65" />
                  <circle cx="20" cy="20" r="1.1" fill="#00d0ff" opacity="0.22" />
                </pattern>

                {/* Arrow Markers for Conduits */}
                <marker id="arr-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#00d0ff" />
                </marker>
                <marker id="arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker id="arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
                </marker>
                <marker id="arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#a855f7" />
                </marker>
                <marker id="arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                </marker>

                {/* Glowing Filters */}
                <filter id="blade-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.5" />
                </filter>
                <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Infinite Deep Black Workspace Field with Boundless 360-Degree Panning */}
              <rect 
                data-bg="true"
                x="-6000" 
                y="-6000" 
                width="18000" 
                height="18000" 
                fill="url(#infinite-dark-grid)" 
                className={isPanning ? "cursor-grabbing" : "cursor-grab"}
                onMouseDown={(e) => handleBackgroundPointerDown(e.clientX, e.clientY)}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleBackgroundPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }}
              />

              {/* Dynamic Subtle Matrix Grid Lines */}
              <g opacity="0.12" pointerEvents="none">
                {Array.from({ length: Math.ceil(canvasDimensions.width / 50) + 1 }).map((_, i) => (
                  <line key={`gx-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={canvasDimensions.height} stroke="#ffffff" strokeDasharray="2,8" />
                ))}
                {Array.from({ length: Math.ceil(canvasDimensions.height / 50) + 1 }).map((_, i) => (
                  <line key={`gy-${i}`} x1="0" y1={i * 50} x2={canvasDimensions.width} y2={i * 50} stroke="#ffffff" strokeDasharray="2,8" />
                ))}
              </g>

            {/* ============================================================== */}
            {/* TIER CONTAINERS (DYNAMIC DRAGGABLE FRAMES WITH AUTO-BOUNDING) */}
            {/* ============================================================== */}

            {/* 1. Search Tier Frame */}
            {(() => {
              const memberIds = searchHeads.filter(sh => !detachedNodeIds[sh.id]).map(sh => sh.id);
              const box = getTierBoundingBox(memberIds, { x: 340, y: 25, width: 390, height: 140, minWidth: 360 });
              const isDragging = draggingTierId === 'tier_search';
              return (
                <g transform={`translate(${box.x}, ${box.y})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width={box.width} 
                    height={box.height} 
                    rx="10" 
                    fill={isDragging ? "#0284c725" : "#1e293b15"} 
                    stroke={isDragging ? "#38bdf8" : "#0284c7"} 
                    strokeWidth={isDragging ? "2.5" : "1.8"} 
                    strokeDasharray="6,4" 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_search', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_search', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_search', e);
                    }}
                  />
                  {/* Tier Header Drag Bar */}
                  <g 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_search', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_search', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_search', e);
                    }}
                  >
                    <rect x="12" y="-14" width={Math.min(260, box.width - 150)} height="22" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1.2" />
                    <text x="20" y="1" fontSize="9.5" fontWeight="800" fill="#38bdf8" letterSpacing="0.4">
                      ✥ SEARCH TIER ({memberIds.length}/{searchHeads.length} SH)
                    </text>
                  </g>
                  {/* Manage / Eject Nodes Button */}
                  <g 
                    transform={`translate(${box.width - 165}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClusterManagerModalTier('tier_search');
                    }}
                  >
                    <rect x="0" y="0" width="60" height="22" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text x="30" y="14" fontSize="8.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">⚙ کلاستر</text>
                  </g>
                  {/* + Add Search Head Button */}
                  <g 
                    transform={`translate(${box.width - 100}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNode('search_head');
                    }}
                  >
                    <rect x="0" y="0" width="92" height="22" rx="6" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                    <text x="46" y="14" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">+ Search Head</text>
                  </g>
                </g>
              );
            })()}

            {/* 2. Indexing Cluster Tier Frame */}
            {(() => {
              const memberIds = indexers.filter(idx => !detachedNodeIds[idx.id]).map(idx => idx.id);
              const box = getTierBoundingBox(memberIds, { x: 330, y: 185, width: 450, height: 220, minWidth: 400 });
              const isDragging = draggingTierId === 'tier_indexer';
              return (
                <g transform={`translate(${box.x}, ${box.y})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width={box.width} 
                    height={box.height} 
                    rx="10" 
                    fill={isDragging ? "#d9770625" : "#1e293b15"} 
                    stroke={isDragging ? "#fbbf24" : "#d97706"} 
                    strokeWidth={isDragging ? "2.5" : "1.8"} 
                    strokeDasharray="6,4" 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_indexer', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_indexer', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_indexer', e);
                    }}
                  />
                  {/* Tier Header Drag Bar */}
                  <g 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_indexer', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_indexer', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_indexer', e);
                    }}
                  >
                    <rect x="12" y="-14" width={Math.min(270, box.width - 150)} height="22" rx="6" fill="#451a03" stroke="#d97706" strokeWidth="1.2" />
                    <text x="20" y="1" fontSize="9.5" fontWeight="800" fill="#f59e0b" letterSpacing="0.4">
                      ✥ INDEXING TIER ({memberIds.length}/{indexers.length} PEERS)
                    </text>
                  </g>
                  {/* Manage / Eject Nodes Button */}
                  <g 
                    transform={`translate(${box.width - 155}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClusterManagerModalTier('tier_indexer');
                    }}
                  >
                    <rect x="0" y="0" width="60" height="22" rx="6" fill="#18181b" stroke="#f59e0b" strokeWidth="1" />
                    <text x="30" y="14" fontSize="8.5" fontWeight="bold" fill="#f59e0b" textAnchor="middle">⚙ کلاستر</text>
                  </g>
                  {/* + Add Indexer Button */}
                  <g 
                    transform={`translate(${box.width - 90}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNode('indexer_peer');
                    }}
                  >
                    <rect x="0" y="0" width="82" height="22" rx="6" fill="#b45309" stroke="#fcd34d" strokeWidth="1" />
                    <text x="41" y="14" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">+ Indexer</text>
                  </g>
                </g>
              );
            })()}

            {/* 3. Parsing & Forwarding Tier Frame */}
            {(() => {
              const memberIds = heavyForwarders.filter(hf => !detachedNodeIds[hf.id]).map(hf => hf.id);
              const box = getTierBoundingBox(memberIds, { x: 350, y: 440, width: 390, height: 295, minWidth: 360 });
              const isDragging = draggingTierId === 'tier_forwarder';
              return (
                <g transform={`translate(${box.x}, ${box.y})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width={box.width} 
                    height={box.height} 
                    rx="10" 
                    fill={isDragging ? "#16a34a25" : "#1e293b15"} 
                    stroke={isDragging ? "#4ade80" : "#16a34a"} 
                    strokeWidth={isDragging ? "2.5" : "1.8"} 
                    strokeDasharray="6,4" 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_forwarder', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_forwarder', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_forwarder', e);
                    }}
                  />
                  {/* Tier Header Drag Bar */}
                  <g 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_forwarder', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_forwarder', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_forwarder', e);
                    }}
                  >
                    <rect x="12" y="-14" width={Math.min(270, box.width - 150)} height="22" rx="6" fill="#064e3b" stroke="#16a34a" strokeWidth="1.2" />
                    <text x="20" y="1" fontSize="9.5" fontWeight="800" fill="#4ade80" letterSpacing="0.4">
                      ✥ FORWARDING TIER ({memberIds.length}/{heavyForwarders.length} HF)
                    </text>
                  </g>
                  {/* Manage / Eject Nodes Button */}
                  <g 
                    transform={`translate(${box.width - 165}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClusterManagerModalTier('tier_forwarder');
                    }}
                  >
                    <rect x="0" y="0" width="60" height="22" rx="6" fill="#0f172a" stroke="#4ade80" strokeWidth="1" />
                    <text x="30" y="14" fontSize="8.5" fontWeight="bold" fill="#4ade80" textAnchor="middle">⚙ کلاستر</text>
                  </g>
                  {/* + Add Forwarder Button */}
                  <g 
                    transform={`translate(${box.width - 100}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNode('heavy_forwarder');
                    }}
                  >
                    <rect x="0" y="0" width="92" height="22" rx="6" fill="#15803d" stroke="#86efac" strokeWidth="1" />
                    <text x="46" y="14" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">+ Forwarder</text>
                  </g>
                </g>
              );
            })()}

            {/* 4. Log Sources Frame */}
            {(() => {
              const memberIds = logSources.filter(src => !detachedNodeIds[src.id]).map(src => src.id);
              const box = getTierBoundingBox(memberIds, { x: 20, y: 435, width: 280, height: 280, minWidth: 260 });
              const isDragging = draggingTierId === 'tier_sources';
              return (
                <g transform={`translate(${box.x}, ${box.y})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width={box.width} 
                    height={box.height} 
                    rx="10" 
                    fill={isDragging ? "#33415535" : "#1e293b10"} 
                    stroke={isDragging ? "#94a3b8" : "#475569"} 
                    strokeWidth={isDragging ? "2.5" : "1.5"} 
                    strokeDasharray="4,4" 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_sources', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_sources', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_sources', e);
                    }}
                  />
                  {/* Tier Header Drag Bar */}
                  <g 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_sources', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_sources', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_sources', e);
                    }}
                  >
                    <rect x="12" y="-14" width={Math.min(200, box.width - 100)} height="22" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                    <text x="20" y="1" fontSize="9.5" fontWeight="800" fill="#94a3b8" letterSpacing="0.4">
                      ✥ LOG SOURCES ({memberIds.length})
                    </text>
                  </g>
                  {/* + Add Source Button */}
                  <g 
                    transform={`translate(${box.width - 95}, -14)`} 
                    className="cursor-pointer hover:opacity-100 opacity-90 transition"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddLogSource();
                    }}
                  >
                    <rect x="0" y="0" width="85" height="22" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <text x="42" y="14" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">+ Source</text>
                  </g>
                </g>
              );
            })()}

            {/* 5. Management & License Tier Frame */}
            {(() => {
              const allMgmt = [...clusterManagers, ...deployers, ...deploymentServers, ...licenseMasters];
              const memberIds = allMgmt.filter(m => !detachedNodeIds[m.id]).map(m => m.id);
              const box = getTierBoundingBox(memberIds, { x: 860, y: 25, width: 325, height: 715, minWidth: 310 });
              const isDragging = draggingTierId === 'tier_mgmt';
              return (
                <g transform={`translate(${box.x}, ${box.y})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width={box.width} 
                    height={box.height} 
                    rx="10" 
                    fill={isDragging ? "#00f0ff18" : "#1e293b15"} 
                    stroke={isDragging ? "#38bdf8" : "#00f0ff"} 
                    strokeWidth={isDragging ? "2.5" : "1.8"} 
                    strokeDasharray="6,4" 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_mgmt', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_mgmt', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_mgmt', e);
                    }}
                  />
                  {/* Tier Header Drag Bar */}
                  <g 
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleStartDragTier('tier_mgmt', memberIds, e.clientX, e.clientY, e)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleStartDragTier('tier_mgmt', memberIds, e.touches[0].clientX, e.touches[0].clientY, e);
                    }}
                    onDoubleClick={(e) => {
                      handleDoubleClickTier('tier_mgmt', e);
                    }}
                  >
                    <rect x="12" y="-14" width={Math.min(270, box.width - 24)} height="22" rx="6" fill="#082f49" stroke="#00f0ff" strokeWidth="1.2" />
                    <text x="20" y="1" fontSize="9.5" fontWeight="800" fill="#00f0ff" letterSpacing="0.4">
                      ✥ MANAGEMENT TIER ({memberIds.length}/{allMgmt.length} NODES)
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* ============================================================== */}
            {/* DYNAMIC REAL-TIME CABLES / WIRES CONNECTED TO NODE POSITIONS */}
            {/* ============================================================== */}

            {/* 1. SOC Analysts -> Search Head (Web UI 8000) */}
            {(() => {
              const p1 = socAnchor;
              const p2 = shFirstAnchor;
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-soc-to-sh-8000')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-soc-to-sh-8000');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-soc-to-sh-8000',
                        title: 'SOC Users to Splunk Web UI',
                        portNumber: primaryWebPort,
                        protocol: 'HTTPS',
                        from: 'SOC Analysts & Users',
                        to: 'Search Head Cluster',
                        description: 'Interactive Splunk Web interface for SPL searching, SOC dashboards, and alerting on port 8000.',
                        associatedNode: searchHeads[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-soc-to-sh-8000') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-soc-to-sh-8000') ? "#7dd3fc" : "#38bdf8"}
                    strokeWidth={isWireSelected('wire-soc-to-sh-8000') ? "4.5" : "2.5"}
                    strokeDasharray={animatePackets ? "6,6" : "none"}
                    markerEnd="url(#arr-blue)"
                  />
                  {animatePackets && (
                    <circle r="4.5" fill="#38bdf8">
                      <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                  {/* Sleek on-wire port label without bulky box */}
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" fill="#38bdf8" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryWebPort} Web UI
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* 2. Search Head -> Indexers (REST Map-Reduce 8089) */}
            {searchHeads[0] && indexers.map((idx, i) => {
              const p1 = getNodeAnchor(searchHeads[0].id, 'bottom');
              const p2 = getNodeAnchor(idx.id, 'top');
              const pathD = `M ${p1.x} ${p1.y} C ${p1.x} ${(p1.y + p2.y)/2}, ${p2.x} ${(p1.y + p2.y)/2}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  key={`wire-sh-idx-${idx.id}`}
                  opacity={getWireOpacity('wire-sh-to-idx-8089')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-sh-to-idx-8089');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-sh-to-idx-8089',
                        title: 'Search REST Dispatch & Map-Reduce',
                        portNumber: primaryMgmtPort,
                        protocol: 'REST mTLS',
                        from: 'Search Heads',
                        to: 'Indexers',
                        description: 'Dispatches distributed search queries and gathers TSIDX / bucket results across port 8089.',
                        associatedNode: indexers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-sh-to-idx-8089') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-sh-to-idx-8089') ? "#38bdf8" : "#00d0ff"}
                    strokeWidth={isWireSelected('wire-sh-to-idx-8089') ? "4" : "2.5"}
                    strokeDasharray={animatePackets ? "5,5" : "none"}
                    markerEnd="url(#arr-cyan)"
                  />
                  {animatePackets && (
                    <circle r="4" fill="#00d0ff">
                      <animateMotion dur={`${1.7 + i * 0.2}s`} repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                  {i === 0 && (
                    <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                      <text x="0" y="-4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" fill="#00d0ff" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                        :{primaryMgmtPort} REST Search Dispatch
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 3. Indexer Peers Inter-Replication (9887) */}
            {indexers.length > 1 && (() => {
              const p1 = getNodeAnchor(indexers[0].id, 'right');
              const p2 = getNodeAnchor(indexers[1].id, 'left');
              const pathD = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-idx-rep-9887')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-idx-rep-9887');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-idx-rep-9887',
                        title: 'Indexer Peer Replication & Bucket Sync',
                        portNumber: primaryRepPort,
                        protocol: 'SplunkTCP Replication',
                        from: 'Indexer Peer 1',
                        to: 'Indexer Peer 2',
                        description: 'Syncs raw data slices and TSIDX index files for Replication Factor (RF) and Search Factor (SF) on port 9887.',
                        associatedNode: indexers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-idx-rep-9887') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-idx-rep-9887') ? "#fbbf24" : "#f59e0b"}
                    strokeWidth={isWireSelected('wire-idx-rep-9887') ? "4" : "2.5"}
                    strokeDasharray={animatePackets ? "4,4" : "none"}
                  />
                  {animatePackets && (
                    <circle r="4" fill="#f59e0b">
                      <animateMotion dur="1.3s" repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" fill="#f59e0b" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryRepPort} Peer Sync
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* 4. Heavy Forwarder -> Indexers (SplunkTCP 9997 S2S AutoLB) */}
            {heavyForwarders[0] && indexers.map((idx, i) => {
              const p1 = getNodeAnchor(heavyForwarders[0].id, 'top');
              const p2 = getNodeAnchor(idx.id, 'bottom');
              const pathD = `M ${p1.x} ${p1.y} C ${p1.x} ${(p1.y + p2.y)/2}, ${p2.x} ${(p1.y + p2.y)/2}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  key={`wire-hf-idx-${idx.id}`}
                  opacity={getWireOpacity('wire-hf-to-idx')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-hf-to-idx');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-hf-to-idx',
                        title: 'Heavy Forwarder to Indexer S2S Pipeline',
                        portNumber: primaryIdxPort,
                        protocol: 'SplunkTCP AutoLB',
                        from: 'Heavy Forwarder',
                        to: 'Indexer Cluster Peers',
                        description: 'Auto-load-balanced pipeline stream parsing, PII masking, and indexed event distribution over port 9997.',
                        associatedNode: indexers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-hf-to-idx') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-hf-to-idx') ? "#34d399" : "#10b981"}
                    strokeWidth={isWireSelected('wire-hf-to-idx') ? "4.5" : "3"}
                    strokeDasharray={animatePackets ? "6,6" : "none"}
                    markerEnd="url(#arr-green)"
                  />
                  {animatePackets && (
                    <circle r="4.5" fill="#34d399">
                      <animateMotion dur={`${1.6 + i * 0.2}s`} repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                  {i === 0 && (
                    <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                      <text x="0" y="-4" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#10b981" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                        :{primaryIdxPort} SplunkTCP (AutoLB)
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 5. Log Sources -> Heavy Forwarder Wires */}
            {logSources.map((src, i) => {
              const p1 = getNodeAnchor(src.id, 'right');
              const p2 = hfLeftAnchor;
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  key={`wire-src-${src.id}`}
                  opacity={getWireOpacity(src.wireId)}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId(src.wireId);
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: src.wireId,
                        title: `${src.title} Ingestion Stream`,
                        portNumber: src.portNum,
                        protocol: src.proto,
                        from: src.title,
                        to: 'Heavy Forwarder',
                        description: `Real-time ingestion stream sending events at ${src.eps} from ${src.ip} via ${src.proto} to port :${src.portNum}.`,
                        associatedNode: heavyForwarders[0]
                      }
                    });
                  }}
                  filter={isWireSelected(src.wireId) ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected(src.wireId) ? "#fbbf24" : src.color}
                    strokeWidth={isWireSelected(src.wireId) ? "4" : "2.2"}
                    strokeDasharray={animatePackets ? "6,6" : "none"}
                    markerEnd="url(#arr-amber)"
                  />
                  {animatePackets && (
                    <circle r="4" fill={src.color}>
                      <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" fill={src.color} stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      {src.portTag}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 6. Cluster Manager -> Indexers (8089 CM Heartbeat) */}
            {clusterManagers[0] && indexers[0] && (() => {
              const p1 = cmAnchor;
              const p2 = getNodeAnchor(indexers[0].id, 'right');
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-cm-to-idx-8089')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-cm-to-idx-8089');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-cm-to-idx-8089',
                        title: 'Cluster Manager to Indexers Heartbeat',
                        portNumber: primaryMgmtPort,
                        protocol: 'REST Heartbeat',
                        from: 'Cluster Manager (CM)',
                        to: 'Indexer Cluster Peers',
                        description: 'Monitors peer health, manages bucket fix-up tasks, and orchestrates rolling restarts.',
                        associatedNode: clusterManagers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-cm-to-idx-8089') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-cm-to-idx-8089') ? "#38bdf8" : "#00d0ff"}
                    strokeWidth={isWireSelected('wire-cm-to-idx-8089') ? "3.5" : "2"}
                    strokeDasharray="4,4"
                    markerEnd="url(#arr-cyan)"
                  />
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#00d0ff" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryMgmtPort} CM Heartbeat
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* 7. Deployer -> Search Heads (8181 SHC Bundle) */}
            {deployers[0] && searchHeads[0] && (() => {
              const p1 = depAnchor;
              const p2 = getNodeAnchor(searchHeads[0].id, 'right');
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-dep-to-sh-8181')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-dep-to-sh-8181');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-dep-to-sh-8181',
                        title: 'SHC Deployer to Search Heads Bundle Push',
                        portNumber: primaryShcPort,
                        protocol: 'HTTP/HTTPS App Bundle',
                        from: 'SHC Deployer',
                        to: 'Search Head Cluster Members',
                        description: 'Distributes custom apps, dashboards, and configurations via shcluster/apps bundle push.',
                        associatedNode: deployers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-dep-to-sh-8181') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-dep-to-sh-8181') ? "#c084fc" : "#a855f7"}
                    strokeWidth={isWireSelected('wire-dep-to-sh-8181') ? "3.5" : "2"}
                    strokeDasharray="4,4"
                    markerEnd="url(#arr-purple)"
                  />
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#a855f7" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryShcPort} SHC Bundle
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* 8. Deployment Server -> Forwarder (8089 PhoneHome) */}
            {deploymentServers[0] && heavyForwarders[0] && (() => {
              const p1 = dsAnchor;
              const p2 = getNodeAnchor(heavyForwarders[0].id, 'right');
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-ds-to-hf-8089')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-ds-to-hf-8089');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-ds-to-hf-8089',
                        title: 'Deployment Server to Forwarders PhoneHome',
                        portNumber: primaryMgmtPort,
                        protocol: 'REST / serverclass.conf',
                        from: 'Deployment Server (DS)',
                        to: 'Forwarder Fleet',
                        description: 'Distributes apps and inputs.conf updates to forwarders with automated reload cycles.',
                        associatedNode: deploymentServers[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-ds-to-hf-8089') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-ds-to-hf-8089') ? "#7dd3fc" : "#38bdf8"}
                    strokeWidth={isWireSelected('wire-ds-to-hf-8089') ? "3.5" : "2"}
                    strokeDasharray="4,4"
                    markerEnd="url(#arr-blue)"
                  />
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#38bdf8" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryMgmtPort} DS PhoneHome
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* 9. License Master -> Cluster (8089 LM Quota) */}
            {licenseMasters[0] && indexers[0] && (() => {
              const p1 = lmAnchor;
              const p2 = getNodeAnchor(indexers[0].id, 'right');
              const pathD = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x)/2} ${p1.y}, ${(p1.x + p2.x)/2} ${p2.y}, ${p2.x} ${p2.y}`;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  opacity={getWireOpacity('wire-lm-to-all-8089')}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId('wire-lm-to-all-8089');
                    setSpotlightTarget({
                      type: 'conduit_wire',
                      wire: {
                        id: 'wire-lm-to-all-8089',
                        title: 'License Master Central Quota Pool',
                        portNumber: primaryMgmtPort,
                        protocol: 'REST License Verification',
                        from: 'License Master (LM)',
                        to: 'All Cluster Members',
                        description: 'Enforces daily ingestion quota, tracks volume, and prevents license violation lockouts.',
                        associatedNode: licenseMasters[0]
                      }
                    });
                  }}
                  filter={isWireSelected('wire-lm-to-all-8089') ? 'url(#wire-glow)' : undefined}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isWireSelected('wire-lm-to-all-8089') ? "#34d399" : "#10b981"}
                    strokeWidth={isWireSelected('wire-lm-to-all-8089') ? "3.5" : "2"}
                    strokeDasharray="4,4"
                    markerEnd="url(#arr-green)"
                  />
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                    <text x="0" y="-4" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#10b981" stroke="#020617" strokeWidth="3" paintOrder="stroke fill" textAnchor="middle">
                      :{primaryMgmtPort} LM Quota
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* ============================================================== */}
            {/* DRAGGABLE NODE CHASSIS CARDS WITH RACK EARS & DELETE BUTTONS */}
            {/* ============================================================== */}

            {/* 1. SOC ANALYSTS CARD */}
            {(() => {
              const pos = getNodePos('soc_users');
              return (
                <g 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag('soc_users', e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag('soc_users', e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode('soc_users');
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'soc_users' });
                  }}
                >
                  <rect x="0" y="0" width={pos.width} height={pos.height} rx="10" fill="#0f172a" stroke="#0284c7" strokeWidth="1.8" filter="url(#blade-shadow)" />
                  <circle cx="20" cy="25" r="10" fill="#0284c7" opacity="0.3" />
                  <circle cx="20" cy="25" r="4" fill="#38bdf8" />
                  <text x="38" y="28" fontSize="12" fontWeight="bold" fill="#ffffff">SOC Analysts &amp; Users</text>
                  <text x="38" y="46" fontSize="10" fontFamily="monospace" fill="#94a3b8">
                    {sizingInputs.socAnalysts?.length || 4} Analysts • {sizingInputs.searchUsers} Concurrency
                  </text>
                  <text x="38" y="66" fontSize="9.5" fontWeight="bold" fill="#38bdf8">
                    Port :8000 Web UI (SPL / Dashboards)
                  </text>
                  <text x="38" y="84" fontSize="9" fontFamily="monospace" fill="#10b981">
                    ✥ Drag • 🔍 Double-Click to inspect
                  </text>
                </g>
              );
            })()}

            {/* 2. DYNAMIC SEARCH HEAD NODES */}
            {searchHeads.map((sh) => {
              const pos = getNodePos(sh.id);
              const isSelected = selectedNodeId === sh.id;
              const isDetached = !!detachedNodeIds[sh.id];

              return (
                <g 
                  key={sh.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(sh.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(sh.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(sh.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: sh });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#0c2444" : isDetached ? "#171206" : "#0f172a"} 
                    stroke={isSelected ? "#38bdf8" : isDetached ? "#f59e0b" : "#0284c7"} 
                    strokeWidth={isDetached ? "2" : "2"} 
                    strokeDasharray={isDetached ? "5,3" : undefined}
                    filter="url(#blade-shadow)" 
                  />
                  {/* Rack ears */}
                  <rect x="-4" y="10" width="4" height={pos.height - 20} fill="#334155" rx="1.5" />
                  <rect x={pos.width} y="10" width="4" height={pos.height - 20} fill="#334155" rx="1.5" />
                  
                  {/* Server Header */}
                  <circle cx="16" cy="20" r="4" fill={isDetached ? "#f59e0b" : "#38bdf8"} />
                  <circle cx="26" cy="20" r="4" fill="#10b981" />
                  <text x="36" y="24" fontSize="11" fontWeight="bold" fill="#ffffff">{sh.hostname.split('.')[0]}</text>
                  <text x="16" y="42" fontSize="9" fontFamily="monospace" fill={isDetached ? "#fbbf24" : "#60a5fa"}>{sh.ip} • {sh.cpuCores}c/{sh.ramGB}G</text>
                  
                  {/* Port Badges inside SH - dynamic responsive width */}
                  {(() => {
                    const badgeW = Math.min(65, Math.max(48, (pos.width - 38) / 2));
                    return (
                      <g transform="translate(14, 52)">
                        <g onClick={(e) => handleInspectPort(primaryWebPort, sh, 'wire-soc-to-sh-8000', e)} className="cursor-pointer">
                          <rect x="0" y="0" width={badgeW} height="18" rx="4" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
                          <text x={badgeW / 2} y="12" fontSize="8" fontWeight="bold" fill="#38bdf8" textAnchor="middle">:{sh.assignedPorts?.splunkWeb || 8000}</text>
                        </g>
                        <g transform={`translate(${badgeW + 8}, 0)`} onClick={(e) => handleInspectPort(primaryMgmtPort, sh, 'wire-sh-to-idx-8089', e)} className="cursor-pointer">
                          <rect x="0" y="0" width={badgeW} height="18" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                          <text x={badgeW / 2} y="12" fontSize="8" fontWeight="bold" fill="#a5b4fc" textAnchor="middle">:{sh.assignedPorts?.splunkMgmt || 8089}</text>
                        </g>
                      </g>
                    );
                  })()}

                  {/* Detached / Eject Status Badge */}
                  {isDetached && (
                    <g 
                      transform="translate(14, 76)"
                      className="cursor-pointer hover:opacity-100 opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNodeClusterMembership(sh.id);
                      }}
                    >
                      <rect x="0" y="0" width={Math.min(100, pos.width - 28)} height="16" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                      <text x={Math.min(100, pos.width - 28) / 2} y="11" fontSize="7.5" fontWeight="bold" fill="#fcd34d" textAnchor="middle">🔓 مستقل (پیوستن)</text>
                    </g>
                  )}

                  {/* Pop-Out / Rejoin Toggle Icon in Top Right */}
                  <g 
                    transform={`translate(${pos.width - 42}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNodeClusterMembership(sh.id);
                    }}
                  >
                    <title>{isDetached ? "Rejoin Search Tier" : "Eject from Search Tier"}</title>
                    <rect x="0" y="0" width="18" height="16" rx="4" fill={isDetached ? "#065f46" : "#1e293b"} stroke={isDetached ? "#34d399" : "#64748b"} strokeWidth="1" />
                    <text x="9" y="11" fontSize="9" fontWeight="bold" fill={isDetached ? "#6ee7b7" : "#cbd5e1"} textAnchor="middle">{isDetached ? "↵" : "⏏"}</text>
                  </g>

                  {/* Delete Button (Top Right) */}
                  <g 
                    transform={`translate(${pos.width - 20}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(sh.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 3. DYNAMIC INDEXER PEER NODES */}
            {indexers.map((idx) => {
              const pos = getNodePos(idx.id);
              const isSelected = selectedNodeId === idx.id;
              const isDetached = !!detachedNodeIds[idx.id];

              return (
                <g 
                  key={idx.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(idx.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(idx.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(idx.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: idx });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#451a03" : isDetached ? "#1c120c" : "#0f172a"} 
                    stroke={isSelected ? "#f59e0b" : isDetached ? "#fb923c" : "#d97706"} 
                    strokeWidth="2" 
                    strokeDasharray={isDetached ? "5,3" : undefined}
                    filter="url(#blade-shadow)" 
                  />
                  {/* Rack ears */}
                  <rect x="-4" y="8" width="4" height={pos.height - 16} fill="#334155" rx="1.5" />
                  <rect x={pos.width} y="8" width="4" height={pos.height - 16} fill="#334155" rx="1.5" />
                  
                  {/* Drive Bays */}
                  {pos.height > 100 && [14, 38, 62].map((by, bIdx) => (
                    <g key={`idx-${idx.id}-b-${bIdx}`} transform={`translate(10, ${by})`}>
                      <rect x="0" y="0" width={pos.width - 20} height="16" rx="3" fill="#090d16" stroke="#334155" strokeWidth="1" />
                      <circle cx="8" cy="8" r="2.5" fill="#10b981" />
                      <circle cx="16" cy="8" r="2.5" fill="#38bdf8" />
                      <line x1="24" y1="8" x2={pos.width - 28} y2="8" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                    </g>
                  ))}

                  <text x={pos.width / 2} y={pos.height > 100 ? 98 : 22} fontSize="10.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                    {idx.hostname.split('.')[0]}
                  </text>
                  <text x={pos.width / 2} y={pos.height > 100 ? 114 : 38} fontSize="8.5" fontFamily="monospace" fill="#fcd34d" textAnchor="middle">
                    {idx.ip}:{idx.assignedPorts?.splunkTcp || 9997}
                  </text>
                  <text x={pos.width / 2} y={pos.height > 100 ? 130 : 54} fontSize="8" fontFamily="monospace" fill="#34d399" textAnchor="middle">
                    {idx.cpuCores}c • {idx.ramGB}G • {idx.storageNVMeGB}G
                  </text>

                  {/* Pop-Out / Rejoin Toggle Icon */}
                  <g 
                    transform={`translate(${pos.width - 38}, 5)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNodeClusterMembership(idx.id);
                    }}
                  >
                    <title>{isDetached ? "Rejoin Indexer Cluster" : "Eject from Indexer Cluster"}</title>
                    <rect x="0" y="0" width="16" height="15" rx="3" fill={isDetached ? "#065f46" : "#1e293b"} stroke={isDetached ? "#34d399" : "#64748b"} strokeWidth="1" />
                    <text x="8" y="11" fontSize="9" fontWeight="bold" fill={isDetached ? "#6ee7b7" : "#cbd5e1"} textAnchor="middle">{isDetached ? "↵" : "⏏"}</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 18}, 5)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(idx.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 4. DYNAMIC HEAVY FORWARDERS */}
            {heavyForwarders.map((hf) => {
              const pos = getNodePos(hf.id);
              const isSelected = selectedNodeId === hf.id;
              const isDetached = !!detachedNodeIds[hf.id];

              return (
                <g 
                  key={hf.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(hf.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(hf.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(hf.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: hf });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#064e3b" : isDetached ? "#141d13" : "#0f172a"} 
                    stroke={isSelected ? "#10b981" : isDetached ? "#4ade80" : "#16a34a"} 
                    strokeWidth="2" 
                    strokeDasharray={isDetached ? "5,3" : undefined}
                    filter="url(#blade-shadow)" 
                  />
                  <rect x="-4" y="15" width="4" height={pos.height - 30} fill="#334155" rx="1.5" />
                  <rect x={pos.width} y="15" width="4" height={pos.height - 30} fill="#334155" rx="1.5" />

                  <circle cx="18" cy="20" r="4.5" fill={isDetached ? "#4ade80" : "#10b981"} />
                  <circle cx="30" cy="20" r="4.5" fill="#38bdf8" />
                  <text x="42" y="24" fontSize="11.5" fontWeight="bold" fill="#ffffff">
                    HF ({hf.hostname.split('.')[0]})
                  </text>
                  <text x="42" y="38" fontSize="9" fontFamily="monospace" fill="#6ee7b7">
                    {hf.ip} • {hf.cpuCores}c/{hf.ramGB}GB
                  </text>

                  {/* Pop-Out / Rejoin Toggle Icon */}
                  <g 
                    transform={`translate(${pos.width - 42}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNodeClusterMembership(hf.id);
                    }}
                  >
                    <title>{isDetached ? "Rejoin Forwarding Tier" : "Eject from Forwarding Tier"}</title>
                    <rect x="0" y="0" width="18" height="16" rx="4" fill={isDetached ? "#065f46" : "#1e293b"} stroke={isDetached ? "#34d399" : "#64748b"} strokeWidth="1" />
                    <text x="9" y="11" fontSize="9" fontWeight="bold" fill={isDetached ? "#6ee7b7" : "#cbd5e1"} textAnchor="middle">{isDetached ? "↵" : "⏏"}</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 20}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(hf.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>

                  {/* Pipeline blocks - dynamic stage width */}
                  {(() => {
                    const pad = 12;
                    const availW = pos.width - pad * 2;
                    const stageW = Math.max(60, (availW - 16) / 3);
                    return (
                      <g transform={`translate(${pad}, 48)`}>
                        {/* 1. INGEST */}
                        <rect x="0" y="0" width={stageW} height="58" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                        <text x={stageW / 2} y="14" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">INGEST</text>
                        <text x={stageW / 2} y="27" fontSize="7" fill="#f59e0b" textAnchor="middle">514/1514</text>
                        <text x={stageW / 2} y="39" fontSize="7" fill="#a855f7" textAnchor="middle">:{hf.assignedPorts?.hecPort || 8088}</text>
                        <text x={stageW / 2} y="51" fontSize="7" fill="#10b981" textAnchor="middle">:9997 TCP</text>

                        {/* 2. PARSING */}
                        <rect x={stageW + 8} y="0" width={stageW} height="58" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                        <text x={stageW + 8 + stageW / 2} y="14" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">PARSING</text>
                        <text x={stageW + 8 + stageW / 2} y="27" fontSize="7" fill="#38bdf8" textAnchor="middle">props.conf</text>
                        <text x={stageW + 8 + stageW / 2} y="39" fontSize="7" fill="#38bdf8" textAnchor="middle">LineBreaker</text>
                        <text x={stageW + 8 + stageW / 2} y="51" fontSize="7" fill="#f59e0b" textAnchor="middle">PII Mask</text>

                        {/* 3. OUTPUT */}
                        <rect x={(stageW + 8) * 2} y="0" width={stageW} height="58" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                        <text x={(stageW + 8) * 2 + stageW / 2} y="14" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">OUTPUT</text>
                        <text x={(stageW + 8) * 2 + stageW / 2} y="30" fontSize="7" fill="#10b981" textAnchor="middle">AutoLB 15s</text>
                        <text x={(stageW + 8) * 2 + stageW / 2} y="44" fontSize="7" fill="#10b981" textAnchor="middle">TLS 1.3 mTLS</text>
                      </g>
                    );
                  })()}

                  {/* Throughput banner */}
                  <g transform="translate(12, 116)">
                    <rect x="0" y="0" width={pos.width - 24} height="32" rx="5" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x={(pos.width - 24) / 2} y="14" fontSize="8.5" fontWeight="bold" fill="#a7f3d0" textAnchor="middle">
                      Ingest: {sizingInputs.dailyVolumeGB} GB / Day
                    </text>
                    <text x={(pos.width - 24) / 2} y="26" fontSize="7.5" fontFamily="monospace" fill="#6ee7b7" textAnchor="middle">
                      Throughput: {sizingResult.dailyIngestRateMBs} MB/s
                    </text>
                  </g>

                  <g transform="translate(14, 160)">
                    <text x="0" y="12" fontSize="7.5" fontFamily="monospace" fill="#94a3b8">Ingest: 514, 1514, {hf.assignedPorts?.hecPort || 8088}, 9997</text>
                    <text x="0" y="24" fontSize="7.5" fontFamily="monospace" fill="#38bdf8">tcpout: AutoLB to {indexers.length} Indexers</text>
                    <text x="0" y="36" fontSize="7.5" fontFamily="monospace" fill="#10b981">✥ Drag to move</text>
                  </g>
                </g>
              );
            })}

            {/* 5. DYNAMIC LOG SOURCES */}
            {logSources.map((src) => {
              const pos = getNodePos(src.id);

              return (
                <g 
                  key={src.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(src.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(src.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(src.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'log_source', logSource: src });
                  }}
                >
                  <rect x="0" y="0" width={pos.width} height={pos.height} rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
                  <circle cx="16" cy={pos.height / 2} r="5" fill={src.color} />
                  <text x="28" y={pos.height / 2 - 4} fontSize="9.5" fontWeight="bold" fill="#ffffff">{src.title}</text>
                  <text x="28" y={pos.height / 2 + 10} fontSize="8" fontFamily="monospace" fill="#94a3b8">
                    {src.ip} → <tspan fill={src.color}>{src.proto}</tspan> ({src.eps})
                  </text>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 24}, ${pos.height / 2 - 9})`}
                    className="cursor-pointer hover:opacity-100 opacity-70"
                    onClick={(e) => handleRemoveLogSource(src.id, e)}
                  >
                    <circle cx="9" cy="9" r="8" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="9" y="12" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 6. CLUSTER MANAGERS */}
            {clusterManagers.map((cm) => {
              const pos = getNodePos(cm.id);
              const isSelected = selectedNodeId === cm.id;

              return (
                <g 
                  key={cm.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(cm.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(cm.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(cm.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: cm });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#0c2444" : "#0f172a"} 
                    stroke={isSelected ? "#00f0ff" : "#0284c7"} 
                    strokeWidth="1.8" 
                    filter="url(#blade-shadow)" 
                  />
                  <circle cx="18" cy="20" r="5" fill="#00f0ff" className="animate-pulse" />
                  <text x="32" y="24" fontSize="11.5" fontWeight="bold" fill="#ffffff">Cluster Master (CM)</text>
                  <text x="32" y="40" fontSize="9" fontFamily="monospace" fill="#60a5fa">{cm.hostname} ({cm.ip})</text>
                  
                  <g transform="translate(32, 50)">
                    <rect x="0" y="0" width={pos.width - 48} height="32" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    <text x={(pos.width - 48) / 2} y="14" fontSize="8.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
                      RF={sizingInputs.replicationFactor}, SF={sizingInputs.searchFactor}
                    </text>
                    <text x={(pos.width - 48) / 2} y="26" fontSize="8" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
                      Peer Health &amp; Discovery
                    </text>
                  </g>

                  <g transform="translate(32, 92)">
                    <text x="0" y="12" fontSize="8.5" fontFamily="monospace" fill="#00f0ff">Port :{cm.assignedPorts?.splunkMgmt || 8089} CM REST</text>
                    <text x="0" y="24" fontSize="8.5" fontFamily="monospace" fill="#34d399">Quorum: {sizingInputs.sitesCount || 2} Sites Sized</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 22}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(cm.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 7. SHC DEPLOYERS */}
            {deployers.map((dep) => {
              const pos = getNodePos(dep.id);
              const isSelected = selectedNodeId === dep.id;

              return (
                <g 
                  key={dep.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(dep.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(dep.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(dep.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: dep });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#3b0764" : "#0f172a"} 
                    stroke={isSelected ? "#a855f7" : "#7e22ce"} 
                    strokeWidth="1.8" 
                    filter="url(#blade-shadow)" 
                  />
                  <circle cx="18" cy="20" r="5" fill="#a855f7" />
                  <text x="32" y="24" fontSize="11.5" fontWeight="bold" fill="#ffffff">SHC Deployer</text>
                  <text x="32" y="40" fontSize="9" fontFamily="monospace" fill="#c084fc">{dep.hostname} ({dep.ip})</text>
                  
                  <g transform="translate(32, 48)">
                    <rect x="0" y="0" width={pos.width - 48} height="26" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    <text x={(pos.width - 48) / 2} y="17" fontSize="8.5" fontWeight="bold" fill="#d8b4fe" textAnchor="middle">
                      shcluster/apps Bundle Push
                    </text>
                  </g>

                  <g transform="translate(32, 88)">
                    <text x="0" y="12" fontSize="8.5" fontFamily="monospace" fill="#a855f7">Port :{dep.assignedPorts?.splunkMgmt || 8089} Distribution</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 22}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(dep.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 8. DEPLOYMENT SERVERS */}
            {deploymentServers.map((ds) => {
              const pos = getNodePos(ds.id);
              const isSelected = selectedNodeId === ds.id;

              return (
                <g 
                  key={ds.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(ds.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(ds.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(ds.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: ds });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#0c4a6e" : "#0f172a"} 
                    stroke={isSelected ? "#38bdf8" : "#0284c7"} 
                    strokeWidth="1.8" 
                    filter="url(#blade-shadow)" 
                  />
                  <circle cx="18" cy="20" r="5" fill="#38bdf8" />
                  <text x="32" y="24" fontSize="11.5" fontWeight="bold" fill="#ffffff">Deployment Server (DS)</text>
                  <text x="32" y="40" fontSize="9" fontFamily="monospace" fill="#93c5fd">{ds.hostname} ({ds.ip})</text>
                  
                  <g transform="translate(32, 48)">
                    <rect x="0" y="0" width={pos.width - 48} height="26" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    <text x={(pos.width - 48) / 2} y="17" fontSize="8.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
                      serverclass.conf Management
                    </text>
                  </g>

                  <g transform="translate(32, 88)">
                    <text x="0" y="12" fontSize="8.5" fontFamily="monospace" fill="#38bdf8">Port :{ds.assignedPorts?.splunkMgmt || 8089} PhoneHome 60s</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 22}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(ds.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

            {/* 9. LICENSE MASTERS */}
            {licenseMasters.map((lm) => {
              const pos = getNodePos(lm.id);
              const isSelected = selectedNodeId === lm.id;

              return (
                <g 
                  key={lm.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseDown={(e) => handleStartDrag(lm.id, e.clientX, e.clientY, e)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleStartDrag(lm.id, e.touches[0].clientX, e.touches[0].clientY, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(lm.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSpotlightTarget({ type: 'node', node: lm });
                  }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={pos.width} 
                    height={pos.height} 
                    rx="10" 
                    fill={isSelected ? "#064e3b" : "#0f172a"} 
                    stroke={isSelected ? "#10b981" : "#059669"} 
                    strokeWidth="1.8" 
                    filter="url(#blade-shadow)" 
                  />
                  <circle cx="18" cy="20" r="5" fill="#10b981" className="animate-pulse" />
                  <text x="32" y="24" fontSize="11.5" fontWeight="bold" fill="#ffffff">License Master (LM)</text>
                  <text x="32" y="40" fontSize="9" fontFamily="monospace" fill="#6ee7b7">{lm.hostname} ({lm.ip})</text>
                  
                  {/* Gauge Meter */}
                  <g transform="translate(32, 50)">
                    <rect x="0" y="0" width={pos.width - 48} height="55" rx="6" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    <circle cx="30" cy="27" r="18" fill="none" stroke="#1e293b" strokeWidth="4.5" />
                    <circle cx="30" cy="27" r="18" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="80,120" />
                    <text x="30" y="31" fontSize="9.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">{sizingInputs.dailyVolumeGB}</text>
                    <text x="60" y="22" fontSize="10.5" fontWeight="bold" fill="#10b981">${sizingResult.licenseCost.estimatedAnnualLicenseUSD.toLocaleString()} / yr</text>
                    <text x="60" y="38" fontSize="8.5" fontFamily="monospace" fill="#94a3b8">${sizingResult.licenseCost.costPerGBYearUSD}/GB Ingest Rate</text>
                  </g>

                  <g transform="translate(32, 118)">
                    <text x="0" y="12" fontSize="8.5" fontFamily="monospace" fill="#10b981">Port :{lm.assignedPorts?.splunkMgmt || 8089} Heartbeat</text>
                    <text x="0" y="26" fontSize="8" fontFamily="monospace" fill="#94a3b8">Support: {sizingInputs.licenseSupportLevel || '24x7 Enterprise'}</text>
                    <text x="0" y="40" fontSize="8.5" fontWeight="bold" fill="#f59e0b">Est. 3-Year TCO: ${sizingResult.licenseCost.estimated3YearTcoUSD.toLocaleString()}</text>
                  </g>

                  {/* Delete Button */}
                  <g 
                    transform={`translate(${pos.width - 22}, 6)`}
                    className="cursor-pointer hover:opacity-100 opacity-80"
                    onClick={(e) => onRemoveNode(lm.id, e)}
                  >
                    <circle cx="7" cy="7" r="7" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                    <text x="7" y="10" fontSize="8" fontWeight="bold" fill="#fecdd3" textAnchor="middle">✕</text>
                  </g>
                </g>
              );
            })}

          </svg>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SCHEMATIC CARD GRID (VIEW MODE: SCHEMATIC GRID) */}
      {/* ========================================================================= */}
      {viewMode === 'schematic_grid' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
          {/* LEFT COLUMN: CLIENT USERS & LOG SOURCES */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-6">
            <div 
              onClick={() => handleOpenArchitect('sh_soc')}
              className="p-4 rounded-xl bg-slate-900/90 border border-sky-600/60 hover:border-cyan-400 shadow-xl flex flex-col gap-3 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 group-hover:bg-cyan-950 transition">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{isFa ? 'کاربران و تحلیل‌گران SOC' : 'SOC Analysts & Users'}</h4>
                    <p className="text-xs text-slate-400 font-mono">{sizingInputs.socAnalysts?.length || 4} Analysts • {sizingInputs.searchUsers} Concurrency</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-xs border border-sky-800">
                  Port :8000
                </span>
              </div>
            </div>

            {/* Log Sources Box */}
            <div className="p-4 rounded-2xl bg-[#111624]/90 border-2 border-dashed border-slate-700/80 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-400 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>LOG SOURCES &amp; SENSORS</span>
                </span>
                <button
                  onClick={handleAddLogSource}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Source</span>
                </button>
              </div>

              <div className="space-y-2">
                {logSources.map(src => (
                  <div
                    key={src.id}
                    onClick={(e) => handleInspectPort(src.portNum, heavyForwarders[0], src.wireId, e)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/80 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{src.title}</h5>
                      <p className="text-[10px] font-mono text-slate-400">{src.ip} • <tspan className="text-amber-400">{src.proto}</tspan></p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-cyan-300">{src.portTag}</span>
                      <button onClick={(e) => handleRemoveLogSource(src.id, e)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: SEARCH HEADS & INDEXERS & HEAVY FORWARDERS */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            {/* Search Heads Grid */}
            <div className="p-4 rounded-2xl bg-[#0b1626]/90 border-2 border-dashed border-sky-500/70 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-sky-900/40 pb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-sky-400 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>SEARCH &amp; ANALYTICS TIER (SHC)</span>
                </span>
                <button
                  onClick={() => onAddNode('search_head')}
                  className="px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-800 text-sky-300 text-[10px] font-mono flex items-center gap-1 border border-sky-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Search Head</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchHeads.map(sh => (
                  <div
                    key={sh.id}
                    onClick={() => handleOpenNodeConfig(sh)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white">{sh.hostname}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{sh.ip} • {sh.cpuCores}c/{sh.ramGB}GB • Web: 8000, REST: 8089</p>
                    </div>
                    <button
                      onClick={(e) => onRemoveNode(sh.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Indexers Grid */}
            <div className="p-4 rounded-2xl bg-[#140e08]/90 border-2 border-dashed border-amber-500/70 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-amber-400 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>INDEXING PEER CLUSTER TIER</span>
                </span>
                <button
                  onClick={() => onAddNode('indexer_peer')}
                  className="px-2 py-0.5 rounded bg-amber-950 hover:bg-amber-800 text-amber-300 text-[10px] font-mono flex items-center gap-1 border border-amber-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Indexer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {indexers.map(idx => (
                  <div
                    key={idx.id}
                    onClick={() => handleOpenNodeConfig(idx)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 transition cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-mono font-bold text-white">{idx.hostname.split('.')[0]}</h5>
                      <button
                        onClick={(e) => onRemoveNode(idx.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">{idx.ip}:9997 • {idx.cpuCores}c/{idx.ramGB}GB</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Heavy Forwarders Grid */}
            <div className="p-4 rounded-2xl bg-[#06140e]/90 border-2 border-dashed border-emerald-500/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>PARSING &amp; FORWARDING TIER</span>
                </span>
                <button
                  onClick={() => onAddNode('heavy_forwarder')}
                  className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 text-[10px] font-mono flex items-center gap-1 border border-emerald-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Forwarder</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {heavyForwarders.map(hf => (
                  <div 
                    key={hf.id}
                    onClick={() => handleOpenNodeConfig(hf)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-mono font-bold text-white">{hf.hostname}</h5>
                      <p className="text-[10px] font-mono text-slate-400">{hf.ip} • 514/1514/8088/9997</p>
                    </div>
                    <button
                      onClick={(e) => onRemoveNode(hf.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MANAGEMENT TIER */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-4">
            <div className="p-4 rounded-2xl bg-[#09111c]/90 border-2 border-dashed border-cyan-500/60 shadow-2xl space-y-4">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 block border-b border-cyan-900/40 pb-2">
                MANAGEMENT &amp; LICENSE TIER
              </span>

              {clusterManagers.map(cm => (
                <div key={cm.id} onClick={() => handleOpenNodeConfig(cm)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-mono font-bold text-white">Cluster Master (CM)</h5>
                    <button onClick={(e) => onRemoveNode(cm.id, e)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">{cm.hostname} ({cm.ip})</p>
                </div>
              ))}

              {deployers.map(dep => (
                <div key={dep.id} onClick={() => handleOpenNodeConfig(dep)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-400 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-mono font-bold text-white">SHC Deployer</h5>
                    <button onClick={(e) => onRemoveNode(dep.id, e)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">{dep.hostname} ({dep.ip})</p>
                </div>
              ))}

              {deploymentServers.map(ds => (
                <div key={ds.id} onClick={() => handleOpenNodeConfig(ds)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-400 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-mono font-bold text-white">Deployment Server</h5>
                    <button onClick={(e) => onRemoveNode(ds.id, e)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">{ds.hostname} ({ds.ip})</p>
                </div>
              ))}

              {licenseMasters.map(lm => (
                <div key={lm.id} onClick={() => handleOpenNodeConfig(lm)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-400 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-mono font-bold text-white">License Master (LM)</h5>
                    <button onClick={(e) => onRemoveNode(lm.id, e)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">{lm.hostname} ({lm.ip})</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE DYNAMIC PORT INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {inspectedPort && (
        <SplunkPortInspectorModal
          portNumber={inspectedPort.portNumber}
          associatedNode={inspectedPort.node}
          allNodes={assets}
          onClose={() => {
            setInspectedPort(null);
          }}
          onUpdatePortNumber={handleUpdatePortNumber}
          lang={lang}
        />
      )}

      {/* ========================================================================= */}
      {/* DEDICATED NODE DEEP CONFIGURATOR & SEQUENCE WARNING MODAL */}
      {/* ========================================================================= */}
      {configuringNode && (
        <SplunkNodeConfigModal
          node={configuringNode}
          allNodes={assets}
          onClose={() => setConfiguringNode(null)}
          onUpdateNode={onUpdateNode}
          onSelectNode={(id) => {
            const nextNode = assets.find(a => a.id === id);
            if (nextNode) setConfiguringNode(nextNode);
            onSelectNode(id);
          }}
          sizingInputs={sizingInputs}
          sizingResult={sizingResult}
          lang={lang}
        />
      )}

      {/* ========================================================================= */}
      {/* MAGNIFIED SHAPE SPOTLIGHT & QUICK SETTINGS MODAL */}
      {/* ========================================================================= */}
      {spotlightTarget && (
        <SplunkNodeSpotlightModal
          target={spotlightTarget}
          onClose={() => setSpotlightTarget(null)}
          onOpenSettings={handleOpenSpotlightSettings}
          onRemoveNode={(nodeId) => {
            onRemoveNode(nodeId);
            setSpotlightTarget(null);
          }}
          onInspectPort={(portNumber, node) => {
            handleInspectPort(portNumber, node);
            setSpotlightTarget(null);
          }}
          sizingInputs={sizingInputs}
          sizingResult={sizingResult}
          lang={lang}
        />
      )}

      {/* ========================================================================= */}
      {/* SENIOR SPLUNK ENTERPRISE ARCHITECT INTERACTIVE MODAL */}
      {/* ========================================================================= */}
      <SplunkArchitectAssistantModal
        isOpen={isArchitectModalOpen}
        onClose={() => setIsArchitectModalOpen(false)}
        activeTab={architectActiveTab}
        onTabChange={setArchitectActiveTab}
        sizingInputs={sizingInputs}
        onUpdateSizingInputs={onUpdateSizingInputs}
        sizingResult={sizingResult}
        assets={assets}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        onUpdateNode={onUpdateNode}
        lang={lang}
      />

      {/* ========================================================================= */}
      {/* CLUSTER MEMBERSHIP & RE-PARENTING MODAL (خروج/ورود نود از کلاستر) */}
      {/* ========================================================================= */}
      {clusterManagerModalTier && (() => {
        const tierLabels: Record<string, { title: string; subtitle: string; color: string; nodes: any[]; defaultRole: ServerAssetNode['role'] }> = {
          tier_search: {
            title: 'Search & Analytics Tier (SHC)',
            subtitle: 'کلاستر جستجو و آنالیز اسپلانک',
            color: 'text-sky-400 border-sky-500/50',
            nodes: searchHeads,
            defaultRole: 'search_head'
          },
          tier_indexer: {
            title: 'Indexing Peer Cluster Tier',
            subtitle: 'کلاستر ذخیره‌سازی و ایندکس اسپلانک',
            color: 'text-amber-400 border-amber-500/50',
            nodes: indexers,
            defaultRole: 'indexer_peer'
          },
          tier_forwarder: {
            title: 'Parsing & Forwarding Tier (HF)',
            subtitle: 'لایه دریافت، فیلترینگ و ارسال سنگین',
            color: 'text-emerald-400 border-emerald-500/50',
            nodes: heavyForwarders,
            defaultRole: 'heavy_forwarder'
          },
          tier_sources: {
            title: 'Log Sources Fleet',
            subtitle: 'منابع و ارسال‌کننده‌های داده و لاگ',
            color: 'text-slate-300 border-slate-600/50',
            nodes: logSources,
            defaultRole: 'heavy_forwarder'
          },
          tier_mgmt: {
            title: 'Management & License Master Tier',
            subtitle: 'سرورهای مدیریت متمرکز و لایسنسینگ',
            color: 'text-cyan-400 border-cyan-500/50',
            nodes: [...clusterManagers, ...deployers, ...deploymentServers, ...licenseMasters],
            defaultRole: 'cluster_manager'
          }
        };

        const currentTierInfo = tierLabels[clusterManagerModalTier] || {
          title: 'Cluster Tier Management',
          subtitle: 'مدیریت اعضای کلاستر',
          color: 'text-sky-400 border-sky-500/50',
          nodes: assets,
          defaultRole: 'search_head'
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>مدیریت نودها و کادر کلاستر:</span>
                      <span className={currentTierInfo.color.split(' ')[0]}>{currentTierInfo.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentTierInfo.subtitle} • برای خروج نود از این کادر یا ورود به کلاستر دیگر کلیک کنید.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setClusterManagerModalTier(null)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instructions Bar */}
              <div className="px-5 py-3 bg-sky-950/30 border-b border-sky-900/30 flex items-center gap-2 text-xs text-sky-300">
                <Layers className="w-4 h-4 shrink-0 text-sky-400" />
                <span>
                  با خروج نود از کلاستر، کادر دور کلاستر به طور خودکار کوچیک شده و نود بدون محدودیت در هر کجای صفحه آزادانه قابل جابجایی است.
                </span>
              </div>

              {/* Node List */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {currentTierInfo.nodes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    هیچ نودی در این کلاستر موجود نیست.
                  </div>
                ) : (
                  currentTierInfo.nodes.map(node => {
                    const isDetached = !!detachedNodeIds[node.id];
                    return (
                      <div
                        key={node.id}
                        onDoubleClick={() => handleToggleNodeClusterMembership(node.id)}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDetached 
                            ? 'bg-amber-950/20 border-amber-600/40 hover:border-amber-500' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg border ${
                            isDetached ? 'bg-amber-950 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-sky-400 border-slate-700'
                          }`}>
                            {isDetached ? <Unlock className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold font-mono text-white">
                                {node.hostname || node.title || node.id}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isDetached 
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              }`}>
                                {isDetached ? '🔓 خارج از کادر کلاستر (مستقل)' : '✓ عضو فعال کادر کلاستر'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                              {node.ip || '0.0.0.0'} • {node.cpuCores ? `${node.cpuCores}c/${node.ramGB}GB` : node.proto || 'Splunk Node'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Eject / Rejoin Toggle Button */}
                          <button
                            onClick={() => handleToggleNodeClusterMembership(node.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                              isDetached
                                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600/50'
                                : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-600/50'
                            }`}
                          >
                            {isDetached ? (
                              <>
                                <Layers className="w-3.5 h-3.5" />
                                <span>ورود به کلاستر (Rejoin)</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>خروج از کلاستر (Eject)</span>
                              </>
                            )}
                          </button>

                          {/* Reassign Cluster Dropdown */}
                          {node.role && (
                            <select
                              value={node.role}
                              onChange={(e) => handleReassignNodeCluster(node.id, e.target.value as ServerAssetNode['role'])}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 hover:border-slate-500 focus:outline-none focus:border-sky-500 cursor-pointer font-mono"
                              title="تغییر کلاستر نود"
                            >
                              <option value="search_head">Search Tier (SHC)</option>
                              <option value="indexer_peer">Indexer Cluster Tier</option>
                              <option value="heavy_forwarder">Forwarding Tier (HF)</option>
                              <option value="cluster_manager">Management: CM</option>
                              <option value="deployer">Management: Deployer</option>
                              <option value="deployment_server">Management: DS</option>
                              <option value="license_master">Management: LM</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  راهنمای سریع: برای خروج سریع روی نود در دیاگرام دوبار ضربه بزنید یا آیکون ⏏ را بزنید.
                </span>
                <button
                  onClick={() => setClusterManagerModalTier(null)}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
