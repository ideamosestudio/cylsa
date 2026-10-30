import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

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

// Keep the same geometry: drop only unused UV/tangent channels and compress losslessly
// apart from the standard mesh quantization. Runtime materials never use textures.
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const modelSource = await fs.readFile('public/models/cyl-premium-wheel.glb');
const modelHash = createHash('sha256').update(modelSource).update('meshopt-v1').digest('hex').slice(0, 16);
const modelPath = `optimized/wheel-${modelHash}.glb`;
if (!await exists(path.join(root, modelPath))) {
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.read('public/models/cyl-premium-wheel.glb');
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    for (const semantic of primitive.listSemantics()) if (!['POSITION', 'NORMAL'].includes(semantic)) primitive.setAttribute(semantic, null);
  }
  await doc.transform(
    prune(),
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.16, error: 0.006 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await io.write(path.join(root, modelPath), doc);
}
await fs.writeFile('src/generated/images.json', JSON.stringify(manifest));
await fs.writeFile('src/generated/model.json', JSON.stringify({ src: modelPath }));
console.log(JSON.stringify({ images: Object.keys(manifest).length, originalBytes, optimizedLargestVariantsBytes: optimizedBytes, modelOriginalBytes: modelSource.length, modelOptimizedBytes: (await fs.stat(path.join(root, modelPath))).size }, null, 2));
