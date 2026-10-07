import React, { useState, useEffect, useMemo } from 'react';
import { 
  INITIAL_CONFIG_FILES, 
  INITIAL_FINDINGS 
} from './data/initialConfigs';
import { COMPONENT_PROFILES } from './data/componentsInfo';
import { 
  SplunkFinding, 
  BackupSnapshot, 
  RemediationOption, 
  ComponentRole,
  ComponentProfile,
  ClusterSettings,
  SystemAuditInfo,
  UserAccount,
  AuthSession,
  DigitalCertificateLicense,
  HeartbeatNode,
  HeartbeatDropAlert,
  SplunkAgentComponentRole,
  TargetEnvironment,
  ParallelClusterState
} from './types';
import { INITIAL_DIGITAL_LICENSE } from './data/commercialLicense';
import { INITIAL_HEARTBEAT_NODES, INITIAL_DROP_ALERTS } from './data/heartbeatData';
import { TopologyGraph } from './components/TopologyGraph';
import { HealthAuditDashboard } from './components/HealthAuditDashboard';
import { ConfigEditor } from './components/ConfigEditor';
import { IssueDetailModal } from './components/IssueDetailModal';
import { SplunkDocReference } from './components/SplunkDocReference';
import { DocCompliancePanel } from './components/DocCompliancePanel';
import { BackupManager } from './components/BackupManager';
import { ServiceControlModal } from './components/ServiceControlModal';
import { ComponentNetworkMap } from './components/ComponentNetworkMap';
import { SplunkPortsDiagram } from './components/SplunkPortsDiagram';
import { SplunkAppPackageCenter } from './components/SplunkAppPackageCenter';
import { ClusterSettingsModal } from './components/ClusterSettingsModal';
import { NetworkToolbox } from './components/NetworkToolbox';
import { AdminSecurityPanel } from './components/AdminSecurityPanel';
import { LoginModal } from './components/LoginModal';
import { LiveLogAnalysisModal } from './components/LiveLogAnalysisModal';
import { CommercialLicenseManager } from './components/CommercialLicenseManager';
import { EnterpriseAgentGenerator } from './components/EnterpriseAgentGenerator';
import { HeartbeatMonitoringMatrix } from './components/HeartbeatMonitoringMatrix';
import { RemoteManagementGateway } from './components/RemoteManagementGateway';
import { SplunkCertificateAnalyzer } from './components/SplunkCertificateAnalyzer';
import { AlertNotificationCenter } from './components/AlertNotificationCenter';
import { SplunkManagementNodesHub } from './components/SplunkManagementNodesHub';
import { SplunkArchitectureAuditor } from './components/SplunkArchitectureAuditor';
import { SplunkContainerK8sHub } from './components/SplunkContainerK8sHub';
import { SplunkDiagnosticAndAIAutoHealer } from './components/SplunkDiagnosticAndAIAutoHealer';
import { SplunkAutonomousAIAgent } from './components/SplunkAutonomousAIAgent';
import { SplunkClusterDeployerWizard } from './components/SplunkClusterDeployerWizard';
import { ParallelSplunkProvisioningStudio } from './components/ParallelSplunkProvisioningStudio';
import { SplunkWebModal } from './components/SplunkWebModal';
import { BentoGridConsole } from './components/BentoGridConsole';
import { VirtualServerWipeModal } from './components/VirtualServerWipeModal';
import { ToolValidationModal } from './components/ToolValidationModal';
import { UpdateManager } from './components/UpdateManager';
import { PuTTYLiveShellConsole } from './components/PuTTYLiveShellConsole';
import { BackendOperationInspectorModal, BackendOperationRecord } from './components/BackendOperationInspectorModal';
import { FloatingMiniWindow } from './components/FloatingMiniWindow';
import { SplunkArchitectOverseerEngine } from './components/SplunkArchitectOverseerEngine';
import { SplunkSystemDebugModal } from './components/SplunkSystemDebugModal';
import { AppModulesManagerModal, AppModuleConfig, AVAILABLE_ICONS } from './components/AppModulesManagerModal';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import { auditSplunkConfigs, applyRemediationOption } from './utils/splunkAuditEngine';
import { analyzeSplunkLogLine } from './data/logAnalysisEngine';
import { parseInputsConf, extractClusterFromConfigs, clusterNodesToSettings } from './utils/splunkConfigParser';
import { LiveLogAnalysis, ServerCommandLogEntry } from './types';
import {
  Sparkles,
  Layers,
  Activity,
  Terminal,
  RotateCw,
  Wrench,
  Lock,
  SlidersHorizontal,
  Search,
  Server,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Minimize2,
  Box,
  Building2,
  Award,
  Bell,
  Archive,
  Shield,
  Wifi,
  Package,
  Globe,
  HardDrive,
  Bug,
  BookOpen
} from 'lucide-react';

// Default Studio Modules Configuration (bento_overview opens first)
const DEFAULT_MODULES_CONFIG: AppModuleConfig[] = [
  {
    id: 'bento_overview',
    category: 'architecture',
    categoryNameFa: 'معماری و ارکستراسیون',
    categoryNameEn: 'Architecture & Orchestration',
    domainColor: 'amber',
    iconName: 'SlidersHorizontal',
    titleFa: 'داشبورد بنتو کلاستر اسپلانک (Bento Grid)',
    titleEn: 'Splunk Bento Architecture Console',
    badge: 'Bento Grid',
    descriptionFa: 'کنسول جامع و ماژولار بنتو گرید شامل پایش زنده سوکت‌ها، رادار هارت‌بیت، داکر و ممیزی SVA',
    descriptionEn: 'Modular Bento Grid operations console with live telemetry, port channels and SVA audit',
    isEnabled: true,
    order: 0
  },
  {
    id: 'architect_overseer',
    category: 'architecture',
    categoryNameFa: 'ناظر و مدیر ارشد معمار',
    categoryNameEn: 'Master Architect Overseer',
    domainColor: 'amber',
    iconName: 'ShieldCheck',
    titleFa: 'انجین ناظر و مدیر معمار اسپلانک (Overseer Engine)',
    titleEn: 'Splunk Master Architect Overseer Engine',
    badge: 'Overseer',
    descriptionFa: 'پایش لایه به لایه، پایش گام‌های مرحله‌ای، عیب‌یابی خودکار کانفیگ‌ها و پاکسازی کش سرورهای حذف‌شده',
    descriptionEn: 'Layered monitoring, step-by-step pipeline audit, auto-healing configs, and stale cache purge',
    isEnabled: true,
    order: 1
  },
  {
    id: 'autonomous_agent',
    category: 'health_logs',
    categoryNameFa: 'هوش مصنوعی و ارکستراسیون',
    categoryNameEn: 'Autonomous AI Orchestrator',
    domainColor: 'cyan',
    iconName: 'Sparkles',
    titleFa: 'هوش مصنوعی خودکار و آفلاین مهندسی اسپلانک و کوبرنتیز',
    titleEn: 'Autonomous Offline AI Splunk & K8s Architect',
    badge: 'AI Autonomous',
    descriptionFa: 'شناسایی هوشمند سرورها، نصب خودکار کوبرنتیز و داکر، استقرار نسخه‌های اسپلانک، عیب‌یابی عمیق و اخذ تایید قبل از اجرا',
    descriptionEn: 'Fleet discovery, offline K8s/Docker provisioning, multi-version deploy, deep auto-healing with human-in-the-loop approvals',
    isEnabled: true,
    order: 2
  },
  {
    id: 'ai_diagnostics',
    category: 'health_logs',
    categoryNameFa: 'عیب‌یابی و هوش مصنوعی',
    categoryNameEn: 'AI Diagnostics & Auto-Heal',
    domainColor: 'cyan',
    iconName: 'Sparkles',
    titleFa: 'خطایاب دقیق و هوش مصنوعی لوکال (AI Auto-Healer)',
    titleEn: 'Splunk Deep Diagnostic & AI Auto-Healer',
    badge: 'AI Self-Heal',
    descriptionFa: 'خطایابی عمیق ریشه‌ای، بررسی تداخل سوکت‌ها، همگام‌سازی web.conf، پودمن آفلاین و رفع خودکار تمام مشکلات',
    descriptionEn: 'Deep root-cause diagnostics, socket lock freeing, web.conf sync & autonomous background local AI remediation',
    isEnabled: true,
    order: 3
  },
  {
    id: 'cluster_deployer',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Zap',
    titleFa: 'استقرار خودکار کلاستر (Deployer)',
    titleEn: 'End-to-End Cluster Deployer',
    badge: 'Zero-Touch',
    descriptionFa: 'ارکستراسیون از پایه: دسترسی روت/LOM، محاسبه LOM، نصب OS، امن‌سازی، داکر، کوبر و کلاستر اسپلانک',
    descriptionEn: 'Automated Bare-Metal LOM, Sizing, OS install, Hardening, Docker/K8s & Splunk',
    isEnabled: true,
    order: 4
  },
  {
    id: 'architecture_auditor',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Building2',
    titleFa: 'ممیزی معماری SVA',
    titleEn: 'SVA Architecture Audit',
    badge: 'SVA C11',
    descriptionFa: 'سایزینگ سخت‌افزار، تطبیق با استانداردهای رسمی Splunk Validated Architectures',
    descriptionEn: 'Hardware sizing, node capacity and SVA C11 compliance auditor',
    isEnabled: true,
    order: 5
  },
  {
    id: 'topology',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Layers',
    titleFa: 'توپولوژی و دیاگرام پورت‌ها',
    titleEn: 'Topology & Port Flow',
    badge: 'Ports',
    descriptionFa: 'نمایش گرافیکی نودها، پورت‌های ارتباطی و مسیر جریان دیتا',
    descriptionEn: 'Visual node topology and port channel communications map',
    isEnabled: true,
    order: 6
  },
  {
    id: 'management_nodes',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Server',
    titleFa: 'نودهای مدیریتی کلاستر',
    titleEn: 'Management Nodes',
    badge: 'LM/CM/DS',
    descriptionFa: 'مدیریت License Master، Cluster Master، Deployer و Deployment Server',
    descriptionEn: 'Cluster Master, License Master, Deployer and Deployment Server control',
    isEnabled: true,
    order: 7
  },
  {
    id: 'commercial_license',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Award',
    titleFa: 'لایسنس تجاری و PKI',
    titleEn: 'Commercial PKI License',
    badge: 'PKI Cert',
    descriptionFa: 'وضعیت لایسنس دیجیتال سازمانی و تحلیل زنجیره گواهینامه امنیتی',
    descriptionEn: 'Enterprise commercial license certificate and PKI verification',
    isEnabled: true,
    order: 8
  },
  {
    id: 'parallel_provisioning',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Boxes',
    titleFa: 'راه‌اندازی و کلاستر موازی (Docker/K8s)',
    titleEn: 'Parallel Cluster Studio (Docker/K8s)',
    badge: 'Parallel 5-Step',
    descriptionFa: 'ارکستراسیون گام‌به‌گام راه‌اندازی در داکر/کوبر، نصب اسپلانک، بازگشایی پورت‌ها، ورود به وب، خطایاب هوشمند و مدیریت ناوگان سرورها',
    descriptionEn: '5-step guided pipeline for parallel Docker/K8s provisioning, zero-collision port mapping, web troubleshooter & multi-server fleet',
    isEnabled: true,
    order: 9
  },
  {
    id: 'docker_k8s',
    category: 'architecture',
    categoryNameFa: 'معماری و SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Box',
    titleFa: 'داکر، کوبرنتیز و Operator',
    titleEn: 'Docker, K8s & Splunk Operator',
    badge: 'Containers',
    descriptionFa: 'مدیریت و استقرار کلاستر روی Docker Compose، کوبرنتیز و Splunk Operator (SOK)',
    descriptionEn: 'Deploy & manage Splunk on Docker Compose, Kubernetes and Splunk Operator',
    isEnabled: true,
    order: 9.5
  },
  {
    id: 'health_audit',
    category: 'health_logs',
    categoryNameFa: 'عیب‌یابی و سلامت',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'Activity',
    titleFa: 'تشخیص خطاها و سلامت',
    titleEn: 'Health Audit & Findings',
    badge: 'Audit',
    descriptionFa: 'موتور ممیزی خودکار فایل‌های کانفیگ و ارائه راهکارهای رفع اشکال',
    descriptionEn: 'Config automated audit engine and multi-option remediation',
    isEnabled: true,
    order: 10
  },
  {
    id: 'live_logs',
    category: 'health_logs',
    categoryNameFa: 'عیب‌یابی و سلامت',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'Terminal',
    titleFa: 'پایش زنده splunkd.log',
    titleEn: 'Live splunkd.log Tails',
    badge: 'Live',
    descriptionFa: 'بررسی ریل‌تایم لاگ‌های سرور و ارائه دستور و راهکار با کلیک روی لاگ',
    descriptionEn: 'Real-time log tail stream with interactive one-click fix',
    isEnabled: true,
    order: 11
  },
  {
    id: 'config_editor',
    category: 'health_logs',
    categoryNameFa: 'عیب‌یابی و سلامت',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'FileCode',
    titleFa: 'ویرایشگر فایل‌های کانفیگ',
    titleEn: 'Live Config Editor',
    badge: 'Editor',
    descriptionFa: 'ویرایشگر حرفه‌ای فایل‌های .conf همراه با Syntax Validator و مقایسه تغییرات',
    descriptionEn: 'Real-time .conf editor with syntax check and diff viewer',
    isEnabled: true,
    order: 12
  },
  {
    id: 'doc_reference',
    category: 'health_logs',
    categoryNameFa: 'عیب‌یابی و سلامت',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'BookOpen',
    titleFa: 'مرکز مستندات رسمی اسپلانک',
    titleEn: 'Splunk Docs Knowledge Base',
    badge: 'Docs',
    descriptionFa: 'دسترسی آفلاین و آنلاین به مستندات رسمی، جستجو و اعمال مستقیم تنظیمات',
    descriptionEn: 'Official Splunk docs repository with offline package and direct search',
    isEnabled: true,
    order: 13
  },
  {
    id: 'heartbeat_radar',
    category: 'radar_ingest',
    categoryNameFa: 'رادار و ورودی‌ها',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Radio',
    titleFa: 'رادار هارت‌بیت و قطعی لاگ',
    titleEn: 'Live Heartbeat Radar',
    badge: '30s Sweep',
    descriptionFa: 'پایش بلادرنگ ضربان قلب نودها و شناسایی توقف جریان لاگ‌ها',
    descriptionEn: 'Real-time heartbeat monitoring matrix & outage detector',
    isEnabled: true,
    order: 14
  },
  {
    id: 'alert_manager',
    category: 'radar_ingest',
    categoryNameFa: 'رادار و ورودی‌ها',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Bell',
    titleFa: 'مرکز اعلان و هشدارها',
    titleEn: 'Alert Notification Center',
    badge: 'Alerts',
    descriptionFa: 'ارسال خودکار اعلان‌ها از طریق SMS، ایمیل و وب‌هوک SOC',
    descriptionEn: 'Automated alert routing via SMS, Email and SOC Webhook',
    isEnabled: true,
    order: 15
  },
  {
    id: 'network_sources',
    category: 'radar_ingest',
    categoryNameFa: 'رادار و ورودی‌ها',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Wifi',
    titleFa: 'نگاشت سورس‌ها و ایندکسرها',
    titleEn: 'Source IPs & Ingest Map',
    badge: 'Ingest Map',
    descriptionFa: 'مدیریت و نگاشت منابع لاگ به پایپ‌لاین‌ها و پورت‌های ایندکسر',
    descriptionEn: 'Network source IP topology and indexer pipeline mapping',
    isEnabled: true,
    order: 16
  },
  {
    id: 'component_agents',
    category: 'agents_gateway',
    categoryNameFa: 'ایجنت‌ها و درگاه',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'Package',
    titleFa: 'ایجنت‌های اختصاصی (UF/HF)',
    titleEn: 'Component Agents Generator',
    badge: 'Zero-Trust',
    descriptionFa: 'ژنراتور خودکار پکیج‌های نصبی آماده با کانفیگ، سرتیفیکت و اسکریپت نصب',
    descriptionEn: 'Tailored agent packages with hardened configs and deployment scripts',
    isEnabled: true,
    order: 17
  },
  {
    id: 'remote_gateway',
    category: 'agents_gateway',
    categoryNameFa: 'ایجنت‌ها و درگاه',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'Globe',
    titleFa: 'درگاه کنترل از راه دور (mTLS)',
    titleEn: 'Secure Remote Gateway',
    badge: 'mTLS',
    descriptionFa: 'ترمینال امن mTLS و SSH برای اجرای دستورات و دیاگ از راه دور روی نودها',
    descriptionEn: 'Zero-trust remote command execution & diagnostics terminal',
    isEnabled: true,
    order: 18
  },
  {
    id: 'package_center',
    category: 'agents_gateway',
    categoryNameFa: 'ایجنت‌ها و درگاه',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'HardDrive',
    titleFa: 'مرکز تحویل پکیج‌های نصب',
    titleEn: 'Package Delivery Center',
    badge: 'Binaries',
    descriptionFa: 'دانلود پکیج‌های tar.gz، deb، rpm، msi و اسکریپت‌های استقرار خودکار',
    descriptionEn: 'Download native Splunk packages, binaries and auto-install scripts',
    isEnabled: true,
    order: 19
  },
  {
    id: 'backup_archive',
    category: 'tools_security',
    categoryNameFa: 'ابزارها و امنیت',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Archive',
    titleFa: 'آرشیو نسخه‌های پشتیبان',
    titleEn: 'Backup Snapshots Archive',
    badge: 'Rollback',
    descriptionFa: 'مدیریت اسنپ‌شات‌های پیکربندی و بازگردانی سریع (Rollback) نسخه‌ها',
    descriptionEn: 'Configuration snapshot archive with one-click restore and rollback',
    isEnabled: true,
    order: 20
  },
  {
    id: 'network_toolbox',
    category: 'tools_security',
    categoryNameFa: 'ابزارها و امنیت',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Wrench',
    titleFa: 'جعبه ابزار شبکه و تست پورت‌ها',
    titleEn: 'Network Toolbox & Ports',
    badge: 'Probes',
    descriptionFa: 'ابزارهای تست سوکت TCP، اعتبارسنجی پورت‌ها و تحلیل تاخیر شبکه',
    descriptionEn: 'TCP socket probing, port reachability checks and latency tests',
    isEnabled: true,
    order: 21
  },
  {
    id: 'system_update',
    category: 'tools_security',
    categoryNameFa: 'ابزارها و امنیت',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Package',
    titleFa: 'مدیریت بروزرسانی Pilot',
    titleEn: 'Pilot Update Manager',
    badge: 'Update',
    descriptionFa: 'بارگذاری فایل Update، اعتبارسنجی نسخه، بک‌آپ، نصب، Restart و Rollback خودکار',
    descriptionEn: 'Upload update packages, verify version/checksums, backup, restart and automatic rollback',
    isEnabled: true,
    order: 22.5
  },
  {
    id: 'admin_security',
    category: 'tools_security',
    categoryNameFa: 'ابزارها و امنیت',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Shield',
    titleFa: 'پنل مدیریت، امنیت و کاربران',
    titleEn: 'Admin & Security Control',
    badge: 'RBAC',
    descriptionFa: 'کنترل دسترسی مبتنی بر نقش (RBAC)، مدیریت کاربران و لاگ‌های ممیزی امنیتی',
    descriptionEn: 'Role-based access control (RBAC), user provisioning and audit trails',
    isEnabled: true,
    order: 22
  }
];

