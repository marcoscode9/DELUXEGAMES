import {attachDatabasePool} from '@vercel/functions';
import {createApp} from '../server/app.js';
import {databaseConfig} from '../server/database-config.js';

let initialization;

// Concurrent requests share startup and the pool; a failed startup can retry.
export function getApp() {
  if(!initialization)initialization=(async()=>{
    const appUrl=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL;
    if(process.env.VERCEL&&!appUrl)throw new Error('Configurá APP_URL con la URL pública de la tienda.');
    const app=await createApp({...databaseConfig(),appUrl,poolMax:5,poolIdleTimeout:5000});
    attachDatabasePool(app.db.pool);
    return app;
  })().catch(error=>{initialization=undefined;throw error;});
  return initialization;
}

export default async function handler(req,res) {
  let app;
  try{app=await getApp();}catch(error){
    console.error('Application startup failed:',error.code||error.name);
    res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Retry-After':'5'});
    res.end(JSON.stringify({error:'La tienda no está disponible en este momento. Intentá nuevamente.'}));
    return;
  }
  return app.handle(req,res);
}
