-- =====================================================
-- INMOLAWYER - Base de Datos para Contratos de Arrendamiento
-- PostgreSQL Schema
-- =====================================================

-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: contratos
-- Almacena los contratos subidos y sus datos extraídos
-- =====================================================
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Información del archivo
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_tipo VARCHAR(50),
    archivo_url TEXT,
    texto_extraido TEXT,

    -- Datos del Arrendador
    arrendador_nombre VARCHAR(255),
    arrendador_documento VARCHAR(50),
    arrendador_tipo_documento VARCHAR(20), -- NIT, C.C., etc.
    arrendador_email VARCHAR(255),
    arrendador_telefono VARCHAR(50),

    -- Datos del Arrendatario
    arrendatario_nombre VARCHAR(255),
    arrendatario_documento VARCHAR(50),
    arrendatario_tipo_documento VARCHAR(20),
    arrendatario_email VARCHAR(255),
    arrendatario_telefono VARCHAR(50),

    -- Datos del Inmueble
    direccion_inmueble TEXT,
    ciudad VARCHAR(100),
    tipo_inmueble VARCHAR(50), -- Apartamento, Casa, Habitación, Local

    -- Datos Financieros
    canon_mensual DECIMAL(15, 2),
    canon_texto VARCHAR(255),
    deposito DECIMAL(15, 2),
    tiene_deposito_ilegal BOOLEAN DEFAULT FALSE,

    -- Fechas del Contrato
    fecha_inicio DATE,
    fecha_fin DATE,
    duracion_meses INTEGER,
    fecha_firma DATE,

    -- Estado del Análisis
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, procesando, completado, error
    score_riesgo INTEGER DEFAULT 0, -- 0-100, donde 100 es más riesgoso

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    procesado_por VARCHAR(100) DEFAULT 'n8n-workflow'
);

-- =====================================================
-- TABLA: alertas_contrato
-- Almacena las alertas/problemas detectados en cada contrato
-- =====================================================
CREATE TABLE IF NOT EXISTS alertas_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL, -- danger, warning, info, success
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    referencia_legal VARCHAR(100), -- Art. 16 Ley 820/2003

    -- Clasificación
    categoria VARCHAR(50), -- deposito, incremento, terminacion, reparaciones, etc.
    es_clausula_abusiva BOOLEAN DEFAULT FALSE,
    requiere_accion BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: incrementos_calculados
-- Historial de incrementos calculados según IPC
-- =====================================================
CREATE TABLE IF NOT EXISTS incrementos_calculados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,

    anio INTEGER NOT NULL,
    ipc_aplicado DECIMAL(5, 2),
    canon_anterior DECIMAL(15, 2),
    incremento DECIMAL(15, 2),
    canon_nuevo DECIMAL(15, 2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: consultas_chat
-- Historial de preguntas y respuestas del chat IA
-- =====================================================
CREATE TABLE IF NOT EXISTS consultas_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,

    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    referencia_legal VARCHAR(255),

    -- Métricas
    tiempo_respuesta_ms INTEGER,
    modelo_ia VARCHAR(50), -- claude-3-haiku, claude-3-sonnet, etc.
    tokens_usados INTEGER,

    -- Feedback del usuario
    fue_util BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: fechas_importantes
-- Fechas clave calculadas para notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS fechas_importantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL, -- incremento, desocupacion, vencimiento, renovacion
    fecha DATE NOT NULL,
    descripcion TEXT,
    dias_anticipacion INTEGER, -- días de preaviso requeridos
    notificado BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: ipc_historico
-- Datos históricos del IPC de Colombia
-- =====================================================
CREATE TABLE IF NOT EXISTS ipc_historico (
    anio INTEGER PRIMARY KEY,
    ipc DECIMAL(5, 2) NOT NULL,
    fuente VARCHAR(100) DEFAULT 'DANE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos históricos del IPC
INSERT INTO ipc_historico (anio, ipc) VALUES
    (2024, 5.20),
    (2023, 9.28),
    (2022, 13.12),
    (2021, 5.62),
    (2020, 1.61),
    (2019, 3.80),
    (2018, 3.18),
    (2017, 4.09),
    (2016, 5.75),
    (2015, 6.77),
    (2014, 3.66),
    (2013, 1.94),
    (2012, 2.44),
    (2011, 3.73),
    (2010, 3.17)
ON CONFLICT (anio) DO UPDATE SET ipc = EXCLUDED.ipc;

-- =====================================================
-- ÍNDICES para optimizar consultas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_created ON contratos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contratos_arrendatario ON contratos(arrendatario_documento);
CREATE INDEX IF NOT EXISTS idx_alertas_contrato ON alertas_contrato(contrato_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_contrato(tipo);
CREATE INDEX IF NOT EXISTS idx_consultas_contrato ON consultas_chat(contrato_id);
CREATE INDEX IF NOT EXISTS idx_fechas_contrato ON fechas_importantes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_fechas_fecha ON fechas_importantes(fecha);

-- =====================================================
-- FUNCIÓN: Actualizar timestamp automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_contratos_updated_at ON contratos;
CREATE TRIGGER update_contratos_updated_at
    BEFORE UPDATE ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTA: resumen_contratos
-- Vista para obtener resumen rápido de contratos
-- =====================================================
CREATE OR REPLACE VIEW resumen_contratos AS
SELECT
    c.id,
    c.archivo_nombre,
    c.arrendador_nombre,
    c.arrendatario_nombre,
    c.direccion_inmueble,
    c.ciudad,
    c.canon_mensual,
    c.fecha_inicio,
    c.duracion_meses,
    c.estado,
    c.score_riesgo,
    c.created_at,
    COUNT(DISTINCT a.id) FILTER (WHERE a.tipo = 'danger') as alertas_criticas,
    COUNT(DISTINCT a.id) FILTER (WHERE a.tipo = 'warning') as alertas_advertencia,
    COUNT(DISTINCT a.id) as total_alertas
FROM contratos c
LEFT JOIN alertas_contrato a ON c.id = a.contrato_id
GROUP BY c.id;

-- =====================================================
-- TABLA: whatsapp_sessions
-- Sesiones de WhatsApp para el bot de InmoLawyer
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,

    -- Estado de la conversacion
    state VARCHAR(20) DEFAULT 'IDLE', -- IDLE, ANALYZING, CHATTING
    active_contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,

    -- Rate limiting
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count_today INTEGER DEFAULT 0,
    last_count_reset DATE DEFAULT CURRENT_DATE,

    -- Metadata
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_state ON whatsapp_sessions(state);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE contratos IS 'Tabla principal que almacena los contratos de arrendamiento y sus datos extraídos';
COMMENT ON TABLE alertas_contrato IS 'Alertas y problemas legales detectados en cada contrato';
COMMENT ON TABLE incrementos_calculados IS 'Historial de incrementos anuales calculados según IPC';
COMMENT ON TABLE consultas_chat IS 'Historial de interacciones con el agente IA';
COMMENT ON TABLE fechas_importantes IS 'Fechas clave para notificaciones y recordatorios';
COMMENT ON TABLE ipc_historico IS 'Datos históricos del IPC de Colombia para cálculo de incrementos';
COMMENT ON TABLE whatsapp_sessions IS 'Sesiones del bot de WhatsApp - estado por usuario y rate limiting';
