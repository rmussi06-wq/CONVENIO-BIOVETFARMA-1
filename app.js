const $ = sel => document.querySelector(sel);

// Detecta online/offline
window.addEventListener('online', () => console.log('online')); 
window.addEventListener('offline', () => console.log('offline'));

// PWA install prompt opcional
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWA pode ser instalada');
});

// Ping no backend (Apps Script) — URL fornecida
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbz3w1f8f1yjfRdAtIXGejJOJx9UdGIDizFu_B-x3ZDXY-kqe0R5plh4nyoy-xF1C5a0UA/exec';

document.addEventListener('click', async (ev) => {
  if (ev.target && ev.target.id === 'btnPing') {
    const out = document.querySelector('#pingOut');
    if (!out) return;
    out.textContent = 'testando...';
    try {
      const r = await fetch(`${APPS_SCRIPT_BASE}?route=ping`, { headers: { 'x-app': 'conv-bio' }});
      const data = await r.json();
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = String(e);
    }
  }
});
