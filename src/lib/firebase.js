// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Your web app's Firebase configuration pujab8776
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


const firebaseConfig = {
  apiKey: "AIzaSyCrAX4RvbYu0pr_EvkQkjjqFFaA1h38hLk",
  authDomain: "openroot-time-ai-module.firebaseapp.com",
  projectId: "openroot-time-ai-module",
  storageBucket: "openroot-time-ai-module.firebasestorage.app",
  messagingSenderId: "954933963560",
  appId: "1:954933963560:web:fb2e83ccc8146608e83e1d",
  measurementId: "G-J9SYLGHB3C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);