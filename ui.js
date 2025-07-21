import { setBottomPanelState, getPanelState, getPrevPanelState } from "./swipeHandler.js";
import { getFullViewportHeight, closeKeyboard } from "./resizeHandler.js";
import { passwordReset, signUpUser, logoutUser, loginUser, getRestuarantReviews } from "./firebaseService.js";
import { auth } from './firebase.js';
import { focusOnUser } from './map.js';

export let profileOpen;

let profileContainer;

export function initUI() {
    try {
        profileContainer = document.getElementById('profile-container');
        let addressInput = document.getElementById('address-input');
        let emailInput = document.getElementById('emailInput');
        let passwordInput = document.getElementById('passwordInput')
        let passwordReset = document.getElementById('forgotPasswordBtn');
        profileOpen = false;

        document.getElementById('locate-btn').addEventListener('click', () => focusOnUser());
        document.getElementById('show-search-btn').addEventListener('click', () => toggleBPSections("search"));
        addressInput.addEventListener('click', () => setBottomPanelState('max'));
        addressInput.addEventListener('focus', () => addressInput.select());
        document.getElementById('profile-btn').addEventListener('click', () => toggleProfileContainer());
        document.getElementById('close-profile-container').addEventListener('click', () => toggleProfileContainer());
        document.getElementById('loginBtn').addEventListener('click', () => UI_loginUser());
        document.getElementById('lgoutBtn').addEventListener('click', () => UI_logoutUser());
        document.getElementById('signupBtn').addEventListener('click', () => UI_signUpUser());
        emailInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                passwordInput.focus();
            }
        });
        passwordInput.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {
                UI_loginUser(emailInput.value, passwordInput.value);
                emailInput.value = "";
                passwordInput.value = "";
                passwordInput.blur();
            }
        });
        passwordReset.addEventListener('click', () => UI_resetPasswored());

        toggleBPSections("search");

    } catch { console.log("init UI failed"); };
}


/**
 * toggle bottom panel sections
 * @param {string} section 
 */
export function toggleBPSections(section) {
    const allSectionElements = document.querySelectorAll('[data-bp-sections]');
    allSectionElements.forEach(el => {
        const sections = el.dataset.bpSections.split(',').map(s => s.trim());
        el.style.display = sections.includes(section) ? 'block' : 'none';
    });
}

/**
 * display existing restaurant data and reviews
 * @param {Array} restaurant 
 */
export async function displayRestaurantDetails(restaurant) {
    document.getElementById("restName").textContent = restaurant.name;
    document.getElementById("restAddress").textContent = restaurant.address;
    const reviewsList = document.getElementById("restaurant-reviews");

    reviewsList.innerHTML = '';

    let numberRatings = 0;
    let totalRating = 0;

    let reviewsData = await getRestuarantReviews(restaurant.id);
    if (reviewsData && reviewsData.length > 0) {
        reviewsData.forEach(review => {
            reviewsList.appendChild(createReviewLI(review));
            numberRatings += 1;
            totalRating += parseInt(review.stars);

        });
    }
    const starRatingContainer = document.querySelector('#restaurant-data #star-rating');
    let rating = totalRating / numberRatings;
    applyRating(rating, starRatingContainer)

    toggleBPSections("restaurant_detail");
}

export function updateProfileDisplay() {
    let activeUserForm = document.getElementById('activeUserFrom');
    let adminPanel = document.getElementById('adminPanelSheet');
    let loggedIn = auth.currentUser;
    let loginForm = document.getElementById('login-form');
    if (loggedIn) {
        loginForm.style.display = "none";
        activeUserForm.style.display = "block";
        adminPanel.style.display = "none";
        closeKeyboard();
    }
    else {
        loginForm.style.display = "block";
        activeUserForm.style.display = "none";
        adminPanel.style.display = "none";
        document.getElementById('emailInput').focus();
    }
    const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let profileWrapper = document.getElementById('profile-wrapper');
    if (profileOpen) {
        profileContainer.style.top = `${VVH - profileWrapper.offsetHeight}px`;
    }
    else {
        profileContainer.style.top = `${VVH}px`;
    }
}

function createReviewLI(review) {
    const li = document.createElement('li');
    li.classList.add('restaurant-review');

    const contentDiv = document.createElement('div');

    const rating = review.stars;
    const ratingDiv = document.createElement('div');
    ratingDiv.classList.add("star-rating");
    ratingDiv.innerHTML = `
                    <span data-value="1" class="star">&#9733;</span>
                    <span data-value="2" class="star">&#9733;</span>
                    <span data-value="3" class="star">&#9733;</span>
                    <span data-value="4" class="star">&#9733;</span>
                    <span data-value="5" class="star">&#9733;</span>`
    applyRating(rating, ratingDiv);
    contentDiv.appendChild(ratingDiv);

    const notesDiv = document.createElement('div');
    notesDiv.classList.add('main-text');
    notesDiv.textContent = review.notes;
    contentDiv.appendChild(notesDiv);

    const userDiv = document.createElement('div');
    userDiv.classList.add('secondary-text');
    userDiv.textContent = review.userId;
    contentDiv.appendChild(userDiv);

    li.appendChild(contentDiv);
    return li;
}

function applyRating(rating, container) {
    const stars = container.querySelectorAll('.star');

    stars.forEach((star, i) => {
        star.classList.remove('full', 'half');

        const starValue = i + 1;
        if (rating >= starValue) {
            star.classList.add('full');
        } else if (rating >= starValue - 0.5) {
            star.classList.add('half');
        }
    });
}

function toggleProfileContainer() {
    updateProfileDisplay();
    if (!profileOpen) {
        //closeKeyboard();
        profileOpen = true;
        profileContainer.style.transition = 'top 0.5s ease-in-out';
        setBottomPanelState('min', true);
    } else {
        closeKeyboard();
        profileOpen = false;
        setBottomPanelState(getPrevPanelState() ? getPrevPanelState() : getPanelState());
    }
    updateProfileDisplay();
}


function UI_resetPasswored() {
    const emailElement = document.getElementById('emailInput');
    const email = emailElement.value;
    if (!email) { emailElement.focus(); }
    passwordReset(email);
}

function UI_loginUser() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    loginUser(email, password);
}

function UI_logoutUser() {
    logoutUser();
}

function UI_signUpUser() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    signUpUser(email, password);
}

