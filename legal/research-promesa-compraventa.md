# Research: Promesa de Compraventa de Inmuebles en Colombia

Documento de referencia para alimentar prompt de IA que analice promesas de compraventa.
Fecha de investigacion: 2026-03-12

---

## 1. Marco Legal Aplicable

### 1.1 Codigo Civil Colombiano

**Articulo 1611 - Promesa de celebrar un contrato**
La promesa de celebrar un contrato no produce obligacion alguna, salvo que concurran las siguientes circunstancias:
1. Que la promesa conste por escrito.
2. Que el contrato a que la promesa se refiere no sea de aquellos que las leyes declaran ineficaces por no concurrir los requisitos del articulo 1502 del Codigo Civil (capacidad, consentimiento libre de vicios, objeto licito, causa licita).
3. Que la promesa contenga un plazo o condicion que fije la epoca en que ha de celebrarse el contrato.
4. Que se determine de tal suerte el contrato, que para perfeccionarlo solo falte la tradicion de la cosa o las formalidades legales.

**Articulo 1502 - Requisitos de validez de todo contrato**
- Capacidad legal de las partes
- Consentimiento libre de vicios (error, fuerza, dolo)
- Objeto licito
- Causa licita

**Articulo 1546 - Condicion resolutoria tacita**
En los contratos bilaterales va envuelta la condicion resolutoria en caso de no cumplirse por uno de los contratantes lo pactado. El otro contratante puede pedir a su arbitrio la resolucion o el cumplimiento del contrato, con indemnizacion de perjuicios.

**Articulo 1592 - Clausula penal**
La clausula penal es aquella en que una persona, para asegurar el cumplimiento de una obligacion, se sujeta a una pena que consiste en dar o hacer algo en caso de no ejecutar o retardar la obligacion principal.

**Articulo 1596 - Clausula penal e indemnizacion**
Si el deudor cumple solamente una parte de la obligacion principal y el acreedor acepta esa parte, tendra derecho para que se rebaje proporcionalmente la pena estipulada por falta de cumplimiento de la obligacion principal.

**Articulo 1600 - Acumulacion de clausula penal y cumplimiento**
No podra pedirse a la vez la pena y la indemnizacion de perjuicios, a menos de haberse estipulado asi expresamente; pero siempre estara al arbitrio del acreedor pedir la indemnizacion o la pena.

**Articulo 1601 - Clausula penal enorme**
Cuando por el contrato principal una de las partes se obligo a pagar una cantidad determinada, como equivalente a lo que por la otra parte debe prestarse, y la pena consiste asimismo en el pago de una cantidad determinada, podra pedirse que se rebaje de la segunda todo lo que exceda al duplo de la primera, incluyendose esta en el. La norma establece que la clausula penal no puede exceder el doble de la obligacion principal. El juez tiene facultad de moderarla cuando resulte enorme.

**Articulo 1849 - Definicion de compraventa**
La compraventa es un contrato en que una de las partes se obliga a dar una cosa y la otra a pagarla en dinero.

**Articulo 1857 - Perfeccionamiento de la venta de inmuebles**
La venta de los bienes raices y servidumbres y la de una sucesion hereditaria, no se reputan perfectas ante la ley, mientras no se ha otorgado escritura publica. Esto fundamenta la necesidad de la promesa como contrato preparatorio.

**Articulo 1859 - Arras de retracto (penitenciales)**
Si se vende con arras, dando una cosa en prenda de la celebracion o ejecucion del contrato, se entiende que cada uno de los contratantes podra retractarse: el que ha dado las arras, perdiendolas; y el que las ha recibido, restituyendolas dobladas.

**Articulo 1860 - Plazo para retracto**
Si los contratantes no hubieren fijado plazo dentro del cual puedan retractarse, no habra lugar a la retractacion despues de los dos meses subsiguientes a la convencion, ni despues de otorgada escritura publica de la venta o de principiada la entrega.

**Articulo 1861 - Arras confirmatorias**
Si expresamente se dieren arras como parte del precio, o como senal de quedar convenidos los contratantes, quedara perfecta la venta; sin perjuicio de lo prevenido en el articulo 1857, inciso 2o.

