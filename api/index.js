import {attachDatabasePool} from '@vercel/functions';
import {createApp} from '../server/app.js';
import {databaseConfig} from '../server/database-config.js';
import {configurationError,startupDiagnostic,startupEnvironment} from '../server/startup-diagnostics.js';

let initialization;

// Concurrent requests share startup and the pool; a failed startup can retry.
export function getApp() {
  if(!initialization)initialization=(async()=>{
    const appUrl=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL;
    if(process.env.VERCEL&&!appUrl)throw configurationError('CONFIG_APP_URL','Configurá APP_URL con la URL pública de la tienda.');
    if(appUrl){
      let parsed;
      try{parsed=new URL(appUrl);}catch{throw configurationError('CONFIG_APP_URL','APP_URL debe ser una URL completa.');}
      if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)throw configurationError('CONFIG_APP_URL','APP_URL debe ser una URL HTTP o HTTPS sin credenciales.');
    }
    const app=await createApp({...databaseConfig(),appUrl,poolMax:5,poolIdleTimeout:5000});
    attachDatabasePool(app.db.pool);
    return app;
  })().catch(error=>{initialization=undefined;throw error;});
  return initialization;
}

export default async function handler(req,res) {
  let app;
  try{app=await getApp();}catch(error){
    const diagnostic=startupDiagnostic(error);
    console.error('Application startup failed:',JSON.stringify({...diagnostic,configured:startupEnvironment()}));
    res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Retry-After':'5'});
    res.end(JSON.stringify({error:'La tienda no está disponible en este momento. Intentá nuevamente.',reference:diagnostic.reference}));
    return;
  }
  return app.handle(req,res);
}
