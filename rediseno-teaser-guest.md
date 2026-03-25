# InmoLawyer — Rediseño Teaser Guest (State 2)

Fecha: 2026-03-11
Estado: ✅ Desplegado en inmo.tools/inmolawyer

---

## Contexto

Después de que un usuario guest sube un contrato PDF, el backend (n8n + Gemini 2.5 Flash) analiza el documento y devuelve un "teaser" — un resumen parcial que invita al usuario a registrarse o pagar para ver el análisis completo.

El teaser anterior solo mostraba el score y un texto genérico "Paga para ver el análisis completo". No mostraba ninguna alerta ni daba incentivo real para registrarse.

---

## Cambios realizados

### 1. Backend (n8n workflow `qzKRnyiEd4MB8MRs`)

El nodo **"Parsear Respuesta Gemini"** ahora extrae campos adicionales del análisis:

```javascript
// Nuevos campos en la respuesta del teaser
alertas_preview    // Array con las primeras 2 alertas (titulo + nivel)
alertas_hidden_count // Cantidad de alertas restantes (ocultas/locked)
alertas_medio      // Conteo de alertas nivel MEDIO
resumen            // Resumen breve del contrato
```

El nodo **"Retornar Teaser"** ahora incluye todos estos campos en la respuesta JSON al frontend.

### 2. Frontend — HTML (`index.html`)

Rediseño completo del **State 2** (teaser). Estructura:

```
┌─────────────────────────────────────────┐
│  [Score Ring]  Tu análisis está listo   │
│                X alertas detectadas     │
│                                         │
│  Resumen del contrato...                │
│                                         │
│  ⚠ Alertas detectadas                  │
│  ┌─ Alerta visible 1 (ALTO) ─────────┐ │
│  ┌─ Alerta visible 2 (MEDIO) ────────┐ │
│  ┌─ 🔒 Clausula detectada... ────────┐ │
│  ┌─ 🔒 Clausula detectada... ────────┐ │
│  ┌─ 🔒 Clausula detectada... ────────┐ │
│                                         │
│  ──────────────────────────────────────  │
│                                         │
│  🎁 Regístrate gratis para ver el      │
│     análisis completo                   │
│  ✓ Todas las alertas                   │
│  ✓ Referencias legales                 │
│  ✓ PDF descargable                     │
│  ✓ Historial de contratos              │
│                                         │
│  [ 👤 Crear cuenta gratis ]  (verde)   │
│                                         │
│  ← Subir otro contrato                 │
│                                         │
│  o                                      │
│                                         │
│  Ver análisis completo sin              │
│  registrarse por $49.900                │
└─────────────────────────────────────────┘
```

Elementos clave:
- **Alertas visibles** (primeras 2): muestran título real con badge de nivel (ALTO=rojo, MEDIO=amarillo, BAJO=verde)
- **Alertas locked** (restantes): texto blurred con ícono de candado, generan curiosidad
- **CTA primario**: registro gratuito (botón verde grande)
- **CTA secundario**: pago sin registro ($49.900) al final, como opción alternativa

### 3. Frontend — CSS

Nuevas clases:
- `.guest-teaser-alert-item` — alerta visible con colores por nivel (.alto, .medio, .bajo)
- `.guest-teaser-alert-locked` — alerta blurred con candado
- `.guest-teaser-cta` — sección de registro con features
- `.btn-guest-register-cta` — botón verde de registro
- `.guest-teaser-resumen` — párrafo de resumen
- `.guest-teaser-divider` — separador visual
- `.guest-teaser-or` — texto "o" entre opciones
- `.cta-features` — grid de beneficios con checks

### 4. Frontend — JavaScript (`guest.js`)

Función `showGuestTeaser(data)` reescrita para:
- Poblar score con color dinámico (verde ≥70, amarillo ≥40, rojo <40)
- Mostrar texto de alertas desglosado (X críticas, Y advertencias, Z informativas)
- Renderizar alertas visibles con título e ícono por nivel
- Renderizar alertas locked con texto genérico y candado
- Mostrar resumen del contrato
- Scroll automático al teaser

---

## Flujo de conversión

```
Guest sube PDF
    ↓
Gemini analiza (30-60s)
    ↓
Teaser muestra preview parcial
    ↓
├── Opción A: Crear cuenta gratis → app.html (registro)
├── Opción B: Subir otro contrato → reset al State 0
└── Opción C: Pagar $49.900 → initiateGuestPayment() → Wompi
```

La estrategia es que el **registro gratuito** sea la acción principal (mayor conversión), y el pago sin registro sea la alternativa para quienes prefieren no crear cuenta.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `inmotools-hub/public/inmolawyer/index.html` | State 2 HTML + CSS completo |
| `inmotools-hub/public/inmolawyer/guest.js` | `showGuestTeaser()` reescrita |
| `InmoLawyer/index.html` | Copia surge.sh actualizada (parcial) |
| `InmoLawyer/guest.js` | Copia surge.sh sincronizada |
| n8n workflow `qzKRnyiEd4MB8MRs` | Nodos "Parsear Respuesta" y "Retornar Teaser" |

---

## Deploy

- Commit: `6202645` en `main` de `inmotools-hub`
- Push a GitHub → Vercel deploy automático
- URL: https://inmo.tools/inmolawyer

---

## Verificación

Test Playwright con contrato real:
- Score: 30
- Alertas visibles: 2 (con título y nivel)
- Alertas locked: 4 (con candado)
- Botón "Crear cuenta gratis": ✅ presente
- Botón pago $49.900: ✅ al final
- Resumen: ✅ visible
