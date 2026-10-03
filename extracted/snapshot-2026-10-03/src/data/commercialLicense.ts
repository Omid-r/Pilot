import { DigitalCertificateLicense } from '../types';

export const INITIAL_DIGITAL_LICENSE: DigitalCertificateLicense = {
  certificateId: '',
  serialNumber: '',
  subject: {
    commonName: '',
    organization: '',
    organizationalUnit: '',
    country: '',
    subscriptionTier: 'UNLICENSED',
    nodeLimit: 0,
    licensedModules: [],
    status: 'UNLICENSED'
  },
  issuer: {
    commonName: '',
    organization: '',
    authorityKeyId: ''
  },
  validity: {
    notBefore: '',
    notAfter: '',
    totalDays: 0,
    daysRemaining: 0,
    isExpired: true,
    gracePeriodDays: 0
  },
  cryptography: {
    algorithm: '',
    sha256Fingerprint: '',
    publicKeyPem: '',
    signatureHex: '',
    signedJwtToken: '',
    mtlsClientCertPem: '',
    mtlsPrivateKeyPem: ''
  },
  privacyPolicy: {
    zeroTrustVerified: false,
    localAnonymizationEnforced: false,
    noRawPayloadTransit: true,
    dataResidencyCompliance: 'Not licensed / not verified'
  }
};

export function generatePemCertificateText(license: DigitalCertificateLicense): string {
  if (license.subject.status === 'UNLICENSED' || !license.cryptography.signedJwtToken) {
    return '# Splunk Cluster Doctor\n# No cryptographically verifiable commercial certificate is installed on this host.\n# Install a certificate issued by your trusted enterprise CA/licensing authority.\n';
  }

  return [
    '-----BEGIN SPLUNK DOCTOR LICENSE METADATA-----',
    'certificateId=' + license.certificateId,
    'serialNumber=' + license.serialNumber,
    'organization=' + license.subject.organization,
    'subscriptionTier=' + license.subject.subscriptionTier,
    'notBefore=' + license.validity.notBefore,
    'notAfter=' + license.validity.notAfter,
    'sha256Fingerprint=' + license.cryptography.sha256Fingerprint,
    'issuer=' + license.issuer.commonName,
    '-----END SPLUNK DOCTOR LICENSE METADATA-----',
    '',
    '# The application does not mint X.509 certificates or invent signatures.',
    '# The signed certificate/private key material must be supplied by an external trusted authority.'
  ].join('\n');
}

export function issueCustomCompanyLicense(
  _companyName: string,
  _tier: 'ENTERPRISE_COMMERCIAL_GOLD' | 'ENTERPRISE_PLATINUM_SOC' | 'STANDARD_COMMERCIAL' | 'TRIAL_EVALUATION',
  _validDays: number,
  _nodeLimit: number
): never {
  throw new Error('Certificate issuance is not implemented locally. Use your trusted enterprise CA/licensing authority and import the resulting signed certificate.');
}
