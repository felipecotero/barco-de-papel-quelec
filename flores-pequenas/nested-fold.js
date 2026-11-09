import {createUFoldPetal} from '../flor-central/ufold-geometry.js?v=I28.1';
import {createLanceolatePetal} from './lanceolate-petal.js?v=I28.1';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function prepareSkin(pattern, config) {
  const {lengthM, widthM, nx, ny, pivotStationM, pivotHalfM, fabricEdgeInsetM: inset} = config;
  const flat = pattern.state(1);
  if (pivotStationM === null) {
    const coordinates = [];
    for (let i = 0; i < flat.positions.length; i += 3) coordinates.push([flat.positions[i + 2], flat.positions[i]]);
    return {flat, coordinates, uv: flat.uv, indices: flat.indices, pivotOpening: []};
  }

  const start = pivotStationM - pivotHalfM;
  const end = pivotStationM + pivotHalfM;
  if (!(ny >= 3 && inset < start && end < lengthM - inset && end <= config.foldStartM - config.materialStartM
        && Math.min(pattern.fabricHalfWidth(start), pattern.fabricHalfWidth(end)) > 2 * pivotHalfM)) {
    throw new Error('El ojo del eje debe quedar dentro del ancho útil y del tramo plano del pétalo.');
  }

  // Insert exact stations and crosswise lines along the four sides of the eye.
  // The continuous material outside this intentional opening keeps its metric.
  const stations = Array.from({length: nx + 1}, (_, i) => inset + (lengthM - 2 * inset) * i / nx);
  const interior = [...stations.slice(1, -1).filter(s => Math.min(Math.abs(s - start), Math.abs(s - end)) > 1e-10), start, end].sort((a, b) => a - b);
  const sideColumns = Math.floor(ny / 3);
  const middleColumns = ny - 2 * sideColumns;
  const coordinates = [[inset, 0]];
  for (const station of interior) {
    const width = pattern.fabricHalfWidth(station);
    const centerHalf = Math.min(pivotHalfM, width / 2);
    for (let j = 0; j < sideColumns; j += 1) coordinates.push([station, -width + (width - centerHalf) * j / sideColumns]);
    for (let j = 0; j < middleColumns; j += 1) coordinates.push([station, -centerHalf + 2 * centerHalf * j / middleColumns]);
    for (let j = 0; j <= sideColumns; j += 1) coordinates.push([station, centerHalf + (width - centerHalf) * j / sideColumns]);
  }
  const tip = coordinates.length;
  coordinates.push([lengthM - inset, 0]);
  const rowSize = ny + 1;
  const faces = [];
  for (let j = 0; j < ny; j += 1) faces.push(0, 1 + j, 2 + j);
  for (let i = 0; i < interior.length - 1; i += 1) {
    const inOpening = interior[i] >= start && interior[i + 1] <= end;
    for (let j = 0; j < ny; j += 1) {
      if (inOpening && j >= sideColumns && j < sideColumns + middleColumns) continue;
      const n = 1 + i * rowSize + j;
      faces.push(n, n + rowSize, n + 1, n + 1, n + rowSize, n + rowSize + 1);
    }
  }
  for (let j = 0; j < ny; j += 1) {
    const n = 1 + (interior.length - 1) * rowSize + j;
    faces.push(n, tip, n + 1);
  }
  const kept = new Map();
  const trimmed = [];
  const indices = faces.map(i => {
    if (!kept.has(i)) {
      kept.set(i, trimmed.length);
      trimmed.push(coordinates[i]);
    }
    return kept.get(i);
  });
  const uv = trimmed.flatMap(([s, y]) => [s / lengthM, 0.5 + y / widthM]);
  const pivotOpening = [[start, -pivotHalfM], [end, -pivotHalfM], [end, pivotHalfM], [start, pivotHalfM]];
  return {flat, coordinates: trimmed, uv, indices, pivotOpening};
}

