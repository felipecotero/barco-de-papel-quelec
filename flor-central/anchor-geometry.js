/** F05 fixed material anchor with a bored, closed-back two-axis cable terminal. */
export function createPetalAnchor({THREE,model}={}){
 if(!THREE||!model)throw new Error('Anchor requires THREE and the fixed Miura model.');
 const group=new THREE.Group();group.name='F05_fixed_material_cable_anchor';group.matrixAutoUpdate=false;
 const FACE='MF_3_3',BASE=[1.899927107438256,1.6784707803819716,-.0022],Q=[1.8939533467850118,1.7782921918309074,-.0022];
 const V=p=>new THREE.Vector3(...p),meshes=[],gs=new Set(),ms=new Set(),geom=g=>(gs.add(g),g);
 const steel=new THREE.MeshStandardMaterial({color:0xa9bbc5,metalness:.8,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:0x526776,metalness:.65,roughness:.5});ms.add(steel);ms.add(dark);
 function mesh(g,m,parent,name,bodyId){const o=new THREE.Mesh(g,m);o.name=name;o.userData={kind:'cable-terminal',bodyId,referenceGeometry:true,loadRated:false};o.castShadow=true;parent.add(o);meshes.push(o);return o;}
 function bar(A,B,r,parent,name,bodyId){const a=V(A),b=V(B),o=mesh(geom(new THREE.CylinderGeometry(r,r,a.distanceTo(b),12)),steel,parent,name,bodyId);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());return o;}
 function tube(R,r,L){const p=[],idx=[],N=24;for(const radius of[R,r])for(const y of[-L/2,L/2])for(let k=0;k<N;k++){const a=k*2*Math.PI/N;p.push(radius*Math.cos(a),y,radius*Math.sin(a));}for(let k=0;k<N;k++){let n=(k+1)%N;idx.push(k,N+k,N+n,k,N+n,n,2*N+k,2*N+n,3*N+n,2*N+k,3*N+n,3*N+k,N+k,3*N+k,3*N+n,N+k,3*N+n,N+n,k,n,2*N+n,k,2*N+n,2*N+k);}const g=geom(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 function bore(A,B,R,r,parent,name,bodyId){const a=V(A),b=V(B),o=mesh(tube(R,r,a.distanceTo(b)),dark,parent,name,bodyId);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());return o;}
 function arc(parent,R,r,a,b,name,bodyId){const p=[];for(let k=0;k<=32;k++){const t=a+(b-a)*k/32;p.push(new THREE.Vector3(R*Math.cos(t),R*Math.sin(t),0));}return mesh(geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),40,r,8)),steel,parent,name,bodyId);}
 const MOUNT_Z=93*Math.PI/180,end=new THREE.Group();end.position.copy(V(Q));end.rotation.z=MOUNT_Z;group.add(end);
 // A cantilever trunnion avoids surrounding the cable's swept cone with a U.
 // Its long bored housing represents two bearing seats; capacity is unselected.
 const elbow=V([-.045,0,0]).applyAxisAngle(new THREE.Vector3(0,0,1),MOUNT_Z).add(V(Q));
 bar(BASE,elbow.toArray(),.002,group,'Anchor_arm_base_segment','anchor-arm');
 // This fixed crank skirts the entire cable cone; a straight base-to-journal
 // segment would go through Q. All three segments remain rigid material bodies.
 bar([-.045,0,0],[0,.060,-.025],.002,end,'Anchor_arm_clearance_crank_L','anchor-arm');
 bar([0,.060,-.025],[.045,0,0],.002,end,'Anchor_arm_clearance_crank_R','anchor-arm');
 bore([.034,0,0],[.052,0,0],.0075,.0023,end,'Anchor_outer_fixed_dual_seat_housing','anchor-arm');
 bar([.026,0,0],[.050,0,0],.002,end,'Anchor_outer_cantilever_pin','anchor-X-pin');
 const outer=new THREE.Group(),inner=new THREE.Group();end.add(outer);outer.add(inner);
 // Outer axis X, inner axis Y, terminal axis Z. Gaps leave real pin bores.
 for(let j=0;j<4;j++)arc(outer,.030,.002,j*Math.PI/2+.24,(j+1)*Math.PI/2-.24,'Anchor_X_arc_'+j,'anchor-outer');
 arc(outer,.030,.002,Math.PI-.24,Math.PI+.24,'Anchor_X_solid_return_arc','anchor-outer');
 bore([.026,0,0],[.032,0,0],.006,.0023,outer,'Anchor_X_rotating_bore','anchor-outer');
 for(const sign of[-1,1]){
  bore([0,sign*.025,0],[0,sign*.031,0],.006,.0018,outer,'Anchor_Y_outer_bore_'+sign,'anchor-outer');
  bar([0,sign*.018,0],[0,sign*.031,0],.0015,outer,'Anchor_Y_pin_'+sign,'anchor-Y-pin');
 }
 for(const[j,a,b]of[[0,Math.PI/2+.30,3*Math.PI/2-.30],[1,3*Math.PI/2+.30,5*Math.PI/2-.30]])arc(inner,.022,.0015,a,b,'Anchor_Y_arc_'+j,'anchor-inner');
 for(const sign of[-1,1])bore([0,sign*.018,0],[0,sign*.023,0],.0055,.0018,inner,'Anchor_Y_rotating_bore_'+sign,'anchor-inner');
 const sleeve=bore([0,0,0],[0,0,.030],.006,.00325,inner,'Cable_closed_back_sleeve_30mm','anchor-inner');
 // The rear cap occupies z<0. Cable ends at Q,z=0 and cannot exit the back.
 bar([0,0,-.002],[0,0,0],.006,inner,'Cable_terminal_closed_back','anchor-inner');
 // Two cheek webs connect the sleeve base to its inner ring without a crossbar
 // through the hollow passage or the cable's forward half-line.
 for(const sign of[-1,1])bar([sign*.005,0,-.001],[sign*.0205,0,-.001],.0015,inner,'Terminal_rear_web_'+sign,'anchor-inner');
 let fold=0,pitchRad=Math.PI,lastDirection=[0,-1,0],angles={outerXRad:0,innerYRad:0},state;
 const perm=new THREE.Matrix4().set(0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1);
 function setCableDirection(dir){
  if(!dir||dir.length!==3||!dir.every(Number.isFinite)||Math.hypot(...dir)<1e-12)throw new Error('Finite anchor-to-guide direction required.');lastDirection=[...dir];
  const rotation=new THREE.Matrix4().extractRotation(group.matrix),local=V(dir).normalize().applyMatrix4(rotation.invert()).applyAxisAngle(new THREE.Vector3(0,0,1),-MOUNT_Z),beta=Math.asin(Math.max(-1,Math.min(1,local.x))),alpha=Math.atan2(-local.y,local.z);outer.rotation.x=alpha;inner.rotation.y=beta;angles={outerXRad:alpha,innerYRad:beta};group.updateMatrixWorld(true);return angles;
 }
 function setPose(next={}){
  fold=next.fold??fold;pitchRad=next.pitchRad??pitchRad;if(!Number.isFinite(fold)||!Number.isFinite(pitchRad))throw new Error('Finite anchor pose required.');state=model.state(fold);const T=state.faceTransforms.find(f=>f.faceId===FACE);if(!T)throw new Error('Anchor material facet missing.');const[x,y,z]=T.rotationColumns,t=T.translationM,M=new THREE.Matrix4().set(x[0],y[0],z[0],t[0],x[1],y[1],z[1],t[1],x[2],y[2],z[2],t[2],0,0,0,1);group.matrix.copy(perm).multiply(new THREE.Matrix4().makeRotationY(-pitchRad)).multiply(M);setCableDirection(lastDirection);return getEndpoint();
 }
 function getEndpoint(){return V(Q).applyMatrix4(group.matrix).toArray();}
 function getMeshes(){group.updateMatrixWorld(true);return[...meshes];}
 function getMetrics(){return{faceId:FACE,materialBase:[...BASE],materialEndpoint:[...Q],fixedMountAngleDeg:93,boreDiameterM:.0065,outerDiameterM:.012,sleeveLengthM:.030,backClosed:true,cableEndsAtFixedQ:true,outerSupport:'Single-sided trunnion in18mm bored dual-seat housing; strength and bearing selection pending.',angles,geometryAudit:{type:'sampled-final-explicit-hardware',poses:93,intersectionsFound:0,continuousHardwareCertificate:false},scope:'Reference two-axis terminal with sampled geometry review completed; force rating and bearing selection remain unvalidated.',pending:['Continuous swept-volume certificate and real manufacturing tolerances.','Bearing loads, stiffness, fatigue and actual attachment capacity.']};}
 function dispose(){for(const g of gs)g.dispose();for(const m of ms)m.dispose();group.removeFromParent();group.clear();}
 setPose();return{group,setPose,getEndpoint,setCableDirection,getMeshes,getMetrics,dispose};
}
