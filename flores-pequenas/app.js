import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { createMechanism } from './mechanism.js?v=I26';

const stage = document.getElementById('stage');
const status = document.getElementById('status');
const poster = document.getElementById('poster');
const one = document.getElementById('one');
const six = document.getElementById('six');
const fit = document.getElementById('fit');
const raise = document.getElementById('raise');
const lower = document.getElementById('lower');
const pause = document.getElementById('pause');
const travel = document.getElementById('travel');
const readout = document.getElementById('position');

async function start() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#17282f');
  const camera = new THREE.PerspectiveCamera(38, 1, .015, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Modelo 3D de las flores pequeñas de Quelec');
  const controls = new OrbitControls(camera, renderer.domElement);
  const draw = () => renderer.render(scene, camera);
  controls.addEventListener('change', draw);

  scene.add(new THREE.HemisphereLight('#fff1dc', '#aabac4', 2.1));
  const key = new THREE.DirectionalLight('#fff4e7', 2.8);
  key.position.set(-3, 8, 5);
  scene.add(key);

  const gltf = await new GLTFLoader().loadAsync('Flores-pequenas.glb?v=I26');
  const root = gltf.scene.children[0];
  const flowers = root.children.slice();
  if (flowers.length !== 6) throw new Error('Se esperaban seis flores en el modelo.');
  scene.add(gltf.scene);
  scene.updateMatrixWorld(true);

  const individualBounds = new THREE.Box3().setFromObject(flowers[0], true);
  const groupBounds = new THREE.Box3().setFromObject(root, true);
  const mechanism = createMechanism(THREE, root);
  const grid = new THREE.GridHelper(12, 24, '#516871', '#324a53');
  scene.add(grid);
  stage.appendChild(renderer.domElement);
  poster.hidden = true;

  let showAll = false;
  let progress = 1;
  let animation = 0;

  function centerView() {
    const bounds = showAll ? groupBounds : individualBounds;
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const angle = Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect));
    const distance = sphere.radius / Math.sin(angle) * (showAll ? .98 : .89);
    const direction = showAll
      ? new THREE.Vector3(.85, 1.55, 1.15)
      : new THREE.Vector3(.95, .68, 1.25);
    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).addScaledVector(direction.normalize(), distance);
    camera.near = Math.max(.01, sphere.radius / 120);
    camera.far = sphere.radius * 45;
    camera.updateProjectionMatrix();
    controls.minDistance = sphere.radius * .15;
    controls.maxDistance = sphere.radius * 15;
    grid.position.set(sphere.center.x, bounds.min.y - .025, sphere.center.z);
    grid.scale.setScalar(showAll ? 4 : .45);
    controls.update();
    draw();
  }

  function setView(all) {
    showAll = all;
    flowers.forEach((flower, index) => { flower.visible = all || index === 0; });
    one.setAttribute('aria-pressed', String(!all));
    six.setAttribute('aria-pressed', String(all));
    centerView();
  }

  function setProgress(value) {
    progress = THREE.MathUtils.clamp(value, 0, 1);
    mechanism.setProgress(progress);
    const percent = Math.round(progress * 100);
    travel.value = String(percent);
    let label = percent + ' %';
    if (progress === 0) label += ' · Posición baja';
    if (progress === 1) label += ' · Desplegada';
    readout.textContent = label;
    travel.setAttribute('aria-valuetext', label);
    raise.disabled = progress === 1;
    lower.disabled = progress === 0;
    draw();
  }

  function stopAnimation() {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    pause.disabled = true;
  }

  function moveTo(target) {
    stopAnimation();
    const from = progress;
    if (target === from) return;
    const duration = Math.max(500, Math.abs(target - from) * 4000);
    const began = performance.now();
    pause.disabled = false;
    const frame = now => {
      const t = Math.min(1, (now - began) / duration);
      if (t >= 1) {
        setProgress(target);
        stopAnimation();
        return;
      }
      const eased = t * t * (3 - 2 * t);
      setProgress(THREE.MathUtils.lerp(from, target, eased));
      animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  one.onclick = () => setView(false);
  six.onclick = () => setView(true);
  fit.onclick = centerView;
  raise.onclick = () => moveTo(1);
  lower.onclick = () => moveTo(0);
  pause.onclick = stopAnimation;
  travel.oninput = () => {
    const value = Number(travel.value);
    stopAnimation();
    setProgress(value / 100);
  };

  resize();
  setView(false);
  setProgress(1);
  new ResizeObserver(resize).observe(stage);
  for (const control of [one, six, fit, travel]) control.disabled = false;
  status.hidden = true;
  stage.dataset.ready = 'true';
}

start().catch(error => {
  status.textContent = 'No se pudo cargar el modelo 3D. Recarga la página para volver a intentarlo.';
  console.error(error);
});
