// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXVtbiA8cr1au2FK6g722XM4QLoTPDAXg",
  authDomain: "dr-mohrir.firebaseapp.com",
  projectId: "dr-mohrir",
  storageBucket: "dr-mohrir.firebasestorage.app",
  messagingSenderId: "603846710283",
  appId: "1:603846710283:web:b0c85eec90980fa805230e",
  measurementId: "G-P8EWCKZ09P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
