# InmoLawyer — Briefing Frontend Multi-Documento

> Este documento es para que un agente Claude en otra sesion pueda implementar
> el frontend multi-tipo sin contexto previo. Lee esto ANTES de tocar cualquier archivo.

---

## 1. Que es InmoLawyer

App web que analiza documentos legales inmobiliarios colombianos con IA.
El usuario sube un PDF/DOCX, la IA lo analiza y muestra: score de riesgo (0-100),
alertas legales, datos extraidos y resumen.

## 2. Estado actual del backend (YA DESPLEGADO, NO TOCAR)

El backend (n8n + Gemini 2.5 Flash) ya soporta 4 tipos de documento:

| Tipo | Marco Legal | Keyword Detection |
|------|-------------|-------------------|
| `ARRIENDO_VIVIENDA` | Ley 820/2003 | Fallback (default) |
| `ARRIENDO_COMERCIAL` | C. Comercio Arts. 518-524 | "arrendamiento" + "local comercial"/"bodega" |
| `PROMESA_COMPRAVENTA` | C. Civil Art. 1611 | "promesa de compraventa"/"promitente" |
| `CERT_LIBERTAD` | Ley 1579/2012 | "certificado de tradicion" + "libertad" |

**El backend clasifica automaticamente.** El frontend NO necesita clasificar.

## 3. Esquemas de respuesta del backend

### 3A. ARRIENDO_VIVIENDA (formato legacy, ya funciona en el front)

```json
{
  "tipo_documento": "ARRIENDO_VIVIENDA",
  "score_riesgo": 75,
  "resumen": "...",
  "partes": {
    "arrendador": { "nombre": "...", "documento": "..." },
    "arrendatario": { "nombre": "...", "documento": "..." },
    "deudores_solidarios": [{ "nombre": "...", "documento": "...", "tipo": "fiador" }]
  },
  "inmueble": { "direccion": "...", "ciudad": "...", "tipo": "apartamento" },
  "condiciones": {
    "canon_mensual": 1500000,
    "fecha_inicio": "2025-01-15",
    "duracion_meses": 12,
    "deposito": 0,
    "incremento_anual": "IPC + 1%"
  },
  "alertas": [{
    "tipo": "critica",
    "titulo": "Deposito Ilegal",
    "descripcion": "...",
    "referencia_legal": "Art. 16 Ley 820/2003",
    "recomendacion": "...",
    "es_clausula_abusiva": true
  }],
  "incrementos_ipc": [{
    "anio": 2026, "ipc_certificado": 5.28,
    "canon_actual": 1500000, "canon_proyectado": 1579200
  }],
  "fechas_importantes": {
    "notificacion_incremento": "2025-12-15",
    "notificacion_desocupacion": "2025-10-15",
    "proximo_incremento": { "fecha": "2026-01-15" },
    "dias_para_vencimiento": 275
  }
}
```

### 3B. NUEVOS TIPOS (COMERCIAL, PROMESA, CERT) — Schema unificado

```json
{
  "tipo_documento": "ARRIENDO_COMERCIAL",
  "score_riesgo": 65,
  "score_labels": {
    "title": "Riesgo Alto — Clausulas Ineficaces",
    "description": "Contiene estipulaciones contrarias al Art. 524 C.Co."
  },
  "campos_display": [
    { "label": "Arrendador", "value": "INVERSIONES S.A.S.", "icon": "user" },
    { "label": "Arrendatario", "value": "RESTAURANTE X S.A.S.", "icon": "user" },
    { "label": "Canon Mensual", "value": "$8.500.000", "icon": "dollar-sign" },
    { "label": "Duracion", "value": "18 meses", "icon": "calendar" },
    { "label": "Local", "value": "CC Plaza Norte, Local 201", "icon": "map-pin" },
    { "label": "Ciudad", "value": "Bogota D.C.", "icon": "building" }
  ],
  "alertas": [{
    "tipo": "danger",
    "titulo": "Renuncia al Derecho de Renovacion",
    "descripcion": "...",
    "referencia_legal": "Art. 518, 524 Codigo de Comercio",
    "es_clausula_abusiva": true
  }],
  "resumen": "...",
  "datos_extraidos": { ... },
  "secciones_extra": {
    "derechos_comerciales": [
      { "label": "Derecho de renovacion", "estado": "RENUNCIADO (ineficaz)" },
      { "label": "Cesion al vender", "estado": "PROHIBIDA (ineficaz)" }
    ]
  }
}
```

