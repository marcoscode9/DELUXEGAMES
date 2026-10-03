import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import pg from 'pg';
import {chromium} from 'playwright';
import {createApp} from '../server/app.js';
import {bootstrapAdmin} from '../server/auth.js';

test('buyer and administrator workflows on desktop and mobile',{timeout:120000},async()=>{
  const schema='ui_'+randomUUID().replaceAll('-',''),base='http://localhost:3198';
  const app=await createApp({schema,appUrl:base});await new Promise(r=>app.server.listen(3198,'127.0.0.1',r));
  const pass='Local-UI-test-password-123';await bootstrapAdmin(app.db,'admin@uitest.local',pass);
  let browser;await mkdir('.local/previews',{recursive:true});
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const ready=async()=>{await page.waitForSelector('body[data-ready=true]');await page.evaluate(()=>document.fonts.ready);};
    const imageReady=async()=>{await page.evaluate(async()=>{const imgs=[...document.querySelectorAll('img')];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});};
    await page.goto(base);await ready();assert.equal(await page.locator('.product-card').count(),5);
    assert.ok(await page.evaluate(()=>document.fonts.check('800 24px Nunito','¿Cómo jugás? ñ')));
    assert.equal(await page.locator('.site-header .brand-mark').evaluate(el=>el.naturalWidth>0),true);
    await imageReady();await page.screenshot({path:'.local/previews/desktop.png',fullPage:true});
    await page.locator('[data-filter=preorder]').click();assert.equal(await page.locator('.product-card').count(),2);
    await page.locator('#searchInput').fill('GTA');assert.equal(await page.locator('.product-card').count(),1);
    await page.locator('#searchInput').fill('zzz');assert.equal(await page.locator('#emptyCatalog').isVisible(),true);
    await page.locator('#resetFilters').click();await page.locator('#sortOrder').selectOption('high');assert.equal(await page.locator('.product-card').first().getAttribute('data-id'),'fc27');
    await page.locator('[data-favorite=gta5]').click();await page.locator('[data-filter=favorites]').click();assert.equal(await page.locator('.product-card').count(),1);
    await page.reload();await ready();assert.equal(await page.locator('[data-favorite=gta5]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-detail=gta5]').first().click();assert.equal(await page.locator('#productDialog').evaluate(e=>e.open),true);await page.locator('#detailPlus').click();await page.locator('#detailAdd').click();assert.equal(await page.locator('#cartCount').textContent(),'2');
    await page.keyboard.press('Escape');await page.locator('[data-add=gta5]').click();assert.equal(await page.locator('.cart-line').count(),1);assert.equal(await page.locator('#cartCount').textContent(),'3');assert.equal(await page.locator('#cartTotal').textContent(),'$45.000');
    for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.getElementById('cartDialog').contains(document.activeElement)));}
    await page.keyboard.press('Escape');await page.reload();await ready();assert.equal(await page.locator('#cartCount').textContent(),'3');
    await page.locator('#accountTrigger').click();await page.locator('#registerTab').click();await page.locator('#authForm [name=name]').fill('Cliente UI');await page.locator('#authForm [name=email]').fill('buyer@uitest.local');await page.locator('#authForm [name=password]').fill(pass);await page.locator('#authSubmit').click();await page.waitForURL(base+'/cuenta');await ready();
    await page.goto(base);await ready();await page.locator('#cartTrigger').click();assert.equal(await page.locator('#guestFields').isVisible(),false);await page.locator('#checkoutButton').click();await page.waitForSelector('#whatsappCheckout');assert.ok(decodeURIComponent(await page.locator('#whatsappCheckout').getAttribute('href')).includes('$45.000'));await page.keyboard.press('Escape');
    await page.goto(base+'/cuenta');await ready();await page.waitForSelector('.order-card');assert.equal(await page.locator('.order-card').count(),1);
    await page.locator('[data-account=favorites]').click();await page.waitForSelector('#accountContent .product-card');await page.locator('#accountContent [data-favorite=gta5]').click();await page.waitForSelector('#accountContent .empty-state');
    await page.locator('#logoutButton').click();await page.waitForURL(base+'/');await ready();
    await page.goto(base+'/admin');await ready();await page.locator('#adminLogin').click();await page.locator('#authForm [name=email]').fill('admin@uitest.local');await page.locator('#authForm [name=password]').fill(pass);await page.locator('#authSubmit').click();await page.waitForSelector('.admin-stats');
    await page.screenshot({path:'.local/previews/admin.png',fullPage:true});await page.locator('[data-admin-tab=products]').click();await page.waitForSelector('#newProduct');
    await page.locator('#newProduct').click();await page.locator('#productForm [name=name]').fill('Juego UI');await page.locator('#productForm [name=price]').fill('22000');await page.locator('#productForm [name=genre]').fill('Acción');await page.locator('#productForm [name=stock]').fill('4');await page.locator('#productForm [name=description]').fill('Descripción de prueba');await page.locator('#imageUpload').setInputFiles('gta5.webp');await page.waitForFunction(()=>document.getElementById('uploadStatus').textContent.startsWith('Imagen guardada'));await page.locator('#productForm button[type=submit]').click();await page.waitForSelector('#editorDialog:not([open])',{state:'attached'});await page.locator('#adminSearch').fill('Juego UI');assert.equal(await page.locator('.admin-table tbody tr').count(),1);
    await page.locator('[data-edit]').click();await page.locator('#productForm [name=price]').fill('23000');await page.locator('#productForm button[type=submit]').click();await page.waitForSelector('#editorDialog:not([open])',{state:'attached'});await page.locator('#adminSearch').fill('Juego UI');assert.ok((await page.locator('.admin-table').textContent()).includes('$23.000'));
    await page.locator('[data-stock]').click();await page.locator('#stockForm [name=delta]').fill('2');await page.locator('#stockForm [name=reason]').fill('Reposición UI');await page.locator('#stockForm button[type=submit]').click();await page.waitForSelector('#stockDialog:not([open])',{state:'attached'});await page.locator('#adminSearch').fill('Juego UI');assert.ok((await page.locator('.admin-table tbody tr').textContent()).includes('6'));
    await page.locator('[data-archive]').click();await page.locator('#confirmAction').click();await page.waitForSelector('#confirmDialog:not([open])',{state:'attached'});await page.locator('#showArchived').check();await page.locator('#adminSearch').fill('Juego UI');assert.ok((await page.locator('.admin-table tbody').textContent()).includes('Archivada'));
    await page.locator('[data-admin-tab=orders]').click();await page.waitForSelector('[data-save-order]');await page.locator('[data-status]').selectOption('confirmed');await page.locator('[data-save-order]').click();await page.waitForFunction(()=>document.querySelector('.order-card .status')?.textContent==='Confirmado');await page.waitForSelector('#feedbackDialog[open]');assert.equal(await page.locator('#feedbackTitle').textContent(),'Pedido confirmado.');await page.screenshot({path:'.local/previews/payment-confirmed.png',animations:'disabled'});await page.keyboard.press('Escape');await page.waitForSelector('#feedbackDialog:not([open])',{state:'attached'});
    await page.locator('[data-admin-tab=inventory]').click();await page.waitForSelector('.admin-table');await page.screenshot({path:'.local/previews/inventory.png',fullPage:true});
    await page.locator('[data-admin-tab=settings]').click();await page.waitForSelector('#settingsForm');await page.locator('#settingsForm [name=deliveryNote]').fill('Atención por WhatsApp. Entrega a confirmar.');await page.locator('#settingsForm button[type=submit]').click();await page.waitForFunction(()=>document.getElementById('toast').textContent==='Configuración guardada.');
    for(const width of [360,390,768,1440]){
      await page.setViewportSize({width,height:900});await page.goto(base);await ready();await imageReady();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Store overflow ${width}`);
      if(width===390){await page.screenshot({path:'.local/previews/mobile.png',fullPage:true});await page.screenshot({path:'.local/previews/mobile-top.png'});}
      await page.locator('#cartTrigger').click();
      assert.ok(await page.locator('#cartDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Checkout overflow ${width}`);
      const checkoutBox=await page.locator('#cartDialog').boundingBox();assert.ok(checkoutBox.x>=0&&checkoutBox.x+checkoutBox.width<=width+1);
      await page.locator('#checkoutButton').scrollIntoViewIfNeeded();await page.keyboard.press('Escape');
      await page.goto(base+'/admin');await ready();await page.waitForSelector('.admin-stats');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Admin overflow ${width}`);
    }
    await page.goto(base+'/cuenta');await ready();await page.locator('#logoutButton').click();await page.waitForURL(base+'/');await ready();
    await page.locator('#accountTrigger').click();await page.locator('#authForm [name=email]').fill('buyer@uitest.local');await page.locator('#authForm [name=password]').fill(pass);await page.locator('#authSubmit').click();await page.waitForURL(base+'/cuenta');await ready();
    await page.waitForSelector('#feedbackDialog[open]');assert.equal(await page.locator('#feedbackTitle').textContent(),'Pedido confirmado.');await page.keyboard.press('Escape');await page.waitForSelector('#feedbackDialog:not([open])',{state:'attached'});assert.equal(await page.locator('.order-progress .complete').count(),2);
    await page.reload();await ready();await page.waitForSelector('.order-card');assert.equal(await page.locator('#feedbackDialog').evaluate(el=>el.open),false,'Confirmed-order celebration is shown once');
    assert.deepEqual(errors,[]);
  }finally{
    await browser?.close();await app.close();const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();
  }
});
