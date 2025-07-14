import { setBottomPanelState } from "./swipeHandler.js";

export function initUI() {
    try {
        let addressInput = document.getElementById('address-input');
        let profileBtn = document.getElementById('profile-btn');
        let profileCloseBtn = document.getElementById('close-profile-container');

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

    if (profileContainer.classList.contains('expanded')) {
        profileContainer.classList.remove('expanded');
    } else {
        profileContainer.classList.add('expanded');
        setBottomPanelState('min');
    }
}