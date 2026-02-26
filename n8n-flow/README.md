# InmoLawyer - Flujo n8n para Análisis de Contratos

## Descripcion General

Este flujo automatiza el procesamiento de contratos de arrendamiento en Colombia, extrayendo información clave, detectando cláusulas abusivas según la Ley 820 de 2003, y proporcionando un agente de IA para consultas legales.

**Modelo IA:** Claude Sonnet 4 (claude-sonnet-4-20250514)

---

## GUIA RAPIDA: Importar en n8n.cloud

### 1. Acceder a n8n.cloud
- Ve a https://app.n8n.cloud
- Inicia sesion en tu cuenta

### 2. Importar workflow
1. Menu lateral > **Workflows**
2. Click en **Add Workflow** > **Import from File**
3. Selecciona: `inmolawyer_workflow.json`

### 3. Crear credenciales

**PostgreSQL InmoLawyer:**
- Settings > Credentials > Add Credential > Postgres
- Host, Database (inmolawyer), User, Password, Port (5432)

**Anthropic API:**
- Settings > Credentials > Add Credential > Anthropic
- Ingresa tu API Key

### 4. Asignar credenciales a nodos
- 8 nodos PostgreSQL: asignar `PostgreSQL InmoLawyer`
- 2 nodos Anthropic: asignar `Anthropic API`

### 5. Activar
- Guardar workflow (Ctrl+S)
- Toggle **Active** = ON

### 6. Probar
```bash
# Edita test_webhooks.sh con tu URL de n8n.cloud
./test_webhooks.sh
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WebApp        │────▶│   n8n Workflow  │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Claude AI     │
                        │   (Anthropic)   │
                        └─────────────────┘
```

## 📁 Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `inmolawyer_workflow.json` | Flujo completo de n8n para importar |
| `database_schema.sql` | Script SQL para crear la base de datos |
| `README.md` | Esta documentación |

---

## 🚀 Guía de Instalación

### Paso 1: Configurar PostgreSQL

1. **Crear la base de datos:**
```bash
createdb inmolawyer
```

2. **Ejecutar el schema:**
```bash
psql -d inmolawyer -f database_schema.sql
```

3. **Verificar las tablas creadas:**
```sql
\dt
-- Deberías ver:
-- contratos
-- alertas_contrato
-- incrementos_calculados
-- consultas_chat
-- fechas_importantes
-- ipc_historico
```

### Paso 2: Configurar n8n

1. **Instalar n8n** (si no está instalado):
```bash
npm install -g n8n
# o con Docker:
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

2. **Acceder a n8n:**
```
http://localhost:5678
```

### Paso 3: Importar el Workflow

1. En n8n, ir a **Settings** → **Import from File**
2. Seleccionar `inmolawyer_workflow.json`
3. El flujo aparecerá en tu workspace

### Paso 4: Configurar Credenciales

#### PostgreSQL
1. Ir a **Settings** → **Credentials** → **Add Credential**
2. Seleccionar **Postgres**
3. Configurar:
   - **Host:** `localhost` (o tu servidor)
   - **Database:** `inmolawyer`
   - **User:** tu usuario de PostgreSQL
   - **Password:** tu contraseña
   - **Port:** `5432`
4. Guardar como `inmolawyer-postgres`

#### Anthropic (Claude AI)
1. Ir a **Settings** → **Credentials** → **Add Credential**
2. Seleccionar **Anthropic**
3. Configurar:
   - **API Key:** tu API key de Anthropic
4. Guardar como `inmolawyer-anthropic`

### Paso 5: Asignar Credenciales al Workflow

1. Abrir el workflow importado
2. En cada nodo de PostgreSQL:
   - Click en el nodo
   - En "Credential", seleccionar `inmolawyer-postgres`
3. En cada nodo de Anthropic:
   - Click en el nodo
   - En "Credential", seleccionar `inmolawyer-anthropic`
4. **Guardar** el workflow

### Paso 6: Activar el Workflow

1. Click en el toggle **"Active"** en la esquina superior derecha
2. El workflow ahora está escuchando webhooks

---

## 🔗 Endpoints (Webhooks)

Una vez activado, tendrás estos endpoints:

### 1. Analizar Contrato
```
POST http://localhost:5678/webhook/analizar-contrato
```

**Body (form-data):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `archivo` | File | PDF del contrato |
| `texto_extraido` | Text | Texto ya extraído (opcional) |

**Respuesta exitosa:**
```json
{
  "success": true,
  "contrato_id": "uuid-del-contrato",
  "datos_extraidos": {
    "arrendador": {
      "nombre": "Welcome District SAS",
      "documento": "9008936947",
      "tipoDoc": "NIT"
    },
    "arrendatario": {
      "nombre": "Natalia Nallino Camacho",
      "documento": "1018494433",
      "tipoDoc": "C.C."
    },
    "canon": "$1.200.000",
    "direccion": "Carrera 7B 127a-33 Apto 302",
    "ciudad": "Bogotá D.C."
  },
  "alertas": [...],
  "score_riesgo": 25,
  "fechas_importantes": [...]
}
```

### 2. Consulta al Agente IA
```
POST http://localhost:5678/webhook/consulta-contrato
```

**Body (JSON):**
```json
{
  "contrato_id": "uuid-del-contrato",
  "pregunta": "¿Puedo terminar el contrato antes de tiempo?"
}
```

**Respuesta:**
```json
{
  "success": true,
  "respuesta": "Según tu contrato y la Ley 820 de 2003...",
  "referencia_legal": "Art. 22 Ley 820/2003",
  "tiempo_respuesta_ms": 1234
}
```

### 3. Calcular Incremento IPC
```
POST http://localhost:5678/webhook/calcular-incremento
```

**Body (JSON):**
```json
{
  "contrato_id": "uuid-del-contrato",
  "anio": 2024
}
```

---

## 📊 Estructura de la Base de Datos

### Tabla: `contratos`
Almacena los contratos y sus datos extraídos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `archivo_nombre` | VARCHAR | Nombre del archivo subido |
| `texto_extraido` | TEXT | Texto completo del contrato |
| `arrendador_nombre` | VARCHAR | Nombre del arrendador |
| `arrendador_documento` | VARCHAR | NIT o C.C. del arrendador |
| `arrendatario_nombre` | VARCHAR | Nombre del arrendatario |
| `canon_mensual` | DECIMAL | Valor del arriendo |
| `fecha_inicio` | DATE | Inicio del contrato |
| `score_riesgo` | INTEGER | 0-100 (mayor = más riesgoso) |

### Tabla: `alertas_contrato`
Problemas legales detectados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo` | VARCHAR | danger, warning, info, success |
| `titulo` | VARCHAR | Título de la alerta |
| `descripcion` | TEXT | Explicación detallada |
| `referencia_legal` | VARCHAR | Artículo de ley aplicable |
| `es_clausula_abusiva` | BOOLEAN | Si es ilegal |

