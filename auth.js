import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const $ = sel => document.querySelector(sel);
const loginView = $('#loginView');
const appView = $('#appView');
const authMsg = $('#authMsg');
const userBadge = $('#userBadge');

$('#btnLogin').addEventListener('click', async () => {
  authMsg.textContent = '...';
  try {
    const email = $('#email').value.trim();
    const password = $('#password').value;
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    authMsg.textContent = e.message;
  }
});

$('#btnSignup').addEventListener('click', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '...';
  try {
    const email = $('#email').value.trim();
    const password = $('#password').value;
    await createUserWithEmailAndPassword(auth, email, password);
    authMsg.textContent = 'Conta criada. Você já está logado.';
  } catch (e) {
    authMsg.textContent = e.message;
  }
});

$('#btnLogout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    userBadge.textContent = user.email || 'Logado';
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  } else {
    userBadge.textContent = '';
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
});
