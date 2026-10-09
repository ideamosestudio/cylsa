import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeFile } from 'node:fs/promises';

if (!globalThis.FileReader) {
  globalThis.FileReader = class {
    result = null;
    onloadend = null;
    onerror = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.({ target: this }); }).catch((error) => this.onerror?.(error));
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((value) => {
        this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;
        this.onloadend?.({ target: this });
      }).catch((error) => this.onerror?.(error));
    }
  };
}

const root = new THREE.Group();
root.name = 'CYL_Sport_Wheel';

const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber_PBR', color: 0x090b0e, roughness: 0.78, metalness: 0.02 });
const rubberDetail = new THREE.MeshStandardMaterial({ name: 'Rubber_Tread', color: 0x07090b, roughness: 0.84, metalness: 0.01 });
const blackMetal = new THREE.MeshStandardMaterial({ name: 'Gloss_Black_Alloy', color: 0x080a0e, roughness: 0.2, metalness: 0.88 });
const machined = new THREE.MeshStandardMaterial({ name: 'Machined_Edge', color: 0x7e8790, roughness: 0.22, metalness: 0.98 });
const steel = new THREE.MeshStandardMaterial({ name: 'Brake_Steel', color: 0x2e343a, roughness: 0.42, metalness: 0.92 });
const dark = new THREE.MeshStandardMaterial({ name: 'Brake_Holes', color: 0x08090b, roughness: 0.58, metalness: 0.25 });
const red = new THREE.MeshStandardMaterial({ name: 'CYL_Red_Caliper', color: 0xd30d20, roughness: 0.24, metalness: 0.62 });
const redGloss = new THREE.MeshStandardMaterial({ name: 'CYL_Red_Center', color: 0xf11a2d, roughness: 0.18, metalness: 0.75 });

function latheRing(name, centerRadius, tubeRadius, halfWidth, material, segments = 96, profileSegments = 40) {
  const profile = [];
  for (let i = 0; i <= profileSegments; i++) {
    const a = (i / profileSegments) * Math.PI * 2;
    const crown = Math.cos(a);
    profile.push(new THREE.Vector2(centerRadius + tubeRadius * crown, halfWidth * Math.sin(a)));
  }
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

const tire = new THREE.Group();
tire.name = 'Tire';
tire.add(latheRing('Tire_Casing', 2.16, 0.42, 0.68, rubber, 112, 52));

const treadGeometries = [];
const treadCount = 72;
const rows = [-0.5, -0.25, 0, 0.25, 0.5];
for (let i = 0; i < treadCount; i++) {
  const angle = (i / treadCount) * Math.PI * 2;
  for (let row = 0; row < rows.length; row++) {
    const z = rows[row];
    const stagger = (row % 2 ? 0.5 : 0) * (Math.PI * 2 / treadCount);
    const a = angle + stagger;
    const width = row === 2 ? 0.145 : 0.16;
    const length = row === 2 ? 0.19 : 0.255;
    const geometry = new THREE.BoxGeometry(length, 0.055, width, 1, 1, 1);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(Math.cos(a) * 2.575, Math.sin(a) * 2.575, z);
    const rotation = new THREE.Euler(0, (row - 2) * 0.13 * (i % 2 ? 1 : -1), a - Math.PI / 2 + (row - 2) * 0.07);
    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(1, 1, 1));
    geometry.applyMatrix4(matrix);
    treadGeometries.push(geometry);
  }
}
const tread = new THREE.Mesh(mergeGeometries(treadGeometries, false), rubberDetail);
tread.name = 'Directional_Tread';
tire.add(tread);

for (const side of [-1, 1]) {
  const sideRing = latheRing(`Sidewall_Rib_${side}`, 2.22, 0.025, 0.025, rubberDetail, 96, 14);
  sideRing.position.z = side * 0.705;
  tire.add(sideRing);
}
root.add(tire);

const rim = new THREE.Group();
rim.name = 'Rim';
rim.add(latheRing('Rim_Barrel', 1.52, 0.18, 0.53, blackMetal, 96, 30));
for (const side of [-1, 1]) {
  const lip = latheRing(`Machined_Lip_${side}`, 1.69, 0.065, 0.055, machined, 96, 20);
  lip.position.z = side * 0.46;
  rim.add(lip);
}

