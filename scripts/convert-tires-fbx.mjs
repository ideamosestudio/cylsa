import fs from 'node:fs/promises';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class StubImage {
  addEventListener(type, callback) {
    if (type === 'load') this.onload = callback;
    if (type === 'error') this.onerror = callback;
  }
  removeEventListener() {}
  set src(value) {
    this._src = value;
    queueMicrotask(() => this.onload?.({ type: 'load', target: this }));
  }
  get src() { return this._src; }
}

class NodeFileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.({ target: this });
  }
  async readAsDataURL(blob) {
    const data = Buffer.from(await blob.arrayBuffer()).toString('base64');
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${data}`;
    this.onloadend?.({ target: this });
  }
}

globalThis.document = { createElementNS: () => new StubImage() };
globalThis.FileReader = NodeFileReader;

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error('Usage: node scripts/convert-tires-fbx.mjs <source.fbx> <destination.glb>');
}

const sourceData = await fs.readFile(source);
const arrayBuffer = sourceData.buffer.slice(sourceData.byteOffset, sourceData.byteOffset + sourceData.byteLength);
const model = new FBXLoader().parse(arrayBuffer, '');

const sourceMaterials = new Set();
const exportMaterials = {
  tire: new THREE.MeshStandardMaterial({ name: 'CYL_RUBBER_SOURCE', color: 0x08090a, roughness: 0.72, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ name: 'CYL_METAL_SOURCE', color: 0x252a31, roughness: 0.22, metalness: 0.92 }),
  rotor: new THREE.MeshStandardMaterial({ name: 'CYL_ROTOR_SOURCE', color: 0x34373b, roughness: 0.36, metalness: 0.84 }),
  caliper: new THREE.MeshStandardMaterial({ name: 'CYL_CALIPER_SOURCE', color: 0x8f0715, roughness: 0.28, metalness: 0.62 }),
  emblem: new THREE.MeshStandardMaterial({ name: 'CYL_EMBLEM_SOURCE', color: 0xb5bac1, roughness: 0.18, metalness: 0.96 }),
};

let meshes = 0;
let vertices = 0;
model.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return;
  meshes += 1;
  vertices += object.geometry.attributes.position?.count ?? 0;
  const originals = Array.isArray(object.material) ? object.material : [object.material];
  originals.filter(Boolean).forEach((material) => sourceMaterials.add(material));
  const identity = `${object.name} ${originals.map((material) => material?.name ?? '').join(' ')}`;
  if (/tires?|rubber/i.test(identity) && !/rim/i.test(identity)) object.material = exportMaterials.tire;
  else if (/caliper/i.test(identity)) object.material = exportMaterials.caliper;
  else if (/brake|rotor/i.test(identity)) object.material = exportMaterials.rotor;
  else if (/logo|emblem/i.test(identity)) object.material = exportMaterials.emblem;
  else object.material = exportMaterials.metal;
  object.castShadow = false;
  object.receiveShadow = false;
});

sourceMaterials.forEach((material) => material.dispose());
const result = await new GLTFExporter().parseAsync(model, {
  binary: true,
  onlyVisible: true,
  includeCustomExtensions: false,
});
await fs.mkdir(new URL('.', `file:///${destination.replaceAll('\\', '/')}`).pathname, { recursive: true }).catch(() => {});
await fs.writeFile(destination, Buffer.from(result));
console.log(JSON.stringify({ source, destination, meshes, vertices, bytes: Buffer.byteLength(result) }, null, 2));
