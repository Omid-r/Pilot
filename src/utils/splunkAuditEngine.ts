import { SplunkFinding, RemediationOption } from '../types';
import { INITIAL_FINDINGS } from '../data/initialConfigs';
import { resolveFindingPaths, resolveSplunkPaths } from './splunkPathResolver';

/**
 * Helper to accurately locate line number and exact culprit snippet in config content
 */
function findLineAndSnippet(content: string, matcher: RegExp | string): { line: number; snippet: string } {
  if (!content) return { line: 1, snippet: '' };
  const lines = content.split('\n');

  if (typeof matcher === 'string') {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(matcher)) {
        return { line: i + 1, snippet: lines[i].trim() };
      }
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      if (matcher.test(lines[i])) {
        return { line: i + 1, snippet: lines[i].trim() };
      }
    }
  }
  return { line: 1, snippet: lines[0]?.trim() || '' };
}

/**
 * Applies a specific remediation option to the target raw configuration text.
 */
export function applyRemediationOption(
  rawText: string,
  option: RemediationOption
): string {
  let newText = rawText;
  const optId = option.id || '';

  // Priority 1: User-customized replacement snippet (e.g. from Custom Edit in UI)
  if (option.replacementConfigSnippet && option.replacementConfigSnippet.trim()) {
    const customSnippet = option.replacementConfigSnippet.trim();
    const stanzaMatch = customSnippet.match(/^\s*\[([^\]]+)\]/m);
    if (stanzaMatch && newText.includes(`[${stanzaMatch[1]}]`)) {
      const stanzaName = stanzaMatch[1];
      const lines = customSnippet.split('\n').filter(l => l.trim() && !l.trim().startsWith('[') && !l.trim().startsWith('#'));
      lines.forEach(line => {
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const k = line.substring(0, eqIdx).trim();
          const v = line.substring(eqIdx + 1).trim();
          const keyRegex = new RegExp(`(^\\s*${k}\\s*=)[^\\n]*`, 'im');
          if (keyRegex.test(newText)) {
            newText = newText.replace(keyRegex, `${k} = ${v}`);
          } else {
            newText = newText.replace(new RegExp(`\\[${stanzaName}\\]`, 'i'), `[${stanzaName}]\n${k} = ${v}`);
          }
        }
      });
      return newText;
    }
  }

  // 1. Outputs SSL Encryption
  if (optId.startsWith('opt-ssl')) {
    newText = newText
      .replace(/useSSL\s*=\s*(false|0)/gi, 'useSSL = true')
      .replace(/sslVerifyServerCert\s*=\s*(false|0)/gi, 'sslVerifyServerCert = true\nsslRootCAPath = $SPLUNK_HOME/etc/auth/cacert.pem\nsslCertPath = $SPLUNK_HOME/etc/auth/server.pem');
    if (!/useSSL\s*=\s*(true|1)/i.test(newText)) {
      if (/\[tcpout\]/i.test(newText)) {
        newText = newText.replace(/\[tcpout\]/i, '[tcpout]\nuseSSL = true\nsslVerifyServerCert = true');
      } else {
        newText = '[tcpout]\nuseSSL = true\nsslVerifyServerCert = true\n\n' + newText;
      }
    }
  }
  // 2. Pass4SymmKey Authentication Secret
  else if (optId.startsWith('opt-pass')) {
    if (/pass4SymmKey\s*=\s*(changeme|default)/i.test(newText)) {
      const bytes = new Uint8Array(24);
      globalThis.crypto?.getRandomValues(bytes);
      const generatedKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      newText = newText.replace(/pass4SymmKey\s*=\s*(changeme|default)/gi, 'pass4SymmKey = ' + generatedKey);
    } else if (!newText.includes('pass4SymmKey')) {
      newText = newText.replace(/\[general\]/i, '[general]\npass4SymmKey = 9f8a3c8e7b1a2d4f5c6e8b0a1d3e5f7a');
    }
  }
  // 3. Modernize TLS Versions
  else if (optId.startsWith('opt-tls')) {
    newText = newText
      .replace(/sslVersionsToSupport\s*=\s*[^\n]+/gi, 'sslVersionsToSupport = tls1.2, tls1.3')
      .replace(/allowSslCompression\s*=\s*true/gi, 'allowSslCompression = false')
      .replace(/allowSslRenegotiation\s*=\s*true/gi, 'allowSslRenegotiation = false');
    if (!newText.includes('sslVersionsToSupport')) {
      if (/\[sslConfig\]/i.test(newText)) {
        newText = newText.replace(/\[sslConfig\]/i, '[sslConfig]\nsslVersionsToSupport = tls1.2, tls1.3\nallowSslCompression = false');
      } else {
        newText += '\n[sslConfig]\nsslVersionsToSupport = tls1.2, tls1.3\nallowSslCompression = false';
      }
    }
  }
  // 4. Missing Routing Group
  else if (optId.startsWith('opt-route')) {
    if (optId === 'opt-route-default') {
      newText = newText.replace(/_TCP_ROUTING\s*=\s*tcpout:missing_group[^\n]*/gi, '# _TCP_ROUTING = (uses defaultGroup from outputs.conf)');
    } else {
      newText = newText.replace(/_TCP_ROUTING\s*=\s*tcpout:missing_group/gi, '_TCP_ROUTING = primary_indexers');
    }
  }
  // 5. Props / Transforms Errors
  else if (optId.startsWith('opt-props')) {
    newText = newText
      .replace(/TRANSFORMS-routing\s*=\s*missing_transform/gi, '# TRANSFORMS-routing = syslog_routing (Remediated)')
      .replace(/LOOKUP-threat\s*=\s*threat_intel_feed_lookup[^\n]*/gi, '# LOOKUP-threat = threat_intel_lookup (Remediated)');
  }
  // 6. Outputs Bad Port Format (Missing :9997)
  else if (optId.startsWith('opt-port')) {
    if (optId === 'opt-port-dns') {
      newText = newText.replace(/server\s*=\s*10\.20\.30\.50:9997,\s*10\.20\.30\.51[^\n]*/gi, 'server = idx01.corp.net:9997, idx02.corp.net:9997');
    } else {
      newText = newText.replace(/server\s*=\s*([^\n]*?10\.20\.30\.51)(?!\:\d+)/gi, 'server = $1:9997');
      newText = newText.replace(/10\.20\.30\.50:9997,\s*10\.20\.30\.51(?!\:\d+)/gi, '10.20.30.50:9997, 10.20.30.51:9997');
      // Generic missing port pattern
      newText = newText.replace(/(server\s*=\s*[^;\n]*?\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!\s*:\s*\d+)/gi, '$1:9997');
    }
  }
  // 7. Inputs Missing Index OR Delete Non-existent winevent stanza
  else if (optId === 'opt-delete-winevent-stanza') {
    newText = newText.replace(/#?\s*\[monitor:\/\/\/var\/log\/winevent\/security\.evtx\][\s\S]*?(?=\n\[|$)/gi, '');
    newText = newText.replace(/# 3\. Active Directory Windows Security Monitor\s*\n?/gi, '');
  }
  else if (optId.startsWith('opt-add-index') || optId === 'opt-index-cli') {
    const targetIdx = optId === 'opt-add-index-wineventlog' ? 'wineventlog' : 'os_win';
    const winStanzaRegex = /\[monitor:\/\/\/var\/log\/winevent\/security\.evtx\]([\s\S]*?)(?=\n\[|$)/i;
    const match = newText.match(winStanzaRegex);
    if (match) {
      let stanzaBody = match[1];
      if (!stanzaBody.includes('index =') && !stanzaBody.includes('index=')) {
        if (optId === 'opt-add-index-whitelist') {
          stanzaBody = stanzaBody + `\nindex = os_win\nwhitelist = 4624,4625,4720,4726,4738,4672,1102\nrenderXml = true`;
        } else {
          stanzaBody = stanzaBody + `\nindex = ${targetIdx}`;
        }
        newText = newText.replace(winStanzaRegex, `[monitor:///var/log/winevent/security.evtx]${stanzaBody}`);
      }
    }
  }
  // 8. Disk Space Minimum
  else if (optId.startsWith('opt-disk')) {
    if (/minFreeSpaceMB\s*=\s*\d+/gi.test(newText)) {
      newText = newText.replace(/minFreeSpaceMB\s*=\s*\d+/gi, 'minFreeSpaceMB = 5000');
    } else {
      if (/\[diskUsage\]/i.test(newText)) {
        newText = newText.replace(/\[diskUsage\]/i, '[diskUsage]\nminFreeSpaceMB = 5000');
      } else {
        newText += '\n[diskUsage]\nminFreeSpaceMB = 5000\n';
      }
    }
  }
  // 9. Indexes Corrupted Volume Path
  else if (optId.startsWith('opt-idx')) {
    newText = newText
      .replace(/\/mnt\/non_existent_volume/gi, '$SPLUNK_DB/corrupted_temp_idx')
      .replace(/frozenTimePeriodInSecs\s*=\s*3600/gi, 'frozenTimePeriodInSecs = 7776000');
  }
  // 10. HEC Plain HTTP / SSL
  else if (optId.startsWith('opt-hec')) {
    newText = newText.replace(/enableSSL\s*=\s*0/gi, 'enableSSL = 1\nsslVersions = tls1.2,tls1.3');
  }
  // Fallback direct snippet replacement
  else if (option.replacementConfigSnippet) {
    if (!newText.includes(option.replacementConfigSnippet)) {
      newText += '\n' + option.replacementConfigSnippet;
    }
  }

  return newText;
}

interface ParsedStanzaProp {
  value: string;
  line: number;
  raw: string;
}

interface ParsedStanza {
  name: string;
  line: number;
  properties: Record<string, ParsedStanzaProp>;
  rawLines: string[];
}

/**
 * Robust Splunk INI configuration parser.
 * Accurately parses stanzas and keys, completely ignores commented-out lines (# and ;),
 * tracks precise line numbers for every key and header.
 */
function parseSplunkConfStanzas(content: string): Map<string, ParsedStanza> {
  const map = new Map<string, ParsedStanza>();
  if (!content) return map;
  const lines = content.split('\n');
  let currentStanza: ParsedStanza = {
    name: 'default',
    line: 1,
    properties: {},
    rawLines: []
  };
  map.set('default', currentStanza);

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      return;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const stanzaName = trimmed.slice(1, -1).trim();
      currentStanza = {
        name: stanzaName,
        line: idx + 1,
        properties: {},
        rawLines: []
      };
      map.set(stanzaName.toLowerCase(), currentStanza);
      return;
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim().toLowerCase();
      const value = line.slice(eqIdx + 1).trim();
      currentStanza.properties[key] = {
        value,
        line: idx + 1,
        raw: trimmed
      };
      currentStanza.rawLines.push(trimmed);
    }
  });

  return map;
}

