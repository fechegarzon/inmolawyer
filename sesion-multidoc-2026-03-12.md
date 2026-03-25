# InmoLawyer Multi-Documento — Sesion 2026-03-12

## Objetivo
Expandir InmoLawyer de solo contratos de arriendo de vivienda a 4 tipos de documento legal inmobiliario.

## Tipos de documento
| Tipo | Marco Legal | Estado |
|------|-------------|--------|
| ARRIENDO_VIVIENDA | Ley 820/2003 | Ya existia |
| ARRIENDO_COMERCIAL | Codigo de Comercio Arts. 518-524 | Nuevo |
| PROMESA_COMPRAVENTA | Codigo Civil Art. 1611 | Nuevo |
| CERT_LIBERTAD | Ley 1579/2012 | Nuevo |

## Lo que se hizo en conversaciones anteriores (pre-sesion)

### Research legal (3 documentos)
- `legal/research-arriendo-comercial.md` (512 lineas) — renovacion, desahucio, preferencia, Art. 524 ineficacia
- `legal/research-promesa-compraventa.md` (617 lineas) — Art. 1611 requisitos, arras, clausula penal, jurisprudencia CSJ
- `legal/research-certificado-libertad.md` (585 lineas) — 7 grupos anotacion, regla espejo, falsa tradicion

### Prompts de analisis (por tipo)
- `n8n-flow/prompts/analisis-certificado-libertad.md` (305 lineas)
- `n8n-flow/prompts/analisis-promesa-compraventa.md` (288 lineas)
- Prompts de vivienda y comercial integrados en el orquestador

### Gate clasificador (Gemini Vision)
- `n8n-flow/prompts/gate-clasificador.md` (63 lineas) — prompt para clasificar PDFs con Vision
- `n8n-flow/prompts/gate-clasificador-code.js` (173 lineas) — validacion, routing, manejo de errores (BLURRY, NOT_LEGAL, UNKNOWN_TYPE, LOW_CONFIDENCE)

### Orquestador multi-tipo
- `n8n-flow/prompts/construir-texto-prompt-v2.js` (~500 lineas)
  - Clasificador por keywords en texto extraido
  - 4 prompts legales completos (PART1_VIV + PART2_VIV, PROMPT_COMERCIAL, PROMPT_PROMESA, PROMPT_CERT)
  - Schema de respuesta unificado para nuevos tipos
  - Deteccion: CERT_LIBERTAD > PROMESA > COMERCIAL > VIVIENDA (fallback)

### Allowlists anti-alucinacion
- `n8n-flow/prompts/allowlists-articulos.json` (13KB) — articulos legales permitidos por tipo

---

## Lo que se hizo en esta sesion (2026-03-12 ~22:00 UTC)

### 1. Diagnostico del estado
- Workflow en produccion: `agEpujr6fo1ocRiL` (InmoLawyer - API Principal), 41 nodos, activo
- Ultima actualizacion: 2026-03-11 (migracion Gemini Flash)
- Nodo "Construir Texto Prompt" solo tenia prompt de vivienda (11,292 chars)
- Nodo "Procesar Respuesta LLM" solo manejaba formato vivienda
- Nodo "Guardar Resultado v2" no tenia columna tipo_documento
- API key anterior habia expirado

### 2. API key n8n regenerada
- Key anterior: `...hi2OckhieoDP0X6C7B1TErKLoipzheYQgrcoOwYW-IA` (expirada)
- Key nueva: `...40dwmpZ9qZaixhhX8TpSAhxrnvKi08AQNYG_TwqKyxk` (expira ~2026-06-03)
- Actualizada en `/Users/feche/Documents/Obsidian Vault/API keys.md`

### 3. Deploy workflow multi-documento a n8n
**3 nodos modificados** (38 nodos sin cambios):

#### Nodo "Construir Texto Prompt" (11,292 → 23,173 chars)
- Reemplazado con contenido de `construir-texto-prompt-v2.js`
- Clasificador por keywords integrado
- 4 prompts legales completos
- Removido `api_body` con referencia a gpt-4o (produccion usa nodo HTTP separado para Gemini)
- Output: `{ texto_prompt, job_id, file_name, texto_contrato, texto_length, tipo_documento, ocr_error }`

