import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [source, destination, ratioValue = '.62'] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error('Usage: node scripts/optimize-advisory-glb.mjs <source.glb> <destination.glb> [ratio]');
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions([...ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization])
  .registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  });
const document = await io.read(source);
const root = document.getRoot();
const before = {
  meshes: root.listMeshes().length,
  materials: root.listMaterials().length,
  textures: root.listTextures().length,
};

await document.transform(
  prune(),
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratioValue), error: .0025 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 78, effort: 5 }),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);

await fs.mkdir(path.dirname(destination), { recursive: true });
await io.write(destination, document);
const [input, output] = await Promise.all([fs.stat(source), fs.stat(destination)]);
console.log(JSON.stringify({ source, destination, before, inputBytes: input.size, outputBytes: output.size }, null, 2));
