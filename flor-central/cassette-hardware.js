/**
 * F06: open cradle and two-stage manual retaining catch for ONE continuous petal.
 * Coordinates [transverse X, up Y, outward Z], metres. Root is [0,0,0].
 * No reel, motor, segmented petal or animated metal scaling is introduced here.
 * The root collar and the closed tip catch have a REAL forward slot for the cloth.
 * These are reference envelopes, not selected materials, load ratings or tolerances.
 * Recovery energy, latch loads, counterweight balance and fatigue need measurements.
 */
export function createFoldCradle({THREE,tipStoredM=[0,.488383144988,0]}={}){
 if(!THREE)throw new Error('createFoldCradle requires THREE.');
 if(!Array.isArray(tipStoredM)||tipStoredM.length!==3||!tipStoredM.every(Number.isFinite))throw new Error('Finite stored-tip point required.');
 const group=new THREE.Group();group.name='F06_open_cradle_and_manual_catch';
 const fixed=new THREE.Group(),tipCatch=new THREE.Group();fixed.name='Cradle_fixed';tipCatch.name='Tip_catch_fixed';tipCatch.position.set(...tipStoredM);group.add(fixed,tipCatch);
 const meshes=[],geometries=new Set(),materials=new Set(),V=a=>new THREE.Vector3(...a),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
 const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.55,...extra});materials.add(m);return m;};
 const steel=material(0x91a6ae),dark=material(0x3c5863),brass=material(0xc7a266),handleMat=material(0xe2b879,{metalness:.05,roughness:.9});
 function mesh(parent,g,m,name,bodyId,kind){geometries.add(g);const o=new THREE.Mesh(g,m);o.name=name;o.castShadow=true;o.receiveShadow=true;o.userData={bodyId,kind,referenceGeometry:true,loadRated:false};parent.add(o);meshes.push(o);return o;}
 function rod(parent,a,b,r,m,name,bodyId='cradle-fixed',kind='cradle-tube'){
  const A=V(a),B=V(b),o=mesh(parent,new THREE.CylinderGeometry(r,r,A.distanceTo(B),16),m,name,bodyId,kind);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(Y,B.sub(A).normalize());return o;
 }
 // Closed annular-sector material, axis X. Angles are measured from +Z toward +Y.
 // Omitting an angular sector removes actual material; no opacity trick makes a slot.
 function collar(parent,{inner,outer,length,start=0,end=2*Math.PI,at=[0,0,0],name,bodyId='cradle-fixed',kind='slotted-collar'}){
  const N=Math.max(12,Math.ceil((end-start)/(2*Math.PI)*72)),p=[],idx=[],row=N+1;
  for(const radius of[outer,inner])for(const x of[-length/2,length/2])for(let i=0;i<=N;i++){const a=start+(end-start)*i/N;p.push(x,radius*Math.sin(a),radius*Math.cos(a));}
  const O0=0,O1=row,I0=2*row,I1=3*row;
  for(let i=0;i<N;i++){const j=i+1;idx.push(O0+i,O1+i,O1+j,O0+i,O1+j,O0+j,I0+i,I1+j,I1+i,I0+i,I0+j,I1+j,O0+i,O0+j,I0+j,O0+i,I0+j,I0+i,O1+i,I1+i,I1+j,O1+i,I1+j,O1+j);}
  if(end-start<2*Math.PI-1e-8)for(const i of[0,N])idx.push(O0+i,I0+i,I1+i,O0+i,I1+i,O1+i);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();g.userData={annularSector:{axis:'X',inner,outer,length,start,end}};
  const o=mesh(parent,g,steel,name,bodyId,kind);o.position.set(...at);return o;
 }
 const deg=d=>d*Math.PI/180;
 // No bottom sheet or transparent wall: a rigid frame stays below the cloth.
 for(const z of[.3,1.6])rod(fixed,[-1.8,-.035,z],[1.8,-.035,z],.014,steel,'Cradle_crossbar_'+z);
 for(const x of[-1.8,1.8])rod(fixed,[x,-.035,0],[x,-.035,1.9],.014,steel,'Cradle_side_rail_'+x);
 rod(fixed,[-1.8,-.12,-.12],[1.8,-.12,-.12],.014,dark,'Cradle_back_mount');
 for(const x of[-1.8,1.8])rod(fixed,[x,-.12,-.12],[x,-.035,0],.012,dark,'Cradle_back_link_'+x);
 rod(fixed,[0,-.12,-.12],[0,-.12,0],.012,dark,'Root_lower_mount');
 rod(fixed,[0,-.12,0],[0,-.009,0],.009,dark,'Root_collar_stem');
 const rootCollar=collar(fixed,{inner:.0023,outer:.009,length:.028,start:deg(20),end:deg(340),name:'Root_C_collar_real_cloth_slot'});
 // Catch uprights are behind the tip/cloth (negative Z), not through the panel.
 for(const x of[-.037,.037])rod(fixed,[x,-.12,-.12],[x,tipStoredM[1]+.015,tipStoredM[2]-.025],.006,dark,'Catch_rear_upright_'+x);
 const low=collar(tipCatch,{inner:.0025,outer:.009,length:.024,start:Math.PI,end:deg(340),name:'Tip_lower_open_saddle',kind:'retention-saddle'});
 rod(tipCatch,[-.037,-.025,-.160],[.037,-.025,-.160],.005,dark,'Catch_bottom_bridge');
 for(const x of[-.037,.037])rod(tipCatch,[x,-.025,-.032],[x,-.025,-.160],.003,dark,'Catch_rear_bridge_link_'+x);
 for(const x of[-.030,.030])rod(tipCatch,[x,-.025,-.160],[x,-.006,-.006],.003,dark,'Catch_saddle_mount_'+x);
 rod(tipCatch,[-.030,-.006,-.006],[.030,-.006,-.006],.003,dark,'Catch_saddle_front_bridge');
 // Lid hinge: a solid axle in real bored knuckles, behind the cloth.
 const pivot=[0,.015,-.025],lid=new THREE.Group();lid.name='Retention_lid_rotating';lid.position.set(...pivot);tipCatch.add(lid);
 const lidOrigin=pivot.map(v=>-v),lidCollar=collar(lid,{inner:.0025,outer:.009,length:.024,start:deg(20),end:Math.PI,at:lidOrigin,name:'Tip_upper_C_lid',bodyId:'retention-lid',kind:'retention-lid'});
 rod(tipCatch,[-.050,.015,-.025],[.050,.015,-.025],.003,brass,'Catch_hinge_axle','cradle-fixed','hinge-pin');
 for(const sign of[-1,1]){
  collar(tipCatch,{inner:.0033,outer:.007,length:.012,at:[sign*.037,.015,-.025],name:'Catch_fixed_hinge_bore_'+sign,kind:'hinge-bearing'});
  rod(tipCatch,[sign*.037,.015,-.032],[sign*.037,-.025,-.032],.003,dark,'Catch_hinge_fixed_web_'+sign);
 }
 collar(lid,{inner:.0033,outer:.006,length:.020,name:'Lid_hinge_rotating_bore',bodyId:'retention-lid',kind:'hinge-bearing'});
 // Two offset webs go around the real hinge bore, never across its axis.
 for(const x of[-.008,.008])rod(lid,[x,-.0065,0],[x,-.010,.017],.0025,steel,'Lid_rear_web_'+x,'retention-lid','lid-web');
 // The upper C lid meets the lower saddle at its rear split face; cloth exits +Z.
 // The webs terminate on the upper arc, above the split: no bar enters the saddle.
 // A small adjustable counterweight supplies a passive opening bias after unlock.
 // Its mass must be chosen from the measured lid mass/centre of gravity; no torque
 // or30s deployment law is inferred from the visible sphere.
 rod(lid,[0,0,-.007],[0,.025,-.100],.002,steel,'Lid_counterweight_arm','retention-lid','counterweight-arm');
 const counter=mesh(lid,new THREE.SphereGeometry(.015,20,14),brass,'Lid_adjustable_counterweight','retention-lid','proposed-counterweight');counter.position.set(0,.025,-.100);
 // A real90degree stop receives the lid toe; the weight biases it into the stop.
 rod(lid,[0,-.010,.017],[0,-.012,.036],.002,steel,'Lid_stop_toe','retention-lid','stop-toe');
 const toeBall=mesh(lid,new THREE.SphereGeometry(.002,16,12),steel,'Lid_stop_toe_round_end','retention-lid','stop-toe');toeBall.position.set(0,-.012,.036);
 for(const x of[-.037,.037])rod(tipCatch,[x,.015,-.025],[x,.056,-.013],.003,dark,'Catch_stop_column_'+x);
 rod(tipCatch,[-.037,.056,-.013],[.037,.056,-.013],.003,dark,'Catch_open_90_stop');
 // Axial locking pin sits behind the cloth, separate from the hinge and hoop.
 const lock=[0,0,-.017],lockRelative=lock.map((v,k)=>v-pivot[k]);
 collar(lid,{inner:.0023,outer:.0045,length:.012,at:lockRelative,name:'Lid_lock_tongue_bore',bodyId:'retention-lid',kind:'lock-bore'});
 rod(lid,[-.008,-.010,.017],[-.006,lockRelative[1]+.0045,lockRelative[2]],.002,steel,'Lid_lock_web','retention-lid','lid-web');
 for(const sign of[-1,1]){
  collar(tipCatch,{inner:.0023,outer:.0045,length:.010,at:[sign*.022,0,-.017],name:'Catch_fixed_lock_bore_'+sign,kind:'lock-bore'});
  rod(tipCatch,[sign*.022,-.0055,-.017],[sign*.037,-.025,-.025],.0025,dark,'Catch_lock_fixed_web_'+sign);
 }
 collar(tipCatch,{inner:.0023,outer:.0045,length:.020,at:[.060,0,-.017],name:'Catch_pin_park_bearing',kind:'lock-bore'});
 rod(tipCatch,[.060,-.0055,-.017],[.037,-.025,-.025],.0025,dark,'Catch_pin_park_support');
 const pin=new THREE.Group();pin.name='Retention_pin_50mm_translation';pin.position.set(...lock);tipCatch.add(pin);
 rod(pin,[-.030,0,0],[.084,0,0],.002,brass,'Catch_sliding_lock_pin','retention-pin','sliding-lock-pin');
 const knob=mesh(pin,new THREE.CylinderGeometry(.008,.008,.008,20),handleMat,'Catch_pull_handle','retention-pin','manual-handle');knob.position.set(.088,0,0);knob.quaternion.setFromUnitVectors(Y,X);
 let retentionOpen=0,gateAngleRad=0,pinTravelM=0;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function update({retentionOpen:q=retentionOpen}={}){
  if(!Number.isFinite(q))throw new Error('Finite retention opening required.');retentionOpen=Math.max(0,Math.min(1,q));
  pinTravelM=.050*smooth(retentionOpen/.4);gateAngleRad=Math.PI/2*smooth((retentionOpen-.4)/.6);
  pin.position.x=lock[0]+pinTravelM;lid.rotation.x=-gateAngleRad;group.updateMatrixWorld(true);return getMetrics();
 }
 function getMeshes(){group.updateMatrixWorld(true);return[...meshes];}
 function getMetrics(){return{scope:'One continuous petal: open cradle, slotted root collar and manual two-stage catch only. No motor or recovery-force prediction.',retentionOpen,pinTravelM,gateAngleRad,releaseComplete:retentionOpen===1,openingAllowed:retentionOpen===1,rootM:[0,0,0],tipStoredM:[...tipStoredM],rootSlotHalfAngleDeg:20,rootBoreDiameterM:.0046,tipSeatBoreDiameterM:.005,pinDiameterM:.004,pinLengthM:.114,pinStrokeM:.050,lidAngleMaxDeg:90,cradleWidthM:3.628,cradleLengthM:2.079,storedCatchTopM:tipStoredM[1]+.059,animatedScale:false,newElectricMotors:0,passiveLidOpening:'Adjustable counterweight; mass/torque unselected; real90degree stop.',counterweightLeverM:{behindHinge:.100,aboveHinge:.025},counterweightMassKg:null,intendedOpenStopContact:{toe:'Lid_stop_toe_round_end',stop:'Catch_open_90_stop',onlyAtRetentionOpen:1,analyticGapM:0,numericalToleranceM:1e-8},materialsSelected:false,loadRated:false,colliderMeshes:meshes.length,sequence:'Retract lock pin0–40%; then rotate catch lid40–100%; unfold cloth only after100%.',pending:['Measured lid mass/centre of gravity and required counterweight; actual petal recovery, friction and locking-pin load.','Complete finite-mesh collision review against the actual continuous petal.','Connection of the cradle to the approved lift accessory.']};}
 function dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.removeFromParent();group.clear();}
 update();return{group,update,getMeshes,getColliderMeshes:getMeshes,getMetrics,dispose};
}
