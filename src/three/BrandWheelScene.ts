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
  renderer.toneMappingExposure = 1.12;
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
  scene.environmentIntensity = 1.3;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xdce6f3, 0x100106, 1.8));
  const key = new THREE.RectAreaLight(0xffffff, 8.2, 5.5, 4.5);
  key.position.set(-4.4, 4.7, 5.6);
  key.lookAt(0, 0, 0);
  scene.add(key);
  const rim = new THREE.RectAreaLight(0xff1833, 10.5, 3.2, 5.8);
  rim.position.set(4.6, -.6, 2.8);
  rim.lookAt(0, 0, 0);
  scene.add(rim);
  const edge = new THREE.PointLight(0xffffff, 22, 18, 1.6);
  edge.position.set(1.8, 3.4, 5.2);
  scene.add(edge);
  const redFloor = new THREE.PointLight(0xff1028, 28, 15, 1.8);
  redFloor.position.set(-2.8, -3.1, 3.2);
  scene.add(redFloor);

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
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = 1.55;
          material.needsUpdate = true;
        }
      });
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.copy(center).multiplyScalar(-1);
    model.scale.setScalar(5.7 / Math.max(size.x, size.y, size.z));
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
