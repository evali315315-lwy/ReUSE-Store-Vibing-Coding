import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key]);

  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing.join(', '));
    throw new Error(
      `Missing Firebase configuration. Please check your .env file for: ${missing.map(k => `VITE_FIREBASE_${k.toUpperCase()}`).join(', ')}`
    );
  }
};

// Validate before initialization
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set auth persistence to local (survives browser restart)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

// Account credentials from environment
export const WORKER_EMAIL = import.meta.env.VITE_WORKER_EMAIL;
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Helper function to determine user role
export const getUserRole = (email) => {
  if (!email) return null;
  if (email === ADMIN_EMAIL) return 'admin';
  if (email === WORKER_EMAIL) return 'worker';
  return null;
};

export default app;
