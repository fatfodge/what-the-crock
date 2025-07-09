// swipeHandler.js

// Import Hammer.js
// If you installed it via npm:
//import Hammer from 'hammerjs';
// If you are using a CDN script tag, you don't need this import
// as Hammer will be available globally (window.Hammer).

// Define the percentages for each panel state.
// These percentages dictate the translateY(X%) CSS value for each state.
// 'max': 0% means the panel is fully visible (its natural position).
// 'mid': 50% means the panel is translated down by 50% of its own height.
// 'closed': 100% means the panel is translated down by 100% of its own height (fully off-screen).
export const STATE_TRANSFORM_PERCENTAGES = {
    'max': 0,
    'mid': 40,
    'min': 90
};

// Define the percentage of the panel's height a user needs to swipe
// to trigger a state change (e.g., 0.15 for 15%).
const PAN_THRESHOLD_PERCENT = 0.15;

/**
 * Initializes swipe (pan) handling for the bottom panel using Hammer.js.
 * This function sets up event listeners for touch/mouse gestures
 * to control the panel's state.
 *
 * @param {HTMLElement} bottomPanelElement The DOM element that represents the bottom panel.
 * @param {Function} setPanelStateCallback A callback function (from ui.js)
 * to programmatically set the panel's state ('max', 'mid', 'closed').
 * @param {Function} getCurrentPanelStateCallback A callback function (from ui.js)
 * to get the panel's current state string.
 */
