import * as THREE from 'three';

const point = (x, y, z) => new THREE.Vector3(x, y, z);
const vertical = point(0, 1, 0);
const metal = (color, roughness = 0.48) => new THREE.MeshStandardMaterial({
  color, metalness: 0.52, roughness,
});

export function buildCinemaStage({halfX, halfZ, deckY}) {
  const group = new THREE.Group();
  group.name = 'Tarima y elevación de referencia';
  const deck = new THREE.MeshStandardMaterial({color: 0x37535a, roughness: 0.91});
  const floor = new THREE.MeshStandardMaterial({color: 0x152b32, roughness: 0.97});
  const chassis = metal(0xb79453);
  const beams = metal(0x667c82);
  const pins = metal(0xc6a267);
  const hatchDepth = 0.18;
  const stageWidth = Math.max(8, 2 * halfX + 1.2);
  const stageDepth = Math.max(4.30, 2 * halfZ + 1.2);
  const stageHalfX = stageWidth / 2;
  const stageHalfZ = stageDepth / 2;

  function slab(name, x, z, width, depth) {
    return box(group, name, [width, hatchDepth, depth], [x, deckY - hatchDepth / 2, z], deck);
  }

  const slabs = [
    slab('Tarima lateral izquierda', -(stageHalfX + halfX) / 2, 0, stageHalfX - halfX, stageDepth),
    slab('Tarima lateral derecha', (stageHalfX + halfX) / 2, 0, stageHalfX - halfX, stageDepth),
    slab('Tarima delantera', 0, -(stageHalfZ + halfZ) / 2, 2 * halfX, stageHalfZ - halfZ),
    slab('Tarima posterior', 0, (stageHalfZ + halfZ) / 2, 2 * halfX, stageHalfZ - halfZ),
  ];
  for (const x of [-stageHalfX + .15, stageHalfX - .15]) {
    for (const z of [-stageHalfZ + .15, stageHalfZ - .15]) {
      const top = deckY - hatchDepth;
      box(group, 'Apoyo de tarima', [.15, top, .15], [x, top / 2, z], beams);
    }
  }
  // Raised central strip and two 12-degree ramps as in the previous stage study.
  const rampAngle = THREE.MathUtils.degToRad(12);
  const run = (deckY - 2) / Math.tan(rampAngle);
  for (const sign of [-1, 1]) {
    const ramp = box(group, 'Rampa de referencia', [stageWidth, hatchDepth, run / Math.cos(rampAngle)],
      [0, (deckY + 2 - hatchDepth) / 2, sign * (stageHalfZ + run / 2)], deck);
    ramp.rotation.x = sign * rampAngle;
  }
  box(group, 'Piso', [26, 0.05, 26], [0, -0.025, 0], floor);
  box(group, 'Chasis esquemático', [2.48, 0.51, 1.30], [0, 0.28, 0], chassis);

  const linkCount = 5;
  const linkLength = 2.19;
  const linkBase = 0.58;
  const deckThickness = 0.13;
  const lanes = [-0.27, 0.27];
  const bars = [];
  const joints = [];
  for (const z of lanes) {
    for (let level = 0; level < linkCount; level += 1) {
      for (const direction of [-1, 1]) {
        const bar = box(group, 'Brazo de tijera', [0.096, linkLength, 0.066], [0, 0, z + direction * .052], beams);
        bars.push({bar, level, z: z + direction * .052, direction});
      }
    }
    for (let level = 0; level <= linkCount; level += 1) {
      for (const direction of [-1, 1]) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(.052, .052, .19, 16), pins);
        pin.name = 'Eje esquemático de tijera';
        pin.rotation.x = Math.PI / 2;
        group.add(pin);
        joints.push({pin, level, z, direction});
      }
    }
  }

  function update(platformY) {
    const rise = (platformY - deckThickness - linkBase) / linkCount;
    const halfSpan = Math.sqrt(linkLength ** 2 - rise ** 2) / 2;
    for (const {bar, level, z, direction} of bars) {
      bar.position.set(0, linkBase + (level + .5) * rise, z);
      bar.quaternion.setFromUnitVectors(vertical, point(-2 * direction * halfSpan, rise, 0).normalize());
    }
    for (const {pin, level, z, direction} of joints) {
      pin.position.set(direction * halfSpan, linkBase + level * rise, z);
    }
  }

  return {group, slabs, update, deckY, deckUnderside: deckY - hatchDepth};
}

export function box(group, name, dimensions, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.name = name;
  mesh.position.fromArray(position);
  group.add(mesh);
  return mesh;
}

function rod(group, name, a, b, radius, material) {
  const start = new THREE.Vector3().fromArray(a);
  const end = new THREE.Vector3().fromArray(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 12), material);
  mesh.name = name;
  mesh.position.copy(start).lerp(end, .5);
  mesh.quaternion.setFromUnitVectors(vertical, end.sub(start).normalize());
  group.add(mesh);
  return mesh;
}

export function buildCinemaCarrier({layers, supportRadius, supportTubeRadius, supportBelowRoot}) {
  const group = new THREE.Group();
  group.name = 'Bastidor de dos aros';
  const frameMaterial = metal(0x80979b);
  const trayMaterial = metal(0xa99159);
  const shoeMaterial = metal(0xc8a870);
  const moving = [];
  moving.push(box(group, 'Plataforma de referencia', [2.40, .13, 1.17], [0, -.065, 0], trayMaterial));
  for (const y of [-.45, .20]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.094, .02, 10, 112), frameMaterial);
    hoop.name = y < 0 ? 'Aro inferior' : 'Aro superior';
    hoop.position.y = y;
    hoop.rotation.x = Math.PI / 2;
    group.add(hoop);
    moving.push(hoop);
  }
  for (const x of [-.98, .98]) {
    for (const z of [-.42, .42]) {
      moving.push(rod(group, 'Montante entre aros', [x, -.45, z], [x, .20, z], .02, frameMaterial));
    }
  }
  for (const {angle, rootY} of layers) {
    const at = (distance, y) => [distance * Math.sin(angle), y, distance * Math.cos(angle)];
    const footY = .073;
    const armY = rootY - supportBelowRoot;
    moving.push(rod(group, 'Pie sobre plataforma', at(.35, 0), at(.35, footY), .016, frameMaterial));
    moving.push(rod(group, 'Puente de base', at(.03, footY), at(supportRadius, footY), supportTubeRadius, frameMaterial));
    moving.push(rod(group, 'Montante de un pétalo', at(supportRadius, footY), at(supportRadius, armY), supportTubeRadius, frameMaterial));
    moving.push(rod(group, 'Brazo de sujeción', at(supportRadius, armY), at(.024, armY), supportTubeRadius, frameMaterial));
    // A separate short root seat attaches just the base of this petal.
    moving.push(rod(group, 'Asiento de raíz', at(.026, armY), at(.026, rootY), .012, shoeMaterial));
  }
  return {group, moving};
}
