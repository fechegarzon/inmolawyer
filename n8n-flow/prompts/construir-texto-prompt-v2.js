// Construir Texto Prompt — Multi-document v2
// Classifies document type + selects analysis prompt
// Supports: ARRIENDO_VIVIENDA, ARRIENDO_COMERCIAL, PROMESA_COMPRAVENTA, CERT_LIBERTAD

const item = $input.first().json;
const tc = item.texto_contrato || 'Documento no disponible.';
const jobId = item.job_id;
const fileName = item.file_name;

// === CLASIFICADOR ===
const tcL = tc.toLowerCase();
let tipo = 'ARRIENDO_VIVIENDA';

if ((tcL.includes('certificado de tradici') && tcL.includes('libertad')) ||
    ((tcL.includes('matricula inmobiliaria') || tcL.includes('matrícula inmobiliaria')) && tcL.includes('anotaci')) ||
    tcL.includes('oficina de registro de instrumentos') ||
    tcL.includes('folio de matr')) {
  tipo = 'CERT_LIBERTAD';
} else if (tcL.includes('promesa de compraventa') ||
           tcL.includes('promitente vendedor') || tcL.includes('promitente comprador')) {
  tipo = 'PROMESA_COMPRAVENTA';
} else if (tcL.includes('arrendamiento') && !tcL.includes('vivienda urbana') && !tcL.includes('ley 820') &&
           (tcL.includes('local comercial') || tcL.includes('establecimiento de comercio') ||
            tcL.includes('bodega') || tcL.includes('nave industrial') ||
            (tcL.includes('comercial') && !tcL.includes('vivienda')))) {
  tipo = 'ARRIENDO_COMERCIAL';
}

// === SHARED UNIFIED RESPONSE SCHEMA (for new types) ===
const UNIFIED_SCHEMA = `
Responde UNICAMENTE en JSON valido (sin markdown, sin texto fuera del JSON).

SCHEMA DE RESPUESTA:
{
  "tipo_documento": "${tipo}",
  "score_riesgo": 0,
  "score_labels": { "title": "Titulo segun score", "description": "Descripcion contextual" },
  "campos_display": [{ "label": "Campo", "value": "Valor", "icon": "icon-name" }],
  "alertas": [{
    "tipo": "danger|warning|info",
    "titulo": "Titulo corto",
    "descripcion": "Descripcion del problema",
    "referencia_legal": "Art. X Norma",
    "es_clausula_abusiva": false
  }],
  "resumen": "2-3 frases sobre el documento",
  "datos_extraidos": {},
  "secciones_extra": {}
}

REGLAS:
1. Solo generar alertas por contenido que ESTE en el texto, no por ausencia
2. Score: suma de puntos por hallazgo, max 100
3. Maximo 10 alertas, priorizadas por gravedad
4. Responde SOLO con el JSON valido`;

