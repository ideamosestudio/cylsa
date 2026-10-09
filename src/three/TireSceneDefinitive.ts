import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
RectAreaLightUniformsLib.init();

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const smooth = (value: number) => value * value * (3 - 2 * value);
const mix = (a: number, b: number, value: number) => a + (b - a) * value;

const actNames = ['Product reveal', 'The orbit', 'The explosion', 'Hero shot', 'Reassembly', 'Transition'];

export function initTireScene(canvas: HTMLCanvasElement, track: HTMLElement, progressBar: HTMLElement | null, reduced: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    track.querySelector<HTMLElement>('[data-webgl-fallback]')?.removeAttribute('hidden');
    document.documentElement.classList.add('no-webgl');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80);
  const root = new THREE.Group();
  const product = new THREE.Group();
  root.add(product);
  scene.add(root);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.15 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = window.innerWidth > 700;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.05);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.72;
  pmrem.dispose();

  const ambient = new THREE.HemisphereLight(0xdce4ed, 0x08090c, 0.92);
  scene.add(ambient);

  const mainSoftbox = new THREE.RectAreaLight(0xf7f7f3, 5.6, 6.2, 4.8);
  mainSoftbox.position.set(-3.5, 4.8, 5.6);
  mainSoftbox.lookAt(0, 0, 0);
  scene.add(mainSoftbox);

  const frontFill = new THREE.RectAreaLight(0xbcc9d6, 2.45, 4.8, 4.2);
  frontFill.position.set(0.2, 0.7, 6.8);
  frontFill.lookAt(0, 0, 0);
  scene.add(frontFill);

  const whiteRim = new THREE.RectAreaLight(0xffffff, 5.2, 3.8, 5.6);
  whiteRim.position.set(4.8, 3.5, -4.2);
  whiteRim.lookAt(0, 0, 0);
  scene.add(whiteRim);

  const redAccent = new THREE.SpotLight(0xea1225, 52, 20, Math.PI / 4.2, 0.76, 1.25);
  redAccent.position.set(5.8, 0.1, -3.9);
  redAccent.target.position.set(0, -0.15, 0);
  scene.add(redAccent, redAccent.target);

  const whiteKey = new THREE.SpotLight(0xffffff, 12, 20, Math.PI / 5, 0.72, 1.5);
  whiteKey.position.set(-4, 5.5, 5.7);
  whiteKey.target.position.set(0, -0.2, 0);
  whiteKey.castShadow = renderer.shadowMap.enabled;
  whiteKey.shadow.mapSize.set(window.innerWidth < 1000 ? 512 : 1024, window.innerWidth < 1000 ? 512 : 1024);
  whiteKey.shadow.bias = -0.00025;
  scene.add(whiteKey, whiteKey.target);

  const materials = new Set<THREE.Material>();
  const tireRig = new THREE.Group();
  const rimRig = new THREE.Group();
  product.add(tireRig, rimRig);
  let tireBase = new THREE.Vector3();
  let rimBase = new THREE.Vector3();
  let separationDistance = 1.9;
  let modelReady = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let visible = true;
  let frame = 0;

  const glowRed = track.querySelector<HTMLElement>('[data-glow-red]');
  const glowAmber = track.querySelector<HTMLElement>('[data-glow-amber]');
  const glowGray = track.querySelector<HTMLElement>('[data-glow-gray]');
  const heroCopy = track.querySelector<HTMLElement>('[data-hero-copy]');
  const heroScroll = track.querySelector<HTMLElement>('[data-hero-scroll]');
  const labelTire = track.querySelector<HTMLElement>('[data-label-tire]');
  const labelRim = track.querySelector<HTMLElement>('[data-label-rim]');
  const stepIndex = track.querySelector<HTMLElement>('[data-step-index]');
  const stepName = track.querySelector<HTMLElement>('[data-step-name]');
  const fallback = track.querySelector<HTMLElement>('[data-webgl-fallback]');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

  const tuneMaterial = (mesh: THREE.Mesh, isRim: boolean) => {
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const tuned = sourceMaterials.map((source) => {
      const material = source.clone();
      if (material instanceof THREE.MeshStandardMaterial) {
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
        if (isRim) {
          material.color.multiply(new THREE.Color(1.22, 1.24, 1.28));
          material.roughness = Math.min(material.roughness, 0.31);
          material.metalness = Math.max(material.metalness, 0.88);
          material.envMapIntensity = 1.35;
        } else {
          material.color.set(0x181a1e);
          material.roughness = 0.68;
          material.metalness = 0.02;
          material.envMapIntensity = 0.72;
        }
        material.needsUpdate = true;
      }
      materials.add(material);
      return material;
    });
    mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
  };

  const requestRender = () => {
    if (!visible || frame) return;
    frame = requestAnimationFrame(render);
  };

  new GLTFLoader().load(
    `${base}models/cyl-wheel.glb`,
    (gltf) => {
      const model = gltf.scene;
      const tire = model.getObjectByName('Tire');
      const rim = model.getObjectByName('Rim');
      if (!tire || !rim) throw new Error('El GLB no expone los objetos Tire y Rim.');

      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = renderer.shadowMap.enabled;
        object.receiveShadow = renderer.shadowMap.enabled;
        tuneMaterial(object, object === rim || object.name.toLowerCase().includes('rim'));
      });

      const rawBounds = new THREE.Box3().setFromObject(model);
      const rawSize = rawBounds.getSize(new THREE.Vector3());
      const rawCenter = rawBounds.getCenter(new THREE.Vector3());
      model.position.copy(rawCenter).multiplyScalar(-1);
      model.scale.setScalar(4.5 / Math.max(rawSize.x, rawSize.y));
      product.add(model);
      model.updateMatrixWorld(true);

      tireRig.attach(tire);
      rimRig.attach(rim);
      product.remove(model);
      product.updateMatrixWorld(true);
      tireBase = tireRig.position.clone();
      rimBase = rimRig.position.clone();

      const normalizedBounds = new THREE.Box3().setFromObject(product);
      const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());
      const diameter = Math.max(normalizedSize.x, normalizedSize.y);
      const depth = normalizedSize.z;
      separationDistance = Math.max(diameter * 0.48, depth * 2.25);
      modelReady = true;
      track.classList.add('model-ready');
      requestRender();
    },
    undefined,
    (error) => {
      console.error('CYL 3D model failed to load', error);
      track.dataset.modelError = error instanceof Error ? error.message : String(error);
      fallback?.removeAttribute('hidden');
      document.documentElement.classList.add('no-webgl');
    },
  );

  const applyScene = (p: number) => {
    const mobile = window.innerWidth < 700;
    const tablet = window.innerWidth < 901;
    const compactDesktop = window.innerWidth < 1100;
    const reveal = smooth(range(p, 0, 0.15));
    const orbit = smooth(range(p, 0.15, 0.35));
    const explode = smooth(range(p, 0.35, 0.60));
    const hero = smooth(range(p, 0.60, 0.78));
    const reassemble = smooth(range(p, 0.78, 0.93));
    const exit = smooth(range(p, 0.93, 1));
    const exploded = explode * (1 - reassemble);
    const copyOpacity = 1 - smooth(range(p, 0.055, 0.17));
    const labelOpacity = smooth(range(exploded, 0.2, 0.64)) * (1 - exit);

    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    const act = p < 0.15 ? 0 : p < 0.35 ? 1 : p < 0.60 ? 2 : p < 0.78 ? 3 : p < 0.93 ? 4 : 5;
    if (stepIndex) stepIndex.textContent = `${String(act).padStart(2, '0')} / 05`;
    if (stepName) stepName.textContent = actNames[act];

    if (heroCopy) {
      heroCopy.style.opacity = String(copyOpacity);
      const lift = (1 - copyOpacity) * -26;
      heroCopy.style.transform = mobile ? `translate3d(0,${lift}px,0)` : `translate3d(0,calc(-46% + ${lift}px),0)`;
      heroCopy.style.pointerEvents = copyOpacity < 0.12 ? 'none' : 'auto';
    }
    if (heroScroll) heroScroll.style.opacity = String(1 - smooth(range(p, 0.02, 0.12)));
    if (labelTire) { labelTire.style.opacity = String(labelOpacity); labelTire.style.transform = `translate3d(${exploded * -18}px,${(1-labelOpacity)*10}px,0)`; }
    if (labelRim) { labelRim.style.opacity = String(labelOpacity); labelRim.style.transform = `translate3d(${exploded * 18}px,${(1-labelOpacity)*10}px,0)`; }

    if (glowRed) {
      glowRed.style.opacity = String((0.44 + orbit * 0.08 + exploded * 0.2 + reassemble * 0.08) * (1 - exit * 0.7) * (mobile ? 0.8 : 1));
      glowRed.style.transform = `translate3d(${(-orbit * 7 - hero * 2 + exit * 5)}%,${exploded * 2}%,0) scale(${1 + exploded * 0.12 - exit * 0.08})`;
    }
    if (glowAmber) {
      glowAmber.style.opacity = String((0.13 + exploded * 0.16) * (1 - reassemble * 0.72) * (1 - exit));
      glowAmber.style.transform = `translate3d(${orbit * 4 + hero * 3}%,${-explode * 4}%,0) scale(${1 + exploded * 0.08})`;
    }
    if (glowGray) {
      glowGray.style.opacity = String((0.18 + exploded * 0.12) * (1 - exit));
      glowGray.style.transform = `translate3d(${hero * -2}%,${orbit * 3}%,0) scale(${1 + hero * 0.08})`;
    }

    const heroHold = hero * (1 - reassemble);
    const yaw = mix(-0.34, 0.34, orbit) + explode * 0.52 + heroHold * 0.18 - reassemble * 0.42;
    root.rotation.set(
      mix(0.045, -0.04, orbit) + heroHold * 0.11 + pointerY * 0.025,
      yaw + pointerX * 0.035,
      mix(-0.045, 0.035, orbit) - heroHold * 0.025,
    );
    product.rotation.z = -0.06 - (orbit * 0.82 + explode * 0.42 + hero * 0.14 - reassemble * 0.06) * Math.PI;

    const baseScale = mobile ? 0.50 : tablet ? 0.54 : compactDesktop ? 0.58 : 0.64;
    const scale = baseScale * (0.84 + orbit * 0.24 - exploded * 0.20 - heroHold * 0.12 - exit * 0.17) * (mobile ? 1 - exploded * 0.2 : 1);
    root.scale.setScalar(scale);
    root.position.set(
      (mobile ? -explode * 0.55 : tablet ? 0.55 - orbit * 0.25 : compactDesktop ? 2.15 - orbit * 1.15 : 3.25 - orbit * 2.25) + exit * (mobile ? 1.7 : 2.5),
      (mobile ? mix(-1.8, -1.05, orbit) : tablet ? mix(-1.5, -0.42, orbit) : -0.08) + heroHold * 0.1 + exit * 0.16,
      0,
    );

    tireRig.position.copy(tireBase);
    rimRig.position.copy(rimBase);
    tireRig.position.z += separationDistance * 0.49 * exploded;
    rimRig.position.z -= separationDistance * 0.58 * exploded;

    const orbitAngle = mix(-0.05, 0.20, orbit) + explode * 0.14 + heroHold * 0.10 - reassemble * 0.18;
    const cameraDistance = mix(10.55, 9.85, orbit) + heroHold * 0.25 + reassemble * 0.42 + exit * 1.2;
    camera.position.set(
      Math.sin(orbitAngle) * cameraDistance + (mobile ? 0 : 0.12),
      0.1 + orbit * 0.16 + heroHold * 0.32,
      Math.cos(orbitAngle) * cameraDistance,
    );
    camera.lookAt(mobile ? 0 : 0.58, mobile ? -0.72 : -0.05, 0);

    renderer.toneMappingExposure = 0.94 + reveal * 0.04 + orbit * 0.04 + exploded * 0.07 - exit * 0.05;
    scene.environmentIntensity = 0.7 + orbit * 0.12 + exploded * 0.22;
    ambient.intensity = 0.9 + reveal * 0.08 + exploded * 0.13;
    mainSoftbox.intensity = 5.4 + orbit * 0.75 + exploded * 1.15;
    frontFill.intensity = 2.35 + orbit * 0.3 + exploded * 0.65;
    whiteRim.intensity = 5 + orbit * 0.9 + exploded * 2 + reassemble * 1.1;
    redAccent.intensity = 48 + orbit * 10 + exploded * 34 + reassemble * 22;
    redAccent.position.x = 5.8 - heroHold * 1.4;
    whiteKey.intensity = 11 + exploded * 3.5;
  };

  const render = () => {
    frame = 0;
    if (!visible) return;
    const progressDelta = targetProgress - currentProgress;
    currentProgress += progressDelta * (reduced ? 1 : 0.16);
    pointerX += (pointerTargetX - pointerX) * 0.1;
    pointerY += (pointerTargetY - pointerY) * 0.1;
    applyScene(currentProgress);
    if (modelReady) renderer.render(scene, camera);
    if (Math.abs(progressDelta) > 0.00035 || Math.abs(pointerTargetX - pointerX) > 0.001 || Math.abs(pointerTargetY - pointerY) > 0.001) requestRender();
  };

  const scrollTrigger = ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { targetProgress = reduced ? 0 : self.progress; requestRender(); },
  });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 720 ? 1.15 : 1.5));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    applyScene(currentProgress);
    requestRender();
  };

  const onPointerMove = (event: PointerEvent) => {
    pointerTargetX = clamp(event.clientX / window.innerWidth, 0, 1) - 0.5;
    pointerTargetY = clamp(event.clientY / window.innerHeight, 0, 1) - 0.5;
    requestRender();
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestRender(); });
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; if (visible) requestRender(); }, { rootMargin: '200px' });
  const resizeObserver = new ResizeObserver(resize);
  visibilityObserver.observe(track);
  resizeObserver.observe(canvas);
  resize();
  applyScene(currentProgress);
  requestRender();

  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    scrollTrigger.kill();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    environmentTarget.dispose();
    materials.forEach((material) => material.dispose());
    renderer.dispose();
  }, { once: true });
}
