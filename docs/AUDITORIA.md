# Auditoría E-Commerce — DELUXEGAMES

**URL auditada:** https://deluxegames.vercel.app/
**Fecha:** 2026-10-02
**Tipo de sitio:** Single-page estático (HTML + CSS + JS inline) deployado en Vercel
**Modelo de negocio:** Venta de juegos digitales (PS4/PS5) con checkout vía WhatsApp — mercado argentino (precios en ARS)

---

## Resumen ejecutivo

| Área | Puntaje | Estado |
|------|---------|--------|
| Funcionalidad | 4/10 | 🔴 Bugs que afectan ventas |
| Confianza / Legal | 2/10 | 🔴 Crítico para el nicho |
| SEO técnico | 3/10 | 🔴 Faltan elementos básicos |
| Performance | 6/10 | 🟡 Imágenes pesadas |
| Diseño / UX | 7/10 | 🟢 Buena base visual |
| Marketing / Medición | 1/10 | 🔴 Sin analytics ni social proof |

**Fortalezas a conservar:** diseño limpio y coherente, responsive bien resuelto, CSS con variables (fácil de mantener), checkout por WhatsApp apropiado para el mercado, textos con `alt` en imágenes, `lang="es"` correcto.

**Riesgo principal:** el nicho de keys/juegos digitales tiene altísima percepción de estafa, y el sitio hoy no tiene ninguna señal de confianza (reseñas, redes, datos legales). Sumado a que se comparte por WhatsApp sin preview (no hay Open Graph), se están perdiendo ventas en el canal principal.

---

# 1. Hallazgos detallados

## 1.1 🐛 Bugs funcionales (crítico)

| # | Problema | Detalle técnico | Impacto |
|---|----------|-----------------|---------|
| F1 | El buscador no funciona | El `<input type="search">` no tiene ningún listener JS. Es decorativo. | Usuario cree que el sitio está roto |
| F2 | Selector de cantidad no afecta al carrito | `cambiarCantidad()` modifica `#quantity`, pero `agregarCarrito()` nunca lee ese valor: siempre agrega 1 unidad | Funcionalidad engañosa |
| F3 | El carrito no persiste | `let carrito = []` vive solo en memoria. Al recargar la página se pierde todo | Carritos abandonados forzados |
| F4 | Duplicados en el carrito | Agregar 2 veces el mismo juego crea 2 líneas separadas en vez de agrupar "x2" | Total confuso |
| F5 | Links muertos / incorrectos | "Ver todos →" apunta a `#productos` (a sí mismo). "Ayuda" y "Preguntas frecuentes" apuntan a `#beneficios`, que no es FAQ ni ayuda | Credibilidad |
| F6 | Nav de categorías vacío | Solo contiene "PlayStation". Se ve inacabado | Credibilidad |
| F7 | Carrito sin UX básica | No cierra con `Escape`, no hay overlay detrás, no bloquea scroll del body | UX |
| F8 | Archivo con espacio en el nombre | `GOW RAGNAROK.jpg` — mala práctica, riesgo de imagen rota según servidor/contexto | Robustez |

## 1.2 🛡️ Confianza y legal (crítico en el nicho)

| # | Problema | Detalle |
|---|----------|---------|
| C1 | Cero prueba social | Sin reseñas, testimonios ni capturas de clientes. En venta de keys digitales esto es el factor #1 de conversión |
| C2 | Sin redes sociales | Instagram es EL canal del rubro gaming en Argentina. No hay un solo link |
| C3 | Sin páginas legales | No hay términos y condiciones, política de privacidad ni política de reembolso |
| C4 | Incumplimiento Ley 24.240 (ARG) | Falta: botón de arrepentimiento, razón social, CUIT, domicilio. Aplica a todo comercio electrónico argentino |
| C5 | Propuesta de valor ambigua | No se aclara QUÉ recibe el comprador (¿key? ¿cuenta? ¿activación?) ni CÓMO paga. Dice "6 cuotas sin interés" pero el checkout es por WhatsApp: inconsistente |
| C6 | Preventas de juegos no lanzados | GTA VI y EA FC 27 marcados como "PREVENTA". Riesgo reputacional alto si no se aclaran fechas y condiciones exactas de entrega |
| C7 | Textos sin acentos | "catalogo", "instantanea", "atencion", "despues" en todo el sitio. Resta profesionalismo |
| C8 | Solo WhatsApp de contacto | Sin email. Si el número cambia o se bloquea, se pierde el canal |

