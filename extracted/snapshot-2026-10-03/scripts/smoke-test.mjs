import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';

const PORT=3100;
const BASE=`http://127.0.0.1:${PORT}`;
const password='Pilot-CI-Bootstrap-2026!';
const dataDir='/tmp/pilot-splunk-doctor-smoke-data';
fs.rmSync(dataDir,{recursive:true,force:true});
fs.mkdirSync(dataDir,{recursive:true});

function req(pathname,{method='GET',headers={},body}={}){
  return new Promise((resolve,reject)=>{
    const r=http.request(new URL(pathname,BASE),{method,headers:{...headers,...(body!==undefined?{'content-type':'application/json'}:{})},timeout:15000},res=>{
      let text=''; res.setEncoding('utf8'); res.on('data',d=>text+=d); res.on('end',()=>{ let json=null; try{json=JSON.parse(text);}catch{} resolve({status:res.statusCode||0,text,json}); });
    });
    r.on('timeout',()=>r.destroy(new Error('timeout'))); r.on('error',reject);
    if(body!==undefined) r.write(JSON.stringify(body)); r.end();
  });
}
function assert(v,msg){if(!v) throw new Error(msg);}
const child=spawn(process.execPath,['dist/server.cjs'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'production',PORT:String(PORT),SPLUNK_HOME:'/tmp/pilot-no-splunk',SPLUNK_DOCTOR_DATA_DIR:dataDir,SPLUNK_DOCTOR_BOOTSTRAP_PASSWORD:password},stdio:['ignore','pipe','pipe']});
let stdout='',stderr=''; child.stdout.on('data',b=>stdout+=b); child.stderr.on('data',b=>stderr+=b);

try{
  let ready=false;
  for(let i=0;i<40;i++){
    try{const r=await req('/'); if(r.status===200){ready=true;break;}}catch{}
    await new Promise(r=>setTimeout(r,250));
  }
  assert(ready,'server did not become ready');

  let r=await req('/api/real/system');
  assert(r.status===401,`unauthenticated API expected 401, got ${r.status}`);

  r=await req('/api/auth/login',{method:'POST',body:{username:'admin',password}});
  assert(r.status===200 && r.json?.success && r.json?.token,'bootstrap login failed: '+r.text);
  const auth={authorization:`Bearer ${r.json.token}`};

  const calls=[
    ['GET','/api/auth/me'],
    ['GET','/api/real/system'],
    ['POST','/api/real/network/scan',{}],
    ['POST','/api/real/hardening/plan',{}],
    ['GET','/api/real/splunk/preflight'],
    ['GET','/api/real/artifacts'],
    ['POST','/api/real/design',{dailyGb:25,retentionDays:30,users:50,searchConcurrency:10,replicationFactor:3,searchFactor:2}],
    ['POST','/api/real/validate/cluster',{nodes:[{ip:'127.0.0.1',ports:[PORT]}]}],
    ['POST','/api/tools/validate',{toolId:'health_audit'}],
    ['POST','/api/tools/validate-all',{}],
    ['GET','/api/toolbox/overview'],
    ['GET','/api/toolbox/connections'],
    ['GET','/api/toolbox/network-map']
  ];
  for(const [method,path,body] of calls){
    r=await req(path,{method,headers:auth,body});
    assert(r.status>=200&&r.status<300,`${method} ${path} failed: HTTP ${r.status} ${r.text.slice(0,800)}`);
  }

  const negatives=[
    ['POST','/api/real/deploy/direct',{}],
    ['POST','/api/real/deploy/container',{runtime:'podman',image:''}],
    ['POST','/api/real/deploy/kubernetes',{adminPassword:password}],
    ['POST','/api/real/deploy/remote-hardening',{host:'127.0.0.1',sshUser:'pilot-ci',sshPort:22}],
    ['POST','/api/splunk/control',{action:'start'}],
    ['POST','/api/k8s/deploy-splunk',{password,imageRef:'splunk/splunk:9.2.1'}]
  ];
  for(const [method,path,body] of negatives){
    r=await req(path,{method,headers:auth,body});
    assert(r.status>=400,`${method} ${path} should fail without real prerequisites; got ${r.status}`);
  }

  // Every tool validator must return a state derived from executable checks.
  const toolIds=['autonomous_agent','ai_diagnostics','bento_overview','cluster_deployer','architecture_auditor','topology','management_nodes','commercial_license','docker_k8s','health_audit','live_logs','config_editor','doc_reference','heartbeat_radar','alert_manager','network_sources','component_agents','remote_gateway','package_center','backup_archive','network_toolbox','admin_security'];
  for(const toolId of toolIds){
    r=await req('/api/tools/validate',{method:'POST',headers:auth,body:{toolId}});
    assert(r.status===200 && ['healthy','warning'].includes(r.json?.status),`validator failed for ${toolId}: ${r.status} ${r.text.slice(0,500)}`);
  }

  r=await req('/api/system/terminal/exec',{method:'POST',headers:auth,body:{command:'printf smoke-ok'}});
  assert(r.status===200 && /smoke-ok/.test(r.json?.stdout||r.text),'authenticated terminal execution failed');

  console.log('[SMOKE] PASS: real server startup, authentication, discovery, design, validators, and negative prerequisite tests completed.');
}catch(e){
  console.error('[SMOKE] FAIL:',e?.message||e);
  console.error('STDOUT:',stdout); console.error('STDERR:',stderr);
  process.exitCode=1;
}finally{
  child.kill('SIGTERM');
  await new Promise(resolve=>{const t=setTimeout(resolve,3000);child.once('exit',()=>{clearTimeout(t);resolve();});});
}
