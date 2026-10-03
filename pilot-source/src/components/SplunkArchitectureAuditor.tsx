import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Sliders, 
  FileText, 
  TrendingUp, 
  Clock, 
  Server, 
  Database, 
  Zap, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Radio, 
  Flame, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  BarChart3, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  RefreshCw,
  Printer,
  ShieldAlert,
  Workflow
} from 'lucide-react';
import { SplunkVisualArchitectureDiagram } from './SplunkVisualArchitectureDiagram';
import { SplunkExecutiveAuditReport } from './SplunkExecutiveAuditReport';
import { 
  SvaAuditCheckItem, 
  IndexerSizingBenchmark, 
  SearchConcurrencyBenchmark, 
  StorageVolumeMath, 
  FutureRiskItem, 
  SizingCalculatorInput, 
  SizingCalculatorResult 
} from '../types';
import { 
  INITIAL_SVA_AUDIT_CHECKS, 
  INITIAL_INDEXER_BENCHMARK, 
  INITIAL_SEARCH_BENCHMARK, 
  INITIAL_STORAGE_MATH, 
  FUTURE_ARCHITECTURAL_RISKS, 
  calculateSplunkArchitectureSizing 
} from '../data/architectureAuditData';

interface SplunkArchitectureAuditorProps {
  lang?: 'fa' | 'en';
}

