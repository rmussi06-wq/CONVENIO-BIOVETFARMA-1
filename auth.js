import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { callApi } from './app.js';

const $ = s => document.querySelector(s);
const loginView  = $('#loginView');
const appView    = $('#appView');
const authMsg    = $('#authMsg');
const userBadge  = $('#userBadge');
const topNav     = document.getElementById('topNav');

const btnLogin   = $('#btnLogin');
const btnLogout  = $('#btnLogout');

// Modal signup
const dlgSignup  = document.getElementById('signupModal');
const btnOpenSignup = document.getElementById('btnOpenSignup');
const btnDoSignup = document.getElementById('btnDoSignup');
const suMsg      = document.getElementById('su_msg');

// Forgot password
const btnForgot  = document.getElementById('btnForgot');

function show(v){
  const app = v==='app';
  loginView.classList.toggle('hidden', app);
  appView.classList.toggle('hidden', !app);
  topNav?.classList.toggle('hidden', !app);
  btnLogout?.classList.toggle('hidden', !app);
}

function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function friendly(e){
  const c = String(e?.code||'').replace('auth/','');
  const m = {
    'invalid-email':'E-mail inválido.',
    'missing-email':'Informe o e-mail.',
    'missing-password':'Informe a senha.',
    'weak-password':'Senha muito curta (mín. 6).',
    'user-not-found':'Usuário não encontrado.',
    'wrong-password':'Senha incorreta.',
    'email-already-in-use':'E-mail já está em uso.'
  };
  return m[c] || e?.message || 'Erro inesperado';
}
function busy(btn, on, idle, doing){
  btn.disabled = !!on; btn.textContent = on ? doing : idle;
}

/* ========== Login ========== */
btnLogin?.addEventListener('click', async () => {
  authMsg.textContent = '';
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!isEmail(email)) { authMsg.textContent = 'Informe um e-mail válido.'; return; }
  if (!password) { authMsg.textContent = 'Informe a senha.'; return; }
  busy(btnLogin, true, 'Entrar', 'Entrando...');
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) { authMsg.textContent = 'Firebase: ' + friendly(e); }
  finally { busy(btnLogin, false, 'Entrar', 'Entrando...'); }
});

/* Enter envia login quando estiver na view de login */
document.addEventListener('keydown', (e)=>{
  if (e.key !== 'Enter') return;
  if (!loginView || loginView.classList.contains('hidden')) return;
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.getAttribute('type') === 'submit')) return;
  btnLogin?.click();
});

/* ========== Abrir modal de cadastro ========== */
btnOpenSignup?.addEventListener('click', (e)=>{
  e.preventDefault();
  suMsg.textContent='';
  dlgSignup.showModal();
});

/* ========== Criar conta (profissional) ========== */
btnDoSignup?.addEventListener('click', async (e) => {
  e.preventDefault();
  suMsg.textContent='';
  const nome = $('#su_nome').value.trim();
  const prime = $('#su_prime').value.trim();
  const email = $('#su_email').value.trim();
  const senha = $('#su_senha').value;
  const conf  = $('#su_conf').value;
  if (!nome){ suMsg.textContent='Informe seu nome completo.'; return; }
  if (!isEmail(email)){ suMsg.textContent='Informe um e-mail válido.'; return; }
  if (!senha || senha.length<6){ suMsg.textContent='Senha deve ter pelo menos 6 caracteres.'; return; }
  if (senha !== conf){ suMsg.textContent='Senha e confirmação não conferem.'; return; }
  if (prime && !/^\d{1,20}$/.test(prime)){ suMsg.textContent='ID Prime deve ter apenas números.'; return; }

  busy(btnDoSignup, true, 'Criar conta', 'Criando...');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });
    // Registra no backend (Sheets + e-mail admin)
    try {
      await callApi('register', { method:'POST', body: { idPrime: prime, nome, email } });
    } catch(err) {
      console.warn('Falha ao registrar no backend:', err);
    }
    suMsg.textContent = 'Conta criada com sucesso!';
    dlgSignup.close();
  } catch (e) {
    suMsg.textContent = 'Firebase: ' + friendly(e);
  } finally {
    busy(btnDoSignup, false, 'Criar conta', 'Criando...');
  }
});

/* ========== Esqueci minha senha ========== */
btnForgot?.addEventListener('click', async (e)=>{
  e.preventDefault();
  const email = prompt('Informe seu e-mail para recuperar a senha:');
  if (!email) return;
  if (!isEmail(email)) { alert('E-mail inválido.'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Enviamos um e-mail com instruções de redefinição de senha.');
  } catch (err) {
    alert('Erro: ' + friendly(err));
  }
});

/* ========== Logout ========== */
btnLogout?.addEventListener('click', ()=> signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    userBadge.textContent = user.displayName ? `${user.displayName} · ${user.email}` : (user.email || 'Logado');
    show('app');
    if (!location.hash || location.hash==='#/') location.hash = '#/home';
  } else {
    userBadge.textContent = '';
    show('login');
    location.hash = '#/login';
  }
});