### Tabla: `consultas_chat`
Historial de preguntas al agente IA.

### Tabla: `ipc_historico`
Datos del IPC de Colombia (2010-2024).

---

## 🔧 Integración con la WebApp

### Modificar `app.js` para usar n8n

Reemplaza la función de análisis local con llamadas al webhook:

```javascript
// En app.js, reemplazar processContract() con:

async function processContract(file) {
    const formData = new FormData();
    formData.append('archivo', file);

    // Si ya tienes texto extraído:
    if (extractedText) {
        formData.append('texto_extraido', extractedText);
    }

    try {
        const response = await fetch('http://localhost:5678/webhook/analizar-contrato', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Guardar el ID del contrato para consultas futuras
            window.currentContratoId = result.contrato_id;

            // Mostrar datos extraídos
            displayContractData(result.datos_extraidos);

            // Mostrar alertas
            displayAlerts(result.alertas);

            // Mostrar score de riesgo
            displayRiskScore(result.score_riesgo);
        }
    } catch (error) {
        console.error('Error al procesar contrato:', error);
    }
}

// Función para consultas al agente IA
async function askAI(question) {
    const response = await fetch('http://localhost:5678/webhook/consulta-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contrato_id: window.currentContratoId,
            pregunta: question
        })
    });

    const result = await response.json();
    return result.respuesta;
}
```

---

## 🧠 Configuración del Agente IA

El agente Claude está configurado con un prompt especializado en:

- ✅ Ley 820 de 2003 (Arrendamiento de Vivienda Urbana)
- ✅ Cláusulas abusivas comunes en Colombia
- ✅ Derechos del arrendatario
- ✅ Cálculo de incrementos según IPC
- ✅ Procedimientos de terminación anticipada
- ✅ Depósitos ilegales

### Personalizar el Prompt

En el nodo "Agente IA - Claude", puedes modificar el prompt del sistema para ajustar el comportamiento:

```
Eres un asistente legal especializado en contratos de arrendamiento en Colombia...
```

---

## 🔍 Alertas Detectadas Automáticamente

El sistema detecta automáticamente:

| Alerta | Tipo | Descripción |
|--------|------|-------------|
| Depósito ilegal | 🔴 Peligro | Cobro de depósitos > 1 mes |
| Canon excesivo | 🟡 Advertencia | Arriendo muy alto para la zona |
| Sin fecha de inicio | 🟡 Advertencia | Contrato sin fecha clara |
| Duración indefinida | 🔵 Info | Sin fecha de terminación |
| Cláusula penal abusiva | 🔴 Peligro | Penalidades desproporcionadas |

---

## 📅 Fechas Importantes Calculadas

El sistema calcula automáticamente:

- **Próximo incremento:** Fecha + IPC aplicable
- **Aviso de no renovación:** 3 meses antes del vencimiento
- **Vencimiento del contrato:** Según duración
- **Período de gracia:** Para pago de canon

---

## 🛠️ Solución de Problemas

### El webhook no responde
1. Verificar que el workflow está **Active**
2. Verificar que n8n está corriendo
3. Revisar logs: `n8n start --tunnel` para debug

### Error de conexión a PostgreSQL
1. Verificar credenciales en n8n
2. Verificar que PostgreSQL está corriendo
3. Verificar firewall/puertos

### Claude no responde
1. Verificar API key de Anthropic
2. Verificar créditos en tu cuenta
3. Revisar límites de rate

### Extracción incorrecta
1. Verificar calidad del PDF
2. Usar OCR si es imagen escaneada
3. Revisar formato del contrato

---

## 📞 Soporte

Para problemas o mejoras, contactar al equipo de desarrollo.

---

## 📜 Licencia

Este proyecto es propiedad de InmoLawyer. Todos los derechos reservados.