**Articulo 1893 - Obligacion de saneamiento**
La obligacion de saneamiento comprende dos objetos: amparar al comprador en el dominio y posesion pacifica de la cosa vendida, y responder de los defectos ocultos de esta, llamados vicios redhibitorios.

**Articulo 1895 - Saneamiento por eviccion**
El vendedor es obligado a sanear al comprador todas las evicciones que tengan una causa anterior a la venta, salvo en cuanto se haya estipulado lo contrario.

**Articulo 1913 - Prescripcion de la accion de saneamiento**
La accion de saneamiento por eviccion prescribe en cuatro anos, contados desde la fecha de la sentencia de eviccion o desde la restitucion de la cosa.

### 1.2 Ley 1579 de 2012 - Estatuto de Registro de Instrumentos Publicos

Regula el sistema de registro de la propiedad inmueble en Colombia. Objetivos basicos del registro:
- Servir como medio de tradicion de dominio sobre inmuebles y otros derechos reales (art. 756 C.C.)
- Dar publicidad a los instrumentos publicos que transfieran, modifiquen, graven, limiten o extingan derechos reales sobre inmuebles
- Dar valor probatorio a todos los instrumentos publicos sujetos a registro

**Relevancia para la promesa:** La promesa NO se registra, pero la escritura publica resultante SI debe registrarse para perfeccionar la tradicion. El certificado de tradicion y libertad (expedido bajo esta ley) es el documento clave para verificar el estado juridico del inmueble.

### 1.3 Decreto 960 de 1970 - Estatuto del Notariado

Regula la funcion notarial y los requisitos de las escrituras publicas. Requisitos esenciales:
- Fecha y lugar de autorizacion
- Denominacion legal del Notario
- Identificacion de los otorgantes o sus representantes
- Datos necesarios para determinar los bienes objeto de las declaraciones
- Lectura, aprobacion y firma por los otorgantes
- Comprobantes fiscales previos

**Relevancia para la promesa:** La escritura publica de compraventa (contrato definitivo) debe cumplir todos estos requisitos. Si la promesa designa notaria, debe verificarse que sea competente.

### 1.4 Ley 1480 de 2011 - Estatuto del Consumidor

Aplicable cuando el vendedor es constructor/promotor inmobiliario (relacion de consumo).

**Articulo 42 - Clausulas abusivas:** Producen desequilibrio injustificado en perjuicio del consumidor. Ineficaces de pleno derecho.

**Articulo 43 - Clausulas ineficaces de pleno derecho:**
- Limitar responsabilidad del productor/proveedor
- Implicar renuncia de derechos del consumidor
- Invertir la carga de la prueba en perjuicio del consumidor
- Trasladar responsabilidad del productor a un tercero
- Que el productor no reintegre lo pagado si no ejecuta el objeto contratado
- Vincular al consumidor aunque el productor incumpla
- Facultad unilateral del productor para determinar si cumplio

---

## 2. Requisitos de Validez de la Promesa

### 2.1 Forma escrita (obligatoria)
- La promesa verbal NO produce obligacion alguna
- Puede ser documento privado (no requiere escritura publica)
- Puede ser documento digital con firma electronica
- **Recomendacion:** Autenticacion notarial (no es requisito de validez pero otorga fecha cierta y evita desconocimiento de firma)

### 2.2 Validez del contrato prometido
- El contrato de compraventa prometido no puede ser contrario a la ley
- Las partes deben tener capacidad legal
- Consentimiento libre de vicios
- Objeto licito (inmueble en comercio, no embargado, no en litigio)
- Causa licita

### 2.3 Plazo o condicion que fije la epoca de celebracion
- Debe contener plazo o condicion DETERMINADA para la escrituracion
- El plazo debe ser cierto, claro, preciso y verificable
- **Riesgo critico:** Un plazo indefinido o indeterminable puede acarrear nulidad absoluta
- La jurisprudencia exige que el mecanismo para establecer la epoca sea objetivo

### 2.4 Determinacion del contrato
- El inmueble debe estar identificado de manera que no haya duda
- Identificacion mediante: ubicacion, linderos, matricula inmobiliaria, cedula catastral
- El precio debe estar determinado o ser determinable
- Solo debe faltar la tradicion o las formalidades legales (escritura publica + registro)