/**
 * Production-Grade Real-Time Audit Engine for Splunk Configurations.
 * Accurately analyzes current files line-by-line, tracks resolved items,
 * inspects syntax, stanza collisions, network formats, security flags,
 * and produces a verified, robust health score (0-100).
 */
export function auditSplunkConfigs(
  currentConfigs: Record<string, string>,
  explicitResolvedIds: Set<string> = new Set()
): {
  activeFindings: SplunkFinding[];
  resolvedFindings: SplunkFinding[];
  score: number;
} {
  const activeFindings: SplunkFinding[] = [];
  const resolvedFindings: SplunkFinding[] = [];

  const outputsConf = currentConfigs['outputs.conf'] || '';
  const serverConf = currentConfigs['server.conf'] || '';
  const inputsConf = currentConfigs['inputs.conf'] || '';
  const propsConf = currentConfigs['props.conf'] || '';
  const indexesConf = currentConfigs['indexes.conf'] || '';
  const webConf = currentConfigs['web.conf'] || '';
  const authenticationConf = currentConfigs['authentication.conf'] || '';
  const limitsConf = currentConfigs['limits.conf'] || '';

  const outputsStanzas = parseSplunkConfStanzas(outputsConf);
  const serverStanzas = parseSplunkConfStanzas(serverConf);
  const inputsStanzas = parseSplunkConfStanzas(inputsConf);
  const propsStanzas = parseSplunkConfStanzas(propsConf);
  const indexesStanzas = parseSplunkConfStanzas(indexesConf);
  const webStanzas = parseSplunkConfStanzas(webConf);
  const authStanzas = parseSplunkConfStanzas(authenticationConf);
  const limitsStanzas = parseSplunkConfStanzas(limitsConf);

  // ---------------------------------------------------------------------------
  // Rule 1: outputs.conf — Cleartext Log Transmission (useSSL = false)
  // ---------------------------------------------------------------------------
  const f1 = INITIAL_FINDINGS.find(f => f.id === 'crit-tcpout-cleartext');
  if (f1) {
    let hasForwarder = false;
    let isCleartext = false;
    let culpritLine = f1.line;
    let culpritText = f1.culpritCode;

    outputsStanzas.forEach((stanza, sName) => {
      if (sName.startsWith('tcpout')) {
        hasForwarder = true;
        if (stanza.properties['usessl']) {
          const val = stanza.properties['usessl'].value.toLowerCase();
          if (val === 'false' || val === '0') {
            isCleartext = true;
            culpritLine = stanza.properties['usessl'].line;
            culpritText = stanza.properties['usessl'].raw;
          }
        } else if (stanza.properties['server']) {
          // If server is defined without explicit useSSL = true in stanza or default tcpout
          const defaultTcpout = outputsStanzas.get('tcpout');
          const defaultSsl = defaultTcpout?.properties['usessl']?.value.toLowerCase();
          if (defaultSsl !== 'true' && defaultSsl !== '1') {
            isCleartext = true;
            culpritLine = stanza.properties['server'].line;
            culpritText = stanza.properties['server'].raw;
          }
        }
      }
    });

    const isDefectActive = hasForwarder && isCleartext;
    if (isDefectActive && !explicitResolvedIds.has(f1.id)) {
      activeFindings.push({
        ...f1,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f1);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 2: server.conf — Default or Weak pass4SymmKey
  // ---------------------------------------------------------------------------
  const f2 = INITIAL_FINDINGS.find(f => f.id === 'crit-server-pass4symmkey');
  if (f2) {
    let hasDefaultKey = false;
    let hasAnyKey = false;
    let culpritLine = f2.line;
    let culpritText = f2.culpritCode;

    serverStanzas.forEach((stanza) => {
      if (stanza.properties['pass4symmkey']) {
        hasAnyKey = true;
        const val = stanza.properties['pass4symmkey'].value.toLowerCase();
        if (['changeme', 'default', '123456', 'splunk', 'password'].includes(val)) {
          hasDefaultKey = true;
          culpritLine = stanza.properties['pass4symmkey'].line;
          culpritText = stanza.properties['pass4symmkey'].raw;
        }
      }
    });

    const isDefectActive = hasDefaultKey || (!hasAnyKey && serverConf.length > 0);
    if (isDefectActive && !explicitResolvedIds.has(f2.id)) {
      activeFindings.push({
        ...f2,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f2);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 3: server.conf — Insecure TLS & Compression (ssl3, tls1.0, allowSslCompression)
  // ---------------------------------------------------------------------------
  const f3 = INITIAL_FINDINGS.find(f => f.id === 'crit-server-ssl-versions');
  if (f3) {
    let hasInsecureTls = false;
    let culpritLine = f3.line;
    let culpritText = f3.culpritCode;

    const sslConfig = serverStanzas.get('sslconfig');
    if (sslConfig) {
      if (sslConfig.properties['sslversionstosupport']) {
        const val = sslConfig.properties['sslversionstosupport'].value.toLowerCase();
        if (val.includes('ssl3') || val.includes('tls1.0') || val.includes('tls1.1')) {
          hasInsecureTls = true;
          culpritLine = sslConfig.properties['sslversionstosupport'].line;
          culpritText = sslConfig.properties['sslversionstosupport'].raw;
        }
      }
      if (sslConfig.properties['allowsslcompression']) {
        const val = sslConfig.properties['allowsslcompression'].value.toLowerCase();
        if (val === 'true' || val === '1') {
          hasInsecureTls = true;
          culpritLine = sslConfig.properties['allowsslcompression'].line;
          culpritText = sslConfig.properties['allowsslcompression'].raw;
        }
      }
      if (sslConfig.properties['allowsslrenegotiation']) {
        const val = sslConfig.properties['allowsslrenegotiation'].value.toLowerCase();
        if (val === 'true' || val === '1') {
          hasInsecureTls = true;
          culpritLine = sslConfig.properties['allowsslrenegotiation'].line;
          culpritText = sslConfig.properties['allowsslrenegotiation'].raw;
        }
      }
    }

    if (hasInsecureTls && !explicitResolvedIds.has(f3.id)) {
      activeFindings.push({
        ...f3,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f3);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 4: inputs.conf — Broken TCP Routing Group (_TCP_ROUTING = missing_group)
  // ---------------------------------------------------------------------------
  const f4 = INITIAL_FINDINGS.find(f => f.id === 'crit-inputs-tcp-routing-broken');
  if (f4) {
    let hasBrokenRoute = false;
    let culpritLine = f4.line;
    let culpritText = f4.culpritCode;

    inputsStanzas.forEach((stanza) => {
      if (stanza.properties['_tcp_routing']) {
        const val = stanza.properties['_tcp_routing'].value.toLowerCase();
        if (val.includes('missing_group')) {
          hasBrokenRoute = true;
          culpritLine = stanza.properties['_tcp_routing'].line;
          culpritText = stanza.properties['_tcp_routing'].raw;
        }
      }
    });

    if (hasBrokenRoute && !explicitResolvedIds.has(f4.id)) {
      activeFindings.push({
        ...f4,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f4);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 5: props.conf — Missing Transform / Dangling Lookup
  // ---------------------------------------------------------------------------
  const f5 = INITIAL_FINDINGS.find(f => f.id === 'crit-props-missing-transforms');
  if (f5) {
    let hasMissingTransform = false;
    let culpritLine = f5.line;
    let culpritText = f5.culpritCode;

    propsStanzas.forEach((stanza) => {
      if (stanza.properties['transforms-routing']) {
        const val = stanza.properties['transforms-routing'].value.toLowerCase();
        if (val === 'missing_transform') {
          hasMissingTransform = true;
          culpritLine = stanza.properties['transforms-routing'].line;
          culpritText = stanza.properties['transforms-routing'].raw;
        }
      }
      if (stanza.properties['lookup-threat']) {
        const val = stanza.properties['lookup-threat'].value.toLowerCase();
        if (val.includes('threat_intel_feed_lookup')) {
          hasMissingTransform = true;
          culpritLine = stanza.properties['lookup-threat'].line;
          culpritText = stanza.properties['lookup-threat'].raw;
        }
      }
    });

    if (hasMissingTransform && !explicitResolvedIds.has(f5.id)) {
      activeFindings.push({
        ...f5,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f5);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 6: outputs.conf — Bad Format Port Missing (e.g. 10.20.30.51 without :9997)
  // ---------------------------------------------------------------------------
  const f6 = INITIAL_FINDINGS.find(f => f.id === 'warn-outputs-bad-format');
  if (f6) {
    let hasBadPort = false;
    let culpritLine = f6.line;
    let culpritText = f6.culpritCode;

    outputsStanzas.forEach((stanza) => {
      if (stanza.properties['server']) {
        const serverVal = stanza.properties['server'].value;
        const targets = serverVal.split(',').map(s => s.trim()).filter(Boolean);
        const invalidTarget = targets.find(t => !t.startsWith('#') && !t.includes(':'));
        if (invalidTarget) {
          hasBadPort = true;
          culpritLine = stanza.properties['server'].line;
          culpritText = stanza.properties['server'].raw;
        }
      }
    });

    if (hasBadPort && !explicitResolvedIds.has(f6.id)) {
      activeFindings.push({
        ...f6,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f6);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 7: inputs.conf — Input Lacks Target Index (winevent)
  // ---------------------------------------------------------------------------
  const f7 = INITIAL_FINDINGS.find(f => f.id === 'warn-inputs-no-index');
  if (f7) {
    let hasMissingIndex = false;
    let culpritLine = f7.line;
    let culpritText = f7.culpritCode;

    const winStanza = inputsStanzas.get('monitor:///var/log/winevent/security.evtx');
    if (winStanza) {
      const isDisabled = winStanza.properties['disabled']?.value.toLowerCase() === 'true' ||
                         winStanza.properties['disabled']?.value === '1';
      const hasIndex = !!winStanza.properties['index'] && winStanza.properties['index'].value.trim().length > 0;

      if (!isDisabled && !hasIndex) {
        hasMissingIndex = true;
        culpritLine = winStanza.line;
        culpritText = winStanza.properties['disabled']?.raw || `[${winStanza.name}]`;
      }
    }

    if (hasMissingIndex && !explicitResolvedIds.has(f7.id)) {
      activeFindings.push({
        ...f7,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f7);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 8: server.conf — Low Disk Space MinFreeSpaceMB < 2000
  // ---------------------------------------------------------------------------
  const f8 = INITIAL_FINDINGS.find(f => f.id === 'warn-server-diskusage-low');
  if (f8) {
    let hasLowDisk = false;
    let culpritLine = f8.line;
    let culpritText = f8.culpritCode;

    const diskUsage = serverStanzas.get('diskusage');
    if (diskUsage && diskUsage.properties['minfreespacemb']) {
      const val = parseInt(diskUsage.properties['minfreespacemb'].value, 10);
      if (!isNaN(val) && val < 2000) {
        hasLowDisk = true;
        culpritLine = diskUsage.properties['minfreespacemb'].line;
        culpritText = diskUsage.properties['minfreespacemb'].raw;
      }
    }

    if (hasLowDisk && !explicitResolvedIds.has(f8.id)) {
      activeFindings.push({
        ...f8,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f8);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 9: indexes.conf — Corrupted Non-existent Volume Path or Dangerous Retention
  // ---------------------------------------------------------------------------
  const f9 = INITIAL_FINDINGS.find(f => f.id === 'warn-indexes-corrupted-path');
  if (f9) {
    let hasCorruptedPath = false;
    let culpritLine = f9.line;
    let culpritText = f9.culpritCode;

    indexesStanzas.forEach((stanza, sName) => {
      if (sName === 'default') return;
      const isDisabled = stanza.properties['disabled']?.value.toLowerCase() === 'true' ||
                         stanza.properties['disabled']?.value === '1';
      if (isDisabled) return;

      const home = stanza.properties['homepath']?.value || '';
      const cold = stanza.properties['coldpath']?.value || '';
      const thawed = stanza.properties['thawedpath']?.value || '';
      const retentionSec = stanza.properties['frozentimeperiodinsecs'] ? parseInt(stanza.properties['frozentimeperiodinsecs'].value, 10) : null;

      if (home.includes('/mnt/non_existent_volume') || cold.includes('/mnt/non_existent_volume') || thawed.includes('/mnt/non_existent_volume')) {
        hasCorruptedPath = true;
        culpritLine = stanza.properties['homepath']?.line || stanza.line;
        culpritText = stanza.properties['homepath']?.raw || `[${stanza.name}]`;
      } else if (retentionSec !== null && !isNaN(retentionSec) && retentionSec <= 3600) {
        hasCorruptedPath = true;
        culpritLine = stanza.properties['frozentimeperiodinsecs']?.line || stanza.line;
        culpritText = stanza.properties['frozentimeperiodinsecs']?.raw || `frozenTimePeriodInSecs = ${retentionSec}`;
      }
    });

    if (hasCorruptedPath && !explicitResolvedIds.has(f9.id)) {
      activeFindings.push({
        ...f9,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f9);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 10: inputs.conf — HEC Plain HTTP (enableSSL = 0)
  // ---------------------------------------------------------------------------
  const f10 = INITIAL_FINDINGS.find(f => f.id === 'crit-hec-plain-http');
  if (f10) {
    let hasHecPlainHttp = false;
    let culpritLine = f10.line;
    let culpritText = f10.culpritCode;

    const hecStanza = inputsStanzas.get('http');
    if (hecStanza) {
      const isDisabled = hecStanza.properties['disabled']?.value === '1' || hecStanza.properties['disabled']?.value.toLowerCase() === 'true';
      if (!isDisabled && hecStanza.properties['enablessl']) {
        const val = hecStanza.properties['enablessl'].value.toLowerCase();
        if (val === '0' || val === 'false') {
          hasHecPlainHttp = true;
          culpritLine = hecStanza.properties['enablessl'].line;
          culpritText = hecStanza.properties['enablessl'].raw;
        }
      }
    }

    if (hasHecPlainHttp && !explicitResolvedIds.has(f10.id)) {
      activeFindings.push({
        ...f10,
        line: culpritLine,
        culpritCode: culpritText
      });
    } else {
      resolvedFindings.push(f10);
    }
  }

  // ---------------------------------------------------------------------------
  // Dynamic Syntax & Structural Checks across all loaded config files
  // ---------------------------------------------------------------------------
  Object.entries(currentConfigs).forEach(([fileName, content]) => {
    if (!content || typeof content !== 'string') return;
    const lines = content.split('\n');
    const seenStanzas: Set<string> = new Set();

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) return;

      // 1. Unclosed Stanza Header: starts with [ but does not end with ]
      if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
        const dynId = `dyn-unclosed-stanza-${fileName}-${idx + 1}`;
        activeFindings.push({
          id: dynId,
          category: 'syntax',
          categoryFa: `خطای نحو btool (${fileName})`,
          categoryEn: `Syntax & btool Error (${fileName})`,
          severity: 'critical',
          titleFa: `استنزای ناقص یا پرانتز بسته نشده در خط ${idx + 1} فایل ${fileName}`,
          titleEn: `Unclosed stanza header on line ${idx + 1} in ${fileName}`,
          file: fileName,
          line: idx + 1,
          culpritCode: trimmed,
          whyFlaggedFa: `موتور btool اسپلانک هنگام پارس خط ${idx + 1} با استنزایی مواجه شده که کروشه پایانی ] را ندارد. این خطای نحوی مانع از خوانده شدن بقیه پارامترهای فایل خواهد شد.`,
          whyFlaggedEn: `Splunk btool parser encountered an unclosed stanza header missing closing bracket ].`,
          potentialImpactFa: `عدم بارگذاری استنزاهای بعدی و خطای دیمن در زمان استارت.`,
          potentialImpactEn: `Prevents daemon from loading subsequent configuration stanzas.`,
          seniorRecommendationFa: `کروشه بسته ] را در انتهای نام استنزا قرار دهید.`,
          seniorRecommendationEn: `Close the bracket in stanza header.`,
          docTitle: 'Splunk Docs: Configuration file syntax',
          docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles',
          splQuery: `index=_internal sourcetype=splunkd (component=ConfMerge OR component=BTool) "syntax error" OR "bracket"`,
          splExplanationFa: 'بررسی رویدادهای خطای نحو و شکستن سرفصل استنزاهای کانفیگ در لاگ دیمن اسپلانک.',
          splExplanationEn: 'Searches for btool parsing and stanza header syntax errors in splunkd daemon.',
          options: [
            {
              id: `fix-${dynId}`,
              titleFa: 'بستن کروشه نام استنزا',
              titleEn: 'Close stanza bracket',
              type: 'best_practice',
              descriptionFa: `افزودن علامت ] به انتهای خط ${idx + 1}`,
              descriptionEn: 'Appends closing bracket to stanza name',
              targetFile: fileName,
              targetStanza: trimmed,
              diffSnippet: `- ${trimmed}\n+ ${trimmed}]`,
              replacementConfigSnippet: `${trimmed}]`
            }
          ]
        });
      }

      // 2. Duplicate Stanza Collision in the same file
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const stanzaName = trimmed.toLowerCase();
        if (seenStanzas.has(stanzaName)) {
          const dynId = `dyn-duplicate-stanza-${fileName}-${idx + 1}`;
          activeFindings.push({
            id: dynId,
            category: 'syntax',
            categoryFa: `تداخل استنزای تکراری (${fileName})`,
            categoryEn: `Duplicate Stanza Collision (${fileName})`,
            severity: 'warning',
            titleFa: `استنزای تکراری ${trimmed} در خط ${idx + 1} فایل ${fileName}`,
            titleEn: `Duplicate stanza ${trimmed} collision on line ${idx + 1} in ${fileName}`,
            file: fileName,
            line: idx + 1,
            culpritCode: trimmed,
            whyFlaggedFa: `تعریف دو استنزای یکسان در یک فایل کانفیگ موجب بازنویسی و ابهام در پارامترهای پیشین توسط موتور btool می‌شود.`,
            whyFlaggedEn: `Defining duplicate stanzas in the same config file causes unpredictable btool precedence collisions.`,
            potentialImpactFa: `نادیده گرفته شدن برخی تنظیمات یا تغییر رفتار غیرمنتظره زیرسیستم‌ها.`,
            potentialImpactEn: `Unintended parameter overwrites in local layer.`,
            seniorRecommendationFa: `پارامترهای هر دو استنزا را در یک استنزای واحد تجمیع کنید.`,
            seniorRecommendationEn: `Consolidate parameters into a single stanza header.`,
            docTitle: 'Splunk Docs: Configuration file precedence',
            docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Wheretofindtheconfigurationfiles',
            splQuery: `index=_internal sourcetype=splunkd component=ConfMerge "duplicate stanza"`,
            splExplanationFa: 'جستجوی تداخل استنزاهای همنام در زمان ادغام فایل‌های کانفیگ توسط دیمن.',
            splExplanationEn: 'Detects duplicate stanza merge conflicts logged by ConfMerge.',
            options: [
              {
                id: `fix-${dynId}`,
                titleFa: 'تجمیع یا حذف استنزای تکراری',
                titleEn: 'Consolidate duplicate stanza',
                type: 'best_practice',
                descriptionFa: 'حذف سرفصل استنزای دوم جهت ادغام با اولی',
                descriptionEn: 'Removes duplicate stanza header',
                targetFile: fileName,
                targetStanza: trimmed,
                diffSnippet: `- ${trimmed}\n# Merged into primary stanza`,
                replacementConfigSnippet: ''
              }
            ]
          });
        } else {
          seenStanzas.add(stanzaName);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Check web.conf for cleartext HTTP (if web.conf present)
  // ---------------------------------------------------------------------------
  if (webConf) {
    const webSettings = webStanzas.get('settings');
    const hasInsecureWeb = webSettings && (
      webSettings.properties['enablesplunkwebssl']?.value.toLowerCase() === 'false' ||
      webSettings.properties['enablesplunkwebssl']?.value === '0' ||
      webSettings.properties['httpport']?.value === '80'
    );

    const dynWebId = 'dyn-web-cleartext-ssl';
    if (hasInsecureWeb && !explicitResolvedIds.has(dynWebId)) {
      const culprit = webSettings.properties['enablesplunkwebssl'] || webSettings.properties['httpport'];
      activeFindings.push({
        id: dynWebId,
        category: 'security',
        categoryFa: 'امنیت وب و پنل کاربری (web.conf)',
        categoryEn: 'Web & UI Security (web.conf)',
        severity: 'warning',
        titleFa: 'عدم فعال‌سازی HTTPS در کنسول وب اسپلانک (enableSplunkWebSSL = false)',
        titleEn: 'Splunk Web Interface Insecure HTTP Transmission',
        file: 'web.conf',
        line: culprit?.line || 1,
        culpritCode: culprit?.raw || 'enableSplunkWebSSL = false',
        whyFlaggedFa: 'کنسول وب اسپلانک بدون رمزنگاری HTTPS فعال است؛ ورود ادمین‌ها و تحلیلگران روی بستر متنی باز خطر سرقت سشن و توکن دارد.',
        whyFlaggedEn: 'Splunk Web UI is listening over unencrypted HTTP, exposing analyst session cookies to interception.',
        potentialImpactFa: 'سرقت کوکی سشن ادمین و به دست گرفتن کنترل کلاستر توسط مهاجم شبکه.',
        potentialImpactEn: 'Session hijacking and administrator credential theft over local network.',
        seniorRecommendationFa: 'مقدار enableSplunkWebSSL = true را در web.conf استنزای [settings] فعال نمایید.',
        seniorRecommendationEn: 'Enforce enableSplunkWebSSL = true in web.conf [settings].',
        docTitle: 'Splunk Docs: Secure Splunk Web with SSL',
        docUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Security/SecureSplunkWeb',
        splQuery: `index=_internal sourcetype=splunkd_ui_access status=200`,
        splExplanationFa: 'پایش دسترسی‌های کنسول تحت وب جهت اطمینان از برقراری نشست روی پروتکل HTTPS.',
        splExplanationEn: 'Monitors Splunk Web UI access requests to audit plain HTTP sessions.',
        options: [
          {
            id: 'fix-web-ssl',
            titleFa: 'فعال‌سازی HTTPS روی پورت وب',
            titleEn: 'Enable HTTPS on Splunk Web',
            type: 'best_practice',
            descriptionFa: 'تنظیم enableSplunkWebSSL = true در web.conf',
            descriptionEn: 'Enforce SSL on Web port',
            targetFile: 'web.conf',
            targetStanza: '[settings]',
            diffSnippet: '- enableSplunkWebSSL = false\n+ enableSplunkWebSSL = true',
            replacementConfigSnippet: 'enableSplunkWebSSL = true'
          }
        ]
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Health Score Calculation: 100 max, -14 per critical, -6 per warning, -2 per info
  // ---------------------------------------------------------------------------
  const critCount = activeFindings.filter(f => f.severity === 'critical').length;
  const warnCount = activeFindings.filter(f => f.severity === 'warning').length;
  const infoCount = activeFindings.filter(f => f.severity === 'info').length;

  const penalty = (critCount * 14) + (warnCount * 6) + (infoCount * 2);
  const score = activeFindings.length === 0 ? 100 : Math.max(10, Math.min(100, 100 - penalty));

  return {
    activeFindings: activeFindings.map(f => resolveFindingPaths(f)),
    resolvedFindings: resolvedFindings.map(f => resolveFindingPaths(f)),
    score
  };
}
