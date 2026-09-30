import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const baseline = JSON.parse(execFileSync('git', ['show', '1594e3b:customers/manifest.json'], { encoding: 'utf8' }));
const current = JSON.parse(readFileSync('customers/manifest.json', 'utf8'));
assert.deepEqual(current.customers.filter(s => s.slug !== 'unique-management-group'), baseline.customers);
const logo = readFileSync('public/customers/unique-management-group/logo.svg');
const originalLogo = execFileSync('git', ['show', '9aa79bff7896f8f360d04b20cc1d3539ca211cac:public/customers/unique-management-group/logo.svg']);
assert.equal(createHash('sha256').update(logo).digest('hex'), createHash('sha256').update(originalLogo).digest('hex'));
const changed = execFileSync('git', ['diff', '--name-only', '1594e3b'], { encoding: 'utf8' }).trim().split('\n');
for (const file of changed) {
  if (/^(?:public\/customers|customers)\//.test(file)) assert.ok(file === 'customers/manifest.json' || file.includes('/unique-management-group/'), file);
  assert.ok(!/unique-home|lc-website|vitality|swenzy/.test(file), file);
}
console.log('PASS: every existing customer configuration unchanged; official UMG logo byte-identical; no other customer files modified.');