### 2.5 Documento privado vs. escritura publica
- La promesa de compraventa se formaliza como **documento privado**
- NO requiere ni debe elevarse a escritura publica (la escritura es para el contrato definitivo)
- La autenticacion notarial es opcional pero altamente recomendada
- Muchas entidades financieras exigen autenticacion para tramitar credito hipotecario

### 2.6 Consecuencia del incumplimiento de requisitos
- **Nulidad absoluta** de la promesa si no cumple los 4 requisitos del art. 1611
- La nulidad puede ser declarada de oficio por el juez
- El incumplimiento de requisitos no es subsanable

---

## 3. Elementos Esenciales a Detectar en el Documento

### 3.1 Identificacion de las partes
- Nombre completo del comprador y vendedor
- Numero de cedula de ciudadania (CC) o NIT (si es persona juridica)
- Estado civil (relevante para regimen de sociedad conyugal)
- Domicilio
- Si actua mediante representante: poder, clase de representacion, datos del representado

### 3.2 Identificacion del inmueble
- Direccion completa
- Matricula inmobiliaria (numero de folio)
- Cedula catastral
- Linderos (norte, sur, oriente, occidente)
- Area (en metros cuadrados)
- Municipio/ciudad y departamento
- Tipo de inmueble (apartamento, casa, lote, local, oficina, bodega)
- Si es propiedad horizontal: torre, piso, unidad, coeficiente de copropiedad

### 3.3 Precio y forma de pago
- Precio total en numeros y letras
- Forma de pago:
  - Cuota inicial / anticipo / arras
  - Pagos parciales con fechas
  - Saldo a financiar (credito hipotecario, leasing)
  - Subrogacion de deudas existentes
- Moneda de pago
- Cuenta bancaria para consignaciones

### 3.4 Arras
Existen tres tipos en el derecho colombiano:

**a) Arras penitenciales o de retracto (art. 1859 C.C.)**
- Permiten a cualquier parte desistir del contrato
- Quien entrega: las pierde
- Quien recibe: debe restituirlas dobladas
- Si no se estipula tipo, la ley **presume** que son de retracto
- Plazo maximo para retracto: el pactado, o 2 meses si no se pacto (art. 1860)

**b) Arras confirmatorias (art. 1861 C.C.)**
- Se dan como parte del precio o como senal de acuerdo
- NO permiten retractarse
- Se imputan al precio en la escritura definitiva
- Confirman la perfeccion del acuerdo

**c) Arras confirmatorias penales (creacion jurisprudencial)**
- Funcionan como clausula penal anticipada
- Castigan el incumplimiento sin permitir desistir libremente
- Suponen estimacion anticipada de perjuicios por incumplimiento

**Monto usual:** 10% del valor total del negocio (no hay tope legal obligatorio, pero la practica comercial lo establece asi). Montos superiores al 20-30% deben considerarse riesgosos.

### 3.5 Clausula penal por incumplimiento
- Monto o porcentaje del valor del inmueble
- **Limite legal (art. 1601 C.C.):** No puede exceder el doble de la obligacion principal (clausula penal enorme). El juez puede reducirla.
- **Practica comun:** 10% a 20% del valor del inmueble
- Acumulacion con indemnizacion de perjuicios: solo si se pacta expresamente (art. 1600 C.C.)

### 3.6 Fecha limite de escrituracion
- Debe ser una fecha cierta o determinable
- Debe indicar notaria designada o mecanismo para elegirla
- Plazo razonable para obtener documentos (certificado de libertad, paz y salvos, etc.)

### 3.7 Entrega material del inmueble
- Fecha de entrega (puede o no coincidir con escrituracion)
- Estado de entrega (desocupado, amoblado, con mejoras)
- Entrega anticipada: genera tenencia, NO posesion (jurisprudencia CSJ)
- Inventario de estado del inmueble

### 3.8 Condiciones suspensivas o resolutorias
**Condiciones suspensivas comunes:**
- Aprobacion de credito hipotecario
- Obtencion de licencia de construccion
- Levantamiento de gravamenes existentes
- Sucesion o proceso judicial previo

**Condicion resolutoria tacita (art. 1546 C.C.):**
- En todo contrato bilateral: si una parte no cumple, la otra puede pedir resolucion o cumplimiento + indemnizacion
- Restituciones mutuas si se resuelve

