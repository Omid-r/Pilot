import React from 'react';
import { 
  ServerAssetNode, 
  SizingLOMInputs, 
  CalculatedSizingResult, 
  SocAnalyst,
  DEFAULT_SOC_ANALYSTS
} from '../data/splunkDeployerData';
import { 
  Users, 
  Search, 
  Cpu, 
  HardDrive, 
  Plus, 
  Trash2, 
  Check, 
  DollarSign, 
  X, 
  Sparkles,
  Sliders,
  FolderOpen
} from 'lucide-react';

interface SplunkArchitectAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'sh_soc' | 'storage_lifecycle' | 'license_pricing' | 'node_specs';
  onTabChange: (tab: 'sh_soc' | 'storage_lifecycle' | 'license_pricing' | 'node_specs') => void;
  sizingInputs: SizingLOMInputs;
  onUpdateSizingInputs: (inputs: SizingLOMInputs) => void;
  sizingResult: CalculatedSizingResult;
  assets: ServerAssetNode[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onUpdateNode: (id: string, field: keyof ServerAssetNode, value: any) => void;
  lang: 'fa' | 'en';
}

export const SplunkArchitectAssistantModal: React.FC<SplunkArchitectAssistantModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  sizingInputs,
  onUpdateSizingInputs,
  sizingResult,
  assets,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  lang
}) => {
  if (!isOpen) return null;

  const isFa = lang === 'fa';
  const [newAnalystName, setNewAnalystName] = React.useState<string>('');
  const [newAnalystRole, setNewAnalystRole] = React.useState<SocAnalyst['role']>('SOC Tier 1 Analyst');

  const activeNode = assets.find(a => a.id === selectedNodeId) || assets[0] || null;

  const handleAddAnalyst = () => {
    if (!newAnalystName.trim()) return;
    const newAnalyst: SocAnalyst = {
      id: `soc-${Date.now().toString().slice(-4)}`,
      name: newAnalystName.trim(),
      role: newAnalystRole,
      concurrentSearchesQuota: newAnalystRole.includes('Lead') || newAnalystRole.includes('Manager') ? 6 : 4,
      activeDashboards: 3
    };
    const updatedAnalysts = [...(sizingInputs.socAnalysts || []), newAnalyst];
    onUpdateSizingInputs({
      ...sizingInputs,
      socAnalysts: updatedAnalysts,
      searchUsers: updatedAnalysts.length
    });
    setNewAnalystName('');
  };

  const handleRemoveAnalyst = (id: string) => {
    const updated = (sizingInputs.socAnalysts || []).filter(a => a.id !== id);
    onUpdateSizingInputs({
      ...sizingInputs,
      socAnalysts: updated,
      searchUsers: Math.max(1, updated.length)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c121e] border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0e141c] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{isFa ? 'موتور محاسبات مهندسی و سایزینگ معماری اسپلانک' : 'Splunk Enterprise Architecture Sizing & LOM Engine'}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                  SVA Level-3
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'محاسبه رسمی LOM، استعلام نیازمندی‌ها، هزینه لایسنس، چرخه حیات باکت‌های Hot/Cold/Frozen، لودبالانسر سرچ و تخصیص منابع' 
                  : 'Official SVA LOM Sizing, License TCO, Bucket Lifecycles, Search Load Balancer & Node Configuration'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-[#080d15] px-4 overflow-x-auto">
          <button
            onClick={() => onTabChange('sh_soc')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sh_soc'
                ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isFa ? '۱. لایه سرچ، آنالیست‌های SOC و لودبالانسر' : '1. Search Tier, SOC Analysts & LB'}</span>
          </button>

          <button
            onClick={() => onTabChange('storage_lifecycle')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'storage_lifecycle'
                ? 'border-amber-400 text-amber-400 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>{isFa ? '۲. چرخه حیات باکت‌ها (Hot / Cold / Frozen)' : '2. Bucket Lifecycle & Storage'}</span>
          </button>

          <button
            onClick={() => onTabChange('license_pricing')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'license_pricing'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isFa ? '۳. محاسبه‌گر لایسنس و هزینه ۳ ساله (TCO)' : '3. License Pricing & 3-Year TCO'}</span>
          </button>

          <button
            onClick={() => onTabChange('node_specs')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'node_specs'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{isFa ? '۴. ویرایشگر سخت‌افزار نود انتخابی' : '4. Selected Node Hardware & IP'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* TAB 1: SEARCH HEAD, SOC ANALYSTS & SEARCH LOAD BALANCER */}
          {activeTab === 'sh_soc' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-2">
                <h4 className="font-bold text-sky-300 flex items-center gap-2 text-sm">
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>{isFa ? 'استعلام نیازمندی‌های لایه سرچ و کاربران SOC' : 'Search Tier & SOC Team Questionnaire'}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'بر اساس استاندارد ظرفیت‌سنجی رسمی اسپلانک، هر Search Head مجهز به ۱۶ هسته پردازشی می‌تواند حداکثر ۲۰ تا ۲۴ سرچ همزمان را پردازش کند. سیستم به طور خودکار نیاز به کلاسترینگ (SHC) و بالانسر ترافیک را تعیین می‌کند.'
                    : 'According to Splunk Capacity Planning, one standard 16-core Search Head can handle 20-24 concurrent searches. The system automatically sizes SHC nodes and Load Balancers.'}
                </p>
              </div>

              {/* Questionnaire Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    {isFa ? 'تعداد داشبوردهای بلادرنگ (Real-Time):' : 'Real-time Wallboards / Dashboards:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={sizingInputs.realTimeDashboardsCount || 3}
                      onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, realTimeDashboardsCount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs font-bold"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{isFa ? 'داشبورد' : 'panels'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {isFa ? 'تولید ~۲ سرچ بک‌گراند به ازای هر پنل' : '~2 background queries per panel'}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    {isFa ? 'تعداد جستجوهای موردی در ساعت (Ad-Hoc):' : 'Ad-hoc Searches per Hour:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={200}
                      step={5}
                      value={sizingInputs.adHocSearchesPerHour || 20}
                      onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, adHocSearchesPerHour: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs font-bold"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{isFa ? 'سرچ/ساعت' : 'q/hour'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {isFa ? 'بار سرچ در ساعات اوج حوادث' : 'Peak incident search load'}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    {isFa ? 'لود بالانسر اختصاصی سرچ (Load Balancer):' : 'Dedicated Search Load Balancer:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={sizingInputs.searchLoadBalancer?.type || 'nginx'}
                      onChange={(e) => onUpdateSizingInputs({
                        ...sizingInputs,
                        searchLoadBalancer: {
                          ...sizingInputs.searchLoadBalancer,
                          enabled: true,
                          type: e.target.value as any
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold"
                    >
                      <option value="nginx">NGINX Plus (Sticky Session)</option>
                      <option value="f5_bigip">F5 BIG-IP LTM (Enterprise VIP)</option>
                      <option value="haproxy">HAProxy Enterprise</option>
                      <option value="k8s_ingress">K8s Ingress Controller</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-cyan-400 block">
                    VIP: {sizingInputs.searchLoadBalancer?.vipIp || '192.168.10.30'}:8000
                  </span>
                </div>
              </div>

              {/* SOC Analysts Team List Management */}
              <div className="bg-[#090f19] p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>{isFa ? 'لیست اعضای تیم SOC و سهمیه سرچ هر نفر' : 'SOC Analyst Team & Search Quotas'}</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {isFa ? 'نام کارشناسان، نقش امنیتی و سقف سرچ‌های همزمان تخصیص‌یافته را مشخص کنید.' : 'Specify analyst names, security roles and concurrent search limits.'}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                    {sizingInputs.socAnalysts?.length || 0} {isFa ? 'کارشناس ثبت‌شده' : 'Analysts'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder={isFa ? 'نام و نام خانوادگی کارشناس (مثال: مهندس راد)' : 'Analyst Full Name (e.g. Alex Hunter)'}
                    value={newAnalystName}
                    onChange={(e) => setNewAnalystName(e.target.value)}
                    className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <select
                    value={newAnalystRole}
                    onChange={(e) => setNewAnalystRole(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                  >
                    <option value="SOC Tier 1 Analyst">SOC Tier 1 Analyst</option>
                    <option value="SOC Tier 2 / Incident Responder">SOC Tier 2 / Incident Responder</option>
                    <option value="Senior Threat Hunter">Senior Threat Hunter</option>
                    <option value="SOC Manager / Lead">SOC Manager / Lead</option>
                    <option value="Compliance & Audit Officer">Compliance &amp; Audit Officer</option>
                  </select>
                  <button
                    onClick={handleAddAnalyst}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isFa ? 'ثبت کارشناس' : 'Add Analyst'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {(sizingInputs.socAnalysts || []).map(analyst => (
                    <div key={analyst.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <div>
                          <span className="font-bold text-white block">{analyst.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{analyst.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 font-mono font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          {analyst.concurrentSearchesQuota} Searches Limit
                        </span>
                        <button
                          onClick={() => handleRemoveAnalyst(analyst.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE BUCKET LIFECYCLES */}
          {activeTab === 'storage_lifecycle' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'چرخه حیات باکت‌های ایندکسر و محاسبه ماندگاری دیسک' : 'Indexer Storage Bucket Lifecycles & Retention Calculator'}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'اسپلانک داده‌ها را به ترتیب در باکت‌های Hot (در حال نوشتن)، Warm (آماده سرچ روی SSD)، Cold (آرشیو قابل سرچ روی دیسک‌های HDD/SAS) و سپس Frozen (آرشیو سرد غیرقابل سرچ مستقیم یا SmartStore S3) منتقل می‌کند.'
                    : 'Splunk moves indexed data through Hot, Warm (fast NVMe), Cold (SAS HDD) and Frozen (Object Storage) tiers.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-xs">HOT / WARM</span>
                    <span className="text-white font-mono font-bold">{sizingInputs.hotWarmRetentionDays || 30} Days</span>
                  </div>
                  <input
                    type="range"
                    min={7}
                    max={180}
                    step={1}
                    value={sizingInputs.hotWarmRetentionDays || 30}
                    onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, hotWarmRetentionDays: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Required: <strong className="text-amber-300">{sizingResult.hotWarmStorageTB} TB</strong></span>
                    <span className="text-slate-500">NVMe SSD</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-400 font-bold text-xs">COLD TIER</span>
                    <span className="text-white font-mono font-bold">{sizingInputs.coldRetentionDays || 90} Days</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={365}
                    step={5}
                    value={sizingInputs.coldRetentionDays || 90}
                    onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, coldRetentionDays: Number(e.target.value) })}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Required: <strong className="text-sky-300">{sizingResult.coldStorageTB} TB</strong></span>
                    <span className="text-slate-500">SAS HDD RAID-6</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold text-xs">FROZEN ARCHIVE</span>
                    <span className="text-white font-mono font-bold">{sizingInputs.frozenRetentionDays || 365} Days</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={1825}
                    step={30}
                    value={sizingInputs.frozenRetentionDays || 365}
                    onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, frozenRetentionDays: Number(e.target.value) })}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Required: <strong className="text-purple-300">{sizingResult.frozenStorageTB} TB</strong></span>
                    <span className="text-slate-500">Object Storage</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-300 block">
                    {isFa ? 'مجموع کل فضای ذخیره‌سازی محاسبه‌شده کلاستر (Hot + Cold + Frozen):' : 'Total Aggregate Cluster Storage Sized:'}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isFa ? `با در نظر گرفتن Replication Factor = ${sizingInputs.replicationFactor} و فشرده‌سازی ۵۰ درصدی اسپلانک` : `Factoring RF=${sizingInputs.replicationFactor} and 50% indexing compression ratio`}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    {sizingResult.totalWithFrozenStorageTB} TB
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {(sizingResult.totalWithFrozenStorageTB / Math.max(1, sizingResult.recommendedIndexers)).toFixed(1)} TB / Indexer Peer
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LICENSE PRICING & 3-YEAR TCO */}
          {activeTab === 'license_pricing' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'محاسبه‌گر رسمی هزینه لایسنس اسپلانک (Splunk Enterprise Term License & TCO)' : 'Splunk Enterprise License & 3-Year TCO Calculator'}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'محاسبه دقیق هزینه لایسنس سالانه تجاری بر اساس سقف لاگ روزانه (GB/Day)، تخفیف پلکانی حجم (Volume Tier Discounts)، سطح پشتیبانی رسمی و پیش‌بینی سرمایه‌گذاری سخت‌افزار و استوریج برای ۳ سال.'
                    : 'Accurate annual commercial license estimation based on daily volume tiers, official enterprise support models, and 3-year hardware/storage Capex.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">
                      {isFa ? 'حجم لاگ روزانه خریداری‌شده لایسنس (GB/Day):' : 'Splunk Daily Ingest License Quota:'}
                    </label>
                    <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700">
                      {sizingInputs.dailyVolumeGB} GB / Day
                    </span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={2000}
                    step={10}
                    value={sizingInputs.dailyVolumeGB}
                    onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, dailyVolumeGB: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>10 GB (Small SOC)</span>
                    <span>500 GB (Enterprise)</span>
                    <span>2000 GB (Multi-TB SIEM)</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="font-bold text-white text-xs block">
                    {isFa ? 'سطح پشتیبانی و خدمات اسپلانک (Support Tier):' : 'Official Support & Maintenance Level:'}
                  </label>
                  <select
                    value={sizingInputs.licenseSupportLevel || 'Enterprise Standard 24x7'}
                    onChange={(e) => onUpdateSizingInputs({ ...sizingInputs, licenseSupportLevel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs font-bold"
                  >
                    <option value="Enterprise Standard 24x7">Enterprise Standard (24x7 Phone/Web Support + Updates)</option>
                    <option value="Enterprise Premium with Dedicated TAM">Enterprise Premium (24x7 + Dedicated TAM Technical Manager)</option>
                  </select>

                  <div className="text-[11px] font-mono text-emerald-400">
                    {isFa ? `نرخ تخفیف حجمی: $${sizingResult.licenseCost.costPerGBYearUSD} به ازای هر گیگابایت در سال` : `Volume Tier Rate: $${sizingResult.licenseCost.costPerGBYearUSD} / GB / Year`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/50 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">{isFa ? 'هزینه لایسنس سالانه:' : 'Annual License Cost:'}</span>
                  <div className="text-base font-mono font-bold text-emerald-400">
                    ${sizingResult.licenseCost.estimatedAnnualLicenseUSD.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">Splunk Enterprise Term</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">{isFa ? 'پشتیبانی سالانه:' : 'Annual Support:'}</span>
                  <div className="text-base font-mono font-bold text-sky-400">
                    ${sizingResult.licenseCost.supportCostAnnualUSD.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">24x7 SLA Guarantee</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">{isFa ? 'هزینه سرورها (Capex):' : 'Server Hardware Capex:'}</span>
                  <div className="text-base font-mono font-bold text-amber-400">
                    ${sizingResult.licenseCost.estimatedHardwareCapexUSD.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{assets.length} Bare-Metal Servers</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">{isFa ? 'هزینه استوریج (NVMe/SAS):' : 'Storage Media Capex:'}</span>
                  <div className="text-base font-mono font-bold text-purple-400">
                    ${sizingResult.licenseCost.estimatedStorageCapexUSD.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{sizingResult.totalWithFrozenStorageTB} TB All Tiers</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border-2 border-emerald-500 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-300 block">
                    {isFa ? 'مجموع پیش‌بینی کل هزینه مالکیت ۳ ساله پروژه (3-Year Enterprise TCO):' : 'Total 3-Year Projected Total Cost of Ownership (TCO):'}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isFa ? 'شامل لایسنس اسپلانک + پشتیبانی رسمی + سخت‌افزار سرورها + دیسک‌های NVMe/SAS' : 'Includes Splunk term license, 24x7 support, server chassis Capex & storage disks'}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    ${sizingResult.licenseCost.estimated3YearTcoUSD.toLocaleString()} USD
                  </div>
                  <span className="text-[10px] text-slate-400">Estimated Corporate Budget</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELECTED NODE HARDWARE & IP TUNER */}
          {activeTab === 'node_specs' && activeNode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>{isFa ? `تنظیمات سخت‌افزاری و آدرس‌دهی نود: ${activeNode.hostname}` : `Hardware & Network Tuner: ${activeNode.hostname}`}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Role: <span className="text-cyan-300 font-mono font-bold uppercase">{activeNode.role}</span> | Site: <span className="text-amber-300 font-mono">{activeNode.site}</span>
                  </p>
                </div>

                <select
                  value={selectedNodeId}
                  onChange={(e) => onSelectNode(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.hostname} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">Hostname:</label>
                  <input
                    type="text"
                    value={activeNode.hostname}
                    onChange={(e) => onUpdateNode(activeNode.id, 'hostname', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs font-bold"
                  />
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">Production IP (NIC 1):</label>
                  <input
                    type="text"
                    value={activeNode.ip}
                    onChange={(e) => onUpdateNode(activeNode.id, 'ip', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs font-bold"
                  />
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">LOM / iDRAC / iLO IP (Management):</label>
                  <input
                    type="text"
                    value={activeNode.lomIp || ''}
                    onChange={(e) => onUpdateNode(activeNode.id, 'lomIp', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs"
                  />
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">CPU Cores (vCPU):</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateNode(activeNode.id, 'cpuCores', Math.max(4, activeNode.cpuCores - 4))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                    >-</button>
                    <span className="flex-1 text-center font-mono font-bold text-white text-sm">{activeNode.cpuCores} Cores</span>
                    <button
                      onClick={() => onUpdateNode(activeNode.id, 'cpuCores', activeNode.cpuCores + 4)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                    >+</button>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">RAM (GB ECC):</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateNode(activeNode.id, 'ramGB', Math.max(8, activeNode.ramGB - 8))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                    >-</button>
                    <span className="flex-1 text-center font-mono font-bold text-white text-sm">{activeNode.ramGB} GB</span>
                    <button
                      onClick={() => onUpdateNode(activeNode.id, 'ramGB', activeNode.ramGB + 8)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                    >+</button>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 text-xs">Fast NVMe Disk (GB):</label>
                  <input
                    type="number"
                    step={100}
                    value={activeNode.storageNVMeGB}
                    onChange={(e) => onUpdateNode(activeNode.id, 'storageNVMeGB', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {isFa ? 'تمام تغییرات بلافاصله در نمودار شماتیک و متغیرهای نصب اعمال می‌شوند.' : 'Changes synchronized across schematic blueprint and deployment scripts.'}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isFa ? 'تایید و ذخیره در کلاستر' : 'Apply & Close'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
