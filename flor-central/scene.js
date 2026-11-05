/* F02 · study in metres. Opening/folding and fabric motion are illustrative kinematics,
   not an elastic-hoop solution, lift accessory approval or a stability analysis. */
import * as THREE from 'three';
import {createStageTrap} from './stage-trap.js?v=F02';

const TAU = Math.PI * 2, UP = new THREE.Vector3(0, 1, 0);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(v) || 0));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => { const q = clamp(t); return q * q * (3 - 2 * q); };
const V = a => new THREE.Vector3(...a);
const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const pinnedSine = t => t<=1e-12||t>=1-1e-12?0:Math.sin(Math.PI*t);

const DEFAULTS = Object.freeze({
  stageTopM: 2, stageWidthM: 8, stageDepthM: 6, stageThicknessM: .18, deckThicknessM: .18, chamberTopM: 2.75,
  machineCompactTopM: 1.77, compactPlatformFloorM: 1.37, officialCompactTopM: 2.47, storageTopM: 1.77,
  crownOffsetM: .40, railMode: 'project', targetPlatformFloorM: 9.75, targetCrownM: 10.15,
  platformLengthM: 2.4, platformWidthM: 1.17, railHeightM: 1.1, guardrailHeightM: 1.1,
  scissorBarLengthM: 2.2, scissorStages: 5, machineBaseTopM: .45,
  crownDiameterM: 3.0, lowerRingDiameterM: 3.2, ringCount: 6,
  keepoutLengthM: 2.5, keepoutWidthM: 1.1, packHeightM: .30,
  petalLengthM: 4, petalWidthM: 3.5
});

function paramGeometry(nu, nv) {
  const g = new THREE.BufferGeometry(), p = new Float32Array((nu + 1) * (nv + 1) * 3), uv = [];
  const ids = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.push(i / nu, j / nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    ids.push(a, b, c, b, d, c);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ids);
  g.userData = {nu, nv}; return g;
}
function updateParam(g, fn) {
  const {nu, nv} = g.userData, p = g.attributes.position;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = fn(i / nu, j / nv); p.setXYZ(j * (nu + 1) + i, a.x, a.y, a.z);
  }
  p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
}
function dynamicTube(samples = 120, sides = 6, radius = .012) {
  const g = new THREE.BufferGeometry(), p = new Float32Array((samples + 1) * (sides + 1) * 3), ids = [];
  for (let j = 0; j < samples; j++) for (let k = 0; k < sides; k++) {
    const a = j * (sides + 1) + k, c = a + sides + 1;
    ids.push(a, c, a + 1, a + 1, c, c + 1);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(ids);
  g.userData = {samples, sides, radius}; return g;
}
function updateTube(g, point) {
  const {samples, sides, radius} = g.userData, p = g.attributes.position;
  for (let j = 0; j <= samples; j++) {
    const t = j / samples, q = point(t), before = point(Math.max(0, t - 1 / samples)), after = point(Math.min(1, t + 1 / samples));
    const tangent = after.sub(before).normalize();
    const ref = Math.abs(tangent.y) < .93 ? UP : new THREE.Vector3(1, 0, 0);
    const n = new THREE.Vector3().crossVectors(tangent, ref).normalize(), b = new THREE.Vector3().crossVectors(tangent, n).normalize();
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * TAU, r = q.clone().addScaledVector(n, Math.cos(a) * radius).addScaledVector(b, Math.sin(a) * radius);
      p.setXYZ(j * (sides + 1) + k, r.x, r.y, r.z);
    }
  }
  p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
}
function integrateMeshes(meshes, direction) {
  let area = 0, projected = 0, weightedY = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3();
  for (const mesh of meshes) {
    const p = mesh.geometry.attributes.position, ids = mesh.geometry.index;
    if (!p || !ids) continue;
    for (let k = 0; k < ids.count; k += 3) {
      a.fromBufferAttribute(p, ids.getX(k)).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(p, ids.getX(k + 1)).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(p, ids.getX(k + 2)).applyMatrix4(mesh.matrixWorld);
      normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).multiplyScalar(.5);
      const A = normal.length(), P = Math.abs(normal.dot(direction));
      area += A; projected += P; weightedY += (a.y + b.y + c.y) / 3 * P;
    }
  }
  return {area, projected, weightedY, centroidY: projected > 1e-9 ? weightedY / projected : 0};
}

// An ellipse must contain the four corners, not merely exceed the two side lengths.
// This is a declared-envelope check, not an approval of clearances or attachments.
function fitEllipse(profile, length, width, margin = .08) {
  const result={...profile},corners=[];
  const c=Math.cos(result.yaw),s=Math.sin(result.yaw);
  let factor=0;
  for(const x of[-length/2-margin,length/2+margin])for(const z of[-width/2-margin,width/2+margin]){
    const dx=x-result.cx,dz=z-result.cz,localX=dx*c-dz*s,localZ=dx*s+dz*c;
    const q=Math.hypot(localX/result.a,localZ/result.b);factor=Math.max(factor,q);corners.push(q);
  }
  const scale=Math.max(1,factor*1.012);result.a*=scale;result.b*=scale;
  result.cornerFactor=factor/scale;result.marginM=margin;return result;
}
function ellipsePoint(profile, angle, y=0) {
  const x=profile.a*Math.sin(angle),z=profile.b*Math.cos(angle),c=Math.cos(profile.yaw),s=Math.sin(profile.yaw);
  return new THREE.Vector3(profile.cx+x*c+z*s,y,profile.cz-x*s+z*c);
}
function ellipseNormal(profile, angle) {
  const x=Math.sin(angle)/profile.a,z=Math.cos(angle)/profile.b,c=Math.cos(profile.yaw),s=Math.sin(profile.yaw);
  return new THREE.Vector3(x*c+z*s,0,-x*s+z*c).normalize();
}
function ovalTube(profile,radius=.022,samples=128) {
  const curve=new THREE.Curve();curve.getPoint=t=>ellipsePoint(profile,t*TAU);
  return new THREE.TubeGeometry(curve,samples,radius,8,true);
}