### 3.9 Estado de tradicion del inmueble
- Libre de gravamenes (hipotecas, embargos, demandas)
- Sin patrimonio de familia inembargable
- Sin afectacion a vivienda familiar
- Sin condiciones resolutorias inscritas
- Sin limitaciones al dominio
- Vendedor debe ser propietario registral

---

## 4. Clausulas Abusivas o Riesgosas Comunes

### 4.1 Plazo indefinido para escrituracion
- **Riesgo: ALTO** - Puede causar nulidad absoluta de la promesa (art. 1611 numeral 3)
- La jurisprudencia exige que la epoca de celebracion del contrato definitivo sea cierta y verificable
- Formulas como "cuando el vendedor lo disponga" o "cuando se complete el proyecto" sin fecha limite son nulas

### 4.2 Arras excesivas
- **Riesgo: MEDIO-ALTO**
- No hay tope legal explicito para arras, pero arras superiores al 30% del valor son desproporcionadas
- Si las arras son penitenciales, el retracto implicaria perder una suma elevada
- Puede configurarse clausula abusiva bajo Ley 1480/2011 si hay relacion de consumo

### 4.3 Clausula penal desproporcionada
- **Riesgo: ALTO**
- Clausula penal que exceda el doble de la obligacion principal es "enorme" y el juez la puede reducir (art. 1601 C.C.)
- En la practica, clausulas superiores al 30% del valor son cuestionables
- Si se acumula con arras confirmatorias penales: doble sancion

### 4.4 Vendedor no es propietario registral
- **Riesgo: CRITICO**
- Si quien vende no aparece como propietario en el certificado de tradicion y libertad, la compraventa seria venta de cosa ajena
- La venta de cosa ajena vale (art. 1871 C.C.) pero no transfiere dominio
- El comprador queda expuesto a eviccion
- Puede haber error esencial que vicia el consentimiento

### 4.5 No se exige certificado de libertad como condicion
- **Riesgo: ALTO**
- Sin verificar el certificado de tradicion y libertad, el comprador desconoce:
  - Si hay hipotecas vigentes
  - Si hay embargos
  - Si hay demandas inscritas
  - Si hay patrimonio de familia
  - Si hay afectacion a vivienda familiar
  - Si el vendedor es realmente el dueno

### 4.6 Renuncia a saneamiento por eviccion
- **Riesgo: ALTO**
- El art. 1895 permite pactar en contrario, pero renunciar al saneamiento deja al comprador indefenso
- Si hay relacion de consumo, puede ser clausula abusiva (art. 43 Ley 1480)
- El vendedor sigue obligado cuando la eviccion proviene de hecho suyo personal

### 4.7 No se pacta entrega material
- **Riesgo: MEDIO**
- Si no se establece fecha y condiciones de entrega, el comprador puede escriturar pero no recibir el inmueble
- La entrega anticipada sin estipulacion clara genera solo tenencia, no posesion
- Puede generar conflictos sobre el estado del inmueble

### 4.8 Condiciones resolutorias ambiguas
- **Riesgo: MEDIO-ALTO**
- Condiciones que dependen exclusivamente de la voluntad de una parte (potestativas) pueden ser invalidas
- Condiciones imposibles o ininteligibles se tienen por no escritas
- Clausulas tipo "el vendedor podra resolver si a su juicio el comprador incumple" son abusivas

### 4.9 Otras clausulas riesgosas
- **Cesion unilateral** de la promesa sin consentimiento de la contraparte
- **Indexacion excesiva** del precio por mora
- **Clausula de confidencialidad** que impida al comprador consultar abogado
- **Renuncia a reclamar perjuicios** adicionales a la clausula penal
- **Pago total anticipado** sin garantias de escrituracion
- **No se pactan paz y salvos** (administracion, servicios publicos, impuestos)
- **Poder irrevocable** otorgado al vendedor o intermediario para actuar en nombre del comprador

---

## 5. Campos a Extraer del Documento