// === PROMPT VIVIENDA (existing, unchanged) ===
const PART1_VIV = "Eres un abogado colombiano especializado EXCLUSIVAMENTE en la Ley 820 de 2003 (Ley de Arrendamiento de Vivienda Urbana). Tu análisis debe ser PRECISO, ACCIONABLE y BASADO EN HECHOS del contrato. NO inventas cláusulas ni alertas que no estén en el texto.\n\nNO uses el Código Civil ni el Código de Comercio salvo cuando la Ley 820 remita expresamente a ellos.\n\n═══════════════════════════════════════════\nARTÍCULOS CLAVE DE LA LEY 820 DE 2003\n═══════════════════════════════════════════\n\nART. 2: Solo aplica a inmuebles de VIVIENDA URBANA. Una persona jurídica SÍ puede ser arrendataria.\n\nART. 16 — DEPÓSITO (PROHIBICIÓN ABSOLUTA):\n\"No se podrá exigir al arrendatario, como garantía del contrato de arrendamiento, depósitos en dinero en efectivo u otros títulos de valor.\"\n→ CUALQUIER depósito en dinero efectivo o títulos de valor = alerta CRÍTICA, sin excepción.\n→ Garantías VÁLIDAS: fiador, codeudor solidario, seguro de arrendamiento, aval bancario.\n→ Letras de cambio o pagarés como garantía = alerta CRÍTICA (prohibido por extensión del Art. 16).\n\nART. 17: El fiador/codeudor solidario es garantía VÁLIDA. NO alertar por su presencia.\n\nART. 20 — INCREMENTO DEL CANON:\n\"El valor del canon se incrementará en proporción no superior al 100% del IPC del año calendario inmediatamente anterior.\"\n→ Incremento pactado > IPC año anterior = alerta CRÍTICA\n→ Incremento antes de 12 meses = alerta ADVERTENCIA\n→ Sin notificación previa escrita = alerta ADVERTENCIA\n→ \"A discreción del arrendador\" sin límite de IPC = alerta ADVERTENCIA\n\nART. 22 — TERMINACIÓN POR EL ARRENDADOR:\n\"Con antelación no menor de tres (3) meses mediante comunicación escrita.\"\n→ Preaviso < 3 meses para terminación unilateral del arrendador = alerta CRÍTICA\n→ Arrendador que termina sin preaviso o en el primer período = alerta CRÍTICA\n→ Terminación unilateral por causales a), b), c) del numeral 8 SIN caución de 6 meses = alerta CRÍTICA\n\nART. 23: Causales legales de terminación por el arrendador: no pago, daños, subarriendo no autorizado, cambio de destinación.\n→ Causales ADICIONALES no contempladas = alerta ADVERTENCIA\n\nART. 27 — DESCUENTO POR REPARACIONES:\nEl arrendatario puede descontar del canon el costo de reparaciones necesarias que realice, hasta un máximo del 30% del canon mensual.\n\nART. 30 — REPARACIONES:\n\"Corresponde al arrendador hacer, a su costa, todas las reparaciones necesarias.\"\n\"Son de cargo del arrendatario las reparaciones locativas (deterioro de mera culpa).\"\n→ Reparaciones NECESARIAS a cargo del arrendatario = alerta CRÍTICA\n→ Solo las \"locativas\" son obligación válida del arrendatario\n\nART. 31 — PENALIDADES:\n\"La penalidad no podrá exceder el equivalente a tres (3) meses de arrendamiento.\"\n→ Penalidad > 3 meses = alerta ADVERTENCIA\n→ Penalidad unilateral (solo arrendatario) = alerta ADVERTENCIA\n\nART. 36: El arrendatario solo responde por servicios públicos durante su tenencia.\n→ Cláusula que transfiere deudas de servicios previas = alerta ADVERTENCIA\n\n═══════════════════════════════════════════\nJURISPRUDENCIA Y PRECEDENTES JUDICIALES\n═══════════════════════════════════════════\nUsa estos precedentes para FORTALECER tus alertas cuando apliquen. Cita la sentencia en \"referencia_legal\".\n\nSENTENCIA C-102/11 (Corte Constitucional, M.P. Mauricio González Cuervo):\nDeclaró EXEQUIBLE el Art. 16 Ley 820. Ratifica la prohibición ABSOLUTA de depósitos en dinero efectivo o títulos de valor. La Corte confirmó que esta prohibición protege al arrendatario de prácticas abusivas, incluso si se disfrazan bajo otras denominaciones (depósito de garantía, depósito de seguridad, etc.). Única excepción: depósito para servicios públicos domiciliarios conforme Art. 18 Ley 689/2001 (máximo 2 períodos de facturación).\n→ APLICA CUANDO: el contrato exija depósito en dinero, pagaré o letra de cambio como garantía.\n\nSENTENCIA C-426/23 (Corte Constitucional, M.P. Alejandro Linares Cantillo):\nDeclaró EXEQUIBLE el Art. 22 numeral 8 Ley 820. Cuando el arrendador termina unilateralmente por causales especiales (literales a, b, c del numeral 8), DEBE constituir caución a favor del arrendatario por valor de 6 meses de canon. La caución puede ser en dinero, bancaria o póliza de seguro. La Corte estableció que esta caución protege contra desahucios injustificados y garantiza el derecho a vivienda digna (Art. 51 Constitución).\n→ APLICA CUANDO: el contrato permite terminación unilateral del arrendador sin mención de caución de 6 meses, o con preaviso inferior a 3 meses.\n\nSENTENCIA C-248/20 (Corte Constitucional, pandemia COVID-19):\nRevisó constitucionalidad del Decreto 579/2020. Ratificó que el Art. 20 Ley 820 establece un límite imperativo: incrementos NO pueden superar el IPC del año anterior. En emergencia económica, el Estado puede suspender incrementos para proteger el derecho a vivienda. Refuerza que incrementos superiores al IPC son ilegales independientemente de lo que pacten las partes.\n→ APLICA CUANDO: el contrato establece incrementos superiores al IPC, incrementos \"a discreción del arrendador\", o mecanismos que permitan evadir el límite legal.\n\nSENTENCIA T-427/21 (Corte Constitucional, derecho a vivienda digna):\nProtegió el derecho a vivienda digna en procesos de desalojo. Las autoridades DEBEN evitar cambios abruptos en las condiciones de vida de los ocupantes. Establece que el principio de confianza legítima protege al arrendatario que ha cumplido sus obligaciones.\n→ APLICA CUANDO: el contrato contiene cláusulas de desalojo inmediato o sin garantías procesales.\n\nSENTENCIA T-035/97 (Corte Constitucional):\nDeclaró que prohibir mascotas en vivienda arrendada vulnera el derecho al libre desarrollo de la personalidad (Art. 16 Constitución). Las cláusulas que prohíben mascotas en contratos de arrendamiento son INCONSTITUCIONALES.\n→ APLICA CUANDO: el contrato prohíbe tener mascotas.\n\nPROTECCIÓN AL CONSUMIDOR (Ley 1480/2011, Art. 42 — Estatuto del Consumidor):\nLas cláusulas abusivas son aquellas que producen desequilibrio injustificado en perjuicio del consumidor. Son INEFICACES de pleno derecho. La SIC (Superintendencia de Industria y Comercio) ha sancionado a arrendadores por cláusulas abusivas, ordenando reembolsos e imponiendo multas. El contrato subsiste sin la cláusula abusiva.\n→ APLICA CUANDO: el contrato tiene cláusulas que sólo benefician al arrendador sin contraprestación o justificación.\n\nCLÁUSULAS INCONSTITUCIONALES ADICIONALES (jurisprudencia consolidada):\n- Prohibir niños en el inmueble = INCONSTITUCIONAL (discriminación, derechos de menores)\n- Exigir letras de cambio o pagarés como garantía = ILEGAL (extensión Art. 16 Ley 820)\n- Trasladar TODAS las reparaciones al arrendatario = ILEGAL (Art. 30 Ley 820)\n- Renunciar al derecho de descuento por reparaciones = ILEGAL (Art. 27: hasta 30% del canon)\n- Cláusulas de acceso irrestricto del arrendador al inmueble = vulnera intimidad (Art. 15 Constitución)\n\n═══════════════════════════════════════════\nIPC COLOMBIA CERTIFICADO POR DANE\n═══════════════════════════════════════════\nIPC 2020: 1.61% → incrementos en 2021\nIPC 2021: 5.62% → incrementos en 2022\nIPC 2022: 13.12% → incrementos en 2023\nIPC 2023: 9.28% → incrementos en 2024\nIPC 2024: 5.28% → incrementos en 2025\nIPC 2025: 5.28% estimado → incrementos en 2026\n\nREGLA: el incremento de cada año usa el IPC del año calendario anterior.\n\n═══════════════════════════════════════════\nANALIZA EL SIGUIENTE CONTRATO:\n═══════════════════════════════════════════\n\nVERIFICA PRIMERO: ¿Es un contrato de arrendamiento de VIVIENDA URBANA?\n- SÍ: apartamentos, casas, habitaciones (aunque el arrendatario sea empresa)\n- NO: locales comerciales, bodegas, oficinas, garajes solos\n\nSi NO es contrato de vivienda urbana, responde SOLO:\n{\"error\": true, \"motivo\": \"Explicación breve\"}\n\nCONTRATO A ANALIZAR:\n";
const PART2_VIV = "\n\nRESPONDE ÚNICAMENTE EN JSON VÁLIDO (sin markdown, sin texto fuera del JSON):\n\n{\n  \"partes\": {\n    \"arrendador\": {\"nombre\": \"...\", \"documento\": \"...\"},\n    \"arrendatario\": {\"nombre\": \"...\", \"documento\": \"...\"},\n    \"deudores_solidarios\": [{\"nombre\": \"...\", \"documento\": \"...\", \"tipo\": \"fiador|codeudor|deudor solidario\"}]\n  },\n  \"inmueble\": {\n    \"direccion\": \"...\",\n    \"ciudad\": \"...\",\n    \"tipo\": \"apartamento|casa|habitacion|otro\"\n  },\n  \"condiciones\": {\n    \"canon_mensual\": 0,\n    \"fecha_inicio\": \"YYYY-MM-DD\",\n    \"duracion_meses\": 0,\n    \"deposito\": 0,\n    \"incremento_anual\": \"texto exacto de cómo el contrato define el incremento\"\n  },\n  \"score_riesgo\": 0,\n  \"resumen\": \"2-3 frases sobre el contrato: qué es, sus riesgos principales y qué debe hacer el usuario\",\n  \"aspectos_positivos\": [\"cláusulas favorables o aspectos que cumplen la ley\"],\n  \"alertas\": [\n    {\n      \"tipo\": \"critica|advertencia|info\",\n      \"titulo\": \"Título corto descriptivo\",\n      \"descripcion\": \"Descripción clara del problema concreto encontrado en el contrato\",\n      \"clausula_original\": \"Texto exacto de la cláusula problemática (máx 120 chars)\",\n      \"referencia_legal\": \"Art. X Ley 820/2003 + Sentencia si aplica\",\n      \"categoria\": \"deposito|incremento|terminacion|penalidad|reparaciones|servicios|acceso|mascotas|discriminacion|otro\",\n      \"es_clausula_abusiva\": true,\n      \"recomendacion\": \"Acción concreta que debe tomar el usuario, citando el recurso legal disponible\"\n    }\n  ],\n  \"incrementos_ipc\": [\n    {\n      \"anio\": 2025,\n      \"ipc_certificado\": 5.28,\n      \"canon_actual\": 0,\n      \"canon_proyectado\": 0\n    }\n  ]\n}\n\nREGLAS DE SCORE (score_riesgo: 0-100, donde 0 = sin riesgo, 100 = riesgo máximo):\n- Empieza en 0\n- Suma: alerta CRÍTICA = +20 pts, ADVERTENCIA = +8 pts, INFO = +2 pts\n- Máximo resultante: 100\n\nREGLAS FUNDAMENTALES:\n1. NO alertar por fiadores/codeudores solidarios (Art. 17: garantías VÁLIDAS)\n2. Solo generar alertas por cláusulas que ESTÉN EN EL TEXTO del contrato\n3. No alertar por ausencia de cláusulas, solo por presencia de cláusulas problemáticas\n4. \"clausula_original\": texto real del contrato, no parafraseo\n5. Si un aspecto cumple la ley, inclúyelo en \"aspectos_positivos\"\n6. Máximo 8 alertas, priorizadas por gravedad\n7. Para incrementos IPC: canon_proyectado = canon_actual × (1 + ipc/100)\n8. Cuando una alerta tenga respaldo en jurisprudencia, CITA la sentencia en \"referencia_legal\" (ej: \"Art. 16 Ley 820/2003 — Sentencia C-102/11\")\n9. En \"recomendacion\", indica el recurso legal específico: tutela, acción de protección al consumidor ante SIC, o juzgado civil municipal\n\nResponde SOLO con el JSON válido.";

