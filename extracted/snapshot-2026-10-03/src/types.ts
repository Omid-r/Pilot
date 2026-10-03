export type Severity = 'critical' | 'warning' | 'ok' | 'info';

export type TargetEnvironment = 'production' | 'parallel' | 'virtual' | 'both';

export interface ParallelClusterState {
  isInstalled: boolean;
  status: 'uninstalled' | 'installing' | 'running' | 'degraded' | 'stopped';
  installProgress?: number;
  installedAt?: string;
  installLog?: string[];
  splunkHome?: string;
  clusterName?: string;
  version?: string;
  portOffset?: number;
  webPort?: number;
  mgmtPort?: number;
  indexerPort?: number;
  lastSyncTime?: string;
  clonedConfigFilesCount?: number;
  ports?: {
    web: number;
    rest: number;
    splunkTcp: number;
    kvstore: number;
    hec: number;
  };
  syncedFilesCount?: number;
  packageSelected?: string;
  customPackagePath?: string;
  licenseMode?: 'shared_license_master' | 'free_developer' | 'custom_license';
  licenseFileName?: string;
  licenseFileUploaded?: boolean;
  licenseMasterUri?: string;
  detectedMainVersion?: string;
  detectedMainBuild?: string;
  detectedMainOs?: string;
  isFirewallPortsOpened?: boolean;
  isWebRunning?: boolean;
}

export type ComponentRole = 
  | 'heavy_forwarder'
  | 'universal_forwarder'
  | 'indexer_peer'
  | 'indexer_standalone'
  | 'search_head'
  | 'cluster_manager'
  | 'deployment_server'
  | 'license_master';

export interface RemediationOption {
  id: string;
  titleFa: string;
  titleEn: string;
  type: 'best_practice' | 'high_throughput' | 'quick_workaround' | 'cli_automation';
  descriptionFa: string;
  descriptionEn: string;
  targetFile: string;
  targetStanza: string;
  diffSnippet: string;
  replacementConfigSnippet: string;
  cliCommand?: string;
}

export interface SplunkFinding {
  id: string;
  category: string;
  categoryFa: string;
  categoryEn: string;
  severity: Severity;
  titleFa: string;
  titleEn: string;
  file: string;
  line: number;
  culpritCode: string;
  whyFlaggedFa: string;
  whyFlaggedEn: string;
  potentialImpactFa: string;
  potentialImpactEn: string;
  seniorRecommendationFa: string;
  seniorRecommendationEn: string;
  docTitle: string;
  docUrl: string;
  options: RemediationOption[];
  isAcknowledged?: boolean;
  splQuery: string;
  splExplanationFa: string;
  splExplanationEn: string;
  splSearchTipFa?: string;
  splSearchTipEn?: string;
}

export interface LiveLogAnalysis {
  rawLine: string;
  timestamp?: string;
  logLevel?: 'ERROR' | 'WARN' | 'FATAL' | 'INFO';
  level?: 'ERROR' | 'WARN' | 'FATAL' | 'INFO';
  component: string;
  meaningFa: string;
  meaningEn: string;
  rootCauseFa: string;
  rootCauseEn: string;
  remediationFa?: string;
  remediationEn?: string;
  actionableFix?: {
    id: string;
    titleFa: string;
    titleEn: string;
    targetFile: string;
    targetStanza: string;
    newSnippet: string;
    commandToRun?: string;
  };
  targetFile?: string;
  affectedConfig?: string;
  targetStanza?: string;
  recommendedFixFa?: string;
  recommendedFixEn?: string;
  patchCode?: string;
  canAutoApply?: boolean;
  docReference?: string;
  subsystemCategory?: string;
  technicalMetrics?: { label: string; value: string }[];
  cliDiagnosisCommand?: string;
  impactAssessmentFa?: string;
  impactAssessmentEn?: string;
  whyOccurredFa?: string;
  recheckSummaryFa?: string;
}

