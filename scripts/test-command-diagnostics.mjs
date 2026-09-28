import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {command} from './build-worker/runtime.mjs';
const dir=await mkdtemp(path.join(os.tmpdir(),'wf-command-test-'));
try{
 await writeFile(path.join(dir,'package.json'),JSON.stringify({scripts:{build:'node -e "console.error(\'Type error: secret-customer-value\');process.exit(7)"'}}));
 await assert.rejects(()=>command('npm',['run','build'],dir),e=>{assert.deepEqual(e.commandFailure,{stage:'building',category:'build',exitCode:7,summary:'typescript_error'});assert(!JSON.stringify(e).includes('secret-customer-value'));return true;});
 await writeFile(path.join(dir,'package.json'),JSON.stringify({scripts:{build:'node -e "setTimeout(()=>{},10000)"'}}));
 await assert.rejects(()=>command('npm',['run','build'],dir,{},1),e=>e.commandFailure?.summary==='timeout'&&e.code==='COMMAND_TIMEOUT');
 console.log('PASS: command category, exit code, timeout and safe error classification; no raw stderr retained.');
}finally{await rm(dir,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
