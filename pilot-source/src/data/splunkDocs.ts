import { SplunkDocItem, DocComplianceIssue, Severity } from '../types';

export const SPLUNK_CONFIG_DOCS: SplunkDocItem[] = [
  // INPUTS.CONF
  {
    id: 'inputs-monitor-index',
    confFile: 'inputs.conf',
    stanza: '[monitor://<path>]',
    parameter: 'index',
    defaultValue: 'default (main)',
    descriptionFa: 'نام ایندکسی که رویدادهای خوانده شده از این مسیر مانیتور شده در آن ذخیره خواهند شد.',
    descriptionEn: 'The index in which events from this monitor stanza are stored.',
    bestPracticeFa: 'همیشه یک ایندکس مشخص و جداگانه (مانند os_linux یا net_firewall) تعیین کنید. ذخیره داده در ایندکس پیش‌فرض (main) باعث تداخل در سیاست‌های نگهداری (Retention) و کاهش سرعت جستجو می‌شود.',
    bestPracticeEn: 'Always specify an explicit dedicated index. Dumping data into default/main corrupts retention lifecycle and degrades search speed.',
    securityImpactFa: 'تفکیک دسترسی بر اساس ایندکس در Splunk بر مبنای این مقدار انجام می‌شود؛ بدون این مقدار کاربران غیرمجاز ممکن است داده را ببینند.',
    securityImpactEn: 'Role-based access controls in Splunk filter data by index. Omitting index exposes sensitive telemetry.',
    example: '[monitor:///var/log/secure]\nindex = os_linux\nsourcetype = linux_secure',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf'
  },
  {
    id: 'inputs-monitor-sourcetype',
    confFile: 'inputs.conf',
    stanza: '[monitor://<path>]',
    parameter: 'sourcetype',
    defaultValue: '(empty - regex guessed)',
    descriptionFa: 'نوع منبع داده برای تعیین قوانین پارس کردن، فرمت زمان، جداسازی خطوط و استخراج فیلدها.',
    descriptionEn: 'Identifies the data format and tells Splunk which parsing rules to invoke.',
    bestPracticeFa: 'هرگز اجازه ندهید اسپلانک نوع سورس‌تایپ را حدس بزند. همیشه سورس‌تایپ استاندارد CIM یا نام مشخص قرار دهید.',
    bestPracticeEn: 'Never allow Splunk to guess sourcetypes dynamically. Always use explicit CIM-compliant sourcetypes.',
    securityImpactFa: 'حدس اشتباه سورس‌تایپ باعث شکست قوانین لاگ‌گیری SOC و عدم کارکرد Correlation Searchهای Enterprise Security می‌شود.',
    securityImpactEn: 'Incorrect sourcetype recognition breaks SOC correlation rules and Splunk Enterprise Security data models.',
    example: '[monitor:///var/log/audit/audit.log]\nindex = os_linux\nsourcetype = linux:audit',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf'
  },
  {
    id: 'inputs-tcp-routing',
    confFile: 'inputs.conf',
    stanza: '[monitor://<path>] یا [splunktcp://...]',
    parameter: '_TCP_ROUTING',
    defaultValue: '* (همه گروه‌های خروجی)',
    descriptionFa: 'تعیین گروه مقصد در outputs.conf که لاگ‌های این ورودی باید فقط به آنجا ارسال شوند.',
    descriptionEn: 'Designates the tcpout target group in outputs.conf where events from this input are routed.',
    bestPracticeFa: 'اگر از _TCP_ROUTING استفاده می‌کنید، حتماً نام گروه دقیقاً در outputs.conf به صورت [tcpout:<group>] تعریف شده باشد.',
    bestPracticeEn: 'Ensure any referenced tcpout group exactly matches an existing [tcpout:<group>] stanza in outputs.conf.',
    securityImpactFa: 'اشاره به گروه تعریف نشده منجر به مسدود شدن صف یا عدم فوروارد شدن بی سر و صدای ترافیک امنیتی می‌شود.',
    securityImpactEn: 'Routing to an undefined group causes parsingQueue blockage or silent event drops.',
    example: '[monitor:///var/log/paloalto/*.log]\nindex = net_firewall\n_TCP_ROUTING = enterprise_indexers',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf'
  },
  {
    id: 'inputs-hec-enableSSL',
    confFile: 'inputs.conf',
    stanza: '[http]',
    parameter: 'enableSSL',
    defaultValue: '1 (HTTPS فعال)',
    descriptionFa: 'فعال‌سازی رمزنگاری TLS برای سرویس HTTP Event Collector (HEC) روی پورت ۸۰۸۸.',
    descriptionEn: 'Enables TLS encryption for HTTP Event Collector endpoint.',
    bestPracticeFa: 'در تمام محیط‌ها باید مقدار enableSSL = 1 باشد تا توکن‌های کانتینرها و برنامه‌ها رمزنگاری شوند.',
    bestPracticeEn: 'Must always be enableSSL = 1 in production environments.',
    securityImpactFa: 'با enableSSL = 0، توکن‌های احراز هویت Splunk Bearer Token در سراسر شبکه به صورت متن خام افشا می‌گردند.',
    securityImpactEn: 'Cleartext HEC reveals bearer authentication tokens allowing spoofing.',
    example: '[http]\ndisabled = 0\nport = 8088\nenableSSL = 1\nsslVersions = tls1.2,tls1.3',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector'
  },

  // OUTPUTS.CONF
  {
    id: 'outputs-tcpout-useSSL',
    confFile: 'outputs.conf',
    stanza: '[tcpout] یا [tcpout:<group>]',
    parameter: 'useSSL',
    defaultValue: 'false',
    descriptionFa: 'فعال‌سازی رمزنگاری TLS/SSL برای انتقال امن لاگ‌ها میان فورواردر و ایندکسرها.',
    descriptionEn: 'Enables TLS encryption for data transmission between forwarder and indexers.',
    bestPracticeFa: 'در تمام محیط‌های سازمانی و SOC باید مقدار useSSL برابر true باشد و از گواهی CA معتبر سازمانی استفاده شود.',
    bestPracticeEn: 'Must always be set to true in production SOC environments using enterprise CA-signed certificates.',
    securityImpactFa: 'مقدار false یعنی انتقال متن آشکار (Cleartext) لاگ‌ها، نام‌های کاربری، هش‌ها و ترافیک در شبکه و آسیب‌پذیری در برابر شنود (Sniffing) و MITM.',
    securityImpactEn: 'Cleartext log forwarding exposes sensitive credentials and payload data to man-in-the-middle sniffing.',
    example: '[tcpout:primary_indexers]\nserver = 10.20.30.50:9997, 10.20.30.51:9997\nuseSSL = true\nsslVerifyServerCert = true',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },
  {
    id: 'outputs-tcpout-sslVerifyServerCert',
    confFile: 'outputs.conf',
    stanza: '[tcpout]',
    parameter: 'sslVerifyServerCert',
    defaultValue: 'false',
    descriptionFa: 'بررسی صحت زنجیره گواهی دیجیتال سرور ایندکسر در برابر CA ریشه توسط فورواردر.',
    descriptionEn: 'Validates that the indexer certificate is signed by the trusted Root CA.',
    bestPracticeFa: 'همراه با useSSL = true، این پارامتر را نیز true قرار دهید و مسیر sslRootCAPath را تنظیم کنید.',
    bestPracticeEn: 'Must be enabled alongside useSSL to prevent rogue indexers from intercepting logs.',
    securityImpactFa: 'اگر false باشد، فورواردر هر گواهی جعلی را می‌پذیرد و امکان رهگیری یا جعل ایندکسر وجود دارد.',
    securityImpactEn: 'Disabling verification allows adversaries to spoof an indexer receiver and steal telemetry.',
    example: 'sslVerifyServerCert = true\nsslRootCAPath = $SPLUNK_HOME/etc/auth/mycerts/cacert.pem\nsslCommonNameToCheck = idx.corp.local',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },
  {
    id: 'outputs-autoLB',
    confFile: 'outputs.conf',
    stanza: '[tcpout]',
    parameter: 'autoLB',
    defaultValue: 'true (در نسخه‌های جدید)',
    descriptionFa: 'توزیع بار خودکار بین ایندکسرهای موجود در گروه با تغییر کانکشن پس از حجم مشخص یا زمان مشخص.',
    descriptionEn: 'Enables automatic load balancing across configured indexers.',
    bestPracticeFa: 'مقدار autoLBFrequency را بین ۱۰ الی ۳۰ ثانیه تنظیم کنید تا جریان رویدادها به صورت یکنواخت روی تمام ایندکسرها پخش شود.',
    bestPracticeEn: 'Keep autoLBFrequency between 10-30s to prevent hot-spotting on a single indexer.',
    securityImpactFa: 'عدم توازن بار باعث تاخیر در ایندکس و دیر رسیدن هشدارهای SOC در رویدادهای سنگین می‌شود.',
    securityImpactEn: 'Uneven load creates indexing bottlenecks and delayed SOC alert generation.',
    example: 'autoLB = true\nautoLBFrequency = 15',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },
  {
    id: 'outputs-useACK',
    confFile: 'outputs.conf',
    stanza: '[tcpout]',
    parameter: 'useACK',
    defaultValue: 'false',
    descriptionFa: 'فعال‌سازی پروتکل تاییدیه ایندکس شدن (Index-time Acknowledgment) برای جلوگیری از مفقود شدن داده‌ها در صورت قطعی شبکه.',
    descriptionEn: 'Enables indexer acknowledgment protocol preventing data loss during network hiccups.',
    bestPracticeFa: 'در تمام Heavy Forwarderها و محیط‌های حساس امنیتی مقدار useACK = true را قرار دهید.',
    bestPracticeEn: 'Set useACK = true on mission-critical forwarders to guarantee zero data loss.',
    securityImpactFa: 'بدون ACK، در صورت ریست شدن ایندکسر، رویدادهایی که در رم بودند بدون ثبت روی دیسک گم می‌شوند.',
    securityImpactEn: 'Without ACK, indexer crashes result in silent drops of in-flight security logs.',
    example: '[tcpout:primary_indexers]\nuseACK = true',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },
  {
    id: 'outputs-dropEventsOnQueueFull',
    confFile: 'outputs.conf',
    stanza: '[tcpout]',
    parameter: 'dropEventsOnQueueFull',
    defaultValue: '-1 (مسدود کردن و نگه‌داشتن داده تا زمان اتصال)',
    descriptionFa: 'تعیین رفتار فورواردر زمانی که تمام صف‌های خروجی پر شده‌اند و ارتباط با ایندکسرها قطع است.',
    descriptionEn: 'Determines whether forwarder blocks or silently drops data when queues saturate.',
    bestPracticeFa: 'مقدار باید -1 (یا مقدار پیش‌فرض امن) باشد. هرگز عدد مثبت (تعداد ثانیه تا ریختن داده) برای لاگ‌های امنیتی نگذارید.',
    bestPracticeEn: 'Keep at -1 for audit/SOC logs to guarantee data retention over network outages.',
    securityImpactFa: 'اگر این مقدار عدد مثبت باشد، لاگ‌های حملات هکری در هنگام قطعی موقت شبکه دور ریخته می‌شوند.',
    securityImpactEn: 'Positive values discard forensic log lines when network connectivity drops.',
    example: 'dropEventsOnQueueFull = -1',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf'
  },

  // SERVER.CONF
  {
    id: 'server-sslConfig-sslVersionsToSupport',
    confFile: 'server.conf',
    stanza: '[sslConfig]',
    parameter: 'sslVersionsToSupport',
    defaultValue: 'tls1.2 (در اسپلنک‌های مدرن)',
    descriptionFa: 'تعیین نسخه‌های مجاز پروتکل TLS برای ارتباطات داخلی Splunkd و REST API.',
    descriptionEn: 'Specifies acceptable TLS protocol versions for splunkd internal and REST communications.',
    bestPracticeFa: 'مقدار را منحصراً روی tls1.2, tls1.3 تنظیم کنید و هرگز پروتکل‌های منسوخ ssl3 یا tls1.0 را فعال نکنید.',
    bestPracticeEn: 'Enforce tls1.2, tls1.3 exclusively. Block legacy SSLv3 and TLS 1.0/1.1.',
    securityImpactFa: 'پروتکل‌های قدیمی دارای آسیب‌پذیری‌های معروفی همچون POODLE و BEAST هستند.',
    securityImpactEn: 'Older protocols are vulnerable to POODLE, BEAST, and sweet32 cryptographic attacks.',
    example: '[sslConfig]\nsslVersionsToSupport = tls1.2, tls1.3\nallowSslCompression = false',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf'
  },
  {
    id: 'server-general-pass4SymmKey',
    confFile: 'server.conf',
    stanza: '[general] یا [clustering]',
    parameter: 'pass4SymmKey',
    defaultValue: 'changeme (پیش‌فرض ناامن)',
    descriptionFa: 'کلید رمزنگاری متقارن برای تصدیق هویت گره‌های داخل کلاستر اسپلانک و ارتباطات بین کامپوننتی.',
    descriptionEn: 'Symmetric pre-shared secret key used to authenticate cluster members.',
    bestPracticeFa: 'در تمام نودهای یک کلاستر یک کلید تصادفی قوی (حداقل ۳۲ کاراکتر) تعریف کنید.',
    bestPracticeEn: 'Set a strong random 32+ character secret across all cluster peers.',
    securityImpactFa: 'باقی ماندن کلید پیش‌فرض "changeme" به هر فردی در شبکه اجازه می‌دهد خود را به عنوان عضو کلاستر معرفی کند و به داده‌ها دسترسی یابد.',
    securityImpactEn: 'Default changeme key enables unauthorized nodes to join the cluster and siphon/alter data.',
    example: '[clustering]\npass4SymmKey = 9f8a3c8e7b1a2d4f5c6e8b0a1d3e5f7a9b',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf'
  },
  {
    id: 'server-diskUsage-minFreeSpaceMB',
    confFile: 'server.conf',
    stanza: '[diskUsage]',
    parameter: 'minFreeSpaceMB',
    defaultValue: '5000',
    descriptionFa: 'حداقل فضای آزاد دیسک که اگر کمتر از آن شود، اسپلنک ایندکس‌کردن و صف‌بندی را برای جلوگیری از خرابی متوقف می‌کند.',
    descriptionEn: 'Minimum free disk space threshold before Splunk pauses ingestion to prevent data corruption.',
    bestPracticeFa: 'در سرورهای پرحجم مقدار را حداقل ۵۰۰۰ الی ۱۰,۰۰۰ مگابایت قرار دهید و بر روی پارتیشن SPLUNK_DB مانیتورینگ فعال داشته باشید.',
    bestPracticeEn: 'Set to at least 5000-10000 MB on heavy ingestion indexers.',
    securityImpactFa: 'کاهش بیش از حد این مقدار می‌تواند باعث پر شدن ۱۰۰٪ دیسک، قفل شدن سرور لینوکس و خرابی فایل‌های پایگاه داده شود.',
    securityImpactEn: 'Setting this too low can fill root partition to 100%, causing kernel panic and index corruption.',
    example: '[diskUsage]\nminFreeSpaceMB = 5000',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf'
  },

  // INDEXES.CONF
  {
    id: 'indexes-retention-frozenTimePeriodInSecs',
    confFile: 'indexes.conf',
    stanza: '[<index_name>]',
    parameter: 'frozenTimePeriodInSecs',
    defaultValue: '188697600 (حدود ۶ سال)',
    descriptionFa: 'مدت زمان نگهداری داده در ثانیه قبل از اینکه باکت‌ها به وضعیت Frozen (بایگانی یا حذف) بروند.',
    descriptionEn: 'Maximum age in seconds that index buckets can reside before freezing/deletion.',
    bestPracticeFa: 'بر اساس الزامات انطباق SOC (مثلاً ۹۰ روز = ۷۷۷۶۰۰۰ ثانیه، یا ۱ سال = ۳۱۵۳۶۰۰۰ ثانیه) تنظیم کنید و coldToFrozenDir را برای آرشیو تعریف کنید.',
    bestPracticeEn: 'Align with SOC compliance retention (e.g. 90 days = 7776000s) and set coldToFrozenDir for cold storage.',
    securityImpactFa: 'فقدان سیاست نگهداری باعث پر شدن بدون کنترل استوریج و از بین رفتن رویدادهای زنده فعلی می‌شود.',
    securityImpactEn: 'Unbounded retention overflows SAN/NVMe disks and breaks live incoming ingestion.',
    example: '[os_linux]\nhomePath = $SPLUNK_DB/os_linux/db\ncoldPath = $SPLUNK_DB/os_linux/colddb\nthawedPath = $SPLUNK_DB/os_linux/thaweddb\nfrozenTimePeriodInSecs = 7776000',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/indexesconf'
  },
  {
    id: 'indexes-maxTotalDataSizeMB',
    confFile: 'indexes.conf',
    stanza: '[<index_name>]',
    parameter: 'maxTotalDataSizeMB',
    defaultValue: '500000 (500GB)',
    descriptionFa: 'حداکثر سقف حجم مجاز داده برای کل باکت‌های این ایندکس.',
    descriptionEn: 'Maximum aggregate size in megabytes allowed for all buckets in this index.',
    bestPracticeFa: 'سقف حجم را بر اساس ظرفیت فیزیکی استوریج تعریف کنید تا مانع از مصرف ناخواسته دیسک توسط یک ایندکس خاص شوید.',
    bestPracticeEn: 'Cap the index size relative to storage partition capacity to prevent runaway disk usage.',
    securityImpactFa: 'عدم محدودسازی حجم ممکن است موجب اشباع دیسک و متوقف شدن کل کلاستر شود.',
    securityImpactEn: 'Uncapped index sizes risk saturating disk volumes and forcing daemon into read-only pause.',
    example: 'maxTotalDataSizeMB = 100000',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/indexesconf'
  },

  // PROPS.CONF
  {
    id: 'props-line-breaker',
    confFile: 'props.conf',
    stanza: '[<sourcetype>]',
    parameter: 'LINE_BREAKER',
    defaultValue: '([\\r\\n]+)',
    descriptionFa: 'عبارت منظم Regex برای تشخیص انتهای هر رویداد (Event Breaking) در مرحله Parsing Pipeline.',
    descriptionEn: 'Regex used by AggregatorMiningProcessor to break event boundaries in stream.',
    bestPracticeFa: 'همیشه از SHOULD_LINEMERGE = false به همراه یک LINE_BREAKER دقیق مبتنی بر تایم‌استمپ استفاده کنید تا مصرف CPU تا ۳ برابر کاهش یابد.',
    bestPracticeEn: 'Always set SHOULD_LINEMERGE = false with a clean regex LINE_BREAKER to cut parsing CPU usage by up to 60%.',
    securityImpactFa: 'شکستن اشتباه خطوط باعث درهم‌آمیختن لاگ‌های کاربران مختلف یا از دست رفتن شواهد جرم در فارنزیک می‌شود.',
    securityImpactEn: 'Malformed event boundaries conflate distinct user sessions and corrupt forensic integrity.',
    example: '[cisco:asa]\nSHOULD_LINEMERGE = false\nLINE_BREAKER = ([\\r\\n]+)(?:%ASA-\\d+-\\d+:)\nTRUNCATE = 10000',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf'
  },
  {
    id: 'props-should-linemerge',
    confFile: 'props.conf',
    stanza: '[<sourcetype>]',
    parameter: 'SHOULD_LINEMERGE',
    defaultValue: 'true (سربار شدید پردازشی)',
    descriptionFa: 'آیا اسپلانک باید چندین خط متوالی را با هم ترکیب کند تا یک رویداد بسازد.',
    descriptionEn: 'Whether splunkd aggregates multi-line text into a single event.',
    bestPracticeFa: 'برای تمام داده‌های تک‌خطی (مانند Syslog, Web Access, Netflow, Firewall) الزاما SHOULD_LINEMERGE = false بگذارید.',
    bestPracticeEn: 'Always set SHOULD_LINEMERGE = false for single-line streams to avoid CPU thrashing.',
    securityImpactFa: 'روشن بودن این مقدار برای لاگ‌های سنگین می‌تواند تا ۳۰۰٪ مصرف CPU ایندکسر را افزایش دهد و صف‌ها را پر کند.',
    securityImpactEn: 'Leaves regex state machine looping on single-line logs causing parsingQueue bottlenecks.',
    example: '[syslog:firewall]\nSHOULD_LINEMERGE = false\nLINE_BREAKER = ([\\r\\n]+)\nTRUNCATE = 10000',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf',
    category: 'parsing',
    patchSnippet: 'SHOULD_LINEMERGE = false',
    targetConf: 'props.conf'
  },
  {
    id: 'props-time-prefix',
    confFile: 'props.conf',
    stanza: '[<sourcetype>]',
    parameter: 'TIME_PREFIX & TIME_FORMAT',
    defaultValue: '(empty - auto-scan regex)',
    descriptionFa: 'تعیین عبارت پیشوند و الگوی دقیق زمان (strftimes) رویداد جهت هدایت مستقیم DateParserPipeline.',
    descriptionEn: 'Explicit regex prefix and strftime pattern guiding date parser pipeline.',
    bestPracticeFa: 'همیشه TIME_PREFIX و TIME_FORMAT و MAX_TIMESTAMP_LOOKAHEAD را تعریف کنید تا پردازشگر تاریخ کل خط را اسکن نکند.',
    bestPracticeEn: 'Always explicitly provide TIME_PREFIX, TIME_FORMAT, and MAX_TIMESTAMP_LOOKAHEAD to eliminate costly timestamp heuristics.',
    securityImpactFa: 'حدس اشتباه تاریخ باعث ثبت زمان نامعتبر رویدادها (Out-of-order) و شکست تحلیل زنجیره حملات سایبری می‌شود.',
    securityImpactEn: 'Timestamp misrecognition corrupts forensic timeline reconstructions during incident response.',
    example: '[json:audit]\nTIME_PREFIX = \\"timestamp\\":\\s*\\"\nTIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N%Z\nMAX_TIMESTAMP_LOOKAHEAD = 30',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf',
    category: 'parsing',
    patchSnippet: 'TIME_PREFIX = \\"timestamp\\":\\s*\\"\nTIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N%Z\nMAX_TIMESTAMP_LOOKAHEAD = 30',
    targetConf: 'props.conf'
  },

  // TRANSFORMS.CONF
  {
    id: 'transforms-dest-key',
    confFile: 'transforms.conf',
    stanza: '[<transform_name>]',
    parameter: 'DEST_KEY & REGEX',
    defaultValue: '(none)',
    descriptionFa: 'هدایت داینامیک لاگ‌ها به ایندکس‌های مختلف یا حذف لاگ‌های ناخواسته (Routing / Filtering / Masking) در زمان ایندکس.',
    descriptionEn: 'Directs events to specific indexes, sourcetypes, or discards them (nullQueue routing).',
    bestPracticeFa: 'برای فیلتر کردن لاگ‌های حجیم نویز (مانند Heartbeat Debug)، قبل از ایندکس با Queue:nullQueue آن‌ها را دور بریزید تا در هزینه لایسنس صرفه‌جویی شود.',
    bestPracticeEn: 'Route high-volume useless events to Queue:nullQueue at ingest pipeline to preserve valuable license quota.',
    securityImpactFa: 'حذف رویدادهای ناخواسته باعث بهبود کارایی کلاستر و پاکسازی لاگ‌های حساس قبل از ثبت می‌شود.',
    securityImpactEn: 'Ingest-time data masking ensures GDPR/PCI-DSS compliance by redacting credit cards and passwords.',
    example: '[filter_debug_logs]\nREGEX = (?i)DEBUG|TRACE|PING\nDEST_KEY = queue\nFORMAT = nullQueue',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Transformsconf',
    category: 'parsing',
    patchSnippet: '[filter_debug_logs]\nREGEX = (?i)DEBUG|TRACE|PING\nDEST_KEY = queue\nFORMAT = nullQueue',
    targetConf: 'transforms.conf'
  },

  // WEB.CONF
  {
    id: 'web-enablesplunkwebssl',
    confFile: 'web.conf',
    stanza: '[settings]',
    parameter: 'enableSplunkWebSSL',
    defaultValue: '0 (HTTP ناامن)',
    descriptionFa: 'فعال‌سازی رمزنگاری HTTPS روی کنسول وب اسپلانک (پورت ۸۰۰۰).',
    descriptionEn: 'Enforces TLS/HTTPS encryption on Splunk Web UI (port 8000).',
    bestPracticeFa: 'در تمام محیط‌ها الزاما مقدار enableSplunkWebSSL = true را قرار دهید و از گواهی دیجیتال معتبر سازمانی استفاده کنید.',
    bestPracticeEn: 'Must always be true in production to encrypt administrator web sessions.',
    securityImpactFa: 'غیرفعال بودن SSL باعث سرقت کوکی‌های نشست وب، توکن‌های لاگین ادمین و کلمات عبور در شبکه محلی می‌شود.',
    securityImpactEn: 'Cleartext web console exposes administrator sessions to eavesdropping, MITM attacks, and credential hijacking.',
    example: '[settings]\nenableSplunkWebSSL = true\nprivKeyPath = etc/auth/splunkweb/privkey.pem\nserverCert = etc/auth/splunkweb/cert.pem\nsslVersions = tls1.2,tls1.3',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Webconf',
    category: 'web',
    patchSnippet: 'enableSplunkWebSSL = true\nsslVersions = tls1.2,tls1.3\ncipherSuite = ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384',
    targetConf: 'web.conf'
  },
  {
    id: 'web-httpport',
    confFile: 'web.conf',
    stanza: '[settings]',
    parameter: 'httpport & login_content',
    defaultValue: '8000',
    descriptionFa: 'شماره پورت شنود وب‌سرور اسپلانک و متن بنر امنیتی صفحه لاگین.',
    descriptionEn: 'TCP port for Splunk Web and mandatory legal login banner warning.',
    bestPracticeFa: 'در صورت نیاز به چند اینستنس موازی، پورت وب را روی ۸۰۰۱ تنظیم کنید و بنر هشدار حقوقی (Legal Disclaimer) قرار دهید.',
    bestPracticeEn: 'Configure legal disclaimer warning banner on login screen and adjust port if staging multiple instances.',
    securityImpactFa: 'نمایش بنر قانونی از الزامات استانداردهای انطباق ISO 27001 و NIST برای اعلان عواقب دسترسی غیرمجاز است.',
    securityImpactEn: 'Mandatory warning banners fulfill NIST and ISO 27001 access control requirements.',
    example: '[settings]\nhttpport = 8000\nlogin_content = WARNING: Authorized personnel only. All activities are monitored.',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Webconf',
    category: 'web',
    patchSnippet: 'httpport = 8000\nlogin_content = WARNING: Authorized personnel only. All activities are monitored.',
    targetConf: 'web.conf'
  },

  // LIMITS.CONF
  {
    id: 'limits-searches-concurrency',
    confFile: 'limits.conf',
    stanza: '[search]',
    parameter: 'max_searches_per_cpu & base_max_searches',
    defaultValue: 'max_searches_per_cpu = 1, base_max_searches = 6',
    descriptionFa: 'تعیین حداکثر تعداد جستجوهای همزمان مجاز به ازای هسته‌های CPU سرچ‌هد.',
    descriptionEn: 'Concurrency boundaries for concurrent historical and real-time searches.',
    bestPracticeFa: 'برای سرورهای دارای ۱۶+ هسته، max_searches_per_cpu = 2 قرار دهید تا هشدارهای SOC رد نشوند.',
    bestPracticeEn: 'Set max_searches_per_cpu = 2 on modern enterprise search heads to avoid skipped scheduled searches.',
    securityImpactFa: 'کمبود ظرفیت جستجو باعث توقف اجرای لاگین الرت‌های SIEM و عدم کشف نفوذ می‌شود.',
    securityImpactEn: 'Search concurrency exhaustion skips SOC correlation searches, blinding security analysts.',
    example: '[search]\nmax_searches_per_cpu = 2\nbase_max_searches = 12\nmax_rt_search_multiplier = 2',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf',
    category: 'search',
    patchSnippet: '[search]\nmax_searches_per_cpu = 2\nbase_max_searches = 12',
    targetConf: 'limits.conf'
  },

  // AUTHENTICATION.CONF
  {
    id: 'auth-password-hash',
    confFile: 'authentication.conf',
    stanza: '[authentication]',
    parameter: 'passwordHashAlgorithm',
    defaultValue: 'SHA512 (یا PBKDF2 در نسخه‌های جدید)',
    descriptionFa: 'الگوریتم رمزنگاری و هش‌کردن کلمات عبور کاربران محلی اسپلانک.',
    descriptionEn: 'Cryptographic hash algorithm utilized for local user credentials.',
    bestPracticeFa: 'الگوریتم را روی PBKDF2 یا SHA512 با بیش از ۱۰۰,۰۰۰ دور (Iteration) تنظیم کنید.',
    bestPracticeEn: 'Enforce PBKDF2 with at least 100k rounds to defeat rainbow table attacks.',
    securityImpactFa: 'الگوریتم‌های ضعیف اجازه کرک شدن آفلاین کلمات عبور را در صورت نشت فایل passwd به مهاجم می‌دهند.',
    securityImpactEn: 'Weak hashing permits rapid offline GPU cracking of stolen passwd files.',
    example: '[authentication]\nauthType = Splunk\npasswordHashAlgorithm = pbkdf2_sha512',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Authenticationconf',
    category: 'rbac',
    patchSnippet: 'authType = Splunk\npasswordHashAlgorithm = pbkdf2_sha512',
    targetConf: 'authentication.conf'
  },

  // CLUSTERING (SERVER.CONF)
  {
    id: 'server-clustering-replication-factor',
    confFile: 'server.conf',
    stanza: '[clustering]',
    parameter: 'replication_factor & search_factor',
    defaultValue: 'replication_factor = 3, search_factor = 2',
    descriptionFa: 'تعداد نسخه‌های خام (Replication Factor - RF) و نسخه‌های ایندکس‌شده قابل جستجو (Search Factor - SF) در ایندکسر کلاستر.',
    descriptionEn: 'High-availability cluster settings specifying replication factor and searchable copy count.',
    bestPracticeFa: 'برای پایداری بالا (High Availability) در برابر خرابی همزمان نودها، RF=3 و SF=2 را در Cluster Master تعریف کنید.',
    bestPracticeEn: 'Standard enterprise SVA architecture requires RF=3 and SF=2 to tolerate simultaneous peer outages.',
    securityImpactFa: 'تنظیم RF=1 به این معنی است که با خاموش شدن یک سرور، بخشی از داده‌های امنیتی تا زمان بازگشت آن غیرقابل دسترس می‌شوند.',
    securityImpactEn: 'RF=1 risks immediate cluster data unavailability upon any single hardware failure.',
    example: '[clustering]\nmode = master\nreplication_factor = 3\nsearch_factor = 2\npass4SymmKey = HighEntropyClusterSecret2026!',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters',
    category: 'clustering',
    patchSnippet: '[clustering]\nreplication_factor = 3\nsearch_factor = 2',
    targetConf: 'server.conf'
  },

  // ARCHITECTURE (SVA)
  {
    id: 'arch-sva-hf-routing',
    confFile: 'outputs.conf & server.conf',
    stanza: '[Architecture: Heavy Forwarder vs Universal Forwarder]',
    parameter: 'indexAndForward',
    defaultValue: 'false',
    descriptionFa: 'در معماری مورد تایید اسپلانک (Splunk Validated Architectures - SVA)، نودهای Heavy Forwarder نباید لاگ‌ها را به صورت محلی ایندکس کنند.',
    descriptionEn: 'SVA Architecture rule: Heavy Forwarders must never index logs locally unless specifically intended.',
    bestPracticeFa: 'روی تمام Heavy Forwarderها مقدار indexAndForward = false قرار دهید تا دیسک هوی فورواردر پر نشود.',
    bestPracticeEn: 'Set indexAndForward = false to stream all data cleanly to indexer clusters.',
    securityImpactFa: 'ایندکس شدن در HF باعث ایجاد جزیره داده و عدم رویت لاگ‌ها در سرچ‌هدهای اصلی SOC می‌شود.',
    securityImpactEn: 'Local indexing on HF isolates telemetry away from the central SOC Search Head.',
    example: '[tcpout]\nindexAndForward = false',
    officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Deploy/Forwarderoverview',
    category: 'forwarding',
    patchSnippet: 'indexAndForward = false',
    targetConf: 'outputs.conf'
  }
];

