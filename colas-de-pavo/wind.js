/**
 * CP03 · Comparación de viento sobre la superficie del abanico.
 * SI: metros, segundos, kilogramos, newtons y N·m. Sin dependencias.
 * Aproximación de arrastre por silueta: no es CFD, FEM ni estabilidad humana.
 * Vista CP03: seis venas curvas firmes, con pequeña flexión cuasiestática aproximada.
 * La parábola posterior define el reposo; ondas solo en la tela y la punta libre.
 * Esta convención visual no establece la rigidez real ni la capacidad de las varillas.
 * Referencias y alcance: sources.json / materiales-research.json.
 */
export const DEFAULT_WIND = Object.freeze({
  windSpeedMps: 0,
  windAzimuthDeg: 0,
  gustFactor: 1,
  cd: 1.28,
  cdRange: Object.freeze([0.8, 1.8]),
  airDensity: 0.9,
  normal: Object.freeze([0, 0, 1]),
  ventilationPct: 0,
});
export const STANDARD_GRAVITY = 9.80665;
export const OZ_PER_YD2_TO_G_PER_M2 = 28.349523125 / (0.9144 ** 2);

export const MATERIALS = Object.freeze([
  Object.freeze({id:'mesh17',name:'Malla ultraligera',reference:'RBTR NS50, nylon 10D sin recubrimiento',arealDensityGm2:0.5*OZ_PER_YD2_TO_G_PER_M2,thicknessMicron:null,printStatus:'Por probar',massStatus:'Conversión de 0,5 oz/yd² publicada por el proveedor',sourceId:'rbtr-ns50',sourceUrl:'https://ripstopbytheroll.com/products/0-5-oz-ns50-noseeum-mesh',note:'Malla abierta como referencia de ligereza. Sublimación y fidelidad del estampado no confirmadas. Su trama no proporciona por sí sola un Cd.'}),
  Object.freeze({id:'nylon22',name:'Tafetán ultraligero',reference:'RBTR MEMBRANE 10, nylon 10D calandrado con DWR',arealDensityGm2:22.4,thicknessMicron:null,printStatus:'Por probar',massStatus:'Gramaje publicado por el proveedor',sourceId:'rbtr-membrane10',sourceUrl:'https://ripstopbytheroll.com/products/0-66-oz-membrane-10-taffeta-nylon-1',note:'Referencia de tacto muy ligero. El fabricante declara resistencia al viento; respirable no significa que descargue la vela. Sublimación no confirmada.'}),
  Object.freeze({id:'film17',name:'Película PET de 12 µm',reference:'Mylar A, 12 µm',arealDensityGm2:1000/58.779,thicknessMicron:12,printStatus:'Por probar',massStatus:'Calculado como 1000/58,779 m²/kg de la ficha del fabricante',sourceId:'mylar-a12',sourceUrl:'https://mylar.com/wp-content/uploads/2025/08/mylar_a_12-75_micron_made_in_usa-1.pdf',note:'Película continua transparente, sin permeabilidad aerodinámica caracterizada aquí. Tinta, impresión, ruido, plegado y resistencia del borde requieren muestra. No se presupone sublimación.'}),
  Object.freeze({id:'voile50',name:'Voile escénico imprimible',reference:'ShowTex Voile CS Print, 100 % TCS',arealDensityGm2:50,thicknessMicron:null,printStatus:'Transferencia/UV en 300 cm; UV en 500 cm',printWidthSublimationCm:300,printWidthUvCm:500,massStatus:'Gramaje publicado por el fabricante',sourceId:'showtex-voile',sourceUrl:'https://www.showtex.com/en/products/soft-goods/backdrops-ceilings/printables-lasercut/voile-cs-print',note:'Tela translúcida con impresión confirmada: variante de 310 cm/300 imprimibles admite transferencia y UV; variante de 505 cm/500 imprimibles solo UV. Pesa más que las otras referencias. La impresión no determina el Cd.'}),
]);

const finite = (name, value, fallback) => {
  const v = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(v)) throw new TypeError(name+' debe ser un número finito');
  return v;
};
const nonnegative = (name, value, fallback) => {
  const v = finite(name, value, fallback);
  if (v < 0) throw new RangeError(name+' no puede ser negativo');
  return v;
};
const positive = (name, value, fallback) => {
  const v = finite(name, value, fallback);
  if (v <= 0) throw new RangeError(name+' debe ser mayor que cero');
  return v;
};
const vec3 = v => {
  if ((!Array.isArray(v) && !ArrayBuffer.isView(v)) || v.length !== 3) throw new TypeError('normal debe contener tres componentes');
  const a = Array.from(v, (x,i) => finite('normal['+i+']',x));
  const l = Math.hypot(...a);
  if (l < 1e-12) throw new RangeError('normal no puede ser un vector nulo');
  return a.map(x => x/l);
};

