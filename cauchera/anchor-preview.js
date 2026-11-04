/* Quelec: inert-prop cutaway of the existing C03 anchor. Metres, Y up.
 * This module illustrates location only; it does not estimate soil retention.
 */
(() => {
  'use strict';

  function install({ THREE, scene, ground, renderer, model, labelsVisible = false } = {}) {
    if (!THREE || !scene || !ground || !renderer) {
      throw new Error('La sección del ancla necesita Three, escena, suelo y renderer.');
    }
    const halfX = .28, halfZ = .21, soilDepth = .20, baseThickness = .018;
    const root = new THREE.Group();
    root.name = 'Sección de arena · ayuda de visualización';
    root.userData.isVisualizationHelper = true;
    scene.add(root);

    const resources = new Set();
    const savedMaterials = new Map();
    const initialClippingEnabled = !!renderer.localClippingEnabled;
    let visible = false, installed = true, disposed = false;

    // In Three's clipping shader the negative half-space is removed.
    // clipIntersection=true removes only the intersection of these four
    // negative half-spaces: the small rectangular opening around the shaft.
    const clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), -halfX),
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -halfX),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), -halfZ),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -halfZ)
    ];
    function material(options) {
      const value = new THREE.MeshStandardMaterial(options);
      resources.add(value);
      return value;
    }
    function mesh(geometry, mat, name, position) {
      resources.add(geometry);
      const object = new THREE.Mesh(geometry, mat);
      object.name = name;
      object.userData.isVisualizationHelper = true;
      if (position) object.position.set(...position);
      root.add(object);
      return object;
    }
    function lines(points, color, name, { dashed = false } = {}) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
      const mat = dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: .012, gapSize: .009 })
        : new THREE.LineBasicMaterial({ color });
      resources.add(geometry); resources.add(mat);
      const object = new THREE.LineSegments(geometry, mat);
      object.name = name;
      object.userData.isVisualizationHelper = true;
      if (dashed) object.computeLineDistances();
      root.add(object);
      return object;
    }

    const sand = material({ color: '#c8ab74', roughness: 1, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false });
    const base = material({ color: '#6d777b', roughness: .95, metalness: .03 });
    const baseMesh = mesh(new THREE.BoxGeometry(halfX * 2 + .04, baseThickness, halfZ * 2 + .04), base,
      'Base dura · cara superior a −200 mm', [0, -soilDepth - baseThickness / 2, 0]);
    baseMesh.receiveShadow = true;

    for (const sx of [-1, 1]) {
      const wall = mesh(new THREE.PlaneGeometry(halfZ * 2, soilDepth), sand, 'Arena · pared lateral de 200 mm', [sx * halfX, -soilDepth / 2, 0]);
      wall.rotation.y = Math.PI / 2;
      wall.renderOrder = 2;
    }
    for (const sz of [-1, 1]) {
      const wall = mesh(new THREE.PlaneGeometry(halfX * 2, soilDepth), sand, 'Arena · pared frontal de 200 mm', [0, -soilDepth / 2, sz * halfZ]);
      wall.renderOrder = 2;
    }

    const rim = [], bottom = [], uprights = [];
    const corners = [[-halfX, -halfZ], [halfX, -halfZ], [halfX, halfZ], [-halfX, halfZ]];
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i], b = corners[(i + 1) % corners.length];
      rim.push([a[0], 0, a[1]], [b[0], 0, b[1]]);
      bottom.push([a[0], -soilDepth, a[1]], [b[0], -soilDepth, b[1]]);
      uprights.push([a[0], 0, a[1]], [a[0], -soilDepth, a[1]]);
    }
    lines(rim, '#edcf92', 'Contorno de la sección en superficie');
    lines(bottom, '#cfbb95', 'Límite de arena y base dura');
    lines(uprights, '#b99f72', 'Profundidad visible de arena', { dashed: true });

    const rulerX = -.235, rulerZ = .174;
    const ruler = [[rulerX, 0, rulerZ], [rulerX, -soilDepth, rulerZ]];
    for (const y of [0, -.05, -.10, -.15, -.20]) {
      const tick = (y === 0 || y === -.20) ? .025 : .014;
      ruler.push([rulerX - tick / 2, y, rulerZ], [rulerX + tick / 2, y, rulerZ]);
    }
    lines(ruler, '#fff0c9', 'Regla visual · 20 cm de arena');

    const labels = new THREE.Group();
    labels.name = 'Rótulos de la sección de arena';
    labels.userData.isVisualizationHelper = true;
    root.add(labels);
    function label(text, position, width = .21) {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 128;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.fillStyle = '#12242ee8';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#d3bd88'; context.lineWidth = 4;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      context.fillStyle = '#f5eddb';
      context.font = '600 46px Arial, sans-serif';
      context.textAlign = 'center'; context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
      const sprite = new THREE.Sprite(mat);
      sprite.name = text;
      sprite.position.set(...position);
      sprite.scale.set(width, width * canvas.height / canvas.width, 1);
      sprite.renderOrder = 8;
      sprite.userData.isVisualizationHelper = true;
      resources.add(texture); resources.add(mat);
      labels.add(sprite);
      return sprite;
    }
    label('20 cm de arena', [-.285, -.075, .235], .21);
    label('Base dura', [.21, -.205, .235], .18);
    labels.visible = !!labelsVisible;

    function applyClipping(mat) {
      if (!mat || Array.isArray(mat)) {
        if (Array.isArray(mat)) mat.forEach(applyClipping);
        return;
      }
      if (!savedMaterials.has(mat)) {
        savedMaterials.set(mat, {
          clippingPlanes: mat.clippingPlanes,
          clipIntersection: mat.clipIntersection,
          clipShadows: mat.clipShadows
        });
      }
      if (mat.clippingPlanes !== clippingPlanes || !mat.clipIntersection) {
        mat.clippingPlanes = clippingPlanes;
        mat.clipIntersection = true;
        mat.clipShadows = true;
        mat.needsUpdate = true;
      }
    }
    function restoreMaterials() {
      for (const [mat, previous] of savedMaterials) {
        mat.clippingPlanes = previous.clippingPlanes;
        mat.clipIntersection = previous.clipIntersection;
        mat.clipShadows = previous.clipShadows;
        mat.needsUpdate = true;
      }
      savedMaterials.clear();
    }
    function update() {
      if (disposed || !visible) return;
      renderer.localClippingEnabled = true;
      applyClipping(ground.material);
      // The studio creates its transparent contact-shadow plane lazily.
      // Clip it as well so that it cannot cover the underground preview.
      const contact = scene.getObjectByName('Quelec · contacto suave aproximado');
      if (contact?.material) applyClipping(contact.material);
    }
    function setVisible(value) {
      if (disposed) return false;
      visible = !!value;
      root.visible = visible;
      if (visible) update(); else restoreMaterials();
      return visible;
    }
    function setInstalled(value) {
      installed = !!value;
      // Installation remains a prop state controlled by the owning app.
      // Keeping the cutaway visible while it is removed explains the depth.
      return installed;
    }
    function setLabelsVisible(value) {
      labels.visible = !!value;
      return labels.visible;
    }
    function bounds() {
      return new THREE.Box3(new THREE.Vector3(-.41, -.23, -.25), new THREE.Vector3(.41, .16, .30));
    }
    function getState() {
      return { visible, installed, labelsVisible: labels.visible, soilDepthMm: 200, illustratedAnchorPenetrationMm: 120, cutawayMm: [560, 420], resistanceValidated: false };
    }
    function dispose() {
      if (disposed) return;
      restoreMaterials();
      root.removeFromParent();
      for (const resource of resources) resource.dispose();
      resources.clear();
      // Leave other independently configured clipping materials enabled.
      let externalClipping = false;
      scene.traverse(object => {
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
          if (mat?.clippingPlanes?.length) externalClipping = true;
        }
      });
      if (!externalClipping) renderer.localClippingEnabled = initialClippingEnabled;
      disposed = true;
      visible = false;
    }
    root.visible = false;
    return { root, setVisible, setInstalled, setLabelsVisible, update, bounds, getState, dispose };
  }

  window.QuelecCaucheraAnchorPreview = { install };
})();
