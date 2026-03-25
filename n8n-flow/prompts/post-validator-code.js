// Post-Validator — Nodo Code para n8n
// Valida el output del LLM contra allowlists de articulos legales,
// stripea referencias invalidas, y agrega validation_flags.
//
// Input esperado:
//   - $input.first().json.analisis  → resultado del LLM (alertas, score, campos, etc.)
//   - $input.first().json.tipo_documento → tipo clasificado por el gate (ARRIENDO_VIVIENDA, etc.)
//   - $input.first().json.tipo_documento_llm → tipo que el LLM devolvio (puede diferir)

// ============================================================================
// ALLOWLISTS — Embedded para evitar dependencia de lectura de archivo en n8n
// ============================================================================

const ALLOWLISTS = {
  ARRIENDO_VIVIENDA: {
    leyes: new Set([
      'ley 820', 'ley 820/2003', 'ley 820 de 2003',
      'decreto 2331', 'decreto 2331/2001', 'decreto 2331 de 2001',
      'circular 001/2024 sic',
      'codigo civil', 'c.civil', 'cc',
      'constitucion politica', 'c.p.'
    ]),
    // Art. 1-40 Ley 820, Art. 1-5 Decreto 2331, Art. 28 CP, Arts CC supletorios
    articulos: buildArticleSet([
      { ley: 'ley 820', min: 1, max: 40 },
      { ley: 'decreto 2331', min: 1, max: 5 },
      { ley: 'constitucion politica', nums: [28] },
      { ley: 'c.civil', nums: [1602, 1603, 1604, 1973, 1974, 1977, 1982] }
    ]),
    patterns: [
      /^art[.]?\s*(\d{1,2})\s*(?:de\s+la\s+)?ley\s*820(?:\s*(?:de(?:l)?\s*)?2003)?$/i,
      /^art[ií]culo\s*(\d{1,2})\s*(?:de\s+la\s+)?ley\s*820(?:\s*(?:de(?:l)?\s*)?2003)?$/i,
      /^art[.]?\s*(\d{1,5})\s*(?:de(?:l)?\s+)?decreto\s*2331(?:\s*(?:de(?:l)?\s*)?2001)?$/i,
      /^art[ií]culo\s*(\d{1,5})\s*(?:de(?:l)?\s+)?decreto\s*2331(?:\s*(?:de(?:l)?\s*)?2001)?$/i,
      /^art[.]?\s*28\s*(?:de\s+la\s+)?(?:constituci[oó]n\s*pol[ií]tica|c\.?\s*p\.?|cp)$/i,
      /^art[ií]culo\s*28\s*(?:de\s+la\s+)?(?:constituci[oó]n\s*pol[ií]tica|c\.?\s*p\.?|cp)$/i,
      /^art[.]?\s*(1602|1603|1604|1973|1974|1977|1982)\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[ií]culo\s*(1602|1603|1604|1973|1974|1977|1982)\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i
    ]
  },

  ARRIENDO_COMERCIAL: {
    leyes: new Set([
      'codigo de comercio', 'c.comercio', 'c.co.', 'c.co', 'cco',
      'codigo civil', 'c.civil', 'cc',
      'ley 1480', 'ley 1480/2011', 'ley 1480 de 2011',
      'ley 1564', 'ley 1564/2012', 'ley 1564 de 2012'
    ]),
    articulos: buildArticleSet([
      { ley: 'c.comercio', nums: [515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 533, 822, 830, 864, 865, 867, 868, 870, 871] },
      { ley: 'c.civil', nums: [1546, 1602, 1603, 1604, 1973, 1974, 1977, 1982] },
      { ley: 'ley 1480', nums: [42] },
      { ley: 'ley 1564', nums: [384, 390] }
    ]),
    patterns: [
      /^art[.]?\s*(\d{3})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*(?:de\s*)?comercio|c\.?\s*(?:de\s*)?comercio|c\.?co\.?)$/i,
      /^art[ií]culo\s*(\d{3})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*(?:de\s*)?comercio|c\.?\s*(?:de\s*)?comercio|c\.?co\.?)$/i,
      /^art[.]?\s*(\d{4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[ií]culo\s*(\d{4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[.]?\s*(42)\s*(?:de\s+la\s+)?ley\s*1480(?:\s*(?:de(?:l)?\s*)?2011)?$/i,
      /^art[ií]culo\s*(42)\s*(?:de\s+la\s+)?ley\s*1480(?:\s*(?:de(?:l)?\s*)?2011)?$/i,
      /^art[.]?\s*(384|390)\s*(?:de\s+la\s+)?ley\s*1564(?:\s*(?:de(?:l)?\s*)?2012)?$/i,
      /^art[ií]culo\s*(384|390)\s*(?:de\s+la\s+)?ley\s*1564(?:\s*(?:de(?:l)?\s*)?2012)?$/i
    ]
  },

  PROMESA_COMPRAVENTA: {
    leyes: new Set([
      'codigo civil', 'c.civil', 'cc',
      'ley 1579', 'ley 1579/2012', 'ley 1579 de 2012',
      'decreto 960', 'decreto 960/1970', 'decreto 960 de 1970',
      'ley 1480', 'ley 1480/2011', 'ley 1480 de 2011',
      'ley 1564', 'ley 1564/2012', 'ley 1564 de 2012', 'cgp',
      'ley 258', 'ley 258/1996', 'ley 258 de 1996',
      'ley 861', 'ley 861/2003', 'ley 861 de 2003',
      'ley 2079', 'ley 2079/2021', 'ley 2079 de 2021'
    ]),
    articulos: buildArticleSet([
      { ley: 'c.civil', nums: [756, 1502, 1508, 1509, 1510, 1511, 1512, 1517, 1518, 1519, 1520, 1521, 1522, 1523, 1524, 1546, 1592, 1593, 1594, 1596, 1599, 1600, 1601, 1602, 1603, 1604, 1611, 1849, 1857, 1859, 1860, 1861, 1862, 1871, 1893, 1895, 1899, 1904, 1913] },
      { ley: 'c.civil', min: 1740, max: 1756 },
      { ley: 'c.civil', min: 1914, max: 1927 },
      { ley: 'ley 1579', nums: [2, 4, 5, 6, 7, 8, 16, 54, 59] },
      { ley: 'decreto 960', nums: [3, 12, 13, 14, 22, 23, 24, 52, 53, 54, 55] },
      { ley: 'ley 1480', nums: [5, 42, 43, 44] },
      { ley: 'ley 1564', nums: [422] }
    ]),
    patterns: [
      /^art[.]?\s*(\d{1,4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[ií]culo\s*(\d{1,4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[.]?\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1579(?:\s*(?:de(?:l)?\s*)?2012)?$/i,
      /^art[ií]culo\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1579(?:\s*(?:de(?:l)?\s*)?2012)?$/i,
      /^art[.]?\s*(\d{1,3})\s*(?:de(?:l)?\s+)?decreto\s*960(?:\s*(?:de(?:l)?\s*)?1970)?$/i,
      /^art[ií]culo\s*(\d{1,3})\s*(?:de(?:l)?\s+)?decreto\s*960(?:\s*(?:de(?:l)?\s*)?1970)?$/i,
      /^art[.]?\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1480(?:\s*(?:de(?:l)?\s*)?2011)?$/i,
      /^art[ií]culo\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1480(?:\s*(?:de(?:l)?\s*)?2011)?$/i,
      /^art[.]?\s*(422)\s*(?:de\s+la\s+)?(?:ley\s*1564(?:\s*(?:de(?:l)?\s*)?2012)?|cgp|c\.?g\.?p\.?)$/i,
      /^art[ií]culo\s*(422)\s*(?:de\s+la\s+)?(?:ley\s*1564(?:\s*(?:de(?:l)?\s*)?2012)?|cgp|c\.?g\.?p\.?)$/i
    ]
  },

  CERT_LIBERTAD: {
    leyes: new Set([
      'ley 1579', 'ley 1579/2012', 'ley 1579 de 2012',
      'decreto 1250', 'decreto 1250/1970', 'decreto 1250 de 1970',
      'codigo civil', 'c.civil', 'cc',
      'ley 258', 'ley 258/1996', 'ley 258 de 1996',
      'ley 861', 'ley 861/2003', 'ley 861 de 2003',
      'ley 70', 'ley 70/1931', 'ley 70 de 1931',
      'ley 675', 'ley 675/2001', 'ley 675 de 2001',
      'ley 1708', 'ley 1708/2014', 'ley 1708 de 2014',
      'ley 1561', 'ley 1561/2012', 'ley 1561 de 2012',
      'ley 1448', 'ley 1448/2011', 'ley 1448 de 2011',
      'ley 1564', 'ley 1564/2012', 'ley 1564 de 2012', 'cgp',
      'ley 387', 'ley 387/1997', 'ley 387 de 1997'
    ]),
    articulos: buildArticleSet([
      { ley: 'ley 1579', nums: [2, 4, 5, 6, 7, 8, 16, 54, 59] },
      { ley: 'c.civil', min: 740, max: 766 },
      { ley: 'c.civil', min: 2512, max: 2545 }
    ]),
    patterns: [
      /^art[.]?\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1579(?:\s*(?:de(?:l)?\s*)?2012)?$/i,
      /^art[ií]culo\s*(\d{1,3})\s*(?:de\s+la\s+)?ley\s*1579(?:\s*(?:de(?:l)?\s*)?2012)?$/i,
      /^art[.]?\s*(\d{1,4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[ií]culo\s*(\d{1,4})\s*(?:de(?:l)?\s+)?(?:c[oó]digo\s*civil|c\.?\s*civil|c\.?c\.?)$/i,
      /^art[.]?\s*(\d{1,4})\s*(?:de(?:l)?\s+)?decreto\s*1250(?:\s*(?:de(?:l)?\s*)?1970)?$/i,
      /^art[ií]culo\s*(\d{1,4})\s*(?:de(?:l)?\s+)?decreto\s*1250(?:\s*(?:de(?:l)?\s*)?1970)?$/i,
      // Leyes especiales — aceptar cualquier articulo de estas leyes (son pocas)
      /^art[.]?\s*\d+\s*(?:de\s+la\s+)?ley\s*(?:258|861|70|675|1708|1561|1448|1564|387)(?:\s*(?:de(?:l)?\s*)?\d{4})?$/i,
      /^art[ií]culo\s*\d+\s*(?:de\s+la\s+)?ley\s*(?:258|861|70|675|1708|1561|1448|1564|387)(?:\s*(?:de(?:l)?\s*)?\d{4})?$/i
    ]
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Construye un Set de articulos normalizados a partir de definiciones.
 * Cada entry puede tener { ley, nums } o { ley, min, max }.
 * El formato normalizado es: "art. {num} {ley}" (lowercase).
 */
function buildArticleSet(entries) {
  const set = new Set();
  for (const entry of entries) {
    const nums = entry.nums
      ? entry.nums
      : Array.from({ length: entry.max - entry.min + 1 }, (_, i) => entry.min + i);
    for (const n of nums) {
      set.add(`art. ${n} ${entry.ley}`);
    }
  }
  return set;
}

/**
 * Normaliza una referencia legal para comparacion.
 * - Trim, lowercase
 * - "Articulo" / "Artículo" → "art."
 * - Multiples espacios → uno solo
 * - Quita puntos finales
 */
function normalizeRef(ref) {
  if (!ref || typeof ref !== 'string') return '';
  return ref
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^art[ií]culo\b/i, 'art.')
    .replace(/\.$/, '');
}

/**
 * Verifica si una referencia legal es valida contra la allowlist de un tipo.
 * Primero intenta match exacto en el Set, luego fallback a regex patterns.
 */
function isValidReference(ref, allowlist) {
  const normalized = normalizeRef(ref);
  if (!normalized) return false;

  // 1. Match exacto en Set normalizado
  if (allowlist.articulos.has(normalized)) return true;

  // 2. Match por regex patterns
  for (const pattern of allowlist.patterns) {
    if (pattern.test(normalized)) return true;
  }

  return false;
}

// ============================================================================
// SCORE LABELS DEFAULTS — fallback por tipo si el LLM no los devuelve
// ============================================================================

const SCORE_LABEL_DEFAULTS = {
  ARRIENDO_VIVIENDA: {
    ranges: [
      { min: 0, max: 30, title: 'Riesgo bajo', description: 'Contrato conforme a la Ley 820/2003. Clausulas equilibradas.' },
      { min: 31, max: 60, title: 'Riesgo medio', description: 'Algunas clausulas merecen atencion. Revisar advertencias.' },
      { min: 61, max: 100, title: 'Riesgo alto', description: 'Contrato con clausulas potencialmente abusivas o ilegales.' }
    ]
  },
  ARRIENDO_COMERCIAL: {
    ranges: [
      { min: 0, max: 30, title: 'Riesgo bajo', description: 'Contrato conforme al Codigo de Comercio (Arts. 518-524).' },
      { min: 31, max: 60, title: 'Riesgo medio', description: 'Clausulas que merecen revision. No necesariamente ilegales.' },
      { min: 61, max: 100, title: 'Riesgo alto', description: 'Contrato con clausulas que violan normas imperativas o desequilibrio grave.' }
    ]
  },
  PROMESA_COMPRAVENTA: {
    ranges: [
      { min: 0, max: 30, title: 'Riesgo bajo', description: 'Promesa cumple los 4 requisitos del Art. 1611 C.C. Bien estructurada.' },
      { min: 31, max: 60, title: 'Riesgo medio', description: 'Aspectos mejorables. Verificar protecciones del comprador.' },
      { min: 61, max: 100, title: 'Riesgo alto', description: 'Promesa con riesgos significativos. Posible nulidad o clausulas abusivas.' }
    ]
  },
  CERT_LIBERTAD: {
    ranges: [
      { min: 0, max: 25, title: 'Riesgo bajo', description: 'Tradicion limpia. Sin gravamenes ni medidas cautelares vigentes.' },
      { min: 26, max: 50, title: 'Riesgo medio', description: 'Gravamenes o limitaciones manejables. Verificar antes de transaccion.' },
      { min: 51, max: 75, title: 'Riesgo alto', description: 'Medidas cautelares o limitaciones que bloquean o complican la transaccion.' },
      { min: 76, max: 100, title: 'Riesgo muy alto', description: 'NO COMPRAR. Falsa tradicion, embargo o extincion de dominio.' }
    ]
  }
};

// Campos minimos de display por tipo (fallback si el LLM no devuelve campos_display)
const CAMPOS_DISPLAY_DEFAULTS = {
  ARRIENDO_VIVIENDA: [
    { key: 'arrendador', label: 'Arrendador' },
    { key: 'arrendatario', label: 'Arrendatario' },
    { key: 'canon_mensual', label: 'Canon mensual' },
    { key: 'duracion', label: 'Duracion' },
    { key: 'direccion', label: 'Direccion del inmueble' }
  ],
  ARRIENDO_COMERCIAL: [
    { key: 'arrendador', label: 'Arrendador' },
    { key: 'arrendatario', label: 'Arrendatario' },
    { key: 'canon_mensual', label: 'Canon mensual' },
    { key: 'actividad_comercial', label: 'Actividad comercial' },
    { key: 'duracion', label: 'Duracion' },
    { key: 'direccion', label: 'Direccion del local' }
  ],
  PROMESA_COMPRAVENTA: [
    { key: 'vendedor', label: 'Vendedor' },
    { key: 'comprador', label: 'Comprador' },
    { key: 'precio_total', label: 'Precio total' },
    { key: 'direccion', label: 'Direccion del inmueble' },
    { key: 'fecha_escrituracion', label: 'Fecha limite de escrituracion' }
  ],
  CERT_LIBERTAD: [
    { key: 'matricula_inmobiliaria', label: 'Matricula inmobiliaria' },
    { key: 'propietario_actual', label: 'Propietario actual' },
    { key: 'direccion', label: 'Direccion' },
    { key: 'estado_folio', label: 'Estado del folio' }
  ]
};

// ============================================================================
// MAIN — Post-Validation
// ============================================================================

const input = $input.first().json;
const analisis = input.analisis ?? {};
const tipoClasificado = input.tipo_documento;
const tipoLLM = analisis.tipo_documento ?? input.tipo_documento_llm ?? tipoClasificado;

const validationFlags = [];

// --------------------------------------------------------------------------
// 1. Validar tipo_documento: si el LLM devolvio un tipo diferente al gate
// --------------------------------------------------------------------------
if (tipoLLM && tipoLLM !== tipoClasificado) {
  validationFlags.push({
    flag: 'CONFIDENCE_LOW',
    motivo: `El LLM clasifico como "${tipoLLM}" pero el gate clasifico como "${tipoClasificado}". Se usa tipo del gate.`,
    tipo_gate: tipoClasificado,
    tipo_llm: tipoLLM
  });
}

// Usar siempre el tipo del gate (fuente de verdad)
const tipoFinal = tipoClasificado;

// --------------------------------------------------------------------------
// 2. Validar score_riesgo: debe estar entre 0-100
// --------------------------------------------------------------------------
let scoreRiesgo = analisis.score_riesgo;

if (scoreRiesgo === undefined || scoreRiesgo === null) {
  scoreRiesgo = null;
  validationFlags.push({
    flag: 'SCORE_MISSING',
    motivo: 'El LLM no devolvio score_riesgo.'
  });
} else if (typeof scoreRiesgo !== 'number' || scoreRiesgo < 0 || scoreRiesgo > 100) {
  const original = scoreRiesgo;
  scoreRiesgo = Math.max(0, Math.min(100, Number(scoreRiesgo) || 0));
  validationFlags.push({
    flag: 'SCORE_CLAMPED',
    motivo: `score_riesgo fuera de rango (original: ${original}), ajustado a ${scoreRiesgo}.`,
    valor_original: original,
    valor_ajustado: scoreRiesgo
  });
}

// --------------------------------------------------------------------------
// 3. Validar campos_display: no puede estar vacio
// --------------------------------------------------------------------------
let camposDisplay = analisis.campos_display;

if (!camposDisplay || !Array.isArray(camposDisplay) || camposDisplay.length === 0) {
  camposDisplay = CAMPOS_DISPLAY_DEFAULTS[tipoFinal] ?? CAMPOS_DISPLAY_DEFAULTS.ARRIENDO_VIVIENDA;
  validationFlags.push({
    flag: 'CAMPOS_DISPLAY_FALLBACK',
    motivo: 'campos_display vacio o ausente. Se usan campos por defecto del tipo.',
    tipo: tipoFinal
  });
}

// --------------------------------------------------------------------------
// 4. Validar score_labels: debe tener title y description
// --------------------------------------------------------------------------
let scoreLabels = analisis.score_labels;

if (!scoreLabels || typeof scoreLabels !== 'object') {
  // Fallback completo
  scoreLabels = SCORE_LABEL_DEFAULTS[tipoFinal] ?? SCORE_LABEL_DEFAULTS.ARRIENDO_VIVIENDA;
  validationFlags.push({
    flag: 'SCORE_LABELS_FALLBACK',
    motivo: 'score_labels ausente. Se usan labels por defecto del tipo.',
    tipo: tipoFinal
  });
} else {
  // Validar que tenga ranges con title y description
  if (!scoreLabels.ranges || !Array.isArray(scoreLabels.ranges) || scoreLabels.ranges.length === 0) {
    scoreLabels = SCORE_LABEL_DEFAULTS[tipoFinal] ?? SCORE_LABEL_DEFAULTS.ARRIENDO_VIVIENDA;
    validationFlags.push({
      flag: 'SCORE_LABELS_FALLBACK',
      motivo: 'score_labels.ranges vacio o mal formado. Se usan labels por defecto.',
      tipo: tipoFinal
    });
  } else {
    // Verificar que cada range tenga title y description
    for (let i = 0; i < scoreLabels.ranges.length; i++) {
      const range = scoreLabels.ranges[i];
      if (!range.title || !range.description) {
        const defaults = SCORE_LABEL_DEFAULTS[tipoFinal]?.ranges ?? [];
        const fallbackRange = defaults[i] ?? { title: 'Sin titulo', description: 'Sin descripcion' };
        range.title = range.title || fallbackRange.title;
        range.description = range.description || fallbackRange.description;
        validationFlags.push({
          flag: 'SCORE_LABEL_PATCHED',
          motivo: `score_labels.ranges[${i}] tenia campos faltantes. Parchado con defaults.`,
          index: i
        });
      }
    }
  }
}

// --------------------------------------------------------------------------
// 5. Validar referencias legales en alertas contra allowlist
// --------------------------------------------------------------------------
const alertas = analisis.alertas ?? [];
const allowlist = ALLOWLISTS[tipoFinal];

if (!allowlist) {
  validationFlags.push({
    flag: 'ALLOWLIST_MISSING',
    motivo: `No existe allowlist para tipo "${tipoFinal}". No se validan referencias legales.`
  });
} else {
  for (const alerta of alertas) {
    const ref = alerta.referencia_legal;
    if (!ref || typeof ref !== 'string' || ref.trim() === '') {
      // Alerta sin referencia legal — no hay nada que validar
      continue;
    }

    const valid = isValidReference(ref, allowlist);

    if (!valid) {
      validationFlags.push({
        flag: 'REF_LEGAL_STRIPPED',
        referencia_invalida: ref,
        alerta_titulo: alerta.titulo ?? alerta.title ?? '(sin titulo)',
        motivo: `Referencia "${ref}" no encontrada en la allowlist de ${tipoFinal}. Stripeada.`
      });
      // Stripear: vaciar la referencia pero conservar la alerta
      alerta.referencia_legal = '';
      alerta._referencia_original = ref;
    }
  }
}

// --------------------------------------------------------------------------
// 6. Ensamblar resultado validado
// --------------------------------------------------------------------------
const resultado = {
  ...analisis,
  tipo_documento: tipoFinal,
  score_riesgo: scoreRiesgo,
  campos_display: camposDisplay,
  score_labels: scoreLabels,
  alertas: alertas,
  _validation: {
    validated: true,
    timestamp: new Date().toISOString(),
    flags_count: validationFlags.length,
    flags: validationFlags
  }
};

return [{ json: resultado }];
