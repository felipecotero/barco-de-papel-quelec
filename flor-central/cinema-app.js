import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createC4DPetalMotion} from './c4d-petal-motion.js?v=I30';
import {buildCinemaStage, buildCinemaCarrier} from './cinema-stage.js?v=F07';

const $ = selector => document.querySelector(selector);
const format = value => value.toLocaleString('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const stages = [
  ['Guardada', 'Los cinco paños tienen su pliegue en el primer tercio. Sus puntas vuelven sobre el centro y cada raíz conserva su dirección.'],
  ['Salida plegada', 'La plataforma eleva el conjunto. El pliegue queda retenido mientras los pétalos atraviesan la boca.'],
  ['Apertura radial', 'Fuera de la boca, la curva avanza hacia la punta en cada pétalo. Los paños se extienden en cinco direcciones desde sus raíces.'],
  ['Abierta', 'La punta de cada pétalo termina con una caída suave. En el retorno, los pétalos recuperan el pliegue antes de bajar.'],
];
const palette = [0xe7d7b4, 0xc6774a, 0xaa3b68, 0xe1cdd8, 0xb56238];
const stops = [0, .11, .71, 1];
const platformLow = 1.77;
const platformHigh = 9.75;
const bendRadius = .055;
const hoopRadius = .0035;
const supportRadius = 1.90;
const supportTubeRadius = .008;
const supportBelowRoot = .013;
const layerPitch = .165;
const lowRootY = .26;
const clearance = .04;
const petals = Array.from({length: 5}, (_, index) => ({
  angle: index * 72 * Math.PI / 180,
  rootY: lowRootY + index * layerPitch,
  index,
}));

const scene = new THREE.Scene();
const viewport = $('#viewport');
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.27;
viewport.append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(39, 1, .04, 110);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = .55;
controls.maxDistance = 56;
controls.maxPolarAngle = Math.PI * .93;
scene.add(new THREE.HemisphereLight(0xf6ecdc, 0x546b7c, 2.25));
function light(color, intensity, position) {
  const source = new THREE.DirectionalLight(color, intensity);
  source.position.fromArray(position);
  scene.add(source);
}
light(0xffefcb, 3.2, [7, 18, 8]);
light(0xc4e9fb, 1.75, [-7, 13, -9]);

const model = createC4DPetalMotion({
  lengthM: 4, widthM: 3.5, minBendRadiusM: bendRadius, hoopEnvelopeRadiusM: hoopRadius,
  foldStartM: 4 / 3 - Math.PI * bendRadius, nx: 144, ny: 12, perimeterSamples: 384,
});
const carrier = buildCinemaCarrier({layers: petals, supportRadius, supportTubeRadius, supportBelowRoot});
scene.add(carrier.group);
const loader = new THREE.TextureLoader();
const metal = new THREE.MeshStandardMaterial({color: 0x5b4843, roughness: .47, metalness: .27});
const tubeSides = 8;
const initial = model.state(0);
const count = initial.hoop.length - 1;
const hoopIndices = [];
for (let index = 0; index < count; index += 1) {
  const next = (index + 1) % count;
  for (let side = 0; side < tubeSides; side += 1) {
    const adjacent = (side + 1) % tubeSides;
    const a = index * tubeSides + side;
    const b = index * tubeSides + adjacent;
    const c = next * tubeSides + side;
    const d = next * tubeSides + adjacent;
    hoopIndices.push(a, c, b, b, c, d);
  }
}
const clothGeometry = new THREE.BufferGeometry();
clothGeometry.setIndex(initial.indices);
clothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(initial.positions, 3));
clothGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(initial.uv.map((value, index) => index % 2 ? initial.uv[index - 1] : initial.uv[index + 1]), 2));
const hoopGeometry = new THREE.BufferGeometry();
hoopGeometry.setIndex(hoopIndices);
hoopGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * tubeSides * 3), 3));
for (const petal of petals) {
  const {index, angle, rootY} = petal;
  const local = new THREE.Group();
  local.name = 'Pétalo ' + (index + 1);
  local.position.y = rootY;
  local.rotation.y = angle;
  const textile = new THREE.MeshStandardMaterial({color: palette[index], side: THREE.DoubleSide, roughness: .92});
  loader.load('artes-preview/FG0' + (index + 1) + '.webp', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textile.color.set(0xffffff);
    textile.map = texture;
    textile.needsUpdate = true;
  });
  const cloth = new THREE.Mesh(clothGeometry, textile);
  cloth.name = 'Paño continuo';
  const rim = new THREE.Mesh(hoopGeometry, metal);
  rim.name = 'Aro flexible continuo';
  local.add(cloth, rim);
  carrier.group.add(local);
  Object.assign(petal, {local, textile, cloth, rim});
}

