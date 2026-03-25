# InmoLawyer — TODOS (CEO Review, 2026-03-12)

## Vision
Hub legal de finca raiz para todo el ecosistema inmobiliario colombiano: inquilinos, propietarios, agentes, inmobiliarias, aseguradoras, afianzadoras y firmas legales. WhatsApp-first B2C como canal de entrada, evolucionando a plataforma B2B.

---

## FASE 1: Semana 1 — Fundamentos (sin usuarios)

### [P1] Publicar T&C + Politica de Privacidad
- **Que:** Pagina estatica en inmo.tools/legal con T&C y Politica de Privacidad
- **Por que:** Bloqueante legal antes de lanzar WhatsApp (Ley 1581 de 2012)
- **Contexto:** Research legal completo en `legal/research-legal-tyc-inmolawyer.md` (65K chars). Cubre Ley 1581, habeas data, datos de terceros, transferencia internacional, WhatsApp Business. Solo falta maquetar y publicar.
- **Esfuerzo:** S
- **Depende de:** Nada (research ya hecho)

### [P1] Activar DPA de Google Cloud
- **Que:** Activar Data Processing Addendum en la cuenta de Google Cloud que usa Gemini API
- **Por que:** Bloqueante legal — cubre transferencia internacional de datos personales a Google (Ley 1581, Art. 26)
- **Contexto:** Es un checkbox en Google Cloud Console. Referenciar en T&C.
- **Esfuerzo:** S (2 minutos)
- **Depende de:** Nada

### [P1] Crear tablas bot_events + errors en Supabase
- **Que:** `bot_events` (phone_hash, event_type, timestamp, metadata) + `bot_errors` (phone_hash, error_type, codepath, context, timestamp)
- **Por que:** Sin esto no hay funnel ni debugging del bot (decisiones 6A + 16A)
- **Contexto:** Events: msg_received, photo_received, gate_pass, gate_fail, analysis_complete, analysis_error, carta_requested, carta_sent. Phone hasheado para privacidad.
- **Esfuerzo:** S
- **Depende de:** Nada

### [P2] Configurar UptimeRobot + auto-restart n8n
- **Que:** Health check externo cada 5 min a n8n.feche.xyz + script systemd que reinicie n8n si muere
- **Por que:** Single point of failure — si n8n cae, todo muere y nadie se entera (decision 2A)
- **Contexto:** Ya hubo incidentes de timeout (FIX_CADDY_TIMEOUT.md). UptimeRobot gratis, notifica por email/WhatsApp.
- **Esfuerzo:** S
- **Depende de:** Nada

### [P2] Instalar Plausible Analytics
- **Que:** Script Plausible en todas las paginas web + custom events: upload_started, analysis_complete, payment_initiated, carta_generated, whatsapp_cta_clicked
- **Por que:** Cero tracking actual — volando a ciegas (decision 3A)
- **Contexto:** Plausible cloud $9/mes o self-hosted gratis. Un script de 1 linea. GDPR-friendly, sin cookies.
- **Esfuerzo:** S
- **Depende de:** Nada

### [P3] Actualizar READMEs
- **Que:** Cambiar referencias de Claude/OpenAI a Gemini 2.5 Flash, actualizar diagramas de arquitectura, agregar WhatsApp como canal primario
- **Por que:** Documentacion miente — dice Claude Sonnet cuando ya es Gemini
- **Contexto:** Archivos: README.md (InmoLawyer), InmoLawyer_README.md (Cursor), context/features.md
- **Esfuerzo:** S
- **Depende de:** Nada

---

## FASE 1: Semana 2 — Bot WhatsApp (testing interno)

### [P1] Disclaimer en CADA interaccion
- **Que:** Copy de disclaimer en: (1) primer mensaje del bot, (2) footer de cada resultado, (3) pie de carta de reclamacion, (4) sello
- **Copy:** "InmoLawyer usa IA para analizar contratos. No somos abogados ni firma legal. Para decisiones legales, consulta un profesional."
- **Por que:** Bloqueante legal y etico — InmoLawyer no es un abogado de verdad
- **Esfuerzo:** S
- **Depende de:** Nada

