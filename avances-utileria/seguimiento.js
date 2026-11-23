'use strict';

const colores = [
  ['rojo', '#e06666', 'Sin iniciar'],
  ['naranja', '#f6b26b', 'Priorizar'],
  ['amarillo', '#ffd966', 'Cerrar pendientes'],
  ['verde claro', '#93c47d', 'Revisar remates'],
  ['verde', '#00ff00', 'Listo reportado'],
  ['sin color', '#ffffff', 'Sin clasificar']
];
const paleta = new Map(colores.map(([nombre, tono]) => [nombre, tono]));
const filtros = document.querySelector('#filtros');
const buscar = document.querySelector('#buscar');
const grupo = document.querySelector('#grupo');
const fichas = document.querySelector('#fichas');
const fecha = document.querySelector('#fecha');
const aviso = document.querySelector('#aviso');
const boton = document.querySelector('#actualizar');
const estadosPublicos = 'https://raw.githubusercontent.com/felipecotero/barco-de-papel-quelec/main/avances-utileria/estado.json';
const orden = colores.map(([nombre]) => nombre);
const botones = new Map();
const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric'
});

let partidaBase = [];
let partidas = [];
let seleccionado = '';
let corteActual = '';
let enConsulta = false;

function crear(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}
function muestra(color) {
  const marca = crear('span', undefined, 'muestra');
  marca.style.setProperty('--muestra', paleta.get(color));
  marca.setAttribute('aria-hidden', 'true');
  return marca;
}
function rotulo(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function dibujarFicha(p, abierta) {
  const ficha = crear('details');
  ficha.dataset.id = p.id;
  ficha.open = abierta;
  const titulo = crear('summary');
  const clave = crear('span', undefined, 'clave');
  clave.append(muestra(p.color), p.id + ' · ' + rotulo(p.color));
  titulo.append(clave, crear('strong', p.elemento));
  const detalle = crear('div', undefined, 'detalle');
  const dl = crear('dl');
  for (const [etiqueta, valor] of [['Cantidad', p.cantidad], ['Estado escrito', p.estado || 'Sin registrar'], ['Grupo propuesto', p.grupo]]) {
    const campo = crear('div');
    campo.append(crear('dt', etiqueta), crear('dd', valor));
    dl.append(campo);
  }
  detalle.append(dl, crear('p', p.detalle));
  ficha.append(titulo, detalle);
  return ficha;
}
function mostrar() {
  const termino = normalizar(buscar.value);
  const visibles = partidas.filter(p =>
    (!seleccionado || p.color === seleccionado) && (!grupo.value || p.grupo === grupo.value) && normalizar(p.id + ' ' + p.elemento).includes(termino)
  );
  visibles.sort((a, b) => orden.indexOf(a.color) - orden.indexOf(b.color) || a.id.localeCompare(b.id));
  const abiertas = new Set(Array.from(fichas.querySelectorAll('details[open]'), el => el.dataset.id));
  const focoEn = document.activeElement?.closest('#fichas details')?.dataset.id;
  fichas.replaceChildren(...visibles.map(p => dibujarFicha(p, abiertas.has(p.id))));
  if (focoEn) Array.from(fichas.children).find(el => el.dataset.id === focoEn)?.querySelector('summary')?.focus({preventScroll:true});
  for (const [color, {control, cantidad}] of botones) {
    control.setAttribute('aria-pressed', String(seleccionado === color));
    cantidad.textContent = String(color ? partidas.filter(p => p.color === color).length : partidas.length);
  }
  document.querySelector('#resultados').textContent = visibles.length ?
    visibles.length + ' de ' + partidas.length + ' partidas' : 'Ninguna partida coincide con la búsqueda o el filtro.';
}
for (const [color, , descripcion] of [['', '', 'Todas las partidas'], ...colores]) {
  const control = crear('button');
  control.type = 'button';
  control.title = descripcion;
  if (color) control.append(muestra(color));
  const cantidad = crear('span', '0');
  control.append(color ? rotulo(color) : 'Todas', cantidad);
  control.setAttribute('aria-pressed', String(!color));
  control.addEventListener('click', () => { seleccionado = color; mostrar(); });
  filtros.append(control);
  botones.set(color, {control, cantidad});
}
buscar.addEventListener('input', mostrar);
grupo.addEventListener('change', mostrar);

async function leerJSON(url) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), 9000);
  try {
    const respuesta = await fetch(url, {cache:'no-store', credentials:'omit', signal:control.signal});
    if (!respuesta.ok) throw new Error('Lectura no disponible');
    return await respuesta.json();
  } finally {
    clearTimeout(reloj);
  }
}
function fechaCorte(iso) {
  // Las fechas sin hora identifican todo un día calendario de Bogotá.
  return new Date(iso.length === 10 ? iso + 'T05:00:00Z' : iso);
}
function mostrarCorte(iso) {
  fecha.textContent = 'Corte del ' + formatoFecha.format(fechaCorte(iso));
}
function aplicar(estado) {
  const {actualizado, partidas: cambios} = estado;
  if (typeof actualizado !== 'string' || !Number.isFinite(fechaCorte(actualizado).getTime()) ||
      !cambios || typeof cambios !== 'object' || Array.isArray(cambios)) throw new Error('Corte inválido');
  const siguientes = partidaBase.map(p => {
    const registro = cambios[p.id];
    if (!registro || !paleta.has(registro.color) || typeof registro.estado !== 'string') throw new Error('Partida incompleta');
    return {...p, color:registro.color, estado:registro.estado};
  });
  if (fechaCorte(actualizado) < fechaCorte(corteActual)) return;
  if (partidas.some((p, i) => p.color !== siguientes[i].color || p.estado !== siguientes[i].estado)) {
    partidas = siguientes;
    mostrar();
  }
  corteActual = actualizado;
  mostrarCorte(actualizado);
}
async function actualizar(manual = false) {
  if (enConsulta) return;
  enConsulta = true;
  boton.disabled = true;
  if (manual) aviso.textContent = 'Comprobando el corte publicado…';
  try {
    if (!partidaBase.length) {
      const base = await leerJSON('datos.json');
      if (!Array.isArray(base.partidas) || !base.partidas.length || !base.partidas.every(p => paleta.has(p.color))) throw new Error('Ficha inválida');
      partidaBase = base.partidas;
      partidas = partidaBase;
      corteActual = base.lectura;
      mostrarCorte(corteActual);
      mostrar();
    }
    try {
      const minuto = Math.floor(Date.now() / 60000);
      aplicar(await leerJSON(estadosPublicos + '?v=' + minuto));
      aviso.textContent = manual ? 'Consulta actualizada.' : '';
    } catch {
      try { aplicar(await leerJSON('estado.json')); } catch { /* Se conserva el último corte válido. */ }
      aviso.textContent = 'Se muestra el último corte disponible. No se pudo comprobar una versión más reciente.';
    }
  } catch {
    fecha.textContent = 'Corte pendiente de cargar';
    aviso.textContent = 'No se pudo cargar la lista. Pulsa Actualizar para reintentar.';
  } finally {
    boton.disabled = false;
    enConsulta = false;
  }
}
boton.addEventListener('click', () => actualizar(true));
actualizar();
setInterval(() => { if (!document.hidden) actualizar(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) actualizar(); });
