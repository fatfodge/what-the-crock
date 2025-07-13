let headerContainer;
let footerContainer;
let mapContainer;
let totalViewportHt;
let fullMapHt;
let bottomPanelContainer;
let bodyContainer;

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

function initElements() {
    try {
        headerContainer = document.querySelector('header');
        footerContainer = document.querySelector('footer');
        bodyContainer = document.querySelector('body');
        mapContainer = document.getElementById('map-container');
        bottomPanelContainer = document.getElementById('bottom-panel-container');
        totalViewportHt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        fullMapHt = totalViewportHt - headerContainer.offsetHeight - footerContainer.offsetHeight;
    }
    catch {
        console.log('Elements Initialize Failed');
    }
}

function windowResizeEvent() {
    try {
        const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const visualDelta = VVH - totalViewportHt;
        const newMapHt = fullMapHt + visualDelta;
        const headerHt = headerContainer.offsetHeight;
        const footerHt = footerContainer.offsetHeight;
        const bottomPanelHt = bottomPanelContainer.offsetHeight;

        fullMapHt = totalViewportHt - headerHt - footerHt;
        mapContainer.style.height = `${newMapHt}px`;
        bodyContainer.style.height = `${VVH}px`;

        mapContainer.style.top = `${headerHt}px`;
        footerContainer.style.bottom = `0px`;
        bottomPanelContainer.style.bottom = `0px`;

        window.scrollTo(0,0);
    }
    catch {
        console.log('window resize failed');
    }
}