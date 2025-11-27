import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 - TetraTalk 4개국어 앱
const firebaseConfig = {
  apiKey: "AIzaSyCxNsWmZ36Y__2syRPqiUhv4H-kgel4L_8",
  authDomain: "tetratalk-4lang.firebaseapp.com",
  projectId: "tetratalk-4lang",
  storageBucket: "tetratalk-4lang.firebasestorage.app",
  messagingSenderId: "1066117559704",
  appId: "1:1066117559704:web:32f967e40af4655d0d67ed",
  measurementId: "G-3LXS0GGHD0"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 간단한 Firebase Auth 초기화 (AsyncStorage 문제 해결을 위해 기본 설정으로)
export const auth = getAuth(app);
export const db = getFirestore(app);
