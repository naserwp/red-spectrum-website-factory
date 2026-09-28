import {readFile,writeFile,readdir,access,mkdir} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {command,assertRoot} from './runtime.mjs';
const cwd=process.cwd(),file=path.join(cwd,'.env.worker.local');
async function exists(p){try{await access(p);return true;}catch{return false;}}
if(await exists(file)){console.log('Worker environment already exists; preserved.');process.exit(0);}
const local=parseEnv(await readFile('.env.local','utf8'));
const cache=path.join(process.env.LOCALAPPDATA,'npm-cache/_npx');
async function cli(relative){for(const dir of await readdir(cache)){const p=path.join(cache,dir,'node_modules',relative);if(await exists(p))return p;}throw Error('Required local CLI unavailable');}
const browser=await cli('agent-browser/bin/agent-browser.js'),vercel=await cli('vercel/dist/index.js');
const chrome=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).map(p=>path.join(p,'Google/Chrome/Application/chrome.exe'));
const chromePath=(await Promise.all(chrome.map(exists))).findIndex(Boolean);if(chromePath<0)throw Error('Chrome unavailable');
const baseline=(await command('git',['ls-remote','origin','refs/heads/main'],cwd,{GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'})).split(/\s/)[0];
const deployment=JSON.parse(await command(process.execPath,[vercel,'api','/v13/deployments/red-spectrum-website-factory.vercel.app'],cwd));
if(deployment.readyState!=='READY'||deployment.meta?.githubCommitSha!==baseline)throw Error('Remote baseline differs from verified production; manual review required');
const root=path.join(path.dirname(cwd),'rs-webfactory-builds');assertRoot(root,cwd);await mkdir(root,{recursive:true});
const values={WEBFACTORY_BUILD_EXECUTOR:'controlled-worker-v1',WEBFACTORY_BUILD_CONTROL_URL:'https://red-spectrum-website-factory.vercel.app',WEBFACTORY_BUILD_WORKER_SECRET:randomBytes(48).toString('hex'),WEBFACTORY_BUILD_ROOT:root,WEBFACTORY_BUILD_BASE_SHA:baseline,OPENAI_API_KEY:process.env.OPENAI_API_KEY||local.OPENAI_API_KEY,AGENT_BROWSER_CLI:browser,AGENT_BROWSER_EXECUTABLE_PATH:chrome[chromePath],VERCEL_CLI:vercel};
if(!values.OPENAI_API_KEY)throw Error('OPENAI_API_KEY missing');
await writeFile(file,Object.entries(values).map(([k,v])=>`${k}='${v}'`).join('\n')+'\n',{flag:'wx',mode:0o600});
if(process.platform==='win32'){
 const account=await command('whoami',[],cwd);
 await command('icacls',[file,'/inheritance:r','/grant:r',account+':(F)','SYSTEM:(F)'],cwd);
}
console.log('Worker environment prepared. Secret generated privately. Existing Git/Vercel sessions reused. No jobs claimed.');