export interface DocComplianceIssue {
  id: string;
  confFile: string;
  stanza: string;
  parameter: string;
  currentValue: string;
  recommendedValue: string;
  severity: Severity;
  titleFa: string;
  titleEn: string;
  recommendationFa: string;
  recommendationEn: string;
  whyTroubleFa: string;
  whyTroubleEn: string;
  officialDocUrl: string;
  patchSnippet: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  descriptionFa: string;
  descriptionEn: string;
  isInitialBaseline: boolean;
  files: Record<string, string>; // filename -> content
}

export interface LogSourceInfo {
  ip: string;
  hostname: string;
  deviceType: string; // Firewall, Syslog, WebServer, Windows DC, Wazuh
  protocol: 'syslog_udp' | 'syslog_tcp' | 'splunktcp' | 'hec_https' | 'monitor_file';
  port: number;
  eventsPerSec: number;
  targetIndex: string;
  targetSourcetype: string;
  status: 'active' | 'degraded' | 'blocked';
  notesFa: string;
}

export interface DestinationIndexerInfo {
  ip: string;
  hostname: string;
  port: number;
  queueStatus: 'normal' | 'blocked' | 'full';
  tlsStatus: boolean;
  activeChannel: boolean;
  avgLatencyMs: number;
  storedBucketsCount: number;
  dutyFa: string;
  dutyEn: string;
}

export interface ComponentProfile {
  id: ComponentRole;
  nameFa: string;
  nameEn: string;
  shortName: string;
  icon: string;
  dutyFa: string;
  dutyEn: string;
  howItWorksFa: string;
  howItWorksEn: string;
  incomingSourcesCount: number;
  incomingLogSources: LogSourceInfo[];
  destinationIndexers: DestinationIndexerInfo[];
  parsingTechniqueFa: string;
  activeAddons: string[];
}

export interface SplunkDocItem {
  id: string;
  confFile: string;
  stanza: string;
  parameter: string;
  defaultValue: string;
  descriptionFa: string;
  descriptionEn: string;
  bestPracticeFa: string;
  bestPracticeEn: string;
  securityImpactFa: string;
  securityImpactEn: string;
  example: string;
  officialDocUrl: string;
  category?: 'forwarding' | 'ingestion' | 'indexing' | 'parsing' | 'security' | 'clustering' | 'search' | 'web' | 'rbac';
  patchSnippet?: string;
  targetConf?: string;
}

export interface ParallelRebuildPlan {
  currentScore: number;
  recommended: boolean;
  targetInstanceName: string;
  estimatedTimeMin: number;
  stepsFa: string[];
  stepsEn: string[];
  portMapping: { original: number; parallel: number; purpose: string }[];
  sanitizedConfigsToCopy: string[];
}

export interface ClusterSettings {
  hfIp: string;
  hfHost: string;
  idx1Ip: string;
  idx1Host: string;
  idx2Ip: string;
  idx2Host: string;
  shIp: string;
  shHost: string;
  dsIp: string;
  dsHost: string;
}

export interface SystemAuditInfo {
  isContainer: boolean;
  user: {
    username: string;
    uid: number | null;
    gid: number | null;
    isRoot: boolean;
    isSplunkUser: boolean;
    groups: string[];
  };
  tools: {
    ss: boolean;
    netstat: boolean;
    lsof: boolean;
    ip: boolean;
    firewallCmd: boolean;
    procfs: boolean;
  };
  splunkHome: {
    path: string;
    detected: boolean;
    source: string;
  };
  filePermissions: {
    serverConf: { exists: boolean; readable: boolean; writable: boolean; path: string };
    outputsConf: { exists: boolean; readable: boolean; writable: boolean; path: string };
    inputsConf: { exists: boolean; readable: boolean; writable: boolean; path: string };
    splunkdLog: { exists: boolean; readable: boolean; writable: boolean; path: string };
  };
  listeningPorts: Array<{
    port: number;
    protocol: 'TCP' | 'UDP';
    address: string;
    process?: string;
    isSplunk: boolean;
  }>;
  guidance: {
    hasRootPrivilege: boolean;
    hasSplunkAccess: boolean;
    isRealServer: boolean;
    statusFa: string;
    fixCommand: string;
  };
}

