let bottomPanelElement;
let initialPanelHeight;
let initialPanelTop

export const STATE_TRANSFORM_PERCENTAGES = {
    'max': 0,
    'mid': 40,
    'min': 90
};
const PAN_THRESHOLD_PERCENT = 0.15;

export function initSwipeHandling() {
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

    /*hammerManager.on('panend', (e) => {
        const finalVelocityY = e.velocityY;
        const finalDeltaY = e.deltaY;
        const panelHeight = bottomPanelElement.offsetHeight;
        if (panelHeight === 0) {
            setPanelStateCallback(getCurrentPanelStateCallback());
            return;
        }
        bottomPanelElement.style.transition = 'transform 0.3s ease-out';
        const swipeThresholdPixels = panelHeight * PAN_THRESHOLD_PERCENT;
        let newState = getCurrentPanelStateCallback();
        const currentOffsetPercent = parseFloat(bottomPanelElement.style.transform.match(/translateY\(([-]?\d*\.?\d+)\%\)/)?.[1] || STATE_TRANSFORM_PERCENTAGES[newState]);
        const maxToMidBoundary = (STATE_TRANSFORM_PERCENTAGES.max + STATE_TRANSFORM_PERCENTAGES.mid) / 2;
        const midToClosedBoundary = (STATE_TRANSFORM_PERCENTAGES.mid + STATE_TRANSFORM_PERCENTAGES.min) / 2;
        if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
            if (currentOffsetPercent < midToClosedBoundary) {
                 if (currentOffsetPercent < maxToMidBoundary) {
                    newState = 'max';
                 }
            }
        }
        else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
            if (currentOffsetPercent > maxToMidBoundary) {
                if (currentOffsetPercent > midToClosedBoundary) {
                    newState = 'min';
                }
            }
        }
        else {
            if (currentOffsetPercent <= maxToMidBoundary) {
                newState = 'max';
            } else if (currentOffsetPercent <= midToClosedBoundary) {
                newState = 'mid';
            } else {
                newState = 'min';
            }
        }
        setPanelStateCallback(newState);
    });*/
}