// main.js (or app.js)

import { auth } from './firebase.js';

//import { initializeMap, centerMapOnUser, loadRestaurantPins, getMapInstance, setdisplayRestaurantDetailsCb } from './map.js';
import { initializeMap, centerMapOnUser, getMapInstance, setdisplayRestaurantDetailsCb } from './map.js';

import { initAutoComplete } from './autoComplete.js';
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

const header = document.querySelector('header');
const footer = document.querySelector('footer');
const main = document.querySelector('main');

let totalViewportHt;
let mainHeight;

/*function showViewportDimensions() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // window.visualViewport is more accurate for the *visible* area when keyboard is open
    // but not supported everywhere. Provide fallback.
    const visualViewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const visualViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    alert(
        `Viewport Dimensions:\n` +
        `window.innerWidth: ${windowWidth}px\n` +
        `window.innerHeight: ${windowHeight}px\n\n` +
        `visualViewport.width: ${visualViewportWidth}px\n` +
        `visualViewport.height: ${visualViewportHeight}px\n` +
        `(visualViewport is the *visible* area, accounting for keyboard)`
    );
}*/

function adjustMainHeight() {
    if (!main || !header || !footer) return;

    const visualViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const visualDelta =  visualViewportHeight - totalViewportHt;
    const newMainHt = mainHeight - visualDelta
    //alert(totalViewportHt - visualViewportHeight);
    main.style.height = `${newMainHt}px`;

}

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustMainHeight);
} else {
    window.addEventListener('resize', adjustMainHeight); // Fallback for older browsers
}

function lockToPortrait() {
    // Check if the Screen Orientation API is supported
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait')
            .then(() => {
                console.log('Screen orientation locked to portrait.');
            })
            .catch((error) => {
                console.warn('Failed to lock screen orientation:', error);
                // This typically fails if:
                // 1. Not in fullscreen mode
                // 2. Not triggered by a user gesture (e.g., button click)
                // 3. Browser doesn't support it or user has restrictions
            });
    } else {
        console.warn('Screen Orientation API not supported or lock method unavailable.');
        // Fallback or inform user
    }
}
window.addEventListener('load', adjustMainHeight);

// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    lockToPortrait();
    totalViewportHt = window.innerHeight;
    if (main && header && footer) {
        let headerHeight = header.offsetHeight;
        let footerHeight = footer.offsetHeight;
        mainHeight = totalViewportHt - headerHeight - footerHeight;
        main.style.marginTop = `${headerHeight}px`;
        //alert(`main.offsetHeight at DOMContentLoaded: ${mainOffsetHeight}px`);

        // You can store this value or use it for initial calculations.
        // For example, if you need to set initial heights for nested elements
        // or calculate available space for content before any user interaction.
    } else {
        alert("Main element not found!");
    }
    // 1. Initialize UI elements
    adjustMainHeight();
    initializeUIElements();

    // 2. Initialize Leaflet Map
    const map = initializeMap('map', [27.964157, -82.452606], 11);
    centerMapOnUser();
    //loadRestaurantPins();
    setdisplayRestaurantDetailsCb(displayRestaurantDetails);



    // 3. Set up Firebase Auth listener and UI callbacks
    // Pass the new displayRestaurantDetails function to the Firebase service
    //setFirebaseUICallbacks(setProfileSheetState, loadRestaurantPins, displayRestaurantDetails);
    setFirebaseUICallbacks(setProfileSheetState, displayRestaurantDetails, getMapBounds);

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