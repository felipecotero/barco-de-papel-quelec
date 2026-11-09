import { createC4DPetalMotion } from '../flor-central/c4d-petal-motion.js?v=I31';
import { createMechanism } from './mechanism.js?v=I31';

const unitsPerMeter = 1 / 0.0254;
const mountZ = 56.15;
const rootRadius = 0.22;
const baseHeight = 0.24;
const bendRadius = 0.04;
const hoopRadius = 0.0022;
const supportRadius = 0.34;
const postRadius = 0.008;
const tubeSides = 8;
const perimeterSamples = 192;
const layout = [
  { id:'labelo', angle:180, art:'FP03', length:1.50, width:0.54, color:0xa63366 },
  { id:'crema-a', angle:108, art:'FP01', length:1.40, width:0.70, color:0xe8cebb },
  { id:'cobre-a', angle:36, art:'FP02', length:1.46, width:0.62, color:0xb86328 },
  { id:'cobre-b', angle:-36, art:'FP02', length:1.46, width:0.62, color:0xb86328 },
  { id:'crema-b', angle:-108, art:'FP01', length:1.40, width:0.70, color:0xe8cebb },
];

function textureFor(THREE, spec) {
  const material = new THREE.MeshStandardMaterial({ color:spec.color, side:THREE.DoubleSide, roughness:.94 });
  const ready = typeof document === 'undefined' ? Promise.resolve() : new Promise(resolve => {
    const url = new URL(`../flor-central/artes-preview/${spec.art}.webp`, import.meta.url);
    new THREE.TextureLoader().load(url.href, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.color.set(0xffffff);
      material.map = texture;
      material.needsUpdate = true;
      resolve();
    }, undefined, resolve);
  });
  return { material, ready };
}

function createSurface(THREE, spec, bloom) {
  const profile = createC4DPetalMotion({
    lengthM:spec.length, widthM:spec.width, minBendRadiusM:bendRadius,
    foldStartM:spec.length / 3 - Math.PI * bendRadius,
    hoopEnvelopeRadiusM:hoopRadius, fabricEdgeInsetM:.008,
    nx:88, ny:12, perimeterSamples,
    ...(bloom ? { openingMode:'bloom', bloomGateM:spec.length * .71, bloomAt:.32, releaseAt:.86 } : {}),
  });
  const initial = profile.state(0);
  const cloth = new THREE.BufferGeometry();
  const uv = initial.uv.slice();
  for (let i = 0; i < uv.length; i += 2) [uv[i], uv[i + 1]] = [uv[i + 1], uv[i]];
  cloth.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  cloth.setAttribute('position', new THREE.Float32BufferAttribute(initial.positions, 3));
  cloth.setIndex(initial.indices);

  const hoop = new THREE.BufferGeometry();
  const rim = new THREE.BufferAttribute(new Float32Array(perimeterSamples * tubeSides * 3), 3);
  hoop.setAttribute('position', rim);
  const triangles = [];
  for (let i = 0; i < perimeterSamples; i++) {
    const next = (i + 1) % perimeterSamples;
    for (let side = 0; side < tubeSides; side++) {
      const other = (side + 1) % tubeSides;
      const a = i * tubeSides + side, b = i * tubeSides + other;
      const c = next * tubeSides + side, d = next * tubeSides + other;
      triangles.push(a, c, b, b, c, d);
    }
  }
  hoop.setIndex(triangles);
  const tangent = new THREE.Vector3(), previous = new THREE.Vector3();
  const normal = new THREE.Vector3(), binormal = new THREE.Vector3(), offset = new THREE.Vector3();
  const stations = Array.from({ length:perimeterSamples }, (_, i) => profile.outlineAt(i / perimeterSamples * Math.PI * 2)[0]);

  function pose(opening) {
    const state = profile.state(opening);
    const position = cloth.getAttribute('position');
    position.array.set(state.positions);
    position.needsUpdate = true;
    cloth.computeVertexNormals();
    cloth.computeBoundingSphere();
    for (let i = 0; i < perimeterSamples; i++) {
      const [x, y, z] = state.hoop[i];
      const next = state.hoop[(i + 1) % perimeterSamples];
      const before = state.hoop[(i + perimeterSamples - 1) % perimeterSamples];
      tangent.fromArray(next).sub(previous.fromArray(before)).normalize();
      normal.fromArray(state.normalAt(stations[i]));
      binormal.crossVectors(tangent, normal).normalize();
      normal.crossVectors(binormal, tangent).normalize();
      for (let side = 0; side < tubeSides; side++) {
        const angle = side / tubeSides * 2 * Math.PI;
        offset.copy(normal).multiplyScalar(hoopRadius * Math.cos(angle))
          .addScaledVector(binormal, hoopRadius * Math.sin(angle));
        rim.setXYZ(i * tubeSides + side, x + offset.x, y + offset.y, z + offset.z);
      }
    }
    rim.needsUpdate = true;
    hoop.computeVertexNormals();
    hoop.computeBoundingSphere();
  }
  pose(0);
  return { profile, cloth, hoop, pose, ...textureFor(THREE, spec) };
}

