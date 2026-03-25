# Landing Audit — InmoLawyer
**Date:** 2026-03-03
**Goal:** trial (aumentar análisis iniciados — conversión primaria)
**Auditor:** Claude SEO Machine
**URL:** https://inmolawyer.surge.sh/

---

## Overall Score: 54/100

| Dimensión | Score | Prioridad |
|---|---|---|
| Above the Fold | 55/100 | 🔴 Alta |
| CTA Quality | 38/100 | 🔴 Alta |
| Trust Signals | 28/100 | 🔴 Alta |
| SEO Elements | 72/100 | 🟡 Media |
| Conversion Flow | 52/100 | 🟡 Media |

---

## 🔴 Problemas Críticos (Fix Primero)

### 1. CTAs sobre el fold son los equivocados
**Problema:** Los dos CTAs visibles en el hero son **"Ver Planes"** y **"Ver Cómo Funciona"**. Ninguno lleva al usuario a analizar su contrato — el objetivo principal de conversión.

**Impacto:** Usuarios con intención de analizar un contrato ya (transaccional) rebotan o pierden tiempo navegando por la página.

**Fix:**
```html
<!-- ACTUAL (malo) -->
<button>Ver Planes</button>
<button>Ver Cómo Funciona</button>

<!-- PROPUESTO -->
<button class="btn-primary">Analiza tu contrato gratis</button>
<button class="btn-secondary">Ver cómo funciona ↓</button>
```

### 2. H1 no contiene el keyword principal
**Problema:** El H1 actual es "Tu Abogado Inmobiliario con Inteligencia Artificial". No contiene "analizar contrato arrendamiento" ni variante.

**Fix:**
```html
<!-- ACTUAL -->
<h1>Tu Abogado Inmobiliario con Inteligencia Artificial</h1>

<!-- PROPUESTO (opción A — SEO) -->
<h1>Analiza tu Contrato de Arrendamiento con IA en 30 Segundos</h1>

<!-- PROPUESTO (opción B — conversión + keyword secundario) -->
<h1>Tu Abogado Inmobiliario <span class="accent">con Inteligencia Artificial</span></h1>
<!-- + Subheadline: "Analiza contratos de arrendamiento y detecta cláusulas abusivas en 30 segundos" -->
```
Opción B permite mantener el headline de marca y agregar el keyword en el subheadline inmediatamente debajo.

### 3. Cero social proof
**Problema:** No hay ningún testimonial, contador de usuarios, reseña ni señal de que alguien más usa el producto. Esta es la causa más probable de baja conversión para usuarios nuevos.

**Fix inmediato (sin testimoniales reales):**
- Agregar un contador con datos reales: "**847** contratos analizados" (si es verdad)
- Si aún no hay datos: "Primer análisis gratuito — sin tarjeta de crédito" como trust badge

**Fix a mediano plazo:**
- Solicitar 3-5 testimoniales a primeros usuarios
- Ejemplo de tarjeta de testimonial:
```
"Encontró que mi arrendador me cobró $230.000 COP de más durante 8 meses."
— María C., arrendataria, Bogotá ⭐⭐⭐⭐⭐
```

### 4. Title tag: demasiado largo y sin keyword al inicio
**Problema:** "InmoLawyer — Tu Abogado Inmobiliario con Inteligencia Artificial" = **64 caracteres** (límite: 60). El keyword no aparece.

**Fix:**
```html
<!-- ACTUAL (64 chars, sin keyword) -->
<title>InmoLawyer — Tu Abogado Inmobiliario con Inteligencia Artificial</title>

<!-- PROPUESTO (55 chars, keyword al inicio) -->
<title>Analizar Contrato de Arrendamiento con IA | InmoLawyer</title>
```

---

## ⚡ Quick Wins (Esta semana)

