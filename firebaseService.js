import { db, auth } from './firebase.js';
import { orderBy, startAt, endAt, collection, query, where, addDoc, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js';
import { geohashQueryBounds, distanceBetween, geohashForLocation } from 'geofire-common'; // You'd need to install this: npm install geofire-common

let setProfileSheetStateCallback;
//let loadRestaurantPinsCallback;
let displayRestaurantDetailsCallback; // New: Callback for displaying restaurant details
let getMapBoundsCallback;

const RESTAURANTS_COLLECTION = 'restaurants'; // Your Firestore collection name for restaurants

const MAX_QUERY_RADIUS_METERS = 500 * 1000; // 500 kilometers
/**
 * Calculates the geohash for a given latitude and longitude.
 * This function should be used when saving new restaurant data to Firestore.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} The geohash string.
 */
export function calculateGeohash(latitude, longitude, percision = 5) {
    return geohashForLocation([latitude, longitude], percision);
}

/**
 * Fetches restaurant documents from Firestore that fall within the given Leaflet map bounds.
 * Uses geohashing for efficient spatial querying.
 *
 * @param {L.LatLngBounds} bounds - A Leaflet LatLngBounds object representing the visible map area.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of restaurant objects.
 */
export async function getRestaurantsInBounds(bounds) {
    if (!bounds) {
        console.warn("No map bounds provided to getRestaurantsInBounds.");
        return [];
    }
    console.log("bounds", bounds);
    // Get the center point of the bounds as a [lat, lng] array for geofire-common
    const center = [bounds.getCenter().lat, bounds.getCenter().lng];

    console.log("center", center);
    //console.log("center",center);
    // Calculate the approximate radius of the bounding box's diagonal in meters.
    // We'll use the distance between the northeast and southwest corners.
    const radiusInMeters = distanceBetween(
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng]
    ) * 1000;

    console.log('radiusInMeters', radiusInMeters);

    //clamp radius bounds to max_query_radius
    if (radiusInMeters > MAX_QUERY_RADIUS_METERS) {
        radiusInMeters = MAX_QUERY_RADIUS_METERS;
        console.warn(`Query radius clamped to ${MAX_QUERY_RADIUS_METERS / 1000} km to prevent excessively large queries.`);
        console.warn(`Original diagonal was ${(distanceBetween([bounds.getNorthEast().lat, bounds.getNorthEast().lng], [bounds.getSouthWest().lat, bounds.getSouthWest().lng]) / 1000).toFixed(2)} km.`);
    }



    // Get the geohash query bounds. This returns an array of [start, end] geohash ranges
    // that cover the circular area defined by center and radius.
    const geohashBounds = geohashQueryBounds(center, radiusInMeters);

    console.log("geohashBounds", geohashBounds);

    //console.log("gehoashBounds",geohashBounds);

    const promises = [];
    for (const b of geohashBounds) {
        //console.log("b",b);
        const q = query(
            collection(db, RESTAURANTS_COLLECTION),
            orderBy('geohash'), // Order by geohash to use the index
            startAt(b[0]),     // Start of the geohash range
            endAt(b[1])        // End of the geohash range
        );
        promises.push(getDocs(q));
    }

    // Execute all geohash range queries in parallel
    const snapshots = await Promise.all(promises);

    const matchingRestaurants = [];

    // Client-side filtering:
    // Geohash queries cover square regions, so some points returned might be
    // just outside the actual circular/rectangular query area.
    // We must perform a precise client-side check against the *exact* map bounds.
    console.log("snapshots", snapshots);
    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log("Processing document ID:", doc.id);
            console.log("Document data:", data); // See the full document data
            //console.log("data.latitude:", data.lat); // Check if this is undefined
            //console.log("data.longitude:", data.lng); // Check if this is undefined
            console.log("data.location.lat:", data.location?.lat); // Check for nested lat/lng
            console.log("data.location.lng:", data.location?.lng); // Check for nested lat/lng
            // Create a Leaflet LatLng object for the restaurant's coordinates
            const restaurantLatLng = L.latLng(data.location?.lat, data.location?.lng);

            // Check if the restaurant's coordinates are actually within the map's visible bounds
            if (bounds.contains(restaurantLatLng)) {
                matchingRestaurants.push({ id: doc.id, ...data });
            }
        });
    });

    console.log(`Geohash query returned ${matchingRestaurants.length} restaurants within bounds.`);
    return matchingRestaurants;
}