### 5.1 Partes
| Campo | Descripcion |
|-------|-------------|
| nombre_comprador | Nombre completo |
| cc_nit_comprador | Cedula o NIT |
| estado_civil_comprador | Soltero, casado, union libre |
| domicilio_comprador | Ciudad de residencia |
| nombre_vendedor | Nombre completo |
| cc_nit_vendedor | Cedula o NIT |
| estado_civil_vendedor | Soltero, casado, union libre |
| domicilio_vendedor | Ciudad de residencia |
| representante_legal | Si aplica, nombre y poder |

### 5.2 Inmueble
| Campo | Descripcion |
|-------|-------------|
| direccion | Direccion completa |
| matricula_inmobiliaria | Numero de folio de matricula |
| cedula_catastral | Numero catastral |
| ciudad | Municipio |
| departamento | Departamento |
| tipo_inmueble | Apartamento, casa, lote, local, etc. |
| area | Metros cuadrados |
| linderos | Norte, sur, oriente, occidente |
| propiedad_horizontal | Si/No, torre, piso, coeficiente |

### 5.3 Condiciones economicas
| Campo | Descripcion |
|-------|-------------|
| precio_total | Valor total en pesos |
| forma_pago | Contado, cuotas, credito hipotecario |
| cuota_inicial | Monto de anticipo |
| saldo_financiar | Monto pendiente |
| entidad_financiera | Banco o entidad crediticia |
| arras_tipo | Penitenciales, confirmatorias, confirmatorias penales |
| arras_monto | Valor de las arras |
| clausula_penal_monto | Valor o porcentaje |
| clausula_penal_acumulable | Si se acumula con indemnizacion |

### 5.4 Plazos y condiciones
| Campo | Descripcion |
|-------|-------------|
| fecha_firma_promesa | Fecha de suscripcion |
| fecha_limite_escrituracion | Fecha maxima para escritura |
| notaria_designada | Notaria pactada |
| fecha_entrega_material | Fecha de entrega del inmueble |
| condiciones_suspensivas | Listado de condiciones |
| condiciones_resolutorias | Listado de condiciones |

### 5.5 Garantias y declaraciones
| Campo | Descripcion |
|-------|-------------|
| declaracion_libre_gravamenes | Si/No |
| certificado_libertad_exigido | Si/No |
| saneamiento_eviccion | Pactado/Renunciado |
| paz_y_salvos_exigidos | Listado (admin, servicios, impuestos) |
| estado_ocupacion | Desocupado, arrendado, ocupado |

---

## 6. Matriz de Riesgo

### 6.1 Riesgo CRITICO (promesa potencialmente invalida o peligrosa)
- No consta por escrito
- No tiene fecha o condicion para escrituracion (nulidad absoluta)
- El inmueble no esta identificado (sin matricula ni direccion)
- El vendedor no es propietario registral
- El inmueble tiene embargo o medida cautelar vigente
- El precio no esta determinado ni es determinable
- Alguna de las partes no tiene capacidad legal
- Objeto ilicito (inmueble fuera de comercio)
- Se paga mas del 50% sin garantias ni escritura

### 6.2 Riesgo ALTO (clausulas cuestionables que requieren atencion)
- Plazo de escrituracion vago o excesivamente largo (>12 meses sin justificacion)
- Clausula penal superior al 30% del valor
- Arras superiores al 20% del valor
- Renuncia a saneamiento por eviccion
- No se exige certificado de tradicion y libertad
- No se verifican gravamenes o limitaciones al dominio
- Condiciones resolutorias que dependen de una sola parte
- Poder irrevocable a favor de vendedor/intermediario

### 6.3 Riesgo MEDIO (aspectos mejorables)
- No se pacta entrega material ni fecha
- No se autenticaron firmas en notaria
- No se establecen paz y salvos como condicion
- No se pacta quien asume gastos notariales y de registro
- No se indica estado de ocupacion del inmueble
- Clausula penal entre 20-30% del valor
- Arras entre 10-20% sin especificar tipo
- No se incluye inventario del estado del inmueble

### 6.4 Riesgo BAJO (promesa bien estructurada)
- Cumple los 4 requisitos del art. 1611
- Partes plenamente identificadas con CC/NIT
- Inmueble identificado con matricula, direccion y linderos
- Precio cierto con forma de pago detallada
- Arras confirmatorias <= 10% del valor
- Clausula penal razonable (10-20%)
- Fecha de escrituracion determinada y razonable
- Notaria designada
- Se exige certificado de tradicion y libertad vigente
- Se pacta entrega material con fecha
- Se incluyen paz y salvos como condicion
- No hay renuncias a derechos esenciales

