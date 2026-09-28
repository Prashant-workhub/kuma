import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

dotenv.config();

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD9_TnGVEFgPPu-M491xI30qFTsPbeZTvI',
  authDomain: 'kuma-e81ad.firebaseapp.com',
  projectId: 'kuma-e81ad',
  storageBucket: 'kuma-e81ad.firebasestorage.app',
  messagingSenderId: '551857697808',
  appId: '1:551857697808:web:971a6bc7f1acc42ef74695',
  measurementId: 'G-Z4DV1ZZ0EE'
};

async function purgeUserProfiles() {
  console.log('---------------------------------------------------------');
  console.log('🚀 INITIALIZING FIREBASE USER PROFILES PURGE');
  console.log('---------------------------------------------------------');

  const clientApp = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  });
  const auth = getAuth(clientApp);
  const clientDb = getFirestore(clientApp);

  console.log('Authenticating session with Firebase Auth...');
  try {
    const email = 'admin.purge@acme.com';
    const password = 'PurgeAdminSecret123!';
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Logged in as existing purge admin user.');
    } catch {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Created & logged in as purge admin user.');
    }
  } catch (authErr) {
    console.warn('Email auth failed, attempting anonymous auth:', authErr);
    try {
      await signInAnonymously(auth);
      console.log('✅ Authenticated anonymously.');
    } catch (anonErr) {
      console.warn('Anonymous auth failed:', anonErr);
    }
  }

  try {
    const usersCol = collection(clientDb, 'users');
    const snapshot = await getDocs(usersCol);
    console.log(`Found ${snapshot.docs.length} user profile document(s) in Firestore.`);

    let count = 0;
    for (const userDoc of snapshot.docs) {
      console.log(`Deleting user profile: ${userDoc.id}...`);
      await deleteDoc(doc(clientDb, 'users', userDoc.id));
      count++;
    }

    console.log(`\n✅ SUCCESS: Deleted ${count} user profile document(s) from Firestore.`);
  } catch (clientErr) {
    console.error('❌ Failed to delete user profiles:', clientErr);
  }
}

purgeUserProfiles();
