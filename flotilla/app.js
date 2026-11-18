import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { buildCaravel } from './model.js?v=FLOT1-cortes';

const $ = selector => document.querySelector(selector);
const V = value => new THREE.Vector3(...value);
const cm = (value, digits = 2) => (value * 100).toLocaleString('es-CO', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const host = $('#viewport');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#152b38');
const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1, -1, .01, 40);
camera.position.set(-2.4, 1.7, 2.9);
// Supersampling avoids the MSAA edge leakage of almost coplanar paper layers.
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Flotilla de dos carabelas de 150 y 100 cm, comparadas a escala real');
host.prepend(renderer.domElement);
let controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .31, 0); controls.enableDamping = true;
controls.minZoom = .35; controls.maxZoom = 12;
controls.maxPolarAngle = Math.PI * .98;
scene.add(new THREE.HemisphereLight('#f4f5e9', '#456273', 2.4));
const key = new THREE.DirectionalLight('#fff2dd', 2.9);
key.position.set(-2, 4, 3); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: .1, far: 10 });
key.shadow.normalBias = .0025; scene.add(key);
const fill = new THREE.DirectionalLight('#b8dcf1', 1.0); fill.position.set(2, 2, -3); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#24404e', roughness: .96 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.receiveShadow = true; scene.add(floor);
const boats = [
  { id: '150', name: 'Carabela mayor', label: '150 cm', model: buildCaravel(THREE, { scale: 1, codePrefix: 'C150' }) },
  { id: '100', name: 'Carabela 100 cm', label: '100 cm', model: buildCaravel(THREE, { scale: 2 / 3, codePrefix: 'C100' }) },
];
const models = boats.map(boat => boat.model);
boats.forEach(boat => scene.add(boat.model.root));
let boatId = '150', comparison = true, model = boats[0].model;
let exportConfig = null;
const shortCM = value => (value * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });
const selectedLines = new THREE.Group(); selectedLines.name = 'Seleccion_y_medidas_no_exportar'; scene.add(selectedLines);
const dimensionLines = new THREE.Group(); dimensionLines.name = 'Cotas_generales_no_exportar'; scene.add(dimensionLines);

let selectedId = null, isolated = false, linesOn = false, colorsOn = false, labelsOn = false, dimensionsOn = false;
let cameraView = '3d', tween = null, needsFrame = true, dragging = null;
let annotationItems = [], dimensionItems = [], lastWidth = 0;
const invalidate = () => { needsFrame = true; };
function notify(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  clearTimeout(notify.timer); notify.timer = setTimeout(() => $('#toast').classList.remove('show'), 2800);
}
const transparency = QuelecSurfaceTransparency.install({ renderer, getRoot: () => models.map(item => item.root),
  isSurface: mesh => models.some(item => item.skins.includes(mesh)), label: 'Transparencia del casco y la vela', container: $('#transparency'), onChange: invalidate });
