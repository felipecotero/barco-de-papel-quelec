import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {crearModelo} from './modelo.js?v=DL01';
import {prepararMicrofono} from './microfono.js?v=DL01';

const porId = id => document.getElementById(id);
const canvas = porId('scene');
function iniciar() {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.008, 45);
  const controles = new OrbitControls(camara, canvas);
  controles.enableDamping = true;
  controles.enablePan = false;
  controles.rotateSpeed = 0.72;
  function sol(color, intensidad, x, y, z) {
    const l = new THREE.DirectionalLight(color, intensidad);
    l.position.set(x,y,z);
    escena.add(l);
  }
  escena.add(new THREE.HemisphereLight(0xfff7df,0x627971,1.6));
  sol(0xffe3b6,2,2,4,3);
  sol(0xe4fff6,2.4,-2,3,-2);
  const modelo = crearModelo(THREE);
  escena.add(modelo.grupo);
  const detalle = modelo.crearDetalle();
  const caja = new THREE.Box3().setFromObject(detalle);
  const centroFruto = caja.getCenter(new THREE.Vector3());
  const medidaFruto = caja.getSize(new THREE.Vector3());
  escena.add(detalle);
  detalle.visible = false;

  // La sombra bajo la vara da una referencia de suelo sin ocultar los frutos en vuelo.
  const papel = document.createElement('canvas');
  papel.width = papel.height = 96;
  const tinta = papel.getContext('2d');
  const sombra = tinta.createRadialGradient(48,48,0,48,48,48);
  sombra.addColorStop(0,'rgba(4,13,11,.53)');
  sombra.addColorStop(.28,'rgba(4,13,11,.23)');
  sombra.addColorStop(1,'rgba(4,13,11,0)');
  tinta.fillStyle=sombra; tinta.fillRect(0,0,96,96);
  const pie = new THREE.Mesh(new THREE.PlaneGeometry(1.05,0.68),new THREE.MeshBasicMaterial({
    map:new THREE.CanvasTexture(papel),transparent:true,depthWrite:false,side:THREE.DoubleSide
  }));
  pie.rotation.x = -Math.PI/2;
  pie.position.y = -0.002;
  escena.add(pie);

  const centro = new THREE.Vector3(0,1.80,0);
  const arriba = new THREE.Vector3(0,1,0);
  const marco = porId('viewport');
  const etiquetas = porId('labels');
  const puntosFruto = [.92,.5,.10].map(fraccion => new THREE.Vector3(centroFruto.x,caja.min.y + medidaFruto.y*fraccion,centroFruto.z));
  let vista = 'cabeza', redibujar = true;
  function encuadrar(tipo) {
    vista = tipo;
    detalle.visible = tipo === 'fruto';
    modelo.grupo.visible = !detalle.visible;
    pie.visible = tipo === 'entero';
    etiquetas.hidden = !detalle.visible;
    const boton = document.querySelector('[data-view="'+ tipo +'"]');
    porId('view-label').textContent = boton.textContent;
    for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed',String(b === boton));
    const angulo = THREE.MathUtils.degToRad(camara.fov / 2);
    const objetivo = tipo === 'fruto' ? centroFruto : tipo === 'entero' ? new THREE.Vector3(0,1.075,0) : centro;
    let dist;
    if (tipo === 'entero') {
      dist = Math.max(1.17,0.45/camara.aspect) / Math.tan(angulo);
    } else if (tipo === 'fruto') {
      dist = Math.max(medidaFruto.y * .62, medidaFruto.x * .78/camara.aspect) / Math.tan(angulo);
    } else {
      dist = .37 / Math.sin(angulo) * Math.max(1,1.07/camara.aspect);
    }
    controles.minDistance = tipo === 'fruto' ? .11 : .29;
    controles.maxDistance = tipo === 'fruto' ? Math.max(dist*4,1.1) : 8;
    controles.target.copy(objetivo);
    const direccion = tipo === 'entero' ? new THREE.Vector3(.3,.02,1) :
      tipo === 'fruto' ? new THREE.Vector3(.23,.18,1) : new THREE.Vector3(.32,.12,1);
    camara.position.copy(objetivo).addScaledVector(direccion.normalize(),dist);
    controles.update();
    redibujar = true;
  }
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => encuadrar(b.dataset.view)));
  function ajustarTamano() {
    const {width,height} = marco.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const aspecto = width/height;
    const necesitaEncuadre = Math.abs(aspecto - camara.aspect) > .18;
    camara.aspect = aspecto;
    camara.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    if (necesitaEncuadre) encuadrar(vista);
    redibujar = true;
  }
  new ResizeObserver(ajustarTamano).observe(marco);
  ajustarTamano();
  encuadrar(vista);
  controles.addEventListener('change',() => { redibujar = true; });
  canvas.addEventListener('keydown', evento => {
    const teclas = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'];
    if (!teclas.includes(evento.key)) return;
    evento.preventDefault();
    const orbita = new THREE.Spherical().setFromVector3(camara.position.clone().sub(controles.target));
    if (evento.key === 'ArrowLeft') orbita.theta -= .13;
    if (evento.key === 'ArrowRight') orbita.theta += .13;
    if (evento.key === 'ArrowUp') orbita.phi -= .10;
    if (evento.key === 'ArrowDown') orbita.phi += .10;
    if ('+=-'.includes(evento.key)) orbita.radius = THREE.MathUtils.clamp(orbita.radius*(evento.key==='-' ? 1.15 : 1/1.15),controles.minDistance,controles.maxDistance);
    orbita.makeSafe();
    camara.position.setFromSpherical(orbita).add(controles.target);
    controles.update();
  });

  const semillas = modelo.semillas;
  const unidas = new Set();
  const vuelos = [];
  function actualizarCuenta() {
    porId('remaining').textContent = String(unidas.size);
    porId('fill').style.width = (100 * unidas.size/semillas.length) + '%';
    porId('blow').disabled = unidas.size === 0;
    porId('reset').disabled = unidas.size === semillas.length;
  }
  function reponer() {
    vuelos.length = 0;
    semillas.forEach((s,i) => { unidas.add(i); modelo.aplicarPose(i,s.posicion,s.orientacion,true); });
    modelo.actualizar();
    actualizarCuenta();
    redibujar = true;
  }
  function soplar(intensidad=.65) {
    if (!unidas.size) return;
    if (vista === 'fruto') encuadrar('cabeza');
    camara.updateMatrixWorld();
    const lateral = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 0);
    lateral.y = 0; lateral.normalize().applyAxisAngle(arriba,(Math.random()-.5)*1.15);
    if (Math.random() < .22) lateral.negate();
    const candidatos = Array.from(unidas, i => ({i, orden: semillas[i].direccion.dot(lateral) + Math.random()*1.45}));
    candidatos.sort((a,b) => b.orden-a.orden);
    const cantidad = Math.min(candidatos.length, Math.round(semillas.length*(.085+Math.random()*.07+intensidad*.11)));
    for (const {i} of candidatos.slice(0,cantidad)) {
      const s = semillas[i];
      unidas.delete(i);
      const viento = lateral.clone().applyAxisAngle(arriba,(Math.random()-.5)*.95).multiplyScalar(.21+Math.random()*.38+intensidad*.20);
      vuelos.push({i,edad:-Math.random()*.32, fase:Math.random()*Math.PI*2,
        p:s.posicion.clone(), q:s.orientacion.clone(), v:s.direccion.clone().multiplyScalar(.57+Math.random()*.34), fuera:false,
        viento, caida:.052+Math.random()*.09, giro: (Math.random()-.5)*1.2});
    }
    actualizarCuenta();
    redibujar = true;
  }
  porId('reset').addEventListener('click',reponer);
  porId('blow').addEventListener('click', () => soplar());
  const luz = porId('light');
  luz.disabled = false;
  luz.addEventListener('change',() => { modelo.luz(luz.checked); redibujar = true; });
  prepararMicrofono(porId('mic'),porId('mic-note'),soplar);
  reponer();
  const velocidad = new THREE.Vector3(), radial = new THREE.Vector3(), eje = new THREE.Vector3();
  const vertical = new THREE.Quaternion(), rotacion = new THREE.Quaternion();
  function avanzar(dt) {
    for (let k = vuelos.length-1; k >= 0; k--) {
      const f=vuelos[k];
      f.edad+=dt;
      if (f.edad<0) continue;
      const t=f.edad, onda=f.fase+t*2.2;
      // Primero sale por su radio. Después el arrastre orienta el penacho hacia arriba.
      if (!f.fuera && f.p.distanceToSquared(centro) >= .38*.38) f.fuera = true;
      if (f.fuera) {
        velocidad.copy(f.viento).multiplyScalar(.68+.38*Math.exp(-t*.8));
        velocidad.x+=.052*Math.sin(onda); velocidad.z+=.054*Math.cos(onda*.91);
        velocidad.y=.30*Math.exp(-t*.60)-f.caida+.065*Math.sin(onda);
        f.v.lerp(velocidad,1-Math.exp(-dt*3));
      }
      f.p.addScaledVector(f.v,dt);
      radial.copy(f.p).sub(centro);
      if (f.fuera && radial.lengthSq()<.38*.38) f.p.copy(centro).add(radial.setLength(.38));
      eje.set(.15*Math.cos(onda)+f.viento.x*.22,1,.13*Math.sin(onda)+f.viento.z*.22).normalize();
      vertical.setFromUnitVectors(arriba,eje);
      rotacion.setFromAxisAngle(arriba,f.fase+f.giro*t);
      vertical.multiply(rotacion);
      f.q.slerp(vertical,1-Math.exp(-dt*1.85));
      const visible=t<17 && f.p.y>.015 && f.p.distanceToSquared(centro)<55;
      modelo.aplicarPose(f.i,f.p,f.q,visible);
      if (!visible) vuelos.splice(k,1);
    }
    modelo.actualizar();
  }
  const posicionEtiqueta = new THREE.Vector3();
  function rotularFruto() {
    const w=marco.clientWidth, h=marco.clientHeight;
    puntosFruto.forEach((p,i) => {
      const punto = posicionEtiqueta.copy(p).project(camara);
      const etiqueta = etiquetas.children[i];
      const x = (punto.x*.5+.5)*w;
      const y = (-punto.y*.5+.5)*h;
      etiqueta.hidden = Math.abs(punto.x)>1 || Math.abs(punto.y)>.91 || punto.z>1;
      const izquierda = Math.min(w-58,x+Math.min(72,w*.15));
      etiqueta.style.left = izquierda+'px';
      etiqueta.style.setProperty('--guia',Math.max(0,izquierda-x-3)+'px');
      etiqueta.style.top = Math.max(0,y-7)+'px';
    });
  }
  let anterior;
  renderer.setAnimationLoop(ahora => {
    const dt = Math.min(.045,Math.max(0,(ahora-(anterior??ahora))/1000));
    anterior = ahora;
    if (document.hidden) return;
    controles.update();
    if (vuelos.length) { avanzar(dt); redibujar=true; }
    if (!redibujar) return;
    if (detalle.visible) rotularFruto();
    renderer.render(escena,camara);
    redibujar=false;
  });
  canvas.dataset.listo = 'si';
}
try { iniciar(); }
catch (error) {
  console.error('Visor del diente de león',error);
  canvas.hidden = true;
  porId('fallback').hidden = false;
  porId('hint').hidden = true;
  document.querySelectorAll('button, #light').forEach(b => { b.disabled = true; });
}
