import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import net from 'node:net';
import pg from 'pg';
import {chromium} from 'playwright';
import {createApp} from '../server/app.js';

test('motion preserves fast interactions, keyboard focus and reduced-motion preferences',{timeout:60000},async()=>{
  const reservation=net.createServer();
  await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));
  const port=reservation.address().port,base=`http://localhost:${port}`;
  await new Promise(resolve=>reservation.close(resolve));
  const schema='motion_'+randomUUID().replaceAll('-','');
  const app=await createApp({schema,appUrl:base});
  let browser;
  try {
    await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(port,'127.0.0.1',resolve);});
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:950},reducedMotion:'no-preference'}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);await page.waitForSelector('body.motion-ready');
    assert.ok(await page.locator('.hero-image').evaluate(el=>el.getAnimations().some(animation=>animation.playState==='running')),'Hero entrance animates');

    const original=await page.locator('.product-card[data-id=gta5]').elementHandle();
    await page.locator('#sortOrder').selectOption('high');
    assert.ok(await original.evaluate(el=>el.isConnected),'Sorting retains product nodes');
    await page.evaluate(()=>{
      document.querySelector('[data-filter=preorder]').click();
      document.querySelector('[data-filter=PS4]').click();
      document.querySelector('[data-filter=all]').click();
      const search=document.getElementById('searchInput');
      for(const value of ['GTA','zzzz','']){search.value=value;search.dispatchEvent(new Event('input'));}
    });
    assert.equal(await page.locator('.product-card').count(),5);
    await page.waitForFunction(()=>[...document.querySelectorAll('.product-card')].every(el=>el.getAnimations().length===0));
    assert.ok(await page.locator('.product-card').evaluateAll(cards=>cards.every(card=>getComputedStyle(card).opacity==='1')));
    await page.locator('[data-favorite=gta5]').focus();await page.keyboard.press('Space');
    assert.equal(await page.locator('[data-favorite=gta5]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('[data-favorite=gta5]').evaluate(el=>el===document.activeElement),'Favorite retains keyboard focus');

    await page.locator('#cartTrigger').click();
    assert.ok(await page.locator('#cartDialog').evaluate(el=>el.getAnimations().length>0),'Bag slides into view');
    await page.keyboard.press('Escape');
    // Changing the OS preference mid-close must finish the transition and unlock the page.
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForSelector('#cartDialog:not([open])',{state:'attached'});
    await page.waitForFunction(()=>document.activeElement?.id==='cartTrigger'&&document.body.style.overflow==='');
    await page.locator('[data-detail=gta5]').first().click();
    assert.equal(await page.locator('#productDialog').evaluate(el=>el.getAnimations().length),0);
    await page.locator('#detailAdd').click();
    assert.equal(await page.locator('dialog[open]').count(),1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement?.dataset.detail==='gta5');

    await page.emulateMedia({reducedMotion:'no-preference'});
    const faq=page.locator('.faq-list details').first();
    await faq.locator('summary').click();await faq.locator('summary').click();await faq.locator('summary').click();
    await page.waitForFunction(()=>{const el=document.querySelector('.faq-list details');return el.open&&!el.classList.contains('faq-animating');});
    await faq.locator('summary').click();
    await page.waitForFunction(()=>!document.querySelector('.faq-list details').open);

    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('body.motion-ready');
    assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'Reduced motion has no running or delayed animations');
    assert.equal(await page.locator('#heroTitle').evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await page.locator('.hero-image').evaluate(el=>getComputedStyle(el).translate),'none');
    await faq.locator('summary').click();assert.equal(await faq.evaluate(el=>el.open),true);
    await page.locator('#cartTrigger').click();assert.equal(await page.locator('#cartDialog').evaluate(el=>el.getAnimations().length),0);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#cartDialog').evaluate(el=>el.open),false);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#menuToggle').click();assert.equal(await page.locator('#mobileNav').isVisible(),true);
    await page.locator('#mobileNav a').first().click();assert.equal(await page.locator('#mobileNav').isVisible(),false);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
  } finally {
    await browser?.close();await app.close();
    const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();
  }
});