const tangent = new THREE.Vector3();
const reference = new THREE.Vector3(0, 0, 1);
const normal = new THREE.Vector3();
const binormal = new THREE.Vector3();
const previous = new THREE.Vector3();
function deform(state) {
  const clothPosition = clothGeometry.getAttribute('position');
  clothPosition.array.set(state.positions);
  clothPosition.needsUpdate = true;
  clothGeometry.computeVertexNormals();
  clothGeometry.computeBoundingSphere();

  const position = hoopGeometry.getAttribute('position');
  for (let index = 0; index < count; index += 1) {
    tangent.fromArray(state.hoop[(index + 1) % count])
      .sub(previous.fromArray(state.hoop[(index + count - 1) % count])).normalize();
    // Use the least parallel of two fixed axes for a circular section.
    normal.crossVectors(tangent, Math.abs(tangent.z) < .9 ? reference : THREE.Object3D.DEFAULT_UP).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    const [x, y, z] = state.hoop[index];
    for (let side = 0; side < tubeSides; side += 1) {
      const angle = side / tubeSides * 2 * Math.PI;
      const a = Math.cos(angle) * hoopRadius;
      const b = Math.sin(angle) * hoopRadius;
      position.setXYZ(index * tubeSides + side, x + a * normal.x + b * binormal.x,
        y + a * normal.y + b * binormal.y, z + a * normal.z + b * binormal.z);
    }
  }
  position.needsUpdate = true;
  hoopGeometry.computeVertexNormals();
  hoopGeometry.computeBoundingSphere();
}

deform(initial);
const packed = new THREE.Box3().setFromObject(carrier.group, true);
const openingHalfX = Math.max(-packed.min.x, packed.max.x) + clearance;
const openingHalfZ = Math.max(-packed.min.z, packed.max.z) + clearance;
const deckHeight = Math.max(2.75, Math.ceil((platformLow + packed.max.y + clearance + .18) / .05) * .05);
const stage = buildCinemaStage({halfX: openingHalfX, halfZ: openingHalfZ, deckY: deckHeight});
scene.add(stage.group);
$('#opening-size').textContent = format(2 * openingHalfX) + ' × ' + format(2 * openingHalfZ) + ' m';
$('#stage-scope').textContent = 'Montaje de estudio. La tarima se dibuja a ' + format(deckHeight)
  + ' m para alojar el paquete y el piso de 18 cm. La boca se dimensionó para este recorrido; sus tapas y el espacio real requieren revisión.';

const slider = $('#timeline');
const viewDirection = {
  crown: new THREE.Vector3(1, .68, 1.13),
  side: new THREE.Vector3(.32, .10, 1),
  top: new THREE.Vector3(0, 1, .0004),
  stage: new THREE.Vector3(1, .57, 1.42),
};
const easing = value => value * value * (3 - 2 * value);
let view = 'crown';
let progress = 0;
let currentPhase = -1;
let direction = 1;
let playing = false;
let turningAt = 0;
let lastTime = 0;
let lastOpening = 0;
let inspect = 'all';
let manualCamera = false;
let previousPlatformY = platformLow;
function focus() {
  const shape = camera.aspect < 1 ? camera.aspect : 1;
  const isStage = view === 'stage';
  const size = isStage ? 16.2 : progress > .40 ? 8.7 : 5.25;
  const target = isStage ? new THREE.Vector3(0, 5.15, 0)
    : new THREE.Vector3(0, previousPlatformY + .65, 0);
  const cameraDirection = viewDirection[view].clone();
  if (view === 'side' && inspect !== 'all') {
    const angle = petals[Number(inspect)].angle;
    cameraDirection.set(Math.cos(angle), .08, -Math.sin(angle));
  }
  const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / shape;
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(cameraDirection.normalize(), distance);
  controls.update();
}

