import {
  SplunkLicenseKeyItem,
  SplunkLicensePool,
  SplunkLicenseSlave,
  SplunkClusterMasterState,
  SplunkDeploymentServerState,
  SplunkDeployerState,
  SplunkMonitoringConsoleState
} from '../types';

export const INITIAL_LICENSE_KEYS: SplunkLicenseKeyItem[] = [
  {
    id: 'lic-ent-500gb',
    licenseKey: 'SPL-ENT-500GB-2026-PROD-9941A-SOC-CYBERDEFENSE',
    type: 'ENTERPRISE',
    label: 'Splunk Enterprise Production Core (500 GB/day)',
    dailyQuotaGB: 500,
    expirationDate: '2027-09-30',
    status: 'ACTIVE',
    features: [
      'Clustering (Search Head & Indexer)',
      'Distributed Search',
      'Splunk Enterprise Security (ES) Ready',
      'Alerting & REST API Automation',
      'SAML/LDAP SSO Integration'
    ],
    addedAt: '2025-10-01'
  },
  {
    id: 'lic-fwd-core',
    licenseKey: 'SPL-FWD-UNLIMITED-2026-8812-UNIVERSAL-AGENTS',
    type: 'FORWARDER',
    label: 'Splunk Universal & Heavy Forwarders Unlimited License',
    dailyQuotaGB: 0,
    expirationDate: '2029-12-31',
    status: 'ACTIVE',
    features: ['Unlimited Forwarder Deployment', 'Data Routing & Filtering', 'SSL/TLS Ingestion Forwarding'],
    addedAt: '2025-10-01'
  },
  {
    id: 'lic-dev-50gb',
    licenseKey: 'SPL-DEV-50GB-2026-3390-SANDBOX-TESTLAB',
    type: 'DEV_TEST',
    label: 'Splunk Developer & Staging Sandbox Stack (50 GB/day)',
    dailyQuotaGB: 50,
    expirationDate: '2027-03-31',
    status: 'ACTIVE',
    features: ['Sandbox Indexing', 'App Development Certification', 'Mock Ingestion Testing'],
    addedAt: '2026-01-15'
  }
];

export const INITIAL_LICENSE_POOLS: SplunkLicensePool[] = [
  {
    id: 'pool-soc-prod',
    name: 'SOC_Core_Production_Pool',
    allocatedQuotaGB: 300,
    consumedTodayGB: 218.4,
    stackId: 'lic-ent-500gb',
    description: 'استخر لاگ‌های حساس بانکی، فایروال‌ها، WAF و احراز هویت مرکز عملیات امنیت',
    assignedSlaves: ['idx-cluster-peer-01.corp.internal', 'idx-cluster-peer-02.corp.internal']
  },
  {
    id: 'pool-it-infra',
    name: 'IT_Infrastructure_Syslog_Pool',
    allocatedQuotaGB: 150,
    consumedTodayGB: 98.2,
    stackId: 'lic-ent-500gb',
    description: 'استخر لاگ‌های زیرساخت سرورها، ماشین‌های مجازی، سویچ‌ها و سیسلاگ SC4S',
    assignedSlaves: ['idx-cluster-peer-03.corp.internal', 'hf-gateway-dmz-01.corp.internal']
  },
  {
    id: 'pool-dev-staging',
    name: 'Dev_Staging_Pool',
    allocatedQuotaGB: 50,
    consumedTodayGB: 25.4,
    stackId: 'lic-dev-50gb',
    description: 'استخر پایپلاین تست و محیط توسعه برنامه‌نویسان',
    assignedSlaves: ['hf-dev-test-01.corp.internal']
  }
];

export const INITIAL_LICENSE_SLAVES: SplunkLicenseSlave[] = [
  {
    id: 'slave-idx-01',
    hostname: 'idx-cluster-peer-01.corp.internal',
    ip: '10.20.30.50',
    role: 'Indexer Peer (Site 1)',
    assignedPool: 'SOC_Core_Production_Pool',
    usageTodayGB: 112.5,
    percentageOfPool: 51.5,
    lastContact: '5 seconds ago',
    status: 'HEALTHY'
  },
  {
    id: 'slave-idx-02',
    hostname: 'idx-cluster-peer-02.corp.internal',
    ip: '10.20.30.51',
    role: 'Indexer Peer (Site 1)',
    assignedPool: 'SOC_Core_Production_Pool',
    usageTodayGB: 105.9,
    percentageOfPool: 48.5,
    lastContact: '12 seconds ago',
    status: 'HEALTHY'
  },
  {
    id: 'slave-idx-03',
    hostname: 'idx-cluster-peer-03.corp.internal',
    ip: '10.20.30.52',
    role: 'Indexer Peer (Site 2 - DR)',
    assignedPool: 'IT_Infrastructure_Syslog_Pool',
    usageTodayGB: 64.2,
    percentageOfPool: 42.8,
    lastContact: '8 seconds ago',
    status: 'HEALTHY'
  },
  {
    id: 'slave-hf-01',
    hostname: 'hf-gateway-dmz-01.corp.internal',
    ip: '192.168.100.10',
    role: 'Heavy Forwarder / Ingestion Gateway',
    assignedPool: 'IT_Infrastructure_Syslog_Pool',
    usageTodayGB: 34.0,
    percentageOfPool: 22.6,
    lastContact: '20 seconds ago',
    status: 'HEALTHY'
  }
];

