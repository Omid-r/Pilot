import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Activity,
  Server,
  Shield,
  Radio,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Share2,
  ExternalLink,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Zap,
  Clock,
  Eye,
  FileCode,
  Network,
  Cpu,
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  ToolboxConnection,
  ToolboxFlow,
  ToolboxPortScanResult,
  ToolboxPingResult,
  ToolboxTraceHop,
  ToolboxNodeOverview,
  ToolboxNetworkMapNode,
  ClusterSettings
} from '../types';

interface NetworkToolboxProps {
  lang: 'fa' | 'en';
  clusterSettings: ClusterSettings;
}

type SubToolTab =
  | 'connections'
  | 'flows'
  | 'port_check'
  | 'ping'
  | 'traceroute'
  | 'role_overview'
  | 'network_map'
  | 'cluster_fixer';

export const NetworkToolbox: React.FC<NetworkToolboxProps> = ({ lang, clusterSettings }) => {
  const isFa = lang === 'fa';
  const [activeTab, setActiveTab] = useState<SubToolTab>('connections');

  // Copied state
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // 1. Connections State
  const [connections, setConnections] = useState<ToolboxConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connSearch, setConnSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'ACCEPT' | 'ACCEPT*' | 'DENY' | 'BLOCK'>('ALL');
  const [protoFilter, setProtoFilter] = useState<'ALL' | 'TCP' | 'UDP' | 'ICMP'>('ALL');

  // 2. Flows State
  const [flows, setFlows] = useState<ToolboxFlow[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [flowProto, setFlowProto] = useState<'any' | 'tcp' | 'udp'>('any');
  const [flowDirection, setFlowDirection] = useState<'all' | 'in' | 'out'>('all');
  const [flowStateFilter, setFlowStateFilter] = useState('');

  // 3. Port Check (nc) State
  const [probeTarget, setProbeTarget] = useState(clusterSettings.idx1Ip || '10.18.32.74');
  const [probePorts, setProbePorts] = useState('9997, 8089, 8000, 8088, 514, 1514, 22');
  const [probeProto, setProbeProto] = useState<'tcp' | 'udp'>('tcp');
  const [probeResults, setProbeResults] = useState<ToolboxPortScanResult[]>([]);
  const [probingPorts, setProbingPorts] = useState(false);

  // 4. Ping State
  const [pingTarget, setPingTarget] = useState(clusterSettings.idx1Ip || '10.18.32.74');
  const [pingCount, setPingCount] = useState(4);
  const [pingResult, setPingResult] = useState<ToolboxPingResult | null>(null);
  const [pinging, setPinging] = useState(false);

  // 5. Traceroute State
  const [traceTarget, setTraceTarget] = useState(clusterSettings.idx1Ip || '10.18.32.74');
  const [traceHops, setTraceHops] = useState<ToolboxTraceHop[]>([]);
  const [tracing, setTracing] = useState(false);
  const [traceRaw, setTraceRaw] = useState('');

  // 6. Node Overview State
  const [nodeOverview, setNodeOverview] = useState<ToolboxNodeOverview | null>(null);
  const [loadingNodeOverview, setLoadingNodeOverview] = useState(false);

  // 7. Network Map State
  const [mapNodes, setMapNodes] = useState<ToolboxNetworkMapNode[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);

  // 8. Splunk Cluster Fixer State
  const [fixTargetIndexer, setFixTargetIndexer] = useState(clusterSettings.idx1Ip || '10.18.32.74');
  const [fixIndexerPort, setFixIndexerPort] = useState(9997);
  const [fixHfLogs, setFixHfLogs] = useState<string[]>([]);
  const [runningFixHf, setRunningFixHf] = useState(false);
  const [fixerSubTab, setFixerSubTab] = useState<'hf_fix' | 'indexer_fix' | 'script_viewer'>('hf_fix');
  const [fixIdxLogs, setFixIdxLogs] = useState<string[]>([]);
  const [runningFixIdx, setRunningFixIdx] = useState(false);
  const [selectedScriptCode, setSelectedScriptCode] = useState<'fix_sh' | 'indexer_sh' | 'peer_traffic' | 'gateway_py'>('fix_sh');

  // Load initial data
  useEffect(() => {
    fetchConnections();
    fetchNodeOverview();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  // Fetch Connections
  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await fetch('/api/toolbox/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (e) {
      console.error('Failed to fetch connections:', e);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Fetch Flows
  const fetchFlows = async () => {
    setLoadingFlows(true);
    try {
      const res = await fetch('/api/toolbox/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fproto: flowProto,
          fdir: flowDirection,
          fstate: flowStateFilter
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
      }
    } catch (e) {
      console.error('Failed to fetch flows:', e);
    } finally {
      setLoadingFlows(false);
    }
  };

  // Run Port Scan
  const runPortScan = async () => {
    setProbingPorts(true);
    try {
      const res = await fetch('/api/toolbox/port-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: probeTarget,
          ports: probePorts,
          proto: probeProto
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProbeResults(data.results || []);
      }
    } catch (e) {
      console.error('Failed to scan ports:', e);
    } finally {
      setProbingPorts(false);
    }
  };

  // Run Ping
  const runPing = async () => {
    setPinging(true);
    try {
      const res = await fetch('/api/toolbox/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: pingTarget,
          count: pingCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPingResult(data);
      }
    } catch (e) {
      console.error('Failed to ping:', e);
    } finally {
      setPinging(false);
    }
  };

  // Run Traceroute
  const runTraceroute = async () => {
    setTracing(true);
    try {
      const res = await fetch('/api/toolbox/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: traceTarget,
          maxHops: 15
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTraceHops(data.hops || []);
        setTraceRaw(data.rawOutput || '');
      }
    } catch (e) {
      console.error('Failed to trace route:', e);
    } finally {
      setTracing(false);
    }
  };

  // Fetch Node Overview
  const fetchNodeOverview = async () => {
    setLoadingNodeOverview(true);
    try {
      const res = await fetch('/api/toolbox/overview');
      if (res.ok) {
        const data = await res.json();
        setNodeOverview(data);
      }
    } catch (e) {
      console.error('Failed to fetch node overview:', e);
    } finally {
      setLoadingNodeOverview(false);
    }
  };

  // Fetch Network Map
  const fetchNetworkMap = async () => {
    setLoadingMap(true);
    try {
      const res = await fetch('/api/toolbox/network-map');
      if (res.ok) {
        const data = await res.json();
        setMapNodes(data);
      }
    } catch (e) {
      console.error('Failed to fetch network map:', e);
    } finally {
      setLoadingMap(false);
    }
  };

  // Execute HF Fix
  const runHfFix = async (dryRun: boolean) => {
    setRunningFixHf(true);
    setFixHfLogs([`[+] Initiating ${dryRun ? 'DRY RUN' : 'AUTOMATED FIX'} on Heavy Forwarder...`]);
    try {
      const res = await fetch('/api/toolbox/run-fix-hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indexerHost: fixTargetIndexer,
          indexerPort: fixIndexerPort,
          dryRun
        })
      });
      const data = await res.json();
      if (data.logs) {
        setFixHfLogs(data.logs);
      }
    } catch (e: any) {
      setFixHfLogs(prev => [...prev, `[-] Error executing fix: ${e.message}`]);
    } finally {
      setRunningFixHf(false);
    }
  };

  // Execute Indexer Fix
  const runIndexerFix = async (dryRun: boolean) => {
    setRunningFixIdx(true);
    setFixIdxLogs([`[+] Initiating ${dryRun ? 'DRY RUN' : 'AUTOMATED FIX'} on Indexer...`]);
    try {
      const res = await fetch('/api/toolbox/run-fix-indexer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listenPort: fixIndexerPort,
          dryRun
        })
      });
      const data = await res.json();
      if (data.logs) {
        setFixIdxLogs(data.logs);
      }
    } catch (e: any) {
      setFixIdxLogs(prev => [...prev, `[-] Error executing indexer fix: ${e.message}`]);
    } finally {
      setRunningFixIdx(false);
    }
  };

  // Filtered connections
  const filteredConnections = connections.filter(c => {
    if (actionFilter !== 'ALL' && c.action !== actionFilter) return false;
    if (protoFilter !== 'ALL' && c.proto !== protoFilter) return false;
    if (connSearch) {
      const q = connSearch.toLowerCase();
      const combined = `${c.remoteIp} ${c.remotePort} ${c.localPort} ${c.proc} ${c.purpose}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'ACCEPT':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60';
      case 'ACCEPT*':
        return 'bg-lime-950/60 text-lime-400 border-lime-700/60';
      case 'DENY':
        return 'bg-rose-950/60 text-rose-400 border-rose-700/60';
      case 'BLOCK':
        return 'bg-red-950/70 text-red-400 border-red-700/60';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Scripts content
  const scriptsContent = {
    fix_sh: `#!/usr/bin/env bash
# =====================================================================
# fix.sh — One-shot fix for Heavy Forwarder indexAndForward license defect
# Run on the Heavy Forwarder: sudo ./fix.sh
# =====================================================================
set -euo pipefail
SPLUNK_HOME="\${SPLUNK_HOME:-/opt/splunk}"
INDEXER_HOST="\${INDEXER_HOST:-${fixTargetIndexer}}"
INDEXER_PORT="\${INDEXER_PORT:-9997}"
SPLUNK="$SPLUNK_HOME/bin/splunk"

echo "== [1/5] Backing up /opt/splunk/etc/system/local =="
TIMESTAMP=$(date +%F-%H%M%S)
mkdir -p ~/splunk-backup-$TIMESTAMP
cp -a "$SPLUNK_HOME/etc/system/local/." ~/splunk-backup-$TIMESTAMP/
echo "Backup saved to ~/splunk-backup-$TIMESTAMP"

echo "== [2/5] Writing FIXED outputs.conf =="
cat > "$SPLUNK_HOME/etc/system/local/outputs.conf" <<EOF
[tcpout]
defaultGroup   = idx_primary
disabled       = false
forwardedindex.0.whitelist = .*
forwardedindex.1.blacklist =
forwardedindex.2.whitelist =
forwardedindex.filter.disable = false
indexAndForward = false

[tcpout:idx_primary]
server       = $INDEXER_HOST:$INDEXER_PORT
compressed   = true
useACK       = true
EOF

echo "== [3/5] Writing FIXED inputs.conf (parsingQueue only) =="
cat > "$SPLUNK_HOME/etc/system/local/inputs.conf" <<EOF
[default]
indexAndForward = false
queue = parsingQueue
index = _thefishbucket
EOF

echo "== [4/5] Disabling receiving on HF (must NOT listen on 9997) =="
"$SPLUNK" disable listen 9997 2>&1 || true

echo "== [5/5] Restarting HF to apply tcpout changes =="
"$SPLUNK" restart
echo "SUCCESS: Forwarding configured to $INDEXER_HOST:$INDEXER_PORT"
`,
    indexer_sh: `#!/usr/bin/env bash
# =====================================================================
# indexer-fix.sh — Run on the INDEXER (${fixTargetIndexer})
# Fixes: "TcpOutputProc blocked for blocked_seconds=300" on HF
# =====================================================================
set -euo pipefail
SPLUNK_HOME="\${SPLUNK_HOME:-/opt/splunk}"
SPLUNK="$SPLUNK_HOME/bin/splunk"
LISTEN_PORT="${fixIndexerPort}"

echo "== [1/4] Ensuring [splunktcp://$LISTEN_PORT] in inputs.conf =="
cat >> "$SPLUNK_HOME/etc/system/local/inputs.conf" <<EOF

[splunktcp://$LISTEN_PORT]
connection_host = ip
disabled = 0
EOF

echo "== [2/4] Enabling port $LISTEN_PORT via Splunk CLI =="
"$SPLUNK" enable listen "$LISTEN_PORT" 2>&1 || true

echo "== [3/4] Opening port $LISTEN_PORT in firewalld =="
if command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --add-port="$LISTEN_PORT/tcp" --permanent
  sudo firewall-cmd --reload
  echo "firewalld port $LISTEN_PORT/tcp allowed"
fi

echo "== [4/4] Restarting indexer splunkd service =="
"$SPLUNK" restart
echo "Verification: ss -tlnp | grep $LISTEN_PORT"
`,
    peer_traffic: `#!/usr/bin/env bash
# peer-traffic.sh — List unique remote IP:port pairs that talk to this host
# Usage: sudo ./peer-traffic.sh {now|watch|fwlog|detail}
set -euo pipefail
ss -tunap 2>/dev/null | awk '
  $2 == "ESTAB" {
    print "ESTABLISHED", $1, $5, "->", $6
  }
  $2 == "LISTEN" {
    print "LISTENING", $1, $5
  }
' | head -50
`,
    gateway_py: `# traffic-gateway.py & traffic-tools.py
# Unified Network Diagnostics Engine for Linux / RHEL
# Run: sudo python3 scripts/traffic-tools.py role
import subprocess, sys, os, json
print(json.dumps({"engine": "Unified Traffic Gateway", "version": "v5-parity"}))
`
  };

  return (
    <div className="space-y-6" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Top Banner Ribbon - Sirene Dark Luxury */}
      <div className="sirene-card rounded-3xl p-6 md:p-8 border border-white/[0.08] bg-[#0b0e17]/85 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] text-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] border border-white/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  ENGINE: v5-PARITY
                </span>
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight sirene-text-gradient">
                  {isFa ? 'جعبه ابزار پیشرفته شبکه، پایش پورت‌ها و تعمیر خودکار کلاستر' : 'Advanced Network Toolbox, Port Monitor & Cluster Fixer'}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isFa 
                  ? 'مجموعه ابزارهای یکپارچه شناسایی نقش هاست، پایش پورت‌های باز، جریان‌های Conntrack، تست تأخیر پینگ، مسیرسنجی Trace و اصلاح خودکار تنظیمات لایسنس و فورواردینگ اسپلانک' 
                  : 'Integrated suite for node role detection, open port monitoring, conntrack flows, ping latency, traceroute, and automated Splunk license & forwarding repair.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right rtl:text-left bg-[#07090e]/80 border border-white/[0.08] px-4 py-2 rounded-2xl text-xs font-mono">
              <div className="text-slate-400 text-[10px] uppercase font-bold">{isFa ? 'نقش شناسایی شده هاست:' : 'Host Detected Role:'}</div>
              <div className="font-bold text-amber-400 flex items-center gap-1.5 justify-end rtl:justify-start mt-0.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase">{nodeOverview?.role || 'FORWARDER'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                fetchConnections();
                fetchNodeOverview();
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingConnections ? 'animate-spin' : ''}`} />
              <span>{isFa ? 'بروزرسانی داده‌ها' : 'Refresh All'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs - Sirene Style */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs border-b border-white/[0.06]">
        {[
          { id: 'connections', label: isFa ? 'پایش نشست‌ها و پورت‌ها (ss)' : 'Live Connections & Ports', icon: Radio },
          { id: 'flows', label: isFa ? 'جدول جریان‌ها (Conntrack)' : 'Flow Table (Conntrack)', icon: Activity },
          { id: 'port_check', label: isFa ? 'تست پورت و دسترس‌پذیری (nc)' : 'Port Probe (nc)', icon: Zap },
          { id: 'ping', label: isFa ? 'پینگ و تست تأخیر' : 'Ping & Latency', icon: Radio },
          { id: 'traceroute', label: isFa ? 'مسیرسنجی بسته (Trace)' : 'Traceroute Path', icon: Network },
          { id: 'role_overview', label: isFa ? 'شناسایی نقش هاست و مشخصات' : 'Node Role & Overview', icon: Cpu },
          { id: 'network_map', label: isFa ? 'نقشه همسایگان شبکه' : 'Network Map', icon: Layers },
          { id: 'cluster_fixer', label: isFa ? 'تعمیر خودکار کلاستر اسپلانک' : 'Splunk Cluster Auto-Fixer', icon: Wrench, highlight: true }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as SubToolTab);
                if (tab.id === 'flows' && flows.length === 0) fetchFlows();
                if (tab.id === 'network_map' && mapNodes.length === 0) fetchNetworkMap();
                if (tab.id === 'role_overview' && !nodeOverview) fetchNodeOverview();
              }}
              className={`px-3.5 py-2.5 rounded-2xl font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? tab.highlight 
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : tab.highlight
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Live Connections & Ports */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sirene-card p-4 rounded-2xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08]">
              <div className="text-slate-400 text-[11px] font-bold">{isFa ? 'کل اتصالات فعال' : 'Active Connections'}</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{connections.length}</div>
            </div>
            <div className="sirene-card p-4 rounded-2xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08]">
              <div className="text-slate-400 text-[11px] font-bold">{isFa ? 'پیرهای یکتا (Remote Peers)' : 'Unique Remote Peers'}</div>
              <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                {new Set(connections.map(c => c.remoteIp)).size}
              </div>
            </div>
            <div className="sirene-card p-4 rounded-2xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08]">
              <div className="text-slate-400 text-[11px] font-bold">{isFa ? 'ترافیک ورودی (Inbound)' : 'Inbound Flows'}</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {connections.filter(c => c.dir === 'IN').length}
              </div>
            </div>
            <div className="sirene-card p-4 rounded-2xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08]">
              <div className="text-slate-400 text-[11px] font-bold">{isFa ? 'ترافیک خروجی (Outbound)' : 'Outbound Flows'}</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {connections.filter(c => c.dir === 'OUT').length}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={connSearch}
                onChange={(e) => setConnSearch(e.target.value)}
                placeholder={isFa ? 'جستجوی IP، پورت، پروسه یا هدف ارتباط...' : 'Search IP, port, process, or purpose...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">{isFa ? 'فیلتر اکشن فایروال:' : 'Verdict:'}</span>
              {(['ALL', 'ACCEPT', 'ACCEPT*', 'DENY', 'BLOCK'] as const).map(act => (
                <button
                  key={act}
                  onClick={() => setActionFilter(act)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    actionFilter === act
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">{isFa ? 'پروتکل:' : 'Proto:'}</span>
              {(['ALL', 'TCP', 'UDP'] as const).map(pr => (
                <button
                  key={pr}
                  onClick={() => setProtoFilter(pr)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    protoFilter === pr
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          {/* Connections Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="max-h-[550px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs" dir="ltr">
                <thead className="bg-[#0e1624] text-slate-400 border-b border-slate-800 sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="p-3">DIRECTION</th>
                    <th className="p-3">PROTO</th>
                    <th className="p-3">REMOTE IP:PORT</th>
                    <th className="p-3">LOCAL PORT</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">PROCESS</th>
                    <th className="p-3">PURPOSE / CLUSTER ROLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredConnections.length > 0 ? (
                    filteredConnections.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.dir === 'OUT' 
                              ? 'bg-amber-950/50 text-amber-300 border-amber-700/60' 
                              : 'bg-cyan-950/50 text-cyan-300 border-cyan-700/60'
                          }`}>
                            {c.dir === 'OUT' ? 'OUT →' : 'IN ←'}
                          </span>
                        </td>
                        <td className="p-3 text-indigo-300">{c.proto}</td>
                        <td className="p-3 font-bold text-slate-100">
                          {c.remoteIp}:{c.remotePort}
                        </td>
                        <td className="p-3 text-cyan-400 font-bold">:{c.localPort}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeClass(c.action)}`}>
                            {c.action}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-amber-400">{c.proc}</td>
                        <td className="p-3 text-slate-400 text-[11px] font-sans">
                          {c.purpose}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        {isFa ? 'هیچ اتصالی مطابق فیلترهای اعمال‌شده یافت نشد.' : 'No connections matched current filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Active Flow Table (Conntrack) */}
      {activeTab === 'flows' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold">{isFa ? 'فیلتر پروتکل:' : 'Protocol:'}</span>
              <select
                value={flowProto}
                onChange={(e) => setFlowProto(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 outline-none"
              >
                <option value="any">any</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>

              <span className="text-slate-400 font-bold ml-2">{isFa ? 'جهت جریان:' : 'Direction:'}</span>
              <select
                value={flowDirection}
                onChange={(e) => setFlowDirection(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 outline-none"
              >
                <option value="all">all</option>
                <option value="in">Inbound (IN)</option>
                <option value="out">Outbound (OUT)</option>
              </select>
            </div>

            <button
              onClick={fetchFlows}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer"
            >
              {isFa ? 'بروزرسانی جدول Conntrack' : 'Refresh Flow Table'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs" dir="ltr">
                <thead className="bg-[#0e1624] text-slate-400 border-b border-slate-800 sticky top-0 text-[11px]">
                  <tr>
                    <th className="p-3">DIR</th>
                    <th className="p-3">PROTO</th>
                    <th className="p-3">ORIGINAL FLOW (SRC → DST)</th>
                    <th className="p-3">REPLY FLOW (RETURN)</th>
                    <th className="p-3">CONNTRACK STATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {flows.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.dir === 'OUT' ? 'bg-amber-950/60 text-amber-300' : 'bg-cyan-950/60 text-cyan-300'
                        }`}>
                          {f.dir}
                        </span>
                      </td>
                      <td className="p-3 text-indigo-300">{f.proto}</td>
                      <td className="p-3 font-bold text-slate-200">
                        {f.origSrc}:{f.origSport} → {f.origDst}:{f.origDport}
                      </td>
                      <td className="p-3 text-slate-400">
                        reply {f.replySrc}:{f.replySport}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 text-[11px] font-bold">
                          {f.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Port Probe & Reachability (nc) */}
      {activeTab === 'port_check' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">{isFa ? 'هاست / آی‌پی مقصد:' : 'Target Host / IP:'}</label>
                <input
                  type="text"
                  value={probeTarget}
                  onChange={(e) => setProbeTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-cyan-500"
                  placeholder="e.g. 10.18.32.74 or splunk-indexer"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">{isFa ? 'پورت‌ها (جدا شده با کاما یا رنج):' : 'Ports (comma separated or range):'}</label>
                <input
                  type="text"
                  value={probePorts}
                  onChange={(e) => setProbePorts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-cyan-500"
                  placeholder="9997, 8089, 8000-8010"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={runPortScan}
                  disabled={probingPorts}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{probingPorts ? (isFa ? 'در حال تست پورت‌ها...' : 'Scanning Ports...') : (isFa ? 'اجرای تست پورت (nc)' : 'Run Port Check')}</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-slate-500 font-bold">{isFa ? 'پیش‌فرض‌های اسپلانک:' : 'Splunk Presets:'}</span>
              <button
                onClick={() => setProbePorts('9997, 8089')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                Forwarding & Mgmt (9997, 8089)
              </button>
              <button
                onClick={() => setProbePorts('8000, 8088')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                Web UI & HEC (8000, 8088)
              </button>
              <button
                onClick={() => setProbePorts('514, 1514, 22')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                Syslog & SSH (514, 1514, 22)
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {probeResults.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-500">{isFa ? 'کل پورت‌های بررسی‌شده' : 'Total Ports Checked'}</div>
                  <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{probeResults.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                  <div className="text-emerald-400">{isFa ? 'باز (OPEN / Accessible)' : 'Open (Accessible)'}</div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                    {probeResults.filter(r => r.status === 'OPEN').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
                  <div className="text-rose-400">{isFa ? 'بسته (CLOSED / Refused)' : 'Closed (Refused)'}</div>
                  <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">
                    {probeResults.filter(r => r.status === 'CLOSED').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
                  <div className="text-amber-400">{isFa ? 'فیلتر / مسدود (FILTERED)' : 'Filtered / Dropped'}</div>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                    {probeResults.filter(r => r.status === 'FILTERED').length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {probeResults.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        r.status === 'OPEN' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : r.status === 'FILTERED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {r.status === 'OPEN' ? <Check className="w-5 h-5" /> : r.status === 'FILTERED' ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="font-mono font-bold text-sm text-slate-100 flex items-center gap-2">
                          <span>Port {r.port} / {r.proto.toUpperCase()}</span>
                          <span className="text-slate-400 text-xs font-normal">({probeTarget})</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5 font-sans">{r.message}</div>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.status === 'OPEN' 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : r.status === 'FILTERED'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-rose-950 text-rose-300 border-rose-700'
                      }`}>
                        {r.status}
                      </span>
                      <div className="text-slate-500 font-mono text-[11px] mt-1">{r.latencyMs} ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Ping & Latency */}
      {activeTab === 'ping' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <span className="text-slate-400 font-bold">{isFa ? 'هدف پینگ (IP یا هاست‌نیم):' : 'Ping Target:'}</span>
              <input
                type="text"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-cyan-500"
                placeholder="10.18.32.74"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">{isFa ? 'تعداد پکت:' : 'Count:'}</span>
              <select
                value={pingCount}
                onChange={(e) => setPingCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
              >
                <option value={4}>4 packets</option>
                <option value={10}>10 packets</option>
                <option value={20}>20 packets</option>
              </select>

              <button
                onClick={runPing}
                disabled={pinging}
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{pinging ? (isFa ? 'در حال ارسال پکت‌ها...' : 'Pinging...') : (isFa ? 'ارسال پینگ' : 'Ping')}</span>
              </button>
            </div>
          </div>

          {pingResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">{isFa ? 'پکت‌های ارسالی / دریافتی' : 'Transmitted / Received'}</div>
                  <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                    {pingResult.transmitted} / {pingResult.received}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">{isFa ? 'درصد اتلاف پکت (Loss)' : 'Packet Loss'}</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    pingResult.lossPercent === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {pingResult.lossPercent}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">{isFa ? 'میانگین زمان رفت و برگشت (Avg RTT)' : 'Average RTT'}</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {pingResult.avgMs !== undefined ? `${pingResult.avgMs} ms` : 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">{isFa ? 'حداقل / حداکثر تأخیر' : 'Min / Max Latency'}</div>
                  <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                    {pingResult.minMs ?? '-'} / {pingResult.maxMs ?? '-'} ms
                  </div>
                </div>
              </div>

              {/* Raw Terminal Output */}
              <div className="rounded-xl border border-slate-800 bg-[#070b12] p-4 font-mono text-xs text-emerald-400 space-y-2 overflow-x-auto" dir="ltr">
                <pre>{pingResult.rawOutput}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Traceroute */}
      {activeTab === 'traceroute' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <span className="text-slate-400 font-bold">{isFa ? 'مقصد مسیرسنجی:' : 'Target Host:'}</span>
              <input
                type="text"
                value={traceTarget}
                onChange={(e) => setTraceTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-cyan-500"
                placeholder="10.18.32.74"
              />
            </div>

            <button
              onClick={runTraceroute}
              disabled={tracing}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Network className="w-4 h-4" />
              <span>{tracing ? (isFa ? 'در حال ردگیری گره‌ها...' : 'Tracing Route...') : (isFa ? 'شروع Trace' : 'Trace Route')}</span>
            </button>
          </div>

          {traceHops.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                {isFa ? `مسیر گام‌به‌گام به سمت ${traceTarget} (${traceHops.length} گره):` : `Hop path to ${traceTarget} (${traceHops.length} hops):`}
              </h4>
              <div className="space-y-2">
                {traceHops.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-[11px]">
                        {h.hop}
                      </span>
                      <span className="font-bold text-slate-200">{h.host}</span>
                      <span className="text-slate-500">({h.ip})</span>
                    </div>

                    <div className="font-bold text-cyan-400">
                      {h.latencyMs !== undefined ? `${h.latencyMs} ms` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Node Role Overview */}
      {activeTab === 'role_overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Card */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950/40 text-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wide">{isFa ? 'نقش تعیین‌شده هاست:' : 'Detected Node Role:'}</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-2 uppercase flex items-center gap-2">
                <Server className="w-7 h-7" />
                <span>{nodeOverview?.role || 'FORWARDER'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {isFa 
                  ? 'این نتیجه بر اساس بررسی مستقیم هسته سیستم‌عامل، پروسه‌های فعال اسپلانک و تعداد سوکت‌های در حال لیسن محاسبه شده است.'
                  : 'Computed based on kernel network forwarding state, listening TCP sockets, and active splunkd binaries.'}
              </p>
            </div>

            {/* Evidence Card */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 md:col-span-2 text-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-3">{isFa ? 'شواهد و دلایل انتساب نقش:' : 'Evidence & Diagnostics:'}</div>
              <div className="space-y-2">
                {nodeOverview?.evidence.map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details: Interfaces & Routes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 text-xs">
              <h5 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Network className="w-4 h-4" />
                <span>{isFa ? 'کارت‌های شبکه شناسایی‌شده (Interfaces)' : 'Network Interfaces'}</span>
              </h5>
              <div className="space-y-2 font-mono">
                {nodeOverview?.interfaces.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="font-bold text-cyan-400">{i.iface}</span>
                    <span className="text-slate-300">{i.ip}</span>
                    <span className="text-emerald-400 font-bold">{i.status || 'UP'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 text-xs">
              <h5 className="font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{isFa ? 'جدول روتینگ (IP Routing Table)' : 'Routing Table'}</span>
              </h5>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                {nodeOverview?.routes.map((r, idx) => (
                  <div key={idx} className="p-1.5 bg-black/40 rounded border border-slate-800/60">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Network Map */}
      {activeTab === 'network_map' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 flex items-center justify-between">
            <span>{isFa ? 'همسایگان شبکه از روت پیش‌فرض، DNS، جدول ARP و نشست‌های زنده استخراج شده‌اند:' : 'Discovered from default routes, DNS servers, ARP table, and live sockets:'}</span>
            <button
              onClick={fetchNetworkMap}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {isFa ? 'بروزرسانی نقشه' : 'Refresh Map'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mapNodes.map((n, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center gap-3.5 text-xs">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  n.kind === 'gateway'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : n.kind === 'splunk'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : n.kind === 'dns'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {n.kind === 'gateway' ? <Network className="w-5 h-5" /> : n.kind === 'splunk' ? <Server className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                </div>

                <div>
                  <div className="font-mono font-bold text-sm text-slate-100">{n.ip}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{n.note}</div>
                  <span className="inline-block mt-1 uppercase text-[10px] font-bold px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                    {n.kind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: Splunk Cluster Automated Fixer (fix.sh & indexer-fix.sh) */}
      {activeTab === 'cluster_fixer' && (
        <div className="space-y-4">
          {/* Subtabs for fixer */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
            <button
              onClick={() => setFixerSubTab('hf_fix')}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                fixerSubTab === 'hf_fix'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isFa ? 'تعمیر Heavy Forwarder (رفع خطای لایسنس و فورواردینگ)' : 'Fix Heavy Forwarder (fix.sh)'}
            </button>

            <button
              onClick={() => setFixerSubTab('indexer_fix')}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                fixerSubTab === 'indexer_fix'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isFa ? 'تعمیر Indexer (باز کردن پورت ۹۹۹۷ و رفع بلاک)' : 'Fix Indexer (indexer-fix.sh)'}
            </button>

            <button
              onClick={() => setFixerSubTab('script_viewer')}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                fixerSubTab === 'script_viewer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isFa ? 'مشاهده و دانلود اسکریپت‌های شل' : 'View & Download Scripts'}
            </button>
          </div>

          {/* Subtab 1: Heavy Forwarder Fix */}
          {fixerSubTab === 'hf_fix' && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-300">
                    {isFa ? 'رفع قطعی خطای رد لایسنس فورواردر و ایندکس محلی (HF indexAndForward Bug)' : 'Remediate HF Forwarder License Rejection & Local Indexing'}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {isFa
                      ? 'در صورتی که Heavy Forwarder هنوز به صورت محلی لاگ‌ها را ایندکس کند (indexAndForward=true) یا گروه پیش‌فرض (defaultGroup) خالی باشد، لایسنس Forwarder پذیرفته نمی‌شود. این ابزار دقیقاً اسکریپت fix.sh شما را اجرا می‌کند:'
                      : 'When HF still indexes locally (indexAndForward=true) or defaultGroup is empty, the Forwarder license is rejected. This engine runs your fix.sh automation:'}
                  </p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 pt-1">
                    <li>{isFa ? 'پشتیبان‌گیری کامل از مسیر etc/system/local' : 'Backup etc/system/local into timestamped archive'}</li>
                    <li>{isFa ? 'تنظیم indexAndForward = false در outputs.conf و inputs.conf' : 'Set indexAndForward = false in outputs.conf & inputs.conf'}</li>
                    <li>{isFa ? 'غیرفعال‌سازی دریافت روی پورت ۹۹۹۷ در HF (disable listen 9997)' : 'Disable listening on 9997 on HF'}</li>
                    <li>{isFa ? 'تنظیم فورواردینگ مستقیم به ایندکسر با لایسنس رایگان فورواردر' : 'Route data to target indexer and activate Forwarder license'}</li>
                  </ul>
                </div>
              </div>

              {/* Target Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">{isFa ? 'آدرس ایندکسر مقصد (INDEXER_HOST):' : 'Target Indexer IP/Host:'}</label>
                  <input
                    type="text"
                    value={fixTargetIndexer}
                    onChange={(e) => setFixTargetIndexer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    placeholder="10.18.32.74"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">{isFa ? 'پورت ایندکسر (INDEXER_PORT):' : 'Target Indexer Port:'}</label>
                  <input
                    type="number"
                    value={fixIndexerPort}
                    onChange={(e) => setFixIndexerPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    placeholder="9997"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => runHfFix(true)}
                  disabled={runningFixHf}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isFa ? 'بررسی شبیه‌سازی شده (Dry Run)' : 'Simulate (Dry Run)'}
                </button>

                <button
                  onClick={() => runHfFix(false)}
                  disabled={runningFixHf}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{runningFixHf ? (isFa ? 'در حال اجرای تعمیر خودکار...' : 'Running Repair...') : (isFa ? 'اعمال تعمیر خودکار روی سرور (Apply Fix)' : 'Apply Auto-Fix')}</span>
                </button>
              </div>

              {/* Execution Logs Terminal */}
              {fixHfLogs.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#070b12] p-4 font-mono text-xs text-emerald-400 space-y-1.5 max-h-60 overflow-y-auto" dir="ltr">
                  <div className="text-slate-500 font-bold mb-2">--- Heavy Forwarder Fix Output ---</div>
                  {fixHfLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith('[-]') ? 'text-rose-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Indexer Fix */}
          {fixerSubTab === 'indexer_fix' && (
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Server className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-cyan-300">
                    {isFa ? 'رفع خطای مسدودی فورواردر و باز کردن پورت ۹۹۹۷ (Indexer Fixer)' : 'Resolve Forwarder Blockage & Enable Listening Port 9997'}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {isFa
                      ? 'اگر روی فورواردر خطای "TcpOutputProc blocked for blocked_seconds=300" مشاهده می‌کنید، علت باز نبودن پورت ۹۹۹۷ روی ایندکسر است. این ابزار موارد زیر را به طور خودکار انجام می‌دهد:'
                      : 'Fixes "TcpOutputProc blocked" by enabling splunktcp receiver on indexer and opening firewalld:'}
                  </p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 pt-1">
                    <li>{isFa ? 'تنظیم استنزای [splunktcp://9997] در inputs.conf محلی' : 'Ensure [splunktcp://9997] in inputs.conf with disabled = 0'}</li>
                    <li>{isFa ? 'اجرای دستور splunk enable listen 9997' : 'Execute splunk enable listen 9997'}</li>
                    <li>{isFa ? 'باز کردن پورت در فایروال (firewall-cmd --add-port=9997/tcp --permanent)' : 'Open 9997/tcp in firewalld'}</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => runIndexerFix(true)}
                  disabled={runningFixIdx}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isFa ? 'بررسی شبیه‌سازی شده (Dry Run)' : 'Simulate (Dry Run)'}
                </button>

                <button
                  onClick={() => runIndexerFix(false)}
                  disabled={runningFixIdx}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{runningFixIdx ? (isFa ? 'در حال اعمال روی ایندکسر...' : 'Applying on Indexer...') : (isFa ? 'اعمال تعمیر ایندکسر (Apply Fix)' : 'Apply Indexer Fix')}</span>
                </button>
              </div>

              {fixIdxLogs.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#070b12] p-4 font-mono text-xs text-cyan-300 space-y-1.5 max-h-60 overflow-y-auto" dir="ltr">
                  <div className="text-slate-500 font-bold mb-2">--- Indexer Fix Output ---</div>
                  {fixIdxLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith('[-]') ? 'text-rose-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subtab 3: View & Download Scripts */}
          {fixerSubTab === 'script_viewer' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedScriptCode('fix_sh')}
                    className={`px-3 py-1.5 rounded-lg font-bold font-mono transition ${
                      selectedScriptCode === 'fix_sh' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    fix.sh (Heavy Forwarder)
                  </button>
                  <button
                    onClick={() => setSelectedScriptCode('indexer_sh')}
                    className={`px-3 py-1.5 rounded-lg font-bold font-mono transition ${
                      selectedScriptCode === 'indexer_sh' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    indexer-fix.sh (Indexer)
                  </button>
                  <button
                    onClick={() => setSelectedScriptCode('peer_traffic')}
                    className={`px-3 py-1.5 rounded-lg font-bold font-mono transition ${
                      selectedScriptCode === 'peer_traffic' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    peer-traffic.sh
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(scriptsContent[selectedScriptCode], selectedScriptCode)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript === selectedScriptCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript === selectedScriptCode ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی متن اسکریپت' : 'Copy Script')}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#070b12] p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]" dir="ltr">
                <pre>{scriptsContent[selectedScriptCode]}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