export interface ToolboxConnection {
  remoteIp: string;
  remotePort: string;
  localPort: string;
  proto: string;
  dir: 'IN' | 'OUT' | '-';
  action: 'ACCEPT' | 'ACCEPT*' | 'DENY' | 'BLOCK' | '-';
  packets: number;
  proc: string;
  purpose: string;
}

export interface ToolboxFlow {
  dir: 'IN' | 'OUT';
  proto: string;
  origSrc: string;
  origDst: string;
  origSport: string;
  origDport: string;
  replySrc: string;
  replyDst: string;
  replySport: string;
  replyDport: string;
  state: string;
}

export interface ToolboxNetflowItem {
  key: string;
  packets: number;
  bytes: number;
  firstSeen?: string;
  percent?: number;
}

export interface ToolboxPortScanResult {
  port: number;
  proto: 'tcp' | 'udp';
  status: 'OPEN' | 'CLOSED' | 'FILTERED' | 'ERROR';
  latencyMs: number;
  message?: string;
}

export interface ToolboxPingResult {
  target: string;
  transmitted: number;
  received: number;
  lossPercent: number;
  minMs?: number;
  avgMs?: number;
  maxMs?: number;
  mdevMs?: number;
  rawOutput: string;
}

export interface ToolboxTraceHop {
  hop: number;
  host: string;
  ip: string;
  latencyMs?: number;
  raw: string;
}

export interface ToolboxNodeOverview {
  role: 'server' | 'forwarder' | 'firewall' | 'router' | 'switch' | 'client';
  score: Record<string, number>;
  evidence: string[];
  ifacesCount: number;
  interfaces: Array<{ iface: string; ip: string; status?: string }>;
  listenersCount: number;
  establishedCount: number;
  routes: string[];
  neighbors: Array<{ ip: string; dev: string; lladdr?: string; state?: string }>;
  dnsServers: string[];
  firewallStatus: string;
}

export interface ToolboxNetworkMapNode {
  ip: string;
  kind: 'gateway' | 'dns' | 'lldp' | 'arp' | 'peer' | 'splunk';
  note: string;
  priority: number;
}

// ============================================================================
// USER MANAGEMENT, RBAC, COMMERCIAL LICENSING & SECURITY HARDENING TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'cluster_admin' | 'operator' | 'auditor';

export interface PanelPermissions {
  topology: boolean;
  network_sources: boolean;
  health_audit: boolean;
  config_editor: boolean;
  live_logs: boolean;
  network_toolbox: boolean;
  package_center: boolean;
  backup_archive: boolean;
  doc_reference: boolean;
  admin_security: boolean;
}

export interface FeaturePermissions {
  run_remediation: boolean; // اجرای اسکریپت‌های اصلاح خودکار (Fix HF / Indexer)
  restart_splunk: boolean;  // ریستارت و توقف/آغاز سرویس اسپلانک
  edit_configs: boolean;    // ذخیره و بازنویسی فایل‌های کانفیگ دیسک
  probe_network: boolean;   // ارسال بسته‌های پینگ، تریس‌روت و پروب پورت‌ها
  export_reports: boolean;  // استخراج گزارش‌های ممیزی PDF / HTML / JSON
  manage_users: boolean;    // ایجاد، ویرایش و تعیین دسترسی کاربران
  manage_license: boolean;  // صدور و فعال‌سازی لایسنس تجاری
}

export interface UserPermissions {
  panels: PanelPermissions;
  features: FeaturePermissions;
}

