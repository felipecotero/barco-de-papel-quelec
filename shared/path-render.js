/**
 * Quelec — optional, genuinely progressive WebGL 2 path tracing.
 * Pinned backend: three-gpu-pathtracer 0.0.24 / three-mesh-bvh 0.9.2 / Three r180.
 * The backend and BVH worker are local files; activation never contacts a CDN.
 *
 * Integration:
 *   const ray = createPathRenderer({ THREE, renderer, camera, getScene, notify });
 *   await ray.enable();
 *   // In the existing animation loop, AFTER controls.update():
 *   if (!ray.render()) renderer.render(editingScene, camera);
 *   // On resize: ray.resize(). Camera motion is detected automatically.
 *   // On geometry / light / material changes: await ray.refresh().
 *   // To return to the workshop and release GPU targets: ray.disable().
 *
 * getScene() must return a separate Scene, or { scene, dispose() }. Include only
 * actual surfaces, not edges, labels, grids, measurement helpers, or sample sheets.
 * Use MeshStandard/PhysicalMaterial and Point/Spot/Directional/RectArea lights.
 * Ambient/Hemisphere lights are not part of this physically based integrator.
 * LED sources can be emissive meshes, but add a co-located Point/SpotLight for
 * efficient multiple-importance sampling. A SpotLight target must be in scene.
 * Textures may be shared: they are never disposed by this adapter. Materials are
 * cloned here. getScene's optional dispose owns only its own geometry/assets.
 * This backend reads normalMap, not bumpMap; canvas bump maps are converted here
 * into tangent-space normals while preserving their repeat, offset, and rotation.
 * enable() reports preparation; getState().samples > 0 confirms traced samples.
 * Compiling/preparing uses the existing editing view, never a fake ray-traced view.
 */

let backendPromise;
const loadBackend = () => backendPromise ||= import('../vendor/pathtracer/pathtracer.js');
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

