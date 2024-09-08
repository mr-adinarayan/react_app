// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {GoogleAuthProvider, getAuth, signInWithPopup} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7qtkV1gHsC92TgRRHvxGzaVKj-kiMPQE",
  authDomain: "react-blogging-b2904.firebaseapp.com",
  projectId: "react-blogging-b2904",
  storageBucket: "react-blogging-b2904.appspot.com",
  messagingSenderId: "1085466267492",
  appId: "1:1085466267492:web:e36d39931ec4735acf7471",
  measurementId: "G-F6Z280P10K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const Provider = new GoogleAuthProvider();
const auth = getAuth();
export const authWithGoogle=async()=>{
    let user=null;
    await signInWithPopup(auth,Provider)
    .then((result)=>{
        user=result.user
    })
    .catch((err)=>{
        console.log(err);
    })
}