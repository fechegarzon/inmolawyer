# Research: Certificado de Libertad y Tradicion - Colombia

> Documento de referencia para alimentar un prompt de IA que lea certificados de libertad y tradicion y detecte riesgos en transacciones inmobiliarias.

---

## 1. Marco Legal Aplicable

### 1.1 Ley 1579 de 2012 - Estatuto de Registro de Instrumentos Publicos
- **Vigencia:** Desde el 1 de octubre de 2012. Derogo el Decreto-Ley 1250 de 1970.
- **Objeto:** Regular el servicio publico de registro de instrumentos publicos, prestado por la Superintendencia de Notariado y Registro (SNR) a traves de las Oficinas de Registro de Instrumentos Publicos (ORIP).
- **Objetivos del registro** (Art. 2):
  - a) Servir de medio de tradicion del dominio de los bienes raices y de los otros derechos reales constituidos en ellos.
  - b) Dar publicidad a los instrumentos publicos que trasladen, transmitan, muden, graven, limiten, declaren, afecten, modifiquen o extingan derechos reales sobre los bienes raices.
  - c) Revestir de merito probatorio a todos los instrumentos publicos sujetos a inscripcion.
- **Principio de rogacion:** Los asientos en el registro se practican a solicitud de parte interesada, del notario, o por orden de autoridad judicial o administrativa.
- **Articulo 8 - Matricula Inmobiliaria:** Define el folio de matricula como el medio destinado a la inscripcion de actos, contratos y providencias relacionados con un inmueble. Se distingue con un codigo alfanumerico.
  - **Paragrafo 2:** La inscripcion de falsa tradicion solo procede en los casos contemplados en el Codigo Civil y leyes que lo dispongan.
  - **Paragrafo 3:** Establece los grupos de naturaleza juridica (ver seccion 3).

### 1.2 Decreto-Ley 1250 de 1970 (Anterior Estatuto)
- Estatuto anterior, vigente desde 1970 hasta 2012.
- Creo el sistema de matricula inmobiliaria en Colombia.
- Reemplazado integralmente por la Ley 1579 de 2012.

### 1.3 Otras normas relevantes
- **Ley 258 de 1996:** Afectacion a vivienda familiar. Regula las condiciones bajo las cuales un inmueble puede ser declarado como vivienda familiar y los requisitos para levantar dicha afectacion.
- **Ley 861 de 2003:** Proteccion de vivienda de la mujer cabeza de familia.
- **Ley 70 de 1931:** Patrimonio de familia inembargable.
- **Ley 675 de 2001:** Regimen de propiedad horizontal.
- **Ley 1708 de 2014:** Codigo de Extincion de Dominio.
- **Ley 1561 de 2012:** Proceso verbal especial para otorgar titulos de propiedad al poseedor.
- **Codigo Civil Colombiano:** Articulos 740-766 (tradicion), 2512-2545 (prescripcion).
- **Codigo General del Proceso (Ley 1564 de 2012):** Medidas cautelares, embargos, inscripcion de demandas.
- **Resoluciones SNR:** La SNR emite resoluciones que actualizan los codigos de naturaleza juridica (ej: Resolucion 07448 de 2021, Resolucion 12087 de 2022, Resolucion 10454 de 2022).

---

## 2. Estructura del Certificado - Secciones

El certificado de tradicion y libertad es la "cedula de identidad" de un inmueble. Lo expide la Superintendencia de Notariado y Registro a traves de las ORIP. Tiene tres grandes secciones:

### 2.1 Seccion de COMPLEMENTACION (Datos del Inmueble)
Contiene la informacion fisica y registral del predio:

| Campo | Descripcion |
|-------|-------------|
| **Numero de matricula inmobiliaria** | Identificador unico. Formato: XXX-NNNNN (3 digitos del circulo registral + guion + numero secuencial). Ej: 050C-12345678 |
| **Circulo registral (ORIP)** | Oficina de Registro donde esta inscrito el inmueble. Los 3 primeros digitos de la matricula la identifican. |
| **Estado del folio** | ACTIVO (vigente) o CERRADO (matricula ya no en uso, puede indicar englobe o cierre por otro motivo). |
| **Tipo de predio** | Urbano o Rural |
| **Tipo de inmueble** | Lote, casa, apartamento, local comercial, oficina, bodega, garaje, deposito, finca, etc. |
| **Direccion** | Direccion actual del predio. Puede incluir direcciones anteriores si hubo cambios de nomenclatura. La primera que aparece es la vigente. |
| **Cabida y linderos** | Descripcion del area (metros cuadrados) y los limites fisicos del inmueble. En propiedad horizontal puede referir al reglamento de PH. |
| **Cedula catastral** | Codigo asignado por la autoridad catastral (IGAC o catastro municipal). |
| **Matricula de origen** | Si el inmueble proviene de un desenglobe, indica la matricula "madre". |

