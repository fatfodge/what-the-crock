// autocomplete.js
import { getDocs, query, collection, where } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { db, auth } from './firebase.js';
// Global variables for Google Maps objects within this module's scope.
// These should be declared ONCE at the top.
let Place;
let AutocompleteSessionToken;
let AutocompleteSuggestion;
let Geocoder;

// Variables to hold references to functions/instances passed from the main app.
// These should also be declared ONCE at the top.
let currentMapInstance;
let setBottomPanelStateCallback;
let handleSuggestionSelectionCallback;
let authInstance; // To check user login status for "Add/Rate Business" button
let showRestaurantsInViewCb;

/**
 * Debounce helper function
 * @param {Function} fn The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Initializes the Google Maps Autocomplete service.
 * This should be called after the main Google Maps script is loaded.
 * @param {L.Map} mapInstance The Leaflet map instance.
 * @param {Function} setPanelStateCallback A callback function to set the bottom panel state.
 * @param {Function} suggestionSelectionHandler A callback function to handle place suggestion selection.
 * @param {Object} firebaseAuthInstance The Firebase Auth instance to check user login.
 */
export async function initAutoComplete(mapInstance, setPanelStateCallback, suggestionSelectionHandler, firebaseAuthInstance, showRestaurantsInViewCallback) {
    // Assign the passed-in values to the module-scoped variables
    currentMapInstance = mapInstance;
    setBottomPanelStateCallback = setPanelStateCallback;
    handleSuggestionSelectionCallback = suggestionSelectionHandler;
    authInstance = firebaseAuthInstance;
    showRestaurantsInViewCb = showRestaurantsInViewCallback;

    try {
        // Ensure google.maps is fully loaded
        while (typeof google === 'undefined' || typeof google.maps === 'undefined' || typeof google.maps.importLibrary === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait a bit longer if needed
        }

        const placesLib = await google.maps.importLibrary("places");
        Place = placesLib.Place;
        AutocompleteSessionToken = placesLib.AutocompleteSessionToken;
        AutocompleteSuggestion = placesLib.AutocompleteSuggestion;

        // Geocoder is in the 'maps' library, so it usually comes with the base load.
        // If you were to explicitly load it: const mapsLib = await google.maps.importLibrary("maps");
        Geocoder = new google.maps.Geocoder();

        console.log("Google Maps Autocomplete and Geocoder initialized.");
        setupInputListener(); // Now it's safe to set up the listener
    } catch (error) {
        console.error("Error initializing Google Maps Autocomplete:", error);
        // You might want to disable the input field or show an error message
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.placeholder = "Autocomplete unavailable";
            addressInput.disabled = true;
        }
    }
}

/**
 * Sets up the event listener for the address input field to trigger autocomplete.
 */
function setupInputListener() {
    const input = document.getElementById('address-input');
    const resultsBox = document.getElementById('results');

    if (!input || !resultsBox) {
        console.error("Autocomplete input or results box not found.");
        return;
    }

    input.addEventListener('input', debounce(async function () {
        const val = this.value.trim();

        if (val.length < 3) {
            resultsBox.innerHTML = '';
            return;
        }

        if (!currentMapInstance) {
            console.error("Map instance not available for location bias.");
            resultsBox.innerHTML = '<li>Error: Map not initialized.</li>';
            return;
        }
        if (!AutocompleteSuggestion) {
            console.error("AutocompleteSuggestion not initialized.");
            resultsBox.innerHTML = '<li>Error: Autocomplete service not ready.</li>';
            return;
        }


        const mapCenter = currentMapInstance.getCenter();
        const locationBias = {
            north: mapCenter.lat + 0.09,
            south: mapCenter.lat - 0.09,
            east: mapCenter.lng + 0.09,
            west: mapCenter.lng - 0.09,
        };

        // Ensure AutocompleteSessionToken is available
        if (!AutocompleteSessionToken) {
            console.error("AutocompleteSessionToken not initialized.");
            resultsBox.innerHTML = '<li>Error: Autocomplete session not ready.</li>';
            return;
        }
        const token = new AutocompleteSessionToken();
        const request = {
            input: val,
            sessionToken: token,
            locationBias: locationBias,
            // Add any other desired restrictions here, e.g., types, componentRestrictions
            // types: ['establishment'] // Example: only search for establishments
        };

        try {
            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            resultsBox.innerHTML = '';

            const userLoggedIn = authInstance && authInstance.currentUser && authInstance.currentUser.email;

            for (const suggestion of suggestions) {
                const li = document.createElement('li');
                li.classList.add('result-item');

                const fullText = suggestion.placePrediction.text.text;
                const [mainText, ...rest] = fullText.split(',');
                const secondaryText = rest.join(',').trim();
                const types = suggestion.placePrediction.types;
                const placeId = suggestion.placePrediction.placeId;
                const addAddress = userLoggedIn && (types.includes('premise') || types.includes('establishment') || types.includes('street_address'));

                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = `
                    <div class="main-text">${mainText.trim()}</div>
                    <div class="secondary-text">${secondaryText}</div>
                `;

                li.appendChild(contentDiv);

                const { results } = await Geocoder.geocode({ placeId: placeId });
                const place = results[0]

                const restaurantsQuery = query(
                    collection(db, "restaurants"),
                    where("address", "==", place.formatted_address)
                );
                const restaurantsSnapshot = await getDocs(restaurantsQuery);

                if (addAddress) {
                    const addBtn = document.createElement('button');
                    addBtn.textContent = 'Add/Rate Business';
                    addBtn.classList.add('add-address-btn');
                    addBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Call the callback function from main.js
                        if (handleSuggestionSelectionCallback) {
                            handleSuggestionSelectionCallback(suggestion, true);
                        } else {
                            console.warn("handleSuggestionSelectionCallback not provided to autocomplete module.");
                        }
                    });
                    li.appendChild(addBtn);
                }

                li.addEventListener('click', async () => {
                    input.value = fullText;
                    //resultsBox.innerHTML = ''; // Clear results on selection

                    

                    if (!Geocoder) {
                        console.error("Geocoder not initialized.");
                        return;
                    }

                    // Call the callback function from main.js
                    if (handleSuggestionSelectionCallback) {
                        if(!restaurantsSnapshot.empty){handleSuggestionSelectionCallback(suggestion);}
                        else{showRestaurantsInViewCb()}
                        
                    } else {
                        console.warn("handleSuggestionSelectionCallback not provided to autocomplete module.");
                    }

                    Geocoder.geocode({ placeId: placeId })
                        .then(({ results }) => {
                            if (results[0] && currentMapInstance) {
                                const placeLatLon = {
                                    lat: results[0].geometry.location.lat(),
                                    lng: results[0].geometry.location.lng(),
                                };

                                currentMapInstance.setZoom(11); // Adjust zoom as needed
                                currentMapInstance.setView(placeLatLon);
                                // Call the callback function from main.js
                                if (setBottomPanelStateCallback) {
                                    setBottomPanelStateCallback("mid");
                                } else {
                                    console.warn("setBottomPanelStateCallback not provided to autocomplete module.");
                                }
                            }
                        })
                        .catch((e) => console.error("Geocoder failed due to: " + e));
                });

                resultsBox.appendChild(li);
            };

        } catch (e) {
            console.error('Autocomplete error:', e);
            resultsBox.innerHTML = '<li>Error fetching suggestions</li>';
        }
    }, 500));
}