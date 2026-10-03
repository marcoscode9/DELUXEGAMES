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

## Conectar Supabase

En `.env`, completá `SUPABASE_DATABASE_URL` con la URI de **Connect → Direct connection** y `SUPABASE_DB_PASSWORD` con la contraseña de la base. Podés dejar `[YOUR-PASSWORD]` en la URI si pegás la contraseña en el segundo campo: la app la codifica para que los caracteres especiales no rompan la conexión. Usá comillas simples para conservar espacios, `#` y `$` al leer `.env` tanto desde Node como desde Docker Compose.

```dotenv
SUPABASE_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres"
SUPABASE_DB_PASSWORD='TU_PASSWORD'
SUPABASE_DATABASE_SCHEMA=deluxegames
SUPABASE_SSL_CA_FILE=
```

La URI PostgreSQL es distinta de la URL HTTPS del proyecto. No se necesitan claves `anon` ni `service_role`: el servidor mantiene la autenticación y las APIs actuales. El esquema `deluxegames` separa estas tablas de `public` y `auth`; mantenelo fuera de los esquemas expuestos por la Data API.

TLS verifica el certificado y el hostname. Si la conexión requiere la CA del proyecto, descargala desde **Database settings → SSL Configuration**, guardala como `.local/certs/supabase-ca.crt` y completá `SUPABASE_SSL_CA_FILE=.local/certs/supabase-ca.crt`. Esa carpeta está ignorada por Git y montada de solo lectura en Docker. No se desactiva la verificación del servidor.

Después de completar los campos:

```powershell
docker compose --profile full up -d --build --wait
```

La app prioriza Supabase cuando `SUPABASE_DATABASE_URL` tiene valor. Si queda vacío, sigue usando Docker local. `DATABASE_URL` y `POSTGRES_PASSWORD` conservan la base local para las pruebas y los datos existentes. No ejecutes `local:setup` para inicializar Supabase.

Al primer arranque sobre una base nueva se crean tablas y el catálogo original. Los registros y credenciales de Docker no se copian automáticamente. Para crear el administrador en Supabase, completá `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env` y ejecutá `npm.cmd run admin:create`; retiralos del archivo después del alta. Si necesitás llevar pedidos, clientes y ediciones locales, debe migrarse esa base antes de hacer el cambio de uso.

La conexión directa requiere IPv6 o el complemento IPv4 de Supabase. Si tu red no la alcanza, copiá la URI de **Session pooler** desde Connect; también se admite. El modo Transaction en puerto 6543 no sirve para la configuración de sesión de esta app. [Conexiones y SSL en la documentación oficial de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Desplegar en Vercel

La entrada `server.js` y `vercel.json` configuran el backend HTTP completo en Vercel con Node 24 y Fluid Compute. Se incluyen SQL, catálogo, HTML, CSS, módulos y recursos en la función. La carpeta privada `.local` y los `.env` quedan fuera del despliegue. Las conexiones PostgreSQL se reutilizan con un pool de hasta cinco conexiones y el helper oficial `attachDatabasePool`.

Desplegá el commit más reciente de `fase-2-componentes` **como Production**. Redeploy de un deployment viejo vuelve a construir el commit de ese deployment: no incorpora automáticamente commits locales o de otra rama. El commit debe estar en GitHub antes de seleccionarlo en Vercel. El framework Node y la instalación están definidos en `vercel.json`; desactivá cualquier override anterior de Output Directory para que no se publique solo el HTML estático.

En **Settings → Environment Variables**, para Production:

| Variable | Valor |
| --- | --- |
| `APP_URL` | URL HTTPS pública y final de la tienda |
| `SUPABASE_DATABASE_URL` | URI de Connect → Session pooler, puerto 5432 |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base, sin comillas en el campo de Vercel |
| `SUPABASE_DATABASE_SCHEMA` | `deluxegames` |
| `SUPABASE_SSL_CA` | Opcional: contenido PEM completo del certificado raíz descargado de Database settings |

`SUPABASE_SSL_CA` permite validar la CA en Vercel sin apuntar a un archivo de la computadora. Se admiten saltos de línea reales y `\n` literales. En Vercel dejá `SUPABASE_SSL_CA_FILE` sin configurar. TLS mantiene la verificación del servidor; si exige una CA privada, el primer arranque solo funcionará al configurar ese certificado.

El esquema, tablas y cinco productos originales se inicializan al arrancar la función antes de responder solicitudes. Un bloqueo transaccional serializa los arranques simultáneos, incluyendo la creación del esquema. Los siguientes arranques conservan productos editados, usuarios, stock y pedidos. Esto no migra la base local.

El administrador de Docker no existe automáticamente en una base Supabase nueva. Para darlo de alta, completá las mismas variables Supabase y `ADMIN_EMAIL` / `ADMIN_PASSWORD` en el `.env` local, ejecutá `npm.cmd run admin:create` y retiralas después. Vercel no necesita esas dos variables para operar la tienda. No hay una cuenta predeterminada ni contraseñas embebidas en el deploy.

Antes de dar el despliegue por validado, verificá `/api/products`, `/admin` y el login. La conectividad y el certificado reales de Supabase necesitan comprobarse en el primer despliegue; las pruebas locales usan una base separada.

Referencias: [servidores Node en Vercel](https://vercel.com/docs/functions/runtimes/node-js#deploy-a-nodejs-server), [pool de conexiones en Fluid Compute](https://vercel.com/kb/guide/connection-pooling-with-functions).

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