## 1.3 🔎 SEO técnico

| # | Problema | Verificación |
|---|----------|--------------|
| S1 | Sin favicon | `favicon.ico` → 404 confirmado |
| S2 | Sin `robots.txt` | 404 confirmado |
| S3 | Sin `sitemap.xml` | 404 confirmado |
| S4 | Sin Open Graph / Twitter Cards | Al compartir el link por WhatsApp (canal principal de venta) no aparece imagen ni descripción. **Impacto directo en ventas** |
| S5 | Sin datos estructurados JSON-LD | Sin schema `Product`/`Offer` → Google no muestra precio ni disponibilidad en resultados |
| S6 | Contenido indexable mínimo | 5 productos, poco texto. Sin páginas de producto individuales |
| S7 | Title/description genéricos | "DELUXEGAMES \| Juegos digitales" no diferencia ni incluye keywords de intención de compra |
| S8 | Sin canonical | Menor, pero recomendable |

## 1.4 ⚡ Performance

| # | Problema | Medición real |
|---|----------|---------------|
| P1 | Imágenes JPG pesadas | 303–355 KB c/u, **~1.6 MB total** (95%+ del peso de la página). En WebP serían ~40–80 KB |
| P2 | Google Fonts con `@import` en CSS | Bloquea el renderizado. Debe cargarse con `<link rel="preconnect">` + `<link>` |
| P3 | Imágenes sin dimensiones ni lazy loading | Sin `width`/`height` → CLS (saltos de layout). Sin `loading="lazy"` → todas cargan de entrada |
| P4 | `FC27.jpg` referenciada 2 veces | La cachea el browser, pero indica falta de estrategia de assets |
| ✅ | Punto a favor | CSS/JS inline = 1 sola request; aceptable para one-pager |

## 1.5 📈 Conversión y marketing

| # | Problema |
|---|----------|
| M1 | **Sin analytics**: no hay GA4, Meta Pixel ni Microsoft Clarity. Imposible medir conversiones, embudo ni origen de visitas |
| M2 | Catálogo de solo 5 productos — muy thin para generar confianza |
| M3 | El mensaje de WhatsApp solo lista nombres de juegos, sin precios ni total (el vendedor calcula a mano) |
| M4 | Precio sospechoso: FC 26 a $15.000 vs FC 27 a $95.000 — ✅ **Confirmado por el dueño (2026-10-02): el precio es correcto** |
| M5 | Sin captura de email/newsletter, sin sección de ofertas, sin indicadores de stock ni urgencia |
| M6 | Hero con ilustración CSS en vez de imágenes reales de producto (válido estéticamente, pero las fotos reales convierten más) |

---

# 2. Plan de implementación

## Fase 1 — Quick wins (esfuerzo: ~1 día)

Todo se hace sobre el `index.html` actual. No requiere migración ni backend.

### 1.1 Arreglar el JavaScript del carrito

Reemplazar el `<script>` actual por esta lógica (persistencia + agrupación + cantidad):

