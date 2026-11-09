import {createLanceolatePetal} from './lanceolate-petal.js?v=I28.1';

const inchesPerMeter = 1 / 0.0254;
const oldRootRadiusM = 0.36;
const rootHeightM = 0.24;
const layerPitchM = 0.018;
const postRadiusM = 0.006;
const postReachM = 0.68;
const footDepthM = 0.018;
const armDepthM = 0.006;
const hoopRadiusM = 0.0022;
const flangeApothemM = 0.071;
const flangeBoreRadiusM = 0.051;
const armTopM = -0.0045;
const mountZInches = 56.15;
const perimeterSamples = 128;
const tubeSides = 8;
const design = {
  labelo: {art: 'FP03', fallback: 0xa63366, lengthM: 1.50, widthM: 0.54},
  copper: {art: 'FP02', fallback: 0xb86328, lengthM: 1.46, widthM: 0.62},
  cream: {art: 'FP01', fallback: 0xe8cebb, lengthM: 1.40, widthM: 0.70},
};
const layout = [
  ['labelo', 'labelo', 180],
  ['cream-a', 'cream', 108],
  ['copper-a', 'copper', 36],
  ['copper-b', 'copper', -36],
  ['cream-b', 'cream', -108],
].map(([id, type, azimuthDeg], level) => ({
  id, type, azimuthDeg, azimuth: azimuthDeg * Math.PI / 180,
  heightM: rootHeightM + level * layerPitchM,
  rootM: oldRootRadiusM - design[type].lengthM / 2,
}));

function materialFor(THREE, specification) {
  const material = new THREE.MeshStandardMaterial({
    color: specification.fallback, side: THREE.DoubleSide, roughness: 0.94, metalness: 0,
  });
  const ready = typeof document === 'undefined' ? Promise.resolve() : new Promise(resolve => {
    const path = new URL('../flor-central/artes-preview/' + specification.art + '.webp', import.meta.url);
    new THREE.TextureLoader().load(path.href, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.color.set(0xffffff);
      material.map = texture;
      material.needsUpdate = true;
      resolve();
    }, undefined, resolve);
  });
  return {material, ready};
}

function buildVariant(THREE, specification) {
  const model = createLanceolatePetal({
    ...specification, foldStartM: specification.lengthM * 0.71, minBendRadiusM: 0.06,
    openCurvaturePerM: 0, fabricEdgeInsetM: 0.008,
    hoopEnvelopeRadiusM: hoopRadiusM, nx: 76, ny: 12, perimeterSamples,
  });
  const original = model.state(0);
  const skin = new THREE.BufferGeometry();
  const uv = original.uv.slice();
  for (let i = 0; i < uv.length; i += 2) [uv[i], uv[i + 1]] = [uv[i + 1], uv[i]];
  skin.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  skin.setAttribute('position', new THREE.Float32BufferAttribute(original.positions, 3));
  skin.setIndex(original.indices);

  const hoop = new THREE.BufferGeometry();
  hoop.setAttribute('position', new THREE.BufferAttribute(new Float32Array(perimeterSamples * tubeSides * 3), 3));
  const tubeIndices = [];
  for (let i = 0; i < perimeterSamples; i += 1) {
    const next = (i + 1) % perimeterSamples;
    for (let j = 0; j < tubeSides; j += 1) {
      const nextSide = (j + 1) % tubeSides;
      const a = i * tubeSides + j;
      const b = i * tubeSides + nextSide;
      const c = next * tubeSides + j;
      const d = next * tubeSides + nextSide;
      tubeIndices.push(a, c, b, b, c, d);
    }
  }
  hoop.setIndex(tubeIndices);
  const tangent = new THREE.Vector3();
  const previous = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const rim = hoop.getAttribute('position');

  function update(opening) {
    const state = model.state(opening);
    skin.getAttribute('position').array.set(state.positions);
    skin.getAttribute('position').needsUpdate = true;
    skin.computeVertexNormals();
    skin.computeBoundingBox();
    skin.computeBoundingSphere();
    for (let i = 0; i < perimeterSamples; i += 1) {
      const before = state.hoop[(i + perimeterSamples - 1) % perimeterSamples];
      const after = state.hoop[(i + 1) % perimeterSamples];
      tangent.fromArray(after).sub(previous.fromArray(before)).normalize();
      const station = model.outlineAt(i / perimeterSamples * 2 * Math.PI)[0];
      normal.fromArray(state.normalAt(station));
      binormal.crossVectors(tangent, normal).normalize();
      normal.crossVectors(binormal, tangent).normalize();
      const [x, y, z] = state.hoop[i];
      for (let side = 0; side < tubeSides; side += 1) {
        const angle = side / tubeSides * 2 * Math.PI;
        offset.copy(normal).multiplyScalar(hoopRadiusM * Math.cos(angle))
          .addScaledVector(binormal, hoopRadiusM * Math.sin(angle));
        rim.setXYZ(i * tubeSides + side, x + offset.x, y + offset.y, z + offset.z);
      }
    }
    rim.needsUpdate = true;
    hoop.computeVertexNormals();
    hoop.computeBoundingBox();
    hoop.computeBoundingSphere();
  }

  update(0);
  return {model, skin, hoop, ...materialFor(THREE, specification), update};
}

