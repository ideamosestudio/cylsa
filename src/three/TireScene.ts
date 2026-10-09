import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const segment = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const ease = (value: number) => value * value * (3 - 2 * value);

export function initTireScene(canvas: HTMLCanvasElement, track: HTMLElement, progressBar: HTMLElement | null, reduced: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 80);
  const root = new THREE.Group();
  const product = new THREE.Group();
  root.add(product);
  scene.add(root);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  pmrem.dispose();

  const ambient = new THREE.HemisphereLight(0x9aa7bb, 0x050506, 0.6);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xf4f7ff, 95, 20, Math.PI / 5.5, 0.56, 1.25);
  key.position.set(-4.8, 5.5, 7.5);
  key.target.position.set(0.8, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);

  const redRim = new THREE.SpotLight(0xe10d20, 150, 18, Math.PI / 4, 0.7, 1.45);
  redRim.position.set(5.8, 1.2, -4.5);
  redRim.target.position.set(0.5, 0, 0);
  scene.add(redRim, redRim.target);

  const edge = new THREE.PointLight(0x9fbdff, 24, 10, 2);
  edge.position.set(1.8, -3, 4.5);
  scene.add(edge);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.42 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.28;
  floor.receiveShadow = true;
  scene.add(floor);

  const tireMaterial = new THREE.MeshPhysicalMaterial({ color: 0x111214, roughness: 0.53, metalness: 0.02, clearcoat: 0.12, clearcoatRoughness: 0.68 });
  const rimMaterial = new THREE.MeshPhysicalMaterial({ color: 0x6d737b, roughness: 0.18, metalness: 0.96, clearcoat: 0.42, clearcoatRoughness: 0.16 });

  let tire: THREE.Object3D | null = null;
  let rim: THREE.Object3D | null = null;
  let modelReady = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let visible = true;
  let frame = 0;

  const loaderElement = track.querySelector<HTMLElement>('[data-model-loader]');
  const loaderValue = track.querySelector<HTMLElement>('[data-model-progress]');
  const labelTire = track.querySelector<HTMLElement>('[data-part="tire"]');
  const labelRim = track.querySelector<HTMLElement>('[data-part="rim"]');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const modelUrl = `${base}models/cyl-wheel.glb`;

  new GLTFLoader().load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      tire = model.getObjectByName('Tire') ?? null;
      rim = model.getObjectByName('Rim') ?? null;
      if (!tire || !rim) throw new Error('The GLB does not expose Tire and Rim meshes.');

      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.material = object.name.toLowerCase().includes('rim') ? rimMaterial : tireMaterial;
      });

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(4.5 / Math.max(size.x, size.y));
      product.add(model);
      modelReady = true;
      loaderElement?.classList.add('is-ready');
      track.classList.add('model-ready');
    },
    (event) => {
      if (!event.total || !loaderValue) return;
      loaderValue.textContent = `${Math.round((event.loaded / event.total) * 100)}%`;
    },
    (error) => {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('CYL 3D model failed to load', error);
      track.dataset.modelError = detail;
      document.documentElement.classList.add('no-webgl');
      if (loaderValue) loaderValue.textContent = '3D NO DISPONIBLE';
    },
  );

  const scrollTrigger = ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reduced ? false : 0.65,
    onUpdate: (self) => {
      targetProgress = reduced ? 0.08 : self.progress;
      if (progressBar) progressBar.style.transform = `scaleX(${self.progress})`;
      track.style.setProperty('--hero-progress', self.progress.toFixed(4));
      const step = track.querySelector('#hero-step');
      if (step) step.textContent = `${String(Math.min(4, Math.floor(self.progress * 5))).padStart(2, '0')} / 04`;
    },
  });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    frame = requestAnimationFrame(render);
    if (!visible) return;
    currentProgress += (targetProgress - currentProgress) * (reduced ? 1 : 0.085);
    const p = currentProgress;
    const reveal = ease(segment(p, 0, 0.18));
    const rotation = ease(segment(p, 0.16, 0.46));
    const separate = ease(segment(p, 0.39, 0.64));
    const assemble = ease(segment(p, 0.8, 1));
    const exploded = separate * (1 - assemble);
    const mobile = window.innerWidth < 760;

    root.position.x = mobile ? 0 : 0.52 - rotation * 0.08;
    root.position.y = mobile ? -0.72 : -0.1 + exploded * 0.06;
    root.scale.setScalar((0.76 + reveal * 0.24) * (mobile ? 0.78 : 1));
    root.rotation.x += ((mobile ? -0.04 : 0.08) + pointerY * 0.045 - root.rotation.x) * 0.045;
    root.rotation.y += ((-0.48 + rotation * 0.68 + pointerX * 0.07) - root.rotation.y) * 0.045;
    product.rotation.z = -0.08 - p * Math.PI * 1.45;

    if (tire && rim) {
      tire.position.z = exploded * 0.7;
      rim.position.z = -exploded * 1.32;
      rim.rotation.z = exploded * 0.24;
    }

    camera.position.x = -0.15 + rotation * 0.35;
    camera.position.y = 0.08 + rotation * 0.12;
    camera.position.z = 8.35 - rotation * 0.48 + exploded * 0.72;
    camera.lookAt(mobile ? 0 : 0.65, mobile ? -0.45 : -0.08, 0);
    renderer.toneMappingExposure = 0.15 + reveal * 0.95 + rotation * 0.12;
    key.intensity = 25 + reveal * 82;
    redRim.intensity = 30 + reveal * 90 + rotation * 48;

    if (labelTire) labelTire.style.opacity = String(ease(segment(exploded, 0.35, 0.7)));
    if (labelRim) labelRim.style.opacity = String(ease(segment(exploded, 0.52, 0.9)));
    if (modelReady) renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; }, { rootMargin: '250px' });
  observer.observe(track);
  resize();
  render();

  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    scrollTrigger.kill();
    resizeObserver.disconnect();
    observer.disconnect();
    renderer.dispose();
    tireMaterial.dispose();
    rimMaterial.dispose();
  }, { once: true });
}
