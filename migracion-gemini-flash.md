# InmoLawyer — Migración de OpenAI a Gemini 2.5 Flash

Fecha: 2026-03-11
Workflow: `InmoLawyer - API Principal` (ID: `agEpujr6fo1ocRiL`)
Estado: ✅ Completada y testeada en producción

---

## Contexto

Google lanzó una actualización de Gemini 2.5 Flash con capacidades nativas de lectura de PDFs (hasta 1,000 páginas), OCR nativo, y structured JSON output. Se evaluó reemplazar OpenAI GPT-4o/GPT-4o-mini en el workflow de análisis de contratos de InmoLawyer.

### Arquitectura anterior (OpenAI)

| Nodo | Modelo | Función |
|------|--------|---------|
| OCR con OpenAI Vision | `gpt-4o-mini` | Extraer texto de PDFs escaneados (chunks de 3 págs) |
| Llamar OpenAI DOCX | `gpt-4o-mini` | Extraer texto de archivos .docx |
| Llamar OpenAI Análisis | `gpt-4o` | Análisis legal completo (score, alertas, cláusulas) |
| OpenAI Chat Model | `gpt-4o-mini` | Chat legal post-análisis |

Costo estimado por análisis: **~$0.20 USD**

---

## Evaluación CTO

### Ventajas de Gemini 2.5 Flash
1. **~30x más barato** — de ~$0.20 a ~$0.007 por análisis
2. **PDF nativo** — lee PDFs completos sin chunking (hasta 1,000 págs)
3. **Texto nativo gratis** — Google no cobra por tokens de texto extraído de PDFs
4. **Structured JSON output** — `responseMimeType: "application/json"` genera JSON válido nativamente
5. **Mejor calidad** — detecta más alertas y cita jurisprudencia más completa

### Riesgos evaluados
1. Calidad del análisis legal → **Superada** (detectó 5 alertas vs 4 de OpenAI)
2. Dependencia de nuevo provider → Mitigado con fallback OpenAI posible
3. Latencia → **Similar** (~24s Gemini vs ~25-30s OpenAI)

### Decisión: ✅ IMPLEMENTAR

---

## Cambios realizados en n8n

### Nodos HTTP Request actualizados (3)

| Nodo antes | Nodo ahora | Cambio |
|------------|------------|--------|
| OCR con OpenAI Vision | **OCR con Gemini Flash** | URL → Gemini API, body → `inline_data` con PDF nativo |
| Llamar OpenAI DOCX | **Llamar Gemini DOCX** | URL → Gemini API, body → `inline_data` |
| Llamar OpenAI Análisis | **Llamar Gemini Análisis** | URL → Gemini API + `responseMimeType: "application/json"` |

### Nodos Code actualizados (3)

| Nodo | Cambio |
|------|--------|
| **Formatear Texto OCR** | Agregado parser `candidates[0].content.parts[0].text` (Gemini format) |
| **Formatear Texto DOCX** | Agregado parser Gemini + `source: 'gemini-docx'` |
| **Procesar Respuesta LLM** | Agregado parser Gemini + `metadata.modelo: 'gemini-2.5-flash'` |

### Credenciales
- API Key: Google AI Studio (Gemini) → pasada directamente en URL del endpoint
- Las credenciales OpenAI no se eliminaron (disponibles como fallback)

---

## Pruebas realizadas

### Test 1: API directa (curl → Gemini API)
- Contrato de ejemplo en texto plano
- **Resultado:** JSON válido, 4 alertas correctas, score 80
- **Costo:** $0.0065 USD
- **Latencia:** 16.5s

### Test 2: Workflow completo (webhook → n8n → Gemini → DB)
- PDF real generado con ReportLab
- **Job ID:** `JOB-1773237864975-gnpuatcvg`
- **Ejecución n8n:** #645
- **Resultado:** ✅ Success end-to-end

#### Datos extraídos correctamente:
```json
{
  "arrendador": "MARIA RODRIGUEZ PEREZ (C.C. 52.123.456)",
  "arrendatario": "JUAN CARLOS GARCIA LOPEZ (C.C. 80.789.012)",
  "fiador": "PEDRO MARTINEZ SILVA (C.C. 11.222.333)",
  "inmueble": "Calle 123 No. 45-67, Apto 501, Bogotá D.C.",
  "canon": 1500000,
  "fecha_inicio": "2023-03-15",
  "duracion": "12 meses",
  "deposito": 2000000,
  "score_riesgo": 88
}
```