### [P1] Flujo de consentimiento T&C en primer mensaje
- **Que:** Mensaje de bienvenida + aceptacion de T&C antes de procesar cualquier contrato. Interactive message de Kapso con boton "Acepto T&C".
- **Por que:** Bloqueante legal — Ley 1581 requiere consentimiento inequivoco
- **Contexto:** Flujo detallado en `legal/research-legal-tyc-inmolawyer.md` seccion "Flujo de consentimiento en WhatsApp"
- **Esfuerzo:** M
- **Depende de:** T&C publicados (semana 1)

### [P1] Workflow n8n: bot WhatsApp core
- **Que:** Kapso webhook → ACK inmediato → Gemini Vision (gate+OCR combinados, decision 15A) → Gemini Flash (analisis) → reply con resultado + disclaimer
- **Por que:** Es el producto core de fase 1
- **Contexto:** State machine: IDLE → VALIDANDO → ANALIZANDO → RESULTADO (decision 11A). ACK inmediato: "Recibi tu contrato. Analizando..." Gate+OCR combinados en una llamada (15A). Error handler global always-reply (6A). Secret header en webhook (10A).
- **Esfuerzo:** L
- **Depende de:** Tablas Supabase (semana 1), consentimiento T&C

### [P1] Rate limiting por telefono
- **Que:** Maximo 3 analisis/dia por numero de WhatsApp
- **Por que:** Evitar abuso del bot — decision de construir ahora
- **Contexto:** Query a bot_events contando analysis_complete del dia para ese phone_hash. Si >= 3, reply: "Alcanzaste el limite diario. Intenta manana o visita inmo.tools/inmolawyer"
- **Esfuerzo:** S
- **Depende de:** Tabla bot_events

### [P1] Eliminacion de contrato post-analisis
- **Que:** Despues de generar el resultado, eliminar el texto/imagen del contrato. No persistir datos del arrendador.
- **Por que:** Decision 8A — reducir riesgo legal de datos de terceros sin consentimiento
- **Contexto:** En Supabase solo queda: score, alertas, recomendaciones, datos del arrendatario (que si consintio). Contrato original se procesa en memoria de n8n y no se guarda.
- **Esfuerzo:** S
- **Depende de:** Workflow bot

### [P1] Validacion de contenido (gate)
- **Que:** Prompt combinado Gemini Vision: "Es un documento legal/contrato legible? Si si, extrae el texto completo." Respuestas posibles: texto extraido, BLURRY, NOT_CONTRACT.
- **Por que:** Evitar gastar tokens en selfies/memes + mejorar UX (decision 7A + 15A combinados)
- **Contexto:** Foto borrosa → "Tu foto esta borrosa, intenta con mejor luz." No es contrato → "Esto no parece un contrato de arrendamiento."
- **Esfuerzo:** S (es parte del workflow core)
- **Depende de:** Workflow bot

### [P2] Templates de WhatsApp aprobados por Meta
- **Que:** Someter templates de mensaje para aprobacion: bienvenida, resultado de analisis, carta de reclamacion, re-engagement (sesion 24h)
- **Por que:** WhatsApp Business API requiere templates aprobados para mensajes outbound
- **Contexto:** Aprobacion toma 1-7 dias. Someter en semana 1 para tener listos en semana 2.
- **Esfuerzo:** S
- **Depende de:** Cuenta WhatsApp Business via Kapso

### [P2] QA manual con checklist
- **Que:** Testear con numero personal: foto buena, foto borrosa, texto random, selfie, PDF, video, "hola", "carta", multiples fotos seguidas
- **Por que:** Decision 14A — validar end-to-end antes de usuarios reales
- **Esfuerzo:** S
- **Depende de:** Workflow bot completo

---

## FASE 1: Semana 3 — Carta + funnel web→WA (soft launch)

### [P1] Workflow carta de reclamacion
- **Que:** Comando "carta" post-analisis → n8n genera carta formal con Gemini + template HTML → PDF server-side → envia como documento por WhatsApp
- **Por que:** Decision 5A — el momento de mayor valor: pasar de "se que me roban" a "puedo hacer algo"
- **Contexto:** La carta cita articulos especificos de Ley 820 detectados en el analisis. Incluye datos del arrendatario y del contrato. Disclaimer en pie: "Documento generado por IA. No constituye asesoria legal."
- **Esfuerzo:** M
- **Depende de:** Workflow bot funcionando

