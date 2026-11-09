// The source CAD already contains a merged scissor in its open pose. This
// linkage studies the same five levels and carries the original rigid corolla.
const metersPerUnit = 0.0254;
const stageCount = 5;
const fixedX = 12.03;
const openSliderX = 5.70;
// The low transverse axle clears the horizontal screw already in the source CAD.
const bottomZ = 1.02;
const openTopZ = 54.40;
const corollaMinZ = 47.258174896240234;
const boxTopZ = 12.721967078745365;
const minimumClearanceM = 0.03;
const openRise = (openTopZ - bottomZ) / stageCount;
const pinToPin = Math.hypot(openRise, fixedX - openSliderX);
const lowShift = boxTopZ + minimumClearanceM / metersPerUnit - corollaMinZ;
const lowRise = openRise + lowShift / stageCount;
const sliderXFor = rise => fixedX - Math.sqrt(pinToPin * pinToPin - rise * rise);
const lowSliderX = sliderXFor(lowRise);
const sideTracks = [3.66, 6.54];
const halfLaneGap = 0.19;
const guideOffset = 0.62;
const barWidth = 0.42;
const barDepth = 0.30;
const axisDepth = 4.55;
const axleRadius = 0.14;
const rollerRadius = 0.20;
const rollerWidth = 0.25;
const boxFloorZ = -0.053718648850917816;
const lowerRailHeight = bottomZ - rollerRadius - boxFloorZ;
const lowerStandHeight = bottomZ - axleRadius - boxFloorZ;
const trackStart = 0;
const trackEnd = 6.13;

function readCadUnit(group) {
  const scissor = group.children.find(child => child.children.length === 48);
  const corolla = group.children.find(child => child.children.length === 4);
  const base = group.children.find(child => child.children.length === 2);
  if (!scissor || !corolla || !base) return null;
  const plate = scissor.children.find(child => child.position.z > 54 && child.children.length === 1);
  if (!plate) return null;
  return {group, scissor, corolla, base, plate};
}

function buildLinkage(THREE, unit, geometries, materials) {
  const originalScissor = unit.scissor;
  const mechanism = new THREE.Group();
  mechanism.name = 'Tijera articulada de estudio';
  mechanism.position.copy(originalScissor.position);
  mechanism.quaternion.copy(originalScissor.quaternion);
  mechanism.scale.copy(originalScissor.scale);
  unit.group.add(mechanism);

  const plate = unit.plate.clone(true);
  plate.name = 'Plataforma original de la corola';
  mechanism.add(plate);
  const topHardware = new THREE.Group();
  topHardware.name = 'Guías de la plataforma';
  mechanism.add(topHardware);

  const baseHardware = new THREE.Group();
  baseHardware.name = 'Guías de la caja';
  mechanism.add(baseHardware);

  function mesh(geometry, material, parent, name, x = 0, y = 0, z = 0) {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }

  const centerY = (sideTracks[0] + sideTracks[1]) / 2;
  const railMiddle = (trackStart + trackEnd) / 2;
  const sliders = [];
  for (const y of sideTracks) {
    const guideY = y + Math.sign(y - centerY) * guideOffset;
    mesh(geometries.lowerRail, materials.rail, baseHardware, 'Carril de la caja', railMiddle, guideY, boxFloorZ + lowerRailHeight / 2);
    mesh(geometries.upperRail, materials.rail, topHardware, 'Carril de la plataforma', railMiddle, guideY, 0.338);
    mesh(geometries.lowerStand, materials.rail, baseHardware, 'Apoyo del pivote fijo', fixedX, guideY, boxFloorZ + lowerStandHeight / 2);
    mesh(geometries.upperStand, materials.rail, topHardware, 'Apoyo del pivote fijo', fixedX, guideY, 0.3075);
    const lower = mesh(geometries.roller, materials.slider, baseHardware, 'Rueda de la caja', openSliderX, guideY, bottomZ);
    const upper = mesh(geometries.roller, materials.slider, topHardware, 'Rueda de la plataforma', openSliderX, guideY);
    sliders.push({lower, upper});
  }

  const axleMeshes = [];
  for (let level = 0; level <= stageCount; level += 1) {
    const addAxle = name => mesh(geometries.axle, materials.pin, mechanism, name, 0, centerY);
    axleMeshes.push([addAxle('Eje transversal móvil'), addAxle('Eje transversal fijo en X')]);
  }

  const bars = [];
  const crossPins = [];
  const barMaterial = originalScissor.children.find(child => child.isMesh)?.material ?? materials.rail;
  for (let level = 0; level < stageCount; level += 1) {
    for (const y of sideTracks) {
      for (const upwardToRight of [true, false]) {
        const lane = upwardToRight ? y + halfLaneGap : y - halfLaneGap;
        const bar = mesh(geometries.bar, barMaterial, mechanism, 'Brazo rígido', 0, lane);
        bars.push({level, lane, upwardToRight, bar});
      }
    }
    crossPins.push(mesh(geometries.axle, materials.pin, mechanism, 'Pivote central de cruceta', 0, centerY));
  }

  return {
    ...unit, originalScissor, mechanism, topHardware, plate, sliders, axleMeshes, bars, crossPins,
    plateOpenZ: plate.position.z, corollaOpenZ: unit.corolla.position.z,
  };
}

