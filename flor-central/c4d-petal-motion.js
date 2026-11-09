import {createLanceolatePetal} from '../flores-pequenas/lanceolate-petal.js?v=I28.1';

const PI = Math.PI;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const abscissae = [0.09501250983763744, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438,
  0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499];
const weights = [0.1894506104550685, 0.1826034150449236, 0.16915651939500254, 0.14959598881657673,
  0.12462897125553388, 0.09515851168249289, 0.06225352393864789, 0.027152459411754095];

function turnAt(u) {
  const t = clamp(u);
  return t - Math.sin(2 * PI * t) / (2 * PI);
}

function integrate(u, angle, span) {
  if (u <= 0) return [0, 0];
  if (angle === 0) return [u * span, 0];
  let x = 0;
  let y = 0;
  for (let i = 0; i < abscissae.length; i += 1) {
    const left = angle * turnAt(u * (1 - abscissae[i]) / 2);
    const right = angle * turnAt(u * (1 + abscissae[i]) / 2);
    x += weights[i] * (Math.cos(left) + Math.cos(right));
    y += weights[i] * (Math.sin(left) + Math.sin(right));
  }
  return [x * u * span / 2, y * u * span / 2];
}

function eased(t) {
  return t * t * (3 - 2 * t);
}

// F06 frame [across, up, outward]. The same fixed planar material pattern
// becomes r(t,s) = [t, y(s), x(s)]. Its metric is the identity because the
// section integrates a unit tangent. No piece is scaled or turned in azimuth.
export function createC4DPetalMotion(options = {}) {
  const lengthM = options.lengthM ?? 4;
  const widthM = options.widthM ?? 3.5;
  const minBendRadiusM = options.minBendRadiusM ?? 0.055;
  const foldStartM = options.foldStartM ?? 0.32 * lengthM;
  const fallStartM = options.fallStartM ?? 0.72 * lengthM;
  const fallAngleRad = options.fallAngleRad ?? 0.72;
  const releaseAt = options.releaseAt ?? 0.80;
  const hoopEnvelopeRadiusM = options.hoopEnvelopeRadiusM ?? 0.0022;
  const layerClearanceM = options.layerClearanceM ?? 0.012;
  const openingMode = options.openingMode ?? 'rolling';
  const bloomingEnabled = openingMode === 'bloom';
  const bloomAt = options.bloomAt ?? 0.43;
  const bloomGateM = options.bloomGateM ?? 0.76 * lengthM;
  const foldSpan = 2 * PI * minBendRadiusM;
  const fallSpan = lengthM - fallStartM;
  if (!(foldStartM >= 0 && minBendRadiusM > 0 && 2 * foldStartM + foldSpan < lengthM
      && fallStartM > foldStartM && fallSpan > 0 && fallAngleRad >= 0 && fallAngleRad < PI / 2
      && releaseAt > 0 && releaseAt < 1 && hoopEnvelopeRadiusM > 0 && layerClearanceM >= 0)) {
    throw new Error('El perfil necesita una U de retorno que cruce la raíz y una caída terminal menor de 90 grados.');
  }
  if ((openingMode !== 'rolling' && !bloomingEnabled) || (bloomingEnabled
      && !(0 < bloomAt && bloomAt < releaseAt && foldStartM < bloomGateM && bloomGateM + foldSpan < lengthM
        && 2 * bloomGateM + foldSpan > lengthM))) {
    throw new Error('La subida necesita una banda U completa al llegar a la estación de despeje.');
  }

  const pattern = createLanceolatePetal({
    nx: lengthM >= 2.5 ? 144 : 96,
    ny: 12,
    perimeterSamples: lengthM >= 2.5 ? 384 : 256,
    ...options, lengthM, widthM, minBendRadiusM, foldStartM: 0, openCurvaturePerM: 0,
  });
  const flat = pattern.state(1);
  const config = {
    ...pattern.config, lengthM, widthM, minBendRadiusM, foldStartM, fallStartM, fallAngleRad, releaseAt,
    hoopEnvelopeRadiusM, layerClearanceM, openingMode,
    ...(bloomingEnabled ? {bloomAt, bloomGateM} : {}),
  };
  const clothPattern = [];
  for (let i = 0; i < flat.positions.length; i += 3) {
    clothPattern.push([flat.positions[i + 2], flat.positions[i]]);
  }
  const rimPattern = flat.hoop.map(([across, , s]) => [s, across]);
  const insetPattern = flat.fabricPerimeterPointsM.map(([across, , s]) => [s, across]);

  // Full positive U has zero outward displacement across the bend by symmetry.
  const foldHeightM = integrate(1, PI, foldSpan)[1];
  const openTipSection = integrate(1, -fallAngleRad, fallSpan);
  const storedTipX = 2 * foldStartM + foldSpan - lengthM;
  const maxStoredOutwardM = foldStartM + integrate(0.5, PI, foldSpan)[0];
  const bloomMinimumOutwardM = 2 * bloomGateM + foldSpan - lengthM;

  function bloomSection(t) {
    if (t === 0) return {start: bloomGateM, bend: PI};
    const bend = PI * (1 - eased(t));
    if (bend <= PI / 2) return {start: bloomMinimumOutwardM, bend};
    const [offsetX] = integrate(1, bend, foldSpan);
    const cos = Math.cos(bend);
    // For turns >90°, the minimum outward coordinate in the moving interval
    // is the smaller of its stationary shoulder and its returning tip.
    // Solve the exact tip constraint for the shoulder, then smooth the maximum.
    const tipRequiredStart = (bloomMinimumOutwardM - offsetX - (lengthM - foldSpan) * cos) / (1 - cos);
    const softWidth = Math.min(0.012, offsetX / 2);
    const deficit = Math.max(0, softWidth - Math.abs(tipRequiredStart - bloomMinimumOutwardM));
    const safety = deficit > 0 ? deficit ** 2 / (4 * softWidth) : 0;
    const start = Math.min(bloomGateM, Math.max(bloomMinimumOutwardM, tipRequiredStart) + safety);
    return {start, bend};
  }

  function measureBloom() {
    if (!bloomingEnabled) return {};
    function tipHeight(t) {
      const {start, bend} = bloomSection(t);
      return integrate(1, bend, foldSpan)[1] + (lengthM - start - foldSpan) * Math.sin(bend);
    }
    let peakT = 0;
    let peak = 0;
    const steps = 256;
    for (let i = 0; i <= steps; i += 1) {
      const candidate = tipHeight(i / steps);
      if (candidate > peak) {
        peak = candidate;
        peakT = i / steps;
      }
    }
    let lower = Math.max(0, peakT - 1 / steps);
    let upper = Math.min(1, peakT + 1 / steps);
    for (let i = 0; i < 24; i += 1) {
      const left = lower + (upper - lower) / 3;
      const right = upper - (upper - lower) / 3;
      if (tipHeight(left) < tipHeight(right)) lower = left;
      else upper = right;
    }
    peakT = (lower + upper) / 2;
    return {
      bloomAt, bloomGateM, bloomMinimumOutwardM,
      bloomMaxHeightM: lengthM - bloomMinimumOutwardM,
      bloomPeakHeightM: tipHeight(peakT),
      bloomPeakAt: bloomAt + (releaseAt - bloomAt) * peakT,
      bloomVerticalAt: (bloomAt + releaseAt) / 2,
      requiresBloomSectorClearance: true,
    };
  }

  const bloom = measureBloom();

  function state(opening = 0) {
    const progress = clamp(Number(opening) || 0);
    const rollingEnd = bloomingEnabled ? bloomAt : releaseAt;
    const rolling = progress < rollingEnd;
    const blooming = bloomingEnabled && !rolling && progress < releaseAt;
    const rollTarget = bloomingEnabled ? bloomGateM : lengthM;
    let start = fallStartM;
    let span = fallSpan;
    let bend = -fallAngleRad * eased(clamp((progress - releaseAt) / (1 - releaseAt)));
    if (rolling) {
      start = foldStartM + (rollTarget - foldStartM) * eased(progress / rollingEnd);
      span = foldSpan;
      bend = PI;
    } else if (blooming) {
      ({start, bend} = bloomSection((progress - bloomAt) / (releaseAt - bloomAt)));
      span = foldSpan;
    }
    const cache = new Map();

    function sectionAt(station) {
      const s = clamp(station, 0, lengthM);
      if (cache.has(s)) return cache.get(s);
      const u = clamp((s - start) / span);
      const angleRad = bend * turnAt(u);
      const curvaturePerM = bend * (1 - Math.cos(2 * PI * u)) / span;
      const [x, y] = integrate(u, bend, span);
      const tail = Math.max(0, s - start - span);
      const point = s <= start
        ? [s, 0]
        : [start + (bend === PI && u === 1 ? 0 : x) + tail * Math.cos(angleRad),
          (bend === PI && u === 1 ? foldHeightM : y) + tail * Math.sin(angleRad)];
      const section = {point, angleRad, curvaturePerM};
      cache.set(s, section);
      return section;
    }
    function pointAt(s, across = 0) {
      const {point: [x, y]} = sectionAt(s);
      return [across, y, x];
    }
    const angleAt = s => sectionAt(s).angleRad;
    const curvatureAt = s => sectionAt(s).curvaturePerM;
    const tangentAt = s => {
      const angle = angleAt(s);
      return [0, Math.sin(angle), Math.cos(angle)];
    };
    const normalAt = s => {
      const angle = angleAt(s);
      return [0, Math.cos(angle), -Math.sin(angle)];
    };

    const positions = clothPattern.flatMap(([s, across]) => pointAt(s, across));
    const hoop = rimPattern.map(([s, across]) => pointAt(s, across));
    const fabricPerimeterPointsM = insetPattern.map(([s, across]) => pointAt(s, across));
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
    const maxCurvaturePerM = 2 * Math.abs(bend) / span;
    return {
      progress, phase: rolling ? 'rolling' : blooming ? 'bloom' : 'terminal', positions, uv: flat.uv, indices: flat.indices,
      hoop, perimeterPointsM: hoop, fabricPerimeterPointsM, centerlinePointsM,
      pointAt, sectionAt, angleAt, curvatureAt, tangentAt, normalAt,
      path: t => pointAt(clamp(t) * lengthM),
      rootM, rootMaterialPointM: rootM, rootTangentM: [0, 0, 1], rootNormalM: [0, 1, 0],
      tipM, tipMaterialPointM: tipM, foldAngleRad: angleAt(lengthM), foldBandM: [start, Math.min(lengthM, start + span)],
      bounds: {min, max, size: max.map((value, axis) => value - min[axis])},
      totalLengthM: lengthM, materialAreaM2: pattern.design.materialAreaM2,
      nominalAreaM2: pattern.design.nominalAreaM2, fabricPatternM: pattern.design.fabricPatternM,
      hoopLengthM: pattern.design.hoopLengthM,
      metrics: {
        ...flat.metrics, maxCurvaturePerM, minInstantaneousRadiusM: maxCurvaturePerM > 0 ? 1 / maxCurvaturePerM : Infinity,
        scope: bloomingEnabled
          ? 'Inextensible rolling U, upward sweep and terminal droop. Kinematic interpretation of the C4D poses.'
          : 'Inextensible rolling U followed by terminal droop. Kinematic interpretation of the two C4D reference poses.',
      },
    };
  }

  const envelope = {
    folded: {min: [-widthM / 2, 0, storedTipX], max: [widthM / 2, foldHeightM, maxStoredOutwardM]},
    open: {min: [-widthM / 2, openTipSection[1], 0], max: [widthM / 2, 0, fallStartM + openTipSection[0]]},
    sweep: {min: [-widthM / 2, openTipSection[1], storedTipX], max: [widthM / 2, Math.max(foldHeightM, bloom.bloomMaxHeightM ?? 0), lengthM]},
    foldHeightM, storedTipX, maxStoredOutwardM,
    minimumLayerPitchM: foldHeightM + 2 * hoopEnvelopeRadiusM + layerClearanceM,
    hoopEnvelopeRadiusM, releaseAt, ...bloom,
  };
  const design = {
    ...pattern.design, armLengthM: foldStartM, foldBandLengthM: foldSpan,
    maxStoredOutwardM, storedTipX, foldHeightM, fallStartM, fallAngleRad, releaseAt,
    minimumLayerPitchM: envelope.minimumLayerPitchM, ...bloom,
    continuousIdealInjectivity: 'A nondecreasing tangent angle between 0 and pi gives the U and the upward sweep. In the terminal phase, the outward coordinate is strictly increasing. Each shape is extruded transversely.',
  };
  return {
    config, design, envelope, state, outlineAt: pattern.outlineAt, halfWidth: pattern.halfWidth,
    fabricOutlineAt: pattern.fabricOutlineAt, fabricHalfWidth: pattern.fabricHalfWidth,
  };
}