/**
 * Sets up callbacks for UI interactions.
 * @param {Function} profileSheetCallback Function to control profile sheet state.
 * @param {Function} refreshPinsCallback Function to reload map pins.
 * @param {Function} displayRestaurantDetailsCb Function to display restaurant details and reviews.
 */
export function setFirebaseUICallbacks(profileSheetCallback, displayRestaurantDetailsCb,getMapBoundsCB) {
    setProfileSheetStateCallback = profileSheetCallback;
    //loadRestaurantPinsCallback = refreshPinsCallback;
    displayRestaurantDetailsCallback = displayRestaurantDetailsCb; // Assign the new callback
    getMapBoundsCallback = getMapBoundsCB
    console.log("Firebase UI callbacks set.");
}


/**
 * Handles user authentication state changes and updates UI.
 */
export function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        const profileBtn = document.getElementById('profile-btn');
        const loginForm = document.getElementById('login-form');
        const activeUserFrom = document.getElementById('activeUserFrom');
        const adminPanel = document.getElementById('adminPanelSheet');
        const profileSheet = document.getElementById('profile-sheet'); // Get reference for class check

        if (!profileBtn || !loginForm || !activeUserFrom || !adminPanel || !profileSheet) {
            console.warn("Auth UI elements not found for state change.");
            return;
        }

        let profileShowing = !profileSheet.classList.contains('profile-sheet--hidden');

        if (user) {
            profileBtn.textContent = user.email[0].toUpperCase();
            loginForm.style.display = 'none';
            activeUserFrom.style.display = 'block';
            if (user.uid === '0r7MhhMXrwSu7IUAgia4zpTrop32') { // Admin UID
                adminPanel.style.display = 'block';
                if (profileShowing && setProfileSheetStateCallback) {
                    setProfileSheetStateCallback("max");
                }
            } else {
                adminPanel.style.display = 'none';
                if (profileShowing && setProfileSheetStateCallback) {
                    setProfileSheetStateCallback("min");
                }
            }
        } else {
            profileBtn.textContent = "?";
            loginForm.style.display = 'block';
            activeUserFrom.style.display = 'none';
            adminPanel.style.display = 'none';
            if (profileShowing && setProfileSheetStateCallback) {
                setProfileSheetStateCallback("min");
            }
        }
    });
    console.log("Firebase Auth listener set up.");
}

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
    } catch (error) {
        console.error("Logout error:", error);
        alert('Failed to log out: ' + error.message);
    }
}

/**
 * Handles selection of a place suggestion, checking for existing restaurants
 * and preparing the form for new submissions or displaying existing restaurant.
 * @param {Object} suggestion The Google Maps Autocomplete suggestion object.
 * @param {Function} showExistingRestaurantCallback Callback to show existing restaurant details (DEPRECATED, use displayRestaurantDetailsCallback).
 * @param {Function} autofillNewRestaurantFormCallback Callback to autofill new restaurant form.
 * @param {boolean} [autofill=false] If true, forces the submission form to open,
 * regardless of whether a restaurant already exists.
 */
