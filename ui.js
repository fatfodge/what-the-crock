import { setBottomPanelState } from "./swipeHandler.js";
import {getFullViewportHeight, closeKeyboard} from "./resizeHandler.js";

export let profileInFrame;

export function initUI() {
    try {
        let addressInput = document.getElementById('address-input');
        let profileBtn = document.getElementById('profile-btn');
        let profileCloseBtn = document.getElementById('close-profile-container');
        profileInFrame = false;

        addressInput.addEventListener('click', () => setBottomPanelState('max'));
        profileBtn.addEventListener('click', () => toggleProfileContainer());
        profileCloseBtn.addEventListener('click', () => toggleProfileContainer());
    } catch { console.log("init UI failed"); };
}

function toggleProfileContainer() {
    let profileContainer = document.getElementById('profile-container');
    let loginForm = document.getElementById('login-form');
    let activeUserForm = document.getElementById('activeUserFrom');
    let adminPanel = document.getElementById('adminPanelSheet');
    if(!profileInFrame){
        profileContainer.style.top = `${getFullViewportHeight() - profileContainer.offsetHeight}px`;
        profileInFrame = true;
        setBottomPanelState('min');
        closeKeyboard();
    } else {
        profileContainer.style.top = `${getFullViewportHeight()}px`;
        profileInFrame = false;
    }
    
}