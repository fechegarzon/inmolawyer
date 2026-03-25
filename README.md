# InmoLawyer

Hub legal de finca raiz -- analisis de contratos de arrendamiento con IA, basado en **Ley 820 de 2003**.

## What it does

Upload a rental contract (PDF, image, or text) and get:
- ⚠️ **Abusive clause detection** with legal references
- 📈 **IPC increment calculator** — historical inflation adjustments (DANE Colombia 2014–2025)
- 🔒 **Risk scoring** (0–100)
- 💬 **AI chat** — ask questions about your specific contract

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS + Supabase JS SDK |
| Auth + DB | Supabase (Auth + PostgreSQL) |
| Backend | n8n self-hosted workflow engine |
| AI | Gemini 2.5 Flash (legal analysis) + Gemini Vision (OCR) |
| Deploy | DigitalOcean + Caddy |

## Architecture

```
WhatsApp (Kapso) ←— canal primario
  ↕
n8n Webhooks (n8n.feche.xyz)
  ↕                ↕
Google Gemini API   Supabase (Auth + PostgreSQL)
                      ↕
                   Browser (Supabase JS SDK) ←— canal web
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/analizar-contrato` | Upload + analyze contract |
| GET | `/webhook/status?job_id=...` | Check analysis status |
| POST | `/webhook/consulta-contrato` | Chat about a contract |

## WhatsApp endpoints

| Trigger | Description |
|---------|-------------|
| Kapso webhook (inbound) | Recibe foto/PDF del contrato via WhatsApp |
| Kapso reply (outbound) | Envia resultado + disclaimer al usuario |
| Kapso document (outbound) | Envia carta de reclamacion como PDF |

## Quick test

```bash
curl -X POST "https://n8n.feche.xyz/webhook/analizar-contrato" \
  -F "file=@ejemplo_contrato.txt;type=text/plain" \
  -F "user_id=00000000-0000-0000-0000-000000000001" \
  -F "user_email=test@inmolawyer.co"
```

## Setup

See `n8n-flow/README.md` for n8n workflow setup instructions.

## Legal basis

- Ley 820 de 2003 (Arrendamiento de Vivienda Urbana)
- Decreto 2331 de 2001
- Circular 001 de 2024 (SIC -- clausulas abusivas)

**Disclaimer:** InmoLawyer usa IA para analizar contratos. No somos abogados ni firma legal. Para decisiones legales, consulta un profesional.
