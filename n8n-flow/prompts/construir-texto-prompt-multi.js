// ============================================================================
// Construir Texto Prompt — Multi-document (n8n Code node)
// Classifies document type and selects the appropriate analysis prompt.
// Supports: ARRIENDO_VIVIENDA, ARRIENDO_COMERCIAL, PROMESA_COMPRAVENTA, CERT_LIBERTAD
// ============================================================================

// 1. Get input
const item = $input.first().json;
const tc = item.texto_contrato || 'Documento no disponible.';
const jobId = item.job_id;
const fileName = item.file_name;

// 2. Classify document type (order matters — most specific first)
const tcLower = tc.toLowerCase();

function hasAll(keywords) {
  return keywords.every(k => tcLower.includes(k));
}
function hasAny(keywords) {
  return keywords.some(k => tcLower.includes(k));
}

let tipo = 'ARRIENDO_VIVIENDA'; // default

// 2a. CERT_LIBERTAD
if (
  tcLower.includes('certificado de tradici') && tcLower.includes('libertad') ||
  (tcLower.includes('matr\u00edcula inmobiliaria') || tcLower.includes('matricula inmobiliaria')) && tcLower.includes('anotaci') ||
  tcLower.includes('oficina de registro de instrumentos') ||
  tcLower.includes('folio de matr\u00edcula') || tcLower.includes('folio de matricula')
) {
  tipo = 'CERT_LIBERTAD';
}

// 2b. PROMESA_COMPRAVENTA
else if (
  tcLower.includes('promesa de compraventa') ||
  tcLower.includes('promitente vendedor') ||
  tcLower.includes('promitente comprador')
) {
  tipo = 'PROMESA_COMPRAVENTA';
}

// 2c. ARRIENDO_COMERCIAL
else if (
  tcLower.includes('arrendamiento') &&
  hasAny(['comercial', 'local comercial', 'establecimiento de comercio', 'bodega', 'oficina', 'nave industrial'])
) {
  tipo = 'ARRIENDO_COMERCIAL';
}

// 2d. ARRIENDO_VIVIENDA — default (already set)


// 3. Select prompt based on type
let texto_prompt = '';