/**
 * @param {object} input
 * areaM2: proyección XY actual de la envolvente curva, sin corregir por dirección del aire.
 * Se aplica una sola normal de referencia; no se integran ángulos ni presiones locales de la curva.
 * skinAreaM2: área REAL 3D del material curvo, independiente del cierre del abanico.
 * normal: normal unitaria del plano de referencia (se normaliza).
 * windAzimuthDeg: dirección HACIA DONDE viaja el aire, 0°=+Z, 90°=+X.
 * gustFactor: factor de VELOCIDAD (1.5 multiplica la fuerza por 2.25).
 * cd: hipótesis del escenario; 1.28 es referencia NASA de placa rígida.
 * cdRange: dos hipótesis para sensibilidad; NO límites de la cola real.
 * ventilationPct: información de la propuesta visual, sin descuento en el cálculo.
 * pressureHeightM: altura SUPUESTA de la resultante respecto al suelo.
 * pivotHeightM: altura del pivote del objeto; no se modela el cuerpo humano.
 */
export function evaluateWind(input = {}) {
  const areaM2 = nonnegative('areaM2',input.areaM2,0);
  const skinAreaM2 = nonnegative('skinAreaM2',input.skinAreaM2,areaM2);
  const meanSpeedMps = nonnegative('windSpeedMps',input.windSpeedMps,DEFAULT_WIND.windSpeedMps);
  const gustFactor = positive('gustFactor',input.gustFactor,DEFAULT_WIND.gustFactor);
  const speedMps = meanSpeedMps*gustFactor;
  const cd = nonnegative('cd',input.cd,DEFAULT_WIND.cd);
  const airDensity = positive('airDensity',input.airDensity,DEFAULT_WIND.airDensity);
  const azimuthDeg = finite('windAzimuthDeg',input.windAzimuthDeg,DEFAULT_WIND.windAzimuthDeg);
  const normal = vec3(input.normal ?? DEFAULT_WIND.normal);
  const angle = azimuthDeg*Math.PI/180;
  const windDirection = [Math.sin(angle),0,Math.cos(angle)];
  let incidenceFactor = Math.abs(normal.reduce((sum,n,i)=>sum+n*windDirection[i],0));
  incidenceFactor = incidenceFactor < 1e-12 ? 0 : Math.min(1,incidenceFactor);
  const projectedAreaM2 = areaM2*incidenceFactor;
  const qPa = 0.5*airDensity*speedMps*speedMps;
  const forceN = qPa*cd*projectedAreaM2;
  const forceVectorN = windDirection.map(n=>n*forceN);
  const range = input.cdRange ?? DEFAULT_WIND.cdRange;
  if ((!Array.isArray(range) && !ArrayBuffer.isView(range)) || range.length!==2) throw new TypeError('cdRange debe contener dos hipótesis');
  const cdRange = Array.from(range,(v,i)=>nonnegative('cdRange['+i+']',v)).sort((a,b)=>a-b);
  const forceRangeN = cdRange.map(c=>qPa*c*projectedAreaM2);
  const faceOnForceN = qPa*cd*areaM2;
  const faceOnRangeN = cdRange.map(c=>qPa*c*areaM2);
  const pressureHeightM = nonnegative('pressureHeightM',input.pressureHeightM,0);
  const pivotHeightM = nonnegative('pivotHeightM',input.pivotHeightM,0);
  const pivotLeverM = pressureHeightM-pivotHeightM;
  const groundMomentNm = forceN*pressureHeightM;
  const pivotMomentNm = forceN*Math.abs(pivotLeverM);
  const groundMomentVectorNm = [forceVectorN[2]*pressureHeightM,0,-forceVectorN[0]*pressureHeightM];
  const pivotMomentVectorNm = [forceVectorN[2]*pivotLeverM,0,-forceVectorN[0]*pivotLeverM];
  const arealDensityGm2 = nonnegative('arealDensityGm2',input.arealDensityGm2,0);
  const additionalArealDensityGm2 = nonnegative('additionalArealDensityGm2',input.additionalArealDensityGm2,0);
  const skinMassKg = skinAreaM2*(arealDensityGm2+additionalArealDensityGm2)/1000;
  const reinforcementMassKg = nonnegative('reinforcementMassKg',input.reinforcementMassKg,0);
  const ventilationPct = finite('ventilationPct',input.ventilationPct,0);
  if (ventilationPct<0 || ventilationPct>100) throw new RangeError('ventilationPct debe estar entre 0 y 100');
  const includedMassKg = skinMassKg+reinforcementMassKg;
  for(const n of [qPa,forceN,groundMomentNm,pivotMomentNm,includedMassKg])if(!Number.isFinite(n))throw new RangeError('El escenario excede el rango numérico');
  return {
    model:'surrogate-projected-area-CP03',uncalibratedScenario:true,
    areaM2,skinAreaM2,normal,windDirection,windAzimuthDeg:azimuthDeg,
    meanSpeedMps,gustFactor,speedMps,airDensity,cd,cdRange,incidenceFactor,
    projectedAreaM2,qPa,forceN,forceVectorN,forceRangeN,faceOnForceN,faceOnRangeN,
    pressureHeightM,pivotHeightM,pivotLeverM,groundMomentNm,pivotMomentNm,
    groundMomentVectorNm,pivotMomentVectorNm,
    forceKgfEquivalent:forceN/STANDARD_GRAVITY,
    arealDensityGm2,additionalArealDensityGm2,skinMassKg,reinforcementMassKg,includedMassKg,
    ventilationPct,ventilationApplied:false,
    exclusions:['Arrastre de varillas, herrajes, arnés e intérprete','Sustentación, succión y fluctuación de presión','Picos de flameo, interacción entre las cinco colas y estela','Rigidez real, frecuencias, fatiga y capacidad de las uniones','Equilibrio, agarre al suelo y estabilidad del intérprete'],
    caveats:[
      'Fuerza de comparación sobre la superficie; no es la carga total ni una predicción validada de la cola.',
      'Cd y altura de la resultante son hipótesis. La referencia de placa plana y normal única aproxima una envolvente curva, sin CFD ni presión local. El rango es sensibilidad elegida, no incertidumbre medida ni límite superior.',
      'Las aberturas y el tipo de tela no descuentan fuerza automáticamente: requieren ensayar la cola con su forma, tensión e impresión.',
      'El cero de canto pertenece al modelo de proyección con normal única: no implica carga nula en las caras curvas, varillas, cuerpo o turbulencia que el cálculo no resuelve.',
      'kgf es una equivalencia de fuerza; no es masa del objeto ni capacidad que pueda sostener una persona.',
      'La vista combina una curva de reposo de seis venas firmes, una pequeña flexión cuasiestática de referencia y ondas de tela anclada/punta libre. La relajación temporal es ilustrativa; no predice vibración, frecuencia ni capacidad real.',
    ],
  };
}

