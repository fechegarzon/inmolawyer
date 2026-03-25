# Research Legal: Terminos y Condiciones + Politica de Privacidad — InmoLawyer

**Fecha:** 2026-03-12
**Preparado para:** InmoLawyer (inmo.tools/inmolawyer)
**Producto:** SaaS de analisis de contratos de arrendamiento con IA
**Jurisdiccion:** Colombia

---

## 1. RESUMEN EJECUTIVO — 5 Riesgos Legales Principales

### Riesgo 1: Tratamiento de datos personales de terceros sin consentimiento
**Severidad: CRITICA**
El usuario sube un contrato que contiene datos personales del arrendador (nombre, cedula, NIT, direccion). Bajo la Ley 1581 de 2012, Art. 9, el tratamiento de datos personales requiere autorizacion previa e informada del titular. El arrendador NO ha dado su consentimiento.

**Mitigacion:**
- Incluir clausula donde el usuario declara que tiene autorizacion del arrendador o que actua en ejercicio de un interes legitimo (defensa de sus derechos contractuales).
- Alternativamente, acogerse a la excepcion del Art. 10 literal d) de la Ley 1581: datos requeridos para el ejercicio de un derecho en un proceso judicial o administrativo. El analisis del contrato constituye un ejercicio del derecho de informacion del arrendatario sobre su propia relacion contractual.
- Anonimizar o no almacenar datos del arrendador mas alla del analisis inmediato.

### Riesgo 2: Transferencia internacional de datos a proveedores de IA
**Severidad: ALTA**
Los datos del contrato se envian a Google (Gemini) para procesamiento. Esto constituye transferencia internacional de datos personales (Art. 26, Ley 1581). Google tiene servidores fuera de Colombia.

**Mitigacion:**
- Celebrar contrato de transmision/transferencia de datos con Google (Data Processing Agreement).
- Verificar que Google cumple con nivel adecuado de proteccion (EE.UU. no tiene declaracion de adecuacion de la SIC, pero se puede usar contrato).
- Declarar en la Politica de Privacidad que datos se transfieren a terceros internacionales, identificar al encargado, y el pais destino.
- Documentar las DPA de Google Cloud/Vertex AI.

### Riesgo 3: Falta de registro ante la SIC (RNBD)
**Severidad: ALTA**
Toda persona juridica o natural que trate datos personales debe registrar sus bases de datos en el Registro Nacional de Bases de Datos (RNBD) de la SIC (Decreto 886 de 2014, Art. 3). El incumplimiento acarrea multas de hasta 2.000 SMLMV (~$2.600 millones COP en 2026).

**Mitigacion:**
- Registrar las bases de datos ante la SIC antes del lanzamiento publico.
- Identificar claramente: finalidad, tipo de datos, mecanismo de recoleccion, medidas de seguridad.

### Riesgo 4: InmoLawyer puede interpretarse como asesoria legal no autorizada
**Severidad: MEDIA-ALTA**
El nombre "InmoLawyer" y la generacion de cartas de reclamacion podrian interpretarse como ejercicio ilegal de la abogacia (Ley 1123 de 2007, Codigo Disciplinario del Abogado). Aunque es una herramienta de IA informativa, sin un disclaimer claro, un usuario podria argumentar que confiaba en "asesoria legal".

**Mitigacion:**
- Disclaimer prominente en T&C, en la app, y en cada reporte: "InmoLawyer es una herramienta informativa. No constituye asesoria legal. Para decisiones legales, consulte un abogado."
- Las cartas de reclamacion deben indicarse como "plantillas" o "borradores", no como documentos legales definitivos.

### Riesgo 5: Retencion indefinida de contratos con datos sensibles
**Severidad: MEDIA**
Almacenar contratos de arrendamiento (que contienen cedulas, direcciones, datos financieros) de forma indefinida viola el principio de limitacion temporal del tratamiento (Art. 4 literal g, Ley 1581).

**Mitigacion:**
- Definir politica de retencion clara (ej: 90 dias para contratos, 1 ano para reportes anonimizados).
- Implementar eliminacion automatica.
- Ofrecer al usuario la posibilidad de eliminar sus datos en cualquier momento.

---

## 2. ANALISIS DETALLADO

### 2.1 Ley 1581 de 2012 — Proteccion de Datos Personales

#### 2.1.1 Tipos de datos que trata InmoLawyer

| Dato | Clasificacion | Fundamento |
|------|--------------|------------|
| Nombre del usuario (perfil WA) | Dato personal (Art. 3) | Identifica a persona natural |
| Telefono del usuario | Dato personal (Art. 3) | Identifica a persona natural |
| Nombre del arrendador | Dato personal de tercero (Art. 3) | Identifica a persona natural |
| Cedula/NIT del arrendador | Dato personal semiprivado (Art. 3, Ley 1266/2008) | Dato de identificacion |
| Cedula del arrendatario | Dato personal semiprivado | Dato de identificacion |
| Direccion del inmueble | Dato personal | Puede asociarse a persona |
| Canon de arrendamiento | Dato semiprivado/financiero | Informacion economica contractual |
| Contenido completo del contrato | Dato personal complejo | Contiene multiples datos personales |
| Datos de pago (Wompi) | Dato financiero | Procesado por Wompi, no almacenado |

**Nota importante:** Ningun dato tratado por InmoLawyer califica como dato sensible en el sentido estricto del Art. 5 de la Ley 1581 (origen racial, orientacion politica, convicciones religiosas, salud, vida sexual, datos biometricos). Esto simplifica el regimen de autorizacion.

#### 2.1.2 Datos de terceros (el arrendador)

**Problema central:** El contrato de arrendamiento contiene datos personales del arrendador, quien no ha dado consentimiento a InmoLawyer.

**Analisis juridico:**

La Ley 1581 de 2012, Art. 9, exige autorizacion del titular. Sin embargo, existen excepciones en el Art. 10:

- **Literal a):** Informacion requerida por una entidad publica o administrativa en ejercicio de sus funciones legales — NO APLICA.
- **Literal b):** Datos de naturaleza publica — PARCIALMENTE APLICA. La Corte Constitucional (Sentencia C-748 de 2011) ha establecido que los datos contenidos en documentos publicos son de naturaleza publica. Sin embargo, un contrato de arrendamiento privado no es documento publico per se, a menos que este registrado ante notaria.
- **Literal c):** Casos de urgencia medica o sanitaria — NO APLICA.
- **Literal d):** Tratamiento de informacion autorizado por la ley para fines historicos, estadisticos o cientificos — NO APLICA directamente.
- **Literal e):** Datos relacionados con el Registro Civil — NO APLICA.

**Mejor argumento legal:** El arrendatario tiene un interes legitimo en conocer los derechos y obligaciones de su propio contrato. El analisis del contrato es un ejercicio del derecho constitucional a la informacion (Art. 20, Constitucion Politica) y del derecho a la defensa (Art. 29, Constitucion Politica). El tratamiento de datos del arrendador es incidental al ejercicio de un derecho propio del usuario.

**Adicionalmente:** La Corte Constitucional en Sentencia T-729 de 2002 y la SIC en diversos conceptos han reconocido que cuando una persona es parte de un contrato, tiene derecho a acceder y analizar la totalidad del documento contractual, incluyendo los datos de la contraparte que figuran en el.

**Recomendacion practica:**
1. El usuario debe declarar en los T&C que es parte del contrato que sube (arrendatario o arrendador).
2. InmoLawyer NO debe almacenar, indexar ni crear perfiles del arrendador.
3. Los datos del arrendador deben tratarse exclusivamente para el analisis y no para ninguna otra finalidad.
4. Implementar anonimizacion del arrendador en logs y almacenamiento posterior al analisis.

#### 2.1.3 Tipo de autorizacion requerida

Segun el Art. 9 de la Ley 1581 y el Art. 7 del Decreto 1377 de 2013:

- La autorizacion puede obtenerse por **cualquier medio que pueda ser objeto de consulta posterior**: escrito, oral, o mediante conductas inequivocas.
- Para medios electronicos, el Decreto 1377, Art. 7, permite la autorizacion por medios tecnicos que permitan manifestar la voluntad del titular.
- **WhatsApp es un medio valido** siempre que:
  - Se presente al usuario un mensaje claro con la politica de tratamiento ANTES de recolectar datos.
  - El usuario manifieste su aceptacion de forma inequivoca (ej: enviando "ACEPTO" o presionando un boton interactivo).
  - Se conserve evidencia de la autorizacion (log del mensaje con timestamp).

