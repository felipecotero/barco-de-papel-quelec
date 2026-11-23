"""Lee únicamente el color y el estado publicables de las partidas del tablero."""
import io
import json
import os
import posixpath
import re
import sys
import zipfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

SALIDA = Path(__file__).resolve().parents[1] / "avances-utileria" / "estado.json"
HOJA = "Matriz"
GID = "1112122231"
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
COLORES = {
    "FFFFFF": "sin color",
    "E06666": "rojo", "FF0000": "rojo",
    "E69138": "naranja", "F6B26B": "naranja", "FF9900": "naranja",
    "FFD966": "amarillo", "FFE599": "amarillo", "F1C232": "amarillo", "FFFF00": "amarillo",
    "93C47D": "verde claro", "B6D7A8": "verde claro",
    "00FF00": "verde", "6AA84F": "verde",
}
ESTADOS = {"Por verificar", "Pendiente", "En proceso", "En prueba", "Bloqueado", "Entregado", "Validado", ""}


def leer_xml(libro, nombre):
    return ET.fromstring(libro.read(nombre))


def localizar_matriz(libro):
    hojas = leer_xml(libro, "xl/workbook.xml").findall("x:sheets/x:sheet", NS)
    matriz = next((h for h in hojas if h.get("name") == HOJA), None)
    if matriz is None:
        raise ValueError("No se encontró la pestaña de seguimiento.")
    vinculo = matriz.attrib["{" + NS["r"] + "}id"]
    relaciones = leer_xml(libro, "xl/_rels/workbook.xml.rels")
    destino = next(r.attrib["Target"] for r in relaciones if r.get("Id") == vinculo)
    return posixpath.normpath(posixpath.join("xl", destino)).lstrip("/")


def leer_colores(libro):
    estilos = leer_xml(libro, "xl/styles.xml")
    rellenos = []
    for patron in estilos.findall("x:fills/x:fill", NS):
        fondo = patron.find("x:patternFill", NS)
        if fondo is None or fondo.get("patternType", "none") == "none":
            rellenos.append("sin color")
            continue
        tinta = fondo.find("x:fgColor", NS)
        color = tinta.get("rgb", "")[-6:].upper() if tinta is not None else ""
        if tinta is not None and tinta.get("theme") == "0" and not tinta.get("tint"):
            color = "FFFFFF"
        rellenos.append(COLORES.get(color))
    return [rellenos[int(x.get("fillId", "0"))] for x in estilos.findall("x:cellXfs/x:xf", NS)]


def valor(celda, cadenas):
    if celda is None:
        return ""
    if celda.get("t") == "inlineStr":
        return "".join(t.text or "" for t in celda.findall(".//x:t", NS)).strip()
    texto = celda.findtext("x:v", default="", namespaces=NS)
    return (cadenas[int(texto)] if texto and celda.get("t") == "s" else texto).strip()


def extraer(datos, ids):
    with zipfile.ZipFile(io.BytesIO(datos)) as libro:
        filas = leer_xml(libro, localizar_matriz(libro)).findall("x:sheetData/x:row", NS)
        estilos = leer_colores(libro)
        cadenas = []
        if "xl/sharedStrings.xml" in libro.namelist():
            for item in leer_xml(libro, "xl/sharedStrings.xml"):
                cadenas.append("".join(t.text or "" for t in item.findall(".//x:t", NS)))
    columnas = {}
    partidas = {}
    for fila in filas:
        celdas = {re.sub(r"\d+", "", celda.attrib["r"]): celda for celda in fila.findall("x:c", NS)}
        if not columnas:
            nombres = {valor(celda, cadenas): col for col, celda in celdas.items()}
            if {"ID", "Elemento", "Estado"}.issubset(nombres):
                columnas = nombres
            continue
        codigo = valor(celdas.get(columnas["ID"]), cadenas)
        if codigo not in ids:
            continue
        if codigo in partidas or columnas["Elemento"] not in celdas:
            raise ValueError("Partida duplicada o incompleta.")
        color = estilos[int(celdas[columnas["Elemento"]].get("s", "0"))]
        estado = valor(celdas.get(columnas["Estado"]), cadenas)
        if color is None or estado not in ESTADOS:
            raise ValueError("Se requiere revisar un color o estado nuevo.")
        partidas[codigo] = {"color": color, "estado": estado}
    if partidas.keys() != ids:
        raise ValueError("La lectura no contiene todas las partidas del tablero.")
    return partidas