### 2.2 Seccion de TRADICION (Historial de Propietarios)
- Muestra la **cadena de titulares** a lo largo del tiempo.
- Cada transferencia de dominio queda registrada como una anotacion del grupo 01 (Tradicion).
- La cadena se lee cronologicamente: quien compro a quien, cuando, por que titulo (compraventa, sucesion, donacion, etc.).
- **Tradicion limpia:** La cadena es ininterrumpida y cada transferencia fue hecha por quien tenia el dominio pleno.

### 2.3 Seccion de ANOTACIONES (Actos Juridicos Registrados)
- Cada anotacion tiene: **numero de anotacion**, **fecha de inscripcion**, **documento de origen** (escritura publica, providencia judicial, resolucion administrativa), **naturaleza juridica** (codigo y descripcion), **personas intervinientes** (de/a).
- Las anotaciones aparecen en orden de radicacion (orden de llegada a la ORIP), no necesariamente en orden cronologico del acto.
- Los gravamenes funcionan como "espejo": toda hipoteca debe tener su cancelacion, todo embargo su desembargo. Si no aparece la cancelacion, el gravamen sigue vigente.

---

## 3. Grupos de Naturaleza Juridica (Art. 8, Par. 3, Ley 1579/2012)

La Ley 1579 clasifica las anotaciones en los siguientes grupos:

### Grupo 01 - TRADICION
Inscripcion de titulos que conllevan modos de adquisicion del dominio.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Compraventa | Transferencia por contrato de venta. Titulo traslaticio mas comun. |
| Donacion | Transferencia gratuita entre vivos mediante escritura publica. |
| Permuta | Intercambio de inmueble por otro bien. |
| Adjudicacion por sucesion | Transferencia a herederos tras proceso sucesoral (sentencia o escritura de particion). |
| Adjudicacion por remate | Transferencia mediante subasta judicial. |
| Adjudicacion en liquidacion de sociedad conyugal | Transferencia por disolucion de sociedad conyugal. |
| Adjudicacion en liquidacion de sociedad | Transferencia a socios por liquidacion de persona juridica. |
| Prescripcion adquisitiva (declaracion de pertenencia) | Adquisicion por posesion continuada: ordinaria (5 anos con justo titulo) o extraordinaria (10 anos sin titulo). Requiere sentencia judicial. |
| Cesion de derechos herenciales | Transferencia de cuota herencial sobre un inmueble. |
| Aporte a sociedad | Transferencia de inmueble como aporte de capital. |
| Fiducia mercantil | Transferencia al patrimonio autonomo de una fiduciaria. |
| Restitucion de inmueble | Devolucion del bien al fideicomitente o a otro por terminacion de fiducia o condicion resolutoria. |
| Expropiacion | Adquisicion forzosa por el Estado por motivos de utilidad publica. |
| Resolucion de compraventa | Deshace la compraventa (por incumplimiento, lesion enorme, etc.). |
| Sentencia declarativa de dominio | Sentencia que reconoce el derecho de propiedad. |

### Grupo 02 - GRAVAMENES
Inscripcion de cargas sobre el inmueble.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Hipoteca abierta | Garantiza obligaciones presentes y futuras hasta un monto maximo. No se cancela con el pago de una obligacion individual. |
| Hipoteca cerrada (de cuantia determinada) | Garantiza una obligacion especifica por un monto determinado. Se cancela al pagar esa obligacion. |
| Hipoteca de mayor extension | Cuando la hipoteca se amplifica o se extiende a nuevas obligaciones. |
| Valorizacion | Contribucion de valorizacion que grava el inmueble. |
| Plusvalia | Liquidacion del efecto de plusvalia. |
| Decreto de beneficio de separacion | Separacion de bienes del difunto respecto de los del heredero. |

### Grupo 03 - LIMITACIONES Y AFECTACIONES
Anotacion de limitaciones al dominio.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Patrimonio de familia inembargable | Proteccion del inmueble familiar (Ley 70/1931). Inmueble no puede ser embargado salvo por credito hipotecario de adquisicion. Requiere levantar antes de vender. |
| Afectacion a vivienda familiar | Proteccion del inmueble donde reside la familia (Ley 258/1996). No se puede vender ni gravar sin consentimiento del conyuge o companero permanente. |
| Usufructo | Derecho de usar y disfrutar del inmueble sin ser propietario. El usufructuario tiene derecho de uso; el nudo propietario conserva el dominio. |
| Uso y habitacion | Derecho real limitado de habitar un inmueble. Similar al usufructo pero mas restringido. |
| Servidumbre | Gravamen sobre un predio (sirviente) en beneficio de otro predio (dominante). Tipos: de transito, de acueducto, de vista, de luz, de medianeria, etc. Limita el uso del predio sirviente. |
| Propiedad horizontal (reglamento PH) | Constitucion del regimen de propiedad horizontal. El inmueble pasa a ser una copropiedad con bienes privados y comunes. Genera desenglobes de unidades privadas. |
| Condicion resolutoria | Clausula que, si se cumple, resuelve (deshace) la transferencia. |
| Relaciones de vecindad | Restricciones derivadas de la coexistencia de predios colindantes. |
| Declaratoria de desplazamiento forzado | Proteccion especial de inmuebles de poblacion desplazada (Ley 387/1997, Ley 1448/2011). |
| Declaratoria de bien de interes cultural | Limita intervenciones fisicas sobre el inmueble. |

