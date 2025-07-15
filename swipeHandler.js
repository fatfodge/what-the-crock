import { closeKeyboard, updateCurrentBottomPanelHt, getFullViewportHeight, getVisualDelta, getBottomPanelContainerMin } from './resizeHandler.js';

let bottomPanelElement;
let bottomPanelWrapper;
let initialPanelHeight;
let initialPanelTop;
let STATE_TRANSFORM_PX = {};
const PAN_THRESHOLD_PERCENT = 0.50;

let panelState = "min";
let prevPanelState;

/**
 * returns current panel state
 * @returns {String}
 */
export function getPanelState() {
    return panelState;
}

export function getPrevPanelState() {
    return prevPanelState
}

export function initSwipeHandling() {
    try {
        initStateTransforms();
        SwipeFunctions();
    }
    catch {
        console.log('swipe handler init failed');
    }
}

/**
 * set bottom panel state
 * @param {String} state 
 */

export function setBottomPanelState(state) {
    if (!(state in STATE_TRANSFORM_PX)) {
        console.log("not in bottom panel state keys");
        return;
    }
    try {
        if (state === 'min') {
            const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            let newPanelTop = VVH - bottomPanelWrapper.offsetHeight;
            bottomPanelElement.style.top = `${newPanelTop}px`;
        }
        else {
            let newPanelTop = STATE_TRANSFORM_PX[state];
            bottomPanelElement.style.top = `${newPanelTop}px`;
            updateCurrentBottomPanelHt();
        }
        if (state != panelState) {
            prevPanelState = panelState;
            panelState = state;
        }
    } catch { console.log('set bottom panel state failed'); }

}

function SwipeFunctions() {
    bottomPanelElement = document.getElementById('bottom-panel-container');
    bottomPanelWrapper = document.getElementById('bottom-panel-wrapper');
    const hammerManager = new Hammer(bottomPanelElement);
    hammerManager.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

    hammerManager.on('panstart', (e) => {
        try {
            bottomPanelElement.style.transition = 'none';
            initialPanelHeight = bottomPanelElement.offsetHeight;
            initialPanelTop = bottomPanelElement.getBoundingClientRect().top;
        } catch { console.log("pan start failed"); }
    });

    hammerManager.on('pan', (e) => {
        try {
            closeKeyboard();
            let newPanelTop = initialPanelTop + e.deltaY;
            bottomPanelElement.style.top = `${newPanelTop}px`;
        } catch { console.log("pan failed"); }
    });

    hammerManager.on('panend', (e) => {
        try {
            const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const topOfBottomPanel = bottomPanelElement.getBoundingClientRect().top;
            bottomPanelElement.style.transition = 'top 0.5s ease-in-out';

            //if part of bottom panel is below the viewable screen
            if (topOfBottomPanel > VVH - bottomPanelWrapper.offsetHeight) {
                setBottomPanelState("min");
                return;
            }

            let newPanelState = "mid";
            const finalVelocityY = e.velocityY;
            const finalDeltaY = e.deltaY;
            let notifyPanelChange = false;
            const swipeThresholdPixels = bottomPanelWrapper.offsetHeight * PAN_THRESHOLD_PERCENT;

            //swipe up
            if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
                //console.log('swipe up');
                if (topOfBottomPanel < STATE_TRANSFORM_PX.mid) {
                    newPanelState = "max";
                }
                notifyPanelChange = true;
            }
            //swipe down
            else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
                //console.log('swipe down');
                if (topOfBottomPanel > STATE_TRANSFORM_PX.mid) {
                    newPanelState = "min";
                }
                notifyPanelChange = true;
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
    //let bottomPanelContainerMin = getBottomPanelContainerMin();

    //STATE_TRANSFORM_PX.min = fullPanelHeight - bottomPanelContainerMin;
    STATE_TRANSFORM_PX.min = fullPanelHeight - getBottomPanelContainerMin();

    STATE_TRANSFORM_PX.mid = fullPanelHeight * 0.4;
    STATE_TRANSFORM_PX.max = fullPanelHeight * 0.1;
}