export function createPathRenderer({ THREE, renderer, camera, getScene, notify = () => {},
  maxSamples = 192, maxResolution = 760, bounces = 5 } = {}) {
  if (!THREE || !renderer || !camera || typeof getScene !== 'function') {
    throw new TypeError('El render necesita Three, renderer, cámara y getScene.');
  }
  let enabled = false, loading = false, tracer = null, worker = null, ownedScene = null;
  let cleanupScene = null, abortPreparation = null, disposed = false, error = null, shaderError = null, token = 0;
  let lastSize = '', lastCamera = '', lastNotice = '', refreshPromise = null;
  let savedShaderError = null, restoreDebug = null, renderSeconds = 0, readyNotified = false;
  const materials = new Set(), textures = new Set(), normalMaps = new Map();
  const size = new THREE.Vector2();

  const tell = message => {
    if (message === lastNotice) return;
    lastNotice = message;
    try { notify(message, getState()); } catch (e) { console.warn('Quelec render notice:', e); }
  };

  function getState() {
    return {
      enabled, loading, compiling: !!tracer?.isCompiling,
      samples: tracer?.samples || 0, maxSamples, error,
      engine: 'WebGL 2 · path tracing · three-gpu-pathtracer 0.0.24',
      renderScale: tracer?.renderScale || 0, bounces,
      renderSeconds, paperNormalMaps: normalMaps.size,
    };
  }

  function disposeTracer() {
    // 0.0.24.dispose() leaves its low-res target and scene generator allocated.
    // This adapter pins that version and releases those owned resources as well.
    if (tracer) {
      const value = tracer;
      tracer = null;
      try { value.dispose(); } catch (_) {}
      try { value._lowResPathTracer?.dispose(); } catch (_) {}
      try { value._generator?.geometry?.dispose(); } catch (_) {}
      try { value._colorBackground?.dispose(); } catch (_) {}
      try { value._internalBackground?.dispose(); } catch (_) {}
      const released = new Set();
      for (const pass of [value._pathTracer, value._lowResPathTracer]) {
        const material = pass?.material;
        if (material && !released.has(material)) {
          released.add(material);
          for (const key of ['bvh', 'attributesArray', 'materialIndexAttribute', 'materials',
            'textures', 'iesProfiles', 'envMapInfo', 'stratifiedTexture', 'stratifiedOffsetTexture']) {
            const asset = material[key];
            try { (asset?.renderTarget || asset)?.dispose?.(); } catch (_) {}
          }
          try { material.lights?.tex?.dispose(); } catch (_) {}
          try { material.dispose(); } catch (_) {}
        }
        try { pass?._blendQuad?.material?.dispose(); } catch (_) {}
      }
    }
    try { worker?.dispose(); } catch (_) {}
    worker = null;
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    materials.clear(); textures.clear(); normalMaps.clear();
    try { cleanupScene?.(); } catch (e) { console.warn('Quelec render cleanup:', e); }
    cleanupScene = null;
    ownedScene = null;
    if (restoreDebug) restoreDebug();
    restoreDebug = null;
  }

  function checkSupport() {
    const gl = renderer.getContext();
    if (gl.isContextLost()) throw new Error('El contexto gráfico se ha perdido.');
    if (!renderer.capabilities.isWebGL2) throw new Error('Este navegador necesita WebGL 2 para trazar rayos.');
    if (!gl.getExtension('EXT_color_buffer_float')) {
      throw new Error('La tarjeta gráfica no admite el búfer flotante necesario.');
    }
    if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 2048) {
      throw new Error('La memoria de texturas disponible no alcanza para este render.');
    }
  }

  function cameraSignature() {
    camera.updateMatrixWorld();
    // Ignore numerical noise after OrbitControls damping converges.
    return [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements]
      .map(value => Math.round(value * 1e7)).join(',');
  }

  function resize() {
    if (!tracer) return;
    renderer.getDrawingBufferSize(size);
    const signature = `${size.x},${size.y}`;
    if (signature !== lastSize) {
      lastSize = signature;
      tracer.renderScale = Math.min(1, maxResolution / Math.max(size.x, size.y));
      tracer.reset();
      readyNotified = false;
    }
  }

  function installNormals(scene) {
    const cloned = new Map();
    scene.traverse(object => {
      if (!object.isMesh) return;
      const convert = source => {
        if (cloned.has(source)) return cloned.get(source);
        // The physical integrator only accepts standard/physical materials.
        let material;
        if (source.isMeshStandardMaterial || source.isMeshPhysicalMaterial) material = source.clone();
        else {
          material = new THREE.MeshStandardMaterial({
            color: source.color || '#ffffff', map: source.map || null,
            roughness: .85, metalness: 0, side: source.side,
            transparent: source.transparent, opacity: source.opacity,
          });
        }
        if (!material.normalMap && material.bumpMap) {
          const key = `${material.bumpMap.uuid}:${material.bumpScale}`;
          let normal = normalMaps.get(key);
          if (!normal) {
            normal = bumpToNormal(THREE, material.bumpMap, material.bumpScale);
            if (normal) { normalMaps.set(key, normal); textures.add(normal); }
          }
          if (normal) {
            material.normalMap = normal;
            material.normalScale.set(1, 1);
          }
          // Remove unsupported bump map to avoid a redundant texture-array layer.
          material.bumpMap = null;
        }
        material.needsUpdate = true;
        cloned.set(source, material); materials.add(material);
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(convert) : convert(object.material);
    });
  }

  async function enable() {
    if (disposed) return false;
    if (enabled) return true;
    if (loading) return refreshPromise || false;
    const run = ++token;
    loading = true; error = null; shaderError = null;
    renderSeconds = 0; readyNotified = false; lastCamera = ''; lastSize = '';
    tell('Preparando trazado de rayos… Puedes seguir moviendo la cámara.');
    try {
      checkSupport();
      await frame();
      const backend = await loadBackend();
      if (run !== token || disposed) return false;
      const result = await getScene({ backend });
      if (run !== token || disposed) {
        try { result?.dispose?.(); } catch (_) {}
        return false;
      }
      ownedScene = result?.isScene ? result : result?.scene;
      cleanupScene = result?.isScene ? null : result?.dispose || null;
      if (!ownedScene?.isScene) throw new Error('No se pudo preparar la escena del objeto.');
      installNormals(ownedScene);
      ownedScene.updateMatrixWorld(true);
      tracer = new backend.WebGLPathTracer(renderer);
      tracer.bounces = bounces;
      tracer.transmissiveBounces = 3;
      tracer.multipleImportanceSampling = true;
      tracer.filterGlossyFactor = .55;
      tracer.tiles.set(2, 2);
      tracer.textureSize.set(512, 512);
      tracer.renderDelay = 100;
      tracer.fadeDuration = 0;
      tracer.minSamples = 1;
      tracer.dynamicLowRes = false;
      tracer.rasterizeScene = false;
      tracer.synchronizeRenderSize = true;
      tracer.renderToCanvas = true;
      worker = new backend.GenerateMeshBVHWorker();
      tracer.setBVHWorker(worker);
      resize();
      if (renderer.debug) {
        savedShaderError = renderer.debug.onShaderError;
        renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
          shaderError = 'El controlador gráfico no pudo compilar el trazado de rayos.';
          console.error(shaderError, gl.getProgramInfoLog(program),
            gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment));
          if (savedShaderError) savedShaderError(gl, program, vertex, fragment);
        };
        restoreDebug = () => { renderer.debug.onShaderError = savedShaderError; };
      }
      // Terminating a BVH worker does not settle its upstream promise. Race it
      // against explicit cancellation so turning this tool off never hangs UI.
      const canceled = new Promise((_, reject) => {
        abortPreparation = () => reject(new Error('Preparación cancelada.'));
      });
      await Promise.race([tracer.setSceneAsync(ownedScene, camera), canceled]);
      abortPreparation = null;
      if (run !== token || disposed) return false;
      lastCamera = cameraSignature();
      enabled = true; loading = false;
      tell('Compilando el render físico. Al terminar, la imagen mejorará con cada muestra.');
      return true;
    } catch (e) {
      if (run === token) {
        error = e?.message || String(e);
        enabled = false; loading = false;
        disposeTracer();
        tell(`No se pudo activar el trazado de rayos: ${error} Continúa la vista normal.`);
        console.warn('Quelec path tracer:', e);
      }
      return false;
    } finally {
      if (run === token) loading = false;
    }
  }

  function disable() {
    token++;
    abortPreparation?.(); abortPreparation = null;
    enabled = false; loading = false;
    disposeTracer();
    lastCamera = ''; lastSize = ''; readyNotified = false;
  }

  function reset(options = {}) {
    if (options?.rebuild) return refresh();
    if (!tracer || !enabled) return;
    tracer.updateCamera();
    lastCamera = cameraSignature();
    readyNotified = false;
  }

  async function refresh() {
    if (!enabled && !loading) return false;
    disable();
    refreshPromise = enable();
    try { return await refreshPromise; } finally { refreshPromise = null; }
  }

  function render() {
    if (!enabled || !tracer || disposed) return false;
    try {
      if (renderer.getContext().isContextLost()) throw new Error('Se perdió el contexto gráfico.');
      resize();
      const signature = cameraSignature();
      if (signature !== lastCamera) {
        tracer.updateCamera();
        lastCamera = signature;
        readyNotified = false;
      }
      if (shaderError) throw new Error(shaderError);
      if (tracer.samples < maxSamples) {
        const start = performance.now();
        tracer.renderSample();
        renderSeconds += (performance.now() - start) / 1000;
      }
      if (shaderError) throw new Error(shaderError);
      // Keep the normal viewport during compilation and until the first complete
      // genuinely traced sample has been presented. No raster pass is labelled RT.
      const traced = tracer.samples >= 1 && !tracer.isCompiling;
      if (traced && !readyNotified) {
        readyNotified = true;
        tell('Trazado de rayos activo. Deja quieta la cámara para reducir el grano.');
      }
      return traced;
    } catch (e) {
      error = e?.message || String(e);
      disable();
      tell(`El render se detuvo: ${error} Continúa la vista normal.`);
      console.warn('Quelec path tracer:', e);
      return false;
    }
  }

  const onContextLost = () => {
    if (enabled || loading) {
      error = 'Se perdió el contexto gráfico.';
      disable();
      tell('El render se detuvo porque se perdió el contexto gráfico.');
    }
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  function dispose() {
    disable(); disposed = true;
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
  }
  return { enable, disable, reset, refresh, render, getState, resize, dispose };
}

