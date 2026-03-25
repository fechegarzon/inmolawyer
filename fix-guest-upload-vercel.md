# InmoLawyer — Fix: Guest Upload no funcionaba en inmo.tools

Fecha: 2026-03-11
Estado: ✅ Resuelto y desplegado

---

## Problema

El upload de contratos en la sección guest de **inmo.tools/inmolawyer** no funcionaba. El usuario seleccionaba un archivo PDF y no pasaba nada — la UI se quedaba en el estado inicial sin iniciar el análisis.

En **inmolawyer.surge.sh** funcionaba correctamente.

---

## Causa raíz

**`guest.js` no se cargaba (HTTP 404).**

El HTML tenía:
```html
<script src="guest.js?v=6"></script>
```

En Vercel, la página se sirve en `/inmolawyer` (sin trailing slash). El `next.config.ts` tiene un rewrite:
```typescript
{ source: "/inmolawyer", destination: "/inmolawyer/index.html" }
```

Esto causa que el navegador resuelva la ruta relativa `guest.js` como:
- `/guest.js` (404) en lugar de `/inmolawyer/guest.js` (correcto)

En surge.sh no ocurría porque surge maneja las rutas de forma diferente (con trailing slash).

---

## Fix aplicado

### 1. Ruta del script (causa principal)

**Archivo:** `inmotools-hub/public/inmolawyer/index.html` (línea 1434)

```html
<!-- Antes (roto) -->
<script src="guest.js?v=6"></script>

<!-- Después (funciona) -->
<script src="/inmolawyer/guest.js?v=7"></script>
```

### 2. Doble click en botón de upload (bug secundario)

**Archivo:** `inmotools-hub/public/inmolawyer/guest.js` (función `initGuestUpload`)

El botón "Seleccionar Archivo" tenía `onclick="...input.click()"` y el div padre `guestDropZone` también llamaba `input.click()` en su click listener. Esto causaba doble disparo del diálogo de archivos.

```javascript
// Antes
zone.addEventListener('click', () => input.click());

// Después
zone.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target === input) return;
    input.click();
});
```

---

## Verificación

Test end-to-end con Playwright (headless Chromium) + contrato real (PDF 263KB):

| Paso | Resultado |
|------|-----------|
| `guest.js` carga | ✅ `handleGuestFileUpload` existe como función |
| Upload de PDF | ✅ State 1 (analizando) visible |
| Request a Supabase proxy | ✅ POST 200 |
| Respuesta Gemini | ✅ Score 30, 7 alertas, 2 ALTO |
| UI muestra teaser | ✅ State 2 visible |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `inmotools-hub/public/inmolawyer/index.html` | `src="guest.js"` → `src="/inmolawyer/guest.js"` |
| `inmotools-hub/public/inmolawyer/guest.js` | Fix doble click en zona de upload |

Ambos archivos también actualizados en la copia de surge.sh (`InmoLawyer/index.html` y `InmoLawyer/guest.js`).

---

## Lección aprendida

Cuando Next.js sirve archivos estáticos de `public/` a través de rewrites sin trailing slash, las rutas relativas en el HTML se resuelven desde la raíz (`/`) y no desde el subdirectorio. Usar rutas absolutas (`/inmolawyer/guest.js`) en lugar de relativas (`guest.js`).
