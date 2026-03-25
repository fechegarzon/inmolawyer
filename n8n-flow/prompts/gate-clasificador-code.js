// Gate Clasificador — Nodo Code para n8n
// Recibe respuesta de Gemini Vision, parsea, valida y rutea

const TIPOS_PERMITIDOS = [
  'ARRIENDO_VIVIENDA',
  'ARRIENDO_COMERCIAL',
  'PROMESA_COMPRAVENTA',
  'CERT_LIBERTAD',
  'DESCONOCIDO'
];

const MIN_CONFIDENCE = 0.5;

// 1. Obtener respuesta raw de Gemini
const rawResponse = $input.first().json.response
  ?? $input.first().json.text
  ?? $input.first().json.candidates?.[0]?.content?.parts?.[0]?.text
  ?? '';

// 2. Parsear JSON con fallback para respuestas sucias
let parsed;
try {
  // Intento directo
  parsed = JSON.parse(rawResponse);
} catch (e) {
  // Fallback: extraer JSON de texto con markdown u otros wrappers
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e2) {
      return [{
        json: {
          error: true,
          error_code: 'PARSE_ERROR',
          motivo: 'No se pudo parsear la respuesta del clasificador',
          raw: rawResponse.substring(0, 500)
        }
      }];
    }
  } else {
    return [{
      json: {
        error: true,
        error_code: 'PARSE_ERROR',
        motivo: 'Respuesta del clasificador no contiene JSON',
        raw: rawResponse.substring(0, 500)
      }
    }];
  }
}

// 3. Manejar documentos ilegibles
if (parsed.status === 'BLURRY') {
  return [{
    json: {
      error: true,
      error_code: 'BLURRY',
      motivo: parsed.motivo || 'Documento ilegible',
      bot_event: {
        event: 'classification_result',
        status: 'BLURRY',
        motivo: parsed.motivo
      }
    }
  }];
}

// 4. Manejar documentos no legales
if (parsed.status === 'NOT_LEGAL') {
  return [{
    json: {
      error: true,
      error_code: 'NOT_LEGAL',
      motivo: parsed.motivo || 'No es un documento legal inmobiliario',
      bot_event: {
        event: 'classification_result',
        status: 'NOT_LEGAL',
        motivo: parsed.motivo
      }
    }
  }];
}

// 5. Validar status OK
if (parsed.status !== 'OK') {
  return [{
    json: {
      error: true,
      error_code: 'INVALID_STATUS',
      motivo: `Status inesperado: ${parsed.status}`,
      raw: JSON.stringify(parsed).substring(0, 500)
    }
  }];
}

// 6. Validar tipo_documento
const tipo = parsed.tipo_documento;
if (!TIPOS_PERMITIDOS.includes(tipo)) {
  return [{
    json: {
      error: true,
      error_code: 'INVALID_TYPE',
      motivo: `Tipo no reconocido: ${tipo}`,
      bot_event: {
        event: 'classification_result',
        status: 'INVALID_TYPE',
        tipo_documento: tipo
      }
    }
  }];
}

// 7. Manejar tipo DESCONOCIDO — pedir seleccion manual
if (tipo === 'DESCONOCIDO') {
  return [{
    json: {
      error: true,
      error_code: 'UNKNOWN_TYPE',
      motivo: 'Documento legal inmobiliario detectado pero no se pudo clasificar. Se requiere seleccion manual del tipo.',
      confidence: parsed.confidence || 0,
      indicadores: parsed.indicadores || [],
      texto_extraido: parsed.texto_extraido || '',
      bot_event: {
        event: 'classification_result',
        status: 'UNKNOWN_TYPE',
        confidence: parsed.confidence,
        indicadores: parsed.indicadores
      }
    }
  }];
}

// 8. Validar confidence minima
const confidence = parsed.confidence ?? 0;
if (confidence < MIN_CONFIDENCE) {
  return [{
    json: {
      error: true,
      error_code: 'LOW_CONFIDENCE',
      motivo: `Confidence muy baja (${confidence}). Se requiere seleccion manual.`,
      tipo_documento: tipo,
      confidence: confidence,
      indicadores: parsed.indicadores || [],
      texto_extraido: parsed.texto_extraido || '',
      bot_event: {
        event: 'classification_result',
        status: 'LOW_CONFIDENCE',
        tipo_documento: tipo,
        confidence: confidence
      }
    }
  }];
}

// 9. Clasificacion exitosa — pasar al siguiente nodo
return [{
  json: {
    error: false,
    tipo_documento: tipo,
    confidence: confidence,
    texto_extraido: parsed.texto_extraido || '',
    indicadores: parsed.indicadores || [],
    bot_event: {
      event: 'classification_result',
      status: 'OK',
      tipo_documento: tipo,
      confidence: confidence,
      indicadores: parsed.indicadores
    }
  }
}];
