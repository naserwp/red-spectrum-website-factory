import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Regression: an initial pageshow may arrive after a visitor opens the menu
// while a slow image is loading. Only BFCache restoration may reset it.
const listeners = {};
let focused = false;
const toggle = { focus: () => { focused = true; } };
const menu = { open: true, querySelector: () => toggle, contains: () => false };
const site = { querySelector: () => menu, addEventListener: (name, callback) => { listeners[name] = callback; } };
vm.runInNewContext(readFileSync('public/customers/broom-home-enterprises-llc/motion.js', 'utf8'), {
  document: { readyState: 'complete', querySelector: () => site, addEventListener: (name, callback) => { listeners[name] = callback; } },
  window: { addEventListener: (name, callback) => { listeners[name] = callback; }, matchMedia: () => ({ matches: true }) },
});
listeners.pageshow({ persisted: false });
assert.equal(menu.open, true, 'Initial page completion must not close an open menu');
listeners.pageshow({ persisted: true });
assert.equal(menu.open, false, 'History restoration closes the restored menu');
menu.open = true;
listeners.keydown({ key: 'Escape' });
assert.equal(menu.open, false);
assert.equal(focused, true, 'Escape returns focus to the menu toggle');
menu.open = true;
listeners.click({ target: {} });
assert.equal(menu.open, false, 'Outside clicks dismiss the menu');
console.log('PASS: slow-load menu race, history restoration, Escape focus and outside dismissal, including reduced-motion mode.');
