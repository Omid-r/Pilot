import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  FileText, 
  Server, 
  Cpu, 
  Calendar, 
  Search, 
  UserCheck, 
  UserX,
  Sparkles,
  Download,
  Terminal,
  Activity,
  Sliders,
  Layers,
  Wifi,
  FileCode,
  Package,
  BookOpen,
  Wrench,
  Archive,
  CheckSquare,
  Square,
  Eye,
  RotateCcw,
  X
} from 'lucide-react';
import { 
  UserAccount, 
  UserRole, 
  UserPermissions, 
  PanelPermissions, 
  FeaturePermissions, 
  getDefaultPermissionsForRole, 
  AuditLogEntry, 
  LicenseInfo, 
  SystemSecurityPolicy 
} from '../types';

export const PANEL_METADATA: Record<keyof PanelPermissions, { titleFa: string; titleEn: string; descFa: string; descEn: string; icon: any }> = {
  topology: {
    titleFa: 'دایاگرام معماری و جریان داده',
    titleEn: 'Cluster Topology & Data Flow',
    descFa: 'مشاهده گراف معماری، نودهای کلاستر و جریان دیتای ایندکسرها و فورواردرها',
    descEn: 'View architectural diagram, cluster peers and log ingestion pipelines',
    icon: Layers
  },
  network_sources: {
    titleFa: 'منابع ترافیک و فایروال‌ها',
    titleEn: 'Source IPs & Ingestion Map',
    descFa: 'مشاهده مشخصات سورس‌ها، لایه‌های فایروال، لودبالانسرها و ایندکسرها',
    descEn: 'Source endpoints, perimeter firewalls and ingestion load balancers',
    icon: Wifi
  },
  health_audit: {
    titleFa: 'ممیزی سلامت و ارزیابی خطاها',
    titleEn: 'Health Audit & Findings',
    descFa: 'تحلیل خطاهای btool، هشدارهای سرور، دیسک و امتیاز سلامت کلاستر',
    descEn: 'Diagnostic btool validation, disk thresholds, and health score',
    icon: Activity
  },
  config_editor: {
    titleFa: 'ویرایشگر فایل‌های کانفیگ (.conf)',
    titleEn: 'Live Config Editor',
    descFa: 'مشاهده و بازنویسی فایل‌های inputs.conf, outputs.conf, server.conf',
    descEn: 'Inspect and edit live stanza settings on local disk',
    icon: FileCode
  },
  package_center: {
    titleFa: 'مرکز دانلود و دیپلوی پکیج‌ها',
    titleEn: 'Package & Deploy Center',
    descFa: 'کاتالوگ اپلیکیشن‌های اسپلانک، اسکریپت‌ها و دستورات نصب RHEL',
    descEn: 'Splunk app bundles, deployment apps, and enterprise scripts',
    icon: Package
  },
  doc_reference: {
    titleFa: 'مستندات و هندبوک معماری',
    titleEn: 'Splunk Docs Knowledge Base',
    descFa: 'دستورالعمل‌های استاندارد رفع عیب و مرجع خطاهای اسپلانک',
    descEn: 'Standard architecture references and diagnostic command handbooks',
    icon: BookOpen
  },
  live_logs: {
    titleFa: 'مانیتورینگ زنده لاگ‌ها (splunkd.log)',
    titleEn: 'Live splunkd.log Tails',
    descFa: 'مشاهده استریم بلادرنگ آخرین خطوط لاگ سیستم و فیلتر ارورها',
    descEn: 'Real-time daemon log stream and error severity monitoring',
    icon: Terminal
  },
  network_toolbox: {
    titleFa: 'جعبه ابزار شبکه و پورت‌ها',
    titleEn: 'Network Toolbox & Ports',
    descFa: 'تست سوکت پورت‌ها، پینگ، تریس‌روت و جدول اتصالات TCP',
    descEn: 'Socket probe, MTU test, ping latency, and conntrack table',
    icon: Wrench
  },
  backup_archive: {
    titleFa: 'مدیریت و آرشیو بک‌آپ‌ها',
    titleEn: 'Backups & Snapshots Archive',
    descFa: 'تهیه، بازگردانی و دانلود اسنپ‌شات‌های پشتیبان tar.gz از تنظیمات',
    descEn: 'Create, restore and download tar.gz configuration snapshots',
    icon: Archive
  },
  admin_security: {
    titleFa: 'پنل مدیریت، امنیت و لایسنس',
    titleEn: 'Admin, Security & Licensing',
    descFa: 'مدیریت کاربران، ماتریس دسترسی‌ها، لاگ‌های امنیتی و لایسنس تجاری',
    descEn: 'User administration, permission matrix, audit logs & licensing',
    icon: Shield
  }
};

export const FEATURE_METADATA: Record<keyof FeaturePermissions, { titleFa: string; titleEn: string; descFa: string; descEn: string; danger?: boolean; icon: any }> = {
  run_remediation: {
    titleFa: 'اجرای اسکریپت‌های اصلاح خودکار (Fix HF / Indexer)',
    titleEn: 'Run Automated Remediation Scripts',
    descFa: 'امکان اجرای اسکریپت‌های سیستمی تصحیح خودکار تنظیمات SSL و فورواردینگ با دسترسی سیستمی',
    descEn: 'Execute automated cluster remediation shell scripts with root permissions',
    danger: true,
    icon: Wrench
  },
  restart_splunk: {
    titleFa: 'کنترل و راه‌اندازی مجدد سرویس اسپلانک',
    titleEn: 'Control & Restart Splunk Service',
    descFa: 'ارسال فرمان‌های ریستارت، متوقف‌سازی و استارت مجدد پروسس‌های splunkd در سرور',
    descEn: 'Send start, stop, restart commands to systemd/splunk binaries',
    danger: true,
    icon: Terminal
  },
  edit_configs: {
    titleFa: 'ذخیره و بازنویسی فایل‌های کانفیگ دیسک',
    titleEn: 'Save & Write Configurations to Disk',
    descFa: 'امکان ذخیره مستقیم فایل‌های etc/system/local روی دیسک سیستم‌عامل سرور',
    descEn: 'Write and overwrite configuration files directly to the server filesystem',
    danger: true,
    icon: FileCode
  },
  probe_network: {
    titleFa: 'اجرای تست‌های پروب شبکه، پینگ و تریس‌روت',
    titleEn: 'Execute Network Diagnostics & Probes',
    descFa: 'ارسال بسته‌های پروب سوکت TCP، پینگ پکت‌ها و تریس‌روت به نودهای شبکه',
    descEn: 'Issue TCP SYN probes, ICMP ping packets, and traceroute hops',
    icon: Wifi
  },
  export_reports: {
    titleFa: 'صدور و دانلود گزارش‌های ممیزی PDF / HTML / JSON',
    titleEn: 'Export Audit Reports & Snapshots',
    descFa: 'دانلود خروجی جامع گزارش وضعیت کلاستر و دانلود فایل‌های آرشیو بک‌آپ',
    descEn: 'Download full diagnostic audit reports and configuration archives',
    icon: Download
  },
  manage_users: {
    titleFa: 'مدیریت کاربران، نقش‌ها و زمان انقضا',
    titleEn: 'Manage User Accounts & Access',
    descFa: 'افزودن کاربر جدید، تغییر کلمه عبور، مسدودسازی و تعیین سطوح دسترسی',
    descEn: 'Create, update, suspend users and grant granular permissions',
    danger: true,
    icon: Users
  },
  manage_license: {
    titleFa: 'مدیریت و صدور لایسنس تجاری',
    titleEn: 'Commercial License & Key Generator',
    descFa: 'فعال‌سازی لایسنس روی سرور و تولید کلیدهای تجاری اختصاصی نود برای خریداران',
    descEn: 'Activate enterprise licenses and generate node-locked commercial keys',
    danger: true,
    icon: Key
  }
};

interface AdminSecurityPanelProps {
  currentUser: UserAccount;
  authToken: string;
  lang: 'fa' | 'en';
  onUserUpdated?: () => void;
}

