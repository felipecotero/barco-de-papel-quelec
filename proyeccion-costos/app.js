/* PC02. Independent cost page. User approved access without a password. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const content = $('content');
  let loading = false;
  const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  let scenario = new URL(location.href).searchParams.get('escenario') === 'alto' ? 1 : 0;
  const amount = values => money(values[scenario]);
  const add = rows => [0, 1].map(i => rows.reduce((sum, row) => sum + row[i], 0));
  const dateLabel = value => new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
  const icons = { barco: 'logo-barco.svg', grulla: 'logo-grulla.svg', nave: 'logo-nave.svg', cauchera: 'logo-cauchera.svg', pancartas: 'logo-pancartas.svg', colas: 'logo-colas.svg' };
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
      const response = await fetch('./datos.json?v=PC02', { cache: 'no-store' });
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
    const heading = el('h2', 'Los seis objetos, en dos escenarios', head); heading.tabIndex = -1;
    el('span', 'COP · actualización del ' + dateLabel(data.date), head, 'meta');
    el('p', data.scopeNote || 'Estimaciones para planear la fabricación. El tope es el extremo alto de las provisiones, sujeto a cotizaciones y al prototipo; no es un precio máximo contratado.', content, 'notice');
    const tabs = el('div', null, content, 'scenario-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Escenario de costos');
    const buttons = ['Escenario bajo', 'Tope proyectado'].map((text, index) => {
      const button = el('button', text, tabs); button.type = 'button'; button.id = 'tab-' + (index ? 'alto' : 'bajo');
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'scenario-panel');
      button.onclick = () => select(index);
      button.onkeydown = event => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = 1 - index;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = 1;
        if (next !== undefined) { event.preventDefault(); select(next); buttons[next].focus(); }
      };
      return button;
    });
    const panel = el('div', null, content); panel.id = 'scenario-panel'; panel.setAttribute('role', 'tabpanel');
    const values = new Map(data.objects.map(object => [object.id, {
      material: [...object.materialRangeCOP], labor: [...object.laborRangeCOP], transport: object.transportRangeCOP || [0, 0],
      reserve: [...object.contingencyRangeCOP], total: [...object.totalRangeCOP]
    }]));
    const summary = el('section', null, panel, 'summary');
    const sumCopy = el('div', null, summary); const sumTitle = el('h2', '', sumCopy);
    const sumValue = el('div', '', sumCopy, 'total'); sumValue.id = 'total'; sumValue.setAttribute('aria-live', 'polite');
    el('p', '1 barco + 1 grulla + 1 nave + 1 cauchera + 4 pancartas + 5 colas de pavo.', sumCopy);
    const scope = el('div', null, summary, 'summary-detail'); const scenarioNote = el('strong', '', scope);
    el('p', 'Fabricación, transportes presupuestados y reserva del 15 % una sola vez. IVA adicional y exclusiones al final. Las cifras no equivalen a una oferta del constructor.', scope);
    el('p', '', scope, 'active-plan');
    const totalBreakdown = el('dl', null, panel, 'total-breakdown');
    const fieldNames = [['material','Materiales'], ['labor','Mano de obra'], ['transport','Transportes previstos'], ['reserve','Reserva 15 %']];
    const totalFields = new Map();
    for (const [key, name] of fieldNames) { const item = el('div', null, totalBreakdown); el('dt', name, item); totalFields.set(key, el('dd', '', item)); }
    const grid = el('section', null, panel, 'budget-grid'); grid.setAttribute('aria-label', 'Proyección de cada objeto');
    const cardFields = new Map();
    for (const object of data.objects) {
      const card = el('article', null, grid, 'budget-card'); card.dataset.costObject = object.id;
      cardHead(object.id, object.title, object.scopeLabel || object.revision, card, !!object.uncertainties?.length);
      const total = el('div', '', card, 'amount');
      const dl = el('dl', null, card); const fields = new Map();
      for (const [key, name] of fieldNames) { el('dt', name, dl); const value = el('dd', '', dl); value.dataset.field = key; fields.set(key, value); }
      const note = el('p', object.note, card, 'card-note');
      el('p', 'Base de costos: ' + dateLabel(object.budgetDate || data.baseDate || data.date) + ' · diseño ' + object.revision, card, 'meta');
      if (object.estimateStatus) el('p', object.estimateStatus, card, 'scope-note');
      const details = el('details', null, card); el('summary', object.id === 'nave' ? 'Partidas de referencia · planchas' : 'Ver partidas y supuestos', details);
      if (object.id === 'nave') el('p', 'Estas partidas corresponden a la base de planchas. La comparación inferior detalla ambas rutas y recalcula el transporte elegido.', details);
      const wrap = el('div', null, details, 'table-wrap'); const table = el('table', null, wrap, 'part-table');
      const thead = el('thead', null, table), row = el('tr', null, thead);
      for (const title of ['Partida y cantidad', 'COP · escenario elegido', 'Base y condiciones']) el('th', title, row).scope = 'col';
      const body = el('tbody', null, table); const itemValues = [];
      for (const item of [...object.items.map(item => ({ ...item, group: 'Material' })), ...(object.laborItems || []).map(item => ({ ...item, group: 'Trabajo' }))]) {
        const row = el('tr', null, body), desc = el('td', null, row);
        el('span', item.description, desc, 'part-title'); el('span', item.group + ' · ' + (item.quantityBasis || ''), desc, 'part-basis');
        const value = el('td', '', row, 'range'); itemValues.push({ node: value, values: [item.lowCOP, item.highCOP] });
        const basis = el('td', (item.priceBasis || 'Provisión propia de planeación').replaceAll('_', ' ') + ' · ' + (item.note || ''), row);
        sourceLinks(item.sourceIds, data, basis);
      }
      if (object.laborNote) el('p', object.laborNote, details);
      const transportNote = object.transportNote ? el('p', object.transportNote, details, 'transport-note') : null;
      for (const text of object.optionalNotIncluded || []) el('p', 'Opcional fuera del total: ' + text, details, 'meta');
      if (object.uncertainties?.length) {
        const list = el('ul', null, details, 'uncertainties'); for (const text of object.uncertainties) el('li', text, list);
      }
      cardFields.set(object.id, { total, fields, note, itemValues, transportNote });
    }
    const refreshCards = () => {
      const rows = [...values.values()];
      sumValue.textContent = amount(add(rows.map(row => row.total)));
      for (const [key, node] of totalFields) node.textContent = amount(add(rows.map(row => row[key])));
      for (const [id, fields] of cardFields) {
        const object = values.get(id); fields.total.textContent = amount(object.total);
        for (const [key, node] of fields.fields) node.textContent = amount(object[key]);
        for (const entry of fields.itemValues) entry.node.textContent = amount(entry.values);
      }
    };
    const refreshComparison = renderComparison(data, values, cardFields, refreshCards, panel);
    function select(index) {
      scenario = index;
      buttons.forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; });
      panel.setAttribute('aria-labelledby', buttons[index].id); content.dataset.scenario = index ? 'alto' : 'bajo';
      sumTitle.textContent = index ? 'Tope proyectado de los seis objetos' : 'Total proyectado · escenario bajo';
      scenarioNote.textContent = index ? 'Extremo alto + reserva del 15 %' : 'Extremo bajo + reserva del 15 %';
      refreshComparison?.(); refreshCards();
      const url = new URL(location.href); url.searchParams.set('escenario', index ? 'alto' : 'bajo'); history.replaceState(null, '', url);
    }
    const exclusions = el('section', null, content); el('h2', 'Alcance del total y exclusiones', exclusions);
    const list = el('ul', null, exclusions, 'exclusions'); for (const text of data.exclusions) el('li', text, list);
    const sources = el('details', null, content); el('summary', 'Fuentes, fechas y bases de los estimados', sources);
    el('p', 'Cada tarjeta identifica la fecha de su base. Precios públicos consultados y provisiones propias se distinguen en las partidas. No hay cotizaciones recibidas ni contratos cerrados.', sources, 'meta');
    const sourceList = el('ul', null, sources, 'sources-list');
    for (const source of data.sources) {
      const li = el('li', null, sourceList);
      const title = source.id + ' · ' + (source.title || source.name || [source.vendor, source.item].filter(Boolean).join(' · ') || source.url);
      if (/^https?:\/\//.test(source.url)) link(title, source.url, li); else el('span', title, li);
      if (source.date || source.checkedAt || source.accessDate) el('span', 'Consulta: ' + (source.date || source.checkedAt || source.accessDate), li);
      if (source.note) el('span', source.note, li);
    }
    el('p', 'Para compartir modelos, guías y planos con proveedores, usa el taller de objetos. Esta proyección se consulta desde su dirección independiente.', content, 'end-note');
    select(scenario);
  }
  function renderComparison(data, values, cardFields, refreshCards, parent) {
    const comparison = data.naveComparison; if (!comparison) return null;
    const section = el('section', null, parent, 'comparison'); section.id = 'nave-comparison';
    el('h2', 'Nave: planchas o dos bloques', section); el('p', comparison.scope, section);
    const controls = el('div', null, section, 'comparison-controls');
    const routeLabel = el('label', 'Ruta incluida en el total', controls), route = el('select', null, routeLabel); route.id = 'route';
    for (const method of comparison.methods) el('option', method.title, route).value = method.id;
    route.value = comparison.methods.find(method => method.id !== 'blocks').id;
    const originLabel = el('label', 'Origen de los bloques', controls), origin = el('select', null, originLabel); origin.id = 'origin';
    for (const option of comparison.blockOrigins) el('option', option.label, origin).value = option.id;
    origin.value = comparison.defaultOrigin;
    const tripsLabel = el('label', 'Trayectos urbanos del conjunto', controls), trips = el('input', null, tripsLabel); trips.id = 'trips';
    trips.type = 'number'; trips.min = '1'; trips.max = '10'; trips.step = '1'; trips.value = comparison.defaultUrbanTrips;
    el('p', 'La nave contiene el flete base. La tarjeta de las colas añade el recargo de capacidad para esos mismos trayectos y la llegada de sus materiales, sin cobrar otra serie de viajes completos.', section, 'meta');
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
        for (const value of values) el('td', amount(value), tr, 'range'); el('td', condition, tr);
      }
      const sums = comparison.methods.map(method => add(Object.values(method.rows)));
      for (const definition of comparison.rowDefinitions) row(definition.label, comparison.methods.map(method => method.rows[definition.key]), definition.note);
      const incoming = comparison.methods.map(method => method.id === 'blocks' ? chosen.rangeCOP : method.incomingRangeCOP);
      const urban = comparison.urbanRateRangeCOP.map(value => value * count);
      row('Llegada del EPS al taller', incoming, 'Un traslado del material, separado de los viajes de la nave terminada.');
      row(count + ' trayectos urbanos', comparison.methods.map(() => urban), 'Mismo fuselaje terminado. Provisión por viaje: ' + amount(comparison.urbanRateRangeCOP) + '.');
      const subtotal = sums.map((values, i) => add([values, incoming[i], urban]));
      const reserve = subtotal.map(values => values.map(value => Math.round(value * comparison.reserveRate)));
      const total = subtotal.map((values, i) => add([values, reserve[i]]));
      row('Subtotal', subtotal); row('Reserva ' + Math.round(comparison.reserveRate * 100) + ' %', reserve, 'Se aplica una sola vez, también sobre transporte.');
      row('Total de planeación', total, 'Antes del IVA adicional que aplique. LED opcionales aparte.', true);
      const index = comparison.methods.findIndex(method => method.id === route.value), method = comparison.methods[index];
      values.set('nave', {
        material: add([method.rows.eps, method.rows.otherMaterials]),
        labor: add(['shapeLabor', 'vacuumLabor', 'commonLabor'].map(key => method.rows[key])),
        transport: add([incoming[index], urban]), reserve: reserve[index], total: total[index]
      });
      cardFields.get('nave').note.textContent = method.title + ' · llegada del EPS y ' + count + ' trayectos urbanos incluidos. LED opcionales aparte. Consulta el proceso y sus condiciones debajo.';
      parent.querySelector('.active-plan').textContent = 'Plan elegido: nave en ' + method.title.toLowerCase() + ' · ' + count + ' trayectos urbanos.';
      const tails = data.objects.find(object => object.id === 'colas');
      if (tails?.transportFixedRangeCOP && tails?.transportPerUrbanTripRangeCOP) {
        const transport = add([tails.transportFixedRangeCOP, tails.transportPerUrbanTripRangeCOP.map(value => value * count)]);
        const subtotal = add([tails.materialRangeCOP, tails.laborRangeCOP, transport]);
        const reserve = subtotal.map(value => Math.round(value * (tails.reserveRate ?? 0.15)));
        values.set('colas', { material: tails.materialRangeCOP, labor: tails.laborRangeCOP, transport, reserve, total: add([subtotal, reserve]) });
        cardFields.get('colas').note.textContent = tails.note + ' Recargo de capacidad para ' + count + ' trayectos compartidos; no son fletes completos adicionales.';
        if (cardFields.get('colas').transportNote) cardFields.get('colas').transportNote.textContent = 'Suministro al taller: ' + amount(tails.transportFixedRangeCOP) + '. Recargo de capacidad: ' + amount(tails.transportPerUrbanTripRangeCOP) + ' × ' + count + ' trayectos, adicional al flete base de nave. Total de transporte en esta tarjeta: ' + amount(transport) + '. Prever vehículo útil cercano a 5 m; no se añaden otros viajes completos.';
      }
      refreshCards();
      section.dataset.route = route.value; section.dataset.trips = count; section.dataset.origin = origin.value;
    }
    route.onchange = refresh; origin.onchange = refresh; trips.onchange = refresh; return refresh;
  }
  load();
})();