/** Convert a readable canvas/image height field into a tangent-space normal map. */
export function bumpToNormal(THREE, source, bumpScale = .0004) {
  const image = source?.image;
  if (!image?.width || !image?.height) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(512, image.width); canvas.height = Math.min(512, image.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const input = context.getImageData(0, 0, canvas.width, canvas.height);
    const output = context.createImageData(canvas.width, canvas.height);
    const { width, height } = canvas;
    const heightAt = (x, y) => {
      const i = (((y + height) % height) * width + ((x + width) % width)) * 4;
      return (input.data[i] + input.data[i + 1] + input.data[i + 2]) / 765;
    };
    // Derivative is per UV unit, scaled by physical bump amplitude. Keep grain
    // subtle; this is a surface normal perturbation, not displaced geometry.
    const strength = Math.min(2.5, Math.max(.02, Math.abs(bumpScale) * width * 3));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const nx = -(heightAt(x + 1, y) - heightAt(x - 1, y)) * strength;
      const ny = (heightAt(x, y + 1) - heightAt(x, y - 1)) * strength;
      const length = Math.hypot(nx, ny, 1), i = (y * width + x) * 4;
      output.data[i] = Math.round((nx / length + 1) * 127.5);
      output.data[i + 1] = Math.round((ny / length + 1) * 127.5);
      output.data[i + 2] = Math.round((1 / length + 1) * 127.5);
      output.data[i + 3] = 255;
    }
    context.putImageData(output, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.name = 'Quelec · relieve de fibras de papel';
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = source.wrapS; texture.wrapT = source.wrapT;
    texture.repeat.copy(source.repeat); texture.offset.copy(source.offset);
    texture.center.copy(source.center); texture.rotation = source.rotation;
    texture.flipY = source.flipY;
    return texture;
  } catch (e) {
    console.warn('No se pudo leer el relieve de papel para el render:', e);
    return null;
  }
}
