import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDdkbve0p-cMLnsDGLyjbi7gUw9Wx1Ag38",
    authDomain: "whatthecrock-678ce.firebaseapp.com",
    projectId: "whatthecrock-678ce",
    storageBucket: "whatthecrock-678ce.appspot.com",
    messagingSenderId: "356507833622",
    appId: "1:356507833622:web:7381c7ae0551c1d92a2c37",
    measurementId: "G-8H2QF3TLHQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {db, auth };