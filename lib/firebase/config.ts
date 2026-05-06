import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBw7mygh9beX6-msQvI0oALbWhOsiBLv64',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studio-1957447230-7295c.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-1957447230-7295c',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-1957447230-7295c.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '810803145379',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:810803145379:web:da946b9e5750fc5fa22d16',
};

const isFirebaseConfigured = true;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
db = getFirestore(app);
auth = getAuth(app);

export { app, db, auth, isFirebaseConfigured };
