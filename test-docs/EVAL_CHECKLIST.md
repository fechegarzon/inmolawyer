# Eval Checklist - Documentos de Prueba InmoLawyer

Cada tabla indica las condiciones plantadas intencionalmente en los documentos riesgosos, y lo que el analisis de IA DEBE detectar.

---

## arriendo-comercial-riesgoso.txt

**Score esperado:** >= 70 (riesgo alto)

| # | Condicion plantada | Alerta esperada | Tipo | Referencia legal esperada |
|---|-------------------|-----------------|------|--------------------------|
| 1 | Clausula 7: renuncia explicita al derecho de renovacion del Art. 518 C.Co. | Clausula INEFICAZ por violar norma imperativa. Indica mala fe del arrendador. | danger | Art. 518 y Art. 524 C.Comercio |
| 2 | Clausula 8: preaviso de solo 30 dias (renuncia al desahucio de 6 meses del Art. 520) | Plazo de desahucio insuficiente. La renuncia es INEFICAZ. Sin preaviso de 6 meses, el contrato se renueva automaticamente. | danger | Art. 520 y Art. 524 C.Comercio |
| 3 | Clausula 9: clausula penal de 5 canones ($17.500.000) acumulable con indemnizacion | Clausula penal desproporcionada. 5 canones es excesivo. El juez puede reducirla (Art. 867 C.Co.). | warning | Art. 867 C.Comercio |
| 4 | Clausula 5: incremento fijo del 15% anual, independiente del IPC | Legal en arriendo comercial pero gravoso. IPC 2024 fue ~5.2%, esto es casi 3x el IPC. Riesgo medio-alto por posible abuso del derecho. | warning | Art. 830 y Art. 871 C.Comercio (buena fe, abuso del derecho) |
| 5 | Clausula 10: prohibicion total de subarriendo (incluido parcial) Y prohibicion de cesion incluso al enajenar establecimiento | Prohibir subarriendo parcial (hasta 50%) contradice Art. 523. Prohibir cesion al vender establecimiento viola Art. 523 y es INEFICAZ (Art. 524). | danger | Art. 523 y Art. 524 C.Comercio |
| 6 | Clausula 12: todas las mejoras (necesarias, utiles, voluptuarias) quedan para el arrendador sin compensacion | Las mejoras necesarias son legalmente de cargo del arrendador. Clausula gravosa. | warning | Art. 1993 y 1994 C.Civil (supletorio) |

### Alertas adicionales que podria detectar (no obligatorias):
- Deposito de 2 canones: riesgo bajo (practica comun en comercial)
- Destinacion exclusiva muy restrictiva ("restaurante de comida del Pacifico"): riesgo bajo-medio

---

## arriendo-comercial-limpio.txt

**Score esperado:** < 25 (riesgo bajo)

| Aspecto | Resultado esperado |
|---------|-------------------|
| Alertas danger | Ninguna |
| Alertas warning | Ninguna o maximo 1 menor |
| Renovacion | Reconoce derecho de renovacion Art. 518 - OK |
| Desahucio | 6 meses conforme Art. 520 - OK |
| Clausula penal | 2 canones, reciproca - razonable |
| Incremento | IPC + 1 punto - razonable |
| Subarriendo | Permite parcial hasta 50%, cesion al vender establecimiento - conforme Art. 523 |
| Mejoras | Distingue necesarias (arrendador), utiles (retirables), voluptuarias - OK |
| Deposito | 1 canon con condiciones de devolucion - OK |

---

## promesa-compraventa-riesgosa.txt

**Score esperado:** >= 75 (riesgo alto/critico)

| # | Condicion plantada | Alerta esperada | Tipo | Referencia legal esperada |
|---|-------------------|-----------------|------|--------------------------|
| 1 | Clausula 4: no hay fecha limite de escrituracion ("cuando se reunan los documentos", sin fecha cierta) | Posible NULIDAD ABSOLUTA de la promesa. El Art. 1611 numeral 3 exige plazo o condicion que fije la EPOCA de celebracion del contrato. Una formula indeterminada no cumple este requisito. | danger | Art. 1611 numeral 3 C.Civil |
| 2 | Clausula 2a: arras del 30% del valor ($114.000.000 sobre $380.000.000) | Arras desproporcionadas. La practica comercial establece 10% como referencia. 30% es excesivo y coloca al comprador en riesgo significativo. | warning | Practica comercial; Art. 1859 y 1861 C.Civil |
| 3 | Clausula 5: clausula penal de $230.000.000 (60.5% del precio) | Clausula penal ENORME. Excede el doble de las arras ($228M). El Art. 1601 permite reduccion. Ademas, es acumulable con cumplimiento, lo cual potencia el desequilibrio. | danger | Art. 1601 C.Civil |
| 4 | No se exige certificado de libertad como condicion previa a escrituracion | Riesgo alto. Sin verificar certificado de tradicion, el comprador desconoce gravamenes, embargos, hipotecas, falsa tradicion, patrimonio de familia. | danger | Art. 54 Ley 1579/2012; buena practica legal |
| 5 | Clausula 6a: vendedor se declara "poseedor" (no propietario) | Vendedor podria no ser propietario registral. La declaracion de "poseedor" sugiere que no tiene titulo de dominio pleno. Riesgo de venta de cosa ajena (Art. 1871 C.Civil). | danger | Art. 1871 C.Civil; Art. 1893-1895 C.Civil |
| 6 | Clausula 7: renuncia expresa al saneamiento por eviccion | Deja al comprador indefenso si un tercero reclama derechos sobre el inmueble. Riesgo alto combinado con que el vendedor se declara solo "poseedor". | danger | Art. 1895 C.Civil; Art. 43 Ley 1480/2011 (si aplica) |

