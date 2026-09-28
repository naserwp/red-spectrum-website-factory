import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('app/api/branded-preview/[slug]/[[...path]]/route.ts','utf8');
const rewrite=source.match(/html=html\.replace\(.*dpl=.*;/)[0];
for(const separator of ['?','&amp;','&','\\u0026']){
 const context={html:'/api/branded-preview/example/_next/image'+separator+'dpl=dpl_abc123'};
 vm.runInNewContext(rewrite,context);
 assert.equal(context.html,'/api/branded-preview/example/_next/image');
}
const assetPattern=source.match(/const asset=(\/\^_next.*?\/)\.test/)[1];
const accepts=path=>vm.runInNewContext(`${assetPattern}.test(path)`,{path});
assert(accepts('_next/static/chunks/0pqt~8bl3ukh4.js'));
assert(accepts('_next/static/chunks/0zaia6i55l01..js'));
assert(!accepts('customers/other/logo.svg'));
assert(!accepts('_next/static/secrets.json'));
const guard=source.match(/path\.some\((.*?)\)\)return/)[1];
for(const path of [['..'],['.'],['a/b'],['a\\b'],['%2e%2e']])assert(vm.runInNewContext(`path.some(${guard})`,{path}));
assert(!vm.runInNewContext(`path.some(${guard})`,{path:['_next','static','chunks','0zaia6i55l01..js']}));
console.log('PASS: deployment hints stripped, real Turbopack filenames allowed, traversal and unsafe asset guards preserved.');
