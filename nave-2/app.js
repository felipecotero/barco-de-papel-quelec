import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from './TransformControls.js';
import { buildShip } from './model.js?v=N20-3';
import { estimateShip } from './materiales.js?v=N20-3';

const $ = (selector) => document.querySelector(selector);
const host = $('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#15242d');
const camera = new THREE.PerspectiveCamera(37, 1, .035, 100);
camera.position.set(-6, 4.2, 6.7);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Nave 2.0 con cinco piezas independientes');
host.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .95, 0);
controls.enableDamping = true;
controls.minDistance = .5;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI * .95;

scene.add(new THREE.HemisphereLight('#e5f4ff', '#54636b', 2.7));
const key = new THREE.DirectionalLight('#fff4e5', 3.2);
key.position.set(-3, 7, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: .1, far: 20 });
key.shadow.normalBias = .015;
scene.add(key);
const fill = new THREE.DirectionalLight('#a9d9ff', 1.3);
fill.position.set(5, 3, -4);
scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: '#233741', roughness: .95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -.006;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(14, 28, '#49616e', '#314954');
grid.position.y = -.004;
grid.material.transparent = true;
grid.material.opacity = .3;
scene.add(grid);

const ship = buildShip(THREE);
const pieces = ship.pieces;
for (const piece of pieces) {
  scene.add(piece.group);
  piece.group.userData.pieceId = piece.id;
  piece.group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.pieceId = piece.id;
    }
  });
}
const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.setSize(.85);
gizmo.setSpace('local');
scene.add(gizmo.getHelper());