export function createFlowerStudy({config = {}, textures = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  // Accept the shorter aliases used in some early briefing data without changing dimensions.
  cfg.stageWidthM = finite(config.stageWidthM ?? config.width, cfg.stageWidthM);
  cfg.stageDepthM = finite(config.stageDepthM ?? config.depth, cfg.stageDepthM);
  cfg.platformWidthM = finite(config.platformWidthM ?? config.platformWidth, cfg.platformWidthM);
  cfg.platformLengthM = finite(config.platformLengthM ?? config.platformLength, cfg.platformLengthM);
  cfg.deckThicknessM = clamp(finite(config.deckThicknessM??config.stageThicknessM,.18),0,.30);
  cfg.stageThicknessM = cfg.deckThicknessM;
  cfg.railHeightM = finite(config.guardrailHeightM ?? config.railHeightM, cfg.guardrailHeightM);
  cfg.guardrailHeightM = cfg.railHeightM;
  cfg.railMode = config.railMode==='reference'?'reference':'project';
  cfg.compactPlatformFloorM = finite(config.compactPlatformFloorM,1.37);
  cfg.crownOffsetM = cfg.railMode==='reference'?cfg.guardrailHeightM:finite(config.crownOffsetM,.4);
  cfg.targetPlatformFloorM = finite(config.targetPlatformFloorM, cfg.targetPlatformFloorM);
  cfg.machineCompactTopM = cfg.compactPlatformFloorM + cfg.crownOffsetM;
  cfg.targetCrownM = cfg.targetPlatformFloorM + cfg.crownOffsetM;
  const hoopProfiles=[
    {a:1.80,b:1.06,cx:-.035,cz:.025,yaw:-.04},
    {a:1.67,b:1.40,cx:.055,cz:-.045,yaw:.05},
    {a:1.64,b:1.56,cx:-.065,cz:.035,yaw:-.02},
    {a:1.84,b:1.11,cx:.065,cz:.025,yaw:.055},
    {a:1.71,b:1.43,cx:-.025,cz:-.025,yaw:-.035},
    {a:1.80,b:1.00,cx:0,cz:0,yaw:0}
  ].map(p=>fitEllipse(p,cfg.platformLengthM,cfg.platformWidthM));
  const crownProfile=hoopProfiles[5];
  function profileAt(v){const t=clamp(v)*5,j=Math.min(4,Math.floor(t)),f=smooth(t-j),a=hoopProfiles[j],b=hoopProfiles[j+1];return fitEllipse({a:mix(a.a,b.a,f),b:mix(a.b,b.b,f),cx:mix(a.cx,b.cx,f),cz:mix(a.cz,b.cz,f),yaw:mix(a.yaw,b.yaw,f)},cfg.platformLengthM,cfg.platformWidthM);}
  const root = new THREE.Group(); root.name = 'Flor_central_F02_ESTUDIO';
  const objectRoot = new THREE.Group(); objectRoot.name = 'Flor_y_vestido_conceptuales'; root.add(objectRoot);
  const groups = {}, parts = [], ownedMaterials = new Set(), originalMaterials = new Map(), clothMeshes = [];
  const palette = {COR:'#f8cb8a', ARO:'#e6e0cb', PET:'#dc94e8', TAL:'#6ab19a', HOJ:'#8ab55f', CTL:'#e6ae63', ANT:'#c97f73', ELEV:'#d7ad48', TAR:'#566471', CAM:'#c6b69a', EXC:'#f49c7e'};
  const group = (code, title, parent = objectRoot, description = '') => {
    const g = new THREE.Group(); g.name = code; g.userData = {code, title, description, proposed:true};
    groups[code] = g; parts.push(g); parent.add(g); return g;
  };
  const mat = (color, opts = {}) => { const m = new THREE.MeshStandardMaterial({color, roughness:.82, ...opts}); ownedMaterials.add(m); return m; };
  const fabric = (color, texture, opts = {}) => {
    const m = new THREE.MeshPhysicalMaterial({color, map:texture || null, roughness:.9, metalness:0, side:THREE.DoubleSide,
      sheen:.18, sheenColor:new THREE.Color('#f9dfd6'), sheenRoughness:.8, ...opts}); ownedMaterials.add(m); return m;
  };
  const mesh = (g, geometry, material, pos = [0,0,0]) => {
    const o = new THREE.Mesh(geometry, material); o.position.copy(V(pos)); o.castShadow = true; o.receiveShadow = true;
    o.name = g.name + '_' + g.children.length; g.add(o); originalMaterials.set(o, material); return o;
  };
  const box = (g, size, material, pos) => mesh(g, new THREE.BoxGeometry(...size), material, pos);
  const sphere = (g, r, material, pos) => mesh(g, new THREE.SphereGeometry(r, 16, 10), material, pos);
  const cylinder = (g, r, length, material, pos) => mesh(g, new THREE.CylinderGeometry(r,r,length,12),material,pos);
  const between = (o, a, b) => { const d = b.clone().sub(a); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(UP, d.clone().normalize()); o.scale.y = d.length(); };
  const tube = (g, points, radius, material) => mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*5),radius,6,false),material);
  const steel = mat('#b3bfc1',{metalness:.65,roughness:.4}), dark = mat('#34474c',{metalness:.3}), rubber = mat('#273033'), yellow = mat('#cfaa4d',{roughness:.63});
  const rimMat = mat('#426f65',{metalness:.05,roughness:.9}), stemMat = fabric('#4e8b82',textures.stem,{sheen:.28,sheenColor:new THREE.Color('#d5e4c0')}), leafMat = fabric('#42825f',textures.leaf,{sheen:.24,roughness:.94});
  const creamMat = fabric('#f0dfb9',textures.cream), copperMat = fabric('#a96732',textures.copper), magentaMat = fabric('#9b265c',textures.magenta);
  const cordMat = mat('#d0bb8a',{roughness:1}), cuffMat = mat('#5a714e',{roughness:.95});

  const stageTrap=createStageTrap({config:cfg});root.add(stageTrap.root);
  Object.assign(groups,stageTrap.groups);parts.push(...stageTrap.parts);
  const TAR=stageTrap.groups.TAR,CAM=stageTrap.groups.CAM;

  const ELEV = group('ELEV','Elevadora de estudio, no réplica Haulotte',root,'El proyecto del usuario se representa sin personas y sin barandas visibles. No aprueba modificar la máquina. La comparación con barandasproxy1.10m se ofrece separada. Piso y accesorio de corona pendientes de medir y aprobar.');
  box(ELEV,[2.26,.23,.88],yellow,[0,.30,0]); box(ELEV,[1.91,.12,.76],dark,[0,.46,0]);
  for (const x of [-.84,.84]) for(const z of [-.47,.47]) {const w=cylinder(ELEV,.16,.1,rubber,[x,.16,z]);w.rotation.x=Math.PI/2;const hub=cylinder(ELEV,.065,.107,steel,[x,.16,z]);hub.rotation.x=Math.PI/2;}
  const plate = box(ELEV,[cfg.platformLengthM,.10,cfg.platformWidthM],dark,[0,.75,0]), rails = new THREE.Group(); ELEV.add(rails); rails.name='Barandas_conservadas_proxy_1_10m';
  for(const x of [-cfg.platformLengthM/2,cfg.platformLengthM/2])for(const z of [-cfg.platformWidthM/2,cfg.platformWidthM/2])cylinder(rails,.018,cfg.railHeightM,yellow,[x,cfg.railHeightM/2,z]);
  for(const y of [.10,.52,cfg.railHeightM])for(const sign of[-1,1]) {
    const a=cylinder(rails,.016,1,yellow);between(a,V([-cfg.platformLengthM/2,y,sign*cfg.platformWidthM/2]),V([cfg.platformLengthM/2,y,sign*cfg.platformWidthM/2]));
    const b=cylinder(rails,.016,1,yellow);between(b,V([sign*cfg.platformLengthM/2,y,-cfg.platformWidthM/2]),V([sign*cfg.platformLengthM/2,y,cfg.platformWidthM/2]));
  }
  const storageRails = new THREE.Group();storageRails.name='Barandas_bajas_PROXY_ALMACENAJE_NO_CICLO';ELEV.add(storageRails);
  const storageRailHeight=Math.max(.1,cfg.storageTopM-cfg.compactPlatformFloorM);
  for(const x of[-cfg.platformLengthM/2,cfg.platformLengthM/2])for(const z of[-cfg.platformWidthM/2,cfg.platformWidthM/2])cylinder(storageRails,.018,storageRailHeight,yellow,[x,storageRailHeight/2,z]);
  for(const sign of[-1,1]) {
    const a=cylinder(storageRails,.016,1,yellow);between(a,V([-cfg.platformLengthM/2,storageRailHeight,sign*cfg.platformWidthM/2]),V([cfg.platformLengthM/2,storageRailHeight,sign*cfg.platformWidthM/2]));
    const b=cylinder(storageRails,.016,1,yellow);between(b,V([sign*cfg.platformLengthM/2,storageRailHeight,-cfg.platformWidthM/2]),V([sign*cfg.platformLengthM/2,storageRailHeight,cfg.platformWidthM/2]));
  }
  const scissorBars = [], scissorPins = [];
  for(let n=0;n<cfg.scissorStages;n++)for(const z of[-.32,.32])for(const sign of[-1,1]) {
    const bar=box(ELEV,[.062,1,.032],steel), pin=sphere(ELEV,.042,dark);scissorBars.push({bar,n,z,sign});scissorPins.push({pin,n,z,sign});
  }
  const EXC = group('EXC','Envolvente móvil: mantener tela fuera',root,'2.5x1.1m es una envolvente ilustrativa, no una holgura certificada ni el volumen exacto de la máquina.');
  const keepMat = mat('#ef9d79',{transparent:true,opacity:.075,depthWrite:false});
  const keepout = box(EXC,[cfg.keepoutLengthM,1,cfg.keepoutWidthM],keepMat,[0,.9,0]);
  keepout.userData.noColors=true;
  const keepEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cfg.keepoutLengthM,1,cfg.keepoutWidthM)),new THREE.LineBasicMaterial({color:'#db9a81',transparent:true,opacity:.55}));ownedMaterials.add(keepEdges.material);EXC.add(keepEdges);

  const COR = group('COR','Corona oval superior de estudio',objectRoot,'Una corona ovalada próxima a la proporción de la plataforma, comprobada geométricamente contra sus cuatro esquinas. Soporte, voladizo y fijación pendientes del proveedor de la elevadora.');
  const adapterGeometry=new THREE.BufferGeometry();adapterGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(8*3),3));
  const adapterLines=new THREE.LineSegments(adapterGeometry,new THREE.LineDashedMaterial({color:'#c6ae78',dashSize:.07,gapSize:.05,transparent:true,opacity:.65}));adapterLines.name='Envolvente_adaptador_NO_HERRAJE';ownedMaterials.add(adapterLines.material);COR.add(adapterLines);
  const crownCircle = mesh(COR,new THREE.CylinderGeometry(1,1,.035,96),cuffMat);
  crownCircle.scale.set(crownProfile.a,1,crownProfile.b);crownCircle.rotation.y=crownProfile.yaw;
  const crownCircleRim = mesh(COR,ovalTube(crownProfile,.023),rimMat);
  const crownBox = box(COR,[2.3,.035,.9],cuffMat), crownBoxEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3,.04,.9)),new THREE.LineBasicMaterial({color:'#c5bc9a'}));ownedMaterials.add(crownBoxEdges.material);COR.add(crownBoxEdges);
  const packEnvelopeMat = mat('#ddaa73',{transparent:true,opacity:.085,depthWrite:false});
  const packEnvelopeCircle = mesh(COR,new THREE.CylinderGeometry(1,1,1,64,1,true),packEnvelopeMat), packEnvelopeBox=box(COR,[2.3,1,.9],packEnvelopeMat);
  packEnvelopeCircle.scale.set(crownProfile.a,1,crownProfile.b);packEnvelopeCircle.rotation.y=crownProfile.yaw;
  packEnvelopeCircle.userData.noColors=packEnvelopeBox.userData.noColors=true;
  packEnvelopeCircle.castShadow=false;packEnvelopeBox.castShadow=false;
  const packet = new THREE.Group();packet.name='Paquete_representativo_NO_SOLUCION_ELASTICA';COR.add(packet);
  const packetLoops=[];
  for(let i=0;i<5;i++)for(let k=0;k<3;k++) {
    const loop=mesh(packet,new THREE.TorusGeometry(.46,.009,6,64),i<2?creamMat:i<4?copperMat:magentaMat);
    loop.rotation.x=Math.PI/2;loop.rotation.z=(i-2)*.07;loop.scale.set(1.22,.88,1);packetLoops.push({loop,i,k});
  }
  const packetCloth=[];
  for(let i=0;i<5;i++) {
    const f=mesh(packet,paramGeometry(28,12),i<2?creamMat:i<4?copperMat:magentaMat);f.castShadow=false;packetCloth.push(f);
  }

  const ARO = group('ARO','Aros periféricos de pétalos',objectRoot,'Aro firme con contorno textil. El plegado se representa por transiciones geométricas, sin calcular cinta elástica ni torsión.');
  const PET = group('PET','Cinco piezas de la corola',objectRoot,'Cinco pétalos con envolvente local4x3.5m confirmada: dos crema moteados, dos cobre y un labelo magenta. Se diferencian sus perfiles y curvaturas. No hay semilla ni intérprete.');
  const petalDefs = [
    {name:'Pétalo crema izquierdo',length:cfg.petalLengthM,width:cfg.petalWidthM,angle:-76,mat:creamMat,curl:.4},
    {name:'Pétalo crema derecho',length:cfg.petalLengthM,width:cfg.petalWidthM,angle:76,mat:creamMat,curl:.4},
    {name:'Sépalo cobre izquierdo',length:cfg.petalLengthM,width:cfg.petalWidthM,angle:-150,mat:copperMat,curl:-.55,copper:true},
    {name:'Sépalo cobre derecho',length:cfg.petalLengthM,width:cfg.petalWidthM,angle:150,mat:copperMat,curl:-.55,copper:true},
    {name:'Labelo magenta frontal',length:cfg.petalLengthM,width:cfg.petalWidthM,angle:0,mat:magentaMat,curl:.15,label:true}
  ];
  const petals = petalDefs.map((d,i)=> {
    const surface=mesh(PET,paramGeometry(20,32),d.mat);surface.name='PET_'+(i+1)+'_'+d.name;
    surface.castShadow=false;clothMeshes.push(surface);
    const edge=mesh(ARO,dynamicTube(128,6,.013),i<2?creamMat:i<4?copperMat:magentaMat);edge.name='ARO_'+(i+1);
    return {...d,index:i,surface,edge};
  });
  const throat=sphere(PET,.24,creamMat,[0,0,.1]);throat.scale.set(.65,.7,1.35);throat.name='Centro_floral_sin_semilla';

  const TAL=group('TAL','Tallo orgánico: seis aros de distinta proporción',objectRoot,'Óvalos más largos alternan con aros casi circulares; cada uno contiene la envolvente rectangular declarada. La tela adopta esos apoyos, con pliegues y pequeños vientres entre ellos. La comprobación geométrica no aprueba rigidez ni holgura real.');
  const stemRings=hoopProfiles.map((p,i)=> {const r=mesh(TAL,ovalTube(p,.022),rimMat);r.name='TAL_Aro_'+(i+1)+'_oval';return r;});
  const continuous=mesh(TAL,paramGeometry(72,60),stemMat);continuous.name='TAL_Manga_continua';continuous.castShadow=false;
  const strips=Array.from({length:12},(_,i)=> {const m=mesh(TAL,paramGeometry(6,60),stemMat);m.name='TAL_Franja_'+String(i+1).padStart(2,'0');m.castShadow=false;return m;});
  const HOJ=group('HOJ','Dos hojas de bore',objectRoot,'Hojas propuestas con vena curva y paño blando. Se recogen junto al tallo; su despliegue acompaña la elevación. Forma y plegado son esquemas de movimiento.');
  const leaves=[{angle:-80,faceAngle:-15,level:.60,length:3.0,width:2.25},{angle:65,faceAngle:25,level:.80,length:2.75,width:2.15}].map((d,i)=> {
    const surface=mesh(HOJ,paramGeometry(18,28),leafMat);surface.name='HOJ_'+(i+1);surface.castShadow=false;
    const vein=mesh(HOJ,dynamicTube(40,6,.018),cuffMat);vein.name='HOJ_Vena_'+(i+1);return{...d,index:i,surface,vein};
  });

  const CTL=group('CTL','Cordones exteriores: esquema de control',objectRoot,'Los recorridos están fuera del volumen de tijeras. Guías, esfuerzo, freno y operación real pendientes de diseño y aprobación. Los diámetros dibujados no son prescripciones de fabricación.');
  const ropeMeshes=petals.map((p,i)=>mesh(CTL,dynamicTube(32,5,.006),cordMat));
  const station=box(CTL,[.32,.08,.22],dark,[-2.2,.82,1.9]);station.name='Estacion_de_control_ESQUEMA';
  for(let i=0;i<3;i++)sphere(CTL,.027,mat(i===2?'#c58575':'#c3c6a3'),[-2.28+i*.08,.88,1.9]);
  const ANT=group('ANT','Retención abierta: concepto',objectRoot,'El estado abierto se mantiene. Estos topes explican la función; no son herrajes dimensionados ni un dispositivo fabricable.');
  const retainers=petals.map((p,i)=> {const k=box(ANT,[.10,.055,.11],mat('#b7b3a1'));k.name='ANT_Tope_conceptual_'+(i+1);return k;});
  const colorMaterials={};for(const [code,color]of Object.entries(palette))colorMaterials[code]=mat(color,{roughness:.75});

  let state={liftProgress:0,opening:0,leafProgress:0,trapProgress:0,slopeDeg:10,stemMode:'strips',windOn:false,speed:3,azimuth:0,gust:1.4,time:0,showSkin:true,showMachine:true,showStage:true,cutaway:true,showKeepout:false,colors:false,showRopes:true,view:'whole',packMode:'organic',packHeightM:cfg.packHeightM,storageRailsFolded:false,chamberTopM:cfg.chamberTopM,deckThicknessM:cfg.deckThicknessM};
  let crownY=cfg.machineCompactTopM, floorY=cfg.compactPlatformFloorM, ringYs=[], lastKey='', nominalPetalAreas=[], nominalLeafArea=0,nominalStemAreas={continuous:0,strips:0},lidRiseM=2.1;
  const focusPoints={whole:[0,5,0],folded:[0,1.8,0],petal:[0,10,0],stem:[0,5,0],leaves:[-1.2,5,1],mechanism:[0,10,0],trap:[0,2.75,0],stage:[0,2.3,0]};
  function windWave(u,v,phase=0) {
    if(!state.windOn)return 0;
    const speed=clamp(state.speed,0,20),gust=1+(clamp(state.gust,1,2)-1)*(.5+.5*Math.sin(state.time*.8));
    return Math.min(.22,speed*.018*gust)*Math.sin(state.time*(1.8+speed*.08)+u*8+v*5+phase);
  }
  function rotateLocal(x,y,z,angle,rootRadius=.44,extraY=0) {
    const a=angle*Math.PI/180;return new THREE.Vector3(x*Math.cos(a)+(z+rootRadius)*Math.sin(a),crownY+extraY+y,-x*Math.sin(a)+(z+rootRadius)*Math.cos(a));
  }
  function releaseAt(q,opening=state.opening){const p=smooth(clamp((opening-.10)/.90));return smooth(clamp((p*1.32-q)/.32));}
  function petalRestY(d,q){return d.curl*Math.sin(Math.PI*q)-.34*q*q+(d.label?-.9*q**4:0);}
  let pathOpening=-1;
  function updatePetalPaths(){
    if(pathOpening===state.opening)return;pathOpening=state.opening;
    const emerging=smooth(clamp(state.opening/.18)),budHeight=mix(.14,2.35,emerging);
    const by=q=>budHeight*(q+.05*Math.sin(Math.PI*q)),bz=q=>.18*Math.sin(Math.PI*q)+.04*q;
    for(const d of petals){
      const points=[{y:0,z:0}],N=80;
      for(let i=1;i<=N;i++){
        const a=(i-1)/N,b=i/N,r=releaseAt((a+b)/2),prev=points[i-1];
        points.push({y:prev.y+mix(by(b)-by(a),petalRestY(d,b)-petalRestY(d,a),r),z:prev.z+mix(bz(b)-bz(a),d.length/N,r)});
      }
      d.path=points;
    }
  }
  function petalPoint(d,u,v,opening=state.opening,wind=true) {
    const q=clamp(v),s=u*2-1,profile=pinnedSine(q)**(d.copper?1.45:d.label?.62:.68),released=releaseAt(q,opening);
    const t=q*80,j=Math.min(79,Math.floor(t)),f=t-j,path=d.path||[{y:0,z:0}],a=path[j]||path[0],b=path[j+1]||a;
    // Integrating the tangent transition releases the base before the distal section.
    // This is a visual growth path, not a spring-strip torsion/energy calculation.
    const x=s*d.width*.5*profile*mix(.09,1,released);
    const cup=mix(.30,d.label?.72:d.copper?.52:.64,released),asym=.065*s*Math.sin(q*Math.PI*2+d.index*.45)*pinnedSine(q);
    let y=mix(a.y,b.y,f)+cup*s*s*pinnedSine(q)+asym;
    const z=mix(a.z,b.z,f);
    if(wind)y+=windWave(q,s,d.index*.8)*pinnedSine(q)*pinnedSine(u);
    return rotateLocal(x,y,z,d.angle,.44,.06);
  }
  function outlinePoint(d,t) {return t<=.5?petalPoint(d,1,t*2):petalPoint(d,0,(1-t)*2);}
  function stemPoint(u,v,stripIndex=null) {
    const n=5,t=clamp(v)*n,j=Math.min(n-1,Math.floor(t)),f=t-j;
    const y=mix(ringYs[j],ringYs[j+1],f),profile=profileAt(v);
    const angle=stripIndex===null?u*TAU:(stripIndex+u*1.16)/12*TAU;
    const seamWeight=pinnedSine(f),fold=Math.max(0,1-state.liftProgress)*.15*Math.sin(f*Math.PI*5)*seamWeight;
    const belly=.045*(.58+.42*Math.cos(angle*3+v*2))*seamWeight,pleat=.016*Math.sin(angle*24+v*5)*seamWeight;
    const incidence=Math.cos(angle-state.azimuth*Math.PI/180),w=.27*windWave(v,angle,1.5)*seamWeight*(stripIndex===null?1:(.55+.45*Math.cos(TAU*u)))*incidence;
    return ellipsePoint(profile,angle,y).addScaledVector(ellipseNormal(profile,angle),fold+belly+pleat+w);
  }
  function leafPoint(d,u,v,wind=true) {
    const rootAngle=d.angle*Math.PI/180,a=(d.faceAngle??d.angle)*Math.PI/180,q=v,s=u*2-1,rootIndex=Math.round(d.level*5),rootY=ringYs[rootIndex]||0;
    const profile=q<=0||q>=1?0:Math.pow(Math.sin(Math.PI*Math.pow(q,.66)),.67),rootXZ=ellipsePoint(hoopProfiles[rootIndex],rootAngle);
    // Leaves remain collected until their cloth can emerge above the upstanding lids.
    // This illustrative reveal rule is not a real interlock or a collision certificate.
    const localReveal=smooth(clamp((rootY-state.chamberTopM-lidRiseM-.25)/(1.20*d.length)));
    const open=smooth(state.leafProgress)*localReveal;
    const x=s*d.width*.5*profile*(.90+.10*Math.sin(q*Math.PI*2))*(1+.055*s*Math.sin(q*Math.PI));
    // The central vein is a support, as are the boundary and the root/tip.
    // Independent half-panels flutter between u=0/.5/1; no gap may open at the vein.
    const halfPanelWeight=u<=1e-12||u>=1-1e-12||Math.abs(u-.5)<1e-12?0:Math.sin(TAU*u)**2;
    const flutter=wind?windWave(q,s,d.index+4)*pinnedSine(q)*halfPanelWeight:0;
    const lobe=.16*Math.sin(Math.PI*q)*s*s,veinRelief=.075*(1-s*s)*Math.sin(Math.PI*q);
    const z=.62*Math.sin(Math.PI*q)+.55*q+lobe-veinRelief+flutter*.85,localY=-d.length*q+.43*Math.sin(Math.PI*q)+.18*s*s*Math.sin(Math.PI*q)+flutter*.15;
    const outward=.24*Math.sin(Math.PI*q),ox=x*Math.cos(a)+z*Math.sin(a)+rootXZ.x+outward*Math.sin(rootAngle),oz=-x*Math.sin(a)+z*Math.cos(a)+rootXZ.z+outward*Math.cos(rootAngle);
    const closedX=rootXZ.x+.08*Math.sin(rootAngle)+Math.cos(rootAngle)*(s*.10*profile+.10*Math.sin(q*Math.PI*4));
    const closedZ=rootXZ.z+.08*Math.cos(rootAngle)-Math.sin(rootAngle)*(s*.10*profile+.10*Math.sin(q*Math.PI*4));
    return new THREE.Vector3(mix(closedX,ox,open),rootY+mix(.50*Math.sin(q*Math.PI)+.07*q,localY,open),mix(closedZ,oz,open));
  }
  function applyColors() {
    for(const [o,m] of originalMaterials) {
      let g=o.parent;while(g&&g.parent!==objectRoot&&g.parent!==root)g=g.parent;
      const code=g?.userData?.code;
      o.material=state.colors&&colorMaterials[code]&&!o.userData.noColors?colorMaterials[code]:m;
    }
  }
  function updateGeometry() {
    floorY=mix(cfg.compactPlatformFloorM,cfg.targetPlatformFloorM,state.liftProgress);crownY=floorY+cfg.crownOffsetM;
    plate.position.y=floorY-.05;rails.position.y=floorY;
    rails.visible=cfg.railMode==='reference'&&!state.storageRailsFolded;storageRails.visible=cfg.railMode==='reference'&&state.storageRailsFolded;storageRails.position.y=floorY;
    const ap=adapterGeometry.attributes.position;let ai=0;for(const x of[-cfg.platformLengthM/2,cfg.platformLengthM/2])for(const z of[-cfg.platformWidthM/2,cfg.platformWidthM/2]){ap.setXYZ(ai++,x,floorY,z);ap.setXYZ(ai++,x,crownY,z);}ap.needsUpdate=true;adapterLines.computeLineDistances();
    const height=Math.max(.01,floorY-cfg.machineBaseTopM),h=height/cfg.scissorStages,L=cfg.scissorBarLengthM,span=Math.sqrt(Math.max(.001,L*L-h*h));
    for(const d of scissorBars)between(d.bar,V([d.sign*span/2,cfg.machineBaseTopM+d.n*h,d.z]),V([-d.sign*span/2,cfg.machineBaseTopM+(d.n+1)*h,d.z]));
    for(const d of scissorPins)d.pin.position.set(d.sign*span/2,cfg.machineBaseTopM+d.n*h,d.z);
    keepout.position.y=cfg.machineBaseTopM+height/2;keepout.scale.y=height;keepEdges.position.copy(keepout.position);keepEdges.scale.y=height;
    ELEV.visible=state.showMachine;EXC.visible=state.showKeepout;
    stageTrap.setState({chamberTopM:state.chamberTopM,slopeDeg:state.slopeDeg,deckThicknessM:state.deckThicknessM,trapProgress:state.trapProgress,showStage:state.showStage,cutaway:state.cutaway,colors:state.colors,mechanismFocus:state.view==='trap'});
    lidRiseM=finite(stageTrap.getMetrics().openingLengthM,4.2)/2;
    const boxMode=state.packMode==='box';crownCircle.visible=crownCircleRim.visible=!boxMode;crownBox.visible=crownBoxEdges.visible=boxMode;
    crownCircle.position.set(crownProfile.cx,crownY+.015,crownProfile.cz);crownCircleRim.position.y=crownY+.015;
    crownBox.position.y=crownBoxEdges.position.y=crownY+.015;
    packEnvelopeCircle.visible=!boxMode&&state.opening<.98;packEnvelopeBox.visible=boxMode&&state.opening<.98;
    for(const e of [packEnvelopeCircle,packEnvelopeBox]){e.position.y=crownY+state.packHeightM/2;e.scale.y=state.packHeightM;}
    packEnvelopeCircle.position.x=crownProfile.cx;packEnvelopeCircle.position.z=crownProfile.cz;
    packet.visible=state.opening<.16&&state.showSkin;
    const packetFade=1-smooth(state.opening/.16);
    for(const {loop,i,k}of packetLoops) {const sign=i%2?1:-1;loop.position.set(sign*(i===4?0:.34),crownY+.04+state.packHeightM*(.12+i*.12+k*.055),.10*Math.sin(i*2));loop.scale.y=.88;loop.visible=packetFade>.015;}
    for(let i=0;i<packetCloth.length;i++)updateParam(packetCloth[i].geometry,(u,v)=>new THREE.Vector3((u-.5)*1.22+Math.sin(i*2)*.28,crownY+.04+state.packHeightM*(.12+i*.13)+.026*Math.sin(u*22+v*25+i), (v-.5)*.69+Math.cos(i*2)*.15));
    updatePetalPaths();
    for(const d of petals) {d.surface.visible=state.showSkin&&state.opening>.012;d.surface.castShadow=state.showSkin;d.edge.visible=state.opening>.012;d.edge.castShadow=!state.showSkin;updateParam(d.surface.geometry,(u,v)=>petalPoint(d,u,v));updateTube(d.edge.geometry,t=>outlinePoint(d,t));}
    throat.position.set(0,crownY+.19,.32);throat.visible=state.opening>.30&&state.showSkin;
    const ringFractions=[0,.24,.48,.78,.90,1];
    ringYs=Array.from({length:6},(_,i)=>i===5?crownY:mix(.20+i*.06,.20+(crownY-.20)*ringFractions[i],state.liftProgress));
    for(let i=0;i<6;i++){stemRings[i].position.y=ringYs[i];stemRings[i].castShadow=!state.showSkin;}
    continuous.visible=state.showSkin&&state.stemMode==='continuous';for(const p of strips)p.visible=state.showSkin&&state.stemMode==='strips';
    continuous.castShadow=state.showSkin;for(const p of strips)p.castShadow=state.showSkin;
    updateParam(continuous.geometry,(u,v)=>stemPoint(u,v));for(let i=0;i<strips.length;i++)updateParam(strips[i].geometry,(u,v)=>stemPoint(u,v,i));
    for(const d of leaves){d.surface.visible=state.showSkin;d.surface.castShadow=state.showSkin;d.vein.castShadow=!state.showSkin;updateParam(d.surface.geometry,(u,v)=>leafPoint(d,u,v));updateTube(d.vein.geometry,t=>leafPoint(d,.5,t,false));}
    CTL.visible=state.showRopes;for(let i=0;i<ropeMeshes.length;i++) {
      const a=petalDefs[i].angle*Math.PI/180,start=rotateLocal(0,.04,.15,petalDefs[i].angle,cfg.crownDiameterM/2),route=[start,new THREE.Vector3(Math.sin(a)*1.70,crownY-.18,Math.cos(a)*1.70),new THREE.Vector3(Math.sin(a)*1.70,.35,Math.cos(a)*1.70)];
      const stationAngle=Math.atan2(-2.2,1.9);let delta=stationAngle-a;while(delta>Math.PI)delta-=TAU;while(delta<-Math.PI)delta+=TAU;
      for(let j=1;j<=8;j++){const angle=a+delta*j/8;route.push(new THREE.Vector3(Math.sin(angle)*1.70,.35,Math.cos(angle)*1.70));}route.push(new THREE.Vector3(-2.2,.84,1.9));
      const curve=new THREE.CatmullRomCurve3(route);updateTube(ropeMeshes[i].geometry,t=>curve.getPoint(t));
    }
    ANT.visible=state.opening>.80;for(let i=0;i<retainers.length;i++)retainers[i].position.copy(rotateLocal(0,.025,0,petalDefs[i].angle,.53));
    focusPoints.whole=[0,crownY*.47,0];focusPoints.folded=[0,crownY+state.packHeightM/2,0];focusPoints.petal=[-1.7,crownY+.5,1];focusPoints.stem=[0,crownY*.48,0];focusPoints.leaves=[-1.9,ringYs[3]+.65,1];focusPoints.mechanism=[0,crownY+.10,.5];focusPoints.trap=[0,state.chamberTopM+.45,0];focusPoints.stage=[0,state.chamberTopM,0];
    applyColors();root.updateMatrixWorld(true);
  }
  function setState(next={}) {
    const s={...state,...next};s.liftProgress=clamp(s.liftProgress);s.opening=clamp(s.opening);s.trapProgress=clamp(s.trapProgress);s.slopeDeg=clamp(finite(s.slopeDeg,10),10,15);
    s.leafProgress=next.leafProgress===undefined?(next.liftProgress===undefined?state.leafProgress:smooth((s.liftProgress-.12)/.68)):clamp(next.leafProgress);
    s.storageRailsFolded=!!s.storageRailsFolded&&s.view==='folded'&&s.liftProgress<1e-8;
    s.stemMode=s.stemMode==='continuous'?'continuous':'strips';s.packMode=s.packMode==='box'?'box':'organic';s.packHeightM=clamp(finite(s.packHeightM,cfg.packHeightM),.08,.9);
    s.chamberTopM=clamp(finite(s.chamberTopM,cfg.stageTopM),cfg.stageTopM,3);s.deckThicknessM=clamp(finite(s.deckThicknessM,cfg.deckThicknessM),0,.30);
    s.speed=clamp(next.windSpeedMps??next.speed??state.speed,0,20);s.azimuth=finite(next.windAzimuthDeg??next.azimuth??state.azimuth,0);s.gust=clamp(next.gustFactor??next.gust??state.gust,1,2);s.time=finite(s.time,0);
    state=s;const key=geometryKey();if(key!==lastKey){updateGeometry();lastKey=key;}return getState();
  }
  function geometryKey(){return JSON.stringify([state.view,state.trapProgress,state.slopeDeg,state.liftProgress,state.opening,state.leafProgress,state.stemMode,state.windOn,state.windOn?state.speed:0,state.windOn?state.azimuth:0,state.windOn?state.gust:0,state.windOn?state.time:0,state.showSkin,state.showMachine,state.showStage,state.cutaway,state.showKeepout,state.colors,state.showRopes,state.packMode,state.packHeightM,state.storageRailsFolded,state.chamberTopM,state.deckThicknessM]);}
  function update(timeS,dtS=0) {state.time=finite(timeS,state.time);const key=geometryKey();if(key!==lastKey){updateGeometry();lastKey=key;}return getState();}
  function getState(){return{...state,crownY,floorY,ringYs:[...ringYs]};}
  function computeBounds({focus='whole'}={}) {
    root.updateMatrixWorld(true);const b=new THREE.Box3(),add=o=>{if(o)o.traverseVisible(n=>{if(n.isMesh&&n.geometry){if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();b.union(n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld));}});};
    if(focus==='trap'||focus==='stage'){
      const sb=stageTrap.computeBounds({mechanismOnly:focus==='trap'});
      if(!sb.isEmpty())return sb;
      return new THREE.Box3(new THREE.Vector3(-2.5,0,-2.25),new THREE.Vector3(2.5,state.chamberTopM+2.3,2.25));
    }
    if(focus==='petal'){add(PET);add(ARO);}else if(focus==='stem')add(TAL);else if(focus==='leaves')add(HOJ);else if(focus==='folded'){add(COR);if(state.showMachine)add(ELEV);if(state.showStage)add(stageTrap.root)}else if(focus==='mechanism'){add(COR);add(ANT);if(state.showRopes)add(CTL);}else{add(objectRoot);if(state.showMachine)add(ELEV);if(state.showStage)add(stageTrap.root)}
    if(b.isEmpty()){const r=cfg.crownDiameterM/2+.1;b.set(new THREE.Vector3(-r,crownY-.1,-r),new THREE.Vector3(r,crownY+state.packHeightM+.1,r));}return b;
  }
  function getMetrics() {
    root.updateMatrixWorld(true);const angle=state.azimuth*Math.PI/180,dir=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
    const p=integrateMeshes(petals.map(d=>d.surface),dir),s=integrateMeshes(state.stemMode==='continuous'?[continuous]:strips,dir),l=integrateMeshes(leaves.map(d=>d.surface),dir);
    const b=computeBounds({focus:'whole'}),fb=computeBounds({focus:'petal'}),size=b.getSize(new THREE.Vector3()),fsize=fb.getSize(new THREE.Vector3()),proj=p.projected+s.projected+l.projected;
    const spanH=(floorY-cfg.machineBaseTopM)/cfg.scissorStages,actualBar=Math.hypot(Math.sqrt(Math.max(.001,cfg.scissorBarLengthM**2-spanH**2)),spanH);
    const stageMetrics=stageTrap.getMetrics();
    const hoopBox=new THREE.Box3();for(const hp of hoopProfiles)for(let i=0;i<128;i++)hoopBox.expandByPoint(ellipsePoint(hp,i/128*TAU));
    return {revision:'F02',illustrativeOnly:true,currentBounds:{min:b.min.toArray(),max:b.max.toArray()},petalCount:5,
      petalAreasM2:nominalPetalAreas.length?nominalPetalAreas:[p.area],petalAreaM2:nominalPetalAreas.length?nominalPetalAreas.reduce((a,b)=>a+b,0):p.area,
      stemAreaM2:nominalStemAreas[state.stemMode==='strips'?'strips':'continuous']||s.area,
      leafAreaM2:nominalLeafArea||l.area,currentSurfaceAreaM2:p.area+s.area+l.area,
      projectedAreaM2:proj,projectedAreas:{petals:p.projected,stem:s.projected,leaves:l.projected},projectedCentroidYM:proj?(p.weightedY+s.weightedY+l.weightedY)/proj:0,forceHeightM:proj?(p.weightedY+s.weightedY+l.weightedY)/proj:0,
      areaBasis:'Superficie nominal abierta para pétalos/hojas; tallo nominal extendido. Proyección sumada de triángulos actuales, sin descontar solapes/oclusiones, sin validación aerodinámica. Mostrar/ocultar piel no retira material del escenario.',
      foldedPackageM:state.packMode==='box'?[2.3,state.packHeightM,.9]:[crownProfile.a*2,state.packHeightM,crownProfile.b*2],
      ringDiameterM:{top:Math.max(crownProfile.a,crownProfile.b)*2,bottom:Math.max(hoopProfiles[0].a,hoopProfiles[0].b)*2},
      hoops:hoopProfiles.map((h,i)=>({index:i+1,axesM:[h.a*2,h.b*2],centerM:[h.cx,ringYs[i],h.cz],yawDeg:h.yaw*180/Math.PI,cornerFactor:h.cornerFactor,declaredCornerMarginM:h.marginM,containsDeclaredPlatformCorners:h.cornerFactor<=1})),
      crownAxesM:[crownProfile.a*2,crownProfile.b*2],hoopPassageEnvelopeM:{min:hoopBox.min.toArray(),max:hoopBox.max.toArray(),clearLengthUsedM:stageMetrics.openingLengthM-state.deckThicknessM,clearWidthUsedM:stageMetrics.openingWidthM,insideDrawnOpening:Math.max(Math.abs(hoopBox.min.x),Math.abs(hoopBox.max.x))+.023<(stageMetrics.openingLengthM-state.deckThicknessM)/2&&Math.max(Math.abs(hoopBox.min.z),Math.abs(hoopBox.max.z))+.023<stageMetrics.openingWidthM/2,geometricOnly:true},
      bloomRelease:{mode:'Base a punta; brote erguido y apertura por segmentos, sin solución de cinta elástica',base:releaseAt(.10),middle:releaseAt(.50),tip:releaseAt(.90)},
      scissorBarLengthM:actualBar,configuredScissorBarLengthM:cfg.scissorBarLengthM,
      machineCompactTopM:cfg.machineCompactTopM,officialCompactTopM:cfg.officialCompactTopM,compactPlatformFloorM:cfg.compactPlatformFloorM,crownOffsetM:cfg.crownOffsetM,railMode:cfg.railMode,storageTopM:cfg.storageTopM,storageRailsFolded:state.storageRailsFolded,shownMachineRailTopM:floorY+(cfg.railMode==='project'?0:state.storageRailsFolded?storageRailHeight:cfg.railHeightM),crownHeightM:crownY,platformFloorM:floorY,railHeightM:cfg.railHeightM,
      petalDimensionsM:petalDefs.map(d=>({length:d.length,width:d.width})),
      estimatedOuterDiameterM:Math.max(fsize.x,fsize.z),outerWidthM:fsize.x,currentHeightM:size.y,ringCount:6,ringYs:[...ringYs],
      chamberTopM:state.chamberTopM,trapOpen:state.trapProgress>=.999,chamberRaisedM:state.chamberTopM-cfg.stageTopM,chamberFootprintM:[stageMetrics.flatLengthM,stageMetrics.flatWidthM],deckThicknessM:state.deckThicknessM,stageLayout:stageMetrics,
      nominalNoDeckGapM:state.chamberTopM-(cfg.machineCompactTopM+state.packHeightM),stageUndersideM:cfg.stageTopM-state.deckThicknessM,chamberUndersideM:state.chamberTopM-state.deckThicknessM,stageThicknessM:state.deckThicknessM,
      nominalStageOverheadGapM:cfg.stageTopM-state.deckThicknessM-(cfg.machineCompactTopM+state.packHeightM),nominalOverheadGapM:state.chamberTopM-state.deckThicknessM-(cfg.machineCompactTopM+state.packHeightM),
      safetyStatus:'Forma, paquete plegado, aros, cordones, retención y elevadora son conceptos sin aprobación resistente o de fabricante. Viento de comparación; no predice estabilidad ni sensores.'};
  }
  function dispose(){stageTrap.dispose();const geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());root.removeFromParent();}
  // Record nominal, open surfaces once; do not treat a display toggle or folded morph as lost material.
  const initial={...state};setState({...state,liftProgress:1,opening:1,leafProgress:1,windOn:false});
  nominalPetalAreas=petals.map(d=>integrateMeshes([d.surface],new THREE.Vector3(0,0,1)).area);
  nominalLeafArea=integrateMeshes(leaves.map(d=>d.surface),new THREE.Vector3(0,0,1)).area;
  nominalStemAreas={continuous:integrateMeshes([continuous],new THREE.Vector3(0,0,1)).area,strips:integrateMeshes(strips,new THREE.Vector3(0,0,1)).area};
  setState(initial);
  return {root,objectRoot,groups,parts,stageTrap,setState,update,getState,getMetrics,computeBounds,focusPoints,dispose};
}
