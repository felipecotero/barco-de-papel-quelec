# Barco de papel · Taller 3D R08

[**Abrir el visor**](https://felipecotero.github.io/barco-de-papel-quelec/)

Vela de cuatro caras con 270 mm de profundidad, costillas independientes por mitad, seis parejas de velcro, bandas de unión y agarres cortos acolchados. Interfaz en español con vistas de construcción, detalles ampliados y presentación con acabado de papel.

## Planos y archivos de taller

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

Descargar la carpeta y abrir **Abrir-Barco.html**, manteniendo `downloads` a su lado. La versión web `index.html` no requiere compilación. Three.js y su licencia MIT están incluidos en `vendor`. No hay analítica ni servicios externos.

`model-r05.json` conserva su nombre por compatibilidad, pero su contenido y sus desarrollos corresponden a R08. Regenerar la copia portátil con `python3 tools/build-portable.py` después de editar.

Fuentes de materiales: [Coroplast](https://www.coroplast.com/resources/), [3M DP8005 para PP de baja energía superficial](https://www.3m.com/3M/en_US/p/d/b5005321032/), [Pro Gaff](https://www.protapes.com/pro-gaff-tape/). Las fichas no certifican este conjunto.

[Ubicaciones nominales de las28 pestañasTP](downloads/Ubicaciones-TP-R08.csv?rev=R08-audit1): coordenadasX/Y/Z yencuentro; pliegue yángulo se presentan sobre las piezas reales.

## Cambios R08

Octavo pliego dedicado a las asas de ambas mitades. El visor dibuja los perímetros y pliegues reales; no activa mallas de alambre ni extrae diagonales de la triangulación. La geometría, seis láminas y presupuesto anterior se conservan.

## Revisión de concordancia

B-06 localiza las seis parejas y define soportes, replanteo, taladros, fijaciones y retención textil. CSV, modelo y PDF usan C1–C6 de la misma tabla. Se retiraron las descargas obsoletas y los visores antiguos redirigen a R08; el historial de Git conserva los originales. Se mantienen ocho pliegos de letra grande y el anidado de seis láminas. La pletina de retención se concreta dentro de la reserva existente de 80 g; ensayar fijación, apertura y peso real.

## Paneles e interior

La vista del velcro abre el interior y lo indica con una banda visible. **Mostrar paneles** devuelve el cartón Plast sin alterar la separación de las mitades. **Barco completo** abre la presentación exterior. Cambiar de modo, comenzar la animación, recorrer el montaje o volver al despiece restablece los paneles. Las etiquetas se controlan por separado con E.