---

## 7. Jurisprudencia Relevante

### 7.1 Corte Suprema de Justicia - Sala de Casacion Civil

**SC2221-2020 (13 de julio de 2020) - Sentencia catedra**
- Magistrado ponente: Sala Civil
- Tema: Concepto, funcion y extincion de obligaciones de la promesa de compraventa
- Doctrina clave:
  - Los requisitos del art. 1611 son de validez, no de existencia
  - La identificacion del inmueble debe hacerse mediante ubicacion, linderos o cualquier dato que permita su cabal identificacion
  - El precio debe estar determinado o ser determinable al momento de celebrar la promesa
  - No es posible completar los requisitos del contrato durante etapas probatorias
  - Las restituciones mutuas proceden cuando se declara nulidad

**SC3666-2021 (25 de agosto de 2021)**
- Magistrado ponente: Alvaro Fernando Garcia Restrepo
- Tema: Resolucion de promesa de compraventa por reciproco y simultaneo incumplimiento
- Doctrina clave:
  - Cuando ambas partes incumplen reciproca y simultaneamente, procede la resolucion del contrato
  - Restituciones mutuas para que las cosas vuelvan a su estado anterior

**SC5765-2019**
- Tema: Requisitos de validez y efectos del contrato de promesa
- Reafirma que la promesa genera obligaciones de hacer (celebrar el contrato definitivo)

**Doctrina jurisprudencial consolidada sobre la promesa:**
- La promesa de contrato es un contrato autonomo y principal
- Su unica funcion esencial es la obligacion de hacer: celebrar el contrato prometido
- Es esencialmente temporal: cumplido su objeto, se extingue
- La entrega anticipada del inmueble al promitente comprador genera tenencia, NO posesion (salvo pacto expreso de transferencia de posesion)
- La promesa por si sola no genera posesion
- El promitente comprador que recibe el inmueble es tenedor, reconociendo dominio ajeno

### 7.2 Corte Constitucional

**T-1026-2003**
- Tema: Proteccion de derechos fundamentales en el contexto de promesas de compraventa
- Relevancia: Confirma que la via procesal para resolver conflictos de promesas de compraventa es la jurisdiccion ordinaria civil, salvo amenaza a derechos fundamentales

### 7.3 Compendio de la CSJ (octubre 2023)
La Corte Suprema publico el "Compendio del Contrato de Promesa" (octubre 2023) que consolida toda la linea jurisprudencial sobre:
- Naturaleza juridica de la promesa
- Requisitos de validez
- Nulidad por incumplimiento de requisitos
- Resolucion por incumplimiento
- Restituciones mutuas
- Arras y clausula penal
- Entrega anticipada y tenencia vs. posesion

Fuente: https://cortesuprema.gov.co/corte/wp-content/uploads/2023/10/COMPENDIO-CONTRATO-DE-PROMESA-30-10-2023.pdf

---

## 8. Allowlist de Articulos Aplicables

### Codigo Civil Colombiano
| Articulo | Tema |
|----------|------|
| 1502 | Requisitos de validez de los contratos |
| 1508-1512 | Vicios del consentimiento (error, fuerza, dolo) |
| 1517-1523 | Objeto licito |
| 1524 | Causa licita |
| 1546 | Condicion resolutoria tacita en contratos bilaterales |
| 1592 | Clausula penal - definicion |
| 1593 | Clausula penal - antes y despues de mora |
| 1594 | Clausula penal - exigibilidad con obligacion principal |
| 1596 | Clausula penal - cumplimiento parcial |
| 1599 | Clausula penal - no extingue obligacion principal |
| 1600 | Clausula penal - acumulacion con indemnizacion |
| 1601 | Clausula penal enorme - limite legal |
| 1602 | Los contratos son ley para las partes |
| 1603 | Buena fe contractual |
| 1604 | Responsabilidad del deudor |
| 1611 | Promesa de celebrar un contrato - requisitos de validez |
| 1740-1756 | Nulidad y rescision de los contratos |
| 1849 | Definicion de compraventa |
| 1857 | Perfeccionamiento de la venta de inmuebles (escritura publica) |
| 1859 | Arras de retracto (penitenciales) |
| 1860 | Plazo para retractarse |
| 1861 | Arras confirmatorias |
| 1862 | Gastos de la compraventa |
| 1871 | Venta de cosa ajena |
| 1893 | Obligacion de saneamiento |
| 1895 | Saneamiento por eviccion |
| 1899 | Citacion al vendedor en demanda por eviccion |
| 1904 | Contenido del saneamiento |
| 1913 | Prescripcion de la accion de saneamiento |
| 1914-1927 | Vicios redhibitorios |
| 756 | Tradicion de inmuebles requiere registro |

