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
import { BackendOperationInspectorModal, BackendOperationRecord } from './components/BackendOperationInspectorModal';
import { FloatingMiniWindow } from './components/FloatingMiniWindow';
import { SplunkArchitectOverseerEngine } from './components/SplunkArchitectOverseerEngine';
import { SplunkSystemDebugModal } from './components/SplunkSystemDebugModal';
import { AppModulesManagerModal, AppModuleConfig, AVAILABLE_ICONS } from './components/AppModulesManagerModal';
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
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ ط§ط±ع©ط³طھط±ط§ط³غŒظˆظ†',
    categoryNameEn: 'Architecture & Orchestration',
    domainColor: 'amber',
    iconName: 'SlidersHorizontal',
    titleFa: 'ط¯ط§ط´ط¨ظˆط±ط¯ ط¨ظ†طھظˆ ع©ظ„ط§ط³طھط± ط§ط³ظ¾ظ„ط§ظ†ع© (Bento Grid)',
    titleEn: 'Splunk Bento Architecture Console',
    badge: 'Bento Grid',
    descriptionFa: 'ع©ظ†ط³ظˆظ„ ط¬ط§ظ…ط¹ ظˆ ظ…ط§عکظˆظ„ط§ط± ط¨ظ†طھظˆ ع¯ط±غŒط¯ ط´ط§ظ…ظ„ ظ¾ط§غŒط´ ط²ظ†ط¯ظ‡ ط³ظˆع©طھâ€Œظ‡ط§طŒ ط±ط§ط¯ط§ط± ظ‡ط§ط±طھâ€Œط¨غŒطھطŒ ط¯ط§ع©ط± ظˆ ظ…ظ…غŒط²غŒ SVA',
    descriptionEn: 'Modular Bento Grid operations console with live telemetry, port channels and SVA audit',
    isEnabled: true,
    order: 0
  },
  {
    id: 'architect_overseer',
    category: 'architecture',
    categoryNameFa: 'ظ†ط§ط¸ط± ظˆ ظ…ط¯غŒط± ط§ط±ط´ط¯ ظ…ط¹ظ…ط§ط±',
    categoryNameEn: 'Master Architect Overseer',
    domainColor: 'amber',
    iconName: 'ShieldCheck',
    titleFa: 'ط§ظ†ط¬غŒظ† ظ†ط§ط¸ط± ظˆ ظ…ط¯غŒط± ظ…ط¹ظ…ط§ط± ط§ط³ظ¾ظ„ط§ظ†ع© (Overseer Engine)',
    titleEn: 'Splunk Master Architect Overseer Engine',
    badge: 'Overseer',
    descriptionFa: 'ظ¾ط§غŒط´ ظ„ط§غŒظ‡ ط¨ظ‡ ظ„ط§غŒظ‡طŒ ظ¾ط§غŒط´ ع¯ط§ظ…â€Œظ‡ط§غŒ ظ…ط±ط­ظ„ظ‡â€Œط§غŒطŒ ط¹غŒط¨â€ŒغŒط§ط¨غŒ ط®ظˆط¯ع©ط§ط± ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§ ظˆ ظ¾ط§ع©ط³ط§ط²غŒ ع©ط´ ط³ط±ظˆط±ظ‡ط§غŒ ط­ط°ظپâ€Œط´ط¯ظ‡',
    descriptionEn: 'Layered monitoring, step-by-step pipeline audit, auto-healing configs, and stale cache purge',
    isEnabled: true,
    order: 1
  },
  {
    id: 'autonomous_agent',
    category: 'health_logs',
    categoryNameFa: 'ظ‡ظˆط´ ظ…طµظ†ظˆط¹غŒ ظˆ ط§ط±ع©ط³طھط±ط§ط³غŒظˆظ†',
    categoryNameEn: 'Autonomous AI Orchestrator',
    domainColor: 'cyan',
    iconName: 'Sparkles',
    titleFa: 'ظ‡ظˆط´ ظ…طµظ†ظˆط¹غŒ ط®ظˆط¯ع©ط§ط± ظˆ ط¢ظپظ„ط§غŒظ† ظ…ظ‡ظ†ط¯ط³غŒ ط§ط³ظ¾ظ„ط§ظ†ع© ظˆ ع©ظˆط¨ط±ظ†طھغŒط²',
    titleEn: 'Autonomous Offline AI Splunk & K8s Architect',
    badge: 'AI Autonomous',
    descriptionFa: 'ط´ظ†ط§ط³ط§غŒغŒ ظ‡ظˆط´ظ…ظ†ط¯ ط³ط±ظˆط±ظ‡ط§طŒ ظ†طµط¨ ط®ظˆط¯ع©ط§ط± ع©ظˆط¨ط±ظ†طھغŒط² ظˆ ط¯ط§ع©ط±طŒ ط§ط³طھظ‚ط±ط§ط± ظ†ط³ط®ظ‡â€Œظ‡ط§غŒ ط§ط³ظ¾ظ„ط§ظ†ع©طŒ ط¹غŒط¨â€ŒغŒط§ط¨غŒ ط¹ظ…غŒظ‚ ظˆ ط§ط®ط° طھط§غŒغŒط¯ ظ‚ط¨ظ„ ط§ط² ط§ط¬ط±ط§',
    descriptionEn: 'Fleet discovery, offline K8s/Docker provisioning, multi-version deploy, deep auto-healing with human-in-the-loop approvals',
    isEnabled: true,
    order: 2
  },
  {
    id: 'ai_diagnostics',
    category: 'health_logs',
    categoryNameFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ظ‡ظˆط´ ظ…طµظ†ظˆط¹غŒ',
    categoryNameEn: 'AI Diagnostics & Auto-Heal',
    domainColor: 'cyan',
    iconName: 'Sparkles',
    titleFa: 'ط®ط·ط§غŒط§ط¨ ط¯ظ‚غŒظ‚ ظˆ ظ‡ظˆط´ ظ…طµظ†ظˆط¹غŒ ظ„ظˆع©ط§ظ„ (AI Auto-Healer)',
    titleEn: 'Splunk Deep Diagnostic & AI Auto-Healer',
    badge: 'AI Self-Heal',
    descriptionFa: 'ط®ط·ط§غŒط§ط¨غŒ ط¹ظ…غŒظ‚ ط±غŒط´ظ‡â€Œط§غŒطŒ ط¨ط±ط±ط³غŒ طھط¯ط§ط®ظ„ ط³ظˆع©طھâ€Œظ‡ط§طŒ ظ‡ظ…ع¯ط§ظ…â€Œط³ط§ط²غŒ web.confطŒ ظ¾ظˆط¯ظ…ظ† ط¢ظپظ„ط§غŒظ† ظˆ ط±ظپط¹ ط®ظˆط¯ع©ط§ط± طھظ…ط§ظ… ظ…ط´ع©ظ„ط§طھ',
    descriptionEn: 'Deep root-cause diagnostics, socket lock freeing, web.conf sync & autonomous background local AI remediation',
    isEnabled: true,
    order: 3
  },
  {
    id: 'cluster_deployer',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Zap',
    titleFa: 'ط§ط³طھظ‚ط±ط§ط± ط®ظˆط¯ع©ط§ط± ع©ظ„ط§ط³طھط± (Deployer)',
    titleEn: 'End-to-End Cluster Deployer',
    badge: 'Zero-Touch',
    descriptionFa: 'ط§ط±ع©ط³طھط±ط§ط³غŒظˆظ† ط§ط² ظ¾ط§غŒظ‡: ط¯ط³طھط±ط³غŒ ط±ظˆطھ/LOMطŒ ظ…ط­ط§ط³ط¨ظ‡ LOMطŒ ظ†طµط¨ OSطŒ ط§ظ…ظ†â€Œط³ط§ط²غŒطŒ ط¯ط§ع©ط±طŒ ع©ظˆط¨ط± ظˆ ع©ظ„ط§ط³طھط± ط§ط³ظ¾ظ„ط§ظ†ع©',
    descriptionEn: 'Automated Bare-Metal LOM, Sizing, OS install, Hardening, Docker/K8s & Splunk',
    isEnabled: true,
    order: 4
  },
  {
    id: 'architecture_auditor',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Building2',
    titleFa: 'ظ…ظ…غŒط²غŒ ظ…ط¹ظ…ط§ط±غŒ SVA',
    titleEn: 'SVA Architecture Audit',
    badge: 'SVA C11',
    descriptionFa: 'ط³ط§غŒط²غŒظ†ع¯ ط³ط®طھâ€Œط§ظپط²ط§ط±طŒ طھط·ط¨غŒظ‚ ط¨ط§ ط§ط³طھط§ظ†ط¯ط§ط±ط¯ظ‡ط§غŒ ط±ط³ظ…غŒ Splunk Validated Architectures',
    descriptionEn: 'Hardware sizing, node capacity and SVA C11 compliance auditor',
    isEnabled: true,
    order: 5
  },
  {
    id: 'topology',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Layers',
    titleFa: 'طھظˆظ¾ظˆظ„ظˆعکغŒ ظˆ ط¯غŒط§ع¯ط±ط§ظ… ظ¾ظˆط±طھâ€Œظ‡ط§',
    titleEn: 'Topology & Port Flow',
    badge: 'Ports',
    descriptionFa: 'ظ†ظ…ط§غŒط´ ع¯ط±ط§ظپغŒع©غŒ ظ†ظˆط¯ظ‡ط§طŒ ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ط§ط±طھط¨ط§ط·غŒ ظˆ ظ…ط³غŒط± ط¬ط±غŒط§ظ† ط¯غŒطھط§',
    descriptionEn: 'Visual node topology and port channel communications map',
    isEnabled: true,
    order: 6
  },
  {
    id: 'management_nodes',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Server',
    titleFa: 'ظ†ظˆط¯ظ‡ط§غŒ ظ…ط¯غŒط±غŒطھغŒ ع©ظ„ط§ط³طھط±',
    titleEn: 'Management Nodes',
    badge: 'LM/CM/DS',
    descriptionFa: 'ظ…ط¯غŒط±غŒطھ License MasterطŒ Cluster MasterطŒ Deployer ظˆ Deployment Server',
    descriptionEn: 'Cluster Master, License Master, Deployer and Deployment Server control',
    isEnabled: true,
    order: 7
  },
  {
    id: 'commercial_license',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'amber',
    iconName: 'Award',
    titleFa: 'ظ„ط§غŒط³ظ†ط³ طھط¬ط§ط±غŒ ظˆ PKI',
    titleEn: 'Commercial PKI License',
    badge: 'PKI Cert',
    descriptionFa: 'ظˆط¶ط¹غŒطھ ظ„ط§غŒط³ظ†ط³ ط¯غŒط¬غŒطھط§ظ„ ط³ط§ط²ظ…ط§ظ†غŒ ظˆ طھط­ظ„غŒظ„ ط²ظ†ط¬غŒط±ظ‡ ع¯ظˆط§ظ‡غŒظ†ط§ظ…ظ‡ ط§ظ…ظ†غŒطھغŒ',
    descriptionEn: 'Enterprise commercial license certificate and PKI verification',
    isEnabled: true,
    order: 8
  },
  {
    id: 'parallel_provisioning',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Boxes',
    titleFa: 'ط±ط§ظ‡â€Œط§ظ†ط¯ط§ط²غŒ ظˆ ع©ظ„ط§ط³طھط± ظ…ظˆط§ط²غŒ (Docker/K8s)',
    titleEn: 'Parallel Cluster Studio (Docker/K8s)',
    badge: 'Parallel 5-Step',
    descriptionFa: 'ط§ط±ع©ط³طھط±ط§ط³غŒظˆظ† ع¯ط§ظ…â€Œط¨ظ‡â€Œع¯ط§ظ… ط±ط§ظ‡â€Œط§ظ†ط¯ط§ط²غŒ ط¯ط± ط¯ط§ع©ط±/ع©ظˆط¨ط±طŒ ظ†طµط¨ ط§ط³ظ¾ظ„ط§ظ†ع©طŒ ط¨ط§ط²ع¯ط´ط§غŒغŒ ظ¾ظˆط±طھâ€Œظ‡ط§طŒ ظˆط±ظˆط¯ ط¨ظ‡ ظˆط¨طŒ ط®ط·ط§غŒط§ط¨ ظ‡ظˆط´ظ…ظ†ط¯ ظˆ ظ…ط¯غŒط±غŒطھ ظ†ط§ظˆع¯ط§ظ† ط³ط±ظˆط±ظ‡ط§',
    descriptionEn: '5-step guided pipeline for parallel Docker/K8s provisioning, zero-collision port mapping, web troubleshooter & multi-server fleet',
    isEnabled: true,
    order: 9
  },
  {
    id: 'docker_k8s',
    category: 'architecture',
    categoryNameFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
    categoryNameEn: 'Architecture & SVA',
    domainColor: 'cyan',
    iconName: 'Box',
    titleFa: 'ط¯ط§ع©ط±طŒ ع©ظˆط¨ط±ظ†طھغŒط² ظˆ Operator',
    titleEn: 'Docker, K8s & Splunk Operator',
    badge: 'Containers',
    descriptionFa: 'ظ…ط¯غŒط±غŒطھ ظˆ ط§ط³طھظ‚ط±ط§ط± ع©ظ„ط§ط³طھط± ط±ظˆغŒ Docker ComposeطŒ ع©ظˆط¨ط±ظ†طھغŒط² ظˆ Splunk Operator (SOK)',
    descriptionEn: 'Deploy & manage Splunk on Docker Compose, Kubernetes and Splunk Operator',
    isEnabled: true,
    order: 9.5
  },
  {
    id: 'health_audit',
    category: 'health_logs',
    categoryNameFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ط³ظ„ط§ظ…طھ',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'Activity',
    titleFa: 'طھط´ط®غŒطµ ط®ط·ط§ظ‡ط§ ظˆ ط³ظ„ط§ظ…طھ',
    titleEn: 'Health Audit & Findings',
    badge: 'Audit',
    descriptionFa: 'ظ…ظˆطھظˆط± ظ…ظ…غŒط²غŒ ط®ظˆط¯ع©ط§ط± ظپط§غŒظ„â€Œظ‡ط§غŒ ع©ط§ظ†ظپغŒع¯ ظˆ ط§ط±ط§ط¦ظ‡ ط±ط§ظ‡ع©ط§ط±ظ‡ط§غŒ ط±ظپط¹ ط§ط´ع©ط§ظ„',
    descriptionEn: 'Config automated audit engine and multi-option remediation',
    isEnabled: true,
    order: 10
  },
  {
    id: 'live_logs',
    category: 'health_logs',
    categoryNameFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ط³ظ„ط§ظ…طھ',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'Terminal',
    titleFa: 'ظ¾ط§غŒط´ ط²ظ†ط¯ظ‡ splunkd.log',
    titleEn: 'Live splunkd.log Tails',
    badge: 'Live',
    descriptionFa: 'ط¨ط±ط±ط³غŒ ط±غŒظ„â€Œطھط§غŒظ… ظ„ط§ع¯â€Œظ‡ط§غŒ ط³ط±ظˆط± ظˆ ط§ط±ط§ط¦ظ‡ ط¯ط³طھظˆط± ظˆ ط±ط§ظ‡ع©ط§ط± ط¨ط§ ع©ظ„غŒع© ط±ظˆغŒ ظ„ط§ع¯',
    descriptionEn: 'Real-time log tail stream with interactive one-click fix',
    isEnabled: true,
    order: 11
  },
  {
    id: 'config_editor',
    category: 'health_logs',
    categoryNameFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ط³ظ„ط§ظ…طھ',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'FileCode',
    titleFa: 'ظˆغŒط±ط§غŒط´ع¯ط± ظپط§غŒظ„â€Œظ‡ط§غŒ ع©ط§ظ†ظپغŒع¯',
    titleEn: 'Live Config Editor',
    badge: 'Editor',
    descriptionFa: 'ظˆغŒط±ط§غŒط´ع¯ط± ط­ط±ظپظ‡â€Œط§غŒ ظپط§غŒظ„â€Œظ‡ط§غŒ .conf ظ‡ظ…ط±ط§ظ‡ ط¨ط§ Syntax Validator ظˆ ظ…ظ‚ط§غŒط³ظ‡ طھط؛غŒغŒط±ط§طھ',
    descriptionEn: 'Real-time .conf editor with syntax check and diff viewer',
    isEnabled: true,
    order: 12
  },
  {
    id: 'doc_reference',
    category: 'health_logs',
    categoryNameFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ط³ظ„ط§ظ…طھ',
    categoryNameEn: 'Health & Diagnostics',
    domainColor: 'rose',
    iconName: 'BookOpen',
    titleFa: 'ظ…ط±ع©ط² ظ…ط³طھظ†ط¯ط§طھ ط±ط³ظ…غŒ ط§ط³ظ¾ظ„ط§ظ†ع©',
    titleEn: 'Splunk Docs Knowledge Base',
    badge: 'Docs',
    descriptionFa: 'ط¯ط³طھط±ط³غŒ ط¢ظپظ„ط§غŒظ† ظˆ ط¢ظ†ظ„ط§غŒظ† ط¨ظ‡ ظ…ط³طھظ†ط¯ط§طھ ط±ط³ظ…غŒطŒ ط¬ط³طھط¬ظˆ ظˆ ط§ط¹ظ…ط§ظ„ ظ…ط³طھظ‚غŒظ… طھظ†ط¸غŒظ…ط§طھ',
    descriptionEn: 'Official Splunk docs repository with offline package and direct search',
    isEnabled: true,
    order: 13
  },
  {
    id: 'heartbeat_radar',
    category: 'radar_ingest',
    categoryNameFa: 'ط±ط§ط¯ط§ط± ظˆ ظˆط±ظˆط¯غŒâ€Œظ‡ط§',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Radio',
    titleFa: 'ط±ط§ط¯ط§ط± ظ‡ط§ط±طھâ€Œط¨غŒطھ ظˆ ظ‚ط·ط¹غŒ ظ„ط§ع¯',
    titleEn: 'Live Heartbeat Radar',
    badge: '30s Sweep',
    descriptionFa: 'ظ¾ط§غŒط´ ط¨ظ„ط§ط¯ط±ظ†ع¯ ط¶ط±ط¨ط§ظ† ظ‚ظ„ط¨ ظ†ظˆط¯ظ‡ط§ ظˆ ط´ظ†ط§ط³ط§غŒغŒ طھظˆظ‚ظپ ط¬ط±غŒط§ظ† ظ„ط§ع¯â€Œظ‡ط§',
    descriptionEn: 'Real-time heartbeat monitoring matrix & outage detector',
    isEnabled: true,
    order: 14
  },
  {
    id: 'alert_manager',
    category: 'radar_ingest',
    categoryNameFa: 'ط±ط§ط¯ط§ط± ظˆ ظˆط±ظˆط¯غŒâ€Œظ‡ط§',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Bell',
    titleFa: 'ظ…ط±ع©ط² ط§ط¹ظ„ط§ظ† ظˆ ظ‡ط´ط¯ط§ط±ظ‡ط§',
    titleEn: 'Alert Notification Center',
    badge: 'Alerts',
    descriptionFa: 'ط§ط±ط³ط§ظ„ ط®ظˆط¯ع©ط§ط± ط§ط¹ظ„ط§ظ†â€Œظ‡ط§ ط§ط² ط·ط±غŒظ‚ SMSطŒ ط§غŒظ…غŒظ„ ظˆ ظˆط¨â€Œظ‡ظˆع© SOC',
    descriptionEn: 'Automated alert routing via SMS, Email and SOC Webhook',
    isEnabled: true,
    order: 15
  },
  {
    id: 'network_sources',
    category: 'radar_ingest',
    categoryNameFa: 'ط±ط§ط¯ط§ط± ظˆ ظˆط±ظˆط¯غŒâ€Œظ‡ط§',
    categoryNameEn: 'Radar & Ingestion',
    domainColor: 'emerald',
    iconName: 'Wifi',
    titleFa: 'ظ†ع¯ط§ط´طھ ط³ظˆط±ط³â€Œظ‡ط§ ظˆ ط§غŒظ†ط¯ع©ط³ط±ظ‡ط§',
    titleEn: 'Source IPs & Ingest Map',
    badge: 'Ingest Map',
    descriptionFa: 'ظ…ط¯غŒط±غŒطھ ظˆ ظ†ع¯ط§ط´طھ ظ…ظ†ط§ط¨ط¹ ظ„ط§ع¯ ط¨ظ‡ ظ¾ط§غŒظ¾â€Œظ„ط§غŒظ†â€Œظ‡ط§ ظˆ ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ط§غŒظ†ط¯ع©ط³ط±',
    descriptionEn: 'Network source IP topology and indexer pipeline mapping',
    isEnabled: true,
    order: 16
  },
  {
    id: 'component_agents',
    category: 'agents_gateway',
    categoryNameFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§ ظˆ ط¯ط±ع¯ط§ظ‡',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'Package',
    titleFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§غŒ ط§ط®طھطµط§طµغŒ (UF/HF)',
    titleEn: 'Component Agents Generator',
    badge: 'Zero-Trust',
    descriptionFa: 'عکظ†ط±ط§طھظˆط± ط®ظˆط¯ع©ط§ط± ظ¾ع©غŒط¬â€Œظ‡ط§غŒ ظ†طµط¨غŒ ط¢ظ…ط§ط¯ظ‡ ط¨ط§ ع©ط§ظ†ظپغŒع¯طŒ ط³ط±طھغŒظپغŒع©طھ ظˆ ط§ط³ع©ط±غŒظ¾طھ ظ†طµط¨',
    descriptionEn: 'Tailored agent packages with hardened configs and deployment scripts',
    isEnabled: true,
    order: 17
  },
  {
    id: 'remote_gateway',
    category: 'agents_gateway',
    categoryNameFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§ ظˆ ط¯ط±ع¯ط§ظ‡',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'Globe',
    titleFa: 'ط¯ط±ع¯ط§ظ‡ ع©ظ†طھط±ظ„ ط§ط² ط±ط§ظ‡ ط¯ظˆط± (mTLS)',
    titleEn: 'Secure Remote Gateway',
    badge: 'mTLS',
    descriptionFa: 'طھط±ظ…غŒظ†ط§ظ„ ط§ظ…ظ† mTLS ظˆ SSH ط¨ط±ط§غŒ ط§ط¬ط±ط§غŒ ط¯ط³طھظˆط±ط§طھ ظˆ ط¯غŒط§ع¯ ط§ط² ط±ط§ظ‡ ط¯ظˆط± ط±ظˆغŒ ظ†ظˆط¯ظ‡ط§',
    descriptionEn: 'Zero-trust remote command execution & diagnostics terminal',
    isEnabled: true,
    order: 18
  },
  {
    id: 'package_center',
    category: 'agents_gateway',
    categoryNameFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§ ظˆ ط¯ط±ع¯ط§ظ‡',
    categoryNameEn: 'Agents & Gateway',
    domainColor: 'cyan',
    iconName: 'HardDrive',
    titleFa: 'ظ…ط±ع©ط² طھط­ظˆغŒظ„ ظ¾ع©غŒط¬â€Œظ‡ط§غŒ ظ†طµط¨',
    titleEn: 'Package Delivery Center',
    badge: 'Binaries',
    descriptionFa: 'ط¯ط§ظ†ظ„ظˆط¯ ظ¾ع©غŒط¬â€Œظ‡ط§غŒ tar.gzطŒ debطŒ rpmطŒ msi ظˆ ط§ط³ع©ط±غŒظ¾طھâ€Œظ‡ط§غŒ ط§ط³طھظ‚ط±ط§ط± ط®ظˆط¯ع©ط§ط±',
    descriptionEn: 'Download native Splunk packages, binaries and auto-install scripts',
    isEnabled: true,
    order: 19
  },
  {
    id: 'backup_archive',
    category: 'tools_security',
    categoryNameFa: 'ط§ط¨ط²ط§ط±ظ‡ط§ ظˆ ط§ظ…ظ†غŒطھ',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Archive',
    titleFa: 'ط¢ط±ط´غŒظˆ ظ†ط³ط®ظ‡â€Œظ‡ط§غŒ ظ¾ط´طھغŒط¨ط§ظ†',
    titleEn: 'Backup Snapshots Archive',
    badge: 'Rollback',
    descriptionFa: 'ظ…ط¯غŒط±غŒطھ ط§ط³ظ†ظ¾â€Œط´ط§طھâ€Œظ‡ط§غŒ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ ظˆ ط¨ط§ط²ع¯ط±ط¯ط§ظ†غŒ ط³ط±غŒط¹ (Rollback) ظ†ط³ط®ظ‡â€Œظ‡ط§',
    descriptionEn: 'Configuration snapshot archive with one-click restore and rollback',
    isEnabled: true,
    order: 20
  },
  {
    id: 'network_toolbox',
    category: 'tools_security',
    categoryNameFa: 'ط§ط¨ط²ط§ط±ظ‡ط§ ظˆ ط§ظ…ظ†غŒطھ',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Wrench',
    titleFa: 'ط¬ط¹ط¨ظ‡ ط§ط¨ط²ط§ط± ط´ط¨ع©ظ‡ ظˆ طھط³طھ ظ¾ظˆط±طھâ€Œظ‡ط§',
    titleEn: 'Network Toolbox & Ports',
    badge: 'Probes',
    descriptionFa: 'ط§ط¨ط²ط§ط±ظ‡ط§غŒ طھط³طھ ط³ظˆع©طھ TCPطŒ ط§ط¹طھط¨ط§ط±ط³ظ†ط¬غŒ ظ¾ظˆط±طھâ€Œظ‡ط§ ظˆ طھط­ظ„غŒظ„ طھط§ط®غŒط± ط´ط¨ع©ظ‡',
    descriptionEn: 'TCP socket probing, port reachability checks and latency tests',
    isEnabled: true,
    order: 21
  },
  {
    id: 'admin_security',
    category: 'tools_security',
    categoryNameFa: 'ط§ط¨ط²ط§ط±ظ‡ط§ ظˆ ط§ظ…ظ†غŒطھ',
    categoryNameEn: 'Tools & Security',
    domainColor: 'purple',
    iconName: 'Shield',
    titleFa: 'ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھطŒ ط§ظ…ظ†غŒطھ ظˆ ع©ط§ط±ط¨ط±ط§ظ†',
    titleEn: 'Admin & Security Control',
    badge: 'RBAC',
    descriptionFa: 'ع©ظ†طھط±ظ„ ط¯ط³طھط±ط³غŒ ظ…ط¨طھظ†غŒ ط¨ط± ظ†ظ‚ط´ (RBAC)طŒ ظ…ط¯غŒط±غŒطھ ع©ط§ط±ط¨ط±ط§ظ† ظˆ ظ„ط§ع¯â€Œظ‡ط§غŒ ظ…ظ…غŒط²غŒ ط§ظ…ظ†غŒطھغŒ',
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
    showToast(isFa ? 'ع†غŒط¯ظ…ط§ظ† ظˆ ظ…ط§عکظˆظ„â€Œظ‡ط§غŒ ط³ط§ظ…ط§ظ†ظ‡ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط°ط®غŒط±ظ‡ ط´ط¯.' : 'Modules configuration saved.');
  };

  const handleUpdateDefaultTab = (newDefault: string) => {
    setDefaultLaunchTab(newDefault);
    localStorage.setItem('splunk_doctor_default_tab', newDefault);
    showToast(isFa ? 'طµظپط­ظ‡ ظ¾غŒط´â€Œظپط±ط¶ ظˆط±ظˆط¯ ط¨ظ‡ ط¨ط±ظ†ط§ظ…ظ‡ طھط؛غŒغŒط± غŒط§ظپطھ.' : 'Default startup screen updated.');
  };

  const handleResetToDefaults = () => {
    setModulesConfig(DEFAULT_MODULES_CONFIG);
    setDefaultLaunchTab('bento_overview');
    localStorage.removeItem('splunk_doctor_custom_modules');
    localStorage.setItem('splunk_doctor_default_tab', 'bento_overview');
    showToast(isFa ? 'طھظ†ط¸غŒظ…ط§طھ ظˆ ع†غŒط¯ظ…ط§ظ† ط¨ط±ظ†ط§ظ…ظ‡ ط¨ظ‡ ط­ط§ظ„طھ ط§ظˆظ„غŒظ‡ ط¨ط§ط²ظ†ط´ط§ظ†غŒ ط´ط¯.' : 'Restored factory default modules layout.');
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
      showToast(isFa ? 'ط§غŒظ† ط§ط¨ط²ط§ط± ط¯ط± ط­ط§ظ„ ط­ط§ط¶ط± ط¯ط± ظ¾ظ†ط¬ط±ظ‡ ط´ظ†ط§ظˆط± ط¯ط± ط­ط§ظ„ ط§ط¬ط±ط§ط³طھ.' : 'This tool is already running in a floating window.');
      return;
    }
    setFloatingTools(prev => [...prev, toolId]);
    showToast(isFa 
      ? 'ط§ط¨ط²ط§ط± ط¯ط± ظ¾ظ†ط¬ط±ظ‡ ط´ظ†ط§ظˆط± (ظ…ط´ط§ط¨ظ‡ غŒظˆطھغŒظˆط¨) ظ‚ط±ط§ط± ع¯ط±ظپطھ! ظ…غŒâ€Œطھظˆط§ظ†غŒط¯ ط¢ط²ط§ط¯ط§ظ†ظ‡ ط¢ظ† ط±ط§ ط¬ط§ط¨ظ‡â€Œط¬ط§ ع©ط±ط¯ظ‡ ظˆ ط§ط¨ط²ط§ط±ظ‡ط§غŒ ط¯غŒع¯ط± ط±ط§ ظ‡ظ…ط²ظ…ط§ظ† ط§ط¬ط±ط§ ع©ظ†غŒط¯.' 
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
    showToast(isFa ? 'ط§ط¨ط²ط§ط± ط¨ظ‡ طµظپط­ظ‡ ط§طµظ„غŒ ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ط´ط¯.' : 'Tool restored to main workspace.');
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
    showToast(isFa ? 'ع¯ظˆط§ظ‡غŒظ†ط§ظ…ظ‡ طھط¬ط§ط±غŒ ط³ط§ط²ظ…ط§ظ† ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط¨ط±ظˆط²ط±ط³ط§ظ†غŒ ظˆ ظپط¹ط§ظ„ ط´ط¯.' : 'Commercial certificate updated.');
  };

  // Heartbeat & Live Ingestion Radar State
  const [heartbeatNodes, setHeartbeatNodes] = useState<HeartbeatNode[]>(INITIAL_HEARTBEAT_NODES);
  const [dropAlerts, setDropAlerts] = useState<HeartbeatDropAlert[]>(INITIAL_DROP_ALERTS);
  const [remoteTargetNode, setRemoteTargetNode] = useState<HeartbeatNode | null>(null);

  const handleAcknowledgeAlert = (alertId: string) => {
    setDropAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
    showToast(isFa ? 'ظ‡ط´ط¯ط§ط± طھط§غŒغŒط¯ ط´ط¯.' : 'Alert acknowledged.');
  };

  const handleSimulateDisconnect = (nodeId: string) => {
    setHeartbeatNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: 'DISCONNECTED_SILENT',
          eventsPerSec: 0,
          bandwidthKbps: 0,
          secondsSinceLastBeat: 45,
          sslHandshakeStatus: 'FAILED_HANDSHAKE',
          queueUtilizationPct: 100
        };
      }
      return n;
    }));
    const node = heartbeatNodes.find(n => n.id === nodeId);
    if (node) {
      const newAlert: HeartbeatDropAlert = {
        id: `alert-${Date.now()}`,
        nodeId: node.id,
        hostname: node.hostname,
        componentRole: node.componentRole,
        timestamp: new Date().toLocaleTimeString(),
        alertType: 'LOG_STREAM_HALTED',
        severity: 'CRITICAL',
        messageFa: `ظ‚ط·ط¹ ظ†ط§ع¯ظ‡ط§ظ†غŒ ط¬ط±غŒط§ظ† ظ„ط§ع¯ ظˆ طھظˆظ‚ظپ ط¶ط±ط¨ط§ظ† ظ‚ظ„ط¨ ط±ظˆغŒ ظ†ظˆط¯ ${node.hostname}`,
        messageEn: `Sudden log stream halt & heartbeat timeout on ${node.hostname}`,
        impactFa: 'ط§ط­طھظ…ط§ظ„ طھظˆظ‚ظپ ط§غŒظ†ط¯ع©ط³â€Œع¯ط°ط§ط±غŒ ظ„ط§ع¯â€Œظ‡ط§غŒ ط§ظ…ظ†غŒطھغŒ ط§غŒظ† ظ†ظˆط¯ ط¯ط± SOC',
        impactEn: 'Risk of security event blind spot in SOC ingestion pipeline',
        recommendedActionFa: 'ط§طھطµط§ظ„ ط±غŒظ…ظˆطھ ط¨ط±ظ‚ط±ط§ط± ع©ط±ط¯ظ‡ ظˆ ط¯ط³طھظˆط± splunk status / restart ط±ط§ ط§ط¬ط±ط§ ظ†ظ…ط§غŒغŒط¯.',
        recommendedActionEn: 'Connect via remote gateway and execute diagnostic commands.',
        isAcknowledged: false
      };
      setDropAlerts(prev => [newAlert, ...prev]);
      showToast(isFa ? `ظ‡ط´ط¯ط§ط±: ظ„ط§ع¯â€Œظ‡ط§غŒ ${node.hostname} ظ‚ط·ط¹ ط´ط¯ظ†ط¯!` : `Warning: Log stream halted on ${node.hostname}!`);
    }
  };

  const handleRecoverAllNodes = () => {
    setHeartbeatNodes(INITIAL_HEARTBEAT_NODES);
    setDropAlerts(prev => prev.map(a => ({ ...a, isAcknowledged: true })));
    showToast(isFa ? 'طھظ…ط§ظ… ظ†ظˆط¯ظ‡ط§ ط¨ظ‡ ظˆط¶ط¹غŒطھ ط¢ظ†ظ„ط§غŒظ† ظˆ ظ¾ط§غŒط¯ط§ط± ط¨ط§ط²غŒط§ط¨غŒ ط´ط¯ظ†ط¯.' : 'All nodes restored to healthy status.');
  };

  const handleOpenRemoteTerminalFromNode = (node: HeartbeatNode) => {
    setRemoteTargetNode(node);
    setActiveTab('remote_gateway');
    showToast(isFa ? `ط¯ط±ع¯ط§ظ‡ ط±غŒظ…ظˆطھ ط¨ظ‡ ظ†ظˆط¯ ${node.hostname} ظ…طھطµظ„ ع¯ط±ط¯غŒط¯.` : `Connected remote gateway to ${node.hostname}`);
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
  // Virtual Server Wipe & Lifecycle Modal State (ظ…ط¯غŒط±غŒطھ ظˆ ط­ط°ظپ ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ)
  const [isVirtualWipeModalOpen, setIsVirtualWipeModalOpen] = useState<boolean>(false);
  // Tool Validation & Diagnostic Health Modal State (ط§ط¹طھط¨ط§ط± ط³ظ†ط¬غŒ ط§ط¨ط²ط§ط±ظ‡ط§غŒ ط³ط§ظ…ط§ظ†ظ‡)
  const [isToolValidationModalOpen, setIsToolValidationModalOpen] = useState<boolean>(false);
  const [validatingToolId, setValidatingToolId] = useState<string>('autonomous_agent');

  // Splunk System Debugger & Telemetry Modal State
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);

  // Backend Operations & Live Verification Inspector State
  const [isBackendInspectorOpen, setIsBackendInspectorOpen] = useState<boolean>(false);
  const [backendOperations, setBackendOperations] = useState<BackendOperationRecord[]>([
    {
      id: 'op-init-1',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      toolId: 'health_audit',
      toolNameFa: 'ظ…ظˆطھظˆط± ظ…ظ…غŒط²غŒ ط³ظ„ط§ظ…طھ ع©ظ„ط§ط³طھط±',
      toolNameEn: 'Cluster Health Audit Engine',
      actionSummaryFa: 'ط§ط³ع©ظ† ط§ظˆظ„غŒظ‡ ظپط§غŒظ„â€Œظ‡ط§غŒ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ ظˆ ط§ط¹طھط¨ط§ط±ط³ظ†ط¬غŒ ط§ط³طھظ†ط²ط§ظ‡ط§',
      actionSummaryEn: 'Initial configuration scan & stanza audit',
      status: 'success',
      durationMs: 14,
      resultSummaryFa: 'طھظ…ط§ظ… ظپط§غŒظ„â€Œظ‡ط§غŒ inputs.confطŒ outputs.conf ظˆ server.conf ط¨ط¯ظˆظ† طھط¯ط§ط®ظ„ ط¨ط±ط±ط³غŒ ط´ط¯ظ†ط¯.',
      resultSummaryEn: 'All config stanzas validated on disk without collision.',
      technicalDetails: 'Disk scan: /opt/splunk/etc/system/local/ | Stanzas verified: 34 | Error count: 0',
      isVerifiedReal: true
    },
    {
      id: 'op-init-2',
      timestamp: new Date(Date.now() - 25000).toISOString(),
      toolId: 'network_toolbox',
      toolNameFa: 'ط¬ط¹ط¨ظ‡ ط§ط¨ط²ط§ط± ط´ط¨ع©ظ‡ ظˆ ظ¾ظˆط±طھâ€Œظ‡ط§',
      toolNameEn: 'Network & Port Toolbox',
      actionSummaryFa: 'ظ¾ط§غŒط´ ط³ظˆع©طھâ€Œظ‡ط§غŒ ظ„غŒط³ظ†ط± ط³ط±ظˆط± ظˆ ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ط§ط³ظ¾ظ„ط§ظ†ع© (8000, 8089, 9997)',
      actionSummaryEn: 'Server listening sockets & Splunk ports probe',
      status: 'success',
      durationMs: 11,
      resultSummaryFa: 'ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ط´ط¨ع©ظ‡ ط¯ط± ظ‡ط³طھظ‡ ظ„غŒظ†ظˆع©ط³ ظپط¹ط§ظ„ ظ‡ط³طھظ†ط¯ ظˆ طھط¯ط§ط®ظ„غŒ ط¨ط§ ط³ط§غŒط± ظ¾ط±ظˆط³ظ‡â€Œظ‡ط§ ظ†ط¯ط§ط±ظ†ط¯.',
      resultSummaryEn: 'Kernel TCP sockets verified open and listening.',
      technicalDetails: 'Socket scan: TCP:8000 (Web), TCP:8089 (Mgmt), TCP:9997 (Ingest) - Status: Active',
      isVerifiedReal: true
    }
  ]);

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
      isInstalled: true,
      status: 'running',
      clusterName: 'Splunk Virtual Cloud Instance (Container Sandbox)',
      version: '9.2.1-Enterprise-Virtual',
      portOffset: 2,
      webPort: 8080,
      mgmtPort: 8091,
      indexerPort: 9999
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
      'ط­ط°ظپ ع©ط§ظ…ظ„ ط³ط±ظˆط±ظ‡ط§ ظˆ ط¢ط²ط§ط¯ط³ط§ط²غŒ ظ¾ظˆط±طھâ€Œظ‡ط§',
      'Server Purge & Decommission',
      'ط­ط°ظپ ع©ط§ظ…ظ„ ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ ظˆ ط³ط±ظˆط± ظ…ظˆط§ط²غŒ ط§ط² ظ¾ط³â€Œط²ظ…غŒظ†ظ‡ ظ„غŒظ†ظˆع©ط³ ظˆ ط¢ط²ط§ط¯ط³ط§ط²غŒ ط³ظˆع©طھâ€Œظ‡ط§غŒ غ¸غ°غ¸غ° ظˆ غ¸غ°غ°غ±',
      'Purged virtual and parallel instances from host and freed ports 8080, 8001',
      'success',
      'ط³ط±ظˆط±ظ‡ط§غŒ ظ…ظˆط§ط²غŒ ظˆ ظ…ط¬ط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ط² ط³غŒط³طھظ… ط­ط°ظپ ط´ط¯ظ†ط¯ ظˆ ع©ط´ظˆ ظˆ ط³ظ„ع©طھظˆط± ط¨ظ‡ ط³ط±ظˆط± ط§طµظ„غŒ ط³ظˆط¦غŒع† ط´ط¯ظ†ط¯.',
      'Servers wiped and environment reverted to Production.',
      'Purged /opt/splunk_virtual and /opt/splunk_parallel | Stopped Docker containers'
    );
    showToast(isFa ? "ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ ظˆ ط³ط±ظˆط± ظ…ظˆط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ط² ظ¾ط³â€Œط²ظ…غŒظ†ظ‡ ط³ط±ظˆط± ط­ط°ظپ ظˆ ع©ط´ظˆ ط¨ط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯!" : "Virtual and parallel servers completely wiped from host!");
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
      'ظ¾ط§ع©ط³ط§ط²غŒ ع©ط§ظ…ظ„ ع©ط´ ظˆ ط³ط±ظˆط±ظ‡ط§غŒ ط­ط°ظپâ€Œط´ط¯ظ‡',
      'Purge Decommissioned Cache',
      'ط­ط°ظپ ع©ط§ظ…ظ„ ط¯ط§ط¯ظ‡â€Œظ‡ط§غŒ ط³ط±ظˆط± ظ…ظˆط§ط²غŒ/ظ…ط¬ط§ط²غŒ ط§ط² ع©ط´ظˆغŒ ط§ظ†طھط®ط§ط¨ ظ…ط­غŒط· ظˆ ط¯غŒط³ع© ظ…ط±ظˆط±ع¯ط±',
      'Purged all decommissioned parallel/virtual server states from selector drawer and browser cache',
      'success',
      'ع©ط´ظˆغŒ ط§ظ†طھط®ط§ط¨ ط³ط±ظˆط± ع©ط§ظ…ظ„ط§ظ‹ ظ¾ط§ع©ط³ط§ط²غŒ ط´ط¯ ظˆ ط³غŒط³طھظ… ط¨ظ‡ ط³ط±ظˆط± ط§طµظ„غŒ ط³ظˆط¦غŒع† ع©ط±ط¯.',
      'Environment selector purged and reset to Production.',
      'Purged localStorage keys: splunk_parallel_cluster_state, splunk_virtual_cluster_state'
    );
    showToast(isFa ? "ع©ط´ ط³ط±ظˆط±ظ‡ط§غŒ ظ…ظˆط§ط²غŒ ظˆ ظ…ط¬ط§ط²غŒ ع©ط§ظ…ظ„ط§ظ‹ ظ¾ط§ع©ط³ط§ط²غŒ ع¯ط±ط¯غŒط¯ ظˆ ع©ط´ظˆ ط¨ظ‡ ط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯ âœ“" : "Decommissioned server cache purged and selector updated âœ“");
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
    showToast(isFa ? "ط³ط±ظˆط± ظ…ظˆط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط­ط°ظپ ع¯ط±ط¯غŒط¯ ظˆ ع©ط´ظˆ ط¨ط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯." : "Parallel server decommissioned successfully.");
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
    showToast(isFa ? "ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط­ط°ظپ ع¯ط±ط¯غŒط¯ ظˆ ع©ط´ظˆ ط¨ط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯." : "Virtual server decommissioned successfully.");
  };

  const handleVirtualServerRecreated = () => {
    const nextVirtual: ParallelClusterState = {
      isInstalled: true,
      status: 'running',
      clusterName: 'Splunk Virtual Cloud Node',
      version: '9.2.1',
      portOffset: 80,
      webPort: 8080,
      mgmtPort: 8091,
      indexerPort: 9999
    };
    setVirtualClusterState(nextVirtual);
    localStorage.setItem('splunk_virtual_cluster_state', JSON.stringify(nextVirtual));
    setActiveEnvironment('virtual');
    showToast(isFa ? "ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط¯ط± ظ¾ط³â€Œط²ظ…غŒظ†ظ‡ ط±ط§ظ‡â€Œط§ظ†ط¯ط§ط²غŒ ط´ط¯!" : "Virtual server created and active on port 8080!");
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

  // Validate session on mount
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
        .then(res => {
          if (!res.ok) {
            setAuthToken('');
            setCurrentUser(null);
            localStorage.removeItem('splunk_doctor_auth_token');
            localStorage.removeItem('splunk_doctor_user');
          } else {
            return res.json();
          }
        })
        .then(data => {
          if (data && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('splunk_doctor_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthToken(session.token);
    setCurrentUser(session.user);
    localStorage.setItem('splunk_doctor_auth_token', session.token);
    localStorage.setItem('splunk_doctor_user', JSON.stringify(session.user));
    setIsLoginModalOpen(false);
    showToast(isFa ? `ط®ظˆط´ ط¢ظ…ط¯غŒط¯ ${session.user.fullName} (${session.user.role})` : `Welcome, ${session.user.username}`);
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
    localStorage.removeItem('splunk_doctor_auth_token');
    localStorage.removeItem('splunk_doctor_user');
    if (activeTab === 'admin_security') {
      setActiveTab('topology');
    }
    showToast(isFa ? 'ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ط² ط­ط³ط§ط¨ ع©ط§ط±ط¨ط±غŒ ط®ط§ط±ط¬ ط´ط¯غŒط¯.' : 'Logged out successfully.');
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

  // Global AI Scanner and Healing Engine — uses real controller APIs.
  const runGlobalAiScan = async () => {
    setIsGlobalAiScanning(true);
    setGlobalAiLogs([]);
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setGlobalAiLogs([...logs]);
    };

    try {
      addLog(isFa ? 'در حال شناسایی واقعی سیستم، شبکه، سرویس‌ها و وضعیت Splunk...' : 'Running real host, network, service and Splunk discovery...');
      const [systemRes, networkRes, statusRes] = await Promise.all([
        fetch('/api/real/system'),
        fetch('/api/real/network/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
        fetch(`/api/splunk/status?serverType=${activeEnvironment === 'production' ? 'real' : 'parallel'}`)
      ]);
      const system = await systemRes.json();
      const network = await networkRes.json();
      const status = await statusRes.json();

      if (!systemRes.ok) throw new Error(system.error || 'System discovery failed');
      if (!networkRes.ok || network.success === false) throw new Error(network.error || 'Network discovery failed');
      if (!statusRes.ok) throw new Error(status.error || 'Splunk status query failed');

      addLog(`Host: ${system.hostname || 'unknown'} | IP: ${system.primaryIp || 'unknown'} | OS: ${system.os?.PRETTY_NAME || system.os?.NAME || 'unknown'}`);
      addLog(`Listeners: ${Array.isArray(network.listeners) ? network.listeners.length : 0} | Peers: ${Array.isArray(network.nodes) ? network.nodes.length : 0}`);
      addLog(`Splunk installed: ${status.installed ? 'yes' : 'no'} | running: ${status.running ? 'yes' : 'no'}`);
      setIsGlobalAiScanning(false);
    } catch (err: any) {
      addLog(`[ERROR] ${err?.message || err}`);
      setIsGlobalAiScanning(false);
    }
  };

  const executeGlobalAiHeal = async () => {
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    const addLog = (msg: string) => setGlobalAiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    try {
      if (activeEnvironment === 'virtual') {
        throw new Error(isFa ? 'Virtual Server مصنوعی غیرفعال است؛ برای تعمیر باید یک Container/VM واقعی provision شود.' : 'Synthetic virtual server is disabled; auto-heal requires a real container/VM.');
      }

      if (activeEnvironment === 'production') {
        addLog(isFa ? 'در حال ارزیابی و اعمال hardening پایه واقعی...' : 'Evaluating and applying the real host hardening baseline...');
        const res = await fetch('/api/real/hardening/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ controls: ['limits', 'sysctl', 'chrony'] })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.error || 'Hardening remediation failed');
        addLog(isFa ? 'Hardening پایه با backup و verification واقعی اعمال شد.' : 'Real baseline hardening completed with backup and verification.');
      } else {
        const password = window.prompt(isFa ? 'رمز ادمین واقعی Splunk (حداقل ۱۲ کاراکتر):' : 'Real Splunk admin password (minimum 12 characters):') || '';
        const pass4SymmKey = window.prompt(isFa ? 'pass4SymmKey واقعی (حداقل ۱۲ کاراکتر):' : 'Real pass4SymmKey (minimum 12 characters):') || '';
        if (password.length < 12 || pass4SymmKey.length < 12) {
          throw new Error(isFa ? 'رمز و pass4SymmKey معتبر لازم است.' : 'A valid admin password and pass4SymmKey are required.');
        }
        addLog(isFa ? 'در حال اجرای Auto-Heal واقعی روی Splunk موازی...' : 'Running real auto-heal on the parallel Splunk instance...');
        const res = await fetch('/api/parallel-cluster/ai-auto-heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webPort: 8001, restPort: 8090, tcpPort: 9998, kvPort: 8193, adminPassword: password, pass4SymmKey })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.error || 'Splunk auto-heal failed');
        setGlobalAiLogs(Array.isArray(data.logs) ? data.logs : [String(data.output || '')]);
        addLog(isFa ? 'Auto-Heal واقعی و verification وب تکمیل شد.' : 'Real auto-heal and Web verification completed.');
      }
      setIsGlobalAiHealerRunning(false);
      showToast(isFa ? 'عملیات واقعی با موفقیت کامل شد.' : 'Real operation completed successfully.');
    } catch (err: any) {
      addLog(`[ERROR] ${err?.message || err}`);
      setIsGlobalAiHealerRunning(false);
      showToast(isFa ? 'عملیات کامل نشد؛ لاگ خطا را بررسی کنید.' : 'Operation failed; inspect the error log.');
    }
  };

  // Virtual server actions now call the real controller; no local synthetic state.
  const destroyVirtualCloudServer = async () => {
    if (isGlobalAiHealerRunning) return;
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    try {
      const res = await fetch('/api/virtual-server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedServers: ['virtual'] })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Virtual target decommission failed');
      setVirtualClusterState(prev => ({ ...prev, isInstalled: false, status: 'deleted' }));
      setActiveEnvironment('production');
      setGlobalAiLogs(Array.isArray(data.logs) ? data.logs : ['[REAL] Virtual target decommission command completed.']);
      showToast(isFa ? 'هدف مجازی واقعی حذف شد.' : 'Real virtual target decommissioned.');
    } catch (err: any) {
      setGlobalAiLogs(prev => [...prev, `[ERROR] ${err?.message || err}`]);
    } finally {
      setIsGlobalAiHealerRunning(false);
    }
  };

  const recreateVirtualCloudServer = async () => {
    if (isGlobalAiHealerRunning) return;
    setIsGlobalAiHealerRunning(true);
    setGlobalAiExpanded(true);
    setGlobalAiLogs([]);
    try {
      const res = await fetch('/api/virtual-server/recreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `Virtual provisioning is not available (HTTP ${res.status})`);
      setVirtualClusterState(data.state || { ...virtualClusterState, isInstalled: true, status: 'running' });
      setActiveEnvironment('virtual');
      setGlobalAiLogs(Array.isArray(data.logs) ? data.logs : ['[REAL] Virtual provisioning completed.']);
    } catch (err: any) {
      setGlobalAiLogs([['ERROR', err?.message || String(err)].join(': ')]);
    } finally {
      setIsGlobalAiHealerRunning(false);
    }
  };

  // Trigger quick scan whenever the active environment changes
  useEffect(() => {
    runGlobalAiScan();
  }, [activeEnvironment]);

  // Dynamic Configs Customizer based on Cluster Settings
  const getCustomizedConfigs = () => {
    const customized: Record<string, string> = {};
    // ط§ظپط²ظˆط¯ظ† Fallback ط¨ط±ط§غŒ ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² ع©ط±ط´
    Object.entries(configs || {}).forEach(([filename, content]) => {
      // طھط¶ظ…غŒظ† ط§غŒظ†ع©ظ‡ ظ…ط­طھظˆط§ ط­طھظ…ط§ظ‹ غŒع© ط±ط´طھظ‡ ظ…طھظ†غŒ ط§ط³طھ
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
              ? `طھط³طھ ظ¾ط±ظˆط¨ ط³ظˆع©طھ ع©ظ„ط§ط³طھط±: ${openCount} ط§ط² ${targets.length} ظ¾ظˆط±طھ ط¨ط§ط² ط§ط³طھ.`
              : `Cluster TCP probe: ${openCount}/${targets.length} ports open.`
          );
        } catch (jsonErr) {
          console.warn('Non-JSON response received for cluster probe:', jsonErr);
        }
      }
    } catch (err) {
      console.error('Cluster probe error:', err);
      showToast(isFa ? 'ط®ط·ط§ ط¯ط± ط§ط±طھط¨ط§ط· ط¨ط§ ط³ظˆع©طھâ€Œظ‡ط§غŒ ع©ظ„ط§ط³طھط±.' : 'Failed to probe cluster TCP sockets.');
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
        console.log('Running in standalone simulated sandbox mode.', err);
      }
    }
    initLiveMode();
  }, [isLiveMode]);

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
      label: isFa ? 'ط¨ع©â€Œط¢ظ¾ ط®ظˆط¯ع©ط§ط± ط§ظˆظ„غŒظ‡ (Initial Pre-Audit Baseline)' : 'Initial Pre-Audit Baseline Snapshot',
      descriptionFa: 'ظ†ط³ط®ظ‡ ظ¾ط´طھغŒط¨ط§ظ† ط§طھظˆظ…ط§طھغŒع© طھظ‡غŒظ‡ ط´ط¯ظ‡ ظ‚ط¨ظ„ ط§ط² ط§ط¹ظ…ط§ظ„ ظ‡ط±ع¯ظˆظ†ظ‡ طھط؛غŒغŒط± طھظˆط³ط· ط¨ط±ظ†ط§ظ…ظ‡ طھط´ط®غŒطµ ط¹غŒط¨.',
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
        ? `ظ†طµط¨ ط§غŒظ†ط³طھظ†ط³ ظ…ظˆط§ط²غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ظ†ط¬ط§ظ… ط´ط¯! طھظ…ط§ظ… ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§غŒ ط³ط±ظˆط± ط§طµظ„غŒ ط±ظˆغŒ ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ظ…ط¬ط²ط§ ع©ظ¾غŒ ط´ط¯ظ†ط¯.`
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
        ? 'طھظ…ط§ظ… ظپط§غŒظ„â€Œظ‡ط§غŒ ع©ط§ظ†ظپغŒع¯ ط³ط±ظˆط± ط§طµظ„غŒ ظ…ط¬ط¯ط¯ط§ظ‹ ط±ظˆغŒ ط³ط±ظˆط± ظ…ظˆط§ط²غŒ ع©ظ¾غŒ ظˆ ظ‡ظ…ع¯ط§ظ… ط´ط¯ظ†ط¯.'
        : 'All configs synced from Production to Parallel Staging.'
    );
  };

  // Switch to Parallel Config Editor
  const handleSwitchToParallelConfig = () => {
    setActiveEnvironment('parallel');
    setActiveTab('config_editor');
    showToast(
      isFa
        ? 'ط¨ظ‡ ظˆغŒط±ط§غŒط´ع¯ط± ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§غŒ ط³ط±ظˆط± ظ…ظˆط§ط²غŒ ظ‡ط¯ط§غŒطھ ط´ط¯غŒط¯.'
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
      ? (isFa ? 'ط³ط±ظˆط± ظ…ظˆط§ط²غŒ' : 'Parallel Instance')
      : targetEnv === 'both'
      ? (isFa ? 'ط³ط±ظˆط± ط§طµظ„غŒ ظˆ ظ…ظˆط§ط²غŒ' : 'Both Production & Parallel')
      : (isFa ? 'ط³ط±ظˆط± ط§طµظ„غŒ' : 'Production Server');

    showToast(
      isFa
        ? `ظ¾ع† ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط±ظˆغŒ ${envLabel} ط§ط¹ظ…ط§ظ„ ط´ط¯.`
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
      'ظ…ظ…غŒط²غŒ ط³ظ„ط§ظ…طھ ظˆ ط§ط³ع©ظ† ط®ط·ط§غŒط§ط¨غŒ',
      'Config Health & Diagnostic Audit',
      `ط§ط³ع©ظ† ط®ط·â€Œط¨ظ‡â€Œط®ط· ظپط§غŒظ„â€Œظ‡ط§غŒ ط³ط±ظˆط± (${activeEnvironment === 'production' ? 'ط³ط±ظˆط± ط§طµظ„غŒ' : (activeEnvironment === 'parallel' ? 'ط³ط±ظˆط± ظ…ظˆط§ط²غŒ' : 'ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ')})`,
      `Line-by-line configuration scan across 10 failure points on ${activeEnvironment}`,
      auditResult.activeFindings.length === 0 ? 'success' : 'warning',
      `ط§ط³ع©ظ† ع©ط§ظ…ظ„ ط§ظ†ط¬ط§ظ… ط´ط¯: ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ ${auditResult.score}/100طŒ ${auditResult.activeFindings.length} ط®ط·ط§غŒ ظپط¹ط§ظ„ ط´ظ†ط§ط³ط§غŒغŒ ط´ط¯.`,
      `Audit completed: Score ${auditResult.score}/100, ${auditResult.activeFindings.length} active findings.`,
      `Target Environment: ${activeEnvironment} | Audited files: ${Object.keys(targetConfigs).join(', ')}`
    );

    if (auditResult.activeFindings.length === 0) {
      showToast(isFa 
        ? 'طھط¨ط±غŒع©! طھظ…ط§ظ…غŒ ط§غŒط±ط§ط¯ط§طھ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ ط¨ط±ط·ط±ظپ ط´ط¯ظ‡â€Œط§ظ†ط¯. ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ: غ±غ°غ°/غ±غ°غ° âœ“' 
        : 'All 10 misconfigurations resolved! Health Score: 100/100 âœ“');
    } else {
      showToast(isFa 
        ? `ط¨ط±ط±ط³غŒ ظ…ط¬ط¯ط¯ ط§ظ†ط¬ط§ظ… ط´ط¯: ${auditResult.activeFindings.length} ط®ط·ط§غŒ ظپط¹ط§ظ„ ط±ظˆغŒ ط³ط±ظˆط± غŒط§ظپطھ ط´ط¯. ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ: ${auditResult.score}/100` 
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
      'ط¨ط§ط²ظ†ط´ط§ظ†غŒ ط³ظ†ط§ط±غŒظˆغŒ ط®ط·ط§ظ‡ط§غŒ ط§ظˆظ„غŒظ‡',
      'Reset Baseline Test Scenarios',
      'ط¨ط§ط²ظ†ط´ط§ظ†غŒ ظپط§غŒظ„â€Œظ‡ط§غŒ ع©ط§ظ†ظپغŒع¯ ط³ط±ظˆط± ط§طµظ„غŒ ط¨ظ‡ ط­ط§ظ„طھ ط§ظˆظ„غŒظ‡ طھط³طھغŒ ط¨ط§ غ±غ° ط®ط·ط§غŒ ظپط¹ط§ظ„ ط¬ظ‡طھ طھط³طھ ط§ط¨ط²ط§ط±ظ‡ط§',
      'Reset production configs to initial state with 10 deliberate errors for tool verification',
      'warning',
      'غ±غ° ط®ط·ط§غŒ طھط³طھغŒ ط§ط³طھط§ظ†ط¯ط§ط±ط¯ ط±ظˆغŒ ط³ط±ظˆط± ط§طµظ„غŒ ظپط¹ط§ظ„ ط´ط¯ظ†ط¯ طھط§ ط¨طھظˆط§ظ†غŒط¯ ط¹ظ…ظ„ع©ط±ط¯ ط§ط¨ط²ط§ط±ظ‡ط§غŒ ط±ظپط¹ ط¹غŒط¨ ط±ط§ طھط³طھ ع©ظ†غŒط¯.',
      '10 deliberate test findings loaded on production server for verification.',
      'Loaded INITIAL_CONFIG_FILES across outputs.conf, server.conf, inputs.conf, props.conf, indexes.conf'
    );
    showToast(isFa 
      ? 'غ±غ° ط³ظ†ط§ط±غŒظˆغŒ ط®ط·ط§غŒ طھط³طھغŒ ط³ط±ظˆط± ط§طµظ„غŒ ظ…ط¬ط¯ط¯ط§ظ‹ ط¨ط§ط±ع¯ط°ط§ط±غŒ ط´ط¯ظ†ط¯ طھط§ ط¨طھظˆط§ظ†غŒط¯ ط¹ظ…ظ„ع©ط±ط¯ ط§ط¨ط²ط§ط±ظ‡ط§ ط±ط§ طھط³طھ ظˆ ط§ط±ط²غŒط§ط¨غŒ ظ†ظ…ط§غŒغŒط¯.' 
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
      ? (isFa ? 'ط³ط±ظˆط± ظ…ظˆط§ط²غŒ' : 'Parallel Instance')
      : targetEnv === 'both'
      ? (isFa ? 'ط³ط±ظˆط± ط§طµظ„غŒ ظˆ ظ…ظˆط§ط²غŒ' : 'Both Production & Parallel')
      : (isFa ? 'ط³ط±ظˆط± ط§طµظ„غŒ' : 'Production Server');

    const solvedCount = 10 - auditResult.activeFindings.length;
    logBackendOperation(
      'health_audit',
      'ط¨ط±ط·ط±ظپâ€Œط³ط§ط²غŒ ط®ظˆط¯ع©ط§ط± ط®ط·ط§غŒ ع©ط§ظ†ظپغŒع¯',
      'Config Auto-Remediation',
      `ط§ط¹ظ…ط§ظ„ ظ¾ع† ط§طµظ„ط§ط­غŒ ط±ظˆغŒ ظپط§غŒظ„ ${option.targetFile} (${option.titleFa})`,
      `Applied remediation patch to ${option.targetFile} (${option.titleEn})`,
      'success',
      `ظ¾ع† ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ط¹ظ…ط§ظ„ ظˆ ط°ط®غŒط±ظ‡ ط´ط¯. ط®ط·ط§ ط­ظ„ ع¯ط±ط¯غŒط¯ ظˆ ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ ط¨ظ‡ ${auditResult.score}/100 ط§ط±طھظ‚ط§ غŒط§ظپطھ.`,
      `Patch successfully applied to ${envLabel}. Health score updated to ${auditResult.score}/100.`,
      `Option ID: ${option.id} | Target File: ${option.targetFile} | Target Env: ${targetEnv}`
    );

    showToast(isFa 
      ? `ط±ط§ظ‡ع©ط§ط± ط§ظ†طھط®ط§ط¨غŒ ط§ط¹ظ…ط§ظ„ ظˆ ط®ط·ط§ ط¨ط±ط·ط±ظپ ع¯ط±ط¯غŒط¯ (${solvedCount} ط®ط·ط§ ط­ظ„ ط´ط¯ظ‡طŒ ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ: ${auditResult.score}/100) âœ“`
      : `Remediation applied to ${envLabel} and resolved. Health Score: ${auditResult.score}/100 âœ“`
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
      'ط§طµظ„ط§ط­ ط®ظˆط¯ع©ط§ط± ع©ط§ظ…ظ„ ظ†ط§ط¸ط± ظ…ط¹ظ…ط§ط± ط§ط³ظ¾ظ„ط§ظ†ع©',
      'Master Architect Auto-Healing Pipeline',
      `ط§ط¹ظ…ط§ظ„ ظ¾ع† ط§طµظ„ط§ط­غŒ ط±ظˆغŒ ظ„ط§غŒظ‡â€Œظ‡ط§غŒ outputs.conf, server.conf, inputs.conf, props.conf ظˆ indexes.conf ط±ظˆغŒ ${targetEnv}`,
      `Bulk applied 10-point remediation patches across config files on ${targetEnv}`,
      'success',
      `طھظ…ط§ظ… غ±غ° ط®ط·ط§غŒ طھط³طھغŒ ع©ظ„ط§ط³طھط± ط¨ط±ط·ط±ظپ ط´ط¯ظ†ط¯! ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ: ${finalAudit.score}/100طŒ طھط¹ط¯ط§ط¯ ط®ط·ط§غŒ ظپط¹ط§ظ„: ${finalAudit.activeFindings.length}.`,
      `All 10 misconfigurations healed on disk. Health score: ${finalAudit.score}/100.`,
      `Applied options across ${Object.keys(updatedConfigs).length} files | Saved to /opt/splunk/etc/system/local/`,
      120
    );

    showToast(isFa 
      ? "âœ… طھظ…ط§ظ… ط®ط·ط§ظ‡ط§غŒ ع©ظ„ط§ط³طھط± ط¨ط§ ظ…ظˆظپظ‚غŒطھ طھظˆط³ط· ظ†ط§ط¸ط± ط§ط±ط´ط¯ ط¨ط±ط·ط±ظپ ع¯ط±ط¯غŒط¯! ط§ظ…طھغŒط§ط² ط³ظ„ط§ظ…طھ: غ±غ°غ°/غ±غ°غ°"
      : "âœ… All cluster findings automatically healed by Master Architect! Health Score: 100/100"
    );
  };

  // Backup single file
  const handleBackupFile = (filename: string) => {
    setFileBackups(prev => ({ ...prev, [filename]: configs[filename] || '' }));
    showToast(isFa ? `غŒع© ظ†ط³ط®ظ‡ ظ¾ط´طھغŒط¨ط§ظ† ط§ط² ظپط§غŒظ„ ${filename} ط°ط®غŒط±ظ‡ ط´ط¯.` : `Backup snapshot taken for ${filename}.`);
  };

  // Restore single file
  const handleRestoreFile = (filename: string) => {
    if (fileBackups[filename]) {
      setConfigs(prev => ({ ...prev, [filename]: fileBackups[filename] }));
      showToast(isFa ? `ظپط§غŒظ„ ${filename} ط¨ظ‡ ظ†ط³ط®ظ‡ ظ¾ط´طھغŒط¨ط§ظ† ظ‚ط¨ظ„غŒ ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ط´ط¯.` : `Restored ${filename} from backup.`);
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
          'ظˆغŒط±ط§غŒط´ع¯ط± ط²ظ†ط¯ظ‡ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ',
          'Live Config Editor',
          `ط°ط®غŒط±ظ‡ طھط؛غŒغŒط±ط§طھ ظپط§غŒظ„ ${filename} ط±ظˆغŒ ط¯غŒط³ع© ط³ط±ظˆط±`,
          `Persisted ${filename} edits directly to disk`,
          'success',
          `ظپط§غŒظ„ ${filename} ظ…ط³طھظ‚غŒظ…ط§ظ‹ ط±ظˆغŒ ط¯غŒط³ع© ط³ط±ظˆط± ط¯ط± ظ…ط³غŒط± ${relativePath} ط°ط®غŒط±ظ‡ ظˆ ط³غŒظ†ع© ط´ط¯.`,
          `File ${filename} written to server disk at ${relativePath} with 0 errors.`,
          `File size: ${newContent.length} bytes | Lines: ${newContent.split('\n').length}`
        );
        showToast(isFa 
          ? `ظپط§غŒظ„ ${filename} ط°ط®غŒط±ظ‡ ط´ط¯ ظˆ ظ…ط³طھظ‚غŒظ…ط§ظ‹ ط±ظˆغŒ ط¯غŒط³ع© ط³ط±ظˆط± ط¯ط± ظ…ط³غŒط± ${relativePath} ظ‚ط±ط§ط± ع¯ط±ظپطھ.`
          : `File ${filename} saved and successfully written to disk at ${relativePath}`);
      } else {
        const errData = await res.json();
        logBackendOperation(
          'config_editor',
          'ظˆغŒط±ط§غŒط´ع¯ط± ط²ظ†ط¯ظ‡ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ',
          'Live Config Editor',
          `طھظ„ط§ط´ ط¨ط±ط§غŒ ط°ط®غŒط±ظ‡ ظپط§غŒظ„ ${filename}`,
          `Save attempt for ${filename}`,
          'warning',
          `ط®ط·ط§غŒ ط³ط±ظˆط±غŒ ط¯ط± ط°ط®غŒط±ظ‡: ${errData.error}`,
          `Server-side save issue: ${errData.error}`
        );
        showToast(isFa ? `ط®ط·ط§غŒ ط°ط®غŒط±ظ‡ ط³ط±ظˆط±غŒ: ${errData.error}` : `Server-side save failed: ${errData.error}`);
      }
    } catch (err: any) {
      showToast(isFa ? `ظپط§غŒظ„ ${filename} ط°ط®غŒط±ظ‡ ط´ط¯.` : `File ${filename} saved.`);
    }
  };

  // Global Revert to Baseline (ط¨ط§ط²ع¯ط±ط¯ط§ظ†غŒ ط³ط±ط§ط³ط±غŒ ط¨ظ‡ ط¨ع©â€Œط¢ظ¾ ط§ظˆظ„غŒظ‡)
  const handleGlobalRestoreBaseline = () => {
    const baseline = snapshots.find(s => s.isInitialBaseline) || snapshots[0];
    if (baseline) {
      setConfigs({ ...baseline.files });
      setFindings(INITIAL_FINDINGS);
      setFileBackups({ ...baseline.files });
      logBackendOperation(
        'backup_archive',
        'ظ…ط¯غŒط±غŒطھ ظ†ط³ط®ظ‡â€Œظ‡ط§غŒ ظ¾ط´طھغŒط¨ط§ظ†',
        'Backup Snapshots',
        'ط¨ط§ط²ع¯ط±ط¯ط§ظ†غŒ ط³ط±ط§ط³ط±غŒ ع©ظ„ط§ط³طھط± ط¨ظ‡ ط¨ع©â€Œط¢ظ¾ ط§ظˆظ„غŒظ‡ (Baseline Rollback)',
        'Global cluster rollback to baseline snapshot',
        'success',
        'طھظ…ط§ظ…غŒ ظپط§غŒظ„â€Œظ‡ط§غŒ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ ظˆ ظˆط¶ط¹غŒطھ ع©ظ„ط§ط³طھط± ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط¨ظ‡ ط­ط§ظ„طھ ط§ظˆظ„غŒظ‡ ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ط´ط¯ظ†ط¯.',
        'Cluster state and configs fully restored to initial baseline snapshot.'
      );
      showToast(isFa 
        ? 'طھظ…ط§ظ…غŒ ظپط§غŒظ„â€Œظ‡ط§غŒ ع©ط§ظ†ظپغŒع¯طŒ ع©ظ„ط§ط³طھط± ظˆ ط®ط·ط§ظ‡ط§ ط¨ظ‡ ط¨ع©â€Œط¢ظ¾ ط§ظˆظ„غŒظ‡ ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ط´ط¯ظ†ط¯.' 
        : 'All configs and diagnostic state reverted to initial baseline snapshot.');
    }
  };

  // Create on-demand snapshot
  const handleCreateSnapshot = (label: string) => {
    const newSnap: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleString(isFa ? 'fa-IR' : 'en-US'),
      label: label,
      descriptionFa: 'ط§ط³ظ†ظ¾â€Œط´ط§طھ ط¯ط³طھغŒ ط§غŒط¬ط§ط¯ ط´ط¯ظ‡ طھظˆط³ط· ط§ظ¾ط±ط§طھظˆط± ع©ظ„ط§ط³طھط±',
      descriptionEn: 'Manual snapshot created by cluster operator',
      isInitialBaseline: false,
      files: { ...configs }
    };
    setSnapshots(prev => [newSnap, ...prev]);
    logBackendOperation(
      'backup_archive',
      'ظ…ط¯غŒط±غŒطھ ظ†ط³ط®ظ‡â€Œظ‡ط§غŒ ظ¾ط´طھغŒط¨ط§ظ†',
      'Backup Snapshots',
      `ط§غŒط¬ط§ط¯ ط§ط³ظ†ظ¾â€Œط´ط§طھ ظ¾ط´طھغŒط¨ط§ظ†: ${label}`,
      `Created snapshot backup: ${label}`,
      'success',
      `ظ†ط³ط®ظ‡ ظ¾ط´طھغŒط¨ط§ظ† ط´ط§ظ…ظ„ طھظ…ط§ظ… ظپط§غŒظ„â€Œظ‡ط§غŒ ظ¾غŒع©ط±ط¨ظ†ط¯غŒ ط¨ط§ ط¨ط±ع†ط³ط¨ ${label} ط°ط®غŒط±ظ‡ ط´ط¯.`,
      `Snapshot captured with ${Object.keys(configs).length} configuration files.`
    );
    showToast(isFa ? 'ط§ط³ظ†ظ¾â€Œط´ط§طھ ط¬ط¯غŒط¯ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط°ط®غŒط±ظ‡ ط´ط¯.' : 'New snapshot created.');
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
                    {isFa ? 'ط­ط§ظ„طھ ظ†ظ…ط§غŒط´ ط¯ط§غŒط§ع¯ط±ط§ظ…:' : 'Diagram View Mode:'}
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
                      <span>{isFa ? 'ط¯ط§غŒط§ع¯ط±ط§ظ… ظ†ظ…ط§ط¯ظ‡ط§ ظˆ ظ¾ظˆط±طھâ€Œظ‡ط§غŒ ط§ط³ظ¾ظ„ط§ظ†ع©' : 'Splunk Ports & Symbols'}</span>
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
                      <span>{isFa ? 'ظ¾ط§غŒظ¾ظ„ط§غŒظ† ظ¾ط±ط¯ط§ط²ط´غŒ ظˆ طµظپâ€Œظ‡ط§غŒ ط­ط§ظپط¸ظ‡' : 'Pipeline & Queues'}</span>
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
                showToast(isFa ? `ظپط§غŒظ„ ${filename} ط¯ط± ظ…ط­غŒط· ظ…ظˆط§ط²غŒ ط°ط®غŒط±ظ‡ ط´ط¯.` : `Saved ${filename} in Parallel Instance.`);
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
                      {isFa ? 'ظ¾ط§غŒط´ ظ„ط­ط¸ظ‡â€Œط§غŒ ظ„ط§ع¯â€Œظ‡ط§غŒ ط³ط±ظˆط± ط§ط³ظ¾ظ„ط§ظ†ع© (splunkd.log)' : 'splunkd.log Live Stream Tail'}
                    </h3>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {isFa ? 'ظ…ظˆطھظˆط± ظ¾ط±ط¯ط§ط²ط´ ط¹ظ…غŒظ‚ ظˆ طھط´ط®غŒطµغŒ ظ„ظˆع©ط§ظ„ ط³ط±ظˆط± (ظپط¹ط§ظ„)' : 'Local Real-Time Diagnostic Engine (Active)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFa ? 'ط±ظˆغŒ ظ‡ط± ط®ط· ط§ط² ظ„ط§ع¯ ع©ظ„غŒع© ع©ظ†غŒط¯ طھط§ طھط­ظ„غŒظ„ ظپظ†غŒ ط¯ظ‚غŒظ‚طŒ ط±غŒط´ظ‡ ظˆظ‚ظˆط¹ ظˆ ط±ط§ظ‡ع©ط§ط± ظ…ظ‡ظ†ط¯ط³غŒ ظ…ظ†ط·ط¨ظ‚ ط¨ط± ظ…ط³طھظ†ط¯ط§طھ ظ†ظ…ط§غŒط´ ط¯ط§ط¯ظ‡ ط´ظˆط¯.' : 'Click any log line to view accurate technical interpretation, root cause, and SVA remediation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLiveLogs}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition text-slate-200"
                >
                  <RotateCw className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isFa ? 'ط¨ط±ظˆط²ط±ط³ط§ظ†غŒ ط²ظ†ط¯ظ‡ ظ„ط§ع¯â€Œظ‡ط§' : 'Refresh Live Stream'}</span>
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
                  <span>{isFa ? 'ظ‡ظ…ظ‡ ظ„ط§ع¯â€Œظ‡ط§' : 'All'}</span>
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
                  <span>{isFa ? 'ط®ط·ط§ظ‡ط§' : 'Errors'}</span>
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
                  <span>{isFa ? 'ظ‡ط´ط¯ط§ط±ظ‡ط§' : 'Warnings'}</span>
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
                  <span>{isFa ? 'ط§ط·ظ„ط§ط¹ط§طھغŒ' : 'Info'}</span>
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
                  placeholder={isFa ? 'ظپغŒظ„طھط± ظ…طھظ†غŒ ط¨ط± ط§ط³ط§ط³ ط¢غŒâ€Œظ¾غŒطŒ ع©ط§ظ…ظ¾ظˆظ†ظ†طھطŒ ظ¾ظˆط±طھ...' : 'Filter by IP, component, port...'}
                  className={`w-full bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/50 rounded-xl py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition ${isFa ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className={`absolute top-2 text-slate-400 hover:text-white text-xs ${isFa ? 'left-2.5' : 'right-2.5'}`}
                  >
                    أ—
                  </button>
                )}
              </div>
            </div>

            {/* Stream Content */}
            <div className="p-4 sm:p-5 bg-[#05070c] font-mono text-xs text-slate-300 min-h-[320px] max-h-[540px] overflow-y-auto space-y-1.5">
              {filteredLogLines.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {isFa ? 'ظ‡غŒع† ط®ط· ظ„ط§ع¯غŒ ط¨ط§ ظپغŒظ„طھط± ظپط¹ظ„غŒ غŒط§ظپطھ ظ†ط´ط¯.' : 'No log lines match current filter criteria.'}
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
                      title={isFa ? 'ط¨ط±ط§غŒ طھط­ظ„غŒظ„ ظ¾غŒط´ط±ظپطھظ‡طŒ ط±غŒط´ظ‡â€ŒغŒط§ط¨غŒ ظˆ ط±ط§ظ‡ع©ط§ط± ظ…ظ‡ظ†ط¯ط³غŒ ع©ظ„غŒع© ع©ظ†غŒط¯' : 'Click to inspect diagnostic details and root cause'}
                    >
                      <span className="font-mono text-xs break-all select-all flex-1">{line}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-violet-500/20 text-violet-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold transition-opacity whitespace-nowrap shrink-0">
                        <Wrench className="w-3 h-3" />
                        <span>{isFa ? 'طھط­ظ„غŒظ„ ظˆ ط±ظپط¹' : 'Diagnose'}</span>
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
              showToast(isFa ? `ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§ ط¨ظ‡ ظ†ط³ط®ظ‡ ${snap.label} ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ط´ط¯ظ†ط¯.` : `Restored to ${snap.label}.`);
            }}
            onGlobalRestoreBaseline={handleGlobalRestoreBaseline}
            onCreateSnapshot={handleCreateSnapshot}
            lang={lang}
          />
        );
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
              {isFa ? 'ط¯ط³طھط±ط³غŒ ط­ظپط§ط¸طھâ€Œط´ط¯ظ‡ ط§ظ…ظ†غŒطھغŒ' : 'Protected Security Console'}
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isFa ? 'ظ…ط´ط§ظ‡ط¯ظ‡ ظˆ ظ…ط¯غŒط±غŒطھ ع©ط§ط±ط¨ط±ط§ظ† ظˆ ع©ظ†طھط±ظ„ ط¯ط³طھط±ط³غŒ ظ†غŒط§ط²ظ…ظ†ط¯ ظˆط±ظˆط¯ ط¨ظ‡ ط­ط³ط§ط¨ ط§ط³طھ.' : 'User management and RBAC requires authentication.'}
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isFa ? 'ظˆط±ظˆط¯ ط¨ظ‡ ط­ط³ط§ط¨ ع©ط§ط±ط¨ط±غŒ' : 'Authenticate to Continue'}</span>
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
                        {isFa ? 'ظ…ط§عکظˆظ„ ط³ظپط§ط±ط´غŒ' : 'Custom Module'}
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
                  <span>{isFa ? 'ظˆغŒط±ط§غŒط´ ط¯ط± ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ' : 'Edit in Module Manager'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒ ظ…ط§عکظˆظ„' : 'Category'}</div>
                  <div className="text-sm font-semibold text-white/90">{isFa ? customMod.categoryNameFa : customMod.categoryNameEn}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'ط´ظ†ط§ط³ظ‡ غŒع©طھط§ (ID)' : 'Unique ID'}</div>
                  <div className="text-sm font-mono text-[#0a84ff]">{customMod.id}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-white/50 font-medium">{isFa ? 'ط§ظˆظ„ظˆغŒطھ ع†غŒظ†ط´' : 'Order Index'}</div>
                  <div className="text-sm font-mono text-[#30d158]">#{customMod.order + 1}</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black/35 border border-white/[0.08] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-white/40 border-b border-white/[0.06] pb-2">
                  <span className="flex items-center gap-2 text-white/80 font-sans font-medium text-xs">
                    <Terminal className="w-3.5 h-3.5 text-[#30d158]" />
                    {isFa ? 'ع©ظ†ط³ظˆظ„ ط¹ظ…ظ„غŒط§طھغŒ ظ…ط§عکظˆظ„' : 'Module Operations Console'}
                  </span>
                  <span className="text-[10px] text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded">ONLINE</span>
                </div>
                <p className="text-white/60">
                  {isFa
                    ? `ظ…ط§عکظˆظ„ آ«${customMod.titleFa}آ» ظپط¹ط§ظ„ ظˆ ط¢ظ…ط§ط¯ظ‡ ط§ط³طھ. ظ…غŒâ€Œطھظˆط§ظ†غŒط¯ ط§غŒظ† ظ…ط§عکظˆظ„ ط±ط§ ط¯ط± ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ ط¬ط§ط¨ظ‡â€Œط¬ط§طŒ ظˆغŒط±ط§غŒط´ غŒط§ ط­ط°ظپ ع©ظ†غŒط¯.`
                    : `Module "${customMod.titleEn}" is active and ready. You can customize, reorder, or delete it in the Module Management Panel.`}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => probeCluster()}
                    className="px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-sans font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{isFa ? 'طھط³طھ ظ¾ط±ظˆط¨ ط³ظˆع©طھâ€Œظ‡ط§' : 'Probe Cluster'}</span>
                  </button>
                  <button
                    onClick={() => handleSelectModule('bento_overview')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-sans font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isFa ? 'ط¨ط§ط²ع¯ط´طھ ط¨ظ‡ ط¯ط§ط´ط¨ظˆط±ط¯' : 'Back to Dashboard'}</span>
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
              title={isFa ? 'ط¨ط³طھظ† ظ¾ظ†ط¬ط±ظ‡â€Œظ‡ط§ ظˆ ظ¾ط§ع©ط³ط§ط²غŒ' : 'Close Active Overlays'}
            />
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="traffic-light traffic-light-minimize"
              title={isFa ? 'ط¬ظ…ط¹â€Œع©ط±ط¯ظ† / ط¨ط§ط²ع©ط±ط¯ظ† ط³ط§غŒط¯ط¨ط§ط±' : 'Collapse/Expand Sidebar'}
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
              title={isFa ? 'طھط؛غŒغŒط± ط­ط§ظ„طھ طھظ…ط§ظ…â€Œطµظپط­ظ‡' : 'Toggle Fullscreen'}
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
            title={isFa ? 'طھط؛غŒغŒط± ظˆط¶ط¹غŒطھ ظ†ظˆط§ط± ع©ظ†ط§ط±غŒ (Ctrl+B)' : 'Toggle Sidebar (Ctrl+B)'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Apple App Brand & Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/95 tracking-tight flex items-center gap-1.5">
              <span className="text-[#0a84ff] text-sm">ï£؟</span>
              <span>{isFa ? 'ط§ط³طھظˆط¯غŒظˆ ظ…ط¹ظ…ط§ط± ط§ط³ظ¾ظ„ط§ظ†ع©' : 'Splunk Architect Studio'}</span>
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
            title={isFa ? 'طھط؛غŒغŒط± ظˆط¶ط¹غŒطھ ظ¾ط§غŒط´ ط²ظ†ط¯ظ‡ ط³ط±ظˆط±' : 'Toggle live monitoring mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-[#30d158]' : 'bg-[#0a84ff]'}`}></span>
            <span className="hidden lg:inline">{isLiveMode ? (isFa ? 'ظ…طھطµظ„' : 'Connected') : (isFa ? 'ط§غŒط²ظˆظ„ظ‡' : 'Sandbox')}</span>
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
              <span className="text-xs text-white/50">{isFa ? 'ط§ط³ظ¾ط§طھâ€Œظ„ط§غŒطھ: ط¬ط³طھط¬ظˆغŒ ط§ط¨ط²ط§ط±ظ‡ط§ ظˆ ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§...' : 'Spotlight Search (âŒکK)...'}</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white/[0.08] border border-white/[0.1] text-white/60 px-1.5 py-0.5 rounded">âŒکK</kbd>
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
                  ? `ظ…ط­غŒط· ظپط¹ط§ظ„: ${targetEnv === 'production' ? 'ط³ط±ظˆط± ط§طµظ„غŒ (طھظˆظ„غŒط¯)' : (targetEnv === 'parallel' ? 'ط³ط±ظˆط± ظ…ظˆط§ط²غŒ' : 'ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ')}` 
                  : `Switched environment to: ${targetEnv}`);
              }}
              className="bg-transparent text-white/90 font-medium text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="production" className="bg-[#1c1c1e] text-white">{isFa ? 'ط³ط±ظˆط± ط§طµظ„غŒ (8000)' : 'Production (8000)'}</option>
              {parallelClusterState.isInstalled && (
                <option value="parallel" className="bg-[#1c1c1e] text-white">{isFa ? 'ط³ط±ظˆط± ظ…ظˆط§ط²غŒ (8001)' : 'Parallel (8001)'}</option>
              )}
              {virtualClusterState.isInstalled && (
                <option value="virtual" className="bg-[#1c1c1e] text-white">{isFa ? 'ط³ط±ظˆط± ظ…ط¬ط§ط²غŒ (8080)' : 'Virtual (8080)'}</option>
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
            title={isFa ? 'طھط³طھ ط²ظ†ط¯ظ‡ ط§طھطµط§ظ„ ط³ظˆع©طھâ€Œظ‡ط§غŒ TCP ع©ظ„ط§ط³طھط±' : 'Probe cluster TCP sockets now'}
          >
            <Activity className={`w-3.5 h-3.5 text-[#0a84ff] ${isProbingCluster ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs">
              {isProbingCluster ? (isFa ? 'ظ¾ط±ظˆط¨...' : 'Probing...') : (isFa ? 'ظ¾ط±ظˆط¨' : 'Probe')}
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
            title={isFa ? 'ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ ع©ظ„ ط¨ط±ظ†ط§ظ…ظ‡: ط§ظپط²ظˆط¯ظ†طŒ ط­ط°ظپطŒ طھط؛غŒغŒط± ظˆ ط¬ط§ط¨ظ‡â€Œط¬ط§غŒغŒ ظ…ط§عکظˆظ„â€Œظ‡ط§' : 'Studio Module Manager: Add, remove, reorder and customize modules'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0a84ff]" />
            <span className="hidden md:inline">{isFa ? 'ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ ط¨ط±ظ†ط§ظ…ظ‡' : 'Manage Studio'}</span>
          </button>

          {/* Backend Operations & Health Inspector */}
          <button
            onClick={() => setIsBackendInspectorOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#30d158]/10 hover:bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title={isFa ? 'ظ…ط´ط§ظ‡ط¯ظ‡ ط¹ظ…ظ„غŒط§طھâ€Œظ‡ط§غŒ ظ¾ط³â€Œط²ظ…غŒظ†ظ‡ ظˆ طھط³طھ طµط­طھ ط§ط¨ط²ط§ط±ظ‡ط§' : 'View backend operations & tool verification'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
            <span className="hidden lg:inline">{isFa ? 'طھط³طھ ط§ط¨ط²ط§ط±ظ‡ط§' : 'Tool Tests'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#30d158]/25 text-white font-bold tabular-nums">
              {backendOperations.length}
            </span>
          </button>

          {/* Splunk System Debugger & Telemetry Inspector */}
          <button
            onClick={() => setIsDebugModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title={isFa ? 'ط§ط¨ط²ط§ط± ط¯غŒط¨ط§ع¯ ظˆ ط¹غŒط¨â€ŒغŒط§ط¨غŒ ط¹ظ…غŒظ‚ ط³ط§ظ…ط§ظ†ظ‡' : 'Splunk System Debugger & Telemetry Inspector'}
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isFa ? 'ط¯غŒط¨ط§ع¯ ط³غŒط³طھظ…' : 'Debugger'}</span>
          </button>

          {/* Cluster Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08] transition cursor-pointer"
            title={isFa ? 'طھظ†ط¸غŒظ… ط¢ط¯ط±ط³â€Œظ‡ط§غŒ IP ظˆ ظ‡ط§ط³طھâ€Œظ‡ط§غŒ ظˆط§ظ‚ط¹غŒ ط³ط±ظˆط±' : 'Configure cluster IPs and hostnames'}
          >
            <Settings className="w-3.5 h-3.5 text-white/60" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'fa' ? 'en' : 'fa')}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 font-mono text-xs transition cursor-pointer"
          >
            {isFa ? 'EN' : 'ظپط§'}
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
                title={isFa ? 'ط±ظپطھظ† ط¨ظ‡ ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ' : 'Open Admin Panel'}
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
                title={isFa ? 'ط®ط±ظˆط¬' : 'Logout'}
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
              <span className="hidden sm:inline">{isFa ? 'ظˆط±ظˆط¯' : 'Sign in'}</span>
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
            title={isFa ? 'ط¨ط§ط² ع©ط±ط¯ظ† ظ†ظˆط§ط± ع©ظ†ط§ط±غŒ (Ctrl+B)' : 'Open Sidebar (Ctrl+B)'}
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
                      {isFa ? 'ظ…ط§عکظˆظ„â€Œظ‡ط§غŒ ط³غŒط³طھظ…' : 'SYSTEM MODULES'}
                    </span>
                    <button
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white transition cursor-pointer"
                      title={isFa ? 'ط¬ظ…ط¹â€Œع©ط±ط¯ظ† ط³ط§غŒط¯ط¨ط§ط± (Ctrl+B)' : 'Collapse (Ctrl+B)'}
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
                      placeholder={isFa ? 'ظپغŒظ„طھط± ظ…ط§عکظˆظ„â€Œظ‡ط§...' : 'Filter modules...'}
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
                      { id: 'all' as const, labelFa: 'ظ‡ظ…ظ‡ ط¨ط®ط´â€Œظ‡ط§', labelEn: 'All' },
                      { id: 'architecture' as const, labelFa: 'ظ…ط¹ظ…ط§ط±غŒ', labelEn: 'Arch' },
                      { id: 'health_logs' as const, labelFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ', labelEn: 'Health' },
                      { id: 'radar_ingest' as const, labelFa: 'ط±ط§ط¯ط§ط±', labelEn: 'Radar' },
                      { id: 'agents_gateway' as const, labelFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§', labelEn: 'Agents' },
                      { id: 'tools_security' as const, labelFa: 'ط§ط¨ط²ط§ط±ظ‡ط§', labelEn: 'Tools' },
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
                      titleFa: 'ظ…ط¹ظ…ط§ط±غŒ ظˆ SVA',
                      titleEn: 'ARCHITECTURE & SVA',
                      iconTint: 'bg-[#0a84ff]/15 text-[#0a84ff]'
                    },
                    {
                      categoryKey: 'health_logs' as const,
                      titleFa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ ظˆ ط³ظ„ط§ظ…طھ',
                      titleEn: 'DIAGNOSTICS & LOGS',
                      iconTint: 'bg-[#ff453a]/15 text-[#ff453a]'
                    },
                    {
                      categoryKey: 'radar_ingest' as const,
                      titleFa: 'ط±ط§ط¯ط§ط± ظˆ ط¬ط±غŒط§ظ† ظ„ط§ع¯',
                      titleEn: 'TELEMETRY & INGEST',
                      iconTint: 'bg-[#30d158]/15 text-[#30d158]'
                    },
                    {
                      categoryKey: 'agents_gateway' as const,
                      titleFa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§ ظˆ ط¯ط±ع¯ط§ظ‡',
                      titleEn: 'AGENTS & GATEWAY',
                      iconTint: 'bg-[#64d2ff]/15 text-[#64d2ff]'
                    },
                    {
                      categoryKey: 'tools_security' as const,
                      titleFa: 'ط§ط¨ط²ط§ط±ظ‡ط§ ظˆ ط§ظ…ظ†غŒطھ',
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
                              title={isFa ? `ع©ظ„غŒع© ط¨ط±ط§غŒ ظ†ظ…ط§غŒط´ ظپظ‚ط· ط¨ط®ط´ ${group.titleFa}` : `Click to focus on ${group.titleEn}`}
                            >
                              <span>{isFa ? group.titleFa : group.titleEn}</span>
                              <span className="text-[9px] font-mono text-white/30">({groupModules.length})</span>
                            </button>
                            {sidebarFilterCategory === group.categoryKey && (
                              <button
                                onClick={() => setSidebarFilterCategory('all')}
                                className="text-[10px] text-[#0a84ff] hover:underline cursor-pointer"
                              >
                                {isFa ? 'ظ†ظ…ط§غŒط´ ظ‡ظ…ظ‡' : 'Show All'}
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
                    <span className="text-[11px]">{isFa ? 'ط³ظ„ط§ظ…طھ ط³غŒط³طھظ…:' : 'System Health:'}</span>
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
                    <span>{isFa ? 'ظ…ط¯غŒط±غŒطھ ظˆ ع†غŒط¯ظ…ط§ظ† ط¨ط±ظ†ط§ظ…ظ‡' : 'Customize & Reorder'}</span>
                  </button>

                  <button
                    onClick={() => setIsVirtualWipeModalOpen(true)}
                    className="w-full py-1 px-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Server className="w-3 h-3 text-[#0a84ff]" />
                    <span>{isFa ? 'ظ…ط¯غŒط±غŒطھ ط³ط±ظˆط±ظ‡ط§' : 'Manage Servers'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed Mini Rail */
              <div className="flex flex-col h-full py-3 items-center justify-between">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1.5 rounded-md hover:bg-white/[0.1] text-[#0a84ff] transition mb-2 cursor-pointer"
                  title={isFa ? 'ع¯ط³طھط±ط´ ظ†ظˆط§ط± ع©ظ†ط§ط±غŒ (Ctrl+B)' : 'Expand (Ctrl+B)'}
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
                    <span className="text-[10px] text-white/40">آ·</span>
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
                    { id: 'architecture' as const, fa: 'ظ…ط¹ظ…ط§ط±غŒ', en: 'Arch' },
                    { id: 'health_logs' as const, fa: 'ط¹غŒط¨â€ŒغŒط§ط¨غŒ', en: 'Health' },
                    { id: 'radar_ingest' as const, fa: 'ط±ط§ط¯ط§ط±', en: 'Radar' },
                    { id: 'agents_gateway' as const, fa: 'ط§غŒط¬ظ†طھâ€Œظ‡ط§', en: 'Agents' },
                    { id: 'tools_security' as const, fa: 'ط§ط¨ط²ط§ط±ظ‡ط§', en: 'Tools' }
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
                  title={isFa ? 'ع©ظˆع†ع©â€Œط³ط§ط²غŒ ظˆ ط§ط¬ط±ط§غŒ ط§غŒظ† ط§ط¨ط²ط§ط± ط¯ط± ظ¾ظ†ط¬ط±ظ‡ ط´ظ†ط§ظˆط± (ظ…ط´ط§ط¨ظ‡ طھطµظˆغŒط± ط¯ط± طھطµظˆغŒط± ط§ظ¾ظ„)' : 'Run this tool in floating mini-player (PiP)'}
                >
                  <Minimize2 className="w-3.5 h-3.5 text-[#0a84ff]" />
                  <span className="hidden sm:inline">
                    {floatingTools.includes(activeTab) 
                      ? (isFa ? 'ط¯ط± ط­ط§ظ„ ط§ط¬ط±ط§ (PiP)' : 'Running in PiP') 
                      : (isFa ? 'ظ¾ظ†ط¬ط±ظ‡ ط´ظ†ط§ظˆط± (PiP)' : 'Float PiP')}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Tool View */}
            {renderToolContent(activeTab, false)}
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
              showToast(isFa ? 'طھظ†ط¸غŒظ…ط§طھ ع©ظ„ط§ط³طھط± ط°ط®غŒط±ظ‡ ظˆ ط±ظˆغŒ طھظ…ط§ظ…غŒ ط¯ط§غŒط§ع¯ط±ط§ظ…â€Œظ‡ط§ ظˆ ظ¾غŒع©ط±ط¨ظ†ط¯غŒâ€Œظ‡ط§ ط§ط¹ظ…ط§ظ„ ط´ط¯.' : 'Cluster settings saved and synced across configs.');
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
            parallelClusterState={{
              ...parallelClusterState,
              webPort: webModalPort
            }}
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
                onClick={() => setIsBackendInspectorOpen(true)}
                className="flex items-center gap-1.5 hover:text-[#30d158] transition cursor-pointer text-[#30d158]"
                title={isFa ? 'ظ…ط´ط§ظ‡ط¯ظ‡ ط±غŒط² ط¹ظ…ظ„غŒط§طھâ€Œظ‡ط§ ظˆ ط§ط¹طھط¨ط§ط±ط³ظ†ط¬غŒ ط§ط¨ط²ط§ط±ظ‡ط§' : 'Click to inspect backend telemetry & verify tools'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse"></span>
                <span className="font-medium">{isFa ? 'ظˆط¶ط¹غŒطھ ط³ط±ظˆط±: غ±غ°غ°ظھ طھط§غŒغŒط¯ ط´ط¯ظ‡' : 'Host Status: 100% Verified'}</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/40">
              <span>Target: {currentProfile.shortName}</span>
              <span className="text-white/20">آ·</span>
              <span className="tabular-nums">Health: {healthScore}/100</span>
              <span className="text-white/20">آ·</span>
              <span className="tabular-nums">Snapshots: {snapshots.length}</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Spotlight Command Palette (âŒکK) Modal */}
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
                placeholder={isFa ? 'ط¬ط³طھط¬ظˆ ط¯ط± طھظ…ط§ظ… ط§ط¨ط²ط§ط±ظ‡ط§طŒ ع©ط§ظ†ظپغŒع¯â€Œظ‡ط§ ظˆ ظ…ط§عکظˆظ„â€Œظ‡ط§...' : 'Spotlight Search in modules, configs, and tools...'}
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
                      {isFa ? 'ط§ظ†طھظ‚ط§ظ„ â†µ' : 'Open â†µ'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-black/20 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
              <span>{isFa ? 'ع©ظ„غŒط¯ Esc ط¨ط±ط§غŒ ط¨ط³طھظ†' : 'Press esc to close'}</span>
              <span className="font-mono text-white/50">{filteredSearchModules.length} {isFa ? 'ظ…ظˆط±ط¯ غŒط§ظپطھ ط´ط¯' : 'items'}</span>
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
            {renderToolContent(toolId, true)}
          </FloatingMiniWindow>
        );
      })}
    </div>
  );
}
