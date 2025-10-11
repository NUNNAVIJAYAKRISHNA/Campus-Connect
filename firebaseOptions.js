// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const analytics = getAnalytics(app);