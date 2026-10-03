import {animate, dialogMotion, stopMotion} from './motion.js';
export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];
export const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const price = value => '$' + Number(value).toLocaleString('es-AR');
export const date = value => new Date(value).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});
export const statuses = {pending:'A confirmar',confirmed:'Confirmado',delivered:'Entregado',cancelled:'Cancelado'};
export function readLocal(key) {try{const result=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(result)?result:[];}catch{return [];}}
export function saveLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
export const state = {products:[],settings:{whatsapp:'5491127064347'},user:null,csrf:null,cart:[],favorites:readLocal('dg-favorites'),filter:'all',adminTab:'overview',accountTab:'orders',orderKey:crypto.randomUUID()};
export async function api(path,options={}) {
  const response=await fetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json',...(state.csrf?{'X-CSRF-Token':state.csrf}:{}),...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
  const result=await response.json();
  if(!response.ok){const e=new Error(result.error||'No pudimos completar la operación.');e.status=response.status;throw e;}
  return result;
}
let toastTimer;
export function toast(message){const element=$('#toast');element.textContent=message;element.hidden=false;animate(element,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:320});clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.hidden=true,4000);}
const dialogFocus = new WeakMap();
const closingDialogs = new WeakMap();
function finishClose(dialog){closingDialogs.delete(dialog);stopMotion(dialog);delete dialog.dataset.closing;dialog.close();}
export function openDialog(id){
  const dialog=document.getElementById(id);
  if(dialog.open){if(closingDialogs.has(dialog)){closingDialogs.delete(dialog);delete dialog.dataset.closing;dialogMotion(dialog,true);}return;}
  // A purchase can switch directly from details to the bag without two modal layers.
  let returnFocus=document.activeElement;
  $$('dialog[open]').forEach(other=>{if(other.contains(returnFocus))returnFocus=dialogFocus.get(other);finishClose(other);});
  dialogFocus.set(dialog,returnFocus);dialog.showModal();document.body.style.overflow='hidden';dialogMotion(dialog,true);
}
export function closeDialog(id){
  const dialog=document.getElementById(id);if(!dialog.open||closingDialogs.has(dialog))return;
  dialog.dataset.closing='true';const animation=dialogMotion(dialog,false);
  if(!animation){finishClose(dialog);return;}
  closingDialogs.set(dialog,animation);
  animation.finished.then(()=>{if(closingDialogs.get(dialog)===animation)finishClose(dialog);},()=>{});
}
export function initializeDialogs(){
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('close',()=>{const anotherOpen=$$('dialog[open]').length;document.body.style.overflow=anotherOpen?'hidden':'';const target=dialogFocus.get(dialog);if(!anotherOpen&&target?.isConnected)target.focus({preventScroll:true});});
    dialog.addEventListener('cancel',ev=>{ev.preventDefault();closeDialog(dialog.id);});
    dialog.addEventListener('click',ev=>{const r=dialog.getBoundingClientRect();if(ev.target===dialog&&(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom))closeDialog(dialog.id);});
    dialog.addEventListener('keydown',ev=>{if(ev.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button,input,textarea,select,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}});
  });
  document.addEventListener('click',ev=>{const b=ev.target.closest('[data-close]');if(b)closeDialog(b.dataset.close);});
}
export function normalize(text){return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
export function updateHeader(){
  $('#accountLabel').textContent=state.user?state.user.name.split(' ')[0]:'Mi cuenta';
  $('#guestFields').hidden=!!state.user;$('#guestFields').querySelectorAll('input').forEach(i=>i.required=!state.user);
  $$('.whatsapp-link').forEach(a=>a.href=`https://wa.me/${state.settings.whatsapp}`);
  $('#withdrawLink').href=`https://wa.me/${state.settings.whatsapp}?text=${encodeURIComponent('Quiero solicitar el arrepentimiento de mi compra.')}`;
  $$('[data-store-name]').forEach(el=>{
    if(el.classList.contains('brand-name')&&normalize(state.settings.storeName)==='deluxegames'){
      const bold=document.createElement('b'),light=document.createElement('span');bold.textContent='Deluxe';light.textContent='Games';el.replaceChildren(bold,light);
    }else el.textContent=state.settings.storeName;
  });
  const delivery=document.getElementById('storeDelivery');if(delivery)delivery.textContent=state.settings.deliveryNote;
  const links=document.getElementById('storeContactLinks');if(links){links.replaceChildren();for(const [href,label]of [[state.settings.supportEmail?`mailto:${state.settings.supportEmail}`:'','Email ↗'],[state.settings.instagram,'Instagram ↗']]){if(!href)continue;const a=document.createElement('a');a.href=href;a.textContent=label;a.target='_blank';a.rel='noopener';links.append(a);}}
}
export async function refreshProducts(){state.products=(await api('/products')).products;}
export async function syncFavorites(){if(state.user)await api('/favorites',{method:'PUT',body:{ids:state.favorites}});saveLocal('dg-favorites',state.favorites);}
export async function logout(){await api('/logout',{method:'POST',body:{}});state.user=null;state.csrf=null;state.favorites=[];saveLocal('dg-favorites',[]);location.href='/';}
export async function busyForm(form,errorId,work){const b=form.querySelector('button[type=submit]');if(b.disabled)return;b.disabled=true;b.setAttribute('aria-busy','true');$(errorId).textContent='';try{await work();}catch(e){$(errorId).textContent=e.message;animate($(errorId),[{opacity:0,translate:'0 -5px'},{opacity:1,translate:'0 0'}],{duration:250});}finally{b.disabled=false;b.removeAttribute('aria-busy');}}
