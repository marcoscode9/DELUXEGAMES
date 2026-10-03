import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {createApp} from '../server/app.js';
import {bootstrapAdmin} from '../server/auth.js';
let app,base,admin,customer,product,orderId;
const schema='test_'+randomUUID().replaceAll('-','');
const adminPass='Test-admin-password-4321',customerPass='Test-customer-password-4321';
async function request(path,method='GET',body,user=null,extra={}){
  const headers={'Content-Type':'application/json',Origin:base};if(user){headers.Cookie=user.cookie;headers['X-CSRF-Token']=user.csrf;}Object.assign(headers,extra);
  const r=await fetch(base+'/api'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const json=await r.json();return {status:r.status,body:json,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
}
before(async()=>{base='http://localhost:3199';app=await createApp({schema,appUrl:base});await new Promise(r=>app.server.listen(3199,'127.0.0.1',r));await bootstrapAdmin(app.db,'admin@test.local',adminPass);});
after(async()=>{await app.close();const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();});
test('existing products and prices are preserved',async()=>{const r=await request('/products');assert.equal(r.status,200);assert.equal(r.body.products.length,5);assert.deepEqual(r.body.products.map(p=>[p.id,p.price]).sort(),[['fc26',15000],['fc27',95000],['gow-ragnarok',40000],['gta5',15000],['gta6',90000]]);assert.ok(r.body.products.every(p=>p.stock===null));});
test('registration cannot grant admin; auth, cookies, CSRF and role checks',async()=>{
  assert.equal((await request('/register','POST',{email:'evil@test.local',name:'Evil',password:customerPass,role:'admin'})).status,400);
  const r=await request('/register','POST',{email:'customer@test.local',name:'Cliente de prueba',password:customerPass});assert.equal(r.status,201);customer={cookie:r.cookie,csrf:r.body.csrf};assert.equal(r.body.user.role,'customer');assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));assert.ok(r.headers.get('set-cookie').includes('SameSite=Lax'));
  assert.equal((await request('/admin/overview')).status,401);assert.equal((await request('/admin/overview','GET',undefined,customer)).status,403);
  assert.equal((await request('/profile','PATCH',{name:'X'},customer,{'X-CSRF-Token':'bad'})).status,403);
  assert.equal((await request('/register','POST',{email:'cross@test.local',name:'X',password:customerPass},null,{Origin:'https://evil.example'})).status,403);
  assert.equal((await request('/login','POST',{email:'admin@test.local',password:'Incorrect-password-12',admin:true})).status,401);
  const a=await request('/login','POST',{email:'admin@test.local',password:adminPass,admin:true});assert.equal(a.status,200);admin={cookie:a.cookie,csrf:a.body.csrf};
});
test('admin CRUD, version conflict, upload and stock movements',async()=>{
  const body={name:'Juego de prueba',price:12000,platforms:['PS5'],type:'Cuenta primaria',image:'/gta5.webp',genre:'Acción',description:'Descripción de prueba',preorder:false,featured:false,stock:3,releaseDate:'',delivery:'Consultar condiciones',active:true};
  for(const unsupported of ['PC','Xbox','Nintendo Switch'])assert.equal((await request('/admin/products','POST',{...body,platforms:['PS5',unsupported]},admin)).status,400,'Only PS4/PS5 publications are accepted');
  const r=await request('/admin/products','POST',body,admin);assert.equal(r.status,201);product=r.body.product;
  const edit=await request('/admin/products/'+product.id,'PATCH',{...product,name:'Juego editado'},admin);assert.equal(edit.status,200);assert.equal(edit.body.product.name,'Juego editado');
  assert.equal((await request('/admin/products/'+product.id,'PATCH',product,admin)).status,409);product=edit.body.product;
  assert.equal((await request('/admin/products/'+product.id+'/stock','POST',{delta:-9,version:product.version,reason:'Inválido'},admin)).status,400);
  const stock=await request('/admin/products/'+product.id+'/stock','POST',{delta:2,version:product.version,reason:'Reposición'},admin);assert.equal(stock.status,200);product=stock.body.product;assert.equal(product.stock,5);
  const bytes=await readFile(new URL('../gta5.webp',import.meta.url));const media=await request('/admin/media','POST',{mime:'image/webp',data:bytes.toString('base64')},admin);assert.equal(media.status,201);assert.equal((await fetch(base+media.body.url)).status,200);
  assert.equal((await request('/admin/media','POST',{mime:'image/svg+xml',data:Buffer.from('<svg/>').toString('base64')},admin)).status,400);
  assert.equal((await request('/admin/products','POST',{...body,image:'javascript:alert(1)'},admin)).status,400);
});
test('favorites and customer order: prices come from server, idempotency, ownership',async()=>{
  assert.equal((await request('/favorites','PUT',{ids:['gta5','gta6']},customer)).status,200);assert.deepEqual((await request('/favorites','GET',undefined,customer)).body.ids.sort(),['gta5','gta6']);
  const b={items:[{id:product.id,quantity:2,price:1},{id:'gta6',quantity:1}],key:randomUUID()};
  const r=await request('/orders','POST',b,customer);assert.equal(r.status,201);assert.equal(r.body.order.total,114000);assert.ok(decodeURIComponent(r.body.whatsappUrl).includes('[PREVENTA]'));orderId=r.body.order.id;
  const duplicate=await request('/orders','POST',b,customer);assert.equal(duplicate.body.order.id,orderId);assert.equal((await request('/orders','GET',undefined,customer)).body.orders.length,1);
  assert.equal((await request('/orders','GET',undefined,admin)).body.orders.length,0);
  assert.equal((await request('/orders','POST',{items:[{id:product.id,quantity:99}],key:randomUUID()},customer)).status,409);
});
test('confirmation decrements stock once, cancellation restores it, invalid transition denied',async()=>{
  const confirm=await request('/admin/orders/'+orderId,'PATCH',{status:'confirmed',note:'Pago verificado manualmente'},admin);assert.equal(confirm.status,200);
  assert.ok((await request('/orders','GET',undefined,customer)).body.orders.every(o=>!('note' in o)));
  let p=(await request('/products')).body.products.find(p=>p.id===product.id);assert.equal(p.stock,3);
  await request('/admin/orders/'+orderId,'PATCH',{status:'confirmed',note:'Nota'},admin);p=(await request('/products')).body.products.find(p=>p.id===product.id);assert.equal(p.stock,3);
  const cancel=await request('/admin/orders/'+orderId,'PATCH',{status:'cancelled',note:'Cancelado'},admin);assert.equal(cancel.status,200);p=(await request('/products')).body.products.find(p=>p.id===product.id);assert.equal(p.stock,5);
  assert.equal((await request('/admin/orders/'+orderId,'PATCH',{status:'confirmed'},admin)).status,409);
});
test('concurrent confirmations cannot oversell inventory',async()=>{
  const make=()=>request('/orders','POST',{items:[{id:product.id,quantity:4}],key:randomUUID()},customer);
  const a=await make(),b=await make();const results=await Promise.all([a,b].map(r=>request('/admin/orders/'+r.body.order.id,'PATCH',{status:'confirmed'},admin)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await request('/products')).body.products.find(p=>p.id===product.id).stock,1);
});
test('archive hides product but preserves past order, profile/password/logout',async()=>{
  product=(await request('/admin/products','GET',undefined,admin)).body.products.find(p=>p.id===product.id);
  assert.equal((await request('/admin/products/'+product.id,'DELETE',{version:product.version},admin)).status,200);assert.ok(!(await request('/products')).body.products.some(p=>p.id===product.id));
  assert.equal((await request('/profile','PATCH',{name:'Nombre actualizado'},customer)).status,200);
  assert.equal((await request('/password','POST',{currentPassword:customerPass,password:'New-password-test-1234'},customer)).status,200);
  assert.equal((await request('/logout','POST',{},customer)).status,200);assert.equal((await request('/orders','GET',undefined,customer)).status,401);
});
test('server never serves environment, database, source or private credentials',async()=>{for(const path of ['/.env','/.local/admin-access.txt','/server/auth.js','/package.json'])assert.equal((await fetch(base+path)).status,404);});
test('UI assets use the same content version and revalidate after a redesign',async()=>{
  const html=await (await fetch(base)).text(),version=html.match(/src="\/js\/app\.js\?v=([a-f0-9]{12})"/)?.[1];
  assert.ok(version);assert.ok(html.includes('/css/nebula.css?v='+version));
  const response=await fetch(base+'/js/app.js?v='+version),source=await response.text();
  assert.equal(response.headers.get('cache-control'),'no-cache');
  assert.ok(source.includes('./store.js?v='+version));assert.ok(source.includes('./motion.js?v='+version));
});
