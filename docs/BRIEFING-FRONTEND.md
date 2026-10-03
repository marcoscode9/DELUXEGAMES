# Briefing Frontend — DELUXEGAMES

> **Histórico:** la solicitud explícita del 2026-10-03 reemplaza la restricción de un solo HTML y la estética violeta por el rediseño completo con backend local, clientes y administración. Ver [REDISENO-2026-10-03.md](REDISENO-2026-10-03.md).

**Documento de trabajo para el encargado de frontend.**
**Emitido por:** Auditoría / Dirección de producto
**Fecha:** 2026-10-02
**Complementa:** `docs/AUDITORIA.md` (hallazgos técnicos y plan por fases — leer primero)

---

## 0. Contexto y decisión de producto

| Ítem | Definición |
|------|-----------|
| Nicho | Venta de juegos digitales / keys / cuentas PS4-PS5 |
| Mercado | Argentina (precios ARS, español rioplatense, Mercado Pago) |
| Checkout | WhatsApp (manual) hoy → Mercado Pago links a mediano plazo |
| Stack | One-pager estático (HTML/CSS/JS inline) en Vercel. **No migrar todavía.** |
| Problema #1 del nicho | **Desconfianza.** El rubro keys/cuentas tiene altísima percepción de estafa. Cada decisión de frontend debe responder: *"¿esto suma confianza o la resta?"* |

**Decisión rectora:** no reinventar nada. El nicho ya resolvió estos problemas. El trabajo es **adaptar patrones probados** de las referencias de abajo a nuestra escala y estética (violeta, limpio, Space Grotesk).

---

## 1. Skills necesarias para el encargado de frontend

### 1.1 Técnicas (obligatorias)

| Skill | Nivel requerido | Para qué lo va a usar |
|-------|----------------|----------------------|
| HTML semántico + accesibilidad | Sólido | Landmarks, `aria-*`, alt texts, focus visible, contraste. El carrito drawer y el FAQ lo exigen |
| CSS moderno vanilla | Sólido | Custom properties (ya las usa el proyecto), Grid/Flex, `clamp()`, media queries. **No agregar frameworks** (Tailwind/Bootstrap) ni librerías: el sitio es un solo archivo y debe seguir siéndolo |
| JavaScript vanilla (DOM + estado) | Sólido | Carrito con `localStorage`, filtro/buscador en vivo, render desde `products.json` (Fase 3). Sin React ni build step por ahora |
| Performance web | Intermedio | WebP, `loading="lazy"`, dimensiones en `<img>` (anti-CLS), carga de fonts con `preconnect`. Objetivo: página < 400 KB total |
| SEO on-page | Intermedio | Meta tags, Open Graph (crítico: el canal de venta es WhatsApp), JSON-LD `Product`/`Offer`/`FAQPage` |
| Git + flujo Vercel | Básico | Rama por cambio → Preview Deployment → PR → merge. Nunca pushear directo a `main` |

### 1.2 De criterio (las que definen el resultado)

1. **Saber mirar referencias y adaptar, no copiar.** Tomar el patrón (qué información muestra, en qué orden, con qué jerarquía), no el diseño literal.
2. **Copy en español rioplatense con acentos correctos.** "Comprá", "elegí", "catálogo", "instantánea". Los textos sin acentos de hoy restan profesionalismo (hallazgo C7 de la auditoría).
3. **Mentalidad de conversión (CRO básico).** Cada sección responde una objeción del comprador: *¿es seguro? ¿qué recibo exactamente? ¿cuándo llega? ¿y si no funciona?*
4. **Criterio mobile-first.** La gran mayoría del tráfico llega desde Instagram/WhatsApp en celular. Diseñar y probar primero en 360px de ancho.

---

## 2. Referencias del nicho (qué mirar de cada una)

### 2.1 Referencias globales — los líderes del rubro keys

