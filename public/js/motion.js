// One motion vocabulary, shared by the storefront and its purchase flows.
// Content stays readable if JavaScript or IntersectionObserver is unavailable.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const ease = 'cubic-bezier(.22,1,.36,1)';
const active = new Set();
const slots = new WeakMap();
const revealed = new WeakSet();
let observer, initialized = false, scheduleScene;

export function animate(element, frames, options = {}) {
  if (!element || preference.matches || !element.animate) return null;
  const {slot = 'entrance', ...timing} = options;
  let effects = slots.get(element);
  if (!effects) slots.set(element, effects = new Map());
  effects.get(slot)?.cancel();
  const animation = element.animate(frames, {duration:600, easing:ease, fill:'both', ...timing});
  effects.set(slot, animation);
  active.add(animation);
  const clean = () => {
    active.delete(animation);
    if (effects.get(slot) === animation) effects.delete(slot);
  };
  animation.finished.then(() => {clean();animation.cancel();}, clean);
  return animation;
}

export function stopMotion(element) {
  slots.get(element)?.forEach(animation => animation.cancel());
}

const inView = element => {
  const rect = element.getBoundingClientRect();
  return rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
};

export function reveal(element, delay = 0) {
  if (!element || revealed.has(element)) return;
  revealed.add(element);
  observer?.unobserve(element);
  animate(element, [{opacity:0, transform:'translateY(24px)'}, {opacity:1, transform:'none'}], {delay, duration:720});
}

export function observeReveals(root = document) {
  if (!initialized || preference.matches || !observer) return;
  root.querySelectorAll('.section-heading, .product-card, .editorial-copy > *, .steps > li, .trust-points, .review-card, .review-cta, .faq > div:first-child, .faq-list details, .closing > *, .footer-top > div, .page-heading, .stat, .order-card').forEach(element => {
    if (!revealed.has(element)) observer.observe(element);
  });
}

// FLIP retains actual product nodes so favorites, focus and rapid filters feel continuous.
export function catalogPositions(grid) {
  const positions = new Map();
  for (const card of grid.querySelectorAll('.product-card')) {
    positions.set(card.dataset.id, card.getBoundingClientRect());
    stopMotion(card);
  }
  return positions;
}

export function animateCatalog(grid, before) {
  if (!initialized || preference.matches) return;
  [...grid.children].forEach((card, index) => {
    const old = before.get(card.dataset.id), current = card.getBoundingClientRect();
    if (old && inView(card)) {
      const x = old.left-current.left, y = old.top-current.top;
      if (Math.abs(x)+Math.abs(y)>1) animate(card, [{transform:`translate(${x}px,${y}px)`}, {transform:'none'}], {slot:'layout', duration:480});
    } else if (!old && inView(card)) {
      revealed.delete(card);
      reveal(card, Math.min(index,5)*45);
    }
  });
  observeReveals(grid);
}

export function pulse(element) {
  animate(element, [{transform:'scale(1)'}, {transform:'scale(1.22)', offset:.35}, {transform:'scale(.96)', offset:.7}, {transform:'scale(1)'}], {slot:'feedback', duration:420});
}

export function dialogMotion(dialog, entering) {
  const drawer = dialog.classList.contains('side-dialog');
  const start = drawer ? 'translateX(100%)' : 'perspective(1000px) translateY(30px) rotateX(5deg) scale(.94)';
  const from = entering ? start : getComputedStyle(dialog).transform;
  const to = entering ? 'none' : drawer ? 'translateX(100%)' : 'translateY(12px) scale(.985)';
  return animate(dialog, [{transform:from, opacity:entering&&!drawer?0:1}, {transform:to, opacity:entering||drawer?1:0}], {
    slot:'dialog', duration:entering ? (drawer?520:380) : 180,
    easing:entering?ease:'cubic-bezier(.4,0,1,1)'
  });
}

export function animateMenu(menu) {
  if (!menu.hidden) animate(menu, [{opacity:0, transform:'translateY(-10px)'}, {opacity:1, transform:'none'}], {duration:300});
}

export function updateFilterIndicator() {
  const tabs = document.querySelector('.catalog-tabs');
  const selected = tabs?.querySelector('[aria-pressed=true]');
  const indicator = tabs?.querySelector('.filter-indicator');
  if (!selected || !indicator) return;
  indicator.style.width = selected.offsetWidth+'px';
  indicator.style.transform = `translateX(${selected.offsetLeft}px)`;
}

function initializeAccordion() {
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    let expanding = false, effect;
    summary.addEventListener('click', event => {
      if (preference.matches) return;
      event.preventDefault();
      const from = details.getBoundingClientRect().height;
      effect?.cancel();
      const next = effect ? !expanding : !details.open;
      const style = getComputedStyle(details);
      const closed = summary.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      details.open = true;
      const to = next ? details.scrollHeight+1 : closed;
      expanding = next;
      details.classList.add('faq-animating');
      effect = animate(details, [{height:from+'px'}, {height:to+'px'}], {slot:'accordion', duration:320});
      const current = effect;
      effect?.finished.then(() => {
        if (effect !== current) return;
        details.open = next;
        details.classList.remove('faq-animating');
        effect = null;
      }, () => {});
    });
  });
}