### [P1] Boton "Analizar por WhatsApp" en web
- **Que:** CTA en landing page + calculadora IPC + blog → link wa.me/NUMERO con mensaje pre-llenado
- **Por que:** Conectar trafico web existente (SEO) al canal primario (WhatsApp)
- **Contexto:** La calculadora IPC ya recibe trafico. El blog tiene 5 articulos SEO. Solo falta el CTA.
- **Esfuerzo:** S
- **Depende de:** Numero WhatsApp activo

### [P1] Viral loop multi-actor
- **Que:** Al final del analisis, mensaje contextual segun rol: al inquilino "Comparte con tu arrendador", al propietario "Comparte con tu agente inmobiliario"
- **Por que:** Cada actor del ecosistema trae al siguiente. Loop viral nativo de WhatsApp (reenviar = 1 tap)
- **Esfuerzo:** S
- **Depende de:** Deteccion de rol (puede ser simple al inicio: "Eres inquilino o propietario?")

### [P2] Soft launch: primeros 10-20 usuarios
- **Que:** Compartir con amigos, conocidos, grupos de WhatsApp de edificios/conjuntos
- **Por que:** Validar el flujo con usuarios reales antes de escalar distribucion
- **Esfuerzo:** S
- **Depende de:** Todo lo anterior

---

## FASE 1: Semana 4+ — Distribucion (growth)

### [P2] Activar cuentas RRSS + parrilla de contenido
- **Que:** Crear cuentas Instagram/TikTok/Twitter/LinkedIn. Activar workflow n8n de parrilla social (HD9lC2MFodPlOb2d, ya existe).
- **Por que:** Distribucion organica. Calendario de 30 dias ya creado.
- **Esfuerzo:** M
- **Depende de:** Contenido ya existe, solo falta crear cuentas y activar

### [P3] Modularizar frontend con ES modules
- **Que:** Separar app.js en modulos (upload.js, results.js, auth.js) con ES module imports
- **Por que:** Decision 1A — preparar para nuevas features sin espagueti
- **Contexto:** Sin framework, sin build step. Solo import/export nativos del browser.
- **Esfuerzo:** M
- **Depende de:** Nada (puede hacerse en cualquier momento)

---

## FASE 1.5: Multi-Documento — Arquitectura + Implementacion

> CEO Review 2026-03-12 — Modo EXPANSION
> Objetivo: Expandir InmoLawyer de 1 tipo (arriendo vivienda) a 4 tipos de documento.
> Tipos nuevos: arriendo comercial, promesa de compraventa, certificado de libertad y tradicion.

### Decisiones de arquitectura multi-documento

| # | Decision | Opcion elegida |
|---|----------|----------------|
| MD-1 | Schema DB | Schema flexible con JSONB: tabla `documentos` con `tipo_documento` + `datos_extraidos JSONB` |
| MD-2 | Frontend resultados | Renderer dinamico basado en `tipo_documento`: backend devuelve `campos_display[]` + `score_labels` |
| MD-3 | Score de riesgo | Score universal 0-100 con labels dinamicas por tipo (backend las resuelve) |
| MD-4 | Workflow n8n | Un workflow con switch post-clasificacion (no workflows separados) |
| MD-5 | Research legal | Research profundo ANTES de implementar cada tipo (no confiar en knowledge general del LLM) |
| MD-6 | Validacion LLM | Triple defensa: prompt constraining + output schema + post-validation con allowlist de articulos |
| MD-7 | Privacidad terceros | No-persistencia de datos de terceros para todos los tipos (extiende decision 8A) |
| MD-8 | Clasificacion erronea | Mostrar tipo detectado + permitir override sin costo de credito |
| MD-9 | Schema resultado | Resultado unificado con `secciones_extra` opcionales por tipo (anotaciones, timeline, etc.) |
| MD-10 | Refactor frontend | Refactor completo app.js → modulos ES antes de multi-doc |
| MD-11 | Testing prompts | Corpus de documentos ejemplo + eval checklist por tipo |
| MD-13 | Observabilidad | Eventos de clasificacion en bot_events (classification_result, classification_override, validation_flag) |
| MD-14 | Deploy | 3 fases: A (refactor invisible) → B (clasificador + arriendo comercial) → C (promesa + certificado) |

