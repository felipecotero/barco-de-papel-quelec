# Quelec · Taller de objetos

[**Abrir el taller**](https://felipecotero.github.io/barco-de-papel-quelec/?rev=I02) · [Barco R08](barco.html?rev=R08-I02) · [Grulla G04](grulla/?rev=G04)

Índice oscuro con imágenes de los TDR, grulla de origami simplificada y nave anunciada como próximamente. El barco tiene icono propio. Títulos en Quiche Display instalada localmente, con Georgia de respaldo; no se distribuye la fuente comercial. Subtítulos Montserrat incluida con licencia OFL; cuerpo Arial/Avenir. Procedencia de imágenes y fuentes en `assets/`.

## Herramientas comunes

Girar, desplazar, acercar, encuadrar, vistas superior/lateral, rótulos y cotas tienen nombre y ayuda. **Cotas** muestra la envolvente ensamblada; **Rótulos** controla las llamadas por separado. Se pueden ocultar ambos para mirar el modelo. Las cotas de envolvente incluyen los accesorios visibles y no sustituyen las medidas de corte.

**Descargar 3D**, junto a **Guías y planos**, ofrece GLB con texturas integradas (siempre metros), OBJ+MTL+PNG en ZIP y STL binario sin texturas (metros o milímetros). Los objetos se exportan ensamblados a escala1:1, aunque la vista esté separada. No se incluyen suelo, rótulos, cotas, cuadrícula ni cargador externo. OBJ no declara unidades normalizadas; elegir la unidad indicada al importarlo. Mantener MTL y PNG junto al OBJ. STL reúne mallas; no implica una única pieza lista para impresión. Las luces y las sombras dinámicas del visor no se guardan en estos formatos.

## Barco R08

Casco de4m y vela de cuatro caras,270mm de profundidad. Dos mitades con bastidores propios, seis parejas de velcro C1–C6, agarres cortos acolchados y tubo de bandera íntegro enB. Se conserva la geometría y documentación técnica vigente.

- [Blueprints:8pliegos100×70cm](downloads/Planos-R08.pdf?rev=R08-audit1).
- [Guía visual:8pliegos100×70cm](downloads/Guia-visual-R08.pdf?rev=R08-guide1).
- [Paquete técnico con SVG/DXF, tablas y verificaciones](downloads/Paquete-tecnico-R08.zip?rev=R08-audit1).

Seis láminas2440×1220×4mm para133blancos, margen10mm y paso libre6mm. Presupuesto13,738kg con PP600g/m²;14,774kg con PP700g/m², sujeto a los límites de compra y pesaje final. Máximo autorizado15kg. Con700g/m²: mitadA6,863kg yB7,911kg; medias estáticas entre dos adultos3,431 y3,956kg. Esto no mide las fuerzas reales ni certifica la maniobra de separación elevada.

**Ubicar6velcros** abre el interior. **Mostrar paneles** devuelve la piel; **Rótulos** oE oculta las llamadas. Cada bastidor sostiene su mitad: el velcro cierra posición. Gaffer remata; las uniones permanentes usan bandas/fijaciones y adhesivo para PP-LSE probado. El octavo blueprint detalla las asas. Fondo plano sin tornillos salientes. Ensayar retención, apertura, estabilidad y maniobra con materiales reales.

## Grulla G04

Propuesta proporcionada de1400mm de envergadura ×1000mm de cabeza a cola ×1000mm de altura total con argolla. Canasta útil300×300mm. La semilla no está representada: reserva cónica baseØ280mm recomendada (10mm libres por lado), Ø300mm nominal máxima sin holgura, altura350mm, hasta3kg previstos.

Cuatro ramales de las esquinas [X/Z±152,Y300] llegan a [0,960,0] y a una argolla común; sin cruceta ni carga sobre las alas. Largo nominal694,1mm entre ojos y18,04° con vertical; ajustar al herraje comercial. Bandeja Al304×304×1mm, bastidor15×15×1mm, montantes de esquina y cerco plano del borde reciben la carga. Las uniones y el cuelgue requieren prototipo antes de suspender carga; el modelo no declara capacidad certificada.

**Una lámina2440×1220×2mm** contiene36caras +5separadores:41piezas,0,998929m² netos, margen10mm y paso libre6mm sin solapes. Colores y códigos coinciden en visor, mapa e instrucciones. La dirección de los canales no se emplea como hipótesis resistente de la piel. Cinta interior25mm para juntas a tope; papel, cinta, metal, focos y herrajes se compran aparte.

- [Blueprints G04:3pliegos100×70cm](grulla/downloads/Grulla-Blueprints-G04.pdf).
- [Guía intuitiva G04:3pliegos100×70cm](grulla/downloads/Grulla-Guia-visual-G04.pdf).
- [Despiece G04:mapaSVG1:1,41plantillas e inventario/juntasCSV](grulla/downloads/Despiece-Grulla-G04.zip).

Usar las cotas y el SVG1:1 para cortar: imprimir100%,sin ajustar,y medir2440×1220mm antes de usar. El PDF indica sus escalas ilustrativas. Los archivos G01–G03 quedan en carpetas de archivo, señalados como obsoletos; no fabricar con ellos.

**Luz dentro de las alas**, con PP natural translúcido2mm y papel fino no opaco. Dos módulos comerciales5V,1Wmáximo,driver integrado,lente opalØ18 y baseAl25×25×3; separadores2mm interiores,2M3×16nylon a20mm y contraplaca exterior25×25×1. Elegir módulo y ajustar tornillo sin aplastar PP. Batería5V/2A protegida y extraíble → fusible1A → interruptor → dos módulos en paralelo. Presupuesto máximo3,2W. Probar transmisión, adhesión y temperatura del acabado real; cargar fuera del ave.

**Papel con luz** enciende los LED interiores y reduce luz exterior; apagarlos devuelve la iluminación general. **Render con ray tracing** realiza trazado progresivo de rayos con backend local; dejar quieta la cámara para reducir ruido. Cambiar cámara reinicia muestras. Las alas tienen transmisión rugosa, grosor2mm y un mapa de dispersión difusa aproximada a partir de la distancia al LED; el resultado es una representación de material, sujeta a prueba real. Las vistas de construcción usan colores opacos. Cargar batería muestra el cargador fuera del ave.

## Sin conexión y mantenimiento

**Abrir-Barco.html** y **grulla/Abrir-Grulla.html** incluyen modelo, bibliotecas, texturas y exportación. La grulla incluye también backend y trabajador de ray tracing. Los enlaces a guías y planos conducen a la web publicada y requieren conexión. El visor no incluye analítica ni servicios de exportación.

Regenerar los portátiles con `python3 tools/build-portable.py` y `python3 grulla/tools/build-portable.py` tras cambios. `model-r05.json` conserva su nombre por compatibilidad y contiene R08. `grulla/tools/build-origami.py` produce la geometría y anidado G04. `grulla/verificacion-G04.json` registra las comprobaciones de esta revisión. `SHA256SUMS` registra los archivos entregados.

Enlaces antiguos R05–R08 a la raíz se redirigen a `barco.html` conservando parámetros y vista. La nave no tiene un visor activo. Three.js y backend de ray tracing se distribuyen con sus licencias MIT, Montserrat con OFL. Quiche se usa solo mediante instalación local autorizada por el usuario.
