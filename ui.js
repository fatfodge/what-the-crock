import { setBottomPanelState } from "./swipeHandler.js";
import { getFullViewportHeight, closeKeyboard } from "./resizeHandler.js";
import { signUpUser, logoutUser, loginUser } from "./firebaseService.js";
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
        profileOpen = false;

        addressInput.addEventListener('click', () => setBottomPanelState('max'));
        profileBtn.addEventListener('click', () => toggleProfileContainer());
        profileCloseBtn.addEventListener('click', () => toggleProfileContainer());
        loginBtn.addEventListener('click', () => UI_loginUser());
        logoutBtn.addEventListener('click', () => UI_logoutUser());
        signUpBtn.addEventListener('click', () => UI_signUpUser());

    } catch { console.log("init UI failed"); };
}

export function updateProfileTop(){
    let profileWrapper = document.getElementById('profile-wrapper');
    if(profileOpen){
        profileContainer.style.top = `${getFullViewportHeight() - profileWrapper.offsetHeight}px`;
    }
    else{
        profileContainer.style.top = `${getFullViewportHeight()}px`;
    }
}

function toggleProfileContainer() {
    let loginForm = document.getElementById('login-form');
    let activeUserForm = document.getElementById('activeUserFrom');
    let adminPanel = document.getElementById('adminPanelSheet');
    let loggedIn = auth.currentUser;
    if (loggedIn) {
        loginForm.style.display = "none";
        activeUserForm.style.display = "block";
        adminPanel.style.display = "none";
    }
    else {
        loginForm.style.display = "block";
        activeUserForm.style.display = "none";
        adminPanel.style.display = "none";
    }
    if (!profileOpen) {
        profileOpen = true;
        setBottomPanelState('min');
        closeKeyboard();
    } else {
        profileOpen = false;
    }
    updateProfileTop();
}

function updateProfileContainer() {
    profileContainer.style.top = `${getFullViewportHeight() - profileContainer.offsetHeight}px`;
    profileOpen = true;
    setBottomPanelState('min');
    closeKeyboard();
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

