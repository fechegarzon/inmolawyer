# Prompt para CloudExcel — Modelo Financiero InmoLawyer

> Copia todo el contenido debajo de la linea y pegalo en Claude en Excel.

---

Crea un modelo financiero completo para una startup SaaS legaltech llamada **InmoLawyer**, con forecast a 24 meses (Mes 1 = Marzo 2026 hasta Mes 24 = Febrero 2028). El modelo debe ser dual: costos en USD y ingresos en COP, con una fila de TRM (tasa de cambio) editable para conversion. Usa TRM base de $4,200 COP/USD.

## CONTEXTO DEL NEGOCIO

InmoLawyer es una plataforma de IA que analiza contratos de arrendamiento de vivienda urbana en Colombia segun la Ley 820 de 2003. Los usuarios suben un contrato (PDF, DOCX o imagen) y reciben: score de riesgo (0-100), deteccion de clausulas abusivas, calculo de incrementos IPC, datos extraidos del contrato, y acceso a un chat legal con IA.

El producto cobra por analisis individual (pago por uso) con tres tiers de precio.

## HOJAS DEL MODELO (crear como pestanas separadas)

### HOJA 1: "Supuestos" (Assumptions)
Todas las variables editables del modelo, organizadas en secciones. Texto azul para inputs editables, fondo amarillo para los supuestos clave.

**Seccion 1 — Infraestructura y Costos Fijos Mensuales (en USD)**

| Concepto | Valor Mes 1 | Notas |
|----------|-------------|-------|
| DigitalOcean Droplet (n8n + Caddy + PostgreSQL) | $6 | 1GB RAM, actualmente suficiente. Incluir upgrade a $12 en mes 6 y $24 en mes 12 por crecimiento |
| Anthropic API — Plan Scale | $100 | Plan fijo mensual. Incluir que sube a $200 en mes 9 y $400 en mes 15 por volumen |
| Supabase (Auth + PostgreSQL) | $0 | Free tier. Incluir upgrade a $25/mes cuando supere 50,000 MAU (estimar en mes 10) |
| Dominio inmolawyer.com | $1.25 | ~$15/anio prorrateado mensual |
| Surge.sh / Hosting frontend | $0 | Gratuito (GitHub Pages como backup) |
| Email transaccional (Resend/SendGrid) | $0 | Free tier hasta 3,000 emails/mes. Incluir $20/mes a partir de mes 8 |
| SSL/CDN (Cloudflare) | $0 | Free tier |
| Herramientas dev (GitHub, etc.) | $0 | Free tier |
| Buffer para imprevistos infra | 10% | Porcentaje sobre total infra mensual |

**Seccion 2 — Costo Variable por Analisis (en USD)**

Calcular el costo unitario de cada analisis de contrato basado en consumo de tokens de Claude Sonnet 4:

| Componente | Tokens estimados | Precio Anthropic |
|------------|-----------------|------------------|
| Analisis del contrato — Input tokens | ~4,000 tokens | $3.00 / millon tokens |
| Analisis del contrato — Output tokens | ~4,000 tokens | $15.00 / millon tokens |
| Costo por 1 analisis | | Calcular con formula |
| Chat legal — Input tokens por pregunta | ~2,000 tokens | $3.00 / millon tokens |
| Chat legal — Output tokens por pregunta | ~2,000 tokens | $15.00 / millon tokens |
| Costo por 1 pregunta de chat | | Calcular con formula |
| Promedio de preguntas de chat por usuario | 3 | Supuesto editable |
| Costo total variable por analisis (incluye chat) | | Formula: costo_analisis + (costo_chat * promedio_preguntas) |

**Seccion 3 — Pricing Tiers (en COP)**

Tres tiers de precio. El margen de utilidad neta debe ser generoso (>70% sobre costo variable).

| Tier | Descripcion | Precio COP | Incluye |
|------|-------------|-----------|---------|
| Basico | Analisis + score + alertas | Calcular para >70% margen | 1 analisis, sin chat |
| Profesional | Analisis completo + chat | Calcular para >75% margen | 1 analisis + 5 preguntas chat |
| Premium | Analisis + chat ilimitado + PDF reporte | Calcular para >80% margen | 1 analisis + chat ilimitado + descarga PDF |

Incluir mix de ventas estimado: 40% Basico, 40% Profesional, 20% Premium.

**Seccion 4 — Supuestos de Crecimiento de Usuarios**

| Metrica | Mes 1 | Mes 6 | Mes 12 | Mes 18 | Mes 24 |
|---------|-------|-------|--------|--------|--------|
| Visitantes web/mes | 500 | 3,000 | 10,000 | 25,000 | 50,000 |
| Tasa de registro (% visitantes) | 5% | 7% | 8% | 9% | 10% |
| Tasa de conversion (% registrados que pagan) | 10% | 12% | 15% | 18% | 20% |
| Analisis gratis por usuario nuevo | 1 | 1 | 1 | 1 | 1 |

Interpolar linealmente los meses intermedios.

**Seccion 5 — Marketing y Adquisicion (en COP)**

Calcular el presupuesto optimo de marketing para alcanzar los objetivos de visitantes. Incluir estos canales:

| Canal | % del presupuesto | CPC/CPM estimado | Notas |
|-------|-------------------|------------------|-------|
| Google Ads (Search) | 35% | CPC: $800-1,200 COP | Keywords: "contrato arriendo", "ley 820", "clausulas abusivas arriendo" |
| Meta Ads (Instagram/Facebook) | 25% | CPM: $15,000-25,000 COP | Audiencia: 25-55 anos, Colombia, intereses inmobiliarios |
| TikTok Ads | 15% | CPM: $8,000-15,000 COP | Contenido educativo legal |
| Content Marketing / SEO | 15% | $0 directo | Costo = tiempo founder. Incluir $500,000 COP/mes para freelancer de contenido desde mes 3 |
| Referral Program | 10% | $5,000 COP por referido | Credito al referidor |

Calcular CAC (Customer Acquisition Cost) y LTV (Lifetime Value) por mes. Incluir ratio LTV/CAC con objetivo minimo de 3x.

**Seccion 6 — TRM y Conversion**

| Variable | Valor |
|----------|-------|
| TRM base (COP/USD) | 4,200 |
| Inflacion anual COP estimada | 5% |
| Ajuste TRM mensual | 0.2% | (pequena depreciacion mensual del COP) |

### HOJA 2: "P&G" (Estado de Resultados / Income Statement)

Forecast mensual a 24 meses, con columnas: Mes 1 a Mes 24 + columna Total Ano 1 + Total Ano 2.

**Estructura de filas:**

INGRESOS
- Ingresos Tier Basico (COP)
- Ingresos Tier Profesional (COP)
- Ingresos Tier Premium (COP)
- **Ingresos Brutos Totales (COP)**
- Ingresos Brutos Totales (USD) — conversion con TRM

COSTO DE VENTAS (COGS)
- Costo variable Anthropic API por analisis (USD, convertir a COP)
- Costo de infraestructura variable (si aplica)
- **Total COGS (COP)**

UTILIDAD BRUTA
- **Utilidad Bruta (COP)**
- **Margen Bruto %**

GASTOS OPERATIVOS (OPEX)
- Infraestructura fija (DO + Supabase + Dominio + Email) — convertir USD a COP
- Marketing y Adquisicion (COP)
- Herramientas y software (COP)
- Imprevistos (% sobre total OPEX)
- **Total OPEX (COP)**

EBITDA
- **EBITDA (COP)**
- **Margen EBITDA %**

UTILIDAD NETA
- Impuestos estimados (si aplica, 0% los primeros meses como startup)
- **Utilidad Neta (COP)**
- **Margen Neto %**

### HOJA 3: "Flujo de Caja" (Cash Flow Statement)

Forecast mensual a 24 meses.

**Estructura:**

SALDO INICIAL DE CAJA

ENTRADAS DE EFECTIVO
- Cobros por analisis (asumir cobro inmediato, sin cartera)
- Inversion inicial del founder (parametro editable, sugerir $5,000,000 COP en Mes 0)

SALIDAS DE EFECTIVO
- Pago infraestructura (mensual)
- Pago API Anthropic (mensual)
- Pago marketing (mensual)
- Pago dominio (anual, prorrateado o lump sum)
- Otros gastos operativos

FLUJO NETO DEL MES

SALDO FINAL DE CAJA (acumulado)

Incluir fila de "Meses de runway" = Saldo Final / Burn Rate Mensual

### HOJA 4: "Unit Economics"

Una hoja dedicada a metricas unitarias por mes:

| Metrica | Formula |
|---------|---------|
| Visitantes Web | Del supuesto |
| Registros | Visitantes * Tasa registro |
| Usuarios pagos | Registros * Tasa conversion |
| Total analisis realizados | Usuarios pagos + analisis gratis |
| Revenue per Analysis (COP) | Ingresos / Total analisis pagos |
| COGS per Analysis (COP) | COGS / Total analisis |
| Gross Profit per Analysis | Revenue - COGS |
| CAC (COP) | Gasto marketing / Nuevos usuarios pagos |
| LTV (COP) | Revenue per user * (1 / churn rate estimado) |
| LTV / CAC Ratio | LTV / CAC |
| Payback Period (meses) | CAC / Monthly Revenue per User |
| Breakeven mensual | Mes donde Utilidad Neta >= 0 |
| Monthly Burn Rate | Total egresos mensuales |
| Runway (meses) | Caja disponible / Burn Rate |

### HOJA 5: "Dashboard KPIs"

Resumen ejecutivo con las metricas clave. Incluir:

- Ingresos acumulados Ano 1 vs Ano 2
- EBITDA acumulado
- Punto de breakeven (mes exacto)
- CAC promedio vs LTV promedio
- Margen Bruto promedio
- Margen Neto promedio al final del Ano 2
- Total usuarios pagos acumulados
- Total analisis realizados
- Cash position al final de cada ano

## INSTRUCCIONES DE FORMATO

- Usar color coding financiero estandar: texto azul para inputs editables, negro para formulas, verde para referencias entre hojas
- Fondo amarillo para supuestos clave que el founder debe ajustar
- Formato de moneda: COP con separador de miles y sin decimales ($#,##0)
- Formato USD: $#,##0.00
- Porcentajes con 1 decimal (0.0%)
- Negativos entre parentesis
- Anos como texto, no numeros
- Todas las formulas deben referenciar la hoja de Supuestos (no hardcodear valores)
- Incluir formato condicional: rojo si margen neto es negativo, verde si es positivo
- Headers de cada seccion con fondo verde oscuro (#166534) y texto blanco
- Nombre del archivo: InmoLawyer_Modelo_Financiero_2026.xlsx
