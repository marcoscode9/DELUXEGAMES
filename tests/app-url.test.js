import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveAppUrl} from '../server/app-url.js';

test('Vercel production starts with its stable domain when APP_URL is blank',()=>{
  assert.equal(resolveAppUrl({VERCEL:'1',VERCEL_ENV:'production',APP_URL:'  ',VERCEL_PROJECT_PRODUCTION_URL:'shop.vercel.app',VERCEL_URL:'shop-build.vercel.app'}),'https://shop.vercel.app');
  assert.equal(resolveAppUrl({VERCEL:'1',VERCEL_URL:'shop-build.vercel.app'}),'https://shop-build.vercel.app');
});

test('explicit store domains take priority in production and previews use their own deployment',()=>{
  const env={VERCEL:'1',VERCEL_ENV:'production',APP_URL:'  https://games.example/  ',VERCEL_PROJECT_PRODUCTION_URL:'shop.vercel.app',VERCEL_URL:'shop-build.vercel.app'};
  assert.equal(resolveAppUrl(env),'https://games.example');
  assert.equal(resolveAppUrl({...env,VERCEL_ENV:'preview'}),'https://shop-build.vercel.app');
});

test('missing or invalid URLs fail explicitly and local defaults remain available',()=>{
  assert.equal(resolveAppUrl({}),undefined);
  assert.throws(()=>resolveAppUrl({},{required:true}),{code:'CONFIG_APP_URL'});
  assert.equal(resolveAppUrl({APP_URL:'http://localhost:3000'}),'http://localhost:3000');
  assert.throws(()=>resolveAppUrl({VERCEL:'1'}),{code:'CONFIG_APP_URL'});
  for(const APP_URL of ['shop.vercel.app','"https://shop.vercel.app"','postgresql://host/db','https://user:secret@example.com']){
    assert.throws(()=>resolveAppUrl({APP_URL,VERCEL:'1',VERCEL_PROJECT_PRODUCTION_URL:'shop.vercel.app'}),{code:'CONFIG_APP_URL'});
  }
});