export async function handleSuggestionSelection(suggestion, autofillNewRestaurantFormCallback, autofill = false) { // Removed showExistingRestaurantCallback as separate param
    const placeId = suggestion.placePrediction.placeId;
    const name = suggestion.placePrediction.text.text.split(',')[0].trim();

    try {
        const geocoder = new google.maps.Geocoder();
        const geocodeResult = await geocoder.geocode({ placeId });
        const place = geocodeResult.results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address;

        const restaurantsQuery = query(
            collection(db, "restaurants"),
            where("address", "==", address)
        );
        const restaurantsSnapshot = await getDocs(restaurantsQuery);

        let isExisting = !restaurantsSnapshot.empty;

        if (!restaurantsSnapshot.empty && !autofill) {
            const restaurantDoc = restaurantsSnapshot.docs[0];
            console.log("restaurantDoc",restaurantDoc);
            const restaurantData = { id: restaurantDoc.id, ...restaurantDoc.data() };

            // Fetch reviews for this restaurant
            const reviewsRef = collection(db, 'restaurants', restaurantDoc.id, 'reviews');
            const reviewsSnapshot = await getDocs(reviewsRef);
            const reviewsData = [];
            reviewsSnapshot.forEach(doc => {
                reviewsData.push(doc.data());
            });

            // Use the new displayRestaurantDetailsCallback
            if (displayRestaurantDetailsCallback) {
                displayRestaurantDetailsCallback(restaurantData, reviewsData);
            } else {
                console.warn("displayRestaurantDetailsCallback not provided to firebaseService.");
            }
            console.log("Restaurant match found and details displayed.");
        } else {
            console.log("autofillNewRestaurantFormCallback", { name, address, lat, lng, isExisting });
            if (autofillNewRestaurantFormCallback) autofillNewRestaurantFormCallback({ name, address, lat, lng, isExisting });
            console.log("No restaurant match, autofilling new form.");
        }
    } catch (error) {
        console.error("Error in handleSuggestionSelection:", error);
    }
}

/**
 * Handles the submission of a new restaurant or review.
 * @param {HTMLFormElement} form The new restaurant form element.
 * @param {Function} showSearchCallback Callback to return to search view.
 * @param {Function} displayRestaurantDetailsCb Function to display restaurant details after adding review to existing.
 */
export async function submitNewRestaurantOrReview(form, showSearchCallback, displayRestaurantDetailsCb) {
    const name = form.querySelector('#newName').value.trim();
    const address = form.querySelector('#newAddress').value.trim();
    const lat = parseFloat(form.querySelector('#newLat').value);
    const lng = parseFloat(form.querySelector('#newLng').value);
    const review = form.querySelector('#optionalRatingNotes').value.trim();
    const rating = parseInt(form.querySelector('#ratingValue').value);

    const user = auth.currentUser;
    if (!user && (rating > 0 || review)) {
        alert("You must be logged in to leave a review.");
        return;
    }

    try {
        // First, check if the restaurant already exists in the `restaurants` collection
        const existingRestaurantQuery = query(
            collection(db, 'restaurants'),
            where('address', '==', address)
        );
        const existingRestaurantSnapshot = await getDocs(existingRestaurantQuery);

        let restaurantDocRef;
        if (!existingRestaurantSnapshot.empty) {
            // Restaurant already exists in `restaurants` collection, just add a review to it
            restaurantDocRef = doc(db, 'restaurants', existingRestaurantSnapshot.docs[0].id);
            console.log("Restaurant already in 'restaurants', adding review directly.");
        } else {
            // Restaurant does not exist in `restaurants`, proceed with submission process
            const submissionsQuery = query(
                collection(db, 'submissions'),
                where('address', '==', address)
            );
            const submissionSnapshot = await getDocs(submissionsQuery);

            const geohash = calculateGeohash(lat, lng);

            const submissionData = {
                name,
                address,
                location: { lat, lng },
                submittedAt: serverTimestamp(),
                geohash
            };

            let submissionDocRef;
            if (submissionSnapshot.empty) {
                submissionDocRef = await addDoc(collection(db, 'submissions'), submissionData);
                console.log("New submission created with ID:", submissionDocRef.id);
            } else {
                const existingDoc = submissionSnapshot.docs[0];
                submissionDocRef = doc(db, 'submissions', existingDoc.id);
                console.log("Submission already exists, potentially adding review to existing one:", existingDoc.id);
            }
            // If the submission is approved, it will be moved to restaurants, then its reviews transferred.
            // For now, if adding a review, add it to the submission.
            restaurantDocRef = submissionDocRef; // For review adding purposes below, point to submission
        }

        if (rating > 0 || review) {
            const reviewData = {
                stars: rating,
                notes: review || "",
                userId: user.uid,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(restaurantDocRef, 'reviews'), reviewData); // Add review to actual restaurant OR submission
            console.log("Review added.");
        }

        form.reset();
        form.querySelector('#ratingValue').value = "0";
        form.querySelectorAll('.star-rating .star').forEach(star => star.classList.remove('selected'));

        // After submission/review, decide where to go
        if (!existingRestaurantSnapshot.empty && displayRestaurantDetailsCb) {
            // If it was an existing restaurant, fetch updated reviews and display details
            const updatedRestaurantData = { id: existingRestaurantSnapshot.docs[0].id, ...existingRestaurantSnapshot.docs[0].data() };
            const reviewsRef = collection(db, 'restaurants', existingRestaurantSnapshot.docs[0].id, 'reviews');
            const updatedReviewsSnapshot = await getDocs(reviewsRef);
            const updatedReviewsData = [];
            updatedReviewsSnapshot.forEach(doc => updatedReviewsData.push(doc.data()));
            displayRestaurantDetailsCb(updatedRestaurantData, updatedReviewsData);
            alert("Review added!");
        } else {
            // If it was a new submission, go back to search
            if (showSearchCallback) showSearchCallback();
            alert("Submission sent for approval!");
        }
    } catch (error) {
        console.error("Error submitting:", error);
        alert("Oops! Something went wrong with your submission. Try again.");
    }
}

