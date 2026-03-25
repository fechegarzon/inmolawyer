# Wompi Integration Setup Guide

## Estado actual
- Frontend: ✅ Implementado (modal de precios + formularios Wompi)
- Backend N8N: ⏳ Pendiente (webhook para activar créditos)
- Clave pública Wompi: ⏳ Pendiente (reemplazar en app.js)

---

## Paso 1: Obtener tu llave pública de Wompi

1. Ir a [comercios.wompi.co](https://comercios.wompi.co) → Developers → Keys
2. Copiar la **llave pública de producción** (formato: `pub_prod_XXXX`)
3. En `app.js`, línea ~40, reemplazar:
```javascript
publicKey: 'pub_test_REPLACE_WITH_YOUR_WOMPI_PUBLIC_KEY',
```
por:
```javascript
publicKey: 'pub_prod_TU_LLAVE_REAL_AQUI',
```
4. Deployar: `npx surge . inmolawyer.surge.sh`

---

## Paso 2: Configurar webhook en Wompi

1. En Wompi dashboard → Developers → Events
2. Agregar URL del webhook: `https://n8n.feche.xyz/webhook/wompi-payment`
3. Activar eventos: `transaction.updated`

---

## Paso 3: Crear workflow en N8N

### Flujo: Wompi → Supabase

**Node 1: Webhook Trigger**
- Method: POST
- Path: `wompi-payment`
- Response Mode: Last Node

**Node 2: Code (validar evento)**
```javascript
const body = $input.first().json;
// Verificar que sea un pago exitoso
const event = body.event;
const transaction = body.data?.transaction;

if (event !== 'transaction.updated') {
  return [{ json: { skip: true, reason: 'Not a transaction event' } }];
}

if (transaction?.status !== 'APPROVED') {
  return [{ json: { skip: true, reason: 'Transaction not approved', status: transaction?.status } }];
}

// Parsear referencia: INMO-{userId8chars}-{planId}-{timestamp}
const ref = transaction.reference || '';
const parts = ref.split('-');
// parts: ['INMO', userPrefix, planId, timestamp]

if (parts[0] !== 'INMO' || parts.length < 4) {
  return [{ json: { skip: true, reason: 'Invalid reference format', ref } }];
}

const userPrefix = parts[1];   // primeros 8 chars del UUID sin guiones
const planId = parts[2];       // 'single', 'pack5', 'pack10'

const creditsMap = {
  single: 1,
  pack5: 5,
  pack10: 10
};

const credits = creditsMap[planId] || 0;

if (credits === 0) {
  return [{ json: { skip: true, reason: 'Unknown plan', planId } }];
}

return [{
  json: {
    userPrefix,
    planId,
    credits,
    transactionId: transaction.id,
    amountCents: transaction.amount_in_cents,
    reference: ref
  }
}];
```

**Node 3: IF (skip si no aplica)**
- Condition: `{{ $json.skip }}` is `true` → branch FALSE continúa, TRUE termina

**Node 4: Supabase — buscar usuario por email prefix**

Dado que el reference solo tiene 8 chars del UUID (sin guiones), necesitamos buscar en Supabase.

Usar HTTP Request node:
- URL: `https://oqipslfzbeioakfllohm.supabase.co/rest/v1/user_profiles`
- Method: GET
- Headers:
  - `apikey`: `<tu_supabase_service_role_key>`
  - `Authorization`: `Bearer <tu_supabase_service_role_key>`
- Query params:
  - `select`: `id,estudios_restantes,plan`
  - `id`: `like.{{ $json.userPrefix }}%` 
  
> **Nota:** Esto busca perfiles cuyo UUID empieza con el prefijo de 8 chars.

**Node 5: Code — calcular nuevos créditos**
```javascript
const profile = $input.first().json;
const prevData = $('Code').first().json; // credits del node anterior

if (!profile || !profile.id) {
  throw new Error('User not found for prefix: ' + prevData.userPrefix);
}

const currentCredits = profile.estudios_restantes || 0;
const newCredits = currentCredits + prevData.credits;

// Si era freemium y compró, actualizar plan a 'paid'
const newPlan = profile.plan === 'freemium' ? 'paid' : profile.plan;

return [{
  json: {
    userId: profile.id,
    newCredits,
    newPlan,
    addedCredits: prevData.credits,
    planId: prevData.planId
  }
}];
```

**Node 6: HTTP Request — actualizar Supabase**
- URL: `https://oqipslfzbeioakfllohm.supabase.co/rest/v1/user_profiles?id=eq.{{ $json.userId }}`
- Method: PATCH
- Headers:
  - `apikey`: `<supabase_service_role_key>`
  - `Authorization`: `Bearer <supabase_service_role_key>`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`
- Body (JSON):
```json
{
  "estudios_restantes": "{{ $json.newCredits }}",
  "plan": "{{ $json.newPlan }}"
}
```

**Node 7: Respond to Webhook**
- Body: `{ "status": "ok" }`

---

## Estructura de la referencia Wompi

Formato: `INMO-{userPrefix}-{planId}-{timestamp}`

Ejemplos:
- `INMO-a1b2c3d4-single-1741234567890` → 1 crédito
- `INMO-a1b2c3d4-pack5-1741234567890` → 5 créditos
- `INMO-a1b2c3d4-pack10-1741234567890` → 10 créditos

`userPrefix` = `currentUser.id.replace(/-/g, '').substring(0, 8)` (primeros 8 chars del UUID sin guiones)

---

## Planes configurados

| Plan | ID | Precio COP | Créditos | Precio/estudio |
|------|----|-----------|----------|----------------|
| Estudio Único | `single` | $49.900 | 1 | $49.900 |
| Pack 5 Estudios | `pack5` | $199.900 | 5 | $39.980 (-20%) |
| Pack 10 Estudios | `pack10` | $349.900 | 10 | $34.990 (-30%) |

---

## Flujo completo del usuario

1. Usuario agota sus 5 estudios gratuitos
2. Aparece pantalla de bloqueo → clic en "Ver planes y precios"
3. Se abre modal con 3 planes
4. Usuario elige un plan → formulario GET → redirige a `checkout.wompi.co/p/`
5. Usuario completa el pago en Wompi (tarjeta, PSE, Nequi, etc.)
6. Wompi redirige al usuario a `https://inmolawyer.surge.sh/app.html`
7. App detecta `?id=` en la URL → muestra toast "¡Pago recibido!"
8. Wompi envía webhook a N8N en paralelo
9. N8N valida → actualiza `estudios_restantes` y `plan` en Supabase
10. Usuario recarga → ve sus créditos actualizados

---

## Checklist de activación

- [ ] Reemplazar `publicKey` en `app.js` con llave real de Wompi
- [ ] Configurar webhook URL en Wompi dashboard
- [ ] Crear workflow en N8N con los nodes del Paso 3
- [ ] Testear con pago de prueba (Wompi provee tarjetas de test)
- [ ] Deploy final: `npx surge . inmolawyer.surge.sh`