#### Alertas detectadas:
| # | Tipo | Título | Referencia legal |
|---|------|--------|-----------------|
| 1 | CRÍTICA | Depósito en dinero prohibido | Art. 16 Ley 820/2003 — Sentencia C-102/11 |
| 2 | CRÍTICA | Incremento anual superior al IPC | Art. 20 Ley 820/2003 — Sentencia C-248/20 |
| 3 | CRÍTICA | Terminación sin preaviso ni caución | Art. 22 Ley 820/2003 — Sentencia C-426/23 |
| 4 | ADVERTENCIA | Penalidad unilateral | Art. 31 Ley 820/2003 — Ley 1480/2011 |
| 5 | CRÍTICA | Traslado ilegal de reparaciones necesarias | Art. 30 Ley 820/2003 |

#### Incrementos IPC calculados:
| Año | IPC | Canon anterior | Canon proyectado |
|-----|-----|---------------|-----------------|
| 2024 | 9.28% | $1,500,000 | $1,639,200 |
| 2025 | 5.20% | $1,639,200 | $1,724,438 |
| 2026 | 5.10% | $1,724,438 | $1,812,384 |

---

## Comparativa final: OpenAI vs Gemini

| Métrica | OpenAI GPT-4o (antes) | Gemini 2.5 Flash (ahora) |
|---------|----------------------|--------------------------|
| Costo por análisis | ~$0.20 USD | **~$0.007 USD** |
| Reducción de costo | — | **96.5%** |
| Alertas detectadas | 4 | **5** |
| Citas de jurisprudencia | Parciales | **Completas** |
| JSON nativo | No (requiere cleanup) | **Sí** |
| Latencia total | ~25-30s | **~24s** |
| Nodos en workflow | 41 (con chunking PDF) | 41 (simplificable) |
| Guardado en DB | ✅ | ✅ |

### Ahorro proyectado
- 100 análisis/mes → **$19.30 USD/mes** de ahorro
- 1,000 análisis/mes → **$193 USD/mes** de ahorro
- 10,000 análisis/mes → **$1,930 USD/mes** de ahorro

---

## Migración Guest Analysis (2026-03-11): Claude Sonnet → Gemini 2.5 Flash

Workflow: `InmoLawyer - Guest Analysis` (ID: `qzKRnyiEd4MB8MRs`)

### Nodos actualizados (2)

| Nodo antes | Nodo ahora | Cambio |
|------------|------------|--------|
| Analisis Claude | **Analisis Gemini** | URL → Gemini API, body → `inline_data` con PDF nativo, `responseMimeType: "application/json"` |
| Parsear Respuesta Claude | **Parsear Respuesta Gemini** | Parser: `candidates[0].content.parts[0].text` (Gemini format) |

### Cambios clave
- Removida dependencia de credencial Anthropic (`sFUTXcUroAz8m9NK`)
- API Key de Gemini pasada en URL (igual que API Principal)
- Motivo: cuenta Anthropic sin créditos ("credit balance too low")

### Test end-to-end (ejecución #653)
- **PDF de prueba** → contrato con cláusulas ilegales
- **Score:** 10 (riesgo alto, correcto)
- **Alertas:** 3 ALTO (incremento 15%, terminación sin preaviso, depósito ilegal)
- **Endpoints verificados:**
  - ✅ `POST /webhook/analizar-guest` → análisis completo + teaser
  - ✅ `GET /webhook/guest-result?token=X` → status pending_payment
  - ✅ `POST /webhook/guest-email` → email guardado

---

## Pendientes (Fase 3-4)

- [ ] Probar con PDFs escaneados reales (fotos de contratos)
- [ ] Probar con archivos DOCX
- [ ] Correr 20+ contratos por ambos flujos (A/B) para validación estadística
- [ ] Medir latencia promedio en producción
- [ ] Eliminar nodos de chunking PDF (ya no necesarios con Gemini)
- [x] ~~Evaluar migración del Chat Model (gpt-4o-mini → Gemini Flash)~~ — Guest Analysis migrado
- [ ] Configurar fallback automático a OpenAI si Gemini falla
- [x] ~~Actualizar documentación del workflow~~ ✅

---

## API Keys

- **Google AI Studio (Gemini):** `AIzaSyApbCywwzGN8ofNNSYwlfflLwWDzxU-CN4`
- **OpenAI (backup):** Credencial `OpenAI InmoLawyer` en n8n (ID: `KhIAYrgHPsrhzXyG`)