function rotatedExtents(bounds, angle, height, center, expansion) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (const across of [bounds.min[0], bounds.max[0]]) {
    for (const outward of [bounds.min[2], bounds.max[2]]) {
      const x = rootRadius + outward;
      const xy = [center.x + (x * cos - across * sin) * unitsPerMeter,
        center.y + (x * sin + across * cos) * unitsPerMeter];
      for (let i = 0; i < 2; i++) {
        min[i] = Math.min(min[i], xy[i] - expansion);
        max[i] = Math.max(max[i], xy[i] + expansion);
      }
    }
  }
  min[2] = mountZ + (height + bounds.min[1]) * unitsPerMeter - expansion;
  max[2] = mountZ + (height + bounds.max[1]) * unitsPerMeter + expansion;
  return { min, max };
}

function merge(a, b) {
  for (let i = 0; i < 3; i++) {
    a.min[i] = Math.min(a.min[i], b.min[i]);
    a.max[i] = Math.max(a.max[i], b.max[i]);
  }
}

function geometryData(center, nucleusBounds, entries, pitch) {
  const empty = () => ({ min:nucleusBounds.min.toArray(), max:nucleusBounds.max.toArray() });
  const folded = empty(), sweep = empty();
  let openingMinZ = Infinity;
  for (const { surface, angle, height, spec } of entries) {
    const pattern = surface.profile.envelope;
    const expansion = hoopRadius * unitsPerMeter;
    const fold = rotatedExtents(pattern.folded, angle, height, center, expansion);
    const travel = rotatedExtents(pattern.sweep, angle, height, center, expansion);
    merge(folded, fold);
    merge(sweep, travel);
    openingMinZ = Math.min(openingMinZ, travel.min[2]);
  }
  const reach = (supportRadius + postRadius + .003) * unitsPerMeter;
  const supports = { min:[center.x - reach, center.y - reach, mountZ],
    max:[center.x + reach, center.y + reach, mountZ + entries.at(-1).height * unitsPerMeter] };
  merge(folded, supports);
  merge(sweep, supports);
  return {
    folded, sweep, mountZ, openingMinZ, layerPitchM:pitch,
    petals:entries.map(({ spec, height, surface }) => ({
      id:spec.id, art:spec.art, azimuthDeg:spec.angle, heightM:height,
      lengthM:spec.length, widthM:spec.width,
      foldCenterM:surface.profile.config.foldStartM + Math.PI * bendRadius,
    })),
  };
}

function addSupport(THREE, radial, height, material) {
  const add = (name, geometry, x, z) => {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.position.set(x, 0, z);
    radial.add(part);
  };
  const armDepth = .012;
  const armTop = height - .008;
  const armBottom = armTop - armDepth;
  const floor = .012;
  const postHeight = armBottom - floor;
  const footStart = .074;
  const footEnd = supportRadius + postRadius;
  add('Pie radial de apoyo', new THREE.BoxGeometry(footEnd - footStart, .018, floor),
    (footStart + footEnd) / 2, floor / 2);
  add('Montante fuera del paso de los paños', new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16).rotateX(Math.PI / 2),
    supportRadius, floor + postHeight / 2);
  add('Brazo bajo la raíz', new THREE.BoxGeometry(supportRadius - rootRadius + postRadius, .014, armDepth),
    (rootRadius + supportRadius + postRadius) / 2, armBottom + armDepth / 2);
  const saddleHeight = .008 - hoopRadius;
  add('Asiento del aro en la raíz', new THREE.BoxGeometry(.018, .022, saddleHeight),
    rootRadius + .003, armTop + saddleHeight / 2);
}

