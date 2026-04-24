import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB68U08bNUt9UlDKZvTW53dgx-JyYvfP4s",
  authDomain: "agrilink-deployment.firebaseapp.com",
  projectId: "agrilink-deployment",
  storageBucket: "agrilink-deployment.firebasestorage.app",
  messagingSenderId: "1007438454762",
  appId: "1:1007438454762:web:55030e71bf21c9021a9c93",
  measurementId: "G-Y45TCBE0DS"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