// Outside the shared flat center each petal is confined to its own wedge.
// Within the center all overlapping material stays on fixed, staggered planes.
function measureSeparation(variants) {
  const halfSector = 34.5 * Math.PI / 180;
  const steps = 2048;
  let sharedDiskM = 0;
  let curvedNearM = Infinity;
  let curvedSectorGapM = Infinity;
  for (const {type, rootM} of layout) {
    const model = variants[type].model;
    const {lengthM, widthM, foldStartM} = model.config;
    const state = model.state(0);
    const shoulder = Math.acos(1 - 2 * foldStartM / lengthM);
    const sampleMargin = Math.hypot(lengthM, widthM) * Math.PI / (4 * steps);
    for (const [start, end, curved] of [[0, shoulder, false], [shoulder, Math.PI, true]]) {
      for (let i = 0; i <= steps; i++) {
        const angle = start + (end - start) * i / steps;
        const [s, width] = model.outlineAt(angle);
        const radial = rootM + state.sectionAt(s).point[0];
        const sideDistance = radial * Math.sin(halfSector) - Math.abs(width) * Math.cos(halfSector);
        const margin = sampleMargin + hoopRadiusM;
        if (curved) {
          curvedNearM = Math.min(curvedNearM, radial - margin);
          curvedSectorGapM = Math.min(curvedSectorGapM, sideDistance - margin);
        } else if (sideDistance <= margin) {
          sharedDiskM = Math.max(sharedDiskM, Math.hypot(radial, width) + margin);
        }
      }
    }
  }
  const sharedLayerGapM = layerPitchM - 2 * hoopRadiusM;
  const lowerSupportGapM = layerPitchM + armTopM - armDepthM - hoopRadiusM;
  const postSectorGapM = postReachM * Math.sin(Math.PI / 5 - halfSector) - postRadiusM;
  const returnArmSectorGapM = Math.min(...layout.map(p => -p.rootM))
    * Math.sin(Math.PI / 5 - halfSector) - .006;
  if (!(curvedNearM > sharedDiskM && curvedSectorGapM > 0 && sharedLayerGapM > 0
      && lowerSupportGapM > 0 && postReachM - postRadiusM > sharedDiskM
      && postSectorGapM > 0 && returnArmSectorGapM > 0)) {
    throw new Error('El contorno propuesto excede el espacio de las capas y los aros.');
  }
  return {sharedDiskM, curvedNearM, curvedSectorGapM, sharedLayerGapM,
    lowerSupportGapM, postSectorGapM, returnArmSectorGapM};
}

