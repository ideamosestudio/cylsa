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
const ease = (value: number) => value * value * (3 - 2 * value);
const mix = (a: number, b: number, value: number) => a + (b - a) * value;
const acts = ['PORTADA', 'CAMINOS', 'PRECISIÓN', 'TRACCIÓN', 'RESISTENCIA', 'POTENCIA', 'EXPLORAR'];

const keyMix = (progress: number, points: Array<[number, number]>) => {
  if (progress <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index += 1) {
    const [end, value] = points[index];
    const [start, previous] = points[index - 1];
    if (progress <= end) return mix(previous, value, ease(range(progress, start, end)));
  }
  return points[points.length - 1][1];
};

export function initTireScene(canvas: HTMLCanvasElement, track: HTMLElement, progressBar: HTMLElement | null, reduced: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    track.querySelector<HTMLElement>('[data-webgl-fallback]')?.removeAttribute('hidden');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.15 : 1.55));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const root = new THREE.Group();
  const wheel = new THREE.Group();
  root.add(wheel);
  scene.add(root);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.045);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.08;
  pmrem.dispose();

  const hemisphere = new THREE.HemisphereLight(0xcfd8e6, 0x120106, 1.35);
  scene.add(hemisphere);
  const key = new THREE.RectAreaLight(0xffffff, 6.2, 6.5, 4.2);
  key.position.set(-4.8, 5.5, 6.4);
  key.lookAt(0, 0, 0);
  scene.add(key);
  const front = new THREE.RectAreaLight(0xbcc7d5, 2.2, 4.8, 5.4);
  front.position.set(1.1, 0.4, 7.5);
  front.lookAt(0, 0, 0);
  scene.add(front);
  const whiteRim = new THREE.RectAreaLight(0xffffff, 5.6, 2.2, 7.4);
  whiteRim.position.set(5.8, 4.1, -4.8);
  whiteRim.lookAt(0, 0, 0);
  scene.add(whiteRim);
  const redRim = new THREE.SpotLight(0xff112b, 112, 24, Math.PI / 3.5, .74, 1.25);
  redRim.position.set(5.5, -1.2, 2.7);
  redRim.target.position.set(0, 0, 0);
  scene.add(redRim, redRim.target);
  const ember = new THREE.PointLight(0xff5b24, 22, 14, 1.5);
  ember.position.set(-3.8, -3.2, 2.5);
  scene.add(ember);

  const copy = track.querySelector<HTMLElement>('[data-sport-copy]');
  const flare = track.querySelector<HTMLElement>('[data-sport-flare]');
  const hot = track.querySelector<HTMLElement>('[data-sport-hot]');
  const scan = track.querySelector<HTMLElement>('[data-sport-scan]');
  const orbitGraphic = track.querySelector<HTMLElement>('[data-sport-orbit]');
  const note = track.querySelector<HTMLElement>('[data-wheel-note]');
  const exitPanel = track.querySelector<HTMLElement>('[data-exit-panel]');
  const storySteps = Array.from(track.querySelectorAll<HTMLElement>('[data-story-start][data-story-end]'));
  const stepIndex = track.querySelector<HTMLElement>('[data-step-index]');
  const stepName = track.querySelector<HTMLElement>('[data-step-name]');
  const fallback = track.querySelector<HTMLElement>('[data-webgl-fallback]');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const disposableMaterials = new Set<THREE.Material>();

  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let modelReady = false;
  let visible = true;
  let frame = 0;

  const requestRender = () => {
    if (!visible || frame) return;
    frame = requestAnimationFrame(render);
  };

  new GLTFLoader().load(`${base}models/cyl-premium-wheel.glb`, (gltf) => {
    const model = gltf.scene;
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const tire = /tire|rubber/i.test(`${object.name} ${object.material?.name ?? ''}`);
      const material = tire
        ? new THREE.MeshPhysicalMaterial({ color: 0x020304, roughness: .64, metalness: .01, clearcoat: .06, clearcoatRoughness: .82, envMapIntensity: .3 })
        : new THREE.MeshPhysicalMaterial({ color: 0x101318, roughness: .16, metalness: .96, clearcoat: .48, clearcoatRoughness: .16, envMapIntensity: 1.75 });
      material.name = tire ? 'CYL_RUBBER_WEB' : 'CYL_METAL_WEB';
      object.material = material;
      object.castShadow = false;
      object.receiveShadow = false;
      disposableMaterials.add(material);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.copy(center).multiplyScalar(-1);
    model.scale.setScalar(5.45 / Math.max(size.x, size.y, size.z));
    wheel.add(model);
    modelReady = true;
    track.classList.add('model-ready');
    requestRender();
  }, undefined, (error) => {
    console.error('CYL premium wheel failed to load', error);
    fallback?.removeAttribute('hidden');
  });

  const apply = (progress: number) => {
    const mobile = innerWidth < 650;
    const tablet = innerWidth < 960;
    const journey = ease(range(progress, .12, .88));
    const macro = ease(range(progress, .44, .59)) * (1 - ease(range(progress, .62, .72)));
    const exit = ease(range(progress, .94, 1));
    const copyOut = ease(range(progress, .1, .19));
    const stage = progress < .16 ? 0 : progress < .30 ? 1 : progress < .43 ? 2 : progress < .56 ? 3 : progress < .69 ? 4 : progress < .82 ? 5 : 6;

    if (stepIndex) stepIndex.textContent = `${String(stage).padStart(2, '0')} / 06`;
    if (stepName) stepName.textContent = acts[stage];
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (copy) {
      copy.style.opacity = String(1 - copyOut);
      copy.style.transform = mobile ? `translate3d(0,${-24 * copyOut}px,0)` : `translate3d(0,calc(-48% + ${-34 * copyOut}px),0)`;
      copy.style.pointerEvents = copyOut > .9 ? 'none' : 'auto';
    }
    if (exitPanel) exitPanel.style.transform = `translate3d(0,${101 - exit * 101}%,0)`;
    storySteps.forEach((element) => {
      const start = Number(element.dataset.storyStart);
      const end = Number(element.dataset.storyEnd);
      const fade = Math.min(.035, (end - start) * .28);
      const opacity = ease(range(progress, start, start + fade)) * (1 - ease(range(progress, end - fade, end)));
      const travel = mix(18, -12, ease(range(progress, start, end)));
      element.style.opacity = String(opacity);
      element.style.setProperty('--story-travel', `${travel}px`);
    });
    if (flare) {
      flare.style.opacity = String((.64 + journey * .13 + macro * .16) * (1 - exit * .7));
      flare.style.transform = `translate3d(${-7 * journey + 5 * exit + pointerX * 2.8}%,${4 * macro + pointerY * 2.2}%,0) scale(${1 + .2 * macro})`;
    }
    if (hot) {
      hot.style.opacity = String((.2 + macro * .34 + journey * .1) * (1 - exit));
      hot.style.transform = `translate3d(${-15 * macro + 7 * journey - pointerX * 3.4}%,${-8 * journey - pointerY * 2.6}%,0) scale(${1 + .28 * macro})`;
    }
    if (scan) scan.style.transform = `translate3d(${(progress - .5) * 55 + pointerX * 1.8}vw,0,0)`;
    if (orbitGraphic) {
      orbitGraphic.style.opacity = String((.5 + journey * .3) * (1 - exit));
      orbitGraphic.style.transform = `rotate(${progress * 118}deg) scale(${1 + macro * .16})`;
    }
    if (note) {
      note.style.opacity = String(ease(range(progress, .16, .26)) * (1 - ease(range(progress, .78, .88))));
      note.style.transform = `translate3d(${(1 - journey) * 22}px,0,0)`;
    }

    const xFactor = mobile ? .22 : tablet ? .5 : 1;
    const x = keyMix(progress, [[0, 2.85], [.18, 1.95], [.31, -1.5], [.44, 1.55], [.57, -1.38], [.70, 1.35], [.83, .18], [.94, 0]]) * xFactor;
    const y = keyMix(progress, [[0, -.05], [.18, -.02], [.31, .04], [.44, -.08], [.57, .03], [.70, -.06], [.83, .02], [.94, 0]]) + (mobile ? -1.25 : tablet ? -.58 : 0);
    let scale = (mobile ? .53 : tablet ? .64 : .82) * keyMix(progress, [[0, 1], [.31, .88], [.44, .98], [.57, 1.06], [.70, .92], [.83, .84], [.94, .9]]);
    scale *= 1 + exit * 1.75;

    const pointerLife = 1 - journey * .52;
    const pointerStrength = mobile ? .06 : .13;
    root.position.set(x + pointerX * pointerStrength * pointerLife, y - pointerY * pointerStrength * .45 * pointerLife, 0);
    root.scale.setScalar(scale);
    root.rotation.set(
      keyMix(progress, [[0, -.12], [.31, .08], [.44, -.04], [.57, .14], [.70, -.08], [.83, .03]]) + pointerY * (mobile ? .04 : .105) * pointerLife,
      keyMix(progress, [[0, .66], [.31, -.25], [.44, .42], [.57, -.38], [.70, .28], [.83, -.04], [.94, .12]]) + pointerX * (mobile ? .05 : .13) * pointerLife,
      keyMix(progress, [[0, -.08], [.31, .035], [.44, -.025], [.57, .04], [.70, -.035], [.83, 0]]) - pointerX * pointerY * .025,
    );
    wheel.rotation.z = -.08 - keyMix(progress, [[0, 0], [.31, .62], [.44, .92], [.57, 1.22], [.70, 1.52], [.83, 1.72], [1, 1.98]]) * Math.PI;

    const cameraAngle = keyMix(progress, [[0, -.08], [.31, .10], [.44, -.08], [.57, .13], [.70, -.10], [.83, .02]]) + macro * .08;
    const distance = 10.2 - journey * .12 - macro * .28 + exit * .55;
    camera.position.set(Math.sin(cameraAngle + pointerX * .022 * pointerLife) * distance, .08 + macro * .26 - pointerY * .04 * pointerLife, Math.cos(cameraAngle + pointerX * .022 * pointerLife) * distance);
    camera.lookAt(mobile ? .05 : .7, mobile ? -.62 : 0, 0);

    renderer.toneMappingExposure = 1.05 + journey * .08 + macro * .12 - exit * .08;
    scene.environmentIntensity = 1.02 + journey * .15 + macro * .24;
    key.intensity = 6.1 + journey * .8 + macro * 1.2;
    front.intensity = 2.1 + macro * .6;
    whiteRim.intensity = 5.4 + journey * 1.1 + macro * 1.5;
    redRim.intensity = 62 + journey * 20 + macro * 12;
    redRim.position.x = 5.5 - macro * 2.2;
    ember.intensity = 18 + macro * 17;
  };

  const render = () => {
    frame = 0;
    if (!visible) return;
    const delta = targetProgress - currentProgress;
    currentProgress += delta * (reduced ? 1 : .15);
    pointerX += (pointerTargetX - pointerX) * .085;
    pointerY += (pointerTargetY - pointerY) * .085;
    apply(currentProgress);
    if (modelReady) renderer.render(scene, camera);
    if (Math.abs(delta) > .0003 || Math.abs(pointerTargetX - pointerX) > .001 || Math.abs(pointerTargetY - pointerY) > .001) requestRender();
  };

  const trigger = ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { targetProgress = reduced ? 0 : self.progress; requestRender(); } });
  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.15 : 1.55));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    apply(currentProgress);
    requestRender();
  };
  const pointer = (event: PointerEvent) => {
    if (reduced || event.pointerType === 'touch') return;
    const amplify = (value: number) => Math.sign(value) * Math.pow(Math.abs(value), .72);
    pointerTargetX = amplify(clamp((event.clientX / innerWidth - .5) * 2, -1, 1));
    pointerTargetY = amplify(clamp((event.clientY / innerHeight - .5) * 2, -1, 1));
    requestRender();
  };
  const pointerLeave = () => { pointerTargetX = 0; pointerTargetY = 0; requestRender(); };
  addEventListener('pointermove', pointer, { passive: true });
  track.addEventListener('pointerleave', pointerLeave, { passive: true });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; if (visible) requestRender(); }, { rootMargin: '180px' });
  visibilityObserver.observe(track);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestRender(); });
  resize();
  apply(0);
  requestRender();

  addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    trigger.kill();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    removeEventListener('pointermove', pointer);
    track.removeEventListener('pointerleave', pointerLeave);
    environment.dispose();
    disposableMaterials.forEach((material) => material.dispose());
    renderer.dispose();
  }, { once: true });
}
