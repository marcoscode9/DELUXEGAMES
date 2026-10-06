import {$,state,api,escape,price,date,statuses,openDialog,closeDialog,normalize,toast,refreshProducts,updateHeader,busyForm} from './core.js';
import {renderCatalog,renderCart} from './store.js';
import {openAuth,orderHTML} from './account.js';
import {showOrderFeedback} from './feedback.js';
let data={products:[],orders:[],customers:[],movements:[]},editing=null,stockProduct=null;
const tabs={overview:'Resumen',products:'Publicaciones',inventory:'Inventario',orders:'Pedidos',customers:'Clientes',settings:'Configuración'};
async function refresh(){await refreshProducts();renderCatalog();renderCart();await renderAdmin();}
function productTable(products,inventory=false){return `<div class="table-wrap"><table class="admin-table"><thead><tr><th>PUBLICACIÓN</th><th>PRECIO / ARS</th><th>STOCK</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>${products.map(p=>`<tr><td><div class="table-product"><img src="${escape(p.image)}" width="36" height="46" alt=""><div><strong>${escape(p.name)}</strong><small>${escape(p.platforms.join(' / '))} · ${escape(p.type)}</small></div></div></td><td>${price(p.price)}</td><td>${p.stock===null?'A confirmar':p.stock}</td><td><span class="status">${p.active?(p.preorder?'Preventa':'Publicada'):'Archivada'}</span></td><td><div class="table-actions"><button data-stock="${escape(p.id)}">Ajustar stock</button>${inventory?'':`<button data-edit="${escape(p.id)}">Editar</button>${p.active?`<button data-archive="${escape(p.id)}">Archivar</button>`:''}`}</div></td></tr>`).join('')}</tbody></table></div>`;}
const stat=(label,value,note)=>`<div class="stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
export async function renderAdmin(){
  const view=$('#adminView');
  if(!state.user||state.user.role!=='admin'){
    view.style.display='block';view.innerHTML='<div class="section-wrap"><div class="page-heading"><div><span class="label">DELUXEGAMES / ADMINISTRACIÓN</span><h1>Tu tienda, <em>en tus manos.</em></h1></div></div><p class="muted">Gestioná publicaciones, stock y pedidos desde un solo lugar.</p><button id="adminLogin" class="button">Acceso administrador ↗</button></div>';$('#adminLogin').onclick=()=>openAuth(true,renderAdmin);return;
  }
  view.style.display='';data=await api('/admin/overview');
  view.innerHTML=`<aside class="admin-sidebar"><span class="label">DELUXEGAMES / ADMIN</span><nav aria-label="Panel administrativo">${Object.entries(tabs).map(([id,label])=>`<button data-admin-tab="${id}" class="${state.adminTab===id?'active':''}">${label}</button>`).join('')}</nav><a href="/">Volver a la tienda ↗</a></aside><section class="admin-main"><div class="page-heading"><div><span class="label">ADMINISTRACIÓN / ${tabs[state.adminTab].toUpperCase()}</span><h1>${tabs[state.adminTab]}<em>.</em></h1></div>${state.adminTab==='products'?'<button class="button" id="newProduct">Nueva publicación +</button>':'<a href="/cuenta" class="underline-link">Mi cuenta ↗</a>'}</div><div id="adminContent"></div></section>`;
  const content=$('#adminContent');
  if(state.adminTab==='overview'){
    const active=data.products.filter(p=>p.active),completed=data.orders.filter(o=>['confirmed','delivered'].includes(o.status));
    content.innerHTML=`<div class="admin-stats">${stat('Publicaciones activas',active.length,'En la colección')}${stat('Pedidos a confirmar',data.orders.filter(o=>o.status==='pending').length,'Disponibilidad y pago pendientes')}${stat('Clientes registrados',data.customers.length,'Cuentas de compradores')}${stat('Importe confirmado',price(completed.reduce((sum,o)=>sum+o.total,0)),'Pedidos confirmados o entregados')}</div><div class="notice">Los pedidos nuevos no reservan stock. Al confirmarlos, se descuenta el inventario. Cancelar un pedido confirmado repone las unidades. El pago se coordina por WhatsApp.</div><h2 class="dashboard-subtitle">Últimos pedidos</h2>${data.orders.length?data.orders.slice(0,5).map(o=>orderHTML(o,true)).join(''):'<p class="muted">Todavía no recibiste pedidos.</p>'}`;
  }else if(state.adminTab==='products'){
    content.innerHTML='<div class="admin-search"><input id="adminSearch" type="search" placeholder="Buscar una publicación" aria-label="Buscar publicación"><label><input id="showArchived" type="checkbox"> Mostrar archivadas</label></div><div id="adminProductTable"></div>';
    const filter=()=>{$('#adminProductTable').innerHTML=productTable(data.products.filter(p=>(p.active||$('#showArchived').checked)&&normalize(p.name).includes(normalize($('#adminSearch').value))));};$('#adminSearch').oninput=filter;$('#showArchived').onchange=filter;filter();$('#newProduct').onclick=()=>openEditor();
  }else if(state.adminTab==='inventory'){
    content.innerHTML=`<p class="admin-note">El stock inicial está sin cuantificar: no se inventaron unidades. Sumá o restá stock con un motivo para registrar cada movimiento.</p>${productTable(data.products.filter(p=>p.active),true)}<h2 class="dashboard-subtitle">Últimos movimientos</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>FECHA</th><th>JUEGO</th><th>MOVIMIENTO</th><th>RESULTADO</th><th>MOTIVO</th></tr></thead><tbody>${data.movements.map(m=>`<tr><td>${date(m.created_at)}</td><td>${escape(m.product_name)}</td><td>${m.delta>0?'+':''}${m.delta}</td><td>${m.resulting_stock??'A confirmar'}</td><td>${escape(m.reason)}</td></tr>`).join('')}</tbody></table></div>`;
  }else if(state.adminTab==='orders'){
    content.innerHTML='<div class="admin-search"><input id="orderSearch" type="search" placeholder="Buscar por cliente, email o pedido" aria-label="Buscar pedido"></div><div id="adminOrders"></div>';
    const filter=()=>{$('#adminOrders').innerHTML=data.orders.filter(o=>normalize(`${o.name} ${o.email} ${o.id}`).includes(normalize($('#orderSearch').value))).map(o=>orderHTML(o,true)).join('')||'<p class="muted">No hay pedidos con esa búsqueda.</p>';};$('#orderSearch').oninput=filter;filter();
  }else if(state.adminTab==='customers'){
    content.innerHTML=`<p class="admin-note">Clientes registrados y sus pedidos. Las contraseñas nunca se muestran ni se almacenan en texto plano.</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>CLIENTE</th><th>EMAIL</th><th>ALTA</th><th>PEDIDOS</th></tr></thead><tbody>${data.customers.map(c=>`<tr><td>${escape(c.name)}</td><td>${escape(c.email)}</td><td>${date(c.created_at)}</td><td>${c.orders}</td></tr>`).join('')}</tbody></table></div>`;
  }else{
    const s=state.settings;content.innerHTML=`<form id="settingsForm" class="settings-form"><label>Nombre de la tienda<input name="storeName" value="${escape(s.storeName)}" maxlength="60" required></label><label>WhatsApp (país + número, sin símbolos)<input name="whatsapp" value="${escape(s.whatsapp)}" pattern="[0-9]{8,15}" required></label><label>Email comercial<input name="supportEmail" value="${escape(s.supportEmail)}" type="email" maxlength="254"></label><label>Instagram<input name="instagram" value="${escape(s.instagram)}" type="url" placeholder="https://www.instagram.com/tu-cuenta/"></label><label>Información general de entrega<textarea name="deliveryNote" maxlength="500" required rows="3">${escape(s.deliveryNote)}</textarea></label><p id="settingsError" class="form-error" role="alert"></p><button class="button" type="submit">Guardar configuración ↗</button></form>`;
    $('#settingsForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#settingsError',async()=>{state.settings=await api('/admin/settings',{method:'PUT',body:Object.fromEntries(new FormData(ev.target))});updateHeader();toast('Configuración guardada.');});};
  }
  view.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>{state.adminTab=b.dataset.adminTab;renderAdmin().catch(e=>toast(e.message));});
}
function openEditor(p=null){
  editing=p;const form=$('#productForm');form.reset();$('#productFormError').textContent='';$('#imageUpload').value='';$('#uploadStatus').textContent='JPG, PNG o WebP · hasta 2 MB';$('#editorTitle').textContent=p?'Editar publicación':'Nueva publicación';
  const defaults={name:'',price:'',type:'Cuenta primaria',genre:'',stock:'',description:'',image:'',preorder:false,featured:false,active:true,releaseDate:'',delivery:'Confirmá disponibilidad y plazo por WhatsApp antes de pagar.'};
  for(const [key,val]of Object.entries({...defaults,...p})){const input=form.elements.namedItem(key);if(!input||key==='platforms')continue;if(input.type==='checkbox')input.checked=val;else input.value=val??'';}
  form.querySelectorAll('[name=platforms]').forEach(b=>b.checked=p?p.platforms.includes(b.value):b.value==='PS5');openDialog('editorDialog');
}
export function initializeAdmin(){
  $('#adminView').addEventListener('click',async ev=>{
    const edit=ev.target.closest('[data-edit]');if(edit)openEditor(data.products.find(p=>p.id===edit.dataset.edit));
    const stock=ev.target.closest('[data-stock]');if(stock){stockProduct=data.products.find(p=>p.id===stock.dataset.stock);$('#stockForm').reset();$('#stockFormError').textContent='';$('#stockProductName').textContent=`${stockProduct.name} · Actual: ${stockProduct.stock??'a confirmar'}`;openDialog('stockDialog');}
    const archive=ev.target.closest('[data-archive]');if(archive){const p=data.products.find(p=>p.id===archive.dataset.archive);$('#confirmError').textContent='';$('#confirmAction').onclick=async()=>{try{await api(`/admin/products/${p.id}`,{method:'DELETE',body:{version:p.version}});closeDialog('confirmDialog');toast('Publicación archivada.');await refresh();}catch(e){$('#confirmError').textContent=e.message;}};openDialog('confirmDialog');}
    const save=ev.target.closest('[data-save-order]');if(save){save.disabled=true;try{const id=save.dataset.saveOrder,previous=data.orders.find(order=>order.id===id)?.status;const result=await api(`/admin/orders/${id}`,{method:'PATCH',body:{status:document.querySelector(`[data-status="${id}"]`).value,note:document.querySelector(`[data-note="${id}"]`).value}});toast('Pedido actualizado.');await refresh();if(previous!==result.order.status&&['confirmed','delivered'].includes(result.order.status))showOrderFeedback(result.order,result.order.status);}catch(e){toast(e.message);}finally{save.disabled=false;}}
  });
  $('#productForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#productFormError',async()=>{const f=new FormData(ev.target),body=Object.fromEntries(f);if(!body.image)throw new Error('Subí una imagen o pegá una URL.');body.platforms=f.getAll('platforms');body.price=Number(body.price);body.stock=body.stock===''?null:Number(body.stock);for(const k of ['preorder','featured','active'])body[k]=f.has(k);if(editing)body.version=editing.version;await api(`/admin/products${editing?'/'+editing.id:''}`,{method:editing?'PATCH':'POST',body});closeDialog('editorDialog');toast('Publicación guardada.');await refresh();});};
  $('#stockForm').onsubmit=ev=>{ev.preventDefault();busyForm(ev.target,'#stockFormError',async()=>{const b=Object.fromEntries(new FormData(ev.target));b.delta=Number(b.delta);b.version=stockProduct.version;await api(`/admin/products/${stockProduct.id}/stock`,{method:'POST',body:b});closeDialog('stockDialog');toast('Movimiento de stock registrado.');await refresh();});};
  const uploadImage=async file=>{
    if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){$('#uploadStatus').textContent='Formato no soportado: usá JPG, PNG o WebP.';return;}
    if(file.size>2*1024*1024){$('#uploadStatus').textContent='La imagen supera los 2 MB.';return;}
    $('#uploadStatus').textContent='Subiendo imagen…';const save=$('#productForm button[type=submit]');save.disabled=true;
    try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const r=await api('/admin/media',{method:'POST',body:{mime:file.type,data}});$('#productForm [name=image]').value=r.url;$('#uploadStatus').textContent='Imagen guardada. Se asociará al guardar la publicación.';}catch(e){$('#uploadStatus').textContent=e.message;}finally{save.disabled=false;}
  };
  $('#imageUpload').onchange=ev=>uploadImage(ev.target.files[0]);
  const drop=$('#imageDrop');
  ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('dragging');}));
  drop.addEventListener('drop',e=>uploadImage(e.dataTransfer.files[0]));
  drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#imageUpload').click();}});
}
