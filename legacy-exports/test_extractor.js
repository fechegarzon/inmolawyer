#!/usr/bin/env node
/**
 * InmoLawyer - Script de prueba del extractor de datos
 * Prueba la lógica de extracción de contratos de arrendamiento
 */

// Contrato de ejemplo para probar
const contratoEjemplo = `
CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA

Entre los suscritos, de una parte WELCOME DISTRICT SAS, sociedad comercial identificada con NIT 900.893.694-7, 
representada legalmente por CARLOS ANDRÉS MEJÍA LÓPEZ, quien en adelante se denominará EL ARRENDADOR, 
y de otra parte NATALIA NALLINO CAMACHO, mayor de edad, identificada con cédula de ciudadanía No. 1.018.494.433 
de Bogotá, quien en adelante se denominará EL ARRENDATARIO, hemos convenido celebrar el presente contrato 
de arrendamiento que se regirá por las siguientes cláusulas:

PRIMERA - OBJETO: EL ARRENDADOR entrega a título de arrendamiento a EL ARRENDATARIO el inmueble ubicado en 
la CARRERA 7B No. 127A-33 APARTAMENTO 302, de la ciudad de Bogotá D.C.

SEGUNDA - CANON DE ARRENDAMIENTO: El canon mensual de arrendamiento es la suma de UN MILLÓN DOSCIENTOS MIL 
PESOS M/CTE ($1.200.000), pagaderos dentro de los primeros cinco (5) días de cada mes.

TERCERA - DURACIÓN: El término del presente contrato es de DOCE (12) MESES, contados a partir del 
15 de enero de 2024.

CUARTA - DEPÓSITO: EL ARRENDATARIO entregará como depósito de garantía la suma equivalente a dos (2) 
cánones de arrendamiento, es decir $2.400.000, los cuales serán devueltos al finalizar el contrato.

QUINTA - INCREMENTO: El canon de arrendamiento se incrementará anualmente en un 15% a partir de la 
fecha de renovación del contrato.

SEXTA - SERVICIOS PÚBLICOS: EL ARRENDATARIO se obliga al pago de los servicios públicos. En caso de 
mora superior a 30 días, EL ARRENDADOR podrá suspender el suministro de agua.

En constancia se firma en Bogotá D.C., a los 10 días del mes de enero de 2024.
`;

// ==================== FUNCIONES DE EXTRACCIÓN ====================

const limpiarTexto = (str) => str ? str.trim().replace(/\s+/g, ' ') : null;
const extraerNumero = (str) => str ? str.replace(/[^0-9]/g, '') : null;

const parsearMoneda = (str) => {
  if (!str) return null;
  const limpio = str.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(limpio) || null;
};

function extraerDatos(texto) {
  // ==================== ARRENDADOR ====================
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
    // Limpiar prefijos comunes
    let nombreSociedad = matchSociedad[1];
    nombreSociedad = nombreSociedad.replace(/^(?:de\s+una\s+parte|entre|por\s+una\s+parte)\s+/i, '');
    arrendadorNombre = limpiarTexto(nombreSociedad);
  }

  // ==================== ARRENDATARIO ====================
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
    
    // Buscar CC después del NIT (el segundo documento)
    const patronCC = /c[ée]dula\s*(?:de\s*ciudadan[ií]a)?\s*(?:No\.?)?\s*([\d.,]+)/gi;
    const matchesCC = [...texto.matchAll(patronCC)];
    if (matchesCC.length > 0) {
      arrendatarioDocumento = extraerNumero(matchesCC[0][1]);
    }
  }

  // ==================== CANON ====================
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

  // ==================== DIRECCIÓN ====================
  let direccionInmueble = null;
  let ciudad = null;

  // Buscar patrón más específico: CARRERA/CALLE + número + complemento
  const patronDireccion = /((?:CARRERA|CALLE|AVENIDA|DIAGONAL|TRANSVERSAL|CRA\.?|CL\.?|AV\.?)\s*[\dA-Z]+\s*(?:No\.?|#)?\s*[\dA-Za-z\-]+(?:\s*(?:APARTAMENTO|APTO\.?|APT\.?|CASA|LOCAL|OFICINA|PISO)\s*[\dA-Za-z\-]+)?)/i;
  const matchDir = texto.match(patronDireccion);
  if (matchDir) {
    direccionInmueble = limpiarTexto(matchDir[1]);
  }

  const patronCiudad = /(?:ciudad\s*de\s*)?(Bogot[áa]\s*D\.?C\.?|Medell[íi]n|Cali|Barranquilla|Cartagena|Bucaramanga|C[úu]cuta)/i;
  const matchCiudad = texto.match(patronCiudad);
  if (matchCiudad) {
    ciudad = limpiarTexto(matchCiudad[1]);
  }

  // ==================== FECHAS Y DURACIÓN ====================
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

  const patronDuracion = /(?:DOCE|SEIS|TRES)?\s*\(?(\d+)\)?\s*MESES?/i;
  const matchDuracion = texto.match(patronDuracion);
  if (matchDuracion) {
    duracionMeses = parseInt(matchDuracion[1]);
  }

  // ==================== DETECCIÓN DE CLÁUSULAS ABUSIVAS ====================
  const alertas = [];

  // Art. 16: Depósitos en dinero
  if (/dep[óo]sito\s*(de\s*)?garant[ií]a|entregar[áa]?\s*como\s*dep[óo]sito/i.test(texto)) {
    alertas.push({
      tipo: 'danger',
      titulo: 'Depósito en dinero detectado',
      descripcion: 'El contrato exige un depósito en dinero. Esto está PROHIBIDO por el Art. 16 de la Ley 820 de 2003. Solo se permiten garantías como pólizas de seguro, fianzas bancarias o fiadores.',
      referencia_legal: 'Art. 16 Ley 820 de 2003',
      es_clausula_abusiva: true
    });
  }

  // Art. 20: Incremento superior al IPC
  const patronIncremento = /incrementar[áa]?\s*(?:anualmente)?\s*(?:en\s*(?:un\s*)?)(\d+)\s*%/i;
  const matchIncremento = texto.match(patronIncremento);
  if (matchIncremento) {
    const porcentaje = parseInt(matchIncremento[1]);
    if (porcentaje > 13) { // IPC 2022 fue 13.12%, usar como referencia alta
      alertas.push({
        tipo: 'danger',
        titulo: `Incremento excesivo del ${porcentaje}%`,
        descripcion: `El contrato establece un incremento del ${porcentaje}%, lo cual probablemente excede el IPC del año anterior. El Art. 20 de la Ley 820 establece que el incremento NO puede superar el IPC.`,
        referencia_legal: 'Art. 20 Ley 820 de 2003',
        es_clausula_abusiva: true
      });
    }
  }

  // Corte de servicios como presión
  if (/suspender\s*(?:el\s*)?suministro|cortar?\s*(?:los\s*)?servicios/i.test(texto)) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Amenaza de corte de servicios',
      descripcion: 'El contrato menciona la posibilidad de suspender servicios públicos. Esta práctica puede ser considerada abusiva como medio de presión.',
      referencia_legal: 'Art. 16 Ley 820 de 2003',
      es_clausula_abusiva: false
    });
  }

  return {
    contrato_id: 'CTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    datos_extraidos: {
      arrendador: { nombre: arrendadorNombre, documento: arrendadorDocumento, tipoDoc: arrendadorTipoDoc },
      arrendatario: { nombre: arrendatarioNombre, documento: arrendatarioDocumento, tipoDoc: arrendatarioTipoDoc },
      canon_mensual: canonMensual,
      direccion_inmueble: direccionInmueble,
      ciudad: ciudad,
      fecha_inicio: fechaInicio,
      duracion_meses: duracionMeses
    },
    alertas: alertas,
    score_riesgo: alertas.filter(a => a.tipo === 'danger').length * 35 + alertas.filter(a => a.tipo === 'warning').length * 15
  };
}

