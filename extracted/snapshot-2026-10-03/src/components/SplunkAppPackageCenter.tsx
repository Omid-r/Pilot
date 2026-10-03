import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Folder, 
  Terminal, 
  ShieldCheck, 
  Server, 
  Layers, 
  Key, 
  Cpu, 
  Info,
  CheckCircle2,
  Package,
  FileText,
  Upload,
  FileArchive,
  AlertTriangle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';
import { SPLUNK_APP_FILES, SPLUNK_APP_METADATA } from '../data/splunkAppFiles';
import { TAR_GZ_BASE64 } from '../data/splunkTarGzBase64';

interface SplunkAppPackageCenterProps {
  lang: 'fa' | 'en';
}

interface UploadedZipFileItem {
  path: string;
  size: number;
  content: string;
}

interface ZipFinding {
  file: string;
  check: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  description: string;
  recommendation: string;
}

export const SplunkAppPackageCenter: React.FC<SplunkAppPackageCenterProps> = ({ lang }) => {
  const isFa = lang === 'fa';
  const [activeTab, setActiveTab] = useState<'installer_guide' | 'auto_installer' | 'package_files' | 'zip_analyzer' | 'permissions_architecture' | 'offline_tools_matrix'>('offline_tools_matrix');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState<boolean>(false);
  const [downloadSuccessFormat, setDownloadSuccessFormat] = useState<'spl' | 'zip' | 'tar.gz' | null>(null);
  const [selectedTargetComponent, setSelectedTargetComponent] = useState<'sh_web' | 'sh_cli' | 'indexer_cluster' | 'shc_deployer' | 'deployment_server' | 'heavy_forwarder' | 'rhel_standalone'>('rhel_standalone');

  // RHEL Standalone Package States
  const [isDownloadingRhel, setIsDownloadingRhel] = useState<boolean>(false);
  const [isRebuildingRhel, setIsRebuildingRhel] = useState<boolean>(false);
  const [rebuildToast, setRebuildToast] = useState<string | null>(null);
  const [packageInfo, setPackageInfo] = useState<{
    version: string;
    buildDate: string;
    sizeMb: string;
    filename: string;
    features: string[];
  } | null>(null);

  // Load latest package metadata
  useEffect(() => {
    fetch('/api/download/package-info')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setPackageInfo(data);
      })
      .catch(() => {});
  }, []);

  // Download RHEL package directly with anti-cache timestamp
  const handleDownloadRhelPackage = () => {
    setIsDownloadingRhel(true);
    const downloadUrl = `/api/download/rhel-package?t=${Date.now()}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `splunk_cluster_doctor_rhel_v1.3.0.tar.gz`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setIsDownloadingRhel(false);
      setDownloadSuccessFormat('tar.gz');
      setTimeout(() => setDownloadSuccessFormat(null), 6000);
    }, 1200);
  };

  // Recompile and package on the fly
  const handleForceRebuildRhel = async () => {
    setIsRebuildingRhel(true);
    setRebuildToast(null);
    try {
      const res = await fetch('/api/download/rebuild-rhel-package', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRebuildToast(
          isFa
            ? 'بسته نصبی ردهت با آخرین اصلاحات (فلش‌های ۹۹۹۷، پروب زنده کلاستر و سرویس Systemd) مجدداً پکیج شد. دریافت فایل آغاز گردید.'
            : 'RHEL package successfully re-compiled with latest 9997 upward arrows and live socket probes. Starting download...'
        );
        handleDownloadRhelPackage();
        setTimeout(() => setRebuildToast(null), 7000);
      }
    } catch (err) {
      console.error(err);
      handleDownloadRhelPackage();
    } finally {
      setIsRebuildingRhel(false);
    }
  };

  // Auto Installer Script Generator States
  const [installerSplunkHome, setInstallerSplunkHome] = useState<string>('/opt/splunk');
  const [installerAppName, setInstallerAppName] = useState<string>('dr_splunk');
  const [installerSplunkUser, setInstallerSplunkUser] = useState<string>('splunk');
  const [installerSplunkGroup, setInstallerSplunkGroup] = useState<string>('splunk');
  const [installerMode, setInstallerMode] = useState<'quick_fix' | 'all_in_one'>('quick_fix');
  const [isDownloadingScript, setIsDownloadingScript] = useState<boolean>(false);

  // ZIP Analyzer States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingZip, setIsAnalyzingZip] = useState<boolean>(false);
  const [uploadedZipName, setUploadedZipName] = useState<string | null>(null);
  const [uploadedZipFileObject, setUploadedZipFileObject] = useState<File | null>(null);
  const [isInjectingBin, setIsInjectingBin] = useState<boolean>(false);
  const [injectSuccess, setInjectSuccess] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedZipFileItem[]>([]);
  const [zipFindings, setZipFindings] = useState<ZipFinding[]>([]);
  const [selectedUploadedFileIndex, setSelectedUploadedFileIndex] = useState<number>(0);
  const [fileFilterCategory, setFileFilterCategory] = useState<'all' | 'bin' | 'default' | 'metadata' | 'root'>('all');

  const selectedFile = SPLUNK_APP_FILES[selectedFileIndex] || SPLUNK_APP_FILES[0];
  const selectedUploadedFile = uploadedFiles[selectedUploadedFileIndex];

  // Copy text helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(identifier);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  // Inject bin/ folder into uploaded zip and download
  const handleInjectBinToUploadedZip = async () => {
    if (!uploadedZipFileObject) return;
    setIsInjectingBin(true);
    setInjectSuccess(false);

    try {
      const zip = await JSZip.loadAsync(uploadedZipFileObject);

      // Determine if zip has a root folder or flat files
      const firstEntryName = Object.keys(zip.files)[0] || '';
      const hasRootFolder = firstEntryName.includes('/') && !firstEntryName.startsWith('default') && !firstEntryName.startsWith('metadata') && !firstEntryName.startsWith('bin');
      const prefix = hasRootFolder ? firstEntryName.split('/')[0] + '/' : '';

      // Inject bin directory and files
      const pyScript = SPLUNK_APP_FILES.find(f => f.path === 'bin/cluster_health_checker.py');
      const shScript = SPLUNK_APP_FILES.find(f => f.path === 'bin/diag_collector.sh');

      if (pyScript) {
        zip.file(`${prefix}bin/cluster_health_checker.py`, pyScript.content);
      }
      if (shScript) {
        zip.file(`${prefix}bin/diag_collector.sh`, shScript.content);
      }

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedZipName ? uploadedZipName.replace(/\.(zip|spl)$/i, '_with_bin.zip') : 'splunk_app_with_bin.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setInjectSuccess(true);
      setTimeout(() => setInjectSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to inject bin folder:', err);
      alert(isFa ? 'خطا در افزودن دایرکتوری bin به فایل زیپ' : 'Failed to inject bin directory');
    } finally {
      setIsInjectingBin(false);
    }
  };

  // Generate and download archive (.spl or .zip or .tar.gz) via JSZip or Fetch
  const handleDownloadPackage = async (format: 'spl' | 'zip' | 'tar.gz') => {
    setIsGeneratingPackage(true);
    setDownloadSuccessFormat(null);

    try {
      if (format === 'tar.gz') {
        const downloadUrl = `/api/download/rhel-package?t=${Date.now()}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `splunk_cluster_doctor_rhel_v1.3.0.tar.gz`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setDownloadSuccessFormat('tar.gz');
        setTimeout(() => setDownloadSuccessFormat(null), 5000);
        return;
      }

      if (format === 'spl') {
        const downloadUrl = `/splunk_cluster_doctor-1.0.0.spl?t=${Date.now()}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `splunk_cluster_doctor-1.0.0.spl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setDownloadSuccessFormat('spl');
        setTimeout(() => setDownloadSuccessFormat(null), 5000);
        return;
      }

      const zip = new JSZip();
      const rootFolder = zip.folder(SPLUNK_APP_METADATA.id);

      if (rootFolder) {
        // Explicitly create directory entries in the zip header so that tools like `unzip -l` and file managers explicitly show directories
        rootFolder.folder('bin');
        rootFolder.folder('default');
        rootFolder.folder('default/data');
        rootFolder.folder('default/data/ui');
        rootFolder.folder('default/data/ui/nav');
        rootFolder.folder('default/data/ui/views');
        rootFolder.folder('metadata');

        for (const file of SPLUNK_APP_FILES) {
          rootFolder.file(file.path, file.content);
        }

        const blob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 }
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${SPLUNK_APP_METADATA.id}-${SPLUNK_APP_METADATA.version}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadSuccessFormat(format);
        setTimeout(() => setDownloadSuccessFormat(null), 5000);
      }
    } catch (err) {
      console.error('Failed to generate Splunk package:', err);
    } finally {
      setIsGeneratingPackage(false);
    }
  };

  // Handle User Uploaded ZIP File
  const handleUploadZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedZipName(file.name);
    setUploadedZipFileObject(file);
    setIsAnalyzingZip(true);
    setUploadedFiles([]);
    setZipFindings([]);

    try {
      const loadedZip = await JSZip.loadAsync(file);
      const parsedFiles: UploadedZipFileItem[] = [];
      const findingsList: ZipFinding[] = [];

      // Loop through all entries in the zip
      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (!zipEntry.dir) {
          let content = '';
          const isText = /\.(conf|manifest|meta|py|sh|xml|txt|md|json|csv|cfg)$/i.test(relativePath);
          if (isText) {
            try {
              content = await zipEntry.async('text');
            } catch {
              content = '[Binary or Unreadable file content]';
            }
          } else {
            content = `[Binary file: ${(zipEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0} bytes]`;
          }

          const fileItem: UploadedZipFileItem = {
            path: relativePath,
            size: content.length,
            content
          };
          parsedFiles.push(fileItem);

          // Audit common Splunk misconfigurations in uploaded file
          const lowerContent = content.toLowerCase();

          // 1. outputs.conf TLS Audit
          if (relativePath.includes('outputs.conf')) {
            if (lowerContent.includes('usessl = false') || lowerContent.includes('usessl=false')) {
              findingsList.push({
                file: relativePath,
                check: 'SPLUNK_OUTPUTS_PLAINTEXT',
                severity: 'CRITICAL',
                title: isFa ? 'ارسال داده‌ها به صورت متن‌واضح (useSSL = false)' : 'Plaintext Forwarding Detected',
                description: isFa ? 'فورواردر داده‌ها را بدون رمزنگاری TLS به ایندکسر ارسال می‌کند که خطای بحرانی امنیتی است.' : 'Forwarder transmits data in plaintext without TLS encryption.',
                recommendation: isFa ? 'مقدار useSSL را به true تغییر داده و مسیر سرتیفیکیت‌های sslRootCAPath را مشخص کنید.' : 'Set useSSL = true and configure clientCert / sslRootCAPath.'
              });
            }
          }

          // 2. server.conf Secret Key Audit
          if (relativePath.includes('server.conf')) {
            if (content.includes('pass4SymmKey = ' + 'changeme') || content.includes('pass4SymmKey=changeme')) {
              findingsList.push({
                file: relativePath,
                check: 'DEFAULT_CLUSTER_SECRET',
                severity: 'CRITICAL',
                title: isFa ? 'رمز پیش‌فرض خطرناک کلاستر (pass4SymmKey = <REPLACE_ME>)' : 'Insecure Factory Cluster Secret',
                description: isFa ? 'استفاده از کلید پیش‌فرض کارخانه به مهاجم امکان نفوذ و جعل هویت نودهای ایندکسر را می‌دهد.' : 'Default secret allows unauthorized cluster node spoofing.',
                recommendation: isFa ? 'یک کلید تصادفی حداقل ۱۶ کاراکتری پیچیده در [clustering] و [general] تنظیم نمایید.' : 'Generate a strong high-entropy cluster pass4SymmKey.'
              });
            }
          }

          // 3. Deprecated SSL / TLS version Audit
          if (lowerContent.includes('sslv3') || lowerContent.includes('tls1.0') || lowerContent.includes('sslversions = tls1.0')) {
            findingsList.push({
              file: relativePath,
              check: 'DEPRECATED_CIPHER_PROTOCOL',
              severity: 'HIGH',
              title: isFa ? 'پروتکل منسوخ SSLv3 یا TLS 1.0 شناسایی شد' : 'Deprecated Protocol (SSLv3 / TLS 1.0)',
              description: isFa ? 'پروتکل‌های قدیمی نسبت به حملات POODLE و BEAST آسیب‌پذیر بوده و در استانداردهای PCI-DSS ممنوع هستند.' : 'Legacy SSL protocols violate SOC2 and PCI-DSS compliance.',
              recommendation: isFa ? 'حداقل نسخه مجاز را sslVersions = tls1.2 یا tls1.3 تنظیم فرمایید.' : 'Enforce sslVersions = tls1.2, tls1.3 in server.conf and inputs.conf.'
            });
          }

          // 4. Python 2 vs Python 3 syntax audit
          if (relativePath.endsWith('.py')) {
            if (/print\s+"[^"]*"/.test(content) || /print\s+'[^']*'/.test(content)) {
              findingsList.push({
                file: relativePath,
                check: 'PYTHON2_DEPRECATED_SYNTAX',
                severity: 'HIGH',
                title: isFa ? 'سینتکس منسوخ پایتون ۲ در اسکریپت' : 'Python 2 Deprecated Syntax',
                description: isFa ? 'اسپلانک 9.x و بالاتر صرفاً از مفسر Python 3 پشتیبانی می‌کند و اسکریپت‌های پایتون ۲ متوقف خواهند شد.' : 'Splunk 9.x+ strictly enforces Python 3 execution runtime.',
                recommendation: isFa ? 'از print(...) پرانتزدار استفاده کرده و ماژول‌های پایتون ۳ را ایمپورت کنید.' : 'Refactor scripts to Python 3 syntax (print function, urllib.request).'
              });
            }
          }

          // 5. Default.meta export audit
          if (relativePath.includes('default.meta')) {
            if (!content.includes('export = system')) {
              findingsList.push({
                file: relativePath,
                check: 'MISSING_GLOBAL_EXPORT',
                severity: 'MEDIUM',
                title: isFa ? 'عدم انتشار سراسری آبجکت‌ها (export = system وجود ندارد)' : 'No Global Object Export',
                description: isFa ? 'بدون export = system، دشبوردها و دستورات این اپ در سایر بخش‌های اسپلانک قابل مشاهده نخواهند بود.' : 'Objects will remain isolated to this app context instead of cluster-wide.',
                recommendation: isFa ? 'دستور export = system را در بلاک‌های [views] و [] فایل metadata اضافه کنید.' : 'Add export = system in default.meta to enable cluster-wide visibility.'
              });
            }
          }
        }
      }

      // Check if app.manifest exists
      const hasManifest = parsedFiles.some(f => f.path.endsWith('app.manifest'));
      if (!hasManifest) {
        findingsList.push({
          file: 'app.manifest',
          check: 'MISSING_APP_MANIFEST',
          severity: 'HIGH',
          title: isFa ? 'فایل app.manifest یافت نشد' : 'Missing app.manifest',
          description: isFa ? 'برای نصب ایمن در اسپلانک کلود و نسخه 9.x وجود مانیفست استاندارد اجباری است.' : 'app.manifest is required for Splunk Cloud and modern AppInspect certification.',
          recommendation: isFa ? 'یک فایل app.manifest با schemaVersion 2.0.0 در ریشه پکیج قرار دهید.' : 'Include a valid schemaVersion 2.0.0 manifest file.'
        });
      }

      // Check if bin/ directory or executable scripts exist
      const hasBinDir = parsedFiles.some(f => 
        f.path.toLowerCase().includes('/bin/') || 
        f.path.toLowerCase().startsWith('bin/') ||
        f.path.toLowerCase().endsWith('.py') ||
        f.path.toLowerCase().endsWith('.sh')
      );

      if (!hasBinDir) {
        findingsList.push({
          file: 'bin/ (Directory)',
          check: 'NO_BIN_DIRECTORY',
          severity: 'INFO',
          title: isFa ? 'پکیج فاقد دایرکتوری bin/ یا اسکریپت است (طبیعی در اپ‌های دشبورد و TA)' : 'No bin/ Directory or Scripts Found (Standard for Config/UI Apps)',
          description: isFa 
            ? 'در این فایل ZIP هیچ پوشه bin/ یا اسکریپتی وجود ندارد. در معماری اسپلانک، وجود پوشه bin/ اختیاری (Optional) است. اپلیکیشن‌های دشبورد، کوئری‌ها، فیلدها و کانفیگ‌ها نیازی به bin/ ندارند و بدون مشکل کار می‌کنند. این دایرکتوری صرفاً برای اجرای اسکریپت‌های پایتون یا Modular Inputs استفاده می‌شود.'
            : 'No bin/ directory found in the package. In Splunk, bin/ is completely optional. Knowledge objects, dashboards, and config-only apps run flawlessly without it. bin/ is only required if you run custom Python/Bash scripts or modular inputs.',
          recommendation: isFa 
            ? 'اگر اپلیکیشن شما صرفاً دشبورد و کانفیگ است، نیازی به ایجاد bin/ ندارید. اگر مایلید اسکریپت تشخیصی سلامت کلاستر را اضافه کنید، از دکمه «+ افزودن پوشه bin/ به این فایل زیپ» استفاده کنید.'
            : 'If this is a UI or configuration package, no action is needed. If you want custom Python health checking, click "+ Inject bin/ Directory".'
        });
      }

      setUploadedFiles(parsedFiles);
      setZipFindings(findingsList);
      setSelectedUploadedFileIndex(0);
      setActiveTab('zip_analyzer');
    } catch (error) {
      console.error('Error unzipping uploaded file:', error);
      alert(isFa ? 'خطا در خواندن فایل زیپ. لطفاً از سالم بودن فایل مطمئن شوید.' : 'Failed to read zip file.');
    } finally {
      setIsAnalyzingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for ZIP upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadZipFile}
        accept=".zip,.spl,.tar,.gz"
        className="hidden"
      />

      {/* Header Banner & Download / Upload CTAs - Sirene Dark Luxury */}
      <div className="sirene-card rounded-3xl border border-white/[0.08] bg-[#0b0e17]/85 backdrop-blur-2xl p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                SPLUNK ENTERPRISE APP (ZIP &amp; SPL)
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isFa ? 'آماده نصب با دسترسی کامل سیستمی' : 'Zero-Config Instant Access'}
              </span>
              <span className="text-xs text-slate-400 font-mono">v{SPLUNK_APP_METADATA.version} (Build {SPLUNK_APP_METADATA.build})</span>
            </div>

            <h2 className="text-xl md:text-3xl font-black text-white tracking-tight sirene-text-gradient">
              {isFa ? 'بسته نصبی رسمی اپلیکیشن اسپلانک (Splunk Cluster Doctor App)' : 'Splunk Cluster Doctor Enterprise Application Package'}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {isFa 
                ? 'پکیج کامل اسپلانک با پشتیبانی از هر دو فرمت استاندارد ZIP و SPL. می‌توانید پکیج را دانلود کنید یا فایل زیپ شخصی خود را برای بررسی خطاهای کانفیگ و تطابق با کلاستر آپلود نمایید.'
                : 'Complete Splunk App package available in both .ZIP and .SPL archive formats. Ready for direct installation in Splunk Web, CLI, or Cluster Master.'}
            </p>
          </div>

          {/* Download & Upload Action Buttons */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full xl:w-auto relative z-10">
            {/* Download RHEL Standalone Server Package */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadRhelPackage}
                disabled={isDownloadingRhel || isRebuildingRhel}
                className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(124,58,237,0.35)] border border-white/20 transition transform active:scale-95 text-center cursor-pointer"
              >
                {isDownloadingRhel ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Server className="w-4 h-4" />
                )}
                <span>
                  {isDownloadingRhel
                    ? (isFa ? 'در حال ارسال نسخه جدید...' : 'Preparing v1.3.0...')
                    : (isFa ? 'دانلود پکیج کامل سرور لینوکس (tar.gz)' : 'Download Standalone Package (tar.gz)')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-black border border-white/30">
                  v1.3.0
                </span>
              </button>

              {/* Force Rebuild live package button */}
              <button
                onClick={handleForceRebuildRhel}
                disabled={isRebuildingRhel || isDownloadingRhel}
                className="px-3.5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={isFa ? 'کامپایل و بازسازی آنلاین پکیج با آخرین کدهای تغییریافته' : 'Force rebuild RHEL package with latest changes'}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRebuildingRhel ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRebuildingRhel 
                    ? (isFa ? 'کامپایل...' : 'Rebuilding...') 
                    : (isFa ? 'بازسازی آنلاین' : 'Rebuild')}
                </span>
              </button>
            </div>

            {/* Download TAR.GZ Button */}
            <button
              onClick={() => handleDownloadPackage('tar.gz')}
              disabled={isGeneratingPackage}
              className="px-4 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileArchive className="w-4 h-4 text-emerald-400" />
              <span>
                {isGeneratingPackage 
                  ? (isFa ? 'در حال دریافت...' : 'Downloading...') 
                  : (isFa ? 'دانلود پکیج اپ (.tar.gz)' : 'Download Splunk App (.tar.gz)')}
              </span>
            </button>

            {/* Download ZIP Button */}
            <button
              onClick={() => handleDownloadPackage('zip')}
              disabled={isGeneratingPackage}
              className="px-4 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>
                {isFa ? 'دانلود ZIP' : 'Download ZIP'}
              </span>
            </button>

            {/* Download SPL Button */}
            <button
              onClick={() => handleDownloadPackage('spl')}
              disabled={isGeneratingPackage}
              className="px-4 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>
                {isFa ? 'دانلود SPL' : 'Download SPL'}
              </span>
            </button>

            {/* Upload & Inspect User ZIP Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzingZip}
              className="px-4 py-3.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>
                {isAnalyzingZip 
                  ? (isFa ? 'در حال آنالیز زیپ...' : 'Analyzing ZIP...') 
                  : (isFa ? 'بررسی فایل ZIP من' : 'Inspect My ZIP')}
              </span>
            </button>
          </div>
        </div>

        {/* Live Package Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
            <span className="text-violet-300 font-bold">RHEL Package v1.2.0:</span>
            <span>
              {isFa
                ? 'به‌روزرسانی شده با اصلاح جهت فلش‌های ۹۹۹۷، بازرس لحظه‌ای پورت‌ها، پروب زنده کلاستر و نصاب سرویس Systemd'
                : 'Updated with reversed 9997 TCP arrows, instant port inspector, TCP probes, and RHEL systemd service installer.'}
            </span>
          </div>
          {packageInfo && (
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>{packageInfo.filename}</span>
              <span className="text-emerald-400 font-bold">~{packageInfo.sizeMb} MB</span>
            </div>
          )}
        </div>

        {rebuildToast && (
          <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
            <span>{rebuildToast}</span>
          </div>
        )}

        {downloadSuccessFormat && (
          <div className="mt-3.5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {isFa 
                ? `فایل با فرمت ${downloadSuccessFormat} با موفقیت دانلود شد! آخرین نسخه به‌روزرسانی شده آماده استفاده است.`
                : `Latest package (.${downloadSuccessFormat}) downloaded successfully! Ready for deployment.`}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs - Sirene Capsule Style */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('offline_tools_matrix')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'offline_tools_matrix'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-white/20'
              : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{isFa ? 'ماتریس ابزارها و اسکریپت‌های نصبی آفلاین (داکر، کوبر، پایتون، AI)' : 'Offline Tools & Installers Matrix (Docker, K8s, AI, Python)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('installer_guide')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'installer_guide'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
              : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>{isFa ? 'راهنمای گام‌به‌گام نصب فایل ZIP در کامپوننت‌ها' : 'Component ZIP Installation Guide'}</span>
        </button>

        <button
          onClick={() => setActiveTab('package_files')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'package_files'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
              : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>{isFa ? 'مشاهده و کپی کدهای داخل پکیج (۱۰ فایل)' : 'Package File Explorer (10 Files)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('zip_analyzer')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'zip_analyzer'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'bg-white/[0.04] text-cyan-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{isFa ? 'آنالایزر و تست فایل ZIP شما' : 'User ZIP Analyzer & Auditor'}</span>
          {uploadedZipName && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 text-[10px] font-mono border border-cyan-500/40">
              {uploadedFiles.length} files
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('permissions_architecture')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'permissions_architecture'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{isFa ? 'نحوه دریافت خودکار مجوزهای دسترسی به کلاستر' : 'Permissions & Cluster Access Architecture'}</span>
        </button>
      </div>

      {/* TAB 1: COMPONENT INSTALLATION GUIDE (WITH SPECIFIC ZIP INSTRUCTIONS) */}
      {activeTab === 'installer_guide' && (
        <div className="space-y-6">
          {/* Target Component Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>{isFa ? 'کامپوننت هدف در اسپلانک را انتخاب کنید:' : 'Select Target Splunk Component:'}</span>
              <span className="text-amber-400 font-normal lowercase font-mono">{isFa ? 'فرمت فایل: ZIP / SPL' : 'Supports .zip & .spl'}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                onClick={() => setSelectedTargetComponent('rhel_standalone')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'rhel_standalone'
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] font-mono text-amber-300 font-bold">RHEL</span>
                </div>
                <span className="text-xs font-bold text-white">RHEL Standalone</span>
                <span className="text-[10px] text-amber-400 font-bold">{isFa ? 'سرور مستقل v1.2.0' : 'Standalone App'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('sh_web')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'sh_web'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono">GUI</span>
                </div>
                <span className="text-xs font-bold text-white">Search Head (Web)</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'از طریق وب اسپلانک' : 'Via Splunk Web'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('sh_cli')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'sh_cli'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-mono">CLI</span>
                </div>
                <span className="text-xs font-bold text-white">Search Head (CLI)</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'دستور unzip لینوکس' : 'Linux unzip'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('heavy_forwarder')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'heavy_forwarder'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono">HF</span>
                </div>
                <span className="text-xs font-bold text-white">Heavy Forwarder</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'گیت‌وی دریافت و پارس' : 'Ingestion Gateway'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('indexer_cluster')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'indexer_cluster'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] font-mono">CM</span>
                </div>
                <span className="text-xs font-bold text-white">Indexer Cluster</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'مسیر master-apps' : 'Via Cluster Master'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('shc_deployer')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'shc_deployer'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-mono">SHC</span>
                </div>
                <span className="text-xs font-bold text-white">SHC (Deployer)</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'مسیر shcluster/apps' : 'Search Head Cluster'}</span>
              </button>

              <button
                onClick={() => setSelectedTargetComponent('deployment_server')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTargetComponent === 'deployment_server'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-mono">DS</span>
                </div>
                <span className="text-xs font-bold text-white">Deployment Server</span>
                <span className="text-[10px] text-slate-400">{isFa ? 'مسیر deployment-apps' : 'Push to Forwarders'}</span>
              </button>
            </div>
          </div>

          {/* Guide Details for Selected Component */}
          {selectedTargetComponent === 'rhel_standalone' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {isFa ? 'راهنمای راه‌اندازی بسته مستقل لینوکس ردهت (RHEL Standalone Server v1.2.0)' : 'RHEL Standalone Linux Server Setup (v1.2.0)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                        NEW BUILD
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isFa 
                        ? 'این پکیج شامل وب‌اپلیکیشن کامل، سرور پروب پورت‌ها و اسکریپت نصب سیستمی لینوکس برای RHEL 8/9, CentOS, Rocky Linux است.' 
                        : 'Self-contained Express & Web UI with built-in systemd installer and TCP socket probing engine.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadRhelPackage}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isFa ? 'دانلود مستقیم پکیج v1.2.0' : 'Download v1.2.0 Tarball'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(`tar -xzf splunk_cluster_doctor_rhel_v1.2.0.tar.gz && cd splunk-doctor && sudo bash setup.sh`, 'rhel_full_cmd')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedPath === 'rhel_full_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPath === 'rhel_full_cmd' ? (isFa ? 'دستور کپی شد!' : 'Copied!') : (isFa ? 'کپی دستور تک‌خطی خودکار' : 'Copy 1-Line Setup')}</span>
                  </button>
                </div>
              </div>

              {/* Master All-in-One Automated Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-violet-500/15 border border-emerald-500/30 text-xs text-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>{isFa ? '🚀 راه‌اندازی ۱۰۰٪ خودکار با یک دستور (بدون نیاز به حذف دستی و تغییر دسترسی‌ها):' : '🚀 100% Automated Setup (No manual uninstalls or chmod required):'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-emerald-300 text-xs flex items-center justify-between border border-emerald-500/30">
                  <code>tar -xzf splunk_cluster_doctor_rhel_v1.2.0.tar.gz && cd splunk-doctor && sudo bash setup.sh</code>
                  <button
                    onClick={() => handleCopy('tar -xzf splunk_cluster_doctor_rhel_v1.2.0.tar.gz && cd splunk-doctor && sudo bash setup.sh', 'master_setup_copy')}
                    className="ml-2 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPath === 'master_setup_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPath === 'master_setup_copy' ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isFa
                    ? '✨ اسکریپت setup.sh تمامی کارهای زیر را خودکار انجام می‌دهد: ۱. متوقف‌سازی و حذف کامل پکیج قبلی ۲. تنظیم و اعطای خودکار کلیه دسترسی‌ها (chmod +x) ۳. نصب و پیکربندی خودکار سرویس دائمی Systemd ۴. بازگشایی فایروال ۵. راستی‌آزمایی و نمایش آدرس سامانه.'
                    : '✨ setup.sh automatically: 1. Cleanly uninstalls previous versions 2. Fixes all file execution permissions 3. Configures systemd service 4. Configures firewall rules 5. Starts and verifies the live web UI.'}
                </p>
              </div>

              {/* Step by step terminal commands */}
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto space-y-2.5 border border-slate-800">
                <div className="text-slate-500"># دستورات تفکیک شده (در صورت تمایل به اجرای مرحله‌به‌مرحله):</div>
                <div className="text-slate-500 mt-1"># ۱. استخراج پکیج در مسیر دلخواه روی سرور لینوکس:</div>
                <div className="text-cyan-300">tar -xzf splunk_cluster_doctor_rhel_v1.2.0.tar.gz</div>
                <div className="text-cyan-300">cd splunk-doctor</div>
                
                <div className="text-slate-500 mt-2"># ۲. اجرای اسکریپت جامع خودکار (پیشنهادی):</div>
                <div className="text-emerald-300"><span className="text-orange-400 font-bold">sudo</span> bash setup.sh</div>

                <div className="text-slate-500 mt-2"># ۳. بررسی وضعیت و لاگ‌ها:</div>
                <div className="text-slate-300"><span className="text-orange-400 font-bold">sudo</span> systemctl status splunk-doctor</div>
                <div className="text-slate-300"><span className="text-orange-400 font-bold">sudo</span> journalctl -u splunk-doctor -f</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'به‌روزرسانی‌های نسخه ۱.۲.۰ در این پکیج:' : 'v1.2.0 Changes in this Package:'}</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
                    <li>{isFa ? 'اصلاح جهت فلش‌های پورت ۹۹۹۷ مستقیماً به سمت ایندکسرها' : '9997 TCP arrows point upwards to Indexers'}</li>
                    <li>{isFa ? 'کارت پایشگر و بازرس لحظه‌ای پورت با کلیک روی هر پورت' : 'Instant Active Port Inspector modal on port click'}</li>
                    <li>{isFa ? 'موتور تست واقعی سوکت TCP از داخل شبکه ردهت' : 'Real Node.js TCP socket probing endpoint'}</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>{isFa ? 'پیش‌نیاز اجرا روی سرور ردهت:' : 'RHEL Server Prerequisites:'}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {isFa 
                      ? 'فقط به Node.js نسخه ۱۸ به بالا نیاز دارید (قابل نصب با دستور sudo dnf install -y nodejs). تمام فایل‌های بیلدشده وب و بک‌اند به صورت خودکار داخل پکیج قرار دارند.'
                      : 'Requires Node.js 18+ (sudo dnf install -y nodejs). All frontend and backend assets are bundled.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {selectedTargetComponent === 'sh_web' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                  GUI
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isFa ? 'نصب مستقیم فایل ZIP از طریق رابط وب اسپلانک (Splunk Web)' : 'Install ZIP directly via Splunk Web UI'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isFa ? 'کنسول وب اسپلانک مستقیماً پسوند .zip را همانند .spl می‌پذیرد و آن را خودکار آنزیپ می‌کند.' : 'Splunk Web natively supports .zip archive uploads without manual extraction.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  {isFa 
                    ? 'نکته مهم: برای نصب فایل ZIP در وب اسپلانک نیازی به تغییر پسوند نیست! اسپلانک فایل‌های .zip، .spl و .tar.gz را در پنجره Install app from file به صورت یکسان پشتیبانی می‌کند.'
                    : 'Splunk natively recognizes both .zip and .spl formats in "Install app from file".'}
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">۱</span>
                  <div>
                    <strong className="text-white block mb-0.5">{isFa ? 'دریافت فایل ZIP:' : 'Download ZIP:'}</strong>
                    {isFa ? 'روی دکمه "دانلود با فرمت ZIP (.zip)" کلیک کنید تا فایل فشرده دریافت شود.' : 'Click "Download as ZIP (.zip)" above.'}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">۲</span>
                  <div>
                    <strong className="text-white block mb-0.5">{isFa ? 'ورود به کنسول اسپلانک وب:' : 'Login to Splunk Web:'}</strong>
                    {isFa ? 'وارد سرچ‌هد خود شوید (مانند http://10.20.30.30:8000).' : 'Access your Search Head UI (port 8000).'}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">۳</span>
                  <div>
                    <strong className="text-white block mb-0.5">{isFa ? 'پنجره مدیریت اپ‌ها:' : 'Manage Apps Window:'}</strong>
                    {isFa ? 'از منوی سمت چپ Apps > Manage Apps > روی دکمه Install app from file کلیک کنید.' : 'Navigate to Apps > Manage Apps > Install app from file.'}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">۴</span>
                  <div>
                    <strong className="text-white block mb-0.5">{isFa ? 'انتخاب فایل زیپ و آپلود:' : 'Select ZIP & Upload:'}</strong>
                    {isFa ? 'فایل .zip را انتخاب کنید، تیک Upgrade app را بزنید و روی Upload کلیک کنید. اسپلانک فایل را اکسترکت و لود می‌کند.' : 'Select your .zip file, check Upgrade app, and click Upload.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTargetComponent === 'sh_cli' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
                    CLI
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isFa ? 'نصب فایل ZIP در خط فرمان لینوکس با دستور unzip' : 'Install ZIP file via Linux Terminal (unzip)'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">unzip &lt;file.zip&gt; -d $SPLUNK_HOME/etc/apps/</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`# ۱. استخراج مستقیم فایل زیپ در مسیر اپ‌های اسپلانک
sudo unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/apps/

# ۲. تنظیم مالکیت کاربری splunk:splunk و پرمیشن اسکریپت‌ها (در صورت وجود پوشه bin)
sudo chown -R splunk:splunk /opt/splunk/etc/apps/splunk_cluster_doctor
[ -d /opt/splunk/etc/apps/splunk_cluster_doctor/bin ] && sudo chmod -R 750 /opt/splunk/etc/apps/splunk_cluster_doctor/bin || echo "[INFO] No bin directory (Standard for config/UI apps)"

# ۳. ریستارت سرویس اسپلانک
sudo -u splunk /opt/splunk/bin/splunk restart

# ۴. بررسی لایه‌ها با btool
sudo -u splunk /opt/splunk/bin/splunk btool check --debug`, 'zip_sh_cli')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedPath === 'zip_sh_cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === 'zip_sh_cli' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی دستورات ZIP' : 'Copy ZIP Bash')}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto space-y-2 border border-slate-800">
                <div className="text-slate-500"># ۱. استخراج فایل زیپ در مسیر etc/apps اسپلانک</div>
                <div><span className="text-amber-400">sudo</span> unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/apps/</div>
                <div className="text-slate-500 mt-2"># ۲. اصلاح مالکیت کاربری و اعطای پرمیشن اجرایی به پوشه bin (در صورت وجود)</div>
                <div><span className="text-amber-400">sudo</span> chown -R splunk:splunk /opt/splunk/etc/apps/splunk_cluster_doctor</div>
                <div>[ -d /opt/splunk/etc/apps/splunk_cluster_doctor/bin ] &amp;&amp; <span className="text-amber-400">sudo</span> chmod -R 750 /opt/splunk/etc/apps/splunk_cluster_doctor/bin || echo &quot;[INFO] No bin directory&quot;</div>
                <div className="text-slate-500 mt-2"># ۳. ریستارت و بارگذاری دشبوردها و اسکریپت‌ها</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk restart</div>
              </div>

              {/* Safe bin check info callout */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{isFa ? 'آیا در فایل‌های شما پوشه bin/ وجود ندارد؟' : 'What if there is no bin/ directory in your files?'}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {isFa 
                    ? 'در اکوسیستم اسپلانک، دایرکتوری bin/ اختیاری (Optional) است. اگر اپلیکیشن شما صرفاً شامل دشبوردها، فیلدها و کانفیگ‌ها است، هیچ نیازی به پوشه bin/ ندارد و بدون مشکل کار می‌کند. دستور بالا به نحوی نوشته شده که اگر پوشه bin وجود نداشته باشد، هیچ خطایی به وجود نیاید.'
                    : 'In Splunk, a bin/ folder is purely optional. UI, knowledge, and config-only apps never require a bin/ directory. The script above conditionally checks for bin/ to prevent "No such file or directory" errors.'}
                </p>
              </div>

              {/* Windows PowerShell Guide */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                <div className="text-amber-400 font-bold mb-1"># دستور مخصوص ویندوز سرور (Windows PowerShell):</div>
                <div className="text-slate-300">Expand-Archive -Path .\splunk_cluster_doctor-1.0.0.zip -DestinationPath &quot;$env:SPLUNK_HOME\etc\apps&quot; -Force</div>
                <div className="text-slate-300">&amp; &quot;$env:SPLUNK_HOME\bin\splunk.exe&quot; restart</div>
              </div>
            </div>
          )}

          {selectedTargetComponent === 'heavy_forwarder' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
                    HF
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isFa ? 'استخراج فایل ZIP روی Heavy Forwarder (hf01.corp.net)' : 'Extract ZIP on Heavy Forwarder'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isFa ? 'نصب اسکریپت عیب‌یاب پایتون و مانیتورینگ صف‌ها روی فورواردر سنگین' : 'Monitors parsing pipelines and queue drops on HF.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`sudo unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/apps/
sudo chown -R splunk:splunk /opt/splunk/etc/apps/splunk_cluster_doctor
[ -d /opt/splunk/etc/apps/splunk_cluster_doctor/bin ] && sudo chmod -R 750 /opt/splunk/etc/apps/splunk_cluster_doctor/bin || echo "[INFO] No bin directory"
sudo -u splunk /opt/splunk/bin/splunk restart splunkd`, 'hf_zip_code')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  {copiedPath === 'hf_zip_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === 'hf_zip_code' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی دستورات HF' : 'Copy Commands')}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto space-y-2 border border-slate-800">
                <div><span className="text-amber-400">sudo</span> unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/apps/</div>
                <div><span className="text-amber-400">sudo</span> chown -R splunk:splunk /opt/splunk/etc/apps/splunk_cluster_doctor</div>
                <div>[ -d /opt/splunk/etc/apps/splunk_cluster_doctor/bin ] &amp;&amp; <span className="text-amber-400">sudo</span> chmod -R 750 /opt/splunk/etc/apps/splunk_cluster_doctor/bin || echo &quot;[INFO] No bin directory&quot;</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk restart splunkd</div>
              </div>
            </div>
          )}

          {selectedTargetComponent === 'indexer_cluster' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black">
                    CM
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isFa ? 'استقرار فایل ZIP روی کلاستر ایندکسرها از طریق Cluster Master' : 'Deploy ZIP to Indexer Cluster via Cluster Master'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">مسیر استخراج: $SPLUNK_HOME/etc/master-apps/</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`sudo unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/master-apps/
sudo chown -R splunk:splunk /opt/splunk/etc/master-apps/splunk_cluster_doctor
sudo -u splunk /opt/splunk/bin/splunk validate cluster-bundle
sudo -u splunk /opt/splunk/bin/splunk apply cluster-bundle --answer-yes`, 'cm_zip_code')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  {copiedPath === 'cm_zip_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === 'cm_zip_code' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی دستورات CM' : 'Copy CM')}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-orange-300 overflow-x-auto space-y-2 border border-slate-800">
                <div className="text-slate-500"># ۱. در سرور Cluster Master (10.20.30.55)، فایل ZIP را در master-apps آنزیپ کنید:</div>
                <div><span className="text-amber-400">sudo</span> unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/master-apps/</div>
                <div><span className="text-amber-400">sudo</span> chown -R splunk:splunk /opt/splunk/etc/master-apps/splunk_cluster_doctor</div>
                <div className="text-slate-500 mt-2"># ۲. اعتبارسنجی باندل کلاستر قبل از انتشار:</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk validate cluster-bundle</div>
                <div className="text-slate-500 mt-2"># ۳. اعمال روی تمام ایندکسرها بدون دان‌تایم:</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk apply cluster-bundle --answer-yes</div>
              </div>
            </div>
          )}

          {selectedTargetComponent === 'shc_deployer' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black">
                    SHC
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isFa ? 'استقرار فایل ZIP در کلاستر سرچ‌هدها (SHC) از طریق Deployer' : 'Deploy ZIP to SHC via Deployer'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">مسیر: $SPLUNK_HOME/etc/shcluster/apps/</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`sudo unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/shcluster/apps/
sudo chown -R splunk:splunk /opt/splunk/etc/shcluster/apps/splunk_cluster_doctor
sudo -u splunk /opt/splunk/bin/splunk apply shcluster-bundle -target https://10.20.30.30:8089`, 'shc_zip_code')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  {copiedPath === 'shc_zip_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === 'shc_zip_code' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی دستورات Deployer' : 'Copy Deployer')}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-purple-300 overflow-x-auto space-y-2 border border-slate-800">
                <div><span className="text-amber-400">sudo</span> unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/shcluster/apps/</div>
                <div><span className="text-amber-400">sudo</span> chown -R splunk:splunk /opt/splunk/etc/shcluster/apps/splunk_cluster_doctor</div>
                <div className="text-slate-500 mt-2"># ارسال به سرچ‌هد کاپیتان:</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk apply shcluster-bundle -target https://10.20.30.30:8089</div>
              </div>
            </div>
          )}

          {selectedTargetComponent === 'deployment_server' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
                    DS
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isFa ? 'انتشار فایل ZIP به تمام فورواردرها از طریق Deployment Server' : 'Mass Deployment via Deployment Server'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">مسیر: $SPLUNK_HOME/etc/deployment-apps/</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`sudo unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/deployment-apps/
sudo chown -R splunk:splunk /opt/splunk/etc/deployment-apps/splunk_cluster_doctor
sudo -u splunk /opt/splunk/bin/splunk reload deploy-server`, 'ds_zip_code')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  {copiedPath === 'ds_zip_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === 'ds_zip_code' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی دستورات DS' : 'Copy DS')}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-blue-300 overflow-x-auto space-y-2 border border-slate-800">
                <div><span className="text-amber-400">sudo</span> unzip -o splunk_cluster_doctor-1.0.0.zip -d /opt/splunk/etc/deployment-apps/</div>
                <div><span className="text-amber-400">sudo</span> chown -R splunk:splunk /opt/splunk/etc/deployment-apps/splunk_cluster_doctor</div>
                <div className="text-slate-500 mt-2"># ریلود فوری سرور استقرار:</div>
                <div><span className="text-amber-400">sudo</span> -u splunk /opt/splunk/bin/splunk reload deploy-server</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKAGE FILE EXPLORER */}
      {activeTab === 'package_files' && (
        <div className="space-y-4">
          {/* Architecture Explainer Callout regarding bin directory */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold flex-shrink-0 text-xs">
                bin/
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isFa ? 'راهنمای ساختار فایل‌ها: آیا دایرکتوری bin/ در اپلیکیشن‌های اسپلانک الزامی است؟' : 'Directory Guide: Is the bin/ folder required in Splunk Apps?'}</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-4xl leading-relaxed">
                  {isFa 
                    ? 'خیر! در استاندارد توسعه اسپلانک، پوشه bin/ کاملاً اختیاری (Optional) است. اپلیکیشن‌هایی که فقط شامل دشبوردها، ویوها، فیلدها و کانفیگ‌ها هستند نیازی به پوشه bin ندارند. این پوشه صرفاً برای اسکریپت‌های اجرایی پایتون یا Bash (جهت Scripted Inputs یا Custom Commands) استفاده می‌شود. در پکیج ما، ۲ اسکریپت پایتون و شل در پوشه bin/ برای عیب‌یابی عمیق تعبیه شده است.'
                    : 'No! In Splunk app architecture, the bin/ folder is purely optional. Apps consisting only of dashboards, knowledge objects, and configuration files work without a bin/ directory. It is only required for custom Python/Bash scripts or modular inputs.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setFileFilterCategory('bin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  fileFilterCategory === 'bin'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{isFa ? 'مشاهده فایل‌های bin/' : 'View bin/ Files'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  {isFa ? 'محتویات داخل فایل ZIP/SPL:' : 'Archive Hierarchy:'}
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {SPLUNK_APP_FILES.filter(f => {
                    if (fileFilterCategory === 'bin') return f.path.startsWith('bin/') || f.category === 'scripts';
                    if (fileFilterCategory === 'default') return f.path.startsWith('default/') || f.category === 'config' || f.category === 'ui';
                    if (fileFilterCategory === 'metadata') return f.path.startsWith('metadata/');
                    if (fileFilterCategory === 'root') return !f.path.includes('/');
                    return true;
                  }).length} / {SPLUNK_APP_FILES.length} Files
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  { id: 'all', labelFa: 'همه', labelEn: 'All' },
                  { id: 'bin', labelFa: '📁 bin/ (اسکریپت‌ها)', labelEn: '📁 bin/' },
                  { id: 'default', labelFa: '📁 default/', labelEn: '📁 default/' },
                  { id: 'metadata', labelFa: '📁 metadata/', labelEn: '📁 metadata/' },
                  { id: 'root', labelFa: '📄 ریشه', labelEn: '📄 Root' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFileFilterCategory(tab.id as 'all' | 'bin' | 'default' | 'metadata' | 'root')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                      fileFilterCategory === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {isFa ? tab.labelFa : tab.labelEn}
                  </button>
                ))}
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {SPLUNK_APP_FILES.map((f, idx) => {
                  // Filter based on category
                  if (fileFilterCategory === 'bin' && !(f.path.startsWith('bin/') || f.category === 'scripts')) return null;
                  if (fileFilterCategory === 'default' && !(f.path.startsWith('default/') || f.category === 'config' || f.category === 'ui')) return null;
                  if (fileFilterCategory === 'metadata' && !f.path.startsWith('metadata/')) return null;
                  if (fileFilterCategory === 'root' && f.path.includes('/')) return null;

                  const isSelected = selectedFileIndex === idx;
                  const isBinFile = f.path.startsWith('bin/');

                  return (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-950/40 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isBinFile ? (
                          <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            py
                          </span>
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{f.path}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold flex-shrink-0 ${isBinFile ? 'text-amber-400' : 'text-slate-500'}`}>
                        {f.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs font-bold">
                      {selectedFile.path}
                    </span>
                    {selectedFile.path.startsWith('bin/') && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                        {isFa ? 'اسکریپت اجرایی پوشه bin' : 'Executable in bin/'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isFa ? selectedFile.descriptionFa : selectedFile.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedFile.content, selectedFile.path)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedPath === selectedFile.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPath === selectedFile.path ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی محتوا' : 'Copy Content')}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] border border-slate-800/80 leading-relaxed">
                <pre>
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER ZIP ANALYZER & AUDITOR */}
      {activeTab === 'zip_analyzer' && (
        <div className="space-y-6">
          {/* Upload Dropzone / Trigger */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 transition flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {uploadedZipName 
                  ? (isFa ? `فایل زیپ بارگذاری‌شده: ${uploadedZipName}` : `Loaded ZIP: ${uploadedZipName}`)
                  : (isFa ? 'بارگذاری و آنالیز تخصصی فایل ZIP خودتان' : 'Upload & Audit Your Own Splunk App ZIP')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                {isFa 
                  ? 'اگر فایل اپلیکیشن اسپلانک به صورت .zip دارید، آن را انتخاب کنید تا تمامی فایل‌های کانفیگ، اسکریپت‌های پایتون، مجوزها و خطاهای بحرانی آن را به صورت بلادرنگ اسکن کنیم.'
                  : 'Drop your custom Splunk App .zip file here. We will parse and audit all .conf, scripts, and permissions.'}
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isFa ? 'انتخاب فایل ZIP دیگر...' : 'Browse ZIP File...'}</span>
            </button>
          </div>

          {/* Audit Results if zip is loaded */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-6">
              {/* Findings Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">{isFa ? 'تعداد کل فایل‌های استخراج‌شده' : 'Extracted Files'}</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{uploadedFiles.length}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">{isFa ? 'خطاهای امنیتی و ساختاری شناسایی‌شده' : 'Detected Issues'}</div>
                  <div className={`text-2xl font-black font-mono ${zipFindings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {zipFindings.length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">{isFa ? 'وضعیت سلامت بسته (Splunk AppInspect)' : 'Package Health Status'}</div>
                  <div className={`text-base font-bold flex items-center gap-1.5 ${zipFindings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {zipFindings.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{zipFindings.length > 0 ? (isFa ? 'نیازمند اصلاح و بهینه‌سازی' : 'Action Required') : (isFa ? 'کاملاً سالم و استاندارد' : 'Clean & Certified')}</span>
                  </div>
                </div>
              </div>

              {/* Missing bin/ directory resolution and injection card */}
              {!uploadedFiles.some(f => f.path.toLowerCase().includes('/bin/') || f.path.toLowerCase().startsWith('bin/')) && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      bin/
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{isFa ? 'پوشه bin/ در این فایل زیپ وجود ندارد (آیا مایلید اضافه شود؟)' : 'No bin/ directory in your ZIP (Would you like to inject it?)'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          {isFa ? 'نرمال در اپ‌های دشبورد' : 'Normal for UI Apps'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {isFa 
                          ? 'در ساختار اسپلانک، اپ‌های دشبورد و کانفیگ نیازی به bin ندارند. اما اگر می‌خواهید اسکریپت‌های پایتون و مانیتورینگ سلامت را به فایل زیپ خود اضافه کنید، روی دکمه زیر کلیک کنید تا پوشه bin/ به صورت خودکار به فایل زیپ شما الحاق و دانلود شود.'
                          : 'In Splunk, config and UI apps do not require a bin/ folder. If you want to include Python scripted inputs and diag collectors, click the button to inject bin/.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleInjectBinToUploadedZip}
                      disabled={isInjectingBin}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Folder className="w-4 h-4" />
                      <span>
                        {isInjectingBin 
                          ? (isFa ? 'در حال افزودن bin/ ...' : 'Injecting...') 
                          : (isFa ? '+ افزودن پوشه bin/ به این فایل و دانلود' : '+ Inject bin/ & Download')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {injectSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{isFa ? 'پوشه bin/ با موفقیت به فایل زیپ اضافه شد و نسخه جدید دانلود گردید.' : 'bin/ folder injected and package downloaded successfully.'}</span>
                </div>
              )}

              {/* Detected Issues List */}
              {zipFindings.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{isFa ? 'ایرادات و آسیب‌پذیری‌های کشف‌شده در فایل زیپ شما:' : 'Vulnerabilities & Anomalies Found in Your ZIP:'}</span>
                  </h4>

                  <div className="space-y-2">
                    {zipFindings.map((finding, fIdx) => (
                      <div key={fIdx} className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {finding.severity}
                            </span>
                            {finding.title}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{finding.file}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{finding.description}</p>
                        <div className="text-[11px] text-amber-300 font-mono pt-1">
                          💡 <strong>{isFa ? 'راهکار رفع مشکل:' : 'Fix:'}</strong> {finding.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files Browser & Code Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span>{isFa ? 'فایل‌های داخل ZIP:' : 'Files in ZIP:'}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{uploadedFiles.length}</span>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                    {uploadedFiles.map((f, idx) => {
                      const isSelected = selectedUploadedFileIndex === idx;
                      return (
                        <button
                          key={f.path}
                          onClick={() => setSelectedUploadedFileIndex(idx)}
                          className={`w-full text-left p-2 rounded-xl text-xs font-mono transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                              : 'bg-slate-950/40 border border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{f.path}</span>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">{f.size} B</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {selectedUploadedFile?.path || 'No file selected'}
                    </span>
                    {selectedUploadedFile && (
                      <button
                        onClick={() => handleCopy(selectedUploadedFile.content, selectedUploadedFile.path)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition"
                      >
                        {copiedPath === selectedUploadedFile.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPath === selectedUploadedFile.path ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی کد' : 'Copy')}</span>
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed">
                    <pre>
                      <code>{selectedUploadedFile?.content || ''}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERMISSIONS & CLUSTER ACCESS ARCHITECTURE */}
      {activeTab === 'permissions_architecture' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white">
              {isFa 
                ? 'معماری و نحوه دریافت خودکار مجوزهای دسترسی سراسری (Instant Cluster-Wide Access)' 
                : 'Automated Zero-Credential Cluster Access Architecture'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isFa 
                ? 'پاسخ به سوال شما: چگونه این اپلیکیشن بدون نیاز به وارد کردن دستی پسورد یا کانفیگ اضافه، تمام دسترسی‌های لازم به تمام کامپوننت‌های کلاستر را بلافاصله دریافت می‌کند؟'
                : 'How the app achieves immediate, uninhibited cluster-wide visibility without storing cleartext credentials.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                ۱
              </div>
              <h4 className="text-sm font-bold text-white">
                {isFa ? 'مکانیزم سیستمی passAuth' : 'passAuth System Delegation'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa 
                  ? 'در فایل inputs.conf از ویژگی passAuth = splunk-system-user استفاده شده است. با این قابلیت، دیمن splunkd به صورت خودکار یک توکن احرازهویت موقت سطح ادمین را مستقیماً در ورودی استاندارد (stdin) اسکریپت پایتون تزریق می‌کند.'
                  : 'By setting passAuth = splunk-system-user in inputs.conf, splunkd automatically injects a temporal administrative REST session key directly into stdin.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                ۲
              </div>
              <h4 className="text-sm font-bold text-white">
                {isFa ? 'انتشار سراسری با export = system' : 'Global Object Export'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa 
                  ? 'در فایل metadata/default.meta عبارت export = system تعریف شده است. این دستور تضمین می‌کند که دشبوردها، فیلدهای استخراج‌شده، جستجوها و دستورات این اپلیکیشن در تمام کلاستر و برای تمام کاربران و سایر اپ‌ها قابل دسترسی باشند.'
                  : 'metadata/default.meta defines export = system, making views, searches, and correlation alerts globally accessible across all apps and distributed peers.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ۳
              </div>
              <h4 className="text-sm font-bold text-white">
                {isFa ? 'قابلیت‌های مجاز در authorize.conf' : 'Explicit Capabilities'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa 
                  ? 'تعریف دسترسی‌های run_btool (بررسی کانفیگ‌ها)، rest_properties_set (خواندن و اصلاح تنظیمات)، indexes_edit و admin_all_objects در نقش اختصاصی اپ جهت اجرای بررسی‌های سطح عمیق بدون بن‌بست دسترسی.'
                  : 'authorize.conf configures run_btool, admin_all_objects, and REST properties capabilities to ensure unhindered inspection of indexers, queues, and peers.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFLINE TOOLS & INSTALLERS MATRIX */}
      {activeTab === 'offline_tools_matrix' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                  AIR-GAPPED READY
                </span>
                <span className="text-xs text-slate-400 font-mono">100% Offline Installation</span>
              </div>
              <h3 className="text-xl font-black text-white">
                {isFa 
                  ? 'ماتریس کامل ابزارهای نصبی و اسکریپت‌های خودکار (محیط‌های ایزوله بدون اینترنت)' 
                  : 'Air-Gapped Tool Installers & Automation Scripts Matrix'}
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {isFa 
                  ? 'پاسخ شفاف به سوالات شما: تمام اسکریپت‌های نصب آفلاین برای داکر (Docker)، کوبرنتیز (K3s Kubernetes)، هوش مصنوعی محلی (Local AI) و اسپلانک درون خود پکیج قرار داده شده‌اند. برای نصب و اعطای دسترسی‌های کامل سیستمی کافیست اسکریپت مربوطه را از دایرکتوری برنامه اجرا کنید.'
                  : 'All offline installer scripts for Docker, K8s, Python, and Local AI are pre-packaged inside the program repository.'}
              </p>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tool 1: Master Installer Script */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  Master Script
                </span>
                <span className="text-[10px] font-mono text-slate-400">setup.sh</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'نصاب مستر ۱۰۰٪ خودکار (Master Setup)' : 'Master All-in-One Installer'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'حذف کامل نسخه قبلی، کپی فایل‌ها به /opt/splunk-doctor، اعطای خودکار دسترسی chmod 755، ایجاد سرویس systemd و باز کردن پورت‌های ۳۰۰۰، ۸۰۰۱، ۸۰۹۰ و ۹۹۹۸ در فایروال.'
                  : 'Clean uninstall of previous instances, copy to /opt/splunk-doctor, set chmod 755, install systemd service, and configure firewalld.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 flex items-center justify-between">
                <code>sudo bash setup.sh</code>
                <button
                  onClick={() => handleCopy('sudo bash setup.sh', 'setup_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'setup_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tool 2: Docker Engine & Podman */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                  Container Engine
                </span>
                <span className="text-[10px] font-mono text-slate-400">Docker / Podman</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'نصاب آفلاین داکر و پودمن' : 'Offline Docker & Podman Installer'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'اسکریپت شناسایی و نصب آفلاین RPMهای داکر بدون اینترنت. در صورت عدم وجود داکر، از پودمن محلی یا موتور Standalone اسپلانک استفاده می‌کند.'
                  : 'Air-gapped installer for local Docker RPMs or Podman container engine with zero external internet dependencies.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 flex items-center justify-between">
                <code className="text-[11px]">sudo bash scripts/install-offline-docker-k8s.sh</code>
                <button
                  onClick={() => handleCopy('sudo bash scripts/install-offline-docker-k8s.sh', 'docker_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'docker_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tool 3: Kubernetes Runtime */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-violet-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 font-mono text-xs font-bold border border-violet-500/30">
                  Kubernetes (K3s)
                </span>
                <span className="text-[10px] font-mono text-slate-400">K3s Binary</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-400" />
                <span>{isFa ? 'راه‌اندازی کوبرنتیز تک‌باینری (K3s)' : 'K3s Kubernetes Runtime'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'استقرار فایل باینری کوبرنتیز تک‌فایل در /usr/local/bin/k3s و راه‌اندازی کلاستر محلی جهت اجرای اپراتور و کانتینرهای اسپلانک.'
                  : 'Deploys lightweight single-binary K3s Kubernetes runtime and configures local kubeconfig for Splunk Operator.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-violet-300 flex items-center justify-between">
                <code className="text-[11px]">sudo bash scripts/deploy-splunk-k8s-offline.sh</code>
                <button
                  onClick={() => handleCopy('sudo bash scripts/deploy-splunk-k8s-offline.sh', 'k8s_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'k8s_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tool 4: Local AI Auto-Healer */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-300/30">
                  Local AI Healer
                </span>
                <span className="text-[10px] font-mono text-slate-400">Python 3</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>{isFa ? 'موتور ترمیمی هوش مصنوعی محلی' : 'Local AI Auto-Healer Engine'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'موتور تشخیص هوشمند کدهای لینوکس و اسپلانک به صورت ۱۰۰٪ آفلاین؛ رفع عدم تطابق mgmtHostPort در web.conf، آزادسازی سوکت‌ها و استارت سرویس.'
                  : 'Embedded offline AI engine that analyzes logs, modifies web.conf/server.conf, releases sockets, and starts daemon.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between">
                <code className="text-[11px]">python3 scripts/traffic-tools.py role</code>
                <button
                  onClick={() => handleCopy('python3 scripts/traffic-tools.py role', 'ai_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'ai_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tool 5: Parallel Splunk Engine */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  Parallel Splunk
                </span>
                <span className="text-[10px] font-mono text-slate-400">/opt/splunk_parallel</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'اسپلانک موازی با پورت‌های ایزوله' : 'Isolated Parallel Splunk Engine'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'ساخت خودکار پوشه /opt/splunk_parallel، لینک باینری‌ها، تنظیم پورت وب ۸۰۰۱، REST پورت ۸۰۹۰ و اینجستر ۹۹۹۸ بدون تداخل با اسپلانک اصلی.'
                  : 'Provisions parallel Splunk runtime environment with web port 8001, REST 8090, and TCP 9998 without host collisions.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between">
                <code className="text-[10px]">bash scripts/fix-parallel-web.sh /opt/splunk_parallel 8001 8090 9998 8193</code>
                <button
                  onClick={() => handleCopy('bash scripts/fix-parallel-web.sh /opt/splunk_parallel 8001 8090 9998 8193', 'parallel_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'parallel_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tool 6: Network & Port Diagnostics */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  Network Diag
                </span>
                <span className="text-[10px] font-mono text-slate-400">ss / netstat</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'تست و پروب زنده پورت‌ها' : 'Live Socket & Port Reachability'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isFa 
                  ? 'بررسی وضعیت لیسنر پورت‌های ۸۰۰۰، ۸۰۰۱، ۸۰۸۹، ۸۰۹۰، ۹۹۹۷، ۹۹۹۸ و آزادسازی سوکت‌های بلاتکلیف با fuser.'
                  : 'Inspects listening TCP sockets on ports 8000, 8001, 8089, 8090, 9997, 9998 and clears zombie socket locks.'}
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 flex items-center justify-between">
                <code className="text-[11px]">fuser -k 8001/tcp 8090/tcp 9998/tcp</code>
                <button
                  onClick={() => handleCopy('fuser -k 8001/tcp 8090/tcp 9998/tcp', 'fuser_cmd')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  {copiedPath === 'fuser_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
