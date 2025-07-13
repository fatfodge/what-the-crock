import {initViewportResizeListener} from './resizeHandler.js';
import {initSwipeHandling} from './swipeHandler.js';

document.addEventListener('DOMContentLoaded', async () => {

    initViewportResizeListener(window);
    initSwipeHandling();

    console.log("Main app initialized.");
});

