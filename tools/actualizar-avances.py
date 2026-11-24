"""Publica los campos de seguimiento de las partidas del tablero."""
import io
import json
import os
import posixpath
import re
import sys
import zipfile
from datetime import date, datetime, timedelta, timezone
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

CABECERAS = ("ID", "Elemento", "Estado", "Avance y apoyo requerido", "Última revisión", "Próxima revisión")


def columnas_de(fila):
    por_nombre = {" ".join(texto.split()).casefold(): indice for indice, texto in fila}
    if all(cabecera.casefold() in por_nombre for cabecera in CABECERAS):
        return {nombre: por_nombre[nombre.casefold()] for nombre in CABECERAS}
    return {}


def fecha_revision(texto, usa_1904=False):
    if not texto or texto.strip().casefold() in {"pendiente", "por definir", "sin fecha", "n/a", "-", "—"}:
        return ""
    if re.fullmatch(r"\d+(?:\.\d+)?", texto):
        dias = int(float(texto))
        origen = date(1904, 1, 1) if usa_1904 else date(1899, 12, 30 if dias >= 60 else 31)
        return (origen + timedelta(days=dias)).isoformat()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}(?:T.*)?", texto):
        return date.fromisoformat(texto[:10]).isoformat()
    return datetime.strptime(texto, "%d/%m/%Y").date().isoformat()


# Solo se exporta la nota elegida del seguimiento. Los contactos, enlaces
# privados, credenciales y cifras de dinero que se peguen en ella se omiten.
DATOS_PRIVADOS = re.compile(
    r"(?:https?://|www\.)[^\s<>]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}"
    r"|(?:[$€£]\s*|\b(?:COP|USD|EUR)\s*)\d+(?:[., ]\d+)*(?:\s*(?:millones?|mil)\b)?"
    r"|\b\d+(?:[., ]\d+)*(?:\s*(?:millones?|mil))?\s*(?:pesos|COP|USD|EUR|dólares|euros)\b"
    r"|(?<!\w)\+?\d(?:[ .()-]*\d){6,14}(?!\d)"
    r"|\b(?:clave|contraseña|password|token|api[ _-]?key|PIN)\s*[:=]\s*[^\s,;]+"
    r"|\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{16,})\b",
    re.IGNORECASE,
)


def partida(color, estado, nota, ultima, proxima, usa_1904=False):
    if color is None or estado not in ESTADOS:
        raise ValueError("Se requiere revisar un color o estado nuevo.")
    return {
        "color": color,
        "estado": estado,
        "avance": DATOS_PRIVADOS.sub("[dato reservado]", nota.strip()),
        "ultimaRevision": fecha_revision(ultima, usa_1904),
        "proximaRevision": fecha_revision(proxima, usa_1904),
    }


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
        propiedades = leer_xml(libro, "xl/workbook.xml").find("x:workbookPr", NS)
        usa_1904 = propiedades is not None and propiedades.get("date1904") in {"true", "1"}
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
            columnas = columnas_de((col, valor(celda, cadenas)) for col, celda in celdas.items())
            continue
        codigo = valor(celdas.get(columnas["ID"]), cadenas)
        if codigo not in ids:
            continue
        if codigo in partidas or columnas["Elemento"] not in celdas:
            raise ValueError("Partida duplicada o incompleta.")
        color = estilos[int(celdas[columnas["Elemento"]].get("s", "0"))]
        campos = [valor(celdas.get(columnas[nombre]), cadenas) for nombre in CABECERAS[2:]]
        partidas[codigo] = partida(color, *campos, usa_1904=usa_1904)
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
        elif tag == "br" and self.celda is not None:
            self.celda[1].append("\n")
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
            columnas = columnas_de((i, nombre) for i, (nombre, _) in enumerate(fila))
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
        campos = [fila[columnas[nombre]][0] for nombre in CABECERAS[2:]]
        partidas[codigo] = partida(color, *campos)
    if partidas.keys() != ids:
        raise ValueError("La vista no contiene todas las partidas del tablero.")
    return partidas


def descargar(url, limite):
    peticion = Request(url, headers={"User-Agent": "Quelec-Taller/2.0", "Cache-Control": "no-cache"})
    with urlopen(peticion, timeout=45) as respuesta:
        contenido = respuesta.read(limite + 1)
    if len(contenido) > limite:
        raise ValueError("La descarga supera el tamaño esperado.")
    return contenido


def actualizar():
    identificador = os.environ.get("HENRY_SHEET_ID", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", identificador):
        raise ValueError("Falta configurar la fuente de la matriz.")
    anterior = json.loads(SALIDA.read_text(encoding="utf-8"))
    base = f"https://docs.google.com/spreadsheets/d/{identificador}"
    ids = set(anterior["partidas"])
    consulta = int(datetime.now(timezone.utc).timestamp())
    try:
        html = descargar(f"{base}/htmlview/sheet?gid={GID}&single=true&headers=false&t={consulta}", 3_000_000)
        partidas = extraer_html(html, ids)
    except Exception:
        print("Se consultará la exportación XLSX de la misma matriz.")
        hoja = descargar(f"{base}/export?format=xlsx&gid={GID}&t={consulta}", 64_000_000)
        partidas = extraer(hoja, ids)
    cambio = partidas != anterior["partidas"]
    if not cambio and anterior.get("consultado"):
        print(f"Comprobadas {len(partidas)} partidas. El corte sigue vigente.")
        return
    fecha = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salida = {
        "actualizado": fecha if cambio else anterior["actualizado"],
        "consultado": fecha,
        "partidas": dict(sorted(partidas.items())),
    }
    SALIDA.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Renovado el corte de {len(partidas)} partidas.")


if __name__ == "__main__":
    try:
        actualizar()
    except Exception as error:
        # El mensaje de una excepción de red puede contener la URL privada.
        print(f"No se pudo renovar la lectura ({type(error).__name__}). Se conserva el último corte.", file=sys.stderr)
        sys.exit(1)
