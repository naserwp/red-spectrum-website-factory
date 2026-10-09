import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {command} from './build-worker/runtime.mjs';
const dir=await mkdtemp(path.join(os.tmpdir(),'webfactory-npm-path-'));
await writeFile(path.join(dir,'package.json'),JSON.stringify({name:'synthetic-npm-path',version:'1.0.0',private:true,scripts:{outer:'npm run inner',inner:'node -e "console.log(\'nested npm works\')"'}}));
assert.match(await command('npm',['run','outer'],dir),/nested npm works/);
console.log('PASS: nested npm and Node resolve inside the actual sanitized worker environment; no installation or external calls. Fixture retained.');
