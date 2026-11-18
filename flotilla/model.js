/* Quelec · Flotilla / Carabela mayor · FLOT1
 * Ideal panel reference surfaces, in metres. Dimensions belong to the actual
 * 3D vertices, never to their lateral or plan projections. The outer panel
 * surfaces preserve the user-specified envelope. The internal rib is a real
 * 4 mm prism, net of the outer 4 mm skins and the stated fit clearance.
 */
export function buildCaravel(THREE, options = {}) {
  const dimension = (key, fallback) => Number.isFinite(options[key]) ? options[key] : fallback;
  const scale = dimension('scale', 1);
  const referenceLengthM = 1.50;
  const length = dimension('length', referenceLengthM * scale);
  const width = dimension('width', .75 * scale);
  const height = dimension('height', .682 * scale);
  const hullHeight = dimension('hullHeight', .41 * scale);
  const sailLength = dimension('sailLength', .545 * scale);
  const sailBaseWidth = dimension('sailBaseWidth', .136 * scale);
  const materialThickness = dimension('materialThickness', .004);
  const ribClearance = dimension('ribClearance', .0005);
  const codePrefix = options.codePrefix || (Math.abs(length - referenceLengthM) < 1e-8 ? 'C150' : 'C100');
  if (!(scale > 0 && materialThickness > 0 && ribClearance >= 0 && length > sailLength && sailLength > 0 && width > sailBaseWidth && sailBaseWidth > 0 && height > hullHeight && hullHeight > 0)) {
    throw new Error('Las medidas deben permitir una vela interior y una altura de casco menor que la altura total.');
  }
  const V = value => new THREE.Vector3(...value);
  const baseRise = hullHeight * sailBaseWidth / width;
  const vertices = {
    T_PROA: [-length / 2, hullHeight, 0],
    T_POPA: [length / 2, hullHeight, 0],
    BORDA_BABOR: [0, hullHeight, width / 2],
    BORDA_ESTRIBOR: [0, hullHeight, -width / 2],
    Q_PROA: [-sailLength / 2, 0, 0],
    Q_POPA: [sailLength / 2, 0, 0],
    V_BASE_BABOR: [0, baseRise, sailBaseWidth / 2],
    V_BASE_ESTRIBOR: [0, baseRise, -sailBaseWidth / 2],
    V_PUNTA: [0, height, 0],
  };
  const vertexNames = {
    T_PROA: 'Punta de proa', T_POPA: 'Punta de popa',
    BORDA_BABOR: 'Borda central · babor', BORDA_ESTRIBOR: 'Borda central · estribor',
    Q_PROA: 'Extremo inferior hacia proa', Q_POPA: 'Extremo inferior hacia popa',
    V_BASE_BABOR: 'Base de vela · babor', V_BASE_ESTRIBOR: 'Base de vela · estribor',
    V_PUNTA: 'Punta de vela',
  };
  const dimensions = {
    units: 'm', scale, referenceLengthM, codePrefix, length, width, beam: width, height, hullHeight, sailLength, sailBaseWidth,
    sailBaseRise: baseRise, materialThickness,
    lengthM: length, beamM: width, heightM: height, hullHeightM: hullHeight,
    sailLengthM: sailLength, sailBaseWidthM: sailBaseWidth, materialThicknessM: materialThickness,
  };
  const root = new THREE.Group();
  root.name = 'Flotilla_Carabela_mayor_' + codePrefix + '_FLOT1';
  root.userData = { model: 'Carabela mayor', codePrefix, revision: 'FLOT1', units: 'm' };
  const edgeGroup = new THREE.Group();
  edgeGroup.name = 'Aristas_reales_de_paneles';
  root.add(edgeGroup);
  const panels = [], meshes = [], edgeRecords = [], edgeByKey = new Map();
  const palette = ['#a5c8cc', '#e6c68a', '#d2b3b4', '#a5c8cc', '#e6c68a', '#d2b3b4', '#bdd0a8', '#c5b7df', '#bdd0a8', '#c5b7df'];
  let view = 'solid', edgesVisible = true, selectedId = null;

  function edgeRecord(aId, bId, panelId) {
    const key = [aId, bId].sort().join('|');
    let record = edgeByKey.get(key);
    if (!record) {
      const a = vertices[aId], b = vertices[bId];
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const id = codePrefix + '-E' + String(edgeRecords.length + 1).padStart(2, '0');
      const material = new THREE.LineBasicMaterial({ color: '#586b71', transparent: true, opacity: .65, depthWrite: false });
      const geometry = new THREE.BufferGeometry().setFromPoints([V(a), V(b)]);
      const line = new THREE.Line(geometry, material);
      line.name = id + '_' + aId + '_' + bId;
      line.userData = { edgeId: id, realPanelBoundary: true, kind: 'outer' };
      edgeGroup.add(line);
      record = {
        id, key, aId, bId, a: [...a], b: [...b],
        name: vertexNames[aId] + ' ↔ ' + vertexNames[bId],
        lengthM: Math.hypot(dx, dy, dz),
        sideProjectionM: Math.hypot(dx, dy),
        planProjectionM: Math.hypot(dx, dz),
        panelIds: [], kind: 'outer', line,
      };
      edgeRecords.push(record); edgeByKey.set(key, record);
    }
    record.panelIds.push(panelId);
    return record;
  }
  function makePanel(id, name, kind, side, vertexIds) {
    const ids = [...vertexIds], points = ids.map(id => V(vertices[id]));
    const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    const centroid = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(3);
    const outward = kind === 'rib' ? new THREE.Vector3(1, 0, 0) : kind === 'hull'
      ? new THREE.Vector3(0, -1, side === 'babor' ? 1 : -1)
      : centroid.clone().sub(new THREE.Vector3(0, height * .35, 0));
    if (normal.dot(outward) < 0) { [ids[1], ids[2]] = [ids[2], ids[1]]; [points[1], points[2]] = [points[2], points[1]]; }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap(p => p.toArray()), 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, .5, 1], 2));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: '#f2efe2', roughness: .91, metalness: 0, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = id + '_' + name.replaceAll(' ', '_');
    mesh.userData = { panelId: id, panelCode: id, surface: kind !== 'rib', kind, side, materialThicknessM: materialThickness };
    mesh.castShadow = true; mesh.receiveShadow = false;
    root.add(mesh); meshes.push(mesh);
    const edges = ids.map((a, i) => edgeRecord(a, ids[(i + 1) % 3], id));
    const anglesDeg = points.map((p, i) => {
      const a = points[(i + 1) % 3].clone().sub(p).normalize();
      const b = points[(i + 2) % 3].clone().sub(p).normalize();
      return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)));
    });
    const cross = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    const panel = {
      id, code: id, name, kind, side, vertexIds: ids,
      vertices: points.map(p => p.toArray()), mesh, meshes: [mesh], edges,
      edgeIds: edges.map(e => e.id), sideLengthsM: edges.map(e => e.lengthM),
      sideProjectionM: edges.map(e => e.sideProjectionM), planProjectionM: edges.map(e => e.planProjectionM),
      areaM2: cross.length() / 2, anglesDeg, normal: cross.normalize().toArray(), centroid: centroid.toArray(),
      studyColor: kind === 'rib' ? '#c5a971' : palette[panels.length],
    };
    panels.push(panel);
    return panel;
  }
  for (const [side, borda, first] of [['babor', 'BORDA_BABOR', 1], ['estribor', 'BORDA_ESTRIBOR', 4]]) {
    makePanel(codePrefix + '-C0' + first, 'Proa · ' + side, 'hull', side, ['T_PROA', 'Q_PROA', borda]);
    makePanel(codePrefix + '-C0' + (first + 1), 'Triángulo central · ' + side, 'hull', side, ['Q_PROA', 'Q_POPA', borda]);
    makePanel(codePrefix + '-C0' + (first + 2), 'Popa · ' + side, 'hull', side, ['Q_POPA', 'T_POPA', borda]);
  }
  makePanel(codePrefix + '-V01', 'Vela · babor hacia proa', 'sail', 'babor', ['V_PUNTA', 'Q_PROA', 'V_BASE_BABOR']);
  makePanel(codePrefix + '-V02', 'Vela · babor hacia popa', 'sail', 'babor', ['V_PUNTA', 'V_BASE_BABOR', 'Q_POPA']);
  makePanel(codePrefix + '-V03', 'Vela · estribor hacia popa', 'sail', 'estribor', ['V_PUNTA', 'Q_POPA', 'V_BASE_ESTRIBOR']);
  makePanel(codePrefix + '-V04', 'Vela · estribor hacia proa', 'sail', 'estribor', ['V_PUNTA', 'V_BASE_ESTRIBOR', 'Q_PROA']);

  // Net cross-rib: intersect the actual inward-offset sail and hull planes.
  // The sail constraint accounts for both ends of the 4 mm X extrusion.
  const sailNormal = V(panels.find(p => p.kind === 'sail' && p.side === 'babor').normal);
  const hullNormal = V(panels.find(p => p.kind === 'hull' && p.name.startsWith('Triángulo central') && p.side === 'babor').normal);
  const sailPlaneD = sailNormal.dot(V(vertices.V_PUNTA));
  const skinAndClearance = materialThickness + ribClearance;
  const ribSailRHS = sailPlaneD - skinAndClearance - Math.abs(sailNormal.x) * materialThickness / 2;
  const ribHullRHS = -skinAndClearance;
  const determinant = sailNormal.y * hullNormal.z - sailNormal.z * hullNormal.y;
  const ribApexY = ribSailRHS / sailNormal.y;
  const ribBaseY = (ribSailRHS * hullNormal.z - sailNormal.z * ribHullRHS) / determinant;
  const ribHalfWidth = (sailNormal.y * ribHullRHS - ribSailRHS * hullNormal.y) / determinant;
  if (!(ribHalfWidth > 0 && ribApexY > ribBaseY)) throw new Error('No queda espacio interior para una costilla de este espesor y holgura.');
  Object.assign(vertices, {
    R_PUNTA_NETA: [0, ribApexY, 0],
    R_BASE_BABOR: [0, ribBaseY, ribHalfWidth],
    R_BASE_ESTRIBOR: [0, ribBaseY, -ribHalfWidth],
  });
  Object.assign(vertexNames, {
    R_PUNTA_NETA: 'Punta neta de costilla',
    R_BASE_BABOR: 'Base neta de costilla · babor',
    R_BASE_ESTRIBOR: 'Base neta de costilla · estribor',
  });
  const rib = makePanel(codePrefix + '-R01', 'Costilla central neta · Cartón Plast de 4 mm', 'rib', 'central', ['R_PUNTA_NETA', 'R_BASE_BABOR', 'R_BASE_ESTRIBOR']);
  const ribShape = new THREE.Shape();
  rib.vertices.forEach((p, i) => i ? ribShape.lineTo(-p[2], p[1]) : ribShape.moveTo(-p[2], p[1]));
  ribShape.closePath();
  const ribGeometry = new THREE.ExtrudeGeometry(ribShape, { depth: materialThickness, bevelEnabled: false, steps: 1, curveSegments: 1 });
  ribGeometry.translate(0, 0, -materialThickness / 2);
  ribGeometry.rotateY(Math.PI / 2);
  rib.mesh.geometry.dispose(); rib.mesh.geometry = ribGeometry;
  rib.mesh.material.polygonOffset = false;
  rib.mesh.material.color.set(rib.studyColor);
  rib.mesh.userData.internalRib = true;
  rib.thicknessM = materialThickness;
  rib.clearanceM = ribClearance;
  rib.normal = [1, 0, 0];
  rib.edges.forEach(edge => { edge.kind = 'rib'; edge.line.userData.kind = 'rib'; edge.line.userData.cutOutline = true; });
  const skins = panels.filter(p => p.kind !== 'rib').map(p => p.mesh);
  const ribNet = {
    panelId: rib.id, vertices: rib.vertices.map(p => [...p]), thicknessM: materialThickness, clearanceM: ribClearance,
    baseWidthM: 2 * ribHalfWidth, baseY: ribBaseY, apexY: ribApexY, heightM: ribApexY - ribBaseY,
    sideLengthsM: [...rib.sideLengthsM], anglesDeg: [...rib.anglesDeg], areaM2: rib.areaM2,
    sailNormal: sailNormal.toArray(), hullNormal: hullNormal.toArray(), sailPlaneD,
    sailRHS: ribSailRHS, hullRHS: ribHullRHS, halfThicknessM: materialThickness / 2,
  };
  dimensions.ribThicknessM = materialThickness;
  dimensions.ribClearanceM = ribClearance;

  // P1/P2/P3 are drafting labels, independent of the outward mesh winding.
  // Keep the same point order as the cut PDFs on every congruent copy without
  // modifying a mesh, a normal, a shared edge or any three-dimensional point.
  for (const panel of panels) {
    const borda = panel.side === 'babor' ? 'BORDA_BABOR' : 'BORDA_ESTRIBOR';
    const sailBase = panel.side === 'babor' ? 'V_BASE_BABOR' : 'V_BASE_ESTRIBOR';
    let ids;
    if (panel.kind === 'rib') ids = ['R_BASE_ESTRIBOR', 'R_BASE_BABOR', 'R_PUNTA_NETA'];
    else if (panel.kind === 'sail') ids = ['V_PUNTA', panel.vertexIds.includes('Q_PROA') ? 'Q_PROA' : 'Q_POPA', sailBase];
    else if (panel.vertexIds.includes('T_PROA')) ids = ['T_PROA', borda, 'Q_PROA'];
    else if (panel.vertexIds.includes('T_POPA')) ids = ['T_POPA', borda, 'Q_POPA'];
    else ids = ['Q_PROA', 'Q_POPA', borda];
    const points = ids.map(id => V(vertices[id]));
    const edges = ids.map((id, i) => edgeByKey.get([id, ids[(i + 1) % 3]].sort().join('|')));
    panel.vertexIds = ids;
    panel.pointNames = ['P1', 'P2', 'P3'];
    panel.vertices = points.map(point => point.toArray());
    panel.edges = edges;
    panel.edgeIds = edges.map(edge => edge.id);
    panel.sideLengthsM = edges.map(edge => edge.lengthM);
    panel.sideProjectionM = edges.map(edge => edge.sideProjectionM);
    panel.planProjectionM = edges.map(edge => edge.planProjectionM);
    panel.anglesDeg = points.map((point, i) => {
      const a = points[(i + 1) % 3].clone().sub(point).normalize();
      const b = points[(i + 2) % 3].clone().sub(point).normalize();
      return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)));
    });
  }
  ribNet.vertices = rib.vertices.map(point => [...point]);
  ribNet.sideLengthsM = [...rib.sideLengthsM];
  ribNet.anglesDeg = [...rib.anglesDeg];

  function applyAppearance() {
    for (const panel of panels) {
      panel.mesh.visible = view !== 'lines';
      panel.mesh.material.color.set(panel.id === selectedId ? '#e5c68e' : panel.kind === 'rib' || view === 'colors' ? panel.studyColor : '#f2efe2');
    }
    edgeGroup.visible = view === 'lines' || edgesVisible;
    for (const edge of edgeRecords) {
      const active = selectedId && edge.panelIds.includes(selectedId);
      edge.line.material.color.set(active ? '#e2c276' : '#586b71');
      edge.line.material.opacity = active ? 1 : selectedId ? .30 : view === 'lines' ? .94 : .65;
    }
  }
  function setView(next) { if (['solid', 'lines', 'colors'].includes(next)) { view = next; applyAppearance(); } }
  function setEdgesVisible(value) { edgesVisible = Boolean(value); applyAppearance(); }
  function setSelected(id = null) { selectedId = panels.some(p => p.id === id) ? id : null; applyAppearance(); }
  const measuredEdges = edgeRecords.map(({ line, ...edge }) => ({ ...edge, panelIds: [...edge.panelIds] }));
  const measuredPanels = panels.map(({ mesh, meshes, edges, ...panel }) => ({ ...panel, edges: edges.map(e => e.id) }));
  const measurements = { units: 'm', codePrefix, vertices, vertexNames, dimensions, ribNet, edges: measuredEdges, panels: measuredPanels };
  const specs = {
    revision: 'FLOT1', title: 'Flotilla · Carabela mayor', units: 'm',
    codePrefix, scale, referenceLengthM, panelCount: panels.length, hullPanels: 6, sailPanels: 4, ribPanels: 1, outerSkinCount: skins.length, realEdgeCount: edgeRecords.length,
    dimensions,
    geometry: 'Seis triángulos reales de casco, cuatro caras de vela y una costilla central neta. Todas las longitudes se calculan entre vértices tridimensionales.',
    sailBase: 'Rombo en planta de ' + (sailLength * 100).toFixed(3) + ' × ' + (sailBaseWidth * 100).toFixed(3) + ' cm exteriores; base conformada sobre la V del casco.',
    material: 'Cartón Plast de 4 mm confirmado. El casco y la vela conservan sus superficies exteriores ideales; la costilla tiene 4 mm físicos y se recorta por dentro descontando las pieles y 0,5 mm de holgura normal propuesta por cara.',
    ribNet,
    status: 'Geometría y medidas para los planos de paños solicitados. Los encuentros y fijaciones se comprueban en taller; no se añaden biseles o pestañas no definidos.',
  };
  applyAppearance();
  return {
    root, panels, meshes, skins, realEdges: edgeGroup, edgeGroup,
    edges: edgeRecords, edgeRecords, vertices, vertexNames, dimensions, measurements, specs, rib, ribNet,
    setView, setEdgesVisible, setSelected,
    getState: () => ({ view, edgesVisible, selectedId }),
  };
}
