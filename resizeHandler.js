import { profileOpen } from './ui.js';
import { getPanelState, getStateTransform } from './swipeHandler.js';

let headerContainer;
let footerContainer;
let mapContainer;
let fullViewportHt;
let fullMapHt;
let bottomPanelContainer;
let bottomPanelWrapper;
let bodyContainer;
let currentBottomPanelHt;
let currentFooterHt;
let visualDelta;
let bottomPanelContainerMin;
let profileContainer;
let profileWrapper;

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


export function updateCurrentBottomPanelHt() {
    currentBottomPanelHt = bottomPanelContainer.offsetHeight;
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

/**
 * Returns the visual delta
 * @returns {number}
 */
export function getVisualDelta() {
    return visualDelta;
}

/**
 * Returns the min value for bottom panel container
 * @returns {number}
 */
export function getBottomPanelContainerMin() {
    return bottomPanelContainerMin;
}

function initElements() {
    try {
        profileContainer = document.getElementById('profile-container');
        profileWrapper = document.getElementById('profile-wrapper');
        headerContainer = document.querySelector('header');
        footerContainer = document.querySelector('footer');
        bodyContainer = document.querySelector('body');
        mapContainer = document.getElementById('map-container');
        bottomPanelContainer = document.getElementById('bottom-panel-container');
        bottomPanelWrapper = document.getElementById('bottom-panel-wrapper');
        bottomPanelContainerMin = bottomPanelWrapper.offsetHeight;
        fullViewportHt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        fullMapHt = fullViewportHt - headerContainer.offsetHeight - footerContainer.offsetHeight;
        updateCurrentBottomPanelHt();

        currentFooterHt = footerContainer.offsetHeight;

        bottomPanelContainer.style.top = `${fullViewportHt - bottomPanelWrapper.offsetHeight}px`;

    }
    catch {
        console.log('Elements Initialize Failed');
    }
}

function windowResizeEvent() {
    try {
        const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const topOfBottomPanel = bottomPanelContainer.getBoundingClientRect().top;
        visualDelta = VVH - fullViewportHt;

        if (profileOpen) { profileContainer.style.top = `${VVH - profileWrapper.offsetHeight}px`; }
        else {
            profileContainer.style.transition = 'none';
            profileContainer.style.top = `${VVH}px`;
        }


        mapContainer.style.top = `${headerContainer.offsetHeight}px`;
        mapContainer.style.bottom = `${footerContainer.offsetHeight}px`;

        const panelTopOffset = VVH - bottomPanelWrapper.offsetHeight;
        const stateTransform = getStateTransform(getPanelState())
        if (stateTransform < panelTopOffset){
            bottomPanelContainer.style.top = `${stateTransform}px`;
        } else if (getPanelState() === 'min' || stateTransform > panelTopOffset || topOfBottomPanel > panelTopOffset) {   
            bottomPanelContainer.style.top = `${panelTopOffset}px`;
        }
        updateCurrentBottomPanelHt();

        window.scrollTo(0, 0);
    }
    catch {
        console.log('window resize failed');
    }
}