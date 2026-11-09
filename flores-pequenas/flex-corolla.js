import {createNestedFold} from './nested-fold.js?v=I29';

const inchesPerMeter = 1 / 0.0254;
const bottomLayerM = 0.24;
const layerPitchM = 0.018;
const foldStartM = 0.32;
const bendRadiusM = 0.058;
const pivotStationM = 0.255;
const referenceLengthM = 1.57;
const pivotHalfM = 0.033;
const shaftRadiusM = 0.022;
const boreRadiusM = 0.0225;
const capHeightM = 0.010;
const hoopRadiusM = 0.0022;
const mountZInches = 56.15;
const perimeterSamples = 160;
const tubeSides = 8;
const foldedAzimuth = -36 * Math.PI / 180;
const unfoldEnd = 0.62;
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
].map(([id, type, azimuthDeg], level) => {
  const delta = azimuthDeg * Math.PI / 180 - foldedAzimuth;
  const layerOffsetM = level * layerPitchM;
  // Cut each leaf's material stations along its offset curve so the peak
  // curvature of the folded leaf is exactly at its own first third.
  const materialStartM = foldStartM + Math.PI * bendRadiusM + layerOffsetM * Math.PI / 2
    - design[type].lengthM / 3;
  return {id, type, azimuthDeg, delta: Math.atan2(Math.sin(delta), Math.cos(delta)),
    layerOffsetM, materialStartM, localPivotM: pivotStationM - materialStartM};
});
const topLayerM = bottomLayerM + (layout.length - 1) * layerPitchM;

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