**Requisitos minimos del contenido de la autorizacion (Art. 12, Ley 1581):**
1. Nombre o razon social del responsable del tratamiento.
2. Datos de contacto del responsable (direccion, telefono, correo).
3. Finalidad del tratamiento.
4. Derechos del titular (ARCO).
5. Caracter facultativo de la respuesta (cuando se trata de datos sensibles o de menores — aunque no aplica directamente aqui, es buena practica incluirlo).

#### 2.1.4 Registro ante la SIC (RNBD)

**Obligacion:** Si, InmoLawyer debe registrar sus bases de datos ante el RNBD.

**Fundamento:** Decreto 886 de 2014 (compilado en el Decreto Unico 1074 de 2015, Libro 2, Parte 2, Titulo 2, Capitulo 26). Todo responsable del tratamiento de datos personales debe inscribir sus bases de datos.

**Bases de datos a registrar:**
1. Base de datos de usuarios (telefono, nombre, historial de analisis).
2. Base de datos de contratos analizados (si se almacenan).
3. Base de datos de pagos/facturacion.

**Plazo:** El registro debe hacerse dentro de los 2 meses siguientes al inicio del tratamiento.

**Proceso:** Se realiza en linea en www.sic.gov.co/rnbd.

#### 2.1.5 Derechos ARCO

Segun Arts. 14-16 de la Ley 1581 de 2012, el titular tiene derecho a:

| Derecho | Descripcion | Implementacion en InmoLawyer |
|---------|-------------|------------------------------|
| **Acceso** | Conocer que datos tenemos | Endpoint o comando WA para consultar datos almacenados |
| **Rectificacion** | Corregir datos inexactos | Permitir al usuario actualizar su perfil |
| **Cancelacion** (Supresion) | Eliminar datos | Comando "ELIMINAR MIS DATOS" en WA + boton en web |
| **Oposicion** | Oponerse al tratamiento | Opcion de revocar autorizacion |

**Plazos de respuesta (Art. 15):**
- Consultas: 10 dias habiles (prorrogable 5 dias mas).
- Reclamos: 15 dias habiles (prorrogable 8 dias mas).

**Canal de atencion:** Debe designarse un canal (correo electronico minimo). Recomendacion: datos@inmo.tools o privacidad@inmo.tools.

### 2.2 Decreto 1377 de 2013

#### 2.2.1 Aviso de privacidad vs. Politica de tratamiento

Son documentos DIFERENTES y se necesitan AMBOS:

**Politica de Tratamiento de Datos (Art. 13, Decreto 1377):**
- Documento completo y detallado.
- Debe estar disponible en la web del responsable.
- Contenido minimo: nombre del responsable, tratamiento al cual seran sometidos los datos, derechos de los titulares, persona o area responsable, procedimiento para ejercer derechos, fecha de vigencia.

**Aviso de Privacidad (Art. 14-15, Decreto 1377):**
- Version resumida para comunicar al titular EN EL MOMENTO de la recoleccion.
- Contenido minimo: nombre/razon social del responsable, datos que se recolectan, finalidad, derechos del titular, mecanismos del responsable para consulta de la politica completa.
- En el contexto de WhatsApp, el Aviso de Privacidad es lo que se le envia al usuario ANTES de que envie su contrato.

#### 2.2.2 Prueba de la autorizacion

Art. 7, Decreto 1377: El responsable debe conservar prueba de la autorizacion. En WhatsApp esto significa:
- Guardar el log del mensaje donde el usuario acepta.
- Almacenar timestamp, numero de telefono, y texto del consentimiento.
- Recomendacion: guardar en Supabase una tabla `consent_log` con: user_id, phone, consent_text, channel (whatsapp/web), timestamp, ip (para web).

### 2.3 Ley 1266 de 2008 — Habeas Data Financiero

**Analisis:** La Ley 1266 regula datos financieros, crediticios, comerciales y de servicios, especificamente en el contexto de centrales de riesgo y reportes de credito.

**Conclusion: NO APLICA directamente a InmoLawyer.**

Razones:
- InmoLawyer no es un operador de informacion financiera.
- No reporta a centrales de riesgo.
- El canon de arrendamiento en el contrato es un dato contractual, no un dato financiero en el sentido de la Ley 1266.
- Los pagos a InmoLawyer los procesa Wompi, que tiene su propia regulacion.

**Sin embargo:** Si en el futuro InmoLawyer ofreciera un servicio de verificacion de historial de pago de arrendatarios o scoring crediticio, la Ley 1266 SI aplicaria.

### 2.4 Circular Externa 002 de 2015 — SIC

Esta circular establece instrucciones sobre:

1. **Seguridad de la informacion (Seccion 2.3):** El responsable debe implementar medidas tecnicas, humanas y administrativas para garantizar la seguridad de los datos. Para InmoLawyer esto implica:
   - Cifrado de datos en transito (HTTPS — ya cubierto con Caddy/SSL).
   - Cifrado de datos en reposo (Supabase ofrece esto por defecto).
   - Control de acceso a la base de datos.
   - Politica de copias de seguridad.
   - Bitacora de accesos.

2. **Responsabilidad demostrada / Accountability (Seccion 2.4):** El responsable debe poder demostrar que cumple. Esto implica documentar:
   - Politicas internas de tratamiento.
   - Programas de capacitacion (aunque sea unipersonal, documentar el conocimiento).
   - Evaluaciones de impacto en privacidad (recomendable aunque no obligatorio para empresas pequenas).

3. **Tratamiento de datos por medios electronicos (Seccion 2.5):** Para recoleccion en linea:
   - Debe presentarse el aviso de privacidad ANTES de recolectar datos.
   - Debe obtenerse autorizacion expresa y previa.
   - En formularios web: checkbox NO premarcado + link a politica completa.
   - En WhatsApp: mensaje de consentimiento ANTES del primer procesamiento.

### 2.5 Uso de IA y Datos Personales en Colombia

#### 2.5.1 Regulacion especifica de IA

A marzo de 2026, Colombia NO tiene una ley especifica de inteligencia artificial. Sin embargo:

**CONPES 3975 de 2019 — Politica Nacional de IA:**
- Es un documento de politica publica, NO una ley vinculante.
- Establece principios eticos para IA: transparencia, explicabilidad, no discriminacion.
- Recomienda que el uso de IA respete la privacidad y proteccion de datos.
- No crea obligaciones legales directas, pero la SIC podria usarlo como referencia interpretativa.

**Proyecto de Ley de IA (en tramite):**
- Desde 2023 hay varios proyectos de ley en el Congreso colombiano sobre regulacion de IA.
- A marzo 2026, no hay ley aprobada vinculante que regule especificamente IA.
- Sin embargo, la tendencia regulatoria (inspirada en EU AI Act) apunta a mayor regulacion.

**Guias de la SIC:**
- La SIC ha emitido conceptos indicando que el uso de IA para tratar datos personales esta sujeto a la Ley 1581.
- La SIC ha enfatizado que la toma de decisiones automatizadas con datos personales debe garantizar transparencia.
- El titular tiene derecho a saber que sus datos son procesados por un sistema automatizado.

**Recomendacion:** Incluir en la Politica de Privacidad y en los T&C:
- Que se utiliza IA para el analisis de contratos.
- Que la IA puede cometer errores.
- Que el resultado no constituye asesoria legal.
- Identificar los proveedores de IA (Google/Gemini).

#### 2.5.2 Transferencia de datos a APIs de terceros (Gemini/Google)

**Marco legal:** Art. 26, Ley 1581 de 2012; Arts. 24-25, Decreto 1377 de 2013.

La transferencia de datos personales a Google (Gemini API) constituye una **transmision** o **transferencia internacional de datos**:

- **Transmision:** Cuando se envian datos a un encargado del tratamiento (Google procesa por cuenta de InmoLawyer). Art. 25, Decreto 1377.
- **Transferencia:** Cuando se envian datos a un tercero que se convierte en responsable. Art. 24, Decreto 1377.

En este caso, Google actua como **encargado del tratamiento** (procesador), por lo que es una TRANSMISION.

**Requisitos:**
1. **Contrato de transmision de datos** con Google que establezca: alcance del tratamiento, finalidad, obligacion de confidencialidad, medidas de seguridad, devolucion/destruccion de datos al terminar.
   - Google ofrece un DPA (Data Processing Addendum) estandar para Google Cloud/Vertex AI. Este debe aceptarse y documentarse.
2. **Informar al titular** en la Politica de Privacidad que datos personales seran transmitidos a Google LLC (EE.UU.) para procesamiento.
3. **No se requiere autorizacion adicional** del titular para la transmision (a diferencia de la transferencia), siempre que el contrato con el encargado cumpla los requisitos del Art. 25 del Decreto 1377.

