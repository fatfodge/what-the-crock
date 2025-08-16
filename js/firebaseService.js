import { auth, db } from './firebase.js';
import { sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';
import { where, orderBy, startAt, endAt, query, collection, getDocs, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

const RESTAURANTS_COLLECTION = 'restaurants';
const MAX_QUERY_RADIUS_METERS = 50 * 1000; // 50Km

export function initFirebaseService() {
    onAuthStateChanged(auth, (user) => updateProfileDisplay(user));
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const activeUserFrom = document.getElementById('activeUserFrom');
    const profileForms = [signupForm, loginForm, activeUserFrom];
    const fvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const profileBtn = document.getElementById('profile-btn');

    function updateProfileDisplay(user) {
        const profileOpen = profileForms.some(form => {
            return Math.abs(form.getBoundingClientRect().top - fvh) > 1;
        });
        profileForms.forEach(form => {
            form.style.transition = 'top 0.3s ease-out';
            form.style.top = `${fvh}px`;
        });
        if (user) {
            activeUserFrom.style.top = `${fvh * 0.2}px`;
            if (profileOpen) profileBtn.textContent = user.displayName.charAt(0).toUpperCase();
        } else {
            profileBtn.textContent = '?';
            if (profileOpen) loginForm.style.top = `${fvh * 0.2}px`;
        }
        setTimeout(() => {
            profileForms.forEach(form => {
                form.style.transition = '';
            });
        }, 400);
    }
}

/**
 * handles password reset
 * @param {string} email 
 */
export async function passwordReset(email) {
    if (!email) { alert('Please enter your email address.', 'error'); }
    else {
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Password reset email sent! Please check your inbox (and span folder).', 'success');
        } catch { alert('Error submitting password reset'); }
    }
}

function cleanMessage(message) {
    const cleanMessage = message
        .split(':').pop().trim()
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
    return cleanMessage
}


/**
 * Handles user sign-up.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * 
 * @returns {string}
 */
export async function signUp(username, email, password) {
    try {
        // 1. Check if username already exists
        const q = query(collection(db, "usernames"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return "Username already taken";
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        // doc(database, collectionName, docID)
        await setDoc(doc(db, "usernames", username), {
            uid: userCredential.user.uid,
            username: username,
            email: email
        });

    } catch (error) {
        console.log(error);
        return cleanMessage(error.message);
    }
}

/**
 * Handles user login.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(identifier, password) {
    try {
        let email = identifier;

        if (!identifier.includes("@")) {
            const q = query(collection(db, "usernames"), where("username", "==", identifier));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return "Username not found";

            const userData = snapshot.docs[0].data();
            email = userData.email; // get the email stored for this username
        }


        await signInWithEmailAndPassword(auth, email, password);

        return null;
    } catch (error) {
        console.log(error.message);
        return cleanMessage(error.message);
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

/**
 * 
 * @param {L.bounds} bounds 
 * @returns {Promise<Array<object>>}
 */
export async function getRestaurantsInBounds(bounds) {
    if (!bounds) {
        console.warn("no map bounds provided to getRestaurantInBounds");
        return;
    }
    const center = [bounds.getCenter().lat, bounds.getCenter().lng];
    let radiusInMeters = distanceBetween(
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng]
    ) * 1000;

    if (radiusInMeters > MAX_QUERY_RADIUS_METERS) {
        radiusInMeters = MAX_QUERY_RADIUS_METERS;
        console.warn(`query radius clamped to ${MAX_QUERY_RADIUS_METERS / 1000} km`)
    }

    const geohashBounds = geohashQueryBounds(center, radiusInMeters);

    const promises = [];
    for (const b of geohashBounds) {
        const q = query(
            collection(db, RESTAURANTS_COLLECTION),
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1])
        );
        promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);

    let matchingRestaurants = [];

    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const restaurantLatLng = L.latLng(data.location?.lat, data.location?.lng);
            if (bounds.contains(restaurantLatLng)) {
                matchingRestaurants.push({ id: doc.id, ...data });
            }
        });
    });

    return matchingRestaurants;
}

export async function getRestuarantReviews(restaurantID) {
    const reviewsRef = collection(db, 'restaurants', restaurantID, 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
    const reviewsData = [];
    reviewsSnapshot.forEach(doc => {
        reviewsData.push(doc.data());
    });
    return reviewsData;
}
