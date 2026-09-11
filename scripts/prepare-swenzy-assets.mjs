import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
const base = 'public/customers/swenzy-logistics';
await mkdir(`${base}/images`, {recursive:true});
await mkdir(`${base}/brand`, {recursive:true});
const source = (process.argv[2] || 'customers/swenzy-logistics/brand/originals').replaceAll('\\', '/') + '/';
for (const [name,file,width] of [
 ['highway-dawn','exec-796d2f4d-67be-49af-b87b-db119fffda38.png',1920],
 ['route-planning','exec-ac0e17f8-d2d0-4e9f-af80-3c4ca657c49b.png',1200],
 ['open-road','exec-d3b14654-2b71-43d1-be29-57194b9f495a.png',1600],
 ['miles-avatar','exec-f16a7169-28e2-495f-ba71-24eb4549ffd9.png',640],
]) {
 await sharp(source+file).resize({width,withoutEnlargement:true}).webp({quality:85}).toFile(`${base}/images/${name}.webp`);
}
await mkdir('customers/swenzy-logistics/myndy/assets',{recursive:true});
await copyFile(source+'exec-f16a7169-28e2-495f-ba71-24eb4549ffd9.png','customers/swenzy-logistics/myndy/assets/miles-original.png');
for (const variant of ['light','dark']) await sharp(`${base}/brand/logo-${variant}.svg`).resize(1620).png().toFile(`${base}/brand/logo-${variant}.png`);
for (const size of [32,180,512]) await sharp(`${base}/brand/favicon.svg`).resize(size).png().toFile(`${base}/brand/icon-${size}.png`);