export function createMechanism(THREE, root) {
  const sceneRoot = root.children.length === 1 ? root.children[0] : root;
  const singleUnit = readCadUnit(sceneRoot);
  const cadUnits = singleUnit ? [singleUnit] : sceneRoot.children.map(readCadUnit);
  if (!cadUnits.length || cadUnits.some(unit => !unit)) {
    throw new Error('El modelo de flores pequeñas no contiene los grupos de corola, tijera y base esperados.');
  }
  const geometries = {
    bar: new THREE.BoxGeometry(barWidth, barDepth, pinToPin + 0.34),
    axle: new THREE.CylinderGeometry(axleRadius, axleRadius, axisDepth, 12),
    lowerRail: new THREE.BoxGeometry(trackEnd - trackStart, 0.42, lowerRailHeight),
    upperRail: new THREE.BoxGeometry(trackEnd - trackStart, 0.42, 0.276),
    roller: new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerWidth, 16),
    lowerStand: new THREE.BoxGeometry(0.59, 0.47, lowerStandHeight),
    upperStand: new THREE.BoxGeometry(0.59, 0.47, 0.335),
  };
  const materials = {
    pin: new THREE.MeshStandardMaterial({color: 0xb6bdc0, metalness: 0.72, roughness: 0.35}),
    rail: new THREE.MeshStandardMaterial({color: 0x525b60, metalness: 0.62, roughness: 0.46}),
    slider: new THREE.MeshStandardMaterial({color: 0xc5914d, metalness: 0.46, roughness: 0.44}),
  };

  const units = cadUnits.map(unit => buildLinkage(THREE, unit, geometries, materials));
  const data = Object.freeze({
    stageCount,
    pinToPinM: pinToPin * metersPerUnit,
    maximumTravelM: -lowShift * metersPerUnit,
    minimumClearanceM,
    nominalBoxTopM: boxTopZ * metersPerUnit,
    lowestSliderXM: lowSliderX * metersPerUnit,
    originalOpenPose: true,
    corollaFolds: false,
  });
  let state;
  const barAxis = new THREE.Vector3(0, 0, 1);
  const direction = new THREE.Vector3();

  function setProgress(value) {
    if (!Number.isFinite(value)) return state;
    const progress = Math.min(1, Math.max(0, value));
    const rise = lowRise + progress * (openRise - lowRise);
    const sliderX = sliderXFor(rise);
    const span = fixedX - sliderX;
    const plateShift = progress === 1 ? 0 : stageCount * (rise - openRise);

    for (const unit of units) {
      // The source CAD takes over at its authored open pose.
      unit.originalScissor.visible = progress === 1;
      unit.mechanism.visible = progress < 1;
      unit.corolla.position.z = unit.corollaOpenZ + plateShift;
      unit.plate.position.z = unit.plateOpenZ + plateShift;
      unit.topHardware.position.z = bottomZ + stageCount * rise;
      for (const {lower, upper} of unit.sliders) {
        lower.position.x = sliderX;
        upper.position.x = sliderX;
        const rotation = (sliderX - openSliderX) / rollerRadius;
        lower.rotation.y = rotation;
        upper.rotation.y = -rotation;
      }
      for (let level = 0; level <= stageCount; level += 1) {
        const z = bottomZ + level * rise;
        unit.axleMeshes[level][0].position.setX(sliderX).setZ(z);
        unit.axleMeshes[level][1].position.setX(fixedX).setZ(z);
      }
      for (const [level, pin] of unit.crossPins.entries()) {
        pin.position.setX((fixedX + sliderX) / 2).setZ(bottomZ + (level + 0.5) * rise);
      }
      for (const {level, lane, upwardToRight, bar} of unit.bars) {
        direction.set(upwardToRight ? span : -span, 0, rise).normalize();
        bar.quaternion.setFromUnitVectors(barAxis, direction);
        bar.position.set((fixedX + sliderX) / 2, lane, bottomZ + (level + 0.5) * rise);
      }
    }

    state = Object.freeze({
      ...data,
      progress,
      stageRiseM: rise * metersPerUnit,
      sliderSpanM: span * metersPerUnit,
      plateShiftM: plateShift * metersPerUnit,
      corollaClearsBoxM: (corollaMinZ + plateShift - boxTopZ) * metersPerUnit,
    });
    return state;
  }

  setProgress(1);
  return {units, data, setProgress, getState: () => state};
}
