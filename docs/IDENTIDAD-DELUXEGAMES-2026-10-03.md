# DeluxeGames · identidad violeta y tipografía redondeada

Esta iteración adopta las cuatro referencias del usuario y reemplaza la paleta azul/menta de Nebula. Conserva su composición, productos, APIs y sistema de animaciones. La identidad usa negro carbón, superficies de vidrio, violeta luminoso y formas redondeadas en tienda, fichas, checkout, acceso, cuenta y administración.

## Tipografía y marca

**Nunito**, creada originalmente por Vernon Adams y ampliada por Jacques Le Bailly, tiene terminales redondeadas. Se eligió la versión Nunito, distinta de Nunito Sans, para que esa característica se vea en los títulos y controles. Se usan pesos variables 400–900 y números tabulares para precios.

- [Descripción oficial en Google Fonts](https://github.com/google/fonts/blob/main/ofl/nunito/DESCRIPTION.en_us.html).
- [Proyecto de la fuente](https://github.com/googlefonts/nunito).
- Fuente local: `public/assets/fonts/nunito-latin-variable.woff2`, 39.128 bytes. Incluye caracteres y acentos del español.
- Licencia SIL Open Font License incluida en `public/assets/fonts/Nunito-OFL.txt`.

Se retiraron DM Sans, Instrument Serif y la carga externa de Google Fonts. Nunito se precarga y sirve desde la propia aplicación. El isotipo se reconstruyó como SVG a partir del logo adjunto, en `public/assets/deluxegames-mark.svg`, con el mando integrado a la D. La cabecera y el pie combinan el símbolo con Deluxe en peso fuerte y Games en peso ligero. Se conserva la posibilidad de cambiar el nombre de tienda desde administración. El favicon usa el nuevo SVG.

## Referencias adaptadas a las operaciones reales

La portada mantiene los juegos originales en un escenario decorativo con iluminación violeta. La ficha presenta imagen, plataformas PS4/PS5, formato, disponibilidad, precio y compra en dos paneles. Los títulos, botones y datos principales tienen mayor tamaño que en la iteración anterior.

El carrito pasa de un cajón lateral a un **checkout centrado**: resumen, cantidades y total a la izquierda; datos del cliente y creación del pedido a la derecha. En móvil los paneles se apilan y el modal puede desplazarse. Se mantuvieron los identificadores y la lógica de cantidades, persistencia, idempotencia y foco de teclado.

Las opciones Mercado Pago y transferencia describen el pago que se coordina por WhatsApp; no son una pasarela ni campos que simulan un cobro. Crear un pedido conserva el estado pendiente. Las celebraciones de creación, confirmación y entrega siguen basadas en respuestas reales de las APIs. El pago confirmado continúa siendo una operación manual del administrador.

Se preservan entradas escalonadas, profundidad en portadas, filtros con continuidad, feedback de favoritos/carrito, transiciones de modales, check y partículas en confirmaciones. El movimiento reducido sigue funcionando y no se incorporaron popups comerciales automáticos.

## Validación

- `npm test`: 11 pruebas de API, flujos de comprador/administrador y movimiento. Incluyen carga del isotipo y la fuente, foco atrapado en el modal, compra, confirmación, CRUD, stock, ausencia de sobreventa y preferencia de movimiento reducido.
- Checkout y páginas revisados a 360, 390, 768 y 1440 px, sin desbordamiento horizontal. El botón de continuar permanece accesible mediante desplazamiento en móvil.
- Revisión visual de portada, colección, ficha, checkout y móvil; carga local de Nunito y ausencia de errores JavaScript.
- Docker local reconstruido y saludable. Las pruebas usan esquemas de base separados y se limpian al terminar.

Capturas locales de la aplicación real en `.local/previews/deluxe-hero.png`, `deluxe-desktop.png`, `deluxe-detail.png`, `deluxe-checkout.png` y `deluxe-mobile.png`.
