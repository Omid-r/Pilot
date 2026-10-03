import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Key, 
  Lock, 
  RefreshCw, 
  Sparkles, 
  Calendar, 
  Layers, 
  Sliders, 
  ChevronRight, 
  CheckCircle2, 
  Check, 
  Copy, 
  Terminal, 
  ExternalLink,
  Flame,
  Activity,
  Zap,
  TrendingDown,
  Info
} from 'lucide-react';
import { SplunkCertificateItem, SplunkAgentComponentRole } from '../types';
import { INITIAL_SPLUNK_CERTIFICATES, computeCertificatePredictions } from '../data/certificateData';

interface SplunkCertificateAnalyzerProps {
  lang?: 'fa' | 'en';
}

export const SplunkCertificateAnalyzer: React.FC<SplunkCertificateAnalyzerProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';

  const [certificates, setCertificates] = useState<SplunkCertificateItem[]>(INITIAL_SPLUNK_CERTIFICATES);
  const [warningThreshold, setWarningThreshold] = useState<number>(30);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(10);
  const [selectedCert, setSelectedCert] = useState<SplunkCertificateItem | null>(INITIAL_SPLUNK_CERTIFICATES[0]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simulatedRenewalSuccess, setSimulatedRenewalSuccess] = useState<string | null>(null);

  const predictions = computeCertificatePredictions(certificates, warningThreshold, criticalThreshold);

  const filteredCerts = certificates.filter(c => {
    if (filterRole === 'all') return true;
    return c.componentRole === filterRole;
  });

  const getStatusBadge = (days: number) => {
    if (days <= criticalThreshold) {
      return {
        label: isFa ? `بحرانی (${days} روز مانده)` : `Critical (${days}d left)`,
        bg: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
        dot: 'bg-rose-500 animate-ping'
      };
    }
    if (days <= warningThreshold) {
      return {
        label: isFa ? `هشدار انقضا (${days} روز)` : `Warning (${days}d left)`,
        bg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        dot: 'bg-amber-400'
      };
    }
    return {
      label: isFa ? `معتبر و ایمن (${days} روز)` : `Valid (${days}d left)`,
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      dot: 'bg-emerald-400'
    };
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulateRenewCert = (certId: string) => {
    setCertificates(prev => prev.map(c => {
      if (c.id === certId) {
        return {
          ...c,
          daysRemaining: 365,
          totalValidityDays: 365,
          status: 'HEALTHY' as const,
          validTo: '2027-09-20'
        };
      }
      return c;
    }));

    setSimulatedRenewalSuccess(certId);
    setTimeout(() => setSimulatedRenewalSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Predictive Depletion Radar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0d1522] to-[#080d14] border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white">
                {isFa ? 'پایش جامع گواهینامه‌های SSL/TLS اسپلانک و تحلیل هوشمند زمان انقضا' : 'Splunk SSL/TLS Certificate Analyzer & Predictive Depletion Forecast'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isFa
                ? 'پایش خودکار چرخه حیات گواهینامه‌های امنیتی در تک‌تک نودهای اسپلانک (پورت‌های ۸۰۸۹، ۹۹۹۷، ۸۰۰۰، ۵۱۴) با آستانه هشدار سفارشی و پیش‌بینی زمان خاموشی خطوط لاگ.'
                : 'Real-time telemetry on mTLS and SSL cert lifecycles with predictive depletion algorithms preventing ingestion halts.'}
            </p>
          </div>

          {/* Admin Threshold Tuning */}
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-bold">{isFa ? 'آستانه هشدار ادمین:' : 'Thresholds:'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-semibold">{isFa ? 'هشدار زرد:' : 'Warn:'}</span>
              <select
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-bold outline-none"
              >
                <option value={60}>60 Days</option>
                <option value={45}>45 Days</option>
                <option value={30}>30 Days</option>
                <option value={20}>20 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-semibold">{isFa ? 'هشدار بحرانی قرمز:' : 'Critical:'}</span>
              <select
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-rose-300 font-bold outline-none"
              >
                <option value={15}>15 Days</option>
                <option value={10}>10 Days</option>
                <option value={7}>7 Days</option>
                <option value={3}>3 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Predictive Depletion Analysis Visual Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121c2c] to-[#0d1624] border border-cyan-500/30 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isFa ? 'تحلیل هوشمند وضعیت استهلاک زمانی و پیش‌بینی خاموشی پایپلاین' : 'Predictive Certificate Depletion & Outage Velocity'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {isFa ? 'محاسبه ریسک مسدود شدن دست‌تکانی TLS در صورت عدم تمدید' : 'Projected TLS Handshake Stall Date'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">{isFa ? 'شاخص ریسک کلاستر:' : 'Cluster Risk Score:'}</span>
              <div className={`px-3 py-1 rounded-full font-mono font-black text-xs border ${
                predictions.clusterIngestionRiskScore > 50
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
              }`}>
                {predictions.clusterIngestionRiskScore}% {predictions.clusterIngestionRiskScore > 50 ? 'HIGH RISK' : 'STABLE'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Countdown Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">{isFa ? 'نخستین موعد انقضا در کلاستر:' : 'First Projected Outage:'}</span>
              <div className="text-2xl font-mono font-black text-rose-400">
                {predictions.predictedDaysUntilFirstOutage} {isFa ? 'روز دیگر' : 'Days'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {isFa ? 'تاریخ وقوع:' : 'Exact Date:'} <strong className="text-white">{predictions.firstOutageDateStr}</strong>
              </div>
              <div className="text-[10px] text-amber-300/90 truncate font-mono mt-1">
                Target: {predictions.nextExpiringCert?.hostname}
              </div>
            </div>

            {/* Health Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-slate-500 text-[11px] block">{isFa ? 'توزیع سلامت سرتیفیکیت‌ها:' : 'Health Distribution:'}</span>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400">{isFa ? 'معتبر و پایدار:' : 'Healthy:'}</span>
                <span className="font-bold text-white">{predictions.healthyCerts}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-amber-400">{isFa ? 'هشدار نزدیک به انقضا:' : 'Warning Soon:'}</span>
                <span className="font-bold text-amber-300">{predictions.warningSoonCerts}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-rose-400">{isFa ? 'انقضای بحرانی فوری:' : 'Critical Expiring:'}</span>
                <span className="font-bold text-rose-300">{predictions.criticalExpiringCerts}</span>
              </div>
            </div>

            {/* AI Action Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'توصیه تحلیلی سیستم:' : 'AI Prescriptive Action:'}</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isFa ? predictions.recommendedActionSummaryFa : predictions.recommendedActionSummaryEn}
              </p>
              {predictions.criticalExpiringCerts > 0 && (
                <button
                  onClick={() => handleSimulateRenewCert(predictions.nextExpiringCert.id)}
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تمدید فوری سرتیفیکیت بحرانی' : 'Auto-Renew Expiring Cert'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {simulatedRenewalSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{isFa ? 'گواهینامه مورد نظر با موفقیت تجدید شد و اعتبار آن به ۳۶۵ روز افزایش یافت!' : 'Certificate successfully renewed for 365 days!'}</span>
        </div>
      )}

      {/* Main Grid: Certificate Inventory & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Certificate Inventory Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">{isFa ? 'فیلتر نقش:' : 'Filter:'}</span>
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isFa ? 'همه' : 'All'} ({certificates.length})
              </button>
              <button
                onClick={() => setFilterRole('indexer_node')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'indexer_node' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Indexers
              </button>
              <button
                onClick={() => setFilterRole('universal_forwarder')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'universal_forwarder' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Universal Forwarders
              </button>
              <button
                onClick={() => setFilterRole('syslog_collector')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterRole === 'syslog_collector' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Syslog (SC4S)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCerts.map((cert) => {
              const badge = getStatusBadge(cert.daysRemaining);
              const isSelected = selectedCert?.id === cert.id;

              return (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs font-mono">{cert.hostname}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {cert.certType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">{cert.friendlyName}</div>
                      <div className="text-[11px] font-mono text-slate-500 truncate max-w-md">{cert.certPath}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Days Remaining Pill */}
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold font-mono flex items-center gap-1.5 ${badge.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                        <span>{badge.label}</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateRenewCert(cert.id);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                        title={isFa ? 'تمدید خودکار گواهینامه' : 'Renew Certificate'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expiration Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Valid: {cert.validFrom}</span>
                      <span className="font-bold text-slate-300">Expires: {cert.validTo}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all ${
                          cert.daysRemaining <= criticalThreshold
                            ? 'bg-rose-500'
                            : cert.daysRemaining <= warningThreshold
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, (cert.daysRemaining / cert.totalValidityDays) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Certificate Deep-Dive Inspector */}
        <div className="space-y-4">
          {selectedCert ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">{isFa ? 'مشخصات فنی گواهینامه' : 'Certificate Specs'}</h3>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  getStatusBadge(selectedCert.daysRemaining).bg
                }`}>
                  {selectedCert.daysRemaining} {isFa ? 'روز مانده' : 'days left'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">{isFa ? 'صادرکننده (Issuer CA):' : 'Issuer CA:'}</span>
                  <div className="font-mono text-slate-300 text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800 mt-1 break-all">
                    {selectedCert.issuer}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block">{isFa ? 'عنوان موضوع (Subject DN):' : 'Subject DN:'}</span>
                  <div className="font-mono text-slate-300 text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800 mt-1 break-all">
                    {selectedCert.subject}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Key Algorithm</span>
                    <span className="text-cyan-400 font-bold">{selectedCert.keyType}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Signature Alg</span>
                    <span className="text-emerald-400 font-bold">{selectedCert.signatureAlgorithm}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">{isFa ? 'پورت‌های تحت پوشش این سرتیفیکیت:' : 'Secured Ports:'}</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCert.portsSecured.map(p => (
                      <span key={p} className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                        Port :{p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Impact Statement */}
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-[11px] space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isFa ? 'پیامد امنیتی انقضا در کلاستر:' : 'Cluster Ingestion Impact:'}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {isFa ? selectedCert.failureImpactFa : selectedCert.failureImpactEn}
                  </p>
                </div>

                {/* Remediation Command Snippet */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isFa ? 'دستور اعتبارسنجی و تمدید:' : 'Remediation Command:'}</span>
                    <button
                      onClick={() => handleCopyText(selectedCert.remediationCommand, selectedCert.id)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                    >
                      {copiedId === selectedCert.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === selectedCert.id ? 'کپی شد' : 'کپی'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap dir-ltr">
                    {selectedCert.remediationCommand}
                  </pre>
                </div>

                <button
                  onClick={() => handleSimulateRenewCert(selectedCert.id)}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isFa ? 'تجدید خودکار اعتبار این گواهینامه (+1 Year)' : 'Auto-Renew This Cert'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
              {isFa ? 'برای مشاهده جزئیات، روی یکی از سرتیفیکیت‌ها کلیک کنید.' : 'Select a certificate to inspect full details.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