/**
 * Loads pending restaurant submissions for admin review.
 */
export async function loadPendingSubmissions() {
    const list = document.getElementById('pendingSubmissionsList');
    if (!list) {
        console.warn("pendingSubmissionsList element not found.");
        return;
    }
    list.innerHTML = 'Loading...';

    try {
        const submissionsRef = collection(db, 'submissions');
        const snapshot = await getDocs(submissionsRef);
        list.innerHTML = '';

        if (snapshot.empty) {
            list.innerHTML = '<p>No pending submissions.</p>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;

            const item = document.createElement('div');
            item.classList.add('submission-card');

            const reviewsRef = collection(docSnap.ref, 'reviews');
            getDocs(reviewsRef).then(reviewsSnapshot => {
                let reviewsHtml = '';
                if (!reviewsSnapshot.empty) {
                    reviewsSnapshot.forEach(reviewDoc => {
                        const reviewData = reviewDoc.data();
                        reviewsHtml += `
                            <p><strong>Reviewer:</strong> ${reviewData.userId ? reviewData.userId.substring(0, 6) + '...' : 'Anonymous'}</p>
                            <p><strong>Stars:</strong> ${reviewData.stars ?? 0}</p>
                            <p><strong>Notes:</strong> ${reviewData.notes ?? 'No notes'}</p>
                        `;
                    });
                } else {
                    reviewsHtml = '<p>No reviews for this submission.</p>';
                }

                item.innerHTML = `
                    <strong>${data.name}</strong><br>
                    ${data.address}<br>
                    <div class="submission-reviews">${reviewsHtml}</div>
                    <button onclick="window.approveSubmission('${docId}')">Approve</button>
                    <button onclick="window.rejectSubmission('${docId}')">Reject</button>
                `;
                list.appendChild(item);
            }).catch(err => {
                console.error('Error fetching reviews for submission:', docId, err);
                item.innerHTML = `
                    <strong>${data.name}</strong><br>
                    ${data.address}<br>
                    <p>Error loading reviews.</p>
                    <button onclick="window.approveSubmission('${docId}')">Approve</button>
                    <button onclick="window.rejectSubmission('${docId}')">Reject</button>
                `;
                list.appendChild(item);
            });
        });
    } catch (err) {
        list.innerHTML = 'Error loading submissions.';
        console.error('Error fetching submissions:', err);
    }
}

