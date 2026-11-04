/* Quelec C04: fictional pointer game. Values are game units, never a prop calibration. */
(() => {
  'use strict';
  const STEP = 1 / 120;
  const MAX_TIME = 12;
  const MAX_POINTS = Math.ceil(MAX_TIME / STEP) + 3;
  const BALL_RADIUS = .17;
  const MIN_PULL = .50;
  const MAX_PULL = 2.55;
  const GAME_ORIGIN = [0, 1.72, .08];
  const PROFILES = {
    light: { speed: 1.12, damping: .060 },
    medium: { speed: .95, damping: .035 },
    heavy: { speed: .78, damping: .022 }
  };
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, a, b) => Math.min(b, Math.max(a, value));
  const normalizeHeft = value => Object.hasOwn(PROFILES, value) ? value : 'medium';
  function sanitizeAim(value) {
    return [0, clamp(finite(value?.[1], 1.08), .58, 1.58), clamp(finite(value?.[2], 1.40), MIN_PULL, MAX_PULL)];
  }
  function powerFromAim(aim) { return (aim[2] - MIN_PULL) / (MAX_PULL - MIN_PULL) * 100; }

  // Deliberately chosen cartoon tuning, unrelated to any textile, band, force or physical ball.
  function makeFlight({ aimPosition = [0, 1.08, 1.40], heft = 'medium' } = {}) {
    const aim = sanitizeAim(aimPosition), power = powerFromAim(aim), tuning = PROFILES[normalizeHeft(heft)];
    const up = clamp(1.86 - aim[1], .20, 1.28), back = Math.max(.40, aim[2] - .045);
    const angle = clamp(Math.atan2(up, back), .18, 1.08);
    const speed = power < 3 ? 0 : (3.2 + power * .083) * tuning.speed;
    let state = [GAME_ORIGIN[0], GAME_ORIGIN[1], GAME_ORIGIN[2], 0, Math.sin(angle) * speed, -Math.cos(angle) * speed];
    const points = [{ t: 0, p: state.slice(0, 3) }];
    let apex = state[1], duration = 0, landed = false;
    function derivative(s) { return [s[3], s[4], s[5], -tuning.damping * s[3], -6.8 - tuning.damping * s[4], -tuning.damping * s[5]]; }
    function add(s, k, factor) { return s.map((v, i) => v + k[i] * factor); }
    for (let i = 1; i < MAX_POINTS - 1; i++) {
      const a = derivative(state), b = derivative(add(state, a, STEP / 2));
      const c = derivative(add(state, b, STEP / 2)), d = derivative(add(state, c, STEP));
      const next = state.map((v, j) => v + STEP * (a[j] + 2 * b[j] + 2 * c[j] + d[j]) / 6);
      const time = i * STEP;
      apex = Math.max(apex, next[1]);
      if (next[1] <= BALL_RADIUS) {
        const part = clamp((state[1] - BALL_RADIUS) / (state[1] - next[1]), 0, 1);
        const p = state.slice(0, 3).map((v, j) => v + (next[j] - v) * part);
        p[1] = BALL_RADIUS;
        duration = (i - 1 + part) * STEP;
        points.push({ t: duration, p });
        landed = true;
        break;
      }
      points.push({ t: time, p: next.slice(0, 3) });
      state = next;
      duration = time;
      if (time >= MAX_TIME) break;
    }
    const landing = points[points.length - 1].p.slice();
    return {
      points, duration, apex, landing, landed, power,
      distanceUnits: Math.hypot(landing[0] - GAME_ORIGIN[0], landing[2] - GAME_ORIGIN[2]),
      fictional: true, units: 'u del juego'
    };
  }

  function install({ THREE, scene, camera, controls, renderer, model, viewport, onState, onAim, onInvalidate } = {}) {
    if (!THREE || !scene || !camera || !controls || !model) throw new Error('Faltan referencias del visor para el juego virtual.');
    const canvas = renderer?.domElement || viewport;
    if (!canvas?.addEventListener) throw new Error('El juego necesita el lienzo del visor.');
    const V = a => new THREE.Vector3(...a);
    const root = new THREE.Group();
    root.name = 'Juego_virtual_sin_calibracion';
    root.visible = false;
    root.userData.excludeFromExport = true;
    scene.add(root);
    const material = (color, roughness = .9) => new THREE.MeshStandardMaterial({ color, roughness });
    const bandMat = material('#9e1d35'), bagMat = material('#72513d'), ballMat = material('#f0d7a0');
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 26, 18), ballMat);
    ball.name = 'Bola_del_juego'; ball.castShadow = true; ball.receiveShadow = true; root.add(ball);
    const bag = new THREE.Group(); bag.name = 'Bolsa_del_juego'; root.add(bag);
    const curve = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16 * Math.PI / 2;
      curve.push(new THREE.Vector2(.20 * Math.sin(t), -.20 * Math.cos(t)));
    }
    const bowlMat = bagMat.clone(); bowlMat.side = THREE.DoubleSide;
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(curve, 32), bowlMat);
    bowl.castShadow = true; bowl.receiveShadow = true; bag.add(bowl);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.20, .012, 8, 32), bandMat);
    rim.rotation.x = Math.PI / 2; bag.add(rim);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(.31, 16, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.name = 'Zona_para_arrastrar_bolsa'; bag.add(hit);
    const bands = [];
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(.08, 1, .008), bandMat);
      mesh.castShadow = true; root.add(mesh); bands.push({ side, mesh });
    }
    function line(color, opacity) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
      geometry.setDrawRange(0, 0);
      const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
      mesh.frustumCulled = false; root.add(mesh); return mesh;
    }
    const preview = line('#80d5d8', .50), trail = line('#ffd585', .95);
    preview.name = 'Trayectoria_virtual_prevista'; trail.name = 'Recorrido_del_juego';
    const marker = new THREE.Group(); marker.name = 'Caida_virtual'; root.add(marker);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.23, 40), new THREE.MeshBasicMaterial({ color: '#edc574', transparent: true, opacity: .40, depthWrite: false, side: THREE.DoubleSide }));
    disk.rotation.x = -Math.PI / 2; marker.add(disk);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.25, .29, 40), new THREE.MeshBasicMaterial({ color: '#ffdc8f', side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .001; marker.add(ring);

    let active = false, phase = 'inactive', aim = sanitizeAim(), heft = 'medium';
    let previewOn = true, trailOn = true, paused = false, drag = null;
    let profile = makeFlight({ aimPosition: aim, heft }), elapsed = 0, snapElapsed = 0;
    let snapFrom = aim.slice(), lastFrame = null, lastEmit = -Infinity, previousElasticVisible = null;
    const originalTouchAction = canvas.style?.touchAction || '';
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    const p = new THREE.Vector3(), upAxis = new THREE.Vector3(0, 1, 0);
    function invalidate() { onInvalidate?.(); }
    function state() {
      return {
        active, phase, power: powerFromAim(aim), heft, previewOn, trailOn,
        aimPosition: aim.slice(), dragging: !!drag, paused,
        distanceUnits: profile.distanceUnits, flightTime: elapsed,
        predictedFlightTime: profile.duration, apex: profile.apex,
        landingPosition: profile.landing.slice(), fictional: true, units: 'u del juego'
      };
    }
    function emit(force = true, now = 0) {
      if (!force && now - lastEmit < 50) return;
      lastEmit = now; onState?.(state());
    }
    function writeLine(mesh, points) {
      const attr = mesh.geometry.getAttribute('position');
      const count = Math.min(points.length, MAX_POINTS);
      for (let i = 0; i < count; i++) attr.setXYZ(i, ...points[i]);
      attr.needsUpdate = true; mesh.geometry.setDrawRange(0, count);
    }
    function placeBag(position) {
      bag.position.copy(V(position));
      for (const { side, mesh } of bands) {
        const a = V([side * .35, 1.86, .045]), b = V([position[0] + side * .19, position[1] -.01, position[2]]);
        const delta = b.clone().sub(a), length = Math.max(.001, delta.length());
        mesh.position.copy(a.add(b).multiplyScalar(.5));
        mesh.quaternion.setFromUnitVectors(upAxis, delta.normalize()); mesh.scale.y = length;
      }
      root.updateMatrixWorld(true);
    }
    function refreshAim() {
      profile = makeFlight({ aimPosition: aim, heft });
      writeLine(preview, profile.points.map(q => q.p));
      marker.position.set(profile.landing[0], .006, profile.landing[2]);
      if (phase === 'ready' || phase === 'aiming') {
        placeBag(aim); ball.position.copy(V(aim).add(V([0, .025, 0])));
      }
      onAim?.({ bagPosition: aim.slice(), phase, power: powerFromAim(aim), fictional: true });
      updateVisibility(); invalidate();
    }
    function updateVisibility() {
      root.visible = active;
      preview.visible = active && previewOn && (phase === 'ready' || phase === 'aiming');
      marker.visible = active && ((previewOn && phase !== 'snapping') || phase === 'landed');
      trail.visible = active && trailOn && (phase === 'flying' || phase === 'landed');
      hit.visible = active && (phase === 'ready' || phase === 'aiming' || phase === 'landed');
      if (active && model.groups?.C06) model.groups.C06.visible = false;
    }
    function releaseCapture() {
      if (!drag) return;
      const saved = drag; drag = null;
      controls.enabled = saved.controlsEnabled;
      if (canvas.style) canvas.style.touchAction = originalTouchAction;
      try { if (canvas.hasPointerCapture?.(saved.id)) canvas.releasePointerCapture(saved.id); } catch (_) {}
    }
    function reset() {
      releaseCapture(); phase = active ? 'ready' : 'inactive'; paused = false;
      elapsed = 0; snapElapsed = 0; lastFrame = null; trail.geometry.setDrawRange(0, 0);
      refreshAim(); emit(); return state();
    }
    function setActive(value) {
      const next = !!value;
      if (next === active) { updateVisibility(); return state(); }
      releaseCapture();
      if (next) {
        previousElasticVisible = model.groups?.C06?.visible ?? null;
        active = true; reset();
      } else {
        active = false; phase = 'inactive'; paused = false; lastFrame = null; root.visible = false;
        if (previousElasticVisible !== null && model.groups?.C06) model.groups.C06.visible = previousElasticVisible;
        previousElasticVisible = null; emit(); invalidate();
      }
      return state();
    }
    function setSettings(next = {}) {
      let aimChanged = false;
      if (next.heft !== undefined) { heft = normalizeHeft(next.heft); aimChanged = true; }
      if (next.aimPosition !== undefined) { aim = sanitizeAim(next.aimPosition); aimChanged = true; }
      if (next.aimHeight !== undefined) { aim[1] = clamp(finite(next.aimHeight, aim[1]), .58, 1.58); aimChanged = true; }
      if (next.power !== undefined) { aim[2] = MIN_PULL + clamp(finite(next.power, powerFromAim(aim)), 0, 100) / 100 * (MAX_PULL - MIN_PULL); aimChanged = true; }
      if (next.previewOn !== undefined) previewOn = !!next.previewOn;
      if (next.trailOn !== undefined) trailOn = !!next.trailOn;
      if (aimChanged) reset(); else { updateVisibility(); emit(); invalidate(); }
      return state();
    }
    function launch() {
      if (!active || phase === 'flying' || phase === 'snapping') return false;
      releaseCapture();
      if (powerFromAim(aim) < 3) { reset(); return false; }
      profile = makeFlight({ aimPosition: aim, heft });
      elapsed = 0; snapElapsed = 0; snapFrom = aim.slice(); lastFrame = null; paused = false;
      phase = 'snapping'; trail.geometry.setDrawRange(0, 0); updateVisibility(); emit(); invalidate(); return true;
    }
    function togglePause() {
      if (phase === 'flying' || phase === 'snapping') { paused = !paused; lastFrame = null; emit(); }
      return paused;
    }
    function sample(time) {
      const points = profile.points;
      if (time >= profile.duration) return profile.landing.slice();
      const i = Math.min(points.length - 2, Math.floor(time / STEP));
      const a = points[Math.max(0, i)], b = points[Math.max(0, i) + 1];
      const f = clamp((time - a.t) / Math.max(.000001, b.t - a.t), 0, 1);
      return a.p.map((v, j) => v + (b.p[j] - v) * f);
    }
    function update(timeMs) {
      if (!active) return;
      updateVisibility();
      const now = finite(timeMs, performance.now());
      const dt = lastFrame === null ? 0 : clamp((now - lastFrame) / 1000, 0, .05);
      lastFrame = now;
      if (paused || (!['snapping', 'flying'].includes(phase))) return;
      if (phase === 'snapping') {
        snapElapsed += dt;
        const f = clamp(snapElapsed / .18, 0, 1), smooth = 1 - (1 - f) ** 3;
        const target = GAME_ORIGIN.map((v, i) => v + (i === 1 ? -.025 : 0));
        const position = snapFrom.map((v, i) => v + (target[i] - v) * smooth);
        placeBag(position); ball.position.copy(V(position).add(V([0, .025, 0])));
        if (f === 1) { phase = 'flying'; elapsed = 0; emit(); }
      } else {
        elapsed = Math.min(profile.duration, elapsed + dt);
        const position = sample(elapsed); ball.position.copy(V(position));
        const count = Math.min(profile.points.length - 1, Math.floor(elapsed / STEP));
        const points = profile.points.slice(0, count + 1).map(q => q.p); points.push(position);
        writeLine(trail, points);
        if (elapsed >= profile.duration) { phase = 'landed'; paused = false; emit(); }
      }
      updateVisibility(); emit(false, now); invalidate();
    }
    function pointerCoords(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      camera.updateMatrixWorld(); ray.setFromCamera(pointer, camera); return rect;
    }
    function projectBag() {
      const rect = canvas.getBoundingClientRect(), point = bag.position.clone().project(camera);
      const distance = Math.max(.01, camera.position.distanceTo(bag.position));
      const radius = .31 * rect.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance);
      return { x: rect.left + (point.x * .5 + .5) * rect.width, y: rect.top + (-point.y * .5 + .5) * rect.height, radius, visible: active && point.z >= -1 && point.z <= 1 };
    }
    function pointerDown(event) {
      if (!active || event.button !== 0 || !['ready', 'landed'].includes(phase) || event.isPrimary === false) return;
      pointerCoords(event); root.updateMatrixWorld(true);
      const projected = projectBag(), hitBag = ray.intersectObject(hit, false).length > 0;
      if (!hitBag && Math.hypot(event.clientX - projected.x, event.clientY - projected.y) > Math.max(22, projected.radius)) return;
      if (phase === 'landed') reset();
      const intersection = ray.ray.intersectPlane(plane, p);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, aim: aim.slice(), point: intersection?.toArray() || null, controlsEnabled: controls.enabled };
      controls.enabled = false; if (canvas.style) canvas.style.touchAction = 'none';
      try { canvas.setPointerCapture?.(event.pointerId); } catch (_) {}
      phase = 'aiming'; event.preventDefault(); event.stopImmediatePropagation(); emit(); invalidate();
    }
    function pointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return;
      const rect = pointerCoords(event), intersection = Math.abs(ray.ray.direction.x) > .045 ? ray.ray.intersectPlane(plane, p) : null;
      let y, z;
      if (intersection && drag.point) { y = drag.aim[1] + intersection.y - drag.point[1]; z = drag.aim[2] + intersection.z - drag.point[2]; }
      else {
        const distance = camera.position.distanceTo(V(drag.aim)), scale = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance / Math.max(1, rect.height);
        y = drag.aim[1] - (event.clientY - drag.y) * scale;
        z = drag.aim[2] - (event.clientX - drag.x) * scale;
      }
      aim = sanitizeAim([0, y, z]); refreshAim(); event.preventDefault(); event.stopImmediatePropagation(); emit();
    }
    function pointerUp(event) {
      if (!drag || event.pointerId !== drag.id) return;
      event.preventDefault(); event.stopImmediatePropagation(); releaseCapture(); launch();
    }
    function cancelPointer(event) {
      if (drag && (!event?.pointerId || event.pointerId === drag.id)) { releaseCapture(); phase = active ? 'ready' : 'inactive'; refreshAim(); emit(); }
    }
    function keyDown(event) {
      if (!active || event.target?.closest?.('input,textarea,select,button,dialog')) return;
      const key = event.key;
      if (![' ', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (key === 'Escape') reset();
      else if (key === ' ' || key === 'Enter') launch();
      else if (key === 'ArrowLeft') setSettings({ power: powerFromAim(aim) + 5 });
      else if (key === 'ArrowRight') setSettings({ power: powerFromAim(aim) - 5 });
      else setSettings({ aimHeight: aim[1] + (key === 'ArrowUp' ? .06 : -.06) });
    }
    canvas.addEventListener('pointerdown', pointerDown, true);
    canvas.addEventListener('pointermove', pointerMove, true);
    canvas.addEventListener('pointerup', pointerUp, true);
    canvas.addEventListener('pointercancel', cancelPointer, true);
    canvas.addEventListener('lostpointercapture', cancelPointer, true);
    window.addEventListener('blur', cancelPointer);
    window.addEventListener('keydown', keyDown, true);
    function bounds() {
      const box = new THREE.Box3();
      if (!active) return box;
      for (const q of profile.points) box.expandByPoint(V(q.p));
      box.expandByPoint(V(aim)); box.expandByPoint(V([-.4, 0, 0])); box.expandByPoint(V([.4, 2.01, 0]));
      return box.expandByScalar(.35);
    }
    function dispose() {
      setActive(false);
      canvas.removeEventListener('pointerdown', pointerDown, true); canvas.removeEventListener('pointermove', pointerMove, true);
      canvas.removeEventListener('pointerup', pointerUp, true); canvas.removeEventListener('pointercancel', cancelPointer, true);
      canvas.removeEventListener('lostpointercapture', cancelPointer, true); window.removeEventListener('blur', cancelPointer); window.removeEventListener('keydown', keyDown, true);
      const geometries = new Set(), materials = new Set();
      root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); root.removeFromParent();
    }
    refreshAim();
    return { root, setActive, setSettings, launch, reset, togglePause, update, getState: state, getSettings: () => ({ power: powerFromAim(aim), heft, aimPosition: aim.slice(), previewOn, trailOn }), bounds, projectBag, dispose };
  }
  window.QuelecCaucheraGame = { install, makeFlight, fictional: true, units: 'u del juego' };
})();
