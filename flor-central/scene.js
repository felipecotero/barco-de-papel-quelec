/* F03 · study in metres. Root rotation preserves the complete frame; compact recovery is NOT animated. Fabric motion is illustrative,
   not an elastic-hoop solution, lift accessory approval or a stability analysis. */
import * as THREE from 'three';
import {createStageTrap} from './stage-trap.js?v=F03';

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
  petalLengthM: 4, petalWidthM: 3.5, petalRootReadyDeg: 70
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
  const root = new THREE.Group(); root.name = 'Flor_central_F03_ESTUDIO';
  const objectRoot = new THREE.Group(); objectRoot.name = 'Flor_y_vestido_conceptuales'; root.add(objectRoot);
  const groups = {}, parts = [], ownedMaterials = new Set(), originalMaterials = new Map(), clothMeshes = [];
  const palette = {COR:'#f8cb8a', ARO:'#e6e0cb', PET:'#dc94e8', TAL:'#6ab19a', HOJ:'#8ab55f', CTL:'#e6ae63', ANT:'#c97f73', ELEV:'#d7ad48', TAR:'#566471', CAM:'#c6b69a', EXC:'#f49c7e', RAI:'#64d4cf'};
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
  // Storage target is an empty, dashed envelope: not a second object masquerading as the petal.
  const storageEdges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(crownProfile.a*2,1,crownProfile.b*2)),new THREE.LineDashedMaterial({color:'#efb76f',dashSize:.10,gapSize:.07,transparent:true,opacity:.85}));
  storageEdges.name='Objetivo_de_guardado_NO_PAQUETE_RESUELTO';ownedMaterials.add(storageEdges.material);COR.add(storageEdges);
  const guideGhostGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const guideGhost=new THREE.Line(guideGhostGeometry,new THREE.LineDashedMaterial({color:'#f3aa77',dashSize:.07,gapSize:.05,depthTest:false}));guideGhost.name='Guia_fija_del_ensayo_NO_PLEGADA';const guideGhostCap=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:'#f3aa77',wireframe:true,depthTest:false}));guideGhostCap.name='Limite_exterior_guia_ensayo_NO_GUARDADA';ownedMaterials.add(guideGhostCap.material);COR.add(guideGhostCap);guideGhost.renderOrder=5;ownedMaterials.add(guideGhost.material);COR.add(guideGhost);
  const ARO = group('ARO','Aros periféricos de pétalos',objectRoot,'El mismo contorno conserva su tamaño en todo el giro de raíz. La recuperación torsional de un aro compacto no se simula ni se da por resuelta.');
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

  const RAI=group('RAI','Raíz articulada: propuesta geométrica',objectRoot,'Dos apoyos y un eje tangencial fijan la raíz a una corona; una cuna móvil conecta los dos lados del marco. El pétalo gira completo: ninguna pieza crece. Dibujos sin secciones, capacidades ni fijación seleccionadas.');
  const CTL=group('CTL','Cabo, guía elevada y freno: propuesta',objectRoot,'El cabo se une a un travesaño del marco y llega a una guía elevada con freno esquemático. Soltar controladamente no equivale a demostrar una apertura de30s: no se calculan masas, tensiones ni amortiguación. Accionamiento remoto pendiente.');
  const ANT=group('ANT','Tirante final y tope: propuesta',objectRoot,'La rienda final sostiene el estado abierto independientemente del cabo de maniobra. Se representa recta solo cerca del estado final; almacenaje, tensado y capacidad quedan pendientes. No es herraje para fabricar.');
  const mechanics=petals.map((d,i)=>{
    const r=new THREE.Group(),c=new THREE.Group(),a=new THREE.Group();r.name='RAI_'+(i+1);c.name='CTL_'+(i+1);a.name='ANT_'+(i+1);RAI.add(r);CTL.add(c);ANT.add(a);
    const axis=mesh(r,new THREE.CylinderGeometry(.032,.032,.62,12),steel);axis.name='Eje_tangencial_ESQUEMA';axis.rotation.z=Math.PI/2;
    const bearings=[-.22,.22].map(x=>box(r,[.12,.14,.17],dark));
    const rootBase=box(r,[.7,.045,.42],dark);
    const cradles=Array.from({length:2},()=>mesh(r,dynamicTube(1,5,.016),steel));
    const crossbar=mesh(r,dynamicTube(1,6,.016),steel);crossbar.name='Travesano_del_marco_anclaje_cabo';
    const eye=sphere(r,.035,mat('#f0b65f'));eye.name='Anclaje_cabo_al_marco';
    const post=mesh(c,dynamicTube(1,6,.023),dark);post.name='Soporte_guia_sin_dimensionar';
    const guide=sphere(c,.055,mat('#efbd6c'));guide.name='Guia_elevada';
    const drum=box(c,[.13,.16,.12],dark);drum.name='Freno_conceptual_accionamiento_pendiente';
    const rope=mesh(c,dynamicTube(1,5,.009),cordMat);rope.name='Cabo_unido_al_marco';
    const stay=mesh(a,dynamicTube(1,5,.008),mat('#8bd6d0'));stay.name='Rienda_final_derecha_INDEPENDIENTE';
    const stayLeft=mesh(a,dynamicTube(1,5,.008),mat('#8bd6d0'));stayLeft.name='Rienda_final_izquierda_INDEPENDIENTE';
    const stop=box(a,[.18,.06,.16],mat('#c2bb9a'));stop.name='Tope_final_SIN_CAPACIDAD';
    return{r,c,a,axis,bearings,rootBase,cradles,crossbar,eye,post,guide,drum,rope,stay,stayLeft,stop};
  });
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
  const laboratory=()=>['petal','mechanism'].includes(state.view);
  const rotationAngle=()=>laboratory()?cfg.petalRootReadyDeg*(1-state.opening)*Math.PI/180:0;
  function petalRestY(d,q){return d.curl*Math.sin(Math.PI*q)-.34*q*q+(d.label?-.9*q**4:0);}
  function petalPoint(d,u,v,opening=state.opening,wind=true) {
    const q=clamp(v),s=u*2-1,profile=pinnedSine(q)**(d.copper?1.45:d.label?.62:.68);
    const x=s*d.width*.5*profile,cup=d.label?.72:d.copper?.52:.64;
    let y=petalRestY(d,q)+cup*s*s*pinnedSine(q)+.065*s*Math.sin(q*Math.PI*2+d.index*.45)*pinnedSine(q),z=d.length*q;
    // Fabric can move ONLY inside its fixed boundary; frame never changes size or length.
    if(wind)y+=windWave(q,s,d.index*.8)*pinnedSine(q)*pinnedSine(u);
    const angle=laboratory()?cfg.petalRootReadyDeg*(1-opening)*Math.PI/180:0;
    const yy=y*Math.cos(angle)+z*Math.sin(angle),zz=z*Math.cos(angle)-y*Math.sin(angle);
    return rotateLocal(x,yy,zz,d.angle,.44,.06);
  }
  function outlinePoint(d,t) {return t<=.5?petalPoint(d,1,t*2,state.opening,false):petalPoint(d,0,(1-t)*2,state.opening,false);}
  const lineAt=(a,b,t)=>a.clone().lerp(b,t);
  function mechanismPoints(d) {
    const root=rotateLocal(0,0,0,d.angle,.44,.06),guide=rotateLocal(0,.85,-.36,d.angle,.44,.06);
    const left=petalPoint(d,0,.32,state.opening,false),right=petalPoint(d,1,.32,state.opening,false);
    return{root,guide,left,right,attachment:left.clone().add(right).multiplyScalar(.5),stayPoint:petalPoint(d,1,.68,state.opening,false)};
  }
  function frameLength(d,opening=state.opening) {
    let length=0,prev=null;
    for(let k=0;k<=256;k++){const t=k/256,p=t<=.5?petalPoint(d,1,t*2,opening,false):petalPoint(d,0,(1-t)*2,opening,false);if(prev)length+=p.distanceTo(prev);prev=p;}
    return length;
  }
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
    const storageView=state.view==='folded';
    packEnvelopeCircle.visible=false;packEnvelopeBox.visible=false;
    storageEdges.visible=storageView;storageEdges.position.set(crownProfile.cx,crownY+state.packHeightM/2,crownProfile.cz);storageEdges.scale.y=state.packHeightM;storageEdges.computeLineDistances();
    guideGhost.visible=guideGhostCap.visible=storageView;const gp=mechanismPoints(petals[0]),foot=rotateLocal(0,0,-.36,petals[0].angle,.44,.06),gg=guideGhostGeometry.attributes.position;gg.setXYZ(0,foot.x,foot.y,foot.z);gg.setXYZ(1,gp.guide.x,gp.guide.y,gp.guide.z);gg.needsUpdate=true;guideGhostGeometry.computeBoundingBox();guideGhostGeometry.computeBoundingSphere();guideGhost.computeLineDistances();guideGhostCap.position.copy(gp.guide);
    const showPetals=!['folded','stage','trap','stem','leaves'].includes(state.view);
    for(const d of petals) {const selected=showPetals&&(!laboratory()||d.index===0);d.surface.visible=selected&&state.showSkin;d.surface.castShadow=state.showSkin;d.edge.visible=selected;d.edge.castShadow=!state.showSkin;updateParam(d.surface.geometry,(u,v)=>petalPoint(d,u,v));updateTube(d.edge.geometry,t=>outlinePoint(d,t));}
    throat.position.set(0,crownY+.19,.32);throat.visible=showPetals&&!laboratory()&&state.showSkin;
    const ringFractions=[0,.24,.48,.78,.90,1];
    ringYs=Array.from({length:6},(_,i)=>i===5?crownY:mix(.20+i*.06,.20+(crownY-.20)*ringFractions[i],state.liftProgress));
    for(let i=0;i<6;i++){stemRings[i].position.y=ringYs[i];stemRings[i].castShadow=!state.showSkin;}
    continuous.visible=state.showSkin&&state.stemMode==='continuous';for(const p of strips)p.visible=state.showSkin&&state.stemMode==='strips';
    continuous.castShadow=state.showSkin;for(const p of strips)p.castShadow=state.showSkin;
    updateParam(continuous.geometry,(u,v)=>stemPoint(u,v));for(let i=0;i<strips.length;i++)updateParam(strips[i].geometry,(u,v)=>stemPoint(u,v,i));
    for(const d of leaves){d.surface.visible=state.showSkin;d.surface.castShadow=state.showSkin;d.vein.castShadow=!state.showSkin;updateParam(d.surface.geometry,(u,v)=>leafPoint(d,u,v));updateTube(d.vein.geometry,t=>leafPoint(d,.5,t,false));}
    RAI.visible=showPetals&&(laboratory()||state.showRopes);CTL.visible=showPetals&&state.showRopes;ANT.visible=showPetals&&state.showRopes;
    for(let i=0;i<mechanics.length;i++){
      const d=petals[i],m=mechanics[i],v=mechanismPoints(d),selected=!laboratory()||i===0;
      m.r.visible=m.c.visible=m.a.visible=selected;
      m.axis.position.copy(v.root);m.axis.rotation.set(0,d.angle*Math.PI/180,Math.PI/2);
      m.rootBase.position.copy(rotateLocal(0,-.10,0,d.angle,.44,.06));m.rootBase.rotation.y=d.angle*Math.PI/180;
      for(let j=0;j<2;j++){m.bearings[j].position.copy(rotateLocal((j?1:-1)*.22,-.055,0,d.angle,.44,.06));m.bearings[j].rotation.y=d.angle*Math.PI/180;updateTube(m.cradles[j].geometry,t=>lineAt(v.root,petalPoint(d,j,.08,state.opening,false),t));}
      updateTube(m.crossbar.geometry,t=>lineAt(v.left,v.right,t));m.eye.position.copy(v.attachment);
      const foot=rotateLocal(0,0,-.36,d.angle,.44,.06);updateTube(m.post.geometry,t=>lineAt(foot,v.guide,t));m.guide.position.copy(v.guide);m.drum.position.copy(v.guide).add(new THREE.Vector3(0,-.14,0));
      updateTube(m.rope.geometry,t=>lineAt(v.attachment,v.guide,t));
      m.stay.visible=m.stayLeft.visible=rotationAngle()<5*Math.PI/180;updateTube(m.stay.geometry,t=>lineAt(v.stayPoint,v.guide,t));updateTube(m.stayLeft.geometry,t=>lineAt(petalPoint(d,0,.68,state.opening,false),v.guide,t));m.stop.position.copy(rotateLocal(0,-.08,.15,d.angle,.44,.06));m.stop.rotation.y=d.angle*Math.PI/180;
    }
    focusPoints.whole=[0,crownY*.47,0];focusPoints.folded=[0,crownY+state.packHeightM/2,0];focusPoints.petal=[-1.7,crownY+1.7,1];focusPoints.stem=[0,crownY*.48,0];focusPoints.leaves=[-1.9,ringYs[3]+.65,1];focusPoints.mechanism=[-1.7,crownY+1.6,1];focusPoints.trap=[0,state.chamberTopM+.45,0];focusPoints.stage=[0,state.chamberTopM,0];
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
    if(focus==='petal'){add(PET);add(ARO);add(RAI);add(CTL);add(ANT);}else if(focus==='stem')add(TAL);else if(focus==='leaves')add(HOJ);else if(focus==='folded'){add(COR);if(state.showMachine)add(ELEV);if(state.showStage)add(stageTrap.root)}else if(focus==='mechanism'){add(PET);add(ARO);add(RAI);add(CTL);add(ANT);}else{add(objectRoot);if(state.showMachine)add(ELEV);if(state.showStage)add(stageTrap.root)}
    if(b.isEmpty()){const r=cfg.crownDiameterM/2+.1;b.set(new THREE.Vector3(-r,crownY-.1,-r),new THREE.Vector3(r,crownY+state.packHeightM+.1,r));}return b;
  }
  function getMetrics() {
    root.updateMatrixWorld(true);const angle=state.azimuth*Math.PI/180,dir=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
    const p=integrateMeshes(petals.map(d=>d.surface),dir),s=integrateMeshes(state.stemMode==='continuous'?[continuous]:strips,dir),l=integrateMeshes(leaves.map(d=>d.surface),dir);
    const b=computeBounds({focus:'whole'}),fb=computeBounds({focus:'petal'}),size=b.getSize(new THREE.Vector3()),fsize=fb.getSize(new THREE.Vector3()),proj=p.projected+s.projected+l.projected;
    const spanH=(floorY-cfg.machineBaseTopM)/cfg.scissorStages,actualBar=Math.hypot(Math.sqrt(Math.max(.001,cfg.scissorBarLengthM**2-spanH**2)),spanH);
    const stageMetrics=stageTrap.getMetrics();
    const hoopBox=new THREE.Box3();for(const hp of hoopProfiles)for(let i=0;i<128;i++)hoopBox.expandByPoint(ellipsePoint(hp,i/128*TAU));
    return {revision:'F03',illustrativeOnly:true,currentBounds:{min:b.min.toArray(),max:b.max.toArray()},petalCount:5,
      petalAreasM2:nominalPetalAreas.length?nominalPetalAreas:[p.area],petalAreaM2:nominalPetalAreas.length?nominalPetalAreas.reduce((a,b)=>a+b,0):p.area,
      stemAreaM2:nominalStemAreas[state.stemMode==='strips'?'strips':'continuous']||s.area,
      leafAreaM2:nominalLeafArea||l.area,currentSurfaceAreaM2:p.area+s.area+l.area,
      projectedAreaM2:proj,projectedAreas:{petals:p.projected,stem:s.projected,leaves:l.projected},projectedCentroidYM:proj?(p.weightedY+s.weightedY+l.weightedY)/proj:0,forceHeightM:proj?(p.weightedY+s.weightedY+l.weightedY)/proj:0,
      areaBasis:'Superficie nominal abierta para pétalos/hojas; tallo nominal extendido. Proyección sumada de triángulos actuales, sin descontar solapes/oclusiones, sin validación aerodinámica. Mostrar/ocultar piel no retira material del escenario.',
      foldedPackageSolved:false,foldedPackageIsEmptyTarget:true,
      foldedPackageM:state.packMode==='box'?[2.3,state.packHeightM,.9]:[crownProfile.a*2,state.packHeightM,crownProfile.b*2],
      ringDiameterM:{top:Math.max(crownProfile.a,crownProfile.b)*2,bottom:Math.max(hoopProfiles[0].a,hoopProfiles[0].b)*2},
      hoops:hoopProfiles.map((h,i)=>({index:i+1,axesM:[h.a*2,h.b*2],centerM:[h.cx,ringYs[i],h.cz],yawDeg:h.yaw*180/Math.PI,cornerFactor:h.cornerFactor,declaredCornerMarginM:h.marginM,containsDeclaredPlatformCorners:h.cornerFactor<=1})),
      crownAxesM:[crownProfile.a*2,crownProfile.b*2],hoopPassageEnvelopeM:{min:hoopBox.min.toArray(),max:hoopBox.max.toArray(),clearLengthUsedM:stageMetrics.openingLengthM-state.deckThicknessM,clearWidthUsedM:stageMetrics.openingWidthM,insideDrawnOpening:Math.max(Math.abs(hoopBox.min.x),Math.abs(hoopBox.max.x))+.023<(stageMetrics.openingLengthM-state.deckThicknessM)/2&&Math.max(Math.abs(hoopBox.min.z),Math.abs(hoopBox.max.z))+.023<stageMetrics.openingWidthM/2,geometricOnly:true},
      bloomRelease:{mode:'NO se simula recuperación compacta; solo giro de raíz de un pétalo extendido',compactionSolved:false},
      petalMechanism:(()=>{const d=petals[0],v=mechanismPoints(d),perimeter=frameLength(d);return{model:'rigid-root-rotation',angleDeg:rotationAngle()*180/Math.PI,rootM:v.root.toArray(),attachmentM:v.attachment.toArray(),guideM:v.guide.toArray(),controlLengthM:v.attachment.distanceTo(v.guide),framePerimeterM:perimeter,referencePerimeterM:frameLength(d,1),framePerimetersM:petals.map(p=>frameLength(p)),guideAddedHeightM:.85,guideRadiusM:.055,guideCenterHeightM:crownY+.91,guideTopM:crownY+.965,stowedGuideCenterM:cfg.machineCompactTopM+.91,stowedGuideTopM:cfg.machineCompactTopM+.965,fixedGuideStorageOverrunM:Math.max(0,cfg.machineCompactTopM+.965-(state.chamberTopM-state.deckThicknessM)),hypotheticalVerticalTipNotStored:true,stowedExtendedTipM:cfg.machineCompactTopM+.06+cfg.petalLengthM,compactionSolved:false,storageTransitionAnimated:false,wholeFlowerOpeningAnimated:false,guideAndRootHardwareSized:false,ropeForcesCalculated:false,gravityDrivenStart:'Already extended and leaning outward70deg; not folded inward',durationIsPacingOnly:true};})(),
      scissorBarLengthM:actualBar,configuredScissorBarLengthM:cfg.scissorBarLengthM,
      machineCompactTopM:cfg.machineCompactTopM,officialCompactTopM:cfg.officialCompactTopM,compactPlatformFloorM:cfg.compactPlatformFloorM,crownOffsetM:cfg.crownOffsetM,railMode:cfg.railMode,storageTopM:cfg.storageTopM,storageRailsFolded:state.storageRailsFolded,shownMachineRailTopM:floorY+(cfg.railMode==='project'?0:state.storageRailsFolded?storageRailHeight:cfg.railHeightM),crownHeightM:crownY,platformFloorM:floorY,railHeightM:cfg.railHeightM,
      petalDimensionsM:petalDefs.map(d=>({length:d.length,width:d.width})),
      estimatedOuterDiameterM:Math.max(fsize.x,fsize.z),outerWidthM:fsize.x,currentHeightM:size.y,ringCount:6,ringYs:[...ringYs],
      chamberTopM:state.chamberTopM,trapOpen:state.trapProgress>=.999,chamberRaisedM:state.chamberTopM-cfg.stageTopM,chamberFootprintM:[stageMetrics.flatLengthM,stageMetrics.flatWidthM],deckThicknessM:state.deckThicknessM,stageLayout:stageMetrics,
      nominalNoDeckGapM:state.chamberTopM-(cfg.machineCompactTopM+state.packHeightM),stageUndersideM:cfg.stageTopM-state.deckThicknessM,chamberUndersideM:state.chamberTopM-state.deckThicknessM,stageThicknessM:state.deckThicknessM,
      nominalStageOverheadGapM:cfg.stageTopM-state.deckThicknessM-(cfg.machineCompactTopM+state.packHeightM),nominalOverheadGapM:state.chamberTopM-state.deckThicknessM-(cfg.machineCompactTopM+state.packHeightM),
      safetyStatus:'Guardado sin resolver. Giro rígido de raíz, guías, cordones, retención y elevadora son conceptos sin aprobación resistente o de fabricante. Viento de comparación; no predice estabilidad ni sensores.'};
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