export function getDefaultPermissionsForRole(role: UserRole): UserPermissions {
  if (role === 'super_admin') {
    return {
      panels: {
        topology: true,
        network_sources: true,
        health_audit: true,
        config_editor: true,
        live_logs: true,
        network_toolbox: true,
        package_center: true,
        backup_archive: true,
        doc_reference: true,
        admin_security: true
      },
      features: {
        run_remediation: true,
        restart_splunk: true,
        edit_configs: true,
        probe_network: true,
        export_reports: true,
        manage_users: true,
        manage_license: true
      }
    };
  }

  if (role === 'cluster_admin') {
    return {
      panels: {
        topology: true,
        network_sources: true,
        health_audit: true,
        config_editor: true,
        live_logs: true,
        network_toolbox: true,
        package_center: true,
        backup_archive: true,
        doc_reference: true,
        admin_security: false
      },
      features: {
        run_remediation: true,
        restart_splunk: true,
        edit_configs: true,
        probe_network: true,
        export_reports: true,
        manage_users: false,
        manage_license: false
      }
    };
  }

  if (role === 'operator') {
    return {
      panels: {
        topology: true,
        network_sources: true,
        health_audit: true,
        config_editor: false,
        live_logs: true,
        network_toolbox: true,
        package_center: false,
        backup_archive: false,
        doc_reference: true,
        admin_security: false
      },
      features: {
        run_remediation: false,
        restart_splunk: false,
        edit_configs: false,
        probe_network: true,
        export_reports: true,
        manage_users: false,
        manage_license: false
      }
    };
  }

  // auditor default
  return {
    panels: {
      topology: true,
      network_sources: true,
      health_audit: true,
      config_editor: false,
      live_logs: true,
      network_toolbox: false,
      package_center: false,
      backup_archive: true,
      doc_reference: true,
      admin_security: false
    },
    features: {
      run_remediation: false,
      restart_splunk: false,
      edit_configs: false,
      probe_network: false,
      export_reports: true,
      manage_users: false,
      manage_license: false
    }
  };
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string; // ISO date string e.g. 2026-10-20T00:00:00.000Z
  isNeverExpires: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  notes?: string;
  permissions?: UserPermissions;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  category: 'AUTH' | 'CONFIG' | 'FIX' | 'USER_MGMT' | 'SECURITY' | 'PROBE' | 'LICENSE';
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'DENIED';
  ip: string;
  details: string;
}

export interface LicenseInfo {
  hardwareId: string;
  companyName: string;
  licenseKey: string;
  status: 'VALID' | 'EXPIRED' | 'TRIAL' | 'UNLICENSED' | 'INVALID_HARDWARE';
  tier: 'ENTERPRISE_COMMERCIAL' | 'TRIAL' | 'COMMUNITY' | 'ENTERPRISE_PLATINUM_SOC' | 'ENTERPRISE_COMMERCIAL_GOLD' | 'STANDARD_COMMERCIAL' | 'TRIAL_EVALUATION';
  maxNodes: number;
  issuedAt: string;
  expiresAt: string;
  daysRemaining: number;
  features: string[];
  isTampered: boolean;
  watermarkNote: string;
}

export interface SystemSecurityPolicy {
  rateLimiterActive: boolean;
  commandInjectionFirewall: boolean;
  pbkdf2HashingRounds: number;
  activeSessionsCount: number;
  lockedIpsCount: number;
  failedLoginsPast24h: number;
  hardwareLockEnabled: boolean;
  enforceHttpsWarning: boolean;
  maxFailedLoginAttempts?: number;
  sessionTimeoutMinutes?: number;
  enforceMtls?: boolean;
  zeroTrustTransitOnly?: boolean;
  anonymizeIpOctets?: boolean;
}

export interface DigitalCertificateLicense {
  certificateId: string;
  serialNumber: string;
  subject: {
    commonName: string; // e.g. splunk-doctor.corp-soc.internal
    organization: string; // e.g. Bank Melli Iran SOC / Parsian SOC
    organizationalUnit: string;
    country: string;
    subscriptionTier: 'ENTERPRISE_COMMERCIAL_GOLD' | 'ENTERPRISE_PLATINUM_SOC' | 'STANDARD_COMMERCIAL' | 'TRIAL_EVALUATION';
    nodeLimit: number;
    licensedModules: string[];
  };
  issuer: {
    commonName: string;
    organization: string;
    authorityKeyId: string;
  };
  validity: {
    notBefore: string; // ISO date
    notAfter: string; // ISO date
    totalDays: number;
    daysRemaining: number;
    isExpired: boolean;
    gracePeriodDays: number;
  };
  cryptography: {
    algorithm: string; // RSA-4096 / SHA-256 with ECDSA
    sha256Fingerprint: string;
    publicKeyPem: string;
    signatureHex: string;
    signedJwtToken: string;
    mtlsClientCertPem: string;
    mtlsPrivateKeyPem: string;
  };
  privacyPolicy: {
    zeroTrustVerified: boolean;
    localAnonymizationEnforced: boolean;
    noRawPayloadTransit: boolean;
    dataResidencyCompliance: string;
  };
}

