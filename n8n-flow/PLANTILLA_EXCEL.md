# Plantilla Excel para Sistema de Facturas - InmoLawyer

> Este documento describe la estructura exacta del archivo Excel que debe crearse en OneDrive para que el flujo de n8n funcione correctamente con el sistema de gestion de facturas de InmoLawyer.

---

## Nombre del archivo

**`InmoLawyer_Facturas.xlsx`**

Ubicacion recomendada en OneDrive:
```
OneDrive > InmoLawyer > Facturas > InmoLawyer_Facturas.xlsx
```

---

## Hoja 1: "Registro de Facturas"

Esta es la hoja principal donde se almacenan todas las facturas. Debe configurarse como una **Tabla de Excel** con el nombre `TablaFacturas`.

### Estructura de columnas

| Columna | Nombre | Tipo de dato | Formato | Ejemplo | Descripcion |
|---------|--------|--------------|---------|---------|-------------|
| A | N. Factura | Texto | General | `FV-2025-001234` | Numero unico de factura del proveedor |
| B | Proveedor | Texto | General | `Servicios Generales SAS` | Razon social del proveedor |
| C | NIT Proveedor | Texto | General | `900.123.456-7` | NIT con digito de verificacion |
| D | Monto Total | Moneda (COP) | `$ #,##0` | `$3,500,000` | Valor total con IVA incluido |
| E | Subtotal | Moneda (COP) | `$ #,##0` | `$2,941,176` | Valor antes de IVA |
| F | IVA | Moneda (COP) | `$ #,##0` | `$558,824` | Valor del IVA (19%) |
| G | Fecha Emision | Fecha | `AAAA-MM-DD` | `2026-01-15` | Fecha en que se emitio la factura |
| H | Fecha Vencimiento | Fecha | `AAAA-MM-DD` | `2026-02-15` | Fecha limite de pago |
| I | Concepto | Texto | General | `Servicio de aseo mensual` | Descripcion del servicio o producto |
| J | Moneda | Texto | General | `COP` | Siempre COP para pesos colombianos |
| K | Estado | Texto | General | `Pendiente` | Valores: `Pendiente`, `Pagada`, `Vencida` |
| L | Fecha Registro | Fecha/Hora | `AAAA-MM-DDTHH:MM:SS` | `2026-01-15T10:30:00` | Timestamp automatico de cuando se registro |
| M | Fecha Pago | Fecha | `AAAA-MM-DD` | `2026-01-28` | Fecha real de pago (vacio si no se ha pagado) |
| N | Mes | Texto | `AAAA-MM` | `2026-01` | Periodo mensual para agrupacion y reportes |

### Proveedores registrados

Estos son los 5 proveedores configurados en el sistema:

| # | Proveedor | NIT | Tipo de servicio | Rango tipico de facturacion |
|---|-----------|-----|------------------|-----------------------------|
| 1 | Servicios Generales SAS | 900.123.456-7 | Aseo y mantenimiento | $2,000,000 - $4,000,000 COP |
| 2 | Inmobiliaria del Norte LTDA | 800.234.567-8 | Administracion inmobiliaria | $5,000,000 - $8,000,000 COP |
| 3 | Constructora Andina SA | 900.345.678-9 | Materiales de construccion | $10,000,000 - $20,000,000 COP |
| 4 | Seguros Bolivar | 860.456.789-0 | Polizas de seguros | $3,000,000 - $5,000,000 COP |
| 5 | Administraciones Urbanas SAS | 900.567.890-1 | Administracion urbana | $1,000,000 - $3,000,000 COP |

### Notas sobre la Hoja 1

- La columna **K (Estado)** admite tres valores: `Pendiente`, `Pagada` o `Vencida`. El workflow asigna `Pendiente` automaticamente al registrar una nueva factura. El estado `Vencida` se asigna cuando la fecha de vencimiento ha pasado sin registro de pago.
- La columna **L (Fecha Registro)** se completa automaticamente con la fecha y hora del servidor de n8n al momento de la insercion.
- La columna **N (Mes)** se calcula automaticamente a partir de la Fecha Emision en formato `AAAA-MM` para facilitar el filtrado mensual en el Dashboard.
- Las columnas de moneda deben estar formateadas como **Moneda** con simbolo `$`, separador de miles con punto y sin decimales (formato colombiano).

