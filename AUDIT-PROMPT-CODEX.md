# AUDIT PROMPT: Verificar Backend Fix de InmoLawyer

## TU ROL

Eres un auditor QA senior. Tu trabajo es verificar que TODOS los cambios descritos abajo se aplicaron correctamente, no introdujeron regresiones, y el sistema funciona end-to-end. No asumas que nada funciona — verifica todo con evidencia.

---

## CONTEXTO

Un agente de IA ejecuto un fix masivo del backend de InmoLawyer. Los cambios cubren 3 capas:

1. **Supabase PostgreSQL**: 8 funciones RPC, 1 trigger, 1 migracion de datos, verificacion de RLS
2. **Frontend (6 archivos)**: admin.js reescrito con RPCs, score corregido, WhatsApp unificado
3. **N8N workflows**: IPC actualizado, nivel_riesgo corregido en SQL de guardado

### Stack
- Frontend: HTML/JS estatico, deploy en Vercel (inmo.tools/inmolawyer/)
- Backend: n8n self-hosted en 157.245.126.107 (https://n8n.feche.xyz)
- DB: Supabase PostgreSQL (proyecto: `oqipslfzbeioakfllohm`)
- Pagos: Wompi (produccion activa)

### Credenciales Supabase
- URL: `https://oqipslfzbeioakfllohm.supabase.co`
- Anon Key: `sb_publishable_jZUUlb22emiChmOQnlwujw_3NRk0oLS`
- Admin email: `f@feche.xyz`

---

## CAMBIOS A AUDITAR

### 1. FUNCIONES RPC EN SUPABASE (8 funciones)

Verificar que TODAS existen, tienen `SECURITY DEFINER`, validan admin, y retornan datos correctos.

```sql
-- Ejecutar en SQL Editor de Supabase:

-- 1.1 Listar funciones creadas
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'admin_%'
ORDER BY routine_name;

-- ESPERADO: 8 filas, todas con security_type = 'DEFINER':
-- admin_cleanup_stuck_jobs
-- admin_get_advanced_metrics
-- admin_get_contracts
-- admin_get_risk_distribution
-- admin_get_stats
-- admin_get_top_preguntas
-- admin_get_user_questions
-- admin_get_users
```

Para cada funcion, verificar:
- [ ] Existe
- [ ] Es `SECURITY DEFINER`
- [ ] Valida `auth.uid()` contra email `f@feche.xyz`
- [ ] Retorna JSON (no error) cuando se llama como admin
- [ ] Retorna error `Unauthorized` cuando se llama como usuario normal

```sql
-- 1.2 Verificar contenido de admin_get_stats
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_stats';
-- Debe contener: _user_email != 'f@feche.xyz' THEN RAISE EXCEPTION 'Unauthorized'
-- Debe contar: contratos, documentos, consultas_chat, user_profiles, bot_analyses, whatsapp_messages, job_queue stuck

-- 1.3 Verificar admin_get_contracts
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_contracts';
-- Debe: SELECT ... FROM contratos ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset
-- Debe retornar: id, created_at, score_riesgo, nivel_riesgo, ciudad, user_email, arrendador_nombre, arrendatario_nombre, estado, duracion_meses, canon_mensual, clausulas_abusivas_count

-- 1.4 Verificar admin_get_risk_distribution
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_risk_distribution';
-- Debe usar umbrales correctos: score_riesgo >= 51 (alto), >= 26 AND < 51 (medio), < 26 (bajo)
-- NO debe usar >= 70 o >= 40 (esos eran los umbrales incorrectos)

-- 1.5 Verificar admin_get_users
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_users';
-- Debe retornar: total count + array de users con contratos_total, contratos_mes, consultas_total, ultima_actividad
-- Debe usar subqueries contra contratos y consultas_chat

-- 1.6 Verificar admin_get_user_questions
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_user_questions';
-- Debe aceptar p_user_id UUID
-- Debe retornar pregunta, respuesta, created_at de consultas_chat

-- 1.7 Verificar admin_get_top_preguntas
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_top_preguntas';
-- Debe agrupar por pregunta normalizada (lower, trim, substring 120 chars)
-- Debe retornar frecuencia, ordenado DESC, LIMIT 10

-- 1.8 Verificar admin_cleanup_stuck_jobs
SELECT prosrc FROM pg_proc WHERE proname = 'admin_cleanup_stuck_jobs';
-- Debe UPDATE job_queue SET status = 'error' WHERE processing > 10 min
-- Debe UPDATE contratos SET estado = 'error' WHERE processing > 10 min

-- 1.9 Verificar admin_get_advanced_metrics
SELECT prosrc FROM pg_proc WHERE proname = 'admin_get_advanced_metrics';
-- Debe retornar: tasa_completado, tiempo_promedio_segundos, preguntas_por_contrato, conversion_rate, usuarios_freemium, usuarios_premium, errores_wa_hoy
```

### 2. TRIGGER sync_contrato_to_documento

```sql
-- 2.1 Verificar que el trigger existe
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'sync_contrato_to_documento_trigger';

-- ESPERADO: AFTER INSERT OR UPDATE, EXECUTE FUNCTION sync_contrato_to_documento()

-- 2.2 Verificar la funcion del trigger
SELECT prosrc FROM pg_proc WHERE proname = 'sync_contrato_to_documento';
-- Debe usar: NEW.inmueble_direccion (NO NEW.direccion — esa columna no existe)
-- Debe hacer INSERT INTO documentos ... ON CONFLICT (id) DO UPDATE
-- Debe usar COALESCE(NEW.tipo_documento, 'ARRIENDO_VIVIENDA')

-- 2.3 Verificar que la migracion se completo
SELECT
    (SELECT count(*) FROM contratos) as total_contratos,
    (SELECT count(*) FROM documentos) as total_documentos,
    (SELECT count(*) FROM contratos WHERE id NOT IN (SELECT id FROM documentos)) as sin_migrar;
-- ESPERADO: total_contratos = total_documentos, sin_migrar = 0
```

### 3. POLITICAS RLS

```sql
-- 3.1 Listar todas las politicas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('contratos', 'documentos', 'consultas_chat', 'user_profiles', 'alertas_contrato', 'alertas_documento')
ORDER BY tablename, cmd;

-- Verificar:
-- [ ] contratos: tiene SELECT/INSERT/UPDATE con check de admin (f@feche.xyz)
-- [ ] user_profiles: tiene SELECT/INSERT/UPDATE con check de admin
-- [ ] consultas_chat: tiene SELECT/INSERT/UPDATE con check de admin
-- [ ] documentos: tiene al menos SELECT/INSERT/UPDATE (puede no tener admin check — las RPCs lo bypassean con SECURITY DEFINER)
-- [ ] alertas_contrato: tiene SELECT con admin check + SELECT por contrato_id ownership
-- [ ] alertas_documento: tiene SELECT/INSERT por documento_id ownership
```

### 4. FRONTEND — admin.js

Archivo: `admin.js` en el directorio del proyecto.

Verificar que usa RPCs y NO queries directas a tablas:

```
DEBE CONTENER:
- supabaseClient.rpc('admin_get_stats')
- supabaseClient.rpc('admin_get_contracts', { p_limit: 20, p_offset: 0 })
- supabaseClient.rpc('admin_get_risk_distribution')
- supabaseClient.rpc('admin_get_users', { p_limit: ADMIN_PAGE_SIZE, p_offset: page * ADMIN_PAGE_SIZE })
- supabaseClient.rpc('admin_get_top_preguntas')
- supabaseClient.rpc('admin_get_user_questions', { p_user_id: userId })

NO DEBE CONTENER (queries directas que bypasseaban el fix):
- supabaseClient.from('contratos').select('*', { count: 'exact', head: true })
- supabaseClient.from('contratos').select('user_email, score_riesgo, ciudad')
- supabaseClient.from('user_profiles').select(...)  (excepto en auth.js para el perfil propio)
- supabaseClient.from('consultas_chat').select('pregunta').limit(500)
```

Verificar estructura:
- [ ] `loadAdminData()` usa `Promise.all` con 3 RPCs (stats, contracts, risk)
- [ ] `loadUsersRegistry()` usa RPC `admin_get_users` con paginacion server-side
- [ ] `loadTopPreguntas()` usa RPC `admin_get_top_preguntas`
- [ ] `showUserQuestions()` usa RPC `admin_get_user_questions`
- [ ] Cache TTL de 5 minutos sigue funcionando
- [ ] `renderAdminStats()` mapea los campos correctos del RPC response
- [ ] `filterUsers()` sigue funcionando con filtrado client-side sobre `usersDataCache`
- [ ] `exportUsersCSV()` sigue funcionando

### 5. FRONTEND — app.js (Score de riesgo)

Archivo: `app.js`, funcion `loadMisContratos()`.

```javascript
// CORRECTO (debe ser asi):
score >= 51 ? 'score-badge-high' : score >= 26 ? 'score-badge-med' : 'score-badge-low'
score >= 51 ? 'Alto' : score >= 26 ? 'Medio' : 'Bajo'

// INCORRECTO (NO debe ser asi):
score >= 70 ? 'score-badge-low' : score >= 40 ? 'score-badge-med' : 'score-badge-high'
score >= 70 ? 'Bajo' : score >= 40 ? 'Medio' : 'Alto'
```

Verificar:
- [ ] `scoreClass` usa `>= 51` para high, `>= 26` para med, else low
- [ ] `riesgoLabel` usa `>= 51` para 'Alto', `>= 26` para 'Medio', else 'Bajo'
- [ ] Los colores corresponden: high = rojo, med = amarillo/naranja, low = verde

### 6. FRONTEND — WhatsApp unificado

Todos los archivos deben usar el numero `573011848771` (bot de Evolution API).

| Archivo | Que buscar | Esperado |
|---------|-----------|----------|
| `auth.js` | `CONFIG_AUTH.whatsapp.phoneNumber` | `'573011848771'` |
| `wa-float.js` | `wa.me/` href | `wa.me/573011848771` |
| `index.html` | Todas las URLs `wa.me/` | `wa.me/573011848771` |
| `index.html` | `"telephone"` en JSON-LD | `"+573011848771"` |
| `index.html` | Display text de telefono | `+57 301 184 8771` |
| `app.html` | URLs `wa.me/` | `wa.me/573011848771` |
| `payments.js` | URL `wa.me/` en fallback | `wa.me/573011848771` |

```
NO DEBE EXISTIR en NINGUN archivo:
- 15559144224 (placeholder/fake)
- 573337124882 (numero viejo)
- +1 555 914 4224 (display text viejo)
```

Para verificar de forma exhaustiva:
```bash
grep -rn '15559144224\|573337124882\|555.914' *.js *.html
# ESPERADO: 0 resultados
```

### 7. FRONTEND — config.js

```javascript
// Verificar que redirectUrl apunta al dominio correcto:
redirectUrl: 'https://inmo.tools/inmolawyer/app'
// NO debe ser: 'https://inmolawyer.surge.sh/app.html'
```

### 8. N8N WORKFLOW — API Principal (agEpujr6fo1ocRiL)

#### 8.1 Nodo "Construir Texto Prompt"

Verificar los valores IPC en el prompt de vivienda:

```
CORRECTO:
IPC 2024: 5.20% -> incrementos en 2025
IPC 2025: 5.10% -> incrementos en 2026

INCORRECTO:
IPC 2024: 5.28% -> incrementos en 2025
IPC 2025: 5.28% estimado -> incrementos en 2026
```

Tambien verificar que `ipc_certificado` en el schema de respuesta del prompt usa `5.20` (no `5.28`).

#### 8.2 Nodo "Procesar Respuesta LLM"

Verificar el objeto `IPC_HISTORICO`:
```javascript
// CORRECTO:
const IPC_HISTORICO = { ..., 2024:5.20, 2025:5.10 };

// INCORRECTO:
const IPC_HISTORICO = { ..., 2024:4.33 };  // viejo
```

#### 8.3 Nodo "Guardar Resultado v2"

Verificar la query SQL del CASE para nivel_riesgo:

```sql
-- CORRECTO:
CASE WHEN COALESCE((d->>'score_riesgo')::int,0)>=51 THEN 'alto'
     WHEN COALESCE((d->>'score_riesgo')::int,0)>=26 THEN 'medio'
     ELSE 'bajo' END

-- INCORRECTO:
CASE WHEN COALESCE((d->>'score_riesgo')::int,0)>70 THEN 'alto'
     WHEN COALESCE((d->>'score_riesgo')::int,0)>40 THEN 'medio'
     ELSE 'bajo' END
```

#### 8.4 Nodo "Guardar Consulta"

Verificar que la query INSERT inserta en `consultas_chat` correctamente:
- Campos: id, contrato_id, user_id, pregunta, respuesta, created_at
- Nota: NO tiene campo `modelo_ia` — esto es aceptable, no es un bug

### 9. INTEGRIDAD DE DATOS

```sql
-- 9.1 Verificar que no hay contratos sin migrar
SELECT count(*) FROM contratos WHERE id NOT IN (SELECT id FROM documentos);
-- ESPERADO: 0

-- 9.2 Verificar consistencia de scores
SELECT
    'contratos_sin_score' as check_name,
    count(*) as issues
FROM contratos
WHERE estado = 'completado' AND score_riesgo IS NULL

UNION ALL

SELECT 'jobs_stuck', count(*)
FROM job_queue
WHERE status = 'processing'
AND created_at < now() - interval '10 minutes'

UNION ALL

SELECT 'contratos_sin_user_id', count(*)
FROM contratos WHERE user_id IS NULL

UNION ALL

SELECT 'documentos_total', count(*)
FROM documentos

UNION ALL

SELECT 'contratos_total', count(*)
FROM contratos;

-- ESPERADO: sin_score=0, jobs_stuck=0, sin_user_id=0, documentos=contratos

-- 9.3 Verificar que nivel_riesgo es consistente con score_riesgo
SELECT nivel_riesgo, min(score_riesgo), max(score_riesgo), count(*)
FROM contratos
WHERE estado = 'completado'
GROUP BY nivel_riesgo;
-- NOTA: los contratos existentes pueden tener umbrales viejos (>70/>40).
-- Solo los NUEVOS contratos usaran los umbrales correctos (>=51/>=26).
-- Esto NO es un bug — es expected behavior para datos historicos.
```

### 10. TESTS FUNCIONALES (requiere login en la app)

#### 10.1 Admin Dashboard
- [ ] Login como `f@feche.xyz` en https://inmo.tools/inmolawyer/app
- [ ] Abrir panel admin (boton de admin visible)
- [ ] Dashboard muestra conteo REAL de contratos (NO 0)
- [ ] Dashboard muestra conteo de usuarios (debe ser >= 2)
- [ ] Distribucion de riesgo muestra datos (alto/medio/bajo con numeros)
- [ ] Top ciudades muestra al menos una ciudad
- [ ] Tabla de contratos recientes tiene filas con datos
- [ ] Tab "Clientes" muestra perfiles de TODOS los usuarios
- [ ] Filtro de usuarios funciona (buscar por email)
- [ ] Export CSV descarga archivo

#### 10.2 Historial de usuario
- [ ] Login como usuario normal
- [ ] Ir a tab "Mis Contratos"
- [ ] Los contratos del usuario se listan
- [ ] Score de riesgo muestra colores correctos:
  - Score >= 51: badge ROJO + texto "Alto"
  - Score 26-50: badge NARANJA + texto "Medio"
  - Score < 26: badge VERDE + texto "Bajo"

#### 10.3 WhatsApp
- [ ] Widget flotante (wa-float) apunta a `wa.me/573011848771`
- [ ] Links en landing page apuntan a `wa.me/573011848771`
- [ ] QR de vinculacion en registro usa `573011848771`
- [ ] Links en modal de precios y seccion bloqueada usan `573011848771`

---

## FORMATO DE REPORTE

Para cada seccion, reportar:

```
### Seccion X: [nombre]
- Estado: PASS / FAIL / PARTIAL
- Evidencia: [query ejecutada, resultado, screenshot, etc.]
- Issues encontrados: [descripcion del problema si hay]
- Severidad: CRITICO / MEDIO / BAJO / INFO
```

Al final del reporte, incluir:

```
## RESUMEN EJECUTIVO
- Total checks: X
- PASS: X
- FAIL: X
- PARTIAL: X

## ISSUES CRITICOS (si hay)
1. ...

## RECOMENDACIONES
1. ...
```

---

## NOTAS PARA CODEX

- Los archivos frontend estan en el repo git del proyecto
- Para SQL: usa el SQL Editor de Supabase (proyecto oqipslfzbeioakfllohm)
- Para n8n: acceder a https://n8n.feche.xyz, workflow ID `agEpujr6fo1ocRiL`
- El nodo huerfano "Llamar Gemini Analisis" (desconectado) es pre-existente, NO fue introducido por este fix
- Los warnings del nodo "Tipo de Archivo?" (Switch) son pre-existentes, NO fueron introducidos
- Los umbrales de nivel_riesgo en datos HISTORICOS pueden no coincidir con los nuevos (>=51/>=26) — esto es esperado porque los contratos viejos se procesaron con umbrales >70/>40
