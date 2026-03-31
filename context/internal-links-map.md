# InmoLawyer — Mapa de Links Internos

## Páginas actuales

| Página | URL | Indexable | Propósito |
|---|---|---|---|
| Landing | https://inmo.tools/inmolawyer/ | ✅ Sí | Conversión, SEO principal |
| App (analizador) | https://inmo.tools/inmolawyer/app.html | ❌ noindex | SaaS — usuarios registrados |
| Informe gremio demo | https://inmo.tools/inmolawyer/informe-gremio-demo.html | ❓ Sin definir | B2B pitch — considerar noindex |

## Páginas planeadas (roadmap SEO)

| Página | URL futura | Prioridad | Keyword objetivo |
|---|---|---|---|
| Blog | /blog/ | Alta | Varios long-tail |
| Guía Ley 820 | /ley-820-arrendamiento-colombia | Alta | "ley 820 de 2003" |
| Calculadora IPC | /calculadora-incremento-arriendo | Alta | "cuánto puede aumentar el arriendo" |
| Preguntas frecuentes | /faq | Media | Long-tail preguntas |
| Sobre nosotros | /about | Baja | Branded |

## Flujo de links internos

```
Landing (/)
  ├── CTA primario → App (/app.html) [no SEO, conversión]
  ├── CTA secundario → Registro/Login modal
  └── [futuro] → Blog (/blog/)
                    ├── Posts → Landing (CTA al final)
                    └── Posts → App (CTA contextual)
```

## Reglas de linking interno

1. **Landing → App**: Todos los CTAs en la landing apuntan a `/app.html`
2. **Anchor text del CTA principal**: "Analiza tu contrato gratis" (keyword + CTA)
3. **Anchor text secundario**: "Comenzar ahora", "Analizar mi contrato"
4. **Blog → Landing**: Anchor text variado, no siempre "InmoLawyer"
   - "analizar tu contrato de arrendamiento"
   - "verificar si tu incremento es legal"
   - "revisar cláusulas abusivas"
5. **Evitar**: Links con anchor "haz clic aquí" o "ver más"

## Assets estáticos

| Asset | URL | Uso |
|---|---|---|
| OG Image | /og-image.png | Open Graph / Twitter Card |
| Sitemap | /sitemap.xml | Google Search Console |
| Robots | /robots.txt | Directivas de rastreo |

## Google Search Console
- Propiedad: https://inmo.tools/inmolawyer/
- Sitemap enviado: https://inmo.tools/inmolawyer/sitemap.xml
- Estado: Pendiente de verificación y envío inicial

## Nota operativa de hosting

- InmoLawyer vive bajo el subpath `/inmolawyer`.
- El `robots.txt` que realmente consultan los crawlers debe existir en `https://inmo.tools/robots.txt`.
- El archivo `https://inmo.tools/inmolawyer/robots.txt` sirve como referencia del micrositio, pero no reemplaza el root robots del dominio.
- Si se quiere controlar indexación real del producto, el cambio debe replicarse en el proyecto raíz que sirve `inmo.tools`.

## Notas de rastreo (robots.txt actual)
```
User-agent: *
Allow: /
Disallow: /app.html
Sitemap: https://inmo.tools/inmolawyer/sitemap.xml
```