**Nota sobre Google Gemini API Terms:**
- Bajo los terminos de Google Cloud para Gemini API (pago), Google NO entrena modelos con los datos enviados.
- Bajo la version gratuita de Gemini API, Google SI podria usar datos para mejorar sus modelos — esto seria problematico.
- **Verificar que InmoLawyer usa la version de pago de Gemini API** o al menos que los terminos excluyan uso de datos para entrenamiento.

### 2.6 WhatsApp Business / Meta Policies

#### 2.6.1 Requisitos de Meta para WhatsApp Business API

Meta requiere que los negocios que usan WhatsApp Business API:

1. **Opt-in explícito:** El usuario debe dar opt-in ANTES de recibir mensajes del negocio. Esto puede ser via: web form, WhatsApp thread (si el usuario inicia la conversacion), SMS, o en persona.

2. **Politica de Comercio de WhatsApp:** El negocio debe tener una politica de privacidad publicada.

3. **Politica de Mensajeria de WhatsApp Business:** Los mensajes deben ser relevantes, esperados y oportunos.

4. **Templates de mensaje:** Los mensajes proactivos (fuera de la ventana de 24 horas) requieren templates aprobados por Meta. Los templates transaccionales (notificaciones de estado, confirmaciones) generalmente se aprueban facilmente.

#### 2.6.2 Opt-in de WA vs. Consentimiento Ley 1581

**El opt-in de WhatsApp NO es suficiente como autorizacion bajo la Ley 1581.**

Razones:
- El opt-in de WA es para recibir mensajes, no para el tratamiento de datos personales.
- La Ley 1581 requiere autorizacion especifica que incluya: identificacion del responsable, finalidad, derechos del titular.
- El opt-in de WA no cubre la finalidad de "analizar su contrato con IA" ni "transmitir datos a Google".

**Solucion:** Se necesita un flujo de consentimiento ADICIONAL dentro de la conversacion de WhatsApp, ANTES de que el usuario envie su contrato. (Ver Seccion 6).

#### 2.6.3 Templates que necesitan aprobacion

Para InmoLawyer via Kapso, se necesitarian templates aprobados para:
- Mensaje de bienvenida con consentimiento de datos.
- Notificacion de analisis completado.
- Recordatorio de pago.
- Mensaje de marketing/re-engagement (si aplica).

### 2.7 Datos de Terceros en Contratos

#### 2.7.1 Obligacion de notificar al arrendador

**Analisis estricto de la ley:** Si, en teoria, la Ley 1581 requiere autorizacion del titular (arrendador) para tratar sus datos.

**Analisis practico y excepciones:**

1. **Datos contractuales compartidos:** Ambas partes del contrato tienen acceso legitimo a la totalidad del documento. El arrendatario no viola ninguna norma al analizar su propio contrato, que naturalmente contiene datos de la contraparte.

2. **Finalidad de defensa de derechos:** El Art. 13 literal e) del Decreto 1377 establece que el tratamiento es legitimo cuando es necesario para el ejercicio de un derecho. El arrendatario ejerce su derecho a conocer si su contrato tiene clausulas abusivas.

3. **Datos incidentales:** Los datos del arrendador no son la finalidad principal del tratamiento. InmoLawyer no busca construir un perfil del arrendador sino analizar clausulas contractuales.

4. **Precedente en servicios similares:** Servicios como LegalZoom, Rocket Lawyer, DoNotPay, y similares NO notifican a la contraparte contractual cuando un usuario sube un contrato para revision. El estandar de la industria es:
   - Disclaimer de que el usuario declara tener derecho a compartir el documento.
   - No almacenar ni crear perfiles de terceros.
   - Uso exclusivo para la finalidad declarada.

**Recomendacion:** NO notificar al arrendador (seria impracticable y contrario al proposito del servicio), pero SI:
- Incluir clausula en T&C donde el usuario declara ser parte del contrato.
- Minimizar el tratamiento de datos del arrendador (no indexar, no crear perfiles).
- Eliminar el contrato despues del periodo de retencion.
- Documentar la base juridica (interes legitimo + ejercicio de derechos).

### 2.8 Retencion y Eliminacion de Datos

#### 2.8.1 Marco legal

- **Art. 4 literal e), Ley 1581:** Principio de limitacion temporal — los datos solo pueden tratarse durante el tiempo razonable y necesario para la finalidad.
- **Art. 11, Decreto 1377:** El responsable debe suprimir los datos cuando hayan dejado de ser necesarios o pertinentes para la finalidad.

#### 2.8.2 Politica de retencion recomendada

| Tipo de dato | Periodo de retencion | Justificacion |
|-------------|---------------------|---------------|
| Contrato original (imagen/PDF) | 30 dias | Solo necesario para re-consulta y soporte |
| Reporte de analisis | 1 ano | Valor para el usuario, referencia futura |
| Datos de usuario (perfil) | Mientras tenga cuenta activa + 6 meses | Periodo de gracia por reactivacion |
| Logs de consentimiento | 5 anos | Prueba de cumplimiento normativo (prescripcion) |
| Datos de pago | Segun normas tributarias (5 anos) | Obligacion tributaria colombiana |
| Logs de n8n | 30 dias | Solo para debugging, luego purgar |
| Datos en APIs de IA (Gemini) | 0 — no retener | Google no retiene datos de API de pago |

#### 2.8.3 Eliminacion automatica

Implementar:
- Cron job para eliminar contratos de Supabase Storage despues de 30 dias.
- Derecho de supresion: endpoint para que el usuario elimine todos sus datos inmediatamente.
- Al eliminar cuenta: borrar todo excepto logs de consentimiento y datos tributarios.

### 2.9 Menores de Edad

#### 2.9.1 Marco legal

- **Art. 7, Ley 1581:** Queda proscrito el tratamiento de datos personales de ninos, ninas y adolescentes, salvo aquellos datos que sean de naturaleza publica.
- **Art. 12, Decreto 1377:** La autorizacion del representante legal es necesaria para el tratamiento de datos de menores.

#### 2.9.2 Aplicacion a InmoLawyer

- En Colombia, un menor de edad NO puede celebrar contrato de arrendamiento como arrendatario por si mismo (requiere representante legal). Art. 1504, Codigo Civil.
- Sin embargo, un menor PODRIA usar InmoLawyer para analizar un contrato en nombre de su familia.
- El riesgo es bajo pero existe.

**Recomendacion:**
- Incluir en T&C que el servicio esta dirigido a mayores de 18 anos.
- No implementar verificacion de edad compleja (desproporcionado para el riesgo).
- Incluir clausula: "Al usar InmoLawyer, usted declara ser mayor de 18 anos o contar con la autorizacion de su representante legal."
- En WhatsApp, la cuenta esta vinculada a un telefono movil, lo que provee una verificacion implicita razonable.

### 2.10 Jurisdiccion y Responsabilidad

#### 2.10.1 Disclaimer de no-asesoria legal

**Si, es valido y necesario.** En Colombia no hay prohibicion de incluir disclaimers de limitacion de responsabilidad en servicios informativos.

**Fundamento:**
- InmoLawyer NO ejerce la abogacia. Es una herramienta tecnologica de analisis.
- La Ley 1123 de 2007 (Codigo Disciplinario del Abogado) regula a personas naturales inscritas como abogados, no a herramientas de software.
- Sin embargo, el nombre "Lawyer" podria generar confusion. El disclaimer debe ser prominente.

**Contenido del disclaimer:**
- InmoLawyer es una herramienta informativa basada en inteligencia artificial.
- Los analisis NO constituyen asesoria legal.
- La IA puede cometer errores o no detectar todas las situaciones juridicas.
- Para decisiones legales vinculantes, consulte un abogado titulado.
- InmoLawyer no se hace responsable de decisiones tomadas con base en sus analisis.

#### 2.10.2 Limitacion de responsabilidad

Bajo el derecho colombiano:
- La clausula de limitacion de responsabilidad es valida en contratos B2B y B2C (Art. 1604, Codigo Civil; Art. 16, Ley 1480 de 2011 — Estatuto del Consumidor).
- **LIMITACION:** No se puede exonerar de responsabilidad por dolo o culpa grave (Art. 1604, Codigo Civil). Tampoco se pueden incluir clausulas abusivas que limiten derechos del consumidor de forma desproporcionada (Art. 42-43, Ley 1480 de 2011).
- La limitacion de responsabilidad debe ser proporcional. Recomendacion: limitar la responsabilidad de InmoLawyer al monto pagado por el usuario en los ultimos 12 meses.

#### 2.10.3 Ley aplicable y resolucion de conflictos

- **Ley aplicable:** Leyes de la Republica de Colombia.
- **Resolucion de conflictos:** Se recomienda clausula escalonada:
  1. Arreglo directo (30 dias).
  2. Mediacion ante centro de conciliacion autorizado.
  3. Jurisdiccion ordinaria de Bogota D.C. (o la ciudad donde se constituya la empresa).
