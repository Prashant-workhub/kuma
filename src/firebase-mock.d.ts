declare module 'firebase/app' {
  export function initializeApp(config: any): any;
}
declare module 'firebase/auth' {
  export const getAuth: any;
  export const GoogleAuthProvider: any;
  export const GithubAuthProvider: any;
  export const signInWithPopup: any;
  export const signInWithRedirect: any;
  export const signInWithEmailAndPassword: any;
  export const createUserWithEmailAndPassword: any;
  export const signOut: any;
  export const onAuthStateChanged: any;
  export const updateProfile: any;
  export const sendPasswordResetEmail: any;
  export const sendEmailVerification: any;
}
declare module 'firebase/firestore' {
  export const getFirestore: any;
  export const collection: any;
  export const doc: any;
  export const getDoc: any;
  export const getDocs: any;
  export const setDoc: any;
  export const writeBatch: any;
  export const updateDoc: any;
  export const addDoc: any;
  export const deleteDoc: any;
  export const deleteField: any;
  export const query: any;
  export const where: any;
  export const orderBy: any;
  export const limit: any;
  export const onSnapshot: any;
  export const serverTimestamp: any;
  export const runTransaction: any;
}
declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytesResumable: any;
  export const getDownloadURL: any;
}
declare module 'firebase/messaging' {
  export const getMessaging: any;
  export const getToken: any;
  export const onMessage: any;
}
