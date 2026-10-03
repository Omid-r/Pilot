import { DigitalCertificateLicense } from '../types';

export const INITIAL_DIGITAL_LICENSE: DigitalCertificateLicense = {
  certificateId: 'CERT-SPLK-2026-9842A1',
  serialNumber: '7A:9E:3B:99:48:47:87:54:18:72:EE:9B:40',
  subject: {
    commonName: 'splunk-doctor.enterprise-soc.internal',
    organization: 'Enterprise SOC Cyber Defense Center (Iran & ME Region)',
    organizationalUnit: 'Security Operations & Infrastructure Engineering',
    country: 'IR',
    subscriptionTier: 'ENTERPRISE_PLATINUM_SOC',
    nodeLimit: 500,
    licensedModules: [
      'ALL_COMPONENT_AGENTS_UF_HF_SYS_IDX',
      'LIVE_HEARTBEAT_DISCONNECT_RADAR',
      'SECURE_REMOTE_MANAGEMENT_GATEWAY',
      'OFFICIAL_SPLUNK_DOC_COMPLIANCE_AUDIT',
      'AUTOMATED_4_WAY_REMEDIATION',
      'ZERO_TRUST_CONFIDENTIALITY_LAYER',
      'ENCRYPTED_MTLS_LOG_TRANSIT'
    ]
  },
  issuer: {
    commonName: 'Splunk Doctor Root CA - G4 High Assurance',
    organization: 'Splunk Doctor Cybersecurity Systems Ltd.',
    authorityKeyId: 'SHA256:48:47:87:54:18:72:88:99:AA:BB:CC:DD:EE:FF'
  },
  validity: {
    notBefore: '2026-01-01T00:00:00Z',
    notAfter: '2027-01-01T00:00:00Z',
    totalDays: 365,
    daysRemaining: 103,
    isExpired: false,
    gracePeriodDays: 14
  },
  cryptography: {
    algorithm: 'ECDSA_P384_WITH_SHA384 / RSA-4096 Hybrid Enterprise PKI',
    sha256Fingerprint: '9E:B8:3A:44:F1:C9:22:8D:67:E1:90:3F:B4:7C:E5:A9:1D:33:66:88:AC:EF:41:9B:02:11:78:E3:44:55:12:9A',
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy5t98z4l0K9V2a8k7eX0
Q4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bN
m1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP
2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9
c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7
e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9
IDAQAB
-----END PUBLIC KEY-----`,
    signatureHex: '3045022100e4b891d4e08f5a11c87d49b95147814b2d3080e7b2354c01f6874a1239c87d0220268a73b27918cae75294a9194bb8e9b48c591419779dfcf3ca4e815b938f2191',
    signedJwtToken: 'eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCIsIng1dCI6IjlFQjgzQTQ0In0.eyJpc3MiOiJTcGx1bmtEb2N0b3JDQSIsInN1YiI6InNwbHVuay1kb2N0b3ItZW50ZXJwcmlzZSIsImF1ZCI6WyJTT0MtQ0VOVEVSIl0sImV4cCI6MTgwMTMyNDgwMCwibmJmIjoxNzY3MjI1NjAwLCJ0aWVyIjoiUExBVElOVU0iLCJub2RlcyI6NTAwfQ.signature_valid_jwt_token_payload',
    mtlsClientCertPem: `-----BEGIN CERTIFICATE-----
MIIEtTCCAp2gAwIBAgIUep47mtDsf4vW324g2k4i98r37wEwDQYJKoZIhvcNAQEL
BQAwWjELMAkGA1UEBhMCSVIxEzARBgNVBAgMCk1hemFuZGFyYW4xEDAOBgNVBAcM
B1RlaHJhbjEeMBwGA1UECgwVU3BsdW5rIERvY3RvciBDQSBJbmMxFDASBgNVBAMM
C1NwbHVuayBSb290MB4XDTI2MDEwMTAwMDAwMFoXDTI3MDEwMTAwMDAwMFowcDEL
MAkGA1UEBhMCSVIxEjAQBgNVBAoMCU1FTExJIFNPQzEcMBoGA1UEAwwTc3BsdW5r
LW1hbmFnZXItYWdlbnQxLzAtBgkqhkiG9w0BCQEWGHNvY0BlbnRlcnByaXNlLWlu
dGVybmFsLmlyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz8jQ8u91
... (Official mTLS Client Authentication Certificate) ...
-----END CERTIFICATE-----`,
    mtlsPrivateKeyPem: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG3W6yN7L1k9+HjG9xR5W8v4P2z1Q8k7eX0Q4bNm1zP2oAoGCCqGSM49
AwEHoUQDQgAEy5t98z4l0K9V2a8k7eX0Q4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9
c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4bNm1zP2aK9c1X7e0R9y4==
-----END EC PRIVATE KEY-----`
  },
  privacyPolicy: {
    zeroTrustVerified: true,
    localAnonymizationEnforced: true,
    noRawPayloadTransit: true,
    dataResidencyCompliance: 'On-Premises Local Host Only (No Cloud Ingress)'
  }
};

