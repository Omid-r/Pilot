import { SplunkCertificateItem } from '../types';

export const INITIAL_SPLUNK_CERTIFICATES: SplunkCertificateItem[] = [
  {
    id: 'cert-idx-inputs-01',
    nodeId: 'node-idx-01',
    hostname: 'idx-cluster-peer-01.corp.internal',
    componentRole: 'indexer_node',
    certType: 'INPUTS_SERVER_CERT',
    friendlyName: 'Splunk Ingestion Port 9997 Server mTLS Certificate',
    certPath: '/opt/splunk/etc/auth/myCerts/idx01_server.pem',
    keyPath: '/opt/splunk/etc/auth/myCerts/idx01_server.key',
    issuer: 'CN=Enterprise SOC Root CA 2024, O=CyberDefense Corp, C=US',
    subject: 'CN=idx-cluster-peer-01.corp.internal, OU=Splunk Infrastructure',
    validFrom: '2025-01-15',
    validTo: '2026-10-15',
    daysRemaining: 25,
    totalValidityDays: 365,
    status: 'WARNING_SOON',
    keyType: 'RSA 4096-bit',
    signatureAlgorithm: 'SHA256withRSA',
    sanList: ['idx-cluster-peer-01.corp.internal', '10.20.30.50', 'idx-vip.corp.internal'],
    portsSecured: [9997],
    isCustomOrgCa: true,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'در صورت انقضا، تمام Universal Forwarderها و Heavy Forwarderها دست‌تکانی TLS را رد کرده و ورود لاگ به این ایندکسر مسدود می‌شود.',
    failureImpactEn: 'All forwarders will abort TLS handshake on port 9997, causing complete ingestion stall.',
    remediationCommand: '/opt/splunk/bin/splunk btool inputs list --debug && openssl x509 -in /opt/splunk/etc/auth/myCerts/idx01_server.pem -text -noout'
  },
  {
    id: 'cert-idx-mgmt-02',
    nodeId: 'node-idx-02',
    hostname: 'idx-cluster-peer-02.corp.internal',
    componentRole: 'indexer_node',
    certType: 'SPLUNKD_MANAGEMENT',
    friendlyName: 'Splunkd REST API Port 8089 Daemon Certificate',
    certPath: '/opt/splunk/etc/auth/server.pem',
    keyPath: '/opt/splunk/etc/auth/server.pem',
    issuer: 'CN=Enterprise SOC Root CA 2024, O=CyberDefense Corp, C=US',
    subject: 'CN=idx-cluster-peer-02.corp.internal, OU=Splunk Clustering',
    validFrom: '2025-03-01',
    validTo: '2026-09-28',
    daysRemaining: 8,
    totalValidityDays: 365,
    status: 'CRITICAL_EXPIRING',
    keyType: 'ECDSA P-384',
    signatureAlgorithm: 'SHA384withECDSA',
    sanList: ['idx-cluster-peer-02.corp.internal', '10.20.30.51'],
    portsSecured: [8089],
    isCustomOrgCa: true,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'کلاستر مستر و سرچ‌هد نمی‌توانند از طریق پورت 8089 با این ایندکسر صحبت کنند و کلاستر دگرید می‌شود.',
    failureImpactEn: 'Cluster Master and Search Heads will lose REST replication sync, degrading indexer cluster state.',
    remediationCommand: 'openssl req -new -key /opt/splunk/etc/auth/server.key -out /tmp/idx02.csr && /opt/splunk/bin/splunk restart splunkd'
  },
  {
    id: 'cert-uf-app-01',
    nodeId: 'node-uf-app-01',
    hostname: 'uf-appserver-prod-01.corp.internal',
    componentRole: 'universal_forwarder',
    certType: 'OUTPUTS_CLIENT_CERT',
    friendlyName: 'Universal Forwarder Client TLS Cert (outputs.conf)',
    certPath: '/opt/splunkforwarder/etc/auth/app01_client.pem',
    keyPath: '/opt/splunkforwarder/etc/auth/app01_client.pem',
    issuer: 'CN=Enterprise SOC Root CA 2024, O=CyberDefense Corp, C=US',
    subject: 'CN=uf-appserver-prod-01.corp.internal, OU=Endpoint Agents',
    validFrom: '2025-06-01',
    validTo: '2027-06-01',
    daysRemaining: 254,
    totalValidityDays: 730,
    status: 'HEALTHY',
    keyType: 'RSA 2048-bit',
    signatureAlgorithm: 'SHA256withRSA',
    sanList: ['uf-appserver-prod-01.corp.internal', '172.16.10.15'],
    portsSecured: [9997],
    isCustomOrgCa: true,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'در صورت انقضا، فورواردر نمی‌تواند لاگ‌های Core Banking را به ایندکسر بفرستد و در بافر محلی جمع می‌شود.',
    failureImpactEn: 'UF will fail mutual TLS auth when connecting to indexers, accumulating unforwarded logs locally.',
    remediationCommand: '/opt/splunkforwarder/bin/splunk btool outputs list --debug && /opt/splunkforwarder/bin/splunk restart'
  },
  {
    id: 'cert-hf-dmz-01',
    nodeId: 'node-hf-dmz-01',
    hostname: 'hf-gateway-dmz-01.corp.internal',
    componentRole: 'heavy_forwarder',
    certType: 'INPUTS_SERVER_CERT',
    friendlyName: 'DMZ Gateway TLS Ingestion Cert',
    certPath: '/opt/splunk/etc/auth/dmz_gateway.pem',
    keyPath: '/opt/splunk/etc/auth/dmz_gateway.key',
    issuer: 'CN=Enterprise SOC Root CA 2024, O=CyberDefense Corp, C=US',
    subject: 'CN=hf-gateway-dmz-01.corp.internal, OU=DMZ Ingestion',
    validFrom: '2025-02-10',
    validTo: '2026-11-10',
    daysRemaining: 51,
    totalValidityDays: 365,
    status: 'HEALTHY',
    keyType: 'RSA 4096-bit',
    signatureAlgorithm: 'SHA256withRSA',
    sanList: ['hf-gateway-dmz-01.corp.internal', '192.168.100.10', 'dmz-collector.corp.internal'],
    portsSecured: [9997, 8089],
    isCustomOrgCa: true,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'کلاینت‌های DMZ و فایروال‌ها امکان ارسال لاگ به HF را از دست می‌دهند.',
    failureImpactEn: 'External perimeter forwarders will fail SSL handshake to DMZ gateway.',
    remediationCommand: 'openssl verify -CAfile /opt/splunk/etc/auth/cacert.pem /opt/splunk/etc/auth/dmz_gateway.pem'
  },
  {
    id: 'cert-sc4s-syslog-01',
    nodeId: 'node-syslog-sc4s-01',
    hostname: 'sc4s-collector-prod-01.corp.internal',
    componentRole: 'syslog_collector',
    certType: 'SC4S_SYSLOG_TLS',
    friendlyName: 'Syslog-NG TLS 514 Network Collector Certificate',
    certPath: '/etc/syslog-ng/cert.d/serverkey.pem',
    keyPath: '/etc/syslog-ng/cert.d/serverkey.pem',
    issuer: 'CN=Enterprise SOC Root CA 2024, O=CyberDefense Corp, C=US',
    subject: 'CN=sc4s-collector-prod-01.corp.internal, OU=Network Syslog',
    validFrom: '2024-09-20',
    validTo: '2026-09-22',
    daysRemaining: 2,
    totalValidityDays: 730,
    status: 'CRITICAL_EXPIRING',
    keyType: 'RSA 4096-bit',
    signatureAlgorithm: 'SHA256withRSA',
    sanList: ['sc4s-collector-prod-01.corp.internal', '10.20.10.80', 'syslog-tls.corp.internal'],
    portsSecured: [514, 6514],
    isCustomOrgCa: true,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'روترها و فایروال‌های سیسکو/پالوآلتو که با TLS 514 کار می‌کنند اتصالشان قطع شده و لاگ‌های امنیتی شبکه قطع می‌شوند!',
    failureImpactEn: 'Encrypted syslog streams from core firewalls will be rejected due to expired TLS cert.',
    remediationCommand: 'podman restart sc4s || systemctl restart syslog-ng'
  },
  {
    id: 'cert-sh-web-01',
    nodeId: 'node-sh-01',
    hostname: 'sh-search-head-01.corp.internal',
    componentRole: 'search_head',
    certType: 'WEB_UI_CERT',
    friendlyName: 'Splunk Web Interface HTTPS Port 8000 UI Certificate',
    certPath: '/opt/splunk/etc/auth/splunkweb/web_ui.pem',
    keyPath: '/opt/splunk/etc/auth/splunkweb/web_ui.key',
    issuer: 'CN=DigiCert Global TLS RSA SHA256 2024 CA1, O=DigiCert Inc, C=US',
    subject: 'CN=splunk.corp.internal, OU=SOC Operations Portal',
    validFrom: '2025-05-15',
    validTo: '2027-05-15',
    daysRemaining: 237,
    totalValidityDays: 730,
    status: 'HEALTHY',
    keyType: 'RSA 2048-bit',
    signatureAlgorithm: 'SHA256withRSA',
    sanList: ['splunk.corp.internal', 'soc-dashboard.corp.internal', '10.20.30.10'],
    portsSecured: [8000, 443],
    isCustomOrgCa: false,
    dailyDepletionRate: 1.0,
    failureImpactFa: 'تحلیل‌گران SOC هنگام ورود به وب اسپلانک با خطای ناامن بودن مرورگر (NET::ERR_CERT_DATE_INVALID) مواجه می‌شوند.',
    failureImpactEn: 'SOC analysts will encounter browser TLS expiration warnings upon accessing Splunk Web.',
    remediationCommand: '/opt/splunk/bin/splunk restart splunkweb'
  }
];

