import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Award, 
  Clock, 
  Key, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Lock, 
  RefreshCw,
  Fingerprint,
  Calendar,
  Layers,
  Server
} from 'lucide-react';
import { DigitalCertificateLicense } from '../types';
import { generatePemCertificateText, issueCustomCompanyLicense } from '../data/commercialLicense';

interface CommercialLicenseManagerProps {
  license: DigitalCertificateLicense;
  onUpdateLicense: (updated: DigitalCertificateLicense) => void;
  lang?: 'fa' | 'en';
}

export const CommercialLicenseManager: React.FC<CommercialLicenseManagerProps> = ({
  license,
  onUpdateLicense,
  lang = 'fa'
}) => {
  const isFa = lang === 'fa';
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [targetOrg, setTargetOrg] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ENTERPRISE_COMMERCIAL_GOLD' | 'ENTERPRISE_PLATINUM_SOC' | 'STANDARD_COMMERCIAL' | 'TRIAL_EVALUATION'>('ENTERPRISE_PLATINUM_SOC');
  const [selectedDays, setSelectedDays] = useState(365);
  const [nodeQuota, setNodeQuota] = useState(500);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setToastMsg(isFa ? 'با موفقیت در حافظه کپی شد.' : 'Copied to clipboard.');
    setTimeout(() => {
      setCopiedSection(null);
      setToastMsg(null);
    }, 2500);
  };

  const handleDownloadCertificate = () => {
    const certText = generatePemCertificateText(license);
    const blob = new Blob([certText], { type: 'application/x-pem-file;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SplunkDoctor-Certificate-${license.subject.organization.replace(/\s+/g, '_')}.crt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg(isFa ? 'گواهینامه رسمی با فرمت X.509 (.crt) دانلود شد.' : 'Certificate downloaded as .crt file.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleIssueNewCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrg.trim()) return;
    const newCert = issueCustomCompanyLicense(targetOrg.trim(), selectedTier, selectedDays, nodeQuota);
    onUpdateLicense(newCert);
    setShowIssueModal(false);
    setTargetOrg('');
    setToastMsg(isFa ? `گواهینامه دیجیتال رسمی برای سازمان ${targetOrg} با موفقیت صادر شد.` : `Digital certificate issued for ${targetOrg}.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const pemContent = generatePemCertificateText(license);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-bounce font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner: Commercial Account & Time-based Validity - Sirene Dark Luxury */}
      <div className="sirene-card relative overflow-hidden rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'سامانه تجاری با گواهینامه معتبر PKI' : 'Commercial Enterprise PKI Certificate'}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{license.validity.daysRemaining} {isFa ? 'روز اعتبار باقیمانده' : 'Days Remaining'}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-mono">
                {license.subject.subscriptionTier}
              </span>
            </div>

            <h2 className="text-xl lg:text-3xl font-black text-white tracking-tight sirene-text-gradient">
              {license.subject.organization}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isFa
                ? 'این نرم‌افزار تحت لایسنس تجاری و مبتنی بر سرتیفیکت دیجیتال رمزگذاری شده اختصاصی سازمان فعال است. کلیه ارتباطات ایجنت‌ها، مانیتورینگ هارت‌بیت و کنترل از راه دور بر بستر رمزگذاری شده mTLS 1.3 تضمین می‌گردد.'
                : 'Active under commercial enterprise subscription. Cryptographically signed X.509 digital license with zero-trust confidentiality and mTLS transit protection.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
            <button
              onClick={handleDownloadCertificate}
              className="px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isFa ? 'دانلود فایل سرتیفیکت (.crt)' : 'Download .crt Certificate'}</span>
            </button>
            <button
              onClick={() => setShowIssueModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Key className="w-4 h-4 text-violet-400" />
              <span>{isFa ? 'صدور گواهینامه برای شرکت جدید' : 'Issue New Organization Cert'}</span>
            </button>
          </div>
        </div>

        {/* Subscription Timer Bar */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono relative z-10">
          <div className="bg-[#07090e]/80 p-3.5 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] mb-1">{isFa ? 'شناسه سریال گواهینامه:' : 'Serial Number:'}</span>
            <span className="text-slate-200 font-bold break-all">{license.serialNumber}</span>
          </div>
          <div className="bg-[#07090e]/80 p-3.5 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] mb-1">{isFa ? 'سقف مجاز نودهای کلاستر:' : 'Licensed Node Quota:'}</span>
            <span className="text-amber-400 font-bold">{license.subject.nodeLimit} {isFa ? 'نود فعال' : 'Endpoints'}</span>
          </div>
          <div className="bg-[#07090e]/80 p-3.5 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] mb-1">{isFa ? 'تاریخ شروع اعتبار:' : 'Valid NotBefore:'}</span>
            <span className="text-slate-300">{new Date(license.validity.notBefore).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}</span>
          </div>
          <div className="bg-[#07090e]/80 p-3.5 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] mb-1">{isFa ? 'تاریخ پایان اعتبار:' : 'Valid NotAfter:'}</span>
            <span className="text-emerald-400 font-bold">{new Date(license.validity.notAfter).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}</span>
          </div>
        </div>
      </div>

      {/* Security & Zero-Trust Confidentiality Guarantees - Sirene Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sirene-card p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] flex items-start gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">
              {isFa ? 'حفظ ۱۰۰٪ محرمانگی داده‌ها (Zero-Trust)' : 'Zero-Trust Data Confidentiality'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isFa
                ? 'متن و محتوای لاگ‌های سازمانی هرگز به سرور مدیریت منتقل نمی‌شود؛ صرفاً هارت‌بیت، وضعیت صف‌ها و کانفیگ‌ها با هش محلی ارسال می‌شوند.'
                : 'Zero raw payload transit. Local PII and payload masking ensures corporate confidentiality.'}
            </p>
          </div>
        </div>

        <div className="sirene-card p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] flex items-start gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/25 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">
              {isFa ? 'رمزگذاری دوطرفه mTLS 1.3' : 'Mutual TLS 1.3 Authentication'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isFa
                ? 'ارتباط تک‌تک ایجنت‌های نصب‌شده بر روی Forwarderها و ایندکسرها با سرور پنل مدیریت از طریق گواهینامه متقابل X.509 احراز هویت می‌شود.'
                : 'Mutual client-server cryptographic handshake prevents rogue node injections or eavesdropping.'}
            </p>
          </div>
        </div>

        <div className="sirene-card p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border border-white/[0.08] flex items-start gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Server className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">
              {isFa ? 'استقرار تماماً در محیط محلی (On-Premises)' : 'Strict On-Premises Residency'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isFa
                ? 'سامانه بدون نیاز به اتصال به اینترنت و بدون خروج کوچکترین بایت اطلاعات از شبکه اختصاصی (Air-Gapped / Isolated SOC) کار می‌کند.'
                : 'Fully autonomous in air-gapped and isolated enterprise networks with no internet dependency.'}
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Technical View & Cryptographic Fingerprint */}
      <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-4 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Fingerprint className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {isFa ? 'مشخصات گواهینامه دیجیتال X.509 و اثر انگشت رمزنگاری (Fingerprint)' : 'X.509 Certificate Details & Cryptographic Fingerprint'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(pemContent, 'cert_pem')}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
            >
              {copiedSection === 'cert_pem' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isFa ? 'کپی متن PEM' : 'Copy PEM'}</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Fingerprint Box */}
        <div className="p-3.5 bg-[#07090e] rounded-2xl border border-white/[0.06] font-mono text-xs">
          <span className="text-slate-500 text-[11px] block mb-1">SHA-256 Certificate Fingerprint:</span>
          <span className="text-emerald-400 font-bold break-all select-all">{license.cryptography.sha256Fingerprint}</span>
        </div>

        {/* PEM View Container */}
        <div className="p-4 rounded-2xl bg-[#05070c] border border-white/[0.06] font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre leading-relaxed select-all dir-ltr shadow-inner">
          {pemContent}
        </div>
      </div>

      {/* Modal: Issue Custom Organization License - Sirene Style */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="sirene-card bg-[#0b0e17] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>{isFa ? 'صدور گواهینامه تجاری و اشتراک زمانی جدید' : 'Issue New Commercial Organization Cert'}</span>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueNewCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'نام سازمان / مشتری (Company / Organization Name):' : 'Organization Name:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? 'مثال: مرکز آپا / بانک سامان / همراه اول' : 'e.g. Acme Cyber Security SOC'}
                  value={targetOrg}
                  onChange={(e) => setTargetOrg(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#07090e] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isFa ? 'سطح اشتراک:' : 'Subscription Tier:'}
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e: any) => setSelectedTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#07090e] border border-white/[0.08] text-white text-xs focus:border-amber-500/60 focus:outline-none transition"
                  >
                    <option value="ENTERPRISE_PLATINUM_SOC">Enterprise Platinum SOC</option>
                    <option value="ENTERPRISE_COMMERCIAL_GOLD">Commercial Gold</option>
                    <option value="STANDARD_COMMERCIAL">Standard Commercial</option>
                    <option value="TRIAL_EVALUATION">Trial Evaluation (30 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isFa ? 'مدت اعتبار زمانی (روز):' : 'Validity Duration (Days):'}
                  </label>
                  <select
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#07090e] border border-white/[0.08] text-white text-xs focus:border-amber-500/60 focus:outline-none transition"
                  >
                    <option value={30}>۳۰ روز (آزمایشی / ماهانه)</option>
                    <option value={90}>۹۰ روز (سه ماهه)</option>
                    <option value={180}>۱۸۰ روز (شش ماهه)</option>
                    <option value={365}>۳۶۵ روز (یک ساله تجاری)</option>
                    <option value={730}>۷۳۰ روز (دو ساله نامحدود)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'سقف مجاز کامپوننت‌ها / ایجنت‌ها (Node Quota):' : 'Node Quota:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={nodeQuota}
                  onChange={(e) => setNodeQuota(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#07090e] border border-white/[0.08] text-white text-xs focus:border-amber-500/60 focus:outline-none transition"
                />
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-300/90 leading-relaxed">
                {isFa 
                  ? 'گواهینامه صادرشده به همراه امضای دیجیتال SHA-256 و کلیدهای mTLS مستقیماً فعال گشته و فایل آن قابل دانلود و تحویل به مشتری خواهد بود.'
                  : 'The generated certificate is signed with SHA-256 and will automatically bind to the customer deployment.'}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 transition"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] transition"
                >
                  {isFa ? 'تولید و صدور گواهینامه رسمی' : 'Issue & Sign Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