### Deploy Fase A — Refactor invisible (0 impacto usuario)

#### [P1] Migracion DB: `contratos` → `documentos` con JSONB
- **Que:** Crear tabla `documentos` con: id, user_id, tipo_documento, archivo_nombre, archivo_tipo, estado, score_riesgo, datos_extraidos JSONB, resultado_json JSONB, created_at, updated_at. Migrar datos existentes con tipo_documento='ARRIENDO_VIVIENDA'. Crear view `contratos` para backward compat. Renombrar `alertas_contrato` → `alertas_documento`.
- **Por que:** Fundamento para multi-doc. Sin esto, nada mas funciona.
- **Contexto:** Supabase permite migraciones SQL directas. View de compat = frontend actual sigue funcionando sin cambios.
- **Esfuerzo:** M
- **Depende de:** Nada

#### [P1] Refactor app.js → modulos ES
- **Que:** Separar app.js (81KB) en: config.js, upload.js, results-renderer.js, pdf-generator.js, chat.js, payments.js, ui-helpers.js. Import/export nativos del browser. Sin framework, sin build step.
- **Por que:** Base limpia antes de multi-doc (decision MD-10). El renderer dinamico y el PDF adaptado por tipo necesitan estructura modular.
- **Contexto:** Sube de P3 a P1 porque es prerrequisito de multi-doc. results-renderer.js es donde vive toda la logica multi-tipo.
- **Esfuerzo:** L
- **Depende de:** Nada

### Deploy Fase B — Clasificador + arriendo comercial

#### [P1] Research legal: Arriendo Comercial
- **Que:** Compilar marco legal completo: Codigo de Comercio Art. 518-524, derecho de renovacion, derecho de preferencia, indemnizacion por no renovacion, diferencias explicitas con Ley 820.
- **Por que:** Sin esto el prompt alucina o aplica Ley 820 (error grave — Art. 2 Ley 820 excluye locales comerciales).
- **Contexto:** Mismo rigor que youtube-insights-ley820.md. Buscar videos creadores juridicos + textos legales. Output: `legal/research-arriendo-comercial.md`.
- **Esfuerzo:** M
- **Depende de:** Nada

#### [P1] Research legal: Promesa de Compraventa
- **Que:** Compilar marco legal: Codigo Civil Art. 1611, requisitos de validez (escritura publica vs documento privado), arras, clausula penal, condiciones resolutorias, plazos de escrituracion, Ley 1579/2012.
- **Por que:** Alto valor — el usuario esta por hacer la transaccion mas grande de su vida. Errores pueden significar perder arras o el inmueble.
- **Contexto:** Output: `legal/research-promesa-compraventa.md`. Incluir: clausulas abusivas comunes, requisitos formales, que invalida la promesa, campos a extraer.
- **Esfuerzo:** M
- **Depende de:** Nada (parallelizable)

#### [P1] Research legal: Certificado de Libertad y Tradicion
- **Que:** Compilar estructura del certificado: secciones (complementacion, tradicion, anotaciones), tipos de anotacion (compraventa, hipoteca, embargo, cancelacion, desenglobe, servidumbre, patrimonio de familia, afectacion a vivienda familiar), como leer cadena de titulares, que constituye "falsa tradicion", banderas rojas.
- **Por que:** Producto diferenciador — nadie ofrece lectura inteligente de certificados con IA en Colombia.
- **Contexto:** Output: `legal/research-certificado-libertad.md`. Basado en Ley 1579/2012, Decreto 1250/1970, guias SNR.
- **Esfuerzo:** M
- **Depende de:** Nada (parallelizable)

