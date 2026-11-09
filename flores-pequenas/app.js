import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { createMechanism } from './mechanism.js?v=I29';

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
const cycle = document.getElementById('cycle');
const inspection = document.getElementById('inspection');
const caseSize = document.getElementById('case-size');
const peak = document.getElementById('peak');
const side = document.getElementById('side-view');
const review = document.documentElement.dataset.review;
const bloom = review === 'I31';
const radialStudy = bloom || review === 'I30';

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

  const gltf = await new GLTFLoader().loadAsync('Flores-pequenas.glb?v=I28');
  const root = gltf.scene.children[0];
  const flowers = root.children.slice();
  if (flowers.length !== 6) throw new Error('Se esperaban seis flores en el modelo.');
  scene.add(gltf.scene);
  scene.updateMatrixWorld(true);

  const mechanism = radialStudy
    ? (await import(`./c4d-corolla.js?v=${review}`)).createC4DMechanism(THREE, root, { bloom })
    : createMechanism(THREE, root);
  await mechanism.ready;
  const {crown, caseLocal, boxOuterM} = mechanism.data;
  const format = new Intl.NumberFormat('es-CO', {maximumFractionDigits: 2});
  caseSize.textContent = boxOuterM.map(value => format.format(value)).join(' × ') + ' m';
  const layerSize = document.getElementById('layer-size');
  if (layerSize) layerSize.textContent = `${format.format(crown.layerPitchM * 1000)} mm`;
  const localBounds = new THREE.Box3(
    new THREE.Vector3().fromArray(caseLocal.min).addScalar(-1),
    new THREE.Vector3().fromArray(caseLocal.max).addScalar(1),
  );
  localBounds.union(new THREE.Box3(new THREE.Vector3().fromArray(crown.sweep.min),
    new THREE.Vector3().fromArray(crown.sweep.max)));
  const unitBounds = flowers.map(flower => localBounds.clone().applyMatrix4(flower.matrixWorld));
  const individualBounds = unitBounds[0];
  const groupBounds = new THREE.Box3();
  unitBounds.forEach(bounds => groupBounds.union(bounds));
  const grid = new THREE.GridHelper(12, 24, '#516871', '#324a53');
  scene.add(grid);
  stage.appendChild(renderer.domElement);
  poster.hidden = true;

  let showAll = false;
  let progress = 0;
  let animation = 0;
  let hold = 0;

  function centerView(profile = false) {
    const bounds = showAll ? groupBounds : individualBounds;
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const angle = Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect));
    const distance = sphere.radius / Math.sin(angle) * (showAll || radialStudy ? .98 : .88);
    const direction = profile && !showAll ? new THREE.Vector3(-.588, .20, .809) : showAll
      ? new THREE.Vector3(.85, 1.55, 1.15)
      : new THREE.Vector3(.95, bloom ? .68 : 1.03, 1.25);
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
    const state = mechanism.setProgress(progress);
    const percent = Math.round(progress * 100);
    travel.value = String(percent);
    const label = percent + ' % · ' + state.phase;
    readout.textContent = label;
    travel.setAttribute('aria-valuetext', label);
    raise.disabled = progress === 1;
    lower.disabled = progress === 0;
    draw();
  }

  function stopAnimation() {
    cancelAnimationFrame(animation);
    clearTimeout(hold);
    animation = hold = 0;
    pause.disabled = true;
  }

  function run(targets) {
    stopAnimation();
    pause.disabled = false;
    const queue = targets.slice();
    function next() {
      while (queue.length && queue[0] === progress) queue.shift();
      if (!queue.length) {
        stopAnimation();
        return;
      }
      const target = queue.shift();
      const from = progress;
      const duration = Math.max(500, Math.abs(target - from) * 6800);
      const began = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - began) / duration);
        if (t === 1) {
          setProgress(target);
          if (target === 1 && queue.length) hold = setTimeout(next, 850);
          else next();
          return;
        }
        const eased = t * t * (3 - 2 * t);
        setProgress(THREE.MathUtils.lerp(from, target, eased));
        animation = requestAnimationFrame(frame);
      }
      animation = requestAnimationFrame(frame);
    }
    next();
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
  fit.onclick = () => centerView();
  raise.onclick = () => run([1]);
  lower.onclick = () => run([0]);
  cycle.onclick = () => run([0, 1, 0]);
  pause.onclick = stopAnimation;
  if (side) side.onclick = () => centerView(true);
  if (peak) peak.onclick = () => {
    stopAnimation();
    setProgress(mechanism.data.openAt + (1 - mechanism.data.openAt) * crown.peakOpening);
  };
  inspection.onchange = () => {
    mechanism.setInspection(inspection.checked);
    draw();
  };
  travel.oninput = () => {
    const value = Number(travel.value);
    stopAnimation();
    setProgress(value / 100);
  };

  resize();
  setView(false);
  setProgress(0);
  mechanism.setInspection(inspection.checked);
  draw();
  new ResizeObserver(resize).observe(stage);
  for (const control of [one, six, fit, travel, cycle, inspection]) control.disabled = false;
  if (peak) peak.disabled = false;
  if (side) side.disabled = false;
  status.hidden = true;
  stage.dataset.ready = 'true';
}

start().catch(error => {
  status.textContent = 'No se pudo cargar el modelo 3D. Recarga la página para volver a intentarlo.';
  console.error(error);
});