// All leaves share a reference section [longitudinal x, vertical z] during
// folding. Each lies on an exterior parallel curve at its own offset delta.
// Reparameterize this parallel curve by S = s + delta*theta(s); using the
// same material station on the reference curve would stretch the petal.
export function createNestedFold(options = {}) {
  const lengthM = options.lengthM ?? 1.50;
  const widthM = options.widthM ?? 0.54;
  const referenceLengthM = options.referenceLengthM ?? 1.50;
  const minBendRadiusM = options.minBendRadiusM ?? 0.08;
  const foldStartM = options.foldStartM ?? referenceLengthM / 3;
  const layerOffsetM = options.layerOffsetM ?? 0;
  const materialStartM = options.materialStartM ?? 0;
  const pivotStationM = options.pivotStationM ?? null;
  const pivotHalfM = options.pivotHalfM ?? (pivotStationM === null ? 0 : 0.033);
  if (!(Number.isFinite(layerOffsetM) && layerOffsetM >= 0 && materialStartM >= 0 && materialStartM < foldStartM
        && foldStartM < materialStartM + lengthM && materialStartM + lengthM <= referenceLengthM)) {
    throw new Error('El pétalo necesita un nivel exterior positivo o cero y una longitud dentro del perfil común.');
  }
  if ((options.openCurvaturePerM ?? 0) !== 0) {
    throw new Error('El abanico anidado necesita pétalos horizontales en el estado abierto.');
  }
  if (pivotStationM !== null && !(Number.isFinite(pivotStationM) && pivotHalfM > 0)) {
    throw new Error('El ojo del eje necesita una posición finita y un ancho positivo.');
  }

  const pattern = createLanceolatePetal({
    ...options, lengthM, widthM, minBendRadiusM, foldStartM: 0, openCurvaturePerM: 0,
  });
  const config = {
    ...pattern.config, referenceLengthM, minBendRadiusM, foldStartM, layerOffsetM, materialStartM,
    pivotStationM, pivotHalfM, openCurvaturePerM: 0,
  };
  const common = createUFoldPetal({
    lengthM: referenceLengthM, widthM, minBendRadiusM, foldStartM,
    openCurvaturePerM: 0, fabricEdgeInsetM: 0, nx: 2, ny: 2, perimeterSamples: 8,
  });
  const skin = prepareSkin(pattern, config);
  const rimPattern = skin.flat.hoop.map(([y, , s]) => [s, y]);
  const insetPattern = skin.flat.fabricPerimeterPointsM.map(([y, , s]) => [s, y]);
  const materialAreaM2 = pattern.design.materialAreaM2 - (skin.pivotOpening.length ? (2 * pivotHalfM) ** 2 : 0);

  function state(opening) {
    const reference = common.state(opening);
    const sectionCache = new Map();
    const thetaAt = s => reference.angleAt(s);
    const referenceStation = materialS => {
      if (layerOffsetM === 0 || reference.progress === 1 || materialS <= foldStartM) return materialS;
      let lower = Math.max(foldStartM, materialS - layerOffsetM * Math.PI);
      let upper = materialS;
      let s = upper;
      for (let i = 0; i < 10; i += 1) {
        const theta = thetaAt(s);
        const error = s + layerOffsetM * theta - materialS;
        if (Math.abs(error) < 1e-13) return s;
        if (error > 0) upper = s;
        else lower = s;
        const slope = 1 + layerOffsetM * reference.curvatureAt(s);
        const candidate = s - error / slope;
        s = candidate > lower && candidate < upper ? candidate : (lower + upper) / 2;
      }
      for (let i = 0; i < 36; i += 1) {
        s = (lower + upper) / 2;
        if (s + layerOffsetM * thetaAt(s) > materialS) upper = s;
        else lower = s;
      }
      return (lower + upper) / 2;
    };

    function sectionAt(materialS, opts) {
      const S = clamp(materialS, 0, lengthM);
      if (!opts?.precise && sectionCache.has(S)) return sectionCache.get(S);
      const s = referenceStation(S + materialStartM);
      const base = reference.sectionAt(s, opts);
      const theta = base.angleRad;
      const section = {
        point: [
          base.point[0] + layerOffsetM * Math.sin(theta) - materialStartM,
          base.point[1] - layerOffsetM * Math.cos(theta),
        ],
        angleRad: theta,
        curvaturePerM: base.curvaturePerM / (1 + layerOffsetM * base.curvaturePerM),
        referenceStationM: s,
      };
      if (!opts?.precise) sectionCache.set(S, section);
      return section;
    }
    function pointAt(s, across = 0, opts) {
      const {point: [x, z]} = sectionAt(s, opts);
      return [across, z, x];
    }
    const angleAt = s => sectionAt(s).angleRad;
    const curvatureAt = s => sectionAt(s).curvaturePerM;
    const tangentAt = s => {
      const theta = angleAt(s);
      return [0, Math.sin(theta), Math.cos(theta)];
    };
    const normalAt = s => {
      const theta = angleAt(s);
      return [0, Math.cos(theta), -Math.sin(theta)];
    };
    const positions = skin.coordinates.flatMap(([s, y]) => pointAt(s, y));
    const hoop = rimPattern.map(([s, y]) => pointAt(s, y));
    const fabricPerimeterPointsM = insetPattern.map(([s, y]) => pointAt(s, y));
    const pivotOpeningPointsM = skin.pivotOpening.map(([s, y]) => pointAt(s, y));
    const centerlinePointsM = Array.from({length: config.nx + 1}, (_, i) => pointAt(i * lengthM / config.nx));
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const point of hoop) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }

    const rootM = pointAt(0);
    const tipM = pointAt(lengthM);
    const endOfBand = reference.foldBandM[1] + layerOffsetM * reference.foldAngleRad;
    const foldBandM = [foldStartM - materialStartM, Math.min(lengthM, endOfBand - materialStartM)];
    const referenceCurvature = reference.metrics.maxCurvaturePerM;
    const maxCurvaturePerM = referenceCurvature / (1 + layerOffsetM * referenceCurvature);
    return {
      progress: reference.progress, pointAt, sectionAt, angleAt, curvatureAt, tangentAt, normalAt,
      path: t => pointAt(clamp(t, 0, 1) * lengthM),
      positions, uv: skin.uv, indices: skin.indices, hoop, perimeterPointsM: hoop,
      fabricPerimeterPointsM, pivotOpeningPointsM, centerlinePointsM,
      bounds: {min, max, size: max.map((value, axis) => value - min[axis])},
      rootM, rootMaterialPointM: rootM, rootTangentM: [0, 0, 1], rootNormalM: [0, 1, 0],
      tipM, tipMaterialPointM: tipM, rootRotorRad: 0, rotorAngleRad: 0,
      foldAngleRad: sectionAt(lengthM).angleRad, foldBandM, bendLengthM: foldBandM[1] - foldBandM[0],
      armLengthM: foldBandM[0], totalLengthM: lengthM, deployedFraction: reference.progress, layerOffsetM,
      materialAreaM2, nominalAreaM2: pattern.design.nominalAreaM2,
      fabricPatternM: pattern.design.fabricPatternM, hoopLengthM: pattern.design.hoopLengthM,
      metrics: {
        ...skin.flat.metrics, analyticLongitudinalLengthM: lengthM, analyticFabricAreaM2: materialAreaM2,
        maxCurvaturePerM, minInstantaneousRadiusM: maxCurvaturePerM > 0 ? 1 / maxCurvaturePerM : Infinity,
        layerOffsetM, commonSection: true,
        scope: 'Parallel continuous U curves reparameterized by their individual arc length. Geometry study.',
      },
    };
  }

  const design = {
    ...pattern.design,
    materialAreaM2,
    pivotStationM, pivotHalfM, pivotOpeningM: skin.pivotOpening.length ? [2 * pivotHalfM, 2 * pivotHalfM] : null,
    armLengthM: foldStartM - materialStartM,
    closedBendCenterM: foldStartM + Math.PI * minBendRadiusM + layerOffsetM * Math.PI / 2 - materialStartM,
    foldBandLengthM: common.design.foldBandLengthM,
    referenceLengthM, layerOffsetM, materialStartM, openLevelM: -layerOffsetM,
    curvatureProfile: 'On the shared U, theta is nondecreasing. The material coordinate is S=s+delta*theta(s).',
    continuousIdealInjectivity: 'On parallel profiles with one shared origin and axis and total turn at most pi, a chord between distinct sections has positive projection on their mid-angle tangent. Exterior offsets cannot cancel that projection; separate offsets keep layers disjoint.',
  };
  return {
    config, state, design, outlineAt: pattern.outlineAt, halfWidth: pattern.halfWidth,
    fabricOutlineAt: pattern.fabricOutlineAt, fabricHalfWidth: pattern.fabricHalfWidth,
  };
}