function apply(next) {
  progress = THREE.MathUtils.clamp(next, 0, 1);
  const raised = easing(THREE.MathUtils.clamp(progress / .48, 0, 1));
  const opening = easing(THREE.MathUtils.clamp((progress - .48) / .52, 0, 1));
  const platformY = THREE.MathUtils.lerp(platformLow, platformHigh, raised);
  const dy = platformY - previousPlatformY;
  if (view !== 'stage') {
    camera.position.y += dy;
    controls.target.y += dy;
  }
  previousPlatformY = platformY;
  carrier.group.position.y = platformY;
  stage.update(platformY);
  if (opening !== lastOpening) {
    deform(model.state(opening));
    lastOpening = opening;
  }

  const phase = progress === 0 ? 0 : progress <= .48 ? 1 : progress < 1 ? 2 : 3;
  if (phase !== currentPhase) {
    $('#phase-kicker').textContent = 'ETAPA 0' + (phase + 1) + ' / 04';
    $('#phase-title').textContent = stages[phase][0];
    $('#phase-text').textContent = stages[phase][1];
    document.querySelectorAll('[data-stage]').forEach(button => {
      button.setAttribute('aria-pressed', Number(button.dataset.stage) === phase);
    });
    currentPhase = phase;
  }
  $('#lift-height').textContent = format(platformY) + ' m';
  const percent = Math.round(progress * 100) + ' %';
  $('#progress').textContent = percent;
  slider.value = Math.round(progress * 1000);
  slider.setAttribute('aria-valuetext', percent + ', ' + stages[phase][0]);

  if (!manualCamera && view !== 'stage') {
    // Keep the compact fold readable while it travels, and expand framing
    // gradually as the canopy grows across the viewport.
    const factor = Math.min(camera.aspect, 1);
    const size = THREE.MathUtils.lerp(5.25, 8.7, opening);
    const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / factor;
    const delta = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(delta, distance);
  }
}

function togglePlayback(value) {
  playing = value;
  $('#play').textContent = playing ? 'Ⅱ Pausar' : progress > 0 && progress < 1 ? '▶ Reanudar' : '▶ Ciclo completo';
}

$('#play').onclick = () => {
  if (playing) {
    togglePlayback(false);
    return;
  }
  if (progress === 0 || progress === 1) direction = progress === 1 ? -1 : 1;
  turningAt = 0;
  lastTime = performance.now();
  togglePlayback(true);
};
function seek(value) {
  apply(value);
  direction = progress === 1 ? -1 : 1;
  togglePlayback(false);
}

$('#reset').onclick = () => seek(0);
slider.oninput = () => seek(Number(slider.value) / 1000);
document.querySelectorAll('[data-stage]').forEach(button => {
  button.onclick = () => {
    seek(stops[Number(button.dataset.stage)]);
  };
});
document.querySelectorAll('[data-view]').forEach(button => {
  button.onclick = () => {
    view = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(other => other.setAttribute('aria-pressed', other === button));
    manualCamera = false;
    focus();
    apply(progress);
  };
});
controls.addEventListener('start', () => { manualCamera = true; });
$('#inspect').onchange = event => {
  inspect = event.target.value;
  petals.forEach((petal, index) => { petal.local.visible = inspect === 'all' || Number(inspect) === index; });
  if (view === 'side' && !manualCamera) {
    focus();
    apply(progress);
  }
};
$('#opacity').oninput = event => {
  const value = Number(event.target.value) / 100;
  $('#opacity-value').textContent = event.target.value + ' %';
  petals.forEach(({cloth, textile}) => {
    cloth.visible = value > 0;
    textile.opacity = value;
    textile.transparent = value < 1;
    textile.depthWrite = value === 1;
    textile.needsUpdate = true;
  });
};
$('#context').onchange = event => { stage.group.visible = event.target.checked; };

function resize() {
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
  if (!manualCamera) {
    focus();
    apply(progress);
  }
}
resize();
new ResizeObserver(resize).observe(viewport);
$('#loading').remove();

function frame(now) {
  if (playing) {
    const dt = Math.min(.1, (now - lastTime) / 1000);
    lastTime = now;
    if (turningAt <= now) {
      apply(progress + direction * dt / 9);
      if (progress === 1 && direction > 0) {
        direction = -1;
        turningAt = now + 1100;
      } else if (progress === 0 && direction < 0) {
        togglePlayback(false);
      }
    }
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__FLOR_CINEMA = {scene, model, petals, carrier, stage, packed, openingHalfX, openingHalfZ,
  seek,
  getState() { return {progress, opening: lastOpening, platformY: previousPlatformY, playing}; },
};
