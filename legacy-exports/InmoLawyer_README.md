# InmoLawyer - Análisis de Contratos de Arrendamiento

Sistema de análisis automático de contratos de arrendamiento en Colombia basado en la **Ley 820 de 2003**.

## Descripción

InmoLawyer es un flujo de n8n que permite a abogados inmobiliarios colombianos:

1. **Analizar contratos** de arrendamiento automáticamente
2. **Detectar cláusulas abusivas** según la Ley 820
3. **Responder consultas legales** usando IA (Gemini 2.5 Flash)
4. **Calcular incrementos** de arriendo según el IPC

---

## Endpoints Disponibles

### 1. POST `/analizar-contrato`

Analiza un contrato de arrendamiento y extrae datos clave.

**Request:**
```json
{
  "texto": "CONTRATO DE ARRENDAMIENTO\n\nARRENDADOR: Welcome District SAS NIT 9008936947\nARRENDATARIO: Natalia Nallino Camacho C.C. 1018494433\nCanon de Arrendamiento: $1.200.000 mensuales\nDirección: Carrera 7B 127a-33 Apto 302\nCiudad: Bogotá D.C.\n..."
}
```

**Response:**
```json
{
  "success": true,
  "contrato_id": "CTR-1706123456789-abc123def",
  "datos": {
    "arrendador": {
      "nombre": "Welcome District SAS",
      "documento": "9008936947",
      "tipoDoc": "NIT"
    },
    "arrendatario": {
      "nombre": "Natalia Nallino Camacho",
      "documento": "1018494433",
      "tipoDoc": "C.C."
    },
    "canon": 1200000,
    "direccion": "Carrera 7B 127a-33 Apto 302",
    "ciudad": "Bogotá D.C.",
    "fecha_inicio": "2024-01-15",
    "duracion_meses": 12
  },
  "alertas": [
    {
      "tipo": "danger",
      "titulo": "Depósito en dinero detectado",
      "descripcion": "El contrato exige un depósito de $2.400.000. Esto está PROHIBIDO por el Art. 16 de la Ley 820.",
      "referencia_legal": "Art. 16 Ley 820 de 2003",
      "es_clausula_abusiva": true
    }
  ],
  "score_riesgo": 75,
  "resumen": "Contrato con cláusulas potencialmente ilegales...",
  "recomendaciones": ["Solicitar eliminación del depósito", "..."]
}
```

---

### 2. POST `/consulta-contrato`

Permite hacer preguntas sobre un contrato específico.

**Request:**
```json
{
  "contrato_id": "CTR-1706123456789-abc123def",
  "pregunta": "¿Pueden subirme el arriendo más del IPC?"
}
```

