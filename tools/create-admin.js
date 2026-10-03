import {createDatabase} from '../server/db.js';
import {bootstrapAdmin} from '../server/auth.js';
const db=createDatabase(process.env.DATABASE_URL);
try{await db.initialize();await bootstrapAdmin(db,process.env.ADMIN_EMAIL||'',process.env.ADMIN_PASSWORD||'');console.log('Cuenta administradora creada.');}finally{await db.close();}
