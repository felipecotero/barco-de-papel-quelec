import { createFlexCorollas } from './flex-corolla.js?v=I29';

const M = 0.0254; // Local coordinates of each CAD instance are inches.
const LEVELS = 5;
const FIXED_X = 12.03;
const OPEN_X = 5.70;
const OPEN_Z = 54.40;
const RIM_Z = 12.721967078745365;
const LOW_RISE = 2.30;
const CLEARANCE = .020 / M;
const WALL = .020 / M;
const TRACKS = [3.66, 6.54];
const LANE = .19;
const ROD_WIDTH = .42;
const ROD_DEPTH = .30;
const PIN = .107;
const BORE = .125;
const ROLLER = .22;
const BEARING = .20;
const GUIDE_OFFSET = .70;
const DECK = .30;

function readCadUnit(group) {
  const scissor = group.children.find(child => child.children.length === 48);
  const corolla = group.children.find(child => child.children.length === 4);
  const base = group.children.find(child => child.children.length === 2);
  const plate = scissor?.children.find(child => child.position.z > 54 && child.children.length === 1);
  if (!scissor || !corolla || !base || !plate) {
    throw new Error('El GLB no contiene la tijera, la caja y la corola esperadas.');
  }
  return { group, scissor, corolla, base, plate };
}

function designFor(data, scissor) {
  const { folded, sweep, mountZ } = data;
  const storedShift = RIM_Z - CLEARANCE - folded.max[2];
  const lowTop = OPEN_Z + storedShift;
  const bottom = lowTop - LEVELS * LOW_RISE;
  const floor = scissor.position.z + bottom - 1.15;
  const openRise = (OPEN_Z - bottom) / LEVELS;
  const length = Math.hypot(openRise, FIXED_X - OPEN_X);
  const sliderAt = rise => FIXED_X - Math.sqrt(length ** 2 - rise ** 2);
  const lowX = sliderAt(LOW_RISE);
  const guideMin = lowX - .46;
  const guideMax = OPEN_X + .46;
  const deckMin = guideMin - .18;
  const deckMax = FIXED_X + .48;
  const deckCenter = (deckMin + deckMax) / 2;
  const deckWidth = TRACKS[1] - TRACKS[0] + 2 * (GUIDE_OFFSET + .30);
  const centerY = (TRACKS[0] + TRACKS[1]) / 2;
  const deckTopOffset = mountZ - scissor.position.z - OPEN_Z;
  const upperGuideHeight = deckTopOffset - DECK - ROLLER;
  const min = [
    Math.min(folded.min[0], scissor.position.x + deckMin) - CLEARANCE,
    Math.min(folded.min[1], scissor.position.y + centerY - deckWidth / 2) - CLEARANCE,
    floor,
  ];
  const max = [
    Math.max(folded.max[0], scissor.position.x + deckMax) + CLEARANCE,
    Math.max(folded.max[1], scissor.position.y + centerY + deckWidth / 2) + CLEARANCE,
    RIM_Z,
  ];
  // The same threshold is used on the way down. Every moving crown point is
  // already above the rim before its horizontal envelope may leave the mouth.
  const openAt = (RIM_Z + CLEARANCE - data.openingMinZ - storedShift) / -storedShift;
  const parallelGap = Math.min(
    LOW_RISE * (FIXED_X - lowX) / length,
    openRise * (FIXED_X - OPEN_X) / length,
  ) - ROD_WIDTH;
  if (!(storedShift < 0 && openAt > 0 && openAt < 1 && upperGuideHeight > 0
      && deckTopOffset - DECK > Math.hypot(.18, ROD_WIDTH / 2)
      && sweep.min[2] >= mountZ - 1e-8
      && folded.min[2] + storedShift > floor + CLEARANCE && parallelGap > 0
      && 2 * LANE > ROD_DEPTH)) {
    throw new Error('El diseño de guardado excede los márgenes del recorrido.');
  }
  return {
    storedShift, lowTop, bottom, floor, openRise, length, sliderAt, lowX,
    guideMin, guideMax, deckMin, deckMax, deckCenter, deckWidth, centerY,
    deckTopOffset, upperGuideHeight, min, max, openAt, parallelGap,
  };
}

function plateWithBores(THREE, length, width, thickness, pivots, hole) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -length / 2);
  shape.lineTo(width / 2, -length / 2);
  shape.lineTo(width / 2, length / 2);
  shape.lineTo(-width / 2, length / 2);
  shape.closePath();
  for (const y of pivots) {
    const opening = new THREE.Path();
    opening.absarc(0, y, hole, 0, Math.PI * 2, true);
    shape.holes.push(opening);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: false, curveSegments: 10,
  });
  geometry.translate(0, 0, -thickness / 2);
  return geometry.rotateX(Math.PI / 2);
}

