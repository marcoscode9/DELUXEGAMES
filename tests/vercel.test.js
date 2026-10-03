import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {createDatabase} from '../server/db.js';

async function removeSchema(schema){
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
  try{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);}finally{await pool.end();}
}

test('concurrent cold starts create the schema once and preserve catalog edits',async()=>{
  const schema='cold_'+randomUUID().replaceAll('-','');
  const a=createDatabase(process.env.DATABASE_URL,schema),b=createDatabase(process.env.DATABASE_URL,schema);
  try{
    await Promise.all([a.initialize(),b.initialize()]);
    assert.equal(Number((await a.query('SELECT count(*) FROM products')).rows[0].count),5);
    await a.query("UPDATE products SET data=jsonb_set(data,'{price}','12345') WHERE id='gta5'");
    await Promise.all([a.initialize(),b.initialize()]);
    assert.equal((await b.query("SELECT data FROM products WHERE id='gta5'")).rows[0].data.price,12345);
  }finally{await a.close();await b.close();await removeSchema(schema);}
});

test('Vercel API entrypoint reports safe startup failures, retries and serves storefront and APIs',{timeout:30000},async(t)=>{
  const schema='vercel_'+randomUUID().replaceAll('-','');
  const keys=['SUPABASE_DATABASE_URL','SUPABASE_DB_PASSWORD','DATABASE_URL','DATABASE_SCHEMA','PORT','APP_URL','VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL'];
  const saved=new Map(keys.map(key=>[key,process.env[key]]));let app,server;
  try{
    process.env.SUPABASE_DATABASE_URL='';process.env.SUPABASE_DB_PASSWORD='';process.env.DATABASE_SCHEMA=schema;
    process.env.PORT='0';process.env.APP_URL='http://localhost';process.env.VERCEL='1';process.env.VERCEL_ENV='production';
    delete process.env.VERCEL_URL;delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
    assert.equal(config.framework,null);
    for(const entry of Object.keys(config.functions))await readFile(new URL('../'+entry,import.meta.url));
    assert.deepEqual(config.routes,[{src:'/(.*)',dest:'/api/index.js'}]);
    const {default:handler,getApp}=await import('../api/index.js');
    // Emulate Vercel's JSON helper for requests to /api/login only.
    server=http.createServer(async(req,res)=>{
      if(req.url==='/api/login'){
        const chunks=[];for await(const chunk of req)chunks.push(chunk);
        req.body=JSON.parse(Buffer.concat(chunks).toString());
      }
      await handler(req,res);
    });
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const base=`http://127.0.0.1:${server.address().port}`;
    const logs=[];const logMock=t.mock.method(console,'error',(...args)=>logs.push(args.join(' ')));
    delete process.env.APP_URL;
    const missingAppUrl=await fetch(base);
    assert.equal(missingAppUrl.status,503);assert.equal(missingAppUrl.headers.get('cache-control'),'no-store');
    assert.equal((await missingAppUrl.json()).reference,'DG-APP-URL');
    process.env.APP_URL='http://localhost';
    const databaseUrl=process.env.DATABASE_URL;delete process.env.DATABASE_URL;
    const missingDatabase=await fetch(base+'/api/products');
    assert.equal(missingDatabase.status,503);
    const failure=await missingDatabase.json();assert.equal(failure.reference,'DG-DB-URL');
    assert.deepEqual(Object.keys(failure).sort(),['error','reference']);
    assert.ok(!JSON.stringify(failure).includes(databaseUrl));
    assert.ok(logs[1].includes('CONFIG_DATABASE_URL'));assert.ok(logs[1].includes('"DATABASE_URL":false'));
    assert.ok(!logs.join('\n').includes(databaseUrl));
    process.env.DATABASE_URL=databaseUrl;logMock.mock.restore();
    delete process.env.APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL='shop.vercel.app';process.env.VERCEL_URL='shop-build.vercel.app';
    const [home,catalog]=await Promise.all([fetch(base),fetch(base+'/api/products')]);
    const [firstApp,secondApp]=await Promise.all([getApp(),getApp()]);app=firstApp;
    assert.equal(firstApp,secondApp);assert.equal(app.server.listening,false);
    assert.equal(app.db.pool.options.max,5);assert.equal(app.db.pool.options.idleTimeoutMillis,5000);
    const html=await home.text();assert.ok(html.includes('God of War Ragnarök'));assert.ok(html.includes('/js/app.js?v='));
    assert.equal((await catalog.json()).products.length,5);
    for(const path of ['/admin','/cuenta','/assets/deluxegames-mark.svg','/assets/fonts/nunito-latin-variable.woff2','/css/nebula.css','/js/app.js','/gta5.webp'])assert.equal((await fetch(base+path)).status,200,path);
    const favicon=await fetch(base+'/favicon.ico');assert.equal(favicon.status,200);assert.equal(favicon.headers.get('content-type'),'image/svg+xml');
    assert.equal(await favicon.text(),await (await fetch(base+'/assets/deluxegames-mark.svg')).text());
    const signup=await fetch(base+'/api/register',{method:'POST',headers:{Origin:'https://shop.vercel.app','Content-Type':'application/json'},body:JSON.stringify({name:'Vercel test',email:'vercel@entrypoint.local',password:'Vercel-test-password-1234'})});
    assert.ok(signup.headers.get('set-cookie').includes('; Secure'));
    assert.equal(signup.status,201);assert.equal((await signup.json()).user.role,'customer');
    const headers={Origin:'https://shop.vercel.app','Content-Type':'application/json'};
    assert.equal((await fetch(base+'/api/register',{method:'POST',headers:{...headers,Origin:'https://untrusted.example'},body:'{}'})).status,403);
    const login=await fetch(base+'/api/login',{method:'POST',headers,body:JSON.stringify({email:'vercel@entrypoint.local',password:'Vercel-test-password-1234'})});
    assert.equal(login.status,200);assert.equal((await login.json()).user.role,'customer');
    for(const body of [null,[],42])assert.equal((await fetch(base+'/api/login',{method:'POST',headers,body:JSON.stringify(body)})).status,400);
    assert.equal((await fetch(base+'/api/login',{method:'POST',headers,body:JSON.stringify({padding:'a'.repeat(3*1024*1024)})})).status,413);
    for(const path of ['/.env','/server/app.js','/index.html','/vercel.json'])assert.equal((await fetch(base+path)).status,404,path);
  }finally{
    if(server?.listening)await new Promise(resolve=>server.close(resolve));
    await app?.close();await removeSchema(schema);
    for(const [key,value]of saved){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