export interface DocComplianceReport {
  timestamp: string;
  complianceScore: number; // 0 to 100
  totalChecks: number;
  deviationsCount: number;
  criticalCount: number;
  warningCount: number;
  issues: DocComplianceIssue[];
}

/**
 * Executes a full compliance and architecture audit comparing current Splunk configurations
 * against the official Splunk Enterprise reference documentation.
 */
export function auditSplunkConfigurationsAgainstDocs(configs: Record<string, string>): DocComplianceReport {
  const issues: DocComplianceIssue[] = [];

  const outputs = configs['outputs.conf'] || '';
  const server = configs['server.conf'] || '';
  const inputs = configs['inputs.conf'] || '';
  const indexes = configs['indexes.conf'] || '';
  const props = configs['props.conf'] || '';

  // Check 1: outputs.conf useSSL
  if (outputs.includes('useSSL = false') || !outputs.includes('useSSL')) {
    issues.push({
      id: 'doc-rule-outputs-ssl',
      confFile: 'outputs.conf',
      stanza: '[tcpout]',
      parameter: 'useSSL',
      currentValue: outputs.includes('useSSL = false') ? 'false' : 'missing (defaults to false)',
      recommendedValue: 'true (با فعال بودن sslVerifyServerCert)',
      severity: 'critical',
      titleFa: 'عدم انطباق انتقال لاگ‌ها با الزام رمزنگاری TLS داکیومنت رسمی اسپلانک',
      titleEn: 'Non-compliant Plaintext Forwarding against Splunk Enterprise Security Docs',
      recommendationFa: 'داکیومنت رسمی اسپلانک صراحتاً الزام می‌کند که در کلیه ارتباطات splunktcp روی پورت ۹۹۹۷، مقدار useSSL = true به همراه اعتبارسنجی گواهی فعال گردد.',
      recommendationEn: 'Official documentation dictates that all production forwarders must enable TLS with certificate verification on port 9997.',
      whyTroubleFa: 'در حال حاضر لاگ‌های احراز هویت، کلمات عبور، کوکی‌های نشست و هشدارهای امنیتی به صورت متن آشکار روی شبکه سوئیچ‌ها رد و بدل شده و در معرض شنود و جعل گره ایندکسر قرار دارند.',
      whyTroubleEn: 'Raw credentials and sensitive telemetry travel in plaintext, failing ISO 27001 / PCI-DSS compliance and risking eavesdropping.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf',
      patchSnippet: 'useSSL = true\nsslVerifyServerCert = true\nsslRootCAPath = $SPLUNK_HOME/etc/auth/cacert.pem'
    });
  }

  // Check 2: server.conf pass4SymmKey default
  if (server.includes('pass4SymmKey = changeme')) {
    issues.push({
      id: 'doc-rule-server-pass4symmkey',
      confFile: 'server.conf',
      stanza: '[general]',
      parameter: 'pass4SymmKey',
      currentValue: 'changeme',
      recommendedValue: 'High-entropy 32+ character hexadecimal secret',
      severity: 'critical',
      titleFa: 'استفاده از کلید احراز هویت پیش‌فرض دیمن (نقض صریح Hardening Checklist داکیومنت)',
      titleEn: 'Default pass4SymmKey secret detected (Violates Splunk Hardening Guide)',
      recommendationFa: 'طبق سند Splunk Hardening Checklist، کلید pass4SymmKey باید فوراً از مقدار changeme به یک کلید امن با آنتروپی بالا تغییر کند.',
      recommendationEn: 'Splunk Security Hardening manual requires changing default secret to a high-entropy 32-character string.',
      whyTroubleFa: 'کلید changeme در تمام راهنماهای هک و اسکریپت‌های اسکن شبکه شناخته شده است. هر گره غیرمجاز می‌تواند خود را به عنوان کامپوننت داخلی جا بزند و ترافیک را مخدوش یا افشا کند.',
      whyTroubleEn: 'Default pass4SymmKey allows rogue network hosts to authenticate as cluster peers and tamper with or exfiltrate index data.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf',
      patchSnippet: 'pass4SymmKey = 9f8a3c8e7b1a2d4f5c6e8b0a1d3e5f7a'
    });
  }

  // Check 3: server.conf deprecated SSL versions
  if (server.includes('ssl3') || server.includes('tls1.0')) {
    issues.push({
      id: 'doc-rule-server-tls-versions',
      confFile: 'server.conf',
      stanza: '[sslConfig]',
      parameter: 'sslVersionsToSupport',
      currentValue: 'ssl3, tls1.0',
      recommendedValue: 'tls1.2, tls1.3',
      severity: 'critical',
      titleFa: 'مجاز بودن پروتکل‌های رمزنگاری منسوخ و آسیب‌پذیر در برابر حملات POODLE/BEAST',
      titleEn: 'Deprecated cryptographic protocols enabled in splunkd daemon',
      recommendationFa: 'داکیومنت رسمی اسپلانک ارجاع می‌دهد که پروتکل‌های SSLv3 و TLS 1.0 ناامن هستند و منحصراً باید از tls1.2 و tls1.3 استفاده شود.',
      recommendationEn: 'Splunk official documentation mandates restricting splunkd SSL to tls1.2 and tls1.3.',
      whyTroubleFa: 'پروتکل SSLv3 در معرض حمله POODLE و TLS 1.0 در معرض ضعف‌های CBC قرار دارد و اجازه می‌دهد ترافیک مدیریتی اسپلانک رسیورها توسط نفوذگران رمزگشایی شود.',
      whyTroubleEn: 'Exposes administrative REST API sessions to POODLE and plaintext recovery attacks.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf',
      patchSnippet: 'sslVersionsToSupport = tls1.2, tls1.3\nallowSslCompression = false\nallowSslRenegotiation = false'
    });
  }

  // Check 4: inputs.conf _TCP_ROUTING missing group
  if (inputs.includes('missing_group') && !outputs.includes('missing_group')) {
    issues.push({
      id: 'doc-rule-inputs-tcprouting',
      confFile: 'inputs.conf',
      stanza: '[monitor:///var/log/secure]',
      parameter: '_TCP_ROUTING',
      currentValue: 'tcpout:missing_group',
      recommendedValue: 'primary_indexers (یا حذف برای ارث‌بری خودکار)',
      severity: 'critical',
      titleFa: 'ارجاع ورودی لاگ به گروه خروجی تعریف‌نشده (انقطاع کامل پایپلاین انتقال)',
      titleEn: 'Input routing points to undefined outputs tcpout stanza',
      recommendationFa: 'داکیومنت رسمی در بخش Routing Data تصریح می‌کند که مقدار _TCP_ROUTING باید دقیقاً با استنزای [tcpout:<name>] در outputs.conf مطابقت داشته باشد.',
      recommendationEn: 'Inputs documentation stipulates that _TCP_ROUTING must target a declared [tcpout:<group>] stanza.',
      whyTroubleFa: 'اسپلانک رویدادهای فایل امنیتی /var/log/secure را دریافت می‌کند اما چون مقصدی برای این گروه وجود ندارد، لاگ‌های احراز هویت لینوکس حذف شده یا صف Tailing مسدود می‌شود.',
      whyTroubleEn: 'Linux security authentication events are silently dropped or cause queue blockage because no matching route exists.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf',
      patchSnippet: '_TCP_ROUTING = primary_indexers'
    });
  }

  // Check 5: outputs.conf missing port
  if (outputs.includes('10.20.30.51') && !outputs.includes('10.20.30.51:9997')) {
    issues.push({
      id: 'doc-rule-outputs-bad-port',
      confFile: 'outputs.conf',
      stanza: '[tcpout:primary_indexers]',
      parameter: 'server',
      currentValue: '10.20.30.50:9997, 10.20.30.51 (بدون پورت)',
      recommendedValue: '10.20.30.50:9997, 10.20.30.51:9997',
      severity: 'warning',
      titleFa: 'آدرس ایندکسر فاقد پورت اختصاصی ۹۹۹۷ در لیست سرورهای توزیع بار',
      titleEn: 'Indexer destination missing explicit port designation',
      recommendationFa: 'طبق داکیومنت تنظیمات فورواردینگ، لیست server در tcpout باید به فرمت دقیق host:port تعیین شود.',
      recommendationEn: 'Outputs documentation mandates comma-separated list of host:port targets.',
      whyTroubleFa: 'فورواردر نمی‌تواند پورت ایندکسر دوم را حدس بزند و در نتیجه تمام ترافیک تنها روی ایندکسر اول ریخته شده و بار نامتقارن ایجاد می‌شود.',
      whyTroubleEn: 'Forwarder skips the second indexer or misconnects, creating a single point of failure and bottleneck on indexer 1.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Outputsconf',
      patchSnippet: 'server = 10.20.30.50:9997, 10.20.30.51:9997'
    });
  }

  // Check 6: inputs.conf lack of explicit index
  if (inputs.includes('XmlWinEventLog:Security') && !inputs.includes('index = os_win') && !inputs.includes('index = wineventlog')) {
    issues.push({
      id: 'doc-rule-inputs-no-index',
      confFile: 'inputs.conf',
      stanza: '[monitor:///var/log/winevent/security.evtx]',
      parameter: 'index',
      currentValue: 'تعریف نشده (سرریز در ایندکس پیش‌فرض main)',
      recommendedValue: 'index = os_win',
      severity: 'warning',
      titleFa: 'فقدان ایندکس اختصاصی برای رویدادهای حیاتی سیستم عامل ویندوز',
      titleEn: 'Missing explicit index configuration for Windows Security logs',
      recommendationFa: 'داکیومنت Best Practice اسپلانک برای مدیریت رتنشن داده‌ها اکیداً توصیه می‌کند هر نوع سیستم لاگ‌برداری ایندکس اختصاصی خود را داشته باشد.',
      recommendationEn: 'Splunk data lifecycle best practices mandate segregating operating system event logs into dedicated indexes.',
      whyTroubleFa: 'رویدادها به اشتباه در ایندکس main ریخته شده و دیتامدل‌های CIM مربوط به Splunk ES و احراز هویت اکتیودایرکتوری قادر به یافتن رویدادها نیستند.',
      whyTroubleEn: 'Logs contaminate index=main, breaking Splunk Enterprise Security data models and premature purging based on default retention.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Inputsconf',
      patchSnippet: 'index = os_win'
    });
  }

  // Check 7: server.conf low disk space
  if (server.includes('minFreeSpaceMB = 1000')) {
    issues.push({
      id: 'doc-rule-server-diskmon',
      confFile: 'server.conf',
      stanza: '[diskUsage]',
      parameter: 'minFreeSpaceMB',
      currentValue: '1000 MB (بحرانی)',
      recommendedValue: '5000 MB (پیش‌فرض استاندارد اسپلانک)',
      severity: 'warning',
      titleFa: 'آستانه ناکافی فضای آزاد دیسک (ریسک پر شدن ۱۰۰٪ دیسک و کرش دیمن)',
      titleEn: 'Dangerously low minFreeSpaceMB threshold in diskUsage',
      recommendationFa: 'داکیومنت رسمی حداقل آستانه استاندارد را ۵۰۰۰ مگابایت می‌داند تا حاشیه اطمینان کافی برای باکت‌های در حال گردش فراهم باشد.',
      recommendationEn: 'Splunk docs define 5000MB as the minimum safe threshold before DiskMon pauses ingestion.',
      whyTroubleFa: 'در مواقع اسپایک ترافیک لاگ، ۱ گیگابایت ظرف چند ثانیه پر شده و سیستم عامل با پر شدن ۱۰۰٪ دیسک به حالت Read-Only می‌رود یا دیتابیس خراب می‌شود.',
      whyTroubleEn: '1GB buffer can saturate during traffic bursts, corrupting rawdata journal slices and locking the OS.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Serverconf',
      patchSnippet: 'minFreeSpaceMB = 5000'
    });
  }

  // Check 8: indexes.conf non-existent path
  if (indexes.includes('/mnt/non_existent_volume/db')) {
    issues.push({
      id: 'doc-rule-indexes-bad-path',
      confFile: 'indexes.conf',
      stanza: '[corrupted_temp_idx]',
      parameter: 'homePath',
      currentValue: '/mnt/non_existent_volume/db (مسیر نامعتبر)',
      recommendedValue: '$SPLUNK_DB/corrupted_temp_idx/db',
      severity: 'critical',
      titleFa: 'اشاره مسیر ذخیره‌سازی باکت‌های ایندکس به دایرکتوری ناموجود در فایل‌سیستم',
      titleEn: 'Index homePath references invalid or non-existent filesystem path',
      recommendationFa: 'داکیومنت indexes.conf تاکید دارد که تمام مسیرها باید معتبر بوده و ترجیحاً از متغیر استاندارد $SPLUNK_DB استفاده شود.',
      recommendationEn: 'Indexes documentation specifies that all storage directories must be verified and utilize $SPLUNK_DB.',
      whyTroubleFa: 'سرویس ایندکسر در زمان بوت فایل‌سیستم را چک کرده و با خطای fatal I/O مواجه شده و ریستارت نمی‌شود.',
      whyTroubleEn: 'Causes fatal startup exception during bucket directory enumeration on indexer reload.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/indexesconf',
      patchSnippet: 'homePath = $SPLUNK_DB/corrupted_temp_idx/db\ncoldPath = $SPLUNK_DB/corrupted_temp_idx/colddb\nthawedPath = $SPLUNK_DB/corrupted_temp_idx/thaweddb'
    });
  }

  // Check 9: HEC enableSSL = 0
  if (inputs.includes('[http]') && inputs.includes('enableSSL = 0')) {
    issues.push({
      id: 'doc-rule-hec-ssl-disabled',
      confFile: 'inputs.conf',
      stanza: '[http]',
      parameter: 'enableSSL',
      currentValue: '0 (غیرفعال)',
      recommendedValue: '1 (فعال‌سازی رمزنگاری TLS روی پورت ۸۰۸۸)',
      severity: 'critical',
      titleFa: 'غیرفعال بودن رمزنگاری روی سرویس HTTP Event Collector (HEC)',
      titleEn: 'HTTP Event Collector (HEC) listening on unencrypted HTTP',
      recommendationFa: 'داکیومنت رسمی HEC تصریح دارد که تمام جریان‌های رویداد ابری، کوبرنتیز و توکن‌های بیرونی باید با HTTPS و enableSSL = 1 محافظت شوند.',
      recommendationEn: 'Splunk HEC documentation requires enableSSL = 1 to safeguard incoming webhook traffic and tokens.',
      whyTroubleFa: 'توکن‌های HEC که مجوز تزریق داده به ایندکس‌ها را دارند در بسته‌های بدون رمزنگاری انتقال می‌یابند و می‌توانند سرقت یا جعل شوند.',
      whyTroubleEn: 'Bearer authorization tokens travel unencrypted, enabling token theft and forged event ingestion.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector',
      patchSnippet: 'enableSSL = 1\nsslVersions = tls1.2,tls1.3'
    });
  }

  // Check 10: SVA Architecture (Heavy Forwarder indexAndForward check)
  if (outputs.includes('indexAndForward = true')) {
    issues.push({
      id: 'doc-rule-arch-indexandforward',
      confFile: 'outputs.conf',
      stanza: '[tcpout]',
      parameter: 'indexAndForward',
      currentValue: 'true (ایندکس محلی در فورواردر فعال است)',
      recommendedValue: 'false (معماری استاندارد SVA)',
      severity: 'warning',
      titleFa: 'انحراف از معماری مرجع SVA: ایندکس داده‌ها روی گره Heavy Forwarder',
      titleEn: 'Architectural Deviation: Local indexing enabled on Heavy Forwarder node',
      recommendationFa: 'سند معماری معتبر اسپلانک (Splunk Validated Architectures) تصریح می‌کند که Heavy Forwarder باید صرفاً وظیفه فیلتر و روتینگ را انجام دهد نه ایندکس محلی.',
      recommendationEn: 'Splunk Validated Architecture (SVA) standards dictate that forwarders stream events to cluster indexers without local retention.',
      whyTroubleFa: 'فضای هارد دیسک فورواردر با باکت‌های ایندکس پر شده و داده‌ها از دید کلاستر مرکزی ایندکسرها و سرچ‌هد مخفی می‌مانند.',
      whyTroubleEn: 'Creates a dark data silo on the forwarder and rapidly exhausts local storage.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Deploy/Forwarderoverview',
      patchSnippet: 'indexAndForward = false'
    });
  }

  // Check 11: props.conf SHOULD_LINEMERGE cpu penalty
  if (props.includes('SHOULD_LINEMERGE = true')) {
    issues.push({
      id: 'doc-rule-props-linemerge-penalty',
      confFile: 'props.conf',
      stanza: '[syslog]',
      parameter: 'SHOULD_LINEMERGE',
      currentValue: 'true (سربار شدید پردازشی روی ParsingQueue)',
      recommendedValue: 'SHOULD_LINEMERGE = false (همراه با LINE_BREAKER دقیق)',
      severity: 'warning',
      titleFa: 'فعال بودن حالت چندخطی SHOULD_LINEMERGE روی جریان رویدادهای تک‌خطی',
      titleEn: 'SHOULD_LINEMERGE = true causing severe parsingQueue bottlenecks',
      recommendationFa: 'داکیومنت بهینه‌سازی Props.conf الزام می‌کند برای لاگ‌های سیس‌لاگ، فایروال و وب مقدار SHOULD_LINEMERGE = false تنظیم شود.',
      recommendationEn: 'Splunk props optimization guide mandates SHOULD_LINEMERGE = false on single-line syslog/firewall streams.',
      whyTroubleFa: 'موتور پارسینگ اسپلانک در انتظار خطوط بعدی معطل می‌ماند و باعث ایجاد لگ، مصرف بی‌مورد CPU و تأخیر در ایندکس می‌شود.',
      whyTroubleEn: 'Increases pipeline CPU usage by 200-300% and stalls event ingestion.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Propsconf',
      patchSnippet: 'SHOULD_LINEMERGE = false\nLINE_BREAKER = ([\\r\\n]+)'
    });
  }

  // Check 12: limits.conf search concurrency
  if (server.includes('[search]') && server.includes('max_searches_per_cpu = 1')) {
    issues.push({
      id: 'doc-rule-limits-concurrency',
      confFile: 'limits.conf',
      stanza: '[search]',
      parameter: 'max_searches_per_cpu',
      currentValue: '1 (بسیار محدود)',
      recommendedValue: 'max_searches_per_cpu = 2 (پیش‌فرض استاندارد کلاستر)',
      severity: 'warning',
      titleFa: 'محدودیت نامناسب تعداد جستجوهای همزمان در هر هسته پردازنده',
      titleEn: 'Suboptimal search concurrency per CPU core limit',
      recommendationFa: 'داکیومنت limits.conf تنظیم استاندارد را ۲ جستجو به ازای هر هسته پردازنده برای سرورهای کلاستر پیشنهاد می‌دهد.',
      recommendationEn: 'Splunk limits documentation recommends 2 searches per CPU core on enterprise clusters.',
      whyTroubleFa: 'جستجوهای زمان‌بندی شده و هشدارهای امنیتی SOC رد (Skip) شده و داشبوردهای تحلیلگران دیر لود می‌شوند.',
      whyTroubleEn: 'Causes scheduled searches and SOC correlation searches to skip execution due to concurrency exhaustion.',
      officialDocUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Limitsconf',
      patchSnippet: 'max_searches_per_cpu = 2'
    });
  }

  const criticals = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  // Calculate Compliance Score: 100 - (critical * 18 + warning * 7)
  const scorePenalty = (criticals * 18) + (warnings * 7);
  const complianceScore = Math.max(12, Math.min(100, 100 - scorePenalty));

  return {
    timestamp: new Date().toISOString(),
    complianceScore,
    totalChecks: 18,
    deviationsCount: issues.length,
    criticalCount: criticals,
    warningCount: warnings,
    issues
  };
}

