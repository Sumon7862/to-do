// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuk-iYCgmWoRIhrZuL94l1IJgq2AIhrmo",
  authDomain: "to-do-63a14.firebaseapp.com",
  projectId: "to-do-63a14",
  storageBucket: "to-do-63a14.firebasestorage.app",
  messagingSenderId: "279150023959",
  appId: "1:279150023959:web:eb0496441a495344235352",
  measurementId: "G-F448ML9HP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default firebaseConfig