# InmoLawyer — Casos de Prueba (Ground Truth)

Este archivo define qué debe detectar el sistema para cada contrato de prueba.
Úsalo para validar cambios al prompt del LLM antes de desplegar a producción.

---

## Cómo usar este archivo

Para cada contrato:
1. Sube el PDF a InmoLawyer
2. Compara el resultado con las expectativas documentadas aquí
3. Marca ✅ si el resultado es correcto, ❌ si falla

---

## Caso 1 — Contrato sin cláusulas abusivas (referencia "limpia")

**Archivo:** `ejemplo_contrato_limpio.pdf` (por crear)
**Descripción:** Contrato modelo completamente conforme a Ley 820

**Expectativas:**
- Score: 0–25 (Riesgo Bajo)
- Alertas críticas: 0
- Alertas advertencia: 0 (máximo 1 informativa)
- No debe aparecer ninguna alerta de depósito, incremento, ni penalidades

---

## Caso 2 — Contrato con múltiples violaciones (ejemplo_contrato.txt)

**Archivo:** `ejemplo_contrato.txt`
**Cláusulas problemáticas conocidas:**

| Cláusula | Violación esperada | Tipo alerta | Art. |
|---|---|---|---|
| Depósito $2.000.000 (canon $1.500.000) | Cualquier depósito en efectivo es ilegal (no importa el monto) | CRÍTICA | Art. 16 |
| Incremento fijo 10% independiente del IPC | Incremento ilegal | CRÍTICA | Art. 20 |
| Terminación sin preaviso | Sin preaviso 3 meses | CRÍTICA | Art. 22 |
| Penalidad 3 meses de canon | **NO debe alertar** — 3 meses es el estándar válido en Colombia | ~~CRÍTICA~~ N/A | Art. 31 |
| Todas las reparaciones a cargo arrendatario | Reparaciones ilegales | CRÍTICA | Art. 30 |

**Expectativas (v3 corregida):**
- Score: 60–80 (Riesgo Alto/Muy Alto) — 4 críticas × 20 = 80 (penalidad de 3 meses ya NO es crítica)
- Alertas críticas: mínimo 3 de las 4 marcadas como CRÍTICA (depósito, incremento, terminación, reparaciones)
- La penalidad de 3 meses NO debe generar alerta (es estándar válido)
- Referencia: SOLO "Art. X Ley 820/2003", sin Código Civil

---

## Caso 3 — Contrato Natalia Nallino

**Archivo:** `Contrato de Arrendamiento.pdf` (con codeudor LUZ ALEIDA MELITON SOTO)
**Descripción:** Contrato regular con codeudor identificado

**Expectativas:**
- Deudores solidarios: `[{nombre: "LUZ ALEIDA MELITON SOTO", documento: "38901322", tipo: "codeudor"}]`
- Score: ajustado a cláusulas reales del contrato
- Alertas: según cláusulas específicas del documento

**Resultado conocido (sesión anterior):** 27 alertas detectadas — verificar si el nuevo prompt reduce las alertas fantasma

---

## Caso 4 — Contrato Villalobos (escaneado)

**Archivo:** `CONTRATO DE ARRIENDO SERGIO VILLALOBOS- LORENA ENCINALES.pdf`
**Descripción:** Contrato escaneado, 10 páginas, procesado por OCR

**Expectativas:**
- Deudores solidarios: `[{nombre: "SINPRO COLOMBIA S.A.S", documento: "900.464.817-6", tipo: "deudor solidario"}]`
- OCR exitoso (procesamiento en ~60s)
- Score y alertas según cláusulas reales

---

## Caso 5 — Contrato con persona jurídica arrendataria

**Archivo:** Contrato Grasas Y Derivados De Colombia S.A.S.
**Descripción:** Arrendatario es una S.A.S., inmueble de uso residencial

**Expectativas:**
- NO debe rechazarse (arrendatario empresa ≠ uso comercial)
- Debe analizarse normalmente con Ley 820
- Score y alertas según cláusulas reales del contrato

---

## Caso 6 — Contrato Federico Garzón Rodríguez y Nicolas Guerrero Sierra

**Archivo:** `CONTRATO_DE_ARRENDAMIENTO_-_FEDERICO_GARZÓN_RODRÍGUEZ_Y_NICOLAS_GUERRERO_SIERRA.pdf`
**Descripción:** Contrato sin co-deudores

**Expectativas:**
- `deudores_solidarios: []` (array vacío)
- Score y alertas según cláusulas reales

---

## Checklist de validación rápida (para cualquier contrato)

- [ ] Score es calculado correctamente (críticas×20 + advertencias×8 + info×2)
- [ ] Referencias legales usan SOLO "Art. X Ley 820/2003"
- [ ] No aparecen referencias al Código Civil o Código de Comercio
- [ ] Cualquier depósito en efectivo detectado como CRÍTICA (Art. 16) — sin importar el monto
- [ ] Penalidad de 1-3 meses de canon NO genera alerta (es válida)
- [ ] Penalidad > 3 meses o sin reciprocidad = ADVERTENCIA (Art. 31)
- [ ] Incremento sobre IPC detectado si aplica (Art. 20)
- [ ] Incremento cobrado antes de 12 meses detectado como ADVERTENCIA (Art. 20)
- [ ] Terminación por arrendador durante término inicial detectada como CRÍTICA (Art. 22)
- [ ] Acceso sin aviso del arrendador detectado como ADVERTENCIA (Art. 7)
- [ ] Deudores solidarios extraídos correctamente
- [ ] Fiador/codeudor solos NO generan alerta (son garantías válidas)
- [ ] Contratos limpios NO generan alertas falsas
- [ ] Persona jurídica arrendataria NO es causa de rechazo

---

## Historial de cambios al prompt

| Fecha | Versión | Cambio principal |
|---|---|---|
| 2026-02-20 | v1 | Prompt inicial (Art. 20, 16, 22, 30, 2, 7, 8) |
| 2026-02-20 | v2 | + Art. 3, 15, 17, 23, 24, 27, 31 + catálogo 13 cláusulas + rúbrica score objetiva |
| 2026-02-20 | v3 | Correcciones basadas en análisis de 13 videos YouTube (18k palabras): depósito = cualquier monto ilegal (no "> 1 mes"), penalidad 1-3 meses = válida (no crítica), + 3 cláusulas nuevas: terminación en término inicial, acceso sin aviso, incremento antes de 12 meses. Art. 18 documentado. |
