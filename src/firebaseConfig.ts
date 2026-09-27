/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Firebase client config from environment variables (Vite) with kuma-e81ad fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD9_TnGVEFgPPu-M491xI30qFTsPbeZTvI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kuma-e81ad.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kuma-e81ad',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kuma-e81ad.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '551857697808',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:551857697808:web:971a6bc7f1acc42ef74695',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Z4DV1ZZ0EE'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
