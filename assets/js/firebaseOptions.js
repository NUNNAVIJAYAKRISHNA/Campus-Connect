// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlI18ztHNticKmHnPZwWgpkJGYHVCa2_Q",
  authDomain: "event-connect-87b9c.firebaseapp.com",
  projectId: "event-connect-87b9c",
  storageBucket: "event-connect-87b9c.firebasestorage.app",
  messagingSenderId: "1017566795753",
  appId: "1:1017566795753:web:82a7e40d3ab1469791dd78",
  measurementId: "G-LNDRFGMDQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };