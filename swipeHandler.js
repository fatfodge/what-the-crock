import { closeKeyboard, getBottomPanelMinHt, getFullViewportHeight } from './resizeHandler.js';

let STATE_TRANSFORM_PX = {};
const PAN_THRESHOLD_PERCENT = 0.50;

let panelState = "min";
let prevPanelState;
let bottomPanelMinHt;

export function initSwipeHandling() {
    try {
        initStateTransforms();
        initSwipeFunctions();
        setBottomPanelState("min");
    }
    catch {
        console.log('swipe handler init failed');
    }
}

/**
 * returns current panel state
 * @returns {string}
 */
export function getPanelState() {
    return panelState;
}

/**
 * get transform from state
 * @param {string} req_state 
 * @returns {number}
 */
export function getStateTransform(req_state) {
    return STATE_TRANSFORM_PX[req_state];
}

export function getPrevPanelState() {
    return prevPanelState
}

/**
 * 
 * @param {string} state 
 * @param {boolean} updateState 
 * @returns 
 */

export function setBottomPanelState(state, updateState = false) {
    if (!(state in STATE_TRANSFORM_PX)) {
        console.log("not in bottom panel state keys");
        return;
    }
    try {
        let bottomPanelElement = document.getElementById('bottom-panel-container');
        //let bottomPanelWrapper = document.getElementById('bottom-panel-wrapper');
        if (state === 'min') {
            const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            let newPanelTop = VVH - bottomPanelMinHt;
            bottomPanelElement.style.top = `${newPanelTop}px`;
        }
        else {
            let newPanelTop = STATE_TRANSFORM_PX[state];
            bottomPanelElement.style.top = `${newPanelTop}px`;
        }
        if (updateState || state != panelState) {
            prevPanelState = panelState;
            panelState = state;
        }
    } catch { console.log('set bottom panel state failed'); }

}

function initSwipeFunctions() {
    bottomPanelMinHt = getBottomPanelMinHt();
    let scrollableContainer = document.getElementById('scrollable-container');
    let bottomPanelElement = document.getElementById('bottom-panel-container');
    //let bottomPanelWrapper = document.getElementById('bottom-panel-wrapper');
    let initialPanelTop;
    let initialScrollContainerTop;
    let scrolling;
    const hammerManager = new Hammer(bottomPanelElement);
    hammerManager.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

    hammerManager.on('panstart', (e) => {
        try {
            if (scrollableContainer.contains(e.srcEvent.target)) {
                initialScrollContainerTop = scrollableContainer.scrollTop;
                scrolling = true;
            }
            else { scrolling = false; }
            bottomPanelElement.style.transition = 'none';
            initialPanelTop = bottomPanelElement.getBoundingClientRect().top;
        } catch { console.log("pan start failed"); }
    });

    hammerManager.on('pan', (e) => {
        try {
            closeKeyboard();
            if (scrolling) {
                let scrollList = document.getElementById('restaurants-in-view');
                let maxScrollContainerTop = scrollableContainer.scrollHeight - scrollList.clientHeight;
                let newScrollContainerTop = initialScrollContainerTop - e.deltaY;
                if (newScrollContainerTop >= 0 && newScrollContainerTop <= maxScrollContainerTop) {
                    scrollList.scrollTop = newScrollContainerTop;
                    e.srcEvent.preventDefault();
                }
            }
            else {
                let newPanelTop = initialPanelTop + e.deltaY;
                bottomPanelElement.style.top = `${newPanelTop}px`;
            }
        } catch { console.log("pan failed"); }
    });

    hammerManager.on('panend', (e) => {
        try {
            e.srcEvent.preventDefault();
            const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const topOfBottomPanel = bottomPanelElement.getBoundingClientRect().top;
            bottomPanelElement.style.transition = 'top 0.5s ease-out';

            //if part of bottom panel is below the viewable screen
            if (topOfBottomPanel > VVH - bottomPanelMinHt) {
                setBottomPanelState("min");
                return;
            }

            let newPanelState = "mid";
            const finalVelocityY = e.velocityY;
            const finalDeltaY = e.deltaY;
            const swipeThresholdPixels = bottomPanelMinHt * PAN_THRESHOLD_PERCENT;

            //swipe up
            if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
                if (topOfBottomPanel < STATE_TRANSFORM_PX.mid) {
                    newPanelState = "max";
                }
            }
            //swipe down
            else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
                //console.log('swipe down');
                if (topOfBottomPanel > STATE_TRANSFORM_PX.mid) {
                    newPanelState = "min";
                }
            }
            //no significant change
            else {
                if (Math.abs(topOfBottomPanel - STATE_TRANSFORM_PX.mid) > Math.abs(topOfBottomPanel - STATE_TRANSFORM_PX.max)) {
                    newPanelState = "max";
                } else if (Math.abs(topOfBottomPanel - STATE_TRANSFORM_PX.mid) > Math.abs(topOfBottomPanel - STATE_TRANSFORM_PX.min)) {
                    newPanelState = "min";
                } else {
                    newPanelState = "mid";
                }
            }
            setBottomPanelState(newPanelState);
        } catch { console.log("pan end failed"); }
    });
}

function initStateTransforms() {
    let fullPanelHeight = getFullViewportHeight();
    let bottomPanelHeader = document.getElementById('bottom-panel-header');
    let searchContainer = document.getElementById('search-container');
    bottomPanelMinHt = searchContainer.offsetHeight + bottomPanelHeader.offsetHeight;

    //STATE_TRANSFORM_PX.min = fullPanelHeight - bottomPanelContainerMin;
    STATE_TRANSFORM_PX.min = fullPanelHeight - bottomPanelMinHt;

    STATE_TRANSFORM_PX.mid = fullPanelHeight * 0.4;
    STATE_TRANSFORM_PX.max = fullPanelHeight * 0.1;
}