```html
<script>
// Estado con persistencia
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

const formatoPrecio = valor => '$' + valor.toLocaleString('es-AR');
const telefonoWhatsApp = '5491127064347';

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Agrega respetando cantidad y agrupa duplicados
function agregarCarrito(nombre, precio, cantidad = 1) {
  const existente = carrito.find(item => item.nombre === nombre);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ nombre, precio, cantidad });
  }
  guardarCarrito();
  actualizarCarrito();
  abrirCarrito();
}

// Desde la sección detalle: respeta el selector de cantidad (fix F2)
function agregarDesdeDetalle(nombre, precio) {
  const cantidad = Math.max(1, Number(document.getElementById('quantity').value) || 1);
  agregarCarrito(nombre, precio, cantidad);
}

function quitarProducto(indice) {
  carrito.splice(indice, 1);
  guardarCarrito();
  actualizarCarrito();
}

function actualizarCarrito() {
  document.getElementById('cartCount').textContent =
    carrito.reduce((n, item) => n + item.cantidad, 0);

  const contenedor = document.getElementById('cartItems');
  contenedor.innerHTML = carrito.length
    ? carrito.map((item, i) => `
        <div class="cart-item">
          <div>
            <strong>${item.nombre}</strong>
            <small>${formatoPrecio(item.precio)} × ${item.cantidad}</small>
          </div>
          <button class="remove" onclick="quitarProducto(${i})">Quitar</button>
        </div>`).join('')
    : '<div class="empty">Todavía no agregaste ningún producto.</div>';

  const total = carrito.reduce((t, item) => t + item.precio * item.cantidad, 0);
  document.getElementById('cartTotal').textContent = formatoPrecio(total);
  actualizarEnlaceWhatsApp(total);
}

// Mensaje con detalle completo: productos, cantidades y total (fix M3)
function actualizarEnlaceWhatsApp(total) {
  let mensaje;
  if (carrito.length) {
    const lineas = carrito
      .map(item => `• ${item.nombre} x${item.cantidad} — ${formatoPrecio(item.precio * item.cantidad)}`)
      .join('\n');
    mensaje = `Hola! Quiero comprar:\n${lineas}\n\nTotal: ${formatoPrecio(total)}`;
  } else {
    mensaje = 'Hola! Quería hacer una consulta.';
  }
  document.getElementById('checkoutLink').href =
    `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;
}

// Overlay + Escape + bloqueo de scroll (fix F7)
function abrirCarrito(event) {
  if (event) event.preventDefault();
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function cerrarCarrito() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('visible');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCarrito(); });

// Buscador funcional con filtro en vivo (fix F1)
document.querySelector('.search input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.product').forEach(card => {
    const nombre = card.querySelector('h3').textContent.toLowerCase();
    const plataforma = card.querySelector('.platform').textContent.toLowerCase();
    card.style.display = (nombre.includes(q) || plataforma.includes(q)) ? '' : 'none';
  });
});

function cambiarCantidad(cambio) {
  const campo = document.getElementById('quantity');
  campo.value = Math.max(1, Number(campo.value) + cambio);
}

// Inicializar al cargar (restaura carrito guardado)
actualizarCarrito();
</script>
```

HTML adicional para el overlay (antes de `</body>`):

```html
<div class="cart-overlay" id="cartOverlay" onclick="cerrarCarrito()"></div>
<style>
.cart-overlay { position:fixed; inset:0; background:rgba(25,17,38,.45); opacity:0; pointer-events:none; transition:opacity .3s; z-index:25; }
.cart-overlay.visible { opacity:1; pointer-events:auto; }
</style>
```

Y en el botón de la sección detalle, cambiar el onclick:
```html
<button class="button" onclick="agregarDesdeDetalle('EA FC 27 STANDARD EDITION',95000)">Sumar al carrito</button>
```

### 1.2 Corregir navegación y textos

- "Ver todos →": eliminarlo (ya se ven todos) o apuntarlo a una futura página de catálogo.
- "Ayuda" → apuntar a una sección FAQ real (ver Fase 2) o directo al WhatsApp.
- Nav de categorías: completar con las reales (`PlayStation · Xbox · PC · Tarjetas`) filtrando con el mismo JS del buscador, o **quitarla** hasta tener catálogo.
- Pasar corrector y agregar todos los acentos: catálogo, instantánea, atención, después, envío, días.

### 1.3 Optimizar imágenes

```powershell
# Con cwebp (https://developers.google.com/speed/webp/download) o https://squoosh.app
cwebp -q 80 GTA5.jpg -o gta5.webp
cwebp -q 80 GTA6.jpg -o gta6.webp
cwebp -q 80 FC27.jpg -o fc27.webp
cwebp -q 80 FC26.jpg -o fc26.webp
cwebp -q 80 "GOW RAGNAROK.jpg" -o gow-ragnarok.webp   # renombra y elimina el espacio
```

Actualizar los `<img>` con dimensiones y lazy loading (evita CLS y carga diferida):

```html
<img src="gta5.webp" alt="GTA V Premium Edition para PS4 y PS5"
     width="600" height="750" loading="lazy" decoding="async">