/**
 * CP03 · Flexión exploratoria de cada vena como voladizo RECTO equivalente.
 * MIT 1.050, tabla "Uniformly Loaded Cantilever": δtip=wL⁴/(8EI).
 * Fi=wL da δtip=FiL³/(8EI); g(s)=s²(6−4s+s²)/3 normaliza la forma.
 * Sobre una vena ya curva esto es solo una aproximación visual lineal.
 */
export const DEFAULT_RIB_BENDING = Object.freeze({
  flexuralRigidityNm2:1000,
  visualLimitRatio:0.08,
  linearRangeFlagRatio:0.1,
  visualRelaxationTimeS:0.45,
});

export function cantileverUniformLoadShape(s) {
  const t=finite('s',s,0);
  if(t<0 || t>1)throw new RangeError('s debe estar entre 0 y 1');
  return t*t*(6-4*t+t*t)/3;
}

/**
 * totalForceN es una fuerza TRANSVERSAL equivalente, repartida por igual.
 * El signo solo indica dirección de la flexión. rodLengthsM usa longitud de
 * arco como aproximación a la longitud del voladizo recto equivalente.
 * EI no está obtenido de un material, sección o ensayo de las venas reales.
 * El tope gráfico no reduce el resultado bruto ni prueba que no haya daño.
 */