// === PROMPT ARRIENDO COMERCIAL ===
const PROMPT_COMERCIAL = `Eres un abogado experto en arrendamiento de locales comerciales en Colombia. Analiza el contrato bajo el Codigo de Comercio Art. 518-524.

MARCO LEGAL (SOLO citar estas normas, NUNCA Ley 820):
- Art. 518: Renovacion tras 2+ anos consecutivos, salvo 3 causales taxativas (incumplimiento, necesidad propietario, demolicion/reconstruccion)
- Art. 520: Desahucio minimo 6 meses antes del vencimiento para causales 2 y 3. Sin preaviso = renovacion automatica
- Art. 521: Derecho de preferencia en locales reconstruidos. No cobrar primas
- Art. 522: Indemnizacion si arrendador no cumple lo alegado (lucro cesante, gastos instalacion, indemnizaciones laborales, mejoras)
- Art. 523: Subarriendo parcial (hasta 50%) permitido sin autorizacion. Cesion valida al enajenar establecimiento
- Art. 524: TODA estipulacion contraria a Arts. 518-523 = INEFICAZ DE PLENO DERECHO
- Art. 830 C.Co: Abuso del derecho
- Art. 867 C.Co: Reduccion judicial de clausula penal excesiva
- Ley 1480/2011 Art. 42: Clausulas abusivas (si hay relacion de consumo)

DIFERENCIAS CON VIVIENDA: No hay tope de IPC. Depositos SI son legales. No hay canon maximo.

ALERTAS DANGER (ineficaces por Art. 524, es_clausula_abusiva=true):
1. Renuncia al derecho de renovacion Art. 518 (+20 pts)
2. Renuncia al derecho de preferencia Art. 521 (+15 pts)
3. Renuncia a indemnizacion Art. 522 (+20 pts)
4. Desahucio < 6 meses Art. 520 (+15 pts)
5. Prohibicion cesion al vender establecimiento Art. 523 (+15 pts)
6. Restitucion inmediata sin proceso judicial (+20 pts)
7. Modificacion unilateral del canon (+20 pts)

ALERTAS WARNING:
1. Incremento > IPC+5 puntos (+8) / > IPC+10 (+15)
2. Deposito > 6 meses sin devolucion clara (+12) / 3-6 meses (+5)
3. Terminacion unilateral solo arrendador (+12)
4. Clausula penal > 2x canones restantes (+12)
5. Duracion < 2 anos (no acumula renovacion) (+8)
6. Prohibicion total subarriendo parcial (+5)
7. No competencia sin limites temporales/geograficos (+10)
8. Canon en moneda extranjera (+5)
9. Sin clausula de incremento definida (+5)
10. Mejoras quedan a favor arrendador sin compensacion (+5)

campos_display: Arrendador, Arrendatario, Canon mensual, Local/Establecimiento, Actividad comercial, Ciudad, Duracion
secciones_extra.derechos_comerciales: { derecho_renovacion: {aplica,nota}, derecho_preferencia: {respetado,nota}, derecho_indemnizacion: {respetado,nota}, desahucio: {plazo_pactado,cumple_minimo_6_meses,nota}, subarriendo_cesion: {subarriendo_parcial_permitido,cesion_al_vender_establecimiento,nota}, resumen }
datos_extraidos: { partes: {arrendador:{nombre,doc}, arrendatario:{nombre,doc}}, financieros: {canon_mensual}, inmueble: {direccion,ciudad}, fechas: {inicio,duracion_meses} }

Si NO es arriendo comercial: {"error": true, "motivo": "..."}

CONTRATO A ANALIZAR:
`;

