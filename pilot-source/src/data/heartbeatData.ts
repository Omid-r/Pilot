import { HeartbeatNode, HeartbeatDropAlert, RemoteCommandExecutionLog } from '../types';

export const INITIAL_HEARTBEAT_NODES: HeartbeatNode[] = [
  {
    id: 'node-uf-app-01',
    hostname: 'uf-appserver-prod-01.corp.internal',
    ip: '10.10.40.12',
    componentRole: 'universal_forwarder',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 4.2,
    eventsPerSec: 1450,
    bandwidthKbps: 840,
    queueUtilizationPct: 18,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['/var/log/nginx/access.log', '/var/log/secure', 'WinEventLog:Security'],
    recentHeartbeatTrend: [1300, 1420, 1450, 1380, 1460, 1500, 1480, 1450],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-uf-db-02',
    hostname: 'uf-oracle-db-cluster-02.corp.internal',
    ip: '10.10.40.18',
    componentRole: 'universal_forwarder',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:14',
    secondsSinceLastBeat: 2,
    pingMs: 3.8,
    eventsPerSec: 2890,
    bandwidthKbps: 1650,
    queueUtilizationPct: 24,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['/u01/app/oracle/audit/db_audit.xml', '/var/log/messages'],
    recentHeartbeatTrend: [2700, 2800, 2850, 2890, 2900, 2890, 2880, 2890],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-hf-gateway-01',
    hostname: 'hf-collector-gateway-01.corp.internal',
    ip: '10.20.10.15',
    componentRole: 'heavy_forwarder',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 1.9,
    eventsPerSec: 8400,
    bandwidthKbps: 4900,
    queueUtilizationPct: 35,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['syslog_parsing', 'regex_field_extract', 'mask_pii_transform'],
    recentHeartbeatTrend: [8100, 8250, 8300, 8400, 8350, 8400, 8420, 8400],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-syslog-sc4s-01',
    hostname: 'syslog-sc4s-collector-01.corp.internal',
    ip: '10.20.30.80',
    componentRole: 'syslog_collector',
    status: 'WARNING_DELAY',
    lastHeartbeatTime: '23:41:48',
    secondsSinceLastBeat: 28,
    pingMs: 12.4,
    eventsPerSec: 420,
    bandwidthKbps: 210,
    queueUtilizationPct: 79,
    sslHandshakeStatus: 'TLS_1_2_OK',
    activePipelines: ['UDP:514 (Cisco ASA)', 'TCP:6514 (Fortinet FortiGate)'],
    recentHeartbeatTrend: [3400, 2900, 1800, 950, 600, 420, 410, 420],
    unresolvedDropEvents: 1
  },
  {
    id: 'node-uf-legacy-dc-03',
    hostname: 'uf-legacy-dc-03.corp.internal',
    ip: '10.10.60.44',
    componentRole: 'universal_forwarder',
    status: 'DISCONNECTED_SILENT',
    lastHeartbeatTime: '23:38:10',
    secondsSinceLastBeat: 246,
    pingMs: 0,
    eventsPerSec: 0,
    bandwidthKbps: 0,
    queueUtilizationPct: 100,
    sslHandshakeStatus: 'FAILED_HANDSHAKE',
    activePipelines: ['WinEventLog:Security (Halted)'],
    recentHeartbeatTrend: [1200, 800, 200, 0, 0, 0, 0, 0],
    unresolvedDropEvents: 1
  },
  {
    id: 'node-idx-peer-01',
    hostname: 'idx-cluster-peer-01.corp.internal',
    ip: '10.20.30.50',
    componentRole: 'indexer_node',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 0.8,
    eventsPerSec: 12800,
    bandwidthKbps: 7600,
    queueUtilizationPct: 42,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['Port 9997 (Active Ingestion)', 'Index Replication SF=2/RF=3', 'Bucket Hot->Warm Roll'],
    recentHeartbeatTrend: [12400, 12600, 12750, 12800, 12850, 12800],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-idx-peer-02',
    hostname: 'idx-cluster-peer-02.corp.internal',
    ip: '10.20.30.51',
    componentRole: 'indexer_node',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 0.9,
    eventsPerSec: 12100,
    bandwidthKbps: 7200,
    queueUtilizationPct: 39,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['Port 9997 (Active Ingestion)', 'Index Replication SF=2/RF=3'],
    recentHeartbeatTrend: [11900, 12000, 12050, 12100, 12150, 12100],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-sh-captain',
    hostname: 'sh-captain-cluster-01.corp.internal',
    ip: '10.20.30.20',
    componentRole: 'search_head',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 1.1,
    eventsPerSec: 950,
    bandwidthKbps: 450,
    queueUtilizationPct: 15,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['Web 8000 GUI', 'REST API 8089', 'SHC Raft Consensus (Captain Role)'],
    recentHeartbeatTrend: [900, 920, 940, 950, 930, 950],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-ds-01',
    hostname: 'ds-deployer-prod-01.corp.internal',
    ip: '10.20.30.25',
    componentRole: 'deployment_server',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 1.0,
    eventsPerSec: 620,
    bandwidthKbps: 310,
    queueUtilizationPct: 12,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['Port 8089 (Forwarder Polling)', 'ServerClass Management (1,420 Clients)'],
    recentHeartbeatTrend: [600, 610, 620, 630, 620, 620],
    unresolvedDropEvents: 0
  },
  {
    id: 'node-cm-01',
    hostname: 'cm-cluster-master-01.corp.internal',
    ip: '10.20.30.40',
    componentRole: 'cluster_master',
    status: 'ONLINE_ACTIVE',
    lastHeartbeatTime: '23:42:15',
    secondsSinceLastBeat: 1,
    pingMs: 0.7,
    eventsPerSec: 480,
    bandwidthKbps: 290,
    queueUtilizationPct: 10,
    sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK',
    activePipelines: ['Indexer Cluster Coordinator (RF=3/SF=2)', 'Bucket Fixup Manager', 'Bundle Push (8089)'],
    recentHeartbeatTrend: [450, 470, 480, 480, 490, 480],
    unresolvedDropEvents: 0
  }
];

