import {createDatabase} from '../server/db.js';
import {bootstrapAdmin} from '../server/auth.js';
import {databaseConfig} from '../server/database-config.js';
const config=databaseConfig();
const db=createDatabase(config.databaseUrl,config.schema,config.ssl);
try{await db.initialize();await bootstrapAdmin(db,process.env.ADMIN_EMAIL||'',process.env.ADMIN_PASSWORD||'');console.log('Cuenta administradora creada.');}finally{await db.close();}
