import { setBottomPanelState, getPanelState, getPrevPanelState } from "./swipeHandler.js";
import { getVisualDelta, getFullViewportHeight, closeKeyboard } from "./resizeHandler.js";
import { passwordReset, signUpUser, logoutUser, loginUser } from "./firebaseService.js";
import { auth } from './firebase.js';

export let profileOpen;

let profileContainer;

export function initUI() {
    try {
        profileContainer = document.getElementById('profile-container');
        let loginBtn = document.getElementById('loginBtn');
        let logoutBtn = document.getElementById('lgoutBtn');
        let signUpBtn = document.getElementById('signupBtn');
        let addressInput = document.getElementById('address-input');
        let profileBtn = document.getElementById('profile-btn');
        let profileCloseBtn = document.getElementById('close-profile-container');
        let emailInput = document.getElementById('emailInput');
        let passwordInput = document.getElementById('passwordInput')
        let passwordReset = document.getElementById('forgotPasswordBtn');
        profileOpen = false;

        addressInput.addEventListener('click', () => setBottomPanelState('max'));
        profileBtn.addEventListener('click', () => toggleProfileContainer());
        profileCloseBtn.addEventListener('click', () => toggleProfileContainer());
        loginBtn.addEventListener('click', () => UI_loginUser());
        logoutBtn.addEventListener('click', () => UI_logoutUser());
        signUpBtn.addEventListener('click', () => UI_signUpUser());
        emailInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                passwordInput.focus();
            }
        });
        passwordInput.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {
                UI_loginUser()
                document.getElementById('login-form').requestFullscreen();
                passwordInput.blur();
            }
        });
        passwordReset.addEventListener('click', () => UI_resetPasswored());

    } catch { console.log("init UI failed"); };
}

export function updateProfileContainerTop() {
    let profileWrapper = document.getElementById('profile-wrapper');
    if (profileOpen) {
        profileContainer.style.top = `${getFullViewportHeight() + getVisualDelta() - profileWrapper.offsetHeight}px`;
    }
    else {
        profileContainer.style.top = `${getFullViewportHeight() + getVisualDelta()}px`;
    }
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
    updateProfileContainerTop();
}

function updateProfileContainer() {
    profileContainer.style.top = `${getFullViewportHeight() - profileContainer.offsetHeight}px`;
    profileOpen = true;
    setBottomPanelState('min');
    closeKeyboard();
}

function UI_resetPasswored(){
    const email = document.getElementById('emailInput').value;
    if (!email){
        alert('Please enter your email address.', 'error');
        email.focus();
    }
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

