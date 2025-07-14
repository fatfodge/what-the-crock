import { closeKeyboard, updateCurrentBottomPanelHt, getFullViewportHeight, getVisualDelta, getBottomPanelContainerMin } from './resizeHandler.js';

let bottomPanelElement;
let initialPanelHeight;
let initialPanelTop;
let STATE_TRANSFORM_PX = {};
const PAN_THRESHOLD_PERCENT = 0.15;

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
        let fullPanelHeight = getFullViewportHeight();
        let visualDelta = getVisualDelta(); // will be <= 0 
        let newPanelTop = STATE_TRANSFORM_PX[state];
        bottomPanelElement.style.height = `${fullPanelHeight - newPanelTop + visualDelta}px`;
        bottomPanelElement.style.top = `${newPanelTop}px`;
        updateCurrentBottomPanelHt();

    } catch { console.log('set bottom panel state failed'); }

}

function SwipeFunctions() {
    bottomPanelElement = document.getElementById('bottom-panel-container');
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
            let newPanelHeight = initialPanelHeight - e.deltaY;
            let newPanelTop = initialPanelTop + e.deltaY;
            bottomPanelElement.style.height = `${newPanelHeight}px`;
            bottomPanelElement.style.top = `${newPanelTop}px`;
        } catch { console.log("pan failed"); }
    });

    hammerManager.on('panend', (e) => {
        try {
            bottomPanelElement.style.transition = 'height 2s ease-out, top 2s ease out';
            let fullPanelHeight = getFullViewportHeight();
            let panEndPostitionY = bottomPanelElement.getBoundingClientRect().top;
            let visualDelta = getVisualDelta(); // will be <= 0 
            const finalVelocityY = e.velocityY;
            const finalDeltaY = e.deltaY;
            const panelHeight = bottomPanelElement.offsetHeight;
            const swipeThresholdPixels = panelHeight * PAN_THRESHOLD_PERCENT;
            if (panelHeight < getBottomPanelContainerMin() && visualDelta === 0) {
                let newPanelTop = fullPanelHeight - getBottomPanelContainerMin();
                bottomPanelElement.style.height = `${STATE_TRANSFORM_PX.min}px`;
                bottomPanelElement.style.top = `${newPanelTop}px`;
                return;
            }
            let notifyPanelChange = false;
            let newPanelTop;
            const maxToMidBoundary = (STATE_TRANSFORM_PX.max + STATE_TRANSFORM_PX.mid) / 2;
            const midToClosedBoundary = (STATE_TRANSFORM_PX.mid + STATE_TRANSFORM_PX.min) / 2;
            //swipe up
            if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
                //console.log('swipe up');
                if (panEndPostitionY < midToClosedBoundary) {
                    newPanelTop = "max";
                }
                else {
                    newPanelTop = "mid";
                }
                notifyPanelChange = true;
            }
            //swipe down
            else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
                //console.log('swipe down');
                if (panEndPostitionY > midToClosedBoundary) {
                    newPanelTop = "min";
                }
                else {
                    newPanelTop = "mid";
                }
                notifyPanelChange = true;
            }
            //no significant change
            else {
                if (panEndPostitionY <= maxToMidBoundary) {
                    newPanelTop = "max";
                } else if (panEndPostitionY <= midToClosedBoundary) {
                    newPanelTop = "mid";
                } else {
                    newPanelTop = "min";
                }
            }
            setBottomPanelState(newPanelTop);
        } catch { console.log("pan end failed"); }
    });
}

function initStateTransforms() {
    let fullPanelHeight = getFullViewportHeight();
    let bottomPanelContainerMin = getBottomPanelContainerMin();

    STATE_TRANSFORM_PX.min = fullPanelHeight - bottomPanelContainerMin;
    STATE_TRANSFORM_PX.mid = fullPanelHeight * 0.4;
    STATE_TRANSFORM_PX.max = fullPanelHeight * 0.1;
}