### QW1 — Cambiar CTAs del hero (impacto: ALTO, esfuerzo: MUY BAJO)
Cambiar "Ver Planes" → "Analiza tu contrato gratis"
Cambiar "Ver Cómo Funciona" → enlace interno `#como-funciona` (scroll suave)

### QW2 — Agregar sub-headline con keyword (impacto: ALTO, esfuerzo: BAJO)
Debajo del H1 agregar:
```
Analiza contratos de arrendamiento y detecta cláusulas abusivas en 30 segundos. Basado en la Ley 820 de 2003.
```

### QW3 — Corregir title tag (impacto: MEDIO, esfuerzo: MÍN)
Ver fix en Problema Crítico #4.

### QW4 — Agregar trust badge "Primer análisis gratuito" (impacto: MEDIO, esfuerzo: BAJO)
Colocar debajo de los CTAs del hero:
```
✓ Gratis para empezar  ✓ Sin tarjeta de crédito  ✓ Resultado en 30 segundos
```

### QW5 — Añadir `id` a sección "Cómo Funciona" (impacto: BAJO, esfuerzo: MÍN)
Para que el CTA secundario haga scroll:
```html
<section id="como-funciona">
```

---

## 📈 Análisis SEO Detallado

### Título y Meta

| Elemento | Estado | Valor actual | Recomendado |
|---|---|---|---|
| `<title>` | ⚠️ Largo | 64 chars, sin keyword | `Analizar Contrato de Arrendamiento con IA \| InmoLawyer` (55 chars) |
| `<meta description>` | ✅ Bien | 155 chars, incluye keyword | Mantener |
| Canonical | ✅ OK | `https://inmolawyer.surge.sh/` | — |
| Robots | ✅ OK | `index, follow` | — |
| Open Graph | ✅ OK | Completo (7 tags) | Agregar `og:image:type` |
| Twitter Card | ✅ OK | `summary_large_image` | — |

### Headings

| Tag | Texto | Keyword? | Acción |
|---|---|---|---|
| H1 | "Tu Abogado Inmobiliario con IA" | ❌ No | Agregar keyword en subheadline |
| H2 | "Analiza tu Contrato" | ✅ Sí | Mantener — buena señal |
| H2 | "Como Funciona" | ⚠️ Sin tildes | Corregir a "Cómo Funciona" |
| H2 | "Segunda Fase" | ❌ Vago | Reemplazar: "Próximamente: Arriendos Comerciales" |
| H2 | "Alimentado por las Mejores Fuentes" | ❌ Vago | Reemplazar: "Basado en Ley 820 y Jurisprudencia Colombiana" |

### Schema Markup
- ✅ `SoftwareApplication` — correcto y completo
- ✅ `Organization` — correcto
- ✅ `FAQPage` con 5 preguntas relevantes
- 💡 Sugerido para futuro: `HowTo` schema para la sección "Cómo Funciona"

### Keywords encontradas en la página
| Keyword | Menciones | Densidad estimada |
|---|---|---|
| "arrendamiento" | ~15 | ~1.8% ✅ |
| "contrato" | ~12 | ~1.4% ✅ |
| "Ley 820" | 4+ | 0.5% ✅ |
| "analizar contrato arrendamiento" | 1 (meta desc) | ❌ Solo en meta |
| "IPC" | 3 | 0.3% ⚠️ Bajo |
| "cláusulas abusivas" | 2 | 0.2% ⚠️ Bajo |

**Problema:** "analizar contrato arrendamiento" solo aparece en la meta description. Debe estar en H1 o subheadline visible.

---

## 🎯 Análisis CRO Detallado

### Above the Fold Score: 55/100

**Bien:**
- Headline es claro ("Abogado Inmobiliario con IA")
- El hero demo de upload está visible (innovador)
- Propuesta de valor se entiende en ~5 segundos

**Mal:**
- CTAs "Ver Planes" y "Ver Cómo Funciona" no son conversion-first
- No hay trust signals debajo del CTA
- El hero demo puede generar confusión: ¿puedo cargar ahora o es decorativo?

