// ui.js

let bottomPanel;
let profileSheet;
let loginOverlay;
let searchSheet;
let restaurantDetails;
let newRestaurantForm;
let restaurantDisplay; // This div wraps selected-restaurant and restaurants-reviews
let selectedRestaurantDiv; // New: reference to the div for displaying selected restaurant info
let restaurantsReviewsUl; // New: reference to the UL for displaying reviews
let currentPanelState; // Initialize with the default state of your panel
let restaurantsInView;

// Import the shared state percentages from your swipeHandler.js file.
// This ensures consistency in how 'max', 'mid', 'min' states are defined visually.
import { STATE_TRANSFORM_PERCENTAGES } from './swipeHandler.js';

// Store references to the Hammer manager
let hammerManager = null;

/**
 * Initializes references to key UI elements.
 * Call this once when the DOM is ready.
 */
export function initializeUIElements() {
    bottomPanel = document.getElementById('bottom-panel');
    profileSheet = document.getElementById('profile-sheet');
    loginOverlay = document.getElementById('loginOverlay');
    searchSheet = document.getElementById('search-sheet');
    restaurantDetails = document.getElementById('restaurantDetails'); // This ID seems to be an old placeholder,
    // we'll rely on selectedRestaurantDiv now.
    newRestaurantForm = document.getElementById('newRestaurantForm');
    restaurantDisplay = document.getElementById('restaurant-display'); // The main wrapper div
    selectedRestaurantDiv = document.getElementById('selected-restaurant'); // The div for details
    restaurantsReviewsUl = document.getElementById('restaurants-reviews'); // The ul for reviews
    restaurantsInView = document.getElementById('restaurants-in-view'); // The ul for reviews
    console.log("UI Elements initialized.");
}

/**
 * Sets the state of the main bottom panel.
 * @param {"min"|"mid"|"max"|"hidden"} state The desired state for the panel.
 */
export function setBottomPanelState(state) {
    if (!bottomPanel) {
        console.warn("Bottom panel element not found. Call initializeUIElements first.");
        return;
    }
    /*bottomPanel.classList.remove('sheet--min', 'sheet--mid', 'sheet--max');
    if (state === 'hidden') {
        bottomPanel.style.display = 'none';
    } else {
        bottomPanel.style.display = 'block';
        bottomPanel.classList.add(`sheet--${state}`);
    }*/

    currentPanelState = state; // Update the tracking variable
    const transformPercentage = STATE_TRANSFORM_PERCENTAGES[state];
    bottomPanel.style.transform = `translateY(${transformPercentage}%)`;
    bottomPanel.style.transition = 'transform 0.3s ease-out';
}

/**
 * Returns the current state of the bottom panel.
 * This function is exported so other modules (like swipeHandler.js)
 * can query the panel's current state.
 * @returns {string} The current state ('max', 'mid', 'closed', or 'hidden').
 */
export function getCurrentPanelState() {
    return currentPanelState;
}

/**
 * Sets the state of the profile sheet.
 * @param {"min"|"max"|"hidden"} state The desired state for the profile sheet.
 */
export function setProfileSheetState(state) {
    if (!profileSheet || !loginOverlay) {
        console.warn("Profile sheet or login overlay not found. Call initializeUIElements first.");
        return;
    }

    profileSheet.classList.remove('profile-sheet--min', 'profile-sheet--max', 'profile-sheet--hidden');
    profileSheet.classList.add(`profile-sheet--${state}`);
    if (state === "hidden") {
        loginOverlay.classList.remove('show');
        setTimeout(() => {
            loginOverlay.classList.add('hidden');
        }, 300);
    } else {
        loginOverlay.classList.remove('hidden');
        void loginOverlay.offsetWidth; // Force reflow
        loginOverlay.classList.add('show');
    }
}