- **Nota:** La Ley 1480 de 2011 (Estatuto del Consumidor) permite que el consumidor acuda a la SIC para resolver controversias, independientemente de lo pactado en T&C.

---

## 3. CHECKLIST DE CUMPLIMIENTO — Antes de Lanzar

### Documentos legales
- [ ] Redactar y publicar Terminos y Condiciones en inmo.tools/inmolawyer/terminos
- [ ] Redactar y publicar Politica de Tratamiento de Datos en inmo.tools/inmolawyer/privacidad
- [ ] Redactar Aviso de Privacidad resumido para WhatsApp
- [ ] Redactar disclaimer de no-asesoria legal para incluir en cada reporte

### Registro y cumplimiento SIC
- [ ] Registrar bases de datos ante el RNBD (www.sic.gov.co/rnbd)
- [ ] Designar persona responsable del tratamiento de datos (Oficial de Proteccion de Datos)
- [ ] Crear correo datos@inmo.tools o privacidad@inmo.tools para ejercicio de derechos ARCO

### Consentimiento
- [ ] Implementar flujo de consentimiento en WhatsApp (mensaje previo al primer analisis)
- [ ] Implementar checkbox de aceptacion en web (no premarcado)
- [ ] Almacenar logs de consentimiento en Supabase (tabla consent_log)

### Seguridad
- [ ] Verificar cifrado en transito (HTTPS) — ya existente con Caddy
- [ ] Verificar cifrado en reposo en Supabase
- [ ] Implementar control de acceso a base de datos
- [ ] Documentar medidas de seguridad

### Transferencia internacional
- [ ] Aceptar y documentar DPA de Google para Gemini API
- [ ] Verificar que se usa version de pago de Gemini (datos no usados para entrenamiento)
- [ ] Documentar la transferencia internacional en la Politica de Privacidad

### Retencion y eliminacion
- [ ] Implementar politica de retencion (30 dias contratos, 1 ano reportes)
- [ ] Implementar mecanismo de eliminacion a solicitud del usuario
- [ ] Configurar eliminacion automatica (cron job en n8n o Supabase)
- [ ] Purgar logs de n8n periodicamente

### Interfaz de usuario
- [ ] Incluir disclaimer de no-asesoria legal en landing page
- [ ] Incluir disclaimer en cada reporte generado
- [ ] Link a T&C y Politica de Privacidad en footer de la web
- [ ] Link a T&C en mensaje de bienvenida de WhatsApp

### WhatsApp / Kapso
- [ ] Crear templates de mensaje de consentimiento para aprobacion de Meta
- [ ] Implementar flujo de opt-in legal antes del primer analisis
- [ ] Almacenar evidencia de consentimiento por WA

---

## 4. BORRADOR DE TERMINOS Y CONDICIONES

---

### TERMINOS Y CONDICIONES DE USO — INMOLAWYER

**Ultima actualizacion:** [FECHA]

**Estos Terminos y Condiciones regulan el acceso y uso de la plataforma InmoLawyer, operada por [RAZON SOCIAL / NOMBRE DEL TITULAR], identificado con [NIT/CC], con domicilio en [CIUDAD], Colombia (en adelante, "InmoLawyer", "nosotros" o "la Plataforma").**

**Al acceder o usar InmoLawyer, usted acepta estos Terminos y Condiciones en su totalidad. Si no esta de acuerdo, no use la Plataforma.**

---

#### 1. DEFINICIONES

1.1. **Plataforma:** El servicio InmoLawyer, accesible a traves de inmo.tools/inmolawyer, WhatsApp Business, y cualquier otro canal habilitado.

1.2. **Usuario:** Toda persona natural o juridica que acceda o utilice la Plataforma.

1.3. **Servicio:** El analisis automatizado de contratos de arrendamiento mediante inteligencia artificial, incluyendo la generacion de reportes de riesgo, alertas legales, recomendaciones y plantillas de documentos.

1.4. **Contrato:** El documento de arrendamiento (contrato de arrendamiento de vivienda urbana u otro inmueble) que el Usuario carga en la Plataforma para su analisis.

1.5. **Reporte:** El resultado del analisis automatizado del Contrato, que incluye un puntaje de riesgo, identificacion de clausulas potencialmente irregulares, y recomendaciones generales.

---

#### 2. NATURALEZA DEL SERVICIO — DISCLAIMER LEGAL

2.1. **InmoLawyer es una herramienta tecnologica de caracter informativo.** Los analisis, reportes, alertas, recomendaciones y cualquier otro contenido generado por la Plataforma son producidos por sistemas de inteligencia artificial y tienen un proposito exclusivamente informativo y educativo.

2.2. **InmoLawyer NO constituye, reemplaza ni sustituye la asesoria legal profesional.** Los resultados generados por la Plataforma no son opiniones juridicas, conceptos legales, ni dictamenes de un abogado.

2.3. **La inteligencia artificial puede cometer errores.** Los modelos de IA utilizados, si bien estan entrenados con la legislacion colombiana vigente (incluyendo la Ley 820 de 2003 y sus normas complementarias), pueden:
   - No detectar todas las clausulas irregulares o abusivas.
   - Interpretar incorrectamente clausulas ambiguas.
   - No estar actualizados con cambios normativos recientes.
   - Generar resultados inexactos o incompletos.

2.4. **Recomendacion expresa:** Para la toma de decisiones legales vinculantes, como la firma, modificacion o terminacion de un contrato de arrendamiento, la interposicion de acciones legales, o cualquier otra actuacion con efectos juridicos, el Usuario debe consultar a un abogado debidamente inscrito ante el Consejo Superior de la Judicatura de Colombia.

2.5. Las plantillas de cartas de reclamacion y demas documentos generados por la Plataforma son modelos de referencia que el Usuario debe revisar y adaptar a su situacion particular, preferiblemente con asesoria legal.

---

#### 3. REGISTRO Y CUENTA DE USUARIO

3.1. Para acceder a funcionalidades completas, el Usuario debe crear una cuenta proporcionando informacion veraz, completa y actualizada.

3.2. El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.

3.3. InmoLawyer se reserva el derecho de suspender o cancelar cuentas que:
   - Proporcionen informacion falsa.
   - Usen el Servicio para fines ilegales o no autorizados.
   - Violen estos Terminos y Condiciones.
   - Realicen un uso abusivo o automatizado no autorizado del Servicio.

---

#### 4. USO DEL SERVICIO

4.1. **Uso permitido:** El Usuario puede usar InmoLawyer para analizar contratos de arrendamiento de los cuales sea parte (como arrendatario o arrendador) o respecto de los cuales tenga autorizacion legitima.

4.2. **Declaracion del Usuario:** Al cargar un contrato en la Plataforma, el Usuario declara y garantiza que:
   - Es parte del contrato (arrendatario, arrendador, o representante legal de una de las partes), o cuenta con autorizacion expresa de una de las partes para analizar el documento.
   - Tiene derecho legitimo a acceder al contenido del contrato.
   - No carga el contrato con fines ilegales, difamatorios o de acoso.

4.3. **Uso prohibido:** El Usuario se compromete a NO:
   - Cargar contratos de terceros sin autorizacion.
   - Usar los analisis para acosar, extorsionar o perjudicar a la contraparte contractual.
   - Reproducir, distribuir o comercializar los reportes con fines distintos a su uso personal.
   - Intentar extraer, copiar o replicar los algoritmos, prompts o modelos de IA de la Plataforma.
   - Realizar ingenieria inversa del Servicio.
   - Enviar contenido que no sea un contrato de arrendamiento (documentos fraudulentos, contenido ilegal, malware).

---

#### 5. MODELO DE PRECIOS Y PAGOS

5.1. **Modelo freemium:** InmoLawyer ofrece un (1) analisis gratuito para usuarios nuevos. Analisis adicionales requieren pago.

5.2. **Precios:** Los precios vigentes se publican en la Plataforma. InmoLawyer se reserva el derecho de modificarlos con previo aviso de treinta (30) dias.

5.3. **Pasarela de pagos:** Los pagos se procesan a traves de Wompi (Bancolombia S.A.). InmoLawyer NO almacena datos de tarjetas de credito o debito. El tratamiento de datos financieros por parte de Wompi se rige por sus propios terminos y condiciones.

5.4. **Reembolsos:** Dado que el Servicio se presta de forma instantanea una vez iniciado el analisis, no se ofrecen reembolsos una vez generado el Reporte, salvo en caso de falla tecnica comprobable que impida la entrega del resultado. En caso de falla tecnica, el Usuario podra solicitar un nuevo analisis sin costo o el reembolso del valor pagado.

