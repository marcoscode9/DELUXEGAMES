import { createApp } from './app.js';
const app=await createApp();
const port=Number(process.env.PORT||3000);
app.server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`DELUXEGAMES listo en ${process.env.APP_URL||`http://localhost:${port}`}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();process.exit(0);});
