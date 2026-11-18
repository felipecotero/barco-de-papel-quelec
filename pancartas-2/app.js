import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { buildPlacards, DEFAULT_DESIGNS, sheetSize, placeArtwork } from './model.js?v=PA2-03';

const $ = selector => document.querySelector(selector);
const V = a => new THREE.Vector3(...a);
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const host = $('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#182a33');
const camera = new THREE.PerspectiveCamera(35, 1, .02, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
// Supersampling keeps the paper edges smooth without MSAA leaking enclosed
// wood edges through the almost coplanar opaque print and panel surfaces.
renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Cinco carteles orgánicos de dos caras');
host.prepend(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = .25;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI * .94;
scene.add(new THREE.HemisphereLight('#eff1de', '#4b5b61', 2.8));
const key = new THREE.DirectionalLight('#fff1dc', 3.1);
key.position.set(-3.5, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: .1, far: 20 });
key.shadow.normalBias = .003;
scene.add(key);
const fill = new THREE.DirectionalLight('#c5dfee', 1.2);
fill.position.set(4, 3, -4);
scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#213740', roughness: .96 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -.006;
floor.receiveShadow = true;
scene.add(floor);

let model = null, boards = [], homes = [], selected = 0, mode = 'collection', face = 0;
let explode = 0, stage = 4, labelsOn = false, playing = false, playStart = 0;
let needsFrame = true, dimensions = null, transparency = null, exporter = null;
let tween = null, labelItems = [], textures = [], artFocused = false;
const designs = DEFAULT_DESIGNS.map(d => ({ ...d }));
const images = new Map();
const invalidate = () => { needsFrame = true; };
const stages = [null,
  ['1 · Recortar el fragmento', 'El contorno irregular se repite en los dos paneles. Las curvas son amplias y sus bordes se rematan suaves.'],
  ['2 · Fijar el mango', 'El mango y su refuerzo se anclan al panel portante. Las piezas de apoyo se alojan dentro del cartel.'],
  ['3 · Dejar espacio dentro', 'Los separadores mantienen la cámara donde caben el mango y las fijaciones. El espesor se conserva al abrir la vista.'],
  ['4 · Cerrar y vestir', 'La segunda cara tapa el montaje. El mismo dibujo aparece en ambos lados, derecho y sin espejo.'],
];
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $('#toast').classList.remove('show'), 2800);
}
function textureFor(design) {
  const im = images.get(design.artUrl || design.image || design.asset);
  if (!im) throw new Error('Falta la ilustración de ' + (design.name || design.id));
  const { width, height } = sheetSize(design.orientation);
  const canvas = document.createElement('canvas');
  const rect = placeArtwork(THREE, design, im.naturalWidth, im.naturalHeight);
  // Keep at least one texture pixel per source pixel for the lossless artwork,
  // including when rotated to a different sheet format in the viewer.
  const nativeEdge = Math.ceil(Math.max(im.naturalWidth / (rect.w * width), im.naturalHeight / (rect.h * height)));
  const edge = design.artUrl.endsWith('.png') ? Math.min(renderer.capabilities.maxTextureSize, Math.max(1600, nativeEdge)) : 1600;
  canvas.width = Math.round(edge * width);
  canvas.height = Math.round(edge * height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = rect.paperColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(im, rect.x * canvas.width, rect.y * canvas.height, rect.w * canvas.width, rect.h * canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.userData.sourceRectUV = { x: rect.x, y: rect.y, width: rect.w, height: rect.h };
  texture.userData.sourceUncropped = true;
  texture.userData.paperColor = rect.paperColor;
  textures.push(texture);
  return texture;
}
function bounds() {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const b of boards) if (b.root.visible) box.union(new THREE.Box3().setFromObject(b.root));
  return box;
}
function targetCamera(position, target) {
  tween = { from: camera.position.clone(), to: V(position), fromTarget: controls.target.clone(), target: V(target), start: performance.now() };
  invalidate();
}
function fit(direction = null, artwork = false) {
  if (!boards.length) return;
  artFocused = artwork && mode === 'single';
  let box = bounds();
  if (artFocused) {
    const board = boards[selected];
    const mesh = board.faceMeshes[face];
    const rect = mesh.userData.baseMaterial.map.userData.sourceRectUV;
    const halfWidth = board.width * rect.width / 2, halfHeight = board.height * rect.height / 2;
    box = new THREE.Box3().setFromPoints([
      mesh.localToWorld(new THREE.Vector3(-halfWidth, -halfHeight, 0)),
      mesh.localToWorld(new THREE.Vector3(halfWidth, halfHeight, 0)),
    ]);
  }
  const center = box.getCenter(new THREE.Vector3());
  const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
  const dir = direction ? V(direction).normalize() : V([face ? -.15 : .15, .035, face ? -1 : 1]).normalize();
  if (dir.lengthSq() < .01) dir.set(0, .03, face ? -1 : 1).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
  if (right.lengthSq() < .01) right.set(1, 0, 0);
  const up = dir.clone().cross(right).normalize();
  let distance = .3;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(x, y, z).sub(center), nearDepth = p.dot(dir);
    distance = Math.max(distance, nearDepth + Math.abs(p.dot(right)) / Math.tan(horizontal), nearDepth + Math.abs(p.dot(up)) / Math.tan(vertical));
  }
  distance *= artwork ? 1.08 : 1.13;
  targetCamera(center.clone().addScaledVector(dir, distance).toArray(), center.toArray());
}
function disposeModel() {
  if (!model) return;
  scene.remove(model.root);
  const geometries = new Set(), materials = new Set();
  model.root.traverse(o => {
    if (!o.isMesh) return;
    geometries.add(o.geometry);
    for (const mat of Array.isArray(o.material) ? o.material : [o.material]) materials.add(mat);
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
  textures.forEach(t => t.dispose());
  textures = [];
}
function rebuild() {
  disposeModel();
  const mapped = new Map();
  for (const d of designs) mapped.set(d.id, textureFor(d));
  model = buildPlacards(THREE, { designs, textures: mapped });
  boards = model.boards;
  // The PP shell casts the sign's shadow; the almost coplanar printed art
  // must not cast or receive its own skin's shadow as false triangle lines.
  for (const b of boards) for (const mesh of b.faceMeshes) {
    mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; mesh.material.polygonOffsetUnits = -2;
  }
  homes = boards.map(b => b.root.position.clone());
  scene.add(model.root);
  transparency?.refresh();
  update();
  dimensions?.rebuild();
}
function rebuildLabels() {
  $('#part-labels').replaceChildren();
  labelItems = [];
  if (!labelsOn || mode === 'collection') return;
  for (const group of boards[selected].groups) {
    if (!group.visible) continue;
    const el = document.createElement('div');
    el.className = 'part-label';
    el.textContent = group.userData.title || group.name.replaceAll('_', ' ');
    $('#part-labels').append(el);
    labelItems.push({ group, el });
  }
}
function update() {
  if (!model) return;
  boards.forEach((b, i) => {
    b.root.visible = mode === 'collection' || i === selected;
    b.root.position.copy(mode === 'collection' ? homes[i] : V([0, 0, 0]));
    b.setState(mode === 'collection' ? 0 : explode, mode === 'collection' ? 4 : stage, false);
  });
  const board = boards[selected], design = designs[selected];
  $('#piece-code').textContent = (board.code || design.code || board.id) + ' · DOS CARAS';
  $('#piece-title').textContent = board.name;
  $('#selected-jpg').href = design.jpgUrl || design.artUrl;
  $('#selected-jpg').textContent = '↓ Descargar «' + board.name + '» en JPG';
  $('#piece-size').textContent = Math.round(board.width * 100) + ' × ' + Math.round(board.height * 100) + ' cm · ' + (board.orientation === 'landscape' ? 'horizontal' : 'vertical');
  $('#piece-note').textContent = board.description || 'Contorno orgánico y dibujo completo, sin estirar ni recortar la ilustración.';
  $('#orientation').value = board.orientation;
  $('#orientation-note').hidden = board.orientation === DEFAULT_DESIGNS[selected].orientation;
  $('#view-name').textContent = mode === 'collection' ? 'CINCO CARTELES · CARAS ' + (face ? 'B' : 'A') : mode === 'inside' ? board.id + ' · POR DENTRO' : board.id + ' · CARA ' + (face ? 'B' : 'A');
  $('#view-measures').textContent = mode === 'collection' ? 'Cinco siluetas distintas · medidas de estudio' : Math.round(board.width * 100) + ' × ' + Math.round(board.height * 100) + ' cm · altura total ≈ ' + Math.round(board.totalHeight * 100) + ' cm';
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === mode)));
  document.querySelectorAll('[data-face]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.face === face)));
  document.querySelectorAll('[data-index]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.index === selected)));
  document.querySelectorAll('[data-stage]').forEach(b => b.classList.toggle('active', +b.dataset.stage === stage && mode !== 'collection'));
  $('#explode').value = explode;
  $('#explode-value').textContent = Math.round(explode * 100) + ' %';
  $('#explode').disabled = mode === 'collection';
  const text = mode === 'collection'
    ? ['Cinco carteles, diez caras', 'Elige uno para mirar su contorno y montaje. Voltear permite comprobar que las ilustraciones se leen derechas por los dos lados.']
    : mode === 'inside'
      ? ['Un mango oculto entre dos caras', 'La tapa posterior se aparta para ver el refuerzo y los apoyos. Los dibujos quedan por fuera; la madera no tapa ninguna de las caras.']
      : stages[stage];
  $('#stage-description').replaceChildren();
  const heading = document.createElement('h3'), p = document.createElement('p');
  heading.textContent = text[0]; p.textContent = text[1];
  $('#stage-description').append(heading, p);
  $('#play').textContent = playing ? 'Ⅱ Pausar montaje' : '▶ Ver montaje';
  rebuildLabels();
  dimensions?.rebuild();
  invalidate();
}
function setMode(next) {
  playing = false;
  mode = next;
  stage = 4;
  explode = next === 'inside' ? .55 : 0;
  update();
  fit(next === 'inside' ? [.8, .1, -1] : null);
}
function choose(index) {
  selected = clamp(index, 0, boards.length - 1);
  mode = 'single'; stage = 4; explode = 0; playing = false;
  update(); fit();
}
function setFace(value) {
  face = value ? 1 : 0;
  if (mode === 'inside') { mode = 'single'; stage = 4; explode = 0; }
  update();
  if (artFocused) fit([0, 0, face ? -1 : 1], true);
  else fit();
}
function focusIllustration() {
  mode = 'single'; playing = false; stage = 4; explode = 0;
  update();
  fit([0, 0, face ? -1 : 1], true);
}
function records() {
  const b = boards[selected];
  const position = b.root.position.clone();
  b.root.position.set(0, 0, 0); b.setState(0, 4, false);
  const result = QuelecOBJ.collect(THREE, b.root, new THREE.Matrix4(), b.id);
  b.root.position.copy(position);
  b.setState(mode === 'collection' ? 0 : explode, mode === 'collection' ? 4 : stage, false);
  return result;
}
function bind() {
  document.querySelectorAll('#catalog [data-index]').forEach(button => {
    button.onclick = () => choose(Number(button.dataset.index));
  });
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setMode(b.dataset.view));
  document.querySelectorAll('[data-face]').forEach(b => b.onclick = () => setFace(+b.dataset.face));
  document.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => {
    playing = false; mode = 'single'; stage = +b.dataset.stage; explode = 0; update(); fit();
  });
  $('#orientation').onchange = () => {
    const orientation = $('#orientation').value;
    const d = designs[selected];
    d.orientation = orientation;
    playing = false; mode = 'single'; stage = 4; explode = 0;
    rebuild(); update(); fit();
    notify('Orientación de este cartel cambiada; el dibujo conserva su proporción.');
  };
  $('#orbit').onclick = () => {
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    $('#orbit').setAttribute('aria-pressed', 'true'); $('#pan').setAttribute('aria-pressed', 'false');
  };
  $('#pan').onclick = () => {
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    $('#orbit').setAttribute('aria-pressed', 'false'); $('#pan').setAttribute('aria-pressed', 'true');
  };
  $('#fit').onclick = () => fit();
  $('#front').onclick = () => setFace(0);
  $('#back').onclick = () => setFace(1);
  $('#flip').onclick = () => setFace(1 - face);
  $('#art-focus').onclick = focusIllustration;
  $('#labels-toggle').onclick = () => { labelsOn = !labelsOn; $('#labels-toggle').setAttribute('aria-pressed', String(labelsOn)); rebuildLabels(); invalidate(); };
  $('#explode').oninput = () => { artFocused = false; playing = false; explode = +$('#explode').value; stage = 4; update(); };
  $('#play').onclick = () => {
    playing = !playing;
    if (playing) { mode = 'single'; explode = 0; stage = 1; playStart = performance.now(); face = 1; update(); fit(); }
    else update();
  };
  $('#snapshot').onclick = () => {
    renderer.render(scene, camera);
    const a = document.createElement('a'); a.download = 'Quelec-' + boards[selected].id + '-PA2-03.png'; a.href = renderer.domElement.toDataURL('image/png'); a.click();
  };
  $('#share').onclick = async () => {
    const u = new URL(location.href);
    u.searchParams.set('rev', 'PA2-03');
    u.searchParams.delete('ilustracion');
    u.hash = 'vista=' + encodeURIComponent(JSON.stringify({ v: 2, selected, mode, face, stage, explode, artFocused, labels: labelsOn, dimensions: dimensions.getState().visible, orientations: designs.map(d => d.orientation), camera: camera.position.toArray(), target: controls.target.toArray() }));
    try { await navigator.clipboard.writeText(u.href); notify('Enlace de esta vista copiado.'); }
    catch { prompt('Copia el enlace de esta vista:', u.href); }
  };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea,dialog,summary') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'c') $('#orbit').click();
    if (e.key.toLowerCase() === 'h') fit();
  });
}
function positionLabels() {
  if (!labelsOn) return;
  const r = host.getBoundingClientRect();
  for (const item of labelItems) {
    const p = new THREE.Box3().setFromObject(item.group).getCenter(new THREE.Vector3()).project(camera);
    item.el.hidden = p.z < -1 || p.z > 1;
    item.el.style.left = clamp((p.x * .5 + .5) * r.width, 85, r.width - 85) + 'px';
    item.el.style.top = clamp((-p.y * .5 + .5) * r.height, 30, r.height - 60) + 'px';
  }
}
let lastViewportWidth = 0;
function resize() {
  const refit = lastViewportWidth > 0 && Math.abs(host.clientWidth - lastViewportWidth) > 90;
  const direction = camera.position.clone().sub(controls.target).toArray();
  lastViewportWidth = host.clientWidth;
  camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
  camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight, false);
  if (refit && model) fit(direction, artFocused);
  invalidate();
}
function restore() {
  try {
    const raw = new URLSearchParams(location.hash.slice(1)).get('vista');
    if (!raw) {
      const id = new URLSearchParams(location.search).get('ilustracion');
      const index = designs.findIndex(design => design.id === id);
      if (index < 0) return false;
      selected = index;
      focusIllustration();
      return true;
    }
    const q = JSON.parse(raw);
    if (q.v !== 1 && q.v !== 2) return false;
    if (Array.isArray(q.orientations) && q.orientations.length === 5) {
      q.orientations.forEach((o, i) => {
        if (!['portrait', 'landscape'].includes(o)) return;
        // Old shared views stored the former landscape default for pencils.
        designs[i].orientation = q.v === 1 && designs[i].id === 'lapices' ? 'portrait' : o;
      }); rebuild();
    }
    selected = clamp(Math.floor(+q.selected || 0), 0, 4);
    mode = ['single', 'collection', 'inside'].includes(q.mode) ? q.mode : 'collection';
    face = q.face === 1 ? 1 : 0; stage = clamp(Math.floor(+q.stage || 4), 1, 4); explode = clamp(+q.explode || 0); labelsOn = !!q.labels;
    $('#labels-toggle').setAttribute('aria-pressed', String(labelsOn)); update();
    if (q.dimensions) dimensions.setVisible(true);
    artFocused = !!q.artFocused && mode === 'single' && stage === 4 && explode === 0;
    if (q.camera?.length === 3 && q.target?.length === 3 && [...q.camera, ...q.target].every(Number.isFinite)) {
      camera.position.fromArray(q.camera); controls.target.fromArray(q.target); tween = null; controls.update(); return true;
    }
  } catch { /* A damaged view link returns to the initial collection. */ }
  return false;
}
async function start() {
  await Promise.all(designs.map(async d => {
    const url = d.artUrl || d.image || d.asset;
    const image = await new THREE.ImageLoader().loadAsync(url);
    images.set(url, image);
  }));
  rebuild();
  transparency = QuelecSurfaceTransparency.install({ renderer, getRoot: () => model.root, isSurface: mesh => mesh.userData.surfaceTransparency === true && ['panel', 'art', 'band', 'edge'].includes(mesh.parent?.userData.type), label: 'Transparencia de las caras', container: $('#transparency'), onChange: invalidate });
  dimensions = QuelecDimensions.install({ THREE, scene, camera, viewport: host, button: $('#measure-toggle'), getBounds: bounds, isAssembled: () => mode === 'single' && stage === 4 && explode < .001, names: ['Ancho', 'Altura con mango', 'Espesor de caja'], caption: 'Medidas de estudio del cartel ensamblado. Contorno irregular; no es una plantilla de corte.', notify });
  exporter = QuelecOBJ.install({ THREE, button: $('#export-model'), name: 'Quelec-Cartel-Organico', revision: 'PA2-03', getRecords: records, notes: 'Cartel seleccionado ensamblado; ambas caras muestran la misma ilustración derecha, sin espejo. Contorno orgánico y medidas de estudio. PP, cámara, mango y fijaciones son propuestas pendientes de prototipo. Las texturas reproducen las artes de impresión. No incluye suelo, cotas ni rótulos. Formatos en metros o milímetros según elección.' });
  bind(); resize();
  new ResizeObserver(resize).observe(host);
  if (!restore()) { update(); fit(); }
  $('#loading').hidden = true;
  document.documentElement.dataset.ready = 'true';
  window.pancartas2 = { scene, camera, renderer, controls, get model() { return model; }, get boards() { return boards; }, designs, dimensions, transparency, exporter, records, choose, setMode, setFace, rebuild, getState: () => ({ selected, mode, face, explode, stage, playing, labels: labelsOn }) };
  renderer.setAnimationLoop(t => {
    controls.update();
    if (tween) {
      const k = clamp((t - tween.start) / 420), smooth = k * k * (3 - 2 * k);
      camera.position.lerpVectors(tween.from, tween.to, smooth); controls.target.lerpVectors(tween.fromTarget, tween.target, smooth);
      if (k === 1) tween = null;
      invalidate();
    }
    if (playing) {
      const n = Math.min(4, 1 + Math.floor((t - playStart) / 2400));
      if (n !== stage) { stage = n; update(); }
      if (t - playStart >= 9600) { playing = false; update(); }
    }
    if (!needsFrame) return;
    dimensions.update(); positionLabels(); renderer.render(scene, camera); needsFrame = false;
  });
}
const raycaster = new THREE.Raycaster();
let pointerStart = null;
renderer.domElement.addEventListener('pointerdown', e => { pointerStart = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!pointerStart || Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) > 5 || !model) return;
  const rect = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
  const hits = raycaster.intersectObjects(boards.filter(b => b.root.visible).map(b => b.root), true);
  const index = hits.length ? boards.findIndex(b => b.id === hits[0].object.userData.boardId) : -1;
  if (index >= 0 && (mode === 'collection' || index !== selected)) choose(index);
});
controls.addEventListener('change', invalidate);
controls.addEventListener('start', () => { tween = null; });
start().catch(error => { $('#loading').textContent = 'No se pudo abrir el visor: ' + error.message; console.error(error); });