export const SplunkArchitectureAuditor: React.FC<SplunkArchitectureAuditorProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';
  
  // Sub-tabs inside the Architecture Auditor
  const [activeSubTab, setActiveSubTab] = useState<'interactive_topology' | 'sva_audit' | 'resource_sizing' | 'future_risks' | 'growth_simulator' | 'executive_report'>('interactive_topology');

  // Filter for SVA checks
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [svaChecks, setSvaChecks] = useState<SvaAuditCheckItem[]>(INITIAL_SVA_AUDIT_CHECKS);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>('sva-storage-01');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Benchmarks State
  const [indexerBenchmark] = useState<IndexerSizingBenchmark>(INITIAL_INDEXER_BENCHMARK);
  const [searchBenchmark] = useState<SearchConcurrencyBenchmark>(INITIAL_SEARCH_BENCHMARK);
  const [storageMath] = useState<StorageVolumeMath>(INITIAL_STORAGE_MATH);
  const [futureRisks] = useState<FutureRiskItem[]>(FUTURE_ARCHITECTURAL_RISKS);

  // Interactive Architecture Simulator Input State
  const [simInput, setSimInput] = useState<SizingCalculatorInput>({
    dailyIngestGb: 350,
    peakFactor: 1.8,
    hotWarmRetentionDays: 30,
    coldRetentionDays: 90,
    concurrentUsers: 15,
    hasEnterpriseSecurity: true,
    hasItSI: false,
    multiSiteDr: true,
    replicationFactor: 3,
    searchFactor: 2,
    useSmartStore: false
  });

  const simResult: SizingCalculatorResult = calculateSplunkArchitectureSizing(simInput);

  // Calculate Overall SVA Architectural Score
  const totalChecks = svaChecks.length;
  const compliantChecks = svaChecks.filter(c => c.status === 'COMPLIANT').length;
  const warningChecks = svaChecks.filter(c => c.status === 'WARNING').length;
  const criticalChecks = svaChecks.filter(c => c.status === 'CRITICAL_VIOLATION').length;
  
  const architecturalScore = Math.round(
    ((compliantChecks * 1.0 + warningChecks * 0.5) / totalChecks) * 100
  );

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'A+ (Optimal SVA Tier)', color: 'text-emerald-400 bg-emerald-950 border-emerald-500/40' };
    if (score >= 75) return { label: 'B+ (Moderate SVA Gap)', color: 'text-amber-400 bg-amber-950 border-amber-500/40' };
    return { label: 'C (High Architecture Risk)', color: 'text-rose-400 bg-rose-950 border-rose-500/40' };
  };

  const scoreBadge = getScoreBadge(architecturalScore);

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  const filteredChecks = svaChecks.filter(c => {
    if (selectedCategory === 'ALL') return true;
    return c.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Splunk Certified Lead Architect Assessment Engine (Sirene Dark Luxury) */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border border-white/20 shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight sirene-text-gradient">
                {isFa 
                  ? 'پنل ممیزی و ارزیابی ارشد معماری اسپلانک (Splunk Enterprise Lead Architect Hub)' 
                  : 'Splunk Enterprise Lead Architect Audit & SVA Benchmark Engine'}
              </h1>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                SVA Tier C1/C11 Validated
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              {isFa
                ? 'ارزیابی جامع و موشکافانه معماری فعلی کلاستر، تطبیق با استانداردهای رسمی Splunk Validated Architectures (SVA)، بررسی فرمول‌های همزمانی جستجو، ظرفیت سخت‌افزاری IOPS/RAM/CPU، شناسایی گلوگاه‌های پنهان و پیش‌بینی ریسک‌های توسعه در افق ۳۰ تا ۳۶۵ روزه.'
                : 'Principal Architect-level audit suite benchmarked against Splunk Validated Architectures (SVA). Analyzes hardware sizing formulas, storage IOPS math, search concurrency headroom, and 365-day predictive growth bottlenecks.'}
            </p>
          </div>

          {/* SVA Compliance Score Card */}
          <div className="flex items-center gap-4 bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-xl shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">{isFa ? 'امتیاز انطباق با SVA:' : 'SVA Architecture Score:'}</span>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                <span className={architecturalScore >= 75 ? 'text-violet-400' : 'text-rose-400'}>{architecturalScore}</span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${scoreBadge.color}`}>
              {scoreBadge.label}
            </div>
          </div>
        </div>

        {/* Global Architecture Sub-Navigation Tabs - Sirene Segmented Control */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.08] text-xs">
          <button
            onClick={() => setActiveSubTab('interactive_topology')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'interactive_topology'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 font-extrabold border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>{isFa ? 'دایاگرام تعاملی معماری و نودها' : 'Interactive Topology Diagram'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 font-mono text-cyan-300 border border-white/10">Live Visual</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sva_audit')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'sva_audit'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isFa ? 'ممیزی لایه‌ها و تطبیق با SVA' : 'SVA Tier Compliance Audit'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 font-mono text-slate-300 border border-white/10">{totalChecks}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('resource_sizing')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'resource_sizing'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{isFa ? 'محاسبه منابع و تحلیل شکاف سخت‌افزار' : 'Hardware & Sizing Benchmark'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('future_risks')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'future_risks'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isFa ? 'پیش‌بینی ریسک‌ها و گلوگاه‌های آینده' : 'Predictive Risk Forecaster'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 font-mono">
              {futureRisks.length} Risks
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('growth_simulator')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'growth_simulator'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isFa ? 'شبیه‌ساز رشد دیتاسنتر (Sizer Calculator)' : 'Architecture Sizer & Simulator'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">Interactive</span>
          </button>

          <button
            onClick={() => setActiveSubTab('executive_report')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'executive_report'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/20'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isFa ? 'گزارش ارشد مدیریتی و نقشه راه ۹۰ روزه' : 'Executive Audit Report & Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-TAB 0: INTERACTIVE VISUAL TOPOLOGY & NODE INSPECTOR ==================== */}
      {activeSubTab === 'interactive_topology' && (
        <SplunkVisualArchitectureDiagram lang={lang} />
      )}

      {/* ==================== SUB-TAB 1: SVA COMPLIANCE AUDIT ==================== */}
      {activeSubTab === 'sva_audit' && (
        <div className="space-y-6">
          {/* Summary Matrix Cards - Sirene Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-[#0c101c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/30 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition">
              <div>
                <span className="text-slate-400 text-[11px] block">{isFa ? 'موارد منطبق با استاندارد:' : 'Fully Compliant:'}</span>
                <span className="text-xl font-black text-emerald-400">{compliantChecks} <span className="text-xs text-slate-500">/ {totalChecks}</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c101c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/30 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition">
              <div>
                <span className="text-slate-400 text-[11px] block">{isFa ? 'هشدارهای بهینه‌سازی:' : 'Warnings / Tuning:'}</span>
                <span className="text-xl font-black text-amber-400">{warningChecks}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c101c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/30 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition">
              <div>
                <span className="text-slate-400 text-[11px] block">{isFa ? 'نقض بحرانی استاندارد SVA:' : 'Critical Violations:'}</span>
                <span className="text-xl font-black text-rose-400">{criticalChecks}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c101c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/30 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition">
              <div>
                <span className="text-slate-400 text-[11px] block">{isFa ? 'دسته معماری منطبق:' : 'Target SVA Architecture:'}</span>
                <span className="text-base font-black text-cyan-300">SVA C11 (Multi-Site)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Tabs - Sirene Capsule Style */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c101c]/80 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.08] text-xs">
            <span className="text-slate-300 font-bold px-2">{isFa ? 'فیلتر بر اساس لایه معماری:' : 'Filter Architecture Tier:'}</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', labelFa: 'همه لایه‌ها', labelEn: 'All Tiers' },
                { id: 'STORAGE_RETENTION', labelFa: 'ذخیره‌سازی و دیسک (Storage)', labelEn: 'Storage & Retention' },
                { id: 'INGESTION_PIPELINE', labelFa: 'پایپ‌لاین دریافت لاگ (Ingestion)', labelEn: 'Ingestion Pipeline' },
                { id: 'SEARCH_TIER', labelFa: 'لایه سرچ و همزمانی (Search)', labelEn: 'Search Concurrency' },
                { id: 'HIGH_AVAILABILITY', labelFa: 'پایداری کلاستر (HA / DR)', labelEn: 'High Availability' },
                { id: 'SECURITY_RBAC', labelFa: 'امنیت و TLS', labelEn: 'Security & TLS' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-600/30 border border-white/20'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {isFa ? cat.labelFa : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Checks Detailed List - Sirene Cards */}
          <div className="space-y-3">
            {filteredChecks.map(check => {
              const isExpanded = expandedCheckId === check.id;

              const getStatusStyle = (status: SvaAuditCheckItem['status']) => {
                switch (status) {
                  case 'COMPLIANT':
                    return {
                      label: isFa ? 'منطبق بر SVA' : 'SVA Compliant',
                      bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
                      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    };
                  case 'WARNING':
                    return {
                      label: isFa ? 'نیاز به بهینه‌سازی' : 'Needs Optimization',
                      bg: 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
                      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
                    };
                  case 'CRITICAL_VIOLATION':
                    return {
                      label: isFa ? 'نقض بحرانی معماری' : 'Critical SVA Violation',
                      bg: 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
                      icon: <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                    };
                  default:
                    return {
                      label: isFa ? 'پیشنهاد معماری' : 'Opportunity',
                      bg: 'bg-violet-950/70 text-violet-300 border-violet-500/40',
                      icon: <Sparkles className="w-4 h-4 text-violet-400" />
                    };
                }
              };

              const style = getStatusStyle(check.status);

              return (
                <div
                  key={check.id}
                  className={`p-5 rounded-3xl bg-[#0c101c]/80 backdrop-blur-xl border transition-all duration-300 ${
                    check.status === 'CRITICAL_VIOLATION'
                      ? 'border-rose-500/50 shadow-[0_8px_30px_rgba(244,63,94,0.15)]'
                      : check.status === 'WARNING'
                      ? 'border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.1)]'
                      : 'border-white/[0.08] hover:border-violet-500/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.15)]'
                  }`}
                >
                  <div
                    onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{style.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white font-mono">
                            {isFa ? check.titleFa : check.titleEn}
                          </h3>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                            {check.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          <span className="text-slate-500">{isFa ? 'وضعیت فعلی در کلاستر:' : 'Current State:'} </span>
                          <span className="text-slate-200 font-medium">{check.currentValue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                      <span className={`px-3 py-1 rounded-full border text-[11px] font-bold font-mono flex items-center gap-1.5 ${style.bg}`}>
                        {style.label}
                      </span>
                      <button className="text-slate-400 hover:text-white p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Architectural Assessment & Conf Fix */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Best Practice Benchmark */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isFa ? 'معیار استاندارد Splunk Validated Architecture (SVA):' : 'Official SVA Best Practice:'}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{check.bestPracticeBenchmark}</p>
                        </div>

                        {/* Architectural Impact */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{isFa ? 'تحلیل ریسک و اثر معماری روی دیتاسنتر:' : 'Architectural Impact & Bottleneck:'}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{isFa ? check.impactFa : check.impactEn}</p>
                        </div>
                      </div>

                      {/* Remediation Plan */}
                      <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                        <div className="text-xs font-bold text-violet-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <span>{isFa ? 'دستورالعمل اجرایی معمار ارشد (Principal Architect Remediation):' : 'Architect Remediation Plan:'}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-sans">
                          {isFa ? check.remediationFa : check.remediationEn}
                        </p>
                      </div>

                      {/* Code/Conf Snippet if Available */}
                      {check.confSnippet && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>Target Configuration: <span className="text-violet-400">{check.relevantConfFile}</span></span>
                            <button
                              onClick={() => handleCopySnippet(check.id, check.confSnippet!)}
                              className="px-3 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-violet-300 text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedSnippetId === check.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedSnippetId === check.id ? (isFa ? 'کپی شد' : 'Copied!') : (isFa ? 'کپی کانفیگ' : 'Copy Conf')}</span>
                            </button>
                          </div>
                          <pre className="p-4 rounded-2xl bg-[#06080e] border border-white/[0.08] font-mono text-xs text-violet-200/90 overflow-x-auto text-left" dir="ltr">
                            {check.confSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: HARDWARE & SIZING BENCHMARK ==================== */}
      {activeSubTab === 'resource_sizing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Indexer Tier Sizing & IOPS Math - Sirene Glass Card */}
            <div className="sirene-card p-6 md:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{isFa ? 'محاسبات منابع سخت‌افزاری ایندکسرها' : 'Indexer Tier Sizing & IOPS'}</h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                  {indexerBenchmark.currentDailyIngestGb} GB/Day
                </span>
              </div>

              {/* Sizing Comparison Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'تعداد ایندکسر فعلی / پیشنهادی:' : 'Current / Recommended Nodes:'}</span>
                  <div className="text-base font-bold text-white mt-1">
                    <span className="text-rose-400">{indexerBenchmark.actualIndexerCount} Nodes</span>
                    <span className="text-slate-500 text-xs"> → </span>
                    <span className="text-emerald-400">{indexerBenchmark.recommendedIndexerCount} Nodes</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'هسته پردازنده (vCPU) هر ایندکسر:' : 'vCPU per Indexer:'}</span>
                  <div className="text-base font-bold text-white mt-1">
                    <span className="text-violet-300">{indexerBenchmark.coresPerIndexerCurrent} Cores</span>
                    <span className="text-slate-500 text-xs"> → </span>
                    <span className="text-emerald-400">{indexerBenchmark.coresPerIndexerRecommended} Cores</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'حافظه RAM هر ایندکسر:' : 'RAM per Indexer:'}</span>
                  <div className="text-base font-bold text-white mt-1">
                    <span className="text-violet-300">{indexerBenchmark.ramPerIndexerGbCurrent} GB</span>
                    <span className="text-slate-500 text-xs"> → </span>
                    <span className="text-emerald-400">{indexerBenchmark.ramPerIndexerGbRecommended} GB</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'پایپ‌لاین دریافت لاگ (pipelineSet):' : 'pipelineSet Count:'}</span>
                  <div className="text-base font-bold text-white mt-1">
                    <span className="text-violet-300">{indexerBenchmark.pipelineSetsConfigured} Set</span>
                    <span className="text-slate-500 text-xs"> → </span>
                    <span className="text-emerald-400">{indexerBenchmark.pipelineSetsRecommended} Sets</span>
                  </div>
                </div>
              </div>

              {/* IOPS Bottleneck Visualizer */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>{isFa ? 'توان سنجیده شده دیسک (Measured IOPS):' : 'Storage IOPS Measured vs Target:'}</span>
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{indexerBenchmark.iopsMeasured} / {indexerBenchmark.iopsRequired} IOPS</span>
                </div>
                <div className="w-full bg-[#06080e] rounded-full h-2.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-violet-500 h-full rounded-full"
                    style={{ width: `${(indexerBenchmark.iopsMeasured / indexerBenchmark.iopsRequired) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ⚠️ {isFa 
                    ? 'استوریج فعلی (SAS HDD) تنها توان ۴۵۰ IOPS را فراهم می‌کند. حداقل توان استاندارد برای باکت‌های Hot/Warm برابر ۱۲۰۰ IOPS است. این شکاف عامل اصلی تاخیر در پردازش است.'
                    : 'Storage provides 450 IOPS vs required 1200 IOPS for Hot/Warm buckets. Upgrade to All-Flash NVMe.'}
                </p>
              </div>
            </div>

            {/* Card 2: Search Head & Search Concurrency Formulas - Sirene Glass Card */}
            <div className="sirene-card p-6 md:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{isFa ? 'فرمول‌های همزمانی و سرچ‌های زمان‌بندی شده' : 'Search Concurrency Math & Limits'}</h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-violet-950/70 text-violet-300 border border-violet-500/30">
                  SHC Limits
                </span>
              </div>

              {/* Mathematical Formula Box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] font-mono text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px]">{isFa ? 'فرمول رسمی ظرفیت جستجوی همزمان اسپلانک:' : 'Official Splunk Concurrency Formula:'}</div>
                <div className="text-violet-300 font-bold break-all" dir="ltr">
                  max_searches = (max_searches_per_cpu × CPU_Cores) + base_max_searches
                </div>
                <div className="text-slate-400 text-[10px] pt-1" dir="ltr">
                  Calculation: (2 × 16 Cores) + 6 = <span className="text-emerald-400 font-bold">38 Max Searches</span>
                </div>
              </div>

              {/* Scheduled Searches Concurrency Alert */}
              <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'سقف سرچ‌های زمان‌بندی شده:' : 'Max Scheduled Searches (50%):'}</span>
                  <span className="text-lg font-bold text-white">{searchBenchmark.maxScheduledSearchesAllowed} Searches</span>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'نرخ پرش سرچ‌ها (Skip Rate):' : 'Search Skip Rate:'}</span>
                  <span className={`text-lg font-bold ${searchBenchmark.scheduledSearchSkippedRatePct > 1 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {searchBenchmark.scheduledSearchSkippedRatePct}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تحلیل سرچ‌های اسکجول و کوئری‌های ES:' : 'Scheduled Query Overload:'}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {isFa
                    ? 'در فواصل ربع ساعت، ۲۲ کوئری اسکجول همزمان فراخوانی می‌شوند در حالی که سقف مجاز ۱۹ است. ۵.۲٪ از جستجوها Skip شده‌اند. راهکار: افزایش سرچ‌هد به ۳ نود SHC و پخش کردن کرون با schedule_window=auto.'
                    : '22 scheduled searches running concurrently vs 19 allowed ceiling. 5.2% skip rate observed. Fix by deploying 3-node SHC and schedule_window=auto.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Storage Volume & Retention Math Breakdown - Sirene Glass Card */}
          <div className="sirene-card p-6 md:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{isFa ? 'محاسبات چرخه عمر داده و فضای ذخیره‌سازی (Retention & Storage Math)' : 'Data Lifecycle & Storage Math'}</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                RF = {storageMath.replicationFactor} | SF = {storageMath.searchFactor} | Ratio = {storageMath.compressionRatio * 100}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                <span className="text-slate-400 text-[11px] block">{isFa ? 'حجم Hot/Warm (۳۰ روز، NVMe):' : 'Hot/Warm (30 Days NVMe):'}</span>
                <span className="text-xl font-bold text-violet-300">{storageMath.hotWarmTotalTb} TB</span>
                <span className="text-[10px] text-slate-500 block mt-1">{isFa ? 'شامل ضریب رپلیکیشن RF=3' : 'Factoring RF=3'}</span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                <span className="text-slate-400 text-[11px] block">{isFa ? 'حجم Cold (۶۰ روز اضافی):' : 'Cold Path (60 Days HDD):'}</span>
                <span className="text-xl font-bold text-cyan-300">{storageMath.coldTotalTb} TB</span>
                <span className="text-[10px] text-slate-500 block mt-1">{isFa ? 'روی دیسک‌های پرظرفیت' : 'High Density Storage'}</span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                <span className="text-slate-400 text-[11px] block">{isFa ? 'مجموع دیسک محلی مورد نیاز:' : 'Total Local Disk Needed:'}</span>
                <span className="text-xl font-bold text-white">{storageMath.totalLocalDiskTb} TB</span>
                <span className="text-[10px] text-emerald-400 block mt-1">+20% Headroom Included</span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                <span className="text-slate-400 text-[11px] block">{isFa ? 'رشد سالانه دیتاسنتر:' : 'Annual Data Growth:'}</span>
                <span className="text-xl font-bold text-rose-400">{storageMath.annualStorageGrowthTb} TB/Yr</span>
                <span className="text-[10px] text-slate-500 block mt-1">{isFa ? 'پیشنهاد: SmartStore S3' : 'Target: S3 SmartStore'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: PREDICTIVE RISKS & EARLY WARNINGS ==================== */}
      {activeSubTab === 'future_risks' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c101c]/80 backdrop-blur-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="sirene-text-gradient">{isFa ? 'ماتریس پیش‌بینی گلوگاه‌ها و حوادث آتی (Early Warning System)' : 'Predictive Architectural Risk Matrix'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isFa 
                  ? 'این ریسک‌ها بر اساس الگوهای افزایش لاگ، فعال‌سازی ماژول‌های امنیتی و تحلیل دیسک/مموری برای ماه‌های آینده استخراج شده‌اند.'
                  : 'Predictive bottleneck modeling based on log trajectory, security module activation, and memory/disk degradation.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {futureRisks.map(risk => {
              const getProbabilityBadge = (prob: FutureRiskItem['probability']) => {
                switch (prob) {
                  case 'CERTAIN':
                    return { label: isFa ? 'قطعی ۱۰۰٪' : 'Certain (100%)', bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40' };
                  case 'HIGH':
                    return { label: isFa ? 'احتمال بالا' : 'High Probability', bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40' };
                  default:
                    return { label: isFa ? 'احتمال متوسط' : 'Medium Probability', bg: 'bg-violet-950/70 text-violet-300 border-violet-500/30' };
                }
              };

              const getHorizonLabel = (h: FutureRiskItem['horizon']) => {
                switch (h) {
                  case 'NEXT_30_DAYS': return isFa ? 'افق ۳۰ روزه' : 'Next 30 Days';
                  case 'NEXT_90_DAYS': return isFa ? 'افق ۹۰ روزه' : 'Next 90 Days';
                  case 'NEXT_180_DAYS': return isFa ? 'افق ۱۸۰ روزه' : 'Next 180 Days';
                  case 'WITHIN_1_YEAR': return isFa ? 'ظرف ۱ سال آینده' : 'Within 1 Year';
                }
              };

              const probBadge = getProbabilityBadge(risk.probability);

              return (
                <div
                  key={risk.id}
                  className="sirene-card p-5 md:p-6 flex flex-col justify-between space-y-4 hover:border-violet-500/40 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] text-violet-300 border border-white/[0.08]">
                          {getHorizonLabel(risk.horizon)}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug pt-1">
                          {isFa ? risk.titleFa : risk.titleEn}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-mono px-3 py-1 rounded-full border font-bold shrink-0 ${probBadge.bg}`}>
                        {probBadge.label}
                      </span>
                    </div>

                    {/* Trigger Condition */}
                    <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.06] text-xs space-y-1">
                      <span className="text-slate-400 text-[10px] block font-mono">{isFa ? 'شرایط وقوع حادثه (Trigger):' : 'Trigger Condition:'}</span>
                      <p className="text-slate-300">{isFa ? risk.triggerConditionFa : risk.triggerConditionEn}</p>
                    </div>

                    {/* Early Warning Signal */}
                    <div className="text-xs space-y-1 text-slate-400">
                      <span className="text-violet-300 font-bold text-[11px] block">{isFa ? 'نشانه‌های اولیه هشدار (Telemetry Warning):' : 'Early Warning Signs:'}</span>
                      <p className="text-slate-300 font-mono text-[11px]">{risk.architectEarlyWarningSign}</p>
                    </div>
                  </div>

                  {/* Proactive Remediation Action */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isFa ? 'اقدام پیشگیرانه پیشنهادی معمار ارشد:' : 'Proactive Architect Remediation:'}</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed text-[11px]">
                      {isFa ? risk.proactiveRemediationFa : risk.proactiveRemediationEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: ARCHITECTURE SIZER & GROWTH SIMULATOR ==================== */}
      {activeSubTab === 'growth_simulator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Inputs (5 Columns) - Sirene Glass Card */}
            <div className="lg:col-span-5 sirene-card p-6 md:p-7 space-y-5">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <span className="sirene-text-gradient">{isFa ? 'پارامترهای ورودی و سناریوی رشد سازمانی' : 'Simulation Inputs & Growth Factors'}</span>
                </h3>
              </div>

              {/* Slider 1: Daily Ingest GB */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{isFa ? 'حجم لاگ ورودی روزانه (Daily Ingest):' : 'Daily Ingest (GB/Day):'}</span>
                  <span className="font-mono text-violet-300 font-bold text-sm">{simInput.dailyIngestGb} GB/Day</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="50"
                  value={simInput.dailyIngestGb}
                  onChange={e => setSimInput({ ...simInput, dailyIngestGb: Number(e.target.value) })}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>50 GB</span>
                  <span>1,000 GB (1 TB)</span>
                  <span>3,000 GB (3 TB)</span>
                </div>
              </div>

              {/* Slider 2: Hot/Warm Retention Days */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{isFa ? 'ماندگاری Hot/Warm روی دیسک پرسرعت:' : 'Hot/Warm Retention (Days):'}</span>
                  <span className="font-mono text-cyan-300 font-bold">{simInput.hotWarmRetentionDays} {isFa ? 'روز' : 'Days'}</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="90"
                  step="1"
                  value={simInput.hotWarmRetentionDays}
                  onChange={e => setSimInput({ ...simInput, hotWarmRetentionDays: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Slider 3: Cold Retention Days */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{isFa ? 'ماندگاری Cold برای انطباق و بازرسی:' : 'Cold Retention (Days):'}</span>
                  <span className="font-mono text-emerald-400 font-bold">{simInput.coldRetentionDays} {isFa ? 'روز' : 'Days'}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="15"
                  value={simInput.coldRetentionDays}
                  onChange={e => setSimInput({ ...simInput, coldRetentionDays: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 4: Concurrent Search Users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{isFa ? 'تعداد کاربران و داشبوردهای همزمان:' : 'Concurrent Users / SOC Analysts:'}</span>
                  <span className="font-mono text-violet-300 font-bold">{simInput.concurrentUsers} {isFa ? 'کاربر' : 'Users'}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={simInput.concurrentUsers}
                  onChange={e => setSimInput({ ...simInput, concurrentUsers: Number(e.target.value) })}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08] text-xs">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-violet-500/30 transition">
                  <span className="text-slate-300 font-semibold">{isFa ? 'ماژول Splunk Enterprise Security (ES):' : 'Splunk Enterprise Security (ES):'}</span>
                  <input
                    type="checkbox"
                    checked={simInput.hasEnterpriseSecurity}
                    onChange={e => setSimInput({ ...simInput, hasEnterpriseSecurity: e.target.checked })}
                    className="w-4 h-4 accent-violet-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-violet-500/30 transition">
                  <span className="text-slate-300 font-semibold">{isFa ? 'کلاستر دو سایته (Multi-Site DR):' : 'Multi-Site Disaster Recovery (DR):'}</span>
                  <input
                    type="checkbox"
                    checked={simInput.multiSiteDr}
                    onChange={e => setSimInput({ ...simInput, multiSiteDr: e.target.checked })}
                    className="w-4 h-4 accent-violet-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-violet-500/30 transition">
                  <span className="text-slate-300 font-semibold">{isFa ? 'معماری هیبریدی SmartStore S3:' : 'Enable S3 SmartStore Hybrid:'}</span>
                  <input
                    type="checkbox"
                    checked={simInput.useSmartStore}
                    onChange={e => setSimInput({ ...simInput, useSmartStore: e.target.checked })}
                    className="w-4 h-4 accent-violet-500"
                  />
                </label>
              </div>
            </div>

            {/* Right Column: Calculated Sizing & BOM (7 Columns) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Sizing Telemetry Badges - Sirene Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'ایندکسرهای پیشنهادی:' : 'Recommended Indexers:'}</span>
                  <span className="text-xl font-black text-violet-300">{simResult.recommendedIndexers} Nodes</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{simResult.vCpuPerIndexer} vCPU | {simResult.ramGbPerIndexer}GB RAM</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'سرچ‌هدهای کلاستر (SHC):' : 'Search Heads (SHC):'}</span>
                  <span className="text-xl font-black text-cyan-300">{simResult.recommendedSearchHeads} Nodes</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{simResult.searchConcurrencyLimit} Concurrency</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'کالکتورهای SC4S / HF:' : 'Syslog / HF Nodes:'}</span>
                  <span className="text-xl font-black text-indigo-300">{simResult.recommendedHfSc4s} Nodes</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{simResult.networkBandwidthIngestGbps} Gbps Ingest</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                  <span className="text-slate-400 text-[10px] block">{isFa ? 'کل استوریج مورد نیاز:' : 'Total Storage Footprint:'}</span>
                  <span className="text-xl font-black text-emerald-400">
                    {(simResult.hotWarmStorageTbTotal + (simInput.useSmartStore ? simResult.smartStoreS3TbTotal : simResult.coldStorageTbTotal)).toFixed(1)} TB
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {simInput.useSmartStore ? 'SmartStore S3' : 'Direct Attached'}
                  </span>
                </div>
              </div>

              {/* Hardware Bill of Materials (BOM) Table - Sirene Card */}
              <div className="sirene-card p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'فهرست قطعات و سرورهای استاندارد (Hardware Bill of Materials - BOM)' : 'Hardware Bill of Materials (BOM)'}</span>
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="text-[11px] text-slate-400 bg-white/[0.02] border-b border-white/[0.08]">
                      <tr>
                        <th className="p-3">{isFa ? 'کامپوننت و لایه' : 'Component Tier'}</th>
                        <th className="p-3 text-center">{isFa ? 'تعداد نود' : 'Node Count'}</th>
                        <th className="p-3 text-center">{isFa ? 'مجموع Cores' : 'Total Cores'}</th>
                        <th className="p-3 text-center">{isFa ? 'مجموع RAM' : 'Total RAM'}</th>
                        <th className="p-3 text-center">{isFa ? 'استوریج (TB)' : 'Storage (TB)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-slate-300">
                      {simResult.totalHardwareBillOfMaterials.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-3 font-sans">
                            <div className="font-bold text-white">{item.component}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{item.recommendedRole}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-violet-300">{item.nodeCount}</td>
                          <td className="p-3 text-center text-cyan-300">{item.totalCores}</td>
                          <td className="p-3 text-center text-indigo-300">{item.totalRamGb} GB</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{item.storageTb} TB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Management Nodes Specifications List - Sirene Card */}
              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl space-y-3 text-xs">
                <span className="font-bold text-slate-200 block">{isFa ? 'مشخصات نودهای ارکستراسیون و مدیریت کلاستر:' : 'Management Tier Nodes:'}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono">
                  {simResult.recommendedMgmtNodes.map((m, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition">
                      <span className="font-bold text-violet-300 block">{m.name}</span>
                      <span className="text-slate-400 text-[10px]">{m.specs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: EXECUTIVE REPORT & ROADMAP ==================== */}
      {activeSubTab === 'executive_report' && (
        <SplunkExecutiveAuditReport lang={lang} />
      )}
    </div>
  );
};
