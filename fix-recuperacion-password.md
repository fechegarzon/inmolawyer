# Fix Recuperacion de Password - InmoLawyer

## Fecha: 2026-03-11

## Tareas completadas

### 1. Hacer que llegue el correo de recuperacion
- Corregido el FROM address en la Edge Function de Supabase (custom SMTP hook)
- Corregido APP_URL en Supabase para que el link apunte a `https://inmo.tools/inmolawyer/app.html`
- Habilitado el auth hook en Supabase Dashboard
- Creada nueva API key en Resend (la anterior era invalida)
- Actualizado el secret `RESEND_API_KEY` en Supabase
- Edge Function v6 desplegada, retorna 200

### 2. Formulario de nueva password funcional
**Problema original:** Supabase redirige despues de verificar el token con un hash que contiene `type=recovery` + tokens. El `onAuthStateChange` disparaba eventos (`SIGNED_IN`, `PASSWORD_RECOVERY`) en orden impredecible, causando una race condition que ocultaba el formulario de reset.

**Solucion (en `auth.js` > `initAuth()`):**
- Detectar `type=recovery` desde `window.location.hash` ANTES de cualquier llamada a Supabase
- Si es recovery: mostrar formulario de reset y registrar un `onAuthStateChange` vacio para que no interfiera
- Si no es recovery: flujo normal de auth

```javascript
async function initAuth() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isRecovery = hashParams.get('type') === 'recovery';

    if (isRecovery) {
        showResetPasswordForm();
        supabaseClient.auth.onAuthStateChange(() => {});
        return;
    }
    // ... flujo normal
}
```

### 3. Bug post-reset: login no redirigía a la app
**Problema:** Despues de cambiar la password, el `onAuthStateChange` estaba vacio (`() => {}`), entonces `handleLogin()` funcionaba pero nunca llamaba a `showApp()` — el usuario quedaba atrapado en el login.

**Solucion (en `auth.js` > `handleNewPassword()`):**
Cambiar el handler de exito para redirigir a URL limpia (sin hash) en vez de mostrar el login form inline. Asi `initAuth()` corre fresco con listeners normales.

```javascript
// ANTES (broken):
setTimeout(() => {
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
}, 2500);

// DESPUES (fixed):
setTimeout(() => {
    window.location.href = window.location.pathname;
}, 2500);
```

## Archivos modificados
- `Inmotools/InmoLawyer/auth.js` — commit `0e935f7` (master)
- `Inmotools/inmotools-hub/public/inmolawyer/auth.js` — commit `4f630df` (main)

## Deployment
- Desplegado a Vercel via `vercel --prod --yes` el 2026-03-11
- Produccion: https://inmo.tools/inmolawyer/app.html

## Verificacion end-to-end
1. Correo de recuperacion llega (via Resend)
2. Link redirige a `app.html#type=recovery` con tokens
3. Formulario de reset se muestra correctamente
4. `handleNewPassword()` actualiza la password via `supabaseClient.auth.updateUser()`
5. Pagina redirige a URL limpia despues de 2.5s
6. `initAuth()` corre con listeners normales, usuario queda logueado
7. Login con nueva password verificado via API (200 + access_token)
8. Password anterior rechazada (400)

## Notas tecnicas
- **Supabase rate limit:** El endpoint `/auth/v1/recover` retorna 429 despues de multiples requests rapidos. Cooldown de varios minutos.
- **zsh y `!` en passwords:** zsh escapa `!` a `\!` en printf/echo, lo cual rompe JSON. Evitar `!` en passwords cuando se testea via shell.
- **Recovery token manual:** No se puede setear `recovery_token` directamente en la DB — Supabase usa hashing interno para el token exchange.
- **Extension Apollo.io:** Secuestra tabs de Chrome constantemente. Workaround: crear tabs nuevos.

## Password actual
- Email: `f@feche.xyz`
- Password: `FinalPass2026`
- Supabase project: `oqipslfzbeioakfllohm`
