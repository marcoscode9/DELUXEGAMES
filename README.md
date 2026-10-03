# DELUXEGAMES

Ecommerce local de juegos digitales, con tienda, cuentas de clientes y panel de administración. Node.js 24 + PostgreSQL 17 en Docker, HTML/CSS/JavaScript modular, sin framework ni compilación de frontend.

## Abrir la tienda

Primera configuración (Docker Desktop iniciado y Node 24 instalado):

```powershell
npm.cmd ci
npm.cmd run local:setup
docker compose --profile full up -d --build --wait
```

- Tienda: http://localhost:3000/
- Cuenta de cliente: http://localhost:3000/cuenta
- Administración: http://localhost:3000/admin
- Credenciales iniciales del administrador: `.local/admin-access.txt`. Se generan aleatoriamente una vez; no se publican en Git ni se sirven por HTTP. Cambiá la contraseña desde **Mi cuenta → Mi perfil**.

Para volver a iniciar: `docker compose --profile full up -d --wait`. Para detener sin borrar datos: `docker compose --profile full stop`. El volumen `deluxegames_deluxe-data` conserva catálogo, clientes, imágenes, sesiones y pedidos. No uses `down -v` si querés conservarlos.

Durante desarrollo, se puede ejecutar solo la base con `docker compose up -d --wait` y la aplicación con `npm.cmd run dev`. Detené previamente el contenedor app para liberar el puerto 3000. Tras editar fuentes con la app en Docker, reconstruí: `docker compose --profile full up -d --build --wait`.

## Operaciones

**Cliente:** registro, login, cierre de sesión, perfil, cambio de contraseña, favoritos asociados a la cuenta, fichas de juego, carrito persistente, pedidos e historial. También se permite comprar como invitado indicando nombre y email.

**Administrador:** resumen con datos reales, publicaciones, búsqueda, creación, edición de precios y contenido, imágenes locales/HTTPS o subida a la base, plataformas, tipo de producto, destacados, preventas, fechas y condiciones de entrega. Puede retirar una publicación y volver a publicarla desde el editor. La eliminación es lógica para preservar pedidos e historial.

**Inventario:** reposiciones y retiros con motivo e historial; stock por producto y control de ediciones simultáneas. El stock inicial está sin cuantificar (`null`), porque no había unidades confirmadas. No se inventa inventario. `0` indica agotado. Para empezar, ingresá stock desde Inventario o la ficha.

**Pedidos:** nuevos pedidos en estado “A confirmar”, precio calculado en servidor, detalle completo para WhatsApp y deduplicación de reintentos. Confirmar descuenta stock; cancelar un confirmado lo repone. Marcar entregado requiere un pedido confirmado. Los pendientes no reservan stock. Confirmaciones concurrentes usan bloqueos y transacciones de PostgreSQL para evitar sobreventa de stock cuantificado.

**Configuración:** nombre comercial, WhatsApp, email, Instagram e información de entrega. Los enlaces del sitio y el checkout toman esos datos. No se activan tracking ni cuotas que no hayan sido configurados.

## Integraciones conservadas

- WhatsApp `wa.me`, número inicial `5491127064347`; el checkout registra el pedido y presenta un enlace para enviar el mensaje. No envía mensajes automáticamente.
- Nunito variable alojada localmente, con su licencia SIL Open Font License incluida.
- Mercado Pago y transferencia siguen siendo pagos coordinados por WhatsApp. No había credenciales, SDK ni una API de cobro en el repo original, por lo que no se simula una integración de pago automático.
- Se mantienen los cinco juegos, sus precios y portadas. `data/products.json` es el seed inicial; después, el panel y la base de datos son la fuente de verdad. Reiniciar no restablece ediciones ni recrea publicaciones retiradas.

## Pruebas

```powershell
npm.cmd test
```

Se requiere PostgreSQL activo y Edge instalado para las pruebas de navegador. Cada ejecución crea esquemas de prueba independientes y los elimina al finalizar; no modifica la tienda real. Incluye roles, cookies, CSRF, precios del servidor, idempotencia, CRUD, cargas de imágenes, stock, confirmación concurrente, cancelación, perfil/contraseña, archivos privados, y recorrido completo de cliente/admin en navegador. Se verifica que no haya desborde horizontal en 360, 390, 768 y 1440 px. Capturas en `.local/previews`.

## Estructura

- `index.html`: shell semántico y diálogos.
- `public/css/store.css`: sistema visual y responsive.
- `public/js/`: módulos de tienda, cuenta, administración y API/estado compartido.
- `server/`: servidor HTTP, autenticación, validación, transacciones, persistencia y render inicial/SEO.
- `data/products.json`: catálogo original para inicialización.
- `tests/`: pruebas API y navegador.
- `compose.yaml`: PostgreSQL y app local opcional (`full`).

## Seguridad y alcance local

Contraseñas con scrypt y sal aleatoria; sesiones opacas en cookies HttpOnly/SameSite, hash del token en base, expiración y revocación. Cambios protegidos por origen y CSRF; autorización admin verificada en cada operación del servidor; consultas parametrizadas; límites de tamaño/tipo de imágenes y de intentos; CSP y rutas estáticas explícitas. Las notas internas de pedidos no se exponen al cliente.

Este entorno está publicado solo en la interfaz local de la computadora. El sitio original en Vercel no se modificó. Para producción se requiere hosting de Node/PostgreSQL o un adaptador equivalente, HTTPS, una política de backups y el resto de datos/condiciones comerciales de la auditoría. No se montó una recuperación de contraseña por email sin proveedor de correo; el administrador puede cambiar su contraseña desde una sesión válida, y `admin:create` permite crear un administrador adicional con `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno.

Dirección visual vigente y referencias: [Identidad DeluxeGames](docs/IDENTIDAD-DELUXEGAMES-2026-10-03.md).