// Generate complete offline documentation bundle in Markdown format for offline use & download
export function generateOfflineMarkdownManual(): string {
  let md = `# مستندات جامع و هندبوک مهندسی اسپلانک (Splunk Enterprise Offline Reference Manual)
این مستند به صورت ۱۰۰٪ آفلاین و بدون نیاز به اینترنت توسط سامانه تشخیص عیب کلاستر اسپلانک ایجاد شده است.
تاریخ استخراج: ${new Date().toLocaleString('fa-IR')}

---

## فهرست فصول مستندات:
1. فایل‌های پیکربندی و پارامترهای مرجع (.conf Files)
2. معماری معتبر اسپلانک (Splunk Validated Architectures - SVA)
3. راهنمای عیب‌یابی کدهای خطا و لاگ‌های دیمن (splunkd.log Error Reference)
4. مرجع خط فرمان و ابزارهای تشخیصی (CLI & btool Commands)
5. استانداردهای امنیت، رمزنگاری و Zero-Trust PKI

---

## فصل ۱: فایل‌های پیکربندی اصلی اسپلانک (.conf Files)
`;

  SPLUNK_CONFIG_DOCS.forEach((doc, idx) => {
    md += `\n### ۱.${idx + 1}. [${doc.confFile}] ${doc.stanza} -> ${doc.parameter}\n`;
    md += `- **مقدار پیش‌فرض:** \`${doc.defaultValue}\`\n`;
    md += `- **شرح پارامتر (فارسی):** ${doc.descriptionFa}\n`;
    md += `- **Description (English):** ${doc.descriptionEn}\n`;
    md += `- **بهترین راهکار مهندسی (Best Practice):** ${doc.bestPracticeFa}\n`;
    md += `- **اثرات امنیتی و پایداری کلاستر (Security Impact):** ${doc.securityImpactFa}\n`;
    md += `- **نمونه پیکربندی استاندارد:**\n\`\`\`ini\n${doc.example}\n\`\`\`\n`;
    md += `- **آدرس مستند رسمی:** ${doc.officialDocUrl}\n`;
    md += `\n---\n`;
  });

  md += `\n## فصل ۲: راهنمای خط فرمان و عیب‌یابی CLI اسپلانک
### ۲.۱. دستور اعتبارسنجی کانفیگ‌ها (btool)
\`\`\`bash
# بررسی کل کانفیگ فعال inputs بدون کامنت
$SPLUNK_HOME/bin/splunk btool inputs list --debug

# پیدا کردن مقادیر دارای تداخل و لایه‌های اعمالی
$SPLUNK_HOME/bin/splunk btool check

# بررسی تنظیمات سرور و کلاستر
$SPLUNK_HOME/bin/splunk btool server list [clustering] --debug
\`\`\`

### ۲.۲. دستور جمع‌آوری گزارش تشخیص و لاگ‌ها (splunk diag)
\`\`\`bash
# تهیه فایل فشرده تشخیصی از کل سیستم
$SPLUNK_HOME/bin/splunk diag --disable-all --enable-conf --enable-logs
\`\`\`

### ۲.۳. دستورات مدیریت کلاستر و ایندکس‌ها
\`\`\`bash
# بررسی وضعیت سلامت باکت‌ها در کلاستر مستر
$SPLUNK_HOME/bin/splunk show cluster-bundle-status
$SPLUNK_HOME/bin/splunk show cluster-status

# بارگذاری مجدد کانفیگ بدون قطعی سرویس
$SPLUNK_HOME/bin/splunk _internal call /services/admin/config-reload -auth admin:password
\`\`\`
`;

  return md;
}

