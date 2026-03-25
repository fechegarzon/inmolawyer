# WhatsApp Bot — Estado Actual

**Fecha:** 2026-03-16
**Workflow ID:** `EOGdNBEB1268Mfxb` (35 nodos)
**URL:** https://n8n.feche.xyz/webhook/inmolawyer-wa-evo

---

## Estado General

| Componente | Estado |
|------------|--------|
| Pipeline E2E (webhook → análisis → respuesta) | ✅ Funcional |
| Envío de mensajes WhatsApp | ✅ Funcional (Evolution API) |
| Análisis de documentos (PDF) | ⚠️ Pendiente test E2E con Evolution |
| Análisis de imágenes | ⚠️ Pendiente test E2E con Evolution |
| Comandos de texto | ✅ Funcional |
| Consent flow | ✅ Funcional |
| Rate limiting (3/día) | ✅ Funcional |
| Logging (whatsapp_messages) | ✅ Funcional |

## Migración: Kapso → Evolution API (2026-03-16)

### Problema resuelto
- **Error Meta #131037:** "display name needs approval" bloqueaba envío de mensajes via Kapso/Meta Cloud API
- **Solución:** Evolution API (open-source, basado en Baileys) conecta via WhatsApp Web protocol, sin depender de Meta Cloud API

### Infraestructura Evolution API
- **Image:** `evoapicloud/evolution-api:v2.3.7` (Docker)
- **DB:** PostgreSQL 15 Alpine (contenedor `evolution-db`, port 5433)
- **Network:** host mode (port 8080 directo)
- **API Key:** `6dd817f0541a3cd280d8e9b9b09d79ab52d73a14abe1735e6d3ee1b95cab3191`
- **Instance:** `inmolawyer`
- **Teléfono vinculado:** +57 301 184 8771 (pairing code)
- **UFW:** port 8080 abierto
- **Swap:** 2GB creado para manejar RAM limitada (1GB droplet)
- **Bug fix:** v2.2.3 tenía [QR infinite reconnection loop](https://github.com/EvolutionAPI/evolution-api/pull/2365), resuelto en v2.3.7

### Cambios en workflow n8n
| Nodo | Cambio |
|------|--------|
| **Webhook Evolution** (NUEVO) | Path `/inmolawyer-wa-evo`, reemplaza Webhook WhatsApp |
| **Parsear Mensaje** | Agregado formato Evolution API como primer check |
| **Enviar Respuesta WA** | URL cambiada a Evolution API sendText |
| **Enviar ACK** | URL cambiada a Evolution API sendText |
| **Download Media** | POST a getBase64FromMediaMessage (antes GET Kapso) |
| **Evo Base64 Adapter** (NUEVO) | Extrae base64 del response de Evolution API |
| **Binary a Base64** | Desconectado (preservado para rollback) |
| **Webhook WhatsApp** | Desconectado (preservado para rollback) |

### Endpoints Evolution API usados
- `POST /message/sendText/inmolawyer` — Enviar mensajes de texto
- `POST /chat/getBase64FromMediaMessage/inmolawyer` — Descargar media como base64
- `POST /webhook/set/inmolawyer` — Configurar webhook
- `GET /instance/connectionState/inmolawyer` — Verificar conexión
- `POST /instance/connect/inmolawyer` — Obtener QR/reconectar

## Qué Funciona (verificado 2026-03-16)

- Recepción de webhooks (Evolution API format, messages.upsert)
- Parseo de mensajes: 5 formatos (Evolution API + 4 legacy)
- Envío de respuestas via Evolution API sendText
- Flujo de consentimiento completo
- Logging en whatsapp_messages (0 errores en bot_errors)
- Ignorar mensajes propios (fromMe filter)

## Pendientes

| Prioridad | Item |
|-----------|------|
| 🟡 Medio | Test E2E: enviar PDF y verificar análisis completo |
| 🟡 Medio | Test E2E: enviar imagen y verificar análisis |
| 🟡 Medio | DNS: agregar A record `evolution.feche.xyz` → 157.245.126.107 |
| 🟡 Medio | Cuando DNS propague: actualizar SERVER_URL y Enviar endpoints a HTTPS |
| 🟢 Bajo | Comandos avanzados (carta, registro, mis contratos) |
| 🟢 Bajo | SMTP real para notificaciones email |
| 🟢 Bajo | Monitoreo: alertar si Evolution API se desconecta |