export type SplunkAgentComponentRole = 
  | 'universal_forwarder' 
  | 'heavy_forwarder' 
  | 'syslog_collector' 
  | 'indexer_node' 
  | 'search_head' 
  | 'deployment_server'
  | 'cluster_master';

export interface ComponentAgentPackage {
  id: string;
  componentRole: SplunkAgentComponentRole;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  version: string;
  supportedOS: string[];
  binarySize: string;
  securityProfile: {
    anonymizeLocalIp: boolean;
    tlsProtocol: 'TLS 1.3 / mTLS';
    sha256Checksum: string;
    readOnlyExecutionMode: boolean;
    dataConfidentialityGuarantee: string;
  };
  installScripts: {
    linuxBashOneLiner: string;
    systemdServiceFile: string;
    windowsPowerShell: string;
    dockerCompose: string;
    helmChartSnippet?: string;
  };
  sampleAgentConfigYaml: string;
  supportedActions: string[];
}

export interface HeartbeatNode {
  id: string;
  hostname: string;
  ip: string;
  componentRole: SplunkAgentComponentRole;
  status: 'ONLINE_ACTIVE' | 'WARNING_DELAY' | 'DISCONNECTED_SILENT' | 'DEGRADED_QUEUE';
  lastHeartbeatTime: string; // e.g. 23:45:12
  secondsSinceLastBeat: number;
  pingMs: number;
  eventsPerSec: number;
  bandwidthKbps: number;
  queueUtilizationPct: number;
  sslHandshakeStatus: 'TLS_1_3_MUTUAL_OK' | 'TLS_1_2_OK' | 'SSL_CERT_WARNING' | 'FAILED_HANDSHAKE';
  activePipelines: string[];
  recentHeartbeatTrend: number[]; // Array of last 10 EPS/latency readings for sparklines
  unresolvedDropEvents: number;
}

export interface HeartbeatDropAlert {
  id: string;
  nodeId: string;
  hostname: string;
  componentRole: SplunkAgentComponentRole;
  timestamp: string;
  alertType: 'LOG_STREAM_HALTED' | 'HEARTBEAT_TIMEOUT' | 'QUEUE_BLOCKED' | 'TLS_EXPIRING';
  severity: 'CRITICAL' | 'WARNING' | 'RESOLVED';
  messageFa: string;
  messageEn: string;
  impactFa: string;
  impactEn: string;
  recommendedActionFa: string;
  recommendedActionEn: string;
  isAcknowledged: boolean;
}

export interface RemoteManagementSession {
  sessionId: string;
  targetNodeId: string;
  targetHostname: string;
  targetRole: SplunkAgentComponentRole;
  tunnelStatus: 'ENCRYPTED_TUNNEL_ACTIVE' | 'CONNECTING' | 'DISCONNECTED';
  mTLSSessionId: string;
  connectedAt: string;
  authorizedUser: string;
  allowedCommands: string[];
}

export interface NodePipelineIO {
  inputs: {
    id: string;
    name: string;
    type: 'FILE_MONITOR' | 'TCP_LISTEN' | 'UDP_SYSLOG' | 'HEC_HTTP' | 'WIN_EVENT_LOG';
    targetPathOrPort: string;
    eps: number;
    status: 'ACTIVE_FLOW' | 'STALLED' | 'PERMISSION_DENIED';
    detailsFa: string;
  }[];
  outputs: {
    id: string;
    targetHost: string;
    port: number;
    protocol: 'SPLUNK_COOKED_TLS' | 'SPLUNK_COOKED_RAW' | 'SYSLOG_RELAY' | 'INDEX_REPLICATION' | 'HEC_HTTP' | 'REST_SYNC';
    status: 'CONNECTED' | 'BLOCKED_TIMEOUT' | 'TLS_ERROR';
    latencyMs: number;
    queuePercent: number;
  }[];
}

