import { setBottomPanelState, getPanelState, getPrevPanelState } from "./swipeHandler.js";
import { getFullViewportHeight, closeKeyboard } from "./resizeHandler.js";
import { passwordReset, signUpUser, logoutUser, loginUser } from "./firebaseService.js";
import { auth } from './firebase.js';

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
                UI_loginUser(emailInput.value,passwordInput.value);
                emailInput.value = "";
                passwordInput.value = "";
                passwordInput.blur();
            }
        });
        passwordReset.addEventListener('click', () => UI_resetPasswored());

    } catch { console.log("init UI failed"); };
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

function updateProfileContainer() {
    profileContainer.style.top = `${getFullViewportHeight() - profileContainer.offsetHeight}px`;
    profileOpen = true;
    setBottomPanelState('min');
    closeKeyboard();
}

function UI_resetPasswored() {
    const emailElement = document.getElementById('emailInput');
    const email = emailElement.value;
    if (!email) {emailElement.focus();}
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

