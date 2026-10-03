import { AlertNotificationChannel, AlertRuleConfig, DispatchedAlertLog } from '../types';

export const INITIAL_NOTIFICATION_CHANNELS: AlertNotificationChannel[] = [];

export const INITIAL_ALERT_RULES: AlertRuleConfig[] = [
  {
    id: 'rule-heartbeat-timeout',
    titleFa: 'قطع هارت‌بیت و سکوت جریان لاگ بیش از ۳۰ ثانیه (Critical Log Halt)',
    titleEn: 'Heartbeat Timeout / Zero EPS Silence > 30 Seconds',
    triggerCondition: 'HEARTBEAT_SILENCE_SECONDS',
    thresholdValue: 30,
    severity: 'CRITICAL',
    targetComponentRoles: ['universal_forwarder', 'heavy_forwarder', 'syslog_collector', 'indexer_node'],
    assignedChannelIds: [],
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
    assignedChannelIds: [],
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
    assignedChannelIds: [],
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
    assignedChannelIds: [],
    enabled: true,
    cooldownMinutes: 30,
    lastTriggered: 'Yesterday'
  }
];

export const INITIAL_DISPATCHED_LOGS: DispatchedAlertLog[] = [];