5.5. **Derecho de retracto (Ley 1480 de 2011, Art. 47):** Dado que el servicio se ejecuta de manera inmediata y automatica, el derecho de retracto se agota una vez iniciado el procesamiento del contrato. El Usuario acepta que, al solicitar el analisis, autoriza la ejecucion inmediata del servicio.

---

#### 6. PROPIEDAD INTELECTUAL

6.1. **Propiedad de InmoLawyer:** La Plataforma, su codigo fuente, algoritmos, modelos de IA, diseno, marca, logotipos y contenido son propiedad exclusiva de InmoLawyer y estan protegidos por las leyes colombianas e internacionales de propiedad intelectual (Decision 486 de la CAN, Ley 23 de 1982).

6.2. **Propiedad del Usuario:** El contrato cargado por el Usuario sigue siendo de su propiedad. InmoLawyer no adquiere ningun derecho de propiedad sobre el contrato.

6.3. **Licencia limitada:** Al cargar un contrato, el Usuario otorga a InmoLawyer una licencia temporal, no exclusiva, limitada y revocable para procesar el documento con la unica finalidad de prestar el Servicio contratado.

6.4. **Reportes:** Los reportes generados son propiedad de InmoLawyer, con licencia de uso otorgada al Usuario para su uso personal. InmoLawyer podra utilizar datos anonimizados y agregados de los analisis para mejorar el Servicio, generar estadisticas y con fines de investigacion, sin que sea posible identificar al Usuario ni las partes del contrato.

---

#### 7. LIMITACION DE RESPONSABILIDAD

7.1. **InmoLawyer no sera responsable por:**
   - Decisiones legales, financieras o de cualquier otra indole que el Usuario tome con base en los analisis o reportes generados.
   - Danos directos, indirectos, incidentales, especiales, consecuenciales o punitivos derivados del uso o imposibilidad de uso del Servicio.
   - Errores, omisiones o inexactitudes en los analisis generados por la inteligencia artificial.
   - Interrupciones del Servicio por causas tecnicas, de fuerza mayor o caso fortuito.
   - Acciones legales o reclamaciones de terceros (incluyendo el arrendador) derivadas del uso del Servicio por parte del Usuario.

7.2. **Limite maximo de responsabilidad:** En todo caso, la responsabilidad total de InmoLawyer frente al Usuario estara limitada al monto efectivamente pagado por el Usuario a InmoLawyer durante los doce (12) meses anteriores al evento que de lugar a la reclamacion.

7.3. Las limitaciones anteriores se aplican en la maxima medida permitida por la ley colombiana, sin perjuicio de los derechos irrenunciables del consumidor establecidos en la Ley 1480 de 2011 (Estatuto del Consumidor).

---

#### 8. INDEMNIDAD

8.1. El Usuario se compromete a mantener indemne a InmoLawyer, sus directores, empleados, contratistas y afiliados, frente a cualquier reclamacion, demanda, dano, perdida, costo o gasto (incluyendo honorarios de abogados) que surja de:
   - El uso del Servicio por parte del Usuario.
   - La violacion de estos Terminos y Condiciones.
   - La violacion de derechos de terceros.
   - La carga de documentos sin la debida autorizacion.

---

#### 9. DISPONIBILIDAD DEL SERVICIO

9.1. InmoLawyer hara esfuerzos comercialmente razonables para mantener la disponibilidad de la Plataforma, pero no garantiza un funcionamiento ininterrumpido o libre de errores.

9.2. InmoLawyer se reserva el derecho de suspender temporalmente el Servicio para mantenimiento, actualizaciones o mejoras, sin que esto genere responsabilidad alguna.

9.3. InmoLawyer se reserva el derecho de descontinuar el Servicio en cualquier momento, con previo aviso de treinta (30) dias a los Usuarios registrados.

---

#### 10. MODIFICACIONES

10.1. InmoLawyer se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento.

10.2. Las modificaciones seran notificadas al Usuario mediante publicacion en la Plataforma y/o por correo electronico o WhatsApp.

10.3. El uso continuado del Servicio despues de la notificacion constituira aceptacion de los nuevos terminos.

10.4. Si el Usuario no esta de acuerdo con las modificaciones, debera cesar el uso de la Plataforma y podra solicitar la eliminacion de su cuenta y datos.

---

#### 11. LEY APLICABLE Y RESOLUCION DE CONTROVERSIAS

11.1. Estos Terminos y Condiciones se rigen por las leyes de la Republica de Colombia.

11.2. Para la resolucion de controversias, las partes acuerdan el siguiente procedimiento escalonado:
   - **Arreglo directo:** Las partes intentaran resolver la controversia de forma directa durante un plazo de treinta (30) dias calendario, mediante comunicacion escrita al correo [CORREO DE CONTACTO].
   - **Mediacion:** Si no se logra arreglo directo, las partes podran acudir a un centro de conciliacion autorizado por el Ministerio de Justicia.
   - **Jurisdiccion:** En caso de no lograrse solucion, las partes se someten a la jurisdiccion de los jueces de la Republica de Colombia, con sede en [CIUDAD].

11.3. Lo anterior sin perjuicio del derecho del consumidor de acudir ante la Superintendencia de Industria y Comercio (SIC) en los terminos de la Ley 1480 de 2011.

---

#### 12. CONTACTO

Para cualquier consulta, reclamacion o ejercicio de derechos relacionados con estos Terminos y Condiciones:

- **Correo electronico:** [CORREO]
- **WhatsApp:** [NUMERO]
- **Direccion:** [DIRECCION]
- **Responsable del tratamiento:** [NOMBRE DEL RESPONSABLE]

---

#### 13. DISPOSICIONES FINALES

13.1. Si alguna clausula de estos Terminos y Condiciones fuere declarada nula o inaplicable, las demas disposiciones mantendran su plena vigencia y efecto.

13.2. La falta de ejercicio de un derecho por parte de InmoLawyer no constituira renuncia al mismo.

13.3. Estos Terminos y Condiciones, junto con la Politica de Tratamiento de Datos Personales, constituyen el acuerdo completo entre las partes respecto del uso de la Plataforma.

---

## 5. BORRADOR DE POLITICA DE TRATAMIENTO DE DATOS PERSONALES

---

### POLITICA DE TRATAMIENTO DE DATOS PERSONALES — INMOLAWYER

**Ultima actualizacion:** [FECHA]

En cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto Reglamentario 1377 de 2013 (compilado en el Decreto Unico Reglamentario 1074 de 2015), y demas normas concordantes, [RAZON SOCIAL / NOMBRE DEL TITULAR], identificado con [NIT/CC], con domicilio en [CIUDAD], Colombia, en calidad de RESPONSABLE del tratamiento de datos personales, adopta la presente Politica de Tratamiento de Datos Personales.

---

#### 1. RESPONSABLE DEL TRATAMIENTO

| Campo | Detalle |
|-------|---------|
| Razon social / Nombre | [RAZON SOCIAL O NOMBRE] |
| NIT / CC | [NIT O CC] |
| Domicilio | [DIRECCION, CIUDAD] |
| Correo electronico | [CORREO] |
| Telefono / WhatsApp | [NUMERO] |
| Sitio web | inmo.tools/inmolawyer |
| Correo de proteccion de datos | datos@inmo.tools |

---

#### 2. MARCO LEGAL

La presente politica se fundamenta en:
- Constitucion Politica de Colombia, Art. 15 (derecho a la intimidad y habeas data).
- Ley Estatutaria 1581 de 2012 (Regimen General de Proteccion de Datos Personales).
- Decreto 1377 de 2013 (Reglamentario de la Ley 1581).
- Decreto 886 de 2014 (Registro Nacional de Bases de Datos).
- Decreto Unico Reglamentario 1074 de 2015.
- Circular Externa 002 de 2015 de la SIC.
- Sentencia C-748 de 2011 de la Corte Constitucional.

---

#### 3. DEFINICIONES

Los terminos utilizados en esta politica tienen el significado establecido en el Art. 3 de la Ley 1581 de 2012 y el Art. 3 del Decreto 1377 de 2013. Adicionalmente:

- **Titular:** Persona natural cuyos datos personales son objeto de tratamiento. En el contexto de InmoLawyer, el Titular principal es el Usuario que utiliza la Plataforma.
- **Responsable del tratamiento:** InmoLawyer ([RAZON SOCIAL]).
- **Encargado del tratamiento:** Terceros que tratan datos personales por cuenta de InmoLawyer (ver Seccion 10).
- **Tratamiento:** Cualquier operacion sobre datos personales: recoleccion, almacenamiento, uso, circulacion, transmision, transferencia, supresion.
- **Autorizacion:** Consentimiento previo, expreso e informado del Titular para el tratamiento de sus datos.
- **Dato personal:** Cualquier informacion vinculada o que pueda asociarse a una persona natural determinada o determinable.

