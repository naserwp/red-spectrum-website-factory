const base = process.argv[2] ?? 'http://127.0.0.1:3321';
const paths = ['', '/services', '/about', '/contact', '/privacy'];
const forbidden = /home services|roofing|plumbing|electrical|construction|remodeling|landscaping|home repair|contractor|draft content|pending verification|placeholder|requires customer confirmation/i;
let failed = false;
for (const path of paths) {
  const response = await fetch(`${base}/unique-home-enterprise${path}`);
  const html = await response.text();
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ');
  const pass = response.status === 200 && html.includes('UNIQUE HOME ENTERPRISE LLC') && html.includes('noindex') && html.includes('logo.svg') && html.includes('favicon.svg') && !forbidden.test(visible) && !html.includes('f3cdcd07-8416-4025-8ae5-41605ed1930e') && (path !== '/contact' || html.includes('<fieldset disabled'));
  failed ||= !pass;
  console.log(`${path || '/'}: ${pass ? 'PASS' : 'FAIL'}`);
}
if (failed) process.exitCode = 1;
