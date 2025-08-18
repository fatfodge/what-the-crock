import { closeKeyboard } from "./resizehandler.js";

let fvh;
let STATE_OFFSET_PX = {};
const PAN_THRESHOLD_PERCENT = 0.50;

let bWidgetState;
let prevBWidgetState

export function initSwipeHandler() {
    const bWidgetHeader = document.getElementById('b-widget-header');
    const searchbar = document.getElementById('search-container');
    const bottomWidget = document.getElementById('bottom-widget');
    const scrollableContainer = document.getElementById('results-container');

    fvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const minHt = bWidgetHeader.offsetHeight + searchbar.offsetHeight;
    const midHt = fvh * 0.6;
    const maxht = fvh * 0.9

    STATE_OFFSET_PX.min = minHt;
    STATE_OFFSET_PX.mid = midHt;
    STATE_OFFSET_PX.max = maxht;

    bottomWidget.style.transition = 'top 0.5s ease-out';
    setBWHeight("min");

    const hammerManager = new Hammer(bottomWidget);
    hammerManager.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

    let initialPanelTop;
    let initialScrollContainerTop;
    let scrolling;
    let isOverscrolled = false;
    let overscrollStartDeltaY = null;
    let allowPanelMove = false;
    const OVERSCROLL_THRESHOLD = 150;
    let maxScrollContainerTop;


    hammerManager.on('panstart', (e) => {
        if (scrollableContainer.contains(e.srcEvent.target)) {
            initialScrollContainerTop = scrollableContainer.scrollTop;
            maxScrollContainerTop = scrollableContainer.scrollHeight - scrollableContainer.clientHeight
            if (maxScrollContainerTop > 0) {
                scrolling = true;
                scrollableContainer.style.transition = 'none';
            }
        }
        else { scrolling = false; }

        isOverscrolled = false;
        overscrollStartDeltaY = null;
        allowPanelMove = !scrolling;;

        bottomWidget.style.transition = 'none';
        initialPanelTop = bottomWidget.getBoundingClientRect().top;
    });

    scrollableContainer.addEventListener('touchmove', function (e) {
        e.preventDefault(); // stops native scroll, allows Hammer to see all deltaY

    }, { passive: false });

    hammerManager.on('pan', (e) => {
        closeKeyboard();
        if (scrolling) {
            let newScrollContainerTop = initialScrollContainerTop - e.deltaY;
            let panelMoveDelta;
            if (newScrollContainerTop >= 0 && newScrollContainerTop <= maxScrollContainerTop) {
                scrollableContainer.scrollTop = newScrollContainerTop;
            }
            else {
                let overscrollAmount;
                if (newScrollContainerTop < 0) {
                    overscrollAmount = newScrollContainerTop; // Since newScrollContainerTop is negative
                } else if (newScrollContainerTop > maxScrollContainerTop) {
                    // overscrolling at the BOTTOM
                    overscrollAmount = newScrollContainerTop - maxScrollContainerTop;
                } else {
                    scrollableContainer.scrollTop = newScrollContainerTop;
                    return; // In bounds, no overscroll
                }

                if (!allowPanelMove) {
                    const rubberBand = overscrollAmount * 0.6;
                    scrollableContainer.style.transform = `translateY(${-rubberBand}px)`;
                    if (Math.abs(overscrollAmount) > OVERSCROLL_THRESHOLD) {
                        allowPanelMove = true;
                        // Reset scroll container transform
                        scrollableContainer.style.transition = 'transform 0.3s ease';
                        scrollableContainer.style.transform = 'translateY(0px)';
                        setTimeout(() => {
                            scrollableContainer.style.transition = 'none';
                        }, 300);
                    }
                } else {
                    panelMoveDelta = overscrollAmount;
                    panelMoveDelta += overscrollAmount > 0 ? (-OVERSCROLL_THRESHOLD) : OVERSCROLL_THRESHOLD;

                    let newPanelTop = initialPanelTop - panelMoveDelta;
                    bottomWidget.style.top = `${newPanelTop}px`;
                }
            }
        }
        else {
            let newPanelTop = initialPanelTop + e.deltaY;
            bottomWidget.style.top = `${newPanelTop}px`;
        }
    });

    hammerManager.on('panend', (e) => {
        scrollableContainer.style.transition = 'transform 0.3s ease';
        scrollableContainer.style.transform = 'translateY(0px)';
        setTimeout(() => {
            scrollableContainer.style.transition = 'none';
        }, 300);

        e.srcEvent.preventDefault();
        const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const topOfBottomPanel = bottomWidget.getBoundingClientRect().top;
        bottomWidget.style.transition = 'top 0.5s ease-out';

        if (scrolling && !allowPanelMove) {
            return;
        }

        //if part of bottom panel is below the viewable screen
        if (topOfBottomPanel > VVH - STATE_OFFSET_PX.min) {
            setBWHeight("min");
            return;
        }

        let newPanelState = "mid";
        const finalVelocityY = e.velocityY;
        const finalDeltaY = e.deltaY;
        const swipeThresholdPixels = STATE_OFFSET_PX.min * PAN_THRESHOLD_PERCENT;

        //swipe up
        if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
            if (topOfBottomPanel < STATE_OFFSET_PX.mid) {
                newPanelState = "max";
            }
        }
        //swipe down
        else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
            //console.log('swipe down');
            if (topOfBottomPanel > STATE_OFFSET_PX.mid) {
                newPanelState = "min";
            }
        }
        //no significant change
        else {
            if (Math.abs(topOfBottomPanel - STATE_OFFSET_PX.mid) > Math.abs(topOfBottomPanel - STATE_OFFSET_PX.max)) {
                newPanelState = "max";
            } else if (Math.abs(topOfBottomPanel - STATE_OFFSET_PX.mid) > Math.abs(topOfBottomPanel - STATE_OFFSET_PX.min)) {
                newPanelState = "min";
            } else {
                newPanelState = "mid";
            }
        }
        setBWHeight(newPanelState);
    });
}

/**
 * set bottom widget state
 * @param {String} state 
 */
export function setBWHeight(state) {
    if (!(state in STATE_OFFSET_PX)) {
        console.log("not in bottom panel state keys");
        return;
    }

    const bWidget = document.getElementById('bottom-widget');
    bWidget.style.top = `${fvh - STATE_OFFSET_PX[state]}px`;

    if (state != bWidgetState) {
        document.getElementById('cancel-search-btn').classList.add('d-none');
        document.getElementById('profile-btn').classList.remove('d-none');
        prevBWidgetState = bWidgetState;
        bWidgetState = state;
    }
}

export function getBWidgetHt(state) {
    return STATE_OFFSET_PX[state];
}

/**
 * get bottom widget state
 * @returns {String}
 */
export function getBWidgetState() {
    return bWidgetState;
}

/**
 * get previous bottom widget state
 * @returns {String}
 */
export function getPrevBWidgetState() {
    return prevBWidgetState;
}