### Grupo 04 - MEDIDAS CAUTELARES
Anotacion de medidas decretadas por autoridad judicial o administrativa.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Embargo | Orden judicial que afecta la disponibilidad del inmueble. **Impide enajenacion.** El inmueble NO se puede vender con embargo vigente. |
| Inscripcion de demanda | Publicidad de que existe un proceso judicial que puede afectar el inmueble. No impide venta pero pone en conocimiento a terceros. |
| Prohibicion judicial de enajenar | Orden del juez que prohibe transferir el inmueble. |
| Medida cautelar en proceso de extincion de dominio | Suspension del poder dispositivo ordenada por la Fiscalia o juez de extincion. Inmueble inmovilizado. |
| Medida cautelar en proceso de restitucion de tierras | Proteccion de inmuebles en zonas de despojo (Ley 1448/2011). |
| Valorizacion que afecte enajenabilidad | Contribucion de valorizacion con efecto de restriccion a la venta. |
| Prohibicion administrativa | Orden de autoridad administrativa que restringe la disposicion del inmueble. |

### Grupo 05 - TENENCIA
Inscripcion de titulos de tenencia constituidos por escritura publica o decision judicial.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Arrendamiento | Contrato de arrendamiento inscrito. |
| Comodato | Prestamo gratuito de uso. |
| Anticresis | Entrega del inmueble al acreedor para que perciba frutos a cuenta de la deuda. |
| Leasing inmobiliario | Contrato de leasing sobre el inmueble. |
| Derecho de retencion | Derecho del tenedor a retener el inmueble hasta que se le pague lo adeudado. |

### Grupo 06 - FALSA TRADICION
Inscripcion de titulos donde NO se transfiere el dominio real.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Venta de cosa ajena | Quien vende no es el verdadero propietario. El comprador NO adquiere dominio. |
| Transferencia de derechos y acciones | Transferencia de derechos posesorios, no de dominio pleno. |
| Transferencia de derecho incompleto | Quien transfiere no tiene el 100% del dominio (ej: transfiere mas de lo que posee). |
| Transferencia sin antecedente propio | No hay matricula previa del inmueble o cadena registral rota. |
| Adjudicacion de mejoras | Reconocimiento de mejoras edificadas en predio ajeno. No es transferencia de dominio del suelo. |
| Posesion inscrita (derechos y acciones) | Inscripcion de una posesion que no equivale a dominio. |
| Enajenacion de cuota en cuerpo cierto teniendo solo derechos de cuota | Venta como si fuera propietario exclusivo cuando solo se tienen derechos de cuota. |
| Cesion de derechos herenciales sobre cuerpo cierto | Transferencia de derechos herenciales sobre un bien especifico antes de la particion. |

**NOTA CRITICA:** Un inmueble con falsa tradicion NO puede ser hipotecado, englobado, desenglobado, sometido a propiedad horizontal, ni constituir servidumbres o usufructos sobre el. El propietario real puede reclamar restitucion en cualquier momento.

### Grupo 07 - CANCELACIONES
Inscripcion de actos que cancelan anotaciones previas.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Cancelacion de hipoteca | Levantamiento de gravamen hipotecario por pago o acuerdo. |
| Cancelacion de embargo (desembargo) | Levantamiento de medida cautelar de embargo. |
| Cancelacion de patrimonio de familia | Levantamiento de patrimonio de familia. |
| Cancelacion de afectacion a vivienda familiar | Levantamiento de afectacion a vivienda familiar. |
| Cancelacion de usufructo | Terminacion del derecho de usufructo (por muerte, renuncia, consolidacion). |
| Cancelacion de servidumbre | Levantamiento de servidumbre. |
| Cancelacion de condicion resolutoria | Cumplida o no la condicion, se cancela la anotacion. |
| Cancelacion de medida cautelar | Levantamiento de cualquier medida cautelar. |
| Cancelacion de inscripcion de demanda | Terminacion de proceso judicial anotado. |

### Grupo 08 - CANCELACIONES (continuacion)
Mismo grupo funcional que el 07. Usado para cancelaciones adicionales.

### Grupo 09 - OTROS
Actos que no encajan en los grupos anteriores pero requieren publicidad.

