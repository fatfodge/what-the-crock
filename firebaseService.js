import { db, auth } from './firebase.js';
import {sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';
import {updateProfileContainerTop, updateProfileDisplay} from './ui.js';

export function initFirebaseService(){
    try{
    onAuthStateChanged(auth, (user) => authChanged(auth, user));
    } catch {console.log('firebase service not initilized');}
}

/**
 * handles password reset
 * @param {string} email 
 */
export async function passwordReset(email){
    if (!email){alert('Please enter your email address.', 'error');}
    else{
        try{
            await sendPasswordResetEmail(auth, email);
            alert('Password reset email sent! Please check your inbox (and span folder).','success');
        } catch { alert('Error submitting password reset'); }
    }
}


/**
 * Handles user sign-up.
 * @param {string} email
 * @param {string} password
 */
export async function signUpUser(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        //alert('Signed up!');
    } catch (error) {
        alert(error.message);
        console.error("Sign up error:", error);
    }
}

/**
 * Handles user login.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        //alert('Logged in!');
    } catch (error) {
        alert(error.message);
        console.error("Login error:", error);
    }
}

/**
 * Handles user logout.
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        //alert('signed out!')
    } catch (error) {
        console.error("Logout error:", error);
        alert('Failed to log out: ' + error.message);
    }
}

function authChanged(auth, user){
    updateProfileDisplay();
    updateProfileContainerTop();
}