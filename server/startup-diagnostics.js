export function configurationError(code,message) {
  return Object.assign(new Error(message),{code});
}

// Only fixed codes and messages leave this module; never log driver messages,
// connection URLs, hostnames, passwords or certificate contents.
const groups=[
  ['DG-APP-URL',['CONFIG_APP_URL'],'Configurá APP_URL con la URL pública de la tienda.'],
  ['DG-DB-URL',['CONFIG_DATABASE_URL'],'Configurá SUPABASE_DATABASE_URL con la URI PostgreSQL de Connect.'],
  ['DG-DB-PASSWORD',['CONFIG_DATABASE_PASSWORD'],'Completá SUPABASE_DB_PASSWORD con la contraseña de la base.'],
  ['DG-DB-POOLER',['CONFIG_DATABASE_POOLER'],'Usá Direct connection o Session pooler en puerto 5432.'],
  ['DG-DB-SCHEMA',['CONFIG_DATABASE_SCHEMA','3F000','42P01'],'Revisá SUPABASE_DATABASE_SCHEMA y la inicialización de las tablas.'],
  ['DG-TLS-FILE',['CONFIG_CA_FILE'],'En Vercel usá SUPABASE_SSL_CA con el PEM; quitá SUPABASE_SSL_CA_FILE.'],
  ['DG-TLS-CA',['SELF_SIGNED_CERT_IN_CHAIN','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','ERR_OSSL_PEM_NO_START_LINE','ERR_OSSL_PEM_BAD_BASE64_DECODE'],'Configurá SUPABASE_SSL_CA con el certificado raíz completo de Supabase.'],
  ['DG-TLS-SERVER',['CERT_HAS_EXPIRED','ERR_TLS_CERT_ALTNAME_INVALID'],'Revisá el certificado y la conexión elegida en Supabase.'],
  ['DG-DB-AUTH',['28P01','28000'],'Revisá usuario y contraseña de la conexión PostgreSQL.'],
  ['DG-DB-DNS',['ENOTFOUND','EAI_AGAIN'],'Revisá el hostname de la URI PostgreSQL.'],
  ['DG-DB-NETWORK',['ENETUNREACH','EHOSTUNREACH','ETIMEDOUT','ECONNREFUSED','ECONNRESET'],'Revisá disponibilidad de la base y usá Session pooler 5432 si la conexión directa requiere IPv6.'],
  ['DG-DB-PERMISSIONS',['42501'],'La cuenta PostgreSQL necesita permisos para crear el esquema y sus tablas.'],
  ['DG-DB-LIMIT',['53300'],'Revisá el límite de conexiones de Supabase.'],
  ['DG-ASSETS',['ENOENT'],'Faltan archivos de ejecución en el paquete de la función.'],
];

export function startupDiagnostic(error) {
  const pending=[error],seen=new Set();
  while(pending.length){
    const current=pending.shift();
    if(!current||typeof current!=='object'||seen.has(current))continue;
    seen.add(current);
    for(const [reference,codes,hint]of groups)if(codes.includes(current.code))return {reference,code:current.code,hint};
    if(current.message==='Connection terminated due to connection timeout')return {reference:'DG-DB-NETWORK',code:'CONNECTION_TIMEOUT',hint:groups.find(group=>group[0]==='DG-DB-NETWORK')[2]};
    if(current.cause)pending.push(current.cause);
    if(Array.isArray(current.errors))pending.push(...current.errors);
    if(seen.size>=20)break;
  }
  return {reference:'DG-STARTUP',code:'UNKNOWN',hint:'El arranque falló por una causa no clasificada; requiere revisar la ejecución de la función.'};
}

export function startupEnvironment(env=process.env) {
  return Object.fromEntries(['APP_URL','SUPABASE_DATABASE_URL','SUPABASE_DB_PASSWORD','DATABASE_URL','SUPABASE_SSL_CA','SUPABASE_SSL_CA_FILE'].map(key=>[key,Boolean(env[key]?.trim())]));
}