---

#### 4. PRINCIPIOS DEL TRATAMIENTO

InmoLawyer se compromete a tratar los datos personales de conformidad con los siguientes principios (Art. 4, Ley 1581 de 2012):

- **Legalidad:** El tratamiento se sujeta a la ley colombiana.
- **Finalidad:** El tratamiento obedecera a una finalidad legitima, la cual sera informada al Titular.
- **Libertad:** El tratamiento solo se ejercera con el consentimiento previo, expreso e informado del Titular.
- **Veracidad:** La informacion sujeta a tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible.
- **Transparencia:** El Titular podra solicitar y obtener informacion sobre la existencia de datos que le conciernan.
- **Acceso y circulacion restringida:** El tratamiento se sujeta a los limites derivados de la naturaleza de los datos.
- **Seguridad:** Los datos seran tratados con las medidas tecnicas, humanas y administrativas necesarias para otorgar seguridad.
- **Confidencialidad:** Las personas que intervengan en el tratamiento estan obligadas a garantizar la reserva de la informacion.

---

#### 5. DATOS PERSONALES RECOLECTADOS

InmoLawyer recolecta y trata las siguientes categorias de datos personales:

##### 5.1 Datos del Usuario (Titular directo)

| Dato | Fuente | Obligatorio |
|------|--------|-------------|
| Nombre | Perfil de WhatsApp / Registro web | Si |
| Numero de telefono movil | WhatsApp / Registro web | Si |
| Correo electronico | Registro web | Si (web) / No (WA) |
| Contrasena (hash) | Registro web | Si (web) |
| Historial de analisis | Uso de la Plataforma | Automatico |
| Datos de pago (referencia de transaccion) | Wompi | Si (para pago) |

##### 5.2 Datos contenidos en el contrato de arrendamiento

Al cargar un contrato para analisis, InmoLawyer accede a datos personales contenidos en el documento, que pueden incluir:

| Dato | Titular |
|------|---------|
| Nombres y apellidos de arrendatario y arrendador | Arrendatario (usuario) y arrendador (tercero) |
| Numero de cedula de ciudadania o NIT | Arrendatario y arrendador |
| Direccion del inmueble | Asociada al arrendador (propietario) |
| Canon de arrendamiento | Dato contractual |
| Clausulas y condiciones del contrato | Dato contractual |

##### 5.3 Datos tecnicos recolectados automaticamente

| Dato | Fuente |
|------|--------|
| Direccion IP | Acceso web |
| Tipo de navegador y dispositivo | Acceso web |
| Cookies tecnicas y de sesion | Acceso web |
| Fecha y hora de acceso | Automatico |

---

#### 6. FINALIDADES DEL TRATAMIENTO

Los datos personales seran tratados para las siguientes finalidades:

##### 6.1 Finalidades necesarias para la prestacion del servicio:
a) Prestar el servicio de analisis automatizado de contratos de arrendamiento.
b) Generar reportes de riesgo, alertas legales y recomendaciones.
c) Generar plantillas de cartas de reclamacion y otros documentos.
d) Gestionar la cuenta del Usuario (registro, autenticacion, historial).
e) Procesar pagos a traves de la pasarela Wompi.
f) Enviar al Usuario los resultados de su analisis.
g) Brindar soporte tecnico y atencion al Usuario.

##### 6.2 Finalidades complementarias (requieren consentimiento adicional):
h) Enviar comunicaciones comerciales, promociones y novedades del servicio.
i) Realizar encuestas de satisfaccion.
j) Generar estadisticas agregadas y anonimizadas sobre el mercado de arrendamiento en Colombia.
k) Mejorar los modelos de inteligencia artificial con datos anonimizados y agregados.

---

#### 7. TRATAMIENTO DE DATOS CONTENIDOS EN CONTRATOS DE TERCEROS

7.1. InmoLawyer reconoce que los contratos de arrendamiento cargados por los Usuarios contienen datos personales de terceros (tipicamente, el arrendador).

7.2. **Base juridica del tratamiento:** El tratamiento de estos datos se fundamenta en:
   - El interes legitimo del Usuario (arrendatario) de conocer y ejercer sus derechos contractuales, conforme al Art. 13 literal e) del Decreto 1377 de 2013.
   - El derecho constitucional a la informacion del Usuario sobre su propia relacion contractual (Art. 20, Constitucion Politica).
   - La naturaleza incidental del tratamiento: los datos del tercero no son la finalidad del servicio sino un componente inherente al documento contractual.

7.3. **Limitaciones al tratamiento de datos de terceros:**
   - InmoLawyer NO creara perfiles, bases de datos independientes ni registros del arrendador u otros terceros que aparezcan en los contratos.
   - Los datos de terceros seran utilizados exclusivamente para el analisis del contrato y no para ninguna otra finalidad.
   - Los datos de terceros seran eliminados conforme a la politica de retencion (Seccion 12).

7.4. **Declaracion del Usuario:** Al cargar un contrato, el Usuario declara ser parte del mismo y tener acceso legitimo al documento.

---

#### 8. AUTORIZACION

##### 8.1 Mecanismos de obtencion de autorizacion

InmoLawyer obtiene la autorizacion del Titular mediante los siguientes mecanismos:

a) **Via WhatsApp:** Mensaje de consentimiento presentado al Usuario antes del primer procesamiento de datos, que incluye la identificacion del responsable, la finalidad del tratamiento, y los derechos del titular. El Usuario manifiesta su aceptacion mediante respuesta afirmativa explicita.

b) **Via web:** Formulario de registro con casilla de verificacion (no premarcada) de aceptacion de la Politica de Tratamiento de Datos y los Terminos y Condiciones, con enlace a los textos completos.

##### 8.2 Prueba de la autorizacion

InmoLawyer conservara prueba de la autorizacion otorgada por el Titular (Art. 7, Decreto 1377 de 2013), incluyendo:
- Canal utilizado (WhatsApp / web).
- Fecha y hora de la autorizacion.
- Texto del consentimiento presentado.
- Identificacion del Titular (numero de telefono / correo electronico).

##### 8.3 Autorizacion no requerida

De conformidad con el Art. 10 de la Ley 1581 de 2012, no se requerira autorizacion cuando:
- Los datos sean de naturaleza publica.
- El tratamiento sea requerido por una entidad publica en ejercicio de sus funciones.
- Se trate de datos relacionados con el Registro Civil de las Personas.
- Exista una urgencia medica o sanitaria.
- El tratamiento sea autorizado por la ley para fines historicos, estadisticos o cientificos.

---

#### 9. USO DE INTELIGENCIA ARTIFICIAL

9.1. InmoLawyer utiliza modelos de inteligencia artificial de terceros para el analisis de los contratos de arrendamiento.

9.2. **Proveedor actual de IA:** Google LLC, a traves de su servicio Gemini API (modelos de lenguaje de gran escala).

9.3. **Procesamiento:** El contenido del contrato cargado por el Usuario es enviado a los servidores de Google para su procesamiento por el modelo de IA. Google actua como ENCARGADO del tratamiento de datos en los terminos del Art. 25 del Decreto 1377 de 2013.

9.4. **Transparencia:**
   - Los resultados del analisis son generados automaticamente por IA, sin intervencion humana directa en la interpretacion del contrato.
   - La IA puede cometer errores, y los resultados tienen caracter exclusivamente informativo.
   - InmoLawyer no garantiza la exactitud, completitud o actualizacion de los analisis generados.

9.5. **Compromiso:** InmoLawyer se compromete a utilizar versiones de las APIs de IA que no utilicen los datos enviados para el entrenamiento de modelos (Gemini API de pago), conforme a los terminos de servicio del proveedor.

---

#### 10. ENCARGADOS DEL TRATAMIENTO Y TRANSMISION/TRANSFERENCIA INTERNACIONAL DE DATOS

10.1. InmoLawyer podra transmitir datos personales a los siguientes encargados del tratamiento:

| Encargado | Pais | Finalidad | Datos transmitidos |
|-----------|------|-----------|-------------------|
| Google LLC (Gemini API) | Estados Unidos | Procesamiento de contratos con IA | Contenido del contrato |
| Supabase Inc. | Estados Unidos | Almacenamiento de datos (base de datos y autenticacion) | Datos de usuario, historial de analisis |
| Wompi (Bancolombia S.A.) | Colombia | Procesamiento de pagos | Referencia de transaccion, monto |
| Kapso | [Verificar pais] | Gestion de WhatsApp Business API | Numero de telefono, mensajes |
| DigitalOcean LLC | Estados Unidos | Hosting de infraestructura (n8n) | Datos en transito durante procesamiento |