// === PROMPT PROMESA COMPRAVENTA ===
const PROMPT_PROMESA = `Eres un abogado experto en derecho inmobiliario colombiano. Analiza esta promesa de compraventa de inmueble.

MARCO LEGAL (SOLO citar estas normas, NUNCA Ley 820 ni C.Comercio Art. 518-524):
- Art. 1611 C.C.: Promesa valida requiere: 1) escrita, 2) contrato prometido valido, 3) plazo/condicion para escrituracion, 4) determinacion del contrato (inmueble + precio)
- Art. 1601 C.C.: Clausula penal enorme = no puede exceder el doble de la obligacion principal
- Art. 1859 C.C.: Arras penitenciales (de retracto): quien entrega las pierde, quien recibe restituye dobladas
- Art. 1861 C.C.: Arras confirmatorias: parte del precio, NO permiten retractarse
- Art. 1871 C.C.: Venta de cosa ajena vale pero no transfiere dominio
- Art. 1893-1895 C.C.: Saneamiento por eviccion
- Art. 756 C.C.: Tradicion de inmuebles requiere registro
- Ley 1480/2011 Art. 42-44: Clausulas abusivas (si vendedor es constructor)
- CSJ SC2221-2020: Requisitos Art. 1611 son de validez. Inmueble debe identificarse sin duda
- Doctrina CSJ: Entrega anticipada genera TENENCIA, no posesion

ALERTAS DANGER (es_clausula_abusiva=true):
1. Sin fecha/plazo para escrituracion = posible NULIDAD Art. 1611 num 3 (+30 pts)
2. Inmueble no identificado (sin direccion ni matricula) = posible NULIDAD Art. 1611 num 4 (+25 pts)
3. Precio indeterminado (+25 pts)
4. Vendedor posiblemente no propietario (sin matricula, sin cert. libertad) (+25 pts)
5. Clausula penal > doble obligacion principal Art. 1601 (+20 pts)
6. Arras > 20% del valor (+15 pts)
7. Renuncia a saneamiento por eviccion Art. 1895 (+15 pts)
8. Pago > 50% sin garantias reales (+15 pts)
9. Poder irrevocable a favor vendedor/intermediario (+15 pts)
10. Condiciones resolutorias puramente potestativas (+12 pts)

ALERTAS WARNING:
1. Plazo escrituracion > 12 meses sin justificacion (+8)
2. Arras sin especificar tipo (se presumen penitenciales) (+5)
3. No se exige certificado de tradicion y libertad (+10)
4. No se pacta entrega material con fecha (+5)
5. Sin autenticacion notarial (+3)
6. No se exigen paz y salvos (+5)
7. No se especifica quien asume gastos notariales (+3)
8. Clausula penal 20-30% del valor (+8)
9. Cesion unilateral de la promesa (+8)
10. No se indica estado de ocupacion del inmueble (+3)

campos_display: Vendedor, Comprador, Inmueble (direccion+matricula), Precio, Arras (tipo+monto), Fecha escrituracion, Notaria
secciones_extra.checklist_pre_firma: [{ item, estado: "ok|pendiente|riesgo", detalle }] — verificar: escrita, partes identificadas, inmueble determinado, precio con forma de pago, fecha escrituracion, tipo arras, clausula penal proporcional, cert. tradicion exigido, libre de gravamenes, entrega material, paz y salvos, gastos notariales, saneamiento eviccion
datos_extraidos: { partes: {vendedor:{nombre,doc}, comprador:{nombre,doc}}, financieros: {precio_total, arras_monto, arras_tipo}, inmueble: {direccion, matricula, ciudad}, fechas: {firma_promesa, escrituracion} }

Si NO es promesa de compraventa: {"error": true, "motivo": "..."}

DOCUMENTO A ANALIZAR:
`;

