/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// `import.meta.env` is a Vite compile-time construct and is undefined when this
// module is executed outside Vite (e.g. Node-based unit tests or SSR).
// Reading it defensively keeps those environments working via the defaults below.
const env = (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
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
/** @deprecated Azure Blob Storage is the sole storage backend for Project Kuma. Firebase Storage is removed. */
export const storage = null as any;
export const googleProvider = googleProviderInstance;

export default app;
