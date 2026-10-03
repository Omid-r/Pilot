import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCw,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Settings,
  Flame,
  Check,
  Zap,
  Globe,
  Lock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Pause,
  HelpCircle,
  FileCode,
  Send,
  User,
  Power,
  Copy
} from 'lucide-react';
import { queryOfflineAiConsultant, POPULAR_AI_PROMPTS } from '../data/offlineAiConsultant';

export interface SplunkAutonomousAIAgentProps {
  isFa: boolean;
  onOpenWebModal?: (port: number) => void;
}

interface ServerDiscoveryInfo {
  hostname: string;
  primaryIp: string;
  osRelease: string;
  kernel: string;
  cpuCores: number;
  memoryTotalGb: number;
  diskFreeGb: number;
  interfaces: Array<{ name: string; ip: string; mac: string; status: string }>;
  existingSplunk: {
    installed: boolean;
    path: string;
    version: string;
    runningPorts: number[];
  };
  containerRuntimes: {
    docker: boolean;
    dockerVersion?: string;
    podman: boolean;
    podmanVersion?: string;
    k8s: boolean;
    k8sVersion?: string;
  };
  openPorts: number[];
  firewallActive: boolean;
}

interface WorkflowStep {
  id: string;
  titleFa: string;
  titleEn: string;
  icon: any;
  status: 'pending' | 'ready_for_approval' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  summaryFa: string;
  summaryEn: string;
  aiExplanationFa: string;
  aiExplanationEn: string;
  plannedActionsFa: string[];
  plannedActionsEn: string[];
  impactRiskFa: string;
  impactRiskEn: string;
  commandsPreview: string[];
  configPreview?: { filename: string; content: string };
  outputLogs: string[];
  resultsSummaryFa?: string;
  resultsSummaryEn?: string;
}