/**
 * Displays the details of a selected restaurant and its reviews.
 * This will show the `restaurant-display` div.
 * @param {Object} restaurantData The data of the restaurant to display.
 * @param {Array<Object>} reviewsData An array of review objects for the restaurant.
 */
export function displayRestaurantDetails(restaurantData, reviewsData) {
    if (!restaurantDisplay || !selectedRestaurantDiv || !restaurantsReviewsUl || !searchSheet || !newRestaurantForm) {
        console.warn("Required UI elements for displayRestaurantDetails not found.");
        return;
    }

    // Hide other panels and show the main restaurant display wrapper
    searchSheet.style.display = 'none';
    newRestaurantForm.style.display = 'none';
    restaurantDisplay.style.display = 'block'; // Show the parent div
    restaurantsInView.style.display = 'none';

    // Populate selected restaurant details
    selectedRestaurantDiv.innerHTML = `
        <h2>${restaurantData.name}</h2>
        <p>${restaurantData.address}</p>
        <button id="addReviewBtn">Add/Write Review</button>
    `;
    selectedRestaurantDiv.style.display = 'block'; // Show the details div

    // Populate reviews
    restaurantsReviewsUl.innerHTML = ''; // Clear previous reviews
    if (reviewsData && reviewsData.length > 0) {
        reviewsData.forEach(review => {
            const li = document.createElement('li');
            li.innerHTML = `
                <p><strong>Stars:</strong> ${review.stars ?? 'N/A'}</p>
                <p><strong>Notes:</strong> ${review.notes || 'No notes'}</p>
                <p><small>Review by: ${review.userId ? review.userId.substring(0, 6) + '...' : 'Anonymous'}</small></p>
            `;
            restaurantsReviewsUl.appendChild(li);
        });
        restaurantsReviewsUl.style.display = 'block'; // Show the reviews list
    } else {
        restaurantsReviewsUl.innerHTML = '<li>No reviews yet. Be the first to leave one!</li>';
        restaurantsReviewsUl.style.display = 'block';
    }

    // Set bottom panel state to 'mid' or 'max' based on preference
    setBottomPanelState('mid');

    // Attach event listener to the "Add/Write Review" button
    const addReviewBtn = document.getElementById('addReviewBtn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', () => {
            // When this button is clicked, we need to show the new restaurant form
            // but pre-filled with the existing restaurant's details for adding a review.
            // This means we need to pass the restaurant data to the autofill function.
            autofillNewRestaurantForm({
                name: restaurantData.name,
                address: restaurantData.address,
                lat: restaurantData.location.lat,
                lng: restaurantData.location.lng,
                isExisting: true // Flag to indicate it's for an existing restaurant review
            });
        });
    }
}

/**
 * Autofills and shows the new restaurant submission form.
 * @param {Object} data An object containing name, address, lat, lng, and optional isExisting flag.
 */
