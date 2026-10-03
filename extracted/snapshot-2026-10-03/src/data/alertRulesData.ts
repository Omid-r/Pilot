import { AlertNotificationChannel, AlertRuleConfig, DispatchedAlertLog } from '../types';

export const INITIAL_NOTIFICATION_CHANNELS: AlertNotificationChannel[] = [
  {
    id: 'ch-webhook-slack-soc',
    name: 'SOC Alert Center (Slack / Discord Incoming Webhook)',
    type: 'WEBHOOK',
    enabled: true,
    endpointOrTarget: 'https://hooks.slack.com/services/REDACTED/OFFLINE/WEBHOOK',
    authSecretOrToken: 'whsec_soc_central_tunnel_2026',
    providerDetails: 'Slack Webhook App v2 / SIEM Incident Channel',
    eventsSubscribed: ['LOG_DISCONNECTED', 'CERT_EXPIRING', 'QUEUE_CONGESTED', 'NODE_RECOVERED'],
    lastSentAt: '23:45:10',
    status: 'ACTIVE'
  },
  {
    id: 'ch-sms-kavenegar',
    name: 'سامانه پیامک فوری ادمین و مدیر SOC (Kavenegar / Twilio SMS)',
    type: 'SMS',
    enabled: true,
    endpointOrTarget: '+989123456789, +989351234567',
    authSecretOrToken: 'apikey_kav_live_9948201732948',
    providerDetails: 'Kavenegar Pattern OTP & High-Priority SMS Gateway',
    eventsSubscribed: ['LOG_DISCONNECTED', 'CERT_EXPIRING'],
    lastSentAt: '22:15:00',
    status: 'ACTIVE'
  },
  {
    id: 'ch-email-soc-dist',
    name: 'لیست ایمیل گروهی پایش و نگهداشت (SOC Operations Distribution List)',
    type: 'EMAIL',
    enabled: true,
    endpointOrTarget: 'soc-oncall@corp.internal, splunk-admins@corp.internal',
    providerDetails: 'Corporate SMTP Relay (relay.corp.internal:587 TLS)',
    eventsSubscribed: ['LOG_DISCONNECTED', 'CERT_EXPIRING', 'QUEUE_CONGESTED', 'NODE_RECOVERED'],
    lastSentAt: '21:00:30',
    status: 'ACTIVE'
  },
  {
    id: 'ch-teams-webhook',
    name: 'Microsoft Teams Operations Channel',
    type: 'TEAMS_SLACK',
    enabled: false,
    endpointOrTarget: 'https://outlook.office.com/webhook/xxxx/IncomingWebhook/yyyy',
    providerDetails: 'MS 365 Connector',
    eventsSubscribed: ['LOG_DISCONNECTED', 'CERT_EXPIRING'],
    lastSentAt: 'Never',
    status: 'ACTIVE'
  }
];

export const INITIAL_ALERT_RULES: AlertRuleConfig[] = [
  {
    id: 'rule-heartbeat-timeout',
    titleFa: 'قطع هارت‌بیت و سکوت جریان لاگ بیش از ۳۰ ثانیه (Critical Log Halt)',
    titleEn: 'Heartbeat Timeout / Zero EPS Silence > 30 Seconds',
    triggerCondition: 'HEARTBEAT_SILENCE_SECONDS',
    thresholdValue: 30,
    severity: 'CRITICAL',
    targetComponentRoles: ['universal_forwarder', 'heavy_forwarder', 'syslog_collector', 'indexer_node'],
    assignedChannelIds: ['ch-webhook-slack-soc', 'ch-sms-kavenegar', 'ch-email-soc-dist'],
    enabled: true,
    cooldownMinutes: 5,
    lastTriggered: '10 mins ago'
  },
  {
    id: 'rule-cert-expiration-warning',
    titleFa: 'هشدار انقضای گواهینامه SSL/TLS در کمتر از ۱۵ روز (Certificate Expiry Alert)',
    titleEn: 'Splunk SSL Certificate Expiring in < 15 Days',
    triggerCondition: 'CERT_DAYS_REMAINING',
    thresholdValue: 15,
    severity: 'CRITICAL',
    targetComponentRoles: ['universal_forwarder', 'heavy_forwarder', 'syslog_collector', 'indexer_node', 'search_head'],
    assignedChannelIds: ['ch-webhook-slack-soc', 'ch-sms-kavenegar', 'ch-email-soc-dist'],
    enabled: true,
    cooldownMinutes: 1440,
    lastTriggered: '2 hours ago'
  },
  {
    id: 'rule-queue-overflow',
    titleFa: 'سرریز صف حافظه و بافر نود بیش از ۸۵ درصد (Memory Queue Congestion)',
    titleEn: 'Agent Memory Queue Congested > 85%',
    triggerCondition: 'QUEUE_UTILIZATION_PCT',
    thresholdValue: 85,
    severity: 'WARNING',
    targetComponentRoles: ['heavy_forwarder', 'universal_forwarder', 'syslog_collector'],
    assignedChannelIds: ['ch-webhook-slack-soc', 'ch-email-soc-dist'],
    enabled: true,
    cooldownMinutes: 15,
    lastTriggered: '4 hours ago'
  },
  {
    id: 'rule-eps-drop',
    titleFa: 'افت شدید نرخ ارسال لاگ به میزان بیش از ۷۰ درصد (Severe Throughput Drop)',
    titleEn: 'Abnormal EPS Drop > 70% vs Baseline',
    triggerCondition: 'EPS_DROP_PCT',
    thresholdValue: 70,
    severity: 'WARNING',
    targetComponentRoles: ['syslog_collector', 'heavy_forwarder'],
    assignedChannelIds: ['ch-webhook-slack-soc'],
    enabled: true,
    cooldownMinutes: 30,
    lastTriggered: 'Yesterday'
  }
];

export const INITIAL_DISPATCHED_LOGS: DispatchedAlertLog[] = [
  {
    id: 'disp-101',
    timestamp: '23:45:10',
    ruleTitle: 'قطع هارت‌بیت و سکوت جریان لاگ بیش از ۳۰ ثانیه',
    channelType: 'WEBHOOK',
    targetRecipient: 'SOC Alert Center (Slack)',
    severity: 'CRITICAL',
    messagePreview: '🚨 [CRITICAL DROP] uf-appserver-prod-01 has halted log forwarding for 45s. EPS dropped to 0.',
    deliveryStatus: 'DELIVERED_SUCCESS',
    latencyMs: 120
  },
  {
    id: 'disp-102',
    timestamp: '23:45:12',
    ruleTitle: 'قطع هارت‌بیت و سکوت جریان لاگ بیش از ۳۰ ثانیه',
    channelType: 'SMS',
    targetRecipient: '+989123456789 (SOC On-Call Admin)',
    severity: 'CRITICAL',
    messagePreview: 'هشدار بحرانی SOC: لاگ‌های سرور uf-appserver-prod-01 قطع شد. لطفاً بررسی کنید.',
    deliveryStatus: 'DELIVERED_SUCCESS',
    latencyMs: 840
  },
  {
    id: 'disp-103',
    timestamp: '22:10:04',
    ruleTitle: 'هشدار انقضای گواهینامه SSL/TLS در کمتر از ۱۵ روز',
    channelType: 'EMAIL',
    targetRecipient: 'soc-oncall@corp.internal',
    severity: 'CRITICAL',
    messagePreview: 'SSL Expiry Warning: sc4s-collector-prod-01 TLS cert expires in 2 days.',
    deliveryStatus: 'DELIVERED_SUCCESS',
    latencyMs: 310
  }
];
