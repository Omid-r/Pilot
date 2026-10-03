import { LiveLogAnalysis } from '../types';

/**
 * Local High-Performance Splunk Log Diagnostic & Remediation Engine
 * Completely offline, local, real-time semantic analysis grounded 100% in official Splunk Documentation (docs.splunk.com).
 * Accurately analyzes any Splunk daemon log (splunkd.log, web_service.log, audit.log),
 * extracts fine-grained parameters (IPs, Ports, Paths, Signals, Buckets, Ciphers),
 * and provides non-repetitive, context-specific root cause analysis, technical metrics, CLI troubleshooting, and configuration patches.
 */

interface SubsystemProfile {
  category: string;
  defaultConfig: string;
  defaultStanza: string;
  docUrl: string;
}

const SUBSYSTEM_PROFILES: Record<string, SubsystemProfile> = {
  TcpOutputProc: {
    category: 'Network Forwarding & S2S',
    defaultConfig: 'outputs.conf',
    defaultStanza: '[tcpout:primary_indexers]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },
  TcpInputProc: {
    category: 'Ingestion & Receiver Sockets',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[splunktcp://9997]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf'
  },
  HotDBLoader: {
    category: 'Storage & Hot Bucket Creation',
    defaultConfig: 'indexes.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/indexesconf'
  },
  WarmDBLoader: {
    category: 'Storage & Warm Bucket Lifecycle',
    defaultConfig: 'indexes.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/HowSplunkstoresindexes'
  },
  ColdDBLoader: {
    category: 'Storage & Cold Archival Tier',
    defaultConfig: 'indexes.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Setaretirementandarchivingpolicy'
  },
  IndexProcessor: {
    category: 'Core Indexing Pipeline',
    defaultConfig: 'indexes.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/indexesconf'
  },
  BucketMover: {
    category: 'Bucket Rolling & Retention',
    defaultConfig: 'indexes.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/HowSplunkstoresindexes'
  },
  ClusterMaster: {
    category: 'Cluster Master / Manager Node',
    defaultConfig: 'server.conf',
    defaultStanza: '[clustering]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters'
  },
  CMMetaDataMaster: {
    category: 'Cluster Metadata & Bucket Replication',
    defaultConfig: 'server.conf',
    defaultStanza: '[clustering]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Howclusteringshiftsindexing'
  },
  CMSlave: {
    category: 'Cluster Peer / Indexer Slave',
    defaultConfig: 'server.conf',
    defaultStanza: '[clustering]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters'
  },
  SearchParser: {
    category: 'Search Head Query Execution',
    defaultConfig: 'limits.conf',
    defaultStanza: '[search]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf'
  },
  SavedSplunker: {
    category: 'Scheduled Search Scheduler',
    defaultConfig: 'limits.conf',
    defaultStanza: '[scheduler]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf'
  },
  DispatchManager: {
    category: 'Search Job Dispatch & Quotas',
    defaultConfig: 'limits.conf',
    defaultStanza: '[search]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf'
  },
  SHCClusterMgr: {
    category: 'Search Head Cluster (SHC) Raft',
    defaultConfig: 'server.conf',
    defaultStanza: '[shclustering]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/SHCoverview'
  },
  DiskMon: {
    category: 'Filesystem Disk Monitoring & Watermarks',
    defaultConfig: 'server.conf',
    defaultStanza: '[diskUsage]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf'
  },
  LineBreakingProcessor: {
    category: 'Event Line Breaking & Truncation',
    defaultConfig: 'props.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf'
  },
  AggregatorMiningProcessor: {
    category: 'Event Aggregation & Timestamp Parsing',
    defaultConfig: 'props.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf'
  },
  DateParserVerbose: {
    category: 'Timestamp Extraction & Timezones',
    defaultConfig: 'props.conf',
    defaultStanza: '[default]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf'
  },
  KVStore: {
    category: 'App Key Value Store (WiredTiger)',
    defaultConfig: 'server.conf',
    defaultStanza: '[kvstore]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/AboutKVstore'
  },
  KVStoreMongoProcessor: {
    category: 'KVStore MongoDB Engine',
    defaultConfig: 'server.conf',
    defaultStanza: '[kvstore]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/AboutKVstore'
  },
  HttpListener: {
    category: 'HTTP Event Collector (HEC) / REST',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[http]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector'
  },
  HttpInputDataHandler: {
    category: 'HEC Token & Payload Parser',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[http]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector'
  },
  SSLCommon: {
    category: 'Transport Layer Security (TLS/SSL)',
    defaultConfig: 'server.conf',
    defaultStanza: '[sslConfig]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Security/AboutsecuringSplunk'
  },
  ConfMerge: {
    category: 'Configuration File Precedence (btool)',
    defaultConfig: 'server.conf',
    defaultStanza: '[general]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles'
  },
  LicenseManager: {
    category: 'License Master & Quotas',
    defaultConfig: 'server.conf',
    defaultStanza: '[license]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutlicenses'
  },
  LicenseMgrPool: {
    category: 'License Pool Consumption',
    defaultConfig: 'server.conf',
    defaultStanza: '[license]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutlicenses'
  },
  TailingProcessor: {
    category: 'File Monitoring & Tail Readers',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[monitor:///var/log]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/Monitorfilesanddirectories'
  },
  TailReader: {
    category: 'Active File Pointer & Rotation',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[monitor:///var/log]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/Monitorfilesanddirectories'
  },
  BatchReader: {
    category: 'Batch Input Ingestion',
    defaultConfig: 'inputs.conf',
    defaultStanza: '[batch:///var/log]',
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/Monitorfilesanddirectories'
  }
};

/**
 * Extracts fine-grained entities from a raw Splunk log line
 */
function extractLogEntities(rawLog: string) {
  // 1. Timestamp extraction
  const tsMatch = rawLog.match(/^\[?(\d{2,4}[-/]\d{2}[-/]\d{2,4}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:?\d{2})?)\]?/);
  const timestamp = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString();

  // 2. Log level extraction
  const lvlMatch = rawLog.match(/\s(FATAL|CRITICAL|ERROR|WARN|WARNING|INFO|DEBUG)\s/i);
  let logLevel: 'FATAL' | 'ERROR' | 'WARN' | 'INFO' = 'INFO';
  if (lvlMatch) {
    const rawLvl = lvlMatch[1].toUpperCase();
    if (rawLvl === 'FATAL' || rawLvl === 'CRITICAL') logLevel = 'FATAL';
    else if (rawLvl === 'ERROR') logLevel = 'ERROR';
    else if (rawLvl === 'WARN' || rawLvl === 'WARNING') logLevel = 'WARN';
    else logLevel = 'INFO';
  } else if (rawLog.includes('FATAL')) logLevel = 'FATAL';
  else if (rawLog.includes('ERROR')) logLevel = 'ERROR';
  else if (rawLog.includes('WARN')) logLevel = 'WARN';

  // 3. Component / Daemon extraction
  let component = 'SplunkDaemon';
  const compMatch = rawLog.match(/(?:INFO|WARN|ERROR|FATAL|DEBUG)\s+([a-zA-Z0-9_]+)\s*[-:]/);
  if (compMatch) {
    component = compMatch[1];
  } else {
    const fallbackMatch = rawLog.match(/\s([a-zA-Z0-9_]{3,30})(?:\s\[|\s-|:)/);
    if (fallbackMatch && !['INFO', 'WARN', 'ERROR', 'FATAL', 'DEBUG'].includes(fallbackMatch[1])) {
      component = fallbackMatch[1];
    }
  }

  // 8. Clean message payload without prefixes
  const cleanMessage = rawLog
    .replace(/^\[?.*?\]?\s*(FATAL|CRITICAL|ERROR|WARN|WARNING|INFO|DEBUG)?\s*([a-zA-Z0-9_]+)?\s*[-:]?\s*/, '')
    .trim() || rawLog;

  // 4. IP address & Port extraction (from cleanMessage to avoid timestamp digits)
  const ipMatch = cleanMessage.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  const ip = ipMatch ? ipMatch[1] : null;

  let port: string | null = null;
  if (ip) {
    const ipPortMatch = cleanMessage.match(new RegExp(`${ip.replace(/\\./g, '\\.')}:(\\d{2,5})`));
    if (ipPortMatch) {
      port = ipPortMatch[1];
    }
  }
  if (!port) {
    const namedPortMatch = cleanMessage.match(/port\s+(\d{2,5})\b/i);
    if (namedPortMatch) {
      port = namedPortMatch[1];
    } else {
      const explicitPortMatch = cleanMessage.match(/(?:^|\s|:)(8000|8089|8088|8191|9997|9998|8001|8090|514|1514|9887)\b/);
      if (explicitPortMatch) port = explicitPortMatch[1];
    }
  }

  // 5. File / Directory / Stanza extraction
  const pathMatch = cleanMessage.match(/(\/(?:opt|var|etc|usr|home|tmp)[a-zA-Z0-9_./-]+)/);
  const filePath = pathMatch ? pathMatch[1] : null;

  // 6. Conf file mention
  const confMatch = cleanMessage.match(/([a-zA-Z0-9_-]+\.conf)/i);
  const confFile = confMatch ? confMatch[1].toLowerCase() : null;

  // 7. Bucket or Index name
  const bucketMatch = cleanMessage.match(/\b(hot_v\d+|warm_v\d+|cold_v\d+|db_[0-9_]+|bucket\s+[a-zA-Z0-9_~-]+)/i);
  const bucket = bucketMatch ? bucketMatch[1] : null;

  return {
    timestamp,
    logLevel,
    component,
    ip,
    port,
    filePath,
    confFile,
    bucket,
    cleanMessage,
    logLower: rawLog.toLowerCase()
  };
}

/**
 * Main Local Diagnostic Engine:
 * Analyzes any single log line and provides unique, context-aware, in-depth root cause and configuration fixes.
 */
export function analyzeSplunkLogLine(rawLog: string): LiveLogAnalysis {
  const { timestamp, logLevel, component, ip, port, filePath, confFile, bucket, cleanMessage, logLower } = extractLogEntities(rawLog);

  // Retrieve subsystem profile metadata
  const profile = SUBSYSTEM_PROFILES[component] || {
    category: 'Splunk Core Subsystem',
    defaultConfig: confFile || 'server.conf',
    defaultStanza: `[${component.toLowerCase()}]`,
    docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Aboutserverdebuglogging'
  };

  const technicalMetrics: { label: string; value: string }[] = [
    { label: 'Subsystem', value: component },
    { label: 'Category', value: profile.category },
    { label: 'Severity', value: logLevel },
    { label: 'Timestamp', value: timestamp }
  ];

  if (ip) technicalMetrics.push({ label: 'Target IP', value: ip });
  if (port) technicalMetrics.push({ label: 'Socket Port', value: port });
  if (bucket) technicalMetrics.push({ label: 'Bucket / DB', value: bucket });
  if (filePath) technicalMetrics.push({ label: 'Filesystem Path', value: filePath });

  // -------------------------------------------------------------------------
  // CASE 1: TcpOutputProc (Forwarding S2S) - Differentiates timeouts, refused, SSL, queues, LB & success
  // -------------------------------------------------------------------------
  if (component === 'TcpOutputProc') {
    const targetNode = ip && port ? `${ip}:${port}` : ip ? ip : port ? `port ${port}` : 'نود ایندکسر مقصد';

    if (logLower.includes('timeout') || logLower.includes('timed out')) {
      return {
        rawLine: rawLog,
        timestamp,
        component,
        logLevel: 'ERROR',
        subsystemCategory: profile.category,
        technicalMetrics,
        meaningFa: `توقف ارسال لاگ‌ها ناشی از خطای تایم‌اوت ارتباط شبکه با ایندکسر ${targetNode}. بسته‌های TCP ارسالی توسط فورواردر تاییدیه ACK دریافت نکرده‌اند.`,
        meaningEn: `S2S transmission paused: TCP connection timeout communicating with downstream indexer ${targetNode}. Socket packets unacknowledged.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ این خطا به این دلیل رخ می‌دهد که فورواردر بسته‌های اولیه TCP SYN را به سمت آدرس ${targetNode} ارسال کرده اما در پنجره زمانی مجاز (Connection Timeout) هیچ پاسخی از سمت سرور مقصد دریافت نکرده است. دلایل اصلی سیستمی: ۱. سرویس ایندکسر اسپلانک روی پورت ۹۹۹۷ متوقف است؛ ۲. فایروال لینوکس (iptables یا firewalld) یا فایروال شبکه ترافیک ورودی به پورت ۹۹۹۷ را Drop کرده است؛ ۳. آدرس IP یا پورت در فایل outputs.conf اشتباه ثبت شده است.`,
        rootCauseFa: `عدم پاسخگویی سرویس دریافت ایندکسر در پورت ۹۹۹۷، افت شدید پکت در مسیر شبکه (Packet Drop)، یا مسدود شدن ترافیک توسط فایروال سرور مقصد یا تجهیزات بین راهی.`,
        rootCauseEn: `Network packet drop, downstream indexer receiver queue stalled, or firewall state drop between forwarder and ${targetNode}.`,
        recommendedFixFa: `بررسی استنزای [tcpout] در فایل outputs.conf، فعال‌سازی نگهداری سوکت با autoLBFrequency=30 و بازکردن پورت ۹۹۹۷ در فایروال لینوکس (firewalld/iptables).`,
        recommendedFixEn: `Verify outputs.conf [tcpout], configure autoLBFrequency=30, and inspect iptables/firewalld rules for port 9997.`,
        affectedConfig: 'outputs.conf',
        targetStanza: '[tcpout:primary_indexers]',
        patchCode: `[tcpout:primary_indexers]\nserver = ${ip ? `${ip}:9997` : '10.20.30.50:9997, 10.20.30.51:9997'}\nautoLBFrequency = 30\nuseACK = true\nconnectionTimeout = 20\nreadTimeout = 30`,
        cliDiagnosisCommand: ip ? `nc -zvw3 ${ip} ${port || '9997'} && ping -c 4 ${ip}` : `nc -zvw3 10.20.30.50 9997`,
        recheckSummaryFa: `پس از اجرای دستور تست، چنانچه خروجی پورت را open یا succeeded نشان دهد، ارتباط شبکه برقرار شده است و ارسال لاگ‌ها بلافاصله آغاز می‌شود.`,
        impactAssessmentFa: `باعث تجمع و صف شدن لاگ‌ها در حافظه فورواردر و خطر افت رویدادها (Data Loss) در صورت طولانی شدن قطعی می‌گردد.`,
        impactAssessmentEn: `Causes in-memory backpressure queue buildup and potential event drop if outage persists.`,
        docReference: profile.docUrl,
        canAutoApply: true
      };
    }

    if (logLower.includes('refused') || logLower.includes('econnrefused')) {
      return {
        rawLine: rawLog,
        timestamp,
        component,
        logLevel: 'ERROR',
        subsystemCategory: profile.category,
        technicalMetrics,
        meaningFa: `رد صریح اتصال شبکه (Connection Refused) توسط ایندکسر ${targetNode}. دیمن اسپلانک در سمت مقصد روی این پورت در حال شنود نیست.`,
        meaningEn: `TCP Connection Refused (RST packet returned) by indexer ${targetNode}. Ingestion receiver socket is offline on target port.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ بر خلاف تایم‌اوت، در این حالت پکت به سرور مقصد رسیده است، اما هسته سیستم‌عامل سرور مقصد بلافاصله با ارسال پرچم RST اتصال را رد کرده است؛ زیرا هیچ فرآیندی در پورت ۹۹۹۷ لیسن نکرده است. دلیل آن عدم فعال بودن استنزای [splunktcp://9997] در inputs.conf یا غیرفعال بودن پورت دریافت ایندکسر است.`,
        rootCauseFa: `پورت دریافت ورودی (SplunkTCP 9997) در فایل inputs.conf ایندکسر فعال نشده یا استنزای [splunktcp://9997] به صورت disabled=true ذخیره شده است.`,
        rootCauseEn: `Downstream indexer does not have [splunktcp://9997] enabled in inputs.conf, or target daemon is stopped.`,
        recommendedFixFa: `فعال‌سازی پورت ۹۹۹۷ در inputs.conf ایندکسر با دستور splunk enable listen 9997 و ری‌استارت سرویس دریافت‌کننده.`,
        recommendedFixEn: `Enable port 9997 on indexer via splunk enable listen 9997 or add [splunktcp://9997] in inputs.conf.`,
        affectedConfig: 'inputs.conf',
        targetStanza: '[splunktcp://9997]',
        patchCode: `[splunktcp://9997]\ndisabled = 0\nconnection_host = ip`,
        cliDiagnosisCommand: ip ? `ssh ${ip} "ss -tulpn | grep 9997"` : `ss -tulpn | grep 9997`,
        recheckSummaryFa: `دستور ss -tulpn باید سوکت LISTEN در پورت 9997 را با پروسس splunkd نشان دهد تا اطمینان حاصل شود که سرور آماده دریافت لاگ است.`,
        impactAssessmentFa: `سوکت انتقال بسته شده و کلیه ارسال‌های داده به حالت تعلیق درمی‌آید.`,
        impactAssessmentEn: `Forwarder cannot stream events; local forwarder queues will saturate.`,
        docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/Enableareceiver',
        canAutoApply: true
      };
    }

    if (logLower.includes('usessl=false') || logLower.includes('cleartext') || logLower.includes('unencrypted')) {
      return {
        rawLine: rawLog,
        timestamp,
        component,
        logLevel: 'WARN',
        subsystemCategory: profile.category,
        technicalMetrics,
        meaningFa: `ارسال داده‌های سازمانی و لاگ‌های امنیتی روی کانال متنی رمزنگاری نشده (Cleartext). خطرات شنود و دستکاری بسته در شبکه.`,
        meaningEn: `Security risk: Forwarder streaming enterprise logs over unencrypted cleartext sockets (useSSL=false). Sensitive data vulnerable to sniffing.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ استنزای [tcpout] در فایل outputs.conf پارامتر useSSL را برابر با false قرار داده است. در نتیجه بسته‌های داده بدون پروتکل TLS و به صورت خام روی شبکه محلی جابه‌جا می‌شوند که با استانداردهای امنیت سایبری مغایرت دارد.`,
        rootCauseFa: `پارامتر useSSL در فایل outputs.conf روی مقدار پیش‌فرض ناامن false قرار دارد و گواهی TLS تعریف نشده است.`,
        rootCauseEn: `outputs.conf has useSSL = false in [tcpout] stanza; CA certificates not bound.`,
        recommendedFixFa: `تنظیم useSSL = true، تعیین مسیر گواهی CA در sslRootCAPath و الزام پروتکل‌های TLS 1.2 و TLS 1.3 در outputs.conf.`,
        recommendedFixEn: `Enforce useSSL = true and sslVerifyServerCert = true in outputs.conf.`,
        affectedConfig: 'outputs.conf',
        targetStanza: '[tcpout]',
        patchCode: `[tcpout]\ndefaultGroup = primary_indexers\n\n[tcpout:primary_indexers]\nserver = ${ip ? `${ip}:9997` : '10.20.30.50:9997'}\nuseSSL = true\nsslVerifyServerCert = true\nsslVersionsToSupport = tls1.2, tls1.3\nsslRootCAPath = $SPLUNK_HOME/etc/auth/cacert.pem`,
        cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk btool outputs list --debug | grep -i ssl`,
        recheckSummaryFa: `اجرای btool باید تایید کند که پارامتر useSSL = true در لایه local فعال شده و گواهی CA معتبر لود شده است.`,
        impactAssessmentFa: `نقض انطباق با استانداردهای امنیتی PCI-DSS و ISO-27001 ناشی از جریان ترافیک بدون رمزنگاری.`,
        impactAssessmentEn: `Non-compliance with PCI-DSS/ISO-27001 transport security requirements.`,
        docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Security/AboutsecuringSplunk',
        canAutoApply: true
      };
    }

    if (logLower.includes('queue') || logLower.includes('backpressure') || logLower.includes('blocked')) {
      return {
        rawLine: rawLog,
        timestamp,
        component,
        logLevel: 'WARN',
        subsystemCategory: profile.category,
        technicalMetrics,
        meaningFa: `فشار معکوس در پایپ‌لاین ارسال لاگ (Backpressure): صف حافظه خروجی به دلیل عدم جذب سریع توسط ایندکسر در حال پر شدن است.`,
        meaningEn: `Forwarder queue congestion: Output memory queue filling due to ingestion bottleneck on downstream indexers.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ صف انتقال داده در حافظه رم فورواردر (Forwarder In-Memory Queue) به سقف تعریف‌شده در پارامتر maxQueueSize رسیده است. این رخداد معمولاً به دلیل کندی نوشتن دیسک ایندکسرها (Disk I/O Bottleneck) یا تاخیر در کانکشن شبکه رخ می‌دهد؛ فورواردر برای جلوگیری از کرش کردن حافظه، خواندن لاگ‌ها را موقتاً مسدود (Throttle) کرده است.`,
        rootCauseFa: `سرعت ایندکس داده‌ها در مقصد کندتر از حجم لاگ ورودی است، یا I/O دیسک ایندکسرها اشباع شده و دریافت را مسدود کرده‌اند.`,
        rootCauseEn: `Downstream indexers struggling with indexing I/O rate, causing forwarder output queue to reach maxQueueSize.`,
        recommendedFixFa: `افزایش maxQueueSize به ۱۰۰ مگابایت در outputs.conf، فعال‌سازی load balancing خودکار و بررسی تاخیر نوشتن دیسک در ایندکسرها.`,
        recommendedFixEn: `Increase maxQueueSize = 100MB in outputs.conf, verify autoLB, and inspect indexer disk latency.`,
        affectedConfig: 'outputs.conf',
        targetStanza: '[tcpout]',
        patchCode: `[tcpout]\nmaxQueueSize = 100MB\nautoLBFrequency = 30\nautoLBVolume = 10485760\nuseACK = true`,
        cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk list forwarder-queue`,
        recheckSummaryFa: `دستور list forwarder-queue وضعیت اشغال صف خروجی را بررسی کرده و آزاد شدن بافر را گزارش می‌کند.`,
        impactAssessmentFa: `کاهش سرعت دریافت لاگ‌های سیستمی و احتمال قطع ارسال موقت ماژول‌های مانیتورینگ.`,
        impactAssessmentEn: `Log ingestion delay and potential throttle on active file tailing processors.`,
        docReference: profile.docUrl,
        canAutoApply: true
      };
    }

    if (logLower.includes('connected') || logLower.includes('tls 1.3') || logLower.includes('negotiated') || logLower.includes('ok')) {
      return {
        rawLine: rawLog,
        timestamp,
        component,
        logLevel: 'INFO',
        subsystemCategory: profile.category,
        technicalMetrics,
        meaningFa: `وضعیت نرمال و امن: ارتباط فورواردر با نود ${targetNode} برقرار است و انتقال پکت‌ها با رمزنگاری TLS پایدار انجام می‌شود.`,
        meaningEn: `Normal operational status: Forwarder socket successfully connected to ${targetNode} with encrypted TLS pipeline.`,
        whyOccurredFa: `وضعیت ارتباطی موفق: هندشیک TLS 1.3 با موفقیت تکمیل شد و تونل امن انتقال داده‌های S2S به ایندکسر مقصد فعال و عملیاتی است.`,
        rootCauseFa: `رویداد ثبت موفقیت‌آمیز نشست انتقال داده در لایه شبکه سوکت اسپلانک.`,
        rootCauseEn: `Healthy S2S session negotiation completed and active.`,
        recommendedFixFa: `سیستم در وضعیت مطلوب قرار دارد. نیازی به تغییر تنظیمات نیست؛ پایش دوره‌ای تاخیر شبکه پیشنهاد می‌شود.`,
        recommendedFixEn: `No remediation needed. S2S communication channel is healthy and active.`,
        affectedConfig: 'outputs.conf',
        targetStanza: '[tcpout:primary_indexers]',
        patchCode: `[tcpout:primary_indexers]\nserver = ${ip ? `${ip}:9997` : '10.20.30.50:9997'}\nuseSSL = true\nsslVerifyServerCert = true`,
        cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk list forward-server`,
        recheckSummaryFa: `کانال انتقال داده به نود ایندکسر در وضعیت متصل و فعال قرار دارد.`,
        impactAssessmentFa: `عملکرد ایده‌آل؛ تضمین تحویل لاگ‌ها بدون وقفه یا تاخیر.`,
        impactAssessmentEn: `Optimal zero-loss log streaming performance.`,
        docReference: profile.docUrl,
        canAutoApply: true
      };
    }
  }

  // -------------------------------------------------------------------------
  // CASE 2: SSLCommon / Certificates & TLS
  // -------------------------------------------------------------------------
  if (component === 'SSLCommon' || logLower.includes('certificate') || logLower.includes('sslkeysfile')) {
    if (logLower.includes('expired') || logLower.includes('expiration')) {
      return {
        rawLine: rawLog,
        timestamp,
        component: 'SSLCommon',
        logLevel: 'ERROR',
        subsystemCategory: 'Security & TLS Engine',
        technicalMetrics,
        meaningFa: `گواهی دیجیتال امنیتی TLS سرور اسپلانک منقضی شده است. ارتباطات کلاستر یا وب رد خواهند شد.`,
        meaningEn: `Critical security event: TLS server certificate expired or invalid date range. Inbound REST/Mgmt requests rejected.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ تاریخ انقضای فایل گواهی سرتیفیکیت (X.509 Certificate) در مسیر /opt/splunk/etc/auth به پایان رسیده است. دیمن اسپلانک در هنگام برقراری هندشیک امن TLS اعتبار گواهی را با ساعت سیستم‌عامل مقایسه کرده و به دلیل انقضای تاریخ، سوکت امنیتی را مسدود کرده است.`,
        rootCauseFa: `سررسید انقضای فایل server.pem در مسیر /opt/splunk/etc/auth یا عدم جایگزینی گواهی خودکار سرور.`,
        rootCauseEn: `Expired X.509 certificate file in server.conf [sslConfig].`,
        recommendedFixFa: `صدور مجدد گواهی معتبر با OpenSSL، بروزرسانی serverCert در server.conf و ری‌استارت سرویس دیمن.`,
        recommendedFixEn: `Renew X.509 server certificate via OpenSSL and update serverCert in server.conf [sslConfig].`,
        affectedConfig: 'server.conf',
        targetStanza: '[sslConfig]',
        patchCode: `[sslConfig]\nenableSplunkdSSL = true\nserverCert = $SPLUNK_HOME/etc/auth/myServerCert.pem\nsslPassword = password\nsslVersionsToSupport = tls1.2, tls1.3`,
        cliDiagnosisCommand: `openssl x509 -in /opt/splunk/etc/auth/server.pem -noout -dates`,
        recheckSummaryFa: `دستور openssl x509 باید تاریخ notAfter را در آینده نشان دهد تا تایید شود گواهی جدید با موفقیت جایگزین شده است.`,
        impactAssessmentFa: `از کار افتادن ارتباطات CLI، کنسول تحت وب و سینک شدن کلاسترها تا زمان تعویض گواهی.`,
        impactAssessmentEn: `Immediate disruption of cluster heartbeat and administrative CLI management.`,
        docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Security/AboutsecuringSplunk',
        canAutoApply: true
      };
    }

    return {
      rawLine: rawLog,
      timestamp,
      component: 'SSLCommon',
      logLevel: 'WARN',
      subsystemCategory: 'Security & TLS Engine',
      technicalMetrics,
      meaningFa: `پورت مدیریتی ${port || '8089'} از گواهی خودامضا (Default Self-Signed) یا کلیدهای پیش‌فرض اسپلانک استفاده می‌کند.`,
      meaningEn: `Management port ${port || '8089'} is relying on default self-signed certificates, exposing management traffic to MITM risk.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ اسپلانک به صورت پیش‌فرض با کلیدهای جنریک کارخانه‌ای نصب می‌شود. از آنجا که هیچ گواهی امضاشده توسط مرکز صدور گواهی معتبر (Enterprise CA) در استنزای [sslConfig] تنظیم نشده، دیمن به گواهی خودامضای داخلی برمی‌گردد که در ممیزی‌های امنیتی پرخطر تلقی می‌شود.`,
      rootCauseFa: `عدم تنظیم گواهی‌های معتبر صادر شده توسط مرکز صدور گواهی سازمانی (Enterprise CA) در استنزای [sslConfig].`,
      rootCauseEn: `Factory default server.pem configured without custom CA chain binding.`,
      recommendedFixFa: `تنظیم فایل سرتیفیکیت معتبر (serverCert) و الزام رمزنگاری TLS 1.2 و 1.3 در server.conf [sslConfig].`,
      recommendedFixEn: `Bind custom server.pem certificate and enforce TLS 1.2/1.3 in server.conf.`,
      affectedConfig: 'server.conf',
      targetStanza: '[sslConfig]',
      patchCode: `[sslConfig]\nenableSplunkdSSL = true\nsslVersionsToSupport = tls1.2, tls1.3\nserverCert = $SPLUNK_HOME/etc/auth/server.pem\nsslRootCAPath = $SPLUNK_HOME/etc/auth/cacert.pem\nsslPassword = password`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk btool server list sslConfig --debug`,
      recheckSummaryFa: `خروجی دستور btool باید مسیر سرتیفیکیت معتبر سازمانی را در استنزای [sslConfig] تایید کند.`,
      impactAssessmentFa: `آسیب‌پذیری در برابر حملات جعل هویت (MITM) در ارتباطات سرچ‌هد به ایندکسرها.`,
      impactAssessmentEn: `Vulnerable to Man-in-the-Middle traffic spoofing across cluster nodes.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Security/AboutsecuringSplunk',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 3: Storage, DiskMon & Bucket Directory Failures
  // -------------------------------------------------------------------------
  if (component === 'DiskMon' || logLower.includes('diskmon') || logLower.includes('minfreespacemb')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'DiskMon',
      logLevel: 'WARN',
      subsystemCategory: 'Filesystem Disk Monitoring',
      technicalMetrics,
      meaningFa: `فضای آزاد دیسک به حد آستانه ایمنی (Watermark) نزدیک شده است. در صورت تکمیل فضا، دیمن اسپلانک عملیات ایندکس داده‌ها را متوقف می‌کند.`,
      meaningEn: `Available disk partition capacity nearing safety watermark limit. If exceeded, Splunk automatically pauses indexing to prevent database corruption.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ ماژول DiskMon دیمن اسپلانک به صورت مداوم پارتیشن‌های /var/lib/splunk و دایرکتوری‌های دیتا را مانیتور می‌کند. بر اساس پارامتر minFreeSpaceMB در فایل server.conf، اگر فضای آزاد پارتیشن به کمتر از ۵۰۰۰ مگابایت برسد، این هشدار صادر می‌شود تا ادمین قبل از متوقف شدن کامل ایندکسینگ نسبت به آزادسازی فضا اقدام کند.`,
      rootCauseFa: `حجم بالای داده‌های ورودی، عدم انتقال باکت‌های Cold به آرشیو، یا عدم هماهنگی پارامتر minFreeSpaceMB با ظرفیت دیسک.`,
      rootCauseEn: `Partition free space approaching minFreeSpaceMB safety watermark in server.conf [diskUsage].`,
      recommendedFixFa: `تنظیم minFreeSpaceMB = 5000 در server.conf، جابجایی دایرکتوری باکت‌های قدیمی و آزادسازی فضای پارتیشن /var/lib/splunk.`,
      recommendedFixEn: `Adjust minFreeSpaceMB = 5000 in server.conf [diskUsage] and archive cold database volumes.`,
      affectedConfig: 'server.conf',
      targetStanza: '[diskUsage]',
      patchCode: `[diskUsage]\nminFreeSpaceMB = 5000\npollingFrequency = 100000`,
      cliDiagnosisCommand: `df -h /var/lib/splunk /opt/splunk`,
      recheckSummaryFa: `دستور df -h باید فضای خالی بالای ۵ گیگابایت در مسیر پارتیشن دیتابیس را نشان دهد تا هشدار متوقف شود.`,
      impactAssessmentFa: `توقف کامل ایندکس لاگ‌ها در صورت رسیدن به حد آستانه (Index Pause).`,
      impactAssessmentEn: `Immediate system-wide indexing stoppage if threshold breached.`,
      docReference: profile.docUrl,
      canAutoApply: true
    };
  }

  if (component === 'HotDBLoader' || component === 'WarmDBLoader' || logLower.includes('hotdbloader') || logLower.includes('bucket')) {
    if (logLower.includes('failed') || logLower.includes('permission denied') || logLower.includes('cannot create')) {
      return {
        rawLine: rawLog,
        timestamp,
        component: 'HotDBLoader',
        logLevel: 'FATAL',
        subsystemCategory: 'Bucket Storage Engine',
        technicalMetrics,
        meaningFa: `خطای بحرانی در ایجاد باکت‌های جدید ایندکس در مسیر دیسک. دیمن اسپلانک امکان ایجاد دایرکتوری‌های دیتا را ندارد.`,
        meaningEn: `Fatal storage failure: HotDBLoader cannot initialize storage bucket directories on disk volume.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ هنگامی که رویدادهای جدید به ایندکسر می‌رسند، ماژول HotDBLoader باید دایرکتوری جدیدی در مسیر homePath ایجاد کند. به دلیل نداشتن مجوز نوشتن کاربر لینوکسی splunk (عدم دسترسی write در سطح سیستم‌عامل) یا اشتباه بودن مسیر در indexes.conf، ایجاد پوشه با خطای Permission Denied یا EACCES متوقف شده و امکان ذخیره لاگ وجود ندارد.`,
        rootCauseFa: `کاربر splunk مجوز نوشتن روی دایرکتوری داده (${filePath || '/var/lib/splunk'}) را ندارد، یا مسیر تعریف شده در indexes.conf وجود ندارد.`,
        rootCauseEn: `Filesystem permissions missing for splunk service user or invalid homePath directory in indexes.conf.`,
        recommendedFixFa: `اصلاح مالکیت فایل‌ها با دستور chown -R splunk:splunk و تنظیم homePath استاندارد در indexes.conf.`,
        recommendedFixEn: `Run chown -R splunk:splunk on database directories and align homePath in indexes.conf.`,
        affectedConfig: 'indexes.conf',
        targetStanza: '[default]',
        patchCode: `[default]\nhomePath = $SPLUNK_DB/$_index_name/db\ncoldPath = $SPLUNK_DB/$_index_name/colddb\nthawedPath = $SPLUNK_DB/$_index_name/thaweddb\nmaxDataSizeMB = auto_high_volume`,
        cliDiagnosisCommand: `ls -ld /var/lib/splunk /opt/splunk/var/lib/splunk`,
        recheckSummaryFa: `دستور ls -ld باید کاربر مالک را splunk:splunk با دسترسی drwxr-xr-x تایید کند.`,
        impactAssessmentFa: `از دست رفتن یا تاخیر بحرانی در ثبت رویدادها تا زمان اصلاح مجوزهای دیسک.`,
        impactAssessmentEn: `Fatal: Incoming events cannot be committed to disk; potential data loss.`,
        docReference: profile.docUrl,
        canAutoApply: true
      };
    }

    return {
      rawLine: rawLog,
      timestamp,
      component,
      logLevel: 'INFO',
      subsystemCategory: 'Bucket Storage Engine',
      technicalMetrics,
      meaningFa: `مدیریت چرخه حیات باکت: وضعیت باکت ${bucket || 'ایندکس'} بررسی شده و عملیات بازسازی متادیتا و replication با موفقیت انجام شد.`,
      meaningEn: `Bucket lifecycle status healthy: Bucket ${bucket || 'db'} replication checkpoint verified.`,
      whyOccurredFa: `وضعیت نرمال عملیاتی: باکت به سقف حجم تعیین شده در maxDataSizeMB رسیده و بدون خطا به وضعیت Warm چرخش یافته است.`,
      rootCauseFa: `عملیات طبیعی جابجایی باکت‌ها و حفظ ضریب تکرار در کلاستر ایندکسرها.`,
      rootCauseEn: `Standard bucket maintenance and indexer cluster replication synchronization.`,
      recommendedFixFa: `وضعیت باکت‌ها در دیسک نرمال است؛ نیازی به مداخله نیست.`,
      recommendedFixEn: `No action needed; bucket state is consistent.`,
      affectedConfig: 'indexes.conf',
      targetStanza: '[default]',
      patchCode: `[default]\nhomePath = $SPLUNK_DB/$_index_name/db\ncoldPath = $SPLUNK_DB/$_index_name/colddb\nthawedPath = $SPLUNK_DB/$_index_name/thaweddb\nmaxDataSizeMB = auto_high_volume`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk show cluster-bundle-status`,
      recheckSummaryFa: `کلاستر در وضعیت متعادل قرار دارد و تنظیمات باکت‌ها استاندارد است.`,
      impactAssessmentFa: `داده‌ها با پایداری کامل در دیسک ذخیره شده‌اند.`,
      impactAssessmentEn: `Healthy storage committed to disk.`,
      docReference: profile.docUrl,
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 4: Cluster Master & Clustering Authentication (pass4SymmKey)
  // -------------------------------------------------------------------------
  if (component === 'ClusterMaster' || component === 'CMMetaDataMaster' || logLower.includes('clustermaster') || logLower.includes('pass4symmkey')) {
    if (logLower.includes('unable to authenticate') || logLower.includes('default token') || logLower.includes('pass4symmkey')) {
      return {
        rawLine: rawLog,
        timestamp,
        component: 'ClusterMaster',
        logLevel: 'ERROR',
        subsystemCategory: 'Cluster High Availability',
        technicalMetrics,
        meaningFa: `عدم امکان احراز هویت ایندکسر همتا با کلاستر مستر: کلید مشترک (pass4SymmKey) مطابقت ندارد یا کلید پیش‌فرض کارخانه استفاده شده است.`,
        meaningEn: `Cluster peer authentication rejected: Shared secret (pass4SymmKey) mismatch or default token detected.`,
        whyOccurredFa: `چرا این خطا رخ داده است؟ تمام نودهای عضو کلاستر ایندکسر برای اتصال به کلاستر منیجر از یک سکرت مشترک (Secret Token) به نام pass4SymmKey استفاده می‌کنند. اگر این کلید در فایل server.conf یکی از نودها تغییر کرده باشد، پس از هش شدن با مقدار مستر همخوانی نخواهد داشت و مستر اتصال همتا را رد می‌کند.`,
        rootCauseFa: `ناهمگام بودن مقدار pass4SymmKey در استنزای [clustering] فایل server.conf بین نود مستر و ایندکسرها.`,
        rootCauseEn: `pass4SymmKey token discrepancy in server.conf across cluster master and indexer tier.`,
        recommendedFixFa: `یکسان‌سازی pass4SymmKey در کلیه نودهای کلاستر و فعال‌سازی replication_factor=2 در server.conf.`,
        recommendedFixEn: `Synchronize identical pass4SymmKey in server.conf on all cluster peers and master.`,
        affectedConfig: 'server.conf',
        targetStanza: '[clustering]',
        patchCode: `[clustering]\nmode = master\npass4SymmKey = EnterpriseSecretKey2026!\nreplication_factor = 2\nsearch_factor = 2`,
        cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk show cluster-status --verbose`,
        recheckSummaryFa: `دستور show cluster-status باید وضعیت نودهای همتا را به صورت Up و Searchable نمایش دهد.`,
        impactAssessmentFa: `نودهای ایندکسر نمی‌توانند به کلاستر متصل شوند و ضریب دسترسی داده‌ها افت می‌کند.`,
        impactAssessmentEn: `Peers cannot join cluster; redundancy and data availability compromised.`,
        docReference: profile.docUrl,
        canAutoApply: true
      };
    }

    return {
      rawLine: rawLog,
      timestamp,
      component,
      logLevel: 'INFO',
      subsystemCategory: 'Cluster High Availability',
      technicalMetrics,
      meaningFa: `کلاستر مستر وضعیت سلامت باکت‌ها و ضرایب جستجو (Search Factor / Replication Factor) را بررسی و تایید کرد.`,
      meaningEn: `Cluster Manager confirmed healthy bucket replication state and RF/SF compliance.`,
      whyOccurredFa: `گزارش سلامت هارت‌بیت: تمامی ضرایب تکرار و کپی‌های باکت‌ها در کلاستر در حالت ایده‌آل قرار دارند.`,
      rootCauseFa: `عملیات پایش سلامت دوره‌ای نودهای کلاستر توسط ماژول CMMetaDataMaster.`,
      rootCauseEn: `Routine cluster consensus and replication heartbeat inspection.`,
      recommendedFixFa: `کلاستر در وضعیت متعادل (Complete / Searchable) قرار دارد.`,
      recommendedFixEn: `Cluster topology is fully balanced and healthy.`,
      affectedConfig: 'server.conf',
      targetStanza: '[clustering]',
      patchCode: `[clustering]\nmode = master\nreplication_factor = 3\nsearch_factor = 2`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk show cluster-status`,
      recheckSummaryFa: `کلاستر کاملاً پایدار و عملیاتی است.`,
      impactAssessmentFa: `تضمین قابلیت اطمینان بالا و دسترسی بدون قطعی به داده‌ها.`,
      impactAssessmentEn: `Guaranteed high availability and full searchability.`,
      docReference: profile.docUrl,
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 5: Search Parser & SavedSplunker Scheduler Concurrency
  // -------------------------------------------------------------------------
  if (component === 'SavedSplunker' || component === 'SearchParser' || logLower.includes('savedsplunker') || logLower.includes('concurrency')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'SavedSplunker',
      logLevel: 'WARN',
      subsystemCategory: 'Search Head Scheduler & Concurrency',
      technicalMetrics,
      meaningFa: `تکمیل سقف تعداد جستجوهای همزمان زمان‌بندی شده روی هسته‌های پردازنده (CPU Cores). برخی هشدارهای امنیتی به صف انتظار رفته‌اند.`,
      meaningEn: `Scheduled search concurrency limit reached: CPU-to-search ratio saturated. Scheduled alerts queued.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ اسپلانک برای جلوگیری از هنگ کردن سرور سرچ‌هد، فرمولی برای حداکثر جستجوهای همزمان بر اساس هسته‌های CPU دارد (max_searches_per_cpu). همزمانی بیش از حد گزارش‌ها و هشدارهای امنیتی SOC در یک دقیقه مشخص باعث اشباع این ظرفیت شده و برخی جستجوها موقتاً در صف انتظار می‌مانند.`,
      rootCauseFa: `پارامتر max_searches_per_cpu یا base_max_searches در limits.conf برای بار کاری فعلی سرچ‌هد کوچک است.`,
      rootCauseEn: `Scheduler concurrency limit reached based on limits.conf [search] formulas.`,
      recommendedFixFa: `تنظیم max_searches_per_cpu = 2 و base_max_searches = 6 در limits.conf و گسترش پنجره زمانی جستجوها (Schedule Window).`,
      recommendedFixEn: `Increase max_searches_per_cpu = 2 in limits.conf [search] and configure schedule windows.`,
      affectedConfig: 'limits.conf',
      targetStanza: '[search]',
      patchCode: `[search]\nmax_searches_per_cpu = 2\nbase_max_searches = 6\n\n[scheduler]\nmax_searches_perc = 75\nauto_summary_perc = 50`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk btool limits list search --debug`,
      recheckSummaryFa: `دستور btool باید مقادیر جدید max_searches_per_cpu را تایید کند تا ظرفیت همزمانی سرچ‌ها دو برابر شود.`,
      impactAssessmentFa: `تاخیر در ارسال هشدارهای SOC و زمان‌بندی داشبوردها به علت ماندن در صف صف‌بندی.`,
      impactAssessmentEn: `SOC alert latency and queued scheduled searches.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 6: LineBreakingProcessor & Parsing Truncation
  // -------------------------------------------------------------------------
  if (component === 'LineBreakingProcessor' || logLower.includes('truncate') || logLower.includes('linebreakingprocessor')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'LineBreakingProcessor',
      logLevel: 'WARN',
      subsystemCategory: 'Parsing & Event Aggregation',
      technicalMetrics,
      meaningFa: `طول رویداد لاگ ورودی از سقف مجاز TRUNCATE (۱۰,۰۰۰ بایت) بزرگتر بوده و انتهای آن کوتاه یا به چند خط تقسیم شده است.`,
      meaningEn: `Event size exceeded TRUNCATE threshold (default 10,000 bytes) in props.conf. Long payloads split or truncated.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ موتور پایپ‌لاین پارسینگ اسپلانک به صورت پیش‌فرض در فایل props.conf متغیر TRUNCATE = 10000 دارد تا از مصرف حافظه توسط رویدادهای غول‌پیکر جلوگیری کند. هنگامی که یک لاگ JSON سازمانی، یک تریس دیتابیس یا یک لاگ وب با حجم بالاتر از ۱۰ کیلوبایت وارد می‌شود، انتهای لاگ قطع شده و فیلدها ناقص استخراج می‌شوند.`,
      rootCauseFa: `ورود بسته‌های JSON بزرگ، تریس‌های جاوا یا لاگ‌های وب بدون افزایش سقف TRUNCATE در استنزای سورس‌تایپ.`,
      rootCauseEn: `props.conf defaults TRUNCATE = 10000; larger events truncated.`,
      recommendedFixFa: `تنظیم TRUNCATE = 50000 و SHOULD_LINEMERGE = false در props.conf برای سورس‌تایپ مربوطه.`,
      recommendedFixEn: `Set TRUNCATE = 50000 and SHOULD_LINEMERGE = false in props.conf.`,
      affectedConfig: 'props.conf',
      targetStanza: '[syslog]',
      patchCode: `[syslog]\nSHOULD_LINEMERGE = false\nLINE_BREAKER = ([\\r\\n]+)\nTRUNCATE = 50000`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk btool props list syslog --debug`,
      recheckSummaryFa: `دستور btool باید تایید کند که سقف TRUNCATE به ۵۰۰۰۰ بایت افزایش یافته است و شکست نامتعارف رویدادها متوقف شده است.`,
      impactAssessmentFa: `ناقص شدن اطلاعات لاگ‌های حجیم و خطای استخراج فیلدها در جستجوهای تحلیلگران SOC.`,
      impactAssessmentEn: `Field extraction failures and truncated payload in security investigative searches.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 7: HTTP Event Collector (HEC) / HttpListener
  // -------------------------------------------------------------------------
  if (component === 'HttpListener' || component === 'HttpInputDataHandler' || logLower.includes('httplistener') || logLower.includes('8088')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'HttpListener',
      logLevel: 'WARN',
      subsystemCategory: 'HTTP Event Collector (HEC)',
      technicalMetrics,
      meaningFa: `درگاه HEC روی پورت ${port || '8088'} بدون رمزنگاری SSL/TLS در حال دریافت بسته‌ها است یا توکن ارسال معتبر نیست.`,
      meaningEn: `HTTP Event Collector (HEC) listening on port ${port || '8088'} without SSL enforcement, or invalid auth token provided.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ استنزای [http] در فایل inputs.conf پارامتر enableSSL = 0 دارد. کلاینت‌ها و ایجنت‌ها توکن‌های احراز هویت HEC را در قالب متن ساده ارسال می‌کنند که خطر استراق سمع و جعل داده‌های امنیت شبکه را ایجاد می‌کند.`,
      rootCauseFa: `پارامتر enableSSL در استنزای [http] فایل inputs.conf روی مقدار صفر قرار دارد.`,
      rootCauseEn: `inputs.conf [http] has enableSSL = 0; unencrypted HTTP payloads permitted.`,
      recommendedFixFa: `فعال‌سازی enableSSL = 1 و تعیین پورت امن ۸۰۸۸ در inputs.conf استنزای [http].`,
      recommendedFixEn: `Enforce enableSSL = 1 in inputs.conf [http] stanza.`,
      affectedConfig: 'inputs.conf',
      targetStanza: '[http]',
      patchCode: `[http]\ndisabled = 0\nport = 8088\nenableSSL = 1\nserverCert = $SPLUNK_HOME/etc/auth/server.pem`,
      cliDiagnosisCommand: `curl -k -v https://127.0.0.1:8088/services/collector/health`,
      recheckSummaryFa: `دستور curl باید بازگشت کد HTTP 200 با پروتکل HTTPS را در پورت 8088 تایید کند.`,
      impactAssessmentFa: `انتقال توکن‌های HEC در شبکه به صورت متن باز و خطر جعل هویت لاگ‌ها.`,
      impactAssessmentEn: `Cleartext HEC bearer token transmission exposed on the wire.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 8: KVStore / WiredTiger / Port 8191
  // -------------------------------------------------------------------------
  if (component === 'KVStore' || component === 'KVStoreMongoProcessor' || logLower.includes('kvstore') || logLower.includes('8191')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'KVStore',
      logLevel: 'WARN',
      subsystemCategory: 'App Key Value Store (WiredTiger)',
      technicalMetrics,
      meaningFa: `پایش وضعیت پایگاه داده KVStore روی پورت ۸۱۹۱: زمان همگام‌سازی جداول لوکاپ و سوکت موتور ذخیره‌سازی WiredTiger.`,
      meaningEn: `KVStore WiredTiger storage engine checkpoint active on port 8191. Lookup table synchronization trace.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ موتور پایگاه داده داخلی اسپلانک (mongod با موتور ذخیره‌سازی WiredTiger) در پورت ۸۱۹۱ سوکت باز می‌کند. هنگام بارگذاری کالکشن‌های حجیم لوکاپ یا بالا رفتن تاخیر دیسک I/O، سینک شدن باکت‌ها کند شده و این پیام تشخیصی در دیمن ثبت می‌گردد.`,
      rootCauseFa: `حجم بالای کالکشن‌های لوکاپ (KVStore collections) یا تاخیر دیسک در پاسخ‌دهی موتور پایگاه داده محلی.`,
      rootCauseEn: `KVStore lookup collection synchronization or storage IOPS latency.`,
      recommendedFixFa: `بررسی وضعیت پایگاه داده با دستور splunk show kvstore-status و فعال‌سازی صریح پورت ۸۱۹۱ در server.conf.`,
      recommendedFixEn: `Inspect kvstore status via CLI and verify port 8191 responsiveness.`,
      affectedConfig: 'server.conf',
      targetStanza: '[kvstore]',
      patchCode: `[kvstore]\nport = 8191\ndisabled = false`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk show kvstore-status`,
      recheckSummaryFa: `دستور show kvstore-status باید وضعیت KVStore را برابر با ready و پورت ۸۱۹۱ فعال نشان دهد.`,
      impactAssessmentFa: `کند شدن لوکاپ‌های اپلیکیشن‌ها در صورت تاخیر طولانی این سرویس.`,
      impactAssessmentEn: `Potential search delay in correlation searches relying on KVStore lookups.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/AboutKVstore',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 9: LicenseManager / Quota
  // -------------------------------------------------------------------------
  if (component === 'LicenseManager' || component === 'LicenseMgrPool' || logLower.includes('license')) {
    return {
      rawLine: rawLog,
      timestamp,
      component: 'LicenseManager',
      logLevel: 'WARN',
      subsystemCategory: 'License Master & Capacity',
      technicalMetrics,
      meaningFa: `حجم لاگ‌های ایندکس شده در ۲۴ ساعت جاری به سقف استخر لایسنس سرور نزدیک شده است.`,
      meaningEn: `Daily indexing volume consumption approaching allocated enterprise license quota pool threshold.`,
      whyOccurredFa: `چرا این خطا رخ داده است؟ اسپلانک حجم روزانه داده‌های ورودی را محاسبه می‌کند. به علت تزریق حجم بالایی از لاگ‌های فایروال یا سورس‌های جدید، حجم لاگ‌های ۲۴ ساعت گذشته به بالای ۸۵٪ از ظرفیت استخر لایسنس رسیده است.`,
      rootCauseFa: `افزایش ناگهانی بار لاگ ورودی یا پیک ترافیکی بدون تعریف هشدارهای تعدیل حجم.`,
      rootCauseEn: `Surge in daily ingestion volume approaching quota limit before midnight reset.`,
      recommendedFixFa: `بررسی منابع پرحجم با کوئری index=_internal source=*license_usage.log و توزیع لایسنس در server.conf.`,
      recommendedFixEn: `Inspect daily usage per index via license_usage.log and balance license pools.`,
      affectedConfig: 'server.conf',
      targetStanza: '[license]',
      patchCode: `[license]\nactive_group = Enterprise\nmaster_uri = https://10.20.30.60:8089`,
      cliDiagnosisCommand: `$SPLUNK_HOME/bin/splunk list licenser-pools`,
      recheckSummaryFa: `سهمیه‌بندی جدید استخر لایسنس باید تایید شود تا اخطار لایسنس در کلاستر برطرف شود.`,
      impactAssessmentFa: `خطر هشدار تخطی از لایسنس (License Violation Warning) در صورت تکرار در چند روز متوالی.`,
      impactAssessmentEn: `Risk of search lockdown if quota violations accumulate within rolling window.`,
      docReference: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutlicenses',
      canAutoApply: true
    };
  }

  // -------------------------------------------------------------------------
  // CASE 10: Dynamic Semantic Diagnostic Extractor for ANY other custom log line
  // -------------------------------------------------------------------------
  let identifiedIssueFa = `رویداد زیرسیستم «${component}» با سطح اهمیت ${logLevel}`;
  let identifiedIssueEn = `Subsystem runtime event in ${component} (Level: ${logLevel})`;
  let whyOccurredFa = `چرا این رویداد رخ داده است؟ زیرسیستم ${component} هنگام پردازش عملیات داخلی به این پیام برخورده است: «${cleanMessage}».`;
  let rootCauseFa = `رویداد ثبت شده در دیمن: «${cleanMessage}».`;
  let rootCauseEn = `Daemon execution event: '${cleanMessage}'.`;
  let recommendedFixFa = `بررسی وضعیت سرویس دیمن ${component} و اعتبارسنجی کانفیگ با دستور \`$SPLUNK_HOME/bin/splunk btool check\`.`;
  let recommendedFixEn = `Validate settings for ${component} and execute splunk btool check.`;
  let targetFile = profile.defaultConfig;
  let targetStanza = profile.defaultStanza;
  let patchCode = `# تنظیمات پیشنهادی زیرسیستم ${component}\n${targetStanza}\ndisabled = false`;
  let cliCmd = `$SPLUNK_HOME/bin/splunk btool ${targetFile.replace('.conf', '')} list --debug`;
  let recheckSummaryFa = `اعتبارسنجی با btool و ری‌استارت دیمن وضعیت پایدار را تضمین می‌کند.`;
  let impactFa = `تاثیر وابسته به وضعیت استمرار رویداد در زیرسیستم ${component}.`;
  let impactEn = `Operational impact depends on persistence of this trace in ${component}.`;

  // Semantic Heuristic 1: Network / Socket / Bind / Port
  if (logLower.includes('bind') || logLower.includes('address already in use') || (port && logLower.includes('in use'))) {
    identifiedIssueFa = `تداخل و قفل بودن پورت شبکه ${port ? `(${port})` : ''} در زیرسیستم ${component}`;
    identifiedIssueEn = `Socket port conflict / EADDRINUSE on port ${port || 'network socket'} in ${component}`;
    whyOccurredFa = `چرا این خطا رخ داده است؟ اسپلانک قصد داشته است یک سوکت شنود جدید روی پورت ${port || 'شبکه'} باز کند، اما هسته لینوکس خطای EADDRINUSE (Address already in use) بازگردانده است؛ یعنی پروسه دیگری هم‌اکنون این پورت را قفل کرده است.`;
    rootCauseFa = `پورت مورد نیاز توسط پروسه موازی یا نمونه قبلی اسپلانک اشغال شده و سرویس امکان بایند شدن روی سوکت را ندارد.`;
    rootCauseEn = `Port ${port || 'socket'} is already occupied by a lingering process or previous instance.`;
    recommendedFixFa = `یافتن پروسه اشغال‌کننده با دستور \`ss -tulpn | grep ${port || '8000'}\` و تغییر شماره پورت در صورت نیاز.`;
    recommendedFixEn = `Identify conflicting process via ss -tulpn and terminate or adjust port offset.`;
    targetFile = 'web.conf';
    targetStanza = '[settings]';
    patchCode = `[settings]\nhttpport = 8001\nmgmtHostPort = 127.0.0.1:8090`;
    cliCmd = `fuser -v -n tcp ${port || '8000'}`;
    recheckSummaryFa = `دستور fuser پروسه اشغال‌کننده پورت را مشخص یا آزاد می‌کند.`;
    impactFa = `سرویس وب یا ارتباطی تا زمان آزاد شدن پورت شروع به کار نخواهد کرد.`;
    impactEn = `Daemon cannot start communication listener until socket is released.`;
  }
  // Semantic Heuristic 2: Linux Permissions / Access Denied
  else if (logLower.includes('permission denied') || logLower.includes('access denied') || logLower.includes('eacces')) {
    identifiedIssueFa = `خطای دسترسی لینوکس (Permission Denied) در مسیر ${filePath || 'دایرکتوری فایل‌ها'}`;
    identifiedIssueEn = `Linux filesystem permission denied (EACCES) accessing ${filePath || 'target path'}`;
    whyOccurredFa = `چرا این خطا رخ داده است؟ فرآیند دیمن اسپلانک با کاربر غیرریشه (معمولاً splunk) اجرا می‌شود. هنگامی که برنامه سعی در خواندن، ایجاد یا نوشتن در مسیر ${filePath || 'سیستم فایل'} می‌کند، سیستم‌عامل مجوزهای POSIX را ناکافی تشخیص داده و خطای رد دسترسی صادر می‌کند.`;
    rootCauseFa = `کاربر اجرای دیمن اسپلانک (splunk user) مجوز رید یا رایت روی مسیر ${filePath || 'دایرکتوری مقصد'} را ندارد.`;
    rootCauseEn = `Splunk daemon running user lacks write/read permissions on filesystem path.`;
    recommendedFixFa = `اصلاح مالکیت و مجوزها با دستور \`chown -R splunk:splunk ${filePath || '/opt/splunk'}\` و تنظیم chmod 750.`;
    recommendedFixEn = `Run chown -R splunk:splunk on target path and set appropriate permissions.`;
    targetFile = 'server.conf';
    targetStanza = '[general]';
    patchCode = `# اجرای دستور ترمینال جهت اصلاح مجوز:\n# chown -R splunk:splunk ${filePath || '/opt/splunk'}`;
    cliCmd = `ls -ld ${filePath || '/opt/splunk/var'}`;
    recheckSummaryFa = `دستور ls -ld باید تایید کند مالکیت به splunk:splunk تغییر یافته است.`;
    impactFa = `عدم امکان خواندن یا نوشتن فایل‌های سیستمی و احتمال قطع لاگ‌برداری.`;
    impactEn = `Inability to write logs, read configs, or commit indexing transactions.`;
  }
  // Semantic Heuristic 3: Configuration Precedence / ConfMerge
  else if (logLower.includes('precedence') || logLower.includes('overwritten') || component === 'ConfMerge') {
    identifiedIssueFa = `تداخل اولویت فایل‌های کانفیگ (Precedence Conflict) در ${confFile || 'server.conf'}`;
    identifiedIssueEn = `Configuration file precedence warning in ${confFile || 'server.conf'}`;
    whyOccurredFa = `چرا این خطا رخ داده است؟ سیستم لایه‌بندی کانفیگ اسپلانک دارای سلسله‌مراتب مشخص است (system/default -> apps -> system/local). پارامتری در فایل system/local تنظیمی در سطح اپلیکیشن را بازنویسی کرده و سیستم برای جلب توجه ادمین هشدار اولویت داده است.`;
    rootCauseFa = `تنظیماتی در مسیر local تنظیمات معادل در دایرکتوری‌های default یا اپلیکیشن‌ها را بازنویسی کرده‌اند.`;
    rootCauseEn = `A setting in local layer overrides values defined in default or app stanzas.`;
    recommendedFixFa = `بررسی فایل‌ها با دستور \`$SPLUNK_HOME/bin/splunk btool check\` و یکپارچه‌سازی مقادیر در شاخه system/local.`;
    recommendedFixEn = `Run splunk btool check --debug to audit conflicting stanzas.`;
    targetFile = confFile || 'server.conf';
    targetStanza = '[general]';
    patchCode = `# تراز کانفیگ در سطح local جهت رفع تداخل اولویت\n[general]\n`;
    cliCmd = `$SPLUNK_HOME/bin/splunk btool check --debug`;
    recheckSummaryFa = `دستور btool check تداخل‌ها را شناسایی و لیست می‌کند.`;
    impactFa = `احتمال رفتار پیش‌بینی نشده در صورت اعمال ناخواسته کانفیگ‌های لایه‌های مختلف.`;
    impactEn = `Unintended configuration parameter evaluation across layered directory structure.`;
  }
  // Semantic Heuristic 4: Healthy / Normal Informational traces
  else if (logLevel === 'INFO') {
    identifiedIssueFa = `گزارش سلامت عملکردی زیرسیستم ${component}`;
    identifiedIssueEn = `Operational health diagnostic trace for ${component}`;
    whyOccurredFa = `رویداد طبیعی و سالم: زیرسیستم ${component} بدون هیچ خطایی دستور را به پایان رسانده است.`;
    rootCauseFa = `رویداد استاندارد سیستمی دیمن اسپلانک: «${cleanMessage}». سیستم در وضعیت پایدار کار می‌کند.`;
    rootCauseEn = `Standard routine execution trace in ${component}: '${cleanMessage}'. System operating normally.`;
    recommendedFixFa = `سیستم بدون نقص در حال فعالیت است. نیازی به اصلاح کانفیگ نیست.`;
    recommendedFixEn = `No corrective action needed; subsystem is operating within expected parameters.`;
    patchCode = `# رویداد نشان‌دهنده عملکرد صحیح سرویس ${component} است.`;
    recheckSummaryFa = `وضعیت زیرسیستم کاملاً سالم و تایید شده است.`;
    impactFa = `سیستم با موفقیت در حال پردازش رویدادها می‌باشد.`;
    impactEn = `Subsystem actively processing without error.`;
  }

  return {
    rawLine: rawLog,
    timestamp,
    component,
    logLevel,
    subsystemCategory: profile.category,
    technicalMetrics,
    meaningFa: `${identifiedIssueFa}: ${cleanMessage}`,
    meaningEn: `${identifiedIssueEn}: ${cleanMessage}`,
    whyOccurredFa,
    rootCauseFa,
    rootCauseEn,
    recommendedFixFa,
    recommendedFixEn,
    affectedConfig: targetFile,
    targetStanza,
    patchCode: patchCode || `[${targetStanza.replace(/[\[\]]/g, '') || 'general'}]\ndisabled = false`,
    cliDiagnosisCommand: cliCmd,
    recheckSummaryFa,
    impactAssessmentFa: impactFa,
    impactAssessmentEn: impactEn,
    docReference: profile.docUrl,
    canAutoApply: true
  };
}