export interface SplunkCertificateItem {
  id: string;
  nodeId: string;
  hostname: string;
  componentRole: SplunkAgentComponentRole;
  certType: 'SPLUNKD_MANAGEMENT' | 'INPUTS_SERVER_CERT' | 'OUTPUTS_CLIENT_CERT' | 'WEB_UI_CERT' | 'SC4S_SYSLOG_TLS';
  friendlyName: string;
  certPath: string;
  keyPath: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  totalValidityDays: number;
  status: 'HEALTHY' | 'WARNING_SOON' | 'CRITICAL_EXPIRING' | 'EXPIRED';
  keyType: string; // e.g. RSA 4096-bit, ECDSA P-384
  signatureAlgorithm: string; // e.g. SHA256withRSA
  sanList: string[];
  portsSecured: number[]; // 8089, 9997, 8000, 514
  isCustomOrgCa: boolean;
  dailyDepletionRate: number; // For consumption prediction analysis
  failureImpactFa: string;
  failureImpactEn: string;
  remediationCommand: string;
}

export interface AlertNotificationChannel {
  id: string;
  name: string;
  type: 'WEBHOOK' | 'SMS' | 'EMAIL' | 'PAGERDUTY' | 'TEAMS_SLACK';
  enabled: boolean;
  endpointOrTarget: string; // Webhook URL, Phone Number(s), Email addresses
  authSecretOrToken?: string;
  providerDetails?: string; // e.g., Kavenegar, Twilio, Corporate SMTP, MS Teams Webhook
  eventsSubscribed: ('LOG_DISCONNECTED' | 'CERT_EXPIRING' | 'QUEUE_CONGESTED' | 'NODE_RECOVERED')[];
  lastSentAt?: string;
  status: 'ACTIVE' | 'TEST_SUCCESS' | 'ERROR';
}

export interface AlertRuleConfig {
  id: string;
  titleFa: string;
  titleEn: string;
  triggerCondition: 'HEARTBEAT_SILENCE_SECONDS' | 'CERT_DAYS_REMAINING' | 'QUEUE_UTILIZATION_PCT' | 'EPS_DROP_PCT';
  thresholdValue: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  targetComponentRoles: SplunkAgentComponentRole[];
  assignedChannelIds: string[];
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: string;
}

export interface RemoteCommandExecutionLog {
  id: string;
  timestamp: string;
  nodeHostname: string;
  commandExecuted: string;
  output: string;
  exitCode: number;
  executedBy: string;
  durationMs: number;
}

export interface DispatchedAlertLog {
  id: string;
  timestamp: string;
  ruleTitle: string;
  channelType: 'WEBHOOK' | 'SMS' | 'EMAIL';
  targetRecipient: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  messagePreview: string;
  deliveryStatus: 'DELIVERED_SUCCESS' | 'FAILED_RETRYING' | 'FAILED' | 'QUEUED';
  latencyMs: number;
}

export interface SplunkLicenseKeyItem {
  id: string;
  licenseKey: string;
  type: 'ENTERPRISE' | 'FORWARDER' | 'DEV_TEST' | 'TRIAL';
  label: string;
  dailyQuotaGB: number;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  features: string[];
  addedAt: string;
}

export interface SplunkLicensePool {
  id: string;
  name: string;
  allocatedQuotaGB: number;
  consumedTodayGB: number;
  stackId: string;
  description: string;
  assignedSlaves: string[];
}

export interface SplunkLicenseSlave {
  id: string;
  hostname: string;
  ip: string;
  role: string;
  assignedPool: string;
  usageTodayGB: number;
  percentageOfPool: number;
  lastContact: string;
  status: 'HEALTHY' | 'WARNING' | 'VIOLATION';
}

export interface SplunkClusterMasterState {
  hostname: string;
  ip: string;
  replicationFactor: number;
  searchFactor: number;
  rfMet: boolean;
  sfMet: boolean;
  clusterStatus: 'HEALTHY' | 'DEGRADED' | 'FIXUP_UNDERWAY';
  maintenanceMode: boolean;
  bucketsSearchable: number;
  bucketsReplicated: number;
  bucketsFixupCount: number;
  peers: {
    id: string;
    hostname: string;
    ip: string;
    status: 'Up' | 'Down' | 'Pending';
    bucketCount: number;
    diskUsagePct: number;
    site: string;
    statusMessage?: string;
  }[];
}

