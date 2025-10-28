import { auth } from './firebase-init.js';

export const APPS_SCRIPT_BASE = "https://script.google.com/macros/s/AKfycbz3w1f8f1yjfRdAtIXGejJOJx9UdGIDizFu_B-x3ZDXY-kqe0R5plh4nyoy-xF1C5a0UA/exec";

async function idToken() {
  const u = auth.currentUser;
  if (!u) throw new Error('Não autenticado');
  return await u.getIdToken(true);
}

export async function callApi(route, { auth: needAuth = true, method = 'GET', body = null } = {}) {
  let url = APPS_SCRIPT_BASE + '?route=' + encodeURIComponent(route);
  const headers = { 'Content-Type': 'application/json', 'X-App': 'conv-bio' };

  if (needAuth) {
    const token = await idToken();
    if (method.toUpperCase() === 'POST') {
      body = Object.assign({}, body || {}, { idToken: token });
    } else {
      url += '&token=' + encodeURIComponent(token);
    }
  }

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}

const routeSections = new Map(
  Array.from(document.querySelectorAll('[data-route]')).map((el) => [el.dataset.route, el]),
);
const navLinks = document.querySelectorAll('[data-nav]');
const NAV_DEFAULT = '#/home';

function normalizeHash(hash) {
  if (!hash || !hash.startsWith('#/')) return NAV_DEFAULT;
  const route = hash.slice(2).split('?')[0];
  if (!routeSections.has(route)) return NAV_DEFAULT;
  return `#/${route}`;
}

function activateRoute(hash) {
  const safeHash = normalizeHash(hash);
  const route = safeHash.slice(2);
  routeSections.forEach((section, name) => {
    section.classList.toggle('hidden', name !== route);
  });
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === safeHash);
  });
  if (safeHash !== hash) {
    history.replaceState(null, '', safeHash);
  }
}

activateRoute(location.hash);
window.addEventListener('hashchange', () => activateRoute(location.hash));

const btnTestWrite = document.getElementById('btnTestWrite');
const testOut = document.getElementById('testOut');

btnTestWrite?.addEventListener('click', async () => {
  if (!testOut) return;
  testOut.textContent = 'Conferindo acesso...';
  try {
    const result = await callApi('testWrite', {
      method: 'POST',
      body: { message: 'deu certo' },
    });
    testOut.textContent = JSON.stringify(result, null, 2);
  } catch (err) {
    const reason = err?.message === 'Não autenticado'
      ? 'Faça login para testar a escrita na planilha.'
      : `Integração ainda não configurada (${err?.message || err}).`;
    testOut.textContent = reason;
  }
});

const dlgSignup = document.getElementById('signupModal');
const btnCloseSignup = document.getElementById('btnCloseSignup');
btnCloseSignup?.addEventListener('click', () => dlgSignup?.close());
