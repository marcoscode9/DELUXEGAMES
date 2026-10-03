import {attachDatabasePool} from '@vercel/functions';
import {createApp} from './server/app.js';
import {databaseConfig} from './server/database-config.js';

// Vercel detects this root entrypoint and captures the native HTTP server.
const appUrl=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL;
if(process.env.VERCEL&&!appUrl)throw new Error('Configurá APP_URL con la URL pública de la tienda.');
export const app=await createApp({...databaseConfig(),appUrl,poolMax:5,poolIdleTimeout:5000});
attachDatabasePool(app.db.pool);
app.server.listen(Number(process.env.PORT||3000));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();process.exit(0);});
