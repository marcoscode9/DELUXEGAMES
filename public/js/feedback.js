import {$,state,escape,price,readLocal,saveLocal,openDialog,toast} from './core.js';
import {animate} from './motion.js';
let pendingFeedback;

export const successIcon = '<div class="success-emblem" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div>';

export function celebrate(root) {
  const emblem=root.querySelector('.success-emblem');
  animate(emblem,[{opacity:0,transform:'scale(.45) rotate(-35deg)'},{opacity:1,transform:'scale(1.12) rotate(4deg)',offset:.65},{opacity:1,transform:'none'}],{duration:850});
  animate(emblem?.querySelector('path'),[{strokeDasharray:'45',strokeDashoffset:'45'},{strokeDasharray:'45',strokeDashoffset:'0'}],{duration:650,delay:220});
  for(let i=0;i<22;i++) {
    const particle=document.createElement('i');particle.className='celebration-particle';particle.setAttribute('aria-hidden','true');
    const angle=(i/22)*Math.PI*2, radius=55+Math.random()*55;
    emblem?.append(particle);
    const effect=animate(particle,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:1,offset:.15},{opacity:0,transform:`translate(${Math.cos(angle)*radius}px,${Math.sin(angle)*radius}px) rotate(${i*40}deg) scale(.4)`}],{duration:1000+Math.random()*400,delay:i*9});
    if(effect)effect.finished.then(()=>particle.remove(),()=>particle.remove());else particle.remove();
  }
  root.querySelectorAll('h2,h3,p,.status,.button').forEach((element,index)=>animate(element,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:500,delay:Math.min(index,4)*65}));
}

function eventKey(){return 'dg-order-events-'+(state.user?.id||'guest');}
export function rememberOrder(order) {
  const prior=readLocal(eventKey()).filter(item=>item.id!==order.id);
  saveLocal(eventKey(),[...prior,{id:order.id,status:order.status}].slice(-100));
}

export function showOrderFeedback(order,kind='confirmed') {
  const content=$('#feedbackContent');
  const delivered=kind==='delivered';
  content.innerHTML=`<div class="success-state">${successIcon}<span class="label">${delivered?'LISTO PARA TU PRÓXIMA PARTIDA':'CONFIRMACIÓN DE LA TIENDA'}</span><h2 id="feedbackTitle">${delivered?'Tu juego, entregado.':'Pedido confirmado.'}</h2><p>${delivered?'La administración marcó tu pedido como entregado. Si necesitás ayuda con la instalación, estamos cerca.':'La administración confirmó disponibilidad y pago. El pedido está listo para coordinar la entrega.'}</p><span class="status ${delivered?'delivered':'confirmed'}">${escape(order.id.slice(0,8).toUpperCase())} · ${price(order.total)} ARS</span><button class="button full" data-close="feedbackDialog">${delivered?'¡A jugar!':'Perfecto, continuar'} <span aria-hidden="true">↗</span></button></div>`;
  rememberOrder(order);openDialog('feedbackDialog');celebrate(content);
}

// Only announce actual server transitions from a previously observed order.
// Visiting an account with historical orders never triggers a flood of popups.
export function announceOrderChanges(orders) {
  const previous=new Map(readLocal(eventKey()).map(order=>[order.id,order.status]));
  const changed=orders.filter(order=>previous.has(order.id)&&previous.get(order.id)!==order.status);
  orders.forEach(rememberOrder);
  const success=changed.find(order=>['confirmed','delivered'].includes(order.status));
  if(success){if(document.querySelector('dialog[open]'))pendingFeedback={order:success,key:eventKey()};else showOrderFeedback(success,success.status);}
  else if(changed.some(order=>order.status==='cancelled'))toast('La tienda actualizó el estado de tu pedido. Revisá el detalle.');
}
document.addEventListener('close',()=>{
  if(!pendingFeedback||document.querySelector('dialog[open]'))return;
  const pending=pendingFeedback;pendingFeedback=null;
  if(pending.key===eventKey())showOrderFeedback(pending.order,pending.order.status);
},true);
