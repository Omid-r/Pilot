// Splunk Configuration Parser for dynamic topology, diagram, and cluster settings
import { ClusterSettings } from '../types';

export interface ParsedLogInput {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  targetServerIp: string;
  port: number;
  protocol: 'UDP' | 'TCP' | 'HEC/HTTPS' | 'SplunkTCP' | 'File Monitor';
  sourcetype: string;
  targetIndex: string;
  eventsPerSec: number;
  status: 'active' | 'warning' | 'error';
  stanza: string;
}

export interface ParsedClusterNodes {
  serverName?: string;
  serverIp?: string;
  indexers: Array<{ ip: string; host: string; port: number }>;
  searchHead?: { ip: string; host: string; port: number };
  deploymentServer?: { ip: string; host: string; port: number };
  clusterMaster?: { ip: string; host: string; port: number };
  licenseMaster?: { ip: string; host: string; port: number };
}

/**
 * Parses inputs.conf content into rich, structured log sources
 */
export function parseInputsConf(inputsContent: string, currentServerIp: string = '10.20.30.45'): ParsedLogInput[] {
  if (!inputsContent || !inputsContent.trim()) {
    return [
      {
        id: 'udp-514',
        name: 'Palo Alto Firewall (pan:traffic)',
        hostname: 'fw-edge01.corp.net',
        ip: '192.168.10.50',
        targetServerIp: currentServerIp,
        port: 514,
        protocol: 'UDP',
        sourcetype: 'pan:traffic',
        targetIndex: 'net_firewall',
        eventsPerSec: 1400,
        status: 'active',
        stanza: '[udp://514]'
      },
      {
        id: 'tcp-1514',
        name: 'Wazuh EDR & SIEM Sensor',
        hostname: 'wazuh-agent.corp.net',
        ip: '192.168.10.65',
        targetServerIp: currentServerIp,
        port: 1514,
        protocol: 'TCP',
        sourcetype: 'wazuh:alerts',
        targetIndex: 'wazuh_alerts',
        eventsPerSec: 620,
        status: 'active',
        stanza: '[tcp://1514]'
      },
      {
        id: 'mon-ad',
        name: 'Active Directory DC (WinEvent)',
        hostname: 'dc01-ad.corp.net',
        ip: '10.20.30.12',
        targetServerIp: currentServerIp,
        port: 9997,
        protocol: 'SplunkTCP',
        sourcetype: 'XmlWinEventLog:Security',
        targetIndex: 'main',
        eventsPerSec: 980,
        status: 'active',
        stanza: '[monitor:///var/log/winevent/security.evtx]'
      },
      {
        id: 'hec-k8s',
        name: 'K8s NGINX Ingress (HEC)',
        hostname: 'ingress-prod.k8s.corp',
        ip: '172.16.4.88',
        targetServerIp: currentServerIp,
        port: 8088,
        protocol: 'HEC/HTTPS',
        sourcetype: 'nginx:plus:access',
        targetIndex: 'web_ingress',
        eventsPerSec: 2100,
        status: 'active',
        stanza: '[http://k8s-ingress-token]'
      }
    ];
  }

  const results: ParsedLogInput[] = [];
  const stanzas = inputsContent.split(/^\[/m);

  let defaultHost = 'hf01.corp.net';
  const defaultMatch = inputsContent.match(/\[default\][\s\S]*?host\s*=\s*([^\r\n#]+)/i);
  if (defaultMatch) {
    defaultHost = defaultMatch[1].trim();
  }

  stanzas.forEach((st, idx) => {
    if (!st.trim()) return;
    const headerMatch = st.match(/^([^\]]+)\]/);
    if (!headerMatch) return;
    const header = headerMatch[1].trim();
    if (header === 'default') return;

    const body = st.slice(headerMatch[0].length);
    const indexMatch = body.match(/index\s*=\s*([^\r\n#]+)/i);
    const sourcetypeMatch = body.match(/sourcetype\s*=\s*([^\r\n#]+)/i);
    const targetIndex = indexMatch ? indexMatch[1].trim() : 'main';
    const sourcetype = sourcetypeMatch ? sourcetypeMatch[1].trim() : 'generic_log';

    // 1. UDP Inputs
    if (header.startsWith('udp://')) {
      const port = parseInt(header.replace('udp://', ''), 10) || 514;
      results.push({
        id: `udp-${port}-${idx}`,
        name: port === 514 ? 'Syslog / Palo Alto Firewall' : `UDP Syslog Inbound (${port})`,
        hostname: port === 514 ? 'fw-edge01.corp.net' : `syslog-udp-${port}.local`,
        ip: port === 514 ? '192.168.10.50' : '192.168.10.100',
        targetServerIp: currentServerIp,
        port,
        protocol: 'UDP',
        sourcetype,
        targetIndex,
        eventsPerSec: port === 514 ? 1400 : 450,
        status: 'active',
        stanza: `[${header}]`
      });
    }
    // 2. TCP Inputs
    else if (header.startsWith('tcp://')) {
      const port = parseInt(header.replace('tcp://', ''), 10) || 1514;
      results.push({
        id: `tcp-${port}-${idx}`,
        name: port === 1514 ? 'Wazuh EDR & SIEM Sensor' : `TCP Raw Stream (${port})`,
        hostname: port === 1514 ? 'wazuh-agent.corp.net' : `tcp-source-${port}.local`,
        ip: port === 1514 ? '192.168.10.65' : '192.168.10.110',
        targetServerIp: currentServerIp,
        port,
        protocol: 'TCP',
        sourcetype,
        targetIndex,
        eventsPerSec: port === 1514 ? 620 : 380,
        status: 'active',
        stanza: `[${header}]`
      });
    }
    // 3. Splunk TCP (9997)
    else if (header.startsWith('splunktcp://') || header.startsWith('splunktcp:') || header.startsWith('splunktcp-ssl:')) {
      const portStr = header.split('://')[1] || header.split(':')[1] || '9997';
      const port = parseInt(portStr, 10) || 9997;
      results.push({
        id: `splunktcp-${port}-${idx}`,
        name: 'Splunk Universal Forwarders',
        hostname: 'uf-cluster.corp.net',
        ip: '10.20.30.12',
        targetServerIp: currentServerIp,
        port,
        protocol: 'SplunkTCP',
        sourcetype: sourcetype !== 'generic_log' ? sourcetype : 'XmlWinEventLog:Security',
        targetIndex,
        eventsPerSec: 1850,
        status: 'active',
        stanza: `[${header}]`
      });
    }
    // 4. HEC (HTTP Event Collector)
    else if (header === 'http' || header.startsWith('http://')) {
      const portMatch = body.match(/port\s*=\s*(\d+)/i);
      const port = portMatch ? parseInt(portMatch[1], 10) : 8088;
      results.push({
        id: `hec-${port}-${idx}`,
        name: header.startsWith('http://') ? `HEC Token (${header.replace('http://', '')})` : 'HTTP Event Collector (HEC)',
        hostname: 'ingress-k8s.corp.net',
        ip: '172.16.4.88',
        targetServerIp: currentServerIp,
        port,
        protocol: 'HEC/HTTPS',
        sourcetype,
        targetIndex,
        eventsPerSec: 2100,
        status: 'active',
        stanza: `[${header}]`
      });
    }
    // 5. File Monitors
    else if (header.startsWith('monitor://')) {
      const filePath = header.replace('monitor://', '');
      const isWin = filePath.includes('winevent') || filePath.includes('evtx');
      const isSec = filePath.includes('secure') || filePath.includes('auth');
      results.push({
        id: `mon-${idx}`,
        name: isWin ? 'Active Directory DC (WinEvent)' : isSec ? 'Linux Auth Log (/var/log/secure)' : `File: ${filePath.split('/').pop()}`,
        hostname: isWin ? 'dc01-ad.corp.net' : defaultHost,
        ip: isWin ? '10.20.30.12' : currentServerIp,
        targetServerIp: currentServerIp,
        port: isWin ? 9997 : 0,
        protocol: isWin ? 'SplunkTCP' : 'File Monitor',
        sourcetype,
        targetIndex,
        eventsPerSec: isWin ? 980 : 120,
        status: 'active',
        stanza: `[${header}]`
      });
    }
  });

  return results.length > 0 ? results : parseInputsConf('', currentServerIp);
}

/**
 * Extracts cluster components and peer nodes from Splunk configs
 */
export function extractClusterFromConfigs(configs: Record<string, string>): ParsedClusterNodes {
  const result: ParsedClusterNodes = {
    indexers: []
  };

  // 1. outputs.conf -> Destination Indexers
  const outputs = configs['outputs.conf'] || '';
  const serverLine = outputs.match(/server\s*=\s*([^\r\n#]+)/i);
  if (serverLine) {
    const rawServers = serverLine[1].split(',').map(s => s.trim()).filter(Boolean);
    rawServers.forEach((srv, i) => {
      const cleanSrv = srv.replace(/\/+$/, '');
      const parts = cleanSrv.split(':');
      const hostOrIp = parts[0];
      const port = parts[1] ? parseInt(parts[1], 10) : 9997;
      
      const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostOrIp);
      result.indexers.push({
        ip: isIp ? hostOrIp : `10.20.30.${50 + i}`,
        host: isIp ? `idx0${i + 1}-peer.corp.net` : hostOrIp,
        port
      });
    });
  }

  // 2. server.conf -> Server Name, Master URI, License Manager
  const server = configs['server.conf'] || '';
  const sName = server.match(/\[general\][\s\S]*?serverName\s*=\s*([^\r\n#]+)/i) || server.match(/serverName\s*=\s*([^\r\n#]+)/i);
  if (sName) result.serverName = sName[1].trim();

  const cmUri = server.match(/\[clustering\][\s\S]*?master_uri\s*=\s*([^\r\n#]+)/i) || server.match(/master_uri\s*=\s*([^\r\n#]+)/i);
  if (cmUri) {
    const raw = cmUri[1].replace(/https?:\/\//i, '').trim();
    const parts = raw.split(':');
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parts[0]);
    result.clusterMaster = {
      ip: isIp ? parts[0] : '10.20.30.20',
      host: isIp ? 'cm01-master.corp.net' : parts[0],
      port: parts[1] ? parseInt(parts[1], 10) : 8089
    };
  }

  // 3. deploymentclient.conf -> Deployment Server
  const dc = configs['deploymentclient.conf'] || '';
  const targetUri = dc.match(/targetUri\s*=\s*([^\r\n#]+)/i);
  if (targetUri) {
    const raw = targetUri[1].replace(/https?:\/\//i, '').trim();
    const parts = raw.split(':');
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parts[0]);
    result.deploymentServer = {
      ip: isIp ? parts[0] : '10.20.30.60',
      host: isIp ? 'ds01-deploy.corp.net' : parts[0],
      port: parts[1] ? parseInt(parts[1], 10) : 8089
    };
  }

  return result;
}

/**
 * Converts extracted cluster nodes to ClusterSettings
 */
export function clusterNodesToSettings(nodes: ParsedClusterNodes, current: ClusterSettings): ClusterSettings {
  const s: ClusterSettings = { ...current };
  if (nodes.serverName) s.hfHost = nodes.serverName;
  if (nodes.serverIp) s.hfIp = nodes.serverIp;
  if (nodes.indexers.length > 0) {
    s.idx1Host = nodes.indexers[0].host;
    s.idx1Ip = nodes.indexers[0].ip;
  }
  if (nodes.indexers.length > 1) {
    s.idx2Host = nodes.indexers[1].host;
    s.idx2Ip = nodes.indexers[1].ip;
  }
  if (nodes.searchHead) {
    s.shHost = nodes.searchHead.host;
    s.shIp = nodes.searchHead.ip;
  }
  if (nodes.deploymentServer) {
    s.dsHost = nodes.deploymentServer.host;
    s.dsIp = nodes.deploymentServer.ip;
  }
  return s;
}
