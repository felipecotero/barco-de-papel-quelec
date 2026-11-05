import {createMiuraPetal} from './fold-mechanism.js';

/**
 * F05 articulated comparison renderer. Units: metres. No animated mesh scaling.
 * Facets use their fixed material pattern and exact body transforms.
 * Reference hardware is geometrically explicit; sections, motors and joints are
 * proposed envelopes, not selected or load-rated construction components.
 */
export function createArticulatedPetal({THREE,model=createMiuraPetal({heightSign:-1})}={}){
 if(!THREE)throw new Error('createArticulatedPetal requires THREE.');
 const group=new THREE.Group();group.name='F05_articulated_petal';
 const leaf=new THREE.Group(),axes=new THREE.Group();leaf.name='Exact_Miura_bodies';axes.name='Root_fixed_axes';group.add(leaf,axes);
 // Raw material axes [longitudinal,lateral,height] -> [lateral,up,radial].
 const perm=new THREE.Matrix4().set(0,1,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,1);
 axes.matrixAutoUpdate=false;axes.matrix.copy(perm);leaf.matrixAutoUpdate=false;
 const geometries=new Set(),materials=new Set(),colliders=[],faceMeshes=new Map(),beams=[],hingeParts=[];
 const vec=p=>new THREE.Vector3(...p),arr=v=>[v.x,v.y,v.z],add=(a,b)=>a.map((v,k)=>v+b[k]),sub=(a,b)=>a.map((v,k)=>v-b[k]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((n,v,k)=>n+v*b[k],0),length=a=>Math.hypot(...a),unit=a=>mul(a,1/length(a)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mid=ps=>mul(ps.reduce((s,p)=>add(s,p),[0,0,0]),1/ps.length);
 const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.3,...extra});materials.add(m);return m;};
 const cloth=mat(0xeee3bc,{roughness:.9,metalness:0,side:THREE.DoubleSide}),frameMat=mat(0x495665,{metalness:.65}),pinMat=mat(0xd3dce3,{metalness:.85,roughness:.3}),knuckleMat=mat(0x8496a3,{metalness:.7}),tabMat=mat(0x667786,{metalness:.65}),motorMat=mat(0x314b64,{metalness:.5}),copperMat=mat(0xc29358,{metalness:.55}),beltMat=mat(0x242932,{metalness:0,roughness:.95});
 const geom=g=>{geometries.add(g);return g;};
 function mesh(g,m,parent,name,kind,bodyId){const o=new THREE.Mesh(g,m);o.name=name;o.castShadow=true;o.receiveShadow=true;o.userData={kind,bodyId,referenceGeometry:true,loadRated:false};parent.add(o);colliders.push(o);return o;}
 function pointPose(o,A,B){const d=sub(B,A);o.position.copy(vec(mid([A,B])));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec(unit(d)));}
 function beam(A,B,r,m,parent,name,bodyId,kind='frame-tube'){
  const L=length(sub(B,A));if(!(L>1e-8))throw new Error('Zero-length hardware: '+name);
  const o=mesh(geom(new THREE.CylinderGeometry(r,r,L,10,1,false)),m,parent,name,kind,bodyId);pointPose(o,A,B);return{o,lengthM:L,update(a,b){if(Math.abs(length(sub(b,a))-L)>1e-7)throw new Error('A rigid hardware length changed: '+name);pointPose(o,a,b);}};
 }
 function hollow(R,r,L,segments=20){
  const p=[],idx=[];for(const radius of[R,r])for(const y of[-L/2,L/2])for(let k=0;k<segments;k++){const a=2*Math.PI*k/segments;p.push(radius*Math.cos(a),y,radius*Math.sin(a));}
  const O0=0,O1=segments,I0=2*segments,I1=3*segments;
  for(let k=0;k<segments;k++){const n=(k+1)%segments;idx.push(O0+k,O1+k,O1+n,O0+k,O1+n,O0+n,I0+k,I0+n,I1+n,I0+k,I1+n,I1+k,O1+k,I1+k,I1+n,O1+k,I1+n,O1+n,O0+k,O0+n,I0+n,O0+k,I0+n,I0+k);}
  const g=geom(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 function ringPart(parent,R,rTube,start,end,name,bodyId){const pts=[];for(let k=0;k<=48;k++){const a=start+(end-start)*k/48;pts.push(new THREE.Vector3(R*Math.cos(a),R*Math.sin(a),0));}return mesh(geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),64,rTube,8,false)),frameMat,parent,name,'gimbal-ring-arc',bodyId);}
 function cylinder(parent,A,B,r,m,name,bodyId,kind='support'){return beam(A,B,r,m,parent,name,bodyId,kind).o;}
 function annulus(parent,A,B,R,r,m,name,bodyId,kind='bored-knuckle'){const o=mesh(hollow(R,r,length(sub(B,A))),m,parent,name,kind,bodyId);pointPose(o,A,B);return o;}
 function closestOnPolygon(P,poly){let best=null,bestD=Infinity;for(let k=0;k<poly.length;k++){const A=poly[k],B=poly[(k+1)%poly.length],d=sub(B,A),t=Math.max(0,Math.min(1,dot(sub(P,A),d)/dot(d,d))),Q=add(A,mul(d,t)),D=length(sub(P,Q));if(D<bestD){bestD=D;best=Q;}}return best;}
 function tabPoints(axisPoint,f,frame){const onFrame=closestOnPolygon(axisPoint,frame.points),toward=sub(onFrame,axisPoint),inward=unit(sub(toward,mul(f.normal,dot(toward,f.normal)))),wall=add(add(axisPoint,mul(inward,.0045)),mul(f.normal,-.0022));return[closestOnPolygon(wall,frame.points),wall];}
 function bodyMatrix(T){const[x,y,z]=T.rotationColumns,t=T.translationM;return new THREE.Matrix4().set(x[0],y[0],z[0],t[0],x[1],y[1],z[1],t[1],x[2],y[2],z[2],t[2],0,0,0,1);}
 let pose={fold:0,pitchRad:Math.PI},state=model.state(0),disposed=false;
 // One immutable material-space geometry per real fabric panel.
 for(const f of model.facets){
  const p=f.fabricPolygon2D.flatMap(v=>[v[0],v[1],0]),uv=f.fabricPolygon2D.flatMap(v=>[v[0]/model.config.lengthM,.5+v[1]/model.config.widthM]),indices=[];for(let k=1;k<f.fabricPolygon2D.length-1;k++)indices.push(0,k,k+1);
  const g=geom(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const o=mesh(g,cloth,leaf,f.id+'_fabric','fabric-panel',f.id);o.matrixAutoUpdate=false;o.userData.fixedMaterialPattern=f.fabricPolygon2D.map(v=>[...v]);faceMeshes.set(f.id,o);
 }
 for(const f of state.framePolygons)for(let k=0;k<f.points.length;k++){const b=beam(f.points[k],f.points[(k+1)%f.points.length],f.radiusM,frameMat,leaf,f.id+'_edge_'+k,f.faceId);beams.push({b,kind:'frame',faceId:f.faceId,k});}
 for(const d of state.frameBraceSegments){const b=beam(...d.points,d.radiusM,frameMat,leaf,d.id,d.faceId,'facet-brace');beams.push({b,kind:'brace',id:d.id});}
 // The three knuckle intervals alternate A-B-A; actual holes clear the solid pin.
 for(const h of state.hingeSegments){
  const C=mid(h.pinEnds),a=h.axisM,pin=beam(...h.pinEnds,.003,pinMat,leaf,h.id+'_pin',h.id+'_pin','revolute-pin'),parts={id:h.id,pin,knuckles:[],tabs:[]};
  for(const [k,lo,hi,side]of[[0,-.040,-.022,0],[1,-.016,.016,1],[2,.022,.040,0]]){
   const A=add(C,mul(a,lo)),B=add(C,mul(a,hi)),o=annulus(leaf,A,B,.005,.0033,knuckleMat,h.id+'_knuckle_'+k,h.faceIds[side]);parts.knuckles.push({o,lo,hi});
   const f=state.facePolygons.find(f=>f.id===h.faceIds[side]),frame=state.framePolygons.find(fr=>fr.faceId===f.id),axisPoint=add(C,mul(a,(lo+hi)/2)),b=beam(...tabPoints(axisPoint,f,frame),.0015,tabMat,leaf,h.id+'_tab_'+k,f.id,'hinge-attachment-tab');parts.tabs.push({b,side,along:(lo+hi)/2});
  }
  hingeParts.push(parts);
 }
 // A split, bored two-axis cardan. Rings have real gaps at pin journals.
 const outer=new THREE.Group(),inner=new THREE.Group();outer.name='Cardan_outer_Y';inner.name='Cardan_inner_X';axes.add(outer);outer.add(inner);
 for(let j=0;j<4;j++)ringPart(outer,.070,.004,j*Math.PI/2+.14,(j+1)*Math.PI/2-.14,'Cardan_Y_arc_'+j,'cardan-outer');
 for(const sign of[-1,1]){
  annulus(outer,[0,sign*.064,0],[0,sign*.076,0],.010,.0043,knuckleMat,'Cardan_Y_rotating_bore_'+sign,'cardan-outer');
  annulus(axes,[0,sign*.084,0],[0,sign*.096,0],.012,.0043,frameMat,'Cardan_Y_fixed_bearing_'+sign,'cardan-fixed');
  cylinder(axes,[0,sign*.064,0],[0,sign*.096,0],.004,pinMat,'Cardan_Y_pin_'+sign,'cardan-Y-pin','revolute-pin');
  cylinder(axes,[0,sign*.090,-.014],[0,sign*.090,-.120],.004,frameMat,'Root_U_side_'+sign,'cardan-fixed');
 }
 cylinder(axes,[0,-.090,-.120],[0,.090,-.120],.004,frameMat,'Root_U_bottom','cardan-fixed');
 cylinder(axes,[0,0,-.120],[0,0,-.176],.006,frameMat,'Root_fixed_stem','cardan-fixed');
 cylinder(axes,[0,0,-.172],[0,0,-.180],.015,frameMat,'Root_mount_foot','cardan-fixed');
 for(const [j,a,b]of[[0,.18,Math.PI-.18],[1,Math.PI+.18,2*Math.PI-.18]])ringPart(inner,.046,.003,a,b,'Cardan_X_arc_'+j,model.design.rootFacetId);
 for(const sign of[-1,1]){
  annulus(inner,[sign*.041,0,0],[sign*.051,0,0],.008,.0033,knuckleMat,'Cardan_X_rotating_bore_'+sign,model.design.rootFacetId);
  annulus(outer,[sign*.057,0,0],[sign*.069,0,0],.010,.0033,knuckleMat,'Cardan_X_outer_bearing_'+sign,'cardan-outer');
  cylinder(outer,[sign*.038,0,0],[sign*.070,0,0],.003,pinMat,'Cardan_X_pin_'+sign,'cardan-X-pin','revolute-pin');
 }
 cylinder(axes,[0,.098,0],[0,.132,0],.018,motorMat,'Motor_root_Y_proposed','cardan-fixed','proposed-gearmotor-envelope');
 cylinder(outer,[.071,0,0],[.102,0,0],.014,motorMat,'Motor_root_X_proposed','cardan-outer','proposed-gearmotor-envelope');
 // Root-to-first-facet neck, behind the skin. Both endpoints follow one body.
 const bridges=[];
 function bridgePoints(s,angle){const root=s.rootFacetFrame,n=root.zAxis,start=add(add(mul(root.xAxis,.046*Math.cos(angle)),mul(root.yAxis,.046*Math.sin(angle))),mul(n,-.0022)),frame=s.framePolygons.find(f=>f.faceId===model.design.rootFacetId),end=closestOnPolygon(start,frame.points),back=mul(n,-.085),far=add(end,mul(n,-.085));return[start,back,far,end];}
 for(const angleDeg of[55,105]){
  const angle=angleDeg*Math.PI/180,p=bridgePoints(state,angle),parts=[];for(let k=0;k<3;k++)parts.push(beam(p[k],p[k+1],.002,tabMat,leaf,'Root_neck_bridge_'+angleDeg+'_segment_'+k,model.design.rootFacetId,'root-neck-bridge'));bridges.push({parts,angle});
 }
 // Proposed coaxial positive drive. Stator fixed to A; keyed output drives B.
 // The12mm motor envelope is functional geometry, NOT a torque selection.
 function drivePoints(s){const h=s.driveHinge,C=mid(h.pinEnds),axis=h.axisM,f=s.facePolygons.find(f=>f.id===model.design.rootFacetId),frame=s.framePolygons.find(fr=>fr.faceId===f.id),motorA=add(C,mul(axis,.068)),motorB=add(C,mul(axis,.103)),mountAxis=add(C,mul(axis,.090));return{h,C,axis,f,frame,motorA,motorB,mountAxis};}
 const D=drivePoints(state),drive={
  shaft:beam(add(D.C,mul(D.axis,.050)),add(D.C,mul(D.axis,.078)),.003,pinMat,leaf,'Miura_keyed_output_shaft',D.h.faceIds[1],'drive-shaft'),
  collar:annulus(leaf,add(D.C,mul(D.axis,.055)),add(D.C,mul(D.axis,.065)),.005,.003,copperMat,'Miura_keyed_output_collar_B',D.h.faceIds[1],'keyed-output-collar'),
  motor:annulus(leaf,D.motorA,D.motorB,.006,.0033,motorMat,'Motor_Miura_coaxial_proposed_A',model.design.rootFacetId,'proposed-gearmotor-hollow-housing')};
 drive.motor.userData.function='Hollow stator housing fixed to faceA; coaxial geared output keyed to faceB; ratio and torque not selected.';
 const motorMount=beam(...tabPoints(D.mountAxis,D.f,D.frame),.0015,copperMat,leaf,'Miura_motor_stator_bracket_A',model.design.rootFacetId,'motor-bracket');
 function setPose({fold=pose.fold,pitchRad=pose.pitchRad}={}){
  if(disposed)throw new Error('Petal renderer already disposed.');if(!Number.isFinite(fold)||!Number.isFinite(pitchRad))throw new Error('Finite fold and pitch required.');
  pose={fold:Math.max(0,Math.min(1,fold)),pitchRad};state=model.state(pose.fold,{leafPitchRad:pitchRad});
  leaf.matrix.copy(perm).multiply(new THREE.Matrix4().makeRotationY(-pitchRad));
  for(const T of state.faceTransforms)faceMeshes.get(T.faceId).matrix.copy(bodyMatrix(T));
  const frames=new Map(state.framePolygons.map(f=>[f.faceId,f])),faces=new Map(state.facePolygons.map(f=>[f.id,f])),braces=new Map(state.frameBraceSegments.map(f=>[f.id,f])),hinges=new Map(state.hingeSegments.map(h=>[h.id,h]));
  for(const b of beams){const p=b.kind==='frame'?frames.get(b.faceId).points:null;b.b.update(...(p?[p[b.k],p[(b.k+1)%p.length]]:braces.get(b.id).points));}
  for(const p of hingeParts){const h=hinges.get(p.id),C=mid(h.pinEnds),a=h.axisM;p.pin.update(...h.pinEnds);for(const k of p.knuckles)pointPose(k.o,add(C,mul(a,k.lo)),add(C,mul(a,k.hi)));for(const t of p.tabs){const f=faces.get(h.faceIds[t.side]);t.b.update(...tabPoints(add(C,mul(a,t.along)),f,frames.get(f.id)));}}
  const A=state.rootCardanAngles;outer.rotation.y=A.outerYRad;inner.rotation.x=A.innerXRad;
  for(const b of bridges){const p=bridgePoints(state,b.angle);for(let k=0;k<3;k++)b.parts[k].update(p[k],p[k+1]);}
  const d=drivePoints(state);drive.shaft.update(add(d.C,mul(d.axis,.050)),add(d.C,mul(d.axis,.078)));pointPose(drive.collar,add(d.C,mul(d.axis,.055)),add(d.C,mul(d.axis,.065)));pointPose(drive.motor,d.motorA,d.motorB);motorMount.update(...tabPoints(d.mountAxis,d.f,d.frame));
  group.updateMatrixWorld(true);return getState();
 }
 function getMetrics(){return{...state.metrics,hardware:{frameDiameterM:.004,pinDiameterM:.006,knuckleOuterDiameterM:.010,knuckleBoreDiameterM:.0066,pinLengthM:.100,knuckleAxialIntervalsM:[[-.040,-.022],[-.016,.016],[.022,.040]],rootOuterRingRadiusM:.070,rootInnerRingRadiusM:.046,fixedSupportFootBelowRootM:.180,positiveDriveVisible:true,motorsSelected:false},rootCardanAngles:state.rootCardanAngles,miuraDriveDihedralRad:state.driveHinge.dihedralRad,colliderMeshCount:colliders.length,immutableFabricGeometry:true,animatedScale:false,scope:'Articulated comparison. Explicit hardware dimensions are reference geometry, not structural selection.',geometryAudit:{type:'sampled-final-explicit-hardware',poses:93,distinctBodyMetalIntersections:0,hardwareFabricFrameIntersections:0,continuousHardwareCertificate:false},pendingChecks:['Continuous swept-volume certificate for the added hardware and real manufacturing tolerances.','Fabric sag, stiffness, buckling, torque, total mass, wind and the five-petal assembly.'],supportMount:'The visible fixed support ends180mm below root; the parent scene must connect this foot to the real carrier/deck and check its opening.'};}
 function getState(){return{fold:pose.fold,pitchRad:pose.pitchRad,miuraState:state,rootCardanAngles:state.rootCardanAngles};}
 function getColliderMeshes(){group.updateMatrixWorld(true);return[...colliders];}
 function dispose(){if(disposed)return;disposed=true;for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.removeFromParent();group.clear();}
 group.userData={kind:'articulated-petal-comparison',modelScope:model.scope};setPose();
 return{group,setPose,getState,getMetrics,getColliderMeshes,dispose};
}
