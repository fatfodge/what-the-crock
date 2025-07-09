// main.js (or app.js)

import { auth } from './firebase.js';

//import { initializeMap, centerMapOnUser, loadRestaurantPins, getMapInstance, setdisplayRestaurantDetailsCb } from './map.js';
import { initializeMap, centerMapOnUser, getMapInstance, setdisplayRestaurantDetailsCb } from './map.js';

import { initAutoComplete } from './autocomplete.js';
import {
    initializeUIElements,
    setBottomPanelState,
    setProfileSheetState,
    displayRestaurantDetails,
    autofillNewRestaurantForm,
    showSearch,
    setupStarRating,
    showRestaurantsInView
} from './ui.js';
import {
    setFirebaseUICallbacks,
    setupAuthListener,
    signUpUser,
    loginUser,
    logoutUser,
    handleSuggestionSelection,
    submitNewRestaurantOrReview,
    loadPendingSubmissions,
} from './firebaseService.js';

// Import functions from ui.js
import {
    getCurrentPanelState, // You'll pass this to swipeHandler.js
} from './ui.js';

// Import initSwipeHandling from swipeHandler.js
import { initSwipeHandling } from './swipeHandler.js';

import { getMapBounds } from './map.js';
import { getRestaurantsInBounds } from './firebaseService.js';

let previousBottomPanelState = 'min';

// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI elements
    initializeUIElements();

    // 2. Initialize Leaflet Map
    const map = initializeMap('map', [27.964157, -82.452606], 11);
    centerMapOnUser();
    //loadRestaurantPins();
    setdisplayRestaurantDetailsCb(displayRestaurantDetails);



    // 3. Set up Firebase Auth listener and UI callbacks
    // Pass the new displayRestaurantDetails function to the Firebase service
    //setFirebaseUICallbacks(setProfileSheetState, loadRestaurantPins, displayRestaurantDetails);
    setFirebaseUICallbacks(setProfileSheetState, displayRestaurantDetails,getMapBounds);

    setupAuthListener();

    // 4. Initialize Google Maps Autocomplete
    await initAutoComplete(map, setBottomPanelState, (suggestion, autoFillOverride = false) => {
        // When a suggestion is selected in autocomplete, call the service function
        handleSuggestionSelection(suggestion, autofillNewRestaurantForm, autoFillOverride);
    }, auth, showRestaurantsInView);

    /*document.addEventListener('mapIdle', async () => {
        console.log("Map idle (Leaflet). Fetching visible restaurants...");
        const bounds = getMapBounds();
        if (bounds) {
            const restaurants = await getRestaurantsInBounds(bounds);
            console.log("Found restaurants in bounds:", restaurants);
            //displayRestaurantsOnMap(restaurants); // Pass to mapService to put markers on map
        }
    });*/

    // 5. Set up UI Event Listeners
    document.getElementById("locate-btn").addEventListener("click", () => {
        centerMapOnUser();
    });

    const addressInput = document.getElementById('address-input');
    const mapContainer = document.getElementById('map-container');
    const cancelSearchBtn = document.getElementById('cancel-search-btn');
    const profileBtn = document.getElementById('profile-btn');
    const closeLoginFormBtn = document.getElementById('closeLoginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const newRestaurantFormElement = document.getElementById('newRestaurantForm');

    // 2. Get the bottom panel element.
    // It's safe to get it here because initializeUIElements() has run.
    const bottomPanelElement = document.getElementById('bottom-panel');
    if (bottomPanelElement) {
        initSwipeHandling(bottomPanelElement, setBottomPanelState, getCurrentPanelState);
        setBottomPanelState('min');
    } else {
        console.error("Error: The 'bottom-panel' element was not found in the DOM. Swipe handling cannot be initialized.");
    }


    // Select all buttons with the common class and attach the showSearch function
    document.querySelectorAll('.restaurant-closeBtn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior (like form submission)
            showSearch(); // Call showSearch from ui.js for ANY .restaurant-closeBtn
        });
    });

    if (addressInput) addressInput.addEventListener("click", () => setBottomPanelState("max"));
    if (mapContainer) mapContainer.addEventListener("click", () => {
        const currentPanel = document.getElementById('bottom-panel');
        if (currentPanel && currentPanel.classList.contains('sheet--max')) {
            setBottomPanelState("mid");
        }
    });
    if (cancelSearchBtn) cancelSearchBtn.addEventListener("click", () => setBottomPanelState("mid"));

    if (profileBtn) profileBtn.addEventListener("click", () => {
        previousBottomPanelState = getCurrentPanelState();
        console.log("previousBottomPanelState", previousBottomPanelState);
        setBottomPanelState("min");
        const user = auth.currentUser;
        if (user && user.uid === '0r7MhhMXrwSu7IUAgia4zpTrop32') {
            loadPendingSubmissions();
            setProfileSheetState("max");
        } else {
            setProfileSheetState("min");
        }
    });

    if (closeLoginFormBtn) closeLoginFormBtn.addEventListener('click', () => {
        setProfileSheetState("hidden");
        setBottomPanelState(previousBottomPanelState)
    });
    if (loginOverlay) loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) {
            setProfileSheetState("hidden");
            setBottomPanelState(previousBottomPanelState);
        }
    });

    // Firebase Auth Form Handlers
    document.getElementById('signupBtn').addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        signUpUser(email, password);
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        loginUser(email, password);
    });

    document.getElementById('lgoutBtn').addEventListener("click", () => {
        logoutUser();
    });

    // Removed the redundant restaurant-closeBtn loop as it's now handled specifically for #restaurant-display
    // and showSearch handles all panel hiding/showing.

    // Setup star rating
    setupStarRating();

    // Handle new restaurant form submission
    if (newRestaurantFormElement) {
        newRestaurantFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Pass the displayRestaurantDetails function for showing an existing restaurant after review
            await submitNewRestaurantOrReview(newRestaurantFormElement, showSearch, displayRestaurantDetails);
        });
    }

    console.log("Main app initialized.");
});