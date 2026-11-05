/**
 * Flor central F03: cinemática y comparaciones geométricas de estudio.
 * No modela una elevadora concreta, el plegado elástico de acero ni su estabilidad.
 * Magnitudes SI cuando la función las pide expresamente en m, s, kg/m³ y m/s.
 */

export const DEFAULT_CONFIG = Object.freeze({
  stageTopM: 2,
  chamberTopM: 2.75,
  slopeDeg: 10,
  maxSlopeDeg: 15,
  trapFlatLengthM: 8,
  trapFlatWidthM: 4.3,
  trapOpeningLengthM: 4.2,
  trapOpeningWidthM: 3.7,
  stageWidthM: 8,
  stageDepthM: 6,
  machineCompactTopM: 1.77,
  compactPlatformFloorM: 1.37,
  crownOffsetM: .40,
  storageTopM: 1.77,
  referenceOperativeTopM: 2.47,
  referenceStorageTopM: 1.77,
  targetPlatformFloorM: 9.75,
  requestedPlatformFloorM: 10,
  referenceMaxPlatformFloorM: 9.75,
  railMode: 'project',
  guardrailHeightM: 1.1,
  targetCrownM: 10.15,
  platformLengthM: 2.4,
  platformWidthM: 1.17,
  petalLengthM: 4,
  petalWidthM: 3.5,
  petalRootReadyDeg: 70,
  crownDiameterM: 3,
  packHeightM: .30,
  packMode: 'organic'
});

export const DEFAULT_CONFIG_SOURCES = Object.freeze({
  machine: 'Haulotte Compact 12, identificación confirmada por el usuario; año y número de serie pendientes.',
  referenceProfile: 'Estudio principal de la propuesta del usuario sin barandillas. La ficha oficial actual se conserva solo como comparación; no autoriza esa configuración ni su accesorio.',
  userInput: Object.freeze({ machineCompactTopM: 1.77, railMode: 'project', peopleOnPlatform: false, requestedPlatformFloorM: 10, priorTargetPlatformFloorM: 7, petalLengthM: 4, petalWidthM: 3.5 }),
  priorUserInput: Object.freeze({ machineCompactTopM: 1.8, platformLengthM: 2.3, platformWidthM: .9 }),
  peopleOnPlatform: false,
  requestedPlatformFloorM: 'El usuario pide aproximadamente10m de piso para obtener unos7m sobre la zona central elevada.',
  targetPlatformFloorM: '9,75m de piso según la ficha oficial actual de Compact12. Con centro2,75m da7,00m sobre el centro. La solicitud10m se muestra aparte, sin representar una elevación mayor al límite de referencia.',
  chamberTopM: 'Franja plana propuesta a2,75m que cruza los8m de ancho. Dos rampas, delante y detrás, bajan a2m; no hay pendientes laterales. Geometría de estudio, no aprobación estructural.',
  guardrailHeightM: '1,10m propuestos únicamente para comparación con barandillas; no se imponen en la propuesta visual principal.',
  targetCrownM: '10,15m derivados de9,75m de piso más0,40m de soporte propuesto. No es cota de fabricante ni unión aprobada.',
  machineCompactTopM: '1,77m sin barandillas y sin personas, configuración propuesta y confirmada por el usuario para el estudio. No se afirma que esté autorizada para operación.',
  compactPlatformFloorM: '1,37m aproximados como proxy:2,47m de referencia menos1,10m de barandilla supuesta. Medición real pendiente.',
  crownOffsetM: '0,40m propuestos para soporte respecto al piso de plataforma; no accesorio aprobado.',
  railMode: 'project muestra la propuesta sin barandillas; no contiene instrucciones para retirarlas ni alterar dispositivos.',
  storageTopM: '1,77m de la ficha oficial actual con barandillas abatidas; dato de almacenaje conservado para comparación.',
  referenceOperativeTopM: 2.47,
  referenceStorageTopM: 1.77,
  platformLengthM: '2,40m de la ficha oficial actual; confirmar dimensiones de la unidad real. El dato previo del usuario se conserva en userInput.',
  platformWidthM: '1,17m de la ficha oficial actual; confirmar dimensiones de la unidad real. El dato previo del usuario se conserva en userInput.',
  crownDiameterM: '3,00m conservados como referencia circular histórica. F03 usa aros orgánicos con ejes propios comprobados geométricamente; no un accesorio aprobado por fabricante.',
  packMode: 'organic usa envolventes elípticas de la escena; la comparación de altura no demuestra encaje horizontal.',
  petalDimensions: 'Cada pétalo4m de largo por3,5m de ancho, confirmado por el usuario.',
  actualMachineMeasurementPending: true,
  manufacturerReference: 'https://www.haulotte.com.es/es_ES/productos/compact-12',
  warning: 'La ficha actual muestra2,47m con barandillas y1,77m abatidas. El estudio sin barandillas solicitado por el usuario no demuestra que sea uso autorizado. Proveedor y responsable técnico deben resolver el uso y accesorio.'
});

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const duration = (value, fallback) => finite(value) && value >= 0 ? value : fallback;

