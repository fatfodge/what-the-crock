let fvh;
let STATE_OFFSET_PX = {};

export function initSwipeHandler() {
    const bWidgetHader = document.getElementById('b-widget-header');
    const searchbar = document.getElementById('search-container');

    fvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const minHt = bWidgetHader.offsetHeight + searchbar.offsetHeight;
    const midHt = fvh * 0.4;
    const maxht = fvh * 0.9

    STATE_OFFSET_PX.min = minHt;
    STATE_OFFSET_PX.mid = midHt;
    STATE_OFFSET_PX.max = maxht;

    setBWHeight("min");
}

export function setBWHeight(state) {
    if (!(state in STATE_OFFSET_PX)) {
        console.log("not in bottom panel state keys");
        return;
    }
    const bWidget = document.getElementById('bottom-widget');
    bWidget.style.top = `${fvh - STATE_OFFSET_PX[state]}px`;
}

