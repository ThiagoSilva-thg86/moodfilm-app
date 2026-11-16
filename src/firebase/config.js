// ============================================================
// Firebase Configuration
// As credenciais são carregadas a partir do arquivo .env
// Copie o .env.example para .env e preencha com suas credenciais
// console.firebase.google.com > Configurações do projeto > Seus apps
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHDTvlBtGa_8Yc8ipHlU5svwDzvinnJ2o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moodfilm-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moodfilm-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moodfilm-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284029355448",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:284029355448:web:27e0e09617532e3c26fb4d",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://moodfilm-app-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export default app;