function annulus(THREE, outer, depth) {
  const ring = new THREE.Shape();
  ring.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, BORE, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(ring, { depth, bevelEnabled: false, curveSegments: 12 });
  return geometry.translate(0, 0, -depth / 2).rotateX(Math.PI / 2);
}

function box(THREE, parent, material, name, size, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function buildCase(THREE, unit, design, materials) {
  const { min, max } = design;
  const [x, y, z] = min;
  const [X, Y, Z] = max;
  const width = X - x, depth = Y - y, height = Z - z;
  const center = [(x + X) / 2, (y + Y) / 2, (z + Z) / 2];
  const frame = new THREE.Group();
  frame.name = 'Caja abierta de guardado propuesta';
  unit.group.add(frame);
  box(THREE, frame, materials.floor, 'Fondo', [width + 2 * WALL, depth + 2 * WALL, WALL],
    [center[0], center[1], z - WALL / 2]);
  // Wall interiors exactly bound the opening. Adjacent solids share faces only.
  for (const sideX of [x - WALL / 2, X + WALL / 2]) {
    box(THREE, frame, materials.wall, 'Pared longitudinal', [WALL, depth, height],
      [sideX, center[1], center[2]]);
  }
  for (const sideY of [y - WALL / 2, Y + WALL / 2]) {
    box(THREE, frame, materials.wall, 'Pared transversal', [width + 2 * WALL, WALL, height],
      [center[0], sideY, center[2]]);
  }
  return frame;
}

function buildLift(THREE, unit, design, materials, shapes) {
  const rig = new THREE.Group();
  rig.name = 'Tijera reversible de cinco niveles';
  rig.position.copy(unit.scissor.position);
  rig.quaternion.copy(unit.scissor.quaternion);
  unit.group.add(rig);
  const top = new THREE.Group();
  top.name = 'Portacorola guiado';
  rig.add(top);
  const {
    bottom, guideMin, guideMax, deckMin, deckMax, deckCenter, deckWidth,
    centerY, deckTopOffset, upperGuideHeight,
  } = design;
  const topOffset = deckTopOffset;
  box(THREE, top, materials.track, 'Plataforma portacorola',
    [deckMax - deckMin, deckWidth, DECK],
    [deckCenter, centerY, topOffset - DECK / 2]);
  const guides = [];
  const axles = [];
  const crosses = [];
  const rods = [];
  const railCenter = (guideMin + guideMax) / 2;
  const railLength = guideMax - guideMin;
  const floorLocal = design.floor - unit.scissor.position.z;

  function add(geometry, material, name, parent = rig) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }

  for (const track of TRACKS) {
    const y = track + Math.sign(track - centerY) * GUIDE_OFFSET;
    const lowerHeight = bottom - ROLLER - floorLocal;
    box(THREE, rig, materials.track, 'Carril inferior', [railLength, .32, lowerHeight],
      [railCenter, y, floorLocal + lowerHeight / 2]);
    box(THREE, top, materials.track, 'Carril superior', [railLength, .32, upperGuideHeight],
      [railCenter, y, ROLLER + upperGuideHeight / 2]);
    const lowSupport = bottom - BEARING - floorLocal;
    box(THREE, rig, materials.track, 'Apoyo fijo inferior', [.35, .32, lowSupport],
      [FIXED_X, y, floorLocal + lowSupport / 2]);
    const topSupport = topOffset - DECK - BEARING;
    box(THREE, top, materials.track, 'Apoyo fijo superior', [.35, .32, topSupport],
      [FIXED_X, y, BEARING + topSupport / 2]);
    add(shapes.bearing, materials.pin, 'Cojinete fijo inferior').position.set(FIXED_X, y, bottom);
    add(shapes.bearing, materials.pin, 'Cojinete fijo superior', top).position.set(FIXED_X, y, 0);
    const low = add(shapes.wheel, materials.pin, 'Rodillo inferior');
    const high = add(shapes.wheel, materials.pin, 'Rodillo superior', top);
    low.position.set(0, y, bottom);
    high.position.set(0, y, 0);
    guides.push({low, high});
  }

  for (let level = 0; level <= LEVELS; level++) {
    const pair = [];
    for (const label of ['Eje móvil', 'Eje fijo en X']) {
      const mesh = add(shapes.axle, materials.pin, label);
      mesh.position.y = centerY;
      pair.push(mesh);
    }
    axles.push(pair);
    if (level === LEVELS) continue;
    const middle = add(shapes.axle, materials.pin, 'Eje de cruceta');
    middle.position.y = centerY;
    crosses.push(middle);
    for (const track of TRACKS) {
      for (const sign of [1, -1]) {
        const arm = add(shapes.rod, materials.rod, 'Brazo con tres taladros');
        arm.position.y = track + sign * LANE;
        rods.push({ arm, level, sign });
      }
    }
  }
  return { rig, top, guides, axles, crosses, rods };
}