export const AdminSecurityPanel: React.FC<AdminSecurityPanelProps> = ({
  currentUser,
  authToken,
  lang,
  onUserUpdated
}) => {
  const isFa = lang === 'fa';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'license' | 'audit' | 'hardening'>('users');

  // Users State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Add/Edit User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form fields for Add/Edit User
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('operator');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(getDefaultPermissionsForRole('operator'));
  const [modalTab, setModalTab] = useState<'general' | 'permissions'>('general');
  const [permSubTab, setPermSubTab] = useState<'panels' | 'features'>('panels');
  const [selectedUserForPermsView, setSelectedUserForPermsView] = useState<UserAccount | null>(null);
  const [formIsNeverExpires, setFormIsNeverExpires] = useState(false);
  const [formExpiryMode, setFormExpiryMode] = useState<'relative' | 'exact'>('relative');
  const [formExpiryMonths, setFormExpiryMonths] = useState<number>(1);
  const [formExpiryDays, setFormExpiryDays] = useState<number>(0);
  const [formExpiryHours, setFormExpiryHours] = useState<number>(0);
  const [formExpiryExactDateTime, setFormExpiryExactDateTime] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Manual Extend Modal for a specific user
  const [extendingUser, setExtendingUser] = useState<UserAccount | null>(null);
  const [extendMode, setExtendMode] = useState<'relative' | 'exact'>('relative');
  const [extendMonths, setExtendMonths] = useState<number>(1);
  const [extendDays, setExtendDays] = useState<number>(0);
  const [extendHours, setExtendHours] = useState<number>(0);
  const [extendExactDateTime, setExtendExactDateTime] = useState<string>('');
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  // Real-time expiry state for auto-lock
  const [isCurrentUserExpired, setIsCurrentUserExpired] = useState(false);

  useEffect(() => {
    const checkExpiry = () => {
      if (currentUser && !currentUser.isNeverExpires && currentUser.expiresAt) {
        const expTime = new Date(currentUser.expiresAt).getTime();
        if (Date.now() >= expTime) {
          setIsCurrentUserExpired(true);
        } else {
          setIsCurrentUserExpired(false);
        }
      } else {
        setIsCurrentUserExpired(false);
      }
    };
    checkExpiry();
    const timer = setInterval(checkExpiry, 3000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // License State
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [hardwareId, setHardwareId] = useState<string>('');
  const [machineInfo, setMachineInfo] = useState<any>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseActivating, setLicenseActivating] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Seller License Key Generator State (For the software vendor to sell to clients)
  const [genTargetHwId, setGenTargetHwId] = useState('');
  const [genCompanyName, setGenCompanyName] = useState('');
  const [genTier, setGenTier] = useState<'ENTERPRISE_COMMERCIAL' | 'TRIAL'>('ENTERPRISE_COMMERCIAL');
  const [genDays, setGenDays] = useState(365);
  const [genMaxNodes, setGenMaxNodes] = useState(50);
  const [generatedResultKey, setGeneratedResultKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditCategory, setAuditCategory] = useState<string>('ALL');

  // Hardening Status State
  const [securityStatus, setSecurityStatus] = useState<SystemSecurityPolicy | null>(null);

  // Feedback State
  const [copiedHwId, setCopiedHwId] = useState(false);
  const [copiedGenKey, setCopiedGenKey] = useState(false);

  // ==========================================
  // API Fetchers
  // ==========================================

  const fetchUsers = async () => {
    if (currentUser.role !== 'super_admin') return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (_) {}
    setLoadingUsers(false);
  };

  const fetchLicense = async () => {
    try {
      const res = await fetch('/api/admin/license', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLicenseInfo(data.license);
        setHardwareId(data.hardwareId);
        setMachineInfo(data.machineInfo);
        if (!genTargetHwId) setGenTargetHwId(data.hardwareId);
      }
    } catch (_) {}
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const url = auditCategory === 'ALL' 
        ? '/api/admin/audit-logs?limit=200' 
        : `/api/admin/audit-logs?category=${auditCategory}&limit=200`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch (_) {}
    setAuditLoading(false);
  };

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch('/api/admin/security-status', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSecurityStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchLicense();
    fetchSecurityStatus();
    if (currentUser.role === 'super_admin') {
      fetchUsers();
    }
  }, [authToken, currentUser.role]);

  useEffect(() => {
    if (activeSubTab === 'users' && currentUser.role === 'super_admin') {
      fetchUsers();
    } else if (activeSubTab === 'audit') {
      fetchAuditLogs();
    } else if (activeSubTab === 'hardening') {
      fetchSecurityStatus();
    } else if (activeSubTab === 'license') {
      fetchLicense();
    }
  }, [activeSubTab, auditCategory]);

  // ==========================================
  // Handlers & Permission Utilities
  // ==========================================

  const handleTogglePanel = (panelKey: keyof PanelPermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelKey]: !prev.panels[panelKey]
      }
    }));
  };

  const handleToggleFeature = (featureKey: keyof FeaturePermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  const handleSetAllPanels = (val: boolean) => {
    setFormPermissions(prev => ({
      ...prev,
      panels: {
        topology: val,
        network_sources: val,
        health_audit: val,
        config_editor: val,
        live_logs: val,
        network_toolbox: val,
        package_center: val,
        backup_archive: val,
        doc_reference: val,
        admin_security: val
      }
    }));
  };

  const handleSetAllFeatures = (val: boolean) => {
    setFormPermissions(prev => ({
      ...prev,
      features: {
        run_remediation: val,
        restart_splunk: val,
        edit_configs: val,
        probe_network: val,
        export_reports: val,
        manage_users: val,
        manage_license: val
      }
    }));
  };

  const handleResetToRoleDefaults = (role: UserRole) => {
    setFormPermissions(getDefaultPermissionsForRole(role));
  };

  const getPermissionsStats = (perms?: UserPermissions) => {
    if (!perms) return { panelCount: 10, totalPanels: 10, featCount: 7, totalFeats: 7 };
    const panelCount = Object.values(perms.panels || {}).filter(Boolean).length;
    const featCount = Object.values(perms.features || {}).filter(Boolean).length;
    return { panelCount, totalPanels: 10, featCount, totalFeats: 7 };
  };

  const handleOpenAddUser = () => {
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('operator');
    setFormPermissions(getDefaultPermissionsForRole('operator'));
    setModalTab('general');
    setPermSubTab('panels');
    setFormIsNeverExpires(false);
    setFormExpiryMode('relative');
    setFormExpiryMonths(1);
    setFormExpiryDays(0);
    setFormExpiryHours(0);
    const defDate = new Date();
    defDate.setDate(defDate.getDate() + 30);
    setFormExpiryExactDateTime(defDate.toISOString().slice(0, 16));
    setFormNotes('');
    setFormError(null);
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount, initialTab: 'general' | 'permissions' = 'general') => {
    setEditingUser(u);
    setFormFullName(u.fullName);
    setFormEmail(u.email || '');
    setFormPassword(''); // leave blank if keeping unchanged
    setFormRole(u.role);
    setFormPermissions(u.permissions || getDefaultPermissionsForRole(u.role));
    setModalTab(initialTab);
    setPermSubTab('panels');
    setFormIsNeverExpires(u.isNeverExpires);
    setFormExpiryMode('relative');
    setFormExpiryMonths(1);
    setFormExpiryDays(0);
    setFormExpiryHours(0);
    if (u.expiresAt) {
      setFormExpiryExactDateTime(new Date(u.expiresAt).toISOString().slice(0, 16));
    } else {
      const defDate = new Date();
      defDate.setDate(defDate.getDate() + 30);
      setFormExpiryExactDateTime(defDate.toISOString().slice(0, 16));
    }
    setFormNotes(u.notes || '');
    setFormError(null);
    setIsEditUserModalOpen(true);
  };

  const calculateTargetExpiryIso = (
    mode: 'relative' | 'exact',
    months: number,
    days: number,
    hours: number,
    exactStr: string,
    baseDate: Date = new Date()
  ): string => {
    if (mode === 'exact' && exactStr) {
      return new Date(exactStr).toISOString();
    }
    const target = new Date(baseDate);
    const totalHours = (Number(months || 0) * 30 * 24) + (Number(days || 0) * 24) + Number(hours || 0);
    target.setTime(target.getTime() + (totalHours * 3600 * 1000));
    return target.toISOString();
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      const expIso = calculateTargetExpiryIso(
        formExpiryMode,
        formExpiryMonths,
        formExpiryDays,
        formExpiryHours,
        formExpiryExactDateTime,
        new Date()
      );

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          username: formUsername,
          fullName: formFullName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          permissions: formPermissions,
          expiresAt: expIso,
          isNeverExpires: formIsNeverExpires,
          notes: formNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت کاربر جدید');

      setIsAddUserModalOpen(false);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setFormSubmitting(true);

    try {
      let expIso = editingUser.expiresAt;
      if (!formIsNeverExpires) {
        expIso = calculateTargetExpiryIso(
          formExpiryMode,
          formExpiryMonths,
          formExpiryDays,
          formExpiryHours,
          formExpiryExactDateTime,
          new Date(editingUser.expiresAt) > new Date() ? new Date(editingUser.expiresAt) : new Date()
        );
      }

      const body: any = {
        fullName: formFullName,
        email: formEmail,
        role: formRole,
        permissions: formPermissions,
        isNeverExpires: formIsNeverExpires,
        notes: formNotes
      };
      if (!formIsNeverExpires) body.expiresAt = expIso;
      if (formPassword.trim().length >= 6) body.newPassword = formPassword.trim();

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در به‌روزرسانی کاربر');

      setIsEditUserModalOpen(false);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenManualExtendModal = (u: UserAccount) => {
    setExtendingUser(u);
    setExtendMode('relative');
    setExtendMonths(1);
    setExtendDays(0);
    setExtendHours(0);
    const base = u.expiresAt && new Date(u.expiresAt) > new Date() ? new Date(u.expiresAt) : new Date();
    base.setDate(base.getDate() + 30);
    setExtendExactDateTime(base.toISOString().slice(0, 16));
  };

  const handleSubmitManualExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingUser) return;
    setExtendSubmitting(true);

    try {
      const baseDate = extendingUser.expiresAt && new Date(extendingUser.expiresAt) > new Date()
        ? new Date(extendingUser.expiresAt)
        : new Date();

      const newExpIso = calculateTargetExpiryIso(
        extendMode,
        extendMonths,
        extendDays,
        extendHours,
        extendExactDateTime,
        baseDate
      );

      const res = await fetch(`/api/admin/users/${extendingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          expiresAt: newExpIso,
          isNeverExpires: false
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در تمدید کاربر');
      }

      setExtendingUser(null);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExtendSubmitting(false);
    }
  };

  const handleToggleUserActive = async (u: UserAccount) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ isActive: !u.isActive })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (_) {}
  };

  const handleQuickExtendExpiry = async (u: UserAccount, daysToAdd: number, hoursToAdd: number = 0) => {
    try {
      const curDate = new Date(u.expiresAt) > new Date() ? new Date(u.expiresAt) : new Date();
      curDate.setTime(curDate.getTime() + (daysToAdd * 24 * 3600 * 1000) + (hoursToAdd * 3600 * 1000));

      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          expiresAt: curDate.toISOString(),
          isNeverExpires: false
        })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (_) {}
  };

  const handleDeleteUser = async (u: UserAccount) => {
    const confirmMsg = isFa 
      ? `آیا از حذف دائمی کاربر "${u.username}" اطمینان دارید؟` 
      : `Are you sure you want to permanently delete user "${u.username}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      fetchUsers();
    } catch (_) {}
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;
    setLicenseActivating(true);
    setLicenseMsg(null);

    try {
      const res = await fetch('/api/admin/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          licenseKey: licenseKeyInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setLicenseMsg({ type: 'error', text: data.error || 'فعال‌سازی لایسنس شکست خورد.' });
      } else {
        setLicenseMsg({ type: 'success', text: isFa ? 'لایسنس تجاری با موفقیت فعال شد!' : 'Commercial License Activated Successfully!' });
        setLicenseKeyInput('');
        fetchLicense();
      }
    } catch (err: any) {
      setLicenseMsg({ type: 'error', text: err.message });
    } finally {
      setLicenseActivating(false);
    }
  };

  const handleGenerateSellerKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTargetHwId || !genCompanyName) return;
    setGeneratingKey(true);
    setGeneratedResultKey(null);

    try {
      const res = await fetch('/api/admin/license/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          targetHardwareId: genTargetHwId.trim(),
          companyName: genCompanyName.trim(),
          tier: genTier,
          daysValid: genDays,
          maxNodes: genMaxNodes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedResultKey(data.licenseKey);
      } else {
        alert(data.error || 'خطا در صدور لایسنس');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string, type: 'hwId' | 'genKey') => {
    navigator.clipboard.writeText(text);
    if (type === 'hwId') {
      setCopiedHwId(true);
      setTimeout(() => setCopiedHwId(false), 2000);
    } else {
      setCopiedGenKey(true);
      setTimeout(() => setCopiedGenKey(false), 2000);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.fullName.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Super Admin</span>;
      case 'cluster_admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">Cluster Admin</span>;
      case 'operator':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Operator</span>;
      case 'auditor':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600">Auditor</span>;
      default:
        return null;
    }
  };

  const getExpiryDisplay = (u: UserAccount) => {
    if (u.isNeverExpires) {
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isFa ? 'دائمی (بدون انقضا)' : 'Permanent'}</span>
        </span>
      );
    }

    const expDate = new Date(u.expiresAt);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return (
        <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs animate-pulse">
          <XCircle className="w-3.5 h-3.5" />
          <span>{isFa ? 'منقضی شده (قفل شده)' : 'Expired (Locked)'}</span>
        </span>
      );
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const months = Math.floor(totalDays / 30);
    const remDays = totalDays % 30;

    let timeParts: string[] = [];
    if (months > 0) timeParts.push(isFa ? `${months} ماه` : `${months}mo`);
    if (remDays > 0) timeParts.push(isFa ? `${remDays} روز` : `${remDays}d`);
    if (remHours > 0 || (months === 0 && remDays === 0)) timeParts.push(isFa ? `${remHours} ساعت` : `${remHours}h`);

    const formattedTime = timeParts.join(isFa ? ' و ' : ', ');

    if (totalDays <= 7) {
      return (
        <span className="flex items-center gap-1 text-amber-400 font-medium text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{isFa ? `${formattedTime} باقی‌مانده` : `${formattedTime} remaining`}</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-slate-300 text-xs">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>{isFa ? `${formattedTime} اعتبار` : `${formattedTime} valid`}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Auto-Lock Overlay when Account Expiration is Reached */}
      {isCurrentUserExpired && (
        <div className="bg-gradient-to-br from-rose-950/90 via-slate-950 to-slate-900 border-2 border-rose-500/60 rounded-2xl p-6 md:p-8 text-center shadow-2xl shadow-rose-950/50 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOC COMPLIANCE AUTO-LOCKOUT ENFORCED</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mb-2">
            {isFa ? '⛔ دسترسی به پنل ادمین به دلیل انقضای تاریخ حساب قفل شد' : '⛔ Panel Locked: Account Expiration Reached'}
          </h2>
          <p className="text-xs md:text-sm text-rose-200/80 mb-6 max-w-2xl mx-auto leading-relaxed">
            {isFa 
              ? `حساب کاربری شما (${currentUser.username}) در تاریخ ${new Date(currentUser.expiresAt).toLocaleString('fa-IR')} منقضی شده است. طبق مقررات امنیت زیرساخت و انقضای تایم‌بیس، تمام قابلیت‌های عملیاتی قفل گردیده‌اند. لطفاً از طریق مدیر ارشد نسبت به تمدید مدت اعتبار اقدام نمایید.`
              : `Your account (${currentUser.username}) expired on ${new Date(currentUser.expiresAt).toLocaleString()}. All operational capabilities have been locked to comply with security standards.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('splunk_doctor_auth_token');
                localStorage.removeItem('splunk_doctor_user');
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isFa ? 'خروج و ورود با حساب مدیر ارشد' : 'Re-Login with Super Admin'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Title - Sirene Dark Luxury */}
      <div className="sirene-card rounded-3xl border border-white/[0.08] bg-[#0b0e17]/85 backdrop-blur-2xl p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.35)] border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  v1.2.0 SECURE
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight sirene-text-gradient">
                  {isFa ? 'پنل جامع مدیریت دسترسی، امنیت و لایسنس تجاری' : 'Enterprise Admin & Commercial Security Control'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isFa 
                  ? 'مدیریت کاربران و سطح دسترسی (RBAC)، زمان انقضای حساب‌ها، قفل سخت‌افزاری ضد کپی (Node-Locking)، و مانیتورینگ امنیتی'
                  : 'Role-Based Access Control, Account Expiry, Hardware Node-Lock Licensing & Penetration Hardening'}
              </p>
            </div>
          </div>

          {/* Quick Hardware ID Pill */}
          <div className="bg-[#07090e]/80 border border-white/[0.08] rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>{isFa ? 'اثرانگشت سخت‌افزار:' : 'Hardware ID:'}</span>
            </div>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/60">
              {hardwareId || 'SPD-CHECKING...'}
            </span>
            <button
              onClick={() => copyToClipboard(hardwareId, 'hwId')}
              className="p-1.5 hover:text-white text-slate-400 transition"
              title={isFa ? 'کپی شناسه سخت‌افزار' : 'Copy Hardware ID'}
            >
              {copiedHwId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar - Sirene Capsule Style */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/[0.06] overflow-x-auto text-xs relative z-10">
          {currentUser.role === 'super_admin' && (
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-2xl font-medium transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isFa ? 'مدیریت کاربران و انقضا (RBAC)' : 'Users & Access Expiry'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeSubTab === 'users' ? 'bg-black/30 text-white font-bold' : 'bg-white/10 text-slate-300'
              }`}>
                {users.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('license')}
            className={`px-4 py-2 rounded-2xl font-medium transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'license'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isFa ? 'لایسنس تجاری و ضد کپی' : 'Commercial License & Anti-Piracy'}</span>
            {licenseInfo?.status === 'VALID' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-2xl font-medium transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isFa ? 'لاگ‌های رخدادهای امنیتی (Audit Trail)' : 'Security Audit Logs'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hardening')}
            className={`px-4 py-2 rounded-2xl font-medium transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'hardening'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isFa ? 'سیاست‌های ضد نفوذ و پایداری' : 'Penetration Defense'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS & EXPIRATION MANAGEMENT (SUPER ADMIN)                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && currentUser.role === 'super_admin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">{isFa ? 'کل حساب‌های کاربری' : 'Total Accounts'}</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{users.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">{isFa ? 'پایگاه داده مستقل local' : 'Local Auth Database'}</div>
            </div>
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">{isFa ? 'حساب‌های فعال' : 'Active Accounts'}</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {users.filter(u => u.isActive && (u.isNeverExpires || new Date(u.expiresAt) > new Date())).length}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">{isFa ? 'دسترسی مجاز' : 'Authorized Access'}</div>
            </div>
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">{isFa ? 'حساب‌های منقضی‌شده' : 'Expired Accounts'}</div>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                {users.filter(u => !u.isNeverExpires && new Date(u.expiresAt) <= new Date()).length}
              </div>
              <div className="text-[11px] text-rose-500/80 mt-1">{isFa ? 'نیازمند تمدید' : 'Renewal Required'}</div>
            </div>
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">{isFa ? 'مدیران ارشد (Admins)' : 'Admin Tier'}</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {users.filter(u => u.role === 'super_admin' || u.role === 'cluster_admin').length}
              </div>
              <div className="text-[11px] text-amber-500/80 mt-1">{isFa ? 'دسترسی اعمال تغییرات' : 'Full / Config Write'}</div>
            </div>
          </div>

          {/* Action Bar: Search, Filter, Create User */}
          <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder={isFa ? 'جستجوی نام یا نام کاربری...' : 'Search users...'}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pl-9"
                />
                <Search className={`w-4 h-4 text-slate-500 absolute top-2.5 ${isFa ? 'left-3' : 'right-3'}`} />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'super_admin', 'cluster_admin', 'operator', 'auditor'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg transition font-medium text-[11px] ${
                      selectedRoleFilter === r
                        ? 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'ALL' ? (isFa ? 'همه نقش‌ها' : 'All') : r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={fetchUsers}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
                title={isFa ? 'بروزرسانی فهرست' : 'Refresh'}
              >
                <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isFa ? 'افزودن کاربر جدید' : 'Create New User'}</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#0e1420] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">{isFa ? 'نام کاربری / نام' : 'User / Identity'}</th>
                    <th className="p-4">{isFa ? 'نقش کاربری (Role)' : 'Role / Tier'}</th>
                    <th className="p-4">{isFa ? 'دسترسی پنل‌ها و امکانات' : 'Permissions Matrix'}</th>
                    <th className="p-4">{isFa ? 'وضعیت انقضا (Expire Time)' : 'Expiration Status'}</th>
                    <th className="p-4">{isFa ? 'وضعیت حساب' : 'Status'}</th>
                    <th className="p-4">{isFa ? 'آخرین ورود' : 'Last Login'}</th>
                    <th className="p-4 text-center">{isFa ? 'عملیات، دسترسی و تمدید' : 'Actions & Permissions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {loadingUsers ? (
                          <div className="flex items-center justify-center gap-2 text-slate-400">
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            <span>{isFa ? 'در حال دریافت اطلاعات کاربران...' : 'Loading users...'}</span>
                          </div>
                        ) : (
                          <span>{isFa ? 'هیچ کاربری با این مشخصات یافت نشد.' : 'No users found.'}</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isExpired = !u.isNeverExpires && new Date(u.expiresAt) <= new Date();
                      const permStats = getPermissionsStats(u.permissions);
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition">
                          {/* Username & Full Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                u.role === 'super_admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                u.role === 'cluster_admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                u.role === 'operator' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  <span>{u.username}</span>
                                  {u.id === currentUser.id && (
                                    <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded border border-slate-700">
                                      {isFa ? 'شما' : 'You'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{u.fullName}</div>
                                {u.email && <div className="text-[10px] text-slate-500">{u.email}</div>}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-4">
                            {getRoleBadge(u.role)}
                          </td>

                          {/* Permissions Matrix */}
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedUserForPermsView(u)}
                              className="group flex flex-col gap-1 text-right hover:opacity-90 transition cursor-pointer"
                              title={isFa ? 'مشاهده ماتریس دسترسی این کاربر' : 'View user permissions matrix'}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1 group-hover:border-cyan-500 transition">
                                  <Layers className="w-2.5 h-2.5 text-cyan-400" />
                                  {permStats.panelCount}/10 {isFa ? 'پنل' : 'Panels'}
                                </span>
                                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 group-hover:border-amber-500 transition">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                  {permStats.featCount}/7 {isFa ? 'قابلیت' : 'Features'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 group-hover:text-cyan-400 flex items-center gap-1">
                                <Eye className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
                                <span>{isFa ? 'مشاهده جزئیات دسترسی' : 'View Matrix'}</span>
                              </span>
                            </button>
                          </td>

                          {/* Expiration Status */}
                          <td className="p-4">
                            <div>
                              {getExpiryDisplay(u)}
                              {!u.isNeverExpires && (
                                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                  {new Date(u.expiresAt).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Active / Suspended */}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleUserActive(u)}
                              disabled={u.id === currentUser.id}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition ${
                                u.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              } ${u.id === currentUser.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {u.isActive ? (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>{isFa ? 'فعال' : 'Active'}</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3" />
                                  <span>{isFa ? 'معلق / مسدود' : 'Suspended'}</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Last Login */}
                          <td className="p-4 font-mono text-[11px] text-slate-400">
                            {u.lastLoginAt ? (
                              <div>
                                <div>{new Date(u.lastLoginAt).toLocaleTimeString()}</div>
                                <div className="text-[10px] text-slate-500">{u.lastLoginIp || '127.0.0.1'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-600">{isFa ? 'هنوز وارد نشده' : 'Never'}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Extend Buttons */}
                              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                                <button
                                  onClick={() => handleQuickExtendExpiry(u, 7)}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                                  title={isFa ? 'تمدید ۷ روزه' : '+7 Days'}
                                >
                                  +7d
                                </button>
                                <button
                                  onClick={() => handleQuickExtendExpiry(u, 30)}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                                  title={isFa ? 'تمدید ۳۰ روزه' : '+30 Days'}
                                >
                                  +30d
                                </button>
                                <button
                                  onClick={() => handleQuickExtendExpiry(u, 365)}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                                  title={isFa ? 'تمدید یکساله' : '+1 Year'}
                                >
                                  +1y
                                </button>
                              </div>

                              {/* Manual Extend (Month / Day / Hour / Exact) Button */}
                              <button
                                onClick={() => handleOpenManualExtendModal(u)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-medium"
                                title={isFa ? 'تنظیم دستی تاریخ و مدت انقضا (ماه، روز، ساعت و تقویم)' : 'Manual Expiry (Months/Days/Hours/Exact Date)'}
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isFa ? 'تمدید دستی' : 'Extend'}</span>
                              </button>

                              {/* Customize Permissions Button */}
                              <button
                                onClick={() => handleOpenEditUser(u, 'permissions')}
                                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition"
                                title={isFa ? 'مدیریت و شخصی‌سازی دسترسی‌های این کاربر' : 'Customize User Permissions'}
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Modal Button */}
                              <button
                                onClick={() => handleOpenEditUser(u, 'general')}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title={isFa ? 'ویرایش مشخصات و کلمه عبور' : 'Edit User & Password'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              {u.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                                  title={isFa ? 'حذف دائمی کاربر' : 'Delete User'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMERCIAL SOFTWARE LICENSING & ANTI-PIRACY NODE LOCKING          */}
      {/* ========================================================================= */}
      {activeSubTab === 'license' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Current License Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status Card */}
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{isFa ? 'وضعیت لایسنس سرور' : 'Server License Status'}</span>
                {licenseInfo?.status === 'VALID' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ENTERPRISE COMMERCIAL
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    TRIAL / EVALUATION
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mt-3 flex items-center gap-2">
                <span>{licenseInfo?.companyName || 'Evaluation Entity'}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isFa ? `حداکثر نودهای مجاز: ${licenseInfo?.maxNodes || 50} کلاستر نود` : `Max Nodes: ${licenseInfo?.maxNodes || 50}`}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{isFa ? 'زمان باقیمانده:' : 'Time remaining:'}</span>
                <span className="font-bold text-amber-400 font-mono">
                  {licenseInfo?.daysRemaining ? `${licenseInfo.daysRemaining} ${isFa ? 'روز' : 'days'}` : (isFa ? 'منقضی شده' : 'Expired')}
                </span>
              </div>
            </div>

            {/* Hardware Node-Lock Card */}
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{isFa ? 'اثرانگشت یکتا و ضد کپی' : 'Anti-Copy Node Lock'}</span>
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Locked</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 mb-1">{isFa ? 'شناسه سخت‌افزاری سرور (Hardware ID):' : 'Hardware Fingerprint ID:'}</div>
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-cyan-300 font-bold text-sm">
                  <span>{hardwareId}</span>
                  <button
                    onClick={() => copyToClipboard(hardwareId, 'hwId')}
                    className="p-1 hover:text-white text-slate-400 transition"
                  >
                    {copiedHwId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                {isFa 
                  ? 'این شناسه از ترکیب مدل پردازنده، آدرس مک کارت شبکه و شناسه کرنل لینوکس تولید شده و امکان تکثیر برنامه روی سرور دیگر را ناممکن می‌سازد.'
                  : 'Derived from CPU microcode, NIC MAC and Linux Machine-ID. Prevents unauthorized cloning.'}
              </div>
            </div>

            {/* Verification & Tampering Check */}
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{isFa ? 'سلامت امضای دیجیتال' : 'Signature Integrity'}</span>
                {licenseInfo?.isTampered ? (
                  <span className="text-rose-400 text-xs flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Tampered</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HMAC-SHA256 OK</span>
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{isFa ? 'انقضای لایسنس:' : 'Expires:'}</span>
                  <span className="font-mono text-slate-200">
                    {licenseInfo?.expiresAt ? new Date(licenseInfo.expiresAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{isFa ? 'نوع مجوز:' : 'Tier:'}</span>
                  <span className="font-mono text-amber-400">{licenseInfo?.tier || 'TRIAL'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{isFa ? 'وضعیت دستکاری:' : 'Tamper Detect:'}</span>
                  <span className="text-emerald-400">{isFa ? 'عدم تغییر و اصالت کامل' : 'Authentic / No Tamper'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activate Commercial Key Form */}
          {currentUser.role === 'super_admin' && (
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'فعال‌سازی یا تمدید کلید لایسنس تجاری روی این سرور' : 'Activate or Renew Commercial License Key'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isFa 
                      ? 'کلید صادر شده برای شناسه سخت‌افزاری این سرور را در کادر زیر وارد کنید تا نسخه شرکتی دائمی یا مدت‌دار فعال شود.'
                      : 'Enter signed license key locked to this node to unlock enterprise features.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleActivateLicense} className="space-y-4">
                {licenseMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    licenseMsg.type === 'success' 
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    {licenseMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{licenseMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    placeholder="LIC-XXXXXX.YYYYYY..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={licenseActivating || !licenseKeyInput.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {licenseActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    <span>{isFa ? 'بررسی و فعال‌سازی لایسنس' : 'Verify & Activate'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMMERCIAL KEY GENERATOR FOR THE SOFTWARE SELLER (ویژه فروشنده برنامه)       */}
          {/* ========================================================================= */}
          {currentUser.role === 'super_admin' && (
            <div className="bg-gradient-to-b from-[#111726] to-[#0c101a] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {isFa ? 'ابزار اختصاصی صدور لایسنس تجاری برای خریداران (ویژه فروشنده)' : 'Commercial License Issuer (Vendor Tool)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                        {isFa ? 'ضد کپی' : 'Anti-Copy'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isFa 
                        ? 'هنگامی که برنامه را به مشتری می‌فروشید، اثرانگشت سخت‌افزاری سرور او (Hardware ID) را در اینجا وارد کرده و لایسنس امضاشده صادر نمایید تا مشتری نتواند برنامه را روی سرور دیگری کپی یا توزیع کند.'
                        : 'Generate cryptographically signed, node-locked keys for your commercial buyers.'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGenerateSellerKey} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Hardware ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isFa ? 'شناسه سخت‌افزاری سرور خریدار (Client Hardware ID):' : 'Buyer Server Hardware ID:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={genTargetHwId}
                      onChange={(e) => setGenTargetHwId(e.target.value)}
                      placeholder="SPD-XXXX-XXXX-XXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isFa ? 'نام سازمان یا خریدار (Company Name):' : 'Client Organization Name:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={genCompanyName}
                      onChange={(e) => setGenCompanyName(e.target.value)}
                      placeholder="e.g. Tehran Telecom Corp"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Duration Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isFa ? 'مدت زمان اعتبار لایسنس:' : 'Validity Duration:'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: isFa ? '۳۰ روز' : '30d', val: 30 },
                        { label: isFa ? '۹۰ روز' : '90d', val: 90 },
                        { label: isFa ? '۱ سال' : '1 Year', val: 365 },
                        { label: isFa ? '۳ سال' : '3 Years', val: 1095 }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setGenDays(item.val)}
                          className={`py-2 rounded-lg text-xs font-medium transition ${
                            genDays === item.val
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Nodes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isFa ? 'تعداد نودهای مجاز کلاستر:' : 'Max Licensed Nodes:'}
                    </label>
                    <select
                      value={genMaxNodes}
                      onChange={(e) => setGenMaxNodes(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value={10}>10 Cluster Nodes (Small Edition)</option>
                      <option value={50}>50 Cluster Nodes (Enterprise Standard)</option>
                      <option value={100}>100 Cluster Nodes (Enterprise Premier)</option>
                      <option value={500}>500 Cluster Nodes (Carrier Grade)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={generatingKey || !genTargetHwId || !genCompanyName}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {generatingKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>{isFa ? 'تولید و صدور کلید لایسنس امضاشده' : 'Generate Signed License Key'}</span>
                  </button>
                </div>
              </form>

              {/* Display Generated Key Result */}
              {generatedResultKey && (
                <div className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isFa ? 'کلید لایسنس تجاری با موفقیت صادر شد (جهت تحویل به خریدار):' : 'Generated Commercial Key:'}</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedResultKey, 'genKey')}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedGenKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isFa ? 'کپی کلید' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-black/60 rounded-lg font-mono text-xs text-amber-300/90 break-all select-all border border-slate-800">
                    {generatedResultKey}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
                    <span>{isFa ? `این کلید صرفاً روی سرور با اثرانگشت [${genTargetHwId}] کار خواهد کرد.` : `Locked strictly to node [${genTargetHwId}].`}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS (SECURITY TRAIL)                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Audit Controls */}
          <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">{isFa ? 'دسته‌بندی لاگ‌ها:' : 'Category:'}</span>
              {['ALL', 'AUTH', 'USER_MGMT', 'LICENSE', 'SECURITY', 'FIX'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAuditCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    auditCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={fetchAuditLogs}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isFa ? 'بروزرسانی لاگ‌ها' : 'Refresh Logs'}</span>
            </button>
          </div>

          {/* Audit Table */}
          <div className="bg-[#0e1420] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold sticky top-0 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">{isFa ? 'زمان' : 'Timestamp'}</th>
                    <th className="p-3.5">{isFa ? 'کاربر' : 'User'}</th>
                    <th className="p-3.5">{isFa ? 'دسته' : 'Category'}</th>
                    <th className="p-3.5">{isFa ? 'عملیات' : 'Action'}</th>
                    <th className="p-3.5">{isFa ? 'وضعیت' : 'Status'}</th>
                    <th className="p-3.5">{isFa ? 'آدرس IP' : 'IP'}</th>
                    <th className="p-3.5">{isFa ? 'جزئیات رخداد' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal text-slate-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {auditLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            <span>{isFa ? 'در حال دریافت رویدادها...' : 'Loading audit trail...'}</span>
                          </div>
                        ) : (
                          <span>{isFa ? 'هیچ رخدادی ثبت نشده است.' : 'No audit entries.'}</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 font-mono text-[11px] transition">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          {log.username}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {log.category}
                          </span>
                        </td>
                        <td className="p-3 text-cyan-300 font-semibold whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            log.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            log.status === 'DENIED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {log.ip}
                        </td>
                        <td className="p-3 font-sans text-xs text-slate-300 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENETRATION DEFENSE & SYSTEM HARDENING POLICIES                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'hardening' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Defense Modules Checklist */}
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'سیاست‌های فعال دفاع سایبری و ضد نفوذ' : 'Active Cyber Defenses & Protection Engine'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isFa ? 'کنترل‌های امنیتی اعمال‌شده روی هسته Express و سرور لینوکس' : 'Applied runtime kernel and application guards'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{isFa ? 'فایروال ضد Command Injection (RFC-1123)' : 'Host Sanitizer WAF'}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      {isFa 
                        ? 'فیلترینگ سخت‌گیرانه کاراکترهای شل (;, &, |, `, $, ...) روی تمامی متدهای پینگ، تریس‌روت و اسکن پورت جهت جلوگیری از نفوذ از راه دور.'
                        : 'Strict RFC-1123 regex blocks metacharacters on ping, traceroute, and netcat probes.'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{isFa ? 'مکانیزم دفاعی در برابر Brute-Force و حدس کلمه عبور' : 'Brute-Force Rate Limiter'}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      {isFa 
                        ? 'مسدودسازی خودکار IP و نام کاربری پس از ۵ مرتبه تلاش ناموفق به مدت ۱۵ دقیقه به همراه ثبت رخداد در لاگ امنیتی.'
                        : 'Automatic 15-minute lockout after 5 consecutive failed login attempts.'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{isFa ? 'رمزنگاری کلمات عبور با PBKDF2 (صد هزار دور)' : 'PBKDF2 100k Iterations + Salt'}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      {isFa 
                        ? 'هشینگ فوق امن کلمات عبور با سالت تصادفی ۱۶ بایتی اختصاصی برای هر کاربر، مقاوم در برابر حملات جدول رنگین‌کمان (Rainbow Table).'
                        : 'Cryptographic SHA-512 derivation with unique 16-byte random salt per user.'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{isFa ? 'توکن‌های نشست امضاشده با HMAC-SHA256' : 'Cryptographically Signed Bearer Tokens'}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      {isFa 
                        ? 'توکن‌های نشست غیرقابل جعل به همراه راستی‌آزمایی تاریخ انقضای هر کاربر در تک تک درخواست‌های ارسالی به سرور.'
                        : 'Node-bound HMAC-SHA256 signature checked on every inbound API call.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Security Telemetry */}
            <div className="bg-[#0e1420] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'وضعیت زنده تلمتری امنیت و نشست‌ها' : 'Live Security Telemetry & Sessions'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isFa ? 'پایش نشست‌های فعال و هشدارهای امنیتی' : 'Active sessions, lockouts and audit state'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs text-slate-300">{isFa ? 'نشست‌های فعال جاری (Active Sessions):' : 'Active User Sessions:'}</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{securityStatus?.activeSessionsCount ?? 1}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs text-slate-300">{isFa ? 'آدرس‌های IP مسدودشده در Rate-Limiter:' : 'Locked IP Addresses:'}</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{securityStatus?.lockedIpsCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs text-slate-300">{isFa ? 'تلاش‌های ناموفق ورود در ۲۴ ساعت گذشته:' : 'Failed Logins Past 24h:'}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{securityStatus?.failedLoginsPast24h ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs text-slate-300">{isFa ? 'قفل سخت‌افزاری نرم‌افزار (Node Lock):' : 'Anti-Copy Node Locking:'}</span>
                  <span className="font-mono font-bold text-cyan-400 text-xs">{isFa ? 'فعال و منطبق بر سرور' : 'Active & Bound'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER                                                      */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isFa ? 'افزودن حساب کاربری جدید به سامانه' : 'Create New User Account'}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {isFa ? 'تعریف مشخصات، انقضا و دسترسی‌های اختصاصی پنل‌ها و امکانات' : 'Define credentials, expiration, and granular permissions'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Top Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
                  modalTab === 'general'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isFa ? '۱. مشخصات حساب و انقضا' : '1. Account & Expiry'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('permissions')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
                  modalTab === 'permissions'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isFa ? '۲. سطوح دسترسی پنل‌ها و امکانات' : '2. Permissions & Gates'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {Object.values(formPermissions.panels).filter(Boolean).length}/10
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {modalTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'نام کاربری (لاتین)' : 'Username'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="e.g. operator_1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        placeholder="e.g. علی رضایی"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'کلمه عبور (حداقل ۶ کاراکتر)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'نقش پیش‌فرض (Role)' : 'Default Role'}
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setFormRole(r);
                          setFormPermissions(getDefaultPermissionsForRole(r));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="operator">{isFa ? 'اپراتور شبکه (Operator - پایش پورت‌ها و کانفیگ‌ها)' : 'Operator'}</option>
                        <option value="cluster_admin">{isFa ? 'ادمین کلاستر (Cluster Admin - اصلاح خودکار و کانفیگ‌ها)' : 'Cluster Admin'}</option>
                        <option value="auditor">{isFa ? 'ناظر و بازرس (Auditor - فقط خواندنی لاگ‌ها و سلامت)' : 'Auditor'}</option>
                        <option value="super_admin">{isFa ? 'مدیر ارشد سیستم (Super Admin - دسترسی نامحدود)' : 'Super Admin'}</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {isFa ? 'با انتخاب نقش، دسترسی‌های پیش‌فرض اعمال می‌شود و در تب ۲ قابل تغییر است.' : 'Role presets default permissions; customize in Tab 2.'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'پست الکترونیکی (اختیاری)' : 'Email (optional)'}
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. operator@company.local"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Expiration Time Selector (Months, Days, Hours, Exact Date) */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isFa ? 'مدت زمان اعتبار و تاریخ انقضا (Expiration Time):' : 'Account Expiration Time:'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={formIsNeverExpires}
                          onChange={(e) => setFormIsNeverExpires(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                        <span className="font-medium text-emerald-400">{isFa ? 'دائمی (بدون انقضا)' : 'Never Expires'}</span>
                      </label>
                    </div>

                    {!formIsNeverExpires && (
                      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setFormExpiryMode('relative')}
                            className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                              formExpiryMode === 'relative'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isFa ? 'تنظیم دستی بر اساس ماه / روز / ساعت' : 'Relative (Months / Days / Hours)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormExpiryMode('exact')}
                            className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                              formExpiryMode === 'exact'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isFa ? 'انتخاب تقویم و ساعت دقیق' : 'Exact Date & Time'}
                          </button>
                        </div>

                        {formExpiryMode === 'relative' ? (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'ماه (Month):' : 'Months:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={formExpiryMonths}
                                  onChange={(e) => setFormExpiryMonths(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'روز (Day):' : 'Days:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="365"
                                  value={formExpiryDays}
                                  onChange={(e) => setFormExpiryDays(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'ساعت (Hour):' : 'Hours:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="72"
                                  value={formExpiryHours}
                                  onChange={(e) => setFormExpiryHours(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Quick Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-500">{isFa ? 'میانبرها:' : 'Presets:'}</span>
                              {[
                                { label: isFa ? '۱۲ ساعت' : '12h', m: 0, d: 0, h: 12 },
                                { label: isFa ? '۱ روز' : '1d', m: 0, d: 1, h: 0 },
                                { label: isFa ? '۷ روز' : '7d', m: 0, d: 7, h: 0 },
                                { label: isFa ? '۱ ماه' : '1mo', m: 1, d: 0, h: 0 },
                                { label: isFa ? '۳ ماه' : '3mo', m: 3, d: 0, h: 0 },
                                { label: isFa ? '۶ ماه' : '6mo', m: 6, d: 0, h: 0 },
                                { label: isFa ? '۱ سال' : '1yr', m: 12, d: 0, h: 0 }
                              ].map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormExpiryMonths(p.m);
                                    setFormExpiryDays(p.d);
                                    setFormExpiryHours(p.h);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              {isFa ? 'انتخاب تاریخ و ساعت دقیق پایان اعتبار:' : 'Exact Expiration Date & Time:'}
                            </label>
                            <input
                              type="datetime-local"
                              value={formExpiryExactDateTime}
                              onChange={(e) => setFormExpiryExactDateTime(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}

                        {/* Calculated Expiry Preview */}
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isFa ? 'تاریخ نهایی انقضا:' : 'Calculated Expiry:'}</span>
                          </span>
                          <span className="font-mono text-amber-300 font-bold">
                            {new Date(
                              calculateTargetExpiryIso(
                                formExpiryMode,
                                formExpiryMonths,
                                formExpiryDays,
                                formExpiryHours,
                                formExpiryExactDateTime,
                                new Date()
                              )
                            ).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'توضیحات و یادداشت ادمین' : 'Notes'}
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder={isFa ? 'مثال: حساب کارشناس مانیتورینگ شیفت شب' : 'e.g. Shift operator'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'permissions' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Sub Tab switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPermSubTab('panels')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                          permSubTab === 'panels'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{isFa ? 'دسترسی پنل‌ها و صفحات' : 'Panel Access'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                          permSubTab === 'panels' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
                        }`}>
                          {Object.values(formPermissions.panels).filter(Boolean).length}/10
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPermSubTab('features')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                          permSubTab === 'features'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFa ? 'مجوزهای عملیاتی حساس' : 'Sensitive Operations'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                          permSubTab === 'features' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                        }`}>
                          {Object.values(formPermissions.features).filter(Boolean).length}/7
                        </span>
                      </button>
                    </div>

                    {/* Quick shortcuts */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {permSubTab === 'panels' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetAllPanels(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                          >
                            {isFa ? 'انتخاب همه' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAllPanels(false)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 transition"
                          >
                            {isFa ? 'لغو همه' : 'Clear All'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetAllFeatures(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                          >
                            {isFa ? 'انتخاب همه' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAllFeatures(false)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 transition"
                          >
                            {isFa ? 'لغو همه' : 'Clear All'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResetToRoleDefaults(formRole)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                        title={isFa ? 'بازنشانی بر اساس نقش انتخابی' : 'Reset to role default'}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isFa ? 'پیش‌فرض نقش' : 'Reset'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel Toggles List */}
                  {permSubTab === 'panels' && (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>{isFa ? 'پنل‌های مجاز برای این کاربر پس از ورود به سامانه:' : 'Authorized navigation panels:'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Object.values(formPermissions.panels).filter(Boolean).length} / 10
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(Object.keys(PANEL_METADATA) as Array<keyof PanelPermissions>).map((key) => {
                          const meta = PANEL_METADATA[key];
                          const Icon = meta.icon;
                          const isChecked = !!formPermissions.panels[key];
                          return (
                            <div
                              key={key}
                              onClick={() => handleTogglePanel(key)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                                isChecked
                                  ? 'bg-cyan-950/20 border-cyan-800/70 hover:border-cyan-500'
                                  : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                                  isChecked ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{isFa ? meta.titleFa : meta.titleEn}</span>
                                    {key === 'admin_security' && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                        {isFa ? 'حساس' : 'Admin'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                    {isFa ? meta.descFa : meta.descEn}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 mt-1">
                                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                                  isChecked ? 'bg-cyan-500' : 'bg-slate-800'
                                }`}>
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform transform ${
                                    isChecked ? (isFa ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feature Toggles List */}
                  {permSubTab === 'features' && (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>{isFa ? 'اختیارات اجرایی، تغییر کانفیگ و ریستارت اسپلانک:' : 'System execution & operational privileges:'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Object.values(formPermissions.features).filter(Boolean).length} / 7
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(Object.keys(FEATURE_METADATA) as Array<keyof FeaturePermissions>).map((key) => {
                          const meta = FEATURE_METADATA[key];
                          const Icon = meta.icon;
                          const isChecked = !!formPermissions.features[key];
                          return (
                            <div
                              key={key}
                              onClick={() => handleToggleFeature(key)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                                isChecked
                                  ? 'bg-amber-950/20 border-amber-800/70 hover:border-amber-500'
                                  : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                                  isChecked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{isFa ? meta.titleFa : meta.titleEn}</span>
                                    {meta.danger && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        {isFa ? 'حساس' : 'Critical'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                    {isFa ? meta.descFa : meta.descEn}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 mt-1">
                                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                                  isChecked ? 'bg-amber-500' : 'bg-slate-800'
                                }`}>
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform transform ${
                                    isChecked ? (isFa ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                <div className="text-[11px] text-slate-400">
                  {modalTab === 'general' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab('permissions')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isFa ? 'رفتن به تنظیم دسترسی‌ها ←' : 'Configure Permissions →'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalTab('general')}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isFa ? '← بازگشت به مشخصات' : '← Back to General'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isFa ? 'ثبت و فعال‌سازی کاربر' : 'Create User'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER & GRANULAR PERMISSIONS                                    */}
      {/* ========================================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{isFa ? 'مدیریت و ویرایش حساب:' : 'Edit User Account:'}</span>
                    <span className="text-amber-400 font-mono">{editingUser.username}</span>
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {editingUser.fullName} • {isFa ? 'نقش فعلی:' : 'Role:'} {editingUser.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Top Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
                  modalTab === 'general'
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isFa ? '۱. مشخصات و انقضا' : '1. Profile & Expiry'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('permissions')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
                  modalTab === 'permissions'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isFa ? '۲. سطوح دسترسی پنل‌ها و امکانات' : '2. Permissions & Gates'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {Object.values(formPermissions.panels).filter(Boolean).length}/10
                </span>
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {modalTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'سطح دسترسی و نقش (Role)' : 'Role / Tier'}
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setFormRole(r);
                          setFormPermissions(getDefaultPermissionsForRole(r));
                        }}
                        disabled={editingUser.id === currentUser.id}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        <option value="operator">{isFa ? 'اپراتور شبکه (Operator)' : 'Operator'}</option>
                        <option value="cluster_admin">{isFa ? 'ادمین کلاستر (Cluster Admin)' : 'Cluster Admin'}</option>
                        <option value="auditor">{isFa ? 'ناظر و بازرس (Auditor)' : 'Auditor'}</option>
                        <option value="super_admin">{isFa ? 'مدیر ارشد (Super Admin)' : 'Super Admin'}</option>
                      </select>
                      {editingUser.id === currentUser.id && (
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {isFa ? 'امکان تغییر نقش برای حساب کاربری شخصی شما وجود ندارد.' : 'Cannot change your own role.'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'پست الکترونیکی' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. user@domain.local"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Reset Password Optional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'تغییر کلمه عبور (در صورت نیاز به بازنشانی، رمز جدید وارد کنید):' : 'Reset Password (optional):'}
                    </label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={isFa ? 'جهت حفظ کلمه عبور فعلی، خالی بگذارید' : 'Leave blank to keep current password'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Expiration Settings (Months, Days, Hours, Exact Date) */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isFa ? 'تمدید یا تغییر زمان انقضا (Expiration Time):' : 'Extend / Modify Expiry:'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={formIsNeverExpires}
                          onChange={(e) => setFormIsNeverExpires(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                        <span className="font-medium text-emerald-400">{isFa ? 'دائمی (بدون انقضا)' : 'Never Expires'}</span>
                      </label>
                    </div>

                    {!formIsNeverExpires && (
                      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setFormExpiryMode('relative')}
                            className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                              formExpiryMode === 'relative'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isFa ? 'تمدید بر اساس ماه / روز / ساعت' : 'Relative (Months / Days / Hours)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormExpiryMode('exact')}
                            className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                              formExpiryMode === 'exact'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isFa ? 'انتخاب تقویم و ساعت دقیق' : 'Exact Date & Time'}
                          </button>
                        </div>

                        {formExpiryMode === 'relative' ? (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'ماه (Month):' : 'Months:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={formExpiryMonths}
                                  onChange={(e) => setFormExpiryMonths(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'روز (Day):' : 'Days:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="365"
                                  value={formExpiryDays}
                                  onChange={(e) => setFormExpiryDays(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  {isFa ? 'ساعت (Hour):' : 'Hours:'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="72"
                                  value={formExpiryHours}
                                  onChange={(e) => setFormExpiryHours(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Quick Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-500">{isFa ? 'تمدید سریع:' : 'Quick Add:'}</span>
                              {[
                                { label: isFa ? '+۱۲ ساعت' : '+12h', m: 0, d: 0, h: 12 },
                                { label: isFa ? '+۱ روز' : '+1d', m: 0, d: 1, h: 0 },
                                { label: isFa ? '+۷ روز' : '+7d', m: 0, d: 7, h: 0 },
                                { label: isFa ? '+۱ ماه' : '+1mo', m: 1, d: 0, h: 0 },
                                { label: isFa ? '+۳ ماه' : '+3mo', m: 3, d: 0, h: 0 },
                                { label: isFa ? '+۶ ماه' : '+6mo', m: 6, d: 0, h: 0 },
                                { label: isFa ? '+۱ سال' : '+1yr', m: 12, d: 0, h: 0 }
                              ].map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormExpiryMonths(p.m);
                                    setFormExpiryDays(p.d);
                                    setFormExpiryHours(p.h);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              {isFa ? 'انتخاب تاریخ و ساعت دقیق پایان اعتبار:' : 'Exact Expiration Date & Time:'}
                            </label>
                            <input
                              type="datetime-local"
                              value={formExpiryExactDateTime}
                              onChange={(e) => setFormExpiryExactDateTime(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}

                        {/* Calculated Expiry Preview */}
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isFa ? 'تاریخ نهایی انقضا:' : 'Calculated Expiry:'}</span>
                          </span>
                          <span className="font-mono text-amber-300 font-bold">
                            {new Date(
                              calculateTargetExpiryIso(
                                formExpiryMode,
                                formExpiryMonths,
                                formExpiryDays,
                                formExpiryHours,
                                formExpiryExactDateTime,
                                editingUser?.expiresAt && new Date(editingUser.expiresAt) > new Date()
                                  ? new Date(editingUser.expiresAt)
                                  : new Date()
                              )
                            ).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'توضیحات و یادداشت ادمین' : 'Notes'}
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder={isFa ? 'مثال: حساب کارشناس مانیتورینگ شیفت شب' : 'e.g. Shift operator'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'permissions' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Sub Tab switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPermSubTab('panels')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                          permSubTab === 'panels'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{isFa ? 'دسترسی پنل‌ها و صفحات' : 'Panel Access'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                          permSubTab === 'panels' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
                        }`}>
                          {Object.values(formPermissions.panels).filter(Boolean).length}/10
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPermSubTab('features')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                          permSubTab === 'features'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFa ? 'مجوزهای عملیاتی حساس' : 'Sensitive Operations'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                          permSubTab === 'features' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                        }`}>
                          {Object.values(formPermissions.features).filter(Boolean).length}/7
                        </span>
                      </button>
                    </div>

                    {/* Quick shortcuts */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {permSubTab === 'panels' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetAllPanels(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                          >
                            {isFa ? 'انتخاب همه' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAllPanels(false)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 transition"
                          >
                            {isFa ? 'لغو همه' : 'Clear All'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetAllFeatures(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                          >
                            {isFa ? 'انتخاب همه' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAllFeatures(false)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 transition"
                          >
                            {isFa ? 'لغو همه' : 'Clear All'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResetToRoleDefaults(formRole)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                        title={isFa ? 'بازنشانی بر اساس نقش کاربر' : 'Reset to role default'}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isFa ? 'پیش‌فرض نقش' : 'Reset'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel Toggles List */}
                  {permSubTab === 'panels' && (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>{isFa ? 'پنل‌های مجاز برای این کاربر پس از ورود به سامانه:' : 'Authorized navigation panels:'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Object.values(formPermissions.panels).filter(Boolean).length} / 10
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(Object.keys(PANEL_METADATA) as Array<keyof PanelPermissions>).map((key) => {
                          const meta = PANEL_METADATA[key];
                          const Icon = meta.icon;
                          const isChecked = !!formPermissions.panels[key];
                          return (
                            <div
                              key={key}
                              onClick={() => handleTogglePanel(key)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                                isChecked
                                  ? 'bg-cyan-950/20 border-cyan-800/70 hover:border-cyan-500'
                                  : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                                  isChecked ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{isFa ? meta.titleFa : meta.titleEn}</span>
                                    {key === 'admin_security' && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                        {isFa ? 'حساس' : 'Admin'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                    {isFa ? meta.descFa : meta.descEn}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 mt-1">
                                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                                  isChecked ? 'bg-cyan-500' : 'bg-slate-800'
                                }`}>
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform transform ${
                                    isChecked ? (isFa ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feature Toggles List */}
                  {permSubTab === 'features' && (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>{isFa ? 'اختیارات اجرایی، تغییر کانفیگ و ریستارت اسپلانک:' : 'System execution & operational privileges:'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Object.values(formPermissions.features).filter(Boolean).length} / 7
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(Object.keys(FEATURE_METADATA) as Array<keyof FeaturePermissions>).map((key) => {
                          const meta = FEATURE_METADATA[key];
                          const Icon = meta.icon;
                          const isChecked = !!formPermissions.features[key];
                          return (
                            <div
                              key={key}
                              onClick={() => handleToggleFeature(key)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                                isChecked
                                  ? 'bg-amber-950/20 border-amber-800/70 hover:border-amber-500'
                                  : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                                  isChecked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{isFa ? meta.titleFa : meta.titleEn}</span>
                                    {meta.danger && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        {isFa ? 'حساس' : 'Critical'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                    {isFa ? meta.descFa : meta.descEn}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 mt-1">
                                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                                  isChecked ? 'bg-amber-500' : 'bg-slate-800'
                                }`}>
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform transform ${
                                    isChecked ? (isFa ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                <div className="text-[11px] text-slate-400">
                  {modalTab === 'general' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab('permissions')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isFa ? 'مدیریت و سفارشی‌سازی سطوح دسترسی ←' : 'Configure Permissions →'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalTab('general')}
                      className="text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isFa ? '← بازگشت به مشخصات کاربر' : '← Back to Profile'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isFa ? 'ذخیره تغییرات' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK PERMISSIONS MATRIX INSPECTOR                                 */}
      {/* ========================================================================= */}
      {selectedUserForPermsView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{isFa ? 'ماتریس دسترسی‌های کاربر:' : 'User Permissions Matrix:'}</span>
                    <span className="text-amber-400 font-mono">{selectedUserForPermsView.username}</span>
                    <span className="text-slate-400 text-xs font-normal">({selectedUserForPermsView.fullName})</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{isFa ? 'نقش:' : 'Role:'} {selectedUserForPermsView.role}</span>
                    <span>•</span>
                    <span>{getExpiryDisplay(selectedUserForPermsView)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPermsView(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Body: Panels and Features Lists */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Panels */}
              <div>
                <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>{isFa ? 'دسترسی به پنل‌ها و صفحات سیستم' : 'Access to System Panels'}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {getPermissionsStats(selectedUserForPermsView.permissions).panelCount} / 10 {isFa ? 'مجاز' : 'Allowed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(PANEL_METADATA) as Array<keyof PanelPermissions>).map((key) => {
                    const meta = PANEL_METADATA[key];
                    const Icon = meta.icon;
                    const hasAccess = selectedUserForPermsView.role === 'super_admin' || !!selectedUserForPermsView.permissions?.panels?.[key];
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          hasAccess
                            ? 'bg-emerald-950/15 border-emerald-800/40 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800/70 text-slate-500 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${hasAccess ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className="text-xs font-semibold truncate">{isFa ? meta.titleFa : meta.titleEn}</span>
                        </div>
                        {hasAccess ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isFa ? 'مجاز' : 'Allowed'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {isFa ? 'مسدود' : 'Denied'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{isFa ? 'اختیارات و مجوزهای عملیاتی حساس' : 'Operational Feature Privileges'}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {getPermissionsStats(selectedUserForPermsView.permissions).featCount} / 7 {isFa ? 'مجاز' : 'Allowed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(FEATURE_METADATA) as Array<keyof FeaturePermissions>).map((key) => {
                    const meta = FEATURE_METADATA[key];
                    const Icon = meta.icon;
                    const hasAccess = selectedUserForPermsView.role === 'super_admin' || !!selectedUserForPermsView.permissions?.features?.[key];
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          hasAccess
                            ? 'bg-amber-950/15 border-amber-800/40 text-amber-300'
                            : 'bg-slate-900/40 border-slate-800/70 text-slate-500 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${hasAccess ? 'text-amber-400' : 'text-slate-600'}`} />
                          <span className="text-xs font-semibold truncate">{isFa ? meta.titleFa : meta.titleEn}</span>
                        </div>
                        {hasAccess ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isFa ? 'مجاز' : 'Allowed'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {isFa ? 'مسدود' : 'Denied'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400">
                {selectedUserForPermsView.role === 'super_admin' && (
                  <span className="text-amber-400">
                    {isFa ? 'توجه: نقش Super Admin به تمام بخش‌ها دسترسی نامحدود دارد.' : 'Super Admin has full access.'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedUserForPermsView(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    const u = selectedUserForPermsView;
                    setSelectedUserForPermsView(null);
                    handleOpenEditUser(u, 'permissions');
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ویرایش و شخصی‌سازی دسترسی‌ها' : 'Edit Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: MANUAL EXTEND EXPIRY (MONTH / DAY / HOUR / EXACT)                  */}
      {/* ========================================================================= */}
      {extendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0d121c] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'تنظیم و تمدید دستی تاریخ انقضا' : 'Manual Account Expiry Extension'}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{isFa ? 'کاربر:' : 'User:'}</span>
                    <span className="text-amber-300 font-mono font-bold">{extendingUser.username}</span>
                    <span>({extendingUser.fullName})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExtendingUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitManualExtend} className="p-6 space-y-4">
              {/* Current Expiry State */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">{isFa ? 'وضعیت فعلی انقضا:' : 'Current Status:'}</span>
                <div>{getExpiryDisplay(extendingUser)}</div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setExtendMode('relative')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition text-center ${
                    extendMode === 'relative'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'افزودن بر اساس ماه / روز / ساعت' : 'Add Months / Days / Hours'}
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMode('exact')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition text-center ${
                    extendMode === 'exact'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'تعیین تقویم و ساعت دقیق' : 'Exact Date & Time'}
                </button>
              </div>

              {extendMode === 'relative' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'ماه (Month):' : 'Months:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={extendMonths}
                        onChange={(e) => setExtendMonths(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'روز (Day):' : 'Days:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={extendDays}
                        onChange={(e) => setExtendDays(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isFa ? 'ساعت (Hour):' : 'Hours:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="72"
                        value={extendHours}
                        onChange={(e) => setExtendHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">{isFa ? 'میانبرها:' : 'Presets:'}</span>
                    {[
                      { label: isFa ? '+۱۲ ساعت' : '+12h', m: 0, d: 0, h: 12 },
                      { label: isFa ? '+۱ روز' : '+1d', m: 0, d: 1, h: 0 },
                      { label: isFa ? '+۷ روز' : '+7d', m: 0, d: 7, h: 0 },
                      { label: isFa ? '+۱ ماه' : '+1mo', m: 1, d: 0, h: 0 },
                      { label: isFa ? '+۳ ماه' : '+3mo', m: 3, d: 0, h: 0 },
                      { label: isFa ? '+۶ ماه' : '+6mo', m: 6, d: 0, h: 0 },
                      { label: isFa ? '+۱ سال' : '+1yr', m: 12, d: 0, h: 0 }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setExtendMonths(p.m);
                          setExtendDays(p.d);
                          setExtendHours(p.h);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'انتخاب تاریخ و ساعت دقیق:' : 'Exact Expiration Date & Time:'}
                  </label>
                  <input
                    type="datetime-local"
                    value={extendExactDateTime}
                    onChange={(e) => setExtendExactDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Calculated Expiry Preview */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'تاریخ جدید پس از اعمال:' : 'New Expiration Date:'}</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {new Date(
                    calculateTargetExpiryIso(
                      extendMode,
                      extendMonths,
                      extendDays,
                      extendHours,
                      extendExactDateTime,
                      extendingUser.expiresAt && new Date(extendingUser.expiresAt) > new Date()
                        ? new Date(extendingUser.expiresAt)
                        : new Date()
                    )
                  ).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExtendingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={extendSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  {extendSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isFa ? 'ثبت تمدید اعتبار' : 'Apply Extension'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
