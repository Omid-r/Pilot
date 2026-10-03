import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_VERSION = '1.0.1';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const stagingDir = path.join('/tmp', 'pilot_splunk_doctor_rhel_staging');

function die(message) { console.error('[RHEL Packager] '+message); process.exit(1); }
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(path.join(distDir,'index.html')) || !fs.existsSync(path.join(distDir,'server.cjs'))) die('dist is missing; run npm run build before packaging.');

fs.rmSync(stagingDir,{recursive:true,force:true});
fs.mkdirSync(stagingDir,{recursive:true});
fs.cpSync(distDir,path.join(stagingDir,'dist'),{recursive:true});
fs.cpSync(path.join(rootDir,'scripts'),path.join(stagingDir,'scripts'),{recursive:true});
fs.copyFileSync(path.join(rootDir,'package.json'),path.join(stagingDir,'package.json'));
fs.mkdirSync(path.join(stagingDir,'node-runtime','bin'),{recursive:true});
fs.copyFileSync(process.execPath,path.join(stagingDir,'node-runtime','bin','node'));
fs.chmodSync(path.join(stagingDir,'node-runtime','bin','node'),0o755);

// Copy the installer and operational scripts but never ship runtime-generated DB/keys.
const rootScripts=['setup.sh','reinstall-and-run.sh','uninstall.sh'];
for (const f of rootScripts) { const src=path.join(rootDir,'scripts',f); if(fs.existsSync(src)) { fs.copyFileSync(src,path.join(stagingDir,f)); fs.chmodSync(path.join(stagingDir,f),0o755); } }
for (const file of fs.readdirSync(path.join(stagingDir,'scripts'))) { const p=path.join(stagingDir,'scripts',file); const st=fs.statSync(p); if(st.isFile() && /\.(sh|py)$/.test(file)) fs.chmodSync(p,0o755); else if(st.isFile()) fs.chmodSync(p,0o644); }

fs.writeFileSync(path.join(stagingDir,'README_OFFLINE.md'),`# Splunk Cluster Doctor Offline RHEL Bundle v${PACKAGE_VERSION}

Install on an air-gapped RHEL host:
  sudo bash setup.sh

The bundle includes its own Node.js runtime.
Splunk Enterprise binaries/images and commercial licenses are operator-supplied offline artifacts.
`);

const out = path.join(rootDir,'public',`splunk_cluster_doctor_rhel_v${PACKAGE_VERSION}.tar.gz`);
fs.mkdirSync(path.dirname(out),{recursive:true});
const { execFileSync } = await import('child_process');
execFileSync('tar',['-czf',out,'-C',path.dirname(stagingDir),path.basename(stagingDir)],{stdio:'inherit'});
console.log('[RHEL Packager] Package:',out);
console.log('[RHEL Packager] Node runtime:',process.execPath);
console.log('[RHEL Packager] Done.');