| Sitio | Por qué es referencia | Qué mirar / adaptar |
|-------|----------------------|---------------------|
| **Instant Gaming** (instant-gaming.com) | El retailer de keys más conocido del mundo. Product page impecable | Card de producto: portada limpia + plataforma + región + % descuento. Página de producto: qué recibís, activación, requisitos |
| **Eneba** (eneba.com) | Fuerte en LATAM, diseño moderno, excelente mobile | Cards con `-38%` de descuento visible, badge de plataforma, "Buy Now" directo. Filtros de catálogo |
| **Loaded** (loaded.com, ex-CDKeys) | El más enfocado en conversión y confianza | Bloque "Why buy from us": *key genuina, entrega instantánea, no vendemos cuentas*. Instrucciones de activación paso a paso. Logos de medios de pago |
| **Kinguin** (kinguin.net) | Marketplace gigante, 24/7 | Rating del vendedor con cantidad de reseñas (`4.6 · 120.4k`) como prueba social masiva |
| **Gocdkeys** (gocdkeys.com) | Comparador de precios — muestra qué info considera relevante el comprador | Transparencia total: tipo de producto (Key vs Cuenta), región, fees, rating por tienda. Es literalmente el checklist de lo que un comprador de keys quiere saber antes de pagar |
| **Steam** (store.steampowered.com) | El estándar de discovery en gaming | Fichas con tags de género, reseñas agregadas ("Muy positivas"), secciones "Destacados y recomendados" |
| **PlayStation Store** (store.playstation.com) | Nuestra competencia directa (vendemos lo mismo, más barato) | Jerarquía de ficha de juego, ediciones (Standard/Deluxe), badges de plataforma PS4/PS5 |

### 2.2 Referencias locales Argentina — competidores directos (prioridad de análisis ALTA)

Estos son los más importantes de estudiar porque **le venden al mismo cliente, en el mismo idioma, con los mismos medios de pago:**

| Sitio | Qué hace bien (y nosotros no) |
|-------|------------------------------|
| **Start Play Games** (startplaygames.com.ar) | Distingue **PRIMARIO/SECUNDARIO** en cada producto. Publica "+950 ventas". Pilares Calidad/Seguridad/Atención. FAQ visible. Es el competidor más parecido a nuestro modelo |
| **Gorosoft** (gorosoft.com.ar) | Integra **Trustpilot** con reseñas reales. Narrativa de "pioneros, miles de clientes". Instructivo de instalación post-compra |
| **Latam Gamers** (latamgamers.com/shop) | Catálogo de 1.800+ productos con categorías por género/plataforma, filtro por precio, tags `[PREVENTA]`, descuentos `-58%` visibles |
| **Juegos Digitales Argentina** (juegosdigitalesargentina.com.ar) | Tiendanube con JSON-LD por producto (muestra que el SEO del nicho sí se trabaja), WhatsApp como canal |
| **Next Games** (nextgames.com.ar) | "4.9 estrellas, +1.200 opiniones en Google" en el hero. **La reseña agregada ES el titular** |
| **Game Center** (gamecenterok.com) | **Precio por medio de pago**: efectivo / transferencia / 3 cuotas — patrón omnipresente en ecommerce argentino. Schema `Store` con teléfono y email |

**Conclusión de mercado (decisión de dirección):** todo competidor serio del rubro en Argentina muestra 4 cosas que nosotros no mostramos: **(1) cantidad de ventas/reseñas, (2) tipo de producto exacto (key/cuenta primaria/secundaria), (3) garantía explícita, (4) precio por medio de pago.** Esos 4 ítems son el diferencial de conversión, no el diseño visual.

---

## 3. Componentes a construir (priorizados)

Convención: 🔴 P0 = ya · 🟠 P1 = esta semana · 🟡 P2 = próxima semana. Detalle técnico de implementación en `AUDITORIA.md`.

### 🔴 P0 — Fixes y componentes críticos

**1. Carrito drawer (ya existe, arreglar)**
- Persistencia en `localStorage`, agrupar duplicados (`x2`), respetar selector de cantidad, cerrar con `Escape` + overlay, bloquear scroll del body.
- Mensaje de WhatsApp con productos, cantidades, precios y total.
- Ref: código listo en AUDITORIA.md §Fase 1.1.

**2. Card de producto v2** — *Ref: Eneba + Instant Gaming + Start Play Games*
```
┌─────────────────────┐
│ [tag: OFERTA/-20%]  │
│   (portada 2:3)     │  ← WebP, width/height fijos, lazy
│ PS4|PS5  CTA-hover  │
├─────────────────────┤
│ Nombre del juego    │
│ Key PSN · Cta.Prim. │  ← tipo de producto EXPLÍCITO
│ $19.999  $15.000    │  ← tachado + actual + % OFF
│ [Agregar al carrito]│
└─────────────────────┘
```
- El tag cambia de semántica: `OFERTA -20%` / `NUEVO` / `PREVENTA + fecha` (no solo "PREVENTA").

