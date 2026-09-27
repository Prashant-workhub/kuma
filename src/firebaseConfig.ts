/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Firebase client config from environment variables (Vite / .env) with safe fallback to default project
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD9_TnGVEFgPPu-M491xI30qFTsPbeZTvI',
  authDomain: 'kuma-e81ad.firebaseapp.com',
  projectId: 'kuma-e81ad',
  storageBucket: 'kuma-e81ad.firebasestorage.app',
  messagingSenderId: '551857697808',
  appId: '1:551857697808:web:971a6bc7f1acc42ef74695',
  measurementId: 'G-Z4DV1ZZ0EE'
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
};

let appInstance: ReturnType<typeof initializeApp>;
try {
  appInstance = initializeApp(firebaseConfig);
} catch (e) {
  console.error('Firebase initializeApp failed:', e);
  appInstance = initializeApp({ apiKey: DEFAULT_FIREBASE_CONFIG.apiKey, projectId: DEFAULT_FIREBASE_CONFIG.projectId });
}

let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = getAuth(appInstance);
} catch (e) {
  console.error('Firebase getAuth failed:', e);
  authInstance = {} as ReturnType<typeof getAuth>;
}

let dbInstance: ReturnType<typeof getFirestore>;
try {
  dbInstance = getFirestore(appInstance);
} catch (e) {
  console.error('Firebase getFirestore failed:', e);
  dbInstance = {} as ReturnType<typeof getFirestore>;
}

let storageInstance: ReturnType<typeof getStorage>;
try {
  storageInstance = getStorage(appInstance);
} catch (e) {
  console.error('Firebase getStorage failed:', e);
  storageInstance = {} as ReturnType<typeof getStorage>;
}

let googleProviderInstance: InstanceType<typeof GoogleAuthProvider>;
try {
  googleProviderInstance = new GoogleAuthProvider();
} catch (e) {
  console.error('Firebase GoogleAuthProvider failed:', e);
  googleProviderInstance = {} as InstanceType<typeof GoogleAuthProvider>;
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = googleProviderInstance;

export default app;
