import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    // ... suas chaves aqui ...
    apiKey: "AIzaSyBfD2ebBay_Aqvf4NKQ5kP01yTbBe9fq_Q",
    authDomain: "financechart-41c8d.firebaseapp.com",
    projectId: "financechart-41c8d",
    storageBucket: "financechart-41c8d.firebasestorage.app",
    messagingSenderId: "701580996602",
    appId: "1:701580996602:web:a65bb0304a803b0da73e43",
    measurementId: "G-7N29BXB72L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// --- CORREÇÃO AQUI ---
// Mude de "APP_COLLECTION" para "appId"
export const appId = "ascend-prod";