class TablaSheets(HTMLParser):
    """Recoge las celdas y reglas de relleno que incluye la vista HTML de Sheets."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.css = []
        self.en_estilo = False
        self.filas = []
        self.fila = None
        self.celda = None

    def handle_starttag(self, tag, attrs):
        if tag == "style":
            self.en_estilo = True
        elif tag == "tr":
            self.fila = []
        elif tag in ("td", "th") and self.fila is not None:
            self.celda = (dict(attrs), [])

    def handle_data(self, data):
        if self.en_estilo:
            self.css.append(data)
        elif self.celda is not None:
            self.celda[1].append(data)

    def handle_endtag(self, tag):
        if tag == "style":
            self.en_estilo = False
        elif tag in ("td", "th") and self.celda is not None:
            attrs, partes = self.celda
            self.fila.append(("".join(partes).strip(), attrs))
            self.fila.extend([("", {})] * (min(100, int(attrs.get("colspan", "1"))) - 1))
            self.celda = None
        elif tag == "tr" and self.fila is not None:
            self.filas.append(self.fila)
            self.fila = None


def color_css(declaracion):
    resultado = re.search(r"(?:^|;)\s*background(?:-color)?\s*:\s*([^;}!]+)", declaracion, re.I)
    if not resultado:
        return None
    valor = resultado[1].strip().lower()
    if re.fullmatch(r"#[0-9a-f]{3,6}", valor):
        rgb = valor[1:]
        return ("".join(c * 2 for c in rgb) if len(rgb) == 3 else rgb).upper()
    canales = re.fullmatch(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", valor)
    if canales:
        return "".join(f"{int(c):02X}" for c in canales.groups())
    return {"white": "FFFFFF", "transparent": "FFFFFF"}.get(valor)


def extraer_html(datos, ids):
    tabla = TablaSheets()
    tabla.feed(datos.decode("utf-8-sig"))
    tabla.close()
    rellenos = {}
    for selectores, declaracion in re.findall(r"([^{}]+)\{([^{}]*)\}", "".join(tabla.css)):
        fondo = color_css(declaracion)
        if fondo:
            for selector in selectores.split(","):
                clase = re.search(r"\.(s\d+)\s*$", selector)
                if clase:
                    rellenos[clase[1]] = fondo
    columnas = {}
    partidas = {}
    for fila in tabla.filas:
        if not columnas:
            nombres = {nombre: i for i, (nombre, _) in enumerate(fila)}
            if {"ID", "Elemento", "Estado"}.issubset(nombres):
                columnas = {k: nombres[k] for k in ("ID", "Elemento", "Estado")}
            continue
        if len(fila) <= columnas["ID"]:
            continue
        codigo = fila[columnas["ID"]][0]
        if codigo not in ids:
            continue
        if codigo in partidas or len(fila) <= max(columnas.values()):
            raise ValueError("Partida duplicada o incompleta.")
        attrs = fila[columnas["Elemento"]][1]
        nuevo = color_css(attrs.get("style", ""))
        if not nuevo:
            nuevo = next((rellenos[c] for c in attrs.get("class", "").split() if c in rellenos), None)
        color = COLORES.get(nuevo)
        estado = fila[columnas["Estado"]][0]
        if color is None or estado not in ESTADOS:
            raise ValueError("Color o estado sin clasificar.")
        partidas[codigo] = {"color": color, "estado": estado}
    if partidas.keys() != ids:
        raise ValueError("La vista no contiene todas las partidas del tablero.")
    return partidas


def descargar(url):
    with urlopen(Request(url, headers={"User-Agent": "Quelec-Taller/1.0"}), timeout=30) as respuesta:
        contenido = respuesta.read(12_000_001)
    if len(contenido) > 12_000_000:
        raise ValueError("La descarga supera el tamaño esperado.")
    return contenido


def actualizar():
    identificador = os.environ.get("HENRY_SHEET_ID", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", identificador):
        raise ValueError("Falta configurar la fuente de la matriz.")
    anterior = json.loads(SALIDA.read_text(encoding="utf-8"))
    base = f"https://docs.google.com/spreadsheets/d/{identificador}"
    ids = set(anterior["partidas"])
    try:
        hoja = descargar(f"{base}/export?format=xlsx&gid={GID}")
        partidas = extraer(hoja, ids)
    except Exception:
        print("Se consultará la vista HTML de la misma pestaña.")
        html = descargar(f"{base}/htmlview/sheet?gid={GID}&single=true&headers=false")
        partidas = extraer_html(html, ids)
    if partidas == anterior["partidas"]:
        print("La lectura coincide con el corte publicado.")
        return
    fecha = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salida = {"actualizado": fecha, "partidas": dict(sorted(partidas.items()))}
    SALIDA.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Actualizadas {len(partidas)} partidas.")


if __name__ == "__main__":
    try:
        actualizar()
    except Exception as error:
        # El mensaje de una excepción de red puede contener la URL privada.
        print(f"No se pudo renovar la lectura ({type(error).__name__}). Se conserva el último corte.", file=sys.stderr)
        sys.exit(1)