```

> Resultado esperado: de ~1.6 MB a ~250–350 KB total (~80% menos). La imagen del detalle (`fc27.webp`) puede usar `loading="eager"` por estar above the fold.

### 1.4 Fonts sin bloqueo de render

Reemplazar el `@import` del CSS por esto en el `<head>`, **antes** del `<style>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
```

(Y borrar la línea `@import url(...)` del CSS.)

### 1.5 SEO básico — agregar al `<head>`

```html
<!-- Title/description con intención de compra -->
<title>DELUXEGAMES | Juegos digitales PS4/PS5 baratos en Argentina — Entrega inmediata</title>
<meta name="description" content="Comprá juegos digitales para PS4 y PS5 al mejor precio. Entrega inmediata por WhatsApp, pago por Mercado Pago y soporte todos los días.">
<link rel="canonical" href="https://deluxegames.vercel.app/">

<!-- Open Graph: preview al compartir por WhatsApp/redes (crítico) -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="DELUXEGAMES">
<meta property="og:title" content="DELUXEGAMES | Juegos digitales al mejor precio">
<meta property="og:description" content="Keys y juegos digitales PS4/PS5 con entrega inmediata. Comprá por WhatsApp.">
<meta property="og:url" content="https://deluxegames.vercel.app/">
<meta property="og:image" content="https://deluxegames.vercel.app/og-image.jpg">
<meta property="og:locale" content="es_AR">
<meta name="twitter:card" content="summary_large_image">

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Datos estructurados: Google puede mostrar precios en resultados -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Product",
      "position": 1,
      "name": "GTA V Premium Edition",
      "image": "https://deluxegames.vercel.app/gta5.webp",
      "offers": { "@type": "Offer", "priceCurrency": "ARS", "price": "15000", "availability": "https://schema.org/InStock" }
    }
    // ...repetir por cada producto
  ]
}
</script>
```

**Assets a crear:**
- `og-image.jpg` (1200×630 px, logo + fondo violeta + texto "Juegos digitales · Entrega inmediata")
- `favicon-32x32.png` y `apple-touch-icon.png` (generar en https://realfavicongenerator.net)
- `robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://deluxegames.vercel.app/sitemap.xml
  ```
- `sitemap.xml`:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://deluxegames.vercel.app/</loc><changefreq>weekly</changefreq></url>
  </urlset>
  ```

### 1.6 Analytics (15 minutos, gratis)

```html
<!-- Microsoft Clarity: mapas de calor + grabaciones de sesión -->
<script type="text/javascript">
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","TU_ID");
</script>

<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TU_ID"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-TU_ID');</script>
```

Además: agregar `?utm_source=instagram&utm_medium=bio` etc. a los links que difundas, y medir clics al botón de WhatsApp como evento de conversión:

```js
document.getElementById('checkoutLink').addEventListener('click', () => {
  gtag('event', 'begin_checkout', { items: carrito });
});
```

### Checklist Fase 1 — estado al 2026-10-02 (branch `fase-1-quick-wins`)

- [x] Carrito: persistencia, agrupación, cantidad, overlay, Escape ✅ verificado en código
- [x] Buscador funcional ✅
- [x] Links muertos corregidos + acentos ✅ ("Ayuda"/"Preguntas frecuentes" → WhatsApp; nav de categorías eliminada — decisión ratificada)
- [x] Imágenes a WebP + lazy + dimensiones + renombrar GOW ✅ (896×1152 reales; JPGs eliminados)
- [x] Fonts con preconnect ✅
- [x] OG tags + og-image.jpg ✅ (og-image.jpg 1200×630 generado, 35 KB)
- [x] Favicon + robots.txt + sitemap.xml ✅
- [x] JSON-LD de productos ✅ (5 ítems, precios cruzados contra HTML)
- [ ] Clarity + GA4 + evento de checkout — ⏳ **bloqueado: esperando IDs del usuario**

### Follow-ups detectados en revisión (no bloqueantes — van al lote de componentes)

