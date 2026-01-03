// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";   
//import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBF86Ec7ojAmzNPNQX0qgSSsT4lxw8r3vY",
  authDomain: "ktuactivitypointmanagement.firebaseapp.com",
  projectId: "ktuactivitypointmanagement",
  storageBucket: "ktuactivitypointmanagement.firebasestorage.app",
  messagingSenderId: "1047451981396",
  appId: "1:1047451981396:web:bc6cdeb01977a312babfc1",
//   measurementId: "G-3PQ20SDHNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);