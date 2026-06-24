import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Standard Firebase config with fallback to the provisioned Firebase instance
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDY1Z9BzbnB6l6kWm6A3iWeilaVjrtpRYY",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0952168484.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0952168484",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0952168484.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "604977910467",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:604977910467:web:f4f02c50bfe6b37d074876"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const databaseId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-f817e0db-2d30-4cc1-8c34-46f3ddc2bf8c";
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);
