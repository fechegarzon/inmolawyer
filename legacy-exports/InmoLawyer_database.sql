-- ============================================================
-- InmoLawyer - Script de Base de Datos PostgreSQL
-- Ley 820 de 2003 - Análisis de Contratos de Arrendamiento
-- ============================================================

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: contratos
-- Almacena los contratos de arrendamiento analizados
-- ============================================================
CREATE TABLE IF NOT EXISTS contratos (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('CTR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 9)),
    
    -- Datos del Arrendador
    arrendador_nombre VARCHAR(255),
    arrendador_documento VARCHAR(50),
    arrendador_tipo_doc VARCHAR(10), -- 'NIT', 'C.C.', 'C.E.'
    
    -- Datos del Arrendatario
    arrendatario_nombre VARCHAR(255),
    arrendatario_documento VARCHAR(50),
    arrendatario_tipo_doc VARCHAR(10) DEFAULT 'C.C.',
    
    -- Datos del Contrato
    canon_mensual DECIMAL(15, 2),
    direccion_inmueble TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    duracion_meses INTEGER,
    
    -- Texto completo del contrato
    texto_extraido TEXT,
    
    -- Metadatos
    estado VARCHAR(50) DEFAULT 'analizado', -- 'pendiente', 'analizado', 'revisado', 'archivado'
    score_riesgo INTEGER DEFAULT 0,
    resumen_analisis TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    -- Índices para búsqueda
    CONSTRAINT chk_canon_positivo CHECK (canon_mensual >= 0),
    CONSTRAINT chk_duracion_positiva CHECK (duracion_meses > 0),
    CONSTRAINT chk_score_rango CHECK (score_riesgo >= 0 AND score_riesgo <= 100)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contratos_arrendador ON contratos(arrendador_documento);
CREATE INDEX IF NOT EXISTS idx_contratos_arrendatario ON contratos(arrendatario_documento);
CREATE INDEX IF NOT EXISTS idx_contratos_ciudad ON contratos(ciudad);
CREATE INDEX IF NOT EXISTS idx_contratos_fecha ON contratos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_created ON contratos(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contratos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contratos_updated ON contratos;
CREATE TRIGGER trg_contratos_updated
    BEFORE UPDATE ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION update_contratos_timestamp();

-- ============================================================
-- TABLA: alertas_contrato
-- Almacena las alertas/cláusulas problemáticas detectadas
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas_contrato (
    id SERIAL PRIMARY KEY,
    contrato_id VARCHAR(50) NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    
    -- Clasificación de la alerta
    tipo VARCHAR(20) NOT NULL DEFAULT 'info', -- 'danger', 'warning', 'info'
    categoria VARCHAR(50), -- 'deposito', 'incremento', 'terminacion', 'servicios', etc.
    
    -- Contenido de la alerta
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    referencia_legal VARCHAR(100), -- Ej: 'Art. 16 Ley 820 de 2003'
    texto_clausula TEXT, -- Texto exacto de la cláusula problemática
    
    -- Flags
    es_clausula_abusiva BOOLEAN DEFAULT FALSE,
    requiere_accion BOOLEAN DEFAULT FALSE,
    fue_revisada BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revisada_at TIMESTAMP WITH TIME ZONE,
    revisada_por VARCHAR(100),
    
    -- Índices
    CONSTRAINT chk_tipo_valido CHECK (tipo IN ('danger', 'warning', 'info'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alertas_contrato ON alertas_contrato(contrato_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_contrato(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_abusiva ON alertas_contrato(es_clausula_abusiva) WHERE es_clausula_abusiva = TRUE;

-- ============================================================
-- TABLA: consultas_chat
-- Historial de preguntas y respuestas sobre contratos
-- ============================================================
CREATE TABLE IF NOT EXISTS consultas_chat (
    id SERIAL PRIMARY KEY,
    contrato_id VARCHAR(50) NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    
    -- Contenido de la consulta
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    
    -- Metadatos de la consulta
    tokens_usados INTEGER,
    modelo_ia VARCHAR(50) DEFAULT 'claude-sonnet-4-20250514',
    tiempo_respuesta_ms INTEGER,
    
    -- Feedback del usuario
    fue_util BOOLEAN,
    rating INTEGER, -- 1-5
    comentario_feedback TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_cliente VARCHAR(45),
    user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_consultas_contrato ON consultas_chat(contrato_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas_chat(created_at DESC);

-- ============================================================
-- TABLA: ipc_historico
-- Valores históricos del IPC para cálculo de incrementos
-- ============================================================
CREATE TABLE IF NOT EXISTS ipc_historico (
    anio INTEGER PRIMARY KEY,
    valor_ipc DECIMAL(5, 2) NOT NULL,
    fuente VARCHAR(100) DEFAULT 'DANE',
    fecha_publicacion DATE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar valores históricos del IPC
INSERT INTO ipc_historico (anio, valor_ipc, fuente, notas) VALUES
    (2024, 5.20, 'DANE', 'Valor provisional/estimado'),
    (2023, 9.28, 'DANE', 'IPC acumulado año 2023'),
    (2022, 13.12, 'DANE', 'IPC acumulado año 2022'),
    (2021, 5.62, 'DANE', 'IPC acumulado año 2021'),
    (2020, 1.61, 'DANE', 'IPC acumulado año 2020 - Afectado por pandemia'),
    (2019, 3.80, 'DANE', 'IPC acumulado año 2019'),
    (2018, 3.18, 'DANE', 'IPC acumulado año 2018'),
    (2017, 4.09, 'DANE', 'IPC acumulado año 2017'),
    (2016, 5.75, 'DANE', 'IPC acumulado año 2016'),
    (2015, 6.77, 'DANE', 'IPC acumulado año 2015')
ON CONFLICT (anio) DO UPDATE SET
    valor_ipc = EXCLUDED.valor_ipc,
    fuente = EXCLUDED.fuente,
    notas = EXCLUDED.notas;

-- ============================================================
-- TABLA: usuarios (opcional - para multi-tenancy)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'abogado', -- 'abogado', 'arrendatario', 'admin'
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Resumen de contratos con alertas
CREATE OR REPLACE VIEW v_contratos_resumen AS
SELECT 
    c.id,
    c.arrendador_nombre,
    c.arrendatario_nombre,
    c.canon_mensual,
    c.ciudad,
    c.fecha_inicio,
    c.duracion_meses,
    c.estado,
    c.score_riesgo,
    c.created_at,
    COUNT(a.id) AS total_alertas,
    COUNT(CASE WHEN a.tipo = 'danger' THEN 1 END) AS alertas_peligro,
    COUNT(CASE WHEN a.tipo = 'warning' THEN 1 END) AS alertas_advertencia,
    COUNT(CASE WHEN a.es_clausula_abusiva THEN 1 END) AS clausulas_abusivas
FROM contratos c
LEFT JOIN alertas_contrato a ON c.id = a.contrato_id
GROUP BY c.id;

-- Vista: Estadísticas generales
CREATE OR REPLACE VIEW v_estadisticas AS
SELECT 
    COUNT(*) AS total_contratos,
    AVG(score_riesgo) AS promedio_riesgo,
    COUNT(CASE WHEN score_riesgo > 50 THEN 1 END) AS contratos_alto_riesgo,
    AVG(canon_mensual) AS canon_promedio,
    COUNT(DISTINCT ciudad) AS ciudades_diferentes,
    (SELECT COUNT(*) FROM alertas_contrato WHERE es_clausula_abusiva = TRUE) AS total_clausulas_abusivas,
    (SELECT COUNT(*) FROM consultas_chat) AS total_consultas
FROM contratos;

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función: Calcular incremento máximo permitido
CREATE OR REPLACE FUNCTION calcular_incremento_maximo(
    p_canon_actual DECIMAL,
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
    canon_actual DECIMAL,
    ipc_aplicable DECIMAL,
    anio_ipc INTEGER,
    incremento_pesos DECIMAL,
    nuevo_canon_maximo DECIMAL
) AS $$
DECLARE
    v_ipc DECIMAL;
BEGIN
    -- Obtener IPC del año anterior
    SELECT valor_ipc INTO v_ipc
    FROM ipc_historico
    WHERE anio = p_anio - 1;
    
    -- Si no hay IPC, usar estimado
    IF v_ipc IS NULL THEN
        v_ipc := 5.0;
    END IF;
    
    RETURN QUERY
    SELECT 
        p_canon_actual AS canon_actual,
        v_ipc AS ipc_aplicable,
        (p_anio - 1) AS anio_ipc,
        ROUND(p_canon_actual * (v_ipc / 100), 0) AS incremento_pesos,
        ROUND(p_canon_actual * (1 + v_ipc / 100), 0) AS nuevo_canon_maximo;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM calcular_incremento_maximo(1200000, 2024);

-- ============================================================
-- PERMISOS (ajustar según tu configuración)
-- ============================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inmolawyer_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inmolawyer_app;

-- ============================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
COMMENT ON TABLE contratos IS 'Contratos de arrendamiento analizados según Ley 820 de 2003';
COMMENT ON TABLE alertas_contrato IS 'Alertas y cláusulas problemáticas detectadas en contratos';
COMMENT ON TABLE consultas_chat IS 'Historial de consultas legales sobre contratos';
COMMENT ON TABLE ipc_historico IS 'Valores históricos del IPC para cálculo de incrementos (Art. 20 Ley 820)';

COMMENT ON COLUMN contratos.score_riesgo IS 'Puntuación de riesgo 0-100. >50 indica cláusulas potencialmente abusivas';
COMMENT ON COLUMN alertas_contrato.tipo IS 'Severidad: danger=ilegal, warning=dudoso, info=informativo';
COMMENT ON COLUMN alertas_contrato.es_clausula_abusiva IS 'TRUE si la cláusula viola la Ley 820 de 2003';
