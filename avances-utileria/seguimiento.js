'use strict';

const colores = [
  ['rojo', '#e06666', 'Muy rezagadas'],
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
const lecturaDrive = document.querySelector('#lectura-drive');
const consultaPagina = document.querySelector('#consulta-pagina');
const comprobacion = document.querySelector('#comprobacion');
const aviso = document.querySelector('#aviso');
const boton = document.querySelector('#actualizar');
const estadosPublicos = 'https://raw.githubusercontent.com/felipecotero/barco-de-papel-quelec/main/avances-utileria/estado.json';
const ejecuciones = 'https://api.github.com/repos/felipecotero/barco-de-papel-quelec/actions/workflows/avances-utileria.yml/runs?branch=main&status=success&per_page=1';
const orden = colores.map(([nombre]) => nombre);
const botones = new Map();
const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric'
});
const formatoHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

let partidaBase = [];
let partidas = [];
let seleccionado = '';
let corteActual = '';
let ultimaLectura = '';
let ultimaEjecucion = '';
let consultaEjecucionPendiente = false;
let inicioConsultaEjecucion = 0;
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
function revision(iso) {
  if (iso === undefined) return 'Pendiente de sincronizar';
  return iso ? formatoFecha.format(fechaCorte(iso)) : 'Sin fecha registrada';
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
  const campos = [
    ['Avance y apoyo requerido', p.avance === undefined ? 'Pendiente de sincronizar' : p.avance || 'Sin nota registrada'],
    ['Última revisión', revision(p.ultimaRevision)],
    ['Próxima revisión', revision(p.proximaRevision)],
    ['Estado escrito', p.estado || 'Sin registrar'],
    ['Cantidad', p.cantidad],
    ['Grupo propuesto', p.grupo]
  ];
  for (const [etiqueta, valor] of campos) {
    const campo = crear('div');
    campo.append(crear('dt', etiqueta), crear('dd', valor));
    dl.append(campo);
  }
  detalle.append(dl, crear('p', p.detalle));
  ficha.append(titulo, detalle);
  return ficha;
}
const porcentaje = new Intl.NumberFormat('es-CO', {style:'percent', maximumFractionDigits:1});

