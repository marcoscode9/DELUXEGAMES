import {randomBytes} from 'node:crypto';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createDatabase} from '../server/db.js';
import {bootstrapAdmin} from '../server/auth.js';
await mkdir('.local',{recursive:true});
try{await access('.env');}catch{
  const dbPass=randomBytes(24).toString('hex');
  await writeFile('.env',`PORT=3000\nAPP_URL=http://localhost:3000\nPOSTGRES_PASSWORD=${dbPass}\nDATABASE_URL=postgresql://deluxegames:${dbPass}@localhost:55432/deluxegames\n`,{mode:0o600});
}
const envFile=await readFile('.env','utf8');
const connectionString=envFile.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
const result=spawnSync('docker',['compose','up','-d','--wait'],{stdio:'inherit',shell:false});
if(result.status!==0)throw new Error('No se pudo iniciar PostgreSQL. Abrí Docker Desktop e intentá nuevamente.');
const db=createDatabase(connectionString);
try{
  await db.initialize();
  if(!(await db.query("SELECT id FROM users WHERE role='admin'")).rowCount){
    const email='admin@deluxegames.local',password=randomBytes(18).toString('base64url');
    await bootstrapAdmin(db,email,password);
    await writeFile('.local/admin-access.txt',`Acceso local a DELUXEGAMES\nURL: http://localhost:3000/admin\nEmail: ${email}\nContraseña: ${password}\n\nEsta contraseña se generó al configurar el proyecto. Cambiala desde Mi cuenta.\nArchivo privado e ignorado por Git. No compartir ni publicar.\n`,{mode:0o600});
    console.log('Administrador creado. Credenciales en .local/admin-access.txt (no se muestran en consola).');
  }
  console.log('Base local lista. Iniciá la tienda con npm start.');
}finally{await db.close();}
