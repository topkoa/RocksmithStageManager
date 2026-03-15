import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';

// Firebase config - replace with your own project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseDb(): Database {
  if (!db) {
    db = getDatabase(getFirebaseApp());
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export async function ensureAuthenticated(): Promise<string> {
  const authInstance = getFirebaseAuth();

  if (authInstance.currentUser) {
    return authInstance.currentUser.uid;
  }

  const credential = await signInAnonymously(authInstance);
  return credential.user.uid;
}
