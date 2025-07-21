import { auth, db } from './firebase.js';
import { sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';
import { orderBy, startAt, endAt, query, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { updateProfileDisplay } from './ui.js';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

const RESTAURANTS_COLLECTION = 'restaurants';
const MAX_QUERY_RADIUS_METERS = 50 * 1000; // 50Km

export function initFirebaseService() {
    try {
        onAuthStateChanged(auth, (user) => updateProfileDisplay());
    } catch { console.log('firebase service not initilized'); }
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
