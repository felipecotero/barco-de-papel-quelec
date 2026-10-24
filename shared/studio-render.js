/**
 * Quelec Studio — fast image-based PBR, not path tracing. No runtime network.
 * Global API: QuelecStudio.installStudio({ THREE, renderer, scene, ground,
 *   getBounds: () => Box3, getObjects: () => [modelRoot], notify }).
 * setActive(true/false); setNight(bool); setBounds(Box3); invalidate(); update();
 * applyMaterial(material,{paper:true,texture,fastDiffuse:true}); getState(); dispose().
 * Call update() before your normal renderer.render(scene,camera). It never takes
 * ownership of your animation loop, camera, meshes, internal LEDs or exports.
 * Call invalidate() after changing assembly, visibility, or object geometry.
 * applyMaterial refines roughness/bump. fastDiffuse removes expensive glass-like
 * transmission only from the interactive paper view; keep your original material
 * and physical properties for the separate path tracer and exported model.
 * Lighting is prefiltered once with Three r180 RoomEnvironment / PMREM. Cached
 * contact shadows are an artistic screen-independent depth approximation, not GI.
 */
(function(global){
 'use strict';
/** @license Three.js r180 RoomEnvironment, MIT, Copyright Three.js authors.
 * Source: https://github.com/mrdoob/three.js/blob/r180/examples/jsm/environments/RoomEnvironment.js
 * The adaptation below accepts the existing THREE namespace rather than importing it. */
function createRoom(THREE) {
 const {BackSide,BoxGeometry,InstancedMesh,Mesh,MeshLambertMaterial,MeshStandardMaterial,PointLight,Scene,Object3D}=THREE;
/**
 * This class represents a scene with a basic room setup that can be used as
 * input for {@link PMREMGenerator#fromScene}. The resulting PMREM represents the room's
 * lighting and can be used for Image Based Lighting by assigning it to {@link Scene#environment}
 * or directly as an environment map to PBR materials.
 *
 * The implementation is based on the [EnvironmentScene](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts)
 * component from the `model-viewer` project.
 *
 * ```js
 * const environment = new RoomEnvironment();
 * const pmremGenerator = new THREE.PMREMGenerator( renderer );
 *
 * const envMap = pmremGenerator.fromScene( environment ).texture;
 * scene.environment = envMap;
 * ```
 *
 * @augments Scene
 * @three_import import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
 */
class RoomEnvironment extends Scene {

	constructor() {

		super();

		const geometry = new BoxGeometry();
		geometry.deleteAttribute( 'uv' );

		const roomMaterial = new MeshStandardMaterial( { side: BackSide } );
		const boxMaterial = new MeshStandardMaterial();

		const mainLight = new PointLight( 0xffffff, 900, 28, 2 );
		mainLight.position.set( 0.418, 16.199, 0.300 );
		this.add( mainLight );

		const room = new Mesh( geometry, roomMaterial );
		room.position.set( - 0.757, 13.219, 0.717 );
		room.scale.set( 31.713, 28.305, 28.591 );
		this.add( room );

		const boxes = new InstancedMesh( geometry, boxMaterial, 6 );
		const transform = new Object3D();

		// box1
		transform.position.set( - 10.906, 2.009, 1.846 );
		transform.rotation.set( 0, - 0.195, 0 );
		transform.scale.set( 2.328, 7.905, 4.651 );
		transform.updateMatrix();
		boxes.setMatrixAt( 0, transform.matrix );

		// box2
		transform.position.set( - 5.607, - 0.754, - 0.758 );
		transform.rotation.set( 0, 0.994, 0 );
		transform.scale.set( 1.970, 1.534, 3.955 );
		transform.updateMatrix();
		boxes.setMatrixAt( 1, transform.matrix );

		// box3
		transform.position.set( 6.167, 0.857, 7.803 );
		transform.rotation.set( 0, 0.561, 0 );
		transform.scale.set( 3.927, 6.285, 3.687 );
		transform.updateMatrix();
		boxes.setMatrixAt( 2, transform.matrix );

		// box4
		transform.position.set( - 2.017, 0.018, 6.124 );
		transform.rotation.set( 0, 0.333, 0 );
		transform.scale.set( 2.002, 4.566, 2.064 );
		transform.updateMatrix();
		boxes.setMatrixAt( 3, transform.matrix );

		// box5
		transform.position.set( 2.291, - 0.756, - 2.621 );
		transform.rotation.set( 0, - 0.286, 0 );
		transform.scale.set( 1.546, 1.552, 1.496 );
		transform.updateMatrix();
		boxes.setMatrixAt( 4, transform.matrix );

		// box6
		transform.position.set( - 2.193, - 0.369, - 5.547 );
		transform.rotation.set( 0, 0.516, 0 );
		transform.scale.set( 3.875, 3.487, 2.986 );
		transform.updateMatrix();
		boxes.setMatrixAt( 5, transform.matrix );

		this.add( boxes );


		// -x right
		const light1 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light1.position.set( - 16.116, 14.37, 8.208 );
		light1.scale.set( 0.1, 2.428, 2.739 );
		this.add( light1 );

		// -x left
		const light2 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light2.position.set( - 16.109, 18.021, - 8.207 );
		light2.scale.set( 0.1, 2.425, 2.751 );
		this.add( light2 );

		// +x
		const light3 = new Mesh( geometry, createAreaLightMaterial( 17 ) );
		light3.position.set( 14.904, 12.198, - 1.832 );
		light3.scale.set( 0.15, 4.265, 6.331 );
		this.add( light3 );

		// +z
		const light4 = new Mesh( geometry, createAreaLightMaterial( 43 ) );
		light4.position.set( - 0.462, 8.89, 14.520 );
		light4.scale.set( 4.38, 5.441, 0.088 );
		this.add( light4 );

		// -z
		const light5 = new Mesh( geometry, createAreaLightMaterial( 20 ) );
		light5.position.set( 3.235, 11.486, - 12.541 );
		light5.scale.set( 2.5, 2.0, 0.1 );
		this.add( light5 );

		// +y
		const light6 = new Mesh( geometry, createAreaLightMaterial( 100 ) );
		light6.position.set( 0.0, 20.0, 0.0 );
		light6.scale.set( 1.0, 0.1, 1.0 );
		this.add( light6 );

	}

	/**
	 * Frees internal resources. This method should be called
	 * when the environment is no longer required.
	 */
	dispose() {

		const resources = new Set();

		this.traverse( ( object ) => {

			if ( object.isMesh ) {

				resources.add( object.geometry );
				resources.add( object.material );

			}

		} );

		for ( const resource of resources ) {

			resource.dispose();

		}

	}

}

function createAreaLightMaterial( intensity ) {

	// create an emissive-only material. see #31348
	const material = new MeshLambertMaterial( {
		color: 0x000000,
		emissive: 0xffffff,
		emissiveIntensity: intensity
	} );

	return material;

}

return new RoomEnvironment();
}

 function installStudio({THREE,renderer,scene,ground=null,getBounds,getObjects,notify=()=>{},resolution=512}={}) {
  if(!THREE||!renderer||!scene)throw Error('El estudio necesita Three, renderer y escena.');
  if(!document.getElementById('quelec-studio-style')){const style=document.createElement('style');style.id='quelec-studio-style';style.textContent=`.studio-fast-control{background:#bfd7b1!important;color:#193126!important;border:1px solid #d8e7c9!important;padding:13px 16px!important;border-radius:7px;font-weight:700;cursor:pointer}.studio-fast-control.active{box-shadow:inset 0 0 0 1px #e8f3dc}.studio-quality-note{font-size:12px!important;color:#b6c7ca;line-height:1.6}.studio-ray-secondary{width:100%;font-size:12px;background:transparent;color:#b6c7ca;border:1px solid #495e65;border-radius:6px;padding:10px;cursor:pointer}#ray-status{font-size:11px;line-height:1.5;color:#a9bdc4}#studio-fast{min-width:0}aside>#studio-fast{width:100%;margin-top:12px}.light-presets{flex-wrap:wrap}`;document.head.append(style);}

  let active=false,night=false,dirty=true,lastContact=0,envTarget=null,disposed=false,ready=false;
  let contact=null,contactResources=null,passes=0,environmentMs=0,contactMs=0;
  const original={environment:scene.environment,environmentIntensity:scene.environmentIntensity,
   background:scene.background?.clone?.()||scene.background,fog:scene.fog?.color?.clone?.(),
   exposure:renderer.toneMappingExposure,toneMapping:renderer.toneMapping,
   groundColor:ground?.material?.color?.clone?.(),groundRoughness:ground?.material?.roughness};
  const managed=scene.children.filter(o=>o.isLight&&!o.isPointLight&&!o.isSpotLight).map(o=>({o,visible:o.visible}));
  const bounds=new THREE.Box3(new THREE.Vector3(-.7,0,-.5),new THREE.Vector3(.7,1,.5));
  const rig=new THREE.Group();rig.name='Quelec · estudio rápido PBR';scene.add(rig);
  const key=new THREE.DirectionalLight('#fff3df',2.1);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.000015;key.shadow.normalBias=.0005;
  key.shadow.radius=3;rig.add(key,key.target);
  const fill=new THREE.DirectionalLight('#d8e7ef',.75);rig.add(fill,fill.target);
  const rim=new THREE.DirectionalLight('#ffffff',1.1);rig.add(rim,rim.target);
  rig.visible=false;
  function ensureEnvironment(){
   if(envTarget)return;
   const start=performance.now(),room=createRoom(THREE),pmrem=new THREE.PMREMGenerator(renderer);
   try{envTarget=pmrem.fromScene(room,.035,.1,100,{size:256});}
   finally{room.dispose();pmrem.dispose();}
   environmentMs=performance.now()-start;ready=true;
  }
  function applyLight(){
   if(!active)return;
   scene.environment=envTarget.texture;scene.environmentIntensity=night?.27:.9;
   renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure=night?1.0:1.05;
   key.intensity=night?.38:2.1;fill.intensity=night?.12:.75;rim.intensity=night?.25:1.1;
   scene.background=new THREE.Color(night?'#101820':'#25323b');
   if(scene.fog?.color)scene.fog.color.copy(scene.background);
   if(ground?.material?.color){ground.material.color.set(night?'#111b25':'#31404a');ground.material.roughness=.96;}
   if(contact)contact.material.opacity=night?.16:.40;
  }
  function setBounds(value){
   const box=value||getBounds?.();if(box?.isBox3&&!box.isEmpty())bounds.copy(box);
   const c=bounds.getCenter(new THREE.Vector3()),s=bounds.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.5);
   key.position.copy(c).add(new THREE.Vector3(-.8,1.5,1.0).multiplyScalar(d));key.target.position.copy(c);
   fill.position.copy(c).add(new THREE.Vector3(1.2,.55,.4).multiplyScalar(d));fill.target.position.copy(c);
   rim.position.copy(c).add(new THREE.Vector3(.4,.9,-1.0).multiplyScalar(d));rim.target.position.copy(c);
   const sh=key.shadow.camera;Object.assign(sh,{left:-d*.8,right:d*.8,top:d*.8,bottom:-d*.8,near:.05,far:d*5});sh.updateProjectionMatrix();
   key.shadow.normalBias=d*.00014;
   if(contactResources)layoutContact();dirty=true;key.shadow.needsUpdate=true;
   return api;
  }
  function setActive(value=true){
   if(disposed)return false;
   value=!!value;if(value===active){if(value)applyLight();return active;}
   if(value){
    try{ensureEnvironment();active=true;rig.visible=true;for(const r of managed)r.o.visible=false;setBounds();applyLight();dirty=true;}
    catch(e){active=false;rig.visible=false;notify('No se pudo preparar el estudio: '+e.message);return false;}
   }else{
    active=false;rig.visible=false;for(const r of managed)r.o.visible=r.visible;
    scene.environment=original.environment;scene.environmentIntensity=original.environmentIntensity;
    scene.background=original.background?.clone?.()||original.background;
    if(original.fog&&scene.fog?.color)scene.fog.color.copy(original.fog);
    renderer.toneMapping=original.toneMapping;renderer.toneMappingExposure=original.exposure;
    if(original.groundColor&&ground?.material?.color)ground.material.color.copy(original.groundColor);
    if(ground?.material&&original.groundRoughness!==undefined)ground.material.roughness=original.groundRoughness;
    if(contact)contact.visible=false;
   }
   return active;
  }
  function setNight(value=false){night=!!value;if(active)applyLight();return api;}
  function applyMaterial(material,{paper=true,texture=null,fastDiffuse=false}={}){
   if(!material||!paper)return material;
   material.roughness=.91;material.metalness=0;
   if(texture){material.map=texture;material.bumpMap=texture;material.bumpScale=.000085;}
   if(material.isMeshPhysicalMaterial){material.clearcoat=0;material.sheen=.13;
    if(fastDiffuse&&material.transmission){material.transmission=0;material.needsUpdate=true;}}
   material.envMapIntensity=.85;
   return material;
  }
  function makeContact(){
   const w=Math.min(1024,Math.max(128,resolution));
   const opts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true};
   const source=new THREE.WebGLRenderTarget(w,w,opts),blurA=new THREE.WebGLRenderTarget(w,w,{...opts,depthBuffer:false}),blurB=new THREE.WebGLRenderTarget(w,w,{...opts,depthBuffer:false});
   const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.BasicDepthPacking,side:THREE.DoubleSide});
   depth.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );','gl_FragColor = vec4(0.0,0.0,0.0,pow(1.0-fragCoordZ,2.0)*0.9);');};
   depth.depthWrite=true;depth.blending=THREE.NoBlending;
   const camera=new THREE.OrthographicCamera(-1,1,1,-1,.001,2);camera.up.set(0,0,1);
   const blur=new THREE.ShaderMaterial({uniforms:{map:{value:null},direction:{value:new THREE.Vector2()}},depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'uniform sampler2D map; uniform vec2 direction; varying vec2 vUv; void main(){vec4 c=texture2D(map,vUv)*.227027; c+=(texture2D(map,vUv+direction*1.384615)+texture2D(map,vUv-direction*1.384615))*.316216; c+=(texture2D(map,vUv+direction*3.230769)+texture2D(map,vUv-direction*3.230769))*.070270; gl_FragColor=c;}'});
   const blurScene=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),blur);blurScene.add(quad);
   const blurCamera=new THREE.Camera();
   contact=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:blurB.texture,transparent:true,opacity:night?.16:.40,depthWrite:false,toneMapped:false}));
   const contactUV=contact.geometry.attributes.uv;for(let i=0;i<contactUV.count;i++)contactUV.setY(i,1-contactUV.getY(i));
   contact.name='Quelec · contacto suave aproximado';contact.rotation.x=-Math.PI/2;contact.renderOrder=1;contact.visible=false;scene.add(contact);
   contactResources={source,blurA,blurB,depth,camera,blur,blurScene,quad,blurCamera,w};layoutContact();
  }
  function layoutContact(){
   if(!contactResources)return;
   const c=bounds.getCenter(new THREE.Vector3()),s=bounds.getSize(new THREE.Vector3());
   const width=Math.max(.4,s.x*1.45),length=Math.max(.4,s.z*1.65),floor=ground?.position?.y??bounds.min.y-.012;
   contact.position.set(c.x,floor+.001,c.z);contact.scale.set(width,length,1);
   const camera=contactResources.camera;Object.assign(camera,{left:-width/2,right:width/2,top:length/2,bottom:-length/2,near:.001,far:Math.max(.25,s.y*.65)});
   camera.position.set(c.x,floor-.003,c.z);camera.lookAt(c.x,floor+1,c.z);camera.updateProjectionMatrix();
  }
  function renderContact(){
   if(!contactResources)makeContact();const r=contactResources;
   const old={target:renderer.getRenderTarget(),clear:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,
    background:scene.background,fog:scene.fog,override:scene.overrideMaterial,shadowAuto:renderer.shadowMap.autoUpdate};
   const hidden=[];const roots=getObjects?.();
   if(roots?.length){for(const o of scene.children)if(o.visible&&!roots.includes(o)){hidden.push(o);o.visible=false;}}
   else {if(ground?.visible){hidden.push(ground);ground.visible=false;}scene.traverse(o=>{if(o.visible&&(o.isLine||o.isSprite)){hidden.push(o);o.visible=false;}});}
   contact.visible=false;rig.visible=false;scene.background=null;scene.fog=null;scene.overrideMaterial=r.depth;
   renderer.shadowMap.autoUpdate=false;
   const start=performance.now();
   try{
    renderer.autoClear=true;renderer.setClearColor(0,0);renderer.setRenderTarget(r.source);renderer.clear();renderer.render(scene,r.camera);
    for(let i=0;i<2;i++){
     r.blur.uniforms.map.value=i?r.blurB.texture:r.source.texture;r.blur.uniforms.direction.value.set(1.4/r.w,0);renderer.setRenderTarget(r.blurA);renderer.clear();renderer.render(r.blurScene,r.blurCamera);
     r.blur.uniforms.map.value=r.blurA.texture;r.blur.uniforms.direction.value.set(0,1.4/r.w);renderer.setRenderTarget(r.blurB);renderer.clear();renderer.render(r.blurScene,r.blurCamera);
    }
    passes++;contactMs=performance.now()-start;
   }finally{
    for(const o of hidden)o.visible=true;rig.visible=active;contact.visible=active;
    scene.background=old.background;scene.fog=old.fog;scene.overrideMaterial=old.override;
    renderer.setRenderTarget(old.target);renderer.setClearColor(old.clear,old.alpha);renderer.autoClear=old.auto;renderer.shadowMap.autoUpdate=old.shadowAuto;
   }
  }
  function update(){
   if(!active||disposed)return false;
   const now=performance.now();
   if(dirty&&now-lastContact>110){try{renderContact();}catch(e){console.warn('Quelec contact shadow:',e);}dirty=false;lastContact=now;}
   return true;
  }
  function invalidate(){dirty=true;key.shadow.needsUpdate=true;return api;}
  function getState(){return{active,night,ready,engine:'PBR · entorno PMREM local · sombras suaves',environmentMs,contactMs,contactPasses:passes,samplesRequired:0};}
  function dispose(){setActive(false);disposed=true;rig.removeFromParent();key.shadow.map?.dispose();envTarget?.dispose();if(contactResources){const r=contactResources;for(const o of[r.source,r.blurA,r.blurB,r.depth,r.blur,r.quad.geometry,contact.geometry,contact.material])o.dispose();contact.removeFromParent();}}
  const api={setActive,setNight,setBounds,applyMaterial,invalidate,update,getState,dispose};
  setBounds();return api;
 }
 global.QuelecStudio={installStudio};
})(window);
