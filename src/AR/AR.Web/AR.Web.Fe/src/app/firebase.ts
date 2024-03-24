import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1Zz5iSMMJk8CY2nG8xKE_vlGofHMcIiM",
  authDomain: "aleksaristic-a5d8e.firebaseapp.com",
  databaseURL: "https://aleksaristic-a5d8e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aleksaristic-a5d8e",
  storageBucket: "aleksaristic-a5d8e.appspot.com",
  messagingSenderId: "857982060001",
  appId: "1:857982060001:web:cd3f85d1b1d24016e97ea0",
  measurementId: "G-YJPV6CFW8W"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);