**Response:**
```json
{
  "success": true,
  "contrato_id": "CTR-1706123456789-abc123def",
  "pregunta": "¿Pueden subirme el arriendo más del IPC?",
  "respuesta": "No. Según el Artículo 20 de la Ley 820 de 2003, el reajuste anual del canon NO puede superar el 100% del IPC del año anterior. Si su arrendador intenta cobrarle más, usted tiene derecho a...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. POST `/calcular-incremento`

Calcula el incremento máximo permitido según el IPC.

**Request:**
```json
{
  "canon_actual": 1200000,
  "anio": 2024,
  "fecha_inicio_contrato": "2023-01-15",
  "incremento_propuesto": 1350000
}
```

**Response:**
```json
{
  "success": true,
  "calculo": {
    "canon_actual": 1200000,
    "canon_actual_formateado": "$1.200.000",
    "ipc_aplicable": 9.28,
    "ipc_anio": 2023,
    "incremento_maximo_porcentaje": 9.28,
    "incremento_maximo_pesos": 111360,
    "nuevo_canon_maximo": 1311360,
    "nuevo_canon_formateado": "$1.311.360"
  },
  "alertas": [
    {
      "tipo": "danger",
      "mensaje": "El incremento propuesto (12.5%) excede el IPC permitido (9.28%). Esto es ILEGAL.",
      "exceso_pesos": 38640
    }
  ],
  "base_legal": {
    "articulo": "Artículo 20",
    "ley": "Ley 820 de 2003"
  }
}
```

---

## Instalación

### 1. Configurar Base de Datos

Ejecuta el script `InmoLawyer_database.sql` en tu servidor PostgreSQL:

```bash
psql -U tu_usuario -d tu_base_datos -f InmoLawyer_database.sql
```

### 2. Importar Workflow en n8n

1. Abre n8n
2. Ve a **Settings** → **Import from File**
3. Selecciona `InmoLawyer_n8n_workflow.json`
4. Configura las credenciales

### 3. Configurar Credenciales

#### PostgreSQL
- **Host:** tu-servidor-postgres
- **Database:** inmolawyer
- **User:** tu_usuario
- **Password:** tu_password
- **Port:** 5432

#### Google Gemini API
- **API Key:** tu-api-key-de-google-gemini

---

## Estructura del Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO 1: ANALIZAR CONTRATO                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Webhook]  →  [Extraer Datos]  →  [Guardar DB]  →  [Gemini IA]    │
│     │              │                    │               │          │
│     │              │                    │               ▼          │
│     │              │                    │        [Procesar]        │
│     │              │                    │               │          │
│     │              │                    │               ▼          │
│     │              │                    │       [Guardar Alertas]  │
│     │              │                    │               │          │
│     │              │                    │               ▼          │
│     └──────────────┴────────────────────┴────────► [Responder]     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO 2: CONSULTA CHAT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Webhook]  →  [Obtener Contrato]  →  [¿Existe?]                   │
│                                           │                        │
│                              ┌────────────┴────────────┐           │
│                              ▼                         ▼           │
│                        [Gemini IA]              [Error 404]        │
│                              │                                     │
│                              ▼                                     │
│                     [Guardar Consulta]                             │
│                              │                                     │
│                              ▼                                     │
│                        [Responder]                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                FLUJO 3: CALCULAR INCREMENTO IPC                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Webhook]  →  [Calcular con IPC histórico]  →  [Responder]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Artículos Clave de la Ley 820 de 2003

| Artículo | Tema | Detección |
|----------|------|-----------|
| **Art. 16** | Prohibición de depósitos en dinero | ✅ Automática |
| **Art. 20** | Incremento máximo = IPC año anterior | ✅ Automática |
| **Art. 21** | Mora en pago del canon | ⚠️ Manual |
| **Art. 22** | Causales de terminación (arrendador) | ✅ Automática |
| **Art. 23** | Causales de terminación (arrendatario) | ✅ Automática |
| **Art. 24** | Preaviso de 3 meses | ✅ Automática |
| **Art. 25** | Indemnización por terminación anticipada | ⚠️ Manual |

---

## Patrones de Extracción (Regex)

El sistema extrae automáticamente:

- **Arrendador:** `ARRENDADOR[:\s]*nombre` + `NIT[:\s]*número`
- **Arrendatario:** `ARRENDATARIO[:\s]*nombre` + `C.C.[:\s]*número`
- **Canon:** `Canon[^0-9]*([0-9.,]+)` con variantes
- **Dirección:** `DIRECCIÓN[^:]*:[:\s]*dirección`
- **Ciudad:** Detección de ciudades colombianas principales
- **Fechas:** Múltiples formatos (dd/mm/yyyy, dd de mes de yyyy)
- **Duración:** `X meses` o `un año`

---

## Notas Importantes

1. **IPC Histórico:** La tabla `ipc_historico` debe actualizarse anualmente con los datos del DANE.

2. **Límites de Texto:** El texto del contrato se limita a 10,000 caracteres en la DB.

3. **Tokens de IA:** El análisis con Gemini 2.5 Flash usa ~4000 tokens por contrato.

4. **Seguridad:** Asegúrate de sanitizar las entradas para prevenir SQL injection.

---

## Licencia

Uso interno - InmoLawyer © 2024