export interface SplunkDeploymentServerState {
  hostname: string;
  ip: string;
  connectedClientsCount: number;
  phoneHomeIntervalSecs: number;
  serverClasses: {
    name: string;
    appCount: number;
    clientCount: number;
    filterCriteria: string;
    restartRequired: boolean;
  }[];
  deploymentApps: {
    appName: string;
    version: string;
    targetServerClasses: string[];
    sizeMb: number;
    lastModified: string;
  }[];
}

export interface SplunkDeployerState {
  hostname: string;
  shcCaptain: string;
  shcMembers: string[];
  shcStatus: 'ELECTED_STABLE' | 'ELECTION_IN_PROGRESS';
  appsInShcluster: string[];
  lastBundlePush: string;
}

export interface SplunkMonitoringConsoleState {
  hostname: string;
  topologyHealthScore: number;
  clusterIndexingEps: number;
  clusterSearchConcurrency: number;
  activeResourceWarnings: string[];
}

// ==================== SPLUNK ARCHITECTURAL AUDIT & SVA BENCHMARK TYPES ====================

export type SvaTopologyCategory = 'SVA_C1_SINGLE_SITE' | 'SVA_C11_MULTI_SITE' | 'SVA_C12_MULTI_SITE_SHC' | 'SVA_C13_CROSS_REGION' | 'SVA_M14_DISTRIBUTED' | 'SVA_D1_STANDALONE' | 'SVA_SMARTSTORE_HYBRID';

export interface SvaAuditCheckItem {
  id: string;
  category: 'TOPOLOGY' | 'INDEXING_TIER' | 'SEARCH_TIER' | 'STORAGE_RETENTION' | 'INGESTION_PIPELINE' | 'HIGH_AVAILABILITY' | 'SECURITY_RBAC';
  titleFa: string;
  titleEn: string;
  status: 'COMPLIANT' | 'WARNING' | 'CRITICAL_VIOLATION' | 'OPTIMIZATION_OPPORTUNITY';
  currentValue: string;
  bestPracticeBenchmark: string;
  impactFa: string;
  impactEn: string;
  remediationFa: string;
  remediationEn: string;
  relevantConfFile: string;
  confSnippet?: string;
  architectSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
}

export interface IndexerSizingBenchmark {
  currentDailyIngestGb: number;
  peakMultiplier: number;
  currentPeakEps: number;
  actualIndexerCount: number;
  recommendedIndexerCount: number;
  coresPerIndexerCurrent: number;
  coresPerIndexerRecommended: number;
  ramPerIndexerGbCurrent: number;
  ramPerIndexerGbRecommended: number;
  iopsMeasured: number;
  iopsRequired: number;
  storageTypeCurrent: string;
  storageTypeRecommended: string;
  pipelineSetsConfigured: number;
  pipelineSetsRecommended: number;
  indexingCapacityGbPerDay: number;
  utilizationPct: number;
}

export interface SearchConcurrencyBenchmark {
  searchHeadCount: number;
  coresPerSearchHead: number;
  baseMaxSearches: number;
  maxSearchesPerCpu: number;
  totalHistoricalSearchConcurrency: number;
  maxScheduledSearchPerc: number;
  maxScheduledSearchesAllowed: number;
  currentScheduledSearchesPerInterval: number;
  scheduledSearchSkippedRatePct: number;
  realtimeSearchCount: number;
  kvstoreMemoryUsageMb: number;
  kvstoreStatus: 'HEALTHY' | 'FRAGMENTED' | 'EXHAUSTED';
  shcRaftElectionStatus: 'STABLE' | 'DEGRADED';
}

export interface StorageVolumeMath {
  dailyIngestGb: number;
  hotWarmRetentionDays: number;
  coldRetentionDays: number;
  frozenRetentionDays: number;
  compressionRatio: number; // e.g. 0.5 (raw data) + 0.15 (tsidx) = 0.65
  replicationFactor: number;
  searchFactor: number;
  hotWarmTotalTb: number;
  coldTotalTb: number;
  totalLocalDiskTb: number;
  smartStoreOffloadedTb?: number;
  annualStorageGrowthTb: number;
}

