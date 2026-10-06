import {$,$$,state,api,readLocal,initializeDialogs,updateHeader,syncFavorites,toast} from './core.js';
import {initializeStore,restoreCart,renderCart,renderCatalog} from './store.js';
import {initializeAccount,renderAccount} from './account.js';
import {initializeAdmin,renderAdmin} from './admin.js';
import {initializeMotion, animateMenu} from './motion.js';
initializeDialogs();initializeStore();initializeAccount();initializeAdmin();
$('#menuToggle').onclick=()=>{const open=$('#mobileNav').hidden;$('#mobileNav').hidden=!open;$('#menuToggle').setAttribute('aria-expanded',String(open));animateMenu($('#mobileNav'));};
$('#mobileNav').addEventListener('click',ev=>{if(ev.target.closest('a')){$('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false');}});
const positionMenu=()=>{$('#mobileNav').style.top=$('.site-header').getBoundingClientRect().bottom+'px';};
$('#menuToggle').addEventListener('click',positionMenu);window.addEventListener('scroll',positionMenu,{passive:true});
async function start(){
  const [products,session,settings]=await Promise.all([api('/products'),api('/session'),api('/settings')]);
  state.products=products.products;state.user=session.user;state.csrf=session.csrf;state.settings=settings;
  if(state.user){const {ids}=await api('/favorites');state.favorites=ids;}else if(!state.favorites.length)state.favorites=readLocal('favoritos').filter(id=>state.products.some(p=>p.id===id));
  const query=new URLSearchParams(location.search).get('q');if(query){$('#searchInput').value=query;$('#headerSearch').value=query;}
  restoreCart();updateHeader();renderCart();renderCatalog();
  document.body.dataset.ready='true';
  if(location.pathname==='/admin'){$('#storeView').hidden=true;$('#adminView').hidden=false;await renderAdmin();}
  else if(location.pathname==='/cuenta'){$('#storeView').hidden=true;$('#accountView').hidden=false;await renderAccount();}
  if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
  initializeMotion();
}
start().catch(e=>{console.error(e);$('#productGrid').innerHTML='<div class="empty-state"><h3>Volvemos en un momento.</h3><p>No pudimos cargar la colección. Recargá la página para intentar nuevamente.</p></div>';$('#resultCount').textContent='SIN CONEXIÓN';toast(e.message);});
