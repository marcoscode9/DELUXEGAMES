# Continuación de auditoría y renovación UI

> Esta es la etapa anterior. La implementación actual corresponde al [rediseño completo del 2026-10-03](REDISENO-2026-10-03.md).

Implementado el 2026-10-02 en la rama `fase-2-componentes`. Se conserva el sitio estático en un solo `index.html`, sin frameworks, dependencias de producción ni build.

## Componentes implementados

- Hero violeta oscuro con portadas locales y CTA al catálogo; jerarquía tipográfica y navegación renovadas.
- Tarjetas con portada completa, tipo de producto, plataforma, precio en ARS y acción de compra. Los cinco productos y sus precios se conservan.
- Filtros reales de PS4, PS5, preventas y favoritos, combinables con la búsqueda. Orden por precio o nombre, contador de resultados y estado vacío con reinicio.
- Favoritos persistentes; búsqueda sin distinción de acentos.
- Carrito modal nativo con miniaturas, agrupación, edición de cantidades, persistencia, restauración del foco, ciclo de teclado, Escape y cierre al tocar el fondo. Cantidades entre 1 y 99.
- Al restaurar un carrito, se validan los productos contra el catálogo y se usan los precios actuales; los datos corruptos no bloquean la página. El carrito sigue funcionando si el almacenamiento está bloqueado.
- Mensaje de WhatsApp con formato, cantidades, subtotales, total en ARS y aviso de preventa. La prueba verifica el enlace generado, sin enviar mensajes ni realizar pagos.
- FAQ real con cinco preguntas, acordeones nativos y marcado `FAQPage` coherente con el texto visible.
- Avisos de preventa en tarjetas, detalle, carrito y mensaje de compra. Fecha y condiciones pendientes de confirmación comercial.
- WhatsApp flotante, enlaces correctos al FAQ y canal para solicitar arrepentimiento por WhatsApp. Este canal no sustituye una política legal ni un sistema de seguimiento de solicitudes.
- Open Graph con dimensiones; `ItemList` con `ListItem` y productos, y disponibilidad `PreOrder` para las dos preventas.
- WebP de 600 × 771 px: las cinco portadas bajaron de 453.560 a 226.238 bytes (50,1%). Lazy loading salvo las imágenes del hero, con prioridad en su portada principal.
- Enlace para saltar al catálogo, foco visible, etiquetas accesibles y respeto por movimiento reducido.

## Criterio de referencias

Se adaptan la búsqueda, los filtros y la separación de reservas de [Instant Gaming](https://www.instant-gaming.com/es/), la densidad informativa y el patrón de catálogo de [Eneba](https://www.eneba.com/es/store/games), y la jerarquía de portadas y plataformas de [PlayStation Store](https://store.playstation.com/en-us/category/3f772501-f6f8-49b7-abac-874a88ca4897/122). No se reproducen marcas ni se atribuyen métricas de conversión a estas decisiones.

No se agregan descuentos, reseñas, cifras de ventas ni garantías sin respaldo. Se retiran los textos de entrega inmediata generalizada, cuotas sin interés y compra 100% segura hasta tener condiciones comerciales confirmadas. La cuenta primaria y Mercado Pago/transferencia ya estaban definidos en el sitio; ahora se indica confirmar condiciones antes del pago.

## Verificación

Prueba en Chromium/Edge headless con `tools/verify-ui.cjs`: búsqueda y filtros combinados, estado vacío, orden, persistencia de favoritos, agrupación de carrito, cantidades, recarga, total y mensaje de WhatsApp, Escape, fondo, foco de teclado, almacenamiento inválido y precios manipulados, JSON-LD y ausencia de errores JS. Sin desborde horizontal en 360, 390, 768 y 1440 px. Capturas de escritorio, móvil y carrito revisadas visualmente.

El script requiere Node y Playwright accesible por resolución de módulos (o `NODE_PATH`), y Edge instalado. Ejecutar desde la raíz: `node tools/verify-ui.cjs`. Las capturas se guardan en `docs/previews` o en `UI_PREVIEW_DIR` si se define. No modifica las imágenes ni realiza compras.

## Pendientes que necesitan información del negocio

- Instagram, email, nombre/razón social, CUIT y domicilio.
- Condiciones reales de garantía, entrega, cancelaciones y reembolsos; fechas verificadas de las preventas. Completar términos, privacidad y reembolsos con esos datos y revisión correspondiente. No se considera resuelto el cumplimiento legal.
- Reseñas reales con autorización para publicarlas; validar cifra de ventas antes de reintroducirla.
- IDs GA4 y Clarity. No hay scripts con IDs ficticios ni seguimiento activado.
- Links reales de Mercado Pago, precios diferenciados o cuotas si el negocio los confirma.
- La extracción a `products.json` y ampliación de catálogo permanecen en Fase 3; este lote respeta el briefing de un solo HTML y mantiene el catálogo indexable sin JavaScript.
- Preview de Vercel y compra de prueba posterior a publicación. Este trabajo se verifica localmente; no se publicó ni se fusionó la rama.
