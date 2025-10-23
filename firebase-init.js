import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBwQzMILAfxVqxnB4_ZNMfAZ1hTOigI-o8",
  authDomain: "conveniobvf.firebaseapp.com",
  projectId: "conveniobvf",
  storageBucket: "conveniobvf.firebasestorage.app",
  messagingSenderId: "783050233537",
  appId: "1:783050233537:web:6719d99f4cff28f03a6640",
  measurementId: "G-SVEJKDM715"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