const spokeShape = new THREE.Shape();
spokeShape.moveTo(-0.045, 0.36);
spokeShape.bezierCurveTo(-0.055, 0.72, -0.11, 1.18, -0.105, 1.49);
spokeShape.lineTo(0.015, 1.64);
spokeShape.lineTo(0.105, 1.49);
spokeShape.bezierCurveTo(0.11, 1.16, 0.05, 0.72, 0.045, 0.36);
spokeShape.closePath();
const spokeGeometry = new THREE.ExtrudeGeometry(spokeShape, { depth: 0.17, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.014, bevelThickness: 0.018, curveSegments: 10 });
spokeGeometry.translate(0, 0, 0.34);
for (let group = 0; group < 5; group++) {
  for (let branch = 0; branch < 2; branch++) {
    const spoke = new THREE.Mesh(spokeGeometry, [blackMetal, machined]);
    const index = group * 2 + branch + 1;
    spoke.name = `Spoke_${String(index).padStart(2, '0')}`;
    spoke.rotation.z = (group / 5) * Math.PI * 2 + (branch === 0 ? -0.13 : 0.13);
    rim.add(spoke);
  }
}

const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.25, 64, 1, false), blackMetal);
hub.name = 'Hub';
hub.rotation.x = Math.PI / 2;
hub.position.z = 0.38;
rim.add(hub);

for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2;
  const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 20), dark);
  lug.name = `Lug_${i + 1}`;
  lug.rotation.x = Math.PI / 2;
  lug.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.56);
  rim.add(lug);
}
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 48), blackMetal);
cap.name = 'CYL_Center_Cap';
cap.rotation.x = Math.PI / 2;
cap.position.z = 0.58;
rim.add(cap);
const capAccent = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.115, 40), redGloss);
capAccent.name = 'CYL_Center_Accent';
capAccent.rotation.x = Math.PI / 2;
capAccent.position.z = 0.6;
rim.add(capAccent);
root.add(rim);

const brake = new THREE.Group();
brake.name = 'Brake';
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.11, 96), steel);
disc.name = 'Brake_Disc';
disc.rotation.x = Math.PI / 2;
disc.position.z = 0.11;
brake.add(disc);
const discHub = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 64), dark);
discHub.rotation.x = Math.PI / 2;
discHub.position.z = 0.18;
brake.add(discHub);
for (let i = 0; i < 28; i++) {
  const a = (i / 28) * Math.PI * 2;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), dark);
  hole.rotation.x = Math.PI / 2;
  hole.position.set(Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0.18);
  brake.add(hole);
}

const caliper = new THREE.Group();
caliper.name = 'Caliper';
const caliperShape = new THREE.Shape();
caliperShape.moveTo(-0.28, -0.56);
caliperShape.bezierCurveTo(-0.4, -0.28, -0.35, 0.28, -0.19, 0.55);
caliperShape.lineTo(0.13, 0.47);
caliperShape.bezierCurveTo(0.27, 0.25, 0.29, -0.24, 0.16, -0.5);
caliperShape.closePath();
const caliperGeometry = new THREE.ExtrudeGeometry(caliperShape, { depth: 0.32, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.055, bevelThickness: 0.045, curveSegments: 12 });
const caliperMain = new THREE.Mesh(caliperGeometry, [redGloss, red]);
caliperMain.position.set(-1.02, 0.02, 0.09);
caliperMain.rotation.z = -0.11;
caliper.add(caliperMain);
brake.add(caliper);
root.add(brake);

root.traverse((object) => {
  if (object.isMesh) {
    object.castShadow = true;
    object.receiveShadow = true;
    object.geometry.computeVertexNormals();
  }
});

const exporter = new GLTFExporter();
const result = await exporter.parseAsync(root, { binary: true, trs: false, onlyVisible: true, maxTextureSize: 1024 });
await writeFile(new URL('../public/models/cyl-sport-wheel.glb', import.meta.url), Buffer.from(result));
console.log(`Wrote public/models/cyl-sport-wheel.glb (${result.byteLength} bytes)`);