export const INITIAL_DROP_ALERTS: HeartbeatDropAlert[] = [
  {
    id: 'alert-drop-001',
    nodeId: 'node-uf-legacy-dc-03',
    hostname: 'uf-legacy-dc-03.corp.internal',
    componentRole: 'universal_forwarder',
    timestamp: '23:38:10',
    alertType: 'LOG_STREAM_HALTED',
    severity: 'CRITICAL',
    messageFa: 'قطع کامل جریان لاگ و توقف ضربان قلب Universal Forwarder به مدت بیش از ۴ دقیقه!',
    messageEn: 'Log stream completely halted and heartbeat silent for over 4 minutes on Windows Domain Controller UF!',
    impactFa: 'عدم دریافت لاگ‌های امنیتی کنترلر دامنه در مرکز عملیات امنیت (SOC Blind Spot).',
    impactEn: 'SOC Blind Spot: Security event logs from Domain Controller are not being indexed.',
    recommendedActionFa: 'بررسی اتصال شبکه به ایندکسرها و اجرای دستور راه اندازی مجدد ایجنت با دستور splunk-doctor-agent restart.',
    recommendedActionEn: 'Inspect network routing to indexers and run agent service restart command.',
    isAcknowledged: false
  },
  {
    id: 'alert-drop-002',
    nodeId: 'node-syslog-sc4s-01',
    hostname: 'syslog-sc4s-collector-01.corp.internal',
    componentRole: 'syslog_collector',
    timestamp: '23:41:48',
    alertType: 'QUEUE_BLOCKED',
    severity: 'WARNING',
    messageFa: 'افت ۸۰ درصدی نرخ رویدادهای سیسلاگ و پر شدن ۷۹ درصدی صف بافر دیسک',
    messageEn: '80% drop in Syslog ingestion EPS and buffer queue filling up (79% capacity)',
    impactFa: 'احتمال ریزش بسته‌های UDP سیسلاگ فایروال در صورت عدم تخلیه سریع بافر.',
    impactEn: 'Risk of UDP packet drops from Cisco/Fortinet firewalls if spool is not cleared.',
    recommendedActionFa: 'افزایش اندازه بافر سوکت کرنل سیستم عامل با دستور sysctl -w net.core.rmem_max=16777216',
    recommendedActionEn: 'Increase kernel UDP socket receive buffer using sysctl net.core.rmem_max.',
    isAcknowledged: false
  }
];

export const INITIAL_REMOTE_EXEC_LOGS: RemoteCommandExecutionLog[] = [
  {
    id: 'exec-log-01',
    timestamp: '23:35:12',
    nodeHostname: 'uf-appserver-prod-01.corp.internal',
    commandExecuted: '/opt/splunkforwarder/bin/splunk btool outputs list --debug',
    output: `[tcpout:primary_indexers]
server = 10.20.30.50:9997, 10.20.30.51:9997
useSSL = true
sslVerifyServerCert = true
sendCookedData = true
[tcpout]
defaultGroup = primary_indexers
# Configuration verified by Splunk Doctor Agent v3.4.2`,
    exitCode: 0,
    executedBy: 'soc_admin',
    durationMs: 340
  },
  {
    id: 'exec-log-02',
    timestamp: '23:36:45',
    nodeHostname: 'hf-collector-gateway-01.corp.internal',
    commandExecuted: '/opt/splunk/bin/splunk status',
    output: `splunkd is running (PID 18492).
splunk helpers are running.
Active mTLS Telemetry Tunnel: Connected to Splunk Doctor Gateway (Port 8443).
Queue Status: NORMAL (ParsingQueue: 4%, TypingQueue: 2%, OutputQueue: 11%).`,
    exitCode: 0,
    executedBy: 'soc_admin',
    durationMs: 180
  }
];