| Tipo de anotacion | Descripcion |
|-------------------|-------------|
| Desenglobe | Division material de un inmueble en dos o mas predios. Genera nuevas matriculas "hijas". |
| Englobe | Union de dos o mas inmuebles contiguos del mismo propietario en una sola matricula. |
| Loteo / urbanizacion | Division de un terreno en lotes individuales para desarrollo urbanistico. Genera matriculas para cada lote. |
| Aclaracion de escritura | Correccion de errores en escritura publica (linderos, areas, nombres). |
| Correccion de area y/o linderos | Ajuste registral de la descripcion fisica del inmueble. |
| Cambio de nombre o razon social | Actualizacion de datos del propietario sin transferencia de dominio. |
| Actualizacion de nomenclatura | Cambio de direccion del predio por actualizacion del sistema de nomenclatura de la ciudad. |
| Testamento | Inscripcion de testamento que afecta el inmueble. |

---

## 4. Banderas Rojas - Que Constituye Riesgo

### 4.1 RIESGO CRITICO (Bloquean o impiden transaccion)

| Bandera roja | Razon | Impacto |
|-------------|-------|---------|
| **Falsa tradicion (Grupo 06)** | La cadena de dominio esta rota. El "propietario" registrado no tiene dominio real. | El verdadero propietario puede reclamar restitucion en cualquier momento. El inmueble no se puede hipotecar, englobar, desenglobar ni someter a PH. **NO COMPRAR.** |
| **Embargo vigente (sin desembargo)** | Medida cautelar judicial que inmoviliza el inmueble. | **Impide legalmente la enajenacion.** La oficina de registro rechazara la escritura de compraventa. No se puede comprar hasta que se levante. |
| **Medida cautelar en proceso de extincion de dominio** | Suspension del poder dispositivo por posible relacion con actividades ilicitas. | Inmueble completamente inmovilizado. **NO COMPRAR bajo ninguna circunstancia.** |
| **Propietario registrado diferente al vendedor** | Quien ofrece vender no aparece como propietario en el certificado. | Posible estafa o suplantacion. Verificar con escritura y cedula. **NO proceder sin aclarar.** |
| **Medida cautelar en proceso de restitucion de tierras** | Inmueble protegido por proceso de restitucion de victimas. | Inmueble inmovilizado por orden judicial especial. |

### 4.2 RIESGO ALTO (Requieren atencion urgente antes de transaccion)

| Bandera roja | Razon | Impacto |
|-------------|-------|---------|
| **Patrimonio de familia inembargable vigente** | Proteccion que impide gravar o vender sin procedimiento especial. | Requiere levantamiento por escritura publica (si no hay hijos menores) o por juez de familia (si hay hijos menores). Sin levantar, la venta se rechaza o es anulable. |
| **Afectacion a vivienda familiar vigente** | Proteccion del conyuge/companero permanente. | Requiere consentimiento de ambos conyuges para vender. Sin el, la venta es anulable (Ley 258/1996). |
| **Inscripcion de demanda vigente** | Existe un proceso judicial que puede afectar la propiedad. | No impide la venta pero el comprador adquiere con conocimiento del riesgo. Puede perder el inmueble segun resultado del proceso. |
| **Usufructo vigente** | Un tercero tiene derecho de uso y disfrute. | El comprador adquiere la nuda propiedad pero no puede usar el inmueble hasta que termine el usufructo (por muerte del usufructuario, plazo, renuncia). |
| **Multiples traspasos en corto periodo** | 3 o mas transferencias en menos de 2 anos. | Posible indicador de lavado de activos, fraude o titulacion irregular. Requiere investigacion adicional. |

### 4.3 RIESGO MEDIO (Manejable pero debe verificarse)

| Bandera roja | Razon | Impacto |
|-------------|-------|---------|
| **Hipoteca vigente (sin cancelacion)** | Inmueble dado en garantia a entidad financiera. | Normal si hay credito vigente. Se puede vender con subrogacion del credito o cancelacion previa. Verificar que el vendedor tenga paz y salvo o acuerdo con el banco. |
| **Servidumbre vigente** | Predio gravado a favor de otro predio. | Limita el uso segun el tipo (transito, acueducto, etc.). No impide venta pero afecta valor y uso. Evaluar impacto segun tipo. |
| **Propiedad horizontal sin desenglobes completos** | PH constituida pero unidades no desenglobadas. | Puede indicar proceso de urbanizacion incompleto. Verificar que la unidad a comprar tenga matricula propia. |
| **Linderos imprecisos o ambiguos** | Cabida y linderos no coinciden con realidad fisica. | Posibles disputas con vecinos. Necesita aclaracion de escritura o levantamiento topografico. |
| **Valorizacion pendiente** | Contribucion de valorizacion no pagada. | Puede generar cobro coactivo con embargo posterior. Verificar paz y salvo con la entidad que cobro la valorizacion. |

### 4.4 RIESGO BAJO (Informativos, no bloquean)

