/* PC01. Independent cost page. User approved access without a password. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const content = $('content');
  let loading = false;
  const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const range = values => values.map(money).join(' – ');
  const add = rows => [0, 1].map(i => rows.reduce((sum, row) => sum + row[i], 0));
  const dateLabel = value => new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
  const icons = { barco: 'logo-barco.svg', grulla: 'logo-grulla.svg', nave: 'logo-nave.svg', cauchera: 'logo-cauchera.svg', pancartas: 'logo-pancartas.svg', colas: 'logo-colas.svg' };
  const meta = {
    barco: { current: 'R08', note: 'Base R08 · un barco' },
    grulla: { current: 'G04', note: 'Base G04 · una grulla' },
    nave: { current: 'N02', note: 'Base N02 · una nave' },
    cauchera: { current: 'C02-r2', note: 'Costos base C01 · por actualizar a C02-r2', warning: true }
  };
  function el(tag, text, parent, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    parent?.append(node);
    return node;
  }
  function link(text, url, parent) {
    const node = el('a', text, parent);
    node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer';
    return node;
  }
  function sourceLinks(ids, data, parent) {
    for (const id of ids || []) {
      const source = data.sources.find(item => item.id === id);
      if (source?.url && /^https?:\/\//.test(source.url)) link(' ' + id, source.url, parent);
    }
  }
  async function load() {
    if (loading) return;
    loading = true; $('retry').hidden = true;
    $('load-status').hidden = false; $('load-status').textContent = 'Cargando las estimaciones…';
    try {
      const response = await fetch('./datos.json?v=PC01', { cache: 'no-store' });
      if (!response.ok) throw Error('No se pudo cargar la proyección. Intenta de nuevo.');
      const data = await response.json(); show(data);
      content.hidden = false; $('load-status').hidden = true;
    } catch (error) {
      content.hidden = true; content.replaceChildren();
      $('load-status').textContent = 'No se pudo cargar la proyección. Revisa tu conexión y vuelve a intentar.';
      $('retry').hidden = false;
    } finally { loading = false; }
  }
  $('retry').onclick = load;
  function cardHead(id, title, note, parent, warning = false) {
    const header = el('div', null, parent, 'card-header');
    const image = el('img', null, header); image.src = '../assets/' + icons[id]; image.alt = '';
    const copy = el('div', null, header); el('h3', title, copy); el('span', note, copy, 'badge' + (warning ? ' warning' : ''));
  }
  function show(data) {
    content.replaceChildren();
    const head = el('div', null, content, 'section-head');
    const heading = el('h2', 'El presupuesto, por objeto', head); heading.tabIndex = -1;
    el('span', 'COP · datos base del ' + dateLabel(data.date), head, 'meta');
    el('p', 'Rangos de planeación, sujetos a cotización. Esta página reorganiza las bases existentes; no actualiza precios ni aprueba la fabricación.', content, 'notice');
    const summary = el('section', null, content, 'summary');
    const sumCopy = el('div', null, summary); el('h2', 'Subtotal de cuatro objetos', sumCopy);
    const sumValue = el('div', '', sumCopy, 'total'); sumValue.id = 'subtotal';
    el('p', 'Un barco + una grulla + una nave + una cauchera. Incluye las reservas de cada tarjeta una sola vez.', sumCopy);
    const scope = el('div', null, summary, 'summary-detail');
    el('strong', 'Pancartas y colas de pavo pendientes', scope);
    el('p', 'No es el total del taller completo. Cauchera C01 provisional; transporte e IVA según las exclusiones de cada objeto. LED de la nave aparte.', scope);
    const totals = new Map(data.objects.map(object => [object.id, [...object.totalRangeCOP]]));
    const updateSubtotal = () => { sumValue.textContent = range(add([...totals.values()])); };
    const grid = el('section', null, content, 'budget-grid'); grid.setAttribute('aria-label', 'Proyección de cada objeto');
    for (const object of data.objects) {
      const info = meta[object.id]; const card = el('article', null, grid, 'budget-card'); card.dataset.costObject = object.id;
      cardHead(object.id, object.title, info.note, card, info.warning);
      el('div', range(object.totalRangeCOP), card, 'amount');
      const dl = el('dl', null, card);
      for (const [key, label, values] of [
        ['materials', 'Materiales', object.materialRangeCOP],
        ['labor', 'Mano de obra estimada', object.laborRangeCOP],
        ...(object.transportRangeCOP ? [['transport', 'Transporte incluido', object.transportRangeCOP]] : []),
        ['reserve', 'Reserva 15 %', object.contingencyRangeCOP]
      ]) { el('dt', label, dl); el('dd', range(values), dl).dataset.field = key; }
      el('p', object.note, card, 'card-note');
      if (info.warning) el('p', 'El visor está en C02-r2. Este importe es la base anterior C01 y aún debe revisar las asas, la lengüeta, las bandas y el elástico definitivo.', card, 'scope-note');
      const details = el('details', null, card); el('summary', object.id === 'nave' ? 'Partidas de referencia · planchas' : 'Ver partidas y supuestos', details);
      if (object.id === 'nave') el('p', 'Estas partidas corresponden a la base de planchas. La comparación inferior detalla ambas rutas y recalcula el transporte elegido.', details);
      const wrap = el('div', null, details, 'table-wrap'); const table = el('table', null, wrap, 'part-table');
      const thead = el('thead', null, table), row = el('tr', null, thead);
      for (const title of ['Partida y cantidad', 'Rango en COP', 'Base y condiciones']) el('th', title, row).scope = 'col';
      const body = el('tbody', null, table);
      for (const item of object.items) {
        const row = el('tr', null, body), desc = el('td', null, row);
        el('span', item.description, desc, 'part-title'); el('span', item.quantityBasis || '', desc, 'part-basis');
        el('td', range([item.lowCOP, item.highCOP]), row, 'range');
        const basis = el('td', (item.priceBasis || '').replaceAll('_', ' ') + ' · ' + (item.note || ''), row);
        sourceLinks(item.sourceIds, data, basis);
      }
      el('p', object.laborNote, details);
    }
    for (const item of [
      { id: 'pancartas', title: 'Pancartas de los Gruñones', revision: 'PA05 · cuatro pancartas', note: 'Elegir un formato y ocho artes entre diez. Materiales, impresión, trabajo y transporte todavía no tienen un presupuesto en esta base.' },
      { id: 'colas', title: 'Colas de pavo', revision: 'CP03 · cinco colas', note: 'Cotizar primero la cola de prueba. Perfil de las venas, membrana impresa, arnés y mecanismos pendientes de selección y ensayo; no hay importe consolidado.' }
    ]) {
      const card = el('article', null, grid, 'budget-card pending'); cardHead(item.id, item.title, item.revision, card, true);
      el('div', 'Por estimar', card, 'amount'); el('p', item.note, card); el('p', 'No incluido en el subtotal.', card, 'scope-note');
    }
    renderComparison(data, totals, updateSubtotal);
    const exclusions = el('section', null, content); el('h2', 'Fuera del alcance y por cotizar', exclusions);
    const list = el('ul', null, exclusions, 'exclusions'); for (const text of data.exclusions) el('li', text, list);
    const sources = el('details', null, content); el('summary', 'Fuentes y bases de los estimados', sources);
    el('p', 'Las fechas y las condiciones son las de la base guardada. Confirmar disponibilidad, tarifas e impuestos con cada proveedor antes de contratar.', sources, 'meta');
    const sourceList = el('ul', null, sources, 'sources-list');
    for (const source of data.sources) {
      const li = el('li', null, sourceList);
      const title = source.id + ' · ' + (source.title || source.name || [source.vendor, source.item].filter(Boolean).join(' · ') || source.url);
      if (/^https?:\/\//.test(source.url)) link(title, source.url, li); else el('span', title, li);
      if (source.note) el('span', source.note, li);
    }
    el('p', 'Para compartir modelos, guías y planos con proveedores, usa el taller de objetos. Esta proyección se consulta desde su dirección independiente.', content, 'end-note');
    updateSubtotal();
  }
  function renderComparison(data, totals, updateSubtotal) {
    const comparison = data.naveComparison; if (!comparison) return;
    const section = el('section', null, content, 'comparison'); section.id = 'nave-comparison';
    el('h2', 'Nave: planchas o dos bloques', section); el('p', comparison.scope, section);
    const controls = el('div', null, section, 'comparison-controls');
    const routeLabel = el('label', 'Ruta para el subtotal', controls), route = el('select', null, routeLabel); route.id = 'route';
    for (const method of comparison.methods) el('option', method.title, route).value = method.id;
    route.value = comparison.methods.find(method => method.id !== 'blocks').id;
    const originLabel = el('label', 'Origen de los bloques', controls), origin = el('select', null, originLabel); origin.id = 'origin';
    for (const option of comparison.blockOrigins) el('option', option.label, origin).value = option.id;
    origin.value = comparison.defaultOrigin;
    const tripsLabel = el('label', 'Trayectos de la nave terminada', controls), trips = el('input', null, tripsLabel); trips.id = 'trips';
    trips.type = 'number'; trips.min = '1'; trips.max = '10'; trips.step = '1'; trips.value = comparison.defaultUrbanTrips;
    const note = el('p', '', section, 'notice');
    const wrap = el('div', null, section, 'table-wrap'), table = el('table', null, wrap);
    const detail = el('details', null, section); el('summary', 'Ver horas de trabajo y supuestos', detail);
    for (const method of comparison.methods) {
      el('h3', method.title, detail);
      for (const row of method.laborItems) el('p', row.description + ': ' + row.specialistHours.join('–') + ' horas de especialista y ' + row.assistantHours.join('–') + ' horas de apoyo. ' + row.note, detail);
    }
    for (const text of comparison.notes) el('p', text, detail);
    el('p', comparison.urbanScope, detail); sourceLinks(comparison.sources, data, detail);
    function refresh() {
      const count = Math.max(1, Math.min(10, Math.round(+trips.value || comparison.defaultUrbanTrips))); trips.value = count;
      const chosen = comparison.blockOrigins.find(item => item.id === origin.value) || comparison.blockOrigins[0];
      note.textContent = chosen.note + ' ' + comparison.urbanScope;
      table.replaceChildren(); const head = el('thead', null, table), tr = el('tr', null, head);
      for (const text of ['Partida', ...comparison.methods.map(method => method.title), 'Condiciones']) el('th', text, tr).scope = 'col';
      const body = el('tbody', null, table);
      function row(title, values, condition = '', total = false) {
        const tr = el('tr', null, body, total ? 'row-total' : ''); el('th', title, tr).scope = 'row';
        for (const value of values) el('td', range(value), tr, 'range'); el('td', condition, tr);
      }
      const sums = comparison.methods.map(method => add(Object.values(method.rows)));
      for (const definition of comparison.rowDefinitions) row(definition.label, comparison.methods.map(method => method.rows[definition.key]), definition.note);
      const incoming = comparison.methods.map(method => method.id === 'blocks' ? chosen.rangeCOP : method.incomingRangeCOP);
      const urban = comparison.urbanRateRangeCOP.map(value => value * count);
      row('Llegada del EPS al taller', incoming, 'Un traslado del material, separado de los viajes de la nave terminada.');
      row(count + ' trayectos urbanos', comparison.methods.map(() => urban), 'Mismo fuselaje terminado. Provisión por viaje: ' + range(comparison.urbanRateRangeCOP) + '.');
      const subtotal = sums.map((values, i) => add([values, incoming[i], urban]));
      const reserve = subtotal.map(values => values.map(value => Math.round(value * comparison.reserveRate)));
      const total = subtotal.map((values, i) => add([values, reserve[i]]));
      row('Subtotal', subtotal); row('Reserva ' + Math.round(comparison.reserveRate * 100) + ' %', reserve, 'Se aplica una sola vez, también sobre transporte.');
      row('Total de planeación', total, 'Antes del IVA adicional que aplique. LED opcionales aparte.', true);
      const index = comparison.methods.findIndex(method => method.id === route.value), method = comparison.methods[index];
      const card = content.querySelector('[data-cost-object="nave"]');
      card.querySelector('.amount').textContent = range(total[index]);
      card.querySelector('[data-field="transport"]').textContent = range(add([incoming[index], urban]));
      card.querySelector('[data-field="reserve"]').textContent = range(reserve[index]);
      card.querySelector('[data-field="materials"]').textContent = range(add([method.rows.eps, method.rows.otherMaterials]));
      const laborRows = ['shapeLabor', 'vacuumLabor', 'commonLabor'].map(key => method.rows[key]);
      card.querySelector('[data-field="labor"]').textContent = range(add(laborRows));
      card.querySelector('.card-note').textContent = method.title + ' · llegada del EPS y ' + count + ' trayectos urbanos incluidos. LED opcionales aparte. Consulta el proceso y sus condiciones debajo.';
      totals.set('nave', total[index]); updateSubtotal();
      section.dataset.route = route.value; section.dataset.trips = count; section.dataset.origin = origin.value;
    }
    route.onchange = refresh; origin.onchange = refresh; trips.onchange = refresh; refresh();
  }
  load();
})();