/** F03: the complete trap/lift/petal sequence was withdrawn.
 * Root-only timing lives in app.js and does not assert compact recovery. */

/**
 * Guard only for the digital study. It cannot replace a physical interlock.
 * Increasing lift requires a fully open trap. A requested trap closure while the
 * previous lift is above its compact state is blocked, preserving lift and trap.
 * A caller should show reason and retain the preceding state if blocked=true.
 */
export function ensureLiftInterlock({ liftProgress = 0, trapProgress = 0, previousLiftProgress = 0 } = {}) {
  const requestedLift = clamp(finite(liftProgress) ? liftProgress : 0);
  const requestedTrap = clamp(finite(trapProgress) ? trapProgress : 0);
  const previousLift = clamp(finite(previousLiftProgress) ? previousLiftProgress : 0);
  const trapFullyOpen = requestedTrap >= 1 - 1e-9;
  let effectiveLift = requestedLift, effectiveTrap = requestedTrap, reason = '', blocked = false;
  if (previousLift > 1e-9 && !trapFullyOpen) {
    blocked = true; effectiveLift = previousLift; effectiveTrap = 1;
    reason = 'La trampa permanece abierta mientras el conjunto está elevado. Primero debe quedar libre el paso en la preparación posterior.';
  } else if (requestedLift > previousLift + 1e-9 && !trapFullyOpen) {
    blocked = true; effectiveLift = previousLift;
    reason = 'Abre completamente la trampa antes de elevar. Este bloqueo es solo del visor; el sistema real requiere su propio enclavamiento.';
  }
  return {
    allow: !blocked, blocked, reason,
    requestedLiftProgress: requestedLift, requestedTrapProgress: requestedTrap,
    liftProgress: effectiveLift, trapProgress: effectiveTrap,
    trapFullyOpen: effectiveTrap >= 1 - 1e-9,
    digitalInterlockOnly: true
  };
}

/** Two ramps along Z and an elevated flat band across the entire X width.
 * No side ramps: the width never grows to accommodate the rise. Only the depth
 * grows when the slope requires it. Geometry only, with no structure approved.
 * flatLengthM remains an accepted legacy input but cannot shorten the full band.
 */
export function evaluateStageLayout({
  baseHeightM = 2, centralHeightM = 2.75, flatLengthM = 8, flatWidthM = 4.3,
  slopeDeg = 10, baseWidth = 8, baseDepth = 6
} = {}) {
  const values = [baseHeightM, centralHeightM, flatLengthM, flatWidthM, slopeDeg, baseWidth, baseDepth];
  if (!values.every(finite) || baseHeightM < 0 || centralHeightM < baseHeightM || flatLengthM <= 0 || flatWidthM <= 0 || baseWidth <= 0 || baseDepth <= 0 || slopeDeg < 10 || slopeDeg > 15) return null;
  const riseM = centralHeightM - baseHeightM;
  const runM = riseM > 0 ? riseM / Math.tan(slopeDeg * Math.PI / 180) : 0;
  const bandLengthM = baseWidth;
  const overallLengthM = baseWidth;
  const overallWidthM = Math.max(baseDepth, flatWidthM + 2 * runM);
  const runZM = (overallWidthM - flatWidthM) / 2;
  const actualSlopeDegZ = riseM ? Math.atan2(riseM, runZM) * 180 / Math.PI : 0;
  const x = bandLengthM / 2, z = flatWidthM / 2, oz = overallWidthM / 2;
  return {
    layoutType: 'two-ramps-full-width-band', rampCount: 2,
    flatAcrossWidth: true, noXSlopes: true,
    baseHeightM, centralHeightM, riseM, flatLengthM: bandLengthM, flatWidthM,
    requestedFlatLengthM: flatLengthM,
    requestedSlopeDeg: slopeDeg, slopeDeg, runM, rampRunM: runM,
    actualRunXM: 0, actualRunZM: runZM,
    actualSlopeDegX: 0, actualSlopeDegZ, maxActualSlopeDeg: actualSlopeDegZ,
    overallLengthM, overallWidthM,
    addedWidthM: 0,
    addedDepthM: Math.max(0, overallWidthM - baseDepth),
    flatBandBoundsM: {min: [-x, centralHeightM, -z], max: [x, centralHeightM, z]},
    rampTopPolygonsM: [-1, 1].map(s => [
      [-x, centralHeightM, s*z], [-x, baseHeightM, s*oz],
      [x, baseHeightM, s*oz], [x, centralHeightM, s*z]
    ]),
    centralFlat: true, proposedOnly: true, structuralApproval: false,
    accessibilityApproved: false,
    note: 'Franja plana de extremo a extremo y solo dos rampas, delante y detrás. Dimensiones geométricas propuestas; pendiente, circulación, accesibilidad y estructura no están aprobadas.'
  };
}

