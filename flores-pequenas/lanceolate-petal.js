import {createUFoldPetal} from '../flor-central/ufold-geometry.js?v=I28.1';

const taper = 0.55;
const minimumInsetM = 0.008;
const circle = 2 * Math.PI;

// Material coordinates: s from root to tip, y across the petal, both in metres.
// The planar pattern and inset are fixed throughout the cylindrical deformation.
export function createLanceolatePetal(options = {}) {
  const lengthM = options.lengthM ?? 1.50;
  const widthM = options.widthM ?? 0.54;
  const config = {
    lengthM, widthM, minBendRadiusM: 0.06, foldStartM: 0.71 * lengthM,
    openCurvaturePerM: 0, nx: 38, ny: 12, perimeterSamples: 128,
    hoopEnvelopeRadiusM: 0.0022, ...options,
    fabricEdgeInsetM: Math.max(minimumInsetM, options.fabricEdgeInsetM ?? minimumInsetM),
  };
  const {nx, ny, perimeterSamples, fabricEdgeInsetM: inset} = config;
  if (!(Number.isInteger(nx) && nx >= 3 && Number.isInteger(ny) && ny >= 1
        && Number.isInteger(perimeterSamples) && perimeterSamples >= 16)) {
    throw new Error('La malla lanceolada necesita divisiones enteras para paño y aro.');
  }

  const base = createUFoldPetal({...config, nx: 2, ny: 2, perimeterSamples: 8});
  const A = lengthM / 2;
  const B = widthM / 2;
  function outlineAt(theta) {
    const cosine = Math.cos(theta);
    return [A * (1 - cosine), B * Math.sin(theta) * (1 - taper * cosine * cosine)];
  }
  function outlineDerivatives(theta) {
    const sine = Math.sin(theta);
    const cosine = Math.cos(theta);
    return [
      A * sine, B * cosine * (1 + 2 * taper - 3 * taper * cosine * cosine),
      A * cosine, -B * sine * (1 + 2 * taper - 9 * taper * cosine * cosine),
    ];
  }
  function outlineCurvature(theta) {
    const [ds, dy, dds, ddy] = outlineDerivatives(theta);
    return (dy * dds - ds * ddy) / Math.hypot(ds, dy) ** 3;
  }
  function fabricOutlineAt(theta) {
    const [s, y] = outlineAt(theta);
    const [ds, dy] = outlineDerivatives(theta);
    const speed = Math.hypot(ds, dy);
    return [s + inset * dy / speed, y - inset * ds / speed];
  }
  function halfWidth(station) {
    const cosine = 1 - 2 * Math.max(0, Math.min(lengthM, station)) / lengthM;
    return B * Math.sqrt(Math.max(0, 1 - cosine * cosine)) * (1 - taper * cosine * cosine);
  }
  function fabricHalfWidth(station) {
    if (station <= inset || station >= lengthM - inset) return 0;
    let lower = 0;
    let upper = Math.PI;
    for (let i = 0; i < 34; i += 1) {
      const middle = (lower + upper) / 2;
      if (fabricOutlineAt(middle)[0] < station) lower = middle;
      else upper = middle;
    }
    return Math.max(0, fabricOutlineAt((lower + upper) / 2)[1]);
  }

  let hoopLengthM = 0;
  let nominalAreaM2 = 0;
  let materialAreaM2 = 0;
  let maximumPatternCurvature = 0;
  const integrationSteps = 4096;
  const integrationStep = Math.PI / integrationSteps;
  for (let i = 0; i < integrationSteps; i += 1) {
    const theta = (i + 0.5) * integrationStep;
    const [ds, dy] = outlineDerivatives(theta);
    const curvature = outlineCurvature(theta);
    maximumPatternCurvature = Math.max(maximumPatternCurvature, curvature);
    hoopLengthM += 2 * integrationStep * Math.hypot(ds, dy);
    nominalAreaM2 += 2 * integrationStep * outlineAt(theta)[1] * ds;
    materialAreaM2 += 2 * integrationStep * fabricOutlineAt(theta)[1] * ds * (1 - inset * curvature);
  }
  maximumPatternCurvature = Math.max(maximumPatternCurvature, outlineCurvature(0), outlineCurvature(Math.PI));
  // Keep the parallel contour well below the smallest observed curvature radius.
  // These nominal dimensions are the long, strictly convex I28 lanceolate family.
  if (!(inset * maximumPatternCurvature < 0.5 && widthM < lengthM)) {
    throw new Error('El margen interior excede el radio de curvatura útil del patrón lanceolado.');
  }

  const coordinates = [[inset, 0]];
  for (let i = 1; i < nx; i += 1) {
    const station = inset + (lengthM - 2 * inset) * i / nx;
    const width = fabricHalfWidth(station);
    for (let j = 0; j <= ny; j += 1) coordinates.push([station, width * (2 * j / ny - 1)]);
  }
  const tipIndex = coordinates.length;
  coordinates.push([lengthM - inset, 0]);
  const uv = coordinates.flatMap(([s, y]) => [s / lengthM, 0.5 + y / widthM]);
  const row = ny + 1;
  const indices = [];
  for (let j = 0; j < ny; j += 1) indices.push(0, 1 + j, 2 + j);
  for (let i = 0; i < nx - 2; i += 1) {
    for (let j = 0; j < ny; j += 1) {
      const n = 1 + i * row + j;
      indices.push(n, n + row, n + 1, n + 1, n + row, n + row + 1);
    }
  }
  for (let j = 0; j < ny; j += 1) {
    const n = 1 + (nx - 2) * row + j;
    indices.push(n, tipIndex, n + 1);
  }
  const angles = Array.from({length: perimeterSamples + 1}, (_, i) => circle * i / perimeterSamples);
  const rimPattern = angles.map(outlineAt);
  const fabricPattern = angles.map(fabricOutlineAt);
  const fabricPatternM = [lengthM - 2 * inset, widthM - 2 * inset];

  function state(opening) {
    const bend = base.state(opening);
    const positions = [];
    // Integrate each longitudinal station once. Crosswise positions are exact
    // linear rulings, so changing the contour adds no in-plane deformation.
    let previous = -1;
    let section;
    for (const [s, y] of coordinates) {
      if (s !== previous) {
        section = bend.sectionAt(s).point;
        previous = s;
      }
      positions.push(y, section[1], section[0]);
    }
    const hoop = rimPattern.map(([s, y]) => bend.pointAt(s, y));
    const fabricPerimeterPointsM = fabricPattern.map(([s, y]) => bend.pointAt(s, y));
    const centerlinePointsM = Array.from({length: nx + 1}, (_, i) => bend.pointAt(i * lengthM / nx));
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const point of hoop) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
    return {
      ...bend, positions, uv, indices, hoop, perimeterPointsM: hoop, fabricPerimeterPointsM,
      centerlinePointsM, bounds: {min, max, size: max.map((value, axis) => value - min[axis])},
      materialAreaM2, nominalAreaM2, fabricPatternM, hoopLengthM,
      metrics: {...bend.metrics, analyticHoopLengthM: hoopLengthM, analyticFabricAreaM2: materialAreaM2},
    };
  }

  const design = {
    ...base.design, nominalPatternM: [lengthM, widthM], fabricPatternM, fabricEdgeInsetM: inset,
    roundedEllipse: false, lanceolate: true, maximumPatternCurvatureMInv: maximumPatternCurvature,
    materialAreaM2, nominalAreaM2, hoopLengthM,
  };
  return {config, state, halfWidth, outlineAt, fabricHalfWidth, fabricOutlineAt, design};
}