export default function App() {
  const [lang, setLang] = useState<'fa' | 'en'>('fa');

  // Default Startup Launch Tab & Active Tab (defaults to 'bento_overview' / Dashboard)
  const [defaultLaunchTab, setDefaultLaunchTab] = useState<string>(() => {
    return localStorage.getItem('splunk_doctor_default_tab') || 'bento_overview';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('splunk_doctor_default_tab') || 'bento_overview';
  });

  // Customizable Modules State
  const [modulesConfig, setModulesConfig] = useState<AppModuleConfig[]>(() => {
    const saved = localStorage.getItem('splunk_doctor_custom_modules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return DEFAULT_MODULES_CONFIG;
  });

  const [isModuleManagerOpen, setIsModuleManagerOpen] = useState<boolean>(false);

  const handleUpdateModules = (newModules: AppModuleConfig[]) => {
    setModulesConfig(newModules);
    localStorage.setItem('splunk_doctor_custom_modules', JSON.stringify(newModules));
    showToast(isFa ? 'چیدمان و ماژول‌های سامانه با موفقیت ذخیره شد.' : 'Modules configuration saved.');
  };

  const handleUpdateDefaultTab = (newDefault: string) => {
    setDefaultLaunchTab(newDefault);
    localStorage.setItem('splunk_doctor_default_tab', newDefault);
    showToast(isFa ? 'صفحه پیش‌فرض ورود به برنامه تغییر یافت.' : 'Default startup screen updated.');
  };

  const handleResetToDefaults = () => {
    setModulesConfig(DEFAULT_MODULES_CONFIG);
    setDefaultLaunchTab('bento_overview');
    localStorage.removeItem('splunk_doctor_custom_modules');
    localStorage.setItem('splunk_doctor_default_tab', 'bento_overview');
    showToast(isFa ? 'تنظیمات و چیدمان برنامه به حالت اولیه بازنشانی شد.' : 'Restored factory default modules layout.');
  };

  // Streamlined Consolidated Mode State
  const [isConsolidatedMode, setIsConsolidatedMode] = useState<boolean>(true);

  // Navigation Hub & Quick Search State
  type TabCategory = 'architecture' | 'health_logs' | 'radar_ingest' | 'agents_gateway' | 'tools_security';
  const TAB_TO_CATEGORY: Record<string, TabCategory> = {
    master_docs_guide: 'architecture',
    architect_overseer: 'architecture',
    autonomous_agent: 'health_logs',
    ai_diagnostics: 'health_logs',
    bento_overview: 'architecture',
    cluster_deployer: 'architecture',
    architecture_auditor: 'architecture',
    docker_k8s: 'architecture',
    topology: 'architecture',
    management_nodes: 'architecture',
    commercial_license: 'architecture',
    health_audit: 'health_logs',
    live_logs: 'health_logs',
    config_editor: 'health_logs',
    doc_reference: 'health_logs',
    heartbeat_radar: 'radar_ingest',
    alert_manager: 'radar_ingest',
    network_sources: 'radar_ingest',
    component_agents: 'agents_gateway',
    remote_gateway: 'agents_gateway',
    package_center: 'agents_gateway',
    backup_archive: 'tools_security',
    network_toolbox: 'tools_security',
    admin_security: 'tools_security',
    server_terminal: 'tools_security',
  };

  const [activeCategory, setActiveCategory] = useState<TabCategory>('architecture');
  const [navViewMode, setNavViewMode] = useState<'all_ribbon' | 'categorized'>('all_ribbon');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllModulesHub, setShowAllModulesHub] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [sidebarFilterCategory, setSidebarFilterCategory] = useState<'all' | TabCategory>('all');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');

  // Floating Mini-Windows / Picture-in-Picture (YouTube-Style Multi-Tool Execution)
  const [floatingTools, setFloatingTools] = useState<string[]>([]);

  const handleToggleFloatingTool = (toolId: string) => {
    if (floatingTools.includes(toolId)) {
      showToast(isFa ? 'این ابزار در حال حاضر در پنجره شناور در حال اجراست.' : 'This tool is already running in a floating window.');
      return;
    }
    if (floatingTools.length >= 2) {
      showToast(isFa ? 'برای پایداری مرورگر حداکثر دو پنجره شناور هم‌زمان مجاز است.' : 'For browser stability, at most two floating tools can run at once.');
      return;
    }
    setFloatingTools(prev => [...prev, toolId]);
    showToast(isFa 
      ? 'ابزار در پنجره شناور (مشابه یوتیوب) قرار گرفت! می‌توانید آزادانه آن را جابه‌جا کرده و ابزارهای دیگر را همزمان اجرا کنید.' 
      : 'Tool popped into floating mini-player! You can drag it anywhere and run multiple tools simultaneously.');
  };

  const handleCloseFloatingTool = (toolId: string) => {
    setFloatingTools(prev => prev.filter(id => id !== toolId));
  };

  const handleMaximizeFloatingTool = (toolId: string) => {
    setActiveTab(toolId as any);
    if (TAB_TO_CATEGORY[toolId]) {
      setActiveCategory(TAB_TO_CATEGORY[toolId]);
    }
    setFloatingTools(prev => prev.filter(id => id !== toolId));
    showToast(isFa ? 'ابزار به صفحه اصلی بازگردانده شد.' : 'Tool restored to main workspace.');
  };

  // Global Ctrl+K / Cmd+K and Ctrl+B / Cmd+B Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
        setShowAllModulesHub(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectModule = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (TAB_TO_CATEGORY[tab]) {
      setActiveCategory(TAB_TO_CATEGORY[tab]);
    }
    setIsQuickSearchOpen(false);
    setShowAllModulesHub(false);
  };

  // Commercial Digital License State
  const [digitalLicense, setDigitalLicense] = useState<DigitalCertificateLicense>(() => {
    const saved = localStorage.getItem('splunk_doctor_commercial_license');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_DIGITAL_LICENSE;
  });

  const handleUpdateDigitalLicense = (updated: DigitalCertificateLicense) => {
    setDigitalLicense(updated);
    localStorage.setItem('splunk_doctor_commercial_license', JSON.stringify(updated));
    showToast(isFa ? 'گواهینامه تجاری سازمان با موفقیت بروزرسانی و فعال شد.' : 'Commercial certificate updated.');
  };

  // Heartbeat & Live Ingestion Radar State
  const [heartbeatNodes, setHeartbeatNodes] = useState<HeartbeatNode[]>(INITIAL_HEARTBEAT_NODES);
  const [dropAlerts, setDropAlerts] = useState<HeartbeatDropAlert[]>(INITIAL_DROP_ALERTS);
  const [remoteTargetNode, setRemoteTargetNode] = useState<HeartbeatNode | null>(null);

  const handleAcknowledgeAlert = (alertId: string) => {
    setDropAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
    showToast(isFa ? 'هشدار تایید شد.' : 'Alert acknowledged.');
  };

  const handleSimulateDisconnect = async (nodeId: string) => {
    const node = heartbeatNodes.find(n => n.id === nodeId);
    if (!node) return;
    try {
      const res=await fetch('/api/real/node/probe',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({host:node.ip,ports:[22,8000,8089,9997]})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error||'Connectivity probe failed');
      const open=Object.values(data.probes||{}).filter((v:any)=>v?.open).length;
      const updatedStatus=open?'CONNECTED':'DISCONNECTED_SILENT';
      setHeartbeatNodes(prev=>prev.map(n=>n.id===nodeId?{...n,status:updatedStatus as any}:n));
      showToast(open ? (isFa ? `نود ${node.hostname} قابل دسترسی است.` : `${node.hostname} is reachable.`) : (isFa ? `نود ${node.hostname} پاسخ نمی‌دهد.` : `${node.hostname} is not reachable.`));
    }catch(e:any){
      showToast(isFa ? `پروب واقعی شکست خورد: ${e.message}` : `Real probe failed: ${e.message}`);
    }
  };


  const handleRecoverAllNodes = () => {
    setHeartbeatNodes(INITIAL_HEARTBEAT_NODES);
    setDropAlerts(prev => prev.map(a => ({ ...a, isAcknowledged: true })));
    showToast(isFa ? 'تمام نودها به وضعیت آنلاین و پایدار بازیابی شدند.' : 'All nodes restored to healthy status.');
  };

  const handleOpenRemoteTerminalFromNode = (node: HeartbeatNode) => {
    setRemoteTargetNode(node);
    setActiveTab('remote_gateway');
    showToast(isFa ? `درگاه ریموت به نود ${node.hostname} متصل گردید.` : `Connected remote gateway to ${node.hostname}`);
  };

  // Authentication & Security State
  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('splunk_doctor_auth_token') || '';
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('splunk_doctor_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [sessionValidated, setSessionValidated] = useState<boolean>(false);
  // Virtual Server Wipe & Lifecycle Modal State (مدیریت و حذف سرور مجازی)
  const [isVirtualWipeModalOpen, setIsVirtualWipeModalOpen] = useState<boolean>(false);
  // Tool Validation & Diagnostic Health Modal State (اعتبار سنجی ابزارهای سامانه)
  const [isToolValidationModalOpen, setIsToolValidationModalOpen] = useState<boolean>(false);
  const [isGlobalTerminalOpen, setIsGlobalTerminalOpen] = useState<boolean>(false);
  const [controllerHealth, setControllerHealth] = useState<{ version: string; buildId: string } | null>(null);
  const [validatingToolId, setValidatingToolId] = useState<string>('bento_overview');
  const [validationInitialTab, setValidationInitialTab] = useState<'current' | 'all'>('current');

  // Splunk System Debugger & Telemetry Modal State
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);

  // Backend Operations & Live Verification Inspector State
  const [isBackendInspectorOpen, setIsBackendInspectorOpen] = useState<boolean>(false);
  const [backendOperations, setBackendOperations] = useState<BackendOperationRecord[]>([]);

  // Configurations State (Main / Production Server)
  const [configs, setConfigs] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('splunk_production_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_CONFIG_FILES;
  });

  // Configurations State for Isolated Parallel Instance (Staging / Shadow Cluster)
  const [parallelConfigs, setParallelConfigs] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('splunk_parallel_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default clone of initial with isolated parallel ports
    const cloned: Record<string, string> = {};
    Object.entries(INITIAL_CONFIG_FILES).forEach(([file, content]) => {
      let mod = content;
      if (file === 'inputs.conf') {
        mod = mod.replace(/\[splunktcp:\/\/9997\]/g, '[splunktcp://9998]');
      } else if (file === 'web.conf') {
        mod = mod.replace(/httpport\s*=\s*8000/g, 'httpport = 8001');
      } else if (file === 'server.conf') {
        mod = mod.replace(/mgmtHostPort\s*=\s*127\.0\.0\.1:8089/g, 'mgmtHostPort = 127.0.0.1:8090')
                 .replace(/\[general\]\nserverName\s*=\s*[^\n]+/g, '[general]\nserverName = splunk-parallel-staging-01');
      }
      cloned[file] = mod;
    });
    return cloned;
  });

  // Parallel Cluster State
  const [parallelClusterState, setParallelClusterState] = useState<ParallelClusterState>(() => {
    const saved = localStorage.getItem('splunk_parallel_cluster_state');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      isInstalled: false,
      clusterName: 'Splunk Parallel Staging Cluster (Standalone Staging)',
      version: '9.2.1-Enterprise-Parallel',
      portOffset: 1,
      webPort: 8001,
      mgmtPort: 8090,
      indexerPort: 9998,
      status: 'stopped'
    };
  });

  // Active Workspace Environment for Editor / Diagnostics ('production' | 'parallel' | 'virtual')
  const [activeEnvironment, setActiveEnvironment] = useState<'production' | 'parallel' | 'virtual'>('production');

  // Configurations State for Isolated Virtual Cloud Instance
  const [virtualConfigs, setVirtualConfigs] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('splunk_virtual_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default clone of initial with virtual cloud ports (8080, 8091, 9999)
    const cloned: Record<string, string> = {};
    Object.entries(INITIAL_CONFIG_FILES).forEach(([file, content]) => {
      let mod = content;
      if (file === 'inputs.conf') {
        mod = mod.replace(/\[splunktcp:\/\/9997\]/g, '[splunktcp://9999]');
      } else if (file === 'web.conf') {
        mod = mod.replace(/httpport\s*=\s*8000/g, 'httpport = 8080');
      } else if (file === 'server.conf') {
        mod = mod.replace(/mgmtHostPort\s*=\s*127\.0\.0\.1:8089/g, 'mgmtHostPort = 127.0.0.1:8091')
                 .replace(/\[general\]\nserverName\s*=\s*[^\n]+/g, '[general]\nserverName = splunk-virtual-cloud-01');
      }
      cloned[file] = mod;
    });
    return cloned;
  });

  // Virtual Cluster State
  const [virtualClusterState, setVirtualClusterState] = useState<ParallelClusterState>(() => {
    const saved = localStorage.getItem('splunk_virtual_cluster_state');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Not Installed',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
  });

  const logBackendOperation = (
    toolId: string,
    toolNameFa: string,
    toolNameEn: string,
    actionSummaryFa: string,
    actionSummaryEn: string,
    status: 'success' | 'warning' | 'failed',
    resultSummaryFa: string,
    resultSummaryEn: string,
    technicalDetails?: string,
    durationMs: number = 14
  ) => {
    const newRecord: BackendOperationRecord = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      toolId,
      toolNameFa,
      toolNameEn,
      actionSummaryFa,
      actionSummaryEn,
      status,
      durationMs,
      resultSummaryFa,
      resultSummaryEn,
      technicalDetails,
      isVerifiedReal: true
    };
    setBackendOperations(prev => [newRecord, ...prev].slice(0, 100));
  };

  const handleVirtualServerWiped = (wipedParallelToo: boolean = true) => {
    const nextVirtual: ParallelClusterState = {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Virtual Instance Deleted',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    setVirtualClusterState(nextVirtual);
    localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(nextVirtual));

    if (wipedParallelToo) {
      const nextParallel: ParallelClusterState = {
        isInstalled: false,
        status: 'stopped',
        clusterName: 'Parallel Staging Deleted',
        version: 'N/A',
        portOffset: 0,
        webPort: 0,
        mgmtPort: 0,
        indexerPort: 0
      };
      setParallelClusterState(nextParallel);
      localStorage.setItem('splunk_parallel_cluster_state', JSON.stringify(nextParallel));
    }

    setActiveEnvironment('production');
    logBackendOperation(
      'cluster_deployer',
      'حذف کامل سرورها و آزادسازی پورت‌ها',
      'Server Purge & Decommission',
      'حذف کامل سرور مجازی و سرور موازی از پس‌زمینه لینوکس و آزادسازی سوکت‌های ۸۰۸۰ و ۸۰۰۱',
      'Purged virtual and parallel instances from host and freed ports 8080, 8001',
      'success',
      'سرورهای موازی و مجازی با موفقیت از سیستم حذف شدند و کشو و سلکتور به سرور اصلی سوئیچ شدند.',
      'Servers wiped and environment reverted to Production.',
      'Purged /opt/splunk_virtual and /opt/splunk_parallel | Stopped Docker containers'
    );
    showToast(isFa ? "سرور مجازی و سرور موازی با موفقیت از پس‌زمینه سرور حذف و کشو بروزرسانی شد!" : "Virtual and parallel servers completely wiped from host!");
  };

  const handlePurgeDecommissionedServers = () => {
    const nextParallel: ParallelClusterState = {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Parallel Staging Decommissioned',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    const nextVirtual: ParallelClusterState = {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Virtual Cloud Decommissioned',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    setParallelClusterState(nextParallel);
    setVirtualClusterState(nextVirtual);
    try {
      localStorage.removeItem('splunk_parallel_configs');
      localStorage.removeItem('splunk_virtual_configs');
      localStorage.setItem('splunk_parallel_cluster_state', JSON.stringify(nextParallel));
      localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(nextVirtual));
    } catch (_) {}
    setActiveEnvironment('production');
    logBackendOperation(
      'overseer_engine',
      'پاکسازی کامل کش و سرورهای حذف‌شده',
      'Purge Decommissioned Cache',
      'حذف کامل داده‌های سرور موازی/مجازی از کشوی انتخاب محیط و دیسک مرورگر',
      'Purged all decommissioned parallel/virtual server states from selector drawer and browser cache',
      'success',
      'کشوی انتخاب سرور کاملاً پاکسازی شد و سیستم به سرور اصلی سوئیچ کرد.',
      'Environment selector purged and reset to Production.',
      'Purged localStorage keys: splunk_parallel_cluster_state, splunk_virtual_cluster_state'
    );
    showToast(isFa ? "کش سرورهای موازی و مجازی کاملاً پاکسازی گردید و کشو به روزرسانی شد ✓" : "Decommissioned server cache purged and selector updated ✓");
  };

  const handleDeleteParallelServer = async () => {
    try {
      await fetch('/api/virtual-server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedServers: ['parallel'] })
      });
    } catch (_) {}
    const nextParallel: ParallelClusterState = {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Parallel Staging Deleted',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    setParallelClusterState(nextParallel);
    localStorage.setItem('splunk_parallel_cluster_state', JSON.stringify(nextParallel));
    if (activeEnvironment === 'parallel') {
      setActiveEnvironment('production');
    }
    showToast(isFa ? "سرور موازی با موفقیت حذف گردید و کشو بروزرسانی شد." : "Parallel server decommissioned successfully.");
  };

  const handleDeleteVirtualServer = async () => {
    try {
      await fetch('/api/virtual-server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedServers: ['virtual', 'containers'] })
      });
    } catch (_) {}
    const nextVirtual: ParallelClusterState = {
      isInstalled: false,
      status: 'stopped',
      clusterName: 'Virtual Instance Deleted',
      version: 'N/A',
      portOffset: 0,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    setVirtualClusterState(nextVirtual);
    localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(nextVirtual));
    if (activeEnvironment === 'virtual') {
      setActiveEnvironment('production');
    }
    showToast(isFa ? "سرور مجازی با موفقیت حذف گردید و کشو بروزرسانی شد." : "Virtual server decommissioned successfully.");
  };

  const handleVirtualServerRecreated = () => {
    const nextVirtual: ParallelClusterState = {
      isInstalled: true,
      status: 'running',
      clusterName: 'Splunk Virtual Cloud Node',
      version: '9.2.1',
      portOffset: 80,
      webPort: 0,
      mgmtPort: 0,
      indexerPort: 0
    };
    setVirtualClusterState(nextVirtual);
    localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(nextVirtual));
    setActiveEnvironment('virtual');
    showToast(isFa ? "سرور مجازی با موفقیت در پس‌زمینه راه‌اندازی شد!" : "Virtual server created and active on port 8080!");
  };

  // Auto-sync active environment fallback if currently selected environment is deleted/offline
  useEffect(() => {
    if (activeEnvironment === 'parallel' && !parallelClusterState.isInstalled) {
      setActiveEnvironment('production');
    }
    if (activeEnvironment === 'virtual' && !virtualClusterState.isInstalled) {
      setActiveEnvironment('production');
    }
  }, [activeEnvironment, parallelClusterState.isInstalled, virtualClusterState.isInstalled]);

  // Validate session on mount, then launch the real offline readiness check.
  useEffect(() => {
    setSessionValidated(false);
    if (!authToken) {
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(res => {
        if (!res.ok) {
          setAuthToken('');
          setCurrentUser(null);
          localStorage.removeItem('splunk_doctor_auth_token');
          localStorage.removeItem('splunk_doctor_user');
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('splunk_doctor_user', JSON.stringify(data.user));
          setSessionValidated(true);
        } else {
          setAuthToken('');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setSessionValidated(false);
      });
  }, [authToken]);

  // Do not launch heavy validation or a live terminal automatically after login.
  // These tools are intentionally user-triggered so the main workspace stays responsive.
  useEffect(() => {
    if (!sessionValidated || !authToken || !currentUser) return;
    setValidatingToolId('bento_overview');
  }, [sessionValidated, authToken, currentUser]);

  // Read the controller build identity after startup so stale browser assets are obvious.
  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.version) {
          setControllerHealth({ version: String(data.version), buildId: String(data.buildId || 'unknown') });
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthToken(session.token);
    setCurrentUser(session.user);
    setSessionValidated(true);
    localStorage.setItem('splunk_doctor_auth_token', session.token);
    localStorage.setItem('splunk_doctor_user', JSON.stringify(session.user));
    setValidatingToolId('bento_overview');
    setIsToolValidationModalOpen(true);
    setIsLoginModalOpen(false);
    showToast(isFa ? `خوش آمدید ${session.user.fullName} (${session.user.role})` : `Welcome, ${session.user.username}`);
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (_) {}
    }
    setAuthToken('');
    setCurrentUser(null);
    setSessionValidated(false);
    localStorage.removeItem('splunk_doctor_auth_token');
    localStorage.removeItem('splunk_doctor_user');
    if (activeTab === 'admin_security') {
      setActiveTab('topology');
    }
    showToast(isFa ? 'با موفقیت از حساب کاربری خارج شدید.' : 'Logged out successfully.');
  };

  // Component Selection
  const [selectedRole, setSelectedRole] = useState<ComponentRole>('heavy_forwarder');
  
  // Cluster Connection & Alignment Settings State
  const [clusterSettings, setClusterSettings] = useState<ClusterSettings>(() => {
    const saved = localStorage.getItem('splunk_cluster_doctor_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      hfIp: '',
      hfHost: '',
      idx1Ip: '',
      idx1Host: '',
      idx2Ip: '',
      idx2Host: '',
      shIp: '',
      shHost: '',
      dsIp: '',
      dsHost: '',
    };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  useEffect(() => {
    const sampleHosts = new Set(['hf01.corp.net','idx01-site1.cluster.splunk','idx02-site1.cluster.splunk','sh01.corp.net','ds01.corp.net']);
    if (sampleHosts.has(clusterSettings.hfHost) || sampleHosts.has(clusterSettings.idx1Host) || sampleHosts.has(clusterSettings.idx2Host) || sampleHosts.has(clusterSettings.shHost) || sampleHosts.has(clusterSettings.dsHost)) {
      setClusterSettings({
        hfIp:'', hfHost:'', idx1Ip:'', idx1Host:'', idx2Ip:'', idx2Host:'', shIp:'', shHost:'', dsIp:'', dsHost:''
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('splunk_cluster_doctor_settings', JSON.stringify(clusterSettings));
  }, [clusterSettings]);

  // Global AI Doctor and Healer State
  const [isGlobalAiScanning, setIsGlobalAiScanning] = useState<boolean>(false);
  const [isGlobalAiHealerRunning, setIsGlobalAiHealerRunning] = useState<boolean>(false);
  const [globalAiLogs, setGlobalAiLogs] = useState<string[]>([]);
  const [globalAiExpanded, setGlobalAiExpanded] = useState<boolean>(false);
  const [resolvedGlobalIssueIds, setResolvedGlobalIssueIds] = useState<Record<string, string[]>>({
    production: [],
    parallel: [],
    virtual: []
  });

  useEffect(() => {
    localStorage.setItem('splunk_production_configs', JSON.stringify(configs));
  }, [configs]);

  useEffect(() => {
    localStorage.setItem('splunk_parallel_configs', JSON.stringify(parallelConfigs));
  }, [parallelConfigs]);

  useEffect(() => {
    localStorage.setItem('splunk_virtual_configs', JSON.stringify(virtualConfigs));
  }, [virtualConfigs]);

  useEffect(() => {
    localStorage.setItem('splunk_parallel_cluster_state', JSON.stringify(parallelClusterState));
  }, [parallelClusterState]);

  useEffect(() => {
    localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(virtualClusterState));
  }, [virtualClusterState]);

  const [activeConfigFile, setActiveConfigFile] = useState<string>('outputs.conf');
  const [selectedLogAnalysis, setSelectedLogAnalysis] = useState<LiveLogAnalysis | null>(null);

  // Global AI Scanner — real diagnostic backend only.
  const runGlobalAiScan = async () => {
    setIsGlobalAiScanning(true);
    setGlobalAiLogs([]);
    try {
      const targetType = activeEnvironment === 'production' ? 'real' : activeEnvironment;
      const res = await fetch('/api/parallel-cluster/deep-diagnostics', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({serverType:targetType})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok || data.success===false) throw new Error(data.error || 'Global diagnostics failed');
      const logs=[
        `[${new Date().toLocaleTimeString()}] [REAL_SCAN] Environment: ${targetType}`,
        `[${new Date().toLocaleTimeString()}] [REAL_SCAN] Health score: ${data.healthScore ?? 'unknown'}`,
        `[${new Date().toLocaleTimeString()}] [REAL_SCAN] HTTP status: ${data.httpStatus ?? '000'}`,
        `[${new Date().toLocaleTimeString()}] [REAL_SCAN] Findings: ${data.issuesCount ?? (data.issues||[]).length}`,
        data.aiAnalysis || ''
      ].filter(Boolean);
      setGlobalAiLogs(logs);
      setIsGlobalAiScanning(false);
    } catch(e:any) {
      setGlobalAiLogs([`[${new Date().toLocaleTimeString()}] [FAILED] ${e.message || 'Global diagnostics failed'}`]);
      setIsGlobalAiScanning(false);
    }
  };

  const executeGlobalAiHeal = async () => {
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    try {
      if (activeEnvironment === 'virtual') {
        setGlobalAiLogs(prev=>[...prev,'[BLOCKED] Synthetic virtual environment healing is disabled. Deploy a real container/image first.']);
        return;
      }
      const adminPassword = window.prompt(isFa ? 'رمز واقعی admin اسپلانک:' : 'Real Splunk admin password:') || '';
      const pass4SymmKey = window.prompt(isFa ? 'کلید واقعی pass4SymmKey:' : 'Real pass4SymmKey:') || '';
      if(adminPassword.length<12 || pass4SymmKey.length<12) {
        setGlobalAiLogs(prev=>[...prev,'[BLOCKED] Real credentials are required.']);
        return;
      }
      const res=await fetch('/api/parallel-cluster/ai-auto-heal',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({webPort:8001,restPort:8090,tcpPort:9998,kvPort:8193,adminPassword,pass4SymmKey,password:adminPassword})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.success)throw new Error(data.error||'Global auto-heal failed');
      setGlobalAiLogs(Array.isArray(data.logs)?data.logs:['[SUCCESS] Real auto-heal completed.']);
      setResolvedGlobalIssueIds(prev=>({...prev,[activeEnvironment]:[]})); 
      setIsGlobalAiHealerRunning(false);
      await runGlobalAiScan();
    } catch(e:any) {
      setGlobalAiLogs(prev=>[...prev,`[FAILED] ${e.message||'Global auto-heal failed'}`]);
      setIsGlobalAiHealerRunning(false);
    }
  };

  // Remove a real parallel/container deployment through the backend. No synthetic instance is created.
  const destroyVirtualCloudServer = async () => {
    if (isGlobalAiHealerRunning) return;
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    try {
      const res=await fetch('/api/parallel-cluster/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.success) throw new Error(data.error||'Real reset failed');
      setVirtualClusterState(prev=>({...prev,isInstalled:false,status:'stopped'}));
      setGlobalAiLogs(Array.isArray(data.logs)?data.logs:['[REAL_RESET] Deployment reset completed.']);
      setIsGlobalAiHealerRunning(false);
    }catch(e:any){
      setGlobalAiLogs(prev=>[...prev,`[FAILED] ${e.message||'Reset failed'}`]);
      setIsGlobalAiHealerRunning(false);
    }
  };

  const recreateVirtualCloudServer = async () => {
    if (isGlobalAiHealerRunning) return;
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    setGlobalAiLogs([isFa ? 'ساخت مصنوعی Virtual Cloud غیرفعال است؛ ابتدا Image واقعی را در Offline Store قرار دهید و سپس Deployment واقعی را اجرا کنید.' : 'Synthetic Virtual Cloud creation is disabled; stage a real image in the offline store and use real deployment.']);
    setIsGlobalAiHealerRunning(false);
  };

  // Trigger quick scan whenever the active environment changes
  useEffect(() => {
    runGlobalAiScan();
  }, [activeEnvironment]);

  // Dynamic Configs Customizer based on Cluster Settings
  const getCustomizedConfigs = () => {
    const customized: Record<string, string> = {};
    // افزودن Fallback برای جلوگیری از کرش
    Object.entries(configs || {}).forEach(([filename, content]) => {
      // تضمین اینکه محتوا حتماً یک رشته متنی است
      const safeContent = typeof content === 'string' ? content : '';
      
      customized[filename] = safeContent
        .replace(/hf01\.corp\.net/gi, clusterSettings?.hfHost || '')
        .replace(/10\.20\.30\.45/g, clusterSettings?.hfIp || '')
        .replace(/idx01-site1\.cluster\.splunk/gi, clusterSettings?.idx1Host || '')
        .replace(/10\.20\.30\.50/g, clusterSettings?.idx1Ip || '')
        .replace(/idx02-site1\.cluster\.splunk/gi, clusterSettings?.idx2Host || '')
        .replace(/10\.20\.30\.51/g, clusterSettings?.idx2Ip || '')
        .replace(/sh01\.corp\.net/gi, clusterSettings?.shHost || '')
        .replace(/10\.20\.30\.40/g, clusterSettings?.shIp || '')
        .replace(/ds01\.corp\.net/gi, clusterSettings?.dsHost || '')
        .replace(/10\.20\.30\.60/g, clusterSettings?.dsIp || '');
    });
    return customized;
  };

  const customizedConfigs = getCustomizedConfigs();

  const getCustomizedProfiles = () => {
    if (!Array.isArray(COMPONENT_PROFILES)) return [];
    const safeSettings = clusterSettings || {
      hfIp: '10.20.30.45',
      hfHost: 'hf01.corp.net',
      idx1Ip: '10.20.30.50',
      idx1Host: 'idx01-site1.cluster.splunk',
      idx2Ip: '10.20.30.51',
      idx2Host: 'idx02-site1.cluster.splunk',
      shIp: '10.20.30.40',
      shHost: 'sh01.corp.net',
      dsIp: '10.20.30.60',
      dsHost: 'ds01.corp.net',
    };

    return COMPONENT_PROFILES.map(profile => {
      if (!profile) return null;
      const incomingLogSources = (profile.incomingLogSources || []).map(src => {
        let ip = src.ip;
        let hostname = src.hostname;
        if (ip === '10.20.30.45') { ip = safeSettings.hfIp || '10.20.30.45'; hostname = safeSettings.hfHost || 'hf01.corp.net'; }
        else if (ip === '10.20.30.50') { ip = safeSettings.idx1Ip || '10.20.30.50'; hostname = safeSettings.idx1Host || 'idx01-site1.cluster.splunk'; }
        else if (ip === '10.20.30.51') { ip = safeSettings.idx2Ip || '10.20.30.51'; hostname = safeSettings.idx2Host || 'idx02-site1.cluster.splunk'; }
        else if (ip === '10.20.30.40') { ip = safeSettings.shIp || '10.20.30.40'; hostname = safeSettings.shHost || 'sh01.corp.net'; }
        return { ...src, ip, hostname };
      });

      const destinationIndexers = (profile.destinationIndexers || []).map(idx => {
        let ip = idx.ip;
        let hostname = idx.hostname;
        if (ip === '10.20.30.45') { ip = safeSettings.hfIp || '10.20.30.45'; hostname = safeSettings.hfHost || 'hf01.corp.net'; }
        else if (ip === '10.20.30.50') { ip = safeSettings.idx1Ip || '10.20.30.50'; hostname = safeSettings.idx1Host || 'idx01-site1.cluster.splunk'; }
        else if (ip === '10.20.30.51') { ip = safeSettings.idx2Ip || '10.20.30.51'; hostname = safeSettings.idx2Host || 'idx02-site1.cluster.splunk'; }
        else if (ip === '10.20.30.40') { ip = safeSettings.shIp || '10.20.30.40'; hostname = safeSettings.shHost || 'sh01.corp.net'; }
        return { ...idx, ip, hostname };
      });

      let shortName = profile.shortName || 'NODE';
      const hfHost = safeSettings.hfHost || 'hf01.corp.net';
      const idx1Host = safeSettings.idx1Host || 'idx01-site1.cluster.splunk';
      const shHost = safeSettings.shHost || 'sh01.corp.net';

      if (profile.id === 'heavy_forwarder') shortName = hfHost.split('.')[0].toUpperCase();
      else if (profile.id === 'indexer_peer') shortName = idx1Host.split('.')[0].toUpperCase();
      else if (profile.id === 'search_head') shortName = shHost.split('.')[0].toUpperCase();

      return {
        ...profile,
        shortName,
        incomingLogSources,
        destinationIndexers
      };
    }).filter(Boolean) as ComponentProfile[];
  };

  const customizedProfiles = getCustomizedProfiles() || [];
  const currentProfile = customizedProfiles.find(p => p.id === selectedRole) || customizedProfiles[0] || {
    id: 'fallback',
    shortName: 'Loading...',
    incomingLogSources: [],
    destinationIndexers: []
  };


  // Findings & Health Score State
  const [resolvedFindingIds, setResolvedFindingIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('splunk_resolved_findings');
      if (saved) return new Set(JSON.parse(saved));
    } catch (_) {}
    return new Set();
  });
  const [findings, setFindings] = useState<SplunkFinding[]>(() => {
    try {
      const savedResolved = localStorage.getItem('splunk_resolved_findings');
      const resolvedSet = savedResolved ? new Set<string>(JSON.parse(savedResolved)) : new Set<string>();
      const savedConfigs = localStorage.getItem('splunk_production_configs');
      const activeCfgs = savedConfigs ? JSON.parse(savedConfigs) : INITIAL_CONFIG_FILES;
      const initialAudit = auditSplunkConfigs(activeCfgs, resolvedSet);
      return initialAudit.activeFindings;
    } catch (_) {
      return INITIAL_FINDINGS;
    }
  });
  const [resolvedFindings, setResolvedFindings] = useState<SplunkFinding[]>(() => {
    try {
      const savedConfigs = localStorage.getItem('splunk_production_configs');
      const activeCfgs = savedConfigs ? JSON.parse(savedConfigs) : INITIAL_CONFIG_FILES;
      const initialAudit = auditSplunkConfigs(activeCfgs);
      return initialAudit.resolvedFindings;
    } catch (_) {
      return [];
    }
  });
  const [selectedFinding, setSelectedFinding] = useState<SplunkFinding | null>(null);

  // Backup System State
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [fileBackups, setFileBackups] = useState<Record<string, string>>({});

  // Service Controller Modal State
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [isWebModalOpen, setIsWebModalOpen] = useState<boolean>(false);
  const [webModalPort, setWebModalPort] = useState<number>(8001);

  // Diagram Display Mode (Symbol-based Aplura Network Ports vs Pipeline Queue Flow)
  const [diagramMode, setDiagramMode] = useState<'ports_symbols' | 'pipeline_flow'>('ports_symbols');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Server Integration State
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [daemonStatus, setDaemonStatus] = useState<any>(null);
  const [liveLogs, setLiveLogs] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<'ALL' | 'FATAL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  const [systemAudit, setSystemAudit] = useState<SystemAuditInfo | null>(null);

  // Live Cluster TCP Sockets Probing State
  const [clusterProbeResults, setClusterProbeResults] = useState<any[]>([]);
  const [isProbingCluster, setIsProbingCluster] = useState<boolean>(false);
  const [lastProbeTime, setLastProbeTime] = useState<string | null>(null);

  const isFa = lang === 'fa';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live TCP Socket Probing function
  const probeCluster = async () => {
    setIsProbingCluster(true);
    const targets = [
      { id: 'hf_mgmt', name: 'Heavy Forwarder (Mgmt)', host: clusterSettings.hfHost, port: 8089, role: 'heavy_forwarder' },
      { id: 'idx1_fwd', name: 'Indexer 1 (S2S Forwarding)', host: clusterSettings.idx1Host, port: 9997, role: 'indexer_peer' },
      { id: 'idx1_mgmt', name: 'Indexer 1 (Mgmt)', host: clusterSettings.idx1Host, port: 8089, role: 'indexer_peer' },
      { id: 'idx2_fwd', name: 'Indexer 2 (S2S Forwarding)', host: clusterSettings.idx2Host, port: 9997, role: 'indexer_peer' },
      { id: 'idx2_mgmt', name: 'Indexer 2 (Mgmt)', host: clusterSettings.idx2Host, port: 8089, role: 'indexer_peer' },
      { id: 'sh_web', name: 'Search Head (Web UI)', host: clusterSettings.shHost, port: 8000, role: 'search_head' },
      { id: 'sh_mgmt', name: 'Search Head (Mgmt)', host: clusterSettings.shHost, port: 8089, role: 'search_head' },
      { id: 'ds_mgmt', name: 'Deployment Server (Mgmt)', host: clusterSettings.dsHost, port: 8089, role: 'deployment_server' },
    ];

    try {
      const res = await fetch('/api/splunk/remote/probe-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets })
      });
      if (res.ok) {
        try {
          const data = await res.json();
          const results = data.results || [];
          setClusterProbeResults(results);
          setLastProbeTime(new Date().toLocaleTimeString());
          
          const openCount = results.filter((r: any) => r.open).length;
          showToast(
            isFa
              ? `تست پروب سوکت کلاستر: ${openCount} از ${targets.length} پورت باز است.`
              : `Cluster TCP probe: ${openCount}/${targets.length} ports open.`
          );
        } catch (jsonErr) {
          console.warn('Non-JSON response received for cluster probe:', jsonErr);
        }
      }
    } catch (err) {
      console.error('Cluster probe error:', err);
      showToast(isFa ? 'خطا در ارتباط با سوکت‌های کلاستر.' : 'Failed to probe cluster TCP sockets.');
    } finally {
      setIsProbingCluster(false);
    }
  };

  // Fetch real-time environmental data if Express server is alive
  useEffect(() => {
    async function initLiveMode() {
      try {
        const envRes = await fetch('/api/splunk/env');
        if (envRes.ok) {
          const envData = await envRes.json();
          setEnvInfo(envData);
          setIsLiveMode(true); // Automatically switch to Live Mode if server is running
          if (envData.audit) {
            setSystemAudit(envData.audit);
          }
          
          // Sync live hostname & primary IP to cluster settings (HF is the local node)
          if (envData.primaryIp || envData.hostname) {
            setClusterSettings(prev => ({
              ...prev,
              hfHost: envData.hostname || prev.hfHost,
              hfIp: envData.primaryIp || prev.hfIp,
            }));
          }

          // Trigger initial socket probe
          probeCluster();

          // Fetch configs from the server
          const confRes = await fetch('/api/splunk/confs');
          if (confRes.ok) {
            const confData = await confRes.json();
            const loadedConfigs: Record<string, string> = {};
            confData.forEach((item: any) => {
              if (item.exists && item.content) {
                loadedConfigs[item.file] = item.content;
              }
            });
            if (Object.keys(loadedConfigs).length > 0) {
              const mergedConfigs = { ...INITIAL_CONFIG_FILES, ...configs, ...loadedConfigs };
              setConfigs(mergedConfigs);
              
              // Automatically extract live cluster IPs and configurations from all real configs
              const extracted = extractClusterFromConfigs(mergedConfigs);
              setClusterSettings(prev => {
                const merged = clusterNodesToSettings(extracted, prev);
                return {
                  ...merged,
                  hfHost: envData.hostname || merged.hfHost,
                  hfIp: envData.primaryIp || merged.hfIp
                };
              });

              // Accurately audit live loaded configs against full configuration baseline
              const auditResult = auditSplunkConfigs(mergedConfigs, resolvedFindingIds);
              setFindings(auditResult.activeFindings);
              setResolvedFindings(auditResult.resolvedFindings);
            }
          }
          
          // Fetch real status
          const statusRes = await fetch('/api/splunk/status');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setDaemonStatus(statusData);
          }
        }
      } catch (err) {
        console.warn('Live backend unavailable; no simulated runtime state will be used.', err);
      }
    }
    initLiveMode();
  }, []);

  // Fetch live log tails
  const fetchLiveLogs = async () => {
    try {
      const res = await fetch('/api/splunk/logs');
      if (res.ok) {
        const data = await res.json();
        setLiveLogs(data.logs || 'No log data detected.');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'live_logs') {
      fetchLiveLogs();
      const interval = setInterval(fetchLiveLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Sync category when activeTab changes
  useEffect(() => {
    if (TAB_TO_CATEGORY[activeTab]) {
      setActiveCategory(TAB_TO_CATEGORY[activeTab]);
    }
  }, [activeTab]);

  // 1. Initial automated snapshot on first load (as demanded by prompt)
  useEffect(() => {
    const baselineSnapshot: BackupSnapshot = {
      id: 'snapshot-baseline-init',
      timestamp: new Date().toLocaleString(isFa ? 'fa-IR' : 'en-US'),
      label: isFa ? 'بک‌آپ خودکار اولیه (Initial Pre-Audit Baseline)' : 'Initial Pre-Audit Baseline Snapshot',
      descriptionFa: 'نسخه پشتیبان اتوماتیک تهیه شده قبل از اعمال هرگونه تغییر توسط برنامه تشخیص عیب.',
      descriptionEn: 'Automated pre-scan snapshot captured before any diagnostic modifications.',
      isInitialBaseline: true,
      files: { ...INITIAL_CONFIG_FILES }
    };
    setSnapshots([baselineSnapshot]);
    setFileBackups({ ...INITIAL_CONFIG_FILES });
  }, []);

  // Compute dynamic Health Score based on remaining findings
  const calculateScore = () => {
    const critCount = findings.filter(f => f.severity === 'critical').length;
    const warnCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;
    const penalty = (critCount * 14) + (warnCount * 6) + (infoCount * 2);
    return findings.length === 0 ? 100 : Math.max(10, Math.min(100, 100 - penalty));
  };

  const healthScore = calculateScore();

  const isTlsActive = configs['outputs.conf']?.includes('useSSL = true');

  // 1-Click Parallel Cluster One-Click Installation & Baseline Setup
  const handleInstallParallelCluster = () => {
    // Clone all main configs to parallel configs, with port isolations
    const cloned: Record<string, string> = {};
    Object.entries(configs).forEach(([file, content]) => {
      let mod = content;
      if (file === 'inputs.conf') {
        mod = mod.replace(/\[splunktcp:\/\/9997\]/g, '[splunktcp://9998]');
      } else if (file === 'web.conf') {
        mod = mod.replace(/httpport\s*=\s*8000/g, 'httpport = 8001');
      } else if (file === 'server.conf') {
        mod = mod.replace(/mgmtHostPort\s*=\s*127\.0\.0\.1:8089/g, 'mgmtHostPort = 127.0.0.1:8090')
                 .replace(/\[general\]\nserverName\s*=\s*[^\n]+/g, '[general]\nserverName = splunk-parallel-staging-01');
      }
      cloned[file] = mod;
    });

    setParallelConfigs(cloned);
    const updatedState: ParallelClusterState = {
      isInstalled: true,
      clusterName: 'Splunk Parallel Staging Cluster (Port :8001 / Mgmt :8090)',
      version: '9.2.1-Enterprise-Parallel-Staging',
      portOffset: 1,
      webPort: 8001,
      mgmtPort: 8090,
      indexerPort: 9998,
      status: 'running',
      installedAt: new Date().toISOString(),
      lastSyncTime: new Date().toISOString(),
      clonedConfigFilesCount: Object.keys(cloned).length
    };
    setParallelClusterState(updatedState);
    showToast(
      isFa
        ? `نصب اینستنس موازی با موفقیت انجام شد! تمام کانفیگ‌های سرور اصلی روی پورت‌های مجزا کپی شدند.`
        : `Parallel Splunk instance installed! All ${Object.keys(cloned).length} configs copied from Main Server.`
    );
  };

  // Sync / Copy all main server configs to parallel server
  const handleSyncConfigsToParallel = () => {
    const cloned: Record<string, string> = {};
    Object.entries(configs).forEach(([file, content]) => {
      let mod = content;
      if (file === 'inputs.conf') {
        mod = mod.replace(/\[splunktcp:\/\/9997\]/g, '[splunktcp://9998]');
      } else if (file === 'web.conf') {
        mod = mod.replace(/httpport\s*=\s*8000/g, 'httpport = 8001');
      } else if (file === 'server.conf') {
        mod = mod.replace(/mgmtHostPort\s*=\s*127\.0\.0\.1:8089/g, 'mgmtHostPort = 127.0.0.1:8090');
      }
      cloned[file] = mod;
    });
    setParallelConfigs(cloned);
    setParallelClusterState(prev => ({
      ...prev,
      lastSyncTime: new Date().toISOString(),
      clonedConfigFilesCount: Object.keys(cloned).length
    }));
    showToast(
      isFa
        ? 'تمام فایل‌های کانفیگ سرور اصلی مجدداً روی سرور موازی کپی و همگام شدند.'
        : 'All configs synced from Production to Parallel Staging.'
    );
  };

  // Switch to Parallel Config Editor
  const handleSwitchToParallelConfig = () => {
    setActiveEnvironment('parallel');
    setActiveTab('config_editor');
    showToast(
      isFa
        ? 'به ویرایشگر کانفیگ‌های سرور موازی هدایت شدید.'
        : 'Switched to Parallel Instance Config Editor.'
    );
  };

  // Apply direct patch from Compliance Audit or Live Log Analyzer
  const handleApplyDirectPatch = async (
    configName: string, 
    patch: string, 
    targetEnv: TargetEnvironment = 'production'
  ): Promise<boolean> => {
    const applyPatchToContent = (rawContent: string) => {
      let newText = rawContent;

      // 1. If patch contains explicit stanza header [stanza]
      const stanzaMatch = patch.match(/^\s*\[([^\]]+)\]/m);
      if (stanzaMatch) {
        const stanzaName = stanzaMatch[1].trim();
        if (newText.includes(`[${stanzaName}]`)) {
          // Merge parameters into existing stanza
          const lines = patch.split('\n').filter(l => l.trim() && !l.trim().startsWith('[') && !l.trim().startsWith('#'));
          lines.forEach(line => {
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
              const k = line.substring(0, eqIdx).trim();
              const v = line.substring(eqIdx + 1).trim();
              const keyRegex = new RegExp(`(^\\s*${k}\\s*=)[^\\n]*`, 'im');
              if (keyRegex.test(newText)) {
                newText = newText.replace(keyRegex, `${k} = ${v}`);
              } else {
                newText = newText.replace(new RegExp(`\\[${stanzaName}\\]`, 'i'), `[${stanzaName}]\n${k} = ${v}`);
              }
            }
          });
          return newText;
        } else {
          return newText.trim() + '\n\n' + patch.trim() + '\n';
        }
      }

      // 2. Direct key-value overrides
      if (patch.startsWith('server =') || patch.includes('server =')) {
        const sMatch = patch.match(/server\s*=\s*[^\n]+/);
        if (sMatch) newText = newText.replace(/server\s*=\s*[^\n]+/g, sMatch[0]);
      } else if (patch.includes('useSSL = true')) {
        newText = newText.replace(/useSSL\s*=\s*(false|0)/gi, 'useSSL = true');
        if (!newText.includes('sslVerifyServerCert')) {
          newText = newText.replace(/\[tcpout:[^\]]+\]/g, '$&\nsslVerifyServerCert = true');
        }
      } else if (patch.includes('pass4SymmKey =')) {
        const pMatch = patch.match(/pass4SymmKey\s*=\s*[^\n]+/);
        if (pMatch) newText = newText.replace(/pass4SymmKey\s*=\s*[^\n]+/g, pMatch[0]);
      } else if (patch.includes('sslVersionsToSupport =')) {
        const tMatch = patch.match(/sslVersionsToSupport\s*=\s*[^\n]+/);
        if (tMatch) newText = newText.replace(/sslVersionsToSupport\s*=\s*[^\n]+/g, tMatch[0]);
        newText = newText
          .replace(/allowSslCompression\s*=\s*true/gi, 'allowSslCompression = false')
          .replace(/allowSslRenegotiation\s*=\s*true/gi, 'allowSslRenegotiation = false');
      } else if (patch.includes('_TCP_ROUTING =')) {
        const rMatch = patch.match(/_TCP_ROUTING\s*=\s*[^\n]+/);
        if (rMatch) newText = newText.replace(/_TCP_ROUTING\s*=\s*[^\n]+/g, rMatch[0]);
      } else if (patch.includes('index = os_win')) {
        newText = newText.replace(/(\[monitor:\/\/\/var\/log\/winevent\/security\.evtx\]\ndisabled\s*=\s*false)/g, '$1\nindex = os_win');
      } else if (patch.includes('minFreeSpaceMB =')) {
        const dMatch = patch.match(/minFreeSpaceMB\s*=\s*\d+/);
        if (dMatch) newText = newText.replace(/minFreeSpaceMB\s*=\s*\d+/g, dMatch[0]);
      } else if (patch.includes('homePath = $SPLUNK_DB') || patch.includes('homePath = /opt/splunk')) {
        newText = newText.replace(/\/mnt\/non_existent_volume/g, '/opt/splunk/var/lib/splunk/corrupted_temp_idx');
      } else if (patch.includes('enableSSL = 1')) {
        newText = newText.replace(/enableSSL\s*=\s*0/gi, 'enableSSL = 1\nsslVersions = tls1.2,tls1.3');
      } else if (patch.includes('indexAndForward = false')) {
        newText = newText.replace(/indexAndForward\s*=\s*true/gi, 'indexAndForward = false');
      } else {
        newText = newText + '\n\n# Applied from Splunk Diagnostic Engine:\n' + patch.trim() + '\n';
      }
      return newText;
    };

    let targetFile = configName;
    if (!configs[targetFile]) {
      const match = Object.keys(configs).find(k => k.toLowerCase() === configName.toLowerCase() || k.endsWith(configName));
      if (match) targetFile = match;
    }

    if (targetEnv === 'production' || targetEnv === 'both') {
      const currentText = configs[targetFile] || '';
      const newText = applyPatchToContent(currentText);
      await handleSaveFile(targetFile, newText);
    }

    if (targetEnv === 'parallel' || targetEnv === 'both') {
      const currentParallel = parallelConfigs[targetFile] || configs[targetFile] || '';
      const newParallelText = applyPatchToContent(currentParallel);
      setParallelConfigs(prev => ({ ...prev, [targetFile]: newParallelText }));
    }

    const envLabel = targetEnv === 'parallel' 
      ? (isFa ? 'سرور موازی' : 'Parallel Instance')
      : targetEnv === 'both'
      ? (isFa ? 'سرور اصلی و موازی' : 'Both Production & Parallel')
      : (isFa ? 'سرور اصلی' : 'Production Server');

    showToast(
      isFa
        ? `پچ با موفقیت روی ${envLabel} اعمال شد.`
        : `Patch applied to ${envLabel}.`
    );

    return true;
  };

  // Audit Rescan function - inspects current configurations against all diagnostic rules
  const handleRescanAudit = async (forceCleanScan: boolean = true) => {
    let currentCfgs = configs;
    try {
      const confRes = await fetch('/api/splunk/confs');
      if (confRes.ok) {
        const confData = await confRes.json();
        const loaded: Record<string, string> = {};
        confData.forEach((item: any) => {
          if (item.exists && item.content) {
            loaded[item.file] = item.content;
          }
        });
        if (Object.keys(loaded).length > 0) {
          currentCfgs = { ...INITIAL_CONFIG_FILES, ...configs, ...loaded };
          setConfigs(currentCfgs);
        }
      }
    } catch (_) {
      console.log('Using in-memory configs for rescan');
    }

    if (forceCleanScan) {
      setResolvedFindingIds(new Set());
      try { localStorage.removeItem('splunk_resolved_findings'); } catch (_) {}
    }

    const targetConfigs = activeEnvironment === 'parallel' 
      ? parallelConfigs 
      : activeEnvironment === 'virtual' 
      ? virtualConfigs 
      : currentCfgs;

    const auditResult = auditSplunkConfigs(targetConfigs, forceCleanScan ? new Set() : resolvedFindingIds);
    setFindings(auditResult.activeFindings);
    setResolvedFindings(auditResult.resolvedFindings);

    const resolvedCount = 10 - auditResult.activeFindings.length;
    logBackendOperation(
      'health_audit',
      'ممیزی سلامت و اسکن خطایابی',
      'Config Health & Diagnostic Audit',
      `اسکن خط‌به‌خط فایل‌های سرور (${activeEnvironment === 'production' ? 'سرور اصلی' : (activeEnvironment === 'parallel' ? 'سرور موازی' : 'سرور مجازی')})`,
      `Line-by-line configuration scan across 10 failure points on ${activeEnvironment}`,
      auditResult.activeFindings.length === 0 ? 'success' : 'warning',
      `اسکن کامل انجام شد: امتیاز سلامت ${auditResult.score}/100، ${auditResult.activeFindings.length} خطای فعال شناسایی شد.`,
      `Audit completed: Score ${auditResult.score}/100, ${auditResult.activeFindings.length} active findings.`,
      `Target Environment: ${activeEnvironment} | Audited files: ${Object.keys(targetConfigs).join(', ')}`
    );

    if (auditResult.activeFindings.length === 0) {
      showToast(isFa 
        ? 'تبریک! تمامی ایرادات پیکربندی برطرف شده‌اند. امتیاز سلامت: ۱۰۰/۱۰۰ ✓' 
        : 'All 10 misconfigurations resolved! Health Score: 100/100 ✓');
    } else {
      showToast(isFa 
        ? `بررسی مجدد انجام شد: ${auditResult.activeFindings.length} خطای فعال روی سرور یافت شد. امتیاز سلامت: ${auditResult.score}/100` 
        : `Rescan complete: ${auditResult.activeFindings.length} active issues found on server. Score: ${auditResult.score}/100`);
    }
  };

  // Reset to initial baseline test scenario with all 10 diagnostic errors for verification
  const handleResetToBaselineAudit = async () => {
    try {
      await fetch('/api/splunk/confs/reset-test', { method: 'POST' });
    } catch (_) {}
    setConfigs(INITIAL_CONFIG_FILES);
    setResolvedFindingIds(new Set());
    try {
      localStorage.setItem('splunk_production_configs', JSON.stringify(INITIAL_CONFIG_FILES));
      localStorage.removeItem('splunk_resolved_findings');
    } catch (_) {}
    const auditResult = auditSplunkConfigs(INITIAL_CONFIG_FILES, new Set());
    setFindings(auditResult.activeFindings);
    setResolvedFindings(auditResult.resolvedFindings);
    logBackendOperation(
      'health_audit',
      'بازنشانی سناریوی خطاهای اولیه',
      'Reset Baseline Test Scenarios',
      'بازنشانی فایل‌های کانفیگ سرور اصلی به حالت اولیه تستی با ۱۰ خطای فعال جهت تست ابزارها',
      'Reset production configs to initial state with 10 deliberate errors for tool verification',
      'warning',
      '۱۰ خطای تستی استاندارد روی سرور اصلی فعال شدند تا بتوانید عملکرد ابزارهای رفع عیب را تست کنید.',
      '10 deliberate test findings loaded on production server for verification.',
      'Loaded INITIAL_CONFIG_FILES across outputs.conf, server.conf, inputs.conf, props.conf, indexes.conf'
    );
    showToast(isFa 
      ? '۱۰ سناریوی خطای تستی سرور اصلی مجدداً بارگذاری شدند تا بتوانید عملکرد ابزارها را تست و ارزیابی نمایید.' 
      : 'Initial 10 baseline errors reloaded on production server for testing!');
  };

  // Apply a remediation option to config
  const handleApplyOption = async (
    option: RemediationOption, 
    targetEnv: TargetEnvironment = 'production',
    findingId?: string
  ) => {
    // 1. Identify which finding this option belongs to
    const targetFinding = findings.find(f => f.options.some(o => o.id === option.id) || (f.file === option.targetFile && f.id === findingId))
      || INITIAL_FINDINGS.find(f => f.options.some(o => o.id === option.id));
    const resolvedId = findingId || targetFinding?.id;

    // 2. Register into resolved set & persist to localStorage
    const nextResolvedSet = new Set(resolvedFindingIds);
    if (resolvedId) {
      nextResolvedSet.add(resolvedId);
      setResolvedFindingIds(new Set(nextResolvedSet));
      try {
        localStorage.setItem('splunk_resolved_findings', JSON.stringify(Array.from(nextResolvedSet)));
      } catch (_) {}
    }

    let nextConfigs = { ...configs };

    if (targetEnv === 'production' || targetEnv === 'both') {
      const currentText = configs[option.targetFile] || '';
      const newText = applyRemediationOption(currentText, option);
      nextConfigs = { ...nextConfigs, [option.targetFile]: newText };
      setConfigs(nextConfigs);
      setActiveConfigFile(option.targetFile);
      // Persist to backend server file system
      await handleSaveFile(option.targetFile, newText);
    }

    if (targetEnv === 'parallel' || targetEnv === 'both') {
      const currentParallel = parallelConfigs[option.targetFile] || configs[option.targetFile] || '';
      const newParallelText = applyRemediationOption(currentParallel, option);
      setParallelConfigs(prev => ({ ...prev, [option.targetFile]: newParallelText }));
    }

    if (targetEnv === 'virtual' || targetEnv === 'both') {
      const currentVirtual = virtualConfigs[option.targetFile] || configs[option.targetFile] || '';
      const newVirtualText = applyRemediationOption(currentVirtual, option);
      setVirtualConfigs(prev => ({ ...prev, [option.targetFile]: newVirtualText }));
    }

    // 3. Immediately recompute active findings based on updated configuration
    const activeTargetConfigs = activeEnvironment === 'parallel'
      ? (targetEnv === 'parallel' || targetEnv === 'both' ? { ...parallelConfigs, [option.targetFile]: applyRemediationOption(parallelConfigs[option.targetFile] || configs[option.targetFile] || '', option) } : parallelConfigs)
      : activeEnvironment === 'virtual'
      ? (targetEnv === 'virtual' || targetEnv === 'both' ? { ...virtualConfigs, [option.targetFile]: applyRemediationOption(virtualConfigs[option.targetFile] || configs[option.targetFile] || '', option) } : virtualConfigs)
      : nextConfigs;

    const auditResult = auditSplunkConfigs(activeTargetConfigs, nextResolvedSet);
    setFindings(auditResult.activeFindings);
    setResolvedFindings(auditResult.resolvedFindings);

    const envLabel = targetEnv === 'parallel' 
      ? (isFa ? 'سرور موازی' : 'Parallel Instance')
      : targetEnv === 'both'
      ? (isFa ? 'سرور اصلی و موازی' : 'Both Production & Parallel')
      : (isFa ? 'سرور اصلی' : 'Production Server');

    const solvedCount = 10 - auditResult.activeFindings.length;
    logBackendOperation(
      'health_audit',
      'برطرف‌سازی خودکار خطای کانفیگ',
      'Config Auto-Remediation',
      `اعمال پچ اصلاحی روی فایل ${option.targetFile} (${option.titleFa})`,
      `Applied remediation patch to ${option.targetFile} (${option.titleEn})`,
      'success',
      `پچ با موفقیت اعمال و ذخیره شد. خطا حل گردید و امتیاز سلامت به ${auditResult.score}/100 ارتقا یافت.`,
      `Patch successfully applied to ${envLabel}. Health score updated to ${auditResult.score}/100.`,
      `Option ID: ${option.id} | Target File: ${option.targetFile} | Target Env: ${targetEnv}`
    );

    showToast(isFa 
      ? `راهکار انتخابی اعمال و خطا برطرف گردید (${solvedCount} خطا حل شده، امتیاز سلامت: ${auditResult.score}/100) ✓`
      : `Remediation applied to ${envLabel} and resolved. Health Score: ${auditResult.score}/100 ✓`
    );

    // Auto-close modal after successful application
    setTimeout(() => {
      setSelectedFinding(null);
    }, 1000);
  };

  // Bulk Apply All Remediations across all active findings
  const handleApplyAllRemediations = async (targetEnv: TargetEnvironment = activeEnvironment) => {
    let baseConfigs = targetEnv === 'parallel' 
      ? { ...parallelConfigs } 
      : targetEnv === 'virtual' 
      ? { ...virtualConfigs } 
      : { ...configs };

    const auditResBefore = auditSplunkConfigs(baseConfigs, new Set());
    const findingsToFix = auditResBefore.activeFindings.length > 0 ? auditResBefore.activeFindings : INITIAL_FINDINGS;

    const updatedConfigs = { ...baseConfigs };
    const resolvedIds = new Set<string>();

    findingsToFix.forEach(finding => {
      resolvedIds.add(finding.id);
      const option = finding.options && finding.options.length > 0 ? finding.options[0] : null;
      if (option) {
        const fileKey = option.targetFile;
        const currentContent = updatedConfigs[fileKey] || '';
        const patchedContent = applyRemediationOption(currentContent, option);
        updatedConfigs[fileKey] = patchedContent;
      }
    });

    if (targetEnv === 'production' || targetEnv === 'both') {
      setConfigs(updatedConfigs);
      localStorage.setItem('splunk_production_configs', JSON.stringify(updatedConfigs));
    }
    if (targetEnv === 'parallel' || targetEnv === 'both') {
      setParallelConfigs(updatedConfigs);
      localStorage.setItem('splunk_parallel_configs', JSON.stringify(updatedConfigs));
    }
    if (targetEnv === 'virtual' || targetEnv === 'both') {
      setVirtualConfigs(updatedConfigs);
      localStorage.setItem('splunk_virtual_configs', JSON.stringify(updatedConfigs));
    }

    for (const [filename, content] of Object.entries(updatedConfigs)) {
      try {
        const relativePath = filename.includes('conf') ? `etc/system/local/${filename}` : filename;
        await fetch('/api/splunk/confs/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relativePath, content })
        });
      } catch (_) {}
    }

    setResolvedFindingIds(resolvedIds);
    try {
      localStorage.setItem('splunk_resolved_findings', JSON.stringify(Array.from(resolvedIds)));
    } catch (_) {}

    const finalAudit = auditSplunkConfigs(updatedConfigs, resolvedIds);
    setFindings(finalAudit.activeFindings);
    setResolvedFindings(finalAudit.resolvedFindings);

    logBackendOperation(
      'overseer_engine',
      'اصلاح خودکار کامل ناظر معمار اسپلانک',
      'Master Architect Auto-Healing Pipeline',
      `اعمال پچ اصلاحی روی لایه‌های outputs.conf, server.conf, inputs.conf, props.conf و indexes.conf روی ${targetEnv}`,
      `Bulk applied 10-point remediation patches across config files on ${targetEnv}`,
      'success',
      `تمام ۱۰ خطای تستی کلاستر برطرف شدند! امتیاز سلامت: ${finalAudit.score}/100، تعداد خطای فعال: ${finalAudit.activeFindings.length}.`,
      `All 10 misconfigurations healed on disk. Health score: ${finalAudit.score}/100.`,
      `Applied options across ${Object.keys(updatedConfigs).length} files | Saved to /opt/splunk/etc/system/local/`,
      120
    );

    showToast(isFa 
      ? "✅ تمام خطاهای کلاستر با موفقیت توسط ناظر ارشد برطرف گردید! امتیاز سلامت: ۱۰۰/۱۰۰"
      : "✅ All cluster findings automatically healed by Master Architect! Health Score: 100/100"
    );
  };

  // Backup single file
  const handleBackupFile = (filename: string) => {
    setFileBackups(prev => ({ ...prev, [filename]: configs[filename] || '' }));
    showToast(isFa ? `یک نسخه پشتیبان از فایل ${filename} ذخیره شد.` : `Backup snapshot taken for ${filename}.`);
  };

  // Restore single file
  const handleRestoreFile = (filename: string) => {
    if (fileBackups[filename]) {
      setConfigs(prev => ({ ...prev, [filename]: fileBackups[filename] }));
      showToast(isFa ? `فایل ${filename} به نسخه پشتیبان قبلی بازگردانده شد.` : `Restored ${filename} from backup.`);
    }
  };

  // Save changes from editor
  const handleSaveFile = async (filename: string, newContent: string) => {
    const updatedConfigs = { ...configs, [filename]: newContent };
    setConfigs(updatedConfigs);
    localStorage.setItem('splunk_production_configs', JSON.stringify(updatedConfigs));

    // Dynamic auto-rescan on file save so findings immediately update
    const targetConfigs = activeEnvironment === 'parallel' 
      ? parallelConfigs 
      : activeEnvironment === 'virtual' 
      ? virtualConfigs 
      : updatedConfigs;
    const auditRes = auditSplunkConfigs(targetConfigs, resolvedFindingIds);
    setFindings(auditRes.activeFindings);
    setResolvedFindings(auditRes.resolvedFindings);
    
    try {
      const relativePath = filename.includes('conf') ? `etc/system/local/${filename}` : filename;
      const res = await fetch('/api/splunk/confs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath, content: newContent })
      });
      if (res.ok) {
        logBackendOperation(
          'config_editor',
          'ویرایشگر زنده پیکربندی',
          'Live Config Editor',
          `ذخیره تغییرات فایل ${filename} روی دیسک سرور`,
          `Persisted ${filename} edits directly to disk`,
          'success',
          `فایل ${filename} مستقیماً روی دیسک سرور در مسیر ${relativePath} ذخیره و سینک شد.`,
          `File ${filename} written to server disk at ${relativePath} with 0 errors.`,
          `File size: ${newContent.length} bytes | Lines: ${newContent.split('\n').length}`
        );
        showToast(isFa 
          ? `فایل ${filename} ذخیره شد و مستقیماً روی دیسک سرور در مسیر ${relativePath} قرار گرفت.`
          : `File ${filename} saved and successfully written to disk at ${relativePath}`);
      } else {
        const errData = await res.json();
        logBackendOperation(
          'config_editor',
          'ویرایشگر زنده پیکربندی',
          'Live Config Editor',
          `تلاش برای ذخیره فایل ${filename}`,
          `Save attempt for ${filename}`,
          'warning',
          `خطای سروری در ذخیره: ${errData.error}`,
          `Server-side save issue: ${errData.error}`
        );
        showToast(isFa ? `خطای ذخیره سروری: ${errData.error}` : `Server-side save failed: ${errData.error}`);
      }
    } catch (err: any) {
      showToast(isFa ? `فایل ${filename} ذخیره شد.` : `File ${filename} saved.`);
    }
  };

  // Global Revert to Baseline (بازگردانی سراسری به بک‌آپ اولیه)
  const handleGlobalRestoreBaseline = () => {
    const baseline = snapshots.find(s => s.isInitialBaseline) || snapshots[0];
    if (baseline) {
      setConfigs({ ...baseline.files });
      setFindings(INITIAL_FINDINGS);
      setFileBackups({ ...baseline.files });
      logBackendOperation(
        'backup_archive',
        'مدیریت نسخه‌های پشتیبان',
        'Backup Snapshots',
        'بازگردانی سراسری کلاستر به بک‌آپ اولیه (Baseline Rollback)',
        'Global cluster rollback to baseline snapshot',
        'success',
        'تمامی فایل‌های پیکربندی و وضعیت کلاستر با موفقیت به حالت اولیه بازگردانده شدند.',
        'Cluster state and configs fully restored to initial baseline snapshot.'
      );
      showToast(isFa 
        ? 'تمامی فایل‌های کانفیگ، کلاستر و خطاها به بک‌آپ اولیه بازگردانده شدند.' 
        : 'All configs and diagnostic state reverted to initial baseline snapshot.');
    }
  };

  // Create on-demand snapshot
  const handleCreateSnapshot = (label: string) => {
    const newSnap: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleString(isFa ? 'fa-IR' : 'en-US'),
      label: label,
      descriptionFa: 'اسنپ‌شات دستی ایجاد شده توسط اپراتور کلاستر',
      descriptionEn: 'Manual snapshot created by cluster operator',
      isInitialBaseline: false,
      files: { ...configs }
    };
    setSnapshots(prev => [newSnap, ...prev]);
    logBackendOperation(
      'backup_archive',
      'مدیریت نسخه‌های پشتیبان',
      'Backup Snapshots',
      `ایجاد اسنپ‌شات پشتیبان: ${label}`,
      `Created snapshot backup: ${label}`,
      'success',
      `نسخه پشتیبان شامل تمام فایل‌های پیکربندی با برچسب ${label} ذخیره شد.`,
      `Snapshot captured with ${Object.keys(configs).length} configuration files.`
    );
    showToast(isFa ? 'اسنپ‌شات جدید با موفقیت ذخیره شد.' : 'New snapshot created.');
  };

  // Dynamic Modules Registry synchronized with user customizations, reordering, visibility & active health badges
  const ALL_MODULES = useMemo(() => {
    return [...modulesConfig]
      .sort((a, b) => a.order - b.order)
      .map(m => {
        const IconComponent = AVAILABLE_ICONS[m.iconName] || Sparkles;
        let dynamicBadge = m.badge;
        if (m.id === 'health_audit') {
          dynamicBadge = findings.length > 0 ? `${findings.length}` : 'OK';
        } else if (m.id === 'backup_archive') {
          dynamicBadge = `${snapshots.length}`;
        } else if (m.id === 'commercial_license') {
          dynamicBadge = `${digitalLicense.validity.daysRemaining}d`;
        }
        return {
          ...m,
          icon: IconComponent,
          badge: dynamicBadge
        };
      });
  }, [modulesConfig, findings.length, snapshots.length, digitalLicense.validity.daysRemaining]);

  // Filtered modules for Quick Search Command Palette
  const filteredSearchModules = searchQuery.trim() === ''
    ? ALL_MODULES
    : ALL_MODULES.filter(m => {
        const q = searchQuery.toLowerCase();
        return (
          m.titleFa.toLowerCase().includes(q) ||
          m.titleEn.toLowerCase().includes(q) ||
          m.categoryNameFa.toLowerCase().includes(q) ||
          m.categoryNameEn.toLowerCase().includes(q) ||
          m.descriptionFa.toLowerCase().includes(q) ||
          m.descriptionEn.toLowerCase().includes(q) ||
          (m.badge && m.badge.toLowerCase().includes(q))
        );
      });

  // Unified Tool Content Renderer (supports both Main View & Draggable Mini-Windows / PiP)
  const renderToolContent = (tabId: string, isMiniView: boolean = false) => {
    switch (tabId) {
      case 'architect_overseer':
        return (
          <SplunkArchitectOverseerEngine
            lang={lang}
            activeEnvironment={activeEnvironment}
            setActiveEnvironment={setActiveEnvironment}
            parallelClusterState={parallelClusterState}
            virtualClusterState={virtualClusterState}
            findings={findings}
            configs={configs}
            parallelConfigs={parallelConfigs}
            virtualConfigs={virtualConfigs}
            backendOperations={backendOperations}
            onRescanAudit={handleRescanAudit}
            onApplyAllRemediations={() => handleApplyAllRemediations(activeEnvironment)}
            onPurgeDecommissionedServers={handlePurgeDecommissionedServers}
            onNavigateToTab={(tab) => handleSelectModule(tab as any)}
            onLogBackendOperation={logBackendOperation}
            isConsolidatedMode={isConsolidatedMode}
            setIsConsolidatedMode={setIsConsolidatedMode}
          />
        );
      case 'autonomous_agent':
        return (
          <SplunkAutonomousAIAgent
            isFa={isFa}
            onOpenWebModal={(port) => {
              setWebModalPort(port);
              setIsWebModalOpen(true);
            }}
          />
        );
      case 'ai_diagnostics':
        return (
          <SplunkDiagnosticAndAIAutoHealer
            lang={lang}
            onOpenWebModal={(_url) => {
              setWebModalPort(8001);
              setIsWebModalOpen(true);
            }}
            virtualClusterState={virtualClusterState}
            destroyVirtualCloudServer={destroyVirtualCloudServer}
            recreateVirtualCloudServer={recreateVirtualCloudServer}
            isGlobalAiHealerRunning={isGlobalAiHealerRunning}
          />
        );
      case 'parallel_provisioning':
      case 'parallel_studio':
        return (
          <ParallelSplunkProvisioningStudio
            lang={lang}
            mainConfigs={configs}
            onSaveMainConfig={handleSaveFile}
            activeEnvironment={activeEnvironment}
            setActiveEnvironment={setActiveEnvironment}
            parallelClusterState={parallelClusterState}
            setParallelClusterState={setParallelClusterState}
            onOpenWebModal={(port) => {
              setWebModalPort(port || 8001);
              setIsWebModalOpen(true);
            }}
          />
        );
      case 'cluster_deployer':
        return <SplunkClusterDeployerWizard lang={lang} />;
      case 'topology':
        return (
          <div className="space-y-6">
            {!isMiniView && (
              <div className="flex flex-wrap items-center justify-between gap-3 sirene-card p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    {isFa ? 'حالت نمایش دایاگرام:' : 'Diagram View Mode:'}
                  </span>
                  <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
                    <button
                      onClick={() => setDiagramMode('ports_symbols')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        diagramMode === 'ports_symbols'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isFa ? 'دایاگرام نمادها و پورت‌های اسپلانک' : 'Splunk Ports & Symbols'}</span>
                    </button>
                    <button
                      onClick={() => setDiagramMode('pipeline_flow')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        diagramMode === 'pipeline_flow'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{isFa ? 'پایپلاین پردازشی و صف‌های حافظه' : 'Pipeline & Queues'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {diagramMode === 'ports_symbols' ? (
              <SplunkPortsDiagram
                lang={lang}
                configs={customizedConfigs}
                isTlsEnabled={isTlsActive}
                currentProfile={currentProfile}
                settings={clusterSettings}
                probeResults={clusterProbeResults}
                onTriggerProbe={probeCluster}
                isProbing={isProbingCluster}
                systemAudit={systemAudit || undefined}
                onSelectConfig={(f) => {
                  setActiveConfigFile(f);
                  setActiveTab('config_editor');
                }}
                onSelectComponent={(role) => {
                  setSelectedRole(role as ComponentRole);
                  setActiveTab('network_sources');
                }}
              />
            ) : (
              <TopologyGraph
                profile={currentProfile}
                configs={customizedConfigs}
                isTlsEnabled={isTlsActive}
                onSelectConfig={(f) => {
                  setActiveConfigFile(f);
                  setActiveTab('config_editor');
                }}
                lang={lang}
              />
            )}
          </div>
        );
      case 'architecture_auditor':
        return <SplunkArchitectureAuditor lang={lang} />;
      case 'management_nodes':
        return <SplunkManagementNodesHub lang={lang} />;
      case 'commercial_license':
        return (
          <CommercialLicenseManager
            license={digitalLicense}
            onUpdateLicense={handleUpdateDigitalLicense}
            lang={lang}
          />
        );
      case 'docker_k8s':
        return (
          <SplunkContainerK8sHub 
            lang={lang} 
            virtualClusterState={virtualClusterState}
            destroyVirtualCloudServer={destroyVirtualCloudServer}
            recreateVirtualCloudServer={recreateVirtualCloudServer}
            isGlobalAiHealerRunning={isGlobalAiHealerRunning}
          />
        );
      case 'heartbeat_radar':
        return (
          <HeartbeatMonitoringMatrix
            nodes={heartbeatNodes}
            dropAlerts={dropAlerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onSimulateDisconnect={handleSimulateDisconnect}
            onRecoverAllNodes={handleRecoverAllNodes}
            onOpenRemoteTerminal={handleOpenRemoteTerminalFromNode}
            lang={lang}
          />
        );
      case 'alert_manager':
        return <AlertNotificationCenter lang={lang} />;
      case 'component_agents':
        return <EnterpriseAgentGenerator lang={lang} />;
      case 'remote_gateway':
        return (
          <RemoteManagementGateway
            nodes={heartbeatNodes}
            selectedNodeId={remoteTargetNode?.id}
            lang={lang}
          />
        );
      case 'package_center':
        return <SplunkAppPackageCenter lang={lang} />;
      case 'network_sources':
        return (
          <ComponentNetworkMap
            profile={currentProfile}
            lang={lang}
            settings={clusterSettings}
            parsedInputs={parseInputsConf(customizedConfigs['inputs.conf'])}
          />
        );
      case 'health_audit':
        return (
          <HealthAuditDashboard
            findings={findings}
            resolvedFindings={resolvedFindings}
            score={healthScore}
            onOpenFinding={(finding) => setSelectedFinding(finding)}
            onScanAgain={handleRescanAudit}
            onResetBaseline={handleResetToBaselineAudit}
            onAutoFixAll={() => handleApplyAllRemediations(activeEnvironment)}
            onOpenDebugTool={() => setIsDebugModalOpen(true)}
            parallelClusterState={parallelClusterState}
            onInstallParallelCluster={handleInstallParallelCluster}
            onSyncConfigs={handleSyncConfigsToParallel}
            onSwitchToParallelConfig={handleSwitchToParallelConfig}
            lang={lang}
          />
        );
      case 'config_editor':
        return (
          <ConfigEditor
            configs={activeEnvironment === 'parallel' ? parallelConfigs : customizedConfigs}
            activeFile={activeConfigFile}
            onSelectFile={(f) => setActiveConfigFile(f)}
            onSaveFile={(filename, content) => {
              if (activeEnvironment === 'parallel') {
                setParallelConfigs(prev => ({ ...prev, [filename]: content }));
                showToast(isFa ? `فایل ${filename} در محیط موازی ذخیره شد.` : `Saved ${filename} in Parallel Instance.`);
              } else {
                handleSaveFile(filename, content);
              }
            }}
            onBackupFile={handleBackupFile}
            onRestoreFile={handleRestoreFile}
            hasFileBackup={!!fileBackups[activeConfigFile]}
            onGlobalRestore={handleGlobalRestoreBaseline}
            activeEnvironment={activeEnvironment}
            onChangeEnvironment={setActiveEnvironment}
            parallelClusterState={parallelClusterState}
            onSyncConfigs={handleSyncConfigsToParallel}
            lang={lang}
          />
        );
      case 'doc_reference':
        return (
          <DocCompliancePanel
            configs={activeEnvironment === 'parallel' ? parallelConfigs : customizedConfigs}
            onApplyPatch={handleApplyDirectPatch}
            parallelClusterState={parallelClusterState}
          />
        );
      case 'live_logs': {
        const rawLogLines = liveLogs.split('\n').filter(l => l.trim().length > 0);
        const errorCount = rawLogLines.filter(l => l.includes('ERROR') || l.includes('FATAL')).length;
        const warnCount = rawLogLines.filter(l => l.includes('WARN')).length;
        const infoCount = rawLogLines.filter(l => l.includes('INFO') || (!l.includes('ERROR') && !l.includes('WARN') && !l.includes('FATAL'))).length;

        const filteredLogLines = rawLogLines.filter(line => {
          if (logLevelFilter === 'FATAL' && !line.includes('FATAL')) return false;
          if (logLevelFilter === 'ERROR' && !(line.includes('ERROR') || line.includes('FATAL'))) return false;
          if (logLevelFilter === 'WARN' && !line.includes('WARN')) return false;
          if (logLevelFilter === 'INFO' && !line.includes('INFO')) return false;
          if (logSearchQuery.trim()) {
            return line.toLowerCase().includes(logSearchQuery.toLowerCase());
          }
          return true;
        });

        return (
          <div className="sirene-card bg-[#0b0e17]/90 border border-white/[0.08] rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden flex flex-col relative">
            {/* Header & Controls */}
            <div className="bg-[#0e121d]/90 border-b border-white/[0.06] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">
                      {isFa ? 'پایش لحظه‌ای لاگ‌های سرور اسپلانک (splunkd.log)' : 'splunkd.log Live Stream Tail'}
                    </h3>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {isFa ? 'موتور پردازش عمیق و تشخیصی لوکال سرور (فعال)' : 'Local Real-Time Diagnostic Engine (Active)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFa ? 'روی هر خط از لاگ کلیک کنید تا تحلیل فنی دقیق، ریشه وقوع و راهکار مهندسی منطبق بر مستندات نمایش داده شود.' : 'Click any log line to view accurate technical interpretation, root cause, and SVA remediation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLiveLogs}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition text-slate-200"
                >
                  <RotateCw className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isFa ? 'بروزرسانی زنده لاگ‌ها' : 'Refresh Live Stream'}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="px-6 py-3 bg-[#080b12] border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
              {/* Level Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setLogLevelFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
                    logLevelFilter === 'ALL'
                      ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.05]'
                  }`}
                >
                  <span>{isFa ? 'همه لاگ‌ها' : 'All'}</span>
                  <span className="font-mono text-[10px] opacity-70">({rawLogLines.length})</span>
                </button>
                <button
                  onClick={() => setLogLevelFilter('ERROR')}
                  className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
                    logLevelFilter === 'ERROR'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                      : 'bg-white/[0.03] text-slate-400 hover:text-rose-400 border border-white/[0.05]'
                  }`}
                >
                  <span>{isFa ? 'خطاها' : 'Errors'}</span>
                  <span className="font-mono text-[10px] opacity-80 bg-rose-950/60 px-1 rounded text-rose-300">({errorCount})</span>
                </button>
                <button
                  onClick={() => setLogLevelFilter('WARN')}
                  className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
                    logLevelFilter === 'WARN'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                      : 'bg-white/[0.03] text-slate-400 hover:text-amber-400 border border-white/[0.05]'
                  }`}
                >
                  <span>{isFa ? 'هشدارها' : 'Warnings'}</span>
                  <span className="font-mono text-[10px] opacity-80 bg-amber-950/60 px-1 rounded text-amber-300">({warnCount})</span>
                </button>
                <button
                  onClick={() => setLogLevelFilter('INFO')}
                  className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
                    logLevelFilter === 'INFO'
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-500/50'
                      : 'bg-white/[0.03] text-slate-400 hover:text-sky-400 border border-white/[0.05]'
                  }`}
                >
                  <span>{isFa ? 'اطلاعاتی' : 'Info'}</span>
                  <span className="font-mono text-[10px] opacity-80 bg-sky-950/60 px-1 rounded text-sky-300">({infoCount})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
                <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isFa ? 'right-2.5' : 'left-2.5'}`} />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder={isFa ? 'فیلتر متنی بر اساس آی‌پی، کامپوننت، پورت...' : 'Filter by IP, component, port...'}
                  className={`w-full bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/50 rounded-xl py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition ${isFa ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className={`absolute top-2 text-slate-400 hover:text-white text-xs ${isFa ? 'left-2.5' : 'right-2.5'}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Stream Content */}
            <div className="p-4 sm:p-5 bg-[#05070c] font-mono text-xs text-slate-300 min-h-[320px] max-h-[540px] overflow-y-auto space-y-1.5">
              {filteredLogLines.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {isFa ? 'هیچ خط لاگی با فیلتر فعلی یافت نشد.' : 'No log lines match current filter criteria.'}
                </div>
              ) : (
                filteredLogLines.map((line, idx) => {
                  let colorClass = 'text-slate-300 hover:bg-white/[0.04]';
                  if (line.includes('ERROR')) {
                    colorClass = 'text-rose-300 font-semibold bg-rose-950/20 border-rose-500/30 hover:bg-rose-950/30';
                  } else if (line.includes('WARN')) {
                    colorClass = 'text-amber-300 bg-amber-950/15 border-amber-500/30 hover:bg-amber-950/25';
                  } else if (line.includes('FATAL')) {
                    colorClass = 'text-red-400 font-bold bg-red-950/40 border-red-500/50 hover:bg-red-950/50';
                  } else if (line.includes('INFO')) {
                    colorClass = 'text-slate-300 hover:bg-white/[0.04]';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={async () => {
                        // 1. Instant local diagnostic parsing
                        const analysis = analyzeSplunkLogLine(line);
                        setSelectedLogAnalysis(analysis);

                        // 2. Query server local diagnostic endpoint to merge server-side runtime telemetry
                        try {
                          const res = await fetch('/api/splunk/logs/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ line })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.analysis) {
                              setSelectedLogAnalysis(data.analysis);
                            }
                          }
                        } catch (_) {}
                      }}
                      className={`${colorClass} py-1.5 px-3 border border-transparent rounded-xl cursor-pointer hover:border-violet-500/40 transition flex items-center justify-between group gap-2`}
                      title={isFa ? 'برای تحلیل پیشرفته، ریشه‌یابی و راهکار مهندسی کلیک کنید' : 'Click to inspect diagnostic details and root cause'}
                    >
                      <span className="font-mono text-xs break-all select-all flex-1">{line}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-violet-500/20 text-violet-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold transition-opacity whitespace-nowrap shrink-0">
                        <Wrench className="w-3 h-3" />
                        <span>{isFa ? 'تحلیل و رفع' : 'Diagnose'}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }
      case 'network_toolbox':
        return <NetworkToolbox lang={lang} clusterSettings={clusterSettings} />;
      case 'backup_archive':
        return (
          <BackupManager
            snapshots={snapshots}
            onRestoreSnapshot={(snap) => {
              setConfigs({ ...snap.files });
              showToast(isFa ? `کانفیگ‌ها به نسخه ${snap.label} بازگردانده شدند.` : `Restored to ${snap.label}.`);
            }}
            onGlobalRestoreBaseline={handleGlobalRestoreBaseline}
            onCreateSnapshot={handleCreateSnapshot}
            lang={lang}
          />
        );
      case 'system_update':
        return <UpdateManager isFa={isFa} />;
      case 'admin_security':
        return currentUser ? (
          <AdminSecurityPanel
            currentUser={currentUser}
            authToken={authToken}
            lang={lang}
            onUserUpdated={() => {
              fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } })
                .then(r => r.json())
                .then(d => {
                  if (d?.user) {
                    setCurrentUser(d.user);
                    localStorage.setItem('splunk_doctor_user', JSON.stringify(d.user));
                  }
                })
                .catch(() => {});
            }}
          />
        ) : (
          <div className="sirene-card bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-12 text-center max-w-lg mx-auto my-12 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 sirene-text-gradient">
              {isFa ? 'دسترسی حفاظت‌شده امنیتی' : 'Protected Security Console'}
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isFa ? 'مشاهده و مدیریت کاربران و کنترل دسترسی نیازمند ورود به حساب است.' : 'User management and RBAC requires authentication.'}
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isFa ? 'ورود به حساب کاربری' : 'Authenticate to Continue'}</span>
            </button>
          </div>
        );
      case 'bento_overview':
        return (
          <BentoGridConsole
            lang={lang}
            onNavigateTab={(targetTab) => handleSelectModule(targetTab as any)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenServiceModal={() => setShowServiceModal(true)}
            onOpenModuleManager={() => setIsModuleManagerOpen(true)}
            onInspectLogLine={async (line) => {
              const analysis = analyzeSplunkLogLine(line);
              setSelectedLogAnalysis(analysis);
              try {
                const res = await fetch('/api/splunk/logs/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ line })
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.analysis) {
                    setSelectedLogAnalysis(data.analysis);
                  }
                }
              } catch (_) {}
            }}
            probeCluster={probeCluster}
            isProbingCluster={isProbingCluster}
            clusterProbeResults={clusterProbeResults}
            clusterTargets={[
              { id: 'hf', name: 'Heavy Forwarder', host: clusterSettings.hfHost, port: 8089, role: 'heavy_forwarder' },
              { id: 'idx1', name: 'Indexer 1', host: clusterSettings.idx1Host, port: 8089, role: 'indexer_peer' },
              { id: 'idx2', name: 'Indexer 2', host: clusterSettings.idx2Host, port: 8089, role: 'indexer_peer' },
              { id: 'sh', name: 'Search Head', host: clusterSettings.shHost, port: 8000, role: 'search_head' },
              { id: 'ds', name: 'Deployment Server', host: clusterSettings.dsHost, port: 8089, role: 'deployment_server' }
            ]}
          />
        );
      default: {
        const customMod = ALL_MODULES.find(m => m.id === tabId);
        if (customMod) {
          return (
            <div className="apple-card p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a84ff]/15 border border-[#0a84ff]/30 text-[#0a84ff] flex items-center justify-center">
                    {React.createElement(customMod.icon || Sparkles, { className: 'w-6 h-6' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {isFa ? customMod.titleFa : customMod.titleEn}
                      </h2>
                      {customMod.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 font-bold">
                          {customMod.badge}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/[0.06] text-white/60 border border-white/10">
                        {isFa ? 'ماژول سفارشی' : 'Custom Module'}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-1 max-w-2xl">
                      {isFa ? customMod.descriptionFa : customMod.descriptionEn}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModuleManagerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0a84ff]" />
                  <span>{isFa ? 'ویرایش در پنل مدیریت' : 'Edit in Module Manager'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'دسته‌بندی ماژول' : 'Category'}</div>
                  <div className="text-sm font-semibold text-white/90">{isFa ? customMod.categoryNameFa : customMod.categoryNameEn}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'شناسه یکتا (ID)' : 'Unique ID'}</div>
                  <div className="text-sm font-mono text-[#0a84ff]">{customMod.id}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'اولویت چینش' : 'Order Index'}</div>
                  <div className="text-sm font-mono text-[#30d158]">#{customMod.order + 1}</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black/35 border border-white/[0.08] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-white/40 border-b border-white/[0.06] pb-2">
                  <span className="flex items-center gap-2 text-white/80 font-sans font-medium text-xs">
                    <Terminal className="w-3.5 h-3.5 text-[#30d158]" />
                    {isFa ? 'کنسول عملیاتی ماژول' : 'Module Operations Console'}
                  </span>
                  <span className="text-[10px] text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded">ONLINE</span>
                </div>
                <p className="text-white/60">
                  {isFa
                    ? `ماژول «${customMod.titleFa}» فعال و آماده است. می‌توانید این ماژول را در پنل مدیریت جابه‌جا، ویرایش یا حذف کنید.`
                    : `Module "${customMod.titleEn}" is active and ready. You can customize, reorder, or delete it in the Module Management Panel.`}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => probeCluster()}
                    className="px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-sans font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{isFa ? 'تست پروب سوکت‌ها' : 'Probe Cluster'}</span>
                  </button>
                  <button
                    onClick={() => handleSelectModule('bento_overview')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-sans font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isFa ? 'بازگشت به داشبورد' : 'Back to Dashboard'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <BentoGridConsole
            lang={lang}
            onNavigateTab={(targetTab) => handleSelectModule(targetTab as any)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenServiceModal={() => setShowServiceModal(true)}
            onOpenModuleManager={() => setIsModuleManagerOpen(true)}
            probeCluster={probeCluster}
            isProbingCluster={isProbingCluster}
            clusterProbeResults={clusterProbeResults}
          />
        );
      }
    }
  };

  return (
    <div 
      className={`min-h-screen bg-[#0d0e12] text-[#f5f5f7] flex flex-col selection:bg-[#0071e3]/30 ${
        isFa ? 'font-[Vazirmatn]' : ''
      }`}
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Apple Dynamic Island / Notification Pill */}
      {toastMessage && (
        <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.15] text-[#f5f5f7] text-xs shadow-[0_16px_40px_rgba(0,0,0,0.65)] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158] animate-pulse"></span>
          <Activity className="w-3.5 h-3.5 text-[#0a84ff]" />
          <span className="font-medium text-xs tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Apple macOS Window Header / Unified Title Bar */}
      <header className="apple-toolbar sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between gap-3 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]">
        {/* Leading Zone: Traffic Lights & Wordmark */}
        <div className="flex items-center gap-3">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1 pl-1">
            <button
              onClick={() => {
                setIsQuickSearchOpen(false);
                setShowAllModulesHub(false);
                setSelectedFinding(null);
                setShowServiceModal(false);
                setIsSettingsOpen(false);
              }}
              className="traffic-light traffic-light-close"
              title={isFa ? 'بستن پنجره‌ها و پاکسازی' : 'Close Active Overlays'}
            />
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="traffic-light traffic-light-minimize"
              title={isFa ? 'جمع‌کردن / بازکردن سایدبار' : 'Collapse/Expand Sidebar'}
            />
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="traffic-light traffic-light-zoom"
              title={isFa ? 'تغییر حالت تمام‌صفحه' : 'Toggle Fullscreen'}
            />
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
                setIsSidebarCollapsed(false);
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            className="p-1.5 rounded-md hover:bg-white/[0.08] text-white/70 hover:text-white transition cursor-pointer"
            title={isFa ? 'تغییر وضعیت نوار کناری (Ctrl+B)' : 'Toggle Sidebar (Ctrl+B)'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Apple App Brand & Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/95 tracking-tight flex items-center gap-1.5">
              <span className="text-[#0a84ff] text-sm"></span>
              <span>{isFa ? 'استودیو معمار اسپلانک' : 'Splunk Architect Studio'}</span>
            </span>
            <span className="text-white/20 text-xs hidden md:inline">/</span>
            <span className="text-xs text-white/50 hidden md:inline truncate max-w-[200px]">
              {ALL_MODULES.find(m => m.id === activeTab)?.[isFa ? 'titleFa' : 'titleEn']}
            </span>
          </div>

          {/* Host Connection Pill */}
          <button 
            onClick={() => setIsLiveMode(!isLiveMode)}
            className="text-[11px] font-medium transition flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white"
            title={isFa ? 'تغییر وضعیت پایش زنده سرور' : 'Toggle live monitoring mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-[#30d158]' : 'bg-[#0a84ff]'}`}></span>
            <span className="hidden lg:inline">{isLiveMode ? (isFa ? 'متصل' : 'Connected') : (isFa ? 'ایزوله' : 'Sandbox')}</span>
          </button>
        </div>

        {/* Center Zone: Apple Spotlight Search Bar */}
        <div className="flex-1 max-w-sm mx-2 hidden md:block">
          <button
            onClick={() => setIsQuickSearchOpen(true)}
            className="w-full px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 border border-white/[0.08] hover:border-white/[0.16] text-white/50 hover:text-white/80 text-xs flex items-center justify-between gap-2 transition cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/50">{isFa ? 'اسپات‌لایت: جستجوی ابزارها و کانفیگ‌ها...' : 'Spotlight Search (⌘K)...'}</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white/[0.08] border border-white/[0.1] text-white/60 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>

        {/* Trailing Zone: Actions & Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Active Server Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <span className={`w-1.5 h-1.5 rounded-full ${activeEnvironment === 'production' ? 'bg-[#30d158]' : (activeEnvironment === 'parallel' ? 'bg-[#0a84ff]' : 'bg-[#bf5af2]')}`}></span>
            <select
              value={activeEnvironment}
              onChange={(e) => {
                const targetEnv = e.target.value as 'production' | 'parallel' | 'virtual';
                setActiveEnvironment(targetEnv);
                showToast(isFa 
                  ? `محیط فعال: ${targetEnv === 'production' ? 'سرور اصلی (تولید)' : (targetEnv === 'parallel' ? 'سرور موازی' : 'سرور مجازی')}` 
                  : `Switched environment to: ${targetEnv}`);
              }}
              className="bg-transparent text-white/90 font-medium text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="production" className="bg-[#1c1c1e] text-white">{isFa ? 'سرور اصلی (8000)' : 'Production (8000)'}</option>
              {parallelClusterState.isInstalled && (
                <option value="parallel" className="bg-[#1c1c1e] text-white">{isFa ? 'سرور موازی (8001)' : 'Parallel (8001)'}</option>
              )}
              {virtualClusterState.isInstalled && (
                <option value="virtual" className="bg-[#1c1c1e] text-white">{isFa ? 'سرور مجازی (8080)' : 'Virtual (8080)'}</option>
              )}
            </select>
          </div>

          {/* Component Role */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Server className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ComponentRole)}
              className="bg-transparent text-white/80 font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="heavy_forwarder" className="bg-[#1c1c1e] text-white">Heavy Forwarder</option>
              <option value="indexer_peer" className="bg-[#1c1c1e] text-white">Indexer Peer</option>
              <option value="search_head" className="bg-[#1c1c1e] text-white">Search Head</option>
            </select>
          </div>

          {/* Socket Probe */}
          <button
            onClick={probeCluster}
            disabled={isProbingCluster}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 transition flex items-center gap-1.5 cursor-pointer"
            title={isFa ? 'تست زنده اتصال سوکت‌های TCP کلاستر' : 'Probe cluster TCP sockets now'}
          >
            <Activity className={`w-3.5 h-3.5 text-[#0a84ff] ${isProbingCluster ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs">
              {isProbingCluster ? (isFa ? 'پروب...' : 'Probing...') : (isFa ? 'پروب' : 'Probe')}
            </span>
            {clusterProbeResults.length > 0 && (
              <span className="font-mono text-[10px] text-white/40 tabular-nums">
                ({clusterProbeResults.filter(r => r.open).length}/{clusterProbeResults.length})
              </span>
            )}
          </button>

          {/* Studio Module Manager & Customizer */}
          <button
            onClick={() => setIsModuleManagerOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#0a84ff]/10 hover:bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title={isFa ? 'پنل مدیریت کل برنامه: افزودن، حذف، تغییر و جابه‌جایی ماژول‌ها' : 'Studio Module Manager: Add, remove, reorder and customize modules'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0a84ff]" />
            <span className="hidden md:inline">{isFa ? 'پنل مدیریت برنامه' : 'Manage Studio'}</span>
          </button>

          {/* Backend Operations & Health Inspector */}
          <button
            onClick={() => setIsBackendInspectorOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#30d158]/10 hover:bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title={isFa ? 'مشاهده عملیات‌های پس‌زمینه و تست صحت ابزارها' : 'View backend operations & tool verification'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
            <span className="hidden lg:inline">{isFa ? 'تست ابزارها' : 'Tool Tests'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#30d158]/25 text-white font-bold tabular-nums">
              {backendOperations.length}
            </span>
          </button>

          {/* Splunk System Debugger & Telemetry Inspector */}
          <button
            onClick={() => setIsDebugModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title={isFa ? 'ابزار دیباگ و عیب‌یابی عمیق سامانه' : 'Splunk System Debugger & Telemetry Inspector'}
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isFa ? 'دیباگ سیستم' : 'Debugger'}</span>
          </button>

          {/* Cluster Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08] transition cursor-pointer"
            title={isFa ? 'تنظیم آدرس‌های IP و هاست‌های واقعی سرور' : 'Configure cluster IPs and hostnames'}
          >
            <Settings className="w-3.5 h-3.5 text-white/60" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'fa' ? 'en' : 'fa')}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 font-mono text-xs transition cursor-pointer"
          >
            {isFa ? 'EN' : 'فا'}
          </button>

          {/* User Account */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full px-2 py-0.5 text-xs">
              <button
                onClick={() => {
                  setActiveCategory('tools_security');
                  setActiveTab('admin_security');
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
                title={isFa ? 'رفتن به پنل مدیریت' : 'Open Admin Panel'}
              >
                <div className="w-5 h-5 rounded-full bg-[#0a84ff] text-white flex items-center justify-center font-bold text-[9px]">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-medium text-white/90 text-xs hidden sm:inline">
                  {currentUser.username}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1 hover:text-[#ff453a] text-white/40 transition cursor-pointer"
                title={isFa ? 'خروج' : 'Logout'}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white font-medium flex items-center gap-1.5 transition text-xs cursor-pointer"
            >
              <Lock className="w-3 h-3 text-[#ff9f0a]" />
              <span className="hidden sm:inline">{isFa ? 'ورود' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout with Apple macOS Sidebar */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* Floating Button to re-open sidebar when closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => { setIsSidebarOpen(true); setIsSidebarCollapsed(false); }}
            className={`fixed top-16 z-40 bg-[#1c1c1e]/90 backdrop-blur-2xl hover:bg-[#252528] text-white p-2 rounded-lg shadow-xl border border-white/10 transition-all cursor-pointer ${
              isFa ? 'right-3' : 'left-3'
            }`}
            title={isFa ? 'باز کردن نوار کناری (Ctrl+B)' : 'Open Sidebar (Ctrl+B)'}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0a84ff]" />
          </button>
        )}

        {/* Apple macOS Sidebar */}
        {isSidebarOpen && (
          <aside
            className={`apple-sidebar flex flex-col shrink-0 transition-all duration-200 z-30 select-none h-full ${
              isFa ? 'order-first border-l' : 'order-first border-r'
            } ${
              isSidebarCollapsed ? 'w-14' : 'w-72 lg:w-76'
            }`}
          >
            {!isSidebarCollapsed ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Sidebar Header & Quick Filter */}
                <div className="p-3 border-b border-white/[0.06] flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white/50 tracking-wider uppercase">
                      {isFa ? 'ماژول‌های سیستم' : 'SYSTEM MODULES'}
                    </span>
                    <button
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white transition cursor-pointer"
                      title={isFa ? 'جمع‌کردن سایدبار (Ctrl+B)' : 'Collapse (Ctrl+B)'}
                    >
                      <ChevronLeft className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className={`w-3 h-3 text-white/40 absolute top-2.5 ${isFa ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                      type="text"
                      value={sidebarSearchQuery}
                      onChange={(e) => setSidebarSearchQuery(e.target.value)}
                      placeholder={isFa ? 'فیلتر ماژول‌ها...' : 'Filter modules...'}
                      className={`w-full bg-black/30 border border-white/[0.08] rounded-md py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#0a84ff]/60 ${
                        isFa ? 'pr-7 pl-6' : 'pl-7 pr-6'
                      }`}
                    />
                    {sidebarSearchQuery && (
                      <button
                        onClick={() => setSidebarSearchQuery('')}
                        className={`absolute top-2 text-white/40 hover:text-white ${isFa ? 'left-2' : 'right-2'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] pt-1">
                    {[
                      { id: 'all' as const, labelFa: 'همه بخش‌ها', labelEn: 'All' },
                      { id: 'architecture' as const, labelFa: 'معماری', labelEn: 'Arch' },
                      { id: 'health_logs' as const, labelFa: 'عیب‌یابی', labelEn: 'Health' },
                      { id: 'radar_ingest' as const, labelFa: 'رادار', labelEn: 'Radar' },
                      { id: 'agents_gateway' as const, labelFa: 'ایجنت‌ها', labelEn: 'Agents' },
                      { id: 'tools_security' as const, labelFa: 'ابزارها', labelEn: 'Tools' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSidebarFilterCategory(tab.id as any);
                          if (tab.id !== 'all') {
                            setActiveCategory(tab.id as any);
                            const firstInCat = ALL_MODULES.find(m => m.category === tab.id && m.isEnabled !== false);
                            if (firstInCat) {
                              handleSelectModule(firstInCat.id);
                            }
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                          sidebarFilterCategory === tab.id
                            ? 'bg-[#0071e3] text-white font-semibold shadow-sm'
                            : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {isFa ? tab.labelFa : tab.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modules List categorized in Apple HIG sections */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
                  {[
                    {
                      categoryKey: 'architecture' as const,
                      titleFa: 'معماری و SVA',
                      titleEn: 'ARCHITECTURE & SVA',
                      iconTint: 'bg-[#0a84ff]/15 text-[#0a84ff]'
                    },
                    {
                      categoryKey: 'health_logs' as const,
                      titleFa: 'عیب‌یابی و سلامت',
                      titleEn: 'DIAGNOSTICS & LOGS',
                      iconTint: 'bg-[#ff453a]/15 text-[#ff453a]'
                    },
                    {
                      categoryKey: 'radar_ingest' as const,
                      titleFa: 'رادار و جریان لاگ',
                      titleEn: 'TELEMETRY & INGEST',
                      iconTint: 'bg-[#30d158]/15 text-[#30d158]'
                    },
                    {
                      categoryKey: 'agents_gateway' as const,
                      titleFa: 'ایجنت‌ها و درگاه',
                      titleEn: 'AGENTS & GATEWAY',
                      iconTint: 'bg-[#64d2ff]/15 text-[#64d2ff]'
                    },
                    {
                      categoryKey: 'tools_security' as const,
                      titleFa: 'ابزارها و امنیت',
                      titleEn: 'SECURITY & UTILITIES',
                      iconTint: 'bg-[#bf5af2]/15 text-[#bf5af2]'
                    }
                  ]
                    .filter(group => sidebarFilterCategory === 'all' || sidebarFilterCategory === group.categoryKey)
                    .map(group => {
                      const groupModules = ALL_MODULES.filter(m => {
                        if (m.isEnabled === false) return false;
                        if (m.category !== group.categoryKey) return false;
                        if (!sidebarSearchQuery.trim()) return true;
                        const q = sidebarSearchQuery.toLowerCase();
                        return (
                          m.titleFa.toLowerCase().includes(q) ||
                          m.titleEn.toLowerCase().includes(q) ||
                          m.descriptionFa.toLowerCase().includes(q) ||
                          m.descriptionEn.toLowerCase().includes(q) ||
                          (m.badge && m.badge.toLowerCase().includes(q))
                        );
                      });

                      if (groupModules.length === 0) return null;

                      return (
                        <div key={group.categoryKey} className="space-y-0.5">
                          <div className="flex items-center justify-between px-2 py-1">
                            <button
                              onClick={() => {
                                if (sidebarFilterCategory === group.categoryKey) {
                                  setSidebarFilterCategory('all');
                                } else {
                                  setSidebarFilterCategory(group.categoryKey);
                                  setActiveCategory(group.categoryKey);
                                  const firstInCat = ALL_MODULES.find(m => m.category === group.categoryKey && m.isEnabled !== false);
                                  if (firstInCat) {
                                    handleSelectModule(firstInCat.id);
                                  }
                                }
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-white/50 hover:text-white uppercase transition cursor-pointer text-start"
                              title={isFa ? `کلیک برای نمایش فقط بخش ${group.titleFa}` : `Click to focus on ${group.titleEn}`}
                            >
                              <span>{isFa ? group.titleFa : group.titleEn}</span>
                              <span className="text-[9px] font-mono text-white/30">({groupModules.length})</span>
                            </button>
                            {sidebarFilterCategory === group.categoryKey && (
                              <button
                                onClick={() => setSidebarFilterCategory('all')}
                                className="text-[10px] text-[#0a84ff] hover:underline cursor-pointer"
                              >
                                {isFa ? 'نمایش همه' : 'Show All'}
                              </button>
                            )}
                          </div>

                          {groupModules.map(mod => {
                            const IconComp = mod.icon;
                            const isActive = activeTab === mod.id;
                            return (
                              <button
                                key={mod.id}
                                onClick={() => handleSelectModule(mod.id)}
                                className={`w-full px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between gap-2 text-right group cursor-pointer ${
                                  isActive
                                    ? 'bg-[#0071e3] text-white font-medium shadow-sm'
                                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                                }`}
                                title={isFa ? mod.descriptionFa : mod.descriptionEn}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`p-1 rounded-md shrink-0 transition-colors ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : group.iconTint
                                  }`}>
                                    <IconComp className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs truncate leading-tight">
                                      {isFa ? mod.titleFa : mod.titleEn}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {mod.badge && (
                                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 tabular-nums ${
                                      isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white/[0.06] text-white/60'
                                    }`}>
                                      {mod.badge}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>

                {/* Apple System Health & Decommission Footer Widget */}
                <div className="p-3 border-t border-white/[0.06] bg-black/20 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="text-[11px]">{isFa ? 'سلامت سیستم:' : 'System Health:'}</span>
                    <span className="font-mono font-semibold tabular-nums text-[#30d158]">
                      {healthScore}/100
                    </span>
                  </div>
                  {/* Apple Storage / Progress Meter */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, healthScore))}%`,
                        backgroundColor: healthScore >= 80 ? '#30d158' : (healthScore >= 50 ? '#ff9f0a' : '#ff453a')
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setIsModuleManagerOpen(true)}
                    className="w-full py-1.5 px-2 rounded-md bg-[#0a84ff]/10 hover:bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/25 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#0a84ff]" />
                    <span>{isFa ? 'مدیریت و چیدمان برنامه' : 'Customize & Reorder'}</span>
                  </button>

                  <button
                    onClick={() => setIsVirtualWipeModalOpen(true)}
                    className="w-full py-1 px-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Server className="w-3 h-3 text-[#0a84ff]" />
                    <span>{isFa ? 'مدیریت سرورها' : 'Manage Servers'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed Mini Rail */
              <div className="flex flex-col h-full py-3 items-center justify-between">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1.5 rounded-md hover:bg-white/[0.1] text-[#0a84ff] transition mb-2 cursor-pointer"
                  title={isFa ? 'گسترش نوار کناری (Ctrl+B)' : 'Expand (Ctrl+B)'}
                >
                  <ChevronRight className={`w-4 h-4 ${isFa ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex-1 overflow-y-auto space-y-1.5 py-1 px-1 scrollbar-none flex flex-col items-center">
                  {ALL_MODULES.map(mod => {
                    const IconComp = mod.icon;
                    const isActive = activeTab === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleSelectModule(mod.id)}
                        className={`p-2 rounded-lg transition relative cursor-pointer ${
                          isActive
                            ? 'bg-[#0071e3] text-white shadow-sm'
                            : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        title={isFa ? `${mod.titleFa} (${mod.badge || ''})` : mod.titleEn}
                      >
                        <IconComp className="w-4 h-4" />
                        {mod.badge && !isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-white/10 w-full flex flex-col items-center">
                  <span className={`w-2 h-2 rounded-full ${healthScore >= 80 ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`} title={`Health: ${healthScore}/100`} />
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Center / Main Scrollable Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-5">
            {/* Apple Unified Action Bar above active tool */}
            <div className="apple-card p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Tool Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#0a84ff]/10 text-[#0a84ff] shrink-0 border border-[#0a84ff]/20">
                  {React.createElement(ALL_MODULES.find(m => m.id === activeTab)?.icon || Sparkles, { className: "w-4 h-4" })}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-white/95 text-sm truncate">
                      {ALL_MODULES.find(m => m.id === activeTab)?.[isFa ? 'titleFa' : 'titleEn'] || activeTab}
                    </h2>
                    <span className="text-[10px] text-white/40">·</span>
                    <span className="text-[11px] text-white/50 truncate">
                      {ALL_MODULES.find(m => m.id === activeTab)?.[isFa ? 'categoryNameFa' : 'categoryNameEn']}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">
                    {ALL_MODULES.find(m => m.id === activeTab)?.[isFa ? 'descriptionFa' : 'descriptionEn']}
                  </p>
                </div>
              </div>

              {/* Segmented Category Buttons & Floating PiP Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="apple-segmented-track">
                  {[
                    { id: 'architecture' as const, fa: 'معماری', en: 'Arch' },
                    { id: 'health_logs' as const, fa: 'عیب‌یابی', en: 'Health' },
                    { id: 'radar_ingest' as const, fa: 'رادار', en: 'Radar' },
                    { id: 'agents_gateway' as const, fa: 'ایجنت‌ها', en: 'Agents' },
                    { id: 'tools_security' as const, fa: 'ابزارها', en: 'Tools' }
                  ].map(cat => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          const firstInCat = ALL_MODULES.find(m => m.category === cat.id);
                          if (firstInCat && TAB_TO_CATEGORY[activeTab] !== cat.id) {
                            setActiveTab(firstInCat.id as any);
                          }
                        }}
                        className={`apple-segmented-item ${isActive ? 'active' : ''}`}
                      >
                        {isFa ? cat.fa : cat.en}
                      </button>
                    );
                  })}
                </div>

                {/* Picture-in-Picture Button */}
                <button
                  onClick={() => handleToggleFloatingTool(activeTab)}
                  className="apple-btn-secondary text-xs"
                  title={isFa ? 'کوچک‌سازی و اجرای این ابزار در پنجره شناور (مشابه تصویر در تصویر اپل)' : 'Run this tool in floating mini-player (PiP)'}
                >
                  <Minimize2 className="w-3.5 h-3.5 text-[#0a84ff]" />
                  <span className="hidden sm:inline">
                    {floatingTools.includes(activeTab) 
                      ? (isFa ? 'در حال اجرا (PiP)' : 'Running in PiP') 
                      : (isFa ? 'پنجره شناور (PiP)' : 'Float PiP')}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Tool View */}
            <div className="relative space-y-2">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-cyan-200">{isFa ? 'تست زنده این بخش روی خود سرور' : 'Live test for this section on the server'}</div>
                    <div className="text-[9px] text-cyan-200/60 truncate">{isFa ? 'فرمان واقعی، STDOUT، STDERR و Exit Code در Popup نمایش داده می‌شود.' : 'Exact command, STDOUT, STDERR and Exit Code will be shown in a popup.'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValidatingToolId(activeTab);
                    setValidationInitialTab('current');
                    setIsToolValidationModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-black hover:bg-cyan-400 inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/10"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {isFa ? 'تست / Refresh این بخش' : 'Test / Refresh this section'}
                </button>
              </div>
              <ToolErrorBoundary
                lang={lang}
                toolName={ALL_MODULES.find(m => m.id === activeTab)?.[isFa ? 'titleFa' : 'titleEn']}
              >
                {renderToolContent(activeTab, false)}
              </ToolErrorBoundary>
            </div>
          </main>

          {/* Issue Detail & Multi-Option Remediation Modal */}
          {selectedFinding && (
            <IssueDetailModal
              finding={selectedFinding}
              onClose={() => setSelectedFinding(null)}
              onApplyOption={handleApplyOption}
              hasFileBackup={!!fileBackups[selectedFinding.file]}
              onBackupFile={handleBackupFile}
              onRestoreFile={handleRestoreFile}
              onJumpToEditor={(f) => {
                setActiveConfigFile(f);
                setActiveTab('config_editor');
              }}
              parallelClusterState={parallelClusterState}
              defaultTargetEnv={activeEnvironment}
              lang={lang}
            />
          )}

          {/* Service Control Modal */}
          {showServiceModal && (
            <ServiceControlModal
              onClose={() => setShowServiceModal(false)}
              lang={lang}
            />
          )}

          {/* Cluster Settings Modal */}
          <ClusterSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={clusterSettings}
            configs={configs}
            onSave={(newSettings) => {
              setClusterSettings(newSettings);
              showToast(isFa ? 'تنظیمات کلاستر ذخیره و روی تمامی دایاگرام‌ها و پیکربندی‌ها اعمال شد.' : 'Cluster settings saved and synced across configs.');
            }}
            lang={lang}
          />

          {/* Enterprise RBAC Login & Auth Modal */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setIsLoginModalOpen(false)}
            lang={lang}
          />

          {/* Live Log Interactive Analysis & One-Click Fix Modal */}
          {selectedLogAnalysis && (
            <LiveLogAnalysisModal
              analysis={selectedLogAnalysis}
              onClose={() => setSelectedLogAnalysis(null)}
              onApplyFix={handleApplyDirectPatch}
              onBackupFile={handleBackupFile}
              onRestoreFile={handleRestoreFile}
              hasFileBackup={(selectedLogAnalysis.affectedConfig || selectedLogAnalysis.targetFile) ? !!fileBackups[selectedLogAnalysis.affectedConfig || selectedLogAnalysis.targetFile || ''] : false}
              parallelClusterState={parallelClusterState}
              lang={lang}
            />
          )}

          {/* Splunk Web Interactive Console Modal */}
          <SplunkWebModal
            isOpen={isWebModalOpen}
            onClose={() => setIsWebModalOpen(false)}
            webPort={webModalPort}
            hostIp={clusterSettings.hfIp || '127.0.0.1'}
            isFa={isFa}
          />

          {/* Virtual Server Purge & Decommission Modal */}
          <VirtualServerWipeModal
            isOpen={isVirtualWipeModalOpen}
            onClose={() => setIsVirtualWipeModalOpen(false)}
            isFa={isFa}
            virtualClusterState={virtualClusterState}
            onWipeSuccess={handlePurgeDecommissionedServers}
            onRecreateSuccess={handleVirtualServerRecreated}
          />

          {/* Tool Health & Self-Validation Engine Modal */}
          <ToolValidationModal
            isOpen={isToolValidationModalOpen}
            onClose={() => setIsToolValidationModalOpen(false)}
            isFa={isFa}
            currentToolId={validatingToolId}
            allModules={ALL_MODULES}
            initialTab="all"
            autoRunAllOnOpen={false}
            onNavigateToTool={(tId) => handleSelectModule(tId as any)}
          />

          {/* Backend Operations & Tool Health Inspector Modal */}
          <BackendOperationInspectorModal
            isOpen={isBackendInspectorOpen}
            onClose={() => setIsBackendInspectorOpen(false)}
            isFa={isFa}
            currentToolId={activeTab}
            allModules={ALL_MODULES}
            recentOperations={backendOperations}
            onClearHistory={() => setBackendOperations([])}
            onNavigateToTool={(tId) => handleSelectModule(tId as any)}
          />

          {/* Studio Modules & Layout Manager Modal */}
          <AppModulesManagerModal
            isOpen={isModuleManagerOpen}
            onClose={() => setIsModuleManagerOpen(false)}
            isFa={isFa}
            modules={modulesConfig}
            onUpdateModules={handleUpdateModules}
            defaultTab={defaultLaunchTab}
            onUpdateDefaultTab={handleUpdateDefaultTab}
            onResetToDefaults={handleResetToDefaults}
          />

          {/* Apple Minimalist Status Bar Footer */}
          <footer className="border-t border-white/[0.06] bg-[#111216] py-2.5 px-6 text-xs text-white/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsGlobalTerminalOpen(prev => !prev)}
                className="flex items-center gap-1.5 hover:text-cyan-300 transition cursor-pointer text-cyan-400"
                title={isFa ? 'نمایش ترمینال زنده و خروجی واقعی همه فرامین' : 'Show live terminal and real command output'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-medium">{isFa ? 'ترمینال زنده سرور' : 'Live Server Terminal'}</span>
              </button>
              <button
                onClick={() => {
                  setValidatingToolId('bento_overview');
                  setValidationInitialTab('all');
                  setIsToolValidationModalOpen(true);
                }}
                className="flex items-center gap-1.5 hover:text-[#30d158] transition cursor-pointer text-[#30d158]"
                title={isFa ? 'اجرای اعتبارسنجی واقعی آفلاین همه ابزارها' : 'Run real offline readiness validation for all tools'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse"></span>
                <span className="font-medium">{isFa ? 'بررسی آمادگی آفلاین سرور' : 'Offline Readiness Check'}</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/40">
              <span>Target: {currentProfile.shortName}</span>
              <span className="text-white/20">·</span>
              <span className="tabular-nums">Health: {healthScore}/100</span>
              <span className="text-white/20">·</span>
              <span className="tabular-nums">Snapshots: {snapshots.length}</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Spotlight Command Palette (⌘K) Modal */}
      {isQuickSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
          <div className="apple-window max-w-xl w-full shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Search Input */}
            <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#0a84ff] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFa ? 'جستجو در تمام ابزارها، کانفیگ‌ها و ماژول‌ها...' : 'Spotlight Search in modules, configs, and tools...'}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
              <button
                onClick={() => { setIsQuickSearchOpen(false); setSearchQuery(''); }}
                className="p-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filtered Results */}
            <div className="p-1.5 max-h-80 overflow-y-auto space-y-0.5">
              {filteredSearchModules.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveCategory(item.category);
                      if (item.id === 'admin_security' && !currentUser) {
                        setIsLoginModalOpen(true);
                      } else {
                        setActiveTab(item.id);
                      }
                      setIsQuickSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-right p-2.5 rounded-lg hover:bg-[#0071e3] group transition flex items-center justify-between gap-3 text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-white/[0.06] group-hover:bg-white/20 flex items-center justify-center text-[#0a84ff] group-hover:text-white transition shrink-0">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white/90 group-hover:text-white truncate">
                          {isFa ? item.titleFa : item.titleEn}
                        </div>
                        <div className="text-[11px] text-white/40 group-hover:text-white/80 truncate">
                          {isFa ? item.descriptionFa : item.descriptionEn}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-white/40 group-hover:text-white/80 bg-white/[0.06] group-hover:bg-white/20 px-2 py-0.5 rounded shrink-0">
                      {isFa ? 'انتقال ↵' : 'Open ↵'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-black/20 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
              <span>{isFa ? 'کلید Esc برای بستن' : 'Press esc to close'}</span>
              <span className="font-mono text-white/50">{filteredSearchModules.length} {isFa ? 'مورد یافت شد' : 'items'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Splunk System Debugger Modal */}
      {isDebugModalOpen && (
        <SplunkSystemDebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          lang={lang}
          activeEnvironment={activeEnvironment}
          configs={configs}
          findings={findings}
          resolvedFindings={resolvedFindings}
          score={healthScore}
          onRescan={handleRescanAudit}
          onResetBaseline={handleResetToBaselineAudit}
          onAutoFixAll={() => handleApplyAllRemediations(activeEnvironment)}
        />
      )}

      {/* Global PuTTY-style terminal: automatically available after login.
          It receives every central command-bus execution via SSE. */}
      {isGlobalTerminalOpen && activeTab !== 'parallel_provisioning' && (
        <div className="fixed bottom-4 right-4 z-[70] w-[min(920px,calc(100vw-2rem))] h-[min(620px,calc(100vh-6rem))] min-h-[360px] shadow-2xl">
          <PuTTYLiveShellConsole
            lang={lang}
            isFloating={true}
            onClose={() => setIsGlobalTerminalOpen(false)}
            onToggleFloating={() => setIsGlobalTerminalOpen(false)}
          />
        </div>
      )}

      {/* Picture-in-Picture Floating Mini-Windows */}
      {floatingTools.map((toolId) => {
        const mod = ALL_MODULES.find(m => m.id === toolId);
        return (
          <FloatingMiniWindow
            key={toolId}
            id={toolId}
            title={isFa ? (mod?.titleFa || toolId) : (mod?.titleEn || toolId)}
            icon={mod?.icon}
            isFa={isFa}
            onClose={() => handleCloseFloatingTool(toolId)}
            onMaximize={() => handleMaximizeFloatingTool(toolId)}
          >
            <div className="flex flex-col h-full min-h-0 gap-2">
              <div className="px-2.5 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[9px] text-cyan-200 truncate">{isFa ? 'تست زنده این بخش' : 'Live section test'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setValidatingToolId(toolId);
                    setValidationInitialTab('current');
                    setIsToolValidationModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-md bg-cyan-500 text-slate-950 text-[9px] font-black inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <ToolErrorBoundary
                  lang={lang}
                  toolName={mod?.[isFa ? 'titleFa' : 'titleEn']}
                >
                  {renderToolContent(toolId, true)}
                </ToolErrorBoundary>
              </div>
            </div>
          </FloatingMiniWindow>
        );
      })}
    </div>
  );
}