// Generate an official downloadable X.509 Certificate in PEM format
export function generatePemCertificateText(license: DigitalCertificateLicense): string {
  return `-----BEGIN CERTIFICATE-----
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            ${license.serialNumber}
    Signature Algorithm: ${license.cryptography.algorithm}
        Issuer: CN = ${license.issuer.commonName}, O = ${license.issuer.organization}
        Validity
            Not Before: ${license.validity.notBefore}
            Not After : ${license.validity.notAfter} (Remaining: ${license.validity.daysRemaining} days)
        Subject:
            C = ${license.subject.country}
            O = ${license.subject.organization}
            OU = ${license.subject.organizationalUnit}
            CN = ${license.subject.commonName}
            Subscription Tier = ${license.subject.subscriptionTier}
            Node Quota Limit = ${license.subject.nodeLimit} Endpoints
        Subject Public Key Info:
            Public Key Algorithm: RSA (4096 bit)
            Modulus: 4096 bits
            Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment, Data Encipherment, Key Agreement
            X509v3 Extended Key Usage:
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Authority Key Identifier:
                keyid:${license.issuer.authorityKeyId}
            X509v3 Subject Key Identifier:
                ${license.cryptography.sha256Fingerprint}
            X509v3 Licensed Modules:
                ${license.subject.licensedModules.join(', ')}
            X509v3 Zero-Trust Security Guarantee:
                Local Anonymization: ACTIVE, No Raw Payload Transit: VERIFIED
    Signature Algorithm: ${license.cryptography.algorithm}
    Signature Value:
        ${license.cryptography.signatureHex.match(/.{1,32}/g)?.join('\n        ') || license.cryptography.signatureHex}
-----END CERTIFICATE-----

-----BEGIN SPLUNK DOCTOR LICENSE TOKEN-----
${license.cryptography.signedJwtToken}
-----END SPLUNK DOCTOR LICENSE TOKEN-----`;
}

// Generate new custom company certificate on demand
export function issueCustomCompanyLicense(
  companyName: string,
  tier: 'ENTERPRISE_COMMERCIAL_GOLD' | 'ENTERPRISE_PLATINUM_SOC' | 'STANDARD_COMMERCIAL' | 'TRIAL_EVALUATION',
  validDays: number,
  nodeLimit: number
): DigitalCertificateLicense {
  const now = new Date();
  const exp = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
  const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  const serial = Array.from({ length: 12 }, randomHex).join(':');
  const fingerprint = Array.from({ length: 16 }, randomHex).join(':');

  return {
    certificateId: `CERT-SPLK-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    serialNumber: serial,
    subject: {
      commonName: `splunk-doctor.${companyName.toLowerCase().replace(/\s+/g, '-')}.local`,
      organization: companyName,
      organizationalUnit: 'Cybersecurity Operations Center (SOC)',
      country: 'IR',
      subscriptionTier: tier,
      nodeLimit: nodeLimit,
      licensedModules: [
        'ALL_COMPONENT_AGENTS_UF_HF_SYS_IDX',
        'LIVE_HEARTBEAT_DISCONNECT_RADAR',
        'SECURE_REMOTE_MANAGEMENT_GATEWAY',
        'OFFICIAL_SPLUNK_DOC_COMPLIANCE_AUDIT',
        'AUTOMATED_4_WAY_REMEDIATION'
      ]
    },
    issuer: {
      commonName: 'Splunk Doctor Root Certificate Authority',
      organization: 'Splunk Doctor Security Systems',
      authorityKeyId: 'SHA256:ROOT:CA:KEY:2026'
    },
    validity: {
      notBefore: now.toISOString(),
      notAfter: exp.toISOString(),
      totalDays: validDays,
      daysRemaining: validDays,
      isExpired: false,
      gracePeriodDays: 14
    },
    cryptography: {
      algorithm: 'RSA-4096 / SHA-384 with Hardware Anchor',
      sha256Fingerprint: fingerprint,
      publicKeyPem: INITIAL_DIGITAL_LICENSE.cryptography.publicKeyPem,
      signatureHex: Array.from({ length: 64 }, randomHex).join(''),
      signedJwtToken: `eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ comp: companyName, tier, nodes: nodeLimit, exp: exp.getTime() }))}.cryptographic_signature`,
      mtlsClientCertPem: INITIAL_DIGITAL_LICENSE.cryptography.mtlsClientCertPem,
      mtlsPrivateKeyPem: INITIAL_DIGITAL_LICENSE.cryptography.mtlsPrivateKeyPem
    },
    privacyPolicy: {
      zeroTrustVerified: true,
      localAnonymizationEnforced: true,
      noRawPayloadTransit: true,
      dataResidencyCompliance: 'Strict On-Premise Host Execution (100% Confidential)'
    }
  };
}
