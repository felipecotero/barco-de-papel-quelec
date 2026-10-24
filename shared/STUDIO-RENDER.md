# Estudio rápido de Quelec

`studio-render.js` es un script clásico local. Expone `window.QuelecStudio` y usa el mismo Three r180 que el visor; no descarga imágenes, HDR, programas ni bibliotecas.

```html
<script src="../shared/studio-render.js?v=S01"></script>
```

```js
const studio = QuelecStudio.installStudio({
  THREE, renderer, scene, ground,
  getBounds: () => new THREE.Box3(minimum, maximum),
  getObjects: () => [modelRoot],
  notify: message => showMessage(message),
});
studio.setActive(true);
studio.setNight(false);
// Después de una edición del montaje o de la visibilidad:
studio.invalidate();
// En el bucle existente, antes de renderer.render(scene, camera):
studio.update();
```

- `setActive(bool)` prepara el entorno una vez y activa/restaura la iluminación externa del visor. No modifica las luces PointLight/SpotLight interiores.
- `setNight(bool)` regula luces externas, exposición, fondo y suelo sin apagar los LED del modelo.
- `setBounds(Box3)` ajusta el encuadre de luces y contactos al volumen; usa metros.
- `applyMaterial(material,{paper:true,texture,fastDiffuse:true})` da rugosidad mate y grano fino. `fastDiffuse` evita el paso de transmisión de vidrio en la vista interactiva del papel. La grulla mantiene su aproximación localizada de dispersión cálida del LED. El render físico y la exportación recuperan las propiedades originales de transmisión mediante sus propias escenas/materiales.
- `invalidate()` actualiza sombras cuando cambian las piezas. Girar la cámara no exige esperar ni acumular muestras.
- `getState()` informa preparación, tiempo del PMREM, coste del último contacto y `samplesRequired:0`.
- `dispose()` restaura la escena original y libera los recursos propios.

El entorno PMREM se genera a partir de **RoomEnvironment oficial de Three r180** (incluido y adaptado al namespace existente). PMREM prefiltra la iluminación para materiales PBR. Se añaden tres luces direccionales de estudio y sombras PCF; el contacto suave es una aproximación artística por profundidad con desenfoque, actualizada solo al editar. El estudio rápido no calcula iluminación global por path tracing y no se presenta como tal.

Fuentes: https://threejs.org/docs/pages/RoomEnvironment.html y https://threejs.org/docs/pages/PMREMGenerator.html. Código original: https://github.com/mrdoob/three.js/blob/r180/examples/jsm/environments/RoomEnvironment.js. Licencia MIT conservada en `vendor/LICENSE-three.txt`.

La opción secundaria **Ray tracing lento** conserva el trazado físico progresivo real con hasta 512 muestras y 6 rebotes. El usuario puede detenerlo para volver inmediatamente al estudio rápido. Ambos métodos mantienen geometría, unidades y exportaciones.
