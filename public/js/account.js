import {$,state,api,escape,price,date,statuses,openDialog,closeDialog,updateHeader,syncFavorites,logout,busyForm,toast} from './core.js';
import {cardHTML,renderCatalog,renderCart} from './store.js';
import {announceOrderChanges} from './feedback.js';
let registering=false,adminLogin=false,afterLogin=null;
let orderTimer,checkingOrders=false,lastOrders='';
function orderProgress(order){if(order.status==='cancelled')return '';const steps=['Pedido creado','Pago confirmado','Juego entregado'],progress=['pending','confirmed','delivered'].indexOf(order.status);return `<ol class="order-progress" aria-label="Progreso del pedido">${steps.map((label,index)=>`<li class="${index<=progress?'complete':''}" ${index===progress?'aria-current="step"':''}>${label}</li>`).join('')}</ol>`;}
function displayOrders(orders){$('#accountContent').innerHTML=orders.length?orders.map(o=>orderHTML(o).replace('</article>',orderProgress(o)+'</article>')).join(''):'<div class="empty-state"><h3>Tu primera historia te espera.</h3><p>Tus pedidos aparecerán acá cuando armes tu primera selección.</p><a class="button" href="/#catalogo">Explorar la colección ↗</a></div>';announceOrderChanges(orders);}
function scheduleOrderCheck(){clearTimeout(orderTimer);if(location.pathname==='/cuenta'&&state.user&&state.accountTab==='orders'&&!document.hidden)orderTimer=setTimeout(checkOrders,20000);}
async function checkOrders(){
  if(checkingOrders||document.hidden||state.accountTab!=='orders'||location.pathname!=='/cuenta'||!state.user)return;
  checkingOrders=true;
  try{const {orders}=await api('/orders');if(state.accountTab==='orders'&&$('#accountContent')&&JSON.stringify(orders)!==lastOrders){lastOrders=JSON.stringify(orders);displayOrders(orders);}}catch{/* Keep the last known order state visible during a transient connection failure. */}
  finally{checkingOrders=false;scheduleOrderCheck();}
}
export function openAuth(admin=false,callback=null){adminLogin=admin;afterLogin=callback;registering=false;$('#authForm').reset();$('#authError').textContent='';updateAuth();openDialog('authDialog');}
function updateAuth(){
  $('#authTitle').innerHTML=adminLogin?'Administrá <em>tu tienda.</em>':registering?'Tu próxima <em>historia.</em>':'Qué bueno <em>verte.</em>';
  $('#authDescription').textContent=adminLogin?'Ingresá con tu cuenta administradora.':'Guardá tus favoritos y seguí tus pedidos.';
  $('#registerTab').hidden=adminLogin;$('#authNameField').hidden=!registering;$('#authForm [name=name]').required=registering;
  $('#authForm [name=password]').autocomplete=registering?'new-password':'current-password';
  $('#authSubmit').textContent=registering?'Crear mi cuenta ↗':'Entrar ↗';$('#loginTab').setAttribute('aria-pressed',String(!registering));$('#registerTab').setAttribute('aria-pressed',String(registering));$('#authNote').hidden=adminLogin;
}
export function orderHTML(o,admin=false){return `<article class="order-card" data-order="${escape(o.id)}"><div class="order-card-head"><span class="mono">${escape(o.id.slice(0,8).toUpperCase())} / ${date(o.createdAt)}</span><span class="status ${escape(o.status)}">${statuses[o.status]}</span></div>${admin?`<p>${escape(o.name)} · ${escape(o.email)}</p>`:''}${o.items.map(i=>`<p>${escape(i.name)} ${i.preorder?'· PREVENTA':''} × ${i.quantity} — ${price(i.price*i.quantity)}</p>`).join('')}<strong>${price(o.total)} ARS</strong>${admin?'':o.status==='pending'?'<p>Disponibilidad y pago pendientes de confirmación por WhatsApp.</p>':''}${admin?`<div class="admin-order-controls"><select data-status="${escape(o.id)}" aria-label="Estado del pedido ${escape(o.id.slice(0,8))}">${Object.entries(statuses).map(([key,label])=>`<option value="${key}" ${o.status===key?'selected':''}>${label}</option>`).join('')}</select><input data-note="${escape(o.id)}" value="${escape(o.note)}" maxlength="2000" placeholder="Nota interna del pedido" aria-label="Nota interna"><button data-save-order="${escape(o.id)}">Guardar estado</button></div>`:''}</article>`;}
export async function renderAccount(){
  const view=$('#accountView');
  if(!state.user){view.innerHTML='<div class="page-heading"><div><span class="label">TU ESPACIO / DELUXEGAMES</span><h1>Todo lo tuyo, <em>acá.</em></h1></div></div><p class="muted">Iniciá sesión para ver tus pedidos y tu selección guardada.</p><button class="button" id="accountLogin">Entrar a mi cuenta ↗</button>';$('#accountLogin').onclick=()=>openAuth(false,renderAccount);return;}
  view.innerHTML=`<div class="page-heading"><div><span class="label">TU ESPACIO / DELUXEGAMES</span><h1>Hola, <em>${escape(state.user.name.split(' ')[0])}.</em></h1></div><button class="underline-link" id="logoutButton">Cerrar sesión ↗</button></div><nav class="account-tabs" aria-label="Mi cuenta"><button data-account="orders" class="${state.accountTab==='orders'?'active':''}">Mis pedidos</button><button data-account="favorites" class="${state.accountTab==='favorites'?'active':''}">Guardados</button><button data-account="profile" class="${state.accountTab==='profile'?'active':''}">Mi perfil</button>${state.user.role==='admin'?'<a class="underline-link" href="/admin">Administrar tienda ↗</a>':''}</nav><div id="accountContent"><p class="muted">Cargando…</p></div>`;
  $('#logoutButton').onclick=()=>logout().catch(e=>toast(e.message));view.querySelectorAll('[data-account]').forEach(b=>b.onclick=()=>{state.accountTab=b.dataset.account;renderAccount().catch(e=>toast(e.message));});
  if(state.accountTab==='orders'){
    const {orders}=await api('/orders');if(state.accountTab==='orders'){lastOrders=JSON.stringify(orders);displayOrders(orders);scheduleOrderCheck();}
  }else if(state.accountTab==='favorites'){
    const products=state.products.filter(p=>state.favorites.includes(p.id));$('#accountContent').innerHTML=products.length?`<div class="product-grid">${products.map(cardHTML).join('')}</div>`:'<div class="empty-state"><h3>Una colección muy tuya.</h3><p>Tocá el corazón en tus juegos favoritos para guardarlos.</p><a class="button" href="/#catalogo">Encontrá tu próxima historia ↗</a></div>';
  }else{
    $('#accountContent').innerHTML=`<div class="account-profile"><h3>Los detalles de tu cuenta.</h3><form id="profileForm"><label>Nombre<input name="name" value="${escape(state.user.name)}" maxlength="80" required autocomplete="name"></label><label>Email<input value="${escape(state.user.email)}" type="email" readonly><small>Tu email identifica esta cuenta.</small></label><p class="form-error" id="profileError" role="alert"></p><button class="button" type="submit">Guardar cambios ↗</button></form><h3>Tu contraseña.</h3><form id="passwordForm"><label>Contraseña actual<input name="currentPassword" type="password" required autocomplete="current-password" maxlength="128"></label><label>Nueva contraseña<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"><small>Usá al menos 12 caracteres.</small></label><p class="form-error" id="passwordError" role="alert"></p><button class="button" type="submit">Cambiar contraseña ↗</button></form></div>`;
    $('#profileForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#profileError',async()=>{const r=await api('/profile',{method:'PATCH',body:Object.fromEntries(new FormData(ev.target))});state.user=r.user;updateHeader();toast('Perfil actualizado.');});};
    $('#passwordForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#passwordError',async()=>{await api('/password',{method:'POST',body:Object.fromEntries(new FormData(ev.target))});ev.target.reset();toast('Contraseña actualizada. Las otras sesiones se cerraron.');});};
  }
}
export function initializeAccount(){
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(orderTimer);else checkOrders();});
  document.addEventListener('favoritesChanged',()=>{if(location.pathname==='/cuenta'&&state.accountTab==='favorites')renderAccount().catch(e=>toast(e.message));});
  $('#accountTrigger').onclick=()=>state.user?location.assign('/cuenta'):openAuth(false,()=>{location.href='/cuenta';});
  $('#loginTab').onclick=()=>{registering=false;updateAuth();};$('#registerTab').onclick=()=>{registering=true;updateAuth();};
  $('#authForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#authError',async()=>{
    const b=Object.fromEntries(new FormData(ev.target));b.admin=adminLogin;
    const r=await api(registering?'/register':'/login',{method:'POST',body:b});state.user=r.user;state.csrf=r.csrf;
    const {ids}=await api('/favorites');state.favorites=[...new Set([...ids,...state.favorites])];await syncFavorites();updateHeader();renderCatalog();renderCart();closeDialog('authDialog');toast(registering?'Tu cuenta está lista.':'Bienvenido a DELUXEGAMES.');if(afterLogin)await afterLogin();
  });};
}
