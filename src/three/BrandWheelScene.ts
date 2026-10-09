import * as THREE from 'three';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();

export function initBrandWheelScene(container: HTMLElement) {
  const canvas = container.querySelector<HTMLCanvasElement>('[data-brand-wheel-canvas]');
  const fallback = container.querySelector<HTMLElement>('[data-brand-wheel-fallback]');
  const desktop = window.matchMedia('(min-width: 901px)');
  if (!canvas || !desktop.matches) return;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    fallback?.removeAttribute('hidden');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(0, .1, 8.4);

  const root = new THREE.Group();
  const modelHolder = new THREE.Group();
  root.add(modelHolder);
  scene.add(root);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.08;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xcfd8e6, 0x120106, 1.35));
  const key = new THREE.RectAreaLight(0xffffff, 6.2, 6.5, 4.2);
  key.position.set(-4.8, 5.5, 6.4);
  key.lookAt(0, 0, 0);
  scene.add(key);
  const front = new THREE.RectAreaLight(0xbcc7d5, 2.2, 4.8, 5.4);
  front.position.set(1.1, .4, 7.5);
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
  const redFill = new THREE.RectAreaLight(0xff0b2d, 5.8, 4.6, 3.6);
  redFill.position.set(-3.6, -1.5, 4.4);
  redFill.lookAt(0, 0, 0);
  scene.add(redFill);

  let ready = false;
  let visible = true;
  let frame = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    frame = 0;
    if (!visible || !ready) return;
    pointerX += (pointerTargetX - pointerX) * .065;
    pointerY += (pointerTargetY - pointerY) * .065;
    const elapsed = clock.getElapsedTime();
    root.rotation.x = -.12 + pointerY * .16;
    root.rotation.y = -.5 + pointerX * .34 + (reduced ? 0 : Math.sin(elapsed * .42) * .035);
    root.rotation.z = -.07 - pointerX * .045;
    root.position.x = pointerX * .16;
    root.position.y = -.08 - pointerY * .09 + (reduced ? 0 : Math.sin(elapsed * .65) * .025);
    renderer.render(scene, camera);
    if (!reduced || Math.abs(pointerTargetX - pointerX) > .001 || Math.abs(pointerTargetY - pointerY) > .001) frame = requestAnimationFrame(render);
  };

  const loader = new USDLoader();
  loader.load(`${base}models/nismo/USD/Nismo_LMGT4_Wheels.usdc`, (model) => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = false;
      const tire = /tire|rubber/i.test(`${object.name} ${Array.isArray(object.material) ? object.material.map((item) => item.name).join(' ') : object.material?.name ?? ''}`);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          if (tire) {
            material.color.set(0x0b0c0e);
            material.metalness = .02;
            material.roughness = .62;
            material.envMapIntensity = .72;
          } else {
            material.metalness = .92;
            material.roughness = .2;
            material.envMapIntensity = 1.9;
          }
          material.needsUpdate = true;
        }
      });
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 4.15 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    modelHolder.add(model);
    ready = true;
    container.classList.add('is-ready');
    resize();
    frame = requestAnimationFrame(render);
  }, undefined, (error) => {
    console.error('CYL Nismo wheel failed to load', error);
    fallback?.removeAttribute('hidden');
  });

  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    pointerTargetX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerTargetY = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    if (!frame) frame = requestAnimationFrame(render);
  };
  const onPointerLeave = () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    if (!frame) frame = requestAnimationFrame(render);
  };

  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', onPointerLeave);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(render);
  }, { rootMargin: '160px' });
  intersectionObserver.observe(container);
}
