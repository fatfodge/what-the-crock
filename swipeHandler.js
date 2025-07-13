import { updateCurrentBottomPanelHt, getFullViewportHeight, getVisualDelta, getBottomPanelContainerMin } from './resizeHandler.js';

let bottomPanelElement;
let initialPanelHeight;
let initialPanelTop;
let STATE_TRANSFORM_PX = {};
const PAN_THRESHOLD_PERCENT = 0.15;

export function initSwipeHandling() {
    initStateTransforms();
    bottomPanelElement = document.getElementById('bottom-panel-container');
    const hammerManager = new Hammer(bottomPanelElement);
    hammerManager.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

    hammerManager.on('panstart', (e) => {
        bottomPanelElement.style.transition = 'none';
        initialPanelHeight = bottomPanelElement.offsetHeight;
        initialPanelTop = bottomPanelElement.getBoundingClientRect().top;
    });

    hammerManager.on('pan', (e) => {
        let newPanelHeight = initialPanelHeight - e.deltaY;
        let newPanelTop = initialPanelTop + e.deltaY;
        bottomPanelElement.style.height = `${newPanelHeight}px`;
        bottomPanelElement.style.top = `${newPanelTop}px`;
    });

    hammerManager.on('panend', (e) => {
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
        console.log('panEndPostitionY',panEndPostitionY);
        console.log('maxToMidBoundary',maxToMidBoundary);
        console.log('midToClosedBoundary',midToClosedBoundary);
        //swipe up
        if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
            console.log('swipe up');
            if (panEndPostitionY < midToClosedBoundary) {
                newPanelTop = STATE_TRANSFORM_PX.max;
            }
            else{
                newPanelTop = STATE_TRANSFORM_PX.mid;
            }
            notifyPanelChange = true;
        }
        //swipe down
        else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
            console.log('swipe down');
            if (panEndPostitionY > midToClosedBoundary) {
                newPanelTop = STATE_TRANSFORM_PX.min;
            }
            else{
                newPanelTop = STATE_TRANSFORM_PX.mid;
            }
            notifyPanelChange = true;
        }
        //no significant change
        else {
            if (panEndPostitionY <= maxToMidBoundary) {
                newPanelTop = STATE_TRANSFORM_PX.max;
            } else if (panEndPostitionY <= midToClosedBoundary) {
                newPanelTop = STATE_TRANSFORM_PX.mid;
            } else {
                newPanelTop = STATE_TRANSFORM_PX.min;
            }
        }
        bottomPanelElement.style.height = `${fullPanelHeight - newPanelTop + visualDelta}px`;
        bottomPanelElement.style.top = `${newPanelTop}px`;


        updateCurrentBottomPanelHt(notifyPanelChange);
    });
}

function initStateTransforms() {
    let fullPanelHeight = getFullViewportHeight();
    let bottomPanelContainerMin = getBottomPanelContainerMin();

    STATE_TRANSFORM_PX.min = fullPanelHeight - bottomPanelContainerMin;
    STATE_TRANSFORM_PX.mid = fullPanelHeight * 0.4;
    STATE_TRANSFORM_PX.max = fullPanelHeight * 0.1;
}