export function createMechanism(THREE, root) {
  const units = root.children.map(readCadUnit);
  const flex = createFlexCorollas(THREE, units);
  const design = designFor(flex.data, units[0].scissor);
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0x886343, roughness: .89 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x694b33, roughness: .96 }),
    track: new THREE.MeshStandardMaterial({ color: 0x48585e, roughness: .56, metalness: .48 }),
    pin: new THREE.MeshStandardMaterial({ color: 0xa5b5bd, roughness: .36, metalness: .58 }),
    rod: new THREE.MeshStandardMaterial({ color: 0xb4834f, roughness: .8 }),
  };
  const shapes = {
    rod: plateWithBores(THREE, design.length + .36, ROD_WIDTH, ROD_DEPTH,
      [-design.length / 2, 0, design.length / 2], BORE),
    axle: new THREE.CylinderGeometry(PIN, PIN, 4.57, 16),
    wheel: annulus(THREE, ROLLER, .23),
    bearing: annulus(THREE, BEARING, .32),
  };
  for (const unit of units) {
    unit.scissor.visible = false;
    unit.base.visible = false;
    unit.corolla.visible = false;
    unit.case = buildCase(THREE, unit, design, materials);
    unit.lift = buildLift(THREE, unit, design, materials, shapes);
  }
  const data = Object.freeze({
    boxInnerM: design.max.map((value, i) => (value - design.min[i]) * M),
    boxOuterM: design.max.map((value, i) => (value - design.min[i] + (i === 2 ? WALL : 2 * WALL)) * M),
    travelM: -design.storedShift * M,
    pinToPinM: design.length * M,
    stageCount: LEVELS,
    clearanceM: CLEARANCE * M,
    caseLocal: { min: design.min, max: design.max },
    openAt: design.openAt,
    sameLaneClearanceM: design.parallelGap * M,
    opposingLaneClearanceM: (2 * LANE - ROD_DEPTH) * M,
    pinClearanceM: (BORE - PIN) * M,
    crown: flex.data,
  });
  const barAxis = new THREE.Vector3(0, 0, 1);
  const direction = new THREE.Vector3();
  let state;

  function setProgress(value) {
    if (!Number.isFinite(value)) return state;
    const progress = THREE.MathUtils.clamp(value, 0, 1);
    const shift = design.storedShift * (1 - progress);
    const liftZ = OPEN_Z + shift;
    const rise = (liftZ - design.bottom) / LEVELS;
    const x = design.sliderAt(rise);
    const span = FIXED_X - x;
    const center = (x + FIXED_X) / 2;
    const opening = THREE.MathUtils.clamp((progress - design.openAt) / (1 - design.openAt), 0, 1);

    const {bend, fan} = flex.setOpening(opening);
    flex.setLift(shift);
    for (const {lift} of units) {
      lift.top.position.z = liftZ;
      for (const {low, high} of lift.guides) {
        low.position.x = high.position.x = x;
        low.rotation.y = (x - design.lowX) / ROLLER;
        high.rotation.y = -low.rotation.y;
      }
      lift.axles.forEach(([sliding, fixed], level) => {
        const z = design.bottom + level * rise;
        sliding.position.x = x;
        sliding.position.z = fixed.position.z = z;
        fixed.position.x = FIXED_X;
      });
      lift.crosses.forEach((pin, level) => {
        pin.position.x = center;
        pin.position.z = design.bottom + (level + .5) * rise;
      });
      for (const {arm, level, sign} of lift.rods) {
        direction.set(sign * span, 0, rise).normalize();
        arm.quaternion.setFromUnitVectors(barAxis, direction);
        arm.position.x = center;
        arm.position.z = design.bottom + (level + .5) * rise;
      }
    }
    state = {
      progress, opening, bend, fan, liftM: (shift - design.storedShift) * M,
      phase: progress === 0 ? 'Guardada' : progress === 1 ? 'Abierta'
        : progress <= design.openAt ? 'Pila plegada · salida de la caja'
          : bend < 1 ? 'Pétalos desdoblándose' : 'Giro de los pétalos alrededor del centro',
    };
    return state;
  }

  function setInspection(enabled) {
    materials.wall.transparent = enabled;
    materials.wall.opacity = enabled ? .23 : 1;
    materials.wall.depthWrite = !enabled;
    materials.wall.needsUpdate = true;
  }
  setProgress(0);
  return { units, data, setProgress, setInspection, ready: flex.ready, getState: () => state };
}