export function autofillNewRestaurantForm({ name, address, lat, lng, isExisting = false }) {
    console.log("autofillNewRestaurantForm: ", { name, address, lat, lng, isExisting });
    if (!newRestaurantForm || !searchSheet || !restaurantDisplay || !selectedRestaurantDiv || !restaurantsReviewsUl) {
        console.warn("Required UI elements for autofillNewRestaurantForm not found.");
        return;
    }
    const restaurantNameInput = document.getElementById("newName");
    const restaurantAddressInput = document.getElementById("newAddress");
    const restaurantLatInput = document.getElementById("newLat");
    const restaurantLngInput = document.getElementById("newLng");
    const optionalRatingNotesInput = document.getElementById('optionalRatingNotes'); // Get reference to notes
    const ratingValueInput = document.getElementById('ratingValue'); // Get reference to hidden rating input
    const optionalContaner = document.getElementById("optional-container");

    restaurantNameInput.value = name;
    restaurantAddressInput.value = address;
    restaurantLatInput.value = lat;
    restaurantLngInput.value = lng;
    optionalRatingNotesInput.value = ''; // Clear notes on new form
    ratingValueInput.value = "0"; // Reset rating
    document.querySelectorAll('.star-rating .star').forEach(star => star.classList.remove('selected')); // Clear stars

    // Create the optional note element if it doesn't exist
    if (isExisting) {
        optionalContaner.style.display = "none";
    }
    else {
        optionalContaner.style.display = "block";
    }

    // Adjust UI based on whether it's a new submission or adding a review to existing
    const newRestTitle = document.getElementById('newRestaurantTitle'); // Assuming you have a title
    if (newRestTitle) {
        newRestTitle.textContent = isExisting ? `Add Review for ${name}` : 'New Restaurant Submission';
    }

    if (isExisting) {
        restaurantNameInput.readOnly = true;
        restaurantAddressInput.readOnly = true;
        // Optional: Add a class for styling (e.g., to change background color)
        restaurantNameInput.classList.add('locked-field');
        restaurantAddressInput.classList.add('locked-field');
    } else {
        // Ensure they are editable if it's a new submission or previous autofill was for existing
        restaurantNameInput.readOnly = false;
        restaurantAddressInput.readOnly = false;
        restaurantNameInput.classList.remove('locked-field');
        restaurantAddressInput.classList.remove('locked-field');
    }

    if (isExisting) {
        // When adding a review for an EXISTING restaurant, review fields are REQUIRED
        optionalRatingNotesInput.required = true;
        ratingValueInput.required = true; // Make the hidden rating input required

        // Optional: Add visual indicators for required fields (e.g., red asterisk or border)
        optionalRatingNotesInput.classList.add('required-field');
        document.querySelector('.star-rating').classList.add('required-field-indicator'); // Assuming star rating has a container
    } else {
        // When submitting a NEW restaurant, review fields are OPTIONAL
        optionalRatingNotesInput.required = false;
        ratingValueInput.required = false;

        // Remove visual indicators
        optionalRatingNotesInput.classList.remove('required-field');
        document.querySelector('.star-rating').classList.remove('required-field-indicator');
    }

    setBottomPanelState('mid'); // Or 'max' if you want the form to take up more space
    searchSheet.style.display = 'none';
    restaurantDisplay.style.display = 'none'; // Hide the restaurant display when showing the form
    newRestaurantForm.style.display = "block";
    restaurantsInView.style.display = "none";
}


/**
 * Displays the search sheet and controls the state of the bottom panel.
 *
 * @param {"min"|"mid"|"max"} [panelState] - Optional. The desired state for the bottom panel
 * when displaying the search sheet.
 * If not provided, the panel will default to its
 * current state.
 */
export function showSearch(panelState) {
    if (!searchSheet || !restaurantDisplay || !newRestaurantForm) {
        console.warn("Required UI elements for showSearch not found.");
        return;
    }
    const targetPanelState = (panelState && ['min', 'mid', 'max'].includes(panelState))
        ? panelState
        : getCurrentPanelState();
    setBottomPanelState(targetPanelState);
    searchSheet.style.display = 'block';
    restaurantDisplay.style.display = "none"; // Hide this when going back to search
    newRestaurantForm.style.display = "none";
    restaurantsInView.style.display = "none";


    console.log(`Showing search sheet. Bottom panel set to: ${targetPanelState}`);
}

export function showRestaurantsInView() {
    searchSheet.style.display = 'none';
    restaurantDisplay.style.display = "none"; // Hide this when going back to search
    newRestaurantForm.style.display = "none";
    restaurantsInView.style.display = "block";
}

/**
 * Sets up event listeners for the star rating system.
 */
export function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');
    const ratingInput = document.getElementById('ratingValue');

    if (stars.length === 0 || !ratingInput) {
        console.warn("Star rating elements not found.");
        return;
    }

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const selectedRating = parseInt(star.getAttribute('data-value'));
            ratingInput.value = selectedRating;
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                s.classList.toggle('selected', starValue <= selectedRating);
            });
        });
    });
}