#### Nodo "Procesar Respuesta LLM" (5,427 → 10,324 chars)
- Lee `tipo_documento` de "Construir Texto Prompt"
- Path ARRIENDO_VIVIENDA: logica legacy intacta (partes, inmueble, condiciones, incrementos_ipc, deudores_solidarios)
- Path unificado (COMERCIAL, PROMESA, CERT): procesa schema unificado (campos_display, secciones_extra, datos_extraidos)
- Normaliza alertas: mapea `danger` → `critica` para compatibilidad
- Todos los error handlers preservados (overload, OCR, parse)

#### Nodo "Guardar Resultado v2"
- SQL INSERT actualizado: incluye `COALESCE(d->>'tipo_documento', 'ARRIENDO_VIVIENDA')`
- ON CONFLICT clause preservada

**Push exitoso**: 2026-03-12T22:15:00.749Z, 41 nodos, activo

### 4. Migracion Supabase
- Proyecto: `oqipslfzbeioakfllohm` (InmoLawyer)
- Migracion: `add_tipo_documento_to_contratos`
  ```sql
  ALTER TABLE public.contratos ADD COLUMN tipo_documento text NOT NULL DEFAULT 'ARRIENDO_VIVIENDA';
  ALTER TABLE public.contratos ADD CONSTRAINT contratos_tipo_documento_check CHECK (tipo_documento IN ('ARRIENDO_VIVIENDA', 'ARRIENDO_COMERCIAL', 'PROMESA_COMPRAVENTA', 'CERT_LIBERTAD'));
  CREATE INDEX idx_contratos_tipo_documento ON public.contratos (tipo_documento);
  ```
- Registros existentes: todos quedan como ARRIENDO_VIVIENDA (correcto)

### 5. Memory actualizada
- `/Users/feche/.claude/projects/-Users-feche/memory/inmolawyer-multidoc.md` — estado completo del proyecto
- `/Users/feche/.claude/projects/-Users-feche/memory/MEMORY.md` — indice actualizado

---

## Lo que se hizo en sesion 2026-03-13

### 6. Test end-to-end (2026-03-12 22:40 UTC)
- **COMPLETADO**: 4 PDFs sinteticos con clausulas problematicas enviados al webhook
- Resultados:
  - ARRIENDO_VIVIENDA: score 100, 5 alertas (deposito, IPC, preaviso, mascotas, reparaciones)
  - ARRIENDO_COMERCIAL: score 95, 7 alertas (renovacion, restitucion, cesion, deposito, incremento, duracion, subarriendo)
  - PROMESA_COMPRAVENTA: score 100, 6 alertas (plazo, arras, eviccion, poder, inmueble, clausula penal)
  - CERT_LIBERTAD: score 85, 4 alertas (falsa tradicion, hipoteca, demanda, patrimonio familia)
- Clasificacion por keywords funciona correctamente para los 4 tipos
- Guardado en DB con tipo_documento correcto