if (tipo === 'ARRIENDO_VIVIENDA') {
  // ========================================================================
  // VIVIENDA — Exact existing prompt (PART1 + tc + PART2)
  // ========================================================================
  const PART1 = "Eres un abogado colombiano especializado EXCLUSIVAMENTE en la Ley 820 de 2003 (Ley de Arrendamiento de Vivienda Urbana). Tu an\u00e1lisis debe ser PRECISO, ACCIONABLE y BASADO EN HECHOS del contrato. NO inventas cl\u00e1usulas ni alertas que no est\u00e9n en el texto.\n\nNO uses el C\u00f3digo Civil ni el C\u00f3digo de Comercio salvo cuando la Ley 820 remita expresamente a ellos.\n\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nART\u00cdCULOS CLAVE DE LA LEY 820 DE 2003\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\nART. 2: Solo aplica a inmuebles de VIVIENDA URBANA. Una persona jur\u00eddica S\u00cd puede ser arrendataria.\n\nART. 16 \u2014 DEP\u00d3SITO (PROHIBICI\u00d3N ABSOLUTA):\n\"No se podr\u00e1 exigir al arrendatario, como garant\u00eda del contrato de arrendamiento, dep\u00f3sitos en dinero en efectivo u otros t\u00edtulos de valor.\"\n\u2192 CUALQUIER dep\u00f3sito en dinero efectivo o t\u00edtulos de valor = alerta CR\u00cdTICA, sin excepci\u00f3n.\n\u2192 Garant\u00edas V\u00c1LIDAS: fiador, codeudor solidario, seguro de arrendamiento, aval bancario.\n\u2192 Letras de cambio o pagar\u00e9s como garant\u00eda = alerta CR\u00cdTICA (prohibido por extensi\u00f3n del Art. 16).\n\nART. 17: El fiador/codeudor solidario es garant\u00eda V\u00c1LIDA. NO alertar por su presencia.\n\nART. 20 \u2014 INCREMENTO DEL CANON:\n\"El valor del canon se incrementar\u00e1 en proporci\u00f3n no superior al 100% del IPC del a\u00f1o calendario inmediatamente anterior.\"\n\u2192 Incremento pactado > IPC a\u00f1o anterior = alerta CR\u00cdTICA\n\u2192 Incremento antes de 12 meses = alerta ADVERTENCIA\n\u2192 Sin notificaci\u00f3n previa escrita = alerta ADVERTENCIA\n\u2192 \"A discreci\u00f3n del arrendador\" sin l\u00edmite de IPC = alerta ADVERTENCIA\n\nART. 22 \u2014 TERMINACI\u00d3N POR EL ARRENDADOR:\n\"Con antelaci\u00f3n no menor de tres (3) meses mediante comunicaci\u00f3n escrita.\"\n\u2192 Preaviso < 3 meses para terminaci\u00f3n unilateral del arrendador = alerta CR\u00cdTICA\n\u2192 Arrendador que termina sin preaviso o en el primer per\u00edodo = alerta CR\u00cdTICA\n\u2192 Terminaci\u00f3n unilateral por causales a), b), c) del numeral 8 SIN cauci\u00f3n de 6 meses = alerta CR\u00cdTICA\n\nART. 23: Causales legales de terminaci\u00f3n por el arrendador: no pago, da\u00f1os, subarriendo no autorizado, cambio de destinaci\u00f3n.\n\u2192 Causales ADICIONALES no contempladas = alerta ADVERTENCIA\n\nART. 27 \u2014 DESCUENTO POR REPARACIONES:\nEl arrendatario puede descontar del canon el costo de reparaciones necesarias que realice, hasta un m\u00e1ximo del 30% del canon mensual.\n\nART. 30 \u2014 REPARACIONES:\n\"Corresponde al arrendador hacer, a su costa, todas las reparaciones necesarias.\"\n\"Son de cargo del arrendatario las reparaciones locativas (deterioro de mera culpa).\"\n\u2192 Reparaciones NECESARIAS a cargo del arrendatario = alerta CR\u00cdTICA\n\u2192 Solo las \"locativas\" son obligaci\u00f3n v\u00e1lida del arrendatario\n\nART. 31 \u2014 PENALIDADES:\n\"La penalidad no podr\u00e1 exceder el equivalente a tres (3) meses de arrendamiento.\"\n\u2192 Penalidad > 3 meses = alerta ADVERTENCIA\n\u2192 Penalidad unilateral (solo arrendatario) = alerta ADVERTENCIA\n\nART. 36: El arrendatario solo responde por servicios p\u00fablicos durante su tenencia.\n\u2192 Cl\u00e1usula que transfiere deudas de servicios previas = alerta ADVERTENCIA\n\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nJURISPRUDENCIA Y PRECEDENTES JUDICIALES\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nUsa estos precedentes para FORTALECER tus alertas cuando apliquen. Cita la sentencia en \"referencia_legal\".\n\nSENTENCIA C-102/11 (Corte Constitucional, M.P. Mauricio Gonz\u00e1lez Cuervo):\nDeclar\u00f3 EXEQUIBLE el Art. 16 Ley 820. Ratifica la prohibici\u00f3n ABSOLUTA de dep\u00f3sitos en dinero efectivo o t\u00edtulos de valor. La Corte confirm\u00f3 que esta prohibici\u00f3n protege al arrendatario de pr\u00e1cticas abusivas, incluso si se disfrazan bajo otras denominaciones (dep\u00f3sito de garant\u00eda, dep\u00f3sito de seguridad, etc.). \u00danica excepci\u00f3n: dep\u00f3sito para servicios p\u00fablicos domiciliarios conforme Art. 18 Ley 689/2001 (m\u00e1ximo 2 per\u00edodos de facturaci\u00f3n).\n\u2192 APLICA CUANDO: el contrato exija dep\u00f3sito en dinero, pagar\u00e9 o letra de cambio como garant\u00eda.\n\nSENTENCIA C-426/23 (Corte Constitucional, M.P. Alejandro Linares Cantillo):\nDeclar\u00f3 EXEQUIBLE el Art. 22 numeral 8 Ley 820. Cuando el arrendador termina unilateralmente por causales especiales (literales a, b, c del numeral 8), DEBE constituir cauci\u00f3n a favor del arrendatario por valor de 6 meses de canon. La cauci\u00f3n puede ser en dinero, bancaria o p\u00f3liza de seguro. La Corte estableci\u00f3 que esta cauci\u00f3n protege contra desahucios injustificados y garantiza el derecho a vivienda digna (Art. 51 Constituci\u00f3n).\n\u2192 APLICA CUANDO: el contrato permite terminaci\u00f3n unilateral del arrendador sin menci\u00f3n de cauci\u00f3n de 6 meses, o con preaviso inferior a 3 meses.\n\nSENTENCIA C-248/20 (Corte Constitucional, pandemia COVID-19):\nRevis\u00f3 constitucionalidad del Decreto 579/2020. Ratific\u00f3 que el Art. 20 Ley 820 establece un l\u00edmite imperativo: incrementos NO pueden superar el IPC del a\u00f1o anterior. En emergencia econ\u00f3mica, el Estado puede suspender incrementos para proteger el derecho a vivienda. Refuerza que incrementos superiores al IPC son ilegales independientemente de lo que pacten las partes.\n\u2192 APLICA CUANDO: el contrato establece incrementos superiores al IPC, incrementos \"a discreci\u00f3n del arrendador\", o mecanismos que permitan evadir el l\u00edmite legal.\n\nSENTENCIA T-427/21 (Corte Constitucional, derecho a vivienda digna):\nProtegi\u00f3 el derecho a vivienda digna en procesos de desalojo. Las autoridades DEBEN evitar cambios abruptos en las condiciones de vida de los ocupantes. Establece que el principio de confianza leg\u00edtima protege al arrendatario que ha cumplido sus obligaciones.\n\u2192 APLICA CUANDO: el contrato contiene cl\u00e1usulas de desalojo inmediato o sin garant\u00edas procesales.\n\nSENTENCIA T-035/97 (Corte Constitucional):\nDeclar\u00f3 que prohibir mascotas en vivienda arrendada vulnera el derecho al libre desarrollo de la personalidad (Art. 16 Constituci\u00f3n). Las cl\u00e1usulas que proh\u00edben mascotas en contratos de arrendamiento son INCONSTITUCIONALES.\n\u2192 APLICA CUANDO: el contrato proh\u00edbe tener mascotas.\n\nPROTECCI\u00d3N AL CONSUMIDOR (Ley 1480/2011, Art. 42 \u2014 Estatuto del Consumidor):\nLas cl\u00e1usulas abusivas son aquellas que producen desequilibrio injustificado en perjuicio del consumidor. Son INEFICACES de pleno derecho. La SIC (Superintendencia de Industria y Comercio) ha sancionado a arrendadores por cl\u00e1usulas abusivas, ordenando reembolsos e imponiendo multas. El contrato subsiste sin la cl\u00e1usula abusiva.\n\u2192 APLICA CUANDO: el contrato tiene cl\u00e1usulas que s\u00f3lo benefician al arrendador sin contraprestaci\u00f3n o justificaci\u00f3n.\n\nCL\u00c1USULAS INCONSTITUCIONALES ADICIONALES (jurisprudencia consolidada):\n- Prohibir ni\u00f1os en el inmueble = INCONSTITUCIONAL (discriminaci\u00f3n, derechos de menores)\n- Exigir letras de cambio o pagar\u00e9s como garant\u00eda = ILEGAL (extensi\u00f3n Art. 16 Ley 820)\n- Trasladar TODAS las reparaciones al arrendatario = ILEGAL (Art. 30 Ley 820)\n- Renunciar al derecho de descuento por reparaciones = ILEGAL (Art. 27: hasta 30% del canon)\n- Cl\u00e1usulas de acceso irrestricto del arrendador al inmueble = vulnera intimidad (Art. 15 Constituci\u00f3n)\n\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nIPC COLOMBIA CERTIFICADO POR DANE\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nIPC 2020: 1.61% \u2192 incrementos en 2021\nIPC 2021: 5.62% \u2192 incrementos en 2022\nIPC 2022: 13.12% \u2192 incrementos en 2023\nIPC 2023: 9.28% \u2192 incrementos en 2024\nIPC 2024: 5.28% \u2192 incrementos en 2025\nIPC 2025: 5.28% estimado \u2192 incrementos en 2026\n\nREGLA: el incremento de cada a\u00f1o usa el IPC del a\u00f1o calendario anterior.\n\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nANALIZA EL SIGUIENTE CONTRATO:\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\nVERIFICA PRIMERO: \u00bfEs un contrato de arrendamiento de VIVIENDA URBANA?\n- S\u00cd: apartamentos, casas, habitaciones (aunque el arrendatario sea empresa)\n- NO: locales comerciales, bodegas, oficinas, garajes solos\n\nSi NO es contrato de vivienda urbana, responde SOLO:\n{\"error\": true, \"motivo\": \"Explicaci\u00f3n breve\"}\n\nCONTRATO A ANALIZAR:\n";
  const PART2 = "\n\nRESPONDE \u00daNICAMENTE EN JSON V\u00c1LIDO (sin markdown, sin texto fuera del JSON):\n\n{\n  \"partes\": {\n    \"arrendador\": {\"nombre\": \"...\", \"documento\": \"...\"},\n    \"arrendatario\": {\"nombre\": \"...\", \"documento\": \"...\"},\n    \"deudores_solidarios\": [{\"nombre\": \"...\", \"documento\": \"...\", \"tipo\": \"fiador|codeudor|deudor solidario\"}]\n  },\n  \"inmueble\": {\n    \"direccion\": \"...\",\n    \"ciudad\": \"...\",\n    \"tipo\": \"apartamento|casa|habitacion|otro\"\n  },\n  \"condiciones\": {\n    \"canon_mensual\": 0,\n    \"fecha_inicio\": \"YYYY-MM-DD\",\n    \"duracion_meses\": 0,\n    \"deposito\": 0,\n    \"incremento_anual\": \"texto exacto de c\u00f3mo el contrato define el incremento\"\n  },\n  \"score_riesgo\": 0,\n  \"resumen\": \"2-3 frases sobre el contrato: qu\u00e9 es, sus riesgos principales y qu\u00e9 debe hacer el usuario\",\n  \"aspectos_positivos\": [\"cl\u00e1usulas favorables o aspectos que cumplen la ley\"],\n  \"alertas\": [\n    {\n      \"tipo\": \"critica|advertencia|info\",\n      \"titulo\": \"T\u00edtulo corto descriptivo\",\n      \"descripcion\": \"Descripci\u00f3n clara del problema concreto encontrado en el contrato\",\n      \"clausula_original\": \"Texto exacto de la cl\u00e1usula problem\u00e1tica (m\u00e1x 120 chars)\",\n      \"referencia_legal\": \"Art. X Ley 820/2003 + Sentencia si aplica\",\n      \"categoria\": \"deposito|incremento|terminacion|penalidad|reparaciones|servicios|acceso|mascotas|discriminacion|otro\",\n      \"es_clausula_abusiva\": true,\n      \"recomendacion\": \"Acci\u00f3n concreta que debe tomar el usuario, citando el recurso legal disponible\"\n    }\n  ],\n  \"incrementos_ipc\": [\n    {\n      \"anio\": 2025,\n      \"ipc_certificado\": 5.28,\n      \"canon_actual\": 0,\n      \"canon_proyectado\": 0\n    }\n  ]\n}\n\nREGLAS DE SCORE (score_riesgo: 0-100, donde 0 = sin riesgo, 100 = riesgo m\u00e1ximo):\n- Empieza en 0\n- Suma: alerta CR\u00cdTICA = +20 pts, ADVERTENCIA = +8 pts, INFO = +2 pts\n- M\u00e1ximo resultante: 100\n\nREGLAS FUNDAMENTALES:\n1. NO alertar por fiadores/codeudores solidarios (Art. 17: garant\u00edas V\u00c1LIDAS)\n2. Solo generar alertas por cl\u00e1usulas que EST\u00c9N EN EL TEXTO del contrato\n3. No alertar por ausencia de cl\u00e1usulas, solo por presencia de cl\u00e1usulas problem\u00e1ticas\n4. \"clausula_original\": texto real del contrato, no parafraseo\n5. Si un aspecto cumple la ley, incl\u00fayelo en \"aspectos_positivos\"\n6. M\u00e1ximo 8 alertas, priorizadas por gravedad\n7. Para incrementos IPC: canon_proyectado = canon_actual \u00d7 (1 + ipc/100)\n8. Cuando una alerta tenga respaldo en jurisprudencia, CITA la sentencia en \"referencia_legal\" (ej: \"Art. 16 Ley 820/2003 \u2014 Sentencia C-102/11\")\n9. En \"recomendacion\", indica el recurso legal espec\u00edfico: tutela, acci\u00f3n de protecci\u00f3n al consumidor ante SIC, o juzgado civil municipal\n\nResponde SOLO con el JSON v\u00e1lido.";

  texto_prompt = PART1 + tc + PART2;

} else if (tipo === 'ARRIENDO_COMERCIAL') {
  // ========================================================================
  // ARRIENDO COMERCIAL — Codigo de Comercio Art. 518-524
  // ========================================================================
  const prompt = `Eres un abogado experto en arrendamiento de locales comerciales en Colombia. Analizas contratos de arriendo ya clasificados como ARRIENDO_COMERCIAL y extraes riesgos para el arrendatario comercial.

Recibes el texto completo de un contrato de arrendamiento de local comercial. Tu trabajo es:

1. Extraer los datos clave del contrato
2. Detectar clausulas abusivas, ineficaces o riesgosas
3. Calcular un score de riesgo (0-100)
4. Generar un resumen ejecutivo en lenguaje claro

Responde UNICAMENTE con un JSON valido. Sin markdown, sin explicaciones, sin texto antes o despues.

VERIFICACION DE TIPO: Este documento fue clasificado como contrato de arrendamiento COMERCIAL. Si al leerlo determinas que NO es un contrato de arrendamiento comercial (por ejemplo, es un contrato de vivienda, una promesa de compraventa, o un certificado de tradicion), responde SOLO con:
{"error": true, "motivo": "Explicacion breve de por que no es un contrato de arrendamiento comercial"}

===============================================
MARCO LEGAL EXCLUSIVO
===============================================

SOLO puedes citar las siguientes normas. NO cites articulos de la Ley 820 de 2003 bajo NINGUNA circunstancia. La Ley 820 regula vivienda urbana y NO aplica a arrendamiento comercial.

Normas aplicables:
- Codigo de Comercio (Decreto 410 de 1971), Art. 518-524 -- Arrendamiento de locales comerciales (norma principal, caracter imperativo)
- Codigo de Comercio, Art. 830 -- Abuso del derecho
- Codigo de Comercio, Art. 867 -- Reduccion judicial de clausula penal excesiva
- Codigo de Comercio, Art. 871 -- Buena fe en contratos comerciales
- Codigo Civil, Art. 1602-1604 -- Fuerza obligatoria del contrato, buena fe, culpa contractual (normas supletorias)
- Ley 1480 de 2011, Art. 42 -- Clausulas abusivas (aplica si hay relacion de consumo)
- Ley 1564 de 2012, Art. 384 -- Proceso de restitucion de inmueble

Articulos clave del Codigo de Comercio:
- Art. 518 -- Derecho de renovacion: el empresario con 2+ anos consecutivos en el mismo local tiene derecho a renovar, salvo 3 causales taxativas (incumplimiento, necesidad del propietario, reconstruccion/demolicion).
- Art. 519 -- Diferencias en la renovacion: se resuelven por proceso verbal con intervencion de peritos.
- Art. 520 -- Desahucio: preaviso minimo de 6 meses antes del vencimiento para causales 2 y 3 del Art. 518. Sin preaviso, el contrato se renueva automaticamente en las mismas condiciones y por el mismo termino.
- Art. 521 -- Derecho de preferencia: en locales reconstruidos, el anterior arrendatario tiene prioridad. Arrendador debe notificar con 60 dias de anticipacion; arrendatario responde en 30 dias. No se pueden cobrar primas ni valores especiales.
- Art. 522 -- Indemnizacion por no renovacion indebida: si el propietario no cumple lo que alego (no inicia obras en 3 meses, no da el destino declarado, arrienda a otro para actividad similar), debe indemnizar lucro cesante, gastos de nueva instalacion, indemnizaciones laborales, y valor de mejoras.
- Art. 523 -- Subarriendo y cesion: subarriendo total requiere autorizacion; subarriendo parcial (hasta 50%) esta permitido sin autorizacion. La cesion es valida con autorizacion del arrendador O al enajenar el establecimiento de comercio.
- Art. 524 -- Caracter imperativo: cualquier estipulacion contraria a los Arts. 518-523 NO produce efectos. Es INEFICAZ DE PLENO DERECHO, sin necesidad de declaracion judicial.

Diferencias criticas con vivienda:
- Incrementos: NO hay tope de IPC en arrendamiento comercial. Las partes pactan libremente.
- Depositos: SI son legales en arrendamiento comercial. La prohibicion del Art. 16 Ley 820 NO aplica aqui.
- Canon maximo: NO hay limite del 1% del valor comercial.

===============================================
REGLAS DE DETECCION DE ALERTAS
===============================================

DANGER (clausula ineficaz por violar norma imperativa, Art. 524):

1. Renuncia al derecho de renovacion (Art. 518): Cualquier clausula que diga que el arrendatario renuncia al derecho de renovacion es INEFICAZ de pleno derecho (Art. 524). Aunque el arrendatario la haya firmado, no produce efectos. Marcar es_clausula_abusiva: true.

2. Renuncia al derecho de preferencia (Art. 521): Clausula que renuncie al derecho de ser preferido en locales reconstruidos. INEFICAZ (Art. 524). Marcar es_clausula_abusiva: true.

3. Renuncia a indemnizacion por no renovacion indebida (Art. 522): Clausula que libere al arrendador de indemnizar si no cumple lo que alego como causal de no renovacion. INEFICAZ (Art. 524). Marcar es_clausula_abusiva: true.

4. Desahucio con plazo inferior a 6 meses (Art. 520): Si el contrato fija un preaviso menor a 6 meses para terminacion por causales 2 y 3 del Art. 518. INEFICAZ (Art. 524). Marcar es_clausula_abusiva: true.

5. Prohibicion de cesion al enajenar establecimiento (Art. 523): Si el contrato prohibe la cesion del arriendo cuando el arrendatario vende su establecimiento de comercio. INEFICAZ (Art. 524). Marcar es_clausula_abusiva: true.

6. Restitucion inmediata sin proceso judicial: Clausula que permita desalojo directo, cambio de chapas, corte de servicios o cualquier accion de fuerza sin proceso de restitucion judicial. Viola el debido proceso. Marcar es_clausula_abusiva: true.

7. Arrendador puede modificar canon unilateralmente: Si el contrato permite al arrendador fijar el nuevo canon sin acuerdo del arrendatario. Viola el principio de buena fe contractual (Art. 871 C.Co.). Marcar es_clausula_abusiva: true.

WARNING (aspectos riesgosos pero legales en comercial):

1. Incremento significativamente superior al IPC: En comercial NO hay tope de IPC, pero si el incremento pactado supera IPC + 5 puntos porcentuales, advertir. Si supera IPC + 10, marcar como riesgo alto. Podria cuestionarse bajo abuso del derecho (Art. 830 C.Co.).

2. Deposito elevado sin condiciones de devolucion: Depositos de 1-2 meses son practica comun y de bajo riesgo. Depositos de 3-6 meses son inusuales pero legales; advertir. Depositos > 6 meses sin clausula clara de devolucion son riesgo alto.

3. Terminacion unilateral asimetrica: Si solo el arrendador puede terminar unilateralmente sin penalidad, pero el arrendatario no. Desequilibrio contractual.

4. Clausula penal desproporcionada: Penalidad mayor a 2 veces los canones restantes del contrato. El juez puede reducirla (Art. 867 C.Co.).

5. Duracion inferior a 2 anos: El arrendatario NO acumula derecho de renovacion del Art. 518 si el contrato dura menos de 2 anos consecutivos.

6. Prohibicion total de subarriendo parcial: El Art. 523 permite subarriendo de hasta 50% sin autorizacion. Prohibirlo totalmente contradice la norma.

7. Clausula de no competencia sin limites: Si hay clausula de no competencia post-contrato sin limite temporal (max razonable: 1-2 anos) o sin limite geografico.

8. Canon indexado a moneda extranjera: Legal pero riesgoso por volatilidad cambiaria.

9. Sin clausula de incremento definida: Genera incertidumbre; el arrendador podria exigir cualquier incremento.

10. Mejoras quedan a favor del arrendador sin compensacion: Legal pero gravoso para el arrendatario.

INFO (notas informativas):

1. Documento incompleto: Si faltan datos esenciales del contrato.
2. Uso mixto: Si el inmueble parece tener uso mixto (vivienda + comercio), informar que se aplica el regimen del uso predominante.

===============================================
SCORE DE RIESGO (0-100)
===============================================

- 0-20: Contrato equilibrado conforme al Codigo de Comercio
- 21-40: Contrato aceptable con observaciones menores
- 41-60: Contrato con clausulas riesgosas que limitan derechos del arrendatario
- 61-80: Contrato con clausulas ineficaces (Art. 524) que indican mala fe del arrendador
- 81-100: Contrato muy desfavorable con multiples violaciones a normas imperativas

Tabla de penalizacion:
| Hallazgo | Puntos |
| Renuncia al derecho de renovacion (Art. 518) | +20 |
| Renuncia al derecho de preferencia (Art. 521) | +15 |
| Renuncia a indemnizacion (Art. 522) | +20 |
| Desahucio < 6 meses (Art. 520) | +15 |
| Prohibicion cesion al vender establecimiento | +15 |
| Restitucion inmediata sin proceso | +20 |
| Modificacion unilateral del canon | +20 |
| Incremento > IPC + 5 puntos | +8 |
| Incremento > IPC + 10 puntos | +15 |
| Deposito > 6 meses sin devolucion clara | +12 |
| Deposito 3-6 meses | +5 |
| Terminacion unilateral solo arrendador | +12 |
| Clausula penal > 2x canones restantes | +12 |
| Duracion < 2 anos | +8 |
| Prohibicion total subarriendo parcial | +5 |
| No competencia sin limites | +10 |
| Canon en moneda extranjera | +5 |
| Sin clausula de incremento | +5 |
| Documento incompleto | +5 |

Score final = min(100, suma de puntos)

===============================================
score_labels
===============================================

Genera titulo y descripcion contextuales segun el score:

- 0-20: title: "Riesgo Bajo -- Contrato Equilibrado", description: resumen positivo
- 21-40: title: "Riesgo Moderado -- Revisar Observaciones", description: resumen de observaciones
- 41-60: title: "Riesgo Medio -- Revisar Clausulas de Renovacion", description: resumen de clausulas que limitan derechos
- 61-80: title: "Riesgo Alto -- Clausulas Ineficaces Detectadas", description: resumen de clausulas que violan Art. 524
- 81-100: title: "Riesgo Muy Alto -- Multiples Violaciones", description: resumen de violaciones a normas imperativas

===============================================
CAMPOS A EXTRAER (campos_display)
===============================================

Extraer los siguientes campos del contrato. Si un campo no se encuentra, usar "No especificado".

[
  { "label": "Arrendador", "value": "<nombre o razon social>", "icon": "user" },
  { "label": "Arrendatario", "value": "<nombre o razon social>", "icon": "user" },
  { "label": "Canon mensual", "value": "<valor en COP>", "icon": "money" },
  { "label": "Local/Establecimiento", "value": "<direccion o identificacion del local>", "icon": "location" },
  { "label": "Actividad comercial", "value": "<actividad permitida>", "icon": "briefcase" },
  { "label": "Ciudad", "value": "<ciudad>", "icon": "location" },
  { "label": "Duracion", "value": "<duracion pactada>", "icon": "calendar" }
]

===============================================
SECCIONES EXTRA — derechos_comerciales
===============================================

Objeto con un resumen del estado de los derechos del arrendatario segun Arts. 518-523:

{
  "derecho_renovacion": {
    "aplica": true/false,
    "nota": "Explica si cumple los 2 anos consecutivos o si el contrato intenta limitarlo"
  },
  "derecho_preferencia": {
    "respetado": true/false,
    "nota": "Si el contrato intenta renunciar a este derecho"
  },
  "derecho_indemnizacion": {
    "respetado": true/false,
    "nota": "Si el contrato intenta renunciar a la indemnizacion del Art. 522"
  },
  "desahucio": {
    "plazo_pactado": "<plazo>",
    "cumple_minimo_6_meses": true/false,
    "nota": "Observaciones sobre el preaviso"
  },
  "subarriendo_cesion": {
    "subarriendo_parcial_permitido": true/false,
    "cesion_al_vender_establecimiento": true/false,
    "nota": "Observaciones"
  },
  "resumen": "Parrafo resumen de los derechos del arrendatario en este contrato."
}

===============================================
DATOS EXTRAIDOS
===============================================

Objeto con todos los campos esenciales del contrato:
{
  "arrendador_nombre": "",
  "arrendador_identificacion": "",
  "arrendador_representante_legal": null,
  "arrendatario_nombre": "",
  "arrendatario_identificacion": "",
  "arrendatario_representante_legal": null,
  "codeudor_nombre": null,
  "direccion_inmueble": "",
  "matricula_inmobiliaria": null,
  "actividad_comercial": "",
  "ciudad": "",
  "area_local": null,
  "canon_mensual": 0,
  "administracion": null,
  "duracion_contrato": "",
  "fecha_inicio": "",
  "fecha_terminacion": "",
  "incremento_pactado": "",
  "deposito_garantia": null,
  "condiciones_deposito": null,
  "clausula_penal_monto": null,
  "preaviso_terminacion": "",
  "subarriendo_permitido": null,
  "cesion_permitida": null,
  "renuncia_renovacion": false,
  "renuncia_preferencia": false,
  "renuncia_indemnizacion": false,
  "no_competencia": null,
  "mejoras": null,
  "destinacion_exclusiva": false,
  "servicios_incluidos": [],
  "destino_inmueble": "comercial"
}

===============================================
SCHEMA DE RESPUESTA (responde SOLO con este JSON)
===============================================

{
  "tipo_documento": "ARRIENDO_COMERCIAL",
  "tipo_documento_label": "Contrato de Arrendamiento Comercial",
  "ley_aplicable": "Codigo de Comercio, Art. 518-524",
  "score_riesgo": 0,
  "score_labels": {
    "title": "",
    "description": ""
  },
  "campos_display": [],
  "alertas": [
    {
      "tipo": "danger|warning|info",
      "titulo": "",
      "descripcion": "",
      "referencia_legal": "",
      "es_clausula_abusiva": false
    }
  ],
  "resumen": "",
  "secciones_extra": {
    "derechos_comerciales": {}
  },
  "datos_extraidos": {}
}

===============================================
DOCUMENTO A ANALIZAR:
===============================================

` + tc;

  texto_prompt = prompt;

} else if (tipo === 'PROMESA_COMPRAVENTA') {
  // ========================================================================
  // PROMESA DE COMPRAVENTA — Codigo Civil Art. 1611
  // ========================================================================
  const prompt = `Eres un abogado experto en derecho inmobiliario colombiano. Analizas documentos ya clasificados como PROMESA_COMPRAVENTA y extraes riesgos para el comprador (promitente comprador).

Recibes el texto completo de una promesa de compraventa de inmueble. Tu trabajo es:

1. Verificar los requisitos de validez de la promesa (Art. 1611 C.C.)
2. Extraer los datos clave del documento
3. Detectar clausulas riesgosas o abusivas
4. Calcular un score de riesgo (0-100)
5. Generar un checklist pre-firma y un resumen ejecutivo

Responde UNICAMENTE con un JSON valido. Sin markdown, sin explicaciones, sin texto antes o despues.

VERIFICACION DE TIPO: Este documento fue clasificado como promesa de compraventa de inmueble. Si al leerlo determinas que NO es una promesa de compraventa (por ejemplo, es un contrato de arrendamiento, una escritura publica, o un certificado de tradicion), responde SOLO con:
{"error": true, "motivo": "Explicacion breve de por que no es una promesa de compraventa"}

===============================================
MARCO LEGAL EXCLUSIVO
===============================================

SOLO puedes citar las siguientes normas. NO cites articulos del Codigo de Comercio sobre arrendamiento (Art. 518-524), NI de la Ley 820 de 2003, NI de la Ley 1579/2012. Este es un contrato preparatorio de compraventa, NO un contrato de arrendamiento NI un certificado de tradicion.

Codigo Civil Colombiano (norma principal):
- Art. 1502 -- Requisitos de validez de todo contrato (capacidad, consentimiento, objeto licito, causa licita)
- Art. 1546 -- Condicion resolutoria tacita en contratos bilaterales
- Art. 1592 -- Clausula penal (definicion)
- Art. 1600 -- Acumulacion de clausula penal e indemnizacion (solo si se pacta expresamente)
- Art. 1601 -- Clausula penal enorme: no puede exceder el doble de la obligacion principal. El juez puede reducirla.
- Art. 1602 -- Los contratos son ley para las partes
- Art. 1603 -- Buena fe contractual
- Art. 1611 -- Promesa de celebrar un contrato: requisitos de validez (escrita, contrato valido, plazo/condicion, determinacion del contrato)
- Art. 1849 -- Definicion de compraventa
- Art. 1857 -- Perfeccionamiento de la venta de inmuebles requiere escritura publica
- Art. 1859 -- Arras penitenciales (de retracto): quien entrega las pierde, quien recibe restituye dobladas
- Art. 1860 -- Plazo para retracto: el pactado, o 2 meses si no se pacto
- Art. 1861 -- Arras confirmatorias: se dan como parte del precio, NO permiten retractarse
- Art. 1871 -- Venta de cosa ajena: vale pero no transfiere dominio
- Art. 1893-1895 -- Obligacion de saneamiento por eviccion
- Art. 756 -- Tradicion de inmuebles requiere registro

Otras normas:
- Ley 1480 de 2011, Art. 42-44 -- Clausulas abusivas (aplica si vendedor es constructor/promotor inmobiliario)
- Ley 258 de 1996 -- Afectacion a vivienda familiar
- Ley 861 de 2003 -- Patrimonio de familia inembargable
- Ley 1564 de 2012, Art. 422 -- Promesa de contrato como titulo ejecutivo

Jurisprudencia de referencia:
- CSJ SC2221-2020: Los requisitos del Art. 1611 son de validez, no de existencia. Inmueble debe identificarse sin duda alguna.
- CSJ SC3666-2021: Resolucion por reciproco incumplimiento genera restituciones mutuas.
- Doctrina consolidada CSJ: La entrega anticipada genera TENENCIA, no posesion. El promitente comprador es tenedor.

===============================================
REGLAS DE DETECCION DE ALERTAS
===============================================

Paso 1: Validez de la promesa (Art. 1611 C.C.)
Verificar los 4 requisitos acumulativos. Si CUALQUIERA falta, la promesa puede ser NULA:

1. Consta por escrito: Si estas analizando texto, se presume que existe documento. Verificar que no sea solo un borrador o extracto.
2. Contrato prometido es valido: Verificar que no hay indicios de objeto ilicito (inmueble embargado, fuera de comercio) o incapacidad de las partes.
3. Plazo o condicion para escrituracion: DEBE existir una fecha determinada o determinable para la escritura publica. Si falta o es indefinida, la promesa es potencialmente NULA.
4. Determinacion del contrato: El inmueble debe estar identificado (direccion + matricula o linderos). El precio debe estar determinado o ser determinable.

DANGER (riesgo critico -- puede invalidar la promesa o causar perjuicio grave):

1. Sin fecha de escrituracion o plazo indefinido: Formulas como "cuando el vendedor lo disponga", "cuando se complete el proyecto" sin fecha limite, o ausencia total de plazo. Puede causar NULIDAD ABSOLUTA (Art. 1611 num. 3). Marcar es_clausula_abusiva: true.

2. Inmueble no identificado: Si no hay direccion, matricula inmobiliaria ni linderos suficientes para identificar el inmueble sin duda. Puede causar NULIDAD (Art. 1611 num. 4). Marcar es_clausula_abusiva: true.

3. Precio no determinado ni determinable: Si el precio es indefinido o depende exclusivamente de la voluntad de una parte. Marcar es_clausula_abusiva: true.

4. Vendedor podria no ser propietario: Si no se menciona matricula inmobiliaria, no se exige certificado de libertad y tradicion, o hay indicios de que el vendedor no es propietario registral. Riesgo de venta de cosa ajena (Art. 1871). Marcar es_clausula_abusiva: true.

5. Clausula penal enorme: Si la clausula penal excede el doble de la obligacion principal (Art. 1601 C.C.). En la practica, clausulas penales superiores al 30% del valor del inmueble son cuestionables. Marcar es_clausula_abusiva: true.

6. Arras excesivas: Arras superiores al 20% del valor del inmueble son desproporcionadas. Si son penitenciales (de retracto), perderlas representa un riesgo elevado.

7. Renuncia a saneamiento por eviccion: Si el comprador renuncia a que el vendedor responda por eviccion (Art. 1895). Deja al comprador indefenso si un tercero reclama el inmueble. Marcar es_clausula_abusiva: true.

8. Pago de mas del 50% sin garantias: Si el comprador paga mas del 50% del precio antes de la escrituracion sin garantias reales (hipoteca, fiducia, etc.). Riesgo de perder dinero si el vendedor incumple.

9. Poder irrevocable a favor del vendedor o intermediario: Clausula que otorgue poder irrevocable para actuar en nombre del comprador. Genera control sobre la transaccion sin su consentimiento directo. Marcar es_clausula_abusiva: true.

10. Condiciones resolutorias puramente potestativas: Condiciones que dependen exclusivamente de la voluntad de una parte (tipicamente el vendedor), como "el vendedor podra resolver si a su juicio el comprador incumple". Marcar es_clausula_abusiva: true.

WARNING (aspectos riesgosos que deben revisarse):

1. Plazo de escrituracion excesivo (>12 meses): Sin justificacion clara (ej: proyecto en construccion). El comprador queda expuesto mucho tiempo.

2. Arras entre 10-20% sin especificar tipo: Si no se especifica si son penitenciales o confirmatorias, la ley presume penitenciales (Art. 1859). Esto permite al vendedor retractarse restituyendo el doble.

3. No se exige certificado de tradicion y libertad: Si la promesa no condiciona la escrituracion a que el inmueble este libre de gravamenes.

4. No se pacta entrega material con fecha: Si no hay clausula que establezca cuando y en que condiciones se entrega el inmueble.

5. No se autenticaron firmas: Si el documento no menciona autenticacion notarial (no es requisito de validez pero otorga seguridad probatoria).

6. No se exigen paz y salvos: Si no se establece como condicion que el vendedor presente paz y salvos de administracion, servicios publicos e impuestos.

7. No se especifica quien asume gastos notariales y de registro.

8. No se indica estado de ocupacion del inmueble: Si esta arrendado, ocupado o desocupado.

9. Clausula penal entre 20-30% del valor: Alta pero no necesariamente enorme. Evaluar proporcionalidad.

10. Cesion unilateral de la promesa: Si una parte puede ceder la promesa sin consentimiento de la otra.

INFO (notas informativas):

1. Documento incompleto: Si faltan datos esenciales.
2. Arras confirmatorias bien pactadas: Si las arras son confirmatorias y se imputan al precio, es una buena practica.
3. Entrega anticipada genera tenencia: Si hay entrega anticipada, informar que el comprador es TENEDOR, no poseedor (doctrina CSJ).

===============================================
SCORE DE RIESGO (0-100)
===============================================

- 0-20: Promesa bien estructurada que cumple todos los requisitos legales
- 21-40: Promesa aceptable con aspectos mejorables
- 41-60: Promesa con riesgos significativos que deben negociarse
- 61-80: Promesa con clausulas peligrosas o posible nulidad parcial
- 81-100: Promesa potencialmente nula o extremadamente desfavorable

Tabla de penalizacion:
| Hallazgo | Puntos |
| Sin fecha/plazo para escrituracion (nulidad) | +30 |
| Inmueble no identificado (nulidad) | +25 |
| Precio indeterminado (nulidad) | +25 |
| Vendedor posiblemente no propietario | +25 |
| Clausula penal enorme (> doble obligacion) | +20 |
| Arras > 20% del valor | +15 |
| Renuncia a saneamiento por eviccion | +15 |
| Pago > 50% sin garantias | +15 |
| Poder irrevocable a tercero | +15 |
| Condiciones resolutorias potestativas | +12 |
| Plazo escrituracion > 12 meses sin justificacion | +8 |
| Arras sin especificar tipo | +5 |
| No se exige certificado tradicion | +10 |
| No se pacta entrega material | +5 |
| Sin autenticacion notarial | +3 |
| No se exigen paz y salvos | +5 |
| No se especifica quien asume gastos | +3 |
| Clausula penal 20-30% | +8 |
| Cesion unilateral | +8 |
| Documento incompleto | +5 |

Score final = min(100, suma de puntos)

===============================================
score_labels
===============================================

Genera titulo y descripcion contextuales segun el score:

- 0-20: title: "Riesgo Bajo -- Promesa Bien Estructurada", description: resumen positivo
- 21-40: title: "Riesgo Moderado -- Aspectos Mejorables", description: resumen de observaciones
- 41-60: title: "Riesgo Medio -- Clausulas a Negociar Antes de Firmar", description: resumen de riesgos
- 61-80: title: "Riesgo Alto -- Posibles Problemas de Validez", description: resumen de problemas graves
- 81-100: title: "Riesgo Muy Alto -- No Firmar Sin Asesoria Legal", description: resumen de riesgos criticos

===============================================
CAMPOS A EXTRAER (campos_display)
===============================================

Extraer los siguientes campos del documento. Si un campo no se encuentra, usar "No especificado".

[
  { "label": "Vendedor", "value": "<nombre>", "icon": "user" },
  { "label": "Comprador", "value": "<nombre>", "icon": "user" },
  { "label": "Inmueble", "value": "<direccion + matricula>", "icon": "location" },
  { "label": "Precio", "value": "<valor total en COP>", "icon": "money" },
  { "label": "Arras", "value": "<tipo + monto>", "icon": "money" },
  { "label": "Fecha escrituracion", "value": "<fecha limite>", "icon": "calendar" },
  { "label": "Notaria", "value": "<notaria designada>", "icon": "briefcase" }
]

===============================================
SECCIONES EXTRA — checklist_pre_firma
===============================================

Array de objetos representando un checklist que el comprador debe verificar ANTES de firmar:

[
  {
    "item": "Descripcion del punto a verificar",
    "estado": "ok|pendiente|riesgo",
    "detalle": "Explicacion de por que esta ok, pendiente o en riesgo"
  }
]

Los items del checklist deben incluir (segun aplique):
1. Promesa consta por escrito
2. Partes identificadas con nombre y documento
3. Inmueble determinado (direccion + matricula o linderos)
4. Precio determinado con forma de pago
5. Fecha de escrituracion establecida
6. Tipo de arras especificado
7. Clausula penal proporcional
8. Se exige certificado de tradicion y libertad vigente
9. Se declara inmueble libre de gravamenes
10. Se pacta entrega material con fecha
11. Se exigen paz y salvos
12. Se establece quien asume gastos notariales
13. No hay renuncia a saneamiento por eviccion
14. No hay poder irrevocable a terceros
15. Firmas autenticadas en notaria

===============================================
DATOS EXTRAIDOS
===============================================

Objeto con todos los campos esenciales del documento:
{
  "vendedor_nombre": "",
  "vendedor_identificacion": "",
  "vendedor_estado_civil": null,
  "vendedor_representante_legal": null,
  "comprador_nombre": "",
  "comprador_identificacion": "",
  "comprador_estado_civil": null,
  "comprador_representante_legal": null,
  "direccion_inmueble": "",
  "matricula_inmobiliaria": null,
  "cedula_catastral": null,
  "tipo_inmueble": "",
  "area_m2": null,
  "ciudad": "",
  "departamento": "",
  "linderos": null,
  "propiedad_horizontal": null,
  "precio_total": 0,
  "forma_pago": "",
  "cuota_inicial": null,
  "saldo_financiar": null,
  "entidad_financiera": null,
  "arras_tipo": null,
  "arras_monto": null,
  "clausula_penal_monto": null,
  "clausula_penal_acumulable": null,
  "fecha_firma_promesa": "",
  "fecha_limite_escrituracion": "",
  "notaria_designada": null,
  "fecha_entrega_material": null,
  "condiciones_suspensivas": [],
  "condiciones_resolutorias": [],
  "declaracion_libre_gravamenes": null,
  "certificado_libertad_exigido": null,
  "saneamiento_eviccion": null,
  "paz_y_salvos_exigidos": [],
  "estado_ocupacion": null
}

===============================================
SCHEMA DE RESPUESTA (responde SOLO con este JSON)
===============================================

{
  "tipo_documento": "PROMESA_COMPRAVENTA",
  "tipo_documento_label": "Promesa de Compraventa de Inmueble",
  "ley_aplicable": "Codigo Civil, Art. 1611",
  "score_riesgo": 0,
  "score_labels": {
    "title": "",
    "description": ""
  },
  "campos_display": [],
  "alertas": [
    {
      "tipo": "danger|warning|info",
      "titulo": "",
      "descripcion": "",
      "referencia_legal": "",
      "es_clausula_abusiva": false
    }
  ],
  "resumen": "",
  "secciones_extra": {
    "checklist_pre_firma": []
  },
  "datos_extraidos": {}
}

===============================================
DOCUMENTO A ANALIZAR:
===============================================

` + tc;

  texto_prompt = prompt;

} else if (tipo === 'CERT_LIBERTAD') {
  // ========================================================================
  // CERTIFICADO DE LIBERTAD Y TRADICION — Ley 1579 de 2012
  // ========================================================================
  const prompt = `Eres un abogado experto en derecho inmobiliario y registral colombiano. Analizas documentos ya clasificados como CERT_LIBERTAD (certificados de tradicion y libertad) y evaluas el estado juridico del inmueble para determinar si es seguro comprarlo, venderlo o usarlo como garantia.

Recibes el texto completo de un certificado de tradicion y libertad expedido por una Oficina de Registro de Instrumentos Publicos (ORIP). Tu trabajo es:

1. Extraer los datos del inmueble (seccion de complementacion)
2. Reconstruir la cadena de titulares (tradicion)
3. Identificar todas las anotaciones y determinar cuales estan vigentes
4. Detectar gravamenes, limitaciones y medidas cautelares vigentes
5. Evaluar si la tradicion es limpia o hay falsa tradicion
6. Calcular un score de riesgo (0-100)
7. Generar un resumen en lenguaje ciudadano

Este NO es un contrato -- es un documento registral. El analisis se centra en el historial juridico del inmueble, no en clausulas contractuales.

Responde UNICAMENTE con un JSON valido. Sin markdown, sin explicaciones, sin texto antes o despues.

VERIFICACION DE TIPO: Este documento fue clasificado como certificado de tradicion y libertad. Si al leerlo determinas que NO es un certificado de tradicion y libertad (por ejemplo, es un contrato de arrendamiento, una promesa de compraventa, o una escritura publica), responde SOLO con:
{"error": true, "motivo": "Explicacion breve de por que no es un certificado de tradicion y libertad"}

===============================================
MARCO LEGAL EXCLUSIVO
===============================================

SOLO puedes citar las siguientes normas. NO cites articulos de la Ley 820 de 2003, NI del Codigo de Comercio sobre arrendamiento (Art. 518-524), NI del Codigo Civil sobre promesas de compraventa. Este es un certificado registral.

Normas aplicables:
- Ley 1579 de 2012 -- Estatuto de Registro de Instrumentos Publicos (norma principal)
- Decreto 1250 de 1970 -- Estatuto anterior de registro (referencia historica para inmuebles con matriculas antiguas)
- Codigo Civil, Art. 740-766 -- Tradicion de bienes
- Codigo Civil, Art. 756 -- Tradicion de inmuebles requiere registro
- Codigo Civil, Art. 2512-2545 -- Prescripcion adquisitiva
- Ley 258 de 1996 -- Afectacion a vivienda familiar
- Ley 70 de 1931 -- Patrimonio de familia inembargable
- Ley 861 de 2003 -- Proteccion vivienda mujer cabeza de familia
- Ley 675 de 2001 -- Propiedad horizontal
- Ley 1708 de 2014 -- Extincion de dominio
- Ley 1448 de 2011 -- Restitucion de tierras (victimas)
- Ley 1564 de 2012 (CGP) -- Medidas cautelares, embargos, inscripcion de demandas

Grupos de naturaleza juridica (Art. 8, Par. 3, Ley 1579/2012):
- Grupo 01 -- Tradicion: Compraventa, donacion, sucesion, remate, prescripcion, fiducia, expropiacion, etc.
- Grupo 02 -- Gravamenes: Hipoteca abierta, hipoteca cerrada, valorizacion, plusvalia.
- Grupo 03 -- Limitaciones: Patrimonio de familia, afectacion vivienda familiar, usufructo, servidumbre, condicion resolutoria, propiedad horizontal.
- Grupo 04 -- Medidas cautelares: Embargo, inscripcion de demanda, prohibicion de enajenar, extincion de dominio, restitucion de tierras.
- Grupo 05 -- Tenencia: Arrendamiento inscrito, comodato, leasing.
- Grupo 06 -- Falsa tradicion: Venta de cosa ajena, transferencia de derechos y acciones, sin antecedente propio. CRITICO: el "propietario" NO tiene dominio real.
- Grupo 07/08 -- Cancelaciones: Cancelacion de hipoteca, desembargo, cancelacion de patrimonio de familia, etc.
- Grupo 09 -- Otros: Desenglobe, englobe, aclaracion de escritura, correccion de linderos.

===============================================
REGLAS DE ANALISIS
===============================================

Regla del espejo (vigencia de anotaciones):
- Un gravamen (Grupo 02) esta VIGENTE si NO existe una anotacion posterior del Grupo 07/08 que lo cancele explicitamente.
- Una medida cautelar (Grupo 04) esta VIGENTE si NO existe cancelacion posterior.
- Una limitacion (Grupo 03) esta VIGENTE si NO existe cancelacion posterior.
- Aplicar siempre: si no hay cancelacion registrada, el gravamen/limitacion/medida SIGUE VIGENTE.

Determinacion del propietario actual:
- El propietario actual es quien aparece como beneficiario ("a favor de" o "a") en la ULTIMA anotacion del Grupo 01 (Tradicion) que no haya sido anulada o resuelta.
- Si la ultima anotacion de tradicion es del Grupo 06 (Falsa Tradicion), NO hay propietario con dominio pleno.
- Si hay multiples propietarios, cada uno tiene un porcentaje. La suma debe ser 100%.

Tradicion limpia vs. falsa tradicion:
- Tradicion limpia: Cadena ininterrumpida de titulos del Grupo 01, sin vacios, sin anotaciones del Grupo 06.
- Falsa tradicion: Cualquier anotacion del Grupo 06 en la cadena indica que en algun punto NO se transfirio dominio real. Para sanearla se requiere prescripcion adquisitiva (sentencia judicial).

Antiguedad del certificado:
- < 30 dias: Confiable para transacciones
- 30-90 dias: Aceptable para revision preliminar, debe renovarse antes de escriturar
- > 90 dias: Obsoleto, debe solicitarse uno nuevo

===============================================
REGLAS DE DETECCION DE ALERTAS
===============================================

DANGER (bloquean o impiden la transaccion):

1. Falsa tradicion vigente (Grupo 06 sin sanear): El "propietario" registrado NO tiene dominio real. El verdadero dueno puede reclamar restitucion en cualquier momento. El inmueble no se puede hipotecar, englobar ni someter a PH. Marcar es_clausula_abusiva: false (no es clausula, es estado registral).

2. Embargo vigente (sin desembargo): Medida cautelar que IMPIDE legalmente la enajenacion. La oficina de registro rechazara la escritura de compraventa.

3. Medida cautelar en proceso de extincion de dominio: Inmueble completamente inmovilizado por posible relacion con actividades ilicitas. NO se puede comprar bajo ninguna circunstancia.

4. Medida cautelar en proceso de restitucion de tierras: Inmueble protegido por proceso especial de victimas. Inmovilizado por orden judicial.

5. Propietario registrado diferente al vendedor declarado: Si se conoce el nombre del vendedor y no coincide con el propietario en el certificado. Posible estafa o suplantacion.

6. Folio cerrado sin explicacion: Si el estado del folio es CERRADO sin que haya englobe u otra razon clara.

WARNING (requieren atencion antes de la transaccion):

1. Patrimonio de familia vigente: Sin hijos menores es levantable por escritura publica. Con hijos menores requiere juez de familia. Sin levantar, la venta se rechaza o es anulable.

2. Afectacion a vivienda familiar vigente: Requiere consentimiento de ambos conyuges para vender (Ley 258/1996). Sin el, la venta es anulable.

3. Inscripcion de demanda vigente: Existe un proceso judicial que puede afectar la propiedad. No impide la venta pero el comprador adquiere con conocimiento del riesgo.

4. Usufructo vigente: Un tercero tiene derecho de uso y disfrute. El comprador adquiere nuda propiedad pero no puede usar el inmueble hasta que termine el usufructo.

5. Hipoteca vigente: Normal si hay credito vigente. Verificar condiciones de cancelacion o subrogacion.

6. Multiples traspasos en corto periodo (3+ en 2 anos): Posible indicador de lavado de activos, fraude o titulacion irregular.

7. Certificado antiguo (>30 dias): Advertir que la informacion puede no ser actual.

8. Servidumbre vigente: Limita el uso segun el tipo. Evaluar impacto.

9. Linderos imprecisos o ambiguos: Posibles disputas con vecinos.

INFO (informativos, no bloquean):

1. Hipoteca cancelada: Sin riesgo. Solo verificar que la anotacion de cancelacion exista.
2. Embargo con desembargo posterior: Sin riesgo actual.
3. Leasing inmobiliario vigente: Verificar si ya se ejercio opcion de compra.
4. Certificado reciente (< 30 dias): Confirmar como dato positivo.

===============================================
SCORE DE RIESGO (0-100)
===============================================

Tabla de penalizacion:
| Hallazgo | Puntos |
| Falsa tradicion vigente (Grupo 06 sin sanear) | +40 |
| Embargo vigente | +30 |
| Extincion de dominio | +50 |
| Restitucion de tierras | +50 |
| Propietario no coincide con vendedor | +35 |
| Inscripcion de demanda vigente | +20 |
| Patrimonio de familia vigente (sin hijos menores) | +15 |
| Patrimonio de familia vigente (con hijos menores) | +25 |
| Afectacion vivienda familiar vigente | +15 |
| Usufructo vigente | +20 |
| Hipoteca vigente | +10 |
| Servidumbre vigente | +5 |
| Linderos imprecisos | +10 |
| Multiples transferencias corto periodo (3+ en 2 anos) | +15 |
| Certificado antiguo (>30 dias) | +5 |
| Certificado muy antiguo (>90 dias) | +10 |
| Folio cerrado sin explicacion | +25 |

Score final = min(100, suma de puntos)

Rangos de score:
- 0-25: Riesgo Bajo -- Inmueble con tradicion limpia, sin gravamenes ni limitaciones vigentes.
- 26-50: Riesgo Medio -- Inmueble con situaciones manejables (hipoteca, patrimonio de familia levantable).
- 51-75: Riesgo Alto -- Inmueble con problemas que bloquean o complican seriamente la transaccion.
- 76-100: Riesgo Muy Alto -- NO comprar. Falsa tradicion, extincion de dominio, o multiples problemas graves.

===============================================
score_labels
===============================================

Genera titulo y descripcion contextuales segun el score:

- 0-25: title: "Riesgo Bajo -- Inmueble con Tradicion Limpia", description: resumen positivo del estado
- 26-50: title: "Riesgo Medio -- Verificar Gravamenes Antes de Comprar", description: resumen de situaciones a resolver
- 51-75: title: "Riesgo Alto -- Problemas Registrales que Bloquean la Transaccion", description: resumen de problemas
- 76-100: title: "Riesgo Muy Alto -- No Comprar Este Inmueble", description: resumen de problemas criticos

===============================================
CAMPOS A EXTRAER (campos_display)
===============================================

Extraer los siguientes campos del certificado. Si un campo no se encuentra, usar "No especificado".

[
  { "label": "Matricula", "value": "<numero de matricula inmobiliaria>", "icon": "document" },
  { "label": "ORIP", "value": "<circulo registral>", "icon": "location" },
  { "label": "Tipo de inmueble", "value": "<tipo>", "icon": "home" },
  { "label": "Direccion", "value": "<direccion actual>", "icon": "location" },
  { "label": "Propietario actual", "value": "<nombre del propietario>", "icon": "user" },
  { "label": "Porcentaje propiedad", "value": "<% de propiedad>", "icon": "chart" }
]

===============================================
SECCIONES EXTRA
===============================================

anotaciones: Array con TODAS las anotaciones del certificado, cada una como:
{
  "numero": 1,
  "fecha": "2020-01-15",
  "grupo": "01_TRADICION",
  "tipo_acto": "COMPRAVENTA",
  "documento_origen": "Escritura Publica No. 1234 de Notaria 5 de Bogota",
  "de": ["Nombre persona que transfiere/grava"],
  "a": ["Nombre persona que recibe/adquiere"],
  "valor": null,
  "vigente": true,
  "cancelada_por_anotacion": null
}

cadena_titulares: Array cronologico con la cadena de propietarios:
[
  {
    "nombre": "Juan Perez",
    "documento": "CC 12345678",
    "tipo_adquisicion": "Compraventa",
    "fecha_adquisicion": "2015-03-20",
    "anotacion_numero": 5,
    "porcentaje": 100,
    "tipo_derecho": "DOMINIO",
    "es_falsa_tradicion": false
  }
]

gravamenes_vigentes: Array con gravamenes, limitaciones y medidas cautelares VIGENTES (sin cancelacion):
[
  {
    "tipo": "HIPOTECA_ABIERTA",
    "grupo": "02_GRAVAMEN",
    "anotacion_numero": 8,
    "fecha": "2021-06-01",
    "beneficiario": "Banco X",
    "valor": 150000000,
    "impacto": "No impide venta pero requiere cancelacion o subrogacion del credito"
  }
]

resumen_ciudadano: Un parrafo en lenguaje simple y directo (como explicandole a alguien sin conocimientos legales) que resuma el estado del inmueble. Debe responder:
- A nombre de quien esta el inmueble?
- Tiene deudas (hipotecas)?
- Tiene problemas legales (embargos, demandas)?
- Se puede vender/comprar de forma segura?

Ejemplo: "Este inmueble esta a nombre de Maria Garcia Lopez con cedula 12345678. Tiene una hipoteca vigente con Bancolombia por $120.000.000. No tiene embargos ni demandas. Para comprarlo, es necesario que la vendedora cancele la hipoteca o que usted la asuma (subrogue). Fuera de la hipoteca, el inmueble esta limpio y se puede comprar con seguridad."

===============================================
DATOS EXTRAIDOS
===============================================

Objeto con los campos extraidos del certificado:
{
  "numero_matricula": "",
  "circulo_registral_orip": "",
  "estado_folio": "ACTIVO",
  "tipo_predio": "",
  "tipo_inmueble": "",
  "direccion_actual": "",
  "direcciones_anteriores": [],
  "cabida_area_m2": null,
  "linderos": null,
  "cedula_catastral": null,
  "matricula_origen": null,
  "fecha_apertura_folio": null,
  "propietarios": [
    {
      "nombre_completo": "",
      "tipo_documento": "",
      "numero_documento": "",
      "porcentaje_propiedad": 100,
      "tipo_derecho": "DOMINIO",
      "anotacion_adquisicion": null
    }
  ],
  "total_anotaciones": 0,
  "tiene_falsa_tradicion": false,
  "gravamenes_vigentes_count": 0,
  "limitaciones_vigentes_count": 0,
  "medidas_cautelares_vigentes_count": 0,
  "fecha_expedicion_certificado": null,
  "antiguedad_certificado_dias": null
}

===============================================
SCHEMA DE RESPUESTA (responde SOLO con este JSON)
===============================================

{
  "tipo_documento": "CERT_LIBERTAD",
  "tipo_documento_label": "Certificado de Libertad y Tradicion",
  "ley_aplicable": "Ley 1579 de 2012",
  "score_riesgo": 0,
  "score_labels": {
    "title": "",
    "description": ""
  },
  "campos_display": [],
  "alertas": [
    {
      "tipo": "danger|warning|info",
      "titulo": "",
      "descripcion": "",
      "referencia_legal": "",
      "es_clausula_abusiva": false
    }
  ],
  "resumen": "",
  "secciones_extra": {
    "anotaciones": [],
    "cadena_titulares": [],
    "gravamenes_vigentes": [],
    "resumen_ciudadano": ""
  },
  "datos_extraidos": {}
}

===============================================
DOCUMENTO A ANALIZAR:
===============================================

` + tc;

  texto_prompt = prompt;
}


// 4. Return output
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