#### [P1] Clasificador multi-tipo en Gate+OCR
- **Que:** Modificar prompt de Gate+OCR (Gemini Vision) para clasificar tipo: ARRIENDO_VIVIENDA, ARRIENDO_COMERCIAL, PROMESA_COMPRAVENTA, CERT_LIBERTAD, DESCONOCIDO. Output JSON: { tipo_documento, confidence, texto_extraido }.
- **Por que:** Habilita el switch por tipo en n8n. 0 llamadas extra (se absorbe en llamada existente).
- **Contexto:** Gate actual dice "es contrato de arrendamiento?". Nuevo dice "es documento legal inmobiliario? de que tipo?". Misma llamada, prompt ampliado.
- **Esfuerzo:** S
- **Depende de:** Research legal (para saber que clasificar)

#### [P1] Corpus de documentos ejemplo para eval
- **Que:** Conseguir o crear 3-5 documentos por tipo (12-20 total) con clausulas/anotaciones problematicas conocidas. Para cada documento, eval checklist: "Este doc tiene X → analisis DEBE detectar Y como alerta Z."
- **Por que:** Sin esto no hay forma de validar que los prompts funcionan (decision MD-11).
- **Contexto:** ejemplo_contrato.txt actual es el modelo. Replicar para cada tipo. Guardar en `test-docs/` con checklist.
- **Esfuerzo:** M
- **Depende de:** Research legal

#### [P2] Allowlists de articulos legales por tipo
- **Que:** Archivo JSON o nodo Code en n8n con referencias legales validas por tipo. Post-validator compara cada referencia_legal contra allowlist. Si no esta → strip + log validation_flag.
- **Por que:** Tercera capa de defensa contra alucinaciones legales (decision MD-6).
- **Contexto:** Se alimenta del research legal. Cada research produce la allowlist de su tipo.
- **Esfuerzo:** S
- **Depende de:** Research legal

#### [P2] Declaracion de consentimiento de terceros pre-analisis
- **Que:** Modal: "Este documento puede contener datos de terceros. Declaro que soy parte de esta relacion contractual." Checkbox obligatorio. Registrar en bot_events como consent_terceros.
- **Por que:** Complementa no-persistencia (decision MD-7). Certificados de libertad tienen 10+ terceros. Ley 1581 requiere base legal.
- **Contexto:** En web: modal con checkbox. En WhatsApp: mensaje interactivo con boton "Acepto".
- **Esfuerzo:** S
- **Depende de:** Nada

### Deploy Fase C — Promesa compraventa + certificado libertad

> Se agregan una vez validado el flujo con arriendo comercial.
> Cada tipo = prompt + allowlist + documentos ejemplo + eval.

### Delight opportunities (vision)

#### Combo analisis: Promesa + Certificado juntos
- **Que:** CTA cruzado: al analizar promesa → "Ya revisaste el certificado de libertad?". Si sube ambos, cruzar datos: vendedor de promesa = propietario segun certificado? Hay embargos que bloquean la venta?
- **Esfuerzo:** S (CTA) + M (cruce de datos)

#### Resumen en lenguaje ciudadano para certificados
- **Que:** Parrafo de 3-4 lineas: "Este inmueble esta a nombre de Maria Lopez desde 2019. Tiene hipoteca con Bancolombia vigente. No tiene embargos. Tradicion limpia." Como un abogado amigo en el WhatsApp.
- **Esfuerzo:** S

#### Comparador arriendo vivienda vs comercial
- **Que:** Mini-box educativo: "Este contrato es arriendo comercial. A diferencia del de vivienda, tienes derecho de renovacion (Art. 518 C.Comercio)."
- **Esfuerzo:** S

#### Timeline visual para certificados de libertad
- **Que:** Anotaciones como timeline vertical cronologica con iconos por tipo y colores (verde: compraventas, amarillo: hipotecas, rojo: embargos). Cuenta la "historia del inmueble".
- **Esfuerzo:** M

#### Checklist pre-firma para promesas de compraventa
- **Que:** Al final del analisis, checklist accionable: verificar certificado, confirmar propietario, verificar embargos, validar arras, consultar abogado. Con links internos a herramientas InmoLawyer.
- **Esfuerzo:** S

---

## FASE 2 (mes 3-6) — Vision items

