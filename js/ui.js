import { setBWHeight, getPrevBWidgetState } from "./swipehandler.js";
import { signUp, logoutUser, loginUser } from "./firebaseService.js";
import { auth } from './firebase.js';

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

    addressInput.addEventListener('input', toggleClearSearchButton);
    addressInput.addEventListener('focus', focusSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    cancelSearchBtn.addEventListener('click', cancelSearch);
    profileBtn.addEventListener('click', () => openProfileForm(auth.currentUser ? activeUserFrom : loginForm));
    createAccountBtn.addEventListener('click', () => openProfileForm(signupForm));
    document.getElementById('signup-form').addEventListener('submit', async (event) => { createNewUser(event); });
    document.getElementById('login-form').addEventListener('submit', async (event) => { loginExistingUser(event); });
    lgoutBtn.addEventListener('click', logoutUser);

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