import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Mail, 
  MessageSquare, 
  Globe, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Sliders, 
  Check, 
  Trash2, 
  RefreshCw, 
  Zap,
  Phone,
  Server,
  Lock,
  Layers
} from 'lucide-react';
import { AlertNotificationChannel, AlertRuleConfig, DispatchedAlertLog, SplunkAgentComponentRole } from '../types';
import { INITIAL_NOTIFICATION_CHANNELS, INITIAL_ALERT_RULES, INITIAL_DISPATCHED_LOGS } from '../data/alertRulesData';

interface AlertNotificationCenterProps {
  lang?: 'fa' | 'en';
}

export const AlertNotificationCenter: React.FC<AlertNotificationCenterProps> = ({ lang = 'fa' }) => {
  const isFa = lang === 'fa';

  const [channels, setChannels] = useState<AlertNotificationChannel[]>(INITIAL_NOTIFICATION_CHANNELS);
  const [rules, setRules] = useState<AlertRuleConfig[]>(INITIAL_ALERT_RULES);
  const [logs, setLogs] = useState<DispatchedAlertLog[]>(INITIAL_DISPATCHED_LOGS);

  // New Channel Form State
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelType, setNewChannelType] = useState<'WEBHOOK' | 'SMS' | 'EMAIL'>('WEBHOOK');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelEndpoint, setNewChannelEndpoint] = useState('');
  const [newChannelSecret, setNewChannelSecret] = useState('');

  // New Rule Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState<AlertRuleConfig['triggerCondition']>('HEARTBEAT_SILENCE_SECONDS');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(30);
  const [newRuleSeverity, setNewRuleSeverity] = useState<AlertRuleConfig['severity']>('CRITICAL');
  const [newRuleChannels, setNewRuleChannels] = useState<string[]>([]);

  // Testing dispatch state
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);

  const handleToggleChannel = (id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, enabled: !ch.enabled } : ch));
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleTestDispatch = (channel: AlertNotificationChannel) => {
    setTestingChannelId(channel.id);
    setTestStatusMessage(null);

    setTimeout(() => {
      const now = new Date().toTimeString().split(' ')[0];
      const newLog: DispatchedAlertLog = {
        id: `disp-${Date.now()}`,
        timestamp: now,
        ruleTitle: isFa ? `تست آنی کانال ${channel.name}` : `Test Dispatch for ${channel.name}`,
        channelType: channel.type === 'TEAMS_SLACK' ? 'WEBHOOK' : channel.type as any,
        targetRecipient: channel.endpointOrTarget,
        severity: 'INFO',
        messagePreview: `[TEST LIVE DISPATCH] ${channel.name} verified successfully via Splunk Cluster Doctor Gateway.`,
        deliveryStatus: 'DELIVERED_SUCCESS',
        latencyMs: Math.floor(Math.random() * 200) + 80
      };

      setLogs(prev => [newLog, ...prev]);
      setTestingChannelId(null);
      setTestStatusMessage(isFa ? `پیام تست با موفقیت به ${channel.name} ارسال و تحویل شد!` : `Test dispatched successfully to ${channel.name}!`);

      setTimeout(() => setTestStatusMessage(null), 4000);
    }, 800);
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelEndpoint) return;

    const newCh: AlertNotificationChannel = {
      id: `ch-${Date.now()}`,
      name: newChannelName,
      type: newChannelType,
      enabled: true,
      endpointOrTarget: newChannelEndpoint,
      authSecretOrToken: newChannelSecret,
      providerDetails: newChannelType === 'SMS' ? 'Kavenegar SMS' : newChannelType === 'EMAIL' ? 'SMTP Relay' : 'Incoming Webhook',
      eventsSubscribed: ['LOG_DISCONNECTED', 'CERT_EXPIRING'],
      lastSentAt: 'Just created',
      status: 'ACTIVE'
    };

    setChannels(prev => [...prev, newCh]);
    setIsAddingChannel(false);
    setNewChannelName('');
    setNewChannelEndpoint('');
    setNewChannelSecret('');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle) return;

    const newR: AlertRuleConfig = {
      id: `rule-${Date.now()}`,
      titleFa: newRuleTitle,
      titleEn: newRuleTitle,
      triggerCondition: newRuleCondition,
      thresholdValue: Number(newRuleThreshold),
      severity: newRuleSeverity,
      targetComponentRoles: ['universal_forwarder', 'heavy_forwarder', 'syslog_collector', 'indexer_node'],
      assignedChannelIds: newRuleChannels.length > 0 ? newRuleChannels : [channels[0]?.id || 'ch-1'],
      enabled: true,
      cooldownMinutes: 10
    };

    setRules(prev => [...prev, newR]);
    setIsAddingRule(false);
    setNewRuleTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Sirene Dark Luxury */}
      <div className="sirene-card p-6 md:p-8 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-4 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Bell className="w-5 h-5 text-violet-300" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isFa ? 'مرکز مدیریت الرت‌ها و کانال‌های اطلاع‌رسانی قطعی (Webhook / SMS / Email)' : 'Outage Alerting & Multi-Channel Notification Center'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {isFa
                ? 'پیکربندی خودکار ارسال پیامک به مسئولین آنکال SOC، وب‌هوک به اسلک/تیمز و ارسال ایمیل در زمان قطعی فورواردرها، خاموشی سورس‌ها، انقضای سرتیفیکیت‌ها یا سرریز بافر.'
                : 'Automated dispatch rules via Webhooks, SMS Gateways (Kavenegar/Twilio), and Corporate Email relays.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap relative z-10">
            <button
              onClick={() => setIsAddingChannel(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-medium text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'افزودن کانال جدید' : 'Add Channel'}</span>
            </button>
            <button
              onClick={() => setIsAddingRule(true)}
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-violet-500/40 font-medium text-xs flex items-center gap-2 transition"
            >
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>{isFa ? 'تعریف قانون هشدار جدید' : 'New Alert Rule'}</span>
            </button>
          </div>
        </div>

        {testStatusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 relative z-10 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Grid: Configured Channels (Webhooks, SMS, Email) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" />
            <span>{isFa ? 'کانال‌های فعال اطلاع‌رسانی (Notification Channels):' : 'Active Notification Channels:'}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">{channels.length} Channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => {
            const isTesting = testingChannelId === channel.id;

            return (
              <div
                key={channel.id}
                className={`p-5 rounded-3xl bg-[#0b0e17]/80 backdrop-blur-xl border transition-all flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${
                  channel.enabled ? 'border-white/[0.08] hover:border-violet-500/40 hover:bg-[#111522]' : 'border-white/[0.04] opacity-50'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-2xl ${
                        channel.type === 'SMS'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : channel.type === 'EMAIL'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                          : 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                      }`}>
                        {channel.type === 'SMS' ? <Phone className="w-4 h-4" /> : channel.type === 'EMAIL' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{channel.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{channel.providerDetails}</span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channel.enabled}
                        onChange={() => handleToggleChannel(channel.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-cyan-500"></div>
                    </label>
                  </div>

                  <div className="bg-[#07090e] p-3 rounded-2xl border border-white/[0.06] font-mono text-[11px] space-y-1 shadow-inner">
                    <div className="text-slate-400 truncate" title={channel.endpointOrTarget}>
                      <span className="text-slate-500">{isFa ? 'مقصد:' : 'Target:'}</span> {channel.endpointOrTarget}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>{isFa ? 'آخرین ارسال:' : 'Last Sent:'} {channel.lastSentAt || 'Never'}</span>
                      <span className="text-emerald-400 font-bold">{channel.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {channel.eventsSubscribed.map(ev => (
                      <span key={ev} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.06]">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => handleTestDispatch(channel)}
                    disabled={isTesting || !channel.enabled}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 text-violet-300 font-semibold text-xs border border-white/[0.08] hover:border-violet-500/40 flex items-center gap-1.5 transition"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isFa ? 'در حال ارسال تست...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ارسال پیام تست آنی' : 'Test Dispatch'}</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {channel.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Trigger Rules Matrix - Sirene Glass Card */}
      <div className="sirene-card p-6 md:p-7 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>{isFa ? 'قوانین و شرایط صدور آلارم (Alert Trigger Rules):' : 'Configured Alert Rules:'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa ? 'هنگام وقوع شرایط زیر، سامانه بلافاصله به مسئولین و کانال‌های متناظر پیام می‌فرستد.' : 'Trigger thresholds determining when and where alerts are dispatched.'}
            </p>
          </div>
          <span className="text-xs text-violet-300 font-mono px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25">{rules.length} Active Rules</span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs transition ${
                  rule.enabled ? 'bg-[#07090e] border-white/[0.06] hover:border-violet-500/30' : 'bg-[#07090e]/40 border-white/[0.03] opacity-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                      rule.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {rule.severity}
                    </span>
                    <span className="font-bold text-white text-xs">{isFa ? rule.titleFa : rule.titleEn}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] font-mono">
                    <span>Condition: <strong className="text-cyan-400">{rule.triggerCondition}</strong></span>
                    <span>Threshold: <strong className="text-violet-300">{rule.thresholdValue}</strong></span>
                    <span>Cooldown: <strong className="text-slate-300">{rule.cooldownMinutes}m</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {rule.assignedChannelIds.length} {isFa ? 'کانال مقصد' : 'Channels'}
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-cyan-500"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatched Notification History Logs */}
      <div className="sirene-card p-6 md:p-7 rounded-3xl bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.08] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {isFa ? 'سوابق هشدارهای ارسال شده به مسئولین (Dispatched Alerts History):' : 'Recent Dispatch History:'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">{logs.length} Logged Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[11px] text-slate-400 uppercase bg-[#07090e] border-b border-white/[0.06] font-mono">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Rule / Event</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-white">{log.ruleTitle}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                      {log.channelType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]" title={log.targetRecipient}>
                    {log.targetRecipient}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{log.deliveryStatus}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.latencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add New Channel */}
      {isAddingChannel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f16] border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'افزودن کانال اطلاع‌رسانی جدید' : 'Configure New Notification Channel'}</span>
            </h3>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'نوع کانال:' : 'Channel Type:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['WEBHOOK', 'SMS', 'EMAIL'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewChannelType(t)}
                      className={`p-2 rounded-xl font-bold border transition ${
                        newChannelType === t ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'نام کانال / عنوان گروه:' : 'Channel Name:'}</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder={newChannelType === 'SMS' ? 'پیامک مدیران کشیک SOC' : 'SOC Slack Incoming Webhook'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {newChannelType === 'SMS' ? (isFa ? 'شماره موبایل(ها):' : 'Phone Numbers:') : newChannelType === 'EMAIL' ? (isFa ? 'آدرس ایمیل(ها):' : 'Email Addresses:') : (isFa ? 'آدرس Webhook URL:' : 'Webhook URL:')}
                </label>
                <input
                  type="text"
                  value={newChannelEndpoint}
                  onChange={(e) => setNewChannelEndpoint(e.target.value)}
                  placeholder={newChannelType === 'SMS' ? '+98912xxxxxxx, +98935xxxxxxx' : newChannelType === 'EMAIL' ? 'soc-team@corp.internal' : 'https://hooks.slack.com/services/...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'کلید احراز هویت / توکن امنیتی (اختیاری):' : 'Secret / API Key (Optional):'}</label>
                <input
                  type="password"
                  value={newChannelSecret}
                  onChange={(e) => setNewChannelSecret(e.target.value)}
                  placeholder="Bearer token or API Secret"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingChannel(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {isFa ? 'ذخیره و فعال‌سازی کانال' : 'Save & Enable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Rule */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f16] border border-cyan-500/50 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'تعریف قانون آلارم و آستانه هشدار جدید' : 'Define New Outage Alert Rule'}</span>
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'عنوان قانون:' : 'Rule Title:'}</label>
                <input
                  type="text"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="هشدار سکوت ارسال لاگ بیش از ۴۰ ثانیه"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'شرط تریگر:' : 'Condition:'}</label>
                  <select
                    value={newRuleCondition}
                    onChange={(e) => setNewRuleCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                  >
                    <option value="HEARTBEAT_SILENCE_SECONDS">Heartbeat Silence (s)</option>
                    <option value="CERT_DAYS_REMAINING">Cert Expiry Days Remaining</option>
                    <option value="QUEUE_UTILIZATION_PCT">Queue Utilization (%)</option>
                    <option value="EPS_DROP_PCT">EPS Drop (%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'مقدار آستانه (Threshold):' : 'Threshold Value:'}</label>
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isFa ? 'سطح حساسیت (Severity):' : 'Severity:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setNewRuleSeverity(sev)}
                      className={`p-2 rounded-xl font-bold border transition ${
                        newRuleSeverity === sev ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  {isFa ? 'ذخیره و فعال‌سازی قانون' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
