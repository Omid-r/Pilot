import React, { useState } from 'react';
import { ComponentProfile, ClusterSettings } from '../types';
import { ParsedLogInput } from '../utils/splunkConfigParser';
import { 
  Server, 
  Shield, 
  Database, 
  ArrowRight, 
  ArrowDown,
  Lock, 
  Unlock, 
  Layers, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Terminal,
  ExternalLink,
  Wifi
} from 'lucide-react';

interface TopologyGraphProps {
  profile: ComponentProfile;
  configs: Record<string, string>;
  isTlsEnabled: boolean;
  onSelectConfig: (filename: string) => void;
  lang: 'fa' | 'en';
  settings?: ClusterSettings;
  parsedInputs?: ParsedLogInput[];
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  profile,
  configs,
  isTlsEnabled,
  onSelectConfig,
  lang,
  settings,
  parsedInputs
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('hf-core');

  const isFa = lang === 'fa';

  // Use dynamic parsed inputs if available, otherwise fallback to profile's inputs
  const logSourcesList = parsedInputs && parsedInputs.length > 0 ? parsedInputs : profile.incomingLogSources.map((s, i) => ({
    id: `src-${i}`,
    name: s.hostname,
    hostname: s.hostname,
    ip: s.ip,
    targetServerIp: settings?.hfIp || '10.20.30.45',
    port: s.port,
    protocol: (s.port === 514 ? 'UDP' : s.port === 1514 ? 'TCP' : s.port === 8088 ? 'HEC/HTTPS' : 'SplunkTCP') as any,
    sourcetype: s.port === 514 ? 'pan:traffic' : s.port === 1514 ? 'wazuh:alerts' : 'splunk_data',
    targetIndex: s.targetIndex,
    eventsPerSec: s.eventsPerSec,
    status: 'active' as const,
    stanza: `[${s.port === 514 ? 'udp://514' : s.port === 1514 ? 'tcp://1514' : 'splunktcp://9997'}]`
  }));

  // Dynamic indexers from settings
  const destinationIndexersList = [
    {
      hostname: settings?.idx1Host || 'idx01-site1.cluster.splunk',
      ip: settings?.idx1Ip || '10.20.30.50',
      port: 9997,
      clusterRole: isFa ? 'نود ایندکسر اول (Peer 01)' : 'Indexer Peer 01',
      storedBucketsCount: 1420,
      avgLatencyMs: 1.8
    },
    {
      hostname: settings?.idx2Host || 'idx02-site1.cluster.splunk',
      ip: settings?.idx2Ip || '10.20.30.51',
      port: 9997,
      clusterRole: isFa ? 'نود ایندکسر دوم (Peer 02)' : 'Indexer Peer 02',
      storedBucketsCount: 1395,
      avgLatencyMs: 2.1
    }
  ];