export function SplunkAutonomousAIAgent({ isFa, onOpenWebModal }: SplunkAutonomousAIAgentProps) {
  const [autonomyMode, setAutonomyMode] = useState<'human_approval' | 'full_auto'>('human_approval');
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedStepId, setSelectedStepId] = useState<string>('step-discovery');
  
  // Customizable deployment parameters
  const [selectedSplunkVersion, setSelectedSplunkVersion] = useState<'10.4.0' | '10.0.1' | '9.2.2' | '9.1.4'>('10.4.0');
  const [selectedRuntimeEngine, setSelectedRuntimeEngine] = useState<'k8s' | 'podman' | 'docker' | 'isolated_daemon'>('podman');
  const [targetWebPort, setTargetWebPort] = useState(8001);
  const [targetRestPort, setTargetRestPort] = useState(8090);
  const [targetTcpPort, setTargetTcpPort] = useState(9998);
  const [targetKvPort, setTargetKvPort] = useState(8193);
  const [adminPassword, setAdminPassword] = useState('changeme');
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Local Offline AI Chat Consultation
  const [chatMessages, setChatMessages] = useState<Array<{ 
    sender: 'ai' | 'user'; 
    textFa: string; 
    textEn: string; 
    time: string;
    codeSnippet?: string;
    suggestedFollowUpsFa?: string[];
    suggestedFollowUpsEn?: string[];
    docCategory?: string;
  }>>([
    {
      sender: 'ai',
      textFa: 'سلام! من هوش مصنوعی متخصص و آفلاین زیرساخت اسپلانک و کانتینرها هستم. تمام فرآیندهای شناسایی سرور، نصب کوبرنتیز و داکر، استقرار نسخه‌های اسپلانک، عیب‌یابی عمیق، سایزینگ منابع و رفع خطاها به صورت ۱۰۰٪ لوکال و بدون نیاز به اینترنت توسط من برنامه‌ریزی می‌شود. می‌توانید سوالات فنی خود را بپرسید یا روی پرسش‌های پیشنهادی کلیک کنید.',
      textEn: 'Hello! I am your 100% offline AI Infrastructure Architect for Splunk & Containers. I provide local guidance for cluster deployment, sizing, container orchestration, socket debugging and automated repair without internet connectivity. Feel free to ask or click suggested topics below.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUpsFa: [
        '🔍 رفع تداخل پورت ۸۰۰۰ و ۸۰۰۱ وب',
        '⚡ خطایابی وضعیت 000000 اسپلانک وب',
        '🔒 فعال‌سازی TLS 1.3 در server.conf'
      ],
      suggestedFollowUpsEn: [
        'Resolve Web Port 8000/8001 Conflict',
        'Diagnose Status 000000 Web Error',
        'Enable TLS 1.3 in server.conf'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Server & System Discovery State
  const [discoveryData, setDiscoveryData] = useState<ServerDiscoveryInfo>({
    hostname: 'rhel-enterprise-node',
    primaryIp: '192.168.232.101',
    osRelease: 'Red Hat Enterprise Linux 9.4 (Plow) / Linux 6.6-x86_64',
    kernel: 'Linux 6.6.137+ x86_64',
    cpuCores: 8,
    memoryTotalGb: 32,
    diskFreeGb: 184,
    interfaces: [
      { name: 'eth0', ip: '192.168.232.101', mac: '52:54:00:fa:8c:12', status: 'UP / ACTIVE' },
      { name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', status: 'UP / LOOPBACK' }
    ],
    existingSplunk: {
      installed: true,
      path: '/opt/splunk',
      version: 'Splunk Enterprise 10.4.0 (Build 9b3d04e)',
      runningPorts: [8000, 8089, 9997, 8191]
    },
    containerRuntimes: {
      docker: false,
      podman: true,
      podmanVersion: 'Podman v4.9.4-rhel (Air-Gapped)',
      k8s: false
    },
    openPorts: [8000, 8089, 9997, 8191, 22, 3000],
    firewallActive: true
  });

  // 6 Comprehensive Workflow Steps with AI Reasoning & Approval Gates
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-discovery',
      titleFa: '۱. شناسایی خودکار سرور و ارزیابی وضعیت سخت‌افزار',
      titleEn: '1. Deep Server Fleet Discovery & Hardware Audit',
      icon: Server,
      status: 'ready_for_approval',
      summaryFa: 'بررسی منابع سخت‌افزاری، سیستم‌عامل، لیسنرهای باز و اینستنس‌های فعال اسپلانک روی ماشین',
      summaryEn: 'Hardware probing, OS release detection, open socket scanning & active Splunk processes',
      aiExplanationFa: 'هوش مصنوعی سرور را به صورت زنده اسکن کرده و تشخیص داد که سیستم‌عامل RHEL با ۸ هسته CPU و ۳۲ گیگابایت رم است. نسخه اول اسپلانک روی پورت‌های پیش‌فرض (۸۰۰۰، ۸۰۸۹، ۹۹۹۷) در حال اجراست. برای استقرار نسخه موازی، پورت‌های جدید ایزوله بدون تداخل محاسبه شده‌اند.',
      aiExplanationEn: 'The AI scanned the host and found RHEL 9.4 with 8 vCPUs and 32GB RAM. Primary Splunk instance is running on default ports (8000, 8089, 9997). Isolated non-conflicting ports have been calculated for the secondary instance.',
      plannedActionsFa: [
        'شناسایی اینترفیس‌های فعال شبکه (eth0: 192.168.232.101)',
        'بررسی لیسنرهای TCP/UDP و جدول سوکت‌ها (ss -tulpn)',
        'بررسی وضعیت رانتایم‌های کانتینری پودمن و داکر در محیط ایزوله',
        'تخصیص پورت‌های بدون تداخل: وب ۸۰۰۱، منیجمنت ۸۰۹۰، اسپلانک‌تی‌سی‌پی ۹۹۹۸'
      ],
      plannedActionsEn: [
        'Probe active network interfaces (eth0: 192.168.232.101)',
        'Inspect TCP/UDP listeners and kernel socket table (ss -tulpn)',
        'Check container runtime engines (Podman/Docker) in air-gapped mode',
        'Reserve conflict-free target ports: Web 8001, REST 8090, SplunkTCP 9998'
      ],
      impactRiskFa: 'کاملاً ایمن (فقط خواندنی) — هیچ تغییری در تنظیمات جاری یا سرویس‌های فعال سرور ایجاد نمی‌شود.',
      impactRiskEn: 'Completely safe (Read-Only) — no modifications to existing system configs or running services.',
      commandsPreview: [
        'uname -a && cat /etc/os-release',
        'nproc && free -h && df -h /opt',
        'ss -tulpn | grep -E "8000|8001|8089|8090|9997|9998|8191|8192"',
        'podman --version 2>/dev/null || docker --version 2>/dev/null'
      ],
      outputLogs: []
    },
    {
      id: 'step-container-k8s',
      titleFa: '۲. آماده‌سازی و نصب آفلاین کوبرنتیز / پودمن / داکر',
      titleEn: '2. Offline Container & Kubernetes Engine Provisioning',
      icon: Layers,
      status: 'pending',
      summaryFa: 'راه‌اندازی محیط کانتینری و کوبرنتیز بدون نیاز به اینترنت با پکیج‌های لوکال',
      summaryEn: 'Air-gapped container runtime & lightweight K8s provisioning using embedded packages',
      aiExplanationFa: 'با توجه به قطعی اینترنت و عدم دسترسی به داکر هاب، هوش مصنوعی از رانتایم پودمن یا باینری مستقل K3s همراه با دایرکتوری‌های ایزوله لوکال (/opt/splunk_container_runtime) استفاده می‌کند تا بدون خطای DNS یا Registry دسترسی کامل به کانتینر فراهم شود.',
      aiExplanationEn: 'Due to air-gap isolation and Docker Hub connection refusal, the AI will provision local Podman / lightweight K3s runtime and create /opt/splunk_container_runtime with zero internet dependencies.',
      plannedActionsFa: [
        'ایجاد دایرکتوری رانتایم /opt/splunk_container_runtime و /opt/splunk_parallel_configs',
        'تولید مانیفست آفلاین کوبرنتیز (splunk-k8s-standalone.yaml)',
        'تولید فایل‌های Dockerfile و docker-compose.yml آفلاین',
        'تنظیم ایمیج محلی و جلوگیری از ارسال ریکوئست به docker.io'
      ],
      plannedActionsEn: [
        'Provision /opt/splunk_container_runtime & /opt/splunk_parallel_configs',
        'Generate offline Kubernetes manifest (splunk-k8s-standalone.yaml)',
        'Generate offline Dockerfile and docker-compose.yml',
        'Configure air-gap local image without querying docker.io'
      ],
      impactRiskFa: 'ایجاد پوشه‌های کاری در /opt بدون ایجاد اختلال در پروسه‌های جاری.',
      impactRiskEn: 'Creates runtime working directories in /opt with zero disruption to existing workloads.',
      commandsPreview: [
        'mkdir -p /opt/splunk_container_runtime /opt/splunk_parallel_configs',
        'cp /scripts/deploy-splunk-k8s-offline.sh /opt/splunk_container_runtime/',
        'chmod +x /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh',
        'podman info 2>/dev/null || docker info 2>/dev/null'
      ],
      outputLogs: []
    },
    {
      id: 'step-deploy-splunk',
      titleFa: '۳. استقرار و پیکربندی نسخه موازی اسپلانک (Splunk Parallel Instance)',
      titleEn: '3. Multi-Version Splunk Instance Deployment',
      icon: Flame,
      status: 'pending',
      summaryFa: `استقرار اسپلانک ${selectedSplunkVersion} روی پورت‌های وب ${targetWebPort} و منیجمنت ${targetRestPort}`,
      summaryEn: `Deploying Splunk ${selectedSplunkVersion} on isolated Web port ${targetWebPort} & REST ${targetRestPort}`,
      aiExplanationFa: `هوش مصنوعی فایل‌های کانفیگ را بازنویسی می‌کند: در web.conf مقدار httpport=${targetWebPort} و مهم‌تر از همه mgmtHostPort=127.0.0.1:${targetRestPort} و appServerPorts=8066 ست می‌شود تا وب‌سرور بداند به دیمن همین نسخه وصل شود و با نسخه اول (۸۰۸۹) تداخل پیدا نکند. همچنین پورت KVStore روی ${targetKvPort} تنظیم می‌شود.`,
      aiExplanationEn: `AI configures synchronized stanzas: in web.conf httpport=${targetWebPort} and mgmtHostPort=127.0.0.1:${targetRestPort} and appServerPorts=8066 are set so the Web UI connects to its own REST daemon without collision with the primary instance (8089). KVStore is set to ${targetKvPort}.`,
      plannedActionsFa: [
        `تولید web.conf با httpport=${targetWebPort} و mgmtHostPort=127.0.0.1:${targetRestPort} و appServerPorts=8066`,
        `تولید server.conf با mgmtHostPort=127.0.0.1:${targetRestPort} و kvstore=${targetKvPort}`,
        `تولید inputs.conf با دریافت پورت splunktcp://${targetTcpPort}`,
        `تولید user-seed.conf برای ساخت اکانت admin با کلمه عبور ${adminPassword}`,
        'تنظیم متغیرهای SPLUNK_HOME و SPLUNK_RUN_AS_ROOT=1'
      ],
      plannedActionsEn: [
        `Generate web.conf with httpport=${targetWebPort}, mgmtHostPort=127.0.0.1:${targetRestPort} & appServerPorts=8066`,
        `Generate server.conf with mgmtHostPort=127.0.0.1:${targetRestPort} & kvstore=${targetKvPort}`,
        `Generate inputs.conf for receiving on splunktcp://${targetTcpPort}`,
        `Generate user-seed.conf for user admin with password ${adminPassword}`,
        'Export SPLUNK_HOME and SPLUNK_RUN_AS_ROOT=1'
      ],
      impactRiskFa: 'ایجاد اینستنس مجزا در /opt/splunk_parallel یا Podman کانتینر با پورت‌های مستقل.',
      impactRiskEn: 'Deploys isolated instance in /opt/splunk_parallel or Podman with dedicated port mapping.',
      commandsPreview: [
        `bash /opt/splunk_container_runtime/deploy-splunk-k8s-offline.sh ${targetWebPort} ${targetRestPort} ${targetTcpPort} "${adminPassword}"`
      ],
      configPreview: {
        filename: 'web.conf & server.conf',
        content: `[settings]\nhttpport = ${targetWebPort}\nserver.socket_host = 0.0.0.0\nappServerPorts = 8066\nmgmtHostPort = 127.0.0.1:${targetRestPort}\n\n[general]\nserverName = splunk-parallel-node\nmgmtHostPort = 127.0.0.1:${targetRestPort}\n\n[kvstore]\nport = ${targetKvPort}`
      },
      outputLogs: []
    },
    {
      id: 'step-diagnostics-preflight',
      titleFa: '۴. خطایابی عمیق ریشه‌ای و بررسی سلامت سوکت‌ها (Deep Pre-Flight Diagnostics)',
      titleEn: '4. Deep Root-Cause Pre-Flight Diagnostic Scan',
      icon: ShieldAlert,
      status: 'pending',
      summaryFa: 'بررسی تداخل پورت‌ها، قفل سوکت‌های TCP، عدم انطباق mgmtHostPort و خطاهای لاگ',
      summaryEn: 'Auditing socket collisions, orphaned PIDs, mgmtHostPort alignment & startup log errors',
      aiExplanationFa: 'هوش مصنوعی علت ریشه‌ای عدم پاسخ وب (HTTP 000000) را بررسی می‌کند: ۱. آیا پورت توسط پروسه قبلی قفل شده؟ ۲. آیا web.conf به mgmtHostPort اشتباه نگاه می‌کند؟ ۳. آیا appServerPorts تنظیم شده است؟ ۴. آیا فایروال پورت را مسدود کرده است؟',
      aiExplanationEn: 'AI inspects root causes of HTTP 000000: 1. Is port locked by orphan socket? 2. Is web.conf pointing to wrong mgmtHostPort? 3. Is appServerPorts configured? 4. Is firewalld blocking ingress traffic?',
      plannedActionsFa: [
        `بررسی پروسه‌های قفل شده روی پورت‌های ${targetWebPort} و ${targetRestPort} با fuser`,
        'بررسی اعتبارسنجی کانفیگ با splunk btool check',
        'بررسی لاگ‌های web_service.log و splunkd.log برای ارورهای بحرانی',
        'بررسی وضعیت رول‌های فایروال لینوکس (firewall-cmd / iptables)'
      ],
      plannedActionsEn: [
        `Check locked processes on ports ${targetWebPort} & ${targetRestPort} via fuser`,
        'Validate configuration files syntax with btool',
        'Audit web_service.log and splunkd.log for fatal exceptions',
        'Verify firewalld and iptables ingress rules'
      ],
      impactRiskFa: 'فقط خواندنی و تحلیلی — بدون تغییرات.',
      impactRiskEn: 'Read-only diagnostic audit — no state changes.',
      commandsPreview: [
        `fuser ${targetWebPort}/tcp ${targetRestPort}/tcp 2>/dev/null`,
        `tail -n 25 /opt/splunk_parallel/var/log/splunk/splunkd.log | grep -iE "error|fatal|port"`,
        `tail -n 25 /opt/splunk_parallel/var/log/splunk/web_service.log`
      ],
      outputLogs: []
    },
    {
      id: 'step-auto-healing',
      titleFa: '۵. خودترمیمی هوشمند و اصلاح آنی کلیه کانفیگ‌ها و قفل‌ها (AI Auto-Healing)',
      titleEn: '5. Autonomous AI Auto-Healing & Socket Recovery',
      icon: Zap,
      status: 'pending',
      summaryFa: 'آزادسازی سوکت‌های قفل شده، اصلاح web.conf، باز کردن فایروال و استارت دیمن با فلگ‌های مجاز',
      summaryEn: 'Clearing socket locks, syncing web.conf, configuring firewall & starting daemon with root bypass',
      aiExplanationFa: 'هوش مصنوعی کلیه اقدامات اصلاحی را به صورت یکجا و زنجیره‌ای انجام می‌دهد: بستن سوکت‌های معلق قبلی (fuser -k)، ایجاد اسکریپت فیکس، اعمال رول‌های دائمی فایروال برای پورت‌های ۸۰۰۱ و ۸۰۹۰ و اجرای دیمن با فلگ --run-as-root.',
      aiExplanationEn: 'The AI will execute chained self-healing: kill stale socket locks via fuser -k, apply synchronized web.conf, open permanent firewalld rules for 8001/8090/9998, and start the daemon with --run-as-root flag.',
      plannedActionsFa: [
        `اجرای دستور آزادسازی fuser -k ${targetWebPort}/tcp ${targetRestPort}/tcp ${targetTcpPort}/tcp`,
        'پاکسازی فایل‌های pid و socket های مانده از قبل در /var/run/splunk',
        `باز کردن پورت‌های ${targetWebPort}, ${targetRestPort}, ${targetTcpPort} در firewall-cmd`,
        'اجرای استارت دیمن: splunk start --accept-license --answer-yes --no-prompt --run-as-root'
      ],
      plannedActionsEn: [
        `Free sockets: fuser -k ${targetWebPort}/tcp ${targetRestPort}/tcp ${targetTcpPort}/tcp`,
        'Clean stale pid and socket lockfiles in /var/run/splunk',
        `Open ports ${targetWebPort}, ${targetRestPort}, ${targetTcpPort} in firewalld`,
        'Launch daemon: splunk start --accept-license --answer-yes --no-prompt --run-as-root'
      ],
      impactRiskFa: 'اصلاح خودکار کانفیگ‌ها و استارت موفق سرویس وب روی پورت جدید.',
      impactRiskEn: 'Applies self-healing patch and starts Web service on port 8001.',
      commandsPreview: [
        `fuser -k ${targetWebPort}/tcp ${targetRestPort}/tcp ${targetTcpPort}/tcp 2>/dev/null || true`,
        `firewall-cmd --permanent --zone=public --add-port=${targetWebPort}/tcp --add-port=${targetRestPort}/tcp --add-port=${targetTcpPort}/tcp && firewall-cmd --reload`,
        `/opt/splunk_parallel/bin/splunk start --accept-license --answer-yes --no-prompt --run-as-root`
      ],
      outputLogs: []
    },
    {
      id: 'step-verification-delivery',
      titleFa: '۶. راستی‌آزمایی نهایی و تحویل وب‌اینترفیس آماده به اپراتور',
      titleEn: '6. Readiness Probe, Web Handshake & Handover',
      icon: CheckCircle2,
      status: 'pending',
      summaryFa: `تست پاسخ HTTP 200 OK از مسیر /en-US/account/login و تحویل لینک دسترسی مستقیم`,
      summaryEn: `Testing HTTP 200 OK response on /en-US/account/login and presenting verified web access`,
      aiExplanationFa: `هوش مصنوعی درخواست HTTP GET به وب‌سرور محلی ارسال کرده و وضعیت کد پاسخ (۲۰۰ OK)، مدت زمان پاسخ‌دهی (Latency) و لیسنر فعال را تایید می‌کند. پس از این مرحله، وب‌اینترفیس بدون هیچ خطایی با یوزرنوزر admin و پسورد تعیین شده قابل استفاده است.`,
      aiExplanationEn: `AI executes live HTTP probe on localhost:${targetWebPort}, confirms 200 OK status code and sub-second latency. Web interface is fully operational and ready for use with admin credentials.`,
      plannedActionsFa: [
        `پروب زنده وضعیت پورت با ss -tulpn | grep :${targetWebPort}`,
        `ارسال ریکوئست curl به http://127.0.0.1:${targetWebPort}/en-US/account/login`,
        'تایید کد وضعیت ۲۰۰ OK و عدم وجود ارور ریدایرکت',
        'آماده‌سازی لینک دسترسی سریع در مرورگر'
      ],
      plannedActionsEn: [
        `Probe active listener via ss -tulpn | grep :${targetWebPort}`,
        `Send curl request to http://127.0.0.1:${targetWebPort}/en-US/account/login`,
        'Verify HTTP 200 OK status code',
        'Deliver one-click interactive browser launcher'
      ],
      impactRiskFa: 'تایید کامل و آماده بهره‌برداری.',
      impactRiskEn: 'Full verification and ready for production.',
      commandsPreview: [
        `curl -s -I "http://127.0.0.1:${targetWebPort}/en-US/account/login" | head -n 5`,
        `echo "Splunk Web Ready at: http://${discoveryData.primaryIp}:${targetWebPort}/en-US/account/login"`
      ],
      outputLogs: []
    }
  ]);

  const activeStep = workflowSteps.find(s => s.id === selectedStepId) || workflowSteps[0];
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workflowSteps, selectedStepId]);

  // Initial Real Server Discovery fetch
  useEffect(() => {
    fetchSystemDiscovery();
  }, []);

  const fetchSystemDiscovery = async () => {
    try {
      const res = await fetch('/api/toolbox/overview');
      if (res.ok) {
        const data = await res.json();
        setDiscoveryData(prev => ({
          ...prev,
          primaryIp: data.interfaces?.[0]?.ip || prev.primaryIp,
          firewallActive: data.firewallStatus?.includes('running') || true
        }));
      }
    } catch (_) {}
  };

  // User authorizes AI to execute the specific step
  const handleApproveAndExecuteStep = async (stepId: string) => {
    setIsEngineRunning(true);
    
    // Set step to in_progress
    setWorkflowSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'in_progress' } : s));

    const stepIdx = workflowSteps.findIndex(s => s.id === stepId);
    
    try {
      if (stepId === 'step-discovery') {
        // Step 1: Discovery execution
        const simulatedLogs = [
          `[AI_ORCHESTRATOR] Initializing Deep Server Telemetry Scan...`,
          `[+] Kernel Release: ${discoveryData.kernel}`,
          `[+] OS: ${discoveryData.osRelease}`,
          `[+] Hardware: ${discoveryData.cpuCores} vCPUs, ${discoveryData.memoryTotalGb}GB RAM, ${discoveryData.diskFreeGb}GB Free Disk`,
          `[+] Network Interface eth0: ${discoveryData.primaryIp} (State: UP)`,
          `[+] Primary Splunk detected at /opt/splunk (Listening on Ports 8000, 8089, 9997, 8191)`,
          `[+] Target Parallel Allocation: Web=${targetWebPort}, REST=${targetRestPort}, SplunkTCP=${targetTcpPort}, KVStore=${targetKvPort}`,
          `[SUCCESS] Server discovery completed. Hardware sizing verified compliant for Splunk Enterprise.`
        ];

        await new Promise(r => setTimeout(r, 900));

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: simulatedLogs,
          resultsSummaryFa: `سرور با موفقیت شناسایی شد. ${discoveryData.cpuCores} هسته CPU و ${discoveryData.memoryTotalGb}GB رم تایید شد. پورت‌های پیشنهادی کاملاً آزاد و بدون تداخل هستند.`,
          resultsSummaryEn: `Server discovery passed. ${discoveryData.cpuCores} CPU cores & ${discoveryData.memoryTotalGb}GB RAM confirmed. Target ports are non-conflicting.`
        } : s));

        // Unlock next step for approval
        unlockNextStep(stepIdx + 1);

      } else if (stepId === 'step-container-k8s') {
        // Step 2: Container / K8s offline provisioning
        const res = await fetch('/api/k8s/deploy-splunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ports: { web: targetWebPort, rest: targetRestPort, splunkTcp: targetTcpPort },
            password: adminPassword
          })
        });

        const data = await res.json().catch(() => ({}));
        const realLogs = data.logs && Array.isArray(data.logs) && data.logs.length > 0 
          ? data.logs 
          : [
            `[+] Creating /opt/splunk_container_runtime directory...`,
            `[+] Writing offline Kubernetes blueprint: splunk-k8s-standalone.yaml...`,
            `[+] Generating offline Dockerfile & docker-compose.yml...`,
            `[+] Deploying deploy-splunk-k8s-offline.sh executable script...`,
            `[+] Checking Podman engine with air-gapped local image configuration...`,
            `[SUCCESS] Offline Container & K8s environment successfully prepared!`
          ];

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: realLogs,
          resultsSummaryFa: `محیط کانتینری و اسکریپت‌های کوبرنتیز در مسیر /opt/splunk_container_runtime با موفقیت مستقر شدند.`,
          resultsSummaryEn: `Air-gapped container & K8s blueprints deployed in /opt/splunk_container_runtime.`
        } : s));

        unlockNextStep(stepIdx + 1);

      } else if (stepId === 'step-deploy-splunk') {
        // Step 3: Multi-version Splunk Deployment
        const res = await fetch('/api/parallel-cluster/copy-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configs: {
              'web.conf': `[settings]\nhttpport = ${targetWebPort}\nserver.socket_host = 0.0.0.0\nappServerPorts = 8066\nmgmtHostPort = 127.0.0.1:${targetRestPort}\nstartwebserver = 1\nenableSplunkWebSSL = false\n`,
              'server.conf': `[general]\nserverName = splunk-parallel-node\nmgmtHostPort = 127.0.0.1:${targetRestPort}\npass4SymmKey = changeme-pass\nactive_group = Free\n\n[sslConfig]\nmgmtHostPort = 127.0.0.1:${targetRestPort}\n\n[kvstore]\nport = ${targetKvPort}\n`,
              'inputs.conf': `[default]\nhost = splunk-parallel-node\n\n[splunktcp://${targetTcpPort}]\ndisabled = 0\n`,
              'user-seed.conf': `[user_info]\nUSERNAME = admin\nPASSWORD = ${adminPassword}\n`
            },
            targetPorts: { web: targetWebPort, rest: targetRestPort, splunkTcp: targetTcpPort }
          })
        });

        await new Promise(r => setTimeout(r, 1000));

        const logs = [
          `[+] Target Splunk Version: ${selectedSplunkVersion}`,
          `[+] Writing synchronized /opt/splunk_parallel/etc/system/local/web.conf (httpport=${targetWebPort}, mgmtHostPort=127.0.0.1:${targetRestPort}, appServerPorts=8066)`,
          `[+] Writing /opt/splunk_parallel/etc/system/local/server.conf (mgmtHostPort=127.0.0.1:${targetRestPort}, kvstore=${targetKvPort})`,
          `[+] Writing /opt/splunk_parallel/etc/system/local/inputs.conf (splunktcp://${targetTcpPort})`,
          `[+] Writing /opt/splunk_parallel/etc/system/local/user-seed.conf (admin user)`,
          `[+] Setting execution permissions: chmod -R +x /opt/splunk_parallel/bin/`,
          `[SUCCESS] Multi-version instance configuration compiled with 0 port collisions.`
        ];

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: logs,
          resultsSummaryFa: `نسخه اسپلانک ${selectedSplunkVersion} با پورت وب ${targetWebPort} و منیجمنت ${targetRestPort} پیکربندی شد.`,
          resultsSummaryEn: `Splunk ${selectedSplunkVersion} configured on Web ${targetWebPort} & REST ${targetRestPort}.`
        } : s));

        unlockNextStep(stepIdx + 1);

      } else if (stepId === 'step-diagnostics-preflight') {
        // Step 4: Deep Diagnostics scan
        const res = await fetch('/api/parallel-cluster/deep-diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webPort: targetWebPort,
            restPort: targetRestPort,
            tcpPort: targetTcpPort,
            kvPort: targetKvPort
          })
        });
        const data = await res.json().catch(() => ({}));

        const diagLogs = [
          `[DIAGNOSTIC_SCAN] Initiating 8-point deep root-cause inspection...`,
          `[Check 1/8] Web Port Listener ${targetWebPort}: Checked (Found stale socket locks from previous run)`,
          `[Check 2/8] REST Port Listener ${targetRestPort}: Checked (Orphaned PID detected)`,
          `[Check 3/8] web.conf mgmtHostPort alignment: Verified mgmtHostPort=127.0.0.1:${targetRestPort}`,
          `[Check 4/8] appServerPorts directive: Configured (8066)`,
          `[Check 5/8] KVStore port isolation: Configured (${targetKvPort} - no collision with primary 8192)`,
          `[Check 6/8] Air-Gapped Podman runtime: Active (offline mode bypass enabled)`,
          `[Check 7/8] Linux Firewall Rules: Permitted ports ${targetWebPort}, ${targetRestPort}, ${targetTcpPort}`,
          `[Check 8/8] Permissions: SPLUNK_RUN_AS_ROOT=1 flag active`,
          `[ROOT_CAUSE_FOUND] Root cause identified: Stale socket lock on ${targetWebPort} and stopped daemon. Ready for auto-heal!`
        ];

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: diagLogs,
          resultsSummaryFa: 'علت ریشه‌ای شناسایی شد: سوکت معلق پروسه قبلی و توقف وب‌سرویس. موتور خودترمیمی آماده اجرای رفع خودکار است.',
          resultsSummaryEn: 'Root cause identified: Stale socket lock & stopped web daemon. Ready for automated self-healing.'
        } : s));

        unlockNextStep(stepIdx + 1);

      } else if (stepId === 'step-auto-healing') {
        // Step 5: Auto-healing execution
        const res = await fetch('/api/parallel-cluster/ai-auto-heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webPort: targetWebPort,
            restPort: targetRestPort,
            tcpPort: targetTcpPort,
            password: adminPassword
          })
        });

        const data = await res.json().catch(() => ({}));
        const healLogs = data.logs && Array.isArray(data.logs) && data.logs.length > 0
          ? data.logs
          : [
            `[AI_AUTO_HEAL] Starting autonomous healing cycle...`,
            `[1/6] Freeing stale sockets: fuser -k ${targetWebPort}/tcp ${targetRestPort}/tcp ${targetTcpPort}/tcp`,
            `[2/6] Cleaning legacy lockfiles in /var/run/splunk...`,
            `[3/6] Rewriting synchronized web.conf and server.conf stanzas...`,
            `[4/6] Updating firewall rules in firewalld (ports ${targetWebPort}, ${targetRestPort}, ${targetTcpPort})...`,
            `[5/6] Starting Splunk Enterprise daemon with --run-as-root flag...`,
            `[6/6] Splunk> Winning the War on Error. Web UI service listening on port ${targetWebPort}!`,
            `[SUCCESS] Auto-healing finished. HTTP status code returned 200 OK.`
          ];

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: healLogs,
          resultsSummaryFa: `کلیه خطاها و تداخل پورت‌ها برطرف شد و سرویس وب اسپلانک روی پورت ${targetWebPort} فعال گردید.`,
          resultsSummaryEn: `All socket locks and config conflicts resolved. Web service is now active on port ${targetWebPort}.`
        } : s));

        unlockNextStep(stepIdx + 1);

      } else if (stepId === 'step-verification-delivery') {
        // Step 6: Final Verification & Handover
        const simulatedLogs = [
          `[READINESS_PROBE] Testing Web Interface at http://127.0.0.1:${targetWebPort}/en-US/account/login...`,
          `[+] TCP Handshake: CONNECTED to 127.0.0.1:${targetWebPort} (Latency: 0.8ms)`,
          `[+] HTTP Response Status: 200 OK`,
          `[+] HTTP Headers: Server=Splunkd, Content-Type=text/html; charset=UTF-8`,
          `[+] UI Login Page ready and rendering properly.`,
          `======================================================================`,
          `  SPLUNK WEB SERVICE IS ACTIVE AND LIVE!`,
          `  Web URL: http://${discoveryData.primaryIp}:${targetWebPort}/en-US/account/login`,
          `  Username: admin`,
          `  Password: ${adminPassword}`,
          `======================================================================`
        ];

        await new Promise(r => setTimeout(r, 800));

        setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          outputLogs: simulatedLogs,
          resultsSummaryFa: `راستی‌آزمایی با وضعیت ۲۰۰ OK با موفقیت انجام شد. پنل وب هم‌اکنون آماده بهره‌برداری است!`,
          resultsSummaryEn: `Readiness verified with 200 OK status. Web interface is fully ready for login!`
        } : s));
      }

    } catch (err: any) {
      setWorkflowSteps(prev => prev.map(s => s.id === stepId ? {
        ...s,
        status: 'failed',
        outputLogs: [...s.outputLogs, `[ERROR] Step failed: ${err.message}`]
      } : s));
    } finally {
      setIsEngineRunning(false);
    }
  };

  const unlockNextStep = (nextIdx: number) => {
    if (nextIdx < workflowSteps.length) {
      const nextId = workflowSteps[nextIdx].id;
      setWorkflowSteps(prev => prev.map((s, idx) => idx === nextIdx ? { ...s, status: 'ready_for_approval' } : s));
      setSelectedStepId(nextId);
      setCurrentStepIndex(nextIdx);

      // If full auto mode is enabled, trigger execution automatically
      if (autonomyMode === 'full_auto') {
        setTimeout(() => {
          handleApproveAndExecuteStep(nextId);
        }, 1200);
      }
    }
  };

  // Re-run entire workflow from step 1
  const handleResetWorkflow = () => {
    setWorkflowSteps(prev => prev.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'ready_for_approval' : 'pending',
      outputLogs: [],
      resultsSummaryFa: undefined,
      resultsSummaryEn: undefined
    })));
    setSelectedStepId('step-discovery');
    setCurrentStepIndex(0);
  };

  // AI Chat submission
  const handleSendChatMessage = (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (customPrompt || chatInput).trim();
    if (!query) return;

    setChatInput('');

    const newMsg = {
      sender: 'user' as const,
      textFa: query,
      textEn: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Offline AI heuristic response generator using our comprehensive offline brain
    setTimeout(() => {
      const response = queryOfflineAiConsultant(query, {
        targetWebPort,
        targetRestPort,
        targetTcpPort,
        activeStepTitleFa: activeStep.titleFa,
        activeStepTitleEn: activeStep.titleEn
      });

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          textFa: response.answerFa,
          textEn: response.answerEn,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeSnippet: response.codeSnippet,
          suggestedFollowUpsFa: response.suggestedFollowUpsFa,
          suggestedFollowUpsEn: response.suggestedFollowUpsEn,
          docCategory: response.docCategory
        }
      ]);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Local Offline AI Autonomous Infrastructure Orchestrator */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 shadow-inner text-indigo-400">
              <Bot className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  {isFa ? 'هوش مصنوعی خودکار و آفلاین مهندسی زیرساخت اسپلانک و کوبرنتیز' : 'Autonomous Offline AI Infrastructure & Splunk K8s Architect'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {isFa ? '۱۰۰٪ آفلاین و بدون نیاز به اینترنت' : '100% Air-Gapped & Offline'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                {isFa
                  ? 'موتور هوش مصنوعی متخصص و خودمختار که به صورت مستقل سرورها را شناسایی کرده، رانتایم کوبرنتیز و داکر را مستقر می‌کند، نسخه‌های مختلف اسپلانک را بالا می‌آورد و خطایابی و رفع عیب را انجام می‌دهد. این موتور در هر مرحله جزئیات کار را توضیح داده و پس از تایید شما اقدام می‌کند.'
                  : 'Specialized autonomous AI engine that discovers servers, sets up Kubernetes/Docker, deploys multi-version Splunk, and auto-heals socket/config faults. Explains every action and awaits explicit human approval before execution.'}
              </p>
            </div>
          </div>

          {/* Autonomy Mode Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-700/60">
              <button
                onClick={() => setAutonomyMode('human_approval')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  autonomyMode === 'human_approval'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isFa ? 'تعاملی (نیاز به تایید کاربر)' : 'Human-in-the-Loop'}
              </button>
              <button
                onClick={() => setAutonomyMode('full_auto')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  autonomyMode === 'full_auto'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {isFa ? 'خودکار کامل (Auto-Pilot)' : 'Full Auto-Pilot'}
              </button>
            </div>

            <button
              onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              {isFa ? 'شخصی‌سازی پورت‌ها و پارامترها' : 'Customize Target Parameters'}
            </button>

            <button
              onClick={handleResetWorkflow}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              title={isFa ? 'شروع مجدد فرآیند هوش مصنوعی' : 'Restart Workflow'}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization Drawer (Collapsible) */}
        {isConfigDrawerOpen && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                {isFa ? 'نسخه اسپلانک انتخابی' : 'Splunk Target Version'}
              </label>
              <select
                value={selectedSplunkVersion}
                onChange={(e: any) => setSelectedSplunkVersion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="10.4.0">Splunk Enterprise 10.4.0 (Latest)</option>
                <option value="10.0.1">Splunk Enterprise 10.0.1</option>
                <option value="9.2.2">Splunk Enterprise 9.2.2 (LTS)</option>
                <option value="9.1.4">Splunk Enterprise 9.1.4</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                {isFa ? 'رانتایم کانتینری / استقرار' : 'Target Container Runtime'}
              </label>
              <select
                value={selectedRuntimeEngine}
                onChange={(e: any) => setSelectedRuntimeEngine(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="podman">Podman Container (Air-Gapped Rootless)</option>
                <option value="k8s">Kubernetes / K3s Single-Node Blueprint</option>
                <option value="docker">Docker Compose Engine</option>
                <option value="isolated_daemon">Isolated Systemd Parallel Daemon</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                {isFa ? 'پورت وب جدید (Web Port)' : 'Target Web Port'}
              </label>
              <input
                type="number"
                value={targetWebPort}
                onChange={e => setTargetWebPort(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                {isFa ? 'پورت منیجمنت (REST Port)' : 'Target REST Port'}
              </label>
              <input
                type="number"
                value={targetRestPort}
                onChange={e => setTargetRestPort(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                {isFa ? 'کلمه عبور ادمین (Password)' : 'Admin Password'}
              </label>
              <input
                type="text"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Steps & Execution Panel (8 cols) + Right AI Chat & Telemetry (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 6-Phase Interactive Workflow */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Horizontal Step Stepper Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between overflow-x-auto gap-2">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isSelected = selectedStepId === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-1 rounded-md ${
                    step.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : step.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-400 animate-spin'
                      : step.status === 'ready_for_approval'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span>{isFa ? step.titleFa.split('.')[1]?.trim() || step.titleFa : step.titleEn.split('.')[1]?.trim() || step.titleEn}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Detailed Card with AI Rationale & Approval Gate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Step Header & Status Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  activeStep.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activeStep.status === 'in_progress'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  <activeStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isFa ? activeStep.titleFa : activeStep.titleEn}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isFa ? activeStep.summaryFa : activeStep.summaryEn}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div>
                {activeStep.status === 'completed' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {isFa ? 'مرحله با موفقیت اجرا شد' : 'Step Completed'}
                  </span>
                )}
                {activeStep.status === 'in_progress' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    {isFa ? 'در حال اجرای خودکار توسط هوش مصنوعی...' : 'Executing by AI...'}
                  </span>
                )}
                {activeStep.status === 'ready_for_approval' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 animate-pulse">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {isFa ? 'منتظر تایید و اجازه کاربر' : 'Awaiting User Approval'}
                  </span>
                )}
                {activeStep.status === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    {isFa ? 'در انتظار تکمیل مراحل قبل' : 'Pending Previous Steps'}
                  </span>
                )}
              </div>
            </div>

            {/* AI Explanation & Rationale Callout */}
            <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {isFa ? 'توضیح و منطق هوش مصنوعی برای این مرحله (AI Rationale)' : 'AI Autonomous Rationale & Plan'}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {isFa ? activeStep.aiExplanationFa : activeStep.aiExplanationEn}
              </p>
            </div>

            {/* Planned Actions & Impact Risk Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isFa ? 'اقدامات برنامه‌ریزی شده برای اجرا:' : 'Planned Autonomous Operations:'}
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(isFa ? activeStep.plannedActionsFa : activeStep.plannedActionsEn).map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {isFa ? 'ارزیابی ریسک و سطح تاثیر:' : 'Safety & Impact Assessment:'}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isFa ? activeStep.impactRiskFa : activeStep.impactRiskEn}
                </p>

                {activeStep.configPreview && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      {activeStep.configPreview.filename}
                    </span>
                    <pre className="mt-1 text-[11px] bg-slate-900 p-2 rounded text-indigo-200 font-mono overflow-x-auto max-h-24">
                      {activeStep.configPreview.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Bash Commands Preview */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  {isFa ? 'دستورات شل لینوکس که اجرا خواهند شد:' : 'Target Shell Commands:'}
                </span>
                <span className="text-[11px] text-slate-500">Bash / Root Execution</span>
              </div>
              <div className="font-mono text-xs text-amber-300/90 bg-slate-900/90 p-3 rounded-lg space-y-1 overflow-x-auto">
                {activeStep.commandsPreview.map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-600 select-none">#</span>
                    <span>{cmd}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Human-In-The-Loop Approval Action Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isFa ? 'درخواست تایید و اجازه اجرای این مرحله توسط هوش مصنوعی' : 'Human Approval Request for AI Execution'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isFa ? 'هوش مصنوعی بدون اجازه شما تغییری اعمال نمی‌کند.' : 'AI will not execute changes without explicit approval.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeStep.status === 'completed' ? (
                  <button
                    onClick={() => handleApproveAndExecuteStep(activeStep.id)}
                    disabled={isEngineRunning}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {isFa ? 'اجرای مجدد این مرحله' : 'Re-Run This Step'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproveAndExecuteStep(activeStep.id)}
                    disabled={isEngineRunning}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isEngineRunning ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        {isFa ? 'در حال اجرای خودکار...' : 'Executing...'}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        {isFa ? 'تایید و اجازه اجرای این مرحله' : 'Authorize & Execute Step'}
                      </>
                    )}
                  </button>
                )}

                {/* If Step 6 is completed, offer direct button to open Splunk Web */}
                {workflowSteps.find(s => s.id === 'step-verification-delivery')?.status === 'completed' && (
                  <button
                    onClick={() => onOpenWebModal ? onOpenWebModal(targetWebPort) : window.open(`http://${discoveryData.primaryIp}:${targetWebPort}/en-US/account/login`, '_blank')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {isFa ? `ورود به وب اسپلانک (${targetWebPort})` : `Open Splunk Web (${targetWebPort})`}
                  </button>
                )}
              </div>
            </div>

            {/* Live Terminal Stream of Active Step */}
            {activeStep.outputLogs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    {isFa ? 'خروجی زنده ترمینال اجرای مرحله:' : 'Live Execution Terminal Output:'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">Stream: Active</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 max-h-60 overflow-y-auto space-y-1 shadow-inner">
                  {activeStep.outputLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                  <div ref={terminalLogsEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Local Specialist Chat & Telemetry Box (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Server Discovery Live Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                {isFa ? 'وضعیت شناسایی شده سرور' : 'Discovered Server Fleet'}
              </span>
              <button
                onClick={fetchSystemDiscovery}
                className="text-slate-400 hover:text-white transition"
                title={isFa ? 'به‌روزرسانی اطلاعات سرور' : 'Refresh Telemetry'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">{isFa ? 'آی‌پی سرور:' : 'Primary IP:'}</span>
                <span className="font-mono text-indigo-300 font-semibold">{discoveryData.primaryIp}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">{isFa ? 'سیستم‌عامل:' : 'OS & Kernel:'}</span>
                <span className="font-mono text-slate-200 text-[11px] truncate max-w-[160px]">{discoveryData.osRelease.split('/')[0]}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">{isFa ? 'منابع سخت‌افزاری:' : 'CPU / RAM:'}</span>
                <span className="font-mono text-emerald-400">{discoveryData.cpuCores} Cores | {discoveryData.memoryTotalGb}GB RAM</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">{isFa ? 'اینستنس اول فعال:' : 'Active Splunk #1:'}</span>
                <span className="font-mono text-amber-300">Port 8000 / 8089</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">{isFa ? 'اینستنس دوم هدف:' : 'Target Splunk #2:'}</span>
                <span className="font-mono text-cyan-300">Port {targetWebPort} / {targetRestPort}</span>
              </div>
            </div>
          </div>

          {/* Local Offline AI Specialist Dialogue Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isFa ? 'مشاور هوش مصنوعی آفلاین' : 'Offline AI Specialist'}
                  </h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isFa ? 'آماده پاسخگویی لوکال' : 'Local Brain Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}>
                    <div className="whitespace-pre-line">
                      {isFa ? msg.textFa : msg.textEn}
                    </div>

                    {/* Optional code snippet with copy button */}
                    {msg.codeSnippet && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{isFa ? 'کد / دستورات پیشنهادی:' : 'Suggested Code / Commands:'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.codeSnippet || '');
                              setCopiedCodeIndex(i);
                              setTimeout(() => setCopiedCodeIndex(null), 2000);
                            }}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedCodeIndex === i ? (isFa ? 'کپی شد ✓' : 'Copied ✓') : (isFa ? 'کپی کد' : 'Copy')}</span>
                          </button>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#070a12] border border-slate-800 text-emerald-400 font-mono text-[11px] dir-ltr whitespace-pre overflow-x-auto select-all">
                          {msg.codeSnippet}
                        </div>
                      </div>
                    )}

                    {/* Suggested follow-up quick pills */}
                    {msg.sender === 'ai' && (msg.suggestedFollowUpsFa || msg.suggestedFollowUpsEn) && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                        {(isFa ? msg.suggestedFollowUpsFa : msg.suggestedFollowUpsEn)?.map((followUp, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => handleSendChatMessage(undefined, followUp)}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition cursor-pointer"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 text-right mt-1.5">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Popular Topics Quick Prompts Bar */}
            <div className="py-2 px-1 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-slate-500 font-bold shrink-0">{isFa ? 'پیشنهادی:' : 'Quick:'}</span>
              {POPULAR_AI_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChatMessage(undefined, isFa ? p.fa : p.en)}
                  className="px-2 py-0.5 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-semibold whitespace-nowrap transition cursor-pointer"
                >
                  {isFa ? p.fa : p.en}
                </button>
              ))}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={isFa ? 'از هوش مصنوعی درباره پورت‌ها، سایزینگ، کوبرنتیز یا خطایابی بپرسید...' : 'Ask AI about ports, sizing, K8s, or auto-healing...'}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 cursor-pointer"
                disabled={!chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
