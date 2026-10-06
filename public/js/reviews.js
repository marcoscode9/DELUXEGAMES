import {$,$$,escape} from './core.js';
import {reveal} from './motion.js';
import {reviews,reviewGames} from './reviews-data.js';

const PAGE=6;
const starPath='<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3Z"/>';
const star=fill=>`<span class="star"><svg viewBox="0 0 24 24" aria-hidden="true">${starPath}</svg><svg class="star-fill" style="clip-path:inset(0 ${100-fill}% 0 0)" viewBox="0 0 24 24" aria-hidden="true">${starPath}</svg></span>`;
const stars=rating=>`<span class="review-stars" role="img" aria-label="${rating} de 5 estrellas">${[1,2,3,4,5].map(n=>star(Math.max(0,Math.min(1,rating-n+1))*100)).join('')}</span>`;
const label=value=>String(value).replace('.',',');
// Intercala los juegos para que "Todas" muestre variedad desde el principio.
const queues=Object.keys(reviewGames).map(game=>reviews.filter(r=>r[0]===game));
const mixed=Array.from({length:Math.max(0,...queues.map(q=>q.length))},(_,i)=>queues.map(q=>q[i]).filter(Boolean)).flat();
let filter='all',shown=0;

const card=([game,user,rating,text])=>`<figure class="review-card">${stars(rating)}<blockquote><p>${escape(text)}</p></blockquote><figcaption><span class="review-avatar" aria-hidden="true">${escape(user.replace('@','').slice(0,2).toUpperCase())}</span><span class="review-person"><b>${escape(user)}</b><small>${escape(reviewGames[game])}</small></span></figcaption></figure>`;
const list=()=>filter==='all'?mixed:mixed.filter(r=>r[0]===filter);

function paint({append=false,animated=false}={}){
  const items=list(),track=$('#reviewsTrack'),from=append?shown:0;
  shown=Math.min(items.length,from+PAGE);
  if(!append){track.innerHTML='';track.scrollLeft=0;}
  track.insertAdjacentHTML('beforeend',items.slice(from,shown).map(card).join(''));
  if(animated)[...track.children].slice(from).forEach((el,i)=>reveal(el,Math.min(i,5)*60));
  const more=$('#reviewsMore');more.hidden=shown>=items.length;
  more.firstElementChild.textContent=`Ver más reseñas (${items.length-shown})`;
}

export function initializeReviews(){
  const section=$('#resenas');if(!section||!reviews.length)return;
  section.hidden=false;$$('[data-reviews-link]').forEach(link=>link.hidden=false);
  // Con la sección visible, la numeración de las secciones sigue el orden de la página.
  $$('#storeView section .label').filter(el=>/^\d\d \/ /.test(el.textContent)).forEach((el,i)=>{el.textContent=el.textContent.replace(/^\d\d/,String(i+1).padStart(2,'0'));});
  const average=Math.round(reviews.reduce((sum,r)=>sum+r[2],0)/reviews.length*10)/10;
  $('#reviewsAverage').textContent=label(average.toFixed(1));
  $('#reviewsStars').innerHTML=stars(average);
  $('#reviewsCount').textContent=`${reviews.length} ${reviews.length===1?'reseña':'reseñas'}`;
  const filters=$('#reviewFilters'),present=Object.entries(reviewGames).filter(([key])=>reviews.some(r=>r[0]===key));
  filters.hidden=present.length<2;
  filters.innerHTML=[['all','Todas']].concat(present).map(([key,name])=>`<button type="button" data-review-filter="${key}" aria-pressed="${key==='all'}">${escape(name)}</button>`).join('');
  filters.addEventListener('click',event=>{
    const button=event.target.closest('[data-review-filter]');if(!button||button.dataset.reviewFilter===filter)return;
    filter=button.dataset.reviewFilter;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    paint({animated:true});
  });
  $('#reviewsMore').addEventListener('click',()=>paint({append:true,animated:true}));
  paint();
}