10.2. **Contratos de transmision:** InmoLawyer ha celebrado o se adhiere a los acuerdos de procesamiento de datos (Data Processing Agreements — DPA) de cada encargado, los cuales establecen obligaciones de confidencialidad, seguridad y limitacion de uso.

10.3. **Transferencia internacional:** Los datos personales pueden ser transferidos a servidores ubicados en Estados Unidos. InmoLawyer ha verificado que los encargados cuentan con medidas adecuadas de proteccion de datos, conforme al Art. 26 de la Ley 1581 de 2012.

10.4. **Al otorgar su autorizacion, el Titular acepta la transmision y transferencia internacional de sus datos conforme a lo descrito en esta Seccion.**

---

#### 11. DERECHOS DE LOS TITULARES

De conformidad con los Arts. 14 a 16 de la Ley 1581 de 2012, el Titular tiene los siguientes derechos:

a) **Conocer, actualizar y rectificar** sus datos personales frente a InmoLawyer.

b) **Solicitar prueba de la autorizacion** otorgada, salvo las excepciones legales.

c) **Ser informado** sobre el uso que se ha dado a sus datos personales.

d) **Presentar quejas** ante la Superintendencia de Industria y Comercio por infracciones a la ley de proteccion de datos, previo tramite de consulta o reclamo ante InmoLawyer.

e) **Revocar la autorizacion y/o solicitar la supresion** de sus datos personales cuando considere que InmoLawyer no ha respetado los principios, derechos y garantias legales.

f) **Acceder de forma gratuita** a sus datos personales que hayan sido objeto de tratamiento.

---

#### 12. POLITICA DE RETENCION Y SUPRESION DE DATOS

12.1. InmoLawyer conservara los datos personales por los siguientes periodos:

| Tipo de dato | Periodo de retencion | Justificacion |
|-------------|---------------------|---------------|
| Contrato original (imagen/PDF) | 30 dias calendario a partir del analisis | Periodo de consulta y soporte |
| Reporte de analisis | 1 ano a partir de su generacion | Utilidad para el Usuario |
| Datos de cuenta del Usuario | Mientras la cuenta este activa + 6 meses | Periodo de gracia |
| Registros de autorizacion/consentimiento | 5 anos | Obligacion probatoria (prescripcion) |
| Datos de transacciones/pagos | 5 anos | Obligaciones tributarias colombianas |
| Logs tecnicos | 30 dias | Soporte tecnico y seguridad |

12.2. Transcurridos los periodos indicados, los datos seran suprimidos de forma segura e irreversible.

12.3. El Usuario podra solicitar la supresion anticipada de sus datos en cualquier momento, enviando su solicitud al correo datos@inmo.tools. La supresion se realizara dentro de los quince (15) dias habiles siguientes, salvo que exista una obligacion legal de conservacion.

12.4. La supresion de datos de cuenta implica la eliminacion de: contrato(s) almacenado(s), reportes de analisis, historial de conversaciones, y datos de perfil. Se conservaran unicamente los registros de consentimiento y datos tributarios por el periodo legal requerido.

---

#### 13. MEDIDAS DE SEGURIDAD

InmoLawyer implementa las siguientes medidas de seguridad para la proteccion de los datos personales (Art. 4 literal g, Ley 1581; Circular 002 de 2015, SIC):

##### 13.1 Medidas tecnicas:
- Cifrado de datos en transito mediante protocolo HTTPS/TLS.
- Cifrado de datos en reposo en las bases de datos.
- Autenticacion segura de usuarios (hashing de contrasenas).
- Control de acceso basado en roles a la infraestructura.
- Copias de seguridad periodicas.

##### 13.2 Medidas organizacionales:
- Politica interna de tratamiento de datos personales.
- Acuerdos de confidencialidad con encargados del tratamiento.
- Revision periodica de accesos y permisos.

##### 13.3 Respuesta a incidentes:
- En caso de incidente de seguridad que comprometa datos personales, InmoLawyer notificara a los Titulares afectados y a la SIC en un plazo razonable, indicando la naturaleza del incidente, los datos afectados y las medidas adoptadas.

---

#### 14. COOKIES Y TECNOLOGIAS DE RASTREO

14.1. El sitio web de InmoLawyer utiliza cookies tecnicas y de sesion estrictamente necesarias para el funcionamiento de la Plataforma.

14.2. No se utilizan cookies de terceros con fines de publicidad comportamental o seguimiento.

14.3. El Usuario puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la Plataforma.

---

#### 15. PROCEDIMIENTO PARA EJERCER DERECHOS

15.1. **Canal de atencion:** El Titular podra ejercer sus derechos mediante comunicacion dirigida a:
   - Correo electronico: datos@inmo.tools
   - WhatsApp: [NUMERO]
   - Direccion fisica: [DIRECCION]

15.2. **Contenido de la solicitud:** La solicitud debera contener:
   - Nombre completo del Titular.
   - Numero de cedula de ciudadania o documento de identidad.
   - Descripcion de los hechos y del derecho que desea ejercer.
   - Direccion de correspondencia, correo electronico y/o telefono de contacto.
   - Documentos de soporte (si aplica).

15.3. **Plazos de respuesta:**
   - **Consultas (Art. 14, Ley 1581):** 10 dias habiles, prorrogables por 5 dias habiles adicionales.
   - **Reclamos (Art. 15, Ley 1581):** 15 dias habiles, prorrogables por 8 dias habiles adicionales.

15.4. Si la solicitud resulta incompleta, InmoLawyer requerira al Titular dentro de los 5 dias habiles siguientes para que complete la informacion. Si transcurren 2 meses sin respuesta del Titular, se entendera desistido el reclamo.

15.5. **Queja ante la SIC:** Si el Titular no esta satisfecho con la respuesta, podra presentar queja ante la Superintendencia de Industria y Comercio (Delegatura para la Proteccion de Datos Personales).

---

#### 16. TRATAMIENTO DE DATOS DE MENORES DE EDAD

16.1. InmoLawyer esta dirigido a personas mayores de dieciocho (18) anos.

16.2. InmoLawyer no recolecta ni trata conscientemente datos personales de menores de edad.

16.3. Si InmoLawyer detecta que ha recolectado datos de un menor sin la autorizacion de su representante legal, procedera a su eliminacion inmediata.

---

#### 17. MODIFICACIONES A LA POLITICA

17.1. InmoLawyer se reserva el derecho de modificar esta Politica en cualquier momento.

17.2. Las modificaciones seran comunicadas al Titular mediante publicacion en el sitio web y/o notificacion por correo electronico o WhatsApp, con al menos diez (10) dias habiles de antelacion a su entrada en vigencia.

17.3. Si las modificaciones implican nuevas finalidades o cambios sustanciales en el tratamiento, se solicitara nuevamente la autorizacion del Titular.

---

#### 18. VIGENCIA

La presente Politica de Tratamiento de Datos Personales entra en vigencia a partir del [FECHA] y estara vigente mientras InmoLawyer realice actividades de tratamiento de datos personales.

Las bases de datos administradas por InmoLawyer se mantendran vigentes mientras subsista la finalidad para la cual fueron recolectados los datos.

---

## 6. FLUJO DE CONSENTIMIENTO EN WHATSAPP

### 6.1 Flujo completo

```
USUARIO → Envia primer mensaje a InmoLawyer por WhatsApp
          (ej: "Hola", o envia directamente una foto del contrato)

BOT → Mensaje de bienvenida + Aviso de Privacidad:
```

**Mensaje 1 — Bienvenida y Aviso de Privacidad (TEMPLATE - requiere aprobacion Meta):**

```
Hola [NOMBRE]. Bienvenido a InmoLawyer, la herramienta que analiza tu
contrato de arriendo con inteligencia artificial.

Antes de continuar, necesitamos tu autorizacion para tratar tus datos
personales.

*Responsable:* [RAZON SOCIAL], NIT [NIT]
*Contacto:* datos@inmo.tools

*Que datos tratamos:*
- Tu nombre y numero de telefono
- El contrato de arriendo que nos envies
- Datos contenidos en el contrato (nombres, cedulas, direccion del
  inmueble, canon)

*Para que:*
- Analizar tu contrato con IA y detectar clausulas irregulares
- Generar tu reporte de riesgo y recomendaciones
- El contenido del contrato sera procesado por Google (Gemini AI) en
  servidores de Estados Unidos

*Tus derechos:* Puedes consultar, actualizar, rectificar o eliminar
tus datos en cualquier momento escribiendo a datos@inmo.tools

*Politica completa:* inmo.tools/inmolawyer/privacidad

Para continuar, responde ACEPTO.
Si no estas de acuerdo, responde NO.
```

