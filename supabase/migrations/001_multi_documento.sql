-- =====================================================
-- MIGRACION 001: Multi-documento (Schema flexible JSONB)
-- InmoLawyer — Expansion de 1 a 4 tipos de documento
-- Fecha: 2026-03-12
-- Arquitectura: MD-1 (Schema flexible JSONB)
-- =====================================================
--
-- ESTRATEGIA: ADITIVA (zero-risk)
--   1. Crear tabla `documentos` con JSONB flexible
--   2. Crear tabla `alertas_documento`
--   3. Copiar datos existentes de `contratos` → `documentos`
--   4. Copiar datos existentes de `alertas_contrato` → `alertas_documento`
--   5. NO renombrar ni tocar tablas existentes
--   6. n8n sigue escribiendo a `contratos` hasta que se actualice
--   7. Nuevos tipos de documento van directo a `documentos`
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS alertas_documento CASCADE;
--   DROP TABLE IF EXISTS documentos CASCADE;
--   ALTER TABLE consultas_chat DROP COLUMN IF EXISTS documento_id;
--   ALTER TABLE incrementos_calculados DROP COLUMN IF EXISTS documento_id;
-- =====================================================

-- =====================================================
-- PASO 1: Crear tabla `documentos`
-- =====================================================

CREATE TABLE documentos (
    id TEXT PRIMARY KEY,

    -- Job tracking (para polling desde frontend/n8n)
    job_id TEXT UNIQUE,

    -- Vinculo usuario
    user_id UUID,
    user_email TEXT,

    -- Clasificacion del documento
    tipo_documento TEXT NOT NULL DEFAULT 'ARRIENDO_VIVIENDA'
        CHECK (tipo_documento IN (
            'ARRIENDO_VIVIENDA',
            'ARRIENDO_COMERCIAL',
            'PROMESA_COMPRAVENTA',
            'CERT_LIBERTAD'
        )),

    -- Estado del analisis (mismos valores que contratos.estado)
    estado TEXT DEFAULT 'processing',

    -- Score de riesgo (0-100)
    score_riesgo INTEGER CHECK (score_riesgo >= 0 AND score_riesgo <= 100),
    nivel_riesgo TEXT,
    clausulas_abusivas_count INTEGER DEFAULT 0,

    -- Labels del score para el frontend
    -- { "title": "Riesgo Medio", "description": "Se encontraron 3 clausulas..." }
    score_labels JSONB,

    -- Datos extraidos del documento, estructura variable por tipo
    -- ARRIENDO_VIVIENDA/COMERCIAL:
    --   { "partes": { "arrendador": { "nombre", "doc" }, "arrendatario": {...} },
    --     "financieros": { "canon_mensual": 1500000 },
    --     "inmueble": { "direccion": "...", "ciudad": "..." },
    --     "fechas": { "inicio": "2026-01-01", "duracion_meses": 12 } }
    -- PROMESA_COMPRAVENTA:
    --   { "partes": { "promitente_vendedor": {...}, "promitente_comprador": {...} },
    --     "financieros": { "precio_venta": ..., "arras": ... },
    --     "inmueble": {...}, "fechas": { "firma_escritura": "..." } }
    -- CERT_LIBERTAD:
    --   { "inmueble": { "matricula": "...", "direccion": "..." },
    --     "propietarios": [...], "anotaciones": [...] }
    datos_extraidos JSONB DEFAULT '{}'::jsonb,

    -- Array de campos para renderizar en el frontend (dynamic renderer)
    -- [{ "label": "Canon mensual", "value": "$1.500.000", "icon": "dollar-sign" }, ...]
    campos_display JSONB DEFAULT '[]'::jsonb,

    -- Resultado completo del analisis LLM (respuesta cruda)
    resultado_json JSONB,

    -- Datos opcionales por tipo de documento
    -- Arriendo: { "incrementos": [...] }
    -- Cert. Libertad: { "anotaciones": [...], "timeline": [...] }
    -- Promesa: { "checklist_pre_firma": [...] }
    secciones_extra JSONB,

    -- Cache de alertas para listados rapidos
    -- { "total": 5, "criticas": 2, "advertencias": 3 }
    alertas_resumen JSONB,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE documentos IS 'Tabla central multi-documento. Schema flexible JSONB para arriendo vivienda/comercial, promesa compraventa, cert. libertad.';

-- =====================================================
-- PASO 2: Indices para `documentos`
-- =====================================================

CREATE INDEX idx_documentos_tipo ON documentos(tipo_documento);
CREATE INDEX idx_documentos_user ON documentos(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_documentos_estado ON documentos(estado);
CREATE INDEX idx_documentos_created ON documentos(created_at DESC);
CREATE INDEX idx_documentos_datos ON documentos USING gin(datos_extraidos);
CREATE INDEX idx_documentos_tipo_estado ON documentos(tipo_documento, estado);
CREATE INDEX idx_documentos_job ON documentos(job_id) WHERE job_id IS NOT NULL;

-- =====================================================
-- PASO 3: Trigger updated_at (reusar funcion existente)
-- =====================================================

CREATE TRIGGER documentos_updated_at
    BEFORE UPDATE ON documentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 4: Crear tabla `alertas_documento`
-- =====================================================

CREATE TABLE alertas_documento (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    documento_id TEXT NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,

    tipo TEXT NOT NULL,          -- danger, warning, info, success
    titulo TEXT NOT NULL,
    descripcion TEXT,
    referencia_legal TEXT,       -- Art. 16 Ley 820/2003
    categoria TEXT,              -- deposito, incremento, terminacion, etc.
    es_clausula_abusiva BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alertas_doc_documento ON alertas_documento(documento_id);
CREATE INDEX idx_alertas_doc_tipo ON alertas_documento(tipo);

-- =====================================================
-- PASO 5: Copiar datos contratos → documentos
-- =====================================================

INSERT INTO documentos (
    id, job_id, user_id, user_email,
    tipo_documento, estado,
    score_riesgo, nivel_riesgo, clausulas_abusivas_count,
    datos_extraidos, resultado_json,
    created_at, updated_at
)
SELECT
    c.id,
    c.job_id,
    c.user_id,
    c.user_email,
    'ARRIENDO_VIVIENDA',
    c.estado,
    c.score_riesgo,
    c.nivel_riesgo,
    c.clausulas_abusivas_count,
    jsonb_strip_nulls(jsonb_build_object(
        'partes', jsonb_strip_nulls(jsonb_build_object(
            'arrendador', jsonb_strip_nulls(jsonb_build_object(
                'nombre', c.arrendador_nombre,
                'doc', c.arrendador_doc
            )),
            'arrendatario', jsonb_strip_nulls(jsonb_build_object(
                'nombre', c.arrendatario_nombre,
                'doc', c.arrendatario_doc
            ))
        )),
        'financieros', jsonb_strip_nulls(jsonb_build_object(
            'canon_mensual', c.canon_mensual
        )),
        'inmueble', jsonb_strip_nulls(jsonb_build_object(
            'direccion', c.inmueble_direccion,
            'ciudad', c.ciudad
        )),
        'fechas', jsonb_strip_nulls(jsonb_build_object(
            'inicio', c.fecha_inicio,
            'duracion_meses', c.duracion_meses
        ))
    )),
    c.resultado_json,
    c.created_at,
    c.updated_at
FROM contratos c;

-- =====================================================
-- PASO 6: Copiar alertas_contrato → alertas_documento
-- =====================================================

INSERT INTO alertas_documento (
    id, documento_id, tipo, titulo, descripcion,
    referencia_legal, es_clausula_abusiva, created_at
)
SELECT
    a.id,
    a.contrato_id,
    a.tipo,
    a.titulo,
    a.descripcion,
    a.referencia_legal,
    a.es_clausula_abusiva,
    a.created_at
FROM alertas_contrato a
WHERE a.contrato_id IN (SELECT id FROM documentos);

-- =====================================================
-- PASO 7: Agregar documento_id a tablas relacionadas
-- =====================================================

-- consultas_chat: agregar documento_id
ALTER TABLE consultas_chat ADD COLUMN IF NOT EXISTS documento_id TEXT REFERENCES documentos(id) ON DELETE SET NULL;
UPDATE consultas_chat SET documento_id = contrato_id WHERE contrato_id IS NOT NULL AND documento_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_consultas_documento ON consultas_chat(documento_id);

-- incrementos_calculados: agregar documento_id
ALTER TABLE incrementos_calculados ADD COLUMN IF NOT EXISTS documento_id TEXT REFERENCES documentos(id) ON DELETE SET NULL;
UPDATE incrementos_calculados SET documento_id = contrato_id WHERE contrato_id IS NOT NULL AND documento_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_incrementos_documento ON incrementos_calculados(documento_id);

-- =====================================================
-- PASO 8: RLS Policies
-- =====================================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_documento ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo sus documentos
CREATE POLICY documentos_select ON documentos
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY documentos_insert ON documentos
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY documentos_update ON documentos
    FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- Alertas: acceso via documento ownership
CREATE POLICY alertas_doc_select ON alertas_documento
    FOR SELECT USING (
        documento_id IN (SELECT id FROM documentos WHERE user_id = auth.uid() OR user_id IS NULL)
    );

CREATE POLICY alertas_doc_insert ON alertas_documento
    FOR INSERT WITH CHECK (
        documento_id IN (SELECT id FROM documentos WHERE user_id = auth.uid() OR user_id IS NULL)
    );

-- =====================================================
-- PASO 9: Vista unificada (para dashboard multi-doc)
-- =====================================================

CREATE OR REPLACE VIEW vista_todos_documentos AS
-- Documentos nuevos (multi-tipo)
SELECT
    id,
    tipo_documento,
    estado,
    score_riesgo,
    nivel_riesgo,
    score_labels,
    datos_extraidos,
    campos_display,
    secciones_extra,
    alertas_resumen,
    resultado_json,
    user_id,
    user_email,
    created_at,
    updated_at,
    'documentos' AS _source
FROM documentos

UNION ALL

-- Contratos legacy (solo los que NO fueron copiados a documentos)
SELECT
    c.id,
    'ARRIENDO_VIVIENDA' AS tipo_documento,
    c.estado,
    c.score_riesgo,
    c.nivel_riesgo,
    NULL AS score_labels,
    jsonb_strip_nulls(jsonb_build_object(
        'partes', jsonb_build_object(
            'arrendador', jsonb_strip_nulls(jsonb_build_object('nombre', c.arrendador_nombre, 'doc', c.arrendador_doc)),
            'arrendatario', jsonb_strip_nulls(jsonb_build_object('nombre', c.arrendatario_nombre, 'doc', c.arrendatario_doc))
        ),
        'financieros', jsonb_strip_nulls(jsonb_build_object('canon_mensual', c.canon_mensual)),
        'inmueble', jsonb_strip_nulls(jsonb_build_object('direccion', c.inmueble_direccion, 'ciudad', c.ciudad)),
        'fechas', jsonb_strip_nulls(jsonb_build_object('inicio', c.fecha_inicio, 'duracion_meses', c.duracion_meses))
    )) AS datos_extraidos,
    '[]'::jsonb AS campos_display,
    NULL AS secciones_extra,
    NULL AS alertas_resumen,
    c.resultado_json,
    c.user_id,
    c.user_email,
    c.created_at,
    c.updated_at,
    'contratos' AS _source
FROM contratos c
WHERE c.id NOT IN (SELECT id FROM documentos);

-- =====================================================
-- NOTAS POST-MIGRACION
-- =====================================================
-- 1. contratos tabla INTACTA — n8n sigue escribiendo ahi
-- 2. Nuevos tipos van a documentos via nuevo n8n flow
-- 3. Frontend loadMisContratos sigue leyendo de contratos (sin cambios)
-- 4. Nuevo dashboard multi-doc leera de documentos directamente
-- 5. Cuando n8n se actualice para escribir a documentos,
--    se puede deprecar contratos y limpiar duplicados
--
-- VERIFICACIONES:
-- SELECT count(*) FROM documentos;  -- debe ser 33 (igual a contratos)
-- SELECT count(*) FROM alertas_documento;  -- debe ser 163 (igual a alertas_contrato)
-- SELECT tipo_documento, count(*) FROM documentos GROUP BY tipo_documento;
-- SELECT * FROM vista_todos_documentos LIMIT 5;
-- SELECT * FROM contratos LIMIT 3;  -- sigue funcionando normal
