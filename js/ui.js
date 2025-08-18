import { setBWHeight, getPrevBWidgetState } from "./swipehandler.js";
import { signUp, logoutUser, loginUser, getRestuarantReviews } from "./firebaseService.js";
import { auth } from './firebase.js';
import { focusOnUser } from "./map.js";

export function initUI() {
    const fvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const addressInput = document.getElementById('address-input')
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const cancelSearchBtn = document.getElementById('cancel-search-btn');
    const profileBtn = document.getElementById('profile-btn');
    const createAccountBtn = document.getElementById('create-account-btn');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const activeUserFrom = document.getElementById('activeUserFrom');
    const profileForms = [signupForm, loginForm, activeUserFrom];
    const lgoutBtn = document.getElementById('lgoutBtn');
    const focusOnuserBtn = document.getElementById('user-focus');

    addressInput.addEventListener('input', toggleClearSearchButton);
    addressInput.addEventListener('focus', focusSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    cancelSearchBtn.addEventListener('click', cancelSearch);
    profileBtn.addEventListener('click', () => openProfileForm(auth.currentUser ? activeUserFrom : loginForm));
    createAccountBtn.addEventListener('click', () => openProfileForm(signupForm));
    document.getElementById('signup-form').addEventListener('submit', async (event) => { createNewUser(event); });
    document.getElementById('login-form').addEventListener('submit', async (event) => { loginExistingUser(event); });
    lgoutBtn.addEventListener('click', logoutUser);
    focusOnuserBtn.addEventListener('click', focusOnUser);

    document.querySelectorAll('.close-profile-btn').forEach(btn => { btn.addEventListener('click', closeProfile); });


    function toggleClearSearchButton() {
        if (addressInput.value.length > 0) {
            clearSearchBtn.classList.remove('d-none');
        }
        else {
            clearSearchBtn.classList.add('d-none')
        }
    }

    function clearSearch(keepFocus = true) {
        addressInput.value = "";
        toggleClearSearchButton();
        if (keepFocus) {
            addressInput.focus();
        }
    }

    function focusSearch() {
        setBWHeight('max');
        cancelSearchBtn.classList.remove('d-none');
        profileBtn.classList.add('d-none');
    }

    function cancelSearch() {
        setBWHeight('mid');
        clearSearch(false);
        cancelSearchBtn.classList.add('d-none');
        profileBtn.classList.remove('d-none');
    }

    function openProfileForm(openForm) {
        setBWHeight('min');
        profileForms.forEach(form => {
            form.style.transition = 'top 0.3s ease-out';
            form.style.zIndex = form != openForm ? '50' : '51';
        });
        openForm.style.top = `${fvh * 0.2}px`;
        setTimeout(() => {
            profileForms.forEach(form => {
                form.style.transition = '';
                if (form != openForm) {
                    form.style.transition = '';
                    form.style.top = `${fvh}px`;
                }
            });
        }, 300);
    }

    function closeProfile() {
        setBWHeight(getPrevBWidgetState());
        profileForms.forEach(form => {
            form.style.transition = 'top 0.3s ease-out';
            form.style.top = `${fvh}px`;
        });
        setTimeout(() => {
            profileForms.forEach(form => {
                form.reset();
                form.style.transition = ''
            });
        }, 300);
    }

    async function loginExistingUser(event) {
        event.preventDefault();

        const identifier = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const error = await loginUser(identifier, password);

        if (!error) { event.target.reset(); }
        else {
            const signupError = document.getElementById('signin-error');
            signupError.style.transition = '';
            signupError.style.opacity = 1;
            signupError.textContent = error;
            signupError.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                signupError.style.opacity = 0;
            }, 3000);
        }

    }

    async function createNewUser(event) {
        event.preventDefault(); // Stop page reload

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value;

        const error = await signUp(username, email, password);

        if (!error) { event.target.reset(); }
        else {
            const signupError = document.getElementById('signup-error');
            signupError.style.transition = '';
            signupError.style.opacity = 1;
            signupError.textContent = error;
            signupError.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                signupError.style.opacity = 0;
            }, 3000);
        }
    }
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

    transitionBWidget("reviews");
}

function transitionBWidget(display) {
    const fvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const bWidget = document.getElementById('bottom-widget');

    bWidget.style.transition = '';

    const clone = bWidget.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(el => {
        el.id = el.id + '-clone';
    });
    if (clone.id) {
        clone.id = clone.id + '-clone';
    }
    document.body.appendChild(clone);

    bWidget.style.top = `${fvh}px`;

    setTimeout(() => {
        bWidget.classList.remove("z-40");
        bWidget.classList.add("z-50")

        document.getElementById('restaurant-data').classList.remove('d-none');
        document.getElementById('restaurants-in-view').classList.add('d-none');
        document.getElementById('restaurant-reviews').classList.remove('d-none');

        bWidget.style.transition = 'top 0.5s ease-out';
        bWidget.style.top = clone.style.top;
        setTimeout(() => {
            clone.remove();
            bWidget.classList.add("z-40");
            bWidget.classList.remove("z-50");
        }, 500);
    }, 25);
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