// Offline readiness validation is part of the mandatory authenticated smoke contract.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';

const PORT = 3100;
const base = `http://127.0.0.1:${PORT}`;
const password = process.env.SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD || crypto.randomBytes(24).toString('base64url');
const dataDir = '/tmp/pilot-splunk-doctor-data';
const splunkHome = '/tmp/pilot-no-real-splunk';
fs.rmSync(dataDir,{recursive:true,force:true});
fs.rmSync(splunkHome,{recursive:true,force:true});
fs.mkdirSync('/tmp/pilot-test-home',{recursive:true});

function req(path,{method='GET',headers={},body}={}){return new Promise((resolve,reject)=>{
 const u=new URL(path,base);
 const r=http.request(u,{method,headers:{...(body!==undefined?{'content-type':'application/json'}:{}),...headers},timeout:15000},res=>{
  let text=''; res.setEncoding('utf8'); res.on('data',d=>text+=d); res.on('end',()=>{let json=null;try{json=JSON.parse(text)}catch{};resolve({status:res.statusCode||0,text,json});});
 });
 r.on('error',reject); if(body!==undefined)r.write(JSON.stringify(body)); r.end();
});}
function assert(ok,msg){if(!ok)throw new Error(msg);}
async function waitReady(child){for(let i=0;i<50;i++){if(child.exitCode!==null||child.signalCode!==null)throw new Error(`server exited early (exitCode=${child.exitCode}, signal=${child.signalCode})`);try{const r=await req('/');if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw new Error('server did not become ready');}

const serverEntry = new URL('../dist/server.cjs', import.meta.url);
const child=spawn(process.execPath,[serverEntry.pathname],{cwd:'/tmp/pilot-test-home',env:{...process.env,NODE_ENV:'production',PORT:String(PORT),SPLUNK_DOCTOR_DATA_DIR:dataDir,SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD:password,SPLUNK_HOME:splunkHome},stdio:['ignore','pipe','pipe']});
let stdout='',stderr=''; child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d);
try{
 await waitReady(child);
 let r=await req('/api/real/system'); assert(r.status===401,'unauthenticated real API did not return 401');
 r=await req('/api/auth/login',{method:'POST',body:{username:'admin',password}}); assert(r.status===200&&r.json?.token,'bootstrap login failed: '+r.text);
 const auth={authorization:`Bearer ${r.json.token}`};

 const checks=[
  ['GET','/api/auth/me'],['GET','/api/real/system'],['POST','/api/real/network/scan',{}],
  ['POST','/api/real/node/probe',{host:'127.0.0.1',ports:[PORT]}],['POST','/api/real/hardening/plan',{}],
  ['GET','/api/real/splunk/preflight'],['GET','/api/real/artifacts'],
  ['POST','/api/real/design',{dailyGb:25,retentionDays:30,users:50,searchConcurrency:10,replicationFactor:3,searchFactor:2}],
  ['POST','/api/real/overseer/step',{step:'environment'}],['POST','/api/real/overseer/step',{step:'security'}],
  ['POST','/api/real/validate/cluster',{nodes:[{ip:'127.0.0.1',ports:[PORT]}]}],
 ];
 for(const [method,path,body] of checks){r=await req(path,{method,headers:auth,body});assert(r.status===200,`${method} ${path}: HTTP ${r.status} ${r.text.slice(0,1200)}`);assert(r.json?.success!==false,`${method} ${path}: success=false`);}
 r=await req('/api/splunk/status',{headers:auth});assert(r.status===404||r.json?.installed===false,`legacy Splunk status falsely installed: ${r.text}`);
 r=await req('/api/splunk/logs',{headers:auth});assert(r.status===404,`logs endpoint should 404 without real log: ${r.status}`);
 r=await req('/api/parallel-cluster/start',{method:'POST',headers:auth,body:{}});assert(r.status>=400,`parallel start unexpectedly succeeded: ${r.status}`);
 r=await req('/api/k8s/deploy-splunk',{method:'POST',headers:auth,body:{password}});assert(r.status>=400,`k8s deploy unexpectedly succeeded: ${r.status}`);
 r=await req('/api/tools/validate-all',{method:'POST',headers:auth,body:{}});assert(r.status===200,'validate-all failed');assert((r.json?.healthyCount||0)+(r.json?.warningCount||0)===r.json.totalTools,'validate-all counts are inconsistent');
 r=await req('/api/tools/validate-check',{method:'POST',headers:auth,body:{toolId:'architecture_auditor',checkIndex:0,checkNameEn:'Real Splunk runtime'}});
 assert(r.status===200 || r.status===409,'isolated check endpoint unexpected: '+r.status);
 assert(r.json?.executionMode==='ISOLATED_SINGLE_CHECK','isolated execution mode missing');
 assert(r.json?.executionPerformed===false || typeof r.json?.executionPerformed==='boolean','isolated execution flag missing');
 if(r.status===200) assert(r.json?.check?.nameEn==='Real Splunk runtime','wrong isolated check returned');

 r=await req('/api/tools/offline-readiness',{headers:auth});assert(r.status===200,'offline readiness endpoint failed: '+r.text);assert(r.json?.mode==='OFFLINE_READINESS','offline readiness mode missing');assert(Number(r.json?.totalTools)>=20,'offline readiness did not validate the full tool set');assert((r.json?.healthyCount||0)+(r.json?.warningCount||0)+(r.json?.errorCount||0)===r.json.totalTools,'offline readiness counts are inconsistent');assert(r.json?.localSignals?.nodeRuntime===true,'offline bundled/system Node runtime probe failed');assert(r.json?.localSignals?.appBundle===true,'offline application bundle probe failed');
 console.log('[SMOKE] PASS — real authenticated control-plane, legacy negative, and validation checks passed.');
}catch(e){console.error('[SMOKE] FAIL — '+e.message);console.error(stdout);console.error(stderr);process.exitCode=1;}finally{child.kill('SIGTERM');}
