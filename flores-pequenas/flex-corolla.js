import {createUFoldPetal} from '../flor-central/ufold-geometry.js';

const inchesPerMeter = 1 / 0.0254;
const rootRadiusM = 0.36;
const rootHeightM = 0.06;
const hoopRadiusM = 0.0022;
const flangeApothemM = 0.071;
const flangeBoreRadiusM = 0.051;
const armTopM = -0.005;
const mountZInches = 56.15;
const perimeterSamples = 128;
const tubeSides = 8;
const design = {
  labelo: {art: 'FP03', fallback: 0xa63366, lengthM: 0.75, widthM: 0.54, minBendRadiusM: 0.09},
  copper: {art: 'FP02', fallback: 0xb86328, lengthM: 0.73, widthM: 0.62, minBendRadiusM: 0.09},
  cream: {art: 'FP01', fallback: 0xe8cebb, lengthM: 0.70, widthM: 0.78, minBendRadiusM: 0.095},
};
const layout = [
  ['labelo', 'labelo', 180],
  ['cream-a', 'cream', 108],
  ['copper-a', 'copper', 36],
  ['copper-b', 'copper', -36],
  ['cream-b', 'cream', -108],
].map(([id, type, azimuthDeg]) => ({id, type, azimuthDeg, azimuth: azimuthDeg * Math.PI / 180}));

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
  const model = createUFoldPetal({
    ...specification, openCurvaturePerM: 0, fabricEdgeInsetM: 0.005,
    hoopEnvelopeRadiusM: hoopRadiusM, nx: 38, ny: 12, perimeterSamples,
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

function measure(variants, centerX, centerY, rootZ, nucleusBounds) {
  function empty() {
    return {min: nucleusBounds.min.slice(), max: nucleusBounds.max.slice()};
  }
  function add(box, axis, value, radius = 0) {
    box.min[axis] = Math.min(box.min[axis], value - radius);
    box.max[axis] = Math.max(box.max[axis], value + radius);
  }
  function pose(q) {
    const box = empty();
    const states = Object.fromEntries(Object.entries(variants).map(([type, variant]) => [type, variant.model.state(q)]));
    // For horizontal footprint the derivative with respect to ellipse angle
    // is bounded by max(L,W)/2. Include the unsampled interval and tube radius.
    const planMarginInches = (0.78 * Math.PI / (2 * perimeterSamples) + hoopRadiusM) * inchesPerMeter;
    for (const {type, azimuth} of layout) {
      const sin = Math.sin(azimuth);
      const cos = Math.cos(azimuth);
      for (const [across, height, length] of states[type].hoop) {
        const outward = rootRadiusM + length;
        add(box, 0, centerX + (cos * outward - sin * across) * inchesPerMeter, planMarginInches);
        add(box, 1, centerY + (sin * outward + cos * across) * inchesPerMeter, planMarginInches);
        add(box, 2, rootZ + height * inchesPerMeter, hoopRadiusM * inchesPerMeter);
      }
    }
    return box;
  }
  const folded = pose(0);
  const open = pose(1);
  const sweep = empty();
  // For a fixed material point the outward distance is nondecreasing in q,
  // because 0 <= its tangent angle <= pi and that angle falls with q.
  for (let axis = 0; axis < 3; axis += 1) {
    sweep.min[axis] = Math.min(folded.min[axis], open.min[axis]);
    sweep.max[axis] = Math.max(folded.max[axis], open.max[axis]);
  }
  const steps = 64;
  for (let i = 1; i < steps; i += 1) sweep.max[2] = Math.max(sweep.max[2], pose(i / steps).max[2]);
  // Height can peak mid-opening. |d height / d q| <= pi L; add the
  // half-step of this sweep and the unsampled ellipse interval.
  sweep.max[2] += (Math.PI * 0.75 / (2 * steps) + Math.PI * 0.78 / (2 * perimeterSamples)) * inchesPerMeter;
  folded.max[2] += Math.PI * 0.78 / (2 * perimeterSamples) * inchesPerMeter;

  let maximumAngle = 0;
  const sectorSteps = 1024;
  for (const {model} of Object.values(variants)) {
    const state = model.state(0);
    for (let i = 0; i <= sectorSteps; i += 1) {
      const [s, width] = model.outlineAt(i * Math.PI / sectorSteps);
      const radius = rootRadiusM + state.sectionAt(s).point[0];
      maximumAngle = Math.max(maximumAngle, Math.atan2(Math.abs(width), radius));
    }
  }
  // Add the hoop radius and a derivative bound for the unmeasured half-step
  // of the polar angle. q=0 is the widest azimuth for each material point.
  maximumAngle += Math.asin(hoopRadiusM / rootRadiusM)
    + 0.78 / (2 * rootRadiusM) * Math.PI / (2 * sectorSteps);
  return {
    folded, open, sweep, baseZ: sweep.min[2], mountZ: mountZInches,
    rootRadiusM, unitsPerMeter: inchesPerMeter,
    maxSectorHalfDeg: maximumAngle * 180 / Math.PI,
    sectorMarginDeg: 36 - maximumAngle * 180 / Math.PI,
    petals: layout.map(({id, type, azimuthDeg}) => ({
      id, azimuthDeg, art: design[type].art, ...variants[type].model.design,
      minBendRadiusM: variants[type].model.config.minBendRadiusM,
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
    const corner = azimuth + Math.PI / 5;
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
  const carrierArmGeometry = new THREE.BoxGeometry(rootRadiusM - flangeApothemM, 0.024, 0.020);
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
    const rootZ = plateTopZ + rootHeightM * inchesPerMeter;

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
    flex.position.set(center.x, center.y, rootZ);
    flex.scale.setScalar(inchesPerMeter);
    carrier.add(flex);
    const flange = new THREE.Mesh(flangeGeometry, carrierMaterial);
    flange.name = 'Collar central con hueco alrededor del núcleo';
    flange.position.z = -rootHeightM;
    flex.add(flange);

    const petals = layout.map(({id, type, azimuth}) => {
      const radial = new THREE.Group();
      radial.name = id;
      radial.rotation.z = azimuth;
      flex.add(radial);

      const carrierArm = new THREE.Mesh(carrierArmGeometry, carrierMaterial);
      carrierArm.name = 'Brazo radial bajo la raíz';
      carrierArm.position.set((flangeApothemM + rootRadiusM) / 2, 0, armTopM - 0.010);
      radial.add(carrierArm);
      const collar = new THREE.Mesh(saddleGeometry, carrierMaterial);
      collar.name = 'Silla tangente bajo la raíz del aro';
      collar.position.set(rootRadiusM - 0.004, 0, armTopM + saddleHeightM / 2);
      radial.add(collar);

      const group = new THREE.Group();
      group.position.x = rootRadiusM;
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
      return {id, type, group, cloth, hoop, collar, carrierArm};
    });

    unit.corolla.visible = false;
    return {carrier, flex, nucleus, petals, centerX: center.x, centerY: center.y, rootZ,
      nucleusBounds: {min: nucleusBounds.min.toArray(), max: nucleusBounds.max.toArray()}};
  }

  const corollas = units.map(instance);
  const first = corollas[0];
  const data = Object.freeze(measure(variants, first.centerX, first.centerY, first.rootZ, first.nucleusBounds));
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