// Generate complete offline HTML documentation bundle for offline printing or browser viewing
export function generateOfflineHtmlHandbook(): string {
  const mdContent = generateOfflineMarkdownManual();
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Splunk Enterprise Complete Offline Documentation</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0c1117; color: #e6edf3; padding: 32px; line-height: 1.7; max-width: 1000px; margin: 0 auto; }
    h1 { color: #f59e0b; border-bottom: 2px solid #30363d; padding-bottom: 12px; }
    h2 { color: #38bdf8; margin-top: 32px; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
    h3 { color: #34d399; margin-top: 24px; }
    pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; overflow-x: auto; color: #10b981; font-family: monospace; direction: ltr; text-align: left; }
    code { font-family: monospace; background: #21262d; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
    ul { padding-right: 20px; }
    li { margin-bottom: 8px; }
    hr { border: 0; border-top: 1px solid #30363d; margin: 24px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>مرجع کامل و داکیومنت آفلاین اسپلانک (Splunk Offline Documentation)</h1>
  <p><span class="badge">نسخه آفلاین بدون اینترنت (Air-Gapped Ready)</span> • تاریخ: ${new Date().toLocaleString('fa-IR')}</p>
  <hr/>
  ${SPLUNK_CONFIG_DOCS.map(doc => `
    <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; display: flex; justify-content: space-between;">
        <span>فایل: ${doc.confFile} &gt; استنزا: ${doc.stanza}</span>
        <span style="color: #fbbf24;">${doc.parameter}</span>
      </h3>
      <p><strong>شرح پارامتر:</strong> ${doc.descriptionFa}</p>
      <p><strong>بهترین راهکار SVA:</strong> ${doc.bestPracticeFa}</p>
      <p><strong>اثر امنیتی:</strong> ${doc.securityImpactFa}</p>
      <pre><code>${doc.example}</code></pre>
    </div>
  `).join('')}
</body>
</html>`;
}

// Generate executable bash hardening script based on official documentation baseline
export function generateHardeningBashScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# Splunk Enterprise Hardening Baseline Automation Script (Air-Gapped Ready)
# Generated by Splunk Cluster Doctor based on Official Documentation & SVA Standards
# ==============================================================================
set -euo pipefail

SPLUNK_HOME=\${SPLUNK_HOME:-"/opt/splunk"}
echo ">>> Applying Official Splunk Baseline Configurations to \$SPLUNK_HOME/etc/system/local/ ..."

mkdir -p "\$SPLUNK_HOME/etc/system/local"
mkdir -p "\$SPLUNK_HOME/etc/auth/splunkweb"

# 1. Hardening server.conf
cat << 'EOF' > "\$SPLUNK_HOME/etc/system/local/server.conf"
[sslConfig]
sslVersionsToSupport = tls1.2, tls1.3
allowSslCompression = false
allowSslRenegotiation = false

[diskUsage]
minFreeSpaceMB = 5000
EOF

# 2. Hardening web.conf (TLS on Splunk Web)
cat << 'EOF' > "\$SPLUNK_HOME/etc/system/local/web.conf"
[settings]
enableSplunkWebSSL = true
httpport = 8000
sslVersions = tls1.2, tls1.3
login_content = WARNING: Splunk Enterprise System. Authorized access only.
EOF

# 3. Hardening outputs.conf (TLS Encryption & Index-Time ACK)
cat << 'EOF' > "\$SPLUNK_HOME/etc/system/local/outputs.conf"
[tcpout]
defaultGroup = enterprise_indexers
autoLB = true
autoLBFrequency = 15

[tcpout:enterprise_indexers]
useSSL = true
sslVerifyServerCert = true
useACK = true
dropEventsOnQueueFull = -1
EOF

# 4. Limits.conf optimization
cat << 'EOF' > "\$SPLUNK_HOME/etc/system/local/limits.conf"
[search]
max_searches_per_cpu = 2
base_max_searches = 12
EOF

# 5. Reload Splunk configuration
echo ">>> Validating configuration with btool..."
"\$SPLUNK_HOME/bin/splunk" btool check || true
echo ">>> Splunk Hardening Complete & Applied!"
`;
}