function buildVariant(THREE, specification, petal) {
  const model = createNestedFold({
    ...specification, referenceLengthM, layerOffsetM: petal.layerOffsetM, materialStartM: petal.materialStartM,
    foldStartM, minBendRadiusM: bendRadiusM, pivotStationM: petal.localPivotM, pivotHalfM,
    fabricEdgeInsetM: 0.008, hoopEnvelopeRadiusM: hoopRadiusM,
    nx: 76, ny: 12, perimeterSamples,
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

function measure(variants, centerX, centerY, nucleusBounds) {
  const collarReachM = Math.SQRT2 * pivotHalfM;
  // For a monotone turn with curvature at most 1/R, a returning arm
  // can get behind the start of the bend only after rising at least 2R.
  // The rigid central hardware ends below that return even in the lowest layer.
  const spindlePlanGapM = foldStartM - pivotStationM - collarReachM - hoopRadiusM;
  const spindleReturnGapM = 2 * bendRadiusM - (topLayerM - bottomLayerM)
    - capHeightM - hoopRadiusM;
  const layerGapM = layerPitchM - 2 * hoopRadiusM;
  const nucleusGapM = mountZInches + (bottomLayerM - hoopRadiusM) * inchesPerMeter - nucleusBounds.max[2];
  if (!(spindlePlanGapM > 0 && spindleReturnGapM > 0 && layerGapM > 0 && nucleusGapM > 0)) {
    throw new Error('El eje o los aros exceden su espacio en la pila.');
  }
  const hardwareTop = mountZInches + (topLayerM + capHeightM) * inchesPerMeter;
  const speedBound = Math.hypot(1.50, 0.70) / 2;
  const margin = (speedBound * Math.PI / perimeterSamples + hoopRadiusM) * inchesPerMeter;
  function empty() {
    return {
      min: [nucleusBounds.min[0], nucleusBounds.min[1], mountZInches],
      max: [nucleusBounds.max[0], nucleusBounds.max[1], Math.max(hardwareTop, nucleusBounds.max[2])],
    };
  }
  function add(box, x, y, z) {
    [x, y, z].forEach((value, axis) => {
      box.min[axis] = Math.min(box.min[axis], value - margin);
      box.max[axis] = Math.max(box.max[axis], value + margin);
    });
  }
  function pose(q, fanning) {
    const box = empty();
    for (const petal of layout) {
      const angle = foldedAzimuth + petal.delta * fanning;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      for (const [across, height, s] of variants[petal.id].model.state(q).hoop) {
        const along = s - petal.localPivotM;
        add(box, centerX + (cos * along - sin * across) * inchesPerMeter,
          centerY + (sin * along + cos * across) * inchesPerMeter,
          mountZInches + (topLayerM + height) * inchesPerMeter);
      }
    }
    return box;
  }
  const folded = pose(0, 0);
  const open = pose(1, 1);
  const sweep = empty();
  // During the unfolding phase the azimuth is fixed. Bound every
  // interpolated pose from the arc-length profile's temporal derivative.
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const box = pose(i / steps, 0);
    for (let axis = 0; axis < 3; axis++) {
      sweep.min[axis] = Math.min(sweep.min[axis], box.min[axis]);
      sweep.max[axis] = Math.max(sweep.max[axis], box.max[axis]);
    }
  }
  const motionMargin = Math.PI * (referenceLengthM + 2 * (topLayerM - bottomLayerM))
    / (2 * steps) * inchesPerMeter;
  // In the fan phase every petal is flat, and turns about the same shaft
  // within the disc swept by its farthest material point.
  const fanReach = Math.hypot(referenceLengthM - pivotStationM, .35) * inchesPerMeter + margin;
  sweep.min[0] = Math.min(sweep.min[0] - motionMargin, centerX - fanReach);
  sweep.min[1] = Math.min(sweep.min[1] - motionMargin, centerY - fanReach);
  sweep.max[0] = Math.max(sweep.max[0] + motionMargin, centerX + fanReach);
  sweep.max[1] = Math.max(sweep.max[1] + motionMargin, centerY + fanReach);
  sweep.max[2] += motionMargin;
  sweep.min[2] = mountZInches;
  return {
    folded, open, sweep, baseZ: mountZInches, mountZ: mountZInches,
    openingMinZ: mountZInches + (bottomLayerM - hoopRadiusM) * inchesPerMeter,
    foldStartM, bendCenterM: foldStartM + Math.PI * bendRadiusM,
    layerPitchM, layerGapM, spindlePlanGapM, spindleReturnGapM,
    petals: layout.map(({id, type, azimuthDeg, layerOffsetM}) => ({
      id, azimuthDeg, art: design[type].art, layerOffsetM, ...variants[id].model.design,
    })),
  };
}

function collarGeometry(THREE) {
  const shape = new THREE.Shape();
  shape.moveTo(-pivotHalfM, -pivotHalfM);
  shape.lineTo(pivotHalfM, -pivotHalfM);
  shape.lineTo(pivotHalfM, pivotHalfM);
  shape.lineTo(-pivotHalfM, pivotHalfM);
  shape.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, boreRadiusM, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  return new THREE.ExtrudeGeometry(shape, {depth: .004, bevelEnabled: false, curveSegments: 24})
    .translate(0, 0, -.002);
}

export function createFlexCorollas(THREE, units) {
  const variants = Object.fromEntries(layout.map(petal => [
    petal.id, buildVariant(THREE, design[petal.type], petal),
  ]));
  const hoopMaterial = new THREE.MeshStandardMaterial({color: 0x737d79, metalness: 0.48, roughness: 0.43, side: THREE.DoubleSide});
  const carrierMaterial = new THREE.MeshStandardMaterial({color: 0x535a52, metalness: 0.42, roughness: 0.56});
  const collar = collarGeometry(THREE);
  const stopShape = new THREE.Shape();
  stopShape.absarc(0, 0, .029, 0, Math.PI * 2, false);
  const stopBore = new THREE.Path();
  stopBore.absarc(0, 0, shaftRadiusM + .0002, 0, Math.PI * 2, true);
  stopShape.holes.push(stopBore);
  const stopGeometry = new THREE.ExtrudeGeometry(stopShape,
    {depth: .003, bevelEnabled: false, curveSegments: 24});

  function instance(unit) {
    const source = unit.corolla.children.find(mesh => mesh.geometry?.getAttribute('position').count === 902);
    if (!source) throw new Error('No se encuentra el núcleo original de la corola.');
    source.updateMatrix();
    source.geometry.computeBoundingBox();
    const sourceBounds = source.geometry.boundingBox.clone().applyMatrix4(source.matrix);
    const center = sourceBounds.getCenter(new THREE.Vector3()).add(unit.corolla.position);
    const carrier = new THREE.Group();
    carrier.name = 'Corola de cinco aros anidados con eje central';
    unit.group.add(carrier);
    const nucleus = source.clone(false);
    nucleus.name = 'Núcleo original sobre plataforma';
    nucleus.position.add(unit.corolla.position);
    nucleus.position.z += mountZInches - (sourceBounds.min.z + unit.corolla.position.z);
    const nucleusBounds = sourceBounds.translate(nucleus.position.clone().sub(source.position));
    carrier.add(nucleus);

    const flex = new THREE.Group();
    flex.name = 'Eje y cinco capas independientes';
    flex.position.set(center.x, center.y, mountZInches);
    flex.scale.setScalar(inchesPerMeter);
    carrier.add(flex);
    const shaftBottom = (nucleusBounds.max.z - mountZInches) / inchesPerMeter;
    const shaftTop = topLayerM + capHeightM;
    const shaftGeometry = new THREE.CylinderGeometry(shaftRadiusM, shaftRadiusM, shaftTop - shaftBottom, 32)
      .rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeometry, carrierMaterial);
    shaft.name = 'Eje central dentro de los ojales';
    shaft.position.z = (shaftTop + shaftBottom) / 2;
    flex.add(shaft);

    const petals = layout.map(({id, delta, layerOffsetM, localPivotM}) => {
      const turn = new THREE.Group();
      turn.name = id;
      turn.rotation.z = foldedAzimuth;
      flex.add(turn);
      const bearing = new THREE.Mesh(collar, carrierMaterial);
      bearing.name = 'Ojal de giro con taladro para el eje';
      bearing.position.z = topLayerM - layerOffsetM;
      turn.add(bearing);
      const stop = new THREE.Mesh(stopGeometry, carrierMaterial);
      stop.name = 'Apoyo axial debajo del ojal';
      stop.position.z = bearing.position.z - .005;
      flex.add(stop);

      const petal = new THREE.Group();
      petal.position.set(-localPivotM, 0, topLayerM);
      // [transverse, up, longitudinal] → CAD [longitudinal, transverse, up].
      petal.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX');
      turn.add(petal);
      const variant = variants[id];
      const cloth = new THREE.Mesh(variant.skin, variant.material);
      const hoop = new THREE.Mesh(variant.hoop, hoopMaterial);
      cloth.name = 'Paño lanceolado con ojal central';
      hoop.name = 'Aro continuo con pliegue al primer tercio';
      petal.add(cloth, hoop);
      return {id, delta, turn, cloth, hoop, bearing};
    });

    unit.corolla.visible = false;
    return {carrier, petals, centerX: center.x, centerY: center.y,
      nucleusBounds: {min: nucleusBounds.min.toArray(), max: nucleusBounds.max.toArray()}};
  }

  const corollas = units.map(instance);
  const first = corollas[0];
  const data = Object.freeze(measure(variants, first.centerX, first.centerY, first.nucleusBounds));
  let lastBend = 0;
  let lastFan = 0;
  function setOpening(value) {
    const opening = THREE.MathUtils.clamp(value, 0, 1);
    const bend = THREE.MathUtils.smoothstep(opening, 0, unfoldEnd);
    const fan = THREE.MathUtils.smoothstep(opening, unfoldEnd, 1);
    if (bend !== lastBend) {
      for (const variant of Object.values(variants)) variant.update(bend);
      lastBend = bend;
    }
    if (fan !== lastFan) {
      for (const unit of corollas) {
        for (const {turn, delta} of unit.petals) turn.rotation.z = foldedAzimuth + fan * delta;
      }
      lastFan = fan;
    }
    return {bend, fan};
  }

  function setLift(shiftInches) {
    for (const unit of corollas) unit.carrier.position.z = shiftInches;
  }
  const ready = Promise.all(Object.values(variants).map(variant => variant.ready));
  return {data, corollas, variants, setOpening, setLift, ready};
}
