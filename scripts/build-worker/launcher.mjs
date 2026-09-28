import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
const bundled=path.join(process.env.USERPROFILE||'','.cache','codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe');
const node=Number(process.versions.node.split('.')[0])>=24?process.execPath:bundled;
if(!existsSync(node)){console.error('Install Node.js 24 before starting the worker.');process.exit(1);}
const mode=process.argv[2],target=mode==='test'?'scripts/test-windows-worker.mjs':mode==='setup'?'scripts/build-worker/setup.mjs':'scripts/build-worker/run.mjs';
const child=spawn(node,[...(mode==='run'?['--env-file=.env.worker.local']:[]),target,...process.argv.slice(3)],{stdio:'inherit',windowsHide:true,env:{...process.env,PATH:path.dirname(node)+path.delimiter+process.env.PATH}});
child.on('error',()=>{console.error('Worker could not start.');process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