function measure(variants, centerX, centerY, nucleusBounds) {
  const supportReach = (postReachM + postRadiusM) * inchesPerMeter;
  const supportTop = mountZInches + (rootHeightM + layerPitchM * (layout.length - 1)) * inchesPerMeter;
  function empty() {
    return {
      min: [Math.min(nucleusBounds.min[0], centerX - supportReach),
        Math.min(nucleusBounds.min[1], centerY - supportReach), mountZInches],
      max: [Math.max(nucleusBounds.max[0], centerX + supportReach),
        Math.max(nucleusBounds.max[1], centerY + supportReach), Math.max(supportTop, nucleusBounds.max[2])],
    };
  }
  function add(box, axis, value, radius) {
    box.min[axis] = Math.min(box.min[axis], value - radius);
    box.max[axis] = Math.max(box.max[axis], value + radius);
  }
  const speed = Math.hypot(1.50, 0.70) / 2;
  const margin = (speed * Math.PI / perimeterSamples + hoopRadiusM) * inchesPerMeter;
  function pose(q) {
    const box = empty();
    const states = Object.fromEntries(Object.entries(variants).map(([type, variant]) => [type, variant.model.state(q)]));
    for (const {type, azimuth, rootM, heightM} of layout) {
      const sin = Math.sin(azimuth), cos = Math.cos(azimuth);
      for (const [across, height, length] of states[type].hoop) {
        const outward = rootM + length;
        add(box, 0, centerX + (cos * outward - sin * across) * inchesPerMeter, margin);
        add(box, 1, centerY + (sin * outward + cos * across) * inchesPerMeter, margin);
        add(box, 2, mountZInches + (heightM + height) * inchesPerMeter, margin);
      }
    }
    return box;
  }
  const folded = pose(0);
  const open = pose(1);
  const sweep = empty();
  // At a fixed material point the horizontal directrix coordinate increases
  // monotonically as the fold angle relaxes from pi to zero.
  for (let axis = 0; axis < 3; axis++) {
    sweep.min[axis] = Math.min(folded.min[axis], open.min[axis]);
    sweep.max[axis] = Math.max(folded.max[axis], open.max[axis]);
  }
  const steps = 64;
  for (let i = 1; i < steps; i++) sweep.max[2] = Math.max(sweep.max[2], pose(i / steps).max[2]);
  sweep.max[2] += Math.PI * 1.50 / (2 * steps) * inchesPerMeter;

  const nucleusGapM = (mountZInches + rootHeightM * inchesPerMeter - nucleusBounds.max[2]) / inchesPerMeter - hoopRadiusM;
  if (nucleusGapM <= 0) throw new Error('El núcleo toca la capa inferior.');
  return {
    folded, open, sweep, baseZ: sweep.min[2], mountZ: mountZInches,
    layerPitchM, nucleusGapM, ...measureSeparation(variants),
    petals: layout.map(({id, type, azimuthDeg, rootM, heightM}) => ({
      id, azimuthDeg, art: design[type].art, rootM, heightM, ...variants[type].model.design,
    })),
  };
}

