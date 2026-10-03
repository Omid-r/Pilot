import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import net from 'net';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface RegistrationDeps {
  requireAuth: express.RequestHandler;
}

const ALLOWED_PORTS = new Set([22, 80, 443, 3000, 8088, 8089, 8000, 8001, 8090, 8091, 8181, 8191, 8192, 8193, 8194, 9997, 9998, 9999, 514, 1514]);
const PACKAGE_ROOTS = [
  '/opt/splunk-doctor/artifacts',
  '/opt/dr-splunk/artifacts',
  '/opt/splunk/artifacts',
  '/var/lib/splunk-doctor/artifacts'
];

function ok(res: express.Response, data: any) {
  res.status(200).json({ success: true, ...data });
}
function fail(res: express.Response, status: number, message: string, details?: any) {
  res.status(status).json({ success: false, error: message, details });
}

async function command(file: string, args: string[], options: { cwd?: string; timeoutMs?: number; input?: string } = {}) {
  const timeout = options.timeoutMs ?? 15000;
  if (options.input !== undefined) {
    return await new Promise<any>((resolve) => {
      const child = spawn(file, args, { cwd: options.cwd, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({ stdout, stderr: stderr + '\nTIMEOUT', code: 124 });
      }, timeout);
      child.stdout.on('data', b => { stdout += b.toString(); });
      child.stderr.on('data', b => { stderr += b.toString(); });
      child.on('close', code => { clearTimeout(timer); resolve({ stdout, stderr, code: code ?? 1 }); });
      child.stdin.end(options.input);
    });
  }
  try {
    const r = await execFileAsync(file, args, { cwd: options.cwd, timeout, maxBuffer: 12 * 1024 * 1024 });
    return { stdout: String(r.stdout ?? ''), stderr: String(r.stderr ?? ''), code: 0 };
  } catch (e: any) {
    return { stdout: String(e.stdout ?? ''), stderr: String(e.stderr ?? e.message ?? ''), code: typeof e.code === 'number' ? e.code : 1 };
  }
}

function commandSync(file: string, args: string[] = []): string {
  try {
    return require('child_process').execFileSync(file, args, { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function isRoot(): boolean {
  return typeof process.getuid === 'function' ? process.getuid() === 0 : false;
}

function firstNonLoopbackIPv4(): string {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return '127.0.0.1';
}

function parseJsonSafe<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function parseSs(text: string) {
  const listeners: any[] = [];
  const connections: any[] = [];
  for (const line of text.split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const proto = parts[0].toLowerCase();
    const state = parts[1];
    const local = parts[4] ?? '';
    const peer = parts[5] ?? '';
    const localPort = Number(local.slice(local.lastIndexOf(':') + 1));
    if (!Number.isFinite(localPort)) continue;
    const processInfo = parts.slice(6).join(' ');
    const row = { proto, state, local, peer, localPort, processInfo };
    if (state === 'LISTEN' || state === 'UNCONN') listeners.push(row);
    else if (state === 'ESTAB') connections.push(row);
  }
  return { listeners, connections };
}

async function tcpProbe(host: string, port: number, timeoutMs = 1800) {
  return await new Promise<any>((resolve) => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      resolve({ open: false, latencyMs: 0, error: 'Invalid port' });
      return;
    }
    const started = Date.now();
    const s = new net.Socket();
    let settled = false;
    const done = (value: any) => {
      if (settled) return;
      settled = true;
      try { s.destroy(); } catch {}
      resolve(value);
    };
    s.setTimeout(timeoutMs);
    s.once('connect', () => done({ open: true, latencyMs: Date.now() - started }));
    s.once('timeout', () => done({ open: false, latencyMs: Date.now() - started, error: 'timeout' }));
    s.once('error', e => done({ open: false, latencyMs: Date.now() - started, error: e.message }));
    s.connect(port, host);
  });
}

function expandCidr(cidr: string, maxHosts = 1024): string[] {
  const m = String(cidr).trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!m) throw new Error('CIDR must be IPv4, e.g. 10.10.10.0/24');
  const base = m[1].split('.').map(Number);
  const prefix = Number(m[2]);
  if (prefix < 0 || prefix > 32 || base.some(n => n < 0 || n > 255)) throw new Error('Invalid CIDR');
  const count = Math.pow(2, 32 - prefix);
  if (count > maxHosts) throw new Error('Subnet contains ' + count + ' addresses; maximum active-scan size is ' + maxHosts);
  const n = ((base[0] << 24) >>> 0) + (base[1] << 16) + (base[2] << 8) + base[3];
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const start = (n & mask) >>> 0;
  const end = (start + count - 1) >>> 0;
  const out: string[] = [];
  for (let x = start; x <= end; x++) {
    out.push([x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join('.'));
    if (x === 0xffffffff) break;
  }
  return out;
}

function artifactSearch(pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const root of PACKAGE_ROOTS) {
    if (!fs.existsSync(root)) continue;
    const walk = (dir: string) => {
      let entries: fs.Dirent[] = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (pattern.test(e.name)) hits.push(p);
      }
    };
    walk(root);
  }
  return hits.sort();
}