### Datos de ejemplo (primera fila)

```
A: FV-2026-001235
B: Servicios Generales SAS
C: 900.123.456-7
D: $3,500,000
E: $2,941,176
F: $558,824
G: 2026-01-15
H: 2026-02-15
I: Servicio de aseo mensual - Edificio Central
J: COP
K: Pendiente
L: 2026-01-15T10:30:00
M: (vacio)
N: 2026-01
```

---

## Hoja 2: "Dashboard"

Esta hoja contiene las metricas consolidadas que se calculan automaticamente a partir de los datos de la Hoja 1. El flujo de n8n actualiza estas celdas periodicamente.

### Estructura del layout

```
Fila 1-2: TITULO
    A1: "DASHBOARD DE FACTURAS - INMOLAWYER"
    A2: "Generado automaticamente por n8n"

Fila 3: ENCABEZADOS DE PERIODO
    A3: "Metrica"
    B3: "Mes Actual"
    C3: "Mes Anterior"
    D3: "Hace 2 Meses"

Fila 4: TOTAL FACTURADO
    A4: "Total Facturado"
    B4: (suma de montos del mes actual)
    C4: (suma de montos del mes anterior)
    D4: (suma de montos de hace 2 meses)

Fila 5: CANTIDAD DE FACTURAS
    A5: "Cantidad Facturas"
    B5: (conteo del mes actual)
    C5: (conteo del mes anterior)
    D5: (conteo de hace 2 meses)

Fila 6: PROMEDIO POR FACTURA
    A6: "Promedio por Factura"
    B6: =B4/B5
    C6: =C4/C5
    D6: =D4/D5

Fila 7: (vacia - separador)

Fila 8: ENCABEZADO SECCION PROVEEDORES
    A8: "DESGLOSE POR PROVEEDOR"

Fila 9: Servicios Generales SAS
    A9: "Servicios Generales SAS"
    B9: (total mes actual)
    C9: (total mes anterior)
    D9: (total hace 2 meses)

Fila 10: Inmobiliaria del Norte LTDA
    A10: "Inmobiliaria del Norte LTDA"
    B10: (total mes actual)
    C10: (total mes anterior)
    D10: (total hace 2 meses)

Fila 11: Constructora Andina SA
    A11: "Constructora Andina SA"
    B11: (total mes actual)
    C11: (total mes anterior)
    D11: (total hace 2 meses)

Fila 12: Seguros Bolivar
    A12: "Seguros Bolivar"
    B12: (total mes actual)
    C12: (total mes anterior)
    D12: (total hace 2 meses)

Fila 13: Administraciones Urbanas SAS
    A13: "Administraciones Urbanas SAS"
    B13: (total mes actual)
    C13: (total mes anterior)
    D13: (total hace 2 meses)

Fila 14: (vacia - separador)

Fila 15: ENCABEZADO SECCION ESTADO
    A15: "ESTADO DE FACTURAS"

Fila 16: Pagadas
    A16: "Pagadas"
    B16: (cantidad pagadas mes actual)
    C16: (cantidad pagadas mes anterior)
    D16: (cantidad pagadas hace 2 meses)

Fila 17: Pendientes
    A17: "Pendientes"
    B17: (cantidad pendientes mes actual)
    C17: (cantidad pendientes mes anterior)
    D17: (cantidad pendientes hace 2 meses)

Fila 18: % Cumplimiento
    A18: "% Cumplimiento de Pago"
    B18: =B16/(B16+B17)*100
    C18: =C16/(C16+C17)*100
    D18: =D16/(D16+D17)*100
```

### Formatos recomendados para la Hoja Dashboard

