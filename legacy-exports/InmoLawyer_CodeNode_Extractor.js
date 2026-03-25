/**
 * InmoLawyer - Code Node para n8n
 * Extractor de datos de contratos de arrendamiento colombianos
 * 
 * INSTRUCCIONES: Copia este código en el Code Node de n8n llamado "Extraer Datos del Contrato"
 */

// Extractor de datos de contratos de arrendamiento colombianos - v2.0 Mejorado
const texto = $input.first().json.body.texto || '';

// Función auxiliar para limpiar texto
const limpiarTexto = (str) => str ? str.trim().replace(/\s+/g, ' ') : null;

// Función para extraer números de documentos
const extraerNumero = (str) => str ? str.replace(/[^0-9]/g, '') : null;

// Función para parsear valores monetarios colombianos
const parsearMoneda = (str) => {
  if (!str) return null;
  const limpio = str.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(limpio) || null;
};

// ==================== EXTRACCIÓN DE ARRENDADOR ====================
let arrendadorNombre = null;
let arrendadorDocumento = null;
let arrendadorTipoDoc = null;

// Primero buscar NIT (más confiable para sociedades)
const patronNIT = /NIT[.:\s]*([\d.,\-]+)/i;
const matchNIT = texto.match(patronNIT);
if (matchNIT) {
  arrendadorDocumento = extraerNumero(matchNIT[1]);
  arrendadorTipoDoc = 'NIT';
}

// Buscar nombre de sociedad (SAS, SA, LTDA, etc.)
const patronSociedad = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:SAS|S\.A\.S\.?|SA|S\.A\.?|LTDA|LIMITADA))/i;
const matchSociedad = texto.match(patronSociedad);
if (matchSociedad) {
  let nombreSociedad = matchSociedad[1];
  nombreSociedad = nombreSociedad.replace(/^(?:de\s+una\s+parte|entre|por\s+una\s+parte)\s+/i, '');
  arrendadorNombre = limpiarTexto(nombreSociedad);
}

// ==================== EXTRACCIÓN DE ARRENDATARIO ====================
let arrendatarioNombre = null;
let arrendatarioDocumento = null;
let arrendatarioTipoDoc = 'C.C.';

// Buscar patrón: nombre seguido de cédula
const patronArrendatario1 = /(?:EL\s+)?ARRENDATARIO[,:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]+?),?\s*(?:mayor\s*de\s*edad)?[,\s]*(?:identificad[oa]\s*con\s*)?(?:c[ée]dula\s*(?:de\s*ciudadan[ií]a)?\s*(?:No\.?)?\s*|C\.?C\.?\s*(?:No\.?)?\s*)([\d.,]+)/i;
const matchArrendatario1 = texto.match(patronArrendatario1);

if (matchArrendatario1) {
  arrendatarioNombre = limpiarTexto(matchArrendatario1[1]);
  arrendatarioDocumento = extraerNumero(matchArrendatario1[2]);
} else {
  // Patrón alternativo: buscar "y de otra parte NOMBRE"
  const patronAlt = /(?:y\s*de\s*otra\s*parte|otra\s*parte)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]+?),?\s*(?:mayor|identificad)/i;
  const matchAlt = texto.match(patronAlt);
  if (matchAlt) {
    arrendatarioNombre = limpiarTexto(matchAlt[1]);
  }
  
  // Buscar CC
  const patronCC = /c[ée]dula\s*(?:de\s*ciudadan[ií]a)?\s*(?:No\.?)?\s*([\d.,]+)/gi;
  const matchesCC = [...texto.matchAll(patronCC)];
  if (matchesCC.length > 0) {
    arrendatarioDocumento = extraerNumero(matchesCC[0][1]);
  }
}

// ==================== EXTRACCIÓN DE CANON ====================
let canonMensual = null;

const patronesCanon = [
  /canon\s*(?:mensual\s*)?(?:de\s*)?(?:arrendamiento)?[^$\d]*\$?\s*([\d.,]+)/i,
  /\$\s*([\d.,]+)\s*\)?[,\s]*(?:pesos)?/i,
  /suma\s*de[^$\d]*\$?\s*([\d.,]+)/i
];

for (const patron of patronesCanon) {
  const matchCanon = texto.match(patron);
  if (matchCanon) {
    canonMensual = parsearMoneda(matchCanon[1]);
    if (canonMensual && canonMensual > 100000) break;
  }
}

// ==================== EXTRACCIÓN DE DIRECCIÓN ====================
let direccionInmueble = null;
let ciudad = null;

// Buscar patrón: CARRERA/CALLE + número + complemento
const patronDireccion = /((?:CARRERA|CALLE|AVENIDA|DIAGONAL|TRANSVERSAL|CRA\.?|CL\.?|AV\.?)\s*[\dA-Z]+\s*(?:No\.?|#)?\s*[\dA-Za-z\-]+(?:\s*(?:APARTAMENTO|APTO\.?|APT\.?|CASA|LOCAL|OFICINA|PISO)\s*[\dA-Za-z\-]+)?)/i;
const matchDir = texto.match(patronDireccion);
if (matchDir) {
  direccionInmueble = limpiarTexto(matchDir[1]);
}

const patronCiudad = /(?:ciudad\s*de\s*)?(Bogot[áa]\s*D\.?C\.?|Medell[íi]n|Cali|Barranquilla|Cartagena|Bucaramanga|C[úu]cuta|Pereira|Santa\s*Marta|Ibagu[ée]|Manizales|Villavicencio)/i;
const matchCiudad = texto.match(patronCiudad);
if (matchCiudad) {
  ciudad = limpiarTexto(matchCiudad[1]);
}

// ==================== EXTRACCIÓN DE FECHAS Y DURACIÓN ====================
let fechaInicio = null;
let duracionMeses = null;

const meses = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
  'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
  'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

const patronFecha = /(\d{1,2})\s*(?:de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(?:de|del)?\s*(\d{4})/i;
const matchFecha = texto.match(patronFecha);
if (matchFecha && meses[matchFecha[2].toLowerCase()]) {
  const dia = matchFecha[1].padStart(2, '0');
  const mes = meses[matchFecha[2].toLowerCase()];
  const anio = matchFecha[3];
  fechaInicio = `${anio}-${mes}-${dia}`;
}

const patronDuracion = /(?:DOCE|SEIS|TRES|VEINTICUATRO)?\s*\(?\s*(\d+)\s*\)?\s*MESES?/i;
const matchDuracion = texto.match(patronDuracion);
if (matchDuracion) {
  duracionMeses = parseInt(matchDuracion[1]);
}

// Si menciona "un año" sin número
if (!duracionMeses && /un\s*a[ñn]o/i.test(texto)) {
  duracionMeses = 12;
}

// ==================== GENERAR ID ÚNICO ====================
const contratoId = 'CTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

// ==================== RESULTADO ====================
return {
  json: {
    contrato_id: contratoId,
    texto_original: texto,
    datos_extraidos: {
      arrendador: {
        nombre: arrendadorNombre,
        documento: arrendadorDocumento,
        tipoDoc: arrendadorTipoDoc
      },
      arrendatario: {
        nombre: arrendatarioNombre,
        documento: arrendatarioDocumento,
        tipoDoc: arrendatarioTipoDoc
      },
      canon_mensual: canonMensual,
      direccion_inmueble: direccionInmueble,
      ciudad: ciudad,
      fecha_inicio: fechaInicio,
      duracion_meses: duracionMeses
    },
    extraccion_exitosa: !!(arrendadorNombre || arrendatarioNombre || canonMensual)
  }
};
