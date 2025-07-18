import { profileOpen } from './ui.js';
import { getPanelState, getStateTransform } from './swipeHandler.js';

let fullViewportHt;
let bottomPanelMinHt;

export function initViewportResizeListener(window) {
    try {
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', windowResizeEvent);
            // On some platforms, scrolling the page can also cause the visual viewport to change slightly,
            // so listening to 'scroll' on visualViewport can also be useful for related adjustments.
            window.visualViewport.addEventListener('scroll', windowResizeEvent);
        } else {
            // Fallback for less precise detection (will also fire on orientation changes, etc.)
            window.addEventListener('resize', windowResizeEvent);
        }
        initElements();
        windowResizeEvent();
    }
    catch {
        console.log("window resize listener failed");
    }
}

/**
 * return min ht for bottom panel
 * @returns {number}
 */
export function getBottomPanelMinHt() {
    return bottomPanelMinHt;
}

/**
 * closes keyboard
 * @returns {boolean}
 */
export function closeKeyboard() {
    const activeElement = document.activeElement;
    const isInputLike = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable') && activeElement.isContentEditable
    );
    if (isInputLike) {
        activeElement.blur();
    }
    return isInputLike;
}

/**
 * Returns the full viewport Ht
 * @returns {number}
 */
export function getFullViewportHeight() {
    return fullViewportHt;
}

function initElements() {
    try {
        fullViewportHt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        //let bottomPanelWrapperOffset = document.getElementById('bottom-panel-wrapper').offsetHeight;


        let bottomPanelHeaderOffsetHt = document.getElementById('bottom-panel-header').offsetHeight;
        let searchContainerOffsetHt = document.getElementById('search-container').offsetHeight;
        bottomPanelMinHt = bottomPanelHeaderOffsetHt + searchContainerOffsetHt;

        let bottomPanelTop = fullViewportHt - bottomPanelMinHt;
        document.getElementById('bottom-panel-container').style.top = `${bottomPanelTop}px`;

    }
    catch {
        console.log('Elements Initialize Failed');
    }
}

function windowResizeEvent() {
    try {
        let bottomPanelContainer = document.getElementById('bottom-panel-container');
        let profileContainer = document.getElementById('profile-container');
        //let bottomPanelWrapper = document.getElementById('bottom-panel-wrapper');
        let mapContainer = document.getElementById('map-container');



        const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const topOfBottomPanel = bottomPanelContainer.getBoundingClientRect().top;

        if (profileOpen) { profileContainer.style.top = `${VVH - profileWrapper.offsetHeight}px`; }
        else {
            profileContainer.style.transition = 'none';
            profileContainer.style.top = `${VVH}px`;
        }


        mapContainer.style.top = `${document.querySelector('header').offsetHeight}px`;
        mapContainer.style.bottom = `${document.querySelector('footer').offsetHeight}px`;

        const panelTopOffset = VVH - bottomPanelMinHt;
        const stateTransform = getStateTransform(getPanelState())
        if (getPanelState() != 'min' && stateTransform < panelTopOffset) {
            bottomPanelContainer.style.top = `${stateTransform}px`;
        } else if (getPanelState() === "min" || stateTransform > panelTopOffset || topOfBottomPanel > panelTopOffset) {
            bottomPanelContainer.style.top = `${panelTopOffset}px`;
        }

        window.scrollTo(0, 0);
    }
    catch {
        console.log('window resize failed');
    }
}