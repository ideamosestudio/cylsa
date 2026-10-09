import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
RectAreaLightUniformsLib.init();

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

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.2 : 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const ambient = new THREE.HemisphereLight(0xcbd3de, 0x08080a, 0.72);
  scene.add(ambient);

  const mainSoftbox = new THREE.RectAreaLight(0xf5f6f2, 4.8, 5.6, 4.4);
  mainSoftbox.position.set(-3.8, 4.6, 5.2);
  mainSoftbox.lookAt(0, 0, 0);
  scene.add(mainSoftbox);

  const frontFill = new THREE.RectAreaLight(0xcbd5e2, 1.8, 4.4, 4.4);
  frontFill.position.set(0.2, 0.8, 6.5);
  frontFill.lookAt(0, 0, 0);
  scene.add(frontFill);

  const whiteRim = new THREE.RectAreaLight(0xffffff, 4.2, 4.2, 5.2);
  whiteRim.position.set(4.4, 3.7, -3.6);
  whiteRim.lookAt(0, 0, 0);
  scene.add(whiteRim);

  const redAccent = new THREE.SpotLight(0xe10d20, 38, 18, Math.PI / 4.5, 0.82, 1.4);
  redAccent.position.set(5.4, 0.2, -3.6);
  redAccent.target.position.set(0.3, 0, 0);
  scene.add(redAccent, redAccent.target);

  const shadowKey = new THREE.SpotLight(0xffffff, 5, 18, Math.PI / 5, 0.7, 1.6);
  shadowKey.position.set(-3.6, 5.2, 5.4);
  shadowKey.target.position.set(0.2, -0.4, 0);
  shadowKey.castShadow = true;
  shadowKey.shadow.mapSize.set(window.innerWidth < 720 ? 512 : 1024, window.innerWidth < 720 ? 512 : 1024);
  shadowKey.shadow.bias = -0.0003;
  scene.add(shadowKey, shadowKey.target);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.46 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.26;
  floor.receiveShadow = true;
  scene.add(floor);

  let tire: THREE.Object3D | null = null;
  let rim: THREE.Object3D | null = null;
  const modelMaterials = new Set<THREE.Material>();
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
  const step = track.querySelector<HTMLElement>('#hero-step');
  const photo = track.querySelector<HTMLElement>('[data-hero-photo]');
  const dimmer = track.querySelector<HTMLElement>('[data-hero-dimmer]');
  const glowRed = track.querySelector<HTMLElement>('[data-glow="red"]');
  const glowAmber = track.querySelector<HTMLElement>('[data-glow="amber"]');
  const glowGray = track.querySelector<HTMLElement>('[data-glow="gray"]');
  const heroCopy = track.querySelector<HTMLElement>('.hero-copy');
  const claim = track.querySelector<HTMLElement>('.hero-claim');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const modelUrl = `${base}models/cyl-wheel.glb`;

  const tuneMaterial = (mesh: THREE.Mesh, isRim: boolean) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const tuned = materials.map((source) => {
      const material = source.clone();
      if (material instanceof THREE.MeshStandardMaterial) {
        if (isRim) {
          material.color.set(0x484d54);
          material.roughness = 0.38;
          material.metalness = 0.82;
          material.envMapIntensity = 0.92;
        } else {
          material.color.set(0x101114);
          material.roughness = 0.7;
          material.metalness = 0.015;
          material.envMapIntensity = 0.46;
        }
        material.needsUpdate = true;
      }
      modelMaterials.add(material);
      return material;
    });
    mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
  };

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
        tuneMaterial(object, object.name.toLowerCase().includes('rim'));
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
    onUpdate: (self) => {
      targetProgress = reduced ? 0 : self.progress;
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
    currentProgress += (targetProgress - currentProgress) * (reduced ? 1 : 0.11);
    const p = currentProgress;
    const mobile = window.innerWidth < 760;
    const lightsOut = ease(segment(p, 0.08, 0.3));
    const atmosphere = ease(segment(p, 0.28, 0.48));
    const separate = ease(segment(p, 0.45, 0.72));
    const assemble = ease(segment(p, 0.82, 1));
    const exploded = separate * (1 - assemble);
    const exit = ease(segment(p, 0.92, 1));
    const copyFade = 1 - ease(segment(p, 0.08, 0.27));

    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    if (step) step.textContent = `${String(Math.min(4, Math.floor(p * 5))).padStart(2, '0')} / 04`;

    if (photo) {
      photo.style.opacity = String(1 - lightsOut);
      photo.style.transform = `scale(${1.018 + p * 0.018}) translate3d(${p * -0.45}%, ${p * -0.18}%, 0)`;
    }
    if (dimmer) dimmer.style.opacity = String(lightsOut * 0.92);
    if (glowRed) {
      glowRed.style.opacity = String(atmosphere * (0.62 + exploded * 0.22 + assemble * 0.12) * (mobile ? 0.72 : 1));
      glowRed.style.transform = `translate3d(${exploded * -3.2}%, ${exploded * 1.8}%, 0) scale(${0.92 + atmosphere * 0.14 + exploded * 0.07})`;
    }
    if (glowAmber) {
      glowAmber.style.opacity = String(atmosphere * (1 - assemble) * 0.48 * (mobile ? 0.55 : 1));
      glowAmber.style.transform = `translate3d(${exploded * 2.2}%, ${exploded * -2.4}%, 0) scale(${0.88 + atmosphere * 0.12})`;
    }
    if (glowGray) glowGray.style.opacity = String((0.12 + atmosphere * 0.22) * (1 - exit));
    if (heroCopy) {
      heroCopy.style.opacity = String(copyFade);
      heroCopy.style.transform = mobile ? `translate3d(0, ${-22 * (1 - copyFade)}px, 0)` : `translate3d(0, calc(-48% - ${24 * (1 - copyFade)}px), 1px)`;
      heroCopy.style.pointerEvents = copyFade < 0.2 ? 'none' : 'auto';
    }
    if (claim) claim.style.opacity = String(1 - ease(segment(p, 0.88, 1)));

    root.position.x = mobile ? 0 : 0.86 - atmosphere * 0.12;
    root.position.y = (mobile ? -0.25 - atmosphere * 0.35 : -0.1) + exploded * 0.08 + exit * 0.26;
    root.scale.setScalar((0.76 + atmosphere * 0.035 - exit * 0.06) * (mobile ? 0.78 : 1));
    root.rotation.x += ((mobile ? -0.035 : 0.07) + pointerY * 0.035 + exploded * 0.035 - root.rotation.x) * 0.05;
    root.rotation.y += ((-0.36 + atmosphere * 0.48 + pointerX * 0.055 + exploded * 0.08) - root.rotation.y) * 0.05;
    product.rotation.z = -0.06 - p * Math.PI * 1.28;

    if (tire && rim) {
      tire.position.z = exploded * 0.075;
      rim.position.z = -exploded * 0.13;
      rim.rotation.z = exploded * 0.22;
    }

    camera.position.x = -0.12 + atmosphere * 0.28;
    camera.position.y = 0.08 + atmosphere * 0.1;
    camera.position.z = 8.5 - atmosphere * 0.38 + exploded * 0.74 + exit * 0.32;
    camera.lookAt(mobile ? 0 : 0.62, mobile ? -0.45 : -0.08, 0);

    renderer.toneMappingExposure = 0.86 + lightsOut * 0.07 + exploded * 0.06 - exit * 0.03;
    scene.environmentIntensity = 0.5 + lightsOut * 0.08 + exploded * 0.1;
    ambient.intensity = 0.72 + lightsOut * 0.12 + exploded * 0.13;
    mainSoftbox.intensity = 4.8 + lightsOut * 0.8 + exploded * 1.15;
    frontFill.intensity = 1.8 + lightsOut * 0.55 + exploded * 0.75;
    whiteRim.intensity = 4.2 + lightsOut * 1.1 + exploded * 1.45 + assemble * 0.8;
    redAccent.intensity = 38 + atmosphere * 18 + exploded * 20 + assemble * 15;
    shadowKey.intensity = 5 + lightsOut * 1.5;

    if (labelTire) labelTire.style.opacity = String(ease(segment(exploded, 0.32, 0.68)) * (1 - assemble));
    if (labelRim) labelRim.style.opacity = String(ease(segment(exploded, 0.5, 0.86)) * (1 - assemble));
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
    environmentTarget.dispose();
    modelMaterials.forEach((material) => material.dispose());
    renderer.dispose();
  }, { once: true });
}