- **Filas 1-2**: Fuente grande (16pt), negrita, color de fondo azul oscuro (#1a237e), texto blanco
- **Fila 3**: Fuente mediana (12pt), negrita, fondo gris claro
- **Filas 4-6**: Formato moneda para B4:D4, formato numero para B5:D5, formato moneda para B6:D6
- **Fila 8, 15**: Negrita, fondo azul claro
- **Filas 9-13**: Formato moneda
- **Filas 16-17**: Formato numero entero
- **Fila 18**: Formato porcentaje con 1 decimal

---

## Hoja 3: "Configuracion"

Esta hoja almacena parametros de configuracion que n8n lee para su funcionamiento.

### Estructura

```
Fila 1: TITULO
    A1: "CONFIGURACION DEL SISTEMA"

Fila 2: (vacia)

Fila 3: SECCION CORREOS DE PROVEEDORES
    A3: "CORREOS DE PROVEEDORES"

Fila 4: Encabezados
    A4: "Proveedor"
    B4: "Correo electronico"
    C4: "Contacto"

Fila 5:
    A5: "Servicios Generales SAS"
    B5: (correo del proveedor - por llenar)
    C5: (nombre contacto - por llenar)

Fila 6:
    A6: "Inmobiliaria del Norte LTDA"
    B6: (correo del proveedor - por llenar)
    C6: (nombre contacto - por llenar)

Fila 7:
    A7: "Constructora Andina SA"
    B7: (correo del proveedor - por llenar)
    C7: (nombre contacto - por llenar)

Fila 8:
    A8: "Seguros Bolivar"
    B8: (correo del proveedor - por llenar)
    C8: (nombre contacto - por llenar)

Fila 9:
    A9: "Administraciones Urbanas SAS"
    B9: (correo del proveedor - por llenar)
    C9: (nombre contacto - por llenar)

Fila 10: (vacia)

Fila 11: SECCION RUTAS
    A11: "CONFIGURACION DE RUTAS"

Fila 12:
    A12: "Ruta carpeta SharePoint"
    B12: "/sites/InmoLawyer/Documentos compartidos/Facturas"

Fila 13:
    A13: "Ruta carpeta OneDrive"
    B13: "/InmoLawyer/Facturas/"

Fila 14: (vacia)

Fila 15: SECCION NOTIFICACIONES
    A15: "CORREOS DE NOTIFICACION"

Fila 16:
    A16: "Administrador principal"
    B16: (correo del administrador - por llenar)

Fila 17:
    A17: "Copia contabilidad"
    B17: (correo de contabilidad - por llenar)

Fila 18:
    A18: "Copia gerencia"
    B18: (correo de gerencia - por llenar)
```

---

## Instrucciones paso a paso

### Paso 1: Crear el archivo Excel en OneDrive

1. Abra su navegador e ingrese a [OneDrive](https://onedrive.live.com) o a [Office 365](https://www.office.com)
2. Inicie sesion con su cuenta de Microsoft 365
3. Navegue a la carpeta donde desea guardar el archivo (recomendado: `InmoLawyer > Facturas`)
4. Si la carpeta no existe, creela:
   - Haga clic en **"+ Nuevo"** > **"Carpeta"**
   - Nombre: `InmoLawyer`
   - Dentro de ella, cree otra carpeta llamada `Facturas`
5. Dentro de la carpeta `Facturas`, haga clic en **"+ Nuevo"** > **"Libro de Excel"**
6. Nombre el archivo: **`InmoLawyer_Facturas`**

### Paso 2: Crear las hojas

1. Al abrir el libro nuevo, vera la hoja "Hoja1"
2. Haga doble clic en la pestana "Hoja1" y renombrela a **`Registro de Facturas`**
3. Haga clic en el icono **"+"** junto a la pestana para crear una nueva hoja
4. Renombrela a **`Dashboard`**
5. Cree una tercera hoja y renombrela a **`Configuracion`**
6. Elimine cualquier hoja adicional que Excel cree por defecto

### Paso 3: Configurar los encabezados de "Registro de Facturas"

1. En la hoja **"Registro de Facturas"**, escriba los siguientes encabezados en la **Fila 1**:

| Celda | Valor |
|-------|-------|
| A1 | N. Factura |
| B1 | Proveedor |
| C1 | NIT Proveedor |
| D1 | Monto Total |
| E1 | Subtotal |
| F1 | IVA |
| G1 | Fecha Emision |
| H1 | Fecha Vencimiento |
| I1 | Concepto |
| J1 | Moneda |
| K1 | Estado |
| L1 | Fecha Registro |
| M1 | Fecha Pago |
| N1 | Mes |

2. Formatee las columnas:
   - **Columnas D, E, F**: Seleccione toda la columna > Formato de celda > Moneda > Simbolo `$` > 0 decimales
   - **Columnas G, H, M**: Seleccione toda la columna > Formato de celda > Fecha > `AAAA-MM-DD`
   - **Columna L**: Formato personalizado: `AAAA-MM-DD HH:MM:SS`

### Paso 4: Crear la Tabla de Excel "TablaFacturas"

**Este paso es CRITICO para que n8n pueda leer y escribir datos correctamente.**

1. Seleccione el rango de encabezados: **A1:N1**
2. Vaya a la pestana **"Insertar"** en la cinta de opciones
3. Haga clic en **"Tabla"**
4. En el cuadro de dialogo:
   - Verifique que el rango sea `=$A$1:$N$1`
   - Marque la casilla **"La tabla tiene encabezados"**
   - Haga clic en **"Aceptar"**
5. La tabla se creara con el nombre predeterminado "Tabla1"
6. Para renombrarla:
   - Haga clic en cualquier celda dentro de la tabla
   - Vaya a la pestana **"Diseno de tabla"** (aparece al seleccionar la tabla)
   - En el campo **"Nombre de la tabla"** (esquina superior izquierda), cambie el nombre a: **`TablaFacturas`**
   - Presione **Enter** para confirmar

> **IMPORTANTE**: El nombre debe ser exactamente `TablaFacturas` (sin espacios, respetando mayusculas). El nodo de Microsoft Excel en n8n buscara este nombre especifico.

### Paso 5: Configurar la hoja "Dashboard"

1. Vaya a la hoja **"Dashboard"**
2. Escriba los encabezados y etiquetas segun la estructura descrita en la seccion "Hoja 2" de este documento
3. Aplique los formatos de celda recomendados (colores, fuentes, formatos de moneda)
4. Los valores numericos seran actualizados automaticamente por n8n en cada ejecucion del workflow

### Paso 6: Configurar la hoja "Configuracion"

1. Vaya a la hoja **"Configuracion"**
2. Escriba la estructura segun la seccion "Hoja 3" de este documento
3. **Complete los campos marcados como "por llenar"**:
   - Correos electronicos de cada proveedor
   - Nombre de contacto de cada proveedor
   - Correo del administrador principal
   - Correo de contabilidad
   - Correo de gerencia
4. Verifique que las rutas de SharePoint/OneDrive sean correctas para su organizacion

### Paso 7: Compartir el libro para acceso de n8n

Para que n8n pueda acceder al archivo Excel, debe asegurarse de que las credenciales de Microsoft 365 configuradas en n8n tengan los permisos adecuados.

#### Opcion A: Usando cuenta de servicio (recomendado)

1. En OneDrive, haga clic derecho sobre el archivo `InmoLawyer_Facturas.xlsx`
2. Seleccione **"Compartir"**
3. Haga clic en **"Personas especificas"**
4. Escriba el correo de la cuenta de servicio usada por n8n
5. Seleccione permisos de **"Puede editar"**
6. Haga clic en **"Enviar"**

#### Opcion B: Usando su propia cuenta

Si configuro n8n con su propia cuenta de Microsoft 365 (via OAuth2), el archivo ya sera accesible automaticamente siempre que este en su OneDrive.

### Paso 8: Verificar la conexion desde n8n

1. En n8n, abra el nodo **"Microsoft Excel 365"**
2. En la configuracion del nodo:
   - **Operacion**: "Get Rows" (para lectura) o "Append Row" (para escritura)
   - **Workbook**: Busque y seleccione `InmoLawyer_Facturas`
   - **Worksheet**: Seleccione `Registro de Facturas`
   - **Table**: Debe aparecer `TablaFacturas`
3. Ejecute una prueba para verificar que la conexion funciona
4. Si no aparece la tabla, verifique:
   - Que el nombre de la tabla sea exactamente `TablaFacturas`
   - Que las credenciales de Microsoft 365 esten correctamente configuradas
   - Que el archivo este guardado (no en modo borrador)

---

## Formulas utiles para la hoja Dashboard

Si desea que el Dashboard se calcule automaticamente con formulas de Excel (ademas de la actualizacion por n8n), puede usar las siguientes:

### Total facturado del mes actual
```excel
=SUMAR.SI(TablaFacturas[Mes], TEXTO(HOY(), "AAAA-MM"), TablaFacturas[Monto Total])
```

### Cantidad de facturas del mes actual
```excel
=CONTAR.SI(TablaFacturas[Mes], TEXTO(HOY(), "AAAA-MM"))
```

### Total por proveedor y mes
```excel
=SUMAR.SI.CONJUNTO(TablaFacturas[Monto Total], TablaFacturas[Proveedor], "Servicios Generales SAS", TablaFacturas[Mes], "2026-02")
```

### Cantidad de facturas pagadas del mes
```excel
=CONTAR.SI.CONJUNTO(TablaFacturas[Estado], "Pagada", TablaFacturas[Mes], TEXTO(HOY(), "AAAA-MM"))
```

### Porcentaje de cumplimiento de pago
```excel
=CONTAR.SI.CONJUNTO(TablaFacturas[Estado], "Pagada", TablaFacturas[Mes], "2026-02") / CONTAR.SI(TablaFacturas[Mes], "2026-02") * 100
```

### Promedio por factura
```excel
=PROMEDIO.SI(TablaFacturas[Mes], TEXTO(HOY(), "AAAA-MM"), TablaFacturas[Monto Total])
```

---

## Credenciales necesarias en n8n

| Credencial | Uso en el Workflow | Donde obtenerla |
|------------|-------------------|-----------------|
| Microsoft Excel OAuth2 API | Lectura e insercion de filas en el libro Excel | Azure AD - Registro de Aplicaciones |
| Microsoft SharePoint OAuth2 API | Lectura de archivos PDF desde SharePoint | Azure AD - Registro de Aplicaciones |
| Anthropic API | Procesamiento de facturas con Claude AI | console.anthropic.com - API Keys |
| SMTP | Envio de notificaciones por correo electronico | Proveedor de correo (configuracion SMTP) |

### Permisos requeridos en Azure AD

**Microsoft Excel OAuth2 API:**
- Scopes: `Files.ReadWrite.All`, `offline_access`

**Microsoft SharePoint OAuth2 API:**
- Scopes: `Sites.ReadWrite.All`, `Files.ReadWrite.All`, `offline_access`

---

## Referencia rapida de estados

| Estado | Descripcion | Color sugerido en Excel |
|--------|-------------|------------------------|
| `Pendiente` | Factura registrada, no pagada, dentro del plazo | Rojo claro (fondo) |
| `Pagada` | Factura pagada completamente | Verde (fondo) |
| `Vencida` | Factura cuyo plazo de pago vencio sin ser pagada | Amarillo / Naranja (fondo) |

---

## Notas importantes

- **No modifique el nombre de la tabla** `TablaFacturas` una vez configurada en n8n
- **No cambie los nombres de las columnas** de la tabla, ya que n8n los usa como referencia directa
- **No inserte filas por encima de la tabla**, ya que esto puede desplazar las referencias
- Los formatos de fecha deben ser consistentes: siempre `AAAA-MM-DD`
- El campo "Mes" (columna N) debe tener el formato `AAAA-MM` para que las agrupaciones funcionen correctamente
- Si agrega un nuevo proveedor, actualice tambien la hoja "Configuracion" y el flujo de n8n
- Realice respaldos periodicos del archivo Excel
- El archivo debe permanecer en OneDrive (no descargarlo a local) para que n8n pueda acceder a el

---

*Documento generado para el proyecto InmoLawyer - Sistema de Gestion de Facturas con n8n*