### Ley 1579 de 2012 - Estatuto de Registro de Instrumentos Publicos
| Articulo | Tema |
|----------|------|
| 2 | Objetivos del registro |
| 4 | Principio de peticion |
| 5 | Principio de especialidad |
| 6 | Principio de legalidad |
| 7 | Principio de tracto sucesivo |
| 8 | Principio de prioridad |
| 16 | Actos sujetos a registro |
| 54 | Certificado de tradicion y libertad |
| 59 | Matricula inmobiliaria |

### Decreto 960 de 1970 - Estatuto del Notariado
| Articulo | Tema |
|----------|------|
| 3 | Funcion notarial |
| 12 | Escritura publica - definicion |
| 13 | Requisitos esenciales de la escritura publica |
| 14 | Datos de los comparecientes |
| 22 | Lectura y aprobacion |
| 23 | Firma de los otorgantes |
| 24 | Comprobantes fiscales |
| 52-55 | Nulidad de escrituras |

### Ley 1480 de 2011 - Estatuto del Consumidor
| Articulo | Tema |
|----------|------|
| 5 | Definiciones (consumidor, productor, relacion de consumo) |
| 42 | Clausulas abusivas - definicion y efectos |
| 43 | Clausulas ineficaces de pleno derecho |
| 44 | Clausulas abusivas en contratos de adhesion |

### Codigo General del Proceso (Ley 1564 de 2012)
| Articulo | Tema |
|----------|------|
| 422 | Titulo ejecutivo - promesa de contrato como titulo |

### Otras normas relevantes
| Norma | Tema |
|-------|------|
| Ley 258 de 1996 | Afectacion a vivienda familiar |
| Ley 861 de 2003 | Patrimonio de familia inembargable |
| Ley 1183 de 2008 | Declaracion de posesion regular ante notario |
| Ley 2079 de 2021 | Ley de vivienda y habitat |

---

## 9. Checklist de Analisis para el Prompt de IA

Al analizar una promesa de compraventa, verificar en este orden:

### Paso 1: Validez formal
- [ ] Consta por escrito
- [ ] Partes identificadas con nombre y CC/NIT
- [ ] Inmueble determinado (direccion + matricula o linderos)
- [ ] Precio determinado o determinable
- [ ] Fecha o condicion para escrituracion
- [ ] No hay objeto o causa ilicita

### Paso 2: Elementos economicos
- [ ] Tipo de arras especificado (penitenciales, confirmatorias, confirmatorias penales)
- [ ] Monto de arras (evaluar si es razonable, ref: 10%)
- [ ] Clausula penal (evaluar si es proporcional, ref: 10-20%)
- [ ] Forma de pago detallada
- [ ] Se imputan arras al precio final

### Paso 3: Protecciones del comprador
- [ ] Se exige certificado de tradicion y libertad vigente
- [ ] Se declara inmueble libre de gravamenes
- [ ] No hay renuncia a saneamiento por eviccion
- [ ] Se pacta entrega material con fecha
- [ ] Se exigen paz y salvos (administracion, servicios, impuestos)
- [ ] Se establece quien asume gastos notariales y de registro

### Paso 4: Protecciones del vendedor
- [ ] Clausula penal por incumplimiento del comprador
- [ ] Plazo para acreditar financiamiento
- [ ] Condicion resolutoria si no se aprueba credito

