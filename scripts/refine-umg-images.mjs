import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const base = 'customers/unique-management-group';
const site = JSON.parse(await readFile(`${base}/site/customer.config.json`, 'utf8'));
const extra = JSON.parse(await readFile(`${base}/site/additional-images.json`, 'utf8'));
const inventory = JSON.parse(await readFile(`${base}/delivery/image-inventory.json`, 'utf8'));
for (const [index, id, alt] of [[10, '1487958449943-2429e8be8625', 'Contemporary building exterior with geometric architectural details'], [15, '1494526585095-c41746248156', 'Residential building exterior in a landscaped neighborhood']]) {
  const source = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=85`;
  const r = await fetch(source); if (!r.ok) throw Error('Image unavailable');
  const { data, info } = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: 1400, height: 1400, fit: 'inside' }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const file = `public/${base}/images/image-${index}.webp`;
  await writeFile(file, data);
  const image = { src: '/' + file.slice(7), alt: alt + '; illustrative, not a managed property', width: info.width, height: info.height };
  if (index < 12) site.images.gallery[index - 1] = image; else extra[index - 12] = image;
  const entry = { file, source, provenance: 'Licensed illustrative photograph, visually reviewed; not a client property', license: 'https://unsplash.com/license', description: alt, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, width: info.width, height: info.height };
  inventory[inventory.findIndex(item => item.file === file)] = entry;
}
await writeFile(`${base}/site/customer.config.json`, JSON.stringify(site, null, 2) + '\n');
await writeFile(`${base}/site/additional-images.json`, JSON.stringify(extra, null, 2) + '\n');
await writeFile(`${base}/delivery/image-inventory.json`, JSON.stringify(inventory, null, 2) + '\n');
// Preserve all other manifest bytes rather than reformatting unrelated tenants.
const raw = await readFile('customers/manifest.json', 'utf8');
const start = raw.lastIndexOf('    {\n      "schemaVersion": "1.0",');
if (start < 0 || !raw.slice(start).includes('"slug": "unique-management-group"')) throw Error('Tenant boundary mismatch');
await writeFile('customers/manifest.json', raw.slice(0, start) + JSON.stringify(site, null, 2).split('\n').map(line => '    ' + line).join('\n') + '\n  ]\n}\n');