export function estimateRibBending({totalForceN=0,rodLengthsM,flexuralRigidityNm2=DEFAULT_RIB_BENDING.flexuralRigidityNm2,visualLimitRatio=DEFAULT_RIB_BENDING.visualLimitRatio}={}) {
  const force=finite('totalForceN',totalForceN,0);
  if((!Array.isArray(rodLengthsM)&&!ArrayBuffer.isView(rodLengthsM))||rodLengthsM.length===0)throw new TypeError('rodLengthsM debe contener al menos una longitud');
  const lengths=Array.from(rodLengthsM,(v,i)=>positive('rodLengthsM['+i+']',v));
  const EI=positive('flexuralRigidityNm2',flexuralRigidityNm2);
  const capRatio=nonnegative('visualLimitRatio',visualLimitRatio);
  if(capRatio>1)throw new RangeError('visualLimitRatio debe estar entre 0 y 1');
  const ribCount=lengths.length,forcePerRibN=force/ribCount;
  const perRib=lengths.map((lengthM,index)=>{
    const distributedLoadNm=forcePerRibN/lengthM;
    const tipDeflectionM=forcePerRibN*lengthM**3/(8*EI);
    if(!Number.isFinite(tipDeflectionM))throw new RangeError('El escenario de flexión excede el rango numérico');
    const tipDeflectionRatio=Math.abs(tipDeflectionM)/lengthM;
    const visualLimitM=capRatio*lengthM;
    const visualDeflectionM=Math.sign(tipDeflectionM)*Math.min(Math.abs(tipDeflectionM),visualLimitM);
    return {index,lengthM,forceN:forcePerRibN,distributedLoadNm,tipDeflectionM,rawTipDeflectionM:tipDeflectionM,rawTipM:tipDeflectionM,tipDeflectionRatio,visualLimitM,visualDeflectionM,visualTipM:visualDeflectionM,visualDeflectionRatio:Math.abs(visualDeflectionM)/lengthM,visualCapped:Math.abs(tipDeflectionM)>visualLimitM,linearRangeExceeded:tipDeflectionRatio>DEFAULT_RIB_BENDING.linearRangeFlagRatio};
  });
  const maxAbsTipDeflectionM=Math.max(...perRib.map(r=>Math.abs(r.tipDeflectionM)));
  const maxVisualTipDeflectionM=Math.max(...perRib.map(r=>Math.abs(r.visualDeflectionM)));
  const maxTipDeflectionRatio=Math.max(...perRib.map(r=>r.tipDeflectionRatio));
  return {
    model:'straight-equivalent-uniform-cantilever-CP03',uncalibratedScenario:true,
    ribCount,totalForceN:force,forcePerRibN,flexuralRigidityNm2:EI,
    visualLimitRatio:capRatio,linearRangeFlagRatio:DEFAULT_RIB_BENDING.linearRangeFlagRatio,
    perRib,maxAbsTipDeflectionM,maxRawTipDeflectionM:maxAbsTipDeflectionM,maxRawTipM:maxAbsTipDeflectionM,
    maxVisualTipDeflectionM,maxTipDeflectionRatio,
    visualCapped:perRib.some(r=>r.visualCapped),linearRangeExceeded:perRib.some(r=>r.linearRangeExceeded),
    shapeFormula:'g(s)=s²(6−4s+s²)/3; s=x/L',
    sourceId:'mit-uniform-cantilever',
    assumptions:[
      'Fuerza de superficie repartida por igual entre las venas, como carga transversal uniforme equivalente. No se resuelve el reparto real de la tela.',
      'Vena sustituida por un voladizo recto, empotrado, de EI constante; se usa su longitud de arco como aproximación. La curvatura inicial no está resuelta.',
      'Modelo lineal de pequeña deformación. δ/L>0,1 es un indicador elegido del alcance de la aproximación, no límite de resistencia ni criterio admisible.',
      'EI=1000 N·m² es una hipótesis de exploración ajustable, sin sección o material seleccionados ni valor ensayado.',
      'El tope de 0,08L solo limita el dibujo; δ bruto queda visible. No limita la carga física ni valida capacidad.',
      'La relajación visual de 0,45 s no procede de masa modal, amortiguamiento ni frecuencia medidos. No predice flameo o vibración real.',
    ],
  };
}

/** Cd aparente de un ensayo en la MISMA geometría y área de referencia. */
export function calibrateCd({forceN,areaM2,windSpeedMps,airDensity=DEFAULT_WIND.airDensity,normal=DEFAULT_WIND.normal,windAzimuthDeg=0}) {
  const F=nonnegative('forceN',forceN,0);
  const ref=evaluateWind({areaM2,windSpeedMps,airDensity,normal,windAzimuthDeg,cd:1});
  if(ref.qPa*ref.projectedAreaM2<=0)throw new RangeError('La calibración necesita viento y área proyectada mayores que cero');
  return {cd:F/(ref.qPa*ref.projectedAreaM2),scope:'Coeficiente aparente de esta muestra, orientación, forma y ensayo; no transferir a otra configuración sin validación.',referenceAreaM2:areaM2,projectedAreaM2:ref.projectedAreaM2};
}
