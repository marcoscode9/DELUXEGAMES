import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { createDatabase } from './db.js';
import { getSession, passwordHash, verifyPassword, publicUser, createSession } from './auth.js';
import { renderPage } from './render.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const money = value => '$' + value.toLocaleString('es-AR');
class ApiError extends Error { constructor(status,message) { super(message); this.status=status; } }
const fail = (status,message) => { throw new ApiError(status,message); };
function text(value, max = 200, required = true) { if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(400,'Revisá los campos del formulario.'); return value.trim(); }
function email(value) { const result = text(value,254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400,'Ingresá un email válido.'); return result; }
function password(value) { if (typeof value !== 'string' || value.length<12 || value.length>128) fail(400,'Usá una contraseña de entre 12 y 128 caracteres.'); return value; }
function integer(value,min,max) { if(!Number.isSafeInteger(value)||value<min||value>max) fail(400,'El valor numérico no es válido.'); return value; }
function imageUrl(value) { value=text(value,1500); if (/^\/((?:gta5|gta6|fc26|fc27|gow-ragnarok)\.webp|api\/media\/[a-f0-9-]{36}|assets\/[a-z0-9_./-]+\.(?:webp|jpg|png))$/.test(value)) return value; try { const u=new URL(value); if(u.protocol==='https:'&&!u.username&&!u.password)return u.href; }catch{} fail(400,'Usá una imagen local o una URL HTTPS.'); }
function validateProduct(body, id) {
  if(!Array.isArray(body.platforms)||!body.platforms.length||body.platforms.some(p=>!['PS4','PS5'].includes(p)))fail(400,'Esta tienda solo admite juegos para PS4 y PS5.');
  const stock=body.stock===null?null:integer(body.stock,0,1000000);
  const releaseDate=text(body.releaseDate||'',10,false);
  if(releaseDate && (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)||Number.isNaN(Date.parse(releaseDate))))fail(400,'Fecha inválida.');
  return {id,name:text(body.name,120),price:integer(body.price,1,100000000),platforms:[...new Set(body.platforms)],type:text(body.type,60),image:imageUrl(body.image),genre:text(body.genre,80),description:text(body.description,3000),preorder:body.preorder===true,featured:body.featured===true,releaseDate,delivery:text(body.delivery,1000),stock};
}
const product = row => ({...row.data,id:row.id,stock:row.stock,active:row.active,version:row.version});
const order = (row, internal=false) => ({id:row.id,userId:row.user_id,name:row.customer_name,email:row.customer_email,items:row.items,total:row.total,status:row.status,...(internal?{note:row.note}:{}),createdAt:row.created_at,updatedAt:row.updated_at});
const audit = (db,actor,action,id,detail={})=>db.query('INSERT INTO audit_log(id,actor_id,action,entity_id,detail) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),actor,action,id,JSON.stringify(detail)]);
async function bodyJson(req) {
  if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Se requiere JSON.');
  let bytes=0;const parts=[];
  for await(const chunk of req){bytes+=chunk.length;if(bytes>3*1024*1024)fail(413,'El archivo o solicitud es demasiado grande.');parts.push(chunk);}
  try { const value=JSON.parse(Buffer.concat(parts).toString()); if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'Solicitud inválida.');return value; } catch {fail(400,'Solicitud JSON inválida.');}
}
export async function createApp(options={}) {
  const directories=['js','css'];
  const entries=await Promise.all(directories.map(directory=>readdir(path.join(root,'public',directory))));
  const assets=['index.html',...entries.flatMap((files,index)=>files.filter(file=>/\.(js|css)$/.test(file)).sort().map(file=>`public/${directories[index]}/${file}`))];
  const sources=await Promise.all(assets.map(file=>readFile(path.join(root,file))));
  const hash=createHash('sha256');sources.forEach(source=>hash.update(source));
  const assetVersion=hash.digest('hex').slice(0,12);
  const appUrl=options.appUrl||process.env.APP_URL||'http://localhost:3000';
  const origin=new URL(appUrl).origin, secure=origin.startsWith('https:');
  const db=createDatabase(options.databaseUrl||process.env.DATABASE_URL,options.schema||process.env.DATABASE_SCHEMA||'public',options.ssl,{max:options.poolMax||10,idleTimeoutMillis:options.poolIdleTimeout||10000});
  try {await db.initialize();}catch(error){await db.close();throw error;}
  // Avoid a fast timing distinction between nonexistent accounts and wrong passwords.
  const dummyHash=await passwordHash(randomBytes(32).toString('hex'));
  async function limit(key,max=20) {
    const r=await db.query("INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,NOW()+INTERVAL '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<NOW() THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<NOW() THEN NOW()+INTERVAL '15 minutes' ELSE rate_limits.reset_at END RETURNING count",[key]);
    if(r.rows[0].count>max)fail(429,'Demasiados intentos. Probá de nuevo en 15 minutos.');
  }
  async function handle(req,res) {
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
    const url=new URL(req.url,origin), route=url.pathname, method=req.method;
    const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
    try {
      if(route.startsWith('/api/')) {
        res.setHeader('Cache-Control','no-store');
        if(!['GET','HEAD'].includes(method)&&req.headers.origin!==origin)fail(403,'Origen de solicitud no permitido.');
        const user=await getSession(db,req);
        const requireUser=()=>{if(!user)fail(401,'Iniciá sesión para continuar.');};
        const requireAdmin=()=>{requireUser();if(user.role!=='admin')fail(403,'Esta operación requiere una cuenta administradora.');};
        const changing=!['GET','HEAD'].includes(method);
        if(changing&&user&&req.headers['x-csrf-token']!==user.csrf)fail(403,'La sesión cambió. Recargá e intentá nuevamente.');
        const ip=req.socket.remoteAddress||'unknown';
        if(route==='/api/session'&&method==='GET')return send(200,{user:user?publicUser(user):null,csrf:user?.csrf||null});
        if(route==='/api/settings'&&method==='GET')return send(200,(await db.query("SELECT value FROM settings WHERE key='store'")).rows[0].value);
        if(route==='/api/products'&&method==='GET')return send(200,{products:(await db.query('SELECT * FROM products WHERE active=true ORDER BY created_at,id')).rows.map(product)});
        if(/^\/api\/media\/[a-f0-9-]{36}$/.test(route)&&method==='GET'){
          const r=await db.query('SELECT mime,bytes FROM media WHERE id=$1',[route.split('/').pop()]);if(!r.rowCount)fail(404,'Imagen no encontrada.');
          res.writeHead(200,{'Content-Type':r.rows[0].mime,'Cache-Control':'public, max-age=31536000, immutable'});res.end(r.rows[0].bytes);return;
        }
        if(['/api/register','/api/login'].includes(route)&&method==='POST'){
          await limit(`auth:${ip}`,30);const b=await bodyJson(req), mail=email(b.email), pass=password(b.password);
          if(route==='/api/register'){
            if(b.role&&b.role!=='customer')fail(400,'El registro público crea cuentas de clientes.');
            const name=text(b.name,80), id=randomUUID(),hash=await passwordHash(pass);
            const r=await db.query("INSERT INTO users(id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,'customer') ON CONFLICT(email) DO NOTHING RETURNING *",[id,mail,name,hash]);
            if(!r.rowCount)fail(409,'No pudimos crear esa cuenta. Probá iniciar sesión.');
            return send(201,await createSession(db,r.rows[0],res,secure));
          }
          const r=await db.query('SELECT * FROM users WHERE email=$1',[mail]),record=r.rows[0];
          if(!await verifyPassword(pass,record?.password_hash||dummyHash)||!record||(b.admin===true&&record.role!=='admin'))fail(401,'Email o contraseña incorrectos.');
          if(user)await db.query('DELETE FROM sessions WHERE token_hash=$1',[user.token_hash]);
          return send(200,await createSession(db,record,res,secure));
        }
        if(route==='/api/logout'&&method==='POST'){
          if(user)await db.query('DELETE FROM sessions WHERE token_hash=$1',[user.token_hash]);
          res.setHeader('Set-Cookie',`dg_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`);return send(200,{ok:true});
        }
        if(route==='/api/profile'&&method==='PATCH'){
          requireUser();const b=await bodyJson(req),name=text(b.name,80);
          await db.query('UPDATE users SET name=$1 WHERE id=$2',[name,user.id]);return send(200,{user:{...publicUser(user),name}});
        }
        if(route==='/api/password'&&method==='POST'){
          requireUser();await limit(`password:${user.id}`,10);const b=await bodyJson(req),pass=password(b.password);
          if(!await verifyPassword(text(b.currentPassword,128),user.password_hash))fail(401,'La contraseña actual es incorrecta.');
          await db.tx(async c=>{await c.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await passwordHash(pass),user.id]);await c.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[user.id,user.token_hash]);});return send(200,{ok:true});
        }
        if(route==='/api/favorites'&&method==='GET'){requireUser();return send(200,{ids:(await db.query('SELECT product_id FROM favorites WHERE user_id=$1',[user.id])).rows.map(r=>r.product_id)});}
        if(route==='/api/favorites'&&method==='PUT'){
          requireUser();const b=await bodyJson(req);if(!Array.isArray(b.ids)||b.ids.length>500||b.ids.some(id=>typeof id!=='string'||id.length>80))fail(400,'Favoritos inválidos.');
          await db.tx(async c=>{await c.query('DELETE FROM favorites WHERE user_id=$1',[user.id]);await c.query('INSERT INTO favorites(user_id,product_id) SELECT $1,id FROM products WHERE id=ANY($2::text[]) AND active=true',[user.id,[...new Set(b.ids)]]);});return send(200,{ok:true});
        }
        if(route==='/api/orders'&&method==='GET'){requireUser();return send(200,{orders:(await db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[user.id])).rows.map(o=>order(o))});}
        if(route==='/api/orders'&&method==='POST'){
          await limit(`order:${user?.id||ip}`,40);const b=await bodyJson(req);
          const name=user?.name||text(b.name,80),mail=user?.email||email(b.email),key=text(b.key,80);
          if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))fail(400,'Identificador de pedido inválido.');
          if(!Array.isArray(b.items)||!b.items.length||b.items.length>50)fail(400,'El carrito está vacío o es demasiado grande.');
          const grouped=new Map();for(const item of b.items){const id=text(item.id,80),qty=integer(item.quantity,1,99);grouped.set(id,(grouped.get(id)||0)+qty);if(grouped.get(id)>99)fail(400,'Máximo 99 unidades por juego.');}
          const result=await db.tx(async c=>{
            await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`order:${key}`]);
            const existing=await c.query('SELECT * FROM orders WHERE idempotency_key=$1',[key]);
            if(existing.rowCount){const o=existing.rows[0];if(o.user_id!==(user?.id||null)||o.customer_email!==mail)fail(409,'Identificador de pedido ya usado.');return o;}
            const items=[];
            for(const [id,quantity]of grouped){const r=await c.query('SELECT * FROM products WHERE id=$1 AND active=true FOR SHARE',[id]);if(!r.rowCount)fail(409,'Un juego ya no está disponible. Actualizá el carrito.');const p=product(r.rows[0]);if(p.stock!==null&&p.stock<quantity)fail(409,`Stock insuficiente para ${p.name}.`);items.push({id,name:p.name,price:p.price,quantity,preorder:p.preorder,type:p.type,image:p.image});}
            const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
            const r=await c.query('INSERT INTO orders(id,user_id,customer_name,customer_email,items,total,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),user?.id||null,name,mail,JSON.stringify(items),total,key]);return r.rows[0];
          });
          const settings=(await db.query("SELECT value FROM settings WHERE key='store'")).rows[0].value;
          const message=`Hola! Quiero confirmar el pedido ${result.id.slice(0,8).toUpperCase()}:\n${result.items.map(i=>`• ${i.name}${i.preorder?' [PREVENTA]':''} · ${i.type} x${i.quantity} — ${money(i.price*i.quantity)}`).join('\n')}\n\nTotal: ${money(result.total)} ARS\nNombre: ${result.customer_name}${result.items.some(i=>i.preorder)?'\nQuiero confirmar las fechas y condiciones de preventa antes de pagar.':''}`;
          return send(201,{order:order(result),whatsappUrl:`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`});
        }
        if(route.startsWith('/api/admin/')){
          requireAdmin();
          if(route==='/api/admin/products'&&method==='GET')return send(200,{products:(await db.query('SELECT * FROM products ORDER BY created_at DESC')).rows.map(product)});
          if(route==='/api/admin/overview'&&method==='GET'){
            const [products,orders,customers,movements]=await Promise.all([db.query('SELECT * FROM products'),db.query('SELECT * FROM orders ORDER BY created_at DESC'),db.query("SELECT u.id,u.name,u.email,u.created_at,COUNT(o.id)::int AS orders FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC"),db.query('SELECT s.*,p.data->>\'name\' AS product_name FROM stock_movements s LEFT JOIN products p ON p.id=s.product_id ORDER BY s.created_at DESC LIMIT 100')]);
            return send(200,{products:products.rows.map(product),orders:orders.rows.map(o=>order(o,true)),customers:customers.rows,movements:movements.rows});
          }
          if(route==='/api/admin/products'&&method==='POST'){
            const b=await bodyJson(req),id=randomUUID(),p=validateProduct(b,id);
            const r=await db.tx(async c=>{const r=await c.query('INSERT INTO products(id,data,stock,active) VALUES($1,$2,$3,$4) RETURNING *',[id,JSON.stringify(p),p.stock,b.active!==false]);await audit(c,user.id,'product.create',id);return r;});return send(201,{product:product(r.rows[0])});
          }
          const edit=route.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
          if(edit&&['PATCH','DELETE'].includes(method)){
            const b=await bodyJson(req),version=integer(b.version,1,100000000),id=edit[1];
            const p=method==='PATCH'?validateProduct(b,id):null;
            const r=await db.tx(async c=>{
              const old=await c.query('SELECT * FROM products WHERE id=$1 FOR UPDATE',[id]);if(!old.rowCount)fail(404,'Publicación no encontrada.');if(old.rows[0].version!==version)fail(409,'La publicación cambió en otra sesión. Recargá antes de guardar.');
              const result=method==='DELETE'?await c.query('UPDATE products SET active=false,version=version+1,updated_at=NOW() WHERE id=$1 RETURNING *',[id]):await c.query('UPDATE products SET data=$1,stock=$2,active=$3,version=version+1,updated_at=NOW() WHERE id=$4 RETURNING *',[JSON.stringify(p),p.stock,b.active!==false,id]);
              if(p&&old.rows[0].stock!==p.stock){await c.query('INSERT INTO stock_movements(id,product_id,actor_id,delta,resulting_stock,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),id,user.id,(p.stock||0)-(old.rows[0].stock||0),p.stock,'Edición de publicación']);}
              await audit(c,user.id,method==='DELETE'?'product.archive':'product.edit',id);return result;
            });return send(200,{product:product(r.rows[0])});
          }
          const stock=route.match(/^\/api\/admin\/products\/([a-z0-9-]+)\/stock$/);
          if(stock&&method==='POST'){
            const b=await bodyJson(req),delta=integer(b.delta,-1000000,1000000),reason=text(b.reason,300),version=integer(b.version,1,100000000);
            const r=await db.tx(async c=>{const r=await c.query('SELECT * FROM products WHERE id=$1 FOR UPDATE',[stock[1]]);if(!r.rowCount)fail(404,'Juego no encontrado.');const p=r.rows[0];if(p.version!==version)fail(409,'El stock cambió. Recargá los datos.');const next=(p.stock||0)+delta;if(next<0||next>1000000)fail(400,'El stock resultante no es válido.');const updated=await c.query('UPDATE products SET stock=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *',[next,p.id]);await c.query('INSERT INTO stock_movements(id,product_id,actor_id,delta,resulting_stock,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),p.id,user.id,delta,next,reason]);await audit(c,user.id,'stock.adjust',p.id,{delta,next,reason});return updated;});return send(200,{product:product(r.rows[0])});
          }
          const status=route.match(/^\/api\/admin\/orders\/([a-f0-9-]{36})$/);
          if(status&&method==='PATCH'){
            const b=await bodyJson(req);if(!['pending','confirmed','delivered','cancelled'].includes(b.status))fail(400,'Estado inválido.');const note=text(b.note||'',2000,false);
            const o=await db.tx(async c=>{
              const r=await c.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[status[1]]);if(!r.rowCount)fail(404,'Pedido no encontrado.');const old=r.rows[0];
              const allowed={pending:['confirmed','cancelled'],confirmed:['delivered','cancelled'],delivered:[],cancelled:[]};
              if(old.status!==b.status&&!allowed[old.status].includes(b.status))fail(409,'Transición de estado no permitida.');
              if(old.status!==b.status&&((old.status==='pending'&&b.status==='confirmed')||(old.status==='confirmed'&&b.status==='cancelled'))){
                for(const item of [...old.items].sort((a,b)=>a.id.localeCompare(b.id))){
                  const r=await c.query('SELECT * FROM products WHERE id=$1 FOR UPDATE',[item.id]);const p=r.rows[0];if(!p)fail(409,'El producto del pedido ya no existe.');
                  if(p.stock===null)continue;
                  const delta=b.status==='confirmed'?-item.quantity:item.quantity,next=p.stock+delta;
                  if(next<0)fail(409,`No alcanza el stock de ${item.name}.`);
                  await c.query('UPDATE products SET stock=$1,version=version+1,updated_at=NOW() WHERE id=$2',[next,p.id]);
                  await c.query('INSERT INTO stock_movements(id,product_id,actor_id,delta,resulting_stock,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),p.id,user.id,delta,next,`Pedido ${old.id.slice(0,8)} · ${b.status}`]);
                }
              }
              const result=await c.query('UPDATE orders SET status=$1,note=$2,updated_at=NOW() WHERE id=$3 RETURNING *',[b.status,note,old.id]);await audit(c,user.id,'order.status',old.id,{from:old.status,to:b.status});return result.rows[0];
            });return send(200,{order:order(o,true)});
          }
          if(route==='/api/admin/media'&&method==='POST'){
            const b=await bodyJson(req);if(!['image/jpeg','image/png','image/webp'].includes(b.mime)||typeof b.data!=='string'||!b.data.length||!/^[A-Za-z0-9+/]*={0,2}$/.test(b.data))fail(400,'Subí una imagen JPG, PNG o WebP.');
            const bytes=Buffer.from(b.data,'base64');if(bytes.length>2*1024*1024||bytes.length<12)fail(400,'La imagen debe pesar menos de 2 MB.');
            const valid=b.mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:b.mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)fail(400,'El archivo no coincide con el formato de imagen.');
            const id=randomUUID();await db.query('INSERT INTO media(id,mime,bytes) VALUES($1,$2,$3)',[id,b.mime,bytes]);return send(201,{url:`/api/media/${id}`});
          }
          if(route==='/api/admin/settings'&&method==='PUT'){
            const b=await bodyJson(req);if(!/^\d{8,15}$/.test(b.whatsapp))fail(400,'Ingresá un número de WhatsApp internacional sin símbolos.');
            const value={storeName:text(b.storeName,60),whatsapp:b.whatsapp,supportEmail:b.supportEmail?email(b.supportEmail):'',instagram:text(b.instagram||'',300,false),deliveryNote:text(b.deliveryNote,500)};
            if(value.instagram&&!/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.\/-]+$/.test(value.instagram))fail(400,'URL de Instagram inválida.');
            await db.tx(async c=>{await c.query("UPDATE settings SET value=$1 WHERE key='store'",[JSON.stringify(value)]);await audit(c,user.id,'settings.edit','store');});return send(200,value);
          }
        }
        fail(404,'Operación no encontrada.');
      }
      if(!['GET','HEAD'].includes(method))fail(405,'Método no permitido.');
      let file;
      if(['/', '/cuenta', '/admin'].includes(route))file=path.join(root,'index.html');
      else if(/^\/(?:assets|css|js)\/[a-zA-Z0-9_./-]+$/.test(route)&&!route.includes('..'))file=path.join(root,'public',route);
      else if(/^\/(?:gta5\.webp|gta6\.webp|fc26\.webp|fc27\.webp|gow-ragnarok\.webp|og-image\.jpg|favicon-32x32\.png|apple-touch-icon\.png|robots\.txt|sitemap\.xml)$/.test(route))file=path.join(root,route);
      else fail(404,'Página no encontrada.');
      let bytes;try{bytes=await readFile(file);}catch{fail(404,'Archivo no encontrado.');}
      if(path.extname(file)==='.html')bytes=Buffer.from(renderPage(bytes.toString(),(await db.query('SELECT * FROM products WHERE active=true ORDER BY created_at,id')).rows.map(product),assetVersion));
      if(path.extname(file)==='.js')bytes=Buffer.from(bytes.toString().replace(/(from\s+|import\s+)(['"])(\.\/[a-zA-Z0-9_-]+\.js)\2/g,(_,prefix,quote,target)=>`${prefix}${quote}${target}?v=${assetVersion}${quote}`));
      const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.txt':'text/plain','.xml':'application/xml','.mp4':'video/mp4','.woff2':'font/woff2','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':['.html','.js','.css'].includes(path.extname(file))?'no-cache':'public, max-age=3600'});res.end(method==='HEAD'?undefined:bytes);
    }catch(e){if(e.status)return send(e.status,{error:e.message});console.error('Request failed:',e.code||e.name);return send(500,{error:'No pudimos completar la operación. Intentá nuevamente.'});}
  }
  const server=http.createServer(handle);server.requestTimeout=30000;server.headersTimeout=15000;
  return {server,db,close:async()=>{await new Promise(r=>server.close(r));await db.close();}};
}
