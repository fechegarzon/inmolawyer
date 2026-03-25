# WhatsApp Bot — Arquitectura

**Workflow:** `EOGdNBEB1268Mfxb` | 32 nodos | n8n.feche.xyz

---

## Stack

| Componente | Tecnología |
|------------|-----------|
| Orquestación | n8n self-hosted (DigitalOcean) |
| WhatsApp middleware | Kapso (webhook + REST API) |
| Análisis IA | Gemini 2.5 Flash |
| Base de datos | Supabase (PostgreSQL) |
| Hosting | DigitalOcean Droplet + Caddy |

## Credenciales

| Servicio | Detalle |
|----------|---------|
| Kapso API | `POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages` |
| Kapso API Key | `2c24d6f18a25920ed06137de4dd576d64b8fbde34697a92149fba1c2afb01677` |
| Gemini API Key | `AIzaSyApbCywwzGN8ofNNSYwlfflLwWDzxU-CN4` |
| Supabase project | `oqipslfzbeioakfllohm` |
| phone_number_id | `1092418057282371` |
| Teléfono | +1 (555) 926-2711 |

---

## Flujo General

```
Webhook WhatsApp
    │
    ▼
Parsear Mensaje (4 formatos)
    │
    ▼
Preparar Hash
    │
    ├──► Check Consent DB
    │       │
    │       ▼
    │    Evaluar Consent ──► Pedir Consent (sin consent ni "acepto")
    │       │ (tiene consent o dice "acepto")
    │       ├──► Save Consent DB
    │       ▼
    │    Tipo de Mensaje (Switch)
    │       │
    │       ├─ [0] Texto ──► Manejar Texto ──► Enviar Respuesta WA + Log
    │       ├─ [1] Documento ──► [PIPELINE DOCS]
    │       ├─ [2] Imagen ──► [PIPELINE IMÁGENES]
    │       └─ [3] Otro ──► Formato No Soportado ──► Enviar + Log
    │
    └──► Log Msg Received (paralelo)
```

---

## Pipeline: Documentos (Switch output 1)

```
Tipo de Mensaje
    │
    ▼
Verificar Créditos (valida formato, prepara mediaUrl, mediaType)
    │
    ▼
Buscar Usuario WA (query bot_rate_limits)
    │
    ▼
Evaluar Créditos
    │
    ├─ canAnalyze=true:
    │     Analizar Contrato
    │       ├──► Enviar ACK (fire-and-forget, continueOnFail)
    │       └──► Download Media ──► [PIPELINE COMPARTIDO]
    │
    └─ canAnalyze=false:
          Rechazar Documento ──► Enviar Respuesta WA + Log
```

## Pipeline: Imágenes (Switch output 2)

```
Tipo de Mensaje
    │
    ▼
ACK Recibido ──► Enviar Respuesta WA (fire-and-forget ACK)
    │
    └──► Rate Limit Check ──► Get Rate Limit
                                   │
                                   ├─ No limitado:
                                   │    Evaluar Rate Limit
                                   │      ──► Upsert Rate Limit
                                   │      ──► Gemini Vision Gate (mediaId=imageId)
                                   │            ──► Download Media ──► [PIPELINE COMPARTIDO]
                                   │
                                   └─ Limitado:
                                        Rechazar Imagen ──► Enviar + Log
```

## Pipeline Compartido de Análisis

```
Download Media (HTTP GET mediaUrl, responseFormat: file)
    │
    ▼
Binary a Base64 (moveBinaryData, encoding: base64)
    │
    ▼
Llamar Gemini (Gemini 2.5 Flash, inline_data con base64, timeout 120s)
    │
    ▼
Formatear Análisis (score emoji, alertas, resumen)
    │
    ├──► Guardar Análisis Bot (Supabase, continueOnFail)
    ├──► Enviar Respuesta WA (continueOnFail)
    ├──► Log WA Response (continueOnFail)
    └──► Upsert RL Análisis (Supabase RPC upsert_rate_limit, continueOnFail)
```

---

## Tablas Supabase

| Tabla | Descripción | PK |
|-------|-------------|-----|
| `bot_events` | Registros de consentimiento | auto |
| `bot_rate_limits` | Límite 3 análisis/día | `(phone_hash, analysis_date)` |
| `bot_analyses` | Resultados de análisis | auto |
| `whatsapp_messages` | Log de mensajes | auto |
| `bot_errors` | Log de errores | auto |

**RPC:** `upsert_rate_limit` — incremento atómico del contador en `bot_rate_limits`

---

## Patrones Técnicos y Workarounds

### n8n 2.x Sandbox
- `require()` y `fetch()` bloqueados en Code nodes
- Todas las llamadas HTTP van por nodos HTTP Request

### n8n If Node v2 Bug
- Booleans se stringifican incorrectamente
- **Workaround:** Code node que retorna `[]` para filtrar (dual-output pattern)

### Binary Data en n8n 2.x
- `filesystem-v2`: `binaryData.data` devuelve referencia, no contenido
- **Solución:** Nodo `moveBinaryData` con `encoding: base64` antes de enviar a Gemini

### Dual-Output Pattern
- Dos Code nodes conectados al mismo upstream
- Cada uno filtra su caso opuesto con `return []`

### Fire-and-Forget
- `continueOnFail` activado en nodos no-críticos:
  - Enviar ACK
  - Enviar Respuesta WA
  - Log WA Response
  - Guardar Análisis Bot
  - Upsert RL Análisis

### Kapso Webhook Format
- Modo batch: payload con array `data[]` (debounce 5s)
- El parser acepta 4 formatos para flexibilidad en testing

### Rate Limiting
- 3 análisis/día por `phone_hash`
- Almacenado en `bot_rate_limits` con PK compuesta `(phone_hash, analysis_date)`
- Incremento atómico via Supabase RPC `upsert_rate_limit`
