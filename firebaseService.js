import { db, auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';

/**
 * Handles user sign-up.
 * @param {string} email
 * @param {string} password
 */
export async function signUpUser(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Signed up!');
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
        alert('Logged in!');
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
        alert('signed out!')
    } catch (error) {
        console.error("Logout error:", error);
        alert('Failed to log out: ' + error.message);
    }
}