export function createFlexCorollas(THREE, units) {
  const variants = Object.fromEntries(Object.entries(design).map(([type, specification]) => [type, buildVariant(THREE, specification)]));
  const hoopMaterial = new THREE.MeshStandardMaterial({color: 0x737d79, metalness: 0.48, roughness: 0.43, side: THREE.DoubleSide});
  const carrierMaterial = new THREE.MeshStandardMaterial({color: 0x535a52, metalness: 0.42, roughness: 0.56});
  const flangeShape = new THREE.Shape();
  const flangeVertexRadius = flangeApothemM / Math.cos(Math.PI / 5);
  for (const [index, {azimuth}] of [...layout].reverse().entries()) {
    const corner = azimuth + Math.PI + Math.PI / 5;
    const x = flangeVertexRadius * Math.cos(corner);
    const y = flangeVertexRadius * Math.sin(corner);
    if (index === 0) flangeShape.moveTo(x, y);
    else flangeShape.lineTo(x, y);
  }
  flangeShape.closePath();
  const flangeHole = new THREE.Path();
  flangeHole.absarc(0, 0, flangeBoreRadiusM, 0, 2 * Math.PI, true);
  flangeShape.holes.push(flangeHole);
  const flangeGeometry = new THREE.ExtrudeGeometry(flangeShape, {depth: 0.052, bevelEnabled: false, curveSegments: 48});
  const footGeometry = new THREE.BoxGeometry(postReachM - flangeApothemM + postRadiusM, .022, footDepthM);
  const saddleHeightM = -hoopRadiusM - armTopM;
  const saddleGeometry = new THREE.BoxGeometry(0.016, 0.022, saddleHeightM);

  function instance(unit) {
    const source = unit.corolla.children.find(mesh => mesh.geometry?.getAttribute('position').count === 902);
    if (!source) throw new Error('No se encuentra el núcleo original de la corola.');
    source.updateMatrix();
    source.geometry.computeBoundingBox();
    const sourceBounds = source.geometry.boundingBox.clone().applyMatrix4(source.matrix);
    const center = sourceBounds.getCenter(new THREE.Vector3()).add(unit.corolla.position);
    const plateTopZ = mountZInches;

    const carrier = new THREE.Group();
    carrier.name = 'Corola de estudio con cinco aros flex';
    unit.group.add(carrier);
    const nucleus = source.clone(false);
    nucleus.name = 'Núcleo original sobre plataforma';
    nucleus.position.add(unit.corolla.position);
    nucleus.position.z += plateTopZ - (sourceBounds.min.z + unit.corolla.position.z);
    const nucleusBounds = sourceBounds.translate(nucleus.position.clone().sub(source.position));
    carrier.add(nucleus);

    const flex = new THREE.Group();
    flex.name = 'Portacorolas radial con un paño por pétalo';
    flex.position.set(center.x, center.y, plateTopZ);
    flex.scale.setScalar(inchesPerMeter);
    carrier.add(flex);
    const flange = new THREE.Mesh(flangeGeometry, carrierMaterial);
    flange.name = 'Collar central con hueco alrededor del núcleo';
    flex.add(flange);

    const petals = layout.map(({id, type, azimuth, rootM, heightM}) => {
      const radial = new THREE.Group();
      radial.name = id;
      radial.rotation.z = azimuth;
      flex.add(radial);

      const foot = new THREE.Mesh(footGeometry, carrierMaterial);
      foot.name = 'Base radial del soporte de capa';
      foot.position.set(-(flangeApothemM + postReachM + postRadiusM) / 2, 0, footDepthM / 2);
      radial.add(foot);
      const topZ = heightM + armTopM;
      const postGeometry = new THREE.CylinderGeometry(postRadiusM, postRadiusM, topZ - footDepthM, 16).rotateX(Math.PI / 2);
      const post = new THREE.Mesh(postGeometry, carrierMaterial);
      post.name = 'Montante exterior a los pétalos';
      post.position.set(-postReachM, 0, (topZ + footDepthM) / 2);
      radial.add(post);
      const armLength = postReachM - postRadiusM + rootM;
      const carrierArm = new THREE.Mesh(new THREE.BoxGeometry(armLength, .012, armDepthM), carrierMaterial);
      carrierArm.name = 'Soporte horizontal de capa';
      carrierArm.position.set((rootM - postReachM + postRadiusM) / 2, 0, topZ - armDepthM / 2);
      radial.add(carrierArm);
      const collar = new THREE.Mesh(saddleGeometry, carrierMaterial);
      collar.name = 'Silla tangente bajo la raíz del aro';
      collar.position.set(rootM - 0.004, 0, topZ + saddleHeightM / 2);
      radial.add(collar);

      const group = new THREE.Group();
      group.position.set(rootM, 0, heightM);
      // F06 [across, up, outward] → CAD [outward, across, up].
      group.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX');
      radial.add(group);
      const variant = variants[type];
      const cloth = new THREE.Mesh(variant.skin, variant.material);
      const hoop = new THREE.Mesh(variant.hoop, hoopMaterial);
      cloth.name = 'Paño continuo sin estiramiento';
      hoop.name = 'Aro continuo sin bisagras';
      cloth.castShadow = cloth.receiveShadow = hoop.castShadow = true;
      group.add(cloth, hoop);
      return {id, type, group, cloth, hoop, collar, carrierArm, post, foot};
    });

    unit.corolla.visible = false;
    return {carrier, flex, nucleus, petals, centerX: center.x, centerY: center.y,
      nucleusBounds: {min: nucleusBounds.min.toArray(), max: nucleusBounds.max.toArray()}};
  }

  const corollas = units.map(instance);
  const first = corollas[0];
  const data = Object.freeze(measure(variants, first.centerX, first.centerY, first.nucleusBounds));
  let currentOpening = 0;
  function setOpening(value) {
    if (!Number.isFinite(value)) return currentOpening;
    const opening = Math.max(0, Math.min(1, value));
    if (opening === currentOpening) return currentOpening;
    for (const variant of Object.values(variants)) variant.update(opening);
    currentOpening = opening;
    return opening;
  }

  function setLift(shiftInches) {
    if (!Number.isFinite(shiftInches)) return;
    for (const unit of corollas) unit.carrier.position.z = shiftInches;
  }
  const ready = Promise.all(Object.values(variants).map(variant => variant.ready));
  return {data, corollas, variants, setOpening, setLift, ready};
}