### Paso 5: Clausulas riesgosas
- [ ] Verificar que no haya plazo indefinido
- [ ] Verificar que clausula penal no sea enorme (>doble de obligacion)
- [ ] Verificar que no haya poder irrevocable a terceros
- [ ] Verificar que condiciones no sean puramente potestativas
- [ ] Verificar que no haya renuncia a derechos esenciales
- [ ] Verificar proporcionalidad de arras si son de retracto

---

## Fuentes de Investigacion

- [Art. 1611 Codigo Civil - leyes.co](https://leyes.co/codigo_civil/1611.htm)
- [Compendio Contrato de Promesa - CSJ Oct 2023](https://cortesuprema.gov.co/corte/wp-content/uploads/2023/10/COMPENDIO-CONTRATO-DE-PROMESA-30-10-2023.pdf)
- [SC2221-2020 - CSJ](https://www.cortesuprema.gov.co/corte/wp-content/uploads/2020/07/SC2221-2020-2.pdf)
- [SC2221-2020 Analisis - GMH Abogados](https://gmhabogados.com.co/sc2221-2020/)
- [SC3666-2021 - CSJ](https://cortesuprema.gov.co/corte/index.php/2021/09/29/jurisprudencia-al-dia-contrato-de-promesa-de-compraventa-resolucion-del-contrato-por-reciproco-y-simultaneo-incumplimiento-sala-de-casacion-civil-sc3666-2021/)
- [Promesa de compraventa - Bancolombia](https://blog.bancolombia.com/actualidad/promesa-de-compraventa-inmueble-colombia-guia-legal/)
- [Promesa de compraventa - MinJusticia LegalApp](https://www.minjusticia.gov.co/programas-co/LegalApp/Paginas/Como-realizar-una-promesa-de-compraventa.aspx)
- [Arras en Colombia - Conceptos Juridicos](https://www.conceptosjuridicos.com/co/contrato-de-arras/)
- [Arras confirmatorias - Conceptos Juridicos](https://www.conceptosjuridicos.com/co/arras-confirmatorias/)
- [Arras en promesa de venta - NotiNet Legal](https://www.notinetlegal.com/las-arras-en-los-contratos-de-promesa-de-venta-de-inmuebles-834.html)
- [Clausulas abusivas - UrbanLaw](https://www.urbanlaw.com.co/blog/clausulas-abusivas-compraventa-vivienda-colombia/)
- [Clausula penal promesa - Epica Inmobiliaria](https://epicainmobiliaria.com/clausula-penal-contrato-promesa-compraventa/)
- [Art. 1601 Clausula penal enorme - leyes.co](https://leyes.co/codigo_civil/1601.htm)
- [Saneamiento por eviccion - Gerencie](https://www.gerencie.com/que-es-saneamiento-por-eviccion-y-en-que-caso-se-da.html)
- [Promesa sin fecha fija - Salazar Galan](https://www.salazargalan.com/promesa-de-compraventa-sin-fecha-fija-en-colombia/)
- [Ley 1579 de 2012 - Secretaria del Senado](http://www.secretariasenado.gov.co/senado/basedoc/ley_1579_2012.html)
- [Decreto 960 de 1970 - Funcion Publica](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=149249)
- [Ley 1480 de 2011 - Secretaria del Senado](http://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html)
- [Codigo Civil - Compraventa - Secretaria del Senado](http://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr057.html)
- [Codigo Civil - Saneamiento - Secretaria del Senado](http://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr058.html)
- [Certificado de tradicion y libertad - SNR](https://certificados.supernotariado.gov.co/certificado)
- [Art. 1857 Codigo Civil - Conceptos Juridicos](https://www.conceptosjuridicos.com/co/codigo-civil-articulo-1857/)
- [Contrato de promesa de compraventa - Gerencie](https://www.gerencie.com/promesa-de-compraventa.html)
- [La Promesa de Compraventa - GMH Abogados](https://gmhabogados.com.co/promesa-de-compraventa/)
- [Requisitos promesa - Notaria 19 Bogota](https://www.notaria19bogota.com/requisitos-de-la-promesa-de-compraventa/)
- [Clausula penal - Notaria 19 Bogota](https://www.notaria19bogota.com/la-clausula-penal/)
- [Garantias y consumidor inmobiliario - SciELO](http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0121-182X2022000100065)