| Bandera roja | Razon | Impacto |
|-------------|-------|---------|
| **Hipoteca cancelada** | Gravamen que ya fue levantado. | Sin riesgo. Solo verifica que la anotacion de cancelacion exista. |
| **Embargo con desembargo posterior** | Medida cautelar que ya fue levantada. | Sin riesgo actual. Verificar que el desembargo sea posterior al embargo. |
| **Leasing inmobiliario** | Inmueble en contrato de leasing. | Verificar si ya se ejercio opcion de compra. Si el leasing esta vigente, el "propietario" puede ser la entidad financiera. |

---

## 5. Campos a Extraer del Certificado

Para el analisis automatizado por IA, estos son los campos criticos a extraer:

### 5.1 Datos del Inmueble (Seccion Complementacion)
```
- numero_matricula: string (formato "XXX-NNNNNNN")
- circulo_registral_orip: string (nombre de la ORIP)
- estado_folio: enum ["ACTIVO", "CERRADO"]
- tipo_predio: enum ["URBANO", "RURAL"]
- tipo_inmueble: string (casa, apartamento, lote, local, oficina, bodega, finca, etc.)
- direccion_actual: string
- direcciones_anteriores: string[] (si aplica)
- cabida_area_m2: number (area en metros cuadrados)
- linderos: string (descripcion textual)
- cedula_catastral: string
- matricula_origen: string (si proviene de desenglobe)
- fecha_apertura_folio: date
```

### 5.2 Propietario(s) Actual(es)
```
- propietarios: array de:
  - nombre_completo: string
  - tipo_documento: enum ["CC", "NIT", "CE", "PASAPORTE"]
  - numero_documento: string
  - porcentaje_propiedad: number (0-100)
  - tipo_derecho: enum ["DOMINIO", "NUDA_PROPIEDAD", "DERECHOS_Y_ACCIONES"]
  - anotacion_adquisicion: number (referencia a la anotacion donde adquirio)
```

### 5.3 Anotaciones (por cada anotacion)
```
- numero_anotacion: number
- fecha_anotacion: date
- documento_origen: string (ej: "Escritura Publica No. 1234 de Notaria 5 de Bogota")
- codigo_naturaleza_juridica: string (ej: "0125")
- grupo_naturaleza: enum ["01_TRADICION", "02_GRAVAMEN", "03_LIMITACION", "04_MEDIDA_CAUTELAR", "05_TENENCIA", "06_FALSA_TRADICION", "07_CANCELACION", "09_OTROS"]
- descripcion_acto: string (ej: "COMPRAVENTA", "HIPOTECA ABIERTA", "EMBARGO")
- personas_de: string[] (quien transfiere, grava o afecta)
- personas_a: string[] (quien recibe, adquiere o se beneficia)
- valor: number (si aplica, en COP)
- vigente: boolean (true si no existe cancelacion posterior)
- anotacion_cancelacion: number (referencia a anotacion que la cancela, si existe)
```

### 5.4 Resumen Ejecutivo (calculado)
```
- gravamenes_vigentes: array (hipotecas, prendas sin cancelar)
- limitaciones_vigentes: array (patrimonio de familia, afectacion vivienda, usufructo, servidumbres)
- medidas_cautelares_vigentes: array (embargos, inscripciones de demanda)
- tiene_falsa_tradicion: boolean
- ultima_anotacion: {numero, fecha, tipo}
- fecha_expedicion_certificado: date
- antiguedad_certificado_dias: number (dias desde expedicion hasta hoy)
```

---

## 6. Como Leer la Cadena de Titulares

### 6.1 Que es "tradicion limpia"
Una tradicion limpia significa:
1. **Cadena ininterrumpida:** Cada propietario adquirio del propietario inmediatamente anterior en el registro.
2. **Todos los titulos son del Grupo 01 (Tradicion):** Compraventa, sucesion, donacion, etc. Nunca del Grupo 06 (Falsa Tradicion).
3. **El modo de adquisicion fue valido:** Escritura publica + registro para actos entre vivos; sentencia + registro para sucesion o prescripcion.
4. **No hay vacios temporales inexplicables:** No hay periodos donde nadie figure como propietario.
5. **Los ultimos 20 anos de tradicion son verificables:** Un estudio de titulos profesional revisa al menos 20 anos hacia atras.

### 6.2 Que es "falsa tradicion" y por que es grave
La falsa tradicion ocurre cuando se inscribe un titulo que **NO transfiere realmente el dominio**. Casos tipicos:

| Caso | Ejemplo | Riesgo |
|------|---------|--------|
| Venta de cosa ajena | A vende a B un inmueble que es de C. B queda registrado pero C sigue siendo el verdadero dueno. | C puede demandar reivindicacion (recuperacion) en cualquier momento. |
| Transferencia de derechos y acciones | A "vende" derechos posesorios a B. No es dominio pleno. | B no es propietario. No puede hipotecar, englobar, ni constituir PH. |
| Sin antecedente propio | Se inscribe un titulo sobre un inmueble sin matricula previa o sin cadena registral clara. | Origen del derecho desconocido. Alto riesgo de reclamacion por terceros. |
| Derechos herenciales sobre cuerpo cierto | A vende a B los "derechos herenciales" sobre una casa especifica antes de particion. | La particion puede asignar esa casa a otro heredero. |

