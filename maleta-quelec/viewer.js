import * as THREE from 'three';
import { GLTFLoader } from '../flores-pequenas/vendor/GLTFLoader.js';
import { OrbitControls } from '../vendor/OrbitControls.js';

import {enableReview} from './revision.js';

const viewDirections = {
  dibujo: [-1.30, 0.52, 1.06],
  frente: [0, 0.005, 1],
  dorso: [0, 0.005, -1],
  perfil: [-1, 0.005, 0]
};

export async function show(buffer) {
  const host = document.getElementById('viewport');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.domElement.setAttribute('aria-label','Morral de dinosaurio en tres dimensiones');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31,1,0.006,10);
  const orbit = new OrbitControls(camera,renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.10;
  orbit.maxPolarAngle = Math.PI * 0.995;
  orbit.minPolarAngle = Math.PI * 0.005;
  orbit.zoomSpeed = 0.85;
  const hemi = new THREE.HemisphereLight(0xfff9ed,0xceced0,1.65);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4df,2.6);
  key.position.set(-.73,1.08,.90); key.target.position.set(0,.23,0);
  key.castShadow = true; key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-.48,right:.48,top:.47,bottom:-.47,near:.15,far:3});
  key.shadow.bias=-0.00022; key.shadow.normalBias=.00032;
  key.shadow.radius=7;key.shadow.blurSamples=12;
  scene.add(key,key.target);
  const fill = new THREE.DirectionalLight(0xe1edff,.86);
  fill.position.set(.8,.42,.65); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff5e1,1.65);
  rim.position.set(.42,.88,-.82); scene.add(rim);
  const {scene: model} = await new GLTFLoader().parseAsync(buffer, '');
  scene.add(model); model.updateMatrixWorld(true);
  const cloud=[];
  const vertex=new THREE.Vector3();
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=true; mesh.receiveShadow=true;
    const pos=mesh.geometry.getAttribute('position');
    for(let i=0,step=Math.max(1,Math.floor(pos.count/3500));i<pos.count;i+=step){
      vertex.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);cloud.push(vertex.clone());
    }
    for (const mat of [].concat(mesh.material)){
      if(mat.map)mat.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      if(mat.normalMap)mat.normalMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    }
  });
  const box = new THREE.Box3().setFromObject(model,true);
  if(box.isEmpty())throw new Error('El archivo no contiene geometría.');
  const center=box.getCenter(new THREE.Vector3()), size=box.getSize(new THREE.Vector3());
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.ShadowMaterial({opacity:.11,color:0x524836,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.position.y=box.min.y-.0007;floor.receiveShadow=true;scene.add(floor);
  const shade=document.createElement('canvas'); shade.width=256;shade.height=256;
  const ctx=shade.getContext('2d'), g=ctx.createRadialGradient(128,128,0,128,128,126);
  g.addColorStop(0,'rgba(77,63,37,.27)');g.addColorStop(.34,'rgba(81,72,53,.14)');g.addColorStop(1,'rgba(112,104,90,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
  const shadowMap=new THREE.CanvasTexture(shade);shadowMap.colorSpace=THREE.SRGBColorSpace;
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(size.x*1.15,Math.max(size.z*1.9,.16)),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,toneMapped:false}));
  contact.rotation.x=-Math.PI/2;contact.position.set(center.x,box.min.y-.0005,center.z);scene.add(contact);
  orbit.minDistance=size.y*.17;orbit.maxDistance=size.y*7;
  const buttons=[...document.querySelectorAll('[data-view]')];let preset='dibujo', frame=0;
  function draw(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;orbit.update();floor.visible=contact.visible=camera.position.y>box.min.y;renderer.render(scene,camera)});
  }
  function fit(name){
    preset=name;
    const dir=new THREE.Vector3(...viewDirections[name]).normalize();
    camera.up.set(0,1,0);
    const right=new THREE.Vector3().crossVectors(camera.up,dir).normalize();
    const up=new THREE.Vector3().crossVectors(dir,right).normalize();
    const fovH=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5)), fovW=fovH*camera.aspect;
    let d=0;
    for (const point of cloud) {
      vertex.subVectors(point,center);
      const toward=vertex.dot(dir);
      d=Math.max(d,toward+1.15*Math.abs(vertex.dot(up))/fovH,toward+1.15*Math.abs(vertex.dot(right))/fovW);
    }
    orbit.target.copy(center);
    camera.position.copy(center).addScaledVector(dir,d);
    orbit.update();draw();
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  }
  orbit.addEventListener('change',draw);
  orbit.addEventListener('end',()=>{
    if(!preset)return;
    const dir=new THREE.Vector3().subVectors(camera.position,orbit.target).normalize();
    if(dir.dot(new THREE.Vector3(...viewDirections[preset]).normalize())<.996){
      preset=null;buttons.forEach(b=>b.setAttribute('aria-pressed','false'));
    }
  });
  for(const b of buttons)b.addEventListener('click',()=>fit(b.dataset.view));
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
    if(preset)fit(preset);else draw();
  }
  new ResizeObserver(resize).observe(host);resize();
  await enableReview({THREE,renderer,camera,model,scene,orbit,draw}, (position,target)=>{
    preset=null;
    buttons.forEach(b=>b.setAttribute('aria-pressed','false'));
    orbit.target.fromArray(target);camera.position.fromArray(position);orbit.update();draw();
  });
  document.getElementById('status').hidden=true;
  document.documentElement.dataset.loaded='true';
}
