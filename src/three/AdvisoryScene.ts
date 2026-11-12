import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);
const mix = (from: number, to: number, value: number) => from + (to - from) * value;

export function initAdvisoryScene(canvas: HTMLCanvasElement, section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('.advisory-stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.setClearColor(0x030406, 1);
  renderer.autoClear = false;

  const backgroundScene = new THREE.Scene();
  backgroundScene.background = new THREE.Color(0x030406);
  backgroundScene.fog = new THREE.FogExp2(0x030406, .021);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030406, .026);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const factory = new THREE.Group();
  const car = new THREE.Group();
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowGradient = shadowContext?.createRadialGradient(128, 64, 5, 128, 64, 122);
  shadowGradient?.addColorStop(0, 'rgba(0,0,0,.78)');
  shadowGradient?.addColorStop(.48, 'rgba(0,0,0,.5)');
  shadowGradient?.addColorStop(1, 'rgba(0,0,0,0)');
  if (shadowContext && shadowGradient) {
    shadowContext.fillStyle = shadowGradient;
    shadowContext.fillRect(0, 0, 256, 128);
  }
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 3.1),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .72 }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(3.9, -2.79, 1.7);
  backgroundScene.add(factory);
  scene.add(contactShadow, car);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environment = environment;
  backgroundScene.environment = environment;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xb9c2cf, 0x180104, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 4.4);
  key.position.set(3, 8, 7);
  scene.add(key);
  const red = new THREE.PointLight(0xff1028, 72, 22, 1.45);
  red.position.set(5, .2, 4);
  scene.add(red);
  const rim = new THREE.SpotLight(0xff3144, 95, 35, Math.PI / 3.2, .72, 1.25);
  rim.position.set(-5, 4, -1);
  rim.target.position.set(3, 0, 1);
  scene.add(rim, rim.target);
  backgroundScene.add(new THREE.HemisphereLight(0x768296, 0x090103, .72));
  const factoryKey = new THREE.DirectionalLight(0xb8c3d2, 1.8);
  factoryKey.position.set(-4, 8, 9);
  backgroundScene.add(factoryKey);
  const factoryRed = new THREE.PointLight(0xff1028, 34, 28, 1.6);
  factoryRed.position.set(7, -1, 7);
  backgroundScene.add(factoryRed);

  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let visible = true;
  let modelsReady = 0;

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const addNormalized = (url: string, target: THREE.Group, size: number, after: (model: THREE.Object3D) => void) => {
    loader.load(`${base}${url}`, ({ scene: model }) => {
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = false;
        object.receiveShadow = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ('envMapIntensity' in material) material.envMapIntensity = target === car ? 1.25 : .55;
          if (target === factory && 'roughness' in material) material.roughness = Math.max(Number(material.roughness), .62);
          if (target === factory && 'color' in material && material.color instanceof THREE.Color) material.color.multiplyScalar(.58);
        });
      });
      const bounds = new THREE.Box3().setFromObject(model);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.copy(center).multiplyScalar(-1);
      model.scale.setScalar(size / Math.max(dimensions.x, dimensions.y, dimensions.z));
      target.add(model);
      after(model);
      modelsReady += 1;
      if (modelsReady === 2) {
        stage?.classList.add('advisory-3d-ready');
        requestRender();
      }
    }, undefined, (error) => console.error(`Failed to load ${url}`, error));
  };

  addNormalized('models/advisory-old-factory.glb', factory, 40, () => {
    factory.position.set(2.2, 2.7, -5);
    factory.rotation.y = -.035;
  });
  addNormalized('models/advisory-mercedes-amg-gt3.glb', car, 7.2, () => {
    car.position.set(3.9, -1.82, 1.7);
    car.rotation.y = -.48;
  });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  };

  const apply = (progress: number) => {
    const reveal = ease(clamp(progress / .34));
    const travel = ease(clamp((progress - .12) / .88));
    // The camera travels laterally through the factory while the framing keeps
    // the Mercedes planted on the right. Pointer movement adds a smaller,
    // independent orbit so the scene feels spatial instead of composited.
    const cameraOrbitX = mix(-.9, 1.15, travel) + pointerX * .82;
    car.position.x = mix(4.85, 3.9, reveal) - travel * .12;
    car.position.y = mix(-1.92, -1.82, reveal);
    car.position.z = mix(2.25, 1.7, reveal) + travel * .12;
    car.rotation.x = pointerY * .01;
    car.rotation.y = mix(-.08, -.48, reveal) - travel * .08 + pointerX * .025;
    car.rotation.z = mix(-.018, 0, reveal) - pointerX * .004;
    contactShadow.position.x = car.position.x;
    contactShadow.position.z = car.position.z;
    (contactShadow.material as THREE.MeshBasicMaterial).opacity = reveal * .72;
    factory.position.x = 2.2 - cameraOrbitX * .22;
    factory.rotation.y = -.035 + cameraOrbitX * .018;
    camera.position.set(cameraOrbitX, 2.22 + travel * .12 - pointerY * .32, 13.85 - travel * .72 - Math.abs(pointerX) * .16);
    camera.lookAt(1.22 + cameraOrbitX * .3, -.92 - pointerY * .16, -.5 - Math.abs(cameraOrbitX) * .08);
  };

  const render = () => {
    frame = 0;
    currentProgress += (targetProgress - currentProgress) * .085;
    pointerX += (pointerTargetX - pointerX) * .075;
    pointerY += (pointerTargetY - pointerY) * .075;
    apply(currentProgress);
    renderer.clear(true, true, true);
    renderer.render(backgroundScene, camera);
    renderer.clearDepth();
    renderer.render(scene, camera);
    if (
      Math.abs(targetProgress - currentProgress) > .0005 ||
      Math.abs(pointerTargetX - pointerX) > .001 ||
      Math.abs(pointerTargetY - pointerY) > .001
    ) requestRender();
  };
  const requestRender = () => {
    if (!visible || frame || modelsReady < 2) return;
    frame = requestAnimationFrame(render);
  };
  const setProgress = (progress: number) => {
    targetProgress = clamp(progress);
    requestRender();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
  }, { rootMargin: '150px' });
  visibilityObserver.observe(section);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.addEventListener('pointermove', (event) => {
      const bounds = section.getBoundingClientRect();
      pointerTargetX = clamp((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointerTargetY = clamp((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      requestRender();
    }, { passive: true });
    section.addEventListener('pointerleave', () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
      requestRender();
    }, { passive: true });
  }
  resize();
  apply(0);

  return { setProgress };
}