export interface CertificatePredictionMetric {
  totalCerts: number;
  healthyCerts: number;
  warningSoonCerts: number;
  criticalExpiringCerts: number;
  nextExpiringCert: SplunkCertificateItem;
  predictedDaysUntilFirstOutage: number;
  firstOutageDateStr: string;
  clusterIngestionRiskScore: number; // 0 to 100
  recommendedActionSummaryFa: string;
  recommendedActionSummaryEn: string;
}

export function computeCertificatePredictions(
  certs: SplunkCertificateItem[],
  warningThresholdDays = 30,
  criticalThresholdDays = 10
): CertificatePredictionMetric {
  const sorted = [...certs].sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nextExpiring = sorted[0];

  const healthy = certs.filter(c => c.daysRemaining > warningThresholdDays).length;
  const warning = certs.filter(c => c.daysRemaining <= warningThresholdDays && c.daysRemaining > criticalThresholdDays).length;
  const critical = certs.filter(c => c.daysRemaining <= criticalThresholdDays).length;

  // Risk score formula: heavily weight critical certs affecting port 9997 and 514
  let riskScore = 15;
  if (critical > 0) riskScore += critical * 35;
  if (warning > 0) riskScore += warning * 15;
  riskScore = Math.min(100, Math.max(0, riskScore));

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (nextExpiring ? nextExpiring.daysRemaining : 365));

  return {
    totalCerts: certs.length,
    healthyCerts: healthy,
    warningSoonCerts: warning,
    criticalExpiringCerts: critical,
    nextExpiringCert: nextExpiring,
    predictedDaysUntilFirstOutage: nextExpiring ? nextExpiring.daysRemaining : 999,
    firstOutageDateStr: targetDate.toISOString().split('T')[0],
    clusterIngestionRiskScore: riskScore,
    recommendedActionSummaryFa: critical > 0 
      ? `هشدار فوری: ${critical} گواهینامه امنیتی در آستانه انقضای کمتر از ${criticalThresholdDays} روز قرار دارد. تمدید فوری سرتیفیکت ${nextExpiring?.friendlyName} برای جلوگیری از قطع لاگ شبکه ضروری است.`
      : warning > 0 
      ? `توجه: ${warning} گواهینامه ظرف ${warningThresholdDays} روز آینده منقضی خواهند شد. توصیه می‌شود دستورات تجدید خودکار اجرا شود.`
      : 'کلیه گواهینامه‌های کلاستر اسپلانک در وضعیت پایدار و معتبر قرار دارند.',
    recommendedActionSummaryEn: critical > 0
      ? `Urgent Action Required: ${critical} SSL certs expire in <${criticalThresholdDays} days. Renew ${nextExpiring?.friendlyName} immediately.`
      : 'All Splunk cluster certificates are operating within healthy parameters.'
  };
}