**Para sanear la falsa tradicion:**
- La unica via segura es la **prescripcion adquisitiva** (declaracion de pertenencia): demostrar posesion pacifica e ininterrumpida de 5 anos (ordinaria) o 10 anos (extraordinaria).
- Requiere sentencia judicial firme que declare el dominio.

### 6.3 Como verificar que el vendedor tiene titulo legitimo
Pasos para la IA:
1. **Identificar la ultima anotacion del Grupo 01 (Tradicion):** Esa es la anotacion que le dio el dominio al propietario actual.
2. **Verificar que los nombres y documentos del propietario actual coincidan** con los datos del vendedor en la promesa de compraventa.
3. **Verificar que NO hay anotaciones del Grupo 06 (Falsa Tradicion)** en ninguna parte de la cadena.
4. **Verificar que el porcentaje de propiedad es 100%** o que todos los copropietarios estan vendiendo.
5. **Verificar hacia atras** que cada propietario adquirio de quien le precedia en el registro (tracto sucesivo).
6. **Verificar que NO hay medidas cautelares vigentes** (Grupo 04) que impidan la enajenacion.
7. **Verificar que las limitaciones (Grupo 03) estan canceladas** o son manejables.

---

## 7. Score de Riesgo para Certificados

### Metodologia de calificacion

El score se calcula sumando puntos de penalizacion por cada hallazgo negativo:

#### Nivel 0-25: RIESGO BAJO (Semaforo verde)
- Tradicion limpia sin interrupciones.
- Sin gravamenes vigentes (o solo hipoteca con cancelacion proxima).
- Sin limitaciones activas.
- Sin medidas cautelares.
- Propietario actual coincide con el vendedor.
- Certificado expedido hace menos de 30 dias.
- Linderos claros y precisos.

#### Nivel 26-50: RIESGO MEDIO (Semaforo amarillo)
- Hipoteca vigente (normal si hay credito vigente; verificar condiciones de cancelacion).
- Patrimonio de familia inembargable (levantable, requiere tramite).
- Afectacion a vivienda familiar (levantable con consentimiento del conyuge).
- Servidumbres que no afectan significativamente el uso.
- Certificado con mas de 30 dias de antigueedad (solicitar uno reciente).
- Leasing inmobiliario vigente.
- Linderos con pequenas imprecisiones.

#### Nivel 51-75: RIESGO ALTO (Semaforo naranja)
- Embargo vigente (bloquea la transaccion).
- Inscripcion de demanda vigente (riesgo de perder el inmueble).
- Usufructo vigente (comprador no puede usar el inmueble).
- Patrimonio de familia con hijos menores (requiere juez de familia).
- Multiples transferencias en corto periodo (posible fraude/lavado).
- Falsa tradicion parcial (alguna anotacion en Grupo 06 pero con saneamiento posterior).
- Folio cerrado sin explicacion clara.

#### Nivel 76-100: RIESGO MUY ALTO (Semaforo rojo - NO COMPRAR)
- Falsa tradicion vigente sin sanear.
- Multiples embargos vigentes.
- Medida cautelar en proceso de extincion de dominio.
- Medida cautelar en proceso de restitucion de tierras.
- Propietario registrado NO coincide con el vendedor.
- Cadena de titulares rota o con vacios inexplicables.
- Inmueble sin matricula de origen clara (predios "fantasma").

### Tabla de penalizacion sugerida

| Hallazgo | Puntos |
|----------|--------|
| Falsa tradicion vigente (Grupo 06 sin sanear) | +40 |
| Embargo vigente | +30 |
| Extincion de dominio | +50 |
| Restitucion de tierras | +50 |
| Propietario no coincide con vendedor | +35 |
| Inscripcion de demanda vigente | +20 |
| Patrimonio de familia vigente (sin hijos menores) | +15 |
| Patrimonio de familia vigente (con hijos menores) | +25 |
| Afectacion vivienda familiar vigente | +15 |
| Usufructo vigente | +20 |
| Hipoteca vigente | +10 |
| Servidumbre vigente | +5 |
| Linderos imprecisos | +10 |
| Multiples transferencias corto periodo (3+ en 2 anos) | +15 |
| Certificado antiguo (>30 dias) | +5 |
| Certificado muy antiguo (>90 dias) | +10 |
| Folio cerrado | +25 |

**Score final = min(100, suma de puntos)**

---

## 8. Allowlist de Tipos de Anotacion (Post-Validation)

Lista de tipos de anotacion reconocidos para validar que el parser los identifique correctamente. Si una anotacion no esta en esta lista, marcarla como "TIPO_DESCONOCIDO" para revision manual.