/** Separate ground, main stage, raised center, platform floor and flower center. */
export function evaluateHeightComparison({
  platformFloorM = DEFAULT_CONFIG.targetPlatformFloorM,
  requestedPlatformFloorM = DEFAULT_CONFIG.requestedPlatformFloorM,
  referenceMaxPlatformFloorM = DEFAULT_CONFIG.referenceMaxPlatformFloorM,
  baseTopM = DEFAULT_CONFIG.stageTopM,
  chamberTopM = DEFAULT_CONFIG.chamberTopM,
  crownOffsetM = DEFAULT_CONFIG.crownOffsetM
} = {}) {
  const values = [platformFloorM, requestedPlatformFloorM, referenceMaxPlatformFloorM, baseTopM, chamberTopM, crownOffsetM];
  if (!values.every(finite) || values.some(v => v < 0)) return null;
  return {
    platformFloorM, requestedPlatformFloorM, referenceMaxPlatformFloorM,
    requestedExceedsReference: requestedPlatformFloorM > referenceMaxPlatformFloorM,
    shownFloorWithinReferenceLimit: platformFloorM <= referenceMaxPlatformFloorM + 1e-9,
    requestedExcessM: Math.max(0, requestedPlatformFloorM - referenceMaxPlatformFloorM),
    differenceToRequestedM: requestedPlatformFloorM - platformFloorM,
    floorAboveBaseM: platformFloorM - baseTopM,
    floorAboveCenterM: platformFloorM - chamberTopM,
    platformAboveBaseM: platformFloorM - baseTopM,
    platformAboveCenterM: platformFloorM - chamberTopM,
    crownHeightM: platformFloorM + crownOffsetM,
    crownAboveBaseM: platformFloorM + crownOffsetM - baseTopM,
    crownAboveCenterM: platformFloorM + crownOffsetM - chamberTopM,
    baseTopM, chamberTopM, crownOffsetM,
    workingHeightNotUsed: true,
    source: 'https://www.haulotte.com.es/es_ES/productos/compact-12',
    status: 'Ficha actual de referencia; año/serie y configuración real pendientes. No acredita el accesorio ni la operación.'
  };
}

/**
 * Compara envolventes, sin afirmar que se pueda plegar o fabricar el paquete.
 * stageTopM es cara superior de tarima: su espesor se descuenta expresamente.
 * La carcasa rectangular anterior se conserva como comparación de 0,47m de alto.
 */