### Deteccion de rol en primer mensaje
- **Que:** "Quien eres? 1 Inquilino 2 Propietario 3 Agente/Inmobiliaria 4 Firma legal". Cambia tono del analisis segun rol.
- **Por que:** El mismo problema legal se enmarca distinto: al inquilino "te cobran de mas", al propietario "esta clausula te expone a demanda"
- **Esfuerzo:** M

### Alerta de renovacion multi-actor
- **Que:** 30 dias antes del vencimiento, al inquilino: "Incremento maximo legal: X%". Al propietario: "Puedes incrementar hasta X%. Aqui tu carta de notificacion."
- **Por que:** Retiene usuarios + genera valor recurrente de un solo analisis
- **Esfuerzo:** M

### Sello "Analizado por InmoLawyer"
- **Que:** Badge: "Contrato analizado con IA segun Ley 820 de 2003 — No constituye asesoria legal"
- **Por que:** Diferenciador B2B para agentes e inmobiliarias. Transparencia, no garantia legal.
- **Esfuerzo:** S

### B2B pilotos con inmobiliarias
- **Que:** Outreach a los 41 leads de Apollo (16 empresas + 25 contactos). Pitch: analisis en lote de cartera de contratos.
- **Por que:** Con traccion B2C + datos de uso, el pitch B2B es mas fuerte
- **Esfuerzo:** L
- **Depende de:** Traccion fase 1

### Dashboard de cartera (web app)
- **Que:** Vista web para inmobiliarias: subir multiples contratos, dashboard agregado con stats por localidad/estrato/riesgo
- **Esfuerzo:** XL

### Chat legal post-analisis
- **Que:** Despues del resultado, el usuario puede preguntar sobre su contrato por WhatsApp
- **Esfuerzo:** M

### Multi-pagina (contrato largo)
- **Que:** El usuario manda varias fotos que se concatenan como un solo contrato
- **Esfuerzo:** M

---

## FASE 3 (mes 6-12) — Hub legal finca raiz

### API para integraciones
- **Que:** REST API para que inmobiliarias, afianzadoras y firmas legales integren analisis en sus sistemas
- **Esfuerzo:** L

### Scoring de riesgo para polizas
- **Que:** Afianzadoras usan el score de InmoLawyer como input para evaluar riesgo antes de afianzar
- **Esfuerzo:** L

### Plantillas de contratos legales
- **Que:** Contratos modelo descargables, personalizables, que ya cumplen Ley 820
- **Esfuerzo:** M

### White-label
- **Que:** Inmobiliarias grandes usan InmoLawyer con su propia marca
- **Esfuerzo:** XL

### Multi-pais
- **Que:** Expandir a leyes de arrendamiento de otros paises (Mexico, Chile, Argentina)
- **Esfuerzo:** XL

---

## Decisiones de arquitectura tomadas (referencia)

| # | Decision | Opcion elegida |
|---|----------|----------------|
| 1A | Frontend | Modularizar vanilla con ES modules, sin framework |
| 2A | Infra | Health check UptimeRobot + auto-restart, sin migrar |
| 3A | Analytics | Plausible Analytics + custom events |
| 4A-WA | Canal primario | WhatsApp via Kapso, foto→OCR→analisis |
| 5A | Carta | Server-side n8n (Gemini + HTML→PDF), enviada por WA |
| 6A | Errores | Always-reply handler global + tabla errores Supabase |
| 7A | Validacion | Gate pre-analisis con Gemini Vision |
| 8A | Privacidad datos | No persistir datos arrendador, eliminar contrato post-analisis |
| 9A | Transferencia intl | DPA Google + disclosure T&C + consentimiento WA |
| 10A | Seguridad webhook | Secret header Kapso→n8n |
| 11A | Bot UX | State machine minima: IDLE→VALIDANDO→ANALIZANDO→RESULTADO |
| 14A | Testing | QA manual con checklist + sandbox Kapso |
| 15A | Performance | ACK inmediato + gate+OCR combinados en 1 llamada |
| 16A | Observabilidad | Tabla bot_events en Supabase |
| 17A | Rollout | 4 fases semanales: fundamentos→bot→carta→distribucion |