let needsFrame = true;
let selected = 0;
let mode = 'camera';
let isolated = false;
let showLabels = true;
let windowShape = 'rounded';
let dragStart = null;
let pointerStart = null;
const undo = [];
const storageKey = 'quelec-nave2-N20-1';
const labels = [];
let massEstimate = estimateShip(pieces, true);
let carrierStudy = null, carrierPromise = null, carrierShown = false;
let holdMode = 'shield';
const decimal = (n, digits = 1) => n.toLocaleString('es-CO', { minimumFractionDigits: digits, maximumFractionDigits: digits });
function updateMaterials(recalculate = false) {
  if (recalculate) massEstimate = estimateShip(pieces, $('#glazing').checked);
  const part = massEstimate.pieces[selected];
  $('#piece-mass').textContent = '≈ ' + decimal(part.total) + ' kg';
  $('#total-mass').textContent = '≈ ' + decimal(massEstimate.total) + ' kg';
  $('#mass-configuration').textContent = $('#glazing').checked
    ? 'Con el plástico de las ventanas instalado. Un portador por sección.'
    : 'Con los huecos de ventana abiertos. Un portador por sección.';
  const names = ['Nariz y orejas', 'Ventana izquierda', 'Ventana derecha', 'Cola izquierda', 'Cola derecha'];
  $('#mass-pieces').replaceChildren(...massEstimate.pieces.map((p, i) => {
    const row = document.createElement('tr');
    row.classList.toggle('current', i === selected);
    const name = document.createElement('th'); name.scope = 'row'; name.textContent = names[i];
    const mass = document.createElement('td'); mass.textContent = decimal(p.total) + ' kg';
    row.append(name, mass); return row;
  }));
  const lines = [...part.lines, { label: 'Reserva adicional · 15 %', mass: part.reserve, unit: '' }];
  $('#mass-breakdown').replaceChildren(...lines.map(l => {
    const row = document.createElement('tr');
    for (const text of [l.label, l.quantity === undefined ? '—' : decimal(l.quantity, 2) + ' ' + l.unit, decimal(l.mass, 2)]) {
      const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
    }
    return row;
  }));
}
function updateCarrierDetails() {
  const c = pieces[selected].carrier;
  $('#hold-options').hidden = selected === 0;
  $('#carrier-intro').textContent = selected === 0
    ? 'La nariz se lleva desde dentro, con la cabeza bajo el remate superior y una mano en cada agarre inferior de las orejas. El espacio central queda abierto arriba y abajo.'
    : holdMode === 'shield'
      ? 'El antebrazo descansa en la abrazadera acolchada y su mano toma la empuñadura delantera. La otra mano queda libre. El portador mira hacia la nariz con el panel a su costado.'
      : 'La mano del lado del panel toma la empuñadura delantera y la otra sujeta el respaldo de la abrazadera. Permite jugar con la pieza conservando la mirada hacia adelante.';
  $('#carrier-measures').textContent = selected === 0
    ? 'Asas inferiores a 105 cm del suelo · 27 cm de largo · 50 cm entre manos, en la altura de transporte propuesta.'
    : 'Puño a ' + decimal(c.gripHeightWorldM * 100, 0) + ' cm · brazalete a ' + decimal((c.cuffPosition[1] + pieces[selected].home.position[1]) * 100, 0) + ' cm. Separación de ' + decimal(c.cuffToHandDistanceM * 100, 1) + ' cm; ajustar al medio del antebrazo.';
  $('#carrier-caution').textContent = selected === 0
    ? 'La altura de transporte propuesta deja el borde superior de las orejas a 176 cm del suelo. Ajustar y comprobar la holgura de la cabeza con su portador real.'
    : (selected < 3 ? 'Los apoyos están bajo la ventana, dejando libre su hueco. ' : 'El apoyo se sitúa en la zona central del panel de cola. ') + 'La correa se libera sin herramientas. Comprobar ajuste, presión, equilibrio y recorrido con un prototipo.';
}
function setHoldMode(value) {
  if (!['shield', 'two-hands'].includes(value)) return;
  holdMode = value;
  document.querySelectorAll('[data-hold]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.hold === value)));
  carrierStudy?.setHoldMode(value);
  updateCarrierDetails(); invalidate(); save();
}
async function showCarrier(visible) {
  carrierShown = visible;
  $('#carrier').setAttribute('aria-pressed', String(visible));
  if (!visible) {
    carrierStudy?.setVisible(false);
    $('#carrier-status').textContent = '';
    invalidate(); return;
  }
  $('#carrier-status').textContent = 'Preparando al portador…';
  try {
    if (!carrierPromise) carrierPromise = import('./postura.js?v=N20-3')
      .then(({ createCarrierStudy }) => createCarrierStudy(THREE, pieces, invalidate))
      .then(study => { carrierStudy = study; scene.add(study.root); return study; })
      .catch(error => { carrierPromise = null; throw error; });
    const study = await carrierPromise;
    study.setHoldMode(holdMode);
    study.setSelected(selected);
    study.setVisible(carrierShown);
    $('#carrier-status').textContent = carrierShown ? 'Portador de referencia visible · mirando hacia la nariz.' : '';
    invalidate();
  } catch (error) {
    carrierShown = false;
    $('#carrier').setAttribute('aria-pressed', 'false');
    $('#carrier-status').textContent = 'No se pudo cargar la figura. Pulsa Portador para reintentar.';
    console.error(error);
  }
}
const radians = THREE.MathUtils.degToRad;
const degrees = THREE.MathUtils.radToDeg;
const invalidate = () => { needsFrame = true; };
const transparency = window.QuelecSurfaceTransparency.install({
  renderer,
  getRoot: () => pieces.map((piece) => piece.group),
  isSurface: (mesh) => pieces.some((piece) => piece.skins.includes(mesh)),
  label: 'Transparencia de las pieles',
  container: $('#transparency'),
  onChange: () => { invalidate(); save(); },
});

function snapshot() {
  return pieces.map(({ group }) => ({ position: group.position.toArray(), quaternion: group.quaternion.toArray() }));
}
function isPose(value) {
  return Array.isArray(value) && value.length === pieces.length && value.every((pose) =>
    Array.isArray(pose.position) && pose.position.length === 3 && pose.position.every((v) => Number.isFinite(v) && Math.abs(v) < 100) &&
    Array.isArray(pose.quaternion) && pose.quaternion.length === 4 && pose.quaternion.every(Number.isFinite) &&
    Math.abs(Math.hypot(...pose.quaternion) - 1) < .01);
}
function apply(poses) {
  poses.forEach((pose, i) => {
    pieces[i].group.position.fromArray(pose.position);
    pieces[i].group.quaternion.fromArray(pose.quaternion).normalize();
    pieces[i].group.updateMatrixWorld(true);
  });
  updateInputs();
  invalidate();
}
const original = snapshot();
function remember(poses = snapshot()) {
  undo.push(poses);
  if (undo.length > 35) undo.shift();
  $('#undo').disabled = false;
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      poses: snapshot(), selected, windowShape, glazing: $('#glazing').checked,
      transparency: transparency.getState().value, holdMode,
    }));
  } catch { /* El visor sigue funcionando cuando el navegador limita el almacenamiento. */ }
}
function updateInputs() {
  const group = pieces[selected].group;
  document.querySelectorAll('[data-position]').forEach((input) => {
    input.value = (group.position.getComponent(Number(input.dataset.position)) * 100).toFixed(1);
  });
  document.querySelectorAll('[data-rotation]').forEach((input) => {
    input.value = degrees(group.rotation[['x', 'y', 'z'][Number(input.dataset.rotation)]]).toFixed(1);
  });
}
function updateVisibility() {
  pieces.forEach((piece, i) => { piece.group.visible = !isolated || i === selected; });
  $('#isolate').setAttribute('aria-pressed', String(isolated));
  invalidate();
}
function select(index) {
  selected = index;
  const piece = pieces[selected];
  $('#piece-name').textContent = piece.name;
  $('#piece-dimensions').textContent = selected === 0
    ? '170 × 90 × 100 cm · orejas de 70 cm'
    : selected > 2 ? '110 × 70 × 3,5 cm · alerón de 70 cm' : '110 × 70 × 3,5 cm';
  $('#piece-description').textContent = piece.description || 'Apoyos de carga unidos al bastidor para un portador.';
  document.querySelectorAll('[data-piece]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
  labels.forEach((label, i) => label.classList.toggle('selected', i === selected));
  if (mode !== 'camera') gizmo.attach(piece.group);
  updateVisibility();
  updateInputs();
  updateMaterials();
  updateCarrierDetails();
  carrierStudy?.setSelected(selected);
  save();
}
function setMode(next) {
  mode = next;
  if (next === 'camera') {
    gizmo.detach();
  } else {
    gizmo.attach(pieces[selected].group);
    gizmo.setMode(next);
    gizmo.setSpace('local');
  }
  document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('#hint').textContent = mode === 'camera'
    ? 'Selecciona una pieza en la lista o sobre el modelo. Arrastra el fondo para girar la cámara.'
    : mode === 'translate'
      ? 'Arrastra una flecha para mover sobre X, Y o Z de la pieza. Las zonas cuadradas mueven en dos ejes.'
      : 'Arrastra un arco para girar sobre el eje propio de la pieza. Puedes escribir los grados en «Posición y giro exactos».';
  invalidate();
}
function bounds() {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const { group } of pieces) if (group.visible) box.union(new THREE.Box3().setFromObject(group));
  if (carrierStudy && carrierShown) { carrierStudy.update(); box.union(new THREE.Box3().setFromObject(carrierStudy.root)); }
  return box;
}
function fit(direction = new THREE.Vector3(-1, .65, 1)) {
  const box = bounds();
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z * 1.2, 1);
  const aspect = camera.aspect;
  const distance = radius / (2 * Math.tan(radians(camera.fov / 2))) * Math.max(1, 1 / aspect) * 1.2;
  controls.target.copy(center);
  camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
  controls.update();
  invalidate();
}
function setWindows(shape) {
  windowShape = shape;
  ship.setWindowShape(shape === 'round' ? 'circular' : 'rounded');
  document.querySelectorAll('[data-window]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.window === shape)));
  transparency.refresh();
  updateMaterials(true);
  invalidate();
  save();
}
pieces.forEach((piece, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.piece = piece.id;
  button.setAttribute('aria-pressed', String(index === 0));
  button.title = 'Seleccionar ' + piece.name;
  const number = document.createElement('span');
  number.textContent = String(index + 1).padStart(2, '0');
  const title = document.createElement('span');
  title.textContent = piece.name;
  const hint = document.createElement('b');
  hint.textContent = '↗';
  button.append(number, title, hint);
  button.addEventListener('click', () => select(index));
  $('#pieces').append(button);
  const tag = document.createElement('div');
  tag.className = 'piece-tag';
  tag.textContent = ['01 · Nariz', '02 · Ventana izq.', '03 · Ventana der.', '04 · Cola izq.', '05 · Cola der.'][index];
  $('#tags').append(tag);
  labels.push(tag);
});

gizmo.addEventListener('dragging-changed', (event) => {
  controls.enabled = !event.value;
  if (event.value) dragStart = snapshot();
  else if (dragStart) {
    if (JSON.stringify(dragStart) !== JSON.stringify(snapshot())) remember(dragStart);
    dragStart = null;
    save();
  }
  invalidate();
});
gizmo.addEventListener('objectChange', () => { updateInputs(); invalidate(); });
gizmo.addEventListener('change', invalidate);
controls.addEventListener('change', invalidate);

document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('[data-window]').forEach((button) => button.addEventListener('click', () => setWindows(button.dataset.window)));
$('#glazing').addEventListener('change', () => {
  ship.setGlazing($('#glazing').checked);
  transparency.refresh();
  updateMaterials(true);
  invalidate();
  save();
});
document.querySelectorAll('[data-hold]').forEach(button => button.addEventListener('click', () => setHoldMode(button.dataset.hold)));
$('#carrier').addEventListener('click', () => showCarrier(!carrierShown));
$('#carrier-view').addEventListener('click', async () => {
  isolated = true; updateVisibility(); setMode('camera');
  await showCarrier(true);
  const piece = pieces[selected];
  const direction = selected === 0 ? new THREE.Vector3(2, .45, 1.9) : new THREE.Vector3(-1.1, .30, -piece.sideSign * 1.8);
  direction.applyQuaternion(piece.group.quaternion);
  fit(direction);
});
$('#isolate').addEventListener('click', () => { isolated = !isolated; updateVisibility(); });
$('#fit').addEventListener('click', () => fit());
$('#top-view').addEventListener('click', () => fit(new THREE.Vector3(.001, 1, .001)));
$('#inside').addEventListener('click', () => {
  isolated = true;
  updateVisibility();
  transparency.setValue(82);
  const piece = pieces[selected];
  piece.group.updateWorldMatrix(true, true);
  const center = new THREE.Box3().setFromObject(piece.group).getCenter(new THREE.Vector3());
  const inward = selected === 0 ? new THREE.Vector3(2, .85, 1.6)
    : new THREE.Vector3(-.8, .65, piece.group.position.z < 0 ? 2 : -2);
  inward.applyQuaternion(piece.group.quaternion).normalize().multiplyScalar(selected === 0 ? 3.2 : 2.4);
  controls.target.copy(center);
  camera.position.copy(center).add(inward);
  controls.update();
  setMode('camera');
});
$('#labels').addEventListener('click', () => {
  showLabels = !showLabels;
  $('#labels').setAttribute('aria-pressed', String(showLabels));
  $('#tags').hidden = !showLabels;
  invalidate();
});
$('#undo').addEventListener('click', () => {
  if (!undo.length) return;
  apply(undo.pop());
  $('#undo').disabled = !undo.length;
  save();
});
$('#reset-piece').addEventListener('click', () => {
  remember();
  pieces[selected].group.position.fromArray(original[selected].position);
  pieces[selected].group.quaternion.fromArray(original[selected].quaternion);
  updateInputs();
  save();
  invalidate();
});
function arrange(separate) {
  remember();
  apply(original);
  isolated = false;
  updateVisibility();
  if (separate) {
    pieces.forEach((piece, i) => {
      if (!i) piece.group.position.x -= .7;
      else {
        piece.group.position.z *= 2.8;
        if (i > 2) piece.group.position.x += 1;
      }
    });
  }
  updateInputs();
  fit();
  save();
}
$('#assembled').addEventListener('click', () => arrange(false));
$('#separated').addEventListener('click', () => arrange(true));
document.querySelectorAll('[data-position],[data-rotation]').forEach((input) => {
  input.addEventListener('change', () => {
    const value = Number(input.value);
    if (!Number.isFinite(value) || Math.abs(value) > 10000) { updateInputs(); return; }
    const group = pieces[selected].group;
    const axis = ['x', 'y', 'z'][Number(input.dataset.rotation)];
    const current = 'position' in input.dataset
      ? group.position.getComponent(Number(input.dataset.position)) * 100 : degrees(group.rotation[axis]);
    if (Math.abs(current - value) < .00001) return;
    remember();
    if ('position' in input.dataset) group.position.setComponent(Number(input.dataset.position), value / 100);
    else {
      group.rotation[axis] = radians(value);
    }
    updateInputs();
    save();
    invalidate();
  });
});
window.addEventListener('keydown', (event) => {
  if (event.target.closest('input,select,textarea,summary') || event.altKey) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    $('#undo').click();
  } else if (!event.ctrlKey && !event.metaKey) {
    const next = { c: 'camera', m: 'translate', r: 'rotate' }[event.key.toLowerCase()];
    if (next) { event.preventDefault(); setMode(next); }
  }
});
const raycaster = new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown', (event) => { pointerStart = [event.clientX, event.clientY]; });
renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5 || gizmo.axis || gizmo.dragging) return;
  const rect = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(
    (event.clientX - rect.left) / rect.width * 2 - 1,
    -(event.clientY - rect.top) / rect.height * 2 + 1,
  ), camera);
  const hits = raycaster.intersectObjects(pieces.filter((piece) => piece.group.visible).map((piece) => piece.group), true);
  const index = hits.length ? pieces.findIndex((piece) => piece.id === hits[0].object.userData.pieceId) : -1;
  if (index >= 0) select(index);
});

const project = new THREE.Vector3();
function positionTags() {
  if (!showLabels) return;
  const rect = host.getBoundingClientRect();
  pieces.forEach((piece, i) => {
    if (!piece.group.visible) { labels[i].hidden = true; return; }
    const box = new THREE.Box3().setFromObject(piece.group);
    box.getCenter(project);
    project.y = box.max.y + .13;
    project.project(camera);
    labels[i].hidden = project.z > 1 || project.z < -1;
    labels[i].style.left = (project.x * .5 + .5) * rect.width + 'px';
    labels[i].style.top = (-project.y * .5 + .5) * rect.height + 'px';
  });
}
let lastWidth = 0;
new ResizeObserver(() => {
  const shouldFit = !lastWidth || Math.abs(host.clientWidth - lastWidth) > 90;
  const direction = camera.position.clone().sub(controls.target);
  lastWidth = host.clientWidth;
  camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  if (shouldFit) fit(direction);
  invalidate();
}).observe(host);
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && isPose(saved.poses)) {
    // Raise only the former default carry height; preserve custom placements.
    if (Math.abs(saved.poses[0].position[1] - .90) < .0001) saved.poses[0].position[1] = pieces[0].home.position[1];
    apply(saved.poses);
    if (['round', 'rounded'].includes(saved.windowShape)) setWindows(saved.windowShape);
    $('#glazing').checked = saved.glazing !== false;
    ship.setGlazing($('#glazing').checked);
    if (Number.isFinite(saved.transparency)) transparency.setValue(saved.transparency);
    if (['shield', 'two-hands'].includes(saved.holdMode)) setHoldMode(saved.holdMode);
    if (Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < pieces.length) selected = saved.selected;
  }
} catch { /* Conservar la disposición inicial si no hay una sesión válida. */ }
updateMaterials(true);
const initialQuery = new URLSearchParams(location.search);
const queryPiece = pieces.findIndex(piece => piece.id === initialQuery.get('pieza'));
if (queryPiece >= 0) selected = queryPiece;
if (initialQuery.get('postura') === 'escudo') setHoldMode('shield');
if (initialQuery.get('postura') === 'dos-manos') setHoldMode('two-hands');
select(selected);
controls.update();
$('#loading').remove();
document.documentElement.dataset.ready = 'true';
renderer.setAnimationLoop(() => {
  controls.update();
  if (!needsFrame) return;
  carrierStudy?.update();
  positionTags();
  renderer.render(scene, camera);
  needsFrame = false;
});
window.nave2 = { ship, pieces, camera, renderer, controls, gizmo, transparency, select, setMode, setWindows, snapshot, showCarrier, setHoldMode, get massEstimate() { return massEstimate; }, get carrierStudy() { return carrierStudy; } };

if (['escudo', 'dos-manos'].includes(initialQuery.get('postura'))) $('#carrier-view').click();
