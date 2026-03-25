# InmoLawyer — Features del Producto

## Core Value Proposition
Hub legal de finca raiz para todo el ecosistema inmobiliario colombiano: inquilinos, propietarios, agentes, inmobiliarias, aseguradoras, afianzadoras y firmas legales. Analisis de contratos de arrendamiento con IA en 30 segundos, basado en la Ley 820 de 2003. WhatsApp-first B2C como canal de entrada, evolucionando a plataforma B2B.

## Features actuales

### Análisis de contrato (Core)
- **Input**: PDF del contrato de arrendamiento
- **Output**: Score de riesgo (0-100) + alertas clasificadas + resumen ejecutivo
- **Tiempo**: ~30 segundos
- **IA**: Gemini 2.5 Flash (Google) + prompt especializado en Ley 820
- **Detección de**:
  - Incremento del canon por encima del IPC (Art. 20, Ley 820)
  - Depósito que excede 2 meses de arriendo (Art. 16)
  - Cláusulas abusivas o ilegales
  - Ausencia de inventario del inmueble
  - Términos de duración incorrectos o indefinidos
  - Obligaciones ilegales al arrendatario
  - Falta de datos obligatorios (identificación, dirección, etc.)

### Sistema de alertas
- **Rojo**: Cláusulas claramente ilegales según Ley 820
- **Amarillo**: Cláusulas riesgosas o ambiguas que requieren revisión
- **Verde**: Cláusulas correctas o favorables al arrendatario

### Score de riesgo
- **0-39**: Riesgo Alto (contrato con problemas legales significativos)
- **40-69**: Riesgo Medio (revisar alertas amarillas)
- **70-100**: Riesgo Bajo (contrato relativamente seguro)

### Guest analysis (freemium)
- Análisis sin registro previo
- Resultado parcial (resumen + alertas) sin PDF completo
- Para resultado completo: pago único o registro
- Pago vía Wompi (PSE, tarjeta, Nequi)

### Dashboard "Mis Contratos"
- Historial de contratos analizados (usuarios registrados)
- Re-descarga de reportes PDF
- Filtro y búsqueda por fecha/riesgo

### Reporte PDF
- Score de riesgo visual
- Lista de alertas con explicación legal
- Referencia específica a artículos de la Ley 820
- Recomendaciones concretas
- Marca InmoLawyer

## Planes y precios

### Free / Guest
- 1 análisis gratuito (sin registro, resultado parcial)
- Acceso a resumen y score

### Pay-per-use
- Créditos individuales: ~$X COP por análisis
- Resultado completo + PDF descargable
- Sin suscripción mensual

### Corporate / Gremios (en desarrollo)
- Análisis masivo de cartera de contratos
- Dashboard agregado con estadísticas
- Reportes por localidad/estrato/propietario
- API access
- SLA y soporte dedicado

## Stack técnico (interno)
- Frontend: HTML/CSS/JS estático (Surge.sh)
- Auth/DB: Supabase
- Backend/IA: N8N + Gemini 2.5 Flash API (Google)
- Pagos: Wompi (Colombia)
- PDF: jsPDF (client-side)

## Integraciones actuales
- WhatsApp (Kapso): canal primario B2C, foto/PDF del contrato
- Google Gemini: analisis de texto + OCR (Gemini Vision)
- Wompi: pagos en Colombia (PSE, tarjeta credito/debito, Nequi)
- Supabase: usuarios, historial, guest_analisis, bot_events
- N8N: orquestacion de flujos (analisis, pagos, emails, bot WhatsApp)

## Roadmap

### Fase 1 (semanas 1-4): Fundamentos + Bot WhatsApp + Soft launch
- T&C + Politica de Privacidad (Ley 1581)
- Bot WhatsApp core: foto/PDF -> OCR -> analisis -> resultado + disclaimer
- Rate limiting, gate de validacion, eliminacion de contrato post-analisis
- Carta de reclamacion (Gemini + HTML -> PDF -> WhatsApp)
- Boton "Analizar por WhatsApp" en web (conectar trafico SEO al canal primario)
- Viral loop multi-actor (inquilino -> propietario -> agente)

### Fase 2 (mes 3-6): Expansion + B2B pilotos
- Deteccion de rol en primer mensaje (inquilino/propietario/agente/firma)
- Alerta de renovacion multi-actor
- Sello "Analizado por InmoLawyer"
- B2B pilotos con inmobiliarias
- Chat legal post-analisis
- Multi-pagina (contrato largo, varias fotos)

### Fase 3 (mes 6-12): Hub legal finca raiz
- API REST para inmobiliarias, afianzadoras y firmas legales
- Scoring de riesgo para polizas
- Plantillas de contratos legales
- White-label para inmobiliarias grandes
- Multi-pais (Mexico, Chile, Argentina)