  return (
    <div className="bg-[#0e141c] border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

      {/* Header with legend and status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isFa ? 'دایاگرام معماری، جریان بسته‌ها و توپولوژی کلاستر اسپلانک' : 'Splunk Cluster Architecture & Telemetry Pipeline Diagram'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'نمایش تعاملی سورس‌ها، پورت‌های ورودی، پایپلاین پارس، صف‌ها، کانال‌های فورواردینگ و استوریج ایندکسرها'
              : 'Interactive visualization of log sources, ingestion ports, parsing pipeline, queues, forwarding channels, and indexer storage.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>{isFa ? 'لاگ سورس‌ها' : 'Sources'}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{isFa ? 'پایپلاین پارس' : 'Parsing Engine'}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>{isFa ? 'ایندکسرها' : 'Indexers'}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className={`flex items-center gap-1.5 font-medium ${isTlsEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isTlsEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isTlsEnabled ? (isFa ? 'رمزنگاری TLS فعال' : 'TLS Encrypted') : (isFa ? 'ترافیک متن‌آشکار' : 'Cleartext Channel')}</span>
          </div>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="py-6 relative z-10" dir="ltr">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Column 1: Ingestion Sources (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between mb-1" dir={isFa ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span>{isFa ? 'سورس‌های ارسال لاگ (Inputs)' : 'Incoming Log Sources'}</span>
              </div>
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.2 rounded-md font-mono">
                {logSourcesList.length} {isFa ? 'ورودی' : 'Inputs'}
              </span>
            </div>

            {logSourcesList.map((source, idx) => (
              <div 
                key={source.id || idx}
                onClick={() => setSelectedNode(`source-${idx}`)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-start ${
                  selectedNode === `source-${idx}`
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
                dir={isFa ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-800 text-cyan-400">
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-200">{source.ip}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {source.protocol}:{source.port}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-1 font-medium">
                  {source.name || source.hostname}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-800/80 font-mono">
                  <span>idx: {source.targetIndex}</span>
                  <span className="text-emerald-400 font-semibold">{source.eventsPerSec} EPS</span>
                </div>
                <div className="text-[9.5px] font-mono text-cyan-400/90 mt-1 flex items-center justify-between">
                  <span>{isFa ? 'مقصد سرور:' : 'Target:'} {source.targetServerIp}:{source.port}</span>
                  <span className="text-slate-500">{source.stanza}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Connector 1: Sources -> HF */}
          <div className="flex lg:hidden justify-center items-center py-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-amber-400 font-mono">
              <span>INBOUND (514/1514/9997)</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>

          {/* Desktop Connector 1: Sources -> HF (Arrow firmly points RIGHT into HF) */}
          <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-wider bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded">
                INBOUND
              </span>
              <div className="flex items-center gap-1 my-1">
                <div className="w-6 h-[2px] bg-gradient-to-r from-cyan-500 to-amber-500 animate-pulse"></div>
                <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                514/1514/9997
              </span>
            </div>
          </div>

          {/* Column 2: Heavy Forwarder Ingestion & Pipeline (4 cols) */}
          <div className="lg:col-span-4" dir={isFa ? 'rtl' : 'ltr'}>
            <div 
              onClick={() => setSelectedNode('hf-core')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedNode === 'hf-core'
                  ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-sm">
                    HF
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {settings?.hfHost ? `Heavy Forwarder (${settings.hfHost.split('.')[0].toUpperCase()})` : profile.nameFa}
                    </h4>
                    <span className="text-[11px] font-mono text-amber-400 block">
                      {settings?.hfHost || profile.shortName}
                    </span>
                    <span className="inline-block mt-1 text-[10px] font-mono bg-emerald-950 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded">
                      🖥️ {isFa ? 'آدرس این سرور:' : 'Host Server IP:'} {settings?.hfIp || '10.20.30.45'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/60 border border-amber-800/60 text-amber-300">
                  {isFa ? 'کامپوننت فعال' : 'Active Node'}
                </span>
              </div>

              {/* Duties summary banner */}
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed mb-3">
                <strong className="text-amber-400 block mb-1">
                  {isFa ? '⚙️ وظیفه اصلی هوی‌فورواردر:' : '⚙️ Core Heavy Forwarder Role:'}
                </strong>
                {profile.dutyFa}
              </div>

              {/* Internal Pipelines & Queues */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>{isFa ? 'خطوط لوله پردازش (Pipelines):' : 'Processing Pipelines:'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectConfig('props.conf'); }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>props.conf</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">{isFa ? 'پایپلاین ۱' : 'Pipeline 1'}</div>
                    <div className="font-mono text-slate-200 text-[11px] font-semibold">parsingQueue</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Aggregator / Regex</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">{isFa ? 'پایپلاین ۲' : 'Pipeline 2'}</div>
                    <div className="font-mono text-slate-200 text-[11px] font-semibold">tcpoutQueue</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">autoLB / TLS Route</div>
                  </div>
                </div>

                {/* Active Add-ons tags */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 mb-1.5">{isFa ? 'اد‌آن‌ها و TAهای فعال:' : 'Active TAs & Add-ons:'}</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.activeAddons.map((ta, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {ta}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Connector 2: HF -> Indexers */}
          <div className="flex lg:hidden justify-center items-center py-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-purple-400 font-mono">
              <span>OUTBOUND (9997 TCP)</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>

          {/* Desktop Connector 2: HF -> Indexers (Arrow firmly points RIGHT into Indexers) */}
          <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`p-1.5 rounded-full border ${isTlsEnabled ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-rose-950 border-rose-500 text-rose-400 animate-bounce'}`}>
                {isTlsEnabled ? <Lock className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[9px] font-mono text-purple-400 font-bold tracking-wider bg-purple-950/80 border border-purple-800 px-1.5 py-0.5 rounded">
                OUTBOUND
              </span>
              <div className="flex items-center gap-1 my-1">
                <div className="w-6 h-[2px] bg-gradient-to-r from-amber-500 to-purple-500 animate-pulse"></div>
                <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                9997 TCP
              </span>
            </div>
          </div>

          {/* Column 3: Destination Indexers & Storage (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between mb-1" dir={isFa ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>{isFa ? 'ایندکسرهای مقصد (Indexers)' : 'Destination Indexers'}</span>
              </div>
              <span className="text-[10px] bg-purple-950 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded-md font-mono">
                {destinationIndexersList.length} {isFa ? 'گره' : 'Peers'}
              </span>
            </div>

            {destinationIndexersList.map((idxr, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedNode(`indexer-${idx}`)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-start ${
                  selectedNode === `indexer-${idx}`
                    ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
                dir={isFa ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-purple-900/50 text-purple-300">
                      <Database className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-200">{idxr.hostname}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    :{idxr.port}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-amber-400 font-semibold mt-1">
                  IP: {idxr.ip}
                </div>
                <div className="text-[10px] text-purple-300 mt-0.5">
                  {idxr.clusterRole}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-800 font-mono">
                  <span>{idxr.storedBucketsCount} Buckets</span>
                  <span className="text-emerald-400">{idxr.avgLatencyMs}ms ping</span>
                </div>
              </div>
            ))}

            {/* Storage Lifecycle Mini Explainer */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]" dir={isFa ? 'rtl' : 'ltr'}>
              <div className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>{isFa ? 'چرخه حیات باکت‌ها (Bucket Lifecycle):' : 'Bucket Storage Lifecycle:'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1.5">
                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">Hot</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Warm</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">Cold</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Frozen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-start text-xs relative z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">
                {selectedNode === 'hf-core' 
                  ? (isFa ? 'جزئیات فنی وظیفه Heavy Forwarder در معماری SOC' : 'Heavy Forwarder Technical Details')
                  : selectedNode.startsWith('indexer-')
                  ? (isFa ? 'نقش و وظیفه ایندکسر (Indexer) در این میان چیست؟' : 'What is the exact role of the Indexer here?')
                  : (isFa ? 'مشخصات سورس ارسال لاگ (Log Ingestion Source)' : 'Incoming Log Source Specification')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {selectedNode}
            </span>
          </div>

          {selectedNode === 'hf-core' && (
            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                <strong>{isFa ? 'وظایف تفکیک‌شده Heavy Forwarder:' : 'HF Responsibilities:'}</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pr-2">
                <li>
                  <strong className="text-slate-200">{isFa ? 'جداسازی رویدادها (Event Breaking):' : 'Event Boundary:'}</strong> {isFa ? 'برش صحیح خطوط لاگ چندخطی با regex های موجود در props.conf' : 'Splits multiline records with regex.'}
                </li>
                <li>
                  <strong className="text-slate-200">{isFa ? 'پالایش و کاهش حجم (Data Filtering):' : 'Filtering:'}</strong> {isFa ? 'حذف ترافیک هرزنامه (رویدادهای دیباگ یا تکراری) با ارسال به nullQueue قبل از خروج' : 'Sends noisy debug events to nullQueue.'}
                </li>
                <li>
                  <strong className="text-slate-200">{isFa ? 'ماسک کردن داده‌های حساس (PII Masking):' : 'PII Masking:'}</strong> {isFa ? 'جایگزینی پسوردها، توکن‌ها و شماره کارت‌های اعتباری با [MASKED] در transforms.conf' : 'Masks secrets, tokens, credit card digits.'}
                </li>
                <li>
                  <strong className="text-slate-200">{isFa ? 'توازن بار (autoLB):' : 'Load Balancing:'}</strong> {isFa ? `تقسیم متوازن بسته‌ها میان ایندکسرهای ${settings?.idx1Ip || '10.20.30.50'} و ${settings?.idx2Ip || '10.20.30.51'} هر ۱۵ ثانیه` : `Balances events across indexers ${settings?.idx1Ip || '10.20.30.50'} and ${settings?.idx2Ip || '10.20.30.51'}.`}
                </li>
              </ul>
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => onSelectConfig('inputs.conf')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3" />
                  <span>{isFa ? 'مشاهده inputs.conf' : 'View inputs.conf'}</span>
                </button>
                <button 
                  onClick={() => onSelectConfig('outputs.conf')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3" />
                  <span>{isFa ? 'مشاهده outputs.conf' : 'View outputs.conf'}</span>
                </button>
              </div>
            </div>
          )}

          {selectedNode.startsWith('indexer-') && (
            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p className="text-purple-300 font-semibold">
                {isFa ? '💡 ایندکسر (Indexer) این وسط دقیقاً چه کار می‌کند؟' : '💡 What does the Indexer do in this middle layer?'}
              </p>
              <p className="text-slate-400">
                {isFa
                  ? 'ایندکسر قلب تپنده ذخیره‌سازی و جستجوی اسپلانک است. وقتی لاگ‌ها از Heavy Forwarder می‌رسند، ایندکسر نیازی به پارس سنگین ندارد (چون HF قبلاً خطوط را شکسته است). ایندکسر مراحل زیر را انجام می‌دهد:'
                  : 'The Indexer is the core storage and search engine. Since HF pre-parsed events, the indexer executes:'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="font-bold text-amber-400">{isFa ? '۱. نوشتن داده خام' : '1. Raw Ingestion'}</div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'فشرده‌سازی با الگوریتم zstandard و ذخیره در فایل journal.zst داخل Hot Bucket.' : 'Compresses into journal.zst in Hot bucket.'}
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="font-bold text-cyan-400">{isFa ? '۲. ساخت درخت معکوس tsidx' : '2. Inverted Index (tsidx)'}</div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'استخراج کلمات، ساخت دیکشنری کلیدواژه‌ها و آدرس‌دهی زمانی برای جستجوی میلی‌ثانیه‌ای.' : 'Tokenizes words into inverted index trees for fast search.'}
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="font-bold text-purple-400">{isFa ? '۳. رپلیکیشن و اجرای Map-Reduce' : '3. Replication & Search'}</div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'ارسال کپی باکت به نود همتا روی پورت ۹۸۸۷ و پاسخگویی به کوئری‌های سرچ‌هد روی پورت ۸۰۸۹.' : 'Replicates slices on 9887 and executes map-reduce for SH.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedNode.startsWith('source-') && (
            <div className="space-y-1.5 text-slate-300">
              {(() => {
                const sIdx = parseInt(selectedNode.replace('source-', ''), 10);
                const src = profile.incomingLogSources[sIdx];
                if (!src) return null;
                return (
                  <div>
                    <div className="text-cyan-300 font-semibold text-xs mb-1">
                      {src.deviceType} ({src.ip}:{src.port})
                    </div>
                    <div className="text-slate-400 text-[11px]">{src.notesFa}</div>
                    <div className="flex gap-4 text-[11px] font-mono text-slate-300 mt-2">
                      <span>Index: <strong className="text-amber-300">{src.targetIndex}</strong></span>
                      <span>Sourcetype: <strong className="text-amber-300">{src.targetSourcetype}</strong></span>
                      <span>Protocol: <strong>{src.protocol.toUpperCase()}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
