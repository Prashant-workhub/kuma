import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
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

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

async function purgeUserProfiles() {
  console.log('🚀 INITIALIZING FIREBASE FIRESTORE USER PROFILE PURGE...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    console.log(`Found ${snapshot.docs.length} user profile documents in Firestore 'users' collection.`);

    let count = 0;
    for (const userDoc of snapshot.docs) {
      console.log(`Deleting user profile: ${userDoc.id}...`);
      await deleteDoc(doc(db, 'users', userDoc.id));
      count++;
    }

    console.log(`\n✅ SUCCESS: Deleted ${count} user logged in profiles from Firestore.`);
  } catch (error) {
    console.error('❌ Failed to delete user profiles:', error);
  }
}

purgeUserProfiles();