// ==================== EJECUTAR PRUEBA ====================
console.log('\n' + '='.repeat(70));
console.log('🏠 INMOLAWYER - Prueba del Extractor de Contratos');
console.log('='.repeat(70) + '\n');

const resultado = extraerDatos(contratoEjemplo);

console.log('📋 DATOS EXTRAÍDOS:');
console.log('-'.repeat(50));
console.log(`   Contrato ID: ${resultado.contrato_id}`);
console.log('\n👤 ARRENDADOR:');
console.log(`   Nombre:    ${resultado.datos_extraidos.arrendador.nombre || 'No detectado'}`);
console.log(`   Documento: ${resultado.datos_extraidos.arrendador.documento || 'No detectado'}`);
console.log(`   Tipo:      ${resultado.datos_extraidos.arrendador.tipoDoc || 'No detectado'}`);

console.log('\n👤 ARRENDATARIO:');
console.log(`   Nombre:    ${resultado.datos_extraidos.arrendatario.nombre || 'No detectado'}`);
console.log(`   Documento: ${resultado.datos_extraidos.arrendatario.documento || 'No detectado'}`);
console.log(`   Tipo:      ${resultado.datos_extraidos.arrendatario.tipoDoc || 'No detectado'}`);

console.log('\n🏢 INMUEBLE:');
console.log(`   Dirección: ${resultado.datos_extraidos.direccion_inmueble || 'No detectado'}`);
console.log(`   Ciudad:    ${resultado.datos_extraidos.ciudad || 'No detectado'}`);

console.log('\n💰 CONDICIONES:');
console.log(`   Canon:     $${resultado.datos_extraidos.canon_mensual?.toLocaleString('es-CO') || 'No detectado'}`);
console.log(`   Inicio:    ${resultado.datos_extraidos.fecha_inicio || 'No detectado'}`);
console.log(`   Duración:  ${resultado.datos_extraidos.duracion_meses || 'No detectado'} meses`);

console.log('\n' + '='.repeat(70));
console.log(`⚠️  ALERTAS DETECTADAS (Score de Riesgo: ${resultado.score_riesgo}/100)`);
console.log('='.repeat(70));

if (resultado.alertas.length === 0) {
  console.log('   ✅ No se detectaron cláusulas problemáticas');
} else {
  resultado.alertas.forEach((alerta, i) => {
    const icono = alerta.tipo === 'danger' ? '🚨' : alerta.tipo === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`\n${icono} [${alerta.tipo.toUpperCase()}] ${alerta.titulo}`);
    console.log(`   ${alerta.descripcion}`);
    console.log(`   📖 Referencia: ${alerta.referencia_legal}`);
    if (alerta.es_clausula_abusiva) {
      console.log(`   ❌ ES CLÁUSULA ABUSIVA`);
    }
  });
}

console.log('\n' + '='.repeat(70));
console.log('✅ Prueba completada');
console.log('='.repeat(70) + '\n');
