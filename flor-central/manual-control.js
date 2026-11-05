import {createCableHardware} from './cable-hardware.js';
// Manual floor winch. The removed motor envelopes are replaced by a real handwheel.
// The two mirrored devices are separate controls; no automatic synchronization is claimed.
export function createManualControl({THREE,side=1}={}){
 const group=new THREE.Group();group.name='F06_floor_manual_winch_'+side;
 group.matrixAutoUpdate=false;
 const M=new THREE.Matrix4().makeRotationY(Math.PI/2);if(side<0)M.premultiply(new THREE.Matrix4().makeScale(-1,1,1));
 M.setPosition(side*2,0,-1.4);group.matrix.copy(M);const inv=M.clone().invert();
 const device=createCableHardware({THREE,options:{drumCenterM:[0,.65,0],totalCableM:18,minWrapAngleRad:4*Math.PI,maxWrapAngleRad:96*Math.PI}});group.add(device.group);
 for(const d of device.getMeshes())if(/motor/i.test(d.id))d.mesh.removeFromParent();
 const drum=device.group.getObjectByName('Tambor_que_gira');drum.attach(device.group.getObjectByName('Eje_del_tambor'));const mat=new THREE.MeshStandardMaterial({color:0xd6b47c,metalness:.45,roughness:.45}),steel=new THREE.MeshStandardMaterial({color:0x788c91,metalness:.6,roughness:.4}),extra=[];
 function mesh(g,parent,name,m=mat){const o=new THREE.Mesh(g,m);o.name=name;o.castShadow=true;o.userData={kind:'manual-control',bodyId:'manual-input'};parent.add(o);extra.push(o);return o;}
 function beam(a,b,r,parent,name,m=mat){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),o=mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),12),parent,name,m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return o;}
 const wheel=mesh(new THREE.TorusGeometry(.09,.006,8,48),drum,'Manual_handwheel');wheel.rotation.x=Math.PI/2;wheel.position.y=-.20;
 for(const a of[0,Math.PI/2,Math.PI,3*Math.PI/2])beam([0,-.20,0],[.09*Math.cos(a),-.20,.09*Math.sin(a)],.004,drum,'Handwheel_spoke');
 beam([0,-.07,0],[0,-.20,0],.009,drum,'Handwheel_keyed_hub');beam([.09,-.20,0],[.09,-.25,0],.012,drum,'Hand_grip');
 const foot=mesh(new THREE.BoxGeometry(1.02,.035,.50),device.group,'Manual_winch_floor_foot',steel);foot.position.set(-.17,.0175,0);
 for(const x of[-.40,.1])for(const z of[-.11,.11])beam([x,.035,z],[x,.4475,z],.012,device.group,'Floor_stand',steel);
 function update(endpointWorld){const local=new THREE.Vector3(...endpointWorld).applyMatrix4(inv).toArray();device.update(local);group.updateMatrixWorld(true);return getMetrics();}
 const toWorld=p=>new THREE.Vector3(...p).applyMatrix4(M).toArray();
 function getRoute(){const r=device.getRoute();return{...r,endpointM:toWorld(r.endpointM),sheaveEntryM:toWorld(r.sheaveEntryM),sheaveExitM:toWorld(r.sheaveExitM),sheaveCenterM:toWorld(r.sheaveCenterM),drumCenterM:toWorld(r.drumCenterM),anchorForceDirection:new THREE.Vector3(...r.anchorForceDirection).transformDirection(M).toArray(),pointAt:t=>toWorld(r.pointAt(t))};}
 function getMeshes(){return[...device.getMeshes().filter(d=>d.mesh.parent).map(d=>d.mesh),...extra];}
 function getMetrics(){const r=device.getRoute();return{valid:r?.valid,totalCableM:r?.length.totalM,activeM:r?.length.incomingM+r?.length.sheaveContactM+r?.length.toDrumM,reserveM:r?.length.reserveM,turns:r?.stockTurns,motors:0,manualInput:true,capacityChosen:false,scope:'Floor brake/handwheel; recovery of the actual hoop remains to be measured.'};}
 return{group,update,getRoute,getMeshes,getMetrics,dispose(){device.dispose();mat.dispose();steel.dispose();}};
}
