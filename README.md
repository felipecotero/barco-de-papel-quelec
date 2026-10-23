# Quelec · Taller de objetos

[**Abrir el índice del taller**](https://felipecotero.github.io/barco-de-papel-quelec/?rev=I01)

Índice con imágenes originales de los TDR, símbolo de grulla de origami y accesos al [barco R08](barco.html?rev=R08-obj1), la [grulla G03](grulla/?rev=G03) y la nave (próximamente).

Vela de cuatro caras con 270 mm de profundidad, costillas independientes por mitad, seis parejas de velcro, bandas de unión y agarres cortos acolchados. Interfaz en español con vistas de construcción, detalles ampliados y presentación con acabado de papel.

## Planos y archivos de taller

- [Guía visual de armado: ocho pliegos de 100 × 70 cm](downloads/Guia-visual-R08.pdf?rev=R08-guide1). Fondo claro, colores del visor, nomenclatura sencilla, dibujos por pasos y comprobación al terminar cada etapa. Complementa los blueprints; para cortar se usan las plantillas 1:1 del paquete técnico.

- [Ocho pliegos 100 × 70 cm, revisión R08](downloads/Planos-R08.pdf?rev=R08-audit1).
- [Paquete técnico R08: DXF, SVG 1:1, tablas y comprobaciones](downloads/Paquete-tecnico-R08.zip?rev=R08-audit1).

**Seis láminas de 2440 × 1220 × 4 mm**: encaje geométrico verificado para 133 blancos, con margen de 10 mm y separación mínima de 6 mm. Incluye pestañas, contraplacas y costillas. El anidado de la vela utiliza su desarrollo real.

**Presupuesto completo**: 13,738 kg con PP de 600 g/m²; 14,774 kg con PP de 700 g/m². Objetivo 14 kg, máximo autorizado 15 kg. Estos valores dependen de conservar los límites de compra de cada partida y requieren pesaje final. El tubo de bandera es ahora aluminio Ø32 × 1 mm, ID30, sostenido por una espina y dos brazos íntegramente en B. Las barras de portadores Ø40 × 2 se conservan.

Con 700 g/m², estimación por mitad: A 6,863 kg; B 7,911 kg. Entre dos adultos por mitad, medias 3,431 y 3,956 kg. Las reservas se distribuyen al 50%; no es medición de fuerzas en las manos ni certificación de la maniobra.

## Usar el visor

**Ver despiece** muestra las seis láminas. **Ver interior** deja ver costillas y seis cierres. **Ubicar 6 velcros** señala C1–C6 con las coordenadas de B-06. El botón **Rótulos** de la barra controla todas las llamadas y cuadros de pieza, también dentro de los detalles. **Cierre con velcro**, **Cintas y bandas** y **Sostener la vela** abren detalles. El deslizador separa el ensamble mostrado. **Presentación** permite observar papel, luces y sombras. Los botones incluyen texto y ayuda.

Arrastrar para girar; rueda o pinza para acercar. E mostrar/ocultar todas las etiquetas, C girar, H encuadrar, espacio animar/pausar y Escape volver. Compartir vista conserva cámara, etapa, separación y visibilidad de etiquetas en el enlace.

El velcro es cierre de posición: cada bastidor sostiene su propia mitad. Ajustar el contacto y medir apertura en prototipo. Uniones, retenciones, adhesivos y maniobra elevada requieren prueba física. El fondo no lleva cabezas de tornillos por debajo; las pestañas del fondo se unen con adhesivo PP-LSE probado. La gaffer remata y presenta, junto a bandas y fijaciones.

## Abrir sin conexión

Descargar la carpeta y abrir **Abrir-Barco.html**, manteniendo `downloads` a su lado. La versión web del barco `barco.html` no requiere compilación. El índice es `index.html`. Three.js y su licencia MIT están incluidos en `vendor`. No hay analítica ni servicios externos.

`model-r05.json` conserva su nombre por compatibilidad, pero su contenido y sus desarrollos corresponden a R08. Regenerar la copia portátil con `python3 tools/build-portable.py` después de editar.

Fuentes de materiales: [Coroplast](https://www.coroplast.com/resources/), [3M DP8005 para PP de baja energía superficial](https://www.3m.com/3M/en_US/p/d/b5005321032/), [Pro Gaff](https://www.protapes.com/pro-gaff-tape/). Las fichas no certifican este conjunto.

[Ubicaciones nominales de las28 pestañasTP](downloads/Ubicaciones-TP-R08.csv?rev=R08-audit1): coordenadasX/Y/Z yencuentro; pliegue yángulo se presentan sobre las piezas reales.

## Cambios R08

Octavo pliego dedicado a las asas de ambas mitades. El visor dibuja los perímetros y pliegues reales; no activa mallas de alambre ni extrae diagonales de la triangulación. La geometría, seis láminas y presupuesto anterior se conservan.

## Revisión de concordancia

B-06 localiza las seis parejas y define soportes, replanteo, taladros, fijaciones y retención textil. CSV, modelo y PDF usan C1–C6 de la misma tabla. Se retiraron las descargas obsoletas y los visores antiguos redirigen a R08; el historial de Git conserva los originales. Se mantienen ocho pliegos de letra grande y el anidado de seis láminas. La pletina de retención se concreta dentro de la reserva existente de 80 g; ensayar fijación, apertura y peso real.

## Paneles e interior

La vista del velcro abre el interior y lo indica con una banda visible. **Mostrar paneles** devuelve el cartón Plast sin alterar la separación de las mitades. **Barco completo** abre la presentación exterior. Cambiar de modo, comenzar la animación, recorrer el montaje o volver al despiece restablece los paneles. Las etiquetas se controlan por separado con E.

## Grulla de origami G03

[**Abrir la grulla**](https://felipecotero.github.io/barco-de-papel-quelec/grulla/?rev=G03). Se conservan sin alteración las 36 caras de la silueta G02: 120 cm de envergadura, 100 cm de cabeza a cola y 100 cm de altura total con anilla. Suelo útil 40 × 40 cm; reserva 35 × 35 × 35 cm, sin representar la semilla. Piel propuesta de Cartón Plast de 2 mm.

El cuelgue nace en **las cuatro esquinas de la canasta**, sin tomar cargas de las alas. Bandeja y bastidor conectan con cuatro montantes metálicos de esquina; cuatro ramales verticales llegan a una cruceta ligera sobre el ave y a una anilla común. Las diagonales de la cruceta miden 571,34 mm, perfil propuesto aluminio 15 × 15 × 1 mm. Dejan libre la reserva central. Ojos propuestos M6 con contraplaca y tuerca autoblocante, unidos a metal. El modelo define el recorrido; capacidad, uniones y estabilidad requieren validación física del prototipo antes de suspender la carga prevista de hasta 3 kg.

**Una lámina de 2440 × 1220 × 2 mm** contiene 36 caras y 5 separadores interiores. Área neta 1,159174 m²; margen mínimo 10 mm, hueco mínimo 6 mm, sin solapes. Las caras se unen a tope con cinta flexible interior propuesta de 25 mm, sin pestañas adicionales. La cinta y el acabado de papel se compran en rollo; bastidor, bandeja, cruceta y herrajes son materiales separados. Ensayar adhesión y rigidez del PP2 real: el anidado no asigna capacidad estructural a la dirección de los canales.

[Despiece nominal G03 en ZIP](grulla/downloads/Despiece-Grulla-G03.zip): SVG 1:1 en milímetros, inventario CSV con códigos y longitudes de lados, secuencia y criterios de unión. Imprimir al 100 %, sin ajustar, y verificar la medida 2440 × 1220 mm antes de cortar. El visor permite animar de la única lámina al ave y reconocer las mismas 41 piezas. Los separadores quedan dentro de los volúmenes, sin alterar la silueta.

Los documentos G01 y la verificación formal G02 se conservan solo como historial; no son los planos de fabricación de G03. Las verificaciones actuales se describen en `grulla/verificacion-G03.json`.

## Exportar modelos 3D

El botón **OBJ**, con icono y ayuda, está disponible en ambos visores. Permite elegir metros o milímetros a escala 1:1. Descarga un ZIP con OBJ, MTL y texturas PNG; descomprimir todo en una carpeta y mantener los archivos juntos. OBJ no codifica una unidad estándar: seleccionar la unidad elegida al importar. `LEER.txt` registra unidades y envolvente real del archivo, incluidos accesorios.

Se exporta el modelo ensamblado, independientemente de la etapa, la explosión o la visibilidad de las pieles. Se incluyen las caras, separadores y sistemas del objeto. Se excluyen suelo, cuadrícula, rótulos, esquemas ampliados y cargador externo. En el barco se exportan las mitades reunidas y la bandera si está colocada. El formato conserva mallas, UV, materiales y texturas; la iluminación y sombras dinámicas del visor no forman parte de OBJ. El exportador funciona también en los HTML portátiles.

## Versiones y compatibilidad

El barco conserva geometría, seis láminas, presupuesto y sus dos juegos de ocho pliegos. Los enlaces antiguos a la raíz con revisión R05–R08, `vista` o vistas compartidas se redirigen a `barco.html`, preservando sus parámetros. Los visores tienen un acceso **Índice**. La nave no tiene enlace activo ni modelo publicado todavía.

Las imágenes del índice provienen de los TDR del proyecto; ver `assets/FUENTES.txt`. Three.js conserva su licencia MIT. No se usan servicios de exportación ni analítica.