1. JSON-LD: GTA VI y EA FC 27 figuran `InStock` pero son preventa → cambiar a `https://schema.org/PreOrder` junto al disclaimer de preventa (componente 10 del briefing).
2. Redimensionar WebP a 600px de ancho máximo (~35 KB c/u) — la regla de peso queda reformulada como **<400 KB de carga inicial** (hoy ≈150 KB gracias al lazy loading).
3. Agregar `og:image:width`/`og:image:height` (1200×630) para render instantáneo del preview en WhatsApp.
4. Limpieza cosmética: IDs `#whatsappNav` y `#contactoLink` ya no los usa el JS (quedaron huérfanos).
5. Opcional: `/favicon.ico` clásico como fallback para browsers viejos.

---

## Fase 2 — Confianza y legal (esfuerzo: 2-3 días)

### 2.1 Prueba social

Agregar sección después de `#productos`:

```html
<section class="container content" id="resenas">
  <div class="section-head"><h2>Lo que dicen nuestros clientes</h2></div>
  <!-- 3-6 cards con: nombre, juego comprado, texto, fecha, estrellas -->
</section>
```

**Fuente de reseñas:** pedir a cada comprador por WhatsApp un mensaje de feedback post-entrega y captura permiso para publicarlo. Alternativa escalable: cuenta de Instagram con highlights de "Entregas" y embeber.

### 2.2 Instagram

- Crear/mantener Instagram activo (@deluxegames o similar).
- Agregar icono/link en nav y footer.
- Publicar: entregas reales (con permiso), ofertas, novedades. Es la prueba social más fuerte del rubro.

### 2.3 Sección "¿Cómo compro?" (elimina la ambigüedad C5)

```
1. Elegís tu juego y tocás "Agregar"
2. Confirmás por WhatsApp
3. Pagás por Mercado Pago / transferencia
4. Recibís tu [key / cuenta / activación] en minutos
```

Aclarar explícitamente en cada producto **qué se vende** (key de PSN, cuenta primaria/secundaria, gift card) — es la pregunta #1 del comprador y evita disputes.

### 2.4 Páginas legales (Ley 24.240 — obligatorio en Argentina)

Crear páginas estáticas simples (`/terminos.html`, `/privacidad.html`, `/reembolsos.html`) o secciones ancla:

- **Términos y condiciones:** qué se vende, tiempos de entrega, garantía.
- **Política de reembolso:** condiciones para keys digitales (típicamente: reembolso si la key no funciona, no si ya fue canjeada).
- **Botón de arrepentimiento:** link en footer (obligatorio, Ley 24.240 art. 34 + Decreto 1790/94). Nota: para contenido digital entregado de inmediato hay excepciones, pero el botón y la info deben estar igual.
- **Datos del vendedor en footer:** razón social / nombre, CUIT, domicilio, email.

### 2.5 Preventas responsables (C6)

Para GTA VI / FC 27 agregar texto explícito:

> ⚠️ **Preventa:** el juego se entrega el día de lanzamiento (fecha estimada: XX/XX/XXXX). Si se retrasa, te avisamos y podés pedir reembolso completo.

Sin esto, estas preventas generan más desconfianza que ventas.

### Checklist Fase 2

- [ ] Sección de reseñas con al menos 3 reales
- [ ] Instagram creado + linkeado
- [ ] Sección "¿Cómo compro?"
- [ ] Aclaración key/cuenta en cada producto
- [ ] Términos, privacidad, reembolsos, arrepentimiento
- [ ] Datos del vendedor (CUIT, domicilio) en footer
- [ ] Disclaimer de preventas con fechas y política de reembolso
- [x] Verificar precios (¿FC 26 a $15.000 es correcto?) — ✅ confirmado por el dueño: precio correcto

---

## Fase 3 — Escalar (decisión estratégica)

### 3.1 Catálogo ampliable sin tocar HTML (Opción A — recomendada primero)

Extraer productos a `products.json`:

```json
[
  {
    "id": "gta5",
    "nombre": "GTA V Premium Edition",
    "plataforma": "PS4 · PS5 · Digital",
    "precio": 15000,
    "tag": "DESTACADO",
    "imagen": "gta5.webp",
    "categoria": "playstation",
    "tipo": "Key de PSN"
  }
]
```

