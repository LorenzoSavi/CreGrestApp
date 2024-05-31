// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDCasrkhE9s1lD_Iqs63dllcwEowC2b_8M",
    authDomain: "cregrest-d4ce0.firebaseapp.com",
    projectId: "cregrest-d4ce0",
    storageBucket: "cregrest-d4ce0.appspot.com",
    messagingSenderId: "419460763354",
    appId: "1:419460763354:web:265742304949145ac8dfe3",
    measurementId: "G-1W31Z50SSJ"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  export { db };