const selected = () => model.panels.find(panel => panel.id === selectedId) || null;
function clearGroup(group) {
  for (const child of [...group.children]) { child.geometry?.dispose(); child.material?.dispose(); group.remove(child); }
}
function line(group, points, color = '#f0cf89', depth = false) {
  const material = new THREE.LineBasicMaterial({ color, depthTest: depth, depthWrite: false, transparent: true, opacity: .95 });
  const mesh = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
  mesh.renderOrder = 25; group.add(mesh); return mesh;
}
function visiblePoints() {
  if (isolated && selected()) return selected().vertices.map(V);
  const list = comparison ? boats : boats.filter(boat => boat.id === boatId);
  return list.flatMap(boat => Object.values(boat.model.vertices).map(value => V(value).add(boat.model.root.position)));
}
function bounds() {
  if (isolated && selected()?.kind === 'rib') return new THREE.Box3().setFromObject(selected().mesh);
  return new THREE.Box3().setFromPoints(visiblePoints());
}
function setMeasure(id, value) {
  const unit = document.createElement('span'); unit.textContent = 'cm';
  $(id).replaceChildren(document.createTextNode(shortCM(value) + ' '), unit);
}
function updateBoatDetails() {
  const boat = boats.find(item => item.id === boatId), d = model.dimensions;
  $('#boat-heading').textContent = comparison ? 'Las dos, a la misma escala.' : boat.name + ' · ' + boat.label;
  $('#comparison-measures').hidden = !comparison; $('#single-measures').hidden = comparison;
  setMeasure('#dimension-length', d.length); setMeasure('#dimension-width', d.width); setMeasure('#dimension-height', d.height);
  $('#projection-side').textContent = shortCM(d.length / 2) + ' cm';
  $('#projection-offset').textContent = shortCM(d.width / 2) + ' cm';
  $('#projection-real').textContent = cm(Math.hypot(d.length / 2, d.width / 2)) + ' cm';
  $('#sail-base-note').textContent = 'El rombo sigue la V interior del casco. Sus puntos laterales se elevan ' + boats.map(item => item.label + ': ' + cm(item.model.dimensions.sailBaseRise) + ' cm').join(' · ') + ' sobre los extremos de la quilla.';
  $('#rib-net-note').textContent = boats.map(item => item.label + ': base neta ' + cm(item.model.ribNet.baseWidthM) + ' cm y altura neta ' + cm(item.model.ribNet.heightM) + ' cm').join('. ') + '. Son medidas interiores de corte; no el ancho exterior de la vela.';
  document.querySelectorAll('[data-boat]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.boat === (comparison ? 'both' : boatId))));
  $('#dimensions').disabled = comparison;
  $('#dimensions').title = comparison ? 'Elige 150 cm o 100 cm para medir un barco individual' : 'Mostrar u ocultar el largo, ancho y altura del barco elegido';
  $('#export-model').disabled = comparison;
  $('#export-model').title = comparison ? 'Elige 150 cm o 100 cm para descargar su modelo individual' : 'Descargar la carabela de ' + boatId + ' cm a escala real';
  if (exportConfig) {
    exportConfig.name = 'Quelec-Flotilla-Carabela-' + boatId + 'cm';
    exportConfig.notes = 'Carabela de ' + boatId + ' cm: ' + shortCM(d.length) + ' × ' + shortCM(d.width) + ' × ' + shortCM(d.height) + ' cm exteriores. Seis paños de casco, cuatro caras de vela y una costilla central neta de Cartón Plast de 4 mm. Costilla calculada dentro de las pieles, con 0,5 mm de holgura normal propuesta por cara. No incluye suelo, cotas, selección ni el otro barco. Las piezas y sus cotas se entregan en el PDF Carta específico de este tamaño.';
  }
}
function updateAppearance() {
  for (const boat of boats) {
    const item = boat.model, active = boat.id === boatId;
    item.root.visible = comparison || active;
    item.root.position.set(comparison ? boat.id === '150' ? -.65 : .80 : 0, 0, 0);
    item.setView(linesOn ? 'lines' : colorsOn ? 'colors' : 'solid');
    item.setSelected(active && !comparison ? selectedId : null);
    for (const panel of item.panels) panel.mesh.visible = !linesOn && (!isolated || !active || panel.id === selectedId);
    for (const edge of item.edges) {
      edge.line.visible = !isolated || !active || edge.panelIds.includes(selectedId);
      const chosen = active && selectedId && edge.panelIds.includes(selectedId);
      edge.line.material.color.set(chosen ? '#f0cf89' : edge.kind === 'rib' ? '#d7b978' : linesOn ? '#b4d5df' : '#536d77');
      edge.line.material.opacity = chosen ? 1 : selectedId && active ? .45 : linesOn ? .95 : .65;
    }
  }
  selectedLines.visible = Boolean(selectedId) && labelsOn && !comparison;
  $('#view-scope').textContent = comparison ? '150 y 100 cm · mismo suelo y escala compartida' : selectedId && (isolated || cameraView === 'panel') ? selectedId + ' · lados reales del paño' : shortCM(model.dimensions.length) + ' × ' + shortCM(model.dimensions.width) + ' × ' + shortCM(model.dimensions.height) + ' cm · barco de ' + boatId + ' cm';
  floor.visible = !linesOn && cameraView !== 'top';
  $('#lines').setAttribute('aria-pressed', String(linesOn)); $('#colors').setAttribute('aria-pressed', String(colorsOn));
  $('#edge-labels').setAttribute('aria-pressed', String(labelsOn)); $('#isolate').setAttribute('aria-pressed', String(isolated));
  updateBoatDetails(); invalidate();
}
function chooseBoat(id, shouldFit = true) {
  comparison = id === 'both';
  if (!comparison && boats.some(boat => boat.id === id)) boatId = id;
  model = boats.find(boat => boat.id === boatId).model;
  selectedId = null; isolated = false; labelsOn = false;
  if (comparison) dimensionsOn = false;
  $('#dimensions').setAttribute('aria-pressed', String(dimensionsOn));
  updateAppearance(); fillPanelDetails(); buildAnnotations(); buildDimensions();
  if (shouldFit) fit(null, null, camera.up.toArray());
}
function buildAnnotations() {
  clearGroup(selectedLines); $('#annotations').replaceChildren(); annotationItems = [];
  const panel = selected();
  if (!panel || !labelsOn) { selectedLines.visible = false; return; }
  const points = panel.vertices.map(V), edges = [];
  for (const e of panel.edges) edges.push(V(e.a), V(e.b));
  line(selectedLines, edges);
  const center = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(3);
  for (let i = 0; i < points.length; i++) {
    const el = document.createElement('div'); el.className = 'vertex-tag'; el.textContent = 'P' + (i + 1);
    $('#annotations').append(el);
    annotationItems.push({ el, position: points[i].clone(), kind: 'vertex', center });
  }
  for (const edge of panel.edges) {
    const a = panel.vertexIds.indexOf(edge.aId) + 1, b = panel.vertexIds.indexOf(edge.bId) + 1;
    const midpoint = V(edge.a).add(V(edge.b)).multiplyScalar(.5);
    const el = document.createElement('div'); el.className = 'edge-tag'; el.textContent = 'P' + a + '–P' + b + ' · ' + cm(edge.lengthM) + ' cm';
    $('#annotations').append(el); annotationItems.push({ el, position: midpoint, kind: 'edge', center, a: V(edge.a), b: V(edge.b) });
  }
  selectedLines.visible = true;
}
function fillPanelDetails() {
  const panel = selected();
  $('#selected-info').hidden = !panel; $('#select-help').hidden = Boolean(panel);
  $('#face-panel').disabled = !panel; $('#isolate').disabled = !panel;
  $('#panel-select').value = panel?.id || '';
  if (!panel) return;
  $('#panel-code').textContent = panel.code;
  $('#panel-name').textContent = panel.name;
  $('#panel-note').textContent = panel.kind === 'rib'
    ? 'Costilla interior neta de corte, en Cartón Plast de 4 mm. Sus tres lados ya descuentan las pieles y la holgura propuesta. La base es menor que el ancho exterior de la vela.'
    : panel.kind === 'hull' ? 'Paño triangular del casco. Sus lados se calculan con el desplazamiento transversal real, además del largo y la altura.'
    : 'Cara de la vela con volumen. Su base se ajusta a la V del casco; los puntos de unión coinciden en el modelo.';
  $('#edge-table').replaceChildren(...panel.edges.map(edge => {
    const row = document.createElement('tr');
    const a = panel.vertexIds.indexOf(edge.aId) + 1, b = panel.vertexIds.indexOf(edge.bId) + 1;
    const name = document.createElement('td');
    const title = document.createElement('strong'); title.textContent = 'P' + a + '–P' + b;
    const small = document.createElement('small');
    const others = edge.panelIds.filter(id => id !== panel.id);
    small.textContent = edge.id + (others.length ? ' · con ' + others.join(', ') : panel.kind === 'sail' && ![edge.aId, edge.bId].includes('V_PUNTA') ? ' · unión al casco' : '');
    name.append(title, small); row.append(name);
    for (const value of [edge.lengthM, edge.sideProjectionM, edge.planProjectionM]) { const cell = document.createElement('td'); cell.textContent = cm(value); row.append(cell); }
    return row;
  }));
}
function select(id, showMeasures = true) {
  const owner = boats.find(boat => boat.model.panels.some(panel => panel.id === id));
  const changedBoat = owner && (comparison || owner.id !== boatId);
  if (changedBoat) chooseBoat(owner.id, false);
  selectedId = model.panels.some(panel => panel.id === id) ? id : null;
  if (!selectedId) isolated = false;
  if (selectedId && showMeasures) labelsOn = true;
  updateAppearance(); fillPanelDetails(); buildAnnotations(); buildDimensions();
  if (changedBoat) fit(null, null, camera.up.toArray());
}
function buildDimensions() {
  clearGroup(dimensionLines); $('#dimension-labels').replaceChildren(); dimensionItems = [];
  if (!dimensionsOn || comparison) return;
  const box = bounds(), a = box.min, b = box.max, size = box.getSize(new THREE.Vector3());
  const offset = Math.max(size.x, size.y, size.z) * .085;
  const spans = [
    { name: isolated ? 'Largo X' : 'Eslora', a: new THREE.Vector3(a.x, a.y - offset * .55, b.z + offset), b: new THREE.Vector3(b.x, a.y - offset * .55, b.z + offset), length: size.x, axis: 0 },
    { name: isolated ? 'Alto Y' : 'Altura', a: new THREE.Vector3(a.x - offset, a.y, b.z + offset), b: new THREE.Vector3(a.x - offset, b.y, b.z + offset), length: size.y, axis: 1 },
    { name: isolated ? 'Ancho Z' : 'Ancho', a: new THREE.Vector3(b.x + offset, a.y - offset * .2, a.z), b: new THREE.Vector3(b.x + offset, a.y - offset * .2, b.z), length: size.z, axis: 2 },
  ];
  for (const span of spans) {
    const tick = span.axis === 1 ? new THREE.Vector3(offset * .10, 0, 0) : new THREE.Vector3(0, offset * .10, 0);
    line(dimensionLines, [span.a, span.b, span.a.clone().sub(tick), span.a.clone().add(tick), span.b.clone().sub(tick), span.b.clone().add(tick)], '#a8dbe6');
    const el = document.createElement('div'); el.className = 'dimension-tag'; el.textContent = span.name + ' · ' + cm(span.length, 1) + ' cm';
    $('#dimension-labels').append(el);
    dimensionItems.push({ ...span, el, position: span.a.clone().add(span.b).multiplyScalar(.5) });
  }
  const caption = document.createElement('div'); caption.className = 'dimension-caption';
  caption.textContent = isolated ? 'Envolvente del paño seleccionado. Sus lados reales están en la tabla.' : 'Envolvente del barco. Las aristas de cada triángulo se consultan por separado.';
  $('#dimension-labels').append(caption);
}
function markCamera(name) {
  cameraView = name;
  document.querySelectorAll('[data-camera]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.camera === name)));
  $('#view-title').textContent = ({ '3d': 'VISTA 3D', side: 'VISTA LATERAL', top: 'VISTA EN PLANTA', bow: 'DESDE PROA', opposite: 'LADO OPUESTO', panel: 'PAÑO DE FRENTE' })[name] || 'GIRO LIBRE';
  updateAppearance();
}
function fit(direction = null, targetBox = null, targetUp = null, animate = true) {
  const box = targetBox || bounds(), center = box.getCenter(new THREE.Vector3());
  const dir = direction ? V(direction).normalize() : camera.position.clone().sub(controls.target).normalize();
  const upHint = targetUp ? V(targetUp) : camera.up.clone();
  let right = upHint.clone().cross(dir).normalize(); if (right.lengthSq() < .01) right = new THREE.Vector3(1, 0, 0);
  const up = dir.clone().cross(right).normalize();
  let halfW = 0, halfH = 0;
  // Fit the real pointed silhouette, rather than empty corners of its box.
  const fitPoints = (targetBox || isolated) && selected() ? selected().vertices.map(V) : visiblePoints();
  for (const value of fitPoints) {
    const p = value.clone().sub(center); halfW = Math.max(halfW, Math.abs(p.dot(right))); halfH = Math.max(halfH, Math.abs(p.dot(up)));
  }
  const aspect = host.clientWidth / Math.max(host.clientHeight, 1);
  const span = Math.max(halfH * 2, halfW * 2 / aspect, .20) * 1.35;
  const targetPosition = center.clone().addScaledVector(dir, 3);
  if (!camera.up.equals(upHint)) {
    const target = controls.target.clone(), mouseMode = controls.mouseButtons.LEFT;
    controls.dispose(); camera.up.copy(upHint);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target); controls.enableDamping = true;
    controls.minZoom = .35; controls.maxZoom = 12; controls.maxPolarAngle = Math.PI * .98;
    controls.mouseButtons.LEFT = mouseMode;
    controls.addEventListener('change', invalidate);
    controls.addEventListener('start', () => { tween = null; });
  }
  camera.zoom = 1;
  if (animate) tween = { from: camera.position.clone(), target: targetPosition, fromTarget: controls.target.clone(), center, fromSpan: camera.top * 2, span, start: performance.now() };
  else { camera.position.copy(targetPosition); controls.target.copy(center); camera.top = span / 2; camera.bottom = -span / 2; camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.updateProjectionMatrix(); controls.update(); }
  invalidate();
}
function setCameraView(name) {
  const views = { '3d': [[-1.2, .8, 1.2], [0, 1, 0]], side: [[0, 0, 1], [0, 1, 0]], top: [[0, 1, 0], [0, 0, -1]], bow: [[-1, 0, 0], [0, 1, 0]] };
  if (!views[name]) return;
  markCamera(name); fit(views[name][0], null, views[name][1]);
}
function setViewMode(mode) {
  if (mode === 'lines') linesOn = true;
  else { linesOn = false; colorsOn = mode === 'colors'; }
  updateAppearance();
}
function showPanelFace() {
  const panel = selected(); if (!panel) return;
  const normal = panel.normal ? V(panel.normal) : V(panel.vertices[1]).sub(V(panel.vertices[0])).cross(V(panel.vertices[2]).sub(V(panel.vertices[0]))).normalize();
  markCamera('panel'); fit(normal.toArray(), new THREE.Box3().setFromPoints(panel.vertices.map(V)), Math.abs(normal.y) > .98 ? [0, 0, -1] : [0, 1, 0]);
}
function projectLabels() {
  const width = host.clientWidth, height = host.clientHeight;
  for (const item of annotationItems) {
    const p = item.position.clone().project(camera), c = item.center.clone().project(camera);
    const dx = (p.x - c.x) * width * .5, dy = -(p.y - c.y) * height * .5;
    let x = (p.x * .5 + .5) * width, y = (-p.y * .5 + .5) * height;
    const halfW = (item.el.offsetWidth || 100) / 2, halfH = (item.el.offsetHeight || 24) / 2;
    if (item.kind === 'edge') {
      const a = item.a.clone().project(camera), b = item.b.clone().project(camera);
      let nx = (b.y - a.y) * height, ny = (b.x - a.x) * width;
      const length = Math.hypot(nx, ny) || 1; nx /= length; ny /= length;
      if (nx * dx + ny * dy < 0) { nx *= -1; ny *= -1; }
      const offset = Math.abs(nx) * (halfW + 14) + Math.abs(ny) * (halfH + 20);
      x += nx * offset; y += ny * offset;
    } else {
      const length = Math.hypot(dx, dy) || 1; x += dx / length * 13; y += dy / length * 13;
    }
    item.el.hidden = !labelsOn || p.z < -1 || p.z > 1;
    item.el.style.left = Math.max(halfW + 8, Math.min(width - halfW - 8, x)) + 'px';
    item.el.style.top = Math.max(halfH + 26, Math.min(height - halfH - 35, y)) + 'px';
  }
  for (const item of dimensionItems) {
    const p = item.position.clone().project(camera), a = item.a.clone().project(camera), b = item.b.clone().project(camera);
    item.el.hidden = !dimensionsOn || p.z < -1 || p.z > 1 || Math.hypot((a.x - b.x) * width, (a.y - b.y) * height) < 26;
    item.el.style.left = Math.max(65, Math.min(width - 65, (p.x * .5 + .5) * width)) + 'px';
    item.el.style.top = Math.max(48, Math.min(height - 52, (-p.y * .5 + .5) * height)) + 'px';
  }
  dimensionLines.visible = dimensionsOn;
}
function records() {
  const position = model.root.position.clone();
  model.root.position.set(0, 0, 0); model.setView('solid'); model.setSelected(null);
  model.meshes.forEach(mesh => { mesh.visible = true; }); model.root.updateMatrixWorld(true);
  const result = QuelecOBJ.collect(THREE, model.root, new THREE.Matrix4(), 'Carabela-' + boatId + 'cm');
  model.root.position.copy(position); updateAppearance(); return result;
}
exportConfig = { THREE, button: $('#export-model'), name: 'Quelec-Flotilla-Carabela-150cm', revision: 'FLOT1', getRecords: records, notes: '' };
const exporter = QuelecOBJ.install(exportConfig);
for (const boat of boats) for (const [kind, label] of [['hull', 'Casco'], ['sail', 'Vela'], ['rib', 'Costilla neta']]) {
  const group = document.createElement('optgroup'); group.label = boat.label + ' · ' + label;
  boat.model.panels.filter(panel => panel.kind === kind).forEach(panel => { const option = document.createElement('option'); option.value = panel.id; option.textContent = panel.code + ' · ' + panel.name; group.append(option); });
  $('#panel-select').append(group);
}
document.querySelectorAll('[data-boat]').forEach(button => button.onclick = () => chooseBoat(button.dataset.boat));
$('#show-rib').onclick = () => {
  if (comparison) chooseBoat(boatId, false);
  select(model.rib.id); transparency.setValue(75); setCameraView('3d');
};
$('#pdf-open').onclick = () => $('#pdf-downloads').showModal();
$('#pdf-close').onclick = () => $('#pdf-downloads').close();
$('#panel-select').onchange = () => select($('#panel-select').value);
$('#clear-selection').onclick = () => { select(null, false); labelsOn = false; buildAnnotations(); updateAppearance(); fit(); };
$('#example-edge').onclick = () => { select(model.dimensions.codePrefix + '-C01'); showPanelFace(); };
$('#face-panel').onclick = showPanelFace;
$('#isolate').onclick = () => { if (!selected()) return; isolated = !isolated; updateAppearance(); buildDimensions(); fit(); };
$('#lines').onclick = () => { linesOn = !linesOn; updateAppearance(); };
$('#colors').onclick = () => { colorsOn = !colorsOn; linesOn = false; updateAppearance(); };
$('#edge-labels').onclick = () => {
  if (!selectedId) { select(model.dimensions.codePrefix + '-C02'); return; }
  labelsOn = !labelsOn; buildAnnotations(); updateAppearance();
};
$('#dimensions').onclick = () => { if (comparison) return; dimensionsOn = !dimensionsOn; $('#dimensions').setAttribute('aria-pressed', String(dimensionsOn)); buildDimensions(); invalidate(); };
document.querySelectorAll('[data-camera]').forEach(button => button.onclick = () => setCameraView(button.dataset.camera));
$('#opposite').onclick = () => { const direction = camera.position.clone().sub(controls.target); direction.x *= -1; direction.z *= -1; markCamera('opposite'); fit(direction.toArray(), null, camera.up.toArray()); };
$('#fit').onclick = () => fit(null, null, camera.up.toArray());
$('#orbit').onclick = () => { controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; $('#orbit').setAttribute('aria-pressed', 'true'); $('#pan').setAttribute('aria-pressed', 'false'); };
$('#pan').onclick = () => { controls.mouseButtons.LEFT = THREE.MOUSE.PAN; $('#orbit').setAttribute('aria-pressed', 'false'); $('#pan').setAttribute('aria-pressed', 'true'); };
document.addEventListener('keydown', event => { if (event.target.closest('input,select,textarea,dialog,summary') || event.ctrlKey || event.metaKey || event.altKey) return; if (event.key.toLowerCase() === 'c') $('#orbit').click(); if (event.key.toLowerCase() === 'h') $('#fit').click(); });
const raycaster = new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown', event => { dragging = [event.clientX, event.clientY]; });
renderer.domElement.addEventListener('pointerup', event => {
  if (!dragging || Math.hypot(event.clientX - dragging[0], event.clientY - dragging[1]) > 5 || linesOn) return;
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1), camera);
  const hits = raycaster.intersectObjects(boats.filter(boat => boat.model.root.visible).flatMap(boat => boat.model.meshes.filter(mesh => mesh.visible)));
  if (hits.length) select(hits[0].object.userData.panelId);
});
controls.addEventListener('change', invalidate);
controls.addEventListener('start', () => { tween = null; });
function resize() {
  const width = host.clientWidth, height = Math.max(host.clientHeight, 1), aspect = width / height;
  renderer.setSize(width, height, false);
  const span = camera.top - camera.bottom; camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.updateProjectionMatrix();
  if (!lastWidth || Math.abs(lastWidth - width) > 90) fit(null, null, camera.up.toArray(), false);
  lastWidth = width; invalidate();
}
updateAppearance(); fillPanelDetails(); resize(); setCameraView('3d');
new ResizeObserver(resize).observe(host);
$('#loading').hidden = true; document.documentElement.dataset.ready = 'true';
renderer.setAnimationLoop(time => {
  if (tween) {
    const fraction = Math.max(0, Math.min(1, (time - tween.start) / 380)), k = fraction * fraction * (3 - 2 * fraction);
    camera.position.lerpVectors(tween.from, tween.target, k); controls.target.lerpVectors(tween.fromTarget, tween.center, k);
    const span = tween.fromSpan + (tween.span - tween.fromSpan) * k, aspect = host.clientWidth / Math.max(host.clientHeight, 1);
    camera.top = span / 2; camera.bottom = -span / 2; camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.updateProjectionMatrix();
    if (fraction === 1) tween = null; invalidate();
  }
  controls.update();
  camera.updateMatrixWorld(true);
  if (!needsFrame) return;
  projectLabels(); renderer.render(scene, camera); needsFrame = false;
});
window.flotilla = { get model() { return model; }, models, boats, scene, camera, renderer, get controls() { return controls; }, transparency, exporter, records, select, chooseBoat, setViewMode, setCameraView, fit, getState: () => ({ boatId, comparison, selectedId, isolated, linesOn, colorsOn, labelsOn, dimensionsOn, cameraView }) };