### Grupo 01 - Tradicion
```
COMPRAVENTA
DONACION
PERMUTA
ADJUDICACION_SUCESION
ADJUDICACION_REMATE
ADJUDICACION_LIQUIDACION_CONYUGAL
ADJUDICACION_LIQUIDACION_SOCIEDAD
PRESCRIPCION_ADQUISITIVA
DECLARACION_PERTENENCIA
CESION_DERECHOS_HERENCIALES
APORTE_A_SOCIEDAD
FIDUCIA_MERCANTIL
RESTITUCION_INMUEBLE
EXPROPIACION
RESOLUCION_COMPRAVENTA
SENTENCIA_DECLARATIVA_DOMINIO
TRANSFERENCIA_DOMINIO_ACUERDO_PAZ
ADJUDICACION_BALDIO
TITULACION_VIVIENDA_INTERES_SOCIAL
```

### Grupo 02 - Gravamenes
```
HIPOTECA_ABIERTA
HIPOTECA_CERRADA
HIPOTECA_MAYOR_EXTENSION
VALORIZACION
PLUSVALIA
BENEFICIO_SEPARACION
```

### Grupo 03 - Limitaciones y Afectaciones
```
PATRIMONIO_FAMILIA_INEMBARGABLE
AFECTACION_VIVIENDA_FAMILIAR
USUFRUCTO
USO_Y_HABITACION
SERVIDUMBRE_TRANSITO
SERVIDUMBRE_ACUEDUCTO
SERVIDUMBRE_VISTA
SERVIDUMBRE_LUZ
SERVIDUMBRE_MEDIANERIA
SERVIDUMBRE_OTRA
PROPIEDAD_HORIZONTAL_REGLAMENTO
CONDICION_RESOLUTORIA
DECLARATORIA_DESPLAZAMIENTO
DECLARATORIA_BIEN_INTERES_CULTURAL
RELACIONES_VECINDAD
CONDOMINIO
```

### Grupo 04 - Medidas Cautelares
```
EMBARGO
INSCRIPCION_DEMANDA
PROHIBICION_ENAJENAR_JUDICIAL
PROHIBICION_ENAJENAR_ADMINISTRATIVA
MEDIDA_CAUTELAR_EXTINCION_DOMINIO
MEDIDA_CAUTELAR_RESTITUCION_TIERRAS
VALORIZACION_AFECTA_ENAJENABILIDAD
SUSPENSION_PODER_DISPOSITIVO
```

### Grupo 05 - Tenencia
```
ARRENDAMIENTO
COMODATO
ANTICRESIS
LEASING_INMOBILIARIO
DERECHO_RETENCION
```

### Grupo 06 - Falsa Tradicion
```
VENTA_COSA_AJENA
TRANSFERENCIA_DERECHOS_Y_ACCIONES
TRANSFERENCIA_DERECHO_INCOMPLETO
TRANSFERENCIA_SIN_ANTECEDENTE_PROPIO
ADJUDICACION_MEJORAS
POSESION_INSCRITA
ENAJENACION_CUOTA_CUERPO_CIERTO
CESION_HERENCIALES_CUERPO_CIERTO
```

### Grupo 07/08 - Cancelaciones
```
CANCELACION_HIPOTECA
CANCELACION_EMBARGO (DESEMBARGO)
CANCELACION_PATRIMONIO_FAMILIA
CANCELACION_AFECTACION_VIVIENDA_FAMILIAR
CANCELACION_USUFRUCTO
CANCELACION_SERVIDUMBRE
CANCELACION_CONDICION_RESOLUTORIA
CANCELACION_MEDIDA_CAUTELAR
CANCELACION_INSCRIPCION_DEMANDA
CANCELACION_PROHIBICION_ENAJENAR
CANCELACION_ARRENDAMIENTO
CANCELACION_LEASING
```

### Grupo 09 - Otros
```
DESENGLOBE
ENGLOBE
LOTEO
URBANIZACION
ACLARACION_ESCRITURA
CORRECCION_AREA_LINDEROS
CAMBIO_NOMBRE_RAZON_SOCIAL
ACTUALIZACION_NOMENCLATURA
TESTAMENTO
APERTURA_FOLIO
CIERRE_FOLIO
```

---

## 9. Reglas de Logica para el Analisis Automatizado

### 9.1 Determinacion de vigencia de anotaciones
- Un gravamen (Grupo 02) esta **vigente** si NO existe una anotacion posterior del Grupo 07 que lo cancele explicitamente.
- Una medida cautelar (Grupo 04) esta **vigente** si NO existe una anotacion posterior del Grupo 07 que la cancele.
- Una limitacion (Grupo 03) esta **vigente** si NO existe cancelacion posterior.
- La regla del "espejo": cada gravamen/limitacion/medida debe tener su cancelacion. Sin cancelacion = vigente.