function actualizarResumen() {
  const total = partidas.length;
  const cantidades = new Map(colores.map(([color]) => [color, 0]));
  for (const partida of partidas) cantidades.set(partida.color, cantidades.get(partida.color) + 1);
  const barra = document.querySelector('#barra-resumen');
  const leyenda = document.querySelector('#leyenda-resumen');
  barra.replaceChildren();
  leyenda.replaceChildren();
  for (const [color, tono, descripcion] of colores) {
    const cantidad = cantidades.get(color);
    const proporcion = porcentaje.format(cantidad / total);
    if (cantidad) {
      const tramo = crear('span');
      tramo.style.flexGrow = String(cantidad);
      tramo.style.setProperty('--tono', tono);
      tramo.title = rotulo(color) + ' · ' + cantidad + ' de ' + total + ' (' + proporcion + ')';
      barra.append(tramo);
    }
    const item = crear('li');
    const categoria = crear('span', undefined, 'categoria');
    categoria.append(muestra(color), rotulo(color));
    const cifras = crear('span', undefined, 'cifras');
    cifras.append(crear('strong', String(cantidad)), crear('span', proporcion));
    item.append(categoria, cifras, crear('small', descripcion));
    leyenda.append(item);
    botones.get(color).cantidad.textContent = String(cantidad);
  }
  botones.get('').cantidad.textContent = String(total);
  document.querySelector('#resumen-total').textContent = total + ' partidas · 100 %';
  document.querySelector('#resumen').hidden = false;
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
  for (const [color, {control}] of botones) {
    control.setAttribute('aria-pressed', String(seleccionado === color));
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

async function leerJSON(url, limite = 9000) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), limite);
  try {
    const respuesta = await fetch(url, {cache:'no-store', credentials:'omit', signal:control.signal});
    if (!respuesta.ok) throw new Error('Lectura no disponible');
    return await respuesta.json();
  } finally {
    clearTimeout(reloj);
  }
}
async function comprobarEjecucion(manual) {
  if (consultaEjecucionPendiente || (!manual && Date.now() - inicioConsultaEjecucion < 300000)) return;
  consultaEjecucionPendiente = true;
  inicioConsultaEjecucion = Date.now();
  try {
    const datos = await leerJSON(ejecuciones + '&v=' + inicioConsultaEjecucion, 6000);
    const ultima = datos.workflow_runs?.[0];
    if (ultima?.conclusion !== 'success' || ultima.head_branch !== 'main' || !Number.isFinite(Date.parse(ultima.updated_at))) {
      throw new Error('Ejecución sin confirmar');
    }
    if (!ultimaEjecucion || Date.parse(ultima.updated_at) > Date.parse(ultimaEjecucion)) ultimaEjecucion = ultima.updated_at;
    comprobacion.textContent = fechaPublicada(ultimaEjecucion);
  } catch {
    comprobacion.textContent = ultimaEjecucion ? fechaPublicada(ultimaEjecucion) + ' (última conocida)' : 'GitHub no pudo confirmarla';
  } finally {
    consultaEjecucionPendiente = false;
  }
}
function fechaCorte(iso) {
  // Las fechas sin hora identifican todo un día calendario de Bogotá.
  return new Date(iso.length === 10 ? iso + 'T05:00:00Z' : iso);
}
function fechaPublicada(iso) {
  return iso.length === 10 ? formatoFecha.format(fechaCorte(iso)) : formatoHora.format(fechaCorte(iso));
}
function preparar(estado) {
  const {actualizado, consultado = '', partidas: cambios} = estado;
  if (typeof actualizado !== 'string' || !Number.isFinite(fechaCorte(actualizado).getTime()) ||
      typeof consultado !== 'string' || (consultado && !Number.isFinite(fechaCorte(consultado).getTime())) ||
      !cambios || typeof cambios !== 'object' || Array.isArray(cambios)) throw new Error('Corte inválido');
  const siguientes = partidaBase.map(p => {
    const registro = cambios[p.id];
    if (!registro || !paleta.has(registro.color) || typeof registro.estado !== 'string') throw new Error('Partida incompleta');
    const {color, estado, avance, ultimaRevision, proximaRevision} = registro;
    if (avance !== undefined && typeof avance !== 'string') throw new Error('Nota inválida');
    for (const dia of [ultimaRevision, proximaRevision]) {
      if (dia !== undefined && dia !== '' && (typeof dia !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dia) ||
          !Number.isFinite(fechaCorte(dia).getTime()) || fechaCorte(dia).toISOString().slice(0, 10) !== dia)) {
        throw new Error('Fecha de revisión inválida');
      }
    }
    return {...p, color, estado, avance, ultimaRevision, proximaRevision};
  });
  return {actualizado, consultado, partidas: siguientes};
}
function comparar(a, b) {
  const porCambio = fechaCorte(a.actualizado) - fechaCorte(b.actualizado);
  return porCambio || (a.consultado ? fechaCorte(a.consultado).getTime() : 0) - (b.consultado ? fechaCorte(b.consultado).getTime() : 0);
}
function aplicar({actualizado, consultado, partidas: siguientes}) {
  if (comparar({actualizado, consultado}, {actualizado: corteActual, consultado: ultimaLectura}) < 0) return 'anterior';
  const campos = ['color', 'estado', 'avance', 'ultimaRevision', 'proximaRevision'];
  const cambio = partidas.some((p, i) => campos.some(campo => p[campo] !== siguientes[i][campo]));
  if (cambio) {
    partidas = siguientes;
    actualizarResumen();
    mostrar();
  }
  corteActual = actualizado;
  ultimaLectura = consultado;
  fecha.textContent = fechaPublicada(actualizado);
  lecturaDrive.textContent = consultado ? fechaPublicada(consultado) : 'Sin hora publicada';
  return cambio ? 'cambio' : 'igual';
}
async function actualizar(manual = false) {
  if (enConsulta) return;
  enConsulta = true;
  boton.disabled = true;
  boton.textContent = 'Consultando…';
  if (manual) aviso.textContent = 'Buscando la última versión publicada…';
  void comprobarEjecucion(manual);
  try {
    if (!partidaBase.length) {
      const base = await leerJSON('datos.json');
      if (!Array.isArray(base.partidas) || !base.partidas.length || !base.partidas.every(p => paleta.has(p.color))) throw new Error('Ficha inválida');
      partidaBase = base.partidas;
      partidas = partidaBase;
      corteActual = base.lectura;
      fecha.textContent = fechaPublicada(corteActual);
      lecturaDrive.textContent = 'Sin hora publicada';
      actualizarResumen();
      mostrar();
    }
    const consulta = '?v=' + Date.now();
    const lecturas = await Promise.allSettled([estadosPublicos, 'estado.json'].map(async url =>
      preparar(await leerJSON(url + consulta))
    ));
    const validas = lecturas.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!validas.length) throw new Error('Sin versión disponible');
    validas.sort((a, b) => comparar(b, a));
    const resultado = aplicar(validas[0]);
    const mensajes = [];
    if (resultado === 'anterior') mensajes.push('Las versiones disponibles son anteriores. Se conserva la última que viste.');
    else if (resultado === 'cambio') mensajes.push('Se actualizaron las fichas con los datos publicados.');
    else if (manual) mensajes.push('La versión publicada coincide con la que estás viendo.');
    if (lecturas[0].status === 'rejected') mensajes.push('Se consultó la copia del sitio. No se pudo comprobar el archivo de GitHub.');
    aviso.textContent = mensajes.join(' ');
  } catch {
    if (partidas.length) aviso.textContent = 'No se pudieron actualizar las fichas. Sigues viendo los últimos datos disponibles.';
    else {
      fecha.textContent = 'Por confirmar';
      aviso.textContent = 'No se pudo cargar la lista. Pulsa Actualizar para reintentar.';
    }
  } finally {
    consultaPagina.textContent = formatoHora.format(new Date());
    boton.disabled = false;
    boton.textContent = 'Actualizar';
    enConsulta = false;
  }
}
boton.addEventListener('click', () => actualizar(true));
actualizar();
setInterval(() => { if (!document.hidden) actualizar(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) actualizar(); });