**Diferencias clave entre schema vivienda vs unificado:**

| Aspecto | Vivienda (legacy) | Nuevos tipos (unificado) |
|---------|-------------------|--------------------------|
| Campos | Campos fijos: `arrendador_nombre`, `canon`, etc. | Array `campos_display` dinamico |
| Alertas tipo | `"critica"`, `"advertencia"`, `"info"` | `"danger"`, `"warning"`, `"info"` |
| Score labels | Hardcoded en frontend | `score_labels.title` + `.description` del backend |
| Secciones | `incrementos_ipc`, `fechas_importantes`, `deudores_solidarios` | `secciones_extra` (objeto con keys variables) |
| Resumen | `data.analisis.resumen` (nested) | `data.resumen` (top-level) |

**IMPORTANTE:** El nodo "Procesar Respuesta LLM" en n8n normaliza `danger` → `critica` para vivienda,
pero los nuevos tipos llegan con `danger`/`warning`/`info`. El frontend ya soporta ambos en `getAlertIcon()`.

## 4. Frontend actual — Archivos clave

Todos en: `/Users/feche/Documents/Obsidian Vault/Inmotools/InmoLawyer/`

| Archivo | Que hace | Que cambiar |
|---------|----------|-------------|
| `results-renderer.js` | **ARCHIVO PRINCIPAL A MODIFICAR.** Renderiza resultados. Tiene extension points marcados con `// MULTI-DOC EXTENSION POINT` | Implementar `campos_display` renderer + `secciones_extra` |
| `app.html` | HTML completo. Seccion `#resultsSection` (lineas 494-700+) tiene estructura fija de vivienda | Agregar contenedores dinamicos para secciones_extra |
| `styles.css` | 72KB de CSS. Ya tiene `.alert.danger`, `.alert.critica`, `.alert.warning` | Agregar estilos para secciones_extra y badge tipo documento |
| `pdf-generator.js` | Genera PDF del informe. Ya usa `data.tipo_documento_label` con fallback | Agregar renderizado de campos_display y secciones_extra |
| `upload.js` | Sube archivo y pollea resultado. NO TOCAR para multi-doc | — |
| `config.js` | Endpoints API. NO TOCAR | — |
| `auth.js` | Auth Supabase. NO TOCAR | — |

## 5. Que debe hacer el frontend (tareas concretas)

### 5A. Detectar tipo de documento y adaptar UI

```javascript
// En displayResults(data):
const tipo = data.tipo_documento || 'ARRIENDO_VIVIENDA';

if (tipo === 'ARRIENDO_VIVIENDA') {
  // Renderizado legacy actual (displayContractDataFixed, incrementos, fechas, deudores)
} else {
  // Renderizado unificado (campos_display, secciones_extra)
}
```

### 5B. Renderizar `campos_display` (reemplaza campos fijos)

Los nuevos tipos envian un array `campos_display`. Renderizar como grid de 2 columnas:
```javascript
data.campos_display.forEach(campo => {
  // campo.label: "Arrendador"
  // campo.value: "INVERSIONES S.A.S."
  // campo.icon: "user" (lucide icon name, opcional)
});
```

### 5C. Renderizar `secciones_extra` (reemplaza incrementos/fechas/deudores)

Cada tipo tiene secciones distintas:

- **ARRIENDO_COMERCIAL**: `secciones_extra.derechos_comerciales` → lista de derechos con estado (RENUNCIADO/RESPETADO/etc)
- **PROMESA_COMPRAVENTA**: `secciones_extra.checklist_prefirma` → items con estado (NO ANEXO, VERIFICADO, etc)
- **CERT_LIBERTAD**: `secciones_extra.estado_anotaciones` → anotaciones con tipo y estado (VIGENTE, CANCELADA, etc)

### 5D. Usar `score_labels` del backend

Ya hay un extension point en `displayRiskScore()` linea 86. Los nuevos tipos envian:
```json
"score_labels": { "title": "...", "description": "..." }
```
Ya funciona parcialmente — solo verificar que se usa cuando viene.

