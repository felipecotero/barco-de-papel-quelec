/** F05 supported cable device. All coordinates are in the carrier's local frame.
 * Parts retain their dimensions. Update changes only real joint poses and the
 * position of the SAME constant-length cable along exact tangent/contact paths.
 * A geometric prototype: cable, bearing, brake and motor capacities are not chosen.
 */
import {solveCableRoute,sampleCableRoute,inspectCableRoute,CABLE_ROUTE_DEFAULTS} from './cable-route.js';
const TAU=2*Math.PI;
export function createCableHardware({THREE,options={}}={}){
 if(!THREE)throw new Error('THREE is required.');
 const cfg={...CABLE_ROUTE_DEFAULTS,totalCableM:7,minWrapAngleRad:4*Math.PI,maxWrapAngleRad:32*Math.PI,drumCenterM:[.95,-.25,-.9],...options};
 const V=a=>new THREE.Vector3(...a),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1),root=new THREE.Group();root.name='F05_Roldana_Tambor_Apoyados';
 const descriptors=[],materials=new Set(),geometries=new Set();let route=null,metrics=null;
 const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.65,...extra});materials.add(m);return m;};
 const steel=mat('#a9bac2'),dark=mat('#344b52'),brass=mat('#bd9b5d'),rubber=mat('#263334',{metalness:.05,roughness:.9}),wire=mat('#debd78',{metalness:.05,roughness:.9}),red=mat('#b46b5c'),pale=mat('#d6d5ba');
 function group(name,parent=root){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
 const fixed=group('Bastidor_fijo'),drum=group('Tambor_que_gira'),carriage=group('Carro_devanador_traslacion'),swivel=group('Bloque_autoalineante'),wheel=group('Roldana_que_gira',swivel),cables=group('Mismo_cabo_longitud_constante');
 function mesh(parent,geometry,material,name,role='fixed',body=parent.name){geometries.add(geometry);const o=new THREE.Mesh(geometry,material);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);descriptors.push({mesh:o,id:name,label:name.replaceAll('_',' '),role,body});return o;}
 function box(parent,size,material,name,role='fixed'){return mesh(parent,new THREE.BoxGeometry(...size),material,name,role);}
 function cyl(parent,r,h,material,name,role='fixed',segments=48){return mesh(parent,new THREE.CylinderGeometry(r,r,h,segments),material,name,role);}
 function annulusGeometry(inner,outer,length,segments=48){
  const p=[],ids=[];for(let j=0;j<4;j++){const rad=j<2?outer:inner,y=j%2?-length/2:length/2;for(let i=0;i<=segments;i++){const a=i/segments*TAU;p.push(rad*Math.cos(a),y,rad*Math.sin(a));}}
  const row=segments+1;for(let i=0;i<segments;i++){const a=i,b=i+1;ids.push(a,b,row+a,b,row+b,row+a,2*row+a,3*row+a,2*row+b,2*row+b,3*row+a,3*row+b,a,2*row+a,b,b,2*row+a,2*row+b,row+a,row+b,3*row+a,row+b,3*row+b,3*row+a);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();g.computeBoundingBox();g.userData={annulus:{inner,outer,length,segments}};return g;
 }
 function annulus(parent,inner,outer,length,material,name,role='fixed'){return mesh(parent,annulusGeometry(inner,outer,length),material,name,role);}
 function beam(parent,a,b,r,material,name,role='fixed'){
  const o=cyl(parent,r,V(b).distanceTo(V(a)),material,name,role,16);o.position.copy(V(a)).add(V(b)).multiplyScalar(.5);o.quaternion.setFromUnitVectors(Y,V(b).sub(V(a)).normalize());return o;
 }
 function supportStripGeometry(kind,longN,profN){
  // U-channel is a closed material shell behind an OPEN cavity. No transparent
  // disk is used to pretend that a cable has clearance.
  const count=(longN+1)*(profN+1)*2,g=new THREE.BufferGeometry(),p=new Float32Array(count*3),ids=[],row=profN+1,sheet=(longN+1)*row;
  for(let face=0;face<2;face++)for(let j=0;j<longN;j++)for(let k=0;k<profN;k++){const a=face*sheet+j*row+k,b=a+1,c=a+row,d=c+1;if(face)ids.push(a,c,b,b,c,d);else ids.push(a,b,c,b,d,c);}
  for(let j=0;j<longN;j++)for(const k of[0,profN]){const a=j*row+k,b=a+row,c=a+sheet,d=b+sheet;ids.push(a,c,b,b,c,d);}
  for(const j of[0,longN])for(let k=0;k<profN;k++){const a=j*row+k,b=a+1,c=a+sheet,d=b+sheet;ids.push(a,b,c,b,d,c);}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(ids);g.userData={kind,longN,profN,sheet};return g;
 }
 function fillSupport(g,fn){const{longN,profN,sheet}=g.userData,p=g.attributes.position;for(let outer=0;outer<2;outer++)for(let j=0;j<=longN;j++)for(let k=0;k<=profN;k++){const q=fn(j/longN,Math.PI/2+Math.PI*k/profN,!!outer);p.setXYZ(outer*sheet+j*(profN+1)+k,...q);}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
 function cableGeometry(segments,sides=10){const p=new Float32Array((segments+1)*(sides+1)*3),ids=[];for(let j=0;j<segments;j++)for(let k=0;k<sides;k++){const a=j*(sides+1)+k,b=a+1,c=a+sides+1,d=c+1;ids.push(a,b,c,b,d,c);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(p.length),3));g.setIndex(ids);g.userData={segments,sides,cosines:Array.from({length:sides+1},(_,k)=>Math.cos(k/sides*TAU)),sines:Array.from({length:sides+1},(_,k)=>Math.sin(k/sides*TAU))};return g;}
 function rotateVector(v,axis,angle){return V(v).applyAxisAngle(V(axis),angle).toArray();}
 function fillCable(g,point,tangent,normal,radius){
  const {segments,sides,cosines,sines}=g.userData,p=g.attributes.position,normals=g.attributes.normal,pa=p.array,na=normals.array;let offset=0,minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(let j=0;j<=segments;j++){
   const t=j/segments,q=point(t),tv=tangent(t),nv=normal(t),tl=Math.hypot(...tv),tx=tv[0]/tl,ty=tv[1]/tl,tz=tv[2]/tl,d=nv[0]*tx+nv[1]*ty+nv[2]*tz,nx0=nv[0]-d*tx,ny0=nv[1]-d*ty,nz0=nv[2]-d*tz,nl=Math.hypot(nx0,ny0,nz0),nx=nx0/nl,ny=ny0/nl,nz=nz0/nl,bx=ty*nz-tz*ny,by=tz*nx-tx*nz,bz=tx*ny-ty*nx;
   minX=Math.min(minX,q[0]-radius);maxX=Math.max(maxX,q[0]+radius);minY=Math.min(minY,q[1]-radius);maxY=Math.max(maxY,q[1]+radius);minZ=Math.min(minZ,q[2]-radius);maxZ=Math.max(maxZ,q[2]+radius);
   for(let k=0;k<=sides;k++){
    const c=cosines[k],s=sines[k],rx=nx*c+bx*s,ry=ny*c+by*s,rz=nz*c+bz*s;pa[offset]=q[0]+radius*rx;na[offset++]=rx;pa[offset]=q[1]+radius*ry;na[offset++]=ry;pa[offset]=q[2]+radius*rz;na[offset++]=rz;
   }
  }
  p.needsUpdate=true;normals.needsUpdate=true;g.boundingBox??=new THREE.Box3();g.boundingBox.min.set(minX,minY,minZ);g.boundingBox.max.set(maxX,maxY,maxZ);g.boundingSphere??=new THREE.Sphere();g.boundingBox.getCenter(g.boundingSphere.center);g.boundingSphere.radius=.5*Math.hypot(maxX-minX,maxY-minY,maxZ-minZ);
 }
 const seed=solveCableRoute([.95,.89,1.4],cfg);if(!seed.valid)throw new Error('Invalid initial device geometry: '+seed.reason);
 const axis=V(seed.drumAxis),U=V(seed.drumRadialU),W=V(seed.drumRadialV),C=V(seed.drumCenterM),pitch=cfg.groovePitchM/TAU,kHelix=Math.hypot(seed.drumCableRadiusM,pitch),phiMax=cfg.maxWrapAngleRad,x0=cfg.helixAxialStartM,x1=x0+pitch*phiMax,halfExtra=.03,drumAxialMid=(x0+x1)/2,drumLength=x1-x0+2*halfExtra;
 drum.position.copy(C);drum.quaternion.setFromUnitVectors(Y,axis);
 // Build the core in a simple y-axis mesh; grooves are built in world-local
 // coordinates on a separate rigid rotor, sharing the exact same rotation.
 const core=annulus(drum,.0125,seed.drumCoreRadiusM,drumLength,steel,'Tambor_nucleo_apoyo_real','support');core.position.y=drumAxialMid;
 const flangeR=seed.drumCableRadiusM+.025,flanges=[];
 for(const [j,x]of[x0-halfExtra-.003,x1+halfExtra+.003].entries()){const o=annulus(drum,.0125,flangeR,.006,steel,'Tambor_brida_'+j,'support');o.position.y=x;flanges.push(o);}
 const shaft=cyl(fixed,.012,drumLength+.13,dark,'Eje_del_tambor','fixed',24);shaft.position.copy(C).addScaledVector(axis,drumAxialMid);shaft.quaternion.setFromUnitVectors(Y,axis);
 const bearings=[];for(const [j,x]of[x0-halfExtra-.036,x1+halfExtra+.036].entries()){const o=annulus(fixed,.013,.025,.024,brass,'Cojinete_tambor_hueco_'+j);o.position.copy(C).addScaledVector(axis,x);o.quaternion.setFromUnitVectors(Y,axis);bearings.push(o);}
 const baseY=C.y-flangeR-.09,base=box(fixed,[drumLength+.32,.035,.34],dark,'Base_rigida_del_dispositivo');base.position.copy(C).addScaledVector(axis,drumAxialMid);base.position.y=baseY;
 for(const [j,b]of bearings.entries()){const a=b.position.clone();a.y=baseY+.0175;const e=b.position.clone();e.y-=.025;beam(fixed,a.toArray(),e.toArray(),.012,dark,'Montante_cojinete_'+j);}
 // Rotor grooves use the same fixed topology for the complete declared capacity.
 const grooveRotor=group('Ranura_helicoidal_solidaria_al_tambor');grooveRotor.position.copy(C);
 const drumGroove=mesh(grooveRotor,supportStripGeometry('drum',Math.ceil(phiMax/TAU*64),8),steel,'Garganta_U_helicoidal_real','support',drum.name);
 let grooveBuilt=false;
 // Brake has an actual disk and a split caliper with a material gap around it.
 const brakeX=x1+halfExtra+.025,brake=annulus(drum,.0125,.052,.006,brass,'Disco_de_freno_solidario','moving');brake.position.y=brakeX;
 const brakeWorld=C.clone().addScaledVector(axis,brakeX);for(const sign of[-1,1]){const p=box(fixed,[.003,.022,.033],red,'Pinza_freno_lado_'+(sign<0?'A':'B'));p.position.copy(brakeWorld).addScaledVector(U,.046).addScaledVector(axis,sign*.0065);p.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),axis);}
 const brakeBridge=box(fixed,[.018,.024,.008],red,'Puente_pinza_freno');brakeBridge.position.copy(brakeWorld).addScaledVector(U,.066);brakeBridge.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),axis);
 const motorX=x1+halfExtra+.11,motor=annulus(fixed,.019,.041,.10,dark,'Carcasa_motor_hueca_propuesta');motor.position.copy(C).addScaledVector(axis,motorX);motor.quaternion.setFromUnitVectors(Y,axis);
 const motorFootA=motor.position.clone();motorFootA.y=baseY+.0175;const motorFootB=motor.position.clone();motorFootB.y-=.041;beam(fixed,motorFootA.toArray(),motorFootB.toArray(),.012,dark,'Pata_motor_a_base');
 const brakeFootA=brakeBridge.position.clone().addScaledVector(axis,-.055);brakeFootA.y=baseY+.0175;const brakeFootB=brakeBridge.position.clone();brakeFootB.y-=.012;beam(fixed,brakeFootA.toArray(),brakeFootB.toArray(),.008,red,'Pata_pinza_a_base');
 const motorEnd=cyl(fixed,.041,.006,dark,'Tapa_posterior_motor');motorEnd.position.copy(C).addScaledVector(axis,motorX+.053);motorEnd.quaternion.setFromUnitVectors(Y,axis);
 // The winding contact stays at a fixed circumferential phase while a lead screw
 // moves the pulley carriage by one groove pitch per revolution of drum.
 const phase=cfg.helixEntryAngleRad,entryRadial=U.clone().multiplyScalar(Math.cos(phase)).addScaledVector(W,Math.sin(phase)),entryCirc=U.clone().multiplyScalar(-Math.sin(phase)).addScaledVector(W,Math.cos(phase)),tOut=axis.clone().multiplyScalar(pitch).addScaledVector(entryCirc,seed.drumCableRadiusM).normalize();
 const railBase=C.clone().addScaledVector(entryRadial,seed.drumCableRadiusM).addScaledVector(tOut,cfg.tangentLeadM).addScaledVector(U,-.15);railBase.y-=.15;
 const railLength=x1-x0+.14,rail=cyl(fixed,.009,railLength,steel,'Guia_lineal_fija_devanador');rail.position.copy(railBase).addScaledVector(axis,drumAxialMid);rail.quaternion.setFromUnitVectors(Y,axis);
 const screwBase=railBase.clone().addScaledVector(U,-.055),screw=cyl(fixed,.006,railLength,steel,'Husillo_fijo_longitud_constante');screw.position.copy(screwBase).addScaledVector(axis,drumAxialMid);screw.quaternion.setFromUnitVectors(Y,axis);
 const screwThread=mesh(fixed,cableGeometry(Math.ceil(railLength/cfg.groovePitchM*48),6),brass,'Rosca_husillo_acoplado','moving');
 for(const [j,x]of[x0-.055,x1+.055].entries()){const p=railBase.clone().addScaledVector(axis,x),foot=p.clone();foot.y=baseY+.0175;beam(fixed,foot.toArray(),p.toArray(),.01,dark,'Pata_guia_lineal_'+j);const crossEnd=screwBase.clone().addScaledVector(axis,x);beam(fixed,p.toArray(),crossEnd.toArray(),.008,dark,'Puente_husillo_'+j);}
 const slide=annulus(carriage,.010,.025,.04,brass,'Casquillo_carro_hueco','moving'),nut=annulus(carriage,.010,.024,.035,brass,'Tuerca_devanador_hueca','moving');
 const nutBridge=cyl(carriage,.006,1,brass,'Puente_tuerca_al_carro','moving',16);slide.quaternion.setFromUnitVectors(Y,axis);nut.quaternion.copy(slide.quaternion);
 // All following parts are cached geometry. Positions/orientations follow the
 // stated translation or swivel joint; nothing grows or telescopes.
 const swivelHousing=annulus(carriage,.025,.035,.026,dark,'Alojamiento_giro_hueco','moving'),swivelInner=annulus(swivel,.012,.024,.032,brass,'Collar_giratorio_paso_cabo','moving');swivelHousing.quaternion.setFromUnitVectors(Y,tOut);swivelInner.quaternion.copy(swivelHousing.quaternion);
 const housingArm=cyl(carriage,.009,1,dark,'Brazo_carro_al_soporte','moving',16);
 const yokeArms=[-1,1].map(sign=>cyl(swivel,.007,1,steel,'Horquilla_lateral_'+(sign<0?'A':'B'),'moving',16));
 const yokeBridges=[-1,1].map(sign=>cyl(swivel,.006,1,steel,'Enlace_collar_horquilla_'+(sign<0?'A':'B'),'moving',16));
 const sheaveAxle=cyl(swivel,.006,.112,steel,'Eje_roldana','moving',24);
 const wheelCore=annulus(wheel,.007,seed.sheavePitchRadiusM-cfg.cableRadiusM,.012,steel,'Roldana_nucleo_con_agujero','support');
 const sheaveGroove=mesh(wheel,supportStripGeometry('sheave',96,8),steel,'Roldana_garganta_U_real','support');
 const wheelFlanges=[];for(const[j,sign]of[-1,1].entries()){const o=annulus(wheel,.007,seed.sheavePitchRadiusM+.012,.003,steel,'Roldana_brida_'+j,'support');wheelFlanges.push({o,sign});}
 const spokes=[];for(let j=0;j<4;j++){const o=box(wheel,[.006,.006,seed.sheavePitchRadiusM*.64],pale,'Marca_giro_roldana_'+j,'moving');spokes.push({o,j});}
 const cableIncoming=mesh(cables,cableGeometry(1),wire,'Cabo_anclaje_a_roldana','cable'),cableArc=mesh(cables,cableGeometry(64),wire,'Cabo_arco_apoyado_roldana','cable'),cableLead=mesh(cables,cableGeometry(1),wire,'Cabo_tangente_a_tambor','cable'),cableStock=mesh(cables,cableGeometry(2048),wire,'Misma_reserva_apoyada_en_tambor','cable');
 // The small retaining eye stays within one10mm groove pitch, so the next
 // turn does not hit its outer wall. Its headed terminal has a flat underside
 // tangent to the core rather than a sphere falsely buried inside the metal.
 const headRadius=.006,headBottom=-cfg.cableRadiusM,headTheta=Math.acos(headBottom/headRadius),headG=new THREE.SphereGeometry(headRadius,24,16,0,TAU,0,headTheta),headPos=Array.from(headG.attributes.position.array),headIds=Array.from(headG.index.array),headCenter=headPos.length/3,headRingRadius=Math.sqrt(headRadius*headRadius-headBottom*headBottom);headPos.push(0,headBottom,0);for(let j=0;j<=24;j++){const a=j/24*TAU;headPos.push(headRingRadius*Math.cos(a),headBottom,headRingRadius*Math.sin(a));if(j<24)headIds.push(headCenter,headCenter+j+2,headCenter+j+1);}headG.setAttribute('position',new THREE.Float32BufferAttribute(headPos,3));headG.setIndex(headIds);headG.computeVertexNormals();
 const anchor=annulus(grooveRotor,.0045,.0062,.002,brass,'Anclaje_extremo_al_tambor','moving'),endStop=mesh(grooveRotor,headG,wire,'Terminal_engrosado_retenido','cable',drum.name);
 const anchorMaterial=axis.clone().multiplyScalar(x0).addScaledVector(U,seed.drumCableRadiusM),anchorTangent=axis.clone().multiplyScalar(pitch).addScaledVector(W,seed.drumCableRadiusM).normalize(),headContact=Math.sqrt(headRadius*headRadius-.0045*.0045);anchor.position.copy(anchorMaterial).addScaledVector(anchorTangent,headContact+.001);anchor.quaternion.setFromUnitVectors(Y,anchorTangent);endStop.position.copy(anchorMaterial);endStop.quaternion.setFromUnitVectors(Y,U);
 function placeSegment(o,a,b){const A=V(a),B=V(b),L=A.distanceTo(B);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(Y,B.sub(A).normalize());if(!o.userData.lengthM)o.userData.lengthM=L;
  // These arms are built only once at their real length; all allowed states are
  // rigid transformations of that support because the offset construction is fixed.
  const expected=o.userData.lengthM;if(Math.abs(L-expected)>1e-6)throw new Error('A rigid support changed length: '+o.name+' '+L+' / '+expected);
  if(o.geometry.parameters?.height===1&&!o.userData.fixedGeometry){const old=o.geometry;o.geometry=new THREE.CylinderGeometry(o.geometry.parameters.radiusTop,o.geometry.parameters.radiusBottom,L,16);geometries.add(o.geometry);old.dispose();o.userData.fixedGeometry=true;}
 }
 function update(endpoint){
  const next=solveCableRoute(endpoint,cfg);if(!next.valid){metrics={valid:false,reason:next.reason,hardwareSelected:false};return metrics;}
  route=next;const N=V(route.sheaveAxis),G=V(route.sheaveCenterM),B=V(route.sheaveExitM),S=B.clone().addScaledVector(tOut,-.14),q=railBase.clone().addScaledVector(axis,route.levelWindAxialM),qScrew=screwBase.clone().addScaledVector(axis,route.levelWindAxialM);
  drum.quaternion.setFromUnitVectors(Y,axis);drum.rotateY(route.drumRotationRad); // rotation about the actual fixed axle
  grooveRotor.quaternion.setFromAxisAngle(axis,route.drumRotationRad);
  if(!grooveBuilt){const saved=route.drumRotationRad;
    // Transform the already-defined material groove back to rotor coordinates.
    fillSupport(drumGroove.geometry,(u,theta,outer)=>V(route.drumGroovePoint(cfg.maxWrapAngleRad*u,theta,outer)).sub(C).applyAxisAngle(axis,-saved).toArray());grooveBuilt=true;
  }
  slide.position.copy(q);nut.position.copy(qScrew);
  const bridgeOffset=Y.clone().multiplyScalar(-.023);placeSegment(nutBridge,q.clone().add(bridgeOffset).toArray(),qScrew.clone().add(bridgeOffset).toArray());
  swivelHousing.position.copy(S);swivelInner.position.copy(S);
  const back=U.clone().negate().addScaledVector(tOut,U.dot(tOut)).normalize(),housingEnd=S.clone().addScaledVector(back,.035);
  placeSegment(housingArm,q.toArray(),housingEnd.toArray());
  for(let j=0;j<2;j++){const sign=j?1:-1,near=S.clone().addScaledVector(N,sign*.024),start=S.clone().addScaledVector(N,sign*.04),finish=G.clone().addScaledVector(N,sign*.04);placeSegment(yokeBridges[j],near.toArray(),start.toArray());placeSegment(yokeArms[j],start.toArray(),finish.toArray());}
  sheaveAxle.position.copy(G);sheaveAxle.quaternion.setFromUnitVectors(Y,N);
  wheelCore.position.copy(G);wheelCore.quaternion.setFromUnitVectors(Y,N);
  fillSupport(sheaveGroove.geometry,(u,theta,outer)=>route.sheaveGroovePoint(TAU*u,theta,outer));
  for(const{o,sign}of wheelFlanges){o.position.copy(G).addScaledVector(N,sign*.0085);o.quaternion.setFromUnitVectors(Y,N);}
  for(const{o,j}of spokes){const a=j*Math.PI/2+route.sheaveRotationRad,rad=V(route.sheaveBasisU).multiplyScalar(Math.cos(a)).addScaledVector(V(route.sheaveBasisV),Math.sin(a));o.position.copy(G).addScaledVector(rad,seed.sheavePitchRadiusM*.52).addScaledVector(N,.011);o.quaternion.setFromUnitVectors(Z,rad);}
  fillCable(cableIncoming.geometry,t=>V(route.endpointM).lerp(V(route.sheaveEntryM),t).toArray(),()=>V(route.sheaveEntryM).sub(V(route.endpointM)).normalize().toArray(),()=>route.sheaveAxis,cfg.cableRadiusM);
  fillCable(cableArc.geometry,t=>route.arcPoint(t),t=>{const a=route.sheaveEntryAngleRad+route.sheaveWrapAngleRad*t;return V(route.sheaveBasisU).multiplyScalar(-Math.sin(a)).addScaledVector(V(route.sheaveBasisV),Math.cos(a)).toArray();},()=>route.sheaveAxis,cfg.cableRadiusM);
  fillCable(cableLead.geometry,t=>V(route.sheaveExitM).lerp(V(route.entryPointM),t).toArray(),()=>V(route.entryPointM).sub(V(route.sheaveExitM)).normalize().toArray(),()=>route.sheaveAxis,cfg.cableRadiusM);
  fillCable(cableStock.geometry,t=>route.stockPoint(t),t=>{const theta=cfg.helixEntryAngleRad-route.stockWrapAngleRad*t;return axis.clone().multiplyScalar(-pitch).addScaledVector(U,route.drumCableRadiusM*Math.sin(theta)).addScaledVector(W,-route.drumCableRadiusM*Math.cos(theta)).normalize().toArray();},t=>rotateVector(route.sheaveAxis,route.drumAxis,-route.stockWrapAngleRad*t),cfg.cableRadiusM);
  const screwAngle=route.drumRotationRad,threadTurns=railLength/cfg.groovePitchM;
  fillCable(screwThread.geometry,t=>{const theta=t*threadTurns*TAU+screwAngle;return screwBase.clone().addScaledVector(axis,drumAxialMid+(t-.5)*railLength).addScaledVector(U,.008*Math.cos(theta)).addScaledVector(W,.008*Math.sin(theta)).toArray();},t=>{const theta=t*threadTurns*TAU+screwAngle;return axis.clone().multiplyScalar(railLength).addScaledVector(U,-.008*threadTurns*TAU*Math.sin(theta)).addScaledVector(W,.008*threadTurns*TAU*Math.cos(theta)).normalize().toArray();},t=>{const theta=t*threadTurns*TAU+screwAngle;return U.clone().multiplyScalar(Math.cos(theta)).addScaledVector(W,Math.sin(theta)).toArray();},.0015);
  // The tie-off is fixed to drum material phi=0 and rotates with the rotor.
  // Anchor and headed termination are fixed in drum material coordinates.
  root.updateMatrixWorld(true);
  const inspect=inspectCableRoute(route),sample=sampleCableRoute(route,{stockSegments:2048,sheaveSegments:64});
  metrics={valid:true,scope:'supported-cable-geometric-prototype',hardwareSelected:false,capacityValidated:false,materialResponseValidated:false,continuousCableLengthM:route.length.totalM,cableLengthErrorM:route.length.errorM,renderChordDeficitM:sample.chordDeficitM,stockTurns:route.stockTurns,drumRotationRad:route.drumRotationRad,sheaveRotationRad:route.sheaveRotationRad,levelWindAxialM:route.levelWindAxialM,carriagePointM:route.carriagePointM,sheaveCenterM:route.sheaveCenterM,sheaveAxis:route.sheaveAxis,swivelAxis:route.swivelAxis,tangency:inspect,metalMeshes:descriptors.filter(d=>d.role!=='cable').length,cableMeshes:4,drive:{drum:'Eje fijo; giro del tambor.',levelWind:'Husillo y carro: un paso de garganta por revolución.',selfAlign:'Collar hueco alrededor del tramo saliente y horquilla de la roldana.',brake:'Disco y pinza propuestos; capacidad y accionamiento por seleccionar.'}};
  return metrics;
 }
 function dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.removeFromParent();}
 return{group:root,update,getRoute:()=>route,getMeshes:()=>descriptors,getMetrics:()=>metrics,dispose};
}
