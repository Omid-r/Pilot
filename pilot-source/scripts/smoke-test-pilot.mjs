import { spawn } from 'node:child_process';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { request } from 'node:http';
import { basename, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'CI-Pilot-Real-Test-2026!';
const ROOT = resolve(new URL('..', import.meta.url).pathname);

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(PORT),
  SPLUNK_HOME: '/tmp/pilot-no-real-splunk',
  SPLUNK_DOCTOR_DATA_DIR: '/tmp/pilot-smoke-data',
  SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD: PASSWORD,
  HOME: '/tmp/pilot-smoke-home'
};

function clean(p){ try { rmSync(p, {recursive:true, force:true}); } catch {} }
clean(env.HOME);
clean(env.SPLUNK_DOCTOR_DATA_DIR);
clean(env.SPLUNK_HOME);
mkdirSync(env.HOME,{recursive:true});

function httpJson(pathname, options={}, body){
  return new Promise((resolvePromise,reject)=>{
    const u=new URL(pathname,BASE);
    const req=request({
      hostname:u.hostname,
      port:Number(u.port),
      path:u.pathname+u.search,
      method:options.method||'GET',
      headers:{
        ...(body!==undefined?{'content-type':'application/json'}:{}),
        ...(options.headers||{})
      },
      timeout:15000
    },res=>{
      let data='';
      res.setEncoding('utf8');
      res.on('data',c=>data+=c);
      res.on('end',()=>{
        let json=null;
        try{json=data?JSON.parse(data):null;}catch{}
        resolvePromise({status:res.statusCode||0,headers:res.headers,text:data,json});
      });
    });
    req.on('error',reject);
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    if(body!==undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(ok,msg){ if(!ok) throw new Error(msg); }

const child=spawn(process.execPath,['dist/server.cjs'],{
  cwd:ROOT,
  env,
  stdio:['ignore','pipe','pipe']
});
let stdout='',stderr='';
child.stdout.on('data',b=>stdout+=b.toString());
child.stderr.on('data',b=>stderr+=b.toString());

async function waitReady(){
  for(let i=0;i<60;i++){
    if(child.exitCode!==null) throw new Error('server exited: '+stderr.slice(-4000));
    try{
      const r=await httpJson('/');
      if(r.status===200) return;
    }catch{}
    await sleep(250);
  }
  throw new Error('server did not become ready');
}

try{
  await waitReady();

  let r=await httpJson('/api/system/terminal/exec',{method:'POST'},{command:'id'});
  assert(r.status===401,'Unauthenticated privileged terminal must be 401');

  r=await httpJson('/api/auth/login',{method:'POST'},{username:'admin',password:PASSWORD});
  assert(r.status===200 && r.json?.success && r.json.token,'Real login failed: '+r.text);
  const auth={authorization:`Bearer ${r.json.token}`};

  const checks=[
    ['GET','/api/auth/me',undefined],
    ['GET','/api/system/command-history',undefined],
    ['GET','/api/splunk/status',undefined],
    ['GET','/api/splunk/detect-version',undefined],
    ['GET','/api/parallel-cluster/packages',undefined],
    ['GET','/api/k8s/status',undefined],
    ['POST','/api/real/network/scan',{}],
    ['POST','/api/real/node/probe',{host:'127.0.0.1',ports:[PORT]}],
    ['POST','/api/real/hardening/plan',{}],
    ['GET','/api/real/artifacts',undefined],
    ['POST','/api/real/design',{dailyGb:10,retentionDays:30,users:25,searchConcurrency:8,replicationFactor:3,searchFactor:2}],
    ['GET','/api/real/splunk/preflight',undefined],
    ['GET','/api/real/splunk/topology',undefined],
    ['POST','/api/real/overseer/step',{step:'environment'}],
    ['POST','/api/real/overseer/step',{step:'security'}],
    ['POST','/api/real/validate/cluster',{nodes:[{ip:'127.0.0.1',ports:[PORT]}]}],
    ['POST','/api/splunk/remote/probe-cluster',{targets:[{id:'local',name:'local',host:'127.0.0.1',port:PORT}]}],
    ['POST','/api/tools/validate',{toolId:'health_audit'}],
    ['POST','/api/tools/validate-all',{}]
  ];

  for(const [method,path,body] of checks){
    r=await httpJson(path,{method,headers:auth},body);
    assert(r.status>=200 && r.status<300,`${method} ${path} failed HTTP ${r.status}: ${r.text.slice(0,1600)}`);
  }

  const toolIds=[
    'architect_overseer','autonomous_agent','ai_diagnostics','bento_overview',
    'cluster_deployer','architecture_auditor','topology','management_nodes',
    'docker_k8s','commercial_license','health_audit','live_logs','config_editor',
    'doc_reference','heartbeat_radar','alert_manager','network_sources',
    'component_agents','remote_gateway','package_center','backup_archive',
    'network_toolbox','admin_security'
  ];
  for(const toolId of toolIds){
    r=await httpJson('/api/tools/validate',{method:'POST',headers:auth},{toolId});
    assert(r.status===200,`tool ${toolId} failed HTTP ${r.status}: ${r.text}`);
    assert(r.json?.status==='healthy' || r.json?.status==='warning',`tool ${toolId} returned invalid status`);
  }

  r=await httpJson('/api/virtual-server/recreate',{method:'POST',headers:auth},{});
  assert(r.status===501,'Synthetic virtual-server recreation must remain disabled');

  const negative=[
    ['POST','/api/real/deploy/direct',{}],
    ['POST','/api/real/deploy/container',{runtime:'podman',image:'',imageRef:'splunk/splunk:9.4.0'}],
    ['POST','/api/real/deploy/kubernetes',{adminPassword:PASSWORD}],
    ['POST','/api/parallel-cluster/start',{adminPassword:PASSWORD,pass4SymmKey:'CI-Real-Pass4Symm-2026!'}],
    ['POST','/api/parallel-cluster/start-daemon',{}],
    ['POST','/api/k8s/deploy-splunk',{password:PASSWORD}],
    ['POST','/api/autonomous/execute-step',{stepId:'step-auto-healing',password:PASSWORD,pass4SymmKey:'CI-Real-Pass4Symm-2026!'}]
  ];
  for(const [method,path,body] of negative){
    r=await httpJson(path,{method,headers:auth},body);
    assert(r.status>=400,`${method} ${path} should reject missing real prerequisite, got ${r.status}`);
  }

  r=await httpJson('/api/system/terminal/exec',{method:'POST',headers:auth},{command:'printf smoke-ok'});
  assert(r.status===200 && r.json?.success && r.json?.stdout?.includes('smoke-ok'),'Authenticated terminal execution failed');

  console.log('[SMOKE] PASS — real API authentication, discovery, design, preflight, topology, cluster validation, all tool validators, privileged terminal, and negative deployment checks.');
} catch(err){
  console.error('[SMOKE] FAIL:',err?.message||err);
  console.error('[SMOKE] STDOUT:',stdout.slice(-8000));
  console.error('[SMOKE] STDERR:',stderr.slice(-8000));
  process.exitCode=1;
} finally {
  child.kill('SIGTERM');
  await sleep(1000);
}