export interface FutureRiskItem {
  id: string;
  titleFa: string;
  titleEn: string;
  horizon: 'NEXT_30_DAYS' | 'NEXT_90_DAYS' | 'NEXT_180_DAYS' | 'WITHIN_1_YEAR';
  probability: 'HIGH' | 'MEDIUM' | 'CERTAIN';
  impactArea: 'INDEXING_COLLAPSE' | 'SEARCH_DEGRADATION' | 'DISK_EXHAUSTION' | 'DATA_LOSS_SPOF' | 'KVSTORE_CORRUPTION';
  triggerConditionFa: string;
  triggerConditionEn: string;
  architectEarlyWarningSign: string;
  proactiveRemediationFa: string;
  proactiveRemediationEn: string;
}

export interface SizingCalculatorInput {
  dailyIngestGb: number;
  peakFactor: number;
  hotWarmRetentionDays: number;
  coldRetentionDays: number;
  concurrentUsers: number;
  hasEnterpriseSecurity: boolean;
  hasItSI: boolean;
  multiSiteDr: boolean;
  replicationFactor: number;
  searchFactor: number;
  useSmartStore: boolean;
}

export interface SizingCalculatorResult {
  recommendedIndexers: number;
  recommendedSearchHeads: number;
  recommendedHfSc4s: number;
  recommendedMgmtNodes: { name: string; specs: string }[];
  vCpuPerIndexer: number;
  ramGbPerIndexer: number;
  iopsTargetPerIndexer: number;
  hotWarmStorageTbTotal: number;
  coldStorageTbTotal: number;
  smartStoreS3TbTotal: number;
  searchConcurrencyLimit: number;
  networkBandwidthIngestGbps: number;
  totalHardwareBillOfMaterials: {
    component: string;
    nodeCount: number;
    totalCores: number;
    totalRamGb: number;
    storageTb: number;
    recommendedRole: string;
  }[];
}

export interface TopologyDiagramNode {
  id: string;
  tier: 'SEARCH_HEAD' | 'INDEXER' | 'INGESTION' | 'MANAGEMENT' | 'STORAGE';
  name: string;
  fqdn: string;
  roleFa: string;
  roleEn: string;
  ip: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'RECOMMENDED_ADDITION';
  isRecommendedAddition?: boolean;
  recommendationReasonFa?: string;
  recommendationReasonEn?: string;
  recommendationMetric?: string;
  vCpuCurrent: number;
  vCpuRecommended: number;
  cpuUsagePct: number;
  ramGbCurrent: number;
  ramGbRecommended: number;
  ramUsagePct: number;
  iopsCurrent?: number;
  iopsRequired?: number;
  diskUsagePct?: number;
  storageTbCurrent?: number;
  storageTbRecommended?: number;
  throughput: string;
  activeSearches?: number;
  maxSearches?: number;
  skipRatePct?: number;
  ports: number[];
  clusterRole?: string;
  confSnippets?: { fileName: string; snippet: string; descriptionFa: string }[];
  cliCommands?: { labelFa: string; labelEn: string; cmd: string }[];
}

export interface VisualTopologyState {
  clusterLoadMode: 'NORMAL' | 'PEAK_SOC' | 'ES_CORRELATION';
  selectedNodeId: string | null;
  expandedTiers: Record<string, boolean>;
  showDataFlowAnimation: boolean;
  filterTier: string;
  simulatedAddedNodes: string[];
}

export interface ServerCommandLogEntry {
  id: string;
  timestamp: string;
  toolId?: string;
  toolNameFa?: string;
  toolNameEn?: string;
  command: string;
  workingDir?: string;
  user?: string;
  status: 'running' | 'success' | 'failed';
  exitCode?: number;
  durationMs?: number;
  stdout: string;
  stderr: string;
  environment?: string;
  category?: 'system' | 'network' | 'splunk' | 'docker' | 'k8s' | 'security' | 'custom_prompt';
}

export interface ServerCommandStreamStats {
  totalCount: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  lastCommandAt?: string;
  activeToolsCount: number;
}


