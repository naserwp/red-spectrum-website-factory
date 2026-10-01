import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const load = file => { const testModule = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(() => ({}), testModule, testModule.exports); return testModule.exports; };
const oldBase = process.env.CUSTOMER_INTELLIGENCE_BASE_URL, oldKey = process.env.CUSTOMER_INTELLIGENCE_API_KEY;
delete process.env.CUSTOMER_INTELLIGENCE_BASE_URL;
delete process.env.CUSTOMER_INTELLIGENCE_API_KEY;
try {
  const client = load('lib/customer-intelligence/client.ts');
  const adapter = load('lib/customer-intelligence/adapter.ts');
  assert.equal(client.customerIntelligenceAvailability(), 'unconfigured');
  assert.equal(await adapter.getCustomerProfile('test'), null);
  process.env.CUSTOMER_INTELLIGENCE_BASE_URL = 'https://intelligence.example';
  assert.equal(client.customerIntelligenceAvailability(), 'unconfigured');
  process.env.CUSTOMER_INTELLIGENCE_API_KEY = 'synthetic-only';
  assert.equal(client.customerIntelligenceAvailability(), 'configured');
  assert.equal(await adapter.getCustomerProfile('test'), null);
  const checkout = readFileSync('app/checkout/page.tsx', 'utf8');
  for (const text of ['Checkout unavailable', 'Amount due', 'Pending', 'Manual review required', 'No card information is collected']) assert.ok(checkout.includes(text), text);
  assert.ok(/<button[^>]*disabled>Checkout unavailable/.test(checkout));
  assert.ok(!/stripe|card number|paymentIntent/i.test(checkout));
  console.log('PASS: intelligence fail-closed/unconfigured adapter and checkout disabled without card collection');
} finally {
  if (oldBase === undefined) delete process.env.CUSTOMER_INTELLIGENCE_BASE_URL; else process.env.CUSTOMER_INTELLIGENCE_BASE_URL = oldBase;
  if (oldKey === undefined) delete process.env.CUSTOMER_INTELLIGENCE_API_KEY; else process.env.CUSTOMER_INTELLIGENCE_API_KEY = oldKey;
}