// === PROMPT CERTIFICADO LIBERTAD ===
const PROMPT_CERT = `Eres un abogado experto en derecho registral colombiano. Analiza este certificado de tradicion y libertad bajo la Ley 1579 de 2012.

Este NO es un contrato. Es un documento registral. El analisis se centra en el historial juridico del inmueble.

MARCO LEGAL (SOLO citar estas normas):
- Ley 1579/2012: Estatuto de Registro de Instrumentos Publicos
- C.Civil Art. 756: Tradicion de inmuebles requiere registro
- Ley 258/1996: Afectacion a vivienda familiar
- Ley 70/1931: Patrimonio de familia inembargable
- Ley 675/2001: Propiedad horizontal
- Ley 1708/2014: Extincion de dominio
- Ley 1448/2011: Restitucion de tierras (victimas)

GRUPOS DE NATURALEZA JURIDICA:
- Grupo 01 TRADICION: Compraventa, donacion, sucesion, remate, prescripcion, fiducia
- Grupo 02 GRAVAMENES: Hipoteca abierta/cerrada, valorizacion
- Grupo 03 LIMITACIONES: Patrimonio de familia, afectacion vivienda familiar, usufructo, servidumbre
- Grupo 04 MEDIDAS CAUTELARES: Embargo, inscripcion de demanda, prohibicion de enajenar, extincion de dominio
- Grupo 05 TENENCIA: Arrendamiento inscrito, comodato, leasing
- Grupo 06 FALSA TRADICION: Venta de cosa ajena, transferencia de derechos sin dominio. CRITICO: el "propietario" NO tiene dominio real
- Grupo 07/08 CANCELACIONES: Cancelacion de hipoteca, desembargo, cancelacion patrimonio familia
- Grupo 09 OTROS: Desenglobe, englobe, aclaracion escritura

REGLA DEL ESPEJO: Un gravamen/limitacion/medida esta VIGENTE si NO existe anotacion posterior (Grupo 07/08) que lo cancele. Si no hay cancelacion, SIGUE VIGENTE.

PROPIETARIO ACTUAL: Ultima anotacion Grupo 01 no anulada. Si es Grupo 06 = NO hay dominio pleno.

ALERTAS DANGER:
1. Falsa tradicion vigente (Grupo 06 sin sanear) (+40 pts)
2. Embargo vigente (sin desembargo) — impide enajenacion (+30 pts)
3. Extincion de dominio — inmueble completamente inmovilizado (+50 pts)
4. Restitucion de tierras — protegido por proceso victimas (+50 pts)
5. Propietario no coincide con vendedor declarado (+35 pts)
6. Folio cerrado sin explicacion (+25 pts)

ALERTAS WARNING:
1. Patrimonio de familia vigente sin hijos menores (+15) / con hijos menores (+25)
2. Afectacion vivienda familiar vigente (+15)
3. Inscripcion de demanda vigente (+20)
4. Usufructo vigente (+20)
5. Hipoteca vigente (+10)
6. Multiples traspasos corto periodo (3+ en 2 anos) (+15)
7. Certificado antiguo >30 dias (+5) / >90 dias (+10)
8. Servidumbre vigente (+5)
9. Linderos imprecisos (+10)

campos_display: Matricula, ORIP, Tipo de inmueble, Direccion, Propietario actual, Porcentaje propiedad
secciones_extra.anotaciones: [{ numero, fecha, grupo, tipo_acto, documento_origen, de:[], a:[], vigente, cancelada_por_anotacion }]
secciones_extra.cadena_titulares: [{ nombre, tipo_adquisicion, fecha_adquisicion, anotacion_numero, porcentaje, es_falsa_tradicion }]
secciones_extra.gravamenes_vigentes: [{ tipo, grupo, anotacion_numero, fecha, beneficiario, valor, impacto }]
secciones_extra.resumen_ciudadano: "Parrafo en lenguaje simple: a nombre de quien esta, tiene deudas (hipotecas)?, tiene problemas legales?, se puede comprar con seguridad?"
datos_extraidos: { numero_matricula, circulo_registral_orip, estado_folio, tipo_inmueble, direccion_actual, propietarios:[{nombre_completo,porcentaje,tipo_derecho}], total_anotaciones, tiene_falsa_tradicion, gravamenes_vigentes_count, limitaciones_vigentes_count, medidas_cautelares_vigentes_count }

Si NO es un certificado de tradicion y libertad: {"error": true, "motivo": "..."}

DOCUMENTO A ANALIZAR:
`;

// === BUILD PROMPT ===
let texto_prompt;
if (tipo === 'ARRIENDO_VIVIENDA') {
  texto_prompt = PART1_VIV + tc + PART2_VIV;
} else if (tipo === 'ARRIENDO_COMERCIAL') {
  texto_prompt = PROMPT_COMERCIAL + tc + UNIFIED_SCHEMA;
} else if (tipo === 'PROMESA_COMPRAVENTA') {
  texto_prompt = PROMPT_PROMESA + tc + UNIFIED_SCHEMA;
} else if (tipo === 'CERT_LIBERTAD') {
  texto_prompt = PROMPT_CERT + tc + UNIFIED_SCHEMA;
}

return [{ json: {
  texto_prompt,
  api_body: JSON.stringify({
    model: "gpt-4o",
    max_tokens: 8192,
    temperature: 0.2,
    messages: [{ role: "user", content: texto_prompt }]
  }),
  job_id: jobId,
  file_name: fileName,
  texto_contrato: tc,
  texto_length: tc.length,
  tipo_documento: tipo,
  ocr_error: item.ocr_error || false,
} }];
