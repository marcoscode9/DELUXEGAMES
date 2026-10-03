import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startupDiagnostic,startupEnvironment} from '../server/startup-diagnostics.js';
import {databaseConfig} from '../server/database-config.js';

test('startup diagnostics classify database failures without disclosing driver messages or credentials',()=>{
  const secret='postgresql://private-user:private-password@private-host/private-db';
  const cases=[['28P01','DG-DB-AUTH'],['SELF_SIGNED_CERT_IN_CHAIN','DG-TLS-CA'],['ENETUNREACH','DG-DB-NETWORK'],['ENOTFOUND','DG-DB-DNS'],['42501','DG-DB-PERMISSIONS'],['53300','DG-DB-LIMIT'],['ENOENT','DG-ASSETS']];
  for(const [code,reference]of cases){
    const error=Object.assign(new Error(secret),{code});
    const result=startupDiagnostic(new AggregateError([error],secret));
    assert.equal(result.reference,reference);assert.equal(result.code,code);
    assert.ok(!JSON.stringify(result).includes(secret));
  }
  const unknown=startupDiagnostic(Object.assign(new Error(secret),{code:secret}));
  assert.equal(unknown.reference,'DG-STARTUP');assert.ok(!JSON.stringify(unknown).includes(secret));
  const circular=new Error(secret);circular.cause=circular;
  assert.equal(startupDiagnostic(circular).reference,'DG-STARTUP');
  assert.equal(startupDiagnostic(new Error('Connection terminated due to connection timeout')).reference,'DG-DB-NETWORK');
});

test('startup environment reports only presence and configuration failures carry actionable references',()=>{
  const env={APP_URL:'https://private-host',SUPABASE_DB_PASSWORD:'private-password',SUPABASE_DATABASE_URL:'  '};
  const presence=startupEnvironment(env);
  assert.equal(presence.APP_URL,true);assert.equal(presence.SUPABASE_DB_PASSWORD,true);assert.equal(presence.SUPABASE_DATABASE_URL,false);
  assert.ok(Object.values(presence).every(value=>typeof value==='boolean'));
  const remote='postgresql://postgres:filled@db.example.supabase.co:5432/postgres';
  const cases=[
    [{SUPABASE_DATABASE_URL:'https://example.supabase.co'},'DG-DB-URL'],
    [{SUPABASE_DATABASE_URL:remote.replace('filled','[YOUR-PASSWORD]')},'DG-DB-PASSWORD'],
    [{SUPABASE_DATABASE_URL:remote.replace(':5432',':6543')},'DG-DB-POOLER'],
    [{SUPABASE_DATABASE_URL:remote,VERCEL:'1',SUPABASE_SSL_CA_FILE:'private-local-file.crt'},'DG-TLS-FILE'],
  ];
  for(const [config,reference]of cases)assert.throws(()=>databaseConfig(config),error=>startupDiagnostic(error).reference===reference);
});
