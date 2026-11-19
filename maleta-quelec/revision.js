import {instalarMarcas} from './marcas.js';

const modelId='morral-quelec-MQ05';
const publicPage='https://felipecotero.github.io/barco-de-papel-quelec/maleta-quelec/';
const draftKey='quelec.morral.marcas.MQ05';
const fileLimit=3200000, linkLimit=64000;
const cut=(value,places)=>Number(value.toFixed(places));
const $=id=>document.getElementById(id);

function serializeReview(strokes, camera, target) {
  return {version:1,model:modelId,camera:camera.toArray().map(n=>cut(n,5)),
    target:target.toArray().map(n=>cut(n,5)),strokes:strokes.map(s=>({
      color:s.color,segments:s.segments.map(seg=>seg.map(p=>p.map((n,i)=>cut(n,i<3?5:3))))
    }))};
}
function readReview(value) {
  if(value?.version!==1 || value.model!==modelId || !Array.isArray(value.strokes) || value.strokes.length>256)
    throw Error('El archivo corresponde a otro modelo o versión.');
  const vector=a=>Array.isArray(a) && a.length===3 && a.every(n=>Number.isFinite(n)&&Math.abs(n)<=5);
  const distance=vector(value.camera)&&vector(value.target)?Math.hypot(...value.camera.map((n,i)=>n-value.target[i])):0;
  if(distance<.07 || distance>4)throw Error('La cámara guardada no es válida.');
  let points=0;
  for(const stroke of value.strokes){
    if(!/^#[a-f0-9]{6}$/i.test(stroke?.color) || !Array.isArray(stroke.segments) || !stroke.segments.length)
      throw Error('El archivo contiene un trazo incompleto.');
    for(const seg of stroke.segments){
      if(!Array.isArray(seg)||!seg.length||(points+=seg.length)>18000)throw Error('Cantidad de puntos no válida.');
      for(const p of seg)if(!Array.isArray(p)||p.length!==6||p.some(n=>!Number.isFinite(n)||Math.abs(n)>1.01)||Math.hypot(...p.slice(3))<.75)
        throw Error('Hay puntos de dibujo no válidos.');
    }
  }
  return value;
}
function encode64(bytes){
  let result='';
  for(let i=0;i<bytes.length;i+=8192) result+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(result).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
async function makeLink(review) {
  const source=new TextEncoder().encode(JSON.stringify(review));
  let bytes=source, prefix='j';
  if(typeof CompressionStream==='function'){
    bytes=new Uint8Array(await new Response(new Blob([source]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    prefix='z';
  }
  if(bytes.length>(linkLimit-10)*.75)throw Error('Este dibujo es largo. Usa «Guardar archivo» y comparte el archivo de marcas.');
  const url=new URL(location.protocol==='file:'?publicPage:location.href);
  url.search='';url.hash='marcas='+prefix+'.'+encode64(bytes);
  return url.href;
}
async function fromFragment(fragment){
  if(fragment.length>linkLimit || !/^#marcas=[zj]\.[\w-]+$/.test(fragment))throw Error('El enlace de marcas está incompleto.');
  const [mode,encoded]=fragment.slice(8).split('.');
  const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
  let text;
  if(mode==='z'){
    if(typeof DecompressionStream!=='function')throw Error('Abre este enlace en un navegador actualizado o importa el archivo de marcas.');
    const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    const decoder=new TextDecoder();let length=0;text='';
    for(;;){
      const chunk=await reader.read();if(chunk.done)break;
      length+=chunk.value.length;
      if(length>fileLimit){await reader.cancel();throw Error('El dibujo excede el tamaño permitido.');}
      text+=decoder.decode(chunk.value,{stream:true});
    }
    text+=decoder.decode();
  }else text=new TextDecoder().decode(bytes);
  return readReview(JSON.parse(text));
}

export async function enableReview(options,setCamera){
  const {camera,orbit} = options;
  const dialog=$('mark-dialog'), toggle=$('draw-mode'), field=$('share-url'), feedback=$('mark-feedback');
  let strokes=[],drawing=false,shared='',linkRequest=0;
  const state=()=>serializeReview(strokes,camera.position,orbit.target);
  function controls(){
    $('mark-tools').hidden=!drawing&&!strokes.length;
    $('undo-mark').disabled=!strokes.length;
    $('mark-count').textContent=strokes.length+(strokes.length===1?' trazo':' trazos');
    $('help').textContent=drawing?'Dibuja sobre la tela. Pulsa Girar para cambiar de lado.':'Arrastra para girar. Usa la rueda o dos dedos para acercarte.';
  }
  function save(){
    try{
      if(shared)sessionStorage.setItem(draftKey+'.shared',JSON.stringify({source:shared,review:state()}));
      else if(strokes.length)localStorage.setItem(draftKey,JSON.stringify(state()));
      else localStorage.removeItem(draftKey);
    }catch{ $('help').textContent='El navegador no pudo guardar las marcas. Usa Compartir marcas para conservarlas.'; }
  }
  const ink=instalarMarcas({...options,onChange:data=>{strokes=data;controls();save();}});
  function drawingMode(on){
    drawing=on;ink.setDrawing(on);toggle.setAttribute('aria-pressed',String(on));
    toggle.querySelector('span').textContent=on?'Girar':'Dibujar';
    controls();
  }
  function apply(review){
    ink.restore(review.strokes);strokes=ink.snapshot();
    setCamera(review.camera,review.target);controls();
  }
  function warn(text){if(!dialog.open)dialog.showModal();feedback.textContent=text;}
  async function loadReview(){
    const fragment=location.hash;
    const source=fragment.startsWith('#marcas=')?fragment:'';
    let value;
    if(source){
      try{const saved=JSON.parse(sessionStorage.getItem(draftKey+'.shared'));if(saved?.source===source)value=readReview(saved.review);}catch{}
      value??=await fromFragment(source);
    }else{
      try{const saved=localStorage.getItem(draftKey);if(saved)value=readReview(JSON.parse(saved));}catch{}
    }
    if(fragment!==location.hash)return;
    shared=source;
    if(value)apply(value);else{ink.restore([]);strokes=[];controls();}
  }
  async function refreshShare(){
    const request=++linkRequest;
    feedback.textContent='';field.value='';$('copy-url').disabled=true;$('export-marks').disabled=!strokes.length;
    if(!strokes.length){feedback.textContent='Dibuja sobre el morral o abre un archivo de marcas.';return;}
    try{
      const url=await makeLink(state());
      if(request!==linkRequest)return;
      field.value=url;$('copy-url').disabled=false;
    }catch(err){if(request===linkRequest)feedback.textContent=err.message;}
  }
  toggle.onclick=()=>drawingMode(!drawing);
  $('ink-color').oninput=e=>ink.setColor(e.target.value);
  ink.setColor($('ink-color').value);
  $('undo-mark').onclick=()=>ink.undo();
  $('share-marks').onclick=()=>{dialog.showModal();refreshShare();};
  $('copy-url').onclick=async()=>{
    try{await navigator.clipboard.writeText(field.value);feedback.textContent='Enlace copiado. Puedes pegarlo en el chat.';}
    catch{field.focus();field.select();feedback.textContent='Selecciona y copia el enlace para pegarlo en el chat.';}
  };
  $('export-marks').onclick=()=>{
    const blob=new Blob([JSON.stringify(state())],{type:'application/json'});
    const a=document.createElement('a');a.download='Morral-Quelec-marcas-MQ05.json';a.href=URL.createObjectURL(blob);
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  };
  $('load-marks').onclick=()=>$('import-marks').click();
  $('import-marks').onchange=async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      if(file.size>fileLimit)throw Error('El archivo supera el tamaño admitido.');
      const review=readReview(JSON.parse(await file.text()));
      if(strokes.length&&!window.confirm('¿Reemplazar los trazos actuales por los del archivo?'))return;
      if(shared)history.replaceState(null,'',location.href.split('#')[0]);
      shared='';apply(review);save();drawingMode(false);dialog.close();
    }catch(err){feedback.textContent=err instanceof SyntaxError?'El archivo no contiene marcas válidas.':err.message;}
  };
  orbit.addEventListener('end',()=>{if(strokes.length)save();});
  toggle.disabled=false;$('share-marks').disabled=false;controls();
  const load=()=>loadReview().catch(e=>{refreshShare();warn(e.message);});
  window.addEventListener('hashchange',load);
  await load();
}