/**
 * Approves a pending submission, moves it to restaurants, and deletes the submission.
 * @param {string} submissionId The ID of the submission to approve.
 */
export async function approveSubmission(submissionId) {
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
        console.error("Submission not found for approval.");
        return;
    }

    const submissionData = submissionSnap.data();

    try {
        // Step 1: Create the new restaurant document
        const restaurantRef = await addDoc(collection(db, 'restaurants'), {
            name: submissionData.name,
            address: submissionData.address,
            location: submissionData.location,
            geohash: submissionData.geohash,
            createdAt: serverTimestamp()
        });
        console.log(`Approved submission ${submissionId}. Created restaurant ${restaurantRef.id}.`);

        // Step 2: Transfer reviews as a batch write for efficiency
        const submissionReviewsRef = collection(submissionRef, 'reviews');
        const reviewsSnap = await getDocs(submissionReviewsRef);

        const restaurantReviewsRef = collection(restaurantRef, 'reviews');
        const transferPromises = [];
        const deleteReviewPromises = [];

        for (const reviewDoc of reviewsSnap.docs) {
            const reviewData = reviewDoc.data();
            transferPromises.push(addDoc(restaurantReviewsRef, {
                ...reviewData,
                transferredAt: serverTimestamp()
            }));
            //deleteReviewPromises.push(deleteDoc(doc(restaurantReviewsRef, reviewDoc.id)));
            deleteReviewPromises.push(deleteDoc(reviewDoc.ref));
        }

        await Promise.all(transferPromises);
        console.log(`Transferred ${transferPromises.length} reviews for ${submissionId}.`);

        // Step 3: Delete reviews from the submission
        await Promise.all(deleteReviewPromises);
        console.log(`Deleted reviews from submission ${submissionId}.`);

        // Step 4: Delete the submission itself
        await deleteDoc(submissionRef);
        console.log(`Deleted submission ${submissionId}.`);


        await loadPendingSubmissions(); // Refresh the admin view
        /*if (getMapBoundsCallback()) {
            console.log("refresh pins");
            await getRestaurantsInBounds(getMapBoundsCallback()); // Refresh map pins
        }*/
       /* await loadPendingSubmissions(); // Refresh the admin view
        if (loadRestaurantPinsCallback) {
            await loadRestaurantPinsCallback(); // Refresh map pins
        }*/
        alert("Submission approved and restaurant added!");
    } catch (error) {
        console.error("Error approving submission:", error);
        alert('Failed to approve submission: ' + error.message);
    }
}

/**
 * Rejects and deletes a pending submission and its associated reviews.
 * @param {string} docId The ID of the submission to reject.
 */
export async function rejectSubmission(docId) {
    const confirmed = confirm("Are you sure you want to reject and permanently delete this submission and its reviews?");
    if (!confirmed) return;
    try {
        const submissionRef = doc(db, 'submissions', docId);
        const docSnap = await getDoc(submissionRef);
        if (!docSnap.exists()) {
            alert('Submission not found.');
            return;
        }

        const reviewsRef = collection(submissionRef, 'reviews');
        const reviewsSnap = await getDocs(reviewsRef);

        const deletePromises = [];
        for (const reviewDoc of reviewsSnap.docs) {
            deletePromises.push(deleteDoc(doc(reviewsRef, reviewDoc.id)));
        }
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} reviews for submission ${docId}.`);

        await deleteDoc(submissionRef);
        console.log(`Submission ${docId} and its reviews rejected and deleted.`);
        await loadPendingSubmissions(); // refresh the admin view
        alert("Submission rejected and deleted.");
    } catch (err) {
        console.error('Error rejecting submission:', err);
        alert('Failed to reject submission: ' + err.message);
    }
}

// Expose these for onclick attributes in dynamically loaded HTML (like pending submissions list)
window.approveSubmission = approveSubmission;
window.rejectSubmission = rejectSubmission;