export function initSwipeHandling(bottomPanelElement, setPanelStateCallback, getCurrentPanelStateCallback) {
    // Basic validation to ensure all required elements and functions are provided.
    if (!bottomPanelElement || !setPanelStateCallback || !getCurrentPanelStateCallback) {
        console.warn("Missing required parameters for initSwipeHandling. Swipe gestures will not be initialized.");
        return;
    }

    // Create a new Hammer.js manager instance for the bottomPanelElement.
    // This attaches Hammer's event listeners to the element.
    const hammerManager = new Hammer(bottomPanelElement);
    console.log("Hammer manager created for:", bottomPanelElement); // <-- ADD THIS

    // Configure the pan recognizer to only detect vertical (up/down) movements.
    hammerManager.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

    // Variable to store the panel's translateY percentage when a pan gesture starts.
    // This allows us to calculate the current position relative to the starting point.
    let initialPanTransformY = 0;

    // --- Event Listener: panstart ---
    // Fired when a pan gesture begins (finger touches and starts moving).
    hammerManager.on('panstart', (e) => {
        //console.log('Hammer Pan Start!', e.type, 'Target:', e.target); // <-- ADD THIS
        // Disable CSS transitions during the pan. This allows for direct,
        // immediate visual feedback as the user drags the panel, making it feel smoother.
        bottomPanelElement.style.transition = 'none';

        // Get the current translateY percentage from the panel's inline style.
        // This is crucial for seamless dragging from the current position.
        const currentTransform = bottomPanelElement.style.transform;
        const match = currentTransform.match(/translateY\(([-]?\d*\.?\d+)\%\)/);

        // If a translateY percentage is found, use it. Otherwise,
        // fall back to the percentage corresponding to the panel's current known state.
        initialPanTransformY = match ? parseFloat(match[1]) : STATE_TRANSFORM_PERCENTAGES[getCurrentPanelStateCallback()];
    });

    // --- Event Listener: pan ---
    // Fired continuously as the user drags their finger (or mouse).
    hammerManager.on('pan', (e) => {
        // console.log('Hammer Pan!', e.deltaY); // <-- ADD THIS (can be chatty, uncomment for specific tests)
        // Get the current height of the panel. This is used to convert
        // the pixel delta (e.deltaY) into a percentage of the panel's height.
        const panelHeight = bottomPanelElement.offsetHeight;
        if (panelHeight === 0) return; // Prevent division by zero if element has no height.

        // Calculate the change in Y position as a percentage of the panel's height.
        // e.deltaY is the total vertical distance panned since 'panstart'.
        const deltaYPercentage = (e.deltaY / panelHeight) * 100;

        // Calculate the new target translateY percentage.
        // This moves the panel directly with the user's finger.
        let newTransformPercentage = initialPanTransformY + deltaYPercentage;

        // Clamp the transformation percentage:
        // - It should not go below 0% (fully open/max state).
        // - It should not go above 100% (fully closed state).
        newTransformPercentage = Math.max(0, Math.min(100, newTransformPercentage));

        // Apply the calculated transform directly to the panel's style.
        bottomPanelElement.style.transform = `translateY(${newTransformPercentage}%)`;
    });

    // --- Event Listener: panend ---
    // Fired when the pan gesture ends (finger is lifted).
    hammerManager.on('panend', (e) => {
        //console.log('Hammer Pan End!', e.type, 'Velocity:', e.velocityY, 'Delta:', e.deltaY); // <-- ADD THIS
        // Get the final velocity and total distance of the pan.
        const finalVelocityY = e.velocityY; // Velocity in pixels/millisecond.
        const finalDeltaY = e.deltaY;       // Total distance panned in pixels.

        const panelHeight = bottomPanelElement.offsetHeight;
        if (panelHeight === 0) {
            // If panel height is zero, snap back to its previous state and exit.
            setPanelStateCallback(getCurrentPanelStateCallback());
            return;
        }

        // Re-enable CSS transitions. This will make the final "snap" to the
        // target state smooth and animated.
        bottomPanelElement.style.transition = 'transform 0.3s ease-out';

        // Calculate the pixel threshold for snapping.
        // A swipe must exceed this distance (or velocity) to trigger a state change.
        const swipeThresholdPixels = panelHeight * PAN_THRESHOLD_PERCENT;

        // Start with the panel's current known state.
        let newState = getCurrentPanelStateCallback();

        // Get the current visual offset of the panel as a percentage.
        // This helps determine which state the panel is currently "closest" to.
        const currentOffsetPercent = parseFloat(bottomPanelElement.style.transform.match(/translateY\(([-]?\d*\.?\d+)\%\)/)?.[1] || STATE_TRANSFORM_PERCENTAGES[newState]);

        // Define the midpoints (boundaries) between the states based on their percentages.
        // If the panel crosses these boundaries, it's more likely to snap to the next state.
        const maxToMidBoundary = (STATE_TRANSFORM_PERCENTAGES.max + STATE_TRANSFORM_PERCENTAGES.mid) / 2;
        const midToClosedBoundary = (STATE_TRANSFORM_PERCENTAGES.mid + STATE_TRANSFORM_PERCENTAGES.min) / 2;

        // --- Snapping Logic ---
        // This logic determines the final state based on swipe direction, velocity, and position.

        // Case 1: Swiped UP (negative velocity or deltaY)
        if (finalVelocityY < -0.3 || finalDeltaY < -swipeThresholdPixels) {
            // If currently visually above the mid-to-closed boundary, try to go to 'mid' or 'max'.
            if (currentOffsetPercent < midToClosedBoundary) {
                 newState = 'mid'; // Default to mid if not far enough for max
                 // If visually above the max-to-mid boundary, go to 'max'.
                 if (currentOffsetPercent < maxToMidBoundary) {
                    newState = 'max';
                 }
            }
        }
        // Case 2: Swiped DOWN (positive velocity or deltaY)
        else if (finalVelocityY > 0.3 || finalDeltaY > swipeThresholdPixels) {
            // If currently visually below the max-to-mid boundary, try to go to 'mid' or 'closed'.
            if (currentOffsetPercent > maxToMidBoundary) {
                newState = 'mid'; // Default to mid if not far enough for closed
                // If visually below the mid-to-closed boundary, go to 'closed'.
                if (currentOffsetPercent > midToClosedBoundary) {
                    newState = 'min';
                }
            }
        }
        // Case 3: No significant swipe (neither fast nor far enough)
        else {
            // Snap to the closest defined state based on current visual position.
            if (currentOffsetPercent <= maxToMidBoundary) {
                newState = 'max';
            } else if (currentOffsetPercent <= midToClosedBoundary) {
                newState = 'mid';
            } else {
                newState = 'min';
            }
        }

        // Call the callback function from ui.js to officially set the panel's state.
        // This will update ui.js's internal state variable and trigger the final CSS transition.
        setPanelStateCallback(newState);
    });
}