### 9.2 Determinacion del propietario actual
- El propietario actual es el que aparece como beneficiario ("A" o "a favor de") en la ultima anotacion del Grupo 01 (Tradicion) que no haya sido anulada o resuelta.
- Si hay multiples propietarios, cada uno tiene un porcentaje. Sumar todos los porcentajes debe dar 100%.
- Si la ultima anotacion de tradicion es del Grupo 06 (Falsa Tradicion), no hay propietario con dominio pleno.

### 9.3 Antigueedad del certificado
- Un certificado es confiable si fue expedido hace menos de 30 dias.
- Entre 30 y 90 dias: aceptable para revision preliminar pero debe renovarse antes de firmar escritura.
- Mas de 90 dias: obsoleto. Debe solicitarse uno nuevo.
- Las ORIP expiden certificados electronicos verificables en: https://certificados.supernotariado.gov.co/certificado/external/validation/validate.snr

### 9.4 Validaciones criticas antes de recomendar una transaccion
1. Estado del folio = ACTIVO
2. Propietario registrado = vendedor declarado
3. Sin falsa tradicion en la cadena
4. Sin embargos vigentes
5. Sin medidas cautelares de extincion de dominio
6. Sin patrimonio de familia / afectacion vivienda familiar vigente (o con plan de levantamiento)
7. Hipotecas vigentes con acuerdo de cancelacion
8. Certificado con antigueedad < 30 dias

---

## 10. Fuentes Consultadas

### Normativas
- [Ley 1579 de 2012 - Funcion Publica](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731)
- [Ley 1579 de 2012 - Secretaria Senado](http://www.secretariasenado.gov.co/senado/basedoc/ley_1579_2012.html)
- [Ley 1579 de 2012 - SUIN Juriscol](https://www.suin-juriscol.gov.co/viewDocument.asp?id=1684387)
- [Ley 258 de 1996 - Afectacion Vivienda Familiar](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=10794)
- [Ley 70 de 1931 - Patrimonio de Familia](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=39265)
- [Ley 1708 de 2014 - Extincion de Dominio](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=56475)
- [Codigos Registrales SNR - Resolucion 07448 de 2021](https://servicios.supernotariado.gov.co/files/portal/portal-codigosdenaturalezajuridica074482021v4.pdf)

### Guias y referencias
- [Certificado de Tradicion y Libertad - Guia Completa - Bancolombia](https://blog.bancolombia.com/vida-cotidiana/certificado-de-tradicion-y-libertad-guia-completa/)
- [Como leer el certificado - CertificadosTradicionYLibertad.co](https://certificadostradicionylibertad.co/blog/post/te-explicamos-como-leer-y-comprender-la-informacion-en-un-certificado-de-tradicion-y-libertad/-NxO37NlCGlF8bNhFVTB)
- [Certificado de Tradicion - Notaria 19 Bogota](https://www.notaria19bogota.com/certificado-de-tradicion-y-libertad/)
- [Codigos para Registro de Escrituras - Notaria 19 Bogota](https://www.notaria19bogota.com/codigos-para-el-registro-de-las-escrituras-publicas/)
- [Medidas Cautelares en Inmuebles - Notaria 19 Bogota](https://www.notaria19bogota.com/medidas-cautelares/)
- [Falsa Tradicion - Gerencie.com](https://www.gerencie.com/cuando-se-entiende-que-hay-falsa-tradicion-y-proceso-senalado-para-sanearla.html)
- [Falsa Tradicion - RoaySanchez Abogados](https://roaysanchezabogados.com/blog/derecho-civil/que-es-la-falsa-tradicion-en-la-adquisicion-de-un-inmueble/)
- [Falsa Tradicion - Palacios Franco Abogados](https://palaciosfrancoabogados.com/que-es-la-falsa-tradicion-el-peligro-del-dueno-falso/)
- [Patrimonio de Familia - MisAbogados.com.co](https://www.misabogados.com.co/blog/patrimonio-de-familia-inembargable)
- [Patrimonio de Familia - Habi.co](https://habi.co/blog/que-es-patrimonio-familiar)
- [Patrimonio de Familia - ChauxJaramillo Abogados](https://chauxjaramillo.com/blog/derecho-inmobiliario/patrimonio-de-familia/)
- [Estudio de Titulos - ChauxJaramillo Abogados](https://chauxjaramillo.com/blog/derecho-inmobiliario/estudio-de-titulos/)
- [Estudio de Titulos - ServicioLegal.com.co](https://serviciolegal.com.co/en/blog/title-study-for-the-purchase-of-real-estate-in-colombia)
- [Validacion Certificados SNR](https://certificados.supernotariado.gov.co/certificado/external/validation/validate.snr)
- [Certificado de Tradicion - Notaria 68 Bogota](https://www.notaria68bogota.com/notaria-68-bogota-que-es-el-certificado-de-tradicion-y-libertad.html)
- [Codigos para Operaciones de Registro - Colombia Agil](https://www.colombiaagil.gov.co/tramites/intervenciones/codigos-para-operaciones-de-registro-inmobiliario)
