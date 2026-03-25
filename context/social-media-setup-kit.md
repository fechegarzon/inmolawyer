# InmoLawyer - Kit de Setup Redes Sociales

Tiempo estimado total: 15-20 minutos para crear las 4 cuentas.

---

## Datos compartidos (usar en todas las plataformas)

- **Nombre**: InmoLawyer
- **Username**: @inmolawyer (si no esta disponible: @inmolawyer_co, @inmolawyer.co)
- **Email**: contacto@inmolawyer.com (o el que uses para el producto)
- **Link principal**: https://inmo.tools/inmolawyer
- **Link calculadora**: https://inmo.tools/inmolawyer/calculadora-incremento-arriendo
- **Categoria**: Servicios legales / Tecnologia / Proptech

---

## 1. Instagram (@inmolawyer)

**Tipo de cuenta**: Profesional (Empresa) - categoria "Servicio legal" o "Software"

**Nombre de perfil**: InmoLawyer | Abogado Inmobiliario IA

**Bio** (150 caracteres max):
```
Analiza tu contrato de arriendo con IA en 30 seg.
Basado en la Ley 820 de 2003.
Tu primer analisis es gratis.
```

**Link en bio**: https://inmo.tools/inmolawyer

**Highlights sugeridos** (crear cuando tengas contenido):
- "Ley 820" - clips explicando la ley
- "Clausulas" - ejemplos de clausulas abusivas
- "IPC 2026" - todo sobre incrementos
- "Como funciona" - demo del producto

**Configuracion**:
- Activar cuenta profesional (Empresa, no Creador)
- Conectar con pagina de Facebook (necesario para API)
- Activar respuestas automaticas: "Gracias por escribirnos. Analiza tu contrato gratis en inmo.tools/inmolawyer"

---

## 2. TikTok (@inmolawyer)

**Nombre de perfil**: InmoLawyer

**Bio** (80 caracteres max):
```
Tu abogado inmobiliario con IA
Ley 820 | Arriendos Colombia
```

**Link en bio**: https://inmo.tools/inmolawyer

**Configuracion**:
- Cambiar a cuenta de empresa (Configuracion > Cuenta > Cambiar a cuenta de empresa > Servicios legales)
- Esto desbloquea el link en bio y analiticas
- Para la API de TikTok Content Posting necesitas aplicar en developers.tiktok.com (toma 1-2 semanas la aprobacion)

---

## 3. Twitter/X (@inmolawyer)

**Nombre de perfil**: InmoLawyer

**Bio** (160 caracteres max):
```
Analiza contratos de arrendamiento con IA en 30 segundos. Basado en la Ley 820 de 2003. Detecta clausulas abusivas, verifica el IPC. Tu primer analisis es gratis.
```

**Link**: https://inmo.tools/inmolawyer
**Ubicacion**: Bogota, Colombia

**Tweet fijado sugerido**:
```
Analizamos contratos de arrendamiento con inteligencia artificial.

En 30 segundos sabes:
- Si tu contrato tiene clausulas abusivas
- Si el incremento del arriendo es legal segun el IPC
- Si el deposito excede el maximo de la Ley 820

Tu primer analisis es gratis: inmo.tools/inmolawyer
```

**Configuracion API (para automatizar con n8n)**:
1. Ir a developer.twitter.com
2. Crear cuenta de desarrollador (gratis - plan Free permite 1,500 tweets/mes)
3. Crear un "Project" y una "App"
4. Generar: API Key, API Secret, Access Token, Access Token Secret
5. En n8n: agregar credencial "Twitter OAuth API" con esos 4 valores
6. Habilitar el nodo "Publicar en X (Twitter)" en el workflow "Parrilla de Contenido Social"

---

## 4. LinkedIn (Pagina de empresa)

**Nombre**: InmoLawyer
**URL personalizada**: linkedin.com/company/inmolawyer

**Descripcion corta** (120 chars):
```
Analisis de contratos de arrendamiento con IA. Basado en la Ley 820 de 2003.
```

**Descripcion larga** (2000 chars max):
```
InmoLawyer es la primera herramienta de inteligencia artificial en Colombia especializada en el analisis de contratos de arrendamiento de vivienda urbana.

Nuestro sistema analiza tu contrato en menos de 30 segundos y te entrega:

- Un score de riesgo legal de 0 a 100
- Deteccion de clausulas abusivas con referencia especifica a la Ley 820 de 2003
- Verificacion del incremento del canon segun el IPC certificado por el DANE
- Alertas sobre depositos que exceden el maximo legal (2 meses)
- Recomendaciones concretas para proteger tus derechos

Servimos a arrendatarios que quieren conocer sus derechos, arrendadores que buscan contratos legalmente seguros, agentes inmobiliarios que necesitan revision rapida, y gremios que requieren analisis masivo de cartera.

El primer analisis es completamente gratuito, sin registro.

Bogota, Colombia.
```

**Datos de la empresa**:
- Industria: Servicios legales / Tecnologia
- Tamano: 1-10 empleados
- Tipo: Startup
- Sede: Bogota, Colombia
- Sitio web: https://inmo.tools/inmolawyer

**Configuracion**:
1. Crear desde tu perfil personal de LinkedIn (Productos > Crear pagina de empresa)
2. Subir logo e imagen de banner
3. Invitar contactos relevantes a seguir la pagina
4. Para publicar via API: crear app en linkedin.com/developers (Community Management API)

---

## Imagen de perfil y banner

**Foto de perfil** (todas las plataformas):
- Usar el icono de balanza (el favicon del sitio) sobre fondo verde (#166534)
- Tamano: 400x400px minimo
- Formato: PNG con fondo solido, sin texto pequeno

**Banner/Header**:
- Tamano Instagram: no aplica
- Tamano Twitter: 1500x500px
- Tamano LinkedIn: 1128x191px
- Contenido sugerido: "Analiza tu contrato de arriendo con IA | inmo.tools/inmolawyer" sobre fondo gradiente verde (#f0fdf4 a #166534) con el icono de balanza

---

## Orden de prioridad para crear cuentas

1. **Twitter/X** - el mas facil de automatizar con n8n, API gratuita
2. **Instagram** - mayor audiencia B2C en Colombia para este tema
3. **TikTok** - alto potencial viral para contenido educativo legal
4. **LinkedIn** - para credibilidad B2B y gremios

---

## Checklist post-creacion

- [ ] Crear cuenta de Twitter/X
- [ ] Crear developer account en developer.twitter.com
- [ ] Generar API keys de Twitter
- [ ] Agregar credencial Twitter en n8n
- [ ] Habilitar nodo "Publicar en X" en workflow Parrilla
- [ ] Crear cuenta de Instagram (profesional)
- [ ] Crear pagina de Facebook (requerida para Instagram API)
- [ ] Crear cuenta de TikTok (empresa)
- [ ] Crear pagina de LinkedIn
- [ ] Subir foto de perfil en las 4 plataformas
- [ ] Publicar primer post manualmente en cada plataforma
- [ ] Activar workflow n8n "Parrilla de Contenido Social"
