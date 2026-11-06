/** Quelec · visual surface transparency. No geometry, simulation or export mutation.
 * Materials are cloned only for the synchronous render/snapshot, then restored in
 * finally. Existing animations always read/write their original materials.
 * 0% preserves the current finish, including any original translucency.
 */
(function(global){
 'use strict';
 const STYLE_ID='quelec-surface-transparency-style';
 function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent='.surface-transparency{border:1px solid var(--line,#3a5058);border-radius:9px;padding:14px;margin:16px 0 22px;background:rgba(12,24,30,.38);color:var(--text,var(--ink,#edf2ed))}.surface-transparency .surface-transparency-head{display:flex;align-items:center;gap:8px;margin:0 0 9px}.surface-transparency label{font:600 13px/1.4 Montserrat,Arial,sans-serif;flex:1;min-width:0;cursor:pointer}.surface-transparency .surface-transparency-icon{font:22px/1 Arial;color:var(--accent,var(--gold,#c6e7ae))}.surface-transparency output{font:600 14px/1.4 Arial,sans-serif;color:var(--accent,var(--gold,#c6e7ae));white-space:nowrap}.surface-transparency input[type=range]{display:block;width:100%;height:24px;margin:0!important;accent-color:var(--accent,var(--gold,#c6e7ae));cursor:pointer}.surface-transparency .surface-transparency-ends{display:flex;justify-content:space-between;gap:10px;margin-top:3px;font:11px/1.4 Arial,sans-serif;color:var(--muted,#a5b8bf)}.surface-transparency .surface-transparency-reset{display:block;margin:10px 0 0 auto;padding:5px 8px;border:1px solid var(--line,#3a5058);border-radius:5px;background:transparent;color:inherit;font:11px/1.4 Arial,sans-serif;cursor:pointer}.surface-transparency button:focus-visible,.surface-transparency input:focus-visible{outline:2px solid var(--accent,var(--gold,#c6e7ae));outline-offset:3px}';
  document.head.appendChild(s);
 }
 function install({renderer,getRoot,isSurface,label='Transparencia de superficies',container=null,onChange=null,getUnderlay=null}={}){
  if(!renderer||typeof renderer.render!=='function'||typeof getRoot!=='function'||typeof isSurface!=='function')throw Error('Faltan renderer, raíz o superficies del control de transparencia.');
  if(renderer.__quelecSurfaceTransparency)return renderer.__quelecSurfaceTransparency;
  style();let value=0,disposed=false,renderCount=0,lastSurfaceCount=0,inside=0;
  const clones=new WeakMap(),owned=new Set(),originalRender=renderer.render;
  const section=document.createElement('section');section.className='surface-transparency';section.setAttribute('aria-label',label);
  section.innerHTML='<div class="surface-transparency-head"><span class="surface-transparency-icon" aria-hidden="true">◐</span><label id="surface-transparency-label" for="surface-transparency"></label><output id="surface-transparency-value" for="surface-transparency">0 %</output></div><input id="surface-transparency" type="range" min="0" max="100" step="1" value="0"><div class="surface-transparency-ends"><span>Original</span><span>Transparente</span></div><button class="surface-transparency-reset" type="button" title="Recuperar la transparencia original de estas superficies">↺ Restablecer</button>';
  const input=section.querySelector('input'),output=section.querySelector('output');section.querySelector('label').textContent=label;input.title=label+' · 0 % conserva el acabado original; 100 % permite ver a través';input.setAttribute('aria-describedby','surface-transparency-value');
  const host=container||document.querySelector('#sidebar')||document.querySelector('aside')||document.body;
  const intro=host.querySelector(':scope > .intro');if(intro)intro.insertAdjacentElement('afterend',section);else host.prepend(section);
  function roots(){const r=getRoot();return(Array.isArray(r)?r:[r]).filter(Boolean);}
  function getTargets(){const out=[],seen=new Set();for(const r of roots())r.traverse?.(m=>{if(m.isMesh&&!seen.has(m)&&isSurface(m)){seen.add(m);out.push(m);}});lastSurfaceCount=out.length;return out;}
  function factorFor(m){return m?.isMesh&&isSurface(m)?1-value/100:1;}
  function materialFor(source,factor,depth=false){
   if(!source)return source;
   let record=clones.get(source);if(!record){record={material:source.clone(),version:-1,signature:''};clones.set(source,record);owned.add(record.material);}
   const m=record.material;
   m.copy(source);m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;
   m.opacity=(Number.isFinite(source.opacity)?source.opacity:1)*factor;
   m.transparent=true;m.depthWrite=false;
   if(source.alphaTest>0)m.alphaTest=source.alphaTest*factor;
   if(depth)m.blending=1; // THREE.NormalBlending; black alpha contact-depth pass.
   const sig=[m.transparent,m.depthWrite,m.alphaTest>0,m.map?.uuid||'',m.alphaMap?.uuid||'',m.side,m.transmission>0].join('|');
   if(record.version!==source.version||record.signature!==sig){m.needsUpdate=true;record.version=source.version;record.signature=sig;}
   return m;
  }
  function withMaterials(fn,renderScene=null){
   if(disposed||value===0||inside)return fn();
   const targets=getTargets(),targetSet=new Set(targets),saved=[],shown=[];let override=null;
   inside++;
   try{
    // A contact-shadow override needs per-surface alpha, while its opaque parts
    // retain the original override. This is confined to that declared depth pass.
    if(renderScene?.overrideMaterial?.userData?.quelecContactDepth){
     override=renderScene.overrideMaterial;renderScene.overrideMaterial=null;
     renderScene.traverse(m=>{if(!m.isMesh)return;saved.push([m,m.material,m.castShadow]);m.material=targetSet.has(m)?materialFor(override,1-value/100,true):override;});
    }else for(const m of targets){saved.push([m,m.material,m.castShadow]);m.material=Array.isArray(m.material)?m.material.map(s=>materialFor(s,1-value/100)):materialFor(m.material,1-value/100);if(value===100)m.castShadow=false;}
    for(const o of getUnderlay?.()||[])if(o&&!o.visible){shown.push(o);o.visible=true;}
    return fn();
   }finally{
    for(const[m,material,castShadow]of saved){m.material=material;m.castShadow=castShadow;}
    for(const o of shown)o.visible=false;
    if(override)renderScene.overrideMaterial=override;
    inside--;
   }
  }
  function wrappedRender(scene,camera){renderCount++;return withMaterials(()=>originalRender.call(this,scene,camera),scene);}
  renderer.render=wrappedRender;
  function setValue(next){next=Number(next);if(!Number.isFinite(next))return value;next=Math.max(0,Math.min(100,next));if(next===value)return value;value=next;input.value=String(value);output.textContent=value+' %';input.setAttribute('aria-valuetext',value+' % de transparencia adicional');onChange?.(value);return value;}
  input.addEventListener('input',()=>setValue(input.value));section.querySelector('button').onclick=()=>setValue(0);input.setAttribute('aria-valuetext','0 % de transparencia adicional');
  const api={element:section,input,getValue:()=>value,setValue,withMaterials,getTargets,matches:m=>!!m?.isMesh&&!!isSurface(m),getFactorForMesh:factorFor,
   refresh(){getTargets();return api;},getState(){return{value,surfaceCount:getTargets().length,renderCount,visualOnly:true,originalMaterialsRestored:inside===0};},
   dispose(){if(disposed)return;disposed=true;if(renderer.render===wrappedRender)renderer.render=originalRender;section.remove();for(const m of owned)m.dispose();delete renderer.__quelecSurfaceTransparency;}
  };
  renderer.__quelecSurfaceTransparency=api;getTargets();return api;
 }
 global.QuelecSurfaceTransparency={install};
})(window);
