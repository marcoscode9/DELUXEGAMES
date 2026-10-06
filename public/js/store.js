import {$,$$,state,api,escape,price,date,readLocal,saveLocal,openDialog,closeDialog,normalize,toast,syncFavorites} from './core.js';
import {catalogPositions, animateCatalog, updateFilterIndicator, pulse} from './motion.js';
import {successIcon, celebrate, rememberOrder} from './feedback.js';

export function cardHTML(p){return `<article class="product-card" data-id="${escape(p.id)}"><div class="card-visual"><img class="card-art-background" src="${escape(p.image)}" alt="" aria-hidden="true" width="600" height="771" loading="lazy" decoding="async">${p.preorder?'<span class="product-badge preorder">Preventa</span>':p.featured?'<span class="product-badge">La selección</span>':''}<button class="favorite" data-favorite="${escape(p.id)}" aria-pressed="${state.favorites.includes(p.id)}" aria-label="${state.favorites.includes(p.id)?'Quitar':'Guardar'} ${escape(p.name)} ${state.favorites.includes(p.id)?'de':'en'} favoritos">${state.favorites.includes(p.id)?'♥':'♡'}</button><button class="card-image-button" data-detail="${escape(p.id)}" aria-label="Ver detalles de ${escape(p.name)}"><img src="${escape(p.image)}" alt="${escape(p.name)}" width="600" height="771" loading="lazy" decoding="async"></button></div><div class="card-meta"><span>${escape(p.platforms.join(' / '))}</span><span>DIGITAL</span></div><h3 class="card-title"><button data-detail="${escape(p.id)}">${escape(p.name)}</button></h3><p class="card-format">${escape(p.type)} · ${escape(p.genre)}</p><div class="card-price">${price(p.price)}<small>ARS</small></div><button class="card-add" data-add="${escape(p.id)}" ${p.stock===0?'disabled':''}>${p.stock===0?'Agotado':'Agregar al carrito'} <span aria-hidden="true">+</span></button><p class="card-note">${p.preorder?`Preventa · ${p.releaseDate?date(p.releaseDate+'T12:00:00'):'Fecha a confirmar'}`:p.stock===null?'Disponibilidad a confirmar':p.stock===0?'Sin stock':`Disponible · ${p.stock} ${p.stock===1?'unidad':'unidades'}`}</p></article>`;}
export function renderCatalog(){
  $$('.hero [data-detail]').forEach(button=>button.hidden=!state.products.some(product=>product.id===button.dataset.detail));
  const q=normalize($('#searchInput').value),sort=$('#sortOrder').value;
  const products=state.products.filter(p=>normalize(`${p.name} ${p.platforms.join(' ')} ${p.genre} ${p.type}`).includes(q)&&(state.filter==='all'||p.platforms.includes(state.filter)||(state.filter==='preorder'&&p.preorder)||(state.filter==='favorites'&&state.favorites.includes(p.id))));
  products.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name,'es'):Number(b.featured)-Number(a.featured));
  const grid=$('#productGrid'),before=catalogPositions(grid);
  const existing=new Map([...grid.querySelectorAll('.product-card')].map(card=>[card.dataset.id,card]));
  const focused=document.activeElement, focusId=focused?.dataset.favorite;
  const cards=products.map(p=>{
    let card=existing.get(p.id);const html=cardHTML(p);
    if(!card){const template=document.createElement('template');template.innerHTML=html;card=template.content.firstElementChild;}
    else if(card.catalogHTML!==html){const template=document.createElement('template');template.innerHTML=html;card.replaceChildren(...template.content.firstElementChild.childNodes);}
    card.catalogHTML=html;return card;
  });
  // Move retained nodes in place; avoid a full replacement on every keystroke.
  const keep=new Set(cards);for(const child of [...grid.children])if(!keep.has(child))child.remove();
  cards.forEach((card,index)=>{if(grid.children[index]!==card)grid.insertBefore(card,grid.children[index]||null);});
  if(focusId&&!focused.isConnected)grid.querySelector(`[data-favorite="${focusId}"]`)?.focus({preventScroll:true});
  $('#resultCount').textContent=`${products.length.toString().padStart(2,'0')} ${products.length===1?'JUEGO':'JUEGOS'}`;$('#emptyCatalog').hidden=products.length>0;
  $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===state.filter)));
  animateCatalog(grid,before);updateFilterIndicator();
}
export function restoreCart(){
  let stored=readLocal('dg-cart');if(!stored.length)stored=readLocal('carrito');
  state.cart=[];for(const item of stored){if(!item||typeof item!=='object')continue;const p=state.products.find(p=>p.id===item.id||p.name===item.nombre);if(!p)continue;const quantity=Math.min(99,Math.max(1,Math.floor(Number(item.quantity??item.cantidad)||1)));const prior=state.cart.find(i=>i.id===p.id);if(prior)prior.quantity=Math.min(99,prior.quantity+quantity);else state.cart.push({id:p.id,quantity});}
  saveLocal('carrito',[]);persistCart();
}
function persistCart(){saveLocal('dg-cart',state.cart);}
function changeCart(){state.orderKey=crypto.randomUUID();$('#checkoutSuccess').hidden=true;$('#checkoutForm').hidden=false;$('#checkoutError').textContent='';persistCart();renderCart();}
export function addCart(id,quantity=1){
  const p=state.products.find(p=>p.id===id);if(!p||p.stock===0)return;
  const existing=state.cart.find(i=>i.id===id);const count=Math.min(99,(existing?.quantity||0)+quantity);
  if(p.stock!==null&&count>p.stock){toast('La cantidad supera el stock disponible.');return;}
  if(existing)existing.quantity=count;else state.cart.push({id,quantity:Math.min(99,quantity)});
  changeCart();pulse($('#cartCount'));if($('#productDialog').open)closeDialog('productDialog');openDialog('cartDialog');
}
export function renderCart(){
  state.cart=state.cart.filter(i=>state.products.some(p=>p.id===i.id));persistCart();
  $('#cartCount').textContent=state.cart.reduce((sum,item)=>sum+item.quantity,0);
  $('#cartItems').innerHTML=state.cart.length?state.cart.map(item=>{const p=state.products.find(p=>p.id===item.id);return `<article class="cart-line"><img src="${escape(p.image)}" width="60" height="77" alt=""><div><h3>${escape(p.name)}</h3><small>${price(p.price)} × ${item.quantity} · ${escape(p.type)}${p.preorder?' · PREVENTA':''}</small><div class="cart-line-controls"><button data-qty="${escape(p.id)}" data-delta="-1" aria-label="Reducir cantidad de ${escape(p.name)}">−</button><span>${item.quantity}</span><button data-qty="${escape(p.id)}" data-delta="1" aria-label="Aumentar cantidad de ${escape(p.name)}">+</button><button class="remove" data-remove="${escape(p.id)}" aria-label="Quitar ${escape(p.name)} del carrito">Quitar</button></div></div></article>`;}).join(''):'<div class="empty-state"><h3>Todo empieza con un juego.</h3><p>Explorá la colección y encontrá tu próxima historia.</p></div>';
  $('#cartTotal').textContent=price(state.cart.reduce((sum,item)=>sum+state.products.find(p=>p.id===item.id).price*item.quantity,0));
  $('#checkoutForm').hidden=state.cart.length===0||!$('#checkoutSuccess').hidden;
}
export function showDetail(id){
  const p=state.products.find(p=>p.id===id);if(!p)return;
  $('#productDetail').innerHTML=`<div class="product-detail-layout"><div class="detail-visual"><img src="${escape(p.image)}" alt="${escape(p.name)}" width="600" height="771"><span class="detail-caption">PORTADA / ${escape(p.platforms.join(" + "))}</span></div><div class="detail-copy"><div class="label">LA COLECCIÓN / ${escape(p.genre)}</div><h2 id="detailTitle">${escape(p.name)}</h2><div class="detail-platforms" aria-label="Plataformas compatibles">${p.platforms.map(platform=>`<span class="platform-pill">PlayStation ${platform.slice(2)}</span>`).join("")}</div><p>${escape(p.description)}</p><div class="detail-edition"><span>FORMATO DE ESTA PUBLICACIÓN</span><strong>${escape(p.type)} · Digital</strong></div><dl class="detail-facts"><div><dt>Plataforma</dt><dd>${escape(p.platforms.join(' / '))}</dd></div><div><dt>Formato</dt><dd>${escape(p.type)}</dd></div><div><dt>Disponibilidad</dt><dd>${p.stock===null?'A confirmar':p.stock===0?'Agotado':p.stock+' unidades'}</dd></div>${p.preorder?`<div><dt>Preventa</dt><dd>${p.releaseDate?date(p.releaseDate+'T12:00:00'):'Fecha a confirmar'}</dd></div>`:''}</dl><div class="detail-price">${price(p.price)} <small>ARS</small></div><div class="detail-purchase"><div class="quantity"><button id="detailMinus" aria-label="Reducir cantidad">−</button><input id="detailQuantity" type="text" readonly value="1" aria-label="Cantidad"><button id="detailPlus" aria-label="Aumentar cantidad">+</button></div><button class="button" id="detailAdd" ${p.stock===0?'disabled':''}>${p.stock===0?'Agotado':'Agregar al carrito'} ↗</button></div><div class="detail-notice">${escape(p.delivery)}<br>Mercado Pago / transferencia · Atención por WhatsApp.</div></div></div>`;
  $('#detailMinus').onclick=()=>$('#detailQuantity').value=Math.max(1,Number($('#detailQuantity').value)-1);$('#detailPlus').onclick=()=>$('#detailQuantity').value=Math.min(p.stock===null?99:Math.min(99,p.stock),Number($('#detailQuantity').value)+1);$('#detailAdd').onclick=()=>addCart(p.id,Number($('#detailQuantity').value));openDialog('productDialog');
}
export function initializeStore(){
  document.addEventListener('click',async ev=>{
    const detail=ev.target.closest('[data-detail]');if(detail)showDetail(detail.dataset.detail);
    const add=ev.target.closest('[data-add]');if(add)addCart(add.dataset.add);
    const favorite=ev.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;const old=[...state.favorites];state.favorites=state.favorites.includes(id)?state.favorites.filter(f=>f!==id):[...state.favorites,id];renderCatalog();pulse(document.querySelector(`[data-favorite="${id}"]`));try{await syncFavorites();}catch(e){state.favorites=old;renderCatalog();toast(e.message);}document.dispatchEvent(new CustomEvent('favoritesChanged'));}
    const qty=ev.target.closest('[data-qty]');if(qty){const item=state.cart.find(i=>i.id===qty.dataset.qty),p=state.products.find(p=>p.id===item.id),next=Math.max(1,Math.min(99,item.quantity+Number(qty.dataset.delta)));if(p.stock!==null&&next>p.stock){toast('La cantidad supera el stock disponible.');return;}item.quantity=next;changeCart();document.querySelector(`[data-qty="${qty.dataset.qty}"][data-delta="${qty.dataset.delta}"]`)?.focus();}
    const remove=ev.target.closest('[data-remove]');if(remove){state.cart=state.cart.filter(i=>i.id!==remove.dataset.remove);changeCart();$('#cartDialog .dialog-close').focus();}
  });
  $$('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;renderCatalog();});$('#searchInput').oninput=()=>{$('#headerSearch').value=$('#searchInput').value;renderCatalog();};$('#headerSearch').oninput=()=>{$('#searchInput').value=$('#headerSearch').value;renderCatalog();};$('#headerSearch').onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();$('#catalogo').scrollIntoView();$('#searchInput').focus({preventScroll:true});}};$('#sortOrder').onchange=renderCatalog;$('#resetFilters').onclick=()=>{state.filter='all';$('#searchInput').value='';$('#headerSearch').value='';$('#sortOrder').value='featured';renderCatalog();};
  $('#cartTrigger').onclick=()=>{renderCart();openDialog('cartDialog');};
  $('#headerSearch').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&location.pathname!=='/'){ev.preventDefault();location.href=`/?q=${encodeURIComponent(ev.target.value)}#catalogo`;}});
  $('#searchToggle').onclick=()=>{if(location.pathname!=='/')location.href='/#catalogo';else{$('#catalogo').scrollIntoView();$('#searchInput').focus({preventScroll:true});}};
  $('#checkoutForm').onsubmit=async ev=>{
    ev.preventDefault();const button=$('#checkoutButton');if(button.disabled||!state.cart.length)return;button.disabled=true;button.setAttribute('aria-busy','true');$('#checkoutError').textContent='';
    try{
      const f=new FormData(ev.target);const r=await api('/orders',{method:'POST',body:{items:state.cart,name:f.get('name'),email:f.get('email'),key:state.orderKey}});
      $('#cartTotal').textContent=price(r.order.total);
      $('#checkoutForm').hidden=true;$('#checkoutSuccess').hidden=false;$('#checkoutSuccess').innerHTML=`<div class="success-state">${successIcon}<span class="label">TU PRÓXIMA HISTORIA ESTÁ MÁS CERCA</span><h3>¡Pedido creado!</h3><p>Guardamos tu selección.<br>Ahora confirmemos disponibilidad y pago por WhatsApp.</p><span class="status pending">${escape(r.order.id.slice(0,8).toUpperCase())} · PAGO A CONFIRMAR</span></div><a class="button full" href="${escape(r.whatsappUrl)}" target="_blank" rel="noopener" id="whatsappCheckout">Enviar pedido por WhatsApp ↗</a><p class="muted">Se abre WhatsApp con el detalle completo de tu selección.</p>`;
      rememberOrder(r.order);celebrate($('#checkoutSuccess'));toast('Pedido registrado. Continuá por WhatsApp.');
    }catch(e){$('#checkoutError').textContent=e.message;}finally{button.disabled=false;button.removeAttribute('aria-busy');}
  };
}
