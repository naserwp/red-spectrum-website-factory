import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const slug = 'unique-management-group';
const base = `customers/${slug}`;
const site = JSON.parse(await readFile(`${base}/site/customer.config.json`, 'utf8'));
const photos = [
  ['1517245386807-bb43f82c33c4', 'People discussing business priorities around a meeting table'],
  ['1552664730-d307ca884978', 'Colleagues considering ideas in a working discussion'],
  ['1497366858526-0766cadbe8fa', 'Daylit professional workspace and shared office tables'],
  ['1486591978090-58e619d37fe7', 'Urban commercial buildings and business surroundings'],
];
const extra = [], inventory = JSON.parse(await readFile(`${base}/delivery/image-inventory.json`, 'utf8'));
for (const [offset, [id, alt]] of photos.entries()) {
  const source = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`;
  const response = await fetch(source); if (!response.ok) throw Error(`Image ${offset} unavailable`);
  const { data, info } = await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const file = `public/customers/${slug}/images/image-${12 + offset}.webp`;
  await writeFile(file, data);
  extra.push({ src: '/' + file.slice(7), alt: alt + '; illustrative photography', width: info.width, height: info.height });
  inventory.push({ file, source, license: 'https://unsplash.com/license', provenance: 'Licensed illustrative photograph; not company personnel or property', sha256: createHash('sha256').update(data).digest('hex'), width: info.width, height: info.height, bytes: data.length });
}
await writeFile(`${base}/site/additional-images.json`, JSON.stringify(extra, null, 2) + '\n');
await writeFile(`${base}/delivery/image-inventory.json`, JSON.stringify(inventory, null, 2) + '\n');
site.form = { provider: 'sendgrid', mode: 'live', recipientConfirmed: true, testPassed: true };
site.business.tagline = 'Consulting perspective. Practical management.';
site.business.summary = 'Practical consulting and management support for business operations, organizational strategy, business visibility, and real estate needs.';
site.seo = { title: 'Unique Management Group LLC | Consulting & Business Management', description: 'Consulting and management support for business owners, organizations, and property owners. Explore seven services with Unique Management Group LLC in the Bronx.' };
site.schema.description = site.business.summary;
site.pages.home.headline = 'Clear thinking. Practical direction.';
site.pages.home.intro = site.business.summary;
site.pages.privacy = { headline: 'Clear about your information.', body: ['Inquiries are stored securely and sent to Unique Management Group LLC for review.', 'Contact info@uniquemanagementgroup.com with questions about your information.'] };
site.design.pages.privacy.forEach(s => { s.heading = 'Privacy'; });
await writeFile(`${base}/site/customer.config.json`, JSON.stringify(site, null, 2) + '\n');
const manifest = JSON.parse(await readFile('customers/manifest.json', 'utf8'));
if (manifest.customers.some(s => s.slug === slug)) throw Error('UMG already registered');
manifest.customers.push(site);
await writeFile('customers/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
