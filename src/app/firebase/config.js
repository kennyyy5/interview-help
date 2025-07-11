// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import {getAuth} from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg8xv9VVNx0jkgWTmUWeScM0e1l-p5MpA",
  authDomain: "interview-help-a3d84.firebaseapp.com",
  projectId: "interview-help-a3d84",
  storageBucket: "interview-help-a3d84.firebasestorage.app",
  messagingSenderId: "533422448000",
  appId: "1:533422448000:web:99cbaa900d9b06c4ae7565"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app)
export {app,auth}