**Mensaje 2 — Si el usuario responde "ACEPTO":**

```
Gracias por tu autorizacion. Ya puedes enviar una foto o PDF de tu
contrato de arriendo y lo analizaremos en minutos.

Recuerda: InmoLawyer es una herramienta informativa. Los resultados
NO son asesoria legal. Para decisiones legales, consulta un abogado.

Envia tu contrato cuando quieras.
```

**Mensaje 2b — Si el usuario responde "NO":**

```
Entendemos. Sin tu autorizacion no podemos analizar tu contrato.

Si cambias de opinion, escríbenos nuevamente. Tus datos no han sido
almacenados.

Si tienes dudas sobre nuestra politica de privacidad, puedes
consultarla en: inmo.tools/inmolawyer/privacidad
```

**Mensaje 2c — Si el usuario envia directamente un contrato (sin consentimiento previo):**

```
Recibimos tu documento, pero antes de analizarlo necesitamos tu
autorizacion para tratar tus datos personales.

[Se envia Mensaje 1 de Aviso de Privacidad]

Una vez aceptes, procesaremos tu contrato automaticamente.
```

> **IMPORTANTE:** Si el usuario envia el contrato antes de aceptar, el bot NO debe procesarlo. Debe retener el documento temporalmente (o solicitar que lo reenvie) y primero obtener consentimiento.

### 6.2 Flujo para analisis posteriores

No es necesario pedir consentimiento nuevamente en cada analisis. La autorizacion cubre todas las finalidades descritas mientras no sea revocada.

### 6.3 Revocacion de consentimiento via WhatsApp

El usuario debe poder escribir:
- "ELIMINAR MIS DATOS" o "REVOCAR" o comando similar.

**Mensaje de confirmacion de revocacion:**

```
Tu solicitud de eliminacion de datos ha sido recibida. Procederemos
a eliminar tus datos personales en un plazo maximo de 15 dias habiles.

Se conservaran unicamente los registros que tengamos obligacion legal
de mantener (registros de consentimiento y datos tributarios).

Si deseas usar InmoLawyer nuevamente en el futuro, deberás otorgar
una nueva autorizacion.
```

### 6.4 Tabla de implementacion en Kapso/n8n

| Evento | Accion del bot | Almacenar en Supabase |
|--------|---------------|----------------------|
| Primer mensaje del usuario | Enviar Aviso de Privacidad | Registrar intento de contacto (sin datos personales) |
| Usuario responde "ACEPTO" | Confirmar + habilitar servicio | INSERT en `consent_log` (phone, timestamp, channel, consent_text) |
| Usuario responde "NO" | Mensaje de despedida | No almacenar nada |
| Usuario envia contrato sin consentimiento | Retener y pedir consentimiento primero | No procesar hasta consentimiento |
| Usuario dice "ELIMINAR MIS DATOS" | Confirmar eliminacion | Ejecutar proceso de supresion, mantener consent_log |

### 6.5 Esquema de tabla `consent_log` sugerido (Supabase)

```sql
CREATE TABLE consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    phone VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' | 'web'
    consent_type VARCHAR(50) NOT NULL DEFAULT 'data_processing', -- 'data_processing' | 'marketing' | 'revocation'
    consent_text TEXT NOT NULL, -- Texto exacto presentado al usuario
    user_response TEXT NOT NULL, -- Respuesta exacta del usuario
    ip_address VARCHAR(45), -- Solo para web
    granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB -- Datos adicionales (version de politica, etc.)
);

CREATE INDEX idx_consent_log_phone ON consent_log(phone);
CREATE INDEX idx_consent_log_user_id ON consent_log(user_id);
```

---

## 7. RECOMENDACIONES ADICIONALES

### 7.1 Registro como sociedad o empresa

Si InmoLawyer opera actualmente como persona natural, considerar la constitucion de una SAS (Sociedad por Acciones Simplificada) para:
- Separar la responsabilidad personal del fundador.
- Tener NIT propio para el registro ante la SIC.
- Mayor credibilidad ante usuarios y aliados.
- Requisito para algunos convenios comerciales.

### 7.2 Seguro de responsabilidad civil profesional

Considerar contratar una poliza de responsabilidad civil profesional (E&O — Errors & Omissions) que cubra reclamaciones derivadas de errores en los analisis de IA. Aunque InmoLawyer no es un despacho de abogados, la generacion de recomendaciones legales (aunque informativas) podria dar lugar a reclamaciones.

### 7.3 Evaluacion de Impacto en Privacidad (PIA)

Aunque no es obligatoria en Colombia para empresas de este tamano, realizar una Evaluacion de Impacto en Privacidad documentada fortaleceria la posicion de InmoLawyer ante una eventual investigacion de la SIC (principio de responsabilidad demostrada / accountability).

### 7.4 Anonimizacion proactiva

Implementar un proceso de anonimizacion automatica despues del analisis:
- Reemplazar nombres, cedulas y direcciones en los datos almacenados (reportes, logs) con identificadores genericos.
- Conservar solo el score y las alertas genericas, no los datos personales del contrato.
- Esto reduce drasticamente el riesgo regulatorio.

### 7.5 Verificacion del DPA de Google Gemini

**Accion critica:** Verificar y documentar que:
1. Se usa Gemini API de pago (no la version gratuita).
2. Google no retiene ni usa los datos enviados para entrenamiento de modelos.
3. Se ha aceptado el Data Processing Addendum de Google Cloud.
4. Guardar copia del DPA firmado/aceptado.

### 7.6 Registro de marca

Registrar la marca "InmoLawyer" ante la Superintendencia de Industria y Comercio (Direccion de Signos Distintivos). Costo aproximado: ~$1.5M COP. Clase 42 de Niza (servicios tecnologicos) y posiblemente Clase 45 (servicios juridicos informativos).

### 7.7 Facturacion electronica

Si InmoLawyer cobra por sus servicios, debe cumplir con la obligacion de facturacion electronica (Resolucion DIAN 000165 de 2023). Wompi facilita la parte de pagos, pero la factura la debe emitir InmoLawyer.

### 7.8 Regimen de proteccion al consumidor

Como servicio digital B2C, InmoLawyer esta sujeto a la Ley 1480 de 2011 (Estatuto del Consumidor), que establece:
- Derecho de retracto en ventas a distancia (Art. 47) — aunque se mitiga con la ejecucion inmediata.
- Garantia legal del servicio (Art. 7-17).
- Informacion minima al consumidor (Art. 23-24).
- Prohibicion de clausulas abusivas (Art. 42-43).

### 7.9 Cumplimiento tributario

El servicio de analisis de contratos esta gravado con IVA (19%). Verificar si aplica el regimen simplificado (SIMPLE) o el ordinario, segun los ingresos. Los precios publicados deben indicar si incluyen o no IVA.

### 7.10 Monitoreo regulatorio de IA

Mantener seguimiento de los proyectos de ley de IA que cursan en el Congreso colombiano. A marzo de 2026, hay propuestas que podrian imponer obligaciones adicionales como:
- Registro de sistemas de IA de alto riesgo.
- Evaluaciones de impacto algoritmico.
- Obligacion de explicabilidad de las decisiones de IA.
- Derecho del usuario a una revision humana de la decision automatizada.

---

## ANEXO: Referencias Normativas Citadas

| Norma | Tema |
|-------|------|
| Constitucion Politica de Colombia, Arts. 15, 20, 29 | Habeas data, informacion, defensa |
| Ley 1581 de 2012 | Proteccion de datos personales |
| Decreto 1377 de 2013 | Reglamentario Ley 1581 |
| Decreto 886 de 2014 | RNBD |
| Decreto 1074 de 2015 | Decreto Unico Reglamentario (compila 1377 y 886) |
| Circular Externa 002 de 2015 SIC | Datos en medios digitales |
| Ley 1266 de 2008 | Habeas data financiero |
| Ley 820 de 2003 | Arrendamiento de vivienda urbana |
| Ley 1480 de 2011 | Estatuto del Consumidor |
| Ley 1123 de 2007 | Codigo Disciplinario del Abogado |
| Ley 23 de 1982 | Derechos de autor |
| Decision 486 CAN | Propiedad industrial |
| CONPES 3975 de 2019 | Politica Nacional de IA |
| Sentencia C-748 de 2011 CC | Control Ley 1581 |
| Sentencia T-729 de 2002 CC | Tipologia de datos |
| Art. 1504, Codigo Civil | Capacidad para contratar |
| Art. 1604, Codigo Civil | Responsabilidad contractual |

---

*Documento preparado el 2026-03-12. Este analisis tiene caracter informativo y se recomienda su revision por un abogado especializado en proteccion de datos personales antes de su implementacion definitiva.*