### Flujo de Conversión

```
Actual:
Usuario llega → Ver Planes / Ver Cómo Funciona → ... → llega al upload

Ideal:
Usuario llega → "Analiza tu contrato gratis" → Upload inmediato → Teaser → Pago/Registro
```

**Friction points identificados:**
1. CTAs no llevan al upload directo
2. El demo/upload en el hero puede parecer una demo decorativa, no funcional
3. La sección de precios muestra "Estudio Único $49.900" como primer plan — puede asustar antes de que el usuario pruebe gratis
4. El flujo "Sube → Paga → Recibe → Regístrate" en el how-it-works es incorrecto — el flujo real es Sube → recibe teaser gratis → paga para resultado completo

### Trust Signals Score: 28/100

**Presentes:**
- ✅ "Basado en Ley 820 de 2003" (autoridad legal)
- ✅ "Privacidad Total" (seguridad)
- ✅ Precios transparentes en la página

**Ausentes (alta prioridad):**
- ❌ Testimoniales (0 presentes)
- ❌ Contador de usuarios o análisis realizados
- ❌ Logos de medios/clientes
- ❌ "Sin tarjeta de crédito" badge junto al CTA principal
- ❌ Tiempo de análisis specificado en el hero ("30 segundos")

---

## 📋 Lista de Implementación Priorizada

| # | Acción | Impacto | Esfuerzo | Archivo |
|---|---|---|---|---|
| 1 | Cambiar CTAs hero → "Analiza tu contrato gratis" | 🔴 Alto | Bajo | `index.html` |
| 2 | Corregir title tag (keyword + <60 chars) | 🟡 Medio | Mín | `index.html` |
| 3 | Agregar subheadline con keyword bajo H1 | 🔴 Alto | Bajo | `index.html` |
| 4 | Agregar trust badges bajo CTAs (gratis, sin tarjeta, 30s) | 🟡 Medio | Bajo | `index.html` |
| 5 | Corregir H2 "Como Funciona" → "Cómo Funciona" | 🟢 Bajo | Mín | `index.html` |
| 6 | Corregir H2 "Segunda Fase" → nombre descriptivo | 🟢 Bajo | Mín | `index.html` |
| 7 | Corregir flujo how-it-works (Sube → Gratis → Paga → Regístrate) | 🟡 Medio | Bajo | `index.html` |
| 8 | Solicitar 3 testimoniales a usuarios beta | 🔴 Alto | Variable | Marketing |
| 9 | Añadir contador "X contratos analizados" si hay datos | 🟡 Medio | Bajo | `index.html` |
| 10 | Exportar og-image.html → og-image.png y deployar | 🟡 Medio | Bajo | Manual → Surge |

---

## 📝 Próximos Comandos SEO Sugeridos

```bash
# Auditar el contenido existente en profundidad:
/analyze-existing https://inmolawyer.surge.sh

# Investigar competidores para keywords de oportunidad:
/research analizar contrato arrendamiento colombia

# Generar 5 variantes de headline optimizadas:
# (usar agente headline-generator)

# Después de aplicar fixes del audit:
/optimize index.html
```

---

## Resumen Ejecutivo

InmoLawyer tiene una base técnica SEO sólida (schema, canonical, OG, robots, sitemap) pero sufre de **dos problemas críticos de conversión**:

1. **Los CTAs del hero envían usuarios en la dirección equivocada** — "Ver Planes" en lugar de "Analiza tu contrato gratis"
2. **Cero social proof** — un producto nuevo sin testimoniales ni contadores de uso pierde credibilidad ante usuarios nuevos

Los fixes de mayor impacto se pueden implementar en **menos de 2 horas** (CTAs + title + subheadline + trust badges). Esto debería mover la conversion rate de forma medible en la primera semana.

El score SEO técnico es alto (72/100) gracias al trabajo previo. El foco ahora debe ser CRO y social proof.