### 7. Diseno UI multi-tipo en Pencil MCP
- **COMPLETADO**: 4 pantallas de resultado diseñadas en Pencil (.pen)
- Style guide: mobile-02-cleanminimal_light (Outfit font, cream #F5F4F1, green #3D8A5A, coral #D08068, amber #D4A64A)
- Pantallas completadas:

#### Pantalla 1: Arriendo Comercial (`fjtOG`)
- Score 95, Riesgo Alto (coral)
- Datos: Arrendador, Arrendatario, Canon, Duracion, Local, Ciudad
- 3 alertas visibles: Renuncia Renovacion (danger), Restitucion sin Proceso (danger), Deposito Excesivo (warning)
- Seccion "Derechos Comerciales": renovacion, cesion, preferencia, desahucio con iconos estado
- Resumen + CTAs (Descargar PDF, Consultar IA)

#### Pantalla 2: Arriendo Vivienda (`av6jl`)
- Adaptada con contenido Ley 820/2003
- Alertas de deposito, IPC, preaviso
- Seccion de verificaciones especifica vivienda

#### Pantalla 3: Promesa de Compraventa (`AMk4U`)
- Score 80, Riesgo Alto (coral)
- Datos: Promitente Vendedor (Maria Elena Gutierrez), Promitente Comprador (Carlos Andres Medina), Precio $380M, Escrituracion "Sin fecha definida", Inmueble (Apto 502 Torres del Parque), Arras $76M (20%)
- 3 alertas: Sin Plazo Escrituracion (danger, Art. 1611 CC), Arras Excesivas 20% (danger, Art. 1601 CC), Renuncia Eviccion (warning, Arts. 1893-1894 CC)
- Seccion "Checklist Pre-Firma": cert libertad NO ANEXO, paz y salvo NO VERIFICADO, poder IRREVOCABLE, clausula penal 30% EXCESIVA
- Resumen: recomienda NO firmar sin abogado

#### Pantalla 4: Certificado de Libertad (`Sm41o`)
- Score 65, Riesgo Alto (coral)
- Datos: Matricula 050C-01234567, Titular (Jorge Enrique Parra), Tipo Apartamento, Direccion Cra 15 #82-30, Ciudad Bogota Zona Norte, 12 anotaciones
- 3 alertas (todas danger): Falsa Tradicion (Ley 1579/2012 Grupo 080), Hipoteca Vigente $220M Bancolombia (Arts. 2432-2457 CC), Demanda Pertenencia Juzgado 15 (Art. 2512 CC)
- Seccion "Estado de Anotaciones": falsa tradicion SI, hipoteca VIGENTE, medida cautelar DEMANDA INSCRITA, patrimonio familia NO registrado
- Resumen: NO recomienda adquirir sin saneamiento tradicion

### Estructura comun de las 4 pantallas
```
Header (logo + back)
Badge tipo documento (verde)
Score circle (coral/amber segun riesgo)
Datos del Documento (6 campos label/value en grid 2 cols)
Alertas Detectadas (N alertas badge + cards danger/warning)
Seccion contextual (Derechos/Checklist/Anotaciones segun tipo)
Resumen (texto largo)
CTAs (Descargar PDF primary + Consultar IA secondary)
Disclaimer IA
```

---

## Pendientes

### Prioridad alta
- [x] **Test end-to-end**: completado, 4 tipos funcionan correctamente
- [x] **Diseño UI multi-tipo**: 4 pantallas completadas en Pencil
- [ ] **Implementar frontend**: convertir diseño Pencil a HTML/CSS/JS en `hub/public/inmolawyer/`

### Prioridad media
- [ ] **Allowlist validator**: integrar `allowlists-articulos.json` como nodo post-analisis en n8n
- [ ] **Gate clasificador Vision**: integrar clasificacion por imagen (Gemini Vision) para PDFs escaneados

### Prioridad baja
- [ ] **Sincronizar workflow local**: `inmolawyer_workflow.json` esta desactualizado vs produccion
- [ ] **Guest workflow**: el workflow guest (`qzKRnyiEd4MB8MRs`) tambien necesita multi-doc

---

## Arquitectura actual (post-sesion)

```
PDF/DOCX upload
    ↓
Webhook - Recibir Contrato
    ↓
Extraer Texto (PDF/DOCX/OCR Gemini Vision)
    ↓
Construir Texto Prompt ← ACTUALIZADO: clasifica tipo + selecciona prompt
    ↓
Llamar Gemini 2.5 Flash (analisis)
    ↓
Procesar Respuesta LLM ← ACTUALIZADO: maneja schema unificado + vivienda
    ↓
Guardar Resultado v2 ← ACTUALIZADO: columna tipo_documento
Guardar Alertas
Guardar Incrementos (solo vivienda)
    ↓
Responder con resultado
```

## Archivos relevantes
Todos bajo `/Users/feche/Documents/Obsidian Vault/Inmotools/InmoLawyer/`:
- `n8n-flow/prompts/construir-texto-prompt-v2.js` — orquestador multi-tipo (source of truth)
- `n8n-flow/prompts/gate-clasificador.md` — prompt Vision
- `n8n-flow/prompts/gate-clasificador-code.js` — validacion gate
- `n8n-flow/prompts/allowlists-articulos.json` — anti-alucinacion
- `n8n-flow/prompts/analisis-certificado-libertad.md` — prompt CERT standalone
- `n8n-flow/prompts/analisis-promesa-compraventa.md` — prompt PROMESA standalone
- `legal/research-arriendo-comercial.md` — research legal comercial
- `legal/research-promesa-compraventa.md` — research legal promesa
- `legal/research-certificado-libertad.md` — research legal cert libertad
