/* F02 — stage and upward-opening trap kinematics, in metres.
 * Dimensions are scene proposals. This is not a structural design, a selected
 * actuator, a load rating, or an approved modification of stage/lift equipment.
 */
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const V = a => new THREE.Vector3(...a);
const D2R = Math.PI / 180;

export function createStageTrap({config = {}} = {}) {
  const cfg = {
    stageBaseTopM: finite(config.stageBaseTopM ?? config.stageTopM, 2),
    centralTopM: finite(config.chamberTopM ?? config.centralTopM, 2.75),
    flatLengthM: finite(config.flatLengthM, 4.8),
    flatWidthM: finite(config.flatWidthM, 4.3),
    openingLengthM: finite(config.openingLengthM, 4.2),
    openingWidthM: finite(config.openingWidthM, 3.7),
    originalBaseLengthM: finite(config.stageWidthM, 8),
    originalBaseWidthM: finite(config.stageDepthM, 6),
    slopeDeg: finite(config.slopeDeg, 10),
    deckThicknessM: finite(config.deckThicknessM ?? config.stageThicknessM, .18)
  };
  cfg.flatLengthM = Math.max(cfg.openingLengthM + .3, cfg.flatLengthM);
  cfg.flatWidthM = Math.max(cfg.openingWidthM + .3, cfg.flatWidthM);
  let state = {
    chamberTopM: Math.max(cfg.stageBaseTopM, cfg.centralTopM),
    slopeDeg: clamp(cfg.slopeDeg, 10, 15),
    deckThicknessM: clamp(cfg.deckThicknessM, 0, .3),
    trapProgress: 0,
    showStage: true,
    cutaway: false,
    colors: false,
    mechanismFocus: false
  };
  const root = new THREE.Group();
  root.name = 'F02_Tarima_y_trampa_CINEMATICA_PROPUESTA';
  const groups = {}, parts = [], materials = new Set(), originalMaterials = new Map();
  const group = (code, title, description) => {
    const g = new THREE.Group();
    g.name = code; g.userData = {code, title, description, proposed: true};
    root.add(g); groups[code] = g; parts.push(g); return g;
  };
  const TAR = group('TAR', 'Tarimas con pendientes suaves', 'Superficies de escena a 2 m, con rampas de 10 a 15 grados hacia el centro plano. La huella se amplía según la pendiente. Estructura, accesos y capacidad de las tarimas pendientes de diseño.');
  const CAM = group('CAM', 'Zona central plana de la trampa', 'La zona central permanece horizontal a la cota elegida. El aro de piso y el marco representados son una propuesta de espacio, no una sección ni un soporte dimensionado.');
  const TRP = group('TRP', 'Dos hojas rígidas de trampa', 'Dos hojas abren hacia arriba sobre bisagras laterales. Se detienen a 90 grados antes de elevar la flor y permanecen abiertas durante la escena. El cierre se prepara después de recoger la flor, no con ella levantada.');
  const HIN = group('HIN', 'Bisagras y ejes laterales', 'Los ejes de giro permanecen fijos. La trampa no desaparece: cada hoja conserva sus dimensiones durante la apertura. Secciones, anclajes y capacidad por definir.');
  const ACT = group('ACT', 'Accionamiento independiente: esquema', 'Elementos telescópicos muestran cómo aplicar un giro desde un marco fijo. No son una selección de actuadores, un circuito ni una prescripción de montaje. El control de la trampa es independiente de la elevadora.');
  const RET = group('RET', 'Topes y retención abierta', 'Topes limitan el giro a 90 grados. Una retención independiente se representa acoplada al completar la apertura. La elevación debe esperar a la confirmación de apertura; el visor no acredita un enclavamiento real.');

  function material(color, options = {}) {
    const m = new THREE.MeshStandardMaterial({color, roughness: .88, ...options});
    materials.add(m); return m;
  }
  const stageMat = material('#35494e');
  const fasciaMat = material('#22353b');
  const frameMat = material('#4b5e5e', {metalness: .25, roughness: .62});
  const mechanicalMat = material('#b3b6a7', {metalness: .55, roughness: .4});
  const rodMat = material('#d8dbce', {metalness: .7, roughness: .25});
  const barrelMat = material('#5d7769', {metalness: .3, roughness: .48});
  const doorTopMat = material('#35494e');
  const doorUnderMat = material('#31594b', {roughness: .82});
  const doorEdgeMat = material('#263e3e');
  const retainMat = material('#899b70', {metalness: .25, roughness: .6});
  const openLamp = material('#e2bb78', {emissive: '#47361e', emissiveIntensity: .12});
  const construction = {
    TAR: material('#76949b'), CAM: material('#b9ac7c'), TRP: material('#699b7c'),
    HIN: material('#d2b36d'), ACT: material('#b17f60'), RET: material('#a8bd75')
  };
  const addMesh = (g, geometry, mat, name) => {
    const m = new THREE.Mesh(geometry, mat);
    m.name = name || g.name + '_' + g.children.length;
    m.castShadow = true; m.receiveShadow = true;
    originalMaterials.set(m, mat); g.add(m); return m;
  };
  const unitBox = (g, mat, name) => addMesh(g, new THREE.BoxGeometry(1, 1, 1), mat, name);
  function boxTransform(m, x, y, z, sx, sy, sz) {
    m.position.set(x, y, z); m.scale.set(Math.max(.001, sx), Math.max(.001, sy), Math.max(.001, sz));
  }
  function between(m, a, b, lengthFraction = 1, offset = 0) {
    const delta = b.clone().sub(a), length = delta.length();
    const dir = length ? delta.clone().divideScalar(length) : UP;
    m.position.copy(a).addScaledVector(dir, offset + length * lengthFraction / 2);
    m.quaternion.setFromUnitVectors(UP, dir);
    m.scale.y = Math.max(.001, length * lengthFraction);
    return length;
  }

  // Prisms use independent face vertices, so a ramp remains a flat plane and no
  // wireframe/triangulation edges are drawn over the deck.
  function quadPrism() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
    return geometry;
  }
  function updatePrism(geometry, top, depth) {
    const bottom = top.map(p => new THREE.Vector3(p.x, p.y - depth, p.z));
    const vertices = [];
    const face = (a, b, c, d) => vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
    face(top[0], top[1], top[2], top[3]);
    face(bottom[3], bottom[2], bottom[1], bottom[0]);
    for (let i = 0; i < 4; i++) face(top[i], bottom[i], bottom[(i + 1) % 4], top[(i + 1) % 4]);
    geometry.attributes.position.array.set(vertices); geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  }
  const ramps = [-1, 1].flatMap(sign => [
    {axis: 'x', sign, mesh: addMesh(TAR, quadPrism(), stageMat, `TAR_Rampa_X_${sign}`)},
    {axis: 'z', sign, mesh: addMesh(TAR, quadPrism(), stageMat, `TAR_Rampa_Z_${sign}`)}
  ]);
  const fascias = ['left', 'right', 'back', 'front'].map(side => ({side, mesh: unitBox(TAR, fasciaMat, 'TAR_Fascia_' + side)}));
  const legs = [-1, 1].flatMap(x => [-1, 1].map(z => ({x, z, mesh: unitBox(TAR, frameMat, `TAR_Apoyo_contexto_${x}_${z}`)})));
  const centralDeck = [-1, 1].flatMap(sign => [
    {axis: 'x', sign, mesh: unitBox(CAM, stageMat, `CAM_Margen_X_${sign}`)},
    {axis: 'z', sign, mesh: unitBox(CAM, stageMat, `CAM_Margen_Z_${sign}`)}
  ]);
  const centralSupports = [-1, 1].flatMap(x => [-1, 1].map(z => ({x, z, mesh: unitBox(CAM, frameMat, `CAM_Apoyo_contexto_${x}_${z}`)})));
  const frameBeams = [-1, 1].flatMap(sign => [
    {axis: 'x', sign, mesh: unitBox(CAM, frameMat, `CAM_Marco_X_${sign}`)},
    {axis: 'z', sign, mesh: unitBox(CAM, frameMat, `CAM_Marco_Z_${sign}`)}
  ]);

  const halfDoor = cfg.openingLengthM / 2;
  const doors = [-1, 1].map(sign => {
    const pivot = new THREE.Group(); pivot.name = sign < 0 ? 'TRP_Eje_izquierdo' : 'TRP_Eje_derecho'; TRP.add(pivot);
    const leaf = addMesh(pivot, new THREE.BoxGeometry(1, 1, 1), [doorEdgeMat, doorEdgeMat, doorTopMat, doorUnderMat, doorEdgeMat, doorEdgeMat], sign < 0 ? 'TRP_Hoja_izquierda' : 'TRP_Hoja_derecha');
    leaf.position.x = -sign * halfDoor / 2;
    leaf.scale.set(halfDoor, state.deckThicknessM, cfg.openingWidthM);
    // A discreet botanical motif on the underside relates the open trap to the
    // calyx. These are finish lines, never a wireframe of the panel geometry.
    const veinGeometry = new THREE.BufferGeometry();
    const points = [];
    const side = -sign;
    for (let i = -3; i <= 3; i++) {
      const z = i * cfg.openingWidthM / 8;
      points.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * halfDoor * .83, 0, z));
    }
    veinGeometry.setFromPoints(points);
    const veinMat = new THREE.LineBasicMaterial({color: '#829d72', transparent: true, opacity: .32}); materials.add(veinMat);
    const veins = new THREE.LineSegments(veinGeometry, veinMat); veins.name = 'TRP_Motivo_vegetal_de_acabado'; pivot.add(veins);
    return {sign, pivot, leaf, veins};
  });
  // This is the real joint between the two closed leaves, not a wireframe or
  // an explanatory leader. Keep it just above the top faces to avoid z-fighting.
  const seamGeometry = new THREE.BufferGeometry().setFromPoints([
    V([0,0,-cfg.openingWidthM/2]),V([0,0,cfg.openingWidthM/2])
  ]);
  const seamMaterial = new THREE.LineBasicMaterial({color:'#14272b'});materials.add(seamMaterial);
  const closedSeam = new THREE.Line(seamGeometry,seamMaterial);
  closedSeam.name='TRP_Junta_central_entre_hojas_cerradas';TRP.add(closedSeam);
  const hingeBarrels = [];
  for (const sign of [-1, 1]) for (const z of [-.82, -.41, 0, .41, .82]) {
    const m = addMesh(HIN, new THREE.CylinderGeometry(.035, .035, .25, 10), mechanicalMat, `HIN_Eje_${sign}_${z}`);
    m.rotation.x = Math.PI / 2; hingeBarrels.push({sign, z, mesh: m});
  }
  const actuators = [];
  for (const sign of [-1, 1]) for (const side of [-1, 1]) {
    const body = addMesh(ACT, new THREE.CylinderGeometry(.038, .038, 1, 12), barrelMat, `ACT_Cuerpo_${sign}_${side}`);
    const rod = addMesh(ACT, new THREE.CylinderGeometry(.017, .017, 1, 10), rodMat, `ACT_Vastago_${sign}_${side}`);
    const basePin = addMesh(ACT, new THREE.SphereGeometry(.052, 10, 8), mechanicalMat, 'ACT_Articulacion_fija');
    const leafPin = addMesh(ACT, new THREE.SphereGeometry(.043, 10, 8), mechanicalMat, 'ACT_Articulacion_movil');
    actuators.push({sign, side, body, rod, basePin, leafPin});
  }
  const retainers = [-1, 1].map(sign => {
    const stop = unitBox(RET, frameMat, 'RET_Tope_90grados_' + sign);
    const receiver = unitBox(RET, retainMat, 'RET_Receptor_abierto_' + sign);
    const pin = addMesh(RET, new THREE.CylinderGeometry(.026, .026, .14, 10), mechanicalMat, 'RET_Pasador_retenido_' + sign);
    pin.rotation.x = Math.PI / 2;
    const lamp = addMesh(RET, new THREE.SphereGeometry(.038, 12, 8), openLamp, 'RET_Estado_abierto_' + sign);
    return {sign, stop, receiver, pin, lamp};
  });
  let lastKey = '', metrics = null;

  function layout() {
    const top = state.chamberTopM, base = cfg.stageBaseTopM, t = state.deckThicknessM;
    const rise = Math.max(0, top - base), run = rise / Math.tan(state.slopeDeg * D2R);
    const L = Math.max(cfg.originalBaseLengthM, cfg.flatLengthM + 2 * run);
    const W = Math.max(cfg.originalBaseWidthM, cfg.flatWidthM + 2 * run);
    const x = cfg.flatLengthM / 2, z = cfg.flatWidthM / 2, ox = L / 2, oz = W / 2;
    const hingeY = top - t / 2, angle = state.trapProgress * Math.PI / 2;
    root.visible = state.showStage;
    TAR.visible = !state.mechanismFocus;
    CAM.visible = TRP.visible = HIN.visible = ACT.visible = RET.visible = true;
    for (const ramp of ramps) {
      let points;
      if (ramp.axis === 'x') {
        const s = ramp.sign;
        points = [V([s*x,top,-z]), V([s*x,top,z]), V([s*ox,base,oz]), V([s*ox,base,-oz])];
      } else {
        const s = ramp.sign;
        points = [V([-x,top,s*z]), V([-ox,base,s*oz]), V([ox,base,s*oz]), V([x,top,s*z])];
      }
      // Keep front-facing winding for either side; both top and sides are still
      // solid prisms, not infinitely thin sheets.
      if (ramp.sign < 0) points.reverse();
      updatePrism(ramp.mesh.geometry, points, Math.max(.002, t));
      ramp.mesh.visible = !(state.cutaway && ramp.axis === 'z' && ramp.sign > 0);
    }
    for (const f of fascias) {
      const side = f.side;
      if (side === 'left' || side === 'right') boxTransform(f.mesh, (side === 'left' ? -1 : 1) * ox, (base - t) / 2, 0, .045, base - t, W);
      else boxTransform(f.mesh, 0, (base - t) / 2, (side === 'front' ? 1 : -1) * oz, L, base - t, .045);
      f.mesh.visible = !(state.cutaway && side === 'front');
    }
    for (const leg of legs) {
      boxTransform(leg.mesh, leg.x*(ox-.2), (base-t)/2, leg.z*(oz-.2), .085, base-t, .085);
      leg.mesh.visible = !(state.cutaway && leg.z > 0);
    }
    for (const deck of centralDeck) {
      const s = deck.sign;
      if (deck.axis === 'x') {
        const size = (cfg.flatLengthM - cfg.openingLengthM) / 2;
        boxTransform(deck.mesh, s*(cfg.openingLengthM/2+size/2), top-t/2, 0, size, Math.max(.002,t), cfg.flatWidthM);
      } else {
        const size = (cfg.flatWidthM - cfg.openingWidthM) / 2;
        boxTransform(deck.mesh, 0, top-t/2, s*(cfg.openingWidthM/2+size/2), cfg.openingLengthM, Math.max(.002,t), size);
      }
      deck.mesh.visible = !(state.cutaway && deck.axis === 'z' && s > 0);
    }
    for (const support of centralSupports) {
      boxTransform(support.mesh, support.x*(x-.1), (top-t)/2, support.z*(z-.1), .08, top-t, .08);
      support.mesh.visible = !state.mechanismFocus && !(state.cutaway && support.z>0);
    }
    for (const beam of frameBeams) {
      if (beam.axis === 'x') boxTransform(beam.mesh, beam.sign*cfg.openingLengthM/2, top-t-.09, 0, .12, .15, cfg.openingWidthM+.16);
      else boxTransform(beam.mesh, 0, top-t-.09, beam.sign*cfg.openingWidthM/2, cfg.openingLengthM+.16, .15, .12);
      beam.mesh.visible = !(state.cutaway && beam.axis==='z' && beam.sign>0);
    }
    for (const door of doors) {
      door.pivot.position.set(door.sign*cfg.openingLengthM/2, hingeY, 0);
      door.pivot.rotation.z = -door.sign*angle;
      door.leaf.scale.y = Math.max(.002,t);
      door.veins.position.y = -t/2-.003;
    }
    closedSeam.position.y=top+.002;
    closedSeam.visible=state.trapProgress<.01;
    for (const hinge of hingeBarrels) hinge.mesh.position.set(hinge.sign*cfg.openingLengthM/2,hingeY,hinge.z*cfg.openingWidthM/2);
    root.updateMatrixWorld(true);
    const actuatorLengthsM = [];
    for (const a of actuators) {
      const zPosition = a.side * cfg.openingWidthM * .34;
      const fixed = V([a.sign*(cfg.openingLengthM/2+.30), top-.76, zPosition]);
      const door = doors.find(d=>d.sign===a.sign);
      const moving = door.pivot.localToWorld(V([-a.sign*halfDoor*.35,-t/2,zPosition]));
      const localMoving = root.worldToLocal(moving.clone());
      const length = fixed.distanceTo(localMoving); actuatorLengthsM.push(length);
      between(a.body,fixed,localMoving,.66,0);
      between(a.rod,fixed,localMoving,.42,length*.58);
      a.basePin.position.copy(fixed); a.leafPin.position.copy(localMoving);
    }
    const fullyOpen = state.trapProgress >= 1-1e-6;
    for (const r of retainers) {
      boxTransform(r.stop,r.sign*(cfg.openingLengthM/2+.08),hingeY+.12,-cfg.openingWidthM/2-.09,.16,.20,.16);
      boxTransform(r.receiver,r.sign*cfg.openingLengthM/2,hingeY+.17,-cfg.openingWidthM/2-.08,.15,.13,.12);
      r.pin.position.set(r.sign*cfg.openingLengthM/2,hingeY+.17,-cfg.openingWidthM/2-(fullyOpen?.08:.23));
      r.lamp.position.set(r.sign*(cfg.openingLengthM/2+.14),hingeY+.30,-cfg.openingWidthM/2-.08);
      openLamp.color.set(fullyOpen?'#b6d28d':'#b89a63');
    }
    // Transparency is only the explicit cutaway display. Panel geometry and
    // collision envelope are unchanged at every opening angle.
    for (const m of [doorTopMat,doorUnderMat,doorEdgeMat,construction.TRP]) {
      m.transparent=state.cutaway; m.opacity=state.cutaway?.24:1; m.depthWrite=!state.cutaway;
    }
    for (const g of Object.values(groups)) g.traverse(o=>{
      if(!o.isMesh)return;
      o.material=state.colors?construction[g.name]:originalMaterials.get(o)||o.material;
    });
    root.updateMatrixWorld(true);
    const doorBounds = doors.map(d=>{const b=new THREE.Box3().setFromObject(d.leaf);return{min:b.min.toArray(),max:b.max.toArray()};});
    metrics = {
      revision:'F02',geometricOnly:true,structuralApproval:false,actuatorSelected:false,trapOpeningDirection:'upward',
      baseTopM:base,centralTopM:top,centralPlateauHorizontal:true,deckThicknessM:t,
      flatLengthM:cfg.flatLengthM,flatWidthM:cfg.flatWidthM,
      openingLengthM:cfg.openingLengthM,openingWidthM:cfg.openingWidthM,
      riseM:rise,runM:run,overallLengthM:L,overallWidthM:W,
      slopeDeg:state.slopeDeg,
      actualSlopeXDeg:Math.atan2(rise,Math.max(.000001,(L-cfg.flatLengthM)/2))/D2R,
      actualSlopeZDeg:Math.atan2(rise,Math.max(.000001,(W-cfg.flatWidthM)/2))/D2R,
      doorAnglesDeg:[state.trapProgress*90,state.trapProgress*90],
      signedDoorAnglesDeg:[state.trapProgress*90,-state.trapProgress*90],
      doorDimensionsM:[halfDoor,t,cfg.openingWidthM],
      doorPivots:doors.map(d=>d.pivot.position.toArray()),doorBounds,
      trapFullyOpen:fullyOpen,retentionEngaged:fullyOpen,liftMayProceedInIllustration:fullyOpen,
      clearWidthAtFullOpeningM:fullyOpen?Math.max(0,cfg.openingLengthM-t):null,
      actuatorLengthsM,panelsDisappearDuringOpening:false,
      sequenceRule:'Abrir por completo, confirmar retención y después elevar. Mantener abierta hasta recoger la flor después de la función.',
      limits:'Bisagras, accionamiento, marco, retenciones y tarimas son una explicación cinemática. Masas, fuerzas, apoyos, enclavamientos reales y resistencia pendientes de diseño y aprobación.'
    };
  }
  function setState(next={}) {
    state={...state,...next};
    state.chamberTopM=clamp(finite(state.chamberTopM,cfg.centralTopM),cfg.stageBaseTopM,3);
    state.slopeDeg=clamp(finite(state.slopeDeg,cfg.slopeDeg),10,15);
    state.deckThicknessM=clamp(finite(state.deckThicknessM,cfg.deckThicknessM),0,.3);
    state.trapProgress=clamp(finite(state.trapProgress,0),0,1);
    for(const key of['showStage','cutaway','colors','mechanismFocus'])state[key]=!!state[key];
    const key=JSON.stringify(state);if(key!==lastKey){layout();lastKey=key;}
    return getState();
  }
  function update(){return getState();}
  function getState(){return{...state};}
  function getMetrics(){return JSON.parse(JSON.stringify(metrics));}
  function computeBounds(options={}) {
    root.updateMatrixWorld(true);const b=new THREE.Box3();
    if(!root.visible)return b;
    const mechanismOnly=options.mechanismOnly||options.focus==='mechanism'||options.focus==='trap';
    const add=g=>g.traverseVisible(o=>{if(o.isMesh&&o.geometry){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
    if(mechanismOnly)for(const g of[CAM,TRP,HIN,ACT,RET])add(g);else for(const g of Object.values(groups))if(g.visible)add(g);
    return b;
  }
  function dispose(){const geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
  setState(state);
  return{root,groups,parts,setState,update,getState,getMetrics,computeBounds,dispose};
}