Y renderizar con JS al cargar. **Beneficio:** agregar un juego = agregar 8 líneas de JSON, sin tocar HTML. Habilita además filtros por categoría reales (reutilizando la lógica del buscador de Fase 1).

### 3.2 Cobro automático con Mercado Pago

Hoy cada venta requiere coordinación manual por WhatsApp. Opciones en orden de complejidad:

1. **Links de pago de Mercado Pago** (sin programación): crear un link por producto, el botón "Comprar" abre el link. Cobro automático, entrega manual por WhatsApp.
2. **Checkout Pro con Vercel Function** (backend mínimo): una función serverless que crea la preferencia de pago. Webhook confirma el pago → podés disparar entrega automática de la key por email.
3. **Carrito completo con MP** — solo si el volumen lo justifica.

> Beneficio clave: habilita las "6 cuotas sin interés" que ya promocionás (hoy es una promesa incumplible por WhatsApp manual).

### 3.3 Migración (solo cuando el catálogo supere ~20 productos o haya que escalar SEO)

| Opción | Cuándo elegirla | Costo/esfuerzo |
|--------|-----------------|----------------|
| **A. Estático + products.json** | Siempre como primer paso | Mínimo |
| **B. Astro** | Catálogo grande, blog, SEO por producto (`/juegos/gta-v`) | Medio. Genera estático, se deploya en Vercel igual que hoy |
| **C. Tiendanube** | Necesidad de checkout completo, facturación, cuotas, gestión de pedidos sin programar | Bajo esfuerzo técnico, costo mensual. Es el estándar en Argentina |

**Recomendación:** A → Mercado Pago links → evaluar B o C según volumen a los 2-3 meses.

### Checklist Fase 3

- [ ] Migrar productos a `products.json` + render dinámico
- [ ] Categorías reales con filtros (PlayStation / Xbox / PC / Tarjetas)
- [ ] Links de pago Mercado Pago por producto
- [ ] Newsletter/captura de email (Mailchimp gratis hasta 500 contactos)
- [ ] Evaluar Astro o Tiendanube según volumen

---

# 3. Flujo de trabajo sugerido para implementar (repo GitHub → Vercel)

El código vive en GitHub conectado a Vercel. Flujo recomendado:

```powershell
# 1. Clonar el repo
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO

# 2. Crear rama por fase
git checkout -b fase-1-quick-wins

# 3. Aplicar cambios, commit, push
git add .
git commit -m "fix: carrito persistente, buscador funcional, SEO y performance"
git push -u origin fase-1-quick-wins
```

4. Al pushear, **Vercel genera un Preview Deployment automático** → verificar ahí antes de mergear a `main`.
5. Mergear con Pull Request → Vercel deploya a producción solo.
6. Verificar post-deploy: PageSpeed Insights (https://pagespeed.web.dev/), compartir el link por WhatsApp para ver la preview OG, y una compra de prueba end-to-end.

---

# 4. Prioridades en una tabla (qué hacer primero)

| Prioridad | Ítem | Esfuerzo | Impacto |
|-----------|------|----------|---------|
| 🔴 P0 | Open Graph image (preview en WhatsApp) | 30 min | Altísimo |
| 🔴 P0 | Mensaje de WhatsApp con precios y total | 15 min | Alto |
| 🔴 P0 | Buscador + carrito (persistencia, cantidad) | 2 h | Alto |
| 🔴 P0 | Aclarar qué se vende y cómo se paga | 1 h | Alto |
| 🟠 P1 | Reseñas + Instagram | 1 día | Alto |
| 🟠 P1 | Imágenes WebP + fonts | 1 h | Medio (velocidad) |
| 🟠 P1 | Datos legales + arrepentimiento (Ley 24.240) | 2 h | Obligatorio |
| 🟡 P2 | Favicon, robots, sitemap, JSON-LD | 1 h | Medio (SEO) |
| 🟡 P2 | Analytics (Clarity + GA4) | 30 min | Medio |
| 🟢 P3 | products.json + Mercado Pago + migración | 1-2 sem | Crecimiento |

---

*Auditoría realizada sobre el HTML servido en producción el 2026-10-02. Verificaciones de archivos (favicon, robots, sitemap) hechas con requests HTTP directas. Pesos de imágenes medidos por descarga real.*
