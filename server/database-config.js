import {readFileSync} from 'node:fs';

// Runtime entry points can select Supabase; tests keep their separate local DB.
export function databaseConfig(env=process.env) {
  const remote=env.SUPABASE_DATABASE_URL?.trim();
  if(!remote)return {databaseUrl:env.DATABASE_URL,schema:env.DATABASE_SCHEMA||'public'};
  let url;
  try {url=new URL(remote);}catch {throw new Error('SUPABASE_DATABASE_URL debe ser la URI PostgreSQL de Connect.');}
  if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('Usá una conexión PostgreSQL directa o Session pooler.');
  if(env.SUPABASE_DB_PASSWORD)url.password=encodeURIComponent(env.SUPABASE_DB_PASSWORD);
  if(!url.password||/YOUR[-_]PASSWORD|\[.*\]/i.test(decodeURIComponent(url.password)))throw new Error('Completá SUPABASE_DB_PASSWORD en .env.');
  if(url.port==='6543')throw new Error('Esta app necesita Direct connection o Session pooler en puerto 5432.');
  // pg lets URI SSL parameters override the TLS object. Keep verification explicit.
  for(const key of ['ssl','sslmode','sslrootcert','sslcert','sslkey','uselibpqcompat'])url.searchParams.delete(key);
  const ssl={rejectUnauthorized:true};
  if(env.SUPABASE_SSL_CA?.trim())ssl.ca=env.SUPABASE_SSL_CA.trim().replace(/\\n/g,'\n');
  else if(env.SUPABASE_SSL_CA_FILE?.trim())ssl.ca=readFileSync(env.SUPABASE_SSL_CA_FILE.trim(),'utf8');
  return {databaseUrl:url.href,schema:env.SUPABASE_DATABASE_SCHEMA||'deluxegames',ssl};
}