**3. Trust bar (nuevo, debajo del hero)** — *Ref: Loaded "Why buy from us"*
- 4 ítems: ⚡ Entrega inmediata · 🛡️ Garantía si la key no funciona · 💬 Soporte por WhatsApp · ⭐ +XXX ventas realizadas (actualizar número real).

**4. Sección "¿Cómo compro?" (nuevo, 4 pasos)** — *Ref: instructivos de Loaded/Gorosoft*
- Elegís → Confirmás por WhatsApp → Pagás (Mercado Pago/transferencia) → Recibís tu key/cuenta en minutos.
- Elimina la objeción #1: "¿y esto cómo funciona?"

**5. Aclaración de tipo de producto (en cada card y detalle)**
- Texto fijo según corresponda: `Key de PSN`, `Cuenta primaria`, `Cuenta secundaria`, `Gift card`. **No negociable** (hallazgo C5).

### 🟠 P1 — Confianza y conversión

**6. Sección de reseñas** — *Ref: Next Games + Gorosoft*
- 3-6 cards: nombre, juego comprado, texto, fecha, estrellas. Si no hay reseñas reales todavía, **no inventar**: publicar capturas de entregas reales (con permiso) o esperar a tenerlas.
- Futuro: widget de Trustpilot como Gorosoft.

**7. FAQ en acordeón (`<details>` nativo, sin JS)** — *Ref: Start Play Games*
- Preguntas mínimas: ¿qué recibo cuando compro? ¿cuánto tarda? ¿qué pasa si la key no funciona? ¿cómo pago? ¿preventas: cuándo entregan?
- Marcado con JSON-LD `FAQPage` (SEO).

**8. Precio por medio de pago** — *Ref: Game Center (patrón ARG)*
- En el detalle: `$95.000 con Mercado Pago · $88.000 por transferencia`. Solo si el negocio lo confirma; si no, un solo precio y logos de MP/transferencia.

**9. Filtros de catálogo por categoría** — *Ref: Latam Gamers*
- Chips en la nav de categorías (PlayStation / Preventas / Ofertas / Gift cards) que filtran el grid con el mismo JS del buscador. Hoy la nav solo dice "PlayStation" y se ve inacabada (F6).

**10. Disclaimer de preventa (componente inline)** — *Ref: tag `[PREVENTA]` de Latam Gamers*
- En GTA VI / FC 27: `⚠️ Preventa — entrega el día del lanzamiento. Si se retrasa, reembolso completo.` Con fecha estimada. Sin esto, las preventas restan confianza (C6).

**11. Botón flotante de WhatsApp** (abajo a la derecha, verde, icono oficial) — estándar del rubro local.

### 🟡 P2 — Polish y SEO

**12. Footer legal** — datos del vendedor (nombre/razón social, CUIT, domicilio, email), links a Términos / Privacidad / Reembolsos / **Botón de arrepentimiento** (Ley 24.240).
**13. Head completo** — OG image (1200×630), favicon, canonical, JSON-LD de productos. Specs exactas en AUDITORIA.md §1.5.
**14. Render desde `products.json`** — catálogo desacoplado del HTML (Fase 3, habilita crecer sin tocar markup).

---

## 4. Reglas no negociables

1. **Un solo HTML, sin frameworks ni build step** hasta nueva decisión (la migración se evalúa en Fase 3, no antes).
2. **Mobile-first y probado en 360px.** Todo el tráfico es móvil.
3. **Nada de reseñas, ventas ni garantías inventadas.** La confianza es el activo del negocio; una fake review detectada lo destruye.
4. **Peso total < 400 KB.** Imágenes en WebP, nada de PNG/JPG pesados. Nombres de archivo sin espacios (`gow-ragnarok.webp`).
5. **Español con acentos y puntuación correcta** en todo texto visible.
6. **Contraste AA** (texto sobre violeta verificar ratio ≥ 4.5:1) y focus visible en todo elemento interactivo.
7. **Preview deployment de Vercel verificado antes de mergear** + compra de prueba end-to-end tras cada deploy.

## 5. Orden de ejecución (decisión de dirección)

1. Componentes 1-5 (P0) junto con los quick wins de AUDITORIA.md Fase 1 → mismo PR.
2. Componentes 6-11 (P1) → segundo PR.
3. Componentes 12-14 (P2) → tercer PR.
4. Medir con Clarity/GA4 (ya incluido en Fase 1) y re-auditar a los 30 días.
