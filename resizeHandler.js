let headerContainer;
let footerContainer;
let mapContainer;
let fullViewportHt;
let fullMapHt;
let bottomPanelContainer;
let bodyContainer;
let currentBottomPanelHt;
let currentFooterHt;
let visualDelta;
let bottomPanelContainerMin;

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

export function updateCurrentBottomPanelHt(panelChange = false){
    currentBottomPanelHt = bottomPanelContainer.offsetHeight;
}

/**
 * Returns the full viewport Ht
 * @returns {number}
 */
export function getFullViewportHeight(){
    return fullViewportHt;
}

/**
 * Returns the visual delta
 * @returns {number}
 */
export function getVisualDelta(){
    return visualDelta;
}

/**
 * Returns the min value for bottom panel container
 * @returns {number}
 */
export function getBottomPanelContainerMin(){
    return bottomPanelContainerMin;
}

function initElements() {
    try {
        headerContainer = document.querySelector('header');
        footerContainer = document.querySelector('footer');
        bodyContainer = document.querySelector('body');
        mapContainer = document.getElementById('map-container');
        bottomPanelContainer = document.getElementById('bottom-panel-container');
        bottomPanelContainerMin = bottomPanelContainer.offsetHeight;
        fullViewportHt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        fullMapHt = fullViewportHt - headerContainer.offsetHeight - footerContainer.offsetHeight;
        updateCurrentBottomPanelHt();

        currentFooterHt = footerContainer.offsetHeight;
    }
    catch {
        console.log('Elements Initialize Failed');
    }
}

function windowResizeEvent() {
    try {
        const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        visualDelta = VVH - fullViewportHt;
        const newMapHt = fullMapHt + visualDelta;
        const headerHt = headerContainer.offsetHeight;


        fullMapHt = fullViewportHt - headerHt - currentFooterHt;
        mapContainer.style.height = `${newMapHt}px`;
        bodyContainer.style.height = `${VVH}px`;

        mapContainer.style.top = `${headerHt}px`;
        footerContainer.style.top = `${VVH - currentFooterHt}px`;
        //bottomPanelContainer.style.top = `${VVH - currentBottomPanelHt}px`;

        let newBottomConatinerHt = fullViewportHt + visualDelta - bottomPanelContainer.getBoundingClientRect().top;

        if(newBottomConatinerHt < bottomPanelContainerMin || bottomPanelContainer.offsetHeight === bottomPanelContainerMin){
            bottomPanelContainer.style.height = `${bottomPanelContainerMin}px`;
            bottomPanelContainer.style.top = `${VVH - bottomPanelContainerMin}px`;
        }
        else{
            bottomPanelContainer.style.height = `${currentBottomPanelHt + visualDelta}px`;
            currentBottomPanelHt = newBottomConatinerHt;
        }

        updateCurrentBottomPanelHt();

        window.scrollTo(0,0);
    }
    catch {
        console.log('window resize failed');
    }
}