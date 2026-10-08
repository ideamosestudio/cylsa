import * as THREE from 'three';

type TirePart = { object: THREE.Object3D; startZ: number; explodeZ: number; rotationFactor: number };
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

export function initTireScene(canvas: HTMLCanvasElement, track: HTMLElement, progressBar: HTMLElement | null, reduced: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0.15, 0.05, 7.2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const tire = new THREE.Group();
  tire.rotation.set(0.08, -0.28, -0.1);
  scene.add(tire);

  const rubber = new THREE.MeshPhysicalMaterial({ color: 0x111214, roughness: 0.58, metalness: 0.08, clearcoat: 0.24, clearcoatRoughness: 0.7 });
  const darkRubber = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.72, metalness: 0.03 });
  const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x3c3e40, roughness: 0.35, metalness: 0.8 });
  const beadMaterial = new THREE.MeshStandardMaterial({ color: 0x8d9196, roughness: 0.28, metalness: 0.9 });
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xb50d19, roughness: 0.32, metalness: 0.45 });
  const parts: TirePart[] = [];

  const treadCore = new THREE.Mesh(new THREE.TorusGeometry(1.57, 0.47, 36, 128), rubber);
  tire.add(treadCore);
  parts.push({ object: treadCore, startZ: 0, explodeZ: 0, rotationFactor: 0.35 });

  const treadBlocks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.15, 0.72), darkRubber, 76);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let i = 0; i < 76; i++) {
    const angle = (i / 76) * Math.PI * 2;
    const stagger = i % 2 === 0 ? -0.12 : 0.12;
    const position = new THREE.Vector3(Math.cos(angle) * 2.035, Math.sin(angle) * 2.035, stagger);
    quaternion.setFromEuler(new THREE.Euler(0, i % 2 === 0 ? 0.16 : -0.16, angle + Math.PI / 2));
    scale.set(i % 3 === 0 ? 0.88 : 1, 1, 1);
    matrix.compose(position, quaternion, scale);
    treadBlocks.setMatrixAt(i, matrix);
  }
  treadBlocks.instanceMatrix.needsUpdate = true;
  tire.add(treadBlocks);
  parts.push({ object: treadBlocks, startZ: 0, explodeZ: 0, rotationFactor: 0.2 });

  const addRing = (tube: number, z: number, material: THREE.Material, explodeZ: number, rotationFactor: number) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.56, tube, 28, 112), material);
    ring.position.z = z;
    tire.add(ring);
    parts.push({ object: ring, startZ: z, explodeZ, rotationFactor });
  };
  addRing(0.405, -0.24, rubber, -1.22, -0.3);
  addRing(0.405, 0.24, rubber, 1.22, 0.3);
  addRing(0.31, -0.1, beltMaterial, -0.72, 0.6);
  addRing(0.31, 0.1, beltMaterial, 0.72, -0.6);
  addRing(0.235, -0.34, redMaterial, -1.72, 0.85);
  addRing(0.235, 0.34, redMaterial, 1.72, -0.85);
  addRing(0.12, -0.42, beadMaterial, -2.08, 1.05);
  addRing(0.12, 0.42, beadMaterial, 2.08, -1.05);
  const hub = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.08, 18, 96), beadMaterial);
  tire.add(hub);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  floor.receiveShadow = true;
  scene.add(floor);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  tire.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });

  scene.add(new THREE.HemisphereLight(0xdde7f2, 0x090909, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 4.6);
  key.position.set(-3, 5, 6);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.PointLight(0xdb1422, 34, 12, 2);
  rim.position.set(4, 1, 3);
  scene.add(rim);

  let targetProgress = 0;
  let currentProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let visible = true;

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const updateProgress = () => {
    const rect = track.getBoundingClientRect();
    const distance = Math.max(1, track.offsetHeight - window.innerHeight);
    targetProgress = clamp(-rect.top / distance);
    if (progressBar) progressBar.style.transform = `scaleX(${targetProgress})`;
    const step = document.querySelector('#hero-step');
    if (step) step.textContent = `${String(Math.min(4, Math.floor(targetProgress * 5))).padStart(2, '0')} / 04`;
  };
  const explodeAt = (progress: number) => smooth(clamp((progress - 0.38) / 0.25)) * (1 - smooth(clamp((progress - 0.8) / 0.2)));
  const render = () => {
    if (!visible) return requestAnimationFrame(render);
    currentProgress += (targetProgress - currentProgress) * (reduced ? 1 : 0.075);
    const explosion = reduced ? 0 : explodeAt(currentProgress);
    parts.forEach((part) => {
      part.object.position.z = part.startZ + part.explodeZ * explosion;
      part.object.rotation.z = currentProgress * part.rotationFactor * 0.7;
    });
    const pointerWeight = reduced ? 0 : 1;
    tire.rotation.x += ((0.12 + pointerY * 0.08 * pointerWeight) - tire.rotation.x) * 0.035;
    tire.rotation.y += ((-0.3 + currentProgress * 1.35 + pointerX * 0.12 * pointerWeight) - tire.rotation.y) * 0.035;
    tire.rotation.z = -0.1 + currentProgress * 0.5;
    tire.position.x = 0.65 + Math.sin(currentProgress * Math.PI) * 0.2;
    tire.position.y = -0.05 + explosion * 0.06;
    camera.position.x = 0.1 + currentProgress * 0.45;
    camera.position.z = 7.2 + explosion * 0.8 - currentProgress * 0.3;
    rim.intensity = 28 + currentProgress * 22;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('pointermove', (event) => { pointerX = event.clientX / window.innerWidth - 0.5; pointerY = event.clientY / window.innerHeight - 0.5; }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; }, { rootMargin: '200px' }).observe(track);
  resize();
  updateProgress();
  render();
}
