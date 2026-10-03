import {test} from 'node:test';
import assert from 'node:assert/strict';
import {databaseConfig} from '../server/database-config.js';

test('blank Supabase configuration keeps local DB and schema',()=>{
  assert.deepEqual(databaseConfig({DATABASE_URL:'postgresql://localhost/local',SUPABASE_DATABASE_URL:'  '}),{databaseUrl:'postgresql://localhost/local',schema:'public'});
});
test('Supabase uses private schema, preserves special password characters and verifies TLS',()=>{
  const password='quoted # & @ / : ? % ñ',config=databaseConfig({SUPABASE_DATABASE_URL:'postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres?sslmode=no-verify',SUPABASE_DB_PASSWORD:password});
  const url=new URL(config.databaseUrl);
  assert.equal(decodeURIComponent(url.password),password);assert.equal(config.schema,'deluxegames');
  assert.deepEqual(config.ssl,{rejectUnauthorized:true});assert.equal(url.searchParams.has('sslmode'),false);
});
test('Supabase accepts a complete URI but refuses missing credentials and transaction pooling',()=>{
  assert.equal(databaseConfig({SUPABASE_DATABASE_URL:'postgresql://postgres:filled@db.example.supabase.co:5432/postgres'}).schema,'deluxegames');
  assert.throws(()=>databaseConfig({SUPABASE_DATABASE_URL:'postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres'}),/SUPABASE_DB_PASSWORD/);
  assert.throws(()=>databaseConfig({SUPABASE_DATABASE_URL:'https://example.supabase.co'}),/PostgreSQL/);
  assert.throws(()=>databaseConfig({SUPABASE_DATABASE_URL:'postgresql://postgres:filled@pool.example:6543/postgres'}),/Session pooler/);
});