### Alertas adicionales que podria detectar (no obligatorias):
- Clausula 10: cesion asimetrica (vendedor puede ceder, compradora no) - desequilibrio contractual
- No se pactan paz y salvos como condicion
- No se incluyen linderos del inmueble (solo direccion y matricula)
- Compradora es casada pero no comparece su conyuge

---

## promesa-compraventa-limpia.txt

**Score esperado:** < 20 (riesgo bajo)

| Aspecto | Resultado esperado |
|---------|-------------------|
| Alertas danger | Ninguna |
| Alertas warning | Ninguna |
| Requisitos Art. 1611 | Cumple los 4: escrito, contrato valido, fecha cierta (30 junio 2025), determinado |
| Arras | Confirmatorias, 10% ($52M) - razonable |
| Clausula penal | 15% ($78M), reciproca - razonable, no excede doble de arras |
| Certificado de libertad | Exigido como condicion suspensiva - OK |
| Saneamiento | Pactado expresamente - OK |
| Entrega material | Con fecha y acta - OK |
| Paz y salvos | Exigidos (predial, servicios, administracion, valorizacion) - OK |
| Conyuge | Comparece la conyuge del comprador - OK |
| Notaria | Designada (Notaria Cuarta de Cali) - OK |

---

## certificado-libertad-riesgoso.txt

**Score esperado:** >= 90 (riesgo muy alto - NO COMPRAR)

| # | Condicion plantada | Alerta esperada | Tipo | Referencia legal esperada | Puntos scoring |
|---|-------------------|-----------------|------|--------------------------|----------------|
| 1 | Anotacion 007: hipoteca vigente a favor de Bancolombia por $200M (sin cancelacion) | Gravamen vigente. Hipoteca abierta sin limite de cuantia por credito de libre inversion. No se puede escriturar sin cancelar o subrogar. | warning | Art. 2432-2457 C.Civil; Ley 1579/2012 | +10 |
| 2 | Anotacion 008: embargo vigente por Juzgado 15 Civil Municipal de Bogota | IMPIDE LEGALMENTE LA ENAJENACION. Embargo dentro de proceso ejecutivo hipotecario. La ORIP rechazara la escritura de compraventa. | danger | Art. 1521 C.Civil (objeto ilicito en venta de cosa embargada); CGP Art. 590 | +30 |
| 3 | Anotacion 004: falsa tradicion (transferencia de derechos y acciones) en la cadena | Cadena de dominio ROTA. En 2007 se inscribio transferencia de derechos y acciones (Grupo 06), no compraventa de dominio pleno. Toda la cadena posterior esta viciada. | danger | Art. 8 par. 2 Ley 1579/2012; Art. 762 C.Civil | +40 |
| 4 | Anotacion 006: patrimonio de familia inembargable vigente (con hijos menores) | Limitacion vigente. Requiere levantamiento por juez de familia (hay menores beneficiarios). Sin levantar, la venta es ANULABLE. | danger | Ley 70/1931; Ley 258/1996 | +25 |
| 5 | Combinacion embargo + hipoteca: proceso ejecutivo activo | El inmueble esta siendo ejecutado judicialmente por Bancolombia. Esto indica que el propietario no esta pagando la hipoteca y el banco esta cobrando judicialmente. | danger | CGP Art. 599 (remate) | (ya contado) |

### Score total esperado (por tabla de penalizacion):
- Falsa tradicion vigente: +40
- Embargo vigente: +30
- Patrimonio de familia con menores: +25
- Hipoteca vigente: +10
- **Total: 105 -> cap a 100**

### Resumen de situacion juridica esperado:
El analisis debe concluir que este inmueble es **NO APTO PARA COMPRA** por:
1. Cadena de dominio rota por falsa tradicion
2. Embargo vigente que impide enajenacion
3. Patrimonio de familia con menores que requiere juez de familia
4. Proceso ejecutivo hipotecario activo

---

## certificado-libertad-limpio.txt

**Score esperado:** < 10 (riesgo muy bajo)

| Aspecto | Resultado esperado |
|---------|-------------------|
| Alertas danger | Ninguna |
| Alertas warning | Ninguna |
| Tradicion | Limpia: 3 compraventas (constructora -> Ospina -> Mesa -> Ruiz Pardo) |
| Falsa tradicion | Ninguna anotacion Grupo 06 |
| Gravamenes | 2 hipotecas, ambas CANCELADAS (Anot. 002 cancelada por 003; Anot. 005 cancelada por 006) |
| Embargos | Ninguno |
| Limitaciones | Ninguna |
| Medidas cautelares | Ninguna |
| Propietario actual | CAROLINA ANDREA RUIZ PARDO - C.C. 52.678.901 - 100% dominio |
| Certificado | Expedido hace < 30 dias (10 marzo 2025) - vigente |
| Folio | ACTIVO |

---

## Notas de uso

### Como usar este checklist:
1. Pasar cada documento riesgoso por el prompt de analisis de InmoLawyer
2. Comparar las alertas detectadas contra la columna "Alerta esperada"
3. Verificar que el tipo (danger/warning/info) coincida
4. Verificar que la referencia legal citada sea correcta
5. Para los documentos limpios, verificar que NO se generen falsos positivos de tipo danger

### Metricas de evaluacion:
- **Recall (sensibilidad):** % de condiciones plantadas que fueron detectadas. Target: >= 90%
- **Precision:** % de alertas generadas que son verdaderos positivos. Target: >= 85%
- **Falsos negativos criticos:** Condiciones danger no detectadas. Target: 0
- **Falsos positivos criticos:** Alertas danger en documentos limpios. Target: 0
