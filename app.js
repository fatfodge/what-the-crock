let headerContainer;
let footerContainer;
let mapContainer;
let totalViewportHt;
let fullMapHt;
let bottomPanelContainer;
let bodyContainer;

document.addEventListener('DOMContentLoaded', async () => {

    initElements();
    initViewportResizeListener();

    console.log("Main app initialized.");
});

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

function initViewportResizeListener() {
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

        windowResizeEvent();
    }
    catch {
        console.log("window resize listener failed");
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
        footerContainer.style.top = `${VVH - footerHt}px`;
        bottomPanelContainer.style.top = `${VVH - bottomPanelHt}px`;

        //window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    catch {
        console.log('window resize failed');
    }
}