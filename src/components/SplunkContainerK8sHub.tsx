import React, { useState } from 'react';
import { 
  DOCKER_COMPOSE_TEMPLATES, 
  K8S_OPERATOR_CRDS, 
  K8S_TROUBLESHOOTING_GUIDE, 
  SPLUNK_DOCKER_CLI_COMMANDS, 
  SPLUNK_K8S_CLI_COMMANDS,
  DockerComposeTemplate,
  K8sCrdTemplate
} from '../data/splunkDockerK8sData';
import { SplunkDiagnosticAndAIAutoHealer } from './SplunkDiagnosticAndAIAutoHealer';
import { 
  Boxes, 
  Container, 
  Cpu, 
  HardDrive, 
  Layers, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  FileCode, 
  RotateCw, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Filter, 
  HelpCircle,
  FileText,
  Sliders,
  Zap,
  Wrench,
  Trash2,
  PlusCircle
} from 'lucide-react';

interface SplunkContainerK8sHubProps {
  lang: 'fa' | 'en';
  virtualClusterState?: any;
  destroyVirtualCloudServer?: () => void;
  recreateVirtualCloudServer?: () => void;
  isGlobalAiHealerRunning?: boolean;
}

export const SplunkContainerK8sHub: React.FC<SplunkContainerK8sHubProps> = ({ 
  lang,
  virtualClusterState,
  destroyVirtualCloudServer,
  recreateVirtualCloudServer,
  isGlobalAiHealerRunning
}) => {
  const isFa = lang === 'fa';

  // Navigation Tab within Hub
  const [activeSubTab, setActiveSubTab] = useState<'ai_diagnostics' | 'docker' | 'k8s_operator' | 'helm_gitops' | 'troubleshooting'>('ai_diagnostics');

  // Docker State
  const [selectedDockerTemplateId, setSelectedDockerTemplateId] = useState<string>('docker-standalone');
  const [dockerAdminPass, setDockerAdminPass] = useState<string>('SplunkAdminPass123!');
  const [dockerWebPort, setDockerWebPort] = useState<number>(8000);
  const [dockerSplunkPort, setDockerSplunkPort] = useState<number>(9997);
  const [copiedDockerYaml, setCopiedDockerYaml] = useState<boolean>(false);

  // K8s Operator State
  const [selectedK8sCrdId, setSelectedK8sCrdId] = useState<string>('k8s-operator-complete-cluster');
  const [k8sReplicas, setK8sReplicas] = useState<number>(3);
  const [k8sCpuLimit, setK8sCpuLimit] = useState<string>('8');
  const [k8sMemLimit, setK8sMemLimit] = useState<string>('16Gi');
  const [k8sStorageClass, setK8sStorageClass] = useState<string>('fast-nvme-ssd');
  const [copiedK8sYaml, setCopiedK8sYaml] = useState<boolean>(false);

  // Troubleshooting Search
  const [troubleSearch, setTroubleSearch] = useState<string>('');
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedDockerTemplate = DOCKER_COMPOSE_TEMPLATES.find(t => t.id === selectedDockerTemplateId) || DOCKER_COMPOSE_TEMPLATES[0];
  const selectedK8sCrd = K8S_OPERATOR_CRDS.find(c => c.id === selectedK8sCrdId) || K8S_OPERATOR_CRDS[0];

  // Dynamically customize Docker Compose YAML
  const getCustomizedDockerYaml = () => {
    let yaml = selectedDockerTemplate.dockerComposeYaml;
    yaml = yaml.replace(/SplunkAdminPass123!/g, dockerAdminPass);
    yaml = yaml.replace(/"8000:8000"/g, `"${dockerWebPort}:8000"`);
    yaml = yaml.replace(/"9997:9997"/g, `"${dockerSplunkPort}:9997"`);
    return yaml;
  };

  // Dynamically customize K8s CRD YAML
  const getCustomizedK8sYaml = () => {
    let yaml = selectedK8sCrd.yamlManifest;
    yaml = yaml.replace(/replicas: \d+/g, `replicas: ${k8sReplicas}`);
    yaml = yaml.replace(/cpu: "\d+"/g, `cpu: "${k8sCpuLimit}"`);
    yaml = yaml.replace(/memory: \d+Gi/g, `memory: ${k8sMemLimit}`);
    return yaml;
  };

  const handleCopy = (text: string, type: 'docker' | 'k8s' | string) => {
    navigator.clipboard.writeText(text);
    if (type === 'docker') {
      setCopiedDockerYaml(true);
      setTimeout(() => setCopiedDockerYaml(false), 2000);
    } else if (type === 'k8s') {
      setCopiedK8sYaml(true);
      setTimeout(() => setCopiedK8sYaml(false), 2000);
    } else {
      setCopiedCmdId(type);
      setTimeout(() => setCopiedCmdId(null), 2000);
    }
    showToast(isFa ? 'کد با موفقیت کپی شد ✓' : 'Copied to clipboard ✓');
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(isFa ? `فایل ${filename} با موفقیت دانلود شد.` : `Downloaded ${filename}`);
  };

  const filteredTroubles = K8S_TROUBLESHOOTING_GUIDE.filter(item => {
    const term = troubleSearch.toLowerCase();
    return !troubleSearch ||
      item.issueFa.toLowerCase().includes(term) ||
      item.issueEn.toLowerCase().includes(term) ||
      item.symptom.toLowerCase().includes(term) ||
      item.solutionFa.toLowerCase().includes(term);
  });

  return (
    <div className="bg-[#0b1017] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 text-start" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-slate-900 to-indigo-500/10 border border-cyan-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
            <Container className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isFa ? 'مرکز مدیریت کانتینری اسپلانک در داکر و کوبرنتیز (Docker & Kubernetes Hub)' : 'Splunk Container & Kubernetes (SOK) Management Hub'}
              </h2>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                Splunk Operator v2.5.0 + Docker 9.2.1
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              {isFa 
                ? 'مرجع کامل استقرار و ارکستریشن اسپلانک بر روی داکر (Docker Compose) و کوبرنتیز با استفاده از Splunk Operator (SOK)، پشتیبانی از SmartStore S3، مقیاس‌پذیری پادها و عیب‌یابی خطاهای کلاستر.'
                : 'Production-ready architectures, manifests and workflows for Splunk on Docker & Kubernetes via official Splunk Operator (SOK) with SmartStore S3 backend.'}
            </p>
          </div>
        </div>

        {/* Global Action Downloads */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => downloadFile(getCustomizedDockerYaml(), 'docker-compose.yml', 'text/yaml')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isFa ? 'دانلود docker-compose.yml' : 'Export Docker Compose'}</span>
          </button>
          <button
            onClick={() => downloadFile(getCustomizedK8sYaml(), 'splunk-operator-cluster.yaml', 'text/yaml')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4 fill-slate-950" />
            <span>{isFa ? 'دانلود مانیفست K8s' : 'Export K8s YAML'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSubTab('ai_diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ai_diagnostics' 
              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{isFa ? '✨ خطایاب هوشمند و هوش مصنوعی لوکال (AI Auto-Healer)' : '✨ AI Diagnostics & Auto-Healer'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('docker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'docker' 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Container className="w-4 h-4 text-cyan-400" />
          <span>{isFa ? '۱. استقرار روی داکر (Docker Compose)' : '1. Docker & Compose Studio'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('k8s_operator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'k8s_operator' 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4 text-indigo-400" />
          <span>{isFa ? '۲. اپراتور کوبرنتیز (Splunk Operator / SOK)' : '2. Splunk Operator (CRDs)'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('helm_gitops')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'helm_gitops' 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{isFa ? '۳. راهنمای Helm و گیت‌آپس (GitOps)' : '3. Helm & GitOps Operations'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('troubleshooting')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'troubleshooting' 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400" />
          <span>{isFa ? '۴. عیب‌یابی پادها و خطاهای کلاستر' : '4. K8s Troubleshooting Guide'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 0: AI AUTO-HEALER & DEEP DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'ai_diagnostics' && (
        <SplunkDiagnosticAndAIAutoHealer 
          lang={lang} 
          virtualClusterState={virtualClusterState}
          destroyVirtualCloudServer={destroyVirtualCloudServer}
          recreateVirtualCloudServer={recreateVirtualCloudServer}
          isGlobalAiHealerRunning={isGlobalAiHealerRunning}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DOCKER COMPOSE STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'docker' && (
        <div className="space-y-6">
          {/* Dedicated Virtual Server Lifecycle & Decommissioning Card */}
          <div className="bg-[#121927] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] opacity-20 pointer-events-none" />
            <div className="absolute -top-20 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl border shrink-0 ${
                  virtualClusterState?.isInstalled 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isFa 
                        ? 'سامانه مدیریت، راه‌اندازی و انهدام کامل کانتینرهای سرور مجازی اسپلانک' 
                        : 'Splunk Virtual Server Management & Complete Purging Console'}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full font-black border tracking-wider ${
                      virtualClusterState?.isInstalled 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      {virtualClusterState?.isInstalled 
                        ? (isFa ? '🟢 کلاستر مجازی فعال (پورت ۸۰۸۰)' : '🟢 LIVE ON PORT 8080') 
                        : (isFa ? '🔴 غیرفعال / کاملاً حذف شده' : '🔴 DELETED / OFFLINE')
                      }
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {isFa 
                      ? 'محیط مدیریت چرخه حیات کانتینر ابر مجازی. شما می‌توانید با استفاده از کنسول زیر، کлаستر مجازی را از پس‌زمینه سرور کاملاً تخریب، حجم داده‌ها (Docker Volumes) را فرمت و ۱۰۰٪ منابع سیستم را آزاد کنید.'
                      : 'Lifecycle management dashboard for virtual container deployment. You can completely destroy and wipe all containers, delete persistency volumes, and reclaim 100% of local CPU and Memory resources.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {virtualClusterState?.isInstalled ? (
                  <button
                    onClick={() => {
                      if (confirm(isFa ? "آیا از حذف کامل و پاکسازی کانتینرهای سرور مجازی در پس‌زمینه سرور مطمئن هستید؟ این عمل غیرقابل بازگشت است." : "Are you sure you want to completely delete and wipe all virtual cloud container states in the background?")) {
                        destroyVirtualCloudServer?.();
                      }
                    }}
                    disabled={isGlobalAiHealerRunning}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer disabled:opacity-40"
                    title={isFa ? 'حذف و تخریب کامل سرور مجازی از پس‌زمینه لینوکس' : 'Wipe & Delete Virtual Server container'}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>{isFa ? '🗑️ حذف کامل سرور مجازی' : '🗑️ Complete Wipe & Delete Server'}</span>
                  </button>
                ) : (
                  <button
                    onClick={recreateVirtualCloudServer}
                    disabled={isGlobalAiHealerRunning}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer disabled:opacity-40 animate-pulse"
                    title={isFa ? 'ساخت مجدد کانتینر سرور مجازی' : 'Rebuild Virtual Server container'}
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span>{isFa ? '🚀 ساخت مجدد سرور مجازی' : '🚀 Spin up Virtual Server'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Architecture Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOCKER_COMPOSE_TEMPLATES.map(template => (
              <div 
                key={template.id}
                onClick={() => setSelectedDockerTemplateId(template.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedDockerTemplateId === template.id
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                    : 'bg-[#101622] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      template.category === 'standalone' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      template.category === 'distributed' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {template.category}
                    </span>
                    {selectedDockerTemplateId === template.id && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1">
                    {isFa ? template.nameFa : template.nameEn}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {isFa ? template.descriptionFa : template.descriptionEn}
                  </p>
                </div>

                <div className="text-[11px] text-cyan-300 font-mono bg-black/40 p-2 rounded border border-slate-800/80">
                  {isFa ? template.architectureSummaryFa : template.architectureSummaryEn}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Parameters Bar */}
          <div className="bg-[#121927] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'رمز ادمین:' : 'Admin Password:'}</span>
                <input
                  type="text"
                  value={dockerAdminPass}
                  onChange={(e) => setDockerAdminPass(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'پورت وب:' : 'Web Port:'}</span>
                <input
                  type="number"
                  value={dockerWebPort}
                  onChange={(e) => setDockerWebPort(parseInt(e.target.value) || 8000)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'پورت ایندکسینگ:' : 'S2S Port:'}</span>
                <input
                  type="number"
                  value={dockerSplunkPort}
                  onChange={(e) => setDockerSplunkPort(parseInt(e.target.value) || 9997)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(getCustomizedDockerYaml(), 'docker')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold transition border border-cyan-500/30 cursor-pointer"
              >
                {copiedDockerYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDockerYaml ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی YAML' : 'Copy YAML')}</span>
              </button>

              <button
                onClick={() => downloadFile(getCustomizedDockerYaml(), 'docker-compose.yml', 'text/yaml')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isFa ? 'دانلود فایل' : 'Download'}</span>
              </button>
            </div>
          </div>

          {/* Docker Compose YAML Code View */}
          <div className="bg-[#0c1117] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono text-cyan-400">
                <FileCode className="w-4 h-4" />
                <span>docker-compose.yml ({selectedDockerTemplate.nameEn})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">image: splunk/splunk:9.2.1</span>
            </div>
            <pre className="p-4 text-[12px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[420px] custom-scrollbar selection:bg-cyan-500/30">
              <code>{getCustomizedDockerYaml()}</code>
            </pre>
          </div>

          {/* Environment Variables Table */}
          <div className="bg-[#101622] border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'متغیرهای محیطی حیاتی اسپلانک در داکر (Splunk Container Environment Variables):' : 'Key Splunk Container Environment Variables:'}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {selectedDockerTemplate.envExplanation.map(env => (
                <div key={env.key} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-mono text-cyan-300 font-bold mb-1">
                    <span>{env.key}</span>
                    <span className="text-slate-500 text-[10px]">{env.value}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{isFa ? env.descFa : env.descEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Docker CLI Commands Cheatsheet */}
          <div className="bg-[#101622] border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'دستورات پرکاربرد خط فرمان Docker برای مدیریت کانتینر اسپلانک:' : 'Splunk Docker CLI Management Commands:'}</span>
            </h4>
            <div className="space-y-2">
              {SPLUNK_DOCKER_CLI_COMMANDS.map((cli, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 text-[11px] block">{cli.category} • {cli.descFa}</span>
                    <code className="text-cyan-400 font-mono text-[11px] break-all">{cli.cmd}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(cli.cmd, `docker-cli-${idx}`)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono flex items-center gap-1 transition self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    {copiedCmdId === `docker-cli-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmdId === `docker-cli-${idx}` ? 'کپی شد' : 'کپی'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: KUBERNETES OPERATOR (SOK) */}
      {/* ========================================================================= */}
      {activeSubTab === 'k8s_operator' && (
        <div className="space-y-6">

          {/* SOK Architecture Diagram Banner */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/40 rounded-xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs sm:text-sm">
              <Boxes className="w-5 h-5 text-indigo-400" />
              <span>{isFa ? 'معماری کنترلر Splunk Operator برای کوبرنتیز (SOK Architecture):' : 'Splunk Operator for Kubernetes (SOK) Architecture:'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa 
                ? 'اپراتور اسپلانک کنترلری است که منابع اختصاصی (Custom Resources) مانند IndexerCluster و SearchHeadCluster را رصد کرده و چرخه حیات، حجم دیسک‌های PVC، بازیابی خودکار در خرابی پادها، اسمارت‌استور و Rolling Upgrade را به صورت اتوماتیک مدیریت می‌نماید.'
                : 'Splunk Operator acts as an automated SRE controller on Kubernetes, orchestrating StatefulSets, PVC lifecycle, SmartStore S3 offloading, and rolling upgrades.'}
            </p>
            
            {/* Visual Flow diagram */}
            <div className="bg-black/50 p-3.5 rounded-lg border border-indigo-500/20 grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-indigo-950/60 border border-indigo-500/40 p-2.5 rounded-lg text-indigo-300">
                <span className="font-bold block">1. Custom Resources</span>
                <span className="text-[10px] text-slate-400">IndexerCluster / SHC</span>
              </div>
              <div className="bg-cyan-950/60 border border-cyan-500/40 p-2.5 rounded-lg text-cyan-300">
                <span className="font-bold block">2. SOK Controller</span>
                <span className="text-[10px] text-slate-400">Reconciliation Loop</span>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-lg text-emerald-300">
                <span className="font-bold block">3. StatefulSets / PVC</span>
                <span className="text-[10px] text-slate-400">NVMe Hot Storage</span>
              </div>
              <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-lg text-amber-300">
                <span className="font-bold block">4. SmartStore S3</span>
                <span className="text-[10px] text-slate-400">Remote Cloud Object Store</span>
              </div>
            </div>
          </div>

          {/* CRD Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {K8S_OPERATOR_CRDS.map(crd => (
              <div
                key={crd.id}
                onClick={() => setSelectedK8sCrdId(crd.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  selectedK8sCrdId === crd.id
                    ? 'bg-indigo-950/50 border-indigo-500/70 shadow-lg shadow-indigo-950/50'
                    : 'bg-[#101622] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-bold border border-indigo-500/30">
                      Kind: {crd.kind}
                    </span>
                    {selectedK8sCrdId === crd.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{crd.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {isFa ? crd.descriptionFa : crd.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive K8s Tuner */}
          <div className="bg-[#121927] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'تعداد پادها (Replicas):' : 'Replicas:'}</span>
                <input
                  type="number"
                  value={k8sReplicas}
                  min={1}
                  max={20}
                  onChange={(e) => setK8sReplicas(parseInt(e.target.value) || 3)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'CPU Limit:' : 'CPU Limit:'}</span>
                <input
                  type="text"
                  value={k8sCpuLimit}
                  onChange={(e) => setK8sCpuLimit(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{isFa ? 'Memory Limit:' : 'Memory Limit:'}</span>
                <input
                  type="text"
                  value={k8sMemLimit}
                  onChange={(e) => setK8sMemLimit(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(getCustomizedK8sYaml(), 'k8s')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-500/30 cursor-pointer"
              >
                {copiedK8sYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedK8sYaml ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی YAML' : 'Copy Manifest')}</span>
              </button>

              <button
                onClick={() => downloadFile(getCustomizedK8sYaml(), 'splunk-operator-cluster.yaml', 'text/yaml')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isFa ? 'دانلود مانیفست' : 'Download YAML'}</span>
              </button>
            </div>
          </div>

          {/* K8s YAML Preview */}
          <div className="bg-[#0c1117] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono text-indigo-400">
                <FileCode className="w-4 h-4" />
                <span>splunk-operator-crd.yaml ({selectedK8sCrd.kind})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">apiVersion: enterprise.splunk.com/v4</span>
            </div>
            <pre className="p-4 text-[12px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[440px] custom-scrollbar selection:bg-indigo-500/30">
              <code>{getCustomizedK8sYaml()}</code>
            </pre>
          </div>

          {/* Kubectl CLI Commands */}
          <div className="bg-[#101622] border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'دستورات کاربردی kubectl برای مدیریت اپراتور و کلاستر اسپلانک:' : 'Kubectl Commands for Splunk Operator Management:'}</span>
            </h4>
            <div className="space-y-2">
              {SPLUNK_K8S_CLI_COMMANDS.map((cli, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 text-[11px] block">{cli.category} • {cli.descFa}</span>
                    <code className="text-indigo-300 font-mono text-[11px] break-all">{cli.cmd}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(cli.cmd, `k8s-cli-${idx}`)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono flex items-center gap-1 transition self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    {copiedCmdId === `k8s-cli-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmdId === `k8s-cli-${idx}` ? 'کپی شد' : 'کپی'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: HELM & GITOPS */}
      {/* ========================================================================= */}
      {activeSubTab === 'helm_gitops' && (
        <div className="space-y-6">
          <div className="bg-[#101622] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>{isFa ? 'راهنمای گام‌به‌گام نصب و راه‌اندازی Splunk Operator با Helm' : 'Step-by-Step Splunk Operator Deployment via Helm'}</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block">{isFa ? 'گام ۱: افزودن ریپازیتوری رسمی و بروزرسانی Helm' : 'Step 1: Add Official Splunk Helm Repo'}</span>
                <pre className="text-emerald-400 font-mono text-[11px] bg-black/60 p-2.5 rounded">
helm repo add splunk https://splunk.github.io/splunk-operator
helm repo update</pre>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block">{isFa ? 'گام ۲: نصب اپراتور در فضای نام اختصاصی splunk' : 'Step 2: Install Operator in splunk namespace'}</span>
                <pre className="text-emerald-400 font-mono text-[11px] bg-black/60 p-2.5 rounded">
helm install splunk-operator splunk/splunk-operator \\
  --namespace splunk \\
  --create-namespace \\
  --set clusterWide=true</pre>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block">{isFa ? 'گام ۳: ایجاد Secret رمزهای عبور و دسترسی S3 SmartStore' : 'Step 3: Create Enterprise & S3 Secrets'}</span>
                <pre className="text-emerald-400 font-mono text-[11px] bg-black/60 p-2.5 rounded">
kubectl create secret generic splunk-enterprise-secrets \\
  --namespace splunk \\
  --from-literal=password="SplunkEnterprisePass123!" \\
  --from-literal=hec_token="b2803b90-1c95-46f9-8687-d7d8e0638541"

kubectl create secret generic splunk-s3-credentials \\
  --namespace splunk \\
  --from-literal=s3_access_key="admin_s3_key" \\
  --from-literal=s3_secret_key="admin_s3_secret"</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: K8S TROUBLESHOOTING GUIDE */}
      {/* ========================================================================= */}
      {activeSubTab === 'troubleshooting' && (
        <div className="space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={troubleSearch}
              onChange={(e) => setTroubleSearch(e.target.value)}
              placeholder={isFa ? 'جستجو در خطاهای کوبرنتیز (CrashLoopBackOff, Quorum, SmartStore, OOM, PVC)...' : 'Search K8s troubleshooting issues...'}
              className="w-full bg-[#101622] border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="space-y-3">
            {filteredTroubles.map(item => (
              <div 
                key={item.id}
                className="bg-[#101622] border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      item.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      item.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {item.severity}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                      {isFa ? item.issueFa : item.issueEn}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.symptom}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-rose-400 font-bold block">{isFa ? 'علت ریشه‌ای (Root Cause):' : 'Root Cause:'}</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{isFa ? item.rootCauseFa : item.rootCauseEn}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-emerald-400 font-bold block">{isFa ? 'راهکار رفع مشکل (Remediation):' : 'Solution:'}</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{isFa ? item.solutionFa : item.solutionEn}</p>
                  </div>
                </div>

                <div className="bg-black/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                  <code className="text-cyan-400 font-mono text-[11px] break-all">{item.kubectlCommand}</code>
                  <button
                    onClick={() => handleCopy(item.kubectlCommand, item.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    {copiedCmdId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmdId === item.id ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
