import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const $ = sel => document.querySelector(sel);

const loginView  = $('#loginView');
const appView    = $('#appView');
const authMsg    = $('#authMsg');
const userBadge  = $('#userBadge');
const topNav     = document.getElementById('topNav');

const btnLogin   = $('#btnLogin');
const btnSignup  = $('#btnSignup');
const btnLogout  = $('#btnLogout');

function show(view) {
  const showApp = view === 'app';
  loginView?.classList.toggle('hidden', showApp);
  appView?.classList.toggle('hidden', !showApp);
  topNav?.classList.toggle('hidden', !showApp);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function friendlyError(e) {
  const code = String(e?.code || '').replace('auth/', '');
  const map = {
    'invalid-email': 'E-mail inválido.',
    'missing-email': 'Informe o e-mail.',
    'missing-password': 'Informe a senha.',
    'weak-password': 'Senha muito curta (mín. 6 caracteres).',
    'user-not-found': 'Usuário não encontrado.',
    'wrong-password': 'Senha incorreta.',
    'email-already-in-use': 'Este e-mail já está em uso.'
  };
  return map[code] || (e?.message || 'Erro inesperado');
}
function setBusy(btn, busy, labelIdle, labelBusy) {
  if (!btn) return;
  btn.disabled = !!busy;
  btn.textContent = busy ? labelBusy : labelIdle;
}

/* ===== Ações ===== */

btnLogin?.addEventListener('click', async () => {
  authMsg.textContent = '';
  const email = $('#email')?.value.trim() || '';
  const password = $('#password')?.value || '';

  if (!isValidEmail(email)) {
    authMsg.textContent = 'Informe um e-mail válido.';
    return;
  }
  if (!password) {
    authMsg.textContent = 'Informe a senha.';
    return;
  }

  setBusy(btnLogin, true, 'Entrar', 'Entrando...');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged cuida do resto
  } catch (e) {
    authMsg.textContent = `Firebase: ${friendlyError(e)}`;
  } finally {
    setBusy(btnLogin, false, 'Entrar', 'Entrando...');
  }
});

btnSignup?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '';
  const email = $('#email')?.value.trim() || '';
  const password = $('#password')?.value || '';

  if (!isValidEmail(email)) {
    authMsg.textContent = 'Informe um e-mail válido.';
    return;
  }
  if (!password || password.length < 6) {
    authMsg.textContent = 'Defina uma senha com pelo menos 6 caracteres.';
    return;
  }

  setBusy(btnSignup, true, 'Criar conta', 'Criando...');
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    authMsg.textContent = 'Conta criada. Você já está logado.';
  } catch (e) {
    authMsg.textContent = `Firebase: ${friendlyError(e)}`;
  } finally {
    setBusy(btnSignup, false, 'Criar conta', 'Criando...');
  }
});

btnLogout?.addEventListener('click', async () => {
  setBusy(btnLogout, true, 'Sair', 'Saindo...');
  try { await signOut(auth); } finally { setBusy(btnLogout, false, 'Sair', 'Saindo...'); }
});

/* Enter = enviar login */
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && !appView?.classList.contains('hidden')) return;
  if (ev.key === 'Enter') btnLogin?.click();
});

/* Guarda de sessão/rota */
onAuthStateChanged(auth, (user) => {
  if (user) {
    userBadge && (userBadge.textContent = user.email || 'Logado');
    show('app');
    if (!location.hash || location.hash === '#/') location.hash = '#/home';
  } else {
    userBadge && (userBadge.textContent = '');
    show('login');
    location.hash = '#/login';
  }
});