### 5E. Mostrar badge de tipo de documento

Agregar un badge visible arriba de los resultados:
- "Contrato de Arriendo Comercial"
- "Promesa de Compraventa"
- "Certificado de Libertad y Tradicion"
- "Contrato de Arriendo de Vivienda"

### 5F. Ocultar secciones no relevantes

Para tipos nuevos, ocultar:
- Seccion "Incrementos IPC" (solo aplica vivienda)
- Seccion "Fechas Importantes" (solo aplica vivienda)
- Seccion "Deudores Solidarios" (solo aplica vivienda)

## 6. Diseno visual (referencia Pencil)

Se diseñaron 4 pantallas en Pencil MCP (.pen file). El estilo es:

- **Font**: Outfit (Google Fonts)
- **Background**: #F5F4F1 (cream)
- **Primary/success**: #3D8A5A (green)
- **Danger**: #D08068 (coral)
- **Warning**: #D4A64A (amber)
- **Text**: #1A1918 (dark), #6D6C6A (body), #9C9B99 (muted)
- **Borders**: #E5E4E1

**Score circle**: fondo #FFF0F0 con borde coral (danger) o verde (low risk)

**Alertas**: cards con fondo #FFF0F0 (danger) o #FFFBF0 (warning), borde semitransparente

**Secciones contextuales**: cada item tiene icono de estado (circle-check verde, circle-x rojo, triangle-alert amarillo/rojo)

**CTAs**: boton primario verde "Descargar Informe PDF" + secundario outlined "Consultar con IA"

> NOTA: El frontend actual usa un estilo diferente (mas "app" con sidebar).
> No es necesario cambiar TODO al estilo Pencil — solo adaptar la logica de
> renderizado multi-tipo al estilo existente del frontend.

## 7. Integracion con WhatsApp

Si se esta construyendo un flujo de WhatsApp que envia resultados de analisis,
la respuesta del backend es la misma (schema unificado). El webhook de WhatsApp
es `/webhook/inmolawyer-wa` (workflow `EOGdNBEB1268Mfxb`, actualmente inactivo).

Los campos que necesitarias para un mensaje de WhatsApp:
- `tipo_documento` → para el titulo
- `score_riesgo` → para el score
- `alertas[].titulo` + `alertas[].tipo` → resumen de alertas
- `resumen` → texto principal
- `campos_display` → datos del documento (nuevos tipos)

## 8. API endpoints relevantes

```
POST https://n8n.feche.xyz/webhook/analizar-contrato   → Analisis (usuarios registrados)
GET  https://n8n.feche.xyz/webhook/status?job_id=X      → Poll resultado
POST https://n8n.feche.xyz/webhook/analizar-guest        → Analisis (freemium)
GET  https://n8n.feche.xyz/webhook/guest-result?token=X  → Poll resultado guest
POST https://n8n.feche.xyz/webhook/consulta-contrato     → Chat IA
```

## 9. Archivos que NO tocar

- `n8n-flow/` — prompts y workflow, ya desplegados en produccion
- `legal/` — research legal, referencia solamente
- `auth.js` — tiene rate limiting client-side, no modificar
- `config.js` — endpoints configurados correctamente
- `payments.js` — integracion Wompi, no relacionado

## 10. Como probar

1. Subir un PDF de prueba (hay ejemplos en `test-docs/`)
2. El backend clasifica automaticamente
3. Verificar que el frontend renderiza correctamente segun `tipo_documento`
4. Probar con los 4 tipos

Para generar PDFs de prueba sinteticos, usar Python con reportlab:
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
c = canvas.Canvas("test-promesa.pdf", pagesize=letter)
c.drawString(72, 700, "PROMESA DE COMPRAVENTA")
c.drawString(72, 680, "Entre PROMITENTE VENDEDOR: Maria Gutierrez")
# ... agregar clausulas problematicas para generar alertas
c.save()
```

---

**Resumen ejecutivo**: El backend ya soporta 4 tipos. El frontend solo renderiza vivienda.
Hay que implementar el renderizado dinamico usando `tipo_documento`, `campos_display`,
`score_labels` y `secciones_extra` que ya vienen del backend. El archivo principal
a modificar es `results-renderer.js` con su HTML correspondiente en `app.html`.
