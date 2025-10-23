// App shell + mini-roteador hash + helper callApi
import { auth } from './firebase-init.js';

const $ = (s)=>document.querySelector(s);
const outlet = $('#routerOutlet');

// Apps Script base (confirmado)
export const APPS_SCRIPT_BASE = "https://script.google.com/macros/s/AKfycbz3w1f8f1yjfRdAtIXGejJOJx9UdGIDizFu_B-x3ZDXY-kqe0R5plh4nyoy-xF1C5a0UA/exec";

async function idToken() {
  const u = auth.currentUser;
  if (!u) throw new Error('Não autenticado');
  return await u.getIdToken(true);
}

export async function callApi(route, {auth:trueAuth=true, method='GET', body=null} = {}){
  const headers = {'Content-Type':'application/json','X-App':'conv-bio'};
  if (trueAuth) headers['Authorization'] = 'Bearer ' + await idToken();
  const url = APPS_SCRIPT_BASE + '?route=' + encodeURIComponent(route);
  const res = await fetch(url, { method, headers, body: body?JSON.stringify(body):undefined });
  if (!res.ok) throw new Error('HTTP '+res.status);
  return await res.json();
}

/* Router simples */
const routes = {
  '#/home': () => { outlet.innerHTML = '<h2>Bem-vindo ao Convênio</h2><p>Escolha uma opção no menu acima.</p>'; },
  '#/solicitacoes': () => { outlet.innerHTML = '<h2>Minhas Solicitações</h2><p>(Mock) Em breve listaremos do Sheets.</p>'; },
  '#/nova': () => { outlet.innerHTML = '<h2>Nova Solicitação</h2><p>(Mock) Formulário aqui.</p>'; },
  '#/login': () => { /* view control é feito no auth.js */ },
};

function render(){
  const h = location.hash || '#/home';
  (routes[h] || routes['#/home'])();
}
window.addEventListener('hashchange', render);
window.addEventListener('load', render);

// PWA install prompt (opcional)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWA pode ser instalada');
});