function initializeScene() {
  const hero = document.querySelector('.hero');
  const image = document.querySelector('.hero-image');
  const editorial = document.querySelector('.editorial-visual');
  const artwork = editorial?.querySelector('img');
  const header = document.querySelector('.site-header');
  let frame = 0, pointerX = 0, pointerY = 0;
  const render = () => {
    frame = 0;
    header.classList.toggle('is-scrolled', scrollY>16);
    const enabled = finePointer.matches && !preference.matches && !document.hidden;
    if (hero && image) {
      const rect = hero.getBoundingClientRect();
      const offset = enabled ? Math.max(-25,Math.min(55,-rect.top*.09)) : 0;
      image.style.translate = enabled ? `${pointerX*7}px ${offset+pointerY*5}px` : '';
      image.style.scale = enabled ? '1.045' : '';
    }
    if (editorial && artwork) {
      const rect = editorial.getBoundingClientRect();
      const progress = Math.max(-1,Math.min(1,(innerHeight/2-rect.top-rect.height/2)/innerHeight));
      artwork.style.translate = enabled ? `0 ${progress*42}px` : '';
      artwork.style.rotate = enabled ? `${progress*3}deg` : '';
    }
  };
  scheduleScene = () => {if (!frame) frame=requestAnimationFrame(render);};
  window.addEventListener('scroll',scheduleScene,{passive:true});
  window.addEventListener('resize',()=>{scheduleScene();updateFilterIndicator();},{passive:true});
  hero?.addEventListener('pointermove',event=>{
    if (!finePointer.matches || preference.matches) return;
    const rect=hero.getBoundingClientRect();
    pointerX=(event.clientX-rect.left)/rect.width-.5;
    pointerY=(event.clientY-rect.top)/rect.height-.5;
    scheduleScene();
  },{passive:true});
  hero?.addEventListener('pointerleave',()=>{pointerX=pointerY=0;scheduleScene();});
  finePointer.addEventListener('change',scheduleScene);
  render();
}

function initializeImmersiveMotion() {
  const hero=document.querySelector('.hero'), effects=new Map();
  let visible=inView(hero), tilted=null, frame=0, lastPointer;
  const sync=()=>{
    const enabled=visible&&!document.hidden&&!preference.matches;
    for(const [element,effect] of effects){if(preference.matches){effect.cancel();effects.delete(element);}else if(enabled)effect.play();else effect.pause();}
    if(enabled)hero.querySelectorAll('.hero-game img').forEach((element,index)=>{
      if(effects.has(element))return;
      const effect=element.animate([{translate:'0 0',scale:'1.025'},{translate:`0 ${index?-4:4}px`,scale:'1.045'},{translate:'0 0',scale:'1.025'}],{duration:index?7200:6000,iterations:Infinity,easing:'ease-in-out'});
      effects.set(element,effect);
    });
  };
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(hero);
  const resetTilt=()=>{if(tilted){tilted.style.transform='';tilted=null;}};
  document.addEventListener('pointermove',event=>{
    if(preference.matches||!finePointer.matches)return;
    const visual=event.target.closest('.card-visual');
    if(!visual){resetTilt();return;}
    lastPointer={visual,x:event.clientX,y:event.clientY};
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;if(preference.matches||!lastPointer.visual.isConnected)return;
      const {visual,x,y}=lastPointer,rect=visual.getBoundingClientRect();
      if(tilted!==visual)resetTilt();tilted=visual;
      const rx=Math.max(-4,Math.min(4,-((y-rect.top)/rect.height-.5)*8));
      const ry=Math.max(-6,Math.min(6,((x-rect.left)/rect.width-.5)*12));
      visual.style.transform=`perspective(650px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  },{passive:true});
  document.addEventListener('pointerleave',resetTilt);
  preference.addEventListener('change',()=>{resetTilt();sync();});
  finePointer.addEventListener('change',resetTilt);
  document.addEventListener('visibilitychange',()=>{resetTilt();sync();});
  sync();
}

export function initializeMotion() {
  if (initialized) return;
  initialized = true;
  document.body.classList.add('motion-ready');
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      let index=0;
      entries.forEach(({target,isIntersecting}) => {
        if (isIntersecting && !target.closest('[hidden]')) reveal(target, Math.min(index++,4)*65);
      });
    }, {threshold:.06});
  }
  const tabs=document.querySelector('.catalog-tabs');
  if (tabs) {
    const indicator=document.createElement('span');
    indicator.className='filter-indicator';indicator.setAttribute('aria-hidden','true');tabs.append(indicator);
    updateFilterIndicator();
    document.fonts.ready.then(updateFilterIndicator);
  }
  const hero=document.querySelector('.hero');
  if (hero && inView(hero)) {
    const title=document.getElementById('heroTitle');
    // Two lines keep the reading order and text intact for screen readers.
    const lines=title.innerHTML.split('<br>');
    if (lines.length===2) title.innerHTML=lines.map(line=>`<span class="hero-line">${line}</span>`).join(' ');
    [hero.querySelector('.label'),...hero.querySelectorAll('.hero-line'),hero.querySelector('p'),hero.querySelector('.button'),hero.querySelector('.hero-bottom')].forEach((element,index)=>{
      animate(element,[{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'none'}],{duration:900,delay:index*90});
    });
    animate(hero.querySelector('.hero-image'),[{opacity:.35,transform:'scale(1.06)'},{opacity:1,transform:'none'}],{duration:1600});
  }
  observeReveals();
  initializeAccordion();initializeScene();initializeImmersiveMotion();
  // New account/admin panels use the same entrance rhythm, without animating table rows.
  const mutations=new MutationObserver(records=>{
    for(const record of records) for(const node of record.addedNodes) if(node.nodeType===1 && !node.closest('dialog')) observeReveals(node.parentElement||node);
  });
  for(const id of ['accountView','adminView']) mutations.observe(document.getElementById(id),{childList:true,subtree:true});
  const settle = () => {for(const animation of active) {try{animation.finish();}catch{animation.cancel();}}};
  preference.addEventListener('change',()=>{if(preference.matches)settle();else observeReveals();scheduleScene?.();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();scheduleScene?.();});
}