function backupFile(file: string, backupRoot: string): string {
  fs.mkdirSync(backupRoot, { recursive: true });
  const target = path.join(backupRoot, path.basename(file) + '.' + Date.now());
  fs.copyFileSync(file, target);
  return target;
}

function readOsRelease() {
  const raw = fs.existsSync('/etc/os-release') ? fs.readFileSync('/etc/os-release', 'utf8') : '';
  const out: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const i = line.indexOf('=');
    if (i < 0) continue;
    out[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, '');
  }
  return out;
}

function findSplunkHome(): string | null {
  const env = process.env.SPLUNK_HOME;
  if (env && fs.existsSync(path.join(env, 'bin', 'splunk'))) return env;
  for (const c of ['/opt/splunk', '/opt/splunkforwarder', '/usr/local/splunk', '/var/opt/splunk']) {
    if (fs.existsSync(path.join(c, 'bin', 'splunk'))) return c;
  }
  return null;
}

function healthFindings() {
  const osr = readOsRelease();
  const findings: any[] = [];
  const check = (id: string, title: string, category: string, pass: boolean, detail: string, remediation: string) => {
    findings.push({ id, title, category, status: pass ? 'PASS' : 'FAIL', detail, remediation });
  };

  check('root', 'Privileged execution', 'access', isRoot(), isRoot() ? 'Controller is running as root.' : 'Controller is not running as root.', 'Run the service through the root-owned systemd unit.');
  const selinux = commandSync('getenforce');
  check('selinux', 'SELinux enforcing', 'security', /^Enforcing$/i.test(selinux), selinux || 'getenforce unavailable', 'Review compatibility, then enforce SELinux.');
  const firewalld = commandSync('firewall-cmd', ['--state']);
  check('firewalld', 'Firewalld', 'network', /^running$/i.test(firewalld), firewalld || 'firewalld unavailable/inactive', 'Enable firewalld and open only approved service ports.');
  const thp = commandSync('cat', ['/sys/kernel/mm/transparent_hugepage/enabled']);
  check('thp', 'Transparent Huge Pages', 'performance', /\[never\]/.test(thp), thp || 'THP state unavailable', 'Disable THP after workload compatibility review; reboot may be required.');
  const swappiness = commandSync('sysctl', ['-n', 'vm.swappiness']);
  check('swappiness', 'vm.swappiness <= 10', 'performance', Number(swappiness) <= 10, swappiness || 'unavailable', 'Set an evidence-based value such as 1 on Splunk hosts.');
  const auditd = commandSync('systemctl', ['is-active', 'auditd']);
  check('auditd', 'auditd active', 'audit', /^active$/i.test(auditd), auditd || 'auditd inactive/not installed', 'Enable auditd where mandated.');
  const chrony = commandSync('systemctl', ['is-active', 'chronyd']);
  check('chrony', 'chronyd active', 'platform', /^active$/i.test(chrony), chrony || 'chronyd inactive/not installed', 'Enable chronyd for synchronized time.');
  const splunk = findSplunkHome();
  check('splunk', 'Splunk binary', 'splunk', Boolean(splunk), splunk ? 'Detected at ' + splunk : 'No Splunk binary detected.', 'Stage a licensed Splunk package in the offline artifact store.');

  if (splunk) {
    const btool = commandSync(path.join(splunk, 'bin', 'splunk'), ['btool', 'check'], 30000);
    check(
      'splunk-btool',
      'Splunk btool configuration',
      'splunk',
      !!btool && !/error|invalid|failed/i.test(btool),
      btool || 'btool returned no output; inspect exit status from direct CLI if needed.',
      'Run splunk btool check and fix configuration precedence/syntax errors before deployment.'
    );

    const readLocal = (name: string) => {
      const p = path.join(splunk, 'etc', 'system', 'local', name);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    };
    const webConf = readLocal('web.conf');
    const serverConf = readLocal('server.conf');
    const outputsConf = readLocal('outputs.conf');

    const webTls = /enableSplunkWebSSL\s*=\s*true/i.test(webConf);
    check(
      'splunk-web-tls',
      'Splunk Web TLS enabled',
      'splunk-security',
      webTls,
      webTls ? 'web.conf enables Splunk Web TLS.' : 'web.conf does not enable Splunk Web TLS.',
      'Configure web.conf [settings] enableSplunkWebSSL=true with a valid server certificate before production use.'
    );

    const splunkdTls = /enableSplunkdSSL\s*=\s*true/i.test(serverConf);
    check(
      'splunkd-tls',
      'splunkd management TLS',
      'splunk-security',
      splunkdTls,
      splunkdTls ? 'server.conf enables splunkd TLS.' : 'server.conf does not enable splunkd TLS.',
      'Configure [sslConfig] enableSplunkdSSL=true and valid certificates.'
    );

    const pass4 = /pass4SymmKey\s*=\s*([^\r\n#]+)/i.exec(serverConf)?.[1]?.trim() || '';
    const safePass4 = Boolean(pass4) && !/^(changeme|default|password|admin)$/i.test(pass4) && pass4.length >= 12;
    check(
      'splunk-pass4symmkey',
      'Splunk pass4SymmKey',
      'splunk-security',
      safePass4,
      safePass4 ? 'A non-default pass4SymmKey is configured.' : 'pass4SymmKey is missing, too short, or a known default.',
      'Configure a strong non-default pass4SymmKey for the relevant service stanzas.'
    );

    if (outputsConf) {
      const useSsl = /useSSL\s*=\s*true/i.test(outputsConf);
      const verify = /sslVerifyServerCert\s*=\s*true/i.test(outputsConf);
      check(
        'splunk-forwarding-tls',
        'Splunk forwarding TLS + certificate verification',
        'splunk-security',
        useSsl && verify,
        `useSSL=${useSsl}; sslVerifyServerCert=${verify}`,
        'Enable TLS and server-certificate verification for secure forwarding.'
      );
    }
  }

  return { os: osr, findings };
}

const REMOTE_HARDEN_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail
mkdir -p /etc/security/limits.d /etc/sysctl.d
cat > /etc/security/limits.d/99-splunk-orchestrator.conf <<'EOF'
splunk soft nofile 65535
splunk hard nofile 65535
splunk soft nproc 8192
splunk hard nproc 8192
EOF
cat > /etc/sysctl.d/99-splunk-orchestrator.conf <<'EOF'
vm.swappiness=1
vm.max_map_count=262144
net.ipv4.tcp_syncookies=1
fs.file-max=2097152
EOF
sysctl --system
if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=3000/tcp
  firewall-cmd --reload
fi
systemctl enable --now chronyd
printf '[REAL] hardening baseline applied\\n'
`;

async function remoteExec(host: string, sshUser: string, sshPort: number, script: string) {
  const safeUser = sshUser.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeUser || !host) throw new Error('SSH host and user are required');
  return await command('ssh', [
    '-o','BatchMode=yes','-o','ConnectTimeout=5','-o','StrictHostKeyChecking=accept-new',
    '-p',String(sshPort), safeUser + '@' + host, 'bash -s'
  ], { timeoutMs: 90000, input: script });
}

export function registerRealControlPlane(app: express.Express, deps: RegistrationDeps) {
  const auth = deps.requireAuth;

  app.get('/api/real/system', auth, (_req, res) => {
    const osInfo = readOsRelease();
    ok(res, {
      hostname: os.hostname(),
      primaryIp: firstNonLoopbackIPv4(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      os: osInfo,
      uid: typeof process.getuid === 'function' ? process.getuid() : null,
      isRoot: isRoot(),
      networkInterfaces: os.networkInterfaces(),
      artifacts: {
        splunk: artifactSearch(/splunk.*\.(rpm|tgz|tar\.gz)$/i),
        images: artifactSearch(/\.(tar|tar\.gz|oci)$/i),
        kubernetes: artifactSearch(/(operator|k8s|kubernetes).*\.(yaml|yml)$/i),
        k3s: artifactSearch(/k3s/i).slice(0, 30),
        osImages: artifactSearch(/\.(iso|img)$/i)
      }
    });
  });

  app.post('/api/real/network/scan', auth, async (req, res) => {
    try {
      const requestedCidr = typeof req.body?.cidr === 'string' ? req.body.cidr.trim() : '';
      const interfaces = parseJsonSafe(commandSync('ip', ['-json', 'addr']), []);
      const routes = parseJsonSafe(commandSync('ip', ['-json', 'route']), []);
      const neighbours = parseJsonSafe(commandSync('ip', ['-json', 'neigh']), []);
      const ss = parseSs(commandSync('ss', ['-H', '-tulpn']));
      const connections = parseSs(commandSync('ss', ['-H', '-tanp'])).connections;
      let activeHosts: any[] = [];
      if (requestedCidr) {
        const hosts = expandCidr(requestedCidr);
        for (let i = 0; i < hosts.length; i += 32) {
          const batch = hosts.slice(i, i + 32);
          const results = await Promise.all(batch.map(async (host) => {
            const ports = [22,80,443,3000,8000,8088,8089,9997];
            const probes = await Promise.all(ports.map(p => tcpProbe(host,p,900)));
            const openPorts = ports.filter((p, idx) => probes[idx].open);
            if (!openPorts.length) return null;
            return {
              id: 'node-' + host,
              hostname: host,
              ip: host,
              status: 'reachable',
              openPorts,
              services: openPorts.map(p => ({
                port: p,
                service: ({22:'ssh',80:'http',443:'https',3000:'dr-splunk',8000:'splunk-web',8088:'splunk-hec',8089:'splunk-mgmt',9997:'splunk-s2s'} as any)[p] || 'tcp'
              }))
            };
          }));
          activeHosts.push(...results.filter(Boolean));
        }
      }
      const neighbourNodes = (neighbours as any[]).map((n: any) => ({
        id: 'neigh-' + String(n.dst ?? 'unknown').replace(/[^a-zA-Z0-9_.-]/g,'_'),
        ip: n.dst,
        mac: n.lladdr,
        state: n.state,
        interface: n.dev,
        status: /REACHABLE|STALE|DELAY|PROBE/.test(String(n.state)) ? 'reachable' : 'unknown'
      })).filter((n: any) => n.ip);
      const merged = [...neighbourNodes, ...activeHosts];
      const dedup = new Map<string, any>();
      for (const n of merged) dedup.set(n.ip, { ...dedup.get(n.ip), ...n });
      ok(res, {
        scannedAt: new Date().toISOString(),
        interfaces, routes, neighbours,
        listeners: ss.listeners,
        connections,
        nodes: [...dedup.values()],
        scan: { cidr: requestedCidr || null, activeScan: Boolean(requestedCidr), hostCount: activeHosts.length }
      });
    } catch (e: any) {
      fail(res, 400, e.message);
    }
  });

  app.post('/api/real/node/probe', auth, async (req, res) => {
    const host = String(req.body?.host ?? '').trim();
    const sshPort = Number(req.body?.sshPort ?? 22);
    const ports = Array.isArray(req.body?.ports) ? req.body.ports.map(Number).filter((p: number) => p > 0 && p < 65536) : [22,80,443,8000,8089,9997,8088];
    if (!host || !Number.isInteger(sshPort)) return fail(res, 400, 'host and sshPort are required');
    const probes: Record<string, any> = {};
    for (const p of ports.slice(0, 32)) probes[String(p)] = await tcpProbe(host, p);
    let sshInventory = null;
    if (req.body?.sshUser) {
      sshInventory = await remoteExec(host, String(req.body.sshUser), sshPort,
        'set -e\nprintf "__OS__\\n"; cat /etc/os-release\nprintf "__CPU__\\n"; nproc\nprintf "__MEM_KB__\\n"; awk "/MemTotal/{print $2}" /proc/meminfo\nprintf "__DISK__\\n"; df -Pk / /opt 2>/dev/null || true\nprintf "__SELINUX__\\n"; getenforce 2>/dev/null || true\n');
    }
    ok(res, { host, sshPort, probes, sshInventory, checkedAt: new Date().toISOString() });
  });

  app.post('/api/real/hardening/plan', auth, (_req, res) => {
    try { ok(res, healthFindings()); } catch (e: any) { fail(res, 500, e.message); }
  });

  app.post('/api/real/hardening/apply', auth, async (req, res) => {
    if (!isRoot()) return fail(res, 403, 'Hardening apply requires root privileges.');
    const selected = new Set<string>(Array.isArray(req.body?.controls) ? req.body.controls.map(String) : []);
    const allowed = new Set<string>(['limits','sysctl','firewall-3000','chrony']);
    const unknown = [...selected].filter(x => !allowed.has(x));
    if (unknown.length) return fail(res, 400, 'Unsupported hardening control requested.', unknown);
    const backupRoot = '/var/backups/splunk-orchestrator/' + Date.now();
    fs.mkdirSync(backupRoot, { recursive: true });
    const logs: string[] = [];
    try {
      if (selected.has('limits')) {
        const f='/etc/security/limits.d/99-splunk-orchestrator.conf';
        if (fs.existsSync(f)) backupFile(f,backupRoot);
        fs.mkdirSync(path.dirname(f),{recursive:true});
        fs.writeFileSync(f,'splunk soft nofile 65535\nsplunk hard nofile 65535\nsplunk soft nproc 8192\nsplunk hard nproc 8192\n');
        logs.push('Wrote '+f);
      }
      if (selected.has('sysctl')) {
        const f='/etc/sysctl.d/99-splunk-orchestrator.conf';
        if (fs.existsSync(f)) backupFile(f,backupRoot);
        fs.writeFileSync(f,'vm.swappiness=1\nvm.max_map_count=262144\nnet.ipv4.tcp_syncookies=1\nfs.file-max=2097152\n');
        const r=await command('sysctl',['--system'],{timeoutMs:20000});
        logs.push(r.stdout+r.stderr);
        if(r.code!==0) throw new Error('sysctl --system failed');
      }
      if (selected.has('firewall-3000')) {
        const r=await command('firewall-cmd',['--permanent','--add-port=3000/tcp'],{timeoutMs:8000});
        logs.push(r.stdout+r.stderr);
        if(r.code!==0) throw new Error('firewall-cmd add-port failed');
        const rr=await command('firewall-cmd',['--reload'],{timeoutMs:8000});
        logs.push(rr.stdout+rr.stderr);
        if(rr.code!==0) throw new Error('firewall-cmd reload failed');
      }
      if (selected.has('chrony')) {
        const r=await command('systemctl',['enable','--now','chronyd'],{timeoutMs:12000});
        logs.push(r.stdout+r.stderr);
        if(r.code!==0) throw new Error('chronyd failed to start');
      }
      ok(res,{controls:[...selected],backupRoot,logs,verified:healthFindings()});
    } catch(e:any){ fail(res,500,e.message,{backupRoot,logs}); }
  });

  app.get('/api/real/splunk/preflight', auth, async (_req,res) => {
    const home=findSplunkHome();
    let version='',status='';
    if(home){
      const v=await command(path.join(home,'bin','splunk'),['version'],{timeoutMs:10000});
      const s=await command(path.join(home,'bin','splunk'),['status'],{timeoutMs:10000});
      version=(v.stdout||v.stderr).trim();
      status=(s.stdout||s.stderr).trim();
    }
    const ports=await Promise.all([8000,8088,8089,9997].map(async p=>({port:p,...await tcpProbe('127.0.0.1',p)})));
    ok(res,{detected:Boolean(home),splunkHome:home,version,status,ports,artifacts:artifactSearch(/splunk.*\.(rpm|tgz|tar\.gz)$/i)});
  });

  app.post('/api/real/splunk/reset-password', auth, async (req,res) => {
    if(!isRoot()) return fail(res,403,'Password reset requires root.');
    const home=findSplunkHome();
    if(!home) return fail(res,404,'Splunk binary not found.');
    const currentPassword=String(req.body?.currentPassword||'');
    const newPassword=String(req.body?.newPassword||'');
    if(currentPassword.length<1 || newPassword.length<12) return fail(res,400,'Current password is required and new password must be at least 12 characters.');
    const splunk=path.join(home,'bin','splunk');
    const authArg=`admin:${currentPassword}`;
    const r=await command(splunk,['edit','user','admin','-password',newPassword,'-auth',authArg],{timeoutMs:30000,cwd:home});
    const success=r.code===0;
    res.status(success?200:500).json({
      success,
      exitCode:r.code,
      message:success?'Admin password changed successfully.':'Splunk rejected the password change.',
      stdout:r.stdout,
      stderr:r.stderr
    });
  });

  app.post('/api/real/splunk/troubleshoot', auth, async (_req,res) => {
    const home=findSplunkHome();
    if(!home) return fail(res,404,'Splunk binary not found.');
    const logs:string[]=[];
    const status=await command(path.join(home,'bin','splunk'),['status'],{timeoutMs:15000,cwd:home});
    logs.push('[SPLUNK STATUS]',status.stdout||status.stderr||'');
    const btool=await command(path.join(home,'bin','splunk'),['btool','check'],{timeoutMs:30000,cwd:home});
    logs.push('[BTOOL]',btool.stdout||btool.stderr||'');
    const listeners=await command('ss',['-lntup'],{timeoutMs:10000});
    logs.push('[SOCKETS]',listeners.stdout||listeners.stderr||'');
    const webLog=path.join(home,'var','log','splunk','web_service.log');
    const daemonLog=path.join(home,'var','log','splunk','splunkd.log');
    for(const file of [webLog,daemonLog]){
      if(fs.existsSync(file)){
        const tail=await command('tail',['-n','80',file],{timeoutMs:10000});
        logs.push(`[TAIL ${file}]`,tail.stdout||tail.stderr||'');
      }
    }
    const healthy=status.code===0 && /splunkd is running|splunkweb is running/i.test((status.stdout||status.stderr||'').toString()) && btool.code===0;
    res.status(healthy?200:500).json({success:healthy,healthy,logs,checkedAt:new Date().toISOString()});
  });

  app.get('/api/real/splunk/status', auth, async (req,res) => {
    const requested=String(req.query?.targetDir||'').trim();
    const candidate=requested && path.isAbsolute(requested) ? requested : null;
    const home=(candidate && fs.existsSync(path.join(candidate,'bin','splunk')))?candidate:findSplunkHome();
    if(!home) return ok(res,{installed:false,running:false,targetDir:candidate||null,status:'Splunk binary not found.'});
    const r=await command(path.join(home,'bin','splunk'),['status'],{timeoutMs:15000,cwd:home});
    const text=(r.stdout||r.stderr||'').toString();
    const running=r.code===0 && /splunkd is running|splunkweb is running/i.test(text);
    return ok(res,{installed:true,running,targetDir:home,status:text,exitCode:r.code});
  });

  app.get('/api/real/splunk/btool', auth, async (req,res) => {
    const requested=String(req.query?.targetDir||'').trim();
    const candidate=requested && path.isAbsolute(requested) ? requested : null;
    const home=(candidate && fs.existsSync(path.join(candidate,'bin','splunk')))?candidate:findSplunkHome();
    if(!home) return fail(res,404,'Splunk binary not found.');
    const r=await command(path.join(home,'bin','splunk'),['btool','check'],{timeoutMs:30000,cwd:home});
    const text=(r.stdout||r.stderr||'').toString();
    const errors=text.split("\n").filter((line:string)=>/error|invalid|failed/i.test(line)).map((message:string)=>({message}));
    return res.status(r.code===0?200:500).json({success:r.code===0,errors,raw:text,exitCode:r.code,targetDir:home});
  });

  app.post('/api/real/splunk/control', auth, async (req,res) => {
    const action=String(req.body?.action||'');
    if(!['start','stop','restart'].includes(action)) return fail(res,400,'action must be start, stop or restart');
    const home=findSplunkHome();
    if(!home) return fail(res,404,'Splunk binary not found on the target host.');
    const r=await command(path.join(home,'bin','splunk'),[action],{timeoutMs:30000,cwd:home});
    const verified=await command(path.join(home,'bin','splunk'),['status'],{timeoutMs:15000,cwd:home});
    const statusText=(verified.stdout||verified.stderr||'').toString();
    const running=/splunkd is running|splunkweb is running/i.test(statusText);
    const stopped=/splunkd is not running|splunkweb is not running/i.test(statusText);
    const desired=action==='stop'?stopped:running;
    const success=r.code===0 && verified.code===0 && desired;
    res.status(success?200:500).json({success,action,exitCode:r.code,stdout:r.stdout,stderr:r.stderr,verified:statusText,verification:{code:verified.code,running,stopped}});
  });

  app.post('/api/real/deploy/direct', auth, async (req,res) => {
    if(!isRoot()) return fail(res,403,'Direct deployment requires root.');
    const candidate=String(req.body?.artifact||'');
    const allowed=artifactSearch(/splunk.*\.(rpm|tgz|tar\.gz)$/i);
    const artifact=allowed.find(x=>x===candidate)||allowed[0];
    if(!artifact) return fail(res,404,'No licensed Splunk artifact is staged in the offline artifact store.');
    const logs:string[]=['Using artifact: '+artifact];
    try{
      const osr=readOsRelease();
      const isRpm=/rhel|rocky|almalinux|centos/i.test(osr.ID||'');
      const r=await command(isRpm?'dnf':'rpm',isRpm?['-y','install',artifact]:['-Uvh',artifact],{timeoutMs:180000});
      logs.push(r.stdout,r.stderr);
      if(r.code!==0) throw new Error('Local Splunk package installation failed');
      const home=findSplunkHome();
      if(!home) throw new Error('Install completed but Splunk binary was not detected');
      const boot=await command(path.join(home,'bin','splunk'),['enable','boot-start','-systemd-managed','1','-user','splunk'],{timeoutMs:30000,cwd:home});
      logs.push(boot.stdout,boot.stderr);
      const start=await command(path.join(home,'bin','splunk'),['start','--accept-license','--answer-yes','--no-prompt'],{timeoutMs:180000,cwd:home});
      logs.push(start.stdout,start.stderr);
      if(start.code!==0) throw new Error('Splunk start failed after package installation');
      ok(res,{artifact,home,logs});
    }catch(e:any){fail(res,500,e.message,logs);}
  });

  app.post('/api/real/deploy/container', auth, async (req,res) => {
    if(!isRoot()) return fail(res,403,'Container deployment requires root.');
    const runtime=String(req.body?.runtime||'podman');
    if(!['podman','docker'].includes(runtime)) return fail(res,400,'runtime must be podman or docker');
    const image=String(req.body?.image||'');
    const images=artifactSearch(/splunk.*\.(tar|tar\.gz|oci)$/i);
    if(!image || !images.includes(image)) return fail(res,404,'A local Splunk container image archive must be staged.');
    const load=await command(runtime,['load','-i',image],{timeoutMs:180000});
    if(load.code!==0) return fail(res,500,'Container image load failed',load);
    const imageRef=String(req.body?.imageRef||'').trim().replace(/[^a-zA-Z0-9._:/@-]/g,'');
    if(!imageRef) return fail(res,400,'imageRef is required for offline container deployment');
    const inspect=await command(runtime,['image','inspect',imageRef],{timeoutMs:15000});
    if(inspect.code!==0) return fail(res,404,'Loaded imageRef was not found in the local container runtime',inspect);
    await command(runtime,['rm','-f','splunk-managed'],{timeoutMs:15000});
    const password=String(req.body?.adminPassword||'');
    if(password.length<12) return fail(res,400,'Provide an admin password of at least 12 characters.');
    const run=await command(runtime,['run','-d','--name','splunk-managed','--restart=unless-stopped','-p','8000:8000','-p','8089:8089','-p','9997:9997','-p','8088:8088','-e','SPLUNK_START_ARGS=--accept-license --answer-yes --no-prompt','-e','SPLUNK_PASSWORD='+password,imageRef],{timeoutMs:60000});
    if(run.code!==0) return fail(res,500,'Container start failed',run);
    ok(res,{runtime,image,imageRef,container:'splunk-managed',runId:run.stdout.trim()});
  });

  app.post('/api/real/deploy/kubernetes', auth, async (req,res) => {
    if(!isRoot()) return fail(res,403,'Kubernetes deployment requires root.');
    const kubectl=(fs.existsSync('/usr/local/bin/kubectl')?'/usr/local/bin/kubectl':'kubectl');
    const probe=await command(kubectl,['version','--client=true','--output=json'],{timeoutMs:10000});
    if(probe.code!==0) return fail(res,503,'kubectl is not available.');
    const imageRef=String(req.body?.imageRef||'').trim().replace(/[^a-zA-Z0-9._:/@-]/g,'');
    const adminPassword=String(req.body?.adminPassword||'');
    if(!imageRef) return fail(res,400,'imageRef is required for offline Kubernetes deployment');
    if(adminPassword.length<12) return fail(res,400,'A real admin password of at least 12 characters is required');
    const namespace=String(req.body?.namespace||'splunk-managed').replace(/[^a-z0-9-]/g,'').slice(0,40)||'splunk-managed';
    const manifest=[
      'apiVersion: v1','kind: Namespace','metadata:','  name: '+namespace,'---',
      'apiVersion: apps/v1','kind: Deployment','metadata:','  name: splunk','  namespace: '+namespace,
      'spec:','  replicas: 1','  selector:','    matchLabels: { app: splunk }','  template:',
      '    metadata:','      labels: { app: splunk }','    spec:','      containers:',
      '      - name: splunk','        image: '+imageRef,'        imagePullPolicy: IfNotPresent',
      '        env:','        - name: SPLUNK_START_ARGS','          value: "--accept-license --answer-yes --no-prompt"',
      '        - name: SPLUNK_PASSWORD','          value: "'+adminPassword.replace(/"/g,'')+'"',
      '        ports:','        - { containerPort: 8000 }','        - { containerPort: 8089 }','        - { containerPort: 9997 }','        - { containerPort: 8088 }',
      '---','apiVersion: v1','kind: Service','metadata:','  name: splunk-web','  namespace: '+namespace,
      'spec:','  type: NodePort','  selector:','    app: splunk','  ports:',
      '  - { name: web, port: 8000, targetPort: 8000, nodePort: 30080 }',
      '  - { name: mgmt, port: 8089, targetPort: 8089, nodePort: 30089 }'
    ].join('\n')+'\n';
    const workdir='/var/lib/splunk-doctor/k8s';
    fs.mkdirSync(workdir,{recursive:true});
    const file=path.join(workdir,'splunk-managed.yaml');
    fs.writeFileSync(file,manifest,{mode:0o600});
    const applied=await command(kubectl,['apply','-f',file],{timeoutMs:60000});
    try { fs.unlinkSync(file); } catch {}
    if(applied.code!==0) return fail(res,500,'Kubernetes manifest apply failed',applied);
    const rollout=await command(kubectl,['-n',namespace,'rollout','status','deployment/splunk','--timeout=180s'],{timeoutMs:190000});
    if(rollout.code!==0) return fail(res,500,'Kubernetes deployment rollout failed',{apply:applied,rollout});
    ok(res,{namespace,image:imageRef,apply:applied,rollout});
  });

  app.post('/api/real/deploy/remote-hardening', auth, async (req,res) => {
    if(!isRoot()) return fail(res,403,'Remote orchestration requires the controller to run as root.');
    const host=String(req.body?.host||'').trim();
    const user=String(req.body?.sshUser||'root');
    const sshPort=Number(req.body?.sshPort||22);
    if(!host || !Number.isInteger(sshPort) || sshPort<1 || sshPort>65535) return fail(res,400,'host and sshPort are required');
    const r=await remoteExec(host,user,sshPort,REMOTE_HARDEN_SCRIPT);
    const success=r.code===0;
    res.status(success?200:502).json({success,host,user,sshPort,result:r,verified:success});
  });

  app.post('/api/real/design', auth, (req,res) => {
    const dailyGb=Math.max(0.1,Number(req.body?.dailyGb||0));
    const retentionDays=Math.max(1,Number(req.body?.retentionDays||1));
    const users=Math.max(1,Number(req.body?.users||1));
    const concurrency=Math.max(1,Number(req.body?.searchConcurrency||1));
    const rf=Math.max(1,Number(req.body?.replicationFactor||3));
    const sf=Math.max(1,Number(req.body?.searchFactor||2));
    const ingestPerIndexer=100;
    const indexerCount=Math.max(rf,Math.ceil((dailyGb/ingestPerIndexer)*(1+concurrency/25)));
    const searchHeads=concurrency>=25?3:(concurrency>=10?2:1);
    const rawGb=dailyGb*retentionDays*1.25;
    const protectedGb=rawGb*rf;
    ok(res,{inputs:{dailyGb,retentionDays,users,concurrency,rf,sf},recommendation:{
      indexers:indexerCount,
      searchHeads,
      clusterManager:1,
      licenseManager:1,
      deploymentServer:1,
      totalProtectedStorageGb:Math.ceil(protectedGb),
      indexerIngestBudgetGbDay:indexerCount*ingestPerIndexer,
      notes:[
        'Engineering heuristic only; validate against the Splunk version, current SVA/reference hardware and measured workload.',
        'Retention capacity is a storage planning estimate and does not account for compression variance, SmartStore policy or filesystem overhead.'
      ]
    }});
  });

  app.get('/api/real/splunk/topology', auth, async (_req,res) => {
    const home=findSplunkHome();
    if(!home) return fail(res,404,'Splunk binary not found.');
    const local=path.join(home,'etc/system/local');
    const read=(name:string)=>fs.existsSync(path.join(local,name))?fs.readFileSync(path.join(local,name),'utf8'):'';
    const inputs=read('inputs.conf');
    const outputs=read('outputs.conf');
    const parseServers=(text:string)=> {
      const m=text.match(/^server\\s*=\\s*([^\\r\\n#]+)/im);
      return m?m[1].split(',').map(s=>s.trim()).filter(Boolean):[];
    };
    const listeners=[...inputs.matchAll(/\\[(splunktcp|tcp|udp):\\/\\/(\\d+)\\]/gi)].map(m=>({protocol:m[1],port:Number(m[2])}));
    ok(res,{splunkHome:home,serverName:(read('server.conf').match(/^serverName\\s*=\\s*([^\\r\\n#]+)/im)||[])[1]?.trim()||os.hostname(),inputs:listeners,outputs:parseServers(outputs),checkedAt:new Date().toISOString()});
  });

  app.post('/api/real/overseer/step', auth, async (req,res) => {
    const step=String(req.body?.step||'');
    const outputs:any={step,startedAt:new Date().toISOString(),logs:[]};
    const push=(s:string)=>outputs.logs.push('['+new Date().toISOString()+'] '+s);
    try{
      if(step==='environment'){
        outputs.system={os:readOsRelease(),interfaces:os.networkInterfaces(),primaryIp:firstNonLoopbackIPv4()};
        push('Real environment inspection completed.');
      }else if(step==='architecture'){
        outputs.preflight=await (async()=>{ const h=findSplunkHome(); return {splunkHome:h,version:h?(await command(path.join(h,'bin','splunk'),['version'])).stdout.trim():'not installed'}; })();
        push('Architecture and Splunk preflight completed.');
      }else if(step==='stanza'){
        const home=findSplunkHome(); if(!home) return fail(res,404,'Splunk is not installed on controller.');
        outputs.btool=await command(path.join(home,'bin','splunk'),['btool','check'],{timeoutMs:30000,cwd:home});
        if(outputs.btool.code!==0) return fail(res,500,'Splunk btool check failed',outputs.btool);
        push('splunk btool check completed.');
      }else if(step==='ingestion'){
        outputs.ports=await Promise.all([8000,8088,8089,9997].map(async p=>({port:p,result:await tcpProbe('127.0.0.1',p)})));
        push('Local Splunk pipeline ports probed.');
      }else if(step==='security'){
        outputs.hardening=healthFindings();
        push('Host security posture inspected.');
      }else if(step==='final'){
        const home=findSplunkHome(); if(!home) return fail(res,404,'Splunk is not installed.');
        outputs.status=await command(path.join(home,'bin','splunk'),['status'],{timeoutMs:15000,cwd:home});
        if(outputs.status.code!==0 || !/splunkd is running|splunkweb is running/i.test((outputs.status.stdout||outputs.status.stderr||'').toString())) return fail(res,500,'Final Splunk service verification failed',outputs.status);
        outputs.ports=await Promise.all([8000,8088,8089,9997].map(async p=>({port:p,result:await tcpProbe('127.0.0.1',p)})));
        push('Final Splunk service and port status verified.');
      }else return fail(res,400,'Unknown overseer step.');
      outputs.finishedAt=new Date().toISOString();
      ok(res,outputs);
    }catch(e:any){ fail(res,500,e.message,outputs); }
  });

  app.post('/api/real/validate/cluster', auth, async (req,res) => {
    const nodes=Array.isArray(req.body?.nodes)?req.body.nodes:[];
    const checks:any[]=[];
    for(const n of nodes){
      const host=String(n.ip||n.hostname||'').trim();
      if(!host) continue;
      const ports=Array.isArray(n.ports)?n.ports.map(Number).filter((p:number)=>ALLOWED_PORTS.has(p)):[8000,8089,9997];
      const result:any={host,ports:{}};
      for(const p of ports) result.ports[p]=await tcpProbe(host,p);
      result.health=Object.values(result.ports).every((x:any)=>x.open)?'PASS':'DEGRADED';
      checks.push(result);
    }
    ok(res,{checkedAt:new Date().toISOString(),checks,summary:{
      nodes:checks.length,healthy:checks.filter(x=>x.health==='PASS').length,degraded:checks.filter(x=>x.health!=='PASS').length
    }});
  });

  app.get('/api/real/artifacts', auth, (_req,res) => {
    ok(res,{
      roots:PACKAGE_ROOTS,
      splunk:artifactSearch(/splunk.*\.(rpm|tgz|tar\.gz)$/i),
      images:artifactSearch(/\.(tar|tar\.gz|oci)$/i),
      operators:artifactSearch(/(operator|k8s|kubernetes).*\.(yaml|yml)$/i),
      k3s:artifactSearch(/k3s/i).slice(0,50),
      osImages:artifactSearch(/\.(iso|img)$/i)
    });
  });
}