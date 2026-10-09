import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
RectAreaLightUniformsLib.init();

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const range = (v: number, start: number, end: number) => clamp((v - start) / (end - start));
const smooth = (v: number) => v * v * (3 - 2 * v);
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const stageNames = ['IGNITION', 'ROLL / 01', 'MACRO GRIP', 'FULL FORCE', 'NEXT TERRAIN'];

export function initTireScene(canvas: HTMLCanvasElement, track: HTMLElement, progressBar: HTMLElement | null, reduced: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    track.querySelector<HTMLElement>('[data-webgl-fallback]')?.removeAttribute('hidden');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 80);
  const root = new THREE.Group();
  const wheel = new THREE.Group();
  root.add(wheel);
  scene.add(root);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.92;
  pmrem.dispose();

  const ambient = new THREE.HemisphereLight(0xe4e8ef, 0x100105, 1.08);
  scene.add(ambient);
  const key = new THREE.RectAreaLight(0xffffff, 7.8, 5.8, 5.8);
  key.position.set(-4.3, 5.1, 5.6);
  key.lookAt(0, 0, 0);
  scene.add(key);
  const fill = new THREE.RectAreaLight(0xb8c5d2, 3.1, 4.5, 4.5);
  fill.position.set(0.4, 0.7, 6.4);
  fill.lookAt(0, 0, 0);
  scene.add(fill);
  const edge = new THREE.RectAreaLight(0xffffff, 6.2, 3.2, 6.5);
  edge.position.set(4.6, 3.2, -4.4);
  edge.lookAt(0, 0, 0);
  scene.add(edge);
  const red = new THREE.SpotLight(0xff132c, 82, 22, Math.PI / 3.7, 0.72, 1.2);
  red.position.set(5.8, -0.2, -3.2);
  red.target.position.set(0, 0, 0);
  scene.add(red, red.target);
  const warm = new THREE.PointLight(0xff5c29, 16, 14, 1.6);
  warm.position.set(-3.5, -2.8, 2.6);
  scene.add(warm);

  let ready = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let visible = true;
  let frame = 0;
  const materials = new Set<THREE.Material>();
  const treadCanvas = document.createElement('canvas');
  treadCanvas.width = 512;
  treadCanvas.height = 512;
  const treadContext = treadCanvas.getContext('2d');
  if (treadContext) {
    treadContext.fillStyle = '#c8c8c8';
    treadContext.fillRect(0, 0, 512, 512);
    treadContext.strokeStyle = '#222';
    treadContext.lineWidth = 13;
    treadContext.lineCap = 'round';
    for (let x = -180; x < 700; x += 62) {
      for (const bandY of [0, 424]) {
        treadContext.beginPath();
        treadContext.moveTo(x, bandY);
        treadContext.lineTo(x + 46, bandY + 42);
        treadContext.lineTo(x + 18, bandY + 84);
        treadContext.stroke();
      }
    }
  }
  const treadTexture = new THREE.CanvasTexture(treadCanvas);
  treadTexture.wrapS = treadTexture.wrapT = THREE.RepeatWrapping;
  treadTexture.repeat.set(2.2, 1);

  const copy = track.querySelector<HTMLElement>('[data-sport-copy]');
  const flare = track.querySelector<HTMLElement>('[data-sport-flare]');
  const hot = track.querySelector<HTMLElement>('[data-sport-hot]');
  const scan = track.querySelector<HTMLElement>('[data-sport-scan]');
  const orbitGraphic = track.querySelector<HTMLElement>('[data-sport-orbit]');
  const note = track.querySelector<HTMLElement>('[data-wheel-note]');
  const stepIndex = track.querySelector<HTMLElement>('[data-step-index]');
  const stepName = track.querySelector<HTMLElement>('[data-step-name]');
  const fallback = track.querySelector<HTMLElement>('[data-webgl-fallback]');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

  const requestRender = () => {
    if (!visible || frame) return;
    frame = requestAnimationFrame(render);
  };

  new GLTFLoader().load(`${base}models/cyl-sport-wheel.glb`, (gltf) => {
    const model = gltf.scene;
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const tuned = source.map((item) => {
        const material = item.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = material.name.includes('Rubber') ? 0.44 : 1.12;
          if (material.name === 'Rubber_PBR') {
            material.bumpMap = treadTexture;
            material.bumpScale = 0.085;
          }
          material.needsUpdate = true;
        }
        materials.add(material);
        return material;
      });
      object.material = Array.isArray(object.material) ? tuned : tuned[0];
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.copy(center).multiplyScalar(-1);
    model.scale.setScalar(5.15 / Math.max(size.x, size.y));
    wheel.add(model);
    ready = true;
    track.classList.add('model-ready');
    requestRender();
  }, undefined, (error) => {
    console.error('CYL sport wheel failed to load', error);
    fallback?.removeAttribute('hidden');
  });

  const apply = (p: number) => {
    const mobile = window.innerWidth < 650;
    const tablet = window.innerWidth < 960;
    const intro = smooth(range(p, 0, 0.18));
    const roll = smooth(range(p, 0.12, 0.42));
    const macro = smooth(range(p, 0.38, 0.62));
    const recover = smooth(range(p, 0.62, 0.84));
    const exit = smooth(range(p, 0.88, 1));
    const macroHold = macro * (1 - recover);
    const copyOpacity = 1 - smooth(range(p, 0.07, 0.2));

    const stage = p < 0.18 ? 0 : p < 0.42 ? 1 : p < 0.62 ? 2 : p < 0.88 ? 3 : 4;
    if (stepIndex) stepIndex.textContent = `${String(stage).padStart(2, '0')} / 04`;
    if (stepName) stepName.textContent = stageNames[stage];
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    if (copy) {
      copy.style.opacity = String(copyOpacity);
      copy.style.transform = mobile ? `translate3d(0,${(1-copyOpacity)*-22}px,0)` : `translate3d(0,calc(-48% + ${(1-copyOpacity)*-30}px),0)`;
      copy.style.pointerEvents = copyOpacity < 0.12 ? 'none' : 'auto';
    }
    if (flare) {
      flare.style.opacity = String((0.62 + roll * 0.14 + macroHold * 0.2) * (1 - exit * 0.65));
      flare.style.transform = `translate3d(${roll * -7 + recover * 4}%,${macroHold * 2}%,0) scale(${1 + macroHold * 0.16})`;
    }
    if (hot) {
      hot.style.opacity = String((0.18 + macroHold * 0.26 + recover * 0.08) * (1-exit));
      hot.style.transform = `translate3d(${macroHold * -12}%,${roll * -7}%,0) scale(${1 + macroHold * 0.24})`;
    }
    if (scan) scan.style.transform = `translate3d(${(p-.5)*48}vw,0,0)`;
    if (orbitGraphic) {
      orbitGraphic.style.opacity = String((0.52 + roll * 0.28) * (1-exit));
      orbitGraphic.style.transform = `rotate(${p * 76}deg) scale(${1 + macroHold * 0.18})`;
    }
    if (note) {
      note.style.opacity = String(smooth(range(p, 0.2, 0.35)) * (1-smooth(range(p, 0.76, 0.9))));
      note.style.transform = `translate3d(${(1-roll)*18}px,0,0)`;
    }

    const initialX = mobile ? 0 : tablet ? 0.5 : 2.75;
    const activeX = mobile ? -0.15 : tablet ? 0.15 : 0.95;
    const macroX = mobile ? 0.35 : tablet ? 1.0 : 1.75;
    const resolvedX = mobile ? 0.15 : tablet ? 0.35 : 1.2;
    let x = mix(initialX, activeX, roll);
    x = mix(x, macroX, macroHold);
    x = mix(x, resolvedX, recover);
    x += exit * (mobile ? 2.2 : 3.4);
    const initialY = mobile ? -1.8 : tablet ? -1.25 : -0.06;
    const activeY = mobile ? -0.85 : tablet ? -0.45 : 0;
    let y = mix(initialY, activeY, roll) + macroHold * (mobile ? 0.02 : 0.12) + exit * 0.15;

    let scale = (mobile ? 0.5 : tablet ? 0.59 : 0.72);
    scale *= mix(0.82, 1.0, roll);
    scale *= 1 + macroHold * (mobile ? 0.36 : 0.58);
    scale *= 1 - recover * 0.12 - exit * 0.18;
    root.position.set(x, y, 0);
    root.scale.setScalar(scale);
    root.rotation.set(
      mix(0.045, -0.08, roll) + macroHold * 0.12 + pointerY * 0.025,
      mix(-0.58, 0.28, roll) + macroHold * 0.5 - recover * 0.38 + pointerX * 0.035,
      mix(-0.03, 0.025, roll),
    );
    wheel.rotation.z = -0.04 - (roll * 0.72 + macro * 0.42 + recover * 0.3 + exit * 0.18) * Math.PI;

    const cameraOrbit = mix(-0.05, 0.15, roll) + macroHold * 0.16 - recover * 0.12;
    const distance = 10.4 - roll * 0.45 - macroHold * 0.5 + recover * 0.65 + exit * 1.1;
    camera.position.set(Math.sin(cameraOrbit) * distance, 0.1 + macroHold * 0.28, Math.cos(cameraOrbit) * distance);
    camera.lookAt(mobile ? 0 : 0.55, mobile ? -0.65 : -0.02, 0);

    renderer.toneMappingExposure = 1 + intro * 0.05 + macroHold * 0.08 - exit * 0.04;
    scene.environmentIntensity = 0.9 + roll * 0.12 + macroHold * 0.18;
    key.intensity = 7.6 + roll * 0.8 + macroHold * 1.8;
    fill.intensity = 3 + macroHold * 0.8;
    edge.intensity = 6 + roll * 1.1 + macroHold * 2.2;
    red.intensity = 76 + roll * 18 + macroHold * 32 + recover * 12;
    red.position.x = 5.8 - macroHold * 1.8;
    warm.intensity = 13 + macroHold * 14;
  };

  const render = () => {
    frame = 0;
    if (!visible) return;
    const delta = targetProgress - currentProgress;
    currentProgress += delta * (reduced ? 1 : 0.16);
    pointerX += (pointerTargetX - pointerX) * 0.09;
    pointerY += (pointerTargetY - pointerY) * 0.09;
    apply(currentProgress);
    if (ready) renderer.render(scene, camera);
    if (Math.abs(delta) > 0.00035 || Math.abs(pointerTargetX-pointerX) > 0.001 || Math.abs(pointerTargetY-pointerY) > 0.001) requestRender();
  };

  const trigger = ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { targetProgress = reduced ? 0 : self.progress; requestRender(); } });
  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.15 : 1.5));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    apply(currentProgress);
    requestRender();
  };
  const onPointer = (event: PointerEvent) => {
    pointerTargetX = event.clientX / window.innerWidth - 0.5;
    pointerTargetY = event.clientY / window.innerHeight - 0.5;
    requestRender();
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; if (visible) requestRender(); }, { rootMargin: '180px' });
  visibilityObserver.observe(track);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestRender(); });
  resize();
  apply(currentProgress);
  requestRender();

  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    trigger.kill();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    window.removeEventListener('pointermove', onPointer);
    environmentTarget.dispose();
    materials.forEach((material) => material.dispose());
    treadTexture.dispose();
    renderer.dispose();
  }, { once: true });
}