function createReferenceCorollas(THREE, units, bloom) {
  const surfaces = new Map();
  for (const spec of layout) if (!surfaces.has(spec.art)) surfaces.set(spec.art, createSurface(THREE, spec, bloom));
  const profiles = [...surfaces.values()].map(surface => surface.profile);
  const phaseProfile = profiles[0];
  const envelopeWidth = Math.max(...[...surfaces.values()].map(({ profile }) =>
    Math.max(profile.envelope.foldHeightM, -profile.envelope.open.min[1])));
  // All petals share one phase. While rolling they stay above their plane;
  // during terminal fall they stay below it. These simultaneous height slabs
  // are disjoint, even where two petals overlap in plan.
  const pitch = Math.ceil((envelopeWidth + 2 * hoopRadius + .012) / .005) * .005;
  const entries = layout.map((spec, i) => ({
    spec, surface:surfaces.get(spec.art), angle:spec.angle * Math.PI / 180, height:baseHeight + pitch * i,
  }));
  const hoopMaterial = new THREE.MeshStandardMaterial({ color:0x83918c, metalness:.46, roughness:.51 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color:0x535a52, metalness:.42, roughness:.56 });
  const carriers = [];
  let data;
  for (const unit of units) {
    const source = unit.corolla.children.find(child => child.geometry?.getAttribute('position').count === 902);
    if (!source) throw new Error('Falta el núcleo de referencia de la flor.');
    source.updateMatrix();
    source.geometry.computeBoundingBox();
    const sourceBounds = source.geometry.boundingBox.clone().applyMatrix4(source.matrix);
    const center = sourceBounds.getCenter(new THREE.Vector3()).add(unit.corolla.position);
    const carrier = new THREE.Group();
    carrier.name = 'Cinco pétalos en niveles radiales I30';
    unit.group.add(carrier);
    carriers.push(carrier);

    const nucleus = source.clone(false);
    nucleus.name = 'Núcleo original sobre plataforma';
    nucleus.position.add(unit.corolla.position);
    nucleus.position.z += mountZ - (sourceBounds.min.z + unit.corolla.position.z);
    const nucleusBounds = sourceBounds.translate(nucleus.position.clone().sub(source.position));
    carrier.add(nucleus);

    const axes = new THREE.Group();
    axes.name = 'Rumbos fijos de los pétalos';
    axes.position.set(center.x, center.y, mountZ);
    axes.scale.setScalar(unitsPerMeter);
    carrier.add(axes);
    for (const { spec, angle, height, surface } of entries) {
      const radial = new THREE.Group();
      radial.name = spec.id;
      radial.rotation.z = angle;
      axes.add(radial);
      addSupport(THREE, radial, height, supportMaterial);
      const leaf = new THREE.Group();
      leaf.position.set(rootRadius, 0, height);
      // [transverse, vertical, longitudinal] → CAD [longitudinal, transverse, vertical].
      leaf.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX');
      radial.add(leaf);
      const cloth = new THREE.Mesh(surface.cloth, surface.material);
      cloth.name = 'Paño lanceolado continuo I30';
      const hoop = new THREE.Mesh(surface.hoop, hoopMaterial);
      hoop.name = 'Aro flex continuo I30';
      leaf.add(cloth, hoop);
    }
    data ??= geometryData(center, nucleusBounds, entries, pitch);
  }
  if (bloom) {
    // In the uplift phase only distal material moves. Its radial distance is
    // bounded below, so the projected transverse distance from any adjacent
    // petal exceeds that petal's maximum width. Opposite directions lie behind
    // the other petal's fixed root, outside its positive radial footprint.
    const radialFloor = rootRadius + Math.min(...profiles.map(profile => profile.envelope.bloomMinimumOutwardM)) - hoopRadius;
    const halfWidth = Math.max(...layout.map(spec => spec.width / 2)) + hoopRadius;
    const halfSector = Math.atan2(halfWidth, radialFloor);
    const sideGap = radialFloor * Math.sin(2 * Math.PI / 5 - halfSector) - halfWidth;
    if (!(halfSector < Math.PI / 5 && sideGap > 0)) {
      throw new Error('El tramo que sube invade el sector de otro pétalo.');
    }
    data.peakOpening = phaseProfile.envelope.bloomVerticalAt;
    data.upliftSectorGapM = sideGap;
    data.upliftRadialFloorM = radialFloor;
  }
  let opening = 0;
  return {
    data,
    ready:Promise.all([...surfaces.values()].map(surface => surface.ready)),
    setOpening(next) {
      if (next !== opening) {
        for (const surface of surfaces.values()) surface.pose(next);
        opening = next;
      }
      return { bend:opening, fan:0 };
    },
    setLift(shift) { for (const carrier of carriers) carrier.position.z = shift; },
    describePhase(p) {
      if (p === 0) return 'Pétalos plegados · salida de la caja';
      if (bloom) {
        if (p < phaseProfile.config.bloomAt) return 'Avanza la U en cada pétalo';
        if (p <= data.peakOpening + 1e-8) return 'Las puntas se levantan';
        if (p < phaseProfile.config.releaseAt) return 'Los pétalos abren hacia afuera';
        return 'Caída suave de las puntas';
      }
      return p < .8 ? 'Cada pétalo se desdobla hacia su lado' : 'Caída suave de las puntas';
    },
  };
}

export function createC4DMechanism(THREE, root, { bloom = false } = {}) {
  return createMechanism(THREE, root, (Three, units) => createReferenceCorollas(Three, units, bloom));
}