export function evaluateClearance({
  stageTopM = DEFAULT_CONFIG.stageTopM,
  machineCompactTopM = DEFAULT_CONFIG.machineCompactTopM,
  packHeightM = DEFAULT_CONFIG.packHeightM,
  packMode = DEFAULT_CONFIG.packMode,
  packLengthM,
  packWidthM,
  hoopAxesM,
  crownDiameterM = DEFAULT_CONFIG.crownDiameterM,
  platformLengthM = DEFAULT_CONFIG.platformLengthM,
  platformWidthM = DEFAULT_CONFIG.platformWidthM,
  deckThicknessM = 0,
  extraAllowanceM = 0
} = {}) {
  const values = [stageTopM, machineCompactTopM, packHeightM, platformLengthM, platformWidthM, deckThicknessM, extraAllowanceM];
  if (!values.every(finite) || values.some(v => v < 0) || platformLengthM === 0 || platformWidthM === 0 || !['circle', 'box', 'organic'].includes(packMode)) return null;
  if (packMode === 'circle' && (!finite(crownDiameterM) || crownDiameterM <= 0)) return null;
  const suppliedAxes = hoopAxesM !== undefined ? hoopAxesM : packLengthM !== undefined || packWidthM !== undefined ? [packLengthM,packWidthM] : null;
  if (suppliedAxes !== null && (!Array.isArray(suppliedAxes) || suppliedAxes.length < 2 || !suppliedAxes.slice(0,2).every(v=>finite(v)&&v>0))) return null;
  const organicLengthM = suppliedAxes ? suppliedAxes[0] : null, organicWidthM = suppliedAxes ? suppliedAxes[1] : null;
  const nominalGapM = stageTopM - machineCompactTopM;
  const availableGapM = nominalGapM - deckThicknessM - extraAllowanceM;
  const remainingGapM = availableGapM - packHeightM;
  const diagonalM = Math.hypot(platformLengthM, platformWidthM);
  const radialGapM = packMode === 'circle' ? (crownDiameterM - diagonalM) / 2 : null;
  const oldBoxHeightM = .47;
  if (![nominalGapM, availableGapM, remainingGapM, diagonalM].every(finite) || (radialGapM !== null && !finite(radialGapM))) return null;
  return {
    nominalGapM,
    availableGapM,
    remainingGapM,
    diagonalM,
    radialGapM,
    packWidthM: packMode === 'circle' ? crownDiameterM : packMode === 'box' ? platformWidthM : organicWidthM,
    packLengthM: packMode === 'circle' ? crownDiameterM : packMode === 'box' ? platformLengthM : organicLengthM,
    horizontalFitCalculated: false,
    packMode,
    fitsHeight: remainingGapM >= 0,
    oldBoxHeightM,
    oldBoxRemainingGapM: availableGapM - oldBoxHeightM,
    fabricationApproved: false,
    notes: [
      'La separación nominal es la cara superior de tarima menos la altura declarada de máquina; no incluye espesores ni reserva de movimiento.',
      'El disponible descuenta espesor de tarima y reserva extra; la holgura restante descuenta además el paquete propuesto.',
      'La forma y altura del paquete son envolventes editables de estudio: no demuestran un plegado elástico realizable.',
      packMode === 'organic' ? 'Alturas únicamente: no prueba encaje horizontal. Los ejes del paquete son datos de la escena; los aros elípticos requieren comprobar las cuatro esquinas de la plataforma y el recorrido.' : 'La holgura radial, cuando se informa, compara solo una circunferencia con la diagonal rectangular; no comprueba barandillas, recorrido ni montaje.',
      'fitsHeight solo compara alturas. No aprueba fabricación, resistencia, sujeción ni operación de una elevadora.'
    ]
  };
}

/**
 * Comparación estática de arrastre para un área PROYECTADA ya expresada en m².
 * Se informa el pico de ráfaga. Cd, densidad y altura resultante son supuestos;
 * rangeN varía Cd0,8–1,8, no es un intervalo de confianza ni un rango seguro.
 * No se aplica descuento por franjas, permeabilidad ni superficie solapada.
 */
export function evaluateWind({
  speedMps = 3,
  gustFactor = 1.3,
  densityKgM3 = .9,
  cd = 1.2,
  projectedAreaM2,
  forceHeightM
} = {}) {
  const values = [speedMps, gustFactor, densityKgM3, cd, projectedAreaM2, forceHeightM];
  if (!values.every(finite) || speedMps < 0 || gustFactor < 1 || densityKgM3 <= 0 || cd < 0 || projectedAreaM2 < 0 || forceHeightM < 0) return null;
  const peakSpeedMps = speedMps * gustFactor;
  const meanQPa = .5 * densityKgM3 * speedMps * speedMps;
  const qPa = .5 * densityKgM3 * peakSpeedMps * peakSpeedMps;
  const forceN = qPa * cd * projectedAreaM2;
  const momentNm = forceN * forceHeightM;
  const rangeN = [qPa * .8 * projectedAreaM2, qPa * 1.8 * projectedAreaM2];
  if (![peakSpeedMps, meanQPa, qPa, forceN, momentNm, ...rangeN].every(finite)) return null;
  return {
    peakSpeedMps,
    qPa,
    forceN,
    momentNm,
    rangeN,
    meanQPa,
    meanForceN: meanQPa * cd * projectedAreaM2,
    projectedAreaM2,
    forceHeightM,
    cd,
    densityKgM3,
    calculation: 'pico de ráfaga, F=0,5ρV²CdA; M=Fh',
    stabilityCalculated: false,
    operatingLimitCalculated: false,
    assumptions: [
      'Área proyectada y altura resultante deben proceder de la geometría y del caso que se estudia.',
      'Densidad y Cd son supuestos editables, sin calibración del conjunto escénico.',
      'No se descuenta fuerza automáticamente por franjas, huecos o membrana permeable.',
      'No se evalúa vuelco, flexión de máquina, sujeción, interferencias ni umbral seguro de operación.'
    ],
    source: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/'
  };
}

export function describeLimits() {
  return [
    'Secuencia cinemática ilustrativa con apertura de trampa antes de elevar; no controla la elevadora real ni sustituye un enclavamiento físico.',
    'Plegado, fuerza de retención y apertura del aro de memoria pendientes de prototipo.',
    'Holguras geométricas y comparación aerodinámica no autorizan el accesorio ni su operación.',
    'Haulotte Compact12 identificada; año/serie, medición real, fijaciones admitidas y evaluación del conjunto siguen pendientes.'
  ];
}
