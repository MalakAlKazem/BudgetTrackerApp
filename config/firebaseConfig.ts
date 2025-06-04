// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
    apiKey: "AIzaSyC3GyAIMzKPPr4OHN_E-SCKIlmwnxpkbW8",
    authDomain: "budgettracker-7a738.firebaseapp.com",
    projectId: "budgettracker-7a738",
    storageBucket: "budgettracker-7a738.firebasestorage.app",
    messagingSenderId: "343693667435",
    appId: "1:343693667435:web:f47b632b9fba896a84d52e",
    measurementId: "G-001215ZETP"
  };
  

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };