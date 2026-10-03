import { SplunkAgentComponentRole } from '../types';

export interface RemediationStep {
  step: number;
  titleFa: string;
  titleEn: string;
  shortDescFa: string;
  shortDescEn: string;
  commandSnippet: string;
  simulatedOutput: string[];
}

export interface NodeRoleRemediationProfile {
  role: SplunkAgentComponentRole;
  badgeLabelFa: string;
  badgeLabelEn: string;
  colorTheme: {
    border: string;
    bgGlow: string;
    text: string;
    button: string;
  };
  architectureSummaryFa: string;
  architectureSummaryEn: string;
  commonOutageCausesFa: string[];
  commonOutageCausesEn: string[];
  daemonPath: string;
  steps: RemediationStep[];
  successMessageFa: string;
  successMessageEn: string;
}

export const ROLE_REMEDIATION_WORKFLOWS: Record<SplunkAgentComponentRole, NodeRoleRemediationProfile> = {
  universal_forwarder: {
    role: 'universal_forwarder',
    badgeLabelFa: 'فورواردر سبک (Universal Forwarder)',
    badgeLabelEn: 'Universal Forwarder (UF)',
    colorTheme: {
      border: 'border-amber-500/50',
      bgGlow: 'bg-amber-950/20',
      text: 'text-amber-400',
      button: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950'
    },
    architectureSummaryFa:
      'روی این سرور هیچ وب‌سرور، موتور جستجو یا دیتابیس ایندکسری وجود ندارد! UF صرفاً یک دیمن سبک ارسال لاگ است. جریان اصلی روی خواندن فایل‌های لاگ محلی یا ایونت‌های سیستم‌عامل و فوروارد از پورت ۹۹۹۷ به ایندکسرها متمرکز است.',
    architectureSummaryEn:
      'UF is a lightweight data shipper without Splunk Web or index databases. Troubleshooting focuses on OS file permissions, fishbucket pointer integrity, port 9997 route, and daemon restart.',
    commonOutageCausesFa: [
      'عدم دسترسی یوزر splunk به فایل لاگ مبدا (Permission Denied)',
      'انسداد پورت ۹۹۹۷ شبکه در فایروال محلی یا سخت‌افزاری',
      'قفل شدن پوینتر تیلر در کش فیش‌باکت (fishbucket tailer corruption)',
      'خطای سینتکسی در inputs.conf یا outputs.conf'
    ],
    commonOutageCausesEn: [
      'Source log file permission denied for splunk user',
      'Network firewall blocking TCP 9997 to Indexers',
      'Stale inode pointers in fishbucket tailer cache',
      'Syntax typo in inputs.conf or outputs.conf'
    ],
    daemonPath: '/opt/splunkforwarder/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'بررسی مجوزهای دسترسی فایل‌های لاگ محلی',
        titleEn: 'Check OS File Permissions',
        shortDescFa: 'اعتبارسنجی خوانش‌پذیری فایل‌های لاگ توسط کاربر سیستم splunk',
        shortDescEn: 'Validate read permissions on target log files for splunk user',
        commandSnippet: 'su - splunk -c "test -r /var/log/nginx/access.log && test -r /var/log/secure"',
        simulatedOutput: [
          '[STEP 1: Checking Local File Permissions & Existence]',
          '$ su - splunk -c "test -r /var/log/nginx/access.log && test -r /var/log/secure"',
          'Checking /var/log/nginx/*.log ... [READABLE]',
          'Warning: /var/log/secure had chmod 0600 (root only - unreadable by splunk).',
          'Applying Fix: setfacl -m u:splunk:r /var/log/secure ... [PERMISSION FIXED]',
          'Audit: User splunk now has read access to all 4 configured input paths.'
        ]
      },
      {
        step: 2,
        titleFa: 'تست اتصال شبکه و دست‌تکانی TLS در پورت ۹۹۹۷',
        titleEn: 'Verify Port 9997 Network & TLS',
        shortDescFa: 'بررسی دسترسی TCP و اعتبارسنجی سرتیفیکیت mTLS به ایندکسرها',
        shortDescEn: 'Test TCP 9997 connectivity and mTLS certificate handshake with Indexer cluster',
        commandSnippet: 'nc -zvw3 10.20.30.50 9997 && openssl s_client -connect 10.20.30.50:9997 -tls1_3',
        simulatedOutput: [
          '[STEP 2: Network Connectivity to Indexers on Port 9997]',
          '$ nc -zvw3 10.20.30.50 9997 && nc -zvw3 10.20.30.51 9997',
          'Connection to 10.20.30.50 9997 port [tcp/*] succeeded!',
          'Connection to 10.20.30.51 9997 port [tcp/*] succeeded!',
          '$ openssl s_client -connect 10.20.30.50:9997 -tls1_3 -brief',
          'TLS 1.3 Handshake negotiated successfully (ECDHE-ECDSA-AES256-GCM-SHA384).',
          'Certificate Status: Valid until 2027-09-30 (Org Root CA Verified).'
        ]
      },
      {
        step: 3,
        titleFa: 'اعتبارسنجی ساختار کانفیگ‌ها با ابزار btool',
        titleEn: 'Validate Configs with btool',
        shortDescFa: 'بررسی تداخل‌ها و خطاهای سینتکسی در inputs.conf و outputs.conf',
        shortDescEn: 'Detect syntax errors and stanza conflicts in inputs.conf & outputs.conf',
        commandSnippet: '/opt/splunkforwarder/bin/splunk btool outputs list --debug && /opt/splunkforwarder/bin/splunk btool inputs list --debug',
        simulatedOutput: [
          '[STEP 3: Validating UF inputs.conf & outputs.conf via btool]',
          '$ /opt/splunkforwarder/bin/splunk btool outputs list --debug',
          '[tcpout:primary_indexers] -> Valid. Compressed=true, useSSL=true.',
          '$ /opt/splunkforwarder/bin/splunk btool inputs list --debug',
          '[monitor:///var/log/nginx/*.log] -> disabled = 0, index = web_proxy.',
          'Conf Validation Passed with 0 syntax warnings.'
        ]
      },
      {
        step: 4,
        titleFa: 'تخلیه صف‌های مسدود و کش تیلر (Fishbucket)',
        titleEn: 'Flush Stalled Queues & Fishbucket Cache',
        shortDescFa: 'آزادسازی کش اینودهای قفل شده و تخلیه بافر حافظه فورواردر',
        shortDescEn: 'Clear stuck file inodes in fishbucket and flush stale in-memory buffers',
        commandSnippet: '/opt/splunkforwarder/bin/splunk clean-tailer-cache --force',
        simulatedOutput: [
          '[STEP 4: Flushing Stalled Tailer Queue & Memory Buffers]',
          '$ /opt/splunkforwarder/bin/splunk clean-tailer-cache --force',
          'Clearing stale inode pointers in /opt/splunkforwarder/var/log/splunk/fishbucket... [DONE]',
          'Unblocking tailing processor thread pool... [OK]',
          'Memory queue unblocked and ready for immediate streaming.'
        ]
      },
      {
        step: 5,
        titleFa: 'ری‌استارت تمیز دیمن Universal Forwarder',
        titleEn: 'Restart Universal Forwarder Daemon',
        shortDescFa: 'راه‌اندازی مجدد سرویس و آغاز استریم بلادرنگ لاگ‌ها',
        shortDescEn: 'Execute clean process restart and verify live data pipeline ingestion',
        commandSnippet: '/opt/splunkforwarder/bin/splunk restart',
        simulatedOutput: [
          '[STEP 5: Executing Clean Service Restart of Universal Forwarder]',
          '$ /opt/splunkforwarder/bin/splunk restart',
          'Stopping splunkforwarder (PID 14201)... [OK]',
          'Starting splunkforwarder... [OK]',
          'Checking forwarder pipelines... ACTIVE!',
          'Live Ingestion Stream Resumed: +1,450 EPS flowing to indexers!'
        ]
      }
    ],
    successMessageFa: 'سرویس Universal Forwarder با موفقیت رفع عیب و ری‌استارت شد. جریان ارسال لاگ به کلاستر برقرار گردید.',
    successMessageEn: 'Universal Forwarder daemon restarted and pipeline recovered successfully.'
  },

  heavy_forwarder: {
    role: 'heavy_forwarder',
    badgeLabelFa: 'فورواردر سنگین و گیت‌وی (Heavy Forwarder)',
    badgeLabelEn: 'Heavy Forwarder / Ingestion Gateway',
    colorTheme: {
      border: 'border-blue-500/50',
      bgGlow: 'bg-blue-950/20',
      text: 'text-blue-400',
      button: 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-slate-950'
    },
    architectureSummaryFa:
      'این نود دارای موتور کامل تجزیه و اعتبارسنجی (Parsing Engine) و پایپلاین‌های regex است. وظایف اصلی شامل پارس ایونت‌ها، استخراج فیلدها، فیلتر و ماسک داده‌های حساس (PII Masking)، دریافت توکن‌های HEC (پورت ۸۰۸۸) و هدایت به استخر ایندکسرها است.',
    architectureSummaryEn:
      'HF is a full Splunk parsing instance with regex extraction, PII data masking, and HTTP Event Collector (HEC port 8088). Outages usually stem from regex bottlenecks or queue congestion.',
    commonOutageCausesFa: [
      'انسداد پایپلاین پارس به دلیل رجکس‌های کند یا حلقه‌های نامتناهی در transforms.conf',
      'سرریز صف‌های حافظه (typingQueue / aggQueue / regexQueue saturation)',
      'انقضای گواهی SSL یا نامعتبر بودن توکن در HTTP Event Collector (HEC:8088)',
      'کمبود حافظه اختصاص‌یافته به دیمن اسپلانک در سرورهای با ترافیک بالا'
    ],
    commonOutageCausesEn: [
      'Regex catastrophic backtracking or loops in props.conf/transforms.conf',
      'Queue saturation in typingQueue, aggQueue, or regexQueue',
      'HEC token authentication failure or port 8088 SSL cert issues',
      'Memory throttling in high-throughput gateway environments'
    ],
    daemonPath: '/opt/splunk/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'پایش و عیب‌یابی صف‌های پردازش پارس (Queue Saturation Audit)',
        titleEn: 'Audit Parsing Queues & Backlog',
        shortDescFa: 'بررسی وضعیت صف‌های typingQueue، aggQueue و regexQueue',
        shortDescEn: 'Inspect utilization of typingQueue, aggQueue, and regexQueue for bottlenecks',
        commandSnippet: '/opt/splunk/bin/splunk list queue-info',
        simulatedOutput: [
          '[STEP 1: Auditing Parsing Queues & Memory Backlog]',
          '$ /opt/splunk/bin/splunk list queue-info',
          'queue.parsingQueue: current_size_kb=1240 / max_size_kb=512000 (0.2% - HEALTHY)',
          'queue.aggQueue: current_size_kb=498000 / max_size_kb=512000 (97.2% - CRITICAL CONGESTION)',
          'queue.typingQueue: current_size_kb=502000 / max_size_kb=512000 (98.0% - BLOCKED)',
          'Root Cause Identified: aggQueue and typingQueue are stalled by inefficient transforms regex.',
          'Remediation action scheduled: regex re-compilation and queue expansion.'
        ]
      },
      {
        step: 2,
        titleFa: 'اعتبارسنجی سرویس و توکن‌های HEC (پورت ۸۰۸۸)',
        titleEn: 'Verify HEC Listener & Tokens (Port 8088)',
        shortDescFa: 'تست سلامت اندپوینت HTTP Event Collector و وضعیت توکن‌های فعال',
        shortDescEn: 'Health-check HTTP Event Collector port 8088 and validate active ingest tokens',
        commandSnippet: 'curl -k -s https://localhost:8088/services/collector/health && /opt/splunk/bin/splunk list http-event-collector-token',
        simulatedOutput: [
          '[STEP 2: Checking HEC Listener & Active Ingest Tokens]',
          '$ curl -k -s https://localhost:8088/services/collector/health',
          '{"text":"HEC is healthy","code":0}',
          '$ /opt/splunk/bin/splunk list http-event-collector-token',
          'Token [waf-prod-ingest-token] -> Status: ENABLED, SSL: REQUIRED, Index: waf_logs.',
          'Token [core-banking-api-token] -> Status: ENABLED, SSL: REQUIRED, Index: banking_trans.',
          'HEC endpoints verified: Ready to accept HTTPS ingest payloads.'
        ]
      },
      {
        step: 3,
        titleFa: 'اعتبارسنجی رجکس‌ها و رول‌های transforms.conf',
        titleEn: 'Validate props.conf & transforms.conf Rules',
        shortDescFa: 'تست خطایابی قوانین پنهان‌سازی PII و استخراج فیلدها با btool',
        shortDescEn: 'Debug PII masking rules and field extraction transforms with btool',
        commandSnippet: '/opt/splunk/bin/splunk btool props list --debug && /opt/splunk/bin/splunk btool transforms list --debug',
        simulatedOutput: [
          '[STEP 3: Validating Transforms & Props Regex Rules]',
          '$ /opt/splunk/bin/splunk btool transforms list --debug',
          '[mask_pan_credit_card] -> REGEX = (?<!\\d)\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}(?!\\d)',
          'Syntax: VALID. Replaced catastrophic backtracking group with atomic lookahead.',
          '[syslog_routing_transform] -> DEST_KEY = _MetaData:Index, FORMAT = firewall_logs.',
          'Syntax: VALID. 0 regex compilation errors.'
        ]
      },
      {
        step: 4,
        titleFa: 'افزایش ظرفیت صف‌ها و حافظه در server.conf',
        titleEn: 'Tune Queue Sizes in server.conf',
        shortDescFa: 'تنظیم maxQueueSize روی ۱ گیگابایت برای پایدارسازی ترافیک اسپایک',
        shortDescEn: 'Increase maxQueueSize to 1GB to absorb high-traffic network spikes',
        commandSnippet: 'sed -i "s/maxQueueSize = .*/maxQueueSize = 1000MB/g" /opt/splunk/etc/system/local/server.conf',
        simulatedOutput: [
          '[STEP 4: Tuning Pipeline Queue Capacity in server.conf]',
          '$ /opt/splunk/bin/splunk set server-config --maxQueueSize 1000MB',
          'Updating [queue] parameters in /opt/splunk/etc/system/local/server.conf ... [DONE]',
          'Set [queue=aggQueue] maxQueueSize = 1000MB',
          'Set [queue=typingQueue] maxQueueSize = 1000MB',
          'Set [queue=pipeline] pipelineSet = 2 (Multi-core parsing enabled).'
        ]
      },
      {
        step: 5,
        titleFa: 'ری‌استارت خط لوله پارس و راه‌اندازی مجدد سرویس HF',
        titleEn: 'Reload Parsing Engine & Restart Heavy Forwarder',
        shortDescFa: 'ریلود توکن‌های HEC و راه‌اندازی تمیز دیمن جهت برقراری جریان لاگ',
        shortDescEn: 'Reload HEC configs and execute clean restart of Heavy Forwarder',
        commandSnippet: '/opt/splunk/bin/splunk reload http-token && /opt/splunk/bin/splunk restart',
        simulatedOutput: [
          '[STEP 5: Reloading Engine & Executing Heavy Forwarder Restart]',
          '$ /opt/splunk/bin/splunk reload http-token',
          'Reloading HTTP token configurations... [SUCCESS]',
          '$ /opt/splunk/bin/splunk restart',
          'Stopping splunkd (PID 28410)... [OK]',
          'Starting splunkd... [OK]',
          'Checking pipeline statuses... ALL ACTIVE!',
          'Ingestion Stream Restored: +8,400 EPS flowing to Indexer Cluster!'
        ]
      }
    ],
    successMessageFa: 'پایپلاین پردازش و دیمن Heavy Forwarder با موفقیت تخلیه، بهینه‌سازی و ری‌استارت شد.',
    successMessageEn: 'Heavy Forwarder parsing pipeline tuned and daemon restarted successfully.'
  },

  syslog_collector: {
    role: 'syslog_collector',
    badgeLabelFa: 'سیسلاگ گیت‌وی (SC4S / rsyslog / syslog-ng)',
    badgeLabelEn: 'Syslog Collector (SC4S / rsyslog)',
    colorTheme: {
      border: 'border-purple-500/50',
      bgGlow: 'bg-purple-950/20',
      text: 'text-purple-400',
      button: 'from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-slate-950'
    },
    architectureSummaryFa:
      'نود سیسلاگ (SC4S) به عنوان اولین نقطه دریافت ترافیک شبکه (سوییچ‌ها، روترها، فایروال‌های سیسکو، پالوآلتو و فورتی‌نت) روی پورت‌های ۵۱۴ (UDP/TCP) و ۶۵۱۴ (TLS) عمل می‌کند و لاگ‌ها را پس از استانداردسازی CIM به کلاستر ارسال می‌نماید.',
    architectureSummaryEn:
      'SC4S (Splunk Connect for Syslog) ingests high-volume network telemetry on UDP/TCP 514 & TLS 6514, formats to CIM, and forwards to Indexers. Outages often involve Linux UDP socket drops or container container crashes.',
    commonOutageCausesFa: [
      'دراپ شدن پکت‌های UDP به دلیل کوچک بودن بافر سوکت لینوکس (rmem_max buffer overflow)',
      'کرش کردن کانتینر یا سرویس پادمن/سیستم‌دی SC4S',
      'تغییر فرمت سیسلاگ تجهیزات شبکه و عدم تطابق در env_file',
      'مسدود شدن ارتباط خروجی SC4S به لودبالانسر HEC یا ایندکسرها'
    ],
    commonOutageCausesEn: [
      'Linux kernel UDP socket buffer overflow (net.core.rmem_max too small)',
      'SC4S Podman/Docker container failure or memory limit exceeded',
      'Syslog vendor parser mismatch or TLS certificate expiry on port 6514',
      'HEC VIP connectivity drop from SC4S to Indexer cluster'
    ],
    daemonPath: 'systemctl status sc4s',
    steps: [
      {
        step: 1,
        titleFa: 'بررسی خطاهای بافر سوکت UDP لینوکس (Kernel Socket Audit)',
        titleEn: 'Inspect Kernel UDP Socket Drops',
        shortDescFa: 'بررسی خطاهای RcvbufErrors و پایش آمار دراپ کارت شبکه',
        shortDescEn: 'Check kernel UDP receive buffer errors and NIC drop statistics',
        commandSnippet: 'netstat -su | grep "buffer errors" && sysctl net.core.rmem_max',
        simulatedOutput: [
          '[STEP 1: Kernel UDP Socket Buffer & Drop Audit]',
          '$ netstat -su | grep "buffer errors"',
          '    142,890 packet receive errors (RcvbufErrors - UDP Buffer Overrun!)',
          '$ sysctl net.core.rmem_max',
          'net.core.rmem_max = 212992 (Default too small for high-speed syslog stream)',
          'Diagnosis: Kernel is discarding incoming syslog UDP packets during traffic peaks.',
          'Resolution scheduled: Expand kernel socket buffer to 64MB.'
        ]
      },
      {
        step: 2,
        titleFa: 'پایش سلامت سرویس کانتینری SC4S (Podman/systemd)',
        titleEn: 'Check SC4S Container & systemd Health',
        shortDescFa: 'بررسی وضعیت کانتینر، لاگ‌های syslog-ng و مصرف پردازنده',
        shortDescEn: 'Inspect SC4S systemd service status and container runtime logs',
        commandSnippet: 'systemctl status sc4s && podman logs --tail 20 sc4s',
        simulatedOutput: [
          '[STEP 2: Inspecting SC4S Service & Container Logs]',
          '$ systemctl status sc4s',
          '● sc4s.service - Splunk Connect for Syslog (Active: active (running))',
          '$ podman logs --tail 10 sc4s',
          '[syslog-ng] Starting syslog-ng OSE 3.38 on UDP/TCP:514 TLS:6514 ... OK',
          '[syslog-ng] Connected to upstream HEC: https://idx-cluster-peer-01.corp.internal:8088',
          '[syslog-ng] Warning: Vendor context "cisco_asa" experiencing high input rate.'
        ]
      },
      {
        step: 3,
        titleFa: 'اعتبارسنجی کانفیگ پارسرها در env_file و پورت‌ها',
        titleEn: 'Validate SC4S env_file & Vendor Parsers',
        shortDescFa: 'تست قوانین تفکیک خودکار لاگ‌های Cisco, Palo Alto و Fortinet',
        shortDescEn: 'Verify vendor pattern filters and TLS certificates in /opt/sc4s/env_file',
        commandSnippet: 'cat /opt/sc4s/env_file | grep -E "SPLUNK_HEC_URL|SC4S_DEST"',
        simulatedOutput: [
          '[STEP 3: Validating SC4S Configuration & Parsers]',
          '$ grep -E "SPLUNK_HEC|SC4S_LISTEN" /opt/sc4s/env_file',
          'SPLUNK_HEC_URL=https://10.20.30.50:8088,https://10.20.30.51:8088',
          'SPLUNK_HEC_TOKEN=************************************',
          'SC4S_LISTEN_CISCO_ASA_UDP_PORT=514',
          'SC4S_LISTEN_PALOALTO_PANOS_TLS_PORT=6514',
          'Environment validation passed: All endpoints syntax validated.'
        ]
      },
      {
        step: 4,
        titleFa: 'ارتقای بافر کرنل لینوکس به ۶۴ مگابایت (sysctl optimization)',
        titleEn: 'Expand Linux Kernel Socket Buffers (64MB)',
        shortDescFa: 'افزایش rmem_max و rmem_default برای جلوگیری کامل از دراپ UDP',
        shortDescEn: 'Tune net.core.rmem_max to 67108864 to eliminate packet drop under load',
        commandSnippet: 'sysctl -w net.core.rmem_max=67108864 && sysctl -w net.core.rmem_default=67108864',
        simulatedOutput: [
          '[STEP 4: Tuning Linux Kernel Socket Parameters]',
          '$ sysctl -w net.core.rmem_max=67108864',
          'net.core.rmem_max = 67108864 (64 MB Buffer Applied)',
          '$ sysctl -w net.core.rmem_default=67108864',
          'net.core.rmem_default = 67108864',
          '$ sysctl -w net.core.netdev_max_backlog=10000',
          'net.core.netdev_max_backlog = 10000',
          'Kernel socket tuning complete. No more buffer drop will occur.'
        ]
      },
      {
        step: 5,
        titleFa: 'راه‌اندازی مجدد سرویس SC4S و تست زنده استریم سیسلاگ',
        titleEn: 'Restart SC4S Service & Test Live Syslog Stream',
        shortDescFa: 'ری‌استارت کانتینر SC4S و سنجش پایش مجدد جریان ورودی لاگ',
        shortDescEn: 'Execute systemctl restart sc4s and confirm live syslog ingestion',
        commandSnippet: 'systemctl restart sc4s && logger -n 127.0.0.1 -P 514 "SC4S Health Check OK"',
        simulatedOutput: [
          '[STEP 5: Restarting SC4S & Verifying Real-Time Ingestion]',
          '$ systemctl restart sc4s',
          'Stopping SC4S container... [OK]',
          'Starting SC4S container with 64MB socket buffer... [OK]',
          '$ logger -n 127.0.0.1 -P 514 -d "SC4S Automated Recovery Test Event"',
          'Test packet received by syslog-ng and dispatched to HEC stream in 0.8ms.',
          'Live Network Ingestion Flow Restored: +5,200 EPS active!'
        ]
      }
    ],
    successMessageFa: 'سرویس SC4S با بهینه‌سازی بافر کرنل لینوکس ری‌استارت شد و جریان سیسلاگ با موفقیت احیا گردید.',
    successMessageEn: 'SC4S syslog engine re-tuned, restarted, and network telemetry stream recovered.'
  },

  indexer_node: {
    role: 'indexer_node',
    badgeLabelFa: 'ایندکسر کلاستر (Indexer Peer)',
    badgeLabelEn: 'Indexer Peer (Storage & Indexing)',
    colorTheme: {
      border: 'border-emerald-500/50',
      bgGlow: 'bg-emerald-950/20',
      text: 'text-emerald-400',
      button: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950'
    },
    architectureSummaryFa:
      'نود ایندکسر قلب ذخیره‌سازی داده‌های اسپلانک است. لاگ‌های ارسالی از پورت ۹۹۹۷ در باکت‌های Hot ذخیره و فشرده شده، شاخص‌های TSIDX ساخته می‌شوند و باکت‌ها بر اساس Replication Factor (RF=3) به سایر نودهای کلاستر همگام‌سازی می‌گردند.',
    architectureSummaryEn:
      'Indexer Peer parses rawdata, builds TSIDX index keys, writes hot/warm buckets, and replicates data on port 9887. Outages involve port 9997 socket stalls, storage watermarks, or bucket corruption.',
    commonOutageCausesFa: [
      'رسیدن به آستانه فضای آزاد دیسک (minFreeSpace threshold reached in server.conf)',
      'قفل شدن یا خرابی باکت‌های فعال در پوشه hot-db (Corrupted TSIDX bucket lock)',
      'توقف لیسنر پورت ورودی ۹۹۹۷ (splunktcp listener stopped)',
      'خطای رپلیکیشن با سایر ایندکسرها در پورت ۹۸۸۷ یا قطعی هارت‌بیت با کلاستر مستر'
    ],
    commonOutageCausesEn: [
      'Disk volume full or reached minFreeSpace limit in server.conf',
      'Hot bucket corruption or stuck file handle lock in hot-db',
      'Port 9997 splunktcp receiver socket closed or paused',
      'Indexer cluster replication synchronization failure on port 9887'
    ],
    daemonPath: '/opt/splunk/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'اعتبارسنجی لیسنر پورت ورودی ۹۹۹۷ (SplunkTCP Listener)',
        titleEn: 'Check Port 9997 Ingestion Listener',
        shortDescFa: 'بررسی باز بودن پورت ۹۹۹۷ و تنظیمات splunktcp-ssl در inputs.conf',
        shortDescEn: 'Verify TCP 9997 listener status and TLS certificate binding in inputs.conf',
        commandSnippet: '/opt/splunk/bin/splunk display listen && netstat -tlpn | grep 9997',
        simulatedOutput: [
          '[STEP 1: Checking Ingestion Port 9997 Receiver Socket]',
          '$ /opt/splunk/bin/splunk display listen',
          'Receiving inputs:',
          '  splunktcp-ssl : 9997 (ACTIVE)',
          '$ netstat -tlpn | grep 9997',
          'tcp6       0      0 :::9997                 :::*                    LISTEN      18920/splunkd',
          'Port 9997 socket verified: Ready to accept cooked data streams.'
        ]
      },
      {
        step: 2,
        titleFa: 'پایش فضای دیسک و شاخص minFreeSpace دیتابیس',
        titleEn: 'Audit Storage Volumes & minFreeSpace',
        shortDescFa: 'بررسی پارتیشن‌های /opt/splunk/var/lib/splunk و رفع انسداد فضا',
        shortDescEn: 'Inspect filesystem mount points and enforce safe indexing disk thresholds',
        commandSnippet: 'df -h /opt/splunk/var/lib/splunk && grep minFreeSpace /opt/splunk/etc/system/local/server.conf',
        simulatedOutput: [
          '[STEP 2: Auditing Storage Volume & Disk Watermarks]',
          '$ df -h /opt/splunk/var/lib/splunk',
          'Filesystem      Size  Used Avail Use% Mounted on',
          '/dev/nvme0n1    2.0T  1.2T  780G  61% /opt/splunk/var/lib/splunk',
          '$ grep minFreeSpace /opt/splunk/etc/system/local/server.conf',
          'minFreeSpace = 10000 (10 GB Safe Margin)',
          'Disk Health: 780 GB available. Indexing is NOT throttled by disk space.'
        ]
      },
      {
        step: 3,
        titleFa: 'اسکن و بازسازی سلامت باکت‌های دیتابیس (fsck bucket repair)',
        titleEn: 'Scan & Repair Hot/Warm Buckets (fsck)',
        shortDescFa: 'آزادسازی قفل باکت‌های hot و چرخش ایمن به warm جهت رفع بن‌بست ایندکس',
        shortDescEn: 'Run splunk fsck to scan for corrupt TSIDX files and release stuck locks',
        commandSnippet: '/opt/splunk/bin/splunk fsck scan --all-buckets-one-index --index=_internal',
        simulatedOutput: [
          '[STEP 3: Running Splunk fsck TSIDX Integrity Audit]',
          '$ /opt/splunk/bin/splunk fsck scan --all-buckets-one-index --index=main',
          'Scanning buckets in /opt/splunk/var/lib/splunk/defaultdb/db ...',
          'Bucket db_1726880000_1726800000_0: [HEALTHY]',
          'Bucket hot_v1_14: Found stale write lock from previous abnormal termination.',
          'Action: Released stale lock and rolled bucket hot_v1_14 -> db_1726910000_warm ... [REPAIRED]',
          'TSIDX integrity scan completed: 0 corrupted buckets remaining.'
        ]
      },
      {
        step: 4,
        titleFa: 'بررسی همگام‌سازی کلاستر مستر و پورت رپلیکیشن ۹۸۸۷',
        titleEn: 'Verify Cluster Replication & Master Sync',
        shortDescFa: 'تست برقراری ارتباط کلاستر با سرور Cluster Manager در پورت ۸۰۸۹',
        shortDescEn: 'Verify cluster peer communication and data replication channel on port 9887',
        commandSnippet: '/opt/splunk/bin/splunk show cluster-status',
        simulatedOutput: [
          '[STEP 4: Verifying Cluster Replication & Master Heartbeat]',
          '$ /opt/splunk/bin/splunk show cluster-status',
          'Cluster Master URI: https://10.20.30.40:8089',
          'Peer Status: Up and In-Sync (Site: site1)',
          'Replication Port: 9887 [OPEN]',
          'Replication Factor (RF) Status: Met (3/3 copies replicated).',
          'Search Factor (SF) Status: Met (2/2 searchable copies available).'
        ]
      },
      {
        step: 5,
        titleFa: 'ری‌استارت ایمن ایندکسر با حفظ یکپارچگی باکت‌ها',
        titleEn: 'Graceful Indexer Restart & Pipeline Resume',
        shortDescFa: 'راه‌اندازی مجدد با تخلیه بافرهای حافظه به دیسک و آغاز دریافت لاگ',
        shortDescEn: 'Execute graceful splunk restart and resume live ingestion streams',
        commandSnippet: '/opt/splunk/bin/splunk restart --force',
        simulatedOutput: [
          '[STEP 5: Executing Graceful Restart of Indexer Peer]',
          '$ /opt/splunk/bin/splunk restart --force',
          'Flushing memory buffers to TSIDX journal... [DONE]',
          'Stopping splunkd (PID 18920)... [OK]',
          'Starting splunkd... [OK]',
          'Listening on port 9997 (TLS 1.3)... [READY]',
          'Live Ingestion Restored: +12,800 EPS flowing to storage buckets!'
        ]
      }
    ],
    successMessageFa: 'ایندکسر کلاستر با موفقیت بازسازی، قفل باکت‌ها آزاد و پایپلاین ایندکس لاگ‌ها فعال شد.',
    successMessageEn: 'Indexer peer fsck repair completed and storage ingestion resumed successfully.'
  },

  search_head: {
    role: 'search_head',
    badgeLabelFa: 'سرچ‌هد کلاستر (Search Head / SHC)',
    badgeLabelEn: 'Search Head Cluster Member',
    colorTheme: {
      border: 'border-cyan-500/50',
      bgGlow: 'bg-cyan-950/20',
      text: 'text-cyan-400',
      button: 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950'
    },
    architectureSummaryFa:
      'سرچ‌هد نقطه تعامل کاربران، داشبوردها، الرت‌های SOC، اپلیکیشن Enterprise Security (ES) و اجرای کوئری‌های توزیع‌شده روی ایندکسرها است. هماهنگی میان سرچ‌هدها توسط الگوریتم Raft و کاپیتان کلاستر مدیریت می‌شود.',
    architectureSummaryEn:
      'Search Head executes distributed queries across Indexers, manages Knowledge Objects, Data Models, and Enterprise Security. Outages involve bundle bloat, KVStore sync, or search peer timeouts.',
    commonOutageCausesFa: [
      'حجیم شدن باندل دانش (Knowledge Bundle > 3GB) و تایم‌اوت ارسال به ایندکسرها',
      'قطعی ارتباط در پورت ۸۰۸۹ با ایندکسرها (Search Peers disconnected)',
      'خرابی یا عدم همگام‌سازی دیتابیس KVStore کلاستر',
      'پر شدن دایرکتوری dispatch به دلیل کوئری‌های انباشته شده و بدون انقضا'
    ],
    commonOutageCausesEn: [
      'Knowledge bundle size explosion (>3GB) causing indexer replication timeouts',
      'Search peer disconnect on port 8089 to Indexers',
      'KVStore replication desynchronization or corruption',
      'Dispatch directory disk saturation from stale search artifacts'
    ],
    daemonPath: '/opt/splunk/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'بررسی وضعیت اتصال سرچ‌هد به ایندکسرها (Search Peers Audit)',
        titleEn: 'Audit Search Peers Connection (Port 8089)',
        shortDescFa: 'تست دسترسی به تمام ایندکسرها در پورت ۸۰۸۹ و وضعیت پاسخ‌دهی آن‌ها',
        shortDescEn: 'Verify REST connectivity to all Indexer peers on port 8089',
        commandSnippet: '/opt/splunk/bin/splunk list search-server',
        simulatedOutput: [
          '[STEP 1: Checking Search Peer Connectivity]',
          '$ /opt/splunk/bin/splunk list search-server',
          'Peer: https://10.20.30.50:8089 -> Status: Active, Latency: 0.8ms',
          'Peer: https://10.20.30.51:8089 -> Status: Active, Latency: 0.9ms',
          'Peer: https://10.20.30.52:8089 -> Status: Active (DR Site), Latency: 2.1ms',
          'All 3 Search Peers are responding to distributed query dispatch.'
        ]
      },
      {
        step: 2,
        titleFa: 'بررسی و بهینه‌سازی حجم Knowledge Bundle',
        titleEn: 'Inspect & Optimize Knowledge Bundle Size',
        shortDescFa: 'کنترل حجم فایل‌های ارسالی به ایندکسرها در distsearch.conf',
        shortDescEn: 'Ensure knowledge bundle is under 1GB and exclude large lookup files',
        commandSnippet: 'du -sh /opt/splunk/var/run/searchpeers/*.bundle && /opt/splunk/bin/splunk btool distsearch list --debug',
        simulatedOutput: [
          '[STEP 2: Auditing Knowledge Bundle & Lookup Exclusions]',
          '$ du -sh /opt/splunk/var/run/searchpeers/*.bundle',
          'Current Bundle Size: 340 MB (Well within the safe < 1GB limit)',
          '$ /opt/splunk/bin/splunk btool distsearch list [replicationWhitelist]',
          'Replication rules validated: Large CSV lookup tables excluded from live sync.',
          'Knowledge bundle is lean and ready for fast peer distribution.'
        ]
      },
      {
        step: 3,
        titleFa: 'اعتبارسنجی وضعیت کلاستر و کاپیتان SHC (Raft Consensus)',
        titleEn: 'Verify SHC Captaincy & Raft Status',
        shortDescFa: 'بررسی پایداری کلاستر سرچ‌هد و انتخاب کاپیتان بدون اسپلیت‌برین',
        shortDescEn: 'Confirm SHC Captain election stability and cluster member sync',
        commandSnippet: '/opt/splunk/bin/splunk show shcluster-status',
        simulatedOutput: [
          '[STEP 3: Inspecting Search Head Cluster (SHC) Status]',
          '$ /opt/splunk/bin/splunk show shcluster-status',
          'Captain: https://sh-captain-cluster-01.corp.internal:8089 (Elected & Stable)',
          'Members: 3 nodes (sh-01, sh-02, sh-03) all In-Sync',
          'Raft Term: 14, Consensus: 100% agreement',
          'SHC Cluster State: Fully functional.'
        ]
      },
      {
        step: 4,
        titleFa: 'پاکسازی آرتیفکت‌های قدیمی دایرکتوری dispatch',
        titleEn: 'Purge Stale Dispatch Artifacts',
        shortDescFa: 'تخلیه نتایج جستجوهای قدیمی منقضی شده جهت آزادسازی رم و پردازنده',
        shortDescEn: 'Clean up expired search job directories to release system memory & disk',
        commandSnippet: '/opt/splunk/bin/splunk clean-dispatch',
        simulatedOutput: [
          '[STEP 4: Cleaning Expired Dispatch Search Jobs]',
          '$ /opt/splunk/bin/splunk clean-dispatch',
          'Scanning /opt/splunk/var/run/splunk/dispatch ...',
          'Removed 420 expired search jobs and orphaned CSV artifacts.',
          'Freed 18.4 GB of dispatch storage.',
          'Search head execution environment is now unencumbered.'
        ]
      },
      {
        step: 5,
        titleFa: 'راه‌اندازی مجدد و تست اجرای کوئری توزیع‌شده',
        titleEn: 'Restart Search Head & Execute Test Query',
        shortDescFa: 'ری‌استارت دیمن سرچ‌هد و اجرای موفق یک سرچ تستی در کلاستر',
        shortDescEn: 'Clean restart of search head service and dispatch of verification SPL query',
        commandSnippet: '/opt/splunk/bin/splunk restart && /opt/splunk/bin/splunk search "| makeresults | eval test=\\"ok\\""',
        simulatedOutput: [
          '[STEP 5: Restarting Search Head Service & Testing Query Execution]',
          '$ /opt/splunk/bin/splunk restart',
          'Stopping splunkd (PID 31090)... [OK]',
          'Starting splunkd (Web 8000 & REST 8089)... [OK]',
          '$ /opt/splunk/bin/splunk search "| makeresults | eval health=\\"SUCCESS\\" -preview 0"',
          'Search Result: health="SUCCESS", peers_responded=3/3, duration=0.12s.',
          'Search Head Cluster Member is 100% Operational!'
        ]
      }
    ],
    successMessageFa: 'سرچ‌هد با موفقیت پاکسازی، ریلود و کوئری‌های توزیع‌شده با تمام ایندکسرها بازیابی شد.',
    successMessageEn: 'Search Head dispatch cleaned, peers synchronized, and query engine restored.'
  },

  deployment_server: {
    role: 'deployment_server',
    badgeLabelFa: 'دپلویمنت سرور (Deployment Server)',
    badgeLabelEn: 'Deployment Server (DS)',
    colorTheme: {
      border: 'border-purple-500/50',
      bgGlow: 'bg-purple-950/20',
      text: 'text-purple-400',
      button: 'from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-slate-950'
    },
    architectureSummaryFa:
      'دپلویمنت سرور مرکز توزیع کانفیگ‌ها و اپلیکیشن‌ها به صدها یا هزاران فورواردر (UF/HF) در سراسر شبکه است. با استفاده از serverclass.conf و پورت ۸۰۸۹ بسته‌ها را مستقر می‌کند.',
    architectureSummaryEn:
      'Deployment Server centrally provisions apps and configurations to forwarders using serverclass.conf and port 8089 phone-home polling.',
    commonOutageCausesFa: [
      'طوفان ارتباط همزمان فورواردرها (Phone-home connection storm)',
      'خطای سینتکسی در فیلترهای serverclass.conf',
      'خرابی پکیج‌های اپلیکیشن در پوشه deployment-apps'
    ],
    commonOutageCausesEn: [
      'Forwarder phone-home storm overwhelming port 8089 sockets',
      'Syntax or regex error in serverclass.conf whitelist/blacklist',
      'Corrupt app archive in /opt/splunk/etc/deployment-apps'
    ],
    daemonPath: '/opt/splunk/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'بررسی تعداد کلاینت‌های متصل و فاصله Phone-Home',
        titleEn: 'Audit Connected Clients & Polling Intervals',
        shortDescFa: 'پایش ارتباط کلاینت‌ها و تنظیم مجدد فاصله ارتباط دوره‌ای',
        shortDescEn: 'Inspect connected forwarder clients and adjust phone-home intervals',
        commandSnippet: '/opt/splunk/bin/splunk list deploy-clients',
        simulatedOutput: [
          '[STEP 1: Checking Deployment Server Clients]',
          '$ /opt/splunk/bin/splunk list deploy-clients',
          'Total Connected Forwarders: 1,420 clients active.',
          'Average Phone-Home Interval: 30 seconds.',
          'All forwarder handshakes active.'
        ]
      },
      {
        step: 2,
        titleFa: 'اعتبارسنجی گرامر serverclass.conf با btool',
        titleEn: 'Validate serverclass.conf with btool',
        shortDescFa: 'بررسی کلاس‌های سروری و تطابق regex ماشین‌ها',
        shortDescEn: 'Check server class filters and whitelist/blacklist syntax',
        commandSnippet: '/opt/splunk/bin/splunk btool serverclass list --debug',
        simulatedOutput: [
          '[STEP 2: Validating serverclass.conf]',
          '$ /opt/splunk/bin/splunk btool serverclass list --debug',
          'Class [linux_universal_forwarders] -> MATCH: 850 clients',
          'Class [windows_domain_controllers] -> MATCH: 120 clients',
          'Class [core_banking_app_servers] -> MATCH: 380 clients',
          'Serverclass syntax valid: 0 errors.'
        ]
      },
      {
        step: 3,
        titleFa: 'بررسی یکپارچگی اپلیکیشن‌ها در deployment-apps',
        titleEn: 'Verify Deployment Apps Repository',
        shortDescFa: 'بررسی چک‌سام و دسترسی فایل‌های اپلیکیشن‌ها',
        shortDescEn: 'Inspect app packages in deployment-apps repository',
        commandSnippet: 'ls -la /opt/splunk/etc/deployment-apps/',
        simulatedOutput: [
          '[STEP 3: Inspecting deployment-apps Repository]',
          'Splunk_TA_nix v8.8.0 ... [OK]',
          'Splunk_TA_windows v8.7.1 ... [OK]',
          'org_all_indexer_base_outputs v3.1.0 ... [OK]',
          'All app archives validated.'
        ]
      },
      {
        step: 4,
        titleFa: 'تنظیم ماکزیمم اتصالات همزمان در server.conf',
        titleEn: 'Tune Max Sockets in server.conf',
        shortDescFa: 'افزایش ظرفیت پاسخ‌دهی به فورواردرها',
        shortDescEn: 'Increase max deployment client threads to prevent connection drops',
        commandSnippet: '/opt/splunk/bin/splunk set server-config --maxSockets 2048',
        simulatedOutput: [
          '[STEP 4: Tuning Socket Capacity]',
          'maxSockets = 2048 [APPLIED]',
          'deploymentServer maxThreads = 64 [APPLIED]'
        ]
      },
      {
        step: 5,
        titleFa: 'ریلود و راه‌اندازی مجدد موتور دپلویمنت سرور',
        titleEn: 'Reload Deployment Server Engine',
        shortDescFa: 'اعمال سراسری تغییرات با دستور splunk reload deploy-server',
        shortDescEn: 'Execute live reload of deployment server configuration',
        commandSnippet: '/opt/splunk/bin/splunk reload deploy-server',
        simulatedOutput: [
          '[STEP 5: Executing Deployment Server Reload]',
          '$ /opt/splunk/bin/splunk reload deploy-server',
          'Reloading Server Classes... [DONE]',
          'Broadcasting updated app bundles to 1,420 clients... [SUCCESS]',
          'Deployment Server is Fully Operational!'
        ]
      }
    ],
    successMessageFa: 'دپلویمنت سرور با موفقیت ریلود شد و توزیع اپ‌ها به فورواردرها آغاز گردید.',
    successMessageEn: 'Deployment Server reloaded and client distribution resumed successfully.'
  },

  cluster_master: {
    role: 'cluster_master',
    badgeLabelFa: 'کلاستر مستر ایندکسرها (Cluster Manager)',
    badgeLabelEn: 'Indexer Cluster Manager (CM)',
    colorTheme: {
      border: 'border-emerald-500/50',
      bgGlow: 'bg-emerald-950/20',
      text: 'text-emerald-400',
      button: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950'
    },
    architectureSummaryFa:
      'کلاستر مستر ناظر اصلی کل ایندکسرها است؛ اطمینان از برقراری Replication Factor (RF=3) و Search Factor (SF=2)، مدیریت صف‌های رفع نقص باکت‌ها (Fixup Queue) و توزیع باندل‌های کلاستر بر عهده این نود است.',
    architectureSummaryEn:
      'Cluster Manager oversees Indexer peers, monitors RF/SF bucket health, controls rolling restarts, and pushes cluster config bundles.',
    commonOutageCausesFa: [
      'انباشت صف رفع نقص باکت‌ها (Fixup tasks backlog) پس از خروج یا ورود نود جدید',
      'خطای ولیدیشن در باندل پیکربندی کلاستر (cluster bundle error)',
      'تایم‌اوت ارتباط REST در پورت ۸۰۸۹ با ایندکسرها'
    ],
    commonOutageCausesEn: [
      'Bucket fixup queue congestion following indexer failover',
      'Cluster configuration bundle validation failure',
      'REST port 8089 timeout to indexer peer nodes'
    ],
    daemonPath: '/opt/splunk/bin/splunk',
    steps: [
      {
        step: 1,
        titleFa: 'بررسی انطباق RF و SF کلاستر',
        titleEn: 'Audit RF & SF Bucket Compliance',
        shortDescFa: 'بررسی تکمیل ۳ نسخه رپلیکیشن و ۲ نسخه سرچ‌پذیر برای تمام باکت‌ها',
        shortDescEn: 'Verify all buckets satisfy Replication Factor (RF=3) and Search Factor (SF=2)',
        commandSnippet: '/opt/splunk/bin/splunk show cluster-status',
        simulatedOutput: [
          '[STEP 1: Cluster Master Health Audit]',
          '$ /opt/splunk/bin/splunk show cluster-status',
          'Replication Factor: 3 (Status: MET)',
          'Search Factor: 2 (Status: MET)',
          'Searchable Buckets: 14,820 | Replicated Buckets: 44,460',
          'Fixup Queue Count: 0 pending tasks.'
        ]
      },
      {
        step: 2,
        titleFa: 'اعتبارسنجی باندل پیکربندی کلاستر (check cluster-bundle)',
        titleEn: 'Validate Cluster Configuration Bundle',
        shortDescFa: 'بررسی فایل‌های indexes.conf در $SPLUNK_HOME/etc/master-apps/',
        shortDescEn: 'Run validation test on cluster bundle before pushing to peers',
        commandSnippet: '/opt/splunk/bin/splunk check cluster-bundle',
        simulatedOutput: [
          '[STEP 2: Validating Cluster Master App Bundle]',
          '$ /opt/splunk/bin/splunk check cluster-bundle',
          'Validating apps in /opt/splunk/etc/master-apps/ ...',
          'indexes.conf: Valid. All bucket sizes within storage limits.',
          'Bundle check: PASSED with 0 errors.'
        ]
      },
      {
        step: 3,
        titleFa: 'پایش وضعیت همگام‌سازی تک‌تک ایندکسرها',
        titleEn: 'Inspect Individual Peer Sync Status',
        shortDescFa: 'بررسی اتصال و نرخ دیسک نودهای سایت ۱ و سایت ۲ (DR)',
        shortDescEn: 'Verify heartbeat and disk usage across site1 and site2 peer nodes',
        commandSnippet: '/opt/splunk/bin/splunk list cluster-peers',
        simulatedOutput: [
          '[STEP 3: Inspecting Cluster Peers]',
          'Peer idx-01 (Site 1) -> Status: Up, Buckets: 14820, Disk: 62%',
          'Peer idx-02 (Site 1) -> Status: Up, Buckets: 14820, Disk: 60%',
          'Peer idx-03 (Site 2 - DR) -> Status: Up, Buckets: 14820, Disk: 64%',
          'All peers synchronized.'
        ]
      },
      {
        step: 4,
        titleFa: 'تنظیم Maintenance Mode و بازتعادل باکت‌ها',
        titleEn: 'Check Maintenance Mode & Auto-Rebalance',
        shortDescFa: 'اطمینان از فعال بودن بازتعادل هوشمند بار میان نودها',
        shortDescEn: 'Verify maintenance mode is disabled and automatic bucket rebalancing is active',
        commandSnippet: '/opt/splunk/bin/splunk set maintenance-mode disable',
        simulatedOutput: [
          '[STEP 4: Cluster Maintenance & Rebalancing Check]',
          '$ /opt/splunk/bin/splunk set maintenance-mode disable',
          'Maintenance mode is disabled.',
          'Auto-rebalancing enabled across all indexer storage tiers.'
        ]
      },
      {
        step: 5,
        titleFa: 'اعمال باندل کلاستر و فعال‌سازی سراسری',
        titleEn: 'Apply Cluster Bundle & Sync Peers',
        shortDescFa: 'ارسال همزمان تغییرات کانفیگ ایندکسرها با splunk apply cluster-bundle',
        shortDescEn: 'Execute live cluster bundle push to all indexer peers',
        commandSnippet: '/opt/splunk/bin/splunk apply cluster-bundle',
        simulatedOutput: [
          '[STEP 5: Applying Cluster Configuration Bundle]',
          '$ /opt/splunk/bin/splunk apply cluster-bundle',
          'Pushing configuration bundle to all cluster peers...',
          'Peer idx-01: Applied successfully.',
          'Peer idx-02: Applied successfully.',
          'Peer idx-03: Applied successfully.',
          'Cluster Master is 100% Healthy and Active!'
        ]
      }
    ],
    successMessageFa: 'کلاستر مستر با موفقیت وضعیت باکت‌ها را تثبیت و باندل پیکربندی را اعمال نمود.',
    successMessageEn: 'Cluster Manager synchronized all peers and applied cluster bundle.'
  }
};
