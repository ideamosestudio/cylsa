import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('public');
const output = path.join(root, 'optimized');
await fs.mkdir(output, { recursive: true });
await fs.mkdir('src/generated', { recursive: true });
const exists = async (file) => fs.access(file).then(() => true, () => false);
async function walk(dir) {
  const files = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    if (item.name === 'optimized' || item.name === 'models') continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...await walk(file));
    else if (/\.(png|jpe?g|webp)$/i.test(file)) files.push(file);
  }
  return files;
}
const manifest = {};
let originalBytes = 0, optimizedBytes = 0;
for (const file of await walk(root)) {
  const input = await fs.readFile(file);
  const key = path.relative(root, file).replaceAll('\\', '/');
  const meta = await sharp(input).metadata();
  const isLogo = /logos\/|brands\/|brand-ticker\/|ui\//.test(key);
  const maxWidth = Math.min(meta.width, isLogo ? 480 : 1600);
  const widths = [...new Set([...(isLogo ? [160, 320] : [320, 640, 960, 1280]).filter(w => w < maxWidth), maxWidth])];
  const hash = createHash('sha256').update(input).update('webp-v1-85').digest('hex').slice(0, 16);
  const variants = [];
  for (const width of widths) {
    const name = `${hash}-${width}.webp`;
    const dest = path.join(output, name);
    if (!await exists(dest)) await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 85, effort: 5 }).toFile(dest);
    variants.push({ width, src: `optimized/${name}` });
  }
  manifest[key] = { width: meta.width, height: meta.height, variants };
  originalBytes += input.length;
  optimizedBytes += (await fs.stat(path.join(root, variants.at(-1).src))).size;
}

// The wheel is pre-optimized by convert-tires-fbx.mjs so CI never has to
// process or publish the 56 MB intermediate export.
const modelSource = await fs.readFile('public/models/cyl-premium-wheel.glb');
const modelPath = 'models/cyl-premium-wheel.glb';
await fs.writeFile('src/generated/images.json', JSON.stringify(manifest));
await fs.writeFile('src/generated/model.json', JSON.stringify({ src: modelPath }));
console.log(JSON.stringify({ images: Object.keys(manifest).length, originalBytes, optimizedLargestVariantsBytes: optimizedBytes, modelOriginalBytes: modelSource.length, modelOptimizedBytes: modelSource.length }, null, 2));
