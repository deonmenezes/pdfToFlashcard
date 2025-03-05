import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCP4xR7Q_jDzQON7lSVxaAUn_MXhUHPcG0",
    authDomain: "quizitt-caa26.firebaseapp.com",
    databaseURL: "https://quizitt-caa26-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quizitt-caa26",
    storageBucket: "quizitt-caa26.firebasestorage.app",
    messagingSenderId: "174304432711",
    appId: "1:174304432711:web:1d7bcba28fccf7c5211762",
    measurementId: "G-SQ7EGZ08ZE"
};

// Ensure Firebase is initialized only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