export const INITIAL_CLUSTER_MASTER_STATE: SplunkClusterMasterState = {
  hostname: 'cm-cluster-master-01.corp.internal',
  ip: '10.20.30.40',
  replicationFactor: 3,
  searchFactor: 2,
  rfMet: true,
  sfMet: true,
  clusterStatus: 'HEALTHY',
  maintenanceMode: false,
  bucketsSearchable: 14820,
  bucketsReplicated: 44460,
  bucketsFixupCount: 0,
  peers: [
    {
      id: 'cm-p1',
      hostname: 'idx-cluster-peer-01.corp.internal',
      ip: '10.20.30.50',
      status: 'Up',
      bucketCount: 14820,
      diskUsagePct: 62.4,
      site: 'site1',
      statusMessage: 'Streaming & Ingesting'
    },
    {
      id: 'cm-p2',
      hostname: 'idx-cluster-peer-02.corp.internal',
      ip: '10.20.30.51',
      status: 'Up',
      bucketCount: 14820,
      diskUsagePct: 59.8,
      site: 'site1',
      statusMessage: 'Streaming & Ingesting'
    },
    {
      id: 'cm-p3',
      hostname: 'idx-cluster-peer-03.corp.internal',
      ip: '10.20.30.52',
      status: 'Up',
      bucketCount: 14820,
      diskUsagePct: 64.1,
      site: 'site2',
      statusMessage: 'Replication Syncing (DR)'
    }
  ]
};

export const INITIAL_DEPLOYMENT_SERVER_STATE: SplunkDeploymentServerState = {
  hostname: 'ds-deploy-server-01.corp.internal',
  ip: '10.20.30.30',
  connectedClientsCount: 1420,
  phoneHomeIntervalSecs: 30,
  serverClasses: [
    {
      name: 'linux_universal_forwarders',
      appCount: 3,
      clientCount: 850,
      filterCriteria: 'machineByform: linux-* && role: universal_forwarder',
      restartRequired: true
    },
    {
      name: 'windows_domain_controllers',
      appCount: 2,
      clientCount: 120,
      filterCriteria: 'os: Windows && machineType: domain_controller',
      restartRequired: false
    },
    {
      name: 'core_banking_app_servers',
      appCount: 4,
      clientCount: 380,
      filterCriteria: 'appGroup: core_banking',
      restartRequired: true
    },
    {
      name: 'firewall_syslog_forwarders',
      appCount: 2,
      clientCount: 70,
      filterCriteria: 'networkRole: perimeter_collector',
      restartRequired: false
    }
  ],
  deploymentApps: [
    {
      appName: 'Splunk_TA_nix',
      version: '8.8.0',
      targetServerClasses: ['linux_universal_forwarders', 'core_banking_app_servers'],
      sizeMb: 12.4,
      lastModified: '2026-08-14'
    },
    {
      appName: 'Splunk_TA_windows',
      version: '8.7.1',
      targetServerClasses: ['windows_domain_controllers'],
      sizeMb: 18.2,
      lastModified: '2026-07-22'
    },
    {
      appName: 'org_all_indexer_base_outputs',
      version: '3.1.0',
      targetServerClasses: ['linux_universal_forwarders', 'windows_domain_controllers', 'core_banking_app_servers'],
      sizeMb: 0.2,
      lastModified: '2026-09-10'
    },
    {
      appName: 'Splunk_TA_cisco-asa',
      version: '5.2.0',
      targetServerClasses: ['firewall_syslog_forwarders'],
      sizeMb: 4.8,
      lastModified: '2026-06-19'
    }
  ]
};

export const INITIAL_DEPLOYER_STATE: SplunkDeployerState = {
  hostname: 'deployer-shc-01.corp.internal',
  shcCaptain: 'sh-search-head-01.corp.internal',
  shcMembers: [
    'sh-search-head-01.corp.internal',
    'sh-search-head-02.corp.internal',
    'sh-search-head-03.corp.internal'
  ],
  shcStatus: 'ELECTED_STABLE',
  appsInShcluster: [
    'Splunk_Security_SOC_App',
    'Splunk_Enterprise_Security',
    'DA-ESS-NetworkProtection',
    'SA-ThreatIntelligence',
    'Splunk_CIM_DataModels'
  ],
  lastBundlePush: '2026-09-18 14:22:00'
};

export const INITIAL_MONITORING_CONSOLE_STATE: SplunkMonitoringConsoleState = {
  hostname: 'mc-monitoring-console-01.corp.internal',
  topologyHealthScore: 98,
  clusterIndexingEps: 18450,
  clusterSearchConcurrency: 24,
  activeResourceWarnings: [
    'نود idx-03 در طول چرخش باکت‌ها در ساعت ۰۲:۰۰ دارای اسپایک I/O موقت بود.',
    'وضعیت چرخش باکت‌ها از Hot به Warm در محدوده کاملاً استاندارد قرار دارد.'
  ]
};
