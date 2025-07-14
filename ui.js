import { setBottomPanelState } from "./swipeHandler.js";

export function initUI() {
    try {
        let addressInput = document.getElementById('address-input');
        addressInput.addEventListener('click', () => setBottomPanelState('max'))
    } catch { console.log("init UI failed"); }
}