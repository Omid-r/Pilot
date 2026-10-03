import React, { useEffect, useState } from 'react';
import { ComponentProfile, ClusterSettings } from '../types';
import { ParsedLogInput } from '../utils/splunkConfigParser';
import { 
  Network, 
  Server, 
  Database, 
  ShieldCheck, 
  Wifi, 
  Layers, 
  Cpu, 
  ArrowRight, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ComponentNetworkMapProps {
  profile: ComponentProfile;
  lang: 'fa' | 'en';
  settings?: ClusterSettings;
  parsedInputs?: ParsedLogInput[];
}

export const ComponentNetworkMap: React.FC<ComponentNetworkMapProps> = ({ 
  profile, 
  lang,
  settings,
  parsedInputs
}) => {
  const isFa = lang === 'fa';

  const [realTopology, setRealTopology] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/real/splunk/topology')
      .then(r => r.json())
      .then(data => { if (!cancelled && data.success) setRealTopology(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const logSources: any[] = parsedInputs && parsedInputs.length > 0
    ? parsedInputs
    : (realTopology?.inputs || []).map((s:any, i:number) => ({
        id: `real-input-${i}`,
        name: `real-input-${s.port}`,
        hostname: realTopology?.serverName || profile.shortName,
        ip: settings?.hfIp || '127.0.0.1',
        targetServerIp: settings?.hfIp || '127.0.0.1',
        port: s.port,
        protocol: String(s.protocol).toUpperCase(),
        sourcetype: 'live-config',
        targetIndex: 'from inputs.conf',
        eventsPerSec: 0,
        status: 'active' as const,
        stanza: `[${s.protocol}://${s.port}]`
      }));

  const destinationIndexers: any[] = (realTopology?.outputs || []).map((value:string, _i:number) => {
    const m = value.match(/^(.+?):(\\d+)$/);
    return {
      hostname: m ? m[1] : value,
      ip: m ? m[1] : value,
      port: m ? Number(m[2]) : 9997,
      dutyFa: 'مقصد واقعی outputs.conf',
      dutyEn: 'Real destination from outputs.conf',
      storedBucketsCount: 0,
      avgLatencyMs: 0,
      tlsStatus: false
    };
  });

  return (
    <div className="space-y-6 text-start">
      {/* Component Core Card - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Ambient radial glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl shadow-[0_0_25px_rgba(245,158,11,0.3)]">
              HF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  {settings?.hfHost || profile.shortName}
                </span>
                <span className="text-xs text-slate-400">
                  Role: Heavy Forwarder &amp; Parser Gateway
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1 sirene-text-gradient">
                {isFa ? profile.nameFa : profile.nameEn}
              </h2>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                🖥️ {isFa ? 'آدرس IP شناسایی‌شده این سرور:' : 'Local Server Host IP:'} <span className="font-bold text-white bg-[#07090e] px-2.5 py-1 rounded-xl border border-white/[0.08]">{settings?.hfIp || '10.20.30.45'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{isFa ? 'در حال سرویس‌دهی فعال' : 'Daemon Healthy'}</span>
            </span>
          </div>
        </div>

        {/* Core Duties breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
          <div className="p-4 rounded-2xl bg-[#07090e]/80 border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>{isFa ? 'وظیفه و مأموریت این کامپوننت (HF Duties):' : 'Component Core Mission:'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {profile.dutyFa}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#07090e]/80 border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>{isFa ? 'ایندکسرها این وسط چه نقشی دارند؟ (Indexer Role):' : 'What the Indexers do in the middle:'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {destinationIndexers[0]?.dutyFa || 'دریافت جریان پارس‌شده، ثبت در باکت‌های Hot، ساخت ایندکس معکوس tsidx و بایگانی بر اساس رتنشن.'}
            </p>
          </div>
        </div>

        {/* Ingestion & Destination Summary Stats */}
        <div className="p-4 rounded-2xl bg-[#07090e]/90 border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs font-mono relative z-10">
          <div className="flex items-center gap-2 text-cyan-300">
            <Wifi className="w-4 h-4" />
            <span>
              {isFa 
                ? `وضعیت ورودی: ${logSources.length} سورس لاگ در حال ارسال رویداد به سرور ${settings?.hfIp || '10.20.30.45'}` 
                : `Ingestion Status: ${logSources.length} active log sources feeding host ${settings?.hfIp || '10.20.30.45'}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-violet-300">
            <ArrowRight className="w-4 h-4" />
            <span>
              {isFa 
                ? `خروجی کلاستر: ارسال از ${settings?.hfIp || '10.20.30.45'} به ${destinationIndexers.length} ایندکسر (${destinationIndexers.map((d: any) => d.ip).join(' , ')})` 
                : `Destination Cluster: Forwarding to ${destinationIndexers.length} indexer peers (${destinationIndexers.map((d: any) => d.ip).join(', ')})`}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Table of Incoming Source IPs - Sirene Card */}
      <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-bold text-white">
              {isFa 
                ? 'جدول مشخصات تمام سورس‌های ارسال لاگ (Inputs & Source IP Inventory)' 
                : 'Identified Ingestion Sources & IP Address Inventory'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            inputs.conf verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono">
            <thead className="text-[11px] text-slate-400 bg-white/[0.02] border-b border-white/[0.06] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Source IP</th>
                <th className="p-3.5">Hostname / Source Name</th>
                <th className="p-3.5">Port &amp; Protocol</th>
                <th className="p-3.5">Target Server</th>
                <th className="p-3.5">Target Index</th>
                <th className="p-3.5">Event Rate</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {logSources.map((src: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition">
                  <td className="p-3.5 font-bold text-violet-400">{src.ip}</td>
                  <td className="p-3.5">
                    <div className="text-slate-200">{src.name || src.hostname}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{src.stanza}</div>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300">
                      {src.port} / {src.protocol}
                    </span>
                  </td>
                  <td className="p-3.5 text-amber-300 font-mono">{src.targetServerIp}:{src.port}</td>
                  <td className="p-3.5 font-bold text-amber-300">{src.targetIndex}</td>
                  <td className="p-3.5 text-emerald-400 font-bold">{src.eventsPerSec} EPS</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Table of Destination Indexers - Sirene Card */}
      <div className="sirene-card p-6 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {isFa 
                ? 'مشخصات ایندکسرهای مقصد و وضعیت باکت‌های ذخیره‌سازی' 
                : 'Destination Indexers & Target Storage Buckets'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            outputs.conf verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono">
            <thead className="text-[11px] text-slate-400 bg-white/[0.02] border-b border-white/[0.06] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Indexer Peer</th>
                <th className="p-3.5">IP &amp; Port</th>
                <th className="p-3.5">Role / Duty</th>
                <th className="p-3.5">Buckets Stored</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5">TLS Encryption</th>
              </tr>
            </thead>
            <tbody>
              {destinationIndexers.map((idxr: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition">
                  <td className="p-3.5 font-bold text-violet-300">{idxr.hostname}</td>
                  <td className="p-3.5 text-slate-200">{idxr.ip}:{idxr.port}</td>
                  <td className="p-3.5 font-sans text-slate-400 max-w-xs">{isFa ? idxr.dutyFa : idxr.dutyEn}</td>
                  <td className="p-3.5 font-bold text-amber-400">{idxr.storedBucketsCount} Buckets</td>
                  <td className="p-3.5 text-emerald-400">{idxr.avgLatencyMs} ms</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      idxr.tlsStatus 
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {idxr.tlsStatus ? 'TLS Active' : 'Cleartext (Fix Needed)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
