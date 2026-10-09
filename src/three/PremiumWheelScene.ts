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
const acts = ['REVEAL', 'ORBIT', 'TREAD / MACRO', 'HERO ANGLE', 'NEXT TERRAIN'];

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
    const orbit = ease(range(progress, .1, .38));
    const macroIn = ease(range(progress, .34, .56));
    const macroOut = ease(range(progress, .6, .76));
    const macro = macroIn * (1 - macroOut);
    const hero = ease(range(progress, .66, .84));
    const exit = ease(range(progress, .9, 1));
    const copyOut = ease(range(progress, .08, .22));
    const stage = progress < .12 ? 0 : progress < .38 ? 1 : progress < .65 ? 2 : progress < .9 ? 3 : 4;

    if (stepIndex) stepIndex.textContent = `${String(stage).padStart(2, '0')} / 04`;
    if (stepName) stepName.textContent = acts[stage];
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (copy) {
      copy.style.opacity = String(1 - copyOut);
      copy.style.transform = mobile ? `translate3d(0,${-24 * copyOut}px,0)` : `translate3d(0,calc(-48% + ${-34 * copyOut}px),0)`;
      copy.style.pointerEvents = copyOut > .9 ? 'none' : 'auto';
    }
    if (flare) {
      flare.style.opacity = String((.64 + orbit * .13 + macro * .16) * (1 - exit * .7));
      flare.style.transform = `translate3d(${-7 * orbit + 5 * hero}%,${4 * macro}%,0) scale(${1 + .2 * macro})`;
    }
    if (hot) {
      hot.style.opacity = String((.2 + macro * .34 + hero * .1) * (1 - exit));
      hot.style.transform = `translate3d(${-15 * macro + 7 * hero}%,${-8 * orbit}%,0) scale(${1 + .28 * macro})`;
    }
    if (scan) scan.style.transform = `translate3d(${(progress - .5) * 55}vw,0,0)`;
    if (orbitGraphic) {
      orbitGraphic.style.opacity = String((.5 + orbit * .3) * (1 - exit));
      orbitGraphic.style.transform = `rotate(${progress * 92}deg) scale(${1 + macro * .16})`;
    }
    if (note) {
      note.style.opacity = String(ease(range(progress, .16, .3)) * (1 - ease(range(progress, .8, .92))));
      note.style.transform = `translate3d(${(1 - orbit) * 22}px,0,0)`;
    }

    const startX = mobile ? .15 : tablet ? .65 : 2.85;
    const orbitX = mobile ? -.25 : tablet ? .15 : 1.05;
    const macroX = mobile ? .72 : tablet ? 1.2 : 2.2;
    const heroX = mobile ? .1 : tablet ? .35 : 1.45;
    let x = mix(startX, orbitX, orbit);
    x = mix(x, macroX, macro);
    x = mix(x, heroX, hero);
    x += exit * (mobile ? 2.4 : 3.8);
    const startY = mobile ? -1.62 : tablet ? -.85 : -.05;
    const orbitY = mobile ? -.82 : tablet ? -.38 : .02;
    let y = mix(startY, orbitY, orbit) + macro * (mobile ? .1 : .24) - hero * .05 + exit * .2;
    let scale = mobile ? .53 : tablet ? .64 : .82;
    scale *= mix(1, 1.08, orbit);
    scale *= 1 + macro * (mobile ? .28 : .3);
    scale *= 1 - hero * .12 - exit * .22;

    const pointerStrength = mobile ? .08 : .2;
    root.position.set(x + pointerX * pointerStrength, y - pointerY * pointerStrength * .55, 0);
    root.scale.setScalar(scale);
    root.rotation.set(
      mix(-.12, .08, orbit) + macro * .16 + pointerY * (mobile ? .045 : .14),
      mix(.66, -.28, orbit) + macro * 1.16 - hero * .36 + pointerX * (mobile ? .06 : .2),
      mix(-.08, .035, orbit) - hero * .04 - pointerX * pointerY * .035,
    );
    wheel.rotation.z = -.08 - (orbit * .75 + macroIn * .38 + hero * .42 + exit * .25) * Math.PI;

    const cameraAngle = mix(-.08, .14, orbit) + macro * .17 - hero * .16;
    const distance = 10.2 - orbit * .25 - macro * .34 + hero * .45 + exit * 1.1;
    camera.position.set(Math.sin(cameraAngle + pointerX * .018) * distance, .08 + macro * .32 - pointerY * .055, Math.cos(cameraAngle + pointerX * .018) * distance);
    camera.lookAt(mobile ? .05 : .7, mobile ? -.62 : 0, 0);

    renderer.toneMappingExposure = 1.05 + orbit * .08 + macro * .12 - exit * .08;
    scene.environmentIntensity = 1.02 + orbit * .15 + macro * .24;
    key.intensity = 6.1 + orbit * .8 + macro * 1.2;
    front.intensity = 2.1 + macro * .6;
    whiteRim.intensity = 5.4 + orbit * 1.1 + macro * 1.5;
    redRim.intensity = 62 + orbit * 14 + macro * 12 + hero * 10;
    redRim.position.x = 5.5 - macro * 2.2;
    ember.intensity = 18 + macro * 17;
  };

  const render = () => {
    frame = 0;
    if (!visible) return;
    const delta = targetProgress - currentProgress;
    currentProgress += delta * (reduced ? 1 : .15);
    pointerX += (pointerTargetX - pointerX) * .065;
    pointerY += (pointerTargetY - pointerY) * .065;
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
    pointerTargetX = event.clientX / innerWidth - .5;
    pointerTargetY = event.clientY / innerHeight - .5;
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
