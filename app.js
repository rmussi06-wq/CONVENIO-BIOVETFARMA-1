// Apps Script base (já confirmada)
export const APPS_SCRIPT_BASE = "https://script.google.com/macros/s/AKfycbz3w1f8f1yjfRdAtIXGejJOJx9UdGIDizFu_B-x3ZDXY-kqe0R5plh4nyoy-xF1C5a0UA/exec";

async function idToken() {
  const u = auth.currentUser;
  if (!u) throw new Error('Não autenticado');
  return await u.getIdToken(true);
}

/**
 * callApi(route, { method:'POST', body:{} })
 * OBS: Apps Script não lida bem com headers em todas as implantações,
 * então enviamos o idToken no CORPO do POST (ou como query em GET).
 */
export async function callApi(route, {auth: needAuth = true, method='GET', body=null} = {}) {
  let url = APPS_SCRIPT_BASE + '?route=' + encodeURIComponent(route);
  const headers = {'Content-Type':'application/json','X-App':'conv-bio'};

  if (needAuth) {
    const token = await idToken();
    if (method.toUpperCase() === 'POST') {
      body = Object.assign({}, body || {}, { idToken: token });
    } else {
      url += '&token=' + encodeURIComponent(token); // fallback para GET
    }
  }

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}
