import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJECT_ID.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Não foi possível aplicar persistência local do Firebase Auth:', err);
});

if ((firebaseConfig.apiKey || '').includes('SUA_')) {
  console.warn('⚠️  Configure firebase-init.js com as credenciais reais do seu projeto Firebase.');
}
